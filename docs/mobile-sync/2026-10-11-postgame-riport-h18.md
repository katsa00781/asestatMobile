# Post-game riport – második hibalista (web H18) – mobil teendők

- **Dátum:** 2026-10-11
- **Típus:** @core | funkcionális
- **Állapot a mobilban:** ÁTVEZETVE (2026-10-11, mobil commit `46ca3bd`, @core szinkron `d07617f`; eszközös próba nyitva)

A webes H18 munka (ASE–Sopron KC 109–80, a H17 utáni második hibalista) mobilt
érintő változásai egy fájlban. Önállóan feldolgozható: a webes forrás megnyitása
nélkül végrehajtható. Séma- és adatváltozás **nincs**, kézi SQL nem kell.

Előfeltétel: a `2026-10-10-postgame-riport-javitasok.md` (H17) teendői – a két
fájl ugyanazt a két `@core` modult érinti, egy `npm run sync:core` mindkettőt
áthozza.

A mostani mobil build (`2538e5b`) **egyik változástól sem törik**: minden új
mező opcionális, a többi szöveg- és szabályváltozás.

## Érintett változások

| # | Változás | Webes commit | Mobil kódváltozás |
| --- | --- | --- | --- |
| 1 | Az összefoglaló a kész riportobjektumból épül (`composePostgameSummary`) | `ff80b8f` | sync; a `summary` magától frissül |
| 2 | Az adatminőségi megjegyzés kikerült az összefoglalóból | `ff80b8f` | nincs (a `notes` mező már külön jelenik meg) |
| 3 | Ellenfél-profil: a referencia alatti mutatók számokkal | `ff80b8f` | nincs (szöveg) |
| 4 | „Hatékony szerepjátékos” szabály + címke ↔ kiemelés egyeztetés | `ff80b8f` | sync; címke-szöveg ellenőrzése |
| 5 | Pontforrás-alapú döntő tényező (≥ 10 pont különbség) | `28dd2f2` | sync; magától megjelenik |
| 6 | Második esély: védőlepattanó-diagnózis, kétoldalú fókusz | `28dd2f2` | sync; szöveg |
| 7 | „Liga felett / alatt” sor csak ≥ 2 pp eltérésnél, számokkal | `28dd2f2` | sync; szöveg |
| 8 | Átfedő erősségek összevonva (eFG, félidős trend) | `28dd2f2` | sync; szöveg |
| 9 | Védekezés: verdikt eFG + TO + DRtg alapján (`context.defense`) | `28dd2f2` | sync; opcionális megjelenítés |
| 10 | Védekezési tényezők és lineup-probléma a Problémák között | `28dd2f2` | sync; a lineup-rész webes |
| 11 | A dobástérképről hiányzó dobás típusa (`coverage.missingDetail`) | `28dd2f2` | opcionális |
| 12 | Box score: 2P / 3P bontás, AST, LV, St, Bl (`PostgameBoxScoreLine`) | `a4e29ae` | opcionális: új sorok a box score kártyán |
| 13 | „Shot quality index” megnevezése: dobáshely-mix index | `a4e29ae` | címke-szöveg, ha a mobil kiírja |
| 14 | Az összefoglaló szakaszokra bontható (`parsePostgameSummary`); a Reflexió külön szakasz | `be52d90` | ajánlott: szakaszos megjelenítés |

A B egység (`a1038e6` – a cserék az eseménylistából, be / le
párosítás-ellenőrzés; új `lib/kosarstat-substitutions.ts`) a mobilt **nem
érinti**: a modul nem `@core`, a mobil nem jelenít meg rotációt. A D egység
többi része (trendtábla, ▲ / ▼ jelölés, lábjegyzetek) csak a webes Export MD.

---

## 1. `@core` frissítés

- [x] `npm run sync:core` – változott: `core/postgame-report.ts`,
      `core/player-postgame.ts`. A `MODULES` lista nem változik, új modul nincs.
- [x] `npx tsc --noEmit` – a változások visszafelé kompatibilisek, hibát nem
      várunk.

## 2. Az összefoglaló a kész riportobjektumból épül

### Mi változott

A `report.summary` eddig az `analyzePostGameReport`-ban készült, a
Kosarstat-összefűzés **előtt**: a fókuszblokkja a nyers `report.nextFocus`-t
(1–2 pont) mutatta, miközben a nézet 3 pontot; a „Kulcsmomentumok” sem látta az
összefűzés után hozzáadott döntő tényezőket.

