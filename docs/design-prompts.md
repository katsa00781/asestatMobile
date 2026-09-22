# Vizuális design promptok – ASEStats Mobile

_Átemelve a webprojekt `context/mobile/mobile-design-prompts.md` fájljából, 2026-09-22._

Ez a fájl **csak az új, még le nem futtatott promptokat** tartalmazza. A P0–P14
promptok már megtették a dolgukat: kimenetük a `docs/mockups/` öt elfogadott
HTML makettje, és a képernyők implementálva vannak – azokat nem másoljuk ide.

Célszerszám: **v0 / Figma Make / Lovable / Claude Artifact**. A prompt iPhone-keretes
vizuális makettet kér, **nem futtatható React Native kódot** – a kimenet a
`docs/mockups/` alá kerül, és onnan implementáljuk a `docs/prompt-templates.md`
„UI képernyő építése" sablonjával.

> **A tokenek forrása a kódban a `constants/theme.ts`**, nem az alábbi DS-BLOKK.
> A blokk azért tartalmazza a nyers hex értékeket, hogy a prompt a projekt
> kontextusán kívül, külön chat-ablakban is futtatható legyen. Ha a kettő
> valaha eltér, a `constants/theme.ts` az erősebb.

---

## Használat

A prompt-testben a `[[DS-BLOKK]]` jelölés áll. **Futtatáskor másold a helyére a
lenti DS-BLOKK teljes szövegét**, így a prompt önállóan futtatható.

---

## DS-BLOKK

````
=== ASE STATS – DARK COMMAND CENTER DESIGN RENDSZER ===

Ez egy magyar kosárlabda-statisztikai alkalmazás (ASE – Atomerőmű SE) iOS verziója.
Karaktere: sportos telemetria, "command center" – sötét, sűrű, precíz, adatvezérelt.
NEM lekerekített, barátságos consumer app. Műszerfal-érzet, nem játék-érzet.

SZÍNEK (pontosan ezeket használd, más színt ne vezess be):
  Háttér alap        #050B14
  Kártya felület     #0A1628
  Nyomott / sheet    #0F1F3D
  Beágyazott / aktív #162440

  Cián (primary)     #00D4FF     Cián halvány  #0096B8
  Narancs (CTA)      #FF6B35     Narancs halv. #B84A22
  Lila (AI tartalom) #7C3AED     Lila halvány  #5B21B6

  Szöveg fő          #E8F4FF
  Szöveg másodlagos  #7A9ABB
  Szöveg halvány     #4A6D95

  Pozitív / nyert    #10D98A
  Negatív / vesztett #FF4757
  Figyelmeztetés     #FFB627

  Vonal finom        #0F2040
  Vonal aktív        #1E3A5F
  Vonal erős         #2A4A75

TIPOGRÁFIA (három család, szigorú szereposztás – ne keverd őket):
  Barlow Condensed – címek, címkék, badge-ek, gombfeliratok.
                     Címkéknél ALL CAPS + 0.12em betűköz.
  DM Sans          – folyó szöveg, leírások.
  JetBrains Mono   – MINDEN szám, kivétel nélkül, tabular-nums igazítással.

MÉRETEK (pt, iPhone 15 – 390×844):
  Címek:  34 hero / 28 képernyőcím / 22 szekció / 17 kártyacím  (Barlow Condensed 600)
  Számok: 40 hero / 28 fő stat / 20 kiemelt / 15 cella          (JetBrains Mono)
  Szöveg: 15 body / 13 caption                                   (DM Sans)
  Címke:  11 ALL CAPS 0.12em betűköz                             (Barlow Condensed 600)

TÉRKÖZ: 4pt rács – 4 / 8 / 12 / 16 / 20 / 24 / 32
  Képernyő oldalmargó 16 · kártyák közti rés 12 · kártya belső padding 16 · szekciórés 24

SARKOK: badge 2 · input 4 · gomb 6 · listasor 10 · fő kártya 14
  FONTOS: szűk sarkok, NEM iOS-esen kerek. Ez adja a telemetria-karaktert.

