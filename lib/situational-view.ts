/**
 * A Szituációk képernyő megjelenítési modelljét építi fel.
 *
 * Bemenet: a `@core/situational-analysis` eredménye és a hazai/vendég
 * csapatösszegzés. Kimenet: kész sorok formázott értékekkel, plusz a három
 * szegmens összegző szövege. Tiszta modul – se hálózat, se React.
 *
 * A játékhelyzetek feliratai **nem** a `@core` `label` mezőjéből jönnek: azok
 * a `≤` és `≥` jelet használják, ami egyik csomagolt betűkészletben sincs meg
 * (ugyanaz a lelet, mint D-064). Helyettük magyar szöveges alak áll.
 */
import type { SituationalData, SituationResult } from '@core/situational-analysis';

import { formatDecimal, formatSigned } from '@/lib/format';
import type {
  FactorEntry,
  InsightFragment,
  QuarterEntry,
  SituationEntry,
  SituationalSegment,
  SituationalView,
  SplitMetric,
  SplitSide,
  SplitSideKey,
} from '@/types/situational';

/**
 * Egy oldal (hazai vagy vendég) nyers összegzése. A pontok a `games` sorokból,
 * a dobás- és labdaadatok a szezon `player_game_stats` tábláját meccsenként
 * összeadva jönnek – ezért van két külön nevező (`games`, `statGames`).
 */
export interface SplitTotals {
  games: number;
  wins: number;
  scored: number;
  allowed: number;
  fgMade: number;
  fgAttempted: number;
  threeMade: number;
  threeAttempted: number;
  rebounds: number;
  assists: number;
  turnovers: number;
  /** Hány meccshez van játékosstatisztika – a lepattanó/assziszt átlag nevezője. */
  statGames: number;
}

export const EMPTY_TOTALS: SplitTotals = {
  games: 0,
  wins: 0,
  scored: 0,
  allowed: 0,
  fgMade: 0,
  fgAttempted: 0,
  threeMade: 0,
  threeAttempted: 0,
  rebounds: 0,
  assists: 0,
  turnovers: 0,
  statGames: 0,
};

/** A helyzet-sorok sorrendje a képernyőn. A hazai/vendég külön szegmens. */
const SITUATION_ORDER = [
  'closeGames',
  'blowouts',
  'leadingAtHalf',
  'trailingAtHalf',
  'wonQ1',
  'lostQ1',
] as const;

type SituationKey = (typeof SITUATION_ORDER)[number];

/** A magyar feliratok a `@core` kulcsaihoz kötve, a hiányzó glifák nélkül. */
const SITUATION_LABELS: Record<SituationKey, string> = {
  closeGames: 'Szoros meccs (max 5p)',
  blowouts: 'Kiütéses meccs (15p-től)',
  leadingAtHalf: 'Félidőben vezetett',
  trailingAtHalf: 'Félidőben hátrányban',
  wonQ1: 'N1-et megnyerte',
  lostQ1: 'N1-et elvesztette',
};

export function buildSituationalView(
  data: SituationalData,
  home: SplitTotals,
  away: SplitTotals,
): SituationalView {
  const metrics = buildMetrics(home, away);
  const homeRate = data.situations.home.winRate;
  const awayRate = data.situations.away.winRate;

  return {
    home: buildSide('Hazai', data.situations.home, home, homeRate > awayRate),
    away: buildSide('Vendég', data.situations.away, away, awayRate > homeRate),
    metrics,
    situations: buildSituations(data),
    quarters: buildQuarters(data),
    factors: buildFactors(data),
    coverage: buildCoverage(data, home, away),
    insights: {
      homeAway: homeAwayInsight(home, away),
      situations: situationsInsight(data),
      quarters: quartersInsight(data),
    },
  };
}

/**
 * A prompt a **jobb** mérleget színezi zöldre, a másikat halványan hagyja
 * (a példájában az 5GY-4V is halvány) – ezért az összehasonlítás dönt, nem az,
 * hogy az adott oldal pozitív mérlegű-e.
 */
function buildSide(
  label: string,
  result: SituationResult,
  totals: SplitTotals,
  highlighted: boolean,
): SplitSide {
  return {
    label,
    gamesText: `${totals.games} meccs`,
    recordText: `${result.wins}GY - ${result.losses}V`,
    winning: highlighted,
  };
}

/** Átlag nevezővédelemmel – nulla meccsből nulla lesz, nem NaN. */
function per(total: number, count: number): number {
  return count > 0 ? total / count : 0;
}

/** Százalék nevezővédelemmel. */
function pct(made: number, attempted: number): number {
  return attempted > 0 ? (made / attempted) * 100 : 0;
}

