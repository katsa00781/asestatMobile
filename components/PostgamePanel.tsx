/**
 * A post-game elemzés teljes tartalma, a webes post-game nézet sorrendjében
 * (a webprojekt `mobile-sync/2026-09-26-postgame-analysis-spec.md` 3. pontja).
 *
 * Makett nincs hozzá: a jegyzet a specifikáció, és minden szekció meglévő,
 * jóváhagyott komponensből épül – `InsightCard`, `StatTile`, `StackedRow`,
 * `MeterList`, `StatList`, `StatMatrix`, `PointList`, `GlowCard` (D-122).
 * Új design token nincs.
 */
import { StyleSheet, Text, View } from 'react-native';
import { Crosshair, Target, ThumbsDown, ThumbsUp, TriangleAlert } from 'lucide-react-native';

import { Badge } from '@/components/Badge';
import { DecisiveFactorList } from '@/components/DecisiveFactorList';
import { GlowCard } from '@/components/GlowCard';
import { InsightCard } from '@/components/InsightCard';
import { MeterList } from '@/components/MeterList';
import { PointList } from '@/components/PointList';
import { PostgamePlayerCard } from '@/components/PostgamePlayerCard';
import { SectionLabel } from '@/components/SectionLabel';
import { StackedRow, StackedRowHeader } from '@/components/StackedRow';
import { StatList } from '@/components/StatList';
import { StatMatrix } from '@/components/StatMatrix';
import { StatTile } from '@/components/StatTile';
import { accentColor, fontSize, letterSpacing, spacing, tracking } from '@/constants/theme';
import type { HighlightView, PostgameView, ShotMapView } from '@/types/postgame';
import type { PointEntry } from '@/types/scouting';

/** A „+12.4" is elférjen a kulcsmutató-oszlopban. */
const KEY_STAT_WIDTH = 52;

export function PostgamePanel({ view }: { view: PostgameView }) {
  return (
    <>
      <InsightCard label="Összegzés" fragments={[{ text: view.summary }]} style={styles.block} />
      {view.notes ? (
        <Text className="font-body text-sm text-secondary" style={styles.note}>
          {view.notes}
        </Text>
      ) : null}

      <View style={styles.tiles}>
        <StatTile
          label="Pontok"
          value={view.kpis.scoreText}
          trend={view.kpis.marginTrend}
          accent="cyan"
          style={styles.tile}
        />
        <StatTile label="Tempó" value={view.kpis.paceText} style={styles.tile} />
        <StatTile label="eFG%" value={view.kpis.efgText} style={styles.tile} />
      </View>

      <SectionLabel label="Kulcsmutatók – meccs vs. szezon" style={styles.section} />
      <View style={styles.list}>
        <StackedRowHeader
          // A „Δ” (U+0394) nincs a Barlow Condensedben – ezért „Elt.”.
          labels={['Meccs', 'Szezon', 'Elt. pp']}
          metricWidth={KEY_STAT_WIDTH}
          hasLeading={false}
        />
        {view.keyStats.map((row) => (
          <StackedRow
            key={row.key}
            title={row.label}
            subtitle={row.subtitle}
            metrics={row.metrics}
            metricWidth={KEY_STAT_WIDTH}
          />
        ))}
      </View>

      <MeterList entries={view.shotProfile} label="Dobásprofil" style={styles.sectionBlock} />

      {view.shotMap ? <ShotMapSection shotMap={view.shotMap} /> : null}

      <SectionLabel label="Döntő tényezők" style={styles.section} />
      {view.decisiveGroups.length > 0 ? (
        view.decisiveGroups.map((group) => (
          <DecisiveFactorList key={group.title} group={group} style={styles.block} />
        ))
      ) : (
        <Text className="font-body text-sm text-muted" style={styles.note}>
          Nincs kiemelt faktor.
        </Text>
      )}

      <SectionLabel label="Játékos hatás" style={styles.section} />
      <PointList
        label="Pozitív hatás"
        entries={[{ text: view.positiveImpact }]}
        icon={ThumbsUp}
        tone="positive"
        style={styles.block}
      />
      <PointList
        label="Negatív hatás"
        entries={[{ text: view.negativeImpact }]}
        icon={ThumbsDown}
        tone="negative"
        style={styles.block}
      />

      <SectionLabel label="Játékosok" style={styles.section} />
      {view.highlights.map((item) => (
        <HighlightCard key={item.label} item={item} />
      ))}
      <View style={styles.players}>
        {view.players.map((player) => (
          <PostgamePlayerCard key={player.playerId} player={player} />
        ))}
      </View>

      <SectionLabel label="Összkép" style={styles.section} />
      <PointList
        label="Erősségek"
        entries={orEmpty(view.strengths, 'Nincs kiemelt erősség.')}
        icon={ThumbsUp}
        tone="positive"
        style={styles.block}
      />
      <PointList
        label="Problémák"
        entries={orEmpty(view.problems, 'Nincs kiemelt probléma.')}
        icon={TriangleAlert}
        tone="negative"
        style={styles.block}
      />
      <PointList
        label="Következő fókusz"
        entries={orEmpty(view.nextFocus, 'Nincs kiemelt fókuszpont.')}
        icon={Target}
        tone="cyan"
        style={styles.block}
      />
    </>
  );
}

