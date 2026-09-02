/**
 * A liga csapatmezőnyének szezonösszegzése a `@core/team-analysis` bemeneti
 * alakjában: volumen, ellenfél-oldali volumen és keret szerepkörökkel.
 *
 * Tiszta adatréteg – React nincs benne, csak Supabase-lekérdezés és
 * összegzés. Azért külön modul, mert a lánc (lekérdezés → `TeamSeasonStat[]`
 * → `analyzeTeamSeason`) így hálózati méréssel is végigfuttatható, a képernyő
 * elindítása nélkül.
 *
 * Három lekérdezés fut, mind a kapott szezonra:
 *
 * 1. `games` – csapatonként meccsszám, szerzett és kapott pont, plusz a
 *    meccsek párosítása (lásd `pairGames`).
 * 2. A szezon `player_game_stats` táblája – **csapatösszegzéshez**. A
 *    szezonösszesítő view itt nem használható: abból hiányoznak a szezon
 *    közben távozott játékosok sorai (D-078).
 * 3. `player_season_stats_by_season` – a **keretek** játékossorai. A pozíció,
 *    a testmagasság és a szerepkör-levezetés innen jön.
 *
 * A szerepköröket nem az adatbázis tárolja: a `@core/player-analysis`
 * `analyzePlayerSeason`-je vezeti le a szezonstatisztikából, a liga
 * játékos-percentiliseihez mérve – ahogy a webprojekt is (D-082).
 */
import { fetchAllRows } from '@core/fetch-all-rows';
import {
  analyzePlayerSeason,
  buildLeagueBenchmarks,
  type RawPlayerSeasonStat,
} from '@core/player-analysis';
import { buildPositionMetadata } from '@core/positions';
import { SEASON_STATS_TABLES } from '@core/season-tables';
import type { TeamSeasonStat } from '@core/team-analysis';

import { supabase } from '@/lib/supabase';
import type { Team } from '@/types/filters';

/**
 * A benchmark-mezőny kulcsa a `@core`-ban liga + szezon. Az adatbázis nem tárol
 * ligát, a mezőny viszont egyetlen bajnokság – ezért egy állandó kulcs elég.
 */
const LEAGUE = 'NB I/A';

export interface TeamSeasonPayload {
  /** A liga csapatai szezonösszegzéssel, kerettel és ellenfél-volumennel. */
  teams: TeamSeasonStat[];
  /** Hány liga-játékos szerepkörét sikerült levezetni. */
  ratedPlayers: number;
  /** Csapatonként hány meccshez lett ellenfél-oldali statisztika. */
  pairedGames: Map<string, number>;
}

export const EMPTY_TEAM_SEASON: TeamSeasonPayload = {
  teams: [],
  ratedPlayers: 0,
  pairedGames: new Map(),
};

