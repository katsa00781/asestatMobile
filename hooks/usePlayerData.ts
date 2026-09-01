/**
 * A kiválasztott szezon és csapat szezon-aggregált játékosstatisztikái.
 *
 * Forrás a `player_season_stats_by_season` view, a sor → `PlayerStats`
 * konverziót a `@core/player-stat-mapping` végzi (a TS% és az eFG% így az
 * összegzett dobásokból számolódik, nem meccsenkénti százalékok átlagából).
 *
 * A szűrőt a hook maga olvassa a `filterStore`-ból, és szűrőpáronként
 * (`szezon:csapat`) cache-el – ugyanaz a minta, mint a `useGameData`-nál (D-020).
 *
 * Meccsenkénti bontást (`gameHistory`) ez a hook **nem** tölt: az a játékos
 * részletei képernyő dolga lesz, külön lekérdezéssel – lásd D-024.
 */
import { useCallback, useEffect, useState } from 'react';

import type { PlayerStats } from '@core/dashboard-types';
import { fetchAllRows } from '@core/fetch-all-rows';
import { mapSupabaseStatToPlayerStats, type SupabasePlayerStat } from '@core/player-stat-mapping';
import { resolvePrimaryPosition } from '@core/positions';

import { POSITION_LABELS_HU } from '@/data/position-labels';
import { supabase } from '@/lib/supabase';
import { useFilterStore } from '@/store/filterStore';
import type { PlayerAverages, SeasonPlayer } from '@/types/players';

