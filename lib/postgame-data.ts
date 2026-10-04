/**
 * A post-game elemzés adatrétege: lekérdezések és a `@core` számítás.
 *
 * Tiszta modul – React nincs benne, csak Supabase-lekérdezés és a
 * `@core/postgame-report` hívása. Azért külön a hooktól, mert így a lánc
 * (lekérdezés → `analyzePostGameReport` → kosarstat-kiegészítés) hálózati
 * méréssel is végigfuttatható a képernyő elindítása nélkül, ahogy a
 * `lib/team-season-stats` (D-086).
 *
 * A bemenetek a webes `SeasonComparison` post-game nézetével azonosak (a
 * webprojekt `mobile-sync/2026-09-26-postgame-analysis-spec.md` 2. pontja).
 * A dobástérkép, a pontforrások és a mentett játékos-szöveg kiegészítő adat:
 * hibájuk nem teszi használhatatlanná az elemzést, ezért ott a hiba üres
 * eredménnyé válik.
 */
import { fetchAllRows } from '@core/fetch-all-rows';
import type { KosarstatGameClutch } from '@core/kosarstat-clutch-parse';
import { parseKosarstatPointSources } from '@core/kosarstat-pbp-parse';
import {
  analyzePostGameReport,
  buildKosarstatPostgameContext,
  buildTeamBenchmarks,
  mergeKosarstatPostgameContext,
  type KosarstatPointSourceTotals,
  type KosarstatQuarterStatRow,
  type KosarstatTeamMetricRow,
  type KosarstatTeamSide,
  type PlayerGameStat,
  type PostGameReport,
  type PostGameShotMapContext,
  type ShotMapEventInput,
  type TeamGameStat,
  type TeamSeasonStat as PostgameTeamSeasonStat,
} from '@core/postgame-report';
import type { PlayerSeasonStat } from '@core/pregame-scouting';
import { getSeasonStatsTable } from '@core/season-tables';
import type { TeamSeasonStat } from '@core/team-analysis';

import { createQueryCache, filterKey } from '@/lib/query-cache';
import { supabase } from '@/lib/supabase';
import type { GameReport, TeamGame } from '@/types/games';

/** A benchmark kulcsa – ugyanaz, mint a `lib/team-season-stats` mezőnyéé. */
const LEAGUE = 'NB I/A';

/** Egy meccs box score-jának nyers sora, a `PlayerGameStat` előtt. */
interface RawPlayerLine {
  playerId: string;
  name: string;
  isStarter: boolean | undefined;
  minutes: number;
  points: number;
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
  val: number;
}

export interface PostgamePayload {
  ownLines: RawPlayerLine[];
  /** Az ellenfél box score-ja, ha a saját perspektívájú meccssora megvan. */
  opponentLines: RawPlayerLine[] | null;
  quarterStats: KosarstatQuarterStatRow[];
  teamMetrics: KosarstatTeamMetricRow[];
  /** Pontforrások a kosarstat eseménylistájából, hazai / vendég oldalra bontva. */
  pointSources: KosarstatPointSourceTotals | null;
  shotContext: PostGameShotMapContext | undefined;
  /** Játékos-azonosító → mentett LLM-értékelés. */
  playerReports: Map<string, GameReport>;
}

export const EMPTY_POSTGAME: PostgamePayload = {
  ownLines: [],
  opponentLines: null,
  quarterStats: [],
  teamMetrics: [],
  pointSources: null,
  shotContext: undefined,
  playerReports: new Map(),
};

/** A csapat szezonos dobásai – szűrőpáronként egyszer, nem meccsenként. */
const seasonShotsCache = createQueryCache<ShotMapEventInput[]>();

// --- Számítás ---

export interface ReportInput {
  game: TeamGame;
  seasonName: string;
  teamId: string;
  teamName: string;
  payload: PostgamePayload;
  /** A `@core/team-analysis` bővebb alakja – a postgame változattal kompatibilis. */
  leagueTeams: TeamSeasonStat[];
  rosters: Map<string, PlayerSeasonStat[]>;
  clutch: KosarstatGameClutch | null;
}