interface MetricSpec {
  label: string;
  home: number;
  away: number;
  /** Melyik irány a jobb teljesítmény. */
  lowerIsBetter?: boolean;
  /** Előjeles alak (`+13.1`) – a pontkülönbségnél. */
  signed?: boolean;
}

function buildMetrics(home: SplitTotals, away: SplitTotals): SplitMetric[] {
  const specs: MetricSpec[] = [
    {
      label: 'Szerzett pont',
      home: per(home.scored, home.games),
      away: per(away.scored, away.games),
    },
    {
      label: 'Kapott pont',
      home: per(home.allowed, home.games),
      away: per(away.allowed, away.games),
      lowerIsBetter: true,
    },
    {
      label: 'Pontkülönbség',
      home: per(home.scored - home.allowed, home.games),
      away: per(away.scored - away.allowed, away.games),
      signed: true,
    },
    {
      label: 'Mezőny %',
      home: pct(home.fgMade, home.fgAttempted),
      away: pct(away.fgMade, away.fgAttempted),
    },
    {
      label: 'Hármas %',
      home: pct(home.threeMade, home.threeAttempted),
      away: pct(away.threeMade, away.threeAttempted),
    },
    {
      label: 'Lepattanó',
      home: per(home.rebounds, home.statGames),
      away: per(away.rebounds, away.statGames),
    },
    {
      label: 'Assziszt',
      home: per(home.assists, home.statGames),
      away: per(away.assists, away.statGames),
    },
    {
      label: 'Eladott labda',
      home: per(home.turnovers, home.statGames),
      away: per(away.turnovers, away.statGames),
      lowerIsBetter: true,
    },
  ];

  return specs.map(toMetric);
}

function toMetric(spec: MetricSpec): SplitMetric {
  const format = spec.signed ? formatSigned : (value: number) => formatDecimal(value, 1);

  // A sávok hossza a nagyobb abszolút értékhez normalizálódik: a hosszabb
  // oldal teljes, a másik ehhez képest arányos. Előjeles metrikánál is az
  // abszolút érték adja a hosszt – az irányt a szám előjele mutatja.
  const scale = Math.max(Math.abs(spec.home), Math.abs(spec.away));

  return {
    label: spec.label,
    homeText: format(spec.home),
    awayText: format(spec.away),
    homeShare: scale > 0 ? Math.abs(spec.home) / scale : 0,
    awayShare: scale > 0 ? Math.abs(spec.away) / scale : 0,
    better: betterSide(spec),
  };
}

function betterSide(spec: MetricSpec): SplitSideKey | null {
  if (spec.home === spec.away) return null;
  const homeBetter = spec.lowerIsBetter ? spec.home < spec.away : spec.home > spec.away;
  return homeBetter ? 'home' : 'away';
}

/**
 * Csak az előfordult helyzetek kerülnek a listába: negyedadat nélkül a
 * félidei és N1-es sorok mind `0–0`-val állnának. A hiányt a lábjegyzet
 * mondja ki, nem egy üres sor (D-047 mintája).
 */
function buildSituations(data: SituationalData): SituationEntry[] {
  return SITUATION_ORDER.filter((key) => data.situations[key].total > 0).map((key) => {
    const result = data.situations[key];
    return {
      label: SITUATION_LABELS[key],
      recordText: `${result.wins}–${result.losses}`,
      rateText: `${formatDecimal(result.winRate * 100, 1)}%`,
      ratePercent: result.winRate * 100,
    };
  });
}

function buildQuarters(data: SituationalData): QuarterEntry[] {
  if (data.gamesWithQuarterData === 0) return [];

  return data.quarters.map((quarter) => ({
    label: quarter.label,
    scoredText: formatDecimal(quarter.avgScored, 1),
    allowedText: formatDecimal(quarter.avgAllowed, 1),
    marginText: formatSigned(quarter.avgMargin),
    recordText: `${quarter.wins}–${quarter.losses}`,
    positive: quarter.avgMargin >= 0,
  }));
}

function buildFactors(data: SituationalData): FactorEntry[] {
  if (data.gamesWithMetricsData === 0) return [];

  const { metrics } = data;

  return [
    { label: 'Támadó rating', value: formatDecimal(metrics.avgOrtg, 1) },
    { label: 'Effektív mezőny %', value: formatDecimal(metrics.avgEfg, 1) },
    { label: 'Eladott labda %', value: formatDecimal(metrics.avgTovPct, 1) },
    { label: 'Támadó lepattanó %', value: formatDecimal(metrics.avgOrbPct, 1) },
    { label: 'Büntetőráta', value: formatDecimal(metrics.avgFtmRate, 3) },
  ];
}

/**
 * Lábjegyzet szegmensenként: melyik sor hány meccs adatán áll. A negyed- és
 * metrikaadat csak a kosarstat-tal összekötött meccsekre van meg, a pontok
 * viszont mindre – ezt a felhasználónak látnia kell.
 */
