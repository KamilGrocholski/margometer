# UX — możliwe poprawki

Lista propozycji, nie spec. Spec zachowań (co jest, czego świadomie się NIE robi)
siedzi w [`UX.md`](UX.md). Tu zbieram, **co da się poprawić**, po zwrocie za
pracę. Podzielone na: **A. usterki widoczne dla użytkownika** oraz **B. nowe
wygody** (czego brakuje).

Statusy zweryfikowane na bieżącym kodzie **2026‑07‑30**, `A14` domknięte **2026‑08‑01**, każdy odczytem
wskazanego miejsca. `A1`–`A6` naprawiono wcześniej; `A7`–`A15` wyszły
z pierwszego przeglądu **archiwum, odtwarzania i podglądu** — kodu, który
powstał po poprzednim przeglądzie i nie był nigdy sprawdzony — **i zostały
naprawione tego samego dnia**. Opisy zostają jako zapis TEGO, co było źle
i dlaczego: przy regresji w tym samym miejscu to najkrótsza droga do
zrozumienia, o co szło.

Legenda: 🔴 duży zwrot / mała robota · 🟡 warto · ⚪ kiedyś.
Koszt: S / M / L.

---

## 0. Skrót — kolejność prac

**Usterki A7–A15 — NAPRAWIONE 2026‑07‑30.** Pierwsze pięć to były funkcje,
które nie działały wcale.

| # | Usterka | Jak naprawione |
|---|---|---|
| A7 | Dymek martwy w podglądzie z archiwum | `showTip` czyta `this.shown` (to, co widać), nie walkę na żywo |
| A8 | W odtwarzaniu nie dało się kliknąć nic poza sterowaniem | delegacja po `data-action` — tożsamością jest akcja, nie węzeł |
| A9 | Dymek rysował się pod panelem i pod archiwum | jawny `z-index` na `.tip` |
| A10 | Okno dało się wyrzucić za ekran na zawsze | `clampToViewport` w `window.ts` + nasłuch `resize`; dotyczy panelu i archiwum |
| A11 | Wklejony tekst ginął przy przebudowie listy | pole wklejania to trwały węzeł; lista zachowuje przewinięcie |
| A12 | PPM zabijało menu w polu wklejania | handler odpuszcza, gdy zdarzenie idzie z pola edycyjnego |
| A13 | Brak widocznego focusu, 5‑pikselowy suwak | reguła `:focus-visible`; suwak łapie grubo, rysuje się cienko |
| A14 | Tekst na pasku nie przechodzi AA | ✅ **2026‑08‑01**: `.bar` na `opacity: .55` + nasadka `.bar-cap` w pełnej barwie; próg pilnuje test kontrastu |
| A15 | „na pewno?” nie wygasa, liczebniki, ucięcia | wygasa po 5 s; jedno `plural()`; ucięcia z ratunkiem |

**Naprawione (2026‑07‑26, wjechało w `3814a42`):**

| # | Usterka | Jak naprawione |
|---|---|---|
| A1 | Przeciąganie panelu ginie w walce, pozycja się NIE zapisuje | `<header>` i jego przyciski to trwałe węzły; `makeDraggable` wiązany RAZ |
| A2 | Udziały „%” w trybie „na turę” liczone względem sumy temp | mianownikiem zawsze surowe sumy — udział nie zmienia się z trybem |
| A3 | Kolory szarzeją po 8 postaciach na całą sesję | barwa idzie z ATRYBUTU (profesja / rodzaj obrażeń), więc puli nie ma czego wyczerpać |
| A4 | Sufiks `/t` znaczy dwie różne rzeczy bez sygnału | dymek nazywa dzielnik: „Na turę własną” / „Na turę walki” — ⚠️ **wiersz nadal nie mówi nic**, patrz `DECYZJE.md` „Na turę” |
| A5 | Pasek stron przy braku danych pokazuje 50/50 (jak remis) | przy sumie 0 pasek zostaje pusty |
| A6 | Długa lista potrafi wyjechać poza ekran | sufit `max-height` liczony od pozycji okna do dołu ekranu |

**Nowe wygody (B) — statusy przewierzone 2026‑07‑30:**

