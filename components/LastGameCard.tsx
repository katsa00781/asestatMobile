/**
 * Legutóbbi meccs kártya a „Ma" képernyő alján.
 *
 * Mockup: `docs/mockups/extracted/ma-screen.html` „Legutóbb" blokkja – az
 * accent sáv és a badge az eredménytől függ (nyert: zöld, vesztett: piros),
 * a saját pontszám cián, az ellenfélé fehér.
 *
 * A teljes kártya nyomható, nem csak a „Részletek ›" felirat: mobilon a nagyobb
 * célpont a jobb (a felirat egyben marad, mert a mockup így mutatja).
 */
import { StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { Badge } from '@/components/Badge';
import { GlowCard } from '@/components/GlowCard';
import { colors, fontSize, letterSpacing, spacing, tracking } from '@/constants/theme';
import { formatDate } from '@/lib/format';
import type { TeamGame } from '@/types/games';

interface LastGameCardProps {
  game: TeamGame;
  /** A saját csapatunk rövid neve a párosításban. */
  ourName: string;
  onPress: () => void;
}

export function LastGameCard({ game, ourName, onPress }: LastGameCardProps) {
  const won = game.result === 'win';

  return (
    <GlowCard
      accent={won ? 'positive' : 'negative'}
      corner="lg"
      padding={14}
      onPress={onPress}
      accessibilityLabel={`Legutóbbi meccs: ${ourName} ${game.ourScore} – ${game.opponent} ${game.oppScore}. Részletek.`}
      style={styles.card}
    >
      <View style={styles.header}>
        <Text className="font-condensed text-label uppercase text-muted" style={styles.label}>
          Legutóbb
        </Text>
        <Badge label={won ? 'Nyert' : 'Vesztett'} variant={won ? 'positive' : 'negative'} />
      </View>

      <Text className="font-condensed text-lg text-primary" style={styles.matchup} numberOfLines={1}>
        {`${ourName} — ${game.opponent}`}
      </Text>

      <Text className="font-mono-bold text-display" style={styles.score}>
        <Text style={{ color: colors.accent.cyan }}>{game.ourScore}</Text>
        <Text style={{ color: colors.text.muted }}> : </Text>
        <Text style={{ color: colors.text.primary }}>{game.oppScore}</Text>
      </Text>

      <View style={styles.footer}>
        <Text className="font-body text-sm text-secondary">{formatDate(game.date)}</Text>
        {/* A mockup „›" karaktere helyett ikon: a csomagolt DM Sans subsetben
            nincs meg a glifa, Androidon tofuként jelenne meg (D-031). */}
        <View style={styles.details}>
          <Text className="font-body text-sm text-cyan">Részletek</Text>
          <ChevronRight size={14} color={colors.accent.cyan} strokeWidth={2} />
        </View>
      </View>
    </GlowCard>
  );
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
