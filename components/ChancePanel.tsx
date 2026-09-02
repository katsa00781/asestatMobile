/**
 * Esélylatolgatás – a modell által számolt győzelmi esély.
 *
 * Felül a két százalék (balra cián a sajátunk, jobbra narancs az ellenfélé),
 * középen a `ProgressBar` mutatja az arányt, alatta a bizonyosság badge-e és
 * annak indoklása. A sáv cián: a kitöltött rész a **saját** esélyünk.
 *
 * A szám modellezett valószínűség, nem tipp – ezt a lábjegyzet mondja ki.
 */
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { Badge } from '@/components/Badge';
import { GlowCard } from '@/components/GlowCard';
import { ProgressBar } from '@/components/ProgressBar';
import { colors, fontSize, letterSpacing, spacing, tracking } from '@/constants/theme';
import type { ChanceView } from '@/types/scouting';

interface ChancePanelProps {
  chance: ChanceView;
  /** Kívülről csak elhelyezés (margó). */
  style?: StyleProp<ViewStyle>;
}

export function ChancePanel({ chance, style }: ChancePanelProps) {
  return (
    <GlowCard corner="lg" padding={14} style={style}>
      <Text
        className="font-condensed text-label uppercase text-muted"
        style={styles.label}
        accessibilityRole="header"
      >
        Győzelmi esély
      </Text>

      <View style={styles.values}>
        <Text
          className="font-mono text-h3"
          style={[styles.value, { color: colors.accent.cyan }]}
          numberOfLines={1}
        >
          {chance.ownText}
        </Text>
        <Text
          className="font-mono text-h3"
          style={[styles.value, styles.right, { color: colors.accent.orange }]}
          numberOfLines={1}
        >
          {chance.opponentText}
        </Text>
      </View>

      <ProgressBar value={chance.ownPercent} />

      <View style={styles.footer}>
        <Badge label={chance.confidenceText} variant={chance.confidenceVariant} />
      </View>

      {chance.reasonText ? (
        <Text className="font-body text-sm text-muted" style={styles.reason}>
          {chance.reasonText}
        </Text>
      ) : null}
    </GlowCard>
  );
}

const styles = StyleSheet.create({
  label: {
    letterSpacing: letterSpacing(fontSize.label, tracking.label),
    marginBottom: spacing[2],
  },
  values: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  value: {
    letterSpacing: letterSpacing(fontSize.h3, tracking.tight),
    fontVariant: ['tabular-nums'],
  },
  right: {
    textAlign: 'right',
  },
  footer: {
    marginTop: spacing[3],
  },
  reason: {
    marginTop: spacing[2],
  },
});
