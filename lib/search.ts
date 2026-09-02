/**
 * Szövegkeresés listákhoz – kis- és nagybetű, valamint ékezet nélkül.
 *
 * A `String.prototype.normalize('NFD')` + kombináló jelek levágása kényelmesebb
 * lenne, de a Hermes ICU-támogatása platformonként eltér (ugyanaz a gond, mint
 * a dátumformázásnál – D-039), ezért a magyar ékezetes betűk kézzel vannak
 * leképezve. Így „kovacs" is megtalálja a „Kovács"-ot mindkét platformon.
 */

const ACCENTS: Record<string, string> = {
  á: 'a',
  é: 'e',
  í: 'i',
  ó: 'o',
  ö: 'o',
  ő: 'o',
  ú: 'u',
  ü: 'u',
  ű: 'u',
};

/** Kisbetűs, ékezet nélküli alak – csak összehasonlításra, megjelenítésre nem. */
export function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[áéíóöőúüű]/g, (char) => ACCENTS[char] ?? char);
}

/** Igaz, ha a keresőkifejezés részszóként szerepel a szövegben. Üres keresés mindenre illik. */
export function matchesQuery(text: string, query: string): boolean {
  const needle = normalizeText(query.trim());
  if (needle.length === 0) return true;

  return normalizeText(text).includes(needle);
}
