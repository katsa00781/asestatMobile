/**
 * A Szerepkör-elemzés képernyő megjelenítési modelljét építi fel.
 *
 * Bemenet: a `@core/team-analysis` riportja és a minta mérete.
 * Kimenet: kész sorok formázott értékekkel, plusz a három szegmens összegző
 * szövege. Tiszta modul – se hálózat, se React.
 *
 * Két helyen tér el a `@core`-tól, mindkettő megjelenítési döntés:
 *
 * 1. A liga-percentilisek feliratai itt magyarul állnak. A `@core` `label`
 *    mezője félig angol („FT rate", „Assist rate"), a mobil UI viszont magyar.
 * 2. A sávok színe csak a **teljesítmény-metrikáknál** minőségi (zöld/sárga/
 *    piros). A leíró metrikák (tempó, dobásmegoszlás, labdaigény, magasemberes
 *    perc) semleges ciánt kapnak: ott a magas percentilis nem „jobb", csak
 *    másfajta játék.
 * 3. A `@core` mondataiban és klaszterneveiben maradt angol szakszavak
 *    (szerepkörkulcsok, „Defense-first") magyarra cserélődnek – a mobil UI
 *    magyar (D-084).
 *
 * A `@core` mondatai `→` és `≈` jelet használnak, ami egyik csomagolt
 * betűkészletben sincs meg, ezért minden átvett szöveg a `plainText`-en megy
 * keresztül (D-064 lelete).
 */
import { ROLE_LABELS_HU, type RoleKey } from '@core/player-analysis';
import type { Position } from '@core/positions';
import type { TeamAnalysis } from '@core/team-analysis';

import { POSITION_LABELS_HU } from '@/data/position-labels';
import { formatDecimal, formatSigned, shortenPlayerName } from '@/lib/format';
import { plainText } from '@/lib/report-format';
import type { AccentTone } from '@/constants/theme';
import type { MeterEntry, RolesMeta, RolesSegment, RolesView } from '@/types/roles';
import type { PointEntry, ProfileView } from '@/types/scouting';
import type { InsightFragment } from '@/types/situational';

/** Hány nevet írunk ki egy szerepkör vagy poszt alá, mielőtt levágnánk. */
const MAX_NAMES = 4;

/** Ennyi embertől számít redundánsnak egy szerepkör (a `@core` küszöbe). */
const REDUNDANT_FROM = 3;

/**
 * A liga-klaszterek magyar neve. A `@core` öt címkéje közül három félig angol
 * („Transition-heavy", „Halfcourt, playmaker-domináns", „Defense-first").
 */
const CLUSTER_LABELS: Record<string, string> = {
  'Transition-heavy': 'Lerohanás-fókuszú',
  'Halfcourt, playmaker-domináns': 'Félpályás, játékszervező-központú',
  'Defense-first': 'Védekezés-központú',
};

/**
 * A `@core` a kockázatlistát egy fejlécsorral kezdi, a riport viszont már
 * fejléc nélkül adja vissza a listát – a magára maradt sor kiszűrendő.
 */
const RISK_HEADING = 'Legmagasabb kockázat:';

/** A szerepkörkulcsok hosszabbtól rövidebbig, hogy a csere ne vágjon félbe. */
const ROLE_KEYS = (Object.keys(ROLE_LABELS_HU) as RoleKey[]).sort(
  (a, b) => b.length - a.length,
);

/** A liga-percentilis sorok magyar feliratai a `@core` kulcsai szerint. */
const LEAGUE_LABELS: Record<string, string> = {
  pace: 'Tempó',
  two_rate: 'Kétpontos arány',
  three_rate: 'Hármas arány',
  three_pct: 'Hármas %',
  ft_rate: 'Büntetőráta',
  assist_rate: 'Assziszt arány',
  usage_concentration: 'Labdaigény-koncentráció',
  frontcourt_presence: 'Magasemberes játékperc',
  ortg: 'Támadó rating',
  drtg: 'Védekező rating',
  net_rtg: 'Nettó rating',
};

