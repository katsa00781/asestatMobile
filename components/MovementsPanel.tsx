/**
 * Igazolások – a Tabella tab második szegmense (D-110).
 *
 * Design prompt: `docs/design-prompts.md` – P15. Felépítés a prompt szerint:
 * fejléc, nagy cím a mozgásszámmal, szegmentált kontroll, irány-sáv, öt
 * StatTile, majd a szekciózott lista és az értelmezési sáv.
 *
 * Két nézete van, a szűrő csapatválasztása dönt:
 * - **csapatnézet** – két szekció, „Érkezők" és „Távozók";
 * - **liga nézet** (üres csapatszűrő) – csapatonként egy ragadós fejléc, a
 *   csoporton belül előbb az érkezők; a két irányt a sorok bal sínje
 *   különbözteti meg.
 *
 * A lista `SectionList`, nem `ScrollView`: a liga nézet több száz sort is
 * hozhat, és a ragadós csapatfejléc mindkét platformon ebből jön (D-117).
 */
import { useEffect } from 'react';
import { RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from 'expo-router';
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Info, Users } from 'lucide-react-native';

import { AppHeader } from '@/components/AppHeader';
import { EmptyState } from '@/components/EmptyState';
import { ErrorPanel } from '@/components/ErrorPanel';
import { GlowCard } from '@/components/GlowCard';
import { MovementRow } from '@/components/MovementRow';
import { SkeletonBlock } from '@/components/SkeletonBlock';
import { StatTile } from '@/components/StatTile';
import { colors, fontSize, letterSpacing, spacing, tracking } from '@/constants/theme';
import { usePlayerMovements } from '@/hooks/usePlayerMovements';
import { useFilterStore } from '@/store/filterStore';
import type { MovementEntry, MovementSection, MovementTile } from '@/types/movements';

interface MovementsPanelProps {
  /** A képernyő szegmentált kontrollja – a szegmenst a route birtokolja. */
  control: ReactNode;
}

/** Az „ismeretlen" félreértését előre eloszlató sáv szövege. */
const DISCLAIMER =
  'Külföldi klub, alsóbb osztály vagy adathiány is lehet. Külföldi igazolást nem bizonyít.';

/** Az üres eredmény magyarázata – a webes szöveg rövidített párja. */
const EMPTY_DESCRIPTION =
  'Két egymást követő szezon teljes keretadata szükséges; az első importált szezon csak ' +
  'viszonyítási alap. Válassz másik szezont vagy csapatot a szűrőben.';

export function MovementsPanel({ control }: MovementsPanelProps) {
  const insets = useSafeAreaInsets();
  const { view, empty, loading, refreshing, error, reload } = usePlayerMovements();

  // Az üres csapatszűrőt („Összes követett csapat") csak ez a szegmens engedi,
  // és kilépéskor vissza is vonja – ilyenkor az alapcsapat áll vissza (D-114).
  // A fókusz is kapu: a tab elhagyásakor sem maradhat üres a csapatszűrő,
  // különben a többi képernyő lekérdezése szűrő nélkül maradna.
  const focused = useIsFocused();
  const setAllowAllTeams = useFilterStore((state) => state.setAllowAllTeams);
  useEffect(() => {
    if (!focused) return;
    setAllowAllTeams(true);
    return () => setAllowAllTeams(false);
  }, [focused, setAllowAllTeams]);

  const ready = !error && !loading;
  const sections = ready && !empty ? view.sections : [];

  return (
    <SectionList<MovementEntry, MovementSection>
      // A `SectionList`-re a NativeWind nem képez le `className`-t (a
      // css-interop csak a `FlatList`-et és a `VirtualizedList`-et mapeli),
      // ezért a felület itt StyleSheet-ből jön.
      style={styles.list}
      sections={sections}
      keyExtractor={(entry) => entry.id}
      stickySectionHeadersEnabled={view.league}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: spacing[6] }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={reload}
          // Az alapértelmezett spinner világos háttéren világos – sötét témán
          // mindkét platformon külön színt kell adni neki.
          tintColor={colors.accent.cyan}
          colors={[colors.accent.cyan]}
          progressBackgroundColor={colors.bg.surface1}
        />
      }
      ListHeaderComponent={
        <View>
          <AppHeader />

          <View style={styles.title}>
            <Text className="font-condensed text-stat uppercase text-primary">Igazolások</Text>
            {ready ? (
              <Text className="font-mono text-md text-muted" style={styles.total} numberOfLines={1}>
                {view.total}
              </Text>
            ) : null}
          </View>

          <View style={styles.control}>{control}</View>

          {ready ? (
            <>
              <DirectionBar from={view.fromSeason} to={view.toSeason} scope={view.scope} />
              <TileGrid tiles={view.tiles} />
            </>
          ) : null}
        </View>
      }
      renderSectionHeader={({ section }) =>
        section.balance ? (
          <TeamHeader title={section.title} balance={section.balance} />
        ) : (
          <DirectionHeader section={section} />
        )
      }
      renderSectionFooter={({ section }) =>
        section.data.length === 0 ? (
          <Text className="font-body text-sm text-muted" style={styles.sectionEmpty}>
            Nincs ilyen mozgás a választott szezonváltásban.
          </Text>
        ) : null
      }
      renderItem={({ item }) => (
        <View style={styles.item}>
          <MovementRow entry={item} />
        </View>
      )}
      ListFooterComponent={
        <View>
          {error ? <ErrorPanel message={error} onRetry={reload} /> : null}

          {!error && loading ? <MovementsSkeleton /> : null}

          {ready && empty ? (
            <EmptyState
              icon={Users}
              title="Nincs összehasonlítható mozgás"
              description={EMPTY_DESCRIPTION}
            />
          ) : null}

          {ready && !empty ? <Disclaimer /> : null}
        </View>
      }
    />
  );
}

