/**
 * A post-game elemzés nézetmodellje – a `@core/postgame-report` kimenetéből
 * képernyőre kész sorok.
 *
 * Tiszta modul, a `roles-view` mintájára: React és hálózat nincs benne. Itt
 * történik a magyarítás (D-084), a formázás és a hangnem-választás; a
 * komponensek már csak kirajzolnak.
 *
 * Minden `@core` szöveg a `plainText`-en megy át: a `postgame-report` `→` és
 * `≈` jelet is ír, ami a csomagolt betűkészletekből hiányzik (D-064).
 */
import type { PostGameReport } from '@core/postgame-report';
import type { PlayerPostGameBreakdown } from '@core/player-postgame';

import type { MatrixRow } from '@/components/StatMatrix';
import type { StatListItem } from '@/components/StatList';
import type { AccentTone } from '@/constants/theme';
import { formatDecimal, formatSigned } from '@/lib/format';
import { plainText } from '@/lib/report-format';
import type { GameReport } from '@/types/games';
import type {
  BaselineView,
  DecisiveGroup,
  HighlightView,
  KeyStatRow,
  PostgamePlayerView,
  PostgameView,
  ShotMapView,
} from '@/types/postgame';
import type { PointEntry } from '@/types/scouting';
import type { SplitMetric } from '@/types/situational';

/** A kulcsmutatók magyar feliratai a `@core` stabil kulcsai szerint (D-084). */
const KEY_STAT_LABELS: Record<string, string> = {
  efg: 'Effektív mezőny %',
  three_pct: 'Hármas %',
  assist_rate: 'Assziszt arány',
  // Oliver-féle TO rate: LV / (FGA + 0.44·FTA + LV) – web H12.
  turnover_rate: 'Eladott labda %',
  oreb_rate: 'Támadó lepattanó %',
  // FTM / FGA, nem FTA / FGA (web H12). A képlet nem fér ki a sorban (D-124).
  ft_rate: 'Büntetőpont-ráta',
};

/** Ezeknél a kisebb érték a jobb – a különbség színe megfordul. */
const LOWER_IS_BETTER = new Set(['turnover_rate']);

const SHOT_PROFILE_LABELS: Record<string, string> = {
  '2P arány': 'Kettes arány',
  '3P arány': 'Hármas arány',
  'FTM arány': 'Büntetőpont-arány',
};

const ZONES = [
  { key: 'rim', label: 'Gyűrű' },
  { key: 'paint', label: 'Festék' },
  { key: 'mid', label: 'Középtáv' },
  { key: 'corner3', label: 'Sarok hármas' },
  { key: 'aboveBreak3', label: 'Íven kívüli hármas' },
] as const;

/** A web ennyi dobás alatt figyelmeztet a zónatrendek bizonytalanságára. */
const LOW_SAMPLE = 24;