/** Leíró metrikák: a magas érték nem jobb, csak másfajta játék. */
const DESCRIPTIVE_KEYS = new Set([
  'pace',
  'two_rate',
  'three_rate',
  'usage_concentration',
  'frontcourt_presence',
]);

/** Arányként (0–1) tárolt metrikák – ezek százalékos alakban olvashatók. */
const RATIO_KEYS = new Set([
  'two_rate',
  'three_rate',
  'ft_rate',
  'assist_rate',
  'usage_concentration',
  'frontcourt_presence',
]);

const POSITION_ORDER: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];

/** A keretkockázati jelzések magyar mondatai. */
const FLAG_TEXTS: Record<keyof TeamAnalysis['rosterSummary']['flags'], string> = {
  scorerDependency: 'A támadójáték két emberre támaszkodik – kiesésük esetén nincs kész alternatíva.',
  lowPlaymakingDepth: 'Kevés a szervező: kettőnél kevesebb játékos visz játéképítő szerepkört.',
  weakReboundingPresence: 'Kevés a magasemberes játékperc, ez lepattanóhátrányt hozhat.',
};

export function buildRolesView(analysis: TeamAnalysis, meta: RolesMeta): RolesView {
  const roster = analysis.rosterSummary;
  const risks = analysis.riskPriorities.map(coreText);

  return {
    teamName: analysis.teamName,
    // A három lista diszjunkt: ami többszörösen lefedett, az nem szerepel a
    // lefedettek között is – különben ugyanaz a szerepkör kétszer állna a
    // képernyőn.
    covered: buildRoles(roster, (count) => count > 0 && count < REDUNDANT_FROM),
    redundant: buildRoles(roster, (count) => count >= REDUNDANT_FROM),
    missing: buildRoles(roster, (count) => count === 0),
    // A `@core` a kockázatokat a keret-értelmezés végére is odafűzi, a
    // fejlécsorukkal együtt; itt csak egyszer jelenjenek meg, a saját
    // szekciójukban.
    notes: analysis.rosterInsights
      .map(coreText)
      .filter((item) => item !== RISK_HEADING && !risks.includes(item))
      .map((text) => ({ text })),
    usage: buildUsage(roster),
    positions: buildPositions(roster),
    flags: buildFlags(roster.flags),
    heightText:
      roster.avgHeightOverall !== null
        ? `Átlagmagasság: ${formatDecimal(roster.avgHeightOverall, 1)} cm`
        : null,
    profile: buildProfile(analysis),
    league: buildLeague(analysis),
    clusterPeersText:
      analysis.leagueProfile.clusterPeers.length > 0
        ? `Hasonló játék: ${analysis.leagueProfile.clusterPeers.map(plainText).join(' · ')}`
        : null,
    strengths: toPoints(analysis.strengths),
    limitations: toPoints(analysis.limitations),
    risks: risks.map((text) => ({ text })),
    coverage: buildCoverage(analysis, meta),
    insights: {
      roles: rolesInsight(analysis),
      load: loadInsight(analysis),
      profile: profileInsight(analysis),
    },
  };
}

/** Egy szerepkör-lista: a szűrőnek megfelelő szerepkörök, a betöltőikkel. */
function buildRoles(
  roster: TeamAnalysis['rosterSummary'],
  accepts: (count: number) => boolean,
): PointEntry[] {
  return Object.entries(roster.roleCounts).flatMap(([role, count]) => {
    if (!accepts(count)) return [];

    const label = ROLE_LABELS_HU[role as RoleKey] ?? role;
    const players = roster.rolePlayers[role] ?? [];
    if (players.length === 0) return [{ text: label }];

    return [
      {
        text: count >= REDUNDANT_FROM ? `${label} (${count})` : label,
        note: nameList(players),
      },
    ];
  });
}

