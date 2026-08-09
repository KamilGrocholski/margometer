# UX — jak to ma się klikać

Cel: overlay czyta się **na jedno spojrzenie**, a wchodzi głębiej **na jedno
kliknięcie** — i tak samo szybko się wycofuje. Nikt nie patrzy w statystyki w
trakcie tury dłużej niż sekundę; wszystko poniżej służy tej sekundzie.

To jest spec zachowań, nie kodu. Gdzie coś już działa tak, jak trzeba, jest
znacznik ✅; gdzie to postulat — 🎯.

---

## 1. Zasady

1. **Ranking to dom.** Domyślny widok = ranking bieżącej metryki. Po każdej
   walce, po każdym rerenderze, po zamknięciu postaci — wracasz tu bez myślenia.
2. **Lewy wchodzi, prawy wychodzi.** Jeden gest w głąb, jeden gest w tył. Zawsze
   ten sam, na każdym szczeblu. Bez „przycisków wstecz” do celowania myszą.
3. **Nie gub miejsca.** Rerender w środku walki nie może wyrzucić cię z postaci
   ani z drążenia. Wybór przeżywa nową turę, nową listę, nowy dymek. ✅
4. **Najpierw najść, potem kliknąć.** Wszystko, co niesie liczbę, pokazuje
   szczegół pod kursorem, zanim się w to wejdzie. Klik jest zobowiązaniem;
   najechanie — podglądem.
5. **Jedna metryka rządzi listą.** W danej chwili widać ranking jednej rzeczy
   (zadane / otrzymane / leczone). Reszta jest o kliknięcie, nie na ekranie.
6. **Wielka litera niesie znaczenie.** Trzy rodzaje napisów, trzy konwencje:
   - **nazwa stanu** — wielką literą: `Zadane`, `Otrzymane`, `Leczenie`,
     `Wszyscy`, `My`, `Oni`. To rzeczy, w których się JEST;
   - **akcja** — małą literą: `na turę`, `kopiuj logi`, `wyczyść`, `wklej`,
     `usuń`, `na żywo`. To rzeczy, które się ROBI;
   - **komunikat** — wielką literą i całym zdaniem: `Brak danych po naszej
     stronie.`, `Nagrywam — czekam na walkę`.

   Reguła istnieje, bo jej brak dwa razy dał usterkę. Raz pasek nagrywania
   niósł w JEDNYM elemencie „nagrywam — czekam na walkę" obok „Brak miejsca
   w przeglądarce — nagrywanie wyłączone" — to wygląda jak literówka, nie jak
   zamysł. Drugi raz puste stany sklejały się z etykiety zakładki przez
   `toLowerCase()` i wychodziło „Brak danych: my." — etykiety są MIANOWNIKAMI
   i po dwukropku nie tworzą zdania. Stąd wniosek ogólniejszy: **komunikatu nie
   składa się z etykiety**. Polski wymaga wtedy przypadka, a `toLowerCase()`
   go nie zna. Zamknięty zestaw zdań jest tańszy niż reguła odmiany —
   `plural()` istnieje dla liczebników i tylko dla nich.

---

## 2. Mapa interakcji

Precyzyjnie, per powierzchnia. „Wiersz postaci” = wiersz z `data-actor`
(ranking). „Wiersz rozbicia” = wiersz w widoku postaci (cel / napastnik /
umiejętność).

