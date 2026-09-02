/**
 * A Szerepkör-elemzés képernyő adata.
 *
 * A számítást a `@core/team-analysis` `analyzeTeamSeason`-je végzi,
 * ugyanazokkal a bemenetekkel, mint a webes `SeasonComparison` csapatszekciója:
 * a csapat szezonösszegzése (kerettel és ellenfél-oldali volumennel) és a liga
 * **összes** csapatából épített percentilis-mezőny (`buildTeamBenchmarks`).
 * A mezőny nélkül a modell se stílust, se klasztert, se percentilist nem tud
 * mondani, ezért a lekérdezés itt sem szűkül egy csapatra (D-077 mintája).
 *
 * A lekérdezés és az összegzés a `lib/team-season-stats` tiszta moduljában
 * van; ez a hook csak a szűrőt, a cache-t és a hibaállapotot kezeli. Az adat
 * szezononként cache-elődik – a csapat váltása nem indít új lekérdezést, csak
 * újraszámol.
 */
import { useCallback, useMemo } from 'react';

import { analyzeTeamSeason, buildTeamBenchmarks } from '@core/team-analysis';

import { useCachedQuery } from '@/hooks/useCachedQuery';
import { useFilterData } from '@/hooks/useFilterData';
import { createQueryCache } from '@/lib/query-cache';
import { buildRolesView } from '@/lib/roles-view';
import {
  EMPTY_TEAM_SEASON,
  fetchTeamSeasonStats,
  type TeamSeasonPayload,
} from '@/lib/team-season-stats';
import { useFilterStore } from '@/store/filterStore';
import type { RolesView } from '@/types/roles';

interface RolesResult {
  view: RolesView | null;
  /** Van-e egyáltalán elemezhető szezonadat. */
  hasData: boolean;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const cache = createQueryCache<TeamSeasonPayload>();

export function useTeamRolesData(): RolesResult {
  const hydrated = useFilterStore((state) => state.hydrated);
  const seasonId = useFilterStore((state) => state.selectedSeasonId);
  const teamId = useFilterStore((state) => state.selectedTeamId);

  // A szezon **neve** kell a szezonspecifikus stat-táblához, a csapatnevek
  // pedig a megjelenítéshez – ezért a szűrő listájára is várunk.
  const { teams, selectedSeason, error: filterError, reload: reloadFilter } = useFilterData();
  const seasonName = selectedSeason?.name ?? null;

  const context =
    hydrated && seasonId && seasonName && teams.length > 0 ? { seasonId, seasonName } : null;

  const { data, loading, error, reload: reloadRoles } = useCachedQuery({
    cache,
    // A mezőny liga-szintű: a kulcs csak a szezon, a csapatváltás nem tölt újra.
    key: context ? context.seasonId : null,
    // Csak `key !== null` esetén hívódik meg; a guard a típusszűkítésért van.
    fetcher: () =>
      context
        ? fetchTeamSeasonStats(context.seasonId, context.seasonName, teams)
        : Promise.resolve(EMPTY_TEAM_SEASON),
    empty: EMPTY_TEAM_SEASON,
    errorLabel: 'A szerepkör-elemzés betöltése sikertelen',
  });

  const view = useMemo(() => {
    if (!teamId) return null;

    const team = data.teams.find((entry) => entry.teamId === teamId);
    // Keret nélkül a modell se szerepkört, se posztmegoszlást nem tud adni;
    // ilyenkor inkább üres állapot áll a képernyőn, mint egy féllábú riport.
    if (!team || team.roster.length === 0) return null;

    const analysis = analyzeTeamSeason(team, buildTeamBenchmarks(data.teams));

    return buildRolesView(analysis, {
      teamCount: data.teams.length,
      ratedPlayers: data.ratedPlayers,
      rosterSize: team.roster.length,
      games: team.games,
      pairedGames: data.pairedGames.get(teamId) ?? 0,
    });
  }, [data, teamId]);

  const reload = useCallback(() => {
    reloadFilter();
    reloadRoles();
  }, [reloadFilter, reloadRoles]);

  return {
    view,
    hasData: data.teams.length > 0,
    // Ha a szűrő listája elhasalt, nincs mire várni – különben a képernyő
    // örökre töltésben ragadna egy olyan kérésre, ami el sem indul.
    loading: filterError === null && loading,
    error: filterError ?? error,
    reload,
  };
}
