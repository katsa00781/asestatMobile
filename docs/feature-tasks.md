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
- [ ] `components/Badge.tsx` – 7 variáns (cyan / orange / ai / positive / negative / warning / neutral)
- [ ] `components/SkeletonBlock.tsx` – shimmer betöltés (Reanimated)
- [x] `components/EmptyState.tsx` – üres állapot ikonnal és szöveggel
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
