/**
 * Játékos forma-trend – a szezon meccseinek pont- vagy értékelés-idősora
 * vonaldiagramon (victory-native XL + Skia).
 *
 * A `usePlayerDetails` a meccseket dátum szerint CSÖKKENŐ sorrendben adja, a
 * chart viszont időrendben nő – ezért itt megfordítjuk. A felső szegmentált
 * kontroll vált a két metrika közt (Pont / Értékelés): a webes „Pontok
 * meccsenként" és „Hatékonyság (VAL)" kártyák mobil párja egy vászonban.
 *
 * Kevesebb mint két meccsnél nincs értelmezhető trend – ott a chart helyén
 * magyarázó sor áll (D-047 mintája).
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CartesianChart, Line, Scatter } from 'victory-native';
import { useFont } from '@shopify/react-native-skia';

import { GlowCard } from '@/components/GlowCard';
import { SegmentedControl } from '@/components/SegmentedControl';
import {
  chartAxis,
  chartDomainPadding,
  chartFontSource,
  chartPadding,
  chartSeries,
  chartStroke,
  type ChartSeriesTone,
} from '@/constants/chart-theme';
import { spacing } from '@/constants/theme';
import type { PlayerGameRow } from '@/types/players';

const CHART_HEIGHT = 220;

type Metric = 'points' | 'valuation';

const SEGMENTS: { key: Metric; label: string; tone: ChartSeriesTone }[] = [
  { key: 'points', label: 'Pont', tone: 'cyan' },
  // A statisztikai értékelés (valuation) neve mindenhol VAL – a `PlayerGameLog`
  // is így rövidíti, a webes chart is „VAL"-t ír.
  { key: 'valuation', label: 'VAL', tone: 'orange' },
];

/**
 * `type` (nem `interface`), mert a victory-native `CartesianChart` a
 * `Record<string, unknown>`-ra szűkíti a bemenetet, amihez index-szignatúra
 * kell – azt interfészre a TS nem vezeti le.
 */
type TrendPoint = {
  /** 1-alapú meccssorszám a szezonban – ez a chart X tengelye. */
  index: number;
  points: number;
  valuation: number;
  /** `05.25` alak az X tengely feliratához. */
  label: string;
};

interface PlayerTrendChartProps {
  games: PlayerGameRow[];
}

export function PlayerTrendChart({ games }: PlayerTrendChartProps) {
  const [metric, setMetric] = useState<Metric>('points');
  const font = useFont(chartFontSource, chartAxis.labelSize);

  const data = useMemo<TrendPoint[]>(
    () =>
      [...games].reverse().map((game, i) => ({
        index: i + 1,
        points: game.points,
        valuation: game.valuation,
        label: shortDate(game.date),
      })),
    [games],
  );

  if (data.length < 2) {
    return (
      <Text className="font-body text-sm text-muted" style={styles.note}>
        A forma-trendhez legalább két lejátszott meccs kell.
      </Text>
    );
  }

  const active = SEGMENTS.find((segment) => segment.key === metric) ?? SEGMENTS[0];
  const color = chartSeries[active.tone];

  return (
    <View style={styles.block}>
      <SegmentedControl
        options={SEGMENTS.map(({ key, label }) => ({ key, label }))}
        activeKey={metric}
        onSelect={(key) => setMetric(key as Metric)}
        accessibilityLabel="Trend metrika"
      />

      <GlowCard corner="lg" padding={spacing[3]}>
        <View style={{ height: CHART_HEIGHT }}>
          <CartesianChart
            data={data}
            xKey="index"
            yKeys={[metric]}
            padding={chartPadding}
            domainPadding={chartDomainPadding}
            axisOptions={{
              font,
              labelColor: chartAxis.labelColor,
              labelOffset: chartAxis.labelOffset,
              tickCount: chartAxis.tickCount,
              lineColor: chartAxis.lineColor,
              lineWidth: chartAxis.lineWidth,
              formatXLabel: (value) => data[Number(value) - 1]?.label ?? '',
              formatYLabel: (value) => String(Math.round(Number(value))),
            }}
          >
            {({ points }) => (
              <>
                <Line
                  points={points[metric]}
                  color={color}
                  strokeWidth={chartStroke.line}
                  curveType="monotoneX"
                  animate={{ type: 'timing', duration: 300 }}
                />
                <Scatter
                  points={points[metric]}
                  radius={chartStroke.dot}
                  color={color}
                  style="fill"
                />
              </>
            )}
          </CartesianChart>
        </View>
      </GlowCard>
    </View>
  );
}

/** `2026-05-25` → `05.25` – ennyi fér az X tengely feliratába. */
function shortDate(iso: string): string {
  const match = /^\d{4}-(\d{2})-(\d{2})/.exec(iso);
  return match ? `${match[1]}.${match[2]}` : iso;
}

const styles = StyleSheet.create({
  block: {
    marginHorizontal: spacing[4],
    gap: spacing[3],
  },
  note: {
    marginHorizontal: spacing[4],
  },
});
