/**
 * Meccsek és közelgő fixtures – a `games` és a `league_fixtures` sorainak
 * leszűkített, kliensoldali alakja.
 *
 * A `games` tábla **csapatperspektívánként** tárol: egy találkozó annyi sorban
 * szerepel, ahány csapat szemszögéből rögzítették. Ezért van `our_score` /
 * `opp_score` és szöveges `opponent` név, és ezért kell mindig `our_team_id`-ra
 * szűrni.
 */

export type GameResult = 'win' | 'loss';
export type HomeAway = 'home' | 'away';

/** Egy lejátszott meccs a kiválasztott csapat szemszögéből. */
export interface TeamGame {
  id: string;
  /** ISO nap (`2026-05-25`) – a tábla nem tárol időpontot. */
  date: string;
  round: number | null;
  /** Az ellenfél neve szövegesen, ahogy a `games` tábla tárolja. */
  opponent: string;
  homeAway: HomeAway;
  ourScore: number;
  oppScore: number;
  result: GameResult;
  /**
   * A kosarstat import azonosítója, ha a meccset onnan is beolvasták. Ezen
   * keresztül köthető a negyedenkénti bontás – a meccsek nagy részénél `null`.
   */
  kosarstatGameId: string | null;
}

/** Még le nem játszott találkozó a bajnoki menetrendből. */
export interface Fixture {
  id: string;
  /** ISO nap – a `league_fixtures` sem tárol kezdési időpontot. */
  gameDate: string;
  round: number | null;
  homeTeamName: string;
  awayTeamName: string;
  /** A kiválasztott csapat szemszögéből. */
  isHome: boolean;
  opponentName: string;
  status: 'scheduled' | 'postponed';
}

/** Szezonszintű csapatösszesítés a lejátszott meccsekből számolva. */
export interface TeamAggregate {
  played: number;
  wins: number;
  losses: number;
  /** Átlagosan szerzett pont. */
  avgScored: number;
  /** Átlagosan kapott pont. */
  avgConceded: number;
  /** Átlagos pontkülönbség (szerzett − kapott). */
  avgDiff: number;
}

/** Egy játékos sora a meccs box score-jában. */
export interface PlayerGameLine {
  playerId: string;
  name: string;
  number: number;
  minutes: number;
  points: number;
  /** Kétpontos (közeli + középtávoli) bedobott / kísérlet. */
  twoMade: number;
  twoAttempted: number;
  threeMade: number;
  threeAttempted: number;
  freeThrowMade: number;
  freeThrowAttempted: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  valuation: number;
}

/** Egy negyed pontjai mindkét csapatnál, a saját csapat szemszögéből. */
export interface QuarterScore {
  /** 1–4 (hosszabbítás esetén tovább). */
  quarter: number;
  ourPoints: number;
  oppPoints: number;
}

export type GameReportType = 'pregame' | 'postgame' | 'combined' | 'manual';

/** Mentett AI riport a `game_text_reports` táblából – az app csak olvassa. */
export interface GameReport {
  id: string;
  type: GameReportType;
  narrative: string;
  /** ISO időbélyeg, ahogy a tábla tárolja. */
  generatedAt: string;
}
