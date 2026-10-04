# Mobil teendők – 2026-10-04 összesítő (web H14 + korábbról nyitott jegyzetek)

- **Dátum:** 2026-10-04
- **Típus:** @core | funkcionális | adattartalom | scraping
- **Állapot a mobilban:** ÁTVEZETVE (2026-10-04, mobil commit `e3e8c62` + `5af81c6`, @core szinkron `6610ffb`; eszközös próba nyitva)

A webprojekt (`../asestats`) `mobile-sync/` mappájának **mind a 9 `NYITOTT`
jegyzete** egy helyen, végrehajtási sorrendben. (2026-10-04-től az új
web → mobil jegyzetek közvetlenül ebbe a mappába, a `docs/mobile-sync/`-ba
kerülnek; a webes mappa lezárt archívum.) Ez a fájl önállóan
feldolgozható: minden teendő, lekérdezés és ellenőrző szám benne van, a
forrásjegyzeteket csak a lezárásnál (állapot átírása) kell megnyitni.

A mostani mobil build (`16b9e54`) **egyik változástól sem törik** – minden új
mező opcionális, a többi adattartalom vagy szöveg.

## Érintett jegyzetek

| # | Forrásjegyzet (`asestats/mobile-sync/`) | Típus | Web commit | Mobil kódváltozás |
|---|------------------------------------------|-------|------------|-------------------|
| 1 | `2026-10-04-postgame-point-sources.md` | @core, funkcionális | `2100a91` | igen (sync lista + bemenet + nézet) |
| 2 | `2026-10-04-postgame-ft-label-opponent-profile.md` | @core, funkcionális | `856780f` | kicsi (sync + ellenőrzés, opcionális nézet) |
| 3 | `2026-10-04-team-game-phase-opponent-fields.md` | @core, funkcionális | `58c12e9` | döntéstől függ |
| 4 | `2026-10-04-game-phase-classification-rule.md` | funkcionális | `702d694` | döntéstől függ |
| 5 | `2026-10-04-season-2025-26-stray-games-cleanup.md` | adattartalom | `bc0a737`, `afa0b46` | nem, csak ellenőrzés |
| 6 | `2026-09-27-hunbasket-player-name-casing.md` | adattartalom, scraping | `b3df452` | nem, csak ellenőrzés |
| 7 | `2026-09-27-ase-primary-team.md` | adattartalom | `cfbf698` | nem, csak ellenőrzés |
| 8 | `2026-09-26-shotchart-dedup-fix.md` | adattartalom | `2b8aad0` | nem, csak ellenőrzés |
| 9 | `2026-09-26-kosarstat-cmp-link-fix.md` | adattartalom, scraping | `941925b` | nem, csak ellenőrzés |

Kézi lépés (SQL, újraimport) **egyikhez sem kell** – a webes oldalon mind
lefutott.

---

## 1. `@core` frissítés (jegyzet 1, 2, 3)

- [x] `scripts/sync-core.ts` `MODULES` listájába felvenni: `'kosarstat-pbp-parse'`
      (új, tiszta modul; egyetlen importja típus a `./postgame-report`-ból,
      tehát a `FORBIDDEN_IMPORT` ellenőrzésen átmegy).
- [x] `npm run sync:core`. Várt változás a `core/`-ban (a mostani másolathoz
      képest, 2026-10-04-én ellenőrizve):
  - `postgame-report.ts` – ~140 sor: új típusok (`PostgameBoxScoreLine`,
    `PostgamePointSourceLine`, `PostgamePointSources`,
    `KosarstatPointSourceTotals`), új opcionális `metrics.boxScore` és
    `metrics.pointSources`, új büntető-címke, új „Ellenfél profil” sorok;
  - `dashboard-types.ts` – a webes `TeamGame` 3 új opcionális mezője
    (`opponentTeamId`, `round`, `competitionPhase`);
  - `player-postgame.ts` – 1 sor;
  - `kosarstat-pbp-parse.ts` – új fájl.

  A `postgame-report.ts` két regexében (`interpretNextFocus`,
  `interpretExecutiveSummary`) eddig nyers NUL bájt állt, ezért a `grep` és a
  `diff` binárisnak látta a fájlt – a mobil `core/` másolatát is. A weben ez
  `\0` escape-re cserélve (viselkedés azonos); a szinkron után a mobil másolat
  is szöveges fájl lesz.
