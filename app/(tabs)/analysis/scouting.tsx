/**
 * Ellenfél scouting – a következő ellenfél erősségei és gyengéi.
 *
 * A számítást a `@core/pregame-scouting` végzi, az adatot a `useScoutingData`
 * tölti, a megjelenítési modellt a `lib/scouting-view` állítja össze – ez a
 * fájl csak elrendez.
 *
 * Az elemzett ellenfél alapból a következő találkozóé, ennek híján a legutóbb
 * lejátszott meccsé; a felső sávról bármelyik ligacsapatra átváltható (D-080).
 */
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ListChecks, ShieldAlert, Swords, Target, TriangleAlert, Users } from 'lucide-react-native';

import { BackHeader } from '@/components/BackHeader';
import { ChancePanel } from '@/components/ChancePanel';
import { EmptyState } from '@/components/EmptyState';
import { ErrorPanel } from '@/components/ErrorPanel';
import { InsightCard } from '@/components/InsightCard';
import { OpponentBar } from '@/components/OpponentBar';
import { OpponentSheet } from '@/components/OpponentSheet';
import { PointList } from '@/components/PointList';
import { ProfilePanel } from '@/components/ProfilePanel';
import { SegmentedControl } from '@/components/SegmentedControl';
import { SkeletonBlock } from '@/components/SkeletonBlock';
import { SplitHeader } from '@/components/SplitHeader';
import { SplitMetricRow } from '@/components/SplitMetricRow';
import { StatMatrix } from '@/components/StatMatrix';
import { fontSize, letterSpacing, spacing, tracking } from '@/constants/theme';
import { useScoutingData } from '@/hooks/useScoutingData';
import { shortenPlayerName } from '@/lib/format';
import type { ScoutingSegment, ScoutingView } from '@/types/scouting';

const SEGMENTS = [
  { key: 'overview', label: 'Áttekintés' },
  { key: 'plan', label: 'Terv' },
  { key: 'players', label: 'Kulcsemberek' },
] as const;

/** Az ellenfél kiemelt játékosainak oszlopai. */
const PLAYER_COLUMNS = [
  { label: 'Perc', width: 44 },
  { label: 'VAL/36', width: 52 },
  { label: 'Pont/36', width: 56 },
];

/** A poszt-összehasonlítás oszlopai – VAL/36 értékek. */
const POSITION_COLUMNS = [
  { label: 'Saját', width: 52 },
  { label: 'Ellenfél', width: 60 },
  { label: 'Kül.', width: 52 },
];

export default function ScoutingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [segment, setSegment] = useState<ScoutingSegment>('overview');

  const { view, opponents, selected, meta, hasData, loading, error, reload } =
    useScoutingData(opponentId);

  const ready = !error && !loading;

  return (
    <>
      <ScrollView
        className="flex-1 bg-base"
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: spacing[6] }}
        showsVerticalScrollIndicator={false}
      >
        <BackHeader
          label="Elemzés"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/analysis'))}
        />

        <Text className="font-condensed text-lg uppercase text-primary" style={styles.title}>
          Ellenfél scouting
        </Text>

        {error ? <ErrorPanel message={error} onRetry={reload} /> : null}

        {!error && loading ? <ScoutingSkeleton /> : null}

        {ready && selected && meta ? (
          <OpponentBar
            name={selected.name}
            meta={meta}
            onPress={() => setSheetOpen(true)}
            style={styles.block}
          />
        ) : null}

        {ready && view ? (
          <>
            <SegmentedControl
              options={SEGMENTS.map(({ key, label }) => ({ key, label }))}
              activeKey={segment}
              onSelect={(key) => setSegment(key as ScoutingSegment)}
              accessibilityLabel="Nézet"
              style={styles.block}
            />

            {segment === 'overview' ? <OverviewSegment view={view} /> : null}
            {segment === 'plan' ? <PlanSegment view={view} /> : null}
            {segment === 'players' ? <PlayersSegment view={view} /> : null}

            <Text className="font-body text-sm text-muted" style={styles.coverage}>
              {view.coverage[segment]}
            </Text>

            <InsightCard fragments={view.insights[segment]} style={styles.block} />
          </>
        ) : null}

        {ready && !view ? (
          <EmptyState
            icon={Swords}
            title={hasData ? 'Nincs elemezhető ellenfél' : 'Nincs elemezhető adat'}
            description={
              hasData
                ? 'Ehhez az ellenfélhez nincs keretadat a szezonban. Válassz másik csapatot.'
                : 'Ehhez a szezonhoz nincs betöltött meccs- és játékosstatisztika. Válassz másikat a szűrőben.'
            }
          />
        ) : null}
      </ScrollView>

      <OpponentSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        options={opponents}
        selectedId={selected?.id ?? null}
        onSelect={setOpponentId}
      />
    </>
  );
}

