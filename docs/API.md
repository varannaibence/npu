# Neptun NG API-katalógus

Ez a fejlesztői katalógus a Neptun PowerUp! által olvasott vagy mért NG
endpointokat és a hozzájuk tartozó, maszkolt sémát rögzíti. A `[Mért]` jelölés
azt jelenti, hogy a kérést vagy a választ láttuk egy valódi, belépett példányon;
nem jelenti azt, hogy minden üzleti kimenetet (például sikeres tárgyfelvételt)
is láttunk. Az `[Ismeretlen]` adatot a kód nem találhatja ki: hiányos vagy új
formátumnál csendben leáll.

## Mérési határ

Az alapmérés 2026. szeptember 15-én történt egy belépett NG-példányon, a
`/hallgato_ng/` útvonalon. A későbbi, 2026. szeptember 16-i és 17-i méréseket a
címsor külön jelzi. A mért válaszok eltérő konfiguráció vagy API-verzió esetén
változhatnak. A példákban a személyes vagy munkamenet-adat helyén mindig
`<guid>`, `<numeric-term-id>` vagy más `<placeholder>` szerepel.

## Közös szerződés

Az API alapútvonala:

```text
/hallgato_ng/api/<Controller>/<Action>
```

A legtöbb válasz a következő burkot használja:

```json
{
  "data": "<payload vagy tömb>",
  "notification": []
}
```

A `notification[]` üzleti hibát is jelenthet, akár HTTP 500 mellett. HTTP 200
önmagában ezért nem bizonyít sikeres műveletet, és HTTP 500 sem jelenti azt,
hogy a választest érdektelen. A `request.*` és `sortAndPage.*` query-paraméterek
ASP.NET Core model bindinget követnek. A tárgylista kérésének
`request.termId` értéke a mért numerikus kérés-ID (`<numeric-term-id>`). Ettől
külön namespace a válaszsorok saját `termId` mezője, amely GUID-formájú lehet;
a Rajtoló `SubjectSignin` kérése ezt a válaszból származó GUID-ot használja. A
két értéket nem szabad felcserélni.

Az Angular a saját XHR-kéréseihez `Authorization` fejlécet és munkamenet-sütit
használ. A katalógus nem tartalmaz valódi fejlécet, sütit vagy tokent. Az NPU a
fejlécet az oldal saját kéréseiből veszi át; token-tárat nem olvas.

## Tárgyfelvétel

### `GET SubjectApplication/SchedulableSubjects` — [Mért]

**Használat:** a tárgyfelvételi lista és a tárgyazonosítók forrása.

```http
GET /hallgato_ng/api/SubjectApplication/SchedulableSubjects?
  request.termId=<numeric-term-id>&
  sortAndPage.firstRow=0&sortAndPage.lastRow=<row>&...
```

Ebben a kérésben a `<numeric-term-id>` kifejezetten a query
`request.termId` értéke. A válasz `"termId": "<term-guid>"` mezője másik,
GUID-formájú azonosító; az nem helyettesíthető be ebbe a kérésbe.

Az NPU a mért `SchedulableSubjects` kérés `sortAndPage.lastRow` ablakát
legfeljebb 500 sorra szélesíti, az első sort megtartva. Ismeretlen lapozott
endpointot nem ír át. A mért sorok fontosabb mezői:

```json
{
  "id": "<subject-guid>",
  "title": "<subject title>",
  "code": "<subject-code>",
  "credit": 0,
  "type": "<subject-type>",
  "termId": "<term-guid>",
  "curriculumTemplateId": "<guid>",
  "curriculumTemplateLineId": "<guid>",
  "isRegistered": false,
  "isCompleted": false,
  "isInProgress": false,
  "isWaiting": false,
  "scheduledSubjectId": "<guid-or-null>",
  "scheduledCourseIds": ["<guid>"]
}
```