- Új, opcionális `report.summaryParts: { overview: string[]; opponentProfile: string[] }`
  – az összefoglaló kiegészítésektől független sorai.
- Új export: `composePostgameSummary(report, focus?)` – a döntő tényezőket, a
  játékos-kiemeléseket és a fókuszt a kész objektumból veszi. `focus` nélkül a
  `buildPostgameAutoFocus(report)` listáját használja; `summaryParts` nélküli
  (régi) objektumnál a tárolt `summary` tér vissza.
- A `mergeKosarstatPostgameContext` az összefűzés után **maga újraépíti** a
  `summary`-t a `buildPostgameAutoFocus(merged, context)` listával.
- Az összefoglalóból kikerült a „• Megjegyzés: …” sor (a fókuszblokk utolsó
  pontjának látszott). A megjegyzések továbbra is a `report.dataNotes`-ban
  vannak.

### Hatás a mobilra

A `lib/postgame-data.ts` a `mergeKosarstatPostgameContext` kimenetét adja
tovább, a `lib/postgame-view.ts:75` pedig a `report.summary`-t írja ki – a
javítás a szinkron után **magától érvényesül**. A megjegyzéseket a
`postgame-view.ts:76` (`notes: report.dataNotes…`) külön mezőben mutatja, tehát
nem vész el semmi.

### Teendő

- [x] Ellenőrizni a szinkron után: az összefoglaló „Következő fókusz” blokkja
      ugyanazt a (legfeljebb 3) pontot mutatja, mint a fókusz-kártya (ehhez a
      H17-es jegyzet 5. pontja – `buildPostgameAutoFocus` a nézetben – is kell).
- [x] Ha a mobil valahol a `summary` szövegéből vágja ki a megjegyzést
      („Megjegyzés:” előtag), azt a `report.dataNotes`-ra átállítani.

## 3. Ellenfél-profil: a referencia alatti mutatók számokkal

### Mi változott

Az összefoglaló „Ellenfél profil” blokkja azt írta: „egyik fő saját
támadómutatónk sem esett a szezonátlag alá”, miközben az OREB% −3,6 pp, a TO
rate +1,9 pp volt. A szabály csak a nagy visszaesést figyelte, a TO rate-et
egyáltalán nem. Mostantól mind a hat mutató (eFG, 3P%, Assist%, TO rate, OREB%,
FTM rate) számít:

- 1 pp alatti elmaradás = a referencia szintje;
- e fölött, de a „jelentős” küszöb (eFG 3, 3P% 4, Assist% 5, TO rate 5, OREB% 6,
  FTM rate 5 pp) alatt: `… érdemi visszaesés egyik fő saját támadómutatóban sem volt; kisebb elmaradás a szezonátlagtól: OREB% 38.5% vs szezonátlag 42.1% (-3.6 pp); TO rate 11.8% vs szezonátlag 9.9% (+1.9 pp).`
- ha egyik sem rosszabb: `… minden fő saját támadómutatónk a szezonátlag szintjén vagy felette volt.`

### Teendő

- [x] Nincs kódváltozás (a `summary` szövege).

## 4. „Hatékony szerepjátékos” és a címke ↔ kiemelés egyeztetés

### Mi változott

Young (25 perc, VAL 19, VAL/36 27,4, TS 58%, usage 14,6%) a játékostáblában
„Limitált hatás” címkét kapott (Impact 37,9 a 38-as küszöb alatt – az alacsony
usage húzta le), a kiemelésekben pedig „Kiugró teljesítmény” volt.

`core/player-postgame.ts`:

- Új szabály: alacsony usage (≤ 15%) + VAL/36 ≥ 18 + TS% ≥ 55 + legalább 12
  perc → az `impactClass` legalább `support` (nem `struggling`), az
  `impactLabel` **„Hatékony szerepjátékos”**. A címke szerepet jelöl, nem
  rangot: eddig csak `mvp` osztálynál fordult elő (alacsony usage-ű vezető),
  mostantól `support` osztálynál is.
- A többi küszöb és osztály nem változott.

`core/postgame-report.ts`:

- `reconcilePlayerImpact`: a `report.playerImpact` listái a játékostábla
  osztályát követik – `struggling` osztályú játékos nem szerepel az
  `overperformers` között; `mvp` / `engine` osztályú nem szerepel a `negative`
  és az `underperformers` listán.

