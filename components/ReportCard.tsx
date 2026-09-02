/**
 * Mentett AI riport kártyája – a webes `.ai-marker` kártya mobil párja.
 *
 * A mobil app riportot **nem generál**, csak olvassa a `game_text_reports` és
 * a `player_text_reports` sorait – a kártya mindkét riportfajtát megjeleníti,
 * a fejléc felirata a `report_type`-ból jön. A szöveg több ezer karakter is
 * lehet, ezért alapból nyolc sorra csuklik össze, és a kártya alján lévő gomb
 * nyitja ki (D-049).
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react-native';

import { GlowCard } from '@/components/GlowCard';
import { colors, fontSize, letterSpacing, spacing, tapTarget, tracking } from '@/constants/theme';
import { usePressed } from '@/hooks/usePressed';
import { formatDate } from '@/lib/format';
import type { GameReport, GameReportType } from '@/types/games';
import type { PlayerReport, PlayerReportType } from '@/types/players';

/** Ennyi sor látszik összecsukott állapotban. */
const COLLAPSED_LINES = 8;

/**
 * Ennél rövidebb riport összecsukva is egészben kifér, ott a gomb csak zavarna.
 * A becslés a nyolc sor × ~45 karakter, DM Sans 13pt-on.
 */
const EXPANDABLE_LENGTH = 360;

const TYPE_LABELS: Record<GameReportType | PlayerReportType, string> = {
  pregame: 'Pregame scouting',
  postgame: 'Postgame elemzés',
  combined: 'Összesített riport',
  season: 'Szezonelemzés',
  manual: 'Manuális elemzés',
};

interface ReportCardProps {
  report: GameReport | PlayerReport;
}

export function ReportCard({ report }: ReportCardProps) {
  const [expanded, setExpanded] = useState(false);
  const expandable = report.narrative.length > EXPANDABLE_LENGTH;

  return (
    <GlowCard accent="ai" corner="lg" padding={14} style={styles.card}>
      <View style={styles.header}>
        <FileText size={14} color={colors.accent.ai} strokeWidth={1.8} />
        <Text
          className="flex-1 font-condensed text-label uppercase text-primary"
          style={styles.label}
          numberOfLines={1}
        >
          {TYPE_LABELS[report.type]}
        </Text>
        {report.generatedAt ? (
          <Text className="font-mono text-tiny text-muted" style={styles.date}>
            {formatDate(report.generatedAt)}
          </Text>
        ) : null}
      </View>

      <Text
        className="font-body text-sm text-secondary"
        style={styles.narrative}
        numberOfLines={expandable && !expanded ? COLLAPSED_LINES : undefined}
      >
        {report.narrative}
      </Text>

      {expandable ? (
        <ExpandButton expanded={expanded} onPress={() => setExpanded((value) => !value)} />
      ) : null}
    </GlowCard>
  );
}

interface ExpandButtonProps {
  expanded: boolean;
  onPress: () => void;
}

function ExpandButton({ expanded, onPress }: ExpandButtonProps) {
  const button = usePressed();
  const Icon = expanded ? ChevronUp : ChevronDown;

  return (
    <Pressable
      onPress={onPress}
      {...button.pressHandlers}
      accessibilityRole="button"
      // A felirat 13pt magas: a teljes 44pt-os sávot maga a gomb adja, hogy a
      // célpont a kártyán belül maradjon (D-038).
      style={[styles.button, { opacity: button.pressed ? 0.6 : 1 }]}
    >
      <Text
        className="font-condensed text-sm uppercase text-cyan"
        style={{ letterSpacing: letterSpacing(fontSize.sm, tracking.wide) }}
      >
        {expanded ? 'Összecsukás' : 'Teljes riport'}
      </Text>
      <Icon size={14} color={colors.accent.cyan} strokeWidth={2} />
    </Pressable>
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
    gap: 6,
    marginBottom: spacing[2],
  },
  label: {
    letterSpacing: letterSpacing(fontSize.label, tracking.label),
  },
  date: {
    fontVariant: ['tabular-nums'],
  },
  narrative: {
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: tapTarget,
  },
});
