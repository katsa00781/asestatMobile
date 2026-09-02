/**
 * Az Elemzés hub riportlistája – a három riporttábla egyetlen listában.
 *
 * A mobil app riportot **nem generál**: a `game_text_reports`,
 * `team_text_reports` és `player_text_reports` sorait közvetlen SELECT-tel
 * olvassa, ahogy a `CLAUDE.md` „Adat és Supabase szabályok" előírja.
 *
 * A három lekérdezés párhuzamosan fut, és szűrőpáronként (`szezon:csapat`)
 * cache-elődik. A meccsriportokon nincs `season_id` / `team_id` oszlop, ezért
 * ott a beágyazott `games!inner` sor szűr – így a lista nem függ attól, hogy a
 * Meccsek tab betöltött-e már (ugyanaz a megoldás, mint a `usePlayerDetails`
 * meccsbontásánál, D-052).
 *
 * Lapozás nincs: egy szezonban csapatonként néhány tucat riport van, a
 * PostgREST 1000 soros limitje elérhetetlen.
 */
import { useCallback } from 'react';

import { useCachedQuery } from '@/hooks/useCachedQuery';
import { useFilterData } from '@/hooks/useFilterData';
import { reportTypeLabel } from '@/data/report-kinds';
import { formatDate } from '@/lib/format';
import { reportSummary } from '@/lib/report-format';
import { createQueryCache, filterKey } from '@/lib/query-cache';
import { supabase } from '@/lib/supabase';
import { useFilterStore } from '@/store/filterStore';
import type { Team } from '@/types/filters';
import type { AnalysisReport } from '@/types/analysis';

interface ReportsPayload {
  reports: AnalysisReport[];
}

interface AnalysisReportsResult extends ReportsPayload {
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const EMPTY_PAYLOAD: ReportsPayload = { reports: [] };

const cache = createQueryCache<ReportsPayload>();

/** A lekérdezésekhez szükséges, szűrőből származó keret. */
interface ReportContext {
  seasonId: string;
  seasonName: string;
  teamId: string;
  /** A saját csapat rövid neve a címekben. */
  ownName: string;
  /** Teljes név → rövid név, az ellenfelek címéhez. */
  shortNames: Map<string, string>;
}

export function useAnalysisReports(): AnalysisReportsResult {
  const hydrated = useFilterStore((state) => state.hydrated);
  const seasonId = useFilterStore((state) => state.selectedSeasonId);
  const teamId = useFilterStore((state) => state.selectedTeamId);

  // A címekhez a csapatok rövid neve kell, ezért a szűrőlistákra is várunk.
  const {
    teams,
    selectedSeason,
    selectedTeam,
    error: filterError,
    reload: reloadFilter,
  } = useFilterData();

  const context =
    hydrated && seasonId && teamId && selectedSeason && selectedTeam
      ? {
          seasonId,
          seasonName: selectedSeason.name,
          teamId,
          ownName: selectedTeam.shortName,
          shortNames: shortNames(teams),
        }
      : null;

  const { data, loading, error, reload: reloadReports } = useCachedQuery({
    cache,
    key: context ? filterKey(context.seasonId, context.teamId) : null,
    // Csak `key !== null` esetén hívódik meg; a guard a típusszűkítésért van.
    fetcher: () => (context ? fetchReports(context) : Promise.resolve(EMPTY_PAYLOAD)),
    empty: EMPTY_PAYLOAD,
    errorLabel: 'A riportok betöltése sikertelen',
  });

  const reload = useCallback(() => {
    reloadFilter();
    reloadReports();
  }, [reloadFilter, reloadReports]);

  return {
    reports: data.reports,
    loading: filterError === null && loading,
    error: filterError ?? error,
    reload,
  };
}

function shortNames(teams: Team[]): Map<string, string> {
  return new Map(teams.map((team) => [team.name, team.shortName]));
}

async function fetchReports(context: ReportContext): Promise<ReportsPayload> {
  const [gameResult, teamResult, playerResult] = await Promise.all([
    supabase
      .from('game_text_reports')
      .select(
        'id, report_type, narrative, generated_at, ' +
          'games!inner(date, opponent, our_score, opp_score, result, season_id, our_team_id)',
      )
      .eq('games.season_id', context.seasonId)
      .eq('games.our_team_id', context.teamId),
    supabase
      .from('team_text_reports')
      .select('id, report_type, narrative, generated_at')
      .eq('season_id', context.seasonId)
      .eq('team_id', context.teamId),
    supabase
      .from('player_text_reports')
      .select('id, report_type, narrative, generated_at, players!inner(name)')
      .eq('season_id', context.seasonId)
      .eq('team_id', context.teamId),
  ]);

  if (gameResult.error) throw new Error(gameResult.error.message);
  if (teamResult.error) throw new Error(teamResult.error.message);
  if (playerResult.error) throw new Error(playerResult.error.message);

  const reports = [
    ...toGameReports(gameResult.data, context),
    ...toTeamReports(teamResult.data, context),
    ...toPlayerReports(playerResult.data, context),
  ];

  // Egyetlen, összefésült lista: a legfrissebb riport áll elöl, fajtától
  // függetlenül – a fajta szerinti szűrést a hub chipsora végzi.
  reports.sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));

  return { reports };
}