function OverviewSegment({ view }: { view: ScoutingView }) {
  return (
    <>
      <SplitHeader home={view.own} away={view.opponent} style={styles.block} />

      <ChancePanel chance={view.chance} style={styles.block} />

      {view.profiles.map((profile, index) => (
        <ProfilePanel
          key={profile.label}
          profile={profile}
          tone={index === 0 ? 'orange' : 'cyan'}
          style={styles.block}
        />
      ))}

      <View style={styles.metrics}>
        {view.metrics.map((metric, index) => (
          <SplitMetricRow key={metric.label} metric={metric} divided={index > 0} />
        ))}
      </View>
    </>
  );
}

function PlanSegment({ view }: { view: ScoutingView }) {
  return (
    <>
      {view.threats.length > 0 ? (
        <PointList
          label="Az ellenfél veszélyforrásai"
          entries={view.threats}
          icon={TriangleAlert}
          tone="negative"
          style={styles.block}
        />
      ) : null}

      {view.vulnerabilities.length > 0 ? (
        <PointList
          label="Támadható pontjai"
          entries={view.vulnerabilities}
          icon={Target}
          tone="positive"
          style={styles.block}
        />
      ) : null}

      {view.focusPoints.length > 0 ? (
        <PointList
          label="Fókuszpontok"
          entries={view.focusPoints}
          icon={ListChecks}
          tone="cyan"
          style={styles.block}
        />
      ) : null}

      {view.responses.length > 0 ? (
        <PointList
          label="Ha bekövetkezik"
          entries={view.responses}
          icon={ShieldAlert}
          tone="warning"
          style={styles.block}
        />
      ) : null}
    </>
  );
}

function PlayersSegment({ view }: { view: ScoutingView }) {
  return (
    <>
      {view.keyPlayers.length > 0 ? (
        <PointList
          label="Kulcsemberek"
          entries={view.keyPlayers.map((group) => ({
            text: group.label,
            note: group.names.join(' · '),
          }))}
          icon={Users}
          tone="orange"
          style={styles.block}
        />
      ) : null}

      {view.players.length > 0 ? (
        <StatMatrix
          labelHeader="Játékos"
          columns={PLAYER_COLUMNS}
          rows={view.players.map((player) => ({
            label: shortenPlayerName(player.name),
            values: [player.minutesText, player.valText, player.pointsText],
          }))}
          style={styles.block}
        />
      ) : null}

      {view.positions.length > 0 ? (
        <StatMatrix
          labelHeader="Poszt"
          labelWidth={96}
          columns={POSITION_COLUMNS}
          rows={view.positions.map((position) => ({
            label: position.label,
            values: [
              position.ownText,
              position.opponentText,
              { value: position.deltaText, tone: position.positive ? 'positive' : 'negative' },
            ],
          }))}
          style={styles.block}
        />
      ) : null}
    </>
  );
}

/** Első betöltés: a végleges elrendezés helyőrzői, nem spinner. */
function ScoutingSkeleton() {
  return (
    <>
      <SkeletonBlock height={60} corner="lg" style={styles.block} />
      <SkeletonBlock height={36} corner="md" style={styles.block} />
      <SkeletonBlock height={96} corner="lg" style={styles.block} />
      {[0, 1, 2].map((index) => (
        <SkeletonBlock key={index} height={64} corner="sm" style={styles.block} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
    letterSpacing: letterSpacing(fontSize.lg, tracking.label),
  },
  block: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  metrics: {
    marginHorizontal: spacing[4],
  },
  coverage: {
    marginHorizontal: spacing[4],
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
});
