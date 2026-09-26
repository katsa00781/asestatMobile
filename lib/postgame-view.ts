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
  DecisiveGroup,
  HighlightView,
  KeyStatRow,
  PostgamePlayerView,
  PostgameView,
  ShotMapView,
} from '@/types/postgame';
import type { PointEntry } from '@/types/scouting';

/** A kulcsmutatók magyar feliratai a `@core` stabil kulcsai szerint (D-084). */
const KEY_STAT_LABELS: Record<string, string> = {
  efg: 'Effektív mezőny %',
  three_pct: 'Hármas %',
  assist_rate: 'Assziszt arány',
  turnover_rate: 'Eladott labda %',
  oreb_rate: 'Támadó lepattanó %',
  ft_rate: 'Büntetőráta',
};

/** Ezeknél a kisebb érték a jobb – a különbség színe megfordul. */
const LOWER_IS_BETTER = new Set(['turnover_rate']);

const SHOT_PROFILE_LABELS: Record<string, string> = {
  '2P arány': 'Kettes arány',
  '3P arány': 'Hármas arány',
  'FT arány': 'Büntető arány',
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
  return {
    summary: plainText(report.summary),
    notes: report.dataNotes.length > 0 ? report.dataNotes.map(plainText).join(' ') : null,
    kpis: buildKpis(report),
    keyStats: report.metrics.keyStats.map((metric) => ({
      key: metric.key,
      label: KEY_STAT_LABELS[metric.key] ?? plainText(metric.label),
      subtitle:
        metric.leagueMedian !== undefined
          ? `Ligamedián: ${formatDecimal(metric.leagueMedian, 1)}`
          : undefined,
      metrics: [
        { value: formatDecimal(metric.game, 1) },
        { value: formatDecimal(metric.season, 1) },
        { value: formatSigned(metric.delta, 1), tone: deltaTone(metric.key, metric.delta) },
      ],
    })),
    shotProfile: report.charts.shotProfile.map((datum) => ({
      label: SHOT_PROFILE_LABELS[datum.label] ?? plainText(datum.label),
      note: `Szezon: ${formatDecimal(datum.season, 1)}%`,
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
      negative: isNegativeDecisiveLabel(factor.label, factor.axis),
    });
    groups.set(key, group);
  }

  return [...groups.values()];
}

/**
 * A webes `isNegativeDecisiveLabel` (`SeasonComparison.tsx`) 1:1-es másolata.
 * Nem `@core`, ezért itt él: a tényező hangnemét a szövegből következteti ki.
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
