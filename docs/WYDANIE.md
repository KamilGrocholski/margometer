# Wydanie — jak wypuścić nową wersję

Odpowiada na dwa pytania: **pod jakim numerem** i **co trzeba zrobić, żeby
zmiana z repo dotarła do gracza.** Trzy kroki robi człowiek, resztę robi CI
na tagu.

Do 2026‑08‑03 tej odpowiedzi nie dało się przeczytać w jednym miejscu — stała
rozbita na komentarz w `CHANGELOG.md`, jedno zdanie w `TOOLING.md`, komentarze
w `release.yml` i wiedzę właściciela repo. To nie jest problem porządkowy:
**tak właśnie wyglądał incydent z 2026‑08‑03**, opisany niżej.

---

## Który numer

Odpowiada na pytanie zadawane PRZED pierwszym krokiem: **0.4.0 czy 0.4.1.**
Do 2026‑08‑03 stało tu pół zdania doklejone do kroku 1 — i to za mało, skoro
pytanie wróciło.

### Metodologia: SemVer

[Semantyczne wersjonowanie 2.0.0](https://semver.org/lang/pl/). Ten sam numer
stoi w `package.json` (bez `v`) i w tagu (z `v`) — `release.yml` porównuje jedno
z drugim i przerywa przy rozjeździe.

Bez sufiksów `-alpha.N`, choć projekt jest w alfie; powód i sprawdzenie, że
Tampermonkey by je uniósł — [`TOOLING.md`](TOOLING.md) → „Faza wczesna”.

### W fazie `0.x` trzecia cyfra nie jest używana

**Każde wydanie widoczne dla użytkownika to `0.MINOR + 1`.** Po `0.4.0` idzie
`0.5.0`, także gdy w środku są same poprawki. **`0.4.1` w tej fazie nie
powstaje** i nie jest to przeoczenie.

Powód: w `0.x` rozróżnienie „nowość czy poprawka” **nic graczowi w numerze nie
daje** — SemVer przy zerowym MAJOR-ze nie obiecuje zgodności w ogóle
(„Major version zero (0.y.z) is for initial development. Anything MAY change at
any time.”), więc `0.4.1` nie znaczyłoby „bezpieczniejsza aktualizacja niż
`0.5.0`”. Informację o rodzaju zmiany niesie CHANGELOG, gdzie każdy wpis jest
jawnie **Nowość** / **Zmiana** / **Poprawka** — a tam widać ją per zmiana,
nie zlepioną w jedną cyfrę na całe wydanie. Numer nie musi tego powtarzać,
a decyzja podejmowana przy każdym wydaniu kosztuje.

### Numer, który nie wyjechał, jest wolny

Dopóki taga `vX.Y.Z` nie ma, ten numer **nie jest niczyj**: nikomu nic pod nim
nie obiecano, więc wpisy w jego sekcji wolno dopisywać, poprawiać i zlewać,
a datę przestawiać. Po tagu sekcji się nie rusza — ktoś już to wydanie ma.

Sprawdzenie zajmuje sekundę i robi się je PRZED podbiciem numeru:

```bash
git tag -l                 # czy numer z package.json ma tu swój tag
git describe --tags        # v0.3.0-22-g… → 22 commity po ostatnim wydaniu
```

Tak wygląda stan z 2026‑08‑03: `package.json` niesie `0.4.0`, `CHANGELOG.md` ma
sekcję `## [0.4.0]`, a jedyny tag to `v0.3.0`. Następne wydanie jest więc
**`v0.4.0`** — nie `0.4.1` i nie `0.5.0`. Podbicie zostawiłoby w historii dziurę
po wersji, której nikt nigdy nie miał, a przy zgłoszeniu „mam 0.4.0” nie dałoby
się odpowiedzieć, co ono zawierało. Cała ta sytuacja opisana jest niżej,
w „Co się psuje cicho”.

### Wydanie przerwane przez CI też nie podbija numeru

`tools/changelog.ts` z kodem 1, rozjazd tag ↔ `package.json`, brama, która nie
przeszła — **usuń tag, popraw, wypchnij ten sam numer.** Numer zużywa dopiero
wydanie, które powstało; tag bez wydania nic nie obiecał.

### Po `1.0.0` — zwykły SemVer

MAJOR, gdy pęka coś, na czym gracz polega: zapisane ustawienia, nazwy, układ
panelu. MINOR na nową funkcję, PATCH na samo naprawianie. Dopiero wtedy trzecia
cyfra zaczyna cokolwiek znaczyć — i dopiero wtedy warto przy każdym wydaniu
zdecydować, która to.

---

## Trzy kroki, które robi człowiek

Jeden commit, wzorem `143f43d` (`build(release): 0.4.0 — numer wersji dogania
zawartość`), potem tag.

### 1. Przenieś `[Niewydane]` pod numer wersji

W `CHANGELOG.md`: nagłówek `## [Niewydane]` zamienia się na
`## [X.Y.Z] — RRRR-MM-DD`. Wpisy zostają takie, jakie są — były pisane przy
okazji zmian i dla użytkownika, więc nie ma czego przepisywać. Skąd wziąć sam
numer — „Który numer” wyżej.

> Pominięty krok jest GŁOŚNY: `tools/changelog.ts X.Y.Z` nie znajdzie sekcji
> `## [X.Y.Z]`, wyjdzie z kodem 1 i wydanie nie powstanie. Tag zostanie, ale bez
> wydania — trzeba go wtedy usunąć i wypchnąć ponownie.

### 2. Podbij `version` w `package.json`

Ten sam numer, bez `v`. Stąd bierze go banner userscripta (`build.ts`) i po nim
Tampermonkey poznaje, że jest co pobrać.

> Pominięty krok jest GŁOŚNY: `release.yml` porównuje tag z `package.json`
> i przerywa. Powód, dla którego to sprawdzenie w ogóle istnieje: numer żył
> tu kiedyś osobno od rzeczywistości i zbudowany plik ogłaszał `0.1.0` przez
> kilkanaście commitów funkcjonalnych.

### 3. `bun run check`, commit, tag

```bash
bun run check                       # brama — ta sama, którą przejdzie CI
git commit -am "build(release): X.Y.Z — …"
git tag vX.Y.Z && git push origin vX.Y.Z
```

Tag musi wskazywać commit, w którym `package.json` ma **już** nowy numer —
inaczej sprawdzenie z kroku 2 zapali się mimo poprawnej edycji.

> Pominięty krok jest CICHY i to jest ten kosztowny. Zmiana leży w repo,
> naprawiona i opisana, a nikt jej nie dostaje. Jedyne, co o tym mówi, to
> adnotacja w podsumowaniu każdego przebiegu CI („jest co wydać”) — patrz niżej.

---

## Co robi CI samo

`.github/workflows/release.yml`, wyzwalany tagiem `v*`:

1. **`bun run check`** — wydanie przechodzi tę samą bramę co każdy commit.
   Wydanie, które nie przechodzi testów, jest gorsze niż brak wydania: trafia
   do ludzi.
2. **Tag = `package.json`** — inaczej stop.
3. **Treść wydania** — `bun tools/changelog.ts X.Y.Z` wycina sekcję tej wersji
   z `CHANGELOG.md` i skleja trzy części (`releaseNotes`): ostrzeżenie o fazie
   wczesnej (`tools/phase.ts`), wpisy, stopkę „który plik kliknąć”
   (`ASSETS_NOTE`). Nie automatyczna lista commitów — to miejsce czyta
   użytkownik, nie programista.
   Kody wyjścia, po których `release.yml` decyduje: `0` treść gotowa,
   `1` nie ma takiej sekcji albo jest pusta (**wydanie przerwane**),
   `2` błąd użycia.
4. **Assety** — `dist/margometer.user.js` i `dist/margometer.meta.js`.
   `prerelease` zostaje na `false` mimo alfy; dlaczego, mówi komentarz
   w `release.yml` i sekcja „Co się psuje cicho”.

Nic z tego nie wymaga edycji przy kolejnych wydaniach: `@downloadURL`
i `@updateURL` wskazują `releases/latest/download/…`, czyli adres bez numeru
wersji (pilnuje tego test).

---

## Między wydaniami: dwaj strażnicy (od 2026‑08‑03)

Job `wydanie` w `check.yml`. Powstał po incydencie: zgłoszono defekt, który był
naprawiony od trzech commitów, ale **nigdy nie wydany** — `package.json` stał na
numerze ostatniego taga, więc Tampermonkey nie miał po czym poznać, że jest co
pobrać, a zgłaszający patrzył na kod sprzed trzech commitów.

| strażnik | kiedy zapala | czy wywraca bramę |
|---|---|---|
| **twardy** | zakres rusza `src/`, a sekcja `[Niewydane]` się nie zmienia | tak |
| **sygnał** | w `[Niewydane]` cokolwiek czeka | **nie**, adnotacja w podsumowaniu |

Są DWA, bo łapią co innego, i to jest wniosek z pomiaru, nie ostrożność:
twardy strażnik **nie złapałby tamtego incydentu**, bo wpis w `[Niewydane]`
wtedy istniał. Sygnał pokazałby przy każdym przebiegu „10 wpisów czeka,
ostatnie wydanie v0.3.0, od tego czasu 10 commitów”.

Cała decyzja siedzi w `tools/wydanie.ts` i ma testy — YAML tylko zbiera dane
z gita. Dwie rzeczy, które wyszły z pomiaru na własnej historii i bez których
strażnik zapalałby się fałszywie: liczy się **zakres** (PR-a albo pusha), a nie
pojedynczy commit, bo wpisy bywają dokładane osobno (`8bfa80b` → `00fcdd2`),
oraz **poprawienie istniejącego wpisu** wystarcza, bo tak zrobił `91fc412`
i żadna nowa pozycja tam nie powstała. Furtka `[bez-changeloga]` w komunikacie
commita zwalnia `feat`/`fix`, których użytkownik nie zobaczy; typy `refactor`,
`test`, `docs`, `build`, `chore`, `ci`, `style` zwalniają same z siebie.

Zakres liczy się od **punktu rozejścia** (`git merge-base`), a nie od czubka
gałęzi bazowej, i **bez commitów scalających**. Jedno i drugie wyszło z przeglądu
2026‑08‑03: bez `merge-base` twardy strażnik wyłączał się sam, gdy ktokolwiek
wydał cokolwiek w międzyczasie (sekcja „różniła się” cudzą zmianą), a bez
`--no-merges` refaktorowy PR wywracał bramę na commicie, którego treści autor
nie pisze.

### Po wydaniu sekcji `[Niewydane]` nie ma wcale

To stan poprawny, nie brak — i wart zapamiętania, bo wygląda na usterkę:
pierwsza kolejna zmiana w `src/` musi **odtworzyć nagłówek** `## [Niewydane]`
razem z wpisem. Strażnik porówna wtedy „nie ma sekcji” z „nie ma sekcji”, uzna,
że nic się nie zmieniło, i zapali bramę. Sygnał do tego czasu mówi
„nic nie czeka”.

---

## Co się psuje cicho

Cztery rzeczy, których nikt nie zgłosi, bo wyglądają na sukces:

- **Wydanie, które nie powstało.** Naprawka w repo, `package.json` na starym
  numerze, kanał aktualizacji milczy. Incydent 2026‑08‑03, powód istnienia
  obu strażników. Sygnał w podsumowaniu CI jest jedyną rzeczą, która o tym mówi.
- **`prerelease: true`.** Kusi, bo projekt jest w alfie — i **zabija
  aktualizacje u wszystkich zainstalowanych**, bo GitHub-owe „latest” pomija
  wydania oznaczone jako pre-release, a `@downloadURL`/`@updateURL` wskazują
  właśnie `releases/latest/…`. Samo wydanie powstaje normalnie, więc awarii nie
  widać. Wczesną fazę komunikujemy tam, gdzie widzi ją użytkownik: w nazwie
  skryptu, README, CHANGELOG-u i treści wydania (`tools/phase.ts`).
- **Wpis napisany językiem programisty.** Nie psuje mechaniki, psuje jedyną
  rzecz, którą użytkownik z tego wydania czyta. Pilnuje tego
  `tests/changelog.test.ts`; regułę łamie się niechcący, pisząc zaraz po wyjściu
  z kodu.
- **Dwa pierwsze kroki bez trzeciego — czyli wersja, która istnieje tylko
  w repo.** Sekcja `[Niewydane]` przeniesiona pod numer z datą, `package.json`
  podbity, commit zrobiony — i na tym koniec, bo tag to osobne polecenie.
  Repo wygląda wtedy dokładnie jak po wydaniu, a nie wydało nic. Gorzej: kolejna
  runda otwiera nad tym nowe `[Niewydane]`, więc plik niesie DWA nierozliczone
  bloki i nie widać, który z nich gracz ma, a którego nie.

  **Zdarzyło się to 0.4.0** (`143f43d`, 2026‑08‑03). Wykryte dopiero pytaniem
  „czemu jest 0.4.0 i jeszcze niewydane, skoro gram na 0.3.0". Naprawa polegała
  na SCALENIU obu bloków z powrotem w jedno `0.4.0` — numer nie był niczyj, bo
  nigdy nie wyjechał, więc nic nie trzeba było przenosić wyżej.

  Sonda, która to wykrywa w sekundę, stoi wyżej — „Który numer” → „Numer, który
  nie wyjechał, jest wolny”. Robi się ją PRZED podbiciem numeru.

  Żaden strażnik tego nie złapie i to jest świadome: twardy patrzy na
  `[Niewydane]`, a ta sekcja po kroku 1 jest pusta **zgodnie z regułą**
  (patrz „Po wydaniu sekcji `[Niewydane]` nie ma wcale"). Sygnał w podsumowaniu
  CI mówi natomiast wprost: „Ostatnie wydanie: **v0.3.0**, od tego czasu N
  commit(ów)" — i to jedyne miejsce, w którym ta rozbieżność widać.

---

## Dalej

- Zasady pisania samych wpisów — komentarz na górze [`CHANGELOG.md`](../CHANGELOG.md).
- Dlaczego kanał dostawy wygląda tak, a nie inaczej (nagłówek, `@updateURL`,
  nazwy plików, jedno źródło fazy) — [`TOOLING.md`](TOOLING.md).
- Logika strażników z powodami i pomiarami — `tools/wydanie.ts`,
  testy w `tests/wydanie.test.ts`.
