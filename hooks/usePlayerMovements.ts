/**
 * Igazolások – egy szezonváltás keretmozgásai a `league_player_movements`
 * view-ból, szezonra és (opcionálisan) csapatra szűrve.
 *
 * A view a **célszezon** szerint szűr: a 2026/2027 sorai a 2025/2026 →
 * 2026/2027 váltás érkezőit és távozóit adják. Üres `teamId` a liga nézet –
 * ilyenkor a teljes követett bajnokság sorai jönnek, ezért megy a lekérdezés
 * a `@core/fetch-all-rows` lapozójával (a webes mintaadat 235 mozgás, de egy
 * teljesebb import átlépheti az 1000 soros PostgREST limitet).
 *
 * Előfeltétel: a `league_player_movements` view létezik az adatbázisban. Amíg
 * a webprojekt `migrations/add-league-player-movements-view.sql` migrációja
 * nem futott le, a lekérdezés 42P01-re fut – ezt külön üzenettel mondjuk ki,
 * mert nem hálózati hiba, és az újrapróbálás sem segít rajta.
 */
import { useCallback, useMemo } from 'react';

import { fetchAllRows } from '@core/fetch-all-rows';
import { parsePlayerMovement, type PlayerMovement } from '@core/player-movements';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { useFilterData } from '@/hooks/useFilterData';
import { buildMovementsView } from '@/lib/movements-view';
import { createQueryCache } from '@/lib/query-cache';
import { supabase } from '@/lib/supabase';
import { useFilterStore } from '@/store/filterStore';
import type { MovementsView } from '@/types/movements';

interface MovementsResult {
  /** Mindig van modell – adat híján üres csempékkel és szekciókkal. */
  view: MovementsView;
  /** Nincs egyetlen mozgás sem – a lekérdezés lefutott, üres az eredmény. */
  empty: boolean;
  loading: boolean;
  /** Van adat a képernyőn, de a háttérben új kérés fut (pull-to-refresh). */
  refreshing: boolean;
  error: string | null;
  reload: () => void;
}

const EMPTY_ROWS: PlayerMovement[] = [];

const cache = createQueryCache<PlayerMovement[]>();

/** A view hiányát a PostgREST ezekkel a szövegekkel jelzi. */
const MISSING_SOURCE = /schema cache|does not exist|could not find|42P01/i;

const MISSING_SOURCE_MESSAGE =
  'Az igazolási adatforrás még nincs előkészítve. Kérd az adminisztrátor segítségét.';

export function usePlayerMovements(): MovementsResult {
  const hydrated = useFilterStore((state) => state.hydrated);
  const seasonId = useFilterStore((state) => state.selectedSeasonId);
  const teamId = useFilterStore((state) => state.selectedTeamId);

  const {
    seasons,
    teams,
    selectedSeason,
    selectedTeam,
    allTeams,
    error: filterError,
    reload: reloadFilter,
  } = useFilterData();

  const canFetch = hydrated && teams.length > 0 && seasonId !== null;

  const {
    data: rows,
    loading,
    refreshing,
    error: queryError,
    reload: reloadMovements,
  } = useCachedQuery({
    cache,
    // Az üres csapatszűrő önálló kulcs: a liga nézet nem eshet össze egyetlen
    // csapat cache-ével sem.
    key: canFetch && seasonId ? `${seasonId}:${teamId ?? 'all'}` : null,
    fetcher: () => (seasonId ? fetchMovements(seasonId, teamId) : Promise.resolve(EMPTY_ROWS)),
    empty: EMPTY_ROWS,
    errorLabel: 'Az igazolások betöltése sikertelen',
  });

  const view = useMemo(
    () =>
      buildMovementsView({
        rows,
        seasonName: selectedSeason?.name ?? null,
        previousSeasonName: previousSeasonName(seasons, seasonId),
        teamName: selectedTeam?.name ?? null,
        teamCount: teams.length,
        league: allTeams,
      }),
    [rows, seasons, seasonId, selectedSeason, selectedTeam, teams.length, allTeams],
  );

  const reload = useCallback(() => {
    reloadFilter();
    reloadMovements();
  }, [reloadFilter, reloadMovements]);

  const error = queryError && MISSING_SOURCE.test(queryError) ? MISSING_SOURCE_MESSAGE : queryError;

  return {
    view,
    empty: rows.length === 0,
    // Ha a szűrőlisták elhasaltak, nincs mire várni – különben a képernyő
    // örökre töltésben ragadna egy olyan kérésre, ami el sem indul.
    loading: filterError === null && loading,
    refreshing,
    error: error ?? filterError,
    reload,
  };
}

/**
 * Az előző szezon neve a szezonlistából – a lista `start_date` szerint
 * csökkenő sorrendben áll, tehát a kiválasztott utáni elem a korábbi szezon.
 * Csak akkor kell, ha egyetlen mozgás sincs (a sorok maguk is hordozzák).
 */
function previousSeasonName(
  seasons: { id: string; name: string }[],
  seasonId: string | null,
): string | null {
  const index = seasons.findIndex((season) => season.id === seasonId);
  return index >= 0 ? (seasons[index + 1]?.name ?? null) : null;
}

async function fetchMovements(seasonId: string, teamId: string | null): Promise<PlayerMovement[]> {
  const rows = await fetchAllRows<unknown>((from, to) => {
    // A szűrők a lapozás ELŐTT kerülnek a lekérdezésre, ahogy a webes
    // `usePlayerMovements` is építi – a `range()` a szűrt halmazon lapoz.
    let query = supabase.from('league_player_movements').select('*').eq('season_id', seasonId);
    if (teamId) query = query.eq('team_id', teamId);

    return query.order('id').range(from, to);
  });

  // Rendszerhatár: a Supabase válasza típusozatlan, a `@core` ellenőrzi.
  return rows.map(parsePlayerMovement);
}
