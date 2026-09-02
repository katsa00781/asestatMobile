/**
 * Megállapítás-lista – címke és néhány rövid mondat ikonnal.
 *
 * A `ReportBody` megállapítás-blokkjainak mintájára: az ikon a szöveg első
 * sorához igazodik, a szöveg DM Sans 15pt. A hangnem adja az ikon színét –
 * veszélyforrás piros, támadható pont zöld, teendő cián.
 *
 * A `note` a sor alatti halványabb kiegészítés (a kockázati forgatókönyvek
 * válaszlépése).
 */
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { GlowCard } from '@/components/GlowCard';
import {
  type AccentTone,
  accentColor,
  fontSize,
  letterSpacing,
  spacing,
  tracking,
} from '@/constants/theme';
import type { PointEntry } from '@/types/scouting';

interface PointListProps {
  label: string;
  entries: PointEntry[];
  icon: LucideIcon;
  tone: AccentTone;
  /** Kívülről csak elhelyezés (margó). */
  style?: StyleProp<ViewStyle>;
}

const ICON_SIZE = 16;
/** 15pt szöveg 1.5-es sorközzel – az ikon ehhez a sorhoz igazodik. */
const LINE_HEIGHT = 23;

export function PointList({ label, entries, icon: Icon, tone, style }: PointListProps) {
  return (
    <GlowCard corner="lg" padding={14} style={style}>
      <Text
        className="font-condensed text-label uppercase text-muted"
        style={styles.label}
        accessibilityRole="header"
      >
        {label}
      </Text>

      {entries.map((entry, index) => (
        <View key={entry.text} style={[styles.row, index > 0 ? styles.spaced : null]}>
          <View style={styles.icon}>
            <Icon size={ICON_SIZE} color={accentColor[tone]} strokeWidth={2} />
          </View>

          <View style={styles.texts}>
            <Text className="font-body text-md text-primary" style={styles.text}>
              {entry.text}
            </Text>
            {entry.note ? (
              <Text className="font-body text-sm text-secondary" style={styles.note}>
                {entry.note}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </GlowCard>
  );
}

const styles = StyleSheet.create({
  label: {
    letterSpacing: letterSpacing(fontSize.label, tracking.label),
    marginBottom: 10,
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
  texts: {
    flex: 1,
  },
  text: {
    lineHeight: LINE_HEIGHT,
  },
  note: {
    marginTop: 2,
    lineHeight: 19,
  },
});