### Hatás a mobilra

A `components/PostgamePlayerCard.tsx` és a `PostgamePanel.tsx` az `impactLabel`
szövegét írja ki; a `postgame-view.ts:111–112` a `playerImpact.positive` /
`negative` listát. A „Hatékony szerepjátékos” eddig is létező címke, a
megjelenítés nem törik. A `highlights.struggling` listából az ilyen játékos
kikerül.

### Teendő

- [x] Ha a mobil a „Hatékony szerepjátékos” címkét rangként (pl. `mvp`-szintű
      színnel) kezeli, a színezést `impactClass`-ra kell állítani – a címke
      mostantól `support` osztályhoz is tartozhat.

## 5. Pontforrás-alapú döntő tényező

### Mi változott

A labdaeladásból szerzett pont (32–16) és a gyors befejezés (19–4) sem az
erősségek, sem a döntő tényezők között nem szerepelt – pedig a 29 pontos
különbség nagyobb része innen jött. A `mergeKosarstatPostgameContext` mostantól
érvényes pontforrásnál (az eseménylista pontösszege = végeredmény) hozzáadja:

- Új export: `POINT_SOURCE_DECISIVE_MIN = 10`. Ahol a saját − ellenfél
  különbség abszolút értéke ezt eléri, új `FactorMeta` kerül a
  `report.decisiveFactorMeta` **elejére** (a legnagyobb elöl), a
  `decisiveFactors.offense` és a `decisiveFactorAnnotations.offense` elejére is:

  | Pontforrás | `label` minta | `type` |
  | --- | --- | --- |
  | `pointsOffTurnovers` | `Labdaeladásból szerzett pont: 32–16 (+16)` | `Kontroll` |
  | `quickFinishPoints` | `Gyors befejezésből szerzett pont (≤ 6 mp): 19–4 (+15)` | `Hatékonyság` |
  | `secondChancePoints` | `Második esélyből szerzett pont: 18–6 (+12)` | `Volumen` |

  `axis: 'offense'`, `source: 'opponent'`, `tone`: `positive`, ha a különbség a
  saját javára szól, különben `negative`.
- Összevont sor a `report.strengths` **elejére**:
  `Pontforrás-fölény: labdaeladásból 32–16 (+16), gyors befejezésből 19–4 (+15) pont.`
  – hátránynál a `report.problems` elejére: `Pontforrás-hátrány: …`.

### Hatás a mobilra

A `lib/postgame-view.ts:292` a `report.decisiveFactorMeta`-n megy végig – az új
tényezők a szinkron után **maguktól megjelennek**, a saját kategóriájuk alatt.

### Teendő

- [x] Ellenőrizni az ASE–Sopron meccsen: a Kontroll csoport élén
      `Labdaeladásból szerzett pont: 32–16 (+16)`, a Hatékonyság élén
      `Gyors befejezésből szerzett pont (≤ 6 mp): 19–4 (+15)`.

## 6. Második esély: védőlepattanó-diagnózis

### Mi változott

A H17-es „Támadólepattanó-fölény nem vált pontra” sor és a fókusz csak a saját
oldalt kezelte. Az összefűzés most a box score-ból diagnosztizál (a
`report.metrics.boxScore` lepattanószámai, a `report.metrics.opponent.orebRate`
és a `keyStats` `oreb_rate` liga mediánja alapján):

- Ha az ellenfél OREB%-a a liga medián felett van:
  `Támadólepattanó-fölény nem vált pontra: OREB% +5.2 százalékpont a referenciához képest; ORB% különbség +7.4 pp, második esélyből 7–10 pont. Elsősorban védőlepattanó-gond: az ellenfél 9 támadólepattanóból 10 pontot szerzett (1.11 pont/OREB), OREB%-a 31.0% a liga medián (29.4%) felett; a saját oldalon 10 támadólepattanóból 7 pont lett (0.70 pont/OREB).`
  A fókusz: `Védőlepattanó zárás és második esélyek pontra váltása: boxout és első kontakt a saját gyűrű alatt (…); elöl a megszerzett támadólepattanó után azonnali befejezés vagy kiosztás (…).`
- Különben: `… Elsősorban a saját befejezésen múlt: …`, a fókusz a H17-es
  `Második esélyek pontra váltása: …` marad.

