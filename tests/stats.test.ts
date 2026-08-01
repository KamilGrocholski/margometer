import { describe, expect, test } from "bun:test";
import { Glob } from "bun";
import { parse } from "../src/parser.ts";
import {
  aggregate,
  EMPTY_STATS,
  invertBreakdown,
  leadsDeeper,
  UNATTRIBUTED_SOURCE,
  totalBySide,
  type Aggregate,
} from "../src/stats.ts";
import { Session } from "../src/session.ts";
import { dotLabel, typeDisplay, type AttackerBreakdown } from "../src/types.ts";
import { extractText } from "../src/source.ts";
import { EngineRosterSource, type RosterEntry } from "../src/roster.ts";
import { readFixture } from "./helpers.ts";

const FIXTURES = new URL("./fixtures/", import.meta.url).pathname;

const fixtures = [...new Glob("*/*/raw.txt").scanSync(FIXTURES)].map((path) => ({
  path,
  name: path.replace(/\/raw\.txt$/, ""),
  text: () => Bun.file(FIXTURES + path).text(),
}));

const tier = (label: string, by: Array<[string, number, number]>): AttackerBreakdown => ({
  label,
  amount: by.reduce((sum, [, amount]) => sum + amount, 0),
  hits: by.reduce((sum, [, , hits]) => sum + hits, 0),
  by: by.map(([leaf, amount, hits]) => ({ label: leaf, amount, hits })),
});

describe("invertBreakdown", () => {
  test("zamienia szczeble miejscami, sumując po nowym kluczu", () => {
    const byTarget = [
      tier("Regulus", [
        ["Cios mocy", 100, 2],
        ["Zwykły atak", 40, 1],
      ]),
      tier("Gnoll", [["Cios mocy", 60, 1]]),
    ];

    expect(invertBreakdown(byTarget)).toEqual([
      {
        label: "Cios mocy",
        amount: 160,
        hits: 3,
        by: [
          { label: "Regulus", amount: 100, hits: 2 },
          { label: "Gnoll", amount: 60, hits: 1 },
        ],
      },
      {
        label: "Zwykły atak",
        amount: 40,
        hits: 1,
        by: [{ label: "Regulus", amount: 40, hits: 1 }],
      },
    ]);
  });

  test("oba szczeble malejąco po obrażeniach", () => {
    const inverted = invertBreakdown([
      tier("Słaby cel", [["Kopniak", 1, 1]]),
      tier("Mocny cel", [["Kopniak", 500, 1]]),
      tier("Średni cel", [["Kopniak", 50, 1]]),
    ]);

    expect(inverted[0]!.by.map((one) => one.label)).toEqual(["Mocny cel", "Średni cel", "Słaby cel"]);
  });

  test("puste rozbicie zostaje puste", () => {
    expect(invertBreakdown([])).toEqual([]);
    expect(invertBreakdown([tier("Nikt", [])])).toEqual([]);
  });

  test("odwrócone dwa razy wraca do siebie", () => {
    const byTarget = [
      tier("Regulus", [
        ["Cios mocy", 100, 2],
        ["Zwykły atak", 40, 1],
      ]),
      tier("Gnoll", [["Cios mocy", 60, 1]]),
    ];

    expect(invertBreakdown(invertBreakdown(byTarget))).toEqual(byTarget);
  });
});

describe("leadsDeeper", () => {
  test("pozycja z kilkoma celami prowadzi głębiej", () => {
    expect(leadsDeeper(tier("Cios mocy", [["Regulus", 100, 1], ["Gnoll", 60, 1]]))).toBe(true);
  });

  test("pozycja z jednym, ale INNYM celem też prowadzi głębiej", () => {
    expect(leadsDeeper(tier("Cios mocy", [["Regulus", 100, 1]]))).toBe(true);
  });

  // Wejście w pozycję, pod którą stoi ona sama, pokazałoby wiersz powtarzający
  // sam siebie. Trucizna bez sprawcy stała tak, zanim zebrała się pod pozycją
  // „Bez sprawcy" — reguła zostaje, bo dotyczy KSZTAŁTU rozbicia, nie trucizny.
  test("pozycja wskazująca wyłącznie na samą siebie jest liściem", () => {
    expect(leadsDeeper(tier("Trucizna", [["Trucizna", 330, 3]]))).toBe(false);
  });

  test("pozycja bez celów jest liściem", () => {
    expect(leadsDeeper(tier("Cokolwiek", []))).toBe(false);
  });
});

/**
 * Niezmiennik, na którym stoi cała sekcja „CZYM (ŁĄCZNIE)”.
 *
 * Panel liczy tę listę przez odwrócenie `dealtToBy`, a nie z gotowego
 * `dealtBy` — bo drugi szczebel (komu ta umiejętność zadała) i tak musi wyjść
 * z rozbicia po parze. `dealtBy` jest tu WYROCZNIĄ: jeśli obie drogi kiedykolwiek
 * się rozjadą, panel pokaże inną sumę niż agregat i nikt tego nie zauważy.
 */
