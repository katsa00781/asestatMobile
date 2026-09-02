/**
 * Mentett AI riportok – a `game_text_reports`, `team_text_reports` és
 * `player_text_reports` sorainak közös, kliensoldali alakja.
 *
 * A három tábla más kulcson ül és más mezőket hoz, az Elemzés hub viszont
 * **egyetlen** listát mutat belőlük. Ezért a hook mindhármat erre a közös
 * alakra hozza, és a `kind` mondja meg, honnan jött – a szűrő-chipek és a
 * badge felirata ebből dolgozik.
 *
 * Az app riportot **nem generál és nem szerkeszt**, csak olvassa őket.
 */

/** Melyik táblából jött a riport. */
export type ReportKind = 'game' | 'team' | 'player';

export interface AnalysisReport {
  id: string;
  kind: ReportKind;
  /** Badge felirat, ALL CAPS – a `report_type` oszlopból (`POSTGAME`, `EDZŐI`). */
  typeLabel: string;
  /** Kártyacím, pl. „Atomerőmű — Kaposvár" vagy „Atomerőmű · 2025/2026". */
  title: string;
  /** Meta sor az olvasóban, pl. „2026. május 14. · Vesztett 80–88". */
  subtitle: string;
  /** A riport teljes szövege, nyersen – a formázást a `lib/report-format` végzi. */
  narrative: string;
  /**
   * A kártyán látszó egysoros összefoglaló. A hookban készül el egyszer, nem
   * a kártyában: a lista több tucat riportot is mutathat, és a szövegelemzés
   * minden újrarendereléskor lefutna.
   */
  summary: string;
  /** ISO időbélyeg; a lista e szerint rendez csökkenő sorrendben. */
  generatedAt: string;
}
