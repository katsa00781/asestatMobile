/**
 * Élő mérkőzés kártya a „Ma" képernyő tetején – csak akkor jelenik meg, ha a
 * kiválasztott csapatnak éppen fut a meccse.
 *
 * A geometriája a `LastGameCard`-ét követi (accent sáv + fejléc + párosítás +
 * pontszám + alsó sor), a fejléc jelölője viszont `LiveBadge` a pulzáló
 * ponttal, nem a hét `Badge` variáns egyike (D-105). Az accent `negative`
 * (piros): ez különbözteti meg a narancs `NextGameCard`-tól és az
 * eredményfüggő `LastGameCard`-tól.
 */
import { StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { GlowCard } from '@/components/GlowCard';
import { LiveBadge } from '@/components/LiveBadge';
import { colors, fontSize, letterSpacing, spacing, tracking } from '@/constants/theme';
import type { LiveGameSummary } from '@/types/live';

interface LiveGameCardProps {
  live: LiveGameSummary;
  /** A saját csapatunk rövid neve a párosításban. */
  ourName: string;
  onPress: () => void;
}

export function LiveGameCard({ live, ourName, onPress }: LiveGameCardProps) {
  return (
    <GlowCard
      accent="negative"
      corner="xl"
      padding={16}
      onPress={onPress}
      accessibilityLabel={`Élő mérkőzés: ${ourName} ${live.ourScore} – ${live.opponent} ${live.oppScore}. Részletek.`}
      style={styles.card}
    >
      <View style={styles.header}>
        <Text className="font-condensed text-label uppercase text-muted" style={styles.label}>
          Élő mérkőzés
        </Text>
        <LiveBadge />
      </View>

      <Text className="font-condensed text-h3 text-primary" style={styles.matchup} numberOfLines={1}>
        {`${ourName} — ${live.opponent}`}
      </Text>

      <Text className="font-mono-bold text-display" style={styles.score}>
        <Text style={{ color: colors.accent.cyan }}>{live.ourScore}</Text>
        <Text style={{ color: colors.text.muted }}> : </Text>
        <Text style={{ color: colors.text.primary }}>{live.oppScore}</Text>
      </Text>

      <View style={styles.footer}>
        <Text className="font-body text-sm text-secondary">{periodLabel(live)}</Text>
        <View style={styles.details}>
          <Text className="font-body text-sm text-cyan">Részletek</Text>
          <ChevronRight size={14} color={colors.accent.cyan} strokeWidth={2} />
        </View>
      </View>
    </GlowCard>
  );
}

/** `N3 · 07:42` alak; félidőben „Félidő", óra híján csak a negyed. */
function periodLabel(live: LiveGameSummary): string {
  if (live.status === 'halftime') return 'Félidő';

  const quarter = live.period > 0 ? `N${live.period}` : 'Kezdés előtt';
  return live.clock ? `${quarter} · ${live.clock}` : quarter;
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
    marginBottom: spacing[2],
  },
  label: {
    letterSpacing: letterSpacing(fontSize.label, tracking.wider),
  },
  matchup: {
    marginBottom: spacing[2],
  },
  score: {
    marginBottom: spacing[2],
    letterSpacing: letterSpacing(fontSize.display, tracking.snug),
    fontVariant: ['tabular-nums'],
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