A sor előtagja (`Támadólepattanó-fölény nem vált pontra`) nem változott. A
`buildKosarstatPostgameContext` saját sora (box score nélkül) a rövid alak
marad; az összefűzés írja át a helyén.

### Teendő

- [x] Nincs kódváltozás. Ha a mobil a fókuszsor **előtagjára** szűr
      (`Második esélyek pontra váltása`), a `Védőlepattanó zárás és második esélyek pontra váltása`
      előtagot is fel kell venni.

## 7. „Liga felett / alatt” sor csak ≥ 2 pp eltérésnél

A „Labdajáratás a liga felett” +0,5 pp-nél is megjelent (csak a percentilist
nézte). `LEAGUE_GAP_MIN_PP = 2`: a liga mediántól legalább 2 pp kell, és a sor a
számokat is kiírja. Érintett sorok (az előtag változatlan, a zárójel új):

- erősség: `Dobáshatékonyság a liga felett (eFG 68.8% vs liga medián 52.5%, +16.3 pp)`,
  `Labdajáratás a liga felett (Assist% …)`, `Periméter-hatékonyság a liga felett (3P% …)`;
- probléma: `TO arány a liga felett (TO rate …)`, `Dobáshatékonyság a liga alatt (…)`,
  `Periméter-hatékonyság a liga alatt (…)`, `OREB volumen a liga alatt (…)`,
  `FTM rate a liga alatt (…)`.

- [x] Ha a mobil ezekre **pontos egyezéssel** szűr, előtag-egyezésre kell
      átállítani.

## 8. Átfedő erősségek összevonva

- A `Kosarstat eFG különbség: +14.3 pp előny.` sor a riport saját eFG-sorába
  olvad: `Dobáshatékonyság a szezonátlag felett (+10.2 százalékpont; az ellenfélhez mérve +14.3 pp)`
  (ugyanígy a problémáknál). Ha a riportnak nincs saját eFG-sora, a Kosarstat
  sor változatlanul megmarad.
- A `Második félidős trend` sor csak akkor jelenik meg, ha a második félidő
  különbsége meghaladja az elsőét (rosszabb, a problémánál), és nem egyetlen,
  már kiírt negyed adja. Az új alak az első félidőt is kiírja:
  `Második félidős trend: Q3-Q4 összesítésben +15 pontot nyertünk (első félidő: -10).`

- [x] Nincs kódváltozás.

## 9. Védekezés: verdikt eFG + TO + DRtg alapján

### Mi változott

A védekezés értékelése csak az ellenfél eFG%-ára épült („ligaszintű volt”),
miközben a kikényszerített TO rate 22,4%, a DRtg 106,2 volt.

- `report.context.defense` új, opcionális mezői: `opponentTurnoverRate`
  (százalék), `leagueTurnoverRate`, `drtg`, `leagueDrtg` (a liga medián hiányában
  `null`).
- `report.context.defenseEfficiencyDelta` három jelzés szavazata: ellenfél eFG
  (±2,5 pp a liga mediántól), kikényszerített TO rate (±3 pp), DRtg (±4 pont /
  100 birtoklás). `Higher` = jobb a liga szintjénél.
- Az összefoglaló mondata: `védekezésben a liga szintjénél jobb volt (DRtg 106.2 vs liga medián 108.8; ellenfél eFG 54.5% vs liga medián 52.5%, +2.0 pp; kikényszerített TO rate 22.4% vs liga medián 15.2%, +7.2 pp)`.

### Teendő

- [x] Ha a mobil a `context.defenseEfficiencyDelta`-t jelzőként (pl. chipként)
      mutatja, a jelentése változott: már nem csak a dobásengedés.
- [x] **NEM KÉSZÜL (D-134):** (opcionális) a védekezés-kártyán a `context.defense` három értékpárja
      megjeleníthető.

## 10. Védekezési tényezők és lineup-probléma a Problémák között

### Mi változott

- A védekezési döntő tényezők (`decisiveFactorMeta`, `axis: 'defense'`)
  `Védekezés:` előtaggal bekerülnek a `report.strengths` (pozitív `tone`) és a
  `report.problems` (negatív `tone`) végére, oldalanként legfeljebb 2:
  `Védekezés: Periméter-kockázat (ellenfél 3P 9/23, 39.1% vs liga medián 35.0%)`.
  Eddig a periméter-védekezés döntő tényező és fókusz volt, probléma nem.
