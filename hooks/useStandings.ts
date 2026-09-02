/**
 * A kiválasztott szezon bajnoki tabellája – a legfrissebb forduló állása.
 *
 * A `standings` tábla soronként egy teljes tabellaállást tárol JSON tömbben
 * (`matchday`, `date`, `data`). A hook a szezon **legmagasabb fordulószámú**
 * sorát kéri le, ahogy a webes `StandingsView` is – forduló-választó a mobilon
 * nincs, a mockup is csak az aktuális állást mutatja.
 *
 * A tabella nem csapatfüggő, ezért a cache kulcsa **csak a szezon** – a szűrő
 * csapatváltása nem indít új lekérdezést, csak a kiemelt sor változik.
 *
 * Két adatoldali sajátosságot itt kezelünk (a mobil app csak olvas, javítani
 * nem tud): a legfrissebb sorban minden csapat kétszer szerepel (D-057), és a
 * régi importok `season_id` nélkül kerültek be – azokat nem vesszük elő
 * (D-060).
 */
import { useCallback } from 'react';

import { useCachedQuery } from '@/hooks/useCachedQuery';
import { useFilterData } from '@/hooks/useFilterData';
import { teamAbbreviation } from '@/lib/format';
import { createQueryCache } from '@/lib/query-cache';
import { normalizeText } from '@/lib/search';
import { supabase } from '@/lib/supabase';
import { useFilterStore } from '@/store/filterStore';
import type { Team } from '@/types/filters';
import type { StandingsTable, StandingsTeam } from '@/types/standings';

interface StandingsPayload {
  /** `null`, ha ehhez a szezonhoz nincs rögzített tabella. */
  table: StandingsTable | null;
}

interface StandingsResult extends StandingsPayload {
  /** A szűrőben kiválasztott szezon neve az alcímhez. */
  seasonName: string | null;
  /** A kiemelendő sor csapata – a szűrő aktuális választása. */
  ownTeamId: string | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const EMPTY_PAYLOAD: StandingsPayload = { table: null };

const cache = createQueryCache<StandingsPayload>();

export function useStandings(): StandingsResult {
  const hydrated = useFilterStore((state) => state.hydrated);
  const seasonId = useFilterStore((state) => state.selectedSeasonId);
  const teamId = useFilterStore((state) => state.selectedTeamId);

  // A megjelenített nevek és a badge jele a csapatlistából jönnek, ezért arra
  // is várunk – ugyanúgy, ahogy a `useGameData` a fixture-ök neveire.
  const {
    teams,
    selectedSeason,
    error: filterError,
    reload: reloadFilter,
  } = useFilterData();

  const canFetch = hydrated && teams.length > 0 && seasonId !== null;

  const { data, loading, error, reload: reloadStandings } = useCachedQuery({
    cache,
    key: canFetch && seasonId ? seasonId : null,
    // Csak `key !== null` esetén hívódik meg; a guard a típusszűkítésért van.
    fetcher: () => (seasonId ? fetchStandings(seasonId, teams) : Promise.resolve(EMPTY_PAYLOAD)),
    empty: EMPTY_PAYLOAD,
    errorLabel: 'A tabella betöltése sikertelen',
  });

  const reload = useCallback(() => {
    reloadFilter();
    reloadStandings();
  }, [reloadFilter, reloadStandings]);

  return {
    table: data.table,
    seasonName: selectedSeason?.name ?? null,
    ownTeamId: teamId,
    // Ha a csapatlista elhasalt, nincs mire várni – különben a képernyő örökre
    // töltésben ragadna egy olyan kérésre, ami el sem indul.
    loading: filterError === null && loading,
    error: error ?? filterError,
    reload,
  };
}

async function fetchStandings(seasonId: string, teams: Team[]): Promise<StandingsPayload> {
  // Egy szezonhoz néhány tucat sor tartozik, ebből egy kell: lapozás nem
  // szükséges, a rendezést és a szűkítést a PostgREST végzi.
  const { data, error } = await supabase
    .from('standings')
    .select('matchday, date, data')
    .eq('season_id', seasonId)
    .order('matchday', { ascending: false })
    .order('date', { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);

  return { table: toTable(Array.isArray(data) ? data[0] : null, teams) };
}

// --- Rendszerhatár: a Supabase válasza típusozatlan, itt validáljuk. ---

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toInteger(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 0;
}

function toTable(row: unknown, teams: Team[]): StandingsTable | null {
  if (!isRecord(row)) return null;

  const { matchday, date, data } = row;
  if (typeof date !== 'string' || !Array.isArray(data)) return null;

  const rows = toTeams(data, teams);
  if (rows.length === 0) return null;

  return { matchday: toInteger(matchday), date, teams: rows };
}

function toTeams(rows: unknown[], teams: Team[]): StandingsTeam[] {
  const byName = new Map(teams.map((team) => [normalizeText(team.name), team]));
  // A legfrissebb importban minden csapat kétszer szerepel, azonos értékekkel:
  // helyezésenként az elsőt tartjuk meg (D-057).
  const seen = new Set<number>();

  const parsed = rows.flatMap((row: unknown): StandingsTeam[] => {
    if (!isRecord(row) || typeof row.team !== 'string') return [];

    const position = toInteger(row.position);
    if (position <= 0 || seen.has(position)) return [];
    seen.add(position);

    const team = byName.get(normalizeText(row.team)) ?? null;
    const scored = toInteger(row.scored);
    const conceded = toInteger(row.conceded);

    return [
      {
        teamId: team?.id ?? null,
        position,
        name: team?.shortName ?? row.team,
        abbr: teamAbbreviation(team?.name ?? row.team, team?.shortName ?? row.team),
        played: toInteger(row.matches),
        wins: toInteger(row.wins),
        losses: toInteger(row.losses),
        diff: scored - conceded,
        points: toInteger(row.points),
      },
    ];
  });

  return parsed.sort((a, b) => a.position - b.position);
}
