/**
 * Ma – a nyitóképernyő: következő meccs, csapat KPI-ok, forma, legutóbbi meccs.
 *
 * Mockup: `docs/mockups/extracted/ma-screen.html`.
 * Az adat a `useTodayData`-ból jön, a megjelenítés a kártyakomponensekből.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppHeader } from '@/components/AppHeader';
import { EmptyState } from '@/components/EmptyState';
import { ErrorPanel } from '@/components/ErrorPanel';
import { FormStrip } from '@/components/FormStrip';
import { LastGameCard } from '@/components/LastGameCard';
import { NextGameCard } from '@/components/NextGameCard';
import { SkeletonBlock } from '@/components/SkeletonBlock';
import { StatTile } from '@/components/StatTile';
import { spacing } from '@/constants/theme';
import { useFilterData } from '@/hooks/useFilterData';
import { useTodayData, type TeamKpis } from '@/hooks/useTodayData';
import { formatDecimal } from '@/lib/format';

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { selectedTeam } = useFilterData();
  const { nextFixture, lastGame, kpis, form, played, loading, error, reload } = useTodayData();

  const ourName = selectedTeam?.shortName ?? '—';
  const hasContent = nextFixture !== null || played > 0;

  return (
    <ScrollView
      className="flex-1 bg-base"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: spacing[6] }}
      showsVerticalScrollIndicator={false}
    >
      <AppHeader />
      <Text className="px-16 py-16 font-condensed text-stat uppercase text-primary">Ma</Text>

      {error ? <ErrorPanel message={error} onRetry={reload} /> : null}

      {!error && loading ? <TodaySkeleton /> : null}

      {!error && !loading ? (
        hasContent ? (
          <>
            <NextGameCard fixture={nextFixture} ourName={ourName} />
            {played > 0 ? <KpiGrid kpis={kpis} /> : null}
            <FormStrip form={form} />
            {lastGame ? (
              <LastGameCard
                game={lastGame}
                ourName={ourName}
                onPress={() => router.push(`/games/${lastGame.id}`)}
              />
            ) : null}
          </>
        ) : (
          <EmptyState
            title="Nincs adat"
            description="Ehhez a szezonhoz és csapathoz még nincs lejátszott meccs. Válassz másikat a szűrőben."
          />
        )
      ) : null}
    </ScrollView>
  );
}

/** A mockup 2×2-es KPI rácsa. Az értékek már meccsenkénti átlagok. */
function KpiGrid({ kpis }: { kpis: TeamKpis }) {
  return (
    <View style={styles.grid}>
      <StatTile
        label="Pontátlag"
        value={formatDecimal(kpis.scored)}
        accent="cyan"
        style={styles.cell}
      />
      <StatTile
        label="Kapott pont"
        value={formatDecimal(kpis.conceded)}
        accent="orange"
        style={styles.cell}
      />
      <StatTile
        label="Lepattanó"
        value={formatDecimal(kpis.rebounds)}
        accent="positive"
        style={styles.cell}
      />
      <StatTile
        label="Eldobott"
        value={formatDecimal(kpis.turnovers)}
        accent="ai"
        style={styles.cell}
      />
    </View>
  );
}

/** Első betöltés: a végleges elrendezés helyőrzői, nem spinner. */
function TodaySkeleton() {
  return (
    <View>
      <SkeletonBlock height={148} corner="xl" style={styles.block} />
      <View style={styles.grid}>
        {[0, 1, 2, 3].map((index) => (
          <SkeletonBlock key={index} height={96} corner="xl" style={styles.cell} />
        ))}
      </View>
      <SkeletonBlock height={132} corner="lg" style={styles.block} />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[5],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginHorizontal: spacing[4],
    marginBottom: spacing[5],
  },
  cell: {
    // Két oszlop: a 47% + a 12pt-os rés belefér a sorba, a `flexGrow` tölti ki
    // a maradékot – így nem kell a képernyő szélességét kiszámolni.
    flexGrow: 1,
    flexBasis: '47%',
  },
});
