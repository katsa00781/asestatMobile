/**
 * Szekciócímke egy listán belül (pl. „Közelgő" / „Lejátszott").
 *
 * Ugyanaz a tipográfia, mint a `FormStrip` és a kártyák eyebrow felirata:
 * Barlow Condensed 11pt, ALL CAPS, `tracking.label` betűközzel.
 */
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

import { fontSize, letterSpacing, tracking } from '@/constants/theme';

interface SectionLabelProps {
  label: string;
  /** Kívülről csak elhelyezés (margó) – tipográfiát ne írj át. */
  style?: StyleProp<ViewStyle>;
}

export function SectionLabel({ label, style }: SectionLabelProps) {
  return (
    <View style={[styles.block, style]}>
      <Text
        className="font-condensed text-label uppercase text-secondary"
        style={styles.label}
        accessibilityRole="header"
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: 10,
  },
  label: {
    letterSpacing: letterSpacing(fontSize.label, tracking.label),
  },
});
