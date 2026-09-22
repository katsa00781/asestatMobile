/**
 * Igazolások megjelenítési modell – a `league_player_movements` sorokból a
 * képernyő csempéi, szekciói és sorai.
 *
 * Design prompt: `docs/design-prompts.md` – P15.
 *
 * A számolást (`movementSummary`, `groupPlayerMovements`) és a profil-URL
 * ellenőrzését a `@core/player-movements` végzi – itt csak magyar felirat,
 * badge-variáns és sorrend készül. Egyetlen átlag vagy százalék sincs a
 * képernyőn: az igazolás tény, nem statisztika.
 */
import {
  groupPlayerMovements,
  movementSummary,
  playerProfileUrl,
  type PlayerMovement,
} from '@core/player-movements';
import type { BadgeVariant } from '@/components/Badge';
import type {
  MovementEntry,
  MovementSection,
  MovementTile,
  MovementsView,
} from '@/types/movements';

interface MovementsViewInput {
  rows: PlayerMovement[];
  /** A célszezon neve a szűrőből – a sorok hiányakor is kell az irány-sávhoz. */
  seasonName: string | null;
  /** Az előző szezon neve a szezonlistából, ha a sorokból nem derül ki. */
  previousSeasonName: string | null;
  /** Csapatnézetben a kiválasztott csapat neve. */
  teamName: string | null;
  /** Liga nézetben a követett csapatok száma. */
  teamCount: number;
  /** Liga nézet: üres csapatszűrő, csapatonként csoportosított lista. */
  league: boolean;
}

/** A besorolás felirata – a web `movementLabel()` mobil párja, rövidítve. */
function movementLabel(row: PlayerMovement): string {
  if (row.movement_type === 'domestic_transfer') return 'Hazai váltás';
  if (row.movement_type === 'return') return 'Visszatérés';
  return 'Ismeretlen';
}

const BADGES: Record<PlayerMovement['movement_type'], BadgeVariant> = {
  domestic_transfer: 'positive',
  return: 'ai',
  unknown: 'neutral',
};

/** Honnan / hová. Ismeretlennél a hiány kimondva, nem üres cella. */
function counterpartText(row: PlayerMovement): string {
  if (row.counterpart_team_names.length > 0) return row.counterpart_team_names.join(', ');
  if (row.movement_type === 'return') {
    return `${row.gap_seasons} szezon kihagyás`;
  }
  return 'Nincs adat';
}

function toEntry(row: PlayerMovement): MovementEntry {
  return {
    id: row.id,
    name: row.display_name,
    position: row.position,
    direction: row.direction,
    label: movementLabel(row),
    badge: BADGES[row.movement_type],
    counterpart: counterpartText(row),
    profileUrl: playerProfileUrl(row.profile_url),
  };
}

/**
 * Névsor. A view `id` szerint érkezik (importálási sorrend), ami a
 * felhasználónak semmit nem mond – a weben is névsorban áll a táblázat.
 */
function byName(rows: PlayerMovement[]): PlayerMovement[] {
  return [...rows].sort((a, b) => a.display_name.localeCompare(b.display_name, 'hu'));
}

function tiles(rows: PlayerMovement[]): MovementTile[] {
  const summary = movementSummary(rows);

  return [
    { label: 'Érkezők', value: String(summary.arrivals), accent: 'cyan' },
    { label: 'Távozók', value: String(summary.departures), accent: 'orange' },
    { label: 'Hazai váltásból', value: String(summary.domestic), accent: 'positive' },
    { label: 'Visszatérő', value: String(summary.returns), accent: 'ai' },
    { label: 'Ismeretlen célba', value: String(summary.unknownDepartures), accent: 'orange', wide: true },
  ];
}

/** Csapatnézet: két szekció, érkezők és távozók. */
function directionSections(rows: PlayerMovement[]): MovementSection[] {
  const arrivals = byName(rows.filter((row) => row.direction === 'arrival'));
  const departures = byName(rows.filter((row) => row.direction === 'departure'));

  return [
    {
      key: 'arrival',
      title: 'Érkezők',
      direction: 'arrival',
      count: `(${arrivals.length})`,
      balance: null,
      data: arrivals.map(toEntry),
    },
    {
      key: 'departure',
      title: 'Távozók',
      direction: 'departure',
      count: `(${departures.length})`,
      balance: null,
      data: departures.map(toEntry),
    },
  ];
}

/** Liga nézet: csapatonként egy szekció, a csoporton belül előbb az érkezők. */
function teamSections(rows: PlayerMovement[]): MovementSection[] {
  return groupPlayerMovements(rows).map((group) => ({
    key: group.teamId,
    title: group.teamName,
    direction: null,
    count: '',
    balance: {
      arrivals: String(group.arrivals.length),
      departures: String(group.departures.length),
    },
    data: [...byName(group.arrivals), ...byName(group.departures)].map(toEntry),
  }));
}

export function buildMovementsView({
  rows,
  seasonName,
  previousSeasonName,
  teamName,
  teamCount,
  league,
}: MovementsViewInput): MovementsView {
  // Az előző szezon neve magukban a sorokban is benne van; a szezonlistából
  // számolt név csak akkor kell, ha egyetlen mozgás sincs.
  const previous = rows[0]?.previous_season_name ?? previousSeasonName;

  return {
    fromSeason: previous ?? '',
    toSeason: seasonName ?? '',
    scope: league ? `${teamCount} követett csapat` : (teamName ?? ''),
    total: `${rows.length} mozgás`,
    tiles: tiles(rows),
    sections: league ? teamSections(rows) : directionSections(rows),
    league,
  };
}
