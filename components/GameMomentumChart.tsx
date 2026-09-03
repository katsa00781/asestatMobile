/**
 * Momentum chart – a kumulatív pontkülönbség alakulása negyedenként
 * (victory-native XL + Skia). A webes „Momentum (Kumulatív Pontkülönbség)"
 * kártya mobil párja.
 *
 * A pozitív érték a saját csapat vezetését jelenti, a negatív az ellenfélét.
 * A vászonra egy halvány nulla-alapvonal is kerül, hogy az előjelváltás
 * ránézésre látsszon.
 *
 * Az adat a kosarstat importból jön (negyedenkénti bontás) – valós
 * play-by-play nincs, ezért a görbe legfeljebb negyed pontosságú (D-095).
 * Két negyednél kevesebb adatnál nincs értelmezhető görbe: ott a chart helyén
 * magyarázó sor áll (D-047 mintája).
 */
import { StyleSheet, Text, View } from 'react-native';
import { CartesianChart, Line, Scatter } from 'victory-native';
import { useFont } from '@shopify/react-native-skia';

import { GlowCard } from '@/components/GlowCard';
import {
  chartAxis,
  chartDomainPadding,
  chartFontSource,
  chartPadding,
  chartSeries,
  chartStroke,
  chartZeroLine,
} from '@/constants/chart-theme';
import { spacing } from '@/constants/theme';
import type { MomentumPoint } from '@/types/games';

const CHART_HEIGHT = 200;

/**
 * `type` (nem `interface`), mert a victory-native `CartesianChart` a
 * `Record<string, unknown>`-ra szűkíti a bemenetet – ehhez index-szignatúra
 * kell, amit a TS interfészre nem vezet le.
 */
type MomentumDatum = {
  quarter: number;
  diff: number;
  /** Konstans 0 – ez rajzolja a nulla-alapvonalat második adatsorként. */
  zero: number;
};

interface GameMomentumChartProps {
  momentum: MomentumPoint[];
  /** A saját csapatunk rövid neve. */
  ourName: string;
  opponent: string;
}

export function GameMomentumChart({ momentum, ourName, opponent }: GameMomentumChartProps) {
  const font = useFont(chartFontSource, chartAxis.labelSize);

  if (momentum.length < 2) {
    return (
      <Text className="font-body text-sm text-muted" style={styles.note}>
        Ehhez a meccshez nincs elég negyedadat a momentum görbéhez.
      </Text>
    );
  }

  const data: MomentumDatum[] = momentum.map((point) => ({
    quarter: point.quarter,
    diff: point.diff,
    zero: 0,
  }));

  return (
    <View style={styles.block}>
      <GlowCard corner="lg" padding={spacing[3]}>
        <View style={{ height: CHART_HEIGHT }}>
          <CartesianChart
            data={data}
            xKey="quarter"
            yKeys={['diff', 'zero']}
            padding={chartPadding}
            domainPadding={chartDomainPadding}
            axisOptions={{
              font,
              labelColor: chartAxis.labelColor,
              labelOffset: chartAxis.labelOffset,
              tickCount: chartAxis.tickCount,
              lineColor: chartAxis.lineColor,
              lineWidth: chartAxis.lineWidth,
              formatXLabel: (value) => `N${Math.round(Number(value))}`,
              formatYLabel: (value) => signed(Math.round(Number(value))),
            }}
          >
            {({ points }) => (
              <>
                <Line points={points.zero} color={chartZeroLine} strokeWidth={1} />
                <Line
                  points={points.diff}
                  color={chartSeries.cyan}
                  strokeWidth={chartStroke.line}
                  curveType="monotoneX"
                  animate={{ type: 'timing', duration: 300 }}
                />
                <Scatter
                  points={points.diff}
                  radius={chartStroke.dot}
                  color={chartSeries.cyan}
                  style="fill"
                />
              </>
            )}
          </CartesianChart>
        </View>
      </GlowCard>

      <Text className="font-body text-xs text-secondary" style={styles.caption}>
        Pozitív: {ourName} vezet · Negatív: {opponent} vezet
      </Text>
    </View>
  );
}

/** `+7` / `-3` / `0` – az előjel a momentumnál információ. */
function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

const styles = StyleSheet.create({
  block: {
    marginHorizontal: spacing[4],
    gap: spacing[2],
  },
  note: {
    marginHorizontal: spacing[4],
  },
  caption: {
    textAlign: 'center',
  },
});
