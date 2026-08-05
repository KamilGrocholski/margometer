# Zrzut materiału z gry robi dodatek, nie tylko sonda w konsoli

Status: wdrożone · 2026-08-05

## Problem

**Materiał z gry jest wąskim gardłem tego repo i jest to zapisane w czterech
miejscach `ROADMAP.md`.** Każda z tych pozycji kończy się tym samym zdaniem
„czego brakuje do domknięcia":

- atrybucja leczenia — brakuje zrzutu z kluczem `heal_target`;
- tura z autorytatywnego `data.current` — brakuje zrzutu z walki TUROWEJ,
  w której porcje przychodzą osobno (jedyny zrzut, jaki mamy, przyszedł w JEDNYM
  wywołaniu `update`, bo to była walka automatyczna);
- `bandage` i `vamp_time` — leczenie, które „w panelu nie istnieje wcale";
  brakuje walki, w której któryś z tych kluczy pada;
- lista zakupowa w `tests/walka-z-gry.ts`: blok, unik, absorpcja, zapowiedź
  umiejętności. **Jedyna prawdziwa walka w repo nie ma żadnego z nich.**

Zebranie zrzutu wymagało dotąd wklejenia `tools/walka-probe.js` do konsoli gry
**przed** walką. Trzy koszty, z czego trzeci jest jakościowy, nie wygodowy:

1. trzeba pamiętać zawczasu — a te klucze padają w walkach, których się nie
   planuje;
