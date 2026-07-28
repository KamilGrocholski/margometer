# UX — możliwe poprawki

Lista propozycji, nie spec. Spec zachowań (co jest, czego świadomie się NIE robi)
siedzi w [`ai/UX.md`](ai/UX.md). Tu zbieram, **co da się poprawić**, po zwrocie za
pracę. Podzielone na: **A. usterki widoczne dla użytkownika** (rzeczy dziś
błędne/mylące — zweryfikowane na bieżącym kodzie 2026‑07‑25, po commicie `2cabd6d`)
oraz **B. nowe wygody** (czego brakuje).

Legenda: 🔴 duży zwrot / mała robota · 🟡 warto · ⚪ kiedyś.
Koszt: S / M / L.

---

## 0. Skrót — kolejność prac

**Usterki A — WSZYSTKIE NAPRAWIONE (2026‑07‑26):**

| # | Usterka | Jak naprawione |
|---|---|---|
| A1 | Przeciąganie panelu ginie w walce, pozycja się NIE zapisuje | `<header>` i jego przyciski to trwałe węzły; `makeDraggable` wiązany RAZ |
| A2 | Udziały „%” w trybie „na turę” liczone względem sumy temp | mianownikiem zawsze surowe sumy — udział nie zmienia się z trybem |
| A3 | Kolory szarzeją po 8 postaciach na całą sesję | pula wymieniana ze SKŁADEM walki, stała przez wszystkie jej rerendery |
| A4 | Sufiks `/t` znaczy dwie różne rzeczy bez sygnału | dymek nazywa dzielnik: „Na turę własną” / „Na turę walki” |
| A5 | Pasek stron przy braku danych pokazuje 50/50 (jak remis) | przy sumie 0 pasek zostaje pusty |
| A6 | Długa lista potrafi wyjechać poza ekran | sufit `max-height` liczony od pozycji okna do dołu ekranu |

**Potem nowe wygody (B):**

| # | Poprawka | Koszt | |
|---|---|---|---|
| B1 | Kasowanie POJEDYNCZEGO nagrania w archiwum | S | 🔴 |
| B2 | Suwak odtwarzania skacze po TURACH, nie po liniach | S | 🔴 |
| B3 | Auto‑pauza odtwarzania przy wejściu w postać / najechaniu | S | 🔴 |
| B4 | Widoczny sygnał „trzymam postać” przy zmianie metryki | S | 🟡 |
| B5 | Podgląd TOP‑3 w dymku bez wchodzenia w postać | M | 🟡 |
| B6 | Ostrzeżenie, gdy nagrania wypychają najstarsze | S | 🟡 |
| B7 | Filtr / szukajka w archiwum (przeciwnik, wynik, dzień) | M | 🟡 |
| B8 | Klik w okruszek `‹ …` = powrót (dla myszy) | S | 🟡 |
| B9 | „Kopiuj nierozpoznane linie” przy ostrzeżeniu parsera | S | ⚪ |
| B10 | Eksport czytelny (Discord), nie tylko JSON | M | ⚪ |
| B11 | Onboarding: pierwsza walka mówi, co kliknąć | S | ⚪ |

---

## A. Usterki widoczne dla użytkownika (naprawione 2026‑07‑26)

Opisy zostają jako zapis TEGO, co było źle i dlaczego — przy kolejnej regresji
w tym samym miejscu to jest najkrótsza droga do zrozumienia, o co szło.

### A1 — Przeciąganie panelu ginie w walce, a pozycja się nie zapisuje 🔴 S — ✅ NAPRAWIONE
`src/overlay.ts` — `renderHeader` → `makeDraggable`
**Problem.** `render()` buduje świeży `<header>` przy KAŻDEJ zmianie logu, a
`makeDraggable` wiesza `pointermove`/`pointerup` na tym właśnie węźle. Gdy w
środku przeciągania dojdzie linia logu, nagłówek zostaje podmieniony — listenery
wiszą na odłączonym węźle, ruch zastyga, a `saveState` (siedzi tylko w
`pointerup`) **nigdy nie pada**. Efekt: w trakcie walki okna nie da się
przesunąć, a ustawiona pozycja nie przeżywa odświeżenia strony.
**Uwaga.** To DOKŁADNIE ta sama klasa błędu, którą commit `2cabd6d` naprawił dla
sterowania odtwarzaniem i wierszy (trwały węzeł przeżywa przebudowę). Nagłówka
ten refaktor nie objął — jest odbudowywany razem z „chrome”.
**Propozycja.** Uczynić `<header>` (albo sam uchwyt przeciągania) trwałym węzłem,
jak `panel`/`body`/`grip` — aktualizować w miejscu, `makeDraggable` wiązać RAZ.
Cała maszyneria już jest (patrz konstruktor `Overlay`). **Koszt S**, zwrot duży.

