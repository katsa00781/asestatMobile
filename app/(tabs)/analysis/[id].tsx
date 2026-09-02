/**
 * Riportolvasó – egy mentett AI riport teljes szövege.
 *
 * Design prompt: `asestats/context/mobile/mobile-design-prompts.md` P10.
 * Fejléc-badge-ek, cím, meta sor, majd a lila sávval jelölt szövegtörzs.
 *
 * A riport **nem** külön lekérdezés: a hub `useAnalysisReports` cache-éből jön
 * azonosító szerint, ahogy a meccs- és játékosrészletek is a listájuk
 * cache-éből dolgoznak (D-046). Ha a szűrő közben átállt, a riport nincs a
 * listában – ilyenkor üres állapot jön, nem hibaüzenet.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FileQuestion, Sparkles } from 'lucide-react-native';

import { BackHeader } from '@/components/BackHeader';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { ErrorPanel } from '@/components/ErrorPanel';
import { ReportBody } from '@/components/ReportBody';
import { SkeletonBlock } from '@/components/SkeletonBlock';
import { colors, spacing } from '@/constants/theme';
import { useAnalysisReports } from '@/hooks/useAnalysisReports';
import { formatDate } from '@/lib/format';

/** A lábléc állandó felirata – a riportokat a webalkalmazás generálja. */
const FOOTER =
  'A riportot a webalkalmazás AI-elemzője készítette a rögzített statisztikák alapján.';

export default function ReportReaderScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { reports, loading, error, reload } = useAnalysisReports();

  const report = reports.find((row) => row.id === id) ?? null;
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

      {error ? <ErrorPanel message={error} onRetry={reload} /> : null}

      {!error && loading ? <ReaderSkeleton /> : null}

      {ready && report ? (
        <View style={styles.block}>
          <View style={styles.badges}>
            <Badge label="AI elemzés" variant="ai" />
            <Badge label={report.typeLabel} variant="neutral" />
          </View>

          <Text className="font-condensed text-h3 text-primary" style={styles.title}>
            {report.title}
          </Text>

          <Text className="font-body text-sm text-muted" style={styles.meta}>
            {`${report.subtitle} · Generálva: ${formatDate(report.generatedAt)}`}
          </Text>

          <ReportBody narrative={report.narrative} style={styles.body} />

          <View style={styles.divider} />
          <View style={styles.footer}>
            <Sparkles size={14} color={colors.accent.ai} strokeWidth={1.8} />
            <Text className="flex-1 font-body text-sm text-muted">{FOOTER}</Text>
          </View>
        </View>
      ) : null}

      {ready && !report ? (
        <EmptyState
          icon={FileQuestion}
          title="Nincs meg a riport"
          description="Ez a riport nem tartozik a kiválasztott szezonhoz és csapathoz."
        />
      ) : null}
    </ScrollView>
  );
}

/** Első betöltés: a végleges elrendezés helyőrzői, nem spinner. */
function ReaderSkeleton() {
  return (
    <View style={styles.block}>
      <SkeletonBlock height={20} width="45%" corner="xs" style={styles.skeletonBadges} />
      <SkeletonBlock height={24} width="80%" corner="sm" style={styles.skeletonTitle} />
      <SkeletonBlock height={13} width="60%" corner="sm" style={styles.skeletonMeta} />
      <SkeletonBlock height={240} corner="lg" />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingHorizontal: spacing[4],
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing[2],
  },
  title: {
    marginTop: spacing[3],
  },
  meta: {
    marginTop: 6,
  },
  body: {
    marginTop: spacing[5],
  },
  divider: {
    marginTop: spacing[6],
    height: 1,
    backgroundColor: colors.bg.surface3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 14,
  },
  skeletonBadges: {
    marginTop: spacing[2],
    marginBottom: spacing[3],
  },
  skeletonTitle: {
    marginBottom: 6,
  },
  skeletonMeta: {
    marginBottom: spacing[5],
  },
});
