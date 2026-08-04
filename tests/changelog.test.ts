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
    // ⚠️ WERSJA WPISANA NA SZTYWNO, I TO JEST POPRAWKA Z 2026‑08‑04.
    //
    // Test brał wcześniej `pkg.version` i sprawdzał, że sekcja niesie zarówno
    // `**Nowość**`, jak i `**Poprawka**` — jako namiastkę „od góry do dołu".
    // To wiąże test z TREŚCIĄ wydania, które akurat się przygotowuje: wydanie
    // bez ani jednej poprawki jest w pełni legalne, a test je blokował.
    // Zapalił się przy `0.5.0` (nowość + dwie zmiany, zero poprawek).
    //
    // `0.4.0` jest do tego lepsze, bo ma **tag** — a `docs/WYDANIE.md` mówi
    // wprost: „po tagu sekcji się nie rusza, ktoś już to wydanie ma". Treść
    // jest więc zamrożona, a test dalej mierzy to samo: czy granice sekcji
    // biegną tam, gdzie trzeba.
    const wydane = changelogSection(CHANGELOG, "0.4.0")!;
    expect(wydane).toContain("**Nowość**");
    expect(wydane).toContain("**Poprawka**");
    expect(wydane).not.toContain("## [0.3.0]");
    expect(wydane).not.toContain("Instalacja jednym kliknięciem");
  });

  test("sekcja bieżącej wersji nie zahacza o poprzednią", () => {
    // To, co z poprzedniego testu dotyczy WYDAWANEJ wersji i nie zakłada
    // niczego o rodzajach wpisów w niej.
    const biezaca = changelogSection(CHANGELOG, pkg.version)!;
    expect(biezaca).toMatch(/\*\*(Nowość|Zmiana|Poprawka)\*\*/);
    expect(biezaca).not.toMatch(/^## \[/m);
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

  /**
   * CLI, nie sama funkcja.
   *
   * `changelogSection` była pokryta w 100 %, a blok `import.meta.main` wokół
   * niej — w ogóle. To odwrotnie, niż powinno: czysta funkcja wykonuje się przy
   * każdym `bun test`, a CLI wyłącznie przy wypchnięciu taga, czyli tam, gdzie
   * literówka jest najdroższa i gdzie nikt jej nie zobaczy przed wydaniem.
   * Docstring tego modułu mówi to wprost i był dotąd bez pokrycia w testach.
   *
   * Podproces, a nie import: sprawdzamy KODY WYJŚCIA, po których `release.yml`
   * decyduje, czy przerwać wydanie. Z importu nie da się ich zobaczyć.
   */
  describe("CLI wydania", () => {
    const run = async (args: string[]) => {
      const proc = Bun.spawn(["bun", "tools/changelog.ts", ...args], {
        cwd: new URL("..", import.meta.url).pathname,
        stdout: "pipe",
        stderr: "pipe",
      });
      const [stdout, stderr, code] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
      ]);
      return { stdout, stderr, code };
    };

    test("znana wersja daje pełną treść wydania i kod 0", async () => {
      const { stdout, code } = await run([pkg.version]);
      expect(code).toBe(0);
      // Trzy części sklejone przez `releaseNotes`: ostrzeżenie o fazie, zmiany,
      // stopka o plikach. Brak którejkolwiek to wydanie uboższe, nie zepsute —
      // czyli awaria, której nikt nie zgłosi.
      expect(stdout).toContain("Wczesna faza");
      // ⚠️ Stało tu `toContain("**Nowość**")` i zapaliło się przy 0.5.0 — słusznie
      // co do mechaniki, niesłusznie co do treści. Wydanie BEZ ani jednej nowości
      // jest normalne (0.5.0 to same zmiany i jedna poprawka), a test pilnował
      // przy okazji tego, czego nie miał pilnować: rodzaju wpisów. Pytanie brzmi
      // „czy część ze zmianami w ogóle doklejona", więc pyta o dowolny wpis.
      expect(stdout).toMatch(/^- \*\*(Nowość|Zmiana|Poprawka)\*\* — /m);
      expect(stdout).toContain("nie do klikania");
    });

    test("nieznana wersja PRZERYWA wydanie", async () => {
      // Kod 1 jest tu całą treścią: `release.yml` puszcza to bez `|| true`,
      // więc wydanie bez opisu zmian nie powstaje.
      const { code, stderr } = await run(["9.9.9"]);
      expect(code).toBe(1);
      expect(stderr).toContain("9.9.9");
    });

    test("brak argumentu to błąd użycia, nie puste wydanie", async () => {
      const { code, stderr } = await run([]);
      expect(code).toBe(2);
      expect(stderr).toContain("użycie:");
    });
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
