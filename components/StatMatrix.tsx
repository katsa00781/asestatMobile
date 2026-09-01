/**
 * Statisztikai mátrix – a webes `DataTable` mobil párja sok oszlop esetén.
 *
 * Mockup: `docs/mockups/extracted/p0-style-tile.html` („StatMatrix minta").
 * A bal oldali névoszlop fix szélességű és **fagyasztott**, a numerikus
 * oszlopok vízszintesen görgethetők. A két oldal külön nézetfa, ezért a sorok
 * magassága fix szám – csak így marad a névsor és a számsor egy vonalban
 * mindkét platformon (lásd D-034).
 *
 * A mátrix függőlegesen nem görget: a hívó képernyő görgetőjében ül.
 */
import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  type AccentTone,
  accentColor,
  colors,
  fontSize,
  letterSpacing,
  radius,
  tracking,
} from '@/constants/theme';

/** Egy numerikus oszlop fejléce. */
export interface MatrixColumn {
  /** Oszlopfelirat – ALL CAPS-ra a komponens formázza. */
  label: string;
  /** Oszlopszélesség, ha a mockup 36pt-ja kevés (pl. négyjegyű érték). */
  width?: number;
}

/**
 * Egy cella. Sima sztringként a `text.primary` színt kapja; hangnemmel
 * kiemelhető (pl. a tabella pontkülönbsége zölden / pirosan).
 */
export type MatrixValue = string | { value: string; tone?: AccentTone };

export interface MatrixRow {
  /** Fagyasztott oszlop tartalma, pl. rövidített játékosnév. */
  label: string;
  /** Az oszlopokkal azonos sorrendben és darabszámban. */
  values: MatrixValue[];
}

interface StatMatrixProps {
  /** A fagyasztott oszlop fejléce, pl. „Játékos". */
  labelHeader: string;
  columns: MatrixColumn[];
  rows: MatrixRow[];
  /** A fagyasztott oszlop szélessége. A mockupban 108pt. */
  labelWidth?: number;
  /** Kívülről csak elhelyezés (margó, `flex`) – felületet ne írj át. */
  style?: StyleProp<ViewStyle>;
}

/** A mockup cellamagasságai: 8pt margó + szövegsor + 8pt margó. */
const HEADER_HEIGHT = 30;
const ROW_HEIGHT = 34;
/** Rögzített sormagasság, hogy a két oszlop egy vonalban maradjon. */
const HEADER_LINE = 14;
const ROW_LINE = 18;

const LABEL_WIDTH = 108;
const COLUMN_WIDTH = 36;

export function StatMatrix({
  labelHeader,
  columns,
  rows,
  labelWidth = LABEL_WIDTH,
  style,
}: StatMatrixProps) {
  return (
    <View style={[styles.matrix, style]}>
      <View style={[styles.frozen, { width: labelWidth }]}>
        <View style={styles.headerCell}>
          <Text className="font-condensed text-tiny uppercase text-muted" style={styles.headerText} numberOfLines={1}>
            {labelHeader}
          </Text>
        </View>
        {rows.map((row, index) => (
          <View key={index} style={styles.labelCell}>
            <Text className="font-body text-sm text-primary" style={styles.labelText} numberOfLines={1}>
              {row.label}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView
        horizontal
        style={styles.scroller}
        contentContainerStyle={styles.scrollContent}
        showsHorizontalScrollIndicator
        // Sötét felületen az alapértelmezett (fekete) jelző láthatatlan – iOS-only prop.
        indicatorStyle="white"
      >
        <View>
          <View style={[styles.cellRow, styles.headerRow]}>
            {columns.map((column, index) => (
              <Text
                key={index}
                className="font-condensed text-tiny uppercase text-muted"
                style={[styles.headerText, styles.numeric, { width: column.width ?? COLUMN_WIDTH }]}
                numberOfLines={1}
              >
                {column.label}
              </Text>
            ))}
          </View>

          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={[styles.cellRow, styles.dataRow]}>
              {row.values.map((value, index) => {
                const cell = typeof value === 'string' ? { value } : value;
                return (
                  <Text
                    key={index}
                    className="font-mono text-sm"
                    style={[
                      styles.valueText,
                      styles.numeric,
                      { width: columns[index]?.width ?? COLUMN_WIDTH },
                      { color: cell.tone ? accentColor[cell.tone] : colors.text.primary },
                    ]}
                    numberOfLines={1}
                  >
                    {cell.value}
                  </Text>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  matrix: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    backgroundColor: colors.bg.surface1,
    overflow: 'hidden',
  },
  frozen: {
    flexShrink: 0,
    borderRightWidth: 1,
    borderRightColor: colors.border.subtle,
    backgroundColor: colors.bg.surface1,
    // A görgethető oldal fölé kell rajzolódnia, különben az takarná az árnyékot.
    zIndex: 1,
    boxShadow: '2px 0px 8px rgba(0,0,0,0.4)',
  },
  headerCell: {
    height: HEADER_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.hairline,
  },
  labelCell: {
    height: ROW_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  headerText: {
    lineHeight: HEADER_LINE,
    letterSpacing: letterSpacing(fontSize.tiny, tracking.label),
  },
  labelText: {
    lineHeight: ROW_LINE,
  },
  scroller: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  scrollContent: {
    // A tartalom szélessége az oszlopoké; keskeny mátrixnál a maradék hely a
    // görgető bg.base háttere marad, ahogy a mockupban is.
    flexGrow: 1,
  },
  cellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 16,
  },
  headerRow: {
    height: HEADER_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.hairline,
  },
  dataRow: {
    height: ROW_HEIGHT,
  },
  valueText: {
    lineHeight: ROW_LINE,
    fontVariant: ['tabular-nums'],
  },
  numeric: {
    textAlign: 'right',
  },
});
