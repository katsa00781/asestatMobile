/**
 * Az Ellenfél scouting képernyő megjelenítési modellje.
 *
 * A számokat a `@core/pregame-scouting` adja, ez a fájl csak a képernyőre kész
 * alakot írja le: minden érték **már formázott**, a komponensek nem kerekítenek
 * és nem számolnak.
 *
 * A szembeállított fejléc és metrikasor típusa a Szituációk képernyőé
 * (`types/situational`): ugyanaz a `SplitHeader` és `SplitMetricRow` rajzolja,
 * csak itt a bal oldal a saját csapat, a jobb az ellenfél.
 */
import type { BadgeVariant } from '@/components/Badge';
import type { InsightFragment, SplitMetric, SplitSide } from '@/types/situational';

/** A szegmentált kontroll három nézete. */
export type ScoutingSegment = 'overview' | 'plan' | 'players';

/** Egy választható ellenfél a bottom sheetben. */
export interface OpponentOption {
  id: string;
  name: string;
  /** Meccsszám a szezonban, pl. „40 meccs" – a sor jobb szélén. */
  gamesText: string;
}

/** Honnan jött az éppen elemzett ellenfél. */
export type OpponentSource = 'next' | 'last' | 'pick';

/** Az ellenfélsáv tartalma. */
export interface OpponentMeta {
  source: OpponentSource;
  /** ALL CAPS eyebrow, pl. „Következő ellenfél". */
  label: string;
  /** Dátum és pálya, ha ismert – egyébként `null`. */
  detail: string | null;
}

/** Esélylatolgatás – a `winProbability` kész alakja. */
export interface ChanceView {
  ownText: string;
  opponentText: string;
  /** 0–100 az arányjelző sávhoz (a saját oldal esélye). */
  ownPercent: number;
  /** „Közepes bizonyosság" */
  confidenceText: string;
  confidenceVariant: BadgeVariant;
  /** A bizonyosság indoklása egy sorban, vagy `null`. */
  reasonText: string | null;
}

/** Egy csapat játékstílusa badge-ekben. */
export interface ProfileView {
  label: string;
  /** „Magas tempó" */
  tempoText: string;
  /** Támadó és védekező stílusjegyek egy sorban. */
  tags: string[];
}

/** Egy megállapítás a terv szekcióban. */
export interface PointEntry {
  text: string;
  /** Kiegészítő sor (kockázati forgatókönyv válaszlépése), ha van. */
  note?: string;
}

/** Az ellenfél kulcsemberei szerepkör szerint. */
export interface KeyPlayerGroup {
  label: string;
  names: string[];
}

/** Egy sor a poszt-összehasonlításban. */
export interface PositionRow {
  label: string;
  ownText: string;
  opponentText: string;
  deltaText: string;
  /** Előnyben vagyunk-e a poszton – ettől függ a cella színe. */
  positive: boolean;
}

/** Egy sor az ellenfél kiemelt játékosainak mátrixában. */
export interface ScoutPlayerRow {
  name: string;
  minutesText: string;
  valText: string;
  pointsText: string;
}

/** A képernyő teljes tartalma. */
export interface ScoutingView {
  own: SplitSide;
  opponent: SplitSide;
  chance: ChanceView;
  metrics: SplitMetric[];
  profiles: ProfileView[];
  threats: PointEntry[];
  vulnerabilities: PointEntry[];
  focusPoints: PointEntry[];
  responses: PointEntry[];
  keyPlayers: KeyPlayerGroup[];
  players: ScoutPlayerRow[];
  positions: PositionRow[];
  /** Milyen adaton áll az adott szegmens – lábjegyzetnek. */
  coverage: Record<ScoutingSegment, string>;
  insights: Record<ScoutingSegment, InsightFragment[]>;
}
