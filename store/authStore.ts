/**
 * Auth állapot – a Supabase session tükre Zustandban.
 *
 * A session perzisztálását és frissítését a Supabase kliens végzi
 * (AsyncStorage + autoRefreshToken). Ez a store csak tükrözi, hogy a
 * React fa reagálni tudjon rá.
 */
import { AppState } from 'react-native';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import { clearAllQueryCaches } from '@/lib/query-cache';
import { supabase } from '@/lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  /** A tárolt session visszaolvasása még tart – addig nincs átirányítás. */
  hydrated: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  hydrated: false,

  /** Hiba esetén a magyar üzenettel tér vissza, siker esetén `null`-lal. */
  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return error ? authErrorMessage(error) : null;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    // A onAuthStateChange is beállítaná, de a kijelentkezés érezhetően
    // azonnali legyen – hálózati hiba esetén se ragadjon bent a felhasználó.
    set({ session: null, user: null });
  },
}));

/**
 * Feliratkozás a Supabase auth eseményeire. A gyökér layoutban hívjuk,
 * a visszatérési értéke leiratkozik.
 */
export function initAuth(): () => void {
  const setState = useAuthStore.setState;
  // Az utoljára látott felhasználó – ha változik, a letöltött adat már valaki
  // másé, ki kell dobni.
  let currentUserId: string | null = null;

  void supabase.auth.getSession().then(({ data }) => {
    setState({ session: data.session, user: data.session?.user ?? null, hydrated: true });
  });

  const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
    const userId = session?.user.id ?? null;
    if (userId !== currentUserId) {
      // Kijelentkezéskor és felhasználóváltáskor is: a következő belépő ne az
      // előző szűrő szerinti, letöltött adatot lássa. A token frissítése nem
      // változtat felhasználót, tehát nem ürít.
      clearAllQueryCaches();
      currentUserId = userId;
    }
    setState({ session, user: session?.user ?? null, hydrated: true });
  });

  // A token automatikus frissítése csak előtérben futhat – háttérben a timer
  // felesleges hálózati hívásokat generálna. Ez a Supabase RN ajánlott mintája.
  const appStateSubscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });

  if (AppState.currentState === 'active') {
    void supabase.auth.startAutoRefresh();
  }

  return () => {
    authSubscription.subscription.unsubscribe();
    appStateSubscription.remove();
    void supabase.auth.stopAutoRefresh();
  };
}

/** A Supabase angol hibaüzeneteinek magyar megfelelői. */
function authErrorMessage(error: AuthError): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'Hibás email cím vagy jelszó.';
    case 'email_not_confirmed':
      return 'Az email cím még nincs megerősítve.';
    case 'over_request_rate_limit':
      return 'Túl sok próbálkozás. Várj egy percet, és próbáld újra.';
    case 'user_banned':
      return 'Ez a felhasználó le van tiltva.';
    default:
      return error.message || 'Nem sikerült bejelentkezni. Próbáld újra.';
  }
}
