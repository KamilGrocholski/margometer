import { describe, expect, test } from "bun:test";
import { kluczeCase, mapyModulow, roznicaKluczy, sciezkaDocelowa } from "../tools/zrodla.ts";

/**
 * Czego te testy pilnują: NIE tego, co jest w źródłach gry — to zmienia się poza
 * nami i ma własny rejestr (`docs/MECHANIKA.md`). Tego, żeby narzędzie nie
 * zamieniło „gra przestała serwować build deweloperski" w ciche puste drzewo,
 * i żeby cudza ścieżka z sieci nie zapisała pliku poza katalogiem docelowym.
 *
 * Sieci tu nie ma — wszystkie wejścia są syntetyczne, wzór z `tests/slownik.test.ts`.
 */

/** Moduł w kształcie, jaki webpack wypuszcza w trybie deweloperskim. */
const modul = (sciezka: string, tresc: string | null): string => {
  const mapa = { version: 3, sources: [`webpack:///${sciezka}?668d`], sourcesContent: [tresc] };
  // `Buffer`, nie `btoa` — treść ma polskie znaki, a to jest częścią testu.
  const base64 = Buffer.from(JSON.stringify(mapa), "utf8").toString("base64");
  return (
    `/***/ "${sciezka}":\n/***/ (function(module, exports) {\n\neval("kod;` +
    `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${base64}\\n");\n\n/***/ }),\n`
  );
};

const BUNDLE = [
  "/******/ (function(modules) { // webpackBootstrap\n",
  modul("./src/js/Margonem/core/battle/BattleMessages.js", "var tpl = require('@core/Templates');"),
  modul("./src/js/Margonem/Game.js", "// Zażółć gęślą jaźń\n"),
  "/******/ });\n",
].join("");

describe("mapyModulow", () => {
  test("wyciąga treść i obcina prefiks webpacka razem ze skrótem", () => {
    const zrodla = mapyModulow(BUNDLE);

    expect([...zrodla.keys()].sort()).toEqual([
      "./src/js/Margonem/Game.js",
      "./src/js/Margonem/core/battle/BattleMessages.js",
    ]);
    expect(zrodla.get("./src/js/Margonem/core/battle/BattleMessages.js")).toBe(
      "var tpl = require('@core/Templates');",
    );
  });

  test("polskie znaki przechodzą całe, nie jako krzaki", () => {
    // Nie ozdoba: pierwsze podejście dekodowało `atob`, czyli po bajcie, i każdy
    // komentarz autorów gry z „ą" rozpadał się na dwa znaki. Wyszło tym testem.
    expect(mapyModulow(BUNDLE).get("./src/js/Margonem/Game.js")).toBe("// Zażółć gęślą jaźń\n");
  });

  test("brak map to błąd z powodem, nie ciche puste drzewo", () => {
    // Produkcyjny bundle wygląda dokładnie tak: kod jest, map nie ma. Gdyby to
    // wyszło pustą mapą, `--lista` wypisałoby zero linii i kod 1 — czyli „nie ma
    // takiego pliku" zamiast „nie ma z czego czytać".
    expect(() => mapyModulow("!function(e){var t=1}();")).toThrow(/build deweloperski/);
  });

  test("mapa bez treści źródła jest pomijana, nie wpisywana jako pusta", () => {
    // Sam ten moduł nie daje nic, więc razem z nim musi iść jakiś prawdziwy —
    // inaczej nie da się odróżnić „pominięty" od „rzuciło".
    const zrodla = mapyModulow(modul("./src/js/a.js", null) + modul("./src/js/b.js", "b"));

    expect([...zrodla.keys()]).toEqual(["./src/js/b.js"]);
  });
});

describe("sciezkaDocelowa", () => {
  test("składa ścieżkę pod katalogiem i gubi wiodące ./", () => {
    expect(sciezkaDocelowa("/tmp/x", "./src/js/a.js")).toBe("/tmp/x/src/js/a.js");
    expect(sciezkaDocelowa("/tmp/x/", "src/js/a.js")).toBe("/tmp/x/src/js/a.js");
  });

  test("odrzuca wyjście poza katalog — wejście pochodzi z cudzego serwera", () => {
    expect(sciezkaDocelowa("/tmp/x", "../../etc/passwd")).toBeNull();
    expect(sciezkaDocelowa("/tmp/x", "./src/../../etc/passwd")).toBeNull();
    expect(sciezkaDocelowa("/tmp/x", "/etc/passwd")).toBeNull();
    expect(sciezkaDocelowa("/tmp/x", "./")).toBeNull();
  });
});

describe("kluczeCase", () => {
  test("łapie oba zapisy: zminifikowany i ze źródła", () => {
    expect([...kluczeCase('case"winner":x;case \'+wound\' : y;')].sort()).toEqual([
      "+wound",
      "winner",
    ]);
  });
});

describe("roznicaKluczy", () => {
  test("pokazuje obie strony osobno", () => {
    const { tylkoDev, tylkoProdukcja } = roznicaKluczy(
      "case 'a': case 'wspolny':",
      'case"b":case"wspolny":',
    );

    expect(tylkoDev).toEqual(["a"]);
    expect(tylkoProdukcja).toEqual(["b"]);
  });

  test("zgodne buildy dają dwie puste listy, a nie jedną", () => {
    // Ważne, bo kod wyjścia CLI liczy sumę długości obu list: gdyby zgodność
    // dawała cokolwiek niepustego, czujka rozjazdu świeciłaby zawsze.
    expect(roznicaKluczy("case 'a':", 'case"a":')).toEqual({ tylkoDev: [], tylkoProdukcja: [] });
  });
});
