/**
 * A Szerepkör-elemzés képernyő megjelenítési modellje.
 *
 * A számokat a `@core/team-analysis` adja, ez a fájl csak a képernyőre kész
 * alakot írja le: minden érték **már formázott**, a komponensek nem
 * kerekítenek és nem számolnak.
 *
 * A megállapítás-listák és a stílusbadge-ek típusa a scoutingé
 * (`types/scouting`): ugyanaz a `PointList` és `ProfilePanel` rajzolja őket.
 */
import type { AccentTone } from '@/constants/theme';
import type { PointEntry, ProfileView } from '@/types/scouting';
import type { InsightFragment } from '@/types/situational';

/** A szegmentált kontroll három nézete. */
export type RolesSegment = 'roles' | 'load' | 'profile';

/** Egy arányjelző sor: címke, kiegészítés, érték és sáv. */
export interface MeterEntry {
  label: string;
  /** Kiegészítő sor a sáv alatt (játékosnevek, nyers érték) vagy `null`. */
  note: string | null;
  /** Formázott érték a sor jobb szélén, pl. „24.5%". */
  valueText: string;
  /** 0–100 a sávhoz. */
  percent: number;
  tone: AccentTone;
}

/** Mekkora mintán áll a képernyő – a lábjegyzetekhez. */
export interface RolesMeta {
  /** A percentilis-mezőny csapatszáma. */
  teamCount: number;
  /** Hány liga-játékos szerepkörét számolta ki a modell. */
  ratedPlayers: number;
  /** A csapat keretének mérete. */
  rosterSize: number;
  /** A csapat szezonbeli meccsszáma. */
  games: number;
  /** Hány meccshez sikerült ellenfél-oldali statisztikát párosítani. */
  pairedGames: number;
}

/** A képernyő teljes tartalma. */
export interface RolesView {
  teamName: string;
  /** Lefedett szerepkörök, a betöltő játékosokkal. */
  covered: PointEntry[];
  /** Háromnál több emberrel lefedett szerepkörök. */
  redundant: PointEntry[];
  /** Egyáltalán nem lefedett szerepkörök. */
  missing: PointEntry[];
  /** A keret értelmezése a modell mondataival. */
  notes: PointEntry[];
  /** A két legtöbbet birtokló ember aránya. */
  usage: MeterEntry;
  /** Posztonkénti játékpercek aránya. */
  positions: MeterEntry[];
  /** Keretkockázati jelzések (scorer-függőség, playmaking mélység, magasság). */
  flags: PointEntry[];
  /** Átlagmagasság, ha megbízható az adat. */
  heightText: string | null;
  /** Játékstílus badge-ekben, a liga-klaszterrel kiemelve. */
  profile: ProfileView;
  /** Liga-percentilisek. */
  league: MeterEntry[];
  /** Klasztertársak egy sorban, ha van. */
  clusterPeersText: string | null;
  strengths: PointEntry[];
  limitations: PointEntry[];
  risks: PointEntry[];
  /** Milyen adaton áll az adott szegmens – lábjegyzetnek. */
  coverage: Record<RolesSegment, string>;
  insights: Record<RolesSegment, InsightFragment[]>;
}
