/**
 * Saját kontra ellenfél metrikasorok egy névsor alatt.
 *
 * A Szituációk és a Scouting jóváhagyott `SplitMetricRow` sorai, fölöttük egy
 * névsorral, hogy a cián (saját) és a narancs (ellenfél) oldal ki legyen
 * mondva (D-121). Az élő meccsstatisztika és a post-game elemzés használja.
 */
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { SplitMetricRow } from '@/components/SplitMetricRow';
import { colors, fontSize, letterSpacing, spacing, tracking } from '@/constants/theme';
import type { SplitMetric } from '@/types/situational';

interface TeamSplitListProps {
  ownName: string;
  opponentName: string;
  metrics: SplitMetric[];
  /** Kívülről csak elhelyezés (margó). */
  style?: StyleProp<ViewStyle>;
}

export function TeamSplitList({ ownName, opponentName, metrics, style }: TeamSplitListProps) {
  return (
    <View style={style}>
      <View style={styles.names}>
        <Text
          className="font-condensed text-label uppercase"
          style={[styles.name, { color: colors.accent.cyan }]}
          numberOfLines={1}
        >
          {ownName}
        </Text>
        <Text
          className="font-condensed text-label uppercase"
          style={[styles.name, styles.nameRight, { color: colors.accent.orange }]}
          numberOfLines={1}
        >
          {opponentName}
        </Text>
      </View>

      {metrics.map((metric, index) => (
        <SplitMetricRow key={metric.label} metric={metric} divided={index > 0} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  names: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  name: {
    flex: 1,
    letterSpacing: letterSpacing(fontSize.label, tracking.label),
  },
  nameRight: {
    textAlign: 'right',
  },
});
