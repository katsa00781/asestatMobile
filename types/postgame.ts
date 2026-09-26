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

export interface PostgameKpis {
  /** „85–78" */
  scoreText: string;
  marginTrend: StatTrend;
  paceText: string;
  efgText: string;
}

/** Egy kulcsmutató sora: meccs / szezon / különbség, alcímben a ligamedián. */
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
  /** Alacsony mintánál figyelmeztető sor, egyébként `null`. */
  sampleNote: string | null;
}

export interface DecisiveItem {
  text: string;
  /** A tényező a csapat kárára szólt-e (▼) – a web szövegből következteti ki. */
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

export interface PostgameView {
  summary: string;
  /** A `dataNotes` egy bekezdésben, vagy `null`. */
  notes: string | null;
  kpis: PostgameKpis;
  keyStats: KeyStatRow[];
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
