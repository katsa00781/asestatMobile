/**
 * Kártya alap – a webes `Card` mobil párja.
 *
 * Mockup: `docs/mockups/extracted/ma-screen.html` (következő meccs, „Legutóbb")
 * és `p0-style-tile.html` (StatTile, listasor). A mockup kártyái surface1
 * hátterűek, **keret nélkül**; a kiemelést a bal oldali 3pt-os accent sáv adja
 * — ez egyben a `.ai-marker` mobil megfelelője is (`accent="ai"`).
 *
 * A mockup sávjának és kártyájának színes külső glow-ját (`box-shadow`) RN nem
 * tudja megbízhatóan mindkét platformon, ezért az elmarad – lásd D-005.
 */
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, View } from 'react-native';

import { type AccentTone, colors, radius } from '@/constants/theme';
import { usePressed } from '@/hooks/usePressed';

/** Az accent sáv szélessége a mockupban. */
const ACCENT_BAR = 3;

interface GlowCardProps {
  children: ReactNode;
  /** Bal oldali accent sáv színe. Elhagyva sáv nélküli, sima kártya. */
  accent?: AccentTone;
  /** Sarokkerekítés: `lg` (10) a sorszerű kártyáké, `xl` (14) a kiemelteké. */
  corner?: 'lg' | 'xl';
  /** Belső margó. A mockupban 14 (tile, listasor) vagy 16 (kiemelt kártya). */
  padding?: number;
  onPress?: () => void;
  /** Kívülről csak elhelyezés (margó, szélesség, `flex`) – felületet ne írj át. */
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const ACCENT_COLORS: Record<AccentTone, string> = {
  cyan: colors.accent.cyan,
  orange: colors.accent.orange,
  ai: colors.accent.ai,
  positive: colors.semantic.positive,
  negative: colors.semantic.negative,
  warning: colors.semantic.warning,
};

export function GlowCard({
  children,
  accent,
  corner = 'lg',
  padding = 14,
  onPress,
  style,
  accessibilityLabel,
}: GlowCardProps) {
  const corners = radius[corner];

  const surface: ViewStyle = {
    position: 'relative',
    borderRadius: corners,
    backgroundColor: colors.bg.surface1,
    padding,
    // A sáv a tartalom fölé lógna, ezért balra a sáv szélességével több a margó
    // – a mockup is így számol (14 → 17, 16 → 19).
    paddingLeft: accent ? padding + ACCENT_BAR : padding,
  };

  const bar = accent ? (
    <View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: ACCENT_BAR,
        backgroundColor: ACCENT_COLORS[accent],
        borderTopLeftRadius: corners,
        borderBottomLeftRadius: corners,
      }}
    />
  ) : null;

  if (!onPress) {
    return (
      <View style={[surface, style]}>
        {bar}
        {children}
      </View>
    );
  }

  return (
    <PressableCard
      onPress={onPress}
      surface={surface}
      style={style}
      accessibilityLabel={accessibilityLabel}
    >
      {bar}
      {children}
    </PressableCard>
  );
}

interface PressableCardProps {
  children: ReactNode;
  onPress: () => void;
  surface: ViewStyle;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * Lenyomva a kártya egy szintet emelkedik (surface1 → surface2) – ez a hover
 * mobil megfelelője. A lenyomott állapotot a `usePressed` követi, mert a
 * `style` függvény-alakját a NativeWind interop eldobná (D-011).
 */
function PressableCard({
  children,
  onPress,
  surface,
  style,
  accessibilityLabel,
}: PressableCardProps) {
  const card = usePressed();

  return (
    <Pressable
      onPress={onPress}
      {...card.pressHandlers}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[surface, card.pressed ? { backgroundColor: colors.bg.surface2 } : null, style]}
    >
      {children}
    </Pressable>
  );
}
