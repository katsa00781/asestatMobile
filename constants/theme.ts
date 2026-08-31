/**
 * Dark Command Center design tokenek – Single Source of Truth.
 *
 * Forrás: a `CLAUDE.md` tokentáblája + a `docs/mockups/` elfogadott mockupjai.
 * A `tailwind.config.ts` ebből a fájlból olvas, hardcoded hex a komponensekben tilos.
 * Lásd `docs/feature-tasks.md` – D-008 (a mockup a mérvadó a skálákra).
 */

export const colors = {
  bg: {
    /** Oldal háttér */
    base: '#050B14',
    /** Card alap */
    surface1: '#0A1628',
    /** Emelt / input / sheet */
    surface2: '#0F1F3D',
    /** Nested / aktív */
    surface3: '#162440',
  },
  accent: {
    /** Primary accent */
    cyan: '#00D4FF',
    /** CTA / kiemelés */
    orange: '#FF6B35',
    /** AI tartalom */
    ai: '#7C3AED',
  },
  semantic: {
    positive: '#10D98A',
    negative: '#FF4757',
    warning: '#FFB627',
  },
  text: {
    primary: '#E8F4FF',
    secondary: '#7A9ABB',
    muted: '#4A6D95',
    /** Sötét accent háttéren (pl. cián elsődleges gomb felirata) */
    onAccent: '#050B14',
    /** AI badge felirat – lila háttéren a `accent.ai` olvashatatlan lenne */
    ai: '#C4B5FD',
  },
  border: {
    subtle: '#1E3A5F',
    active: '#2A4468',
    strong: '#3A5478',
    /** Mátrix / lista belső elválasztó – a subtle-nél is halkabb */
    hairline: '#0F2040',
  },
  /** Kizárólag gradiens- és felületárnyalatokhoz, közvetlenül ne használd */
  shade: {
    /** Cián gradiens sötét vége (progress bar) */
    cyanDeep: '#0096B8',
    /** Aktív listasor árnyalata */
    rowActive: '#16233D',
    /** Sheet fejléc árnyalata */
    sheetHeader: '#101E33',
  },
} as const;

/**
 * Accent glow rétegek. RN-ben színes elmosott árnyék nincs (lásd D-005),
 * ezért a glow = accent border + alacsony opacitású accent háttér.
 */
export const glow = {
  cyan: { fill: 'rgba(0,212,255,0.14)', border: 'rgba(0,212,255,0.30)' },
  orange: { fill: 'rgba(255,107,53,0.14)', border: 'rgba(255,107,53,0.30)' },
  ai: { fill: 'rgba(124,58,237,0.16)', border: 'rgba(124,58,237,0.40)' },
  positive: { fill: 'rgba(16,217,138,0.14)', border: 'rgba(16,217,138,0.30)' },
  negative: { fill: 'rgba(255,71,87,0.14)', border: 'rgba(255,71,87,0.30)' },
  warning: { fill: 'rgba(255,182,39,0.14)', border: 'rgba(255,182,39,0.30)' },
} as const;

/** 4pt rács */
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
} as const;

export const radius = {
  /** Badge */
  xs: 2,
  /** Progress bar */
  pill: 3,
  /** Input */
  sm: 4,
  /** Gomb / tab */
  md: 6,
  /** Lista- és listasor card */
  lg: 10,
  /** StatTile / sheet / modal */
  xl: 14,
} as const;

/** pt-alapú típusskála. A 9/10/14/22/28/34/40 a mockupokból jön (D-008). */
export const fontSize = {
  micro: 9,
  tiny: 10,
  label: 11,
  xs: 12,
  sm: 13,
  base: 14,
  md: 15,
  lg: 17,
  xl: 20,
  h3: 22,
  h2: 24,
  stat: 28,
  h1: 32,
  display: 34,
  score: 40,
} as const;

/**
 * expo-font családnevek. A tényleges fájlok: `assets/fonts/`.
 * Barlow Condensed: H1–H4, label, badge, gomb, tab.
 * DM Sans: body, leírás, riportszöveg.
 * JetBrains Mono: MINDEN numerikus érték (`fontVariant: ['tabular-nums']`).
 */
export const fontFamily = {
  condensed: 'BarlowCondensed-SemiBold',
  condensedBold: 'BarlowCondensed-Bold',
  body: 'DMSans-Regular',
  bodyMedium: 'DMSans-Medium',
  bodyBold: 'DMSans-Bold',
  mono: 'JetBrainsMono-Medium',
  monoBold: 'JetBrainsMono-SemiBold',
} as const;

/**
 * Betűköz. RN a `letterSpacing`-et pt-ban várja, a mockup em-ben adja meg,
 * ezért a szorzót a hívó helyen a fontSize-zal kell beszorozni: lásd `tracking()`.
 */
export const tracking = {
  /** Nagy numerikus értékek (score, StatTile) – negatív */
  tight: -0.03,
  /** Közepes numerikus értékek */
  snug: -0.02,
  none: 0,
  /** Gombfelirat */
  wide: 0.08,
  /** ALL CAPS label – az alapértelmezett */
  label: 0.12,
  /** Tab / kisebb ALL CAPS */
  wider: 0.14,
  /** Kiemelt eyebrow */
  widest: 0.18,
} as const;

/** em → pt átváltás a `letterSpacing` prop-hoz. */
export const letterSpacing = (size: number, em: number): number => size * em;

export const duration = {
  fast: 200,
  base: 300,
  slow: 400,
  /** Lista-belépés stagger elemenként */
  stagger: 60,
} as const;

/** Minimális érintési célpont – ennél kisebb vizuális elemhez hitSlop kell. */
export const tapTarget = 44;

export const theme = {
  colors,
  glow,
  spacing,
  radius,
  fontSize,
  fontFamily,
  tracking,
  duration,
  tapTarget,
} as const;

export type Theme = typeof theme;