describe.each(fixtures)("$name — odwrócenie zgadza się z dealtBy", (fixture) => {
  test("etykieta po etykiecie, nie tylko sumą", async () => {
    const stats = aggregate(parse(await fixture.text()));

    for (const actor of stats.actors) {
      const inverted = new Map(invertBreakdown(actor.dealtToBy).map((one) => [one.label, one]));
      const flat = new Map(actor.dealtBy.map((one) => [one.label, one]));

      expect([...inverted.keys()].sort()).toEqual([...flat.keys()].sort());
      for (const [label, entry] of flat) {
        expect({ label, amount: inverted.get(label)?.amount, hits: inverted.get(label)?.hits }).toEqual(
          { label, amount: entry.amount, hits: entry.hits },
        );
      }
    }
  });

  test("suma odwrócenia to obrażenia zadane postaci", async () => {
    const stats = aggregate(parse(await fixture.text()));

    for (const actor of stats.actors) {
      const total = invertBreakdown(actor.dealtToBy).reduce((sum, one) => sum + one.amount, 0);
      // Trucizna bez przypisanego sprawcy nie wchodzi do rozbicia po parze,
      // więc porównujemy z sumą samego rozbicia, nie z `damageDealt`.
      const viaTargets = actor.dealtToBy.reduce((sum, one) => sum + one.amount, 0);
      expect(total).toBe(viaTargets);
    }
  });
});

describe("EMPTY_STATS jest współdzielonym singletonem", () => {
  // Siedzi naraz w `Session`, w `Overlay` i w obu argumentach pierwszego
  // `render()`. Dopóki nikt go nie mutuje, wszystko działa — a zamrożenie jest
  // tańsze niż nadzieja, że tak zostanie.
  test("nie da się go zmutować", () => {
    expect(Object.isFrozen(EMPTY_STATS)).toBe(true);
    // Zamrożenie obiektu jest płytkie, więc tablice osobno.
    expect(Object.isFrozen(EMPTY_STATS.actors)).toBe(true);
    expect(Object.isFrozen(EMPTY_STATS.timeline)).toBe(true);
    expect(Object.isFrozen(EMPTY_STATS.deaths)).toBe(true);
    expect(Object.isFrozen(EMPTY_STATS.matrix)).toBe(true);
    expect(Object.isFrozen(EMPTY_STATS.unattributedDotDamage)).toBe(true);
  });

  test("jest pusty pod każdym względem", () => {
    expect(EMPTY_STATS.actors).toEqual([]);
    expect(EMPTY_STATS.unknownLines).toBe(0);
    expect(totalBySide(EMPTY_STATS.unattributedDotDamage)).toBe(0);
  });
});
/**
 * Zranienie to JEDYNY DoT, przy którym log nazywa sprawcę wprost: proc
 * „+Zranienie (N)" stoi przy jego ciosie i zapowiada kwotę tyknięcia. Cała
 * atrybucja tego rodzaju stoi na tym, że kwota z proca zgadza się z kwotą
 * tyknięcia — więc jeśli kiedykolwiek przestanie, wiązanie trzeba wycofać, a nie
 * naprawiać. Ten test jest po to, żeby to było widać od razu.
 */
describe.each(fixtures)("$name — zranienie zgadza się z proca", (fixture) => {
  test("każde tyknięcie ma proc o tej samej kwocie", async () => {
    const events = parse(await fixture.text());
    /** Ostatni proc na cel — jeden obejmuje kilka tyknięć pod rząd. */
    const announced = new Map<string, number>();
    const mismatched: string[] = [];

    for (const event of events) {
      if (event.kind === "attack") {
        for (const proc of event.procs) {
          const wound = /^Zranienie \((\d+)\)$/.exec(proc);
          if (wound) announced.set(event.target, parseInt(wound[1]!, 10));
        }
      }
      if (event.kind === "dot" && `${event.via} ${event.dotType}` === "po zranieniu") {
        if (announced.get(event.target) !== event.amount) {
          mismatched.push(`${event.target}: tyknięcie ${event.amount}, proc ${announced.get(event.target)}`);
        }
      }
    }

    expect(mismatched).toEqual([]);
  });
});

describe("zranienie ma sprawcę mimo tłumu po drugiej stronie", () => {
  test("proc wskazuje sprawcę tam, gdzie układ stron nie rozstrzyga", async () => {
    // 10 graczy vs boss: `opponentOf` milczy, bo po drugiej stronie stoi
    // dziesięciu. Zranienie mimo to ma właściciela, bo log go nazwał.
    const stats = aggregate(
      parse(await readFixture("new-engine/2026-07-31_druzyna-vs-hildur-zwyciestwo")),
    );

    const lowca = stats.actors.find((a) => a.name === "Łowcomir Kazrek")!;
    expect(lowca.dealtBy.find((d) => d.label === "Zranienie")?.amount).toBe(3380);

    // Reszta puli zostaje bez sprawcy — i przestaje udawać samą truciznę.
    expect(stats.unattributedDotDamage.types).toEqual([
      { label: "Trucizna", amount: 40435 },
      { label: "Ogień", amount: 556 },
    ]);
  });
});

/**
 * Walka, w której widać obie sprawy naraz: dziesięciu graczy bije bossa
 * (więc jest po czym drążyć) i tyka w niego trucizna, której log nikomu nie
 * przypisuje.
 */
