/**
 * A „Ma" képernyő adatai egy helyen: élő mérkőzés, következő meccs, csapat
 * KPI-ok, forma és a legutóbbi meccs.
 *
 * Három hookot fog össze, egyik sincs itt saját lekérdezéssel újraírva:
 * - `useLiveGame('card')` – van-e éppen futó meccs, és ha igen, az állása,
 * - `useGameData` – meccsek és fixtures (innen jön a pont- és a kapottpont-átlag,
 *   a forma és a legutóbbi meccs),
 * - `usePlayerData` – szezon-aggregált játékossorok (innen a csapatszintű
 *   lepattanó- és eldobottlabda-átlag).
 *
 * Mindhárom hook szűrőpáronként cache-el vagy pollingol, és a `Játékosok` tab
 * ugyanazt a játékoslekérdezést használja – a képernyő tehát nem hoz be plusz
 * hálózati kört (D-040).
 */
import { useGameData } from '@/hooks/useGameData';
import { useLiveGame } from '@/hooks/useLiveGame';
import { usePlayerData } from '@/hooks/usePlayerData';
import type { Fixture, GameResult, TeamGame } from '@/types/games';
import type { LiveGameSummary } from '@/types/live';

/** Ennyi meccs látszik a forma-sávban. */
export const FORM_SIZE = 5;

/** A mockup négy csempéje – mind meccsenkénti átlag. */
export interface TeamKpis {
  scored: number;
  conceded: number;
  rebounds: number;
  turnovers: number;
}

export interface FormSummary {
  /** Időrendben, a legrégebbi elöl – balról jobbra ez olvasható haladásként. */
  results: GameResult[];
  wins: number;
  losses: number;
}

interface TodayData {
  /** A `null`, ha nincs futó meccs, vagy az imént véget ért (D-102, D-103). */
  live: LiveGameSummary | null;
  nextFixture: Fixture | null;
  lastGame: TeamGame | null;
  kpis: TeamKpis;
  form: FormSummary;
  /** Lejátszott meccsek a szezonban – nulla esetén nincs mit mutatni. */
  played: number;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const EMPTY_KPIS: TeamKpis = { scored: 0, conceded: 0, rebounds: 0, turnovers: 0 };
const EMPTY_FORM: FormSummary = { results: [], wins: 0, losses: 0 };

export function useTodayData(): TodayData {
  const games = useGameData();
  const players = usePlayerData();
  const live = useLiveGame('card');

  const played = games.teamStats.played;

  return {
    // Az élő hiba/betöltés szándékosan nem folyik bele a képernyő fő
    // `loading`/`error` mezőjébe: ha az élő lekérdezés elhasal (pl. a
    // `live_games` tábla még nem létezik), a Ma képernyő többi része ettől
    // még működjön. Véget ért meccsnél a kártya eltűnik a Ma képernyőről –
    // a teljes élő nézet ilyenkor is mutatja a végeredményt.
    live: live.live && live.live.status !== 'final' ? live.live : null,
    nextFixture: games.nextFixture,
    lastGame: games.lastGame,
    kpis:
      played > 0
        ? {
            scored: games.teamStats.avgScored,
            conceded: games.teamStats.avgConceded,
            // A csapat összes lepattanója és eldobott labdája a lejátszott
            // meccsek számával osztva – a játékosonkénti `games_played` itt
            // nem osztó, mert csapatszintű átlagot mutatunk.
            rebounds: sum(players.players.map((player) => player.rebounds.total)) / played,
            turnovers: sum(players.players.map((player) => player.turnovers)) / played,
          }
        : EMPTY_KPIS,
    form: summarizeForm(games.games),
    played,
    loading: games.loading || players.loading,
    error: games.error ?? players.error,
    reload: () => {
      games.reload();
      players.reload();
      live.reload();
    },
  };
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/** A `games` dátum szerint csökkenő – az utolsó öt visszafordítva lesz időrend. */
function summarizeForm(games: TeamGame[]): FormSummary {
  if (games.length === 0) return EMPTY_FORM;

  const results = games
    .slice(0, FORM_SIZE)
    .map((game) => game.result)
    .reverse();

  const wins = results.filter((result) => result === 'win').length;
  return { results, wins, losses: results.length - wins };
}
