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

**Stan na 2026‑07‑31:** naprawione są `AUDYT‑1`…`AUDYT‑5`, `8`–`13`, `15`, `16`
i `20`–`24`. `AUDYT‑7` **odrzucone** — teza okazała się błędna przy sprawdzeniu,
szczegóły przy wpisie. Otwarte zostają dwie wymagające DECYZJI, nie roboty
(`AUDYT‑6` brak specu, `14` decyzja wizualna), nowe `AUDYT‑25` (zablokowane tą
samą decyzją co oś tur) oraz drobiazgi `17`–`19`.
**Dopisane 2026‑08‑01:** `AUDYT‑26`…`AUDYT‑29` — cztery usterki widoczne
wprost na zrzutach z `docs/screenshots/`, których nie miał żaden backlog.
Wszystkie naprawione w tej samej rundzie; `AUDYT‑7` doczekało się sprostowania.
**Audyt tego samego dnia** (sekcja `F3`) dołożył `AUDYT‑30`…`AUDYT‑40`, z czego
**pięć to regresje rundy `F2`** — stąd zasada: przegląd PRZED commitem, nie po.
Otwarte zostaje `AUDYT‑39` (fałszywa strona przy zdublowanej nazwie po obu
stronach); `AUDYT‑40` zamknięte 2026‑08‑01. Opisy zostają w czasie teraźniejszym, bo opisują STAN SPRZED
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
| ~~AUDYT‑5~~ | `BattleStats` jeden dla walki i sesji — mina pod zakładkę | 🔴 | S | **✅** |
| AUDYT‑14 | Odznaka literowa profesji nie istnieje | 🔴 | M | ✓ |
| ~~AUDYT‑3~~ | 21 kB indeksu przepisywane przy każdej linii logu | 🟡 | S | **✅** |
| AUDYT‑6 | Suma sesji bez wyjścia w UI | 🟡 | M | ✓ |
| ~~AUDYT‑8~~ | Kopiowanie melduje sukces, którego nie było | 🟡 | S | **✅** |
| ~~AUDYT‑9~~ | „wyczyść”: potwierdzenie wygasa niewidocznie | 🟡 | S | **✅** |
| ~~AUDYT‑10~~ | „na pewno?” w archiwum nie wygasa wcale | 🟡 | S | **✅** |
| ~~AUDYT‑11~~ | ⧉ kopiuje co innego, niż widać | 🟡 | S | **✅** |
| ~~AUDYT‑12~~ | Zwinięcie w podglądzie gubi ślad, że to nie walka na żywo | 🟡 | S | **✅** |
| ~~AUDYT‑13~~ | Kliknięcia bez odpowiedzi | 🟡 | S | **✅** |
| ~~AUDYT‑15~~ | Cztery reguły `:focus-visible` są martwe | 🟡 | M | **✅** |
| ~~AUDYT‑16~~ | Ustawienia widoku giną po F5, geometria przeżywa | 🟡 | S | **✅** |
| ~~AUDYT‑23~~ | Nieograniczone `archived` i `summaries` | 🟡 | S | **✅** |
| ~~AUDYT‑24~~ | Brak `stats.test.ts` i `session.test.ts`; brak lintera | 🟡 | M | **✅** |
| AUDYT‑25 | `deaths` i `matrix` liczone dla nikogo | ⚪ | S | ✓ |
| ~~AUDYT‑7~~ | `unattributedHealing` liczone i nigdy niepokazane | — | — | **❌ odrzucone** (teza zestarzała się — patrz sprostowanie) |
| ~~AUDYT‑26~~ | `unattributedHealing` to JEDNA liczba, bez podziału na strony | 🟡 | S | **✅** ✓ |
| ~~AUDYT‑27~~ | Ta sama rodzina obrażeń stoi w przekroju pod dwiema nazwami | 🟡 | M | **✅** ✓ |
| ~~AUDYT‑28~~ | Pozycja bez sprawcy udaje postać w rankingu „OD KOGO” | 🟡 | M | **✅** ✓ |
| ~~AUDYT‑29~~ | Licznik melduje „×0” i „0 c.” przy niezerowej kwocie | 🟡 | XS | **✅** ✓ |
| ~~AUDYT‑30~~ | Rodzina „Broń” traci barwę po scaleniu etykiet | 🔴 | XS | **✅** ✓ |
| ~~AUDYT‑31~~ | Kursor obiecuje klik w „TYP OBRAŻEŃ”, klik przepada | 🔴 | XS | **✅** ✓ |
| ~~AUDYT‑32~~ | Dymek martwy na całej sekcji „CZYM (ŁĄCZNIE)” | 🔴 | XS | **✅** ✓ |
| ~~AUDYT‑33~~ | Zmiana metryki na 2. szczeblu dubluje listę pod cudzym nagłówkiem | 🔴 | XS | **✅** ✓ |
| ~~AUDYT‑34~~ | Stan okna z magazynu bez walidacji — panel na miliard pikseli | 🔴 | S | **✅** ✓ |
| ~~AUDYT‑35~~ | Suma nagłówka sekcji dotyczy całej postaci, nie sekcji | 🟡 | XS | **✅** ✓ |
| ~~AUDYT‑36~~ | Przypis rozbija liczbę z innego zakresu niż własny | 🟡 | S | **✅** ✓ |
| ~~AUDYT‑37~~ | `mergeStats` nie uzupełnia `side` | 🟡 | XS | **✅** ✓ |
| ~~AUDYT‑38~~ | `RE_INFO` „otrzymuje” łyka linię z obrażeniami | 🟡 | XS | **✅** ✓ |
| AUDYT‑39 | Ta sama nazwa po obu stronach → fałszywa strona dla obu | 🔴 | M | ✓ |
| ~~AUDYT‑40~~ | `hits` + `misses` liczą ten sam atak przy uniku częściowym | ⚪ | XS | **✅** ✓ |
| AUDYT‑17 | Wielkie/małe litery i puste stany bez odmiany | ⚪ | S | |
| AUDYT‑18 | ✕ znaczy dwie rzeczy; dymek obiecuje nie to, co trzeba | ⚪ | S | |
| AUDYT‑19 | PPM zabiera menu przeglądarki nad listą archiwum | ⚪ | XS | |
| ~~AUDYT‑22~~ | `destroy()` nie sprząta i nie jest wołane | ⚪ | XS | **✅** |

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

