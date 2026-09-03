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
- [x] `components/FilterSheet.tsx` – szezon/csapat választó bottom sheet a mockup szerint; Android hardveres back kezelése
- [x] `hooks/useGameData.ts` – meccsek + fixtures lekérése, `@core/season-tables` + `@core/fetch-all-rows` használatával
- [x] `hooks/usePlayerData.ts` – szezon-aggregált játékosstatisztikák, `@core/player-stat-mapping` mappinggel
- [x] Lusta betöltési stratégia: tabonkénti fetch, cache a szűrő élettartamára
- [x] Hibakezelés: hálózati hiba → újrapróbálás gombos hibapanel; üres adat → `EmptyState`

---

## S5 – Közös UI komponensek

- [x] `components/GlowCard.tsx` – surface1 + subtle border + opcionális accent glow réteg (border + alacsony opacitású háttér, **nem** shadowColor)
- [x] `components/StatTile.tsx` – label + JetBrains Mono érték + opcionális trend és accent (a webes `StatCard` mobil párja)
- [x] `components/StackedRow.tsx` – listaelem, függőlegesen csoportosított adatokkal (a `DataTable` sor mobil párja)
- [x] `components/StatMatrix.tsx` – vízszintesen görgethető statisztikai mátrix **fagyasztott első oszloppal**; iOS és Android görgetés-szinkron ellenőrzése
- [x] `components/Badge.tsx` – 7 variáns (cyan / orange / ai / positive / negative / warning / neutral)
- [x] `components/SkeletonBlock.tsx` – shimmer betöltés (Reanimated)
- [x] `components/EmptyState.tsx` – üres állapot ikonnal és szöveggel
- [x] Tap target audit: minden interaktív elem ≥ 44×44pt vagy `hitSlop`-pal kiegészítve

---

## S6 – Képernyők (prioritási sorrendben)

- [x] **Ma** (`app/(tabs)/index.tsx`) – következő/legutóbbi meccs kártya, csapat KPI-ok StatTile-okban, gyors belépési pontok. Mockup: `Ma Screen`
- [x] **Meccsek – lista** (`app/(tabs)/games/index.tsx`) – lejátszott meccsek + közelgő fixtures, StackedRow-val
- [x] **Meccs részletei** (`app/(tabs)/games/[id].tsx`) – eredmény, negyedek, box score StatMatrix-ben, mentett pregame/postgame riport `GlowCard accent="ai"`-ban
- [x] **Játékosok – lista** (`app/(tabs)/players/index.tsx`) – szezon-aggregált lista, rendezés, névkeresés. Mockup: `Jatekosok Lista`
- [x] **Játékos részletei** (`app/(tabs)/players/[id].tsx`) – szezonstatisztika, meccsenkénti bontás, mentett játékos-riportok
- [x] **Tabella** (`app/(tabs)/standings.tsx`) – bajnoki tabella saját sorkomponenssel. Mockup: `Tabella`
- [x] **Elemzés – hub** (`app/(tabs)/analysis/index.tsx`) – a mentett AI riportok listája egy helyen (meccs / csapat / játékos), fajta szerinti szűrő-chipekkel
- [x] **Riportolvasó** (`app/(tabs)/analysis/[id].tsx`) – egy riport teljes szövege, szekciócímekkel és megállapítás-listával
- [x] **Elemzés – Szituációk** (`app/(tabs)/analysis/situational.tsx`) – a P12 „Számított elemzések" szekciójának első sora és a P13 képernyő: hazai/vendég összehasonlítás, szoros/kiütéses és félidei helyzetek, negyedbontás, four factors (`@core/situational-analysis`)
- [x] **Elemzés – Ellenfél scouting** (`app/(tabs)/analysis/scouting.tsx`) – a következő ellenfél erősségei és gyengéi (`@core/pregame-scouting`)
- [x] **Elemzés – Szerepkör-elemzés** – ki mit tesz hozzá a csapatjátékhoz (`@core/team-analysis`)
- [x] Clutch bontás a **Meccs részletein** (`@core/kosarstat-clutch-parse`) – szezonszintű clutch nézet nincs (D-069)
- [x] Tab layout véglegesítése: 5 tab ikonokkal, aktív állapot cián glow-val, safe area alul (az Elemzés tab lila – D-091, D-092)

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

## 2026-09-03 – Tab layout véglegesítése

**Mit:** Lezárult az S6 utolsó nyitott sora: a `TabBar` aktív állapota
véglegesítve. Két dolog került bele, a többi (5 tab ikonokkal, `insets.bottom`
alapú safe area) már állt.

*Glow az aktív ikon alatt (D-091).* A mockup indikátora sík 3pt-os sáv, glow
nélkül – a feladatlista viszont „aktív állapot cián glow-val" sort kér. Az
aktív ikon mögé most egy 56×32pt-os réteg kerül: `glow[tone].fill` háttér és
`glow[tone].border` 1pt keret (D-005 szerint, nem `shadowColor`). A keret
fókusz nélkül is 1pt, csak átlátszó, hogy az ikon ne ugorjon fókuszváltáskor.

