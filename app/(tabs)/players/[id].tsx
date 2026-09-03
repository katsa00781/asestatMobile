/**
 * Játékos részletei – szezonösszesítés, dobási bontás, meccsenkénti mátrix és
 * a mentett szezonriportok.
 *
 * Mockup ehhez a képernyőhöz nincs; a felépítés a meccs részletei képernyőt
 * követi (fejkártya → KPI-ok → szekciók → riportok). A szezonösszesítés a
 * játékoslista cache-éből jön, ezért a listáról ide lépve a fejléc azonnal
 * kirajzolódik (D-046).
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { UserX } from 'lucide-react-native';

import { BackHeader } from '@/components/BackHeader';
import { EmptyState } from '@/components/EmptyState';
import { ErrorPanel } from '@/components/ErrorPanel';
import { PlayerGameLog } from '@/components/PlayerGameLog';
import { PlayerProfileCard } from '@/components/PlayerProfileCard';
import { PlayerTrendChart } from '@/components/PlayerTrendChart';
import { ReportCard } from '@/components/ReportCard';
import { SectionLabel } from '@/components/SectionLabel';
import { ShootingPanel } from '@/components/ShootingPanel';
import { SkeletonBlock } from '@/components/SkeletonBlock';
import { StatList, type StatListItem } from '@/components/StatList';
import { StatTile } from '@/components/StatTile';
import { spacing } from '@/constants/theme';
import { usePlayerDetails } from '@/hooks/usePlayerDetails';
import { formatDecimal } from '@/lib/format';
import type { SeasonPlayer } from '@/types/players';

export default function PlayerDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { player, games, reports, loading, error, reload } = usePlayerDetails(id ?? '');
  const ready = !error && !loading;

  return (
    <ScrollView
      className="flex-1 bg-base"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: spacing[6] }}
      showsVerticalScrollIndicator={false}
    >
      <BackHeader onPress={() => (router.canGoBack() ? router.back() : router.replace('/players'))} />

      {error ? <ErrorPanel message={error} onRetry={reload} /> : null}

      {!error && loading ? <DetailsSkeleton /> : null}

      {ready && player ? (
        <>
          <PlayerProfileCard player={player} />
          <AverageGrid player={player} />

          <SectionLabel label="Forma" style={styles.section} />
          <PlayerTrendChart games={games} />

          <SectionLabel label="Dobás" style={styles.section} />
          <ShootingPanel shooting={player.shooting} />

          <SectionLabel label="További mutatók" style={styles.section} />
          <StatList items={advancedStats(player)} style={styles.block} />

          <SectionLabel label="Meccsenkénti bontás" style={styles.section} />
          <PlayerGameLog games={games} />

          <SectionLabel label="Elemzés" style={styles.section} />
          {reports.length > 0 ? (
            reports.map((report) => <ReportCard key={report.id} report={report} />)
          ) : (
            <Text className="font-body text-sm text-muted" style={styles.note}>
              Ehhez a játékoshoz még nincs mentett riport.
            </Text>
          )}
        </>
      ) : null}

      {ready && !player ? (
        <EmptyState
          icon={UserX}
          title="Nincs meg a játékos"
          description="Ez a játékos nem szerepel a kiválasztott szezon és csapat keretében."
        />
      ) : null}
    </ScrollView>
  );
}

/** A játékoslista három oszlopa + az értékelés, meccsenkénti átlagban. */
function AverageGrid({ player }: { player: SeasonPlayer }) {
  return (
    <View style={styles.grid}>
      <StatTile
        label="Pont / meccs"
        value={formatDecimal(player.averages.points)}
        accent="cyan"
        style={styles.cell}
      />
      <StatTile
        label="Lepattanó / meccs"
        value={formatDecimal(player.averages.rebounds)}
        accent="positive"
        style={styles.cell}
      />
      <StatTile
        label="Gólpassz / meccs"
        value={formatDecimal(player.averages.assists)}
        accent="ai"
        style={styles.cell}
      />
      <StatTile
        label="Értékelés"
        value={formatDecimal(player.averages.valuation)}
        accent="orange"
        style={styles.cell}
      />
    </View>
  );
}

/**
 * A webes „További Statisztikák" blokk mutatói. A `offensiveRating` és a
 * `defensiveRating` a `usePlayerData` saját képlete (ponthatékonyság és
 * védekezési index), **nem** az NBA ratingje – a felirat is ezt mondja.
 */
function advancedStats(player: SeasonPlayer): StatListItem[] {
  const perGame = (total: number) => formatDecimal(player.gamesPlayed > 0 ? total / player.gamesPlayed : 0);

  return [
    { label: 'True Shooting (TS%)', value: `${formatDecimal(player.trueShootingPct)}%` },
    { label: 'Effektív mezőny (eFG%)', value: `${formatDecimal(player.effectiveShootingPct)}%` },
    { label: 'Ponthatékonyság (pont / kísérlet)', value: formatDecimal(player.offensiveRating, 2) },
    { label: 'Védekezési index / meccs', value: formatDecimal(player.defensiveRating) },
    { label: 'Támadó lepattanó / meccs', value: perGame(player.rebounds.offensive) },
    { label: 'Védekező lepattanó / meccs', value: perGame(player.rebounds.defensive) },
    { label: 'Labdaszerzés / meccs', value: formatDecimal(player.averages.steals) },
    { label: 'Blokk / meccs', value: perGame(player.blocks) },
    { label: 'Labdavesztés / meccs', value: formatDecimal(player.averages.turnovers) },
    { label: 'Gólpassz / labdavesztés', value: assistRatio(player) },
    { label: 'Szabálytalanság / meccs', value: perGame(player.foulsCommitted) },
    { label: 'Kiharcolt szabálytalanság / meccs', value: perGame(player.foulsDrawn) },
  ];
}

/** Labdavesztés nélkül nincs arány – ott a gólpasszok száma áll. */
function assistRatio(player: SeasonPlayer): string {
  if (player.turnovers <= 0) return formatDecimal(player.assists);
  return formatDecimal(player.assists / player.turnovers, 2);
}

/** Első betöltés: a végleges elrendezés helyőrzői, nem spinner. */
function DetailsSkeleton() {
  return (
    <View style={styles.skeleton}>
      <SkeletonBlock height={148} corner="xl" style={styles.skeletonCard} />
      <View style={styles.skeletonGrid}>
        {[0, 1, 2, 3].map((index) => (
          <SkeletonBlock key={index} height={96} corner="xl" style={styles.cell} />
        ))}
      </View>
      <SkeletonBlock height={11} width="30%" style={styles.skeletonLabel} />
      <SkeletonBlock height={128} corner="lg" style={styles.skeletonCard} />
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
  block: {
    marginHorizontal: spacing[4],
  },
  note: {
    marginHorizontal: spacing[4],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginHorizontal: spacing[4],
  },
  cell: {
    // Két oszlop: a 47% + a 12pt-os rés belefér a sorba, a `flexGrow` tölti ki
    // a maradékot – ugyanaz a rács, mint a `Ma` képernyő KPI-jainál.
    flexGrow: 1,
    flexBasis: '47%',
  },
  skeleton: {
    paddingHorizontal: spacing[4],
  },
  skeletonCard: {
    marginBottom: spacing[6],
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  skeletonLabel: {
    marginBottom: 10,
  },
});
