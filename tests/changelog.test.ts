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

  test("sekcja kończy się na następnej WERSJI, nie na podsekcji", () => {
    // Gdyby cięcie szło po „### ", wydanie ogłaszałoby samo „Dodane" i gubiło
    // „Naprawione" — czyli dokładnie tę część, po którą się do zmian zagląda.
    const section = changelogSection(CHANGELOG, pkg.version)!;
    expect(section).toContain("### Dodane");
    expect(section).toContain("### Naprawione");
    // ...ale nie zahacza o wpis sąsiada.
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