### A2 — Udziały „%” w trybie „na turę” są liczone względem sumy temp 🔴 S — ✅ NAPRAWIONE
`src/overlay.ts:1801` (`appendSection`)
**Problem.** `total = Σ this.value(actor)`, a `this.value` w trybie „na turę”
zwraca `obrażenia/tury`. Mianownikiem udziału staje się więc **Σ(temp)** —
wielkość bez sensu fizycznego, której panel nigdzie nie pokazuje. Postać z 10%
realnych obrażeń potrafi dostać w nawiasie WIĘKSZY procent niż ta z 21%.
`totalsRows`/`sidesRows` świadomie tego unikają — ranking nie.
**Propozycja.** Udział liczyć ZAWSZE względem surowych sum (jak w podsumowaniu
drużyny), niezależnie od trybu „na turę”. Wspólny dzielnik i tak się skraca, więc
to poprawka jednej linii denominatora. **Koszt S.**

### A3 — Kolory szarzeją po ośmiu postaciach na całą sesję 🔴 M — ✅ NAPRAWIONE
`src/overlay.ts:645` + `src/palette.ts`
**Problem.** `ColorAssignment` powstaje raz i **nigdy nie jest resetowana**
(`this.colors = new ColorAssignment()`), a `MAX_SERIES` to 8. Overlay żyje tyle,
co karta gry, więc pula wyczerpuje się po ośmiu unikalnych nazwach widzianych
KIEDYKOLWIEK — od trzeciej–czwartej walki nowe wiersze dostają `OTHER_COLOR`
(szary) i kolor przestaje odróżniać postacie. Mapa przypisań rośnie bez granicy.
**Napięcie projektowe.** Reset puli na starcie walki naprawia szarzenie, ale ta
sama postać zmienia wtedy kolor między walkami — a `ai/UX.md §5` mówi „kolor =
tożsamość”. To sprzeczność w obrębie jednej walki (chcemy stałości) kontra sesji
(pula za mała).
**Propozycja.** Zawężyć „stałość koloru” do bieżącej walki: seedować świeżą pulę
z aktualnego składu, ale zachować przypisania między RERENDERAMI tej samej walki
(klucz np. po sygnaturze walki). Kolor trzyma się przez walkę, a nie zlewa się
przez sesję. **Koszt M** (decyzja + drobna zmiana cyklu życia puli).

### A4 — Sufiks `/t` znaczy dwie różne rzeczy 🟡 S — ✅ NAPRAWIONE
`src/overlay.ts` — `turnsFor`
**Problem.** Zadane dzielą się przez tury WŁASNE, przyjęte przez tury WALKI
(świadomie — obrywa się w turach przeciwnika). Ale obie kolumny są podpisane
identycznie `/t`, więc przełączenie zakładki Zadane↔Otrzymane zmienia skalę
liczby o rząd wielkości bez żadnego sygnału w UI.
**Propozycja.** Rozróżnić podpis („/tw” własna vs „/tW” walki) albo w dymku dodać
jedno zdanie, co jest dzielnikiem. Minimalnie: dymek metryki mówi „na turę
własną” / „na turę walki”. **Koszt S.**

### A5 — Pasek stron przy braku danych pokazuje 50/50 🟡 S — ✅ NAPRAWIONE
`src/overlay.ts` — `sidesRows`
**Problem.** Przy sumie 0 pasek podziału dostaje `50%/50%`, więc „jeszcze nic się
nie wydarzyło” wygląda jak wyrównana walka.
**Propozycja.** Przy sumie 0 — pusty/neutralny pasek albo podpis „—”, nie 50/50.
**Koszt S.**

### A6 — Długa lista potrafi wyjechać poza ekran 🟡 S — ✅ NAPRAWIONE
`src/overlay.ts` — `renderRows`
**Problem.** Bez ustawionej ręcznie wysokości panel rośnie z treścią. 30 postaci
to ~700 px samej listy; przy panelu niżej w oknie dolne wiersze są nieklikalne.
Commit `2cabd6d` dał przewijanie korpusu, ale **tylko przy stałej wysokości**
(klasa `.panel-body.scrolls`) — w trybie auto lista nadal może zejść poza ekran.
**Propozycja.** Domyślny sufit wysokości korpusu (np. `max-height` względem
viewportu) z przewijaniem, niezależnie od tego, czy użytkownik ustawił rozmiar.
Wtedy `scrollbar-gutter` z A‑fixu i tak już działa. **Koszt S.**

---

## B. Nowe wygody

