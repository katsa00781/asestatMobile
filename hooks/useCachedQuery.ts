/**
 * Közös lekérdezés-hook: cache, betöltés, hiba, újrapróbálás.
 *
 * A `useFilterData`, a `useGameData` és a `usePlayerData` ugyanazt a mintát
 * ismételte (modulszintű cache + `loading` + `error` + `attempt` + „még él-e a
 * komponens" flag), ezért ez egy helyre került.
 *
 * Két szabályt tart be a `CLAUDE.md` „lusta betöltés" elvárásából:
 *
 * 1. **Csak fókuszban tölt.** A háttérben lévő tab szűrőváltáskor nem indít
 *    hálózati kérést, csak amikor a felhasználó tényleg odalép (D-027).
 * 2. **Kulcsváltásig nem mutat idegen adatot.** Amíg az új szűrőhöz nincs
 *    adat, az `empty` érték látszik, nem az előző szezoné.
 *
 * A fókuszfigyelés miatt a hook (és minden rá épülő hook) **csak képernyőn
 * belül** használható – navigátoron kívül a `useIsFocused` hibát dob.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsFocused } from 'expo-router';

import type { QueryCache } from '@/lib/query-cache';

interface CachedQueryOptions<T> {
  /** Modulszinten létrehozott cache – hookonként egy. */
  cache: QueryCache<T>;
  /** `null`, amíg nem lehet lekérdezni (pl. a szűrő még nem hidratált). */
  key: string | null;
  fetcher: () => Promise<T>;
  /** Adat híján ez látszik. Modulszintű konstans legyen, hogy stabil maradjon. */
  empty: T;
  /** A hibaüzenet eleje, pl. „A meccsek betöltése sikertelen". */
  errorLabel: string;
}

interface CachedQueryResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

interface LoadedEntry<T> {
  key: string;
  data: T;
}

export function useCachedQuery<T>({
  cache,
  key,
  fetcher,
  empty,
  errorLabel,
}: CachedQueryOptions<T>): CachedQueryResult<T> {
  const [entry, setEntry] = useState<LoadedEntry<T> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const focused = useIsFocused();

  // A `fetcher` minden renderben új closure (a szűrőt és a listákat zárja
  // körbe), de nem indíthat lekérdezést – azt csak a kulcs változása teheti.
  // Ez az effect a fetchelő effect ELŐTT fut, tehát az mindig a friss closure-t
  // hívja.
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    if (key === null || !focused) return;

    let active = true;
    setError(null);

    cache
      .load(key, () => fetcherRef.current())
      .then((data) => {
        if (!active) return;
        // Azonos kulcs és azonos adat esetén ne cseréljünk referenciát,
        // különben minden fókuszváltás felesleges újrarenderelést indítana.
        setEntry((prev) => (prev?.key === key && prev.data === data ? prev : { key, data }));
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(describeError(err, errorLabel));
      });

    return () => {
      active = false;
    };
  }, [cache, key, focused, attempt, errorLabel]);

  const reload = useCallback(() => {
    if (key !== null) cache.invalidate(key);
    setAttempt((value) => value + 1);
  }, [cache, key]);

  const loaded = entry !== null && entry.key === key;

  return {
    data: loaded ? entry.data : empty,
    // Nincs adat és nincs hiba → még úton van. Kulcs nélkül (hidratálás előtt)
    // is töltés van, különben egy pillanatra üres képernyő villanna fel.
    loading: !loaded && error === null,
    error,
    reload,
  };
}

/**
 * A hibaüzenetek a `fetch` angol szövegét adnák vissza, ezért a leggyakoribb
 * hálózati esetet magyarra fordítjuk. Minden más hiba a Supabase saját üzenetét
 * viszi tovább – az segít a diagnózisban, és nem is jut el a felhasználóig,
 * ha a lekérdezés helyes.
 */
function describeError(err: unknown, label: string): string {
  const raw = err instanceof Error ? err.message : '';

  if (/network request failed|failed to fetch|network error|timeout/i.test(raw)) {
    return `${label}: nincs kapcsolat a szerverrel.`;
  }

  return raw ? `${label}: ${raw}` : `${label}: ismeretlen hiba.`;
}