describe("boss z Hildur — rozbicie po zmianie nazewnictwa", () => {
  // Zrzut z DOM-u, nie tekstowy: żywioł siedzi wyłącznie w klasie CSS, więc
  // tylko tędy widać, że „ogień" z ciosu i „ogień" z tyknięcia to jeden wiersz.
  const load = async () => {
    document.body.innerHTML = await Bun.file(
      `${FIXTURES}new-engine/2026-07-31_druzyna-vs-hildur-zwyciestwo/log.html`,
    ).text();
    return aggregate(parse(extractText(document.body)));
  };
  const boss = async () =>
    (await load()).actors.find((a) => a.name === "Hildur Muza Śmierci")!;

  test("przekrój po typie ma po jednym wierszu na rodzinę", async () => {
    const types = (await boss()).takenByType;
    // Żadna rodzina nie stoi dwa razy — to był cały problem: „ogień" z klasy
    // CSS obok „od ognia" z tykającego efektu.
    expect(types.map((t) => t.label)).toEqual([...new Set(types.map((t) => t.label))]);
    // Cios i tyknięcie tego samego żywiołu sumują się w jednym wierszu.
    expect(types.find((t) => t.label === "Ogień")?.amount).toBe(38005 + 556);
  });

  test("przekrój po typie nadal sumuje się do obrażeń przyjętych", async () => {
    // To INNY podział tych samych obrażeń, nie dodatkowe obrażenia — scalanie
    // rodzin nie ma prawa tej równości ruszyć.
    const hildur = await boss();
    expect(hildur.takenByType.reduce((sum, t) => sum + t.amount, 0)).toBe(hildur.damageTaken);
  });

  test("wszystko bez sprawcy stoi w jednej pozycji, na końcu listy", async () => {
    const tiers = (await boss()).takenFromBy;
    const unattributed = tiers.filter((t) => t.label === UNATTRIBUTED_SOURCE);

    expect(unattributed).toHaveLength(1);
    // Na końcu bez względu na kwotę: 40 991 zmieściłoby się w środku rankingu,
    // a tam czytałoby się jak jeszcze jeden przeciwnik.
    expect(tiers.at(-1)).toBe(unattributed[0]!);
    expect(unattributed[0]!.by).toEqual([
      { label: "Trucizna", amount: 40435, hits: 37 },
      { label: "Ogień", amount: 556, hits: 2 },
    ]);
    // Reszta pierwszego szczebla to już wyłącznie postacie.
    const names = new Set((await load()).actors.map((a) => a.name));
    for (const tier of tiers.slice(0, -1)) expect(names.has(tier.label)).toBe(true);
  });

  test("pozycja zbiorcza prowadzi głębiej, bo mówi coś nowego", async () => {
    const tiers = (await boss()).takenFromBy;
    expect(leadsDeeper(tiers.at(-1)!)).toBe(true);
  });

  test("leczenie bez sprawcy dzieli się po stronie leczonego", async () => {
    const stats = await load();
    const healing = stats.unattributedHealing;
    // Boss stoi po stronie 1, drużyna po 0 — pula NIE może być jedną liczbą
    // pokazywaną tak samo na obu zakładkach filtra.
    expect(healing.mine).toBeGreaterThan(0);
    expect(totalBySide(healing)).toBe(133867);
    // Suma po postaciach zgadza się z sumą po stronach.
    expect(stats.actors.reduce((sum, a) => sum + a.unattributedHealingReceived, 0)).toBe(
      totalBySide(healing),
    );
  });
});

