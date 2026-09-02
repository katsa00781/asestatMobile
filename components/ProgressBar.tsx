/**
 * Vízszintes arányjelző sáv.
 *
 * Mockup: `docs/mockups/extracted/p0-style-tile.html` („Egyéb elemek") – 6pt
 * magas, 3pt sarkú sáv, surface3 vályúval, a kitöltés balról jobbra futó
 * gradienssel (`#0096B8 → #00D4FF`). A gradienst az `expo-linear-gradient`
 * adja (D-056). A mockup külső glow-ja (`box-shadow`) elmarad: színes elmosott
 * árnyékot RN nem tud megbízhatóan mindkét platformon (D-005).
 *
 * A cián kitöltés a mockup két pontos színét használja (`shade.cyanDeep` →
 * `accent.cyan`); a többi hangnemhez a mockup nem ad sötét véget, ezért ott a
 * gradiens az accent szín félig átlátszó alakjából fut a tömör accentbe – így
 * ugyanaz a „sötétből világosba" ív, új színtoken nélkül.
 */
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { type AccentTone, accentColor, colors, radius } from '@/constants/theme';

interface ProgressBarProps {
  /** 0–100 skálán; ezen kívüli érték a két végponthoz vágódik. */
  value: number;
  tone?: AccentTone;
  /** Kívülről csak elhelyezés (margó, szélesség). */
  style?: StyleProp<ViewStyle>;
}

/** A mockup sávmagassága. */
const BAR_HEIGHT = 6;

/**
 * A gradiens sötét vége a nem cián hangnemekhez: az accent szín 55%-os alakja.
 * Nyolcjegyű hex (`#RRGGBBAA`) – a token értékéhez fűzött alfa csatorna, nem
 * új szín.
 */
const FADED = '8C';

/** A kitöltés két végpontja: sötétebb → tömör accent. */
function gradient(tone: AccentTone): [string, string] {
  if (tone === 'cyan') return [colors.shade.cyanDeep, colors.accent.cyan];
  return [`${accentColor[tone]}${FADED}`, accentColor[tone]];
}

export function ProgressBar({ value, tone = 'cyan', style }: ProgressBarProps) {
  const filled = Math.max(0, Math.min(100, value));

  return (
    <View style={[styles.track, style]}>
      <LinearGradient
        colors={gradient(tone)}
        // Vízszintes futás: a mockup `linear-gradient(90deg, …)`-je.
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ width: `${filled}%`, height: '100%', borderRadius: radius.pill }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: BAR_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.surface3,
    overflow: 'hidden',
  },
});
