/**
 * Egy mentett AI riport kártyája az Elemzés hub listájában.
 *
 * Design prompt: `asestats/context/mobile/mobile-design-prompts.md` P12 –
 * 88pt magas surface1 kártya, bal 3pt lila sávval: felül típus-badge és
 * generálási dátum, alatta a cím, végül a riport első mondata egy sorra vágva.
 *
 * A kártya a `GlowCard accent="ai"`-ra épül, ugyanarra, mint a meccs- és
 * játékosképernyők `ReportCard`-ja – ott a teljes szöveg olvasható, itt csak
 * a belépő a riportolvasóba.
 */
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { GlowCard } from '@/components/GlowCard';
import { spacing } from '@/constants/theme';
import { formatDate } from '@/lib/format';
import type { AnalysisReport } from '@/types/analysis';

interface ReportListCardProps {
  report: AnalysisReport;
  onPress: () => void;
}

export function ReportListCard({ report, onPress }: ReportListCardProps) {
  return (
    <GlowCard
      accent="ai"
      corner="lg"
      padding={14}
      onPress={onPress}
      accessibilityLabel={`${report.typeLabel}: ${report.title}`}
      style={styles.card}
    >
      <View style={styles.header}>
        <Badge label={report.typeLabel} variant="ai" />
        <Text className="font-mono text-sm text-muted" style={styles.date} numberOfLines={1}>
          {formatDate(report.generatedAt)}
        </Text>
      </View>

      <Text className="font-body-medium text-md text-primary" style={styles.title} numberOfLines={1}>
        {report.title}
      </Text>

      <Text className="font-body text-sm text-muted" numberOfLines={1}>
        {report.summary}
      </Text>
    </GlowCard>
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
    justifyContent: 'space-between',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  date: {
    fontVariant: ['tabular-nums'],
  },
  title: {
    marginBottom: 2,
  },
});
