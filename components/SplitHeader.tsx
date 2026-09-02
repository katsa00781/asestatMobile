/**
 * Összehasonlító fejléc – két oldal egymás mellett (P13 3. pont).
 *
 * Két 50-50%-os oszlop 12pt réssel: mindkettő egy 72pt magas kártya bal
 * oldali accent sávval (bal cián, jobb narancs), benne a felirat és a
 * meccsszám. A mérleg a kártya **alatt** áll: nyerő oldalon zölden, egyébként
 * halványan – ahogy a prompt írja.
 */
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { GlowCard } from '@/components/GlowCard';
import {
  type AccentTone,
  colors,
  fontSize,
  letterSpacing,
  spacing,
  tracking,
} from '@/constants/theme';
import type { SplitSide } from '@/types/situational';

interface SplitHeaderProps {
  home: SplitSide;
  away: SplitSide;
  /** Kívülről csak elhelyezés (margó). */
  style?: StyleProp<ViewStyle>;
}

/** A prompt kártyamagassága. */
const CARD_HEIGHT = 72;

export function SplitHeader({ home, away, style }: SplitHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <SplitColumn side={home} tone="cyan" />
      <SplitColumn side={away} tone="orange" />
    </View>
  );
}

function SplitColumn({ side, tone }: { side: SplitSide; tone: AccentTone }) {
  return (
    <View style={styles.column}>
      <GlowCard accent={tone} corner="lg" padding={14} style={styles.card}>
        <Text
          className="font-condensed text-label uppercase text-secondary"
          style={styles.label}
          numberOfLines={1}
        >
          {side.label}
        </Text>
        <Text className="font-mono text-xl text-primary" style={styles.value} numberOfLines={1}>
          {side.gamesText}
        </Text>
      </GlowCard>

      <Text
        className="font-mono text-sm"
        style={[
          styles.record,
          { color: side.winning ? colors.semantic.positive : colors.text.muted },
        ]}
        numberOfLines={1}
      >
        {side.recordText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  column: {
    flex: 1,
  },
  card: {
    height: CARD_HEIGHT,
    justifyContent: 'center',
  },
  label: {
    letterSpacing: letterSpacing(fontSize.label, tracking.label),
    marginBottom: 6,
  },
  value: {
    letterSpacing: letterSpacing(fontSize.xl, tracking.snug),
    fontVariant: ['tabular-nums'],
  },
  record: {
    marginTop: spacing[2],
    fontVariant: ['tabular-nums'],
  },
});