| # | Poprawka | Koszt | | Stan |
|---|---|---|---|---|
| B1 | ~~Kasowanie POJEDYNCZEGO nagrania w archiwum~~ | S | — | **✅ ZROBIONE** — „✕" w wierszu, pierwszy klik pyta |
| B2 | Suwak odtwarzania skacze po TURACH, nie po liniach | M | 🔴 | otwarte — **koszt urósł**: wymaga numeru linii w zdarzeniach parsera, patrz niżej |
| B3 | Auto‑pauza odtwarzania przy wejściu w postać / najechaniu | S | 🔴 | otwarte |
| B4 | Widoczny sygnał „trzymam postać” przy zmianie metryki | S | 🟡 | otwarte (`renderCrumb` buduje nowy węzeł co render) |
| B5 | Podgląd TOP‑3 w dymku bez wchodzenia w postać | M | 🟡 | otwarte (`tipContent`, `overlay.ts:2118`) |
| B6 | Ostrzeżenie, gdy nagrania wypychają najstarsze | S | 🟡 | otwarte (pasek pokazuje `N walk · M kB`, bez ułamka budżetu) |
| B7 | Filtr / szukajka w archiwum (przeciwnik, wynik, dzień) | M | 🟡 | otwarte (w `archive.ts` zero pól wejściowych) |
| B8 | ~~Klik w okruszek `‹ …` = powrót (dla myszy)~~ | S | — | **✅ ZROBIONE** (`overlay.ts:1654`) |
| B9 | „Kopiuj nierozpoznane linie” przy ostrzeżeniu parsera | S | ⚪ | otwarte (`BattleStats` niesie tylko `unknownLines`) |
| B10 | Eksport czytelny (Discord), nie tylko JSON | M | ⚪ | otwarte |
| B11 | Onboarding: pierwsza walka mówi, co kliknąć | S | ⚪ | częściowo — dymek ma `tip-hint` „LPM — rozbicie · PPM — powrót” (`overlay.ts:2133`), ale trzeba na coś najechać, żeby go zobaczyć |
| B12 | Reset ustawień nakładki | S | ⚪ | otwarte, ale **mniej pilne**: po `A10` okna nie da się już zgubić |

---

## A. Usterki z przeglądu 2026‑07‑30 (wszystkie naprawione)

Pierwszy przegląd **archiwum, odtwarzania i podglądu** — trzy funkcje weszły
w `22b63e6`/`a3d4594` i nie były dotąd sprawdzone. Stąd pięć rzeczy, które nie
działały wcale, a nie „niedogodności”.

Opisy zostają w czasie teraźniejszym, bo opisują STAN SPRZED naprawy — tak
czyta się je najłatwiej przy kolejnej regresji w tym samym miejscu.

### A7 — Dymek jest w podglądzie z archiwum całkowicie martwy 🔴 S — ✅ NAPRAWIONE
`src/overlay.ts:2236` (`showTip`)
**Problem.** `showTip` szuka postaci w `this.latest?.fight`, czyli w walce **na
żywo**, choć wiersze rysują się z `this.preview.stats` (`overlay.ts:857`), a
`professionOf` czyta już poprawne `this.shown` (`overlay.ts:971`). Najechanie na
dowolny wiersz wczytanego nagrania nie znajduje aktora → `content === null` →
`hideTip()`. Cała warstwa dymka (profesja, trzy metryki, utracone tury, efekty
zadane i otrzymane, podpowiedź „LPM/PPM”) jest **nieosiągalna dla nagrań**.
Gorszy wariant: gdy na żywo trwa walka z postacią o tej samej nazwie, dymek
pokazuje **jej** liczby przy wierszach z archiwum.
**Propozycja.** `this.shown` zamiast `this.latest?.fight` — pole istnieje
dokładnie po to. **Koszt S**, jedna linia.
**Dlaczego nie złapały tego testy.** W `tests/overlay.test.ts` nie ma ani jednego
`preview`/`replay`; `archive.test.ts` używa prawdziwego `Overlay`, ale nigdy nie
najeżdża na wiersz w podglądzie.