- [x] `tsc` a mobil repóban. Törést nem várunk: a mobil a `TeamGame`-et a saját
      `types/games.ts`-ből veszi (nem a `@core/dashboard-types`-ból), a
      `PostGameReport` új mezői opcionálisak.
- [x] Külön `core:` commit (D-088 szerint).

## 2. Post-game: pontforrások (jegyzet 1)

`pointSources` átadása nélkül a mobil riportban nincs pontforrás, a webes
Post-game nézetben van – ebben a két felület most eltér.

**Bemenet – `lib/postgame-data.ts`** (a `buildKosarstatPostgameContext` hívása,
jelenleg a 153. sor környékén):

- [x] A meccs `game_events` oldalának betöltése – ugyanaz a minta, mint a
      `hooks/useGameDetails.ts` `fetchClutch`-ban, csak más `page_type`:
  ```ts
  // 1) a nyers oldal azonosítója
  supabase
    .from('kosarstat_game_pages_raw')
    .select('id')
    .eq('season_id', seasonId)
    .eq('kosarstat_game_id', game.kosarstatGameId)
    .eq('page_type', 'game_events')
    .order('imported_at', { ascending: false })
    .limit(1);

  // 2) a táblái
  supabase
    .from('kosarstat_game_page_tables')
    .select('rows, headers')
    .eq('page_raw_id', eventsRawId)
    .order('table_index', { ascending: true });
  ```
- [x] Az eseménytábla az, amelyiknek a `headers`-e tartalmazza a `home_event`
      oszlopot. Erre: `parseKosarstatPointSources(headers, rows)` a
      `@core/kosarstat-pbp-parse`-ból (`null`, ha a tábla nem eseménylista).
      A válasz típusozatlan – a `headers` / `rows` tömb voltát a
      rendszerhatáron validálni kell.
- [x] Az eredmény átadása: `buildKosarstatPostgameContext({ …, pointSources })`.
      A `@core` oldalra (saját / ellenfél) rendezi, és csak akkor írja a
      riportba, ha az eseményekből összeadott pontszám **mindkét oldalon**
      egyezik a `metrics.pointsFor` / `pointsAgainst` értékkel; eltérésnél
      megjegyzés kerül a `dataNotes`-ba (ez a nézetben már megjelenik: `notes`).

**Nézet – `lib/postgame-view.ts` + a post-game képernyő:**

- [x] `report.metrics.pointSources` megjelenítése, saját – ellenfél párban
      (a meglévő `SplitMetricRow` illik rá):
  - `secondChancePoints` – második esélyből szerzett pont (támadólepattanó
    utáni pont ugyanabban a birtoklásban);
  - `pointsOffTurnovers` – labdaeladásból szerzett pont (az ellenfél
    eladását követő birtoklásban);
  - `quickFinishPoints` – gyors befejezés: labdaszerzés vagy védőlepattanó
    után ≤ `quickFinishSeconds` (6) mp. **Nem jegyzőkönyvi fast break** – a
    felirat ne „gyorsindítás / fast break” legyen.
- [x] „Számított, nem hivatalos adat” jelölés a blokkon.
- [x] Üres állapot: `pointSources` hiányzik vagy `null` (nincs Kosarstat-link,
      nincs eseményoldal, vagy nem egyezett a pontszám) → a blokk elmarad.

## 3. Post-game: büntető-címke, ellenfélprofil, box score (jegyzet 2)

A szinkron után a szövegek maguktól frissülnek; itt főleg ellenőrizni kell.