### AUDYT‑3 — Cały indeks przepisywany przy KAŻDEJ zmianie logu 🟡 S — ✅ NAPRAWIONE 2026‑07‑31
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

**Zrobione.** `saveIndex()` rozdziela zmianę KSZTAŁTU listy (nowe nagranie,
eksmisja, skasowanie — zapis natychmiast) od zmiany ROZMIARU (`chars` rośnie —
odkładane do progu `INDEX_FLUSH_CHARS = 2000`). Wyłączenie nagrywania domyka
odłożone rozmiary. W pamięci `chars` jest ZAWSZE dokładne, więc budżet
i eksmisja liczą się poprawnie niezależnie od tego, kiedy indeks poszedł na
dysk; rozjazd dotyczy wyłącznie odczytu po nagłym zamknięciu karty i jest
ograniczony progiem.

**Pomiar po naprawie.** 200 linii logu przy pełnym archiwum: **4 zapisy indeksu
zamiast 200**, 476 znaków na linię zamiast ~21 tys. — ok. 48× mniej.

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

### AUDYT‑5 — `BattleStats` jest jednym typem dla walki i dla sesji 🔴 S — ✅ NAPRAWIONE 2026‑07‑31
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

**Zrobione.** `Aggregate` (wspólne), `BattleStats = Aggregate & { timeline,
deaths, matrix }`, `SessionStats = Aggregate`. `mergeStats` zwraca `SessionStats`
i NIE dokłada już pustych tablic — sesja przestała udawać pełne `BattleStats`
także w JSON-ie ze schowka. `Overlay.render` przyjmuje `BattleStats` jako
pierwszy argument i `SessionStats` jako drugi, więc podanie sumy jako walki
**nie kompiluje się** (`TS2345`). `EMPTY_STATS` przeniesione do `stats.ts`
i zamrożone wraz z tablicami.

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

### AUDYT‑7 — `unattributedHealing` liczone, sumowane i nigdy niepokazane ❌ ODRZUCONE
`src/stats.ts:798`, `src/session.ts:166`; **zero odwołań w `overlay.ts`**

**Problem.** Leczenie, którego nie dało się przypisać, jest liczone w agregacie,
przenoszone przez `BattleStats` i sumowane przez sesję — po czym przepada. Jego
bliźniak od trucizny (`unattributedDotDamage`) ma pełny przypis w stopce, który
podąża nawet za filtrem składu i za wejściem w postać (`overlay.ts:2478-2507`).

To ostatni licznik „nieprzypisanego”, który nie ma przypisu — czyli jedyne
miejsce, gdzie panel po cichu gubi liczbę, zamiast się do niej przyznać. Przy
zasadzie „nieznane jest głośne”, którą repo trzyma od `d21781d`, to wyłom.

**Propozycja.** Przypis w stopce obok trucizny, tą samą ścieżką. **Koszt XS.**

**❌ ODRZUCONE 2026‑07‑31 — teza była BŁĘDNA.** `unattributedHealing` nie jest
liczbą gubioną, tylko **redundantnym agregatem tego, co już widać**. Sprawdzone
na wszystkich fixture'ach: jest co do znaku równe sumie widocznych wierszy
„Regeneracja” (`PLAIN_HEAL`) w rozbiciach leczenia — bo dokładnie tam trafia
każde leczenie bez nazwy umiejętności.

```
unattributedHealing == suma widocznej „Regeneracji” wszędzie: true
```

Przypis powtarzałby więc sumę stojącą wyżej — czyli dokładnie to, czego zabrania
reguła spisana przy `TYP OBRAŻEŃ`: „to nie jest informacja, tylko powtórzenie
sumy stojącej wyżej”. Pole zostaje jako nieużywany agregat; jego usunięcie to
osobna sprawa (`§9`, martwy kod), nie usterka widoku.

**~~Nie badać drugi raz.~~ — SPROSTOWANIE 2026‑08‑01.** Odrzucenie było słuszne
w dniu, w którym zapadło, i przestało być słuszne **tego samego dnia**: `487ccf9`
dołożył polu `heal.self` i przy okazji sam przypis w stopce. Od tamtego commita:

- teza o redundancji **już nie zachodzi**. Leczenie kierowane („`Er Al Safar
  wykonuje Leczenie ran.`" → „`Uleczono Zsz Przeworsk o 11937 punktów życia.`")
  ma `self: false`, więc wchodzi do puli — ale w `healedBy` stoi pod NAZWĄ
  UMIEJĘTNOŚCI, nie pod „Regeneracją". Pula i suma widocznych „Regeneracji" to
  od tego momentu dwie różne liczby;
- zdanie „zero odwołań w `overlay.ts`" też przestało być prawdziwe — przypis
  „Leczenie bez sprawcy" wjechał w tym samym commicie.

Wpis zostaje jako zapis TEGO, jak sprawdzona teza może się zestarzeć przez
sąsiedni commit. Sam brak, który po tym został — pula była **jedną liczbą**,
podczas gdy `unattributedDotDamage` dzieli się na strony — naprawiony
**2026‑08‑01** (`AUDYT‑26` niżej).

**Docelowo.** → `AUDYT‑26`.

---

## C. Panel — informacja zwrotna i stany

Wspólny mianownik: panel robi coś (albo nie robi) i nie mówi o tym. Sześć
przypadków, w tym dwa, które MELDUJĄ SUKCES, którego nie było.

### AUDYT‑8 — Kopiowanie melduje sukces, którego nie było 🟡 S — ✅ NAPRAWIONE 2026‑07‑31
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