### A8 — W trakcie odtwarzania nie da się kliknąć nic poza sterowaniem 🔴 M — ✅ NAPRAWIONE
`src/overlay.ts:905` (`render`) kontra `:1133‑1178` (sterowanie odtwarzania)
**Problem.** `pushFrame` → `showPreview` → `rerender` → `body.replaceChildren`,
więc zakładki metryk (`:1529`), zakładki składu (`:1558`), okruszek (`:1649`),
przycisk „na żywo” (`:1112`) oraz „kopiuj logi”/„wyczyść” (`:1212`, `:1221`) są
**nowymi węzłami co klatkę**. Natywny `click` wymaga `pointerdown` i `pointerup`
na TYM SAMYM węźle — czyli dokładnie ta klasa błędu, którą kod opisuje
w `overlay.ts:804‑809` i naprawił dla wierszy (tożsamość po treści) oraz dla
sterowania (trwałe węzły). Reszta panelu tego nie dostała. Przy 4× (klatka co
62,5 ms, `archive.ts:41`) klik nie działa **nigdy**, przy 1× ~40 % prób.
Konsekwencja: **z podglądu nie da się wyjść bez wcześniejszego ⏸**.
**Propozycja.** Delegacja po `data-action` na shadow roocie — wzorzec już
działa dla wierszy, `dataset.action` jest już ustawiane na wszystkich tych
przyciskach. **Koszt M** (jedno miejsce, wiele przycisków).

### A9 — Dymek rysuje się POD panelem i pod oknem archiwum 🔴 S — ✅ NAPRAWIONE
`src/overlay.ts:780`, `:340`; `src/archive.ts:49`
**Problem.** `root.append(style, this.tip, this.panel)` — dymek jest wstawiany
PRZED panelem, a `.tip` ma `position: absolute` **bez `z-index`**, więc o
malowaniu decyduje kolejność w drzewie i panel przykrywa dymek. `.archive` ma
`z-index: 1`, więc okno archiwum przykrywa oba. Dwa osiągalne przypadki:
- domyślna geometria: panel `x=16 w=260` → dymek `left 284…544`, archiwum
  `x=300 w=300` → `300…600`. **Wystarczy otworzyć ▤**, żeby dymki zniknęły pod
  archiwum;
- panel rozciągnięty gripem (np. 900 px w oknie 1000 px) → `fitsRight` fałsz →
  dymek klamruje się na lewo, czyli **pod panel**, i najechanie wygląda na
  nieczynne.
**Propozycja.** Jawny `z-index` na `.tip` powyżej panelu i archiwum. **Koszt S.**

### A10 — Okno da się wyrzucić za ekran na zawsze 🔴 S — ✅ NAPRAWIONE
`src/window.ts:31`, `src/overlay.ts:2364`/`:2443`, `src/archive.ts:564`
**Problem.** `makeDraggable` woła `target.move(clientX - offsetX, …)` bez
przycięcia, `move` zapisuje surowe `x/y`, a `loadState` odtwarza to, co było
zapisane, też bez przycięcia. Nasłuchu `resize` **nie ma nigdzie** w `src/`;
jedynym strażnikiem geometrii jest `applyHeightCap`, a ten rusza tylko
`maxHeight`. Nagłówek jest jedynym uchwytem przeciągania, więc panel
przeciągnięty nad `y=0` albo za prawą krawędź jest **bezpowrotny**, a `saveState`
w `pointerup` utrwala to na F5. To samo dla okna archiwum — jego ✕ ucieka razem
z nim, a ▤ potrafi już tylko schować niewidoczne okno. Wychodzi też **bez
przeciągania**: panel zapisany na `x=1600`, otwarty potem na węższym ekranie.
**Nie ma przycisku resetu** — jedyne wyjście to czyszczenie `localStorage`.
**Propozycja.** `clamp` już istnieje (`overlay.ts:462`, używany dla dymka
i skalowania): przyciąć w `move`, przyciąć po `loadState`, dołożyć jeden nasłuch
`resize`. Wspólne miejsce na to opisuje `SOLID.md R5`. **Koszt S.**

### A11 — Wklejony tekst ginie przy każdej przebudowie listy 🔴 S — ✅ NAPRAWIONE
`src/archive.ts:422`, `:224`
**Problem.** `render()` robi `this.window.textContent = ""` i buduje
`renderPaste()` od zera, a `sync()` woła `render()` przy każdej zmianie zbioru
identyfikatorów nagrań — czyli **po każdej skończonej walce w trakcie
nagrywania**. Wpisany log przepada w środku pisania. Ten sam mechanizm zeruje
`scrollTop` listy: przy ~190 wierszach przewinięcie do starej walki wraca na
górę, gdy kończy się bieżąca. Kasują pole także `open()`, `play()` i samo
przełączenie „wklej”.
**Propozycja.** Pole wklejania (i lista) jako trwałe węzły aktualizowane
w miejscu — ten sam chwyt, którym `2cabd6d` uratował korpus panelu. **Koszt S.**

