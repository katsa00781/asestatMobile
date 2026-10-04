/**
 * Élő meccsstatisztika – saját kontra ellenfél, a `live_team_stats` alapján.
 *
 * Új makett nincs hozzá: a `TeamSplitList` névsorát és `SplitMetricRow` sorait
 * használja (D-121).
 *
 * Amíg nincs meg mindkét oldal sora – a migráció vagy a gyűjtő deployja előtt,
 * vagy a meccs legelején –, egy magyarázó sor áll a helyén, ahogy a
 * `QuarterScores`-nál.
 */
import { StyleSheet, Text } from 'react-native';

import { TeamSplitList } from '@/components/TeamSplitList';
import { spacing } from '@/constants/theme';
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

  return (
    <TeamSplitList
      ownName={ourName}
      opponentName={opponent}
      metrics={buildLiveTeamMetrics(stats.own, stats.opponent)}
      style={styles.block}
    />
  );
}

const styles = StyleSheet.create({
  block: {
    marginHorizontal: spacing[4],
  },
});
