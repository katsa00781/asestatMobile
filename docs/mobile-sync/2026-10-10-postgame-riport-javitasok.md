# Post-game riport javítások (web H17) – mobil teendők

- **Dátum:** 2026-10-10
- **Típus:** @core | funkcionális
- **Állapot a mobilban:** ÁTVEZETVE (2026-10-11, mobil commit `db96c6f`, @core szinkron `d07617f`; eszközös próba nyitva)

A webes H17 munka (ASE–Sopron KC 109–80 post-game hibalista) mobilt érintő
változásai egy fájlban. Önállóan feldolgozható: a webes forrás megnyitása
nélkül végrehajtható. Séma- és adatváltozás **nincs**, kézi SQL nem kell.

A mostani mobil build (`2538e5b`) **egyik változástól sem törik**: minden új
mező opcionális vagy a `@core` belső típusában él, a többi szövegváltozás.

## Érintett változások

| # | Változás | Webes commit | Mobil kódváltozás |
| --- | --- | --- | --- |
| 1 | Festék-szabály a dobástérkép gyűrű + festék zónájából | `08b0da3` | sync; opcionális: festék sor a dobástérkép kártyán |
| 2 | ORB% ↔ második esély ellentmondás-ellenőrzés | `08b0da3` | sync + egy új bemeneti mező (`expectedPoints`) |
| 3 | Impact címkék: a rang az osztályt követi | `08b0da3` | sync; címke-szöveg ellenőrzése |
| 4 | Közös „Következő fókusz” lista (`buildPostgameAutoFocus`) | `08b0da3` | igen: a nézet ezt a listát mutassa |
| 5 | Dobástérkép-lefedettség (`shotMap.coverage`) | `08b0da3` | opcionális figyelmeztető sor |

| 6 | Megjelenítési szabály: Net/40 (On40) csak 5 perc fölött | `f3ffea7` | nincs (tájékoztató) |

A többi webes egység a mobilt **nem érinti**: az A (Export MD ötös-blokk,
webes lineup-parser; `2a71d1f`) és a C–D (az Export MD új szakaszai;
`69d7be2`) csak a webes exportot és a webes komponenst módosítja, a mobil nem
olvas Kosarstat lineup táblát.

---

## 1. `@core` frissítés

- [x] `npm run sync:core` – változott: `core/postgame-report.ts`,
      `core/player-postgame.ts`. A `MODULES` lista nem változik, új modul nincs.
- [x] `npx tsc --noEmit` – a változások visszafelé kompatibilisek, hibát nem
      várunk.

## 2. Festék-szabály (hiba: „Festékbefejezések visszaestek”)

### Mi változott

A riport eddig a box score **2P-kísérletarányát** (`twoRate`) nevezte
festéknek. Ez a középtávot is tartalmazza, és a tripla-arány tükre – az
ASE–Sopron meccsen −8,4 pp-t mutatott, miközben a gyűrű-arány +6,5 pp-vel nőtt.

- `TeamShotMapSummary` új mezői: `paintRate`, `paintPct` (a gyűrűn kívüli
  festék zóna), `interiorRate` (gyűrű + festék együtt).
- `ShotMapComparison` új mezői: `paintRateDelta`, `interiorRateDelta`.
- Megbízható dobástérképnél a „Festékbefejezések visszaestek” / „Festékből
  több befejezés” sor és a „Festékfókusz erősebb” döntő tényező csak az
  `interiorRateDelta` (≥ 6 pp) alapján jön, és kiírja mindkét zónát:
  `Festékbefejezések visszaestek (gyűrű + festék zóna aránya -21.8 pp; gyűrű -14.2 pp, festék -7.7 pp)`.
- Dobástérkép nélkül a sor a tényleges mutatót nevezi meg:
  `2P-kísérletek aránya visszaesett (-9.4 százalékpont; dobástérkép nélkül a festék-volumen nem ítélhető meg)`,
  és a „Festék kontroll / rim run” fókusz nem aktiválódik.

### Hatás a mobilra

A `lib/postgame-view.ts` `buildShotMap` a `rimRate` / `midRate` / `threeRate` /
`corner3Rate` mezőket és a `zones` táblát olvassa – ezek változatlanok. A
szövegek a `report.strengths` / `problems` / `decisiveFactors` sorain keresztül
automatikusan frissülnek.

### Teendő

- [x] (opcionális) `buildShotMap` `rates` listájába „Festék arány” sor:
      `shotItem('Festék arány', `${formatDecimal(team.paintRate, 1)}%`, delta.paintRateDelta)`
      – a négy arány (gyűrű, középtáv, hármas) eddig nem adott ki 100%-ot, a
      festék zóna hiányzott.

