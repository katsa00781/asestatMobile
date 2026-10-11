/**
 * A post-game elemzés képernyő megjelenítési modellje.
 *
 * A számítást a `@core/postgame-report` végzi, ez a fájl csak a képernyőre
 * kész alakot írja le: minden szöveg már `plainText`-en ment át, minden szám
 * formázott – a komponensek nem kerekítenek és nem fordítanak.
 *
 * A szövegek **szabályalapúak**, nem AI-generáltak: lila jelölést csak a
 * mentett LLM-szöveg (`report`) kap (D-122).
 */
import type { MatrixColumn, MatrixRow } from '@/components/StatMatrix';
import type { StatListItem } from '@/components/StatList';
import type { RowMetric } from '@/components/StackedRow';
import type { StatTrend } from '@/components/StatTile';
import type { AccentTone } from '@/constants/theme';
import type { GameReport } from '@/types/games';
import type { MeterEntry } from '@/types/roles';
import type { PointEntry } from '@/types/scouting';
import type { SplitMetric } from '@/types/situational';

export interface PostgameKpis {
  /** „85–78" */
  scoreText: string;
  marginTrend: StatTrend;
  paceText: string;
  efgText: string;
}

/** Az összefoglaló egy pontja; a „Címke: szöveg” alakú sor címkéje külön jön. */
export interface SummaryItem {
  label: string | null;
  text: string;
}

/** Az összefoglaló egy szakasza (pl. „Játékos kiemelések”). */
export interface SummarySection {
  /** Üres, ha a `@core` szövege tagolatlan. */
  title: string;
  /** A „Következő fókusz” szakasz kiemelve jelenik meg. */
  focus: boolean;
  items: SummaryItem[];
}

/** Egy kulcsmutató sora: meccs / referencia / különbség (referencia nélkül „–”), alcímben a ligamedián. */
export interface KeyStatRow {
  key: string;
  label: string;
  subtitle?: string;
  metrics: RowMetric[];
}

export interface ShotMapView {
  title: string;
  rates: StatListItem[];
  efficiency: StatListItem[];
  zoneColumns: MatrixColumn[];
  zoneRows: MatrixRow[];
  /** Figyelmeztető sor, ha a dobásszám eltér a box score mezőnykísérleteitől; egyébként `null`. */
  coverageNote: string | null;
  /** Alacsony mintánál figyelmeztető sor, egyébként `null`. */
  sampleNote: string | null;
}

export interface DecisiveItem {
  text: string;
  /** A tényező a csapat kárára szólt-e (▼) – a `@core` `tone`-ja, régi riportnál szövegből becsülve. */
  negative: boolean;
}

export interface DecisiveGroup {
  title: string;
  axis: 'offense' | 'defense';
  items: DecisiveItem[];
}

export interface HighlightView {
  label: string;
  tone: AccentTone;
  name: string | null;
  summary: string;
  impactLabel: string | null;
}

export interface PostgamePlayerView {
  playerId: string;
  name: string;
  summary: string;
  impactLabel: string;
  usageLabel: string;
  tsText: string;
  valText: string;
  valPer36Text: string;
  strengths: PointEntry[];
  issues: PointEntry[];
  focus: PointEntry[];
  /** A weben mentett LLM-értékelés, ha van (csak olvasás). */
  report: GameReport | null;
}

/** A kulcsmutatók viszonyítási alapja: szezonátlag, vagy kis mintánál liga medián. */
export interface BaselineView {
  sectionLabel: string;
  columnLabel: string;
  /** Kis szezonmintánál a „Kis minta” jelzés szövege, egyébként `null`. */
  smallSampleNote: string | null;
}

export interface PostgameView {
  /** Az összefoglaló szakaszonként – a `@core` `parsePostgameSummary` bontása. */
  summary: SummarySection[];
  /** A `dataNotes` egy bekezdésben, vagy `null`. */
  notes: string | null;
  kpis: PostgameKpis;
  baseline: BaselineView;
  keyStats: KeyStatRow[];
  /** A két csapat neve a saját – ellenfél blokkok fölé. */
  ownName: string;
  opponentName: string;
  /** Box score alapmutatók saját – ellenfél párban; ellenfél box score nélkül `null`. */
  boxScore: SplitMetric[] | null;
  /**
   * Pontforrások a Kosarstat eseménylistájából (számított, nem hivatalos adat).
   * `null`, ha nincs eseményoldal, vagy a pontösszege nem egyezik a végeredménnyel.
   */
  pointSources: SplitMetric[] | null;
  shotProfile: MeterEntry[];
  shotMap: ShotMapView | null;
  decisiveGroups: DecisiveGroup[];
  positiveImpact: string;
  negativeImpact: string;
  highlights: HighlightView[];
  players: PostgamePlayerView[];
  strengths: PointEntry[];
  problems: PointEntry[];
  nextFocus: PointEntry[];
}
