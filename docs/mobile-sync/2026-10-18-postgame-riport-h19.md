# Post-game riport – harmadik hibalista (web H19) – mobil teendők

- **Dátum:** 2026-10-18
- **Típus:** adattartalom | @core | funkcionális
- **Állapot a mobilban:** ÁTVEZETVE (2026-10-18, mobil commit `69f63cb`; az 1. pont adat-ellenőrzése és az eszközös próba nyitva)

A webes H19 munka (ASE–Budapesti Honvéd 112–81, 2026-10-17, külső elemzés
hibalistája) mobilt érintő változásai egy fájlban. Önállóan feldolgozható: a
webes forrás megnyitása nélkül végrehajtható. Séma-változás **nincs**, kézi SQL
nem kell.

## Érintett változások

| # | Változás | Webes commit | Mobil kódváltozás |
| --- | --- | --- | --- |
| 1 | Az ASE–Honvéd meccs `games.kosarstat_game_id` linkje visszaírva | `1d68a08` (+ adat) | nincs; ellenőrzés |
| 2 | „Kiugró teljesítmény” az Impact score-ból; „Limitált hatás” ≥ 8 perc | `9d6ab02` | sync; szöveg |
| 3 | Védekezés: a DRtg dönt, a mondat a négy faktort nevezi meg (`context.defense` új mezői) | `56c14d6` | sync; opcionális megjelenítés |
| 4 | Gyűrű-befejezés, büntetők (triplaarány-kontextus), faultfegyelem; fókuszlista | `ec2c3f8` | sync; szöveg |
| 5 | Dobástérkép 3P-besorolási eltérés (`coverage.misclassifiedThrees`) | `6a88277` | sync; opcionális figyelmeztetés |
| 6 | „Mi döntötte el?” volumen / hatékonyság bontás (`metrics.marginBreakdown`) | `dc76c6c` | sync; opcionális kártya |
| 7 | FTM rate gyűrű-feltétellel, ellenfél-profil minden romlással, második esély egy sorban | `1ac10de` | sync; szöveg |
| 8 | On/off-figyelmeztetés és „kezdő ötös vs többi perc” (`report.lineupSummary`, csak web) | `f9ad83f` | sync; nincs (a mobilban nincs lineup) |
| 9 | Saroktripla zóna-besorolás javítva (`classifyShotZone`, `x ≤ 14`) | `8f7f05a` | sync; a dobástérkép-számok változnak |

---

## 1. Kosarstat link visszaírva (adattartalom)

### Mi változott

- A `games` tábla `id = d8bfe38d-1202-4f37-848f-d9971282055e` sora (ASE, 2026-10-17,
  ellenfél: Budapesti Honvéd Sportegyesület) `kosarstat_game_id`-je `null` volt,
  most `20261017102114` (a backfill szkript írta vissza 2026-10-18-án).
- Ok: a **webes** post-game nézet a böngészőből nullázta a linket, mert a
  Kosarstat a „Endo Plus Service-Honvéd” nevet használja. A webes nézet ezt
  többé nem teszi (csak olvas), és dátum + pontos eredménypár mellett egy
  csapatnév egyezését is elfogadja.

### Hatás a mobil appra

- A mobil a linket csak olvassa (`hooks/useGameData.ts`, `hooks/useGameDetails.ts`,
  `lib/postgame-data.ts`, `hooks/useSituationalData.ts`). Ennél a meccsnél
  mostantól megjelennek a Kosarstat-adatok (negyedek, csapatmutatók,
  pontforrások). A build nem törik.

### Teendő a mobil repóban

- [ ] Ellenőrzés: az ASE–Honvéd (2026-10-17) meccs részletein a Kosarstat-blokk
      betölt. **NYITOTT: 2026-10-18-án az élő adatban az ASE sor linkje még `null`**
      (csak a Honvéd-perspektívájú soron áll `20261017102114`), lásd az
      „Átvezetés eredménye” szakaszt. Ellenőrző lekérdezés:
      `select kosarstat_game_id from games where id = 'd8bfe38d-1202-4f37-848f-d9971282055e';`
      → `20261017102114`.
- [x] Ha a mobil valahol írja a `games.kosarstat_game_id`-t (2026-10-18-án nem
      találtunk ilyet), ott se nullázzon csapatnév-eltérés miatt. Ellenőrizve:
      a mobil sehol nem ír, csak olvas.

