/**
 * A játékoslista rendezési szempontjai – a `Jatekosok Lista` mockup öt chipje.
 *
 * Egy szempont egyben oszlopfelirat is: a lista három numerikus oszlopa közül
 * az utolsó helyére lép az éppen aktív rendezés, ha az nem a látható három
 * (pont / lepattanó / gólpassz) valamelyike. Így a felhasználó mindig látja
 * azt a számot, ami szerint a sorrend áll – lásd `docs/feature-tasks.md` D-050.
 */
import type { SeasonPlayer } from '@/types/players';

export type PlayerSortKey = 'points' | 'rebounds' | 'assists' | 'minutes' | 'valuation';

export interface PlayerSort {
  key: PlayerSortKey;
  /** Chip felirat, ALL CAPS (a mockup szóhasználata). */
  label: string;
  /** Oszlopfelirat a lista fejlécében. */
  column: string;
  /** Meccsenkénti átlag, ami szerint a rendezés csökkenő sorrendben áll. */
  value: (player: SeasonPlayer) => number;
}

export const PLAYER_SORTS: PlayerSort[] = [
  { key: 'points', label: 'Pont', column: 'PPG', value: (p) => p.averages.points },
  { key: 'rebounds', label: 'Lepattanó', column: 'RPG', value: (p) => p.averages.rebounds },
  { key: 'assists', label: 'Assziszt', column: 'APG', value: (p) => p.averages.assists },
  { key: 'minutes', label: 'Perc', column: 'Perc', value: (p) => p.averages.minutes },
  { key: 'valuation', label: 'Hatékonyság', column: 'Ért', value: (p) => p.averages.valuation },
];

/** A lekérdezés is pontátlag szerint rendez – ez a lista alapállapota. */
export const DEFAULT_PLAYER_SORT: PlayerSortKey = 'points';

/** A mockup három állandó oszlopa. */
const BASE_COLUMNS = 3;

/**
 * A látható numerikus oszlopok. Három fér el a soron (mockup), ezért a
 * negyedik és ötödik szempont az utolsó oszlop helyén jelenik meg.
 */
export function visibleColumns(active: PlayerSortKey): PlayerSort[] {
  const base = PLAYER_SORTS.slice(0, BASE_COLUMNS);
  const activeSort = PLAYER_SORTS.find((sort) => sort.key === active);

  if (!activeSort || base.includes(activeSort)) return base;
  return [...base.slice(0, BASE_COLUMNS - 1), activeSort];
}
