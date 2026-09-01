/**
 * Szezon-aggregált játékosadatok – a `player_season_stats_by_season` view
 * sorainak kliensoldali alakja.
 *
 * A `@core/player-stat-mapping` `PlayerStats`-ot ad vissza, ami **összegeket**
 * tárol (a `valuation` kivételével, az már meccsátlag). A képernyők viszont
 * meccsenkénti átlagokat mutatnak, ezért a `SeasonPlayer` kiegészíti a core
 * alakot a származtatott átlagokkal és a magyar pozíciónévvel – de `PlayerStats`
 * marad, tehát változtatás nélkül átadható a `@core` elemző moduloknak.
 */
import type { PlayerStats } from '@core/dashboard-types';

/** Meccsenkénti átlagok. Osztó a lejátszott meccsek száma. */
export interface PlayerAverages {
  points: number;
  rebounds: number;
  assists: number;
  minutes: number;
  steals: number;
  turnovers: number;
  /** A view `avg_valuation` mezője – ez már eleve meccsátlag. */
  valuation: number;
}

export interface SeasonPlayer extends PlayerStats {
  averages: PlayerAverages;
  /** Magyar pozíciónév az elsődleges pozícióból, pl. „Dobóhátvéd". */
  positionLabel: string;
}
