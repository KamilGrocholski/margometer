# Tura jest akcją, a nie ciągiem akcji

Status: wdrożone · 2026-08-05

## Problem

Zgłoszenie z gry: „liczenie tur jest nieprawidłowe oraz ciosy i użycia są dziwne,
czy to na serio tak ma być”.

`stats.ts` definiował turę jako **nieprzerwany ciąg akcji tej samej postaci**:

```ts
const beginTurn = (actor: string) => {
  if (actor === lastActor) return;   // ← to jest cały błąd
```

Gra definiuje ją inaczej — pomoc, rozdział „2. System tur” (pełne cytaty
w [`../MECHANIKA.md`](../MECHANIKA.md), wpis „System tur”):

> Tura jest akcją przyznawaną i tylko jedna Postać w danym momencie może uzyskać
> możliwość wykonania tury.

> Pierwszeństwo w wykonaniu tury ma Gracz, którego przewidywany licznik czasu
> trwania ataków po zakończeniu następnej jego tury będzie najniższy.

Drugie zdanie jest sednem: kolejność wynika ze skumulowanego czasu ataku, więc
**szybka postać rutynowo dostaje turę kilka razy z rzędu**. Sklejanie takich tur
w jedną nie jest przybliżeniem — jest odwrotnością reguły gry.

**Pomiar** na jedynej prawdziwej walce, jaka została w repo
(`tests/walka-z-gry.ts`, łowca przeciw odyńcom, zrzut `Engine.battle.update`):

| postać | akcje w logu | tury przed | tury po |
|---|---|---|---|
| Łowcożyr Kazrek | 8 ataków, 0 zapowiedzi | **4** | 8 |
| Odyniec #1 | 2 × krok + 1 cios | 3 | 3 |
| Odyniec #2 | 1 × krok | 1 | 1 |
| Locha | zginęła przed swoją turą | 0 | 0 |
| oś tur | 9 ataków + 3 kroki | **8** | 12 |

Kazrek zadał 2784 obrażeń: panel pokazywał **696/turę** zamiast **348/turę** —
zawyżenie **dokładnie dwukrotne**. Stąd druga połowa zgłoszenia: stopka meldowała
`ciosy 8 · tury 4`, a dymek `Zwykły atak ×8` przy czterech turach. Ciosy i użycia
były policzone dobrze; nie zgadzała się liczba, przez którą je czytano.

**Czego nie zauważył żaden test.** Cały zestaw (594) przechodził tę pomyłkę na
zielono. `tools/synthetic-log.ts` daje jedną akcję na postać na rundę i przeplata
postacie, więc dwie akcje tej samej postaci pod rząd w korpusie syntetycznym nie
powstają. Reguła tur nie miała ani jednej asercji.

**Drugie znalezisko przy okazji.** `ActorStats.turnsLost` i zdarzenie
`{kind: "turn-lost"}` były strukturalnie martwe: `dekoduj` nigdy takiego
zdarzenia nie emitował (jedynym producentem był generator syntetyczny), więc
wiersz „Tury utracone” w dymku pokazywał zero, którego nic nie mogło zmienić.
Komentarz przy nim uzasadniał to tak: „pokazujemy ZAWSZE, także jako zero, bo
brak wiersza czyta się jak brak pomiaru”. Było odwrotnie — to zero czytało się
jak pomiar.

## Rozwiązanie

**Tura = akcja.** `beginTurn` traci warunek i staje się bezwarunkowym
otwarciem tury; `forceTurn` znika, bo przestaje się od niego różnić. Co jest
akcją, rozstrzygają odtąd MIEJSCA WOŁANIA, a nie sama funkcja:

| zdarzenie | tura? | dlaczego |
|---|---|---|
| `attack`, `ability === null`, `strike` | ✅ | zwykły atak jest akcją domyślną |
| `attack`, `ability !== null` | ❌ | turę otworzyła ZAPOWIEDŹ; ciosy do niej należą |
| `attack`, `strike: false` | ❌ | własne obrażenia umiejętności lecą obok ciosu |
| `ability` (`tspell`/`prepare`) | ✅ | „Rzucenie umiejętności” jest akcją |
| `move` (`step`) | ✅ | „Akcja domyślna – podstawowy atak oraz krok do przodu” |
| `dot`, `heal` | ❌ | nie są niczyją akcją |

Predykat otwierający turę przy zwykłym ataku jest **znak w znak tym samym**,
którym liczyło się już użycie zwykłego ataku (`abilityUses`). Nazwany raz
(`zwyklyAtak`) i użyty dwa razy — bo „jedno użycie zwykłego ataku” i „jedna
tura” to ta sama rzecz opisana z dwóch stron. Rozjazd między tymi licznikami był
możliwy tylko przez przeoczenie i teraz nie jest.

**`turnsLost` i `turn-lost` schodzą z drzewa** — pole, wariant `BattleEvent`,
wiersz w dymku, człon w stopce i gałąź w generatorze. Reguła jest w repo zapisana
od dawna, tyle że w innym miejscu (`types.ts`, o polach `*Id`): *pole, którego
nikt nie ustawia, jest gorsze niż jego brak*. Generator zamiast emitować
niemożliwy kształt po prostu milczy przy ogłuszeniu — i to jest wierniejsze,
bo dokładnie tak wygląda utracona tura w protokole.

## Odrzucone warianty

**Odczyt `data.current` z ładunku silnika.** Gra przekazuje w tym samym ładunku,
który już przechwytujemy, ID postaci otrzymującej turę (`Battle.js:444,450` →
`newTurn(data.current)`). To sygnał autorytatywny, nie wnioskowany — i to jest
najmocniejszy odrzucony wariant. Przekreśliły go dwie rzeczy: w naszym jedynym
zrzucie **cała walka (18 komunikatów) przyszła w JEDNYM wywołaniu `update`**,
więc dla walki automatycznej sygnał nie rozstrzygnąłby ani jednej linii; a
`recorder.ts` zapisuje wyłącznie komunikaty, więc dopięcie `current` zmienia
FORMAT nagrań — czyli powtarza „nagrania sprzed tej wersji przepadają”.
**To jest kandydat do powrotu**: oba powody znikną, gdy pojawi się zrzut z walki
turowej PvP, w której porcje przychodzą osobno. Trop stoi w `ROADMAP.md`.

**Sklejanie z wyjątkiem dla zapowiedzi** (czyli stan sprzed tej rundy, tylko
z `forceTurn` rozszerzonym na więcej kluczy). Odrzucone, bo leczy objaw: sklejanie
jest złe nie dlatego, że ma za mało wyjątków, ale dlatego, że reguła gry jest
przeciwna. Każdy kolejny wyjątek zbliżałby do „każda akcja to tura” po jednym
kluczu naraz, tyle że bez powiedzenia tego wprost.

**Zapasowe otwieranie tury dla ciosu z zapowiedzią, gdy bieżąca tura należy do
kogo innego** — ratunek na bufor przycięty w środku umiejętności. Odrzucone, bo
wpada w pułapkę obrażeń nieuchronnych: przy „Fuzji żywiołów” własne obrażenia
umiejętności mają nadawcę równego poszkodowanemu, więc zapas otworzyłby turę
OFIERZE. Strażnik `strike` to łata, ale dwie łaty na jeden zapas znaczą, że zapas
jest zły. Bez niego kwota trafia do tury tła, czyli tam, gdzie agregat już trzyma
„nie wiemy, czyja to tura”.

**Zasilenie `turnsLost` z proców ogłuszenia** (`+stun`, `+stun2*`, `+freeze`,
`+immobilize`). Odrzucone, bo te klucze stoją na komunikacie SPRAWCY i nie mówią,
czyja tura przepadła ani czy przepadła w ogóle. To byłoby zgadywanie — dokładnie
to, czego zakazuje „nie udawaj danych, których log nie ma”.

