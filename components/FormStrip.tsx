/**
 * Forma-sáv – az utolsó meccsek eredménye színes hasábokként.
 *
 * Mockup: `docs/mockups/extracted/ma-screen.html` „Forma · Utolsó 5" blokkja.
 * A hasábok **időrendben** állnak, a legrégebbi elöl: így balról jobbra
 * olvasható a szezon haladása.
 */
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, letterSpacing, radius, spacing, tracking } from '@/constants/theme';
import type { FormSummary } from '@/hooks/useTodayData';

interface FormStripProps {
  form: FormSummary;
}

export function FormStrip({ form }: FormStripProps) {
  if (form.results.length === 0) return null;

  return (
    <View style={styles.block}>
      <Text className="font-condensed text-label uppercase text-secondary" style={styles.label}>
        {`Forma · Utolsó ${form.results.length}`}
      </Text>

      <View style={styles.row}>
        <View style={styles.bars}>
          {form.results.map((result, index) => (
            <View
              key={index}
              style={[
                styles.bar,
                {
                  backgroundColor:
                    result === 'win' ? colors.semantic.positive : colors.semantic.negative,
                },
              ]}
            />
          ))}
        </View>

        <Text className="font-mono-bold text-xl text-primary" style={styles.record}>
          {`${form.wins}GY - ${form.losses}V`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[5],
  },
  label: {
    marginBottom: 10,
    letterSpacing: letterSpacing(fontSize.label, tracking.label),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  bars: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  bar: {
    width: 6,
    height: 20,
    borderRadius: radius.xs,
  },
  record: {
    fontVariant: ['tabular-nums'],
  },
});
