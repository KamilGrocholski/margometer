/**
 * Where a fight is, read off a page that is a plain object literal.
 *
 * The client is not here and never will be, so every page below is written by
 * hand — the same way `tests/game/engine-attachment.test.ts` writes one. What
 * that buys is that each shape says out loud which client it stands for: one
 * part-way through loading a map, one exposing the other spelling of the engine,
 * one tearing its context down.
 *
 * ⚠️ **No name below is a map of the game's.** The client's own names for its
 * places are the operator's, and NOTICE.md keeps them out of this repository in
 * any form; what is under test is the reading, which does not care what the text
 * says.
 */

import { describe, expect, test } from "bun:test";
import { getPlaceFromWindow } from "@/src/game/engine-place.ts";
import { getEnginesFromPage, type GameWindow } from "@/src/game/engine-attachment.ts";

/** A page holding one engine, under whichever spelling the caller asks for. */
function composePage(engine: unknown, spelling: "Engine" | "getEngine" = "Engine"): GameWindow {
  return spelling === "Engine"
    ? ({ Engine: engine } as GameWindow)
    : ({ getEngine: () => engine } as GameWindow);
}

describe("both spellings of the engine", () => {
  test("are offered in the order they are tried", () => {
    const first = { battle: 1 };
    const second = { battle: 2 };
    expect(getEnginesFromPage({ Engine: first, getEngine: () => second })).toEqual([first, second]);
  });

  test("are both offered when only one of them is there", () => {
    expect(getEnginesFromPage({})).toEqual([undefined, undefined]);
  });
});

describe("where a fight is", () => {
  test("is nothing on a page with no game on it", () => {
    expect(getPlaceFromWindow({})).toBe(null);
  });

  test.each([
    ["an engine with neither", { battle: {} }],
    ["a map that is not an object", { map: 7 }],
    ["a hero that is not an object", { hero: "somewhere" }],
    ["a map with no bag of its own", { map: {} }],
  ])("is nothing where the client offers %s", (_, engine) => {
    expect(getPlaceFromWindow(composePage(engine))).toBe(null);
  });

  /**
   * ⚠️ **The case that actually happens.** `core/map/Map.js:1227-1240` — `onClear`,
   * "called before new map loads" — empties the bag, so a read landing there finds
   * the object and nothing in it. Null, never a stale name.
   */
  test("is nothing while a map is loading", () => {
    expect(getPlaceFromWindow(composePage({ map: { d: {} }, hero: { d: {} } }))).toBe(null);
  });

  test("is the map's name and the tile stood on", () => {
    const page = composePage({ map: { d: { name: "a clearing" } }, hero: { d: { x: 34, y: 12 } } });
    expect(getPlaceFromWindow(page)).toEqual({ mapName: "a clearing", x: 34, y: 12 });
  });

  test("is read under the other spelling of the engine too", () => {
    const engine = { map: { d: { name: "a clearing" } }, hero: { d: { x: 34, y: 12 } } };
    expect(getPlaceFromWindow(composePage(engine, "getEngine"))).toEqual({
      mapName: "a clearing",
      x: 34,
      y: 12,
    });
  });

  /**
   * The client compares these with `==` and subtracts them in the same file
   * (`core/characters/Hero.js:288`, `:337`), so it does not mind which it holds
   * and neither does this.
   */
  test("reads a tile the client is holding as text", () => {
    const page = composePage({ hero: { d: { x: "34", y: "12" } } });
    expect(getPlaceFromWindow(page)).toEqual({ mapName: null, x: 34, y: 12 });
  });

  test.each([
    ["a tile that is not whole", { x: 34.5, y: 12.5 }],
    ["a tile that is not a number at all", { x: {}, y: [] }],
    ["a tile stated as text that is not digits", { x: "", y: "nope" }],
  ])("says nothing about %s, and still answers", (_, held) => {
    const page = composePage({ map: { d: { name: "a clearing" } }, hero: { d: held } });
    expect(getPlaceFromWindow(page)).toEqual({ mapName: "a clearing", x: null, y: null });
  });

  /** Zero is a tile somebody can stand on, and the boundary from both sides (§7.5). */
  test.each([
    [0, 0],
    [1, 1],
    [-1, -1],
  ])("keeps the tile %p, which is a place and not an absence", (held, expected) => {
    const page = composePage({ hero: { d: { x: held, y: held } } });
    expect(getPlaceFromWindow(page)).toEqual({ mapName: null, x: expected, y: expected });
  });

  /** An empty name is a value nobody wrote, not a map called nothing (§9.3). */
  test("says nothing about a map whose name is empty", () => {
    const page = composePage({ map: { d: { name: "" } }, hero: { d: { x: 34, y: 12 } } });
    expect(getPlaceFromWindow(page)).toEqual({ mapName: null, x: 34, y: 12 });
  });

  test("says half a place where the client only had half", () => {
    const page = composePage({ map: { d: { name: "a clearing" } } });
    expect(getPlaceFromWindow(page)).toEqual({ mapName: "a clearing", x: null, y: null });
  });

  /**
   * The first candidate holding the objects and none of the values is the same
   * answer as no candidate, so the other spelling still gets its turn — the fault
   * `getBattleFromWindow` was written with and had to be fixed.
   */
  test("moves on to the other spelling where the first one said nothing", () => {
    const page: GameWindow = {
      Engine: { map: { d: {} } },
      getEngine: () => ({ map: { d: { name: "a clearing" } } }),
    };
    expect(getPlaceFromWindow(page)).toEqual({ mapName: "a clearing", x: null, y: null });
  });

  /**
   * A page tearing its context down throws on the read, and §9.5 puts a `try`
   * exactly there. A real fault rather than a thrown `Error`, for the reason
   * `tests/game/engine-attachment.test.ts` gives: that is what reading a
   * torn-down context actually does, and it keeps this file clear of unbranded
   * throws.
   */
  test("is nothing where reaching into the page throws", () => {
    const page = {
      get Engine(): undefined {
        return (undefined as unknown as { Engine: undefined }).Engine;
      },
    };
    expect(() => getPlaceFromWindow(page)).not.toThrow();
    expect(getPlaceFromWindow(page)).toBe(null);
  });
});
