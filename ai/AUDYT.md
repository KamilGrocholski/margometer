# Audyt — 2026‑07‑31

Migawka **wyłącznie otwartych** spraw, zebrana zaraz po rundzie napraw
z 2026‑07‑30 (`19892b4`). Tamta runda sprawdzała **archiwum, odtwarzanie i podgląd** —
kod, który wtedy powstał. Ten audyt patrzy na resztę: nagrywarkę, kontrakt
danych, informację zwrotną panelu, dostępność, testy.

Czego tu NIE ma: rzeczy, które działają. Naprawione `A7`–`A15` i `§4.x` zostają
tam, gdzie są — po opis „co było źle” idzie się do `UX-POPRAWKI.md` i `SOLID.md`.

**Własna przestrzeń ID.** `AUDYT‑1`…`AUDYT‑24` żyją tylko w tym pliku. Każdy wpis
kończy się linią `**Docelowo.**` mówiącą, gdzie ma trafić po decyzji — to
propozycja, nie wykonane przeniesienie. Dopóki tam nie trafi, ten plik jest
jedynym miejscem, gdzie sprawa jest zapisana.

**Uwaga na numery linii.** `SOLID.md` mówi „`overlay.ts`: 2456 linii, 69 metod”
— dziś jest **2628 linii i 60 składowych**. Rozjazd o ~170 linii znaczy, że
cytowania z tamtego dokumentu trzeba przed użyciem sprawdzić. Wszystkie
lokalizacje poniżej zweryfikowano odczytem na `19892b4`.

Legenda: 🔴 duży zwrot / mała robota · 🟡 warto · ⚪ kiedyś.
Koszt: XS / S / M / L. Znacznik ✓ = teza **zreprodukowana albo zmierzona**
podczas tego audytu, nie wywnioskowana z lektury.

**Stan na 2026‑07‑31:** pierwsza partia (`AUDYT‑1`, `2`, `4`, `20`, `21`) jest
naprawiona. Opisy zostają w czasie teraźniejszym, bo opisują STAN SPRZED
naprawy — tak czyta się je najłatwiej przy kolejnej regresji w tym samym
miejscu. Co faktycznie zrobiono, mówi linia `**Zrobione.**`; tam, gdzie
wykonanie odbiegło od propozycji, jest to powiedziane wprost.

---

## 0. Skrót — kolejność prac

Najpierw nagrywarka i osłony, bo to jedyne miejsca, gdzie tracimy DANE albo
uderzamy w grę. Potem dwie rzeczy odblokowujące większe roboty. Reszta wg zwrotu.

| # | Rzecz | | Koszt | ✓ |
|---|---|---|---|---|
| ~~AUDYT‑1~~ | Osierocone nagrania zjadają quotę GRY | 🔴 | S | **✅** |
| ~~AUDYT‑2~~ | Nagrywanie wraca włączone po awarii braku miejsca | 🔴 | S | **✅** |
| ~~AUDYT‑4~~ | Sesja i nagrywarka inaczej liczą duplikat nagłówka | 🔴 | S | **✅** |
| ~~AUDYT‑20~~ | Linia otwierająca w czterech kopiach | 🔴 | XS | **✅** |
| ~~AUDYT‑21~~ | Gorąca ścieżka bez osłony i w złej kolejności | 🔴 | XS | **✅** |
| AUDYT‑5 | `BattleStats` jeden dla walki i sesji — mina pod zakładkę | 🔴 | S | ✓ |
| AUDYT‑14 | Odznaka literowa profesji nie istnieje | 🔴 | M | ✓ |
| AUDYT‑3 | 21 kB indeksu przepisywane przy każdej linii logu | 🟡 | S | ✓ |
| AUDYT‑6 | Suma sesji bez wyjścia w UI | 🟡 | M | ✓ |
| AUDYT‑8 | Kopiowanie melduje sukces, którego nie było | 🟡 | S | |
| AUDYT‑9 | „wyczyść”: potwierdzenie wygasa niewidocznie | 🟡 | S | |
| AUDYT‑10 | „na pewno?” w archiwum nie wygasa wcale | 🟡 | S | |
| AUDYT‑11 | ⧉ kopiuje co innego, niż widać | 🟡 | S | |
| AUDYT‑12 | Zwinięcie w podglądzie gubi ślad, że to nie walka na żywo | 🟡 | S | |
| AUDYT‑13 | Kliknięcia bez odpowiedzi | 🟡 | S | |
| AUDYT‑15 | Cztery reguły `:focus-visible` są martwe | 🟡 | M | ✓ |
| AUDYT‑16 | Ustawienia widoku giną po F5, geometria przeżywa | 🟡 | S | ✓ |
| AUDYT‑23 | Nieograniczone `archived` i `summaries` | 🟡 | S | ✓ |
| AUDYT‑24 | Brak `stats.test.ts` i `session.test.ts`; brak lintera | 🟡 | M | ✓ |
| AUDYT‑7 | `unattributedHealing` liczone i nigdy niepokazane | 🟡 | XS | ✓ |
| AUDYT‑17 | Wielkie/małe litery i puste stany bez odmiany | ⚪ | S | |
| AUDYT‑18 | ✕ znaczy dwie rzeczy; dymek obiecuje nie to, co trzeba | ⚪ | S | |
| AUDYT‑19 | PPM zabiera menu przeglądarki nad listą archiwum | ⚪ | XS | |
| AUDYT‑22 | `destroy()` nie sprząta i nie jest wołane | ⚪ | XS | ✓ |

---

## A. Nagrywanie i magazyn

Cztery usterki, których poprzednia runda nie dotknęła, bo patrzyła na archiwum
(okno), nie na nagrywarkę (magazyn). Wszystkie cztery zreprodukowane.

### AUDYT‑1 — Osierocone nagrania zjadają quotę GRY 🔴 S — ✅ NAPRAWIONE 2026‑07‑31
`src/recorder.ts:412` (`loadIndex`), `:278` (`clear`), `:358` (`evict`)

