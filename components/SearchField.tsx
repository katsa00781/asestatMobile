/**
 * Kereső mező – nagyító ikon + egysoros szövegbevitel.
 *
 * Mockup: `docs/mockups/extracted/jatekosok-lista.html` kereső sávja: 44pt
 * magas surface1 mező subtle kerettel, `sm` sarokkal, a nagyító 14pt-ra a bal
 * széltől, a szöveg 40pt-tól indul.
 */
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, TextInput, View } from 'react-native';
import { Search } from 'lucide-react-native';

import { colors, tapTarget } from '@/constants/theme';

interface SearchFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  /** Kívülről csak elhelyezés (margó) – felületet ne írj át. */
  style?: StyleProp<ViewStyle>;
}

/** A nagyító mérete és bal margója a mockupból. */
const ICON_SIZE = 17;
const ICON_LEFT = 14;

export function SearchField({ value, onChangeText, placeholder, style }: SearchFieldProps) {
  return (
    <View style={[styles.field, style]}>
      <View style={styles.icon} pointerEvents="none">
        <Search size={ICON_SIZE} color={colors.text.muted} strokeWidth={1.8} />
      </View>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
        accessibilityLabel={placeholder}
        className="h-44 rounded-sm border border-line bg-surface1 pl-40 pr-14 font-body text-base text-primary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    position: 'relative',
    justifyContent: 'center',
    height: tapTarget,
  },
  icon: {
    position: 'absolute',
    left: ICON_LEFT,
    // A mező teljes magasságában középre – a `top`/`bottom` páros a
    // `justifyContent`-tel együtt a szöveg alapvonalától függetlenül tart.
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
});
