import '@/global.css';
import 'react-native-url-polyfill/auto';

import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Stack, useRouter, useSegments } from 'expo-router';

import { colors } from '@/constants/theme';
import { fontAssets } from '@/constants/fonts';
import { initAuth, useAuthStore } from '@/store/authStore';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => initAuth(), []);

  const ready = (fontsLoaded || fontError) && hydrated;

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync();
    }
  }, [ready]);

  // A splash addig áll, amíg a fontok be nem töltenek és a tárolt session
  // vissza nem olvasódik – így nem villan fel a rossz képernyő.
  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg.base }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Auth guard: nincs session → login, van session a login képernyőn → app.
 * Az átirányítás effectben fut, ami a `Stack` gyerekeinek mountolása UTÁN
 * hívódik meg – így a navigátor már létezik, mire navigálunk.
 */
function RootNavigator() {
  const session = useAuthStore((state) => state.session);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const onLoginScreen = segments[0] === 'login';

    if (!session && !onLoginScreen) {
      router.replace('/login');
    } else if (session && onLoginScreen) {
      router.replace('/');
    }
  }, [session, segments, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.base },
        // A bejelentkezés/kijelentkezés váltása csere, nem lapozás.
        animation: 'fade',
      }}
    />
  );
}
