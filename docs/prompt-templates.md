# Prompt sablonok – ASEStats Mobile

Ezeket másold be a Claude Code promptjaidba. Mindegyik azzal kezdődik, hogy a CLAUDE.md-et
elolvastatja – ez a legfontosabb sor, ne hagyd ki.

---

## Munkamenet indítása (minden új session elején)

```
Olvasd el a CLAUDE.md-et és a docs/feature-tasks.md munkanaplóját és
döntésnaplóját. Foglald össze egy bekezdésben, hol tartunk és mi a következő
feladat. Még ne kezdj bele semmibe.
```

## Munkamenet indítása (Részfeladat indításakor)

```
Olvasd el a CLAUDE.md-et és a docs/feature-tasks.md munkanaplóját és
döntésnaplóját. Végezd el a következő részfeladatot. A feladat befejezése után hozz létre egy commit-ot. Összegezd mit változtattál. 
```

---

## UI képernyő építése

```
Olvasd el a CLAUDE.md-et és kövesd szigorúan.
Implementáld a [képernyő neve] képernyőt a docs/mockups/[fájl].html mockup alapján
pontosan, a constants/theme.ts tokenjeivel és a meglévő komponensekkel
(GlowCard, StatTile, StackedRow, StatMatrix, Badge).
Adatot a [hook neve] hookból vegyél, ne írj új Supabase lekérdezést a képernyőbe.
Ellenőrizd iOS-en és Androidon is.
Ne változtasd meg: [mit ne bántson].
```

---

## Közös komponens építése

```
Olvasd el a CLAUDE.md-et és kövesd szigorúan.
Készítsd el a components/[Név].tsx komponenst. Props: [felsorolás].
Kövesd a Dark Command Center tokeneket, a glow rétegzéses megoldást
(border + alacsony opacitású háttér, nem shadowColor), és a 44pt tap targetet.
Írj hozzá egy rövid használati példát kommentben.
Ne hozz be új könyvtárat.
```

---

## Adatréteg / hook

```
Olvasd el a CLAUDE.md-et és kövesd szigorúan.
Készítsd el a hooks/[név].ts hookot: [mit tölt be].
Használd a @core/season-tables getSeasonStatsTable()-jét a táblanévhez és a
@core/fetch-all-rows helpert a lapozáshoz. Minden lekérdezés szűrve legyen
season_id és team_id szerint.
Lusta betöltés: csak akkor fusson, amikor a képernyő ténylegesen látszik.
Hibaág és üres állapot is legyen kezelve.
```

---

## State integráció

```
Olvasd el a CLAUDE.md-et és kövesd szigorúan.
Integráld a [feature] state-et. Tárold a [adatot] Zustand-dal,
@react-native-async-storage/async-storage perzisztenciával.
[Viselkedési szabály, pl. "Ha nincs kiválasztott szezon, az is_current szezont
válaszd ki automatikusan."]
A meglévő UI-t pontosan őrizd meg.
```

---

## Konkrét hiba javítása

```
Olvasd el a CLAUDE.md-et és kövesd szigorúan.
A [dolog] [tényleges viselkedés]. Helyes viselkedés: [elvárt viselkedés].
Platform: [iOS / Android / mindkettő].
Semmilyen más viselkedést vagy layoutot ne változtass meg.
```

---

## `@core` szinkron

```
Olvasd el a CLAUDE.md-et és kövesd szigorúan.
Futtasd le az npm run sync:core-t, és nézd meg a diffet.
Ha bármelyik modul RN alatt nem fordul, NE patcheld a core/ másolatot – jelezd,
mit kellene a webprojektben javítani.
Külön commit: "core: @core szinkron a webprojektből".
```

---

## Feladat lezárása (minden feature után)

```
Zárd le ezt a feladatot:
1. Pipáld ki a sort a docs/feature-tasks.md-ben
2. Írj munkanapló bejegyzést legfelülre (mit, mely fájlokban, min teszteltél, mi maradt nyitva)
3. Ha döntés született, vedd fel a döntésnaplóba a következő sorszámmal
4. Commitolj — a doksi frissítése ugyanabba a commitba menjen
Ne pushold.
```

---

## Platform-eltérés bevezetése

```
Olvasd el a CLAUDE.md-et és kövesd szigorúan.
[Probléma leírása] miatt Platform.OS elágazásra van szükség a [fájl]-ban.
Írd meg a legkisebb lehetséges elágazást, kommentben indokolva.
Vedd fel a döntésnaplóba a következő sorszámmal.
```