## Plan wdrożenia

Jeden commit; `bun run check` przechodzi.

1. `stats.ts` — `beginTurn` bez warunku, `forceTurn` i `lastActor` znikają,
   `zwyklyAtak` przy `attack`, `BACKGROUND_ACTOR` wyeksportowany dla testu.
2. Usunięcie `turnsLost` / `turn-lost`: `types.ts`, `stats.ts`, `overlay.ts`,
   `tools/synthetic-log.ts`, `tests/overlay.test.ts`.
3. Testy (niżej), rejestr `MECHANIKA.md`, sprostowania w `DECYZJE.md`
   i `CHANGELOG.md`, trop w `ROADMAP.md`.

## Weryfikacja

Cztery testy w `tests/stats.test.ts` (blok „tura jest akcją”) plus niezmiennik
w przelocie po całym korpusie („każda akcja z logu ma swoją turę na osi”:
`Σ actor.turns === liczba akcji` oraz `timeline.length === akcje + tury tła`).
Ten ostatni wiąże przy okazji dwie liczby, które panel i archiwum podpisują tym
samym słowem „tur”, a które liczy się z dwóch różnych pól.

**Mutacje sprawdzone, wszystkie trzy się zapaliły** (baseline 604/0):

| mutacja | skutek |
|---|---|
| przywrócone `if (actor === lastActor) return` | **3 fail** — materiał z gry, dwa kroki, niezmiennik na `osobliwosci` |
| zdjęty strażnik `ability === null` | **7 fail** — niezmiennik na wszystkich sześciu fixture'ach + jedna zapowiedź |
| zdjęty strażnik `strike` | **1 fail** — własne obrażenia umiejętności |

⚠️ Przy pierwszej mutacji niezmiennik zapala się **wyłącznie na `OSOBLIWOSCI`** —
pięć walk syntetycznych przechodzi ją bez drgnięcia, bo generator nie produkuje
dwóch akcji tej samej postaci pod rząd. Niezmiennik stoi więc na jednym fixture
z sześciu i jest to zapisane w jego komentarzu, żeby nie wyglądał mocniej, niż
jest.

## Co zostaje otwarte

**`add_attacks` zawyża.** Dodatkowe ataki „Podwójnego strzału” policzą się jako
osobne tury, choć pomoc gry mówi wprost, że na liczbę tur nie wpływają. Protokół
ich nie znakuje — `skillId` przypina się do jednego następnego komunikatu — więc
dodatkowy atak jest dla nas nieodróżnialny od zwykłego. Błąd zrobił się
ograniczony (umiejętności z `add_attacks`) zamiast systematycznego (każda para
kolejnych akcji), ale **nie zniknął**, i repo nie ma ani jednej próbki z takiej
walki.

**Tury bez akcji są niewidzialne.** Ogłuszenie nie zostawia śladu w protokole,
więc `turns` jest z tej strony zaniżone i nie umiemy powiedzieć o ile.

**`step` razem z liczbami w jednym komunikacie** — gdyby gra tak wysłała, dekoder
dałby `move` i `attack`, czyli dwie tury zamiast jednej. Nie zaobserwowane,
taniego strażnika nie ma (`BattleEvent` nie niesie numeru komunikatu).

**Dzielniki `turnsFor`/`turnKind` zostają nietknięte.** Otwarta pozycja
`DECYZJE.md §„Na turę”` — sumowalność wierszy do drużyny, procent obok liczby,
`/t` opisujące dwie różne wielkości — to decyzja projektowa o tym, co dzielić
przez co, i ma własną rundę. Zrobiona razem z naprawą licznika uniemożliwiłaby
powiedzenie, która zmiana ruszyła które liczby.

## Zmiany wpisu

- **2026-08-05** — powstał.
