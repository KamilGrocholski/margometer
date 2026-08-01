import { describe, expect, test } from "bun:test";
import { parse } from "../src/parser.ts";
import { aggregate } from "../src/stats.ts";
import { Overlay } from "../src/overlay.ts";
import { extractText } from "../src/source.ts";
import {
  ColorAssignment,
  PROFESSION_COLORS,
  SERIES_COLORS,
  TYPE_COLORS,
  typeColor,
  OTHER_COLOR,
} from "../src/palette.ts";
import { dotLabel, typeDisplay, typeFamily } from "../src/types.ts";
import { FIXTURES, metricButton, readFixture } from "./helpers.ts";

describe("przypisanie kolorów", () => {
  test("kolor idzie za postacią, nie za jej pozycją w rankingu", () => {
    const colors = new ColorAssignment();
    colors.seed(["A", "B", "C"]);

    expect(colors.colorFor("B")).toBe(SERIES_COLORS[1]!);
    // Po przesortowaniu B nadal ma swój kolor.
    colors.seed(["C", "B", "A"]);
    expect(colors.colorFor("B")).toBe(SERIES_COLORS[1]!);
    expect(colors.colorFor("A")).toBe(SERIES_COLORS[0]!);
  });

  test("po wyczerpaniu palety nie generuje nowych barw", () => {
    const colors = new ColorAssignment();
    colors.seed(Array.from({ length: 12 }, (_, i) => `postać ${i}`));

    const used = new Set(
      Array.from({ length: 12 }, (_, i) => colors.colorFor(`postać ${i}`)),
    );
    expect(used.size).toBe(SERIES_COLORS.length + 1); // + kolor zbiorczy
  });

  test("pasek postaci niesie profesję", async () => {
    // Wzorzec SKADA: barwa = klasa. Ta walka ma trzy różne profesje w składzie.
    const stats = aggregate(
      parse(await readFixture("new-engine/2026-07-22_lowca-tropiciel-vs-regulus-grupowa")),
    );
    const overlay = new Overlay();
    overlay.render(stats, stats);

    const rows = [...overlay.shadow.querySelectorAll<HTMLElement>(".rows .row")].map((row) => ({
      actor: row.dataset.actor!,
      color: row.querySelector<HTMLElement>(".bar")!.style.background,
    }));

    const asStyle = (color: string) => {
      const probe = document.createElement("div");
      probe.style.background = color;
      return probe.style.background;
    };
    const of = (name: string) => rows.find((row) => row.actor === name)!;

    expect(of("Łowcosław Kazrek").color).toBe(asStyle(PROFESSION_COLORS["h"]!));
    expect(of("wf foverek psk").color).toBe(asStyle(PROFESSION_COLORS["t"]!));
    expect(of("Regulus Mętnooki").color).toBe(asStyle(PROFESSION_COLORS["w"]!));
  });

  test("wiersz to ranking, nie tabela: numer, nazwa i jedna liczba z nawiasem", async () => {
    const stats = aggregate(
      parse(await readFixture("new-engine/2026-07-22_lowca-tropiciel-vs-regulus-grupowa")),
    );
    const overlay = new Overlay();
    overlay.render(stats, stats);

    // Trzy komórki i ani jednej więcej. Poziom i profesja NIE stoją w wierszu —
    // przy czwartej kolumnie pasek zaczyna się czytać jak wiersz tabeli, a bez
    // nagłówka kolumn i tak nie byłoby wiadomo, co która znaczy. Profesję
    // niesie barwa paska, pełną nazwę i resztę liczb — dymek.
    for (const row of overlay.shadow.querySelectorAll<HTMLElement>(".rows .row[data-actor]")) {
      const cells = [...row.querySelectorAll(".row-text > *")].map((cell) => cell.className);
      expect(cells).toEqual(["rank", "label", "value"]);
    }

    const first = overlay.shadow.querySelector(".rows .row[data-actor]")!;
    expect(first.querySelector(".rank")?.textContent).toBe("1.");
    // Nawias siedzi WEWNĄTRZ liczby wiodącej, nie obok niej jako kolejna
    // kolumna — to on mówi, że procent i tempo należą do TEJ liczby.
    expect(first.querySelector(".value")?.contains(first.querySelector(".share"))).toBe(true);
    expect(first.querySelector(".share")?.textContent).toMatch(/^\(\d+% · .+\)$/);

    // Numery idą po kolei i nie gubią się przy zmianie metryki.
    const ranks = () =>
      [...overlay.shadow.querySelectorAll(".rows .row[data-actor] .rank")].map(
        (cell) => cell.textContent,
      );
    expect(ranks()).toEqual(["1.", "2.", "3."]);
    metricButton(overlay, "Otrzymane").click();
    expect(ranks()).toEqual(["1.", "2.", "3."]);
  });

  test("dwie postacie tej samej profesji mają ten sam kolor — i to jest zamierzone", async () => {
    // Trzej magowie. W SKADZIE trzech magów też ma jedną barwę: kolor odpowiada
    // na „kto tu jest czym", a od odróżniania postaci są nazwa i numer.
    document.body.innerHTML = await Bun.file(
      `${FIXTURES}new-engine/2026-07-18_mag-dom-fuzja/log.html`,
    ).text();
    const stats = aggregate(parse(extractText(document.body)));
    const overlay = new Overlay();
    overlay.render(stats, stats);

    const rows = [...overlay.shadow.querySelectorAll<HTMLElement>(".rows .row")];
    const colors = new Set(rows.map((row) => row.querySelector<HTMLElement>(".bar")!.style.background));
    expect(rows.length).toBe(3);
    expect(colors.size).toBe(1);
    // Nazwy nadal rozróżniają wiersze — tożsamości kolor nigdy nie niósł.
    expect(new Set(rows.map((row) => row.dataset.actor)).size).toBe(3);
  });

  test("paski umiejętności niosą rodzaj obrażeń", async () => {
    document.body.innerHTML = await Bun.file(
      `${FIXTURES}new-engine/2026-07-18_mag-dom-fuzja/log.html`,
    ).text();
    const stats = aggregate(parse(extractText(document.body)));
    const overlay = new Overlay();
    overlay.render(stats, stats);

    const asStyle = (color: string) => {
      const probe = document.createElement("div");
      probe.style.background = color;
      return probe.style.background;
    };
    const click = (key: string) =>
      [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
        .find((row) => row.dataset.actor === key || row.dataset.source === key)!
        .click();

    // Pierwszy szczebel wymienia CELE, więc barwa idzie tam za profesją.
    click("wf mushita psk");
    const target = [...overlay.shadow.querySelectorAll<HTMLElement>(".row[data-source]")].find(
      (row) => row.dataset.source === "Furu Mulu",
    )!;
    expect(target.querySelector<HTMLElement>(".bar")!.style.background).toBe(
      asStyle(PROFESSION_COLORS["m"]!),
    );

    // Dopiero po wejściu w cel etykietą jest akcja — i wtedy barwę niesie żywioł.
    click("Furu Mulu");
    const byLabel = new Map(
      [...overlay.shadow.querySelectorAll<HTMLElement>(".row[data-source]")].map((row) => [
        row.dataset.source!,
        row.querySelector<HTMLElement>(".bar")!.style.background,
      ]),
    );
    // Obie umiejętności niosą zimno I błyskawicę w jednym ciosie, a błyskawica
    // dominuje w każdej (259/50 i 384/153) — więc obie dostają jej barwę.
    // Pasek ma jeden kolor, więc musi wybrać; podział widać niżej, w sekcji
    // TYP OBRAŻEŃ. To realna granica tego pomysłu, nie usterka.
    expect(byLabel.get("Lodowy pocisk")).toBe(asStyle(TYPE_COLORS["błyskawica"]!));
    expect(byLabel.get("Porażenie")).toBe(asStyle(TYPE_COLORS["błyskawica"]!));
  });

  test("zwykły cios i trucizna dostają w rozbiciu różne barwy", async () => {
    // Przypadek, w którym kolor typu zarabia na siebie: dziś oba wiersze
    // wyglądają identycznie, choć to zupełnie różne źródła obrażeń.
    document.body.innerHTML = await Bun.file(
      `${FIXTURES}new-engine/2026-07-18_lowca-dom-trucizna/log.html`,
    ).text();
    const stats = aggregate(parse(extractText(document.body)));
    const overlay = new Overlay();
    overlay.render(stats, stats);

    const asStyle = (color: string) => {
      const probe = document.createElement("div");
      probe.style.background = color;
      return probe.style.background;
    };
    const click = (key: string) =>
      [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
        .find((row) => row.dataset.actor === key || row.dataset.source === key)!
        .click();

    click("Łowcożyr Kazrek");
    click("Locha");

    const byLabel = new Map(
      [...overlay.shadow.querySelectorAll<HTMLElement>(".row[data-source]")].map((row) => [
        row.dataset.source!,
        row.querySelector<HTMLElement>(".bar")!.style.background,
      ]),
    );
    expect(byLabel.get("Zwykły atak")).toBe(asStyle(TYPE_COLORS["broń"]!));
    expect(byLabel.get("Trucizna")).toBe(asStyle(TYPE_COLORS["trucizna"]!));
  });

  test("trucizna odróżnia się barwą od zwykłego ciosu", async () => {
    // Tu kolor robi najwięcej roboty: dziś oba wiersze wyglądają identycznie.
    document.body.innerHTML = await Bun.file(
      `${FIXTURES}new-engine/2026-07-18_lowca-dom-trucizna/log.html`,
    ).text();
    const stats = aggregate(parse(extractText(document.body)));
    const lowca = stats.actors.find((a) => a.name === "Łowcożyr Kazrek")!;

    const types = new Map(lowca.typeByLabel.map((t) => [t.label, t.type]));
    expect(types.get("Zwykły atak")).toBe("broń");
    expect(types.get("Trucizna")).toBe("trucizna");
  });

  test("kolor nie zależy od liczby walk w sesji", () => {
    // Dawniej barwa szła ze wspólnej puli ośmiu slotów, więc od trzeciej walki
    // wiersze robiły się szare. Barwa z atrybutu nie ma czego wyczerpać.
    const overlay = new Overlay();
    const line = (enemy: string, code: string) =>
      aggregate(parse(`Rozpoczęła się walka pomiędzy Gracz (1m) a ${enemy} (1${code})`));

    const seen: string[] = [];
    for (const [enemy, code] of [["A", "w"], ["B", "p"], ["C", "t"], ["D", "h"], ["E", "b"]]) {
      const stats = line(enemy!, code!);
      overlay.render(stats, stats);
      const row = [...overlay.shadow.querySelectorAll<HTMLElement>(".rows .row")].find(
        (candidate) => candidate.dataset.actor === enemy,
      )!;
      seen.push(row.querySelector<HTMLElement>(".bar")!.style.background);
    }

    // Pięć profesji, pięć różnych barw — także w piątej walce z rzędu.
    expect(new Set(seen).size).toBe(5);
  });
});
describe("barwa rodzajów spoza osi żywiołów", () => {
  /**
   * `dmgo` i `dmgd` to ta sama oś — broń, nie żywioł — więc dla patrzącego mają
   * być jedną rodziną. Bez tego drugie ostrze tancerza ostrzy dostawałoby kolor
   * „inne" obok własnych obrażeń fizycznych z tego samego ciosu.
   */
  test("broń pomocnicza barwi się jak reszta obrażeń z broni", () => {
    expect(typeFamily("broń pomocnicza")).toBe("broń");
    expect(typeColor("broń pomocnicza")).toBe(typeColor("fizyczne"));
    expect(typeColor("broń pomocnicza")).toBe(typeColor("dystansowe"));
  });

  /**
   * „globalne" to ZASIĘG, podany przez grę ZAMIAST żywiołu — więc żywioł tych
   * obrażeń jest nieznany, a nie inny. Barwa rodziny byłaby tu wymyśleniem
   * rodzaju obrażeń, którego log nie podaje.
   */
  test("globalne nie dostaje rodziny ani barwy żywiołu", () => {
    expect(typeFamily("globalne")).toBeNull();
    expect(typeColor("globalne")).not.toBe(TYPE_COLORS["ogień"]);
    expect(typeColor("globalne")).not.toBe(TYPE_COLORS["broń"]);
  });
});

/**
 * Nazwy z dwóch źródeł, jedna rodzina.
 *
 * Log nazywa tę samą rzecz dwojako: żywioł z klasy CSS mówi „ogień", a tykający
 * efekt „od ognia". Panel wymienia RODZINY, więc obie drogi muszą kończyć się
 * w tym samym miejscu — inaczej ta sama rzecz stoi w przekroju dwa razy, pod
 * dwiema gramatykami i (dawniej) w tej samej barwie, bez żadnego wyjaśnienia.
 */
describe("jedna nazwa na rodzinę", () => {
  test.each([
    ["od trucizny", "trucizna"],
    ["od ognia", "ogień"],
    ["od błyskawic", "błyskawica"],
    ["od głębokiej rany", "rana"],
    ["po zranieniu", "rana"],
  ])("„%s” i jego wygładzona nazwa mają tę samą rodzinę", (raw, family) => {
    const [via, ...rest] = raw.split(" ");
    const label = dotLabel(via!, rest.join(" "));
    expect(typeFamily(raw)).toBe(family);
    expect(typeFamily(label)).toBe(family);
    expect(typeDisplay(label)).toBe(typeDisplay(raw));
    expect(typeColor(label)).toBe(typeColor(raw));
  });

  test("tykający ogień i ogień z klasy CSS to jeden wiersz", () => {
    expect(typeDisplay(dotLabel("od", "ognia"))).toBe(typeDisplay("ogień"));
  });

  /**
   * Rodzaj bez rodziny nie dostaje wymyślonej nazwy: wiersz mówi wprost, że
   * rodzaju nie znamy, a w nawiasie zostaje to, co log naprawdę podał.
   */
  test("nierozpoznane mówi o sobie, że jest nierozpoznane", () => {
    expect(typeDisplay("globalne")).toBe("Nieznany (obszarowe)");
    expect(typeDisplay("dmgz")).toBe("Nieznany (dmgz)");
    expect(typeDisplay("bez żywiołu")).toBe("Nieznany");
    for (const label of ["globalne", "dmgz", "bez żywiołu"]) {
      expect(typeColor(typeDisplay(label))).toBe(OTHER_COLOR);
    }
  });

  /** Rodzaj spoza mapy zostaje DOSŁOWNIE — nowy format ma być widać. */
  test("nieznany rodzaj tykający zostaje w zapisie z logu", () => {
    expect(dotLabel("od", "czegoś nowego")).toBe("od czegoś nowego");
  });
});

