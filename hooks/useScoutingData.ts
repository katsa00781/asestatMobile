/**
 * Az Ellenfél scouting képernyő adata: liga-szintű csapatmezőny + a két
 * szembeállított keret.
 *
 * A számítást a `@core/pregame-scouting` `analyzePreGameScouting`-ja végzi,
 * ugyanazokkal a bemenetekkel, mint a webes `SeasonComparison` pregame
 * szekciója: ellenfél és saját csapat szezonösszegzése, a két keret
 * játékossorai, és a **liga összes csapatából** épített percentilis-mezőny
 * (`buildTeamBenchmarks`). Benchmark nélkül a modell nem tud stílust,
 * veszélyforrást és esélyt mondani, ezért ez a lekérdezés nem szűkül egy
 * csapatra (D-077).
 *
 * A lekérdezés és az összegzés a `useTeamSeasonData` közös hookjában van – a
 * szerepkör-elemzés ugyanezt a mezőnyt használja, és ugyanabból a cache-ből
 * (D-086). A csapatösszegzés így a meccsenkénti játékossorokból jön (D-078),
 * az ellenfél-oldali volumen pedig a meccsek párosításából (D-081) – ez
 * utóbbi teszi a tempót és a támadólepattanó-arányt mutathatóvá.
 */
import { useCallback, useMemo } from 'react';

import { analyzePreGameScouting, buildTeamBenchmarks } from '@core/pregame-scouting';

import { useFilterData } from '@/hooks/useFilterData';
import { useGameData } from '@/hooks/useGameData';
import { useTeamSeasonData } from '@/hooks/useTeamSeasonData';
import { formatDate } from '@/lib/format';
import { normalizeText } from '@/lib/search';
import { buildScoutingView } from '@/lib/scouting-view';
import { EMPTY_RECORD, type TeamSeasonPayload } from '@/lib/team-season-stats';
import type { Team } from '@/types/filters';
import type { OpponentMeta, OpponentOption, ScoutingView } from '@/types/scouting';

interface ScoutingResult {
  view: ScoutingView | null;
  /** A választható ellenfelek, névsorban. */
  opponents: OpponentOption[];
  /** Az éppen elemzett ellenfél, ha van. */
  selected: OpponentOption | null;
  meta: OpponentMeta | null;
  /** Van-e egyáltalán elemezhető szezonadat. */
  hasData: boolean;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useScoutingData(opponentId: string | null): ScoutingResult {
  const { teams } = useFilterData();
  const { data, teamId, loading, error, reload: reloadSeason } = useTeamSeasonData(
    'Az ellenfél-elemzés betöltése sikertelen',
  );

  // A következő ellenfél a menetrendből, a legutóbbi a lejátszott meccsekből
  // jön – mindkettő a `useGameData` cache-éből, új hálózati kérés nélkül.
  const { nextFixture, lastGame, reload: reloadGames } = useGameData();

  const opponents = useMemo(() => buildOpponents(data, teamId), [data, teamId]);

  // Az alapértelmezett ellenfél: a következő találkozó, egyébként a legutóbbi
  // meccs ellenfele. Mindkettő csak akkor jó, ha van hozzá szezonadat.
  const fallback = useMemo(() => {
    const known = new Set(opponents.map((option) => option.id));

    if (nextFixture && known.has(nextFixture.opponentId)) {
      return {
        id: nextFixture.opponentId,
        meta: {
          source: 'next' as const,
          label: 'Következő ellenfél',
          detail: `${formatDate(nextFixture.gameDate)} · ${side(nextFixture.isHome)}`,
        },
      };
    }

    const lastId = lastGame ? findTeamId(lastGame.opponent, teams) : null;
    if (lastGame && lastId && known.has(lastId)) {
      return {
        id: lastId,
        meta: {
          source: 'last' as const,
          label: 'Legutóbbi ellenfél',
          detail: `${formatDate(lastGame.date)} · ${side(lastGame.homeAway === 'home')}`,
        },
      };
    }

    return opponents.length > 0
      ? { id: opponents[0].id, meta: { source: 'pick' as const, label: 'Ellenfél', detail: null } }
      : null;
  }, [lastGame, nextFixture, opponents, teams]);

  // A kézzel választott ellenfél felülírja az alapértelmezést, de a szezon
  // váltása után csak akkor, ha az új szezonban is van adata.
  const picked = opponentId && opponents.some((option) => option.id === opponentId)
    ? opponentId
    : null;
  const activeId = picked ?? fallback?.id ?? null;

  const meta: OpponentMeta | null = picked
    ? picked === fallback?.id
      ? fallback.meta
      : { source: 'pick', label: 'Választott ellenfél', detail: null }
    : (fallback?.meta ?? null);

  const view = useMemo(() => {
    if (!teamId || !activeId) return null;
    return buildView(data, teamId, activeId);
  }, [activeId, data, teamId]);

  const reload = useCallback(() => {
    reloadGames();
    reloadSeason();
  }, [reloadGames, reloadSeason]);

  return {
    view,
    opponents,
    selected: opponents.find((option) => option.id === activeId) ?? null,
    meta,
    hasData: data.teams.length > 0,
    loading,
    error,
    reload,
  };
}

/** Pálya a sáv meta sorába. */
function side(isHome: boolean): string {
  return isHome ? 'hazai' : 'idegenben';
}

/** A saját csapaton kívüli, szezonadattal rendelkező csapatok névsorban. */
function buildOpponents(payload: TeamSeasonPayload, teamId: string | null): OpponentOption[] {
  return payload.teams
    .filter((team) => team.teamId !== teamId && team.games > 0)
    .map((team) => ({
      id: team.teamId,
      name: team.teamName,
      gamesText: `${team.games} meccs`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'hu'));
}

function buildView(
  payload: TeamSeasonPayload,
  teamId: string,
  opponentId: string,
): ScoutingView | null {
  const own = payload.teams.find((team) => team.teamId === teamId);
  const opponent = payload.teams.find((team) => team.teamId === opponentId);
  if (!own || !opponent) return null;

  const opponentPlayers = payload.rosters.get(opponentId) ?? [];
  // Keret nélkül a modell kulcsembert és poszt-összehasonlítást sem tud adni;
  // ilyenkor inkább üres állapot áll a képernyőn, mint egy féllábú riport.
  if (opponentPlayers.length === 0) return null;

  const report = analyzePreGameScouting(
    opponent,
    opponentPlayers,
    own,
    buildTeamBenchmarks(payload.teams),
    payload.rosters.get(teamId) ?? [],
  );

  return buildScoutingView(
    report,
    payload.records.get(teamId) ?? EMPTY_RECORD,
    payload.records.get(opponentId) ?? EMPTY_RECORD,
    payload.pairedGames.get(teamId) ?? 0,
    payload.pairedGames.get(opponentId) ?? 0,
  );
}

/** A `games.opponent` szöveges nevét kötjük csapat-azonosítóhoz. */
function findTeamId(opponentName: string, teams: Team[]): string | null {
  const needle = normalizeText(opponentName);
  const match = teams.find(
    (team) => normalizeText(team.name) === needle || normalizeText(team.shortName) === needle,
  );

  return match?.id ?? null;
}
