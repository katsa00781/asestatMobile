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
 *
 * A `selectedTeamId` normál esetben mindig érvényes csapatra mutat – üres
 * (`null`) választást kizárólag az Igazolások liga nézete enged, és csak
 * addig, amíg az `allowAllTeams` be van kapcsolva (D-114).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface FilterState {
  selectedSeasonId: string | null;
  selectedTeamId: string | null;
  /** A tárolt választás visszaolvasása lefutott (sikerrel vagy hiba után is). */
  hydrated: boolean;
  /**
   * Az „Összes követett csapat" választás engedélyezve van-e. Futásidejű
   * jelzés, nem beállítás: az Igazolások liga nézete kapcsolja be, és kilépéskor
   * vissza is kapcsolja – ilyenkor a `useFilterData` visszaállítja az alapcsapatot.
   */
  allowAllTeams: boolean;
  setSeason: (seasonId: string) => void;
  setTeam: (teamId: string | null) => void;
  setAllowAllTeams: (allowed: boolean) => void;
}

const STORAGE_KEY = 'asestats.filter';

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      selectedSeasonId: null,
      selectedTeamId: null,
      hydrated: false,
      allowAllTeams: false,

      setSeason: (seasonId) => set({ selectedSeasonId: seasonId }),
      setTeam: (teamId) => set({ selectedTeamId: teamId }),
      setAllowAllTeams: (allowed) => set({ allowAllTeams: allowed }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      // A `hydrated` és az `allowAllTeams` futásidejű jelzés, nem beállítás –
      // egyik sem kerül a tárolóba. Az üres csapatszűrő így nem éli túl az
      // app újraindítását sem.
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
