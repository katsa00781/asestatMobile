/**
 * Egy játékos részletei: meccsenkénti bontás és a mentett szezonriportok.
 *
 * A szezonösszesítés (átlagok, dobás, TS%) **nem** külön lekérdezés: a
 * `usePlayerData` szűrőpáronkénti cache-éből jön, amit a játékoslista már
 * letöltött – a listáról ide lépve a fejléc azonnal kirajzolódik, ugyanaz a
 * megfontolás, mint a meccs részleteinél (D-046). Ha a játékos nincs a
 * kiválasztott szűrőben, `player` marad `null`.
 *
 * A meccsenkénti sorok a szezonspecifikus `player_game_stats_*` tábláról jönnek,
 * a meccs keretadatai (dátum, ellenfél, eredmény) beágyazott `games` sorból –
 * így a bontás nem függ attól, hogy a meccsek tab betöltött-e már. A beágyazott
 * sor egyben a szűrés helye is: `games.season_id` és `games.our_team_id`.
 *
 * Lapozás nincs: egy játékoshoz egy szezonban legfeljebb néhány tucat sor
 * tartozik, a PostgREST 1000-es limitje elérhetetlen.
 */
import { getSeasonStatsTable } from '@core/season-tables';

import { useCachedQuery } from '@/hooks/useCachedQuery';
import { useFilterData } from '@/hooks/useFilterData';
import { usePlayerData } from '@/hooks/usePlayerData';
import { createQueryCache, filterKey } from '@/lib/query-cache';
import { supabase } from '@/lib/supabase';
import { useFilterStore } from '@/store/filterStore';
import type { Team } from '@/types/filters';
import type { GameResult, HomeAway } from '@/types/games';
import type { PlayerGameRow, PlayerReport, PlayerReportType, SeasonPlayer } from '@/types/players';

interface PlayerDetailsPayload {
  /** Dátum szerint csökkenő sorrendben. */
  games: PlayerGameRow[];
  reports: PlayerReport[];
}