**Problem.** `loadIndex()` przy `v !== 1`, niepoprawnym JSON‑ie albo `fights`
nie‑tablicy zwraca `fresh()` — pusty indeks. Ale **klucze `margometer.rec.N`
z tekstami zostają w `localStorage` na zawsze**: `clear()` iteruje po indeksie,
więc ich nie widzi, `chars()` raportuje 0, a `evict()` uważa, że jest miejsce.

To uderza dokładnie w cel, dla którego moduł istnieje (`recorder.ts:10-15`):
magazyn dzielimy z grą, a `QuotaExceededError` poleciałby GRZE, nie nam. Do
500 tys. znaków (~1 MB w UTF‑16) znika z kubełka bez śladu, a nasz własny licznik
pokazuje zero. Wyzwalaczem jest cokolwiek, co uszkodzi jeden klucz: własna
przyszła wersja formatu, obcy skrypt, przerwany zapis.

**Repro.**
```
klucze przed : margometer.rec.on, margometer.rec.1, margometer.rec.index, margometer.rec.2
(indeks podmieniony na {v:2})
po wczytaniu : count=0 chars=0
po clear()   : margometer.rec.on, margometer.rec.1, margometer.rec.index, margometer.rec.2
```

**Propozycja.** Przy `fresh()` przeczesać magazyn po prefiksie `margometer.rec.`
i usunąć klucze, których nie ma w indeksie. Wymaga rozszerzenia `RecorderStorage`
(`:59`) o `key`/`length` — to jedyna ruszona granica. **Koszt S.**

**Zrobione.** `sweepOrphans()` przeczesuje magazyn po prefiksie i kasuje klucze
spoza indeksu — przy pustym indeksie, przy wpisie odrzuconym przez `isRecording`
i przy `clear()`, żeby „wyczyść” znaczyło wyczyść. `key`/`length` doszły do
`RecorderStorage` jako OPCJONALNE: magazyn bez przeglądania kluczy ma nie
sprzątać, a nie się wywracać.

**Docelowo.** → `SOLID.md` jako `§4.26`

### AUDYT‑2 — Nagrywanie wraca włączone po awarii braku miejsca 🔴 S — ✅ NAPRAWIONE 2026‑07‑31
`src/recorder.ts:398` (`write`), `:192` (konstruktor), `:220` (`toggle`)

**Problem.** Gdy magazyn odmówi mimo zwolnienia wszystkiego, `write()` ustawia
`this.failed = true` i `this.on = false` — ale **nie zapisuje `FLAG_KEY = "0"`**;
zapis flagi żyje wyłącznie w `toggle()`. Po odświeżeniu konstruktor czyta `"1"`
i nagrywanie wraca WŁĄCZONE, a `failed` (nieutrwalone) gaśnie razem z czerwonym
paskiem „Brak miejsca w przeglądarce”. Użytkownik dostał komunikat, zrobił F5
i komunikat zniknął — przy niezmienionym stanie magazynu.

Ta sama dziura po `clear()` (`:278`): `failed` wraca na `false`, `on` zostaje
`false`, a flaga w magazynie dalej mówi `"1"`.

**Repro.**
```
po awarii    : isRecording=false isFailed=true flaga w storage=1
po F5        : isRecording=true  isFailed=false
```

**Propozycja.** Wygaszenie nagrywania to zdarzenie trwałe — zapisać `"0"` w tym
samym miejscu, gdzie ustawiamy `on = false`. Osobno rozważyć utrwalenie `failed`,
żeby komunikat przeżył odświeżenie. **Koszt S.**

**Zrobione, INACZEJ niż w propozycji.** Zapis `"0"` nie wystarcza: przy naprawdę
pełnym magazynie pada tak samo jak zapis, który nas tu przywiódł — test na to
wszedł i od razu zaświecił. Wygaszenie KASUJE znacznik: brak klucza czyta się
tak samo (`getItem(...) === "1"`), a kasowanie zwalnia miejsce zamiast go
potrzebować. Utrwalenia `failed` nie zrobiono — komunikat nadal znika po F5,
choć nagrywanie zostaje wyłączone.

**Docelowo.** → `SOLID.md` jako `§4.27`, wraz z uwagą UX o znikającym komunikacie

### AUDYT‑3 — Cały indeks przepisywany przy KAŻDEJ zmianie logu 🟡 S — nagrywanie ✓
`src/recorder.ts:354` (`save`), kontra komentarz `:323`

**Problem.** `save()` kończy się bezwarunkowym `write(INDEX_KEY,
JSON.stringify(this.index), id)`. Komentarz `:323-324` uzasadnia klucz‑na‑walkę
dla TEKSTU („inaczej każda nowa linia logu przepisywałaby całe archiwum,
synchronicznie, w wątku gry”) — ale indeks wymyka się temu rozumowaniu i robi
dokładnie to, przed czym komentarz ostrzega.

Przy udokumentowanej pojemności 190 nagrań (`:27`) indeks waży **20 821 znaków**.
Tyle leci przez `JSON.stringify` + `setItem` przy każdej zmianie tekstu walki,
czyli kilka razy na sekundę w środku walki, synchronicznie w wątku gry.

**Repro.** `indeks 190 nagrań: 20821 znaków przepisywanych przy KAŻDYM zapisie`

**Propozycja.** Wpis indeksu zmienia się merytorycznie tylko przy nowym `id`
albo eksmisji — samo `chars` rosnące o kilkanaście znaków nie wymaga zapisu
natychmiast. Zapisywać indeks przy zmianie KSZTAŁTU listy, a rozmiar domykać
z opóźnieniem albo przy wygaszeniu nagrywania. **Koszt S.**

**Docelowo.** → `SOLID.md` jako `§4.28`

