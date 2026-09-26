/**
 * Élő mérkőzés – a `live_games`, `live_player_lines`, `live_quarter_scores` és
 * `live_team_stats` táblák leszűkített, kliensoldali alakja.
 *
 * A séma tudatosan a meglévő `PlayerGameLine` és `QuarterScore` oszlopneveit
 * követi, hogy a `hooks/useLiveGame.ts` mapperei a `hooks/useGameDetails.ts`
 * bevált mintáját tudják újrahasznosítani (D-107).
 */
import type { HomeAway, PlayerGameLine, QuarterScore } from '@/types/games';

export type LiveStatus = 'scheduled' | 'live' | 'halftime' | 'final';

/** A `live_games` sor a kiválasztott csapat szemszögéből. */
export interface LiveGameSummary {
  id: string;
  status: LiveStatus;
  homeAway: HomeAway;
  /** Az ellenfél neve, ahogy a gyűjtő nyersen rögzítette. */
  opponent: string;
  ourScore: number;
  oppScore: number;
  /** 0 = még nem kezdődött, 1–4 negyed, 5+ hosszabbítás. */
  period: number;
  /** A forrás órája nyersen (`'07:42'`), vagy `null`, ha a forrás nem ad ilyet. */
  clock: string | null;
  /** ISO időbélyeg – ekkor frissítette a gyűjtő. */
  updatedAt: string;
}

/**
 * Egy csapat teljes meccsstatisztikája (`live_team_stats`). A csapatszintű
 * eseményeket (csapat-lepattanó, csapat-labdaeladás) is tartalmazza, ezért
 * **nem** egyenlő a box score sorainak összegével.
 */
export interface LiveTeamStats {
  twoMade: number;
  twoAttempted: number;
  threeMade: number;
  threeAttempted: number;
  freeThrowMade: number;
  freeThrowAttempted: number;
  rebounds: number;
  assists: number;
  steals: number;
  turnovers: number;
  fouls: number;
  foulsDrawn: number;
  valuation: number;
}

/** A teljes élő nézethez: az összefoglaló mellett box score és negyedek is. */
export interface LiveGameDetails extends LiveGameSummary {
  boxScore: PlayerGameLine[];
  quarters: QuarterScore[];
  /** Saját és ellenfél csapatstatisztika – `null`, amíg nincs meg mindkét oldal. */
  teamStats: { own: LiveTeamStats; opponent: LiveTeamStats } | null;
}