describe("trucizna w walce grupowej", () => {
  const events = async () => {
    document.body.innerHTML = await Bun.file(
      `${FIXTURES}new-engine/2026-07-18_lowca-dom-trucizna/log.html`,
    ).text();
    return parse(extractText(document.body));
  };
  const load = async () => aggregate(await events());

  test("wskazuje sprawcę trucizny po stronie konfliktu, nie po liczbie postaci", async () => {
    // 1 vs 3: po drugiej stronie Lochy stoi dokładnie jeden gracz, więc
    // wątpliwości nie ma, choć uczestników walki jest czterech.
    const stats = await load();
    expect(totalBySide(stats.unattributedDotDamage)).toBe(0);

    const lowca = stats.actors.find((a) => a.name === "Łowcożyr Kazrek")!;
    expect(lowca.dealtBy).toEqual([
      { label: "Zwykły atak", amount: 786, hits: 2 },
      { label: "Trucizna", amount: 140, hits: 1 },
    ]);
  });

  test("rozdziela zdublowaną nazwę, gdy ciągi HP się rozjeżdżają", () => {
    const stats = aggregate(
      parse(
        [
          "Rozpoczęła się walka pomiędzy Gracz (1w) a Wilk (1w), Wilk (1w)",
          "Gracz(100%) uderzył z siłą  +300",
          "Wilk(60%) otrzymał(a)  -300  obrażeń",
          // Ten sam skok w górę: 100% nie może być tym wilkiem na 60%.
          "Wilk(100%) zrobił(a) krok do przodu.",
          "Gracz(100%) uderzył z siłą  +200",
          "Wilk(20%) otrzymał(a)  -200  obrażeń",
        ].join("\n"),
      ),
    );

    // Oba trafienia w tego samego wilka: 60% → 20%. Drugi tylko zrobił krok.
    expect(stats.actors.find((a) => a.name === "Wilk #1")!.damageTaken).toBe(500);
    expect(stats.actors.find((a) => a.name === "Wilk #2")!.damageTaken).toBe(0);
    expect(stats.ambiguousNames).toEqual(["Wilk #1", "Wilk #2"]);
  });

  test("nie rozdziela zdublowanej nazwy, gdy log nie daje na to dowodu", () => {
    const stats = aggregate(
      parse(
        [
          "Rozpoczęła się walka pomiędzy Gracz (1w) a Wilk (1w), Wilk (1w)",
          // Obaj przez całą walkę na 100% — nie do rozróżnienia.
          "Wilk(100%) uderzył(a) z siłą  +300",
          "Gracz(70%) otrzymał  -300  obrażeń",
          "Wilk(100%) uderzył(a) z siłą  +200",
          "Gracz(50%) otrzymał  -200  obrażeń",
        ].join("\n"),
      ),
    );

    // Jeden scalony wiersz. Rozbicie na #1/#2 przypisałoby konkretnemu wilkowi
    // obrażenia, o których log milczy — to byłoby zmyślenie, nie statystyka.
    expect(stats.actors.map((a) => a.name)).toEqual(["Wilk", "Gracz"]);
    expect(stats.actors.find((a) => a.name === "Wilk")!.damageDealt).toBe(500);
    expect(stats.ambiguousNames).toEqual(["Wilk"]);
  });

  test("rozdziela duplikaty, które oba zaczynają na 100%", async () => {
    const stats = aggregate(
      parse(await readFixture("new-engine/2026-07-18_lowca-vs-gnolle-rozdzielanie")),
    );

    // Podziału nie wymusza start (obaj na 100%), tylko linia "Gnoll łucznik(100%)
    // uderzył" stojąca PO "Gnoll łucznik(0%)" — życie nie rośnie, więc to ktoś inny.
    const first = stats.actors.find((a) => a.name === "Gnoll łucznik #1")!;
    const second = stats.actors.find((a) => a.name === "Gnoll łucznik #2")!;
    expect([first.damageTaken, first.damageDealt]).toEqual([2337, 439]);
    expect([second.damageTaken, second.damageDealt]).toEqual([1522, 460]);

    // Szaman padł bez jednej akcji, ale ma być widoczny.
    expect(stats.actors.find((a) => a.name === "Gnoll szaman")).toMatchObject({
      damageDealt: 0,
      damageTaken: 1411,
    });

    // Cały log rozpoznany — łącznie z "atak w martwego przeciwnika".
    expect(stats.unknownLines).toBe(0);
    expect(stats.ambiguousNames).toEqual(["Gnoll łucznik #1", "Gnoll łucznik #2"]);
  });

  test("skład z gry rozdziela nierozróżnialne duplikaty na osobne wiersze", () => {
    const log = [
      "Rozpoczęła się walka pomiędzy Gracz (1w) a Wilk (1w), Wilk (1w)",
      // Obaj przez całą walkę na 100% — log ich nie rozróżnia.
      "Wilk(100%) uderzył(a) z siłą  +300",
      "Gracz(70%) otrzymał  -300  obrażeń",
    ].join("\n");
    const fromGame: RosterEntry[] = [
      { id: 1, name: "Gracz", side: 0 },
      { id: 2, name: "Wilk", side: 1 },
      { id: 3, name: "Wilk", side: 1 },
    ];

    // Bez składu z gry: jeden scalony wiersz, bo log nie daje dowodu na dwa.
    expect(aggregate(parse(log)).actors.map((a) => a.name)).toEqual(["Wilk", "Gracz"]);

    // Ze składem z gry: istnienie obu wilków to fakt, więc dostają po wierszu.
    const stats = aggregate(parse(log), fromGame);
    expect(stats.actors.map((a) => a.name).sort()).toEqual(["Gracz", "Wilk #1", "Wilk #2"]);
    // Obrażeń log nie rozdzielił — całość siedzi na jednym, oba z gwiazdką.
    expect(stats.actors.find((a) => a.name === "Wilk #1")!.damageDealt).toBe(300);
    expect(stats.actors.find((a) => a.name === "Wilk #2")!.damageDealt).toBe(0);
    expect(stats.ambiguousNames).toEqual(["Wilk #1", "Wilk #2"]);
  });

  /**
   * Numer instancji nadaje heurystyka śledząca HP, w kolejności ujawniania przez
   * log — a ta nie ma nic wspólnego z kolejnością składu. Przy tej samej nazwie
   * po obu stronach nie da się więc powiedzieć, który wiersz jest czyj, i to
   * dotyczy KAŻDEJ instancji, także pierwszej.
   */
  test("ta sama nazwa po obu stronach nie dostaje żadnej strony", () => {
    const log = [
      "Rozpoczęła się walka pomiędzy Gracz (1w), Wilk (1w) a Wilk (1w), Wróg (1m)",
      "Wilk(80%) otrzymał -100 obrażeń",
    ].join("\n");
    const stats = aggregate(parse(log), [
      { id: 1, name: "Gracz", side: 0 },
      { id: 2, name: "Wilk", side: 0 },
      { id: 3, name: "Wilk", side: 1 },
      { id: 4, name: "Wróg", side: 1 },
    ]);
    const side = (name: string) => stats.actors.find((a) => a.name === name)!.side;

    // Nie "obie po stronie 0" — to było twierdzenie, i fałszywe.
    expect(side("Wilk #1")).toBeNull();
    expect(side("Wilk #2")).toBeNull();
    // Nazwy jednoznaczne muszą zostać nietknięte.
    expect(side("Gracz")).toBe(0);
    expect(side("Wróg")).toBe(1);
  });

  test("dwie postacie tej samej nazwy po JEDNEJ stronie stronę zachowują", () => {
    const log = [
      "Rozpoczęła się walka pomiędzy Gracz (1w) a Wilk (1w), Wilk (1w)",
      "Wilk(80%) otrzymał -100 obrażeń",
    ].join("\n");
    const stats = aggregate(parse(log), [
      { id: 1, name: "Gracz", side: 0 },
      { id: 2, name: "Wilk", side: 1 },
      { id: 3, name: "Wilk", side: 1 },
    ]);

    // Nazwa zdublowana, ale bezspornie ich — więc "nie wiadomo" byłoby stratą.
    expect(stats.actors.find((a) => a.name === "Wilk #1")!.side).toBe(1);
    expect(stats.actors.find((a) => a.name === "Wilk #2")!.side).toBe(1);
  });

  /**
   * Sprawca tykającego efektu liczy się przez wykluczenie: jeżeli po drugiej
   * stronie stoi dokładnie jeden, to on. Wiersz o nieznanej stronie MOŻE być
   * przeciwnikiem, więc przestaje być "dokładnie jeden" i przypisanie znika.
   */
  test("nazwa po obu stronach zabiera pewność, kto nałożył truciznę", () => {
    const events = parse(
      [
        "Rozpoczęła się walka pomiędzy Gracz (1w), Wilk (1w) a Wilk (1w), Wróg (1m)",
        "Gracz(90%): 30 obrażeń od trucizny.",
      ].join("\n"),
    );
    const roster: RosterEntry[] = [
      { id: 1, name: "Gracz", side: 0 },
      { id: 2, name: "Wilk", side: 0 },
      { id: 3, name: "Wilk", side: 1 },
      { id: 4, name: "Wróg", side: 1 },
    ];

    const stats = aggregate(events, roster);
    // Wrogi Wilk mógł zatruć tak samo jak Wróg — nie ma jednego kandydata.
    expect(stats.actors.find((a) => a.name === "Wróg")!.damageDealt).toBe(0);
    expect(stats.unattributedDotDamage.mine).toBe(30);

    // Kontrola: bez zdublowanej nazwy sprawca jest jeden i przypis ma zostać.
    const clear = aggregate(events, [roster[0]!, roster[3]!]);
    expect(clear.actors.find((a) => a.name === "Wróg")!.damageDealt).toBe(30);
    expect(clear.unattributedDotDamage.mine).toBe(0);
  });

  test("skład z gry pokazuje postać, o której log w ogóle nie wspomniał", () => {
    const stats = aggregate(
      parse("Rozpoczęła się walka pomiędzy Gracz (1w) a Wilk (1w)"),
      [
        { id: 1, name: "Gracz", side: 0 },
        { id: 2, name: "Wilk", side: 1 },
        // Log otwierający go pominął, ale w walce stoi.
        { id: 3, name: "Niedźwiedź", side: 1 },
      ],
    );

    expect(stats.actors.map((a) => a.name).sort()).toEqual(["Gracz", "Niedźwiedź", "Wilk"]);
    expect(stats.actors.find((a) => a.name === "Niedźwiedź")!.side).toBe(1);
  });

  test("strony bierze z myteam gry, nie z kolejności w logu", () => {
    const source = new EngineRosterSource({
      Engine: {
        battle: {
          myteam: 2,
          warriorsList: [{ name: "" }, { name: "" }],
          warriors: {
            a: { id: 10, name: "Gracz", team: 2 },
            b: { id: 11, name: "Wilk", team: 1 },
          },
        },
      },
    });

    // Gra raportuje myteam: 2, u nas drużyna gracza to zawsze strona 0.
    expect(source.current()).toEqual([
      { id: 10, name: "Gracz", side: 0 },
      { id: 11, name: "Wilk", side: 1 },
    ]);
  });

  test("czyta profesję z gry i dokłada ją tam, gdzie log jej nie podał", () => {
    const source = new EngineRosterSource({
      Engine: {
        battle: {
          myteam: 1,
          warriors: {
            a: { id: 10, name: "Gracz", team: 1, prof: "m" },
            // Starszy klient albo patch: wpis bez profesji ma nadal działać.
            b: { id: 11, name: "Wilk", team: 2 },
          },
        },
      },
    });
    const fromGame = source.current()!;
    expect(fromGame[0]).toMatchObject({ name: "Gracz", side: 0, prof: "m" });
    expect(fromGame[1]).not.toHaveProperty("prof");

    // Nagłówek wyjechał z bufora, więc profesji nie ma skąd wziąć poza grą.
    const stats = aggregate(parse("Gracz(50%): 100 obrażeń od trucizny."), fromGame);
    expect(stats.actors.find((a) => a.name === "Gracz")!.professionCode).toBe("m");
    expect(stats.actors.find((a) => a.name === "Wilk")!.professionCode).toBeNull();
  });

  test("profesja z linii otwierającej uzupełnia skład z gry", () => {
    // Skład z gry rządzi stronami, ale gdy nie niesie profesji, literę dokłada
    // log — oba źródła piszą ją tym samym alfabetem.
    const stats = aggregate(
      parse("Rozpoczęła się walka pomiędzy Gracz (85b) a Wilk (12w)"),
      [
        { id: 1, name: "Gracz", side: 0 },
        { id: 2, name: "Wilk", side: 1 },
      ],
    );
    expect(stats.actors.find((a) => a.name === "Gracz")!.professionCode).toBe("b");
    expect(stats.actors.find((a) => a.name === "Wilk")!.professionCode).toBe("w");
  });

  test("brak walki albo obcy kształt danych nie wywraca odczytu składu", () => {
    expect(new EngineRosterSource({}).current()).toBeNull();
    expect(new EngineRosterSource({ Engine: {} }).current()).toBeNull();
    // Sloty bez nazw to prealokacja poza walką, nie skład.
    expect(
      new EngineRosterSource({ Engine: { battle: { myteam: 1, warriors: [{ name: "" }] } } }).current(),
    ).toBeNull();
    // Bez myteam nie zgadujemy stron — zostawiamy je logowi.
    expect(
      new EngineRosterSource({
        Engine: { battle: { warriors: [{ id: 1, name: "X", team: 1 }] } },
      }).current(),
    ).toBeNull();
  });

  test("nie zgaduje sprawcy, gdy po drugiej stronie stoi kilku", async () => {
    // Gracz otoczony przez trzech: który z nich zatruł — nie wiadomo.
    const events = parse(
      [
        "Rozpoczęła się walka pomiędzy Gracz (1w) a A (1w), B (1w), C (1w)",
        "Gracz(50%): 100 obrażeń od trucizny.",
      ].join("\n"),
    );
    const stats = aggregate(events);
    // Sprawcy nie znamy, ale poszkodowanego tak — trucizna ląduje po stronie gracza.
    expect(stats.unattributedDotDamage).toEqual({
      mine: 100,
      enemy: 0,
      loose: 0,
      // Pula wie, CO w niej jest — inaczej przypis w panelu nazwałby trucizną
      // także ogień i rany.
      types: [{ label: "Trucizna", amount: 100 }],
    });
    expect(stats.actors.find((a) => a.name === "A")?.damageDealt).toBe(0);
  });

  test("skład z gry wskazuje sprawcę trucizny, gdy nagłówek wyjechał z bufora", () => {
    // Przewidziany przypadek: log traci treść od góry, więc linii otwierającej
    // już nie widać. Skład z gry mówi jednak wprost, kto stoi po drugiej stronie.
    const events = parse("Gracz(50%): 280 obrażeń od trucizny.");
    const fromGame: RosterEntry[] = [
      { id: 1, name: "Gracz", side: 0 },
      { id: 2, name: "Wilk", side: 1 },
    ];

    // Bez składu nie ma po czym liczyć stron — trucizna zostaje bez sprawcy.
    expect(totalBySide(aggregate(events).unattributedDotDamage)).toBe(280);

    const stats = aggregate(events, fromGame);
    expect(totalBySide(stats.unattributedDotDamage)).toBe(0);
    expect(stats.actors.find((a) => a.name === "Wilk")!.damageDealt).toBe(280);
  });

  test("trucizna przed pierwszą turą nie wypada z osi tur", () => {
    // Bufor przycięty do tyknięcia trucizny: żadna tura jeszcze się nie otwarła,
    // a kwota nie ma prawa przepaść — Σ osi musi się zgadzać z Σ zdarzeń.
    const stats = aggregate(
      parse(
        [
          "Gracz(50%): 140 obrażeń od trucizny.",
          "Gracz(50%) uderzył z siłą  +2189",
          "Wilk(10%) otrzymał(a)  -2189  obrażeń",
        ].join("\n"),
      ),
    );

    const onAxis = stats.timeline.reduce((sum, slice) => sum + slice.damage, 0);
    expect(onAxis).toBe(140 + 2189);
    // Tura tła nie dostaje strony: log nie mówi, kto wtedy działał.
    expect(stats.timeline[0]).toMatchObject({ turn: 1, side: null, damage: 140 });
  });

  test("maks. cios nie liczy własnych obrażeń umiejętności", () => {
    const stats = aggregate(
      parse(
        [
          "Rozpoczęła się walka pomiędzy Gracz (1m) a Wilk (1w)",
          "Gracz wykonuje Fuzja żywiołów.",
          // Własne obrażenia umiejętności — lecą OBOK ciosu, nie są ciosem.
          "-2000 obrażeń otrzymał(a) Wilk(50%).",
          "Gracz(100%) uderzył z siłą  +300",
          "Wilk(30%) otrzymał(a)  -300  obrażeń",
        ].join("\n"),
      ),
    );

    const gracz = stats.actors.find((a) => a.name === "Gracz")!;
    // Obrażenia liczą się w całości, rekord pojedynczego uderzenia już nie.
    expect(gracz.damageDealt).toBe(2300);
    expect(gracz.maxHit).toBe(300);
  });

  /**
   * Rozróżnienie zwarcie/dystans żyje w PARSERZE — `dmg` odyńca kontra `dmgd`
   * łowcy — i tam się go pilnuje. Przekrój w panelu nazywa RODZINY, więc obie
   * klasy stoją w nim pod „Bronią": to ta sama oś (czym uderzono), a nie dwa
   * różne rodzaje obrażeń. Test trzyma oba szczeble naraz, bo dopiero razem
   * mówią, że informacja nie ginie — tylko nie jest wierszem rankingu.
   */
  test("rozróżnia klasy obrażeń fizycznych: zwarcie kontra dystans", async () => {
    const parsed = await events();
    const elementsOf = (name: string) =>
      new Set(
        parsed.flatMap((event) =>
          event.kind === "attack" && event.source === name
            ? event.hits.map((hit) => hit.element)
            : [],
        ),
      );
    expect(elementsOf("Łowcożyr Kazrek")).toEqual(new Set(["dystansowe"]));
    expect(elementsOf("Odyniec")).toEqual(new Set(["fizyczne"]));

    const stats = aggregate(parsed);
    expect(stats.actors.find((a) => a.name === "Łowcożyr Kazrek")!.dealtByType).toEqual([
      { label: "Broń", amount: 786, hits: 2 },
      { label: "Trucizna", amount: 140, hits: 1 },
    ]);
    // Dwa Odyńce log rozdziela: jeden zbity do 40.37%, drugi atakuje ze 100%.
    expect(stats.actors.find((a) => a.name === "Odyniec #2")!.dealtByType).toEqual([
      { label: "Broń", amount: 95, hits: 1 },
    ]);
    expect(stats.actors.find((a) => a.name === "Odyniec #1")!.damageTaken).toBe(455);
  });
});
/**
 * Niezmienniki agregacji — po każdej walce z korpusu i po SUMIE SESJI.
 *
 * Przelot był dotąd jednorazowym pomiarem robionym ręcznie przy audycie. Skoro
 * ma znaczyć „liczby się domykają", musi lecieć przy każdym `bun test`: to
 * jedyny test, który złapie rozjazd w rozbiciu, którego nikt nie wymienił
 * z nazwy — łącznie z polem, którego jeszcze nie ma.
 */
