/**
 * Negyedenkénti pontbontás – két sor (mi / ellenfél) a negyedek oszlopaival.
 *
 * A `StatMatrix`-ot használja, mert pontosan az a szerkezet kell: fagyasztott
 * névoszlop + numerikus oszlopok. Négy negyed + összesen elfér a képernyőn, a
 * mátrix vízszintes görgetése csak hosszabbítás esetén lép működésbe.
 *
 * Az adat a kosarstat importból jön, ami a meccsek nagy részéhez hiányzik –
 * ilyenkor a szekció egy magyarázó sort mutat, nem tűnik el (D-047).
 */
import { StyleSheet, Text, View } from 'react-native';

import { StatMatrix, type MatrixColumn, type MatrixRow } from '@/components/StatMatrix';
import { spacing } from '@/constants/theme';
import type { QuarterScore } from '@/types/games';

interface QuarterScoresProps {
  quarters: QuarterScore[];
  /** A saját csapatunk rövid neve. */
  ourName: string;
  opponent: string;
}

export function QuarterScores({ quarters, ourName, opponent }: QuarterScoresProps) {
  if (quarters.length === 0) {
    return (
      <Text className="font-body text-sm text-muted" style={styles.note}>
        Ehhez a meccshez nincs negyedenkénti bontás importálva.
      </Text>
    );
  }

  const columns: MatrixColumn[] = [
    ...quarters.map((quarter) => ({ label: `N${quarter.quarter}` })),
    { label: 'Ö' },
  ];

  const ourTotal = sum(quarters.map((quarter) => quarter.ourPoints));
  const oppTotal = sum(quarters.map((quarter) => quarter.oppPoints));

  const rows: MatrixRow[] = [
    {
      label: ourName,
      values: [
        // A saját sorban a megnyert negyed zöld, az elvesztett piros – a
        // döntetlen negyed marad az alapszínen.
        ...quarters.map((quarter) => ({
          value: String(quarter.ourPoints),
          tone: tone(quarter.ourPoints, quarter.oppPoints),
        })),
        { value: String(ourTotal), tone: tone(ourTotal, oppTotal) },
      ],
    },
    {
      label: opponent,
      values: [
        ...quarters.map((quarter) => String(quarter.oppPoints)),
        String(oppTotal),
      ],
    },
  ];

  return (
    <View style={styles.block}>
      <StatMatrix labelHeader="Csapat" columns={columns} rows={rows} />
    </View>
  );
}

function tone(ours: number, theirs: number): 'positive' | 'negative' | undefined {
  if (ours > theirs) return 'positive';
  if (ours < theirs) return 'negative';
  return undefined;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

const styles = StyleSheet.create({
  block: {
    marginHorizontal: spacing[4],
  },
  note: {
    marginHorizontal: spacing[4],
  },
});
