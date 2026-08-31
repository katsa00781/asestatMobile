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
