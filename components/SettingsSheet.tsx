/**
 * Beállítás bottom sheet – a fejléc fogaskerekéről nyílik.
 *
 * Mockupja nincs: a mockup fejlécében csak az ikon szerepel, tartalom nélkül.
 * A lap a `BottomSheet` vázát és a `szuro-bottom-sheet.html` sorformáit
 * használja. Mobilon nincs admin funkció, ezért itt csak az látszik, ki van
 * bejelentkezve, melyik verzió fut, és innen lehet kijelentkezni (D-041).
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { LogOut } from 'lucide-react-native';

import { BottomSheet } from '@/components/BottomSheet';
import {
  colors,
  fontSize,
  glow,
  letterSpacing,
  radius,
  tapTarget,
  tracking,
} from '@/constants/theme';
import { usePressed } from '@/hooks/usePressed';
import { useAuthStore } from '@/store/authStore';

interface SettingsSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function SettingsSheet({ visible, onClose }: SettingsSheetProps) {
  const email = useAuthStore((state) => state.user?.email);
  const signOut = useAuthStore((state) => state.signOut);

  // Előbb csukunk: kijelentkezés után az auth guard a login képernyőre visz, és
  // a lecsúszó animáció már nem futna le a leszerelt navigátor alatt.
  const handleSignOut = () => {
    onClose();
    void signOut();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Beállítások"
      footnote="Az adminisztráció és az AI riportok készítése a webes felületen érhető el."
    >
      <InfoRow label="Bejelentkezve" value={email ?? 'Ismeretlen felhasználó'} />
      <InfoRow label="Verzió" value={Constants.expoConfig?.version ?? '—'} numeric />

      <SignOutButton onPress={handleSignOut} />
    </BottomSheet>
  );
}

function InfoRow({
  label,
  value,
  numeric = false,
}: {
  label: string;
  value: string;
  numeric?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text
        className="font-condensed text-label uppercase text-secondary"
        style={{ letterSpacing: letterSpacing(fontSize.label, tracking.label) }}
      >
        {label}
      </Text>
      <Text
        className={numeric ? 'font-mono text-sm text-primary' : 'font-body text-sm text-primary'}
        numberOfLines={1}
        style={styles.value}
      >
        {value}
      </Text>
    </View>
  );
}

function SignOutButton({ onPress }: { onPress: () => void }) {
  const button = usePressed();

  return (
    <Pressable
      onPress={onPress}
      {...button.pressHandlers}
      accessibilityRole="button"
      style={[styles.signOut, { opacity: button.pressed ? 0.85 : 1 }]}
    >
      <LogOut size={16} color={colors.semantic.negative} strokeWidth={1.8} />
      <Text
        className="font-condensed text-sm uppercase text-negative"
        style={{ letterSpacing: letterSpacing(fontSize.sm, tracking.wide) }}
      >
        Kijelentkezés
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.row,
  },
  value: {
    // Hosszú email ne tolja ki a feliratot, hanem maga rövidüljön.
    flexShrink: 1,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: tapTarget,
    marginTop: 20,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: glow.negative.fill,
    borderColor: glow.negative.border,
  },
});
