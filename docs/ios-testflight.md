# iOS build Xcode-ból TestFlightra

> Ellenőrizve: 2026-09-22, Xcode 27.0, CocoaPods 1.17.0, Node 22.23.2, macOS 25.6.
> Az app Expo managed workflow: **nincs `ios/` mappa a gitben**, azt a
> `npx expo prebuild` generálja (Continuous Native Generation). A `docs/feature-tasks.md`
> „Ship előtt" szakasza a hivatalos checklist, ez a fájl a hozzá tartozó recept.

---

## 1. Rövid válasz: alkalmas a projekt?

**Igen, a projekt buildelhető Xcode-ból és feltölthető TestFlightra.** A natív
projekt és a Podok már le vannak generálva, a workspace megnyitható.

Amit ténylegesen lefuttattam és működik:

| Ellenőrzés | Eredmény |
|---|---|
| `npx expo prebuild --platform ios` | Lefut, `ios/` elkészül (2 figyelmeztetés, lásd 5. pont) |
| `npx pod-install` | 110 pod telepítve, `ios/ASEStats.xcworkspace` létrejött |
| Megosztott séma | `ASEStats` (az Archive-hoz kell) |
| Bundle identifier | `hu.ase.asestats` (app.json ↔ Xcode egyezik) |
| Verzió / build | `CFBundleShortVersionString = 1.0.0`, `CFBundleVersion = 7` |
| Deployment target | iOS 16.4 |
| Export compliance | `ITSAppUsesNonExemptEncryption = false` → nem kérdez rá a TestFlight |
| App ikon | 1024×1024, **alfa csatorna nélkül** – App Store Connect elfogadja |
| Adatvédelmi manifest | `ios/ASEStats/PrivacyInfo.xcprivacy` aggregálva a podokból |
| JS bundle | `npx expo export --platform ios` hibátlan; a `.env` betöltődik |
| `npx tsc --noEmit`, `npm run lint` | Tiszta |
| `npx expo-doctor` | 20/21 – csak patch-verzió elmaradás (5. pont) |

Amit **nem** ellenőriztem:

- **Teljes `xcodebuild archive`** – a gépen 9,4 GB szabad hely maradt (96% telített),
  egy első Xcode build DerivedData-ja ennél többet is elvihet. Lásd 5.1.
- **Kódaláírás** – Apple fejlesztői fiók kell hozzá, azt csak te tudod beállítani.

---

## 2. Mielőtt Xcode-ot nyitsz

```bash
cd /Users/kacsorzsolt/Developer/Projektek/asestatmobile

# 1. A Supabase kulcsok MEGLÉTE kötelező – ezek a bundle-be sülnek bele
cut -d= -f1 .env        # EXPO_PUBLIC_SUPABASE_URL és EXPO_PUBLIC_SUPABASE_ANON_KEY kell

# 2. Kód rendben van-e
npx tsc --noEmit && npm run lint
```

**Ez a leggyakoribb hiba forrása.** A `.env` nincs a gitben (helyesen), viszont az
Xcode „Bundle React Native code and images" fázisa ebből olvassa a két
`EXPO_PUBLIC_*` értéket, és beleégeti a JS bundle-be. Ha a `.env` hiányzik vagy
üres, a build **sikerül**, de az app indításkor elszáll a
`lib/supabase.ts` hibaüzenetével – pontosan ez volt a D-100-as éles crash.

---

## 3. Natív projekt előállítása

Ez most **már le van futtatva**, az `ios/` mappa készen áll. Újra csak akkor kell,
ha változik az `app.json`, egy config plugin, vagy natív kódot érintő csomag
kerül be / ki:

```bash
npx expo prebuild --platform ios     # ios/ (újra)generálása
npx pod-install                      # CocoaPods
```

Tudnivalók:

- Az `ios/` **gitignore-olt**, nem kell (és nem is szabad) commitolni.
- A `prebuild` átírja a `package.json` `ios`/`android` scriptjeit
  (`expo start --ios` → `expo run:ios`). Ezt szándékosan visszaállítottam; ha
  legközelebb újra megteszi, nyugodtan vond vissza (`git checkout package.json`).
- `--clean` kapcsolóval a mappa a nulláról készül: ilyenkor **az Xcode-ban
  beállított Team és minden kézi projektbeállítás elvész**, újra be kell állítani.
- Az `ios/` mappa jelenleg 1,2 GB.

---

## 4. Xcode: Archive és feltöltés

1. **A workspace-t nyisd meg, ne a projektet:**
   ```bash
   open ios/ASEStats.xcworkspace
   ```
2. **Signing & Capabilities** (ASEStats target): `Automatically manage signing`
   bekapcsolva, **Team** = a saját Apple Developer csapatod.
   A `hu.ase.asestats` bundle ID-t az Xcode regisztrálja a portálon, ha még nincs.
   Az App Store Connectben ugyanezzel a bundle ID-vel kell léteznie az app rekordnak.
3. **Cél:** a séma `ASEStats`, a futtatási cél **Any iOS Device (arm64)**
   (szimulátorral nem lehet archiválni).
4. **Product → Archive.** Az első build hosszú (10–25 perc): a Podok és a
   React Native modulok is most fordulnak. A JS bundle ekkor készül el és
   ágyazódik be – a Release konfiguráció ezt automatikusan elvégzi.
5. Az Organizer ablakban: **Distribute App → TestFlight & App Store → Upload**,
   automatikus aláírással.
6. Feltöltés után az App Store Connect 5–30 percig dolgozza fel a buildet.
   Az export compliance kérdés nem jön elő (`ITSAppUsesNonExemptEncryption=false`).
7. TestFlight → Internal Testing → tesztelők hozzáadása. Belső tesztelőkhöz nem
   kell Beta App Review.

---

## 5. Amit érdemes rendezni

### 5.1 Lemezterület (gyakorlati kockázat)

