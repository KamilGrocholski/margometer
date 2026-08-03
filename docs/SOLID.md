# SOLID — działanie programu i możliwe poprawki

Analiza **rdzenia**: jak tekst logu staje się statystykami — czytanie danych →
parsowanie → mapowanie → przerabianie → sumowanie. Dwie części:

- **§4 Otwarte usterki działania** — konkretne defekty parsowania/mapowania.
  §4.1–§4.10 bazują na przeglądzie w `DECYZJE.md` z 2026‑07‑19; **§4.11–§4.25
  pochodzą z przeglądu 2026‑07‑30** i obejmują nagrywanie, archiwum i
  odtwarzanie, czyli kod, który wcześniej nie był sprawdzony ani razu.
  **Stan na 2026‑08‑01:** zamknięte są §4.1–§4.8, §4.11, §4.13–§4.25.
  **Otwarte zostają trzy:** §4.9 (`procs` łykają zasoby — zmierzone, został
  jeden wiersz w dymku), §4.10 (reparse — świadomie) i §4.12 (przycięcie
  bufora — czeka na rozstrzygnięcie, czy okno walki ma sufit komunikatów).
  ⚠️ Ten akapit wymieniał wcześniej §4.23–§4.25 jako zamknięte, choć §4.23
  stało otwarte we własnej sekcji — ta sama choroba, co przy skrócie w §11:
  status żył w dwóch miejscach naraz.
- **§5–§9 Dług architektoniczny (SOLID)** — refaktory, które czynią całe KLASY
  tych usterek niemożliwymi, a nie łatanymi po fakcie.
- **§10 Testy** — czego zestaw nie widzi, i dlaczego to właśnie tam przeszły
  §4.11 i §4.12.

Zasada nadrzędna: **żaden refaktor nie zmienia granic** (`LogSource`,
`RosterSource`, `parse`, `aggregate`). `BattleStats` urosło o jedno pole
(`unknownElements`, §4.17) — to dołożenie, nie zmiana kształtu. Siatka
bezpieczeństwa to **650 testów** (0 pominiętych) — zielone przed i po każdym
kroku; `bunx tsc --noEmit` czysty; pokrycie **98,61 % linii**.
Liczby odświeżone 2026‑08‑01 po rundzie parsera (§4.18/§4.22); wcześniej tego
samego dnia stało tu „583 / 98,97 %", a przed tym „369 / 93,3 %" — czyli stan
sprzed dwóch rund. Ta liczba starzeje się co rundę i nie ma sensu jej ufać bez
przeliczenia; `bun test` mówi prawdę w cztery sekundy.

Legenda zwrotu: 🔴 duży / mała robota · 🟡 warto · ⚪ do przemyślenia.

---

## 1. Potok w jednym rzucie

```
DOM gry ──extractText──► tekst (+ znacznik żywiołu)
   src/source.ts             │
                             ▼
                        parse(text) ──► BattleEvent[]     (czysta f. tekst→zdarzenia)
                        src/parser.ts
                             │
        roster (z gry) ──────┤
        src/roster.ts        ▼
                        aggregate(events, roster) ──► BattleStats   (mapowanie/przeróbka)
                        src/stats.ts
                             │
        ┌────────────────────┼─────────────────────┐
        ▼                    ▼                     ▼
   Session.update       Recorder.capture       Overlay.render
   (sumowanie sesji)    (zapis SUROWCA)         (widok)
```

Punkt zwrotny: **nagrywamy surowy tekst, nie statystyki** — stare walki liczą się
nowym parserem (pomiar w `DECYZJE.md`: ~2,6 tys. znaków surowca vs ~4,5 tys.
`BattleStats` w JSON). Potok jest jednokierunkowy i idempotentny (`parse`/
`aggregate` czyste) — to fundament testowalności. Zostaje.

## 2. Co jest dobre (nie zepsuć refaktorem)

- **DIP na każdym brzegu:** `LogSource`, `RosterSource`, `Ticker`, wąskie
  podzbiory `Storage`, wstrzykiwany `clipboard`/`now`. Testy podstawiają atrapy.
- **LSP:** `Dom`/`Static` źródła, `Engine`/`Static` roster, `real`/`Manual`
  ticker — wymienne bez niespodzianek.
- **ISP przy widoku:** `RecorderControl`, `ArchiveControl`, `PreviewHost`,
  `ReplayView` — overlay dostaje tyle, ile rysuje.
- **Czystość rdzenia:** `parse`/`aggregate` bez DOM i czasu → testy na zrzutach.
- **Niezmienniki pilnowane:** `Σ dealtBy == damageDealt`, `Σ timeline == Σ zdarzeń`,
  `Σ damageDealt + DoT bez sprawcy == Σ damageTaken` — trzymają na całym korpusie
  (`DECYZJE.md` „Sprawdzone i odrzucone”). Refaktor musi je utrzymać.

## 3. Co już naprawił commit `2cabd6d` (kontekst)

Trwały szkielet okna + trwałe węzły sterowania odtwarzaniem + `pointerup`‑drążenie
usunęły: gubione klikanie podczas odtwarzania, migający pasek scrolla, mrugające
ostrzeżenie o nierozpoznanych liniach w `frameStats`. **Częściowo** złagodziły
„pełną przebudowę DOM przy każdej linii” (§4.10): korpus już nie powstaje od zera.
**Nie objęły** przeciągania nagłówka — to dopiero `3814a42` (`UX-POPRAWKI.md A1`).
**Reszty panelu nie objęły** — zakładki, okruszek i przyciski paska nagrywania
gubiły kliknięcia dokładnie tak, jak gubiły je wiersze. To dopiero **R6**,
zrobione 2026‑07‑30: delegacja po `data-action` obejmuje teraz cały panel,
więc klasa „węzeł przebudowany w środku gestu" jest zamknięta systemowo,
a nie po jednym przycisku.

---

## 4. Otwarte usterki działania (parsowanie / mapowanie)

Uszeregowane wg wpływu na liczby. „Utajone” = defekt jest, ale dziś nic go nie
czyta (ożyje przy rozwoju).

### 4.1 Obrażenia wypadają z osi tur, gdy walka zaczyna się od DoT‑u 🔴 [NAPRAWIONE 2026‑07‑26]
`stats.ts:452` — `addToTurn`: `const slice = timeline.at(-1); if (slice) slice.damage += amount;`
`dot`/`heal` nie otwierają tury, więc na buforze przyciętym do pierwszego tyknięcia
trucizny (nagłówek wyjechał — przewidziany przypadek) kwota **znika po cichu**:
zmierzone 2329 vs 2189 na osi (ubytek 140). Łamie niezmiennik `Σ timeline == Σ zdarzeń`.
**Fix:** DoT bez otwartej tury otwiera „turę tła” albo dokłada do najbliższej
przyszłej — decyzja semantyczna, ale kwota nie może przepadać. **S–M.**

### 4.2 `opponentOf` nie widzi składu z gry 🔴 [NAPRAWIONE 2026‑07‑26]
`stats.ts:432` — `roster.find(...)` czyta wyłącznie uczestników z `fight-start`,
choć `resolve`/`seats` korzystają już ze składu z `Engine.battle`. Gdy nagłówek
wyjechał z bufora, sprawca DoT‑u jest nieznany mimo jednoznacznego rostera z gry:
z nagłówkiem „DoT bez sprawcy = 0”, bez nagłówka = 280. **Fix:** liczyć stronę
celu z tego samego źródła co `seats`, nie z lokalnego `roster`. **S.**

### 4.3 `RE_MODIFIER` jest catch‑allem i wyłącza czujkę `unknown` 🔴 [NAPRAWIONE 2026‑07‑26]
`parser.ts:40` — `/^[+-]\s*(.*\p{L}.*)$/u` stoi przed resztą, więc DOWOLNA
niezrozumiana linia zaczynająca się od `+`/`-` ląduje w proc‑ach zamiast zostać
zgłoszona. Mechanizm z `types.ts`, który ma sygnalizować zmianę formatu, na tej
klasie linii nie działa. Wzmacnia to `parser.ts:442` (`if (abilityDamage && ability)`):
bez zapowiedzi umiejętności linia obrażeń jest po cichu pomijana —
`"zrobił krok" + "-507 obrażeń otrzymał(a) X"` → jedno `move`, 507 znika bez `unknown`.
**Fix:** zawęzić `RE_MODIFIER` (znane prefiksy) i/lub domknąć drążenie „ostatniej
niepasującej linii” do `unknown`; ta sama idea co tablica reguł z §6. **M.**

### 4.4 Walka przerwana skleja się z następną 🔴 [NAPRAWIONE 2026‑07‑26]
`session.ts:74` — `isDuplicate = previous?.length === 1 && previous[0].kind === "fight-start"`
nie odróżnia zdublowanego nagłówka od walki, która skończyła się na samym
nagłówku (ucieczka, przerwanie, bufor doczytany na granicy). `fight-start(Wilk) +
fight-start(Niedźwiedź) + atak` → **1 walka zamiast 2**, skład z pierwszej.
Ten sam błąd tkwi w `recorder.ts` (`splitLines`) — patrz §7 (DRY). **Fix:** dublem
jest tylko dwie linie `fight-start` bez ŻADNEGO zdarzenia między nimi; z treścią
pomiędzy to dwie walki. **S.**