### B1 — Kasowanie pojedynczego nagrania 🔴 S `src/archive.ts`, `src/recorder.ts`
Jedyny sposób usunięcia czegokolwiek to „wyczyść” — kasuje WSZYSTKO. `Recorder`
ma prywatne `drop(id)`, ale nic go nie wystawia. → `Recorder.remove(id)` + „✕” na
wierszu archiwum, ze wzorcem „pierwszy klik pyta”. Maszyneria (`drop`/`evict`/
indeks) już jest.

### B2 — Suwak skacze po TURACH, nie po liniach 🔴 S `src/archive.ts`
Etykieta mówi `tura 14/31`, a `seek` przelicza ułamek na **linie**
(`Math.round(fraction * lines.length)`). Klik „w połowę” ląduje w połowie linii,
nie tur. Odtwarzać po granicach tur/akcji (jest `timeline`): `seek` trafia tam,
gdzie wskazuje etykieta, a każda klatka jest kompletna (parser nie widzi
niedomkniętego ciosu — domyka to nawet ostrzeżenie z `frameStats`).

### B3 — Auto‑pauza przy wejściu w postać / najechaniu 🔴 S `src/overlay.ts`, `src/archive.ts`
W środku odtwarzania dane przelatują pod kursorem co klatkę. Wejście w postać
(LPM) albo dłuższe najechanie niech automatycznie pauzuje `setPlaying(false)`;
PPM/wyjście wznawia. „Patrzę” i „gra” jako gest, który i tak wykonujesz.

### B4 — Widoczny sygnał „trzymam postać” 🟡 S `src/overlay.ts`
Wybór postaci przeżywa zmianę metryki, ale okruszek `‹ Nazwa` przy przełączeniu
się przebudowuje i miga. Uczynić go trwałym węzłem (ten sam chwyt co A1) —
nazwa nie mruga przy cyk‑cyk po metrykach. (Postulat 4.1 z `ai/UX.md`.)

### B5 — Podgląd TOP‑3 w dymku bez wejścia 🟡 M `src/overlay.ts`
Dziś dymek postaci pokazuje same sumy. Dokleić 3 najsilniejsze źródła aktywnej
metryki (`dealtBy`/`takenFrom`/`healedBy` — już policzone). 80% pytań („co go tak
boli?”) bez wchodzenia w postać. (Postulat 4.2 z `ai/UX.md`.)

### B6 — Ostrzeżenie przed cichą eksmisją 🟡 S `src/recorder.ts`, `src/overlay.ts`
Po przekroczeniu `BUDGET_CHARS` `evict()` kasuje najstarsze BEZ słowa. Pasek
nagrywania niech pokazuje zajętość jako ułamek budżetu i miga na żółto, gdy
zaczyna wypychać. `chars()`/`count()` już są.

### B7 — Filtr / szukajka w archiwum 🟡 M `src/archive.ts`
Lista rośnie do ~190 wierszy w oknie 320 px. Jedno pole filtrujące po składzie +
szybkie „tylko wygrane/przegrane”; opcjonalnie nagłówki dni.

### B8 — Klik w okruszek = powrót 🟡 S `src/overlay.ts`
Powrót to PPM (działa z całego panelu), ale mysz „chce” kliknąć widoczny
`‹ skład`. Niech `‹ …` reaguje na LPM tym samym `back()`. (Postulat 4.3.)

### B9 — „Kopiuj nierozpoznane linie” ⚪ S–M `src/overlay.ts`, `src/stats.ts`
Stopka mówi `⚠ N nierozpoznanych linii`, ale nie da się ich wyciągnąć, by zgłosić
lukę parsera. Parser trzyma `line`/`lineNo` w zdarzeniu `unknown` — dziś
`aggregate` liczy tylko `unknownLines`, więc trzeba przepuścić same treści do
`BattleStats`. Zamienia cichą regresję formatu w zgłoszenie na jeden klik.

### B10 — Eksport czytelny, nie tylko JSON ⚪ M `src/overlay.ts`
„Kopiuj statystyki” daje JSON. Druga opcja: zwięzły tekst („Kamil: 12.3k zadane
(58%) · TOP: Lodowy pocisk 5.2k”) do wklejenia na Discorda.

### B11 — Onboarding ⚪ S `src/overlay.ts`
Jednorazowy, znikający po pierwszym drążeniu podpis „LPM wchodzi, PPM wraca”.
Zapamiętany w `localStorage`.

---

## C. Czego (nadal) świadomie NIE robić
Za `ai/UX.md §6`: **bez skrótów klawiszowych** (overlay wisi nad grą łapiącą
klawisze), **bez trzeciego rzędu zakładek** (widok wybiera się drążeniem), **bez
modali/potwierdzeń** poza kasowaniem, **nie udawać danych, których log nie ma**
(leczący, sprawca trucizny w tłumie — patrz `ai/README.md` „Znane ograniczenia”).