export function buildPostgameReport(input: ReportInput): PostGameReport | null {
  const { game, seasonName, teamId, teamName, payload } = input;
  const leagueTeams = input.leagueTeams.map(withOpponentTotals);

  // A `teamSeason` ugyanabból a tömbből jön, amiből a benchmark épül – így a
  // liga + szezon kulcs biztosan egyezik (a spec 2.1 invariánsa).
  const teamSeason = leagueTeams.find((team) => team.teamId === teamId);
  if (!teamSeason) return null;
  if (teamSeason.fga2 + teamSeason.fga3 + teamSeason.fta + teamSeason.tov === 0) return null;

  const roster = new Map((input.rosters.get(teamId) ?? []).map((player) => [player.playerId, player]));
  const players: PlayerGameStat[] = payload.ownLines.map((line) => {
    const rosterEntry = roster.get(line.playerId);
    return {
      ...line,
      name: rosterEntry?.name ?? line.name,
      position: rosterEntry?.position ?? 'PG',
      isStarter: line.isStarter,
      roles: rosterEntry?.roles ?? [],
    };
  });

  const teamGame = sumTeamGame(payload.ownLines, teamId, teamName, seasonName);
  const opponentGame = payload.opponentLines
    ? sumTeamGame(payload.opponentLines, game.opponentTeamId ?? 'opponent', game.opponent, seasonName)
    : null;

  // A hivatalos eredmény számít, nem a box score összege – a `@core` ezzel kalibrál.
  teamGame.pointsAgainst = opponentGame ? opponentGame.pointsFor : game.oppScore;
  teamGame.actualPointsFor = game.ourScore;
  teamGame.actualPointsAgainst = game.oppScore;
  teamGame.result = game.result;
  if (opponentGame) {
    opponentGame.pointsAgainst = teamGame.pointsFor;
    opponentGame.actualPointsFor = game.oppScore;
    opponentGame.actualPointsAgainst = game.ourScore;
    opponentGame.result = game.result === 'win' ? 'loss' : 'win';
  }

  const baseReport = analyzePostGameReport(
    teamGame,
    opponentGame,
    teamSeason,
    buildTeamBenchmarks(leagueTeams),
    players,
    // A pregame visszatükrözés (X-faktor) a v1-ben kimarad – a spec 2.6 pontja.
    undefined,
    payload.shotContext,
  );

  const kosarstat = game.kosarstatGameId
    ? buildKosarstatPostgameContext({
        ownSide: game.homeAway,
        teamName,
        quarterStats: payload.quarterStats,
        teamMetrics: payload.teamMetrics,
        clutch: input.clutch,
        // A web is üresen adja; az import-állapot üzenetek fogyasztói nézetben
        // nem kellenek (a kosarstat-core jegyzet javaslata).
        turnoverTypes: [],
        clutchImportNote: null,
        // A `@core` rendezi saját / ellenfél oldalra, és csak akkor írja a
        // riportba, ha az események pontösszege egyezik a végeredménnyel.
        pointSources: payload.pointSources,
      })
    : buildKosarstatPostgameContext(null);

  return mergeKosarstatPostgameContext(baseReport, kosarstat);
}

/**
 * Az ellenfelek szezonos V-lepje és birtoklásbecslése a `@core` bemenetében
 * (web H12, `SeasonComparison` `postgameOpponentTotalsByTeam`). Ezekkel a
 * referencia OREB%-a és a közös birtoklásszám ugyanazzal a definícióval
 * számol, mint a meccsérték. A mezőny **minden** csapata megkapja, különben a
 * liga medián vegyes definícióból állna össze. Az `opponent` blokk csak a
 * párosított meccsekből összegez (`lib/team-season-stats`), ahogy a web is
 * csak a kétcsapatos meccseket veszi.
 */
function withOpponentTotals(team: TeamSeasonStat): PostgameTeamSeasonStat {
  const o = team.opponent;
  const oppPossessions = o.fga2 + o.fga3 + 0.44 * o.fta + o.tov - o.oreb;
  return {
    ...team,
    oppDreb: o.dreb > 0 ? o.dreb : undefined,
    oppPossessions: oppPossessions > 0 ? oppPossessions : undefined,
  };
}

/** A box score sorainak összege a `TeamGameStat` alakjában (webes `buildTeamGame`). */
function sumTeamGame(
  lines: RawPlayerLine[],
  teamId: string,
  teamName: string,
  seasonName: string,
): TeamGameStat {
  const sum = (pick: (line: RawPlayerLine) => number) =>
    lines.reduce((total, line) => total + pick(line), 0);

  return {
    teamId,
    teamName,
    league: LEAGUE,
    season: seasonName,
    pointsFor: sum((line) => line.points),
    pointsAgainst: 0,
    fga2: sum((line) => line.fga2),
    fgm2: sum((line) => line.fgm2),
    fga3: sum((line) => line.fga3),
    fgm3: sum((line) => line.fgm3),
    fta: sum((line) => line.fta),
    ftm: sum((line) => line.ftm),
    oreb: sum((line) => line.oreb),
    dreb: sum((line) => line.dreb),
    ast: sum((line) => line.ast),
    tov: sum((line) => line.tov),
    stl: sum((line) => line.stl),
    blk: sum((line) => line.blk),
    // A web itt szándékosan 0-t ad: a fault nem része a számításnak.
    fouls: 0,
    val: sum((line) => line.val),
  };
}

