/**
 * A meccs részletei képernyő fejkártyája: párosítás, végeredmény, dátum.
 *
 * Mockup ehhez a képernyőhöz nincs; a kártya a `ma-screen.html` „Legutóbb"
 * blokkjának felépítését viszi tovább (eredménytől függő accent sáv és badge,
 * cián saját pontszám, fehér ellenfélpontszám), csak nagyobb pontszámmal és
 * kiemelt (`xl`) sarokkerekítéssel – ez a képernyő fő eleme, nem egy listaelem.
 */
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { GlowCard } from '@/components/GlowCard';
import { colors, fontSize, letterSpacing, spacing, tracking } from '@/constants/theme';
import { formatDateWithWeekday } from '@/lib/format';
import type { TeamGame } from '@/types/games';

interface GameScoreCardProps {
  game: TeamGame;
  /** A saját csapatunk rövid neve a párosításban. */
  ourName: string;
}

export function GameScoreCard({ game, ourName }: GameScoreCardProps) {
  const won = game.result === 'win';

  return (
    <GlowCard accent={won ? 'positive' : 'negative'} corner="xl" padding={16} style={styles.card}>
      <View style={styles.header}>
        <Text className="font-condensed text-label uppercase text-muted" style={styles.label}>
          Végeredmény
        </Text>
        <Badge label={won ? 'Nyert' : 'Vesztett'} variant={won ? 'positive' : 'negative'} />
      </View>

      <Text className="font-condensed text-h3 text-primary" style={styles.matchup} numberOfLines={2}>
        {`${ourName} — ${game.opponent}`}
      </Text>

      <Text className="font-mono-bold text-score" style={styles.score}>
        <Text style={{ color: colors.accent.cyan }}>{game.ourScore}</Text>
        <Text style={{ color: colors.text.muted }}> : </Text>
        <Text style={{ color: colors.text.primary }}>{game.oppScore}</Text>
      </Text>

      <View style={styles.footer}>
        <Text className="font-body text-sm text-secondary" numberOfLines={1}>
          {formatDateWithWeekday(game.date)}
        </Text>
        <Text className="font-body text-sm text-muted">{context(game)}</Text>
      </View>
    </GlowCard>
  );
}

/** „Hazai · 3. forduló" – a fordulószám csak akkor, ha az adatbázisban van. */
function context(game: TeamGame): string {
  const venue = game.homeAway === 'home' ? 'Hazai' : 'Vendég';
  return game.round === null ? venue : `${venue} · ${game.round}. forduló`;
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
  footer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
});
