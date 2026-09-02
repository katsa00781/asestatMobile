/**
 * A Szituációk képernyő adata: hazai/vendég bontás, játékhelyzetek, negyedek.
 *
 * A számítást a `@core/situational-analysis` `buildSituationalData`-ja végzi,
 * ugyanazokkal a bemenetekkel, mint a webes `SituationalAnalysis`. Két
 * eltérés a webhez képest, mindkettő mobil-indok:
 *
 * 1. A negyed- és metrikatáblát **nem** szezonra kérjük, hanem a csapat
 *    `kosarstat_game_id`-jaira (`.in(...)`). A szezonra szűrt lekérdezés a
 *    teljes ligát hozza: a negyedstat így 1000 sornál levágódna a PostgREST
 *    limitnél, mobilon pedig felesleges adat (D-070).
 * 2. A P13 nyolc metrikasorához kell a csapat dobás- és labdaadata is, ami a
 *    kosarstat metrikákban nincs benne – ezt a szezon `player_game_stats`
 *    táblájából, meccsenként összegezve állítjuk elő (D-071).
 *
 * A lekérdezés két körben fut: előbb a `games`, mert a `kosarstat_game_id`
 * lista csak abból derül ki.
 */
import { useCallback, useMemo } from 'react';

import { fetchAllRows } from '@core/fetch-all-rows';
import { getSeasonStatsTable } from '@core/season-tables';
import {
  buildSituationalData,
  type GameRow,
  type QuarterStatRow,
  type SituationalData,
  type TeamMetricRow,
} from '@core/situational-analysis';

import { useCachedQuery } from '@/hooks/useCachedQuery';
import { useFilterData } from '@/hooks/useFilterData';
import { createQueryCache, filterKey } from '@/lib/query-cache';
import { buildSituationalView, EMPTY_TOTALS, type SplitTotals } from '@/lib/situational-view';
import { supabase } from '@/lib/supabase';
import { useFilterStore } from '@/store/filterStore';
import type { SituationalView } from '@/types/situational';

interface SituationalPayload {
  data: SituationalData | null;
  home: SplitTotals;
  away: SplitTotals;
}

