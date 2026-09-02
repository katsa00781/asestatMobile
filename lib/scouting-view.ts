/**
 * Az Ellenfél scouting képernyő megjelenítési modelljét építi fel.
 *
 * Bemenet: a `@core/pregame-scouting` riportja és a két csapat szezonmérlege.
 * Kimenet: kész sorok formázott értékekkel, plusz a három szegmens összegző
 * szövege. Tiszta modul – se hálózat, se React.
 *
 * A `@core` mondatai `→` és `≈` jelet használnak, ami egyik csomagolt
 * betűkészletben sincs meg, ezért minden átvett szöveg a `plainText`-en megy
 * keresztül (D-064 lelete).
 *
 * Két metrikát a képernyő **nem** mutat: a `pace`-t és a támadólepattanó
 * arányt. Mindkettőhöz az ellenfelek dobás- és lepattanóadata kellene, ami az
 * adatbázisból csapatperspektívánként nem áll össze – lásd D-079.
 */
import { POSITION_LABELS_HU } from '@/data/position-labels';
import type { ScoutingReport } from '@core/pregame-scouting';

import { formatDecimal, formatSigned } from '@/lib/format';
import { plainText } from '@/lib/report-format';
import type {
  ChanceView,
  KeyPlayerGroup,
  PointEntry,
  PositionRow,
  ProfileView,
  ScoutPlayerRow,
  ScoutingSegment,
  ScoutingView,
} from '@/types/scouting';
import type { InsightFragment, SplitMetric, SplitSide, SplitSideKey } from '@/types/situational';

/** Egy csapat szezonmérlege és pontösszegei – a `games` tábla soraiból. */
export interface TeamRecord {
  games: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
}

export const EMPTY_RECORD: TeamRecord = {
  games: 0,
  wins: 0,
  losses: 0,
  pointsFor: 0,
  pointsAgainst: 0,
};

/** A kulcsember-csoportok sorrendje és magyar felirata. */
const KEY_PLAYER_LABELS: [keyof ScoutingReport['keyPlayers'], string][] = [
  ['primaryScorers', 'Pontszerzők'],
  ['primaryPlaymakers', 'Játéképítők'],
  ['stretchThreats', 'Távoli fenyegetés'],
  ['mismatchCandidates', 'Mismatch'],
];

const CONFIDENCE_LABELS: Record<ScoutingReport['winProbability']['confidence'], string> = {
  High: 'Magas bizonyosság',
  Medium: 'Közepes bizonyosság',
  Low: 'Alacsony bizonyosság',
};

export function buildScoutingView(
  report: ScoutingReport,
  ownRecord: TeamRecord,
  opponentRecord: TeamRecord,
): ScoutingView {
  const chance = buildChance(report);

  return {
    own: buildSide(report.ownTeamName, ownRecord, chance.ownPercent >= 50),
    opponent: buildSide(report.opponentTeamName, opponentRecord, chance.ownPercent < 50),
    chance,
    metrics: buildMetrics(report, ownRecord, opponentRecord),
    profiles: buildProfiles(report),
    threats: toPoints(report.threats),
    vulnerabilities: toPoints(report.vulnerabilities),
    focusPoints: toPoints(report.focusPoints),
    responses: buildResponses(report),
    keyPlayers: buildKeyPlayers(report),
    players: buildPlayers(report),
    positions: buildPositions(report),
    coverage: buildCoverage(report, ownRecord, opponentRecord),
    insights: {
      overview: overviewInsight(report, chance),
      plan: planInsight(report),
      players: playersInsight(report),
    },
  };
}

function buildSide(name: string, record: TeamRecord, highlighted: boolean): SplitSide {
  return {
    label: name,
    gamesText: `${record.games} meccs`,
    recordText: `${record.wins}GY - ${record.losses}V`,
    winning: highlighted,
  };
}

function buildChance(report: ScoutingReport): ChanceView {
  const { ownPct, opponentPct, confidence, confidenceReasons } = report.winProbability;

  return {
    ownText: `${Math.round(ownPct)}%`,
    opponentText: `${Math.round(opponentPct)}%`,
    ownPercent: ownPct,
    confidenceText: CONFIDENCE_LABELS[confidence],
    confidenceVariant:
      confidence === 'High' ? 'positive' : confidence === 'Medium' ? 'warning' : 'negative',
    reasonText:
      confidenceReasons.length > 0
        ? `A modell korlátai: ${confidenceReasons.map(plainText).join(', ')}.`
        : null,
  };
}

