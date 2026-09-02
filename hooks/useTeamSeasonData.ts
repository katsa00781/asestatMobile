/**
 * A liga szezonmezőnye – az Ellenfél scouting és a Szerepkör-elemzés **közös**
 * adatforrása.
 *
 * A két képernyő ugyanazt a három lekérdezést futtatta külön cache-sel; most
 * egy hook és egy cache szolgálja ki mindkettőt (D-086). A gyakorlati
 * következmény: aki a scoutingról átlép a szerepkör-elemzésre, nem vár újra
 * 2 MB-nyi szezonadatra.
 *
 * A kulcs csak a szezon, mert a mezőny liga-szintű: a csapat vagy az ellenfél
 * váltása nem indít új lekérdezést, csak újraszámol (D-077 mintája).
 */
import { useCallback } from 'react';

import { useCachedQuery } from '@/hooks/useCachedQuery';
import { useFilterData } from '@/hooks/useFilterData';
import { createQueryCache } from '@/lib/query-cache';
import {
  EMPTY_TEAM_SEASON,
  fetchTeamSeasonStats,
  type TeamSeasonPayload,
} from '@/lib/team-season-stats';
import { useFilterStore } from '@/store/filterStore';

interface TeamSeasonResult {
  data: TeamSeasonPayload;
  /** A szűrőben kiválasztott csapat, ha már ismert. */
  teamId: string | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const cache = createQueryCache<TeamSeasonPayload>();

export function useTeamSeasonData(errorLabel: string): TeamSeasonResult {
  const hydrated = useFilterStore((state) => state.hydrated);
  const seasonId = useFilterStore((state) => state.selectedSeasonId);
  const teamId = useFilterStore((state) => state.selectedTeamId);

  // A szezon **neve** kell a szezonspecifikus stat-táblához, a csapatnevek
  // pedig a megjelenítéshez – ezért a szűrő listájára is várunk.
  const { teams, selectedSeason, error: filterError, reload: reloadFilter } = useFilterData();
  const seasonName = selectedSeason?.name ?? null;

  const context =
    hydrated && seasonId && seasonName && teams.length > 0 ? { seasonId, seasonName } : null;

  const { data, loading, error, reload: reloadSeason } = useCachedQuery({
    cache,
    key: context ? context.seasonId : null,
    // Csak `key !== null` esetén hívódik meg; a guard a típusszűkítésért van.
    fetcher: () =>
      context
        ? fetchTeamSeasonStats(context.seasonId, context.seasonName, teams)
        : Promise.resolve(EMPTY_TEAM_SEASON),
    empty: EMPTY_TEAM_SEASON,
    errorLabel,
  });

  const reload = useCallback(() => {
    reloadFilter();
    reloadSeason();
  }, [reloadFilter, reloadSeason]);

  return {
    data,
    teamId,
    // Ha a szűrő listája elhasalt, nincs mire várni – különben a képernyő
    // örökre töltésben ragadna egy olyan kérésre, ami el sem indul.
    loading: filterError === null && loading,
    error: filterError ?? error,
    reload,
  };
}
