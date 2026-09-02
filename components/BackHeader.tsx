/**
 * Visszalépés sáv a stacken belüli részletképernyők tetején.
 *
 * A részletképernyők nem az `AppHeader`-t viselik: a szűrő-chip átállítása
 * kiléptetné a felhasználót az éppen nézett meccs vagy játékos alól (D-046).
 * Helyette ez a 44pt-os sáv áll a képernyő tetején, a fejléc bal margójával.
 */
import { Pressable, StyleSheet, Text } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

import { colors, fontSize, letterSpacing, tapTarget, tracking } from '@/constants/theme';
import { usePressed } from '@/hooks/usePressed';

interface BackHeaderProps {
  onPress: () => void;
  /** A gomb felirata – alapértelmezésben „Vissza". */
  label?: string;
}

export function BackHeader({ onPress, label = 'Vissza' }: BackHeaderProps) {
  const button = usePressed();

  return (
    <Pressable
      onPress={onPress}
      {...button.pressHandlers}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.button, { opacity: button.pressed ? 0.6 : 1 }]}
    >
      <ArrowLeft size={18} color={colors.text.secondary} strokeWidth={2} />
      <Text
        className="font-condensed text-sm uppercase text-secondary"
        style={{ letterSpacing: letterSpacing(fontSize.sm, tracking.wide) }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    // A teljes sáv a gomb, hogy az érintési célpont 44pt magas legyen; a bal
    // margó az `AppHeader`-ével egyezik.
    height: tapTarget,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
  },
});
