import { describe, expect, test } from "bun:test";
import { changelogSection } from "../tools/changelog.ts";
import pkg from "../package.json" with { type: "json" };

const CHANGELOG = await Bun.file(
  new URL("../CHANGELOG.md", import.meta.url).pathname,
).text();

describe("sekcja wydania z CHANGELOG-a", () => {
  test("wersja z package.json MA swój wpis", () => {
    // To jest brama wydania przeniesiona do testów: tag powstaje z `version`,
    // a workflow bierze treść wydania stąd. Bump numeru bez dopisania sekcji
    // dałby wydanie bez ani jednego zdania o tym, co się zmieniło.
    const section = changelogSection(CHANGELOG, pkg.version);
    expect([pkg.version, section === null]).toEqual([pkg.version, false]);
    expect(section!.length).toBeGreaterThan(0);
  });

  test("sekcja obejmuje CAŁĄ wersję i nie zahacza o sąsiada", () => {
    const section = changelogSection(CHANGELOG, pkg.version)!;
    // Wpisy z całej rozpiętości typów, czyli od góry do dołu sekcji.
    expect(section).toContain("**Nowość**");
    expect(section).toContain("**Poprawka**");
    expect(section).not.toContain("## [0.2.0]");
  });

  test("nieznana wersja daje null, nie pustą treść", () => {
    expect(changelogSection(CHANGELOG, "9.9.9")).toBeNull();
  });

  test("numer w treści wpisu nie udaje nagłówka sekcji", () => {
    // W `[0.2.0]` stoi zdanie „wycofana z opisu wydania 0.1.0". Szukanie po
    // samej liczbie trafiłoby w środek cudzej sekcji i wydanie 0.1.0
    // ogłosiłoby ogon zmian z 0.2.0.
    const jeden = changelogSection(CHANGELOG, "0.1.0")!;
    expect(jeden).not.toContain("wycofana z opisu wydania");
    expect(jeden).toContain("Nakładka z licznikiem obrażeń");
  });

  /** Wpisy (linie `- ...`) ze WSZYSTKICH sekcji wersji, bez nagłówka pliku. */
  const entries = (): string[] => {
    const lines = CHANGELOG.split("\n");
    const start = lines.findIndex((line) => line.startsWith("## ["));
    return lines.slice(start).filter((line) => line.startsWith("- "));
  };

  test("każdy wpis zaczyna się typem po polsku", () => {
    // Niezmiennik po całym pliku, nie asercja na jedną wersję: gdy dojdzie
    // kolejne wydanie, ten test obejmie je sam. Typ per wpis zastąpił nagłówki
    // „### Dodane / Zmienione / Naprawione" — lista ma się skanować wzrokiem.
    const wpisy = entries();
    expect(wpisy.length).toBeGreaterThan(20);
    const zle = wpisy.filter((line) => !/^- \*\*(Nowość|Zmiana|Poprawka)\*\* — /.test(line));
    expect(zle).toEqual([]);
  });

  test("wpisy nie używają pojęć programistycznych", () => {
    // Ten plik czyta gracz Margonema, nie programista. Reguła bywa łamana
    // niechcący, bo pisze go ktoś, kto właśnie siedział w kodzie — stąd test,
    // a nie zdanie w konwencji. Praca programistyczna ma własne miejsce
    // (`docs/specy/`) i tam te słowa są na miejscu.
    const zakazane = [
      "parser",
      "regex",
      "refaktor",
      "commit",
      "cache",
      "localStorage",
      "fixture",
      "bundle",
      "callback",
      "endpoint",
      "textarea",
      "API",
      "DOM",
    ];
    // Granice po literach UNICODE, nie po `\b`: dla ASCII-owego `\b` polskie
    // „ą" nie jest literą, więc „Dotąd" trafiało jako „DoT". Fałszywy alarm
    // w teście, który ma pilnować czystości, uczy tylko tego, żeby go wyłączyć.
    const trafienia: string[] = [];
    for (const line of entries()) {
      for (const slowo of zakazane) {
        if (new RegExp(`(?<!\\p{L})${slowo}(?!\\p{L})`, "iu").test(line)) {
          trafienia.push(`${slowo}: ${line.slice(0, 60)}`);
        }
      }
      // „DoT" osobno i z uwzględnieniem wielkości liter — inaczej łapie „Dotąd".
      if (/(?<!\p{L})DoT(?!\p{L})/u.test(line)) trafienia.push(`DoT: ${line.slice(0, 60)}`);
    }
    expect(trafienia).toEqual([]);
  });

  test("każda wersja z pliku daje niepustą sekcję", () => {
    // Niezmiennik po CAŁYM pliku zamiast trzech asercji z palca: gdy dojdzie
    // kolejne wydanie, ten test obejmie je sam.
    const versions = [...CHANGELOG.matchAll(/^## \[(\d+\.\d+\.\d+)\]/gm)].map((m) => m[1]!);
    expect(versions.length).toBeGreaterThan(1);
    for (const version of versions) {
      const section = changelogSection(CHANGELOG, version);
      expect([version, section !== null && section.length > 0]).toEqual([version, true]);
    }
  });
});