**Zrobione.** `writeClipboard` czyta wynik `execCommand` i rzuca przy `false`.
`copy()` traktuje `null` i pusty tekst jako porażkę, więc „kopiuj logi” przy
`dump() === null` pokazuje „✕” zamiast kopiować pustkę.

**Docelowo.** → `UX-POPRAWKI.md` jako `A17`

### AUDYT‑9 — „wyczyść”: potwierdzenie wygasa NIEWIDOCZNIE 🟡 S — ✅ NAPRAWIONE 2026‑07‑31
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

**Zrobione.** Nowa klasa `Confirm` w `src/confirm.ts` — JEDNA implementacja dla
obu miejsc. Wygaśnięcie odmierza wstrzyknięty `Ticker` i woła `onExpire`, które
PRZERYSOWUJE widok; `aria-label` idzie odtąd za stanem, nie za samym napisem.

**Docelowo.** → `UX-POPRAWKI.md` jako `A18` (razem z `A19` — jeden wzorzec)

### AUDYT‑10 — „na pewno?” w archiwum nie wygasa WCALE 🟡 S — ✅ NAPRAWIONE 2026‑07‑31
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

**Zrobione.** Ta sama `Confirm`, więc oba miejsca wygasają identycznie.
Zamknięcie okna archiwum dodatkowo rozbraja pytanie, a uzbrojenie jednego
wiersza rozbraja poprzedni.

**Docelowo.** → `UX-POPRAWKI.md` jako `A19`

### AUDYT‑11 — ⧉ kopiuje co innego, niż widać 🟡 S — ✅ NAPRAWIONE 2026‑07‑31
`src/overlay.ts:1383` (`statsJson`), kontra `:987` (`render`)

**Problem.** `statsJson()` czyta `this.latest?.fight`, czyli walkę NA ŻYWO —
także wtedy, gdy na ekranie stoi nagranie z archiwum, bo `render()` rysuje
z `preview.stats`. Decyzja jest świadoma i skomentowana (`:1373-1376`), ale
NIEKOMUNIKOWANA: przycisk wygląda tak samo, `aria-label` mówi to samo, a kopiuje
coś innego niż to, na co patrzysz.

**Propozycja.** W podglądzie albo kopiować to, co widać, albo zmienić etykietę
przycisku na mówiącą, że idzie walka na żywo. Pierwsze jest zgodne z tym, czego
użytkownik oczekuje; drugie tańsze. **Koszt S.**

**Zrobione.** `statsJson` bierze to, co widać: w podglądzie idzie nagranie,
a nie walka na żywo. Doszło pole `source` („na żywo” / źródło podglądu), więc
po wklejeniu wiadomo, na co się patrzyło. Sumy sesji w podglądzie NIE MA —
nagranie z archiwum ani wklejony log nie są jej częścią, a dokładanie jej obok
sugerowałoby, że te liczby się ze sobą wiążą.

**Docelowo.** → `UX-POPRAWKI.md` jako `A20`

### AUDYT‑12 — Zwinięcie w podglądzie gubi ślad, że to nie walka na żywo 🟡 S — ✅ NAPRAWIONE 2026‑07‑31
`src/overlay.ts:1070`

**Problem.** Zwinięty panel nie buduje pasków stanu — a razem z nimi znika pasek
PODGLĄD, wyjście „na żywo” i całe sterowanie odtwarzaniem. Zwinięty panel
w trakcie podglądu jest więc **nieodróżnialny od zwiniętego panelu na żywo**,
a odtwarzanie leci dalej, bo ticker nie jest zatrzymywany. Po rozwinięciu
nagranie stoi w innym miejscu, niż się je zostawiło.

**Propozycja.** Albo zostawić pasek PODGLĄD w stanie zwiniętym (jedyny pasek,
który niesie tożsamość widoku, nie liczby), albo pauzować odtwarzanie przy
zwinięciu. **Koszt S.**

**Zrobione.** Pasek PODGLĄDU zostaje w stanie zwiniętym; pasek nagrywania dalej
znika. Kryterium: pasek podglądu niesie TOŻSAMOŚĆ widoku, nie liczby — a razem
z nim wracało jedyne wyjście „na żywo” i sterowanie odtwarzaniem.

**Docelowo.** → `UX-POPRAWKI.md` jako `A21`

### AUDYT‑13 — Kliknięcia bez żadnej odpowiedzi 🟡 S — ✅ NAPRAWIONE 2026‑07‑31
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

**Zrobione.** Liść leczenia domknął się przy `AUDYT‑21` (`drill` przestał
meldować obsłużenie kliknięcia, które nic nie zrobiło). Pozostałe dwa dostały
odpowiedź: `Archive.say()` pokazuje jedno zdanie nad listą i gasi je po czterech
sekundach, żeby okno nie stało się listą starych odmów.

**Docelowo.** → `UX-POPRAWKI.md` jako `A22`

---

## D. Dostępność i obietnice bez pokrycia

Dwie rzeczy, które dokumenty obiecują, a kodu za nimi nie ma. Obietnice szły
wcześniej także z `CHANGELOG.md` — plik usunięty z repo 2026‑07‑31, więc
cytaty niżej zostają jako ŚLAD, czym się uzasadniano, a nie jako żywy wskaźnik.

### AUDYT‑14 — Odznaka literowa profesji NIE ISTNIEJE 🔴 M — dostępność ✓
`src/overlay.ts:2084-2087` (`appendSection`), kontra `src/palette.ts:37` i `:45`

**Problem.** Wiersz rankingu składa się z numeru, nazwy (plus `*` przy
niejednoznaczności) i liczby. **Odznaki z literą profesji nie ma nigdzie.**

Tymczasem cały argument o rozróżnialności kolorów opiera się właśnie na niej.
`palette.ts:45` mówi wprost: „Rozróżnialność zapewnia odznaka z literą profesji,
nie barwa”, a `:37`: „postaci niesie nazwa i odznaka obok niej. Dwóch magów
dostaje ten sam kolor”. Nieistniejący już `CHANGELOG.md` 0.2.0 obiecywał ją
użytkownikowi i sam nazywał warunkiem, nie ozdobą.

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