describe("niezmienniki liczb", () => {
  const sum = (rows: ReadonlyArray<{ amount: number }>) =>
    rows.reduce((total, row) => total + row.amount, 0);

  /** Wszystkie rozjazdy naraz, żeby raport mówił CO nie gra, a nie tylko że. */
  const mismatches = (stats: Aggregate): string[] => {
    const found: string[] = [];
    for (const a of stats.actors) {
      const check = (what: string, got: number, want: number) => {
        if (got !== want) found.push(`${a.name}: ${what} ${got} ≠ ${want}`);
      };
      check("dealtBy", sum(a.dealtBy), a.damageDealt);
      check("dealtByType", sum(a.dealtByType), a.damageDealt);
      check("takenFrom", sum(a.takenFrom), a.damageTaken);
      check("takenByType", sum(a.takenByType), a.damageTaken);
      check("takenFromBy", sum(a.takenFromBy), a.damageTaken);
      check("healedBy", sum(a.healedBy), a.healingReceived);
      // Pule bez sprawcy są CZĘŚCIĄ sum postaci, nie dodatkiem obok nich.
      check("rodzaje DoT-u bez sprawcy", sum(a.unattributedDotTypes), a.unattributedDotTaken);
      if (a.unattributedDotTaken > a.damageTaken) found.push(`${a.name}: DoT bez sprawcy > przyjęte`);
      if (a.unattributedHealingReceived > a.healingReceived) {
        found.push(`${a.name}: leczenie bez sprawcy > otrzymane`);
      }
      // Obie liczby panel pokazuje W NAWIASIE przy większej z pary („pochłonięte
      // 55 923 (blok 10 568)", „kryt. 7 (w tym 1 bardzo)"), więc przekroczenie
      // znaczyłoby, że nawias mówi więcej niż to, co rzekomo rozbija — a czytający
      // nie ma jak tego zauważyć. Podzbiór jest tu kontraktem, nie obserwacją.
      if (a.damageBlocked > a.damageAbsorbed) found.push(`${a.name}: blok > pochłonięte`);
      if (a.superCrits > a.crits) found.push(`${a.name}: bardzo krytyczne > krytyczne`);
    }
    const total = (pick: (a: Aggregate["actors"][number]) => number) =>
      stats.actors.reduce((s, a) => s + pick(a), 0);
    // Każdy punkt obrażeń ma dokładnie jednego właściciela albo trafia do puli.
    if (total((a) => a.damageDealt) + totalBySide(stats.unattributedDotDamage) !== total((a) => a.damageTaken)) {
      found.push("Σ zadane + DoT bez sprawcy ≠ Σ przyjęte");
    }
    if (total((a) => a.healingDone) + totalBySide(stats.unattributedHealing) !== total((a) => a.healingReceived)) {
      found.push("Σ leczenie zadane + bez sprawcy ≠ Σ otrzymane");
    }
    // Podział na strony i podział na postacie muszą dawać tę samą liczbę.
    if (total((a) => a.unattributedDotTaken) !== totalBySide(stats.unattributedDotDamage)) {
      found.push("DoT bez sprawcy: suma per postać ≠ suma per strona");
    }
    if (total((a) => a.unattributedHealingReceived) !== totalBySide(stats.unattributedHealing)) {
      found.push("leczenie bez sprawcy: suma per postać ≠ suma per strona");
    }
    return found;
  };

  describe.each(fixtures)("$name", (fixture) => {
    test("rozbicia domykają się ze skalarami", async () => {
      expect(mismatches(aggregate(parse(await fixture.text())))).toEqual([]);
    });

    /**
     * Każdy atak jest albo ciosem, albo unikiem — nigdy obydwoma i nigdy żadnym.
     *
     * To jest niezmiennik, dla którego rozdzielono uniki pełne od częściowych
     * (`AUDYT‑40`). Dopóki trzyma, „ciosy N · uniki M" w stopce można dodać
     * i wyjdzie liczba ataków; wcześniej atak z częściowym unikiem podbijał oba
     * liczniki i suma była o niego za duża.
     */
    test("ciosy i uniki sumują się do liczby ataków", async () => {
      const events = parse(await fixture.text());
      const stats = aggregate(events);
      const ataki = events.filter((e) => e.kind === "attack" && e.strike).length;
      const ciosy = stats.actors.reduce((sum, a) => sum + a.hits, 0);
      const uniki = stats.actors.reduce((sum, a) => sum + a.misses, 0);

      expect(ciosy + uniki).toBe(ataki);
    });
  });

  test("te same niezmienniki trzymają po scaleniu całej sesji", async () => {
    // Najostrzejszy przypadek scalania: wszystkie walki korpusu w jednej sesji.
    const session = new Session();
    const texts: string[] = [];
    for (const fixture of fixtures) texts.push(await fixture.text());
    session.update(texts.join("\n"));

    const total = session.total();
    expect(total.actors.length).toBeGreaterThan(0);
    expect(mismatches(total)).toEqual([]);
  });
});

