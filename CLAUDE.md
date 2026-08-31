# ASEStats Mobile – CLAUDE.md

## Szerepkör

Te egy tapasztalt Expo és React Native mérnök vagy, aki megépíti az **ASEStats Mobile**
alkalmazást iOS-re és Androidra. Írj tiszta, egyszerű, karbantartható kódot.
A világosságot részesítsd előnyben a felesleges absztrakciókkal szemben.

Ez a fájl a projekt szerződése. **Minden feature előtt olvasd el**, és mellé a
`docs/feature-tasks.md` munkanaplóját és döntésnaplóját.

---

## Projekt áttekintés

**ASEStats Mobile** – natív mobil kliens az ASE (Atomerőmű SE) kosárlabdacsapat belső
statisztikai platformjához. A meglévő Next.js webalkalmazás **fogyasztói** nézeteit
viszi zsebre: a stáb és a menedzsment a lelátón, edzésen, buszon is meg tudja nézni a
statisztikát és az AI-elemzéseket.

Az app a következőket tartalmazza:

- **Ma** – a következő/legutóbbi meccs, csapat KPI-ok, gyors belépési pontok
- **Játékosok** – szezon-aggregált játékoslista, játékos részletes nézet, trendek
- **Meccsek** – lejátszott meccsek + közelgő fixtures, meccs részletei box score-ral
- **Tabella** – bajnoki tabella
- **Elemzés** – mentett AI riportok (pregame / postgame / játékos / csapat) olvasása
  + a `@core` modulokból számított elemzések (szituációk, four factors, clutch)
- Szezon/csapat szűrő bottom sheetben, perzisztálva
- Supabase email/jelszó bejelentkezés

Az implementáció legyen egyszerű és olvasható.

### Kifejezetten NEM része az appnak

- **Semmilyen import, adminisztráció vagy törlés** – ezek desktop-only maradnak
- **AI riport generálás** – a mobil app csak **olvassa** a már legenerált riportokat
  a `game_text_reports` / `team_text_reports` / `player_text_reports` táblákból,
  közvetlen Supabase SELECT-tel. A generáló `app/api/*` route-ok `requireAdmin`-esek
  és mutálók, ezek a mobil scope-on kívül vannak.
- Offline mód, push értesítés, widget – v1 után

---

## Tech stack

- **Expo** (managed workflow) + React Native
- **TypeScript** strict mode
- **Expo Router** – fájl-alapú navigáció, tab layout
- **NativeWind v4** – styling, Tailwind szintaxis
- **Zustand** – globális kliens state
- **AsyncStorage** – perzisztencia (szűrők, session)
- **@supabase/supabase-js** – adat + auth (AsyncStorage adapterrel, `react-native-url-polyfill`)
- **victory-native XL** + `@shopify/react-native-skia` – chartok
- **react-native-reanimated** + `react-native-gesture-handler` – animációk, bottom sheet
- **lucide-react-native** – ikonok
- **expo-font** – Barlow Condensed / DM Sans / JetBrains Mono

**Új könyvtárat ne adj hozzá engedély nélkül.** Ha indokolt lenne, javasold és kérdezz rá.
Cél: max ~12 fő dependency.

### Nincs Clerk

Az auth **Supabase Auth** marad, mert a webalkalmazás is azt használja, és ugyanaz a
`auth.users` tábla + `user_metadata.role` adja az RBAC-ot. Ne építs egyedi auth
megoldást, és ne vezess be Clerk-et.

---

## Platform: iOS és Android egyaránt

Egy közös kódbázis, **azonos UI mindkét platformon** – ugyanaz az 5 tab, ugyanaz a
Dark Command Center design nyelv. Csak a technikai platform-eltéréseket kezeljük:

