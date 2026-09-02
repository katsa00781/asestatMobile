/**
 * Navigációs sor egy szekción belül (P12 3. pont – „Számított elemzések").
 *
 * 60pt magas kártya: bal oldalt 22pt-os vonalas ikon accent színben, mellette
 * a cím és alatta a leírás, jobb szélén chevron. A sor egésze nyomható, így az
 * érintési célpont bőven 44pt fölött van.
 *
 * A cím DM Sans **Medium** betűvel fut, nem 600-assal – a csomagolt család
 * 500-as és 700-as vágattal jött (D-019).
 */
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';

import { GlowCard } from '@/components/GlowCard';
import { type AccentTone, accentColor, colors, spacing } from '@/constants/theme';

interface NavRowProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Az ikon színe. */
  tone: AccentTone;
  onPress: () => void;
  /** Kívülről csak elhelyezés (margó). */
  style?: StyleProp<ViewStyle>;
}

/** A prompt sormagassága. */
const ROW_HEIGHT = 60;
const ICON_SIZE = 22;

export function NavRow({ icon: Icon, title, description, tone, onPress, style }: NavRowProps) {
  return (
    <GlowCard
      corner="lg"
      padding={14}
      onPress={onPress}
      accessibilityLabel={`${title}. ${description}`}
      style={[styles.card, style]}
    >
      <View style={styles.row}>
        <Icon size={ICON_SIZE} color={accentColor[tone]} strokeWidth={1.8} />

        <View style={styles.texts}>
          <Text className="font-body-medium text-md text-primary" numberOfLines={1}>
            {title}
          </Text>
          <Text className="font-body text-sm text-muted" style={styles.description} numberOfLines={1}>
            {description}
          </Text>
        </View>

        <ChevronRight size={18} color={colors.text.muted} strokeWidth={2} />
      </View>
    </GlowCard>
  );
}

const styles = StyleSheet.create({
  card: {
    height: ROW_HEIGHT,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  texts: {
    flex: 1,
  },
  description: {
    marginTop: 1,
  },
});
