/**
 * Elemzés – a mentett AI riportok hubja.
 *
 * Design prompt: `asestats/context/mobile/mobile-design-prompts.md` P12.
 * Fejléc, nagy cím, majd az „AI riportok" szekció: fajta szerinti szűrő-chipek
 * és a riportkártyák, a legfrissebb elöl. Egy kártya a riportolvasót nyitja.
 *
 * A P12 „Számított elemzések" szekciója (szituációk, scouting, szerepkör)
 * **még nem** része a képernyőnek – külön feladatban készül, hogy ne álljon
 * itt olyan navigációs sor, ami sehová nem vezet (D-066).
 */
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FileSearch, Sparkles } from 'lucide-react-native';

import { AppHeader } from '@/components/AppHeader';
import { ChipRow } from '@/components/ChipRow';
import { EmptyState } from '@/components/EmptyState';
import { ErrorPanel } from '@/components/ErrorPanel';
import { ReportListCard } from '@/components/ReportListCard';
import { SectionLabel } from '@/components/SectionLabel';
import { SkeletonBlock } from '@/components/SkeletonBlock';
import { colors, spacing } from '@/constants/theme';
import { DEFAULT_REPORT_FILTER, REPORT_FILTERS } from '@/data/report-kinds';
import { useAnalysisReports } from '@/hooks/useAnalysisReports';
import type { AnalysisReport } from '@/types/analysis';

/** A `ReportListCard` magassága – a helyőrzők ugyanekkorák. */
const CARD_HEIGHT = 88;

export default function AnalysisScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { reports, loading, error, reload } = useAnalysisReports();

  const [filter, setFilter] = useState(DEFAULT_REPORT_FILTER);

  const visible = useMemo(() => filterReports(reports, filter), [reports, filter]);

  const ready = !error && !loading;
  const hasReports = reports.length > 0;

  return (
    <ScrollView
      className="flex-1 bg-base"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: spacing[6] }}
      showsVerticalScrollIndicator={false}
    >
      <AppHeader />

      <View style={styles.title}>
        <Text className="font-condensed text-stat uppercase text-primary">Elemzés</Text>
        {ready && hasReports ? (
          <Text className="font-mono text-md text-muted" style={styles.count}>
            {`${visible.length} riport`}
          </Text>
        ) : null}
      </View>

      {error ? <ErrorPanel message={error} onRetry={reload} /> : null}

      {!error && loading ? <ReportsSkeleton /> : null}

      {ready && hasReports ? (
        <>
          <View style={styles.section}>
            <SectionLabel label="AI riportok" style={styles.sectionLabel} />
            <Sparkles size={16} color={colors.accent.ai} strokeWidth={1.8} />
          </View>

          <ChipRow
            options={REPORT_FILTERS.map(({ key, label }) => ({ key, label }))}
            activeKey={filter}
            onSelect={setFilter}
            accessibilityLabel="Riport fajtája"
          />
        </>
      ) : null}

      {ready ? (
        visible.length > 0 ? (
          visible.map((report) => (
            <ReportListCard
              key={report.id}
              report={report}
              onPress={() => router.push(`/analysis/${report.id}`)}
            />
          ))
        ) : (
          <EmptyStateForList hasReports={hasReports} />
        )
      ) : null}
    </ScrollView>
  );
}

/** Üres lista: vagy nincs riport a szűrőhöz, vagy a fajtaszűrő nem talált. */
function EmptyStateForList({ hasReports }: { hasReports: boolean }) {
  if (hasReports) {
    return (
      <EmptyState
        icon={FileSearch}
        title="Nincs ilyen riport"
        description="Ebből a fajtából nincs mentett elemzés. Válts vissza a „Mind” nézetre."
      />
    );
  }

  return (
    <EmptyState
      icon={Sparkles}
      title="Nincs mentett riport"
      description="Ehhez a szezonhoz és csapathoz nincs legenerált elemzés. Válassz másikat a szűrőben."
    />
  );
}

function filterReports(reports: AnalysisReport[], filter: string): AnalysisReport[] {
  const kind = REPORT_FILTERS.find((option) => option.key === filter)?.kind ?? null;
  if (kind === null) return reports;

  return reports.filter((report) => report.kind === kind);
}

/** Első betöltés: a végleges elrendezés helyőrzői, nem spinner. */
function ReportsSkeleton() {
  return (
    <>
      <SkeletonBlock height={11} width="35%" style={styles.skeletonLabel} />
      <SkeletonBlock height={32} width="70%" corner="md" style={styles.skeletonChips} />
      {[0, 1, 2, 3, 4].map((index) => (
        <SkeletonBlock key={index} height={CARD_HEIGHT} corner="lg" style={styles.skeletonCard} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  count: {
    fontVariant: ['tabular-nums'],
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing[4],
    marginBottom: 10,
  },
  sectionLabel: {
    // A rés a soron van, hogy a szikra ikon a felirattal egy vonalban álljon.
    marginBottom: 0,
  },
  skeletonLabel: {
    marginHorizontal: spacing[4],
    marginBottom: 10,
  },
  skeletonChips: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[5],
  },
  skeletonCard: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[2],
  },
});