export function buildPostgameView(
  report: PostGameReport,
  playerReports: Map<string, GameReport>,
): PostgameView {
  // Kis szezonmintánál a `@core` a liga mediánt adja a `season` mezőkben (web 8ccdf47).
  const leagueBaseline = report.baseline?.kind === 'league';
  // Kis minta liga benchmark nélkül: a `season` maga a meccs, a delta 0 – nem írjuk ki (web H12).
  const comparable = report.baseline?.comparable ?? true;

  return {
    summary: plainText(report.summary),
    notes: report.dataNotes.length > 0 ? report.dataNotes.map(plainText).join(' ') : null,
    kpis: buildKpis(report),
    baseline: buildBaseline(report),
    keyStats: report.metrics.keyStats.map((metric) => ({
      key: metric.key,
      label: KEY_STAT_LABELS[metric.key] ?? plainText(metric.label),
      // Liga-referenciánál a középső oszlop maga a medián – nem ismételjük.
      subtitle:
        metric.leagueMedian !== undefined && !leagueBaseline
          ? `Ligamedián: ${formatDecimal(metric.leagueMedian, 1)}`
          : undefined,
      metrics: comparable
        ? [
            { value: formatDecimal(metric.game, 1) },
            { value: formatDecimal(metric.season, 1) },
            { value: formatSigned(metric.delta, 1), tone: deltaTone(metric.key, metric.delta) },
          ]
        : [{ value: formatDecimal(metric.game, 1) }, { value: '–' }, { value: '–' }],
    })),
    ownName: report.teamName,
    opponentName: report.opponentName,
    boxScore: buildBoxScore(report),
    pointSources: buildPointSources(report),
    shotProfile: report.charts.shotProfile.map((datum) => ({
      label: SHOT_PROFILE_LABELS[datum.label] ?? plainText(datum.label),
      note: comparable
        ? `${leagueBaseline ? 'Ligamedián' : 'Szezon'}: ${formatDecimal(datum.season, 1)}%`
        : null,
      valueText: `${formatDecimal(datum.game, 1)}%`,
      percent: datum.game,
      // Megoszlás, nem hatékonyság: semleges cián sáv, mint a leíró metrikáknál (D-085).
      tone: 'cyan',
    })),
    shotMap: buildShotMap(report),
    decisiveGroups: buildDecisiveGroups(report),
    positiveImpact: joinNames(report.playerImpact.positive),
    negativeImpact: joinNames(report.playerImpact.negative),
    highlights: buildHighlights(report),
    players: report.playerReport.players.map((player) =>
      toPlayerView(player, playerReports.get(player.playerId) ?? null),
    ),
    strengths: toEntries(report.strengths),
    problems: toEntries(report.problems),
    nextFocus: toEntries(report.nextFocus),
  };
}

function buildBaseline(report: PostGameReport): BaselineView {
  const baseline = report.baseline;
  const league = baseline?.kind === 'league';

  return {
    sectionLabel:
      baseline?.comparable === false
        ? 'Kulcsmutatók – meccs'
        : `Kulcsmutatók – meccs vs. ${league ? 'ligamedián' : 'szezon'}`,
    columnLabel: league ? 'Liga' : 'Szezon',
    smallSampleNote: !baseline?.smallSample
      ? null
      : baseline.comparable
        ? `${baseline.seasonGames} szezonmeccs – a referencia: ${baseline.noun}.`
        : `${baseline.seasonGames} szezonmeccs, ligamedián nélkül – nincs referencia.`,
  };
}

function buildKpis(report: PostGameReport): PostgameView['kpis'] {
  const { pointsFor, pointsAgainst, margin, pace, efg } = report.metrics;

  return {
    scoreText: `${pointsFor}–${pointsAgainst}`,
    marginTrend: {
      direction: margin > 0 ? 'up' : margin < 0 ? 'down' : 'flat',
      value: formatSigned(margin, 1),
      tone: margin >= 0 ? 'positive' : 'negative',
    },
    paceText: formatDecimal(pace, 1),
    efgText: `${formatDecimal(efg, 1)}%`,
  };
}

/** Egy saját – ellenfél sor nyersen; mindegyiknél a nagyobb érték a jobb. */
interface SplitSpec {
  label: string;
  own: number;
  opponent: number;
  /** Százalék (egy tizedes) – egyébként darabszám. */
  percent?: boolean;
}

/** A webes „Box score alapmutatók” tábla (FG%, FT%, lepattanók). */
function buildBoxScore(report: PostGameReport): SplitMetric[] | null {
  const box = report.metrics.boxScore;
  if (!box?.opponent) return null;
  const { own, opponent } = box;

  return [
    { label: 'Mezőny %', own: own.fgPct, opponent: opponent.fgPct, percent: true },
    { label: 'Büntető %', own: own.ftPct, opponent: opponent.ftPct, percent: true },
    { label: 'Lepattanó', own: own.reb, opponent: opponent.reb },
    { label: 'Támadó lepattanó', own: own.oreb, opponent: opponent.oreb },
    { label: 'Védő lepattanó', own: own.dreb, opponent: opponent.dreb },
  ].map(toSplitMetric);
}

/**
 * A gyors befejezés nem jegyzőkönyvi gyorsindítás: labdaszerzés vagy
 * védőlepattanó utáni pont a küszöbön belül – ezért áll a feliratban a küszöb.
 */