- Döntő tényező címke: `Több / Kevesebb büntetőpont az ellenfélnél (FTM rate …)`
  helyett `Büntető-előny / Büntető-hátrány az ellenféllel szemben (FTM rate …)`.
  A `tone` / `topic` / `type` változatlan, a mobil a `tone` alapján színez –
  teendő nincs.
- [x] Az összefoglaló (`report.summary`) „Ellenfél profil” blokkja a korábbi
      1 sor helyett **3 sor**; ellenőrizni, hogy a nézet jól tördeli:
  - `• <ellenfél> mért mutatói: eFG …, 3P x/y (…%), FTM rate …, OREB% …, TO rate ….`
  - `• Saját támadómutatók a <referencia> alatt <ellenfél> ellen: FTM rate …; Assist% ….`
  - `• Értelmezés: …`
  - leíró nélküli ág: `<ellenfél> ellen egyik fő saját támadómutatónk sem
    esett érdemben a <referencia> alá.`

  A régi `védekezési realizáció: kontakt-limitálás (…); passzútvonal-zavarás (…)`
  sor megszűnt. A mobil kódban erre nincs szöveges illesztés (2026-10-04-i
  keresés: nincs találat), a `postgame-view.ts` a `summary`-t egyben adja át
  (`plainText(report.summary)`).
- [x] Opcionális: `report.metrics.boxScore` megjelenítése –
      `{ own: PostgameBoxScoreLine; opponent: PostgameBoxScoreLine | null }`,
      mezők: `fgm, fga, fgPct, ftm, fta, ftPct, oreb, dreb, reb`. A weben ez a
      „Box score alapmutatók” tábla (FG%, FT%, lepattanó).
- A már mentett AI riportszövegek nem változnak; a számított nézet a szinkron
  után azonnal az új szöveget adja.

## 4. Meccslista: ellenfél neve és versenyszakasz (jegyzet 3 + 4)

**Mi van már meg a mobilban** (2026-10-04-i állapot): a `types/games.ts`
`TeamGame` tartalmazza a `round`, `opponentTeamId`, `kosarstatGameId` mezőt, a
`hooks/useGameData.ts` ki is tölti őket. A jegyzet három mezőjéből csak a
`competitionPhase` hiányzik. A `lib/teams.ts` `findOpponentTeam` létezik, és a
`usePlayerDetails` / `useAnalysisReports` / `useScoutingData` már használja.

**Két döntés kell, a kód ezek után jön:**

- [x] **Döntés A – ellenfél neve → IGEN (D-127):** a meccslista és a meccskártyák
      (`GameRow`, `LastGameCard`, `GameScoreCard`, `PlayerGameLog`) ma a
      `games.opponent` szabad szöveget írják ki, ezért ugyanaz a csapat két
      néven jelenhet meg („Szolnoki Olajbányász” és „NHSZ-Szolnoki
      Olajbányász”). A web exportja már `opponentTeamId` → `teams.name`
      alapján old fel. Kérdés: a mobil is erre álljon-e át (a szöveg csak
      ID nélküli sorra maradna tartalék, D-119 mintájára).
- [x] **Döntés B – versenyszakasz-jelölés → MOST NEM (D-128):** kell-e alapszakasz / rájátszás
      megkülönböztetés a mobil meccslistában. A `round` önmagában nem elég
      (a „3. helyért” sorozat `round = 3`).

**Ha B = igen, a webes szabályt kell követni** (B = nem, ezért az alábbi három
sor nem készült el – D-128):

- [ ] `TeamGame.competitionPhase: string | null` (Kosarstat címke, pl.
      `Alapszakasz`, `Negyeddöntő - 1. mérkőzés`, `Harmadik helyért - 3. mérkőzés`).
      Forrás:
  ```ts
  supabase
    .from('kosarstat_game_pages_raw')
    .select('kosarstat_game_id, competition_phase')
    .eq('season_id', seasonId)
    .eq('page_type', 'game')
    .in('kosarstat_game_id', kosarstatIds);
  ```
