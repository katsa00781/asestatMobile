/**
 * A meccslista két sorfajtája: lejátszott meccs és közelgő találkozó.
 *
 * Mindkettő a `StackedRow`-ra épül, és ugyanazt a két szabályt követi, ezért
 * él a kettő egy fájlban:
 * - a bal oldali kör a **hazai/vendég** jelzés (`H` / `V`), nem mezszám,
 * - a jobb oldali oszlop szélessége közös, így a két szekció számai egy
 *   vonalban állnak.
 *
 * Mockup ehhez a képernyőhöz nincs; a sor felépítése a `Jatekosok Lista`
 * mockup listasorát követi (68pt magas surface1 sáv, 32pt vezérjel-kör,
 * függőlegesen csoportosított cím + alcím, jobbra igazított mono érték).
 */
import { StyleSheet } from 'react-native';

import { StackedRow } from '@/components/StackedRow';
import { spacing } from '@/constants/theme';
import { formatCountdown, formatDate } from '@/lib/format';
import type { Fixture, TeamGame } from '@/types/games';

/**
 * A metrika-oszlop szélessége. A leghosszabb tartalom a háromjegyű eredmény
 * (`102–100`, 7 karakter) és a `HOLNAP` (6 karakter); JetBrains Mono 20pt-on
 * ez ~84pt.
 */
const METRIC_WIDTH = 84;

interface GameRowProps {
  game: TeamGame;
  onPress: () => void;
}

/** Lejátszott meccs: az eredmény színe a győzelem/vereség. */
export function GameRow({ game, onPress }: GameRowProps) {
  const won = game.result === 'win';

  return (
    <StackedRow
      leading={homeAwayMark(game.homeAway === 'home')}
      title={game.opponent}
      // Az eredmény szóban is szerepel, nem csak a szám színében – a színre
      // magára egy listában nem támaszkodhatunk.
      subtitle={`${formatDate(game.date)} · ${won ? 'Nyert' : 'Vesztett'}`}
      metrics={[
        {
          // Nagykötőjel: a csomagolt JetBrains Mono tartalmazza (ellenőrizve),
          // és a `LastGameCard` tág „82 : 75" alakja itt kifutna a sorból.
          value: `${game.ourScore}–${game.oppScore}`,
          tone: won ? 'positive' : 'negative',
        },
      ]}
      metricWidth={METRIC_WIDTH}
      onPress={onPress}
      style={styles.row}
    />
  );
}

interface FixtureRowProps {
  fixture: Fixture;
}

/**
 * Közelgő találkozó: eredmény helyett nap pontosságú visszaszámláló.
 * Nyomható nincs – a meccs részletei képernyő lejátszott meccsre való.
 */
export function FixtureRow({ fixture }: FixtureRowProps) {
  const postponed = fixture.status === 'postponed';

  return (
    <StackedRow
      leading={homeAwayMark(fixture.isHome)}
      title={fixture.opponentName}
      subtitle={
        postponed
          ? `${formatDate(fixture.gameDate)} · Elhalasztva`
          : formatDate(fixture.gameDate)
      }
      metrics={[
        {
          value: formatCountdown(fixture.gameDate),
          tone: postponed ? 'warning' : 'cyan',
        },
      ]}
      metricWidth={METRIC_WIDTH}
      style={styles.row}
    />
  );
}

/** Hazai / Vendég a vezérjel-körben. */
function homeAwayMark(isHome: boolean): string {
  return isHome ? 'H' : 'V';
}

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing[2],
  },
});
