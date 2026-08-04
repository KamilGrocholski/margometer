# Tooling i wydanie — co jest, czego brakuje

Pierwszy spis tej warstwy (2026‑07‑30). `DECYZJE.md` opisuje **dlaczego** kod
wygląda, jak wygląda; `SOLID.md` i `UX-POPRAWKI.md` — co w nim poprawić. Tu
zbieram to, co jest **wokół** kodu: jak się buduje, jak trafia do użytkownika
i co pilnuje, żeby nie wjechała regresja.

Stan bazowy (odświeżony **2026‑08‑03**, po rundzie utwardzającej): `bun test` →
**816 zielonych / 0 pominiętych / 0 błędów / 5 214 asercji**, `bunx tsc --noEmit`
→ czysto, pokrycie **94,21 % linii i 92,69 % funkcji** — liczone przy KAŻDYM
przebiegu, nie tylko pod `bun run coverage` (`bunfig.toml`).

⚠️ Poprzedni zapis („696 zielonych / 3 649 asercji, 95,21 % linii / 92,02 %
funkcji", 2026‑08‑02) **zestarzał się o dwie rundy** i był w międzyczasie
cytowany. Skład raportu tym razem się NIE zmienił, więc te dwie pary liczb są
porównywalne: doszło 120 testów, pokrycie linii spadło o 1,0 pp, funkcji urosło
o 0,67 pp. Spadek linii bierze się z `src/index.ts` i `tools/`, nie z warstwy
danych — `parser.ts`, `types.ts`, `recorder.ts`, `roster.ts`, `palette.ts`,
`style.ts`, `window.ts` i `version.ts` stoją na 100 % linii.

⚠️ **Ta liczba nie jest porównywalna wprost z poprzednimi** i to jest ważniejsze
od niej samej. Stało tu „650 zielonych / 98,61 % linii" (2026‑08‑01), przedtem
„583 / 98,97 %", przed tym „328 / 89,1 %" — ale **skład raportu zmieniał się
razem z nimi**. Do raportu weszły w międzyczasie `tools/` (w tym bloki CLI
uruchamiane wyłącznie przy wydaniu), a wyszły z niego pliki testowe
(`coverageSkipTestFiles`). Spadek z 98,61 na 95,21 to więc W PRZEWAŻAJĄCEJ
CZĘŚCI zmiana mianownika, nie regresja `src/`: dziś `src/` ma 90,2–100 % linii
w każdym pliku, a raport ciągnie w dół `tools/pomoc.ts` (43,5 %, sam blok CLI).
Wniosek na przyszłość: **procent pokrycia bez podanego SKŁADU raportu nie jest
danymi porównywalnymi** — i dlatego stał tu trzy rundy jako dowód czegoś, czego
nie dowodził.

⚠️ **Stan 2026‑08‑01, po rundzie wydania: §1, §2, §3, §5 i §6 są ZROBIONE,
§7 w większości, §4 częściowo.** Statusy bywały tu sprzed dwóch rund, a dokument
czyta się jako listę zadań — stąd odhaczenia przy każdej sekcji.

**Co zostaje otwarte w całym tym dokumencie** (stan 2026‑08‑03), to reszta §4:
brak lintera/formattera oraz resztki `bun init` w `tsconfig.json` (`jsx`,
`allowJs`). Próg pokrycia zszedł z tej listy jako **rozstrzygnięty inaczej, niż
zakładano** — patrz §4.

⚠️ **`any` zeszły z tej listy 2026‑08‑03, a stały na niej o rundę za długo.**
Zapis „**trzy** `any` (nie jedno)" powstał 2026‑08‑02 jako sprostowanie liczby
i był wtedy prawdziwy, ale wszystkie trzy usunął typ `GameGlobals` 2026‑08‑03
(`SOLID §9`) — a ten dokument tego nie zauważył. Sprawdzone dziś: w `src/` nie
ma ani jednego `any`, jedyne trafienia greperem to komentarz w `roster.ts`.
Ta sama klasa błędu co `AUDYT‑46/47/49`: status żyjący w dwóch plikach naraz
naprawia się w tym, który się czyta.

**Dołożone 2026‑08‑03, zamiast lintera:** sześć flag kompilatora
(`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`,
`noImplicitOverride`, `allowUnusedLabels: false`, `allowUnreachableCode: false`).
Każda zmierzona przed włączeniem — pięć dawało 0 błędów, `exactOptional` dawało
3 (pole `storage` w trzech typach opcji, naprawione jawnym `| undefined`).
`checkJs` **nie wchodzi i nie ma sensu mierzyć tego drugi raz**: przy
`allowJs: true` daje 577 błędów, wszystkie z `tools/engine-probe.js` — pliku
pisanego do wklejenia w konsolę gry.

Legenda: 🔴 pilne · 🟡 warto · ⚪ kiedyś.

---

## 1. `@match` łapie niegrowe subdomeny ✅ ZROBIONE (2026‑07‑30)

⚠️ **Opis niżej dotyczy stanu z 2026‑07‑30 i CYTUJE PLIK, W KTÓRYM TEGO JUŻ NIE
MA** (sprostowane 2026‑08‑02). Nagłówek userscriptu wyprowadzono do
`tools/userscript-meta.ts`; `build.ts` nie zawiera dziś ani jednego `@match`,
ani `@version` — woła `banner(pkg.version, …)`. Sekcja §2 ma przy swojej tabeli
dopisek „stan sprzed zmiany", ta go nie miała i czytała się jak opis stanu
bieżącego. Aktualna lista wykluczeń i powód, dla którego wygląda tak, a nie
inaczej — w `tools/userscript-meta.ts`.

`build.ts:20‑25` matchuje `https://*.margonem.pl/*` i `.com/*`, wykluczając
`www`, `forum` i `commons`. **Nie wyklucza `pomoc.margonem.pl`** — strony,
do której linkuje dokumentacja tego projektu — ani żadnej innej subdomeny.

Samo dopasowanie to pół sprawy. Druga połowa: `index.ts:47` rysuje panel
**zanim** cokolwiek znajdzie log (celowo — „licznik jest produktem, archiwum
dodatkiem”), a `index.ts:58` startuje `setInterval` z `querySelectorAll("*")` po
całym DOM co sekundę i **nigdy go nie sprząta**. Netto: na stronie pomocy wisi
pływający panel MargoMetera i leci wieczny skan całego dokumentu.

**Propozycja.** Albo lista hostów światów w `@match`, albo brama w `boot()` na
markerze gry (`Engine` / `getEngine`) — wtedy `@match` może zostać szeroki,
a dodatek po prostu nie budzi się poza grą. Do tego brakuje **`@noframes`**:
dziś skrypt startuje w każdej pasującej ramce.

**Kontekst historyczny, który mówi, czemu to było 🔴.** Ten wzorzec już dwa razy
trafił użytkowników: `eddde5b` („zawężenie `@match` do adresów światów”),
a potem `2016e59` („fix: przywrócenie `@match` ze ścieżką — dodatek nie
wstrzykiwał się do gry”). Zmiana bez testu wraca.

**Zrobione.** `pomoc.margonem.pl` i `.com` są w `@exclude`, jest `@noframes`,
a `boot()` ma bramę: bez `Engine` i bez okna walki pętla gaśnie po dwudziestu
próbach (`GIVE_UP_AFTER`) i zdejmuje panel, jeśli zdążył powstać. Całość opisana
i przetestowana w `tools/userscript-meta.ts` + `tests/userscript.test.ts`.

**Domknięte dopiero 2026‑08‑02 (`AUDYT‑42`).** Lista wykluczeń była
niesymetryczna: dla `.pl` stały `www`, `forum`, `commons` i `pomoc`, dla `.com`
tylko `www` i `pomoc` — a strona główna BEZ „www" wchodziła w obu domenach, bo
wzorzec `*.margonem.pl` obejmuje również sam `margonem.pl`. Zmierzone
`appliesTo`: `margonem.pl`, `margonem.com`, `forum.margonem.com`
i `commons.margonem.com` dawały `true`. Test tego nie łapał, bo wymieniał z palca
adresy, które JUŻ odpadały — dziś jest pętlą po iloczynie „subdomena × domena"
i nie da się go uzupełnić po jednej stronie.

## 2. Wersjonowanie i kanał dostawy ✅ ZROBIONE (2026‑08‑01)

| gdzie | co mówi |
|---|---|
| `build.ts:17` | `// @version 0.1.0` — zaszyte na sztywno |
| `package.json` | **brak pola `version`** |
| `git tag` | pusto |
| `dist/` | w `.gitignore` |

Po `[0.1.0]` weszło kilkanaście commitów funkcjonalnych (nagrywanie, archiwum,
odtwarzanie, kopiowanie statystyk, rozbicie wg typu, kolory profesji), a
zbudowany plik nadal ogłasza `0.1.0`. **Tampermonkey aktualizuje po numerze
wersji**, więc nawet gdyby ktoś miał skąd pobierać — nie dostanie nic. A skąd
pobierać nie ma: brakuje `@updateURL` i `@downloadURL`, więc kanału aktualizacji
nie ma wcale, a użytkownik nie ma jak sprawdzić, którą wersję trzyma.

**Propozycja (minimum).** `version` w `package.json` jako jedyne źródło; banner
w `build.ts` interpoluje je zamiast trzymać literał; `@updateURL`/`@downloadURL`
na opublikowany plik; jeden tag na wydanie.

**Zrobione (2026‑07‑31):** `package.json` ma `version`, a `banner()` je
interpoluje — tabelka wyżej opisuje stan sprzed tej zmiany.

**Zrobione (2026‑08‑01) — kanał domknięty.** Wydania idą przez **GitHub Releases
na tagu**, `dist/` zostaje w `.gitignore`:

- nagłówek ma `@downloadURL` (→ `.user.js`), `@updateURL` (→ **lekki**
  `.meta.js`, sam nagłówek zamiast całego bundle'a przy każdym sprawdzeniu),
  `@homepageURL` oraz `@namespace` wskazujący prawdziwe repozytorium —
  wcześniej stało tam `github.com/margometer`, adres, którego nie ma;
- adres bazowy idzie z pola `homepage` w `package.json`, nie z literału.
  Ta sama zasada, co przy `version`, i z tego samego powodu: literał żyjący
  osobno od rzeczywistości już raz kosztował to repo kanał dostawy;
- `releases/latest/download/...` **nie niesie numeru wersji**, więc nagłówek nie
  wymaga edycji przy żadnym kolejnym wydaniu (pilnuje tego test);
- `build.ts` produkuje oba pliki;
- `.github/workflows/release.yml` na tagu `v*`: brama `bun run check`,
  **sprawdzenie, że tag zgadza się z `package.json`**, treść wydania wycięta
  z `CHANGELOG.md` przez `tools/changelog.ts`, oba pliki jako assety;
- pięć nowych testów w `tests/userscript.test.ts` (m.in. że `downloadURL`
  i `updateURL` nie są zamienione miejscami — pomyłka cicha i kosztowna:
  aktualizacja podmieniłaby dodatek na goły nagłówek).

**Zostaje po stronie właściciela:** samo wydanie — trzy kroki i tag, spisane
w [`WYDANIE.md`](WYDANIE.md). Dopóki pierwszy tag nie powstanie, adresy
w nagłówku wskazują pustkę: nieszkodliwie (Tampermonkey po prostu nie znajduje
aktualizacji), ale realnie.

Stał tu przykład `git tag v0.3.0` jako całość tej odpowiedzi. Był krótszy niż
prawda (milczał o przeniesieniu sekcji i podbiciu `package.json`) i zdążył się
zestarzeć — repo było już na 0.4.0. Procedura ma odtąd jedno miejsce.

### Dwaj strażnicy wydania (od 2026‑08‑03)

Job `wydanie` w `check.yml`, logika w `tools/wydanie.ts`. **Opis przeniesiony
do [`WYDANIE.md`](WYDANIE.md)** — razem z tabelą, kiedy który zapala, i powodem,
dla którego są dwa (twardy strażnik nie złapałby incydentu, po którym oba
powstały).

Tutaj zostaje sama pozycja w rejestrze: to jest odpowiedź na §4 („zero CI”)
w części dotyczącej wydania. Brakowało tu strażnika pilnującego, żeby zmiana
w `src/` docierała do użytkownika — od 2026‑08‑03 jest.

### Faza wczesna: dlaczego NIE przez flagę „Pre-release"

Projekt jest w alfie i to widać w czterech miejscach — ale **nie** przez
gitHubową flagę pre-release. Powód jest mechaniczny i wart zapamiętania:

> **GitHub-owe „latest" pomija wydania oznaczone jako pre-release.**

A `@downloadURL`/`@updateURL` wskazują `releases/latest/download/...`. Zaznaczenie
tej flagi zabiłoby więc aktualizacje u wszystkich zainstalowanych i link
instalacyjny z README — **po cichu**, bo samo wydanie powstałoby normalnie
i wyglądałoby poprawnie. Wyjściem byłby powrót do adresu z wpisanym tagiem,
czyli do literalu poprawianego przy każdym wydaniu — dokładnie tego, co §2
wyeliminowało. Dlatego `release.yml` ma jawne `prerelease: false` z komentarzem,
a nie brak wpisu: brak można „poprawić" w dobrej wierze.

Samo `0.x` już niesie tę informację formalnie (SemVer: „Major version zero
(0.y.z) is for initial development. Anything MAY change at any time."), więc
numeracja **nie dostaje sufiksów** `-alpha.N`. Sprawdzone przy okazji, gdyby
kiedyś miały być potrzebne: Tampermonkey je obsługuje i sortuje zgodnie
z SemVerem — `0.3.0-alpha.1` jest STARSZE niż `0.3.0`, więc przejście z alfy na
wydanie zwykłe zadziała jako aktualizacja.

### Nazwy plików wydania — też jedno miejsce

`tools/artifacts.ts`. Te dwie nazwy występują w **pięciu**: w `@downloadURL`
i `@updateURL`, w `build.ts`, w stopce treści wydania, w liście assetów
w `release.yml` i w linku instalacyjnym w `README.md`. Rozjazd którejkolwiek
pary jest **cichy**: nagłówek wskazywałby plik, którego wydanie nie zawiera,
i aktualizacje przestałyby przychodzić bez jednego komunikatu o błędzie.

Trzy z tych miejsc importują stałą. Dwóch pozostałych — YAML-a i prozy — nie
da się, więc pilnuje ich `tests/artifacts.test.ts`: czyta `release.yml` przez
`Bun.YAML.parse` i sprawdza, że lista assetów to dokładnie te dwa pliki, oraz
że link w README prowadzi do `.user.js`, a nie do `.meta.js`. Sprawdzone przez
zepsucie — podmiana nazwy zapala właśnie te dwa testy.

Stopka wydania (`ASSETS_NOTE` w `tools/changelog.ts`) mówi, który plik kliknąć.
Powód: wydanie pokazuje CZTERY pozycje, bo GitHub dokłada archiwa źródeł sam
i nie da się ich zdjąć. `margometer.meta.js` wygląda w tym zestawie jak drugi
skrypt do zainstalowania — kto go kliknie, zainstaluje sam nagłówek bez ani
jednej linii kodu i dodatek nie zrobi nic. W przeciwieństwie do ostrzeżenia
o fazie ta stopka **zostaje po wyjściu z alfy**.

### Faza wczesna — jedno źródło

Słowo fazy żyje w **jednym** miejscu (`tools/phase.ts`), a nie w czterech —
bo cztery kopie statusu to ten sam kształt, który `SOLID §11` i `AUDYT §G`
opisują jako przyczynę wszystkich rozjazdów w tym repo. Zasila: `@name`
w nagłówku i akapit nad treścią wydania. Dwa pozostałe miejsca to proza
(README, CHANGELOG), której nie da się zaimportować — pilnuje ich
`tests/phase.test.ts`, i pilnuje **w obie strony**: po ustawieniu `PHASE = null`
test wskazuje teksty, które nadal ogłaszają alfę. Wyjście z fazy wczesnej jest
więc jedną zmianą i listą miejsc do poprawienia, a nie polowaniem.

## 3. Zapis zmian dla użytkownika ✅ WRÓCIŁ (2026‑08‑01)

`CHANGELOG.md` jest z powrotem — **w tej samej rundzie, co kanał dostawy**,
dokładnie tak, jak zapowiadał ostatni akapit tej sekcji („ta sekcja jest
zamknięta wyłącznie tak długo, jak długo §2 zostaje otwarte").

Dwie rzeczy, które przy tym wyszły:

- w pliku stała już sekcja `[0.2.0] — 2026‑07‑30`, a `[Niewydane]` zbierało
  pracę po niej. Skoro `0.2.0` **nigdy nie wyszło**, a od tamtej pory weszło
  dziesięć commitów, pierwszym wydaniem jest **`0.3.0`**, nie `0.2.0`;
- przywrócona wersja miała po dwa nagłówki `### Dodane` i `### Zmienione`
  w jednej sekcji — scalone, a potem cały układ się zmienił (niżej).

### Dwa zapisy zmian, dla dwóch czytelników

Zapis pracy rozdziela się na dwa, bo czytają go dwie różne osoby i **jeden tekst
nie obsłuży obu**:

| | `CHANGELOG.md` | `docs/specy/` |
|---|---|---|
| czytelnik | gracz Margonema | programista, często po miesiącu |
| jednostka | wersja | runda pracy |
| treść | co się zmienia w dodatku | problem, rozwiązanie, **odrzucone warianty** |
| co NIE wchodzi | refaktory, testy, narzędzia | — |

**Format changelogu** to jedna płaska lista na wersję, wpis zaczyna się typem:
`**Nowość**` / `**Zmiana**` / `**Poprawka**`. Zastąpiło to nagłówki
`### Dodane / Zmienione / Naprawione` z Keep a Changelog — przy krótkich
wpisach typ per wiersz skanuje się szybciej niż grupowanie, a lista przestaje
mieć dwa poziomy zagnieżdżenia dla trzech kategorii.

Dwa niezmienniki w `tests/changelog.test.ts` pilnują tego strukturalnie:
**każdy** wpis w **każdej** wersji zaczyna się jednym z trzech typów, i **żaden
nie używa pojęć programistycznych** (lista zakazanych słów: `parser`, `regex`,
`cache`, `DOM`, `fixture`…). Ten drugi test jest tu, bo regułę „pisz
z perspektywy użytkownika" łamie się **niechcący** — pisze ją ktoś, kto właśnie
wyszedł z kodu. Zdanie w konwencji tego nie zatrzymuje, test tak.

Uwaga techniczna z tego testu, warta zapamiętania: granice słów liczą się po
literach **Unicode**, nie przez `\b`. Dla ASCII-owego `\b` polskie „ą" nie jest
literą, więc „Dot**ąd**" trafiało jako żargonowe „DoT". Fałszywy alarm w teście,
który ma pilnować czystości, uczy tylko tego, żeby go wyłączyć.

**Specy** (`docs/specy/`) biorą to, co dotąd ginęło: rundy były projektowane
w pliku planu **poza repozytorium**, a po zatwierdzeniu rozumowanie przeżywało
tylko w komunikacie commita. Szablon ma siedem sekcji i jest celowo krótki —
nie ma tu API, modeli danych ani migracji, a sekcja wypełniana „nie dotyczy"
uczy, że szablon się olewa. Szczegóły i szablon:
[`specy/README.md`](specy/README.md).

Treść wydania na GitHubie jest **wycinana z tego pliku** (`tools/changelog.ts`,
czysta funkcja + testy), a nie generowana z listy commitów: wydanie czyta
użytkownik, nie programista. Brak sekcji dla wydawanej wersji **przerywa
wydanie**, a test w `tests/changelog.test.ts` pilnuje, że wersja z
`package.json` ma swój wpis — czyli bump numeru bez opisu zmian pada już
lokalnie, nie dopiero przy tagu.

Obietnica metryki „Tury", przez którą plik był kiedyś mylący, **nie wróciła**:
w `[0.2.0]` stoi jej wycofanie, a sama metryka nadal jest `⏸` w `ROADMAP.md`.

<details>
<summary>Jak brzmiała ta sekcja, gdy była otwarta</summary>

### 3. Nie ma żadnego zapisu zmian dla użytkownika ⚪

**`CHANGELOG.md` został usunięty z repo 2026‑07‑31** (świadoma decyzja, plik
siedzi w historii gita). Wcześniej ta sekcja opisywała, że dryfuje w obie
strony — obiecuje metrykę „Tury”, której nie da się wybrać, i milczy o zmianach,
które weszły. Oba te problemy zniknęły razem z plikiem, ale **nie w ten sposób,
że zostały rozwiązane**:

- pytanie o metrykę „Tury” żyje dalej i stoi teraz w `ROADMAP.md`
  („Wstrzymane”) — usunięcie obietnicy nie dokończyło funkcji;
- **zapisu zmian dla użytkownika nie ma teraz wcale.** Póki nie ma też kanału
  dostawy (§2 — brak `@updateURL`/`@downloadURL`, brak tagów), nikomu to nie
  szkodzi: nie ma odbiorcy, któremu można by coś zapowiedzieć. To wraca jako
  warunek dopiero razem z pierwszym wydaniem, do którego ktoś ma dostęp.

Innymi słowy: ta sekcja jest zamknięta **wyłącznie tak długo**, jak długo §2
zostaje otwarte. Kto będzie robił wydanie, potrzebuje obu naraz.

</details>

Ta zapowiedź sprawdziła się co do joty i warto to zapisać: sekcja „zamknięta
warunkowo" nie jest sekcją zamkniętą. Kto zamyka pozycję cudzym warunkiem,
powinien zostawić przy niej warunek — bo inaczej odhaczenie przeżyje powód.

## 4. Zero lint, format i CI 🟡 — CZĘŚCIOWO

Brak `eslint`/`biome`/`prettier`/`.editorconfig`, brak `.github/`, brak hooków.
Skutki są konkretne, nie estetyczne:

- ~~`tsconfig.json` ma **`noUnusedLocals: false` i `noUnusedParameters: false`**~~
  — **obie są dziś `true`** (od `2dc38fb`) i to one wykryły `renderAxis`,
  `renderFireFocus` i `turnRows`. Punkt zamknięty;
- ~~`roster.ts:63` typuje wstrzykiwane `window` jako `Record<string, any>`~~ —
  **ZAMKNIĘTE 2026‑08‑03**, typ `GameGlobals` (`SOLID §9`). Wpis stał tu
  z własnym sprostowaniem („takich miejsc są **trzy**, nie jedno — doszły
  `index.ts:64` i `index.ts:80`"), które było prawdziwe 2026‑08‑02 i przestało
  być nazajutrz. Dziś w `src/` nie ma ani jednego `any`. Lekcja jest o
  dokumencie, nie o kodzie: sprostowanie liczby nie chroni przed zestarzeniem
  się całej pozycji;
- w `tsconfig` siedzą resztki `bun init`: `jsx: "react-jsx"` i `allowJs: true`,
  choć w repo nie ma ani JSX, ani plików `.js`.

Komendy do CI już istnieją, a `coverage` i zbiorczy `check` **zostały dodane**.

**Zrobione 2026‑08‑01:** `.github/` istnieje. `check.yml` odpala `bun run check`
na każdy push do `main` i na każdy PR; `release.yml` obsługuje wydania (§2).
Wersja Buna jest **przypięta** (`1.3.14`, ta sama co lokalnie), a nie `latest` —
inaczej brama pewnego dnia czerwieni się bez żadnej zmiany w kodzie i nie
wiadomo, czy to regresja, czy nowy Bun.

**Pokrycie — rozstrzygnięte 2026‑08‑02, inaczej niż zakładał ten wpis
(`AUDYT‑45`).** Stało tu „brak progu pokrycia w `bunfig.toml`, regresja pokrycia
przechodzi cicho" i było to trafne co do skutku: liczba w stanie bazowym wyżej
przeleżała trzy rundy bez sprawdzenia. Ale progu **nie da się dziś postawić
sensownie**, i to jest wynik pomiaru, nie rezygnacji:

- `coverageThreshold` w Bunie 1.3.14 sprawdza się **per plik, nie na sumie**.
  Przy sumie 95,2 % brama pada już na progu `0.44`, bo najsłabszym plikiem
  raportu jest `tools/pomoc.ts` (43,5 % — sam blok CLI). Najwyższy próg, który
  repo dziś przepuszcza, to `0.43` — czyli zabezpieczenie pozorne;
- `{ line = …, function = … }` w liczbie POJEDYNCZEJ jest po cichu ignorowane
  (przy progu 0,99 `bun test` kończy się kodem 0). Działa tylko liczba mnoga;
- `coveragePathIgnorePatterns = ["tools/"]` nie zadziałało w ogóle.

**Zrobione zamiast progu:** `coverage = true` w `bunfig.toml`, czyli pokrycie
liczy się przy KAŻDYM `bun test`, a więc pod bramą i w CI. Koszt zmierzony:
7 367 → 8 948 ms. Liczba, która ginęła, jest odtąd na oczach. Próg wejdzie po
dociągnięciu trzech najsłabszych plików albo gdy da się go postawić na sumie.

**Zostaje otwarte:** brak lintera/formattera oraz resztki `bun init`
w `tsconfig.json` (`jsx: "react-jsx"`, `allowJs: true`). Miejsca
z `Record<string, any>` zeszły z tej listy 2026‑08‑03 — patrz sprostowanie
w nagłówku dokumentu.

## 5. Nic nie testuje `build.ts` ani metadanych ✅ ZROBIONE (2026‑07‑30)

`SOLID.md §10` mówi o tym z perspektywy testów; tu wniosek praktyczny: ~10 linii
testu (banner się parsuje; adres świata pasuje; `www`, `forum`, `pomoc` nie)
zamyka klasę, która **już dwa razy** dotarła do użytkowników.

**Zrobione:** `tools/userscript-meta.ts` (banner + `appliesTo`) i
`tests/userscript.test.ts`.

## 6. `build.ts` jest skryptem, nie jednostką ⚪

**Ta sama przeszkoda dotyczyła `tools/pomoc.ts` i została zdjęta 2026‑08‑02**
(`AUDYT‑43`): CLI siedzi za `if (import.meta.main)`, `odtaguj`, `fragmenty`
i `wiek` są eksportowane, a `tests/pomoc.test.ts` ma 13 testów. Sonda, na której
stoi CAŁA procedura z `MECHANIKA.md`, nie miała przedtem ani jednego — właśnie
dlatego, że import odpalał parsowanie `process.argv` i pobieranie artykułu.
Wzorzec jest ten sam co w `tools/changelog.ts` i kosztuje jedną klamrę.

Top‑level `await` z efektami ubocznymi, zero eksportów → nie da się go ani
przetestować, ani użyć kawałkami; wszystkie ścieżki są względne do CWD, więc
działa wyłącznie z katalogu repozytorium. Decyzja o minifikacji i source mapach
nigdzie nie jest zapisana (dziś: `minify: false`, bez map).

~~Jedno realne ryzyko: `seed` podglądu archiwum wstawia `JSON.stringify(texts)`
prosto do `<script>`, a escapowanie JSON **nie neutralizuje** ciągu
`</script>`.~~ **Zamknięte:** seed robi `.replace(/<\//g, "<\\/")` z komentarzem
wyjaśniającym.

Na plus: podglądy (`preview.html`, `preview-archive.html`) to realna pętla QA bez
wchodzenia do gry. **Od 2026‑08‑04 idą DOKŁADNIE tą drogą co gra**: seed udaje
`Engine.battle` ze składem i pustym `update`, czeka aż dodatek je owinie, i
dopiero wtedy wpuszcza komunikaty. Wcześniej wstawiały log w DOM i omijały całe
owinięcie razem z wyścigiem o podpięcie.

⚠️ **`preview-20.html` zszedł z drzewa w tej samej rundzie.** Pokazywał układ
listy przy dwudziestu postaciach z rozstrzelonymi liczbami, biorąc je
z `tools/synthetic-log.ts` — a ten składał ZDANIA gry. Generator oddaje dziś
`BattleEvent[]` (testy panelu stoją na nim dalej), więc do podglądu
potrzebowałby syntetycznych KOMUNIKATÓW protokołu. Zakodowanie kluczy krytyka,
bloku, proców i leczenia „na oko" dałoby podgląd wyglądający poprawnie
i kłamiący, więc czeka na osobną robotę. Powód stoi też w `build.ts`.

Syntetyczna walka jest dalej udokumentowana jako **nie‑dowód**
(`tools/synthetic-log.ts`), a bundle jest czysty: `syntheticFight` nie wjeżdża
do `margometer.user.js`.

## 7. `package.json` i `bunfig.toml` — drobiazgi ⚪

- `package.json`: **`version`, `description` i `private` są**, skrypty
  `coverage` i `check` też. Zostaje brak `license` i `engines`.
- `bunfig.toml` preloaduje jsdom dla **wszystkich** plików testowych, więc czyste
  testy parsera płacą za DOM, którego nie używają.

## 8. Instrukcje dla agentów ✅ ZROBIONE 2026‑08‑01

Projekt ma nietypowe i mocno opisane konwencje: dokumentacja po polsku, zasada
„nie udawaj danych, których log nie ma”, fixture jako **dowód** (z `meta.json`
opisującym `covers`/`missing`/`notes`), stabilne granice `LogSource` /
`RosterSource` / `parse` / `aggregate`, komentarz tłumaczący DLACZEGO, nie CO.
Krótki plik odsyłający do `docs/` i wymieniający trzy komendy oszczędza
odkrywanie tego przy każdej sesji.

**Zrobione, ale nie jako sam `CLAUDE.md`** — bo od czasu tego wpisu ustaliła się
konwencja szersza. Trzy pliki, każdy z innym zadaniem:

| plik | co robi |
|---|---|
| **`AGENTS.md`** | treść właściwa. Otwarty format [agents.md](https://agents.md/) — czytają go Codex, Cursor, Copilot, Gemini CLI, Aider i reszta. Korzeń repo, zwykły Markdown, „README dla agentów” |
| **`CLAUDE.md`** | `@AGENTS.md` plus sekcja własna. Dokumentacja Claude Code mówi wprost: „Claude Code reads `CLAUDE.md`, not `AGENTS.md`. If your repository already uses `AGENTS.md` …, create a `CLAUDE.md` that imports it”. Symlink też jest wspieraną konwencją, ale **tylko bez treści własnej** — a tu jest — i wymaga uprawnień na Windowsie |
| **`.claude/rules/mechanika-gry.md`** | reguła ścieżkowa: ładuje się dopiero przy `src/protokol.ts`, `src/stats.ts`, `src/types.ts`, `docs/**/*.md` i `meta.json` (do 2026‑08‑04 pierwszą ścieżką był `src/parser.ts` — po jego skasowaniu wzorzec przestał się dopasowywać, czyli reguła cicho przestała działać). Niesie skrót procedury z `MECHANIKA.md` tam, gdzie powstają zdania o mechanice gry, i nie zjada kontekstu w pozostałych sesjach |

Podział jest po to, żeby zmieścić się w zaleceniu „target under 200 lines per
`CLAUDE.md`”: co ma być zawsze — w `AGENTS.md`, co tylko czasem — w regule.
