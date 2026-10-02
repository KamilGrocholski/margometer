/**
 * Which combatant is the reader, asked of a client that may state its hero's id or not.
 *
 * The page is handed in, so none of this needs a browser, and the test of `getId` is the one that
 * keeps this file a reader rather than a caller.
 */

import { assert, assertInstanceOf, assertStrictEquals } from "@std/assert";
import * as errors from "#/libs/errors.ts";
import { initGameHero } from "#/src/game/game-hero.ts";
import { GAME_VALUE, GameValueAbsent } from "#/src/game/game-value.ts";

Deno.test("the hero's id is read off the client's own state, as a number or as text", () => {
    assertStrictEquals(readHeroIdOf(composeEngine(1897)), 1897, "as the page holds it");
    assertStrictEquals(readHeroIdOf(composeEngine("1897")), 1897, "and spelled as text");
    assertStrictEquals(readHeroIdOf(composeEngine(1)), 1, "the least id there is");
});

function readHeroIdOf(engine: unknown) {
    return initGameHero({ Engine: engine }).readHeroId();
}

function composeEngine(id: unknown): Record<string, unknown> {
    return { hero: { d: { id, nick: "Gracz 1", x: 12, y: 34 } } };
}

Deno.test("an id that names nobody is none, never a guess", () => {
    expectAbsent(readHeroIdOf(composeEngine(0)), "nought is no character's id");
    expectAbsent(readHeroIdOf(composeEngine(-1)), "and nor is below it");
    expectAbsent(readHeroIdOf(composeEngine(1.5)), "a part of one is none");
    expectAbsent(readHeroIdOf(composeEngine("hero")), "text naming no number is none");
    expectAbsent(readHeroIdOf(composeEngine(true)), "and a value of the wrong type is none");
    expectAbsent(readHeroIdOf({ hero: { d: {} } }), "a hero stating no id says nothing");
    expectAbsent(readHeroIdOf({ hero: {} }), "nor does one holding no state");
    expectAbsent(readHeroIdOf({}), "an engine holding no hero says nothing");
    expectAbsent(initGameHero(null).readHeroId(), "and nor does no page");
});

function expectAbsent(read: unknown, message: string): void {
    assertInstanceOf(read, GameValueAbsent, message);
    assertStrictEquals(read.reading, GAME_VALUE.hero, `${message}: the reading named`);
}

Deno.test("the engine is read by the page's call when the field holds none", () => {
    const page = { getEngine: () => composeEngine(7) };
    assertStrictEquals(initGameHero(page).readHeroId(), 7, "read through the call");
});

Deno.test("the first spelling of the game that states an id is the one read", () => {
    const page = { Engine: composeEngine(7), getEngine: () => composeEngine(8) };
    assertStrictEquals(initGameHero(page).readHeroId(), 7, "Engine");
    const second = { Engine: { hero: { d: {} } }, getEngine: () => composeEngine(8) };
    assertStrictEquals(
        initGameHero(second).readHeroId(),
        8,
        "and the call where Engine has none",
    );
});

Deno.test("a page tearing itself down is a failure of theirs, not a reading of nothing", () => {
    const thrown = new TypeError("the context is gone");
    const page = {
        Engine: {
            get hero(): unknown {
                throw thrown;
            },
        },
    };
    const read = initGameHero(page).readHeroId();
    assertInstanceOf(read, errors.Caught, "a failure of theirs");
    assertStrictEquals(read.cause, thrown, "with its cause");
});

Deno.test("the client's own method for this is never called", () => {
    let called = 0;
    const engine = {
        hero: {
            d: { id: 1897 },
            getId: () => {
                called += 1;
                return 1897;
            },
        },
    };
    assertStrictEquals(readHeroIdOf(engine), 1897, "the id is read");
    assertStrictEquals(called, 0, "by reading a property, never by calling into their program");
    assert(typeof engine.hero.getId === "function", "though the method was there to be called");
});