### AUDYT‑4 — Sesja i nagrywarka inaczej rozstrzygają duplikat nagłówka 🔴 S — ✅ NAPRAWIONE 2026‑07‑31
`src/recorder.ts:80` (`splitLines`) vs `src/session.ts:106` (`splitFights`)

**Problem.** Oba miejsca odpowiadają na to samo pytanie — „czy powtórzony
nagłówek zaczyna drugą walkę?” — i mają **ten sam docstring, słowo w słowo**
(`recorder.ts:116-122`, `session.ts:221-227`). Ale dowód mają inny:

- sesja porównuje `participantsKey`, czyli SKŁAD odczytany przez parser — a więc
  po `normalize()`, które zdejmuje bbcode i zwija białe znaki (`parser.ts:187`);
- nagrywarka porównuje `previous[0].trim() === line.trim()` na SUROWYM tekście.

Wystarczy więc, że gra rozjedzie bbcode albo zmieni odstęp, i dowody się
rozchodzą. To nie jest przypadek wymyślony — `parser.ts:184-186` mówi wprost:
„Znaczniki bbcode potrafią się rozjechać na dwie linie (otwarcie przy treści,
zamknięcie samotnie niżej)”, a `source.ts:100-102` potwierdza, że gra pogrubia
linię otwierającą.

Skutek: **panel pokazuje jedną walkę, archiwum zapisuje dwie** — druga
śmieciowa (sam nagłówek plus `[/b]`), zjadająca `id` i budżet. `§4.14` opisano
jako naprawione; naprawa zamknęła jeden przypadek, nie klasę.

**Repro.**
```
ROZJAZD | sesja: 1 | nagrywarka: 2 | bbcode rozjechany (samotne [/b])
ROZJAZD | sesja: 1 | nagrywarka: 2 | ten sam skład, inne odstępy
```

**Propozycja.** Nie scalać `splitLines` z `splitFights` — rozdział poziomów
(tekst vs zdarzenia) jest słuszny i uzasadniony w `recorder.ts:61-67`: nagranie
ma być DOKŁADNIE tym, co widział parser. Scalić należy **dowód**: jeden predykat
„to powtórzony nagłówek”, wołany po obu stronach na znormalizowanej linii, a nie
raz po `normalize()`, raz po `trim()`. **Koszt S.**

**Zrobione.** `canonicalLine()` wyeksportowane z parsera i użyte po obu stronach.
Nagranie zostaje SUROWE — normalizacja dotyczy wyłącznie porównania. Trzy testy
pilnują teraz obu przypadków z repro plus tego, że nagłówek INNEGO składu nadal
otwiera drugą walkę.

**Docelowo.** → `SOLID.md` jako `§4.29`; przy okazji dopisać do `§4.14`, że
klasa została zamknięta dopiero tutaj

---

## B. Kontrakt danych — walka vs sesja

Trzy pozycje jednego wątku: sumowanie sesji jest gotowe i poprawne, a mimo to
niewidoczne — i w dniu, w którym stanie się widoczne, skłamie po cichu.

### AUDYT‑5 — `BattleStats` jest jednym typem dla walki i dla sesji 🔴 S — typy ✓
`src/stats.ts:340` (`BattleStats`), `src/session.ts:170` (`mergeStats`),
`src/overlay.ts:988`, `:476` (`turnsFor`)

**Problem.** `mergeStats` zwraca puste `timeline`, `deaths` i `matrix`, i robi to
SŁUSZNIE — uzasadnienie w `session.ts:177-179` jest trafne („tura 3 z jednej
walki nie jest turą 3 z drugiej”). Rzecz w tym, że ta decyzja jest zapisana
w WARTOŚCI, nie w TYPIE: `BattleStats` obiecuje `timeline: TurnSlice[]` bez
żadnej adnotacji, a jedyne, co jej pilnuje, to test `overlay.test.ts:2573`.

Dziś nie boli, bo panel nigdy nie renderuje sesji — i to jest mina, nie
bezpieczeństwo. W dniu powstania zakładki zakresu `render(sessionStats, …)`
ustawi `fightTurns = timeline.length = 0` (`overlay.ts:988`), a `turnsFor`
(`:476`) zwraca `fightTurns` dla przyjętych i leczenia, `actor.turns` dla
zadanych. Tryb „na turę” **wyzeruje więc Otrzymane i Leczenie, zostawiając
poprawne Zadane**. Rozjazd selektywny, bez wyjątku, bez ostrzeżenia — najgorszy
możliwy kształt awarii.

**Propozycja.** Rozbić typ tak, żeby kompilator odmówił zrobienia zakładki „na
skróty”:
```ts
type Aggregate    = { actors; unattributed…; ambiguousNames; unknownLines; unknownElements };
type FightStats   = Aggregate & { timeline: TurnSlice[]; deaths: Death[]; matrix: DamageEdge[] };
type SessionStats = Aggregate;
```
`mergeStats` zwraca `SessionStats`, pierwszy argument `Overlay.render` to
`FightStats`. **Koszt S.** Przy okazji: `EMPTY_STATS` (`session.ts:187`) to
eksportowany MUTOWALNY singleton używany w czterech miejscach jako stan startowy
— `Object.freeze` nie kosztuje nic. Mieszka też w złym module: `overlay.ts`
importuje z `session.ts` zero dla typu należącego do `stats.ts`.

**Docelowo.** → `SOLID.md` jako `§5` (mapowanie) + nowy refaktor `R9`; jest
warunkiem wejścia dla AUDYT‑6

### AUDYT‑6 — Suma sesji nie ma żadnego wyjścia w UI 🟡 M — brak specu ✓
`src/overlay.ts:1378` (`statsJson`), `:975-990`, `src/session.ts:299` (`total`),
`ai/ROADMAP.md:52`