### A12 — PPM zabija menu kontekstowe także w polu wklejania 🟡 S — ✅ NAPRAWIONE
`src/overlay.ts:837`
**Problem.** Handler „PPM = powrót o szczebel” siedzi na shadow roocie, a
`Archive` rysuje się w **tym samym** roocie. Skutek: ▤ → „wklej” → PPM w polu
tekstowym = brak menu wklejania **i** ciche cofnięcie o szczebel w panelu.
Jedyne miejsce w całym dodatku, gdzie natywne menu jest naprawdę potrzebne, jest
jedynym, w którym jest wyłączone.
**Propozycja.** Nie przechwytywać PPM, gdy zdarzenie idzie z pola edycyjnego
(albo z poddrzewa archiwum). **Koszt S.**

### A13 — Brak widocznego focusu, mikroskopijny suwak 🟡 S — ✅ NAPRAWIONE
`src/overlay.ts:177`, `:263`, `:289`, `:223`; `src/archive.ts:66`
**Problem.** `button { all: unset }` zdejmuje obwódkę focusu przeglądarki, a
reguły `:focus-visible` nie ma w żadnym z dwóch arkuszy. Wszystkie przyciski są
osiągalne Tabem i **niewidoczne w focusie**. Do tego elementy interaktywne
zbudowane z `div`, bez `role`/`tabindex`: `.row` (drążenie), `.archive-row`
(wczytanie walki), `.crumb-back`, `.replay-track`. Suwak odtwarzania ma **5 px
wysokości**, reaguje tylko na klik (bez ciągnięcia) i jest jedyną drogą
przewijania nagrania.
**Uwaga.** To NIE jest wejście w skróty klawiszowe odrzucone w `UX.md §6` —
focus jest już osiągalny, tylko niewidoczny. Chodzi o obwódkę i wysokość
uchwytu, nie o mapę klawiszy.
**Propozycja.** Jedna reguła `:focus-visible`, `role="button"` +
`tabindex="0"` na klikalnych `div`‑ach, suwak grubszy z obsługą ciągnięcia.
**Koszt S.**

### A14 — Tekst na kolorowym pasku nie przechodzi AA 🟡 S — ✅ NAPRAWIONE
`src/overlay.ts` (`.row-text`, `.bar`) + `src/palette.ts`
**Problem.** `.row-text` to `#f2f2ef` nad `.bar` z `opacity: .85` na `#24242a`.
Policzony kontrast: żółty `#c98500` **3,50:1**, czerwony `#e66767` 3,60, akwa
`#199e70` 3,79, niebieski 4,06, pomarańcz 4,28, magenta 4,40 — **wszystko poniżej
4,5:1** wymaganego dla tekstu 12 px.
**Skąd luka.** Walidator opisany w `DECYZJE.md` „Kolory pasków” mierzył kontrast
**paska do tła**, nie **tekstu na pasku**, a kolory profesji są od tej walidacji
nowsze. To korekta metody, nie podważenie decyzji o odznace.
**Rozstrzygnięcie (2026‑08‑01).** Trzecia droga, żadna z dwóch rozważanych:
`.bar` schodzi z `opacity: .85` na `.55`, a pełne nasycenie zostaje w
3‑pikselowej nasadce `.bar-cap` na lewej krawędzi. Przy `.55` przechodzą
wszystkie barwy (najgorszy nadal żółty, ale **5,58:1**); przy `.7` żółty dawał
4,30 i próg nadal by nie przeszedł. Pasek dalej mówi „ile”, nasadka „czyje” —
a rozstęp ΔE z `palette.ts` liczony był dla pełnego nasycenia, więc barwa,
którą walidowano, nadal gdzieś na wierszu stoi.
**Czym to jest przypięte.** `palette.test.ts`, sekcja „kontrast tekstu na pasku
(A14)”: krycie czytane jest Z ARKUSZA panelu, nie ze stałej w teście, więc
podniesienie go „bo ładniej” nie przejdzie po cichu. Drugi test (kontrapunkt)
sprawdza, że przy `.85` próg NIE był zdawany — inaczej pierwszy przechodziłby
także wtedy, gdyby liczył co innego.
**Co zostaje osobno.** `AUDYT‑14` (odznaka literowa profesji, obiecana w
`palette.ts` i nieistniejąca) — dotyczy tego samego wiersza, ale to inna decyzja.

