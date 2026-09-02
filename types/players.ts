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

import type { GameResult, HomeAway, PlayerGameLine } from '@/types/games';

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

/**
 * Egy lejátszott meccs a játékos szemszögéből: a box score sora kiegészítve a
 * meccs keretadataival. A statisztikai mezők azonosak a `PlayerGameLine`-nal –
 * ott a játékos azonosítja a sort, itt a meccs.
 */
export interface PlayerGameRow
  extends Omit<PlayerGameLine, 'playerId' | 'name' | 'number'> {
  gameId: string;
  /** ISO nap (`2026-05-25`) – a `games` tábla nem tárol időpontot. */
  date: string;
  /** Az ellenfél rövid neve, ha szerepel a csapatlistában; egyébként a teljes. */
  opponent: string;
  homeAway: HomeAway;
  result: GameResult;
}

/** A `player_text_reports.report_type` engedélyezett értékei. */
export type PlayerReportType = 'season' | 'manual';

/** Mentett AI riport a `player_text_reports` táblából – az app csak olvassa. */
export interface PlayerReport {
  id: string;
  type: PlayerReportType;
  narrative: string;
  /** ISO időbélyeg, ahogy a tábla tárolja. */
  generatedAt: string;
}