// --- Lekérdezések ---

const LINE_COLUMNS =
  'player_id, is_starter, minutes, points, close_made, close_attempted, mid_made, ' +
  'mid_attempted, three_made, three_attempted, free_throw_made, free_throw_attempted, ' +
  'offensive_rebounds, defensive_rebounds, assists, turnovers, steals, blocks, valuation, ' +
  'players(name)';

export async function fetchPostgame(
  game: TeamGame,
  seasonId: string,
  seasonName: string,
  teamId: string,
): Promise<PostgamePayload> {
  const statsTable = getSeasonStatsTable(seasonName);

  const [ownResult, opponentLines, kosarstat, pointSources, shotContext, playerReports] = await Promise.all([
    supabase.from(statsTable).select(LINE_COLUMNS).eq('game_id', game.id),
    fetchOpponentLines(game, seasonId, statsTable),
    fetchKosarstatRows(game, seasonId),
    fetchPointSources(game, seasonId).catch(() => null),
    fetchShotContext(game, seasonId, teamId).catch(() => undefined),
    fetchPlayerReports(game.id).catch(() => new Map<string, GameReport>()),
  ]);

  if (ownResult.error) throw new Error(ownResult.error.message);

  return {
    ownLines: toLines(ownResult.data),
    opponentLines,
    ...kosarstat,
    pointSources,
    shotContext,
    playerReports,
  };
}

/**
 * Az ellenfél box score-ja: a találkozó az ellenfél perspektívájából külön
 * `games` sorként él. Kulcs: szezon + ellenfél csapat (`opponent_team_id`) +
 * dátum – a webes `opponentGameMap` mintája (D-119). Csak pontosan egy
 * találatot fogadunk el.
 */
async function fetchOpponentLines(
  game: TeamGame,
  seasonId: string,
  statsTable: string,
): Promise<RawPlayerLine[] | null> {
  if (!game.opponentTeamId) return null;

  const { data, error } = await supabase
    .from('games')
    .select('id')
    .eq('season_id', seasonId)
    .eq('our_team_id', game.opponentTeamId)
    .eq('date', game.date)
    .limit(2);

  if (error) throw new Error(error.message);
  const rows = Array.isArray(data) ? data : [];
  if (rows.length !== 1 || !isRecord(rows[0]) || typeof rows[0].id !== 'string') return null;

  const { data: lines, error: linesError } = await supabase
    .from(statsTable)
    .select(LINE_COLUMNS)
    .eq('game_id', rows[0].id);

  if (linesError) throw new Error(linesError.message);
  const parsed = toLines(lines);
  return parsed.length > 0 ? parsed : null;
}

/** A kosarstat negyed- és csapatmetrika-sorai nyersen, meccsenként ≤ 10 sor. */
async function fetchKosarstatRows(
  game: TeamGame,
  seasonId: string,
): Promise<Pick<PostgamePayload, 'quarterStats' | 'teamMetrics'>> {
  if (!game.kosarstatGameId) return { quarterStats: [], teamMetrics: [] };

  const [quarterResult, metricsResult] = await Promise.all([
    supabase
      .from('kosarstat_game_quarter_stats')
      .select('team_name, team_side, quarter, points, cumulative_points')
      .eq('kosarstat_game_id', game.kosarstatGameId)
      .eq('season_id', seasonId),
    supabase
      .from('kosarstat_game_team_metrics')
      .select('team_name, team_side, poss, ortg, efg, tov_pct, orb_pct, ftm_rate')
      .eq('kosarstat_game_id', game.kosarstatGameId)
      .eq('season_id', seasonId),
  ]);

  if (quarterResult.error) throw new Error(quarterResult.error.message);
  if (metricsResult.error) throw new Error(metricsResult.error.message);

  return {
    quarterStats: toQuarterStats(quarterResult.data),
    teamMetrics: toTeamMetrics(metricsResult.data),
  };
}

/**
 * A pontforrások nyersanyaga: a kosarstat `game_events` oldalának
 * eseménytáblája (az, amelyiknek van `home_event` oszlopa). Két lekérdezés,
 * ahogy a clutch-nál (`hooks/useGameDetails` `fetchClutch`): előbb a legfrissebb
 * nyers oldal, majd a táblái. Eseményoldal nélkül `null`.
 */