- [ ] **Tükörmeccs:** a `games.kosarstat_game_id` sokszor csak a meccs egyik
      nézetén van meg. A címke forrása a saját link, annak hiányában az
      ellenfél-nézetű `games` sor linkje (azonos `date`, a sor `our_team_id`-je
      = a mi `opponent_team_id`-nk). Ehhez az ellenfél-nézetű sorokat is le
      kell kérni (`season_id` + `opponent_team_id = teamId`, mezők: `date,
      our_team_id, kosarstat_game_id`).
- [ ] **Besorolás** – a web `lib/team-season-export.ts` `classifyPhase`
      3 lépése:
  1. van címke → „alapszakasz” = alapszakasz; „döntő / helyért / rájátszás”
     = rájátszás; egyéb = egyéb;
  2. nincs címke, nincs forduló → „Kupa / nem azonosított”;
  3. nincs címke, van forduló → alapszakasz, **kivéve** ha a meccs dátuma az
     utolsó címkézett alapszakasz-meccs utáni ÉS a forduló nem nagyobb az
     addigi legnagyobb alapszakasz-fordulónál → rájátszás. (A helyosztók
     „5. helyért” szövegéből a scraper `round = 5`-öt ír; a még nem linkelt,
     soron következő forduló száma nagyobb, így az alapszakasz marad.)

  E szabály nélkül a link nélküli helyosztók alapszakasznak látszanak
  (2025/2026-ban ligaszinten 8 ilyen meccs volt).
- [x] **Döntés C → NEM AKTUÁLIS (B = nem, D-128):** a `classifyPhase` átkerüljön-e egy `@core` modulba. Ma a
      webes, nem `@core` `lib/team-season-export.ts`-ben él; ha a mobil is
      használja, a duplikálás helyett érdemes a weben kiszervezni, és a
      `sync-core` listára venni.

Ha A és B is „nem”: kódváltozás nincs, a két jegyzet döntéssel zárható.

## 5. Adat-ellenőrzés – kódváltozás nélkül (jegyzet 5–9)

A mobil a közös adatbázist olvassa, a javítások már érvényben vannak. A
gyorsítótár miatt ellenőrzés előtt pull-to-refresh / újraindítás kell.

**5.1 – 2025/2026 szezon takarítása (jegyzet 5).** A szezonból törölve 276
tévesen odakerült 2024/25-ös `games` sor és 2737 `player_game_stats_2025_2026`
sor (7194 → 4456). Eddig a mobil 2025/2026-os nézetei is kevert adatot
mutattak (csapatonként ~20 meccsel több, torz átlagok és liga-benchmarkok).

- [x] 2025/2026, ASE: **39 meccs**, a legkorábbi dátum **2025-09-27**.
- [x] Játékos-összesítő (`player_season_stats_by_season`): Halmai **37 meccs**
      (korábban 56).
- [x] Ha van perzisztált szezonadat-gyorsítótár, a 2025/2026-os ürítése.
- Webes oldalon nyitott (mobil teendő nincs): 138 `hunbasket_shotchart_raw`
  sor (`season_slug = x2425`) még a 2025/2026 szezon alatt áll.

**5.2 – Játékosnevek ékezetes nagybetűi (jegyzet 6).** 124 `players.name` sor
javítva (2025/26: 69, 2026/27: 55): „RéVéSZ Ádám” → „RÉVÉSZ Ádám”. A
`player_id` nem változott.

- [x] A 2025/26 és 2026/27 játékosnevek helyesen jelennek meg.
- [x] Nincs a mobilban a hibás alakra („RéVéSZ”) épülő kerülőmegoldás.
- Ismert, nem új: a 2024/25-ös „Révész Ádám” és a 25/26+ „RÉVÉSZ Ádám” alak
  eltér – kis-/nagybetű-érzékeny névpárosításnál számít. A korábban mentett
  AI riportszövegekben a régi alak maradhat.