## 3. ORB% ↔ második esély ellentmondás-ellenőrzés

### Mi változott

A „Második esély: ORB% különbség +7.4 pp.” az erősségek között szerepelt,
miközben a második esélyből szerzett pont 7–10 volt. Új szabály a `@core`-ban:
ha érvényes pontforrás mellett a saját második esély pont **nem több** az
ellenfélénél, a lepattanó-fölényre épülő erősség-sorok kikerülnek, és helyettük:

- probléma: `Támadólepattanó-fölény nem vált pontra: ORB% különbség +7.4 pp, második esélyből 7–10 pont.`
- fókusz: az „OREB agresszivitás fenntartása…” sor helyére
  `Második esélyek pontra váltása: a megszerzett támadólepattanó után azonnali befejezés vagy kiosztás (második esélyből 7–10 pont).`

Érintett erősség-sorok: `Második esély: ORB% különbség …` (kosarstat) és
`Támadólepattanózás erős …` (riport).

A `mergeKosarstatPostgameContext` ezt mindig elvégzi (ott ismert, hogy az
eseménylista pontösszege egyezik-e a végeredménnyel). A
`buildKosarstatPostgameContext` csak akkor, ha megkapja az új, opcionális
`expectedPoints` bemenetet.

### Hatás a mobilra

A `lib/postgame-data.ts` a `mergeKosarstatPostgameContext` kimenetét adja
tovább, így a javítás a szinkron után **magától érvényesül**. Az
`expectedPoints` csak akkor kell, ha a mobil valahol a kosarstat kontextus
saját `strengths` / `problems` listáját mutatja közvetlenül (a web „Kosarstat
only” nézete ilyen).

### Teendő

- [x] `lib/postgame-data.ts`, a `buildKosarstatPostgameContext({ … })` hívásba:

      ```ts
      expectedPoints: { own: game.ourScore, opponent: game.oppScore },
      ```

      (a mező neve a mobil `game` típusa szerint; a saját csapat pontja az `own`).

## 4. Impact címkék

### Mi változott

`core/player-postgame.ts` `mapContextualImpactLabel`: a címke rangja mindig az
impact osztályt (`impactClass`) követi, a szerep és a játékidő csak jelző.

| Eset | Régi címke | Új címke |
| --- | --- | --- |
| `engine`, nem kezdő | Rotációs hozzájárulás | **Stabil alappillér (padról)** |
| `support`, kezdő, ≥ 26 perc | Stabil alappillér | **Rotációs hozzájárulás** |
| `support`, Impact ≥ 52, de < 16 perc (kezdőnél < 12) | Rotációs hozzájárulás | **Rotációs hozzájárulás (rövid percben)** |

Az osztályozás (`impactClass`, küszöbök) **nem** változott, csak a
`impactLabel` szövege. Ellenőrző példa (ASE–Sopron): Halmai 61,9 → „Stabil
alappillér (padról)”, Joseph 58,3 → „Stabil alappillér”, Eilingsfeld 62,3
(15 perc) → „Rotációs hozzájárulás (rövid percben)”.

### Hatás a mobilra

A `components/PostgamePlayerCard.tsx` a `impactLabel`-t kiírja; a
`lib/postgame-view.ts:336` „Stabil alappillérek” csoportcíme az
`highlights.engines` listából dolgozik, nem a címke szövegéből – nem törik.

### Teendő

- [x] Ellenőrizni, hogy a hosszabb címke („Rotációs hozzájárulás (rövid
      percben)”, 37 karakter) kifér-e a játékoskártya címke-helyén; ha a mobil
      bárhol a címke **szövegére** szűr vagy színez, azt `impactClass`-ra
      átállítani.

## 5. Közös „Következő fókusz” lista

### Mi változott

A web eddig a komponensben állította össze a megjelenített fókuszlistát
(ellenfél-specifikus fókusz + riport + kosarstat), az Export MD pedig csak a
`report.nextFocus`-t írta ki – a harmadik pont (periméter-kockázat) elveszett.
A logika a `@core`-ba került:

```ts
import { buildPostgameAutoFocus, buildOpponentLinkedBreakdown } from '@core/postgame-report';

// legfeljebb POSTGAME_AUTO_FOCUS_LIMIT (3) elem, témánként egy
const focus = buildPostgameAutoFocus(report, kosarstat);
```

- `kosarstat`: a `buildKosarstatPostgameContext` visszatérési értéke (csak a
  `nextFocus` és a `problems` mezője kell), vagy elhagyható.
