/**
 * „ÉLŐ" jelölő lüktető ponttal.
 *
 * Nem a `Badge`-re épül: az egyetlen `Text` (`overflow: 'hidden'` +
 * `alignSelf: 'flex-start'` a doboz miatt), és egy animált `View` gyerek
 * hozzáadása minden variánsnál megváltoztatná a viselkedést – meglévő UI-t
 * ne módosíts engedély nélkül (CLAUDE.md). A méretei és színei ugyanazok a
 * `glow.negative` tokenek, amiket a `Badge` `negative` variánsa is használ.
 */
import { StyleSheet, Text, View } from 'react-native';

import { LivePulse } from '@/components/LivePulse';
import { colors, fontSize, glow, letterSpacing, radius, tracking } from '@/constants/theme';

export function LiveBadge() {
  return (
    <View style={styles.badge}>
      <LivePulse size={6} />
      <Text className="font-condensed text-label uppercase" style={styles.label}>
        Élő
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderRadius: radius.xs,
    backgroundColor: glow.negative.fill,
    borderColor: glow.negative.border,
  },
  label: {
    color: colors.semantic.negative,
    letterSpacing: letterSpacing(fontSize.label, tracking.label),
    lineHeight: 14,
    includeFontPadding: false,
  },
});