function buildPointSources(report: PostGameReport): SplitMetric[] | null {
  const sources = report.metrics.pointSources;
  if (!sources) return null;
  const { own, opponent } = sources;

  return [
    { label: 'Második esélyből', own: own.secondChancePoints, opponent: opponent.secondChancePoints },
    { label: 'Labdaeladásból', own: own.pointsOffTurnovers, opponent: opponent.pointsOffTurnovers },
    {
      label: `Gyors befejezés (≤ ${sources.quickFinishSeconds} mp)`,
      own: own.quickFinishPoints,
      opponent: opponent.quickFinishPoints,
    },
  ].map(toSplitMetric);
}

/** A sávok a nagyobb értékhez normalizálódnak, ahogy az élő meccsstatisztikánál. */
function toSplitMetric(spec: SplitSpec): SplitMetric {
  const format = (value: number) => (spec.percent ? formatDecimal(value, 1) : String(value));
  const scale = Math.max(spec.own, spec.opponent);

  return {
    label: spec.label,
    homeText: format(spec.own),
    awayText: format(spec.opponent),
    homeShare: scale > 0 ? spec.own / scale : 0,
    awayShare: scale > 0 ? spec.opponent / scale : 0,
    better: spec.own === spec.opponent ? null : spec.own > spec.opponent ? 'home' : 'away',
  };
}

/** A különbség színe: a legtöbb mutatónál a növekedés jó, az eladott labdánál fordítva. */
function deltaTone(key: string, delta: number): AccentTone | undefined {
  if (delta === 0) return undefined;
  const improved = LOWER_IS_BETTER.has(key) ? delta < 0 : delta > 0;
  return improved ? 'positive' : 'negative';
}

function buildShotMap(report: PostGameReport): ShotMapView | null {
  const shotMap = report.shotMap;
  if (!shotMap?.available || !shotMap.comparison || !shotMap.team) return null;

  const { team, season, comparison: delta } = shotMap;

  const rates: StatListItem[] = [
    shotItem('Gyűrű arány', `${formatDecimal(team.rimRate, 1)}%`, delta.rimRateDelta),
    shotItem('Középtáv arány', `${formatDecimal(team.midRate, 1)}%`, delta.midRateDelta),
    shotItem('Hármas arány', `${formatDecimal(team.threeRate, 1)}%`, delta.threeRateDelta),
    shotItem('Sarok hármas arány', `${formatDecimal(team.corner3Rate, 1)}%`, delta.corner3RateDelta),
  ];

  const efficiency: StatListItem[] = [
    shotItem('Gyűrű FG%', `${formatDecimal(team.rimPct, 1)}%`, delta.rimPctDelta),
    shotItem('Hármas FG%', `${formatDecimal(team.threePct, 1)}%`, delta.threePctDelta),
    shotItem('Dobásminőség-index', team.shotQualityIndex.toFixed(2), delta.shotQualityDelta),
  ];

  const zoneRows: MatrixRow[] = ZONES.map(({ key, label }) => {
    const zone = team.zones[key];
    const share = team.attempts > 0 ? (zone.attempts / team.attempts) * 100 : 0;
    return {
      label,
      values: [
        String(zone.attempts),
        String(zone.made),
        formatDecimal(zone.pct, 1),
        formatDecimal(share, 1),
        season ? formatDecimal(season.zones[key].pct, 1) : '–',
      ],
    };
  });

  return {
    title: `Kísérletek: ${team.attempts} · FG%: ${formatDecimal(team.fgPct, 1)}%`,
    rates,
    efficiency,
    zoneColumns: [
      { label: 'Kís.' },
      { label: 'Tal.' },
      { label: '%', width: 44 },
      { label: 'Arány', width: 48 },
      { label: 'Szez. %', width: 52 },
    ],
    zoneRows,
    sampleNote:
      team.attempts < LOW_SAMPLE
        ? `Alacsony mintaszám (${team.attempts} dobás), a zónák trendje óvatosan értelmezendő.`
        : null,
  };
}

/**
 * A webes `shotDeltaTone`: 0.2 alatti vagy nem véges eltérésnél semleges,
 * egyébként az előjel dönt – mind a hét értékre egységesen.
 */
