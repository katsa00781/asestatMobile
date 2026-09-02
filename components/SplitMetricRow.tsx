/**
 * Szembeállított metrikasor – hazai kontra vendég (P13 4. pont).
 *
 * Felül a metrika neve középre, alatta három zóna: balra a cián érték, jobbra
 * a narancs érték, közéjük a két szemben álló sáv egy közös középvonalról.
 * A prompt 3-4 oszlopos rácsot tilt: 390pt-on egy sor = egy metrika.
 *
 * A jobb teljesítményt adó oldal „glow-t" kap. RN-ben színes elmosott árnyék
 * nincs (D-005), ezért a glow itt is réteg: accent kitöltés + accent keret az
 * érték körül. A keret mindkét oldalon ott van (átlátszóan), hogy a számok
 * sorról sorra egy vonalban maradjanak.
 */
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import {
  colors,
  fontSize,
  glow,
  letterSpacing,
  radius,
  spacing,
  tracking,
} from '@/constants/theme';
import type { SplitMetric, SplitSideKey } from '@/types/situational';

interface SplitMetricRowProps {
  metric: SplitMetric;
  /** Az első sor fölé nem kell elválasztó vonal. */
  divided?: boolean;
  /** Kívülről csak elhelyezés (margó). */
  style?: StyleProp<ViewStyle>;
}

/** Az értékdoboz szélessége: az „+13.1" is elfér benne 22pt monóval. */
const VALUE_WIDTH = 88;
/** A sávok magassága a promptból. */
const BAR_HEIGHT = 6;

export function SplitMetricRow({ metric, divided = true, style }: SplitMetricRowProps) {
  return (
    <View style={[styles.row, divided ? styles.divided : null, style]}>
      <Text
        className="font-condensed text-label uppercase text-muted"
        style={styles.label}
        numberOfLines={1}
      >
        {metric.label}
      </Text>

      <View style={styles.values}>
        <Value
          text={metric.homeText}
          side="home"
          better={metric.better}
          color={colors.accent.cyan}
        />

        <View style={styles.bars}>
          <View style={styles.barLeft}>
            <View
              style={[
                styles.bar,
                { width: `${metric.homeShare * 100}%`, backgroundColor: colors.accent.cyan },
              ]}
            />
          </View>
          <View style={styles.barRight}>
            <View
              style={[
                styles.bar,
                { width: `${metric.awayShare * 100}%`, backgroundColor: colors.accent.orange },
              ]}
            />
          </View>
        </View>

        <Value
          text={metric.awayText}
          side="away"
          better={metric.better}
          color={colors.accent.orange}
        />
      </View>
    </View>
  );
}

interface ValueProps {
  text: string;
  side: SplitSideKey;
  better: SplitSideKey | null;
  color: string;
}

function Value({ text, side, better, color }: ValueProps) {
  const highlighted = better === side;
  const tone = side === 'home' ? glow.cyan : glow.orange;

  return (
    <View
      style={[
        styles.valueBox,
        {
          backgroundColor: highlighted ? tone.fill : 'transparent',
          borderColor: highlighted ? tone.border : 'transparent',
        },
      ]}
    >
      <Text
        className="font-mono text-h3"
        style={[styles.value, { color, textAlign: side === 'home' ? 'left' : 'right' }]}
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing[4],
  },
  divided: {
    borderTopWidth: 1,
    borderTopColor: colors.border.hairline,
  },
  label: {
    textAlign: 'center',
    letterSpacing: letterSpacing(fontSize.label, tracking.label),
    marginBottom: 10,
  },
  values: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  valueBox: {
    width: VALUE_WIDTH,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  value: {
    letterSpacing: letterSpacing(fontSize.h3, tracking.tight),
    fontVariant: ['tabular-nums'],
  },
  bars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  barLeft: {
    flex: 1,
    alignItems: 'flex-end',
  },
  barRight: {
    flex: 1,
    alignItems: 'flex-start',
  },
  bar: {
    height: BAR_HEIGHT,
    borderRadius: radius.pill,
  },
});
