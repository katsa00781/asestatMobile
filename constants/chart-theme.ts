/**
 * Dark Command Center – közös chart téma a victory-native XL-hez.
 *
 * A webes `asestats/lib/chart-theme.ts` mobil párja. Minden érték a
 * `constants/theme.ts` tokenjeiből származik – hardcoded hex itt is tilos.
 * A `CartesianChart` `axisOptions` propjához és a `Line` / `Bar` / `Scatter`
 * rétegek színeihez készült.
 */
import { colors } from '@/constants/theme';

/** Adatsor-színek szerep szerint (a webes `CHART_COLORS` megfelelője). */
export const chartSeries = {
  cyan: colors.accent.cyan,
  orange: colors.accent.orange,
  positive: colors.semantic.positive,
  negative: colors.semantic.negative,
  ai: colors.accent.ai,
  warning: colors.semantic.warning,
  /**
   * Összevetős chartokon a „másik" oszlop (pl. az ellenfél a Four Factors
   * diagramon) – az erős vonaltokenből, hogy jelen legyen, de ne versenyezzen
   * a kiemelt cián adatsorral. A webes `CHART_COLORS.muted` megfelelője.
   */
  neutral: colors.border.strong,
} as const;

export type ChartSeriesTone = keyof typeof chartSeries;

/**
 * A `CartesianChart` tengely- és rácsbeállításai. A `font` mezőt a hívó tölti
 * ki a `useFont(chartFontSource, chartAxis.labelSize)` eredményével – Skia
 * betűt csak hookból lehet betölteni, ezért nem tehető ebbe a modulba.
 */
export const chartAxis = {
  labelColor: colors.text.secondary,
  labelSize: 11,
  /** A tengelyvonal és a felirat közti rés. */
  labelOffset: 6,
  tickCount: { x: 4, y: 4 },
  lineColor: {
    grid: colors.border.subtle,
    frame: colors.border.subtle,
  },
  lineWidth: { grid: 1, frame: 1 },
} as const;

/**
 * A tengelyfeliratok Skia betűje – condensed, mint a weben. A `require` a
 * `constants/fonts.ts` mintáját követi (betűasset, nem kép).
 */
export const chartFontSource = require('@/assets/fonts/BarlowCondensed-SemiBold.ttf');

/** Vonal- és pontméretek. */
export const chartStroke = {
  line: 2.5,
  dot: 3.5,
} as const;

/**
 * A nulla-alapvonal színe az előjeles chartokon (momentum). Az erős
 * vonaltokenből – látszik, de nem versenyez az adatgörbével.
 */
export const chartZeroLine = colors.border.strong;

/**
 * Vászon-térközök. A `padding` a tengelyfeliratoknak hagy helyet, a
 * `domainPadding` a szélső adatpontokat tolja beljebb, hogy a vonal és a
 * pontok ne érjenek a kerethez.
 */
export const chartPadding = { left: 8, right: 12, top: 12, bottom: 4 } as const;
export const chartDomainPadding = { left: 12, right: 12, top: 24, bottom: 16 } as const;
