/**
 * Meccsek – a szezon lejátszott meccsei és a közelgő találkozók egy listában.
 *
 * Mockup ehhez a képernyőhöz nincs; a felépítés a `Jatekosok Lista` mockup
 * listaképernyőjét követi (fejléc, cím + darabszám, majd a sorok). A közelgők
 * állnak elöl: azokra a stáb a leggyakrabban keres rá.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';

import { AppHeader } from '@/components/AppHeader';
import { EmptyState } from '@/components/EmptyState';
import { ErrorPanel } from '@/components/ErrorPanel';
import { FixtureRow, GameRow } from '@/components/GameRow';
import { SectionLabel } from '@/components/SectionLabel';
import { SkeletonBlock } from '@/components/SkeletonBlock';
import { spacing } from '@/constants/theme';
import { useGameData } from '@/hooks/useGameData';

/** A `StackedRow` sormagassága – a helyőrzők ugyanekkorák. */
const ROW_HEIGHT = 68;

export default function GamesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { games, fixtures, loading, error, reload } = useGameData();

  const ready = !error && !loading;
  const hasContent = games.length > 0 || fixtures.length > 0;

  return (
    <ScrollView
      className="flex-1 bg-base"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: spacing[6] }}
      showsVerticalScrollIndicator={false}
    >
      <AppHeader />

      <View style={styles.title}>
        <Text className="font-condensed text-stat uppercase text-primary">Meccsek</Text>
        {ready && games.length > 0 ? (
          <Text className="font-mono text-md text-muted" style={styles.count}>
            {`${games.length} meccs`}
          </Text>
        ) : null}
      </View>

      {error ? <ErrorPanel message={error} onRetry={reload} /> : null}

      {!error && loading ? <GamesSkeleton /> : null}

      {ready ? (
        hasContent ? (
          <View style={styles.list}>
            {fixtures.length > 0 ? (
              <>
                <SectionLabel label="Közelgő" />
                {fixtures.map((fixture) => (
                  <FixtureRow key={fixture.id} fixture={fixture} />
                ))}
              </>
            ) : null}

            {games.length > 0 ? (
              <>
                <SectionLabel
                  label="Lejátszott"
                  style={fixtures.length > 0 ? styles.secondSection : undefined}
                />
                {games.map((game) => (
                  <GameRow
                    key={game.id}
                    game={game}
                    onPress={() => router.push(`/games/${game.id}`)}
                  />
                ))}
              </>
            ) : null}
          </View>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title="Nincs meccs"
            description="Ehhez a szezonhoz és csapathoz nincs rögzített meccs. Válassz másikat a szűrőben."
          />
        )
      ) : null}
    </ScrollView>
  );
}

/** Első betöltés: a végleges elrendezés helyőrzői, nem spinner. */
function GamesSkeleton() {
  return (
    <View style={styles.list}>
      <SkeletonBlock height={11} width="30%" style={styles.skeletonLabel} />
      {[0, 1, 2, 3, 4].map((index) => (
        <SkeletonBlock key={index} height={ROW_HEIGHT} corner="lg" style={styles.skeletonRow} />
      ))}
    </View>
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
  list: {
    paddingHorizontal: spacing[4],
  },
  secondSection: {
    marginTop: spacing[3],
  },
  skeletonLabel: {
    marginBottom: 10,
  },
  skeletonRow: {
    marginBottom: spacing[2],
  },
});
