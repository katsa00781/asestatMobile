/**
 * Egy `games` sor ellenfelének feloldása a szűrő csapatlistájára.
 *
 * Az ellenfél azonosítása a `games.opponent_team_id`-n megy. A
 * `games.opponent` szöveg a meccs kori nevet őrzi, ami klub-átnevezés után
 * már nem egyezik a `teams.name`-mel – ezért a név csak az ID nélküli
 * sorokra tartalék, ugyanúgy, mint a webprojektben (D-119).
 */
import { normalizeText } from '@/lib/search';
import type { Team } from '@/types/filters';

export function findOpponentTeam(
  teams: Team[],
  opponentTeamId: string | null,
  opponentName: string,
): Team | null {
  if (opponentTeamId) return teams.find((team) => team.id === opponentTeamId) ?? null;

  const needle = normalizeText(opponentName);
  const match = teams.find(
    (team) => normalizeText(team.name) === needle || normalizeText(team.shortName) === needle,
  );

  return match ?? null;
}
