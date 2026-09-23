<div align="center">

<img src="docs/assets/npu-icon.svg" width="96" height="96" alt="">

# Neptun PowerUp!

**Gyorsabb, átláthatóbb és kiszámíthatóbb Neptun — az új, Angular-alapú felülethez.**

[![Verify code](https://github.com/varannaibence/npu/actions/workflows/verify.yml/badge.svg)](https://github.com/varannaibence/npu/actions/workflows/verify.yml)
[![Latest release](https://img.shields.io/github/v/release/varannaibence/npu-uj-neptunhoz?label=kiad%C3%A1s)](https://github.com/varannaibence/npu-uj-neptunhoz/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Status: early phase](https://img.shields.io/badge/%C3%A1llapot-korai%20f%C3%A1zis-orange.svg)

[**Telepítés**](#telepítés) · [Funkciók](#funkciók) · [Rajtoló](#a-rajtoló) · [Adatvédelem](#adatvédelem) · [Hibaelhárítás](#hibaelhárítás) · [Közösség](https://github.com/varannaibence/npu-uj-neptunhoz/discussions)

_Az egyetem már így is elég nehéz. Ne a Neptun tegye nehezebbé._

</div>

---

A **Neptun PowerUp!** (NPU) egy böngészőben futó userscript, amely a Neptun
hallgatói felületét egészíti ki: kiírja a kurzusok férőhelyét és órarendi
ütközéseit, sorba rendezett tárgyfelvételt tesz lehetővé, és a felületet a
saját ízlésedre színezheted. Mindez helyben, a böngésződben fut — saját szerver,
fiók vagy jelszómentés nélkül.

A 3.x sorozat az **új Neptun NG felülethez** készült, a nulláról újraírva. A
régi felülethez tartozó 2.4.1-es kiadás az [eredeti
projektben](https://github.com/solymosi/npu) érhető el; az új Neptunon nem
működik.

> **Korai fejlesztési fázis.** A működés és a felület még változhat. Hogy melyik
> intézményen mit ellenőriztünk, azt a [docs/TESTED.md](docs/TESTED.md) mutatja.

## Funkciók

Minden funkció egyenként kapcsolható a **Neptun PowerUp! beállítások**
panelben; a módosítás a következő oldalbetöltéskor lép életbe.

A **Ki** alapállapot szándékos döntés, nem félkész funkciót jelez. Ezek a
modulok a Neptun megszokott elrendezését vagy munkafolyamatát változtatják meg,
illetve extra hálózati kérést indítanak, ezért csak kifejezett bekapcsolás után
lépnek működésbe.

### Tárgyfelvétel

| Funkció | Leírás | Alapállapot |
| --- | --- | :---: |
| Férőhely és várólista | Kurzusonként jelzi a szabad helyet, a beteltséget és a várólistát; tárgyanként a betelt kurzusok számát. | Be |
| Órarendi ütközések | Megnevezi az ütköző tárgyat és időpontot a tervezőben lévő és a már felvett kurzusok alapján. | Be |
| ↳ Időpont a megjegyzésből | Ha a Neptun nem ad órarendi adatot, a kurzus megjegyzéséből olvassa ki a napot, az időt és a termet (pl. „Hétfő 14-15, A1/216”), és az ütközésvizsgálatban is felhasználja. | Be |
| Gyorsabb kurzuslista | Egy oldalon lényegesen több sort tölt be, így kevesebbet kell lapozni. | Be |
| Betelt kurzusok hátra | A még felvehető kurzusokat előre rendezi a lenyitott listában. | Gombbal |
| Tárgylista automatikus betöltése | Külön keresés nélkül elindítja a tárgyak listázását. | Ki |
| Táblázatos kurzuslista | Szűrhető, rendezhető táblázatra cseréli a natív kurzuslistát. | Ki |
| Kompakt nézet | Sűrűbb elrendezés nagy asztali kijelzőkhöz. | Ki |

### Rajtoló

| Funkció | Leírás | Alapállapot |
| --- | --- | :---: |
| Sorba rendezett tárgyfelvétel | Mentett tárgy- és kurzussorrend, a megadott időpontban soros beküldéssel. [Részletek](#a-rajtoló) | Külön indítható |

### Megjelenés és kényelem

| Funkció | Leírás | Alapállapot |
| --- | --- | :---: |
| Színtéma | A Neptun kékje helyett választható kiemelőszín (8 minta vagy egyéni); a fejléc és a lábléc ennek sötét árnyalatát kapja. | Neptun kék |
| Kreditbontás | A fejlécben tárgytípusonként bontja a ténylegesen felvett krediteket. | Be |
| Visszatérés az előző oldalra | Bejelentkezés után felajánlja a legutóbb használt oldal megnyitását. | Be |
| Munkamenet életben tartása | Aktív használat mellett megújítja a hamarosan lejáró munkamenetet; tétlen lapot nem tart életben. | Ki |
| Verzió és hibabejelentés | Az NPU neve és verziója a bejelentkező oldalon és a láblécben, hibabejelentő linkkel. | Be |

## Telepítés

Az NPU a **Tampermonkey** böngészőbővítménnyel fut. A telepítés néhány perc.

**1. Tampermonkey telepítése** —
[Chrome](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) ·
[Firefox](https://addons.mozilla.org/firefox/addon/tampermonkey/) ·
[Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd) ·
[Opera](https://addons.opera.com/en/extensions/details/tampermonkey-beta/) ·
[Safari](https://apps.apple.com/app/tampermonkey/id1482490089)

**2. Userscriptek engedélyezése (csak Chrome és Edge)** — az újabb verziók ezt
külön kérhetik; enélkül az NPU látszik a Tampermonkey menüjében, de a Neptunon
nem fut.

<details>
<summary>Lépések Chrome és Edge alatt</summary>

1. Nyisd meg a `chrome://extensions` (Edge: `edge://extensions`) oldalt.
2. A Tampermonkeynál kattints a **Részletek** gombra.
3. Kapcsold be a **Felhasználói szkriptek engedélyezése** / **Allow User
   Scripts** lehetőséget.
4. Ellenőrizd, hogy a Tampermonkey hozzáférhet a Neptun webhelyéhez.

Ha Edge alatt nem látsz ilyen kapcsolót, nincs vele teendőd. Firefox és Safari
alatt ez a lépés kimarad.

</details>

**3. Az NPU telepítése** —
[**Neptun PowerUp! telepítése**](https://github.com/varannaibence/npu-uj-neptunhoz/releases/latest/download/npu.user.js),
majd a Tampermonkey ablakában **Telepítés** / **Install**. Ha a böngésző csak
letölti az `npu.user.js` fájlt, nyisd meg, és engedd a Tampermonkeynak
telepíteni.

**4. Neptun megnyitása** — az NPU 3 csak az új felületen működik, amelynek
címében szerepel a `/hallgato_ng/` rész. Nyisd meg, és töltsd újra egyszer.

**5. Ellenőrzés** — a telepítés akkor sikeres, ha a Neptun oldalán:

- a Tampermonkey ikonján megjelenik az `1`-es jelzés,
- a menüben látszik a **Neptun PowerUp! beállítások** pont,
- a bejelentkező oldalon vagy a lap alján olvasható a **Neptun PowerUp!
  v3.x.x** felirat.

> **Fejlesztőknek:** fejlesztéshez ne a release-t telepítsd: a helyi loader, a build, a tesztek és
> a kiadási folyamat a [fejlesztői útmutatóban](docs/DEVELOPMENT.md) található.

<!-- releases:start -->
## Legfrissebb kiadások

A legutóbbi három stabil kiadás. A **Telepítés** link Tampermonkey mellett
közvetlenül telepíthető.

<details open>
<summary><strong>v3.0.1</strong> · 2026. szept. 23.</summary>

**Megjelenés**

- Színtéma: a Neptun kékje helyett választható kiemelőszín (8 előre beállított
  árnyalat vagy tetszőleges egyéni szín). A fejléc és a lábléc ennek sötét
  árnyalatát kapja. A beállításokban élőben látszik, a Mégse visszaállítja.
- Átdolgozott beállításpanel: kapcsolók jelölőnégyzetek helyett, csoportonként
  kártya, animált lenyitás.
- Az NPU ablakainak címe már nem tapad a felső szélhez, és a gombjaik a
  kezdőlapon is mind a négy sarkukon kerekek.

**Tárgyfelvétel**

- Időpont a megjegyzésből: ha egy kurzusnak nincs órarendi adata, de az oktató
  a megjegyzésbe írta az időpontot (pl. „Hétfő 14-15, A1/216”), az NPU onnan
  olvassa ki a napot, az időt és a termet. Kiírja a kurzus alá, és az
  ütközésvizsgálat, valamint a Rajtoló is számol vele. Az órarendi ütközések
  alopciójaként kikapcsolható.

**Kiadás**

- A kiadás verzióját a tag adja; a GitHub felületén létrehozott release elég,
  a `package.json` utána automatikusan igazodik.

[Release megnyitása](https://github.com/varannaibence/npu-uj-neptunhoz/releases/tag/v3.0.1) · [Telepítés](https://github.com/varannaibence/npu-uj-neptunhoz/releases/download/v3.0.1/npu.user.js)

</details>
<details>
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

[Release megnyitása](https://github.com/varannaibence/npu-uj-neptunhoz/releases/tag/v3.0.0) · [Telepítés](https://github.com/varannaibence/npu-uj-neptunhoz/releases/download/v3.0.0/npu.user.js)

</details>

[Összes kiadás megtekintése](https://github.com/varannaibence/npu-uj-neptunhoz/releases)
<!-- releases:end -->

## A Rajtoló

A Rajtoló előre összeállított tervvel, a tárgyfelvétel nyitásakor, a megadott
sorrendben küldi be a jelentkezéseket.

1. Jelentkezz be, és maradj bejelentkezve a tervezett kezdésig.
2. A **Tárgyfelvétel** oldalon listázd a tárgyakat, és a kívánt kurzusoknál
   kapcsold be a **Rajtolóhoz** kapcsolót.
3. Nyisd meg a Rajtolót a szűrő melletti gombbal: rendezd sorba a tárgyakat és
   kurzusokat, válaszd ki a nyitás időpontját a Neptun saját tárgyfelvételi
   időszakaiból, és nézd át az ütközéseket és a kredit-előrejelzést.
4. Indítsd el, és kövesd az eredményeket.

A terv felhasználónként és félévenként a böngésződben tárolódik. A Neptun
**Tervezőhöz adás** kapcsolója ettől független funkció.

> **Fontos:** a Rajtoló **nem** jelentkezik be helyetted, nem kér kétlépcsős kódot, nem
> kerüli meg a CAPTCHA-t és nem hágja át az egyetem szabályait. A
> **Leállítás** csak a további kéréseket állítja meg — ami már elment, azt nem
> lehet visszavonni. A várólistára kerülést a sikeres felvételtől külön jelzi,
> ismeretlen szerverválasznál pedig megáll, és nem könyvel el sikert.

## Fontos korlátok

- **Intézményi lefedettség.** Az ellenőrzött állapot a
  [docs/TESTED.md](docs/TESTED.md) lapon látható; ami nincs benne, arról nincs
  mérésünk.
- **A döntést a Neptun hozza.** Éles tárgyfelvételi időszakban még ellenőrizendő
  a sikeres beküldés, a ténylegesen betelt (nem várólistás) kurzus és a
  rangsoros kurzusok szerverválasza.
- **Tétlen munkamenet.** A tényleg magára hagyott fül munkamenete lejárhat; az
  NPU szándékosan nem tartja életben vak háttérforgalommal.
- **Ütközésjelzés.** Csak azokkal a kurzusokkal számol, amelyekhez a Neptun
  felismerhető azonosítót, és órarendi adatot vagy értelmezhető megjegyzést ad.
  Hiányzó időpontnál ezt jelzi, és nem állítja, hogy nincs ütközés.
- A régi, 2.4.1-es kiadás funkciólistája nem a v3 képességeit írja le.

## Adatvédelem

Az NPU a böngésződben fut, és semmilyen adatot nem küld saját szerverre. A
Rajtoló tervei és a beállítások helyben maradnak, jelszót a v3 nem tárol.

<details>
<summary>Mi történik a régi (2.x) adatokkal?</summary>

- A régi `neptun.users` GM-kulcsot (a korábbi bejelentkezési mentést) a v3 nem
  olvassa, nem importálja és nem törli.
- A v3 saját `data.users` adataiban maradt bejelentkezési és hitelesítési
  mezőket induláskor kitisztítja; a terveket és az egyéb nem érzékeny adatokat
  meghagyja.
- A régi `neptun.courses` értékéből csak biztonságos kulcsú, nem érzékeny
  kurzusválasztás kerülhet a `courses._legacy` részbe. A régi GM-forrásokat a
  program nem törli.

</details>

A jelszavadat mindig a Neptun saját oldalán add meg — sem a programnak, sem egy
hibabejelentésnek ne küldd el.

## Hibaelhárítás

<details>
<summary><strong>A script ott van a Tampermonkeyben, de az oldalon semmi nem változik</strong></summary>

Nézd meg, van-e `1`-es jelzés a Tampermonkey ikonján. Ha nincs, a script
telepítve van, de nem fut: Chrome és Edge alatt ellenőrizd a userscript-engedélyt
és a Neptun webhelyéhez adott hozzáférést ([2. lépés](#telepítés)).

</details>

<details>
<summary><strong>Van <code>1</code>-es jelzés, de nincs NPU-felirat vagy beállítási menü</strong></summary>

Töltsd újra az oldalt. Ha továbbra sem jelenik meg, valószínűleg indulási hiba
történt: nyiss hibajegyet, és csatold a böngésző fejlesztői konzoljában
megjelenő első piros NPU-hibát.

</details>

<details>
<summary><strong>Az NPU fut, de valamelyik funkció hiányzik</strong></summary>

Ez lehet intézményi eltérés. Nézd meg az [ellenőrzött intézmények
listáját](docs/TESTED.md), majd írd meg, pontosan melyik funkció nem működik.

</details>

<details>
<summary><strong>A Rajtoló nem indul</strong></summary>

Töltsd újra az oldalt bejelentkezett állapotban, majd állítsd össze újra a
tervet.

</details>

**Hibabejelentés** a [GitHub issue trackerben](https://github.com/varannaibence/npu/issues):
add meg a verziót (a lap alján olvasható), az intézményt, az oldalt és a
reprodukálás lépéseit. Képernyőkép jöhet, de jelszót, sütit, belépési tokent vagy
teljes hálózati exportot ne csatolj.

## Közösség és közreműködés

- **Kérdés, ötlet, intézményi tapasztalat:** [GitHub
  Discussions](https://github.com/varannaibence/npu-uj-neptunhoz/discussions)
- **Új funkció:** modulként, pull requestben — lásd
  [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).
- **Változásnapló:** [docs/CHANGELOG.md](docs/CHANGELOG.md)

## Szerzők és licenc

Az NPU eredeti szerzője Mate Solymosi; az új Neptun-felülethez készült v3-at
Varannai Bence írja.

[MIT License](LICENSE) — a program saját felelősségre használható.
