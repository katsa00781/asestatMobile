/**
 * A játékos részletei képernyő fejkártyája: mezszám, teljes név, pozíció,
 * testadatok és a szezon két keretszáma (meccs, perc/meccs).
 *
 * Mockup ehhez a képernyőhöz nincs; a kártya a `GameScoreCard` felépítését
 * követi (kiemelt `xl` sarok, 16pt margó, accent sáv), a mezszám-kör pedig a
 * `Jatekosok Lista` mockup listasorának köre, nagyobb átmérőn.
 *
 * A név itt **teljes** alakban áll – a listában muszáj volt rövidíteni (D-051),
 * itt viszont a kártya teljes szélessége rendelkezésre áll.
 */
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { GlowCard } from '@/components/GlowCard';
import { colors, fontSize, letterSpacing, spacing, tracking } from '@/constants/theme';
import { formatDecimal } from '@/lib/format';
import type { SeasonPlayer } from '@/types/players';

interface PlayerProfileCardProps {
  player: SeasonPlayer;
}

/** Mezszám-kör átmérője – a listasor 32pt-os köréhez képest kiemelt méret. */
const NUMBER_SIZE = 52;

export function PlayerProfileCard({ player }: PlayerProfileCardProps) {
  return (
    <GlowCard accent="cyan" corner="xl" padding={16} style={styles.card}>
      <View style={styles.head}>
        <View style={styles.number}>
          <Text className="font-mono-bold text-xl text-cyan" style={styles.numberText} numberOfLines={1}>
            {player.number}
          </Text>
        </View>

        <View style={styles.identity}>
          <Text className="font-condensed text-h3 text-primary" numberOfLines={2}>
            {player.name}
          </Text>
          <Text className="font-body text-sm text-secondary" style={styles.position} numberOfLines={2}>
            {profileLine(player)}
          </Text>
        </View>

        {player.isActive === false ? <Badge label="Inaktív" variant="neutral" /> : null}
      </View>

      <View style={styles.footer}>
        <Metric label="Meccs" value={String(player.gamesPlayed)} />
        <Metric label="Perc / meccs" value={formatDecimal(player.averages.minutes)} />
        <Metric label="Pont összesen" value={String(player.points)} />
      </View>
    </GlowCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text className="font-condensed text-label uppercase text-muted" style={styles.metricLabel}>
        {label}
      </Text>
      <Text className="font-mono text-lg text-primary" style={styles.metricValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

/** „Bedobó · 31 éves · 197 cm · 95 kg" – a hiányzó adatok kimaradnak. */
function profileLine(player: SeasonPlayer): string {
  const parts = [player.positionLabel];

  if (player.birthYear) parts.push(`${new Date().getFullYear() - player.birthYear} éves`);
  if (player.height) parts.push(`${player.height} cm`);
  if (player.weight) parts.push(`${player.weight} kg`);

  return parts.join(' · ');
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[5],
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  number: {
    width: NUMBER_SIZE,
    height: NUMBER_SIZE,
    borderRadius: NUMBER_SIZE / 2,
    borderWidth: 1,
    borderColor: colors.border.active,
    backgroundColor: colors.bg.surface3,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  numberText: {
    fontVariant: ['tabular-nums'],
  },
  identity: {
    flex: 1,
    minWidth: 0,
  },
  position: {
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing[4],
    marginTop: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.hairline,
  },
  metric: {
    flex: 1,
    minWidth: 0,
  },
  metricLabel: {
    letterSpacing: letterSpacing(fontSize.label, tracking.label),
    marginBottom: 2,
  },
  metricValue: {
    letterSpacing: letterSpacing(fontSize.lg, tracking.snug),
    fontVariant: ['tabular-nums'],
  },
});
