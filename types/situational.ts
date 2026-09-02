/**
 * A Szituációk képernyő megjelenítési modellje.
 *
 * A számokat a `@core/situational-analysis` és a csapatösszegzés adja, ez a
 * fájl csak a képernyőre kész alakot írja le: minden érték **már formázott**,
 * a komponensek nem kerekítenek és nem számolnak.
 */

/** A szegmentált kontroll három nézete. */
export type SituationalSegment = 'homeAway' | 'situations' | 'quarters';

/** Melyik oldal állt jobban egy metrikában. */
export type SplitSideKey = 'home' | 'away';

/** Az összehasonlító fejléc egy oszlopa. */
export interface SplitSide {
  /** ALL CAPS felirat: „Hazai" / „Vendég". */
  label: string;
  /** Meccsszám, pl. „29 meccs". */
  gamesText: string;
  /** Mérleg, pl. „24GY – 5V". */
  recordText: string;
  /** Nyerte-e a meccsek több mint felét – ettől függ a mérleg színe. */
  winning: boolean;
}

/** Egy szembeállított metrikasor (P13 4. pont). */
export interface SplitMetric {
  /** ALL CAPS metrikanév, pl. „Szerzett pont". */
  label: string;
  homeText: string;
  awayText: string;
  /** A sáv hossza a középvonaltól, 0–1 – a hosszabb oldalhoz normalizálva. */
  homeShare: number;
  awayShare: number;
  /** A jobb oldal kap glow-t. Döntetlennél `null`. */
  better: SplitSideKey | null;
}

/** Egy játékhelyzet mérlege (szoros, kiütéses, félidei vezetés, N1). */
export interface SituationEntry {
  label: string;
  /** Mérleg, pl. „8–7". */
  recordText: string;
  /** Nyerési arány, pl. „53.3%". */
  rateText: string;
  /** 0–100, az arányjelző sávhoz. */
  ratePercent: number;
}

/** Egy negyed sora a bontásban. */
export interface QuarterEntry {
  label: string;
  scoredText: string;
  allowedText: string;
  marginText: string;
  /** Negyedmérleg, pl. „17–7". */
  recordText: string;
  /** A különbség előjele – ettől függ a cella színe. */
  positive: boolean;
}

/** Címke–érték pár a four factors listához. */
export interface FactorEntry {
  label: string;
  value: string;
}

/**
 * Az összegző kártya szövege darabokban: a `emphasis` részek monospace,
 * cián színnel jelennek meg (P13 5. pont).
 */
export interface InsightFragment {
  text: string;
  emphasis?: boolean;
}

/** Egy szegmens teljes tartalma. */
export interface SituationalView {
  home: SplitSide;
  away: SplitSide;
  metrics: SplitMetric[];
  situations: SituationEntry[];
  quarters: QuarterEntry[];
  factors: FactorEntry[];
  /** Hány meccs adatán alapul az adott szegmens – lábjegyzetnek. */
  coverage: Record<SituationalSegment, string>;
  insights: Record<SituationalSegment, InsightFragment[]>;
}
