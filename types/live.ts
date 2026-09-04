/**
 * Élő mérkőzés – a `live_games`, `live_player_lines` és `live_quarter_scores`
 * táblák leszűkített, kliensoldali alakja.
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

/** A teljes élő nézethez: az összefoglaló mellett box score és negyedek is. */
export interface LiveGameDetails extends LiveGameSummary {
  boxScore: PlayerGameLine[];
  quarters: QuarterScore[];
}