interface PlayerDataResult {
  /** Meccsenkénti pontátlag szerint csökkenő sorrendben. */
  players: SeasonPlayer[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const cache = new Map<string, Promise<SeasonPlayer[]>>();

export function usePlayerData(): PlayerDataResult {
  const [players, setPlayers] = useState<SeasonPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const hydrated = useFilterStore((state) => state.hydrated);
  const seasonId = useFilterStore((state) => state.selectedSeasonId);
  const teamId = useFilterStore((state) => state.selectedTeamId);

  useEffect(() => {
    if (!hydrated || !seasonId || !teamId) return;

    let active = true;
    setLoading(true);
    setError(null);

    loadPlayers(seasonId, teamId)
      .then((data) => {
        if (!active) return;
        setPlayers(data);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const message = err instanceof Error ? err.message : 'Ismeretlen hiba';
        setError(`A játékosstatisztikák betöltése sikertelen: ${message}`);
        setPlayers([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [hydrated, seasonId, teamId, attempt]);

  const reload = useCallback(() => {
    if (seasonId && teamId) cache.delete(cacheKey(seasonId, teamId));
    setAttempt((value) => value + 1);
  }, [seasonId, teamId]);

  return {
    players,
    // A store visszaolvasása előtt még nem tudjuk, mit kellene kérni – ilyenkor
    // is töltés van, különben egy pillanatra üres lista villanna fel.
    loading: !hydrated || loading,
    error,
    reload,
  };
}

function cacheKey(seasonId: string, teamId: string): string {
  return `${seasonId}:${teamId}`;
}

function loadPlayers(seasonId: string, teamId: string): Promise<SeasonPlayer[]> {
  const key = cacheKey(seasonId, teamId);
  const cached = cache.get(key);
  if (cached) return cached;

  const request = fetchPlayers(seasonId, teamId).catch((err: unknown) => {
    // A sikertelen kérés ne ragadjon bent, különben a `reload()` ugyanazt a
    // hibát adná vissza örökre.
    cache.delete(key);
    throw err;
  });
  cache.set(key, request);
  return request;
}

async function fetchPlayers(seasonId: string, teamId: string): Promise<SeasonPlayer[]> {
  // Egy csapat egy szezonban ~15 sor, de a lapozó helper így is olcsó, és a
  // PostgREST limit soha nem tud némán csonkolni.
  const rows = await fetchAllRows<unknown>((from, to) =>
    supabase
      .from('player_season_stats_by_season')
      .select('*')
      .eq('season_id', seasonId)
      .eq('team_id', teamId)
      .order('total_points', { ascending: false })
      .range(from, to),
  );

  return toSeasonPlayers(rows);
}

function toSeasonPlayers(rows: unknown[]): SeasonPlayer[] {
  return rows
    .flatMap((row: unknown) => {
      const stat = toPlayerStat(row);
      // Aki egy meccsen sem lépett pályára, annak minden átlaga nulla lenne –
      // a listát csak zajjal töltené.
      if (!stat || stat.games_played <= 0) return [];
      return [toSeasonPlayer(stat)];
    })
    .sort((a, b) => b.averages.points - a.averages.points);
}

function toSeasonPlayer(stat: SupabasePlayerStat): SeasonPlayer {
  const player = mapSupabaseStatToPlayerStats(stat, {
    offensiveRating: Math.round(scoringEfficiency(stat) * 100) / 100,
    defensiveRating: Math.round(defensiveIndex(stat) * 10) / 10,
  });

  return {
    ...player,
    averages: averages(player),
    positionLabel: POSITION_LABELS_HU[resolvePrimaryPosition(player.position)],
  };
}

function averages(player: PlayerStats): PlayerAverages {
  const games = player.gamesPlayed;
  const perGame = (total: number) => (games > 0 ? total / games : 0);

  return {
    points: perGame(player.points),
    rebounds: perGame(player.rebounds.total),
    assists: perGame(player.assists),
    minutes: perGame(player.minutes),
    steals: perGame(player.steals),
    turnovers: perGame(player.turnovers),
    // A `PlayerStats.valuation` a view `avg_valuation` mezője, tehát már átlag.
    valuation: player.valuation,
  };
}

/**
 * Ponthatékonyság: pont / (mezőnykísérlet + fél büntető). A webprojekt
 * `useGameData`-jával azonos képlet, hogy a mobil és a web ugyanazt a számot
 * mutassa. Figyelem: **nem** az NBA offenzív ratingje.
 */
function scoringEfficiency(stat: SupabasePlayerStat): number {
  const fieldGoalAttempts =
    stat.total_close_attempted + stat.total_mid_attempted + stat.total_three_attempted;
  const attempts = fieldGoalAttempts + 0.5 * stat.total_free_throw_attempted;
  return attempts > 0 ? stat.total_points / attempts : 0;
}

/** Védekezési index: (labdaszerzés + blokk + védőlepattanó) / meccs. */
function defensiveIndex(stat: SupabasePlayerStat): number {
  const actions = stat.total_steals + stat.total_blocks + stat.total_defensive_rebounds;
  return stat.games_played > 0 ? actions / stat.games_played : 0;
}

// --- Rendszerhatár: a Supabase válasza típusozatlan, itt validáljuk. ---

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function toText(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function toOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function toPlayerStat(row: unknown): SupabasePlayerStat | null {
  if (!isRecord(row)) return null;
  const { player_id, name, season_id, team_id } = row;
  if (typeof player_id !== 'string' || typeof name !== 'string') return null;
  if (typeof season_id !== 'string' || typeof team_id !== 'string') return null;

  return {
    player_id,
    name,
    number: toNumber(row.number),
    position: toText(row.position, ''),
    season_id,
    season_name: toText(row.season_name, ''),
    is_active: row.is_active === true,
    birth_year: toOptionalNumber(row.birth_year),
    height: toOptionalNumber(row.height),
    weight: toOptionalNumber(row.weight),
    team_id,
    team_name: toText(row.team_name, ''),
    team_short_name: toText(row.team_short_name, ''),
    games_played: toNumber(row.games_played),
    total_points: toNumber(row.total_points),
    total_minutes: toNumber(row.total_minutes),
    total_close_made: toNumber(row.total_close_made),
    total_close_attempted: toNumber(row.total_close_attempted),
    total_mid_made: toNumber(row.total_mid_made),
    total_mid_attempted: toNumber(row.total_mid_attempted),
    total_three_made: toNumber(row.total_three_made),
    total_three_attempted: toNumber(row.total_three_attempted),
    total_free_throw_made: toNumber(row.total_free_throw_made),
    total_free_throw_attempted: toNumber(row.total_free_throw_attempted),
    total_offensive_rebounds: toNumber(row.total_offensive_rebounds),
    total_defensive_rebounds: toNumber(row.total_defensive_rebounds),
    total_rebounds: toNumber(row.total_rebounds),
    total_assists: toNumber(row.total_assists),
    total_steals: toNumber(row.total_steals),
    total_blocks: toNumber(row.total_blocks),
    total_turnovers: toNumber(row.total_turnovers),
    total_fouls_committed: toNumber(row.total_fouls_committed),
    total_fouls_drawn: toNumber(row.total_fouls_drawn),
    total_valuation: toNumber(row.total_valuation),
    avg_valuation: toNumber(row.avg_valuation),
  };
}
