/**
 * Élő mérkőzés – a `live_games`, `live_player_lines` és `live_quarter_scores`
 * táblák periodikus lekérdezése.
 *
 * Ez **nem** a `useCachedQuery` mintáját követi: az a hook TTL nélküli,
 * „egyszer töltünk" cache-re épül (`lib/query-cache.ts`, D-026), ami élő
 * adatra rossz volna. Itt saját idővonal fut, két kapuval:
 *
 * - `useIsFocused()` – másik tabon nincs kérés, ugyanaz az elv, mint a
 *   `useCachedQuery`-ben (D-027).
 * - `AppState` – háttérben leáll az idővonal, előtérbe térve azonnal frissít,
 *   a `store/authStore.ts` token-frissítési mintája szerint.
 *
 * Realtime helyett polling fut, mert a forrás gyűjtője maga is percenkénti
 * cronon ír – a Realtime azonnaliságának itt nincs mit kiszolgálnia, viszont
 * csatorna-életciklust és publication-konfigurációt hozna egy olyan séma fölé,
 * ami élesben csak 2026-09-25-én validálható (D-103).
 *
 * `mode: 'card'` csak az állást kéri (a Ma-kártyához, ritkábban), `mode:
 * 'full'` a box score-t és a negyedeket is (a teljes nézethez, sűrűbben).
 */
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useIsFocused } from 'expo-router';

import { describeError } from '@/hooks/useCachedQuery';
import { supabase } from '@/lib/supabase';
import { useFilterStore } from '@/store/filterStore';
import type { HomeAway, PlayerGameLine, QuarterScore } from '@/types/games';
import type { LiveGameDetails, LiveGameSummary, LiveStatus } from '@/types/live';

/** A Ma-kártya csak az állást kéri – ritkábban, mert kevesebb a tartalom. */
const POLL_MS_CARD = 60_000;
/** A teljes nézet box score-t és negyedeket is kér. */
const POLL_MS_FULL = 20_000;

/** Ezekben az állapotokban van értelme továbbfrissíteni. */
const ACTIVE_STATUSES: LiveStatus[] = ['live', 'halftime'];

interface UseLiveGameResult<T> {
  live: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useLiveGame(mode: 'card'): UseLiveGameResult<LiveGameSummary>;
export function useLiveGame(mode: 'full'): UseLiveGameResult<LiveGameDetails>;
export function useLiveGame(
  mode: 'card' | 'full',
): UseLiveGameResult<LiveGameSummary | LiveGameDetails> {
  const hydrated = useFilterStore((state) => state.hydrated);
  const seasonId = useFilterStore((state) => state.selectedSeasonId);
  const teamId = useFilterStore((state) => state.selectedTeamId);

  const [live, setLive] = useState<LiveGameSummary | LiveGameDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const focused = useIsFocused();
  const pollMs = mode === 'full' ? POLL_MS_FULL : POLL_MS_CARD;

  // A szűrő és a mód minden renderben új closure-t zárna körbe az effectben –
  // ezért a friss értékek egy refben ülnek, az effect maga csak a kulcsokra
  // (szezon, csapat, fókusz, mód) reagál. Ugyanez a minta, mint a
  // `useCachedQuery` `fetcherRef`-je. A friss eredményt a hívó `tick` a
  // visszatérési értékből olvassa, nem `setLive` utáni újraolvasással – a
  // kettő között React állapotfrissítés-ütemezési verseny lenne.
  const fetchRef = useRef<() => Promise<LiveGameSummary | LiveGameDetails | null | undefined>>(
    async () => undefined,
  );

  useEffect(() => {
    fetchRef.current = async () => {
      if (!seasonId || !teamId) return undefined;

      try {
        const result =
          mode === 'full'
            ? await fetchLiveDetails(seasonId, teamId)
            : await fetchLiveSummary(seasonId, teamId);
        setLive(result);
        setError(null);
        return result;
      } catch (err: unknown) {
        setError(describeError(err, 'Az élő mérkőzés betöltése sikertelen'));
        return undefined;
      } finally {
        setLoading(false);
      }
    };
  });

  // Szezon- vagy csapatváltáskor az előző csapat élő meccse idegen adat lenne
  // az újhoz képest – nullázzuk, amíg az új kulcshoz nem jön válasz. Ugyanez
  // az elv, mint a `useCachedQuery`-nél: „kulcsváltásig nem mutat idegen adatot".
  useEffect(() => {
    setLive(null);
    setLoading(true);
    setError(null);
  }, [seasonId, teamId]);

  useEffect(() => {
    if (!hydrated || !seasonId || !teamId || !focused) return;

    // Új idővonal-indításkor (reload gomb, fókuszba térés) a korábbi hiba ne
    // ragadjon bent, amíg az első friss válasz meg nem érkezik.
    setError(null);

    let timer: ReturnType<typeof setInterval> | null = null;
    // Véget ért meccsnél egy utolsó frissítés után az idővonal leáll – a
    // végleges állás nem változik, a folytatás csak felesleges kérés lenne.
    let stopped = false;

    const tick = async () => {
      const result = await fetchRef.current();
      if (stopped || !timer) return;
      if (result && !ACTIVE_STATUSES.includes(result.status)) {
        clearInterval(timer);
        timer = null;
      }
    };

    void tick();
    timer = setInterval(tick, pollMs);

    // A token-automatikus-frissítés mintája (`store/authStore.ts`): háttérben
    // nincs hálózati hívás, előtérbe térve azonnali frissítés, nem a következő
    // ciklusig várva.
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void tick();
        if (!timer) timer = setInterval(tick, pollMs);
      } else if (timer) {
        clearInterval(timer);
        timer = null;
      }
    });

    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
      appStateSubscription.remove();
    };
  }, [hydrated, seasonId, teamId, focused, pollMs, attempt]);

  return {
    live,
    // Kulcs (szezon/csapat) híján, vagy hidratálás előtt is töltés van, hogy
    // egy pillanatra se villanjon fel „nincs élő mérkőzés".
    loading: (!hydrated || !seasonId || !teamId || loading) && error === null,
    error,
    reload: () => {
      setError(null);
      setAttempt((value) => value + 1);
    },
  };
}

