# Feature task lista – ASEStats Mobile v1

> **Ez a fájl egyben munkanapló is.** Minden elvégzett feladat után ki kell pipálni a
> sort, be kell írni a munkanapló bejegyzést, és commitolni kell.
> A részletes szabályok a `CLAUDE.md` „Munkanapló és commitok" szakaszában vannak.

**Platform:** iOS + Android, közös kódbázis, azonos UI.
**Design:** elfogadva (P0 Style Tile, Ma, Játékosok Lista, Szűrő Bottom Sheet, Tabella).
**Előzmény:** a webprojekt `context/mobile/` tervdokumentációja (S1) és `BACKLOG.md`-je.

---

## S3 – Setup (egyszeri)

- [x] Expo projekt létrehozása a repo gyökerében (`npx create-expo-app . --template blank-typescript`)
- [x] Git init, `.gitignore` (node_modules, .expo, .env, ios/, android/), első commit: `setup: Expo projekt inicializálás`
- [x] A meglévő 5 mockup HTML áthelyezése `docs/mockups/` alá (ne a repo gyökerében maradjanak)
- [x] `.env` és `.env.example` létrehozása (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
- [x] Expo Router bekötése (`expo-router`, entry point, `app/_layout.tsx`)
- [x] NativeWind v4 telepítése és konfigurálása (`tailwind.config.js`, `babel.config.js`, `global.css`, `metro.config.js`)
- [x] `constants/theme.ts` – a `CLAUDE.md` tokentáblájának 1:1 leképezése TS-be; a `tailwind.config.js` ebből olvas
- [x] `expo-font`: Barlow Condensed, DM Sans, JetBrains Mono elhelyezése `assets/fonts/`-ba + betöltés a gyökér layoutban
- [x] `constants/images.ts` létrehozása (ASE logó, empty state illusztrációk helye)
- [x] Lint + typecheck script bekötése (`npm run lint`, `npx tsc --noEmit`)
- [x] TypeScript strict mode + path aliasok (`@/*`, `@core/*`) `tsconfig.json` + `babel-plugin-module-resolver`

### `@core` mag bekötése

- [x] `scripts/sync-core.ts` – a webprojekt `lib/`-jéből másolja a 15 modult `core/`-ba, fejléc-kommentel; `npm run sync:core`
- [x] Első szinkron lefuttatása, `core/` commitolása
- [x] **`@core/stat-formulas` import füstteszt** – egy képernyőn hívj meg egy formulát valós számmal, és nézd meg, hogy fordul-e Metro alatt. **Ha ez nem megy, ne lépj tovább.**
- [x] A maradék 14 modul import-füsttesztje (csak import + típusellenőrzés, nem futtatás)

### Supabase és auth

- [x] `react-native-url-polyfill` + `@react-native-async-storage/async-storage` telepítése
- [x] `lib/supabase.ts` – RN kliens AsyncStorage adapterrel, `autoRefreshToken`, `detectSessionInUrl: false`
- [x] `store/authStore.ts` – session tükrözés, `onAuthStateChange` feliratkozás
- [x] `app/login.tsx` – bejelentkezési képernyő a Dark Command Center stílusban
- [x] `app/_layout.tsx` auth guard: nincs session → login, van → `(tabs)`
- [x] Teszt: bejelentkezés valós Supabase felhasználóval **iOS szimulátoron**
- [ ] Teszt: bejelentkezés valós Supabase felhasználóval **Android emulátoron** (nincs telepítve ezen a gépen)
- [ ] Push GitHub-ra (kérésre)

---

## S4 – Adatréteg

- [x] `store/filterStore.ts` – `selectedSeasonId`, `selectedTeamId`, AsyncStorage perzisztálás, `hydrated` flag
- [x] `hooks/useFilterData.ts` – `seasons` + `teams` betöltés, alapértelmezett szezon az `is_current`-ből
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

## 2026-08-31 – Szűrő adatai (`useFilterData`)

**Mit:** Elkészült a `hooks/useFilterData.ts`: betölti a `seasons` és a `teams`
listát, és gondoskodik róla, hogy a `filterStore` mindig **érvényes**
azonosítót tartalmazzon. Ha nincs mentett választás, alapértelmezésre esik:
szezonnál az `is_current`, egyébként a legfrissebb; csapatnál az `is_primary`,
egyébként névtartalék (lásd D-013). Ugyanez fut akkor is, ha a mentett
azonosítóra már nem jön adat – ezzel lezárult a `filterStore` bejegyzésében
nyitva hagyott „a tárolt azonosító érvényességét senki nem ellenőrzi" pont.
Az alapértelmezés csak a store visszaolvasása (`hydrated`) után íródik ki,
különben felülírná a felhasználó korábbi választását.

A két lista modulszintű ígéretben cache-elődik, nem store-ban (D-014), és a
`reload()` üríti a cache-t a későbbi hibapanel újrapróbálás gombjának.
A Supabase válaszát a `types/filters.ts` `Season` / `Team` alakjára
validáljuk – hiányos sor kiesik, hiányzó `short_name` esetén a teljes név lép
be. A hook a nyers snake_case oszlopokat camelCase-re fordítja, hogy a UI ne
lásson adatbázis-alakot.

**Fájlok:** `hooks/useFilterData.ts`, `types/filters.ts`

**Tesztelve:** `npx tsc --noEmit` és `npm run lint` hibátlan.

A hook **valódi kódját** Node alatt is lefuttattam (babel-lel CJS-re fordítva, a
`react` és a store dublőrözve, de **éles** Supabase klienssel), 12 ellenőrzéssel:
éles lekérdezés (5 szezon, 16 csapat, `start_date` szerinti sorrend), az
alapértelmezések éles adaton (2025/2026 az `is_current`-ből, Atomerőmű SE a
névtartalékból), szintetikus adaton (`is_primary` erősebb a névnél; nincs
egyezés → első elem; nincs `is_current` → legfrissebb), és a
határvalidáció (hiányos sor kiesik, `is_current: 'true'` string nem igaz,
hiányzó `short_name` → teljes név, nem tömb válasz → üres lista).

**Futtatva iPhone 17 Pro (iOS 26.5) szimulátoron, Expo Go alatt**, ideiglenesen a
füstteszt képernyőre kötve, három körben:
(1) üres tárolóval indulva `loading: true` → betöltés → a store megkapja a
2025/2026 + Atomerőmű SE alapértelmezést;
(2) nem alapértelmezett választást (2024/2025 + Sopron KC) beírva, majd az Expo
Go-t **leállítva és újraindítva** a választás túlélte a hidegindítást – az
alapértelmezés nem írta felül;
(3) törölt elemet szimulálva (`torolt-szezon-id` / `torolt-csapat-id`) a hook a
következő mountnál visszaesett a 2025/2026 + Atomerőmű SE alapértelmezésre.
Az ideiglenes bekötést utána visszavontam, a munkafa csak a két új fájlt
tartalmazza.

**Nyitva maradt:** A **hibaág** (hálózati hiba → `error` szöveg → `reload()`)
valós hálózatkimaradással nincs kipróbálva – a hozzá tartozó UI (hibapanel
újrapróbálás gombbal) az S4 utolsó sora, ott lesz értelme együtt tesztelni.
A csapatlista **nincs szezonra szűrve**: a 2026/2027 szezonban még nincs meccs,
mégis mind a 16 csapat választható. Ez a v1-ben elfogadható, de a Meccsek/
Játékosok képernyőknél üres állapotot fog adni. Android emulátor továbbra sincs
telepítve ezen a gépen.

**Commit:** `feat: szűrő adatok betöltése szezon- és csapatlistával`

---

## 2026-08-31 – Szűrő store (`filterStore`)

**Mit:** Elkészült a `store/filterStore.ts`: `selectedSeasonId`, `selectedTeamId`,
`hydrated`, plusz `setSeason` / `setTeam`. A perzisztálást a Zustand `persist`
middleware-e végzi AsyncStorage-on, `asestats.filter` kulcs alatt (lásd D-012).
A store **csak azonosítót tárol**, nevet nem – egy eltárolt név elavulna, ha a
szezont vagy a csapatot átnevezik; a nevek a következő feladat
`useFilterData` hookjából jönnek. A `hydrated` a `partialize` miatt nem kerül a
tárolóba, és sérült tároló-bejegyzés esetén is `true` lesz, hogy az app ne
fagyjon ki.

**Fájlok:** `store/filterStore.ts`

**Tesztelve:** `npm run typecheck` és `npm run lint` hibátlan. A perzisztálást
Node alatt, memóriában élő AsyncStorage-dublőrrel futtatva végigmértem a store
tényleges forrásán, 4 esetre: (1) üres tárolóval indulva `null`/`null` és
`hydrated: true`; (2) választás után a tárolt nyers érték pontosan
`{"state":{"selectedSeasonId":"season-2025","selectedTeamId":"team-ase"},"version":0}`
– a `hydrated` tehát valóban kimarad; (3) friss store-példány ugyanabból a
tárolóból visszaolvassa a választást; (4) szándékosan sérült JSON-ra figyelmeztet,
alapértelmezésre esik vissza, és `hydrated: true` marad.
A Metro-oldali feloldást úgy igazoltam, hogy ideiglenesen beimportáltam a store-t
az `app/index.tsx`-be, lefuttattam az `npx expo export`-ot iOS-re és Androidra,
és **mindkét** bundle-ben megtaláltam a store-t és a persist middleware-t
(`asestats.filter`, `onRehydrateStorage`, `selectedSeasonId`) – a
`zustand/middleware` alfüggvény tehát Metro alatt is felold. Az ideiglenes
importot utána visszavontam.

**Nyitva maradt:** A store-nak még nincs valódi fogyasztója, ezért szimulátoron
nem futott – az első vizuális ellenőrzése a `FilterSheet` feladatnál lesz.
A tárolt azonosító **érvényességét senki nem ellenőrzi**: ha egy szezont vagy
csapatot törölnek, a perzisztált id-re nem jön adat. Ezt szándékosan a
`useFilterData` hookra hagytam (következő feladat), mert csak ott van meg a
választható lista, amihez hasonlítani lehet.

**Commit:** `feat: szűrő store szezon- és csapatválasztással`

---

## 2026-08-31 – Bejelentkezés ellenőrzése valós felhasználóval (iOS)

**Mit:** Nem kód, hanem a nyitva maradt ellenőrzés lezárása. A bejelentkezés valós
Supabase felhasználóval **sikeres** iPhone 17 Pro (iOS 26.5) szimulátoron, Expo Go
alatt – ezzel az S3 auth blokkjának teljes köre igazolt: kliens → store →
`signInWithPassword` → `onAuthStateChange` → auth guard átirányítás. Ez felülírja az
alatta lévő bejegyzés „a sikeres bejelentkezés útvonala még nem futott le" pontját.

**Fájlok:** `docs/feature-tasks.md` (a tesztsor iOS/Android bontásban)

**Tesztelve:** iPhone 17 Pro (iOS 26.5) szimulátor, Expo Go – a felhasználó
kattintotta végig, mert a szimulátort programból nem tudom vezérelni
(nincs Accessibility jog a terminálnak).

**Nyitva maradt:** Android emulátor nincs telepítve ezen a gépen, ezért az
Android oldal továbbra is csak bundle-szinten igazolt – külön sorként nyitva a
feladatlistán. A kijelentkezés köre nincs külön visszaigazolva. A GitHub push
kérésre vár.

**Commit:** `docs: bejelentkezés iOS ellenőrzésének átvezetése`

---

## 2026-08-31 – Bejelentkezési képernyő és auth guard

**Mit:** Elkészült az `app/login.tsx` a Dark Command Center nyelven (ASE STATS
wordmark, ALL CAPS Barlow Condensed labelek, 44pt magas surface1 inputok
`border.subtle` kerettel, jelszó-láthatóság kapcsoló az input jobb szélén,
cián elsődleges gomb, negatív glow-s hibapanel). A `app/_layout.tsx` gyökér
layout `initAuth()`-tal indul, a splash addig áll, amíg a fontok be nem
töltenek **és** a tárolt session vissza nem olvasódik – így nem villan fel a
rossz képernyő. A `RootNavigator` végzi az átirányítást: nincs session → `/login`,
van session a login képernyőn → `/`. Az ideiglenes füstteszt képernyő kapott egy
kijelentkezés gombot, hogy a kör oda-vissza tesztelhető legyen.

A `Pressable` lenyomott állapotára közös `hooks/usePressed.ts` készült – az okát
lásd D-011.

**Fájlok:** `app/login.tsx`, `app/_layout.tsx`, `app/index.tsx`,
`hooks/usePressed.ts`

**Tesztelve:** `npx tsc --noEmit` és `npm run lint` hibátlan.
`npx expo export` iOS-re és Androidra egyaránt lefut.
**Futtatva iPhone 17 Pro (iOS 26.5) szimulátoron Expo Go alatt:** session
nélkül indulva az auth guard a login képernyőre irányít, a képernyő helyesen
renderel (a szem-ikon az input jobb szélén ül, a gomb üres űrlapnál 45%-os
opacitással letiltott), Metro konzolon nincs hiba.

**Nyitva maradt:** A **sikeres bejelentkezés** és a rá következő átirányítás még
nem futott le valós felhasználóval – nincs hozzá teszt-fiók, a szimulátort pedig
nem tudom kattintással vezérelni (nincs Accessibility jog). Ez a feladatlistán
külön sorként nyitva marad. Android emulátor továbbra sincs telepítve ezen a
gépen, az Android oldal csak bundle-szinten igazolt. A mockupok halvány cián
pontrács-háttere (`radial-gradient` 24×24) még egyik képernyőn sincs meg – az
S5 közös komponenseinél kell megoldani (SVG `Pattern` vagy csempézett kép).

**Commit:** `feat: bejelentkezési képernyő és auth guard`

---

## 2026-08-31 – Supabase kliens és auth store

**Mit:** Felállt az adat- és auth-réteg alapja. A `lib/supabase.ts` az app egyetlen
Supabase kliense: AsyncStorage adapter, `autoRefreshToken`, `persistSession`,
`detectSessionInUrl: false`, és induláskor beszédes hibát dob, ha az
`EXPO_PUBLIC_*` változók hiányoznak. A `store/authStore.ts` Zustandban tükrözi a
sessiont (`session`, `user`, `hydrated`), az `initAuth()` elvégzi a
`getSession()` + `onAuthStateChange` feliratkozást, és az `AppState`-hez köti a
token-auto-frissítést (előtérben `startAutoRefresh`, háttérben `stopAutoRefresh`).
A Supabase angol auth-hibakódjait magyar üzenetre képezi le.

**Fájlok:** `lib/supabase.ts`, `store/authStore.ts`

**Tesztelve:** `npx tsc --noEmit` és `npm run lint` hibátlan. A Supabase projekt
elérhetőségét ellenőriztem: `/auth/v1/health` HTTP 200. A hibaleképezést a
telepített `@supabase/supabase-js`-szel futtatva ellenőriztem: rossz
belépőadatra `error.code === 'invalid_credentials'`, amit a store a
„Hibás email cím vagy jelszó." üzenetre fordít.

**Nyitva maradt:** A sikeres bejelentkezés útvonala még nem futott le éles
felhasználóval – ehhez teszt-fiók kell.

**Commit:** `setup: Supabase kliens és auth store`

---

## 2026-08-31 – @core mag bekötése és füstteszt

**Mit:** A `scripts/sync-core.ts` átmásolja a webprojekt `lib/`-jéből mind a 15
tiszta elemző modult a `core/`-ba, fejléc-kommenttel, és figyelmeztet, ha külső
(React / Next / Supabase / Node) importot talál. Az első szinkron mind a 15 modult
áthozta (9 511 sor), figyelmeztetés nélkül. Az `app/index.tsx` ideiglenes füstteszt
képernyő mind a 15 modult importálja, és a `stat-formulas` három képletét valós
számokkal hívja meg (TS%, eFG%, valuation).

**Fájlok:** `scripts/sync-core.ts`, `core/*.ts` (15 modul), `app/index.tsx`,
`package.json` (`npm run sync:core`)

**Tesztelve:** `npm run typecheck` strict módban hibátlan mind a 15 core modulra.
`npx expo export` iOS-re és Androidra lefut; a kiexportált iOS bundle-ben
ellenőrizve, hogy a `trueShootingPct`, `simpleValuation`, `getSeasonStatsTable`
és `fetchAllRows` benne van – tehát a `@core` alias Metro alatt is felold.
**Futtatva iPhone 17 Pro (iOS 26.5) szimulátoron Expo Go alatt:** a képernyő
renderel, mind a 15 modul betöltődik és kiírja a saját export-számát
(stat-formulas 4, player-analysis 14, …), a három képlet valós eredményt ad
(TS 66.1%, eFG 67.9%, VAL 25). A 3 betűcsalád, a sötét paletta, a 14px
card radius és a safe area inset is helyesen jelenik meg.

**Nyitva maradt:** Az `app/index.tsx` ideiglenes – az S3 auth része után a
`(tabs)` váltja fel. A `sync-core.ts` a Node natív TS-futtatásával megy
(Node 24), ezért `MODULE_TYPELESS_PACKAGE_JSON` figyelmeztetést ír – ártalmatlan.

**Commit:** `core: @core szinkron script és első szinkron`

---

## 2026-08-31 – S3 Expo váz: Router, NativeWind, design tokenek, fontok

**Mit:** Az Expo SDK 57 váz feláll és bundle-ölhető. Expo Router (fájl-alapú
navigáció, `expo-router/entry` belépési pont), NativeWind v4 + Tailwind 3 a
`constants/theme.ts`-ből olvasó `tailwind.config.ts`-szel, 7 statikus TTF a
3 betűcsaládból `assets/fonts/`-ban, `expo-font` betöltés a gyökér layoutban
splash-kezeléssel. `@/*` és `@core/*` alias tsconfig-ban és
`babel-plugin-module-resolver`-ben. A tokenek a mockupokból ellenőrizve
(lásd D-008). A mockup HTML-ek olvasható markupja kicsomagolva
`docs/mockups/extracted/` alá – a bundle-ölt 1,2 MB-os fájlokból nem lehetett
dolgozni.

**Fájlok:** `app/_layout.tsx`, `constants/theme.ts`, `constants/fonts.ts`,
`constants/images.ts`, `tailwind.config.ts`, `babel.config.js`,
`metro.config.js`, `global.css`, `nativewind-env.d.ts`, `types/globals.d.ts`,
`tsconfig.json`, `app.json`, `eslint.config.js`, `package.json`,
`assets/fonts/*.ttf`, `docs/mockups/extracted/*.html`

**Tesztelve:** `npm run typecheck` és `npm run lint` hibátlan.
`npx expo export` iOS-re és Androidra egyaránt lefut. A kiexportált iOS
bundle-ben ellenőrizve, hogy a NativeWind a theme tokenjeit fordítja le
(`#0A1628`, `#050B14`, `fontSize:28`, `borderRadius:14`) és hogy mind a
7 betűfájl neve bekerül. Vizuálisan ellenőrizve iPhone 17 Pro (iOS 26.5)
szimulátoron, Expo Go alatt.

**Nyitva maradt:** Androidra nincs telepített SDK/emulátor ezen a gépen –
az Android oldal egyelőre csak bundle-szinten igazolt. Az első Android
vizuális ellenőrzés az auth képernyőnél esedékes.

**Commit:** `setup: Expo Router, NativeWind és design tokenek`

---

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

## D-008 – A mockup a mérvadó a típusskálára és a radiusra
**Dátum:** 2026-08-31
**Döntés:** A `constants/theme.ts` a mockupok tényleges értékeit kódolja, nem a
`CLAUDE.md` rövidített tokentábláját. Típusskála: 9/10/11/12/13/14/15/17/20/22/24/
28/32/34/40. Radius: 2 (badge), 3 (progress), 4 (input), 6 (gomb/tab), 10 (listasor),
14 (StatTile/sheet). A Tailwind `spacing` kulcsai maguk a px értékek (`p-14` → 14px),
mert a mockupok px-ben készültek és több padding (14, 17, 10, 3) nincs rajta a 4pt
rácson.
**Miért:** A `CLAUDE.md` szerint a designt pontosan replikálni kell, a mockupok pedig
elfogadottak. A CLAUDE.md 8 elemű skálája a mockup értékeinek részhalmaza – a hiányzó
28-as StatTile érték és a 40-es meccseredmény kerekítése látható vizuális eltérést
okozna. A színpaletta ellenőrizve: a mockupok pontosan a tokentábla 16 színét
használják, plusz 5 egyszeri árnyalatot (`#C4B5FD` AI badge felirat, `#0096B8`
gradiens vég, `#0F2040`/`#16233D`/`#101E33` finom felületek) – ezek `colors.shade`
és `colors.text.ai` néven kerültek be.
**Alternatíva:** A CLAUDE.md skálájához ragaszkodni és kerekíteni (a felhasználó
elvetette), vagy képernyőnként rákérdezni minden hiányzó értékre (lassú).
**Visszavonható?** Igen, egy fájl.

## D-009 – A sync script írja át a `@/lib/` importokat, nem kézi patch
**Dátum:** 2026-08-31
**Döntés:** A `scripts/sync-core.ts` a másolás közben a `@/lib/<modul>` importokat
`./<modul>`-ra írja át (3 helyen: `dashboard-types`, `player-stat-mapping`).
Ha nem szinkronizált modulra mutatna, figyelmeztet és nem ír át.
**Miért:** A webprojektben a `@/` a repo gyökere, ahol a `lib/` a mag helye. A mobilban
a `@/` szintén a gyökér, de ott saját `lib/` mappánk van (Supabase kliens, format
helper) – a `@/lib/stat-formulas` tehát a mobilban rossz helyre mutatna. Az átírás a
generátorban történik, így a `core/` továbbra sincs kézzel szerkesztve, és a következő
szinkron újratermeli.
**Alternatíva:** `@/lib/*` aliast a `core/`-ra irányítani – ütközne a saját `lib/`
mappánkkal. Vagy a webprojektben relatívra cserélni az importokat – idegen projektet
módosítana egy mobil-specifikus okból.
**Visszavonható?** Igen.

## D-010 – `babel-preset-expo` explicit devDependency
**Dátum:** 2026-08-31
**Döntés:** A `babel-preset-expo@57.0.9` felkerült devDependency-nek.
**Miért:** Az SDK 57-ben a preset az `expo` csomag alá van beágyazva
(`node_modules/expo/node_modules/`), így a saját `babel.config.js`-ünkből névre
hivatkozva nem oldódik fel – a Metro `Cannot find module 'babel-preset-expo'`
hibával elhasal. Saját babel config viszont kell a NativeWind `jsxImportSource`-hoz
és a `module-resolver` aliasokhoz. A verzió a beágyazottal egyezik.
**Alternatíva:** `require.resolve` az `expo` csomagon keresztül – törékeny és
olvashatatlan. Vagy nem írni saját babel configot – akkor nincs `@core` alias.
**Visszavonható?** Igen, de a Metro nem fordulna nélküle.

## D-011 – A `Pressable` lenyomott állapotát saját state követi, nem a `style` függvény-alak
**Dátum:** 2026-08-31
**Döntés:** A `style={({ pressed }) => …}` függvény-alakot nem használjuk. Helyette a
`hooks/usePressed.ts` `onPressIn`/`onPressOut`-tal követi a lenyomott állapotot, és a
stílust **objektumként** adjuk át.
**Miért:** A NativeWind (`react-native-css-interop`) JSX-wrappere minden regisztrált
komponenst – így a `Pressable`-t is – lecseréli az interop változatra, `className`
nélkül is. Ez a `style` prop **függvény-alakját csendben eldobja**: se hibaüzenet, se
figyelmeztetés, a stílus egyszerűen nem érvényesül. Konkrétan emiatt tűnt el a
bejelentkezés gomb háttere (fekete felirat fekete háttéren) és csúszott ki a
jelszó-szem ikon az inputból. Objektum-alakú `style` viszont hibátlanul működik.
Mivel a `CLAUDE.md` szerint minden hover-állapot pressed-re képződik le, ez az egész
komponenskönyvtárat érintené – ezért kell közös hook.
**Alternatíva:** `cssInterop={false}` prop az érintett komponensekre – a könyvtár
hivatalos kivezető útja, de nincs típusdeklarációja, tehát `any`-t vagy globális
típus-augmentációt igényelne, amit a `CLAUDE.md` tilt. Vagy `className`-nel megoldani
az `active:` variánssal – az viszont csak a Tailwind-tokenekre képes, a futásidőben
számított stílusokra (pl. letiltott gomb opacitása) nem.
**Visszavonható?** Igen, de a teljes komponenskönyvtárat érinti.

## D-012 – A szűrő perzisztálását a Zustand `persist` middleware végzi, nem kézi AsyncStorage
**Dátum:** 2026-08-31
**Döntés:** A `filterStore` a `zustand/middleware` `persist`-jét használja
`createJSONStorage(() => AsyncStorage)`-dzsel, és a `hydrated` flaget az
`onRehydrateStorage` visszahívása állítja be.
**Miért:** A `persist` a zustand része, tehát **nem új dependency**. A kézi
megoldás ugyanezt a három dolgot (induló beolvasás, minden változásnál kiírás,
`hydrated` jelzés) kb. kétszer annyi kódból adná, és a kiírás elfelejtése néma
adatvesztés lenne. Az `authStore` azért nem így néz ki, mert ott a perzisztálást
a Supabase kliens végzi – ott nincs mit menteni, csak tükrözni.
A `partialize` azért kell, hogy a futásidejű `hydrated` ne kerüljön a tárolóba:
enélkül egy régi `hydrated: true` visszaolvasva elfedné, hogy a beolvasás még
tart. Az `onRehydrateStorage` hiba ágán is `true`-ra állítunk, mert egy sérült
AsyncStorage bejegyzés különben véglegesen a betöltő képernyőn ragasztaná az appot.
**Alternatíva:** Kézi `AsyncStorage.getItem`/`setItem` az `initAuth()` mintájára –
konzisztensebb lenne az `authStore`-ral, de több kód és több hibalehetőség.
Vagy `expo-secure-store` – a szűrő nem titok, felesleges.
**Visszavonható?** Igen, egy fájl.

## D-013 – Az alapértelmezett csapat névtartalékkal dől el
**Dátum:** 2026-08-31
**Döntés:** A `defaultTeam()` sorrendje: `is_primary` → névegyezés az
`OWN_TEAM_NAMES` konstanssal (`atomerőmű se`, `ase`) → a lista első eleme.
**Miért:** A `teams` tábla a **teljes bajnokságot** tartalmazza (16 csapat,
mindegyiknek van játékosa és meccse), és élesben **egyetlen sornál sincs
`is_primary: true`** – a migráció ugyan `is_primary: true`-val szúrta be az
„ASE" sort, de az mára „Atomerőmű SE"-vé alakult a jelölés nélkül. Tisztán
`is_primary`-re hagyatkozva az app az „Alba Fehérvár"-ral nyílna (névsor
szerinti első), ami egy ASE-belsős appban zavaró. A mockup „ASE / ASE U20 /
ASE Akadémia" listája design-placeholder volt, valós adata nincs.
**Alternatíva:** Csak `is_primary`, és a weben beállítani a jelölést – de a
mobil app nem ír, tehát ez rajtunk kívül álló feltétel lenne. Vagy alapértelmezés
nélkül indulni és kötelező választást kérni – egy extra lépés minden telepítésnél.
**Következmény:** Ha valaki a weben bekapcsolja az `is_primary`-t az ASE-n, a
névtartalék magától kikopik. Ha az ASE-t átnevezik, a tartalék elcsúszik – ezért
érdemes a weben egyszer beállítani az `is_primary`-t.
**Visszavonható?** Igen, egy függvény.