### A15 — Drobne, ta sama kategoria ⚪ S — ✅ NAPRAWIONE
- **„na pewno?” nie wygasa** (`overlay.ts:1224`). `confirmingClear` zeruje się
  tylko drugim klikiem albo przełączeniem ⏺. Klik „wyczyść”, zwinięcie panelu
  („—” pomija paski), rozwinięcie po godzinie i **jeden** klik kasuje całe
  archiwum bez pytania. Undo nie ma nigdzie.
- **Liczebniki tylko dla walk.** `fightWord` istnieje (`overlay.ts:56`), a obok
  stoi `2 tur` (`archive.ts:505`), `1 postaci · 1 tur` (`overlay.ts:1335`) i
  `tura 0/26` (`archive.ts:323`). Jedno `plural(n, formy)` załatwia wszystkie.
- **Ikony bez podpowiedzi.** ⬜ **ZOSTAJE.** `⧉ ⏺ ▤` mają `aria-label`, ale
  natywny `title` jest świadomie wyłączony, więc wzrokowo nie ma żadnej
  podpowiedzi. Własny dymek już istnieje i mógłby nieść ten hint bez natywnych
  tooltipów — ale to nowa treść w dymku, nie poprawka jednej linijki.
- **Ucięcia bez ratunku.** `.archive-name` ucina skład bez tooltipa (archiwum nie
  ma warstwy dymka wcale); `.rec-bar` z `nowrap` + ellipsis ucina komunikat „Brak
  miejsca w przeglądarce — nagrywanie wyłączone” przy `MIN_WIDTH = 200`, czyli
  **stan błędu znika dokładnie wtedy, gdy okno jest małe**; `.side-head` bez
  `min-width: 0` wypycha sumę sekcji poza przycięty panel przy długiej nazwie
  (`CZYM — <DŁUGA NAZWA>`).
- **Drążenie zwija się przy przewinięciu nagrania w tył.** ⬜ **ZOSTAJE.**
  `render()` czyści `focus`/`focusSource`, gdy nazwy nie ma w bieżącej klatce.
  Wejście w postać na 60 % nagrania i skok na 10 % wyrzuca do rankingu — i nie
  wraca, gdy klatka dogoni. Naprawa to rozróżnienie „postać zniknęła, bo inna
  walka" od „postać jeszcze nie zdążyła nic zrobić"; pierwsze ma zwijać, drugie
  nie. Wymaga zapamiętania wyboru osobno od stanu klatki.
- **Wyciek reguły `.row`** (`overlay.ts:263`) na `.archive-paste .row`
  (`archive.ts:544`): wiersz „podpowiedź + wczytaj” dostaje 20 px wysokości
  i ciemne tło pigułki, bo nadpisuje tylko `display/gap/align-items`.

---

## A‑archiwalne. Usterki naprawione (2026‑07‑26)

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
sama postać zmienia wtedy kolor między walkami — a `UX.md §5` mówi „kolor =
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

### B2 — Suwak skacze po TURACH, nie po liniach 🔴 M `src/archive.ts`
Etykieta mówi `tura 14/31`, a `seek` przelicza ułamek na **linie**
(`Math.round(fraction * lines.length)`). Klik „w połowę” ląduje w połowie linii,
nie tur.

**Koszt urósł po sprawdzeniu.** `timeline` niesie tury, ale NIE niesie numeru
linii, w której każda się zaczyna — a bez tego nie ma z czego zbudować mapy
„tura → linia”. Trzy drogi:
- policzyć granice tur w `archive.ts` po samych liniach → **odrzucone**: to
  druga implementacja logiki tur, dokładnie ta „druga prawda”, przed którą
  broni się cały potok (`SOLID.md §1`);
- parsować rosnące prefiksy przy starcie odtwarzania → O(n²), przy dłuższym
  nagraniu sekundy zamrożonej gry (pomiar: 2,78 ms na klatkę);