/** Legfeljebb négy név, a maradék jelezve. */
function nameList(list: string[]): string {
  const shown = list.slice(0, MAX_NAMES).map(shortenPlayerName).join(' · ');
  return list.length > MAX_NAMES ? `${shown} +${list.length - MAX_NAMES}` : shown;
}

function buildUsage(roster: TeamAnalysis['rosterSummary']): MeterEntry {
  const percent = roster.top2UsageShare * 100;

  return {
    label: 'Két legtöbbet birtokló ember',
    note: 'A csapat összes dobása, büntetője és eladott labdája közül ennyi jut rájuk.',
    valueText: `${formatDecimal(percent, 1)}%`,
    percent,
    // A `@core` 55%-tól jelzi a scorer-függőséget – a sáv ezt tükrözi.
    tone: roster.flags.scorerDependency ? 'warning' : 'cyan',
  };
}

function buildPositions(roster: TeamAnalysis['rosterSummary']): MeterEntry[] {
  return POSITION_ORDER.flatMap((position) => {
    const share = roster.positionMinutesShare[position];
    if (share <= 0) return [];

    return [
      {
        label: POSITION_LABELS_HU[position],
        note: nameList(roster.positionPlayers[position] ?? []) || null,
        valueText: `${formatDecimal(share, 1)}%`,
        percent: share,
        tone: 'cyan' as AccentTone,
      },
    ];
  });
}

function buildFlags(flags: TeamAnalysis['rosterSummary']['flags']): PointEntry[] {
  return (Object.keys(FLAG_TEXTS) as Array<keyof typeof FLAG_TEXTS>)
    .filter((key) => flags[key])
    .map((key) => ({ text: FLAG_TEXTS[key] }));
}

/**
 * A stílusbadge-ek: elöl a liga-klaszter, utána a támadó és védekező jegyek.
 * A `@core` a klasztert a támadó jegyek közé is beszúrja („Liga-klaszter: …"),
 * ezt itt kiszűrjük, hogy ne szerepeljen kétszer.
 */
function buildProfile(analysis: TeamAnalysis): ProfileView {
  const tags = [...analysis.style.offense, ...analysis.style.defense]
    .filter((tag) => !tag.startsWith('Liga-klaszter'))
    .map(plainText);

  return {
    label: plainText(analysis.teamName),
    tempoText: clusterLabel(analysis.leagueProfile.clusterLabel),
    tags,
  };
}

function buildLeague(analysis: TeamAnalysis): MeterEntry[] {
  return analysis.leagueProfile.entries.map((entry) => ({
    label: LEAGUE_LABELS[entry.key] ?? plainText(entry.label),
    note: `${plainText(entry.tier)} · ${leagueValue(entry.key, entry.value)}`,
    valueText: `${entry.percentile}.`,
    percent: entry.percentile,
    tone: DESCRIPTIVE_KEYS.has(entry.key) ? 'cyan' : percentileTone(entry.percentile),
  }));
}

/** A nyers érték olvasható alakja – a webes `formatLeagueValue` párja. */
function leagueValue(key: string, value: number): string {
  if (!Number.isFinite(value)) return 'nincs adat';
  if (RATIO_KEYS.has(key)) return `${formatDecimal(value * 100, 1)}%`;
  if (key === 'three_pct') return `${formatDecimal(value, 1)}%`;
  if (key === 'net_rtg') return formatSigned(value, 1);
  return formatDecimal(value, 1);
}

function percentileTone(percentile: number): AccentTone {
  if (percentile >= 60) return 'positive';
  if (percentile >= 40) return 'warning';
  return 'negative';
}

function toPoints(items: string[]): PointEntry[] {
  return items.map((text) => ({ text: coreText(text) }));
}

