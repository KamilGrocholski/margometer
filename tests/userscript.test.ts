import { describe, expect, test } from "bun:test";
import { appliesTo, banner, metaField } from "../tools/userscript-meta.ts";
import pkg from "../package.json" with { type: "json" };

const META = banner(pkg.version, pkg.description, pkg.homepage);

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

  /**
   * Niezmiennik zamiast listy: te same subdomeny sprawdzane w OBU domenach.
   *
   * Poprzednia wersja wymieniała z palca adresy, które już odpadały — i przez to
   * nie miała jak zapalić się na tym, czego w `@exclude` brakowało. Brakowało
   * dużo (`AUDYT‑42`): dla `.com` nie było ani `forum`, ani `commons`, a strona
   * główna bez „www" wchodziła w obu domenach, bo `*.margonem.pl` obejmuje też
   * sam `margonem.pl`. Pętla po iloczynie „subdomena × domena" nie da się już
   * uzupełnić po jednej stronie.
   */
  test("podstrony, które grą nie są, odpadają — w OBU domenach", () => {
    const niegrowe = ["", "www.", "forum.", "commons.", "pomoc."];
    for (const domena of ["margonem.pl", "margonem.com"]) {
      for (const host of niegrowe) {
        const url = `https://${host}${domena}/`;
        expect([url, appliesTo(META, url)]).toEqual([url, false]);
      }
    }
  });

  test("podstrona ze ścieżką i query też odpada", () => {
    // Wykluczenia kończą się na "/*", więc muszą łapać nie tylko korzeń.
    for (const url of [
      "https://forum.margonem.pl/temat/1",
      "https://forum.margonem.com/temat/1",
      "https://pomoc.margonem.pl/index/view,372",
      "https://www.margonem.pl/nowa-postac?swiat=tempest",
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

describe("kanał aktualizacji", () => {
  const one = (field: string) => {
    const values = metaField(META, field);
    // Dwa `@downloadURL` w nagłówku to nie jest teoria: pola powielają się przy
    // kopiowaniu linii, a Tampermonkey bierze wtedy JEDNO z nich i nie mówi
    // które. Nagłówek ma mieć po jednym.
    expect([field, values.length]).toEqual([field, 1]);
    return values[0]!;
  };

  test("pobieranie idzie po skrypt, a sprawdzanie wersji po sam nagłówek", () => {
    // Zamiana tych dwóch miejscami jest cicha i kosztowna: aktualizacja
    // podmieniłaby działający dodatek na goły nagłówek bez ani jednej linii
    // kodu, a Tampermonkey nie ma powodu tego zgłosić.
    expect(one("downloadURL").endsWith("/margometer.user.js")).toBe(true);
    expect(one("updateURL").endsWith("/margometer.meta.js")).toBe(true);
  });

  test("adresy są absolutne i wskazują wydania TEGO repozytorium", () => {
    // Adres względny albo cudzy to dodatek, który aktualizuje się donikąd
    // (w najlepszym razie) albo z nie swojego źródła (w najgorszym).
    for (const field of ["downloadURL", "updateURL"]) {
      const url = one(field);
      expect([field, url.startsWith(`${pkg.homepage}/releases/latest/download/`)]).toEqual([
        field,
        true,
      ]);
      expect([field, new URL(url).protocol]).toEqual([field, "https:"]);
    }
  });

  test("adres wydania nie niesie numeru wersji", () => {
    // `latest/download` przekierowuje samo. Adres z wpisanym numerem musiałby
    // być poprawiany przy każdym wydaniu, a zapomniana poprawka daje dodatek,
    // który na zawsze aktualizuje się do jednej starej wersji.
    for (const field of ["downloadURL", "updateURL"]) {
      expect([field, one(field).includes(pkg.version)]).toEqual([field, false]);
    }
  });

  test("licencja jedzie razem z plikiem i zgadza się z package.json", () => {
    // Do użytkownika dociera SAM `.user.js`, nie repozytorium: Tampermonkey
    // pokazuje ten nagłówek przy instalacji, a `LICENSE` widzi tylko ten, kto
    // wejdzie na GitHuba. Dwa zapisy licencji, które się rozjadą, są gorsze niż
    // jeden — dlatego porównanie z `package.json`, a nie literał obok literału.
    expect(metaField(META, "license")).toEqual([pkg.license]);
    expect(pkg.license).toBe("MIT");
  });

  test("tożsamość dodatku wskazuje prawdziwe repozytorium", () => {
    // Stało tu `https://github.com/margometer` — adres, którego nie ma.
    // `@namespace` jest identyfikatorem, więc jego zmiana rozdziela instalacje;
    // ta jest jednorazowa i idzie przed pierwszym wydaniem, nie po nim.
    expect(metaField(META, "namespace")).toEqual([pkg.homepage]);
    expect(metaField(META, "homepageURL")).toEqual([pkg.homepage]);
  });
});
