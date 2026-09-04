/**
 * Az élő mérkőzés képernyő fejkártyája: állás, negyed/óra, ÉLŐ jelölés.
 *
 * A `GameScoreCard` geometriáját követi (accent sáv, fejléc, pontszám, alsó
 * sor), de **nem bővíti azt**: nincs végeredmény, nincs `TeamGame.result`, a
 * fejléc jelölője élőben lüktet – külön komponens (D-105).
 */
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { GlowCard } from '@/components/GlowCard';
import { LiveBadge } from '@/components/LiveBadge';
import { colors, fontSize, letterSpacing, spacing, tracking } from '@/constants/theme';
import type { LiveGameSummary } from '@/types/live';

interface LiveScoreCardProps {
  live: LiveGameSummary;
  /** A saját csapatunk rövid neve a párosításban. */
  ourName: string;
}

export function LiveScoreCard({ live, ourName }: LiveScoreCardProps) {
  const finished = live.status === 'final';

  return (
    <GlowCard accent={finished ? undefined : 'negative'} corner="xl" padding={16} style={styles.card}>
      <View style={styles.header}>
        <Text className="font-condensed text-label uppercase text-muted" style={styles.label}>
          {finished ? 'Mérkőzés vége' : 'Élő mérkőzés'}
        </Text>
        {finished ? <Badge label="Vége" variant="neutral" /> : <LiveBadge />}
      </View>

      <Text className="font-condensed text-h3 text-primary" style={styles.matchup} numberOfLines={2}>
        {`${ourName} — ${live.opponent}`}
      </Text>

      <Text className="font-mono-bold text-score" style={styles.score}>
        <Text style={{ color: colors.accent.cyan }}>{live.ourScore}</Text>
        <Text style={{ color: colors.text.muted }}> : </Text>
        <Text style={{ color: colors.text.primary }}>{live.oppScore}</Text>
      </Text>

      <Text className="font-body text-sm text-secondary">{contextLabel(live)}</Text>
    </GlowCard>
  );
}

/**
 * `3. negyed · 07:42` alak menet közben, „Félidő" félidőben. Véget ért
 * meccsnél a végleges statisztika ütemezésére mutat, mert a `games` sor csak
 * a hétvégi frissítés után jön létre – ide innen nem vezet tovább link.
 */
function contextLabel(live: LiveGameSummary): string {
  if (live.status === 'final') {
    return 'A végleges statisztika a hétvégi frissítés után lesz elérhető.';
  }
  if (live.status === 'halftime') return 'Félidő';

  const quarter = live.period > 0 ? `${live.period}. negyed` : 'Kezdés előtt';
  return live.clock ? `${quarter} · ${live.clock}` : quarter;
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[6],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  label: {
    letterSpacing: letterSpacing(fontSize.label, tracking.wider),
  },
  matchup: {
    marginBottom: spacing[2],
  },
  score: {
    marginBottom: spacing[3],
    letterSpacing: letterSpacing(fontSize.score, tracking.tight),
    fontVariant: ['tabular-nums'],
  },
});
