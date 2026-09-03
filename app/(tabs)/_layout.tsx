/**
 * Tab layout – az app öt fő képernyője.
 *
 * A tabsávot a `TabBar` rajzolja (aktív tab: accent jelzés + glow, az Elemzés
 * tab lilával – D-091, D-092), ezért itt csak a képernyők sorrendje és a
 * feliratuk van. A fejléc képernyőnként saját (`AppHeader`), navigátor-fejléc
 * nincs.
 */
import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/TabBar';
import { colors } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg.base },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Ma' }} />
      <Tabs.Screen name="players" options={{ title: 'Játékosok' }} />
      <Tabs.Screen name="games" options={{ title: 'Meccsek' }} />
      <Tabs.Screen name="standings" options={{ title: 'Tabella' }} />
      <Tabs.Screen name="analysis" options={{ title: 'Elemzés' }} />
    </Tabs>
  );
}
