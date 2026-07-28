# SOLID — działanie programu i możliwe poprawki

Analiza **rdzenia**: jak tekst logu staje się statystykami — czytanie danych →
parsowanie → mapowanie → przerabianie → sumowanie. Dwie części:

- **§4 Otwarte usterki działania** — konkretne defekty parsowania/mapowania,
  zweryfikowane na bieżącym kodzie (2026‑07‑25, po commicie `2cabd6d`). Bazują na
  przeglądzie w `ai/README.md` z 2026‑07‑19; te, które sprawdziłem ponownie, są
  oznaczone **[nadal otwarte ✓]**.
  **Stan na 2026‑07‑26: §4.1, §4.2, §4.3, §4.4 i §4.6 są naprawione** (każda
  z testem na przywrócony niezmiennik). Zostają §4.5, §4.7–§4.9 i perf §4.10.
- **§5–§9 Dług architektoniczny (SOLID)** — refaktory, które czynią całe KLASY
  tych usterek niemożliwymi, a nie łatanymi po fakcie.

Zasada nadrzędna: **żaden refaktor nie zmienia granic** (`LogSource`,
`RosterSource`, `parse`, `aggregate`, `BattleStats`). 289 testów to siatka
bezpieczeństwa — zielone przed i po każdym kroku.

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
nowym parserem (pomiar w `ai/README.md`: ~2,6 tys. znaków surowca vs ~4,5 tys.
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
  (`ai/README.md` „Sprawdzone i odrzucone”). Refaktor musi je utrzymać.

## 3. Co już naprawił commit `2cabd6d` (kontekst)

Trwały szkielet okna + trwałe węzły sterowania odtwarzaniem + `pointerup`‑drążenie
usunęły: gubione klikanie podczas odtwarzania, migający pasek scrolla, mrugające
ostrzeżenie o nierozpoznanych liniach w `frameStats`. **Częściowo** złagodziły
„pełną przebudowę DOM przy każdej linii” (§4.10): korpus już nie powstaje od zera.
**Nie objęły** przeciągania nagłówka (ta sama klasa błędu — patrz `UX.md A1`).

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

### 4.5 Leczenie gubi procent życia 🟡 [nadal otwarte ✓]
`parser.ts:51‑62` łapią `(\d+%)` celu, ale `BattleEvent.heal` (`types.ts:92`) nie
ma pola HP, więc `stats.ts` woła `resolve(target, null)` i przy zdublowanych
nazwach leczenie lgnie do „ostatnio aktywnej” instancji. Dane są w logu — parser
je wyrzuca. Dodatkowo leczenie podnosi HP, co łamie założenie „życie nie rośnie”,
na którym stoi rozdzielanie duplikatów. **Fix:** dodać `targetHpPct` do `heal`,
przekazać do `resolve`. **S** (samo pole), rozdzielanie duplikatów przy leczeniu —
osobny temat.

### 4.6 `maxHit` wlicza własne obrażenia umiejętności 🟡 [NAPRAWIONE 2026‑07‑26]
`stats.ts:536‑537` — `total` z `landed` liczone jest dla KAŻDEGO zdarzenia,
w tym `strike: false` (własne obrażenia umiejętności), a `types.ts` definiuje
`maxHit` jako „najsilniejszy pojedynczy **cios**”. W fixture'ach bez wpływu
(12 vs 1098), przy silniejszej Fuzji zmieni wynik. **Fix:** liczyć `maxHit` tylko
gdy `event.strike`. **S.**

### 4.7 `sourceHpPct: 0` jako zaślepka czytane jest jako śmierć ⚪ [utajone]
`parser.ts` wystawia 0 dla własnych obrażeń umiejętności (log nie podaje HP
rzucającego), a `stats.ts` traktuje `hpPct <= 0` jako zgon → mag kończy walkę na
liście poległych. Dziś martwe (`deaths` czyta tylko odłączony `renderAxis`),
ożyje przy podpięciu osi tur. **Fix:** `sourceHpPct: number | null` —
`observeDeath` już obsługuje `null`. **S.**

### 4.8 Tylko męskie formy czasownika ⚪ [nadal otwarte ✓ — do potwierdzenia w grze]
`parser.ts:33/35/69` — `uderzył(?:\(a\))?`, `otrzymał…`, `zrobił…`. Fixture'y mają
samych właścicieli mężczyzn, więc nie wiadomo, czy gra odmienia WŁASNĄ postać wg
płci. Jeśli tak — log postaci kobiecej rozsypie się w całości. Niespójność jest
wewnętrzna: `RE_VICTORY`/`RE_DEFEAT` obsługują już `-a/-o/-y`. Awaria byłaby
głośna (`unknown`), nie cicha. **Fix:** dopuścić żeńskie formy w rdzeniu regexów.
**S** — ale najpierw potwierdzić próbką z gry.

### 4.9 Drobne luki parsera ⚪ (wg przeglądu — do reweryfikacji)
- Regexy leczenia bez opcjonalnej kropki końcowej → `Przywrócono … X(93%).` → `unknown`.
- `"X otrzymuje 15 punktów many."` (dwa słowa po liczbie) poza `RE_INFO`.
- Brak obsługi separatora tysięcy i strażnika `applied <= raw` (format nie
  potwierdzony — fixture'y ≤ 4 cyfry).
- `procs` zbierają przyrosty zasobów (`"14 energii"`), choć `types.ts` definiuje
  je jako efekty z ekwipunku.
- `parser.ts:131` — `.replace(/ /g, " ")` podmienia spację na spację (miał być NBSP).

### 4.10 Pełne przeparsowanie bufora przy każdej linii 🟡 [częściowo — perf]
`index.ts` — każda emisja parsuje CAŁY bufor. Log 1425 linii narastająco: ~12 s
łącznie, koszt emisji rośnie 6,6 → 13,2 ms. Do tego `showTip` woła
`getBoundingClientRect()` tuż po podmianie poddrzewa (wymuszony layout na linię).
Commit `2cabd6d` usunął przebudowę CAŁEGO panelu, ale reparse zostaje.
**Rekomendacja:** dla realnych walk (≤ kilkaset linii) nieistotne — **nie
optymalizować na zapas**. Reparse to cena idempotencji, która jest wartością.

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

**Dobre, nie ruszać:** `instanceResolver` (samodzielny, dwa przebiegi,
`{resolve, seats, ambiguousKeys}`) i `estimateMaxHp` jako niezmiennik kontrolny.

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

## 7. Sumowanie sesji — `src/session.ts`

**DRY — dwa razy „ta sama walka?”.** 🔴 `splitFights` (zdarzenia) vs `splitLines`
(tekst, `recorder.ts`); `continues` w OBU plikach; pętla dopasowania od końca
skopiowana w `Session.update` i `Recorder.capture`. §4.4 tkwi w OBU kopiach —
naprawa musi trafić dwa razy albo się rozjadą.
- **Fix (🔴, M): wspólny `FightTracker`** — jedno „podziel bufor i dopasuj od
  końca”, sparametryzowane jednostką (zdarzenie/linia). Session i Recorder stają
  się cienkimi konsumentami; §4.4 naprawia się raz.

**OCP/DRY — ręczny `mergeStats` wylicza pola z palca.** 🔴 (`session.ts:98‑118`)
Nowe pole po cichu wypada z sumy — **tak przepadło `abilityUses`** (jest
test‑strażnik, `overlay.test.ts:339`). To ten sam płaski `ActorStats` (30+ pól),
który każe dotykać trzech miejsc na jedno pole (init/projekcja/merge).
- **Fix (🟡, M): deklaratywny merge** — mapa `{ pole: 'sum'|'max'|mergeSources }`,
  sumowanie w pętli po deskryptorach. „Zapomnienie pola” staje się niemożliwe,
  a nie łapane testem po fakcie.

## 8. Czytanie danych i widok (skrót)

- **`source.ts` — dobry SRP.** Znacznik żywiołu (``) przemycany w tekście
  to świadomy kompromis (parser jest tekstowy, by łykać też log wklejony). Testy
  pilnują, że nie wycieka — zostawić.
- **`overlay.ts` — klasa‑Bóg (~2300 linii).** 🟡 Rendering + stan + drag/resize +
  trwałość + schowek + dymek + replay + formatery. Kandydaci do wydzielenia:
  `PanelState`, `TooltipController`, `ReplayControls` (już strwalone — naturalny
  osobny obiekt), formatery. **Koszt L, priorytet niski** — rozbijać przy nowych
  widokach, nie profilaktycznie. `UX.md A1`/`A2`/`A5` to tańsze, punktowe fixy tu.

## 9. Martwy / uśpiony kod (dług czytelności)

Wg przeglądu (do reweryfikacji przed usunięciem): `renderAxis`, `renderFireFocus`,
`turnRows` (~103 linie + CSS), metryka „Tury” nieosiągalna z UI (dwa `test.skip`),
`Session.total()`/`mergeStats` liczone i nigdy niepokazywane (brak zakładki
zakresu), `StaticRosterSource`, `OTHER_LABEL`, `Session.reset()` (brak przycisku),
`estimateMaxHp` (tylko testy), niesprzątany `setInterval` w `boot()`.
Usuwać dopiero po decyzji „czy to porzucone, czy niedokończone” — część (oś tur,
sesja) to funkcje wstrzymane, nie śmieci.

---

## 10. Skrót — kolejność prac

**Naprawy działania — WSZYSTKIE ZROBIONE (2026‑07‑26):**

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
| R1 | `FightTracker` (jedno dzielenie+dopasowanie walk) | dubel §4.4, DRY session/recorder | M |
| R2 | `ActorAccumulator` (jeden `recordHit`) | §4.1/§4.6 i przyszłe pominięcia | M |
| R3 | Deklaratywny `mergeStats` | „zapomniane pole” (jak `abilityUses`) | M |
| R4 | Tablica reguł parsera | §4.3 i OCP nowych formatów | S–M |

Kolejność wykonana: **4.2 → 4.6 → 4.4 → 4.1 → 4.3**, każda z testem na
przywrócony niezmiennik. **R1–R4 zostają** — to one sprawią, że te błędy nie
wrócą (§4.4 nadal wymagał naprawy w DWÓCH plikach, bo R1 nie jest zrobiony).
Wszystko za stabilnymi sygnaturami: 301 testów zielone, `tsc --noEmit` czysty.