- A `mergeKosarstatPostgameContext` új, opcionális `extraProblems?: string[]`
  opciója: a hívó saját problémasorai. A web a lineup-elemzés leggyengébb
  együttállását adja át (`Együttállás: … közös 6:13 perce alatt 9–22 (-13 pont) – a meccs leggyengébb, legalább 5 percet együtt töltő négyese (Kosarstat lineup).`).
  Ez a számítás a webes `lib/postgame-lineup-export.ts`-ben él, nem `@core`.

### Hatás a mobilra

A `strengths` / `problems` listák a szinkron után maguktól bővülnek. A
lineup-probléma a mobilban **nem** jelenik meg (a mobil nem olvas lineup
táblát) – ez tudatos eltérés a webtől.

### Teendő

- [x] Ellenőrizni, hogy a `Védekezés:` előtagú sorok kiférnek-e a
      probléma- / erősség-listában (a zárójeles bizonyítékkal ~75 karakter).

## 11. A dobástérképről hiányzó dobás típusa

`report.shotMap.coverage.missingDetail?: string` – mi hiányzik a box score 2P /
3P számai szerint (pl. `1 értékesített hárompontos`). Csak tiszta hiánynál van
kitöltve. A `report.dataNotes` megfelelő sora is bővült:
`… A box score szerint a hiányzó dobás: 1 értékesített hárompontos (3P a box score-ban 14/30, a dobástérképen 13/29; 2P 23/34, ill. 23/34).`

- [x] (opcionális) a H17-es jegyzet 6. pontjának figyelmeztető sorába:
      `coverage.missingDetail` zárójelben.

## 12. Box score: 2P / 3P bontás, AST, LV, St, Bl

### Mi változott

A `PostgameBoxScoreLine` (a `report.metrics.boxScore.own` / `.opponent` típusa)
új, **opcionális** mezői – az `analyzePostGameReport` mindig kitölti őket, régi
objektumban hiányoznak:

| Mező | Tartalom |
| --- | --- |
| `fgm2`, `fga2`, `twoPct` | kétpontos találat / kísérlet / százalék (egy tizedes) |
| `fgm3`, `fga3`, `threePct` | hárompontos találat / kísérlet / százalék |
| `ast`, `tov`, `stl`, `blk` | gólpassz, labdavesztés, labdaszerzés, blokk |

Ellenőrző számok (ASE–Sopron): ASE 2P 23/34 (67,6%), 3P 14/30 (46,7%), AST 21,
LV 10, St 12, Bl 2; Sopron 2P 17/33 (51,5%), 3P 9/23 (39,1%), AST 14, LV 19,
St 6, Bl 0.

### Hatás a mobilra

A `lib/postgame-view.ts` `buildBoxScore` öt sort ad (Mezőny %, Büntető %,
lepattanók) – a meglévő mezők változatlanok, a nézet nem törik.

### Teendő

- [x] (opcionális) `buildBoxScore` új sorai a meglévők mintájára, a mezők
      meglétének ellenőrzésével:

      ```ts
      ...(own.threePct !== undefined && opponent.threePct !== undefined
        ? [{ label: 'Tripla %', own: own.threePct, opponent: opponent.threePct, percent: true }]
        : []),
      ...(own.ast !== undefined && opponent.ast !== undefined
        ? [
            { label: 'Gólpassz', own: own.ast, opponent: opponent.ast },
            { label: 'Labdavesztés', own: own.tov ?? 0, opponent: opponent.tov ?? 0 },
            { label: 'Labdaszerzés', own: own.stl ?? 0, opponent: opponent.stl ?? 0 },
            { label: 'Blokk', own: own.blk ?? 0, opponent: opponent.blk ?? 0 },
          ]
        : []),
      ```

      (a labdavesztésnél a kisebb érték a jobb – ha a sáv a nagyobbat emeli ki,
      ezt a sort érdemes semleges színnel mutatni).

## 13. „Shot quality index” → dobáshely-mix index

A `shotQualityIndex` képlete **nem** változott (gyűrű 1,25 · festék 0,8 · sarok
tripla 1,2 · egyéb tripla 0,65 − középtáv 0,9), csak a megnevezése: a mutató a
dobások **helyét** méri, a találatot nem – a középtáv negatív súlyú, ezért a jó
százalékkal dobott középtáv (pl. 4/5) is rontja. A web felirata: „Dobáshely-mix
index (shot quality)”. A `@core` két szövege is átíródott:

