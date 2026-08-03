import { describe, expect, test } from "bun:test";
import {
  SKIP_MARK,
  ocena,
  sygnal,
  unreleasedEntries,
  unreleasedSection,
  unreleasedTouched,
} from "../tools/wydanie.ts";

/**
 * Strażnicy wydania. Powód ich istnienia — i powód, dla którego są DWA —
 * stoi w nagłówku `tools/wydanie.ts`.
 *
 * Testy celowo odtwarzają PRAWDZIWE sytuacje z historii tego repo, a nie
 * wymyślone: trzy z nich to commity, na których naiwny strażnik („zmiana
 * w `src/` → nowa linia zaczynająca się od `-`") zapaliłby się fałszywie.
 */

const CHANGELOG = (unreleased: string) =>
  [
    "# Zmiany",
    "",
    "## [Niewydane]",
    "",
    unreleased,
    "",
    "## [0.3.0] — 2026-08-01",
    "",
    "- **Nowość** — Instalacja jednym kliknięciem.",
    "",
  ].join("\n");

const PUSTA = ["# Zmiany", "", "## [0.3.0] — 2026-08-01", "", "- **Nowość** — Coś.", ""].join("\n");

describe("sekcja [Niewydane]", () => {
  test("czyta wpisy, nie linie", () => {
    // Wpis ma jedno–trzy zdania i potrafi zająć kilka linijek. Licznik linii
    // mówiłby o zawijaniu tekstu, a nie o liczbie zmian.
    const changelog = CHANGELOG(
      ["- **Poprawka** — Zdanie pierwsze,", "  które zawija się na drugą linię.", "- **Zmiana** — Drugie."].join("\n"),
    );
    expect(unreleasedEntries(changelog)).toEqual([
      "- **Poprawka** — Zdanie pierwsze,",
      "- **Zmiana** — Drugie.",
    ]);
  });

  test("brak sekcji to nie to samo co sekcja pusta", () => {
    // Po wydaniu sekcji nie ma wcale i to jest stan poprawny.
    expect(unreleasedSection(PUSTA)).toBeNull();
    expect(unreleasedEntries(PUSTA)).toEqual([]);
    expect(unreleasedSection(CHANGELOG(""))).toBe("");
  });

  test("nie zahacza o sekcję wydanej wersji", () => {
    expect(unreleasedSection(CHANGELOG("- **Zmiana** — Nasza."))).toBe("- **Zmiana** — Nasza.");
  });
});

