/**
 * Játékosok – a kiválasztott szezon és csapat szezon-aggregált listája.
 *
 * Mockup: `docs/mockups/extracted/jatekosok-lista.html`. Fejléc, cím +
 * létszám, névkereső, rendezés-chipek, majd az oszlopfejléc és a sorok.
 * Az adat a `usePlayerData` szűrőpáronkénti cache-éből jön; a keresés és a
 * rendezés kliensoldali, újabb lekérdezés nélkül.
 */
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SearchX, Users } from 'lucide-react-native';

import { AppHeader } from '@/components/AppHeader';
import { ChipRow } from '@/components/ChipRow';
import { EmptyState } from '@/components/EmptyState';
import { ErrorPanel } from '@/components/ErrorPanel';
import { PlayerRow } from '@/components/PlayerRow';
import { SearchField } from '@/components/SearchField';
import { SkeletonBlock } from '@/components/SkeletonBlock';
import { StackedRowHeader } from '@/components/StackedRow';
import { spacing } from '@/constants/theme';
import {
  DEFAULT_PLAYER_SORT,
  PLAYER_SORTS,
  visibleColumns,
  type PlayerSortKey,
} from '@/data/player-sorts';
import { usePlayerData } from '@/hooks/usePlayerData';
import { matchesQuery } from '@/lib/search';
import type { SeasonPlayer } from '@/types/players';

/** A `StackedRow` sormagassága – a helyőrzők ugyanekkorák. */
const ROW_HEIGHT = 68;

export default function PlayersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { players, loading, error, reload } = usePlayerData();

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<PlayerSortKey>(DEFAULT_PLAYER_SORT);

  const columns = visibleColumns(sort);
  const visible = useMemo(() => filterAndSort(players, query, sort), [players, query, sort]);

  const ready = !error && !loading;
  const hasPlayers = players.length > 0;

  return (
    <ScrollView
      className="flex-1 bg-base"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: spacing[6] }}
      showsVerticalScrollIndicator={false}
      // A chipek a nyitott billentyűzet mellett is nyomhatók maradjanak.
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <AppHeader />

      <View style={styles.title}>
        <Text className="font-condensed text-stat uppercase text-primary">Játékosok</Text>
        {ready && hasPlayers ? (
          <Text className="font-mono text-md text-muted" style={styles.count}>
            {`${visible.length} fő`}
          </Text>
        ) : null}
      </View>

      {error ? <ErrorPanel message={error} onRetry={reload} /> : null}

      {!error && loading ? <PlayersSkeleton /> : null}

      {ready && hasPlayers ? (
        <>
          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder="Játékos keresése"
            style={styles.search}
          />
          <ChipRow
            options={PLAYER_SORTS.map(({ key, label }) => ({ key, label }))}
            activeKey={sort}
            onSelect={(key) => setSort(key as PlayerSortKey)}
            accessibilityLabel="Rendezés"
          />
        </>
      ) : null}

      {ready ? (
        visible.length > 0 ? (
          <View style={styles.list}>
            <StackedRowHeader labels={columns.map((column) => column.column)} />
            {visible.map((player) => (
              <PlayerRow
                key={player.id}
                player={player}
                columns={columns}
                onPress={() => router.push(`/players/${player.id}`)}
              />
            ))}
          </View>
        ) : (
          <EmptyStateForList hasPlayers={hasPlayers} />
        )
      ) : null}
    </ScrollView>
  );
}

/** Üres lista: vagy nincs adat a szűrőhöz, vagy a keresés nem talált. */
function EmptyStateForList({ hasPlayers }: { hasPlayers: boolean }) {
  if (hasPlayers) {
    return (
      <EmptyState
        icon={SearchX}
        title="Nincs találat"
        description="Nincs a keresésnek megfelelő játékos. Próbáld a vezetéknévvel."
      />
    );
  }

  return (
    <EmptyState
      icon={Users}
      title="Nincs játékos"
      description="Ehhez a szezonhoz és csapathoz nincs rögzített játékosstatisztika. Válassz másikat a szűrőben."
    />
  );
}

/** Névre szűrés, majd a választott átlag szerint csökkenő rendezés. */
function filterAndSort(
  players: SeasonPlayer[],
  query: string,
  sort: PlayerSortKey,
): SeasonPlayer[] {
  const value = PLAYER_SORTS.find((option) => option.key === sort)?.value;
  const filtered = players.filter((player) => matchesQuery(player.name, query));

  if (!value) return filtered;
  return [...filtered].sort((a, b) => value(b) - value(a));
}

/** Első betöltés: a végleges elrendezés helyőrzői, nem spinner. */
function PlayersSkeleton() {
  return (
    <>
      <SkeletonBlock height={44} corner="sm" style={styles.search} />
      <SkeletonBlock height={32} width="70%" corner="md" style={styles.skeletonChips} />
      <View style={styles.list}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <SkeletonBlock key={index} height={ROW_HEIGHT} corner="lg" style={styles.skeletonRow} />
        ))}
      </View>
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
  search: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  list: {
    paddingHorizontal: spacing[4],
  },
  skeletonChips: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[5],
  },
  skeletonRow: {
    marginBottom: spacing[2],
  },
});
