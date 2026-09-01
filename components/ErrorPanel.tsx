/**
 * Hibapanel újrapróbálás gombbal – a `useCachedQuery` `error` + `reload`
 * párjához.
 *
 * Két alak van, mert két helyzetben kell:
 * - `block` (alapértelmezés): a képernyő tartalmának helyén álló panel,
 *   másodlagos gombbal (P0 Style Tile „Másodlagos" gomb: 44pt, surface2,
 *   subtle keret, Barlow Condensed ALL CAPS).
 * - `inline`: egysoros változat listán vagy sheeten belül, ahol a tartalom
 *   egy része hiba esetén is használható marad (pl. a szűrő bottom sheet).
 *
 * A keret és a háttér a `glow.negative` rétegzés, nem `shadowColor` (D-005).
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TriangleAlert } from 'lucide-react-native';

import { colors, fontSize, glow, letterSpacing, radius, tracking } from '@/constants/theme';
import { usePressed } from '@/hooks/usePressed';

interface ErrorPanelProps {
  message: string;
  onRetry: () => void;
  variant?: 'block' | 'inline';
}

export function ErrorPanel({ message, onRetry, variant = 'block' }: ErrorPanelProps) {
  if (variant === 'inline') {
    return (
      <View style={styles.inline}>
        <Text className="flex-1 font-body text-sm text-negative">{message}</Text>
        <InlineRetry onPress={onRetry} />
      </View>
    );
  }

  return (
    <View style={styles.block}>
      <TriangleAlert size={22} color={colors.semantic.negative} strokeWidth={1.8} />
      <Text className="mt-12 text-center font-body text-base text-primary">{message}</Text>
      <BlockRetry onPress={onRetry} />
    </View>
  );
}

function BlockRetry({ onPress }: { onPress: () => void }) {
  const button = usePressed();

  return (
    <Pressable
      onPress={onPress}
      {...button.pressHandlers}
      accessibilityRole="button"
      style={[
        styles.blockButton,
        { backgroundColor: button.pressed ? colors.bg.surface3 : colors.bg.surface2 },
      ]}
    >
      <Text
        className="font-condensed text-sm uppercase text-primary"
        style={{ letterSpacing: letterSpacing(fontSize.sm, tracking.wide) }}
      >
        Újrapróbálás
      </Text>
    </Pressable>
  );
}

function InlineRetry({ onPress }: { onPress: () => void }) {
  const button = usePressed();

  return (
    <Pressable
      onPress={onPress}
      {...button.pressHandlers}
      accessibilityRole="button"
      accessibilityLabel="Újrapróbálás"
      // A felirat vizuálisan kisebb 44pt-nál, ezért hitSlop növeli a célpontot.
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={{ opacity: button.pressed ? 0.6 : 1 }}
    >
      <Text
        className="font-condensed text-sm uppercase text-cyan"
        style={{ letterSpacing: letterSpacing(fontSize.sm, tracking.wide) }}
      >
        Újra
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  block: {
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: glow.negative.fill,
    borderColor: glow.negative.border,
  },
  blockButton: {
    height: 44,
    marginTop: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: glow.negative.fill,
    borderColor: glow.negative.border,
  },
});