- **dołożyć numer linii do zdarzeń parsera** (dziś ma go tylko `unknown`)
  i przenieść go do `TurnSlice`. Jedno źródło prawdy, jedno przeliczenie przy
  starcie. To jest droga do zrobienia — ale to zmiana w `types.ts`, `parser.ts`
  i `stats.ts`, nie poprawka w archiwum.

### B3 — Auto‑pauza przy wejściu w postać / najechaniu 🔴 S `src/overlay.ts`, `src/archive.ts`
W środku odtwarzania dane przelatują pod kursorem co klatkę. Wejście w postać
(LPM) albo dłuższe najechanie niech automatycznie pauzuje `setPlaying(false)`;
PPM/wyjście wznawia. „Patrzę” i „gra” jako gest, który i tak wykonujesz.

### B4 — Widoczny sygnał „trzymam postać” 🟡 S `src/overlay.ts`
Wybór postaci przeżywa zmianę metryki, ale okruszek `‹ Nazwa` przy przełączeniu
się przebudowuje i miga. Uczynić go trwałym węzłem (ten sam chwyt co A1) —
nazwa nie mruga przy cyk‑cyk po metrykach. (Postulat 4.1 z `UX.md`.)

### B5 — Podgląd TOP‑3 w dymku bez wejścia 🟡 M `src/overlay.ts`
Dziś dymek postaci pokazuje same sumy. Dokleić 3 najsilniejsze źródła aktywnej
metryki (`dealtBy`/`takenFrom`/`healedBy` — już policzone). 80% pytań („co go tak
boli?”) bez wchodzenia w postać. (Postulat 4.2 z `UX.md`.)

### B6 — Ostrzeżenie przed cichą eksmisją 🟡 S `src/recorder.ts`, `src/overlay.ts`
Po przekroczeniu `BUDGET_CHARS` `evict()` kasuje najstarsze BEZ słowa. Pasek
nagrywania niech pokazuje zajętość jako ułamek budżetu i miga na żółto, gdy
zaczyna wypychać. `chars()`/`count()` już są.

### B7 — Filtr / szukajka w archiwum 🟡 M `src/archive.ts`
Lista rośnie do ~190 wierszy w oknie 320 px. Jedno pole filtrujące po składzie +
szybkie „tylko wygrane/przegrane”; opcjonalnie nagłówki dni.

### B8 — Klik w okruszek = powrót ✅ ZROBIONE `src/overlay.ts:1654`
Powrót to PPM (działa z całego panelu), ale mysz „chce” kliknąć widoczny
`‹ skład`. **Zrobione:** `renderCrumb` wiesza `click` → `back()` na `.crumb-back`,
a `.crumb-back:hover` podświetla go jako klikalny. Uwaga: to samo miejsce nadal
mruga przy zmianie metryki (patrz `B4`) — okruszek działa, ale nie jest trwałym
węzłem.

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
Zapamiętany w `localStorage`. **Częściowo jest**: dymek niesie `tip-hint`
„LPM — rozbicie · PPM — powrót” (`overlay.ts:2133`) — tylko trzeba najechać na
wiersz, żeby go zobaczyć, więc pierwszy raz nadal nie jest obsłużony.

### B12 — Reset ustawień nakładki 🟡 S `src/overlay.ts`
Dodatek trzyma cztery klucze w `localStorage` (`margometer.panel`,
`margometer.archive`, `margometer.rec.*`, `margometer.rec.on`) i **nie ma żadnej
drogi z UI, żeby wrócić do stanu domyślnego**. Dziś to głównie ratunek po `A10`
(okno za ekranem), ale przydaje się też przy zepsutym zapisie (`A15`, indeks
z `NaN`). Jedna pozycja „przywróć domyślne położenie i rozmiar” w nagłówku;
nagrań NIE kasuje.

---

## C. Czego (nadal) świadomie NIE robić
Za `UX.md §6`: **bez skrótów klawiszowych** (overlay wisi nad grą łapiącą
klawisze), **bez trzeciego rzędu zakładek** (widok wybiera się drążeniem), **bez
modali/potwierdzeń** poza kasowaniem, **nie udawać danych, których log nie ma**
(leczący, sprawca trucizny w tłumie — patrz `DECYZJE.md` „Znane ograniczenia”).
