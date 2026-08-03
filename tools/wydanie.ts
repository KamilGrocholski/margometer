/**
 * Dwa strażnicy wydania: „jest co wydać" i „zmiana w `src/` bez wpisu".
 *
 * Osobny moduł z czystymi funkcjami, z tego samego powodu co `changelog.ts`:
 * gdyby ta logika mieszkała w YAML-u, uruchamiałby ją wyłącznie CI, a literówkę
 * widać by było dopiero na czerwonej bramie cudzego PR-a.
 *
 * POWÓD ISTNIENIA, zapisany, bo bez niego oba te strażniki wyglądają na
 * ceremonię. 2026‑08‑03 przyszło zgłoszenie „litery profesji nie są widoczne
 * wszędzie". Naprawa siedziała w repo od trzech commitów i miała swój wpis
 * w `[Niewydane]` — tylko nigdy nie została wydana, a `package.json` stał na
 * numerze ostatniego taga, więc Tampermonkey nie miał po czym poznać, że jest
 * co pobrać. Zgłaszający patrzył na kod sprzed trzech commitów.
 *
 * Stąd podział ról, który wygląda na dublowanie, a nim nie jest:
 *
 * - `ocena` (twarda, wywraca bramę) łapie zmianę w `src/`, o której użytkownik
 *   nigdzie się nie dowie;
 * - `sygnal` (miękki, nigdy nie wywraca) łapie wpisy, które LEŻĄ niewydane —
 *   czyli dokładnie tamten incydent, którego twardy strażnik by nie zobaczył,
 *   bo wpis przecież był.
 */

/** Nagłówek sekcji zbierającej zmiany przed kolejnym wydaniem. */
export const UNRELEASED_HEADING = "## [Niewydane]";

/**
 * Znacznik w komunikacie commita, który zwalnia z wpisu.
 *
 * Furtka jest konieczna, bo `CHANGELOG.md` jest DLA UŻYTKOWNIKA i `AGENTS.md`
 * zabrania wpisywać tam refaktory, testy i narzędzia. Bez niej strażnik
 * wymuszałby wpisy, których ten sam plik zakazuje — czyli zmuszałby do wyboru
 * między czerwoną bramą a złamaniem własnej reguły.
 *
 * Typy z Conventional Commits (`refactor`, `test`, `docs`, …) zwalniają same
 * z siebie i furtka jest dla przypadków spoza tej listy: `fix`, który poprawia
 * wyłącznie komentarz, albo `feat` ukryty za flagą.
 */
export const SKIP_MARK = "[bez-changeloga]";

/**
 * Typy commitów, których użytkownik nie widzi w grze.
 *
 * `feat`, `fix` i `perf` NIE są tu wymienione świadomie: pierwsze dwa z definicji
 * zmieniają to, co widać, a `perf` w tym repo zawsze dotąd zmieniał (płynność
 * gry przy otwieraniu archiwum, rozmiar sesji w pamięci) i ma swoje wpisy.
 */
const SILENT_TYPE = /^(refactor|test|docs|build|chore|ci|style)(\([^)]*\))?!?:/;

/** Treść sekcji `[Niewydane]` albo `null`, gdy sekcji nie ma. */
export function unreleasedSection(changelog: string): string | null {
  const lines = changelog.split("\n");
  const start = lines.findIndex((line) => line.startsWith(UNRELEASED_HEADING));
  if (start === -1) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("## "));
  return (end === -1 ? rest : rest.slice(0, end)).join("\n").trim();
}

/**
 * Wpisy czekające na wydanie — same nagłówki, bez zawijanych linii.
 *
 * Liczymy wpisy, nie linie: wpis ma jedno–trzy zdania i potrafi zająć cztery
 * linijki, więc licznik linii mówiłby o formatowaniu, a nie o zmianach.
 */
export function unreleasedEntries(changelog: string): string[] {
  const section = unreleasedSection(changelog);
  if (section === null || section === "") return [];
  return section.split("\n").filter((line) => line.startsWith("- "));
}

/**
 * Czy sekcja `[Niewydane]` różni się między dwiema wersjami pliku.
 *
 * Porównanie CAŁEJ sekcji, a nie „czy przybyła linia zaczynająca się od `-`",
 * i to jest wniosek z pomiaru na własnej historii: commit `91fc412` poprawiał
 * ISTNIEJĄCY wpis (dopisał zdanie o „Bez sprawcy"), więc żadna nowa pozycja nie
 * powstała. Strażnik szukający nowych wypunktowań ogłosiłby brak wpisu przy
 * commicie, który changelog właśnie poprawiał.
 */
export function unreleasedTouched(before: string, after: string): boolean {
  return unreleasedSection(before) !== unreleasedSection(after);
}

export type Zakres = {
  /** Ścieżki zmienione w zakresie, tak jak podaje je `git diff --name-only`. */
  pliki: string[];
  /** `CHANGELOG.md` sprzed zakresu. Pusty łańcuch, gdy pliku wtedy nie było. */
  przed: string;
  /** `CHANGELOG.md` po zakresie. */
  po: string;
  /** Pełne komunikaty commitów w zakresie. */
  komunikaty: string[];
};