Az `id` az NPU join-kulcsa; név vagy kód alapján nem azonosítunk tárgyat.
`scheduledCourseIds` a Neptun natív tervezőjének kurzusazonosító-forrása, de nem
a Rajtoló inputja. A `courseConflictHints` csak az itt ténylegesen megkapott
azonosítókat veti össze a kurzussorokkal. A tárgylistán élőben külön látszott
`isRegistered: true` felvett tárgy és natív tervezőhöz adott tárgy is, de az még
`[Ismeretlen]`, hogy minden felvett tárgy kitölti-e hozzá a
`scheduledCourseIds` mezőt. A kód ezért nem állít teljes órarendi lefedettséget.
A Rajtoló továbbra is a felhasználó által külön kijelölt saját tervet használja.

<a id="api-getsubjectscourses"></a>

### `GET SubjectApplication/GetSubjectsCourses` — [Mért]

**Használat:** egy tárgy kurzusai, férőhelye és órarendi adatai. Az NPU ezt a
végpontot nem járatja végig háttérben: a Neptun saját kérését
figyeli, amikor a hallgató lenyit egy tárgyat. A **Betelt kurzusok hátra**
kapcsoló csak a már betöltött kurzuslistát rendezi.

```http
GET /hallgato_ng/api/SubjectApplication/GetSubjectsCourses?
  subjectId=<subject-guid>&termId=<term-guid>&
  curriculumTemplateId=<guid>&curriculumTemplateLineId=<guid>
```

Mért kurzussor:

```json
{
  "id": "<course-guid>",
  "subjectId": "<subject-guid>",
  "code": "<course-code>",
  "type": "<group-label>",
  "isFull": false,
  "registeredStudentsCount": 0,
  "maxLimit": 0,
  "willBeOnWaitingList": false,
  "isRankingCourse": false,
  "classInstanceInfos": [
    {
      "dayOfWeek": 1,
      "dayOfWeekText": "<label>",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "rooms": "<room-or-empty>",
      "repetition": true
    }
  ]
}
```

`isFull` és `willBeOnWaitingList` külön állapot. Egy várólistás példában
`isFull: false, willBeOnWaitingList: true` értékkel engedélyezett a jelentkezés. A
rangsoros kurzusok éles jelentése és beküldési eredménye `[Ismeretlen]`.

### A kurzussor teljes mezőlistája — [Mért]

A fenti séma a használt mezőket sorolta. A teljes, élőben mért mezőlista ennél
sokkal bővebb; az alábbiak eddig kihasználatlanok voltak:

| Mező                                                                                 | Mit ad                                                                | Állapot                        |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | ------------------------------ |
| `isSigned`                                                                           | **igaz pontosan azokra a kurzusokra, amelyeket a hallgató felvett**   | használjuk (ütközés-alapvonal) |
| `isOnWaitingList`                                                                    | a hallgató várólistán van-e ezen a kurzuson                           | használjuk (Rajtoló-eredmény)  |
| `comparationTypeId`                                                                  | a kurzustípus GUID-ja (Labor és Elmélet külön érték)                  | használjuk (csoportkulcs)      |
| `room`                                                                               | kurzusszintű terem, a `classInstanceInfos[].rooms` mellett            | használjuk                     |
| `note`                                                                               | „Megjegyzés”; üres órarendnél ebből olvassuk ki a napot, időt, termet | használjuk (órarend-tartalék)  |
| `tutorName`, `language`, `title`, `description`                                      | a Neptun sora részben mutatja                                         | kihasználatlan                 |
| `waitingStudentsCount`, `minLimit`, `maxWaitingStrength`                             | várólista-hossz és alsó létszámhatár                                  | kihasználatlan                 |
| `rankPoint1`, `rankPoint2`, `rankOrder`, `expectedRankOrder`, `expectedRankingPoint` | rangsoros kurzusok pontjai                                            | kihasználatlan                 |
| `teachingMethod`, `teachingMethodId`, `isOnline`                                     | oktatási forma                                                        | kihasználatlan                 |
| `signinRequirementText`, `isNotStarted`, `isEndorsementRequired`                     | jelentkezési feltételek                                               | kihasználatlan                 |
| `classInstanceTimeTableList`                                                         | második órarendi forrás a `classInstanceInfos` mellett                | kihasználatlan                 |
| `typeIdentifier`                                                                     | megjelenítési érték, **nem** használható kulcsként                    | —                              |

