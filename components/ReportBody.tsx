/**
 * Mentett AI riport szövegtörzse – az app egyetlen hosszú szöveges blokkja.
 *
 * Design prompt: `asestats/context/mobile/mobile-design-prompts.md` P10.
 * A törzs bal szélén 2pt-os lila sáv fut (felül és alul elhalványulva), a
 * szöveg 12pt-tal beljebb tolva – ez jelzi, hogy AI generált tartalom.
 *
 * A blokkokra bontást és a hiányzó glifák pótlását a `lib/report-format` végzi
 * (D-064, D-065); ez a komponens csak megjeleníti őket.
 */
import { useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, RotateCcw, X, type LucideIcon } from 'lucide-react-native';

import { colors, spacing } from '@/constants/theme';
import { parseReport, type OutcomeTone, type ReportBlock } from '@/lib/report-format';

/** A megállapítás hangneme → ikon és szín. */
const OUTCOME_ICONS: Record<OutcomeTone, LucideIcon> = {
  positive: Check,
  warning: RotateCcw,
  negative: X,
};

const OUTCOME_COLORS: Record<OutcomeTone, string> = {
  positive: colors.semantic.positive,
  warning: colors.semantic.warning,
  negative: colors.semantic.negative,
};

/** A megállapítás ikonjának oszlopa – az indoklás ehhez igazodik behúzással. */
const ICON_COLUMN = 22;

/** Az AI sáv gradiense: felül és alul elhalványul (P10). */
const RAIL_COLORS = ['transparent', colors.accent.ai, colors.accent.ai, 'transparent'] as const;
const RAIL_STOPS = [0, 0.08, 0.92, 1] as const;

interface ReportBodyProps {
  narrative: string;
  /** Kívülről csak elhelyezés (margó) – tipográfiát ne írj át. */
  style?: StyleProp<ViewStyle>;
}

export function ReportBody({ narrative, style }: ReportBodyProps) {
  const blocks = useMemo(() => parseReport(narrative), [narrative]);

  return (
    <View style={[styles.body, style]}>
      <LinearGradient
        colors={RAIL_COLORS}
        locations={RAIL_STOPS}
        style={styles.rail}
        pointerEvents="none"
      />

      <View style={styles.content}>
        {blocks.map((block, index) => (
          <Block key={index} block={block} first={index === 0} />
        ))}
      </View>
    </View>
  );
}

function Block({ block, first }: { block: ReportBlock; first: boolean }) {
  // Az első blokk nem kap felső rést, hogy a törzs a fejléchez igazodjon.
  const spacingStyle = first ? styles.firstBlock : null;

  if (block.kind === 'heading') {
    return (
      <Text
        className="font-condensed text-lg text-primary"
        style={[styles.heading, spacingStyle]}
        accessibilityRole="header"
      >
        {block.text}
      </Text>
    );
  }

  if (block.kind === 'outcome') {
    const Icon = OUTCOME_ICONS[block.tone];

    return (
      <View style={[styles.outcome, spacingStyle]}>
        <Icon size={16} color={OUTCOME_COLORS[block.tone]} strokeWidth={2.2} />
        <Text className="flex-1 font-body-medium text-md text-primary" style={styles.outcomeText}>
          {block.text}
        </Text>
      </View>
    );
  }

  if (block.kind === 'note') {
    return (
      <Text className="font-body text-md text-secondary" style={[styles.note, spacingStyle]}>
        {block.text}
      </Text>
    );
  }

  return (
    <Text className="font-body text-md text-primary" style={[styles.paragraph, spacingStyle]}>
      {block.text}
    </Text>
  );
}

const styles = StyleSheet.create({
  body: {
    position: 'relative',
  },
  rail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
  },
  content: {
    paddingLeft: spacing[3],
  },
  firstBlock: {
    marginTop: 0,
  },
  heading: {
    marginTop: spacing[6],
  },
  paragraph: {
    marginTop: spacing[4],
    // P10: 15pt szöveg 1.6-os sorközzel.
    lineHeight: 24,
  },
  outcome: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: spacing[4],
  },
  outcomeText: {
    lineHeight: 22,
  },
  note: {
    marginTop: 6,
    marginLeft: ICON_COLUMN,
    lineHeight: 24,
  },
});