| Terület | Kezelés |
|---|---|
| Safe area | `react-native-safe-area-context`, `useSafeAreaInsets()` – soha ne hardcode-olj 44/34pt-ot |
| Státuszsáv | `expo-status-bar` `style="light"` (sötét téma) mindkét platformon |
| Hardveres back (Android) | Bottom sheet és modal **kötelezően** kezeli a back gombot (`BackHandler` vagy a sheet saját `onRequestClose`-a) |
| Vissza gesztus (iOS) | Az Expo Router alap swipe-back viselkedése marad, ne tiltsd le |
| Nyomás-visszajelzés | `Pressable` + opacity/háttér váltás. Android ripple csak ott, ahol nem ütközik a glow-val |
| Betűrenderelés | A `expo-font` mindkét platformon ugyanazt a 3 családot tölti; Androidon a Barlow Condensed `letterSpacing` optikailag szűkebb – ha eltérés látszik, `Platform.select` a tracking értékre |
| Árnyék / glow | iOS `shadow*`, Android `elevation` – **lásd lentebb a glow rétegzést**, ez az elsődleges megoldás mindkét platformon |
| Haptics | `expo-haptics` opcionális, mindkét platformon egységesen |

**Szabály:** ha egy `Platform.OS` elágazást írsz, kommentben indokold, és vedd fel a
döntésnaplóba, ha nem triviális.

---

## Fejlesztési filozófia

Feature-by-feature építés. Minden feature esetén:

1. Olvasd el ezt a fájlt és a `docs/feature-tasks.md` naplóit
2. Tartsd az implementációt egyszerűnek
3. Kerüld a túlbonyolítást
4. Az olvasható kódot részesítsd előnyben az okossal szemben
5. Először a legkisebb működő verziót építsd meg
6. Csak akkor refaktorálj, ha ismétlés jelenik meg
7. **Magyar UI, angol kód** – felhasználói szöveg és dokumentáció magyarul, identifikátorok angolul

---

## Döntési szabályok

Ha valami nem egyértelmű, javasold a jobb megközelítést.
Ha egy új könyvtár segítene, indokold meg és kérdezz rá, mielőtt hozzáadod.
Meglévő UI-t ne változtass meg engedély nélkül.

**Kérdezz rá, mielőtt:**

- Új npm csomagot adsz hozzá
- Új design tokent vezetsz be (új szín, új típusméret, új animáció)
- A `@core` modulok bármelyikét módosítanád
- Adatbázis-sémát érintő igény merül fel (a mobil app **nem ír** sémát)
- Eltérnél az elfogadott mockuptól

---

## Mappastruktúra

```
asestatMobile/
├── app/                    # Expo Router – CSAK route-ok és képernyők
│   ├── _layout.tsx         # gyökér layout: fontok, auth guard, providerek
│   ├── login.tsx
│   └── (tabs)/
│       ├── _layout.tsx     # 5 tab: Ma / Játékosok / Meccsek / Tabella / Elemzés
│       ├── index.tsx       # Ma
│       ├── players/
│       ├── games/
│       ├── standings.tsx
│       └── analysis/
├── components/             # újrafelhasználható UI elemek
│   ├── StatTile.tsx
│   ├── StackedRow.tsx
│   ├── StatMatrix.tsx
│   ├── FilterSheet.tsx
│   ├── GlowCard.tsx
│   ├── Badge.tsx
│   ├── SkeletonBlock.tsx
│   └── EmptyState.tsx
├── constants/
│   ├── theme.ts            # design tokenek TS-ben (szín, típus, spacing, radius)
│   └── images.ts           # centralizált kép import
├── core/                   # a web lib/ elemző magjának tükre – lásd @core szakasz
├── data/                   # hardcoded tartalom, típusosan (pl. terminológia fallback)
├── hooks/
│   ├── useFilterData.ts
│   ├── useGameData.ts
│   └── usePlayerData.ts
├── lib/
│   ├── supabase.ts         # RN Supabase kliens (AsyncStorage adapter)
│   └── format.ts
├── store/
│   ├── filterStore.ts      # selectedSeasonId, selectedTeamId – AsyncStorage-perzisztált
│   └── authStore.ts
├── types/
├── assets/
│   ├── fonts/
│   └── images/
└── docs/
    ├── feature-tasks.md    # feladatlista + munkanapló + döntésnapló
    └── prompt-templates.md
```

