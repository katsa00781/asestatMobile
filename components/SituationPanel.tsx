/**
 * Játékhelyzetek mérlege – soronként a mérleg, a nyerési arány és egy
 * arányjelző sáv.
 *
 * A felépítés a `ShootingPanel`-é: egy `GlowCard`, benne címke + numerikus
 * érték + `ProgressBar`. A sáv hangneme a nyerési arányból jön, ahogy a webes
 * `SituationalAnalysis` `WinRateBar`-jánál is: 60% fölött zöld, 40% fölött
 * sárga, alatta piros.
 */
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { GlowCard } from '@/components/GlowCard';
import { ProgressBar } from '@/components/ProgressBar';
import { type AccentTone, fontSize, letterSpacing, spacing, tracking } from '@/constants/theme';
import type { SituationEntry } from '@/types/situational';

interface SituationPanelProps {
  entries: SituationEntry[];
  /** Kívülről csak elhelyezés (margó). */
  style?: StyleProp<ViewStyle>;
}

export function SituationPanel({ entries, style }: SituationPanelProps) {
  return (
    <GlowCard corner="lg" padding={14} style={style}>
      {entries.map((entry, index) => (
        <View key={entry.label} style={index > 0 ? styles.spaced : undefined}>
          <View style={styles.header}>
            <Text
              className="flex-1 font-condensed text-label uppercase text-secondary"
              style={styles.label}
              numberOfLines={1}
            >
              {entry.label}
            </Text>
            <Text className="font-mono text-tiny text-muted" style={styles.numeric}>
              {entry.recordText}
            </Text>
            <Text className="font-mono text-md text-primary" style={styles.rate}>
              {entry.rateText}
            </Text>
          </View>
          <ProgressBar value={entry.ratePercent} tone={rateTone(entry.ratePercent)} />
        </View>
      ))}
    </GlowCard>
  );
}

function rateTone(percent: number): AccentTone {
  if (percent >= 60) return 'positive';
  if (percent >= 40) return 'warning';
  return 'negative';
}

const styles = StyleSheet.create({
  spaced: {
    marginTop: spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[2],
    marginBottom: 6,
  },
  label: {
    letterSpacing: letterSpacing(fontSize.label, tracking.label),
  },
  numeric: {
    fontVariant: ['tabular-nums'],
  },
  rate: {
    // Fix szélesség, hogy a százalékok tizedespontja egy vonalban maradjon.
    width: 58,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