**Fontos mérési tény:** a `SchedulableSubjects[].scheduledCourseIds` a Neptun natív
_tervezőjének_ listája, **nem** a felvett kurzusoké. A kód ezért nem következtet
felvett kurzusra ebből a mezőből, hanem a kurzussor `isSigned` / `isRegistered`
állapotát használja, amikor az elérhető.

A `classInstanceInfos[].rooms` mezőt a Neptun saját kurzussora nem mindig írja ki
— az NPU ezért a kurzuskód alá teszi, ha elérhető. A kód az egy- és többalkalmas
kurzusokat is kezeli, és csak akkor ír saját sort, ha a Neptunén felül tud mondani
valamit.

A `repetition` jelentése nem elég stabil ahhoz, hogy az ütközésvizsgálat döntést
építsen rá. A kód ezt a mezőt ezért szándékosan nem olvassa: egy téves riasztás
látható és javítható, egy elmaradt nem.

<a id="api-subjectsignin"></a>

### `POST SubjectApplication/SubjectSignin` — [Mért kérés, részben ismeretlen válasz]

**Használat:** a Rajtoló által küldött, soros tárgyjelentkezés.

```http
POST /hallgato_ng/api/SubjectApplication/SubjectSignin
Content-Type: application/json
Authorization: <Angular által látott fejléc>
```

```json
{
  "subjectId": "<subject-guid>",
  "termId": "<term-guid>",
  "curriculumTemplateId": "<guid>",
  "curriculumTemplateLineId": "<guid>",
  "courseIds": ["<course-guid>", "<course-guid>"]
}
```

Mért, zárt időszak alatti hiba:

```json
{
  "data": null,
  "notification": [{ "description": "Jelenleg nincs tárgyjelentkezési időszak!", "type": 3 }]
}
```

A sikeres választest és a valóban betelt, nem várólistás elutasítás teljes
formája `[Ismeretlen]`, mert ezeket csak éles tárgyfelvételi időszakban lehet
felelősen mérni. A Rajtoló ismeretlen vagy időtúllépéses válasznál megáll, nem
könyvel találgatott sikert, és a már elküldött kérést nem próbálja visszavonni.

### `GET SubjectApplication/ScheduledSubjectsWithScheduledCourses` — [Mért]

**Használat:** a fejléc és a Rajtoló kredit-előrejelzésének forrása.

```http
GET /hallgato_ng/api/SubjectApplication/ScheduledSubjectsWithScheduledCourses?
  request.termId=<numeric-term-id>&request.withRegisteredSubjects=true
```

A `<numeric-term-id>` itt is a tárgylista kéréséből átvett numerikus
`request.termId`; a válasz tárgysorának GUID-formájú `termId` mezője nem erre a
paraméterre való.

A válasz felvett és pusztán tervezett tárgyakat is tartalmazhat. Kreditet csak
`isRegistered: true` sorból számolunk. Ha a `type` hiányzik, az NPU a megjelenítés
kedvéért „Szabadon választható” csoportba teszi; ez NPU-következtetés, nem a
szerver által garantált tárgytípus.

### `GET SubjectApplication/GetScheduledCourses` — [Mért]

**Használat:** a Neptun saját, szűrésfüggetlen órarendi válaszának figyelése. A kérés
intézményi és verziófüggően oldalbetöltéskor vagy csak az Órarendtervező panel
megnyitásakor mehet ki. Az NPU először az alkalmazás saját válaszát figyeli; ha a
félév numerikus ID-ja már ismert, de rövid időn belül nincs válasz, a
`registrationData` legfeljebb egy késleltetett, ugyanazon originű fallback GET-et
indít. A minta nem bizonyítja, hogy az endpoint tervezett vagy várólistás sorokat
is visszaad.

```http
GET /hallgato_ng/api/SubjectApplication/GetScheduledCourses?
  request.termId=<numeric-term-id>
```

**Válasz:** `{ "data": [ ...kurzussorok... ], "notification": [] }`