**Problem.** `mergeStats` to ~100 linii, które sumują wszystko, co ma sens
sumować: rozbicia, procki, `abilityUses`, `takenFromBy`, `dealtToBy`,
`typeByLabel`, plus `unknownLines`, `ambiguousNames` i truciznę bez sprawcy.
`Session.total()` liczy to leniwie i poprawnie. **Jedyne wyjście do użytkownika
to JSON w schowku** — a `aria-label` przycisku mówi tylko „Kopiuj statystyki
(JSON)”, więc nawet nie wiadomo, że sesja tam jest.

Co użytkownik przez to traci: nie odpowie na pytania, do których licznik obrażeń
służy MIĘDZY walkami — łączne obrażenia z godziny grindu, sumaryczna skuteczność
umiejętności, łączne kryty i uniki, procki sprzętu (jedyne miejsce, gdzie
kilkanaście walk daje sensowną próbkę). Wszystko zeruje się przy każdej linii
otwierającej, a obejściem jest skopiowanie JSON‑a i czytanie go poza grą.

**Skąd luka.** To nie jest przeoczenie, tylko funkcja porzucona w połowie:
sygnatura `render(fight, session)` przyjmuje sesję od zawsze (`index.ts:36`),
komentarz w `render()` mówi wprost „nie ma dziś zakładki, która by ją pokazała”,
a `ROADMAP.md` trzyma to jako `⏸`. Brakuje nie kodu, tylko **decyzji
projektowej** — i tu jest prawdziwa dziura: **`UX.md` nie zawiera słowa „sesja”
ani razu**. Nie ma specu, co ta zakładka miałaby robić.

**Propozycja.** Zanim cokolwiek się narysuje, rozstrzygnąć trzy rzeczy i zapisać
je w `UX.md` jako nową sekcję §8 „Zakres — ta walka / sesja”:
1. gdzie żyje przełącznik, żeby nie złamać zakazu „trzeciego rzędu zakładek”
   (`UX.md §6`) — kandydat: przy nazwie w nagłówku, nie w rzędzie metryk;
2. co znaczy „na turę” w skali sesji (patrz AUDYT‑5 — dziś: nic);
3. co się dzieje z osią tur, zgonami i macierzą, których sesja nie ma —
   zakładka je chowa czy pokazuje puste.
**Koszt M**, z czego kod to mniejsza część.

**Docelowo.** → nowa sekcja `§8` w `UX.md` (spec) + `ROADMAP.md` zdejmuje `⏸`
dopiero po niej

### AUDYT‑7 — `unattributedHealing` liczone, sumowane i nigdy niepokazane 🟡 XS ✓
`src/stats.ts:798`, `src/session.ts:166`; **zero odwołań w `overlay.ts`**

**Problem.** Leczenie, którego nie dało się przypisać, jest liczone w agregacie,
przenoszone przez `BattleStats` i sumowane przez sesję — po czym przepada. Jego
bliźniak od trucizny (`unattributedDotDamage`) ma pełny przypis w stopce, który
podąża nawet za filtrem składu i za wejściem w postać (`overlay.ts:2478-2507`).

To ostatni licznik „nieprzypisanego”, który nie ma przypisu — czyli jedyne
miejsce, gdzie panel po cichu gubi liczbę, zamiast się do niej przyznać. Przy
zasadzie „nieznane jest głośne”, którą repo trzyma od `d21781d`, to wyłom.

**Propozycja.** Przypis w stopce obok trucizny, tą samą ścieżką. **Koszt XS.**

**Docelowo.** → `UX-POPRAWKI.md` jako `A16`

---

## C. Panel — informacja zwrotna i stany

Wspólny mianownik: panel robi coś (albo nie robi) i nie mówi o tym. Sześć
przypadków, w tym dwa, które MELDUJĄ SUKCES, którego nie było.

### AUDYT‑8 — Kopiowanie melduje sukces, którego nie było 🟡 S
`src/overlay.ts:682` (`writeClipboard`), `:1391` (`copy`), `:1346`

**Problem.** `document.execCommand("copy")` przy porażce **zwraca `false`, nie
rzuca** — a wartość zwracana jest ignorowana. `copy()` opakowuje wywołanie
w `try/catch`, więc łapie tylko awarię ścieżki `navigator.clipboard`; ścieżka
zapasowa nie ma jak zgłosić porażki i „✓” miga zawsze.

Drugi przypadek w tym samym miejscu: `copy("copy-logs", recorder.dump() ?? "")`.
Gdy `dump()` zwróci `null` (klucze zniknęły spod indeksu — patrz AUDYT‑1), do
schowka leci PUSTY STRING, też z „✓”. Użytkownik wkleja pustkę i dowiaduje się
o tym poza grą.

**Propozycja.** Czytać wynik `execCommand` i przekazywać go wyżej; przy `null`
z `dump()` pokazać „✕”, tak jak przy złapanym wyjątku. **Koszt S.**

**Docelowo.** → `UX-POPRAWKI.md` jako `A17`

### AUDYT‑9 — „wyczyść”: potwierdzenie wygasa NIEWIDOCZNIE 🟡 S
`src/overlay.ts:694` (`CONFIRM_MS`), `:1757` (`confirmingClear`), `:1355`

**Problem.** Pytanie „na pewno?” wygasa po 5 s — słusznie, bo kasowania nie da
się cofnąć (uzasadnienie w docstringu `:1758-1761`). Ale wygaśnięcie jest czysto
obliczeniowe: **nic nie przerysowuje panelu**, więc napis „na pewno?” zostaje na
przycisku. Kolejny klik trafia w `!this.confirmingClear()`, czyli **cicho uzbraja
pytanie od nowa** i wychodzi przez `return` — z ekranu nic się nie zmienia.

Użytkownik widzi przycisk „na pewno?”, klika, nie dzieje się nic. Klika drugi
raz — i dopiero wtedy kasuje. Przycisk wygląda na zepsuty dokładnie w momencie,
w którym jest najbardziej niebezpieczny.

