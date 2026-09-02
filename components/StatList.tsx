/**
 * Címke–érték lista egy kártyán belül – a webes „További Statisztikák" rács
 * mobil párja.
 *
 * Mockup ehhez nincs; a sor tipográfiája a `StackedRow`-é (DM Sans címke,
 * JetBrains Mono érték), az elválasztó a mátrix `border.hairline` vonala.
 * Két oszlopos rács helyett egy oszlop: mobilon a hosszú magyar címkék
 * („Kiharcolt szabálytalanság") így maradnak egy sorban olvashatók.
 */
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { type AccentTone, accentColor, colors, spacing } from '@/constants/theme';
import { GlowCard } from '@/components/GlowCard';

export interface StatListItem {
  label: string;
  /** Már formázott érték – a lista nem számol és nem kerekít. */
  value: string;
  /** Kiemelés. Elhagyva `text.primary`. */
  tone?: AccentTone;
}

interface StatListProps {
  items: StatListItem[];
  /** Kívülről csak elhelyezés (margó, `flex`). */
  style?: StyleProp<ViewStyle>;
}

/** Sormagasság: 13pt címke 8-8pt margóval, a mátrix sorával egyező ritmusban. */
const ROW_HEIGHT = 34;

export function StatList({ items, style }: StatListProps) {
  return (
    <GlowCard corner="lg" padding={14} style={style}>
      {items.map((item, index) => (
        <View key={item.label} style={[styles.row, index > 0 ? styles.divided : null]}>
          <Text className="flex-1 font-body text-sm text-secondary" numberOfLines={1}>
            {item.label}
          </Text>
          <Text
            className="font-mono text-md"
            style={[
              styles.value,
              { color: item.tone ? accentColor[item.tone] : colors.text.primary },
            ]}
            numberOfLines={1}
          >
            {item.value}
          </Text>
        </View>
      ))}
    </GlowCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    minHeight: ROW_HEIGHT,
  },
  divided: {
    borderTopWidth: 1,
    borderTopColor: colors.border.hairline,
  },
  value: {
    fontVariant: ['tabular-nums'],
  },
});