### AUDYT‑15 — Cztery reguły `:focus-visible` są MARTWE 🟡 M — ✅ NAPRAWIONE 2026‑07‑31
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

**Zrobione — wariant „uczciwe minimum”.** Rozstrzygnięcie zapisane w `UX.md §6`:
**poza zakresem są SKRÓTY, nie fokus**. To rozróżnienie było wcześniej zapisane
jako „klawiatura poza zakresem” i przez to nieprawdziwe — Tab chodzi po
przyciskach panelu, czy tego chcemy, czy nie, więc jedyne pytanie brzmiało, czy
widać, gdzie stoi.

Zostaje jeden selektor, `button:focus-visible`, i ma pełne pokrycie w drzewie.
Okruszek powrotu został prawdziwym `<button>` — jest elementem AKCJI, więc ma się
tak nazywać niezależnie od polityki klawiatury; przy okazji ożyła jego martwa
reguła i doszła etykieta dla czytnika. Wiersze rankingu i suwak odtwarzania
zostają myszą: fokusowalne wiersze dałyby przy walce grupowej dwadzieścia
przystanków Taba nad grą, która sama łapie klawisze, czyli dokładnie to, przed
czym broni się `§6`.

Uwaga wykonawcza: reguła `button` maluje na `--ink-muted`, więc okruszek dostał
`color: inherit` — inaczej zamiana `div` → `<button>` zmieniłaby wygląd panelu
przy okazji naprawy dostępności.

**Docelowo.** → `UX-POPRAWKI.md` jako `A24`; rozstrzygnięcie JUŻ w `UX.md §6`

### AUDYT‑16 — Ustawienia widoku giną po F5, geometria przeżywa 🟡 S — ✅ NAPRAWIONE 2026‑07‑31
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

**Zrobione.** `metric`, `team` i `perTurn` weszły do `PanelState` (dostęp przez
akcesory, więc reszta pliku czyta się tak samo). Wartość spoza zestawu jest przy
wczytaniu odrzucana — pod tym kluczem może stać zapis starszej albo NOWSZEJ
wersji dodatku, a metryka steruje renderem. `focus` świadomie zostaje ulotny.

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

### AUDYT‑22 — `destroy()` nie sprząta i nie jest wołane ⚪ XS — ✅ NAPRAWIONE 2026‑07‑31
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

**Zrobione.** `destroy()` zdejmuje listener `resize`, gasi odliczanie ikony
kopiowania i niszczy archiwum (`Archive.destroy` zatrzymuje odtwarzanie, gasnący
komunikat i pytanie „na pewno?”). Woła je `stop()` z `boot()` — bo panel MÓGŁ już
powstać: `missing` zeruje się przy każdym udanym odczycie, więc strona potrafi
przestać wyglądać na grę długo po jego narysowaniu. Komentarz „panel się tu nie
pojawił, więc nie ma czego sprzątać” zakładał inaczej i też został poprawiony.

**Docelowo.** → `SOLID.md` `§9` (martwy / uśpiony kod)

### AUDYT‑23 — Nieograniczone `Session.archived` i `Archive.summaries` 🟡 S — ✅ NAPRAWIONE 2026‑07‑31
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

**Zrobione.** `Session` trzyma teraz JEDNĄ zsumowaną wartość zamiast tablicy
walk: sumowanie jest łączne, więc doliczenie walki przy zamknięciu daje ten sam
wynik co sklejenie wszystkiego na końcu. `Archive.summaries` zdejmuje starsze
wersje tego samego nagrania (klucz niesie długość tekstu, więc trwająca walka
mnożyła wpisy) oraz nagrania, których nie ma już na liście — eksmisja dzieje się
w nagrywarce i archiwum się o niej nie dowiaduje.

**Pomiar, 195 kolejnych walk.** Trzymana pamięć **1 380 393 → 65 748 znaków**
(~21× mniej), `total()` **11,20 → 0,19 ms** (~59× szybciej), wynik identyczny
co do liczby: 40 postaci, 5 703 464 obrażeń. Porównane wprost z kodem sprzed
zmiany, nie oszacowane.

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

**Zrobione.** Dwie rzeczy, obie wymierne.

**Linter.** `noUnusedLocals` i `noUnusedParameters` włączone w `tsconfig.json`.
Zgłosiły dokładnie trzy metody — `renderFireFocus`, `renderAxis`, `turnRows` —
czyli martwy kod z `§9`, który dotąd wykrywał wyłącznie ręczny przegląd. To
wymusiło decyzję „porzucone czy wstrzymane”: **kod zszedł z drzewa, ale nie
z projektu**. Stoi w historii (ostatnia wersja: `95d02d7`), `ROADMAP.md` trzyma
przy obu pozycjach `⏸` wskaźnik na ten commit i wraca w komplecie, gdy zapadnie
decyzja, CO ma pokazywać. Poszły z nim osierocony CSS (`.focus*`, `.axis*`,
`.tip-row*`), dwa ZIELONE testy asertujące jego nieobecność i dwa `test.skip` —
zestaw nie ma już ani jednego pominiętego testu.

**Podział testów.** `overlay.test.ts` **3610 → 2402 linii**, a jego udział
w zestawie **45 % → 27 %** (125 z 470 testów). Powstały pliki nazwane tym, co
faktycznie testują:

| plik | testów | co |
|---|---|---|
| `stats.test.ts` | 55 | agregacja, odwracanie rozbić, trucizna bez sprawcy |
| `session.test.ts` | 18 | tożsamość walki, sumowanie sesji |
| `source.test.ts` | 17 | odczyt DOM gry, znajdowanie okna walki |
| `palette.test.ts` | 9 | przypisanie kolorów |
| `index.test.ts` | 8 | `start()` i `boot()` (wchłonęło `boot.test.ts`) |

Wspólne narzędzia wyjęte do `tests/helpers.ts`, `ManualTicker` do
`tests/manual-ticker.ts`. Suma testów zgadza się co do sztuki: 470 = 36+8+125+9+
142+47+18+17+55+6+7.