**Propozycja.** Albo `setTimeout` na `CONFIRM_MS` przerysowujący nagłówek, albo
— taniej — przy wygasłym pytaniu przerysować od razu i pokazać „wyczyść”, żeby
etykieta nigdy nie kłamała. **Koszt S.**

**Docelowo.** → `UX-POPRAWKI.md` jako `A18` (razem z `A19` — jeden wzorzec)

### AUDYT‑10 — „na pewno?” w archiwum nie wygasa WCALE 🟡 S
`src/archive.ts:192` (`removing`), `:581`

**Problem.** Ten sam wzorzec dwuklikowego potwierdzenia, zachowanie odwrotne:
`removing` nie ma limitu czasu, nie kasuje się przy zamknięciu okna ani przy
kliknięciu gdzie indziej. Uzbrojona destrukcja wisi bez końca — wystarczy
kliknąć ✕ przy nagraniu, odejść, wrócić po godzinie i trafić w to samo miejsce.

Argument, który uzasadnił wygasanie w panelu („pytanie zadane i porzucone nie
może czekać w nieskończoność na przypadkowy klik”), stosuje się tu jeden do
jednego. Do tego rozjeżdżają się `aria-label`: w panelu statyczne „Usuń
nagrania” (`overlay.ts:1352`), w archiwum zmienne „Potwierdź usunięcie”
(`archive.ts:576`).

**Propozycja.** Jedna implementacja potwierdzenia dla obu miejsc: wspólny
`CONFIRM_MS`, wspólne przerysowanie, wspólna reguła dla `aria-label`. **Koszt S**
łącznie z `A18`, bo to ta sama robota zrobiona raz.

**Docelowo.** → `UX-POPRAWKI.md` jako `A19`

### AUDYT‑11 — ⧉ kopiuje co innego, niż widać 🟡 S
`src/overlay.ts:1383` (`statsJson`), kontra `:987` (`render`)

**Problem.** `statsJson()` czyta `this.latest?.fight`, czyli walkę NA ŻYWO —
także wtedy, gdy na ekranie stoi nagranie z archiwum, bo `render()` rysuje
z `preview.stats`. Decyzja jest świadoma i skomentowana (`:1373-1376`), ale
NIEKOMUNIKOWANA: przycisk wygląda tak samo, `aria-label` mówi to samo, a kopiuje
coś innego niż to, na co patrzysz.

**Propozycja.** W podglądzie albo kopiować to, co widać, albo zmienić etykietę
przycisku na mówiącą, że idzie walka na żywo. Pierwsze jest zgodne z tym, czego
użytkownik oczekuje; drugie tańsze. **Koszt S.**

**Docelowo.** → `UX-POPRAWKI.md` jako `A20`

### AUDYT‑12 — Zwinięcie w podglądzie gubi ślad, że to nie walka na żywo 🟡 S
`src/overlay.ts:1070`

**Problem.** Zwinięty panel nie buduje pasków stanu — a razem z nimi znika pasek
PODGLĄD, wyjście „na żywo” i całe sterowanie odtwarzaniem. Zwinięty panel
w trakcie podglądu jest więc **nieodróżnialny od zwiniętego panelu na żywo**,
a odtwarzanie leci dalej, bo ticker nie jest zatrzymywany. Po rozwinięciu
nagranie stoi w innym miejscu, niż się je zostawiło.

**Propozycja.** Albo zostawić pasek PODGLĄD w stanie zwiniętym (jedyny pasek,
który niesie tożsamość widoku, nie liczby), albo pauzować odtwarzanie przy
zwinięciu. **Koszt S.**

**Docelowo.** → `UX-POPRAWKI.md` jako `A21`

### AUDYT‑13 — Kliknięcia bez żadnej odpowiedzi 🟡 S
`src/archive.ts:291` (`loadPasted`), `:256` (`open`), `src/overlay.ts:1723`
(`drill`) vs `:1745` (`enterSource`)

**Problem.** Trzy miejsca, gdzie klik jest połykany bez słowa:
- „wczytaj” przy pustym polu — `if (text.trim() === "") return;`
- wiersz archiwum, którego tekst zniknął spod indeksu — ciche wyjście w `open`
  i w `play`;
- wiersz rozbicia leczenia — `drill` mówi „obsłużone” i zwraca `true`, po czym
  `enterSource` odrzuca przez `canDrillSources()`. Zdarzenie jest skonsumowane,
  efektu nie ma.

Trzeci przypadek jest najgorszy, bo stoi w sprzeczności z zasadą z `UX.md §6`:
„Liść bez danych się nie podświetla i nie kusi kliknięciem”. Tutaj kusi.

**Propozycja.** Puste pole → komunikat przy przycisku; wiersz bez tekstu →
wiersz oznaczony jako nieczytelny (i najlepiej wyrzucony z indeksu); liść
leczenia → `drill` ma zwracać `false`, żeby wiersz nie udawał klikalnego.
**Koszt S.**

**Docelowo.** → `UX-POPRAWKI.md` jako `A22`

---

## D. Dostępność i obietnice bez pokrycia

Dwie rzeczy, które dokumenty i CHANGELOG obiecują, a kodu za nimi nie ma.

### AUDYT‑14 — Odznaka literowa profesji NIE ISTNIEJE 🔴 M — dostępność ✓
`src/overlay.ts:2084-2087` (`appendSection`), kontra `src/palette.ts:37`, `:45`
i `CHANGELOG.md` 0.2.0

**Problem.** Wiersz rankingu składa się z numeru, nazwy (plus `*` przy
niejednoznaczności) i liczby. **Odznaki z literą profesji nie ma nigdzie.**

