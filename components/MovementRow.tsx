/**
 * Igazolás-sor – egy érkező vagy távozó játékos.
 *
 * Design prompt: `docs/design-prompts.md` – P15, 7. és 9. pont. A sor a
 * `StackedRow` mintáját követi (bal oldali accent sín, függőlegesen
 * csoportosított cím + alcím), de a jobb oldalán nem numerikus oszlopok
 * állnak, hanem badge + célállomás, ezért saját komponens (D-116).
 *
 * A felület a `GlowCard`: surface1 alap, 3pt accent sín (érkező cián, távozó
 * narancs), lenyomva surface2 – pontosan a prompt nyomott állapota.
 *
 * Ha a játékosnak van ellenőrzött forrásprofilja, a sor megnyitja azt a
 * rendszerböngészőben. A nyers `profile_url` sosem kerül ide: a `@core`
 * `playerProfileUrl()` HTTPS + hostname ellenőrzése után marad csak URL (D-113).
 */
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { ExternalLink } from 'lucide-react-native';

import { Badge } from '@/components/Badge';
import { GlowCard } from '@/components/GlowCard';
import { colors, spacing } from '@/constants/theme';
import type { MovementEntry } from '@/types/movements';

interface MovementRowProps {
  entry: MovementEntry;
}

/** A prompt sormagassága. */
const ROW_HEIGHT = 72;

export function MovementRow({ entry }: MovementRowProps) {
  const accent = entry.direction === 'arrival' ? 'cyan' : 'orange';
  const { profileUrl } = entry;
  const open = profileUrl ? () => openProfile(profileUrl) : undefined;

  return (
    <GlowCard
      accent={accent}
      corner="lg"
      padding={14}
      onPress={open}
      accessibilityLabel={`${entry.name}, ${entry.label}, ${entry.counterpart}. Profil megnyitása.`}
      style={styles.row}
    >
      <View style={styles.content}>
        <View style={styles.identity}>
          <View style={styles.nameLine}>
            <Text className="font-body-medium text-md text-primary" numberOfLines={1}>
              {entry.name}
            </Text>
            {/* A prompt „halvány cián" ikont kér; a halványságot a 12pt méret
                és a vékony vonal adja, nem új színtoken. */}
            {profileUrl ? (
              <ExternalLink size={12} color={colors.accent.cyan} strokeWidth={1.6} />
            ) : null}
          </View>

          {entry.position ? (
            <Text className="font-body text-sm text-muted" style={styles.position} numberOfLines={1}>
              {entry.position}
            </Text>
          ) : null}
        </View>

        <View style={styles.meta}>
          <Badge label={entry.label} variant={entry.badge} style={styles.badge} />
          <Text className="font-body text-sm text-muted" style={styles.counterpart} numberOfLines={2}>
            {entry.counterpart}
          </Text>
        </View>
      </View>
    </GlowCard>
  );
}

/**
 * A profil a rendszerböngészőben nyílik. Ha az eszköz nem tudja megnyitni
 * (nincs böngésző, letiltott séma), szólunk – a néma kudarc rosszabb.
 */
function openProfile(url: string): void {
  void Linking.openURL(url).catch(() => {
    Alert.alert('Nem sikerült megnyitni', 'A játékos profilja nem nyitható meg ezen az eszközön.');
  });
}

const styles = StyleSheet.create({
  row: {
    minHeight: ROW_HEIGHT,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  identity: {
    flex: 1,
    minWidth: 0,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  position: {
    marginTop: 2,
  },
  meta: {
    // A badge és a származás jobbra igazítva, a badge a sor tetején.
    alignItems: 'flex-end',
    maxWidth: '46%',
  },
  badge: {
    alignSelf: 'flex-end',
  },
  counterpart: {
    marginTop: 4,
    textAlign: 'right',
  },
});
