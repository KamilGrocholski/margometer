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

**Dopisane 2026‑08‑05 (sekcja `J`, domknięta 2026‑08‑06):** `AUDYT‑87`…`AUDYT‑94` — audyt **PO**
commicie `72dc330`, na czystym drzewie i zielonej bramie. Pierwszy raz runda
szukała wyłącznie tego, co definiuje kierunek z `ROADMAP.md`: *złej liczby
pokazanej bez ani jednego słowa ostrzeżenia*. Znalazła trzy takie miejsca —
efekty obronne liczone napastnikowi (`87`), ubytek życia liczony jako leczenie
na minusie (`88`) i przypisanie sprawcy zranienia zależne od języka klienta
(`89`) — plus trzy sprostowania (`90`…`92`). Wszystkie naprawione w tej samej
rundzie, każda naprawa z **zepsutą i zmierzoną mutacją**.

⚠️ **`AUDYT‑93` jest korektą `AUDYT‑87`, dopisaną po jego naprawie**, i sekcja
zostawia oba wpisy obok siebie celowo. Tamten postawił tabelę stron na JEDNYM
źródle i wyglądał na mocny — cytat z kodu gry, numery linii, 200 przejrzanych
kluczy — a mimo to pomylił się na trzech z dwudziestu czterech, bo **pytanie,
na które odpowiada źródło, nie było pytaniem, które zadaje panel**. Kubełek
renderera mówi, KOGO efekt dotyczy; `procs` pyta, KTO go wyzwolił. Drugie
źródło (katalog efektów w pomocy gry) nie dołożyło precyzji — zmieniło
odpowiedź. Jedno źródło nie ma jak pomylić się widocznie.