Mért kurzussor mezői: `subjectId`, `id` (kurzusazonosító), `type`, `typeIdentifier`, `code`, `tutorName`, `title` (a TÁRGY neve), `language`, `waitingStudentsCount`, `maxLimit`, `registeredStudentsCount`, `strength`, `classInstanceInfos[]`, `classInstanceTimeTableList[]`, `scheduledSubjectId`, `scheduledCourseId`, `comparationTypeId`, `isSigned`, `isFull`, `willBeOnWaitingList`, `isOnWaitingList`, `signinRequirementText`, `isNotStarted`, `isEndorsementRequired`, `minLimit`, `rankPoint1`, `rankPoint2`, `rankOrder`, `teachingMethodId`, `teachingMethod`, `room`, `isRankingCourse`, `maxWaitingStrength`, `indexLineId`, `isRegistered`, `termId`, `curriculumTemplateId`, `curriculumTemplateLineId`, `note`, `description`, `subjectCredit`, `expectedRankOrder`.

**Mért tények:**

- A `classInstanceInfos[]` alakja **pontosan azonos** a `GetSubjectsCourses`-éval: `{ startTime, endTime, dayOfWeek, dayOfWeekText, rooms, repetition }`. Az ott alkalmazott `normaliseSlot` változtatás nélkül ráhúzható.
- A sor `termId` mezője **GUID** (`<term-guid>`), **nem** a kérés numerikus `request.termId` paramétere (ugyanaz a csapda, mint `SchedulableSubjects`-nél).
- A `classInstanceTimeTableList[]` konkrét dátumokat ad (`substituteDate`, `fromTime`, `toTime`).
  Ez ma kihasználatlan.

#### Felvett / Tervezőben / Várólistán — [Mért, részben ismeretlen]

A kód az `isRegistered`, `isSigned`, `isOnWaitingList`, `scheduledSubjectId` és
`scheduledCourseId` mezőket külön kezeli. A hiányzó vagy ismeretlen állapotot nem
alakítja automatikusan felvett, tervezett vagy várólistás státusszá.

**Mért:**

- Az `isRegistered: true` és `isSigned: true` együtt jelölheti a felvett
  állapotot. A kód ezt használja a felvett kurzusok felismeréséhez és az
  ütközésjelzés szűréséhez, ha a válasz ezt az alakot adja.

**Még nem mért állapotok:**

- A „tervezőben” kurzusok: létezik a `scheduledSubjectId` / `scheduledCourseId` mező,
  de eltérő válaszalak esetén a pontos jelentés külön ellenőrzendő. [Ismeretlen]
- A „várólistán” kurzusok: az `isOnWaitingList` mező külön állapotot ad, amelyet
  nem szabad `isFull`-ból vagy férőhelyszámokból kikövetkeztetni. [Ismeretlen]
- `willBeOnWaitingList`: **ELŐREJELZÉS** egy új jelentkezésre, nem aktuális állapot. A mért mintában három sor `willBeOnWaitingList: true` volt, miközben `isRegistered: true` — ezt soha nem szabad állapotnak használni.

**Szükséges további mérés:** olyan mintában, ahol a hallgatónak van tervezőbe tett kurzusa és/vagy várólistás kurzusa, hogy az `isRegistered`, `scheduledSubjectId` / `scheduledCourseId`, illetve `isOnWaitingList` mezők tényleges értékei nyilvánvalóak legyenek. A kód csak az egyértelműen jelölt `isRegistered` vagy `isSigned` sorokat kezeli felvettként.

### `GET Periods/GetPeriods` — [Mért kérés és időpontmezők]

**Használat:** a Rajtoló időszakválasztója. Az endpointot a tárgyfelvételi
oldal nem minden esetben kéri magától; a Rajtoló a tervező megnyitásakor, aktív
sessionnel kéri le.

```http
GET /hallgato_ng/api/Periods/GetPeriods?
  request.termId=<term-guid>&sortAndPage.firstRow=0&
  sortAndPage.lastRow=500&sortAndPage.fromDate=asc
```