| Gest | Na czym | Efekt |
|---|---|---|
| **LPM** | wiersz postaci (ranking) | wejście w postać → jej rozbicie ✅ |
| **LPM** | wiersz rozbicia = postać (KOMU / OD KOGO) | wejście o szczebel niżej → czym padło ✅ |
| **LPM** | wiersz w sekcji CZYM (ŁĄCZNIE) | wejście o szczebel niżej → komu ta umiejętność zadała ✅ |
| **LPM** | wiersz rozbicia = umiejętność wewnątrz celu, albo typ | nic (to liść, nie prowadzi głębiej) ✅ |
| **PPM** | gdziekolwiek w panelu | powrót o **jeden** szczebel (czym → cele → skład) ✅ |
| **najechanie** | dowolny wiersz z liczbą | dymek: udział %, na turę, ciosy/użycia ✅ |
| **zjechanie kursorem** | — | dymek znika ✅ |
| **LPM** | zakładka metryki (Zadane/Otrzymane/Wyleczone) | zmiana metryki, **postać zostaje** ✅ |
| **LPM** | zakładka składu (Wszyscy/My/Oni) | filtr rankingu ✅ |
| **LPM** | „na turę” | przełącznik średniej na turę ✅ |
| **przeciągnięcie** | nagłówek panelu | przesunięcie okna (zapamiętane) ✅ |
| **LPM** | — / □ w nagłówku | zwinięcie / rozwinięcie (zapamiętane) ✅ |

**Ścieżka powrotu jest widoczna.** Nad rozbiciem stoi okruszek `‹ skład` / `‹ Nazwa`
— mówi DOKĄD wróci PPM, nie samo „wstecz”. ✅ Przy dwóch szczeblach sama
strzałka nie wystarcza.

---

## 3. Drążenie — ten sam kształt dla trzech metryk

Każda metryka to ranking → postać → (czym). Kierunek środkowego szczebla zależy
od metryki, ale **gest jest identyczny**, więc nie trzeba się go uczyć trzy razy.

```
Zadane      Ranking ─LPM→ ┬ KOMU (cele)           ─LPM→ CZYM — cel
                          └ CZYM (ŁĄCZNIE)        ─LPM→ KOMU — umiejętność
Otrzymane   Ranking ─LPM→ ┬ OD KOGO (napastnicy)  ─LPM→ CZYM — napastnik
                          └ CZYM (ŁĄCZNIE)        ─LPM→ OD KOGO — umiejętność
Wyleczone   Ranking ─LPM→ CZYM WYLECZONO (umiej.)   ·  (bez szczebla postaci — patrz DECYZJE)
                                    ◂─PPM  ◂─PPM
```

Zadane i Otrzymane są lustrem: „na kim” kontra „od kogo”, ta sama mechanika. ✅

**Dwa wejścia w to samo drążenie.** Widok postaci pokazuje te same obrażenia
w dwóch przekrojach jednocześnie: po drugiej stronie ciosu (kto) i po
umiejętności (czym). To nie są dwa tryby do przełączania — to dwie listy pod
sobą, każda z klikalnymi wierszami. Wybór drogi jest gestem, nie stanem: nie ma
czego pilnować, a PPM zdejmuje szczebel identycznie z obu. ✅

Sekcja `CZYM (ŁĄCZNIE)` znika, gdy nie niesie informacji: przy jednej
umiejętności (byłaby powtórzeniem sumy stojącej wyżej) i na drugim szczeblu
(jesteśmy już w środku drążenia). Ta sama reguła co dla `TYP OBRAŻEŃ`. ✅
Leczenie ma jeden szczebel mniej, bo log nie niesie leczącego — i to jest OK,
byle **nie udawać**, że da się kliknąć głębiej (liść się nie podświetla).

---

## 4. Szybko i wygodnie — sedno

To jest część, o którą chodzi. „Szybko” = mało gestów; „wygodnie” = gesty są
przewidywalne i odwracalne.

### 4.1 Postać zostaje przy zmianie metryki ✅ — i widać to ✅
Wybór postaci przeżywa przełączenie Zadane↔Otrzymane↔Wyleczone. To najszybszy
sposób odpowiedzieć na „ten gość zadał dużo — a ile oberwał i ile się wyleczył?”:
klik w postać, potem tylko cyk-cyk po metrykach, bez wracania do rankingu. ✅ **Zrobione 2026‑08‑03**: okruszek z nazwą jest TRWAŁYM węzłem i nie wychodzi
z drzewa — chowa go `hidden`, a render odświeża same podpisy.

