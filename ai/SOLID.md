# SOLID — działanie programu i możliwe poprawki

Analiza **rdzenia**: jak tekst logu staje się statystykami — czytanie danych →
parsowanie → mapowanie → przerabianie → sumowanie. Dwie części:

- **§4 Otwarte usterki działania** — konkretne defekty parsowania/mapowania.
  §4.1–§4.10 bazują na przeglądzie w `README.md` z 2026‑07‑19; **§4.11–§4.25
  pochodzą z przeglądu 2026‑07‑30** i obejmują nagrywanie, archiwum i
  odtwarzanie, czyli kod, który wcześniej nie był sprawdzony ani razu.
  **Stan: §4.1–§4.4 i §4.6–§4.8 naprawione** (każda z testem na przywrócony
  niezmiennik), zostają §4.5, §4.9, perf §4.10 i cała nowa piętnastka (§4.11–§4.25).
- **§5–§9 Dług architektoniczny (SOLID)** — refaktory, które czynią całe KLASY
  tych usterek niemożliwymi, a nie łatanymi po fakcie.
- **§10 Testy** — czego zestaw nie widzi, i dlaczego to właśnie tam przeszły
  §4.11 i §4.12.

Zasada nadrzędna: **żaden refaktor nie zmienia granic** (`LogSource`,
`RosterSource`, `parse`, `aggregate`, `BattleStats`). Siatka bezpieczeństwa to
**328 testów** (2 pominięte) — zielone przed i po każdym kroku;
`bunx tsc --noEmit` czysty; pokrycie 89,1 % linii.

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
nowym parserem (pomiar w `README.md`: ~2,6 tys. znaków surowca vs ~4,5 tys.
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
  (`README.md` „Sprawdzone i odrzucone”). Refaktor musi je utrzymać.

## 3. Co już naprawił commit `2cabd6d` (kontekst)

Trwały szkielet okna + trwałe węzły sterowania odtwarzaniem + `pointerup`‑drążenie
usunęły: gubione klikanie podczas odtwarzania, migający pasek scrolla, mrugające
ostrzeżenie o nierozpoznanych liniach w `frameStats`. **Częściowo** złagodziły
„pełną przebudowę DOM przy każdej linii” (§4.10): korpus już nie powstaje od zera.
**Nie objęły** przeciągania nagłówka — to dopiero `3814a42` (`UX-POPRAWKI.md A1`).
**I nadal nie obejmują reszty panelu:** zakładki, okruszek i przyciski paska
nagrywania są przebudowywane co klatkę odtwarzania, więc gubią kliknięcia
dokładnie tak, jak gubiły je wiersze (`UX-POPRAWKI.md A8`). Ta klasa błędu jest
zamknięta punktowo, nie systemowo — stąd R6.

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

### 4.5 Leczenie gubi procent życia 🟡 [NAPRAWIONE — ale BEZ TESTU]
`BattleEvent.heal` niesie już `targetHpPct` (`types.ts:99‑109`), a `stats.ts:763`
woła `resolve(event.target, event.targetHpPct, true)` z flagą `rising`, która
zdejmuje założenie „życie nie rośnie” dla leczenia.
**⚠️ Zostaje dług:** gałąź `rising` w `instanceResolver` (`stats.ts:122‑129`) ma
**0 % pokrycia** — leczenie postaci o zdublowanej nazwie, czyli dokładnie ta
funkcja, którą ta poprawka wprowadziła, nie ma ani jednego testu. Patrz §10.

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

### 4.9 Drobne luki parsera ⚪ [częściowo naprawione — reweryfikacja 2026‑07‑30]
- ✅ Regexy leczenia mają `\.?$` we wszystkich trzech kształtach
  (`parser.ts:89,93,99`), a `"X otrzymuje 15 punktów many."` łapie `RE_INFO`
  (`parser.ts:142`).
- ✅ `.replace(/ /g, " ")` naprawione — `parser.ts:185` zdejmuje znaczniki
  i ` `.
- ❌ **Separator tysięcy nadal otwarty, i zawodzi INACZEJ, niż tu stało** —
  patrz §4.19 (nie `applied > raw`, tylko cicho obcięta liczba).
- ❌ `procs` nadal zbierają przyrosty zasobów: `classifyModifiers`
  (`parser.ts:270‑283`) wrzuca do `procs` każdy modyfikator, który nie jest
  blokiem/absorpcją, a `"+14 energii"` jest jawnie traktowane jako poprawny
  modyfikator (`parser.ts:47`, `:449`).

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

### 4.11 `dealtToBy` wypadło z `mergeStats` I z `copyActor` 🔴 [otwarte]
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

### 4.12 Przycięcie logu w trakcie walki OBNIŻA liczby 🔴 [otwarte — najpierw decyzja]
`session.ts:222‑228` — `continues()` uznaje każdy ogon bez nagłówka za
kontynuację, a `session.ts:268/276` **podmienia** statystyki tej walki na
policzone z krótszego bufora. Nie ma wysokiej wody:

```
pełny bufor   : current= 46620  total= 46620
po przycięciu : current= 26569  total= 26569
ogon 20 linii : current=  6900  total=  6900
```

Licznik obrażeń, któremu sumy maleją. `recorder.ts:118‑126` (`merge`) rozwiązuje
dokładnie ten problem dla nagrań — sesja nie, choć nagrywarka trzyma
zakumulowany tekst jedną linię obok (`index.ts:21‑24`).

**Ale przesłanki nie potwierdza ŻADEN fixture.** Największy zrzut DOM
(`…druzyna-vs-draugr-zwyciestwo/log.html`, 742 wyciągnięte linie) nadal zawiera
linię otwierającą — `extractText` daje 742 linie wobec 743 w `raw.txt`, a jedyna
różnica to zdublowany nagłówek. Czyli albo przycinanie jest realne (i licznik
zaniża), albo nie jest (i wtedy gałąź „bez nagłówka” w `continues()` plus całe
`merge` to martwa złożoność). **Do rozstrzygnięcia jednym zrzutem z długiej
walki — to decyzja, nie łatka.**

Fakt na marginesie, warto zapisać: zdublowana linia `Rozpoczęła się walka`
występuje **tylko w `raw.txt`** (wyjście „Kopiuj logi”), nie w DOM. Oba
mechanizmy odsiewania dubla (`session.ts:104‑108`, `recorder.ts:80`) obsługują
więc wyłącznie drogę wklejonego tekstu.

### 4.13 F5 w trakcie walki nagrywa ją drugi raz 🟡 [otwarte]
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

### 4.14 Nagrywarka rozcina jedną walkę na dwie 🟡 [otwarte]
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

### 4.15 Indeks nagrań sprawdzany tylko na najwyższym poziomie 🟡 [otwarte]
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

### 4.16 Ścieżki błędu quoty psują stan w pamięci 🟡 [otwarte]
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

### 4.17 Nieznana klasa `dmgX` cicho staje się „bez żywiołu” 🟡 [otwarte]
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

### 4.18 Modyfikator z `(N%)` rozbija cały blok ataku na trzy `unknown` 🟡 [otwarte]
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

### 4.19 Separator tysięcy zawodzi CICHO 🟡 [otwarte — inaczej, niż stało w §4.9]
`parser.ts:20`/`:200`. Zapisany dotąd tryb awarii (`applied > raw`) jest zły.
Faktyczny:

```
"+10 000" / "-8 000"  →  hits: [{raw:10, applied:8}, {raw:0, applied:0}]
```

Czyli 10 zamiast 10000, widmowe drugie trafienie i **zero `unknown`** — a oba
testy kontraktowe przechodzą (`8 ≤ 10` dla `parser.test.ts:31`; brak uniku dla
`:38`). **Fix:** reguła „liczba wartości raw == liczba applied, żadne trafienie
nie jest całkowicie zerowe” robi tę awarię głośną. **S.**

### 4.20 `clean()` zjada literę następnego słowa ⚪ [otwarte]
`parser.ts:19` — `RE_ELEMENT` bierze `MARKER([a-z]+)`, choć `source.ts:65` pisze
dokładnie **jeden** znak. Bez spacji między liczbą a następnym słowem
(`"-80⟨M⟩dobrażeń"`) zjada literę → `unknown`. Głośne, więc drobne; `[a-z]`
(jeden znak) albo znacznik domykający kasuje klasę.

### 4.21 `opponentOf` bierze pierwszy wpis rostera o danej nazwie ⚪ [otwarte]
`stats.ts:524` — `roster.find(p => p.name === name)`. Gdy ta sama nazwa stoi po
obu stronach, strona bierze się z tego, który wpis jest pierwszy, więc DoT może
zostać przypisany **sojusznikowi**. Guard: zwracać `null`, gdy nazwa występuje
po obu stronach.

### 4.22 Cztery pola parsowane i nigdy nieczytane ⚪ [otwarte]
`superCrit` (tylko `types.ts:46` + parser), `attack.blocked` (nie ma go ani
w `stats.ts`, ani w `overlay.ts`), `dot.weakenedPct` (parser/typy), `experience`
(ignorowany `case` w `stats.ts:796`). Czyli „Cios bardzo krytyczny”,
„Zablokowanie 717 obrażeń”, osłabienie DoT‑u i linie XP są parsowane, typowane
i **przetestowane** — a potem wyrzucane. To osobna kategoria niż martwy kod z §9:
tu utrzymanie ma już testy w zestawie. Pokazać albo usunąć — ale zdecydować.

### 4.23 Otwarcie archiwum blokuje wątek gry 🟡 [otwarte — koszt]
`archive.ts:490‑491` — `renderRow` woła `recorder.read(id)` + `summaryOf(id,
text)`, a `summarize` (`:145‑155`) to `parse` + `aggregate`, **dla każdego
wiersza**. Zmierzone:

| co | koszt |
|---|---|
| `parse+aggregate`, 15 fixture'ów, śr. 5 661 znaków | **1,30 ms / walkę** |
| otwarcie archiwum, 190 nagrań × 1 800 znaków | **146 ms blokady** |
| ponowne otwarcie, cache ciepły (sam DOM) | 32 ms |

Przy realnych walkach (5,7 kB) pierwsze otwarcie to ~0,4–0,5 s zamrożonej gry.
Powstaje wszystkie 190 wierszy, choć `.archive-list { max-height: 320px }`
(`archive.ts:65`) pokazuje ~9 — bez okienkowania, bez stronicowania, bez
leniwych podsumowań poniżej krawędzi.

### 4.24 Każda klatka odtwarzania parsuje prefiks dwa razy 🟡 [otwarte — koszt]
`archive.ts:393‑398`:

```ts
replay.view.replay = this.currentReplayView();                       // → frameStats(replay.at)
this.overlay.showPreview(this.frameStats(replay.at), replay.view);   // → i jeszcze raz
```

Zmierzone przez prawdziwe `Archive` ze wstrzykniętym tickerem, fixture 201 linii:
**558 ms CPU na jedno odtworzenie, 2,78 ms/klatkę** i rosnąco (ostatnie klatki
~5–6 ms). Fixture 836‑liniowy to ~2,3 s parsowania na przebieg — za darmo,
bo `currentReplayView` potrzebuje wyłącznie `timeline.length`.

### 4.25 `Session.total()` liczone przy każdej linii dla widoku, którego nie ma 🟡 [otwarte — koszt]
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
- **`overlay.ts` — klasa‑Bóg: 2456 linii, 69 metod.** 🟡 Rendering + stan +
  drag/resize + trwałość + schowek + dymek + replay + formatery. Zmierzone
  granice cięcia, od najtańszej:

  | moduł | co dziś | ile |
  |---|---|---|
  | `overlay.css.ts` | `STYLE` (`:90‑406`) — jeden szablon na panel, zakładki, wiersze, dymek, oś, focus | **316 linii, 13 % pliku, 0 % logiki** |
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
  `:1373`) — dokładnie rodzina otwartej usterki „na turę” z `README.md`; jedno
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

