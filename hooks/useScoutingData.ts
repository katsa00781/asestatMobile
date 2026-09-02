/**
 * Az Ellenfél scouting képernyő adata: liga-szintű csapatmezőny + a két
 * szembeállított keret.
 *
 * A számítást a `@core/pregame-scouting` `analyzePreGameScouting`-ja végzi,
 * ugyanazokkal a bemenetekkel, mint a webes `SeasonComparison` pregame
 * szekciója: ellenfél és saját csapat szezonösszegzése, a két keret
 * játékossorai, és a **liga összes csapatából** épített percentilis-mezőny
 * (`buildTeamBenchmarks`). Benchmark nélkül a modell nem tud stílust,
 * veszélyforrást és esélyt mondani, ezért ez az egyetlen képernyő, ahol a
 * lekérdezés nem szűkül egy csapatra (D-077).
 *
 * Három lekérdezés fut, mind a kiválasztott szezonra:
 *
 * 1. `games` – csapatonként meccsszám, mérleg, szerzett és kapott pont.
 * 2. A szezon `player_game_stats` táblája – **csapatösszegzéshez**. A
 *    szezonösszesítő view itt nem használható: abból hiányoznak a szezon
 *    közben távozott játékosok sorai, így a csapatösszegek 0–40%-kal
 *    alulmérnek (D-078).
 * 3. `player_season_stats_by_season` – a **keretek** játékossorai. Itt
 *    viszont pont jó a view: a scouting az aktuális keretre kérdez, és csak
 *    innen jön a pozíció és a testmagasság.
 *
 * Az adat szezononként cache-elődik – az ellenfél váltása nem indít új
 * lekérdezést, csak újraszámol.
 */
import { useCallback, useMemo } from 'react';

import { fetchAllRows } from '@core/fetch-all-rows';
import { buildPositionMetadata } from '@core/positions';
import {
  analyzePreGameScouting,
  buildTeamBenchmarks,
  type PlayerSeasonStat,
  type TeamSeasonStat,
} from '@core/pregame-scouting';
import { SEASON_STATS_TABLES } from '@core/season-tables';

import { useCachedQuery } from '@/hooks/useCachedQuery';
import { useFilterData } from '@/hooks/useFilterData';
import { useGameData } from '@/hooks/useGameData';
import { formatDate } from '@/lib/format';
import { createQueryCache } from '@/lib/query-cache';
import { normalizeText } from '@/lib/search';
import { buildScoutingView, EMPTY_RECORD, type TeamRecord } from '@/lib/scouting-view';
import { supabase } from '@/lib/supabase';
import { useFilterStore } from '@/store/filterStore';
import type { Team } from '@/types/filters';
import type { OpponentMeta, OpponentOption, ScoutingView } from '@/types/scouting';

/**
 * A benchmark-mezőny kulcsa a `@core`-ban liga + szezon. Az adatbázis nem tárol
 * ligát, a mezőny viszont egyetlen bajnokság – ezért egy állandó kulcs elég.
 */
const LEAGUE = 'NB I/A';

interface ScoutingPayload {
  /** A liga csapatai szezonösszegzéssel – ebből épül a percentilis-mezőny. */
  teams: TeamSeasonStat[];
  /** Csapatonkénti mérleg és pontösszeg. */
  records: Map<string, TeamRecord>;
  /** Csapatonkénti keret – a `player_season_stats_by_season` soraiból. */
  rosters: Map<string, PlayerSeasonStat[]>;
}