Przyczyna była konkretniejsza niż „miga”: `.crumb-back` ma regułę `:hover`,
a świeży węzeł nie jest pod kursorem, dopóki mysz się nie ruszy. Panel
przerysowuje się przy każdej linii logu, więc w walce podświetlenie gasło
i wracało kilka razy na sekundę — na elemencie, który ma dawać znać, że kontekst
się trzyma.

### 4.2 Podgląd bez commitu ✅
Najechanie na wiersz postaci pokazuje w dymku jej TOP 3 źródła bez wchodzenia w
nią. 80% pytań („co go tak boli?”) da się odpowiedzieć samym najechaniem —
wejście zostaje na te 20%, gdy chcesz drążyć dalej. ✅ **Zrobione 2026‑08‑03.** Sekcja stoi zaraz po sumach i nosi TEN SAM nagłówek,
co lista po wejściu (`KOMU` / `OD KOGO` / `OD CZEGO`) — dymek zapowiada dokładnie
ten widok, do którego prowadzi kliknięcie. Gdy pozycji jest więcej niż trzy,
dopisek mówi ile, bo bez niego „TOP 3” czyta się jak „to wszystko”.

Liczba idzie za trybem „na turę”, **udział nie** — to samo rozstrzygnięcie, co
przy `A2`: procent opisuje strukturę obrażeń, nie tempo.

### 4.3 Powrót jest tani i wybaczający ✅
PPM działa **z całego panelu**, nie tylko z wiersza — wraca się też z pustego
miejsca pod listą. ✅ Klik w okruszek `‹ …` robi to samo (dla myszy) i podświetla
się pod kursorem. ✅ Klik w pustą przestrzeń rankingu nic nie psuje. Wejście
w ślepy zaułek (postać zniknęła z nowej walki) samo cofa o szczebel, zamiast
pokazać pusty ekran. ✅

⚠️ Jeden wyjątek: PPM jest przechwytywane na całym shadow roocie, więc zabiera
też **natywne menu kontekstowe w polu wklejania logu** w archiwum — jedynym
miejscu, gdzie to menu jest naprawdę potrzebne (`UX-POPRAWKI.md A12`).

### 4.4 Zero migotania ✅
Kursor stoi w miejscu, a pod nim po rerenderze jest już inny węzeł — dymek
odtwarza się sam, żeby nie znikał w środku czytania. ✅ To fundament „wygody”:
liczby pod kursorem nie mogą uciekać.

---

## 5. Mikrodetale, które decydują o „wygodnie”

- **Kolor = tożsamość.** Postać ma ten sam kolor w rankingu i w rozbiciu, bo
  barwa idzie z ATRYBUTU (profesja), a nie z puli przydzielanej po kolei —
  zmiana metryki nie przemalowuje listy. ✅ Oko śledzi kolor, nie pozycję.
  ✅ Tekst wiersza stoi NA tym pasku, więc pasek ustępuje mu kryciem (`.55`),
  a pełna barwa zostaje w nasadce na krawędzi — próg 4,5:1 zdany dla wszystkich
  barw (`UX-POPRAWKI.md A14`, przypięte testem kontrastu).
- **Liczby w kolumnie.** `tabular-nums` wszędzie, żeby wartości się pionowały i
  dało się je porównać rzutem oka. ✅
- **Udział obok wartości.** Każdy wiersz mówi i ile, i jaki %. ✅ „Na turę”
  zamienia surową sumę na tempo — jeden przełącznik, ta sama lista. ⚠️ Nie tak
  czysto, jak to zdanie sugeruje: dzielnik jest inny dla zadanych (tury własne)
  niż dla otrzymanych (tury walki), więc wiersze raz sumują się do drużyny, a raz
  nie, a procent w nawiasie liczy się z surowych sum, nie z tempa. Rozpisane
  w `DECYZJE.md`, „Na turę — zgłoszone jako podejrzane”. Do poprawy.
