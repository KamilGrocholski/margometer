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

> ⚠️ **To ostrzeżenie samo się zestarzało — i to jest jego najlepszy dowód**
> (`AUDYT‑46`, 2026‑08‑02). „2628" było prawdą przez jeden dzień; dziś
> `overlay.ts` ma **3181 linii**, czyli o 725 więcej niż liczba, przy której
> napisano „trzeba go ciąć". Lokalizacje z sekcji A–F odnoszą się do `19892b4`
> i po tylu rundach **nie prowadzą tam, gdzie mówią** — czytaj je jako nazwy
> funkcji, nie jako numery. Zweryfikowane na `740f3c6` są wyłącznie te
> w sekcji `H`.

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
`AUDYT‑39` i `AUDYT‑40` zamknięte 2026‑08‑01 — **cała sekcja `F3` jest
zamknięta**. Tego samego dnia poszły też trzy najstarsze otwarte pozycje UX:
`AUDYT‑17`, `18` i `19`. Dwie z nich okazały się przy tym opisane nieściśle:
`17` był w jednej trzeciej naprawiony od dawna (puste stany), a `19` opisywał
połowę usterki (menu ginęło nie tylko nad archiwum, ale i w panelu na najwyższym
szczeblu). Wniosek na przyszłość: **wpis sprzed tygodni sprawdza się w kodzie,
zanim się go naprawi** — bo opisuje stan, którego może już nie być, albo mniejszy
niż faktyczny. Poszło też `AUDYT‑14` (odznaka profesji) — czekało na „decyzję
wizualną razem z `A14`", a `A14` domknęło się tego samego dnia rano, więc blokada
zniknęła sama. Warto z tego zapamiętać, że **pozycja „zablokowana decyzją" bywa
odblokowana przez cudzą naprawę i nikt jej wtedy nie odznacza** — przy przeglądzie
opłaca się sprawdzić, czy blokada nadal istnieje.

**Dopisane 2026‑08‑02 (sekcja `H`):** `AUDYT‑41`…`AUDYT‑55` — runda wydania
(`356b79f`, `c726a24`, `e719485`, `c39d35b`) nie była dotąd oglądana przez żaden
audyt, a to kod, którego awaria jest cicha z definicji: dodatek przestaje się
aktualizować albo nie startuje, bez ani jednego komunikatu. Wszystkie poza
`AUDYT‑52` (zrzuty ekranu — wymagają wejścia do gry) naprawione w tej samej
rundzie. Dwie z nich — `53` i `54` — to **regresje rundy `c39d35b`**, znów
znalezione po commicie; zasada „przegląd PRZED commitem" ma teraz trzeci dowód.

**Zamknięte 2026‑08‑03:** `AUDYT‑6` i `AUDYT‑25` — obie **przez USUNIĘCIE, nie
przez wykonanie**. Czekały na decyzję właściciela repo i decyzja brzmiała: suma
sesji, oś tur i skupienie ognia są porzucone. Wykonanie odbiegło przez to od
propozycji zapisanej przy obu wpisach; jest to przy nich powiedziane wprost.

Otwarta zostaje **jedna** pozycja: `AUDYT‑52` (nieaktualne zrzuty w `README`),
czekająca na wejście do gry.

**Dopisane 2026‑08‑05 (sekcja `I`):** `AUDYT‑56`…`AUDYT‑84` — przegląd rundy
**przed** commitem, czyli pierwszy raz zgodnie z zasadą, którą trzy poprzednie
audyty ustaliły po fakcie. Runda leżała w drzewie roboczym: `src/zrzut.ts`,
`src/opcje.ts`, powrót `tests/fixtures/`, przebudowa `tools/walka.ts`. Audyt był
zamówiony jako sam zapis, więc sekcja powstała **w całości otwarta**; osobnymi
decyzjami domknięto potem **WSZYSTKIE 29 pozycji**: siedem 🔴 (`AUDYT‑56`…`62`),
trzynaście 🟡 (`63`…`75`) i dziewięć ⚪ (`76`…`84`). Doszła jedna spoza audytu —
`AUDYT‑85`, **regresja samych napraw**, złapana przeglądem drzewa roboczego
PRZED commitem — a przy okazji `AUDYT‑86`. To czwarty dowód zasady „przegląd
przed commitem"; trzy poprzednie zebrano po fakcie, ten pierwszy raz przed.

