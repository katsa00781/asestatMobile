/**
 * Az élő meccsstatisztika megjelenítési modellje: saját kontra ellenfél
 * metrikasorok a `SplitMetricRow`-hoz (bal = saját, cián; jobb = ellenfél,
 * narancs). A sorrend a netcasting „Statisztikák" paneljét követi.
 */
import { formatDecimal } from '@/lib/format';
import type { LiveTeamStats } from '@/types/live';
import type { SplitMetric, SplitSideKey } from '@/types/situational';

interface MetricSpec {
  label: string;
  own: number;
  opponent: number;
  /** Százalék (egy tizedes) vagy darabszám. */
  kind: 'percent' | 'count';
  lowerIsBetter?: boolean;
}

export function buildLiveTeamMetrics(own: LiveTeamStats, opponent: LiveTeamStats): SplitMetric[] {
  const specs: MetricSpec[] = [
    { label: 'Mezőny %', own: fieldGoalPct(own), opponent: fieldGoalPct(opponent), kind: 'percent' },
    {
      label: 'Kettes %',
      own: pct(own.twoMade, own.twoAttempted),
      opponent: pct(opponent.twoMade, opponent.twoAttempted),
      kind: 'percent',
    },
    {
      label: 'Hármas %',
      own: pct(own.threeMade, own.threeAttempted),
      opponent: pct(opponent.threeMade, opponent.threeAttempted),
      kind: 'percent',
    },
    {
      label: 'Büntető %',
      own: pct(own.freeThrowMade, own.freeThrowAttempted),
      opponent: pct(opponent.freeThrowMade, opponent.freeThrowAttempted),
      kind: 'percent',
    },
    { label: 'Lepattanó', own: own.rebounds, opponent: opponent.rebounds, kind: 'count' },
    { label: 'Szerzett labda', own: own.steals, opponent: opponent.steals, kind: 'count' },
    {
      label: 'Eladott labda',
      own: own.turnovers,
      opponent: opponent.turnovers,
      kind: 'count',
      lowerIsBetter: true,
    },
    { label: 'Assziszt', own: own.assists, opponent: opponent.assists, kind: 'count' },
    { label: 'Fault', own: own.fouls, opponent: opponent.fouls, kind: 'count', lowerIsBetter: true },
    { label: 'Kiharcolt fault', own: own.foulsDrawn, opponent: opponent.foulsDrawn, kind: 'count' },
    { label: 'Értékelés', own: own.valuation, opponent: opponent.valuation, kind: 'count' },
  ];

  return specs.map(toMetric);
}

function fieldGoalPct(stats: LiveTeamStats): number {
  return pct(stats.twoMade + stats.threeMade, stats.twoAttempted + stats.threeAttempted);
}

/** Százalék nevezővédelemmel – dobáskísérlet nélkül 0, nem NaN. */
function pct(made: number, attempted: number): number {
  return attempted > 0 ? (made / attempted) * 100 : 0;
}

function toMetric(spec: MetricSpec): SplitMetric {
  const format = (value: number) =>
    spec.kind === 'percent' ? formatDecimal(value, 1) : String(Math.round(value));

  // A sávok a nagyobb abszolút értékhez normalizálódnak, ahogy a Szituációk és
  // a Scouting képernyőn. Az értékelés meccs elején negatív is lehet.
  const scale = Math.max(Math.abs(spec.own), Math.abs(spec.opponent));

  return {
    label: spec.label,
    homeText: format(spec.own),
    awayText: format(spec.opponent),
    homeShare: scale > 0 ? Math.abs(spec.own) / scale : 0,
    awayShare: scale > 0 ? Math.abs(spec.opponent) / scale : 0,
    better: betterSide(spec),
  };
}

function betterSide(spec: MetricSpec): SplitSideKey | null {
  if (spec.own === spec.opponent) return null;
  const ownBetter = spec.lowerIsBetter ? spec.own < spec.opponent : spec.own > spec.opponent;
  return ownBetter ? 'home' : 'away';
}
