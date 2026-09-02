/**
 * Bottom sheet váz – sötétítő réteg, lecsúsztatható lap, görgethető tartalom.
 *
 * Mockup: `docs/mockups/extracted/szuro-bottom-sheet.html`. A `FilterSheet` és a
 * `SettingsSheet` ugyanezt a vázat használja, csak a tartalmuk más – a
 * mozgatás, a záró gesztus és az Android hardveres back kezelése itt él egyszer.
 *
 * A `Modal` a záró animáció végéig mountolva marad, különben a lap eltűnne,
 * mielőtt lecsúszik.
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, duration, fontSize, letterSpacing, radius, tracking } from '@/constants/theme';
import { usePressed } from '@/hooks/usePressed';

const TIMING = { duration: duration.base, easing: Easing.out(Easing.cubic) };

/** Lehúzással záráshoz ennyit kell mozdulni, vagy ilyen gyorsan elengedni. */
const DISMISS_DISTANCE = 96;
const DISMISS_VELOCITY = 800;

/** A sheet teteje és a képernyő teteje között mindig marad ennyi hely. */
const TOP_GAP = 24;

/** A sheet függőleges eltolása: a nyitottság és a lehúzott többlet együtt. */
function offsetY(progress: number, drag: number, height: number): number {
  'worklet';
  return (1 - progress) * height + drag;
}

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Fejléc felirata, ALL CAPS-ra formázva jelenik meg. */
  title: string;
  children: ReactNode;
  /** Halk záró sor a lap alján. */
  footnote?: string;
}

export function BottomSheet({ visible, onClose, title, children, footnote }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  // A nyitást renderidőben állítjuk be – effect nem kell hozzá.
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);

  // A sheet magassága – a záráshoz ennyit kell lecsúsztatni. Sima state, nem
  // shared value: a layout a JS oldalon mérődik, a worklet a számot zárja körbe.
  const [sheetHeight, setSheetHeight] = useState(windowHeight);
  /** Ujjal lehúzott többlet, csak a gesztus írja. */
  const drag = useSharedValue(0);
  /** 0 = teljesen lent, 1 = teljesen nyitva. A `visible` váltása hajtja. */
  const progress = useDerivedValue(() =>
    withTiming(visible ? 1 : 0, TIMING, (finished) => {
      if (finished && !visible) runOnJS(setMounted)(false);
    }),
  );

  // Lehúzás a fejlécen (a grabber ezt jelzi). Csak a fejlécen figyelünk, hogy a
  // tartalom görgetésével ne ütközzön.
  const dragGesture = Gesture.Pan()
    .onUpdate((event) => {
      drag.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      const dismiss = event.translationY > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY;
      // A lehúzott többletet mindkét ágon elsimítjuk: záráskor a `progress`
      // veszi át a mozgást, maradáskor visszahúzza a sheetet a helyére.
      drag.value = withTiming(0, TIMING);
      if (dismiss) runOnJS(onClose)();
    });

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      offsetY(progress.value, drag.value, sheetHeight),
      [0, sheetHeight],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offsetY(progress.value, drag.value, sheetHeight) }],
  }));

  if (!mounted) return null;

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      // Saját animációt futtatunk, a natívra nincs szükség.
      animationType="none"
      // Android hardveres back gomb – a bottom sheet kötelezően kezeli.
      onRequestClose={onClose}
    >
      {/* A gesture-handler natív Modalon belül csak saját gyökérnézettel működik. */}
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, overlayStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={`${title} bezárása`}
          />
        </Animated.View>

        <Animated.View
          onLayout={(event) => {
            setSheetHeight(event.nativeEvent.layout.height);
          }}
          style={[
            styles.sheet,
            { maxHeight: windowHeight - insets.top - TOP_GAP, paddingBottom: insets.bottom },
            sheetStyle,
          ]}
        >
          <GestureDetector gesture={dragGesture}>
            <View>
              <View style={styles.grabber} />
              {/* A pt-12 a „Kész" hitSlopjának ad helyet a soron belül (D-038);
                  ugyanennyivel kisebb a grabber alsó margója, így a fejléc
                  optikailag ott marad, ahol a mockupban. */}
              <View className="flex-row items-center justify-between border-b border-line px-16 pb-16 pt-12">
                <Text
                  className="font-condensed text-label uppercase text-muted"
                  style={{ letterSpacing: letterSpacing(fontSize.label, tracking.wider) }}
                >
                  {title}
                </Text>
                <DoneButton onPress={onClose} />
              </View>
            </View>
          </GestureDetector>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          {footnote ? (
            <Text className="px-24 pb-12 pt-16 text-center font-body text-sm text-muted">
              {footnote}
            </Text>
          ) : null}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function DoneButton({ onPress }: { onPress: () => void }) {
  const button = usePressed();

  return (
    <Pressable
      onPress={onPress}
      {...button.pressHandlers}
      accessibilityRole="button"
      // A felirat 20pt magas, a hiányzó részt hitSlop pótolja. A slop a
      // fejlécsor saját margóin belül marad – kívülre egyik platform sem
      // kézbesíti az érintést (D-038).
      hitSlop={{ top: 12, bottom: 14, left: 16, right: 16 }}
      style={{ opacity: button.pressed ? 0.6 : 1 }}
    >
      {/* Rögzített sormagasság: enélkül a célpont mérete a platform
          alapértelmezett sorközétől függne. */}
      <Text className="font-body text-md text-cyan" style={styles.doneLabel}>
        Kész
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrim: {
    backgroundColor: colors.scrim,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    backgroundColor: colors.bg.surface2,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderTopColor: colors.accent.cyan,
  },
  grabber: {
    width: 36,
    height: 4,
    marginBottom: 2,
    alignSelf: 'center',
    borderRadius: radius.xs,
    backgroundColor: colors.border.active,
  },
  doneLabel: {
    lineHeight: 20,
  },
  list: {
    // Enélkül a lista kinőné a sheet maxHeight-ját, és a lábjegyzet kicsúszna.
    flexShrink: 1,
  },
  listContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
});
