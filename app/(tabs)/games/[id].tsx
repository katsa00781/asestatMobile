/**
 * Meccs részletei – végeredmény, negyedenkénti bontás, box score és a mentett
 * AI riportok.
 *
 * Mockup ehhez a képernyőhöz nincs; a felépítés a `Ma` képernyő kártyáit és a
 * `p0-style-tile` mátrixát követi. A meccs sora a meccslista cache-éből jön,
 * ezért a listáról ide lépve a fejléc azonnal kirajzolódik (D-046).
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarX } from 'lucide-react-native';

import { BackHeader } from '@/components/BackHeader';
import { BoxScore } from '@/components/BoxScore';
import { ClutchPanel } from '@/components/ClutchPanel';
import { EmptyState } from '@/components/EmptyState';
import { ErrorPanel } from '@/components/ErrorPanel';
import { GameScoreCard } from '@/components/GameScoreCard';
import { QuarterScores } from '@/components/QuarterScores';
import { ReportCard } from '@/components/ReportCard';
import { SectionLabel } from '@/components/SectionLabel';
import { SkeletonBlock } from '@/components/SkeletonBlock';
import { spacing } from '@/constants/theme';
import { useFilterData } from '@/hooks/useFilterData';
import { useGameDetails } from '@/hooks/useGameDetails';

export default function GameDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { selectedTeam } = useFilterData();
  const { game, boxScore, quarters, reports, clutch, loading, error, reload } = useGameDetails(
    id ?? '',
  );

  const ready = !error && !loading;
  const ourName = selectedTeam?.shortName ?? '';

  return (
    <ScrollView
      className="flex-1 bg-base"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: spacing[6] }}
      showsVerticalScrollIndicator={false}
    >
      <BackHeader onPress={() => (router.canGoBack() ? router.back() : router.replace('/games'))} />

      {error ? <ErrorPanel message={error} onRetry={reload} /> : null}

      {!error && loading ? <DetailsSkeleton /> : null}

      {ready && game ? (
        <>
          <GameScoreCard game={game} ourName={ourName} />

          <SectionLabel label="Negyedek" style={styles.section} />
          <QuarterScores quarters={quarters} ourName={ourName} opponent={game.opponent} />

          <SectionLabel label="Box score" style={styles.section} />
          <BoxScore lines={boxScore} />

          <SectionLabel label="Clutch" style={styles.section} />
          <ClutchPanel clutch={clutch} ourName={ourName} opponent={game.opponent} />

          <SectionLabel label="Elemzés" style={styles.section} />
          {reports.length > 0 ? (
            reports.map((report) => <ReportCard key={report.id} report={report} />)
          ) : (
            <Text className="font-body text-sm text-muted" style={styles.note}>
              Ehhez a meccshez még nincs mentett riport.
            </Text>
          )}
        </>
      ) : null}

      {ready && !game ? (
        <EmptyState
          icon={CalendarX}
          title="Nincs meg a meccs"
          description="Ez a meccs nem szerepel a kiválasztott szezon és csapat meccsei között."
        />
      ) : null}
    </ScrollView>
  );
}

/** Első betöltés: a végleges elrendezés helyőrzői, nem spinner. */
function DetailsSkeleton() {
  return (
    <View style={styles.skeleton}>
      <SkeletonBlock height={168} corner="xl" style={styles.skeletonCard} />
      <SkeletonBlock height={11} width="30%" style={styles.skeletonLabel} />
      <SkeletonBlock height={98} corner="lg" style={styles.skeletonCard} />
      <SkeletonBlock height={11} width="30%" style={styles.skeletonLabel} />
      <SkeletonBlock height={200} corner="lg" />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: spacing[4],
    marginTop: spacing[6],
  },
  note: {
    marginHorizontal: spacing[4],
  },
  skeleton: {
    paddingHorizontal: spacing[4],
  },
  skeletonCard: {
    marginBottom: spacing[6],
  },
  skeletonLabel: {
    marginBottom: 10,
  },
});