Zreweryfikowane 2026‑07‑30, tym razem **z dowodem z pokrycia**, nie z grepa.
`bun test --coverage` pokazuje w `overlay.ts` trzy niepokryte zakresy —
`1412‑1457`, `1468‑1493`, `2142‑2166` — czyli dokładnie `renderFireFocus`,
`renderAxis` i `turnRows`. Razem z nimi martwy jest CSS: `.focus*` (`:293‑296`),
`.axis*` (`:298‑309`) oraz **`.tip-row`/`.tip-label`/`.tip-value`/`.tip-share`**
(`:364‑372`) — `turnRows` jest ich jedynym użytkownikiem.

Dalej: metryka „Tury” nieosiągalna z UI (`METRICS` ma trzy pozycje,
`overlay.ts:25`) plus dwa `test.skip` (`overlay.test.ts:836`, `:893`);
`ColorAssignment`/`MAX_SERIES`/`OTHER_LABEL` (`palette.ts` — po przejściu na
barwę z atrybutu zostały tylko w testach); `StaticRosterSource`
(`roster.ts:106`, zero referencji, także w testach); `splitRawFights`
(`recorder.ts:91`, istnieje wyłącznie dla testów); `Session.reset()`
(`session.ts:289`, brak wywołania w `src/` i w testach); `estimateMaxHp`
(`stats.ts:893`, tylko testy — i klucz po **surowych** nazwach z logu, gdy reszta
świata używa nazw rozwiązanych); niesprzątany `setInterval` w `boot()`;
`roster.ts:63` — `Record<string, any>` w skądinąd ścisłym kodzie, którego nic nie
zgłasza, bo lintera nie ma.