describe("strażnik: zmiana w src/ bez wpisu", () => {
  const commit = (subject: string) => [subject];

  test("przepuszcza zakres, który nie rusza src/", () => {
    const wynik = ocena({
      pliki: ["docs/AUDYT.md", "tests/parser.test.ts"],
      przed: PUSTA,
      po: PUSTA,
      komunikaty: commit("docs: audyt rejestrów"),
    });
    expect(wynik.ok).toBe(true);
  });

  test("zapala się na zmianie w src/ bez ruszenia [Niewydane]", () => {
    const wynik = ocena({
      pliki: ["src/overlay.ts"],
      przed: CHANGELOG("- **Zmiana** — Stara."),
      po: CHANGELOG("- **Zmiana** — Stara."),
      komunikaty: commit("feat(overlay): nowy wiersz w panelu"),
    });
    expect(wynik.ok).toBe(false);
    expect(wynik.powod).toContain("feat(overlay): nowy wiersz w panelu");
    expect(wynik.powod).toContain(SKIP_MARK);
  });

  test("POPRAWIENIE istniejącego wpisu wystarczy — przypadek 91fc412", () => {
    // Ten commit dopisał zdanie do wpisu, który już był („Przy takim ubytku
    // panel pisze «Bez sprawcy»"). Żadna nowa pozycja nie powstała, więc
    // strażnik szukający nowych wypunktowań ogłosiłby brak wpisu przy commicie,
    // który changelog właśnie poprawiał.
    const wynik = ocena({
      pliki: ["src/stats.ts"],
      przed: CHANGELOG("- **Poprawka** — Ubytki życia wchodzą do przyjętych."),
      po: CHANGELOG("- **Poprawka** — Ubytki życia wchodzą do przyjętych. Panel pisze „Bez sprawcy”."),
      komunikaty: commit("fix(stats): ubytek życia nie obciąża przeciwnika"),
    });
    expect(wynik.ok).toBe(true);
  });

  test("wpis dołożony INNYM commitem zakresu wystarczy — przypadek 8bfa80b + 00fcdd2", () => {
    // Liczy się ZAKRES, nie pojedynczy commit: tamte dwa poszły osobno, a wpisy
    // dla pierwszego przyszły z drugim. Ocena per commit zapaliłaby się na
    // pierwszym, choć changelog dostał swoje.
    const wynik = ocena({
      pliki: ["src/overlay.ts", "CHANGELOG.md"],
      przed: CHANGELOG(""),
      po: CHANGELOG("- **Nowość** — Panel pokazuje numer wersji."),
      komunikaty: [
        "feat(overlay): zgłoszenie mówi, z której wersji pochodzi",
        "docs: audyt wydania i rejestrów",
      ],
    });
    expect(wynik.ok).toBe(true);
  });

  test("refaktor i testy nie wymagają wpisu, bo CHANGELOG ich zabrania", () => {
    // `AGENTS.md`: „Rzeczy, które użytkownika nie dotyczą (refaktory, testy,
    // narzędzia), tu NIE WCHODZĄ". Strażnik wymuszający wpis przy refaktorze
    // zmuszałby do wyboru między czerwoną bramą a złamaniem tamtej reguły.
    for (const subject of [
      "refactor(overlay): wydzielony arkusz",
      "test(parser): korpus po naprawie",
      "build(release): 0.4.0",
      "chore: bump lockfile",
    ]) {
      expect([subject, ocena({
        pliki: ["src/overlay.ts"],
        przed: PUSTA,
        po: PUSTA,
        komunikaty: commit(subject),
      }).ok]).toEqual([subject, true]);
    }
  });

  test("znacznik w komunikacie zwalnia feat/fix, którego użytkownik nie zobaczy", () => {
    const wynik = ocena({
      pliki: ["src/parser.ts"],
      przed: PUSTA,
      po: PUSTA,
      komunikaty: [`fix(parser): literówka w komentarzu\n\n${SKIP_MARK}`],
    });
    expect(wynik.ok).toBe(true);
  });

  test("jeden głośny commit w zakresie wystarczy, żeby wymagać wpisu", () => {
    // Inaczej wystarczyłoby dorzucić refaktor, żeby przemycić `feat` bez wpisu.
    const wynik = ocena({
      pliki: ["src/overlay.ts"],
      przed: PUSTA,
      po: PUSTA,
      komunikaty: ["refactor(overlay): porządki", "feat(overlay): nowa zakładka"],
    });
    expect(wynik.ok).toBe(false);
    expect(wynik.powod).toContain("feat(overlay): nowa zakładka");
    expect(wynik.powod).not.toContain("refactor(overlay): porządki");
  });
});

describe("sygnał: jest co wydać", () => {
  test("milczy, gdy nie ma czego wydać", () => {
    expect(sygnal([], "v0.3.0", 0)).toContain("Nic nie czeka");
  });

  test("liczy wpisy i podaje komendę tagowania", () => {
    // To jest jedyny strażnik, który złapałby incydent z 2026-08-03: wpis
    // ISTNIAŁ, więc twarda reguła wyżej przepuściłaby go bez słowa.
    const tekst = sygnal(
      ["- **Zmiana** — Odznaka profesji wszędzie.", "- **Poprawka** — Ubytki życia."],
      "v0.3.0",
      11,
    );
    expect(tekst).toContain("**2**");
    expect(tekst).toContain("v0.3.0");
    expect(tekst).toContain("11 commit");
    expect(tekst).toContain("git tag vX.Y.Z");
  });

  test("radzi sobie z repo bez ani jednego wydania", () => {
    expect(sygnal(["- **Nowość** — Pierwsza."], null, 3)).toContain("(brak wydań)");
  });
});

describe("porównanie sekcji", () => {
  test("widzi zmianę treści, nie tylko przybycie linii", () => {
    expect(unreleasedTouched(CHANGELOG("- **A** — raz."), CHANGELOG("- **A** — raz i pół."))).toBe(
      true,
    );
  });

  test("nie widzi zmian poza sekcją", () => {
    // Poprawka w sekcji WYDANEJ wersji nie jest wpisem o bieżącej zmianie.
    const przed = CHANGELOG("- **A** — raz.");
    expect(unreleasedTouched(przed, przed.replace("Instalacja jednym", "Instalacja dwoma"))).toBe(
      false,
    );
  });
});
