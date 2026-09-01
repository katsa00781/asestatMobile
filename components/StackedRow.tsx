/**
 * Listasor – a webes `DataTable` sorának mobil párja.
 *
 * Mockup: `docs/mockups/extracted/jatekosok-lista.html` (játékossor) és
 * `p0-style-tile.html` („Listasor minta"). A sor három sávra oszlik: bal
 * oldalt egy kör alakú vezérjel (mezszám), középen a függőlegesen csoportosított
 * cím + alcím, jobbra a fix szélességű numerikus oszlopok. Az oszlopfeliratok
 * nem a sorban, hanem a lista fölötti `StackedRowHeader`-ben állnak – ezért
 * osztozik a két komponens a `metricWidth`-en.
 *
 * A kiemelt (kiválasztott vagy éppen lenyomott) sor surface2 hátteret és bal
 * oldali 2pt-os cián sávot kap – ez a mockup `pressed` állapota.
 */
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  type AccentTone,
  accentColor,
  colors,
  fontSize,
  letterSpacing,
  radius,
  spacing,
  tracking,
} from '@/constants/theme';
import { usePressed } from '@/hooks/usePressed';

/** Egy numerikus oszlop a sor jobb szélén. */
export interface RowMetric {
  /** Már formázott érték – a sor nem számol és nem kerekít. */
  value: string;
  /** Kiemelés (pl. nyert meccs pontszáma). Elhagyva `text.primary`. */
  tone?: AccentTone;
}

interface StackedRowProps {
  /** Cím – egy sorba tördelve, túlcsordulásnál „…". */
  title: string;
  /** Alcím, pl. pozíció vagy dátum. */
  subtitle?: string;
  /** Bal oldali kör tartalma, pl. mezszám. Elhagyva a kör sem jelenik meg. */
  leading?: string;
  metrics?: RowMetric[];
  /** Oszlopszélesség – a `StackedRowHeader`-rel egyeznie kell. */
  metricWidth?: number;
  /** Kiválasztott sor: surface2 háttér + cián sáv. */
  active?: boolean;
  onPress?: () => void;
  /** Kívülről csak elhelyezés (margó, `flex`) – felületet ne írj át. */
  style?: StyleProp<ViewStyle>;
}

/** A mockup játékossorának magassága. */
const ROW_HEIGHT = 68;
/** Mezszám-kör átmérője. */
const LEADING_SIZE = 32;
/** Alapértelmezett oszlopszélesség a mockupból. */
const METRIC_WIDTH = 48;
/** A kiemelt sor bal oldali sávja – vékonyabb, mint a `GlowCard` 3pt-os accentje. */
const ACTIVE_BAR = 2;

export function StackedRow({
  title,
  subtitle,
  leading,
  metrics = [],
  metricWidth = METRIC_WIDTH,
  active = false,
  onPress,
  style,
}: StackedRowProps) {
  const row = usePressed();
  const highlighted = active || row.pressed;

  const content = (
    <>
      {highlighted ? <View style={styles.bar} /> : null}

      {leading ? (
        <View style={styles.leading}>
          <Text className="font-condensed text-sm text-primary" numberOfLines={1}>
            {leading}
          </Text>
        </View>
      ) : null}

      <View style={styles.labels}>
        <Text className="font-body-medium text-md text-primary" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="font-body text-sm text-secondary" style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {metrics.length > 0 ? (
        <View style={styles.metrics}>
          {metrics.map((metric, index) => (
            <Text
              key={index}
              className="font-mono text-xl"
              style={[
                styles.metric,
                { width: metricWidth },
                { color: metric.tone ? accentColor[metric.tone] : colors.text.primary },
              ]}
              numberOfLines={1}
            >
              {metric.value}
            </Text>
          ))}
        </View>
      ) : null}
    </>
  );

  const surface: StyleProp<ViewStyle> = [
    styles.row,
    highlighted ? styles.rowHighlighted : null,
    style,
  ];

  if (!onPress) {
    return <View style={surface}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      {...row.pressHandlers}
      accessibilityRole="button"
      accessibilityLabel={[leading, title, subtitle, ...metrics.map((m) => m.value)]
        .filter(Boolean)
        .join(', ')}
      style={surface}
    >
      {content}
    </Pressable>
  );
}

interface StackedRowHeaderProps {
  /** Oszlopfeliratok ALL CAPS-ra formázva, a sorok metrikáival azonos sorrendben. */
  labels: string[];
  /** Oszlopszélesség – a `StackedRow`-éval egyeznie kell. */
  metricWidth?: number;
  /** A sorokban van vezérjel-kör: a fejléc ugyanakkora helyet hagy ki balra. */
  hasLeading?: boolean;
}

/**
 * A lista fölötti oszlopfejléc. A mockupban csak az első sor fölött jelenik
 * meg, feliratonként a sorok metrikáival azonos szélességgel és térközzel.
 */
export function StackedRowHeader({
  labels,
  metricWidth = METRIC_WIDTH,
  hasLeading = true,
}: StackedRowHeaderProps) {
  return (
    <View style={styles.header}>
      {hasLeading ? <View style={styles.headerLeadingSpacer} /> : null}
      <View style={styles.labels} />
      <View style={styles.metrics}>
        {labels.map((label) => (
          <Text
            key={label}
            className="font-condensed text-label uppercase text-muted"
            style={[styles.headerLabel, { width: metricWidth }]}
            numberOfLines={1}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: ROW_HEIGHT,
    paddingHorizontal: spacing[4],
    borderRadius: radius.lg,
    backgroundColor: colors.bg.surface1,
  },
  rowHighlighted: {
    backgroundColor: colors.bg.surface2,
  },
  bar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: ACTIVE_BAR,
    backgroundColor: colors.accent.cyan,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
  leading: {
    width: LEADING_SIZE,
    height: LEADING_SIZE,
    borderRadius: LEADING_SIZE / 2,
    borderWidth: 1,
    borderColor: colors.border.active,
    backgroundColor: colors.bg.surface3,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  labels: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: spacing[3],
  },
  subtitle: {
    marginTop: 2,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing[4],
    flexShrink: 0,
  },
  metric: {
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: 6,
  },
  headerLeadingSpacer: {
    width: LEADING_SIZE,
    flexShrink: 0,
  },
  headerLabel: {
    textAlign: 'right',
    letterSpacing: letterSpacing(fontSize.label, tracking.label),
  },
});