async function fetchLiveSummary(seasonId: string, teamId: string): Promise<LiveGameSummary | null> {
  const { data, error } = await supabase
    .from('live_games')
    .select(
      'id, status, home_team_id, away_team_id, home_team_name, away_team_name, ' +
        'home_score, away_score, period, clock, updated_at',
    )
    .eq('season_id', seasonId)
    // A `teamId` a `filterStore`-ból jövő UUID, nem felhasználói szövegbevitel
    // – ugyanez a `.or()` minta fut a `hooks/useGameData.ts` fixtures lekérdezésében.
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .in('status', ['live', 'halftime', 'final'])
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);
  return toSummary(data, teamId);
}

async function fetchLiveDetails(seasonId: string, teamId: string): Promise<LiveGameDetails | null> {
  const summary = await fetchLiveSummary(seasonId, teamId);
  if (!summary) return null;

  const [linesResult, quarterResult] = await Promise.all([
    supabase
      .from('live_player_lines')
      .select(
        'id, team_side, player_name, number, minutes, points, close_made, close_attempted, ' +
          'mid_made, mid_attempted, three_made, three_attempted, free_throw_made, ' +
          'free_throw_attempted, total_rebounds, assists, steals, blocks, turnovers, ' +
          'fouls_committed, valuation',
      )
      .eq('live_game_id', summary.id)
      .order('points', { ascending: false }),
    supabase
      .from('live_quarter_scores')
      .select('team_side, quarter, points, cumulative_points')
      .eq('live_game_id', summary.id)
      .order('quarter', { ascending: true }),
  ]);

  if (linesResult.error) throw new Error(linesResult.error.message);
  if (quarterResult.error) throw new Error(quarterResult.error.message);

  return {
    ...summary,
    boxScore: toBoxScore(linesResult.data, summary.homeAway),
    quarters: toQuarters(quarterResult.data, summary.homeAway),
  };
}