⚠️ **Zamknięte ≠ bez reszty.** Trzy rzeczy zostają nazwane przy swoich wpisach
i nie mają terminu: `init` po przeładowaniu strony i `close` bez `init`
(`AUDYT‑56` — brak materiału), regułę leczenia w świadku trzyma dziś wyłącznie
test syntetyczny (`AUDYT‑61` — brak fixture'a z leczeniem w środku walki),
a zapis pliku na dysk nie ma i nie będzie miał testu (`AUDYT‑69`). Cztery
pozycje `ROADMAP.md` czekające na nowy materiał ta runda też otwiera dalej.
Wzorzec, który przez nie przechodzi, jest jeden i wart osobnego zdania:
**cztery z pięciu nietrafionych liczb to liczby przepisane ręką z pomiaru
zrobionego na materiale, który do repo nie wszedł** — czyli praktyka, którą ta
sama runda opisuje jako przyczynę fałszywego buildu i której w tym samym
commicie zakazuje.

Opisy zostają w czasie teraźniejszym, bo opisują STAN SPRZED
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
| ~~AUDYT‑14~~ | Odznaka literowa profesji nie istnieje | 🔴 | M | **✅** ✓ |
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
| ~~AUDYT‑39~~ | Ta sama nazwa po obu stronach → fałszywa strona dla obu | 🔴 | M | **✅** ✓ |
| ~~AUDYT‑40~~ | `hits` + `misses` liczą ten sam atak przy uniku częściowym | ⚪ | XS | **✅** ✓ |
| ~~AUDYT‑17~~ | Wielkie/małe litery i puste stany bez odmiany | ⚪ | S | **✅** ✓ |
| ~~AUDYT‑18~~ | ✕ znaczy dwie rzeczy; dymek obiecuje nie to, co trzeba | ⚪ | S | **✅** ✓ |
| ~~AUDYT‑19~~ | PPM zabiera menu przeglądarki nad listą archiwum | ⚪ | XS | **✅** ✓ |
| ~~AUDYT‑22~~ | `destroy()` nie sprząta i nie jest wołane | ⚪ | XS | **✅** |
| ~~AUDYT‑41~~ | Nic w dodatku nie mówi, z której wersji pochodzi zgłoszenie | 🔴 | XS | **✅** ✓ |
| ~~AUDYT‑53~~ | Zamknięte archiwum dolicza dalej — 193 ms po zniknięciu okna | 🔴 | XS | **✅** ✓ (regresja) |
| ~~AUDYT‑42~~ | `@exclude` niesymetryczne; test nie ma jak tego złapać | 🟡 | XS | **✅** ✓ |
| ~~AUDYT‑43~~ | Sonda pomocy odpowiada z zapisu bez daty ważności | 🟡 | S | **✅** ✓ |
| ~~AUDYT‑45~~ | Pokrycie liczone tylko na żądanie, więc nikt go nie ogląda | 🟡 | S | **✅** ✓ |
| ~~AUDYT‑46~~ | Ostrzeżenie o rozjeździe numerów linii samo się rozjechało | 🟡 | XS | **✅** ✓ |
| ~~AUDYT‑47~~ | `§G` trzyma jako otwarte to, co `SOLID.md` ma za zamknięte | 🟡 | XS | **✅** ✓ |
| ~~AUDYT‑51~~ | `EMPTY_STATS`: przeniesiona definicja, nie zależność | 🟡 | XS | **✅** ✓ |
| ~~AUDYT‑54~~ | Skasowanie jednego nagrania wyrzuca cache całego archiwum | 🟡 | XS | **✅** ✓ (regresja) |
| ~~AUDYT‑44~~ | Przepis na listę otwartych specek wypisuje szablon | ⚪ | XS | **✅** ✓ |
| ~~AUDYT‑48~~ | „Jedno `any`" to trzy; `§1` cytuje plik, w którym tego nie ma | ⚪ | XS | **✅** ✓ |
| ~~AUDYT‑49~~ | „Fixture'y mają dwa pliki" — ma je 5 z 21 | ⚪ | XS | **✅** ✓ |
| ~~AUDYT‑50~~ | Mapa modułów pomija `confirm.ts` | ⚪ | XS | **✅** ✓ |
| ~~AUDYT‑55~~ | Sonda odsiewa trafienia po prefiksie fragmentu | ⚪ | XS | **✅** ✓ |
| AUDYT‑52 | Zrzuty w `README` same przyznają się do nieaktualności | ⚪ | S | ✓ |

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

### AUDYT‑6 — Suma sesji nie ma żadnego wyjścia w UI ✅ ZAMKNIĘTE 2026‑08‑03 ✓
`src/overlay.ts:1378` (`statsJson`), `:975-990`, `src/session.ts:299` (`total`),
`docs/ROADMAP.md:52`

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

**Zrobione — INACZEJ, niż mówi propozycja wyżej.** Wpis kazał najpierw napisać
spec `UX.md §8`, a potem rysować. Właściciel repo rozstrzygnął odwrotnie:
**zakładki nie będzie, a suma sesji wychodzi z kodu.** Zamknięcie przez
usunięcie, nie przez wykonanie.

Co zeszło z drzewa: `mergeStats` (~100 linii) wraz z pięcioma pomocnikami
scalania i `copyActor`, pola `archivedTotal`/`totalStats`/`active`, `total()`,
`reset()`, typ `SessionStats`, drugi argument `Overlay.render` i klucz `session`
w JSON‑ie ze schowka. `src/session.ts`: **362 → 88 linii**.

Uzasadnienie, które warto zapamiętać: ta funkcja miała JEDNO wyjście do
użytkownika i było nim to, na co narzeka akapit „Problem" — klucz w JSON‑ie
przy przycisku, który o nim nie mówi. Płaciła natomiast całkiem sporo kodu
i to on generował usterki: `§4.11`, `AUDYT‑37`, `AUDYT‑5`. **Funkcja bez
wyjścia w UI nie jest tania dlatego, że nikt jej nie widzi — jest droga
dokładnie z tego powodu:** żaden z tych trzech błędów nie objawił się
użytkownikowi, każdy znalazł audyt i każdy kosztował rundę.

Kaskada: `SOLID R3` (deklaratywny `mergeStats`) stał się bezprzedmiotowy,
`R1` stracił połowę uzasadnienia, `ROADMAP ⏸ „Zakładka zakresu"` schodzi.
Kod wraca z historii, gdyby decyzja się odwróciła.

**Docelowo.** → zamknięte tutaj; `ROADMAP.md` zdjął `⏸`

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

### AUDYT‑14 — Odznaka literowa profesji NIE ISTNIEJE ✅ NAPRAWIONE ✓
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

**Zrobione 2026‑08‑01 — blokada zniknęła sama.** Wpis czekał na „decyzję
wizualną razem z `A14`", a `A14` zostało domknięte tego samego dnia rano
(pasek na `opacity: .55` plus nasadka `.bar-cap`). Decyzja o wyglądzie wiersza
była więc już podjęta i odznaka mogła wejść bez drugiej rundy ustaleń.

**Zderzenie z zakazem „nie robić z rankingu tabeli" rozstrzygnięte tak, jak
zapowiadał ten wpis** — i było realne, nie teoretyczne: pierwsza wersja dokleiła
odznakę jako czwarte rodzeństwo w `.row-text` i **natychmiast położyła test**
`wiersz to ranking, nie tabela`, który wymaga dokładnie trzech komórek. Dobrze,
że ten test istniał. Odznaka siedzi więc W ŚRODKU `.label`.

**Rysuje ją `::before` z `attr(data-prof)`, nie osobny węzeł.** Druga wersja
wstawiała `<span>` do etykiety — komplet testów przechodził, ale `textContent`
wiersza zaczął zwracać „HŁowca głów z psk". Pseudoelement trzyma literę poza
strumieniem tekstu: nazwa zostaje nazwą dla kodu, testów i schowka, a odznaka
jest warstwą nad nią. Barwy jadą zmiennymi CSS (`--prof-bg`, `--prof-ink`),
bo do pseudoelementu nie sięga styl inline.

**Barwa litery jest LICZONA, nie wpisana.** `professionInk` wybiera ciemną albo
białą — tę z lepszym kontrastem do tła odznaki. Jednej barwy dla wszystkich
sześciu profesji NIE MA i nie jest to kwestia doboru: przy zieleni łowcy
(`#008300`) nawet czysta czerń daje **4,25**, czyli poniżej AA, a biel przy
pozostałych pięciu schodzi do 3,1–3,9. Stąd jedna biała litera pośród ciemnych —
niespójność wizualna jest tu ceną progu 4,5:1. Liczone, a nie stablicowane, żeby
przy najbliższej zmianie palety próg nie rozjechał się po cichu.

**Czym przypięte.** Dwa testy: każda postać ze znaną profesją ma `data-prof`
z właściwą literą, a etykieta jest DOKŁADNIE nazwą (porównanie pełne — „nie
zawiera litery" nie zadziała, bo nazwy same je niosą, np. „Hildur Muza Śmierci");
oraz kontrast litery ≥ 4,5:1 na każdej barwie profesji, łącznie z barwą „Inni"
i kodem nieznanym. Oba sprawdzone mutacją. `UX.md §6` dopowiedziane — dawne
zdanie „barwa paska mówi, kto jest czym" było fałszywe dla daltonistów i zostało
zastąpione.

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

### AUDYT‑17 — Wielkie/małe litery i puste stany bez odmiany ✅ NAPRAWIONE ✓
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

**Zrobione 2026‑08‑01 — ale zastane w połowie.** Trzeci punkt (puste stany) był
naprawiony JUŻ WCZEŚNIEJ i nikt tego nie odnotował: `EMPTY_TEAM`/`EMPTY_BREAKDOWN`
to od dawna gotowe zdania, a komentarz nad nimi opisuje wprost starą, złą formę
z `toLowerCase()`. Wpis wisiał jako otwarty za coś, co już nie istniało.

Pierwszy punkt też okazał się węższy, niż brzmiał. Przelot po WSZYSTKICH napisach
wyrenderowanego panelu (nie po kodzie): stany to `Zadane`, `Otrzymane`,
`Leczenie`, `Wszyscy`, `My`, `Oni` — wszystkie wielką; jedyna akcja w tym rzędzie,
`na turę` — małą. Reguła więc obowiązywała, tylko nie była nigdzie zapisana.

Realną usterką był drugi punkt i to jego naprawiłem: `renderRecordBar` niósł
w TEJ SAMEJ szczelinie „nagrywam — czekam na walkę" obok „Brak miejsca
w przeglądarce — nagrywanie wyłączone". Pierwsze poszło wielką literą, bo to
komunikat, nie akcja. Reguła jest teraz spisana w `UX.md §1.6`, wraz z wnioskiem
ogólniejszym, który wyszedł z obu punktów naraz: **komunikatu nie składa się
z etykiety** — polski wymaga wtedy przypadka, a `toLowerCase()` go nie zna.

**Czym przypięte.** Test „oba komunikaty paska zaczynają się tak samo — wielką
literą" pyta o obie gałęzie naraz, więc rozjazd w tej szczelinie nie wróci.

### AUDYT‑18 — ✕ znaczy dwie rzeczy; dymek obiecuje nie to, co trzeba ✅ NAPRAWIONE ✓
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

**Zrobione 2026‑08‑01, w trzech kawałkach.**

*Glif.* Kasowanie mówi teraz `usuń`, nie `✕`. Kosza NIE użyłem świadomie: w
większości fontów jest emoji — kolorowy i inny na każdym systemie, w panelu
złożonym wyłącznie ze znaków monochromatycznych. Słowo rozwiązuje kolizję
lepiej niż drugi glif, a przy jedynym nieodwracalnym przycisku w dodatku
odrobina tarcia jest zaletą. Stan pytania („na pewno?") i tak był już słowem.

*Dymek na wierszu postaci.* Człon „PPM — powrót" pojawia się tylko wtedy, gdy
`canGoBack()` mówi, że jest z czego wracać. Wcześniej obiecywał powrót donikąd
na najwyższym szczeblu.

*Dymek na wierszu rozbicia.* Dokłada „LPM — głębiej", gdy wiersz nie jest
liściem. Stan bierze z `dataset.leaf` TEGO wiersza, bo to on jest źródłem prawdy
(patrz `appendBreakdown`) — sekcja bywa drążalna, a pojedynczy wiersz i tak
liściem. Milczenie o drodze w dół czytało się jak „nie ma tam nic".

Brzmienie „o szczebel wyżej" zostało nietknięte, choć krótsze „wyżej" pasowałoby
lepiej: pilnuje go test z rundy `AUDYT‑40` i nie warto osłabiać strażnika
zapisanej już usterki dla estetyki.

**Czym przypięte.** Trzy testy dymka (najwyższy szczebel bez PPM; wiersz
drążalny z LPM; liść bez LPM) plus test „kasowanie i zamykanie nie dzielą tego
samego znaku", napisany na ZASADĘ, nie na etykietę — wolno je zmienić, nie wolno
ich zrównać. Wszystkie sprawdzone mutacją.

### AUDYT‑19 — PPM zabiera menu przeglądarki nad listą archiwum ✅ NAPRAWIONE ✓
`src/overlay.ts:954-965`

**Problem.** `contextmenu` jest przechwytywany na CAŁYM shadow roocie, z jednym
wyjątkiem dla pól edytowalnych (dołożonym w `A12`). Nad listą archiwum `back()`
nie ma czego zdjąć, więc użytkownik traci natywne menu bez żadnego zysku.

**Propozycja.** Rozszerzyć wyjątek: przechwytywać PPM tylko wewnątrz panelu,
gdzie drążenie w ogóle istnieje. **Koszt XS.**

**Docelowo.** → `UX-POPRAWKI.md` jako `A28`

**Zrobione 2026‑08‑01 — i usterka była SZERSZA, niż mówił ten wpis.** Opis
wskazywał archiwum, ale `preventDefault()` leciał bezwarunkowo, więc menu ginęło
także w samym panelu **na najwyższym szczeblu**, gdzie `back()` wychodzi bez
efektu. Zabranie menu bez dania czegokolwiek w zamian to czysta strata i tam,
i tam.

Stąd dwa warunki, oba konieczne: PPM przechwytujemy tylko wewnątrz `.panel`
(archiwum rysuje się w tym samym shadow roocie, ale poza nim) **i** tylko gdy
`canGoBack()`. Kolejność nie jest kosmetyką: gdyby pytać wyłącznie o szczebel,
to po zejściu w postać i otwarciu archiwum prawy przycisk NAD ARCHIWUM
zdejmowałby szczebel w niewidocznym panelu pod spodem.

Wyjątek na pola tekstowe (`editableUnder` z `A12`) zniknął jako niepotrzebny —
pole wklejania logu leży w `.archive`, więc nowy warunek obejmuje je z zapasem.
Sam wyjątek i tak nie wystarczał: nad LISTĄ nagrań nie ma czego wpisywać,
a menu i tak się należy.

**Przy okazji wyszedł dług w testach.** Cztery testy wysyłały `contextmenu` na
sam shadow root, czyli na cel, jakiego prawdziwe kliknięcie nigdy nie ma —
przechodziły tylko dlatego, że handler był bezwarunkowy. Chodzą teraz przez
`rightClick()`, tym samym szykiem co starszy test archiwum, który od początku
celował w prawdziwy element.

**Czym przypięte.** Trzy testy: menu zostaje na najwyższym szczeblu, menu
zostaje nad listą nagrań (i nie zdejmuje przy tym szczebla w panelu pod spodem),
oraz stary test pola tekstowego. Sprawdzone mutacją.

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

### AUDYT‑25 — `deaths` i `matrix` liczone dla nikogo ✅ ZAMKNIĘTE 2026‑08‑03 ✓
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

**Zrobione.** Warunek zdjęcia był w propozycji postawiony wprost („albo wraca
cała funkcja i pola mają odbiorcę, albo znika i pola idą za nią") i właściciel
repo wybrał drugie: **oś tur i skupienie ognia są porzucone, nie wstrzymane.**

Ze `stats.ts` zeszły oba pola, ich zaślepki w `EMPTY_STATS`, typy `Death`
i `DamageEdge`, mapa `edges` z `addEdge`, `observeDeath` z `fallen` i wszystkie
wywołania — 50 linii. `sourceHpPct`/`targetHpPct` ZOSTAJĄ (czyta je
`instanceResolver`, rozdzielając duplikaty nazw po rosnącym życiu) i `timeline`
też (liczy tury dla panelu i archiwum) — jedno i drugie sprawdzone przed
usunięciem, nie po.

Niezmienniki przeliczone po zmianie na całym korpusie tekstowym: zero rozjazdów.
`Σ timeline == Σ zadanych` jest tu strażnikiem nieprzypadkowym — `addToTurn`
i `addEdge` stały obok siebie w dwóch miejscach, więc cięcie o linijkę za dużo
by go zapaliło.

**Docelowo.** → zamknięte tutaj; `ROADMAP.md` zdjął `⏸`

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

### AUDYT‑39 — ta sama nazwa po obu stronach ✅ NAPRAWIONE ✓
`src/stats.ts` (`seats`), `src/types.ts`, `src/session.ts`, `src/overlay.ts`

`seats` pomija uczestnika, którego wszystkie klucze są już zajęte, więc jego
`side` nigdy nie zostaje zapisany. Zmierzone przy składzie **z gry**, gdzie
strony są faktem: `roster: Gracz(0), Wilk(0), Wilk(1), Wróg(1)` → `Wilk #1
side 0`, **`Wilk #2 side 0`**. To nie „nie wiadomo” (wtedy `null` i wiersz
znika poza „Wszyscy”) — to twierdzenie o stronie, i jest fałszywe. `opponentOf`
ma na ten przypadek jawny guard; `seats` go nie ma.

**Wybór rozstrzygnął pomiar, nie gust.** Klucz instancji uwzględniający stronę
okazał się NIEWYKONALNY: numer instancji nadaje `track()` — heurystyka śledząca
spadki HP, numerująca w kolejności, w jakiej log ujawnia postacie. Ta kolejność
nie ma nic wspólnego z kolejnością składu, więc „Wilk #1” znaczy tylko „pierwszy
wilk, którego log pokazał”. Przypisanie mu strony z pierwszego wpisu składu
byłoby fałszywą precyzją. Stąd `side: null` — i to dla **każdej** instancji
takiej nazwy, także pierwszej: linia `Wilk(80%)` nie mówi, czy oberwał nasz,
czy ich. Dokładnie zasada, którą `opponentOf` stosował od dawna.

**Usterka jest utajona — korpus jej nie widzi.** Przelot po **wszystkich 20**
fixture'ach (17 przez `raw.txt`, 3 tylko z DOM-u): **zero** z nazwą po obu
stronach, **trzy** ze zdublowaną nazwą po jednej stronie
(`Wieczornica`, `Gnoll łucznik`, `Locha`). Te trzy są strażnikiem przed
nadgorliwością: dublet po jednej stronie stronę ZACHOWUJE, bo tam nie ma
wątpliwości. Naprawa stoi więc na teście syntetycznym, nie na korpusie.

**Przy okazji wyszła druga usterka, i to na liczbach.** `opponentOf` szuka
sprawcy tykającego efektu przez wykluczenie („po drugiej stronie stoi dokładnie
jeden”). Wiersz o nieznanej stronie MOŻE być przeciwnikiem, więc przestaje być
„dokładnie jeden”. Zmierzone na tym samym składzie, trucizna tykająca na Graczu:

| | `Wróg.damageDealt` | bez sprawcy |
|---|---|---|
| przed | **80** (50 ataku + 30 trucizny) | 0 |
| po | 50 | `mine: 30` |

Wrogi Wilk mógł zatruć tak samo jak Wróg — przed naprawą całość szła na konto
Wroga. To nie jest kosmetyka odznaki ze stroną, tylko poprawka obrażeń.

**Regresja, którą naprawa sama wprowadziła — i jej naprawa.** Filtr rankingu
pytał `actor.side !== null`, traktując to jako „czy jest w składzie”. Zastępnik
przestał działać w chwili, gdy uczestnik składu może nie mieć strony: `Wilk #2`
(zero liczb w całej walce) znikał z panelu całkiem, choć jego istnienie jest
faktem. Brak wiersza czyta się jak „nie ma takiej postaci” — czyli fałsz
w drugą stronę. Stąd nowe `ActorStats.inRoster`, jawnie odpowiadające na to
pytanie; `side` odpowiada odtąd wyłącznie na swoje. `mergeStats` bierze je przez
`||=`, bo wystarczy jedna walka sesji ze składem. Archiwum nie wymaga migracji:
nagrania trzymają surowy TEKST, więc odtworzenie liczy wszystko od nowa.

**Czym przypięte.** Trzy testy w `stats.test.ts` (nazwa po obu stronach → `null`;
dublet po jednej → strona zostaje; trucizna traci przypisanie) i jeden
w `overlay.test.ts` (pusty wiersz zostaje, ale tylko w „Wszyscy”). Sprawdzone
mutacją: po cofnięciu naprawy padają dwa pierwsze i ten z panelu. Trzeci
przechodzi w obu wersjach z premedytacją — jego zadaniem jest nie dopuścić, żeby
`null` rozlało się na dublety po jednej stronie.

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

**SPROSTOWANIE 2026‑08‑01 — dokumentacja gry rozstrzyga to wprost.** Stało tu
zdanie odwrotne („artykuł nie mówi ani czy unik rozstrzyga się raz na atak, ani
jak zachowuje się broń pomocnicza”) razem z adnotacją „nie badać drugi raz”.
Było nieprawdziwe. „[Mechanika walk](https://pomoc.margonem.pl/index/view,372)”
mówi:

> „Zdarzenie powoduje zniwelowanie obrażeń od **broni głównej** przeciwnika,
> **w obrębie ataku**, do zera.”
>
> „**Obrażenia od broni pomocniczej nie mogą zostać uniknięte** — atak nigdy nie
> chybi. Oznacza to, że zdarzenia Głęboka rana pomocnicza, Cios krytyczny
> pomocniczy nie mogą być zniwelowane poprzez zajście zdarzenia uniku.”

**Naprawa się broni** — model z korpusu („atak zeruje broń główną, pomocnicza
może wejść”) jest dokładnie tym, co opisuje pomoc, więc rozdzielenie `misses`
i `partialMisses` ma odtąd uzasadnienie w źródle, a nie tylko w trzech
obserwacjach. Zmienia się status DOWODU, nie zachowanie kodu.

**Jak powstał błąd** — bo to jest tu ważniejsze niż samo sprostowanie: artykuł
sprawdzono narzędziem, które streszcza (`WebFetch`), a ono na tym adresie oddaje
praktycznie sam spis treści. Ten sam artykuł pobrany `curl`-em to 669 kB i 399
tys. znaków tekstu. Fałszywy negatyw wyglądał jak fakt, bo miał datę, i zamknął
temat adnotacją „nie badać drugi raz”. Procedura, która ma to blokować:
[`MECHANIKA.md`](MECHANIKA.md); sonda: `bun tools/pomoc.ts "Unik ( evade )"`.

**Wniosek ogólny:** „nie badać drugi raz” wolno napisać dopiero wtedy, gdy przy
zapisie stoi METODA, którą da się powtórzyć — nie sama data.

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
choć to właśnie ona te punkty dostała. Zanotowane w `DECYZJE.md`, bez ID.

**Zrobione.** Wspólny typ `BySide` dla obu pul, `ActorStats.unattributedHealingReceived`
jako lustro `unattributedDotTaken`, jeden helper `visible()` w stopce liczący
widoczny wycinek dla OBU przypisów — dwie kopie tej reguły rozjechałyby się
niezauważone. To poprawka **prezentacji, nie atrybucji**: leczącego nadal nie
zgadujemy (`DECYZJE.md` §„Leczenie bez leczącego").

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

## H. Wydanie, pokrycie i rejestry (audyt 2026‑08‑02)

Runda wydania (`356b79f` → `c39d35b`) dołożyła projektowi kanał dostawy: nagłówek
z `@downloadURL`/`@updateURL`, dwa workflow GitHuba, `CHANGELOG.md` dla
użytkownika, jedno źródło fazy projektu i leniwe podsumowania w archiwum.
**Żadnego z tych plików nie oglądał audyt.** Ta sekcja patrzy właśnie tam plus na
rozjazdy rejestrów wobec kodu; `stats.ts` i `overlay.ts` zostają na kolejną rundę
— były przeorane w `F3`.

Stan wyjściowy: brama zielona (675 pass / 0 fail / 3 602 asercje), drzewo czyste,
`HEAD = 740f3c6`, tag `v0.3.0` na `dca0a22`. Po rundzie: **696 pass / 0 fail /
3 649 asercji**.

### AUDYT‑41 — nic nie mówi, z której wersji pochodzi zgłoszenie 🔴 XS — ✅ NAPRAWIONE ✓
`src/overlay.ts` (`statsJson`, nagłówek), `src/version.ts` (nowy)

**Problem.** `grep -rn "version" src/` dawał **zero trafień**. Skopiowany JSON
niósł `tool`, `at` i `source` — bez numeru wersji; panel nie pokazywał go nigdzie.
Tymczasem `README.md:17‑18` i `PHASE_NOTE` (idzie w treść KAŻDEGO wydania) proszą
wprost o przysyłanie logów z zepsutych walk, a od `0.3.0` dodatek **aktualizuje
się sam** — więc nadawcy siedzą na różnych wersjach i żaden tego nie powie.
W projekcie w fazie alfa zgłoszenie bez wersji jest najdroższym rodzajem
zgłoszenia: nie da się rozstrzygnąć, czy dotyczy czegoś już naprawionego.

**Zrobione.** `src/version.ts` bierze numer z `package.json` — tą samą drogą, co
`banner()` dla `@version`, więc kopii nie ma. Numer stoi w nagłówku panelu (widać
go na zrzucie ekranu, a tak przychodzi połowa zgłoszeń) i w JSON‑ie, przed datą.

**Import NAZWANY, nie domyślny — różnica zmierzona.** `import pkg from` wkleja do
bundle'a CAŁY `package.json` ze skryptami i `devDependencies` (157 686 B);
`import { version } from` zostawia jedną linię `var version = "0.3.0"`
(157 026 B). Do pliku, który użytkownik dostaje do wklejenia, nie ma po co jechać
nasza lista zależności deweloperskich.

**Odrzucone: `define` z `Bun.build`.** Podstawienie przy budowaniu daje
w testach zaślepkę albo `ReferenceError` — a wtedy test „JSON niesie wersję"
pilnuje zaślepki, nie wersji.

**Czym przypięte.** Dwa testy, oba porównują z `package.json`, nie z literałem
(literał trzeba by poprawiać przy każdym wydaniu, a zapomniana poprawka daje
zielony test pilnujący nieprawdy). Drugi test pyta osobno o to, że `.title` ma
**dokładnie** „MargoMeter" — lekcja z `AUDYT‑14`, gdzie dołożony węzeł po cichu
zmienił `textContent` sąsiada. Sprawdzone mutacją: zdjęcie pola z JSON‑a i węzła
z nagłówka zapala oba.

**Docelowo.** → `TOOLING.md §2` (kanał dostawy).

### AUDYT‑53 — zamknięte archiwum dolicza dalej 🔴 XS — ✅ NAPRAWIONE ✓ (regresja `c39d35b`)
`src/archive.ts` (`toggle`, gałąź zamykająca) kontra `:879` (`destroy`)

**Problem.** `c39d35b` rozłożyło liczenie podsumowań na porcje po `FILL_CHUNK`
tyknięć — właśnie po to, żeby otwarcie archiwum nie zamrażało wątku gry na
269 ms. Ale zamknięcie okna ustawiało `hidden = true` i **nie zatrzymywało
zegara**: kolejka dopełniała się dalej, dla listy, której nie ma na ekranie.
`destroy()` robił to poprawnie od początku, `toggle()` nie.

**Repro.**
```
190 nagrań: po otwarciu     8 wczytanych
            po zamknięciu   8
            po tykaniu    190   ← 182 nagrania i 193,4 ms w wątku gry
                                  PO zniknięciu okna z ekranu
```

To jest trzy czwarte kosztu (269 ms), który cała ta zmiana miała usunąć — tylko
przesunięte w czasie i wydane w momencie, w którym użytkownik gestem powiedział
„skończyłem".

**Zrobione.** `stopFilling()` plus wyczyszczenie kolejki w gałęzi zamykającej.
Ponowne otwarcie nic nie traci: `renderRow` wypełnia od razu każdy wiersz,
który ma już policzone podsumowanie (`eager || this.cached(entry)`).

**Czym przypięte.** Test bliźniaczy do istniejącego „destroy zatrzymuje
dopełnianie": po zamknięciu zegar stoi, a trzydzieści tyknięć nie dokłada ani
jednego odczytu. Sprawdzone mutacją — zdjęcie `stopFilling()` zapala go.

**Docelowo.** → `SOLID.md §4.23` jako dopisek „co ta naprawa zostawiła otwarte".

### AUDYT‑54 — skasowanie jednego nagrania wyrzuca cache całego archiwum 🟡 XS — ✅ NAPRAWIONE ✓
`src/archive.ts` (obsługa ✕ w wierszu)

**Problem.** Po skasowaniu wiersza leciało `this.summaries.clear()`. Klucz cache
to `${id}:${chars}`, a `renderList` woła `forgetMissing()` z listą żywych nagrań
— czyli klucze skasowanego wpisu i tak znikają, i tylko one. `clear()` było więc
nie tyle zbyt szerokie, co **całkiem zbędne**.

**Repro.**
```
20 nagrań, wszystkie policzone → skasowanie JEDNEGO
  przeliczone od nowa: 19 (8 od razu, 11 w tle)   zamiast 0
```

**Zrobione.** Linia usunięta; nic nie weszło w zamian, bo `forgetMissing`
w `renderList` robi dokładnie to, co trzeba, a `render()` leci linijkę niżej.

**Czym przypięte.** Test: po skasowaniu jednego z dwudziestu policzonych nagrań
liczba odczytów nie rośnie. Sprawdzone mutacją — przywrócenie `clear()` zapala.

**Docelowo.** → `SOLID.md §4.23`.

### AUDYT‑42 — `@exclude` niesymetryczne, a test nie ma jak tego złapać 🟡 XS — ✅ NAPRAWIONE ✓
`tools/userscript-meta.ts` (`banner`), `tests/userscript.test.ts`

**Problem.** Dla `.pl` wykluczaliśmy `www`, `forum`, `commons` i `pomoc`; dla
`.com` — tylko `www` i `pomoc`. Do tego wzorzec `*.margonem.pl` obejmuje także
sam `margonem.pl`, którego nie wykluczała żadna z domen.

**Repro.** (`appliesTo` na `banner()` z `740f3c6`)
```
true   https://margonem.pl/
true   https://margonem.com/
true   https://forum.margonem.com/temat/1
true   https://commons.margonem.com/
false  https://www.margonem.pl/nowa-postac
```

**Skąd luka.** Lista rosła po jednej linii, a test wymieniał z palca adresy,
które **już** odpadały — nie miał więc konstrukcji, która zapaliłaby się na
pozycji brakującej. Druga linia obrony (`boot()`, `GIVE_UP_AFTER = 20`) nie
zapobiega, tylko ogranicza koszt do ~20 przeczesań cudzego dokumentu.

**Zrobione.** Obie domeny mają tę samą listę plus adres bez subdomeny. Test
przepisany na pętlę po iloczynie „subdomena × domena", więc nie da się go już
uzupełnić po jednej stronie; drugi test pilnuje ścieżek i query. Sprawdzone
mutacją — cofnięcie listy zapala oba.

**Docelowo.** → `TOOLING.md §1` (dopisane).

### AUDYT‑43 — sonda pomocy odpowiada z zapisu bez daty ważności 🟡 S — ✅ NAPRAWIONE ✓
`tools/pomoc.ts`, nowy `tests/pomoc.test.ts`

**Problem.** `tekstArtykulu` zwracał `.cache/pomoc-372.txt`, jeśli plik istniał —
**bezterminowo i bez śladu wieku**. Cały rejestr `MECHANIKA.md` stoi na cytatach
z tej sondy, a data przy wpisie mówi, kiedy PYTANO, nie z kiedy jest treść. Gra
swoją dokumentację poprawia; wpis „sprawdzone, milczy" oparty o stary zrzut to
dokładnie ten fałszywy negatyw, przed którym ta sonda ma bronić — tylko o piętro
wyżej. Nie było ani flagi odświeżenia, ani wypisanej daty pobrania.

Drugi brak: **zero testów**, mimo dwóch czystych funkcji w środku. Powód był
mechaniczny — plik wykonywał CLI przy samym imporcie, więc testu nie dało się
napisać. Ta sama przeszkoda, którą `TOOLING §6` zapisuje przy `build.ts`.

**Zrobione.** CLI za `import.meta.main`; `odtaguj`, `fragmenty` i nowe `wiek`
eksportowane. Wiek zrzutu stoi w PIERWSZEJ linii wyjścia, obok liczby znaków —
czyli tam, skąd i tak przepisuje się nagłówek wpisu do rejestru — a od tygodnia
w górę sam prosi o `--odswiez`. Data podpisana strefą: bez „UTC" godzina
rozjeżdża się z tym, co pokazuje `ls`, i wygląda na pomyłkę narzędzia.

**Czym przypięte.** 13 testów. Trzy mutacje sprawdzone: brak ostrzeżenia przy
starym zrzucie, odtagowywanie skryptów PO tagach, powrót do dawnego odsiewania.

**Docelowo.** → `TOOLING.md §6` (dopisane) + `MECHANIKA.md` jako uwaga
o wieku zrzutu przy procedurze.

### AUDYT‑55 — sonda odsiewała trafienia po prefiksie fragmentu ⚪ XS — ✅ NAPRAWIONE ✓
`tools/pomoc.ts` (`fragmenty`)

**Problem.** Powtórzenia odsiewał klucz `fragment.slice(0, 60)` — proxy dla „ten
sam akapit", które myli się w jedną stronę: gdy przed dwoma trafieniami stoi ta
sama treść (tabela, powtórzony nagłówek), klucze wychodzą identyczne i trafienie
z INNEGO miejsca artykułu znika jako powtórzenie.

**Uczciwie o skali.** Złapał to test, nie zgubiony cytat. Na dzisiejszym artykule
wiąże wcześniej limit `--ile`, więc pomiar przed i po jest ten sam (`kryt`: 259
wystąpień → 6 fragmentów; `Unik ( evade )`: 3 → 3). To poprawka na zapas — ale
sonda istnieje właśnie po to, żeby nie gubić trafień po cichu.

**Zrobione.** Powtórzenie rozpoznaje się po NAKŁADANIU SIĘ WYCINKÓW, co jest
tym, co pierwotny komentarz chciał powiedzieć.

**Wniosek metodyczny — pierwsza wersja testu na to była zielona i pusta.**
Fragment pierwszego trafienia zaczynał się od początku tekstu, drugiego —
od środka przedrostka, więc klucze różniły się z powodu, którego w artykule nie
ma, i test przechodził także na STAREJ implementacji. Wyszło to dopiero przy
mutacji. Reguła „zepsuj naprawę i sprawdź, że test się zapala" zarobiła w tej
rundzie na siebie.

### AUDYT‑45 — pokrycie liczone tylko na żądanie 🟡 S — ✅ ROZSTRZYGNIĘTE INACZEJ ✓
`bunfig.toml`, `docs/TOOLING.md`

**Problem.** `TOOLING.md` podawał jako stan bazowy „650 zielonych, 98,61 % linii"
(2026‑08‑01) i trzymał jako otwarte „brak progu pokrycia — regresja pokrycia
przechodzi cicho". Zmierzone przy tym audycie: **675 zielonych, 97,34 %**. Liczba
przeleżała trzy rundy bez sprawdzenia, bo oglądało się ją tylko na osobne żądanie.

**Czego teza NIE dowodziła.** Spadek 98,61 → 97,34 **nie jest regresją `src/`** —
do raportu weszły w międzyczasie `tools/` (bloki CLI uruchamiane wyłącznie przy
wydaniu). Każdy plik `src/` ma dziś 90,2–100 % linii. Wniosek ogólniejszy:
**procent pokrycia bez podanego SKŁADU raportu nie jest liczbą porównywalną** —
i właśnie dlatego stał w dokumencie jako dowód czegoś, czego nie dowodził.

**Progu NIE MA i to jest wynik pomiaru, nie rezygnacji.**
```
coverageThreshold w Bunie 1.3.14 działa PER PLIK, nie na sumie:
  przy sumie 95,2 % brama pada już na progu 0.44
  bo najsłabszym plikiem raportu jest tools/pomoc.ts (43,5 % — sam blok CLI)
  najwyższy próg, który repo dziś przepuszcza: 0.43
```
Dwie pułapki zmierzone przy okazji: `{ line = …, function = … }` w liczbie
POJEDYNCZEJ jest **po cichu ignorowane** (przy progu 0,99 `bun test` kończy się
kodem 0), a `coveragePathIgnorePatterns = ["tools/"]` **nie zadziałało wcale**.
Próg `0.43` byłby zabezpieczeniem pozornym, czyli tym, co repo zna jako „testy
zielone i puste" — lepiej go nie mieć.

**Zrobione zamiast progu.** `coverage = true` w `bunfig.toml`: pokrycie liczy się
przy KAŻDYM `bun test`, a więc pod bramą i w CI. Koszt zmierzony: 7 367 →
8 948 ms. Do tego `tools/changelog.ts` — czysta funkcja pokryta w 100 %, blok CLI
w zerze — dostał trzy testy przez `Bun.spawn` na KODY WYJŚCIA (0/1/2), po których
`release.yml` decyduje, czy przerwać wydanie.

**Co ZOSTAJE otwarte.** Sam próg — do czasu dociągnięcia trzech najsłabszych
plików (`src/index.ts` 60,00 % funkcji, `tools/pomoc.ts`, `tools/changelog.ts`)
albo do czasu, gdy próg da się postawić na sumie. Nadal nie ma pomiaru GAŁĘZI.

**Docelowo.** → `TOOLING.md §4` (przepisane) + `SOLID.md §10`.

### AUDYT‑51 — przeniesiona definicja, nie zależność 🟡 XS — ✅ NAPRAWIONE ✓
`src/session.ts`, `src/overlay.ts`, `src/index.ts`

**Problem.** `AUDYT‑5` zapisuje „`EMPTY_STATS` przeniesione do `stats.ts`",
z argumentem WARSTWOWYM: „`overlay.ts` importuje z `session.ts` zero dla typu
należącego do `stats.ts`". Stała faktycznie stoi w `stats.ts` — ale `session.ts`
re‑eksportowało ją z komentarzem „żeby import z sesji dalej działał tam, gdzie tak
było wygodniej", a `overlay.ts` i `index.ts` dalej brały ją stamtąd. Przeniesiona
została definicja; zależność, dla której to robiono, została.

**Zrobione.** Re‑eksport zdjęty, oba miejsca importują ze `stats.ts`. Na miejscu
re‑eksportu został komentarz mówiący, co tam stało i dlaczego zniknęło.

**Wniosek.** Naprawa opisana jako zrobiona bywa zrobiona w połowie — i to ta
druga połowa jest zwykle całym powodem. Warto przy zamykaniu wpisu sprawdzić nie
tylko, czy zmiana jest w drzewie, ale czy zachodzi **argument**, który ją
uzasadniał.

### AUDYT‑46 — ostrzeżenie o rozjeździe samo się rozjechało 🟡 XS — ✅ NAPRAWIONE ✓
`docs/AUDYT.md` (preambuła), `docs/SOLID.md §8`, `R7`

**Problem.** `AUDYT.md` ostrzegał: „`SOLID.md` mówi 2456 linii — dziś jest 2628,
rozjazd o ~170 linii znaczy, że cytowania trzeba sprawdzić". Dziś `overlay.ts` ma
**3181 linii**, czyli o 725 więcej niż liczba, przy której ktoś napisał „trzeba go
ciąć". `SOLID R7` odsyłał do `STYLE` w `:90‑406`; `STYLE` stoi w **`:229‑606`**
(378 linii) — kto poszedłby za tym zakresem, wyciąłby środek czegoś innego.

**Zrobione.** Zakres `STYLE` przeliczony w obu miejscach, rozmiar pliku
odświeżony, a nad tabelą granic cięcia stoi ostrzeżenie, że pozostałe numery
linii są sprzed trzech rund i wymagają odczytu przed użyciem.

### AUDYT‑47 — status żyjący w dwóch miejscach, po raz trzeci 🟡 XS — ✅ NAPRAWIONE ✓
`docs/AUDYT.md §G` kontra `docs/SOLID.md:358`, `:415`

**Problem.** Tabela `§G` trzymała `SOLID §4.18` i `§4.22` jako otwarte; obie są
w `SOLID.md` zamknięte 2026‑08‑01 (`98ab619`, `c39d35b`). Ta sama klasa, którą
`§G` sama sprostowała przy `A14` — i ta sama, którą `SOLID §11` opisuje przy
swojej tabeli.

**Zrobione.** Oba wiersze przekreślone z datą i commitem. **Wniosek zapisany po
raz trzeci, więc tym razem z propozycją wykonawczą:** skasować z `§G` kolumnę
statusu i zostawić same odsyłacze. Status ma żyć w sekcji, nie w skrócie.

### AUDYT‑48 — dwie nieprawdy w `TOOLING.md` ⚪ XS — ✅ NAPRAWIONE ✓
`docs/TOOLING.md §1`, `§4`

**Problem.** §4: „jedno `any` w `roster.ts`" — w kodzie są **trzy**
(`roster.ts:63`, `index.ts:64`, `index.ts:80`), a dwa doszły przy bramie `boot()`
opisanej w §1 tego samego pliku. §1 cytuje `build.ts:20‑25` (`@match`)
i `build.ts:17` (`@version`) — w `build.ts` nie ma dziś ani jednego z nich,
nagłówek mieszka w `tools/userscript-meta.ts`. §2 ma przy swojej tabeli dopisek
„stan sprzed zmiany", §1 nie miała i czytała się jak opis stanu bieżącego.

**Zrobione.** Liczba poprawiona z wypisaniem wszystkich trzech miejsc; §1 dostała
ten sam dopisek co §2, wraz ze wskazaniem, gdzie nagłówek jest naprawdę.

### AUDYT‑49 — „fixture'y mają dwa pliki" to norma podana jako fakt ⚪ XS — ✅ NAPRAWIONE ✓
`docs/README.md`

**Problem.** Zdanie brzmiało jak opis korpusu. Policzone: na 21 fixture'ów
**5 ma oba** pliki, 13 ma sam `raw.txt`, **3 mają sam `log.html`**. Dla tych
trzech test różnicowy „HTML daje to samo co tekst" przechodzi PUSTY
(`parser.test.ts`: `if (raw === null) return;`). `SOLID §10` to zna — `README`
podawał odwrotność.

**Zrobione.** Zdanie przepisane na normę dla NOWEGO fixture'a, z policzonym
stanem faktycznym i nazwami trzech zrzutów bez `raw.txt` obok.

### AUDYT‑50 — mapa modułów pomija `confirm.ts` ⚪ XS — ✅ NAPRAWIONE ✓
`AGENTS.md`, `docs/README.md`

**Problem.** Obie mapy wyliczają moduły poboczne bez `src/confirm.ts` — 105 linii
i wspólny mechanizm „na pewno?" z wygasaniem, który powstał przy `AUDYT‑9`
i `AUDYT‑10` właśnie po to, żeby nie było go w dwóch kopiach.

**Zrobione.** Dopisany w obu miejscach, razem z nowym `version.ts`.

### AUDYT‑44 — przepis na listę otwartych specek wypisuje szablon ⚪ XS — ✅ NAPRAWIONE ✓
`docs/specy/README.md`

**Problem.** Dokument podawał `grep -l "Status: projekt" docs/specy/*.md` jako
sposób na listę otwartych specek. `SZABLON.md` też ma `Status: projekt`, więc
pierwszym „otwartym specem" był sam szablon.

**Zrobione.** Kotwica `^` plus `grep -v SZABLON`; sprawdzone po wklejeniu — dziś
wynik jest pusty, zgodnie ze stanem (specek jeszcze nie ma). Przepis podany
w dokumencie ma działać po wklejeniu, inaczej uczy tylko tego, żeby dokumentowi
nie ufać.

### AUDYT‑52 — zrzuty w `README` same przyznają się do nieaktualności ⚪ S — OTWARTE ✓
`README.md:98‑102`, `docs/screenshots/`

**Problem.** Nad obrazkami stoi ostrzeżenie: „Zrzuty są sprzed poprawek z 1
sierpnia 2026 i nie pokazują już panelu takim, jaki jest… Do wymiany". To
pierwsza rzecz, którą widzi ktoś wchodzący z linku wydania — a od tamtej pory
doszła jeszcze odznaka profesji i numer wersji w nagłówku.

**Dlaczego zostaje otwarte.** Wymaga wejścia do gry i rozegrania walki grupowej;
konwencja nazw i lista rzeczy do pilnowania stoi w `docs/screenshots/README.md`.

**Docelowo.** → `UX-POPRAWKI.md`.

### Sprawdzone, nie potwierdza się

Trzy tezy postawione przy planowaniu tej rundy i **obalone pomiarem** — zapisane,
żeby nikt nie badał ich drugi raz z tego samego powodu:

- **`release.yml` przy pustej sekcji CHANGELOG‑a.** Kryte podwójnie: brak sekcji
  daje `null`, sekcja pusta daje `""`, oba kończą CLI kodem 1 i przerywają
  wydanie; niezależnie od tego `changelog.test.ts` wymusza sekcję dla wersji
  z `package.json` już na bramie, którą `release.yml` odpala przed wydaniem.
  Dopisano testy na kody wyjścia (patrz `AUDYT‑45`), bo sama ścieżka nie była
  wykonywana w testach — ale zachowanie było poprawne.
- **`tests/phase.test.ts`.** Pilnuje wszystkich czterech miejsc, w których widać
  fazę (`@name`, `README`, `CHANGELOG`, treść wydania), ma obie gałęzie
  (`PHASE === null` też) i dokłada zgodność z SemVerem. Bez zastrzeżeń.
- **Luka pokrycia w `stored-state.ts` i `roster.ts`.** Nie potwierdza się jako
  osobna luka: 92,00 % i 97,67 % linii, a niski procent FUNKCJI w `roster.ts`
  (66,67 %) bierze się z małej ich liczby, nie z nieprzetestowanych ścieżek.
  Niepokryte konkrety, które faktycznie zostają, `SOLID §10` zna od dawna
  (`index.ts` — trzy `catch` i `safeStorage`; suwak odtwarzania; fallback
  `instanceResolver`).

---
## I. Runda zrzutu i powrotu fixture'ów — przegląd PRZED commitem (2026‑08‑05)

Przeglądana runda: `src/zrzut.ts` + `src/opcje.ts` (nowe), powrót
`tests/fixtures/`, przebudowa `tools/walka.ts`, wpięcie kolekcjonera
w `protokol-source.ts`, zębatka w `overlay.ts`, dwa specy. Brama była zielona
(`bun run check` → 682 zielone, build przechodzi), więc audyt szukał wyłącznie
rzeczy, których brama nie widzi.

**Czego audyt NIE podważa**, żeby nie zginęło w liście: brak podwójnego
owinięcia `Engine.battle.update`; oryginał leci pierwszy i wraca nietknięty,
a `przed()` i `po()` mają **rozdzielne** osłony (`tests/protokol-source.test.ts:427‑521`
to najlepszy blok testów w rundzie); `zdejmij()` zdejmuje tylko swoją warstwę;
`readdirSync` naprawdę odkrywa pliki same; obie strony świadka `hp.max` są
niezależne (migawka nie przechodzi przez dekoder); 233 klucze i build
`1785244275300` mają trzy niezależne potwierdzenia; `CHANGELOG.md` w konwencji.
Oba specy same nazywają to, czego nie domykają. **Znaleziska niżej dotyczą liczb
w prozie i granicy walk — nie fundamentów.**

### AUDYT‑56 — druga walka w sesji dolicza się do pierwszej 🔴 S — ✅ NAPRAWIONE ✓

`src/protokol-source.ts:241` (zerowanie bufora) · `src/session.ts:89` (`splitFights`)

**Problem.** `ROADMAP.md` i spec zapisują tę pozycję jako **niezmierzoną**
(„Czy panel naprawdę pokazuje duchy z poprzedniej walki — **niezmierzone**;
`session.ts` może to maskować”). Pomiar da się zrobić bez wchodzenia do gry
i wypada jednoznacznie: **maskowania nie ma**. Trzy ogniwa:

- `protokol-source.ts:241` zeruje bufor po **tożsamości** `Engine.battle`, a gra
  tego obiektu nie wymienia — cytaty z `Battle.js` stoją w `docs/MECHANIKA.md`,
  wpis „Granica walk”.
- `session.ts:89` dzieli strumień przez `splitFights`, a ta szuka `fight-start`
  — klucza, którego strumień protokołu nie niesie, bo linię otwierającą klient
  syntetyzuje poza `data.m`.
- `grep` po `src/` i `tests/`: **zero** wystąpień `init`. Granicy nie czyta nic.

**Repro.** `tests/walka-z-gry.ts` podany dwa razy — tak wygląda bufor przy
drugiej walce bez wymiany obiektu:

```
                       jedna walka   dwie w buforze
splitFights zwraca               1        1   ← nie dzieli
Kazrek — zadane               2644     5288
Kazrek — trafienia               8       16
Odyniec — otrzymane           1950     3900
tury na osi                     12       24
```

Panel pokazuje sumę dwóch walk jako jedną i nie mówi o tym ani słowem — czyli
ten rodzaj błędu, który „Kierunek na teraz” w `ROADMAP.md` stawia najwyżej.

**Docelowo.** `ROADMAP.md` → słowo „niezmierzone” zastąpione tymi liczbami.
Naprawa (granicą jest `data.init`) osobną rundą, tak jak chce spec; blokada
„najpierw odtworzenie, dopiero potem naprawa” właśnie znikła.

**Zrobione.** Granicą walki jest dziś `data.init` w ładunku. Odcięcie
(`odetnijWalke`) wołane jest z DWÓCH stron: z wymiany obiektu `Engine.battle`
(warunek wystarczający, zostaje) i z `init` (warunek konieczny, nowy). Predykat
`zaczynaWalke` zamieszkał w `src/zrzut.ts`, a `graniceWalk` w `tools/walka.ts`
woła właśnie jego — **jedna definicja granicy dla dodatku i dla narzędzia**,
bo dwie rozjechałyby się cicho: narzędzie odmawiałoby plikom, które dodatek
uważa za jedną walkę, albo odwrotnie.

**Pomiar przed i po, tą samą sondą i tą samą ścieżką** (dwie walki przez
`EngineProtocolSource` → `Session`, `init` między nimi, obiekt `battle` ani razu
nie wymieniony):

```
                    przed        po
walka 1 — zadane     2784      2784
walka 2 — zadane     5568      2784   ← przestało się doliczać
walka 2 — trafienia    16         8
walka 2 — tury         24        12
```

**Jedna rzecz dołożona przy okazji, bo bez niej byłby regres:** flaga
`swiezaWalka`. Podpięcie się przed pierwszą walką odcina ją (nowy obiekt), a jej
własny `init` przychodzi chwilę później — bez flagi ta sama walka liczyłaby się
dwa razy i pierwszy fixture w sesji nosiłby numer 2. Ma własny test.

**Czy testy potrafią paść.** Gałąź `init` wyłączona → padają **dokładnie dwa**
nowe testy (`27 pass, 2 fail`), reszta pliku zostaje zielona.

**Co ZOSTAJE otwarte.** `docs/MECHANIKA.md` nazywa dwa przypadki, których nie
rozstrzyga żaden materiał: czy `init` przychodzi ZAWSZE, także po przeładowaniu
strony w trakcie walki, oraz czy `close` bez `init` potrafi zamknąć walkę tak,
że następna `init` nie dostanie. Ta poprawka ich nie zamyka — w obu bufor
zachowa się jak przedtem. Potrzebny zrzut z przeładowaniem.

### AUDYT‑57 — to samo sklejenie trafia do ARCHIWUM, a kod niesie fałszywe uzasadnienie 🔴 XS — ✅ NAPRAWIONE ✓

`src/recorder.ts:339` (`capture`) · `:160` (`przedluza`) · komentarze `:335‑337`
i `src/session.ts:88`

**Problem.** `capture` skleja porcje testem prefiksu, więc bufor niezerowany
między walkami rośnie jako **przedłużenie** — dwie walki lądują w JEDNYM
nagraniu, pod tytułem złożonym ze scalonego składu. Zmierzone na atrapie
magazynu: trzy porcje (dwie z walki 1, jedna z doklejoną walką 2) → `count() === 1`.

Ważniejsze od samego skutku są dwa komentarze, które stoją w kodzie jako
uzasadnienia decyzji i **są dziś nieprawdą**:

- `recorder.ts:335‑337` — „Jedna walka na raz — protokół nie ma bufora z kilkoma
  naraz, **bo źródło zeruje go przy każdej nowej**”.
- `session.ts:88` — „`Engine.battle` żyje jedną walką, a nowa dostaje nowy obiekt
  i wyzerowany bufor”.

Reguła repo („komentarz mówi DLACZEGO”) czyni z tego usterkę, nie drobiazg:
następny czytelnik oprze na tych zdaniach decyzję.

**Docelowo.** Sprostowanie obu komentarzy w tej samej rundzie co `AUDYT‑56`.

**Zrobione.** Oba zdania sprostowane i — co ważniejsze — **oba przestały
udawać opis tutejszego kodu**. `recorder.ts` mówi dziś wprost, że akapit
opisuje CUDZE zachowanie i milczy, gdy tamto się zmieni; `session.ts` nazywa
swoje zdanie ZAŁOŻENIEM o `protokol-source.ts`, bo `splitFights` nie ma jak
sprawdzić, czy dostało jedną walkę. Samo sklejanie w archiwum znikło razem
z naprawą `AUDYT‑56`: bufor jest odcinany, więc `przedluza()` nie widzi już
drugiej walki jako przedłużenia pierwszej.

### AUDYT‑58 — „16 trafień” świadka to w rzeczywistości 7 🔴 XS — ✅ NAPRAWIONE ✓

`AGENTS.md:172` · `docs/ROADMAP.md:218` · `tests/fixtury.test.ts:141` ·
`tools/walka.ts:354` · `docs/specy/2026-08-05-surowy-material-z-gry-wraca-do-repo.md:63`
(oraz „oba pliki” ×2 w tabeli mutacji tego specu)

**Problem.** Siłę świadka `hp.max` opisuje w sześciu miejscach liczba pochodząca
z pomiaru na materiale, który do repo **nie wszedł** (druga walka odpadła jako
sklejona). Przeliczone pętlą świadka 1:1 na materiale, który JEST:

```
                                    dokumentacja   realnie
porównań (`sprawdzonych`)                     16         7
rozjazdów                                      0         0   ✅
mutacja `raw` zamiast `applied`                6         6   ✅
```

Świadek jest więc **mocny** — 6 z 7 porównań łapie mutację. Kłamie wyłącznie
liczba opisująca jego siłę, i kłamie w `AGENTS.md`, czyli w pliku, który czyta
każde narzędzie. Ta sama runda dopisała regułę, którą to łamie („liczby wypisuje
`--pokaz`”, „POLICZONE liczby nie wchodzą do plików danych”).

**Docelowo.** Sprostowanie w sześciu miejscach **plus** asercja na liczbę
porównań w teście (razem z `AUDYT‑61`) — żeby proza nie mogła oderwać się od
materiału drugi raz.

**Zrobione.** Sprostowane w sześciu miejscach: `AGENTS.md`, `docs/ROADMAP.md`,
`tools/walka.ts`, `tests/korpus.ts`, `tests/fixtury.test.ts` i spec (ten ostatni
dostał wpis w „Zmiany wpisu”). Wszędzie stoi dziś **7 porównań, 0 rozjazdów**,
a mutacja `raw` opisana jako „zapala 6 z 7” — bo sama `6` była prawdziwa i to
warto było zachować. Każde miejsce niesie ⚠️ z tym, co stało tam wcześniej.

**Wykonanie odbiegło od propozycji w drugiej połowie i to jest ważniejsze niż
samo sprostowanie.** Asercji na LICZBĘ porównań nie ma i nie będzie: związałaby
test z jednym plikiem, a katalog ma rosnąć. Zamiast niej stoi
`expect(bezMaksa).toBe(0)` — „każdy cel, który nadawał się do porównania, ma
znane `hp.max`”. Broni przed tym samym (cichym spadkiem liczby porównań), nie
rotuje przy nowym fixturze i **da się zepsuć**: patrz mutacja przy `AUDYT‑61`.

### AUDYT‑59 — przykład rachunkowy podany jako cytat z materiału nie pochodzi z żadnego materiału 🔴 XS — ✅ NAPRAWIONE ✓

`AGENTS.md:171` · `tests/fixtury.test.ts:134‑139` · `tools/walka.ts:354` · spec `:57‑61`

**Problem.** Wymienione miejsca podają jako **cytat z protokołu** `-255970=70.51`
i rachunek `763 − 225 = 538; 538/763 = 70,51 %`. W `tests/fixtures/*.json` nie ma
ani jednej z tych liczb:

```
szukane     trafień w materiale
70.51                         0
255970                        0
225                           0
538                           0
```

Realne `id` w materiale to `-255967`, `-255969`, `-161518`, `482845`; realne
procenty dla `-255967` to `100.00 · 68.15 · 37.61 · 19.27 · 0.00`. Prawdziwy
przykład na tym samym wojowniku brzmi **`763 − 243 = 520; 520/763 = 68,15 %`**
— `hp.max` 763 jest w migawce i jest jedyną liczbą z tego rachunku, która się
broni.

To nie jest literówka, tylko przepisanie przykładu z odrzuconego zrzutu — czyli
dokładnie ta praktyka, którą runda w tym samym commicie nazywa przyczyną
fałszywego buildu.

**Docelowo.** Podmiana przykładu na policzony z materiału, w czterech miejscach.

**Zrobione.** Wszędzie stoi dziś `763 − 243 = 520; 520/763 = 68,15 %`
z `id -255967` — liczby wyjęte z pliku, który leży w repo. Stary przykład
zostaje zacytowany jako to, czym był, bo bez tego sprostowanie nic nie uczy.

### AUDYT‑60 — „skład nie ma duchów” szuka `id` jako PODCIĄGU 🔴 XS — ✅ NAPRAWIONE ✓

`tests/fixtury.test.ts:95‑96` · drugie sito: `:85`

**Problem.**

```ts
const wSurowym = f.komunikaty.join(";");
const duchy = f.sklad.filter((w) => !wSurowym.includes(String(w.id)))
```

`includes` przepuszcza wszystko, czego cyfry gdziekolwiek się trafią — wewnątrz
innego `id`, wewnątrz kwoty obrażeń, wewnątrz `+exp`. Duchy przepuszczane na
PRAWDZIWYM materiale: `2845` (w `482845`), `-25596` (w `-255967`), `255967` bez
minusa (czyli inny wojownik), `466` (z `+dmgd=466`), `3973` (z `+exp=3973`),
`13` (z `-legbon_facade=13`).

To jedno z **dwóch** sit, na które powołuje się `ROADMAP.md` („materiał do repo
nie wejdzie po cichu”). Drugie — `expect(granice.length).toBeLessThanOrEqual(1)`
— przechodzi też przy **zero** granic, czyli dla zrzutu, który podpiął się
w trakcie walki. Sklejony fixture bez `init` przechodzi więc oba.

**Docelowo.** Porównanie po realnych `id`; `stronyKomunikatu`
(`tools/walka.ts:186`) już je wyciąga. Plus dolna granica na `granice.length`.

**Zrobione.** Oba sita naraz, zgodnie z propozycją. Test duchów porównuje dziś
zbiór `id` wyciągniętych przez `stronyKomunikatu` — czyli tak, jak komunikat
rozcina dekoder — zamiast szukać cyfr w sklejonym łańcuchu. Granica walk zeszła
z `toBeLessThanOrEqual(1)` na `toBe(1)`: zero `init` nie znaczy „plik czysty",
tylko „plik, o którym nie wiadomo".

⚠️ **Koszt tej drugiej zmiany jest realny i stoi wypisany w teście:** materiał
zebrany od środka walki do repo nie wejdzie. Obie udokumentowane drogi dają
`init` (sondę wkleja się PRZED walką, tryb deweloperski raz włączony zostaje),
więc dziś nic to nie odcina — ale gdy taki zrzut przyjdzie, test zapali się
głośno i wtedy zapadnie decyzja. Cicha zieleń jej nie zastąpi.

**Czy testy potrafią paść — sprawdzone trzema mutacjami, nie obiecane.**
Do składu wstrzyknięty duch o `id 2845` (podciąg `482845`, czyli gracza):
**nowe sito go łapie, STARE przepuszcza** — ten sam materiał, `1 pass, 0 fail`
przed poprawką i `fail` po niej. To jest cały dowód, że zmiana nie jest
kosmetyczna. Trzecia mutacja: `init` usunięty z ładunków → `Expected: 1,
Received: 0`, czyli granica zapala się tam, gdzie wcześniej milczała.

### AUDYT‑61 — świadek zapali się FAŁSZYWIE przy pierwszym fixturze z leczeniem w środku walki 🔴 S — ✅ NAPRAWIONE ✓

`tests/fixtury.test.ts:157‑186` (akumulator) · `:191` (strażnik)

**Problem.** Pętla sumuje wyłącznie `attack` i `dot`; `heal` nie wchodzi do
akumulatora `zebrane`. Komentarz przy teście mówi, że leczenie „nie zmienia
procentu w sposób, który da się stąd sprawdzić” — a ono **przesuwa bazę** dla
wszystkich późniejszych porównań tego celu. To nie brak pokrycia, tylko utajony
fałszywy alarm.

Że test dziś przechodzi, jest przypadkiem materiału: jedyne leczenie (`+99` na
graczu) pada po ostatnim jego zranieniu. Pierwszy fixture z leczeniem w środku
walki zapali świadka **na poprawnym dekoderze** — czyli da sygnał, który uczy
ludzi ignorować test.

Obok tego `expect(sprawdzonych).toBeGreaterThan(0)` łapie wyłącznie CAŁKOWITY
zanik: gdyby `hp.max` przestało się czytać dla trzech z czterech wojowników,
test przechodzi na jednym porównaniu i nikt tego nie widzi. Komentarz nad tą
asercją obiecuje więcej, niż ona robi.

**Docelowo.** `heal` na celu wyrzuca ten cel z porównania (albo dodaje `amount`
do bazy); `sprawdzonych` porównywane z liczbą kandydatów, nie z zerem.

**Zrobione.** Uleczony cel wypada z porównań od chwili uleczenia. Wariant
„dodaj `amount` do bazy” odrzucony i warto powiedzieć dlaczego: leczenie ponad
pulę życia gra ucina, a log nie mówi, ile z niego weszło — doliczanie byłoby
dokładne tylko pozornie i łamałoby regułę „nie udawaj danych, których log nie
ma”. Zamiast asercji na liczbę porównań stoi `expect(bezMaksa).toBe(0)`, powód
przy `AUDYT‑58`.

**Świadek wyszedł z ciała testu do `tests/fixtury.ts` jako `swiadekZycia()`
i to nie jest kosmetyka.** Materiał w repo nie zawiera leczenia w środku walki
— jedyne leczenie pada na gracza PO jego ostatnim zranieniu — więc obsługa
leczenia była kodem, którego usunięcie **niczego nie zapalało**: 7 porównań
i 0 rozjazdów przed poprawką i po niej. Wyciągnięta funkcja dostała trzy testy
na zdarzeniach budowanych w kodzie, niezależne od tego, co leży w katalogu.
Fixture'ów to nie zastępuje: tam sprawdzamy MATERIAŁ, tu REGUŁĘ.

**Czy testy potrafią paść — dwie mutacje.**

```
świadek ignoruje `heal`     → (fail) „uleczony cel wypada z porównań,
   (stan sprzed poprawki)             zamiast zapalać fałszywy rozjazd”
                                      12 pass, 1 fail — i ANI JEDEN test
                                      po fixture'ach, co jest tu całą pointą

`maksZycia` zbiera 1 cel    → (fail) „procent życia z protokołu zgadza się
   zamiast 4                          z obrażeniami z dekodera”
                                      Expected: 0, Received: 6
```

Druga mutacja jest dowodem na to, po co `bezMaksa` w ogóle powstało: przy starej
asercji `sprawdzonych > 0` ten sam ubytek zostawiał **jedno** porównanie
i przechodził na zielono.

### AUDYT‑62 — zamknięte okno ustawień wraca na ekran samo 🔴 XS — ✅ NAPRAWIONE ✓

`src/opcje.ts:129` (`render` bez strażnika) · `:110` (`toggle`) · `:262` (`powiedz`)
kontra `src/archive.ts:510`

**Problem.** `Archive.render()` zaczyna od `if (!this.state.open) return;`. Kopia
w `opcje.ts` tego strażnika **nie ma** i bezwarunkowo robi `this.window.hidden = false`.
Jednocześnie `toggle()` gasi `confirmClear`, ale **nie** `noticeHandle`.

**Repro** (cztery sekundy):
```
1. klik „Zrzut walki”      → powiedz() startuje ticker na NOTICE_MS
2. klik w zębatkę          → state.open = false, hidden = true, aria-pressed="false"
3. po NOTICE_MS            → ticker woła render() → hidden = false
                             OKNO WRACA, choć state.open === false
4. klik w zębatkę          → NIE zamyka (ustawia open = true); trzeba dwóch
```

Przyczyna jest strukturalna: `Opcje` to przepisany `Archive` (`powiedz`,
`loadState`, `saveState`, `moveTo`, `destroy`, `renderHeader` — wklejone
praktycznie bez zmian, do `Math.max(1, window.innerWidth)` włącznie). Jedyne, co
z kopii wypadło, to ten jeden strażnik. Trzeci komplet tej samej mechaniki okna
(panel, archiwum, opcje) przy wspólnym `window.ts`, który wystawia tylko
`makeDraggable` i `clampToViewport`.

**Docelowo.** Jedna linia + test „notatka gaśnie, gdy okno w międzyczasie
zamknięto” — dziś `opcje.test.ts:206` sprawdza wyłącznie okno otwarte. Osobno do
rozważenia: czy `destroy()` zatrzymał ticker (`ManualTicker` wystawia `running`
właśnie po to, a nikt tego nie sprawdza).

**Zrobione.** Strażnik `if (!this.state.open) return;` wrócił na pierwszą linię
`render()`, plus test „gasnąca odpowiedź NIE otwiera zamkniętego okna
z powrotem”, który pyta o trzy rzeczy naraz: `hidden`, `isOpen()` i `aria-pressed`
zębatki.

**Wykonanie odbiegło od propozycji w jednym punkcie i warto wiedzieć,
dlaczego.** Ticker `powiedz()` **NIE** jest zatrzymywany przy zamknięciu, choć
`AUDYT‑53` uczyło odwrotnie. Różnica jest taka, że tamten zegar liczył
podsumowania (`193 ms w wątku gry`), a ten tylko czeka cztery sekundy — i po
drodze **czyści `notice`**. Zatrzymany wymagałby wyzerowania `notice` w tym
samym miejscu, inaczej stara odpowiedź czekałaby w oknie na następne otwarcie.
`archive.ts` rozstrzyga to tak samo i zostawienie rozbieżności między oknami
byłoby gorsze niż jeden żyjący ticker.

`destroy()` z propozycji **zostaje otwarte** — nadal nikt nie sprawdza, że gasi
ticker, mimo że `ManualTicker.running` istnieje właśnie po to.

**Czy test potrafi paść — sprawdzone.** Strażnik zdjęty → `(fail) zapis zrzutu >
gasnąca odpowiedź NIE otwiera zamkniętego okna z powrotem`, `16 pass, 1 fail`,
i zapalił się **dokładnie ten jeden** test, żaden inny.

---

Pozycje 🟡 — warte roboty, żadna nie blokuje commita.

### AUDYT‑63 — fixture niesie pole, którego nie produkuje żaden dzisiejszy pisarz 🟡 S — ✅ NAPRAWIONE ✓

Wszystkie 4 wpisy w `tests/fixtures/2026-08-04-tempest-lowca-vs-odyncze.json`
mają `render: string[]` z **HTML‑em renderera klienta**
(`<div class="battle-msg txt" style="opacity: 1;">Rozpoczęła się walka…`). Typ
`Wywolanie` (`src/zrzut.ts:38‑53`) tego pola nie zna, `KolekcjonerZrzutu.po` go
nie pisze, obecna sonda też nie (węzły renderu zeszły z niej 2026‑08‑04).

Dwie konsekwencje. Plik **nie jest odtwarzalny żadną z „dwóch dróg”**, które
`AGENTS.md` opisuje jako jedyne wejścia materiału. A teza „komunikaty tak, jak
przysłał je serwer, bez ani jednej naszej liczby” (`tests/fixtury.ts:18`) obejmuje
w praktyce wyjście DOM tej samej gry, które ta sama runda opisuje jako skasowane
i niewracające. Przeżywa to wyłącznie dlatego, że czytelnik nie waliduje wpisów
(`AUDYT‑65`). **Docelowo.** Albo pole wypada przy zapisie, albo wchodzi do typu
i do prozy — dziś jest ani tu, ani tu.

**Zrobione — do prozy, nie do typu, a plik ZOSTAJE.** Wycięcie `render` byłoby
edytowaniem materiału dowodowego, czego `AGENTS.md` zabrania; wciągnięcie go do
`Wywolanie` obiecywałoby pole, którego żaden dzisiejszy pisarz nie produkuje.
Opisane więc w `tests/fixtures/README.md` (skąd się wzięło, czemu nie wróci,
że nic u nas go nie czyta) oraz w nagłówku `tests/fixtury.ts`, gdzie stało za
szerokie zdanie: `komunikaty` i `ladunek` są z serwera, `render` jest z klienta,
a „bez ani jednej naszej liczby” i „wyłącznie z serwera” to nie to samo.

Przepuszczanie pól nadmiarowych przestało być skutkiem braku walidacji i stało
się **decyzją z testem** („czytelnik odrzuca niepełne, nie bogatsze”,
`AUDYT‑65`) — inaczej naprawa tamtej pozycji wyrzuciłaby ten plik z repo.

### AUDYT‑64 — pochodzenie fixture'a jest przepisane ręką, czyli tym, co runda miała skasować 🟡 XS — ✅ NAPRAWIONE ✓

Klucze pliku: `wersja, przy, swiat, build, otwarcie, wpisy, odchudzonych` —
**`zrodlo` nie ma**, a `otwarcie` to `null`. „Zrzut sondy `tools/walka-probe.js`”
stoi wyłącznie w prozie `tests/fixtures/README.md:35`, a `--pokaz` drukuje
„źródło: sonda” z **domyślnej wartości** `zrzut.zrodlo ?? "sonda"`
(`tools/walka.ts:587`) — czyli zgaduje, nie czyta. Test o nazwie „nagłówek mówi,
skąd materiał pochodzi” (`tests/fixtury.test.ts:62`) sprawdza `swiat` i `build`,
a pochodzenia nie sprawdza; fixture bez wiadomego pochodzenia przechodzi.

Sprzeczne wprost z `AGENTS.md:138` („pochodzenie — świat, build, daty, **źródło**
— niesie sam zrzut”) i z `tests/fixtures/README.md:7`. **Docelowo.** Asercja na
`zrodlo` w teście nagłówka; proza w README przestaje zastępować metadaną.

**Zrobione INACZEJ, i to jest ważniejsze niż propozycja.** Przy pisaniu asercji
wyszło, czego wpis nie zauważył: **sonda w ogóle nie pisała `zrodlo`**. Pole
znał tylko dodatek, więc „brak = sonda" nie było lenistwem narzędzia, tylko
jedyną dostępną odpowiedzią — i tym samym każdy przyszły zrzut sondy też byłby
zgadywany. Naprawa idzie więc od strony PISARZA: sonda zapisuje dziś
`zrodlo: "sonda"`, a narzędzie przestało podstawiać cokolwiek pod brak pola.

Trzy miejsca zgadywały (`modulZrzutu`, ostrzeżenie o braku linii otwierającej,
`--pokaz`); wszystkie trzy chodzą teraz po jednym `pochodzenie()`, które dla
pliku bez pola mówi wprost **„Zrzut o NIEUSTALONYM pochodzeniu (plik sprzed
2026‑08‑05)"**. To jest reguła repo zastosowana do nas samych: wolno pokazać
„nie wiadomo", nie wolno zgadnąć.

⚠️ **Asercji na `zrodlo` w teście nagłówka fixture'a NIE MA** i nie będzie
dopóty, dopóki jedyny plik w katalogu jej nie spełnia. Zamiast niej stoją dwa
testy na samym narzędziu: zrzut z polem opisuje się swoim narzędziem, zrzut bez
pola mówi „nieustalone”.

### AUDYT‑65 — `czytajZrzut` nie sprawdza ANI JEDNEGO pola wpisu 🟡 S — ✅ NAPRAWIONE ✓

`tools/walka.ts:70‑104` waliduje `wersja`, `Array.isArray(wpisy)` i
`wpisy.length > 0` — przy własnym komentarzu „sprawdzamy **każde** pole, bo
połowicznie poprawny zrzut zapisałby się jako materiał z gry”. `src/zrzut.ts:51‑52`
obiecuje to samo słowami „pisarz jest typowany, **czytelnik sprawdza**”.
Zmierzony skutek: wpis bez `komunikaty` przechodzi przez `flatMap` (`:154`) jako
`[undefined]` **bez rzutu**, więc wchodzi do `FIXTURY`, do `KORPUS` i do
`dekoduj` z dziurą zamiast komunikatu. **Docelowo.** Walidacja pól wpisu albo
skreślenie obietnicy z obu komentarzy.

**Zrobione.** Walidacja, nie skreślenie obietnicy — `wpisZrzutu` sprawdza `nr`,
`ladunek`, `komunikaty` (lista TEKSTÓW) i obie listy wojowników, i rzuca
**z numerem wpisu**, bo plik ma setki wywołań. Pola NADMIAROWE przechodzą
świadomie: czytelnik ma odrzucać materiał niepełny, nie bogatszy, niż zna —
inaczej odpadłby najstarszy fixture z polem `render` (`AUDYT‑63`) i każdy zrzut
z przyszłej sondy. Mutacja: `wpisy` znów bez walidacji → **4 testy padają**.

### AUDYT‑66 — `wybierzWalke` przemyca do fixture'a metadane innych walk 🟡 XS — ✅ NAPRAWIONE ✓

`tools/walka.ts:143` zwraca `{ ...zrzut, otwarcie, wpisy }`, czyli zostawia
`otwarcia` CAŁEJ sesji oraz `pominietych`/`przepelniony` liczone dla wszystkich
walk. Fixture jednej walki wychodzi z linią otwierającą walki obcej pod
`otwarcia["2"]`. Materiał dowodowy niosący metadane o materiale, którego w nim
nie ma — ten sam zarzut, który runda stawia skasowanemu `meta.json`.

**Zrobione.** Pola wypisywane po jednym zamiast `...zrzut`. `pominietych`
i `przepelniony` NIE przechodzą — są własnością sesji, nie walki, i zawężone nie
dają się policzyć, bo zrzut nie mówi, ile odsiano w której. Milczenie jest tu
uczciwsze niż liczba o niejasnym zakresie. `otwarcie` bierze się wyłącznie
z `otwarcia[numer]`, bez podstawiania linii sesji. Mutacja: `...zrzut` z powrotem
→ pada test „NIE przenosi metadanych cudzych walk”.

### AUDYT‑67 — `--zachowaj` nie istnieje w tekście użycia CLI 🟡 XS — ✅ NAPRAWIONE ✓

`bun tools/walka.ts` bez argumentów wypisuje `--rozbij`, `--rozbij --walka`,
`--pokaz`, `--klucze`. Flaga, wokół której zbudowana jest cała runda i którą
polecają `AGENTS.md` oraz `tests/fixtures/README.md`, w tym tekście nie pada.
Nagłówek pliku ją ma — ale nagłówka nikt nie czyta z terminala.

**Zrobione.** `--zachowaj` stoi teraz **pierwszy**, bo to on robi materiał
wchodzący do repo, plus dwa zdania o tym, czym różni się od `--rozbij` (fixture
z migawkami kontra moduł dla `build.ts`). Drobiazgi z akapitu niżej — ciche
pierwszeństwo flag, `--walka abc` → „walki NaN”, `tekstowa` łykająca kolejną
flagę — **zostają otwarte**; to osobna robota nad parsowaniem argumentów.

Przy okazji, z tego samego bloku (`tools/walka.ts:460‑642`, **całkowicie bez
testów**): `--zachowaj X --rozbij Y` wykona po cichu tylko pierwsze; `--walka abc`
daje „w zrzucie nie ma walki NaN”; `tekstowa` nie sprawdza, czy wartość nie jest
kolejną flagą, więc `--zachowaj --nazwa x` pada z mylącym komunikatem.

### AUDYT‑68 — `docs/README.md` nie przeszedł tej rundy 🟡 XS — ✅ NAPRAWIONE ✓

`AGENTS.md` dostało nowe moduły i nową drogę zbierania materiału, indeks całego
repo nie:

- `:46` mapa modułów nie wymienia `zrzut.ts` ani `opcje.ts`;
- `:103` „Reszta drogi powrotnej jest otwarta: `tools/walka-probe.js` zbiera zrzut”;
- `:157` „Nowy zrzut walki” opisuje wyłącznie wklejanie sondy do konsoli;
- `:210` „⚠️ Zdanie mówiło kiedyś o katalogu ze zrzutami, **którego nie ma od
  2026‑08‑04**” — katalog wrócił w tej właśnie rundzie.

**Zrobione.** Wszystkie cztery miejsca. Mapa modułów ma `zrzut.ts` i `opcje.ts`;
punkt „Nowy zrzut walki” opisuje OBIE drogi (dodatek i sonda) razem
z `--zachowaj`; akapit o materiale jako dowodzie mówi, że katalog wrócił —
z ⚠️ o tym, że prawdziwa walka jest **jedna**, nie dwadzieścia pięć.

### AUDYT‑69 — `URL.revokeObjectURL` w tym samym takcie co `click()` 🟡 XS — ✅ NAPRAWIONE

`src/zrzut.ts:470‑479` (`zapiszPlik`) i `tools/walka-probe.js:186‑196` (`pobierz`)
tworzą blob‑URL, klikają **odczepioną** kotwicę i zwalniają URL synchronicznie
w `finally`. W Chromium przechodzi; w Firefoksie unieważnienie w tym samym takcie
bywa wyścigiem, a odczepiony `<a download>` bywa drugim warunkiem. Awaria jest
cicha w najgorszy sposób: `zapiszPlik` nie rzuci, więc `pobierz()` powie
„Zapisano 1 walkę”, a pliku nie będzie.

To jednocześnie **jedyny fragment `src/zrzut.ts` bez testu** (`:470‑477`, przy
95,51 % linii w pliku) — czyli wyjście produktu z całej tej funkcji. W sondzie
wada jest nieszkodliwa (konsola dewelopera), w dodatku jest jedyną drogą wyjścia
materiału dla gracza. **Docelowo.** Odroczone zwolnienie; sprawdzenie ręczne,
w grze, opisane w commicie — testu na to nie będzie w rozsądnym koszcie.

**Zrobione.** Kotwica wchodzi do `document.body` przed kliknięciem i wychodzi po
nim, a `URL.revokeObjectURL` leci przez `setTimeout(…, 0)`. Ta sama poprawka
w obu miejscach — dodatek i sonda mają zapisywać tak samo, żeby ich zrzuty dały
się porównywać.

⚠️ **Testu nie ma i nie będzie**, tak jak zapowiadał „Docelowo”: `click()` na
`<a download>` nie robi w jsdom nic, a atrapa `saveFile` w `Opcje` omija
dokładnie tę funkcję. Zostaje sprawdzenie ręczne w przeglądarce — i to jest
jedyna pozycja z tej transzy bez świadka w testach.

### AUDYT‑70 — `wyczysc()` w trakcie walki psuje numerację nieodwracalnie 🟡 XS — ✅ NAPRAWIONE ✓

`src/zrzut.ts:454` ustawia `walka = 0`, ale `nowaWalka()` odpala się wyłącznie
przy zmianie tożsamości `Engine.battle` (`protokol-source.ts:249`) — czyli dla
trwającej walki już nie odpali. Kolejne wpisy dostają `walka: 0`, `zrzut().otwarcie`
zostaje `null`, a strażnik `walka === 0` (`:306`) czyni doganianie linii
otwierającej martwym. Do tego docstring (`:41`) mówi „liczony od zera”, podczas
gdy numeracja startuje od 1 — potwierdza to własny test `zrzut.test.ts:352`.

**Zrobione, ale INACZEJ, niż wyglądało na początku.** Połowę tej pozycji zamknął
`AUDYT‑56`: skoro granicą jest `data.init`, numeracja po czyszczeniu wraca sama
przy następnej walce. Zostawał przypadek trwającej walki — i tu zmieniło się
zachowanie: **`wyczysc()` nie zeruje już numeru**. Stare uzasadnienie („pierwsza
zapisana walka ma być pierwszą, a nie ósmą”) było życzeniem kosmetycznym, którego
ceną był numer `0`, którego żadna walka nie nosi. Czyszczenie kasuje ZAPIS, nie
przebieg sesji.

Cena, wypisana w kodzie: po czyszczeniu numery bywają nieciągłe. Spec zrzutu
uznał tę nieciągłość za dopuszczalną, zanim jeszcze zaszła. Test, który żądał
starego zachowania, został przepisany na nowe — razem z powodem.

### AUDYT‑71 — `plural` przepisany zamiast zaimportowany, z uzasadnieniem obok tematu 🟡 XS — ✅ NAPRAWIONE ✓

`src/overlay.ts:168` **eksportuje** `plural(count, forms)` i ma już
`fightWord = plural(count, ["walka","walki","walk"])` (`:176`) — identyczne co do
słowa z `walkaSlowo` (`src/opcje.ts:309`). `archive.ts:25` importuje z `overlay.ts`
bez problemu, więc warstwy to nie blokują. Komentarz przy duplikacie („osobno, bo
tamta odmienia turę”) uzasadnia go przez `turnWord`, a nie przez `plural` — czyli
argumentem, który nie obowiązuje.

**Zrobione.** Oba ciała zastąpione wywołaniami `plural` z `overlay.ts`; zostały
dwie linie zamiast szesnastu. Cykl importów nie powstaje — `overlay.ts` nie zna
`opcje.ts`, widzi tylko typ `OpcjeControl`, dokładnie jak przy archiwum.

### AUDYT‑72 — sufit zrzutu i migawka „przed” bez ani jednego testu 🟡 S — ✅ NAPRAWIONE ✓

`MAX_WPISOW = 2000` (`src/zrzut.ts:142`) nie jest sprawdzony niczym: `przepelniony`
pojawia się tylko jako `false` na świeżym kolekcjonerze (`zrzut.test.ts:346` —
asercja, która nie ma jak nie przejść) i jako atrapa ustawiona z ręki
(`opcje.test.ts:166`). Nikt nie sprawdza, że kolekcjoner faktycznie staje, że
`przed()` przestaje robić migawki ani że wpisy sprzed sufitu zostają nietknięte.
`MAX_WPISOW` nie ma też punktu wstrzyknięcia, więc test kosztowałby 2000 iteracji.

Osobno i poważniej: **`wojownicyPrzed` nie stoi nigdzie po prawej stronie
`expect`**. To jedyny powód, dla którego nasz kod leci **przed** oryginałem
i dla którego kontrakt ma dwie metody zamiast jednej — a wstawienie `[]` zamiast
`przed` przechodzi cały zestaw.

**Zrobione.** Sufit jest wstrzykiwany trzecim argumentem konstruktora —
wyłącznie po to, żeby dał się przetestować; na prawdziwych 2000 test kosztowałby
tyle iteracji z różnymi stanami. Doszły trzy testy sufitu (zbieranie STAJE
i mówi o tym, wpisy sprzed sufitu zostają nietknięte, `przed()` przestaje robić
migawki) i dwa na migawkę „przed" (wpis niesie stan SPRZED wywołania, różny od
stanu po; brak migawki daje `null`).

**Mutacje.** `wojownicyPrzed: []` zamiast `przed` → padają **2 testy**; sufit
przestaje zatrzymywać zbieranie → padają **3**. Przed tą rundą obie mutacje
przechodziły cały zestaw na zielono.

### AUDYT‑73 — `wojownicyPrzed: przed ?? []` udaje dane, których nie ma 🟡 XS — ✅ NAPRAWIONE ✓

`src/zrzut.ts:378` zamienia `null` („migawka nie powstała”) w `[]` („walka nie
miała wojowników”). Czytelnik zrzutu nie odróżni tych dwóch rzeczy, a
`tests/fixtury.ts` iteruje właśnie po tym polu, budując `maksZycia` — czyli
podstawę świadka. Sprzeczne z regułą „nie udawaj danych, których log nie ma”;
`roster.ts` w tej samej sytuacji woli `null` niż pusty skład.

**Zrobione.** `wojownicyPrzed` ma dziś typ `unknown[] | null`, zapis oddaje
`przed` bez podstawiania, a czytelnik przepuszcza `null` i odrzuca wszystko, co
nie jest ani listą, ani `null`em. `wojownicyPo` zostaje wymagane — powstaje PO
oryginalnym `update`, więc jego brak znaczy uszkodzony zapis, nie niewiedzę.

⚠️ **Czego to nie naprawia wstecz:** pliki sprzed 2026‑08‑05 mają w tym polu `[]`
i nie da się dziś powiedzieć, które z nich znaczyło „brak migawki". Czytelnik ich
nie odrzuca; jednoznaczne są dopiero nowe zrzuty. Stoi to wypisane przy typie.

### AUDYT‑74 — `Battle.js:824` nie mówi o „reload” 🟡 XS — ✅ NAPRAWIONE ✓

`docs/MECHANIKA.md`, wpis „Granica walk”, sekcja „Czego ten wpis NIE rozstrzyga”.
Linia 824 assetu to `const initLoot = isset(allData.loot) && …`; słowo „reload”
pada w `455`, `827`, `828` i `833`. Pozostałe cztery cytaty z tego wpisu
(`:344`, `:911`, `:945`, `:954`) trafiają **co do linii** — ten jeden nie.

**Zrobione.** Numer poprawiony na `827‑828` i `833`, z ⚠️ mówiącym, co stało
tam wcześniej i że pozostałe cztery cytaty sprawdzono.

### AUDYT‑75 — pomiar, na którym stoi wpis „Granica walk”, jest nieweryfikowalny 🟡 XS — ✅ NAPRAWIONE

Tabela pięciu wywołań i dwóch walk w `docs/MECHANIKA.md` odsyła do
`walka-tempest-2026-08-05T11-49-44-019Z.json`, którego w repo nie ma — odpadł
jako sklejony. Sam **wniosek się broni**, bo jest niezależnie potwierdzony
czterema cytatami z `Battle.js` (sprawdzone co do linii) i pomiarem z `AUDYT‑56`.
Ale sam pomiar stoi wyłącznie na słowie autora, a to gatunek zapisu, który w tym
repo już dwa razy skłamał. **Docelowo.** Albo odsyłacz do `AUDYT‑56` jako
odtwarzalnej podstawy, albo zdanie mówiące wprost, że pliku nie ma.

**Zrobione — oba naraz.** `docs/MECHANIKA.md` mówi dziś wprost, że pliku
w repo nie ma i że tabeli nie da się odtworzyć, a zaraz obok wskazuje dwie
podstawy, które odtworzyć się dają: cztery cytaty z klienta i pomiar
z `AUDYT‑56`. Wniosek zostaje, jego dowód przestał zależeć od pliku, którego
nikt już nie zobaczy.

---

Pozycje ⚪ — drobne, zapisane żeby nie ginęły.

- **AUDYT‑76** ⚪ XS ✓ — `AGENTS.md`: „Katalog pusty albo **literówka w ścieżce**
  zapala osobny test”. Pusty katalog owszem; literówka w ścieżce **nie**:
  `readdirSync` rzuca ENOENT na poziomie modułu (`tests/fixtury.ts:87`), więc
  strażnik z `:34` nigdy nie startuje, a razem z nim pada ładowanie
  `tests/stats.test.ts`. Głośno — ale nie „osobnym testem”. Zmierzoną mutacją
  w specu była literówka w **rozszerzeniu**, i tylko ta kończy się „strażnik
  i NIC więcej”. Zdanie uogólnia pomiar, którego nie zrobiono.
  **✅ Zrobione:** zdanie w `AGENTS.md` rozdziela dziś oba przypadki i mówi, co
  naprawdę dzieje się przy złej ścieżce — ENOENT przy ładowaniu modułu, razem
  z nim pada `tests/stats.test.ts`.
- **AUDYT‑77** ⚪ XS ✓ — „nic tu nie jest wymienione z nazwy” (`tests/fixtury.ts:33`,
  powtórzone w `tests/fixtury.test.ts:17`) kontra `tests/fixtury.test.ts:50`:
  `FIXTURY.find((x) => x.nazwa === "2026-08-04-tempest-lowca-vs-odyncze")`.
  Zapala się głośno przy zmianie nazwy, więc to nie cicha zieleń — ale zdanie
  jest fałszywe i akurat w tym pliku.
  **✅ Zrobione:** nagłówek `tests/fixtury.ts` mówi dziś „`readdirSync` bierze
  każdy `.json`" i osobno przyznaje, że jeden plik jest wołany po nazwie — po to,
  żeby porównać kopię z oryginałem. Odkrywanie dotyczy PĘTLI niezmienników.
- **AUDYT‑78** ⚪ XS ✓ — test kopii (`tests/fixtury.test.ts:49`) porównuje
  `KOMUNIKATY` i `SKLAD` wyczerpująco, ale **nie nagłówek** — czyli nie to, co
  się zepsuło (build `1781609507010` w prozie modułu). `f.zrzut.build` jest w tym
  samym teście, obok; brakuje jednego `toContain`.
  **✅ Zrobione:** osobny test czyta `tests/walka-z-gry.ts` jako TEKST i porównuje
  nagłówek z `build` oraz `swiat` fixture'a. **Mutacja rozstrzygająca:** wpisanie
  z powrotem historycznego `1781609507010` zapala **dokładnie ten jeden test** —
  błąd, który kiedyś przeszedł niezauważony przez dobę, dziś nie przejdzie.
- **AUDYT‑79** ⚪ XS ✓ — `docs/ROADMAP.md:200`: „**Cztery pozycje wyżej** kończą
  się zdaniem «brakuje zrzutu z gry»”. Wyżej są **trzy**; czwarta leży niżej,
  w liście na `:270`.
  **✅ Zrobione:** zdanie wymienia dziś trzy pozycje z nazwy i mówi, że czwarta
  stoi w liście zakupowej niżej.
- **AUDYT‑80** ⚪ XS ✓ — `AGENTS.md:141` żąda od `tests/fixtures/README.md` opisu
  **bez liczb**; ten README niesie `1,44 MB` i `id −255967 i −255969`. Reguła
  łamie się w pliku, którego dotyczy.
  **✅ Zrobione przez zwężenie REGUŁY, nie przez cięcie README.** Zakaz brzmi
  dziś „bez POLICZONYCH liczb" — tych, które maszyna umie wyliczyć z pliku, bo
  tylko one rozjeżdżają się po cichu. `id` i daty zostają: bez nich nie da się
  powiedzieć, co plik pokrywa.
- **AUDYT‑81** ⚪ S — `czyZachowac` decyduje PO głębokiej kopii: `po()`
  (`src/zrzut.ts:351‑361`) robi `JSON.parse(JSON.stringify(ladunek))` i `migawka()`
  **przed** sprawdzeniem, czy wpis w ogóle zostanie. W jedynym zrzucie odpadło
  565 z 569 wywołań — każde zapłaciło pełną serializację ładunku razem z `w`,
  w callbacku wewnątrz `Engine.battle.update`. Koszt płacony wyłącznie przy
  włączonym trybie deweloperskim, stąd ⚪, a nie 🟡.
  **✅ Zrobione:** decyzja `czyZachowac` leci PRZED kopią, kształt liczony jest
  z ORYGINAŁU (te same klucze), kopiowane jest wyłącznie to, co zostaje.
  **Pomiar na ładunku w skali walki grupowej** — 12 wojowników po ~20 pól,
  565 dokładnych powtórzeń, rozkład z prawdziwego zrzutu: **18,9 → 5,6 ms**,
  czyli 0,033 → 0,010 ms na wywołanie.
- **AUDYT‑82** ⚪ XS — **sporne i nierozstrzygnięte w tym audycie.** `AGENTS.md:150`
  i spec mówią „dorzucenie jednego pliku dało **14** testów więcej” (121 → 135);
  drugi rachunek dał **16** (8 z `describe.each` w `fixtury.test.ts` + 8 z pętli
  po `KORPUS` w `stats.test.ts`). Rozstrzyga jeden pomiar: skopiować fixture pod
  inną nazwą, policzyć, skasować. Audyt był tylko‑do‑odczytu, więc go nie zrobił
  — i to jest jedyna liczba z tej rundy, która **nie została sprawdzona**.
  **✅ Zmierzone:** 702 → **718** ze skopiowanym fixturem, 702 po jego usunięciu.
  Różnica **16**, nie 14. Lekcja jest ogólniejsza od poprawki i tak ją zapisano
  w `AGENTS.md`: ta liczba rośnie razem z zestawem testów, więc nie ma sensu
  cytować jej jako stałej — znaczenie ma znak, nie wartość.
- **AUDYT‑83** ⚪ XS ✓ — `Kolekcjoner.wlaczony()` (`src/zrzut.ts:125`) nie jest
  wołane przez jedynego konsumenta typu (`protokol-source.ts`); okno ustawień
  używa własnego `ZrodloZrzutu` (`opcje.ts:37`). Martwy człon kontraktu, którego
  `noUnusedLocals` nie łapie, bo atrapy w testach go implementują.
  **✅ Zrobione:** `wlaczony()` zszedł z typu `Kolekcjoner`; metoda
  w `KolekcjonerZrzutu` zostaje, bo to ona odpowiada oknu. Kompilator od razu
  wskazał dwie atrapy, które ją implementowały.
- **AUDYT‑84** ⚪ S — tryb deweloperski przeżywa odświeżenie (`margometer.dev`
  zapisywane jako `"0"`, nie kasowane — inaczej niż `recorder.ts:488`), a jedyny
  sygnał, że jest czynny, siedzi **w zamkniętym oknie** (`.opcje-warn`). Zębatka
  w nagłówku panelu pokazuje wyłącznie „otwarte/zamknięte”. Gracz, który włączył
  tryb raz i zapomniał, płaci koszt z `AUDYT‑81` przy każdym wejściu do gry i nie
  ma jak się o tym dowiedzieć.
  **✅ Zrobione:** zębatka nosi kropkę, dopóki tryb jest czynny — i **nie samym
  kolorem**: `aria-label` mówi „tryb deweloperski włączony". Kropka, a nie inne
  tło przycisku, bo tło niesie już stan „otwarte/zamknięte". **Mutacja:** zdjęte
  `overlay.refresh()` przy przełączniku → pada dokładnie ten jeden test.
  ⚠️ Wyłącznika awaryjnego NIE MA i nie było w propozycji — kropka odpowiada na
  „nie wiem, że zbieram", nie na „chcę wyłączyć spoza okna".

---

### AUDYT‑85 — awaria gry gubiła granicę następnej walki 🔴 XS — ✅ NAPRAWIONE ✓ (regresja rundy napraw)

`src/protokol-source.ts` (opakowanie `update`, flaga `swiezaWalka`)

**Problem.** Znalezione **nie przez audyt, tylko przez przegląd własnych
napraw** — i to jest czwarty dowód tej samej zasady, tym razem złapany PRZED
commitem. Naprawa `AUDYT‑56` dołożyła flagę `swiezaWalka`, żeby `init` pierwszej
walki nie liczył jej drugi raz. Flaga była zerowana **zwykłą linią na końcu
opakowania**, a nie w `finally`.

Wyjątek z `oryginal.apply` jest błędem GRY i ma lecieć dalej nietknięty — ale
zabierał ze sobą wyzerowanie flagi. Gdy gra wywracała się na wywołaniu tuż po
odcięciu, flaga zostawała `true` i **następny `init` był przeoczony jako „ta
sama świeża walka"**. Czyli sklejenie dwóch walk, przed chwilą naprawione,
wracało wąskim wejściem: jedna awaria gry i zrzut zapisuje dwie walki pod
jednym numerem.

**Zrobione.** `try { … } finally { this.swiezaWalka = false; }`. Wyjątek gry
nadal wychodzi nietknięty — zmienia się tylko to, że nasz stan zostaje
uporządkowany po drodze.

⚠️ **PIERWSZA WERSJA TESTU BYŁA ZIELONA PRZY ZEPSUTYM KODZIE** i to jest tu
najważniejsza lekcja. Odtwarzała „gra pada w środku walki", a flaga jest `true`
wyłącznie **tuż po odcięciu** — więc test opisywał moment, w którym błąd nie
zachodzi. Dopiero mutacja pokazała, że test nic nie pilnuje. Reguła „zepsuj
naprawę i sprawdź, że test się zapala" zadziałała dokładnie tam, gdzie miała:
nie na kodzie, tylko na TEŚCIE.

Poprawiona wersja stawia awarię na pierwszym wywołaniu po podpięciu i patrzy na
licznik walk kolekcjonera, nie na obrażenia w panelu — bo bufor komunikatów jest
wtedy pusty i panel nie ma czego skleić. Mutacja: zerowanie flagi poza `finally`
→ pada dokładnie ten jeden test.

**Co przy okazji zostaje powiedziane, a nie naprawione.** Walidacja wpisów
z `AUDYT‑65` rzuca przy WCZYTANIU, a `tests/fixtury.ts` czyta katalog na
poziomie modułu — więc uszkodzony fixture wywraca ładowanie i zabiera ze sobą
`tests/stats.test.ts`, dokładnie jak literówka w ścieżce z `AUDYT‑76`. Jest to
głośne i takie ma być; warto tylko wiedzieć, że komunikat przyjdzie z importu,
a nie z nazwanego testu.

### AUDYT‑86 — narzędzie milczało o URWANYM zrzucie 🟡 XS — ✅ NAPRAWIONE ✓ (z przeglądu rundy napraw)

`tools/walka.ts` (`--pokaz`, `--zachowaj`)

**Problem.** Pole `przepelniony` znaczy „bufor zbierania dobił do sufitu
i stanął", czyli **końca walki w zrzucie nie ma**. Okno ustawień mówi o tym
graczowi, `czytajZrzut` przepuszcza pole dalej, a `AUDYT‑72` dołożył mu właśnie
pierwsze testy. Tylko że OFFLINE — w jedynym momencie, w którym materiał wchodzi
do repo — nie oglądał go **nikt**: ani `--pokaz`, ani `--zachowaj`. Fixture
z urwanym końcem wyglądałby jak walka, która po prostu tak się skończyła, a opis
„czego w nim nie ma" pisałby człowiek nieświadomy urwania.

To jest ta sama klasa, co `AUDYT‑64`: sygnał istnieje w danych i nie dociera
do człowieka w miejscu, w którym podejmuje decyzję.

**Zrobione.** Wspólne `urwany()` — `--pokaz` wypisuje ostrzeżenie razem
z nagłówkiem, `--zachowaj` powtarza je po zapisie. **Ostrzeżenie, nie odmowa:**
urwany zrzut nadal niesie materiał, a wycięcie go po swojemu byłoby edytowaniem
dowodu. Przy okazji `--pokaz` pokazuje `pominietych`, czyli ile gra odsiała jako
powtórzenia — druga liczba, która leżała w pliku i nie miała czytelnika.

**Mutacja:** `urwany()` zawsze milczy → pada test „zrzut z pełnym buforem daje
ostrzeżenie".

---
## G. Otwarte z poprzednich rund

Bez nowych ID — sam wskaźnik, żeby ten dokument był pełną migawką otwartych
spraw, a nie tylko listą nowych.

| Gdzie | Co |
|---|---|
| ~~`UX-POPRAWKI.md A14`~~ | ✅ **2026‑08‑01** — `.bar` na `opacity: .55` + nasadka w pełnej barwie; próg pilnuje test kontrastu. ⚠️ Stało tu, że `AUDYT‑14` (odznaka profesji) **zostaje otwarte** — nieprawda, sprostowane 2026‑08‑01: własny wpis `AUDYT‑14` mówi „✅ NAPRAWIONE", odznaka jest w drzewie (`overlay.ts`, `.label[data-prof]::before`) od `3a784f6`. Status żył w dwóch miejscach i rozjechał się w obrębie JEDNEGO pliku. |
| `UX-POPRAWKI.md B2–B12` | Wygody: suwak po turach, auto‑pauza, sygnał „trzymam postać”, TOP‑3 w dymku, ostrzeżenie o eksmisji, filtr w archiwum, eksport dla Discorda, onboarding, reset ustawień. |
| `SOLID.md §4.12` | Przycięcie logu w trakcie walki OBNIŻA liczby — otwarte, czeka na decyzję i na fixture z przyciętym nagłówkiem. |
| ~~`SOLID.md §4.18`~~ | ✅ **2026‑08‑01** (`98ab619`). ⚠️ Stało tu jako otwarte do 2026‑08‑02 — a własna sekcja w `SOLID.md:358` mówi `[NAPRAWIONE 2026‑08‑01]`. Status żył w dwóch miejscach i rozjechał się dokładnie tak, jak przy `A14` o dwa wiersze wyżej. |
| ~~`SOLID.md §4.22`~~ | ✅ **2026‑08‑01** (`98ab619`, `c39d35b`). Ten sam rozjazd: `SOLID.md:415` mówi `[ROZSTRZYGNIĘTE 2026‑08‑01]`. **Wniosek, trzeci raz ten sam:** tabela ze statusem cudzej pozycji jest długiem — poprawia się sekcję, którą się czyta, nie skrót. Docelowo zostawić tu same odsyłacze, bez kolumny statusu. |
| ~~`SOLID.md §4.23`~~ | ✅ **2026‑08‑01** — podsumowania liczą się leniwie: 269 → 62 ms blokady przy 190 nagraniach, a liczba parsowań przestała rosnąć z długością listy. |
| ~~`ROADMAP.md ⏸`~~ | ✅ **ROZSTRZYGNIĘTE 2026‑08‑03** — wszystkie trzy pozycje są dziś `❌ Porzucone`, a kod i dane, które na nie czekały, zeszły z drzewa (`AUDYT‑6`, `AUDYT‑25`). Symbolu `⏸` nie ma już w `ROADMAP.md` ani razu. **Czwarty raz ten sam rozjazd w tej jednej tabeli** — patrz wiersze `A14`, `§4.18` i `§4.22` wyżej. |

⚠️ ~~**Martwy kod jest zabetonowany testami.**~~ **NIEAKTUALNE od 2026‑08‑03.**
Akapit mówił, że dwa zielone testy asertują NIEOBECNOŚĆ osi tur i skupienia
ognia, więc usunięcie `renderAxis`/`renderFireFocus` wymaga skasowania
przechodzących testów — i że to podnosi próg decyzji „porzucone czy
wstrzymane". Decyzja zapadła: **porzucone**, renderery i testy zeszły z drzewa
razem z `stats.deaths` i `stats.matrix`. Zapis zostaje, bo pokazuje, ile
kosztuje NIEPODJĘTA decyzja: kod nie kosztował nic, ale jego dane liczyły się
przy każdej walce przez trzy dni po tym, jak przestały być komukolwiek potrzebne.

⚠️ **Co ta sekcja mówi o sobie samej.** Cztery z siedmiu wierszy tej tabeli
zestarzały się przed swoją pozycją źródłową, każdy raz. Wniosek zapisany przy
`§4.22` („zostawić tu same odsyłacze, bez kolumny statusu") stoi tu od
2026‑08‑02 i **nadal nie został wykonany** — to jest dziś najtańsza otwarta
robota w całym `docs/`.
