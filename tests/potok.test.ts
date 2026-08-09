import { describe, expect, test } from "bun:test";
import { readdirSync } from "node:fs";

/**
 * Strażnicy `docs/POTOK.md` — dokumentu opisującego CAŁY przebieg dodatku.
 *
 * ⚠️ **PO CO STRAŻNIK NA PROZĘ.** Repo zapisało tę samą diagnozę trzy razy
 * (`AUDYT‑115`, `AUDYT‑116`, `AUDYT‑117`) i za każdym razem brzmiała ona
 * identycznie: **rozjazd w `docs/` bez strażnika**. Spis speców rozjechał się
 * z katalogiem o dwa pliki, tabela `§0` w `AUDYT.md` nie widzi czterdziestu
 * dwóch wpisów, a wspólną definicję spinał komentarz zamiast importu.
 * `CHANGELOG.md` ma test i **przez to nie zdążył się rozjechać** — porównanie
 * tych dwóch plików jest tańszym dowodem tej reguły niż jakikolwiek wywód.
 *
 * Wzór wzięty z `tests/wydanie.test.ts` („indeks docs/ prowadzi do WYDANIE.md"
 * i porównanie prozy z `release.yml`) oraz z `tests/fixtury.ts` — **pliki
 * ODKRYWANE, nie wymieniane**. Lista wpisana ręcznie zestarzałaby się dokładnie
 * tak samo jak dokument, którego pilnuje.
 */

const POTOK = await Bun.file("docs/POTOK.md").text();
const DOCS_README = await Bun.file("docs/README.md").text();

/** Moduły `src/` odkrywane z katalogu, nie wymieniane. */
const MODULY = readdirSync("src").filter((plik) => plik.endsWith(".ts"));

/**
 * Wzorzec nazwy pliku `.ts` w prozie.
 *
 * ⚠️ **`(?<![\w.-])` NIE JEST OZDOBĄ.** Bez tego z `tests/potok.test.ts`
 * wypadało widmo `test.ts` — nazwa, która nigdy nie istniała, wyłuskana ze
 * środka nazwy, która istnieje. Strażnik zapalał się wtedy na własnym pliku.
 */
const NAZWA_TS = /(?<![\w.-])([a-z0-9-]+\.ts)\b/g;

/**
 * Gdzie WOLNO mieszkać plikowi wymienionemu w dokumencie.
 *
 * Cztery katalogi, nie dwa: dokument opisuje `build.ts` (korzeń repo),
 * `tools/walka.ts` i świadka `tests/fixtury.ts`. Zawężenie do `src/` kazałoby
 * przemilczeć drogę materiału do repo, czyli jedną trzecią torów bocznych.
 */
const ISTNIEJE = new Set(
  ["src", "tools", "tests", "."].flatMap((katalog) =>
    readdirSync(katalog).filter((plik) => plik.endsWith(".ts")),
  ),
);

describe("docs/POTOK.md jest znajdowalny", () => {
  /**
   * Tabela w `docs/README.md` jest jedyną drogą do tego katalogu. Plik, do
   * którego nic nie linkuje, jest w praktyce nieobecny — a wtedy opis potoku
   * wraca do rozsypania po sześciu miejscach, z którego ten dokument go zebrał.
   */
  test("indeks docs/ prowadzi do POTOK.md", () => {
    expect(DOCS_README).toContain("(POTOK.md)");
  });
});

describe("docs/POTOK.md pokrywa cały `src/` — w OBIE strony", () => {
  test("katalog `src/` nie jest pusty", () => {
    // Bez tego oba niezmienniki niżej byłyby zielone i puste.
    expect(MODULY.length).toBeGreaterThan(0);
  });

  /**
   * Nowy moduł nie wejdzie do `src/` nieudokumentowany.
   *
   * To jest mocniejsza połowa tej pary: dokument o potoku, który przemilcza
   * jedno ogniwo, jest gorszy od jego braku — czyta się jak kompletny.
   */
  test.each(MODULY)("%s jest wymieniony w dokumencie", (plik) => {
    expect(POTOK).toContain(plik);
  });

  /**
   * Druga strona: nazwa, która przestała istnieć, zostawia czerwony test.
   *
   * ⚠️ Tak zawiodła lista ścieżek w `.claude/rules/mechanika-gry.md` — **cztery
   * razy** — bo „ścieżka, która nigdy się nie dopasuje, wygląda w pliku
   * dokładnie tak samo jak działająca".
   *
   * `tools/` też się liczy: dokument opisuje drogę materiału przez
   * `tools/walka.ts`, a to jest prawdziwy plik i ma nim zostać.
   */
  test("każda nazwa `*.ts` w dokumencie wskazuje na istniejący plik", () => {
    const wymienione = [...POTOK.matchAll(NAZWA_TS)].map((m) => m[1]!);
    const widma = [...new Set(wymienione)].filter((plik) => !ISTNIEJE.has(plik));

    expect(widma).toEqual([]);
  });
});

/**
 * ⚠️ **ZAKAZ NUMERÓW LINII — i to jest pomiar, nie gust.**
 *
 * `AUDYT‑46`: ostrzeżenie o rozjeździe numerów linii **zestarzało się samo**.
 * `overlay.ts` miał 2456 linii przy zdaniu „trzeba go ciąć", potem 2628, potem
 * 3181 — a lokalizacje z sekcji A–F `AUDYT.md` „po tylu rundach nie prowadzą
 * tam, gdzie mówią". `AUDYT‑117`: komentarz spinający dwie kopie niósł numer
 * linii, „który już się przesunął".
 *
 * Cztery pliki `docs/` mają ZERO takich cytowań (`README.md`, `UX.md`,
 * `WYDANIE.md`, `specy/README.md`) i to nie przypadek: **to pliki, które mają
 * przeżyć.** `POTOK.md` należy do tej grupy.
 */
describe("docs/POTOK.md nie cytuje numerów linii NASZEGO kodu", () => {
  test("brak wzorca `plik.ts:123`", () => {
    const trafienia = [...POTOK.matchAll(/\b[a-z0-9-]+\.ts:\d+/g)].map((m) => m[0]);
    expect(trafienia).toEqual([]);
  });

  /**
   * Strażnik wyżej celuje WYŁĄCZNIE w nasze `.ts` i ten test pilnuje, żeby nikt
   * nie rozszerzył go „dla porządku" na źródła gry.
   *
   * Cytaty z `Battle.js` i `BattleMessages.js` wskazują na ZAMROŻONY build
   * deweloperski — nie mają jak się przesunąć, a to one są dowodem, że nasz
   * rozbiór odwzorowuje grę, a nie ją interpretuje. Zakaz obejmujący je
   * skasowałby jedyne cytowania w tym pliku, które są warte swojej precyzji.
   */
  test("cytaty ze ŹRÓDEŁ GRY zostają", () => {
    expect(POTOK).toContain("BattleMessages.js");
  });
});
