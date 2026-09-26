/**
 * Egy játékos post-game sora – összecsukva név, összegző sor, két badge és a
 * mono számok; kinyitva az erősségek, a limitációk és a fókusz.
 *
 * A webes játékoslista táblázatsorának mobil párja: a három webes oszlop itt
 * egymás alá kerül, mert 390pt-on egymás mellett olvashatatlan lenne. A
 * szövegek szabályalapúak, nem AI-generáltak – lila jelölést csak a weben
 * mentett LLM-értékelés kap, a kártya alatt, a meglévő `ReportCard`-dal (D-122).
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

import { Badge } from '@/components/Badge';
import { GlowCard } from '@/components/GlowCard';
import { ReportCard } from '@/components/ReportCard';
import { colors, fontSize, letterSpacing, spacing, tracking } from '@/constants/theme';
import type { PostgamePlayerView } from '@/types/postgame';
import type { PointEntry } from '@/types/scouting';

interface PostgamePlayerCardProps {
  player: PostgamePlayerView;
}

export function PostgamePlayerCard({ player }: PostgamePlayerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const Chevron = expanded ? ChevronUp : ChevronDown;

  return (
    <>
      <GlowCard
        corner="lg"
        padding={14}
        style={styles.card}
        onPress={() => setExpanded((value) => !value)}
        accessibilityLabel={`${player.name}: ${player.summary}. ${expanded ? 'Összecsukás' : 'Részletek'}.`}
      >
        <View style={styles.header}>
          <Text className="flex-1 font-body-medium text-md text-primary" numberOfLines={1}>
            {player.name}
          </Text>
          <Chevron size={16} color={colors.text.secondary} strokeWidth={2} />
        </View>

        <Text className="font-body text-sm text-secondary" style={styles.summary}>
          {player.summary}
        </Text>

        <View style={styles.badges}>
          <Badge label={player.impactLabel} variant="cyan" />
          <Badge label={player.usageLabel} variant="neutral" />
        </View>

        <View style={styles.numbers}>
          <Metric label="TS" value={player.tsText} />
          <Metric label="VAL" value={player.valText} />
          <Metric label="VAL/36" value={player.valPer36Text} />
        </View>

        {expanded ? (
          <View style={styles.details}>
            <Bullets label="Erősségek" entries={player.strengths} empty="Nincs kiemelt erősség." />
            <Bullets label="Limitációk" entries={player.issues} empty="Stabil végrehajtás." />
            <Bullets label="Fókusz" entries={player.focus} empty="Fenntartandó teljesítmény." />
          </View>
        ) : null}
      </GlowCard>

      {expanded && player.report ? <ReportCard report={player.report} /> : null}
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text className="font-condensed text-tiny uppercase text-muted" style={styles.metricLabel}>
        {label}
      </Text>
      <Text className="font-mono text-md text-primary" style={styles.metricValue}>
        {value}
      </Text>
    </View>
  );
}

function Bullets({ label, entries, empty }: { label: string; entries: PointEntry[]; empty: string }) {
  return (
    <View style={styles.bullets}>
      <Text className="font-condensed text-label uppercase text-muted" style={styles.bulletsLabel}>
        {label}
      </Text>
      {entries.length > 0 ? (
        entries.map((entry) => (
          <Text key={entry.text} className="font-body text-sm text-primary" style={styles.bullet}>
            {`· ${entry.text}`}
          </Text>
        ))
      ) : (
        <Text className="font-body text-sm text-muted" style={styles.bullet}>
          {empty}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  summary: {
    marginTop: spacing[1],
    lineHeight: 19,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  numbers: {
    flexDirection: 'row',
    gap: spacing[5],
    marginTop: spacing[3],
  },
  metric: {
    gap: 2,
  },
  metricLabel: {
    letterSpacing: letterSpacing(fontSize.tiny, tracking.label),
  },
  metricValue: {
    fontVariant: ['tabular-nums'],
  },
  details: {
    marginTop: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.hairline,
    gap: spacing[3],
  },
  bullets: {
    gap: spacing[1],
  },
  bulletsLabel: {
    letterSpacing: letterSpacing(fontSize.label, tracking.label),
  },
  bullet: {
    lineHeight: 19,
  },
});
