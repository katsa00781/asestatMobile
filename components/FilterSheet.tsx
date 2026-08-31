/**
 * Szűrő bottom sheet – szezon és csapat választás.
 *
 * Mockup: `docs/mockups/extracted/szuro-bottom-sheet.html`.
 * A választás azonnal érvényesül (nincs „Mégse"), a „Kész" csak bezár – ezt a
 * mockup is így mutatja: az aktív sor rögtön ciánra vált.
 *
 * A listákat maga a sheet kéri le a `useFilterData`-ból: a hook modulszintű
 * cache-e miatt ez nem jelent plusz hálózati kérést (D-014).
 */
import { useState } from 'react';
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
import { Check } from 'lucide-react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { colors, duration, fontSize, glow, letterSpacing, radius, tracking } from '@/constants/theme';
import { useFilterData } from '@/hooks/useFilterData';
import { usePressed } from '@/hooks/usePressed';
import { useFilterStore } from '@/store/filterStore';

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

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function FilterSheet({ visible, onClose }: FilterSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { seasons, teams, loading, error, reload } = useFilterData();

  const selectedSeasonId = useFilterStore((state) => state.selectedSeasonId);
  const selectedTeamId = useFilterStore((state) => state.selectedTeamId);
  const setSeason = useFilterStore((state) => state.setSeason);
  const setTeam = useFilterStore((state) => state.setTeam);

  // A Modal a záró animáció végéig mountolva marad, különben a sheet eltűnne,
  // mielőtt lecsúszik. A nyitást renderidőben állítjuk be – effect nem kell hozzá.
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
  // lista görgetésével ne ütközzön.
  const dragGesture = Gesture.Pan()
    .onUpdate((event) => {
      drag.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      const dismiss =
        event.translationY > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY;
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
            accessibilityLabel="Szűrő bezárása"
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
              <View className="flex-row items-center justify-between border-b border-line px-16 pb-16">
                <Text
                  className="font-condensed text-label uppercase text-muted"
                  style={{ letterSpacing: letterSpacing(fontSize.label, tracking.wider) }}
                >
                  Szűrő
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
            {error ? <ErrorPanel message={error} onRetry={reload} /> : null}

            <Section label="Szezon">
              {seasons.length === 0 && loading ? (
                <PlaceholderRows count={4} />
              ) : (
                seasons.map((season) => (
                  <OptionRow
                    key={season.id}
                    label={season.name}
                    numeric
                    active={season.id === selectedSeasonId}
                    onPress={() => setSeason(season.id)}
                  />
                ))
              )}
              {seasons.length === 0 && !loading && !error ? (
                <EmptyRow text="Nincs elérhető szezon." />
              ) : null}
            </Section>

            <SectionDivider />

            <Section label="Csapat">
              {teams.length === 0 && loading ? (
                <PlaceholderRows count={3} />
              ) : (
                teams.map((team) => (
                  <OptionRow
                    key={team.id}
                    label={team.name}
                    active={team.id === selectedTeamId}
                    onPress={() => setTeam(team.id)}
                  />
                ))
              )}
              {teams.length === 0 && !loading && !error ? (
                <EmptyRow text="Nincs elérhető csapat." />
              ) : null}
            </Section>
          </ScrollView>

          <Text className="px-24 pb-12 pt-16 text-center font-body text-sm text-muted">
            A választás megjegyződik a következő indításig.
          </Text>
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
      // A felirat vizuálisan kisebb 44pt-nál, ezért hitSlop növeli a célpontot.
      hitSlop={{ top: 14, bottom: 14, left: 16, right: 16 }}
      style={{ opacity: button.pressed ? 0.6 : 1 }}
    >
      <Text className="font-body text-md text-cyan">Kész</Text>
    </Pressable>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Text
        className="mb-4 font-condensed text-label uppercase text-secondary"
        style={{ letterSpacing: letterSpacing(fontSize.label, tracking.label) }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

/**
 * Egy választható sor. A `numeric` a szezonokra igaz: a `CLAUDE.md` szerint
 * minden numerikus érték JetBrains Monóval megy.
 */
function OptionRow({
  label,
  active,
  numeric = false,
  onPress,
}: {
  label: string;
  active: boolean;
  numeric?: boolean;
  onPress: () => void;
}) {
  const row = usePressed();

  return (
    <Pressable
      onPress={onPress}
      {...row.pressHandlers}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      style={[
        styles.row,
        { backgroundColor: active || row.pressed ? colors.bg.surface3 : 'transparent' },
      ]}
    >
      {active ? <View style={styles.activeBar} /> : null}
      <Text
        className={numeric ? 'font-mono text-md' : 'font-body-medium text-md'}
        style={{ color: active ? colors.accent.cyan : colors.text.primary }}
        numberOfLines={1}
      >
        {label}
      </Text>
      {active ? <Check size={16} color={colors.accent.cyan} strokeWidth={2.2} /> : null}
    </Pressable>
  );
}

/** A mockup halványuló szélű elválasztója. Gradienshez a már meglévő SVG-t használjuk. */
function SectionDivider() {
  return (
    <View style={styles.divider}>
      <Svg width="100%" height={1}>
        <Defs>
          <LinearGradient id="filterSheetDivider" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.border.subtle} stopOpacity={0} />
            <Stop offset="0.5" stopColor={colors.border.subtle} stopOpacity={1} />
            <Stop offset="1" stopColor={colors.border.subtle} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="1" fill="url(#filterSheetDivider)" />
      </Svg>
    </View>
  );
}

/** Betöltés alatti helykitöltő. A shimmert az S5 `SkeletonBlock`-ja hozza majd. */
function PlaceholderRows({ count }: { count: number }) {
  return (
    <View>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.row}>
          <View style={styles.placeholderBar} />
        </View>
      ))}
    </View>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <View style={styles.row}>
      <Text className="font-body text-sm text-muted">{text}</Text>
    </View>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  const button = usePressed();

  return (
    <View style={styles.errorPanel}>
      <Text className="flex-1 font-body text-sm text-negative">{message}</Text>
      <Pressable
        onPress={onRetry}
        {...button.pressHandlers}
        accessibilityRole="button"
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
    </View>
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
    marginBottom: 14,
    alignSelf: 'center',
    borderRadius: radius.xs,
    backgroundColor: colors.border.active,
  },
  list: {
    // Enélkül a lista kinőné a sheet maxHeight-ját, és a lábjegyzet kicsúszna.
    flexShrink: 1,
  },
  listContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  row: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingLeft: 16,
    paddingRight: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.row,
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 2,
    backgroundColor: colors.accent.cyan,
    borderTopRightRadius: radius.xs,
    borderBottomRightRadius: radius.xs,
  },
  divider: {
    marginVertical: 18,
  },
  placeholderBar: {
    width: '55%',
    height: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.surface3,
  },
  errorPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: glow.negative.fill,
    borderColor: glow.negative.border,
  },
});
