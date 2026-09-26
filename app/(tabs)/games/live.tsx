/**
 * Élő mérkőzés – állás, negyedek, meccsstatisztika, box score, meccs közben
 * frissülő adatokkal.
 *
 * A `games` stack-ben él, nem hatodik tab: így megkapja a `BackHeader`
 * mintáját és az Expo Router swipe-back / Android back viselkedését (D-104).
 * A frissítés polling, nem Realtime (D-103) – lásd `hooks/useLiveGame.ts`.
 */
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Radio } from 'lucide-react-native';

import { BackHeader } from '@/components/BackHeader';
import { BoxScore } from '@/components/BoxScore';
import { EmptyState } from '@/components/EmptyState';
import { ErrorPanel } from '@/components/ErrorPanel';
import { LiveScoreCard } from '@/components/LiveScoreCard';
import { LiveTeamStatsPanel } from '@/components/LiveTeamStatsPanel';
import { QuarterScores } from '@/components/QuarterScores';
import { SectionLabel } from '@/components/SectionLabel';
import { SkeletonBlock } from '@/components/SkeletonBlock';
import { spacing } from '@/constants/theme';
import { useFilterData } from '@/hooks/useFilterData';
import { useLiveGame } from '@/hooks/useLiveGame';

export default function LiveGameScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { selectedTeam } = useFilterData();
  const { live, loading, error, reload } = useLiveGame('full');

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

      {!error && loading ? <LiveSkeleton /> : null}

      {ready && live ? (
        <>
          <LiveScoreCard live={live} ourName={ourName} />

          <SectionLabel label="Negyedek" style={styles.section} />
          <QuarterScores quarters={live.quarters} ourName={ourName} opponent={live.opponent} />

          <SectionLabel label="Meccsstatisztika" style={styles.section} />
          <LiveTeamStatsPanel stats={live.teamStats} ourName={ourName} opponent={live.opponent} />

          <SectionLabel label="Box score" style={styles.section} />
          <BoxScore lines={live.boxScore} emptyNote="A statisztika a meccs közben még nem elérhető." />
        </>
      ) : null}

      {ready && !live ? (
        <EmptyState
          icon={Radio}
          title="Nincs élő mérkőzés"
          description="A kiválasztott csapatnak jelenleg nincs futó találkozója."
        />
      ) : null}
    </ScrollView>
  );
}

/** Első betöltés: a végleges elrendezés helyőrzői, nem spinner. */
function LiveSkeleton() {
  return (
    <View style={styles.skeleton}>
      <SkeletonBlock height={168} corner="xl" style={styles.skeletonCard} />
      <SkeletonBlock height={11} width="30%" style={styles.skeletonLabel} />
      <SkeletonBlock height={98} corner="lg" style={styles.skeletonCard} />
      <SkeletonBlock height={11} width="30%" style={styles.skeletonLabel} />
      <SkeletonBlock height={200} corner="lg" style={styles.skeletonCard} />
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
