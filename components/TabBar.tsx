/**
 * Alsó tabsáv – az öt fő képernyő.
 *
 * Mockup: `docs/mockups/extracted/ma-screen.html` alsó sávja. Saját tabsávot
 * rajzolunk (nem a navigátor alapértelmezettjét), mert az aktív tab jelzése egy
 * 24×3pt-os cián sáv a tabelem **tetején** – ezt a beépített ikon/felirat
 * elrendezés nem tudja kiadni (D-042).
 *
 * A mockup 83pt-os sávja 63pt tartalom + 20pt home indicator; a 20 helyett a
 * tényleges `insets.bottom` megy, ahogy a `CLAUDE.md` előírja.
 *
 * Két eltérés a mockuptól, mindkettő a feladatlista S6 „Tab layout
 * véglegesítése" sora nyomán (lásd D-091, D-092):
 *  - az aktív ikon alá glow réteg kerül (accent kitöltés + keret, nem
 *    `shadowColor` – D-005);
 *  - az **Elemzés** tab aktív hangneme lila, mert az a tab végig AI-tartalmat
 *    visz; a másik négy tab cián marad. A lila ikon/felirat a `text.ai`
 *    (#C4B5FD) lavender, ahogy a P12 prompt előírja – az `accent.ai` (#7C3AED)
 *    ekkora ikonon a sötét háttéren alig látszana.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Calendar, House, Sparkle, Table, User, type LucideIcon } from 'lucide-react-native';

import { colors, glow, radius } from '@/constants/theme';
import { usePressed } from '@/hooks/usePressed';

/** Az aktív tab két hangneme. */
type TabTone = 'cyan' | 'ai';

/** A tabsáv tartalmi magassága, a safe area nélkül. */
const BAR_HEIGHT = 63;

/** Útvonalnév → ikon. A sorrendet a `Tabs` képernyősorrendje adja. */
const TAB_ICONS: Record<string, LucideIcon> = {
  index: House,
  players: User,
  games: Calendar,
  standings: Table,
  analysis: Sparkle,
};

/** Útvonalnév → aktív hangnem. Alapból cián, az Elemzés tab lila (D-092). */
const TAB_TONE: Record<string, TabTone> = {
  analysis: 'ai',
};

/** Aktív hangnem → az ikon és a felirat színe. */
const TONE_FOREGROUND: Record<TabTone, string> = {
  cyan: colors.accent.cyan,
  ai: colors.text.ai,
};

export function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  return (
    <View style={[styles.bar, { height: BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <TabItem
            key={route.key}
            routeName={route.name}
            label={options.title ?? route.name}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? options.title ?? route.name}
            focused={focused}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}

interface TabItemProps {
  routeName: string;
  label: string;
  accessibilityLabel: string;
  focused: boolean;
  onPress: () => void;
}

function TabItem({ routeName, label, accessibilityLabel, focused, onPress }: TabItemProps) {
  const { pressed, pressHandlers } = usePressed();
  const Icon = TAB_ICONS[routeName];
  const tone = TAB_TONE[routeName] ?? 'cyan';
  const activeColor = TONE_FOREGROUND[tone];
  const iconColor = focused ? activeColor : colors.text.muted;

  return (
    <Pressable
      onPress={onPress}
      {...pressHandlers}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={accessibilityLabel}
      style={[styles.item, { opacity: pressed && !focused ? 0.6 : 1 }]}
    >
      {focused ? <View style={[styles.indicator, { backgroundColor: activeColor }]} /> : null}
      <View
        style={[
          styles.iconWrap,
          focused
            ? { backgroundColor: glow[tone].fill, borderColor: glow[tone].border }
            : null,
        ]}
      >
        {Icon ? <Icon size={24} color={iconColor} strokeWidth={1.6} /> : null}
      </View>
      <Text className="font-body text-label" style={{ color: iconColor }} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bg.surface1,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 3,
    borderRadius: radius.xs,
  },
  iconWrap: {
    width: 56,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    // A keret fókusz nélkül is 1pt, csak átlátszó – így az ikon nem ugrik
    // fókuszváltáskor.
    borderWidth: 1,
    borderColor: 'transparent',
  },
});
