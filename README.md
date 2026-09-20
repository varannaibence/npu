# Neptun PowerUp!

[![Verify code](https://github.com/varannaibence/npu/actions/workflows/verify.yml/badge.svg)](https://github.com/varannaibence/npu/actions/workflows/verify.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Status: early phase](https://img.shields.io/badge/status-early%20phase-orange.svg)

> _Az egyetem már így is elég nehéz. Ne a Neptun tegye nehezebbé._

A Neptun PowerUp! egy felhasználói szkript, ami a Neptun hallgatói felületét
teszi gyorsabbá és kiszámíthatóbbá. Kevesebb kattintás, kevesebb lapozás,
kevesebb ideges keresgélés: kiírja a kurzusok férőhelyét, és segít előre
összeállítani a tárgyfelvételi sorrendedet.

A 3.0.0 az **új, Angular-alapú Neptun-felülethez** készült, a nulláról. A régi
felülethez való 2.4.1-es kiadás ettől független; azt az [eredeti
projektben](https://github.com/solymosi/npu) találod, és új felületű Neptunon
nem működik.

| Tulajdonság | Érték |
| --- | --- |
| **Célfelület** | Új, Angular-alapú Neptun NG |
| **Telepítés** | [Tampermonkeyból, egy kattintással](https://github.com/varannaibence/npu/releases/latest/download/npu.user.js) |
| **Állapot** | Korai fejlesztési fázis |
| **Kompatibilitás** | [Ellenőrzött intézmények és állapotok](docs/TESTED.md) |
| **Licenc** | [MIT](LICENSE) |

> **Korai fejlesztési fázis.** A v3 működése és felülete még változhat, és egyes
> részei törékenyek lehetnek. Az intézményenkénti ellenőrzési állapotot a
> [docs/TESTED.md](docs/TESTED.md) tartalmazza.

## Mit tud?

Az **alapból kikapcsolva** jelölésű funkciókat az **NPU beállítások** panelben
kapcsolhatod be. A módosítások a következő oldalbetöltéskor lépnek életbe.

**Tárgyfelvétel**

- **Tárgylista automatikus betöltése** *(alapból kikapcsolva)*: magától elindítja
  a tárgyak listázását, ahelyett hogy minden alkalommal rá kellene nyomni a
  keresésre. Így nem indítunk a felhasználó helyett automatikus keresést és extra
  kérést.
- Egy lapon sokkal több sort tölt be, így jóval kevesebbet kell lapozni.
- A kurzusokra kiírja a férőhelyet (`11 / 999`), és színnel jelzi, hogy van-e még
  benne hely, csak várólista van-e, vagy egyáltalán nem lehet rá jelentkezni.
- A lenyitott kurzusoknál jelzi, ha az időpont ütközik a Neptun saját
  órarendtervezőjében lévő vagy már felvett kurzussal, és azt is kiírja, hogy
  pontosan mivel és mikor.
- **Táblázatos kurzuslista** *(alapból kikapcsolva)*: a kinyitott tárgy kurzusait
  áttekinthető, szűrhető és rendezhető táblázatban jeleníti meg. A natív listát
  NPU-specifikus nézetre cseréli, ezért nem akarjuk automatikusan megtörni a
  megszokott munkafolyamatot; kinek melyik megjelenítés kényelmes, szubjektív.
- A **Betelt kurzusok hátra** gombbal a már lenyitott tárgyak kurzuslistájában
  előre rendezi azokat, amikbe még lehet jelentkezni; újra megnyomva visszaáll az
  eredeti sorrend. A lenyitott tárgy fejlécén a már betöltött kurzusok állapota is
  látszik.

**Rajtoló** — saját sorrend tárgyakból és kurzusokból, amit egy megadott
időpontban sorban megpróbál beküldeni. Részletesen lentebb.

**Máshol**

- A funkciók külön ki- és bekapcsolhatók a lap alján, az **NPU beállítások**
  pontban.
- A nagy asztali kijelzőkre készült **Kompakt tárgyfelvételi nézet** *(alapból
  kikapcsolva)* külön bekapcsolható; mobilon és a Neptun többi oldalán nem
  változtat semmit. Ez NPU-specifikus elrendezés, ezért alapból nem írjuk át a
  megszokott felületet; hogy kinek melyik nézet jön be, szubjektív.
- A fejlécben tárgytípusonként bontja a ténylegesen felvett krediteket.
- **Munkamenet életben tartása** *(alapból kikapcsolva, mert háttérforgalmat
  indít)*: aktív használat mellett megújítja a közeli lejáratú munkamenetet;
  tétlen lapot nem tart életben.
- Bejelentkezés után felajánlja, hogy visszavigyen arra az oldalra, ahol
  legutóbb jártál.
- A bejelentkező oldalon és a láblécben jelzi, hogy fut, a lábléc pedig egyből a
  hibabejelentőre visz. Így hibabejelentésnél látszik, hogy az NPU fut.

## Telepítés

### Normál felhasználóknak

1. Telepítsd a [Tampermonkeyt](https://www.tampermonkey.net/) a böngésződbe:
   [Firefox](https://addons.mozilla.org/firefox/addon/tampermonkey/),
   [Chrome](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo),
   [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd),
   [Opera](https://addons.opera.com/en/extensions/details/tampermonkey-beta/)
   vagy [Safari](https://apps.apple.com/app/tampermonkey/id1482490089).
2. Kattints a [Neptun PowerUp! telepítésére](https://github.com/varannaibence/npu/releases/latest/download/npu.user.js).
3. A Tampermonkey ablakában válaszd az **Install** vagy **Telepítés** gombot.
4. Nyisd meg a Neptunt, és jelentkezz be a szokásos módon.

Ha a böngésző csak letölti a fájlt, nyisd meg újra a letöltött `npu.user.js`
fájlt, és engedélyezd a Tampermonkey telepítését.

### Fejlesztőknek

Fejlesztéshez ne a release assetet telepítsd. A helyi loader, a build, a tesztek
és a release-folyamat a [fejlesztői útmutatóban](docs/DEVELOPMENT.md) található.

<!-- releases:start -->
## Legfrissebb kiadások

A legutóbbi három stabil kiadás. A **Telepítés** link Tampermonkey mellett
közvetlenül telepíthető.

<details open>
<summary><strong>v3.0.0</strong> · 2026. szept. 20.</summary>

Az első v3-fejlesztési kiadás az új, Angular-alapú Neptun-felülethez. A v3 külön
kódra épül; a régi WebForms-modulok nem részei ennek a verziónak.

**Tárgyfelvétel**

- A kurzussorokon megjelenik, ha az adott időpont a Neptun natív tervezőjében
  lévő vagy már felvett kurzussal ütközik, a másik tárgy és időpont nevével.
- Alapból kikapcsolt, beállításból bekapcsolható, csak asztali tárgyfelvételnél
  működő kompakt nézet. Ez NPU-specifikus elrendezés, ezért nem írja át
  automatikusan a megszokott felületet; hogy kinek melyik nézet kényelmes,
  szubjektív.
- Alapból kikapcsolt táblázatos kurzuslista, mert a natív kurzuslistát NPU-
  specifikus nézetre cseréli, és a megszokott munkafolyamatot nem akarjuk
  automatikusan megtörni.
- A Rajtoló és a kurzussori jelzések ugyanazt az órarendi ütközésvizsgálatot
  használják.
- A modulkapcsolók már alapból kikapcsolt, külön bekapcsolható modulokat is
  kompatibilisen tudnak tárolni.

**További tárgyfelvételi változások**

- Alapból kikapcsolt, beállítással bekapcsolható tárgylista-automatikus betöltés,
  hogy ne indítson a felhasználó helyett automatikus keresést és extra kérést.
- A kurzusok mellett látszik a férőhely, a betelt állapot és a várólista;
  a tárgyakon az, hogy hány kurzusuk telt már be.
- A „Betelt kurzusok hátra" kapcsoló előre rendezi azt, amire még lehet
  jelentkezni, és a kapcsolása vissza is fordítható.
- A listák egy lapon lényegesen több sort töltenek be.

**Rajtoló**

- Saját, felhasználó és félév szerint tárolt terv, soros beküldéssel.
- Időszakválasztó a Neptun saját tárgyfelvételi időszakaiból, szerverhez
  igazított visszaszámlálással.
- Órarendütközés-jelzés és kredit-előrejelzés a terven belül.
- A várólistára kerülést külön jelzi a sikeres felvételtől.
- Ismeretlen szerverválasznál megáll, nem könyvel el találgatott sikert.

**Egyéb**

- Kreditbontás tárgytípusonként a fejléc saját kártyájában.
- Alapból kikapcsolt munkamenet-frissítés, mert háttérforgalmat indít; aktív
  használat mellett megújítja a közeli lejáratú munkamenetet, tétlen lapot nem
  tart életben.
- Bejelentkezés után felajánlja a visszatérést a legutóbbi oldalra.
- Az NPU neve és verziója a bejelentkező oldalon és a láblécben, a lábléc
  hibabejelentő linkjével együtt.

**Ami szándékosan kimaradt**

- `autoLogin`: a 2FA, a karbantarthatóság és a jelszókezelés kockázatai miatt.
- A bizonytalan adatokra épülő mintatantervi hiány-nézet.
- Az üzenetek tömeges olvasottra állítása kimaradt. Az alapja elkészült, de az
  élő oldalon nem találtunk hozzá biztonságosan használható lapozási végpontot.

**Adatvédelem**

- A régi `neptun.users` GM-kulcsot az új kód nem olvassa, nem importálja és nem
  törli. A saját `data.users` rekordokban maradt érzékeny bejelentkezési
  mezőket induláskor kitisztítja, a nem érzékeny terveket és adatokat megtartja.

**Korlátok**

- Az intézményenkénti működési állapotot a [TESTED.md](docs/TESTED.md) tartalmazza.
- A sikeres és a ténylegesen betelt tárgyfelvételi válasz éles ellenőrzése még
  hátra van; ezek csak nyitott tárgyfelvételi időszakban mérhetők.

[Release megnyitása](https://github.com/varannaibence/npu/releases/tag/v3.0.0) · [Telepítés](https://github.com/varannaibence/npu/releases/download/v3.0.0/npu.user.js)

</details>

[Összes kiadás megtekintése](https://github.com/varannaibence/npu/releases)
<!-- releases:end -->

## A Rajtoló használata

1. Jelentkezz be, és maradj bejelentkezve a tervezett kezdésig.
2. Nyisd meg a **Tárgyfelvétel** oldalt, listázd a tárgyakat, majd a kívánt
   kurzusoknál kapcsold be a **Rajtolóhoz** kapcsolót.
3. Nyisd meg a Rajtolót a szűrő melletti gombbal. Itt tudod sorba rendezni a
   tárgyakat és kurzusokat, kitölteni a nyitás időpontját a Neptun saját
   tárgyfelvételi időszakaiból, és megnézheted az esetleges órarendütközéseket meg
   a kredit-előrejelzést.
4. Indítsd el, és figyeld az eredményeket.

A terv a böngésződben marad meg, felhasználónként és félévenként. A Neptun saját
**Tervezőhöz adás** kapcsolója ettől külön funkció; nem az adja a Rajtoló
listáját.

Amit a Rajtoló **nem** csinál: nem jelentkezik be helyetted, nem kér kétlépcsős
kódot (2FA), nem kerüli meg a CAPTCHA-t és nem hágja át az egyetem szabályait.
A **Leállítás** a további kéréseket állítja le; ami már elment a szervernek, azt
nem lehet visszavonni. A várólistára kerülés pedig nem ugyanaz, mint a sikeres
tárgyfelvétel — a Rajtoló ezt a kettőt külön is írja ki, épp ezért.

## Fontos korlátok

- Az intézményenkénti ellenőrzési állapot a [docs/TESTED.md](docs/TESTED.md) lapon látható;
  ami nincs benne, arról nincs mérésünk. Máshol a működés nem garantált.
- A végső döntést mindig a Neptun szervere hozza meg. Éles tárgyfelvételi
  időszakban még ellenőrizendő a sikeres beküldés válasza, a ténylegesen betelt
  (nem várólistás) kurzus válasza, és a rangsoros kurzusok viselkedése.
- A tényleg tétlenül hagyott fül munkamenete lejárhat: a program nem tartja
  életben vak háttérforgalommal, mert az pont az a minta, amit el akarunk
  kerülni.
- Az ütközésjelzés csak azokat a tervezett vagy felvett kurzusokat tudja
  figyelembe venni, amelyekhez a Neptun felismerhető kurzusazonosítót és
  órarendi adatot ad. Hiányzó időpontnál ezt külön jelzi, és nem állítja, hogy
  nincs ütközés.
- A régi, 2.4.1-es kiadás funkciólistája nem a v3 képességeit írja le.

## Adatvédelem

A program a böngésződben fut, és nem küldi az adataidat saját szerverre. A
Rajtoló tervei és a beállítások helyben maradnak. A v3 nem tárol jelszót.

A régi `neptun.users` GM-kulcsot (a korábbi bejelentkezési mentést) a v3 nem
olvassa, nem importálja és nem törli. A v3 saját `data.users` adataiban maradt
bejelentkezési és hitelesítési mezőket induláskor kitisztítja, a terveket és az
egyéb nem érzékeny adatokat meghagyja. A régi `neptun.courses` értékéből csak
biztonságos kulcsú, nem érzékeny kurzusválasztás kerülhet a v3
`courses._legacy` részébe; a régi
GM-forrásokat a program nem törli.

A jelszavadat mindig a Neptun saját oldalán írd be — a programnak és a
hibabejelentésnek soha ne küldd el.

## Ha valami nem működik

Ellenőrizd, hogy a szkript engedélyezve van-e, és tényleg az új Neptun megfelelő
oldalán jársz-e. Rajtolónál töltsd újra az oldalt bejelentkezett állapotban,
majd állítsd össze újra a tervet. Ha egyáltalán semmi nem látszik, a
[docs/TESTED.md](docs/TESTED.md) végén van egy rövid lista a gyakori okokról.

Hibabejelentéshez írd le a program verzióját (a lap alján olvasható), az
intézményt, az oldalt és azt, hogy mivel lehet előhozni. Képernyőkép jöhet, de
jelszót, sütit, belépési tokent vagy teljes hálózati exportot ne csatolj. A
hibákat a [GitHub issue
trackerben](https://github.com/varannaibence/npu/issues) lehet jelezni.

## Közreműködők és licenc

A projekt eredeti szerzője Mate Solymosi; az új Neptun-felülethez készülő v3-at
Varannai Bence írja.

Szeretnél funkciót hozzáadni? Modulként, pull requestben lehet — a
[docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) leírja, hogyan.

A program az [MIT License](LICENSE) feltételei szerint használható, saját
felelősségedre. A korábbi kiadások története a [docs/CHANGELOG.md](docs/CHANGELOG.md)
fájlban maradt meg.
