/**
 * Egy lejátszott meccs számított post-game elemzése – a képernyő hookja.
 *
 * A lekérdezés és a számítás a `lib/postgame-data`-ban van; ez a hook csak
 * összeköti a forrásokat és cache-el:
 *
 * - a liga szezonmezőnye és a benchmark a `useTeamSeasonData` cache-éből
 *   (D-086) – új hálózati kérés nélkül, ha a scouting már betöltötte;
 * - a meccs sora és a hajrá-bontás a `useGameDetails` cache-éből – a
 *   részletekről ide lépve nincs újabb kör;
 * - a post-game saját lekérdezései `gameId` kulcson.
 *
 * A számítás `useMemo`-ban fut: tiszta függvény, hálózatot nem hív.
 */
import { useMemo } from 'react';

import type { PostGameReport } from '@core/postgame-report';

import { useCachedQuery } from '@/hooks/useCachedQuery';
import { useFilterData } from '@/hooks/useFilterData';
import { useGameDetails } from '@/hooks/useGameDetails';
import { useTeamSeasonData } from '@/hooks/useTeamSeasonData';
import {
  buildPostgameReport,
  EMPTY_POSTGAME,
  fetchPostgame,
  type PostgamePayload,
} from '@/lib/postgame-data';
import { createQueryCache } from '@/lib/query-cache';
import type { GameReport, TeamGame } from '@/types/games';

interface PostgameResult {
  game: TeamGame | null;
  report: PostGameReport | null;
  playerReports: Map<string, GameReport>;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const cache = createQueryCache<PostgamePayload>();

export function usePostgameAnalysis(gameId: string): PostgameResult {
  const { selectedSeason, selectedTeam } = useFilterData();
  const details = useGameDetails(gameId);
  const season = useTeamSeasonData('A szezonadat betöltése sikertelen');

  const { game, clutch } = details;
  const seasonId = selectedSeason?.id ?? null;
  const seasonName = selectedSeason?.name ?? null;
  const teamId = season.teamId;
  const context = game && seasonId && seasonName && teamId ? { game, seasonId, seasonName, teamId } : null;

  const { data, loading, error, reload } = useCachedQuery({
    cache,
    key: context ? gameId : null,
    // Csak `key !== null` esetén hívódik meg; a guard a típusszűkítésért van.
    fetcher: () =>
      context
        ? fetchPostgame(context.game, context.seasonId, context.seasonName, context.teamId)
        : Promise.resolve(EMPTY_POSTGAME),
    empty: EMPTY_POSTGAME,
    errorLabel: 'A post-game elemzés betöltése sikertelen',
  });

  const report = useMemo(() => {
    if (!game || !seasonName || !teamId || data.ownLines.length === 0) return null;
    return buildPostgameReport({
      game,
      seasonName,
      teamId,
      teamName: selectedTeam?.name ?? '',
      payload: data,
      leagueTeams: season.data.teams,
      rosters: season.data.rosters,
      clutch,
    });
  }, [clutch, data, game, season.data, seasonName, selectedTeam?.name, teamId]);

  return {
    game,
    report,
    playerReports: data.playerReports,
    loading:
      details.error === null &&
      season.error === null &&
      (details.loading || season.loading || (context !== null && loading)),
    error: details.error ?? season.error ?? error,
    reload: () => {
      details.reload();
      season.reload();
      reload();
    },
  };
}
