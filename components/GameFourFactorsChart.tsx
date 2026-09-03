/**
 * Four Factors oszlopdiagram – a meccs négy tényezője a saját csapat és az
 * ellenfél összevetésében (victory-native XL + Skia). A webes „Four Factors
 * Összevetés" kártya mobil párja.
 *
 * Négy kategória (eFG%, TOV%, ORB%, FT%), kategóriánként két oszlop: a saját
 * csapat cián, az ellenfél tompa kék. A büntetőráta már a `useGameDetails`-ben
 * százalékpontra van váltva (D-096), így mind a négy oszlop ugyanarra az Y
 * tengelyre kerül. Az oszlopok tetején az érték Skia felirattal.
 *
 * Kosarstat-metrika nélkül nincs mit rajzolni – ott a chart helyén magyarázó
 * sor áll (D-047 mintája).
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarGroup, CartesianChart, type PointsArray } from 'victory-native';
import { Text as SkiaText, type SkFont, useFont } from '@shopify/react-native-skia';

import { GlowCard } from '@/components/GlowCard';
import { chartAxis, chartFontSource, chartPadding, chartSeries } from '@/constants/chart-theme';
import { spacing } from '@/constants/theme';
import { formatDecimal } from '@/lib/format';
import type { FourFactorRow } from '@/types/games';

const CHART_HEIGHT = 220;

/**
 * `type` (nem `interface`), mert a victory-native `CartesianChart` a
 * `Record<string, unknown>`-ra szűkíti a bemenetet – ehhez index-szignatúra
 * kell, amit a TS interfészre nem vezet le.
 */
type FactorDatum = {
  /** 0-alapú kategóriaindex – ez a chart X tengelye. */
  index: number;
  our: number;
  opp: number;
  /** `eFG%` … – az X tengely felirata. */
  label: string;
};

/** A `BarGroup` által mért oszlopgeometria – ezzel igazítjuk az értékfeliratokat. */
type BarSize = { barWidth: number; groupWidth: number; gapWidth: number };

interface GameFourFactorsChartProps {
  factors: FourFactorRow[];
  /** A saját csapatunk rövid neve. */
  ourName: string;
  opponent: string;
}

export function GameFourFactorsChart({ factors, ourName, opponent }: GameFourFactorsChartProps) {
  const font = useFont(chartFontSource, chartAxis.labelSize);
  const [bar, setBar] = useState<BarSize>({ barWidth: 0, groupWidth: 0, gapWidth: 0 });

  if (factors.length === 0) {
    return (
      <Text className="font-body text-sm text-muted" style={styles.note}>
        Ehhez a meccshez nincs kosarstat-alapú four factors adat.
      </Text>
    );
  }

  const data: FactorDatum[] = factors.map((factor, index) => ({
    index,
    our: round1(factor.our),
    opp: round1(factor.opp),
    label: factor.label,
  }));

  const maxValue = Math.max(...data.flatMap((datum) => [datum.our, datum.opp]), 0);
  // Fejtérrel az oszlopfeliratoknak, ötös rácsra kerekítve.
  const maxY = Math.max(5, Math.ceil((maxValue * 1.18) / 5) * 5);

  return (
    <View style={styles.block}>
      <GlowCard corner="lg" padding={spacing[3]}>
        <View style={{ height: CHART_HEIGHT }}>
          <CartesianChart
            data={data}
            xKey="index"
            yKeys={['our', 'opp']}
            domain={{ y: [0, maxY] }}
            padding={chartPadding}
            domainPadding={{ left: 44, right: 44, top: 12, bottom: 0 }}
            axisOptions={{
              font,
              labelColor: chartAxis.labelColor,
              labelOffset: chartAxis.labelOffset,
              tickCount: { x: data.length, y: chartAxis.tickCount.y },
              lineColor: chartAxis.lineColor,
              lineWidth: chartAxis.lineWidth,
              formatXLabel: (value) => data[Number(value)]?.label ?? '',
              formatYLabel: (value) => String(Math.round(Number(value))),
            }}
          >
            {({ points, chartBounds }) => (
              <>
                <BarGroup
                  chartBounds={chartBounds}
                  betweenGroupPadding={0.35}
                  withinGroupPadding={0.15}
                  roundedCorners={{ topLeft: 3, topRight: 3 }}
                  onBarSizeChange={setBar}
                >
                  <BarGroup.Bar
                    points={points.our}
                    color={chartSeries.cyan}
                    animate={{ type: 'timing', duration: 300 }}
                  />
                  <BarGroup.Bar
                    points={points.opp}
                    color={chartSeries.neutral}
                    animate={{ type: 'timing', duration: 300 }}
                  />
                </BarGroup>
                {font ? (
                  <>
                    {barLabels(points.our, 0, bar, font, chartSeries.cyan)}
                    {barLabels(points.opp, 1, bar, font, chartAxis.labelColor)}
                  </>
                ) : null}
              </>
            )}
          </CartesianChart>
        </View>
      </GlowCard>

      <View style={styles.legend}>
        <LegendItem color={chartSeries.cyan} label={ourName} />
        <LegendItem color={chartSeries.neutral} label={opponent} />
      </View>
    </View>
  );
}

/**
 * Az oszlopok tetejére írt érték. A `BarGroup` a csoport közepéhez képest
 * tolja el az oszlopokat (`getBarGroupOffset` képlete) – ugyanezt számoljuk itt
 * a felirat vízszintes középre igazításához.
 */
function barLabels(
  pointSet: PointsArray,
  barIndex: number,
  { barWidth, groupWidth, gapWidth }: BarSize,
  font: SkFont,
  color: string,
) {
  if (barWidth <= 0) return null;

  return pointSet.map((point, i) => {
    if (typeof point.y !== 'number') return null;

    const offset = -groupWidth / 2 + barIndex * (barWidth + gapWidth);
    const centerX = point.x + offset + barWidth / 2;
    const text = formatDecimal(Number(point.yValue), 1);
    const width = font.measureText(text).width;

    return (
      <SkiaText
        key={i}
        x={centerX - width / 2}
        y={point.y - 5}
        text={text}
        font={font}
        color={color}
      />
    );
  });
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text className="font-body text-xs text-secondary" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Egy tizedes – a metrikák így is érkeznek a `@core`-ból. */
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

const styles = StyleSheet.create({
  block: {
    marginHorizontal: spacing[4],
    gap: spacing[2],
  },
  note: {
    marginHorizontal: spacing[4],
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[4],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flexShrink: 1,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