/**
 * Trzy pola, które parser liczył od dawna, a które do niedawna nie docierały
 * nigdzie (`SOLID §4.22`).
 *
 * Liczby są konkretne, nie „większe od zera": każda z nich stoi w JEDNEJ walce
 * i daje się odtworzyć z logu ręcznie, więc test mówi, że rachunek jest ten sam,
 * a nie tylko że coś się policzyło.
 */
describe("blok, super-kryt i osłabienie DoT-a", () => {
  const load = async (name: string) =>
    aggregate(parse(await Bun.file(`${FIXTURES}new-engine/${name}/raw.txt`).text()));
  const actor = (stats: Aggregate, name: string) => stats.actors.find((a) => a.name === name)!;

  test("blok siada u CELU, nie u napastnika", async () => {
    // "Zablokowanie 23 obrażeń" stoi w bloku ciosu łowcy, ale mówi o tarczy
    // Wieczornicy — i to ona ma je mieć.
    const stats = await load("2026-07-18_lowca-vs-paladyni");
    expect(actor(stats, "Wieczornica").damageBlocked).toBe(23);
    expect(actor(stats, "Łowca głów z psk").damageBlocked).toBe(0);
    // Blok jest częścią pochłoniętych, nie liczbą obok nich.
    expect(actor(stats, "Wieczornica").damageAbsorbed).toBe(497);
  });

  test("super-kryt jest podzbiorem krytów", async () => {
    const stats = await load("2026-07-31_druzyna-vs-hildur-zwyciestwo");
    // Hildur ma siedem krytów, z czego jeden „bardzo krytyczny".
    expect(actor(stats, "Hildur Muza Śmierci")).toMatchObject({ crits: 7, superCrits: 1 });
    // Skrajny przypadek z innej walki: wszystkie kryty są super. Wtedy nawias
    // powtarza liczbę wiodącą i to jest poprawne — nie jest to sygnał błędu.
    const third = await load("2026-08-01_druzyna-vs-hildur-trzeci-sklad");
    expect(actor(third, "Wyczxs")).toMatchObject({ crits: 3, superCrits: 3 });
  });

  test("osłabienie DoT-a odtwarza się z kwoty po osłabieniu", async () => {
    // Jedyna osłabiona linia w tej walce:
    //   "Łowcomir Kazrek(67.58%) otrzymał 236 (osłabione o 19%) obrażeń od ognia."
    // Pełne tyknięcie to 236 / 0,81 = 291,36 → 291, więc osłabienie zdjęło 55.
    const stats = await load("2026-07-18_lowca-vs-tropiciel-glebokarana");
    expect(actor(stats, "Łowcomir Kazrek").damageWeakened).toBe(55);
    // Przyjęte zostają kwotą Z LOGU — odtworzona baza nie wchodzi do sum.
    expect(actor(stats, "Łowcomir Kazrek").damageTaken).toBe(1188);
  });

  test("bez takiej linii pola stoją na zerze", async () => {
    // Walka z kukłą: żadnego bloku i żadnego kryta po obu stronach. Zero jest
    // tu wynikiem, nie brakiem — panel na jego podstawie CHOWA człony liczników.
    const stats = await load("2026-07-18_tancerz-vs-kukla");
    for (const a of stats.actors) {
      expect({ blok: a.damageBlocked, superKryt: a.superCrits }).toEqual({ blok: 0, superKryt: 0 });
    }
  });
});