// --- Rendszerhatár: a Supabase válasza típusozatlan, itt validáljuk. ---

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** A beágyazott sor a PostgREST-től objektumként és tömbként is jöhet. */
function toEmbedded(value: unknown): Record<string, unknown> | null {
  const row = Array.isArray(value) ? value[0] : value;
  return isRecord(row) ? row : null;
}

/** A riport váza: azonosító és nem üres szöveg nélkül nincs mit mutatni. */
function toBase(
  row: unknown,
): { id: string; narrative: string; summary: string; generatedAt: string } | null {
  if (!isRecord(row) || typeof row.id !== 'string') return null;
  if (typeof row.narrative !== 'string' || row.narrative.trim() === '') return null;

  const narrative = row.narrative.trim();

  return {
    id: row.id,
    narrative,
    summary: reportSummary(narrative),
    generatedAt: toText(row.generated_at),
  };
}

function toGameReports(rows: unknown, context: ReportContext): AnalysisReport[] {
  if (!Array.isArray(rows)) return [];

  return rows.flatMap((row: unknown) => {
    const base = toBase(row);
    const game = isRecord(row) ? toEmbedded(row.games) : null;
    if (!base || !game) return [];

    const opponent = toText(game.opponent);
    const short = context.shortNames.get(opponent) ?? opponent;
    const won = game.result === 'win';

    return [
      {
        ...base,
        kind: 'game' as const,
        typeLabel: reportTypeLabel('game', isRecord(row) ? row.report_type : null),
        title: `${context.ownName} — ${short}`,
        subtitle: `${formatDate(toText(game.date))} · ${won ? 'Nyert' : 'Vesztett'} ${toNumber(
          game.our_score,
        )}–${toNumber(game.opp_score)}`,
      },
    ];
  });
}

function toTeamReports(rows: unknown, context: ReportContext): AnalysisReport[] {
  if (!Array.isArray(rows)) return [];

  return rows.flatMap((row: unknown) => {
    const base = toBase(row);
    if (!base) return [];

    return [
      {
        ...base,
        kind: 'team' as const,
        typeLabel: reportTypeLabel('team', isRecord(row) ? row.report_type : null),
        title: `${context.ownName} · ${context.seasonName} szezonértékelés`,
        subtitle: `${context.seasonName} · csapatelemzés`,
      },
    ];
  });
}

function toPlayerReports(rows: unknown, context: ReportContext): AnalysisReport[] {
  if (!Array.isArray(rows)) return [];

  return rows.flatMap((row: unknown) => {
    const base = toBase(row);
    const player = isRecord(row) ? toEmbedded(row.players) : null;
    if (!base || !player) return [];

    const name = toText(player.name);
    if (name === '') return [];

    return [
      {
        ...base,
        kind: 'player' as const,
        typeLabel: reportTypeLabel('player', isRecord(row) ? row.report_type : null),
        title: `${name} · szezonértékelés`,
        subtitle: `${context.seasonName} · játékoselemzés`,
      },
    ];
  });
}