async function fetchPointSources(
  game: TeamGame,
  seasonId: string,
): Promise<KosarstatPointSourceTotals | null> {
  if (!game.kosarstatGameId) return null;

  const { data: rawRows, error: rawError } = await supabase
    .from('kosarstat_game_pages_raw')
    .select('id')
    .eq('season_id', seasonId)
    .eq('kosarstat_game_id', game.kosarstatGameId)
    .eq('page_type', 'game_events')
    .order('imported_at', { ascending: false })
    .limit(1);

  if (rawError) throw new Error(rawError.message);
  const raw: unknown = Array.isArray(rawRows) ? rawRows[0] : null;
  if (!isRecord(raw) || typeof raw.id !== 'string') return null;

  const { data: tables, error: tablesError } = await supabase
    .from('kosarstat_game_page_tables')
    .select('rows, headers')
    .eq('page_raw_id', raw.id)
    .order('table_index', { ascending: true });

  if (tablesError) throw new Error(tablesError.message);
  if (!Array.isArray(tables)) return null;

  // A parser `null`-t ad arra a táblára, amelyik nem eseménylista.
  for (const table of tables as unknown[]) {
    if (!isRecord(table) || !Array.isArray(table.headers) || !Array.isArray(table.rows)) continue;
    const headers = table.headers.map((cell) => String(cell ?? '').trim());
    const rows = table.rows.filter((cells): cells is unknown[] => Array.isArray(cells));
    const parsed = parseKosarstatPointSources(headers, rows);
    if (parsed) return parsed;
  }

  return null;
}

/**
 * A Hunbasket dobástérkép a meccsre és a szezonra (spec 2.5). Ha a meccshez
 * nincs nyers shot chart, `undefined` – a `@core` ilyenkor `available: false`-t ad.
 */
