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

import { changelogSection } from "./changelog.ts";

/** Nazwa sekcji zbierającej zmiany przed kolejnym wydaniem — w miejscu numeru wersji. */
export const UNRELEASED = "Niewydane";

/** Nagłówek tej sekcji, tak jak stoi w pliku. Wchodzi też do komunikatu strażnika. */
export const UNRELEASED_HEADING = `## [${UNRELEASED}]`;

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

/**
 * Treść sekcji `[Niewydane]` albo `null`, gdy sekcji nie ma.
 *
 * Wycinanie robi `changelogSection` z `changelog.ts`, a nie drugi taki sam
 * `findIndex` tutaj. Stały tu przez chwilę oba — znak w znak te same trzy
 * linijki — i to jest dokładnie kształt, który rozjeżdża się przy pierwszej
 * zmianie formatu nagłówka: poprawia się ten parser, który akurat zapalił, a
 * drugi zaczyna cicho zwracać `null`. Wtedy albo wydanie wychodzi puste, albo
 * strażnik przestaje widzieć sekcję i przepuszcza wszystko.
 *
 * Kierunek zależności jest po stronie strażnika świadomie: `changelog.ts`
 * dokłada `phase.ts` i `artifacts.ts`, ale oba to same stałe, bez efektów
 * ubocznych przy imporcie.
 */
