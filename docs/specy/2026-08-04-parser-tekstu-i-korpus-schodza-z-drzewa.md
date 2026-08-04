# Parser tekstu i korpus schodzą z drzewa

Status: wdrożone · 2026-08-04 · (drzewo robocze, przed commitem)

## Problem

Repo miało **dwa odczyty tej samej walki** i to była decyzja z tego samego dnia:
`src/parser.ts` czytał zdania z okna walki, `src/protokol.ts` — surowy protokół
silnika. Drugi powstał jako **czujka**, nie zamiennik, bo bez walki zapisanej
obiema drogami nie dało się odróżnić „nowe liczby są lepsze" od „nowe liczby są
inne" (`2026-08-04-protokol-jako-drugie-zrodlo-zdarzen.md`).

Walka zapisana obiema drogami przyszła tego samego dnia i rozstrzygnęła to na
korzyść protokołu. **Protokół niesie rzeczy, których w tekście po prostu nie
ma:**

- `id` po OBU stronach każdego zdarzenia — rozdzielanie instancji o tej samej
  nazwie jest darmowe, zamiast być heurystyką po spadkach życia;
- żywioł jako KLUCZ, nie jako klasa CSS — w samym tekście żywiołu nie ma wcale,
  stąd brał się cały drugi format fixture'a (`log.html`);
- rozbite składniki redukcji (`+acdmg`, `-legbon_facade`) zamiast jednej różnicy;
- brzmienia z `window._t`, czyli z gry, w języku klienta.

Tekst był rekonstrukcją tego wszystkiego ze zdań. Utrzymywanie obu dróg
kosztowało: 1 029 linii parsera, 192 linie odczytu DOM, cztery pliki testowe
i **dwa formaty fixture'a na walkę**.

Drugie pytanie postawił właściciel repo po usunięciu parsera: *„to po co mi
fixtures i rzeczy z tym związane?"* — i było zasadne. Po skasowaniu parsera
korpus `tests/fixtures/new-engine/*/zdarzenia.json` (1,5 MB, 25 walk, 4 904
zdarzenia) stał się **zamrożonym wyjściem kodu, którego nie ma**: nie dawało się
go zregenerować ani sprawdzić przeciw grze, a jeśli tamten parser czytał coś źle,
błąd był tam zamrożony i testy sprawdzały się przeciw niemu.

## Rozwiązanie

Dwie rundy, obie do końca.

**1. Parser tekstu w całości.** Znika `src/parser.ts`, `src/source.ts`, cztery
pliki testowe, oba formaty tekstowe fixture'a, czujka rozjazdu (`rozjazdy()`
i pasek w panelu), `zrodloPanelu`, `Session.update(text)` i `DomLogSource`.
`startKontrola` zmienia nazwę na `start` — przestała być czujką, jest odczytem.
`boot` przestaje szukać okna walki w DOM: bez `Engine` panel i tak stanąłby
pusty, więc rysowanie go obiecywałoby licznik, którego nie ma.

Nagrania przechodzą na format `v: 2` — `{komunikaty, sklad}` zamiast tekstu.
**Nagrania graczy sprzed tej wersji przepadają** i jest to świadome; alternatywą
było trzymanie całego parsera wyłącznie dla archiwum.

**2. Cały `tests/fixtures/`.** Materiał testowy powstaje odtąd W KODZIE:

- `tests/zdarzenia.ts` — pojedyncze `BattleEvent` budowane wprost;
- `tests/korpus.ts` — walki dla niezmienników: pięć z generatora
  (`tools/synthetic-log.ts`, przepisanego z tekstu na `BattleEvent[]`) plus jedna
  ręczna z kształtami, których generator nie produkuje;
- `tests/walka-z-gry.ts` — **jedyny materiał nie‑syntetyczny**: 18 komunikatów
  i skład z prawdziwego zrzutu `Engine.battle.update`. Mieści się w pliku
  źródłowym, więc plik danych nie był do niczego potrzebny.

Podglądy w `dist/` przestają wstawiać log w DOM: seed udaje `Engine.battle`,
czeka aż dodatek owinie `update`, i dopiero wtedy wpuszcza komunikaty. Idą więc
dokładnie tą drogą co gra, razem z wyścigiem o podpięcie.

## Odrzucone warianty

**Przenieść `src/parser.ts` do `tests/` jako aparaturę orakulum.** To był mój
zalecany wariant i został odrzucony przez właściciela repo. Orakulum
(`tests/orakulum.test.ts`) porównywało `dekoduj(komunikaty)` z
`parse(odtworz(komunikaty))` — dwa rozłączne kody na tym samym wejściu — i to ono
złapało jedyny prawdziwy błąd dekodera (leczenie z pustą drugą stroną
przypisywane sobie, `d4be27e`). Przeniesienie kosztowałoby ~1 600 linii kodu
utrzymywanego w testach; usunięcie kosztuje **jedynego świadka dekodera spoza
repo**. Wybrano drugie. To jest wariant do POWROTU, gdy ktoś napisze drugiego,
niezależnego czytelnika komunikatów.

**Zamrozić wynik orakulum jako fixture.** Uruchomić je ostatni raz, zapisać
oczekiwane `BattleEvent[]`, skasować parser. Odrzucone razem z powyższym — i tak
by nie przeżyło rundy 2, a pilnowałoby wyłącznie tego, że dekoder nie zmienia
zdania, nie że czyta dobrze.

