/**
 * A bajnoki tabella egy sora és a fölötte álló oszlopfejléc.
 *
 * Mockup: `docs/mockups/extracted/tabella.html`. A sor nyolc oszlopa fix
 * szélességű (a csapatnév kivételével, ami a maradékot kapja), ezért a fejléc
 * és a sorok ugyanabból a `COLUMNS` listából dolgoznak – így nem csúszhatnak el.
 *
 * A kiemelt sor (a szűrőben kiválasztott csapat) surface2 hátteret és bal
 * oldali 2pt-os cián sávot kap. A sor ezért **teljes szélességű**, a 16pt-os
 * behúzás a tartalmon van: így a sáv a kijelző széléig ér, ahogy a mockupban.
 * Az elválasztó vonal viszont behúzva marad, azt külön réteg rajzolja.
 */
import type { StyleProp, TextStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

import {
  colors,
  fontSize,
  glow,
  letterSpacing,
  radius,
  spacing,
  tracking,
} from '@/constants/theme';
import { formatSigned } from '@/lib/format';
import type { StandingsTeam } from '@/types/standings';

/** Oszlopszélességek a mockup rácsából (`grid-template-columns`). */
const COLUMNS = {
  rank: 28,
  badge: 26,
  played: 22,
  wins: 22,
  losses: 18,
  diff: 36,
  points: 24,
} as const;

/** A mockup sormagassága. */
const ROW_HEIGHT = 56;
/** A fejléc magassága. */
const HEADER_HEIGHT = 28;
/** A kiemelt sor bal oldali sávja – a `StackedRow` aktív sávjával azonos. */
const ACTIVE_BAR = 2;
/** A tabella dobogós helyezései, amiket a mockup ciánnal jelöl. */
const PODIUM = 3;

interface StandingsRowProps {
  team: StandingsTeam;
  /** A szűrőben kiválasztott csapat sora – kiemelve áll. */
  own?: boolean;
  /** Az utolsó sor alól elmarad az elválasztó. */
  last?: boolean;
}

export function StandingsRow({ team, own = false, last = false }: StandingsRowProps) {
  const podium = team.position <= PODIUM;

  return (
    <View style={[styles.row, own ? styles.rowOwn : null]}>
      {own ? <View style={styles.bar} /> : null}

      <Text
        className="font-mono text-md"
        style={[styles.rank, { color: own || podium ? colors.accent.cyan : colors.text.muted }]}
      >
        {team.position}
      </Text>

      <View style={[styles.badge, own ? styles.badgeOwn : null]}>
        <Text
          className="font-condensed-bold text-label"
          style={{ color: own ? colors.accent.cyan : colors.text.primary }}
          numberOfLines={1}
        >
          {team.abbr}
        </Text>
      </View>

      <Text
        className="font-body text-md"
        style={[styles.name, { color: own ? colors.accent.cyan : colors.text.primary }]}
        numberOfLines={1}
      >
        {team.name}
      </Text>

      <Text className="font-mono text-sm text-secondary" style={[styles.number, styles.played]}>
        {team.played}
      </Text>
      <Text className="font-mono text-sm text-secondary" style={[styles.number, styles.wins]}>
        {team.wins}
      </Text>
      <Text className="font-mono text-sm text-secondary" style={[styles.number, styles.losses]}>
        {team.losses}
      </Text>
      <Text className="font-mono text-sm" style={[styles.number, styles.diff, { color: diffColor(team.diff) }]}>
        {diffLabel(team.diff)}
      </Text>
      <Text className="font-mono-bold text-base text-primary" style={[styles.number, styles.points]}>
        {team.points}
      </Text>

      {last ? null : <View style={styles.divider} />}
    </View>
  );
}

/** A tabella oszlopfejléce – a sorokkal azonos rácson. */
export function StandingsRowHeader() {
  return (
    <View style={styles.headerWrap}>
      <View style={styles.header}>
        <Label style={styles.rank}>#</Label>
        <View style={styles.badgeSpacer} />
        <Label style={styles.name}>Csapat</Label>
        <Label style={[styles.number, styles.played]}>M</Label>
        <Label style={[styles.number, styles.wins]}>Gy</Label>
        <Label style={[styles.number, styles.losses]}>V</Label>
        <Label style={[styles.number, styles.diff]}>+/-</Label>
        <Label style={[styles.number, styles.points]}>P</Label>
      </View>
    </View>
  );
}

function Label({ children, style }: { children: string; style: StyleProp<TextStyle> }) {
  return (
    <Text
      className="font-condensed text-label uppercase text-muted"
      style={[styles.headerLabel, style]}
      numberOfLines={1}
    >
      {children}
    </Text>
  );
}

/** Előjeles alak, de a nulla marad puszta „0" – ahogy a mockup írja. */
function diffLabel(diff: number): string {
  return diff === 0 ? '0' : formatSigned(diff, 0);
}

/** Pozitív különbség zöld, negatív piros, nulla marad a kísérőszöveg színén. */
function diffColor(diff: number): string {
  if (diff > 0) return colors.semantic.positive;
  if (diff < 0) return colors.semantic.negative;
  return colors.text.secondary;
}

const styles = StyleSheet.create({
  row: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    height: ROW_HEIGHT,
    paddingHorizontal: spacing[4],
  },
  rowOwn: {
    backgroundColor: colors.bg.surface2,
  },
  bar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: ACTIVE_BAR,
    backgroundColor: colors.accent.cyan,
  },
  divider: {
    position: 'absolute',
    left: spacing[4],
    right: spacing[4],
    bottom: 0,
    height: 1,
    backgroundColor: colors.border.rowDeep,
  },
  rank: {
    width: COLUMNS.rank,
    fontVariant: ['tabular-nums'],
  },
  badge: {
    width: COLUMNS.badge,
    height: COLUMNS.badge,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.bg.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Színes elmosott glow helyett accent keret + halvány accent réteg (D-005).
  badgeOwn: {
    borderColor: colors.accent.cyan,
    backgroundColor: glow.cyan.fill,
  },
  badgeSpacer: {
    width: COLUMNS.badge,
  },
  name: {
    flex: 1,
    minWidth: 0,
  },
  number: {
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  played: { width: COLUMNS.played },
  wins: { width: COLUMNS.wins },
  losses: { width: COLUMNS.losses },
  diff: { width: COLUMNS.diff },
  points: { width: COLUMNS.points },
  headerWrap: {
    backgroundColor: colors.bg.base,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    height: HEADER_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: colors.bg.surface3,
  },
  headerLabel: {
    letterSpacing: letterSpacing(fontSize.label, tracking.label),
  },
});