export async function fetchTeamSeasonStats(
  seasonId: string,
  seasonName: string,
  teams: Team[],
): Promise<TeamSeasonPayload> {
  // A szezonspecifikus stat-tábla nevét itt nem a `getSeasonStatsTable`
  // adja: annak UNION view tartaléka minden szezon sorát hozná, és a `games`
  // kapcsolat sincs ráhúzva. Ismeretlen szezonhoz nincs adat – üres állapot.
  const statsTable = SEASON_STATS_TABLES[seasonName];
  if (!statsTable) return EMPTY_TEAM_SEASON;

  const [gameRows, statRows, playerRows] = await Promise.all([
    fetchAllRows<unknown>((from, to) =>
      supabase
        .from('games')
        .select('id, date, home_away, our_team_id, our_score, opp_score')
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

  const games = toGames(gameRows);
  const gameTotals = buildGameTotals(statRows);
  const opponentOf = pairGames(games);
  const { rosters, ratedPlayers } = buildRosters(playerRows, seasonName);

  return {
    teams: buildTeams(games, gameTotals, opponentOf, rosters, teams, seasonName),
    ratedPlayers,
    pairedGames: countPaired(games, opponentOf),
  };
}

/** Egy `games` sor a párosításhoz és az összegzéshez szükséges mezőkkel. */
interface GameRow {
  id: string;
  date: string;
  homeAway: string;
  teamId: string;
  pointsFor: number;
  pointsAgainst: number;
}

function toGames(rows: unknown[]): GameRow[] {
  return rows.flatMap((row) => {
    if (!isRecord(row)) return [];
    const { id, date, our_team_id: teamId } = row;
    if (typeof id !== 'string' || typeof teamId !== 'string' || typeof date !== 'string') return [];

    return [
      {
        id,
        date,
        homeAway: typeof row.home_away === 'string' ? row.home_away : '',
        teamId,
        pointsFor: toNumber(row.our_score),
        pointsAgainst: toNumber(row.opp_score),
      },
    ];
  });
}

/**
 * Meccs → az ellenfél ugyanarról a találkozóról felvett sora.
 *
 * Az adatbázis csapatperspektívánként tárol: egy találkozó két sorként él, és
 * nincs köztük kulcs. A párosítás dátum + a két eredmény halmaza alapján megy;
 * csak akkor fogadjuk el, ha a napon pontosan két ilyen sor van, más-más
 * csapaté, és a hazai/vendég oldal is tükrözi egymást (D-081).
 */
function pairGames(games: GameRow[]): Map<string, string> {
  const groups = new Map<string, GameRow[]>();

  for (const game of games) {
    const low = Math.min(game.pointsFor, game.pointsAgainst);
    const high = Math.max(game.pointsFor, game.pointsAgainst);
    const key = `${game.date}|${low}|${high}`;
    const group = groups.get(key);
    if (group) group.push(game);
    else groups.set(key, [game]);
  }

  const opponentOf = new Map<string, string>();

  for (const group of groups.values()) {
    if (group.length !== 2) continue;
    const [a, b] = group;
    if (a.teamId === b.teamId) continue;
    if (!isMirroredSide(a.homeAway, b.homeAway)) continue;

    opponentOf.set(a.id, b.id);
    opponentOf.set(b.id, a.id);
  }

  return opponentOf;
}

function isMirroredSide(first: string, second: string): boolean {
  return (
    (first === 'home' && second === 'away') || (first === 'away' && second === 'home')
  );
}

/** Csapatonként hány meccshez van ellenfél-oldali statisztika. */
function countPaired(games: GameRow[], opponentOf: Map<string, string>): Map<string, number> {
  const counts = new Map<string, number>();

  for (const game of games) {
    if (!opponentOf.has(game.id)) continue;
    counts.set(game.teamId, (counts.get(game.teamId) ?? 0) + 1);
  }

  return counts;
}

/** A `TeamSeasonStat` volumenmezői – meccsenként a játékossorokból összeadva. */
interface Totals {
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

function emptyTotals(): Totals {
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

function addTotals(target: Totals, source: Totals): void {
  target.fga2 += source.fga2;
  target.fgm2 += source.fgm2;
  target.fga3 += source.fga3;
  target.fgm3 += source.fgm3;
  target.fta += source.fta;
  target.ftm += source.ftm;
  target.oreb += source.oreb;
  target.dreb += source.dreb;
  target.ast += source.ast;
  target.tov += source.tov;
  target.stl += source.stl;
  target.blk += source.blk;
  target.fouls += source.fouls;
  target.val += source.val;
}

function buildGameTotals(rows: unknown[]): Map<string, Totals> {
  const totals = new Map<string, Totals>();

  for (const row of rows) {
    if (!isRecord(row)) continue;
    const gameId = row.game_id;
    if (typeof gameId !== 'string') continue;

    const entry = totals.get(gameId) ?? emptyTotals();
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
    totals.set(gameId, entry);
  }

  return totals;
}

/** Egy keretjátékos a `TeamSeasonStat.roster` alakjában. */
type RosterEntry = TeamSeasonStat['roster'][number];

function buildTeams(
  games: GameRow[],
  gameTotals: Map<string, Totals>,
  opponentOf: Map<string, string>,
  rosters: Map<string, RosterEntry[]>,
  teams: Team[],
  seasonName: string,
): TeamSeasonStat[] {
  const names = new Map(teams.map((team) => [team.id, team.name]));
  const byTeam = new Map<string, TeamSeasonStat>();

  for (const game of games) {
    let team = byTeam.get(game.teamId);
    if (!team) {
      team = {
        teamId: game.teamId,
        teamName: names.get(game.teamId) ?? 'Ismeretlen csapat',
        league: LEAGUE,
        season: seasonName,
        games: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        ...emptyTotals(),
        opponent: {
          fga2: 0,
          fgm2: 0,
          fga3: 0,
          fgm3: 0,
          fta: 0,
          ftm: 0,
          oreb: 0,
          dreb: 0,
          tov: 0,
        },
        roster: rosters.get(game.teamId) ?? [],
      };
      byTeam.set(game.teamId, team);
    }

    team.games += 1;
    team.pointsFor += game.pointsFor;
    team.pointsAgainst += game.pointsAgainst;

    const own = gameTotals.get(game.id);
    if (own) addTotals(team, own);

    const opponentGameId = opponentOf.get(game.id);
    const against = opponentGameId ? gameTotals.get(opponentGameId) : undefined;
    if (against) {
      team.opponent.fga2 += against.fga2;
      team.opponent.fgm2 += against.fgm2;
      team.opponent.fga3 += against.fga3;
      team.opponent.fgm3 += against.fgm3;
      team.opponent.fta += against.fta;
      team.opponent.ftm += against.ftm;
      team.opponent.oreb += against.oreb;
      team.opponent.dreb += against.dreb;
      team.opponent.tov += against.tov;
    }
  }

  return Array.from(byTeam.values());
}

/**
 * Csapatonkénti keret, szerepkörökkel.
 *
 * A szerepkör a `@core/player-analysis` levezetése: előbb a liga
 * játékos-percentilisei épülnek fel, majd minden játékos ehhez mérve kap
 * szerepköröket. Aki egy meccsen sem lépett pályára, kimarad.
 */
function buildRosters(
  rows: unknown[],
  seasonName: string,
): { rosters: Map<string, RosterEntry[]>; ratedPlayers: number } {
  const entries: Array<{ teamId: string; raw: RawPlayerSeasonStat; height: number }> = [];

  for (const row of rows) {
    if (!isRecord(row)) continue;
    const { player_id: playerId, name, team_id: teamId } = row;
    if (typeof playerId !== 'string' || typeof name !== 'string') continue;
    if (typeof teamId !== 'string') continue;

    const games = toNumber(row.games_played);
    if (games <= 0) continue;

    entries.push({
      teamId,
      height: toNumber(row.height),
      raw: {
        playerId,
        name,
        league: LEAGUE,
        season: seasonName,
        ...buildPositionMetadata(typeof row.position === 'string' ? row.position : null),
        games,
        minutes: toNumber(row.total_minutes),
        points: toNumber(row.total_points),
        close: {
          made: toNumber(row.total_close_made),
          attempted: toNumber(row.total_close_attempted),
        },
        mid: { made: toNumber(row.total_mid_made), attempted: toNumber(row.total_mid_attempted) },
        three: {
          made: toNumber(row.total_three_made),
          attempted: toNumber(row.total_three_attempted),
        },
        ft: {
          made: toNumber(row.total_free_throw_made),
          attempted: toNumber(row.total_free_throw_attempted),
        },
        rebounds: {
          offensive: toNumber(row.total_offensive_rebounds),
          defensive: toNumber(row.total_defensive_rebounds),
          total: toNumber(row.total_rebounds),
        },
        assists: toNumber(row.total_assists),
        steals: toNumber(row.total_steals),
        blocks: toNumber(row.total_blocks),
        turnovers: toNumber(row.total_turnovers),
        fouls: {
          committed: toNumber(row.total_fouls_committed),
          received: toNumber(row.total_fouls_drawn),
        },
        valuation: toNumber(row.total_valuation),
      },
    });
  }

  const benchmarks = buildLeagueBenchmarks(entries.map((entry) => entry.raw));
  const rosters = new Map<string, RosterEntry[]>();
  let ratedPlayers = 0;

  for (const { teamId, raw, height } of entries) {
    const roles = analyzePlayerSeason(raw, benchmarks).roles;
    if (roles.length > 0) ratedPlayers += 1;

    const fga = raw.close.attempted + raw.mid.attempted + raw.three.attempted;

    const player: RosterEntry = {
      playerId: raw.playerId,
      name: raw.name,
      position: raw.position,
      positionBuckets: raw.positionBuckets,
      positionLabel: raw.positionLabel ?? null,
      rawPosition: raw.positionLabel ?? null,
      minutes: raw.minutes,
      // A webes `buildTeamSeasonStats` képlete: dobás + 0.44 · büntető + eladott.
      usageProxy: fga + 0.44 * raw.ft.attempted + raw.turnovers,
      heightCm: height || undefined,
      roles,
    };

    const roster = rosters.get(teamId);
    if (roster) roster.push(player);
    else rosters.set(teamId, [player]);
  }

  return { rosters, ratedPlayers };
}

// --- Rendszerhatár: a Supabase válasza típusozatlan, itt validáljuk. ---

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