function ShotMapSection({ shotMap }: { shotMap: ShotMapView }) {
  return (
    <>
      <SectionLabel label="Dobástérkép" style={styles.section} />
      <GlowCard corner="lg" padding={14} style={styles.block}>
        <View style={styles.shotTitle}>
          <Crosshair size={16} color={accentColor.cyan} strokeWidth={2} />
          <Text className="font-mono text-sm text-primary" style={styles.mono}>
            {shotMap.title}
          </Text>
        </View>
        <StatList items={shotMap.rates} />
        <StatList items={shotMap.efficiency} style={styles.shotEfficiency} />
      </GlowCard>
      <StatMatrix
        labelHeader="Zóna"
        columns={shotMap.zoneColumns}
        rows={shotMap.zoneRows}
        labelWidth={124}
        style={styles.block}
      />
      {shotMap.sampleNote ? (
        <Text className="font-body text-sm text-muted" style={styles.note}>
          {shotMap.sampleNote}
        </Text>
      ) : null}
    </>
  );
}

function HighlightCard({ item }: { item: HighlightView }) {
  return (
    <GlowCard accent={item.tone} corner="lg" padding={14} style={styles.block}>
      <Text className="font-condensed text-label uppercase text-muted" style={styles.label}>
        {item.label}
      </Text>
      {item.name ? (
        <Text className="font-body-medium text-md text-primary" numberOfLines={1}>
          {item.name}
        </Text>
      ) : null}
      <Text className="font-body text-sm text-secondary" style={styles.highlightText}>
        {item.summary}
      </Text>
      {item.impactLabel ? (
        <View style={styles.highlightBadge}>
          <Badge label={item.impactLabel} variant={item.tone} />
        </View>
      ) : null}
    </GlowCard>
  );
}

/** Üres lista helyén egyetlen magyarázó sor – a web üres állapot szövegei. */
function orEmpty(entries: PointEntry[], empty: string): PointEntry[] {
  return entries.length > 0 ? entries : [{ text: empty }];
}

const styles = StyleSheet.create({
  block: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[2],
  },
  section: {
    marginHorizontal: spacing[4],
    marginTop: spacing[6],
  },
  sectionBlock: {
    marginHorizontal: spacing[4],
    marginTop: spacing[6],
  },
  note: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[2],
    lineHeight: 19,
  },
  tiles: {
    flexDirection: 'row',
    gap: spacing[2],
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
  },
  tile: {
    flex: 1,
  },
  list: {
    marginHorizontal: spacing[4],
  },
  players: {
    marginTop: spacing[2],
  },
  label: {
    letterSpacing: letterSpacing(fontSize.label, tracking.label),
    marginBottom: spacing[1],
  },
  highlightText: {
    marginTop: 2,
    lineHeight: 19,
  },
  highlightBadge: {
    flexDirection: 'row',
    marginTop: spacing[2],
  },
  shotTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  mono: {
    fontVariant: ['tabular-nums'],
  },
  shotEfficiency: {
    marginTop: spacing[2],
  },
});
