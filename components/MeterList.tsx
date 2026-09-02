/**
 * Arányjelző lista – soronként címke, érték, sáv és egy halvány kiegészítés.
 *
 * A `SituationPanel` felépítését viszi tovább (címke + numerikus érték +
 * `ProgressBar`), két eltéréssel: a sáv hangnemét a **hívó** adja, mert itt nem
 * minden sor minőségi mutató, és a sáv alá kerülhet egy magyarázó sor
 * (játékosnevek, nyers érték).
 */
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { GlowCard } from '@/components/GlowCard';
import { ProgressBar } from '@/components/ProgressBar';
import { fontSize, letterSpacing, spacing, tracking } from '@/constants/theme';
import type { MeterEntry } from '@/types/roles';

interface MeterListProps {
  entries: MeterEntry[];
  /** ALL CAPS fejléc a kártya tetején, ha kell. */
  label?: string;
  /** Kívülről csak elhelyezés (margó). */
  style?: StyleProp<ViewStyle>;
}

export function MeterList({ entries, label, style }: MeterListProps) {
  return (
    <GlowCard corner="lg" padding={14} style={style}>
      {label ? (
        <Text
          className="font-condensed text-label uppercase text-muted"
          style={styles.header}
          accessibilityRole="header"
        >
          {label}
        </Text>
      ) : null}

      {entries.map((entry, index) => (
        <View key={entry.label} style={index > 0 ? styles.spaced : undefined}>
          <View style={styles.row}>
            <Text
              className="flex-1 font-condensed text-label uppercase text-secondary"
              style={styles.label}
              numberOfLines={1}
            >
              {entry.label}
            </Text>
            <Text className="font-mono text-md text-primary" style={styles.value}>
              {entry.valueText}
            </Text>
          </View>

          <ProgressBar value={entry.percent} tone={entry.tone} />

          {entry.note ? (
            <Text className="font-body text-sm text-muted" style={styles.note}>
              {entry.note}
            </Text>
          ) : null}
        </View>
      ))}
    </GlowCard>
  );
}

const styles = StyleSheet.create({
  header: {
    letterSpacing: letterSpacing(fontSize.label, tracking.label),
    marginBottom: 10,
  },
  spaced: {
    marginTop: spacing[4],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[2],
    marginBottom: 6,
  },
  label: {
    letterSpacing: letterSpacing(fontSize.label, tracking.label),
  },
  value: {
    // Fix szélesség, hogy a tizedespontok egy vonalban maradjanak.
    width: 62,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  note: {
    marginTop: 6,
    lineHeight: 19,
  },
});
