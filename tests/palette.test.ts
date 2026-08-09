import { describe, expect, test } from "bun:test";
import { aggregate } from "../src/stats.ts";
import { Overlay } from "../src/overlay.ts";
import {
  PROFESSION_COLORS,
  SERIES_COLORS,
  TYPE_COLORS,
  typeColor,
  professionColor,
  professionInk,
  OTHER_COLOR,
} from "../src/palette.ts";
import { dotLabel, typeDisplay, typeFamily } from "../src/types.ts";
import { metricButton, statsZWalki } from "./helpers.ts";
import { syntheticFight } from "../tools/synthetic-log.ts";
import { cios, otwarcie, trafienie, tykniecie, umiejetnosc } from "./zdarzenia.ts";

/** Kanał sRGB → luminancja liniowa, wzór WCAG 2.1. */
const channel = (value: number) => {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const rgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];
const luminance = ([r, g, b]: [number, number, number]) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const contrast = (a: string, b: string) => {
  const [light, dark] = [luminance(rgb(a)), luminance(rgb(b))].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
};

describe("przypisanie kolorów", () => {
  /**
   * ⚠️ **Nazwy postaci przestały pochodzić z gry — 2026‑08‑04.** Walki brały się
   * z 25 prawdziwych walk; dziś produkuje je `tools/synthetic-log.ts`
   * i to z niego pochodzą nicki użyte niżej. Testy dalej sprawdzają REGUŁĘ
   * (barwa = profesja, odznaka = litera), ale nie mówią już nic o tym, jakie
   * składy gra faktycznie wystawia.
   */

  test("pasek postaci niesie profesję", () => {
    // Wzorzec SKADA: barwa = klasa. Ta walka ma sześć różnych profesji w składzie.
    const stats = statsZWalki(syntheticFight(12));
    const overlay = new Overlay();
    overlay.render(stats);

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

    expect(of("Łowcosław z Krzywego Rogu").color).toBe(asStyle(PROFESSION_COLORS["h"]!));
    expect(of("Tropiciel Cichy").color).toBe(asStyle(PROFESSION_COLORS["t"]!));
    expect(of("Odyniec Wielki").color).toBe(asStyle(PROFESSION_COLORS["w"]!));
  });

  test("każda postać ze znaną profesją dostaje odznakę z jej literą", async () => {
    // AUDYT-14: cały argument o rozróżnialności w `palette.ts` opiera się na
    // odznace („Rozróżnialność zapewnia odznaka z literą profesji, nie barwa"),
    // a odznaki nie było w kodzie WCALE. Sześciu barw nie da się na tym tle
    // zrobić rozłącznymi, więc bez litery daltonista nie odróżni dwóch postaci.
    const stats = statsZWalki(syntheticFight(12));
    const overlay = new Overlay();
    overlay.render(stats);

    let checked = 0;
    for (const row of overlay.shadow.querySelectorAll<HTMLElement>(".rows .row[data-actor]")) {
      const actor = stats.actors.find((one) => one.name === row.dataset.actor)!;
      const label = row.querySelector<HTMLElement>(".label")!;
      if (actor.professionCode === null) {
        expect(label.dataset.prof).toBeUndefined();
        continue;
      }
      expect(label.dataset.prof).toBe(actor.professionCode.toUpperCase());
      // Nazwa ma zostać DOKŁADNIE nazwą: odznaka jest warstwą nad nią
      // (`::before`), a nie węzłem w treści — inaczej każde pytanie o nazwę
      // zaczyna zwracać „HŁowca Wichrów". Porównanie pełne, nie „nie zawiera
      // litery": nazwy same z siebie niosą te litery („Hildur Muza Śmierci").
      const star = stats.ambiguousNames.includes(actor.name) ? " *" : "";
      expect(label.textContent).toBe(`${actor.name}${star}`);
      checked += 1;
    }
    // Ten fixture ma dziewięciu graczy i bossa, wszyscy z profesją z nagłówka.
    expect(checked).toBeGreaterThan(5);
  });

  /**
   * Odznaka na KAŻDYM szczeblu, który wymienia postacie.
   *
   * Do 2026‑08‑02 miał ją wyłącznie ranking składu, a rozbicie `KOMU` /
   * `OD KOGO` — nie, mimo że wymienia te same postacie i maluje pasek tą samą
   * barwą profesji. Gwarancja z `palette.ts` („rozróżnialność zapewnia odznaka
   * z literą profesji, nie barwa") obowiązywała więc na jednym szczeblu z trzech,
   * a to właśnie w rozbiciu barwy powtarzają się najgęściej — dziesięciu graczy
   * potrafi mieć trzy profesje.
   */
  describe("odznaka na każdym szczeblu, który wymienia postacie", () => {
    const panelOf = async () => {
      const stats = statsZWalki(syntheticFight(12));
      const overlay = new Overlay();
      overlay.render(stats);
      return { overlay, stats };
    };
    const rows = (overlay: Overlay, selector: string) => [
      ...overlay.shadow.querySelectorAll<HTMLElement>(selector),
    ];

    test("wiersze rozbicia OD KOGO niosą literę profesji swojej postaci", async () => {
      const { overlay, stats } = await panelOf();
      metricButton(overlay, "Otrzymane").click();
      // Wejście w bossa: `OD KOGO` wymienia wtedy bijących w niego graczy.
      rows(overlay, ".rows .row[data-actor]")[0]!.click();

      let checked = 0;
      for (const row of rows(overlay, ".rows .row[data-source]")) {
        const label = row.querySelector<HTMLElement>(".label")!;
        const actor = stats.actors.find((one) => one.name === row.dataset.source);
        // Pozycje spoza składu (np. zbiorcze „Bez sprawcy") postacią nie są.
        if (!actor?.professionCode) {
          expect([row.dataset.source, label.dataset.prof]).toEqual([
            row.dataset.source,
            undefined,
          ]);
          continue;
        }
        expect(label.dataset.prof).toBe(actor.professionCode.toUpperCase());
        // Ta sama zasada co w rankingu: odznakę rysuje `::before`, więc nazwa
        // zostaje nazwą dla kodu, testów i schowka.
        expect(label.textContent).toBe(row.dataset.source!);
        checked += 1;
      }
      expect(checked).toBeGreaterThan(1);
    });

    test("barwa paska i litera pochodzą z tej samej profesji", async () => {
      // Osobny predykat na odznakę pozwoliłby dojść do wiersza z barwą jednej
      // profesji i literą drugiej. Jeden predykat nie ma jak rozjechać się sam
      // ze sobą — ten test pilnuje, że nadal jest jeden.
      const { overlay } = await panelOf();
      metricButton(overlay, "Otrzymane").click();
      rows(overlay, ".rows .row[data-actor]")[0]!.click();

      const asStyle = (color: string) => {
        const probe = document.createElement("div");
        probe.style.background = color;
        return probe.style.background;
      };
      for (const row of rows(overlay, ".rows .row[data-source]")) {
        const code = row.querySelector<HTMLElement>(".label")!.dataset.prof;
        if (code === undefined) continue;
        const bar = row.querySelector<HTMLElement>(".bar")!.style.background;
        expect([row.dataset.source, bar]).toEqual([
          row.dataset.source,
          asStyle(professionColor(code.toLowerCase())),
        ]);
      }
    });

    test("wiersze umiejętności i TYP OBRAŻEŃ odznaki NIE mają", async () => {
      // Odznaka odpowiada na „kto tu jest czym". Etykieta, która nie jest
      // postacią, nie ma na to pytania odpowiedzi — a litera przy nazwie
      // umiejętności sugerowałaby, że ma.
      const { overlay } = await panelOf();
      rows(overlay, ".rows .row[data-actor]")[0]!.click();

      const nieOsoby = rows(overlay, '.rows .row[data-list="abilities"], .rows .row[data-list="types"]');
      expect(nieOsoby.length).toBeGreaterThan(1);
      for (const row of nieOsoby) {
        const label = row.querySelector<HTMLElement>(".label")!;
        expect([row.dataset.source, label.dataset.prof]).toEqual([row.dataset.source, undefined]);
      }
    });

    /**
     * Nazwa postaci pada w panelu nie tylko w wierszach list.
     *
     * Do 2026‑08‑03 odznakę miały wyłącznie wiersze, a te same postacie nazwane
     * w okruszku powrotu i w tytułach dymków stały gołe — czyli gwarancja
     * z `palette.ts` („rozróżnialność zapewnia odznaka z literą, nie barwa”)
     * kończyła się tam, gdzie kończyła się lista.
     */
    const prof = (overlay: Overlay, selector: string) =>
      overlay.shadow.querySelector<HTMLElement>(selector)?.dataset.prof;

    test("okruszek powrotu niesie literę profesji postaci, w której stoimy", async () => {
      const { overlay, stats } = await panelOf();
      const first = rows(overlay, ".rows .row[data-actor]")[0]!;
      const name = first.dataset.actor!;
      first.click();

      const code = stats.actors.find((one) => one.name === name)!.professionCode!;
      expect([name, prof(overlay, ".crumb-name")]).toEqual([name, code.toUpperCase()]);
      // Odznakę rysuje `::before`, więc nazwa zostaje nazwą dla kodu i schowka.
      expect(overlay.shadow.querySelector(".crumb-name")?.textContent).toBe(name);
    });

    test("tytuł dymka nad postacią ma literę, nad umiejętnością nie", async () => {
      const { overlay, stats } = await panelOf();
      const hover = (row: HTMLElement) =>
        row.dispatchEvent(new Event("pointerover", { bubbles: true }));

      // Dymek nad wierszem rankingu — postać wprost z `ActorStats`.
      const first = rows(overlay, ".rows .row[data-actor]")[0]!;
      hover(first);
      const boss = stats.actors.find((one) => one.name === first.dataset.actor)!;
      expect(prof(overlay, ".tip-title")).toBe(boss.professionCode!.toUpperCase());

      // Dymek nad wierszem rozbicia: postać dostaje literę, umiejętność nie —
      // i rozstrzyga to `professionOf`, a nie to, z której sekcji jest wiersz.
      first.click();
      const breakdown = rows(overlay, ".rows .row[data-source]");
      const character = breakdown.find((row) =>
        stats.actors.some((one) => one.name === row.dataset.source),
      )!;
      const ability = breakdown.find((row) => row.dataset.list === "abilities")!;

      hover(character);
      const actor = stats.actors.find((one) => one.name === character.dataset.source)!;
      expect([character.dataset.source, prof(overlay, ".tip-title")]).toEqual([
        character.dataset.source,
        actor.professionCode!.toUpperCase(),
      ]);

      hover(ability);
      expect([ability.dataset.source, prof(overlay, ".tip-title")]).toEqual([
        ability.dataset.source,
        undefined,
      ]);
    });

    test("nagłówek drugiego szczebla odznaki NIE dubluje", async () => {
      // `CZYM — CYGAŃSKI BIDOK` powtarza nazwę, którą okruszek nazywa dwie
      // linijki wyżej — i to on ją znakuje. Druga odznaka na to samo nic nie
      // dokłada, a przy `KOMU — <UMIEJĘTNOŚĆ>` byłaby wręcz nieprawdą.
      const { overlay, stats } = await panelOf();
      rows(overlay, ".rows .row[data-actor]")[0]!.click();
      const character = rows(overlay, ".rows .row[data-source]").find((row) =>
        stats.actors.some((one) => one.name === row.dataset.source),
      )!;
      character.click();

      const who = overlay.shadow.querySelector<HTMLElement>(".side-head .who")!;
      expect(who.textContent).toContain("CZYM — ");
      expect(who.dataset.prof).toBeUndefined();
      // …ale postać, w której stoimy, jest oznaczona — w okruszku.
      expect(prof(overlay, ".crumb-name")).toBeDefined();
    });
  });

  test("litera na odznace przechodzi AA na każdej barwie profesji", () => {
    // Jednej barwy litery dla wszystkich profesji NIE MA: przy zieleni łowcy
    // nawet czysta czerń daje 4,25, a biel przy pozostałych schodzi do 3,1.
    // Stąd `professionInk` wybiera per barwa — i to jest próg, nie gust.
    for (const code of [...Object.keys(PROFESSION_COLORS), null, "zzz"]) {
      const ratio = contrast(professionInk(code), professionColor(code));
      expect([code, ratio >= 4.5]).toEqual([code, true]);
    }
  });

  test("wiersz to ranking, nie tabela: numer, nazwa i jedna liczba z nawiasem", async () => {
    const stats = statsZWalki(syntheticFight(12));
    const overlay = new Overlay();
    overlay.render(stats);

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
    // Numeracja idzie po kolei, ile by wierszy nie było.
    const kolejne = (n: number) => Array.from({ length: n }, (_, i) => `${i + 1}.`);
    expect(ranks()).toEqual(kolejne(ranks().length));
    metricButton(overlay, "Otrzymane").click();
    expect(ranks()).toEqual(kolejne(ranks().length));
  });

  test("dwie postacie tej samej profesji mają ten sam kolor — i to jest zamierzone", async () => {
    // Trzej magowie. W SKADZIE trzech magów też ma jedną barwę: kolor odpowiada
    // na „kto tu jest czym", a od odróżniania postaci są nazwa i numer.
    const stats = aggregate([
      cios("Mag A", "Mag C", [trafienie(300)], { targetHpPct: 70 }),
      cios("Mag B", "Mag C", [trafienie(200)], { targetHpPct: 40 }),
    ], otwarcie(["Mag A 1m", "Mag B 1m"], ["Mag C 1m"]));
    const overlay = new Overlay();
    overlay.render(stats);

    const rows = [...overlay.shadow.querySelectorAll<HTMLElement>(".rows .row")];
    const colors = new Set(rows.map((row) => row.querySelector<HTMLElement>(".bar")!.style.background));
    expect(rows.length).toBe(3);
    expect(colors.size).toBe(1);
    // Nazwy nadal rozróżniają wiersze — tożsamości kolor nigdy nie niósł.
    expect(new Set(rows.map((row) => row.dataset.actor)).size).toBe(3);
  });

  test("paski umiejętności niosą rodzaj obrażeń", () => {
    // Barwa paska umiejętności idzie za DOMINUJĄCYM rodzajem jej obrażeń.
    // Pasek ma jeden kolor, więc przy umiejętności mieszanej musi wybrać —
    // podział widać dopiero niżej, w sekcji TYP OBRAŻEŃ. To realna granica
    // tego pomysłu, nie usterka.
    //
    // ⚠️ Stała za tym walka `2026-07-18_mag-dom-fuzja` (zrzut DOM, żywioł
    // z klasy CSS), gdzie „Lodowy pocisk" miał 259 zimna do 50 błyskawicy,
    // a „Porażenie" 384 do 153. Materiał zszedł z drzewa 2026‑08‑04; wejście
    // jest dziś pisane ręcznie i dobiera te same proporcje.
    const stats = aggregate([
      umiejetnosc("Mag", "Lodowy pocisk"),
      cios("Mag", "Cel", [trafienie(259, 259, { element: "zimno" })], {
        targetHpPct: 80,
        ability: "Lodowy pocisk",
      }),
      cios("Mag", "Cel", [trafienie(50, 50, { element: "błyskawica" })], {
        targetHpPct: 70,
        ability: "Lodowy pocisk",
      }),
    ], otwarcie(["Mag 1m"], ["Cel 1w"]));
    const overlay = new Overlay();
    overlay.render(stats);

    const asStyle = (color: string) => {
      const probe = document.createElement("div");
      probe.style.background = color;
      return probe.style.background;
    };
    // Wejście w postać, potem w cel — dopiero tam stoją umiejętności.
    const click = (key: string) =>
      [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
        .find((row) => row.dataset.actor === key || row.dataset.source === key)!
        .click();
    click("Mag");
    click("Cel");

    const byLabel = new Map(
      [...overlay.shadow.querySelectorAll<HTMLElement>(".row[data-source]")].map((row) => [
        row.dataset.source!,
        row.querySelector<HTMLElement>(".bar")!.style.background,
      ]),
    );
    expect(byLabel.get("Lodowy pocisk")).toBe(asStyle(TYPE_COLORS["zimno"]!));
  });

  test("zwykły cios i trucizna dostają w rozbiciu różne barwy", async () => {
    // Przypadek, w którym kolor typu zarabia na siebie: dziś oba wiersze
    // wyglądają identycznie, choć to zupełnie różne źródła obrażeń.
    const stats = aggregate([
      cios("Łowca", "Locha", [trafienie(400, 393, { element: "dystansowe" })], {
        targetHpPct: 60,
      }),
      cios("Łowca", "Locha", [trafienie(400, 393, { element: "dystansowe" })], {
        targetHpPct: 20,
      }),
      tykniecie("Locha", 10, 140, "trucizny"),
    ], otwarcie(["Łowca 1h"], ["Locha 1w"]));
    const overlay = new Overlay();
    overlay.render(stats);

    const asStyle = (color: string) => {
      const probe = document.createElement("div");
      probe.style.background = color;
      return probe.style.background;
    };
    const click = (key: string) =>
      [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
        .find((row) => row.dataset.actor === key || row.dataset.source === key)!
        .click();

    click("Łowca");
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
    const stats = aggregate([
      cios("Łowca", "Locha", [trafienie(400, 393, { element: "dystansowe" })], {
        targetHpPct: 60,
      }),
      cios("Łowca", "Locha", [trafienie(400, 393, { element: "dystansowe" })], {
        targetHpPct: 20,
      }),
      tykniecie("Locha", 10, 140, "trucizny"),
    ], otwarcie(["Łowca 1h"], ["Locha 1w"]));
    const lowca = stats.actors.find((a) => a.name === "Łowca")!;

    const types = new Map(lowca.typeByLabel.map((t) => [t.label, t.type]));
    expect(types.get("Zwykły atak")).toBe("broń");
    expect(types.get("Trucizna")).toBe("trucizna");
  });

  test("kolor nie zależy od liczby walk w sesji", () => {
    // Dawniej barwa szła ze wspólnej puli ośmiu slotów, więc od trzeciej walki
    // wiersze robiły się szare. Barwa z atrybutu nie ma czego wyczerpać.
    const overlay = new Overlay();
    const line = (enemy: string, code: string) =>
      aggregate([], otwarcie(["Gracz 1m"], [`${enemy} 1${code}`]));

    const seen: string[] = [];
    for (const [enemy, code] of [["A", "w"], ["B", "p"], ["C", "t"], ["D", "h"], ["E", "b"]]) {
      const stats = line(enemy!, code!);
      overlay.render(stats);
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

/**
 * A14 — tekst wiersza leży NA kolorowym pasku, więc to pasek decyduje o tym,
 * czy da się go przeczytać. Przy pełnym nasyceniu żadna barwa palety nie
 * przechodziła progu AA dla tekstu 12 px (najgorzej żółty — 3,50:1).
 *
 * Test liczy kontrast z tego, co NAPRAWDĘ ląduje w arkuszu panelu: krycie
 * `.bar` czyta z arkusza, a nie ze stałej w teście. Dzięki temu podniesienie
 * krycia „bo ładniej" nie przejdzie po cichu.
 */
describe("kontrast tekstu na pasku (A14)", () => {
  /** Barwa paska złożona z tłem wiersza przy danym kryciu. */
  const over = (color: string, background: string, opacity: number): string => {
    const [top, bottom] = [rgb(color), rgb(background)];
    const mixed = top.map((value, i) => Math.round(value * opacity + bottom[i]! * (1 - opacity)));
    return `#${mixed.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  };

  /**
   * Wartości bierzemy z arkusza panelu, nie z drugiej kopii tych samych liczb.
   * Reguła musi zaczynać się od początku linii, żeby `.bar` nie złapało się na
   * `.row[data-unattributed] .bar`, a `.row` na `.row-text`.
   *
   * `var(--x)` rozwijamy, zamiast wpisywać wartość tutaj. Od 2026‑08‑02 tło toru
   * stoi w tokenie (`--track`), bo padało w arkuszu trzy razy z palca — a cała
   * wartość tego testu polega na tym, że liczby NIE MA w teście. Przepisanie jej
   * tu zamieniłoby strażnika w drugą kopię tego, czego pilnuje.
   */
  const styleOf = (selector: string, property: string): string => {
    const css = new Overlay().shadow.querySelector("style")!.textContent ?? "";
    const rule = new RegExp(`^\\${selector} \\{[^}]*${property}: ([^;}]+)`, "m").exec(css);
    expect(rule).not.toBeNull();
    const value = rule![1]!.trim();

    const token = /^var\((--[a-z-]+)\)$/.exec(value);
    if (token === null) return value;
    const declared = new RegExp(`^\\s*\\${token[1]}: ([^;}]+)`, "m").exec(css);
    expect([token[1], declared]).not.toEqual([token[1], null]);
    return declared![1]!.trim();
  };

  test("arkusz nadal opisuje pasek tak, jak zakłada ten test", () => {
    expect(styleOf(".rows .row", "background")).toBe("#24242a");
    // Bez tego zła regułka dałaby NaN, a NaN nie jest mniejszy od progu —
    // test kontrastu przechodziłby, nie licząc niczego.
    const opacity = Number(styleOf(".bar", "opacity"));
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThanOrEqual(1);
  });

  test("każda barwa paska przepuszcza tekst przez próg AA", () => {
    const opacity = Number(styleOf(".bar", "opacity"));
    const rowBackground = styleOf(".rows .row", "background");
    const ink = "#f2f2ef";

    const failures = [...SERIES_COLORS, ...Object.values(TYPE_COLORS), OTHER_COLOR]
      .map((color) => [color, contrast(ink, over(color, rowBackground, opacity))] as const)
      .filter(([, ratio]) => ratio < 4.5)
      .map(([color, ratio]) => `${color}: ${ratio.toFixed(2)}:1`);

    expect(failures).toEqual([]);
  });

  /**
   * Kontrapunkt: przy nasyceniu sprzed poprawki próg NIE był zdawany. Bez tego
   * poprzedni test przechodziłby także wtedy, gdyby liczył coś innego, niż
   * myślimy.
   */
  test("przy poprzednim kryciu próg nie był zdawany", () => {
    const worst = Math.min(
      ...[...SERIES_COLORS, ...Object.values(TYPE_COLORS)].map((color) =>
        contrast("#f2f2ef", over(color, "#24242a", 0.85)),
      ),
    );
    expect(worst).toBeLessThan(4.5);
  });
});

/**
 * Rodzina wraca do swojej barwy także pod nazwą, którą widzi użytkownik.
 *
 * `typeColor` szuka po kluczach pisanych małą literą, a przekrój „TYP OBRAŻEŃ"
 * podaje je z wielkiej. Sześć rodzin ratowała druga droga (`typeFamily` znajduje
 * własny wzorzec w nazwie), ale „broń" powstaje z „fizyczne" i „dystansowe"
 * i sama żadnego nie zawiera — więc NAJWIĘKSZY wiersz w panelu dostawał barwę
 * „nie wiadomo", nie do odróżnienia od „Nieznany".
 */
describe("nazwa wiersza trafia w tę samą barwę co etykieta z logu", () => {
  test.each([
    ["fizyczne", "broń"],
    ["dystansowe", "broń"],
    ["broń pomocnicza", "broń"],
    ["ogień", "ogień"],
    ["zimno", "zimno"],
    ["błyskawica", "błyskawica"],
    ["nieuchronne", "nieuchronne"],
    ["od trucizny", "trucizna"],
    ["po zranieniu", "rana"],
  ])("„%s” → wiersz w barwie rodziny %s", (raw, family) => {
    expect(typeColor(typeDisplay(raw))).toBe(TYPE_COLORS[family]!);
    expect(typeColor(typeDisplay(raw))).toBe(typeColor(raw));
    expect(typeColor(typeDisplay(raw))).not.toBe(OTHER_COLOR);
  });

  test("nierozpoznane zostaje neutralne pod obiema nazwami", () => {
    for (const raw of ["globalne", "bez żywiołu", "dmgz"]) {
      expect(typeColor(typeDisplay(raw))).toBe(OTHER_COLOR);
    }
  });
});