Tymczasem cały argument o rozróżnialności kolorów opiera się właśnie na niej.
`palette.ts:45` mówi wprost: „Rozróżnialność zapewnia odznaka z literą profesji,
nie barwa”, a `:37`: „postaci niesie nazwa i odznaka obok niej. Dwóch magów
dostaje ten sam kolor”. CHANGELOG 0.2.0 obiecuje ją użytkownikowi i sam nazywa
warunkiem, nie ozdobą.

To nie jest kosmetyka, tylko **niezaimplementowane założenie dostępności**:
przy daltonizmie dwie postacie różnych profesji o zbliżonych barwach są dziś
nierozróżnialne, a dokument twierdzi, że problem jest rozwiązany. Do tego
w tym samym wierszu siedzi już `A14` (tekst na pasku nie przechodzi AA) —
dwa długi w jednym miejscu, na które patrzy się przez całą walkę.

**Propozycja.** Odznaka przed nazwą, litera profesji z `professionCode`, kolor
tła z tej samej palety co pasek. Zderzyć z zakazem „nie robić z rankingu tabeli”
(`UX.md §6`) — odznaka nie jest czwartą kolumną, tylko częścią nazwy, więc
mieści się w zasadzie; warto to w `UX.md` dopowiedzieć. **Koszt M**, bo wymaga
decyzji wizualnej razem z `A14` — obie zmiany dotykają tego samego wiersza
i lepiej je zrobić jednym ruchem niż dwoma.

**Docelowo.** → `UX-POPRAWKI.md` jako `A23`, spięte z `A14`

### AUDYT‑15 — Cztery reguły `:focus-visible` są MARTWE 🟡 M — dostępność ✓
`src/overlay.ts:201-207`; `:2070` (wiersz), `:1791` (`crumb-back`),
`:1286` (`replay-track`)

**Problem.** Arkusz deklaruje obrys fokusu dla czterech selektorów. Trzy z nich
nie mogą się nigdy uaktywnić:
- `.row[tabindex]` — **nic w całym `src/` nie ustawia `tabindex`**;
- `.crumb-back` — to `div`, nie `<button>`;
- `.replay-track` — to `div`, bez `role="slider"` i bez `tabindex`.

Działa wyłącznie `button:focus-visible`. W całym `src/` nie ma też ani jednego
`keydown`. Wiersze rankingu i wiersze archiwum są `div`‑ami z `click`, więc
drążenie w postać i wczytanie nagrania są **wyłącznie mysie**.

**Skąd luka.** `UX.md §6` świadomie odrzuca SKRÓTY KLAWISZOWE i argumentuje to
sensownie (gra sama łapie klawisze, kolizje). Ale to nie jest to samo co brak
fokusu — reguła `:focus-visible` została napisana właśnie dlatego, że ktoś
uznał fokus za potrzebny. Dziś CSS obiecuje coś, czego w drzewie nie ma.

**Propozycja.** Rozstrzygnąć w jedną stronę i zapisać: albo zdjąć trzy martwe
selektory i dopisać do `UX.md §6`, że nawigacja klawiaturą jest poza zakresem
w całości, albo dorobić `tabindex` i `role` na wierszach, `<button>` na okruszku
i `role="slider"` na suwaku. Pierwsze jest uczciwe i kosztuje XS; drugie kosztuje
M i otwiera temat, którego §6 nie chciał. **Do decyzji, nie do łatki.**

**Docelowo.** → `UX-POPRAWKI.md` jako `A24` + rozstrzygnięcie w `UX.md §6`

### AUDYT‑16 — Ustawienia widoku giną po F5, geometria przeżywa 🟡 S ✓
`src/overlay.ts:806-823` (pola instancji) kontra `:691` (`PanelState`)

**Problem.** Do magazynu idą `x`, `y`, `collapsed`, `width`, `height`.
Nie idzie NIC z tego, co użytkownik faktycznie ustawia w walce: metryka
(wraca do „Zadane”), filtr składu (wraca do „Wszyscy”), tryb „na turę” (wraca
do wyłączonego), wejście w postać i w cel.

Asymetria jest odczuwalna właśnie dlatego, że połowa stanu przeżywa: okno
zostaje tam, gdzie się je postawiło, więc panel wygląda na „zapamiętany” —
a widok w środku jest zresetowany. F5 w walce grupowej kasuje ustawione „Oni” +
„na turę” + konkretnego przeciwnika.

**Propozycja.** Dołożyć `metric`, `team`, `perTurn` do `PanelState` — to trzy
pola i jeden `saveState()` więcej. `focus`/`focusSource` świadomie zostawić
ulotne: postać z poprzedniej walki po odświeżeniu i tak by nie istniała, a
`render()` (`:995-1001`) słusznie cofa o szczebel, gdy jej nie ma. **Koszt S.**

**Docelowo.** → `UX-POPRAWKI.md` jako `A25`

---

## E. Spójność tekstu i drobiazgi

### AUDYT‑17 — Wielkie/małe litery i puste stany bez odmiany ⚪ S
`src/overlay.ts:1334`, `:2027`, `:1827`; kontra `plural()` `:62-73`

**Problem.** Trzy osobne rozjazdy w tekstach:
- zakładki wielką literą („Zadane”, „Wszyscy”) obok akcji małą („na turę”,
  „kopiuj logi”, „wyczyść”, „wklej”, „na żywo”) — bez reguły, która by mówiła,
  kiedy co;
- pasek nagrywania miesza jedno z drugim w TYM SAMYM elemencie: „nagrywam —
  czekam na walkę” obok „Brak miejsca w przeglądarce — nagrywanie wyłączone”;
- puste stany wklejają etykietę po dwukropku przez `toLowerCase()`, bez odmiany:
  „Brak danych: my.”, „Brak rozbicia: zadane.”. Repo ma `plural()` napisane
  dokładnie po to, żeby liczebniki się odmieniały — a przypadki gramatyczne
  poszły najprostszą drogą.

