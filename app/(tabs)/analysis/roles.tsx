/**
 * Szerepkör-elemzés – ki mit tesz hozzá a csapatjátékhoz.
 *
 * A számítást a `@core/team-analysis` végzi, az adatot a `useTeamRolesData`
 * tölti, a megjelenítési modellt a `lib/roles-view` állítja össze – ez a fájl
 * csak elrendez.
 *
 * A képernyő mindig a szűrőben kiválasztott csapatot elemzi, a liga
 * mezőnyéhez mérve. Ellenfélváltó nincs: a P12 sora a **saját** csapatunk
 * keretéről szól.
 */
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  CircleAlert,
  Copy,
  Minus,
  ThumbsDown,
  ThumbsUp,
  TriangleAlert,
  UserRoundCheck,
  Users,
} from 'lucide-react-native';

import { BackHeader } from '@/components/BackHeader';
import { EmptyState } from '@/components/EmptyState';
import { ErrorPanel } from '@/components/ErrorPanel';
import { InsightCard } from '@/components/InsightCard';
import { MeterList } from '@/components/MeterList';
import { PointList } from '@/components/PointList';
import { ProfilePanel } from '@/components/ProfilePanel';
import { SegmentedControl } from '@/components/SegmentedControl';
import { SkeletonBlock } from '@/components/SkeletonBlock';
import { fontSize, letterSpacing, spacing, tracking } from '@/constants/theme';
import { useTeamRolesData } from '@/hooks/useTeamRolesData';
import type { RolesSegment, RolesView } from '@/types/roles';

const SEGMENTS = [
  { key: 'roles', label: 'Szerepkörök' },
  { key: 'load', label: 'Terhelés' },
  { key: 'profile', label: 'Csapatkép' },
] as const;

export default function RolesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [segment, setSegment] = useState<RolesSegment>('roles');

  const { view, hasData, loading, error, reload } = useTeamRolesData();

  const ready = !error && !loading;

  return (
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
        Szerepkör-elemzés
      </Text>

      {error ? <ErrorPanel message={error} onRetry={reload} /> : null}

      {!error && loading ? <RolesSkeleton /> : null}

      {ready && view ? (
        <>
          <Text className="font-body-medium text-md text-secondary" style={styles.team}>
            {view.teamName}
          </Text>

          <SegmentedControl
            options={SEGMENTS.map(({ key, label }) => ({ key, label }))}
            activeKey={segment}
            onSelect={(key) => setSegment(key as RolesSegment)}
            accessibilityLabel="Nézet"
            style={styles.block}
          />

          {segment === 'roles' ? <RoleGroupsSegment view={view} /> : null}
          {segment === 'load' ? <LoadSegment view={view} /> : null}
          {segment === 'profile' ? <ProfileSegment view={view} /> : null}

          <Text className="font-body text-sm text-muted" style={styles.coverage}>
            {view.coverage[segment]}
          </Text>

          <InsightCard fragments={view.insights[segment]} style={styles.block} />
        </>
      ) : null}

      {ready && !view ? (
        <EmptyState
          icon={Users}
          title={hasData ? 'Nincs elemezhető keret' : 'Nincs elemezhető adat'}
          description={
            hasData
              ? 'Ehhez a csapathoz nincs keretadat a szezonban. Válassz másik csapatot a szűrőben.'
              : 'Ehhez a szezonhoz nincs betöltött meccs- és játékosstatisztika. Válassz másikat a szűrőben.'
          }
        />
      ) : null}
    </ScrollView>
  );
}

function RoleGroupsSegment({ view }: { view: RolesView }) {
  return (
    <>
      {view.covered.length > 0 ? (
        <PointList
          label="Lefedett szerepkörök"
          entries={view.covered}
          icon={UserRoundCheck}
          tone="positive"
          style={styles.block}
        />
      ) : null}

      {view.redundant.length > 0 ? (
        <PointList
          label="Többszörösen lefedve"
          entries={view.redundant}
          icon={Copy}
          tone="cyan"
          style={styles.block}
        />
      ) : null}

      {view.missing.length > 0 ? (
        <PointList
          label="Hiányzó szerepkörök"
          entries={view.missing}
          icon={Minus}
          tone="warning"
          style={styles.block}
        />
      ) : null}

      {view.notes.length > 0 ? (
        <PointList
          label="Keret-értelmezés"
          entries={view.notes}
          icon={Users}
          tone="cyan"
          style={styles.block}
        />
      ) : null}
    </>
  );
}

function LoadSegment({ view }: { view: RolesView }) {
  return (
    <>
      <MeterList entries={[view.usage]} label="Labdaigény" style={styles.block} />

      {view.positions.length > 0 ? (
        <MeterList entries={view.positions} label="Játékpercek posztonként" style={styles.block} />
      ) : null}

      {view.heightText ? (
        <Text className="font-body text-sm text-secondary" style={styles.height}>
          {view.heightText}
        </Text>
      ) : null}

      {view.flags.length > 0 ? (
        <PointList
          label="Keretkockázat"
          entries={view.flags}
          icon={CircleAlert}
          tone="warning"
          style={styles.block}
        />
      ) : null}
    </>
  );
}

function ProfileSegment({ view }: { view: RolesView }) {
  return (
    <>
      <ProfilePanel profile={view.profile} tone="cyan" style={styles.block} />

      {view.clusterPeersText ? (
        <Text className="font-body text-sm text-muted" style={styles.peers}>
          {view.clusterPeersText}
        </Text>
      ) : null}

      {view.league.length > 0 ? (
        <MeterList entries={view.league} label="Liga-percentilisek" style={styles.block} />
      ) : null}

      {view.strengths.length > 0 ? (
        <PointList
          label="Erősségek"
          entries={view.strengths}
          icon={ThumbsUp}
          tone="positive"
          style={styles.block}
        />
      ) : null}

      {view.limitations.length > 0 ? (
        <PointList
          label="Korlátok"
          entries={view.limitations}
          icon={ThumbsDown}
          tone="negative"
          style={styles.block}
        />
      ) : null}

      {view.risks.length > 0 ? (
        <PointList
          label="Kockázatok"
          entries={view.risks}
          icon={TriangleAlert}
          tone="warning"
          style={styles.block}
        />
      ) : null}
    </>
  );
}

/** Első betöltés: a végleges elrendezés helyőrzői, nem spinner. */
function RolesSkeleton() {
  return (
    <View>
      <SkeletonBlock height={20} width="45%" style={styles.block} />
      <SkeletonBlock height={36} corner="md" style={styles.block} />
      {[0, 1, 2].map((index) => (
        <SkeletonBlock key={index} height={110} corner="lg" style={styles.block} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[2],
    letterSpacing: letterSpacing(fontSize.lg, tracking.label),
  },
  team: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  block: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  height: {
    marginHorizontal: spacing[4],
    marginTop: -spacing[2],
    marginBottom: spacing[4],
  },
  peers: {
    marginHorizontal: spacing[4],
    marginTop: -spacing[2],
    marginBottom: spacing[4],
  },
  coverage: {
    marginHorizontal: spacing[4],
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
});
