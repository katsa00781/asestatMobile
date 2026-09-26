/**
 * Post-game elemzés – a meccs számított elemzése a `@core/postgame-report`
 * alapján: összegzés, kulcsmutatók, dobásprofil, döntő tényezők, játékosok.
 *
 * Külön alroute, nem szekció a meccs részletein: az elemzés hosszú, és a liga
 * szezonmezőnyét is betölti – a részletek így gyorsak maradnak (D-122). A
 * meccs részleteiről egy `NavRow` nyitja.
 */
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarX, ChartColumnBig } from 'lucide-react-native';

import { BackHeader } from '@/components/BackHeader';
import { EmptyState } from '@/components/EmptyState';
import { ErrorPanel } from '@/components/ErrorPanel';
import { PostgamePanel } from '@/components/PostgamePanel';
import { SkeletonBlock } from '@/components/SkeletonBlock';
import { fontSize, letterSpacing, spacing, tracking } from '@/constants/theme';
import { useFilterData } from '@/hooks/useFilterData';
import { usePostgameAnalysis } from '@/hooks/usePostgameAnalysis';
import { formatDate } from '@/lib/format';
import { buildPostgameView } from '@/lib/postgame-view';

export default function PostgameScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { selectedTeam } = useFilterData();
  const { game, report, playerReports, loading, error, reload } = usePostgameAnalysis(id ?? '');

  const view = useMemo(
    () => (report ? buildPostgameView(report, playerReports) : null),
    [playerReports, report],
  );

  const ready = !error && !loading;

  return (
    <ScrollView
      className="flex-1 bg-base"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: spacing[6] }}
      showsVerticalScrollIndicator={false}
    >
      <BackHeader
        label="Meccs"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/games'))}
      />

      <Text className="font-condensed text-lg uppercase text-primary" style={styles.title}>
        Post-game elemzés
      </Text>

      {game ? (
        <Text className="font-body-medium text-md text-secondary" style={styles.context}>
          {`${selectedTeam?.shortName ?? ''} — ${game.opponent} · ${formatDate(game.date)}`}
        </Text>
      ) : null}

      {error ? <ErrorPanel message={error} onRetry={reload} /> : null}

      {!error && loading ? <PostgameSkeleton /> : null}

      {ready && game && view ? <PostgamePanel view={view} /> : null}

      {ready && game && !view ? (
        <EmptyState
          icon={ChartColumnBig}
          title="Nincs elég adat a post-game jelentéshez"
          description="Ehhez a meccshez nincs saját box score, vagy a csapatnak nincs szezonadata."
        />
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
function PostgameSkeleton() {
  return (
    <View style={styles.skeleton}>
      <SkeletonBlock height={120} corner="lg" style={styles.skeletonCard} />
      <View style={styles.skeletonTiles}>
        <SkeletonBlock height={96} corner="xl" style={styles.skeletonTile} />
        <SkeletonBlock height={96} corner="xl" style={styles.skeletonTile} />
        <SkeletonBlock height={96} corner="xl" style={styles.skeletonTile} />
      </View>
      <SkeletonBlock height={11} width="40%" style={styles.skeletonLabel} />
      <SkeletonBlock height={280} corner="lg" />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    letterSpacing: letterSpacing(fontSize.lg, tracking.label),
  },
  context: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[1],
    paddingBottom: spacing[4],
  },
  skeleton: {
    paddingHorizontal: spacing[4],
  },
  skeletonCard: {
    marginBottom: spacing[4],
  },
  skeletonTiles: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[6],
  },
  skeletonTile: {
    flex: 1,
  },
  skeletonLabel: {
    marginBottom: 10,
  },
});
