/**
 * A „Ma" képernyő adatai egy helyen: következő meccs, csapat KPI-ok, forma és
 * a legutóbbi meccs.
 *
 * Két meglévő hookot fog össze, nem indít saját lekérdezést:
 * - `useGameData` – meccsek és fixtures (innen jön a pont- és a kapottpont-átlag,
 *   a forma és a legutóbbi meccs),
 * - `usePlayerData` – szezon-aggregált játékossorok (innen a csapatszintű
 *   lepattanó- és eldobottlabda-átlag).
 *
 * Mindkét hook szűrőpáronként cache-el, és a `Játékosok` tab ugyanezt a
 * játékoslekérdezést használja – a képernyő tehát nem hoz be plusz hálózati
 * kört (D-040).
 */
import { useGameData } from '@/hooks/useGameData';
import { usePlayerData } from '@/hooks/usePlayerData';
import type { Fixture, GameResult, TeamGame } from '@/types/games';

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

  const played = games.teamStats.played;

  return {
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
