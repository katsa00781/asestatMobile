/**
 * Szituációk – ugyanaz a csapat különböző körülmények között.
 *
 * Design prompt: `asestats/context/mobile/mobile-design-prompts.md` P13.
 * A prompt két szegmenst ír elő; itt három van (D-072): a hazai/vendég
 * összehasonlítás mellé a `@core/situational-analysis` játékhelyzetei és
 * negyedbontása is elfér, ezek nélkül a modul fele kihasználatlan maradna.
 *
 * Az adatot a `useSituationalData` tölti, a megjelenítési modellt a
 * `lib/situational-view` állítja össze – ez a fájl csak elrendez.
 */
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Crosshair } from 'lucide-react-native';

import { BackHeader } from '@/components/BackHeader';
import { EmptyState } from '@/components/EmptyState';
import { ErrorPanel } from '@/components/ErrorPanel';
import { InsightCard } from '@/components/InsightCard';
import { SectionLabel } from '@/components/SectionLabel';
import { SegmentedControl } from '@/components/SegmentedControl';
import { SituationPanel } from '@/components/SituationPanel';
import { SkeletonBlock } from '@/components/SkeletonBlock';
import { SplitHeader } from '@/components/SplitHeader';
import { SplitMetricRow } from '@/components/SplitMetricRow';
import { StatList } from '@/components/StatList';
import { StatMatrix } from '@/components/StatMatrix';
import { fontSize, letterSpacing, spacing, tracking } from '@/constants/theme';
import { useSituationalData } from '@/hooks/useSituationalData';
import type { SituationalSegment, SituationalView } from '@/types/situational';

const SEGMENTS = [
  { key: 'homeAway', label: 'Hazai / vendég' },
  { key: 'situations', label: 'Helyzetek' },
  { key: 'quarters', label: 'Negyedek' },
] as const;

/** A negyedbontás oszlopai – a négy sor elfér vízszintes görgetés nélkül. */
const QUARTER_COLUMNS = [
  { label: 'Szerzett', width: 56 },
  { label: 'Kapott', width: 52 },
  { label: 'Kül.', width: 52 },
  { label: 'Mérleg', width: 52 },
];

export default function SituationalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { view, hasGames, loading, error, reload } = useSituationalData();

  const [segment, setSegment] = useState<SituationalSegment>('homeAway');

  const ready = !error && !loading;

  return (
    <ScrollView
      className="flex-1 bg-base"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: spacing[6] }}
      showsVerticalScrollIndicator={false}
    >
      <BackHeader
        label="Elemzés"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/analysis'))}
      />

      <Text className="font-condensed text-lg uppercase text-primary" style={styles.title}>
        Szituációk
      </Text>

      {error ? <ErrorPanel message={error} onRetry={reload} /> : null}

      {!error && loading ? <SituationalSkeleton /> : null}

      {ready && view ? (
        <>
          <SegmentedControl
            options={SEGMENTS.map(({ key, label }) => ({ key, label }))}
            activeKey={segment}
            onSelect={(key) => setSegment(key as SituationalSegment)}
            accessibilityLabel="Nézet"
            style={styles.block}
          />

          {segment === 'homeAway' ? <HomeAwaySegment view={view} /> : null}
          {segment === 'situations' ? <SituationsSegment view={view} /> : null}
          {segment === 'quarters' ? <QuartersSegment view={view} /> : null}

          <Text className="font-body text-sm text-muted" style={styles.coverage}>
            {view.coverage[segment]}
          </Text>

          <InsightCard fragments={view.insights[segment]} style={styles.block} />
        </>
      ) : null}

      {ready && !hasGames ? (
        <EmptyState
          icon={Crosshair}
          title="Nincs elemezhető meccs"
          description="Ehhez a szezonhoz és csapathoz nincs lejátszott meccs. Válassz másikat a szűrőben."
        />
      ) : null}
    </ScrollView>
  );
}

function HomeAwaySegment({ view }: { view: SituationalView }) {
  return (
    <>
      <SplitHeader home={view.home} away={view.away} style={styles.block} />

      <View style={styles.metrics}>
        {view.metrics.map((metric, index) => (
          <SplitMetricRow key={metric.label} metric={metric} divided={index > 0} />
        ))}
      </View>
    </>
  );
}

function SituationsSegment({ view }: { view: SituationalView }) {
  return (
    <>
      {view.situations.length > 0 ? (
        <SituationPanel entries={view.situations} style={styles.block} />
      ) : null}

      {view.factors.length > 0 ? (
        <>
          <SectionLabel label="Four factors" style={styles.sectionLabel} />
          <StatList
            items={view.factors.map((factor) => ({ label: factor.label, value: factor.value }))}
            style={styles.block}
          />
        </>
      ) : null}
    </>
  );
}

function QuartersSegment({ view }: { view: SituationalView }) {
  // Negyedadat híján a szegmens üres marad; a hiányt a lábjegyzet mondja ki.
  if (view.quarters.length === 0) return null;

  return (
    <StatMatrix
      labelHeader="Negyed"
      labelWidth={64}
      columns={QUARTER_COLUMNS}
      rows={view.quarters.map((quarter) => ({
        label: quarter.label,
        values: [
          quarter.scoredText,
          quarter.allowedText,
          { value: quarter.marginText, tone: quarter.positive ? 'positive' : 'negative' },
          quarter.recordText,
        ],
      }))}
      style={styles.block}
    />
  );
}

/** Első betöltés: a végleges elrendezés helyőrzői, nem spinner. */
function SituationalSkeleton() {
  return (
    <>
      <SkeletonBlock height={36} corner="md" style={styles.block} />
      <SkeletonBlock height={96} corner="lg" style={styles.block} />
      {[0, 1, 2, 3].map((index) => (
        <SkeletonBlock key={index} height={64} corner="sm" style={styles.block} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
    letterSpacing: letterSpacing(fontSize.lg, tracking.label),
  },
  block: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  metrics: {
    marginHorizontal: spacing[4],
  },
  sectionLabel: {
    marginHorizontal: spacing[4],
  },
  coverage: {
    marginHorizontal: spacing[4],
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
});