function buildCoverage(
  data: SituationalData,
  home: SplitTotals,
  away: SplitTotals,
): Record<SituationalSegment, string> {
  const statGames = home.statGames + away.statGames;
  const homeAway =
    statGames === data.totalGames
      ? `${data.totalGames} lejátszott meccs adatából.`
      : `A pontok ${data.totalGames} meccsből, a dobás- és labdaadatok ${statGames} meccsből.`;

  const missing = 'Ehhez a szezonhoz nincs negyedenkénti bontás importálva.';

  return {
    homeAway,
    situations:
      data.gamesWithQuarterData === 0
        ? `A szoros és kiütéses mérleg ${data.totalGames} meccsből. ${missing}`
        : `A szoros és kiütéses mérleg ${data.totalGames} meccsből, a félidei és negyed-alapú sorok ${data.gamesWithQuarterData} meccs negyedadatából. A four factors ${data.gamesWithMetricsData} meccs metrikáiból.`,
    quarters:
      data.gamesWithQuarterData === 0
        ? missing
        : `${data.gamesWithQuarterData} meccs negyedadatából.`,
  };
}

// --- Összegző szövegek. Sablonból készülnek, AI nincs a mobil appban. ---

function homeAwayInsight(home: SplitTotals, away: SplitTotals): InsightFragment[] {
  if (home.games === 0 || away.games === 0) {
    return [{ text: 'Az összehasonlításhoz hazai és vendég meccs is kell.' }];
  }

  const homeMargin = per(home.scored - home.allowed, home.games);
  const awayMargin = per(away.scored - away.allowed, away.games);
  const marginDiff = homeMargin - awayMargin;

  if (Math.abs(marginDiff) < 0.05) {
    return [{ text: 'Hazai pályán és idegenben azonos a pontkülönbség.' }];
  }

  const strongHome = marginDiff > 0;
  const where = strongHome ? 'Hazai pályán' : 'Idegenben';
  const there = strongHome ? 'otthon' : 'idegenben';

  // A pontkülönbség eltérése két forrásból áll össze, és a kettő összege
  // pontosan a különbség – a nagyobbik a „fő forrás".
  const offense = (per(home.scored, home.games) - per(away.scored, away.games)) * (strongHome ? 1 : -1);
  const defense =
    (per(away.allowed, away.games) - per(home.allowed, home.games)) * (strongHome ? 1 : -1);

  const byOffense = offense >= defense;
  const source = byOffense ? 'a támadójáték' : 'a védekezés';
  const verb = byOffense ? 'ponttal többet szerez' : 'ponttal kevesebbet kap';

  return [
    { text: `${where} ` },
    { text: formatDecimal(Math.abs(marginDiff), 1), emphasis: true },
    { text: ' ponttal jobb a pontkülönbség. A különbség fő forrása ' },
    { text: `${source}: ${there} ` },
    { text: formatDecimal(Math.abs(byOffense ? offense : defense), 1), emphasis: true },
    { text: ` ${verb} a csapat.` },
  ];
}

function situationsInsight(data: SituationalData): InsightFragment[] {
  const played = SITUATION_ORDER.map((key) => ({
    label: SITUATION_LABELS[key],
    result: data.situations[key],
  })).filter((entry) => entry.result.total > 0);

  if (played.length < 2) {
    return [{ text: 'Ehhez a szezonhoz még kevés helyzet-adat gyűlt össze.' }];
  }

  const sorted = [...played].sort((a, b) => b.result.winRate - a.result.winRate);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  return [
    { text: `A legjobb mérleg: ${best.label} – ` },
    { text: `${formatDecimal(best.result.winRate * 100, 1)}%`, emphasis: true },
    { text: ` (${best.result.wins}–${best.result.losses}). A leggyengébb: ${worst.label} – ` },
    { text: `${formatDecimal(worst.result.winRate * 100, 1)}%`, emphasis: true },
    { text: ` (${worst.result.wins}–${worst.result.losses}).` },
  ];
}

function quartersInsight(data: SituationalData): InsightFragment[] {
  if (data.gamesWithQuarterData === 0) {
    return [{ text: 'Ehhez a szezonhoz nincs negyed-szintű adat.' }];
  }

  const sorted = [...data.quarters].sort((a, b) => b.avgMargin - a.avgMargin);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  // A negyedek feliratát „N" betű kezdi, ezért határozott névelőnek „az" jár.
  return [
    { text: `A legerősebb negyed az ${best.label}: ` },
    { text: formatSigned(best.avgMargin), emphasis: true },
    { text: ` pont az átlagos különbség. A leggyengébb az ${worst.label}: ` },
    { text: formatSigned(worst.avgMargin), emphasis: true },
    { text: ' pont.' },
  ];
}
