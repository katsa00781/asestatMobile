/**
 * Ellenfélválasztó bottom sheet.
 *
 * A lapot, a záró gesztust és az Android back kezelését a `BottomSheet` adja;
 * a sorok tipográfiája és aktív jelölése a `FilterSheet`-é, hogy a két
 * választó ugyanúgy nézzen ki. A választás azonnal érvényesül és bezárja a
 * lapot – itt nincs több szekció, amin tovább lehetne menni.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { colors, radius } from '@/constants/theme';
import { usePressed } from '@/hooks/usePressed';
import type { OpponentOption } from '@/types/scouting';

interface OpponentSheetProps {
  visible: boolean;
  onClose: () => void;
  options: OpponentOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function OpponentSheet({
  visible,
  onClose,
  options,
  selectedId,
  onSelect,
}: OpponentSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Ellenfél"
      footnote="A liga csapatai, amelyekhez van szezonadat."
    >
      {options.map((option) => (
        <OptionRow
          key={option.id}
          option={option}
          active={option.id === selectedId}
          onPress={() => {
            onSelect(option.id);
            onClose();
          }}
        />
      ))}

      {options.length === 0 ? (
        <View style={styles.row}>
          <Text className="font-body text-sm text-muted">Nincs elemezhető ellenfél.</Text>
        </View>
      ) : null}
    </BottomSheet>
  );
}

function OptionRow({
  option,
  active,
  onPress,
}: {
  option: OpponentOption;
  active: boolean;
  onPress: () => void;
}) {
  const row = usePressed();

  return (
    <Pressable
      onPress={onPress}
      {...row.pressHandlers}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      style={[
        styles.row,
        { backgroundColor: active || row.pressed ? colors.bg.surface3 : 'transparent' },
      ]}
    >
      {active ? <View style={styles.activeBar} /> : null}

      <Text
        className="flex-1 font-body-medium text-md"
        style={{ color: active ? colors.accent.cyan : colors.text.primary }}
        numberOfLines={1}
      >
        {option.name}
      </Text>

      <Text className="font-mono text-sm text-muted" style={styles.games} numberOfLines={1}>
        {option.gamesText}
      </Text>

      {active ? <Check size={16} color={colors.accent.cyan} strokeWidth={2.2} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    paddingLeft: 16,
    paddingRight: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.row,
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 2,
    backgroundColor: colors.accent.cyan,
    borderTopRightRadius: radius.xs,
    borderBottomRightRadius: radius.xs,
  },
  games: {
    fontVariant: ['tabular-nums'],
  },
});
