/**
 * Clutch-bontás a Meccs részletein – a ±5 pontos állásnál játszott percek.
 *
 * Mockup ehhez nincs; a felépítés a `SituationPanel` / `ShootingPanel`
 * kártyáit követi: fejléc kártya a mintával és a clutch-állással, alatta a
 * mutatók `StatList`-ben, a legtöbbet birtoklók sora, végül a `Megállapítás`
 * és a lábjegyzet.
 *
 * Adathiány esetén (nincs kosarstat clutch-oldal, vagy nem volt elég szoros
 * clutch-perc) egy magyarázó sor marad, nem tűnik el a szekció (D-047 mintája).
 */
import { StyleSheet, Text, View } from 'react-native';

import { GlowCard } from '@/components/GlowCard';
import { InsightCard } from '@/components/InsightCard';
import { StatList } from '@/components/StatList';
import { colors, fontSize, letterSpacing, spacing, tracking } from '@/constants/theme';
import { buildClutchView } from '@/lib/clutch-view';
import type { KosarstatGameClutch } from '@core/kosarstat-clutch-parse';

interface ClutchPanelProps {
  clutch: KosarstatGameClutch | null;
  /** A saját csapatunk rövid neve. */
  ourName: string;
  opponent: string;
}

export function ClutchPanel({ clutch, ourName, opponent }: ClutchPanelProps) {
  const view = buildClutchView(clutch, ourName, opponent);

  if (view.state !== 'available') {
    return (
      <Text className="font-body text-sm text-muted" style={styles.note}>
        {view.footnote}
      </Text>
    );
  }

  return (
    <View style={styles.block}>
      <GlowCard corner="lg" padding={14} style={styles.header}>
        <View style={styles.headerCol}>
          <Text
            className="font-condensed text-label uppercase text-muted"
            style={styles.headerLabel}
          >
            Minta
          </Text>
          <Text className="font-mono text-h3 text-primary" style={styles.headerValue}>
            {view.sampleLabel}
          </Text>
        </View>

        <View style={[styles.headerCol, styles.headerColRight]}>
          <Text
            className="font-condensed text-label uppercase text-muted"
            style={styles.headerLabel}
          >
            Clutch állás
          </Text>
          <Text className="font-mono text-h3 text-primary" style={styles.headerValue}>
            {view.scoreText}
            <Text
              className="font-mono text-md"
              style={{
                color:
                  view.diffTone === 'positive'
                    ? colors.semantic.positive
                    : view.diffTone === 'negative'
                      ? colors.semantic.negative
                      : colors.text.muted,
              }}
            >
              {'  '}
              {view.diffText}
            </Text>
          </Text>
        </View>
      </GlowCard>

      <StatList items={view.metrics} style={styles.spaced} />

      {view.closersText ? (
        <GlowCard corner="lg" padding={14} style={styles.spaced}>
          <Text
            className="font-condensed text-label uppercase text-muted"
            style={styles.headerLabel}
          >
            Legtöbbet birtokló a clutchban
          </Text>
          <Text className="font-body text-sm text-secondary" style={styles.closers}>
            {view.closersText}
          </Text>
        </GlowCard>
      ) : null}

      <InsightCard fragments={view.insight} style={styles.spaced} />

      <Text className="font-body text-sm text-muted" style={styles.footnote}>
        {view.footnote}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginHorizontal: spacing[4],
  },
  note: {
    marginHorizontal: spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerCol: {
    flex: 1,
  },
  headerColRight: {
    alignItems: 'flex-end',
  },
  headerLabel: {
    letterSpacing: letterSpacing(fontSize.label, tracking.label),
    marginBottom: 6,
  },
  headerValue: {
    letterSpacing: letterSpacing(fontSize.h3, tracking.tight),
    fontVariant: ['tabular-nums'],
  },
  spaced: {
    marginTop: spacing[3],
  },
  closers: {
    marginTop: 6,
  },
  footnote: {
    marginTop: spacing[3],
  },
});
