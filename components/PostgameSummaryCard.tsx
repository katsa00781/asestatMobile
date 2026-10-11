/**
 * A post-game összefoglaló egy szakasza – cím, alatta a pontok.
 *
 * A webes `PostgameSummary` mobil párja (web H18): az összefoglaló eddig egy
 * szövegblokk volt, most szakaszonként egy kártya. A `PointList` tipográfiáját
 * és ritmusát követi; ikon helyett pont áll a sorok előtt, mert a szakaszok
 * nem hangnemet hordoznak. A „Címke: szöveg” alakú pont címkéje halványabb,
 * félkövér – így a hosszú sorok eleje átfutható.
 *
 * A „Következő fókusz” szakasz kiemelt: narancs sáv, cím és pontok, ahogy a
 * weben. A szöveg szabályalapú, nem AI-generált (D-122).
 */
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { GlowCard } from '@/components/GlowCard';
import {
  accentColor,
  colors,
  fontSize,
  letterSpacing,
  radius,
  spacing,
  tracking,
} from '@/constants/theme';
import type { SummarySection } from '@/types/postgame';

interface PostgameSummaryCardProps {
  section: SummarySection;
  /** Kívülről csak elhelyezés (margó). */
  style?: StyleProp<ViewStyle>;
}

/** A sorjelölő pont átmérője – a web 6px-es pontja. */
const DOT_SIZE = 6;
/** 15pt szöveg 1.5-es sorközzel – a `PointList` sorával egyező. */
const LINE_HEIGHT = 23;

export function PostgameSummaryCard({ section, style }: PostgameSummaryCardProps) {
  const tone = section.focus ? accentColor.orange : accentColor.cyan;

  return (
    <GlowCard accent={section.focus ? 'orange' : undefined} corner="lg" padding={14} style={style}>
      {section.title ? (
        <Text
          className="font-condensed text-label uppercase text-muted"
          style={[styles.title, section.focus ? { color: tone } : null]}
          accessibilityRole="header"
        >
          {section.title}
        </Text>
      ) : null}

      {section.items.map((item, index) => (
        <View key={`${index}-${item.text}`} style={[styles.row, index > 0 ? styles.spaced : null]}>
          <View style={styles.marker}>
            <View style={[styles.dot, { backgroundColor: tone }]} />
          </View>
          <Text className="font-body text-md text-primary" style={styles.text}>
            {item.label ? (
              <Text className="font-body-medium text-md" style={styles.itemLabel}>
                {`${item.label}: `}
              </Text>
            ) : null}
            {item.text}
          </Text>
        </View>
      ))}
    </GlowCard>
  );
}

const styles = StyleSheet.create({
  title: {
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
  marker: {
    // A pont a szöveg első sorának közepére kerül, nem a doboz tetejére.
    height: LINE_HEIGHT,
    justifyContent: 'center',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: radius.pill,
  },
  text: {
    flex: 1,
    lineHeight: LINE_HEIGHT,
  },
  itemLabel: {
    color: colors.text.secondary,
  },
});