- A lista első eleme az ellenfélhez kötött javítandó döntő tényező, pl.
  `Ellenfél-specifikus fókusz: Periméter-kockázat (ellenfél 3P 9/23, 39.1% vs liga medián 35.0%).`
- Új exportok még: `isNegativeDecisiveLabel`, `PostgameOpponentLinkedRow`
  (`kind: 'opponentStrength' | 'control' | 'ownIssue'`).

### Hatás a mobilra

A `lib/postgame-view.ts:119` `nextFocus: toEntries(report.nextFocus)` a nyers
riportlistát mutatja – ugyanaz az eltérés, ami a webes MD-ben volt.

### Teendő

- [x] `lib/postgame-data.ts`: a `kosarstat` kontextust (vagy a kész fókuszlistát)
      továbbadni a nézetmodellnek.
- [x] `lib/postgame-view.ts`: `nextFocus: toEntries(buildPostgameAutoFocus(report, kosarstat))`.

## 6. Dobástérkép-lefedettség

### Mi változott

`report.shotMap.coverage?: { shotMapAttempts, boxAttempts, missing }` – a
dobástérkép dobásszáma a box score mezőnykísérleteihez mérve (`missing` > 0:
ennyi dobás hiányzik). Eddig csak ≥ 3 dobás / ≥ 5% eltérésnél volt megjegyzés;
mostantól bármilyen eltérésnél kerül sor a `report.dataNotes`-ba:

`Dobástérkép lefedettség: 63 dobás a box score 64 mezőnykísérletéből (1 hiányzik) – a dobástérkép FG%-a 57.1%, a box score-é 57.8% (37/64).`

### Teendő

- [x] (opcionális) `buildShotMap`: ha `shotMap.coverage?.missing` nem 0,
      figyelmeztető sor a kártya tetején (a `sampleNote` mintájára). A web
      szövege: „1 dobás hiányzik a dobástérképről: 63 dobás a box score 64
      mezőnykísérletével szemben – a zónaadatok és az FG% ehhez mérten
      értendők.”

## 7. Megjelenítési szabály: Net/40 csak 5 perc fölött (tájékoztató)

A webes post-game ötös-táblában az On40 (40 percre vetített pontkülönbség)
mostantól csak legalább **5 perc** (300 mp) együtt töltött időnél jelenik meg,
alatta „–” – rövidebb mintából irreális érték jön ki (+219,2, −400,0). Az
Export MD ugyanezt a küszöböt használja (`LINEUP_NET_MIN_SECONDS`), a páros /
hármas rangsor és a `lineupInsights` már korábban is.

Kapcsolódó adatszabály ugyanitt: a Kosarstat ötös-táblájának **0:00 idejű, de
pontot tartalmazó** sora (csere közben dobott büntető) érvényes sor – eldobva
az ötösök pontösszege elmarad a végeredménytől (ASE–Sopron: 108 a 109 helyett).

### Teendő

- [x] Most nincs: a mobil nem jelenít meg ötös-táblát. Ha később bekerül, a
      két szabályt (5 perces küszöb a vetített értékre; a 0:00 idejű pontos sor
      megtartása) követni kell.

---

## Kézi lépések

Nincs: sem SQL migráció, sem újraimport nem kell.

## Lezárás

Átvezetés után az `Állapot` sor: `ÁTVEZETVE (YYYY-MM-DD, mobil commit <hash>)`.

## Átvezetés eredménye (2026-10-11)

- **Kód:** `d07617f` (`@core` szinkron, a H18-cal közös), `db96c6f` (közös
  fókuszlista, `expectedPoints`, „Festék arány” sor, lefedettség-sor a
  dobástérkép fölött).
- **Döntések:** a fókuszlista a riporttal együtt jön az adatrétegből
  (D-130); a festék-arány és a lefedettség-sor megjelenítése (D-131).
- **Ellenőrzés:** az ASE–Sopron meccsen és további 9 meccsen élő adaton,
  harnesszel – a számok a `docs/feature-tasks.md` 2026-10-11-i
  munkanapló-bejegyzésében. A mobil nem szűr és nem színez a címke szövege
  alapján. A 37 karakteres jelvény a betűszélességekből számolva ~235 pt, a
  kártya belső szélessége 330 pt.
- **Eltérés a példaszámoktól:** az élő adaton a liga 3P medián 33.5% (a
  jegyzetben 35.0%), a szezon OREB% 45.0% (a jegyzetben 42.1%). A mobil a
  H12-es definícióval számol (saját támadó / saját támadó + ellenfél védő
  lepattanó).
- **Nyitva:** eszközös próba (iOS + Android), a `docs/feature-tasks.md`
  „Web → mobil szinkron” szakaszában külön sorként.
