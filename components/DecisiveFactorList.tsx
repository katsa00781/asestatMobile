/**
 * Döntő tényezők egy csoportja – a post-game elemzés „Támadás – Hatékonyság"
 * jellegű blokkja.
 *
 * A `PointList` tipográfiáját és ritmusát követi, két eltéréssel: a fejlécben
 * a tengely ikonja áll (támadás `Zap` narancs, védekezés `Shield` cián – a web
 * ⚡/🛡️ emojija helyett), és a hangnem tételenként változik: a csapat javára
 * szóló tényező zöld felfelé, a kárára szóló piros lefelé mutató nyíl.
 */
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Shield, TrendingDown, TrendingUp, Zap } from 'lucide-react-native';

import { GlowCard } from '@/components/GlowCard';
import { accentColor, fontSize, letterSpacing, spacing, tracking } from '@/constants/theme';
import type { DecisiveGroup } from '@/types/postgame';

interface DecisiveFactorListProps {
  group: DecisiveGroup;
  /** Kívülről csak elhelyezés (margó). */
  style?: StyleProp<ViewStyle>;
}

const ICON_SIZE = 16;
/** 15pt szöveg 1.5-es sorközzel – a `PointList` sorával egyező. */
const LINE_HEIGHT = 23;

export function DecisiveFactorList({ group, style }: DecisiveFactorListProps) {
  const offense = group.axis === 'offense';
  const AxisIcon = offense ? Zap : Shield;
  const axisColor = offense ? accentColor.orange : accentColor.cyan;

  return (
    <GlowCard corner="lg" padding={14} style={style}>
      <View style={styles.header}>
        <AxisIcon size={ICON_SIZE} color={axisColor} strokeWidth={2} />
        <Text
          className="font-condensed text-label uppercase text-muted"
          style={styles.label}
          accessibilityRole="header"
        >
          {group.title}
        </Text>
      </View>

      {group.items.map((item, index) => {
        const Icon = item.negative ? TrendingDown : TrendingUp;
        const color = item.negative ? accentColor.negative : accentColor.positive;

        return (
          <View key={item.text} style={[styles.row, index > 0 ? styles.spaced : null]}>
            <View style={styles.icon}>
              <Icon size={ICON_SIZE} color={color} strokeWidth={2} />
            </View>
            <Text className="font-body text-md text-primary" style={styles.text}>
              {item.text}
            </Text>
          </View>
        );
      })}
    </GlowCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: 10,
  },
  label: {
    letterSpacing: letterSpacing(fontSize.label, tracking.label),
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  spaced: {
    marginTop: spacing[3],
  },
  icon: {
    // Az ikon a szöveg első sorának közepére kerül, nem a doboz tetejére.
    height: LINE_HEIGHT,
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    lineHeight: LINE_HEIGHT,
  },
});
