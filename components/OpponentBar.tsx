/**
 * Ellenfélsáv – az éppen elemzett ellenfél, és a váltás belépési pontja.
 *
 * A `NavRow` mintájára épül (60pt kártya, bal oldali ikon, jobb szélén jelző),
 * de itt a jobb oldali ikon **lefelé** mutat: a sor nem új képernyőre visz,
 * hanem bottom sheetet nyit. Az eyebrow mondja meg, honnan jött az ellenfél
 * (következő találkozó, legutóbbi meccs, vagy kézi választás).
 */
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { ChevronDown, Swords } from 'lucide-react-native';

import { GlowCard } from '@/components/GlowCard';
import { colors, fontSize, letterSpacing, spacing, tracking } from '@/constants/theme';
import type { OpponentMeta } from '@/types/scouting';

interface OpponentBarProps {
  name: string;
  meta: OpponentMeta;
  onPress: () => void;
  /** Kívülről csak elhelyezés (margó). */
  style?: StyleProp<ViewStyle>;
}

const ICON_SIZE = 22;

export function OpponentBar({ name, meta, onPress, style }: OpponentBarProps) {
  return (
    <GlowCard
      accent="orange"
      corner="lg"
      padding={14}
      onPress={onPress}
      accessibilityLabel={`${meta.label}: ${name}. Koppints másik ellenfél választásához.`}
      style={style}
    >
      <View style={styles.row}>
        <Swords size={ICON_SIZE} color={colors.accent.orange} strokeWidth={1.8} />

        <View style={styles.texts}>
          <Text
            className="font-condensed text-label uppercase text-muted"
            style={styles.eyebrow}
            numberOfLines={1}
          >
            {meta.label}
          </Text>
          <Text className="font-condensed text-lg uppercase text-primary" numberOfLines={1}>
            {name}
          </Text>
          {meta.detail ? (
            <Text className="font-body text-sm text-secondary" numberOfLines={1}>
              {meta.detail}
            </Text>
          ) : null}
        </View>

        <ChevronDown size={18} color={colors.text.muted} strokeWidth={2} />
      </View>
    </GlowCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  texts: {
    flex: 1,
  },
  eyebrow: {
    letterSpacing: letterSpacing(fontSize.label, tracking.label),
    marginBottom: 2,
  },
});