export function unreleasedSection(changelog: string): string | null {
  return changelogSection(changelog, UNRELEASED);
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
 * Wpisy z CAŁEGO pliku — ze wszystkich sekcji wersji, nie tylko z `[Niewydane]`.
 *
 * Liczenie zaczyna się od pierwszego nagłówka `## [`, żeby nie wciągnąć
 * komentarza z góry pliku: stoi tam lista zasad, której pozycje też są
 * wypunktowaniem.
 */
export function wszystkieWpisy(changelog: string): string[] {
  const lines = changelog.split("\n");
  const start = lines.findIndex((line) => line.startsWith("## ["));
  if (start === -1) return [];
  return lines.slice(start).filter((line) => line.startsWith("- "));
}

/**
 * Czy lista wpisów dla użytkownika różni się między dwiema wersjami pliku.
 *
 * CAŁY PLIK, nie sama sekcja `[Niewydane]` — i to jest naprawa fałszywego
 * alarmu z 2026‑08‑04. Strażnik pytał wyłącznie o `[Niewydane]`, więc zakres
 * OBEJMUJĄCY WYDANIE wyglądał dla niego identycznie jak „ruszyłeś `src/` i nic
 * nie napisałeś": wpisy w międzyczasie przeprowadziły się pod numer wersji,
 * a sekcji, na którą patrzył, nie było ani przed zakresem, ani po nim. Zapaliło
 * się to na pushu `3c78b73..949947a` — 5 plików w `src/`, dwa `fix`-y, oba ze
 * swoimi wpisami stojącymi w `## [0.4.0]`.
 *
 * Pytanie strażnika brzmi „czy użytkownik się o tym dowie", a dowiaduje się
 * z LISTY WPISÓW, nie z konkretnego nagłówka.
 *
 * PORÓWNANIE NIECZUŁE NA KOLEJNOŚĆ i to jest cały ciężar tej funkcji. Scalenie
 * przenosi te same linie spod `[Niewydane]` w środek sekcji z numerem, czyli
 * zmienia ich kolejność, nie treść. Przy porównaniu uporządkowanym samo
 * przeniesienie wyglądałoby jak nowe wpisy i wydanie zwalniałoby z pisania
 * czegokolwiek — dokładnie odwrotnie, niż ten strażnik ma robić. Po sortowaniu
 * zakres, który TYLKO wydaje i nic nie dopisuje, zostaje czerwony.
 *
 * Porównujemy treść, a nie „czy przybyła linia": commit `91fc412` poprawiał
 * ISTNIEJĄCY wpis (dopisał zdanie o „Bez sprawcy"), więc żadna nowa pozycja nie
 * powstała. Strażnik szukający nowych wypunktowań ogłosiłby brak wpisu przy
 * commicie, który changelog właśnie poprawiał.
 *
 * KOSZT, świadomy: poprawka literówki w sekcji wydanej dawno temu też liczy się
 * jako zmiana i zwolni zakres z wpisu. Węższy wariant („`[Niewydane]` albo
 * sekcja najnowszej wersji") to zamyka, ale dokłada pojęcie „najnowsza sekcja",
 * którego reszta tego modułu nie zna, a łapie przypadek, którego w historii
 * repo nie było ani razu.
 */
export function wpisyZmienione(before: string, after: string): boolean {
  const klucz = (changelog: string) => wszystkieWpisy(changelog).sort().join("\n");
  return klucz(before) !== klucz(after);
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

  // ZERO COMMITÓW to nie to samo co „zero głośnych commitów", choć jedno
  // i drugie kończyło się dalej na `glosne.length === 0`. Pusta lista znaczy
  // „nie wiem, co oceniać": `git log base..head` wychodzi pusty, gdy `head`
  // jest przodkiem `base` (gałąź zsynchronizowana, PR otwarty „w tył") albo
  // gdy zakres policzył się źle — a `git diff` w tym samym przebiegu potrafi
  // wtedy pokazać pełno zmian w `src/`. Milcząca zgoda byłaby „nie wiem"
  // przebranym za „w porządku", czyli tym, czego `AGENTS.md` zabrania wprost.
  //
  // PRZED porównaniem sekcji, i to jest wybór, nie kolejność z przypadku.
  // Diff bez ani jednego commita to WEWNĘTRZNIE SPRZECZNE wejście, więc drugi
  // sygnał policzony z tego samego zakresu — „czy `[Niewydane]` się różni" —
  // jest równie niepewny. Sprawdzone na własnej historii: przy zakresie
  // `3f942da..91fc412` (czubek `main` jako baza, `head` będący jego przodkiem)
  // diff pokazuje 1 plik w `src/`, `git log` zero commitów, a sekcje
  // CHANGELOG-a różnią się — i strażnik ogłaszał „sekcja została zmieniona",
  // czyli zielono, na podstawie różnicy, której ten PR nie zrobił. Po naprawie
  // punktu rozejścia w `check.yml` ten stan jest w CI nieosiągalny (niepusty
  // diff od merge-base'u wymaga co najmniej jednego commita), więc zapali się
  // wyłącznie wtedy, gdy zbieranie danych naprawdę się zepsuje.
  if (zakres.komunikaty.length === 0) {
    return {
      ok: false,
      powod: [
        `Zakres rusza \`src/\` (${src.length} plik(ów)), a nie widać w nim ANI JEDNEGO commita.`,
        "",
        "To nie jest zgoda przez milczenie: bez komunikatów nie da się rozstrzygnąć,",
        "czy zmiana wymaga wpisu dla użytkownika. Najczęstsza przyczyna to źle",
        "policzony zakres (zły punkt rozejścia, płytki `checkout`) — sprawdź krok",
        "„Zakres zmian” w `check.yml`.",
      ].join("\n"),
    };
  }

  if (wpisyZmienione(zakres.przed, zakres.po)) {
    return { ok: true, powod: "lista wpisów w `CHANGELOG.md` została zmieniona" };
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
      `Zmiana w \`src/\` (${src.length} plik(ów)), a lista wpisów w \`CHANGELOG.md\``,
      "nie zmieniła się ani o jedną pozycję.",
      "",
      "Commity, które tego wymagają:",
      lista,
      "",
      `Dopisz wpis dla użytkownika w sekcji ${UNRELEASED_HEADING} (bez pojęć`,
      "programistycznych — zasady w nagłówku CHANGELOG.md), albo — jeśli zmiana",
      `naprawdę go nie dotyczy — dopisz ${SKIP_MARK} do komunikatu commita.`,
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
    // Wpisy idą do podsumowania tak, jak stoją w pliku — są już Markdownem.
    // Stało tu `entry.replace(/^- /, "- ")`: wzorzec i zamiennik identyczne,
    // czyli operacja pusta udająca, że coś się z wpisem dzieje.
    ...entries,
    "",
    "Wydanie zamyka podbicie `package.json`, przeniesienie sekcji pod numer",
    "z datą i `git tag vX.Y.Z && git push origin vX.Y.Z`.",
    "Pełna procedura: `docs/WYDANIE.md`.",
  ].join("\n");
}

if (import.meta.main) {
  const tryb = process.argv[2];

  /**
   * Wejście strażnika. Brak pliku KOŃCZY BŁĘDEM, a nie pustką.
   *
   * Stało tu `.catch(() => "")` i to wyłączało strażnika po cichu: literówka
   * w ścieżce albo padnięty krok zbierający dane dawały pustą listę plików,
   * czyli „zakres nie rusza `src/`" i kod wyjścia 0. Brama świeciła na zielono,
   * choć nie sprawdziła niczego. „Nie wiem" ma tu kończyć się kodem ≠ 0 — ta
   * sama zasada, co „nieznane ma być głośne" w dekoderze.
   */
  const czytaj = async (path: string | undefined, nazwa: string): Promise<string> => {
    if (path === undefined) {
      console.error(`brak ścieżki do wejścia \`${nazwa}\` — patrz użycie niżej`);
      process.exit(2);
    }
    try {
      return await Bun.file(path).text();
    } catch (blad) {
      console.error(`nie da się przeczytać wejścia \`${nazwa}\` (${path}): ${blad}`);
      process.exit(2);
    }
  };

  if (tryb === "sygnal") {
    // Piąty argument to CHANGELOG, z którego liczą się wpisy. Domyślnie ten
    // z drzewa roboczego, ale CI podaje wersję z czubka GAŁĘZI: na PR-ze
    // checkout stoi na `refs/pull/N/merge`, więc drzewo robocze niesie już
    // scalony `main`, a licznik commitów obok liczy się od czubka gałęzi.
    // Obie liczby w jednym akapicie mają pochodzić z jednej podstawy.
    const changelogPath = process.argv[5] ?? "./CHANGELOG.md";
    const changelog = await Bun.file(changelogPath)
      .text()
      .catch(() => null);
    if (changelog === null) {
      // Sygnał nie wywraca bramy nawet wtedy, gdy nie ma czego przeczytać —
      // ale mówi to wprost, zamiast ogłosić „nic nie czeka" i wyglądać jak
      // odpowiedź. To jedyne miejsce, gdzie brak wejścia nie kończy błędem,
      // i wynika z roli sygnału, nie z wygody.
      console.log(`### Wydanie\n\nPominięty — nie da się przeczytać \`${changelogPath}\`.`);
      process.exit(0);
    }
    const tag = process.argv[3] && process.argv[3] !== "-" ? process.argv[3] : null;
    console.log(sygnal(unreleasedEntries(changelog), tag, Number(process.argv[4] ?? 0)));
    // Sygnał NIGDY nie wywraca bramy — patrz komentarz przy `sygnal`.
    process.exit(0);
  }

  if (tryb === "straznik") {
    const [, , , plikiPath, przedPath, poPath, komunikatyPath] = process.argv;
    const pliki = (await czytaj(plikiPath, "pliki")).split("\n").filter((line) => line !== "");
    // Commity rozdziela ZNAK ROZDZIELAJĄCY REKORDY (U+001E), a nie pusta linia
    // ani „---": jedno i drugie pada w treści komunikatów tego repo, więc
    // rozcięłoby jeden commit na dwa i zgubiło typ z nagłówka.
    const komunikaty = (await czytaj(komunikatyPath, "komunikaty"))
      .split("\u001e")
      .map((part) => part.trim())
      .filter((part) => part !== "");
    const wynik = ocena({
      pliki,
      przed: await czytaj(przedPath, "przed"),
      po: await czytaj(poPath, "po"),
      komunikaty,
    });
    console.log(wynik.powod);
    process.exit(wynik.ok ? 0 : 1);
  }

  console.error("użycie: bun tools/wydanie.ts sygnal <tag> <odTagu> [changelog]");
  console.error("        bun tools/wydanie.ts straznik <pliki> <przed> <po> <komunikaty>");
  process.exit(2);
}