/**
 * Etykiety, które WYMYŚLAMY, kontra nazwy, które przychodzą z gry.
 *
 * `Bez sprawcy`, `Trucizna`, `Broń` czy `Locha #1` są zwykłymi kluczami mapy,
 * więc postać albo umiejętność o takiej nazwie skleiłaby się z nimi w jeden
 * wiersz — dwie różne rzeczy pod jedną liczbą. Nicki Margonem tego nie
 * dopuszczają i nie bronimy się przed tym na zapas, ale zamiana etykiet DoT-u
 * na zwykłe rzeczowniki („od ognia" → „Ogień") podniosła ryzyko: gra ma
 * umiejętności jednowyrazowe.
 *
 * Ten test nie naprawia kolizji — pilnuje, żeby dzień, w którym pojawi się
 * pierwsza, był dniem czerwonego zestawu, a nie cichej pomyłki w panelu.
 */
describe("zarezerwowane etykiety nie kolidują z nazwami z gry", () => {
  const RESERVED = new Set([
    UNATTRIBUTED_SOURCE,
    "Zwykły atak",
    "Regeneracja",
    ...["ogień", "błyskawica", "zimno", "trucizna", "rana", "nieuchronne", "broń"].map(typeDisplay),
    ...[
      ["od", "trucizny"],
      ["od", "głębokiej rany"],
      ["od", "ognia"],
      ["po", "zranieniu"],
      ["od", "błyskawic"],
    ].map(([via, type]) => dotLabel(via!, type!)),
  ]);

  test.each(fixtures)("$name", async (fixture) => {
    const names = new Set<string>();
    for (const event of parse(await fixture.text())) {
      if (event.kind === "ability") {
        names.add(event.name);
        names.add(event.actor);
      }
      if (event.kind === "fight-start") for (const p of event.participants) names.add(p.name);
    }
    expect([...names].filter((name) => RESERVED.has(name))).toEqual([]);
  });
});