- **Puste stany mówią wprost.** „Brak rozbicia: leczenie.” zamiast pustki. ✅
- **Etykieta, która się nie mieści, żyje w dymku.** `Tancogniew · Zwykły atak`
  ucina się w 260 px — dymek pokazuje pełną, bo to ona niesie „kto i czym”. ✅
- **Licznik uczciwy.** „Użycia” to liczba z całej walki (linia „X wykonuje Y” nie
  dzieli się na cele); przy zejściu w cel widać ciosy na TEN cel. Nie mieszać
  tych dwóch tak, żeby czytelnik myślał, że to jedno. ✅
- **Linia liczników: człon warunkowy tylko wtedy, gdy coś znaczy.** Dymek kończy
  się jednym wierszem `ciosy · kryt. · uniki · maks. cios · pochłonięte`, stopka
  widoku postaci — jego skróconą wersją z turami. ✅ Trzy człony dochodzą do nich
  warunkowo (`SOLID §4.22`, 2026‑08‑01):
  - `kryt. 7 (w tym 1 bardzo)` — gdy padły ciosy bardzo krytyczne;
  - `pochłonięte 55 923 (blok 10 568)` — gdy cokolwiek zablokowano;
  - `osłabione 2932` — gdy osłabienie zdjęło część tykających obrażeń.

  **Nawias należy do liczby, którą rozbija; osobny człon — do liczby niezależnej.**
  Blok jest częścią pochłoniętych i super‑kryt częścią krytów, więc oba siedzą
  w nawiasie: postawione obok jako osobne pozycje kazałyby dodać je do sumy, tak
  jak uniki częściowe przed `AUDYT‑40`. Osłabienie DoT‑a nie jest częścią
  niczego, co linia już pokazuje, więc stoi samo. Dlaczego akurat tak — w
  `DECYZJE.md`, „Blok, osłabienie i to, co pochłonięte”.

  Zero chowa człon, ale nie chowa licznika stałego: `kryt. 0` stoi zawsze, bo
  zero krytów jest informacją o postaci; `(w tym 0 bardzo)` nie stoi, bo nie jest.