⚠️ **Dwa z trzech błędów miały JEDNĄ przyczynę i to jest lekcja tej sekcji.**
`BattleEvent.attack.procs` był `string[]`, czyli samą etykietą; protokół niósł
przy każdym efekcie klucz, wartość i stronę. Kontrakt gubił dwie z trzech
rzeczy, więc agregat nie miał czym przypisać efektu poprawnie — **nie było to
przeoczenie w agregacie, tylko brak w typie**. Reguła z `CLAUDE.md` („to typ
jest tu obietnicą") ma tu trzeci dowód, tym razem od strony pola, którego
w typie ZABRAKŁO, a nie takiego, które ktoś zapomniał odczytać.

⚠️ **Drugi wzorzec, warty osobnego zdania:** `AUDYT‑88` był cichą regresją po
skasowaniu parsera tekstu 2026‑08‑04, a razem z nim w drzewie zostały **trzy
martwe strażniki** broniące przed zdarzeniem, którego nikt już nie produkował.
Nie zapalał ich żaden test i nie łapie ich `noUnusedLocals` — są czytane, tylko
przez warunek, który nigdy nie zachodzi. **Kasując ścieżkę WEJŚCIA, trzeba
przejść to, co po niej zostaje na WYJŚCIU.**

**Dopisane 2026‑08‑06 (sekcja `K`):** `AUDYT‑95`…`AUDYT‑99` — runda wyrosła
z dwóch przypisów, którymi kończyła się sekcja `J` („⚠️ znalezisko poboczne,
otwarte"). Zmierzenie ich pokazało, że były czubkiem czegoś większego.

⚠️ **Metoda, która to znalazła, jest tu warta więcej niż same pozycje.** Nie było
to czytanie kodu ani szukanie po omacku, tylko jedno przejście **wszystkich 197
kluczy tabeli efektów nieliczonych przeciw słownikowi gry** z jednym pytaniem:
*czy zdanie tego klucza mówi o punktach obrażeń albo punktach życia?* Odpowiedź:
**jedenaście kluczy**, siedem naprawionych w tej rundzie, cztery zapisane jako
otwarte. Skan zajął jedno uruchomienie i wart jest powtórzenia po każdej
aktualizacji gry.

⚠️ **Wniosek ogólniejszy od jedenastu kluczy: reguła „nieznane ma być głośne"
nie chroni przed ZNANYM, o którym zdecydowano źle.** Klucz w `PROCE` jest dla
dekodera rozpoznany, więc nie zapala `unknown` — a `PROCE` jest tabelą DECYZJI
i decyzja bywa zła. Milczy wtedy dokładnie tak samo skutecznie jak brak wpisu.
Docstring tabeli ostrzega przed jej rozdęciem („lista jest WYLICZONA, a nie
domyślna"); tego, że wyliczona lista też się myli, nie ostrzegał nikt.

⚠️ **Trzeci raz ten sam kształt: martwy kod po skasowanym parserze.**
`AUDYT‑97` znalazł w `DOT_LABELS` dwie etykiety, których żadna ścieżka dekodera
nie produkowała od 2026‑08‑04 — i to one **dowiodły**, że `AUDYT‑95` jest cichą
regresją, a nie brakiem funkcji: parser tekstu te obrażenia liczył, droga
protokołu nie liczyła ich nigdy. Po `AUDYT‑88` (trzy martwe strażniki) i po
`AUDYT‑92` (ścieżka, do której przeprowadziła się wiedza) reguła „kasując
ścieżkę WEJŚCIA, przejdź to, co zostaje na WYJŚCIU" ma trzeci dowód w ciągu
trzech dni.

**Dopisane 2026‑08‑07 (sekcja `N`):** `AUDYT‑107`…`AUDYT‑116` — audyt **PO**
commicie `d978554`, na czystym drzewie i zielonej bramie (816 zielonych).
Przedmiotem była CAŁA droga liczby od gry do panelu, zamówiona jako audyt
jakości kodu i poprawności pozyskiwania danych. Sekcja powstała **w całości
otwarta**, jak `I`. Dziesięć znalezisk, każde zreprodukowane; dwa 🔴 — cudza
warstwa na `Engine.battle.update` podwaja obrażenia w ciszy (`107`) i `splitFights`
dzieli po zdarzeniu, którego dekoder nie produkuje od 2026‑08‑04 (`108`).

⚠️ **Ten łańcuch akapitów sam jest dowodem `AUDYT‑116`.** Między `K` a tym
zdaniem powinny stać dwa wpisy o sekcjach `L` i `M`; nie ma ich. Tak samo jak
w tabeli `§0` konwencja nie została porzucona decyzją — przestała być
wykonywana, i widać to dopiero, gdy się do niej dopisuje.

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

- teza o redundancji **już nie zachodzi**. Leczenie kierowane („`Gracz D
  wykonuje Leczenie ran.`" → „`Uleczono Gracza A o 11937 punktów życia.`")
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
wiersza zaczął zwracać „HŁowca Wichrów". Pseudoelement trzyma literę poza
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
---
## J. Atrybucja efektów, leczenia i ubytku życia — audyt PO commicie `72dc330` (2026‑08‑05)

Drzewo robocze było czyste, brama zielona (`bun run check` → **708 zielonych**),
a `AUDYT‑56…86` domknięte. Ta runda nie przeglądała więc czekającej zmiany,
tylko **stan po tamtych naprawach** — i celowała wyłącznie w test, którym
`ROADMAP.md` definiuje kierunek od 2026‑08‑03: *czy brak tej rzeczy może
sprawić, że panel pokaże złą liczbę, nie mówiąc o tym ani słowem?*

Znaleziska: **trzy takie miejsca**, wszystkie zreprodukowane pomiarem. Żadne
z nich nie zapala `unknownLines` ani `unknownElements`, czyli jedynych dwóch
czujek panelu — były ciche z definicji, nie przez przeoczenie.

**Czego audyt NIE podważa**, żeby nie zginęło w liście: cztery gwarancje
owinięcia `Engine.battle.update` (oryginał pierwszy, wynik nietknięty, wyjątek
nie wychodzi, zdejmujemy tylko swoje); granica walki na `data.init`; świadek
`hp.max` (7 porównań, 0 rozjazdów); rozdzielenie `damageBlocked` jako PODZBIORU
`damageAbsorbed` — sprawdzone, zgadza się i jest tak opisane w panelu;
zgodność 233 kluczy z assetem; parowanie zadanych z przyjętymi (0 rozjazdów na
materiale). **Sumy obrażeń były i są poprawne — ta runda dotyczy tego, KOMU się
liczą.**

⚠️ **Dwa z trzech znalezisk miały JEDNĄ przyczynę** i to jest lekcja tej rundy.
`BattleEvent.attack.procs` był `string[]` — samą etykietą do pokazania —
podczas gdy protokół niesie przy każdym efekcie klucz, wartość i (przez tabelę
ról) stronę. Kontrakt przepuszczał dalej jedną z trzech rzeczy, więc `stats.ts`
nie miał czym przypisać efektu poprawnie, **choćby chciał**. Wniosek zapisany
przy typie `Proc`: *etykieta jest do POKAZANIA, nie do PODEJMOWANIA DECYZJI.*

### AUDYT‑87 — efekty OBRONNE liczą się napastnikowi 🔴 M — ✅ NAPRAWIONE ✓

`src/stats.ts` (pętla po `event.procs`) · `src/protokol.ts` (`STRONA_CELU`)

**Problem.** Każdy proc szedł do `procs` napastnika i do `procsReceived` celu —
na sztywno. Gra mówi co innego: `battleMsg` składa linię z trzech kubełków
(`BattleMessages.js:162`) i przy ciosie wypełnia skrajne dwa (`:1127‑1129`),
`tm[0]` zdaniem o `f1` (bijący), `tm[2]` o `f2` (bity). Klucz dopisujący się do
`tm[2]` opisuje CEL — i jest to ten sam kubełek, w którym stoją `-blok` (`:827`)
i `-evade` (`:830`), czyli dwie rzeczy, które dekoder przypisuje celowi od
początku. Reguła nie była nowa, tylko stosowana do dwóch kluczy zamiast do 26.

**✓ Zmierzone.** Przejściem wszystkich **200** kluczy trafiających do listy
efektów przez ciała gałęzi `battleMsg`: **24 lądują w `tm[2]`**. Reprodukcja na
`1=100.00;2=50.00;+dmgd=500;-dmgd=300;-absorb=200;-parry` — napastnik miał
w rubryce „Efekty w ciosach" wpisane `-absorb` i `-parry`, czyli tarczę, którą
podniósł ktoś inny; bity miał je w „Efekty otrzymane".

⚠️ **Pierwszy pomiar dał 17 i był ZA NISKI** — skrypt nie radził sobie
z gałęziami zbiorczymi. Poprawiony wyłuskał jeszcze siedem (`+critpoison_per`,
`+vulture`, `-redacdmg`, `-redacdmg_per`, `-reddest_per`, `-redendest_per`,
`-redmanadest_per`); dziewięć nierozstrzygniętych (`+crush_*`, `fire`, `frost`,
`light`, `physical`) sprawdzono ręcznie — wszystkie `tm[1]`. Lekcja: przy
skanowaniu cudzego `switch`‑a fall‑through jest regułą, nie wyjątkiem, i pomiar
bez jego obsługi myli się **w dół**, czyli po cichu.

**Zrobione.** `Rola` niesie `strona`, lista `STRONA_CELU` jest wyliczona wpis po
wpisie z numerem linii renderera, `stats.ts` kieruje efekt do właściciela.
**Mutacja:** strona z powrotem na sztywno → 2 fail (716/2). Doszedł niezmiennik
„żaden efekt nie ginie i żaden nie liczy się dwa razy".

⚠️ **Co ZOSTAJE otwarte.** `tm[1]` mieści 167 z 200 kluczy i jest kubełkiem
NEUTRALNYM, nie „stroną bijącego". Traktujemy je jak zaczepne, bo większość taka
jest — ale dla tej grupy **nie mamy dowodu, tylko brak przeciwdowodu**. Klucz
z `tm[1]` należący do celu nadal poszedłby po cichu do napastnika.

**Docelowo.** `docs/MECHANIKA.md` — wpis „Po czyjej stronie zachodzi efekt".

### AUDYT‑93 — kubełek renderera mówi, KOGO efekt dotyczy, a nie KTO go wyzwolił 🔴 S — ✅ NAPRAWIONE ✓ (korekta `AUDYT‑87`)

`src/protokol.ts` (`STRONA_CELU`) · `docs/MECHANIKA.md`

**Problem.** `AUDYT‑87` postawił całą tabelę stron na JEDNYM źródle — kubełku
`tm[2]` w rendererze — i wyciągnął z niego wniosek, którego on nie niesie.
`tm[2]` dowodzi, że zdanie **dotyczy** bitego, czyli że efekt na nim WYLĄDOWAŁ.
Panel pyta o co innego: `procs` to „efekty, które ta postać ma z ekwipunku", czyli
o WYZWOLENIE. Dla efektów obronnych oba znaczenia się pokrywają — parowanie
dotyczy bitego i należy do bitego — ale dla debuffów rzucanych ciosem rozjeżdżają
się, bo ląduje na bitym coś, co wyzwolił bijący.

**✓ Zmierzone.** Drugim, niezależnym źródłem: **katalog efektów w pomocy gry**
(`view,372`, wpisy „pasywny/aktywny *nazwa* • Działanie: …"), opisujący efekt
z perspektywy postaci, KTÓRA GO MA. Pokrycie: **68 z 200 naszych kluczy**. Tam,
gdzie oba źródła mówią o obronie, są zgodne co do jednego (6/6). Rozjazd wyszedł
na trzech kluczach — i wszystkie trzy `AUDYT‑87` wpisał do tabeli błędnie:

| klucz | kubełek | co mówi pomoc |
|---|---|---|
| `+critpoison_per` | `tm[2]` | „…leczenie z ekwipunku **atakowanego** Gracza zostaje zredukowane" — kryt jest bijącego |
| `+vulture` | `tm[2]` | `vulture_perw`: „…**obrażenia zadane** zostają zwiększone" |
| `+legbon_puncture` | `tm[2]` | „**wszystkie ataki** pomijają %val%% defensywy" |

W drugą stronę katalog dołożył dwa klucze, których kubełek NIE wskazywał, bo gra
drukuje je w neutralnym `tm[1]`: `-immunity_to_dmg` („Postać staje się
niewrażliwa na **otrzymywane** obrażenia") i `-redabdest_per` („redukuje
niszczenie absorpcji, którego źródłem są przedmioty **przeciwnika**").

**Zrobione.** `STRONA_CELU` rozbita według SIŁY DOWODU, nie alfabetycznie:
grupa A — oba źródła zgodne (19); grupa B — katalog przeciw kubełkowi, wygrywa
katalog (2); grupa C — sam kubełek, bez potwierdzenia (2, oznaczone jako
najsłabszy fragment listy). Trzy wycofane klucze są wymienione z nazwy w kodzie,
żeby nikt nie dodał ich z powrotem „bo są w `tm[2]`". **Mutacja:** powrót do
„wszystko z `tm[2]` to cel" → 5 fail (76/5).

⚠️ **Wniosek, przez który ta pozycja w ogóle powstała.** `AUDYT‑87` miał JEDNO
źródło i wyglądał na mocny — cytat z kodu gry, numery linii, 200 przejrzanych
kluczy. Zawiódł nie na dokładności, tylko na tym, że **pytanie źródła nie było
pytaniem panelu**. Drugie źródło nie dołożyło precyzji; zmieniło odpowiedź na
trzech kluczach z dwudziestu czterech. To jest ta sama lekcja, którą repo
zapisało przy usuwaniu drugiego odczytu walki: jedno źródło nie ma jak się
pomylić WIDOCZNIE.

⚠️ **Co ZOSTAJE otwarte — i to jest większa część problemu.** `tm[1]` mieści
**165 kluczy** i jest kubełkiem neutralnym. Katalog rozstrzygnął z nich dwa; dla
pozostałych 163 domyślne „bijący" jest **założeniem, nie odczytem**. Wiadomo
przy tym, że kubełek bywa w obrębie jednej rodziny niekonsekwentny: `-redendest`
i `-redmanadest` (`:971`, `:975`) idą do `tm[1]`, a ich warianty `_per` do
`tm[2]`, przy identycznym znaczeniu — więc w `tm[1]` niemal na pewno siedzą
kolejne efekty celu, których nie umiemy wskazać. Ograniczenie jest dziś
NAZWANE w trzech miejscach (kod, rejestr mechaniki, ten wpis) i nie ma terminu.

> ⚠️ **Zmniejszone 2026‑08‑06 przez `AUDYT‑94`** — nie zamknięte. Sześćdziesiąt
> z tych kluczy przeczytano po jednym w katalogu pomocy i wszystkie potwierdziły
> domyślną stronę, więc dla nich „bijący" jest już odczytem. Otwarte zostaje
> **117 kluczy bez żadnego drugiego źródła**. Liczby „165" i „163" wyżej opisują
> stan sprzed tamtego przeglądu i tak mają być czytane; aktualną wartość podaje
> `AUDYT‑94`. Wpis zostaje bez przepisywania, bo cała sekcja opisuje stan SPRZED
> naprawy — ale bez tego odsyłacza byłby to piąty w tym pliku status żyjący
> w dwóch miejscach naraz.

**Docelowo.** `docs/MECHANIKA.md` — sprostowanie przy wpisie „Po czyjej stronie
zachodzi efekt".

### AUDYT‑94 — 60 kluczy przeczytanych po jednym: strona domyślna się broni ⚪ M — ✅ ZAMKNIĘTE ✓

`src/protokol.ts` (komentarz przy `STRONA_CELU`) · `docs/MECHANIKA.md`

**Problem.** Po `AUDYT‑93` zostało 177 kluczy ze stroną „napastnik" przyjętą
DOMYŚLNIE, czyli 177 twierdzeń bez odczytu. Z tego 60 miało opis w katalogu
efektów pomocy gry, po którym przeszedł dotąd tylko zgrubny wzorzec szukający
słów o obronie — a dwa klucze (`-immunity_to_dmg`, `-redabdest_per`) wyszły
właśnie z takiego opisu przeczytanego zdanie po zdaniu.

**✓ Zrobione.** Przeczytane wszystkie 60, po jednym. **Zero zmian w tabeli** —
każdy opis potwierdził domyślnego napastnika. To jest wynik POZYTYWNY, nie brak
wyniku: dla tych 60 „napastnik" przestało być założeniem i jest odczytem.
Zostaje **117 kluczy bez żadnego drugiego źródła**.

⚠️ **Przegląd o mało nie wprowadził błędu i to jest jego najważniejsza treść.**
Trzy klucze — `resfire_per`, `resfrost_per`, `reslight_per` — katalog opisuje
zdaniem „zwiększa odporność na ogień Postaci, **na którą rzucona jest
umiejętność**". Czyta się to jak wskazanie drugiego segmentu i o krok dzieliło
je od wpisania do `STRONA_CELU`. Mówi jednak tylko, komu efekt POMAGA; wyzwala
go umiejętność rzucającego.

To jest **lustrzane odbicie pomyłki z `AUDYT‑93`**: tam kubełek wskazywał
bitego, bo efekt na nim LĄDUJE; tu zdanie wskazuje bitego, bo mu SŁUŻY. Ani
„ląduje", ani „służy" nie znaczy „wyzwolił". Stąd test, który wchodzi do repo
razem z tym wpisem: trzy klucze zapinają się jako `attacker`, a dopisanie ich do
tabeli „bo pomoc mówi o celu" zapala trzy asercje.

**Test przy każdym kolejnym wpisie**, zapisany w kodzie i w rejestrze: *czy
gdyby ta postać zdjęła cały swój ekwipunek i umiejętności, efekt nadal by
zaszedł?* Jeśli tak — nie jest jej.

⚠️ **Co ZOSTAJE otwarte i czego NIE domknie materiał z gry.** 117 kluczy bez
drugiego źródła. Zrzut ich nie rozstrzygnie i to jest zmierzone, nie
przypuszczane: protokół **nie koduje właściciela efektu w ogóle** — komunikat to
dwa segmenty `id` i płaska lista kluczy, więc więcej materiału daje więcej
wystąpień tego samego kształtu, a nie nową informację. Migawka wojownika niesie
tylko `hp`, `mana`, `energy`, `ac`, więc korelacją różnic dałoby się ruszyć
**26 ze 177** — i tylko te, które w danej walce wystąpią. Zmierzone: jedyna
prawdziwa walka w repo pokazuje **3 różne klucze efektów**. Sprawdzone i również
ślepe: pole „• Wyzwolenie:" w katalogu nazywa warstwę obliczeń, nie postać
(0 ze 177 mówi „u przeciwnika"), a archiwum walk grooove.pl niesie prawdziwy
protokół, ale w skompresowanym dialekcie (`@Dd` zamiast `+dmgd`) i z tymi samymi
dwoma segmentami.

⚠️ **Dwa znaleziska poboczne**, obie poza tematem przeglądu i obie otwarte:
`dmg-target_physical` oraz `vamp` NIOSĄ OBRAŻENIA, a stoją w tabeli efektów
nieliczonych (dołączają do `fire`, `frost`, `light`, `physical` z `AUDYT‑87`);
efekty z komunikatu BEZ ani jednej liczby obrażeń przepadają w całości —
sprawdzone, `tspell=Tarcza;resfire_per=20` daje samo zdarzenie `ability`.

**Docelowo.** `docs/MECHANIKA.md` — wpis „Po czyjej stronie zachodzi efekt".

### AUDYT‑88 — ujemny `heal` to REALNY UBYTEK HP, a liczy się jako leczenie 🔴 S — ✅ NAPRAWIONE ✓

`src/protokol.ts` (`case "leczenie"`)

**Problem.** Klucz `heal` z wartością ujemną to w grze „Stracono −92 punktów
życia X" — rozstrzyga o tym znak, w jednym warunku (`BattleMessages.js:301`,
`m[1] >= 0 ? part_gained : part_lost`). Dekoder oddawał to bez ani jednego
warunku jako `{kind:"heal", amount:-92}`.

**✓ Zmierzone** na `1=88.00;0;heal=-92`: `healingReceived −92`, `damageTaken 0`,
wiersz rozbicia „Regeneracja −92", `unattributedHealing.mine −92`. Czyli 92
punkty realnej straty **znikały z obrażeń** i siadały w „uleczone" ze znakiem
minus.

⚠️ **To była cicha REGRESJA po skasowaniu parsera 2026‑08‑04**, nie brak funkcji.
Parser czytał tę linię jako `RE_HP_LOST → kind:"dot"`; droga protokołu tego
zachowania nigdy nie miała. Zostawiło to w drzewie **trzy martwe strażniki**:
`SELF_INFLICTED_DOTS`, `DOT_LABELS["od ubytku życia"]` i wyjątek przy
`UNKNOWN_DETAIL`. Żaden nie zapalał testu i żadnego nie łapie `noUnusedLocals` —
są CZYTANE, tylko przez warunek, który nigdy nie zachodził.

**Zrobione.** Ujemna kwota przy `heal` → `kind:"dot"`, rodzaj „od ubytku życia",
kwota dodatnia (minus jest ozdobnikiem zapisu, nie negacją). Zakres wąski
świadomie: `%gain_lost%` stoi w zdaniu wyłącznie klucza `heal` — sprawdzone po
jednym dla pięciu pozostałych kluczy leczenia — więc ujemna kwota przy nich idzie
do `{kind:"unknown"}`, głośno. **Mutacja:** wyłączenie obu gałęzi → 5 fail
(718/5), w tym „sprawcy NIE zgadujemy, choć przeciwnik jest tylko jeden".

⚠️ **Co ZOSTAJE otwarte.** Materiału z tą linią repo NIE MA (patrz `AUDYT‑91`),
więc poprawka stoi na źródle renderera — mocnym — i na pomiarze, którego dziś
nikt nie powtórzy. Testy są syntetyczne.

**Docelowo.** `docs/MECHANIKA.md` — wpis „Linia »Stracono −N punktów życia«".

### AUDYT‑89 — przypisanie sprawcy zranienia wisi na POLSKIM zdaniu z gry 🟡 S — ✅ NAPRAWIONE ✓

`src/stats.ts` (`RE_WOUND_PROC`)

**Problem.** Jedyne miejsce, w którym tykający efekt dostaje sprawcę WPROST,
wiązało się wyrażeniem `/^Zranienie \((\d+)\)$/` do zdania złożonego przez
**słownik GRY**, w języku klienta. `AGENTS.md` mówi wprost, że `slownik-gry.ts`
istnieje po to, by panel mówił „w języku klienta, także po aktualizacji gry" —
etykieta jest więc z założenia zmienna, a wiązanie po niej z założenia kruche.
Druga połowa wiązania (`WOUND_DOT = "po zranieniu"`) jest NASZA i stała;
niestabilna była dokładnie ta jedna.

**✓ Zmierzone** na `+dmgd=400;-dmgd=400;+injure=150` plus tyknięcie `injure=150`,
zmieniając WYŁĄCZNIE słownik:

| słownik | „OD KOGO" u celu | `damageDealt` bijącego |
|---|---|---|
| polski | Łowca 550 | 550 |
| angielski | Łowca 400 · Bez sprawcy 150 | **400** |
| brak zdania w kliencie | Łowca 400 · Bez sprawcy 150 | **400** |

**Zrobione.** Decyzja idzie po `proc.key === "+injure"`, kwota po `proc.value`.
**Mutacja:** wiązanie z powrotem po zdaniu → 2 fail (716/2) — przypadki
„angielski" i „klient bez tego zdania". Przypadek „polski" zostaje **zielony**
i to jest cały sens tego testu: stary kod był zielony po polsku i zepsuty wszędzie
indziej.

**Docelowo.** `SOLID.md` — jako przykład decyzji podejmowanej po napisie.

### AUDYT‑90 — obietnica „pierwsza walka ze zrzutem to rozstrzygnie" doczekała się zrzutu ⚪ XS — ✅ NAPRAWIONE ✓

`src/protokol.ts` (parowanie zadanych z przyjętymi)

**Problem.** Komentarz twierdził „Długości bywają RÓŻNE i **widać to
w prawdziwych walkach**" i obiecywał, że rozstrzygnie to pierwszy zrzut. Zrzut
jest w repo od 2026‑08‑05 i nikt go o to nie zapytał.

**✓ Zmierzone.** `2026-08-04-tempest-lowca-vs-odyncze`: **0 rozjazdów** na 18
komunikatach, 0 `unknown`, świadek 7/7. Cytowany przykład (`+dmgd=897;…`)
pochodzi z 25 walk skasowanych 2026‑08‑04 i żyje dziś wyłącznie jako asercja
syntetyczna w `tests/protokol.test.ts`.

**Zrobione.** Obietnica zamieniona na wynik pomiaru. Gałąź ZOSTAJE — nadmiar
naprawdę nie ma gdzie zginąć, a `unknown` jest tani — ale zdanie „widać to
w prawdziwych walkach" nie jest już czymś, co ktokolwiek w repo umie sprawdzić.

**Docelowo.** Zostaje przy kodzie.

⚠️ **SPROSTOWANIE 2026‑08‑06 — TEN WPIS ZAMKNĄŁ SIĘ NA POMIARZE, KTÓRY NIE MIAŁ
JAK NIC POKAZAĆ.** Wynik „0 rozjazdów na 18 komunikatach" był prawdziwy, ale
mierzony na materiale, w którym **wszystkie 9 linii ciosu ma listy `+dmgX`
i `-dmgX` równe co do kolejności** — czyli na próbce, gdzie parowanie po
pozycji i parowanie po żywiole dają identyczny wynik z definicji. „Zmierzone
i zgadza się" znaczyło tu „zmierzone tam, gdzie nie mogło się nie zgadzać".

Drugi zrzut (`2026-08-06-tempest-grupa-vs-hildur`, 188 linii ciosu) dał **16
linii, w których `-dmgX` jest właściwym podzbiorem `+dmgX`** — i wszystkie
poszły do `unknown`, więc materiał nie chciał wejść do repo. Rozstrzygnął to
asset klienta: gra **nie paruje tych dwóch stron wcale**, prowadzi dwa
niezależne ciągi i żywioł bierze z samego klucza (`docs/MECHANIKA.md`, wpis
„Zadane i przyjęte NIE SĄ PAROWANE"). Parowanie po kolejności było naszym
wymysłem od początku; przy tych 16 liniach podstawiało przyjęte pod niewłaściwy
żywioł. Skalary zostawały prawdziwe, rozbicie po żywiołach kłamało.

**Wniosek ogólniejszy od poprawki, i to on jest tu wart zapamiętania:** pomiar
na jednej próbce zamyka pozycję tylko wtedy, gdy próbka MOGŁA dać wynik
przeciwny. Zanim wpiszesz „zmierzone, zgadza się", sprawdź, czy w tym materiale
błąd, którego szukasz, miałby jak się ujawnić.

### AUDYT‑91 — uzasadnienie żywego strażnika stoi na pomiarze z nieistniejącego pliku ⚪ XS — ✅ NAPRAWIONE ✓

`src/stats.ts` (`SELF_INFLICTED_DOTS`) · `docs/MECHANIKA.md`

**Problem.** Oba miejsca uzasadniają regułę pomiarem na
`2026-08-03_druzyna-vs-hildur-absorpcja` (2 026 obrażeń, 966 i 1 060 u dwóch
graczy, siedem tyknięć z pulą ~19 000). `find` nie znajduje tego pliku — zszedł
z drzewa 2026‑08‑04.

⚠️ **To NIE jest ten sam błąd co `AUDYT‑58/59`** i nie należy ich mylić. Tam
liczby pochodziły z materiału, który do repo **nigdy nie wszedł** — czyli były
niesprawdzalne od chwili zapisania. Tu były prawdziwe, gdy je mierzono; zmieniło
się to, że **czytelnik nie powtórzy ich sam**. Brakowało ostrzeżenia, nie prawdy.

**Zrobione.** ⚠️ w obu miejscach. Przy okazji wyszło, że sam strażnik ma dziś
świadka lepszego niż tamten pomiar: warunek `m[1] >= 0` w rendererze mówi to
samo bez żadnego materiału, a `SELF_INFLICTED_DOTS` jest sprawdzane testem
w układzie 1 vs 1 — jedynym, który go w ogóle dotyka.

**Docelowo.** Zostaje przy kodzie i przy rejestrze.

### AUDYT‑92 — reguła ścieżkowa zawodzi po raz trzeci, tym razem przez ścieżkę BRAKUJĄCĄ ⚪ XS — ✅ NAPRAWIONE ✓

`.claude/rules/mechanika-gry.md` (`paths:`)

**Problem.** Lista nie obejmowała `src/protokol-source.ts`, `src/zrzut.ts` ani
`tests/fixtury.ts` — a to tam przeniosła się granica walki (`data.init`), czyli
zdanie o grze tak czyste, że dostało **najnowszy wpis rejestru**, oraz świadek
dekodera z trzema twierdzeniami o tym, co protokół podaje przy zgonie i po
uleczeniu.

⚠️ **Reguła sama ostrzega, że zawiodła już dwa razy — obie te awarie były
ŚCIEŻKĄ MARTWĄ** (`src/parser.ts`, `tests/fixtures/**/meta.json`). Ta jest
trzecia i **inna**: nie plik zniknął, tylko wiedza PRZEPROWADZIŁA SIĘ do pliku,
którego na liście nigdy nie było. Kontrola „czy każdy wzorzec się dopasowuje"
tego nie łapie — wszystkie siedem wzorców dopasowywało się poprawnie.

**Zrobione.** Trzy ścieżki dopisane, wniosek zapisany w regule: pisząc nowy wpis
rejestru, sprawdź, czy plik, którego dotyczy, na tej liście stoi.

**Docelowo.** Zostaje przy regule.

## K. Punkty życia w tabeli efektów nieliczonych — audyt PO commicie `60fec71` (2026‑08‑06)

Sekcja `J` domknięta, drzewo czyste, brama zielona (**733 zielone**). Ta runda
nie zaczęła się od przeglądu, tylko od **dwóch przypisów, którymi `AUDYT‑94`
kończył swój wpis**: że `dmg-target_physical` i `vamp` niosą obrażenia mimo
miejsca w tabeli efektów nieliczonych, i że efekty z komunikatu bez obrażeń
przepadają w całości. Oba zapisano wtedy jako „poza tematem przeglądu".

Zmierzenie ich zajęło pół godziny i pokazało, że były czubkiem czegoś
większego. Zamiast sprawdzać te dwa klucze, przeszedł **skan wszystkich 197
kluczy `PROCE` przeciw słownikowi gry**, pytając o jedno: czy zdanie klucza mówi
o punktach obrażeń albo punktach życia. Wyszło **jedenaście**.

⚠️ **Lekcja o samym rejestrze, nie o kodzie:** przypis „znalezisko poboczne,
otwarte" jest tanim sposobem zamknięcia rundy i drogim sposobem zgubienia
sprawy. Te dwa przeżyły jeden dzień i tylko dlatego, że ktoś je przeczytał
następnego ranka. Gdyby stały tam tydzień, wyglądałyby na znane i obsłużone.

**Czego ta runda NIE podważa:** wszystkiego z listy w sekcji `J` (cztery
gwarancje owinięcia, granica `data.init`, świadek `hp.max`, zgodność 233 kluczy)
plus tabeli stron efektu z `AUDYT‑93`/`94`. **Sumy obrażeń z ciosów były i są
poprawne** — ta runda dotyczy liczb, które do sum nigdy nie wchodziły.

### AUDYT‑95 — pięć kluczy z obrażeniami stoi w tabeli efektów NIELICZONYCH 🔴 M — ✅ NAPRAWIONE ✓

`src/protokol.ts` (`PROCE` → `ROLE`)

**Problem.** `critwound`, `fire`, `frost`, `light` i `physical` niosą punkty
obrażeń, a stoją w tabeli, której cały sens brzmi „gra wypisuje zdanie, ale my
nie liczymy z niego niczego". Komunikat złożony wyłącznie z takiego klucza daje
ZERO zdarzeń — bez `unknown`, bez ostrzeżenia, bez śladu.

**✓ Zmierzone**, sonda na dekoderze:

```
-255967=19.27;0;poison=140,14      → dot 140, „od trucizny", osłabione 14 %   ← kontrola
-255967=19.27;0;critwound=140,14   → (zero zdarzeń)
-255967=19.27;0;fire=88            → (zero zdarzeń)
-255967=19.27;0;physical=88        → (zero zdarzeń)
```

⚠️ **To była cicha REGRESJA po skasowaniu parsera tekstu 2026‑08‑04, nie brak
funkcji** — i dowodzi tego samo repo, a nie rozumowanie: patrz `AUDYT‑97`.

**Trzy niezależne źródła, i trzecie było warunkiem wejścia.** Ryzyko było jedno:
że te liczby są ROZBICIEM ciosu, czyli że doliczenie ich podwoi coś, co już
siedzi w `-dmgd`. Rozstrzygnął katalog pomocy (`view,372`), dosłownie: *„aktywny
critwound • Działanie: […] aplikowane są na cel obrażenia od głębokiej rany
**(jako osobna instancja wyniszczeń)** o wartości 10% obrażeń zadanych na 3
tury."* Bez tego zdania piątka zostałaby otwarta — renderer i słownik mówiły,
KTO i ILE, ale nie mówiły, czy liczba jest nowa.

Dla czterech żywiołów to samo ryzyko odpada **z kodu, nie z domysłu**:
`Hit.element` bierze żywioł z KLUCZA obrażeń (`+of_dmg` → `kod: "o"`), a nie
z tych kluczy. `critwound` ma poza tym dowód najmocniejszy z możliwych —
renderer składa go tym samym kodem co `wound`, który stoi w tabeli ról od
początku (`BattleMessages.js:259‑263` kontra `:249‑253`; ten sam `f1.name`, ten
sam `m[1].split(',')`, ta sama para `%val%` / `%val0% %val1%`).

**Zrobione.** Pięć wpisów w `ROLE` jako `dot`, każdy z cytatem. **Mutacja:**
stan dokładnie sprzed zmiany (`fire` i `light` z powrotem w `PROCE`) → 3 fail
(90/3), w tym niezmiennik z `AUDYT‑97`.

⚠️ **Decyzja, która mogła pójść inaczej: „ciężkiej", nie „głębokiej" rany.**
Katalog nazywa TYP obrażeń głęboką raną; zdanie, które widzi gracz, mówi „od
ciężkiej rany". Wygrywa zdanie, bo reguła tabeli brzmi „przyimki są dosłownie te
ze zdań gry", a wiersz panelu ma się zgadzać z logiem walki. W przekroju „TYP
OBRAŻEŃ" i tak schodzą się w jedną rodzinę („rana"), więc nic się nie rozsypuje.

⚠️ **Co ZOSTAJE otwarte.** Testy są syntetyczne i takie zostaną: jedyna
prawdziwa walka w repo NIE NIESIE ani jednego z tych pięciu kluczy. Fixture
wychodzi co do jednego taki sam (2784, 831/834/1119, świadek 7/7) — to dowód, że
nic nie zepsuto, nie że naprawiono.

**Docelowo.** `docs/MECHANIKA.md` — wpis „Które klucze protokołu niosą punkty
życia".

### AUDYT‑96 — `bandage` i `vamp_time` niosą leczenie, które w panelu NIE ISTNIEJE 🔴 S — ✅ NAPRAWIONE ✓

`src/protokol.ts` (`PROCE` → `ROLE`) · `docs/ROADMAP.md`

**Problem.** Oba klucze niosą leczenie w punktach życia i oba stoją w `PROCE`.
To nie jest „leczenie bez leczącego" — to leczenie, którego nie ma nigdzie: ani
w `healingReceived`, ani w puli nieprzypisanej, więc nie zostawia po sobie nawet
przypisu.

**✓ Zmierzone:** `482845=100.00;0;bandage=200` → zero zdarzeń;
`482845=100.00;0;vamp_time=75` → zero zdarzeń.

⚠️ **SPROSTOWANIE DO `ROADMAP.md` i to jest tu najważniejsze.** Pozycja stała
tam od 2026‑08‑05 z warunkiem: *„brakuje zrzutu z walki, w której któryś z tych
kluczy pada — bez niego byłoby to przeniesienie do ról na podstawie samego
brzmienia"*. Zdanie było **nieprawdziwe w chwili pisania**. Brzmienie nie było
jedynym dowodem, jaki repo miało: dowodem jest PODSTAWIENIE w rendererze
(`'%name%': f1.name`, `:378‑392`), a `.cache/margonem-zrodla-1781609507010/`
leżało na dysku przez cały ten czas.

Wniosek ogólniejszy: **warunek „potrzebny zrzut" bywa odruchem, nie diagnozą.**
Zrzut odpowiada na pytanie CZY I JAK CZĘSTO klucz pada; na pytanie CO ON ZNACZY
odpowiada klient gry. Tylko drugie z nich blokowało tę pozycję, a reguła
rozdzielająca te dwa pytania stoi w `MECHANIKA.md` od dawna.

**Zrobione.** Dwa wpisy w `ROLE`. **Mutacja:** oba z powrotem do `PROCE` →
3 fail (93/3).

⚠️ **Dwa klucze, dwie różne siły dowodu — i tak są zapisane w kodzie.**
`bandage` podstawia nazwę wprost. `vamp_time` NIE PODSTAWIA ŻADNEJ („+Uleczono
za %val% punktów życia"), więc „pierwszy segment" jest przy nim wnioskiem
z konwencji, nie odczytem. Sekcja `J` dwa razy pokazała, ile kosztuje pomylenie
tych dwóch rzeczy.

⚠️ **Co ZOSTAJE otwarte.** Oba klucze mają wariant dwuczłonowy z PROCENTEM
OSŁABIENIA leczenia, a `BattleEvent.heal` nie ma gdzie tego położyć — inaczej
niż tyknięcia, które mają `weakenedPct`. Drugi człon przepada. Nie blokowało to
przeniesienia, bo kwota z członu zerowego stoi już PO osłabieniu: tracimy „ile
osłabienie zdjęło", a nie samo leczenie. Dołożenie pola to zmiana kontraktu
i osobna runda.

**Docelowo.** `docs/ROADMAP.md` — sekcja „Leczenie, które nie liczy się do
niczego" zamknięta wraz ze sprostowaniem.

### AUDYT‑97 — dwie martwe etykiety i jedna brakująca w `DOT_LABELS` 🟡 S — ✅ NAPRAWIONE ✓

`src/types.ts` (`DOT_LABELS`)

**Problem.** Mapa ma wpisy `"od ognia" → "Ogień"` i `"od błyskawic" →
"Błyskawica"`, a żadna ścieżka dekodera ich nie produkuje: `dotType` przyjmuje
pięć wartości i nie ma wśród nich żywiołu. Brakuje za to `"od krwawienia"`, choć
`anguish` stoi w tabeli ról od dawna — jego wiersz idzie do panelu dosłowną
frazą przyimkową, jako jedyny w kolumnie rzeczowników.

⚠️ **Ta pozycja jest DOWODEM dla `AUDYT‑95`, nie tylko usterką obok niego.**
Martwe etykiety mogły powstać wyłącznie tak, że coś je kiedyś wywoływało: parser
tekstu obrażenia od ognia i błyskawic LICZYŁ. Droga protokołu nie liczyła ich
nigdy. To rozstrzyga, że `AUDYT‑95` opisuje regresję, a nie brak funkcji — i jest
to trzeci w ciągu trzech dni przypadek tego samego kształtu (`AUDYT‑88`:
trzy martwe strażniki; `AUDYT‑92`: ścieżka, do której przeprowadziła się wiedza).

**Zrobione.** Mapa domknięta do kompletu (dochodzą „od zimna", „od ciężkiej
rany", „od obrażeń fizycznych", „od krwawienia"), a przede wszystkim wchodzi
**niezmiennik OBUSTRONNY**: każdy rodzaj produkowany przez dekoder ma etykietę
i każda etykieta ma rodzaj, który ją wywoła. Materiałem jest `RODZAJE_DOT`,
WYLICZONE z tabeli ról — lista pisana ręcznie zestarzałaby się przy pierwszym
nowym `dot` i zrobiłaby to po cichu.

⚠️ **Dlaczego akurat obustronny.** Martwy wpis w mapie etykiet wygląda dokładnie
tak samo jak żywy, więc pojedyncza asercja („«od ognia» daje «Ogień»") była przez
te dwa dni ZIELONA i bezużyteczna. Każda strona łapie inną awarię: pierwsza —
rodzaj bez etykiety (fraza przyimkowa wycieka do panelu), druga — etykietę bez
rodzaju (kod, który nikogo nie obsługuje).

**Mutacje:** skasowanie wpisu → 2 fail (91/2); dopisanie etykiety, której nikt
nie wywoła → 1 fail (92/1); **stan dokładnie sprzed rundy** → 3 fail (90/3),
czyli niezmiennik zapala się na tym, co naprawdę stało w drzewie.

**Docelowo.** Zostaje przy kodzie.

### AUDYT‑98 — komunikat bez ani jednej liczby obrażeń gubi CAŁĄ listę efektów 🟡 M — ✅ NAPRAWIONE ✓

`src/protokol.ts` (wczesny powrót przy `zadane.length === 0 && przyjete.length === 0`)

**Problem.** Gałąź kończąca komunikat bez obrażeń nie czyta zebranej listy
`procy` — więc efekty z takiego komunikatu nie trafiają nigdzie. Nie ma ich ani
w „efektach w ciosach", ani w „otrzymanych", ani w `unknown`.

**✓ Zmierzone:** `482845=100.00;-255967=70.00;tspell=Tarcza;resfire_per=20` daje
**samo zdarzenie `ability`**; `resfire_per` przepada.

**Dlaczego NIE w tej rundzie.** Naprawa wymaga miejsca, w którym efekt może
usiąść poza ciosem — czyli zmiany kontraktu `BattleEvent`, a za nią `stats.ts`,
`overlay.ts` i odtwarzania nagrań. Decyzja właściciela repo: zapis teraz,
naprawa osobno.

⚠️ **DRUGI POWÓD STAŁ TU I PRZESTAŁ BYĆ PRAWDĄ TEGO SAMEGO DNIA** (`AUDYT‑102`).
Brzmiał: *„Repo nie ma przy tym materiału dowodzącego, że gra takie komunikaty
naprawdę wysyła: renderer je składa (`tm[1]` wypełnia się niezależnie od warunku
`attack != ''`), ale jedyna prawdziwa walka w repo nie ma ani jednego takiego
komunikatu"*. Zdanie o rendererze zostaje i jest prawdziwe. Zdanie o materiale
było prawdziwe przy JEDNYM fixturze i przewrócił je commit `412579d` — ten sam,
który dołożył drugą prawdziwą walkę. Zmierzone na `grupa-vs-hildur`:
**91 takich komunikatów, 247 ginących efektów**, w tym `+oth_dmg` 71 razy.
Pełne liczby, rozkład kluczy i zawężenie („ginie wyłącznie `procy`; `blok`,
`unik` i `kryt` bez obrażeń w materiale nie występują") stoją w `AUDYT‑102`.

**✅ NAPRAWIONE 2026‑08‑06** (`4039be7`). `BattleEvent` ma wariant
`kind: "effect"` — efekt bez trafień, ze stronami i zapowiedzianą
umiejętnością. Projekt, odrzucone warianty i pomiary:
[`specy/2026-08-06-efekt-poza-ciosem.md`](specy/2026-08-06-efekt-poza-ciosem.md).
Efekty docierające do panelu: **299 → 546**.

⚠️ **PROMIEŃ OKAZAŁ SIĘ MNIEJSZY, NIŻ ZAPOWIADAŁ TEN WPIS.** Stało tu „za nią
`stats.ts`, `overlay.ts` i odtwarzanie nagrań". Sprawdzone w kodzie: `overlay.ts`
renderuje `actor.procs` ogólnie (`:2552`, `:2642`), a nagrania trzymają SUROWE
komunikaty i `archive.ts:400` woła `dekoduj` od nowa — więc żadne z nich nie
wymagało zmiany, a stare nagrania przeliczają się same. Ruszyły `types.ts`,
`protokol.ts`, `stats.ts`. Zapowiedź promienia była ostrożna, nie zmierzona.

**Czego naprawa wymagała PONAD sam wariant** — i bez czego byłaby regresją:

- **Strażnik dziury w etykiecie.** `etykieta()` podstawia wyłącznie `%val%`,
  a `msg_+oth_dmg %val% %name%` żąda więcej. Dziś **0 z 299** etykiet ma dziurę;
  po wpuszczeniu efektów spoza ciosu byłoby **147 z 546**, czyli gracz zobaczyłby
  dosłowne „%name%". Zdanie z dziurą ustępuje kluczowi. Wariant „podstaw `%name%`
  z pierwszej strony" jest DOWODLIWIE błędny — przy `+oth_dmg` nick z wartości
  nie jest ani `f1`, ani `f2`, tylko trzecią postacią; skłamałby w 71 ze 147.
- **Dwa strażniki wyczerpania w `stats.ts`.** `namesIn` miało `default: return []`
  (nowy wariant nie wniósłby nazw do rozpoznawania instancji — efekt siadłby na
  złej instancji przy zdublowanych nazwach, PO CICHU), a główny `switch` nie miał
  niczego. Ta sama awaria co ta pozycja, piętro wyżej. Odtąd oba są błędem
  KOMPILACJI (`TS2366`, `TS2322`, sprawdzone mutacją). ⚠️ Strażnik **nie rzuca** —
  ta sama decyzja co przy `rola()`: wyjątek w agregacie zdejmuje graczowi cały
  panel za pomyłkę, którą i tak zatrzymuje brama.

**Kształt spoza planu, znaleziony przez MNIEJSZY fixture:** `0;0;+exp=3973` —
komunikat bez obu stron. Pierwsza wersja słała go do `unknown` i zapaliła
`unknownLines`. Idzie do `info`: rozumiemy wszystko, tylko log nie mówi, czyj to
efekt, a przypisanie graczowi byłoby zgadywaniem — oczywistym, ale `DECYZJE.md`
nie robi wyjątku dla oczywistych.

**Czym to jest pilnowane** — i to jest ważniejsze od samej naprawy. Nowy
niezmiennik po całym korpusie w `tests/fixtury.test.ts`: *każdy efekt
z komunikatu wychodzi ze zdarzeń*. Napisany PIERWSZY i sprawdzony, że pada
(299 ≠ 546, 11 ≠ 12). Repo miało już `unknownLines === 0`, czyli pytało „czy
dekoder ROZUMIE klucz" — i odpowiedź była twierdząca przez cały czas. **Nikt nie
pytał, czy to, co zrozumiał, gdziekolwiek WYCHODZI.** Rozpoznanie i doręczenie
to dwa różne pytania; przez brak drugiego 247 efektów ginęło niezauważone.

⚠️ **Co ZOSTAJE otwarte.** `AUDYT‑99` przy `+oth_dmg`: klucz jest dziś WIDOCZNY,
ale nadal NIELICZONY — niesie kwotę i trzecią postać w wartości, a kontrakt
zdarzeń stoi na dwóch stronach komunikatu. Jego etykieta pokazuje klucz, nie
zdanie, i tak zostanie, dopóki nie wiadomo, czym wypełnić `%name%`. Zdanie
o kolejności obu pozycji zostaje w mocy w JEDNĄ stronę: naprawa `AUDYT‑99` przy
tym kluczu miała sens dopiero po tej.

### AUDYT‑99 — cztery dalsze klucze z liczbami zostają nieliczone ⚪ M — 🟡 CZĘŚCIOWO (1 z 4)

`src/protokol.ts` (`PROCE`)

✅ **`dmg-target_physical` ZROBIONE 2026‑08‑06** (`fea3874`) — weszło do `ROLE`
jako obrażenia o stałej wartości zadane CELOWI, `strike: false`,
`raw === applied`. Dowód sprawdzony u źródła, nie przepisany stąd; katalog
dokłada zdanie, którego ten wpis nie cytował: „Obrażenia mogą zostać zwiększone
przez bonus […] Obrażenia fizyczne ( dmgmulphysical )" — własny mnożnik, czyli
własna ścieżka liczenia.

⚠️ **Zostaje otwarte przy nim jedno: ryzyko podwojenia.** Katalog opisuje
MECHANIKĘ, nie zapis w protokole; gdyby gra wysyłała przy tym kluczu także
`-dmgX`, liczba by się podwoiła. Klucz nie pada w żadnym materiale (zero
w obu fixture'ach i w `KORPUS`), więc świadka nie ma i mieć nie będzie.

⬜ **Zostają trzy:** `vamp`, `+oth_cover`, `+oth_dmg`. Ostatni ma własny wpis
z pomiarem — `AUDYT‑106`.

**Problem.** Ze skanu jedenastu kluczy siedem naprawiono. Zostawały cztery.

| klucz | zdanie gry | co niesie |
|---|---|---|
| `dmg-target_physical` | „%target% otrzymuje %val% obrażeń" | obrażenia u `f2` |
| `vamp` | „%name% zadał %val% obrażeń %target% lecząc za nie siebie." | obrażenia i leczenie |
| `+oth_cover` | „%name% przejął(eła) %val% obrażeń." | obrażenia przejęte |
| `+oth_dmg` | „−%val% obrażeń otrzymał(a) %name%." | obrażenia u osłanianego |

⚠️ **`dmg-target_physical` — dowód okazał się MOCNIEJSZY, niż zakładał zakres
rundy, i to jest sprostowanie do własnego planu.** Katalog pomocy: *„aktywny
dmg-target_physical • Działanie: na przeciwnika zostają nałożone obrażenia
fizyczne o stałej wartości […] Obrażenia nie są redukowane przez pancerz."*
Trzy źródła zgodne, strona jednoznaczna (`f2`), brak ryzyka podwojenia. Jest to
dziś **najbliższy kandydat na następną rundę** i wypadł poza tę wyłącznie
dlatego, że zakres ustalono, zanim przeczytano katalog.

⚠️ **`vamp` — sprostowanie do uzasadnienia, którym sam odradzałem go liczyć.**
Argumentem było, że „zadał %val% obrażeń […] lecząc za nie siebie" opisuje
PORCJĘ ciosu, więc liczenie podwoiłoby liczbę. Katalog mówi co innego: *„zadaje
stałe obrażenia od umiejętności oraz przywraca Postaci punkty zdrowia o tę samą
wartość"* — czyli obrażenia własne umiejętności. Zakres zostaje wąski, ale jego
uzasadnienie brzmi teraz **„nie rozstrzygnięto, czy `vamp` dubluje się z `-dmgd`
tego samego komunikatu"**, a nie „bo na pewno dubluje". Wybór jest zachowawczy:
zaniża, nie zawyża — i tak ma być czytany.

**`+oth_cover` i `+oth_dmg` są z tej czwórki najtrudniejsze** i nie z powodu
dowodu. Wartość jest TRÓJCZŁONOWA (`kwota,klasa,nick`, `:596‑607`) i niesie
w środku **TRZECIĄ POSTAĆ** — osłanianego. Cały kontrakt zdarzeń stoi na dwóch
stronach komunikatu, więc nie ma dziś czym jej przypisać. To jest pozycja
projektowa, nie tabelaryczna.

**Docelowo.** `docs/MECHANIKA.md` — wpis „Które klucze protokołu niosą punkty
życia" wymienia całą jedenastkę razem ze statusem.

## L. Redakcja pseudonimów — przegląd PO commicie `f0c97d6` (2026‑08‑06)

Runda `f0c97d6` zdjęła z drzewa cudzą treść: 236 zdań gry, dziesięć pseudonimów
ze zrzutów ekranu i nicki z prozy (`Gracz A`…`Gracz G`). Ten przegląd zaczął się
od pytania, które postawił użytkownik: **skoro anonimizacja już jest, to co
dokładnie ma przez nią przechodzić przy następnym materiale z gry.** Odpowiedź
wymagała spojrzenia na drogę wejścia materiału — i wtedy wyszło, że tamta runda
zabezpieczyła NOŚNIKI, które już były w repo, a nie DROGĘ, którą przychodzą nowe.

### AUDYT‑100 — `--zachowaj` wpuszczał do publicznego repo dowolny pseudonim 🔴 M — ✅ NAPRAWIONE ✓

`tools/walka.ts`

Nic w drodze materiału z gry do `tests/fixtures/` nie dotykało nazw. Że nie
było skutku, jest własnością MATERIAŁU, nie procedury: jedyny fixture to walka
solo z potworami, więc `npc: 0` jest w nim jeden — własna postać. Lista
zakupowa z `docs/ROADMAP.md` (blok, unik, absorpcja, walka turowa) prowadzi
wprost do walk grupowych i PvP.

Koszt pomyłki jest tu asymetryczny i dlatego pozycja jest 🔴: fixture idzie do
gita NA ZAWSZE, a `docs/screenshots/README.md` zapisuje wprost, że historii tego
repo się nie przepisuje.

**Naprawione:** `pseudonimizuj` w `tools/walka.ts` podstawia `Gracz 1`,
`Gracz 2`, … każdemu wojownikowi z `npc: 0`, przy każdym `--zachowaj`; dwa
niezmienniki w `tests/fixtury.test.ts` pilnują, że nikt tego nie ominął;
istniejący plik przeszedł `--pseudonimizuj` (34 wystąpienia). Procedura wejścia
materiału — osiem kroków — stoi w `tests/fixtures/README.md`.

**Co ZOSTAJE otwarte, zmierzone mutacją:** nick niezwiązany z żadnym `id`
(wstawiony tylko w `render`, w `txt=` z łupem, należący do kogoś, kto wypadł
przed pierwszą migawką) przechodzi przez podstawienie nietknięty i **nie zapala
ani jednego strażnika**. Stąd krok 4 procedury jest dla człowieka i nie ma jak
przestać nim być.

### AUDYT‑101 — redakcja prozy z 2026‑08‑06 pominęła cały blok i raz trafiła w NPC‑a ⚪ S — ✅ NAPRAWIONE ✓

`docs/DECYZJE.md`, `docs/SOLID.md`, `src/style.ts`

Tamta runda wypisała w swoim komunikacie wniosek „redakcja jednego nośnika nie
jest redakcją" i **sama go nie domknęła**. Zostało:

- `docs/DECYZJE.md` — blok surowych danych walki grupowej z trzema nazwami,
  sekcja o kodach profesji z dwiema, `src/style.ts` — nick z tagiem gildii
  w komentarzu o skracaniu etykiety;
- `docs/DECYZJE.md` — `Regulusa` → `Gracza B` **na NPC‑u**. Że to boss, a nie
  gracz, rozstrzyga sąsiedni wiersz w `docs/SOLID.md`: ta sama tabela stawia
  obok `Draugr Zastępowy` w identycznej roli. Rdzeń „regulus" występował w tym
  materiale dwa razy — raz jako boss `Regulus Mętnooki`, raz w środku nicku
  gracza (dziś `Gracz B`) — i redakcja robiona okiem skleiła je w jedno.

  ⚠️ Zdanie wyżej samo przez chwilę niosło ten nick, wypisany po to, żeby
  wyjaśnić pomyłkę. To jest ta sama pułapka, co w `docs/specy/…-porzucone-funkcje…`:
  **pseudonim wraca do repo najłatwiej w akapicie o tym, jak się go usuwa.**

**Wniosek, po co ta pozycja tu stoi:** podmiana robiona okiem nie zbiega się.
Jedyne miejsce, w którym da się ją zrobić mechanicznie, to fixture — bo tam gra
sama mówi `npc: 0|1`. W prozie takiego sygnału nie ma i nie będzie, więc regułą
jest tu **kierunek pod niepewność**: nie wiadomo czyj nick — schodzi.

**Granica, świadomie:** własne postacie autora (klaster `Kazrek`) w prozie
i w `tools/synthetic-log.ts` **zostają** — zgoda jest, a te same nazwy niosą
generator, testy i historia gita. W FIXTURZE nie zostają, bo tam reguła nie ma
jak rozpoznać właściciela i nie próbuje.

**Co ZOSTAJE otwarte:** `Gracz L` (mag, poziom 27) był nierozstrzygalny —
kontekst mieszał w jednej tabeli graczy i potwory. Zszedł jako gracz, czyli
w stronę bezpieczną; jeśli to NPC, ubyło trochę wierności opisu.

## M. Dekoder i droga materiału — audyt PO commicie `412579d` (2026‑08‑06)

Przegląd dwóch rzeczy, których runda z 2026‑08‑06 dotknęła najmocniej: dekodera
protokołu i drogi, którą materiał z gry wchodzi do repo (`src/zrzut.ts` →
`tools/walka.ts` → `tests/fixtures/`).

**Cztery znaleziska, każde zmierzone** — trzy sondą na kodzie, jedno na
materiale. Trzy naprawione w tej rundzie; czwarte to `AUDYT‑102`, które niczego
nie naprawia, tylko odbiera innej pozycji jej nieaktualne uzasadnienie.

⚠️ **Wspólny mianownik trzech usterek jest wart nazwania osobno: żadna nie
siedziała w kodzie, który ktoś napisał źle.** Wszystkie trzy powstały tam, gdzie
ZAKRES obietnicy był szerszy od zakresu jej strażnika — zbiorczy komentarz
o dwóch polach (`AUDYT‑103`), próg trzymany po jednej stronie granicy
(`AUDYT‑104`), test nazwany regułą i sprawdzający jeden jej przypadek
(`AUDYT‑105`). To jest ta sama choroba, którą `AGENTS.md` opisuje jako „reguła
bez strażnika po stronie danych", tylko o poziom niżej: **strażnik był, tylko
węższy niż jego własna nazwa.**

### AUDYT‑102 — `AUDYT‑98` odroczono na podstawie zdania, które przestało być prawdą tego samego dnia 🟡 M — ⬜ ZAPISANE, nienaprawione

`docs/AUDYT.md` (`AUDYT‑98`), `docs/ROADMAP.md` (wpis „Efekty z komunikatu bez
obrażeń przepadają w całości")

**Problem.** Oba miejsca uzasadniają odroczenie tak samo: *„repo nie ma przy tym
materiału dowodzącego, że gra takie komunikaty naprawdę wysyła […] jedyna
prawdziwa walka w repo nie ma ani jednego takiego komunikatu"*. Zdanie było
prawdziwe przy jednym fixturze i **przestało nim być w commicie `412579d`** —
tym samym, który dołożył drugą prawdziwą walkę. Materiał przyszedł, pomiaru
nikt nie powtórzył, a uzasadnienie zostało.

**✓ Zmierzone** (`dekoduj` + `rola`, oba fixture'y):

| | `lowca-vs-odyncze` | `grupa-vs-hildur` |
|---|---|---|
| komunikaty bez obrażeń niosące efekty | 1 | **91** |
| efektów ginących w całości | 1 | **247** |

Rozkład kluczy w `grupa-vs-hildur`:

```
  71  +oth_dmg                  11  alllowdmg           4  aura-resall
  47  -poison_lowdmg_per        10  active_block_per    4  aura-sa_per
  31  combo-max                 10  energy              1  poison_lowdmg_per-enemies
  15  mana                       5  allslow_per
  12  healall_per               11  shout
  11  active_decblock_per-enemies                        4  aura-ac_per
```

⚠️ **`+oth_dmg` (71×) ginie PODWÓJNIE.** Stoi w tabeli `AUDYT‑99` jako klucz
niosący liczbę, której nie liczymy — i niezależnie od tego wypada z komunikatu
w całości. Naprawa `AUDYT‑99` przy tym kluczu nie zrobiłaby więc nic, dopóki
stoi `AUDYT‑98`, i odwrotnie. Kolejność tych dwóch pozycji nie jest dowolna.

**✓ Zmierzone także ZAWĘŻENIE, i ono zmniejsza zakres naprawy.** `AUDYT‑98`
mówi „gubi CAŁĄ listę efektów" i jest to prawda o kodzie, ale nie o materiale:
wczesny powrót zabiera też `blok`, `unik` i `kryt`, a tych **bez obrażeń nie ma
w materiale ani razu** (0/0/0 na obu plikach). Ginie wyłącznie `procy`. Naprawa
potrzebuje więc miejsca dla EFEKTU poza ciosem, a nie dla bloku i uniku poza
ciosem — te drugie mają już swoją gałąź (`kind: "info"`).

**Docelowo.** ✅ **Ten pomiar był podstawą naprawy — `AUDYT‑98` zamknięte tego
samego dnia** (`4039be7`), razem ze specem
[`specy/2026-08-06-efekt-poza-ciosem.md`](specy/2026-08-06-efekt-poza-ciosem.md).
Zapisane wyżej ZAWĘŻENIE („ginie wyłącznie `procy`") okazało się trafne i to ono
wyznaczyło zakres: naprawa dołożyła miejsce dla EFEKTU poza ciosem i nie
ruszała bloku ani uniku.

⚠️ **Rachunek za tę pozycję, wystawiony po naprawie.** Odroczenie stało na
zdaniu o braku materiału, które było nieaktualne od doby; sama naprawa zajęła
jedną rundę i okazała się mniejsza, niż zapowiadał promień w `AUDYT‑98`
(`overlay.ts` i nagrania nietknięte). Nie znaczy to, że decyzja o odroczeniu
była zła — znaczy, że **stała na wejściu, którego nikt nie odświeżył**.

⚠️ **Wniosek na przyszłość, wart więcej niż sama poprawka.** Pozycja odroczona
„z braku materiału" ma w sobie **warunek, który może zniknąć bez niczyjej
decyzji** — i wtedy nie zapala się nic, bo materiał wchodzi do repo inną drogą
niż rejestr. Dwa razy w tym repo zapisano „sprawdzone w pomocy, milczy"
o rzeczach, które pomoc opisuje wprost (`docs/MECHANIKA.md`); to jest ten sam
kształt w trzecim wariancie. **Wchodzący fixture powinien być momentem
przejrzenia pozycji, które na fixture czekały** — dziś nie jest i nic tego nie
przypomina.

### AUDYT‑103 — `--zachowaj … --walka <n>` gubił ostrzeżenie o URWANYM zrzucie 🟡 S — ✅ NAPRAWIONE ✓

`tools/walka.ts` (`wybierzWalke`)

**Problem.** Funkcja wypisuje pola po jednym i nie przepuszczała `przepelniony`,
więc `urwany()` w `--zachowaj` dostawał zrzut zawężony i milczał. Ostrzeżenie
dołożone przy `AUDYT‑86` było martwe dokładnie na tej drodze, po której chodzi
materiał z DODATKU: zrzut z dodatku obejmuje całą sesję, przy kilku walkach
`--walka <n>` jest wymagane, a to ono woła `wybierzWalke`.

**✓ Zmierzone.** Zrzut z `przepelniony: true` → `urwany()` ostrzega; po
`wybierzWalke(…, 2)` → `przepelniony: undefined`, `urwany()` milczy.

**Naprawa.** Flaga przechodzi dla walki o NAJWYŻSZYM numerze obecnym w zrzucie.
Nie zawsze: `KolekcjonerZrzutu.po` po przepełnieniu wychodzi wcześniej, więc
urwana jest walka bieżąca w tamtej chwili, czyli ostatnia — a ostrzeganie
o urwaniu walki, która skończyła się cała, uczyłoby ludzi ignorować ostrzeżenie.
Jest to zdanie o NASZYM kolektorze, nie o grze, więc nie przechodziło procedury
z `docs/MECHANIKA.md`.

**Mutacje** (obie uruchomione i cofnięte): flaga nie przechodzi wcale → zapala
„urwany zrzut ZOSTAJE urwany…"; flaga przechodzi zawsze → zapala „walka
WCZEŚNIEJSZA nie dziedziczy urwania". Każda zapala DOKŁADNIE jeden test i za
każdym razem inny.

⚠️ **Usterka była zakodowana jako OCZEKIWANIE.** `expect(jedna.przepelniony)
.toBeUndefined()` stało w teście „wybierzWalke NIE przenosi metadanych cudzych
walk", i to na walce 2 — czyli na tej jedynej, dla której flaga powinna była
przejść. Powód: komentarz uzasadniał oba pola jednym zdaniem („własność sesji,
nie walki"), co o `pominietych` jest prawdą (licznik, nie da się rozdzielić),
a o `przepelniony` nie (fakt o KOŃCU bufora). **Test napisany razem ze zbiorczym
uzasadnieniem dziedziczy jego zasięg** i potem broni już nie decyzji, tylko
sformułowania.

### AUDYT‑104 — zrzut bez granicy walki zapisywał się, a padał dopiero w testach 🟡 S — ✅ NAPRAWIONE ✓

`tools/walka.ts` (`--zachowaj`, dziś `granicaDoZapisu`)

**Problem.** Warunek pytał o `granice.length > 1`, więc zrzut BEZ ani jednego
`init` przechodził. `tests/fixtury.test.ts:129` żąda `toBe(1)` — zaostrzone przy
`AUDYT‑60`, bo zero to nie „plik czysty", tylko „plik, o którym nie wiadomo":
zrzut zebrany od środka walki wygląda tak samo jak ogon jednej walki sklejony
z całą następną.

**✓ Zmierzone.** Narzędzie ZAPISYWAŁO plik i drukowało *„niezmienniki obejmą go
bez dopisywania czegokolwiek"*, po czym `bun test` szło na czerwono — z
materiałem z gry już leżącym w `tests/fixtures/`.

**Naprawa.** Próg zaostrzony do „dokładnie jedna granica, na początku", z DWOMA
komunikatami, bo powody prowadzą do różnych czynności: kilka walk wymaga
`--walka <n>`, brak granicy — zebrania materiału od nowa.

⚠️ **CO TO ZA RODZAJ BŁĘDU.** `zaczynaWalke` mieszka w `src/zrzut.ts` po to, żeby
dodatek i narzędzie mówiły o granicy TO SAMO — i ta ostrożność zadziałała,
predykat się nie rozjechał. Rozjechał się **PRÓG postawiony na tym samym
predykacie przez dwie strony**. Wniosek: jedna definicja nie wystarcza, jeśli
dwie strony stawiają na niej różne wymagania; wspólny ma być także warunek
akceptacji, nie sam odczyt.

⚠️ **Warunek nie miał testu, bo stał w bloku `import.meta.main`** — czyli tam,
gdzie brama go nie ogląda (`bun test` nie uruchamia gałęzi CLI; `tools/walka.ts`
miało tam 60 % linii). Wystawienie `granicaDoZapisu` było warunkiem, żeby próg
mógł w ogóle dostać strażnika. **Reszta CLI nadal testów nie ma** — wyszedł
jeden warunek, nie całe polecenie.

**Mutacje:** stary próg → zapala „ZERO granic odmawia…" ORAZ „próg zgadza się
ze strażnikiem"; jeden komunikat na oba powody → zapala tylko ten pierwszy.

### AUDYT‑105 — pole nadmiarowe w NAGŁÓWKU zrzutu ginęło, wbrew obietnicy ⚪ S — ✅ NAPRAWIONE ✓

`tools/walka.ts` (`czytajZrzut`)

**Problem.** Docstring `wpisZrzutu` obiecuje: *„Pola nadmiarowe zostają
nietknięte […] zrzut z przyszłą wersją sondy ma się dać przeczytać"*. Dla
WYWOŁAŃ obietnicę spełniało `w as Wywolanie`; nagłówek był przepisywany pole po
polu, więc nieznany klucz na wierzchu przepadał bez słowa.

**✓ Zmierzone.** `render` w wywołaniu zostaje, `notatka` na wierzchu ginie.

**Dlaczego to kosztuje.** Samo czytanie niczego nie psuje — psuje
`--pseudonimizuj`, który nadpisuje plik ŹRÓDŁOWY w miejscu, czyli na materiale,
o którym ten sam plik pisze, że „nie ma jak powstać ponownie inaczej niż nowym
zrzutem". Strata jest wtedy nieodwracalna i cicha.

**Odrzucony wariant, zmierzony mutacją.** Rozsypanie CAŁEGO wejścia przed polami
sprawdzanymi przepuszcza nadmiar, ale wpuszcza z powrotem wartości, którym
warunki niżej odmówiły — `zrodlo`, `pominietych` i `przepelniony` odsiewa się
milczącym POMINIĘCIEM, a spread dokłada klucz niezależnie od tego, czy warunek
go chciał. Kupiłoby to nadmiar za walidację. Przechodzą więc wyłącznie klucze
spoza `ZNANE_POLA`.

⚠️ **Usterkę przykrył TEST, nie kod.** „pole NADMIAROWE przechodzi — czytelnik
odrzuca niepełne, nie bogatsze" jest nazwą o CAŁYM zrzucie; asercja dotyczyła
wyłącznie wywołania. Zielony test o nazwie brzmiącej jak reguła czyta się jak
dowód na regułę, a jest dowodem na jeden jej przypadek. **Przy teście nazwanym
regułą warto policzyć, ile przypadków ta reguła ma.**

### AUDYT‑106 — `+oth_dmg` niesie obrażenia, które nie docierają NIGDZIE, a jego nazwa w rejestrze jest zmyślona 🔴 M — ⬜ ZAPISANE, nienaprawione

`src/protokol.ts` (`PROCE`), `docs/MECHANIKA.md`, `docs/ROADMAP.md`

**Problem, część pierwsza — LICZBY.** `+oth_dmg` pada w
`2026-08-06-tempest-grupa-vs-hildur` **71 razy** i stoi w `PROCE`, czyli nie
liczy się do niczego. Wartość jest trójczłonowa (`kwota,klasa,nick(procent)`)
i niesie procent życia adresata — czyli **własnego świadka**.

**✓ Zmierzone** — świadek `hp.max` przeciw temu procentowi, dwa NIEZALEŻNE
przebiegi po całej walce (pierwsza wersja pomiaru doliczała warunkowo i przez to
zależała od samej siebie; wynik niżej jest z poprawionej):

| | trafień | rozjazdów |
|---|---|---|
| nie licząc `+oth_dmg` (stan dzisiejszy) | **0** | 18 |
| licząc `+oth_dmg` jako obrażenia | 5 | 13 |

Pierwszy wiersz rozstrzyga: osłaniane postacie wychodzą u nas na **100 % życia**,
gdy log w tej samej chwili mówi 52–70 %. **Panel zaniża obrażenia przyjęte i nie
mówi o tym ani słowem** — pozycja zdaje test kierunku „jakość danych" wprost,
mocniej niż `AUDYT‑98`, bo tam ginęły etykiety, a tu giną PUNKTY ŻYCIA.

⚠️ **Ale doliczenie NIE domyka sprawy i dlatego to jest wpis, a nie naprawa.**
Zostaje 13 rozjazdów, a nasze sumy są wtedy za NISKIE (67,26 % kontra 61,55 %;
53,20 % kontra 52,32 %). Czegoś w tej mechanice nie rozumiemy, a liczba wpisana
dziś byłaby zgadywaniem z lepszą statystyką — nie odczytem.

**Problem, część druga — NAZWA.** `ROADMAP.md:262` opisuje `+oth_cover`/
`+oth_dmg` jako **„osłonę kompana"**. Katalog efektów nie zna ani jednego
z tych dwóch kluczy:

```
w .cache/pomoc-372.txt:   dmg-target_physical  1
                          vamp                 1
                          oth_cover            0
                          oth_dmg              0
```

Materiał tej nazwie przeczy: adresatem jest 24 razy z 71 **Hildur, czyli BOSS**.
„Kompan przejmuje cios za kolegę" tego nie tłumaczy.

⚠️ **SPROSTOWANIE DO POWYŻSZEGO, jeden dzień później — TO ZDANIE BYŁO ZA MOCNE
I JEST MOJE.** Napisałem tu „nie ma poparcia w ŻADNYM źródle" i „nazwa
zmyślona", opierając się na jednym `grep` po katalogu pomocy. **Klient gry
opisuje tę mechanikę we własnym komentarzu** i leżał rozpakowany w `.cache/`
przez cały ten czas:

    case '+oth_cover':
        var mm = m[1].split(',');
        tm[1] += _t('msg_+oth_cover %val% %name%', {'%val%': mm[0], '%name%': mm[2]})
            + '<br>'; //mm[1]+' przejął(eła) '+mm[0]+' obrażeń<br>'

„Przejął(eła) N obrażeń" **to jest osłona**. Nazwa nie była więc zmyślona.
Prawdziwe błędy są dwa i oba węższe:

1. **Sklejenie DWÓCH kluczy pod jedną nazwą.** `+oth_cover` to przejęcie
   obrażeń; `+oth_dmg` to LISTA TRAFIONYCH przez umiejętność obszarową (do 20
   wpisów w jednym komunikacie, 24 z 29 komunikatów z zapowiedzią). Wspólny
   przedrostek nie znaczy wspólnej mechaniki — i to dlatego boss trafia na tę
   listę, co przy „osłonie" wyglądało na sprzeczność.
2. **Ogłoszenie braku wiedzy po sprawdzeniu JEDNEGO źródła.** „Katalog nie zna"
   zapisałem jako „nie wiadomo, co to jest". **Sprawdzenie jednego źródła
   i sprawdzenie źródeł to nie to samo** — a jest to lustrzane odbicie błędu,
   który sam w tym wpisie wytknąłem: tam ktoś przyjął nazwę bez sprawdzenia
   źródła, tu ja odrzuciłem ją bez sprawdzenia wszystkich.

**✅ FORMAT JEST DZIŚ ROZSTRZYGNIĘTY** (`BattleMessages.js:596‑607`), trzy
ustalenia, żadne wcześniej niezapisane:

- `mm[0]` — kwota;
- **`mm[1]` — KOD ŻYWIOŁU**, wchodzi w `class=dmg{mm[1]}`, czyli w tę samą
  konwencję, co gałąź `default`. Zmierzone: wszystkie cztery występujące kody
  (`a`, `g`, `f`, `c`) są w tabeli `ELEMENTS`. Do 2026‑08‑07 `ROADMAP.md`
  nazywał go „klasą", co czytało się jak klasa POSTACI;
- `mm[2]` — **nazwa odbiorcy**, podstawiana pod `%name%`.

Na tym stoi naprawa etykiet z `e7087a3`: 71 efektów pokazuje dziś zdanie gry
zamiast klucza (etykiety spadające do klucza **200 → 129**).

**✓ Co materiał ROZSTRZYGA** (i to jedno wolno zapisać jako pewne):
- 71 z 71 wystąpień ma dokładnie trzy człony i procent życia w trzecim;
- 71 z 71 stoi w komunikacie **bez ani jednej liczby obrażeń**, więc podwojenia
  z `-dmgd` w tym samym komunikacie NIE MA;
- adresat zawsze jest w składzie: 40× trzecia postać, 31× druga strona (`f2`).

**Docelowo.** ⚠️ Stało tu „pozycja staje się MECHANIKĄ NIEROZPOZNANĄ […]
następny krok to czytanie klienta gry". Krok został zrobiony NAZAJUTRZ i zajął
jeden `grep` — źródła leżały rozpakowane w `.cache/` przez cały czas, sieć nie
była potrzebna. Dziś więc:

- **format ✅ ROZSTRZYGNIĘTY** (wyżej), a na nim stoi naprawa etykiet `e7087a3`;
- **liczenie ⬜ OTWARTE** — i to jest jedyne, czego klient nie mówi.

Czterech pomiarów świadka, dwa modele leczenia:

| model | trafień | rozjazdów |
|---|---|---|
| bez `+oth_dmg`, cele leczone pominięte | 0 | 18 |
| z `+oth_dmg`, cele leczone pominięte | 5 | 13 |
| bez `+oth_dmg`, leczenie modelowane | 0 | 71 |
| z `+oth_dmg`, leczenie modelowane | **25** | 46 |

Kierunek jest pewny — **zawsze 0 bez, zawsze więcej z** — a wielkość nie.
Rozjazdy są zdominowane przez leczenie, którego nadmiar gra ucina i log go nie
podaje; to ten sam powód, dla którego `swiadekZycia` wyklucza uleczone cele
(`AUDYT‑61`). **Domknie to zrzut z walki BEZ leczenia** — dokładnie ten sam,
którego repo potrzebuje do wzmocnienia świadka, więc jedna walka zamyka dwie
pozycje.

⚠️ **Wniosek ogólniejszy — trzeci raz ten sam kształt.** `AUDYT‑93` pomylił
„kogo dotyczy" z „kto wyzwolił", `AUDYT‑94` — „komu służy" z „kto wyzwolił",
a tutaj wpis rejestru **wziął nazwę własną klucza za jego opis**, ja zaś
**wziąłem milczenie jednego źródła za brak wiedzy**. Za każdym razem brakującym
krokiem było to samo: sprawdzić, czy źródło w ogóle o tym mówi — z tym, że
źródeł jest kilka i pytać trzeba wszystkich. Katalog pomocy odpowiada „nie
znam" w jednym `grep`; klient odpowiada „oto ciało gałęzi" w drugim. Oba pliki
leżały w `.cache/`.

⚠️ **A wniosek DRUGI jest gorszy od pierwszego i policzony gitem.** Do
2026‑08‑06 nazwa stała w JEDNYM miejscu. Runda z tego samego dnia (`4039be7`,
efekt poza ciosem) rozniosła ją do **pięciu kolejnych plików** — `CHANGELOG.md`
(czyli do tekstu dla GRACZA), `src/types.ts`, `src/stats.ts`, `src/protokol.ts`
i speca — i była to runda AUDYTUJĄCA ten obszar. Nikt jej nie zmyślił drugi raz;
każde z tych pięciu miejsc CYTOWAŁO `ROADMAP.md`. **Cytowanie własnego rejestru
czyta się jak sprawdzanie źródła, a nim nie jest** — i jest to szybsza droga
rozprzestrzeniania nieprawdy niż jej wymyślenie, bo za każdym razem wygląda na
staranność. Sprostowane we wszystkich sześciu miejscach tą samą rundą.

## N. Droga danych od gry do panelu — audyt PO commicie `d978554` (2026‑08‑07)

Przegląd CAŁEJ drogi, którą liczba przechodzi od gry do panelu:
`Engine.battle.update` → `protokol-source.ts` → `protokol.ts` → `stats.ts` →
`session.ts` → `overlay.ts`. Zamówiony jako audyt jakości kodu i poprawności
pozyskiwania danych; sekcja powstała **w całości otwarta**, wszystkie wpisy
w statusie `⬜ ZAPISANE, nienaprawione` — jak sekcja `I`, gdzie naprawy szły
osobnymi decyzjami.

Drzewo czyste, brama zielona: **816 zielonych, 0 czerwonych, 2187 `expect()`,
24 pliki**, `tsc --noEmit` bez błędu przy dziesięciu flagach ścisłości, **zero
`any` i zero `@ts-ignore` w `src/`**.

**Dziesięć znalezisk, każde zreprodukowane** — cztery atrapą na kodzie, pięć na
materiale z `tests/fixtures/`, jedno `git`iem i `grep`em po `docs/`.

⚠️ **Wspólny mianownik siedmiu z dziesięciu: liczba, która jest nieprawdziwa,
gdy założenie spoza naszego kodu przestaje obowiązywać.** Cudzy dodatek owija
`update` (`AUDYT‑107`), gra nie wymienia obiektu walki (`AUDYT‑108`), wojownik
nie trafia do żadnej migawki (`AUDYT‑110`), serwer przysyła `-dmgX` bez pary
(`AUDYT‑111`), magazyn oddaje nagranie w starym kształcie (`AUDYT‑112`). We
wszystkich pięciu przypadkach **nasz kod jest napisany poprawnie względem
własnych założeń** — i to jest właśnie powód, dla którego żaden test tego nie
łapie: testy sprawdzają kod przeciw założeniom, a nie założenia przeciw światu.

⚠️ **Drugi wzorzec, węższy i groźniejszy: ostrzeżenie, które MÓWI NIE O TYM.**
Trzy pozycje (`AUDYT‑110`, `AUDYT‑111`, `AUDYT‑114`) zapalają `⚠ N nieznanych
linii — statystyki niepełne` i przez to formalnie **nie są ciche** — reguła
„nieznane ma być głośne" działa. Tyle że komunikat mierzy liczbę zdarzeń
`unknown`, a użytkownik potrzebuje wiedzieć, ILE LICZB stracił. Te same trzy
słowa opisują raz 2,5 % straty, raz 100 %, raz wyzerowaną kolumnę
„pochłonięte". Po `AUDYT‑95` („reguła »nieznane ma być głośne« nie chroni przed
ZNANYM, o którym zdecydowano źle") to jest jej druga granica: **głośne ostrzeżenie
o złej jednostce chroni tak samo słabo jak ciche.**

⚠️ **Trzeci wzorzec dotyczy tego rejestru, nie kodu.** `AUDYT‑115` i `AUDYT‑116`
to dwa rozjazdy w `docs/`, oba w miejscach, do których inny dokument odsyła jako
do źródła prawdy, i oba **bez strażnika**. `AGENTS.md` zapisał lekcję „reguła bez
strażnika po stronie danych jest regułą o kodzie, nie o repozytorium" dwa razy
2026‑08‑06 (pseudonimy, opisy umiejętności). Tu ma trzeci i czwarty dowód, tym
razem nie o materiale z gry, tylko o samej dokumentacji.

**Czego ta runda NIE podważa.** Niezmienniki sum i rozbić trzymają: sprawdzone
niezależnie na obu prawdziwych walkach, `dealtBy`, `dealtByType`, `takenFrom`,
`takenByType`, `healedBy`, `dealtToBy` i `takenFromBy` dają **0 rozjazdów
w `amount`** (`AUDYT‑109` dotyczy wyłącznie `hits`). Parowanie zadane ↔ przyjęte
po kodzie żywiołu działa — **0 komunikatów `unknown`** na 603 i 18 komunikatach.
Nieznany KLUCZ jest izolowany do własnego segmentu i nie zjada liczb z tej samej
linii (zmierzone podmianą `+acdmg` → `+acdmg_v2` w całym materiale: 100 % bazy
obrażeń nienaruszone) — `AUDYT‑110` dotyczy brakującego `id`, nie nieznanego
klucza, i te dwie rzeczy łatwo pomylić. Luka między zadanymi (388 029)
a przyjętymi (433 722) to DoT bez sprawcy (49 318), czyli reguła „nie udawaj
danych, których log nie ma", a nie błąd.

⚠️ **Sprostowanie do WŁASNEGO pierwszego przebiegu tej rundy.** Zgłosiłem
`src/protokol.ts:896` (`czesci[gdzie]!` w `parametryZdania`) jako dziurę
w kontrakcie — „komunikat z mniejszą liczbą członów niż wzorzec da `undefined`
przebrany za string". **Nieprawda: linia 895 sprawdza dokładnie ten przypadek**
i oddaje wtedy samo `%val%`, z komentarzem tłumaczącym, że awaria ma być głośna.
Wpis nie powstał, bo teza padła przy sprawdzeniu — ale mechanizm pomyłki wart
jest zapisania: `!` w linii wygląda jak brak strażnika, a strażnik stał linijkę
wyżej. **Non‑null assertion czyta się razem z poprzedzającym warunkiem, nie
sama.** Z czternastu takich miejsc w `src/` sprawdziłem po kolei cztery
najpodejrzliwiej wyglądające (`archive.ts:388`, `recorder.ts:364`,
`overlay.ts:2302`, `session.ts:30`) — **wszystkie strzeżone**.

### AUDYT‑107 — cudza warstwa na `Engine.battle.update` PODWAJA obrażenia, bez ani jednego ostrzeżenia 🔴 M — ⬜ ZAPISANE, nienaprawione ✓

`src/protokol-source.ts:245` (`zapewnijOwiniecie`)

**Problem.** Warunek pomijający jest koniunkcją: `this.owiniety === battle &&
(update as Opakowanie)[ZNACZNIK] === WERSJA`. Gdy inny dodatek owinie `update`
**po nas**, na wierzchu stoi cudza funkcja bez naszego znacznika → warunek
fałszywy. Drugi warunek (`:249`) też nie ratuje, bo `owiniety === battle`, więc
`odetnijWalke()` nie leci. Owijamy **drugi raz**, a `this.oryginal` staje się
cudzą warstwą, która wewnątrz woła naszą starą. Jedno wywołanie gry przechodzi
przez `przyjmij` dwa razy i `this.komunikaty.push(...porcja)` dubluje porcję.

**✓ Zmierzone** na atrapie `Engine` (trzy identyczne ciosy po 100 obrażeń, cudza
warstwa założona po naszej, potem nasz tik):

| | zadane | komunikatów w buforze | `unknownLines` |
|---|---|---|---|
| bez cudzej warstwy | 300 | 3 | 0 |
| z cudzą warstwą na wierzchu | **600** | **6** | **0** |

Dokładnie ×2 i **całkowicie cicho**. To jest wprost test przynależności
z `ROADMAP.md`: *czy panel może pokazać złą liczbę, nie mówiąc o tym ani słowem?*

⚠️ **Plik ZNA to ryzyko i broni się przed jego własną połową.** Docstring
`ProtocolSourceOptions.kolekcjoner` (`:159‑170`) mówi wprost: *„JEST TU PO TO,
ŻEBY NIE OWIJAĆ `update` DRUGI RAZ […] dwie warstwy na tej samej funkcji znoszą
sens czterech gwarancji, które ten plik składa"*. Cała ta ostrożność dotyczy
NASZEJ drugiej warstwy (sonda `walka-probe.js`). Cudzej nie dotyczy nic.

⚠️ **Asymetria między zakładaniem a zdejmowaniem.** `zdejmij()` (`:391‑404`) ma
już regułę „na wierzchu stoi cudza warstwa → nie ruszamy niczego" i jest ona
opisana jako umowa z gospodarzem strony. Zakładanie tej samej reguły nie ma —
mimo że skutkiem jest podwojenie liczb, a nie tylko nieposprzątanie. **Ta sama
sytuacja rozpoznana po jednej stronie cyklu życia i nierozpoznana po drugiej.**

**Docelowo.** `src/protokol-source.ts`. Kierunek do rozważenia przy naprawie:
gdy `owiniety === battle`, a znacznika na wierzchu nie ma, to nie jest „trzeba
owinąć", tylko „ktoś stanął nad nami" — i odpowiedzią jest odmowa ponownego
owinięcia, nie owinięcie. Wariant „szukaj naszego znacznika w głąb łańcucha"
odrzucony bez pomiaru: wymaga założeń o cudzym kształcie opakowania.

### AUDYT‑108 — `splitFights` jest MARTWE, a granica walki stoi na jednym warunku 🔴 S — ◧ POŁOWA NAPRAWIONA 2026‑08‑07, druga otwarta ✓

`src/session.ts:17‑41`, `src/stats.ts:805`, `src/protokol.ts:1435`

**Problem.** `splitFights` dzieli strumień na walki po zdarzeniu `fight-start`.
Dekoder protokołu **nigdy takiego zdarzenia nie produkuje** — jedynymi
producentami w całym repo są `tools/synthetic-log.ts:145` i `tests/zdarzenia.ts:44`,
czyli generator i budowniczy testowy. Zdarzenie zeszło ze strumienia 2026‑08‑04
razem z odczytem ze zdań (klient syntetyzuje linię otwierającą poza `data.m`);
funkcja, która na nim stoi, została.

**✓ Zmierzone.** Bufor z dwiema kopiami `2026-08-04-tempest-lowca-vs-odyncze`
przepuszczony przez `Session`:

| | zadane | tury | `fight-end` w strumieniu | `fight-start` |
|---|---|---|---|---|
| jedna walka | 2883 | 12 | 2 | 0 |
| bufor z dwiema | **5766** | **24** | 4 | **0** |

To liczbowo ten sam tryb awarii, który opisuje `AUDYT‑57` i cytuje komentarz
w `src/session.ts:90‑97` („2644 → 5288 obrażeń, 12 → 24 tury"). Jedyną obroną
jest dziś odcięcie bufora na `data.init` w `protokol-source.ts:266` — **jeden
warunek, bez drugiego świadka**. `session.ts` przyznaje to o sobie wprost
(`:96‑97`: *„ta funkcja nie ma jak sprawdzić, czy dostała jedną walkę, i dlatego
to zdanie jest ZAŁOŻENIEM o cudzym kodzie, a nie opisem tutejszego"*).

⚠️ **Strumień niesie sygnał, którego nikt nie czyta.** `fight-end` pada
**dokładnie 2× na walkę w OBU fixture'ach** (winner + loser) i jest jedynym
zdarzeniem granicznym, które dekoder naprawdę produkuje (`protokol.ts:1435`).
Nie jest to sygnał równoważny `init` — mówi „walka się skończyła", nie „zaczyna
się nowa" — ale jest **drugim, niezależnym źródłem** dla tej samej granicy,
a `session.ts` dzieli dziś po zdarzeniu, którego nie ma, zamiast po tym, które
jest.

⚠️ **Skutek uboczny tej samej martwoty, w innym pliku.** `stats.ts:805`
(`events.find(e => e.kind === "fight-start")?.participants ?? []`) zwraca na
żywo **zawsze `[]`**, a komentarz dwie linie niżej obiecuje: *„Gdy go nie ma
(testy, wklejony tekst, patch gry), lecimy z linii otwierającej — dokładnie jak
przedtem"*. Linii otwierającej nie ma. To **fallback zamieniający brak danych
w zero** — wzorzec wymieniony w `ROADMAP.md` z nazwy jako kwalifikujący się do
kierunku. Gałąź żyje wyłącznie dla testów i `tools/`.

⚠️ **Czwarty raz ten sam kształt: martwy kod po skasowanym parserze.** Po
`AUDYT‑88` (trzy martwe strażniki), `AUDYT‑92` (ścieżka, do której przeprowadziła
się wiedza) i `AUDYT‑97` (dwie martwe etykiety w `DOT_LABELS`) — tu martwe jest
**całe kryterium podziału**, nie pojedynczy warunek. Reguła „kasując ścieżkę
WEJŚCIA, przejdź to, co zostaje na WYJŚCIU" ma czwarty dowód, i tym razem
najdroższy: martwy strażnik nie broni przed podwojeniem liczb.

**Docelowo.** `src/session.ts` i `docs/ROADMAP.md` (otwarta pozycja „Granica
walk"). Naprawa ma dwie połowy i wolno je rozdzielić: skasowanie martwego
kryterium to `refactor`, dołożenie podziału po `fight-end` to zmiana zachowania
i zasługuje na spec — bo trzeba rozstrzygnąć, co robić ze zdarzeniami między
`fight-end` a następnym `init`.

✅ **PIERWSZA POŁOWA ZROBIONA 2026‑08‑07.** `splitFights` i `participantsKey`
zeszły z `src/session.ts`; `updateEvents` woła `aggregate` na całym buforze.
Zmierzone przed i po na obu fixture'ach przez `Session` — **wszystkie liczby
identyczne co do jednej** (zdarzenia, `unknown`, zadane, przyjęte, tury,
aktorzy), czyli teza „to kryterium jest martwe" potwierdzona pomiarem, a nie
samym `grep`em. Bramy nie ruszyło: 816 → 816 zielonych.

Cztery testy stojące na `splitFights` zeszły razem z nim (`tests/session.test.ts`),
bo wszystkie budowały materiał z `otwarcie()`. Weszły trzy inne: niezmiennik po
fixture'ach „walka z gry nie niesie ani jednego `fight-start`" — **jedyne
miejsce, w którym takie zdarzenie zapaliłoby dziś światło** — jego strażnik
niepustości, oraz jawny zapis, że bufor z dwiema walkami SUMUJE. Ten ostatni
sprawdzony mutacją: na kodzie sprzed zmiany **padłby** (`splitFights` zwracał
ostatnią walkę, więc postać z pierwszej znikała).

⚠️ **SPROSTOWANIE DO TEGO WPISU: `stats.ts:805` NIE JEST MARTWE.** Wpis wymienia
je w nagłówku razem z `session.ts`, jakby obie linie schodziły jednym ruchem.
Gałąź jest martwa **na żywo**, ale nie w repo: wisi na niej **cały korpus
syntetyczny** — `aggregate` bez `fromGame` w `tests/korpus.ts`, `readEvents`
w `tests/helpers.ts:39` i kilkadziesiąt wywołań w testach panelu i palety.
Skasowanie wymaga przeprojektowania `tools/synthetic-log.ts`, żeby oddawał skład
obok zdarzeń — własna runda z własnym specem. **Zdanie „gałąź żyje wyłącznie dla
testów i `tools/`" było prawdziwe i mimo to mylące**: „żyje wyłącznie dla
testów" czyta się jak „da się skasować", a znaczy tu „testy są jej jedynym
konsumentem i dlatego kasowanie zaczyna się od nich".

### AUDYT‑109 — `DamageSource.hits` znaczy DWIE różne rzeczy, a docstring podaje jedną 🟡 S — ⬜ ZAPISANE, nienaprawione ✓

`src/types.ts:385‑397`, `src/types.ts:776‑781`, `src/stats.ts:1083‑1100`

**Problem.** Docstring pola obiecuje: *„Ciosy, nie liczby obrażeń. Jeden cios
potrafi nieść kilka liczb — tancerz bije dwiema broniami, mag zadaje zimno
i błyskawicę naraz — a to nadal jedno uderzenie z kilku źródeł."* Jest to prawda
w `dealtBy`/`takenFrom`, gdzie `countStrike` leci raz na zdarzenie
(`stats.ts:1083‑1088`), i **nieprawda** w `dealtByType`/`takenByType`, gdzie
leci raz na RODZINĘ typu obecną w ciosie (`:1097‑1100`). `ActorStats.dealtByType`
dokłada drugą obietnicę — *„Suma jest identyczna jak w `dealtBy` — to inny
podział, nie dodatkowe obrażenia"* — prawdziwą dla `amount` i milcząco fałszywą
dla `hits`.

**✓ Zmierzone** na `2026-08-06-tempest-grupa-vs-hildur`. Sumy `amount` zgadzają
się wszędzie; rozjeżdżają się wyłącznie `hits`:

| postać | pole | `dealtBy` / `takenFrom` | `dealtByType` / `takenByType` |
|---|---|---|---|
| Gracz 2 | zadane | 24 | **72** |
| Gracz 9 | zadane | 18 | 36 |
| Gracz 3 | zadane | 15 | 30 |
| Gracz 7 | zadane | 12 | 24 |
| Gracz 1 | zadane | 7 | 14 |
| Hildur | zadane | 22 | 30 |
| Hildur | przyjęte | 233 | **333** |
| Gracz 4 | przyjęte | 22 | 30 |

**Osiem rozjeżdżonych wierszy u siedmiu postaci z jedenastu**; pozostałe cztery
biją jednym żywiołem i przez to się zgadzają — czyli **rozjazd jest regułą,
a zgodność przypadkiem materiału.**

⚠️ **Decyzja jest dobra, nosi ją zły typ.** Komentarz w `stats.ts:1089‑1096`
uzasadnia to wprost i przekonująco: *„tu pytanie brzmi »ile ciosów niosło ten
żywioł«"*, a odcięcie zdarzeń `strike: false` zostawiłoby pozycję z obrażeniami
i zerem ciosów. Problemem nie jest rachunek, tylko to, że **`DamageSource` jest
jednym typem dla dwóch pytań**, a jego docstring odpowiada tylko na jedno. Panel
pokazuje obie liczby w tym samym wierszu.

⚠️ **To jest ta sama reguła z `CLAUDE.md`, od strony, z której jeszcze nie
padła.** „To typ jest tu obietnicą, a nie kod, który akurat go czyta" miało dotąd
trzy dowody w postaci pola, którego w typie ZABRAKŁO (`AUDYT‑93`) albo które
ktoś zapomniał odczytać. Tu pole jest, jest opisane, a opis jest prawdziwy dla
połowy jego użyć. **Obietnica węższa od użycia zawodzi tak samo jak jej brak** —
z tą różnicą, że wygląda na dotrzymaną.

**Docelowo.** `src/types.ts`. Najtańszy wariant to sprostowanie docstringa i pola
`hits` w `dealtByType` na własną nazwę; droższy i uczciwszy — osobny typ dla
przekroju po typie. Wybór wymaga spojrzenia na `overlay.ts`, więc nie ta runda.

### AUDYT‑110 — brak wojownika w składzie zabiera obrażenia, a ostrzeżenie mierzy nie to, co trzeba 🟡 S — ⬜ ZAPISANE, nienaprawione ✓

`src/protokol.ts:1088‑1091`, `src/overlay.ts:2822‑2827`

**Problem.** Komunikat, którego `id` (którejkolwiek strony) nie ma w składzie,
schodzi **w całości** do `{kind:"unknown"}` — razem z liczbami, które były w nim
czytelne. Nie jest to usterka rozbioru: bez nazwy nie ma komu przypisać
obrażeń. Usterką jest to, ILE przez to znika i jak mało o tym mówimy.

**✓ Zmierzone.** Usunięcie JEDNEGO wojownika ze składu przy niezmienionym
materiale (`2026-08-06-tempest-grupa-vs-hildur`, baza 388 029 obrażeń zadanych):

| usunięty | zdarzeń `unknown` | zadane | % bazy |
|---|---|---|---|
| Gracz 1 | 37 | 378 491 | 97,5 % |
| Gracz 7 | 43 | 363 977 | 93,8 % |
| Gracz 4 | 70 | 330 752 | 85,2 % |
| Gracz 10 | 48 | 310 428 | 80,0 % |
| Hildur (cel wszystkich) | 443 | **0** | **0 %** |

**✓ Sprawdzone łagodzące** — żeby wpis nie był mocniejszy, niż wolno.
`protokol-source.ts:378` przelicza **CAŁY bufor** przy każdej porcji,
a `scalSklad` (`:124‑131`) kumuluje migawki zamiast je zastępować. Wojownik
dopisany do składu później **naprawia więc wstecz własne wcześniejsze
komunikaty** — to zasługa `36fe66a`. Ryzyko zostaje dla wojownika, którego nie
ma w ŻADNEJ migawce, i dla ścieżki archiwum, gdzie migawek już nie będzie
(`AUDYT‑112`).

⚠️ **Ostrzeżenie jest, tylko liczy nie to.** Panel mówi `⚠ N nieznanych linii —
statystyki niepełne`. Liczba `N` to liczba zdarzeń `unknown`; użytkownik
potrzebuje wiedzieć, ile LICZB stracił. W tabeli wyżej „⚠ 37" znaczy 2,5 %
straty, a „⚠ 443" — wszystko. Rozpiętość jest o dwa rzędy wielkości, a słowa
te same.

**Docelowo.** `docs/ROADMAP.md` i `src/stats.ts`. Kierunek: `unknown` niosące
czytelne `+dmg*` mogłoby wnieść do agregatu samą KWOTĘ jako „bez sprawcy",
zamiast przepadać — pula „Bez sprawcy" już istnieje i jest dokładnie po to.
Wariant „zgadnij nazwę z `id`" odrzucony: łamie regułę „nie udawaj danych,
których log nie ma".

### AUDYT‑111 — „przyjęte bez zadanego" daje UJEMNE pochłonięcie, które zjada prawdziwe 🟡 S — ⬜ ZAPISANE, nienaprawione ✓

`src/protokol.ts:1575‑1585`, `src/stats.ts:1032`

**Problem.** Niesparowane `-dmgX` tworzy trafienie `raw: 0, applied: wartosc`
(`protokol.ts:1575‑1585` — kształt świadomy, opisany i zapalający `unknown`
w linii wyżej). Agregat liczy jednak `damageAbsorbed += hit.raw - hit.applied`
(`stats.ts:1032`), czyli dla takiego trafienia wartość **ujemną** — a pochłonięcie
sumuje się przez całą walkę.

**✓ Zmierzone** na atrapie składu, trzy przebiegi:

| komunikaty | pochłonięte u celu | `unknownLines` |
|---|---|---|
| `+dmgd=500;-dmgd=300` | 200 | 0 |
| `-dmgd=200` sam | **−200** | 1 |
| oba razem | **0** | 1 |

Prawdziwe 200 pochłoniętych znika. Nie jest to strata cicha — `unknown` się
zapala — ale mówi „jednej linii nie zrozumiałem", a nie „kolumna »pochłonięte«
jest teraz nieprawdziwa dla tej postaci".

⚠️ **Dwa pliki zgodne z sobą, niezgodne co do znaczenia.** `protokol.ts` mówi
`raw: 0` w znaczeniu „nie wiemy, ile poleciało"; `stats.ts` czyta to jako „zero
poleciało" i odejmuje. Żaden z nich nie jest napisany źle względem własnego
komentarza. **Rozjazd siedzi w polu, przez które się porozumiewają** — i jest
to trzeci raz w tym rejestrze (`AUDYT‑93`, `AUDYT‑109`), kiedy usterka mieszka
w kontrakcie, a nie po żadnej z jego stron.

⚠️ **Niezmiennik korpusowy tego nie łapie i nie może.** `stats.test.ts:944`
sprawdza `damageBlocked ≤ damageAbsorbed`; obie liczby mogą być ujemne
i nierówność zachodzi dalej. Brakuje najprostszego z możliwych: **żadna suma
obrażeń nie ma prawa być ujemna.**

**Docelowo.** `src/stats.ts` (pominięcie trafień `raw === 0 && applied > 0`
w rachunku pochłonięcia) plus niezmiennik „skalary nieujemne" po całym
`KORPUS`. Ten drugi wolno dołożyć od razu i osobno — jest tańszy niż decyzja
o pierwszym.

### AUDYT‑112 — `Recorder.read()` sprawdza pojemnik, nie zawartość 🟡 S — ⬜ ZAPISANE, nienaprawione

`src/recorder.ts:264‑274`

**Problem.**

```ts
const parsed = JSON.parse(surowe) as Partial<Nagranie>;
if (!Array.isArray(parsed.komunikaty) || !Array.isArray(parsed.sklad)) return null;
return { komunikaty: parsed.komunikaty, sklad: parsed.sklad };
```

Sprawdzone jest, że to tablice — nie to, co w nich stoi. `sklad` z elementami
bez `id` albo `name` przechodzi i idzie prosto do `dekoduj`, czyli w tryb awarii
z `AUDYT‑110` — tylko **bez szansy na naprawę wsteczną**, bo w odtwarzaniu
migawek już nie będzie. Docstring metody obiecuje przy tym, że `null` obejmuje
*„nagranie w starym formacie, które przetrwało kasowanie indeksu"* — obejmuje
je tylko wtedy, gdy stary format różnił się kształtem POJEMNIKA.

⚠️ **Wzorzec do naśladowania stoi 130 linii wyżej, w tym samym pliku.**
`isRecording` (`:132‑144`) sprawdza KAŻDE pole i ma przy sobie komentarz mówiący,
dlaczego: *„brakujące `chars` psuło arytmetykę budżetu […] brakujące `at` dawało
»NaN.NaN NaN:NaN« w wierszu archiwum"*. Ta lekcja została wyciągnięta dla
INDEKSU i nie przeszła na TREŚĆ — mimo że treść jest tym, z czego liczą się
statystyki, a indeks tylko tym, co widać na liście.

**Docelowo.** `src/recorder.ts`. Predykat na wpis składu ma już gdzie mieszkać
(`RosterEntry` w `src/roster.ts`), a `roster.ts:105‑106` pomija po cichu
wojownika bez `id`/`name`/`team` — czyli reguła istnieje, brakuje jej po tej
stronie.

### AUDYT‑113 — świadek dekodera robi 10 porównań na 1448 zdarzeń, a materiał ma na 108 więcej ⚪ M — ⬜ ZAPISANE, nienaprawione ✓

`tests/fixtury.ts:141‑201` (`swiadekZycia`)

**Problem.** Jedyny świadek dekodera spoza dekodera pokrywa dziś ułamek korpusu.

**✓ Zmierzone:**

| fixture | zdarzeń | `sprawdzonych` | `poLeczeniu` | `bezMaksa` | rozjazdy |
|---|---|---|---|---|---|
| `…lowca-vs-odyncze` | 18 | 7 | 0 | 0 | 0 |
| `…grupa-vs-hildur` | 697 | **3** | **251** | 0 | 0 |

Czułość jest w porządku i to trzeba powiedzieć razem z resztą: mutacja
„sumuj `raw` zamiast `applied`" zapala **6 z 7** na małym fixture i **3 z 3** na
dużym. Problemem jest wyłącznie głębokość — 10 porównań na 1448 zdarzeń `KORPUS`.

**✓ Materiał na więcej JEST w pliku, którego już nie trzeba zdobywać.**
Wszystkie **108** zdarzeń `heal` w dużym fixture niosą jednocześnie `amount`,
`targetHpPct` i znane `hp.max` (zmierzone: 108 / 108 / 108). Stąd dwa ruchy, oba
bez nowego zrzutu:

1. **świadek leczenia** — `targetHpPct` po uleczeniu przeciw poprzedniemu
   procentowi powiększonemu o `amount / max`; dziś leczenie **nie ma świadka
   wcale**, a jest drugą co do wielkości liczbą w panelu;
2. **ponowne zakotwiczenie po leczeniu** zamiast wykluczenia celu na zawsze —
   zdarzenie `heal` samo podaje nowy procent, więc od niego można liczyć dalej
   i odzyskać część z 251 porzuconych porównań.

⚠️ **Reguła „uleczony wypada" jest słuszna i uzasadnia mniej, niż robi.**
`AUDYT‑61` ustalił ją, bo nadmiar leczenia gra ucina i log nie mówi, ile weszło —
to jest argument przeciw **doliczaniu `amount` do bazy**. Nie jest to argument
przeciw **przyjęciu nowego punktu odniesienia, który protokół podaje wprost**
w tym samym zdarzeniu. Trzy testy syntetyczne (`fixtury.test.ts:430‑478`)
pilnują dziś reguły w jej dzisiejszym kształcie, więc zmiana zacznie się od nich.

⚠️ **Zapisane wcześniej i nadal prawdziwe:** `tests/fixtures/README.md` mówi, że
zrzut wzmacniający świadka musi być walką **BEZ leczenia celu**. Ta pozycja tego
nie unieważnia — mówi tylko, że **część drogi da się przejść materiałem, który
już jest**, zanim taka walka się trafi.

**Docelowo.** `docs/ROADMAP.md` (pozycja „Czego brakuje w korpusie fixture'ów").
Wykonanie osobną rundą i ze specem: to zmiana w jedynym świadku spoza dekodera,
więc istnieje więcej niż jeden sensowny wariant i wybór trzeba uzasadnić.

### AUDYT‑114 — `unknownLines` miesza dwie jednostki 🟡 XS — ⬜ ZAPISANE, nienaprawione ✓

`src/protokol.ts:1084` (`nieznany`), `src/stats.ts:1270‑1272`, `src/overlay.ts:2822‑2827`

**Problem.** `nieznany()` pushuje zdarzenie raz **na cały komunikat** (`:1090`
— `id` spoza składu, `:1520` — brak nazwy strony) i raz **na pojedynczy
parametr** (`:1171` — segment z drugim `=`, `:1174` — nieznany klucz, i sześć
dalszych miejsc). `stats.ts` liczy zdarzenia, a panel nazywa je „liniami".

**✓ Zmierzone.** Podmiana `+acdmg` → `+acdmg_v2` w całym materiale daje zdarzenia
`unknown` o treści `"+acdmg_v2=50"` — czyli sam segment, przy komunikacie
niosącym osiem członów — i **100 % bazy obrażeń nienaruszone**. Dla porównania
`AUDYT‑110`: tam `line` niesie CAŁY komunikat, a obrażenia znikają. Ta sama
liczba w panelu, dwa różne zdarzenia i dwie różne konsekwencje.

⚠️ Wpis jest XS i celowo stoi osobno od `AUDYT‑110` i `AUDYT‑111`, choć wszystkie
trzy dotyczą tego samego komunikatu: tamte dwa mówią, że ostrzeżenie **mierzy złą
wielkość**, ten — że **nie ma nawet stałej jednostki**. Naprawa pierwszego bez
drugiego dałaby dokładniejszą liczbę w niepewnej jednostce.

**Docelowo.** `src/protokol.ts` — rozdzielenie na dwie liczby („komunikatów
odrzuconych" i „segmentów niezrozumianych") albo domknięcie `unknown` do jednej
jednostki. `docs/UX.md` przy brzmieniu komunikatu.

### AUDYT‑115 — spis speców rozjechał się z katalogiem i nie ma strażnika ⚪ XS — ⬜ ZAPISANE, nienaprawione ✓

`docs/specy/README.md`

**Problem.** Tabela „Spis" wymienia **9** plików; katalog ma **11**. Brakuje
`2026-08-04-parser-tekstu-i-korpus-schodza-z-drzewa.md` oraz
`2026-08-06-efekt-poza-ciosem.md` (`Status: wdrożone · 2026‑08‑06 · 4039be7`).
Ten drugi powstał w rundzie, która **sama siebie audytowała** — commit `67a9f46`
nosi w nagłówku `docs(specy,…)`.

**✓ Zmierzone.** `ls docs/specy/*.md` przeciw zawartości tabeli. `grep -rn
"specy" tests/ tools/ .github/` nie znajduje ani jednego strażnika — trafienia
są wyłącznie w komentarzach i prozie.

⚠️ **Trzeci raz ta sama lekcja, tym razem nie o materiale z gry.** `AGENTS.md`
zapisał 2026‑08‑06 dwa razy: *„reguła bez strażnika po stronie danych jest
regułą o kodzie, nie o repozytorium"* — raz przy pseudonimach, raz przy opisach
umiejętności. `README.md` speców mówi o sobie *„Tabelę uzupełnia się ręcznie
przy dodaniu pliku"*, czyli reguła istnieje i jest zapisana. `CHANGELOG.md` ma
test (`tests/changelog.test.ts`) i przez to **nie zdążył się rozjechać**; spis
speców testu nie ma i rozjechał się dwa razy. **Porównanie tych dwóch plików
jest tańszym dowodem tej reguły niż jakikolwiek wywód.**

**Docelowo.** `tests/` — strażnik po wzorze `tests/fixtury.ts`: `readdirSync`
po `docs/specy/`, każdy plik poza `README.md` i `SZABLON.md` ma mieć wiersz
w tabeli. Pliki odkrywane, nie wymieniane — inaczej strażnik zestarzeje się tak
samo jak spis.

### AUDYT‑116 — tabela `§0`, do której odsyła `docs/README.md`, nie widzi 42 wpisów 🟡 S — ⬜ ZAPISANE, nienaprawione ✓

`docs/AUDYT.md §0`, `docs/README.md:342`

**Problem.** `docs/README.md` w sekcji „Co jest teraz otwarte" mówi: *„Nie
przepisuję tu listy, bo zdezaktualizuje się w tydzień. Aktualny stan: **`AUDYT.md`**
— tabela na górze pliku; przekreślone ID są zamknięte."* Tabela `§0` kończy się
na `AUDYT‑52` i **nie ma w niej ani jednego ID z sekcji `I`, `J`, `K`, `L`, `M`**.

**✓ Zmierzone** — stan zastany, czyli **przed** dopisaniem tej sekcji:

| | ile |
|---|---|
| wpisów z własnym nagłówkiem `### AUDYT‑N` | **97** |
| wierszy w tabeli `§0` | **55** |
| ID z nagłówkiem, ale bez wiersza | **42** |

⚠️ **Ta tabela zestarzała się w chwili powstania i nie jest to niedopatrzenie.**
Sekcja `N` dokłada dziesięć wpisów i żadnego wiersza, więc dziś te liczby to
**107 / 55 / 52** — sama runda pogłębiła rozjazd o dziesięć. Zapisane są liczby
ZASTANE, bo to one mówią, jak duży był dług przed rundą; dzisiejsze poda
`grep -c '^### AUDYT' docs/AUDYT.md` i policzenie wierszy `§0`. **Cytowanie tu
liczby bieżącej byłoby dokładnie tą chorobą, którą ten wpis opisuje** — i to
jest powód, dla którego rejestr każe liczyć plikiem, nie pamięcią.

Brakujące to `56`…`75`, `85`, `86`, `87`…`94`, `95`…`99`, `100`…`106` — czyli
**wszystko, co powstało od 2026‑08‑05**. Konwencja nie została porzucona
decyzją; po prostu przestała być wykonywana i nikt tego nie zauważył, bo
odsyłacz do niej stoi w INNYM pliku.

**✓ Zmierzone, druga konwencja tego samego pliku.** Łańcuch akapitów
`**Dopisane RRRR‑MM‑DD (sekcja X):**` w preambule urywa się na sekcji `K`:
sekcje `L` (`AUDYT‑100`…`101`) i `M` (`AUDYT‑102`…`106`) nie mają w nim ani
jednego zdania. Dwie niezależne konwencje tego samego pliku przestały być
wykonywane **w tym samym tygodniu i z tego samego powodu** — obie wymagają
dopisania w miejscu odległym od tego, gdzie się pracuje.

⚠️ **Ostrzeżenie o starzeniu się dokumentacji zestarzało się samo — drugi raz
w tym pliku.** Pierwszy raz zrobił to `AUDYT‑46` (przypis o rozjeździe numerów
linii). Tu robi to zdanie *„nie przepisuję tu listy, bo zdezaktualizuje się
w tydzień"* — napisane po to, żeby uniknąć rozjazdu, i odsyłające do miejsca,
które rozjechało się o 42 pozycje. **Wskazanie źródła prawdy nie czyni z niego
źródła prawdy.**

⚠️ **Dlaczego to jest 🟡, a nie ⚪.** Wpis `§G` tej samej sekcji nosi od
2026‑08‑02 wniosek *„tabela ze statusem cudzej pozycji jest długiem — docelowo
zostawić tu same odsyłacze, bez kolumny statusu"*, opisany tam jako **„najtańsza
otwarta robota w całym `docs/`"** i nadal niewykonany. `§0` jest tą samą
konstrukcją o pięć razy większej skali. Decyzja „uzupełnić 42 wiersze" i decyzja
„skasować tabelę, poprawić odsyłacz w `README.md`" prowadzą w przeciwne strony
i **żadnej nie wolno podjąć mimochodem**, dlatego runda tego nie naprawia.

⚠️ **Ta runda sama się o to potknęła.** Plan zakładał dopisanie wierszy `§0` dla
sekcji `N` — jako że tak każe konwencja opisana w preambule. Sprawdzenie, gdzie
te wiersze wstawić, było jedyną przyczyną odkrycia. **Konwencja czytana z opisu
i konwencja odczytana z pliku to dwie różne rzeczy**, a różnicy nie widać,
dopóki się czegoś nie dopisuje.

**Docelowo.** `docs/AUDYT.md` i `docs/README.md` — jedną decyzją, nie dwiema.
Sekcja `N` **celowo nie dokłada wierszy do `§0`**, żeby nie pogłębiać rozjazdu
przed jej podjęciem; jest to zgodne z tym, co robiło pięć poprzednich sekcji.

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
