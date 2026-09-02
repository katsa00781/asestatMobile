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
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Calendar, House, Sparkle, Table, User, type LucideIcon } from 'lucide-react-native';

import { colors, radius } from '@/constants/theme';

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

export function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  return (
    <View style={[styles.bar, { height: BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const Icon = TAB_ICONS[route.name];
        const label = options.title ?? route.name;

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
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            style={styles.item}
          >
            {focused ? <View style={styles.indicator} /> : null}
            {Icon ? (
              <Icon
                size={24}
                color={focused ? colors.accent.cyan : colors.text.muted}
                strokeWidth={1.6}
              />
            ) : null}
            <Text
              className="font-body text-label"
              style={{ color: focused ? colors.accent.cyan : colors.text.muted }}
              numberOfLines={1}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
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
    backgroundColor: colors.accent.cyan,
  },
});