- `Dobásszelekció javult (a dobáshely-mix index emelkedett)` (erősség),
- `Dobástérkép: túl magas középtávoli arány, romló dobáshely-mix` (probléma).

- [x] Ha a mobil dobástérkép-kártyája „Shot quality” feliratot használ, érdemes
      ugyanerre átírni (és a magyarázatot tooltipbe / lábjegyzetbe tenni).

## 14. Az összefoglaló szakaszokra bontható

### Mi változott

A `report.summary` soronként tagolt szöveg: a `**Cím**` sor szakaszt nyit, a
„• ” kezdetű sorok a szakasz pontjai. A web eddig egy bekezdésként írta ki
(sortörések nélkül, `**` jelekkel) – ez a mobilban is így olvashatatlan, ha a
`plainText(report.summary)` egyetlen szövegblokkba kerül.

- Új export a `@core`-ban:

  ```ts
  import { parsePostgameSummary } from '@core/postgame-report';
  import type { PostgameSummarySection } from '@core/postgame-report';

  // { key: 'overview' | 'players' | 'opponent' | 'focus' | 'reflection' | 'text'; title: string; items: string[] }[]
  const sections = parsePostgameSummary(report.summary);
  ```

  A pontok a vezető „•” nélkül jönnek; cím nélküli (régi, tagolatlan) szövegre
  egyetlen `key: 'text'`, üres című szakasz tér vissza; üres szövegre `[]`.
- A szakaszok sorrendben: `Mérkőzés összefoglalója` (`overview`),
  `Játékos kiemelések` (`players`), `Ellenfél profil` (`opponent`),
  `Következő fókusz` (`focus`), és – ha van pre-game visszacsatolás –
  `Reflexió` (`reflection`).
- **Szövegváltozás:** a pre-game visszacsatolás eddig a fókuszblokk utolsó
  pontja volt (`• Reflexió: …`); mostantól saját `**Reflexió**` szakasz, a
  `report.reflection.xFactor` és `.risk` külön pontként.
- A pontok jellemzően `Címke: szöveg` alakúak (pl. `Tempó: szezonátlag körüli
  (75.3 támadás).`) – a web a 60 karakternél rövidebb, pontosvessző nélküli
  előtagot címkeként emeli ki.

### Hatás a mobilra

A `lib/postgame-view.ts:75` `summary: plainText(report.summary)` továbbra is
működik (a szöveg formátuma a Reflexió-sor kivételével nem változott).

### Teendő

- [x] (ajánlott) az összefoglaló kártyán `parsePostgameSummary(report.summary)`
      szakaszai: szakaszonként cím + lista, a `focus` szakasz kiemelve. Ha a
      mobil a `report.reflection`-t már külön mutatja, a `reflection` szakasz
      kihagyható (a web is így tesz).

---

## Kézi lépések

Nincs: sem SQL migráció, sem újraimport nem kell.

## Lezárás

Átvezetés után az `Állapot` sor: `ÁTVEZETVE (YYYY-MM-DD, mobil commit <hash>)`.

## Átvezetés eredménye (2026-10-11)

- **Kód:** `d07617f` (`@core` szinkron, a H17-tel közös), `46ca3bd`
  (szakaszolt összefoglaló az új `PostgameSummaryCard`-dal, box score 2P / 3P
  és számláló sorok, „Dobáshely-mix index” felirat). A hiányzó dobás típusa
  (11. pont) a H17-es commitban (`db96c6f`) került a lefedettség-sorba.
- **Döntések:** szakaszonként külön kártya, a fókusz narancs kiemeléssel
  (D-132); a box score feliratai a mobil szóhasználatával, az eladott labdánál
  fordított kiemelés semleges szín helyett (D-133); védekezés-kártya,
  index-lábjegyzet és lineup-probléma nem készül (D-134).
- **Ellenőrzés:** az ASE–Sopron meccsen és további 10 meccsen élő adaton,
  harnesszel. A fókusz-szakasz és a fókusz-kártya egyezik; a pontforrás-
  tényezők a Kontroll és a Hatékonyság csoport élén állnak; a box score a
  12. pont ellenőrző számait adja. A mobil nem szűr sorra előtag vagy pontos
  egyezés alapján, a `defenseEfficiencyDelta`-t nem mutatja jelzőként.
- **Nyitva:** eszközös próba (iOS + Android), a `docs/feature-tasks.md`
  „Web → mobil szinkron” szakaszában külön sorként.
