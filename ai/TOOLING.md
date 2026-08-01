# Tooling i wydanie — co jest, czego brakuje

Pierwszy spis tej warstwy (2026‑07‑30). `DECYZJE.md` opisuje **dlaczego** kod
wygląda, jak wygląda; `SOLID.md` i `UX-POPRAWKI.md` — co w nim poprawić. Tu
zbieram to, co jest **wokół** kodu: jak się buduje, jak trafia do użytkownika
i co pilnuje, żeby nie wjechała regresja.

Stan bazowy (odświeżony **2026‑08‑01**): `bun test` → **583 zielone / 0
pominiętych / 0 błędów**, `bunx tsc --noEmit` → czysto, `bun test --coverage` →
**98,97 % linii**. Poprzednio stało tu „328 zielonych / 89,1 %".

⚠️ **Przegląd 2026‑08‑01: §1 i §5 są ZROBIONE, §2 w połowie, §6 zamknięte,
§7 w większości.** Statusy niżej były sprzed dwóch rund, a dokument bywa
czytany jako lista zadań — stąd odhaczenia przy każdej sekcji.

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

## 2. Wersjonowanie i kanał dostawy 🟡 — W POŁOWIE

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

**Zrobione:** `package.json` ma `version` (`0.2.0`), a `banner()` je interpoluje
— tabelka wyżej opisuje stan sprzed tej zmiany. **Zostaje otwarte:** brak
`@updateURL`/`@downloadURL` i brak tagów, czyli kanału aktualizacji nadal nie ma.

## 3. Nie ma żadnego zapisu zmian dla użytkownika ⚪

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
**Zostaje otwarte:** brak lintera/formattera, brak `.github/`, brak progu
pokrycia w `bunfig.toml` (regresja pokrycia przechodzi cicho) i resztki
`bun init` w `tsconfig.json` (`jsx: "react-jsx"`, `allowJs: true`).

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

## 8. Brak `CLAUDE.md` ⚪

Projekt ma nietypowe i mocno opisane konwencje: dokumentacja po polsku, zasada
„nie udawaj danych, których log nie ma”, fixture jako **dowód** (z `meta.json`
opisującym `covers`/`missing`/`notes`), stabilne granice `LogSource` /
`RosterSource` / `parse` / `aggregate`, komentarz tłumaczący DLACZEGO, nie CO.
Krótki `CLAUDE.md` odsyłający do `ai/` i wymieniający trzy komendy oszczędza
odkrywanie tego przy każdej sesji.