Do tego **trzy osierocone komentarze** opisujące funkcje, których już pod nimi
nie ma (`overlay.ts:1967`, `:2060`, `:2137`) — w pliku, który tak mocno stoi na
komentarzach, to myli aktywnie.

**Uwaga przed sprzątaniem:** usunięcie `renderAxis`/`renderFireFocus` wymaga
skasowania **zielonych** testów — `overlay.test.ts:2557` i `:2597` asertują
`querySelector(".axis") === null` i `.focus === null`, czyli utrwalają
niedokończoną robotę. Oś tur i sesja to funkcje **wstrzymane**, nie śmieci;
decyzja „porzucone czy niedokończone” jest warunkiem wejścia, nie skutkiem.

---

## 10. Testy — czego zestaw nie widzi

Stan: **328 zielonych, 2 pominięte, 1387 asercji**, pokrycie **89,1 % linii**
(86,95 % funkcji). Komendy `coverage` w `package.json` nie ma, więc regresja
pokrycia nie ma jak się zgłosić.

**Układ plików kłamie.** Cztery pliki testowe na trzynaście modułów.
`tests/overlay.test.ts` (2839 linii, 60 % zestawu) mieści też testy `session.ts`,
`stats.ts`, `roster.ts`, `source.ts`, `palette.ts` i `index.ts`, a
`parser.test.ts` trzyma asercje agregacji. Nie ma `session.test.ts` ani
`stats.test.ts` — i dlatego luki w tych modułach są niewidoczne.