**Zostawić `zdarzenia.json` i skasować resztę fixture'ów.** Zachowałoby 143 testy
agregatu na 25 prawdziwych walkach. Odrzucone przez właściciela repo w tej samej
odpowiedzi, którą wybrano „całe `tests/fixtures/`" — po przedstawieniu wprost, że
to 88% objętości katalogu i jedyny materiał o niesprawdzalnej jakości.

**Przepisać 61 testów panelu na materiał syntetyczny zamiast je kasować.**
Sprawdzone praktycznie: po podpięciu generatora pada 73 ze 168 testów, bo
asercje wymieniają NAZWY postaci i LICZBY z konkretnych walk („ranking ma
dokładnie te trzy nazwy", „pasek ma szerokość 89/2897"). Przepisanie dałoby
asercje, w których panel sprawdza się przeciw temu, co sam policzył z danych,
które sami wyprodukowaliśmy — zielone z definicji. Skasowane z zapisem strat.

**Odbudować `dist/preview-20.html` na syntetycznych komunikatach.** Podgląd
20 postaci potrzebowałby zakodowania kluczy krytyka, bloku, proców i leczenia
tak, jak robi to gra. Zgadnięcie choćby jednego dałoby podgląd, który wygląda
poprawnie i kłamie. Odłożone do drugiego zrzutu z walki grupowej.

## Plan wdrożenia

Trzy commity, każdy przechodzi `bun run check` osobno:

1. **`refactor(odczyt): parser tekstu schodzi z drzewa`** — `src/`, testy
   przepięte na protokół, korpus tekstowy usunięty, czujka rozjazdu wycięta.
2. **`refactor(testy): materiał testowy powstaje w kodzie, nie w plikach`** —
   `tests/fixtures/` w całości, `tests/korpus.ts` i `tests/walka-z-gry.ts`,
   podglądy w `build.ts` na udawanym silniku.
3. **`docs: rejestry przestają opisywać parser i korpus, których nie ma`** —
   `AGENTS.md`, `CLAUDE.md`, `.claude/rules/`, osiem plików w `docs/`.

`docs/specy/` i `docs/AUDYT.md` zostają nietknięte — to zapis historyczny.

## Weryfikacja

**Brama:** `bun run check` — **914 → 557 pass, 0 fail**, build zielony.

**Że testy potrafią paść.** Trzy mutanty na nowym kodzie archiwum, wszystkie
złapane: `summarize` bez składu (2 testy padły), `frameStats` bez składu (2),
klucz cache'u bez rozmiaru (3). Zmutowano też `przedluza` w nagrywarce —
test „podmieniony komunikat w środku to nowa walka" zapala się na samej
długości listy.

**Prawdziwy błąd znaleziony po drodze:** archiwum liczyło `aggregate()` **bez
składu**, więc nagraniom ginęły `side` i `inRoster` — filtr „nasi / obcy"
w podglądzie nie miał czego filtrować, a postać, która nic nie zdążyła zrobić,
wypadała z listy zamiast stać na zerach.

**Sonda:** `bun tools/walka.ts --rozbij` na prawdziwym zrzucie przechodzi
i produkuje dwa pliki zamiast trzech — `log.html` nie powstaje.

## Co zostaje otwarte

**Największa luka: dekoder nie ma świadka spoza repo.** Wszystkie testy pytają
repo o zgodność z samym sobą — a taki zestaw był zielony wtedy, gdy `mergeStats`
gubiło sumy (`AUDYT‑6`). Odbudowa wymaga drugiego, niezależnego czytelnika
komunikatów i nie jest pracą na jedną rundę.

**Zaszyte identyfikatory `_t` nie są z niczym porównywane.** Dwa testy pilnowały,
że nasza kopia zgadza się z assetem gry; jeden miał w nagłówku „NAJWAŻNIEJSZY
TEST TEGO PLIKU". Rozjazd daje w panelu klucz zamiast zdania, **po cichu**, bo
`zdanie()` na nieznanym identyfikatorze zwraca `null`, a nie błąd.
`bun tools/slownik.ts --zamroz` odtwarza tabelę; brakuje testów.

**Materiał z gry: jedna walka.** Nie ma w niej bloku, uniku, absorpcji z własnym
kluczem ani zapowiedzi umiejętności. Lista zakupowa stoi w `docs/ROADMAP.md`.

**Kształt, o którym nie pomyśleliśmy, nie ma jak wpaść do materiału, który sami
budujemy.** Korpus łapał je sam z siebie; `tests/korpus.ts` nie złapie żadnego,
dopóki ktoś go nie dopisze.

**`dist/preview-20.html`** — patrz odrzucone warianty.

**`UX-POPRAWKI B2`** (suwak po turach) — koszt wyceniony w kategoriach parsera
i wymaga przeliczenia; odtwarzanie idzie dziś po komunikatach, a jeden komunikat
niesie cały blok akcji.

## Zmiany wpisu

- **2026-08-04** — powstał, po wykonaniu obu rund. ⚠️ Napisany PO fakcie, wbrew
  regule z `README.md` tego katalogu („gdy zmiana wymaga zaprojektowania przed
  napisaniem kodu"). Rundy były projektowane w planie poza repozytorium — czyli
  dokładnie w trybie, który ten katalog miał zastąpić. Odrzucone warianty wyżej
  odtworzone z rozmowy, w której zapadły; bez tego przeżyłby wyłącznie wynik.
