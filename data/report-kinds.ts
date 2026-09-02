/**
 * A riportlista szűrő-chipjei és a `report_type` oszlopok magyar feliratai.
 *
 * A három riporttábla `report_type` értékkészlete külön él, de a hub egyetlen
 * listát mutat, ezért a leképezés `kind` szerint van csoportosítva. Ismeretlen
 * értékre a `kind` alapértelmezett felirata jön – így egy később bevezetett
 * riporttípus nem üres badge-dzsel jelenik meg.
 */
import type { ReportKind } from '@/types/analysis';

/** A hub chipsora. A `null` kulcs a szűretlen listát jelenti. */
export interface ReportFilter {
  key: string;
  label: string;
  /** `null` = minden riport. */
  kind: ReportKind | null;
}

export const REPORT_FILTERS: ReportFilter[] = [
  { key: 'all', label: 'Mind', kind: null },
  { key: 'game', label: 'Meccs', kind: 'game' },
  { key: 'team', label: 'Csapat', kind: 'team' },
  { key: 'player', label: 'Játékos', kind: 'player' },
];

export const DEFAULT_REPORT_FILTER = 'all';

/** `report_type` → badge felirat, riportfajtánként. */
const TYPE_LABELS: Record<ReportKind, Record<string, string>> = {
  game: {
    pregame: 'Pregame',
    postgame: 'Postgame',
    combined: 'Összesített',
    manual: 'Manuális',
  },
  team: {
    season_coach: 'Edzői',
    season_scouting: 'Scouting',
    season_fan: 'Szurkolói',
    manual: 'Manuális',
  },
  player: {
    season: 'Szezon',
    manual: 'Manuális',
  },
};

/** Tartalék felirat, ha a `report_type` nem szerepel a leképezésben. */
const FALLBACK_LABELS: Record<ReportKind, string> = {
  game: 'Meccs',
  team: 'Csapat',
  player: 'Játékos',
};

export function reportTypeLabel(kind: ReportKind, reportType: unknown): string {
  const key = typeof reportType === 'string' ? reportType : '';
  return TYPE_LABELS[kind][key] ?? FALLBACK_LABELS[kind];
}
