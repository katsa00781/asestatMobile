/**
 * Képernyő-fejléc – app név, szűrő-chip, beállítás gomb.
 *
 * Mockup: `docs/mockups/extracted/ma-screen.html` felső 44pt-os sora. Minden
 * tab ezt használja, és ez a fejléc birtokolja a két bottom sheetet is, hogy a
 * képernyőknek ne kelljen a nyitott állapotot vezetniük.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, Settings } from 'lucide-react-native';

import { FilterSheet } from '@/components/FilterSheet';
import { SettingsSheet } from '@/components/SettingsSheet';
import { colors, radius, tapTarget } from '@/constants/theme';
import { useFilterData } from '@/hooks/useFilterData';
import { usePressed } from '@/hooks/usePressed';

/** Az app rövid neve a bal felső sarokban – a mockup fix felirata. */
const APP_MARK = 'ASE';

export function AppHeader() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <View style={styles.header}>
      <Text className="font-condensed-bold text-lg text-primary">{APP_MARK}</Text>

      <FilterChip onPress={() => setFilterOpen(true)} />

      <SettingsButton onPress={() => setSettingsOpen(true)} />

      <FilterSheet visible={filterOpen} onClose={() => setFilterOpen(false)} />
      <SettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </View>
  );
}

/** Az aktuális szezon és csapat, egy koppintásra a szűrővel. */
function FilterChip({ onPress }: { onPress: () => void }) {
  const chip = usePressed();
  const { selectedSeason, selectedTeam } = useFilterData();

  return (
    <Pressable
      onPress={onPress}
      {...chip.pressHandlers}
      accessibilityRole="button"
      accessibilityLabel="Szűrő megnyitása"
      // A chip 32pt magas, a hiányzó 12pt-ot hitSlop pótolja – a fejléc 44pt-os
      // magasságán belül, tehát a slop nem lóg ki a szülőből (D-038).
      hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
      style={[
        styles.chip,
        { backgroundColor: chip.pressed ? colors.bg.surface3 : colors.bg.surface2 },
      ]}
    >
      <Text className="font-body text-sm text-primary" numberOfLines={1}>
        {selectedSeason?.name ?? '…'} · {selectedTeam?.shortName ?? '…'}
      </Text>
      {/* Geometriai nyílkarakter helyett ikon: a csomagolt DM Sans subsetben
          nincs meg a ▾ glifa, Androidon tofuként jelenne meg (D-031). */}
      <ChevronDown size={12} color={colors.text.secondary} strokeWidth={2} />
    </Pressable>
  );
}

function SettingsButton({ onPress }: { onPress: () => void }) {
  const button = usePressed();

  return (
    <Pressable
      onPress={onPress}
      {...button.pressHandlers}
      accessibilityRole="button"
      accessibilityLabel="Beállítások"
      style={[styles.settings, { opacity: button.pressed ? 0.6 : 1 }]}
    >
      <Settings size={22} color={colors.text.muted} strokeWidth={1.6} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: tapTarget,
    paddingLeft: 16,
    // A fogaskerék érintési doboza 44pt széles, az ikon 22pt: a jobb oldali
    // margó ezért 5, hogy az ikon a mockup szerinti 16pt-ra álljon a szélétől.
    paddingRight: 5,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    // A hosszabb szezon–csapat páros se tolja szét a fejlécet.
    flexShrink: 1,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  settings: {
    width: tapTarget,
    height: tapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