```json
{
  "periodId": "<period-guid>",
  "periodName": "<period-name>",
  "periodType": "<period-type>",
  "fromDate": "YYYY-MM-DDTHH:MM:SS",
  "toDate": "YYYY-MM-DDTHH:MM:SS",
  "termName": "<term-name>"
}
```

A dátum a mért példányban helyi falióraidő, timezone-suffix nélkül. A Rajtoló
nem a `periodName` alapján választ automatikusan; a felhasználó választ a listából.

## Hitelesítés és munkamenet

### `POST Account/Authenticate` — [Mért flow, v3-ban nem használja automatikus login]

A login form mért mezői `userName` és `password`; a tényleges értékek és a
teljes request-body szándékosan nincsenek dokumentálva. A mért folyamat első
válasza `202 Accepted` és `isTwoFactorRequired: true`, majd a 2FA-lépés után
teljesül a munkamenet. A válasz `neptunCode` és `sessionTimeoutInMinutes`
mezője a kód számára releváns lehet.

Az `autoLogin` v3-ból szándékosan kimarad 2FA, karbantarthatóság és a jelszó
helyi tárolásának biztonsági kockázata miatt. Ez az endpoint tehát katalógusba
vett mérés, nem v3-funkció.

### `UserInfo` — [Metódus és válaszséma ismeretlen]

**HTTP-metódus:** ismeretlen (nem mérve). **Válaszséma:** ismeretlen (nem
mérve).

Az NPU figyeli az `UserInfo` nevű alkalmazáskérést, és ha annak válaszában
előfordul egy nem üres `neptunCode`, azt használja a felhasználó- és
domain-alapú helyi tárolási kulcshoz. A jelenlegi mérés nem rögzítette biztosan
az HTTP-metódust, a teljes envelope-t vagy a mező pontos útját; ezekre itt nem
állítunk `GET`/`POST` szerződést. Hiányzó vagy null értéknél nincs találgatás.

<a id="api-getnewtokens"></a>

### `POST Account/GetNewTokens` — [Mért]

```http
POST /hallgato_ng/api/Account/GetNewTokens
Content-Type: application/json
Authorization: <Angular által látott fejléc>

{}
```

A mért válaszban `accessToken` és `sessionTimeoutInMinutes` szerepel. A token
értéke soha nem kerül forrásba vagy naplóba. Az `infiniteSession` csak közeli
lejárat és friss felhasználói aktivitás mellett indít egy ilyen kérést; tétlen
lapot nem tart életben vak háttérforgalommal.

## Korábbi mintatantervi mérés és további útvonalak

<a id="api-getstudentcurriculumtemplates"></a>

### `GET Advancement/GetStudentCurriculumTemplates` — [Korábbi mérés, részleges séma]

**Státusz:** korábbi, csak olvasható mérés. A kísérleti mintatantervi
hiány-nézetet eltávolítottuk, ezért a v3 runtime nem indít ilyen kérést. A
mért kérésnek nincs query-paramétere:

```http
GET /hallgato_ng/api/Advancement/GetStudentCurriculumTemplates
```

A korábbi válasz `data[]` soraiban numerikus `curriculumTemplateId` és
`advancementRowId` mezőket láttunk. A név, kód és az egyedi aktuális-jelző csak
akkor használható, ha a felület megjeleníti vagy kiválasztja őket; a teljes
sablonlista-séma nincs igazolva.

```json
{
  "data": [
    {
      "curriculumTemplateId": 0,
      "advancementRowId": 0,
      "name": "<template-name>",
      "code": "<template-code>",
      "isCurrent": false
    }
  ],
  "notification": []
}
```

Az `isCurrentTraining` mező jelenlétét nem tekintjük mért szerződésnek.

<a id="api-getstudenthierarchicaladvancements"></a>

### `GET Curriculum/GetStudentHierarchicalAdvancements` — [Korábbi mérés, szigorúan részleges séma]

Ez egy korábban felmért, csak olvasható válaszséma. A v3 runtime jelenleg nem
használja; a következő mezők kizárólag referenciaértékűek:

```http
GET /hallgato_ng/api/Curriculum/GetStudentHierarchicalAdvancements?
  request.curriculumTemplateId=<numeric-template-id>&sortModel.name=asc
```

A `<numeric-template-id>` a sablonlista numerikus `curriculumTemplateId`
értéke. Nem azonos a tárgylista sorainak GUID-formájú
`curriculumTemplateId` mezőjével.

```json
{
  "data": [
    {
      "curriculumTemplateLineId": "<guid>",
      "name": "<group-name>",
      "signupType": "<type>",
      "curriculumStatuses": {
        "isSuccessful": false,
        "isOverachieved": false,
        "isStarted": false,
        "isTakenInCurrentSemester": false,
        "isTakenInNextSemester": false
      },
      "mandatorySubjects": [
        {
          "subjectId": "<subject-guid>",
          "name": "<subject-name>",
          "code": "<subject-code>",
          "credit": 0,
          "recommendedTerm": 0,
          "curriculumTemplateLineId": "<guid>",
          "curriculumStatuses": {
            "isSuccessful": false,
            "isOverachieved": false,
            "isStarted": false,
            "isTakenInCurrentSemester": false,
            "isTakenInNextSemester": false
          }
        }
      ],
      "childSubjectGroups": []
    }
  ],
  "notification": []
}
```

Ismeretlen státusz-, csoport- vagy tárgyformánál a v3 nem rajzol bizonyított
mintatantervi hiányt. Ezek a mezők csak a korábbi mérés referenciái, a v3 jelenleg
nem használja ezt az útvonalat.

### Vizsgák — [Endpoint mért, sor-séma ismeretlen]

Az alábbi kéréseket láttuk, de érvényes vizsgajelentkezési időszakban nem volt
használható sorlista:

```text
GET /hallgato_ng/api/Exam/GetTerms
GET /hallgato_ng/api/ExamRegistration/GetExamsList
GET /hallgato_ng/api/ExamOverview/GetAvailableExamsCount
```

Az `data: []` üres válasz nem bizonyítja a sor-séma kompatibilitását. A v3-ban
nincs ezekre épülő vizsgamodul.

### Feladatok — [Endpoint mért, határidő-séma ismeretlen]

```text
GET /hallgato_ng/api/Tasks/GetDashboardExpiringTasksData
GET /hallgato_ng/api/Tasks/GetDashboardTasksData
```

A mért dashboardon nem volt aktuális, jövőbeli határidős minta. Dátum- és
időzóna-jelentés nélkül a v3 nem mutat visszaszámlálót.

### Már felvett kurzusok — a szűrésfüggetlen órarendi mérés

```text
GET /hallgato_ng/api/SubjectApplication/GetScheduledCourses
GET /hallgato_ng/api/RegisteredCourses/GetRegisteredCourses
```

A `GetScheduledCourses` kérést a Neptun saját oldala vagy az Órarendtervező
panel indíthatja; az interceptor ezt a választ figyeli. Ha egy példány rövid időn
belül nem küldi el, a `registrationData` a már ismert félév-ID-val legfeljebb egy
késleltetett, ugyanazon originű fallback GET-et indít. A válasz alakja alapján
felvett-órarendi alapvonal építhető, de a végpont más állapotokban való viselkedése,
illetve a tervezett és várólistás sorok visszaadása külön ellenőrzendő.

Ez azért fontos, mert a régi, csak `GetSubjectsCourses`-ra épülő útvonal az
aktuális szűrésen kívüli felvett tárgyakat nem látta. A `GetScheduledCourses`
válasza a mért mintában ilyen tárgyak órarendjét is elérhetővé tette az
ütközésjelzés alapvonalához.

A `RegisteredCourses/GetRegisteredCourses` endpoint továbbra is létezik az API-ban,
de a tárgyfelvételi oldal nem indítja. A v3 a mért `GetScheduledCourses` választ
használja a felvett kurzusok szűrésére.

## Kapcsolódó dokumentumok

- Felhasználói útmutató: [README.md](../README.md)
- Fejlesztői setup és release: [DEVELOPMENT.md](DEVELOPMENT.md)