### Kézi lépések

Nincs (a link visszaírása megtörtént).

---

## 2. Játékoscímkék (`@core`: `postgame-report`)

### Mi változott

- `report.playerImpact.overperformers` („Kiugró teljesítmény”) mostantól a
  `report.playerReport.players` Impact score-jából jön: legalább 12 perc, és
  `impactClass === 'mvp'` vagy `impactScore >= 60`, Impact szerint csökkenő
  sorrendben, legfeljebb 4 név. (Korábban külön VAL-alapú pontszám döntött.)
- `report.playerImpact.negative` („Limitált hatás (magas usage)”) csak legalább
  8 perces játékosra.
- Ellenőrző számok (ASE–Honvéd 2026-10-17): Kiugró = `CHANDLER III. John Watson`
  (17 perc, Impact 71,1); `DANIELS II Clarence Oliver` (47,1) nincs a listán;
  `NAGY Dániel` (3 perc) nincs a Limitált listán.

### Hatás a mobil appra

Csak a listák tartalma változik, a típus nem. A build nem törik.

### Teendő a mobil repóban

- [x] `npm run sync:core` (a `core/postgame-report.ts` frissül).
- [x] `npx tsc --noEmit`.

---

## 3. Védekezési verdikt (`@core`: `postgame-report`)

### Mi változott

- `report.context.defenseEfficiencyDelta` (`'Higher' | 'Lower' | 'Similar'`)
  mostantól a DRtg-ből jön: `leagueDrtg − drtg` a ±4 pontos sávon kívül →
  `Higher` / `Lower`. Ha nincs `leagueDrtg`, a négy faktor szavaz.
- `report.context.defense` új, **opcionális** mezői (mind %, egy tizedes):
  `opponentOrebRate`, `leagueOrebRate`, `opponentFtRate`, `leagueFtRate`
  (a meglévők: `opponentEfg`, `leagueEfg`, `opponentTurnoverRate`,
  `leagueTurnoverRate`, `drtg`, `leagueDrtg`).
- Az összefoglaló „Hatékonyság” sorának védekezési mondata új formájú, pl.:
  „védekezésben a liga szintjénél jobb volt (DRtg 102.7 vs liga medián …;
  elsősorban: védőlepattanózás (ellenfél OREB% 13.8% vs liga medián …); ellene
  szólt: faultfegyelem (ellenfél FTM rate 32.2% …); a liga medián körül: …)”.
- Ellenőrző számok: ASE–Honvéd → `Higher`, `opponentOrebRate` 13.8,
  `opponentFtRate` 32.2, `drtg` 102.7. ASE–Sopron (2026-10-10, DRtg 106.2) →
  `Similar` (eddig `Higher`).

### Hatás a mobil appra

Ha a mobil a `context.defense` mezőit külön kiírja, az új négy mező opcionálisan
megjeleníthető; a szöveg a `summary`-ben magától frissül. A build nem törik.

### Teendő a mobil repóban

- [x] `npm run sync:core` után: ha van védekezési kártya, opcionálisan a két új
      faktor (ellenfél OREB%, ellenfél FTM rate) a liga mediánnal. Nincs
      védekezési kártya, így nem készül (D-135); a szöveg az összefoglalóban
      frissül.

---

## 4. Gyűrű-befejezés, büntetők, faultfegyelem (`@core`: `postgame-report`)

### Mi változott

- `report.problems` / `report.nextFocus` új sorai:
  - „Gyűrű körüli befejezés gyenge (12/28, 42.9% vs szezon 60.6%, -17.7 pp)” és
    „Befejezés a gyűrűnél: Cél gyűrű FG% 42.9% → 54.9% (szezon 60.6%). …” –
    legalább 10 gyűrű-kísérletnél, legalább 10 pp elmaradásnál.
  - „Kevés büntető a magas triplaarány mellett (…) – a dobásmix következménye,
    nem kontaktkeresési gond” – az „FTM rate a liga alatt” helyett, ha a
    3PA-arány ≥ 5 pp-tel a liga medián felett van; ilyenkor nincs „Büntetők
    növelése … kontaktkeresés” fókusz.
  - „Védekezés: Faultfegyelem – az ellenfél 24 büntetőt dobott 59
    mezőnykísérletre (FTM rate 32.2% vs liga medián …)” és „Faultfegyelem: Cél
    ellenfél FTM rate 32.2% → …” – ha az ellenfél FTM rate-je ≥ 3 pp-tel a liga
    medián felett van.