### 4.5 Leczenie gubi procent życia 🟡 [NAPRAWIONE, test dołożony 2026‑07‑30]
`BattleEvent.heal` niesie już `targetHpPct` (`types.ts:99‑109`), a `stats.ts:763`
woła `resolve(event.target, event.targetHpPct, true)` z flagą `rising`, która
zdejmuje założenie „życie nie rośnie” dla leczenia.
Gałąź `rising` w `instanceResolver` weszła bez pokrycia — funkcja wdrożona
i wysłana bez ani jednego testu. Dołożone 2026‑07‑30: leczenie zdublowanej
nazwy z procentem życia, bez procentu i przy wyleczeniu ponad wszystkich
(„leczenie nie zakłada nowej instancji").

### 4.6 `maxHit` wlicza własne obrażenia umiejętności 🟡 [NAPRAWIONE 2026‑07‑26]
`stats.ts:536‑537` — `total` z `landed` liczone jest dla KAŻDEGO zdarzenia,
w tym `strike: false` (własne obrażenia umiejętności), a `types.ts` definiuje
`maxHit` jako „najsilniejszy pojedynczy **cios**”. W fixture'ach bez wpływu
(12 vs 1098), przy silniejszej Fuzji zmieni wynik. **Fix:** liczyć `maxHit` tylko
gdy `event.strike`. **S.**

### 4.7 `sourceHpPct: 0` jako zaślepka czytane jest jako śmierć ⚪ [NAPRAWIONE]
`parser.ts:525` wystawia `sourceHpPct: null` (typ poszerzony w `parser.ts:244`),
a `observeDeath` (`stats.ts:577‑578`) wychodzi przy `null`, więc mag przyjmujący
9 obrażeń własną Fuzją nie kończy już na liście poległych.

### 4.8 Tylko męskie formy czasownika ⚪ [NAPRAWIONE — nadal bez próbki z gry]
`parser.ts:41` ma `GENDER = (?:a|o|\(a\))?`, użyte w `RE_ATTACK` (`:42`),
`RE_TAKEN` (`:43‑45`), `RE_ABILITY_DAMAGE` (`:77‑79`), `RE_MOVE` (`:106`) i
w linii poddania (`:159`). **Ale:** korpus nadal ma wyłącznie właścicieli
mężczyzn, więc `GENDER` jest sprawdzany tylko na ręcznie pisanych stringach
w testach. Brakujący fixture — log właścicielki — patrz §10.

### 4.9 Drobne luki parsera ⚪ [ZAMKNIĘTE 2026‑08‑03]
- ✅ Regexy leczenia mają `\.?$` we wszystkich trzech kształtach
  (`parser.ts:89,93,99`), a `"X otrzymuje 15 punktów many."` łapie `RE_INFO`
  (`parser.ts:142`).
- ✅ `.replace(/ /g, " ")` naprawione — `parser.ts:185` zdejmuje znaczniki
  i ` `.
- ❌ **Separator tysięcy nadal otwarty, i zawodzi INACZEJ, niż tu stało** —
  patrz §4.19 (nie `applied > raw`, tylko cicho obcięta liczba).
- ✅ **`procs` przestały zbierać przyrosty zasobów — 2026‑08‑03.**
  `RE_OWN_RESOURCE` (`/^\d+ (?:energii|many)$/`) wyjmuje je w
  `classifyModifiers`. Kotwica `^\d` jest jedyną rzeczą odróżniającą je od
  `Zniszczono N energii`, które opisuje zabranie zasobu CELOWI i zostaje.
  Przeliczone: **36 → 35 etykiet, 2325 → 2236 wystąpień**, różnica dokładnie 89.

  ⚠️ Liczby w akapicie niżej pochodzą z 2026‑08‑01 i **nie są błędne, tylko
  starsze**: korpus urósł o zrzuty z sierpnia. To przypomnienie, że liczba
  w rejestrze jest datowana także wtedy, gdy daty przy niej nie ma.

  **Zmierzone 2026‑08‑01, po stronie, którą realnie widzi panel** (czyli po
  `procLabel` ze `stats.ts`, który zamienia cyfry na `N`): cały korpus daje
  **33 etykiety i 1364 wystąpienia**, z czego zasobowe to **`N energii` ×47,
  czyli 3,4 %**. Rozdrobnienia po kwocie NIE MA — `procLabel` je scala, więc
  „Niszczenie pancerza" stoi w dymku jako jeden wiersz ×244, nie jako
  dwadzieścia. Zostaje z tego dokładnie **jeden fałszywy wiersz** w sekcji
  „Efekty w ciosach": własny przyrost energii napastnika udający efekt sprzętu.
  Uwaga przy naprawie: `Zniszczono N energii` (×8) i `Zniszczono N many` (×3)
  to co innego — one opisują zabranie zasobu CELOWI i mają zostać.

### 4.10 Pełne przeparsowanie bufora przy każdej linii 🟡 [częściowo — perf]
`index.ts` — każda emisja parsuje CAŁY bufor. Log 1425 linii narastająco: ~12 s
łącznie, koszt emisji rośnie 6,6 → 13,2 ms. Do tego `showTip` woła
`getBoundingClientRect()` tuż po podmianie poddrzewa — dziś **warunkowo**, bo
tylko gdy kursor stoi na wierszu (`overlay.ts:953`), ale wtedy trzy razy
(`:2272`, `:2276`, `:2278`). Commit `2cabd6d` usunął przebudowę CAŁEGO panelu,
reparse został; potwierdzone ponownie 2026‑07‑30 (`session.ts:242`, świadomy
komentarz w `archive.ts:331`). Emisje są przy tym sklejane do jednego mikrotaska
(`source.ts:150‑154`).
**Rekomendacja bez zmian:** dla realnych walk (≤ kilkaset linii) nieistotne —
**nie optymalizować na zapas**. Reparse to cena idempotencji, która jest
wartością. Inaczej niż §4.24 i §4.25, gdzie ta sama praca jest robiona **dwa
razy** albo dla widoku, którego nie ma — tam warto.

---

## 4bis. Nowe usterki (przegląd 2026‑07‑30)

Pierwszy przegląd `recorder.ts` i `archive.ts` oraz sumowania sesji. Wszystko
poniżej odtworzone uruchomieniem, nie z lektury.

### 4.11 `dealtToBy` wypadło z `mergeStats` I z `copyActor` 🔴 [NAPRAWIONE 2026‑07‑30]
`session.ts:52‑66` (lista tablic w `copyActor`) i `session.ts:131‑157` (lista pól
w merge'u). `takenFromBy` jest scalane w `:150`; jego lustro `dealtToBy` — dodane
później (`stats.ts:849`) — **nie występuje w `session.ts` ani razu**.

Skutek: w `Session.total()` rozbicie „komu zadał” zastyga na wartości z
**pierwszej** walki, w której postać się pojawiła, podczas gdy
`damageDealt`/`dealtBy` sumują się poprawnie. Przelot „ta sama walka dwa razy”
po wszystkich 15 fixture'ach: **46 rozjazdów**, np.

```
SESJA …lowca-tropiciel-vs-regulus-grupowa | Regulus Mętnooki | dealtToBy 39352 != damageDealt 78704
SESJA …draugr-zastepowy-grupowa           | Draugr Zastępowy | dealtToBy 61178 != damageDealt 122356
```

Widać to **dziś**: `statsJson` (`overlay.ts:1250‑1260`) wkłada `session` żywcem
do schowka, więc przycisk kopiowania eksportuje błędne liczby. Zatruje też
zakładkę Sesji w dniu, w którym powstanie — `overlay.ts:877` i `:1769` czytają
`dealtToBy`. Druga połowa tego samego błędu: `{...actor}` kopiuje **wskaźnik**,
więc `total()` i bieżąca walka współdzielą te obiekty `AttackerBreakdown` —
dokładnie to, czemu `copyActor` miał zapobiegać.

To jest **żywy dowód na R3**: test‑strażnik (`overlay.test.ts:374`, „suma sesji
obejmuje KAŻDY licznik”) wymienia 5 skalarów i 2 pola `ProcCount` z palca, więc
strukturalnie nie może tego złapać. **Fix:** dopisać pole w dwóch miejscach —
i zrobić R3, żeby to było ostatni raz. **S** (łatka) / **M** (R3).

### 4.12 Przycięcie logu w trakcie walki OBNIŻA liczby 🔴 [otwarte — połowa zamknięta 2026‑08‑03]

⚠️ **Ten wpis wskazywał do 2026‑08‑03 na kod, którego już nie ma.** Odsyłacze do
`session.ts:222‑228` (`continues()`) i `:268/276` (podmiana statystyk zamkniętej
walki) opisywały maszynerię archiwizowania walk do sumy sesji — a suma zeszła
z drzewa razem z nią (`AUDYT‑6`). Zniknęła więc **gałąź „ogon bez nagłówka to
kontynuacja"**, czyli dokładnie ta druga możliwość, którą wpis wymieniał: „albo
przycinanie jest realne, albo `continues()` plus `merge` to martwa złożoność".
Po stronie sesji była martwa i została usunięta.

**Ale sam objaw ZOSTAJE i to jest sprostowanie do planu tamtej rundy**, nie do
wpisu. Zakładałem, że `§4.12` zamknie się przy okazji; przeliczone po zmianie na
`2026-07-18_lowca-vs-druzyna` (suma zadanych):

```
pełny bufor   : 2986
po przycięciu : 1449
ogon 20 linii : 1143
```

`current()` bierze ostatnią walkę przeliczoną z bufora, więc krótszy bufor to
niższe liczby — tak samo jak przedtem, tyle że bez wysokiej wody po stronie
sumy, bo sumy nie ma. Pierwotny pomiar (`current= 46620 → 26569 → 6900`)
pochodził sprzed tamtej zmiany i dotyczył innego, większego zrzutu.

**Co zostaje do rozstrzygnięcia:** jedno pytanie, i jest ono pytaniem o FAKT.
Poniższe zapisy pochodzą sprzed 2026‑08‑03 i dotyczą już wyłącznie nagrywarki
(`recorder.ts` ma własne `merge`) oraz samego pytania o sufit bufora.

Licznik obrażeń, któremu sumy maleją. `recorder.ts` (`merge`) rozwiązuje
dokładnie ten problem dla nagrań — panel nie, choć nagrywarka trzyma
zakumulowany tekst jedną linię obok (`index.ts`).

**Ale przesłanki nie potwierdza ŻADEN fixture.** Największy zrzut DOM
(`…druzyna-vs-draugr-zwyciestwo/log.html`, 742 wyciągnięte linie) nadal zawiera
linię otwierającą — `extractText` daje 742 linie wobec 743 w `raw.txt`, a jedyna
różnica to zdublowany nagłówek. Czyli albo przycinanie jest realne (i licznik
zaniża), albo nie jest (i wtedy gałąź „bez nagłówka” w `continues()` plus całe
`merge` to martwa złożoność). **Do rozstrzygnięcia jednym zrzutem z długiej
walki — to decyzja, nie łatka.**

**Pomiar 2026‑07‑31 — teza NADAL niepotwierdzona, przy prawie dwukrotnie
większym zrzucie.** `2026-07-31_druzyna-vs-hildur-zwyciestwo/log.html` to **584
węzły `.battle-msg` i 1373 wyciągnięte linie** (poprzedni rekord: 371 i 742).
Linia otwierająca **jest na miejscu** — pierwszą linią z `extractText` jest
`Rozpoczęła się walka pomiędzy wf regulus psk (90t), …`.

Co to zmienia: „nie mamy dość długiej walki” przestaje być wytłumaczeniem. Przy
1373 liniach gra nadal nie przycina, więc **ciężar dowodu się odwrócił** — to
gałąź „bez nagłówka” w `continues()` i całe `merge` w nagrywarce mają teraz
udowodnić, że nie są martwe, a nie odwrotnie. Do rozstrzygnięcia zostaje jedno
pytanie i jest ono pytaniem o FAKT, nie o gust: **czy okno walki w ogóle ma sufit
liczby komunikatów.** Jeśli ma, potrzebny jest zrzut zza niego i panel naprawdę
zaniża; jeśli nie ma — `merge` w nagrywarce idzie do usunięcia jako ostatnia
konstrukcja broniąca przed czymś, czego nie ma. Sposób sprawdzenia jest tani i nie wymaga
kolejnej walki: przeczytać, czy klient przycina `.scroll-pane` (obserwacja
`tools/engine-probe.js` na żywym oknie), zamiast czekać na jeszcze dłuższy log.

Fakt na marginesie, warto zapisać: zdublowana linia `Rozpoczęła się walka`
występuje **tylko w `raw.txt`** (wyjście „Kopiuj logi”), nie w DOM. Oba
mechanizmy odsiewania dubla (`splitFights` w `session.ts`, `recorder.ts`)
obsługują więc wyłącznie drogę wklejonego tekstu.

### 4.13 F5 w trakcie walki nagrywa ją drugi raz 🟡 [NAPRAWIONE 2026‑07‑30]
`recorder.ts:141`, `:154‑156`, `:227‑244` — `on` przeżywa odświeżenie
(`FLAG_KEY`), ale `active` żyje tylko w pamięci i **nie jest zasiewane
z indeksu**, więc pierwsze `capture()` po reloadzie nie ma z czym dopasować
(`continues`/`merge` nie dostają szansy) i zakłada nowy `id`.

```
po pierwszym zapisie: [[1, 64]]
nagrywanie przeżyło reload: true
po reloadzie:         [[1, 64], [2, 72]]   count: 2
```

Nagranie 1 jest **prefiksem** nagrania 2. Widać jako dwa wiersze archiwum dla
jednej walki (krótszy kłamie), podwójne zużycie budżetu i podwójną walkę
w `dump()`. **Fix:** zasiać `active` z najnowszego wpisu indeksu + jego tekstu
i pozwolić `continues`/`merge` zrobić swoje. **S.**

### 4.14 Nagrywarka rozcina jedną walkę na dwie 🟡 [NAPRAWIONE 2026‑07‑30]
`recorder.ts:103‑107` wymaga dokładnego prefiksu **linia po linii**, a gra trzyma
cały blok ataku w JEDNYM `div.battle-msg.attack` — tekst „uderzył z siłą” i jego
`<b class="dmg">` liczby stoją w tej samej linii (widać w
`…draugr-zastepowy-grupowa/log.html`) — a `DomLogSource` obserwuje
`characterData` i pakuje emisje po mikrotasku (`source.ts:151‑155`). Dwie
mutacje tej samej linii w różnych taskach → ostatnia linia poprzedniej emisji
jest **prefiksem** nowej → `previous.every(...)` fałsz → nowy `id`.

```
po emisji 1: count= 1 [1]
po emisji 2: count= 2 [{id:1,chars:92},{id:2,chars:107}]   ← ta sama walka, dwa nagrania
```

Sesja tę samą emisję przeżywa (porównuje liczbę zdarzeń + sygnaturę). **Fix
mały:** użyć porównania „najdłuższy wspólny ogon” z `merge()` zamiast twardego
prefiksu. To ten sam dryf session↔recorder, o którym mówi §7 — **§4.14 jest nim
w akcji**. **S.**

### 4.15 Indeks nagrań sprawdzany tylko na najwyższym poziomie 🟡 [NAPRAWIONE 2026‑07‑30]
`recorder.ts:318‑332` — `Array.isArray(parsed.fights)` jest sprawdzane, kształt
**elementów** nie. Pole `v` jest przy tym **wymuszane na 1**, nie weryfikowane,
więc przyszły `v: 2` zostanie przeczytany jako v1. Przy
`{"v":1,"next":2,"fights":[{"id":1,"title":"x"}]}`:

```
count: 1  chars: NaN  kB: NaN
whenLabel(undefined): "NaN.NaN NaN:NaN"
```

Najgroźniejsze nie jest `NaN` w pasku (`overlay.ts:1200`) ani w wierszu
(`archive.ts:503`), a to, że `evict()` ma warunek `while (this.chars() >
this.budget)` → `NaN > n` = false → **eksmisja przestaje działać i limit budżetu
cicho znika**, czyli pada jedyne zabezpieczenie magazynu, który dzielimy z grą.

Ta sama klasa w `Overlay.loadState` (`overlay.ts:2443`) i `Archive.loadState`
(`archive.ts:564`): zero walidacji pól, więc `{"collapsed":"nope"}` zwija panel,
a `{"width":null}` daje `style.width = "nullpx"`. **Fix:** walidacja kształtu
w jednym miejscu — patrz R5. **S.**

### 4.16 Ścieżki błędu quoty psują stan w pamięci 🟡 [NAPRAWIONE 2026‑07‑30]
`recorder.ts:258‑316`:
- `save()` dopisuje wpis do indeksu **przed** `write()`; nieudany zapis tekstu
  zostawia wpis w `this.index.fights`, a `read()` zwraca `null` → widmowy wiersz,
  zawyżone `count()`/`chars()` do przeładowania;
- w `write()` wykluczenie `KEY_PREFIX + fight.id !== key` nie trafia nigdy, gdy
  `key === INDEX_KEY`, więc awaria zapisu indeksu może skasować **właśnie
  nagrywaną** walkę;
- `drop()` podmienia `this.active` (`:287`), gdy `capture()` jest w środku
  `for…of` po starej tablicy (`:248`) — pętla oznacza `fight.saved` na nagraniu,
  którego już nie ma ani w indeksie, ani w magazynie;
- `clear()` (`:213‑218`) kończy się `write(INDEX_KEY, …)`; jeśli to rzuci, a nie
  ma już czego skasować, dostajemy `failed = true; on = false` — czyli
  **czyszczenie wyłącza nagrywanie**.

### 4.17 Nieznana klasa `dmgX` cicho staje się „bez żywiołu” 🟡 [NAPRAWIONE 2026‑07‑30]
`parser.ts:4‑17` + `:204` — `(m[2] ? ELEMENTS[m[2]] : null) ?? null`. Sześć liter
jest znanych; cokolwiek innego ląduje w tym samym kubełku co „w ogóle nie było
DOM”, `unknownLines` zostaje 0, `typeByLabel` puste, pasek dostaje kolor
neutralny. **Nie hipotetyczne** — własne meta fixture'u notuje żywą,
niezmapowaną klasę: „klasa `dmgo` (druga broń tancerza) — BEZ mapowania na
żywioł”. Z `dmgz`:

```
dealtByType: [{"label":"bez żywiołu","amount":80,"hits":1}]  typeByLabel: []  unknownLines: 0
```

Kontrakt parsera z `types.ts:137‑142` mówi „nieznany kształt musi być głośny” —
to jedyna klasa zmiany formatu, która ma od niego wyjątek. **Fix:** licznik
`unknownElements` w `BattleStats`. **S.**

### 4.18 Modyfikator z `(N%)` rozbija cały blok ataku na trzy `unknown` 🟡 [NAPRAWIONE 2026‑08‑01]
`parser.ts:62` (`RE_CARRIES_HP`) + `:70`. Strażnik, który zamknął dawny
catch‑all (§4.3), odrzuca jako modyfikator **każdą** linię z procentem
w nawiasie:

```
+Wampiryzm (10%)  →  unknown ×3 (cios, modyfikator, linia obrażeń), 80 obrażeń przepada
```

Dziś bezpieczne — w całym korpusie nawiasy niosą wyłącznie liczby
(`+Zranienie (182)`), a procenty stoją gołe (`+Zmiażdżenie 25%`, `-Krytyczna
osłona, osłabienie obrażeń o 25%`). Ale sprzężenie jest niewidoczne i jeden nowy
format proca kosztuje trzy linie zamiast jednej. **Fix:** węższa reguła — HP%
należy do wzorca postaci na POCZĄTKU linii, nie do dowolnego nawiasu.
Żaden test nie pokrywa modyfikatora z procentem w nawiasie. **S.**

**Zrobione.** Rozróżnieniem została **spacja przed nawiasem**, a nie pozycja
w linii — bo pozycja by nie wystarczyła: `-507 obrażeń otrzymał(a) X(75%)` niesie
HP na KOŃCU, nie na początku, a to jest właśnie ta linia, przed którą strażnik
powstał. Przelot po korpusie: **2794 linie** niosą `(N%)` i **wszystkie 2794**
mają nawias przyklejony do nazwy; ani jedna nie ma przed nim spacji. Stąd
`RE_CARRIES_HP = /\S\(\d+(?:[.,]\d+)?%\)/`. Zmiana klasyfikacji: zero linii
korpusu, `unknown` jak było 0. Test (`parser.test.ts`, „proc z procentem
w nawiasie nie rozbija bloku ataku") stoi na formacie HIPOTETYCZNYM i mówi to
wprost — nie twierdzi, że gra tak pisze, tylko że strażnik nie zabierze ze sobą
całej klasy modyfikatorów w dniu, w którym napisze.

### 4.19 Separator tysięcy zawodzi CICHO 🟡 [NAPRAWIONE 2026‑07‑30]
`parser.ts:20`/`:200`. Zapisany dotąd tryb awarii (`applied > raw`) jest zły.
Faktyczny:

```
"+10 000" / "-8 000"  →  hits: [{raw:10, applied:8}, {raw:0, applied:0}]
```

Czyli 10 zamiast 10000, widmowe drugie trafienie i **zero `unknown`** — a oba
testy kontraktowe przechodzą (`8 ≤ 10` dla `parser.test.ts:31`; brak uniku dla
`:38`). **Fix:** reguła „liczba wartości raw == liczba applied, żadne trafienie
nie jest całkowicie zerowe” robi tę awarię głośną. **S.**

### 4.20 `clean()` zjada literę następnego słowa ⚪ [NAPRAWIONE 2026‑07‑30]
`parser.ts:19` — `RE_ELEMENT` bierze `MARKER([a-z]+)`, choć `source.ts:65` pisze
dokładnie **jeden** znak. Bez spacji między liczbą a następnym słowem
(`"-80⟨M⟩dobrażeń"`) zjada literę → `unknown`. Głośne, więc drobne; `[a-z]`
(jeden znak) albo znacznik domykający kasuje klasę.

### 4.21 `opponentOf` bierze pierwszy wpis rostera o danej nazwie ⚪ [NAPRAWIONE 2026‑07‑30]
`stats.ts:524` — `roster.find(p => p.name === name)`. Gdy ta sama nazwa stoi po
obu stronach, strona bierze się z tego, który wpis jest pierwszy, więc DoT może
zostać przypisany **sojusznikowi**. Guard: zwracać `null`, gdy nazwa występuje
po obu stronach.

⚠️ Ta sama usterka siedziała **drugi raz** obok, w `seats`, i przeżyła tę
naprawę o dwa dni — patrz `AUDYT‑39` (zamknięte 2026‑08‑01). Naprawiono wtedy
jedno wywołanie, nie zasadę. Wniosek na przyszłość: znajdując „pierwszy pasujący
wpis składu”, sprawdź WSZYSTKIE miejsca, które pytają skład o nazwę.

### 4.22 Cztery pola parsowane i nigdy nieczytane ⚪ [ROZSTRZYGNIĘTE 2026‑08‑01]
`superCrit` (tylko `types.ts:46` + parser), `attack.blocked` (nie ma go ani
w `stats.ts`, ani w `overlay.ts`), `dot.weakenedPct` (parser/typy), `experience`
(ignorowany `case` w `stats.ts:796`). Czyli „Cios bardzo krytyczny”,
„Zablokowanie 717 obrażeń”, osłabienie DoT‑u i linie XP są parsowane, typowane
i **przetestowane** — a potem wyrzucane. To osobna kategoria niż martwy kod z §9:
tu utrzymanie ma już testy w zestawie. Pokazać albo usunąć — ale zdecydować.

**Zmierzone 2026‑07‑31** (bo „nigdy nieczytane" brzmi tanio, dopóki nie wiadomo,
ile to jest): `attack.blocked` to **11 wystąpień i 9 978 obrażeń** w korpusie —
czyli tyle, ile cel faktycznie zdjął z ciosów i o czym panel nie mówi ani słowa.
`superCrit` pada 2 razy w samej walce z Hildur. Uwaga na kolejność: to jest
kandydat na tę samą naprawę, co przypis o leczeniu bez sprawcy — dane są, brakuje
wyłącznie miejsca, w którym miałyby się pokazać. Decyzja nadal nie zapadła
i **nie zapadła też przy tej rundzie** — dopisana jest tylko cena.

**Decyzja 2026‑08‑01: trzy pokazać, jedno usunąć.** Najpierw przeliczenie, bo
liczby wyżej pochodziły sprzed trzech zrzutów — dziś korpus to 21 fixture'ów
i 1095 ataków:

| pole | korpus | co z nim zrobiono |
|---|---|---|
| `attack.blocked` | **20 wystąpień, 25 137 obrażeń** (było: 11 / 9 978) | `ActorStats.damageBlocked` u CELU + `pochłonięte X (blok Y)` w dymku |
| `superCrit` | **10 trafień**, 10/10 razem ze zwykłym krytem | `ActorStats.superCrits` + `kryt. N (w tym M bardzo)` w dymku i w stopce |
| `dot.weakenedPct` | **74 tiki**, żaden zerowy | `ActorStats.damageWeakened` + człon `osłabione W` |
| `experience` | 6 linii, 15 495 pkt | **usunięte** — jedyna liczba z czwórki opisująca WALKĘ, nie postać |

Dwa ustalenia z pomiaru, które przesądziły KSZTAŁT, nie tylko „czy":

1. **Blok jest podzbiorem pochłoniętych, nie liczbą obok.** W każdym z 20
   przypadków to dokładnie 30 % `raw`, a `raw − applied` jest zawsze większe —
   resztę zdejmuje pancerz i odporności, których log nie rozbija. Stąd nawias
   przy pochłoniętych, a nie osobna pozycja, którą czytający dodałby do sumy.
   ⚠️ Dopisane 2026‑08‑01: to nie jest wniosek z 20 obserwacji, tylko **cytat**
   z dokumentacji gry („zredukowanie obrażeń … o 30%”, „przed redukcją przez
   absorpcję, pancerz oraz odporności”) — patrz `MECHANIKA.md`. Pomiar był
   zgodny, ale sprawdziliśmy to dopiero po fakcie.
2. **Kwota DoT‑a w logu stoi PO osłabieniu.** Sprawdzone przez porównanie tików
   tego samego efektu na tym samym celu w wersji osłabionej i nie: `amount/(1−p)`
   trafia w bazę **16/16 razy z błędem ≤ 2 %** (błąd bierze się z procentu
   zaokrąglonego przez grę do liczby całkowitej). Dlatego OSOBNE pole, a nie
   doliczenie do `damageAbsorbed` — tamto jest wyliczone wprost z dwóch liczb
   logu i wlanie w nie szacunku zamieniłoby liczbę dokładną w przybliżoną bez
   ostrzeżenia. Szerzej w `DECYZJE.md`, „Blok, osłabienie i to, co pochłonięte".

Usunięcie `experience` nie mogło uciszyć linii: oba wzorce przeniesiono do
`RE_INFO`, więc „Zwycięzca zdobył łącznie…" zostaje ZNANE, tylko nieliczone.
Bez tego sześć linii logu wpadłoby w `unknown` i zapaliło w panelu ostrzeżenie
„statystyki są niepełne" — usunięcie pola nie może wyglądać jak zmiana formatu.
Test w `parser.test.ts` zamienił się z asercji o kwotach XP na asercję o tym,
że te linie są rozpoznane.

### 4.23 Otwarcie archiwum blokuje wątek gry 🟡 [NAPRAWIONE 2026‑08‑01]
`renderRow` wołało `recorder.read(id)` + `summaryOf(id, text)`, a `summarize` to
`parse` + `aggregate`, **dla każdego wiersza**. Powstawało wszystkie 190 wierszy,
choć `.archive-list { max-height: 320px }` pokazuje ~8 — bez okienkowania, bez
stronicowania, bez leniwych podsumowań poniżej krawędzi.

**Pomiar przed naprawą** (własna sonda, korpus fixture'ów, śr. 15 kB na
nagranie — czyli realna wielkość walki, a nie 1 800 znaków z pierwszego pomiaru):

| nagrań | blokada |
|---|---|
| 21 | 55,7 ms |
| 50 | 83,7 ms |
| 100 | 161,1 ms |
| **190** | **269,2 ms** |

**Fix.** Wiersz rysuje się dwuetapowo. Skorupa (`renderRow`) stoi wyłącznie na
indeksie nagrywarki — tytuł i godzina, zero odczytów. Podsumowanie dokłada
`fillRow`: od razu dla `VISIBLE_ROWS = 8` wierszy z góry listy (posortowanej
najnowsze‑pierwsze, więc „widoczne" to po prostu „pierwsze" — i dlatego nie
trzeba pytać o geometrię), a dla reszty porcjami po `FILL_CHUNK = 8` na tyknięcie
wstrzykniętego `Ticker`-a. Przy okazji `summaryFor` pyta cache PRZED magazynem;
wcześniej trafienie w cache i tak wymagało wczytania tekstu, bo klucz niesie jego
długość — a `render()` leci po każdej skończonej walce.

**Pomiar po naprawie:**

| nagrań | blokada | z czego sam DOM | `read()` |
|---|---|---|---|
| 21 | 34,4 ms | 9,1 ms | ×8 |
| 50 | 36,0 ms | 9,3 ms | ×8 |
| 100 | 49,6 ms | 17,8 ms | ×8 |
| **190** | **62,1 ms** | 30,1 ms | **×8** |

Liczba wczytanych (czyli sparsowanych) nagrań jest odtąd **płaska** — osiem,
niezależnie od tego, czy archiwum ma 21 nagrań, czy 190. To jest właściwa treść
naprawy i to pilnuje testu, nie próg czasowy.

**Co ZOSTAJE.** Reszta kosztu rośnie dalej z długością listy i jest to budowa
DOM‑u: 190 wierszy to ~30 ms w jsdomie (przeglądarka jest tu istotnie szybsza,
więc traktować to jako sufit, nie prognozę). Okienkowanie samej listy nie zostało
zrobione — jeśli kiedyś wróci, to jako osobna sprawa, bo dotyczy renderu, a nie
liczenia. Zapisane, żeby „naprawione" nie znaczyło więcej, niż znaczy.

Drugi zapis w tę samą stronę: `fightLabel(entry.title)` (tymczasowa nazwa
wiersza) parsuje JEDNĄ linię i leci teraz dla każdego wiersza, a wcześniej był
fallbackiem i praktycznie nie odpalał. Zmierzone: **3,27 ms na 190 wierszy**,
czyli w granicach szumu wobec zaoszczędzonych 207 ms — ale to koszt dodany, więc
ma stać zapisany, a nie zostać odkryty przy następnym pomiarze.

### 4.24 Każda klatka odtwarzania parsuje prefiks dwa razy 🟡 [NAPRAWIONE 2026‑07‑30]
`archive.ts:393‑398`:

```ts
replay.view.replay = this.currentReplayView();                       // → frameStats(replay.at)
this.overlay.showPreview(this.frameStats(replay.at), replay.view);   // → i jeszcze raz
```

Zmierzone przez prawdziwe `Archive` ze wstrzykniętym tickerem, fixture 201 linii:
**558 ms CPU na jedno odtworzenie, 2,78 ms/klatkę** i rosnąco (ostatnie klatki
~5–6 ms). Fixture 836‑liniowy to ~2,3 s parsowania na przebieg — za darmo,
bo `currentReplayView` potrzebuje wyłącznie `timeline.length`.

### 4.25 `Session.total()` liczone przy każdej linii dla widoku, którego nie ma 🟡 [NAPRAWIONE 2026‑07‑30]
`index.ts:25`; `mergeStats` głęboko kopiuje i sortuje każde rozbicie każdej
postaci. Zmierzone: **0,55 ms na wywołanie** przy 5 walkach w sesji (liniowo
z długością sesji), na wierzchu **1,38 ms/linię** samego `update()` na fixture
1102‑liniowym. Jedyny konsument to przycisk kopiowania (`overlay.ts:1250`).
Policzyć leniwie.

---

## 5. Mapowanie — `src/stats.ts` (serce długu)

`aggregate` (~360 linii) robi wszystko: rozdziela duplikaty, akumuluje per
postać, buduje 9 map rozbicia, oś tur, zgony, macierz, trucizna bez sprawcy,
strony, sortowanie. Sam `case "attack"` to ~90 linii.

**DRY — powtórzony „poczwórny zapis” ciosu.** 🔴 Jedno trafienie jest dopisywane
osobno do `dealt`, `taken`, `takenBy`, `dealtTo`, `dealtType`, `takenType` — i to
dwa razy (`addDamage` + `countStrike` w osobnym bloku). Nowy przekrój = dopisanie
w 4–6 miejscach, symetrycznie po obu stronach. To ta sama gęstość, w której
zrodziły się §4.1 i §4.6 (łatwo pominąć warunek w jednym z wielu miejsc).
- **Fix (🔴, M): `ActorAccumulator`** — obiekt na postać z `recordHit`/`recordDot`/
  `recordHeal`/`recordProc`. Jeden `recordHit` zamyka wszystkie zapisy i licznik,
  wołany raz z każdej strony. Nowy przekrój dokłada się w JEDNYM miejscu; warunki
  `strike`/`landed` (§4.6) stoją w jednym miejscu, nie sześciu.

**SRP — rozbić `aggregate` na fazy** 🟡: `resolveInstances → accumulate → project
→ deriveSides`. Dziś jeden przebieg + dwie pętle domykające (`stats.ts:685, 712`).

**`instanceResolver` jest dobry, ale ZAMKNIĘTY.** 🔴 `stats.ts:5‑237` — samodzielny,
dwa przebiegi, czysty interfejs `{resolve, seats, ambiguousKeys}` i najbardziej
zawiły algorytm w repozytorium. Jest jednak **module‑private**, więc da się go
sprawdzić wyłącznie przez `aggregate(parse(text))` — i dokładnie dlatego jego
trzy najtrudniejsze gałęzie mają **0 % pokrycia** (`108‑110`, `122‑129`,
`158‑160`; patrz §10). To nie jest „dobre, nie ruszać”, tylko **R8: wyeksportować
do `instances.ts`** i pozwolić testować wprost. Granice publiczne
(`aggregate`) się nie zmieniają.

`estimateMaxHp` (`stats.ts:893`) zostaje jako niezmiennik kontrolny, ale ma
wadę do zapisania: kluczuje po **surowych** nazwach z logu, gdy cała reszta
używa nazw rozwiązanych — i jest używane wyłącznie w testach. Albo do `tests/`,
albo przyjmować klucze rozwiązane.

## 6. Parsowanie — `src/parser.ts`

> **Zaprojektowane 2026‑08‑03**, szerzej niż ten wpis proponuje:
> [`docs/specy/2026-08-03-parser-tokenizer-i-gramatyka.md`](specy/2026-08-03-parser-tokenizer-i-gramatyka.md)
> (status: projekt). Spec przynosi pomiar, którego ten wpis nie miał: puszczone
> po korpusie wszystkie wzorce naraz dają **9355 linii z dokładnie jednym
> trafieniem, 24 kolizje (wszystkie `strike-note + info`) i zero linii bez
> trafienia**. Czyli kolejność drabiny, opisana niżej jako 🔴, na dzisiejszym
> korpusie **nie rozstrzyga prawie niczego** — wzorce tworzą podział, nie listę
> prób. To nie unieważnia zarzutu (kolejność nadal jest niejawna i nadal jest
> tym, co pozwoliło powstać §4.3), ale przesuwa go z „bomba z opóźnionym
> zapłonem" na „dług czytelności" — i daje niezmiennik do wymuszenia.

`parse` (~320 linii) to maszyna stanów po liniach z domknięciami (`pending`,
`ability`, `loose`). Katalog regexów na poziomie modułu — dobry.

**OCP — dyspozytor to sztywna drabina `if` z ZNACZĄCĄ, niejawną kolejnością.** 🔴
Obrażenia PRZED modyfikatorem (`parser.ts:37`), leczenie/DoT PRZED `endBlock`
(`parser.ts:501`) — wiedza w komentarzach, nie w strukturze. To bezpośrednie
źródło §4.3.
- **Fix (🔴, S–M): tablica reguł** `{ match, handle }`, iterowana po kolei;
  pierwsza pasująca wygrywa. Kolejność staje się DANĄ (pozycja), nie własnością
  kodu. Wzorzec już działa — `RE_INFO` to dokładnie taka lista; rozciągnąć na
  cały dyspozytor. Stan bloku przekazywany jako jawny „kontekst parsera”, co
  rozdziela tokenizację od domykania bloków (SRP).
- **Zachować bezwzględnie:** „nieznana linia → `unknown`, nie połykaj” — jedyny
  sygnał zmiany formatu (`parser.test.ts:776`). §4.3 to właśnie DZIURA w tej
  gwarancji, nie powód, by ją osłabiać.
- **Ale gwarancja ma dziś TRZY dziury, nie zero** (reweryfikacja 2026‑07‑30):
  nieznana klasa `dmg*` (§4.17) i separator tysięcy (§4.19) przechodzą **cicho**,
  a strażnik dodany przy naprawie §4.3 przestrzelił w drugą stronę — modyfikator
  z procentem w nawiasie rozbija cały blok na trzy `unknown` (§4.18). Tablica
  reguł z pozycją jako daną adresuje §4.18 wprost; §4.17 i §4.19 potrzebują
  osobnych liczników („nieznany żywioł”, „raw ≠ applied co do LICZBY wartości”).

## 7. Sumowanie sesji — `src/session.ts`

**DRY — dwa razy „ta sama walka?”, policzone.** 🔴 Dwie implementacje tych samych
dwóch decyzji, ~45 linii plus trzy kopie wzorca:
- **dzielenie na walki**: `session.ts:91‑115` (`splitFights`, po zdarzeniach,
  dubel po `participantsKey`) kontra `recorder.ts:68‑88` (`splitLines`, po
  tekście, dubel po dosłownej równości linii) — ten sam kształt, prawie te same
  komentarze, inny dowód;
- **kontynuacja**: `session.ts:222‑228` kontra `recorder.ts:103‑107` — ta sama
  nazwa, ten sam docstring, jedna porównuje sygnaturę + liczbę zdarzeń, druga
  prefiks linii. **§4.14 to właśnie ten rozjazd w akcji**, a §4.12 to jego druga
  strona: nagrywarka umie sklejać przycięty bufor (`merge`), sesja nie;
- **„jak wygląda linia otwierająca”**: `parser.ts:30`, `recorder.ts:30`,
  `source.ts:14` — **trzy kopie**. Zmiana formatu tej jednej linii wywala
  znajdowanie logu i nagrywanie **po cichu**, poza zasięgiem czujki `unknown`,
  która pilnuje wyłącznie parsera. Najtańszy krewny R1: jedna eksportowana stała.

§4.4 tkwiło w OBU kopiach — naprawa musiała trafić dwa razy. §4.14 tkwi tam nadal.
- **Fix (🔴, M): wspólny `FightTracker`** — jedno „podziel bufor i dopasuj od
  końca”, sparametryzowane jednostką (zdarzenie/linia). Session i Recorder stają
  się cienkimi konsumentami; §4.4 naprawia się raz.

**OCP/DRY — ręczny `mergeStats` wylicza pola z palca.** 🔴 (`session.ts:131‑157`)
Nowe pole po cichu wypada z sumy — **tak przepadło `abilityUses`** (jest
test‑strażnik, `overlay.test.ts:339`), **i tak przepadło `dealtToBy`, które
wypada DZIŚ** (§4.11: nie ma go ani w `mergeStats`, ani w `copyActor`, więc suma
sesji kłamie i współdzieli obiekty z bieżącą walką). To ten sam płaski
`ActorStats` (30+ pól), który każe dotykać trzech miejsc na jedno pole
(init/projekcja/merge). **Dwa trafienia tej samej klasy to koniec dyskusji —
R3 przestaje być „warto”, a staje się warunkiem, żeby zakładka Sesji w ogóle
miała sens.**
- **Fix (🟡, M): deklaratywny merge** — mapa `{ pole: 'sum'|'max'|mergeSources }`,
  sumowanie w pętli po deskryptorach. „Zapomnienie pola” staje się niemożliwe,
  a nie łapane testem po fakcie.

## 8. Czytanie danych i widok (skrót)

- **`source.ts` — dobry SRP.** Znacznik żywiołu (``) przemycany w tekście
  to świadomy kompromis (parser jest tekstowy, by łykać też log wklejony). Testy
  pilnują, że nie wycieka — zostawić.
- **`overlay.ts` — klasa‑Bóg: 2846 linii** (przeliczone 2026‑08‑02, po wyjęciu
  arkusza — przedtem 3181). 🟡
  Rendering + stan + drag/resize + trwałość + schowek + dymek + replay +
  formatery. Zmierzone granice cięcia, od najtańszej:

  ⚠️ **Numery linii w tabeli niżej są SPRZED trzech rund i nie prowadzą tam,
  gdzie mówią.** Stało tu „2456 linii, 69 metod", `AUDYT.md` prostowało to na
  „2628" — dziś jest **3181**, czyli o 725 więcej niż liczba, przy której ktoś
  napisał „trzeba go ciąć". Zweryfikowany jest wyłącznie zakres `STYLE`:
  **`:229‑606`, 378 linii, ~12 % pliku** (w tabeli i w `R7` stało `:90‑406`).
  Reszta wierszy czeka na odczyt — nie przepisuj z nich lokalizacji bez
  sprawdzenia w pliku.

  | moduł | co dziś | ile |
  |---|---|---|
  | ~~`overlay.css.ts`~~ | ✅ **ZROBIONE 2026‑08‑02** jako `src/style.ts` — i szerzej, niż zakładał ten wiersz: arkusz obejmuje TAKŻE archiwum, które miało własny. 534 linie, 0 % logiki | — |
  | `format.ts` | `number`/`rate` (`:64`), `compact` (`:80`), `format` (`:1498`), `fightWord` (`:56`) + bliźniak `number` w `archive.ts:157` | ~30 |
  | `metrics.ts` (czysty, testowalny) | `Metric`/`METRIC_LABELS`/`METRICS` (`:7‑25`), `matchesTeam` (`:48`), `turnsFor` (`:434`), `turnKind` (`:446`), `actorValue` (`:450`) | ~60 |
  | `dom.ts` (wspólny z `archive.ts`) | `div` (`:513`), `withText` (`:521`), `rowUnder` (`:507`) | ~20 |
  | `tooltip.ts` | `tipPosition` (`:479`) + `generalSection`…`showTip`/`hideTip` (`:1982‑2293`) | ~330 |
  | `rows.ts` | `renderRows`/`appendSection` (`:1852‑1964`), `breakdownList`/`appendBreakdown` (`:1759‑1841`), stan drążenia (`:1574‑1643`) | ~250 |
  | `panel-window.ts` (wspólny z `archive.ts`) | `PanelState` + `loadState`/`saveState` (`:628`, `:2439`), `makeResizable` (`:2379`), `applyHeightCap` (`:2434`) | ~60 |

  **Priorytet:** `STYLE` i `panel-window.ts` teraz (R7, R5 — jedno jest czysto
  mechaniczne, drugie zamyka `UX-POPRAWKI A10` i §4.15), reszta przy nowych
  widokach.

- **Duplikacja w widoku, policzona.** Predykat „czy ta metryka dzieli się przez
  tury WŁASNE” jest napisany **cztery razy** (`overlay.ts:435`, `:447`, `:1323`,
  `:1373`) — dokładnie rodzina otwartej usterki „na turę” z `DECYZJE.md`; jedno
  `dividesByOwnTurns(metric)` kasuje ryzyko rozjazdu tych czterech.
  `new Intl.NumberFormat("pl-PL")` istnieje dwa razy (`overlay.ts:64`,
  `archive.ts:157`), a `whenLabel` (`archive.ts:124`) ręcznie dopełnia zerami
  datę zamiast użyć `Intl.DateTimeFormat`. Boilerplate przycisku
  (`createElement` → `type` → `dataset.action` → `textContent` → `aria-label` →
  listener) powtarza się **13 razy** (`overlay.ts:1029,1038,1054,1060,1112,1151,
  1170,1212,1221`, `archive.ts:435,446,519,549`) obok istniejącego `tabButton`
  (`:1843`), którego używają tylko zakładki — jedno `button({action, text, aria,
  onClick})` daje przy okazji **jedno** miejsce na obwódkę focusu i 24 px cel
  kliknięcia (`UX-POPRAWKI A13`). Wiersz `tip-stat` budowany jest inline pięć
  razy (`:1990,2029,2033,2085,2103`), choć `sourceTipContent` ma lokalny `stat()`
  (`:2187`), który robi dokładnie to. `archive.ts` buduje każdy węzeł ręcznie
  (10+ miejsc) zamiast importować `div`.

- **Magiczne liczby bez domu:** `STEP_MS = 250` i `SPEEDS` (`archive.ts:39‑41`)
  to polityka odtwarzania mieszkająca w archiwum; `1500` ms błyśnięcia
  (`overlay.ts:1278`); `320px` wysokości listy (`archive.ts:65`); `z-index: 1`
  kontra `2147483000` (`archive.ts:50`, `overlay.ts:94`) — dwie liczby, które
  powodują `UX-POPRAWKI A9`, stoją trzy pliki od siebie; klucze magazynu
  rozsypane po trzech modułach; łańcuchy `data-action` zdublowane między kodem
  i testami bez wspólnej stałej.

- **`types.ts` robi więcej niż typy.** 🟡 `typeFamily()` (`:208‑218`) to 12 reguł
  domenowych czytanych przez `stats.ts` i `palette.ts`; `PROFESSIONS` (`:11`) to
  tablica przeglądowa; `ELEMENT_MARKER` (`:6`) to **protokół transportowy**
  między `source.ts` (pisze) i `parser.ts` (czyta) — bez modułu‑właściciela.
  Skutek: warstwa „typy” jest tym, co importuje wszystko, i nie da się jej
  wymienić bez pociągnięcia zachowania. `domSignal.ts` (zapis + odczyt + licznik
  nieznanych klas) zamyka to razem z §4.17.

- **`EMPTY_STATS` mieszka w złym module i jest mutowalne.** `session.ts:182` —
  `overlay.ts:2` importuje je z `session.ts` tylko po to, żeby mieć zero dla typu
  należącego do `stats.ts` (zbędna krawędź overlay→session). Do tego to
  eksportowany **mutowalny** singleton: start `Session.currentStats` (`:234`),
  start `Overlay.shown` (`overlay.ts:703`) i dwa razy argument `render`
  (`index.ts:47`). Dziś nic go nie mutuje (`overlay.ts:1855` kopiuje przed
  sortowaniem), więc jest utajone — `Object.freeze` albo fabryka nie kosztuje nic.

- **`start()` jest testowalny, `boot()` nie.** `start()` bierze wszystkich pięciu
  współpracowników i jest sprawdzany (`overlay.test.ts:2003,2042,2817`). `boot()`
  (`index.ts:34‑66`) twardo tworzy `Recorder`/`Overlay`/`Session`/
  `EngineRosterSource`, woła `setInterval`, `localStorage`, `document`, nic nie
  zwraca (brak sprzątania) i ma **0 % pokrycia**. Zachowanie, dla którego
  istnieje — podmiana kontenera logu — jest testowane przez **przepisanie go
  ręcznie** w `overlay.test.ts:1011‑1040` (dwa wywołania `start()`). Nic nie
  sprawdza `try/catch`, który chroni licznik przed rozsypanym archiwum
  (`index.ts:49‑56`). `boot({ clock, findLog, storage })` to załatwia.

- **Mina projektowa — zapisać, żeby nikt jej nie „naprawił”.** `showPreview`
  decyduje o zerowaniu drążenia po **tożsamości obiektu** `PreviewView`
  (`overlay.ts:997`), a `Archive.pushFrame` mutuje `replay.view.replay`
  w miejscu właśnie po to (`archive.ts:396`). Oczywisty refaktor „świeży widok na
  każdą klatkę” **po cichu zabiłby drążenie w trakcie odtwarzania**. To wymaga
  jawnego niezmiennika albo testu, nie komentarza.

## 9. Martwy / uśpiony kod (dług czytelności)

**Lista wyczyszczona 2026‑08‑03 — została jedna pozycja.** Poniżej najpierw to,
co zostaje, a potem — bo to najważniejsza część tej sekcji — czym ta lista
okazała się przy sprawdzaniu.

**Zostaje:** `splitLines` w `recorder.ts` jest eksportowane, a poza modułem woła
je wyłącznie test. To nie jest martwy kod (produkcja woła je wewnętrznie), tylko
seam testowy — zapisane, żeby nie wyglądało na przeoczenie.

**Usunięte 2026‑08‑03:** `StaticRosterSource`, `ColorAssignment` z `MAX_SERIES`
i `OTHER_LABEL`, `estimateMaxHp`, `splitRawFights` (zamienione na eksport
`splitLines` — sklejanie linii zjechało do testu), asercje na nieobecność
`.tip-row` i `.more`. Wszystkie trzy `Record<string, any>` (`roster.ts`,
`index.ts` ×2) zastąpione typem `GameGlobals`: w `src/` nie ma odtąd ani jednego
`any`. Wcześniej, 2026‑08‑01/02, zeszły `renderAxis`, `renderFireFocus`,
`turnRows` i ich CSS; 2026‑08‑03 poszła też metryka „Tury” z typu `Metric`
oraz — razem z sumą sesji — `Session.reset()`.

⚠️ **Trzy pozycje z tej listy opisywały stan, którego nie było**, i to jest jej
najtrwalsza lekcja:

1. **„niesprzątany `setInterval` w `boot()`"** — sprzątany. `stop()` woła
   `cancel(handle)` w pierwszej linii, a `boot()` zwraca `stop`.
2. **„trzy osierocone komentarze (`overlay.ts:1967`, `:2060`, `:2137`)"** — nie
   ma ich. Sprawdzone przelotem po pliku, nie okiem: każdy blok `/** … */`
   skonfrontowany z tym, co pod nim stoi. Numery pochodziły sprzed trzech rund.
3. **„`Session.reset()` — brak wywołania w `src/` i w testach"** — wywołanie
   BYŁO (`session.test.ts`). Metoda i tak zeszła, ale z innego powodu.

**Wniosek, trzeci raz w tym repo ten sam:** pozycja z rejestru sprawdza się
w kodzie ZANIM się ją naprawi. Trzy z ośmiu były nieaktualne, a naprawianie ich
„na wiarę" kończy się albo szukaniem czegoś, czego nie ma, albo usunięciem
czegoś, co w międzyczasie zaczęło mieć czytelnika.

~~**Uwaga przed sprzątaniem:**~~ **NIEAKTUALNA od 2026‑08‑03.** Stało tu, że oś
tur i sesja są „funkcjami WSTRZYMANYMI, nie śmieciami", a decyzja „porzucone czy
niedokończone" jest warunkiem wejścia. Decyzja zapadła: **oba porzucone**
(`AUDYT‑6`, `AUDYT‑25`). Zielone testy asertujące nieobecność `.axis`/`.focus`
zeszły razem z kodem już 2026‑08‑01; ta sama klasa asercji wróciła jeszcze raz
jako `.tip-row` i `.more` i została skasowana 2026‑08‑03.

**Zapis o samej klasie błędu zostaje, bo wraca:** test asertujący NIEOBECNOŚĆ
selektora, który nie pada nigdzie w `src/`, jest zielony niezależnie od kodu.
Trafił się tu już trzy razy.

---

## 10. Testy — czego zestaw nie widzi

Stan po rundzie utwardzającej 2026‑08‑03: **816 zielonych, 0 pominiętych,
5 214 asercji**, przebieg 12,7 s, pokrycie **94,21 % linii / 92,69 % funkcji** —
liczone przy KAŻDYM `bun test`, nie tylko na żądanie (`bunfig.toml`).
Nadal nie ma pomiaru GAŁĘZI, więc te procenty są optymistyczne dla plików
pełnych warunków trójargumentowych.

**Co doszło w tej rundzie i czego pilnuje:**
- **`tests/mutanty.test.ts` — fuzz mutacyjny, pierwszy test w repo pytający
  o to, czego parser NIE rozpoznaje.** Każda linia korpusu tekstowego dostaje
  wariant z liczbami (poza procentem życia) zamienionymi na słowo; niezmiennik
  brzmi: **zniszczenie liczby albo nie rusza żadnej kwoty, albo zapala
  `unknown`**. 6085 mutacji, 307 ms. Zmierzył 1995 cichych przekłamań, z czego
  1961 zamknęło zawężenie `DAMAGE_SEGMENT`; zamrożona reszta (34) to granica
  samego niezmiennika, opisana przy stałej `ZAMROZONE_UCIECZKI`;
- **niezmienniki liczb przelatują wreszcie ścieżkę DOM** (`stats.test.ts`).
  Do tej rundy `describe.each` chodziło po `new Glob("*/*/raw.txt")`, czyli po
  drodze, w której `hit.element` jest zawsze `null` — więc `dealtByType`
  i `takenByType` domykały się trywialnie. Zmierzone na fixture Hildur:
  6 etykiet przez DOM wobec 2 z tekstu, `typeByLabel` 31 wpisów wobec 4.
  Sprawdzone mutacją, która jest niewidoczna po tekście (trafienia z żywiołem
  wypadają z przekroju): pada **wszystkie 11 przelotów `(html)` i ani jeden
  z 21 tekstowych**;
- **`typeByLabel` dostał pierwszy niezmiennik w życiu** — bez duplikatów
  etykiet i wyłącznie rodziny będące kluczami `TYPE_COLORS`.

⚠️ **Zapis sprzed tej rundy brzmiał „696 zielonych, 3 649 asercji, 95,21 %
linii / 92,02 % funkcji" (2026‑08‑02) i TEN akurat jest porównywalny** — skład
raportu się nie zmienił, więc doszło 120 testów, linie spadły o 1,0 pp
(`src/index.ts` i `tools/`), funkcje urosły o 0,67 pp.

⚠️ **Wcześniejszy zapis brzmiał „650 zielonych, 98,61 % linii" i porównywanie go
z powyższym jest błędem** — skład raportu się zmienił (weszły `tools/` z blokami
CLI, wyszły pliki testowe). Procent bez podanego składu nie jest liczbą
porównywalną; rozwinięcie w `TOOLING.md`, stan bazowy. **Progu pokrycia nie ma
i nie będzie, dopóki `coverageThreshold` liczy się per plik** — najwyższy próg,
który dziś przechodzi, to `0.43`, czyli zabezpieczenie pozorne. Szczegóły
i dwie zmierzone pułapki konfiguracji: `TOOLING §4`.

⚠️ **Ta sekcja opisywała do 2026‑08‑01 stan sprzed dwóch rund** i była przy tym
cytowana jako lista zadań. Nieaktualne okazały się: liczba testów, pokrycie,
„cztery pliki testowe", „nie ma `session.test.ts` ani `stats.test.ts`" (są, 112
i 22 testy), „nic nie testuje `build.ts` ani metadanych" (jest
`tests/userscript.test.ts`), „dwa `test.skip`" (zero) i „martwy kod zabetonowany
testami" (`renderAxis`/`renderFireFocus` usunięte z drzewa razem z testami).
Zapis zostaje jako przypomnienie, że rejestr długu sam bywa długiem.

**Co zestaw pilnuje mocno.** Pętla kontraktowa per fixture (`parser.test.ts`,
zero nieznanych linii w każdym zrzucie), test różnicowy „HTML daje te same
statystyki co `raw.txt`", odwrócenie rozbicia porównywane z `dealtBy` etykieta
po etykiecie, strukturalny strażnik sumy sesji (`deepSum` schodzi w głąb
dowolnego pola, więc obejmuje pola, których jeszcze nie ma) oraz — od
2026‑08‑01 — **przelot niezmiennikowy** po każdym fixture I po sumie sesji:
rozbicia wobec skalarów, `Σ zadane + bez sprawcy == Σ przyjęte`, to samo dla
leczenia, podział na strony wobec podziału na postacie.

**Nowe czujki z audytu 2026‑08‑01:**
- **kolizje etykiet** — żadna nazwa umiejętności ani postaci z korpusu nie równa
  się etykiecie, którą WYMYŚLAMY (`Bez sprawcy`, `Trucizna`, `Broń`, `Zwykły
  atak`, `Regeneracja`). Test nie naprawia kolizji, tylko pilnuje, żeby pierwsza
  była dniem czerwonego zestawu, a nie cichej pomyłki w panelu. Ryzyko urosło,
  gdy etykiety DoT‑ów stały się zwykłymi rzeczownikami („od ognia" → „Ogień");
- **stan okna z magazynu** — `width: 1e9`, `"szeroko"`, `collapsed: "nope"`;
- **barwa rodziny po `typeDisplay`** — „Broń" traciła kolor i wyglądała jak
  „Nieznany", bo `typeColor` szukał po kluczu małą literą.

**Testy, które nie mogły nie przejść — naprawione 2026‑08‑01.** `describe
("zdejmowanie panelu")` asertował „zapis w styl odczepionego węzła nie rzuca"
i „host, którego nie ma w dokumencie, nadal go nie ma" — oba prawdziwe
niezależnie od tego, czy `destroy()` cokolwiek zrobiło, plus 3,2 s prawdziwych
snów. Dziś pytają wprost: o pozycję, którą przyciąłby `onResize`, i o
wstrzyknięty `Ticker`, który `destroy()` ma zgasić. Sprawdzone mutacją —
usunięcie ciała `destroy()` zapala oba.

**Zamknięte 2026‑08‑02 (audyt wydania):** `tools/changelog.ts` miał czystą
funkcję pokrytą w 100 % i blok CLI pokryty w zerze — czyli odwrotnie, niż wynika
z ryzyka: funkcja wykonuje się przy każdym `bun test`, a CLI wyłącznie przy
wypchnięciu taga. Doszły trzy testy przez `Bun.spawn`, sprawdzające KODY WYJŚCIA
(0 / 1 / 2), po których `release.yml` decyduje, czy przerwać wydanie. Osobno:
`tools/pomoc.ts` dostał pierwsze testy w życiu (13) — do tej pory nie dało się
go nawet zaimportować.

**Niepokryte konkrety:**
- `stats.ts` — fallback `instanceResolver` „roster wyczerpany, bierz
  najzdrowszego". Nie da się tego dosięgnąć z zewnątrz, bo `instanceResolver`
  nie jest eksportowany — patrz R8;
- `archive.ts` — **całe `Archive.destroy()`**. Ostatnie ogniwo sprzątania
  `boot()` → `stop()` → `overlay.destroy()` → `archive.destroy()`, a testy
  `destroy` nie dopinają prawdziwego archiwum. To zegar odtwarzania, który po
  zniknięciu panelu wołałby `render()` na drzewie, którego nie ma;
- `index.ts` — trzy `catch` i `safeStorage()`. Osłona przy `capture` istnieje po
  to, żeby *„nagranie przeżyło licznik"*, i nikt nigdy nie sprawdził, że przeżywa;
- `overlay.ts` — `track.click` suwaka odtwarzania (`clientX` → ułamek → `seek`).
  Testy archiwum wołają `seek()` wprost, z pominięciem DOM.

**Test różnicowy milczy dla części zrzutów z DOM.** `parser.test.ts` ma w środku
`if (raw === null) return;`, a **trzy** fixture'y z `log.html` nie mają `raw.txt`
— dla nich przechodzi pusty, a raport pokazuje same zielone. Proporcja poprawia
się z każdą rundą (było 3 z 6, potem 3 z 8, po 2026‑08‑03 jest 3 z 11), ale te
trzy to wciąż te same zrzuty z lipca. Do tego porównywane `summary()` nie
obejmuje `unknownElements` ani `typeByLabel`, czyli dokładnie tego, co istnieje
wyłącznie na ścieżce DOM.

⚠️ **Od 2026‑08‑03 `summary()` nie obejmuje też `damageAbsorbed`** — i to nie
jest niedopatrzenie, tylko wynik pomiaru: tekst z „Kopiuj logi" nie niesie
żywiołów, więc paruje przyjęte liczby do slotów inaczej niż DOM i wychodzi mu
inne pochłonięcie (na `2026-08-03_druzyna-vs-hildur-absorpcja` 237 127 wobec
240 025, 1,2 %). Rozjazdu nie da się usunąć po stronie tekstu. Uzasadnienie
stoi przy teście i przy `pairApplied` w `parser.ts`.

**Asercje na nieobecność czegoś, czego nie ma:** `.tip-row` i `.more` nie padają
nigdzie w `src/`. Ta sama klasa, którą `AUDYT‑24` skasował dla `.axis`/`.focus`.

**Skrzywienie korpusu.** 24 fixture'y, ale tylko **11 z zrzutem DOM** — cała oś
żywiołów (i scalanie rodzin z 2026‑07‑31) jest sprawdzana na niecałej połowie.
Nadal jeden build klienta, jeden właściciel, wyłącznie męskie formy czasownika.
(Przeliczone 2026‑08‑03, po dołożeniu trzech zrzutów mających oba pliki; było
21 i 8.)

**Brakujące fixture'y:** log **właścicielki** (formy żeńskie — `GENDER` jest
sprawdzany tylko na ręcznie pisanych stringach) i walka z **przyciętym
nagłówkiem** (rozstrzyga §4.12).

⚠️ **Remis stał tu jako brakujący i było to nieprawdą** (sprostowane
2026‑08‑01). „Walka nie wyłoniła zwycięzcy" jest w korpusie dwa razy —
`2026-07-18_tancerz-vs-kukla/raw.txt:36` i
`2026-07-18_tropiciel-vs-kukla/raw.txt:31` — i łapie ją `parser.ts` (`RE_DRAW`).
Skąd błąd: sprawdzano obecność SŁOWA „remis" w polach `covers`, a te dwa
`meta.json` opisują to samo zdarzenie jako „zakonczenie bez rozstrzygniecia",
podczas gdy sześć innych wpisuje „remis" do `missing`. Agregat po słowie
kluczowym dał więc fałszywy negatyw — dokładnie klasa błędu, przed którą broni
procedura z `MECHANIKA.md`, tyle że o KORPUSIE, nie o grze. Wniosek na przyszłość:
twierdzenie „korpus tego nie ma" sprawdza się grepem po `raw.txt`, nie po opisach.

✅ `Zablokowanie N obrażeń` **na ścieżce DOM** — zamknięte 2026‑08‑01.
`2026-08-01_druzyna-vs-hildur-drugi-sklad` dostał `log.html` do swojego
`raw.txt`, więc pięć takich linii przechodzi teraz obiema drogami. Przy okazji
walka weszła do testu różnicowego: dziewięć liczb na każdą z jedenastu postaci
zgadza się co do jedności. Jedyna dozwolona różnica to `fight-start` 1 (DOM)
kontra 2 (`raw.txt`) — zrzut z „Kopiuj logi" dubluje linię otwarcia, co ten
fixture ma opisane w `covers`; wszystkie pozostałe rodzaje zdarzeń są równe
co do sztuki. **Czego dołożył sam DOM:** 367 trafień z rozpoznanym żywiołem
w siedmiu rodzajach (fizyczne 94, zimno 80, dystansowe 55, ogień 54, globalne 50,
nieuchronne 27, błyskawica 7) — w `raw.txt` żadne z nich nie ma żywiołu, bo ten
siedzi wyłącznie w klasie CSS.

---

## 11. Skrót — kolejność prac

**Otwarte, wg wpływu na liczby (przeliczone 2026‑08‑03):**

| # | Usterka | Warstwa | Dlaczego tu |
|---|---|---|---|
| 4.12 | Przycięcie bufora obniża liczby bieżącej walki | session | **połowa zamknięta 2026‑08‑03** wraz z sumą sesji; zostaje jedno pytanie o FAKT — czy okno walki ma sufit komunikatów. Odpowiada na nie sonda w kliencie, nie kolejny zrzut |

**Otwarte luki dowodowe** (nie usterki — miejsca, w których zestaw nie widzi):

| Gdzie | Co |
|---|---|
| `tests/parser.test.ts` | test różnicowy `html ↔ raw` ma w środku `if (raw === null) return;`, więc dla **3 z 11** zrzutów z DOM przechodzi PUSTY, a raport pokazuje zielone. Naprawa nie polega na dorobieniu `raw.txt` (te zrzuty są z lipca), tylko na **zamrożeniu listy** fixture'ów bez pary — żeby czwarty nie poszerzył ciszy po cichu. Najtańsza otwarta pozycja w testach |
| `tests/mutanty.test.ts` | fuzz chodzi wyłącznie po korpusie TEKSTOWYM; wariant ze znacznikiem żywiołu jest syntetyczny. Objęcie `log.html` wymaga przepuszczenia 6 tys. wariantów przez `extractText` |
| `docs/AUDYT.md §G` | kolumna statusu w tabeli cudzych pozycji — wniosek „zostawić same odsyłacze" stoi od 2026‑08‑02 i zestarzał się już **czterokrotnie** we własnej tabeli |

`4.9` zeszło stąd **2026‑08‑03** — zamknięte w tej samej rundzie.

`4.23` zeszło stąd **2026‑08‑01**, w tej samej rundzie, w której je zamknięto —
tak samo jak `4.18` i `4.22` dzień wcześniej.

`4.18` i `4.22` zeszły stąd **2026‑08‑01**, w tej samej rundzie, w której je
zamknięto — i to jest cała odpowiedź na ostrzeżenie niżej.

⚠️ **Ta tabela zestarzała się raz i warto wiedzieć jak.** Do 2026‑08‑01
wymieniała jako otwarte `4.11`, `4.13/4.14`, `4.15/4.16`, `4.17/4.19`, `4.20/4.21`
oraz `4.24/4.25` — wszystkie sześć grup stało w swoich sekcjach jako
`[NAPRAWIONE 2026‑07‑30]`, część od tygodnia. Powód jest strukturalny, nie
ludzki: status żyje w DWÓCH miejscach naraz, a naprawia się to, co się czyta
(sekcję), nie skrót. Jeżeli kiedyś przyjdzie tu porządkować, tańsze od pilnowania
obu jest skasowanie kolumny statusu z tego skrótu i zostawienie samych odsyłaczy.
Ta sama lekcja, co przy `SOLID §10` i `TOOLING` w audycie `F3`.

**Naprawy działania z poprzedniej rundy — ZROBIONE (2026‑07‑26):**

| # | Usterka | Warstwa | Jak naprawione |
|---|---|---|---|
| 4.1 | Obrażenia znikają z osi tur (start od DoT) | stats | `addToTurn` otwiera „turę tła” bez aktora (strona `null`) |
| 4.2 | `opponentOf` ignoruje roster z gry | stats | jeden `roster` na `aggregate` — to samo źródło co `seats` |
| 4.3 | `RE_MODIFIER` catch‑all wyłącza `unknown` | parser | `modifierOf`: linia z procentem życia NIE jest modyfikatorem |
| 4.4 | Walka przerwana skleja się z następną | session+recorder | dublem jest tylko powtórzenie TEGO SAMEGO składu/linii |
| 4.6 | `maxHit` liczy własne obrażenia umiejętności | stats | rekord bije tylko `event.strike` |

Niezmienniki przeliczone po naprawach na całym korpusie (13 zrzutów):
`Σ dealtBy == damageDealt`, `Σ takenByType == damageTaken`,
`Σ damageDealt + DoT bez sprawcy == Σ damageTaken`, `Σ timeline == Σ zdarzeń`
— wszystkie trzymają, zero `unknown`.

**Refaktory (kasują KLASY usterek, nie pojedyncze):**

| # | Refaktor | Kasuje klasę | Koszt |
|---|---|---|---|
| R1 | `FightTracker` — **przedmiot skurczył się 2026‑08‑03**: „dwie implementacje «ta sama walka?»” to od usunięcia sumy sesji JEDNA, w nagrywarce. Zostaje jedna stała `fight-start` | ~~dubel §4.4, §4.12, §4.14~~ trzy kopie wzorca | ~~M~~ S |
| R2 | `ActorAccumulator` (jeden `recordHit`) | §4.1/§4.6 i przyszłe pominięcia | M |
| ~~R3~~ | ~~Deklaratywny `mergeStats`~~ | **BEZPRZEDMIOTOWY 2026‑08‑03** — `mergeStats` nie istnieje, zszedł z sumą sesji (`AUDYT‑6`). Klasa „zapomniane pole” (`abilityUses`, `§4.11 dealtToBy`, `AUDYT‑37 side`) zniknęła razem z jedynym miejscem, w którym pola wypisywano z palca | — |
| R4 | Tablica reguł parsera. **Zaprojektowane 2026‑08‑03 szerzej — jako tokenizer + gramatyka, cały parser od zera**: [`specy/2026-08-03-parser-tokenizer-i-gramatyka.md`](specy/2026-08-03-parser-tokenizer-i-gramatyka.md) (status: projekt). Sama tablica reguł jest w specu odrzuconym wariantem — zamyka OCP, ale zostawia trzy zmierzone dziury, w których `(.+?)` przyjmuje dowolny tekst i cicho przekłamuje liczbę. Koszt rośnie do L | §4.3, §4.18 i OCP nowych formatów | ~~S–M~~ L |
| **R5** | **`panel-window.ts`**: `PanelState` + `loadState`/`saveState` + walidacja pól. **Częściowo zrobione:** wspólne przycinanie pozycji siedzi już w `window.ts` (`clampToViewport`), ale `loadState`/`saveState` nadal istnieją dwa razy i nadal bez walidacji pól | reszta klasy z §4.15 | S |
| **R6** | ~~**Delegacja po `data-action`** dla całego panelu~~ | **✅ ZROBIONE 2026‑07‑30** — zamknęło `UX-POPRAWKI A8` | — |
| ~~**R7**~~ | ~~**Wydzielić `STYLE`** + scoping~~ | **✅ ZROBIONE 2026‑08‑02** — `src/style.ts`, jeden arkusz na oba okna (tokeny → prymitywy → panel → archiwum). Archiwum przestało wstrzykiwać własny; chrome opisuje jedna reguła `.panel, .archive`; wiersz rankingu zawężony do `.rows .row`, więc kolizja, dla której powstało obejście `.archive-paste-actions`, zniknęła. Siedem nowych tokenów na wartości, które padały w arkuszu po dwa i trzy razy. Strażnik przeprowadzki: **113 selektorów przed, 113 po**, różnice wyłącznie zamierzone. Spec: [`specy/2026-08-02-jednolity-wyglad-wiersza.md`](specy/2026-08-02-jednolity-wyglad-wiersza.md). **Zostaje:** pełne zakresowanie per okno — `header`, `button` i `.grow` są dalej globalne w shadow roocie, dziś celowo | — |
| **R8** | **Wyeksportować `instanceResolver`** do `instances.ts` | nietestowalność rozdzielania duplikatów (trzy gałęzie 0 %) | M |

Kolejność wykonana w poprzedniej rundzie: **4.2 → 4.6 → 4.4 → 4.1 → 4.3**, każda
z testem na przywrócony niezmiennik. **R1–R4 zostają** — to one sprawią, że te
błędy nie wrócą; §4.11 i §4.14 są tego dowodem (jedno pole zapomniane w merge'u,
jedna reguła kontynuacji rozjechana między dwoma plikami). Wszystko za stabilnymi
sygnaturami: **369 testów zielonych**, `tsc --noEmit` czysty.

**Runda 2026‑07‑30 — wykonane:** 4.11 → A7 → A8 (przez R6) → `@match`/`boot`
→ A10 → A9, A11, A12 → 4.13–4.17, 4.19–4.21 → 4.24, 4.25 → A13, A15, B1
→ testy: niezmienniki sumy sesji (strukturalne, nie z palca), dymek
w podglądzie, klik przez przebudowę, `boot` poza grą, metadane userscriptu,
leczenie zdublowanej nazwy. Pokrycie 89,1 % → 93,3 %.

**Runda 2026‑08‑03 (utwardzająca, druga tego dnia) — wykonane:** niezmienniki
liczb na ścieżce DOM → fuzz mutacyjny (`tests/mutanty.test.ts`) → zawężenie
`DAMAGE_SEGMENT` → trzy ciche ścieżki na głośne (`RE_RAW_ELEMENT` na `[a-z0-9]`,
blok z `flushLoose`, zaślepka `?? ""`) → sześć flag `tsconfig` → rejestry.
Testy 696 → **816**, asercje 3 649 → **5 214**. Korpus przeliczony obiema
drogami po każdej zmianie parsera: **32 pliki, 9387 zdarzeń, 0 `unknown`,
0 rozjazdów** wobec stanu sprzed rundy; `parse()` 20,56 → 20,40 ms (szum).

Trzy rzeczy, które ta runda ustaliła, a których rejestry nie znały:
- **1995 linii korpusu dawało się zepsuć tak, że kwota się zmieniała, a parser
  milczał.** 1961 z nich zamknęła JEDNA zmiana — segment obrażeń przestał być
  `(.+)`. Pomiar był możliwy dopiero po zbudowaniu fuzzu, nie przed;
- **niezmienniki liczb nie dotykały ścieżki DOM ani razu** — czyli jedynej,
  która niesie żywioły. `dealtByType` domykało się na jednym wierszu „Nieznany";
- **`SOLID §4.9` i `TOOLING §4` (trzy `any`) były zamknięte, a rejestry tego nie
  wiedziały**; `AUDYT §G` miał czwarty z rzędu rozjazd w tej samej tabeli.

**Runda 2026‑08‑03 (porządkowa) — wykonane:** suma sesji → `deaths`/`matrix`
→ metryka „Tury” → martwy kod `§9` → `§4.9` → `UX §4.2` i `§4.1`. Trzy z ośmiu
pozycji `§9` okazały się przy sprawdzaniu nieaktualne — patrz tamta sekcja.
`src/session.ts` **362 → 88 linii**, `src/` bez ani jednego `any`.

**Zostaje, w tej kolejności:**

1. **§4.12** — jedyna otwarta usterka działania, i to w połowie. Rozstrzyga ją
   **sonda w kliencie** (czy okno walki przycina `.scroll-pane`), nie kolejny
   zrzut: przy 1373 liniach gra nadal nie przycinała.
2. **R8** (eksport `instanceResolver`) — trzy gałęzie z zerowym pokryciem,
   nieosiągalne z zewnątrz. Najtańsze z tego, co zostało.
3. **R5** (wspólny stan okna) i **cięcie `overlay.ts`** wg `§8` — plik ma
   ponad 3100 linii i urósł w tej rundzie, nie zmalał.
4. **R1** — po usunięciu sumy sesji zostaje z niego jedna stała `fight-start`
   i trzy kopie wzorca. Koszt spadł M → S, ale i zwrot.
5. **`UX-POPRAWKI B2`** (suwak po turach) — wymaga numeru linii w zdarzeniach
   parsera, czyli zmiany w `types.ts`, `parser.ts` i `stats.ts`.
6. **`R4`** — parser od zera, spec w `specy/2026-08-03-…` ze statusem `projekt`.
   Osobna decyzja, nie kolejny punkt tej listy.

**Runda 2026‑08‑01 (parser) — wykonane:** §4.18 → §4.22 (decyzja: blok,
super‑kryt i osłabienie DoT‑a do panelu, `experience` usunięte) → testy:
proc z procentem w nawiasie, linie XP jako `info`, blok u celu, super‑kryt jako
podzbiór krytów, odtworzenie osłabienia, scalanie trzech nowych pól w sesji,
sześć asercji na człony liczników. Dwa nowe niezmienniki lecą po CAŁYM korpusie
i po sumie sesji: `damageBlocked ≤ damageAbsorbed`, `superCrits ≤ crits`.
Zestaw: 638 → **650 zielonych**.
