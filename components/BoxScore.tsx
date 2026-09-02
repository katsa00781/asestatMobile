/**
 * Meccs box score – játékossoronként a teljes statisztika, `StatMatrix`-ben.
 *
 * A fagyasztott oszlop a rövidített játékosnév (`EDWIN D.`), a numerikus
 * oszlopok vízszintesen görgethetők. Az oszlopfeliratok és a jelmagyarázat a
 * webalkalmazás `GameDetails` táblájának rövidítéseit használják, hogy a stáb
 * ugyanazt olvassa a két felületen.
 *
 * A dobásoszlopok `bedobott/kísérlet` alakúak, ezért szélesebbek a mockup
 * 36pt-os számoszlopánál. A `±` (plusz-mínusz) kimarad: az adatbázisban
 * gyakorlatilag mindenhol nulla (D-048).
 */
import { StyleSheet, Text, View } from 'react-native';

import { StatMatrix, type MatrixColumn, type MatrixRow } from '@/components/StatMatrix';
import { spacing } from '@/constants/theme';
import { shortenPlayerName } from '@/lib/format';
import type { PlayerGameLine } from '@/types/games';

/** A `bedobott/kísérlet` alak (`12/18`) JetBrains Mono 13pt-on ~40pt. */
const RATIO_WIDTH = 44;

const COLUMNS: MatrixColumn[] = [
  { label: 'Perc' },
  { label: 'Pont' },
  { label: '2P', width: RATIO_WIDTH },
  { label: '3P', width: RATIO_WIDTH },
  { label: 'Bü', width: RATIO_WIDTH },
  { label: 'LP' },
  { label: 'GP' },
  { label: 'LS' },
  { label: 'BD' },
  { label: 'LV' },
  { label: 'SZ' },
  { label: 'Ért' },
];

const LEGEND =
  'LP = lepattanó · GP = gólpassz · LS = labdaszerzés · BD = blokk · ' +
  'LV = labdavesztés · SZ = szabálytalanság · Ért = értékelés';

interface BoxScoreProps {
  lines: PlayerGameLine[];
}

export function BoxScore({ lines }: BoxScoreProps) {
  if (lines.length === 0) {
    return (
      <Text className="font-body text-sm text-muted" style={styles.note}>
        Ehhez a meccshez nincs rögzített játékosstatisztika.
      </Text>
    );
  }

  const rows: MatrixRow[] = lines.map((line) => ({
    label: shortenPlayerName(line.name),
    values: [
      String(line.minutes),
      // A webes tábla is kiemeli a pontot és az értékelést – ugyanaz a két szín.
      { value: String(line.points), tone: 'orange' },
      ratio(line.twoMade, line.twoAttempted),
      ratio(line.threeMade, line.threeAttempted),
      ratio(line.freeThrowMade, line.freeThrowAttempted),
      String(line.rebounds),
      String(line.assists),
      String(line.steals),
      String(line.blocks),
      String(line.turnovers),
      String(line.fouls),
      { value: String(line.valuation), tone: 'cyan' },
    ],
  }));

  return (
    <View style={styles.block}>
      <StatMatrix labelHeader="Játékos" columns={COLUMNS} rows={rows} />
      <Text className="font-body text-tiny text-muted" style={styles.legend}>
        {LEGEND}
      </Text>
    </View>
  );
}

function ratio(made: number, attempted: number): string {
  return `${made}/${attempted}`;
}

const styles = StyleSheet.create({
  block: {
    marginHorizontal: spacing[4],
  },
  legend: {
    marginTop: spacing[2],
    lineHeight: 15,
  },
  note: {
    marginHorizontal: spacing[4],
  },
});