- `report.shotMap.comparison` új, **opcionális** mezői: `rimMade`,
  `rimAttempts`, `rimPct`, `seasonRimPct`.
- `buildPostgameAutoFocus`: a faultfegyelem `ft`, a gyűrű-befejezés `rim` téma
  (prioritás 3); az „Ellenfél-specifikus fókusz” tipp kimarad, ha a témájára
  már van fókuszterv.
- Ellenőrző számok (ASE–Honvéd): a megjelenített fókusz első eleme
  „Faultfegyelem: Cél ellenfél FTM rate 32.2% → …”, benne van a „Befejezés a
  gyűrűnél”, „kontaktkeresés” sehol.

### Hatás a mobil appra

Szöveg- és listatartalom; a típus csak opcionális mezőkkel bővül. A build nem törik.

### Teendő a mobil repóban

- [x] `npm run sync:core` után a mobil post-game fókusz- és problémalistájának
      ellenőrzése az ASE–Honvéd meccsen.

---

## 5. Dobástérkép 3P-besorolási eltérés (`@core`: `postgame-report`)

### Mi változott

- `report.shotMap.coverage` új, **opcionális** mezői: `misclassifiedThrees`
  (legalább ennyi hármas került kétpontosként – feltehetően középtávként – a
  dobástérképre) és `misclassifiedThreesMade` (ebből értékesített, becslés).
  Számítás: `min(box 3PA − térkép 3PA, térkép 2PA − box 2PA)`, ha pozitív.
- Legalább 2-nél új `report.dataNotes` sor („Dobástérkép 3P-besorolás: …”), és a
  riport szabályai nem ítélnek a középtáv / tripla zónákból és a dobáshely-mix
  indexből (a `report.shotMap.comparison` értékei változatlanok).
- Új exportált konstans: `MISCLASSIFIED_THREES_MIN = 2`.
- Ellenőrző számok (ASE–Honvéd): `misclassifiedThrees` 2, `misclassifiedThreesMade` 2
  (térkép 3P 14/31, 2P 22/44; box 3P 18/36, 2P 20/42).

### Hatás a mobil appra

Ha a mobil dobástérkép-kártyája zóna-FG%-ot vagy dobáshely-mix indexet mutat,
`misclassifiedThrees >= MISCLASSIFIED_THREES_MIN` esetén érdemes figyelmeztetést
kiírni. A build nem törik.

### Teendő a mobil repóban

- [x] Opcionális: figyelmeztetés a dobástérkép-kártyán torz zónáknál. Nem
      készül külön elem (D-135): a „Dobástérkép 3P-besorolás” megjegyzés a
      `dataNotes`-szal a képernyő tetején megjelenik.

---

## 6. „Mi döntötte el?” bontás (`@core`: `postgame-report`)

### Mi változott

- Új exportált típus `PostgameMarginBreakdown` és **opcionális**
  `report.metrics.marginBreakdown` mező: `ownChances`, `opponentChances`
  (FGA + 0,44·FTA), `ownPointsPerChance`, `opponentPointsPerChance`, `volume`,
  `efficiency` (pont; összegük a pontkülönbség), `ownOrebRate`,
  `opponentOrebRate` (%), `ownTurnovers`, `opponentTurnovers`.
- Új exportált `describeMarginBreakdown(breakdown)` – az összefoglaló sora; a
  `report.summary` „Mérkőzés összefoglalója” szakasza magától tartalmazza.
- Ellenőrző számok (ASE–Honvéd): 87.2 vs 69.6 befejezés, 1.28 vs 1.16 pont /
  befejezés, volumen +20.6, hatékonyság +10.4.

### Hatás a mobil appra

A szöveg az összefoglalóban magától megjelenik; külön kártya opcionális. A build
nem törik.

### Teendő a mobil repóban

- [x] Opcionális: „Mi döntötte el?” kártya a `marginBreakdown` mezőkből. Nem
      készül (D-135): az összefoglaló „Mi döntötte el” sora számokkal tartalmazza.

---

## 7. Maradék anomáliák: FTM rate, ellenfél profil, duplikáció (`@core`: `postgame-report`)

### Mi változott