**Znalezione przy okazji.** Czyszczenie DOM stało lokalnie w `overlay.test.ts`
i — jak się okazało — chroniło przy okazji CAŁY zestaw: `document` jest wspólny
dla plików, więc po rozbiciu węzeł zostawiony przez jeden test zmylił
`findBattleLog` w drugim. Przeniesione do `tests/setup.dom.ts`, czyli tam, gdzie
obowiązuje wszystkich.

**Docelowo.** → `SOLID.md` `§10` (testy) + nowy refaktor `R9`

---

### AUDYT‑25 — `deaths` i `matrix` liczone dla nikogo ⚪ S — nowe ✓
`src/stats.ts` (`aggregate`), zero odczytów w `src/` poza testami

**Problem.** Po zdjęciu `renderAxis`/`renderFireFocus` (`AUDYT‑24`) pola
`BattleStats.deaths` i `BattleStats.matrix` nie są czytane przez NIC w `src/` —
tylko przez testy. Liczą się przy każdej walce, jadą przez `aggregate`, siedzą
w typie i w JSON‑ie ze schowka.

To nie jest usterka wprowadzona tamtą zmianą: były martwe już wcześniej, tyle że
przez martwy kod, a nie wprost. `noUnusedLocals` ich nie złapie, bo pola obiektu
nie są zmienną — czujka kończy się na funkcjach.

**Skąd zwłoka.** Nie usuwam ich razem z rendererami, bo to ta sama decyzja co
przy `ROADMAP ⏸`: oś tur i skupienie ognia mają wrócić, a wtedy oba pola będą
im potrzebne. Usunięcie teraz znaczyłoby wyrzucenie także liczenia, testów
i kawałka `aggregate` — i odtwarzanie tego przy powrocie.

**Propozycja.** Rozstrzygnąć RAZEM z `ROADMAP ⏸` „Oś tur i skupienie ognia”:
albo wraca cała funkcja i pola mają odbiorcę, albo znika i pola idą za nią.
Do tego czasu zostaje to zapisane tutaj, żeby nie wyglądało na przeoczenie.
**Koszt S**, ale zablokowane decyzją.

**Docelowo.** → `SOLID.md` `§9`, razem z resztą uśpionego kodu

---

## F3. Audyt logiki, UX i kodu (2026‑08‑01)

Przegląd całości przed commitem poprzedniej rundy. **Pięć z jedenastu znalezisk
to regresje TEJ rundy** — dlatego audyt przed commitem, a nie po nim. Wszystko
poniżej odtworzone pomiarem albo kliknięciem, nie wywnioskowane z lektury.

**Stan zdrowy, dla porządku:** przelot niezmiennikowy po 16 zrzutach tekstowych,
6 z DOM i po sumie sesji ze wszystkich walk naraz — **zero rozjazdów**. Sklejanie
etykiet nigdzie nie jest rozbierane. Kontrast `A14` naprawiony poprawnie.

### AUDYT‑30 — rodzina „Broń” traci barwę ✅ NAPRAWIONE ✓ (regresja)
`src/palette.ts` (`typeColor`)

`typeColor` szuka `TYPE_COLORS[label]` po kluczach pisanych MAŁĄ literą, a
przekrój „TYP OBRAŻEŃ” podaje nazwy z wielkiej. Sześć rodzin ratowała druga
droga — `typeFamily("Ogień")` znajduje własny wzorzec w nazwie — ale **„broń”
powstaje z „fizyczne” i „dystansowe” i sama żadnego nie zawiera**, co
`palette.ts` zapowiada we własnym komentarzu. Zmierzone: `#d55181` → `#8a8a80`,
czyli największy wiersz w panelu (u Diety‑Miodu 102 185 ze 104 005) w barwie
nie do odróżnienia od „Nieznany”.

**Zrobione.** `TYPE_COLORS[label.toLowerCase()]` jako pierwsza droga. Test
sprawdza teraz KAŻDĄ rodzinę pod obiema nazwami, nie tylko DoT‑y.

### AUDYT‑31 — kursor obiecuje klik, którego nie ma ✅ NAPRAWIONE ✓ (regresja)
`src/overlay.ts` (`renderDetail`, reguła `.row[data-source]:not([data-leaf])`)

Nowa reguła kursora miała zgadzać obietnicę z działaniem, a złapała też wiersze
`TYP OBRAŻEŃ` — te nie dostają `drillable`, więc `data-leaf` nigdy się na nich
nie pojawiał. Zmierzone: **7 wierszy, 0 z `data-leaf`**, łapka nad każdym,
`rowIdentity` zwraca `null`, klik przepada.

**Zrobione.** Sekcja typów dostaje `() => false` jako `drillable` — jawnie,
z komentarzem, że to warunek działania reguły kursora, a nie ozdoba.

### AUDYT‑32 — dymek martwy na „CZYM (ŁĄCZNIE)” ✅ NAPRAWIONE ✓
`src/overlay.ts` (handler `pointerover`)

`row.dataset.list === "types" ? "types" : "sources"` — trzecia wartość
(`abilities`) była mapowana na `sources`, więc `showTip` szukał pozycji w liście
CELÓW, nie znajdował i chował dymek. Dotyczyło całej sekcji i całego drugiego
szczebla wejścia przez umiejętność, czyli miejsc, gdzie etykiety są NAJDŁUŻSZE
— a `UX.md §5` opiera na dymku właśnie obsługę uciętych etykiet.

**Zrobione.** `data-list` idzie wprost, przez strażnik `isBreakdownList`, żeby
czwarta lista była błędem kompilacji, a nie cichym pudłem.

### AUDYT‑33 — zmiana metryki rozjeżdża drążenie ✅ NAPRAWIONE ✓
`src/overlay.ts` (`renderMetrics`, `showPreview`, `closePreview`)

