import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as dashboardTypes from '@core/dashboard-types';
import * as fetchAllRows from '@core/fetch-all-rows';
import * as kosarstatClutchParse from '@core/kosarstat-clutch-parse';
import * as playerAnalysis from '@core/player-analysis';
import * as playerPostgame from '@core/player-postgame';
import * as playerStatMapping from '@core/player-stat-mapping';
import * as positions from '@core/positions';
import * as postgameReport from '@core/postgame-report';
import * as pregameScouting from '@core/pregame-scouting';
import * as seasonTables from '@core/season-tables';
import * as situationalAnalysis from '@core/situational-analysis';
import * as statFormulas from '@core/stat-formulas';
import * as styleVocabulary from '@core/style-vocabulary';
import * as teamAnalysis from '@core/team-analysis';
import * as terminology from '@core/terminology';

import { FilterSheet } from '@/components/FilterSheet';
import { colors, letterSpacing, radius, tracking } from '@/constants/theme';
import { useFilterData } from '@/hooks/useFilterData';
import { usePressed } from '@/hooks/usePressed';
import { useAuthStore } from '@/store/authStore';

/** Ideiglenes füstteszt képernyő – az S3 lezárása után a `(tabs)` váltja fel. */
const CORE_MODULES = {
  'stat-formulas': statFormulas,
  positions,
  terminology,
  'style-vocabulary': styleVocabulary,
  'dashboard-types': dashboardTypes,
  'player-stat-mapping': playerStatMapping,
  'season-tables': seasonTables,
  'fetch-all-rows': fetchAllRows,
  'situational-analysis': situationalAnalysis,
  'kosarstat-clutch-parse': kosarstatClutchParse,
  'postgame-report': postgameReport,
  'player-analysis': playerAnalysis,
  'player-postgame': playerPostgame,
  'pregame-scouting': pregameScouting,
  'team-analysis': teamAnalysis,
};

// Valós számokkal hívott képlet – ez bizonyítja, hogy a @core fut Metro alatt.
const trueShooting = statFormulas.formatPercent(statFormulas.trueShootingPct(22, 14, 6));
const effectiveFg = statFormulas.formatPercent(statFormulas.effectiveFgPct(8, 3, 14));
const valuation = statFormulas.simpleValuation({
  points: 22,
  rebounds: 4,
  assists: 6,
  steals: 2,
  blocks: 1,
  fgMade: 8,
  fgAttempted: 14,
  ftMade: 5,
  ftAttempted: 6,
  turnovers: 3,
});

export default function SmokeTestScreen() {
  const insets = useSafeAreaInsets();
  const email = useAuthStore((state) => state.user?.email);
  const signOut = useAuthStore((state) => state.signOut);
  const signOutButton = usePressed();
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <>
      <ScrollView
        className="flex-1 bg-base"
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 16,
        }}
      >
        <View className="flex-row items-center justify-between">
          <Text className="font-condensed text-h2 text-primary">ASE STATS</Text>
          <FilterChip onPress={() => setFilterOpen(true)} />
        </View>
        <Text className="mt-6 font-condensed text-label uppercase tracking-widest text-muted">
          @core füstteszt
        </Text>

        <View className="mt-16 flex-row items-center justify-between">
          <Text className="font-body text-sm text-secondary">{email ?? 'Ismeretlen felhasználó'}</Text>
          <Pressable
            onPress={() => void signOut()}
            {...signOutButton.pressHandlers}
            accessibilityRole="button"
            style={{
              height: 44,
              paddingHorizontal: 16,
              justifyContent: 'center',
              borderRadius: radius.md,
              backgroundColor: signOutButton.pressed ? colors.bg.surface3 : colors.bg.surface2,
              borderWidth: 1,
              borderColor: colors.border.subtle,
            }}
          >
            <Text
              className="font-condensed text-sm uppercase text-primary"
              style={{ letterSpacing: letterSpacing(13, tracking.wide) }}
            >
              Kijelentkezés
            </Text>
          </Pressable>
        </View>

        <View className="mt-16 gap-12">
          <StatRow label="True Shooting" value={trueShooting} />
          <StatRow label="Effective FG" value={effectiveFg} />
          <StatRow label="Valuation" value={String(valuation)} />
        </View>

        <Text className="mt-24 font-condensed text-label uppercase text-secondary">
          Betöltött modulok
        </Text>
        <View className="mt-8 gap-2">
          {Object.entries(CORE_MODULES).map(([name, mod]) => (
            <View key={name} className="flex-row items-center justify-between">
              <Text className="font-body text-sm text-secondary">{name}</Text>
              <Text className="font-mono text-xs text-positive">
                {Object.keys(mod).length} export
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <FilterSheet visible={filterOpen} onClose={() => setFilterOpen(false)} />
    </>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-xl bg-surface1 p-14">
      <Text className="font-condensed text-label uppercase text-secondary">{label}</Text>
      <Text className="mt-8 font-mono-bold text-stat text-primary">{value}</Text>
    </View>
  );
}

/**
 * Ideiglenes szűrő-chip a `FilterSheet` kipróbálásához. A végleges helye a
 * tab-fejléc lesz (S6), a mockup szerinti alakot már itt is tartja.
 */
function FilterChip({ onPress }: { onPress: () => void }) {
  const chip = usePressed();
  const { selectedSeason, selectedTeam } = useFilterData();

  return (
    <Pressable
      onPress={onPress}
      {...chip.pressHandlers}
      accessibilityRole="button"
      accessibilityLabel="Szűrő megnyitása"
      // A chip 32pt magas, a hiányzó 12pt-ot hitSlop pótolja.
      hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 32,
        paddingHorizontal: 12,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border.subtle,
        backgroundColor: chip.pressed ? colors.bg.surface3 : colors.bg.surface2,
      }}
    >
      <Text className="font-body text-sm text-primary" numberOfLines={1}>
        {selectedSeason?.name ?? '…'} · {selectedTeam?.shortName ?? '…'}
      </Text>
      <Text className="font-body text-tiny text-secondary">▾</Text>
    </Pressable>
  );
}