interface SituationalResult {
  view: SituationalView | null;
  /** Van-e egyáltalán lejátszott meccs a szűrőhöz. */
  hasGames: boolean;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const EMPTY_PAYLOAD: SituationalPayload = { data: null, home: EMPTY_TOTALS, away: EMPTY_TOTALS };

const cache = createQueryCache<SituationalPayload>();

export function useSituationalData(): SituationalResult {
  const hydrated = useFilterStore((state) => state.hydrated);
  const seasonId = useFilterStore((state) => state.selectedSeasonId);
  const teamId = useFilterStore((state) => state.selectedTeamId);

  // A szezon **neve** kell a szezonspecifikus stat-táblához, ezért a szűrő
  // listájára is várunk.
  const { selectedSeason, error: filterError, reload: reloadFilter } = useFilterData();
  const seasonName = selectedSeason?.name ?? null;

  // A lekérdezéshez szükséges keret egyben – így a típusszűkítés is megvan.
  const context =
    hydrated && seasonId && teamId && seasonName ? { seasonId, seasonName, teamId } : null;

  const { data, loading, error, reload: reloadData } = useCachedQuery({
    cache,
    key: context ? filterKey(context.seasonId, context.teamId) : null,
    // Csak `key !== null` esetén hívódik meg; a guard a típusszűkítésért van.
    fetcher: () =>
      context
        ? fetchSituational(context.seasonId, context.seasonName, context.teamId)
        : Promise.resolve(EMPTY_PAYLOAD),
    empty: EMPTY_PAYLOAD,
    errorLabel: 'A szituációs elemzés betöltése sikertelen',
  });

  const view = useMemo(
    () => (data.data ? buildSituationalView(data.data, data.home, data.away) : null),
    [data],
  );

  const reload = useCallback(() => {
    reloadFilter();
    reloadData();
  }, [reloadFilter, reloadData]);

  return {
    view,
    hasGames: (data.data?.totalGames ?? 0) > 0,
    loading: filterError === null && loading,
    error: filterError ?? error,
    reload,
  };
}

async function fetchSituational(
  seasonId: string,
  seasonName: string,
  teamId: string,
): Promise<SituationalPayload> {
  const games = toGameRows(
    await fetchAllRows<unknown>((from, to) =>
      supabase
        .from('games')
        .select('id, date, opponent, home_away, our_score, opp_score, result, kosarstat_game_id')
        .eq('season_id', seasonId)
        .eq('our_team_id', teamId)
        .order('date', { ascending: true })
        .range(from, to),
    ),
  );

  if (games.length === 0) return EMPTY_PAYLOAD;

  const kosarstatIds = games
    .map((game) => game.kosarstat_game_id)
    .filter((id): id is string => id !== null);

  const [quarters, metrics, splits] = await Promise.all([
    fetchQuarterStats(kosarstatIds),
    fetchTeamMetrics(kosarstatIds),
    fetchSplitTotals(seasonName, seasonId, teamId, games),
  ]);

  return {
    data: buildSituationalData(games, quarters, metrics),
    home: splits.home,
    away: splits.away,
  };
}

async function fetchQuarterStats(ids: string[]): Promise<QuarterStatRow[]> {
  if (ids.length === 0) return [];

  const rows = await fetchAllRows<unknown>((from, to) =>
    supabase
      .from('kosarstat_game_quarter_stats')
      .select('kosarstat_game_id, team_side, quarter, points, cumulative_points')
      .in('kosarstat_game_id', ids)
      .range(from, to),
  );

  return rows.flatMap((row) => {
    if (!isRecord(row)) return [];
    const { kosarstat_game_id, team_side } = row;
    if (typeof kosarstat_game_id !== 'string' || !isSide(team_side)) return [];

    return [
      {
        kosarstat_game_id,
        team_side,
        quarter: toNumber(row.quarter),
        points: toNumber(row.points),
        cumulative_points: toNumber(row.cumulative_points),
      },
    ];
  });
}

async function fetchTeamMetrics(ids: string[]): Promise<TeamMetricRow[]> {
  if (ids.length === 0) return [];

  const rows = await fetchAllRows<unknown>((from, to) =>
    supabase
      .from('kosarstat_game_team_metrics')
      .select('kosarstat_game_id, team_side, poss, ortg, efg, tov_pct, orb_pct, ftm_rate')
      .in('kosarstat_game_id', ids)
      .range(from, to),
  );

  return rows.flatMap((row) => {
    if (!isRecord(row)) return [];
    const { kosarstat_game_id, team_side } = row;
    if (typeof kosarstat_game_id !== 'string' || !isSide(team_side)) return [];

    return [
      {
        kosarstat_game_id,
        team_side,
        poss: toNumber(row.poss),
        ortg: toNumber(row.ortg),
        efg: toNumber(row.efg),
        tov_pct: toNumber(row.tov_pct),
        orb_pct: toNumber(row.orb_pct),
        ftm_rate: toNumber(row.ftm_rate),
      },
    ];
  });
}

/**
 * Hazai/vendég csapatösszegzés. A pontok a `games` sorokból jönnek (minden
 * lejátszott meccs), a dobás-, lepattanó-, assziszt- és labdaadat a szezon
 * `player_game_stats` táblájából, játékossorokat meccsenként összeadva.
 */
async function fetchSplitTotals(
  seasonName: string,
  seasonId: string,
  teamId: string,
  games: GameRow[],
): Promise<{ home: SplitTotals; away: SplitTotals }> {
  const home = { ...EMPTY_TOTALS };
  const away = { ...EMPTY_TOTALS };

  const sideOf = new Map<string, SplitTotals>();
  for (const game of games) {
    const side = game.home_away === 'home' ? home : away;
    sideOf.set(game.id, side);

    side.games += 1;
    if (game.result === 'win') side.wins += 1;
    side.scored += game.our_score;
    side.allowed += game.opp_score;
  }

  const rows = await fetchAllRows<unknown>((from, to) =>
    supabase
      .from(getSeasonStatsTable(seasonName))
      .select(
        'game_id, close_made, close_attempted, mid_made, mid_attempted, three_made, ' +
          'three_attempted, total_rebounds, assists, turnovers, ' +
          'games!inner(season_id, our_team_id)',
      )
      .eq('games.season_id', seasonId)
      .eq('games.our_team_id', teamId)
      .range(from, to),
  );

  // A lepattanó/assziszt átlag nevezője az a meccsszám, amihez tényleg van
  // játékossor – ezért oldalanként külön gyűjtjük.
  const statGames = new Map<SplitTotals, Set<string>>([
    [home, new Set<string>()],
    [away, new Set<string>()],
  ]);

  for (const row of rows) {
    if (!isRecord(row)) continue;
    const gameId = row.game_id;
    if (typeof gameId !== 'string') continue;

    const side = sideOf.get(gameId);
    if (!side) continue;

    statGames.get(side)?.add(gameId);

    side.fgMade += toNumber(row.close_made) + toNumber(row.mid_made) + toNumber(row.three_made);
    side.fgAttempted +=
      toNumber(row.close_attempted) +
      toNumber(row.mid_attempted) +
      toNumber(row.three_attempted);
    side.threeMade += toNumber(row.three_made);
    side.threeAttempted += toNumber(row.three_attempted);
    side.rebounds += toNumber(row.total_rebounds);
    side.assists += toNumber(row.assists);
    side.turnovers += toNumber(row.turnovers);
  }

  home.statGames = statGames.get(home)?.size ?? 0;
  away.statGames = statGames.get(away)?.size ?? 0;

  return { home, away };
}

// --- Rendszerhatár: a Supabase válasza típusozatlan, itt validáljuk. ---

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSide(value: unknown): value is 'home' | 'away' {
  return value === 'home' || value === 'away';
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function toGameRows(rows: unknown[]): GameRow[] {
  return rows.flatMap((row) => {
    if (!isRecord(row)) return [];
    const { id, date, opponent, home_away, result } = row;
    if (typeof id !== 'string' || typeof date !== 'string') return [];
    if (!isSide(home_away)) return [];
    if (result !== 'win' && result !== 'loss') return [];

    return [
      {
        id,
        date,
        opponent: typeof opponent === 'string' ? opponent : 'Ismeretlen ellenfél',
        home_away,
        our_score: toNumber(row.our_score),
        opp_score: toNumber(row.opp_score),
        result,
        kosarstat_game_id:
          typeof row.kosarstat_game_id === 'string' ? row.kosarstat_game_id : null,
      },
    ];
  });
}
