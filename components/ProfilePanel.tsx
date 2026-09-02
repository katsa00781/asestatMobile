/**
 * Játékstílus-panel – egy csapat tempója és stílusjegyei badge-ekben.
 *
 * A stílusszavak a `@core/style-vocabulary` kész feliratai („Periméter-fókuszú",
 * „Labdanyomás"), ezért itt nincs fordítás, csak elrendezés: a badge-ek
 * tördelt sorban állnak, a tempó az elsőként kiemelve.
 */
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { Badge } from '@/components/Badge';
import { GlowCard } from '@/components/GlowCard';
import type { AccentTone } from '@/constants/theme';
import type { ProfileView } from '@/types/scouting';

interface ProfilePanelProps {
  profile: ProfileView;
  /** A tempó badge hangneme – az ellenfélé narancs, a sajátunké cián. */
  tone: AccentTone;
  /** Kívülről csak elhelyezés (margó). */
  style?: StyleProp<ViewStyle>;
}

export function ProfilePanel({ profile, tone, style }: ProfilePanelProps) {
  return (
    <GlowCard corner="lg" padding={14} style={style}>
      <Text className="font-body-medium text-md text-primary" numberOfLines={1}>
        {profile.label}
      </Text>

      <View style={styles.tags}>
        <Badge label={profile.tempoText} variant={tone} />
        {profile.tags.map((tag) => (
          <Badge key={tag} label={tag} />
        ))}
      </View>
    </GlowCard>
  );
}

const styles = StyleSheet.create({
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
});
