/**
 * Igazolások – a `league_player_movements` view sorának típustükre és a
 * képernyő megjelenítési modellje.
 *
 * A `PlayerMovementRow` a webprojekt generált `Database` típusának kézi
 * párja: a mobil Supabase kliens típusozatlan, ezért a `@core/player-movements`
 * ide hivatkozik (a szinkron írja át, lásd `scripts/sync-core.ts` – D-112).
 * A mezőneveket és a nullázhatóságot az
 * `asestats/migrations/add-league-player-movements-view.sql` adja; eltérés
 * esetén a view a mérvadó.
 */
import type { BadgeVariant } from '@/components/Badge';
import type { AccentTone } from '@/constants/theme';

/**
 * Egy sor a `league_player_movements` view-ból.
 *
 * Szándékosan `type`, nem `interface`: a `@core` `parsePlayerMovement()`
 * ellenőrzés után `Record<string, unknown>`-ról ide kasztol, és ezt a TypeScript
 * csak implicit index-szignatúrával engedi – azt viszont kizárólag a típusalias
 * kapja meg, az interfész nem.
 */
export type PlayerMovementRow = {
  /** A tagsági sor azonosítója + irány, pl. „…:arrival". */
  id: string;
  kosarstat_player_id: string;
  team_id: string;
  /** A CÉLSZEZON azonosítója – mindkét iránynál ez a szűrőmező. */
  season_id: string;
  season_name: string;
  previous_season_name: string;
  direction: 'arrival' | 'departure';
  movement_type: 'domestic_transfer' | 'return' | 'unknown';
  counterpart_team_ids: string[];
  counterpart_team_names: string[];
  /** Kihagyott szezonok száma visszatérésnél, egyébként 0. */
  gap_seasons: number;
  status_at_time: 'hazai' | 'legios' | 'honositott' | null;
  imported_at: string;
  display_name: string;
  position: string | null;
  profile_url: string | null;
  team_name: string;
};

/** Egy megjelenítendő sor – a nyers view-sor UI-ra fordított alakja. */
export interface MovementEntry {
  id: string;
  name: string;
  /** A forrás pozíciórövidítése (pl. „SG") – nem fordítjuk le. */
  position: string | null;
  direction: 'arrival' | 'departure';
  /** A besorolás badge felirata, pl. „Hazai váltás". */
  label: string;
  badge: BadgeVariant;
  /** Honnan / hová – már összefűzött szöveg, pl. „Alba Fehérvár". */
  counterpart: string;
  /** Csak akkor van, ha a forrásprofil HTTPS és kosarstat.hu (D-113). */
  profileUrl: string | null;
}

/** Egy StatTile a képernyő tetején. */
export interface MovementTile {
  label: string;
  value: string;
  accent: AccentTone;
  /** Teljes szélességű csempe (az ötödik). */
  wide?: boolean;
}

/** Egy szekció a listában – csapatnézetben irány, liga nézetben csapat szerint. */
export interface MovementSection {
  key: string;
  title: string;
  /** Csapatnézet: a szekció iránya adja a fejléc ikonját és színét. */
  direction: 'arrival' | 'departure' | null;
  /** Csapatnézet: a szekciócím melletti darabszám, pl. „(4)". */
  count: string;
  /**
   * Liga nézet: a csapatfejléc mérlege. A két szám külön áll, mert a
   * távozók száma narancs, az érkezőké cián.
   */
  balance: { arrivals: string; departures: string } | null;
  data: MovementEntry[];
}

/** A teljes képernyő megjelenítési modellje. */
export interface MovementsView {
  /** Az irány-sáv bal oldala: az előző szezon neve, pl. „2025/2026". */
  fromSeason: string;
  /** Az irány-sáv jobb oldala a nyíl után: a célszezon neve. */
  toSeason: string;
  /** Az irány-sáv jobb oldala: csapatnév vagy „14 követett csapat". */
  scope: string;
  /** A nagy cím melletti szám, pl. „13 mozgás". */
  total: string;
  tiles: MovementTile[];
  sections: MovementSection[];
  /** Liga nézetben ragadós csapatfejlécek futnak. */
  league: boolean;
}