**Propozycja.** Reguła w `UX.md`: nazwy stanów (zakładki) wielką, akcje małą,
komunikaty pełnym zdaniem. Puste stany przepisać na formy, które nie wymagają
odmiany („Brak danych dla wybranego składu.”). **Koszt S.**

**Docelowo.** → `UX-POPRAWKI.md` jako `A26`

### AUDYT‑18 — ✕ znaczy dwie rzeczy; dymek obiecuje nie to, co trzeba ⚪ S
`src/archive.ts:472` vs `:573`; `src/overlay.ts:2288` vs `:2386`

**Problem.** W jednym oknie archiwum ✕ w nagłówku zamyka, a ✕ w wierszu kasuje
NIEODWRACALNIE. Ten sam glif, dwa skutki, jeden ekran.

Dymek działa odwrotnie do stanu faktycznego: na wierszu postaci mówi „LPM —
rozbicie · PPM — powrót” także na najwyższym poziomie, **gdzie nie ma dokąd
wracać**; na wierszu rozbicia mówi tylko „PPM — powrót do składu”, **choć LPM
tam działa** i schodzi szczebel niżej (Zadane/Otrzymane).

**Propozycja.** Inny glif dla kasowania (kosz zamiast ✕). Podpowiedź w dymku
budowana ze stanu drążenia, nie wpisywana na sztywno. **Koszt S.**

**Docelowo.** → `UX-POPRAWKI.md` jako `A27`

### AUDYT‑19 — PPM zabiera menu przeglądarki nad listą archiwum ⚪ XS
`src/overlay.ts:954-965`

**Problem.** `contextmenu` jest przechwytywany na CAŁYM shadow roocie, z jednym
wyjątkiem dla pól edytowalnych (dołożonym w `A12`). Nad listą archiwum `back()`
nie ma czego zdjąć, więc użytkownik traci natywne menu bez żadnego zysku.

**Propozycja.** Rozszerzyć wyjątek: przechwytywać PPM tylko wewnątrz panelu,
gdzie drążenie w ogóle istnieje. **Koszt XS.**

**Docelowo.** → `UX-POPRAWKI.md` jako `A28`

---

## F. Kod, testy, narzędzia

### AUDYT‑20 — Linia otwierająca w CZTERECH kopiach 🔴 XS — ✅ NAPRAWIONE 2026‑07‑31
`src/parser.ts:35`, `src/recorder.ts:30`, `src/source.ts:14`,
`tools/engine-probe.js:108`

**Problem.** Napis „Rozpoczęła się walka pomiędzy” stoi w czterech miejscach,
każde z własnym regexem. Ta jedna linia decyduje o trzech niezależnych rzeczach:
znalezieniu okna walki w DOM, podziale na walki w parserze i podziale na
nagrania w nagrywarce.

Zmiana jej formatu po stronie gry wywala wszystkie trzy **po cichu** — poza
zasięgiem czujki `unknown`, która pilnuje wyłącznie parsera. Panel nie
powiedziałby „nie rozumiem”, tylko „brak danych”.

**Propozycja.** Jedna eksportowana stała, importowana przez pozostałe moduły
(`tools/` może zostać osobno — to skrypt diagnostyczny). Osobno rozważyć, czy
brak dopasowania tej linii przez dłuższy czas nie powinien być widoczny
w panelu. **Koszt XS.**

**Zrobione.** `FIGHT_START_TEXT` w `types.ts`; parser, `source.ts` i nagrywarka
budują z niego własne wzorce. Widoczności braku dopasowania w panelu NIE
dorobiono — to zostaje otwarte.

**Docelowo.** → `SOLID.md` jako `§4.30`

### AUDYT‑21 — Gorąca ścieżka bez osłony i w złej kolejności 🔴 XS — ✅ NAPRAWIONE 2026‑07‑31
`src/index.ts:27-37` (`start`), kontra `:116-123`

**Problem.** Callback subskrypcji nie ma `try/catch`, a leci z `queueMicrotask`
(`source.ts:154`) — wyjątek jest więc nieprzechwycony w kontekście strony gry
i powtarza się przy każdej mutacji DOM.

Gorsza jest kolejność: `session.update(text)` stoi PRZED `recorder.capture(text)`.
Awaria parsera zabiera więc ze sobą nagrywanie — czyli **jedyny surowy log,
którym dałoby się ten błąd odtworzyć**. Cały sens trzymania surowca
(`recorder.ts:4-8`) przepada dokładnie w momencie, w którym jest najbardziej
potrzebny.

Kontrast z zasadą zapisaną trzy funkcje niżej jest wprost: „Panel rysujemy PRZED
czymkolwiek dodatkowym… i to dodatek ma paść pierwszy, jeśli coś pójdzie źle” —
archiwum ma `try/catch` z `console.error`, gorąca ścieżka nie ma nic.

**Propozycja.** Zamienić dwie linie miejscami (`capture` przed `update`)
i opakować całość w `try/catch` z `console.error`, jak przy archiwum.
**Koszt XS**, zwrot nieproporcjonalnie duży.

**Zrobione.** `capture` przed `update`, każde we własnym `try/catch`
z `console.error`. Przy okazji `drill()` przestał meldować obsłużenie
kliknięcia, które nic nie zrobiło (część `AUDYT‑13`).

**Docelowo.** → `SOLID.md` jako `§4.31`

### AUDYT‑22 — `destroy()` nie sprząta i nie jest wołane ⚪ XS ✓
`src/overlay.ts:970`, `:1091`, `:1401`; `src/archive.ts` — brak `destroy` w ogóle

**Problem.** `destroy()` robi `this.host.remove()` i nic więcej — zostawia
listener `resize` dopięty do `window` w konstruktorze (`:970`). Jednocześnie
**nie jest wołane nigdzie w repo** (0 % pokrycia), także nie przez `stop()`
z `boot()`. Metoda, która kłamie o sprzątaniu i której nikt nie używa.

