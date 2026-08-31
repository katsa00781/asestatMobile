/**
 * A kiválasztott szezon és csapat meccsei: lejátszott meccsek, közelgő
 * fixtures, és a kettőből számolt csapatösszesítés.
 *
 * A szűrőt a hook maga olvassa a `filterStore`-ból – a képernyőknek nem kell
 * propként továbbadniuk. Amíg a store nem hidratált, nem indul lekérdezés.
 *
 * A lekért adat a szűrőpáronként (`szezon:csapat`) modulszintű cache-be kerül,
 * mint a `useFilterData`-nál (D-014): tabváltásnál nem fut újra a hálózat.
 */
import { useCallback, useEffect, useState } from 'react';

import { fetchAllRows } from '@core/fetch-all-rows';

import { supabase } from '@/lib/supabase';
import { useFilterData } from '@/hooks/useFilterData';
import { useFilterStore } from '@/store/filterStore';
import type { Fixture, HomeAway, GameResult, TeamAggregate, TeamGame } from '@/types/games';

/** Ezekre a státuszokra mondjuk, hogy a találkozó még hátravan. */
const UPCOMING_STATUSES = ['scheduled', 'postponed'] as const;

const EMPTY_AGGREGATE: TeamAggregate = {
  played: 0,
  wins: 0,
  losses: 0,
  avgScored: 0,
  avgConceded: 0,
  avgDiff: 0,
};

