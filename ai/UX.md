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
Wyleczone   Ranking ─LPM→ CZYM WYLECZONO (umiej.)   ·  (bez szczebla postaci — patrz README)
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

### 4.1 Postać zostaje przy zmianie metryki ✅ — i trzeba to WIDAĆ 🎯
Wybór postaci przeżywa przełączenie Zadane↔Otrzymane↔Wyleczone. To najszybszy
sposób odpowiedzieć na „ten gość zadał dużo — a ile oberwał i ile się wyleczył?”:
klik w postać, potem tylko cyk-cyk po metrykach, bez wracania do rankingu. Dziś
działa, ale trzeba to wzmocnić wizualnie — okruszek z nazwą postaci ma zostać na
miejscu, a nie migać, żeby oko wiedziało, że kontekst się trzyma. 🎯

### 4.2 Podgląd bez commitu 🎯
Najechanie na wiersz postaci pokazuje w dymku jej TOP 3 źródła bez wchodzenia w
nią. 80% pytań („co go tak boli?”) da się odpowiedzieć samym najechaniem —
wejście zostaje na te 20%, gdy chcesz drążyć dalej. Dziś dymek pokazuje sumy
postaci; dołożyć mini-rozbicie. 🎯

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
  w `README.md`, „Na turę — zgłoszone jako podejrzane”. Do poprawy.
- **Puste stany mówią wprost.** „Brak rozbicia: leczenie.” zamiast pustki. ✅
- **Etykieta, która się nie mieści, żyje w dymku.** `Tancogniew · Zwykły atak`
  ucina się w 260 px — dymek pokazuje pełną, bo to ona niesie „kto i czym”. ✅
- **Licznik uczciwy.** „Użycia” to liczba z całej walki (linia „X wykonuje Y” nie
  dzieli się na cele); przy zejściu w cel widać ciosy na TEN cel. Nie mieszać
  tych dwóch tak, żeby czytelnik myślał, że to jedno. ✅

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
  w osobne kolumny. Poziom i profesji w wierszu nie ma — barwa paska mówi, kto
  jest czym, a pełne dane stoją w dymku. Kolumn nie da się podpisać (nagłówka
  nad listą nie ma i nie będzie), więc czwarta kolumna to już zgadywanka.
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

| Już jest ✅ | Do dołożenia 🎯 |
|---|---|
| LPM w głąb, PPM w tył, na każdym szczeblu | Dymek z TOP-3 rozbiciem (podgląd bez wejścia) |
| Postać zostaje przy zmianie metryki | Wyraźny sygnał, że kontekst postaci się trzyma |
| Dymek z sumami postaci | — |
| Klik w okruszek = powrót (dla myszy) | — |
| Okruszek „‹ skład / ‹ Nazwa” | — |
| Drążenie Zadane/Otrzymane + leczenie | — |
| Trwały wybór przez rerender, brak migotania | — |

Skróty klawiszowe **świadomie poza zakresem** (patrz §6) — cała nawigacja idzie
myszą. Kolejność prac wg zwrotu za gest: **podgląd TOP-3** (4.2) → **wyraźny
sygnał trzymania postaci** (4.1). To rzeczy, które najmocniej skracają drogę od
„chcę wiedzieć” do „wiem”.

⚠️ **Ten spec opisuje panel na żywo. W podglądzie z archiwum i w odtwarzaniu
część z tych ✅ dziś NIE działa** — dymek nie pokazuje się wcale, a zakładki
i okruszek gubią kliknięcia co klatkę. Zasada 3 („nie gub miejsca”) też ma tam
wyjątek: przewinięcie nagrania w tył zwija drążenie i nie przywraca go, gdy
klatka dogoni. Szczegóły: `UX-POPRAWKI.md A7`, `A8`, `A15`.
