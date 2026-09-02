/**
 * Meccsenkénti bontás – egy játékos szezonjának minden meccse egy sorban,
 * `StatMatrix`-ben.
 *
 * A fagyasztott oszlop az ellenfél rövid neve, előtte a hazai/vendég jelzés
 * (`H` / `V`), az első görgethető oszlop a dátum. A dátum színe a meccs
 * eredménye (zöld: nyert, piros: vesztett) – a jelmagyarázat ki is írja, mert
 * a színre magában nem támaszkodhatunk.
 *
 * Az oszlopok és a rövidítések a `BoxScore`-éval azonosak, hogy a két mátrix
 * ugyanúgy legyen olvasható.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';

import { StatMatrix, type MatrixColumn, type MatrixRow } from '@/components/StatMatrix';
import { colors, fontSize, letterSpacing, spacing, tapTarget, tracking } from '@/constants/theme';
import { usePressed } from '@/hooks/usePressed';
import type { PlayerGameRow } from '@/types/players';

/** A `bedobott/kísérlet` alak (`12/18`) JetBrains Mono 13pt-on ~40pt. */
const RATIO_WIDTH = 44;
/** A `05.25` alak ugyanennyi helyet kér. */
const DATE_WIDTH = 44;
/** A fagyasztott oszlop szélesebb a mátrix 108pt-os alapértékénél: a
 * hazai/vendég jelzéssel a leghosszabb rövid név (`V · PVSK-VEOLIA`) is elfér. */
const LABEL_WIDTH = 120;

/**
 * Ennyi meccs látszik alapból. Egy szezon 50 sora egyszerre kirajzolva
 * észrevehetően lassítja az első megjelenést, és a görgetés nagy részét is
 * elviszi – a régebbi meccsek egy koppintásra maradnak (D-053).
 */
const COLLAPSED_ROWS = 10;

const COLUMNS: MatrixColumn[] = [
  { label: 'Dátum', width: DATE_WIDTH },
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
  'A dátum színe az eredmény: zöld nyert, piros vesztett · LP = lepattanó · ' +
  'GP = gólpassz · LS = labdaszerzés · BD = blokk · LV = labdavesztés · ' +
  'SZ = szabálytalanság · Ért = értékelés';

interface PlayerGameLogProps {
  games: PlayerGameRow[];
}

export function PlayerGameLog({ games }: PlayerGameLogProps) {
  const [expanded, setExpanded] = useState(false);

  if (games.length === 0) {
    return (
      <Text className="font-body text-sm text-muted" style={styles.note}>
        Ehhez a játékoshoz nincs rögzített meccsstatisztika ebben a szezonban.
      </Text>
    );
  }

  const visible = expanded ? games : games.slice(0, COLLAPSED_ROWS);
  const hidden = games.length - visible.length;

  const rows: MatrixRow[] = visible.map((game) => ({
    label: `${game.homeAway === 'home' ? 'H' : 'V'} · ${game.opponent}`,
    values: [
      { value: shortDate(game.date), tone: game.result === 'win' ? 'positive' : 'negative' },
      String(game.minutes),
      // A `BoxScore` is kiemeli a pontot és az értékelést – ugyanaz a két szín.
      { value: String(game.points), tone: 'orange' },
      ratio(game.twoMade, game.twoAttempted),
      ratio(game.threeMade, game.threeAttempted),
      ratio(game.freeThrowMade, game.freeThrowAttempted),
      String(game.rebounds),
      String(game.assists),
      String(game.steals),
      String(game.blocks),
      String(game.turnovers),
      String(game.fouls),
      { value: String(game.valuation), tone: 'cyan' },
    ],
  }));

  return (
    <View style={styles.block}>
      <StatMatrix labelHeader="Ellenfél" columns={COLUMNS} rows={rows} labelWidth={LABEL_WIDTH} />

      {hidden > 0 ? <ExpandButton hidden={hidden} onPress={() => setExpanded(true)} /> : null}

      <Text className="font-body text-tiny text-muted" style={styles.legend}>
        {LEGEND}
      </Text>
    </View>
  );
}

function ExpandButton({ hidden, onPress }: { hidden: number; onPress: () => void }) {
  const button = usePressed();

  return (
    <Pressable
      onPress={onPress}
      {...button.pressHandlers}
      accessibilityRole="button"
      // A felirat 13pt magas: a teljes 44pt-os sávot maga a gomb adja, hogy a
      // célpont a kártyán belül maradjon (D-038).
      style={[styles.button, { opacity: button.pressed ? 0.6 : 1 }]}
    >
      <Text
        className="font-condensed text-sm uppercase text-cyan"
        style={{ letterSpacing: letterSpacing(fontSize.sm, tracking.wide) }}
      >
        {`További ${hidden} meccs`}
      </Text>
      <ChevronDown size={14} color={colors.accent.cyan} strokeWidth={2} />
    </Pressable>
  );
}

/** `2026-05-25` → `05.25` – a mátrix 44pt-os oszlopába csak ennyi fér. */
function shortDate(iso: string): string {
  const match = /^\d{4}-(\d{2})-(\d{2})/.exec(iso);
  return match ? `${match[1]}.${match[2]}` : iso;
}

function ratio(made: number, attempted: number): string {
  return `${made}/${attempted}`;
}

const styles = StyleSheet.create({
  block: {
    marginHorizontal: spacing[4],
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: tapTarget,
  },
  legend: {
    marginTop: spacing[2],
    lineHeight: 15,
  },
  note: {
    marginHorizontal: spacing[4],
  },
});