Do tego `copy()` zostawia niezatrzymany `setTimeout(…, 1500)` wołający
`rerender()` — po zniszczeniu panelu strzela w nieistniejące drzewo. `Archive`
nie ma `destroy()` wcale.

**Propozycja.** Albo dopisać sprzątanie (listener + timeout) i wołać z `stop()`,
albo skasować metodę jako martwą. Druga droga jest uczciwsza, dopóki userscript
nie ma ścieżki wyłączenia. **Koszt XS.**

**Docelowo.** → `SOLID.md` `§9` (martwy / uśpiony kod)

### AUDYT‑23 — Nieograniczone `Session.archived` i `Archive.summaries` 🟡 S ✓
`src/session.ts:239`, `:306` (`reset`), `src/archive.ts:185`

**Problem.** Dwie kolekcje rosną bez sufitu przez całą sesję gry:
- `Session.archived` nigdy nie jest przycinane, a `reset()` **nie ma ani jednego
  wywołania** w `src/` ani w testach (potwierdza pokrycie). Każdy `total()`
  przelatuje po wszystkich walkach, głęboko kopiując i sortując każde rozbicie;
- `Archive.summaries` nigdy nie jest czyszczone — także po `remove()` i po
  eksmisji — a każdy wpis trzyma pełne `BattleStats` z `timeline` i `matrix`.
  Klucz to `${id}:${text.length}`, więc rośnie o wpis przy każdej zmianie
  długości trwającego nagrania.

Łagodzi to `sync()` (`archive.ts:234`), przebudowujące listę tylko przy zmianie
zbioru `id` — ale to ochrona przypadkowa, nie polityka.

**Propozycja.** Sufit na `archived` (albo sumowanie przyrostowe zamiast trzymania
walk), kasowanie wpisu `summaries` razem z nagraniem. **Koszt S.**

**Docelowo.** → `SOLID.md` `§7` (sumowanie sesji)

### AUDYT‑24 — Testy jednego pliku i brak lintera 🟡 M ✓
`tests/overlay.test.ts`, `tsconfig.json`

**Problem.** Układ plików testowych kłamie. `overlay.test.ts` ma 3052 linie
i 167 testów, czyli **45 % całego zestawu**, importuje dziesięć modułów
i trzyma w sobie `describe("sesja")`, `describe("przypisanie kolorów")`,
`describe("wyciąganie tekstu z DOM")`, `describe("spięcie źródła z overlayem")`
— czyli w praktyce `session.test.ts`, `palette.test.ts`, `source.test.ts`
i `index.test.ts`.

**`stats.ts` i `session.ts` nie mają własnych plików testowych**, choć są
rdzeniem: `aggregate()` jest wołane z testów PARSERA, więc asercje agregacji
mieszkają w pliku o parserze. Skutek jest mierzalny — trzy niepokryte gałęzie
`instanceResolver` (`stats.ts:158-160`) to dokładnie te, do których nie da się
dosięgnąć z zewnątrz, bo nikt nie testuje modułu osobno.

Osobno: **lintera nie ma w ogóle**, a `noUnusedLocals` i `noUnusedParameters` są
w `tsconfig.json` jawnie wyłączone — więc martwy kod (`renderAxis`,
`renderFireFocus`, `turnRows`, `StaticRosterSource`, `Session.reset`,
`ColorAssignment`) nie ma kto zgłosić.

Stan wyjściowy, zmierzony: `369 pass / 2 skip / 0 fail`, `tsc --noEmit` czysty,
pokrycie 93,3 % linii.

**Propozycja.** Wydzielić `stats.test.ts` i `session.test.ts` z `overlay.test.ts`
(zostaje ~1200 linii o overlayu). Włączyć `noUnusedLocals` — sam ten przełącznik
zamienia AUDYT‑22 i `§9` z lektury w błąd kompilacji. **Koszt M.**

**Docelowo.** → `SOLID.md` `§10` (testy) + nowy refaktor `R9`

---

## G. Otwarte z poprzednich rund

Bez nowych ID — sam wskaźnik, żeby ten dokument był pełną migawką otwartych
spraw, a nie tylko listą nowych.

| Gdzie | Co |
|---|---|
| `UX-POPRAWKI.md A14` | Tekst na kolorowym pasku nie przechodzi AA (żółty 3,50:1). Spiąć z AUDYT‑14 — ten sam wiersz, jedna decyzja wizualna. |
| `UX-POPRAWKI.md B2–B12` | Wygody: suwak po turach, auto‑pauza, sygnał „trzymam postać”, TOP‑3 w dymku, ostrzeżenie o eksmisji, filtr w archiwum, eksport dla Discorda, onboarding, reset ustawień. |
| `SOLID.md §4.12` | Przycięcie logu w trakcie walki OBNIŻA liczby — otwarte, czeka na decyzję i na fixture z przyciętym nagłówkiem. |
| `SOLID.md §4.18` | Modyfikator z `(N%)` rozbija blok ataku na trzy `unknown`. |
| `SOLID.md §4.22` | Cztery pola parsowane i nigdy nieczytane. |
| `SOLID.md §4.23` | Otwarcie archiwum blokuje wątek gry. |
| `ROADMAP.md ⏸` | Metryka „Tury” (nieosiągalna z UI, dwa `test.skip`), oś tur i skupienie ognia (napisane, nigdy niewołane), zakładka zakresu (patrz AUDYT‑5, AUDYT‑6). |

⚠️ **Martwy kod jest zabetonowany testami.** Dwa ZIELONE testy asertują
NIEOBECNOŚĆ osi tur i skupienia ognia (`overlay.test.ts:2588` i sąsiedni), więc
usunięcie `renderAxis`/`renderFireFocus` wymaga skasowania przechodzących
testów. To podnosi próg decyzji „porzucone czy wstrzymane” — dopóki nie zapadnie,
kod i testy będą się nawzajem podtrzymywać przy pozorach życia.
