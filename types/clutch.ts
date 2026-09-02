/**
 * A Meccs részletei képernyő „Clutch" szekciójának megjelenítési modellje.
 *
 * A hajrá = az utolsó 5 perc, amíg az állás ±5 ponton belül van. A számokat a
 * `@core/kosarstat-clutch-parse` állítja elő a kosarstat nyers tábláiból; ez a
 * típus már kész, formázott sorokat ír le, a képernyő csak elrendezi.
 */
import type { InsightFragment } from '@/types/situational';

/** Egy címke–érték sor a clutch mutatók listájában. */
export interface ClutchMetric {
  label: string;
  /** Már formázott érték – a nézet nem számol és nem kerekít. */
  value: string;
  /** Kiemelés: a nettó ratingnél az előjel dönt. */
  tone?: 'positive' | 'negative';
}

export type ClutchState =
  /** Van elég hajrá-minta (legalább egy perc). */
  | 'available'
  /** Volt kosarstat clutch-oldal, de a meccs a hajrában nem volt szoros. */
  | 'notClose'
  /** Ehhez a meccshez nincs kosarstat clutch-adat importálva. */
  | 'missing';

export interface ClutchView {
  state: ClutchState;
  /** A hajrá-minta hossza, `MM:SS` (`05:00`). */
  sampleLabel: string;
  /** A hajrá pontállása, saját–ellenfél (`4–11`). */
  scoreText: string;
  /** A hajrá pontkülönbsége, tipográfiai előjellel (`−7`). */
  diffText: string;
  diffTone: 'positive' | 'negative' | undefined;
  /** A clutch mutatók sorai. `available` állapotban nem üres. */
  metrics: ClutchMetric[];
  /** A hajrában legtöbbet birtokló emberek, vagy `null`. */
  closersText: string | null;
  /** Lábjegyzet: mekkora és milyen mintán áll a szekció. */
  footnote: string;
  /** Sablonból összeálló összegzés – a mobil app nem generál AI tartalmat. */
  insight: InsightFragment[];
}