export type Ocena = { ok: boolean; powod: string };

/**
 * Czy zakres zmian wolno wpuścić bez wpisu w `[Niewydane]`.
 *
 * Liczy się ZAKRES, nie pojedynczy commit — i to też jest wniosek z historii:
 * `8bfa80b` i `913aee8` zmieniały `src/`, a wpisy dla nich doszły osobnym
 * commitem `00fcdd2`. Przy ocenie per commit strażnik zapaliłby się na obu,
 * choć changelog dostał swoje. Na PR-ze zakres to `base..head`, na push do
 * `main` — cały wypchnięty ciąg.
 */
export function ocena(zakres: Zakres): Ocena {
  const src = zakres.pliki.filter((path) => path.startsWith("src/"));
  if (src.length === 0) return { ok: true, powod: "zakres nie rusza `src/`" };
  if (unreleasedTouched(zakres.przed, zakres.po)) {
    return { ok: true, powod: "sekcja `[Niewydane]` została zmieniona" };
  }

  const glosne = zakres.komunikaty.filter(
    (message) => !SILENT_TYPE.test(message.trim()) && !message.includes(SKIP_MARK),
  );
  if (glosne.length === 0) {
    return { ok: true, powod: "wszystkie commity są typu niewidocznego dla użytkownika" };
  }

  const lista = glosne.map((message) => `  • ${message.trim().split("\n")[0]}`).join("\n");
  return {
    ok: false,
    powod: [
      `Zmiana w \`src/\` (${src.length} plik(ów)) bez ani jednej zmiany w sekcji ${UNRELEASED_HEADING}.`,
      "",
      "Commity, które tego wymagają:",
      lista,
      "",
      "Dopisz wpis dla użytkownika (bez pojęć programistycznych — zasady w nagłówku",
      `CHANGELOG.md), albo — jeśli zmiana naprawdę go nie dotyczy — dopisz ${SKIP_MARK}`,
      "do komunikatu commita.",
    ].join("\n"),
  };
}

/**
 * Podsumowanie „jest co wydać", w Markdownie do `$GITHUB_STEP_SUMMARY`.
 *
 * Nigdy nie wywraca bramy. To jest przypomnienie, nie reguła: wpisy mogą leżeć
 * niewydane tygodniami i bywa to słuszne. Chodzi o to, żeby leżały ŚWIADOMIE.
 */
export function sygnal(entries: string[], tag: string | null, odTagu: number): string {
  if (entries.length === 0) {
    return `### Wydanie\n\nNic nie czeka — sekcja \`[Niewydane]\` jest pusta.`;
  }
  const wersja = tag ?? "(brak wydań)";
  return [
    "### Wydanie: jest co wydać",
    "",
    `**${entries.length}** ${entries.length === 1 ? "wpis czeka" : "wpisów czeka"} w \`[Niewydane]\`.`,
    `Ostatnie wydanie: **${wersja}**, od tego czasu ${odTagu} commit(ów).`,
    "",
    ...entries.map((entry) => entry.replace(/^- /, "- ")),
    "",
    "Wydanie zamyka podbicie `package.json`, przeniesienie sekcji pod numer",
    "z datą i `git tag vX.Y.Z && git push origin vX.Y.Z`.",
  ].join("\n");
}

if (import.meta.main) {
  const tryb = process.argv[2];
  const czytaj = async (path: string | undefined) =>
    path === undefined || path === "-" ? "" : await Bun.file(path).text().catch(() => "");

  if (tryb === "sygnal") {
    const entries = unreleasedEntries(await Bun.file("./CHANGELOG.md").text());
    const tag = process.argv[3] && process.argv[3] !== "-" ? process.argv[3] : null;
    console.log(sygnal(entries, tag, Number(process.argv[4] ?? 0)));
    // Sygnał NIGDY nie wywraca bramy — patrz komentarz przy `sygnal`.
    process.exit(0);
  }

  if (tryb === "straznik") {
    const [, , , plikiPath, przedPath, poPath, komunikatyPath] = process.argv;
    const pliki = (await czytaj(plikiPath)).split("\n").filter((line) => line !== "");
    // Commity rozdziela ZNAK ROZDZIELAJACY REKORDY (U+001E), a nie pusta linia
    // ani "---": jedno i drugie pada w tresci komunikatow tego repo, wiec
    // rozcieloby jeden commit na dwa i zgubilo typ z naglowka.
    const komunikaty = (await czytaj(komunikatyPath))
      .split("\u001e")
      .map((part) => part.trim())
      .filter((part) => part !== "");
    const wynik = ocena({
      pliki,
      przed: await czytaj(przedPath),
      po: await czytaj(poPath),
      komunikaty,
    });
    console.log(wynik.powod);
    process.exit(wynik.ok ? 0 : 1);
  }

  console.error("użycie: bun tools/wydanie.ts sygnal <tag> <odTagu>");
  console.error("        bun tools/wydanie.ts straznik <pliki> <przed> <po> <komunikaty>");
  process.exit(2);
}