- A 4. pont „Kevés büntető a magas triplaarány mellett …” sora **megszűnt**: magas
  (liga medián + 5 pp feletti) 3PA-aránynál az alacsony saját FTM rate csak
  akkor kerül a problémák közé („FTM rate a liga alatt …”), ha a gyűrű-zóna
  aránya is ≥ 5 pp-tel a szezon felett van; különben nincs sor és fókusz.
- Ellenfél profil: bármilyen (0,1 pp-től) romlás a „kisebb elmaradás” listába
  kerül; a „minden fő saját támadómutatónk a szezonátlag szintjén vagy felette
  volt” csak akkor jelenik meg, ha egyik sem romlott.
- A Kosarstat-összefűzés (`mergeKosarstatPostgameContext`) után a „Második
  esély: ORB% különbség …” és a „Támadólepattanózás erős …” erősség a
  „Pontforrás-fölény: … második esélyből …” sorba olvad („…; a második esély
  forrása: …”), ha a második esély pontforrás-fölény.
- Ellenőrző számok (ASE–Honvéd): a problémák között nincs FTM-sor; az
  erősségek között egyetlen második esély sor.

### Hatás a mobil appra

Szövegváltozás; a típus nem változik. A build nem törik.

### Teendő a mobil repóban

- [x] `npm run sync:core` után a problémák / erősségek listájának ellenőrzése.

---

## 8. Lineup az összefoglalóban (`@core`: `postgame-report` – csak típus)

### Mi változott

- Új, **opcionális** `report.lineupSummary?: { starterSplit: string | null; onOffWarnings: string[] }`
  és új exportok: `PostgameOnOffInput`, `ON_OFF_CONFLICT_MIN_SECONDS` (600),
  `ON_OFF_CONFLICT_MIN_GAP` (25). A `mergeKosarstatPostgameContext` két új
  opcionális opciót kap: `starterSplit`, `onOff`.
- Csak a webes összefűzés tölti ki (a Kosarstat lineupból); a
  `composePostgameSummary` a kezdő-sort a meccs-szakaszba, az on/off
  figyelmeztetést a Játékos kiemelések közé teszi.

### Hatás a mobil appra

A mobil nem ad át lineupot, ezért a mező üres, a szöveg nem változik. A build
nem törik (minden új mező és opció opcionális).

### Teendő a mobil repóban

- [x] Csak `npm run sync:core`; mobil kódváltozás nem kell.

---

## 9. Saroktripla zóna-besorolás (`@core`: `postgame-report`)

### Mi változott

- A `postgame-report` zóna-besorolója fordított volt: saroktriplának az
  `x ≥ 25`-ös (szárny) dobásokat vette, a valódi, alapvonal-közeli
  saroktriplákat „nem sarok” triplának. Mostantól: sarok = `x ≤ 14` és
  (`y ≤ 14` vagy `y ≥ 86`), normalizált koordinátán (vendégnél `100 − x`).
- Új export: `classifyShotZone({ x, y, shotSide })` – ha a mobil saját
  zóna-besorolást használ, ezt kell hívnia (vagy ugyanezt a szabályt).
- Változik: `report.shotMap.team/season.zones.corner3` és `aboveBreak3`,
  `corner3Rate`, `corner3Pct`, `shotQualityIndex` (a sarok súlya 1,2, a
  többi triplaé 0,65), a `comparison.corner3RateDelta` / `shotQualityDelta`, és a
  játékosonkénti `corner3Attempts` / `corner3Made`.
- Ellenőrző számok (ASE, 2026/27): az ASE–Honvéd meccsen (2026-10-17) sarok
  4/9 (eddig 0/0), a szezonban 11/27 (eddig 3/8).

### Hatás a mobil appra

A „Sarok hármas” sorok és a dobáshely-mix index értéke változik. A build nem
törik (a típus változatlan).

### Teendő a mobil repóban

- [x] `npm run sync:core`, majd az ASE–Honvéd meccsen a „Sarok hármas” arány
      ellenőrzése (9 / 75 = 12,0%).
- [x] Ha a mobil a dobásokat saját kóddal sorolja zónába, cserélje
      `classifyShotZone`-ra. Nincs saját besorolás: a `lib/postgame-data` a nyers
      `x`, `y`, `shotSide` mezőket adja a `@core`-nak.

---

## Lezárás