/** Átlag nevezővédelemmel – nulla meccsből nulla lesz, nem NaN. */
function per(total: number, count: number): number {
  return count > 0 ? total / count : 0;
}

interface MetricSpec {
  label: string;
  own: number;
  opponent: number;
  /** Melyik irány a jobb teljesítmény. */
  lowerIsBetter?: boolean;
  /** Előjeles alak (`+9.1`) – a pontkülönbségnél. */
  signed?: boolean;
}

function buildMetrics(
  report: ScoutingReport,
  ownRecord: TeamRecord,
  opponentRecord: TeamRecord,
): SplitMetric[] {
  const stats = report.teamStats;
  if (!stats) return [];

  const specs: MetricSpec[] = [
    {
      label: 'Effektív mezőny %',
      own: stats.own.efg,
      opponent: stats.opponent.efg,
    },
    {
      label: 'Hármas arány',
      own: stats.own.threeRate,
      opponent: stats.opponent.threeRate,
    },
    {
      label: 'Hármas %',
      own: stats.own.threePct,
      opponent: stats.opponent.threePct,
    },
    {
      label: 'Büntetőráta',
      own: stats.own.ftRate,
      opponent: stats.opponent.ftRate,
    },
    {
      label: 'Assziszt arány',
      own: stats.own.assistRate,
      opponent: stats.opponent.assistRate,
    },
    {
      label: 'Eladott labda %',
      own: stats.own.turnoverRate,
      opponent: stats.opponent.turnoverRate,
      lowerIsBetter: true,
    },
  ];

  return [...buildScoreMetrics(ownRecord, opponentRecord), ...specs].map(toMetric);
}

/**
 * A pontátlagok nem a `teamStats`-ból jönnek: ott csak arányszámok vannak. A
 * szerzett és kapott pont a szezonmérlegből számolódik, hogy ugyanazt mutassa,
 * amit a Ma és a Meccsek képernyő.
 */
function buildScoreMetrics(ownRecord: TeamRecord, opponentRecord: TeamRecord): MetricSpec[] {
  const ownScored = per(ownRecord.pointsFor, ownRecord.games);
  const ownAllowed = per(ownRecord.pointsAgainst, ownRecord.games);
  const oppScored = per(opponentRecord.pointsFor, opponentRecord.games);
  const oppAllowed = per(opponentRecord.pointsAgainst, opponentRecord.games);

  return [
    { label: 'Szerzett pont', own: ownScored, opponent: oppScored },
    { label: 'Kapott pont', own: ownAllowed, opponent: oppAllowed, lowerIsBetter: true },
    {
      label: 'Pontkülönbség',
      own: ownScored - ownAllowed,
      opponent: oppScored - oppAllowed,
      signed: true,
    },
  ];
}

function toMetric(spec: MetricSpec): SplitMetric {
  const format = spec.signed ? formatSigned : (value: number) => formatDecimal(value, 1);

  // A sávok hossza a nagyobb abszolút értékhez normalizálódik, ahogy a
  // Szituációk képernyőn is.
  const scale = Math.max(Math.abs(spec.own), Math.abs(spec.opponent));

  return {
    label: spec.label,
    homeText: format(spec.own),
    awayText: format(spec.opponent),
    homeShare: scale > 0 ? Math.abs(spec.own) / scale : 0,
    awayShare: scale > 0 ? Math.abs(spec.opponent) / scale : 0,
    better: betterSide(spec),
  };
}

function betterSide(spec: MetricSpec): SplitSideKey | null {
  if (spec.own === spec.opponent) return null;
  const ownBetter = spec.lowerIsBetter ? spec.own < spec.opponent : spec.own > spec.opponent;
  return ownBetter ? 'home' : 'away';
}

function buildProfiles(report: ScoutingReport): ProfileView[] {
  const own = report.ownTeamProfile;

  const profiles: ProfileView[] = [
    {
      label: report.opponentTeamName,
      tempoText: `${plainText(report.profile.tempo)} tempó`,
      tags: [...report.profile.offense, ...report.profile.defense].map(plainText),
    },
  ];

  if (own) {
    profiles.push({
      label: report.ownTeamName,
      tempoText: `${plainText(own.tempo)} tempó`,
      tags: [...own.offense, ...own.defense].map(plainText),
    });
  }

  return profiles;
}