- **Stopka: ostrzeżenie musi mówić, ILE STRACIŁEŚ, a nie ile razy coś nas
  zaskoczyło.** Trzy niezależne napisy, w tej kolejności:

  | napis | znak | kiedy |
  |---|---|---|
  | `N komunikatów odrzuconych — statystyki niepełne` | ⚠ | z tych komunikatów nie weszło NIC |
  | `N segmentów niezrozumianych w policzonych komunikatach` | ⚠ | strata CZĘŚCIOWA — reszta komunikatu jest w liczbach |
  | `N zastrzeżeń — liczby są` | ⓘ | protokół zaskoczył, ale **nic nie przepadło** |

  ⚠️ **DO 2026‑08‑07 BYŁ TU JEDEN NAPIS DLA WSZYSTKICH TRZECH** — `⚠ N
  nierozpoznanych linii — statystyki niepełne` — i to jest `AUDYT‑114`. Zmierzone:
  nieznany klucz dawał `⚠ 35` przy **100 % obrażeń nienaruszonych**, a wojownik
  spoza składu `⚠ 443` przy **0 % obrażeń**. Te same słowa, dwa rzędy wielkości
  różnicy w tym, co gracz naprawdę stracił.

  Trzy rzeczy w tym układzie są DECYZJĄ, nie układem:
  - **wiedzie strata całkowita**, bo tylko ona potrafi znaczyć „wszystko";
  - **segmenty nie dostają „statystyki niepełne"**, bo reszta komunikatu weszła
    do liczb, a opisanie straty częściowej tak samo jak całkowitej było połową
    tamtej usterki;
  - **zastrzeżenie idzie z `ⓘ`, nie z `⚠`** — alarm o odczycie, który się udał,
    uczy gracza ignorować alarmy;
  - **trzeci napis NIE nazywa jednostki** („zastrzeżeń", nie „komunikatów"), bo
    licznik pod nim zlewa oba zasięgi: obcięcie na drugim `=` to SEGMENT,
    niesparowane `-dmgX` to KOMUNIKAT. Napis brzmiał tu „N komunikatów
    policzonych mimo zastrzeżenia" i **kłamał dla połowy przypadków** — czyli
    runda rozdzielająca jednostki zostawiła fałszywą jednostkę w jedynym
    liczniku, którego nie rozdzieliła. Czwarte pole odrzucone: rozróżnienie nie
    ma czytelnika, bo w obu fixture'ach z gry licznik jest zerem, a napis
    milczący o zasięgu nie może o nim skłamać.

  ⚠️ **`N` w tabeli wyżej jest SKRÓTEM — odmienia się KAŻDE słowo zgodne
  z liczebnikiem, nie tylko rzeczownik.** Trzy progi polskiej odmiany:
  `1 segment niezrozumiany` · `2 segmenty niezrozumiane` ·
  `5 segmentów niezrozumianych`, i tak samo `komunikat odrzucony` /
  `komunikaty odrzucone` oraz `komunikat policzony` / `komunikaty policzone`.

  Nie jest to uwaga redakcyjna: pierwsza wersja `AUDYT‑114` deklinowała sam
  rzeczownik i wypuszczała **„1 segment niezrozumianych"**, bo przymiotnik stał
  w napisie na sztywno. Skasowany w tej samej rundzie `unknownWord` istniał
  dokładnie po to — czyli runda **usunęła strażnika i natychmiast wpadła
  w dziurę, której on pilnował**. Poprawione tego samego dnia; pilnuje tego dziś
  test po wszystkich trzech progach (`tests/overlay.test.ts`), bo przy jednym
  progu ta usterka jest niewidzialna.

  ⚠️ Brzmienie tych napisów **nie miało zapisu NIGDZIE poza kodem** do 2026‑08‑08.
  Ten akapit jest tym zapisem; zmiana słów w `overlay.ts` bez ruszenia go rozjedzie
  dokument z produktem po cichu — dokładnie jak `B9` w `UX-POPRAWKI.md`, które
  przez cztery dni opisywało pole o nazwie, której już nie było.

---

## 6. Czego świadomie NIE robić

- **Nie chować rankingu za klikiem.** Ranking to punkt zero, nie jeden z widoków
  do wybrania — nigdy nie wymaga wejścia.
- **Nie robić trzeciego rzędu zakładek na widoki wg-postaci/wg-umiejętności.**
  Widok wybiera się drążeniem (LPM/PPM), nie osobnym paskiem — pasek to stan do
  pilnowania, drążenie to gest do wykonania.
  ⚠️ Zakaz dotyczy **paska, nie widoku**. Rozbicie wg umiejętności istnieje
  (§3, sekcja `CZYM (ŁĄCZNIE)`) i jest zgodne z tą zasadą właśnie dlatego, że
  wchodzi się w nie klikiem w wiersz, a nie przełącznikiem. Rozważony i odrzucony
  wariant „przełącznik wg celu ⇄ wg umiejętności" padł na tym, że tworzy stan
  spoza stosu drążenia: PPM albo by go ignorował (łamiąc zasadę 2 z §1), albo
  musiałby go traktować jak szczebel — czyli i tak byłoby to drążenie.
