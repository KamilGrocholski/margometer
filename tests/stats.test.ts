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