**app/** – csak route-ok és képernyők. Komponenseket és üzleti logikát ne tartalmazzon.
Egy képernyőfájl ideálisan 150 sor alatt van: adat a hookból, megjelenítés komponensekből.

**components/** – akkor hozz létre komponenst, ha több helyen újra van használva,
átláthatóbbá teszi a képernyőt, vagy önálló UI koncepciót képvisel.

**store/** – Zustand store-ok. A `filterStore` mezői: `selectedSeasonId`,
`selectedTeamId`, `hydrated`. AsyncStorage-gal perzisztálva.

**lib/** – külső service helperek. Titkos kulcsot soha ne tárolj itt.

---

## A `@core` elemző mag

A webprojekt `lib/` mappájában ~15 modul (~9 500 sor) **nulla külső importtal** fut –
se React, se Next, se DOM, se Supabase. Ezek React Native alatt módosítás nélkül
futtathatók, és ezek adják az app teljes elemzési logikáját:

`stat-formulas` · `positions` · `terminology` · `style-vocabulary` · `dashboard-types` ·
`player-stat-mapping` · `season-tables` · `fetch-all-rows` · `situational-analysis` ·
`kosarstat-clutch-parse` · `postgame-report` · `player-analysis` · `player-postgame` ·
`pregame-scouting` · `team-analysis`

Mivel a mobil app **külön repóban** él, ezek a `core/` mappába **másolva** kerülnek be,
és a `@core/*` path alias mutat rájuk (`tsconfig.json` + `babel.config.js`
`module-resolver`).

**Szabályok a `core/` mappára:**

- **Soha ne szerkeszd kézzel.** Ez a webprojekt `lib/`-jének tükre.
- Minden fájl tetején ott a `// GENERÁLT MÁSOLAT – forrás: asestats/lib/<fájl>.ts` fejléc.
- Ha egy képlet hibás vagy hiányzik: a **webprojektben** javítsd, majd szinkronizálj.
- Szinkronizálás: `npm run sync:core` (a `scripts/sync-core.ts` másol és fejlécet ír).
  A szinkron eredményét mindig külön committal vezesd be (`chore: @core szinkron`).
- Ha egy modul RN alatt nem fordul (pl. Node-specifikus API), **ne patcheld a másolatot** –
  jelezd, és a webprojektben kell tisztává tenni.

**Az első feladatod az Expo váz után:** `@core/stat-formulas` import füstteszt.
Ha az alias nem működik, azt oldd meg, mielőtt bármi másba kezdesz.

---

## UI szabályok – Dark Command Center (mobil)

A design nyelv a webalkalmazásból származik, a mobil mockupok (`ASEStats Mobile – *.html`)
**elfogadva**. A megadott designt pontosan replikáld: layout, spacing, padding, betűméret,
hierarchia, színek, border-radius, glow, igazítás és arányok mind egyezzenek.
**Ne approximálj, ne egyszerűsíts engedély nélkül.**

### Színtokenek – `constants/theme.ts` a Single Source of Truth

Ezek az értékek a mockupokból vannak ellenőrizve. **Hardcoded hex a komponensekben tilos.**

| Szerep | Token | Érték |
|---|---|---|
| Oldal háttér | `bg.base` | `#050B14` |
| Card alap | `bg.surface1` | `#0A1628` |
| Emelt / input / sheet | `bg.surface2` | `#0F1F3D` |
| Nested / aktív | `bg.surface3` | `#162440` |
| Primary accent | `accent.cyan` | `#00D4FF` |
| CTA / kiemelés | `accent.orange` | `#FF6B35` |
| AI tartalom | `accent.ai` | `#7C3AED` |
| Pozitív / nyert | `semantic.positive` | `#10D98A` |
| Negatív / vesztett | `semantic.negative` | `#FF4757` |
| Figyelmeztetés | `semantic.warning` | `#FFB627` |
| Főszöveg | `text.primary` | `#E8F4FF` |
| Kísérőszöveg | `text.secondary` | `#7A9ABB` |
| Placeholder / deaktivált | `text.muted` | `#4A6D95` |
| Vonal – finom | `border.subtle` | `#1E3A5F` |
| Vonal – aktív | `border.active` | `#2A4468` |
| Vonal – erős | `border.strong` | `#3A5478` |

> Megjegyzés: a `text.secondary` és `text.muted` szándékosan világosabb, mint a webes
> `CLAUDE.md` régi (elavult) leírása – a mobil olvashatóság miatt. A fenti értékek a helyesek.

### Tipográfia – 3 család, szigorú szereposztás

| Család | Használat |
|---|---|
| **Barlow Condensed** | H1–H4, label, badge, gomb- és tabfelirat. Label esetén ALL CAPS + `letterSpacing: 1.2–1.6` |
| **DM Sans** | body szöveg, leírás, riportszöveg |
| **JetBrains Mono** | **minden numerikus érték**, kötelezően `fontVariant: ['tabular-nums']` |

Típusskála **pt-alapú** (nem rem): 11 / 12 / 13 / 15 / 17 / 20 / 24 / 32.

### Mobil-specifikus szabályok

- **Tap target minimum 44×44pt.** Ha a vizuális elem kisebb, `hitSlop`-pal növeld.
- **Spacing 4pt rácson**: 4 / 8 / 12 / 16 / 20 / 24 / 32.
- **Radius**: `xs` 2 (badge), `sm` 4 (input), `md` 6 (gomb/tab), `lg` 10 (card), `xl` 14 (sheet/modal).
- **Hover nincs** – minden hover állapot **pressed** állapotra képződik le
  (`Pressable` + `opacity 0.85` vagy `surface2 → surface3` háttérváltás).
- **Glow rétegzéssel, nem shadow-val.** React Native nem tud színes, elmosott glow-t
  megbízhatóan mindkét platformon. Helyette: egy `borderWidth: 1` accent-színű keret
  `+` egy alatta fekvő, alacsony opacitású accent háttérréteg (`backgroundColor` 8–14%
  `rgba`), szükség esetén Skia `BlurMask` a kiemelt elemeken. **`shadowColor` színes
  glow-ra nem használható** – Androidon nem renderelődik.

### Komponens-leképezés a webről

| Web | Mobil | Megjegyzés |
|---|---|---|
| `StatCard` | **`StatTile`** | Kompaktabb, 2 vagy 3 oszlopos rácsban |
| `DataTable` | **`StackedRow`** | Listanézet: a sor függőlegesen csoportosított, nem táblázat |
| `DataTable` (sok oszlop) | **`StatMatrix`** | Vízszintesen görgethető mátrix, **fagyasztott első oszlop** (játékosnév) |
| `Card` | `GlowCard` | surface1 háttér, subtle border, opcionális accent glow réteg |
| `.ai-marker` | `GlowCard` `accent="ai"` | Bal oldali 3pt lila sáv |
| Szűrő fejléc | `FilterSheet` | Bottom sheet, nem inline dropdown |

### Animációk

Reanimated, `useSharedValue` + `withTiming`. Alap: 200–400ms, `Easing.out(Easing.cubic)`.
Lista-belépés stagger 60ms-onként. Betöltés: `SkeletonBlock` shimmer, **nem** spinner
első betöltéskor (spinner csak háttérfrissítésnél).

---

## Styling szabályok

Használj **NativeWind** osztályokat (`className`). A tokenek a `tailwind.config.js`-ben
a `constants/theme.ts`-ből származnak – ne írj hex értéket a Tailwind configba kézzel
duplikálva sem.

**StyleSheet / inline style kivételek (ezekhez ne használj `className`-t):**

- `SafeAreaView`
- `KeyboardAvoidingView`
- `Modal`
- `Animated.View` / Reanimated stílusok
- Runtime-ban számított dinamikus stílusok
- Platform-specifikus stílusok
- `Pressable` / `TouchableOpacity` pressed state
- Árnyékok és `elevation`

---

## Kép szabályok

Centralizált image importot használj:

1. Ellenőrizd, hogy létezik-e `constants/images.ts`
2. Ha nem, hozd létre
3. Minden app képet ott importálj
4. A centralizált objektumon keresztül használd őket

```ts
import logo from "@/assets/images/ase-logo.png";
export const images = { logo };
```

```tsx
<Image source={images.logo} />
```

Képeket ne importálj közvetlenül képernyőkben vagy komponensekben.

---

## Adat és Supabase szabályok

- **Egyetlen Supabase kliens**: `lib/supabase.ts`. Ne hozz létre másikat.
  AsyncStorage adapter + `autoRefreshToken: true` + `detectSessionInUrl: false`
  + `react-native-url-polyfill/auto` import a belépési pontban.
- **Csak olvasás.** A mobil app kizárólag `SELECT`-et futtat. Ha egy feature íráshoz
  vezetne, állj meg és kérdezz rá.
- **Minden lekérdezés szűrt** `season_id` és `team_id` szerint. Szűretlen full-table
  scan tilos.
- **Szezonspecifikus táblák**: a `@core/season-tables` `getSeasonStatsTable()`-jével
  állítsd elő a táblanevet. A `player_game_stats` UNION view az 1000 soros PostgREST
  limitbe ütközhet.
- **Lapozás**: a `@core/fetch-all-rows` helperrel, ahol több mint 1000 sor jöhet.
- **Lusta betöltés**: mobilon soha ne tölts be mindent belépéskor. Tabonként és
  képernyőnként töltsd az adatot, és cache-eld a store-ban a szűrő élettartamára.
- **Riportok olvasása**: `game_text_reports`, `team_text_reports`, `player_text_reports`
  – közvetlen SELECT, RLS engedi a bejelentkezett felhasználónak. API route nem kell.

---

## State management

- **Zustand** – globális kliens state (szűrők, auth session tükre)
- **Lokális `useState`** – átmeneti UI state
- **AsyncStorage** – perzisztencia (`selectedSeasonId`, `selectedTeamId`, Supabase session)

Ne vezess be React Query-t vagy más adat-réteget engedély nélkül – a hookok +
Zustand elég a v1-hez.

---

## TypeScript szabályok

- **strict mode** kötelező
- `any` tiltott – explicit interfész vagy narrowing
- Külső adatot (Supabase válasz) a rendszerhatáron validálj
- `import type { ... }` a típusimportokra
- Path aliasok: `@/components/...`, `@/lib/...`, `@core/...` – relatív `../../` import nem megengedett
- Tartsd a típusokat egyszerűnek és olvashatónak

---

## Feature implementáció

Minden feature esetén:

1. Olvasd el ezt a fájlt
2. Azonosítsd az érintett fájlokat
3. Tartsd a változtatásokat fókuszáltan
4. Ne írj át nem érintett kódot
5. Kövesd a meglévő mintákat
6. Győződj meg róla, hogy a feature end-to-end működik **iOS-en és Androidon is**
7. Javítsd a lint és type hibákat befejezés előtt (`npm run lint`, `npx tsc --noEmit`)
8. Vezesd át a `docs/feature-tasks.md`-t (pipa + munkanapló bejegyzés)
9. Készíts commitot

---

## Munkanapló és commitok

**A `docs/feature-tasks.md` a projekt egyetlen közös emlékezete.** Én nem látom, mit
csináltál az előző munkamenetben, és te sem emlékszel rá — ami nincs leírva abban a
fájlban, az elveszett. Ezért minden befejezett feladat után **kötelező** átvezetni.

### Feladat lezárásakor mindig

1. **Pipáld ki** az elvégzett sort a `docs/feature-tasks.md`-ben (`- [ ]` → `- [x]`)
2. **Írj munkanapló bejegyzést** a fájl Munkanapló szakaszába, **legfelülre**:
   dátum, mit csináltál, mely fájlokat érintetted, min teszteltél, mi maradt nyitva
3. **Ha döntést hoztál** — bármit, ami nem triviális és később megkérdőjelezhető —
   vedd fel a Döntésnaplóba: mi volt a döntés, miért, mi volt a másik opció
4. **Commitolj**, mielőtt a következő feladatba kezdesz

### Mi számít döntésnek

Rögzítsd, ha:

- eltértél a mockuptól vagy a design tokenektől (és miért)
- könyvtárat adtál hozzá vagy vetettél el
- adatszerkezetet, lekérdezés- vagy store-alakot választottál
- `Platform.OS` elágazást vezettél be nem triviális okból
- ismert korlátozással vagy ismert hibával engedtél tovább egy feature-t
- workaroundot építettél be (platform bug, teljesítmény, animációs trükk)

Egy döntés egy bekezdés. Ne írj esszét, de a **miért** mindig legyen benne.

### Commit szabályok

- **Egy feladat = egy commit.** Ne gyűjts össze több feature-t egy commitba.
- A `docs/feature-tasks.md` frissítése **ugyanabba a commitba** menjen, mint a kód.
- Commit üzenet magyarul, jelen időben, egy sor, prefixszel:

```
setup: NativeWind konfigurálása
feat: Ma képernyő
fix: fagyasztott oszlop elcsúszik Androidon
core: @core szinkron a webprojektből
docs: munkanapló és döntésnapló átvezetése
chore: lint hibák javítása
```

- Ha a commit döntést is tartalmaz, a törzsében hivatkozz rá:
  `Döntés: lásd docs/feature-tasks.md – D-004`
- **Ne pusholj** magadtól, csak ha kérem.
- Ne commitolj félkész, nem forduló kódot. Ha elakadtál, inkább írd be a munkanaplóba,
  hogy hol tartasz, és azt commitold.

### Munkamenet indításakor

Először olvasd el a `docs/feature-tasks.md` **munkanaplóját és döntésnaplóját**, hogy
tudd, hol tartunk és milyen döntések élnek már. Ne kezdj új feladatba anélkül, hogy
ezt megnézted volna.

---

## Titkok és biztonság

| Változó | Hol | Mire |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | kliens | Supabase projekt URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | kliens | publikus anon kulcs |

- **`SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` soha nem kerülhet
  a mobil appba.** Ezek a webprojekt szerveroldalán élnek. A mobil app nem generál AI
  tartalmat, tehát nincs is rájuk szüksége.
- Az `EXPO_PUBLIC_` prefixű változók **bekerülnek a kliens bundle-be** – csak publikus
  értéket tegyél ilyenbe.
- `.env` soha nem kerülhet git-be; `.env.example` igen, valós érték nélkül.
- Az adatvédelmet **RLS** adja Supabase-oldalon, nem a kliens.

---

## Autentikáció

Supabase Auth, email/jelszó. Ne építs egyedi auth megoldást, ne vezess be Clerk-et.

- A session AsyncStorage-ban perzisztálódik, `autoRefreshToken` bekapcsolva
- Az `app/_layout.tsx` auth guardja: nincs session → `login.tsx`, van → `(tabs)`
- Az `user_metadata.role === 'admin'` **csak** annyit jelent a mobilban, hogy az illető
  a weben adminisztrálhat. Mobilon **admin funkció nincs**, a role nem nyit fel semmit.

---

## Kommunikáció

Légy tömör. Magyarázd el, mi változott és hogyan lehet tesztelni.
Ha új csomag, új design token, vagy funkcionális eltérés merülne fel, kérdezz rá.

---

## Emlékeztető

**Minden feature ELŐTT:**

- Olvasd el ezt a fájlt
- Olvasd el a `docs/feature-tasks.md` munkanaplóját és döntésnaplóját
- Kövesd szigorúan
- Tiszta, egyszerű kódot írj
- A mockupot pontosan replikáld

**Minden feature UTÁN — kihagyás nélkül:**

- Pipáld ki az elvégzett sort a `docs/feature-tasks.md`-ben
- Írd be a munkanapló bejegyzést (mit, mely fájlokban, min teszteltél, mi maradt nyitva)
- Ha döntés született, vedd fel a döntésnaplóba (mi, miért, mi volt az alternatíva)
- Commitolj — egy feladat, egy commit, a doksi frissítésével együtt

Ha ezt kihagyod, a következő munkamenet vakon indul. Ez nem opcionális lépés.
