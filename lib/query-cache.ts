/**
 * Kulcsolt lekérdezés-cache – a „lusta betöltés" magja.
 *
 * A mobil app minden adatlekérdezése szűrőfüggő, és több képernyő is
 * ugyanazt kérné. Ez a modul adja a közös viselkedést:
 *
 * - **Deduplikálás**: ugyanarra a kulcsra egyszerre futó kérésekből egy lesz,
 *   a már letöltött adat pedig azonnal visszajön hálózat nélkül.
 * - **Szűrőpáronkénti kulcs**: `szezon:csapat` – tabváltásnál nincs új kérés,
 *   szezon- vagy csapatváltásnál viszont van (D-020).
 * - **Hibás kérés nem ragad bent**: elhasalt lekérdezés kikerül a cache-ből,
 *   így az újrapróbálás gomb tényleg újrapróbál.
 * - **Kijelentkezéskor ürül**: a `clearAllQueryCaches()` minden cache-t kidob,
 *   nehogy a következő belépő az előző felhasználó adatait lássa.
 *
 * Nem Zustand store, mert ez nem UI state: egyetlen komponens sem iratkozik fel
 * rá közvetlenül, a képernyők a hookok `data`-ját nézik. Lásd D-026.
 */

/** Minden létrehozott cache ürítője – a `clearAllQueryCaches()` ezeket hívja. */
const registry = new Set<() => void>();

export interface QueryCache<T> {
  /** A kulcshoz tartozó adat: cache-ből, ha van, egyébként `fetcher`-rel. */
  load: (key: string, fetcher: () => Promise<T>) => Promise<T>;
  /** Egy kulcs eldobása – a következő `load` újra letölti. */
  invalidate: (key: string) => void;
}

/**
 * Egy adatfajta cache-e. Modulszinten hozd létre (hookonként egyet), hogy a
 * képernyő újramountolása ne dobja el a letöltött adatot.
 */
export function createQueryCache<T>(): QueryCache<T> {
  const entries = new Map<string, Promise<T>>();

  registry.add(() => entries.clear());

  return {
    load: (key, fetcher) => {
      const cached = entries.get(key);
      if (cached) return cached;

      const request = fetcher().catch((error: unknown) => {
        entries.delete(key);
        throw error;
      });

      entries.set(key, request);
      return request;
    },

    invalidate: (key) => {
      entries.delete(key);
    },
  };
}

/** A szűrőfüggő lekérdezések közös kulcsa. */
export function filterKey(seasonId: string, teamId: string): string {
  return `${seasonId}:${teamId}`;
}

/** Minden cache ürítése – kijelentkezéskor és felhasználóváltáskor. */
export function clearAllQueryCaches(): void {
  registry.forEach((clear) => clear());
}
