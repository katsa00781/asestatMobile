/**
 * Dobási bontás – zónánként a találat/kísérlet és a százalék, arányjelző sávval.
 *
 * Mockup ehhez a képernyőhöz nincs; a panel a webes `PlayerDetails` „Dobási
 * Statisztikák" blokkjának négy zónáját viszi tovább, a `p0-style-tile`
 * arányjelző sávjával. A zónák színe is a webes párjuké, hogy a stáb ugyanazt
 * a kódolást lássa a két felületen.
 *
 * A százalékot a komponens számolja a találat/kísérlet párokból: kísérlet
 * nélküli zóna „—" jellel áll, nem 0.0%-kal.
 */
import { StyleSheet, Text, View } from 'react-native';

import type { ShootingStats } from '@core/dashboard-types';

import { GlowCard } from '@/components/GlowCard';
import { ProgressBar } from '@/components/ProgressBar';
import { type AccentTone, fontSize, letterSpacing, spacing, tracking } from '@/constants/theme';

interface ShootingPanelProps {
  shooting: ShootingStats;
}

interface Zone {
  label: string;
  tone: AccentTone;
  made: number;
  attempted: number;
}

export function ShootingPanel({ shooting }: ShootingPanelProps) {
  const zones: Zone[] = [
    { label: 'Közeli', tone: 'positive', ...shooting.close },
    { label: 'Középtávoli', tone: 'cyan', ...shooting.mid },
    { label: 'Hármas', tone: 'ai', ...shooting.three },
    { label: 'Büntető', tone: 'orange', ...shooting.freeThrow },
  ];

  return (
    <GlowCard corner="lg" padding={14} style={styles.card}>
      {zones.map((zone, index) => (
        <View key={zone.label} style={index > 0 ? styles.spaced : undefined}>
          <View style={styles.header}>
            <Text
              className="flex-1 font-condensed text-label uppercase text-secondary"
              style={styles.label}
              numberOfLines={1}
            >
              {zone.label}
            </Text>
            <Text className="font-mono text-tiny text-muted" style={styles.numeric}>
              {`${zone.made}/${zone.attempted}`}
            </Text>
            <Text className="font-mono text-md text-primary" style={styles.percent}>
              {percentText(zone)}
            </Text>
          </View>
          <ProgressBar value={percentValue(zone)} tone={zone.tone} />
        </View>
      ))}
    </GlowCard>
  );
}

function percentValue(zone: Zone): number {
  return zone.attempted > 0 ? (zone.made / zone.attempted) * 100 : 0;
}

function percentText(zone: Zone): string {
  return zone.attempted > 0 ? `${percentValue(zone).toFixed(1)}%` : '—';
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing[4],
  },
  spaced: {
    marginTop: spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[2],
    marginBottom: 6,
  },
  label: {
    letterSpacing: letterSpacing(fontSize.label, tracking.label),
  },
  numeric: {
    fontVariant: ['tabular-nums'],
  },
  percent: {
    // A négy százalék egymás alatt: fix szélességgel a tizedespontok egy
    // vonalban maradnak.
    width: 58,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