async function fetchShotContext(
  game: TeamGame,
  seasonId: string,
  teamId: string,
): Promise<PostGameShotMapContext | undefined> {
  const { data, error } = await supabase
    .from('hunbasket_shotchart_raw')
    .select('id, home_team_id, away_team_id, home_score, away_score')
    .eq('season_id', seasonId)
    .eq('game_date', game.date)
    // A `teamId` a `filterStore`-ból jövő UUID – ugyanez a `.or()` minta fut a
    // `hooks/useGameData.ts` fixtures lekérdezésében.
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`);

  if (error) throw new Error(error.message);
  const rawId = pickShotchartRaw(data, game);
  if (!rawId) return undefined;

  const [gameResult, seasonShots] = await Promise.all([
    supabase
      .from('hunbasket_shot_events')
      .select('player_id, x, y, is_successful, shot_side')
      .eq('raw_game_id', rawId)
      .eq('team_id', teamId),
    seasonShotsCache.load(filterKey(seasonId, teamId), () => fetchSeasonShots(seasonId, teamId)),
  ]);

  if (gameResult.error) throw new Error(gameResult.error.message);
  return { gameShots: toShots(gameResult.data), seasonShots };
}

async function fetchSeasonShots(seasonId: string, teamId: string): Promise<ShotMapEventInput[]> {
  // Egy csapat szezonja könnyen 1000 dobás fölött van – lapozva kérjük.
  const rows = await fetchAllRows<unknown>((from, to) =>
    supabase
      .from('hunbasket_shot_events')
      .select('player_id, x, y, is_successful, shot_side')
      .eq('season_id', seasonId)
      .eq('team_id', teamId)
      .order('id')
      .range(from, to),
  );
  return toShots(rows);
}

/**
 * A nyers shot chart sorai közül az, amelyiknek az eredménye bármely irányban
 * egyezik a meccsével, és – ha ismert – mindkét csapat szerepel benne. Jelölt
 * híján az első sor marad, ahogy a weben.
 */
function pickShotchartRaw(rows: unknown, game: TeamGame): string | null {
  if (!Array.isArray(rows)) return null;
  const valid = rows.filter(
    (row): row is Record<string, unknown> => isRecord(row) && typeof row.id === 'string',
  );

  const match = valid.find((row) => {
    const home = toNumber(row.home_score);
    const away = toNumber(row.away_score);
    const scoreMatches =
      (home === game.ourScore && away === game.oppScore) ||
      (home === game.oppScore && away === game.ourScore);
    const opponentMatches =
      !game.opponentTeamId ||
      row.home_team_id === game.opponentTeamId ||
      row.away_team_id === game.opponentTeamId;
    return scoreMatches && opponentMatches;
  });

  const picked = match ?? valid[0];
  return picked ? String(picked.id) : null;
}

/**
 * A weben mentett játékos-értékelések (csak olvasás, generálás nincs). Amíg a
 * táblán nincs SELECT policy a bejelentkezett felhasználóra, üres (D-122).
 */
async function fetchPlayerReports(gameId: string): Promise<Map<string, GameReport>> {
  const { data, error } = await supabase
    .from('player_game_text_reports')
    .select('id, player_id, narrative, generated_at')
    .eq('game_id', gameId);

  if (error) throw new Error(error.message);
  const reports = new Map<string, GameReport>();
  if (!Array.isArray(data)) return reports;

  for (const row of data as unknown[]) {
    if (!isRecord(row) || typeof row.id !== 'string' || typeof row.player_id !== 'string') continue;
    if (typeof row.narrative !== 'string' || row.narrative.trim() === '') continue;
    reports.set(row.player_id, {
      id: row.id,
      type: 'postgame',
      narrative: row.narrative,
      generatedAt: typeof row.generated_at === 'string' ? row.generated_at : '',
    });
  }
  return reports;
}

// --- Rendszerhatár: a Supabase válasza típusozatlan, itt validáljuk. ---

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function toNullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toText(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function toSide(value: unknown): KosarstatTeamSide {
  return value === 'home' || value === 'away' || value === 'unknown' ? value : null;
}

function toLines(rows: unknown): RawPlayerLine[] {
  if (!Array.isArray(rows)) return [];

  return rows.flatMap((row: unknown): RawPlayerLine[] => {
    if (!isRecord(row) || typeof row.player_id !== 'string') return [];
    const player = Array.isArray(row.players) ? row.players[0] : row.players;
    const name = isRecord(player) && typeof player.name === 'string' ? player.name : row.player_id;

    return [
      {
        playerId: row.player_id,
        name,
        isStarter: typeof row.is_starter === 'boolean' ? row.is_starter : undefined,
        minutes: toNumber(row.minutes),
        points: toNumber(row.points),
        fga2: toNumber(row.close_attempted) + toNumber(row.mid_attempted),
        fgm2: toNumber(row.close_made) + toNumber(row.mid_made),
        fga3: toNumber(row.three_attempted),
        fgm3: toNumber(row.three_made),
        fta: toNumber(row.free_throw_attempted),
        ftm: toNumber(row.free_throw_made),
        oreb: toNumber(row.offensive_rebounds),
        dreb: toNumber(row.defensive_rebounds),
        ast: toNumber(row.assists),
        tov: toNumber(row.turnovers),
        stl: toNumber(row.steals),
        blk: toNumber(row.blocks),
        val: toNumber(row.valuation),
      },
    ];
  });
}

function toQuarterStats(rows: unknown): KosarstatQuarterStatRow[] {
  if (!Array.isArray(rows)) return [];
  return rows.filter(isRecord).map((row) => ({
    team_name: toText(row.team_name),
    team_side: toSide(row.team_side),
    quarter: toNullableNumber(row.quarter),
    points: toNullableNumber(row.points),
    cumulative_points: toNullableNumber(row.cumulative_points),
  }));
}

function toTeamMetrics(rows: unknown): KosarstatTeamMetricRow[] {
  if (!Array.isArray(rows)) return [];
  return rows.filter(isRecord).map((row) => ({
    team_name: toText(row.team_name),
    team_side: toSide(row.team_side),
    poss: toNullableNumber(row.poss),
    ortg: toNullableNumber(row.ortg),
    efg: toNullableNumber(row.efg),
    tov_pct: toNullableNumber(row.tov_pct),
    orb_pct: toNullableNumber(row.orb_pct),
    ftm_rate: toNullableNumber(row.ftm_rate),
  }));
}

/** A spec 2.5/4. pontja: nem véges koordináta vagy ismeretlen oldal → kimarad. */
function toShots(rows: unknown): ShotMapEventInput[] {
  if (!Array.isArray(rows)) return [];

  return rows.flatMap((row: unknown): ShotMapEventInput[] => {
    if (!isRecord(row)) return [];
    const x = Number(row.x);
    const y = Number(row.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return [];
    if (row.shot_side !== 'home' && row.shot_side !== 'away') return [];

    return [
      {
        playerId: typeof row.player_id === 'string' ? row.player_id : null,
        x,
        y,
        isSuccessful: Boolean(row.is_successful),
        shotSide: row.shot_side,
      },
    ];
  });
}