interface PlayerDetailsResult extends PlayerDetailsPayload {
  /** A játékos szezonösszesítése a listából, vagy `null`, ha nincs benne. */
  player: SeasonPlayer | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const EMPTY_PAYLOAD: PlayerDetailsPayload = { games: [], reports: [] };

const cache = createQueryCache<PlayerDetailsPayload>();

export function usePlayerDetails(playerId: string): PlayerDetailsResult {
  const {
    players,
    loading: playersLoading,
    error: playersError,
    reload: reloadPlayers,
  } = usePlayerData();
  const { selectedSeason, teams } = useFilterData();
  const teamId = useFilterStore((state) => state.selectedTeamId);

  const player = players.find((row) => row.id === playerId) ?? null;
  const seasonId = selectedSeason?.id ?? null;
  const seasonName = selectedSeason?.name ?? null;

  // Az ellenfélnevek rövid alakja a szűrő csapatlistájából jön, ezért arra is
  // várunk – ugyanúgy, ahogy a `useGameData` a fixture-ök neveire.
  const canFetch = player !== null && seasonId !== null && seasonName !== null && teamId !== null;

  const { data, loading, error, reload } = useCachedQuery({
    cache,
    key: canFetch && teams.length > 0 ? `${filterKey(seasonId, teamId)}:${playerId}` : null,
    // Csak `key !== null` esetén hívódik meg; a guard a típusszűkítésért van.
    fetcher: () =>
      canFetch
        ? fetchDetails(playerId, seasonId, seasonName, teamId, teams)
        : Promise.resolve(EMPTY_PAYLOAD),
    empty: EMPTY_PAYLOAD,
    errorLabel: 'A játékos adatainak betöltése sikertelen',
  });

  return {
    player,
    ...data,
    // A szezonösszesítés a listából jön: amíg az tölt, a részletek sem
    // indulhatnak el.
    loading: playersError === null && (playersLoading || (player !== null && loading)),
    error: playersError ?? error,
    reload: () => {
      reloadPlayers();
      reload();
    },
  };
}

async function fetchDetails(
  playerId: string,
  seasonId: string,
  seasonName: string,
  teamId: string,
  teams: Team[],
): Promise<PlayerDetailsPayload> {
  const statsTable = getSeasonStatsTable(seasonName);

  const [statsResult, reportsResult] = await Promise.all([
    supabase
      .from(statsTable)
      .select(
        'game_id, minutes, points, close_made, close_attempted, mid_made, mid_attempted, ' +
          'three_made, three_attempted, free_throw_made, free_throw_attempted, total_rebounds, ' +
          'assists, steals, blocks, turnovers, fouls_committed, valuation, ' +
          'games!inner(date, opponent, home_away, result, season_id, our_team_id)',
      )
      .eq('player_id', playerId)
      .eq('games.season_id', seasonId)
      .eq('games.our_team_id', teamId),
    // A tábla `team_id`-ja nullázható (a riport csapat nélkül is menthető),
    // ezért csak játékosra és szezonra szűrünk – a játékos maga szűkebb szűrő,
    // mint a csapat.
    supabase
      .from('player_text_reports')
      .select('id, report_type, narrative, generated_at')
      .eq('player_id', playerId)
      .eq('season_id', seasonId)
      .order('generated_at', { ascending: false }),
  ]);

  if (statsResult.error) throw new Error(statsResult.error.message);
  if (reportsResult.error) throw new Error(reportsResult.error.message);

  return {
    games: toGameRows(statsResult.data, shortNames(teams)),
    reports: toReports(reportsResult.data),
  };
}

/** Teljes csapatnév → rövid név, az ellenfél oszlop kiírásához. */
function shortNames(teams: Team[]): Map<string, string> {
  return new Map(teams.map((team) => [team.name, team.shortName]));
}

// --- Rendszerhatár: a Supabase válasza típusozatlan, itt validáljuk. ---

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function toGameRows(rows: unknown, short: Map<string, string>): PlayerGameRow[] {
  if (!Array.isArray(rows)) return [];

  return rows
    .flatMap((row: unknown) => {
      if (!isRecord(row) || typeof row.game_id !== 'string') return [];

      const game = toGameMeta(row.games);
      if (!game) return [];

      const minutes = toNumber(row.minutes);
      // Aki nem lépett pályára, annak csupa nulla sora lenne – a bontásban ez
      // csak zaj, ugyanaz a szabály, mint a box score-ban.
      if (minutes <= 0) return [];

      return [
        {
          gameId: row.game_id,
          date: game.date,
          opponent: short.get(game.opponent) ?? game.opponent,
          homeAway: game.homeAway,
          result: game.result,
          minutes,
          points: toNumber(row.points),
          twoMade: toNumber(row.close_made) + toNumber(row.mid_made),
          twoAttempted: toNumber(row.close_attempted) + toNumber(row.mid_attempted),
          threeMade: toNumber(row.three_made),
          threeAttempted: toNumber(row.three_attempted),
          freeThrowMade: toNumber(row.free_throw_made),
          freeThrowAttempted: toNumber(row.free_throw_attempted),
          rebounds: toNumber(row.total_rebounds),
          assists: toNumber(row.assists),
          steals: toNumber(row.steals),
          blocks: toNumber(row.blocks),
          turnovers: toNumber(row.turnovers),
          fouls: toNumber(row.fouls_committed),
          valuation: toNumber(row.valuation),
        },
      ];
    })
    // A rendezés kliensoldali: a beágyazott oszlop szerinti PostgREST rendezés
    // (`order=games(date).desc`) nem fér bele a supabase-js `order()` alakjába.
    .sort((a, b) => b.date.localeCompare(a.date));
}

interface GameMeta {
  date: string;
  opponent: string;
  homeAway: HomeAway;
  result: GameResult;
}

/** A beágyazott `games` sor a PostgREST-től objektumként és tömbként is jöhet. */
function toGameMeta(value: unknown): GameMeta | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!isRecord(row) || typeof row.date !== 'string') return null;

  return {
    date: row.date,
    opponent: typeof row.opponent === 'string' ? row.opponent : '—',
    homeAway: row.home_away === 'home' ? 'home' : 'away',
    result: row.result === 'win' ? 'win' : 'loss',
  };
}

function toReports(rows: unknown): PlayerReport[] {
  if (!Array.isArray(rows)) return [];

  return rows.flatMap((row: unknown) => {
    if (!isRecord(row) || typeof row.id !== 'string') return [];
    if (typeof row.narrative !== 'string' || row.narrative.trim() === '') return [];

    return [
      {
        id: row.id,
        type: toReportType(row.report_type),
        narrative: row.narrative.trim(),
        generatedAt: typeof row.generated_at === 'string' ? row.generated_at : '',
      },
    ];
  });
}

function toReportType(value: unknown): PlayerReportType {
  return value === 'manual' ? 'manual' : 'season';
}