**5.3 – ASE alapcsapat (jegyzet 7).** `teams.is_primary = true` az
`Atomerőmű SE` soron (`ff4710a9-e2b2-49fc-904f-37f8356ed5f8`); előtte egyetlen
sor sem volt `true`.

- [x] A csapatszűrő alapértéke az ASE. A `hooks/useFilterData.ts`
      `defaultTeam` már az `isPrimary`-t nézi először; az `OWN_TEAM_NAMES`
      névegyezés (D-013) eddig ténylegesen ez dolgozott, mostantól csak
      tartalék. Eldönteni: marad védelemként, vagy kivezethető. → Marad (D-129).

**5.4 – Dobástérkép deduplikálás (jegyzet 8).** A 2026-09-26-i ASE–Pécs
(`hun_134749`) meccsnek 0 helyett **125 eseménye** van (ASE: **73 dobás**). A
2026/27-es `hunbasket_shot_events` sorok új `id`-t kaptak.

- [x] A mobil nem a `hunbasket_shotchart_raw.event_count`-ból számol
      dobásszámot (az duplikátumokkal együtt 309). 2026-10-04-i keresés a
      mobil kódban: nincs `event_count` hivatkozás – megerősítés után pipálható.
- [x] Az ASE–Pécs post-game nézetben megjelenik a dobástérkép-kontextus
      (`report.shotMap.available = true`, 73 kísérlet).

**5.5 – Kosarstat link javítás (jegyzet 9).** A 2026-09-25-i 3 meccs
(Alba–Körmend, Sopron–DEAC, Szolnok–OSE; mindkét nézet, 6 `games` sor) kapott
`kosarstat_game_id`-t; a negyed- és csapatmetrika-sorok `team_side` értéke
`unknown` → `home` / `away`.

- [x] E meccsek részletező nézetében megjelenik a Kosarstat-blokk (negyedek,
      clutch, csapatmetrikák), mindkét csapat szemszögéből.

## 6. Lezárás

- [ ] Eszközös próba (iOS + Android): post-game nézet egy Kosarstat-linkelt
      2026/27-es meccsen (pontforrások, új ellenfélprofil-sorok), és a
      2025/2026-os meccslista.
- [x] `docs/feature-tasks.md`: sorok a „Web → mobil szinkron” szakaszba +
      munkanapló-bejegyzés + az A/B/C döntések a döntésnaplóba.
- [x] A webprojektben a 9 forrásjegyzet `Állapot` sora:
      `ÁTVEZETVE (YYYY-MM-DD, mobil commit <hash>)`.
- [x] A webprojekt `CLAUDE.md` `@core` modullistájába felvenni:
      `kosarstat-pbp-parse` (a `player-movements` 2026-10-04-én már felkerült).
- [x] Ennek a fájlnak az `Állapot` sora: `ÁTVEZETVE (YYYY-MM-DD, mobil commit <hash>)`.

## Nem része ennek a listának

A korábban `ÁTVEZETVE` állapotú jegyzetek maradék pontjai már a
`docs/feature-tasks.md` „Web → mobil szinkron” szakaszában élnek (H12 eszközös
próba, `findOpponentTeam` névtartalék a `fetchOpponentLines`-ban, webes
Post-game összevetés) – ide nem másoltam át őket.

## Átvezetés eredménye (2026-10-04)

- **Kód:** `6610ffb` (`@core` szinkron), `e3e8c62` (pontforrások + box score
  alapmutatók a post-game nézetben), `5af81c6` (ellenfélnév a csapatlistából).
- **Döntések:** A = igen (D-127), B = most nem, C = nem aktuális (D-128); az
  `OWN_TEAM_NAMES` tartalék marad (D-129); a megjelenítés módja D-126.
- **Ellenőrzés:** az 5. pont minden sora élő adaton, harnesszel igazolva – a
  számok a `docs/feature-tasks.md` 2026-10-04-i munkanapló-bejegyzéseiben.
- **Nyitva:** eszközös próba (iOS + Android), a `docs/feature-tasks.md`
  „Web → mobil szinkron” szakaszában külön sorként.
