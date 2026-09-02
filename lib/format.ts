/**
 * Megjelenítési formázók – dátum, szám, napkülönbség, név.
 *
 * A hónap- és napnevek kézzel vannak felsorolva, nem a
 * `toLocaleDateString('hu-HU')`-ból jönnek: a Hermes `Intl` támogatása
 * platformonként eltér (Androidon a rendszer ICU-jára delegál, iOS-en részleges
 * saját implementáció), így ugyanaz a hívás két különböző szöveget adhatna a
 * két platformon. Lásd `docs/feature-tasks.md` – D-039.
 */
import { normalizeText } from '@/lib/search';

const MONTHS_HU = [
  'január',
  'február',
  'március',
  'április',
  'május',
  'június',
  'július',
  'augusztus',
  'szeptember',
  'október',
  'november',
  'december',
];

/** A `Date.getDay()` sorrendjében: 0 = vasárnap. */
const WEEKDAYS_HU = [
  'vasárnap',
  'hétfő',
  'kedd',
  'szerda',
  'csütörtök',
  'péntek',
  'szombat',
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * ISO nap (`2026-09-06`) → helyi idejű `Date` a nap kezdetén.
 *
 * A `new Date('2026-09-06')` UTC éjfélt jelent, ami negatív időzóna-eltolásnál
 * már az előző nap – ezért bontjuk szét kézzel.
 */
function parseIsoDay(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** `2026-09-06` → `2026. szeptember 6.` Érvénytelen bemenetre a nyers szöveg. */
export function formatDate(iso: string): string {
  const date = parseIsoDay(iso);
  if (!date) return iso;

  return `${date.getFullYear()}. ${MONTHS_HU[date.getMonth()]} ${date.getDate()}.`;
}

/** `2026-09-06` → `2026. szeptember 6. · szombat` */
export function formatDateWithWeekday(iso: string): string {
  const date = parseIsoDay(iso);
  if (!date) return iso;

  return `${formatDate(iso)} · ${WEEKDAYS_HU[date.getDay()]}`;
}

/**
 * Egy tizedesjegyre kerekített szám, **ponttal** – a mockup így írja ki a
 * KPI-okat (82.4), és a JetBrains Mono tabuláris számjegyeivel így igazodnak
 * egymás alá az értékek.
 */
export function formatDecimal(value: number, digits = 1): string {
  return value.toFixed(digits);
}

/** Előjeles alak (`+3.1` / `−2.4`), tipográfiai mínusszal. */
export function formatSigned(value: number, digits = 1): string {
  const text = formatDecimal(Math.abs(value), digits);
  return value < 0 ? `−${text}` : `+${text}`;
}

/**
 * Hány nap múlva lesz az adott nap a mai naphoz képest. Ma → 0, tegnap → −1.
 * Mindkét dátum helyi éjfélre normalizálva, így a nyári időszámítás váltása
 * sem tolja el az eredményt.
 */
export function daysUntil(iso: string): number | null {
  const target = parseIsoDay(iso);
  if (!target) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / MS_PER_DAY);
}

/**
 * Nap pontosságú visszaszámláló ALL CAPS-ban: `MA` / `HOLNAP` / `7 NAP`.
 * Óra nincs benne, mert kezdési időpontot az adatbázis sem tárol (D-022, D-043).
 * Érvénytelen vagy hiányzó dátumra „—".
 */
export function formatCountdown(iso: string): string {
  const days = daysUntil(iso);

  if (days === null) return '—';
  if (days <= 0) return 'MA';
  if (days === 1) return 'HOLNAP';
  return `${days} NAP`;
}

/**
 * Játékosnév rövidítése listaoszlopba: `EDWIN Deon Javern` → `EDWIN D.`
 *
 * Az adatbázis vezetéknév–keresztnév sorrendben tárol, ezért az első szó marad
 * egészben, a másodikból csak a kezdőbetű – ahogy a `p0-style-tile` mockup
 * mátrixa is mutatja (`Kovács P.`). Egyszavas névből nem csinálunk semmit.
 */
export function shortenPlayerName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name.trim();

  const [family, given] = parts;
  return `${family} ${given.charAt(0)}.`;
}

/**
 * Csapatjel a tabella badge-ébe: a rövid név első három betűje, ékezet nélkül,
 * nagybetűvel (`Körmend` → `KOR`, `Falco` → `FAL`).
 *
 * A saját csapatunk kivétel: az `Atomerőmű` mechanikusan `ATO` lenne, a bevett
 * jelölés viszont `ASE` – a mockup is így írja (D-059). A kivételek a teljes
 * névre illenek, mert az adatbázisban az az egyedi.
 */
const ABBREVIATIONS: Record<string, string> = {
  'atomerőmű se': 'ASE',
};

export function teamAbbreviation(fullName: string, shortName: string): string {
  const override = ABBREVIATIONS[fullName.trim().toLowerCase()];
  if (override) return override;

  return normalizeText(shortName).slice(0, 3).toUpperCase();
}