2. trzeba mieć plik pod ręką, w karcie z grą;
3. **sonda owija `Engine.battle.update` DRUGI raz**, obok owinięcia, które
   dodatek już założył. `AGENTS.md` składa wobec tego owinięcia cztery
   gwarancje; dwie warstwy na jednej funkcji, zakładane i zdejmowane niezależnie,
   znoszą sens trzeciej z nich („przy odpięciu zdejmujemy wyłącznie SWOJĄ
   warstwę" — sonda zdejmuje wtedy naszą).

Zmierzone, a nie założone: dodatek nie miał jak wyprodukować tego pliku przy
okazji. `protokol-source.ts:262` czyta z ładunku **wyłącznie `t["m"]`**
i porzuca resztę, `przyjmij` odrzuca wywołania bez komunikatów (`:263`),
`RosterEntry` nie niesie `hp` ani surowego `team`, a strumień komunikatów jest
narastający, więc granica wywołania jest w nim nieodtwarzalna. Z ośmiu pól,
których wymaga `czytajZrzut`, dodatek miał jedno.

## Rozwiązanie

Kolekcjoner (`src/zrzut.ts`) wpięty w **to samo** owinięcie, które już stoi,
plus okno ustawień (`src/opcje.ts`) za zębatką w nagłówku panelu.

**Dlaczego wpięcie, a nie przeniesienie sondy.** To jest cała różnica wobec
wariantu „skopiuj `walka-probe.js` do `src/`": kolekcjoner niczego nie owija.
Dostaje te same argumenty, które przez opakowanie i tak przechodzą, i nic poza
tym. Liczba warstw na `Engine.battle.update` zostaje jedna.

**Format pliku jest kontraktem, nie wynalazkiem.** Zrzut wychodzi w kształcie,
który `bun tools/walka.ts --rozbij` czyta od 2026‑08‑04. Typy `Zrzut`
i `Wywolanie` przeniosły się przy tym z `tools/walka.ts` do `src/zrzut.ts`
i narzędzie importuje je stamtąd — dwa równoległe zapisy tego samego kształtu
to w tym repo zapisana przyczyna rozjazdów (`SOLID §11`), a tu dawałyby plik,
który zapisuje się poprawnie i nie daje rozebrać.

**Trzy rzeczy, których sonda nie potrzebowała, a kolekcjoner tak** — bo sonda
żyje minuty i jedną walkę, a dodatek stoi w karcie godzinami:

- **numer walki w każdym wpisie.** Sklejenie dwóch walk w jeden moduł dałoby
  fixture z pomieszanymi komunikatami i scalonym składem — materiał wyglądający
  na dowód i kłamiący. `--rozbij` odmawia przy kilku walkach i każe wskazać
  `--walka <n>`;
- **odchudzanie na żywo**, regułą `odchudz` co do joty: zostaje każde wywołanie
  z komunikatami, każdy nowy kształt ładunku i każda nowa migawka wojowników.
  Zmierzone na próbie: 20 wywołań odpytywania po walce zeszło do 1, przy
  `pominietych: 19` i bez utraty ani jednej informacji;
- **sufit pamięci, po którym zbieranie STAJE** zamiast wyrzucać najstarsze.
  Kolejność jest przemyślana: fixture bez początku walki jest bezużyteczny, bez
  końca — nadal niesie materiał. Zatrzymanie zapala głośny wiersz w oknie opcji.

**Dwie osłony w opakowaniu, nie jedna.** Migawka „przed" musi powstać przed
oryginalnym `update` — to jedyny nasz kod, który tam stoi, i wyjątek stamtąd
przewróciłby graczowi turę, zanim gra cokolwiek policzy. Druga osłona jest
oddzielna od osłony odczytu **w drugą stronę**: rzucone `po()` we wspólnym `try`
przeskakiwałoby `przyjmij`, czyli narzędzie deweloperskie zamrażałoby licznik.
Ten drugi układ był w pierwszej wersji tej rundy i został poprawiony przed
commitem — oba warianty mają dziś swój test.

## Odrzucone warianty

**Zbieranie z `PorcjaProtokolu` zamiast z surowego ładunku.** Kuszące, bo porcja
i tak przechodzi przez `index.ts` i kosztowałaby zero nowego kodu w opakowaniu.
Przekreślone przez to, co porcja niesie: `komunikaty` i `sklad`, czyli **żadnego
`myteam`, żadnego `hp` i żadnego surowego `team`**. Plik z takiego zbierania nie
przechodzi przez `czytajZrzut` i nie odpowiada na pytanie „ile komu spadło" —
a to jest jedyne pytanie, dla którego zrzut powstaje. Wariant wróci, gdyby
`PorcjaProtokolu` kiedyś zaczęła nieść cały ładunek; wtedy zgodność jest za
jedną linię i warto to sprawdzić, zanim ktoś napisze to drugi raz.

**Zbieranie ZAWSZE, nie za flagą.** Argument był realny: tryb włącza się dopiero
po tym, jak coś poszło nie tak, więc zbieranie warunkowe bywa wyłączone
dokładnie w chwili, w której było potrzebne. Przekreślone kosztem: migawka to
odczyt wszystkich wojowników z kopiowaniem `hp`/`ac` przy KAŻDYM wywołaniu
`update`, a te lecą także wtedy, gdy nic się nie dzieje. Gracz, który tego nie
włączył, ma płacić zero. Wariant zasługuje na powrót, gdyby dało się zbierać
tanio — na przykład sam ładunek bez migawek, z migawkami dopiero po włączeniu.

**Rozbudowa `recorder.ts` zamiast nowego modułu.** Nagrywarka już trzyma surowe
komunikaty i przeżywa odświeżenie. Przekreślone, bo jej format jest
UŻYTKOWY — archiwum czyta go przy każdym otwarciu, a budżet 500 tys. znaków jest
policzony pod nagrania walk. Dołożenie tam ładunków i migawek zmieniłoby format
nagrań (czyli „nagrania sprzed tej wersji przepadają", koszt ponoszony przez
gracza za funkcję dla programisty) i zjadłoby budżet, który należy do archiwum.

**Schowek zamiast pliku.** Odrzucone tam, gdzie sonda odrzuciła to pierwsza:
zrzut z długiej walki to setki kilobajtów, a `navigator.clipboard` bywa odmowny
bez gestu użytkownika. Wpisu „kopiuj" nie ma i nie ma być.

**Czyszczenie bufora przy każdej walce.** Dałoby mniejsze pliki i zero pytania
o numer walki. Przekreślone przez sposób, w jaki się tego używa: klucz, na który
się poluje, pada w walce, o której nie wiadomo z góry — więc bufor ma przeżyć
do momentu, w którym gracz zorientuje się, że właśnie ją stoczył.

**Zębatka jako komenda w konsoli, bez UI.** Tańsze o całe okno i zgodne
z kierunkiem „nowe funkcje wstrzymane". Odrzucone decyzją właściciela repo przy
wyborze wariantu. Koszt do świadomego przyjęcia: powstało miejsce, do którego
będą się dopisywać kolejne ustawienia.

**Pasek w panelu zamiast okna.** Paski panelu znikają przy zwinięciu, bo opisują
STAN WALKI (`renderRecordBar`). Ustawienia stanem walki nie są — opcja schowana
przy zwiniętym panelu byłaby usterką. Do tego +80 linii w pliku, który
`SOLID R7` planuje ciąć.

**Flaga trybu w `PanelState`.** Odrzucona, bo kolekcjoner musi znać ją PRZED
powstaniem panelu — zbieranie ma ruszyć na pierwszą walkę, także tę, która
zacznie się, zanim gracz otworzy ustawienia. Flaga siedzi pod własnym kluczem
`margometer.dev`, wzorem `margometer.rec.on` w nagrywarce, i dzięki temu
kolekcjoner daje się przetestować bez panelu w ogóle.

## Plan wdrożenia

Pięć commitów, każdy przechodzi `bun run check` osobno:

1. `src/zrzut.ts` + `tests/zrzut.test.ts` — kolekcjoner zamknięty w sobie;
2. wpięcie w `src/protokol-source.ts` + testy obu osłon;
3. `tools/walka.ts` — wspólne typy, `zrodlo`, `walka`, `--walka <n>`;
4. UI: `src/opcje.ts`, blok `OPCJE` w `style.ts`, ślad w `overlay.ts`, spięcie
   w `index.ts`, wpis w `CHANGELOG.md`;
5. dokumentacja: ten spec, `AGENTS.md`, nagłówek sondy.

## Weryfikacja

`bun run check`: **651 zielonych, 0 błędów**, build przechodzi (przed rundą 621).

**Piętnaście mutacji sprawdzonych, każda zapaliła dokładnie zamierzony test.**
Po kolei, bo to jest ta część, którą najłatwiej pominąć:

| co zepsute | co się zapaliło |
|---|---|
| ładunek przypisany przez referencję zamiast klonowany | mutacja `t` po wywołaniu widoczna w zapisie (2 testy) |
| `przed()` bez sprawdzenia flagi | „nie powstaje ANI JEDNA migawka" |
| odchudzanie bez ochrony wpisów z komunikatami | „KAŻDE wywołanie z komunikatami zostaje" |
| `nowaWalka()` bez numerowania | 3 testy rozdzielania walk |
| migawka bez surowego `team` | przejście przez `skladZeZrzutu` |
| brak `try/catch` przed oryginałem | „rzucający kolekcjoner nie przewraca `update`" |
| wspólna osłona dla `po()` i `przyjmij()` | „nie zatrzymuje licznika" |
| migawka „przed" przeniesiona za oryginał | kolejność `przed → oryginał → po` |
| brak zgłoszenia nowej walki | 2 testy |
| okno wstawione przez `prepend` | „`header` i `.row` należą dalej do panelu" |
| przycisk zrzutu rysowany bezwarunkowo | „schowany, dopóki tryb wyłączony" |
| brak strażnika pustego zrzutu | „pusty zapis NIE tworzy pliku" |
| `toggle()` bez `overlay.refresh()` | `aria-pressed` zębatki |
| `toggle()` bez rozbrojenia potwierdzenia | „zamknięcie okna rozbraja czyszczenie" |
| zębatka w `header.append` bez `attachOpcje` | „nie ma jej, dopóki okno nie doczepione" |

**Sprawdzone całą drogą, nie tylko testem.** Zrzut dwóch walk zbudowany
kolekcjonerem, zapisany do pliku i przepuszczony przez PRAWDZIWE CLI:
`--pokaz` pokazał obie walki z ich liniami otwierającymi, `--rozbij` bez
`--walka` **odmówił** z listą numerów, a `--rozbij --walka 1` wyprodukował
moduł ze stronami po właściwych stronach (`side: 0` dla gracza, `side: 1` dla
potworów) i nagłówkiem mówiącym „Zrzut z dodatku", nie „Zrzut sondy".

Test panelu `chrome okna opisuje JEDNA reguła` zapalił się sam, gdy doszło
trzecie okno — czyli zrobił dokładnie to, co obiecuje komentarz w `style.ts`.
Zamiast dopisać do niego selektor, przerobiono go na pętlę po liście okien,
żeby czwarte też się o niego potknęło.

### Pierwszy zrzut Z GRY, i co przez to wyszło

Świat `tempest`, build `1785244275300`, łowca przeciw stadku dzików, zebrany
dodatkiem 2026‑08‑05. Plik ma 8335 bajtów, 5 wpisów, `pominietych: 57`,
`przepelniony: false`, `zrodlo: "dodatek"`. Przeszedł przez `--pokaz`,
`--klucze`, `--rozbij`, a dalej przez `dekoduj` i `aggregate`: **11 komunikatów,
11 kluczy, 10 zdarzeń, ZERO nieznanych**, skład sześcioosobowy ze stronami po
właściwych stronach. Liczby domykają się same — zadane 1638 = przyjęte
858 + 780, w tym 140 z tyknięcia trucizny przypisanego jedynemu przeciwnikowi
po drugiej stronie (reguła `opponentOf`, nie zgadywanie).

**Materiałowo ten zrzut nie wnosi nic**: jest ścisłym PODZBIOREM
`tests/walka-z-gry.ts` — ta sama postać, ten sam świat, ten sam
`poison=140,14`, a brakuje mu ciosu potwora, leczenia i `-legbon_facade`.
Czterech pozycji z `ROADMAP.md` nie rusza. Wartość ma inną: to jest pierwszy
dowód, że cała droga z gry do modułu działa poza testami.

Wyszły przez niego **trzy błędy**, każdy niewidoczny w materiale zbudowanym
przez nas:

1. **Linia otwierająca przepadała**, gdy gracz włączył tryb w TRAKCIE walki —
   `otwarcie: null`, `otwarcia: {}`. `nowaWalka()` czytało czat tylko przy
   włączonej fladze, a gracz włącza tryb dokładnie wtedy, gdy widzi, że walka
   jest warta zebrania. `wlacz(true)` dogania więc linię dla trwającej walki.
2. **`otwarcie()` brało PIERWSZE dopasowanie w czacie.** Sondzie to nie
   szkodziło (żyje jedną walką na świeżej konsoli), dodatkowi szkodzi wprost:
   przy trzeciej walce w sesji wpisałoby do nagłówka materiału linię pierwszej.
   Teraz bierze ostatnie.
3. **Ostrzeżenie CLI mówiło „sonda była wklejona po rozpoczęciu walki"** także
   dla zrzutu z dodatku, choć `modulZrzutu` rozdzielał te powody poprawnie
   w nagłówku modułu. Poprawka rusza tę jedną gałąź w `tools/walka.ts`.

Cztery kolejne mutacje sprawdzone: pierwsze dopasowanie zamiast ostatniego
(zapala „linią otwierającą jest OSTATNIA"), zdjęte doganianie linii („tryb
włączony W TRAKCIE walki dogania"), zdjęty strażnik `otwarcia.has`
(„przełączanie w kółko nie nadpisuje") i zdjęty strażnik `walka === 0`
(zapala trzy testy naraz, w tym „nie wpisuje linii pod numer 0").

**Wniosek na przyszłość, bo jest ogólniejszy niż te trzy poprawki:** wszystkie
trzy siedzą w warstwie, której materiał budowany w kodzie NIE dotyka — czat
gry, numer walki w sesji, pochodzenie pliku. To jest ta sama luka, którą
`AGENTS.md` opisuje przy zniknięciu 25 prawdziwych walk, tylko o piętro wyżej:
tam brakowało kształtów zdarzeń, tu brakowało kształtów SESJI.

## Co zostaje otwarte

- **Zrzut z prawdziwej gry JEST, ale materiału nie przybyło.** Pierwszy plik
  (wyżej) przeszedł całą drogę bez ani jednego nieznanego klucza — narzędzie
  działa. Jego zawartość jest jednak podzbiorem walki, która w repo już stoi,
  więc **cztery pozycje `ROADMAP.md` zostają otwarte**: brakuje `heal_target`,
  walki turowej z `data.current`, `bandage`/`vamp_time` oraz bloku, uniku,
  absorpcji i zapowiedzi umiejętności. Otwarte zostaje też porównanie zrzutu
  z dodatku ze zrzutem SONDY z tej samej walki — dwie drogi wciąż nie były
  zestawione przeciw sobie na jednym starciu.
- **`otwarcie` czyta `document.body.innerText`** — jedyne sięgnięcie do DOM
  w `src/`. Wołane raz na walkę i tylko przy włączonym trybie, niosące metadaną
  o pochodzeniu, a nie zdarzenia; ale jest to wyłom w zdaniu „okno walki w DOM
  zeszło z drzewa" i ma być widoczne, a nie przemilczane.
- **Sonda `tools/walka-probe.js` zostaje** i nie ma zejść. Działa bez
  instalowania dodatku i jest jedyną drogą, gdy podejrzenie pada na sam dodatek
  — zrzut zebrany zepsutym kodem nie świadczy o niczym.
- **Okno opcji ma jedną pozycję i żadnej struktury na wzrost.** Druga i trzecia
  opcja zmieszczą się bez pracy, dziesiąta wymusi podział na sekcje albo
  zakładki. To jest cena wybranego wariantu, nie przeoczenie.
- **`stan().walk` liczy walki, które coś zapisały**, więc walka bez ani jednego
  wywołania z treścią nie pokazuje się w oknie. To jest zamierzone, ale znaczy,
  że licznik w oknie i numeracja `--walka` mogą się rozjechać co do wartości
  (numery bywają nieciągłe). Podgląd `--pokaz` wypisuje prawdziwe numery.

## Zmiany wpisu

- **2026-08-05** — powstał i został wdrożony w tej samej rundzie.
