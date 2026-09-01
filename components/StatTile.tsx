/**
 * KPI csempe – a webes `StatCard` mobil párja.
 *
 * Mockup: `docs/mockups/extracted/p0-style-tile.html` („StatTile") és
 * `ma-screen.html` (csapat KPI rács). A csempe egy `GlowCard`: 96pt minimum
 * magasság, `xl` sarok, 14pt margó, opcionális bal oldali accent sáv. Fent a
 * label és a változásjelző egy sorban, alatta 8pt-tal a nagy numerikus érték.
 *
 * A trend színe **nem** az irányból jön: a mockupban a csökkenő kapott pont
 * zöld, a növekvő eldobott labda piros. Ezért a `tone` külön kötelező mező.
 */
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Minus, Triangle } from 'lucide-react-native';

import {
  type AccentTone,
  colors,
  fontSize,
  letterSpacing,
  spacing,
  tracking,
} from '@/constants/theme';
import { GlowCard } from '@/components/GlowCard';

/** A változás megítélése – az iránytól függetlenül a hívó dönti el. */
export type TrendTone = 'positive' | 'negative' | 'neutral';

export interface StatTrend {
  direction: 'up' | 'down' | 'flat';
  /** Már formázott változás, pl. „3.1". */
  value: string;
  tone: TrendTone;
}

interface StatTileProps {
  /** ALL CAPS-ra formázva jelenik meg, pl. „Pontátlag". */
  label: string;
  /** Már formázott érték – a csempe nem számol és nem kerekít. */
  value: string;
  /** Bal oldali accent sáv. Elhagyva sáv nélküli csempe. */
  accent?: AccentTone;
  trend?: StatTrend;
  onPress?: () => void;
  /** Kívülről csak elhelyezés (rács-cella, margó, `flex`). */
  style?: StyleProp<ViewStyle>;
}

const TREND_COLORS: Record<TrendTone, string> = {
  positive: colors.semantic.positive,
  negative: colors.semantic.negative,
  neutral: colors.text.secondary,
};

const DIRECTION_LABELS: Record<StatTrend['direction'], string> = {
  up: 'növekedés',
  down: 'csökkenés',
  flat: 'változatlan',
};

export function StatTile({ label, value, accent, trend, onPress, style }: StatTileProps) {
  return (
    <GlowCard
      accent={accent}
      corner="xl"
      padding={14}
      onPress={onPress}
      accessibilityLabel={onPress ? `${label}: ${value}` : undefined}
      style={[styles.tile, style]}
    >
      <View style={styles.header}>
        <Text
          className="flex-1 font-condensed text-label uppercase text-secondary"
          style={styles.label}
          numberOfLines={1}
        >
          {label}
        </Text>
        {trend ? <TrendMark trend={trend} /> : null}
      </View>

      <Text className="font-mono-bold text-stat text-primary" style={styles.value} numberOfLines={1}>
        {value}
      </Text>
    </GlowCard>
  );
}

/**
 * A mockup ▲ / ▼ / ▬ karaktereit nem tudjuk kiírni: a csomagolt JetBrains Mono
 * subsetben nincs meg a három glifa (U+25B2 / U+25BC / U+25AC), Androidon
 * tofuként jelenne meg. Helyettük lucide ikon, kitöltve – lásd D-031.
 */
function TrendMark({ trend }: { trend: StatTrend }) {
  const tint = TREND_COLORS[trend.tone];

  return (
    <View
      style={styles.trend}
      accessible
      accessibilityLabel={`${DIRECTION_LABELS[trend.direction]} ${trend.value}`}
    >
      {trend.direction === 'flat' ? (
        <Minus size={10} color={tint} strokeWidth={2.4} />
      ) : (
        <Triangle
          size={9}
          color={tint}
          fill={tint}
          strokeWidth={2}
          style={trend.direction === 'down' ? styles.flipped : undefined}
        />
      )}
      <Text className="font-mono text-label" style={[styles.trendValue, { color: tint }]}>
        {trend.value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    minHeight: 96,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  label: {
    letterSpacing: letterSpacing(fontSize.label, tracking.label),
  },
  value: {
    marginTop: spacing[2],
    letterSpacing: letterSpacing(fontSize.stat, tracking.tight),
    fontVariant: ['tabular-nums'],
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    // A label első sorával egy vonalban maradjon a 11pt-os szöveg.
    paddingTop: 1,
  },
  trendValue: {
    fontVariant: ['tabular-nums'],
  },
  flipped: {
    transform: [{ rotate: '180deg' }],
  },
});
