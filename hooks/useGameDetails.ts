/**
 * Egy lejátszott meccs részletei: box score, negyedenkénti bontás és a mentett
 * AI riportok.
 *
 * Maga a meccs sora (ellenfél, dátum, eredmény) **nem** külön lekérdezés: a
 * `useGameData` szűrőpáronkénti cache-éből jön, amit a meccslista már letöltött
 * – a listáról a részletekre lépés így hálózati kör nélkül rajzol fejlécet
 * (D-046). Ha a meccs nincs a kiválasztott szűrőben, `game` marad `null`.
 *
 * A három részlet-lekérdezés lapozás nélkül fut: egy meccshez legfeljebb néhány
 * tucat sor tartozik, a PostgREST 1000-es limitje elérhetetlen.
 */
import { parseGameClutch } from '@core/kosarstat-clutch-parse';
import type { KosarstatGameClutch } from '@core/kosarstat-clutch-parse';
import { getSeasonStatsTable } from '@core/season-tables';

import { useCachedQuery } from '@/hooks/useCachedQuery';
import { useFilterData } from '@/hooks/useFilterData';
import { useGameData } from '@/hooks/useGameData';
import { createQueryCache } from '@/lib/query-cache';
import { supabase } from '@/lib/supabase';
import type {
  FourFactorRow,
  GameReport,
  GameReportType,
  HomeAway,
  MomentumPoint,
  PlayerGameLine,
  QuarterScore,
  TeamGame,
} from '@/types/games';

interface GameDetailsPayload {
  boxScore: PlayerGameLine[];
  quarters: QuarterScore[];
  /** Negyedenkénti kumulatív pontkülönbség a momentum charthoz. */
  momentum: MomentumPoint[];
  /** A négy tényező a saját csapat és az ellenfél összevetésében, vagy üres. */
  fourFactors: FourFactorRow[];
  reports: GameReport[];
  /** A hajrá-bontás a kosarstat nyers tábláiból, vagy `null`, ha nincs. */
  clutch: KosarstatGameClutch | null;
}