- **Nie robić z rankingu tabeli.** Wiersz to numer, nazwa i JEDNA liczba
  wiodąca; udział i druga miara wchodzą do nawiasu przy tej liczbie, a nie
  w osobne kolumny. Poziomu w wierszu nie ma — pełne dane stoją w dymku.
  Kolumn nie da się podpisać (nagłówka nad listą nie ma i nie będzie), więc
  czwarta kolumna to już zgadywanka.
  ⚠️ **Odznaka profesji nie jest czwartą kolumną** (`AUDYT‑14`, 2026‑08‑01).
  Kolumna to coś, co wyrównuje się w pionie i niesie osobną daną; odznaka ma
  stałą szerokość i przylega do nazwy — rysuje ją `::before` na `.label`, więc
  technicznie JEST nazwą i razem z nią się przewija. Komórki wiersza są dalej
  trzy i pilnuje tego test.

  Musiała powstać, bo poprzednie brzmienie tej zasady („barwa paska mówi, kto
  jest czym") było fałszywe dla części odbiorców: sześciu barw profesji nie da
  się na tym tle zrobić wzajemnie rozłącznymi — sufit to cztery — więc przy
  daltonizmie kolor nie odpowiada na to pytanie. Odpowiada litera. To ten sam
  argument, który `palette.ts` niósł od początku w komentarzu, tyle że przez
  kilka miesięcy nie miał pokrycia w kodzie.
- **Wiersz, który nazywa POSTAĆ, niesie odznakę — na każdym szczeblu**
  (2026‑08‑02). Ranking składu, rozbicie `KOMU` / `OD KOGO`, lista celów
  umiejętności. Wiersz, którego etykieta postacią nie jest — umiejętność, rodzaj
  obrażeń, pozycja zbiorcza — odznaki NIE dostaje: nie ma czego nią powiedzieć,
  a litera przy nazwie umiejętności sugerowałaby, że ma.

  Reguła dopisana, bo gwarancja z akapitu wyżej obowiązywała **na jednym
  szczeblu z trzech**: odznakę miał tylko ranking, a rozbicie wymienia te same
  postacie, z tymi samymi powtarzającymi się barwami. O odznace i o barwie
  rozstrzyga w kodzie JEDEN predykat — inaczej dałoby się dojść do wiersza
  z barwą jednej profesji i literą drugiej. Rozumowanie całej rundy:
  [`specy/2026-08-02-jednolity-wyglad-wiersza.md`](specy/2026-08-02-jednolity-wyglad-wiersza.md).
- **Oba okna wyglądają jak jedno narzędzie.** Panel i archiwum biorą chrome,
  stany (`hover`, „wybrane") i kreski z tych samych tokenów w `src/style.ts`.
  Nie znaczy to, że mają pokazywać to samo: lista nagrań nie jest rankingiem
  i pasków nie dostaje — pasek zawsze niesie udział w jakiejś sumie, a wiersz
  archiwum jest nagraniem, więc nie ma czego być udziałem.
- **Nie udawać danych, których log nie ma** (leczący, sprawca trucizny w tłumie).
  Liść bez danych się nie podświetla i nie kusi kliknięciem. ✅ na KAŻDEJ liście
  — reguła pilnowała dotąd tylko sekcji `CZYM (ŁĄCZNIE)`, a lista główna
  przepuszczała klik w ślepy zaułek (`AUDYT.md AUDYT‑28`).
- **Ranking postaci wymienia postacie.** To, czego log nikomu nie przypisał, nie
  staje obok nich pod własną nazwą, tylko zbiera się w jednym wierszu
  `Bez sprawcy` na końcu listy — wizualnie odciętym, ale klikalnym, bo „czym”
  log powiedzieć umie, choć „kto” nie. ✅
- **Jedna rzecz ma jedną nazwę.** Przekrój `TYP OBRAŻEŃ` wymienia RODZINY
  w jednej gramatyce; log nazywa ten sam żywioł dwojako („ogień” z klasy CSS,
  „od ognia” z tykającego efektu) i to jest jego sprawa, nie użytkownika. ✅
- **Nie modalów, nie potwierdzeń.** Każdy gest jest odwracalny jednym PPM, więc
  nic nie wymaga „czy na pewno”.
- **Nie skróty klawiszowe.** Świadoma decyzja: szybkość ma iść z gestów myszy i
  trzymania kontekstu, nie z uczenia się mapy klawiszy. Overlay wisi nad grą,
  która sama łapie klawisze — kolizje i „tryb wpisywania” to więcej kłopotu niż
  zysku. Cała nawigacja musi być osiągalna myszą.
  ⚠️ **Poza zakresem są SKRÓTY, nie fokus** — to rozróżnienie było wcześniej
  zapisane jako „klawiatura poza zakresem” i przez to nieprawdziwe. Tab chodzi po
  przyciskach panelu, czy tego chcemy, czy nie; jedyne pytanie brzmi, czy widać,
  gdzie stoi. Widać: `button:focus-visible` rysuje obwódkę i to zostaje.
  Arkusz obiecywał przy tym fokus jeszcze na wierszach rankingu, okruszku
  i suwaku odtwarzania — trzy martwe reguły, bo `tabindex` nie ustawia nic w całym
  `src/`, a okruszek i suwak były `div`-ami. Rozstrzygnięcie: **okruszek to
  prawdziwy `<button>`** (jest elementem akcji, więc ma się tak nazywać —
  niezależnie od polityki klawiatury), a **wiersze i suwak zostają myszą**.
  Zrobienie wierszy fokusowalnymi dałoby przy walce grupowej dwadzieścia
  przystanków Taba nad grą, która sama łapie klawisze — czyli dokładnie to,
  przed czym broni się akapit wyżej.

---

## 7. Skrót dla wdrożenia

**Nic nie zostaje do dołożenia — oba postulaty zeszły 2026‑08‑03.**

| Już jest ✅ | Do dołożenia 🎯 |
|---|---|
| LPM w głąb, PPM w tył, na każdym szczeblu | — |
| Postać zostaje przy zmianie metryki — i widać to (trwały okruszek) | — |
| Dymek z sumami postaci **i TOP-3 rozbiciem** | — |
| Klik w okruszek = powrót (dla myszy) | — |
| Okruszek „‹ skład / ‹ Nazwa” | — |
| Drążenie Zadane/Otrzymane + leczenie | — |
| Trwały wybór przez rerender, brak migotania | — |

Skróty klawiszowe **świadomie poza zakresem** (patrz §6) — cała nawigacja idzie
myszą. Kolejność prac wg zwrotu za gest brzmiała: **podgląd TOP-3** (4.2) →
**wyraźny sygnał trzymania postaci** (4.1), i w tej kolejności zostały zrobione
2026‑08‑03. To rzeczy, które najmocniej skracały drogę od „chcę wiedzieć”
do „wiem”.

⚠️ **`UX.md` nie zawiera słowa „sesja” i to jest odtąd stan docelowy**, a nie
luka. `AUDYT‑6` wytykał ten brak jako dziurę w specu; suma sesji została
zamiast tego usunięta z kodu. Panel mówi o JEDNEJ walce.

⚠️ **Ten spec opisuje panel na żywo, a w podglądzie z archiwum bywały odstępstwa
— dwa z trzech już nie obowiązują** (sprostowane 2026‑08‑02). Stało tu, że
„dymek nie pokazuje się wcale, a zakładki i okruszek gubią kliknięcia co
klatkę": pierwsze naprawiło `A7` (`showTip` czyta `this.shown`, czyli to, co
widać), drugie `A8` (delegacja po `data-action`) — oba **2026‑07‑30**, czyli
zdanie było nieaktualne przez trzy dni dłużej niż prawdziwe.

Zostaje jeden wyjątek, nadal realny: przewinięcie nagrania w tył zwija drążenie
i nie przywraca go, gdy klatka dogoni — zasada 3 („nie gub miejsca") ma tam
lukę. Szczegóły: `UX-POPRAWKI.md A15`.
