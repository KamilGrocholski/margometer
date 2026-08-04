import { describe, expect, test } from "bun:test";
import {
  SKIP_MARK,
  ocena,
  sygnal,
  unreleasedEntries,
  unreleasedSection,
  wpisyZmienione,
  wszystkieWpisy,
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

/**
 * CHANGELOG bez sekcji `[Niewydane]`, czyli stan PO wydaniu — z listą wpisów
 * pod numerem wersji. Kształt, na którym strażnik kłamał do 2026‑08‑04.
 */
const WYDANY = (...wpisy: string[]) =>
  [
    "# Zmiany",
    "",
    "## [0.4.0] — 2026-08-04",
    "",
    ...wpisy,
    "",
    "## [0.3.0] — 2026-08-01",
    "",
    "- **Nowość** — Instalacja jednym kliknięciem.",
    "",
  ].join("\n");

/**
 * SAMO scalenie: te same wpisy przed i po, przeniesione spod `[Niewydane]`
 * pod numer wersji. Ani jeden nie przybył, nie zniknął i nie zmienił treści.
 *
 * Przeniesiony wpis ląduje w ŚRODKU listy, za wpisem, który w sekcji z numerem
 * już stał — i to nie jest ozdobnik fixture'a, tylko jedyne miejsce, w którym
 * ta własność w ogóle daje się zmierzyć. Pierwsza wersja tego fixture'a kładła
 * przeniesiony wpis na początku sekcji: kolejność wychodziła wtedy identyczna
 * przed i po, więc mutant zdejmujący `.sort()` z porównania nie zapalał ani
 * jednego testu. Zielono i pusto.
 *
 * Kształt jest wierny wydaniu 0.4.0: sekcja z numerem istniała i miała wpisy
 * (nowości, zmiany), a trzy poprawki z `[Niewydane]` weszły za nie.
 */
const SCALENIE = {
  przed: [
    "# Zmiany",
    "",
    "## [Niewydane]",
    "",
    "- **Poprawka** — Przeniesiona pod numer wersji.",
    "",
    "## [0.4.0] — 2026-08-04",
    "",
    "- **Nowość** — Panel pokazuje numer wersji.",
    "",
    "## [0.3.0] — 2026-08-01",
    "",
    "- **Nowość** — Instalacja jednym kliknięciem.",
    "",
  ].join("\n"),
  po: WYDANY(
    "- **Nowość** — Panel pokazuje numer wersji.",
    "- **Poprawka** — Przeniesiona pod numer wersji.",
  ),
};

const plik = (name: string) => Bun.file(new URL(`../${name}`, import.meta.url).pathname).text();
const CHECK_YML = await plik(".github/workflows/check.yml");
const RELEASE_YML = await plik(".github/workflows/release.yml");
const DOCS_README = await plik("docs/README.md");
const WYDANIE = await plik("docs/WYDANIE.md");
const CHANGELOG_MD = await plik("CHANGELOG.md");
const PACKAGE_JSON = JSON.parse(await plik("package.json")) as { version: string };

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

  test("zakres OBEJMUJĄCY WYDANIE przechodzi — przypadek 3c78b73..949947a", () => {
    // Fałszywy alarm z 2026‑08‑04, odtworzony w kształcie, w jakim wyszedł.
    // Push do `main` niósł 12 commitów: dwa `fix`-y ruszające `src/` razem ze
    // swoimi wpisami ORAZ commit wydania, który scalił `[Niewydane]` pod numer
    // wersji. Strażnik patrzył wyłącznie na `[Niewydane]` — a tej sekcji nie
    // było ani przed zakresem (poprzednie scalenie), ani po nim (to wydanie) —
    // więc ogłosił „ani jednej zmiany" o zakresie, w którym przybyły trzy wpisy.
    const wynik = ocena({
      pliki: ["src/parser.ts", "src/stats.ts", "CHANGELOG.md"],
      przed: WYDANY("- **Nowość** — Panel pokazuje numer wersji."),
      po: WYDANY(
        "- **Nowość** — Panel pokazuje numer wersji.",
        "- **Poprawka** — Panel mówi wprost o linii, której nie rozumie.",
        "- **Poprawka** — Zablokowane obrażenia liczą się także poza opisem ciosu.",
        "- **Poprawka** — Ostrzeżenie zapala się też przy rodzaju oznaczonym cyfrą.",
      ),
      komunikaty: [
        "fix(parser): segment obrażeń przyjmuje wyłącznie liczby",
        "fix(stats,parser): trzy ciche ścieżki przestają milczeć",
        "build(release): 0.4.0 — jedna sekcja zamiast dwóch bloków",
      ],
    });
    expect([wynik.ok, wynik.powod]).toEqual([true, "lista wpisów w `CHANGELOG.md` została zmieniona"]);
  });

  test("SAMO scalenie nie zwalnia z wpisu — te same linie pod innym nagłówkiem", () => {
    // Druga strona tej samej naprawy i powód, dla którego porównanie wpisów
    // jest NIECZUŁE NA KOLEJNOŚĆ. Scalenie przenosi wpisy spod `[Niewydane]`
    // w środek sekcji z numerem, czyli zmienia ich kolejność, nie treść.
    // Przy porównaniu uporządkowanym samo przeniesienie wyglądałoby jak nowe
    // wpisy i KAŻDE wydanie zwalniałoby zakres z pisania czegokolwiek —
    // dokładnie odwrotnie, niż ten strażnik ma robić.
    const wynik = ocena({
      pliki: ["src/overlay.ts"],
      przed: SCALENIE.przed,
      po: SCALENIE.po,
      komunikaty: ["feat(overlay): nowa zakładka bez ani jednego wpisu"],
    });
    expect(wynik.ok).toBe(false);
    expect(wynik.powod).toContain("feat(overlay): nowa zakładka bez ani jednego wpisu");
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

  test("zero commitów w zakresie to nie zgoda, tylko „nie wiem”", () => {
    // Pusta lista komunikatów i lista samych cichych commitów dawały wcześniej
    // ten sam wynik (`glosne.length === 0` → zielono). To dwie różne rzeczy:
    // `git log base..head` wychodzi pusty, gdy `head` jest przodkiem `base`
    // albo gdy zakres policzył się źle, a `git diff` w tym samym przebiegu
    // potrafi wtedy pokazać pełno zmian w `src/`.
    const wynik = ocena({
      pliki: ["src/overlay.ts"],
      przed: PUSTA,
      po: PUSTA,
      komunikaty: [],
    });
    expect(wynik.ok).toBe(false);
    expect(wynik.powod).toContain("ANI JEDNEGO commita");
  });

  test("zmieniona sekcja NIE ratuje zakresu bez commitów — przypadek 3f942da..91fc412", () => {
    // To jest dokładnie kształt zakresu policzonego od czubka `main` zamiast od
    // punktu rozejścia: diff pokazuje plik w `src/`, `git log` zero commitów,
    // a sekcje CHANGELOG-a różnią się — bo różnicę zrobił CUDZY commit z `main`.
    // Strażnik ogłaszał wtedy „sekcja została zmieniona" i przepuszczał wszystko.
    // Skoro wejście jest wewnętrznie sprzeczne, drugi sygnał policzony z tego
    // samego zakresu też jest niepewny i nie może być podstawą zgody.
    const wynik = ocena({
      pliki: ["src/overlay.ts"],
      przed: CHANGELOG(""),
      po: CHANGELOG("- **Nowość** — Wpis z cudzego commita."),
      komunikaty: [],
    });
    expect(wynik.ok).toBe(false);
    expect(wynik.powod).toContain("ANI JEDNEGO commita");
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
    // Wpisy idą do podsumowania w całości i bez przerabiania — stała tu kiedyś
    // podmiana `- ` na `- `, czyli operacja pusta udająca przetwarzanie.
    expect(tekst).toContain("- **Zmiana** — Odznaka profesji wszędzie.");
    expect(tekst).toContain("- **Poprawka** — Ubytki życia.");
  });

  test("radzi sobie z repo bez ani jednego wydania", () => {
    expect(sygnal(["- **Nowość** — Pierwsza."], null, 3)).toContain("(brak wydań)");
  });
});

/**
 * Procedura wydania — [`docs/WYDANIE.md`](../docs/WYDANIE.md).
 *
 * Dokument opisujący kroki nie ma jak paść sam z siebie, a stać się nieprawdą
 * potrafi po cichu — i już się to stało: `TOOLING.md` niósł przez dwa wydania
 * `git tag v0.3.0` jako całą odpowiedź na „jak wydać”, gdy repo było na 0.4.0.
 * Te dwie asercje pilnują jedynych dwóch rzeczy, które da się sprawdzić
 * maszynowo: że dokument jest ZNAJDOWALNY i że wzorzec taga zgadza się z tym,
 * na co naprawdę reaguje `release.yml`.
 */
describe("procedura wydania", () => {
  test("indeks docs/ prowadzi do WYDANIE.md", () => {
    // Tabela w `docs/README.md` jest jedyną drogą do tego katalogu. Plik,
    // do którego nic nie linkuje, jest w praktyce nieobecny — a wtedy
    // procedura wraca do rozsypania po czterech miejscach.
    expect(DOCS_README).toContain("(WYDANIE.md)");
  });

  test("wzorzec taga w dokumencie zgadza się z wyzwalaczem release.yml", () => {
    const tagi = (
      Bun.YAML.parse(RELEASE_YML) as { on: { push: { tags: string[] } } }
    ).on.push.tags;
    expect(tagi).toEqual(["v*"]);
    // Prefiks z wyzwalacza, nie wpisany z palca: gdy ktoś zmieni `v*` na
    // `release/*`, komenda w dokumencie przestanie cokolwiek wydawać —
    // i to jest awaria cicha, bo `git tag` i `git push` wykonają się bez błędu.
    const prefiks = tagi[0]!.replace("*", "");
    expect(WYDANIE).toContain(`git tag ${prefiks}X.Y.Z`);
  });

  test("numer z package.json ma swoją sekcję w CHANGELOG-u", () => {
    // Krok 2 (`package.json`) zrobiony bez kroku 1 (przeniesienie sekcji) —
    // połowa incydentu z „Co się psuje cicho”. Zbudowany userscript ogłasza
    // wtedy graczowi numer, którego CHANGELOG nie umie wytłumaczyć, a wydanie
    // przerwie się dopiero na tagu, kodem 1 z `tools/changelog.ts`.
    //
    // Czego ta asercja NIE łapie — i dlatego nie wolno się na niej opierać:
    // BRAKU TAGA. Stan z 2026-08-03 (0.4.0 w obu plikach, `git tag -l` → sam
    // `v0.3.0`) przechodzi ją zielono. Na to jest sonda z `docs/WYDANIE.md`
    // i sygnał w podsumowaniu CI, nie test — repo nie zna swoich tagów.
    expect(CHANGELOG_MD).toContain(`## [${PACKAGE_JSON.version}]`);
  });

  test("sygnał w CI nie odsyła do nieistniejącego pliku", async () => {
    // `sygnal` wypisuje ścieżkę do procedury w podsumowaniu przebiegu.
    // Odsyłacz w miejscu, gdzie nikt go nie kliknie i nie sprawdzi, jest
    // dokładnie tym rodzajem zdania, które starzeje się bezgłośnie.
    const tekst = sygnal(["- **Nowość** — Coś."], "v0.4.0", 2);
    const sciezka = tekst.match(/`(docs\/[\w.-]+\.md)`/)?.[1];
    expect(sciezka).toBe("docs/WYDANIE.md");
    expect(await Bun.file(new URL(`../${sciezka}`, import.meta.url).pathname).exists()).toBe(true);
  });
});

/**
 * CLI, bo to ono jest tym, co uruchamia CI — a dwie usterki tej rundy siedziały
 * dokładnie w warstwie między plikiem a `ocena`, nietkniętej przez testy wyżej.
 */
describe("CLI strażnika", () => {
  const uruchom = async (args: string[]) => {
    const proc = Bun.spawn(["bun", "tools/wydanie.ts", ...args], {
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

  test("brakujące wejście kończy błędem, a nie zieloną bramą", async () => {
    // Tu stało `.catch(() => "")`: literówka w ścieżce dawała pustą listę
    // plików, czyli „zakres nie rusza `src/`" i kod 0. Brama przechodziła,
    // nie sprawdziwszy niczego — najgorszy możliwy tryb awarii strażnika.
    const wynik = await uruchom(["straznik", "/nie/ma/pliku.txt", "-", "-", "-"]);
    expect(wynik.code).not.toBe(0);
    expect(wynik.stderr).toContain("nie da się przeczytać");
  });

  test("sygnał bez CHANGELOG-a mówi, że nie czytał — i tak nie wywraca bramy", async () => {
    // Sygnał ma nie zapalać bramy nigdy. Ale „nic nie czeka" przy nieczytelnym
    // pliku byłoby odpowiedzią, której nikt nie sprawdził.
    const wynik = await uruchom(["sygnal", "v0.4.0", "3", "/nie/ma/changeloga.md"]);
    expect(wynik.code).toBe(0);
    expect(wynik.stdout).toContain("Pominięty");
    expect(wynik.stdout).not.toContain("Nic nie czeka");
  });
});

/**
 * Zbieranie zakresu siedzi w YAML-u, którego nie uruchamia nic poza CI —
 * i to tam znalazły się trzy najcięższe usterki tej rundy, wszystkie ciche.
 * `ocena` była na nie ślepa: dostawała dane już policzone i oceniała je
 * poprawnie. Te asercje pilnują samego liczenia, tak jak `artifacts.test.ts`
 * pilnuje `release.yml` — niezmiennik zamiast dyscypliny.
 */
describe("zakres liczony w check.yml", () => {
  const kroki = (
    Bun.YAML.parse(CHECK_YML) as {
      jobs: { wydanie: { steps: { name?: string; run?: string }[] } };
    }
  ).jobs.wydanie.steps;
  const krok = (name: string) => kroki.find((step) => step.name?.startsWith(name))?.run ?? "";

  test("porównuje od punktu rozejścia, nie od czubka gałęzi bazowej", () => {
    // Bez `merge-base` strażnik wyłącza się sam: `przed` bierze się wtedy
    // z nowszego `main`, sekcja `[Niewydane]` „różni się" zawsze, gdy ktoś
    // wydał cokolwiek w międzyczasie, i przechodzi dowolna zmiana w `src/`.
    expect(krok("Zakres zmian")).toContain("git merge-base");
  });

  test("nie liczy commita scalającego jako commita wymagającego wpisu", () => {
    // „Merge pull request #N from …" nie pasuje do żadnego cichego typu
    // i nie da się do niego dopisać `[bez-changeloga]` — treści tego commita
    // nie pisze autor. Bez `--no-merges` refaktorowy PR wywraca bramę.
    expect(krok("Zakres zmian")).toContain("git log --no-merges");
  });

  test("sygnał liczy commity od czubka gałęzi, nie od HEAD-a checkoutu", () => {
    // Na PR-ze `HEAD` to commit scalający z `refs/pull/N/merge`, więc licznik
    // obejmowałby commity `main` spoza PR-a i podawał je jako „nasze".
    const sygnal = krok("Sygnał");
    expect(sygnal).toContain('git rev-list --count "$tag".."$head"');
    expect(sygnal).not.toContain("..HEAD");
  });
});

describe("porównanie wpisów", () => {
  test("widzi zmianę treści, nie tylko przybycie linii", () => {
    expect(wpisyZmienione(CHANGELOG("- **A** — raz."), CHANGELOG("- **A** — raz i pół."))).toBe(
      true,
    );
  });

  test("nie liczy wypunktowań z komentarza nad pierwszą sekcją", () => {
    // Nagłówek `CHANGELOG.md` to komentarz HTML z listą zasad, też pisaną
    // wypunktowaniem. Liczenie od początku pliku wciągałoby je jako wpisy,
    // a wtedy poprawka literówki w SAMYCH ZASADACH zwalniałaby z wpisu.
    const zasady = ["<!--", "- Najnowsze na górze.", "- Jedna płaska lista na wersję.", "-->", ""];
    expect(wszystkieWpisy([...zasady, PUSTA].join("\n"))).toEqual(["- **Nowość** — Coś."]);
  });

  test("widzi zmianę w sekcji WYDANEJ wersji — i to jest zmiana z 2026-08-04", () => {
    // Sprostowanie do własnego opisu: poprzednia wersja tego testu twierdziła,
    // że „poprawka w sekcji WYDANEJ wersji nie jest wpisem o bieżącej zmianie",
    // i pilnowała, żeby strażnik jej NIE widział. Przesłanka była fałszywa —
    // po wydaniu wpisy o bieżących zmianach mieszkają dokładnie tam, bo krok 1
    // procedury przenosi je pod numer. Na tym poległ push `3c78b73..949947a`.
    //
    // Cena jest realna i przyjęta świadomie: literówka poprawiona w wydaniu
    // sprzed roku również zwolni zakres z wpisu. W historii tego repo taki
    // kształt nie wystąpił ani razu, a wariant węższy dokładałby pojęcie
    // „najnowsza sekcja", którego reszta modułu nie zna.
    const przed = CHANGELOG("- **A** — raz.");
    expect(wpisyZmienione(przed, przed.replace("Instalacja jednym", "Instalacja dwoma"))).toBe(true);
  });

  test("przeniesienie wpisu pod inny nagłówek NIE jest zmianą", () => {
    // Własność, na której stoi cała naprawa, w izolacji od `ocena`.
    // Asercja na KOLEJNOŚCI stoi tu celowo i jako pierwsza: bez niej test
    // przechodziłby także z porównaniem czułym na kolejność, czyli mierzyłby
    // co innego, niż mówi jego nazwa.
    expect(wszystkieWpisy(SCALENIE.przed)).not.toEqual(wszystkieWpisy(SCALENIE.po));
    expect(wszystkieWpisy(SCALENIE.przed).sort()).toEqual(wszystkieWpisy(SCALENIE.po).sort());
    expect(wpisyZmienione(SCALENIE.przed, SCALENIE.po)).toBe(false);
  });
});