Trzy miejsca zerowały `focusSource` ręcznie, bez `focusKind` — mimo że docstring
`clearDrill` mówi „MUSZĄ ginąć razem” i wymienia zmianę metryki jako ścieżkę,
która ma przez niego iść. Zmierzone: nagłówek **„OD KOGO” nad listą
UMIEJĘTNOŚCI**, ta sama lista wyrenderowana dwa razy (12 wierszy zamiast 6),
jedna kopia szara, a pierwszy szczebel nieklikalny.

**Zrobione.** Trzy wywołania `clearDrill()`. Reguła, którą deklarował komentarz,
zaczęła obowiązywać we wszystkich siedmiu miejscach zmieniających ten stan.

### AUDYT‑34 — stan okna z magazynu bez walidacji ✅ NAPRAWIONE ✓
`src/stored-state.ts` (nowy), `src/overlay.ts`, `src/archive.ts`

`loadState` sprawdzał `metric`, `team` i `perTurn`, a geometrię przepuszczał
żywcem z komentarzem „przycina ją `clampToViewport`”. Nie przycina — broni przed
wyjechaniem za ekran, a nie przed `NaN` ani przed liczbą absurdalną. Archiwum
nie sprawdzało niczego. Zmierzone na prawdziwym `Overlay`:

| w magazynie | skutek |
|---|---|
| `{"collapsed":"nope"}` | panel zwinięty (prawdziwy string) |
| `{"width":1e9}` | `width: 1000000000px` — **nakładka przykrywa całą grę razem z uchwytem do zmniejszenia** |
| `{"width":"szeroko","x":"abc"}` | `NaN` przechodzi przez `clampToViewport` (`Math.min(0, NaN)`) → host bez `left` |

Pod tym kluczem może stać zapis starszej albo NOWSZEJ wersji dodatku.

**Zrobione.** `stored-state.ts` z trzema funkcjami (`storedNumber` z granicami,
`storedBoolean`, `storedOneOf`) i `storedRecord`, który odrzuca treść niebędącą
obiektem. Wspólne dla panelu i archiwum. **To jest `R5`.**

### AUDYT‑35 — suma nagłówka sekcji ✅ NAPRAWIONE ✓
`src/overlay.ts` (`renderDetail`)

`total` nie zależało od `focusSource`, więc na drugim szczeblu nagłówek
`CZYM — DIETA-MIÓD` niósł **403 206** (całość bossa), choć wiersze pod nim
sumowały się do 104 005, a udziały do 26 % zamiast 100 %.

**Zrobione.** Lista główna dostaje sumę tego, co WYMIENIA. Sekcja `TYP OBRAŻEŃ`
świadomie zostaje przy sumie postaci — ona faktycznie o niej mówi; że stoi na
drugim szczeblu, jest osobną sprawą (patrz „Do rozstrzygnięcia”).

### AUDYT‑36 — przypis rozbijał liczbę z innego zakresu ✅ NAPRAWIONE ✓
`src/stats.ts`, `src/types.ts`, `src/overlay.ts`

Kwota przechodziła przez filtr składu i wybraną postać, a `dot.types` było
zawsze WALKOWE. Zmierzone: dwie postacie, 300 trucizny i 900 ognia → wejście
w pierwszą dawało **„bez sprawcy: 300 (Ogień 900 · Trucizna 300)”** — nawias
większy od liczby, którą rozbijał.

**Zrobione.** `ActorStats.unattributedDotTypes` — rodzaje zapisane przy
poszkodowanym, tak jak kwota. Przypis bierze je z wybranej postaci albo sumuje
po postaciach przechodzących filtr (`sumKinds`), więc zakres zawsze się zgadza.

### AUDYT‑37 — `mergeStats` nie uzupełniał `side` ✅ NAPRAWIONE ✓
`src/session.ts`

Uzupełniane były `professionCode` i `level` z uzasadnieniem „cecha postaci, nie
walki”, które stosuje się do `side` jeden do jednego. Zmierzone: `current()` →
`[Gracz 0, Wróg 1]`, `total()` → **`[Gracz null, Wróg null]`**, a `matchesTeam`
odrzuca `null` poza „Wszyscy”.

**Zrobione.** `merged.side ??= actor.side` plus test na sumie sesji.

### AUDYT‑38 — `RE_INFO` łykał linię z obrażeniami ✅ NAPRAWIONE ✓
`src/parser.ts`

`^.+ otrzymuje \d+(?: \p{L}+)+\.?$` nie odróżniał „energii” od „obrażeń”.
Zmierzone: `"X otrzymuje 500 obrażeń od trucizny."` → **`info`**, kwota znika,
`unknownLines` zostaje zerem. Ten sam catch‑all, przed którym broni komentarz
przy `RE_MODIFIER`, i wyłom w zasadzie „nieznane jest głośne”.

**Zrobione.** Zasoby wymienione z nazwy (`many`, `energii`, opcjonalnie
„punktów”). Nowy zasób trafi w `unknown` i da się dopisać świadomie.

### AUDYT‑39 — ta sama nazwa po obu stronach 🔴 OTWARTE ✓
`src/stats.ts` (`seats`)

`seats` pomija uczestnika, którego wszystkie klucze są już zajęte, więc jego
`side` nigdy nie zostaje zapisany. Zmierzone przy składzie **z gry**, gdzie
strony są faktem: `roster: Gracz(0), Wilk(0), Wilk(1), Wróg(1)` → `Wilk #1
side 0`, **`Wilk #2 side 0`**. To nie „nie wiadomo” (wtedy `null` i wiersz
znika poza „Wszyscy”) — to twierdzenie o stronie, i jest fałszywe. `opponentOf`
ma na ten przypadek jawny guard; `seats` go nie ma.

**Do rozstrzygnięcia:** `side: null` (uczciwe, tańsze) czy klucz instancji
uwzględniający stronę (dokładniejsze, rusza `seats`). Realne w walkach
grupowych z tym samym typem moba po obu stronach i przy przywoływańcach.

### AUDYT‑40 — `hits` i `misses` liczą ten sam atak ✅ NAPRAWIONE ✓
`src/stats.ts`, `src/types.ts`, `src/overlay.ts`

