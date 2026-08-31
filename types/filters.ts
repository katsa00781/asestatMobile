/**
 * A szűrő választható elemei. Az adatbázis sorainak leszűkített,
 * kliensoldali alakja – csak az, amit a UI ténylegesen megjelenít.
 */

export interface Season {
  id: string;
  /** Pl. „2025/2026". */
  name: string;
  /** Az adatbázis szerint ez a futó szezon – ez lesz az alapértelmezés. */
  isCurrent: boolean;
}

export interface Team {
  id: string;
  /** Teljes név, pl. „Atomerőmű SE". */
  name: string;
  /** Rövid név a szűk helyekre (fejléc-chip, badge), pl. „Atomerőmű". */
  shortName: string;
  /** A saját csapatunk jelölése az adatbázisban. */
  isPrimary: boolean;
}
