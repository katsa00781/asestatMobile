/**
 * Szegmentált kontroll – teljes szélességű nézetváltó egy képernyőn belül.
 *
 * Design prompt: `asestats/context/mobile/mobile-design-prompts.md` P5/P7/P13:
 * 36pt magas, surface1 alap, `md` sarok, Barlow Condensed 11pt ALL CAPS.
 * Az aktív szegmens surface3 hátteret, cián feliratot és alul 2pt cián csíkot
 * kap.
 *
 * A 36pt kevesebb a 44pt-os érintési célpontnál, ezért a szegmensek 4-4pt
 * `hitSlop`-ot kapnak. A hitSlop csak a szülő határain belül fog (D-038),
 * ezért a kontroll egy 4pt függőleges paddinges keretben ül – a hiányzó 8pt
 * így a kereten belül marad.
 */
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, letterSpacing, radius, tracking } from '@/constants/theme';
import { usePressed } from '@/hooks/usePressed';

export interface SegmentOption {
  key: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  activeKey: string;
  onSelect: (key: string) => void;
  /** Képernyőolvasónak: mit vált a kontroll, pl. „Nézet". */
  accessibilityLabel: string;
  /** Kívülről csak elhelyezés (margó) – felületet ne írj át. */
  style?: StyleProp<ViewStyle>;
}

/** A prompt sávmagassága. */
const CONTROL_HEIGHT = 36;
/** Az aktív szegmens alsó jelölőcsíkja. */
const INDICATOR = 2;

export function SegmentedControl({
  options,
  activeKey,
  onSelect,
  accessibilityLabel,
  style,
}: SegmentedControlProps) {
  return (
    <View style={[styles.frame, style]} accessibilityLabel={accessibilityLabel}>
      <View style={styles.track}>
        {options.map((option) => (
          <Segment
            key={option.key}
            label={option.label}
            active={option.key === activeKey}
            onPress={() => onSelect(option.key)}
          />
        ))}
      </View>
    </View>
  );
}

interface SegmentProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function Segment({ label, active, onPress }: SegmentProps) {
  const segment = usePressed();

  return (
    <Pressable
      onPress={onPress}
      {...segment.pressHandlers}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      hitSlop={{ top: 4, bottom: 4 }}
      style={[styles.segment, { backgroundColor: background(active, segment.pressed) }]}
    >
      <Text
        className="font-condensed text-label uppercase"
        style={[styles.label, { color: active ? colors.accent.cyan : colors.text.secondary }]}
        numberOfLines={1}
      >
        {label}
      </Text>

      {active ? <View style={styles.indicator} /> : null}
    </Pressable>
  );
}

/** Aktív: surface3. Inaktív: átlátszó, lenyomva surface2. */
function background(active: boolean, pressed: boolean): string {
  if (active) return colors.bg.surface3;
  return pressed ? colors.bg.surface2 : 'transparent';
}

const styles = StyleSheet.create({
  frame: {
    paddingVertical: 4,
  },
  track: {
    flexDirection: 'row',
    height: CONTROL_HEIGHT,
    borderRadius: radius.md,
    backgroundColor: colors.bg.surface1,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    letterSpacing: letterSpacing(fontSize.label, tracking.wider),
  },
  indicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: INDICATOR,
    backgroundColor: colors.accent.cyan,
  },
});