function toPoints(items: string[]): PointEntry[] {
  return items.map((text) => ({ text: plainText(text) }));
}

/** „Ha bekövetkezik" forgatókönyvek: a trigger a sor, a válaszlépés alatta. */
function buildResponses(report: ScoutingReport): PointEntry[] {
  return (report.riskScenarios ?? []).map((scenario) => ({
    text: `${plainText(scenario.title)}: ${plainText(scenario.trigger)}`,
    note: plainText(scenario.instantResponse),
  }));
}

function buildKeyPlayers(report: ScoutingReport): KeyPlayerGroup[] {
  return KEY_PLAYER_LABELS.flatMap(([key, label]) => {
    const names = report.keyPlayers[key];
    if (names.length === 0) return [];
    return [{ label, names: names.map(plainText) }];
  });
}

function buildPlayers(report: ScoutingReport): ScoutPlayerRow[] {
  return (report.advancedPlayers?.opponent ?? []).map((player) => ({
    name: plainText(player.name),
    minutesText: formatDecimal(player.minutesPerGame, 1),
    valText: formatDecimal(player.valPer36, 1),
    pointsText: formatDecimal(player.pointsPer36, 1),
  }));
}

function buildPositions(report: ScoutingReport): PositionRow[] {
  return report.positionComparison.map((row) => ({
    label: POSITION_LABELS_HU[row.position],
    ownText: formatDecimal(row.ownValPer36, 1),
    opponentText: formatDecimal(row.oppValPer36, 1),
    deltaText: formatSigned(row.deltaValPer36),
    positive: row.deltaValPer36 >= 0,
  }));
}

/**
 * Lábjegyzet szegmensenként: mekkora mintán áll a nézet. A modell a liga
 * összes csapatához méri a két szembeállított csapatot, ezt a felhasználónak
 * látnia kell.
 */
function buildCoverage(
  report: ScoutingReport,
  ownRecord: TeamRecord,
  opponentRecord: TeamRecord,
): Record<ScoutingSegment, string> {
  const sample = `${ownRecord.games} saját és ${opponentRecord.games} ellenfél-meccs szezonadatából, a liga mezőnyéhez mérve.`;

  const players =
    report.advancedPlayers?.opponent.length === 0
      ? 'Az ellenfélnél nincs elég játékperccel rendelkező játékos a rangsorhoz.'
      : `Az ellenfél legalább 80 percet játszott emberei, 36 percre vetítve. ${sample}`;

  return {
    overview: sample,
    plan: `A veszélyforrások és a támadható pontok a liga percentiliseihez mérve. ${sample}`,
    players,
  };
}

// --- Összegző szövegek. Sablonból készülnek, AI nincs a mobil appban. ---

function overviewInsight(report: ScoutingReport, chance: ChanceView): InsightFragment[] {
  const headline = report.fanSummary?.headline;
  const fragments: InsightFragment[] = [
    { text: chance.ownText, emphasis: true },
    { text: ' esély a modell szerint. ' },
  ];

  if (headline) fragments.push({ text: plainText(headline) });

  return fragments;
}

function planInsight(report: ScoutingReport): InsightFragment[] {
  const context = report.xFactorContext;
  if (!context?.primaryLabel) {
    return [{ text: 'A modell nem talált kiemelt fordulópontot ebben a párosításban.' }];
  }

  const fragments: InsightFragment[] = [
    { text: `X-faktor: ${plainText(context.primaryLabel)}.` },
  ];

  if (context.combinedDeltaPct !== undefined) {
    fragments.push({ text: ' A kulcsterületek kontrollálása ' });
    fragments.push({ text: formatSigned(context.combinedDeltaPct), emphasis: true });
    fragments.push({ text: ' százalékpontot mozdít az esélyen.' });
  }

  return fragments;
}

function playersInsight(report: ScoutingReport): InsightFragment[] {
  const note = report.positionComparisonNote;
  if (note) return [{ text: plainText(note) }];

  return [{ text: 'A posztok között nincs kiugró különbség.' }];
}
