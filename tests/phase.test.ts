import { describe, expect, test } from "bun:test";
import { PHASE, PHASE_LABEL, PHASE_NOTE } from "../tools/phase.ts";
import { banner, metaField } from "../tools/userscript-meta.ts";
import pkg from "../package.json" with { type: "json" };

const root = (name: string) => new URL(`../${name}`, import.meta.url).pathname;
const README = await Bun.file(root("README.md")).text();
const CHANGELOG = await Bun.file(root("CHANGELOG.md")).text();
const META = banner(pkg.version, pkg.description, pkg.homepage);

/**
 * Faza żyje w JEDNYM miejscu (`tools/phase.ts`), ale widać ją w czterech.
 * Dwa z nich to proza, której nie da się zaimportować — więc pilnuje ich ten
 * plik. Bez niego „wyjście z alfy" skończyłoby się tak, jak kończyły się tu
 * wszystkie statusy żyjące w kilku kopiach: zdjęte tam, gdzie się patrzy,
 * i zostawione tam, gdzie się nie patrzy.
 */
describe("oznaczenie fazy projektu", () => {
  test("nazwa skryptu niesie fazę", () => {
    const name = metaField(META, "name")[0]!;
    expect(name.startsWith("MargoMeter")).toBe(true);
    if (PHASE === null) {
      expect(name).toBe("MargoMeter");
    } else {
      // To pierwsze, co widzi użytkownik w oknie instalacji Tampermonkey.
      expect(name).toBe(`MargoMeter (${PHASE})`);
    }
  });

  test("README i CHANGELOG mówią o tej samej fazie co kod", () => {
    for (const [gdzie, tekst] of [
      ["README.md", README],
      ["CHANGELOG.md", CHANGELOG],
    ] as const) {
      if (PHASE === null) {
        // Wyjście z fazy: teksty mają przestać ją ogłaszać. Ten test jest
        // wtedy listą miejsc do poprawienia, a nie zgadywanką.
        expect([gdzie, tekst.toLowerCase().includes("wczesna faza")]).toEqual([gdzie, false]);
      } else {
        expect([gdzie, tekst.includes(`Wczesna faza (${PHASE})`)]).toEqual([gdzie, true]);
      }
    }
  });

  test("treść wydania niesie ostrzeżenie, gdy faza trwa", () => {
    if (PHASE === null) {
      expect(PHASE_NOTE).toBe("");
      expect(PHASE_LABEL).toBe("");
    } else {
      expect(PHASE_NOTE).toContain(PHASE);
      // Cytat blokowy, bo to ma się wyróżnić nad treścią z CHANGELOG-a.
      expect(PHASE_NOTE.startsWith("> ")).toBe(true);
    }
  });

  test("wersja jest zerowa, dopóki trwa faza wczesna", () => {
    // SemVer: „Major version zero (0.y.z) is for initial development. Anything
    // MAY change at any time." Numer i słowo mają mówić to samo — `1.0.0`
    // z dopiskiem „(alpha)" byłby sprzecznością samą w sobie.
    if (PHASE !== null) {
      expect([pkg.version, pkg.version.startsWith("0.")]).toEqual([pkg.version, true]);
    }
  });
});
