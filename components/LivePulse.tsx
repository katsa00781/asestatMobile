/**
 * Lüktető pont az „ÉLŐ" jelöléshez.
 *
 * A `SkeletonBlock` shimmerjének mintáját követi: `useSharedValue` +
 * `withRepeat`, `cancelAnimation` a lecsatlakozáskor. A `duration.pulse`
 * külön token a `shimmer`-től, mert szemantikailag mást jelent (D-108).
 */
import { useEffect } from 'react';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors, duration } from '@/constants/theme';

interface LivePulseProps {
  size?: number;
  color?: string;
}

export function LivePulse({ size = 6, color = colors.semantic.negative }: LivePulseProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: duration.pulse, easing: Easing.out(Easing.cubic) }),
      -1,
      // `true`: oda-vissza fut, nem ugrik vissza a ciklus elejére – lágyabb lüktetés.
      true,
    );

    return () => cancelAnimation(progress);
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value * 0.7,
    transform: [{ scale: 1 + progress.value * 0.35 }],
  }));

  return (
    <Animated.View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        style,
      ]}
    />
  );
}
