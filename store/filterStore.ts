/**
 * Szűrő állapot – a kiválasztott szezon és csapat, AsyncStorage-ba perzisztálva.
 *
 * Csak azonosítókat tárol. A hozzájuk tartozó nevek és a választható listák a
 * `hooks/useFilterData.ts`-ből jönnek, mert azok a Supabase-ből frissülnek – egy
 * eltárolt név elavulna, ha a szezont vagy a csapatot átnevezik.
 *
 * A `hydrated` addig `false`, amíg a tárolt választás vissza nem olvasódott.
 * Amíg hamis, ne indíts adatlekérést: a szűrő nélkül futó lekérdezés vagy
 * hibás, vagy feleslegesen fut le kétszer.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface FilterState {
  selectedSeasonId: string | null;
  selectedTeamId: string | null;
  /** A tárolt választás visszaolvasása lefutott (sikerrel vagy hiba után is). */
  hydrated: boolean;
  setSeason: (seasonId: string) => void;
  setTeam: (teamId: string) => void;
}

const STORAGE_KEY = 'asestats.filter';

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      selectedSeasonId: null,
      selectedTeamId: null,
      hydrated: false,

      setSeason: (seasonId) => set({ selectedSeasonId: seasonId }),
      setTeam: (teamId) => set({ selectedTeamId: teamId }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      // A `hydrated` futásidejű jelzés, nem beállítás – nem kerül a tárolóba.
      partialize: ({ selectedSeasonId, selectedTeamId }) => ({ selectedSeasonId, selectedTeamId }),
      onRehydrateStorage: () => (_state, error) => {
        // Hiba esetén is engedünk tovább: alapértelmezett szezonnal indulunk,
        // különben egy sérült AsyncStorage bejegyzés örökre kifagyasztaná az appot.
        if (error) {
          console.warn('A tárolt szűrő visszaolvasása sikertelen, alapértelmezéssel indulunk:', error);
        }
        useFilterStore.setState({ hydrated: true });
      },
    },
  ),
);