Atak, w którym broń główna przepadła na uniku, a pomocnicza trafiła, podbijał OBA
liczniki. Zmierzone: `tancerz-vs-tropiciel-pvp` — **12 ataków → ciosy 12,
uniki 2**. Stopka pokazywała `ciosy 12 · uniki 2`, czytający liczył 14 i wyliczał
~17 % uników, których nie było. `types.ts` definiował przy tym `misses` jako
„ataki **zakończone** unikiem" — a te trafiły, więc **kod przeczył własnej
dokumentacji**.

**Dane, na których stanęła decyzja** (16 zrzutów tekstowych korpusu):

| | ile |
|---|---|
| ataki z jakimkolwiek unikiem | 15 |
| z tego pełne (nic nie weszło) | 12 |
| z tego częściowe | **3** |

Wszystkie trzy częściowe należą do JEDNEGO tancerza ostrzy — to jedyna profesja
bijąca w korpusie dwiema broniami w jednym ciosie. Mag też niesie kilka liczb
(zimno + błyskawica), ale żaden jego cios nie został wyunikany, więc nie wiadomo,
czy przy nim unik pada na pojedynczy żywioł. `event.dodged` zgadza się
z `pełne + częściowe` w **1115 na 1115** zdarzeń.

**Zrobione — pełne i częściowe OSOBNO.** `misses` liczy odtąd wyłącznie ataki,
w których nic nie weszło (czyli to, co dokumentacja mówiła od początku), a nowe
`partialMisses` liczy te, w których przepadła część trafień. Rozważane i odrzucone
warianty: sam licznik pełnych (trzy uniki częściowe przestałyby być gdziekolwiek
widoczne, choć log je zgłosił) i mianownik przy starej definicji („uniki 2/12" —
liczba nadal wymaga chwili myślenia).

Panel pokazuje człon o częściowych **tylko wtedy, gdy jest niezerowy**, więc
u profesji jednobronnych wiersz zostaje bez zmian:

```
tancerz:  ciosy 12 · kryt. 1 · uniki 0 (+2 częściowe) · maks. cios 1159 · …
tropiciel: ciosy 6 · kryt. 0 · uniki 2 · maks. cios 882 · …
```

Przy okazji `misses` dostało brakującego strażnika `event.strike`, który `hits`
miał od zawsze — dziś nic nie zmienia (zdarzenia `strike: false` mają
`dodged: false` na sztywno), ale asymetria między dwoma licznikami tej samej
rzeczy prosiła się o regresję.

**Czym przypięte.** Nowy niezmiennik w `stats.test.ts`, per fixture:
`Σ ciosy + Σ uniki == Σ ataków`. Trzyma na całym korpusie i jest właściwym
strażnikiem tej zmiany — dopóki obowiązuje, dwie liczby ze stopki wolno dodać.

