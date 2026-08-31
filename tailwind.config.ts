import type { Config } from 'tailwindcss';

// A tokenek egyetlen forrása a constants/theme.ts – itt hex értéket ne írj.
import { colors, fontFamily, fontSize, radius } from './constants/theme';

/**
 * A spacing kulcsok = a px érték (`p-14` → 14px). A mockupok px-ben készültek,
 * így nincs átváltás fejben. Lásd docs/feature-tasks.md – D-008.
 */
const px = (values: number[]) =>
  Object.fromEntries(values.map((v) => [String(v), `${v}px`]));

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    // Teljes felülírás: csak a Dark Command Center palettája létezik.
    colors: {
      transparent: 'transparent',
      base: colors.bg.base,
      surface1: colors.bg.surface1,
      surface2: colors.bg.surface2,
      surface3: colors.bg.surface3,

      cyan: colors.accent.cyan,
      orange: colors.accent.orange,
      ai: colors.accent.ai,

      positive: colors.semantic.positive,
      negative: colors.semantic.negative,
      warning: colors.semantic.warning,

      primary: colors.text.primary,
      secondary: colors.text.secondary,
      muted: colors.text.muted,
      'on-accent': colors.text.onAccent,
      'ai-text': colors.text.ai,

      line: colors.border.subtle,
      'line-active': colors.border.active,
      'line-strong': colors.border.strong,
      hairline: colors.border.hairline,
      'line-row': colors.border.row,

      scrim: colors.scrim,
      'cyan-deep': colors.shade.cyanDeep,
      'sheet-header': colors.shade.sheetHeader,
    },
    spacing: px([
      0, 1, 2, 3, 4, 6, 8, 10, 12, 14, 16, 17, 18, 20, 24, 28, 32, 36, 40, 44,
      48, 52, 56, 64, 96, 108,
    ]),
    borderRadius: {
      none: '0px',
      xs: `${radius.xs}px`,
      pill: `${radius.pill}px`,
      sm: `${radius.sm}px`,
      md: `${radius.md}px`,
      lg: `${radius.lg}px`,
      xl: `${radius.xl}px`,
      full: '9999px',
    },
    fontSize: Object.fromEntries(
      Object.entries(fontSize).map(([key, value]) => [key, `${value}px`]),
    ),
    fontFamily: {
      condensed: [fontFamily.condensed],
      'condensed-bold': [fontFamily.condensedBold],
      body: [fontFamily.body],
      'body-medium': [fontFamily.bodyMedium],
      'body-bold': [fontFamily.bodyBold],
      mono: [fontFamily.mono],
      'mono-bold': [fontFamily.monoBold],
    },
    extend: {},
  },
  plugins: [],
};

export default config;