GLOW – nem árnyékkal, hanem rétegzéssel:
  háttér = accent szín 14% opacitás
  keret  = accent szín 30% opacitás, 1pt
  szöveg = accent szín 100%
  (AI variáns erősebb: 16% háttér / 40% keret / #C4B5FD szöveg)

JELLEGZETES ELEMEK – ezek adják a rendszer arcát, ne hagyd el őket:
  • BAL OLDALI ACCENT SÍN: 3pt függőleges csík a kártyák bal szélén, accent színben.
    Ez a legfelismerhetőbb jel az egész rendszerben.
  • PONT-RÁCS HÁTTÉR: nagyon halvány cián pontok 24pt rácsban a #050B14 alapon
    (kb. rgba(0,212,255,0.045)). Alig látható, de érezhető textúra.
  • Minden szám monospace és tabuláris – az oszlopok tökéletesen igazodnak.
  • Címkék mindig ALL CAPS, tág betűközzel, halvány színben.

BADGE VARIÁNSOK: cián · narancs · AI(lila) · pozitív · negatív · figyelmeztetés · semleges
  Barlow Condensed 600, ALL CAPS, 11pt, 0.12em betűköz, 2pt sarok, 3×8pt padding.

iOS KONVENCIÓK:
  • Safe area tisztelve: felül 44pt nav bar + inset, alul 49pt tab bar + home indicator
  • Minden érintési célpont legalább 44×44pt
  • Nincs hover – nyomott állapot: #0A1628 → #0F1F3D + a bal accent sín felerősödik
  • Státuszsáv világos tartalommal (sötét téma)

NYELV: minden felirat MAGYAR.
=== DS-BLOKK VÉGE ===
````

---

# P15 · Igazolások

> Hozzáadva 2026-09-22-én, a webes Igazolások feature után. Elhelyezés: a
> **Tabella tab második szegmense** – mindkét nézet liga-szintű, több csapatot
> átfogó, és ez az egyetlen egy-mélységű tab, ahol van hely. A tab bar címkéje
> marad „Tabella"; a képernyő nagy címe az aktív szegmenst követi.

```
[[DS-BLOKK]]

KÉPERNYŐ: Igazolások – a Tabella tab második szegmense. Egy szezonváltás
keretmozgásai: ki érkezett a csapathoz és ki távozott. Ez NEM statisztika,
hanem tény-lista – nincs benne egyetlen átlag vagy százalék sem.

FELÉPÍTÉS:

1. NAV BAR: bal "ASE", közép szűrő-pill "2026/2027 · ASE ▾", jobb fogaskerék
2. NAGY CÍM: "IGAZOLÁSOK" Barlow Condensed 600, 28pt
   Mellette jobbra halványan "13 mozgás" JetBrains Mono 15pt

3. SZEGMENTÁLT KONTROLL (teljes szélesség, 36pt, #0A1628 alap, 6pt sarok)
   Két szegmens: "TABELLA" · "IGAZOLÁSOK"
   Az "IGAZOLÁSOK" AKTÍV: #162440 háttér, cián szöveg, alul 2pt cián csík.

4. IRÁNY-SÁV (28pt magas kontextussor, NEM kártya, nincs kerete)
   Balra JetBrains Mono 13pt: "2025/2026 → 2026/2027", a nyíl cián színnel.
   Jobbra 11pt ALL CAPS halványan: "ATOMERŐMŰ SE"
   Alatta finom vízszintes vonal (#0F2040) a teljes szélességben.

5. StatTile RÁCS – 2 oszlop, 12pt rés, kártyánként min. 96pt magas,
   #0A1628 alap, 14pt sarok, bal 3pt accent sín, érték JetBrains Mono 600 28pt,
   címke 11pt ALL CAPS 0.12em halványan. Öt csempe, az ötödik az alsó sorban
   teljes szélességű:

     ÉRKEZŐK             4     CIÁN sín
     TÁVOZÓK             9     NARANCS sín
     HAZAI VÁLTÁSBÓL     1     ZÖLD sín
     VISSZATÉRŐ          1     LILA sín
     ISMERETLEN CÉLBA    5     NARANCS sín   (teljes szélesség)

6. SZEKCIÓFEJLÉC – "ÉRKEZŐK"
   Balra 18pt befelé-lefelé mutató nyíl ikon CIÁN színnel, mellette
   "ÉRKEZŐK" Barlow Condensed 600, 22pt, utána mono 15pt halványan "(4)".

7. ÉRKEZŐ SOROK – StackedRow minta, négy sor.
   Soronként min. 72pt magas, #0A1628 alap, 10pt sarok, 8pt függőleges rés,
   bal 3pt CIÁN sín. Felépítés:
   – Bal felül a név DM Sans 600, 15pt, #E8F4FF; közvetlenül utána 12pt
     vonalas "külső link" ikon halvány ciánnal (a forrásprofilra mutat)
   – Alatta a poszt 13pt halványan (a forrás rövidítése, ne fordítsd le)
   – Jobb felül a besorolás-badge, alatta jobbra igazítva 13pt halványan
     a származás

   Adatok (név · poszt · badge · származás):
     Jay Jay CHANDLER   SG   VISSZATÉRÉS      1 szezon kihagyás
     Yasiin JOSEPH      G    HAZAI VÁLTÁS     Alba Fehérvár
     Clarence DANIELS   SF   ISMERETLEN       Nincs adat
     Kalif YOUNG        C    ISMERETLEN       Nincs adat

   Badge színek: HAZAI VÁLTÁS = pozitív (zöld) · VISSZATÉRÉS = AI (lila)
   · ISMERETLEN = semleges (szürke keret, halvány szöveg).

8. SZEKCIÓFEJLÉC – "TÁVOZÓK"
   Ugyanaz, de a nyíl kifelé-felfelé mutat és NARANCS, a szám "(9)".

9. TÁVOZÓ SOROK – ugyanaz a StackedRow, de bal 3pt NARANCS sínnel.
   A jobb alsó sor itt a célállomás.

   Adatok:
     ARNOLD Botond      C    HAZAI VÁLTÁS     MVM-OSE Lions
     COHILL Eric        SF   HAZAI VÁLTÁS     Egis Körmend
     Shereef MITCHELL   G    HAZAI VÁLTÁS     PHOENIX Fóti Tigrisek
     Jamari SMITH       PF   HAZAI VÁLTÁS     Budapesti Honvéd SE
     Trevon BLUIETT     SF   ISMERETLEN       Nincs adat
     Zena EDOSOMWAN     C    ISMERETLEN       Nincs adat
     Deon EDWIN         G    ISMERETLEN       Nincs adat
     Elijah HAWKINS     PG   ISMERETLEN       Nincs adat
     Tony HICKS         PG   ISMERETLEN       Nincs adat

   A "Trevon BLUIETT" sor legyen NYOMOTT állapotban: #0F1F3D háttér
   és felerősödött bal sín.

10. ÉRTELMEZÉSI SÁV – a lista legalján, 24pt réssel
    #0A1628 alap, 10pt sarok, bal 3pt SÁRGA (#FFB627) sín, 16pt belső padding.
    Bal felül 14pt vonalas "információ" ikon sárgán, mellette 11pt ALL CAPS
    "MIT JELENT AZ ISMERETLEN?", alatta 13pt DM Sans halványan, két sorban:
    "Külföldi klub, alsóbb osztály vagy adathiány is lehet. Külföldi
    igazolást nem bizonyít."

11. TAB BAR – a "Tabella" aktív (cián ikon, címke, felső indikátor csík)

FONTOS
Semmi vízszintes görgetés. A képernyőn EGYETLEN átlag vagy százalék sincs –
csak darabszámok a csempéken. A neveket ne rendezd át és ne magyarosítsd,
pontosan ebben az alakban jelenjenek meg. A frissítés húzásra történik
(pull-to-refresh), NE rajzolj külön „Frissítés" gombot.

VARIÁNS – LIGA NÉZET
Készítsd el mellé ugyanezt a képernyőt a teljes bajnokságra:
– a nav bar szűrő-pillje "2026/2027 · ÖSSZES ▾"
– a nagy cím mellett "235 mozgás"
– az IRÁNY-SÁV jobb oldalán "14 KÖVETETT CSAPAT"
– a StatTile rács ugyanígy áll, nagyobb számokkal (ÉRKEZŐK 95 · TÁVOZÓK 140 ·
  HAZAI VÁLTÁSBÓL 27 · VISSZATÉRŐ 5 · ISMERETLEN CÉLBA 112)
– a lista csapatonként csoportosul: minden csoport élén RAGADÓS (sticky)
  csapatfejléc – 32pt magas, #050B14 alap, alul finom vonal, benne a
  csapatnév Barlow Condensed 600, 17pt, jobbra mono 13pt halványan "+6 / −10"
  (érkezők / távozók, a mínusz narancs színnel) – az első csoport az
  "Alba Fehérvár"
– csoporton belül előbb az érkezők, majd a távozók, szekciófejléc nélkül,
  csak a bal sín színe különbözteti meg őket
```
