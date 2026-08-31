# Feature task lista – ASEStats Mobile v1

> **Ez a fájl egyben munkanapló is.** Minden elvégzett feladat után ki kell pipálni a
> sort, be kell írni a munkanapló bejegyzést, és commitolni kell.
> A részletes szabályok a `CLAUDE.md` „Munkanapló és commitok" szakaszában vannak.

**Platform:** iOS + Android, közös kódbázis, azonos UI.
**Design:** elfogadva (P0 Style Tile, Ma, Játékosok Lista, Szűrő Bottom Sheet, Tabella).
**Előzmény:** a webprojekt `context/mobile/` tervdokumentációja (S1) és `BACKLOG.md`-je.

---

## S3 – Setup (egyszeri)

- [ ] Expo projekt létrehozása a repo gyökerében (`npx create-expo-app . --template blank-typescript`)
- [ ] Git init, `.gitignore` (node_modules, .expo, .env, ios/, android/), első commit: `setup: Expo projekt inicializálás`
- [ ] A meglévő 5 mockup HTML áthelyezése `docs/mockups/` alá (ne a repo gyökerében maradjanak)
- [ ] `.env` és `.env.example` létrehozása (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
- [ ] Expo Router bekötése (`expo-router`, entry point, `app/_layout.tsx`)
- [ ] NativeWind v4 telepítése és konfigurálása (`tailwind.config.js`, `babel.config.js`, `global.css`, `metro.config.js`)
- [ ] `constants/theme.ts` – a `CLAUDE.md` tokentáblájának 1:1 leképezése TS-be; a `tailwind.config.js` ebből olvas
- [ ] `expo-font`: Barlow Condensed, DM Sans, JetBrains Mono elhelyezése `assets/fonts/`-ba + betöltés a gyökér layoutban
- [ ] `constants/images.ts` létrehozása (ASE logó, empty state illusztrációk helye)
- [ ] Lint + typecheck script bekötése (`npm run lint`, `npx tsc --noEmit`)
- [ ] TypeScript strict mode + path aliasok (`@/*`, `@core/*`) `tsconfig.json` + `babel-plugin-module-resolver`

### `@core` mag bekötése

- [ ] `scripts/sync-core.ts` – a webprojekt `lib/`-jéből másolja a 15 modult `core/`-ba, fejléc-kommentel; `npm run sync:core`
- [ ] Első szinkron lefuttatása, `core/` commitolása
- [ ] **`@core/stat-formulas` import füstteszt** – egy képernyőn hívj meg egy formulát valós számmal, és nézd meg, hogy fordul-e Metro alatt. **Ha ez nem megy, ne lépj tovább.**
- [ ] A maradék 14 modul import-füsttesztje (csak import + típusellenőrzés, nem futtatás)

### Supabase és auth

- [ ] `react-native-url-polyfill` + `@react-native-async-storage/async-storage` telepítése
- [ ] `lib/supabase.ts` – RN kliens AsyncStorage adapterrel, `autoRefreshToken`, `detectSessionInUrl: false`
- [ ] `store/authStore.ts` – session tükrözés, `onAuthStateChange` feliratkozás
- [ ] `app/login.tsx` – bejelentkezési képernyő a Dark Command Center stílusban
- [ ] `app/_layout.tsx` auth guard: nincs session → login, van → `(tabs)`
- [ ] Teszt: bejelentkezés valós Supabase felhasználóval iOS szimulátoron és Android emulátoron
- [ ] Push GitHub-ra (kérésre)

---

## S4 – Adatréteg

- [ ] `store/filterStore.ts` – `selectedSeasonId`, `selectedTeamId`, AsyncStorage perzisztálás, `hydrated` flag
- [ ] `hooks/useFilterData.ts` – `seasons` + `teams` betöltés, alapértelmezett szezon az `is_current`-ből
- [ ] `components/FilterSheet.tsx` – szezon/csapat választó bottom sheet a mockup szerint; Android hardveres back kezelése
- [ ] `hooks/useGameData.ts` – meccsek + fixtures lekérése, `@core/season-tables` + `@core/fetch-all-rows` használatával
- [ ] `hooks/usePlayerData.ts` – szezon-aggregált játékosstatisztikák, `@core/player-stat-mapping` mappinggel
- [ ] Lusta betöltési stratégia: tabonkénti fetch, cache a store-ban a szűrő élettartamára
- [ ] Hibakezelés: hálózati hiba → újrapróbálás gombos hibapanel; üres adat → `EmptyState`

---

## S5 – Közös UI komponensek

- [ ] `components/GlowCard.tsx` – surface1 + subtle border + opcionális accent glow réteg (border + alacsony opacitású háttér, **nem** shadowColor)
- [ ] `components/StatTile.tsx` – label + JetBrains Mono érték + opcionális trend és accent (a webes `StatCard` mobil párja)
- [ ] `components/StackedRow.tsx` – listaelem, függőlegesen csoportosított adatokkal (a `DataTable` sor mobil párja)
- [ ] `components/StatMatrix.tsx` – vízszintesen görgethető statisztikai mátrix **fagyasztott első oszloppal**; iOS és Android görgetés-szinkron ellenőrzése
- [ ] `components/Badge.tsx` – 7 variáns (cyan / orange / ai / positive / negative / warning / neutral)
- [ ] `components/SkeletonBlock.tsx` – shimmer betöltés (Reanimated)
- [ ] `components/EmptyState.tsx` – üres állapot ikonnal és szöveggel
- [ ] Tap target audit: minden interaktív elem ≥ 44×44pt vagy `hitSlop`-pal kiegészítve

---

## S6 – Képernyők (prioritási sorrendben)

- [ ] **Ma** (`app/(tabs)/index.tsx`) – következő/legutóbbi meccs kártya, csapat KPI-ok StatTile-okban, gyors belépési pontok. Mockup: `Ma Screen`
- [ ] **Meccsek – lista** (`app/(tabs)/games/index.tsx`) – lejátszott meccsek + közelgő fixtures, StackedRow-val
- [ ] **Meccs részletei** (`app/(tabs)/games/[id].tsx`) – eredmény, negyedek, box score StatMatrix-ben, mentett pregame/postgame riport `GlowCard accent="ai"`-ban
- [ ] **Játékosok – lista** (`app/(tabs)/players/index.tsx`) – szezon-aggregált lista, rendezés, névkeresés. Mockup: `Jatekosok Lista`
- [ ] **Játékos részletei** (`app/(tabs)/players/[id].tsx`) – szezonstatisztika, meccsenkénti bontás, mentett játékos-riportok
- [ ] **Tabella** (`app/(tabs)/standings.tsx`) – bajnoki tabella StatMatrix-ben. Mockup: `Tabella`
- [ ] **Elemzés** (`app/(tabs)/analysis/index.tsx`) – mentett AI riportok listája (pregame / postgame / játékos / csapat) + számított elemzések a `@core`-ból (szituációk, four factors, clutch)
- [ ] Tab layout véglegesítése: 5 tab ikonokkal, aktív állapot cián glow-val, safe area alul

---

## S7 – Chartok

- [ ] `victory-native` + `@shopify/react-native-skia` telepítése és Metro/babel konfig
- [ ] Játékos trend chart (pont / valuation idősor)
- [ ] Kumulatív pontkülönbség (momentum) chart a meccs részletein
- [ ] Four Factors oszlopdiagram
- [ ] Chart téma modul a `constants/theme.ts` tokenjeiből (a webes `lib/chart-theme.ts` mintájára)
- [ ] Chart teljesítmény-ellenőrzés valós Android eszközön (Skia a leggyengébb pont)

---

## Ship előtt

- [ ] Teljes primary flow tesztelése éles iOS eszközön
- [ ] Teljes primary flow tesztelése éles Android eszközön
- [ ] Edge case-ek: üres állapot, hosszú játékosnév, nincs net, lassú net, lejárt session
- [ ] Android hardveres back gomb minden sheet/modal képernyőn
- [ ] Safe area ellenőrzése notch-os és notch nélküli eszközön, Android gesztus- és gombnavigációval
- [ ] Sötét/világos rendszertéma: az app mindkettőben sötét marad, nincs elrontott kontraszt
- [ ] Lint + typecheck hibák nélkül
- [ ] Dev utilities eltávolítása (teszt gombok, `console.log`, mock data)
- [ ] Secrets ellenőrzése: nincs service role / AI kulcs a bundle-ben és a git historyban
- [ ] App ikon, splash screen, `app.json` bundle identifier + package name
- [ ] EAS Build production binary mindkét platformra + éles eszközön tesztelés
- [ ] TestFlight (iOS) és Google Play internal testing (Android)

---
---

# Munkanapló

Minden befejezett feladat után ide kerül egy bejegyzés, **legfelülre** (fordított
időrend, a legfrissebb legyen elöl). Ugyanabba a commitba, mint a kód.

Sablon:

```
## ÉÉÉÉ-HH-NN – [feladat neve]

**Mit:** egy-két mondat arról, mi készült el.
**Fájlok:** [érintett fájlok]
**Tesztelve:** [iOS / Android, eszköz, mit próbáltál]
**Nyitva maradt:** [ha van]
**Commit:** [commit üzenet]
```

<!-- ÚJ BEJEGYZÉSEK IDE, LEGFELÜLRE -->

## 2026-08-31 – Projekt-előkészítés (S2 lezárás)

**Mit:** A mobil projekt dokumentációs alapja elkészült a `vibe-coding-mobile` workflow
szerint: `CLAUDE.md`, ez a feladatlista munkanaplóval és döntésnaplóval, valamint
`docs/prompt-templates.md`. A design (5 mockup) elfogadva, a scope iOS-ről iOS+Androidra
bővült, a projekt külön repóba került.
**Fájlok:** `CLAUDE.md`, `docs/feature-tasks.md`, `docs/prompt-templates.md`
**Tesztelve:** –
**Nyitva maradt:** Az egész S3 (Expo váz). Az első valós kockázat a `@core` alias
füstteszt – ha az nem megy, a `core/` szinkron-stratégiát újra kell gondolni.
**Commit:** `docs: mobil CLAUDE.md, feladatlista és prompt sablonok`

---
---

# Döntésnapló

Ide kerül minden nem triviális döntés, amit később meg lehetne kérdőjelezni.
Sorszámozva (`D-001`, `D-002`, …), hogy commit üzenetből hivatkozni lehessen rá.

**Egy döntés egy bekezdés.** A *miért* mindig legyen benne, és az is, hogy mi volt
a másik szóba jöhető opció.

---

## D-001 – Expo + React Native, nem PWA és nem natív
**Dátum:** 2026-08-30 (S1 tervezés)
**Döntés:** Expo managed workflow + React Native, TypeScript.
**Miért:** Egy kódbázisból iOS és Android, a csapat meglévő React/TS tudása közvetlenül
használható, az EAS Build elveszi a natív toolchain terhét. A reszponzív web 7 konkrét
ponton bukott el (érintés-célpontok, táblázat-görgetés, offline-érzet, betöltési idő
mobilneten, alsó navigáció hiánya, natív gesztusok, home screen jelenlét).
**Alternatíva:** PWA (nem ad natív érzetet, iOS-en korlátozott), Capacitor (a webes
DOM-réteget vinné magával, ugyanazokkal a görgetési problémákkal), natív Swift + Kotlin
(két kódbázis, nincs rá kapacitás).
**Visszavonható?** Elvben igen, gyakorlatilag nem – az egész képernyőréteg erre épül.

## D-002 – Külön repo (`asestatMobile`), a `@core` modulok másolva
**Dátum:** 2026-08-31
**Döntés:** A mobil app önálló repóban él, nem a webprojekt `mobile/` almappájában.
A webes `lib/` 15 tiszta elemző modulja a `core/` mappába **másolva** kerül be,
`npm run sync:core` tartja szinkronban, `@core/*` alias mutat rá.
**Miért:** Tiszta izoláció: saját git history, saját CI, saját dependency-fa. A web
React 19 és az Expo pinnelt React-je nem hoistolódik egymásra, és nem kell 30+ fájlt
mozgatni a webprojektben. A `core/` mappa read-only konvenciója megőrzi az egyetlen
igazságforrást (a webprojekt `lib/`-je).
**Alternatíva:** `asestats/mobile/` almappa Metro `watchFolders` + `extraNodeModules`
aliasszal a gyökér `lib/`-re (ezt írta le a `mobile-architecture.md`). Ott a mag
másolás nélkül újrahasznosul, de egy repóban keveredik két toolchain, és a Metro
watchFolders konfiguráció törékeny.
**Kockázat:** a másolat elavulhat. Ellenszer: a `sync:core` script fejléc-kommentje
és külön commit minden szinkronnál. Ha a drift gyakori lesz, a `core/` privát npm
packagegé promotálható.
**Visszavonható?** Igen, közepes költséggel.

## D-003 – iOS + Android azonos UI-jal, nem platform-adaptív
**Dátum:** 2026-08-31
**Döntés:** Egy közös UI mindkét platformon: ugyanaz az 5 tab, ugyanaz a Dark Command
Center design. Csak technikai platform-eltéréseket kezelünk (safe area, hardveres back,
státuszsáv, betűrenderelés, elevation).
**Miért:** Az app erős, felismerhető saját vizuális identitással bír (a webes design
rendszer folytatása), belső használatra készül ismerős felhasználóknak – a platform-natív
konvenciók követése itt kevesebbet ad, mint amennyi karbantartási terhet jelentene.
Egy mockup-készlet, egy komponenskönyvtár.
**Alternatíva:** Platform-adaptív UI (iOS nagy címek + swipe-back, Android Material
bottom bar + ripple). Natívabb érzet, de kétszer annyi UI-döntés, két mockup-készlet,
és a Dark Command Center identitás felhígulása.
**Visszavonható?** Igen – egyes képernyők utólag adaptívvá tehetők.

## D-004 – A mobil app csak olvas, AI generálás nélkül
**Dátum:** 2026-08-31
**Döntés:** A mobil app kizárólag `SELECT`-et futtat Supabase-en. Az AI riportokat
olvassa a `game_text_reports` / `team_text_reports` / `player_text_reports` táblákból,
de nem generál. Import és admin funkció nincs.
**Miért:** A felderítés kimutatta, hogy mind a 14 `app/api/*` route `requireAdmin`-t
futtat és mutáló – ezek definíció szerint a fogyasztói scope-on kívül vannak. A riportok
olvasása viszont **nem igényel API route-ot**, mert a kliens közvetlenül olvashat RLS
alatt. Ez egyben azt is jelenti, hogy semmilyen szerveroldali kulcs nem kerül a mobil
bundle-be. A generálás hosszú futású hívás, mobilneten és háttérbe küldött appban
rossz élmény.
**Alternatíva:** Admin generálás mobilról is. Nagyobb scope, auth token-továbbítás az
API felé, timeout-kezelés – a v1-ben nem éri meg.
**Visszavonható?** Igen, additív bővítés lenne.

## D-005 – Glow rétegzéssel, nem `shadowColor`-ral
**Dátum:** 2026-08-30 (S1 UI kontextus)
**Döntés:** A webes cián/narancs glow effekteket React Native-ben egy accent-színű
`borderWidth: 1` keret + egy alacsony opacitású accent háttérréteg adja, szükség esetén
Skia `BlurMask`-kal.
**Miért:** A React Native `shadowColor` Androidon nem renderel színes árnyékot – csak
az `elevation` létezik, ami mindig fekete. Egy iOS-en jól kinéző glow Androidon
egyszerűen eltűnne, ami a design nyelv legjellemzőbb elemét törölné el a felhasználók
felén.
**Alternatíva:** Platform-specifikus glow (iOS shadow, Android semmi) – vizuálisan
kettészakadt app. Vagy mindent Skia-val rajzolni – teljesítmény-kockázat listákban.
**Visszavonható?** Igen, komponens-szinten.

## D-006 – `text.secondary` és `text.muted` a világosabb értékeken
**Dátum:** 2026-08-31
**Döntés:** `text.secondary` = `#7A9ABB`, `text.muted` = `#4A6D95` – nem a webes
`CLAUDE.md`-ben szereplő régi `#5A7A99` / `#2D4A6B`.
**Miért:** A világosabb értékek a webprojekt tényleges `globals.css`-ében élnek
(a régi doksi elavult, ez a webes BACKLOG-ban is jelzett eltérés), és a mockupok is
ezeket használják. Mobilon, kültéri fényben ez az olvashatósági minimum.
**Alternatíva:** A doksiban szereplő sötétebb értékek – kontraszthiány napfényben.
**Visszavonható?** Igen, egyetlen token-érték.

## D-007 – Supabase Auth marad, nincs Clerk
**Dátum:** 2026-08-31
**Döntés:** A `vibe-coding-mobile` skill alapértelmezett Clerk-ajánlása helyett
Supabase Auth (email/jelszó), AsyncStorage session-perzisztálással.
**Miért:** A webalkalmazás már Supabase Authot használ, ugyanaz az `auth.users` tábla
és `user_metadata.role` adja az RBAC-ot, és az RLS policy-k a `auth.uid()`-ra épülnek.
Clerk bevezetése kettős identitásréteget és felhasználó-szinkronizálást jelentene
egyetlen előny nélkül.
**Alternatíva:** Clerk – jobb beépített UI, de itt idegen test.
**Visszavonható?** Nem érdemben – az egész RLS-modell erre épül.

<!-- ÚJ DÖNTÉSEK IDE, ALULRA, NÖVEKVŐ SORSZÁMMAL -->
