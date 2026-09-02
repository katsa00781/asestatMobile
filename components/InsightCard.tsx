/**
 * Összegző kártya – „MEGÁLLAPÍTÁS" (P13 5. pont).
 *
 * Bal oldali 3pt cián sáv, felül a címke, alatta a szöveg DM Sans 15pt-tal,
 * 1.5-es sorközzel. A szövegben a számok monospace-szel és cián színnel
 * emelkednek ki – ezt a hívó adja darabokban (`InsightFragment`).
 *
 * A szöveg **nem** AI-generált: sablonból áll össze a kiszámolt számokból.
 * A mobil app nem generál tartalmat, csak a mentett riportokat olvassa.
 */
import { StyleSheet, Text } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { GlowCard } from '@/components/GlowCard';
import { colors, fontSize, letterSpacing, spacing, tracking } from '@/constants/theme';
import type { InsightFragment } from '@/types/situational';

interface InsightCardProps {
  fragments: InsightFragment[];
  /** A kártya címkéje – alapértelmezésben „Megállapítás". */
  label?: string;
  /** Kívülről csak elhelyezés (margó). */
  style?: StyleProp<ViewStyle>;
}

/** 15pt szöveg 1.5-es sorközzel. */
const LINE_HEIGHT = 23;

export function InsightCard({ fragments, label = 'Megállapítás', style }: InsightCardProps) {
  return (
    <GlowCard accent="cyan" corner="lg" padding={16} style={style}>
      <Text
        className="font-condensed text-label uppercase text-muted"
        style={styles.label}
        accessibilityRole="header"
      >
        {label}
      </Text>

      <Text className="font-body text-md text-primary" style={styles.body}>
        {fragments.map((fragment, index) =>
          fragment.emphasis ? (
            <Text key={index} className="font-mono text-md" style={styles.emphasis}>
              {fragment.text}
            </Text>
          ) : (
            fragment.text
          ),
        )}
      </Text>
    </GlowCard>
  );
}

const styles = StyleSheet.create({
  label: {
    letterSpacing: letterSpacing(fontSize.label, tracking.label),
    marginBottom: spacing[2],
  },
  body: {
    lineHeight: LINE_HEIGHT,
  },
  emphasis: {
    color: colors.accent.cyan,
    fontVariant: ['tabular-nums'],
  },
});