function shotItem(label: string, value: string, delta: number): StatListItem {
  const neutral = !Number.isFinite(delta) || Math.abs(delta) < 0.2;
  return {
    label,
    value: Number.isFinite(delta) ? `${value} (${formatSigned(delta, 1)})` : value,
    tone: neutral ? undefined : delta > 0 ? 'positive' : 'negative',
  };
}

/** Csoportosítás tengely + típus szerint, a `@core` sorrendjében. */
function buildDecisiveGroups(report: PostGameReport): DecisiveGroup[] {
  const groups = new Map<string, DecisiveGroup>();

  for (const factor of report.decisiveFactorMeta) {
    const key = `${factor.axis}|${factor.type}`;
    const group = groups.get(key) ?? {
      title: `${factor.axis === 'offense' ? 'Támadás' : 'Védekezés'} – ${factor.type}`,
      axis: factor.axis,
      items: [],
    };
    group.items.push({
      text: plainText(factor.label),
      // Az explicit előjel a mérvadó (web H12); a szövegből becslés csak a
      // `tone` nélküli, régi riportokra marad.
      negative: factor.tone
        ? factor.tone === 'negative'
        : isNegativeDecisiveLabel(factor.label, factor.axis),
    });
    groups.set(key, group);
  }

  return [...groups.values()];
}

/**
 * A webes `isNegativeDecisiveLabel` (`SeasonComparison.tsx`) 1:1-es másolata.
 * Nem `@core`, ezért itt él: a tényező hangnemét a szövegből következteti ki.
 * Csak tartalék a `tone` nélküli tényezőkre – az új címkéknél téved.
 */
export function isNegativeDecisiveLabel(label: string, axis: 'offense' | 'defense'): boolean {
  const lower = label.toLowerCase();
  const neg = /-\d+(?:[.,]\d+)?\s*pp/.test(lower);
  const pos = /\+\d+(?:[.,]\d+)?\s*pp/.test(lower);
  if (axis === 'defense') {
    if (/limit[aá]lt|kontroll|megfog|zavar/.test(lower)) return false;
    if (/probl[eé]ma|gyenge|romlott|engedett|visszaesett|hi[aá]ny/.test(lower)) return true;
    return neg && !pos;
  }
  if (/hi[aá]ny|gyenge|vissza|akadozott|sz[eé]tesett|alacsony|probl[eé]ma/.test(lower)) return true;
  return neg && !pos;
}

function buildHighlights(report: PostGameReport): HighlightView[] {
  const { mvp, engines, sparkPlugs } = report.playerReport.highlights;

  return [
    highlight('Meccs motor', 'positive', mvp, 'Nincs kiemelt motor ezen a meccsen.'),
    highlight('Stabil alappillérek', 'cyan', engines[0], 'Nincs stabil másodlagos motor.'),
    highlight('Padlóról érkező szikra', 'warning', sparkPlugs[0], 'Nem volt kiugró spark plug.'),
  ];
}

function highlight(
  label: string,
  tone: AccentTone,
  player: PlayerPostGameBreakdown | undefined,
  emptyText: string,
): HighlightView {
  return {
    label,
    tone,
    name: player ? player.name : null,
    summary: player ? plainText(player.summaryLine) : emptyText,
    impactLabel: player ? plainText(player.impactLabel) : null,
  };
}

function toPlayerView(
  player: PlayerPostGameBreakdown,
  report: GameReport | null,
): PostgamePlayerView {
  return {
    playerId: player.playerId,
    name: player.name,
    summary: plainText(player.summaryLine),
    impactLabel: plainText(player.impactLabel),
    usageLabel: plainText(player.usageLabel),
    tsText: player.hasShotAttempts ? `${formatDecimal(player.tsPct, 1)}%` : '–',
    valText: String(player.val),
    valPer36Text: formatDecimal(player.valPer36, 1),
    strengths: toEntries(player.strengths),
    issues: toEntries(player.issues),
    focus: toEntries(player.focus),
    report,
  };
}

function toEntries(lines: string[]): PointEntry[] {
  return lines.map((line) => ({ text: plainText(line) }));
}

function joinNames(names: string[]): string {
  return names.length > 0 ? names.map(plainText).join(', ') : '–';
}
