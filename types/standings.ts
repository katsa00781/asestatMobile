/**
 * A bajnoki tabella kliensoldali alakja.
 *
 * A `standings` tábla egy sora egy teljes tabellaállás: `matchday` + `date` +
 * egy JSON tömb, csapatonként egy elemmel. A mobil app abból csak azt tartja
 * meg, amit a mockup ki is ír.
 */

export interface StandingsTeam {
  /** A `teams` tábla azonosítója, ha a név alapján megvan – ez adja a kiemelést. */
  teamId: string | null;
  /** Helyezés a tabellán, 1-től. */
  position: number;
  /** Megjelenített név – a csapatlista rövid neve, ha van (D-058). */
  name: string;
  /** Három betűs jel a badge-ben, pl. „FAL". */
  abbr: string;
  played: number;
  wins: number;
  losses: number;
  /** Kosárkülönbség: dobott − kapott. */
  diff: number;
  /** Bajnoki pont. */
  points: number;
}

export interface StandingsTable {
  /** Hányadik forduló után áll így a tabella. */
  matchday: number;
  /** A tabella állásának dátuma, ISO nap. */
  date: string;
  /** Helyezés szerint növekvő sorrendben. */
  teams: StandingsTeam[];
}
