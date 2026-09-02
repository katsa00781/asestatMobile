/**
 * Vízszintes arányjelző sáv.
 *
 * Mockup: `docs/mockups/extracted/p0-style-tile.html` („Egyéb elemek") – 6pt
 * magas, 3pt sarkú sáv, surface3 vályúval. A mockup kitöltése cián gradiens
 * külső glow-val; itt tömör accent szín áll helyette, mert a gradiens külön
 * könyvtárat (`expo-linear-gradient`) igényelne, a színes glow-t pedig RN nem
 * tudja megbízhatóan (D-005).
 */
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { type AccentTone, accentColor, colors, radius } from '@/constants/theme';

interface ProgressBarProps {
  /** 0–100 skálán; ezen kívüli érték a két végponthoz vágódik. */
  value: number;
  tone?: AccentTone;
  /** Kívülről csak elhelyezés (margó, szélesség). */
  style?: StyleProp<ViewStyle>;
}

/** A mockup sávmagassága. */
const BAR_HEIGHT = 6;

export function ProgressBar({ value, tone = 'cyan', style }: ProgressBarProps) {
  const filled = Math.max(0, Math.min(100, value));

  return (
    <View style={[styles.track, style]}>
      <View
        style={{
          width: `${filled}%`,
          height: '100%',
          borderRadius: radius.pill,
          backgroundColor: accentColor[tone],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: BAR_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.surface3,
    overflow: 'hidden',
  },
});
