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
  /** Az ellenfél csapat-azonosítója – az ellenfél scouting ebből indul. */
  opponentId: string;
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

/**
 * A kumulatív pontkülönbség egy negyed végén (momentum chart). A kosarstat
 * import a legfinomabb bontás – valós play-by-play nincs, ezért a görbe
 * negyedenkénti (D-095).
 */
export interface MomentumPoint {
  /** 1–4 (hosszabbítás esetén tovább). */
  quarter: number;
  /** Saját kumulatív pont − ellenfél kumulatív pont az adott negyed végén. */
  diff: number;
}

/**
 * A meccs egy „four factor" mutatója a saját csapat és az ellenfél
 * összevetésében. Az adat a kosarstat `kosarstat_game_team_metrics` sorából
 * jön – a meccsek nagy részéhez hiányzik.
 *
 * Az `our` és `opp` **százalékban** áll: az eFG%, TOV% és ORB% eleve úgy
 * érkezik, a büntetőráta (FTM/FGA, 0–1 skála) viszont ×100-zal ide van váltva,
 * hogy a chart közös Y tengelyén a másik hárommal összemérhető legyen (D-096).
 */
export interface FourFactorRow {
  key: 'efg' | 'tov' | 'orb' | 'ft';
  /** Rövid felirat a chart X tengelyére (`eFG%` / `TOV%` / `ORB%` / `FT%`). */
  label: string;
  /** A saját csapat értéke százalékban. */
  our: number;
  /** Az ellenfél értéke százalékban. */
  opp: number;
  /** Igaz, ha a kisebb érték a jobb (labdaeladás %). */
  lowerIsBetter: boolean;
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
