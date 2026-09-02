/**
 * Vízszintesen görgethető chipsor – egy elem választható ki.
 *
 * Mockup: `docs/mockups/extracted/jatekosok-lista.html` rendezés-chipjei.
 * Aktív chip: cián glow réteg (kitöltés + keret) és cián felirat, mellette
 * lefelé mutató nyíl, ami a csökkenő sorrendet jelzi. Inaktív: surface2,
 * keret nélkül, secondary felirat.
 */
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { ChevronDown } from 'lucide-react-native';

import { colors, fontSize, glow, letterSpacing, radius, spacing, tracking } from '@/constants/theme';
import { usePressed } from '@/hooks/usePressed';

export interface ChipOption {
  key: string;
  label: string;
}

interface ChipRowProps {
  options: ChipOption[];
  activeKey: string;
  onSelect: (key: string) => void;
  /** Képernyőolvasónak: mit választ ki a sor, pl. „Rendezés". */
  accessibilityLabel: string;
  /** Kívülről csak elhelyezés (margó) – felületet ne írj át. */
  style?: StyleProp<ViewStyle>;
}

/** A chip magassága a mockupból; a hiányzó 12pt-ot hitSlop pótolja. */
const CHIP_HEIGHT = 32;

export function ChipRow({ options, activeKey, onSelect, accessibilityLabel, style }: ChipRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.track}
      accessibilityLabel={accessibilityLabel}
      style={style}
    >
      {options.map((option) => (
        <Chip
          key={option.key}
          label={option.label}
          active={option.key === activeKey}
          onPress={() => onSelect(option.key)}
        />
      ))}
    </ScrollView>
  );
}

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function Chip({ label, active, onPress }: ChipProps) {
  const chip = usePressed();

  const background = chipBackground(active, chip.pressed);

  return (
    <Pressable
      onPress={onPress}
      {...chip.pressHandlers}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      // A chip 32pt magas: a hiányzó 12pt hitSlopból jön, és a sor 20pt-os
      // alsó térközén belül marad, tehát nem lóg ki a szülőből (D-038).
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      style={[
        styles.chip,
        {
          backgroundColor: background,
          borderColor: active ? glow.cyan.border : 'transparent',
        },
      ]}
    >
      <Text
        className="font-condensed text-label uppercase"
        style={[styles.label, { color: active ? colors.accent.cyan : colors.text.secondary }]}
        numberOfLines={1}
      >
        {label}
      </Text>

      {/* Geometriai nyílkarakter helyett ikon: a csomagolt Barlow Condensed
          subsetben nincs meg a ▾ glifa (D-031). */}
      {active ? <ChevronDown size={12} color={colors.accent.cyan} strokeWidth={2} /> : null}
    </Pressable>
  );
}

/** Aktív: cián glow kitöltés. Inaktív: surface2, lenyomva surface3. */
function chipBackground(active: boolean, pressed: boolean): string {
  if (active) return glow.cyan.fill;
  return pressed ? colors.bg.surface3 : colors.bg.surface2;
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[5],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: CHIP_HEIGHT,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  label: {
    letterSpacing: letterSpacing(fontSize.label, tracking.wide),
  },
});
