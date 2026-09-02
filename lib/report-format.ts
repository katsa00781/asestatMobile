/**
 * AI riportok szövegének előkészítése megjelenítésre.
 *
 * A riportokat a webprojekt generálja, és a nyers szöveg két dolgot hoz, amit
 * mobilon nem lehet változtatás nélkül kirakni:
 *
 * 1. **Markdown félkövér jelölés** (`**...**`) – renderelő nélkül a csillagok
 *    egyszerűen látszanának.
 * 2. **A csomagolt betűkészletekből hiányzó jelek** – a három subset `cmap`-je
 *    Latin-1-ig tart, így a `✓` `↺` `✗` `→` és a `1️⃣` billentyű-szekvencia
 *    Androidon tofuként jelenne meg (ugyanaz a lelet, mint D-031-nél).
 *
 * Ezért a szöveg blokkokra bomlik: a sorkezdő `✓` / `↺` / `✗` jelekből
 * `outcome` blokk lesz (ikonnal rajzolva), a `→` sorokból `note`, a szekciók
 * címéből `heading`. Ami marad, az bekezdés. Lásd D-064 és D-065.
 */

export type OutcomeTone = 'positive' | 'warning' | 'negative';

export type ReportBlock =
  /** Szekciócím – Barlow Condensed, a bekezdések fölött nagyobb réssel. */
  | { kind: 'heading'; text: string }
  /** Teljesült / részben teljesült / nem teljesült megállapítás. */
  | { kind: 'outcome'; tone: OutcomeTone; text: string }
  /** Az előző megállapítás indoklása – behúzva, halványabban. */
  | { kind: 'note'; text: string }
  | { kind: 'paragraph'; text: string };

/** Sorkezdő jel → a megállapítás hangneme. */
const OUTCOME_MARKS: Record<string, OutcomeTone> = {
  '✓': 'positive', // ✓ teljesült
  '↺': 'warning', // ↺ részben teljesült
  '✗': 'negative', // ✗ nem teljesült
};

/** Az indoklás sorának kezdőjele. */
const NOTE_MARK = '→'; // →

/**
 * Szövegközi tartalék a hiányzó glifákra. A `✓` `↺` `✗` a korpuszban mindig
 * sorkezdő (tehát blokk-jelölő), ez csak biztonsági háló, ha egyszer szövegbe
 * kerülnének. A billentyű-szekvencia két láthatatlan tagja egyszerűen kimarad.
 */
const GLYPH_FALLBACKS: Record<string, string> = {
  '→': '–', // → en dash
  '✓': '+',
  '↺': '±', // ±
  '✗': '−', // − tipográfiai mínusz
  '≈': '~', // ≈ hullámvonal
  '️': '', // variation selector
  '⃣': '', // combining enclosing keycap
};

const GLYPH_PATTERN = new RegExp(`[${Object.keys(GLYPH_FALLBACKS).join('')}]`, 'g');

/** `1️⃣ Kiindulási kép` → `1. Kiindulási kép` – a szekciók számozása. */
const KEYCAP_PATTERN = /^([0-9])️?⃣\s*/;

/**
 * Ennél hosszabb sor már bekezdés, akkor is, ha nincs a végén írásjel.
 * A leghosszabb valódi szekciócím a korpuszban 42 karakter.
 */
const MAX_HEADING_LENGTH = 70;

/** Bekezdésvégi írásjelek – ami így végződik, az mondat, nem cím. */
const SENTENCE_END = /[.!?:…]$/;

/** A riport blokkokra bontva, megjelenítésre kész szöveggel. */
export function parseReport(narrative: string): ReportBlock[] {
  return narrative
    .split('\n')
    .map((line) => toBlock(line))
    .filter((block): block is ReportBlock => block !== null);
}

/**
 * A riport folyószövegként – markdown jelölés nélkül, a hiányzó glifák
 * pótolva. A `ReportCard` összecsukható előnézete ezt mutatja.
 */
export function plainReport(narrative: string): string {
  return parseReport(narrative)
    .map((block) => block.text)
    .join('\n');
}

/**
 * A lista kártyáin látszó egysoros összefoglaló: az első **bekezdés** első
 * mondata. A szekciócímeket kihagyja, mert a csapatriportok első sora maga is
 * cím, és a kártya címét ismételné meg.
 */
export function reportSummary(narrative: string): string {
  const paragraph = parseReport(narrative).find((block) => block.kind === 'paragraph');
  if (!paragraph) return '';

  return firstSentence(paragraph.text);
}

/**
 * Egyetlen sor megjelenítésre készen: a hiányzó glifák pótolva. A `@core`
 * modulok magyar mondatai (pl. az ellenfél scouting veszélyforrásai) is
 * használnak `→` és `≈` jelet, ezek egyik csomagolt betűkészletben sincsenek
 * meg – ugyanaz a lelet, mint a riportoknál.
 */
export function plainText(text: string): string {
  return normalizeGlyphs(text.replace(/\*\*/g, '').trim());
}

function toBlock(line: string): ReportBlock | null {
  const raw = line.replace(/\*\*/g, '').trim();
  if (raw === '') return null;

  // A jelentést a blokk típusa hordozza tovább, ezért a jelölő karakter
  // lekerül a szövegről.
  const tone = OUTCOME_MARKS[raw.charAt(0)];
  if (tone) return { kind: 'outcome', tone, text: normalizeGlyphs(raw.slice(1).trim()) };

  if (raw.startsWith(NOTE_MARK)) {
    return { kind: 'note', text: normalizeGlyphs(raw.slice(NOTE_MARK.length).trim()) };
  }

  const keycap = KEYCAP_PATTERN.exec(raw);
  if (keycap) {
    const rest = normalizeGlyphs(raw.slice(keycap[0].length));
    return { kind: 'heading', text: `${keycap[1]}. ${rest}`.trim() };
  }

  const text = normalizeGlyphs(raw);
  if (text.length <= MAX_HEADING_LENGTH && !SENTENCE_END.test(text)) {
    return { kind: 'heading', text };
  }

  return { kind: 'paragraph', text };
}

function normalizeGlyphs(text: string): string {
  return text.replace(GLYPH_PATTERN, (char) => GLYPH_FALLBACKS[char] ?? char);
}

/**
 * Az első mondat. A rövidítések (`vs.`, `pp.`) miatt nem elég a pont: legalább
 * 40 karakter után vágunk, egyébként az egész bekezdés megy tovább – a kártya
 * úgyis egy sorra vágja.
 */
function firstSentence(text: string): string {
  const match = /^.{40,}?[.!?](\s|$)/.exec(text);
  return match ? match[0].trim() : text;
}
