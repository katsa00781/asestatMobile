/**
 * A szűrő választható listái: szezonok és csapatok.
 *
 * A `filterStore` csak azonosítót tárol – a nevek és a választható elemek innen
 * jönnek. A hook egyben gondoskodik arról, hogy a store mindig **érvényes**
 * azonosítót tartalmazzon: ha nincs mentett választás, vagy a mentett elem
 * időközben eltűnt az adatbázisból, alapértelmezésre esik vissza.
 *
 * A két lista az app élettartamára cache-elődik (modulszintű ígéret), mert a
 * szezonok és a csapatok ritkán változnak, viszont több képernyő is kéri őket.
 * A `reload()` a hibapanel újrapróbálás gombjának való.
 */
import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { useFilterStore } from '@/store/filterStore';
import type { Season, Team } from '@/types/filters';

/**
 * A saját csapatunk neve, ha az adatbázisban egyetlen sornál sincs bekapcsolva
 * az `is_primary`. Csak tartalék: az `is_primary` mindig erősebb nála.
 */
const OWN_TEAM_NAMES = ['atomerőmű se', 'ase'];

interface FilterData {
  seasons: Season[];
  teams: Team[];
}

let cachedRequest: Promise<FilterData> | null = null;

export function useFilterData() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const hydrated = useFilterStore((state) => state.hydrated);
  const selectedSeasonId = useFilterStore((state) => state.selectedSeasonId);
  const selectedTeamId = useFilterStore((state) => state.selectedTeamId);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    loadFilterData()
      .then((data) => {
        if (!active) return;
        setSeasons(data.seasons);
        setTeams(data.teams);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const message = err instanceof Error ? err.message : 'Ismeretlen hiba';
        setError(`A szűrők betöltése sikertelen: ${message}`);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  // Az alapértelmezés beállítása megvárja a store visszaolvasását, különben
  // felülírná a felhasználó korábban mentett választását.
  useEffect(() => {
    if (!hydrated) return;
    const { selectedSeasonId: seasonId, selectedTeamId: teamId, setSeason, setTeam } =
      useFilterStore.getState();

    if (seasons.length > 0 && !seasons.some((season) => season.id === seasonId)) {
      setSeason(defaultSeason(seasons).id);
    }
    if (teams.length > 0 && !teams.some((team) => team.id === teamId)) {
      setTeam(defaultTeam(teams).id);
    }
  }, [hydrated, seasons, teams]);

  const reload = useCallback(() => {
    cachedRequest = null;
    setAttempt((value) => value + 1);
  }, []);

  return {
    seasons,
    teams,
    selectedSeason: seasons.find((season) => season.id === selectedSeasonId) ?? null,
    selectedTeam: teams.find((team) => team.id === selectedTeamId) ?? null,
    loading,
    error,
    reload,
  };
}

function loadFilterData(): Promise<FilterData> {
  if (!cachedRequest) {
    cachedRequest = fetchFilterData().catch((err: unknown) => {
      // A sikertelen kérés ne ragadjon bent a cache-ben, különben a
      // `reload()` ugyanazt a hibát adná vissza örökre.
      cachedRequest = null;
      throw err;
    });
  }
  return cachedRequest;
}

async function fetchFilterData(): Promise<FilterData> {
  // Nincs lapozás: néhány szezon és néhány tucat csapat van, a PostgREST
  // 1000 soros limitje itt nem érhető el.
  const [seasonsResult, teamsResult] = await Promise.all([
    supabase.from('seasons').select('id, name, is_current').order('start_date', { ascending: false }),
    supabase
      .from('teams')
      .select('id, name, short_name, is_primary')
      .order('is_primary', { ascending: false })
      .order('name'),
  ]);

  if (seasonsResult.error) throw new Error(seasonsResult.error.message);
  if (teamsResult.error) throw new Error(teamsResult.error.message);

  return {
    seasons: toSeasons(seasonsResult.data),
    teams: toTeams(teamsResult.data),
  };
}

/** A futó szezon, egyébként a legfrissebb (a lekérdezés `start_date` szerint rendez). */
function defaultSeason(seasons: Season[]): Season {
  return seasons.find((season) => season.isCurrent) ?? seasons[0];
}

/**
 * A saját csapatunk: elsősorban az adatbázis `is_primary` jelölése, tartalékként
 * névegyezés, végül a lista első eleme. Lásd docs/feature-tasks.md – D-013.
 */
function defaultTeam(teams: Team[]): Team {
  return (
    teams.find((team) => team.isPrimary) ??
    teams.find(
      (team) =>
        OWN_TEAM_NAMES.includes(team.name.toLowerCase()) ||
        OWN_TEAM_NAMES.includes(team.shortName.toLowerCase()),
    ) ??
    teams[0]
  );
}

// --- Rendszerhatár: a Supabase válasza típusozatlan, itt validáljuk. ---

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toSeasons(rows: unknown): Season[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row: unknown) => {
    if (!isRecord(row) || typeof row.id !== 'string' || typeof row.name !== 'string') return [];
    return [{ id: row.id, name: row.name, isCurrent: row.is_current === true }];
  });
}

function toTeams(rows: unknown): Team[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row: unknown) => {
    if (!isRecord(row) || typeof row.id !== 'string' || typeof row.name !== 'string') return [];
    return [
      {
        id: row.id,
        name: row.name,
        shortName: typeof row.short_name === 'string' ? row.short_name : row.name,
        isPrimary: row.is_primary === true,
      },
    ];
  });
}
