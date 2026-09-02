/**
 * A Szerepkör-elemzés képernyő adata.
 *
 * A számítást a `@core/team-analysis` `analyzeTeamSeason`-je végzi,
 * ugyanazokkal a bemenetekkel, mint a webes `SeasonComparison` csapatszekciója:
 * a csapat szezonösszegzése (kerettel és ellenfél-oldali volumennel) és a liga
 * **összes** csapatából épített percentilis-mezőny (`buildTeamBenchmarks`).
 *
 * A lekérdezés és az összegzés a `useTeamSeasonData` közös hookjában van (a
 * scouting ugyanazt a mezőnyt használja); ez a hook csak a kiválasztott
 * csapatra futtatja a modellt.
 */
import { useMemo } from 'react';

import { analyzeTeamSeason, buildTeamBenchmarks } from '@core/team-analysis';

import { useTeamSeasonData } from '@/hooks/useTeamSeasonData';
import { buildRolesView } from '@/lib/roles-view';
import type { RolesView } from '@/types/roles';

interface RolesResult {
  view: RolesView | null;
  /** Van-e egyáltalán elemezhető szezonadat. */
  hasData: boolean;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useTeamRolesData(): RolesResult {
  const { data, teamId, loading, error, reload } = useTeamSeasonData(
    'A szerepkör-elemzés betöltése sikertelen',
  );

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

  return {
    view,
    hasData: data.teams.length > 0,
    loading,
    error,
    reload,
  };
}
