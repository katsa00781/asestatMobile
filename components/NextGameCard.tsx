/**
 * Következő meccs kártya a „Ma" képernyő tetején.
 *
 * Mockup: `docs/mockups/extracted/ma-screen.html` – narancs accent sávos
 * `GlowCard`, felül címke + hazai/vendég badge, középen a párosítás, alatta a
 * dátum, legalul a visszaszámláló.
 *
 * A mockup „2026. szeptember 6. · szombat 18:00 · Paks, Városi Sportcsarnok"
 * sorából a **kezdési időpont és a helyszín kimarad**: egyik sincs az
 * adatbázisban (D-022). Ugyanezért a visszaszámláló is nap pontosságú (D-043).
 */
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { GlowCard } from '@/components/GlowCard';
import { fontSize, letterSpacing, spacing, tracking } from '@/constants/theme';
import { daysUntil, formatDateWithWeekday } from '@/lib/format';
import type { Fixture } from '@/types/games';

interface NextGameCardProps {
  fixture: Fixture | null;
  /** A saját csapatunk rövid neve a párosításban. */
  ourName: string;
}

export function NextGameCard({ fixture, ourName }: NextGameCardProps) {
  return (
    <GlowCard accent="orange" corner="xl" padding={16} style={styles.card}>
      <View style={styles.header}>
        <Text
          className="font-condensed text-label uppercase text-muted"
          style={styles.label}
        >
          Következő meccs
        </Text>
        {fixture ? <StatusBadge fixture={fixture} /> : null}
      </View>

      {fixture ? (
        <>
          <View style={styles.matchup}>
            <Text className="font-condensed text-h3 text-primary" numberOfLines={1}>
              {ourName}
            </Text>
            <Text className="font-body text-xs text-muted">VS</Text>
            <Text className="flex-1 font-condensed text-h3 text-primary" style={styles.opponent}>
              {fixture.opponentName}
            </Text>
          </View>

          <Text className="text-center font-body text-sm text-secondary" style={styles.date}>
            {formatDateWithWeekday(fixture.gameDate)}
          </Text>

          <Text className="text-center font-mono-bold text-xl text-cyan">
            {countdown(fixture.gameDate)}
          </Text>
        </>
      ) : (
        <Text className="font-body text-sm text-secondary">
          Nincs kiírt következő meccs a menetrendben.
        </Text>
      )}
    </GlowCard>
  );
}

function StatusBadge({ fixture }: { fixture: Fixture }) {
  if (fixture.status === 'postponed') {
    return <Badge label="Elhalasztva" variant="warning" />;
  }

  return <Badge label={fixture.isHome ? 'Hazai' : 'Vendég'} variant="cyan" />;
}

/** Nap pontosságú visszaszámláló – óra nincs, mert kezdési időpont sincs. */
function countdown(gameDate: string): string {
  const days = daysUntil(gameDate);

  if (days === null) return '—';
  if (days <= 0) return 'MA';
  if (days === 1) return 'HOLNAP';
  return `${days} NAP`;
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[5],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
    marginBottom: 14,
  },
  label: {
    letterSpacing: letterSpacing(fontSize.label, tracking.wider),
  },
  matchup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: spacing[3],
    marginBottom: 10,
  },
  opponent: {
    textAlign: 'center',
  },
  date: {
    marginBottom: spacing[4],
  },
});
