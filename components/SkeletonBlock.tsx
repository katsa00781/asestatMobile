/**
 * Betöltési helyőrző – az első betöltés shimmerje (spinner helyett).
 *
 * A `CLAUDE.md` szerint az első betöltés `SkeletonBlock` shimmer, a spinner
 * csak háttérfrissítésnél jön. Mockup ehhez nincs, a megjelenést a design
 * nyelvből vezettük le: tompa felület-blokk, amin balról jobbra végigfut egy
 * lágy fénysáv (D-037). A sáv `react-native-svg` gradiens, mert kemény élű
 * `View` sávnak látszana a széle; a csomag már fent van (a `FilterSheet`
 * elválasztója is ezt használja).
 */
import { useEffect, useState } from 'react';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { colors, duration, radius } from '@/constants/theme';

/** A fénysáv csúcsfedettsége – a főszöveg színe épphogy átüt a felületen. */
const HIGHLIGHT_OPACITY = 0.06;

/** A helyőrző alapfelülete: a mögötte lévő háttérnél egy szinttel emeltebb. */
const SURFACES = {
  surface2: colors.bg.surface2,
  surface3: colors.bg.surface3,
} as const;

interface SkeletonBlockProps {
  /** Magasság pt-ban. Alap: 12 – egy sornyi kísérőszöveg helye. */
  height?: number;
  /** Szélesség pt-ban vagy százalékban. Alap: a teljes rendelkezésre álló hely. */
  width?: DimensionValue;
  /** Sarokkerekítés a token-skálából. Alap: `sm` (4). */
  corner?: keyof typeof radius;
  /**
   * Alapfelület. `surface2` a base / surface1 hátterű képernyőkön,
   * `surface3` a surface2 hátterű felületeken (pl. bottom sheet).
   */
  surface?: keyof typeof SURFACES;
  /** Kívülről csak elhelyezés (margó, `flex`) – felületet ne írj át. */
  style?: StyleProp<ViewStyle>;
}

export function SkeletonBlock({
  height = 12,
  width = '100%',
  corner = 'sm',
  surface = 'surface2',
  style,
}: SkeletonBlockProps) {
  // A sáv úthossza a blokk tényleges szélessége, ezért meg kell mérni. Sima
  // state, nem shared value: a layout a JS oldalon keletkezik, a worklet a
  // számot zárja körbe – ugyanaz a minta, mint a `FilterSheet` magasságánál.
  const [measured, setMeasured] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    // Lineáris, mert a fénysáv egyenletes sebességgel fut át; a `duration.slow`
    // görbéje egy végtelen ciklusban lüktetésnek látszana.
    progress.value = withRepeat(
      withTiming(1, { duration: duration.shimmer, easing: Easing.linear }),
      -1,
      false,
    );

    return () => cancelAnimation(progress);
  }, [progress]);

  const sweep = useAnimatedStyle(() => ({
    // A sáv a blokk szélességével egyezik, ezért a bal széle előtt indul és a
    // jobb széle után ér ki: −szélesség → +szélesség.
    transform: [{ translateX: (progress.value * 2 - 1) * measured }],
  }));

  return (
    <View
      onLayout={(event) => setMeasured(event.nativeEvent.layout.width)}
      style={[
        styles.block,
        { width, height, borderRadius: radius[corner], backgroundColor: SURFACES[surface] },
        style,
      ]}
      // A helyőrző a képernyőolvasónak nem tartalom: a betöltés tényét a
      // képernyő saját `accessibilityLabel`-je mondja el.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {measured > 0 ? (
        <Animated.View style={[StyleSheet.absoluteFill, sweep]}>
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id="skeletonSweep" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={colors.text.primary} stopOpacity={0} />
                <Stop offset="0.5" stopColor={colors.text.primary} stopOpacity={HIGHLIGHT_OPACITY} />
                <Stop offset="1" stopColor={colors.text.primary} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#skeletonSweep)" />
          </Svg>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    overflow: 'hidden',
  },
});
