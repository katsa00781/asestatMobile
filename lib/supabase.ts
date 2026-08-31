/**
 * Az alkalmazás EGYETLEN Supabase kliense. Ne hozz létre másikat.
 *
 * A mobil app kizárólag olvas (SELECT) – írás nincs, admin funkció nincs.
 * Az adatvédelmet Supabase-oldali RLS adja, nem ez a kliens.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Metro a build idején inline-olja az EXPO_PUBLIC_* értékeket. Ha hiányoznak,
// a hiba a Supabase hívásnál jönne elő érthetetlen üzenettel – itt előbb szólunk.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Hiányzó Supabase környezeti változó. Másold a .env.example-t .env-be, ' +
      'töltsd ki, és indítsd újra a Metrót (npx expo start -c).',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Nincs URL-ben érkező session – az OAuth redirect a webre való.
    detectSessionInUrl: false,
  },
});
