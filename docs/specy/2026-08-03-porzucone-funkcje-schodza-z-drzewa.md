# Trzy funkcje porzucone w połowie schodzą z drzewa

Status: wdrożone · 2026-08-03 · `a37ab9f`…`88a4f39`

## Problem

Rejestry (`AUDYT.md`, `SOLID.md`, `ROADMAP.md`) trzymały pozycje, których nie
dało się ruszyć kodem, bo czekały na decyzję właściciela repo. Wszystkie trzy
opisywały ten sam kształt: **funkcję porzuconą w połowie, która nic nie robi,
ale kosztuje.**

- **Suma sesji** (`AUDYT‑6`, `ROADMAP ⏸`). `mergeStats` to było ~100 linii
  liczonych przy każdej linii logu dla widoku, którego nie ma. Jedyne wyjście
  do użytkownika: klucz `session` w skopiowanym JSON‑ie, przy przycisku, którego
  `aria-label` mówi tylko „Kopiuj statystyki (JSON)".
- **Oś tur i skupienie ognia** (`AUDYT‑25`, `ROADMAP ⏸`). Renderery zeszły
  z drzewa 2026‑07‑31, ale `stats.deaths` i `stats.matrix` liczyły się dalej —
  od tamtej pory bez ani jednego czytelnika w `src/`.
- **Metryka „Tury"** (`ROADMAP ⏸`). `Metric` niósł czwartą wartość, której
  `METRICS` nie wystawiał, więc z UI nie dało się jej wybrać.

Koszt nie jest hipotetyczny i to jest sedno. Sama suma sesji wygenerowała trzy
usterki: `§4.11` (`dealtToBy` zapomniane w `mergeStats` ORAZ w `copyActor`),
`AUDYT‑37` (`side`, ta sama klasa) i `AUDYT‑5` (jeden typ dla walki i dla sumy).
**Żadna nie objawiła się użytkownikowi** — bo nie było jak. Każdą znalazł audyt
i każda kosztowała rundę. Refaktor `R3` istniał wyłącznie po to, żeby ta klasa
nie wracała.

## Rozwiązanie

Decyzja właściciela repo: wszystkie trzy porzucone, kod schodzi z drzewa.
`AUDYT‑6` proponował odwrotnie — najpierw spec `UX.md §8`, potem kod — więc
**wykonanie odbiegło od propozycji i jest to przy wpisie powiedziane wprost.**

Kolejność jest wymuszona zależnościami, nie gustem: suma sesji najpierw, bo to
ona trzyma `SessionStats` i drugi argument `Overlay.render`; `deaths`/`matrix`
potem, bo są niezależne; metryka na końcu, bo dotyka najwięcej gałęzi `if`.

Do tego rzeczy, które ta sama runda odsłoniła jako tanie:

- **`SOLID §9`** — reszta martwego kodu, w tym trzy ostatnie `Record<string, any>`
  (`GameGlobals` w ich miejsce; w `src/` nie ma odtąd ani jednego `any`).
- **`SOLID §4.9`** — `procs` zbierały przyrost własnej energii napastnika
  i pokazywały go w dymku jako efekt sprzętu.
- **`UX §4.2` i `§4.1`** — dwa jedyne postulaty `🎯`, wskazane przez sam `UX.md`
  jako największy zwrot za gest.

Skala tego, co zniknęło: **`src/session.ts` 362 → 88 linii**,
`tests/session.test.ts` 464 → 156.

## Odrzucone warianty

**Napisać `UX.md §8` i zbudować zakładkę sesji.** To była propozycja z `AUDYT‑6`
i miała mocny argument: licznik obrażeń między walkami odpowiada na pytania,
na które jedna walka nie odpowie (godzina grindu, procki sprzętu przy
kilkunastu walkach). Odrzucone decyzją właściciela repo. **Wariant odrzucony
z powodu, który może zniknąć** — gdyby wrócił, kod stoi w `a37ab9f`.

**Zostawić `deaths`/`matrix` „na wszelki wypadek", bo oś tur ma wrócić.** Tak
brzmiał `AUDYT‑25` przez trzy dni i było to szczere. Odrzucone, bo to właśnie
taka pozycja najdłużej udaje plan: renderery nie kosztowały nic (były
w historii), ale ich DANE liczyły się przy każdej walce, jechały przez
`aggregate`, siedziały w typie i w JSON‑ie.

**Zostawić `"turns"` w typie `Metric` — nie przeszkadza.** Odrzucone: typ, który
obiecuje czwartą zakładkę, każe przy każdej zmianie w `overlay.ts` odpowiadać
na pytanie „a co z turami?". Cztery gałęzie `if` istniały wyłącznie po to.

**`splitRawFights` — skasować razem z testami.** `SOLID §9` wskazywał ją jako
istniejącą wyłącznie dla testów. Odrzucone, bo testowała PRAWDZIWĄ logikę
(`splitLines`, wołane przez `Recorder.capture`) i skasowanie zabrałoby realne
pokrycie dzielenia bufora. Zamiast tego wyeksportowany jest `splitLines`,
a sklejanie linii zjechało do testu.

**Szeroki wzorzec na zasoby (`/(energii|many)$/`).** Kusząco prosty i o jedną
literę od poprawnego. Odrzucone: połknąłby `Zniszczono N energii` (×8)
i `Zniszczono N many` (×3), które opisują zabranie zasobu CELOWI i są
prawdziwym efektem ciosu. Wąski wzorzec zostawia nieznany format WIDOCZNY
w dymku; szeroki połyka go po cichu.