// --- Rendszerhatár: a Supabase válasza típusozatlan, itt validáljuk. ---

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isLiveStatus(value: unknown): value is LiveStatus {
  return value === 'scheduled' || value === 'live' || value === 'halftime' || value === 'final';
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function toSummary(rows: unknown, teamId: string): LiveGameSummary | null {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const row = rows[0];
  if (!isRecord(row)) return null;

  const { id, home_team_id, away_team_id, status, updated_at } = row;
  if (typeof id !== 'string') return null;
  if (typeof home_team_id !== 'string' || typeof away_team_id !== 'string') return null;
  if (!isLiveStatus(status)) return null;

  const homeAway: HomeAway = home_team_id === teamId ? 'home' : 'away';
  const opponentName = homeAway === 'home' ? row.away_team_name : row.home_team_name;

  const homeScore = toNumber(row.home_score);
  const awayScore = toNumber(row.away_score);

  return {
    id,
    status,
    homeAway,
    opponent: typeof opponentName === 'string' ? opponentName : 'Ismeretlen ellenfél',
    ourScore: homeAway === 'home' ? homeScore : awayScore,
    oppScore: homeAway === 'home' ? awayScore : homeScore,
    period: toNumber(row.period),
    clock: typeof row.clock === 'string' ? row.clock : null,
    updatedAt: typeof updated_at === 'string' ? updated_at : new Date().toISOString(),
  };
}

/**
 * Csak a saját csapatunk sorai – ugyanaz a konvenció, mint a lejátszott
 * meccsek box score-jánál: a statisztikatábla `game_id`-je is csapat-
 * perspektíva-specifikus, itt a `team_side` szűri ugyanezt.
 *
 * NINCS `minutes <= 0` szűrés (a lejátszott meccsek box score-jával
 * ellentétben): a gyűjtő a percek kiszámítását v1-ben nem oldja meg, minden
 * sor `minutes: 0`-val érkezik (lásd asestats HOWTO-live-scan.md). Egy sor
 * puszta létezése már azt jelenti, hogy a játékosnak volt rögzített
 * eseménye – a percalapú szűrés itt mindent kiszűrne.
 */
function toBoxScore(rows: unknown, homeAway: HomeAway): PlayerGameLine[] {
  if (!Array.isArray(rows)) return [];

  return rows.flatMap((row: unknown) => {
    if (!isRecord(row)) return [];
    const { id, team_side, player_name } = row;
    if (typeof id !== 'string' || typeof player_name !== 'string') return [];
    if (team_side !== homeAway) return [];

    return [
      {
        // A `live_player_lines` sor saját id-ja: a `player_id` a forrásban
        // gyakran fel sem oldható meglévő `players` sorra (D-106).
        playerId: id,
        name: player_name,
        number: toNumber(row.number),
        minutes: toNumber(row.minutes),
        points: toNumber(row.points),
        twoMade: toNumber(row.close_made) + toNumber(row.mid_made),
        twoAttempted: toNumber(row.close_attempted) + toNumber(row.mid_attempted),
        threeMade: toNumber(row.three_made),
        threeAttempted: toNumber(row.three_attempted),
        freeThrowMade: toNumber(row.free_throw_made),
        freeThrowAttempted: toNumber(row.free_throw_attempted),
        rebounds: toNumber(row.total_rebounds),
        assists: toNumber(row.assists),
        steals: toNumber(row.steals),
        blocks: toNumber(row.blocks),
        turnovers: toNumber(row.turnovers),
        fouls: toNumber(row.fouls_committed),
        valuation: toNumber(row.valuation),
      },
    ];
  });
}

function toQuarters(rows: unknown, homeAway: HomeAway): QuarterScore[] {
  if (!Array.isArray(rows)) return [];

  const ourPoints = new Map<number, number>();
  const oppPoints = new Map<number, number>();

  rows.forEach((row: unknown) => {
    if (!isRecord(row)) return;
    const quarter = toNumber(row.quarter);
    if (quarter <= 0) return;

    if (row.team_side === homeAway) ourPoints.set(quarter, toNumber(row.points));
    else if (row.team_side === 'home' || row.team_side === 'away') {
      oppPoints.set(quarter, toNumber(row.points));
    }
  });

  // Mindkét oldal hiánya esetén nincs mit mutatni – fél táblát ne rajzoljunk
  // (ugyanaz az elv, mint `hooks/useGameDetails.ts` `toQuarters()`-ében).
  if (ourPoints.size === 0 || oppPoints.size === 0) return [];

  const quarters = [...new Set([...ourPoints.keys(), ...oppPoints.keys()])].sort((a, b) => a - b);

  return quarters.map((quarter) => ({
    quarter,
    ourPoints: ourPoints.get(quarter) ?? 0,
    oppPoints: oppPoints.get(quarter) ?? 0,
  }));
}