interface ScoutingResult {
  view: ScoutingView | null;
  /** A választható ellenfelek, névsorban. */
  opponents: OpponentOption[];
  /** Az éppen elemzett ellenfél, ha van. */
  selected: OpponentOption | null;
  meta: OpponentMeta | null;
  /** Van-e egyáltalán elemezhető szezonadat. */
  hasData: boolean;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const EMPTY_PAYLOAD: ScoutingPayload = {
  teams: [],
  records: new Map(),
  rosters: new Map(),
};

const cache = createQueryCache<ScoutingPayload>();

export function useScoutingData(opponentId: string | null): ScoutingResult {
  const hydrated = useFilterStore((state) => state.hydrated);
  const seasonId = useFilterStore((state) => state.selectedSeasonId);
  const teamId = useFilterStore((state) => state.selectedTeamId);

  // A szezon **neve** kell a szezonspecifikus stat-táblához, a csapatnevek
  // pedig a megjelenítéshez – ezért a szűrő listájára is várunk.
  const { teams, selectedSeason, error: filterError, reload: reloadFilter } = useFilterData();
  const seasonName = selectedSeason?.name ?? null;

  // A következő ellenfél a menetrendből, a legutóbbi a lejátszott meccsekből
  // jön – mindkettő a `useGameData` cache-éből, új hálózati kérés nélkül.
  const { nextFixture, lastGame, reload: reloadGames } = useGameData();

  const context =
    hydrated && seasonId && teamId && seasonName && teams.length > 0
      ? { seasonId, seasonName, teamId }
      : null;

  const { data, loading, error, reload: reloadScouting } = useCachedQuery({
    cache,
    // A mezőny liga-szintű: a kulcs csak a szezon, a csapatváltás nem tölt újra.
    key: context ? context.seasonId : null,
    // Csak `key !== null` esetén hívódik meg; a guard a típusszűkítésért van.
    fetcher: () =>
      context
        ? fetchScouting(context.seasonId, context.seasonName, teams)
        : Promise.resolve(EMPTY_PAYLOAD),
    empty: EMPTY_PAYLOAD,
    errorLabel: 'Az ellenfél-elemzés betöltése sikertelen',
  });

  const opponents = useMemo(() => buildOpponents(data, teamId), [data, teamId]);

  // Az alapértelmezett ellenfél: a következő találkozó, egyébként a legutóbbi
  // meccs ellenfele. Mindkettő csak akkor jó, ha van hozzá szezonadat.
  const fallback = useMemo(() => {
    const known = new Set(opponents.map((option) => option.id));

    if (nextFixture && known.has(nextFixture.opponentId)) {
      return {
        id: nextFixture.opponentId,
        meta: {
          source: 'next' as const,
          label: 'Következő ellenfél',
          detail: `${formatDate(nextFixture.gameDate)} · ${side(nextFixture.isHome)}`,
        },
      };
    }

    const lastId = lastGame ? findTeamId(lastGame.opponent, teams) : null;
    if (lastGame && lastId && known.has(lastId)) {
      return {
        id: lastId,
        meta: {
          source: 'last' as const,
          label: 'Legutóbbi ellenfél',
          detail: `${formatDate(lastGame.date)} · ${side(lastGame.homeAway === 'home')}`,
        },
      };
    }

    return opponents.length > 0
      ? { id: opponents[0].id, meta: { source: 'pick' as const, label: 'Ellenfél', detail: null } }
      : null;
  }, [lastGame, nextFixture, opponents, teams]);

  // A kézzel választott ellenfél felülírja az alapértelmezést, de a szezon
  // váltása után csak akkor, ha az új szezonban is van adata.
  const picked = opponentId && opponents.some((option) => option.id === opponentId)
    ? opponentId
    : null;
  const activeId = picked ?? fallback?.id ?? null;

  const meta: OpponentMeta | null = picked
    ? picked === fallback?.id
      ? fallback.meta
      : { source: 'pick', label: 'Választott ellenfél', detail: null }
    : (fallback?.meta ?? null);

  const view = useMemo(() => {
    if (!teamId || !activeId) return null;
    return buildView(data, teamId, activeId);
  }, [activeId, data, teamId]);

  const reload = useCallback(() => {
    reloadFilter();
    reloadGames();
    reloadScouting();
  }, [reloadFilter, reloadGames, reloadScouting]);

  return {
    view,
    opponents,
    selected: opponents.find((option) => option.id === activeId) ?? null,
    meta,
    hasData: data.teams.length > 0,
    // Ha a szűrő listája elhasalt, nincs mire várni – különben a képernyő
    // örökre töltésben ragadna egy olyan kérésre, ami el sem indul.
    loading: filterError === null && loading,
    error: filterError ?? error,
    reload,
  };
}

/** Pálya a sáv meta sorába. */
function side(isHome: boolean): string {
  return isHome ? 'hazai' : 'idegenben';
}

/** A saját csapaton kívüli, szezonadattal rendelkező csapatok névsorban. */
function buildOpponents(payload: ScoutingPayload, teamId: string | null): OpponentOption[] {
  return payload.teams
    .filter((team) => team.teamId !== teamId && team.games > 0)
    .map((team) => ({
      id: team.teamId,
      name: team.teamName,
      gamesText: `${team.games} meccs`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'hu'));
}

function buildView(
  payload: ScoutingPayload,
  teamId: string,
  opponentId: string,
): ScoutingView | null {
  const own = payload.teams.find((team) => team.teamId === teamId);
  const opponent = payload.teams.find((team) => team.teamId === opponentId);
  if (!own || !opponent) return null;

  const opponentPlayers = payload.rosters.get(opponentId) ?? [];
  // Keret nélkül a modell kulcsembert és poszt-összehasonlítást sem tud adni;
  // ilyenkor inkább üres állapot áll a képernyőn, mint egy féllábú riport.
  if (opponentPlayers.length === 0) return null;

  const report = analyzePreGameScouting(
    opponent,
    opponentPlayers,
    own,
    buildTeamBenchmarks(payload.teams),
    payload.rosters.get(teamId) ?? [],
  );

  return buildScoutingView(
    report,
    payload.records.get(teamId) ?? EMPTY_RECORD,
    payload.records.get(opponentId) ?? EMPTY_RECORD,
  );
}

/** A `games.opponent` szöveges nevét kötjük csapat-azonosítóhoz. */
function findTeamId(opponentName: string, teams: Team[]): string | null {
  const needle = normalizeText(opponentName);
  const match = teams.find(
    (team) => normalizeText(team.name) === needle || normalizeText(team.shortName) === needle,
  );

  return match?.id ?? null;
}

async function fetchScouting(
  seasonId: string,
  seasonName: string,
  teams: Team[],
): Promise<ScoutingPayload> {
  // A szezonspecifikus stat-tábla nevét itt nem a `getSeasonStatsTable`
  // adja: annak UNION view tartaléka minden szezon sorát hozná, és a `games`
  // kapcsolat sincs ráhúzva. Ismeretlen szezonhoz nincs adat – üres állapot.
  const statsTable = SEASON_STATS_TABLES[seasonName];
  if (!statsTable) return EMPTY_PAYLOAD;

  const [gameRows, statRows, playerRows] = await Promise.all([
    fetchAllRows<unknown>((from, to) =>
      supabase
        .from('games')
        .select('id, our_team_id, our_score, opp_score, result')
        .eq('season_id', seasonId)
        .range(from, to),
    ),
    fetchAllRows<unknown>((from, to) =>
      supabase
        .from(statsTable)
        .select(
          'game_id, close_made, close_attempted, mid_made, mid_attempted, three_made, ' +
            'three_attempted, free_throw_made, free_throw_attempted, offensive_rebounds, ' +
            'defensive_rebounds, assists, turnovers, steals, blocks, fouls_committed, ' +
            'valuation, games!inner()',
        )
        // A tábla neve szezononkénti, a szűrő mégis kell: a jövőbeli
        // szezonokhoz tartozó sorok is ide kerülnek, ha egyszer átfednek.
        .eq('games.season_id', seasonId)
        .range(from, to),
    ),
    fetchAllRows<unknown>((from, to) =>
      supabase
        .from('player_season_stats_by_season')
        .select('*')
        .eq('season_id', seasonId)
        .range(from, to),
    ),
  ]);

  const { records, teamOfGame } = buildRecords(gameRows);
  const totals = buildTeamTotals(statRows, teamOfGame);

  return {
    teams: buildTeams(records, totals, teams, seasonName),
    records,
    rosters: buildRosters(playerRows),
  };
}

/** Csapatonkénti mérleg és pontösszeg, plusz a meccs → csapat hozzárendelés. */
function buildRecords(rows: unknown[]): {
  records: Map<string, TeamRecord>;
  teamOfGame: Map<string, string>;
} {
  const records = new Map<string, TeamRecord>();
  const teamOfGame = new Map<string, string>();

  for (const row of rows) {
    if (!isRecord(row)) continue;
    const { id, our_team_id: ourTeamId } = row;
    if (typeof id !== 'string' || typeof ourTeamId !== 'string') continue;

    teamOfGame.set(id, ourTeamId);

    const entry = records.get(ourTeamId) ?? { ...EMPTY_RECORD };
    entry.games += 1;
    if (row.result === 'win') entry.wins += 1;
    else entry.losses += 1;
    entry.pointsFor += toNumber(row.our_score);
    entry.pointsAgainst += toNumber(row.opp_score);
    records.set(ourTeamId, entry);
  }

  return { records, teamOfGame };
}

/** A `TeamSeasonStat` volumenmezői – a játékossorokból meccsenként összeadva. */
interface TeamTotals {
  fga2: number;
  fgm2: number;
  fga3: number;
  fgm3: number;
  fta: number;
  ftm: number;
  oreb: number;
  dreb: number;
  ast: number;
  tov: number;
  stl: number;
  blk: number;
  fouls: number;
  val: number;
}

function emptyTotals(): TeamTotals {
  return {
    fga2: 0,
    fgm2: 0,
    fga3: 0,
    fgm3: 0,
    fta: 0,
    ftm: 0,
    oreb: 0,
    dreb: 0,
    ast: 0,
    tov: 0,
    stl: 0,
    blk: 0,
    fouls: 0,
    val: 0,
  };
}

function buildTeamTotals(
  rows: unknown[],
  teamOfGame: Map<string, string>,
): Map<string, TeamTotals> {
  const totals = new Map<string, TeamTotals>();

  for (const row of rows) {
    if (!isRecord(row)) continue;
    const gameId = row.game_id;
    if (typeof gameId !== 'string') continue;

    const teamId = teamOfGame.get(gameId);
    if (!teamId) continue;

    const entry = totals.get(teamId) ?? emptyTotals();
    entry.fga2 += toNumber(row.close_attempted) + toNumber(row.mid_attempted);
    entry.fgm2 += toNumber(row.close_made) + toNumber(row.mid_made);
    entry.fga3 += toNumber(row.three_attempted);
    entry.fgm3 += toNumber(row.three_made);
    entry.fta += toNumber(row.free_throw_attempted);
    entry.ftm += toNumber(row.free_throw_made);
    entry.oreb += toNumber(row.offensive_rebounds);
    entry.dreb += toNumber(row.defensive_rebounds);
    entry.ast += toNumber(row.assists);
    entry.tov += toNumber(row.turnovers);
    entry.stl += toNumber(row.steals);
    entry.blk += toNumber(row.blocks);
    entry.fouls += toNumber(row.fouls_committed);
    entry.val += toNumber(row.valuation);
    totals.set(teamId, entry);
  }

  return totals;
}

function buildTeams(
  records: Map<string, TeamRecord>,
  totals: Map<string, TeamTotals>,
  teams: Team[],
  seasonName: string,
): TeamSeasonStat[] {
  const names = new Map(teams.map((team) => [team.id, team.name]));

  return Array.from(records.entries()).map(([teamId, record]) => ({
    teamId,
    teamName: names.get(teamId) ?? 'Ismeretlen csapat',
    league: LEAGUE,
    season: seasonName,
    games: record.games,
    pointsFor: record.pointsFor,
    pointsAgainst: record.pointsAgainst,
    ...(totals.get(teamId) ?? emptyTotals()),
  }));
}

/** Csapatonkénti keret – aki egy meccsen sem lépett pályára, kimarad. */
function buildRosters(rows: unknown[]): Map<string, PlayerSeasonStat[]> {
  const rosters = new Map<string, PlayerSeasonStat[]>();

  for (const row of rows) {
    if (!isRecord(row)) continue;
    const { player_id: playerId, name, team_id: teamId } = row;
    if (typeof playerId !== 'string' || typeof name !== 'string') continue;
    if (typeof teamId !== 'string') continue;

    const games = toNumber(row.games_played);
    if (games <= 0) continue;

    const player: PlayerSeasonStat = {
      playerId,
      name,
      ...buildPositionMetadata(typeof row.position === 'string' ? row.position : null),
      heightCm: toNumber(row.height) || undefined,
      games,
      minutes: toNumber(row.total_minutes),
      points: toNumber(row.total_points),
      fga2: toNumber(row.total_close_attempted) + toNumber(row.total_mid_attempted),
      fgm2: toNumber(row.total_close_made) + toNumber(row.total_mid_made),
      fga3: toNumber(row.total_three_attempted),
      fgm3: toNumber(row.total_three_made),
      fta: toNumber(row.total_free_throw_attempted),
      ftm: toNumber(row.total_free_throw_made),
      oreb: toNumber(row.total_offensive_rebounds),
      dreb: toNumber(row.total_defensive_rebounds),
      ast: toNumber(row.total_assists),
      tov: toNumber(row.total_turnovers),
      stl: toNumber(row.total_steals),
      blk: toNumber(row.total_blocks),
      val: toNumber(row.total_valuation),
      // Szerepköröket a mobil app nem tölt: a `@core` csak a labdahordozó
      // felismeréséhez használná, ami a pozícióból is kijön.
      roles: [],
    };

    const roster = rosters.get(teamId);
    if (roster) roster.push(player);
    else rosters.set(teamId, [player]);
  }

  return rosters;
}

// --- Rendszerhatár: a Supabase válasza típusozatlan, itt validáljuk. ---

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