**Okruszek jako trwały węzeł, ale nadal przez `replaceChildren`.** Prościej,
bo bez zmiany w `render()`. Odrzucone: `replaceChildren` zdejmuje węzeł
z drzewa i wstawia z powrotem, a to gubi `:hover` — czyli dokładnie to, co
miało zostać naprawione.

## Plan wdrożenia

Osiem commitów, każdy przechodzący `bun run check` osobno:

1. `docs(specy)` — spec parsera jako projekt (`6922d39`)
2. `fix(ci)` — strażnicy wydania z drzewa roboczego (`fb264b3`)
3. `refactor(session)` — suma sesji (`a37ab9f`)
4. `refactor(stats)` — `deaths` i `matrix` (`b411505`)
5. `refactor(overlay)` — metryka „Tury" (`51a3222`)
6. `refactor(src)` — martwy kod `§9` (`74b4804`)
7. `fix(parser)` — `§4.9` (`5e56d50`)
8. `feat(overlay)` — `UX §4.2` i `§4.1` (`88a4f39`)

## Weryfikacja

**Kompilator zamiast grepa.** Po usunięciu pętli archiwizującej `noUnusedLocals`
zgłosił `continues()`, `signatureOf()` i typ `ActiveFight` naraz — nie było to
do przewidzenia z lektury. Tak samo przy metryce: zdjęcie `"turns"` z typu dało
cztery „no overlap", a grep po `turns` daje w tym pliku kilkanaście trafień
(`actor.turns`, `turnsLost`, `fightTurns`).

**Niezmienniki po całym korpusie** (21 zrzutów tekstowych) po każdym kroku
ruszającym liczby: `Σ dealtBy == damageDealt`, `Σ takenByType == damageTaken`,
`Σ zadane + DoT bez sprawcy == Σ przyjęte`, `Σ timeline == Σ zadanych`,
`damageBlocked ≤ damageAbsorbed`, `superCrits ≤ crits` — zero rozjazdów, zero
nieznanych linii.

**Testy potrafią paść — sprawdzone mutacją dziewięć razy.** Najważniejsza
z nich jest ta, która NIE zapaliła: usunięcie czyszczenia odznaki profesji
w trwałym okruszku przeszło, bo pierwsza wersja testu sprawdzała przejście
postać → postać, gdzie `markIfCharacter` po prostu nadpisuje atrybut. Test był
zielony i pusty. Przepisany na przejście postać → UMIEJĘTNOŚĆ zapala się
poprawnie. **Wniosek: mutacja nie jest formalnością — złapała tu realną dziurę
w teście napisanym tego samego dnia.**

**Pomiar.** `update()` liczył `aggregate` dla KAŻDEJ walki w buforze, bo
zamknięte trzeba było doliczyć do sumy. Bufor z 5 walkami i 2260 liniami:
**2,60 → 1,42 ms** (średnia z 20 przebiegów po 5 rozgrzewkowych), w wątku gry,
przy każdej linii logu.

**Prawdziwy render, nie tylko asercje.** Dymek bossa z
`2026-07-31_druzyna-vs-hildur-zwyciestwo` daje `Gracz A 87 810 (26%)`,
`Gracz B 34 584 (10%)`, `Gracz C 27 945 (8%)`, `+ 7 pozycji
niżej`, okruszek `‹ skład | Hildur Muza Śmierci` z `data-prof="M"` — i ani
jednego wiersza z energią w „Efektach w ciosach".

Zestaw: 774 → 764 zielonych (odeszły testy usuniętego kodu, doszły nowe),
`tsc --noEmit` czysty.

## Co zostaje otwarte

- **`SOLID §4.12`** — zakładałem, że zamknie się razem z `continues()`.
  **Nie zamknęło.** Zniknęła gałąź „ogon bez nagłówka to kontynuacja", ale
  `current()` dalej bierze ostatnią walkę przeliczoną z bufora, więc krótszy
  bufor to niższe liczby (przeliczone: `2986 → 1449 → 1143`). Zostaje jedno
  pytanie o FAKT: czy okno walki ma sufit liczby komunikatów. Odpowiada na nie
  sonda w kliencie, nie kolejny zrzut — przy 1373 liniach gra nie przycinała.
- **Dymek ma pięć sekcji** i przy postaci z długą listą użyć i efektów robi się
  wysoki. Gdyby zaczął wychodzić poza ekran, pierwszym kandydatem do cięcia są
  „Efekty otrzymane", nie TOP‑3 — ale dziś nie ma pomiaru, który by to
  rozstrzygał.
- **`overlay.ts` urósł, nie zmalał** — ponad 3100 linii. `SOLID §8` ma gotowy
  podział; `R5`, `R8` i to cięcie są teraz na szczycie listy.
- **`R4`** (parser od zera) — spec ze statusem `projekt`, osobna decyzja.
- **`UX-POPRAWKI`**: `B2`, `B3`, `B6`, `B7`, `B9`–`B12`.
- **`AUDYT‑52`** — zrzuty w `README`, wymaga wejścia do gry.
- **`DECYZJE.md` „Na turę"** — trzy podpunkty, w tym ten, który sam dokument
  nazywa najpoważniejszym (wiersze nie sumują się do drużyny przy Zadanych).
  Decyzja projektowa, nie łatka.

## Zmiany wpisu

- **2026-08-03** — powstał po wykonaniu rundy, nie przed. Runda była
  porządkowa i wynikała z decyzji, nie z projektu; spec zapisuje ROZSTRZYGNIĘCIA
  i to, czego one kosztowały.