interface GameDetailsResult extends GameDetailsPayload {
  /** A meccs sora a szűrő szerinti listából, vagy `null`, ha nincs benne. */
  game: TeamGame | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const EMPTY_PAYLOAD: GameDetailsPayload = {
  boxScore: [],
  quarters: [],
  momentum: [],
  fourFactors: [],
  reports: [],
  clutch: null,
};

const cache = createQueryCache<GameDetailsPayload>();

export function useGameDetails(gameId: string): GameDetailsResult {
  const { games, loading: gamesLoading, error: gamesError, reload: reloadGames } = useGameData();
  const { selectedSeason, selectedTeam } = useFilterData();

  const game = games.find((row) => row.id === gameId) ?? null;
  const seasonName = selectedSeason?.name ?? null;
  const seasonId = selectedSeason?.id ?? null;
  const teamName = selectedTeam?.name ?? null;

  const { data, loading, error, reload } = useCachedQuery({
    cache,
    // A meccs azonosítója önmagában egyedi; a szezon csak a statisztikatábla
    // nevéhez kell, ezért nem része a kulcsnak.
    key: game && seasonName && seasonId ? gameId : null,
    // Csak `key !== null` esetén hívódik meg; a guard a típusszűkítésért van.
    fetcher: () =>
      game && seasonName && seasonId
        ? fetchDetails(game, seasonName, seasonId, teamName)
        : Promise.resolve(EMPTY_PAYLOAD),
    empty: EMPTY_PAYLOAD,
    errorLabel: 'A meccs részleteinek betöltése sikertelen',
  });

  return {
    game,
    ...data,
    // A meccssor a listából jön: amíg az tölt, a részletek sem indulhatnak el.
    loading: gamesError === null && (gamesLoading || (game !== null && loading)),
    error: gamesError ?? error,
    reload: () => {
      reloadGames();
      reload();
    },
  };
}

async function fetchDetails(
  game: TeamGame,
  seasonName: string,
  seasonId: string,
  teamName: string | null,
): Promise<GameDetailsPayload> {
  const statsTable = getSeasonStatsTable(seasonName);

  const [statsResult, reportsResult, quarterData, clutch, fourFactors] = await Promise.all([
    supabase
      .from(statsTable)
      .select(
        'player_id, minutes, points, close_made, close_attempted, mid_made, mid_attempted, ' +
          'three_made, three_attempted, free_throw_made, free_throw_attempted, total_rebounds, ' +
          'assists, steals, blocks, turnovers, fouls_committed, valuation, ' +
          'players!inner(name, number)',
      )
      .eq('game_id', game.id)
      .order('points', { ascending: false }),
    supabase
      .from('game_text_reports')
      .select('id, report_type, narrative, generated_at')
      .eq('game_id', game.id)
      .order('generated_at', { ascending: false }),
    fetchQuarters(game, seasonId),
    fetchClutch(game, seasonId, teamName),
    fetchFourFactors(game, seasonId),
  ]);

  if (statsResult.error) throw new Error(statsResult.error.message);
  if (reportsResult.error) throw new Error(reportsResult.error.message);

  return {
    boxScore: toBoxScore(statsResult.data),
    quarters: quarterData.quarters,
    momentum: quarterData.momentum,
    fourFactors,
    reports: toReports(reportsResult.data),
    clutch,
  };
}

/**
 * A négy tényező (eFG%, labdaeladás %, támadólepattanó %, büntetőráta) a
 * kosarstat `kosarstat_game_team_metrics` sorából – csapatoldalanként egy sor.
 * Ha a meccshez nincs kosarstat-azonosító vagy metrikasor, üres tömb: a chart
 * helyett magyarázó sor jelenik meg (D-047 mintája).
 */
async function fetchFourFactors(game: TeamGame, seasonId: string): Promise<FourFactorRow[]> {
  if (!game.kosarstatGameId) return [];

  const { data, error } = await supabase
    .from('kosarstat_game_team_metrics')
    .select('team_side, efg, tov_pct, orb_pct, ftm_rate')
    .eq('kosarstat_game_id', game.kosarstatGameId)
    .eq('season_id', seasonId);

  if (error) throw new Error(error.message);
  return toFourFactors(data, game.homeAway);
}

/**
 * A hajrá-bontás a kosarstat `game_clutch` oldalának **nyers HTML-tábláiból**
 * áll össze, két lekérdezéssel: előbb a nyers oldal(ak) sora, majd a hozzájuk
 * tartozó táblák. A meccsek nagy részéhez nincs ilyen oldal – ilyenkor `null`.
 * Egy meccshez maximum néhány oldal és ~10 tábla tartozik, lapozás nélkül.
 */
async function fetchClutch(
  game: TeamGame,
  seasonId: string,
  teamName: string | null,
): Promise<KosarstatGameClutch | null> {
  if (!game.kosarstatGameId) return null;

  const { data: rawRows, error: rawError } = await supabase
    .from('kosarstat_game_pages_raw')
    .select('id, home_team_name, away_team_name')
    .eq('kosarstat_game_id', game.kosarstatGameId)
    .eq('season_id', seasonId)
    .eq('page_type', 'game_clutch')
    .order('imported_at', { ascending: false })
    .limit(3);

  if (rawError) throw new Error(rawError.message);

  const raws = toRawRows(rawRows);
  if (raws.length === 0) return null;

  const { data: tableRows, error: tablesError } = await supabase
    .from('kosarstat_game_page_tables')
    .select('page_raw_id, table_index, headers, rows, source_table_dom_id')
    .in(
      'page_raw_id',
      raws.map((raw) => raw.id),
    )
    .order('table_index', { ascending: true });

  if (tablesError) throw new Error(tablesError.message);

  const tablesByRaw = groupTablesByRaw(tableRows);

  // A legfrissebb import az első; az első értelmezhető oldal nyer.
  for (const raw of raws) {
    const tables = tablesByRaw.get(raw.id);
    if (!tables || tables.length === 0) continue;

    const parsed = parseGameClutch(
      tables,
      { homeTeamName: raw.homeTeamName, awayTeamName: raw.awayTeamName },
      game.homeAway,
      teamName ?? undefined,
    );
    if (parsed) return parsed;
  }

  return null;
}

/**
 * A negyedenkénti bontás a kosarstat importból származik, és külön kulcson
 * (`kosarstat_game_id`) ül – a meccsek nagy részéhez nincs ilyen sor. Ugyanez
 * a sorhalmaz adja a momentum chart kumulatív pontkülönbségét is.
 */
async function fetchQuarters(
  game: TeamGame,
  seasonId: string,
): Promise<{ quarters: QuarterScore[]; momentum: MomentumPoint[] }> {
  if (!game.kosarstatGameId) return { quarters: [], momentum: [] };

  const { data, error } = await supabase
    .from('kosarstat_game_quarter_stats')
    .select('team_side, quarter, points, cumulative_points')
    .eq('kosarstat_game_id', game.kosarstatGameId)
    .eq('season_id', seasonId)
    .order('quarter', { ascending: true });

  if (error) throw new Error(error.message);
  return { quarters: toQuarters(data, game.homeAway), momentum: toMomentum(data, game.homeAway) };
}

// --- Rendszerhatár: a Supabase válasza típusozatlan, itt validáljuk. ---

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

interface ClutchRawRow {
  id: string;
  homeTeamName: string | null;
  awayTeamName: string | null;
}

function toRawRows(rows: unknown): ClutchRawRow[] {
  if (!Array.isArray(rows)) return [];

  return rows.flatMap((row: unknown) => {
    if (!isRecord(row) || typeof row.id !== 'string') return [];
    return [
      {
        id: row.id,
        homeTeamName: typeof row.home_team_name === 'string' ? row.home_team_name : null,
        awayTeamName: typeof row.away_team_name === 'string' ? row.away_team_name : null,
      },
    ];
  });
}

/** A `@core/parseGameClutch` bemeneti alakja: táblák `page_raw_id` szerint csoportosítva. */
interface ClutchTable {
  headers: string[];
  rows: unknown[][];
  sourceTableDomId: string | null;
}

function groupTablesByRaw(rows: unknown): Map<string, ClutchTable[]> {
  const grouped = new Map<string, ClutchTable[]>();
  if (!Array.isArray(rows)) return grouped;

  rows.forEach((row: unknown) => {
    if (!isRecord(row) || typeof row.page_raw_id !== 'string') return;

    const table: ClutchTable = {
      headers: Array.isArray(row.headers) ? row.headers.map((cell) => String(cell ?? '').trim()) : [],
      rows: Array.isArray(row.rows) ? row.rows.filter((cells): cells is unknown[] => Array.isArray(cells)) : [],
      sourceTableDomId:
        typeof row.source_table_dom_id === 'string' ? row.source_table_dom_id : null,
    };

    const bucket = grouped.get(row.page_raw_id);
    if (bucket) bucket.push(table);
    else grouped.set(row.page_raw_id, [table]);
  });

  return grouped;
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function toBoxScore(rows: unknown): PlayerGameLine[] {
  if (!Array.isArray(rows)) return [];

  return rows.flatMap((row: unknown) => {
    if (!isRecord(row) || typeof row.player_id !== 'string') return [];

    const player = toPlayer(row.players);
    if (!player) return [];

    const minutes = toNumber(row.minutes);
    // Aki nem lépett pályára, annak csupa nulla sora lenne – a box score-ban
    // ez csak zaj.
    if (minutes <= 0) return [];

    return [
      {
        playerId: row.player_id,
        name: player.name,
        number: player.number,
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
  });
}

/** A beágyazott `players` sor a PostgREST-től objektumként és tömbként is jöhet. */
function toPlayer(value: unknown): { name: string; number: number } | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!isRecord(row) || typeof row.name !== 'string') return null;
  return { name: row.name, number: toNumber(row.number) };
}

function toQuarters(rows: unknown, homeAway: HomeAway): QuarterScore[] {
  if (!Array.isArray(rows)) return [];

  const ourPoints = new Map<number, number>();
  const oppPoints = new Map<number, number>();

  rows.forEach((row: unknown) => {
    if (!isRecord(row)) return;
    const quarter = toNumber(row.quarter);
    if (quarter <= 0) return;

    // A `team_side` az importban `home` / `away` / `unknown`; az utóbbit nem
    // tudjuk egyik csapathoz sem kötni, ezért kimarad.
    if (row.team_side === homeAway) ourPoints.set(quarter, toNumber(row.points));
    else if (row.team_side === 'home' || row.team_side === 'away') {
      oppPoints.set(quarter, toNumber(row.points));
    }
  });

  // Mindkét oldal hiánya esetén nincs mit mutatni – fél táblát ne rajzoljunk.
  if (ourPoints.size === 0 || oppPoints.size === 0) return [];

  const quarters = [...new Set([...ourPoints.keys(), ...oppPoints.keys()])].sort((a, b) => a - b);

  return quarters.map((quarter) => ({
    quarter,
    ourPoints: ourPoints.get(quarter) ?? 0,
    oppPoints: oppPoints.get(quarter) ?? 0,
  }));
}

/**
 * Kumulatív pontkülönbség negyedenként, a saját csapat szemszögéből. A
 * `cumulative_points` a kosarstat oszlopa; ha bármelyik oldalon hiányzik,
 * momentum chart sincs (üres tömb → magyarázó sor a képernyőn).
 */
function toMomentum(rows: unknown, homeAway: HomeAway): MomentumPoint[] {
  if (!Array.isArray(rows)) return [];

  const ourCumulative = new Map<number, number>();
  const oppCumulative = new Map<number, number>();

  rows.forEach((row: unknown) => {
    if (!isRecord(row)) return;
    const quarter = toNumber(row.quarter);
    if (quarter <= 0) return;
    if (typeof row.cumulative_points !== 'number' || !Number.isFinite(row.cumulative_points)) return;

    if (row.team_side === homeAway) ourCumulative.set(quarter, row.cumulative_points);
    else if (row.team_side === 'home' || row.team_side === 'away') {
      oppCumulative.set(quarter, row.cumulative_points);
    }
  });

  if (ourCumulative.size === 0 || oppCumulative.size === 0) return [];

  const quarters = [...new Set([...ourCumulative.keys(), ...oppCumulative.keys()])].sort(
    (a, b) => a - b,
  );

  return quarters
    .filter((quarter) => ourCumulative.has(quarter) && oppCumulative.has(quarter))
    .map((quarter) => ({
      quarter,
      diff: (ourCumulative.get(quarter) ?? 0) - (oppCumulative.get(quarter) ?? 0),
    }));
}

/**
 * A két csapatoldali metrikasorból építi a négy szembeállított tényezőt. A
 * büntetőráta 0–1 skálán érkezik, ezért ×100-zal százalékponttá alakul, hogy a
 * chart közös Y tengelyén a másik hárommal összemérhető legyen (D-096). Ha
 * bármelyik oldal sora hiányzik, üres tömb.
 */
function toFourFactors(rows: unknown, homeAway: HomeAway): FourFactorRow[] {
  if (!Array.isArray(rows)) return [];

  const list = rows.filter(isRecord);
  const our = list.find((row) => row.team_side === homeAway) ?? null;
  const opp =
    list.find(
      (row) => row !== our && (row.team_side === 'home' || row.team_side === 'away'),
    ) ?? null;

  if (!our || !opp) return [];

  return [
    toFactorRow('efg', 'eFG%', our, opp, 'efg', 1, false),
    toFactorRow('tov', 'TOV%', our, opp, 'tov_pct', 1, true),
    toFactorRow('orb', 'ORB%', our, opp, 'orb_pct', 1, false),
    toFactorRow('ft', 'FT%', our, opp, 'ftm_rate', 100, false),
  ];
}

function toFactorRow(
  key: FourFactorRow['key'],
  label: string,
  our: Record<string, unknown>,
  opp: Record<string, unknown>,
  column: string,
  factor: number,
  lowerIsBetter: boolean,
): FourFactorRow {
  return {
    key,
    label,
    our: toNumber(our[column]) * factor,
    opp: toNumber(opp[column]) * factor,
    lowerIsBetter,
  };
}

function toReports(rows: unknown): GameReport[] {
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

function toReportType(value: unknown): GameReportType {
  if (value === 'pregame' || value === 'postgame' || value === 'manual') return value;
  return 'combined';
}
