/**
 * Szűrő bottom sheet – szezon és csapat választás.
 *
 * Mockup: `docs/mockups/extracted/szuro-bottom-sheet.html`.
 * A választás azonnal érvényesül (nincs „Mégse"), a „Kész" csak bezár – ezt a
 * mockup is így mutatja: az aktív sor rögtön ciánra vált.
 *
 * A lapot, a záró gesztust és az Android back kezelését a `BottomSheet` adja;
 * itt csak a tartalom van.
 *
 * A listákat maga a sheet kéri le a `useFilterData`-ból: a hook modulszintű
 * cache-e miatt ez nem jelent plusz hálózati kérést (D-014).
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { BottomSheet } from '@/components/BottomSheet';
import { ErrorPanel } from '@/components/ErrorPanel';
import { SkeletonBlock } from '@/components/SkeletonBlock';
import { colors, fontSize, letterSpacing, radius, tracking } from '@/constants/theme';
import { useFilterData } from '@/hooks/useFilterData';
import { usePressed } from '@/hooks/usePressed';
import { useFilterStore } from '@/store/filterStore';

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function FilterSheet({ visible, onClose }: FilterSheetProps) {
  const { seasons, teams, loading, error, reload } = useFilterData();

  const selectedSeasonId = useFilterStore((state) => state.selectedSeasonId);
  const selectedTeamId = useFilterStore((state) => state.selectedTeamId);
  const setSeason = useFilterStore((state) => state.setSeason);
  const setTeam = useFilterStore((state) => state.setTeam);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Szűrő"
      footnote="A választás megjegyződik a következő indításig."
    >
      {error ? (
        <View className="mb-16">
          <ErrorPanel message={error} onRetry={reload} variant="inline" />
        </View>
      ) : null}

      <Section label="Szezon">
        {seasons.length === 0 && loading ? (
          <PlaceholderRows count={4} />
        ) : (
          seasons.map((season) => (
            <OptionRow
              key={season.id}
              label={season.name}
              numeric
              active={season.id === selectedSeasonId}
              onPress={() => setSeason(season.id)}
            />
          ))
        )}
        {seasons.length === 0 && !loading && !error ? (
          <EmptyRow text="Nincs elérhető szezon." />
        ) : null}
      </Section>

      <SectionDivider />

      <Section label="Csapat">
        {teams.length === 0 && loading ? (
          <PlaceholderRows count={3} />
        ) : (
          teams.map((team) => (
            <OptionRow
              key={team.id}
              label={team.name}
              active={team.id === selectedTeamId}
              onPress={() => setTeam(team.id)}
            />
          ))
        )}
        {teams.length === 0 && !loading && !error ? (
          <EmptyRow text="Nincs elérhető csapat." />
        ) : null}
      </Section>
    </BottomSheet>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Text
        className="mb-4 font-condensed text-label uppercase text-secondary"
        style={{ letterSpacing: letterSpacing(fontSize.label, tracking.label) }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

/**
 * Egy választható sor. A `numeric` a szezonokra igaz: a `CLAUDE.md` szerint
 * minden numerikus érték JetBrains Monóval megy.
 */
function OptionRow({
  label,
  active,
  numeric = false,
  onPress,
}: {
  label: string;
  active: boolean;
  numeric?: boolean;
  onPress: () => void;
}) {
  const row = usePressed();

  return (
    <Pressable
      onPress={onPress}
      {...row.pressHandlers}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      style={[
        styles.row,
        { backgroundColor: active || row.pressed ? colors.bg.surface3 : 'transparent' },
      ]}
    >
      {active ? <View style={styles.activeBar} /> : null}
      <Text
        className={numeric ? 'font-mono text-md' : 'font-body-medium text-md'}
        style={{ color: active ? colors.accent.cyan : colors.text.primary }}
        numberOfLines={1}
      >
        {label}
      </Text>
      {active ? <Check size={16} color={colors.accent.cyan} strokeWidth={2.2} /> : null}
    </Pressable>
  );
}

/** A mockup halványuló szélű elválasztója. Gradienshez a már meglévő SVG-t használjuk. */
function SectionDivider() {
  return (
    <View style={styles.divider}>
      <Svg width="100%" height={1}>
        <Defs>
          <LinearGradient id="filterSheetDivider" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.border.subtle} stopOpacity={0} />
            <Stop offset="0.5" stopColor={colors.border.subtle} stopOpacity={1} />
            <Stop offset="1" stopColor={colors.border.subtle} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="1" fill="url(#filterSheetDivider)" />
      </Svg>
    </View>
  );
}

/** Betöltés alatti helykitöltő – a sheet surface2 felületén surface3 blokk. */
function PlaceholderRows({ count }: { count: number }) {
  return (
    <View>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.row}>
          <SkeletonBlock width="55%" height={12} surface="surface3" />
        </View>
      ))}
    </View>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <View style={styles.row}>
      <Text className="font-body text-sm text-muted">{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingLeft: 16,
    paddingRight: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.row,
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 2,
    backgroundColor: colors.accent.cyan,
    borderTopRightRadius: radius.xs,
    borderBottomRightRadius: radius.xs,
  },
  divider: {
    marginVertical: 18,
  },
});