interface GameDataResult {
  games: TeamGame[];
  fixtures: Fixture[];
  /** A legközelebbi hátralévő találkozó, ha van. */
  nextFixture: Fixture | null;
  /** A legutóbb lejátszott meccs, ha van. */
  lastGame: TeamGame | null;
  teamStats: TeamAggregate;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

interface GameDataPayload {
  games: TeamGame[];
  fixtures: Fixture[];
}

const cache = new Map<string, Promise<GameDataPayload>>();

export function useGameData(): GameDataResult {
  const [games, setGames] = useState<TeamGame[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const hydrated = useFilterStore((state) => state.hydrated);
  const seasonId = useFilterStore((state) => state.selectedSeasonId);
  const teamId = useFilterStore((state) => state.selectedTeamId);
  // A fixtures csak csapat-azonosítót tárol, a nevek a szűrő listájából jönnek.
  const {
    teams,
    loading: filterLoading,
    error: filterError,
    reload: reloadFilter,
  } = useFilterData();

  // Amíg a szűrő listája tölt, még nem tudjuk, lesz-e mit lekérdezni; ha viszont
  // elhasalt, nincs mire várni – különben a képernyő örökre töltésben ragadna.
  const waitingForFilter = !hydrated || filterLoading;
  const canFetch = hydrated && seasonId !== null && teamId !== null && teams.length > 0;

  useEffect(() => {
    if (!hydrated || !seasonId || !teamId || teams.length === 0) return;

    let active = true;
    setLoading(true);
    setError(null);

    loadGameData(seasonId, teamId, teams)
      .then((data) => {
        if (!active) return;
        setGames(data.games);
        setFixtures(data.fixtures);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const message = err instanceof Error ? err.message : 'Ismeretlen hiba';
        setError(`A meccsek betöltése sikertelen: ${message}`);
        setGames([]);
        setFixtures([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [hydrated, seasonId, teamId, teams, attempt]);

  const reload = useCallback(() => {
    if (seasonId && teamId) cache.delete(cacheKey(seasonId, teamId));
    // A csapatnevek is a szűrő hookjából jönnek: egy újrapróbálás gomb mindkettőt
    // újratölti, különben egy elhasalt csapatlista után sosem lenne fixture név.
    reloadFilter();
    setAttempt((value) => value + 1);
  }, [seasonId, teamId, reloadFilter]);

  return {
    games,
    fixtures,
    nextFixture: fixtures[0] ?? null,
    lastGame: games[0] ?? null,
    teamStats: aggregate(games),
    loading: waitingForFilter || (canFetch && loading),
    error: error ?? filterError,
    reload,
  };
}

function cacheKey(seasonId: string, teamId: string): string {
  return `${seasonId}:${teamId}`;
}

function loadGameData(
  seasonId: string,
  teamId: string,
  teams: { id: string; name: string }[],
): Promise<GameDataPayload> {
  const key = cacheKey(seasonId, teamId);
  const cached = cache.get(key);
  if (cached) return cached;

  const request = fetchGameData(seasonId, teamId, teams).catch((err: unknown) => {
    // A sikertelen kérés ne ragadjon bent, különben a `reload()` ugyanazt a
    // hibát adná vissza örökre.
    cache.delete(key);
    throw err;
  });
  cache.set(key, request);
  return request;
}

async function fetchGameData(
  seasonId: string,
  teamId: string,
  teams: { id: string; name: string }[],
): Promise<GameDataPayload> {
  const today = todayIso();

  // Lapozva kérünk: egy szezon néhány tucat sor, de a `games` tábla minden
  // csapat perspektíváját tárolja, így egy bő szezon átlépheti az 1000-et.
  const [gameRows, fixtureRows] = await Promise.all([
    fetchAllRows<unknown>((from, to) =>
      supabase
        .from('games')
        .select('id, date, round, opponent, home_away, our_score, opp_score, result')
        .eq('season_id', seasonId)
        .eq('our_team_id', teamId)
        .order('date', { ascending: false })
        .range(from, to),
    ),
    fetchAllRows<unknown>((from, to) =>
      supabase
        .from('league_fixtures')
        .select('id, game_date, round, home_team_id, away_team_id, status')
        .eq('season_id', seasonId)
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .in('status', UPCOMING_STATUSES)
        .gte('game_date', today)
        .order('game_date', { ascending: true })
        .range(from, to),
    ),
  ]);

  return {
    games: toGames(gameRows),
    fixtures: toFixtures(fixtureRows, teamId, teams),
  };
}

/**
 * A mai nap ISO alakban, **helyi idő szerint**. A `toISOString()` UTC-ben
 * számol, ezért éjfél után kettővel korábbi napot adna vissza – a ma esti
 * meccs így kieshetne a közelgők közül.
 */
function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function aggregate(games: TeamGame[]): TeamAggregate {
  if (games.length === 0) return EMPTY_AGGREGATE;

  const totals = games.reduce(
    (acc, game) => ({
      scored: acc.scored + game.ourScore,
      conceded: acc.conceded + game.oppScore,
      wins: acc.wins + (game.result === 'win' ? 1 : 0),
    }),
    { scored: 0, conceded: 0, wins: 0 },
  );

  const played = games.length;
  return {
    played,
    wins: totals.wins,
    losses: played - totals.wins,
    avgScored: totals.scored / played,
    avgConceded: totals.conceded / played,
    avgDiff: (totals.scored - totals.conceded) / played,
  };
}

// --- Rendszerhatár: a Supabase válasza típusozatlan, itt validáljuk. ---

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isHomeAway(value: unknown): value is HomeAway {
  return value === 'home' || value === 'away';
}

function isResult(value: unknown): value is GameResult {
  return value === 'win' || value === 'loss';
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function toRound(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toGames(rows: unknown[]): TeamGame[] {
  return rows.flatMap((row: unknown) => {
    if (!isRecord(row)) return [];
    const { id, date, opponent, home_away, result } = row;
    if (typeof id !== 'string' || typeof date !== 'string') return [];
    if (!isHomeAway(home_away) || !isResult(result)) return [];

    return [
      {
        id,
        date,
        round: toRound(row.round),
        opponent: typeof opponent === 'string' ? opponent : 'Ismeretlen ellenfél',
        homeAway: home_away,
        ourScore: toNumber(row.our_score),
        oppScore: toNumber(row.opp_score),
        result,
      },
    ];
  });
}

function toFixtures(
  rows: unknown[],
  teamId: string,
  teams: { id: string; name: string }[],
): Fixture[] {
  const names = new Map(teams.map((team) => [team.id, team.name]));

  return rows.flatMap((row: unknown) => {
    if (!isRecord(row)) return [];
    const { id, game_date, home_team_id, away_team_id, status } = row;
    if (typeof id !== 'string' || typeof game_date !== 'string') return [];
    if (typeof home_team_id !== 'string' || typeof away_team_id !== 'string') return [];
    if (status !== 'scheduled' && status !== 'postponed') return [];

    const isHome = home_team_id === teamId;
    const opponentId = isHome ? away_team_id : home_team_id;

    return [
      {
        id,
        gameDate: game_date,
        round: toRound(row.round),
        homeTeamName: names.get(home_team_id) ?? 'Ismeretlen csapat',
        awayTeamName: names.get(away_team_id) ?? 'Ismeretlen csapat',
        isHome,
        opponentName: names.get(opponentId) ?? 'Ismeretlen csapat',
        status,
      },
    ];
  });
}
