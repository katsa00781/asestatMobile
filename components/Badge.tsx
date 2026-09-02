/**
 * Badge – rövid állapotcímke (nyert / vesztett / AI elemzés / hazai …).
 *
 * Mockup: `docs/mockups/extracted/p0-style-tile.html` („Badge-ek"), valamint
 * `ma-screen.html` (a „Következő meccs" és a „Legutóbb" kártya fejlécében).
 * A címke Barlow Condensed 11pt ALL CAPS, 0.12em betűközzel, 3/8pt margóval,
 * `xs` (2pt) sarokkal, 1pt kerettel.
 *
 * A hat accent variáns pontosan a `glow` tokeneket használja (accent háttér +
 * accent keret, lásd D-005) – az `ai` kivételével a felirat maga az accent szín.
 * Lila háttéren az `accent.ai` olvashatatlan lenne, ezért ott a világosabb
 * `text.ai` a felirat színe, ahogy a mockupban is. A hetedik, `neutral`
 * variáns nem accent: surface2 háttér, `border.subtle` keret, `text.secondary`
 * felirat.
 */
import type { StyleProp, TextStyle } from 'react-native';
import { StyleSheet, Text } from 'react-native';

import {
  type AccentTone,
  accentColor,
  colors,
  fontSize,
  glow,
  letterSpacing,
  radius,
  tracking,
} from '@/constants/theme';

/** A hat accent hangnem + a semleges. */
export type BadgeVariant = AccentTone | 'neutral';

interface BadgeColors {
  fill: string;
  border: string;
  text: string;
}

/** Accent variáns a `glow` tokenekből, opcionálisan eltérő feliratszínnel. */
const fromGlow = (tone: AccentTone, text: string = accentColor[tone]): BadgeColors => ({
  fill: glow[tone].fill,
  border: glow[tone].border,
  text,
});

const VARIANTS: Record<BadgeVariant, BadgeColors> = {
  cyan: fromGlow('cyan'),
  orange: fromGlow('orange'),
  ai: fromGlow('ai', colors.text.ai),
  positive: fromGlow('positive'),
  negative: fromGlow('negative'),
  warning: fromGlow('warning'),
  neutral: {
    fill: colors.bg.surface2,
    border: colors.border.subtle,
    text: colors.text.secondary,
  },
};

interface BadgeProps {
  /** A felirat – ALL CAPS-ra formázva jelenik meg. */
  label: string;
  variant?: BadgeVariant;
  /** Kívülről csak elhelyezés (margó, `alignSelf`) – felületet ne írj át. */
  style?: StyleProp<TextStyle>;
}

export function Badge({ label, variant = 'neutral', style }: BadgeProps) {
  const variantColors = VARIANTS[variant];

  return (
    <Text
      className="font-condensed text-label uppercase"
      style={[
        styles.badge,
        {
          backgroundColor: variantColors.fill,
          borderColor: variantColors.border,
          color: variantColors.text,
        },
        style,
      ]}
      numberOfLines={1}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    // A címke a tartalmára zsugorodik, és nem nyúlik ki az őt tartalmazó
    // oszlop teljes szélességére. Sorban a hívó `alignItems`-e a mérvadó,
    // ezért itt csak a keresztirányú nyújtást kapcsoljuk ki.
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderRadius: radius.xs,
    letterSpacing: letterSpacing(fontSize.label, tracking.label),
    // Fix sormagasság, hogy a badge doboza iOS-en és Androidon egyforma
    // magas legyen; az Android alapértelmezett betűpaddingje ugyanezért megy ki
    // (iOS-en a mező nem értelmezett, ezért nem kell `Platform` elágazás).
    lineHeight: 14,
    includeFontPadding: false,
    // A háttér a 2pt-os sarokra vágva – iOS-en `Text` alatt ez nem alapértelmezett.
    overflow: 'hidden',
  },
});