/** Irány-sáv: melyik szezonváltásról van szó, és milyen hatókörben. */
function DirectionBar({ from, to, scope }: { from: string; to: string; scope: string }) {
  return (
    <View style={styles.direction}>
      <View style={styles.transition}>
        <Text className="font-mono text-sm text-primary">{from}</Text>
        {/* Nyílkarakter helyett ikon: a csomagolt JetBrains Mono subsetben
            nincs meg a → glifa, Androidon tofuként jelenne meg (D-031). */}
        <ArrowRight size={13} color={colors.accent.cyan} strokeWidth={2} />
        <Text className="font-mono text-sm text-primary">{to}</Text>
      </View>

      <Text
        className="font-condensed text-label uppercase text-muted"
        style={styles.scope}
        numberOfLines={1}
      >
        {scope}
      </Text>
    </View>
  );
}

/** Öt csempe: 2 oszlop, az ötödik teljes szélességű. */
function TileGrid({ tiles }: { tiles: MovementTile[] }) {
  return (
    <View style={styles.grid}>
      {tiles.map((tile) => (
        <StatTile
          key={tile.label}
          label={tile.label}
          value={tile.value}
          accent={tile.accent}
          style={tile.wide ? styles.tileWide : styles.tile}
        />
      ))}
    </View>
  );
}

/** Csapatnézet szekciófejléce: irányikon + cím + darabszám. */
function DirectionHeader({ section }: { section: MovementSection }) {
  const arrival = section.direction === 'arrival';
  const Icon = arrival ? ArrowDownLeft : ArrowUpRight;

  return (
    <View style={styles.sectionHeader}>
      <Icon
        size={18}
        color={arrival ? colors.accent.cyan : colors.accent.orange}
        strokeWidth={1.8}
      />
      <Text className="font-condensed text-h3 uppercase text-primary" accessibilityRole="header">
        {section.title}
      </Text>
      <Text className="font-mono text-md text-muted">{section.count}</Text>
    </View>
  );
}

/** Liga nézet ragadós csapatfejléce: név + „+4 / -9" mérleg. */
function TeamHeader({
  title,
  balance,
}: {
  title: string;
  balance: { arrivals: string; departures: string };
}) {
  return (
    <View style={styles.teamHeader}>
      <Text
        className="flex-1 font-condensed text-lg text-primary"
        numberOfLines={1}
        accessibilityRole="header"
      >
        {title}
      </Text>
      <Text className="font-mono text-sm" style={{ color: colors.accent.cyan }}>
        {`+${balance.arrivals}`}
      </Text>
      <Text className="font-mono text-sm text-muted">/</Text>
      <Text className="font-mono text-sm" style={{ color: colors.accent.orange }}>
        {`-${balance.departures}`}
      </Text>
    </View>
  );
}

/** Értelmezési sáv – az „ismeretlen" nem bizonyít külföldi igazolást. */
function Disclaimer() {
  return (
    <GlowCard accent="warning" corner="lg" padding={16} style={styles.disclaimer}>
      <View style={styles.disclaimerHead}>
        <Info size={14} color={colors.semantic.warning} strokeWidth={1.8} />
        <Text
          className="font-condensed text-label uppercase text-secondary"
          style={styles.disclaimerLabel}
        >
          Mit jelent az ismeretlen?
        </Text>
      </View>
      <Text className="font-body text-sm text-muted" style={styles.disclaimerBody}>
        {DISCLAIMER}
      </Text>
    </GlowCard>
  );
}

/** Első betöltés: a végleges elrendezés helyőrzői, nem spinner. */
function MovementsSkeleton() {
  return (
    <View style={styles.skeleton}>
      <SkeletonBlock height={28} corner="sm" style={styles.skeletonBlock} />
      <View style={styles.grid}>
        {[0, 1, 2, 3].map((index) => (
          <SkeletonBlock key={index} height={96} corner="xl" style={styles.tile} />
        ))}
        <SkeletonBlock height={96} corner="xl" style={styles.tileWide} />
      </View>
      {[0, 1, 2].map((index) => (
        <SkeletonBlock key={index} height={72} corner="lg" style={styles.skeletonRow} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  title: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[1],
  },
  total: {
    flexShrink: 0,
    fontVariant: ['tabular-nums'],
  },
  control: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
  },
  direction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
    height: 28,
    marginTop: spacing[3],
    marginHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.hairline,
  },
  transition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scope: {
    flexShrink: 1,
    letterSpacing: letterSpacing(fontSize.label, tracking.label),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
  },
  tile: {
    flexGrow: 1,
    flexBasis: '46%',
  },
  tileWide: {
    flexGrow: 1,
    flexBasis: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
    paddingBottom: spacing[3],
    backgroundColor: colors.bg.base,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.hairline,
    backgroundColor: colors.bg.base,
  },
  sectionEmpty: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
  },
  item: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[2],
  },
  disclaimer: {
    marginHorizontal: spacing[4],
    marginTop: spacing[6],
  },
  disclaimerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  disclaimerLabel: {
    letterSpacing: letterSpacing(fontSize.label, tracking.label),
  },
  disclaimerBody: {
    marginTop: 6,
  },
  skeleton: {
    paddingTop: spacing[3],
  },
  skeletonBlock: {
    marginHorizontal: spacing[4],
  },
  skeletonRow: {
    marginHorizontal: spacing[4],
    marginTop: spacing[2],
  },
});
