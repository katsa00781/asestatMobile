/**
 * Élő meccsstatisztika – saját kontra ellenfél, a `live_team_stats` alapján.
 *
 * Új makett nincs hozzá: a Szituációk és a Scouting jóváhagyott
 * `SplitMetricRow` sorait használja (P13 4. pont), fölöttük egy névsorral,
 * hogy a cián (saját) és a narancs (ellenfél) oldal ki legyen mondva (D-121).
 *
 * Amíg nincs meg mindkét oldal sora – a migráció vagy a gyűjtő deployja előtt,
 * vagy a meccs legelején –, egy magyarázó sor áll a helyén, ahogy a
 * `QuarterScores`-nál.
 */
import { StyleSheet, Text, View } from 'react-native';

import { SplitMetricRow } from '@/components/SplitMetricRow';
import { colors, fontSize, letterSpacing, spacing, tracking } from '@/constants/theme';
import { buildLiveTeamMetrics } from '@/lib/live-view';
import type { LiveGameDetails } from '@/types/live';

interface LiveTeamStatsPanelProps {
  stats: LiveGameDetails['teamStats'];
  /** A saját csapatunk rövid neve. */
  ourName: string;
  opponent: string;
}

export function LiveTeamStatsPanel({ stats, ourName, opponent }: LiveTeamStatsPanelProps) {
  if (!stats) {
    return (
      <Text className="font-body text-sm text-muted" style={styles.block}>
        A csapatstatisztika még nem érhető el.
      </Text>
    );
  }

  const metrics = buildLiveTeamMetrics(stats.own, stats.opponent);

  return (
    <View style={styles.block}>
      <View style={styles.names}>
        <Text
          className="font-condensed text-label uppercase"
          style={[styles.name, { color: colors.accent.cyan }]}
          numberOfLines={1}
        >
          {ourName}
        </Text>
        <Text
          className="font-condensed text-label uppercase"
          style={[styles.name, styles.nameRight, { color: colors.accent.orange }]}
          numberOfLines={1}
        >
          {opponent}
        </Text>
      </View>

      {metrics.map((metric, index) => (
        <SplitMetricRow key={metric.label} metric={metric} divided={index > 0} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginHorizontal: spacing[4],
  },
  names: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  name: {
    flex: 1,
    letterSpacing: letterSpacing(fontSize.label, tracking.label),
  },
  nameRight: {
    textAlign: 'right',
  },
});
