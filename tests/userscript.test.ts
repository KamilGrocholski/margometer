import { describe, expect, test } from "bun:test";
import { appliesTo, banner, metaField } from "../tools/userscript-meta.ts";
import pkg from "../package.json" with { type: "json" };

const META = banner(pkg.version, pkg.description);

describe("nagłówek userscriptu", () => {
  test("wersja idzie z package.json", () => {
    // Tampermonkey aktualizuje dodatek po TYM numerze. Zaszyty literał znaczy,
    // że wydanie nie dociera do nikogo — tak stało 0.1.0 przez kilkanaście
    // commitów funkcjonalnych.
    expect(metaField(META, "version")).toEqual([pkg.version]);
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("nagłówek ma domknięcie i wymagane pola", () => {
    expect(META.startsWith("// ==UserScript==\n")).toBe(true);
    expect(META).toContain("// ==/UserScript==");
    expect(metaField(META, "grant")).toEqual(["none"]);
    expect(metaField(META, "run-at")).toEqual(["document-idle"]);
  });

  test("adresy światów łapią się", () => {
    // Bez "/*" w ścieżce świat otwarty z query stringiem nie łapał się wcale —
    // ten błąd wjechał raz i musiał być cofany osobnym commitem.
    for (const url of [
      "https://tempest.margonem.pl/",
      "https://tempest.margonem.pl/?world=tempest",
      "https://berufs.margonem.com/",
      "https://aran.margonem.pl/#nick",
    ]) {
      expect([url, appliesTo(META, url)]).toEqual([url, true]);
    }
  });

  test("podstrony, które grą nie są, odpadają", () => {
    for (const url of [
      "https://www.margonem.pl/",
      "https://forum.margonem.pl/temat/1",
      "https://commons.margonem.pl/",
      "https://pomoc.margonem.pl/index/view,372",
      "https://www.margonem.com/",
    ]) {
      expect([url, appliesTo(META, url)]).toEqual([url, false]);
    }
  });

  test("obce domeny nie łapią się w ogóle", () => {
    expect(appliesTo(META, "https://margonem.pl.example.com/")).toBe(false);
    expect(appliesTo(META, "http://tempest.margonem.pl/")).toBe(false);
  });

  test("dodatek nie startuje w ramkach", () => {
    // Strona gry osadza ramki; bez tego bundle leciałby w każdej z nich.
    expect(META).toContain("// @noframes");
  });
});