## D-014 – A szezon/csapat lista modulszintű cache-ben, nem Zustand store-ban
**Dátum:** 2026-08-31
**Döntés:** A `useFilterData` egy modulszintű `Promise` cache-ben tartja a
betöltött listákat, nem külön Zustand store-ban. Hibára a cache ürül, a
`reload()` pedig kényszerítetten újratölt.
**Miért:** A két lista **változatlan bemenetű** – nem függ a szűrőtől, és az app
élettartama alatt gyakorlatilag statikus. Több képernyő is kérni fogja
(fejléc-chip, FilterSheet), és így mindegyik ugyanazt az egy hálózati kérést
osztja meg, extra store és extra fájl nélkül. A `CLAUDE.md` mappastruktúrája is
hookként nevezi meg ezt (`hooks/useFilterData.ts`), nem store-ként.
**Alternatíva:** `store/filterDataStore.ts` – nem duplikálná a `useState`-et
minden fogyasztónál, és a devtools-ban látszana; cserébe egy negyedik store és
több kód ugyanazért. Vagy cache nélkül minden mountnál újratölteni – felesleges
kérés minden tabváltásnál.
**Visszavonható?** Igen, egy fájl.

<!-- ÚJ DÖNTÉSEK IDE, ALULRA, NÖVEKVŐ SORSZÁMMAL -->