- [x] `npm run sync:core` (egyszer, mind a hat pontra), `npx tsc --noEmit`.
- [ ] Eszközös próba az ASE–Honvéd (2026-10-17) meccsen: Kosarstat-blokk,
      Kiugró = Chandler, védekezési mondat, faultfegyelem- és gyűrű-fókusz,
      3P-besorolási megjegyzés, „Mi döntötte el” sor.
- [x] Átvezetés után: `Állapot` → `ÁTVEZETVE (YYYY-MM-DD, mobil commit <hash>)`.

## Átvezetés eredménye (2026-10-18)

- **Kód:** `69f63cb` (`@core` szinkron, csak a `core/postgame-report.ts`
  változott). Mobil kódváltozás nem kellett: a `tsc` és a lint hibátlan, a
  nézetmodell az új opcionális mezők nélkül is jól működik, a szöveg a
  riportobjektumból magától frissül.
- **Döntés:** az opcionális megjelenítések (védekezés-értékpárok, 3P-besorolási
  figyelmeztetés, „Mi döntötte el?” kártya) nem készülnek külön elemként
  (D-135).
- **Ellenőrzés (harness, élő adat, csak olvasás), ASE–Honvéd 2026-10-17:**
  Kiugró = `CHANDLER III. John Watson`, a Limitált lista üres; DRtg 102.7,
  ellenfél OREB% 13.8, ellenfél FTM rate 32.2, verdikt `Higher`;
  `misclassifiedThrees` 2 (térkép 3P 14/31, 2P 22/44; box 18/36, 20/42) és a
  „Dobástérkép 3P-besorolás” megjegyzés a képernyő tetején; gyűrű 12/28
  (42.9% vs 60.6%); befejezés 87.2 vs 69.6, 1.28 vs 1.16, volumen +20.6,
  hatékonyság +10.4; sarok 4/9 (12.0%), szezon 11/27; a megjelenített
  fókusz első eleme „Faultfegyelem: Cél ellenfél FTM rate 32.2% → 27.9%”, a
  megjelenített listában nincs „kontaktkeresés”.
- **Kosarstat-link (1. pont) – nyitott adatprobléma:** az élő adatban a
  `games` `d8bfe38d-1202-4f37-848f-d9971282055e` sorának `kosarstat_game_id`-je
  2026-10-18-án még `null`, ezért a mobil nem mutat negyedeket, csapatmutatókat,
  pontforrásokat. Csak a Honvéd-perspektívájú soron
  (`8e0475de-1a9f-4b94-bf7f-e23a92977093`) áll `20261017102114`. A backfill
  tehát nem érvényesült ebben az adatbázisban, vagy a webes nézet újra
  nullázta. A mobil nem ír: a visszaírás a webes oldal dolga. A link
  memóriában beállított felülírásával a Kosarstat-blokk hibátlanul betölt:
  11 soros box score, pontforrások (második esélyből 17–2), egyetlen „második
  esély” sor az erősségek között.
- **Eltérések a jegyzet ellenőrző számaitól (mobil hiba nincs):**
  - Az ASE–Honvéd problémái között a mobil adatán ott az „FTM rate a liga
    alatt” sor. A szabály 5 pp-es küszöbön múlik: a meccs 3PA-aránya 46.2%, a
    mobil adatából számolt liga medián 41.5%, a különbség 4.7 pp. A web
    adatállapotában a medián 41.2% alatt lehet. A megjelenített fókuszban
    emiatt a „Faultfegyelem” mellett a „Befejezés a gyűrűnél” terv a
    `buildNextFocus` 2 elemes vágása miatt nem látszik, helyette a „Mérkőzés
    utáni javítás: Gyűrű körüli befejezés gyenge …” sor áll.
  - ASE–Sopron (2026-10-10): a védekezési verdikt `Higher`, nem `Similar`:
    a mobil adatán a liga DRtg medián 111.0, ezzel 111.0 − 106.2 = 4.8 > 4. A
    jegyzet `Similar` értékéhez a mediánnak legfeljebb 110.2-nek kellene
    lennie. A H17-es jegyzetnél is volt hasonló eltérés a liga mediánokban
    (munkanapló: 2026-10-11).
  Mindkét esetben azonos `@core` fut, a különbség a bemeneti adat állapotából
  jön; a webes és a mobil liga medián összevetése nyitott.
- **Nyitva:** eszközös próba (iOS + Android), a `docs/feature-tasks.md`
  „Web → mobil szinkron” szakaszában külön sorként.