**Dokumentacja gry tego nie rozstrzyga** — sprawdzone 2026‑08‑01 w oficjalnej
pomocy („[Mechanika walk](https://pomoc.margonem.pl/index/view,372)"). Artykuł
opisuje unik i blok jako STATYSTYKI, z formułami na przewagę poziomową, ale nie
mówi ani czy unik rozstrzyga się raz na atak, czy na każdą liczbę obrażeń, ani
jak zachowuje się broń pomocnicza. Model „unik bywa częściowy" pochodzi więc
z korpusu (trafienie z `applied === 0` przy fladze `Unik`), a nie z opisu gry.

**Nie badać drugi raz:** decyzja zapadła na powyższych liczbach, nie na przeczuciu,
a pomoc gry została sprawdzona i milczy.

### Drobne, naprawione przy okazji
- **Podpowiedź w dymku kłamała**: „PPM — powrót do składu”, choć PPM zdejmuje
  JEDEN szczebel. To jedyna instrukcja nawigacji w panelu.
- **Dymek meldował „Ciosy 0”** — `AUDYT‑29` zdjęło to z wiersza, nie z dymka.
- **Liczebnik** „1 nierozpoznanych linii” (`A15` deklarował `plural()`).
- **Puste stany** sklejane z mianownika zakładki („Brak danych: my.”) → zdania.
- **Pusty stan rozbicia zabierał liczniki** `ciosy · kryt. · uniki · tury`,
  prawdziwe niezależnie od metryki.
- **`typeFamily`/`typeDisplay` bez pamięci** — wołane ~3 000 razy na `aggregate`,
  a `aggregate` leci przy każdej linii logu. Memoizacja: **2,63 → 1,94 ms**.
- **Brakujący `meta.json`** przy `2026-07-18_lowca-vs-druzyna` — jedyny fixture
  bez opisu, wbrew konwencji „fixture jest dowodem”.

### Zapisane, nie naprawiane
- **Kolizje etykiet.** Postać nazwana `Bez sprawcy` skleja się z pulą (zmierzone:
  600 zamiast 500 + 100); potwór `Locha #1` z syntetyczną instancją (150 zamiast
  100 + 50). Nicki Margonem tego nie dopuszczają. Zamiana etykiet DoT‑ów na
  rzeczowniki podniosła ryzyko trzeciej ścieżki (jednowyrazowe umiejętności),
  więc doszła **czujka**: test przelotowy po korpusie.
- **Koszt potoku** — `parse` 4,0 + `aggregate` 2,6 + **`render` 6,3** ≈ 13 ms na
  porcję logu, w wątku gry. `SOLID §4.10` zna to od strony parsera; liczby dla
  `render` są nowe i mówią, że sam przyrostowy parser nie wystarczy.
- **`overlay.ts` urósł do 2861 linii** (o 400 od zapisu „trzeba go ciąć”).
- **Osiem pól parsowanych i nieczytanych**, nie cztery jak mówi `SOLID §4.22`.
- **Dostępność**: fokus ginie przy renderze (zakładki to nowe węzły), wiersz ma
  20 px wobec 24 px z WCAG 2.2 SC 2.5.8, `aria-label` zastępuje widoczny napis
  (SC 2.5.3), brak `aria-live` — komunikat o **porażce schowka** jest niesłyszalny.
- **`archive.ts` nie korzysta z delegacji `data-action`**, a przerysowuje się
  z zegara — drugi klik w ✕ potrafi trafić w świeży węzeł.

---

## F2. Nazewnictwo i pozycje bez sprawcy (dopisane 2026‑08‑01)

Cztery usterki jednej rodziny: panel mówił coś, czego nie miał na myśli. Wszystkie
widać wprost na zrzutach w `docs/screenshots/`, a żadna nie miała ID w tym pliku
ani w `UX-POPRAWKI.md` — to była luka w rejestrze, nie rozstrzygnięta sprawa.

### AUDYT‑26 — `unattributedHealing` to JEDNA liczba ✅ NAPRAWIONE ✓
`src/stats.ts`, `src/session.ts`, `src/overlay.ts` (stopka)

**Problem.** `unattributedDotDamage` dzieli się na stronę POSZKODOWANEGO
(`{mine, enemy, loose}`), bo tę log podaje. Leczenie bez leczącego było przy tym
gołym `number` — więc filtr `My`/`Oni` pokazywał **tę samą kwotę na obu
zakładkach**, a w widoku postaci przypis znikał zupełnie (warunek `!focused`),
choć to właśnie ona te punkty dostała. Zanotowane w `README.md`, bez ID.

**Zrobione.** Wspólny typ `BySide` dla obu pul, `ActorStats.unattributedHealingReceived`
jako lustro `unattributedDotTaken`, jeden helper `visible()` w stopce liczący
widoczny wycinek dla OBU przypisów — dwie kopie tej reguły rozjechałyby się
niezauważone. To poprawka **prezentacji, nie atrybucji**: leczącego nadal nie
zgadujemy (`README.md` §„Leczenie bez leczącego").

### AUDYT‑27 — jedna rodzina obrażeń pod dwiema nazwami ✅ NAPRAWIONE ✓
`src/types.ts` (`typeDisplay`, `dotLabel`), `src/stats.ts`

**Problem.** Sekcja `TYP OBRAŻEŃ` wymieniała SUROWE etykiety z dwóch niezależnych
źródeł: żywioł z klasy CSS mówi „ogień", a tykający efekt „od ognia". Ta sama
rodzina stała więc jako **dwa wiersze, w tej samej barwie**, obok `fizyczne`,
`dystansowe` i `po zranieniu` — dziewięć wierszy w dwóch gramatykach.
`typeFamily()` wiedziało o tym od `3814a42`, ale czytała je tylko paleta.

**Zrobione.** Przekrój idzie po RODZINACH (`typeDisplay`), tykające efekty
dostają mianownik (`dotLabel`). Rodzaj bez rodziny nie dostaje wymyślonej nazwy:
`globalne` → `Nieznany (obszarowe)`, surowe `dmgo` → `Nieznany (dmgo)`. U bossa
z Hildur: dziewięć wierszy → siedem, `Ogień` = cios 38 005 + tyknięcia 556.
Rozróżnienie zwarcie/dystans żyje dalej w parserze i jest tam testowane —
znikło z RANKINGU, nie z danych.

### AUDYT‑28 — pozycja bez sprawcy udaje postać ✅ NAPRAWIONE ✓
`src/stats.ts` (`UNATTRIBUTED_SOURCE`), `src/overlay.ts`

**Problem.** Tykający efekt bez sprawcy wchodził na pierwszy szczebel
`takenFromBy` pod własną nazwą, więc „od trucizny" (40 435) i „od ognia" (556)
siedziały **w środku rankingu `OD KOGO`, między postaciami**, z szarym paskiem.
Do tego dawały się kliknąć w ślepy zaułek: szczebel niżej powtarzał tę samą
nazwę. `leadsDeeper` pilnował tego wyłącznie w sekcji `CZYM (ŁĄCZNIE)` — lista
główna nie dostawała predykatu `drillable` w ogóle, wbrew `UX.md §6`.

**Zrobione.** Wszystko bez sprawcy zbiera się pod jedną pozycją `Bez sprawcy`,
stojącą na końcu listy bez względu na kwotę (`byAmountUnattributedLast`, wspólny
z sumowaniem sesji), odciętą kreską i kreskowanym paskiem. Wejście w nią mówi,
CO w niej siedzi. Lista główna dostała ten sam predykat `drillable` co sekcja
umiejętności, a kursor przestał obiecywać `help` tam, gdzie klik działa.

### AUDYT‑29 — licznik meldujący zero przy niezerowej kwocie ✅ NAPRAWIONE ✓
`src/overlay.ts` (`times`, `timesDealt`)

**Problem.** Akcje zadające linią „`-N obrażeń otrzymał(a) X`" (`strike: false`)
nie są ciosami i słusznie nie są jako ciosy liczone — ale wiersz mówił przez to
„`266 040 (79%) ×3 · 0 c.`", czyli licznik zaprzeczał kwocie obok. Na szczeblu
CELÓW, gdzie etykietą jest nazwa postaci i żadne użycie się nie dopasowuje,
wychodziło z tego samo „`×0`" przy 27 945 obrażeń.

**Zrobione.** Człon `· N c.` tylko przy `hits > 0`; sam licznik ciosów znika,
gdy ciosów nie było — `null` znaczy w `appendBreakdown` dokładnie „w tej pozycji
ta liczba nie ma nic do powiedzenia", i to jest tu prawda.

---
## G. Otwarte z poprzednich rund

Bez nowych ID — sam wskaźnik, żeby ten dokument był pełną migawką otwartych
spraw, a nie tylko listą nowych.

| Gdzie | Co |
|---|---|
| ~~`UX-POPRAWKI.md A14`~~ | ✅ **2026‑08‑01** — `.bar` na `opacity: .55` + nasadka w pełnej barwie; próg pilnuje test kontrastu. `AUDYT‑14` (odznaka profesji) **zostaje otwarte** i przestaje być z tym spięte. |
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
