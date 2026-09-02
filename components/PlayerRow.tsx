/**
 * A játékoslista sora – mezszám, rövidített név, pozíció és három átlag.
 *
 * Mockup: `docs/mockups/extracted/jatekosok-lista.html` játékossora. A sor a
 * `StackedRow`-ra épül, az oszlopok szélessége és a fejléc feliratai a
 * `StackedRowHeader`-rel közösek.
 *
 * A név **rövidítve** áll a sorban (`Payton J.`): a mockup 48pt-os
 * számoszlopai mellett ~94pt marad a névnek, amibe a valódi, gyakran
 * négyszavas nevek nem férnek be – D-051.
 */
import { StyleSheet } from 'react-native';

import { StackedRow } from '@/components/StackedRow';
import { spacing } from '@/constants/theme';
import type { PlayerSort } from '@/data/player-sorts';
import { formatDecimal, shortenPlayerName } from '@/lib/format';
import type { SeasonPlayer } from '@/types/players';

interface PlayerRowProps {
  player: SeasonPlayer;
  /** A látható numerikus oszlopok – a fejléccel azonos sorrendben. */
  columns: PlayerSort[];
  onPress: () => void;
}

export function PlayerRow({ player, columns, onPress }: PlayerRowProps) {
  return (
    <StackedRow
      leading={String(player.number)}
      title={shortenPlayerName(player.name)}
      subtitle={player.positionLabel}
      metrics={columns.map((column) => ({ value: formatDecimal(column.value(player)) }))}
      onPress={onPress}
      style={styles.row}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing[2],
  },
});
