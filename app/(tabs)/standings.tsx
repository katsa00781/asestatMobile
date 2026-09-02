/**
 * Tabella – a kiválasztott szezon bajnoki állása a legfrissebb forduló után.
 *
 * Mockup: `docs/mockups/extracted/tabella.html`. Fejléc, cím + alcím, ragadós
 * oszlopfejléc, csapatsorok, végül a frissítés dátuma. A szűrőben kiválasztott
 * csapat sora kiemelve áll.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ListOrdered } from 'lucide-react-native';

import { AppHeader } from '@/components/AppHeader';
import { EmptyState } from '@/components/EmptyState';
import { ErrorPanel } from '@/components/ErrorPanel';
import { SkeletonBlock } from '@/components/SkeletonBlock';
import { StandingsRow, StandingsRowHeader } from '@/components/StandingsRow';
import { colors, fontSize, letterSpacing, spacing, tracking } from '@/constants/theme';
import { useStandings } from '@/hooks/useStandings';
import { formatDate } from '@/lib/format';

/** A bajnokság neve – a mockup fix felirata, az adatbázis nem tárolja. */
const LEAGUE = 'NB I/A';

/** A sorok magassága a helyőrzőkhöz – lásd `StandingsRow`. */
const ROW_HEIGHT = 56;
/** Ennyi helyőrző sor fut az első betöltéskor (a bajnokságban 14 csapat van). */
const SKELETON_ROWS = 10;

export default function StandingsScreen() {
  const insets = useSafeAreaInsets();
  const { table, seasonName, ownTeamId, loading, error, reload } = useStandings();

  const ready = !error && !loading;
  const teams = table?.teams ?? [];
  const showHeader = ready && teams.length > 0;

  return (
    <ScrollView
      className="flex-1 bg-base"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: spacing[6] }}
      showsVerticalScrollIndicator={false}
      // A `React.Children.toArray` kihagyja a `null` gyerekeket, ezért az
      // oszlopfejléc indexe csak akkor 1, ha meg is jelenik.
      stickyHeaderIndices={showHeader ? [1] : undefined}
    >
      <View>
        <AppHeader />
        <View style={styles.title}>
          <Text className="font-condensed text-stat uppercase text-primary">Tabella</Text>
          <Text
            className="font-condensed text-label uppercase text-muted"
            style={styles.subtitle}
            numberOfLines={1}
          >
            {`${LEAGUE} · ${seasonName ?? '…'}`}
          </Text>
        </View>
      </View>

      {showHeader ? <StandingsRowHeader /> : null}

      <View>
        {error ? <ErrorPanel message={error} onRetry={reload} /> : null}

        {!error && loading ? <StandingsSkeleton /> : null}

        {ready ? (
          teams.length > 0 && table ? (
            <>
              {teams.map((team, index) => (
                <StandingsRow
                  key={team.position}
                  team={team}
                  own={team.teamId !== null && team.teamId === ownTeamId}
                  last={index === teams.length - 1}
                />
              ))}

              <View style={styles.footerDivider} />
              <Text className="font-body text-sm text-muted" style={styles.footer}>
                {`Frissítve: ${formatDate(table.date)} · ${table.matchday}. forduló`}
              </Text>
            </>
          ) : (
            <EmptyState
              icon={ListOrdered}
              title="Nincs tabella"
              description="Ehhez a szezonhoz nincs rögzített bajnoki tabella. Válassz másik szezont a szűrőben."
            />
          )
        ) : null}
      </View>
    </ScrollView>
  );
}

/** Első betöltés: a végleges elrendezés helyőrzői, nem spinner. */
function StandingsSkeleton() {
  return (
    <View style={styles.skeleton}>
      <SkeletonBlock height={20} width="60%" corner="sm" style={styles.skeletonHeader} />
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <SkeletonBlock key={index} height={ROW_HEIGHT - spacing[2]} corner="sm" style={styles.skeletonRow} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[1],
  },
  subtitle: {
    marginTop: 6,
    letterSpacing: letterSpacing(fontSize.label, tracking.wider),
  },
  footerDivider: {
    marginHorizontal: spacing[4],
    height: 1,
    backgroundColor: colors.bg.surface3,
  },
  footer: {
    paddingHorizontal: spacing[4],
    paddingTop: 14,
    paddingBottom: spacing[6],
  },
  skeleton: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  skeletonHeader: {
    marginBottom: spacing[4],
  },
  skeletonRow: {
    marginBottom: spacing[2],
  },
});
