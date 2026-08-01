# Tooling i wydanie — co jest, czego brakuje

Pierwszy spis tej warstwy (2026‑07‑30). `DECYZJE.md` opisuje **dlaczego** kod
wygląda, jak wygląda; `SOLID.md` i `UX-POPRAWKI.md` — co w nim poprawić. Tu
zbieram to, co jest **wokół** kodu: jak się buduje, jak trafia do użytkownika
i co pilnuje, żeby nie wjechała regresja.

Stan bazowy (odświeżony **2026‑08‑01**, po rundzie parsera): `bun test` → **650
zielonych / 0 pominiętych / 0 błędów**, `bunx tsc --noEmit` → czysto,
`bun test --coverage` → **98,61 % linii**. Wcześniej tego samego dnia stało tu
„583 / 98,97 %", a przed tym „328 / 89,1 %".

⚠️ **Stan 2026‑08‑01, po rundzie wydania: §1, §2, §3, §5 i §6 są ZROBIONE,
§7 w większości, §4 częściowo.** Statusy bywały tu sprzed dwóch rund, a dokument
czyta się jako listę zadań — stąd odhaczenia przy każdej sekcji.

**Jedyne, co zostaje otwarte w całym tym dokumencie**, to reszta §4: brak
lintera/formattera, brak progu pokrycia, resztki `bun init` w `tsconfig.json`
i jedno `any` w `roster.ts`.

Legenda: 🔴 pilne · 🟡 warto · ⚪ kiedyś.

---

## 1. `@match` łapie niegrowe subdomeny ✅ ZROBIONE (2026‑07‑30)

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

**Zostaje po stronie właściciela:** samo wydanie. `git tag v0.3.0 && git push
origin v0.3.0`. Do tego czasu adresy w nagłówku wskazują pustkę — nieszkodliwie
(Tampermonkey po prostu nie znajduje aktualizacji), ale realnie.

## 3. Zapis zmian dla użytkownika ✅ WRÓCIŁ (2026‑08‑01)

`CHANGELOG.md` jest z powrotem — **w tej samej rundzie, co kanał dostawy**,
dokładnie tak, jak zapowiadał ostatni akapit tej sekcji („ta sekcja jest
zamknięta wyłącznie tak długo, jak długo §2 zostaje otwarte"). Format nie został
wymyślony od nowa, tylko przywrócony z historii (`2774957^`): Keep a Changelog
+ SemVer, po polsku, wpisy z perspektywy użytkownika.

Dwie rzeczy, które przy tym wyszły:

- w pliku stała już sekcja `[0.2.0] — 2026‑07‑30`, a `[Niewydane]` zbierało
  pracę po niej. Skoro `0.2.0` **nigdy nie wyszło**, a od tamtej pory weszło
  dziesięć commitów, pierwszym wydaniem jest **`0.3.0`**, nie `0.2.0`;
- stary plik miał po dwa nagłówki `### Dodane` i `### Zmienione` w jednej
  sekcji — scalone.

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
- `roster.ts:63` typuje wstrzykiwane `window` jako `Record<string, any>` — `any`
  w skądinąd ścisłym projekcie, którego nic nie zauważa;
- w `tsconfig` siedzą resztki `bun init`: `jsx: "react-jsx"` i `allowJs: true`,
  choć w repo nie ma ani JSX, ani plików `.js`.

Komendy do CI już istnieją, a `coverage` i zbiorczy `check` **zostały dodane**.

**Zrobione 2026‑08‑01:** `.github/` istnieje. `check.yml` odpala `bun run check`
na każdy push do `main` i na każdy PR; `release.yml` obsługuje wydania (§2).
Wersja Buna jest **przypięta** (`1.3.14`, ta sama co lokalnie), a nie `latest` —
inaczej brama pewnego dnia czerwieni się bez żadnej zmiany w kodzie i nie
wiadomo, czy to regresja, czy nowy Bun.

**Zostaje otwarte:** brak lintera/formattera, brak progu pokrycia w
`bunfig.toml` (regresja pokrycia przechodzi cicho), resztki `bun init`
w `tsconfig.json` (`jsx: "react-jsx"`, `allowJs: true`) i `Record<string, any>`
w `roster.ts:63`.

## 5. Nic nie testuje `build.ts` ani metadanych ✅ ZROBIONE (2026‑07‑30)

`SOLID.md §10` mówi o tym z perspektywy testów; tu wniosek praktyczny: ~10 linii
testu (banner się parsuje; adres świata pasuje; `www`, `forum`, `pomoc` nie)
zamyka klasę, która **już dwa razy** dotarła do użytkowników.

**Zrobione:** `tools/userscript-meta.ts` (banner + `appliesTo`) i
`tests/userscript.test.ts`.

## 6. `build.ts` jest skryptem, nie jednostką ⚪

Top‑level `await` z efektami ubocznymi, zero eksportów → nie da się go ani
przetestować, ani użyć kawałkami; wszystkie ścieżki są względne do CWD, więc
działa wyłącznie z katalogu repozytorium. Decyzja o minifikacji i source mapach
nigdzie nie jest zapisana (dziś: `minify: false`, bez map).

~~Jedno realne ryzyko: `seed` podglądu archiwum wstawia `JSON.stringify(texts)`
prosto do `<script>`, a escapowanie JSON **nie neutralizuje** ciągu
`</script>`.~~ **Zamknięte:** seed robi `.replace(/<\//g, "<\\/")` z komentarzem
wyjaśniającym, a `page()` escapuje `&` i `<` w bloku logu — obie drogi są kryte.

Na plus: podglądy (`preview.html`, `preview-20.html`, `preview-archive.html`) to
realna pętla QA bez wchodzenia do gry, a syntetyczny log jest udokumentowany jako
**nie‑dowód** (`tools/synthetic-log.ts`) — czyli w testach nie wyląduje. Bundle
jest czysty: `syntheticFight` nie wjeżdża do `margometer.user.js`.

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
| **`.claude/rules/mechanika-gry.md`** | reguła ścieżkowa: ładuje się dopiero przy `src/parser.ts`, `src/stats.ts`, `src/types.ts`, `docs/**/*.md` i `meta.json`. Niesie skrót procedury z `MECHANIKA.md` tam, gdzie powstają zdania o mechanice gry, i nie zjada kontekstu w pozostałych sesjach |

Podział jest po to, żeby zmieścić się w zaleceniu „target under 200 lines per
`CLAUDE.md`”: co ma być zawsze — w `AGENTS.md`, co tylko czasem — w regule.
