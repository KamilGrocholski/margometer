import { describe, expect, test } from "bun:test";
import { Glob } from "bun";
import { parse } from "../src/parser.ts";
import {
  aggregate,
  EMPTY_STATS,
  invertBreakdown,
  leadsDeeper,
  totalUnattributedDot,
} from "../src/stats.ts";
import type { AttackerBreakdown } from "../src/types.ts";
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

  // Trucizna bez sprawcy stoi na pierwszym szczeblu pod nazwą efektu, więc po
  // odwróceniu wychodzi "od trucizny → od trucizny". Wejście w to pokazałoby
  // wiersz powtarzający sam siebie.
  test("pozycja wskazująca wyłącznie na samą siebie jest liściem", () => {
    expect(leadsDeeper(tier("od trucizny", [["od trucizny", 330, 3]]))).toBe(false);
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
    expect(totalUnattributedDot(EMPTY_STATS.unattributedDotDamage)).toBe(0);
  });
});
describe("trucizna w walce grupowej", () => {
  const load = async () => {
    document.body.innerHTML = await Bun.file(
      `${FIXTURES}new-engine/2026-07-18_lowca-dom-trucizna/log.html`,
    ).text();
    return aggregate(parse(extractText(document.body)));
  };

  test("wskazuje sprawcę trucizny po stronie konfliktu, nie po liczbie postaci", async () => {
    // 1 vs 3: po drugiej stronie Lochy stoi dokładnie jeden gracz, więc
    // wątpliwości nie ma, choć uczestników walki jest czterech.
    const stats = await load();
    expect(totalUnattributedDot(stats.unattributedDotDamage)).toBe(0);

    const lowca = stats.actors.find((a) => a.name === "Łowcożyr Kazrek")!;
    expect(lowca.dealtBy).toEqual([
      { label: "Zwykły atak", amount: 786, hits: 2 },
      { label: "od trucizny", amount: 140, hits: 1 },
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
    expect(stats.unattributedDotDamage).toEqual({ mine: 100, enemy: 0, loose: 0 });
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
    expect(totalUnattributedDot(aggregate(events).unattributedDotDamage)).toBe(280);

    const stats = aggregate(events, fromGame);
    expect(totalUnattributedDot(stats.unattributedDotDamage)).toBe(0);
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

  test("rozróżnia klasy obrażeń fizycznych: zwarcie kontra dystans", async () => {
    const stats = await load();
    expect(stats.actors.find((a) => a.name === "Łowcożyr Kazrek")!.dealtByType).toEqual([
      { label: "dystansowe", amount: 786, hits: 2 },
      { label: "od trucizny", amount: 140, hits: 1 },
    ]);
    // Dwa Odyńce log rozdziela: jeden zbity do 40.37%, drugi atakuje ze 100%.
    expect(stats.actors.find((a) => a.name === "Odyniec #2")!.dealtByType).toEqual([
      { label: "fizyczne", amount: 95, hits: 1 },
    ]);
    expect(stats.actors.find((a) => a.name === "Odyniec #1")!.damageTaken).toBe(455);
  });
});