*Az Elemzés tab lila (D-092).* A P12 prompt kimondja: az aktív „Elemzés" tab
az egyetlen, ami AI-tónust kap – az ikon, a felirat és a felső indikátorcsík
is lila. A szín a `text.ai` (#C4B5FD) lavender, nem az `accent.ai` (#7C3AED),
mert utóbbi ekkora ikonon a sötét sávban alig látszana. A másik négy tab cián
(`accent.cyan`) marad. Az útvonalnév→hangnem a `TAB_TONE` táblában.

*Nyomás-visszajelzés.* A tabelem eddig `Pressable` volt visszajelzés nélkül;
most a `usePressed` hookkal a nem aktív tab lenyomva 0.6 opacitásra vált
(a `CLAUDE.md` „minden hover → pressed" szabálya). A `map` callbackből ezért
külön `TabItem` komponens lett (hook nem lehet ciklusban).

**Fájlok:** `components/TabBar.tsx` (átírva: `TabItem` komponens, tónus-tábla,
glow réteg, pressed opacitás), `app/(tabs)/_layout.tsx` (fejléckomment)

**Tesztelve:** `npx tsc --noEmit` és `npm run lint` hibátlan (mindkettő EXIT 0).
`npx expo export` iOS-re és Androidra lefut; mindkét Hermes bundle tartalmazza
a tab feliratokat („Elemzés", „Tabella", „Meccsek", „Játékosok"). A
`ma-screen.html` mockup alsó sávjával összevetve az elrendezés (63pt tartalom
+ inset, 24pt ikon, DM Sans 11pt felirat, 24×3pt indikátor) egyezik.

**Nyitva maradt:** **Eszközön még nem futott.** Valós kijelzőn kell megítélni:
(1) az 56×32pt-os glow réteg mérete öt tab mellett 390pt alatt – nem lóg-e
össze a szomszéddal; (2) a lila `text.ai` ikon kontrasztja a `surface1`
sávon; (3) a pressed 0.6 opacitás érzete gyors koppintásnál. Ezzel az S6
összes sora kész; a következő blokk az S7 (chartok), aminek első sora a
`victory-native` + `@shopify/react-native-skia` telepítése – **engedélyt
igényel** (a `CLAUDE.md` szerint minden új csomagra rá kell kérdezni), bár a
tech stack listában szerepelnek.

**Commit:** `feat: tab layout véglegesítése – Elemzés tab lila, aktív glow`

---

## 2026-09-02 – Clutch-bontás a Meccs részletein

**Mit:** Elkészült az S6 utolsó előtti sora: a Meccs részletei képernyőn a
`Box score` és az `Elemzés` közé bekerült egy `Clutch` szekció, ami a
`@core/kosarstat-clutch-parse` `parseGameClutch`-ának kimenetét jeleníti meg.
Szezonszintű clutch nézet továbbra sincs (D-069).

*A `@core` hibája.* A `parseGameClutch` a kosarstat clutch-tábla `CSAPAT`
összegző sorát játékosként számolta: minden csapatösszeg **duplázódott**
(pont, eladott labda, minta), és a `CSAPAT` sor a `topUsageClosers` élére
került. A ráta-mutatók (ortg/drtg/net/tov%/oreb%) túlélték, mert számláló és
nevező is duplázódott. Javítva a webprojektben
(`asestats/lib/kosarstat-clutch-parse.ts`, külön commit ott is), majd
`npm run sync:core` és külön `core:` commit a mobil repóban (D-088).

*Adat.* A `useGameDetails` mostantól egy negyedik ágat is futtat
(`fetchClutch`): előbb a `kosarstat_game_pages_raw` `game_clutch` oldala(i)
`kosarstat_game_id` + `season_id` szűréssel, majd a hozzájuk tartozó
`kosarstat_game_page_tables` sorok, végül a nyers táblák a `parseGameClutch`-
nak. Lapozás nincs – egy meccshez néhány oldal és ~10 tábla tartozik. Ha a
meccshez nincs `kosarstatGameId` vagy clutch-oldal, `clutch` = `null`.

*Megjelenítési modell.* Új tiszta modul: `lib/clutch-view.ts` – a
`KosarstatGameClutch`-ból formázott mutatósorokat, closers-szöveget,
lábjegyzetet és a sablonos `Megállapítás`-t építi (D-076 mintája). Három
állapot: `available`, `notClose` (van clutch-oldal, de <60 mp minta),
`missing` (nincs oldal). A két utóbbi a szekció eltűnése helyett magyarázó
sort mutat (D-047 mintája).

*Nem fix 5 perc.* A kosarstat „clutch" a ±5 pontos állásnál játszott percek
**összessége**, nem egy fix időablak: a mért ASE-meccseken 05:00 és 15:00
között szór (a 2025.09.27-i meccsen 15:00, a CSAPAT-sor szerint 75:00 = 15×5).
Ezért a szövegek sehol nem hivatkoznak „utolsó 5 percre", a minta hosszát
viszont mindig kiírják (D-089). A webprojekt `export-to-md.ts`-e még „utolsó
5 perc"-nek nevezi – ez a weben pontatlan, de a mobil scope-on kívül van.

*Komponens.* Egy új: `ClutchPanel` – fejléc kártya (minta + clutch-állás
előjeles különbséggel), `StatList` a 9 mutatóval, a legtöbbet birtoklók
kártyája, `InsightCard`, lábjegyzet.

**Fájlok:** `app/(tabs)/games/[id].tsx` (Clutch szekció),
`hooks/useGameDetails.ts` (`fetchClutch`, `toRawRows`, `groupTablesByRaw`,
`clutch` a payloadban), `lib/clutch-view.ts` (új), `types/clutch.ts` (új),
`components/ClutchPanel.tsx` (új), `core/kosarstat-clutch-parse.ts` (szinkron,
külön commit)

**Tesztelve:** `npx tsc --noEmit` és `npm run lint` hibátlan. A teljes lánc
(két lekérdezés → `parseGameClutch` → `buildClutchView`) élesben, a kliens
anon kulcsával, **mind a 37 ASE clutch-meccsre 2025/2026-ban**: 18 `available`,
19 `notClose`, sehol `NaN` / `Infinity` / `undefined` a nézetmodellben, és a
`CSAPAT` sor **egyetlen closers-listába sem** szivárgott be (a fix előtt
mind a 18-ban ott volt). A duplázás eltűnt: pl. a 2026.05.25-i meccs (ASE
vendég) a fix előtt 8–22 / minta 25:00 / „CSAPAT (50%)", a fix után 4–11 /
minta 05:00 / valós closerek – a 4–11 pontosan a játékossorok összege. A
2022/2023–2024/2025 szezonokra és a kosarstat nélküli meccsekre a `missing`
ág fut (magyarázó sor). `npx expo export` iOS-re és Androidra lefut; mindkét
Hermes bundle tartalmazza a szekció feliratait („Clutch", „Clutch állás",
a „…rating" mutatókat, a „…closers"/`topUsageClosers` magot).

**Nyitva maradt:** **Eszközön még nem futott.** Három dolgot valós kijelzőn
kell megítélni: (1) a fejléc kártya két oszlopa a leghosszabb alakkal
(`15:00` és `27–15  +12`) egy sorban marad-e 390pt alatt; (2) a closers-sor
tördelése három hosszú névvel (`Trevon BLUIETT (42%), KRIVACSEVICS Markó
(17%), HALMAI Dániel (17%)`); (3) a `StatList` 9 sora + a `Megállapítás`
együtt sok görgetés a képernyő alján. Érvényben marad a korábbi lelet: a
csomagolt betűkészletekből hiányzik az `ő`/`ű` glifa – ez itt a
„Büntetőráta" mutatót és az olyan neveket érinti, mint „SZŐKE". A kosarstat
nem fix időablaka miatt a mintahossz meccsenként változó (D-089). A P12 lila
aktív tab-állapota és a tab layout véglegesítése (az S6 utolsó nyitott sora)
továbbra is hátravan.

**Commit:** `feat: Clutch-bontás a Meccs részletein` (+ `core: @core szinkron –
clutch parser kihagyja a CSAPAT összegsort`)

---

## 2026-09-02 – A scouting és a szerepkör-elemzés közös adatrétege

**Mit:** A két képernyő ugyanazt a három szezonlekérdezést futtatta külön
kóddal és külön cache-sel; most egy modul és egy cache szolgálja ki
mindkettőt. Ezzel az Ellenfél scouting is megkapta az ellenfél-oldali
statisztikát, tehát a D-079-es korlát megszűnt: **visszakerült a tempó és a
támadólepattanó-arány sora.**

*Adatréteg.* A `lib/team-season-stats.ts` mostantól nemcsak a
`TeamSeasonStat[]` mezőnyt adja, hanem a csapatonkénti mérleget (`records`) és
a kereteket is (`rosters`, a `@core/pregame-scouting` `PlayerSeasonStat`
alakjában, szerepkörökkel). A `@core/team-analysis` roster alakja ebből
származtatva áll elő (`toRosterEntry`), tehát a labdaigény-képlet egy helyen
van. Új hook: `useTeamSeasonData` – egyetlen, szezonra kulcsolt cache, amit a
`useScoutingData` és a `useTeamRolesData` egyaránt használ (D-086). A
gyakorlati haszon: a scoutingról a szerepkör-elemzésre lépve nincs újabb
2 MB-os lekérdezés.

*Szerepkörök átadása.* A `@core/pregame-scouting` a labdahordozókat **angol
szerepkörkulcsra** hasonlítja, a `@core/player-analysis` `roles` mezője
viszont magyar feliratot ad – ezért a `roleKeys` megy tovább mindkét modellbe
(D-087). A `@core/team-analysis` mindkét alakot elfogadja
(`normalizeRoleKeys`), így a szerepkör-elemzés kimenete bitre ugyanaz maradt.

*Scouting nézet.* A szembeállított metrikasorok száma 9-ről 11-re nőtt
(`Tempó` és `Támadólepattanó %`). A tempó **leíró** mutató: egyik oldal sem
kap kiemelést, mert a gyorsabb játék nem jobb, csak másfajta (új `neutral`
jelző a `MetricSpec`-en). Az Áttekintés lábjegyzete kiírja, hány meccsre állt
össze az ellenfél-oldali adat mindkét csapatnál.

**Fájlok:** `lib/team-season-stats.ts` (mérleg, keret, `toRosterEntry`),
`hooks/useTeamSeasonData.ts` (új), `hooks/useScoutingData.ts` (a saját
lekérdezése és összegzése törölve, −250 sor), `hooks/useTeamRolesData.ts`
(ugyanígy), `lib/scouting-view.ts` (tempó és támadólepattanó sor, közös
`TeamRecord`, bővebb lábjegyzet)

**Tesztelve:** `npx tsc --noEmit` és `npm run lint` hibátlan. A scouting lánc
(közös lekérdezés → `analyzePreGameScouting` → `buildScoutingView`) élesben, a
kliens anon kulcsával lefuttatva **mind az 5 szezonra, az ASE összes
ellenfelére**: 2025/2026-ban 15, 2024/2025-ben 13 párosítás, sehol `NaN`,
`Infinity` vagy `undefined`. A két új sor értéke reális: tempó 74–79
birtoklás/meccs (korábban az `opponent` blokk nélkül a fele lett volna),
támadólepattanó-arány 18.9–32.5% (korábban minden csapatnál 100%). A
szerepkör-elemzés lánca változatlan kimenetet ad a `roleKeys`-re váltás után:
ASE 2025/2026 – 13 fős keret, 9 lefedett + 4 többszörös + 3 hiányzó
szerepkör, 38.2% top2 labdaigény, 196.8 cm, „Félpályás, játékszervező-
központú" klaszter, tempó 74.8 (21. percentilis), nettó rating +7.0 (84.);
2024/2025 – 11 + 4 + 1 szerepkör, 36.9%, 194.2 cm, „Védekezés-központú",
tempó 77.9 (61.), nettó +20.9 (95.). Mind a 30 szezon×csapat kombináció és
mind a 28 scouting-párosítás hibás mező nélkül futott. Külön mérés arra, hogy
a szerepkörök átadása mit változtat a scouting riportján: **0/28 párosításon**
tér el a kulcsemberek listája, a poszt-összehasonlítás és a győzelmi esély –
a `roleKeys` tehát helyes bemenet, de a jelenlegi adaton nem mozdít a
kimeneten. A betűkészletek `cmap` táblája ellenőrizve a nézetben előforduló
speciális jelekre (`−` `–` `·` `%` `+`): mind a 7 fájlban megvan.
`npx expo export` iOS-re és Androidra lefut; mindkét Hermes bundle
tartalmazza a „Tempó", „Támadólepattanó %" és „Az ellenfél-oldali adat"
feliratokat.

**Nyitva maradt:** **Eszközön még nem futott.** Az Áttekintés szegmens két
sorral hosszabb lett – a 11 szembeállított metrikasor görgetését valós
kijelzőn kell megítélni. A D-079 visszavonása a `pace`/`orebRate` sorra
vonatkozik; a 25 nem párosítható meccssor (adatbeviteli hiba: mindkét csapat
sora ugyanazt az eredményt írja a saját oldalára) továbbra is kimarad az
ellenfél-összegzésből. A P12 lila aktív tab-állapota továbbra is nyitva van.

**Commit:** `refactor: közös szezonadatréteg a scoutinghoz és a szerepkörökhöz`

---

## 2026-09-02 – Szerepkör-elemzés képernyő (számított elemzések, 3/3)

**Mit:** Elkészült a P12 „Számított elemzések" szekciójának harmadik sora és a
mögötte álló képernyő: a `@core/team-analysis` teljes csapatmodellje mobilon.
A hubon most mind a három navigációs sor áll (Szituációk, Ellenfél scouting,
Szerepkör-elemzés – emberek ikon, zöld, a prompt szerint). A képernyő a
szűrőben kiválasztott csapatot elemzi, szegmentált kontrollal három nézetben.

*Adat.* Új tiszta modul: `lib/team-season-stats.ts`, és rá az új
`useTeamRolesData` hook. Három lekérdezés fut, mind a kiválasztott szezonra:
(1) `games` – csapatonként meccsszám, szerzett és kapott pont, plusz a
meccsek **párosítása**; (2) a szezon `player_game_stats` táblája –
csapatösszegzéshez, meccsenként a csapathoz kötve; (3)
`player_season_stats_by_season` – a keretek játékossorai. A percentilis-mezőny
a liga összes csapatából épül (`buildTeamBenchmarks`), ezért a lekérdezés itt
sem szűkül egy csapatra (D-077 mintája). Az adat szezononként cache-elődik: a
csapat váltása nem indít új lekérdezést, csak újraszámol.

*Ellenfél-oldali adat.* A `TeamSeasonStat.opponent` blokk most **összeáll**: a
két csapatperspektíva sorait dátum + a két eredmény halmaza + tükrözött
hazai/vendég oldal párosítja (D-081). Ezzel valós a tempó, a védekező és a
nettó rating, és a védekezési stílusjegyek is előjönnek – a scouting képernyő
D-079-es korlátja ezen a képernyőn nem áll fenn.

*Szerepkörök.* Az adatbázis nem tárol szerepkört: a `@core/player-analysis`
`analyzePlayerSeason`-je vezeti le a szezonstatisztikából, a liga
játékos-percentiliseihez mérve, ahogy a webprojekt is (D-082).

*Megjelenítési modell.* Új modul: `lib/roles-view.ts` – tiszta, hálózat
nélküli fájl, ami a `TeamAnalysis`-ból kész sorokat, sávértékeket,
lábjegyzeteket és a három összegző szöveget állítja elő. A képernyő csak
elrendez.

*Szegmensek.* **Szerepkörök**: a 16 kategória három diszjunkt listában –
lefedett (1–2 emberrel), többszörösen lefedett (3-tól), hiányzó –, mindegyik
alatt a betöltő játékosokkal, végül a modell keret-értelmezése. **Terhelés**:
a két legtöbbet birtokló ember aránya, a posztonkénti játékpercek
arányjelzőkkel, az átlagmagasság és a keretkockázati jelzések. **Csapatkép**:
liga-klaszter és stílusjegyek badge-ekben, klasztertársak, a 11 liga-
percentilis sávokkal, majd erősségek, korlátok és kockázatok. Mindhárom nézet
alján lábjegyzet mondja meg, mekkora mintán áll, és egy `Megállapítás` kártya
foglalja össze a látottakat.

*Komponensek.* Egy új: `MeterList` (címke + érték + sáv + magyarázó sor). A
`PointList`, a `ProfilePanel`, az `InsightCard` és a `SegmentedControl`
változatlanul a scouting és a Szituációk képernyőről jön.

**Eltérések, hiányok:**

- A `@core` félig angol feliratai a nézetmodellben magyarra cserélődnek: a
  szerepkörkulcsok a `ROLE_LABELS_HU` szerint („Energy Big hiány" →
  „Energikus magas hiány"), a klaszternevek saját táblából („Defense-first" →
  „Védekezés-központú"), a percentilis-sorok feliratai szintén (D-084).
- A `@core` **prózájában** maradt angol szakszó („playmaking", „spot-up",
  „pick-and-roll", „rim protector", „mismatch", „self-creation") – ezeken csak
  a webprojektben lehet változtatni, a `core/` mappa nem szerkeszthető.
- A **leíró** percentilisek (tempó, dobásmegoszlás, labdaigény, magasemberes
  perc) semleges cián sávot kapnak, nem zöld/sárga/pirosat: ott a magas érték
  nem „jobb", csak másfajta játék (D-085).
- Ahol a keretadat csak generikus „G" posztot tartalmaz (2024/2025-ben az ASE
  kivételével minden csapat, 2025/2026-ban a PVSK-VEOLIA és a Szolnoki
  Olajbányász), ott a modell mindenkit ugyanabba a bucketbe sorol, és 16-ból
  csak 3–4 szerepkör jön ki. Ez adatprobléma, nem a képernyőé – a saját
  csapatunknál mindkét szezonban teljes a poszt- és magasságadat.
- A `Megállapítás` szövege itt is **sablonból** áll össze a modell számaiból,
  nem AI-ból (D-076 mintája).

**Fájlok:** `app/(tabs)/analysis/roles.tsx` (új),
`app/(tabs)/analysis/index.tsx` (harmadik navigációs sor),
`hooks/useTeamRolesData.ts` (új), `lib/team-season-stats.ts` (új),
`lib/roles-view.ts` (új), `types/roles.ts` (új),
`components/MeterList.tsx` (új)

**Tesztelve:** `npx tsc --noEmit` és `npm run lint` hibátlan. A teljes lánc
(három lekérdezés → `analyzeTeamSeason` → `buildRolesView`) élesben, a kliens
anon kulcsával lefuttatva **mind az 5 szezonra × a liga összes csapatára**:
2025/2026-ban 16, 2024/2025-ben 14 csapat, sehol `NaN`, `Infinity` vagy
`undefined` a nézetmodell egyetlen mezőjében sem, és minden csapathoz van
keret. A két üres szezon (2023/2024, 2026/2027) és a 2022/2023 (nincs
szezontáblája) az üres állapotra fut. Idők laptopról: 2025/2026 – 723
meccssor, 7402 játékos-meccssor, 275 keretsor, 1.0 s; 2024/2025 – 0.5 s. A
meccspárosítás fedettsége méréssel: 2025/2026-ban 698/723 sor, 2024/2025-ben
362/366, és minden elfogadott pár hazai/vendég oldala tükrözött (0 kivétel).
Az így kapott tempó reális (ASE 2025/2026: 74.8, 2024/2025: 77.9 birtoklás),
szemben az ellenfél-adat nélküli feleződéssel. Az ASE nézete mindkét szezonra
végigolvasva: 2025/2026 – 13 fős keret, 13 lefedett és 3 hiányzó szerepkör,
38.2% top2 labdaigény, 196.8 cm átlagmagasság, „Félpályás, játékszervező-
központú" klaszter (2/16 csapat), 48/58 meccsre van ellenfél-oldali adat;
2024/2025 – 15 fős keret, 15 lefedett és 1 hiányzó szerepkör, 194.2 cm,
„Védekezés-központú" klaszter (1/14), 26/26 párosított meccs. A csomagolt
betűkészletek `cmap` táblája újra ellenőrizve mind a 7 fájlra: az `ő`/`ű`
továbbra is hiányzik mindegyikből, a többi magyar ékezet, a `·` és a `–`
viszont mindegyikben megvan. `npx expo export` iOS-re és Androidra lefut;
mindkét Hermes bundle tartalmazza a képernyő feliratait („Szerepkör-elemzés",
„Lefedett szerepkörök", „Többszörösen lefedve", „Hiányzó szerepkörök",
„Keret-értelmezés", „Játékpercek posztonként", „Liga-percentilisek",
„Magasemberes játékperc", „Védekezés-központú", „Ki mit tesz hozzá a
csapatjátékhoz", „Nincs elemezhető keret") és a szezontáblát.

**Nyitva maradt:** **Eszközön még nem futott.** Négy dolgot valós kijelzőn kell
megítélni: (1) a „Szerepkörök" nézet hossza – lefedett + többszörös + hiányzó +
keret-értelmezés együtt 25-30 sor, sok görgetés; (2) a `MeterList` 62pt-os
értékoszlopa a leghosszabb alakkal (`100.0%`); (3) a három szegmens felirata
(„Szerepkörök" a legszélesebb) a 36pt-os kontrollban 390pt alatt, Androidon;
(4) a négynél több nevet tartalmazó sorok tördelése („+3" utótaggal).
~~Nyitva marad, hogy a **scouting** képernyő továbbra is a D-079-es korláttal
fut, pedig a D-081-es párosítás ott is használható lenne – a két hook
lekérdezése ezzel egyesíthető is volna.~~ **Elintézve** ugyanezen a napon,
lásd a fenti „A scouting és a szerepkör-elemzés közös adatrétege" bejegyzést
(D-086). Érvényben
marad a korábbi lelet: a csomagolt betűkészletekből hiányzik az `ő`/`ű`
glifa – ez itt az „Erősségek", az „Elsődleges irányító", az „Erőcsatár" és a
„Gyűrűvédő" szövegét érinti. A P12 lila aktív tab-állapota továbbra is nyitva
van.

**Commit:** `feat: Szerepkör-elemzés képernyő`

---

## 2026-09-02 – Ellenfél scouting képernyő (számított elemzések, 2/3)

**Mit:** Elkészült a P12 „Számított elemzések" szekciójának második sora és a
mögötte álló képernyő: a `@core/pregame-scouting` teljes pregame modellje
mobilon. Az Elemzés hubon most két navigációs sor áll (Szituációk, Ellenfél
scouting). A képernyő tetején ellenfélsáv, alatta szegmentált kontroll három
nézettel.

*Adat.* Új hook: `useScoutingData`. Három lekérdezés fut, mind a kiválasztott
szezonra: (1) `games` – csapatonként meccsszám, mérleg, szerzett és kapott
pont; (2) a szezon `player_game_stats` táblája – **csapatösszegzéshez**,
meccsenként a csapathoz kötve; (3) `player_season_stats_by_season` – a
keretek játékossorai (pozíció, magasság). A modell percentilis-mezőnye a liga
**összes** csapatából épül (`buildTeamBenchmarks`), ezért ez az egyetlen
képernyő, ahol a lekérdezés nem szűkül egy csapatra (D-077). A csapatösszegek
szándékosan **nem** a szezonösszesítő view-ból jönnek: abból hiányoznak a
szezon közben távozott játékosok sorai, így a csapatok 0–40%-kal alulmérnének
(D-078). Az adat szezononként cache-elődik: az ellenfél váltása nem indít új
lekérdezést, csak újraszámol.

*Megjelenítési modell.* Új modul: `lib/scouting-view.ts` – tiszta, hálózat
nélküli fájl, ami a `ScoutingReport`-ból kész sorokat, badge-feliratokat,
lábjegyzeteket és a három összegző szöveget állítja elő. A képernyő csak
elrendez.

*Szegmensek.* **Áttekintés**: szembeállított fejléc (mérleg), győzelmi esély
arányjelző sávval és bizonyosság-badge-dzsel, a két csapat stílusprofilja
badge-ekben, végül kilenc szembeállított metrikasor. **Terv**: az ellenfél
veszélyforrásai, támadható pontjai, a fókuszpontok és a „ha bekövetkezik"
forgatókönyvek válaszlépésekkel. **Kulcsemberek**: az ellenfél kulcsemberei
szerepkörönként, a legalább 80 percet játszott emberei 36 percre vetítve
(`StatMatrix`), és a poszt-összehasonlítás VAL/36-ban. Mindhárom nézet alján
lábjegyzet mondja meg, mekkora mintán áll, és egy `Megállapítás` kártya
foglalja össze a látottakat.

*Komponensek.* Öt új: `OpponentBar` (az ellenfélsáv), `OpponentSheet`
(ellenfélválasztó bottom sheet), `ChancePanel`, `ProfilePanel`, `PointList`.
A `SplitHeader`, a `SplitMetricRow`, a `StatMatrix`, az `InsightCard` és a
`SegmentedControl` változatlanul a Szituációk képernyőről jön.

**Eltérések, hiányok:**

- **Az ellenfél nem csak a következő találkozóé**: alapból a menetrend
  következő ellenfele, ennek híján a legutóbbi meccsé, de a felső sávról
  bármelyik ligacsapatra átváltható (D-080). A jelenlegi adatban a futó
  szezonhoz nincs jövőbeli forduló, e nélkül a képernyő üresen állna.
- A **tempó** és a **támadólepattanó-arány** nem látszik: mindkettőhöz az
  ellenfelek dobás- és lepattanóadata kellene, ami a csapatperspektívánként
  tárolt `games` sorokból nem áll össze megbízhatóan (D-079).
- A `Megállapítás` szövege itt is **sablonból** áll össze a modell számaiból,
  nem AI-ból (D-076 mintája).
- A `@core` mondatai `→` és `≈` jelet használnak, ami egyik csomagolt
  betűkészletben sincs meg – ezért minden átvett szöveg a `report-format`
  `plainText`-jén megy át (a `≈` → `~` pótlás most került a táblába).
- A `Fixture` típus új mezőt kapott (`opponentId`): a scouting a menetrendből
  csapat-azonosítót kér, nem nevet.

**Fájlok:** `app/(tabs)/analysis/scouting.tsx` (új),
`app/(tabs)/analysis/index.tsx` (második navigációs sor),
`hooks/useScoutingData.ts` (új), `lib/scouting-view.ts` (új),
`types/scouting.ts` (új), `components/{OpponentBar,OpponentSheet,ChancePanel,
ProfilePanel,PointList}.tsx` (mind új), `lib/report-format.ts` (`plainText`
export, `≈` pótlás), `hooks/useGameData.ts` + `types/games.ts`
(`Fixture.opponentId`)

**Tesztelve:** `npx tsc --noEmit` és `npm run lint` hibátlan. A teljes lánc
(három lekérdezés → `analyzePreGameScouting` → `buildScoutingView`) élesben, a
kliens anon kulcsával lefuttatva **mind az 5 szezonra**, az ASE **összes
ellenfelére**: 2025/2026-ban 15, 2024/2025-ben 13 párosítás, sehol `NaN`,
`Infinity` vagy `undefined`, és minden ellenfélhez van keret. A két üres
szezon (2023/2024, 2026/2027) az üres állapotra fut, a 2022/2023 pedig már a
tábla-mappingnél kiesik (nincs szezontáblája). Mennyiségek és idők laptopról:
2025/2026 – 723 meccssor, 7402 játékos-meccssor, 275 keretsor, 1.2 s; a
lekérdezés `games!inner()` alakkal szűr szezonra, üres beágyazással, tehát
nincs plusz mező a válaszban. A csapatösszegzés forrását méréssel választottuk
ki: a szezonösszesítő view az ASE 26 pályára lépett játékosából csak 13-at
tartalmaz, így a csapat pontösszege 3820 az 5211 helyett – a `games` tábla és
a meccsenkénti játékossorok viszont pontosan egyeznek (5211 = 5211). A
hiányzó glifák a betűfájlok `cmap` táblájából ellenőrizve: a `→` és a `≈`
egyik csomagolt betűkészletben sincs meg, a helyükre tett `–` és `~` viszont
mindegyikben; a kész nézetben Latin-1 fölött már csak a `−` és a `–` marad.
`npx expo export` iOS-re és Androidra lefut; mindkét Hermes bundle tartalmazza
a képernyő feliratait („Ellenfél scouting", „Győzelmi esély", „Az ellenfél
veszélyforrásai", „Támadható pontjai", „Fókuszpontok", „Ha bekövetkezik",
„Kulcsemberek", „Következő ellenfél", „Közepes bizonyosság") és a
szezontáblát.

**Nyitva maradt:** **Eszközön még nem futott.** Négy dolgot valós kijelzőn kell
megítélni: (1) a 2.4 MB-os szezonlekérdezés érzete mobilhálózaton – első
megnyitáskor a skeleton alatt fut, utána cache-ből jön; (2) a hosszú
ligacsapatnevek az ellenfélsávban és a szembeállított fejlécben („Falco-Vulcano
Energia KC Szombathely" egy sorra vágva); (3) a `ProfilePanel` badge-einek
tördelése 390pt alatt, amikor öt stílusjegy is van; (4) a 16 soros
ellenfélválasztó sheet görgetése Androidon, a hardveres back gombbal együtt.
Érvényben marad a korábbi lelet: a csomagolt betűkészletekből hiányzik az
`ő`/`ű` glifa – ez itt a „Következő ellenfél", az „Erőcsatár" és a
„veszélyforrások" szövegét érinti. A P12 lila aktív tab-állapota továbbra is
nyitva van.

**Commit:** `feat: Ellenfél scouting képernyő`

---

## 2026-09-02 – Szituációk képernyő (számított elemzések, 1/3)

**Mit:** Elkészült a P12 „Számított elemzések" szekciójának első sora és a
mögötte álló P13 képernyő. Az Elemzés hub tetején most a szekciócímke és egy
navigációs sor áll (célkereszt ikon, cián), ami a Szituációk képernyőt nyitja.
A képernyő szegmentált kontrollal három nézetet vált.

*Adat.* Új hook: `useSituationalData`. A számítást a
`@core/situational-analysis` `buildSituationalData`-ja végzi, ugyanazokkal a
bemenetekkel, mint a webes `SituationalAnalysis`. Két eltérés, mindkettő
mobil-indok: a negyed- és metrikatábla a csapat `kosarstat_game_id`-jaira
szűr, nem a szezonra (D-070), és a P13 nyolc metrikasorához a szezon
`player_game_stats` táblája adja a dobás-, lepattanó-, assziszt- és
labdaadatot (D-071). A lekérdezés két körben fut: előbb a `games`, mert a
kosarstat-azonosítók csak abból derülnek ki.

*Megjelenítési modell.* Új modul: `lib/situational-view.ts` – tiszta, hálózat
nélküli fájl, ami a kész sorokat (formázott értékekkel), a lábjegyzeteket és
a három összegző szöveget állítja elő. A képernyő csak elrendez.

*Szegmensek.* **Hazai / vendég**: összehasonlító fejléc (meccsszám + mérleg,
cián és narancs sávval) és nyolc szembeállított metrikasor a mockup szerint.
**Helyzetek**: szoros, kiütéses, félidei vezetés/hátrány, N1 nyert/vesztett
mérlege arányjelző sávval, alatta a four factors + támadó rating.
**Negyedek**: a négy negyed szerzett/kapott/különbség/mérleg bontása
`StatMatrix`-ben. Mindhárom nézet alján lábjegyzet mondja meg, hány meccs
adatán áll, és egy `Megállapítás` kártya foglalja össze a látottakat.

*Komponensek.* Öt új: `SegmentedControl` (a P5/P7/P13 prompt sávja, eddig nem
volt megépítve), `SplitHeader`, `SplitMetricRow`, `SituationPanel`,
`InsightCard`, plusz a hub navigációs sorához `NavRow`.

**Eltérések, hiányok:**

- A P13 **két** szegmenst ír elő, itt **három** van (D-072) – különben a
  `@core` modul fele (helyzetek, negyedek, four factors) kihasználatlan
  maradna, a feladatlista sora viszont kéri őket.
- A helyzetek feliratai **nem** a `@core` `label` mezőjéből jönnek: azok `≤` és
  `≥` jelet használnak, ami egyik csomagolt betűkészletben sincs meg (D-075).
- A jobb érték „glow"-ja réteg (accent keret + kitöltés), nem elmosott árnyék
  (D-005, D-074).
- A `Megállapítás` szövege **sablonból** áll össze a kiszámolt számokból, nem
  AI-ból (D-076) – a mobil app továbbra sem generál tartalmat.
- A hub szekciójában egyelőre **egy** sor áll: a scouting és a szerepkör-
  elemzés a saját feladatában kerül be, halott gomb nélkül (D-073).
- Negyedadat nélküli szezonban (pl. 2024/2025) a félidei és N1-es sorok, a
  negyedbontás és a four factors kimarad; a hiányt a lábjegyzet mondja ki
  (D-047 mintája).

**Fájlok:** `app/(tabs)/analysis/situational.tsx` (új),
`app/(tabs)/analysis/index.tsx` (szekció + navigációs sor),
`hooks/useSituationalData.ts` (új), `lib/situational-view.ts` (új),
`types/situational.ts` (új), `components/{SegmentedControl,SplitHeader,
SplitMetricRow,SituationPanel,InsightCard,NavRow}.tsx` (mind új)

**Tesztelve:** `npx tsc --noEmit` és `npm run lint` hibátlan. A teljes lánc
(lekérdezés → `buildSituationalData` → `buildSituationalView`) élesben, a
kliens anon kulcsával lefuttatva **mind az 5 szezonra × 2 csapatra**: sehol
`NaN` vagy `Infinity`, és a szezonspecifikus stat-tábla mindenhol válaszol.
2025/2026, ASE: 58 meccs, ebből 25-nek van kosarstat-azonosítója; hazai 24GY-5V
és vendég 16GY-13V; a nyolc metrikasor 95.2/84.4 · 82.1/79.4 · +13.2/+5.0 ·
52.4/46.6 · 38.1/35.0 · 33.0/36.1 · 22.1/18.4 · 10.7/11.9. A pontátlag a
`games` táblából és a `player_game_stats` összegzéséből **azonos** (95.2 /
84.4), tehát a két forrás konzisztens. A `.in()` szűrés méréssel is indokolt:
szezonra szűrve 1000+ negyedstat sor (levágva a PostgREST limitnél) és 470
metrikasor jön, a csapat 25 azonosítójára 200 és 50. A hiányzó glifák a
betűfájlok `cmap` táblájából ellenőrizve: a `≤` és `≥` egyik csomagolt
betűkészletben sincs meg (ezért a szöveges feliratok), a `−` `–` `·` `%`
viszont mindegyikben. `npx expo export` iOS-re és Androidra lefut; mindkét
Hermes bundle tartalmazza a képernyő feliratait („Szituációk", „Hazai /
vendég", „Számított elemzések", „Megállapítás", „Four factors", „Támadó
rating", „Kiütéses meccs (15p-től)", „Nincs elemezhető meccs") és a két
kosarstat táblanevet.

**Nyitva maradt:** **Eszközön még nem futott.** Négy dolgot valós kijelzőn kell
megítélni: (1) a 88pt-os értékdobozban a 22pt-os mono szám a leghosszabb
alakkal (`+13.2`) elfér-e ékezet nélkül is; (2) a szembeállított sávok
olvashatósága, amikor a két oldal majdnem egyforma (kapott pont: 1.00 vs 0.97);
(3) a 36pt-os szegmentált kontroll három szegmenssel Androidon – a „Hazai /
vendég" felirat a legszélesebb; (4) a `StatMatrix` négy negyedsora vízszintes
görgetés nélkül elfér-e 390pt alatt. Érvényben marad a korábbi lelet: a
csomagolt betűkészletekből hiányzik az `ő`/`ű` glifa – ez itt a „Félidőben
vezetett", a „Kiütéses meccs" és a „legerősebb negyed" szöveget érinti.
A P12 lila aktív tab-állapota továbbra is nyitva van.

**Commit:** `feat: Szituációk képernyő`

---

## 2026-09-02 – Elemzés hub és riportolvasó

**Mit:** Elkészült az S6 hetedik képernyője és a hozzá tartozó olvasónézet: az
`Elemzés` tab helyőrzője helyén most a mentett AI riportok listája áll, egy
kártyáról pedig megnyílik a riport teljes szövege.

*Adat.* Új hook: `useAnalysisReports`. A három riporttábla (`game_text_reports`,
`team_text_reports`, `player_text_reports`) párhuzamosan, közvetlen SELECT-tel
töltődik, és **egyetlen** listába fésülődik össze, generálási idő szerint
csökkenő sorrendben. A meccsriportokon nincs `season_id` / `team_id` oszlop,
ezért ott a beágyazott `games!inner` sor szűr – a lista így nem függ attól,
hogy a Meccsek tab betöltött-e már. Az olvasó **nem** kér új adatot: a riportot
azonosító szerint a hub cache-éből veszi elő (D-046 mintája).

*Szövegformázás.* A riportok nyers szövege markdown félkövér jelölést
(`**...**`) és a csomagolt betűkészletekből **hiányzó** jeleket tartalmaz. Új
modul: `lib/report-format.ts` – blokkokra bontja a szöveget (szekciócím,
megállapítás, indoklás, bekezdés), a `✓` / `↺` / `✗` sorkezdő jelekből lucide
ikonos megállapítás lesz (D-064), a `1️⃣` billentyű-szekvenciából `1.`.
Ugyanez a modul adja a kártyák egysoros összefoglalóját is.

*Komponensek.* Kettő új: `ReportListCard` (88pt-os kártya bal 3pt lila sávval:
badge + dátum, cím, első mondat) és `ReportBody` (a riport törzse, bal szélén
elhalványuló lila gradiens sávval, `expo-linear-gradient`-tel).

**Eltérések, hiányok:**

- A P12 **„Számított elemzések" szekciója még nincs benne** (D-066): külön
  feladat, hogy ne álljon a hubon olyan navigációs sor, ami sehová nem vezet.
- A listán **fajta szerinti szűrő-chipek** vannak, amit a P12 nem ír elő
  (D-067) – 35 riport egy szűretlen görgetésben nem kezelhető.
- A meccsriportok címe a csapatok **rövid nevével** áll
  (`Atomerőmű — Kaposvár`), a D-058 tabellás döntés mintájára.
- A kártyán a **generálás** dátuma áll (ahogy a P12 is írja); a meccs dátuma
  és eredménye az olvasó meta sorába került.
- A szekciócím felismerése heurisztika (D-065): a csapatriportok nem jelölik
  a címeket, csak a sor hossza és a záró írásjel különbözteti meg őket.
- Szezonszintű **clutch nézet nincs** (D-069); a `parseGameClutch` a Meccs
  részletein a helye, külön feladatként.
- A `ReportCard` (meccs- és játékosképernyő) mostantól szintén a
  `plainReport`-on átengedett szöveget mutatja – így ott sem látszik a `**`
  jelölés és a tofu.

**Fájlok:** `app/(tabs)/analysis/index.tsx` (helyőrző helyett a képernyő),
`app/(tabs)/analysis/[id].tsx` (új), `hooks/useAnalysisReports.ts` (új),
`lib/report-format.ts` (új), `components/{ReportListCard,ReportBody}.tsx`
(mind új), `components/ReportCard.tsx` (normalizált szöveg),
`data/report-kinds.ts` (új), `types/analysis.ts` (új)

**Tesztelve:** `npx tsc --noEmit` és `npm run lint` hibátlan. A blokkbontó a
**mind a 35 valós riporton** lefuttatva: 138 szekciócím, 213 bekezdés, 79
megállapítás, 65 indoklás; üres összefoglaló egy riportnál sincs, a leghosszabb
cím 44 karakter. A három lekérdezés élesben, a kliens anon kulcsával
ellenőrizve (2025/2026, ASE): 24 meccs- + 4 csapat- + 7 játékosriport = 35 sor,
a beágyazott `games!inner` és `players!inner` szűrés működik. A hiányzó glifák
a betűfájlok `cmap` táblájából ellenőrizve: a `→` `✓` `✗` `↺` `U+FE0F` `U+20E3`
egyik csomagolt betűkészletben sincs meg, a helyükre tett `–` `+` `−` `±`
viszont mindegyikben. `npx expo export` iOS-re és Androidra lefut; mindkét
Hermes bundle tartalmazza a képernyők feliratait („AI riportok", „Riport
fajtája", „Nincs mentett riport", „Nincs meg a riport", „Generálva:",
„Szurkolói", „szezonértékelés", „AI-elemzője") és az `ExpoLinearGradient`
hivatkozást.

**Nyitva maradt:** **Eszközön még nem futott.** Négy dolgot valós kijelzőn kell
megítélni: (1) a 2pt-os elhalványuló gradiens sáv láthatósága a hosszú
szövegtörzs mellett; (2) a 88pt-os kártya három sora a leghosszabb címekkel
(44 karakter, egy sorra vágva); (3) a 35 kártyás lista görgetésének
folyamatossága Androidon; (4) a megállapítás-ikonok (`Check` / `RotateCcw` /
`X`) igazodása a 15pt-os szöveg első sorához. Érvényben marad a korábbi lelet:
a csomagolt betűkészletekből hiányzik az `ő`/`ű` glifa – ez itt az
„Atomerőmű", a „Szurkolói"→„Edzői" badge és a riportszövegek nagy részét
érinti. Nyitva van még a P12 lila aktív tab-állapota: a `TabBar` minden tabot
ciánnal jelöl, a tab layout véglegesítése külön sor a listában.

**Commit:** `feat: Elemzés hub és riportolvasó`

---

## 2026-09-02 – Tabella képernyő

**Mit:** Elkészült az S6 hatodik képernyője: a `Tabella` tab helyőrzője helyén
most a bajnoki állás áll a `tabella` mockup szerint – cím + alcím, ragadós
oszlopfejléc, 14 csapatsor, végül a frissítés dátuma és a fordulószám.

*Adat.* Új hook: `useStandings`. A `standings` tábla soronként egy teljes
tabellaállást tárol JSON tömbben; a hook a szezon **legmagasabb fordulószámú**
sorát kéri (`order=matchday.desc,date.desc&limit=1`), ahogy a webes
`StandingsView` is. A cache kulcsa **csak a szezon**, mert a tabella nem
csapatfüggő – csapatváltáskor nincs új lekérdezés, csak a kiemelt sor változik.
A csapatnevek, a rövid nevek és a kiemelés a szűrő csapatlistájából jönnek.

*Komponens.* Egy új: `StandingsRow` + `StandingsRowHeader` – a mockup nyolc
oszlopos rácsa (28/26/1fr/22/22/18/36/24, 8pt köz, 56pt sormagasság). A
`StatMatrix` itt nem jó: annak vízszintes görgetése és fagyasztott oszlopa van,
a tabella viszont elfér a képernyő szélességében. A ragadós oszlopfejléc a
`ScrollView` `stickyHeaderIndices`-ével készült.

**Eltérések, hiányok:**

- A lábléc a mockup dátuma **mellett a fordulószámot** is kiírja (D-062,
  engedéllyel): „Frissítve: 2026. április 25. · 26. forduló".
- A csapatnév a **rövid néven** áll (`Falco`, `Kaposvár`), nem a teljes néven
  (D-058): a névoszlopra ~126pt marad, a `Falco-Vulcano Energia KC Szombathely`
  ott csak levágva férne el.
- A badge jele a rövid név három betűje ékezet nélkül (`Körmend` → `KOR`), az
  `Atomerőmű SE` kivétel: `ASE`, ahogy a mockup is írja (D-059).
- A kiemelt sor **teljes szélességű** (D-063), hogy a bal oldali cián sáv a
  kijelző széléig érjen; az elválasztó vonal viszont behúzva marad.
- A legfrissebb tabellasorban minden csapat **kétszer** szerepel az importból –
  a hook helyezésenként az elsőt tartja meg (D-057).
- A `season_id` nélküli régi tabellasorok **nem** jelennek meg (D-060), így a
  2025/2026-on kívüli szezonokra üres állapot jön.

**Fájlok:** `app/(tabs)/standings.tsx` (helyőrző helyett a képernyő),
`hooks/useStandings.ts` (új), `components/StandingsRow.tsx` (új),
`types/standings.ts` (új), `lib/format.ts` (`teamAbbreviation`),
`constants/theme.ts` + `tailwind.config.ts` (`border.rowDeep`)

**Tesztelve:** `npx tsc --noEmit` és `npm run lint` hibátlan. Az adat élesben,
a kliens anon kulcsával ellenőrizve: a 2025/2026-os szezon legfrissebb sora a
26. forduló (2026-04-25), 28 nyers elemből a deduplikálás után 14 sor lesz,
mind a 14 csapat megvan a `teams` táblában (tehát nincs tartaléknév), és a
számoszlopok a legszélesebb esetben is beférnek (`−332`, `+379` a 36pt-os
`+/-` oszlopba). `npx expo export` iOS-re és Androidra lefut; mindkét Hermes
bundle tartalmazza a képernyő feliratait („Nincs tabella", „NB I/A", „Csapat",
„Frissítve", „forduló", „A tabella betöltése sikertelen").

**Nyitva maradt:** **Eszközön még nem futott.** Három dolgot valós kijelzőn
kell megítélni: (1) a ragadós oszlopfejléc viselkedése Androidon (a
`stickyHeaderIndices` ott a `ScrollView` saját implementációja); (2) a 26pt-os
badge-ben a három betű Barlow Condensed Bold 11pt-tal középre esik-e; (3) a
teljes szélességű kiemelt sor a mockup behúzott hátteréhez képest. Érvényben
marad a korábbi lelet: a csomagolt betűkészletekből hiányzik az `ő`/`ű` glifa –
ez itt az `Atomerőmű` sort érinti. Nyitva van még, hogy csak a 2025/2026-os
szezonhoz van tabella az adatbázisban; a többi szezon üres állapotot mutat.

**Commit:** `feat: Tabella képernyő`

---

## 2026-09-02 – Arányjelző sáv gradienssel (`expo-linear-gradient`)

**Mit:** A `ProgressBar` kitöltése a mockup szerinti, balról jobbra futó
gradienst kapta a tömör szín helyett – ehhez az `expo-linear-gradient`
bekerült a függőségek közé (engedéllyel, D-056). A D-055 döntés ezzel
**felülírva**.

*Színek.* A cián sáv a mockup két pontos értékét használja (`shade.cyanDeep` →
`accent.cyan`), tehát a `p0-style-tile` „Egyéb elemek" sávja most karakterre
egyezik. A többi hangnemhez (positive / orange / ai) a mockup nem ad sötét
véget, ezért ott a gradiens az accent szín 55%-os alakjából fut a tömörbe –
nyolcjegyű hexszel, a meglévő token értékéhez fűzött alfa csatornával, **új
színtoken nélkül**. A mockup külső glow-ja továbbra is elmarad (D-005).

**Fájlok:** `components/ProgressBar.tsx`, `package.json` +
`package-lock.json` (`expo-linear-gradient` ~57.0.1)

**Tesztelve:** `npx tsc --noEmit` és `npm run lint` hibátlan. `npx expo export`
iOS-re és Androidra lefut; mindkét Hermes bundle tartalmazza az
`ExpoLinearGradient` natív modul hivatkozását és a `#0096B8` gradiensvéget.

**Nyitva maradt:** A gradiens **natív modul**: Expo Go-ban benne van, saját dev
clienttel viszont újra kell buildelni, különben a sáv nem rajzolódik ki. A négy
dobászóna sávja eszközön még nem futott – a 6pt-os magasságon az átmenet
láthatósága valós kijelzőn ítélhető meg. A `CLAUDE.md` tech stack felsorolása
még nem említi az új csomagot; ha kéred, felveszem oda is.

**Commit:** `setup: expo-linear-gradient és gradiens arányjelző sáv`

---

## 2026-09-02 – Játékos részletei képernyő

**Mit:** Elkészült az S6 ötödik képernyője: a `players/[id]` helyőrző helyén
most a játékos teljes szezonja áll – profilkártya, négy átlag-KPI, dobási
bontás, további mutatók, meccsenkénti mátrix és a mentett riportok.

*Adat.* Új hook: `usePlayerDetails`. A szezonösszesítés **nem** új lekérdezés,
a `usePlayerData` cache-éből jön (D-046), így a listáról ide lépve a fejléc
azonnal kirajzolódik. A meccsenkénti bontás viszont önálló lekérdezés a
szezonspecifikus `player_game_stats_*` tábláról, beágyazott `games` sorral –
a szűrés is ott történik (`games.season_id`, `games.our_team_id`), tehát a
képernyő nem függ attól, hogy a Meccsek tab betöltött-e már (D-052). A
riportok a `player_text_reports`-ból jönnek, játékosra és szezonra szűrve
(D-054). Mindkettő szűrőpár + játékos kulcson cache-elődik.

*Komponensek.* Öt új: `PlayerProfileCard` (mezszám-kör, teljes név,
pozíció/kor/testadat, három keretszám), `ShootingPanel` (négy dobászóna
találat/kísérlet + százalék + arányjelző sáv), `ProgressBar` (a `p0-style-tile`
mockup 6pt-os sávja), `StatList` (címke–érték sorok kártyán, a webes „További
Statisztikák" párja) és `PlayerGameLog` (a `BoxScore`-ral azonos oszlopú
mátrix, fagyasztott ellenfél-oszloppal). A `ReportCard` mostantól a
játékosriportot is megjeleníti, `Szezonelemzés` felirattal.

**Eltérések, hiányok:**

- A meccsbontás **alapból 10 meccset** mutat, a többit gomb nyitja (D-053):
  egy szezon 50 sora × 13 cella egyszerre kirajzolva feleslegesen lassítja az
  első megjelenést.
- Az arányjelző sáv a mockup cián **gradiense helyett tömör** accent színnel
  fut (D-055) – a gradienshez `expo-linear-gradient` kellene.
- A mátrixban a **dátum színe** hordozza az eredményt (zöld/piros); mivel a
  szín önmagában nem elég, a jelmagyarázat ki is írja.
- Az ellenfél a csapatlista **rövid nevével** áll (`Kaposvár`), a `games`
  tábla teljes nevével csak akkor, ha a rövid nem található.
- A „További mutatók" `Ponthatékonyság` és `Védekezési index` sora a
  `usePlayerData` saját képlete, **nem** NBA ORtg/DRtg – a felirat ezt mondja.

**Fájlok:** `app/(tabs)/players/[id].tsx` (helyőrző helyett a képernyő),
`hooks/usePlayerDetails.ts` (új), `components/{PlayerProfileCard,ShootingPanel,
ProgressBar,StatList,PlayerGameLog}.tsx` (mind új), `components/ReportCard.tsx`
(uniós riporttípus), `types/players.ts` (`PlayerGameRow`, `PlayerReport`)

**Tesztelve:** `npx tsc --noEmit` és `npm run lint` hibátlan. A két lekérdezés
élesben, a kliens anon kulcsával ellenőrizve: a beágyazott `games!inner` szűrés
működik (BENKE Szilárd, 2025/2026, ASE → 50 sor, ebből 0 perces nincs; a
csapat egészében 5 db 0 perces sor van, ezeket a bontás kiszűri), a
`player_text_reports` az ASE keretéből 8 játékosnak ad `season` típusú
riportot. `npx expo export` iOS-re és Androidra lefut; **mindkét** Hermes
bundle tartalmazza a képernyő feliratait („Meccsenkénti bontás", „További
mutatók", „Ponthatékonyság", „Kiharcolt szabálytalanság / meccs",
„Szezonelemzés", „Nincs meg a játékos", „Ellenfél", „Középtávoli").

**Nyitva maradt:** **Eszközön még nem futott.** Négy dolgot valós kijelzőn kell
megítélni: (1) a 13 oszlopos mátrix vízszintes görgetése a 120pt-os fagyasztott
oszloppal; (2) a profilkártya kétsoros neve a leghosszabb neveknél
(`Gatling Shane Justin Stoney`); (3) a „További 40 meccs" gomb utáni
újrarajzolás sebessége Androidon; (4) a 12 soros `StatList` hosszú címkéi
(`Kiharcolt szabálytalanság / meccs`) egy sorban maradnak-e. Érvényben marad a
korábbi lelet: a csomagolt betűkészletekből hiányzik az `ő`/`ű` glifa – ez a
képernyőn a „Büntető" és az „Effektív mezőny (eFG%)" feliratot érinti.

**Commit:** `feat: Játékos részletei képernyő`

---

## 2026-09-02 – Játékosok lista képernyő

**Mit:** Elkészült az S6 negyedik képernyője: a `Játékosok` tab helyőrzője
helyén most a szezon-aggregált keret áll, a `Jatekosok Lista` mockup szerint –
cím + létszám, névkereső, öt rendezés-chip, oszlopfejléc, majd a játékossorok.

*Adat.* Új lekérdezés **nincs**: a meglévő `usePlayerData` szűrőpáronkénti
cache-e adja a listát, a keresés és a rendezés kliensoldali (egy csapat egy
szezonban ~15 sor). A `usePlayerData` alapból pontátlag szerint rendez, a chip
ezt írja felül.

*Keresés.* Új `lib/search.ts`: kis-nagybetű és **ékezet nélküli** összevetés
(„vojvoda" megtalálja a „VOJVODA D."-t), a magyar ékezetek kézzel leképezve –
a `normalize('NFD')` a Hermes eltérő ICU-támogatása miatt nem megbízható,
ugyanaz a megfontolás, mint a dátumformázásnál (D-039).

*Komponensek.* Három új, mind a mockupból: `SearchField` (44pt-os mező bal
oldali nagyítóval), `ChipRow` (vízszintesen görgethető chipsor, aktív elem
cián glow réteggel és lefelé mutató ikonnal) és `PlayerRow` (a `StackedRow`-ra
épülő sor, mezszám-körrel és három átlagoszloppal). Az oszlopfejléc a meglévő
`StackedRowHeader` – ez az első éles használata. A rendezési szempontok
katalógusa a `data/player-sorts.ts`-ben él, chip- és oszlopfelirattal együtt.

*Navigáció.* A sor a `players/[id]` útvonalra lép, ami egyelőre `PlaceholderScreen`
– a játékos részletei a következő feladat.

**Eltérések, hiányok:**

- A **harmadik oszlop követi a rendezést**: `PERC` vagy `HATÉKONYSÁG` chipnél az
  `APG` helyére az a szám lép, ami szerint a sorrend áll (D-050). A mockup
  mindig PPG / RPG / APG-t mutat, akkor is, ha a rendezés láthatatlan érték
  szerint történik.
- A **név rövidítve** áll a sorban (`EILINGSFELD J.`), ahogy a box score-ban
  (D-051): a mockup 48pt-os számoszlopai mellett ~94pt marad a névnek, a valódi
  keretben pedig 27 karakteres nevek is vannak.
- A keresés a **teljes névre** illik, nem csak a rövidített alakra, tehát a
  keresztnévvel is megtalálható a játékos.
- Az adatbázisban néhány név hibás kisbetűvel jött be az importból
  (`SEPPäLä`, `MESZLéNYI`); ezt a mobil app nem javítja, mert csak olvas.

**Fájlok:** `app/(tabs)/players/index.tsx` (helyőrző helyett a képernyő),
`app/(tabs)/players/[id].tsx` (új helyőrző), `components/{SearchField,ChipRow,PlayerRow}.tsx`
(mind új), `data/player-sorts.ts` (új), `lib/search.ts` (új)

**Tesztelve:** `npx tsc --noEmit` és `npm run lint` hibátlan. Az adat élesben,
a kliens anon kulcsával ellenőrizve: a `player_season_stats_by_season` a
2025/2026-os keretre 14 sort ad, a `total_minutes` egész perc (átlag 24–32),
az `avg_valuation` már meccsátlag – tehát a formázás egy tizedesre helyes.
`npx expo export` iOS-re és Androidra lefut; **mindkét** Hermes bundle
tartalmazza a képernyő feliratait (ékezetesekre UTF-16-ban is keresve):
„Játékos keresése", „Rendezés", „Lepattanó", „Assziszt", „Hatékonyság",
„Nincs találat", „Nincs játékos", „PPG".

**Nyitva maradt:** **Eszközön még nem futott.** Három dolgot valós kijelzőn
kell megítélni: (1) a leghosszabb rövidített nevek (`EILINGSFELD J.`,
14 karakter) beleférnek-e a ~94pt-os névsávba, vagy levágódnak; (2) a
billentyűzet nyitva marad-e a chipek koppintásakor
(`keyboardShouldPersistTaps="handled"` van beállítva); (3) a chipsor vízszintes
görgetése az ötödik chipig. Érvényben marad a korábbi lelet is: a csomagolt
betűkészletekből hiányzik az `ő`/`ű` glifa – ez a képernyőn a szűrő-chip
csapatnevét érinti, a saját feliratai mind elkerülik ezt a két betűt.

**Commit:** `feat: Játékosok lista képernyő`

---

## 2026-09-02 – Meccs részletei képernyő

**Mit:** Elkészült az S6 harmadik képernyője: a meccslistából megnyitott
`games/[id]` helyőrző helyén most a meccs teljes képe áll – végeredmény,
negyedenkénti bontás, box score és a mentett AI riportok.

*Adat.* Új `hooks/useGameDetails.ts`. Maga a meccs sora (ellenfél, dátum,
eredmény, forduló) **nem** külön lekérdezés: a `useGameData` szűrőpáronkénti
cache-éből jön, amit a lista már letöltött – a részletek fejléce ezért azonnal
kirajzolódik (D-046). Három saját lekérdezés fut, lapozás nélkül (egy meccshez
legfeljebb néhány tucat sor tartozik): a szezonspecifikus statisztikatáblából
(`@core/season-tables` `getSeasonStatsTable()`) a játékossorok
`players!inner(name, number)` beágyazással, a `game_text_reports` riportjai, és
– ha a meccsnek van `kosarstat_game_id`-ja – a `kosarstat_game_quarter_stats`
negyedei. A `useGameData` `select`-je ezért egy oszloppal bővült
(`kosarstat_game_id`), és a `TeamGame` egy mezővel (`kosarstatGameId`).

*Képernyő.* `app/(tabs)/games/[id].tsx`: visszalépés sáv, eredménykártya, majd
három szekció (`Negyedek`, `Box score`, `Elemzés`). A részletképernyő nem az
`AppHeader`-t viseli – a szűrő-chip átállítása kiléptetné a felhasználót az
éppen nézett meccs alól –, helyette az új `components/BackHeader.tsx` áll a
tetején (D-046). Ha a meccs nincs a kiválasztott szűrőben, `EmptyState`
magyaráz.

*Komponensek.* `GameScoreCard` (a `LastGameCard` felépítése nagyobb, 40pt-os
pontszámmal és `xl` sarokkal), `QuarterScores` és `BoxScore` (mindkettő a
meglévő `StatMatrix`-ra épül – ez a mátrix első éles használata), valamint
`ReportCard` (`GlowCard accent="ai"`, nyolc sorra csukva, „Teljes riport"
gombbal – D-049). A `lib/format.ts` új `shortenPlayerName()`-je adja a mátrix
fagyasztott oszlopát (`EDWIN Deon Javern` → `EDWIN D.`), ahogy a
`p0-style-tile` mockup mátrixa mutatja (`Kovács P.`).

**Eltérések, hiányok:**

- **Mockup ehhez a képernyőhöz nincs**; a kártya a `ma-screen` „Legutóbb"
  blokkját, a két mátrix a `p0-style-tile` „StatMatrix minta" blokkját követi.
- A **plusz-mínusz oszlop kimarad**: az adatbázisban gyakorlatilag mindenhol
  nulla (7402 sorból 5 nem az) – D-048.
- A **negyedenkénti bontás ritka**: a 2025/2026-os szezon 35 meccséhez van
  kosarstat import, a többinél a szekció magyarázó sort mutat, nem tűnik el
  (D-047).
- A riport **dátuma a `generated_at` UTC napja**; késő esti generálásnál ez
  egy nappal korábbi napot írhat ki, mint a helyi idő. A riportkártyán ez
  tájékoztató adat, ezért nem építettünk hozzá időzóna-kezelést.
- A box score-ból **kimaradnak a 0 percet játszó sorok** (csupa nulla lenne),
  és a mátrix a webes rövidítéseket használja (LP / GP / LS / BD / LV / SZ /
  Ért) jelmagyarázattal, hogy a stáb a két felületen ugyanazt olvassa.

**Fájlok:** `app/(tabs)/games/[id].tsx` (helyőrző helyett a képernyő),
`hooks/useGameDetails.ts`, `components/{BackHeader,GameScoreCard,QuarterScores,BoxScore,ReportCard}.tsx`
(mind új), `types/games.ts` (`kosarstatGameId` + 4 új típus),
`hooks/useGameData.ts` (egy oszloppal bővült `select`), `lib/format.ts`
(`shortenPlayerName`)

**Tesztelve:** `npm run typecheck` és `npm run lint` hibátlan. A három
lekérdezés élesben, a **kliens anon kulcsával** (REST) is lefut: box score
beágyazott `players` sorral, negyedek `team_side` szerint, riport a
`game_text_reports`-ból – az RLS mindhármat engedi. `npx expo export` iOS-re és
Androidra lefut; **mindkét** Hermes bundle tartalmazza a képernyő feliratait
(ékezetesekre UTF-16-ban is keresve): „Végeredmény", „Negyedek", „Box score",
„Elemzés", „Teljes riport", „Összecsukás", a négy riporttípus feliratát, a
három üres-állapot mondatot és a jelmagyarázatot.

**Nyitva maradt:** **Eszközön még nem futott.** A két mátrix vízszintes
görgetése, a 12 oszlopos box score olvashatósága és a hosszú riportszöveg
nyitása valós kijelzőn ítélhető meg. A negyedek mátrixának fagyasztott oszlopa
108pt: a hosszú ellenfélnevek (`Kometa-KVGY Kaposvári KK`) ott levágódnak.
**Fontos, a képernyőn túlmutató lelet:** a becsomagolt hét betűkészlet
egyikében sincs meg az `ő`/`Ő` és az `ű`/`Ű` glifa (a cmap Latin-1-ig tart,
a Latin Extended-A hiányzik), tehát az „Atomerőmű SE" csapatnév és a
„Következő meccs" / „Közelgő" feliratok legalább Androidon tofuként
jelenhetnek meg. A subsetek cseréje külön feladat, engedéllyel.

**Commit:** `feat: Meccs részletei képernyő`

---

## 2026-09-02 – Meccsek lista képernyő

**Mit:** Elkészült az S6 második képernyője: a `Meccsek` tab helyőrzője helyén
most a szezon teljes menetrendje áll, két szekcióban – felül a **Közelgő**
találkozók, alatta a **Lejátszott** meccsek (dátum szerint csökkenő, a
legfrissebb elöl). Az adat a meglévő `useGameData`-ból jön, plusz lekérdezés
nélkül: a Ma képernyő ugyanezt a szűrőpáronkénti cache-t használja, tehát a
tabváltás hálózati kör nélkül vált.

*Sorok.* Új `components/GameRow.tsx` két exporttal (`GameRow`, `FixtureRow`).
Mindkettő a meglévő `StackedRow`-ra épül: bal oldalt a vezérjel-körben a
hazai/vendég jelzés (`H` / `V`), középen az ellenfél neve, alatta a dátum,
jobbra a mono érték – lejátszott meccsnél az eredmény (`82–75`, nyert: zöld,
vesztett: piros), közelgőnél a nap pontosságú visszaszámláló (`7 NAP`,
elhalasztott meccsnél sárga). A két szekció oszlopszélessége közös (84pt), így
a számok egy vonalban állnak. A közelgő sor nem nyomható – részletei csak
lejátszott meccsnek vannak.

*Szekciócímke.* Új `components/SectionLabel.tsx` – Barlow Condensed 11pt ALL
CAPS, `accessibilityRole="header"`. A `FormStrip` eyebrow feliratának
tipográfiája, csak külön komponensként, mert innentől több képernyőn kell.

*Visszaszámláló.* A `NextGameCard` lokális `countdown()`-ja átkerült a
`lib/format.ts`-be `formatCountdown()` néven, mert most a `FixtureRow` is
ugyanezt írja ki. A viselkedés változatlan (`MA` / `HOLNAP` / `7 NAP` / `—`).

**Eltérések, hiányok:**

- **Mockup ehhez a képernyőhöz nincs** – a felépítés a `Jatekosok Lista`
  mockup listaképernyőjét másolja (fejléc, cím + jobbra igazított mono
  darabszám, 68pt-os surface1 sorok 8pt réssel, 16pt oldalmargó).
- A **fordulószám** nem fér ki a sorba a dátum és az eredmény mellé, ezért
  kimarad (D-045).
- **Kereső és rendezés-chipek nincsenek**, pedig a játékoslista mockupján ott
  vannak: egy szezon meccsei időrendben állnak, és egy képernyőnyi görgetéssel
  átnézhetők.
- **Lehúzásos frissítés még nincs** (a D-026 ígéri): a `useCachedQuery` ma nem
  ad `refreshing` jelzést, mert a `reload()` alatt a `loading` végig hamis
  marad (a régi adat látszik). Ez egy külön, minden képernyőt érintő lépés.

**Fájlok:** `app/(tabs)/games/index.tsx` (helyőrző helyett a képernyő),
`components/GameRow.tsx`, `components/SectionLabel.tsx` (mindkettő új),
`components/NextGameCard.tsx` (a közös `formatCountdown`-ra állt át),
`lib/format.ts` (`formatCountdown`)

**Tesztelve:** `npm run typecheck` és `npm run lint` hibátlan. `npx expo
export` iOS-re és Androidra lefut; **mindkét** Hermes bundle tartalmazza a
képernyő feliratait (ékezetesekre UTF-16-ban is keresve): „Közelgő",
„Lejátszott", „Nincs meccs", „Nyert", „Vesztett", „Elhalasztva", „HOLNAP", a
darabszám „ meccs" utótagját és az eredményt elválasztó nagykötőjelet.
Ellenőriztem a becsomagolt betűkészletek `cmap` tábláját is (mind a 7 ttf):
a `–`, `—`, `−`, `·`, `…` glifa **mindegyikben megvan**, egyedül a `▾`
hiányzik – ez erősíti a D-031-et, és igazolja a nagykötőjeles eredményt.

**Nyitva maradt:** **Eszközön még nem futott.** A 84pt-os számoszlop
háromjegyű eredménnyel (`102–100`) és a hosszú ellenfélnevek tördelése valós
kijelzőn ítélhető meg; ugyanígy a `H` / `V` kör olvashatósága. A „Lejátszott"
sorok a `games/[id]` helyőrzőre visznek, amíg a meccs részletei el nem
készül. A képernyő egy `ScrollView`-ban rendereli az összes sort (D-044) –
ha egy szezon meccsszáma jelentősen megnő, `SectionList`-re kell váltani.
Képernyőolvasó a vezérjelet betűként mondja ki („H", „V"); ha ez zavaró,
a `StackedRow` kaphat opcionális `accessibilityLabel` propot.

**Commit:** `feat: Meccsek lista képernyő`

---

## 2026-09-02 – Ma képernyő és tab váz

**Mit:** Elkészült az S6 első képernyője, és vele az app navigációs váza.

*Tab váz.* `app/(tabs)/` öt route-tal: `index` (Ma), `players`, `games`,
`standings`, `analysis`. A három bővülő tab (`players`, `games`, `analysis`)
saját `Stack` layoutot kapott, hogy a későbbi részletképernyők (`games/[id]`)
ne külön tabként jelenjenek meg. A Ma kivételével mind `PlaceholderScreen`-t
mutat („Hamarosan"), a végleges fejléccel és címmel – a tabsáv és a szűrő így
már öt tabbal próbálható. Az ideiglenes `@core` füstteszt képernyő
(`app/index.tsx`) törölve; a füstteszt feladata már korábban lezárult, és a
`/` most a Ma tabra mutat.

*Tabsáv.* Saját `components/TabBar.tsx` a mockup szerint: 63pt tartalom +
`insets.bottom`, surface1 háttér, subtle felső vonal, 24pt lucide ikonok, DM
Sans 11pt felirat, az aktív tab tetején 24×3pt cián sáv. A beépített tabsáv
ezt a felső jelzést nem tudja kiadni (D-042).

*Ma képernyő.* `app/(tabs)/index.tsx` – fejléc, „MA" cím, majd négy blokk:
következő meccs kártya (`NextGameCard`), 2×2-es KPI rács (`StatTile`),
forma-sáv (`FormStrip`) és a legutóbbi meccs kártyája (`LastGameCard`). Az
adat a `useTodayData`-ból jön, ami a meglévő `useGameData` + `usePlayerData`
párost fogja össze – plusz hálózati kör nélkül (D-040). Első betöltéskor a
végleges elrendezés `SkeletonBlock` helyőrzői látszanak, hiba esetén
`ErrorPanel`, üres szűrőtalálatra `EmptyState`.

*Fejléc és beállítások.* `components/AppHeader.tsx` – app jel, szűrő-chip,
fogaskerék. A fogaskerék a mockupban tartalom nélkül szerepelt; most egy
beállítás sheetet nyit (bejelentkezett email, verzió, kijelentkezés), ez lett
a kijelentkezés végleges helye (D-041). Ehhez a `FilterSheet` lapváza kikerült
a közös `components/BottomSheet.tsx`-be – a mozgás, a záró gesztus és az
Android back kezelése egy helyen él, a `FilterSheet` viselkedése változatlan.

*Formázás.* Új `lib/format.ts`: magyar dátum (`2026. szeptember 6. · szombat`),
tizedes szám és napkülönbség. A hónap- és napnevek kézzel felsoroltak, nem
`Intl`-ből jönnek (D-039).

**Eltérések a mockuptól** (mind adathiány vagy korábbi döntés miatt):

- A következő meccs kártyáról lemarad a **kezdési időpont és a helyszín** – a
  sémában (élesben ellenőrizve) egyik sincs (D-022). A visszaszámláló ezért
  nap pontosságú: `7 NAP` / `HOLNAP` / `MA` (D-043).
- A **KPI trendjelzők** (▲ 3.1) kimaradnak mind a négy csempéről: két
  mutatóhoz nincs olcsó meccsenkénti adat, a felemás megoldást elvetettük
  (D-040).
- A `▾` és a `›` karaktert lucide ikon váltja (D-031 mintájára): a csomagolt
  DM Sans subsetben nincsenek meg, Androidon tofuként jelennének meg.
- A visszaszámláló 0.02em betűköze elmaradt, mert ehhez új `tracking` token
  kellene (20pt-on ez 0.4pt eltérés).

**Fájlok:** `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`,
`app/(tabs)/standings.tsx`, `app/(tabs)/players/{_layout,index}.tsx`,
`app/(tabs)/games/{_layout,index,[id]}.tsx`,
`app/(tabs)/analysis/{_layout,index}.tsx` (mind új), `app/index.tsx` (törölve),
`components/{TabBar,AppHeader,BottomSheet,SettingsSheet,NextGameCard,FormStrip,LastGameCard,PlaceholderScreen}.tsx`
(új), `components/FilterSheet.tsx` (a közös vázra állt át),
`hooks/useTodayData.ts` (új), `lib/format.ts` (új)

**Tesztelve:** `npm run typecheck` és `npm run lint` hibátlan (a typed routes
újragenerálásához egyszer el kellett indítani a dev szervert). `npx expo
export` iOS-re és Androidra lefut; **mindkét** Hermes bundle tartalmazza a
képernyő összes feliratát (az ékezeteseket UTF-16-ban keresve): „Következő
meccs", „Legutóbb", „Beállítások", „Kijelentkezés", „Pontátlag", „Lepattanó",
„Forma · Utolsó", „Részletek", a magyar hónapneveket és a visszaszámláló
szövegeit, valamint mind az öt tabfeliratot.

**Nyitva maradt:** **Eszközön még nem futott** – ez a legnagyobb nyitott tétel:
a tabsáv magassága, a KPI rács kétoszlopos törése, a hosszú ellenfélnevek
tördelése és a beállítás sheet csak valós kijelzőn ítélhető meg. A
„Részletek" a `games/[id]` helyőrzőre visz, amíg a meccs részletei képernyő el
nem készül. A `PlaceholderScreen` négy tabon él, ezeket a saját feladatuk
váltja le. A tabsáv „véglegesítése" (a feladatlista utolsó S6 sora) szándékosan
nincs kipipálva: az aktív állapot finomhangolása és az eszközös ellenőrzés
akkor jön, amikor mind az öt képernyő megvan.

**Commit:** `feat: Ma képernyő és tab váz`

---

## 2026-09-02 – Tap target audit

**Mit:** Végigmértem az összes interaktív elemet, és három helyen a célpont a
44pt alatt maradt. A közös ok: a `hitSlop` **csak a szülő határain belül**
kézbesít – a kilógó rész mindkét platformon elveszik (iOS `hitTest:`, Android
`TouchTargetHelper`), mert az ősök bejárása megáll ott, ahol a pont már
kívül esik. Ezt eddig implicit feltételeztük, most kimondtuk (D-038), és a
`constants/theme.ts` `tapTarget` tokenjének kommentje is figyelmeztet rá.

Mérés (magasság × szélesség, effektív célpont):

| Elem | Előtte | Utána |
|---|---|---|
| `ErrorPanel` blokk „Újrapróbálás" | 44 × 24+felirat | változatlan |
| `ErrorPanel` inline „Újra" | ~38 (a slop kilógott) | 44 × 44 |
| `FilterSheet` „Kész" | ~34 (a felső slop kilógott) | 46 × 66 |
| `FilterSheet` szezon/csapat sor | 48 × teljes szélesség | változatlan |
| `FilterSheet` scrim | teljes képernyő | változatlan |
| `GlowCard` (nyomható) | tartalomfüggő | min. 44 |
| `StatTile` | 96 | változatlan |
| `StackedRow` | 68 | változatlan |
| `login` mezők / szemgomb / gomb | 44 | változatlan |
| `index` szűrő-chip | 32 (a slop kilógott) | 44 |
| `index` kijelentkezés | 44 | változatlan |

A három javítás:

1. **`ErrorPanel` inline „Újra"** – a hitSlop helyett maga a gomb lett 44×44
   (`minHeight` + `minWidth` + 8pt vízszintes margó), a panel függőleges
   margója pedig 10 → 6, hogy a panel ne nőjön a kelleténél nagyobbra: így
   ~38pt helyett 58pt magas.
2. **`FilterSheet` „Kész"** – a fejlécsor kapott `pt-12`-t, és ugyanennyivel
   kisebb lett a grabber alsó margója (14 → 2), így a felirat optikailag
   ugyanott maradt, a slopnak viszont van hová nyúlnia a soron belül. A
   „Kész" `lineHeight`-ja fix 20, hogy a célpont mérete ne a platform
   alapértelmezett sorközétől függjön.
3. **`GlowCard`** – nyomható alakban `minHeight: tapTarget`. Ez nem mai hiba,
   hanem garancia a jövőbeli hívóknak: a kártya `padding`-je kívülről állítható,
   és egy rövid tartalmú, szűk margójú kártya 44pt alá csúszhatna. A hívó
   `style`-ja felfelé továbbra is felülírja (a `StatTile` 96pt-tal).

Az ideiglenes füstteszt képernyőn a szűrő-chip sora `py-6`-ot kapott, hogy a
chip meglévő 6pt-os slopja a soron belülre essen. A szórványos `height: 44`
literálok (login, füstteszt képernyő) a `tapTarget` tokenre cserélve.

**Fájlok:** `components/ErrorPanel.tsx`, `components/FilterSheet.tsx`,
`components/GlowCard.tsx`, `constants/theme.ts` (tokenkomment), `app/login.tsx`,
`app/index.tsx`

**Tesztelve:** `npm run typecheck` és `npm run lint` hibátlan. `npx expo export`
iOS-re és Androidra lefut; **mindkét** Hermes bundle tartalmazza az új
`inlineButton` és `doneLabel` stílusokat, a `minHeight` mezőt, valamint a
`pt-12` / `py-6` osztályokat.

**Nyitva maradt:** Eszközön még nem mértem – a 44pt-os szabály betartását
statikus layout-számításból vezettem le (fix magasságok + a szülők margói),
nem képernyőn mérve. A `FilterSheet` fejlécének 12pt-os áthelyezését
(grabber margó → sor padding) érdemes egymás mellett összenézni a mockuppal.
Az egymás melletti célpontok **távolsága** nem volt része az auditnak, csak a
méretük; a képernyők (S6) sűrűbb sorai ezt újra felvethetik. Az S6-ban
születő új interaktív elemekre (tab bar, listasorok, riportkártyák) az audit
nem terjed ki – azok a saját feladatuknál mérendők.

**Commit:** `fix: tap target audit`

---

## 2026-09-02 – Betöltési helyőrző (`SkeletonBlock`)

**Mit:** Elkészült a `components/SkeletonBlock.tsx`, az első betöltés
shimmerje (a `CLAUDE.md` szerint spinner csak háttérfrissítésnél jár). Mockup
ehhez nem készült, a megjelenésre rákérdeztem, a választott irány a gradiens
sweep: tompa felület-blokk, amin balról jobbra végigfut egy lágy fénysáv,
`duration.shimmer` (1200ms) ciklussal, lineáris ütemezéssel, végtelen
ismétléssel (D-037).

A sáv `react-native-svg` lineáris gradiens (átlátszó → `text.primary` 6%-on →
átlátszó), mert egy sima `View` sávnak kemény éle lenne; a csomag már fent
volt, a `FilterSheet` elválasztója is ezt használja. A sáv úthossza a blokk
mért szélessége (`onLayout` → state, majd a worklet a számot zárja körbe –
ugyanaz a minta, mint a `FilterSheet` magasságánál), így −szélességtől
+szélességig fut. Amíg nincs mérés, csak az alapfelület látszik.

Props: `height` (alap 12), `width` (alap `100%`), `corner` (a radius-skálából,
alap `sm`), `surface` (`surface2` a base/surface1 hátterű képernyőkön,
`surface3` a surface2 hátterű sheetben) és elhelyezésre a `style`. A blokk
képernyőolvasó elől rejtve van (`accessibilityElementsHidden` +
`importantForAccessibility="no-hide-descendants"`): a betöltés tényét a
képernyő saját szövege mondja el, nem hét néma doboz.

Ugyanebben a lépésben a `FilterSheet` ideiglenes `placeholderBar`-ját
lecseréltem valódi `SkeletonBlock`-ra (`surface="surface3"`, 55% × 12) – ez a
korábbi „a shimmert az S5 hozza majd" TODO lezárása.

**Fájlok:** `components/SkeletonBlock.tsx` (új), `components/FilterSheet.tsx`
(helyőrző csere, a `placeholderBar` stílus törölve), `constants/theme.ts`
(`duration.shimmer`)

**Tesztelve:** `npm run typecheck` és `npm run lint` hibátlan.

Metro-oldal: ideiglenesen kitettem az `app/index.tsx` füstteszt képernyőre
három blokkot (különböző szélesség, magasság, sarok és felület), majd
lefuttattam az `npx expo export`-ot iOS-re és Androidra. **Mindkét** Hermes
bundle tartalmazza a `skeletonSweep` gradienst és a rá hivatkozó
`url(#skeletonSweep)` kitöltést, a `stopOpacity` mezőket, a két felületszínt
(`#0F1F3D`, `#162440`) és a fénysáv `#E8F4FF` alapszínét. Az ideiglenes
kitételt visszavontam.

**Nyitva maradt:** Eszközön még nem futott – a shimmer sebessége és a 6%-os
csúcsfedettség csak valós kijelzőn ítélhető meg, olcsó Android panelen a sáv
lehet, hogy alig látszik. Nincs „reduce motion" kezelés: a rendszer szintű
mozgáscsökkentés mellett is fut a sáv (`AccessibilityInfo.isReduceMotionEnabled`
bekötése egy későbbi akadálymentesítési kör feladata). Minden példány ugyanazt
a `skeletonSweep` gradiens-azonosítót használja; mivel a gradiens mindenhol
azonos, ütközés nem okoz vizuális eltérést, de ha valaha variánsonként eltérő
gradiens kell, az azonosítót példányosítani kell. A `SkeletonBlock` egyelőre
csak a `FilterSheet`-ben él; a képernyők betöltési állapotai az S6-ban kapják
meg.

**Commit:** `feat: betöltési helyőrző komponens`

---

## 2026-09-02 – Badge komponens

**Mit:** Elkészült a `components/Badge.tsx`, a rövid állapotcímke hét
variánssal. A `p0-style-tile.html` „Badge-ek" blokkját replikálja: Barlow
Condensed 11pt ALL CAPS, `tracking.label` (0.12em) betűköz, 3/8pt margó, `xs`
(2pt) sarok, 1pt keret. A hat accent variáns (cyan / orange / ai / positive /
negative / warning) közvetlenül a `constants/theme.ts` `glow` tokenjeiből
építkezik – a háttér a `fill`, a keret a `border` –, így a mockup rgba
értékei (0.14 / 0.30, az AI-nál 0.16 / 0.40) nem duplázódnak a komponensben.
A felirat színe az accent szín, **kivéve** az `ai` variánst: lila háttéren az
`accent.ai` olvashatatlan, ott a világosabb `text.ai` (`#C4B5FD`) megy, ahogy
a mockupban is. A hetedik, `neutral` variáns nem accent: surface2 háttér,
`border.subtle` keret, `text.secondary` felirat.

A komponens egyetlen `Text` elem (nem `View` + `Text`), így vízszintesen a
tartalmára zsugorodik; az `alignSelf: 'flex-start'` a függőleges nyújtást
kapcsolja ki oszlop-szülő alatt. A doboz magassága fix `lineHeight: 14` +
`includeFontPadding: false` révén platformfüggetlen (az utóbbi iOS-en nem
értelmezett mező, ezért nem kell `Platform` elágazás) – lásd D-036.

**Fájlok:** `components/Badge.tsx` (új)

**Tesztelve:** `npm run typecheck` és `npm run lint` hibátlan.

Metro-oldal: ideiglenesen kitettem az `app/index.tsx` füstteszt képernyőre
mind a hét variánst egy tördelt sorban, majd lefuttattam az `npx expo
export`-ot iOS-re és Androidra. **Mindkét** Hermes bundle tartalmazza a hét
feliratot (az ékezeteseket UTF-16-ban keresve), az `includeFontPadding`
mezőt, az AI variáns `rgba(124,58,237,0.16)` / `rgba(124,58,237,0.40)`
rétegeit, a `#C4B5FD` feliratszínt és a `neutral` `#0F1F3D` hátterét. Az
ideiglenes kitételt visszavontam.

**Nyitva maradt:** Eszközön még nem futott. Ellenőrizni kell (a) hogy a fix
`lineHeight` + kikapcsolt betűpadding mellett a felirat optikailag középen
ül-e Androidon (D-036); (b) hogy a 2pt-os sarok az `overflow: 'hidden'`-nel
tisztán vág-e iOS-en. A badge szándékosan nem nyomható (a mockupban sincs
állapota), ezért a 44pt-os érintési szabály nem érinti – ha az S6-ban
szűrő-chipként kattinthatóvá válna, az a méretet is újratárgyalja.

**Commit:** `feat: badge komponens`

---

## 2026-09-01 – Statisztikai mátrix (`StatMatrix`)

**Mit:** Elkészült a `components/StatMatrix.tsx`, a webes `DataTable` mobil
párja sok oszlop esetére. A komponens a `p0-style-tile.html` „StatMatrix minta"
blokkját replikálja: surface1 hátterű, `lg` sarkú, `overflow: hidden` doboz,
benne balra a 108pt széles **fagyasztott** névoszlop (jobb oldali 1pt
`border.subtle` keret + fekete mélységárnyék), jobbra a `bg.base` hátterű,
vízszintesen görgethető numerikus terület. A fejlécsor mindkét oldalon 30pt
magas, `border.hairline` alsó vonallal; az adatsorok 34pt magasak. A
cellamargó 10pt, az oszloptérköz 16pt, az alapértelmezett oszlopszélesség 36pt
(oszloponként felülírható, pl. négyjegyű értékhez). Feliratok: Barlow Condensed
10pt ALL CAPS `text.muted`; nevek: DM Sans 13pt; értékek: JetBrains Mono 13pt,
`tabular-nums`, jobbra igazítva.

A cellák sima sztringként is megadhatók, de `{ value, tone }` alakban accent
hangnemet is kaphatnak (a tabella pontkülönbségéhez, a box score kiemeléseihez)
– a hangnem → szín leképezés a `constants/theme.ts` `accentColor`-jából jön,
mint a `StackedRow`-ban.

A fejlécfeliratok betűköze `tracking.label` (0.12em), nem a mockup 0.1em-je –
ugyanaz az indok, mint a D-033-ban.

**Fájlok:** `components/StatMatrix.tsx` (új)

**Tesztelve:** `npm run typecheck` és `npm run lint` hibátlan.

Metro-oldal: ideiglenesen kitettem az `app/index.tsx` füstteszt képernyőre egy
hat oszlopos, három soros mátrixot (köztük szélesített oszlop és mindhárom
hangnem), majd lefuttattam az `npx expo export`-ot iOS-re és Androidra.
**Mindkét** Hermes bundle tartalmazza a feliratokat, a `tabular-nums`
beállítást és a `boxShadow` értéket. Az ékezetes sztringeket UTF-16-ban is
kerestem (lásd az előző bejegyzést). Az ideiglenes kitételt visszavontam.

**Nyitva maradt:** Eszközön még nem futott. Ellenőrizni kell (a) a két oszlop
sorainak egy vonalban maradását nagy rendszer-betűméret mellett – a fix
sormagasság miatt a szöveg inkább vágódik, mint hogy elcsússzon, de ez
vizuálisan hitelesítendő; (b) a `boxShadow` renderelését Androidon (D-035);
(c) a vízszintes görgetés viselkedését a képernyő függőleges görgetőjében,
Androidon is. A mátrix sorai szándékosan nem nyomhatók (a mockupban sincs
állapotuk), így a 44pt-os érintési szabály nem érinti őket – ha az S6-ban
sorra kattintás kell, az a magasságot is újratárgyalja. Képernyőolvasó a két
oszlopot külön fatörzsként olvassa, ezért a sor összefüggése elveszik – ha
kell, sor-szintű `accessibilityLabel` a fagyasztott cellára a megoldás.

**Commit:** `feat: statisztikai mátrix komponens`

---

## 2026-09-01 – Listasor (`StackedRow`)

**Mit:** Elkészült a `components/StackedRow.tsx`, a webes `DataTable` sorának
mobil párja. A sor a `jatekosok-lista.html` játékossorát replikálja: 68pt
magasság, 16pt vízszintes margó, `lg` sarok, surface1 háttér; balra 32pt-os kör
(surface3 háttér, `border.active` keret, Barlow Condensed 13pt mezszám), középen
a függőlegesen csoportosított cím + alcím (DM Sans 15 / 13, 2pt térköz, egy
sorra tördelve), jobbra fix 48pt széles numerikus oszlopok 16pt térközzel,
JetBrains Mono 20pt, `tabular-nums`, jobbra igazítva.

A kiemelt sor (kiválasztott **vagy** éppen lenyomott) surface2 hátteret és bal
oldali 2pt-os cián sávot kap – a mockup `pressed` állapota. A `GlowCard` 3pt-os
accent sávjától ez szándékosan eltér, és a sor nem is a `GlowCard`-ra épül,
lásd D-032.

Ugyanebben a fájlban a `StackedRowHeader`: a lista fölötti oszlopfejléc, ami a
sorokkal azonos `metricWidth`-et és térközt használ, hogy a feliratok a számok
fölé essenek. A mockupban ez a fejléc csak az első sor fölött jelenik meg.

Az oszlopértékek `tone`-t kaphatnak (`AccentTone`), hogy a meccslistán a nyert
meccs pontszáma kiemelhető legyen. Az accent hangnem → szín leképezés a
`constants/theme.ts` új `accentColor` exportjába került, mert a `GlowCard` már
tartalmazta ugyanezt a hat sort, és a `Badge` lesz a harmadik – a `GlowCard`
mostantól ezt használja, viselkedése nem változott.

**Fájlok:** `components/StackedRow.tsx` (új), `constants/theme.ts`,
`components/GlowCard.tsx`

**Tesztelve:** `npm run typecheck` és `npm run lint` hibátlan.

Metro-oldal: ideiglenesen kitettem az `app/index.tsx` füstteszt képernyőre egy
fejlécet és négy sort (nyomható alap, `active` sor `positive` hangnemű
oszloppal, valamint kör és metrika nélküli meccssor), majd lefuttattam az
`npx expo export`-ot iOS-re és Androidra. **Mindkét** Hermes bundle tartalmazza
az összes szöveget és a `tabular-nums` beállítást. Az ékezetes sztringek a
Hermes string table-ben UTF-16-ban vannak, ezért a nyers `grep` nem találja
őket – a keresést mindkét kódolásra le kell futtatni. Az ideiglenes kitételt
visszavontam.

**Nyitva maradt:** Eszközön még nem futott: a 2pt-os sáv és a `lg` sarok
találkozása, valamint a hosszú játékosnév „…"-re vágása vizuálisan nincs
hitelesítve – az S6 játékoslistáján kell megnézni, Androidon is. A 48pt-os
oszlopszélesség a mockup háromjegyű értékeire lett szabva; ha a meccslistán
ennél szélesebb kell, a `metricWidth` proppal állítható. Nagy rendszer-betűméret
mellett a sor a `minHeight` miatt nőhet – ez szándékos, de eszközön ellenőrizni
kell.

**Commit:** `feat: listasor komponens`

---

## 2026-09-01 – KPI csempe (`StatTile`)

**Mit:** Elkészült a `components/StatTile.tsx`, a webes `StatCard` mobil párja.
A csempe a `GlowCard`-ra épül (`corner="xl"`, 14pt padding, opcionális accent
sáv), és hozzáteszi a mockup 96pt-os minimum magasságát, a fenti label +
változásjelző sort, valamint a 28pt-os JetBrains Mono SemiBold értéket 8pt
felső margóval, `tracking.tight` betűközzel és `tabular-nums`-szal.

A trend külön `tone` mezőt kapott (`positive` / `negative` / `neutral`), mert a
mockupban a szín **nem** az irányból következik: a csökkenő kapott pont zöld
(▼ 2.4), a növekvő eldobott labda piros (▲ 1.8). Az irányt és a színt ezért a
hívó adja meg egymástól függetlenül.

A mockup ▲ / ▼ / ▬ karakterei helyett lucide ikon rajzolja a jelet – a
csomagolt betűkészletekben nincsenek meg ezek a glifák, lásd D-031.

**Fájlok:** `components/StatTile.tsx` (új)

**Tesztelve:** `npm run typecheck` és `npm run lint` hibátlan.

Betűkészlet-ellenőrzés: a három TTF `cmap` tábláját kiolvasva a U+25B2 / U+25BC
/ U+25AC / U+25BE **egyikben sincs** benne (a JetBrains Mono és a DM Sans
subset 229, illetve 222 kódpontot tartalmaz). A U+2191 / U+2193 nyíl megvan a
monóban és a DM Sans-ban, a Barlow Condensedben nem.

Metro-oldal: ideiglenesen kitettem négy csempét az `app/index.tsx` füstteszt
képernyőre (cyan növekvő, orange csökkenő-de-pozitív, positive változatlan, és
egy sáv nélküli nyomható), majd lefuttattam az `npx expo export`-ot iOS-re és
Androidra. **Mindkét** Hermes bundle tartalmazza a csempék feliratait, a három
akadálymentességi irányszöveget („növekedés", „csökkenés", „változatlan") és a
`tabular-nums` beállítást. Az ideiglenes kitételt visszavontam.

**Nyitva maradt:** Eszközön még nem futott: a lucide háromszög optikai mérete
(9pt, kitöltve) a 11pt-os mono szöveg mellett vizuálisan nincs hitelesítve, ezt
az S6 „Ma" képernyőjén kell megnézni, Androidon is. Az `app/index.tsx`
ideiglenes `FilterChip`-jében maradt egy `▾` karakter, ami ugyanezen okból
Androidon tofuként jelenhet meg – az S6-ban a végleges szűrő-chipnél lucide
`ChevronDown`-ra kell cserélni (a füstteszt képernyő addig is eldobásra kerül).

**Commit:** `feat: KPI csempe komponens`

---

## 2026-09-01 – Kártya alap (`GlowCard`)

**Mit:** Elkészült a `components/GlowCard.tsx`, az S5 első közös komponense: a
mockup kártyáinak alakja egy helyen. surface1 háttér, `corner` szerinti
sarokkerekítés (`lg` 10 a sorszerű, `xl` 14 a kiemelt kártyáknak), állítható
`padding` (a mockupban 14 vagy 16), és opcionális bal oldali 3pt-os accent sáv
a hat accent hangnem valamelyikével. A sáv sarkai a kártyáéval egyeznek, a
kártya bal margója pedig a sáv szélességével nő (14 → 17, 16 → 19) – pontosan
úgy, ahogy a mockup számol. Az `accent="ai"` a webes `.ai-marker` mobil párja.

A kártya nyomhatóvá tehető: `onPress` esetén `Pressable`, lenyomva surface1 →
surface2 háttérváltással. A lenyomott állapotot a `usePressed` követi, mert a
`style` függvény-alakját a NativeWind interop eldobja (D-011).

A `constants/theme.ts` új exportja az `AccentTone` típus (`keyof typeof glow`),
hogy a hat hangnem listája ne duplázódjon a `GlowCard` és a később következő
`Badge` között.

**Fájlok:** `components/GlowCard.tsx` (új), `constants/theme.ts`

**Tesztelve:** `npm run typecheck` és `npm run lint` hibátlan.

Metro-oldal: ideiglenesen kitettem három `GlowCard`-ot az `app/index.tsx`
füstteszt képernyőre (orange sáv `xl`/16-os kártyán, nyomható `ai` sávos, és
sáv nélküli sima), majd lefuttattam az `npx expo export`-ot iOS-re és
Androidra. **Mindkét** Hermes bundle tartalmazza mind a három kártya szövegét
és az `accessibilityLabel`-t. Az ideiglenes kitételt visszavontam.

**Nyitva maradt:** Eszközön még nem futott, tehát a sáv és a kerekített sarok
találkozása vizuálisan nincs ellenőrizve – ezt az S6 első képernyőjén kell
megnézni, Androidon is (ott a 3pt-os abszolút sáv a kártya `borderRadius`-a
alatt fut, nem `overflow: hidden`-nel vágva). A mockup külső glow-ja
(`box-shadow: 0 0 24px`) kimaradt, lásd D-030. Keret nincs a kártyán, szintén
D-030.

**Commit:** `feat: kártya alap komponens`

---

## 2026-09-01 – Hibakezelés és üres állapot (`ErrorPanel`, `EmptyState`)

**Mit:** Az adatréteg eddig csak `error` sztringet és `reload()`-ot adott, a
megjelenítése hiányzott. Két komponens zárja le az S4-et:

- `components/ErrorPanel.tsx` – hibaüzenet + újrapróbálás. Két alakja van:
  `block` (a tartalom helyén álló panel, 44pt-os másodlagos gombbal a P0 Style
  Tile szerint) és `inline` (egysoros, listán/sheeten belülre). A `FilterSheet`
  saját, helyi hibapanelje kikerült, most a közöset használja `inline` alakban –
  a megjelenése nem változott.
- `components/EmptyState.tsx` – ikondoboz + ALL CAPS cím + magyarázat. Az ikon
  cserélhető (alapértelmezés: `Inbox`), gomb nincs rajta (D-028).

Emellett a `useCachedQuery` hibaüzenete magyar lett a leggyakoribb hálózati
esetre: a `fetch` „Network request failed" szövege helyett „… : nincs kapcsolat
a szerverrel." Az adatbázishibák változatlanul a Supabase saját üzenetét viszik,
mert az a diagnózishoz kell.

**Fájlok:** `components/ErrorPanel.tsx` (új), `components/EmptyState.tsx` (új),
`components/FilterSheet.tsx`, `hooks/useCachedQuery.ts`

**Tesztelve:** `npm run typecheck` és `npm run lint` hibátlan.

A `describeError` a `hooks/useCachedQuery.ts` **valódi forrásából** kiemelve,
Node alatt, 6 ellenőrzéssel: `Network request failed`, `Failed to fetch` és
timeout → magyar kapcsolathiba; PostgREST hibaüzenet változatlanul átmegy;
nem-`Error` érték és üres üzenet → „ismeretlen hiba".

Metro-oldal: ideiglenesen kitettem mindkét komponenst az `app/index.tsx`
füstteszt képernyőre, és lefuttattam az `npx expo export`-ot iOS-re és
Androidra. **Mindkét** Hermes bundle tartalmazza a négy új magyar szöveget
(„Újrapróbálás", „nincs kapcsolat a szerverrel", a példa cím és leírás). Az
ideiglenes kitételt visszavontam.

**Nyitva maradt:** Vizuálisan egyik komponens sem futott eszközön – a
szimulátoron nincs Expo Go, és valódi hibát/üres eredményt egyelőre nincs hol
kiváltani, mert adatképernyő még nincs. Az S6 első képernyőjénél mindkettőt
meg kell nézni élőben (különösen a `block` panel margóját 44pt-os gombbal). Az
`EmptyState` ikondoboza 56×56pt, `radius.xl` – kör alakú ikonháttérhez új
radius token kellene, ezért maradt lekerekített négyzet.

**Commit:** `feat: hibapanel és üres állapot komponens`

---

## 2026-09-01 – Lusta betöltési stratégia (közös lekérdezés-cache)

**Mit:** A három adathook (`useFilterData`, `useGameData`, `usePlayerData`)
ugyanazt a mintát ismételte – modulszintű cache, `loading`, `error`, `attempt`
számláló, „még él-e a komponens" flag –, ezért ez egy helyre került. Az új
`lib/query-cache.ts` adja a kulcsolt cache-t (deduplikálás, hibás kérés
kiesése, `invalidate`, `clearAllQueryCaches`), az új `hooks/useCachedQuery.ts`
pedig a köré épülő betöltés-, hiba- és újrapróbálás-kezelést. A három hook így
összesen 111 sorral rövidebb, és a viselkedésük egységes.

Két új viselkedés is bekerült, ezek adják a `CLAUDE.md` „lusta betöltés"
elvárását:

1. **A háttérben lévő tab nem tölt.** A `useCachedQuery` a `useIsFocused`-öt
   nézi: szezon- vagy csapatváltáskor csak a látható képernyő indít
   lekérdezést, a többi akkor, amikor a felhasználó odalép (D-027).
2. **Kijelentkezéskor ürül a cache.** Az `initAuth` figyeli a felhasználó
   azonosítóját, és váltáskor (kijelentkezés is az) kiüríti az összes cache-t,
   nehogy a következő belépő az előző adatait lássa. A token frissítése nem
   ürít.

Emellett a hook kulcshoz köti az adatot: amíg az új szűrőhöz nincs eredmény,
üres értéket ad vissza, nem az előző szezonét.

**Fájlok:** `lib/query-cache.ts` (új), `hooks/useCachedQuery.ts` (új),
`hooks/useFilterData.ts`, `hooks/useGameData.ts`, `hooks/usePlayerData.ts`,
`store/authStore.ts`

**Tesztelve:** `npm run typecheck` és `npm run lint` hibátlan.

A `lib/query-cache.ts` **valódi kódja** Node alatt, 9 ellenőrzéssel:
deduplikálás (két párhuzamos `load` → egy hálózati hívás, azonos referencia),
cache találat hívás nélkül, másik kulcs → új hívás, hibás kérés nem ragad bent,
`invalidate` után új hívás, `clearAllQueryCaches` mindkét cache-t üríti.

A `useCachedQuery` viselkedése a `usePlayerData` valódi kódján keresztül,
dublőrözött Supabase-szel (kérésszámláló) és dublőrözött fókusszal, 19
ellenőrzéssel: hidratálás előtt nincs kérés; háttérben lévő tabnál nincs kérés;
fókuszba kerülve elindul; hálózati hiba → magyar üzenet + üres lista + nincs
töltés; `reload()` újra kér és törli a hibát; azonos szűrőre újramountolva
nincs hálózat; háttérben történt szezonváltás nem indít kérést **és nem mutat
régi adatot**; fókusz után az új szűrőre fut a kérés; korábbi szezonra
visszaváltva cache-ből jön; `clearAllQueryCaches` után új kérés indul.

Éles Supabase-szel mindhárom hook: a szűrő 5 szezont és 16 csapatot ad, az
alapértelmezés 2025/2026 + Atomerőmű SE; a meccsek 58 sor, 40-18-as mérleg,
89.8 / 80.7 átlagpont; a játékoslista **változatlanul** 13 fő, élen BENKE
Szilárd 15.0 PPG / 3.3 RPG / 3.3 APG / 31.5 perc / 16.9 értékelés, TS% 54.8,
eFG% 50.7 – a refaktor tehát nem mozdított számot.

Metro-oldal: ideiglenesen bekötöttem mindhárom hookot az `app/index.tsx`
füstteszt képernyőre, és lefuttattam az `npx expo export`-ot iOS-re és
Androidra. **Mindkét** Hermes bundle tartalmazza az új réteget és a hookokat
(`seasons+teams` cache kulcs, `player_season_stats_by_season`,
`league_fixtures`, valamint UTF-16-ban mindhárom magyar hibaüzenet és a
„Dobóhátvéd" pozíciónév). Az ideiglenes bekötést visszavontam.

**Nyitva maradt:** Szimulátoron ez nem futott: az Expo Go nincs telepítve a
gép szimulátorára, és mentett session nélkül az app a bejelentkezési képernyőn
állna meg, a hookok tehát nem is renderelnének. A fókuszfüggő betöltés
egyébként is csak akkor válik láthatóvá, amikor tényleg van több tab – az S6
tab layout után ezt vizuálisan is ellenőrizni kell (szezonváltás után csak a
látható tab indítson kérést). A cache-nek nincs elévülése: amíg a szűrő nem
változik, csak a `reload()` hoz friss adatot (D-026).

**Commit:** `feat: közös lekérdezés-cache és lusta betöltés`

---

## 2026-09-01 – Szezon-aggregált játékosstatisztikák (`usePlayerData`)

**Mit:** Elkészült a `hooks/usePlayerData.ts`: a kiválasztott szezon és csapat
játékosainak szezonösszesítése a `player_season_stats_by_season` view-ból, a
sor → `PlayerStats` konverzió a `@core/player-stat-mapping`
`mapSupabaseStatToPlayerStats()`-ával (a TS% és az eFG% így az összegzett
dobásokból számolódik, nem meccsenkénti százalékok átlagából). A hook a core
alakot kiegészíti a képernyőnek kellő származtatott mezőkkel: `averages`
(PPG / RPG / APG / perc / labdaszerzés / eladott labda / értékelés) és
`positionLabel` (magyar pozíciónév a `@core/positions`
`resolvePrimaryPosition()`-jéből). A ponthatékonyság és a védekezési index a
webprojekt `useGameData`-jával azonos képlettel megy, hogy a két felület
ugyanazt a számot mutassa.

A szűrőt a hook maga olvassa a `filterStore`-ból, szűrőpáronként
(`szezon:csapat`) cache-el, és `@core/fetch-all-rows`-szal lapoz – ugyanaz a
minta, mint a `useGameData`-nál (D-020). Aki nulla meccsen szerepel, kimarad a
listából; a sorrend meccsenkénti pontátlag szerint csökkenő.

**Fájlok:** `hooks/usePlayerData.ts`, `types/players.ts`,
`data/position-labels.ts`

**Tesztelve:** `npm run typecheck` és `npm run lint` hibátlan.

A hook **valódi kódját** Node alatt lefuttattam (natív TS type stripping +
egyedi ESM loader az alias-okra; a `react`, a `filterStore` és az AsyncStorage
dublőrözve, de **éles** Supabase klienssel):
(1) 2025/2026 + Atomerőmű SE → 13 játékos, élen BENKE Szilárd 15.0 PPG /
3.3 RPG / 3.3 APG / 31.5 perc / 16.9 értékelés, TS% 54.8, eFG% 50.7;
(2) 2024/2025 + ASE → 15 játékos, élen CHANDLER III 21.3 PPG;
(3) 2026/2027 (üres szezon) és nem létező azonosítók → üres lista, hiba nélkül;
(4) a sorrend tényleg PPG szerinti, nem összpont szerinti (EILINGSFELD 663
összponttal a negyedik, BLUIETT és EDWIN kevesebb összponttal elé kerül).

Dublőrözött Supabase-szel a peremesetek: hidratálás előtt nem indul lekérdezés;
hálózati hiba → `loading: false` + magyar hibaüzenet + üres lista; a hibás
kérés nem ragad a cache-ben, a `reload()` újra próbálkozik és törli a hibát;
ugyanarra a szűrőpárra újramountolva nincs új hálózati kérés, szezonváltásra
viszont igen.

Metro-oldali feloldás: ideiglenesen bekötöttem a hookot az `app/index.tsx`
füstteszt képernyőre, lefuttattam az `npx expo export`-ot iOS-re és Androidra,
és **mindkét** bundle-ben megtaláltam a lekérdezést és a mappinget
(`player_season_stats_by_season`, `avg_valuation`,
`total_free_throw_attempted`, `positionLabel`, valamint UTF-16-ban a
„Dobóhátvéd" és a magyar hibaüzenet). Az ideiglenes bekötést visszavontam.

**Nyitva maradt:** A meccsenkénti bontás (`gameHistory`) szándékosan üres –
külön hook tölti majd a játékos részletei képernyőn (D-024). A view
`games_played` értékei a 2025/2026 szezonban 50–56 között vannak, ami a
`useGameData`-nál már jelzett **szezonkeveredés** következménye
(`games.season_id`, webprojekt-feladat) – a mobil app csak olvas, az átlagok
addig két szezonra átlagolnak. Az S6 képernyők még nem fogyasztják a hookot,
így szimulátoron vizuálisan még nem futott.

**Commit:** `feat: szezon-aggregált játékosstatisztikák lekérése`

---

## 2026-08-31 – Meccsek és fixtures (`useGameData`)

**Mit:** Elkészült a `hooks/useGameData.ts`: a kiválasztott szezon és csapat
lejátszott meccsei (`games`), a hátralévő találkozók (`league_fixtures`), és a
kettőből a `nextFixture` / `lastGame` gyorselérés, plusz a `teamStats`
összesítés (lejátszott, győzelem/vereség, átlag szerzett/kapott pont,
átlagos pontkülönbség). A szűrőt a hook maga olvassa a `filterStore`-ból, a
fixture-ök csapatneveit a `useFilterData` listájából oldja fel (D-020).
Mindkét lekérdezés `@core/fetch-all-rows`-szal lapoz, és minden lekérdezés
szűrt `season_id` + csapat szerint. Az eredmény szűrőpáronként
(`szezon:csapat`) modulszintű cache-be kerül, a `reload()` üríti.

Ha a szűrő listája elhasal, a hook nem ragad töltés-állapotban: átveszi a
`useFilterData` hibáját, és a `reload()` mindkettőt újratölti.

A „ma" határnapot **helyi idő szerint** állítjuk elő, nem `toISOString()`-gel:
az UTC-alapú számítás éjfél után egy nappal korábbi dátumot adna, és a mai
meccs kieshetne a közelgők közül.

**Fájlok:** `hooks/useGameData.ts`, `types/games.ts`

**Tesztelve:** `npm run typecheck` és `npm run lint` hibátlan.

A hook **valódi kódját** Node alatt is lefuttattam (babel-lel CJS-re fordítva,
a `react`, a `filterStore` és az AsyncStorage dublőrözve, de **éles** Supabase
klienssel), több esetre:
(1) 2025/2026 + Atomerőmű SE → 58 meccs, `lastGame` a 2026-05-25-i Kaposvár
elleni vereség, `teamStats` 40–18, 89.8 / 80.7 pont;
(2) ugyanez **2026-04-01-re hamisított rendszerdátummal** → 4 közelgő fixture,
`nextFixture` az Alba Fehérvár elleni idegenbeli, helyes `isHome: false`-szal
és feloldott csapatnevekkel (ma nincs közelgő találkozó, ezért kellett a
hamis dátum a fixture-ág futtatásához);
(3) 2024/2025 + ASE → 26 meccs, 23–3;
(4) 2025/2026 + Kaposvár → 40 meccs (a szűrés tehát tényleg csapatra megy);
(5) üres szezon (2026/2027) és nem létező azonosítók → üres lista, nulla
összesítés, hiba nélkül;
(6) szimulált szűrő-hiba → `loading: false`, a szűrő hibaüzenete jön át.

Metro-oldali feloldás: ideiglenesen bekötöttem a hookot a füstteszt
képernyőre, lefuttattam az `npx expo export`-ot iOS-re és Androidra, és
**mindkét** bundle-ben megtaláltam a lekérdezéseket (`league_fixtures`,
`home_team_id.eq.`, `our_team_id`, `avgConceded`). Az ideiglenes bekötést
utána visszavontam – a munkafa csak a két új fájlt tartalmazza.

**Nyitva maradt – két adatprobléma a webprojekt oldalán, nem a mobil appban:**

1. **A 2025/2026 szezon `games` sorai 2024-09-27-től 2026-05-25-ig szóródnak**
   (58 meccs), miközben a 2024/2025 szezon *ugyanazokat a 2024 őszi–2025
   tavaszi napokat* külön 26 sorban is tartalmazza. A szezonra szűrt lista
   tehát két szezon meccseit keveri, és emiatt a `teamStats` átlagai is két
   szezonra átlagolnak. A mobil app csak olvas, ezt a **webprojektben** kell
   rendezni (`games.season_id` javítása); addig a Ma és a Meccsek képernyő a
   kevert listát fogja mutatni.
2. **Ma (2026-08-31) egyetlen közelgő találkozó sincs**: a 2025/2026 szezon 4
   `scheduled` sora 2026 április–májusi, tehát múltbeli dátumú. A Ma képernyő
   „következő meccs" kártyája így üres állapotot fog kapni, amíg a
   2026/2027-es menetrend nincs importálva.

Ezen kívül a `league_fixtures` **nem tárol kezdési időpontot**, csak dátumot –
lásd D-022. Az S6 képernyők még nem fogyasztják a hookot, így szimulátoron
vizuálisan még nem futott.

**Commit:** `feat: meccsek és fixtures lekérése a szűrő szerint`

---

## 2026-08-31 – Szűrő bottom sheet (`FilterSheet`)

**Mit:** Elkészült a `components/FilterSheet.tsx` a
`docs/mockups/extracted/szuro-bottom-sheet.html` szerint: grabber, „Szűrő" /
„Kész" fejléc, Szezon és Csapat szekció, halványuló elválasztó, lábjegyzet.
Az aktív sor `surface3` háttérrel, bal oldali 2pt cián sávval és pipával jelöl,
a szezonok JetBrains Monóval, a csapatok DM Sansszal futnak. A választás
azonnal érvényesül a `filterStore`-ban (a mockupban sincs „Mégse"), a „Kész"
csak bezár.

Zárás négyféleképpen: „Kész", a scrimre koppintás, a fejléc lehúzása
(96pt vagy 800 px/s fölött), és **Android hardveres back** a `Modal`
`onRequestClose`-ával. A nyitás/zárás saját Reanimated animáció
(300 ms, `Easing.out(Easing.cubic)`), a scrim opacitása a sheet
pozíciójából interpolálódik, így lehúzás közben együtt halványul.

A listákat a sheet maga kéri a `useFilterData`-ból (a modulszintű cache miatt
ez nem plusz kérés). Hiba esetén a lista fölött hibapanel jelenik meg „Újra"
gombbal, ami a hook `reload()`-ját hívja – ezzel az S4 hibakezelési sorának
egy darabja már él, de a sor nyitva marad, mert a képernyők még nincsenek meg.
A betöltés alatti helykitöltő sorok egyelőre shimmer nélküliek; azt az S5
`SkeletonBlock` hozza majd.

A mockup halványuló szélű elválasztóját `react-native-svg` gradienssel
rajzoljuk. Ez nem új dependency: a `lucide-react-native` úgyis behúzza, és így
nem kellett a mockuptól tömör vonalra egyszerűsíteni.

A kipróbáláshoz a füstteszt képernyő (`app/index.tsx`) fejlécébe bekerült a
mockup szerinti szűrő-chip (`2025/2026 · Atomerőmű ▾`), ami megnyitja a
sheetet. Ez **ideiglenes**: a végleges helye az S6 tab-fejléce.

**Fájlok:** `components/FilterSheet.tsx`, `app/index.tsx`,
`constants/theme.ts` (`colors.scrim`, `border.row`), `tailwind.config.ts`
(`scrim`, `line-row`, 48-as spacing)

**Tesztelve:** `npm run typecheck` és `npm run lint` hibátlan – utóbbi
átszervezést kényszerített, lásd D-016. `npx expo export` **iOS-re és
Androidra is** lefut, és mindkét bundle tartalmazza a komponenst
(`filterSheetDivider` az SVG gradiensből).

**Nyitva maradt:** **Szimulátoros/eszközös vizuális ellenőrzés még nem
történt** – a sheet megjelenését, az animációt, a lehúzás-gesztust és az
Android hardveres back gombot élőben kell végigkattintani. Az Android ág
(hardveres back, `statusBarTranslucent` scrim a státuszsáv alatt, RNGH a
natív `Modal`-on belül) továbbra sem futott, mert nincs emulátor ezen a gépen.
16 csapatnál a lista görgethető – ezt is élőben érdemes megnézni.

**Commit:** `feat: szűrő bottom sheet szezon- és csapatválasztással`

---

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

## D-015 – A bottom sheet natív `Modal` + saját Reanimated animáció
**Dátum:** 2026-08-31
**Döntés:** A `FilterSheet` React Native `Modal`-ra épül (`transparent`,
`animationType="none"`, `statusBarTranslucent`), a csúszást és a scrim
halványulását magunk animáljuk Reanimatedben, a lehúzást
`react-native-gesture-handler` `Pan` gesztusa adja a fejlécen.
**Miért:** Így nincs új dependency, és a `Modal` `onRequestClose`-a **ingyen
hozza az Android hardveres back gombot**, amit a `CLAUDE.md` kötelezővé tesz.
A natív `animationType="slide"` a scrimet is együtt csúsztatná, a mockup viszont
álló scrimet és külön csúszó sheetet mutat. A gesztust csak a fejlécen figyeljük,
hogy a 16 elemű csapatlista görgetésével ne versenyezzen.
**Alternatíva:** `@gorhom/bottom-sheet` – kényelmesebb (snap pointok, backdrop),
de új dependency egyetlen sheetért, és a `CLAUDE.md` ~12 csomagos plafonja szűk.
Vagy a sheetet a gyökér layoutba tett abszolút réteggel megoldani – akkor a back
gombot kézzel, `BackHandler`-rel kellene kezelni.
**Visszavonható?** Igen, egy fájl.

## D-016 – A sheet animációját `useDerivedValue` hajtja, nem `useEffect`
**Dátum:** 2026-08-31
**Döntés:** A nyitottságot (`progress`) egy `useDerivedValue` számolja a
`visible` propból, a záró unmountot az animáció `withTiming` visszahívása
intézi (`runOnJS(setMounted)`), a nyitás `mounted` flagjét pedig renderidőben
állítjuk (`if (visible && !mounted) setMounted(true)`). A sheet magassága sima
`useState`, nem shared value.
**Miért:** Az `eslint-config-expo` React Compiler szabályai (`react-hooks/
immutability`, `react-hooks/set-state-in-effect`) **hibával elutasítják** a
Reanimated dokumentációjában szokásos mintát: shared value írása effectből, és
`setState` effect-törzsben. A `useDerivedValue`-s alak ugyanazt csinálja
kevesebb kóddal, effect nélkül, és átmegy a linten. Ugyanezért lett a
magasság state: a `onLayout` JS-oldali visszahívás, onnan shared value-t írni
szintén tiltott – a worklet így a sima számot zárja körbe.
**Alternatíva:** `// eslint-disable-next-line` a négy helyre – gyors, de a
következő komponensnél ugyanígy visszajönne, és a szabály kikapcsolásával
elveszne a valódi hibák jelzése is.
**Következmény:** Minden további animált komponensnél ezt a mintát kövessük:
shared value-t csak worklet ír, prop-vezérelt animáció `useDerivedValue`-val.
**Visszavonható?** Igen, de a lint akkor pirosra vált.

## D-017 – A sheet magassága tartalomfüggő, nem a mockup fix 508pt-ja
**Dátum:** 2026-08-31
**Döntés:** A sheet a tartalmához igazodik, felső korláttal: legfeljebb a
képernyő magassága mínusz a felső safe area és 24pt. A két szekció közös
`ScrollView`-ban görög, a lábjegyzet és a fejléc fix marad.
**Miért:** A mockup 4 szezonnal és 3 csapattal számolt, élesben viszont **5
szezon és 16 csapat** van – fix 508pt-tal a csapatlista fele levágódna. A
tartalomfüggő magasság kevés elemnél pontosan a mockup arányait adja vissza,
soknál pedig görgethető marad.
**Alternatíva:** Fix magasság a mockup szerint, belül görgetéssel – kevés
elemnél üres helyet hagyna a lábjegyzet fölött. Vagy snap pointok
(fél/teljes magasság) – a `@gorhom/bottom-sheet` nélkül sok kód.
**Visszavonható?** Igen, egy stílus.

## D-018 – Új tokenek a mockupból: `colors.scrim` és `border.row`
**Dátum:** 2026-08-31
**Döntés:** A `constants/theme.ts` két ponton bővült: `colors.scrim`
(`rgba(2,6,14,0.6)`, a modal mögötti elsötétítés) új, a `shade.rowActive`
(`#16233D`) pedig `border.row` néven került a `border` csoportba. A
`tailwind.config.ts` `scrim` és `line-row` néven kapta meg őket.
**Miért:** Mindkét érték **szó szerint az elfogadott szűrő-mockupból** jön, nem
új design ötlet – csak eddig nem volt hova írni őket, márpedig hardcoded hexet
a `CLAUDE.md` tilt. Az átnevezés azért kellett, mert a `#16233D` valójában a
listasorok **elválasztó vonala**, az aktív sor háttere ellenben `surface3`
(`#162440`); a régi `rowActive` név pont a rossz helyre csábított volna. A
`shade` csoport kommentje szerint azokat az értékeket közvetlenül nem használjuk,
egy elválasztó vonal viszont közvetlen használat – ezért került a `border` alá.
A `shade.rowActive`-ra a projektben még nem hivatkozott semmi, így az átnevezés
nem érintett kódot. A `tailwind.config.ts` spacing skálája a 48-cal bővült (a
mockup listasor-magassága).
**Alternatíva:** A `shade.rowActive` megtartása a régi néven – kevesebb
mozgatás, cserébe félrevezető név a legelső listás komponensben.
**Visszavonható?** Igen, két fájl.

## D-019 – A csapatsorok DM Sans Medium betűvel futnak, nem 600-assal
**Dátum:** 2026-08-31
**Döntés:** A mockup `font-weight:600`-at kér a csapatnevekre; mi a meglévő
`DMSans-Medium` (500) fájlt használjuk.
**Miért:** A projektben három DM Sans súly van (Regular 400, Medium 500,
Bold 700) – 600 nincs. RN-ben a `fontWeight` **nem szintetizál** súlyt a
betöltött TTF-ből: vagy van fájl, vagy a legközelebbi kerül renderelésre,
platformonként eltérően. A Medium optikailag közelebb van a 600-hoz, mint a
Bold, és nem kell negyedik fontfájlt bundle-be tenni.
**Alternatíva:** `DMSans-SemiBold.ttf` felvétele – pontos lenne, de +1 asset
és egy új `fontFamily` token mindössze ennyiért.
**Visszavonható?** Igen, egy fontfájl és két sor.

## D-020 – A `useGameData` a szűrőt maga olvassa, és szűrőpáronként cache-el
**Dátum:** 2026-08-31
**Döntés:** A hook nem kap paramétert: a `selectedSeasonId` / `selectedTeamId`
párost a `filterStore`-ból, a csapatneveket a `useFilterData`-ból olvassa. A
letöltött adat egy modulszintű `Map`-ben, `szezon:csapat` kulccsal cache-elődik.
**Miért:** A webes párja négy paramétert kap (`seasonId`, `teamId`, `allTeams`,
`allSeasons`), mert ott a dashboard komponens tartja a state-et. Mobilon a szűrő
**globális és perzisztált**, így minden képernyőnek ugyanazt kellene
átpasszolnia – felesleges propfüzér. A kulcsolt cache adja a `CLAUDE.md` „cache
a szűrő élettartamára" elvárását: tabváltáskor nem indul új hálózati kérés, de
szezon- vagy csapatváltásnál igen. A Map legfeljebb szezon × csapat méretű
(most 5 × 16), tehát nem nő el.
**Alternatíva:** Paraméteres hook, mint a weben – tesztelhetőbb, de minden
képernyőn négy prop. Vagy Zustand store az adatnak – negyedik store ugyanezért.
**Visszavonható?** Igen, egy fájl.

## D-021 – A csapat KPI-ok a `games` tábláról jönnek, nem a szezonstat tábláról
**Dátum:** 2026-08-31
**Döntés:** Az átlag szerzett/kapott pont és a győzelem/vereség mérleg a `games`
sorok `our_score` / `opp_score` / `result` mezőiből számolódik. A hook **nem
használja** a `@core/season-tables`-t, pedig a feladatsor említi.
**Miért:** A `games` tábla már tartalmazza a végeredményt, tehát a csapatszintű
átlagokhoz nincs szükség a `player_game_stats_<szezon>` tábla több száz sorára –
a webes hook azért összegez játékosonként, mert ott a játékosadat úgyis kell. Egy
mobil KPI-ért egy nagy lekérdezést futtatni pazarlás mobilneten. A
`getSeasonStatsTable()` ott lesz kötelező, ahol tényleg játékosbontás kell:
a `usePlayerData` és a meccs részletei box score.
**Alternatíva:** A webes logika másolása – konzisztens lenne a weboldallal, de
lassabb, és két forrásból számolná ugyanazt a számot.
**Következmény:** Ha a `games.our_score` és a játékosonkénti pontösszeg
eltérne (hiányos box score import), a mobil KPI a `games` értékét mutatja – ez
a helyes, mert az a hivatalos végeredmény.
**Visszavonható?** Igen, egy függvény.

## D-022 – A meccsek időpont nélkül jelennek meg, mert az adatbázisban nincs
**Dátum:** 2026-08-31
**Döntés:** A `TeamGame.date` és a `Fixture.gameDate` **nap pontosságú** ISO
szöveg. A mockup „2026. szeptember 6. · szombat 18:00" sorából a kezdési
időpont kimarad.
**Miért:** Sem a `games.date`, sem a `league_fixtures.game_date` nem tárol
időt (élesben ellenőrizve: minden érték `ÉÉÉÉ-HH-NN`), és a fixtures táblában
nincs más időpont oszlop sem. A hiányzó időt kitalálni nem lehet, kamu
18:00-t kiírni pedig félrevezetné a stábot – pont ők tudják, mikor kezd a
csapat.
**Alternatíva:** Séma-bővítés a weben (`game_time` oszlop + scraper) – a mobil
app nem ír sémát, ez webprojekt-feladat. Ha megvan, itt egy mezőt kell hozzáadni.
**Visszavonható?** Igen, ha az adat megjelenik.

## D-023 – A `is_active` a view-ból jön, nem külön `players` lekérdezésből
**Dátum:** 2026-09-01
**Döntés:** A játékos aktív státusza a `player_season_stats_by_season` view
`is_active` mezője. A webprojekt ezt felülírja egy külön `players` lekérdezéssel
(`isActiveOverride`), a mobil app nem.
**Miért:** A view **tartalmazza** az `is_active` oszlopot, és élesben
összehasonlítva a `players` táblával a 2025/2026 (13 sor) és a 2024/2025 (15 sor)
ASE-keretben **nulla eltérés** volt. Egy második lekérdezés mobilneten fizetett
kérés egy olyan mezőért, amit már megkaptunk.
**Alternatíva:** A webes override átvétele – akkor véd, ha a view tényleg
késésbe esik, de ezt az adat nem támasztotta alá.
**Következmény:** Ha egyszer mégis szétcsúszik a kettő, a mobil a view értékét
mutatja; a javítás egy `.in('id', playerIds)` lekérdezés a hookban.
**Visszavonható?** Igen, néhány sor.

## D-024 – A `usePlayerData` csak szezonösszesítést tölt, meccsbontást nem
**Dátum:** 2026-09-01
**Döntés:** A hook `gameHistory`-ja üres marad, és nem használja a
`@core/season-tables` `getSeasonStatsTable()`-jét (a D-021 még úgy számolt, hogy
itt majd kell). A meccsenkénti bontást a játékos részletei képernyő tölti majd
külön hookkal, egy játékosra szűrve.
**Miért:** A szezonösszesítés a view-ból egyetlen, szezonra és csapatra szűrt
lekérdezés (13–15 sor). A `gameHistory`-hoz a szezon-tábla összes sorát le
kellene kérni a csapat minden meccsére (~700 sor), pedig a **lista** képernyő
egyetlen mezőjét sem használja – ez pontosan a `CLAUDE.md` „mobilon soha ne
tölts be mindent" szabályába ütközne.
**Alternatíva:** A webes `useGameData` másolása, ami egyben tölti a kettőt –
kevesebb hook, cserébe minden játékoslista-nyitás behúzza a teljes meccsbontást.
**Visszavonható?** Igen, a `gameHistory` egy opció a mappingben.

## D-025 – A pozíciófeliratok a webprojekt öt kanonikus nevét használják
**Dátum:** 2026-09-01
**Döntés:** A `data/position-labels.ts` a `@core/positions` öt kódjához a
webprojekt `SeasonComparison` névsorát rendeli: Irányító / Dobóhátvéd / Bedobó /
Erőcsatár / Center. A `Jatekosok Lista` mockup kitalált nevei („Bedobó szélső",
„Bedobó hátvéd") **nem** kerülnek be.
**Miért:** A mockup demóadata magyar példaneveket és szabadon írt pozíciókat
tartalmaz; az éles adatbázis viszont kódot tárol (`2-3`, `5-4`), amit a
`resolvePrimaryPosition()` fordít le. Ugyanazt a játékost a weben és a mobilon
ugyanannak kell hívni, különben a stáb két különböző szót lát ugyanarra.
**Alternatíva:** A mockup szavai – szebbek, de sehol máshol nem léteznek.
**Visszavonható?** Igen, egy fájl öt sora.

## D-026 – A lekérdezés-cache modulszintű, nem Zustand store
**Dátum:** 2026-09-01
**Döntés:** A letöltött adat a `lib/query-cache.ts` modulszintű `Map`-jeiben ül
(hookonként egy cache, `szezon:csapat` kulccsal), nem Zustand store-ban, pedig
a feladatsor „cache a store-ban"-t írt. Elévülés (TTL) nincs: az adat a szűrő
váltásáig vagy a `reload()`-ig érvényes, kijelentkezéskor pedig ürül.
**Miért:** Ez nem UI state – egyetlen komponens sem iratkozik fel rá
közvetlenül, a képernyők a hookok visszatérési értékét nézik. Store-ként minden
lekérdezés minden feliratkozót újrarenderelne, cserébe semmit nem adna a
`Map`-hez képest. A TTL-t azért hagytam ki, mert találgatás lenne, hogy meccs
közben 1 vagy 5 perc a jó – a képernyők úgyis kapnak lehúzásos frissítést
(S6), az pedig a `reload()`-ot hívja.
**Alternatíva:** Negyedik Zustand store az adatnak (D-020 már elvetette), vagy
React Query – az utóbbi új függőség, és a `CLAUDE.md` kifejezetten tiltja.
**Következmény:** Ha az app órákig nyitva marad ugyanazon a szűrőn, a
felhasználó addig a belépéskori adatot látja, amíg nem frissít kézzel.
**Visszavonható?** Igen, a TTL néhány sor a `createQueryCache`-ben.

## D-027 – A háttérben lévő tab nem tölt újra, csak fókuszba kerülve
**Dátum:** 2026-09-01
**Döntés:** A `useCachedQuery` a `useIsFocused()`-öt (expo-router, nem új
csomag) nézi, és csak fókuszban lévő képernyőn indít lekérdezést. Szűrőváltás
után a háttérben lévő tabok kérése addig vár, amíg a felhasználó oda nem lép.
**Miért:** Az Expo Router a meglátogatott tabokat mountolva tartja, így egy
szezonváltás egyszerre 3-5 lekérdezést indítana el olyan képernyőkre, amelyeket
a felhasználó lehet, hogy meg sem néz – mobilneten ez fizetett adat és lassabb
válasz annak a tabnak, amit tényleg néz. Ez pontosan a `CLAUDE.md` „mobilon
soha ne tölts be mindent" szabálya.
**Alternatíva:** Minden mountolt képernyő azonnal frissít – egyszerűbb, de
pazarló; vagy a képernyők maguk hívnak `useFocusEffect`-et – ugyanaz a logika
minden képernyőn megismételve.
**Következmény:** Minden adathook (és a rájuk épülő `FilterSheet`) **csak
navigátoron belül** használható: a `useIsFocused` navigációs kontextus nélkül
hibát dob. Ez ma minden hívási helyre igaz.
**Visszavonható?** Igen, egy sor a `useCachedQuery`-ben.

## D-028 – Egy `ErrorPanel` két alakkal, az `EmptyState` gomb nélkül
**Dátum:** 2026-09-01
**Döntés:** A hibapanel egyetlen komponens `block` és `inline` változattal, az
üres állapotnak pedig nincs akciógombja.
**Miért:** A hiba két helyen néz ki máshogy: a képernyő közepén álló panel
elbírja a 44pt-os gombot, a szűrő sheet listája fölött viszont egy soros
figyelmeztetés kell, hogy a lista használható maradjon. Ez ugyanaz a fogalom,
ugyanazzal a `glow.negative` rétegzéssel – két külön komponens duplikálná a
stílusokat. Az `EmptyState` azért gombtalan, mert az üres eredmény nem hiba:
nem újrapróbálni kell, hanem szűrőt váltani, azt pedig a fejléc chipje intézi.
**Alternatíva:** Külön `InlineError` komponens (több fájl, ugyanaz a token
készlet), illetve `EmptyState` akciógombbal (a gombstílus így két komponensben
duplikálódna – ha később kell, közös gombkomponens lesz belőle).
**Következmény:** A `variant` prop nő, ha új környezet jön (pl. StatMatrix
fejléce alatt). Kettőnél több alaknál érdemes lesz szétszedni.
**Visszavonható?** Igen, a két ág független.

## D-029 – A hálózati hiba magyar üzenetet kap, az adatbázishiba nem
**Dátum:** 2026-09-01
**Döntés:** A `useCachedQuery` a `Network request failed` / `Failed to fetch` /
timeout mintákra saját magyar mondatot ad („nincs kapcsolat a szerverrel"),
minden más hibánál a Supabase üzenetét fűzi a magyar címke után.
**Miért:** A kapcsolathiányt a felhasználó tudja orvosolni, ezért érthető
magyar mondat kell rá – ez az egyetlen hiba, amit a stáb a lelátón tényleg
látni fog. A PostgREST hibák viszont fejlesztői hibát jeleznek (rossz
táblanév, RLS), ott a pontos angol üzenet többet ér, mint egy általános
„Hiba történt".
**Alternatíva:** Minden hibát általános magyar mondatra cserélni – a
hibakeresést vakká tenné; vagy semmit nem fordítani – a leggyakoribb esetben
angol szöveget mutatna.
**Következmény:** A mintaillesztés sztringalapú, tehát ha a React Native
megváltoztatja a `fetch` hibaüzenetét, az angol szöveg átcsúszik a felületre.
**Visszavonható?** Igen, egy `if` a `describeError`-ban.

<!-- ÚJ DÖNTÉSEK IDE, ALULRA, NÖVEKVŐ SORSZÁMMAL -->

## D-030 – A `GlowCard` keret és külső glow nélkül, csak accent sávval
**Dátum:** 2026-09-01
**Döntés:** A `GlowCard` alapból **nem** kap `subtle` keretet, és a mockup külső
glow-ját (`box-shadow: 0 0 24px rgba(255,107,53,0.08)`, illetve a sáv
`0 0 14px`-es fénye) sem próbáljuk utánozni. A kiemelést kizárólag a bal oldali
3pt-os accent sáv adja.
**Miért:** A `CLAUDE.md` komponens-táblája „surface1 háttér, subtle border"-t ír, de
mind az öt elfogadott mockupban **egyetlen kártyán sincs keret** – a `#0A1628`
felületek mind csupaszok, keret csak inputon, badge-en és a tabsáv tetején van.
A mockup a mérvadó (D-008). A külső glow pedig színes, elmosott árnyék, amit RN
Androidon nem renderel (D-005); a keret nélküli, sávval jelölt kártya mindkét
platformon azonos.
**Alternatíva:** `bordered` prop a `CLAUDE.md` szövegéhez – de egyetlen mockup sem
használná, tehát halott kapcsoló lenne. A glow-ra Skia `BlurMask` réteg jöhetne
szóba; ez egy kártyaháttérhez aránytalan, és a chartokig (S7) a Skia egyébként
sincs telepítve.
**Visszavonható?** Igen, prop hozzáadásával, a hívók érintése nélkül.

## D-031 – A trendjel lucide ikon, nem ▲ / ▼ / ▬ karakter
**Dátum:** 2026-09-01
**Döntés:** A `StatTile` változásjelzője lucide `Triangle` (kitöltve, lefelé
180°-kal forgatva) és `Minus` ikon, nem a mockup ▲ / ▼ / ▬ karaktere.
**Miért:** A repóba csomagolt három betűcsalád mind **subset**: a `cmap`
táblájuk 222–229 kódpontot tartalmaz, és a U+25B2 / U+25BC / U+25AC (valamint a
U+25BE) egyikben sincs benne. Hiányzó glifánál iOS csendben rendszerbetűre vált
– más szélességgel, elrontva a numerikus igazítást –, Android viszont tofut
rajzol. A kitöltött háromszög alakja ikonnal pontosan hozható, és a mérete a
`size` proppal a 11pt-os szöveghez igazítható.
**Alternatíva:** (a) teljes, nem subsetelt betűfájlok – három fájl mérete
nőne meg jelentősen egyetlen három glifáért; (b) a monóban meglévő U+2191 /
U+2193 nyíl – ez viszont már **más jel**, nem a jóváhagyott mockupé (D-008).
**Visszavonható?** Igen, a `TrendMark` egy függvénye; ha valaha teljes
betűkészlet kerül be, visszaírható a karakter.

## D-032 – A `StackedRow` nem a `GlowCard`-ra épül
**Dátum:** 2026-09-01
**Döntés:** A listasor saját felületet rajzol (háttér, sarok, sáv), nem a
`GlowCard`-ot csomagolja be, és a kiemelés sávja 2pt, nem a `GlowCard` 3pt-os
accentje.
**Miért:** A két alak három ponton tér el a mockupban: (a) a sor magassága fix
68pt, függőleges margó nélkül, a `GlowCard` viszont egyetlen `padding` számmal
dolgozik körben; (b) a sor sávja 2pt és **nem** tolja el a tartalmat (a bal
margó marad 16pt), a `GlowCard`-é 3pt és megnöveli a `paddingLeft`-et; (c) a sor
sávja állapotfüggő (kiválasztott / lenyomott), a kártyáé statikus jelölés. Ezek
kikapcsolásához a `GlowCard`-nak három új propot kellene kapnia, amit egyetlen
kártya sem használna.
**Alternatíva:** `GlowCard` bővítése `barWidth` / `inset` / `paddingVertical`
propokkal – ettől a kártya API-ja a listasor kedvéért hígulna fel. Az érdemi
közös rész (accent hangnem → szín) így is meg van osztva a
`constants/theme.ts` `accentColor` exportján keresztül.
**Visszavonható?** Igen, a két komponens független, egyik hívóit sem érinti.

## D-033 – Az oszlopfeliratok 0.12em betűközzel futnak, nem a mockup 0.1em-jével
**Dátum:** 2026-09-01
**Döntés:** A `StackedRowHeader` feliratai a meglévő `tracking.label` (0.12em)
tokent használják, nem a mockup 0.1em értékét.
**Miért:** 11pt-on a különbség 1.32pt vs 1.10pt, azaz 0.22pt az egész feliraton
– optikailag nem megkülönböztethető. A `CLAUDE.md` ALL CAPS labelre 1.2–1.6pt
betűközt ír elő, amibe a mockup 1.10pt-ja bele sem fér, a `tracking.label`
viszont igen. Új token felvétele engedélyköteles (`CLAUDE.md` – döntési
szabályok), és egyetlen felirattípusért nem indokolt bővíteni a skálát.
**Alternatíva:** `tracking.wide` (0.08em = 0.88pt) – az a gombfelirat tokenje és
még messzebb esik; vagy új `tracking` érték – ehhez a te jóváhagyásod kellene.
**Visszavonható?** Igen, egy sor a `StackedRow` `headerLabel` stílusában.

## D-034 – A mátrix sormagassága fix szám, nem a tartalom magassága
**Dátum:** 2026-09-01
**Döntés:** A `StatMatrix` fejléc- és adatsorai fix magasságúak (30pt / 34pt),
és a szövegek explicit `lineHeight`-ot kapnak; a magasság nem a tartalomból
adódik.
**Miért:** A fagyasztott névoszlop és a görgethető számterület két külön
nézetfa, egymás magasságáról nem tudnak. Ha a magasságot a tartalom adná, a
DM Sans 13pt-os név és a JetBrains Mono 13pt-os szám eltérő sormagassága
soronként pár tized ponttal elcsúsztatná a két oldalt, és a hiba a lista alján
halmozódna – pont ez a fagyasztott oszlopos táblázatok klasszikus hibája. A
mockup 8+8pt margója és a szövegsor együtt épp ezt a 30 / 34pt-ot adja ki.
**Alternatíva:** `onLayout`-tal soronként megmérni a magasabb oldalt, és a
másikat arra állítani – egy extra render kör soronként, mindezt azért, hogy a
mockup fix magasságát kiszámoljuk. Vagy egyetlen sorban tartani a nevet és a
számokat (nincs fagyasztott oszlop), de akkor a név elgörög a képernyőről.
**Következmény:** Nagy rendszer-betűméretnél a sor nem nő, a szöveg vágódik.
Ez tudatos csere: az elcsúszott mátrix olvashatatlan, a vágott név nem.
**Visszavonható?** Igen, két konstans a `StatMatrix`-ben.

## D-035 – A fagyasztott oszlop `boxShadow`-t kap, ez kivétel a D-005 alól
**Dátum:** 2026-09-01
**Döntés:** A fagyasztott oszlop jobb oldali mélységárnyéka a mockup szerinti
`boxShadow: '2px 0px 8px rgba(0,0,0,0.4)'`, nem accent-réteg és nem
`shadowColor` + `elevation` páros.
**Miért:** A D-005 a **színes** glow-t tiltja, mert az Androidon nem
renderelődik – ez viszont fekete mélységárnyék, amit az RN 0.76 óta létező
`boxShadow` prop mindkét platformon egységesen rajzol (a projekt az új
architektúrán fut, RN 0.86). A `shadowColor`/`elevation` páros itt rosszabb:
az `elevation` körbe rajzol, nem csak jobbra, és a nézet z-sorrendjét is
átírja. Az árnyék csak mélységjel, az elválasztást az 1pt-os `border.subtle`
keret adja – ha egy régi Androidon nem renderelődne, a mátrix attól még helyes.
**Alternatíva:** `react-native-svg` gradienssáv az árnyék helyén – működne, de
egy SVG réteg minden mátrixban azért, amit egy stílussor megold; vagy árnyék
nélkül, csak kerettel – a mockuptól való eltérés lenne.
**Visszavonható?** Igen, egy sor a `StatMatrix` `frozen` stílusában.

## D-036 – A badge fix sormagassággal és kikapcsolt Android betűpaddinggel fut
**Dátum:** 2026-09-02
**Döntés:** A `Badge` `Text`-je explicit `lineHeight: 14`-et kap, és
`includeFontPadding: false`-t állít.
**Miért:** A badge doboza a szöveg magasságából nő ki (3pt függőleges margó +
1pt keret), így a platformok eltérő alapértelmezett sormagassága és az Android
`includeFontPadding` extra betűpaddingje eltérő magasságú címkét adna a két
platformon – ugyanabban a sorban, ugyanazon kártya fejlécében. A fix érték a
mockup ~1.2-es sorközét adja vissza 11pt-on. Az `includeFontPadding` Androidon
kívül nem értelmezett mező, ezért nem igényel `Platform` elágazást.
**Alternatíva:** Fix `height` a dobozon – az viszont a rendszer nagyobb
betűméreténél elvágná a feliratot. Vagy hagyni az alapértelmezést, és elfogadni
az 1–3pt-os platformeltérést – egy fejlécsorban ez látható elcsúszás.
**Visszavonható?** Igen, két stílusmező.

## D-037 – A skeleton gradiens sweep, és ehhez új `duration.shimmer` token jött
**Dátum:** 2026-09-02
**Döntés:** A `SkeletonBlock` egy `react-native-svg` gradienssávot futtat át a
blokkon 1200ms-os, lineáris, végtelen ciklusban. Ehhez új token került a
`constants/theme.ts`-be: `duration.shimmer = 1200`.
**Miért:** A betöltési állapotra nincs mockup, ezért a három szóba jöhető
irányt (gradiens sweep / opacitás pulzálás / statikus blokk) felvetettem, és a
gradiens sweep lett a választott – ez felel meg a `CLAUDE.md` „shimmer, nem
spinner" előírásának. A meglévő `duration` értékek (200/300/400) egy végtelen
ciklusban kapkodónak hatnának, a lista-stagger 60ms pedig nem erre való, ezért
a periódus külön tokent kapott ahelyett, hogy a komponensben állna egy szám.
A gradiens SVG-ből jön, mert egy `View` fénysávnak kemény éle lenne; a
`react-native-svg` már a `FilterSheet` miatt is dependency, új csomag nem
kellett.
**Alternatíva:** Opacitás pulzálás (2× `duration.slow`, új token nélkül,
viszont inkább „lélegzés", mint shimmer), vagy statikus helyőrző (nulla
animációs költség, de hosszabb töltésnél megfagyott appnak látszik).
Elvetettük az `expo-linear-gradient` felvételét is: ugyanazt tudná, de egy
plusz csomag árán.
**Visszavonható?** Igen, a komponens egyetlen fájl.

---

## D-038 – A `hitSlop` csak a szülő határain belül fog
**Dátum:** 2026-09-02
**Döntés:** Ahol a megnövelt érintési terület kilógna a szülő nézet határain,
ott nem a `hitSlop`-ot növeljük, hanem vagy a szülőnek adunk margót (a
`FilterSheet` fejléce, a füstteszt képernyő chip-sora), vagy magát a gombot
nagyítjuk 44pt-ra (`ErrorPanel` inline „Újra"). A `constants/theme.ts`
`tapTarget` tokenjének kommentje ezt kimondja.
**Miért:** Az érintéskeresés mindkét platformon felülről lefelé jár be a
nézetfát, és csak olyan gyerekbe lép be, amelynek a *saját* határain belül van
a pont: iOS-en a `UIView.hitTest:` a bounds-on kívül `nil`-t ad (a `RCTView`
`hitTestEdgeInsets`-e csak akkor számít, ha az ős egyáltalán eljut hozzá),
Androidon a `TouchTargetHelper` ugyanígy dolgozik. Egy 12pt-os slop egy 10pt
margójú panelen tehát nem 44pt-os célpontot ad, hanem továbbra is ~38pt-osat –
és ez a fajta hiba semmilyen típusellenőrzésen és lintelésen nem bukik el,
csak eszközön, „néha nem reagál" formában.
**Alternatíva:** Hagyni a kilógó slopot, arra számítva, hogy a felhasználó
úgyis a felirat közepére nyom. Ezt elvetettük: a `CLAUDE.md` 44pt-os szabálya
így csak papíron teljesülne. A másik szóba jött irány egy közös
`TapTarget` wrapper komponens volt, ami minden gombot 44pt-ra tölt ki – ez
viszont a mockup sűrű sorait (48pt-os sheet sorok, 32pt-os chip) felnyomná,
ezért maradt az esetenkénti döntés.
**Visszavonható?** Igen, elemenként néhány stílusmező.

---

## D-039 – A dátumformázás nem `Intl`-ből jön
**Dátum:** 2026-09-02
**Döntés:** A `lib/format.ts` kézzel felsorolt magyar hónap- és napneveket
használ, nem `toLocaleDateString('hu-HU')`-t. A tizedes elválasztó **pont**
(`82.4`), nem vessző.
**Miért:** A Hermes `Intl` támogatása platformonként eltér – Androidon a
rendszer ICU-jára delegál (gyártónként más adatokkal), iOS-en részleges saját
implementáció. Ugyanaz a hívás így két különböző szöveget adhatna a két
platformon, ráadásul régi Android eszközön néma tartalékra eshetne. Tizenkét
hónapnév és hét napnév kézzel felsorolva determinisztikus és nulla
futásidejű költség. A tizedes pont a mockup írásmódja (`82.4`, `76.8`), és a
`CLAUDE.md` szerint a mockup a mérvadó.
**Alternatíva:** `Intl` + `expo-localization` (plusz csomag, platformfüggő
kimenet), vagy magyar szokás szerinti tizedes vessző (a mockuptól eltérne, és
a JetBrains Mono tabuláris számjegyeivel a pont igazodik szebben).
**Visszavonható?** Igen, egyetlen modul.

## D-040 – A Ma képernyő KPI-jai és a hiányzó trendjelzők
**Dátum:** 2026-09-02
**Döntés:** A pont- és kapottpont-átlag a `games` tábláról jön (D-021), a
lepattanó- és eldobottlabda-átlag a `usePlayerData` már cache-elt
szezonsoraiból: a játékosonkénti összegek összeadva, a **csapat lejátszott
meccseivel** osztva. A mockup négy változásjelzője (▲ 3.1) v1-ben **egyik
csempén sem** jelenik meg.
**Miért:** A négy KPI-hoz így nem kell egyetlen új lekérdezés sem – a
`player_season_stats_by_season` ~15 sorát a Játékosok tab úgyis kéri, a
modulszintű cache-ből mindkét képernyő ugyanazt kapja. A trendhez viszont
meccsenkénti bontás kellene: a pontokhoz megvan a `games` tábla, a
lepattanóhoz és az eldobott labdához viszont a több száz soros
`player_game_stats_<szezon>` – ezt a belépés utáni első képernyőn nem akarjuk
lefuttatni. Két csempén jelző, kettőn semmi: a 2×2 rács aszimmetrikus lenne,
és a hiányzó jelző „nincs változás"-nak látszana. Ezért egyik sem kap jelzőt,
amíg mind a négyhez nincs adat.
**Alternatíva:** Csak a két pont-csempén trend (felemás rács), vagy a
meccsenkénti box score betöltése a Ma képernyőn (a legdrágább kérés a
legrosszabb helyen). Mindkettőt a megrendelővel egyeztetve vetettük el.
**Visszavonható?** Igen: a `StatTile` `trend` propja megvan és opcionális.

## D-041 – A kijelentkezés helye a beállítás sheet
**Dátum:** 2026-09-02
**Döntés:** A mockup fejlécének fogaskereke egy bottom sheetet nyit
(bejelentkezett email, app verzió, kijelentkezés gomb). Ehhez a `FilterSheet`
lapváza kikerült a közös `components/BottomSheet.tsx`-be.
**Miért:** A mockup az ikont tartalom nélkül mutatja, a kijelentkezés viszont
kell valahová – eddig az ideiglenes füstteszt képernyőn ült, ami most törlődött.
Beállítás képernyő nincs a scope-ban, egy sheet viszont nem új navigációs
szint. A közvetlen (megerősítéssel kijelentkeztető) fogaskerék félrevezető
lenne: az ikon nem ezt ígéri. A vázat azért emeltük ki, mert a második sheetnél
a mozgás, a záró gesztus és az Android back kezelése már ismétlés lett volna –
a `FilterSheet` viselkedése nem változott.
**Alternatíva:** Fogaskerék nélküli fejléc (nem lehetne kijelentkezni), vagy
teljes beállítás képernyő hatodik route-ként (a scope-on kívül).
**Visszavonható?** Igen, a sheet egy fájl.

## D-042 – Saját tabsáv, nem a navigátor alapértelmezettje
**Dátum:** 2026-09-02
**Döntés:** A `Tabs` a `tabBar` propon keresztül a saját
`components/TabBar.tsx`-ünket kapja.
**Miért:** A mockupban az aktív tabot egy 24×3pt-os cián sáv jelzi a tabelem
**tetején**, a felső vonalra ültetve. A beépített tabsáv csak ikont és
feliratot rendez el; a jelzést az ikon dobozába kellene abszolút pozícióval
becsempészni, ami a belső elrendezés apró változásaira is elcsúszna. A saját
sáv ~90 sor, és a magasságot (63pt + `insets.bottom`) is pontosan a mockup
szerint adja.
**Alternatíva:** `tabBarIcon` + abszolút pozíciós jelző (törékeny), vagy a
mockup jelzésének elhagyása (az aktív tab csak színnel különbözne).
**Visszavonható?** Igen, a `tabBar` prop elhagyásával.

## D-043 – Nap pontosságú visszaszámláló
**Dátum:** 2026-09-02
**Döntés:** A következő meccs kártya visszaszámlálója `7 NAP` / `HOLNAP` /
`MA` alakú, a mockup „7 NAP 04:12" helyett. A helyszín („Paks, Városi
Sportcsarnok") sem jelenik meg.
**Miért:** A `league_fixtures` sem kezdési időt, sem helyszínt nem tárol (a
sémát élesben ellenőriztük: `game_date` `date` típus, helyszín oszlop nincs) –
ez a D-022 folyománya. Órát és percet mutatni éjfélig visszaszámolva
pontosnak látszó, valójában kitalált adat lenne; a stáb pont azt tudja a
legjobban, mikor kezd a csapat. A „MA" és a „HOLNAP" külön eset, mert `0 NAP`
és `1 NAP` magyarul rosszul hangzik.
**Alternatíva:** Óra-perc pontos visszaszámlálás éjfélre (hamis pontosság),
vagy a visszaszámláló teljes elhagyása (a mockup egyik hangsúlyos eleme
tűnne el).
**Visszavonható?** Igen, ha a webprojekt felveszi a kezdési időt a sémába.

## D-044 – A meccslista egy `ScrollView`, két szekcióval, virtualizálás nélkül
**Dátum:** 2026-09-02
**Döntés:** A képernyő az összes sort egyszerre rendereli egy `ScrollView`-ban,
a közelgő találkozók felül, a lejátszott meccsek alul. Nincs `FlatList` és
nincs `SectionList`.
**Miért:** Egy szezon egy csapatra 30–45 meccs plusz néhány fixture, azaz
legfeljebb ~50 egyszerű sor (Pressable + 3 Text) – ez nagyságrendekkel a
virtualizálás haszonküszöbe alatt van, cserébe a `SectionList` a fejlécet
(`AppHeader` + cím) `ListHeaderComponent`-be, a szekciókat pedig egy
lapított adatszerkezetbe kényszerítené. A Ma képernyő is `ScrollView`-t
használ, így a két lista ugyanúgy viselkedik. A közelgők azért állnak elöl,
mert a stáb tipikusan a következő meccsre keres rá; a lejátszottak a hook
sorrendjét tartják (dátum szerint csökkenő).
**Alternatíva:** `SectionList` – natív szekciófejléc és virtualizálás, de több
kód és két adatszerkezet ugyanezért a képért. Vagy szűrőchipek
(Lejátszott / Közelgő váltás) – a mockup-készletben nincs rá minta, és a
teljes menetrend egyben áttekinthetőbb.
**Következmény:** Ha egy szezon meccsszáma jelentősen megnő (több csapat
összevont nézete, több éves lista), a képernyő `SectionList`-re váltandó.
**Visszavonható?** Igen, egy fájl.

## D-045 – A meccssor vezérjele a hazai/vendég jelzés, a fordulószám kimarad
**Dátum:** 2026-09-02
**Döntés:** A `StackedRow` bal oldali körében `H` / `V` áll (hazai/vendég), és
a fordulószám (`games.round`) sehol nem jelenik meg a listában. Az alcím a
dátum + az eredmény szava (`2026. május 25. · Nyert`).
**Miért:** A soron három információnak van helye a cím alatt, és 390pt-os
kijelzőn a felirat-sáv ~200pt: a dátum, a forduló és az eredmény együtt
kifutna, a `numberOfLines={1}` pedig pont a végét vágná le. A hazai/vendég
elemzési szempontból is releváns (hazai pálya előny), a forduló viszont egy
dátum szerint rendezett listában redundáns, ráadásul a mezőnk nullázható
(`round: number | null`), tehát a köröknek fele üresen maradhatna – az pedig
elrontaná a sorok igazítását. Az eredmény azért van szóban is kiírva, mert a
számoszlop színe (zöld/piros) önmagában nem hordozhatja az információt.
**Alternatíva:** Fordulószám a körben és a hazai/vendég a Badge-ben (a
`StackedRow` nem tud badge-et fogadni), vagy a forduló az alcím végén
(levágódna).
**Visszavonható?** Igen, néhány sor a `GameRow`-ban.

## D-046 – A részletképernyő a lista cache-éből dolgozik, és nem visel `AppHeader`-t
**Dátum:** 2026-09-02
**Döntés:** A `games/[id]` a meccs sorát (ellenfél, dátum, eredmény, forduló)
a `useGameData` szűrőpáronkénti cache-éből veszi, nem kérdezi le újra a
`games` táblát. A képernyő tetején nem az `AppHeader` áll, hanem az új
`BackHeader` (visszalépés sáv).
**Miért:** A listáról érkezve a sor már a memóriában van, tehát a fejléc
hálózati kör nélkül kirajzolható; a részletek három lekérdezése így csak
azt tölti, ami tényleg hiányzik. Az `AppHeader` szűrő-chipje viszont pont
azt az adatot cserélné ki a lába alól, amiből a képernyő él: másik szezonra
váltva a meccs eltűnik a listából. A `BackHeader` ugyanazt a 44pt-os magasságot
és 16pt-os bal margót tartja, tehát a fejlécsáv optikailag nem ugrik meg.
**Alternatíva:** Külön `games` lekérdezés `id` szerint – független a szűrőtől,
de egy plusz kör minden megnyitáskor, és a mély link amúgy sincs v1 scope-ban.
**Következmény:** Ha a meccs nincs a kiválasztott szűrőben (pl. szűrőváltás
után visszalépés a historyban), a képernyő `EmptyState`-et mutat. A jövőbeli
játékos-részletek képernyő ugyanezt a mintát követheti.
**Visszavonható?** Igen: a hookba egy `games` lekérdezés fallbackként bevehető.

## D-047 – A hiányzó szekciók magyarázó sort kapnak, nem tűnnek el
**Dátum:** 2026-09-02
**Döntés:** A `Negyedek`, a `Box score` és az `Elemzés` szekció címkéje mindig
kirajzolódik; ha nincs adat, egy halk (`text.muted`, DM Sans 13) mondat áll a
helyén („Ehhez a meccshez nincs negyedenkénti bontás importálva.").
**Miért:** A negyedenkénti bontás a kosarstat importból jön, és a
meccseknek csak töredékéhez van meg (a 2025/2026-os szezonban 35 meccshez);
riport is csak néhány meccshez készült. Ha ilyenkor eltűnne a szekció, a
felhasználó nem tudná eldönteni, hogy az app nem tudja megmutatni, vagy az
adat hiányzik – a képernyő ráadásul meccsenként más magasságúra ugrálna.
**Alternatíva:** A szekció elrejtése (rövidebb képernyő, de néma hiány), vagy
teljes `EmptyState` blokk (ikondobozos, 100pt magas – három hiányzó szekciónál
ez kitöltené a képernyőt).
**Visszavonható?** Igen, komponensenként egy feltétel.

## D-048 – A box score-ból kimarad a plusz-mínusz oszlop
**Dátum:** 2026-09-02
**Döntés:** A `StatMatrix` 12 oszlopa: Perc, Pont, 2P, 3P, Bü, LP, GP, LS, BD,
LV, SZ, Ért. A webes tábla `±` oszlopa nincs köztük.
**Miért:** A `plus_minus` mező az importban gyakorlatilag üres: a 2025/2026-os
szezon 7402 játékossorából 5-ben nem nulla, a 2024/2025-ösben 3-ban. Egy
csupa nullát mutató oszlop mobilon fél görgetésnyi helyet visz el, és azt
sugallná, hogy mindenki pont nullás mérleggel játszott. A `Pont` narancs és az
`Ért` cián kiemelése viszont a webes táblát követi, hogy a két felület
ugyanúgy olvasódjon.
**Alternatíva:** Az oszlop megjelenítése (a webbel azonos képért), vagy
feltételes megjelenítés, ha a meccsen bárkinél nem nulla – ez utóbbi
meccsenként változó oszlopszámot adna, ami a mátrixban zavaró.
**Következmény:** Ha az import egyszer kitölti a `plus_minus`-t, az oszlop egy
sorral visszavehető a `BoxScore` `COLUMNS` listájába.
**Visszavonható?** Igen, egy sor.

## D-049 – A riport nyolc sorra csukva indul, gombbal nyílik
**Dátum:** 2026-09-02
**Döntés:** A `ReportCard` a `narrative`-ot `numberOfLines={8}`-cal mutatja, és
egy 44pt-os „Teljes riport" / „Összecsukás" gomb nyitja ki. A gomb csak 360
karakternél hosszabb szövegnél jelenik meg.
**Miért:** A mentett riportok 3 900–6 300 karakteresek, ami mobilon 60–90 sor:
kinyitva a képernyő aljára tett `Elemzés` szekció mindent maga alá temetne, és
a box score-hoz visszagörgetni több képernyőnyi utat jelentene. A 360 karakteres
küszöb a nyolc sor × ~45 karakter becslése DM Sans 13pt-on – ennél rövidebb
szövegnél a gomb csak zavarna. A szöveg nyers bekezdésekként jelenik meg
(a `narrative` sima szöveg, nem markdown), formázó nélkül.
**Alternatíva:** Külön riport-képernyő (több navigáció egy olvasásért), vagy
mindig teljes szöveg (a szekció használhatatlanul hosszú lenne).
**Visszavonható?** Igen, egy propra kivezethető.

## D-050 – A harmadik számoszlop követi a rendezést
**Dátum:** 2026-09-02
**Döntés:** A játékoslista három numerikus oszlopa alapból PPG / RPG / APG.
Ha a rendezés `PERC` vagy `HATÉKONYSÁG` – tehát nem a látható három egyike –,
az `APG` helyére az aktív szempont lép (`PERC`, illetve `ÉRT`).
**Miért:** A mockup mind az öt chiphez ugyanazt a három oszlopot mutatja, így a
`PERC` és a `HATÉKONYSÁG` szerinti sorrend olyan szám szerint állna, amit a
felhasználó sehol nem lát – egy 14 soros listában ez rendezetlennek látszik.
A sorra három oszlop fér el (48pt-os oszlop + 16pt köz, 20pt-os JetBrains Mono
mellett a `26.5` alak pont 48pt), negyediknek nincs hely.
**Alternatíva:** Mockup-hű fix három oszlop (láthatatlan rendezés), vagy az
aktív oszlop cián kiemelése (a mockup sorai egységesen `text.primary`-k), vagy
a chipek szűkítése háromra (elveszne a perc és a hatékonyság szerinti sorrend).
**Visszavonható?** Igen, a `data/player-sorts.ts` `visibleColumns()`-a az
egyetlen hely, ami erről dönt.

## D-051 – A játékoslista rövidített nevet mutat
**Dátum:** 2026-09-02
**Döntés:** A `PlayerRow` a `shortenPlayerName()` alakját írja ki
(`Payton Jr Chris Joseph` → `Payton J.`), ugyanúgy, mint a box score
fagyasztott oszlopa. A teljes név a játékos részletei képernyőre marad.
**Miért:** A mockup sorában a 32pt-os mezszám-kör és a három 48pt-os
számoszlop után ~94pt marad a névnek. A valódi keretben a nevek átlagosan
15, legrosszabb esetben 27 karakteresek (`Gatling Shane Justin Stoney`), tehát
a teljes név a sorok felénél levágódna – a rövidítés legalább egységes és
kiszámítható. A **keresés a teljes névre** illik, így a keresztnévvel is
megtalálható az, akinek csak a kezdőbetűje látszik.
**Alternatíva:** Teljes név „…"-vel (fél lista levágva), kétsoros név
(a 68pt-os sormagasság és a pozíció-alcím miatt szűk), vagy keskenyebb
számoszlop (a 20pt-os mono négy karaktere alá nem megy).
**Visszavonható?** Igen, egy hívás a `PlayerRow`-ban.

## D-052 – A meccsenkénti bontás önálló lekérdezés, beágyazott `games` sorral
**Dátum:** 2026-09-02
**Döntés:** A `usePlayerDetails` a meccssorokat a szezonspecifikus
`player_game_stats_*` tábláról kéri, a meccs keretadataival együtt
(`games!inner(date, opponent, home_away, result, …)`), és a szűrés is a
beágyazott soron történik: `games.season_id` + `games.our_team_id`. Az ellenfél
rövid nevét a szűrő csapatlistája adja, ha megvan benne a teljes név.
**Miért:** Így a képernyő nem függ attól, hogy a Meccsek tab betöltötte-e már a
meccslistát – a `useGameDetails` fordítva jár el (a meccs sorát a lista
cache-éből veszi), de ott a felhasználó mindig a listáról érkezik. Ide a
Játékosok tabról jönnek, ahol a meccsek cache-e üres lehet: egy `useGameData`
függés vagy egy második, felesleges hálózati kört indítana, vagy üres bontást
mutatna. A `games.our_team_id` szűrés egyben a csapatot váltó játékosok idegen
meccseit is kizárja.
**Alternatíva:** `useGameData` cache-ből join (a meccslista teljes letöltésétől
függne), vagy `game_id`-k szerinti második lekérdezés (két kör egy helyett).
**Visszavonható?** Igen, a `fetchDetails()` egyetlen lekérdezése érinti.

## D-053 – A meccsbontás 10 sorral indul, gombbal nyílik teljesre
**Dátum:** 2026-09-02
**Döntés:** A `PlayerGameLog` alapból a legutóbbi 10 meccset rajzolja ki, a
többit a „További N meccs" gomb nyitja – visszazárás nincs.
**Miért:** Egy szezon 50 meccse × 13 cella 650 `Text` elem, virtualizálás
nélkül, egy amúgy is hosszú képernyő közepén. A stáb tipikusan a legutóbbi
néhány meccset nézi; a teljes szezon egy koppintásra van. Ugyanaz a minta, mint
a riportkártya összecsukott szövege (D-049).
**Alternatíva:** Minden sor kirajzolása (lassabb első megjelenés), vagy
`FlatList` virtualizálással (a `ScrollView`-ba ágyazott lista mérete
meghatározatlan lenne, és a fagyasztott oszlop szinkronja is elveszne).
**Visszavonható?** Igen, a `COLLAPSED_ROWS` konstans.

## D-054 – A riportkártya közös, és a játékosriport csak játékosra + szezonra szűr
**Dátum:** 2026-09-02
**Döntés:** A `ReportCard` `GameReport | PlayerReport` uniót fogad, a
feliratmap kiegészült a `season` (`Szezonelemzés`) típussal. A
`player_text_reports` lekérdezése `player_id` + `season_id` szerint szűr,
`team_id` szerint **nem**.
**Miért:** A két riport megjelenítése karakterre azonos (lila sáv, típusfelirat,
dátum, összecsukott szöveg) – két külön komponens csak duplikáció lenne. A
`team_id` oszlop nullázható (a riport csapat nélkül is menthető a webről), egy
`.eq('team_id', …)` szűrés tehát némán eldobná ezeket a sorokat; a `player_id`
amúgy is szűkebb szűrő, mint a csapat.
**Alternatíva:** Külön `PlayerReportCard` (duplikáció), vagy `team_id`-ra is
szűrés `.or('team_id.is.null,…')`-lel (bonyolultabb, és nem ad többet).
**Visszavonható?** Igen, a `ReportCard` propja és a lekérdezés egy sora.

## D-055 – Az arányjelző sáv tömör színnel fut, gradiens nélkül
**Dátum:** 2026-09-02
**Státusz:** **Felülírva – lásd D-056.** A csomag felvételére engedélyt kaptam,
a sáv azóta gradienssel fut.
**Döntés:** A `ProgressBar` kitöltése tömör accent szín, nem a mockup
`linear-gradient(90deg,#0096B8,#00D4FF)` átmenete és nem is a hozzá tartozó
külső glow.
**Miért:** A gradienshez `expo-linear-gradient` (új csomag) kellene, a színes
elmosott glow-t pedig RN egyik platformon sem adja megbízhatóan (D-005). A sáv
szerepe az arány leolvashatósága, ehhez a tömör szín elég.
**Alternatíva:** `expo-linear-gradient` felvétele (engedélyköteles, és egy
6pt-os sávért nem éri meg), vagy két egymásra rétegzett félig átlátszó nézet
(nem ad valódi átmenetet).
**Visszavonható?** Igen, a `ProgressBar` kitöltő nézete az egyetlen hely.

## D-056 – `expo-linear-gradient` felvéve, a sáv gradienst kap
**Dátum:** 2026-09-02
**Döntés:** Az `expo-linear-gradient` (~57.0.1) bekerül a függőségek közé, és a
`ProgressBar` kitöltése a mockup `linear-gradient(90deg, …)` átmenetét
rajzolja. Cián hangnemnél a mockup két értéke (`shade.cyanDeep` →
`accent.cyan`), a többinél az accent szín 55%-os alakja fut a tömörbe – új
színtoken nélkül, a meglévő tokenhez fűzött alfa csatornával.
**Miért:** A `CLAUDE.md` a mockup pontos replikálását kéri, és a csomag
felvételére kifejezett engedélyt kaptam. A csomag az Expo SDK része (Expo
Go-ban benne van), egyetlen komponens használja, és nincs JS-oldali
alternatívája: RN natívan nem tud gradienst.
**Alternatíva:** Tömör szín (D-055 – kevesebb csomag, de eltér a mockuptól),
vagy Skia `LinearGradient` (a `@shopify/react-native-skia` az S7-ben úgyis
jön, de egy 6pt-os sávért egy Skia canvas nagyobb ár).
**Következmény:** Natív modul: saját dev clientet újra kell buildelni. A
`CLAUDE.md` tech stack felsorolása még nem említi.
**Visszavonható?** Igen, a `ProgressBar` az egyetlen használati hely.

## D-057 – A tabella sorai kliensoldalon deduplikálódnak
**Dátum:** 2026-09-02
**Döntés:** A `useStandings` helyezésenként **az első** elemet tartja meg a
tabellaállás JSON tömbjéből, a további azonos helyezésűeket eldobja.
**Miért:** A legfrissebb (26. forduló) és a 3. fordulós sorban minden csapat
kétszer, karakterre azonos értékekkel szerepel – az import hibája. A mobil app
csak olvas, javítani nem tudja, viszont 28 sort kirajzolni egy 14 csapatos
bajnokságban nyilvánvalóan rossz.
**Alternatíva:** Csapatnév szerinti kulcs (ugyanaz az eredmény, de a helyezés
az egyedi mező), vagy a hiba figyelmen kívül hagyása és 28 sor kirajzolása
(elfogadhatatlan). A valódi javítás a webprojekt importjában van.
**Visszavonható?** Igen, a dedup a `toTeams()` néhány sora.

## D-058 – A tabella a csapat rövid nevét mutatja
**Dátum:** 2026-09-02
**Döntés:** A névoszlopban a `teams.short_name` áll (`Falco`, `Kaposvár`,
`Atomerőmű`), nem a `standings` JSON teljes neve. Ha a csapat nincs meg a
listában, marad a tabella saját neve.
**Miért:** A mockup nyolc oszlopos rácsában a névre ~126pt marad. A valódi
teljes nevek (`Falco-Vulcano Energia KC Szombathely`,
`Endo Plus Service-Honvéd`) ott csak levágva férnének el, tehát a sor első
felében sem lenne olvasható a csapat. A mockup közepes hosszúságú nevei
(`Falco-Vulcano Szombathely`) az adatbázisban nem léteznek.
**Alternatíva:** Teljes név „…"-lel levágva (a mockup betűje szerinti, de
olvashatatlan), vagy kétsoros név (elrontja az 56pt-os sormagasságot).
**Visszavonható?** Igen, a `toTeams()` egyetlen mezője.

## D-059 – A badge jele a rövid név három betűje, az ASE kivétel
**Dátum:** 2026-09-02
**Döntés:** A `teamAbbreviation()` a rövid név első három betűjét adja
ékezet nélkül, nagybetűvel (`Körmend` → `KOR`, `Falco` → `FAL`). Egyetlen
kivétel van, teljes névre kulcsolva: `Atomerőmű SE` → `ASE`.
**Miért:** A mockup tíz csapatjelét egy szabály kiadja, kivéve a sajátunkat:
az `Atomerőmű` mechanikusan `ATO` lenne, a bevett jelölés viszont `ASE` – a
mockup és az app fejléce is így írja. Az ékezetlevágás nem kozmetika: a
csomagolt betűkészletből hiányzik az `ő`/`ű` glifa, `ATOMERŐMŰ`-ből tofu lenne.
**Alternatíva:** Teljes kézi jeltábla mind a 16 csapatra (új csapatnál
karbantartani kell, és a tabellában olyan csapat is felbukkanhat, ami nincs a
`teams` táblában), vagy kivétel nélküli szabály (`ATO`, ami a mockuptól tér el).
**Visszavonható?** Igen, a kivételtábla egyetlen sor a `lib/format.ts`-ben.

## D-060 – Csak a szezonhoz kötött tabella jelenik meg
**Dátum:** 2026-09-02
**Döntés:** A lekérdezés szigorúan `season_id`-re szűr. A webes `StandingsView`
tartaléka – ha a szezonra nincs sor, mutasd a `season_id IS NULL` régi
importokat – a mobilban **nincs meg**: ilyenkor üres állapot jön.
**Miért:** A `season_id` nélküli 11 sor mind a 2025/2026-os szezon korábbi
fordulóihoz tartozik (2025-11 … 2026-03). Ha egy másik szezon van kiválasztva a
szűrőben, a tartalék **idegen szezon** tabelláját mutatná a szűrő felirata
alatt – ez rosszabb, mint az őszinte üres állapot. A `CLAUDE.md` szerint minden
lekérdezés szűrt.
**Alternatíva:** A webes tartalék átvétele (félrevezető), vagy a régi sorok
dátum szerinti szezonhoz rendelése a kliensen (találgatás, az importnak kell
megjavulnia).
**Visszavonható?** Igen, a `fetchStandings()` egyetlen `.eq()` hívása.

## D-061 – Új token: `border.rowDeep` (#101E33)
**Dátum:** 2026-09-02
**Döntés:** A tabella sorelválasztójához új token került a palettába:
`colors.border.rowDeep = '#101E33'`, Tailwindben `line-row-deep`.
**Miért:** A mockup ezt a hexet írja, és a `CLAUDE.md` a pontos replikálást
kéri. A hex eddig csak `shade.sheetHeader` néven létezett, de az a `shade` ág
alatt van, aminek a doksija tiltja a közvetlen használatot, és a neve a sheet
fejlécéről szól – egy sorelválasztóként félrevezető lenne. Az új token
felvételére engedélyt kaptam.
**Alternatíva:** A `shade.sheetHeader` újrahasznosítása (azonos szín, hibás
név), vagy a meglévő `border.row` (#16233D – egy árnyalattal világosabb,
eltérés a mockuptól).
**Visszavonható?** Igen, egy token és egy Tailwind kulcs.

## D-062 – A tabella lábléce a fordulószámot is kiírja
**Dátum:** 2026-09-02
**Döntés:** A lábléc „Frissítve: 2026. április 25. · 26. forduló" alakban áll,
a mockup csak dátumos felirata helyett.
**Miért:** Egy tabellaállás mindig egy fordulóhoz tartozik, és az adatbázis
több fordulót is tárol – a dátumból nem derül ki, hányadik forduló utáni állást
nézi a felhasználó (a 26. és a 3. fordulós sor például **azonos** dátumon áll).
A kiegészítés a mockup tipográfiáján belül marad. Erre engedélyt kaptam.
**Alternatíva:** Csak a dátum (a mockup betűje szerint, de kevesebb
információ), vagy a forduló a cím alatti alcímbe (feltűnőbb hely, mint amit egy
metaadat érdemel).
**Visszavonható?** Igen, a képernyő egyetlen sablonsora.

## D-063 – A kiemelt tabellasor teljes szélességű
**Dátum:** 2026-09-02
**Döntés:** A tabellasorok a képernyő teljes szélességét elfoglalják, a 16pt-os
behúzás a sor **tartalmán** van. A kiemelt sor surface2 háttere és bal oldali
2pt-os cián sávja ezért a kijelző széléig ér; az elválasztó vonalat külön,
16pt-tal behúzott réteg rajzolja.
**Miért:** A mockup a sávot `left:-16px`-szel, a lista behúzásán kívülre
teszi. RN-ben a szülőn kilógó abszolút gyerek Androidon megbízhatatlanul
renderelődik (a natív nézet levágja), ezért a sávnak a soron **belül** kell
lennie – ehhez viszont a sornak a szélig kell érnie.
**Alternatíva:** `overflow: 'visible'` és negatív pozíció (Androidon nem
garantált), vagy a sáv elhagyása (a kiemelés fele veszne el).
**Következmény:** A kiemelt sor háttere 16-16pt-tal szélesebb, mint a
mockupban.
**Visszavonható?** Igen, a `StandingsRow` elrendezése egy helyen áll.

## D-064 – A riportok hiányzó glifái blokk-jelölővé, nem karakterré válnak
**Dátum:** 2026-09-02
**Döntés:** A riportszöveg sorkezdő `✓` / `↺` / `✗` jeleiből saját blokktípus
(`outcome`) lesz, amit a `ReportBody` lucide `Check` / `RotateCcw` / `X`
ikonnal rajzol ki, hangnem szerinti színben. A `→` sorokból behúzott indoklás
lesz, a `1️⃣` billentyű-szekvenciából `1.` számozás. Szövegközi előfordulásra
tartalék karakterek állnak (`–` `+` `±` `−`).
**Miért:** A csomagolt három betűcsalád mind subset, a `cmap` táblájuk 222–229
kódpontot tartalmaz, és a `U+2192` `U+2713` `U+2717` `U+21BA` `U+FE0F`
`U+20E3` **egyikben sincs benne** (ellenőrizve mind a hét fájlon). Hiányzó
glifánál Android tofut rajzol – ez ugyanaz a lelet, mint D-031-nél, és
ugyanaz a megoldás: ikon a karakter helyett. A tartalék karakterek (`–` `+`
`±` `−`) viszont mindegyik betűfájlban megvannak.
**Alternatíva:** (a) teljes, nem subsetelt betűfájlok – három fájl mérete nőne
hat glifáért; (b) a jelek elhagyása – elveszne, hogy egy fókuszpont teljesült,
részben teljesült vagy nem teljesült.
**Visszavonható?** Igen, a leképezés a `lib/report-format.ts` két
konstansában áll.

## D-065 – A szekciócímet heurisztika ismeri fel, nem jelölés
**Dátum:** 2026-09-02
**Döntés:** Szekciócím az a sor, amelyik (a) számozott billentyű-szekvenciával
kezdődik, vagy (b) legfeljebb 70 karakter és nem `.` `!` `?` `:` `…` jelre
végződik. Minden más bekezdés.
**Miért:** A három riporttábla háromféle szöveget hoz: a meccsriportok
`1️⃣`-tel és `**...**`-gal jelölik a szekciókat, a csapatriportok **sehogy**
(„Összkép", „Forma — utolsó hetek" egyszerű sorok), a játékosriportok pedig
csak bekezdéseket tartalmaznak. Markdown-renderelő nélkül (új könyvtár lenne)
csak a szöveg alakjából lehet dönteni. A heurisztika mind a 35 valós riporton
lefuttatva 138 címet ad, hibás besorolás nélkül; a leghosszabb valódi cím 42
karakter, tehát a 70-es korlát bőven tartalékos.
**Alternatíva:** (a) `react-native-markdown-display` vagy hasonló – új
függőség egy olyan szövegre, ami félig sem markdown; (b) minden sor bekezdés –
a hosszú riportok tagolatlanná válnának.
**Visszavonható?** Igen, a `lib/report-format.ts` `toBlock` függvénye egy
helyen áll; ha a webprojekt egyszer egységesen jelöli a címeket, arra
cserélhető.

## D-066 – Az Elemzés hub először csak a riportokat viszi
**Dátum:** 2026-09-02
**Döntés:** A P12 mockup két szekciója közül elsőként csak az „AI riportok"
készült el; a „Számított elemzések" három navigációs sora (Szituációk,
Ellenfél scouting, Szerepkör-elemzés) külön feladat, és addig **nem** jelenik
meg a képernyőn.
**Miért:** A három számított elemzés három önálló képernyő, saját
lekérdezésekkel (`kosarstat_game_quarter_stats`, `kosarstat_game_team_metrics`,
liga-szintű csapatstatisztika). Ezek nélkül a navigációs sorok halott
gombok lennének. A riportolvasás önmagában is teljes, használható funkció, és
ez a tab addig sem marad helyőrző.
**Alternatíva:** (a) az egész tabot egy feladatban – szembemenne az „egy
feladat, egy commit" szabállyal; (b) letiltott navigációs sorok kirakása – a
felhasználónak félkész app benyomását adná.
**Visszavonható?** Igen, a szekció beszúrása a hub képernyőn egy blokk.

## D-067 – A riportlista fajta szerinti szűrő-chipeket kap
**Dátum:** 2026-09-02
**Döntés:** A hub listája fölött `ChipRow` áll négy chippel (Mind / Meccs /
Csapat / Játékos), amit a P12 nem ír elő.
**Miért:** A P12 négy riportkártyát mutat; a valóságban a 2025/2026-os
szezonban az ASE-hez **35** riport tartozik (24 meccs, 4 csapat, 7 játékos).
A négy csapatriport a generálási idő szerinti sorrendben a lista közepére
kerülne, tehát szűrő nélkül gyakorlatilag megtalálhatatlan. A chipsor a már
meglévő, jóváhagyott `ChipRow` komponens, ugyanazzal a vizuális nyelvvel, mint
a játékoslista rendezés-chipjei – nem új design elem.
**Alternatíva:** (a) fajtánként külön szekció egy görgetésben – a
„legfrissebb elöl" sorrend veszne el; (b) szűrő nélkül – a csapat- és
játékosriportok elérhetetlenek maradnának.
**Visszavonható?** Igen, a chipsor a hub képernyő egy blokkja.

## D-068 – A riportolvasó a hub cache-éből dolgozik, nem kérdez rá újra
**Dátum:** 2026-09-02
**Döntés:** Az `analysis/[id]` képernyő a `useAnalysisReports` listájából
keresi ki a riportot azonosító szerint; ha nincs benne (időközben átállt a
szűrő), üres állapot jön, nem hibaüzenet és nem új lekérdezés.
**Miért:** A riport teljes szövege már a listával együtt megérkezett – a
`narrative` oszlop az, amiből az összefoglaló is készül. Külön lekérdezés
ugyanazt a sort töltené le még egyszer, és a kártyáról az olvasóra lépés
hálózati kört várna. Ugyanaz a minta, mint a meccs- és játékosrészleteknél
(D-046).
**Alternatíva:** Azonosító szerinti pont-lekérdezés – ez működne mélylinkről
is, de mobilon mélylink nincs, és a lista úgyis mindig előbb töltődik.
**Következmény:** Az olvasó csak a szűrőben aktuális szezon és csapat
riportjait tudja megnyitni.
**Visszavonható?** Igen, a képernyő egy `find()` hívása cserélendő.

## D-069 – Szezonszintű clutch nézet nem készül
**Dátum:** 2026-09-02
**Döntés:** A `@core/kosarstat-clutch-parse` **nem** kerül az Elemzés tabra
szezonszintű aggregátumként; a helye a Meccs részletei képernyő, külön
feladatként.
**Miért:** A `parseGameClutch` nem statisztikatáblát olvas, hanem a
`kosarstat_game_pages_raw` + `kosarstat_game_page_tables` **nyers HTML-tábláit**
parse-olja, meccsenként. Egy szezon ~24 meccsére ez 24 nyers oldal letöltése és
kliensoldali feldolgozása lenne egyetlen képernyő megnyitásakor – ez szemben
áll a `CLAUDE.md` „lusta betöltés" elvárásával. A webprojekt is meccsszinten
használja (`components/GameDetails.tsx`).
**Alternatíva:** (a) szezonszintű aggregálás vállalva a költséget; (b)
előszámolt clutch tábla a szerveren – sémamódosítás, ami a mobil scope-on kívül
van.
**Visszavonható?** Igen, a modul a `core/`-ban ott van, csak nincs hívója.

## D-070 – A negyed- és metrikatábla a csapat meccseire szűr, nem a szezonra
**Dátum:** 2026-09-02
**Döntés:** A `kosarstat_game_quarter_stats` és a `kosarstat_game_team_metrics`
lekérdezése a csapat `kosarstat_game_id`-jainak listájára megy
(`.in('kosarstat_game_id', ids)`), nem `season_id`-ra, ahogy a webes
`SituationalAnalysis` teszi. Emiatt a lekérdezés két körben fut: előbb a
`games`, mert az azonosítók csak abból derülnek ki.
**Miért:** A két tábla a **teljes ligát** tárolja. A 2025/2026-os szezonra
szűrve a negyedstat 1000 sornál levágódik a PostgREST limitnél (tehát a webes
alak csendben hiányos adatból számol), és 470 metrikasor jön. A csapat 25
azonosítójára ugyanez 200 és 50 sor – mobilon ez a különbség a hálózaton is
látszik, és a `CLAUDE.md` „minden lekérdezés szűrt" szabályát is ez tartja be.
**Alternatíva:** (a) a webes alak `fetchAllRows`-zal lapozva – helyes lenne, de
a liga összes csapatának adatát letöltené egy csapat elemzéséhez; (b) szezonra
szűrés lapozás nélkül – ez a webprojekt mai, hiányos viselkedése.
**Következmény:** Az extra kör miatt a képernyő két hálózati menetben tölt.
**Visszavonható?** Igen, a két fetch függvény szűrője cserélendő.

## D-071 – A nyolc metrikasor dobásadata a szezon `player_game_stats` táblájából jön
**Dátum:** 2026-09-02
**Döntés:** A P13 nyolc metrikasorából a mezőny%, hármas%, lepattanó, assziszt
és eladott labda a szezonspecifikus `player_game_stats` táblából áll elő, a
játékossorokat meccsenként összeadva (`getSeasonStatsTable`, `games!inner`
szűréssel). A pontok a `games` sorokból jönnek.
**Miért:** A `@core/situational-analysis` hazai/vendég bontásban csak a támadó
ratinget és az eFG%-ot adja – a mockup nyolc sora ebből nem jön ki. A
`player_game_stats` viszont minden meccshez megvan (2025/2026, ASE: 581 sor, 58
meccs, egy PostgREST lapon belül), és a belőle számolt pontátlag **azonos** a
`games` tábláéval (95.2 / 84.4), tehát a két forrás konzisztens.
**Alternatíva:** (a) hat sor, csak a `@core` adataiból (nincs extra lekérdezés,
de a mockup fele elveszne); (b) a hiányzó metrikák felvétele a `@core`-ba –
sémán kívüli, és a webprojektben kellene megcsinálni.
**Következmény:** A csapatösszegzés a mobil hookban él, nem a `@core`-ban. Ha a
webprojekt később ad rá modult, ide kell visszavezetni.
**Visszavonható?** Igen, a `fetchSplitTotals` és a `buildMetrics` cserélendő.

## D-072 – Három szegmens a mockup kettője helyett
**Dátum:** 2026-09-02
**Döntés:** A Szituációk képernyő szegmentált kontrollja három nézetet vált
(Hazai / vendég · Helyzetek · Negyedek), a P13 kettője (Hazai/vendég ·
Nyert/vesztett) helyett. Engedéllyel.
**Miért:** A feladatlista sora a szoros/kiütéses meccseket, a félidei vezetést,
a negyedbontást és a four factorst is kéri, és a `@core/situational-analysis`
mindezt kiadja – a P13 két szegmensébe viszont egyik sem fér bele. A
„nyert/vesztett" bontás ezekhez képest kevés újat mond: a mérleget az
összehasonlító fejléc már mutatja. A prompt elrendezése (szegmentált kontroll,
összehasonlító fejléc, metrikasorok, összegző kártya) változatlan marad.
**Alternatíva:** (a) pontosan a mockup két szegmense, a modul fele kihasználva;
(b) két szegmens és alattuk mindig látszó blokkok – a képernyő ettől nagyon
hosszúra nyúlt volna.
**Visszavonható?** Igen, a `SEGMENTS` tömb és három render-függvény.

## D-073 – A hub „Számított elemzések" szekciója csak a kész sort viszi
**Dátum:** 2026-09-02
**Döntés:** Az Elemzés hubon a szekció megjelent, de egyetlen navigációs sorral
(Szituációk). Az ellenfél scouting és a szerepkör-elemzés sora akkor kerül be,
amikor a képernyője elkészül.
**Miért:** A D-066 elve érvényben marad: halott vagy „hamarosan" feliratú gomb
félkész app benyomását adja. Így viszont a szekció már ott van, és minden
feladat egy sorral bővíti.
**Alternatíva:** Mind a három sor kirakása, kettő letiltva.
**Visszavonható?** Igen, a hub képernyőn egy blokk.

## D-074 – A jobb érték glow-ja keret + kitöltés, fix geometriával
**Dátum:** 2026-09-02
**Döntés:** A metrikasorban a jobb teljesítményt adó oldal értéke accent
kitöltést és accent keretet kap (`glow.cyan` / `glow.orange`), nem elmosott
árnyékot. A keretdoboz **mindkét** oldalon ott van, átlátszóan, ha nem az az
oldal a jobb.
**Miért:** Színes elmosott glow-t RN nem tud megbízhatóan mindkét platformon
(D-005). A doboz mindkét oldali kirajzolása azért kell, mert enélkül a
kiemelt sor számai 1-1pt-ot elcsúsznának a többi sorhoz képest – nyolc egymás
alatti szám esetén ez jól látszana.
**Alternatíva:** (a) a gyengébb érték halványítása kiemelés helyett – a mockup
mindkét értéket accent színben kéri; (b) Skia `BlurMask` – egy metrikasorért
nem éri meg behozni a Skiát.
**Visszavonható?** Igen, a `SplitMetricRow` `Value` komponense.

## D-075 – A helyzetfeliratok szövegesek, mert a `≤` és `≥` glifa hiányzik
**Dátum:** 2026-09-02
**Döntés:** A játékhelyzetek feliratai nem a `@core` `label` mezőjéből jönnek,
hanem a `lib/situational-view.ts` saját táblájából: „Szoros meccs (max 5p)" és
„Kiütéses meccs (15p-től)" a `Szoros (≤5p)` / `Gálameccs (≥15p)` helyett.
**Miért:** A `≤` és a `≥` egyik csomagolt betűkészletben sincs meg (a
betűfájlok `cmap` tábláiból ellenőrizve) – tofu négyzetként jelennének meg,
ugyanaz a lelet, mint D-064-nél. A `@core` másolatot javítani tilos, a
webprojekten pedig nem indokolt változtatni egy mobil betűkészlet miatt.
**Alternatíva:** (a) a hiányzó glifát tartalmazó betűvágat becsomagolása – a
három családot nem cseréljük egy jelért; (b) a `@core` felirat átírása a
webprojektben – a weben a glifa megvan, ott nincs hiba.
**Visszavonható?** Igen, a `SITUATION_LABELS` tábla.

## D-076 – A „Megállapítás" szöveg sablonból áll össze, nem AI-ból
**Dátum:** 2026-09-02
**Döntés:** A P13 összegző kártyájának szövegét a `lib/situational-view.ts`
állítja elő sablonból, a már kiszámolt számokból (pl. melyik a fő forrása a
hazai/vendég különbségnek, melyik a legjobb és leggyengébb helyzet, melyik a
legerősebb és leggyengébb negyed). A számok darabokban (`InsightFragment`)
érkeznek, hogy monospace-szel és cián színnel emelkedjenek ki.
**Miért:** A mockup megállapítás-mondatot kér, de a mobil app **nem generál AI
tartalmat** (`CLAUDE.md`) – riportot csak olvas. A sablonos szöveg
determinisztikus, ellenőrizhető, és nem kell hozzá se kulcs, se hálózat.
**Alternatíva:** (a) a kártya elhagyása – a mockup egy elemével kevesebb; (b)
AI hívás – a mobil scope-on kívül van.
**Következmény:** A szöveg csak azt mondja ki, amit a számokból le lehet
vezetni; nyelvi finomságokat (pl. a negyedek „az N3" névelője) kézzel kell
kezelni.
**Visszavonható?** Igen, három függvény a view modulban.

## D-077 – A scouting lekérdezése liga-szintű, nem csapatra szűkített
**Dátum:** 2026-09-02
**Döntés:** A `useScoutingData` a kiválasztott szezon **összes** csapatának
meccs- és statisztikasorát lekéri, nem csak a saját csapatét és az ellenfélét.
**Miért:** A `@core/pregame-scouting` minden megállapítása (tempó, stílus,
veszélyforrás, támadható pont, győzelmi esély) percentilishez van kötve, amit a
`buildTeamBenchmarks` a liga mezőnyéből számol. Két csapatból nincs mezőny: a
modell mindenre 50. percentilist mondana, és a képernyő tartalom nélkül
maradna. A `CLAUDE.md` „minden lekérdezés szűrt `season_id` és `team_id`
szerint" szabályából a szezonszűrés így is megvan, a csapatszűrés nem.
**Alternatíva:** (a) benchmark nélküli futtatás – üres riport; (b) a mezőny
előszámítása szerveroldalon – a mobil app nem ír sémát és nincs API route-ja.
**Következmény:** A legnagyobb szezon 7402 játékos-meccssor (~2.4 MB) egyetlen
lekérdezésben, nyolc lapozott körben. Ezért fut lustán: csak ezen a képernyőn,
és szezononként egyszer, a cache élettartamára.
**Visszavonható?** Igen, de csak a képernyő elhagyásával együtt.

## D-078 – A csapatösszegzés a meccsenkénti sorokból jön, nem a szezon view-ból
**Dátum:** 2026-09-02
**Döntés:** A `TeamSeasonStat` volumenmezői (dobás, lepattanó, assziszt,
labdaeladás, fault, valuation) a szezon `player_game_stats` táblájából
állnak össze, meccsenként a `games.our_team_id`-hoz kötve. A meccsszám, a
mérleg, a szerzett és a kapott pont a `games` tábláé. A keretek játékossorai
maradnak a `player_season_stats_by_season` view-ban.
**Miért:** A view a `players` tábla aktuális sorain áll, ezért a szezon közben
távozott játékosok statisztikája hiányzik belőle. Méréssel: az ASE 2025/2026-ban
26 játékossal lépett pályára, a view 13-at tartalmaz, a csapat pontösszege
3820 az 5211 helyett; csapatonként 0–42% a hiány, tehát a percentilis-mezőny
is torzulna. A meccsenkénti sorok összege ugyanakkor pontosan kiadja a `games`
tábla pontösszegét (5211 = 5211).
**Alternatíva:** (a) a view használata – olcsóbb (275 sor), de hibás mezőnyt
ad; (b) szerveroldali aggregálás – a PostgREST-en az aggregátumok tiltva
vannak (`Use of aggregate functions is not allowed`), az RPC pedig sémaírás.
**Következmény:** Nagyobb letöltés (lásd D-077), cserébe a web pregame
számaival egyező bemenet. A keretlistához a view marad a jó forrás: a scouting
az **aktuális** keretre kérdez, és a pozíció meg a testmagasság csak onnan jön.
**Visszavonható?** Igen, a `fetchScouting` két összegzője.

## D-079 – A tempó és a támadólepattanó-arány nem jelenik meg
**Dátum:** 2026-09-02
**Döntés:** A `teamStats` kilenc mezőjéből a képernyő hetet mutat; a `pace` és
az `orebRate` kimarad.
**Miért:** A `@core` mindkettőt az **ellenfelek** adatából számolja
(`TeamSeasonStat.opponent`), amit az adatbázisból nem lehet megbízhatóan
előállítani: a `games` tábla csapatperspektívánként tárol, a tükörsor
párosítása névegyezésen múlna, és méréssel a szezon 723 sorából 131 nem
párosítható (egy csapat neve az importokban kétféleképpen szerepel). Az
`opponent` blokk nélkül a `pace` a valós fele, az `orebRate` pedig minden
csapatnál 100%. Mivel a torzítás minden csapatnál azonos, a **percentilisek**
érvényesek maradnak – a modell megállapításai tehát jók, csak ez a két
abszolút szám nem mutatható meg.
**Alternatíva:** (a) a tükörmeccsek párosítása – 82%-os fedettség, csúszó
nevezőkkel; (b) a két szám kiírása úgy, ahogy van – félrevezető.
**Következmény:** A szembeállított sorokban birtoklás-független mutatók
állnak (eFG%, hármas arány és %, büntetőráta, assziszt arány, labdaeladás %),
plusz a pontátlagok a `games` tábláról.
**Visszavonható?** Igen, ha a webprojekt egyszer ellenfél-oldali összegzést is
ír a sémába.
**FELÜLÍRVA (2026-09-02, D-081):** a párosítás nem névegyezésen megy, hanem
dátum + eredményhalmaz + tükrözött hazai/vendég oldal alapján, ami 96–99%-os
fedettséget ad. Mindkét sor visszakerült a képernyőre, valós értékkel (tempó
74–79 birtoklás, támadólepattanó-arány 19–33%).

## D-080 – Az ellenfél választható, nem csak a következő találkozóé
**Dátum:** 2026-09-02
**Döntés:** A képernyő alapból a menetrend következő ellenfelét elemzi, ennek
híján a legutóbb lejátszott meccs ellenfelét, de a felső sávról bármelyik
ligacsapatra át lehet váltani (`OpponentSheet`).
**Miért:** A feladatlista „a következő ellenfél" elemzését kéri, az adatban
viszont a futó szezonhoz nincs jövőbeli forduló (a menetrend következő
fordulói már a rákövetkező szezon `season_id`-ján állnak, amihez nincs
statisztika). Fix „következő ellenfél" logikával a képernyő a valós adaton
mindig üres lenne, korábbi szezonokban pedig értelmezhetetlen. A választó
egyben a webes pregame szekció viselkedését hozza: ott is legördülőből jön az
ellenfél.
**Alternatíva:** (a) szigorúan a következő forduló – üres képernyő; (b) csak a
legutóbbi ellenfél – nem az, amit a feladat kér.
**Következmény:** Az ellenfélsáv eyebrow-ja mondja meg, honnan jött a
választás („Következő ellenfél" / „Legutóbbi ellenfél" / „Választott
ellenfél"). A választás nem perzisztálódik: a képernyő elhagyásával
visszaáll az alapértelmezés.
**Visszavonható?** Igen, a `useScoutingData` `fallback` blokkja.

## D-081 – Az ellenfél-oldali statisztika a meccsek párosításából áll össze
**Dátum:** 2026-09-02
**Döntés:** A `TeamSeasonStat.opponent` blokkot a két csapatperspektíva
párosítása tölti fel: azonos dátum + azonos eredményhalmaz + más-más csapat +
tükrözött hazai/vendég oldal. Ami nem így párosul, az kimarad.
**Miért:** A `@core/team-analysis` `normalizeTeamStats`-e az `opponent` blokk
nélkül a tempót a felére viszi, a védekező és a nettó ratinget nullázza, a
támadólepattanó-arányt pedig 100%-ra állítja – a liga-percentilisekből három
sor és a védekezési stílusjegyek mind értelmezhetetlenné válnának. A D-079 a
scoutingnál még **névegyezéssel** próbálta a párosítást, ott 82% jött ki; az
eredmény + dátum + oldal hármas viszont méréssel 2025/2026-ban 698/723,
2024/2025-ben 362/366 sort köt össze, és **egyetlen** elfogadott párnál sem
tér el a hazai/vendég oldal. A 25 kimaradó sor egy adatbeviteli hibából jön
(ott mindkét csapat sora ugyanazt az eredményt írja a saját oldalára), nem a
módszerből.
**Alternatíva:** (a) `opponent` nélkül – hamis tempó és nulla védekező rating;
(b) a három érintett percentilis-sor elrejtése – a csapatkép fele elveszne;
(c) névegyezéses párosítás (D-079) – rosszabb fedettség.
**Következmény:** A lábjegyzet kiírja, hány meccsre állt össze az
ellenfél-adat, és ha a `@core` hiányosnak látja, ezt is kimondja. A scouting
képernyő egyelőre a D-079-es korláttal fut – ott a párosítás bevezetése külön
feladat.
**Visszavonható?** Igen, a `lib/team-season-stats` `pairGames` függvénye.

## D-082 – A szerepkörök a statisztikából számolódnak, nem az adatbázisból
**Dátum:** 2026-09-02
**Döntés:** A keret szerepkörei a `@core/player-analysis`
`analyzePlayerSeason`-jéből jönnek, a liga játékos-percentiliseihez
(`buildLeagueBenchmarks`) mérve – nem tárolt mezőből.
**Miért:** Az adatbázis nem tárol szerepkört, és a webprojekt is így vezeti le
(`rolesByPlayerId`). Ha a mobil app mást csinálna, a két felület ugyanarra a
keretre más szerepköröket mutatna. A `useScoutingData` üres `roles`-t ad át,
mert ott a `@core` csak a labdahordozó felismeréséhez használná – itt viszont
a szerepkör maga a képernyő tárgya, tehát nem hagyható ki.
**Alternatíva:** (a) üres `roles` – a képernyőnek nem lenne tartalma;
(b) pozícióból származtatott, saját szabály – eltérne a webtől.
**Következmény:** A liga összes játékossorát fel kell dolgozni (275 sor
2025/2026-ban), ez a lekérdezés után ~200 ms számítás. Ahol a keretadat csak
generikus „G" posztot tartalmaz, ott a levezetés kevés különböző szerepkört ad
– ez a bemenet hibája, nem a modellé.
**Visszavonható?** Nem érdemes; a szerepkör a képernyő lényege.

## D-083 – A lekérdezés és az összegzés külön tiszta modulban él
**Dátum:** 2026-09-02
**Döntés:** A szezon csapatmezőnyét előállító kód a `lib/team-season-stats.ts`
tiszta moduljába került (React nélkül), a `useTeamRolesData` csak a szűrőt, a
cache-t és a hibaállapotot kezeli.
**Miért:** A `useSituationalData` és a `useScoutingData` a fetchet a hookban
tartja, így a lánc csak futó appban ellenőrizhető. Ez a modul viszont
node-ból is végigfuttatható (a `@/lib/supabase` egy anon kulcsos klienssel
kiváltva), és a teljes lánc – lekérdezés → `TeamSeasonStat[]` →
`analyzeTeamSeason` → `buildRolesView` – így mind az 5 szezonra × a liga
összes csapatára lemérhető volt, még a képernyő elindítása előtt.
**Alternatíva:** minden a hookban, a két testvér-hook mintájára – konzisztens,
de a lánc csak kézzel, eszközön ellenőrizhető.
**Következmény:** A jövőbeli összevonásnak (`useScoutingData` ugyanezt a három
lekérdezést futtatja) van hova költöznie.
**Visszavonható?** Igen, a modul beolvasztható a hookba.

## D-084 – A `@core` angol szakszavai a nézetmodellben magyarra cserélődnek
**Dátum:** 2026-09-02
**Döntés:** A `lib/roles-view` a `@core` szövegeiben lecseréli az angol
szerepkörkulcsokat a `ROLE_LABELS_HU` feliratára, a klaszterneveket saját
táblából fordítja („Transition-heavy" → „Lerohanás-fókuszú", „Defense-first" →
„Védekezés-központú", „Halfcourt, playmaker-domináns" → „Félpályás,
játékszervező-központú"), a liga-percentilis sorok feliratait pedig kulcs
szerint magyarra írja („FT rate" → „Büntetőráta").
**Miért:** A `CLAUDE.md` magyar UI-t ír elő, a `@core` viszont félig angol
címkéket ad, és a `core/` mappa nem szerkeszthető. A csere a megjelenítési
rétegben marad, a modell számai és logikája érintetlenek.
**Alternatíva:** (a) a `@core` szövegének kiírása változatlanul – „Energy Big
hiány" a magyar képernyőn; (b) javítás a webprojektben és szinkron – helyes,
de a webes UI-t is átírná, ez külön egyeztetés.
**Következmény:** A `@core` **prózájában** maradt szakszavak („playmaking",
„spot-up", „pick-and-roll", „rim protector") változatlanok: ezek nem
kulcsszavak, kulcs szerint nem cserélhetők.
**Visszavonható?** Igen, a `coreText` és a `CLUSTER_LABELS` eltávolításával.

## D-085 – A leíró percentilisek semleges színt kapnak
**Dátum:** 2026-09-02
**Döntés:** A liga-percentilis sávok színe csak a teljesítménymutatóknál
minőségi (60-tól zöld, 40-től sárga, alatta piros). A tempó, a kétpontos és
hármas arány, a labdaigény-koncentráció és a magasemberes játékperc semleges
cián sávot kap.
**Miért:** A `@core` `percentileLabel`-je minden sorra minőségi címkét ad
(„Liga elit" … „Liga gyenge"), de a magas tempó vagy a magas kétpontos arány
nem jobb, csak másfajta játék – zöldre színezve viszont a felhasználó
erénynek olvasná. A kockázati és hatékonysági mutatóknál (hármas %,
büntetőráta, assziszt arány, támadó/védekező/nettó rating) a minőségi olvasat
viszont helyes.
**Alternatíva:** (a) mind minőségi – félrevezető; (b) mind semleges – a valódi
erősségek és gyengeségek eltűnnének.
**Következmény:** A `@core` tier-felirata („Liga elit") minden sor alatt ott
marad, tehát a besorolás olvasható, csak a szín nem sugall értékítéletet.
**Visszavonható?** Igen, a `DESCRIPTIVE_KEYS` halmaz ürítésével.

## D-086 – Egy adatréteg és egy cache a scoutingnak és a szerepkör-elemzésnek
**Dátum:** 2026-09-02
**Döntés:** A `useScoutingData` és a `useTeamRolesData` saját lekérdezés
helyett a közös `useTeamSeasonData` hookot használja, ami a
`lib/team-season-stats` moduljából tölt, egyetlen, szezonra kulcsolt
cache-be.
**Miért:** A két hook szó szerint ugyanazt a három lekérdezést futtatta
(`games`, szezon `player_game_stats`, `player_season_stats_by_season`), és
ugyanazt a csapatösszegzést építette – 2.4 MB adat, kétszer letöltve, két
cache-be. A duplikáció mellett tartalmi kockázat is volt: a két összegzés
elcsúszhatott volna egymástól, és a scouting nem kapta meg az ellenfél-oldali
volument (D-081), ami már a másik oldalon készen állt.
**Alternatíva:** (a) a duplikáció meghagyása, a párosítás átmásolásával –
két helyen kellene karbantartani ugyanazt a képletet; (b) Zustand store –
ez nem UI state, a modulszintű cache elég (D-026).
**Következmény:** A scoutingról a szerepkör-elemzésre (és vissza) lépve nincs
új lekérdezés. A `TeamRecord` és az `EMPTY_RECORD` a `lib/scouting-view`-ból
átkerült a `lib/team-season-stats`-ba, mert immár adatréteg-fogalom.
**Visszavonható?** Igen, de nem érdemes.

## D-087 – A `@core` modellek angol szerepkörkulcsot kapnak, nem magyar feliratot
**Dátum:** 2026-09-02
**Döntés:** A keretjátékosok `roles` mezőjébe a `@core/player-analysis`
`roleKeys`-e kerül (angol kulcs), nem a `roles`-e (magyar felirat).
**Miért:** A `@core/pregame-scouting` a labdahordozókat egy **angol kulcsokból**
álló halmazra (`BALL_HANDLER_ROLE_HINTS`) hasonlítja, a magyar felirat tehát
sosem találna. A `@core/team-analysis` ezzel szemben `normalizeRoleKeys`-szel
mindkét alakot elfogadja, így a kulcs átadása ott nem változtat semmit. A
webprojekt mindkét helyre a magyar feliratot adja át – ott a labdahordozó-
heurisztika csendben sosem fut le; ezt a mobilban nem másoltuk le.
**Alternatíva:** magyar felirat átadása, a webbel egyezően – a heurisztika
nem működne.
**Következmény:** Méréssel a jelenlegi adaton **0/28 párosításon** változik a
scouting riportja a kulcsok átadásától (a `comboGuards` ág eredménye
egybeesik a tartalék SG-szűrővel), tehát a döntés most nem mozdít a
kimeneten – de a heurisztika mostantól tud működni. A `@core` javítása (a
`resolveRoleKey` használata a halmaz helyett) a webprojektre tartozik.
**Visszavonható?** Igen, a `lib/team-season-stats` `buildRosters`-ében.

## D-088 – A clutch parser `CSAPAT` összegsor hibája javítva a webprojektben
**Dátum:** 2026-09-02
**Döntés:** A `@core/kosarstat-clutch-parse` `parseClutchTeamTable`-jét nem a
`core/` mappában patcheltük, hanem a webprojektben
(`asestats/lib/kosarstat-clutch-parse.ts`): a játékos-kihagyó feltétel most a
`csapat` és `total` névre is illeszkedik, nem csak a `jatekos` / `ossz*`-ra.
Utána `npm run sync:core` és külön `core:` commit.
**Miért:** A kosarstat clutch-tábla záró sora a csapatösszeg (`CSAPAT`), amit
a parser eddig játékosként dolgozott fel. Emiatt minden csapatösszeg
duplázódott (`ownPoints`/`oppPoints`/`diff`/`turnovers`), a mintahossz a
tényleges ~5:00 helyett 25:00-ra ugrott, és a `CSAPAT` sor a
`topUsageClosers` élére került. A ráta-mutatók túlélték, mert számláló és
nevező is duplázódott. Ez a webet is érinti (a `GameDetails.tsx` ugyanezt
hívja, és a duplázott számok bemennek az AI-riport promptokba) – ezért a
javítás helye a webprojekt, a `CLAUDE.md` „`core/`-t soha ne szerkeszd"
szabálya szerint.
**Alternatíva:** a `core/` másolat kézi patchelése (tiltott), vagy a
duplázott mezők megkerülése a mobil nézetmodellben (a `sampleLabel`, a
pontállás, a closers-lista így is hibás maradna).
**Visszavonható?** Igen, de nem érdemes – a régi viselkedés bizonyítottan
hibás.

## D-089 – A clutch nem fix 5 perces időablak, a szövegek a minta hosszát írják ki
**Dátum:** 2026-09-02
**Döntés:** A `lib/clutch-view.ts` szövegei (fejléc, lábjegyzet,
`Megállapítás`) sehol nem hivatkoznak „utolsó 5 percre"; a `sampleLabel`
értékét (`MM:SS`) viszont mindig kiírják, és a magyarázat „a ±5 pontos
állásnál játszott percek összessége".
**Miért:** A kosarstat „Clutch statisztikák" oldala nem fix időablakot ad: a
mért ASE-meccseken a minta 05:00 és 15:00 között szór (2025.09.27: a
játékossorok 15:00-sak, a `CSAPAT` sor 75:00 = 15:00 × 5 ötös csapat). „Utolsó
5 perc"-nek nevezni tehát a hosszabb mintáknál tárgyi tévedés lenne. A
webprojekt `export-to-md.ts`-e még „(±5 pont, utolsó 5 perc)"-ként címkézi –
ez a weben pontatlan, de a mobil scope-on kívül van.
**Alternatíva:** a webbel egyező „utolsó 5 perc" felirat (a hosszabb
mintáknál hibás), vagy a mintahossz elrejtése (a felhasználó nem látná,
mekkora adatra épül).
**Visszavonható?** Igen, a `clutch-view.ts` szövegeiben.

## D-090 – A Clutch szekció mindig látszik, adathiánynál magyarázó sorral
**Dátum:** 2026-09-02
**Döntés:** A Meccs részletein a `Clutch` szekció (címke + `ClutchPanel`)
mindig ki van rajzolva. Ha nincs kosarstat clutch-oldal (`missing`), vagy a
minta 60 mp alatti (`notClose`), a szekció egy magyarázó `Text` sort mutat,
nem tűnik el. A `Megállapítás` szövege sablonból áll össze a `@core`
számaiból.
**Miért:** A `QuarterScores` már ugyanígy viselkedik (D-047), és a
felhasználónak a hiányt is látnia kell: az „eltűnő szekció" azt a benyomást
keltené, hogy a képernyő hiányos. A `Megállapítás` a mobil app AI-mentessége
miatt sablon (D-076 mintája).
**Alternatíva:** a szekció elrejtése adathiánynál (a képernyő
kiszámíthatatlanul változna meccsről meccsre), vagy AI-összegzés (a mobil app
nem generál tartalmat).
**Visszavonható?** Igen, a `[id].tsx`-ben a szekció feltételessé tételével.

## D-091 – Az aktív tab ikonja glow réteget kap, a mockup sík indikátorán túl
**Dátum:** 2026-09-03
**Döntés:** A `ma-screen.html` mockup aktív tabja csak egy sík 24×3pt-os accent
sávot mutat a tabelem tetején. A `TabBar` ezen felül az aktív ikon mögé egy
56×32pt-os glow réteget is tesz: `glow[tone].fill` háttér és `glow[tone].border`
1pt keret.
**Miért:** A feladatlista S6 sora kifejezetten „aktív állapot cián glow-val"-t
kér, a mockup indikátora viszont glow nélküli. A réteg a `constants/theme`
`glow` tokenjeiből épül (D-005: accent keret + alacsony opacitású kitöltés, nem
`shadowColor`), tehát nem vezet be új tokent. A keret fókusz nélkül is 1pt,
csak `transparent` – így az ikon geometriája nem ugrik fókuszváltáskor.
**Alternatíva:** (a) csak a sík indikátorsáv, a feladatlista szövegével
szemben; (b) Skia `BlurMask` valódi elmosott glow-ért – túl nehéz egy
tabsávhoz, és a `CLAUDE.md` szerint is csak „kiemelt elemeken".
**Visszavonható?** Igen, a `TabItem` `iconWrap` fókuszos ágának törlésével.

## D-092 – Az Elemzés tab aktív hangneme lila, `text.ai` színnel
**Dátum:** 2026-09-03
**Döntés:** Az öt tab közül négy aktív állapota cián (`accent.cyan`, #00D4FF),
az **Elemzés** tabé lila: az ikon, a felirat és a felső indikátorcsík is a
`text.ai` (#C4B5FD) lavender. A glow réteg az `ai` hangnemben a `glow.ai`
(#7C3AED-alapú) áttetsző kitöltést kapja. Az útvonalnév→hangnem a `TAB_TONE`
tábla.
**Miért:** A P12 prompt (`asestats/context/mobile/mobile-design-prompts.md`,
„TAB BAR" pont) kimondja: „az aktív »Elemzés« tab ikonja és címkéje LILA
(#C4B5FD), nem cián – ez az egyetlen tab, ami AI tónust kap. A felső indikátor
csík is lila." Az `accent.ai` (#7C3AED) egy 24pt-os vonalas ikonon a
`surface1` sávban túl sötét lenne – a `text.ai` pont erre a célra létező,
sötét háttéren olvasható lila (lásd a token kommentjét és a P12 badge-eket).
**Alternatíva:** (a) minden tab cián, a prompttal szemben; (b) az indikátor és
az ikon `accent.ai`-val – kontrasztvesztés a sötét sávon.
**Következmény:** A `TabBar` már nem az `accentColor` táblából olvas (az az
`accent.ai` sötét lilát adná), hanem saját `TONE_FOREGROUND` leképezésből.
**Visszavonható?** Igen, a `TAB_TONE` kiürítésével minden tab ciánra áll vissza.
