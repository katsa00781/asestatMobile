/**
 * A `@core/positions` öt pozíciókódjának magyar neve.
 *
 * A `@core` csak a kódot (`PG`…`C`) adja vissza, feliratot nem – a webprojekt is
 * komponensenként tartja a fordítást. Itt egy helyen van, hogy a lista és a
 * játékos részletei ugyanazt a szót írja ki.
 */
import type { Position } from '@core/positions';

export const POSITION_LABELS_HU: Record<Position, string> = {
  PG: 'Irányító',
  SG: 'Dobóhátvéd',
  SF: 'Bedobó',
  PF: 'Erőcsatár',
  C: 'Center',
};