/**
 * Egy `@core` mondat megjelenítésre készen: hiányzó glifák pótolva, és az
 * angol szerepkörkulcsok („Energy Big hiány") magyar felirattal.
 */
function coreText(text: string): string {
  return ROLE_KEYS.reduce(
    (result, key) => result.split(key).join(ROLE_LABELS_HU[key]),
    plainText(text),
  );
}

function clusterLabel(label: string): string {
  return CLUSTER_LABELS[label] ?? plainText(label);
}

/**
 * Lábjegyzet szegmensenként: mekkora mintán áll a nézet. A szerepköröket a
 * modell a liga **összes** játékosának szezonstatisztikájából számolja, a
 * percentiliseket a liga összes csapatából – ezt a felhasználónak látnia kell.
 */
function buildCoverage(analysis: TeamAnalysis, meta: RolesMeta): Record<RolesSegment, string> {
  const sample = `${meta.games} meccs szezonadatából, ${meta.teamCount} csapat mezőnyéhez mérve.`;

  const opponentNote = analysis.leagueProfile.opponentStatsComplete
    ? `Az ellenfél-oldali adat ${meta.pairedGames} meccsre állt össze.`
    : 'Ellenfél-oldali statisztika nélkül a védekező és a nettó rating nem értelmezhető.';

  return {
    roles: `A szerepköröket a modell a liga ${meta.ratedPlayers} játékosának szezonstatisztikájából számolja; ebben a keretben ${meta.rosterSize} ember szerepel.`,
    load: `A játékpercek és a labdaigény a keret ${meta.rosterSize} emberéből, ${sample}`,
    profile: `${sample} ${opponentNote}`,
  };
}

// --- Összegző szövegek. Sablonból készülnek, AI nincs a mobil appban. ---

function rolesInsight(analysis: TeamAnalysis): InsightFragment[] {
  const counts = Object.values(analysis.rosterSummary.roleCounts);
  const covered = counts.filter((count) => count > 0).length;
  const missing = counts.length - covered;

  const fragments: InsightFragment[] = [
    { text: 'A keret ' },
    { text: `${covered}`, emphasis: true },
    { text: ` szerepkört fed le a modell ${counts.length} kategóriájából` },
  ];

  if (missing > 0) {
    fragments.push({ text: ', ' });
    fragments.push({ text: `${missing}`, emphasis: true });
    fragments.push({ text: ' pedig üresen marad.' });
  } else {
    fragments.push({ text: '.' });
  }

  return fragments;
}

function loadInsight(analysis: TeamAnalysis): InsightFragment[] {
  const roster = analysis.rosterSummary;
  const share = roster.top2UsageShare * 100;
  const big = roster.positionMinutesShare.PF + roster.positionMinutesShare.C;

  return [
    { text: 'A két legtöbbet birtokló ember a támadások ' },
    { text: `${formatDecimal(share, 1)}%`, emphasis: true },
    { text: '-át viszi, a magasemberek a játékpercek ' },
    { text: `${formatDecimal(big, 1)}%`, emphasis: true },
    { text: '-át.' },
  ];
}

function profileInsight(analysis: TeamAnalysis): InsightFragment[] {
  const { clusterLabel: cluster, clusterCount, teamCount } = analysis.leagueProfile;
  const scope =
    clusterCount !== null && teamCount !== null ? ` (${clusterCount}/${teamCount} csapat)` : '';

  const fragments: InsightFragment[] = [
    { text: `Liga-klaszter: ${clusterLabel(cluster)}${scope}. ` },
  ];

  const best = [...analysis.leagueProfile.entries].sort((a, b) => b.percentile - a.percentile)[0];
  if (best) {
    fragments.push({ text: `A legerősebb mutató a(z) ${LEAGUE_LABELS[best.key] ?? best.label}: ` });
    fragments.push({ text: `${best.percentile}.`, emphasis: true });
    fragments.push({ text: ' percentilis.' });
  }

  return fragments;
}