9,4 GB szabad hely maradt. Egy első Xcode Archive DerivedData-ja könnyen elvisz
3–6 GB-ot. Ha elfogy a hely, a build félúton, félreérthető hibával áll le.
Takarítás előtte:

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/*
xcrun simctl delete unavailable
```

### 5.2 Build number – minden feltöltés előtt emelni kell

Az App Store Connect ugyanahhoz a verzióhoz **nem fogad el kétszer azonos build
számot**. A korábbi EAS buildek miatt a távoli számláló **6**-on állt
(`npx eas-cli build:version:get --platform ios`), ezért az `app.json` most
`"buildNumber": "7"`-et tartalmaz – ez az első szabad szám.

A következő feltöltéshez emeld eggyel:

```json
"ios": {
  "bundleIdentifier": "hu.ase.asestats",
  "buildNumber": "8",
  ...
}
```

majd:

```bash
npx expo prebuild --platform ios && npx pod-install
```

Az `app.json` a mérvadó hely: Xcode-ban kézzel is átírható a build szám, de a
következő prebuild felülírja.

> **Ha később megint EAS-szel buildelsz:** az `eas.json`-ban
> `appVersionSource: "remote"` áll, tehát az EAS a saját (most 6-os) számlálóját
> használja és lépteti – az ütközne a lokálisan feltöltött 7-tel. Ilyenkor előbb
> állítsd szinkronba: `npx eas-cli build:version:set --platform ios`.

### 5.3 A rendszertéma átüt a natív felületeken

Az `app.json`-ban `userInterfaceStyle: "dark"` áll, a generált `Info.plist`-ben
mégis `UIUserInterfaceStyle = Automatic`. Ez nem hiba a prebuildben: az
`expo-splash-screen` plugin **azért** állítja automatikusra, mert a splash
konfigurációban van `dark` variáns is.

Következmény: a saját UI-nk mindenhol sötét marad, de a **natív** elemek
(rendszer `Alert`, billentyűzet, szövegkijelölés menü) világos módú eszközön
világosak lesznek.

Javítás egy sorral: a splash `dark` blokkja **karakterre azonos** a világossal
(`#050B14`, ugyanaz a kép), tehát elhagyható – ekkor a `dark` beállítás
érvényre jut. Ez az `app.json` módosítása, ezért nem nyúltam hozzá; szólj, és
átvezetem. A `docs/feature-tasks.md` „Sötét/világos rendszertéma" ship-előtti
pontja emiatt egyelőre nyitva marad.

### 5.4 OTA frissítés nem ér el erre a buildre

Az `expo-updates` be van kapcsolva (`https://u.expo.dev/285f7cf5-…`,
runtimeVersion = appVersion = `1.0.0`), de a **channel** beállítását EAS Build
írja be – lokális Xcode build esetén nincs, így az app csak a beágyazott
bundle-ből fut, `eas update`-tel nem frissíthető. Indításkor nem vár rá
(`EXUpdatesLaunchWaitMs = 0`), tehát ez nem okoz hibát.

Ha kell rá OTA, az `app.json`-ba:

```json
"updates": {
  "url": "https://u.expo.dev/285f7cf5-4ab3-4059-af93-6447631d9975",
  "requestHeaders": { "expo-channel-name": "production" }
}
```

### 5.5 Patch-verzió elmaradás (nem blokkoló)

Az `npx expo-doctor` 8 Expo csomagnál patch-szintű elmaradást jelez
(`expo 57.0.19` vs `57.0.24`, `expo-router`, `expo-updates` stb.). A build enélkül
is megy, de feltöltés előtt érdemes:

```bash
npx expo install --check     # interaktív, jóváhagyással frissít
npx expo prebuild --platform ios && npx pod-install
```

Ez csomagverziókat módosít, ezért külön committal és tesztfuttatással menjen.

### 5.6 Ha ITMS-91053 e-mailt kapsz

Az aggregált `PrivacyInfo.xcprivacy` elkészült, három kategóriával és
indoklással: `UserDefaults` (CA92.1), `FileTimestamp` (C617.1), `SystemBootTime`
(35F9.1). Ennek tehát nem szabadna előjönnie. Ha mégis, az `app.json`
`ios.privacyManifests` mezőjével pótolható a hiányzó deklaráció.

---

## 6. Hibaelhárítás

| Tünet | Ok / megoldás |
|---|---|
| Az app indul, de azonnal „Hiányzó Supabase környezeti változó" | A `.env` hiányzott az Archive-kor. Töltsd ki, **Clean Build Folder**, újra Archive. |
| `No such module 'ExpoModulesCore'` | A `.xcodeproj`-et nyitottad meg a workspace helyett, vagy hiányzik a `pod install`. |
| `Sandbox: bash(…) deny file-read` a bundle fázisban | A generált projekt nem állítja az `ENABLE_USER_SCRIPT_SANDBOXING`-ot; ha előjön, a target Build Settingsében állítsd `NO`-ra. |
| „Redundant binary upload" / build number ütközés | Lásd 5.2 – emeld az `app.json` `ios.buildNumber` értékét, majd prebuild + új Archive. |
| Az Archive gomb szürke | A cél nem `Any iOS Device (arm64)`, hanem szimulátor. |
| Prebuild után eltűnt a Team | `--clean` futott; állítsd be újra a Signing & Capabilities alatt. |
| Furcsa natív fordítási hiba előzmény nélkül | `rm -rf ios && npx expo prebuild --platform ios && npx pod-install` |

---

## 7. Mi nem kerülhet gitbe

- `ios/`, `android/` – generált mappák (`.gitignore` már kezeli)
- `.env` – a Supabase URL és anon kulcs
- `*.p8`, `*.p12`, `*.mobileprovision`, `*.jks` – aláíró anyagok

A `docs/` alatti fájlok, az `app.json` és az `eas.json` viszont igen.
