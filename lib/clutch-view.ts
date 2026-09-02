/**
 * A Meccs részletei „Clutch" szekciójának megjelenítési modelljét építi fel.
 *
 * Bemenet: a `@core/kosarstat-clutch-parse` `parseGameClutch` eredménye (vagy
 * `null`, ha a meccshez nincs clutch-oldal). Kimenet: kész, formázott sorok és
 * a sablonból összeálló összegzés. Tiszta modul – se hálózat, se React.
 *
 * A „clutch" a kosarstat forrásban a szoros állásnál (±5 pont) játszott percek
 * összessége – ez meccstől függően 1 és ~15 játékperc között van, nem fix 5
 * perc. Ezért a szövegek a minta hosszát mindig kiírják, és nem hivatkoznak
 * fix időablakra. A ráta-mutatók rövid mintán is helytállók, az abszolút
 * számok viszont ilyenkor keveset mondanak – ezt a lábjegyzet jelzi.
 */
import type { KosarstatGameClutch } from '@core/kosarstat-clutch-parse';

import { formatDecimal, formatSigned } from '@/lib/format';
import type { InsightFragment } from '@/types/situational';
import type { ClutchMetric, ClutchView } from '@/types/clutch';

const EN_DASH = '–';

export function buildClutchView(
  clutch: KosarstatGameClutch | null,
  ourName: string,
  opponent: string,
): ClutchView {
  if (!clutch) {
    return empty('missing', 'Ehhez a meccshez nincs kosarstat clutch-adat importálva.');
  }

  if (!clutch.available) {
    return empty(
      'notClose',
      'Ehhez a meccshez a kosarstat nem jelöl ±5 pontos állású clutch-perceket – ' +
        'az állás nem volt elég sokáig szoros.',
    );
  }

  const diffTone = clutch.diff > 0 ? 'positive' : clutch.diff < 0 ? 'negative' : undefined;

  return {
    state: 'available',
    sampleLabel: clutch.sampleLabel,
    scoreText: `${clutch.ownPoints}${EN_DASH}${clutch.oppPoints}`,
    diffText: formatSigned(clutch.diff, 0),
    diffTone,
    metrics: buildMetrics(clutch),
    closersText: buildClosers(clutch),
    footnote:
      'A clutch a ±5 pontos állásnál játszott percek összessége (nem fix időablak). ' +
      `Minta: ${clutch.sampleLabel} játékperc – ${ourName} ${clutch.ownPoints} ${EN_DASH} ` +
      `${opponent} ${clutch.oppPoints}.`,
    insight: buildInsight(clutch),
  };
}

function empty(state: 'notClose' | 'missing', footnote: string): ClutchView {
  return {
    state,
    sampleLabel: '',
    scoreText: '',
    diffText: '',
    diffTone: undefined,
    metrics: [],
    closersText: null,
    footnote,
    insight: [],
  };
}

/** `–`, ha a `@core` nem tudta kiszámolni (nincs birtoklás a mintában). */
function num(value: number | null, digits: number, suffix = ''): string {
  return value !== null && Number.isFinite(value) ? `${formatDecimal(value, digits)}${suffix}` : EN_DASH;
}

function buildMetrics(c: KosarstatGameClutch): ClutchMetric[] {
  const netTone =
    c.net === null ? undefined : c.net > 0 ? 'positive' : c.net < 0 ? 'negative' : undefined;

  return [
    { label: 'Saját támadó rating', value: num(c.ortg, 1) },
    { label: 'Ellenfél támadó rating', value: num(c.drtg, 1) },
    {
      label: 'Nettó rating',
      value: c.net !== null && Number.isFinite(c.net) ? formatSigned(c.net, 1) : EN_DASH,
      tone: netTone,
    },
    { label: 'Eladott labda %', value: num(c.tovPct, 1, '%') },
    { label: 'Támadó lepattanó %', value: num(c.rebPct, 1, '%') },
    { label: 'Büntetőráta', value: num(c.ftRate, 3) },
    { label: 'Assziszt / eladott', value: num(c.assistToTurnover, 2) },
    { label: 'Saját eladott labda', value: String(c.ownTurnovers) },
    { label: 'Ellenfél eladott labda', value: String(c.oppTurnovers) },
  ];
}

function buildClosers(c: KosarstatGameClutch): string | null {
  if (c.topUsageClosers.length === 0) return null;
  return c.topUsageClosers
    .map((entry) => `${entry.player} (${Math.round(entry.usageShare * 100)}%)`)
    .join(', ');
}

// --- Összegző szöveg. Sablonból készül, AI nincs a mobil appban. ---

function buildInsight(c: KosarstatGameClutch): InsightFragment[] {
  const fragments: InsightFragment[] = [
    { text: 'A ±5 pontos állásnál játszott ' },
    { text: c.sampleLabel, emphasis: true },
    { text: ' percben a csapat ' },
    { text: `${c.ownPoints}${EN_DASH}${c.oppPoints}`, emphasis: true },
    {
      text:
        c.diff === 0
          ? '-re teljesített (döntetlen). '
          : `-re teljesített (${formatSigned(c.diff, 0)} a csapatnak). `,
    },
  ];

  if (c.ortg !== null && c.drtg !== null) {
    fragments.push(
      { text: 'Támadásban ' },
      { text: formatDecimal(c.ortg, 1), emphasis: true },
      { text: ', védekezésben ' },
      { text: formatDecimal(c.drtg, 1), emphasis: true },
      { text: ' a 100 birtokra vetített rating.' },
    );
  } else {
    fragments.push({
      text: 'A rövid minta miatt a 100 birtokra vetített rating nem értelmezhető.',
    });
  }

  return fragments;
}