**Niepokryte konkrety — wszystkie w heurystyce duplikatów** (`stats.ts`):
- `108‑110` — dopasowanie bez procentu życia („lgnie do instancji, która działała
  ostatnio”): żaden test nie ma linii `turn-lost`/`ability` dla zdublowanej nazwy;
- `122‑129` — **cała gałąź `rising`, czyli leczenie postaci o zdublowanej
  nazwie**: funkcja dopiero co wdrożona (§4.5) i wysłana bez testu;
- `158‑160` — fallback „roster wyczerpany, bierz najzdrowszego”.

Wszystkie trzy są trudne do dosięgnięcia **dlatego**, że `instanceResolver` nie
jest eksportowany — patrz R8.

**Brak testu niezmienników na SUMIE SESJI.** Przelot po pojedynczej walce trzyma
na wszystkich 15 fixture'ach (`Σ dealtBy/dealtToBy/takenFrom/takenFromBy/
healedBy` wobec skalarów, `dealt + nieprzypisany DoT == taken`,
`Σ timeline == taken`, `Σ macierz == dealt`, `unknownLines == 0` →
`0 problemów`). **Ten sam przelot po `Session.total()` daje 46 rozjazdów**
(§4.11). Jeden test fixture'owy „te same niezmienniki muszą trzymać po scaleniu”
zastępuje wyliczankę z `overlay.test.ts:374` i jest od niej ściśle silniejszy.

**Brak testu, który przycina treść z TRWAJĄCEJ walki** (§4.12) — trzy istniejące
testy tożsamości bufora (`overlay.test.ts:300`, `:316`, `:333`) zdejmują tylko
linię nagłówka albo całą walkę.

**Zero testów dymka w podglądzie i w odtwarzaniu.** `grep preview|replay`
w `overlay.test.ts` = **0 trafień**; `archive.test.ts` używa prawdziwego
`Overlay`, ale nigdy nie najeżdża na wiersz w podglądzie. Tędy przeszło
`UX-POPRAWKI A7`.

**Testy asertujące implementację albo nieobecność:** `overlay.test.ts:2557`
i `:2597` (oś tur i skupienie ognia „nie są dziś pokazywane”) utrwalają martwy
kod; dwa `test.skip` (`:836`, `:893`) trzymają `turnRows` przy pozorach życia;
asercje palety (`:1043‑1250`) pilnują konkretnych szesnastek i zachowania puli —
z natury implementacyjne, ale uzasadnione walidacją kolorów.

**Czy zestaw złapie zmianę formatu?** Częściowo, i ten podział warto trzymać
zapisany:
- **mocne** — pętla kontraktowa per fixture (`parser.test.ts:20‑46`, zero
  nieznanych linii) i prawdziwy test różnicowy „HTML daje te same statystyki co
  `raw.txt`” (`:81‑99`);
- **ślepe** — wszystko, co parser zamienia w kształt **zły, ale rozpoznany**:
  §4.17 (nieznana klasa `dmg*`), §4.19 (separator tysięcy) oraz zachłanne
  `RE_ABILITY_USE` (`^(.+?) wykonuje (.+?)\.?$` przyjmie `X(100%) wykonuje Y`
  i wybije widmową postać `"X(100%)"` z turą, `stats.ts:788‑792`).

**Skrzywienie korpusu.** 15 fixture'ów to **jeden build klienta** („new‑engine”),
okno **dziesięciu dni** (2026‑07‑18…28), **jeden właściciel**, wyłącznie męskie
formy czasownika — więc `GENDER` (§4.8) jest sprawdzany tylko na ręcznie pisanych
stringach.

**Brakujące fixture'y** (agregat pól `missing` w `meta.json`, zweryfikowany po
`covers`): log **właścicielki** (formy żeńskie), walka z **przyciętym
nagłówkiem** (rozstrzyga §4.12), `Zablokowanie N obrażeń` na ścieżce DOM,
**remis** („Walka nie wyłoniła zwycięzcy” — nie występuje w `covers` żadnego
fixture'u).

**Nic nie testuje `build.ts` ani metadanych userscriptu**, choć błąd `@match`
trafił użytkowników **dwa razy** (`eddde5b`, potem `2016e59` „dodatek nie
wstrzykiwał się do gry”). Dziesięć linii — banner się parsuje, adres świata
pasuje, `forum`/`www`/`pomoc` nie — zamyka klasę, która już ugryzła. Patrz
`TOOLING.md`.

---

## 11. Skrót — kolejność prac

**Otwarte, wg wpływu na liczby (stan 2026‑07‑30):**

| # | Usterka | Warstwa | Dlaczego tu |
|---|---|---|---|
| 4.11 | `dealtToBy` wypadło z `mergeStats`/`copyActor` | session | błędne liczby w artefakcie, który DZIŚ wychodzi do schowka; 46 rozjazdów na 15 fixture'ach; test‑strażnik strukturalnie tego nie widzi |
| 4.12 | Przycięcie bufora obniża sumy | session | licznik, któremu liczby maleją — ale **najpierw zrzut**, bo przesłanki nie potwierdza żaden fixture |
| 4.13/4.14 | Jedna walka jako dwa nagrania (F5, wzrost linii w miejscu) | recorder | dwa wiersze archiwum na jedną walkę, podwójny budżet |
| 4.15/4.16 | Indeks bez walidacji; ścieżki quoty psują stan | recorder | przy `NaN` **eksmisja przestaje działać** — pada jedyna ochrona magazynu dzielonego z grą |
| 4.17/4.19 | Nieznana klasa `dmg*`; separator tysięcy | parser | dwie ciche awarie w kontrakcie, który obiecuje głośne |
| 4.18 | Modyfikator z `(N%)` rozbija blok na trzy `unknown` | parser | dziś nieaktywne, ale sprzężenie niewidoczne |
| 4.23/4.24/4.25 | Archiwum 146 ms blokady; podwójne parsowanie klatki; `total()` co linię | archive/index | koszt, nie poprawność — po powyższych |
| 4.5 (dług) | gałąź `rising` bez testu | stats | funkcja wdrożona bez pokrycia, patrz §10 |
| 4.9/4.20/4.21/4.22 | Drobne luki i pola wyrzucane po sparsowaniu | parser/stats | wg zwrotu |

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
| R1 | `FightTracker` (jedno dzielenie+dopasowanie walk) + jedna stała `fight-start` | dubel §4.4, §4.12, §4.14, trzy kopie wzorca | M |
| R2 | `ActorAccumulator` (jeden `recordHit`) | §4.1/§4.6 i przyszłe pominięcia | M |
| R3 | Deklaratywny `mergeStats` | „zapomniane pole” — `abilityUses`, a teraz **§4.11 `dealtToBy`** | M |
| R4 | Tablica reguł parsera | §4.3, §4.18 i OCP nowych formatów | S–M |
| **R5** | **`panel-window.ts`**: `PanelState` + `loadState`/`saveState` + przycięcie do ekranu + walidacja pól (dziś ta para istnieje DWA razy: `overlay.ts:2439‑2455`, `archive.ts:560‑576`) | `UX-POPRAWKI A10` + §4.15 w jednym miejscu | M |
| **R6** | **Delegacja po `data-action`** dla całego panelu, nie tylko wierszy | `UX-POPRAWKI A8` i cała klasa „węzeł przebudowany w środku gestu” | S–M |
| **R7** | **Wydzielić `STYLE`** (`overlay.ts:90‑406`, 316 linii, 0 % logiki) + scoping | wyciek `.row` na `.archive-paste .row`, niejawna zależność archiwum od chrome'u panelu | S |
| **R8** | **Wyeksportować `instanceResolver`** do `instances.ts` | nietestowalność rozdzielania duplikatów (trzy gałęzie 0 %) | M |

Kolejność wykonana w poprzedniej rundzie: **4.2 → 4.6 → 4.4 → 4.1 → 4.3**, każda
z testem na przywrócony niezmiennik. **R1–R4 zostają** — to one sprawią, że te
błędy nie wrócą; §4.11 i §4.14 są tego dowodem (jedno pole zapomniane w merge'u,
jedna reguła kontynuacji rozjechana między dwoma plikami). Wszystko za stabilnymi
sygnaturami: **328 testów zielonych**, `tsc --noEmit` czysty.

Proponowana kolejność następnej rundy: **4.11 → (A7, A8 z `UX-POPRAWKI.md`) →
4.12 rozstrzygnąć zrzutem → R5 → 4.13/4.14 przez R1 → testy z §10 → R3 → reszta.**
