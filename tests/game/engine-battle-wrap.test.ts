/**
 * The promise the add-on makes to the page, in the one place it could be broken.
 *
 * The engine's own call runs first, its value comes back untouched, a failure of ours stays
 * inside, and a second copy of the add-on stands down rather than counting the fight twice.
 */

import { assert, assertEquals, assertThrows } from "@std/assert";
import { type EngineBattle, wrapEngineBattle } from "@/src/game/engine-battle-wrap.ts";

function composeBattle(answer: unknown): EngineBattle {
    const calls: unknown[][] = [];
    return {
        updateData: function (this: unknown, ...args: unknown[]): unknown {
            calls.push(args);
            return answer;
        },
        calls,
    };
}

Deno.test("the engine's own call runs first, and its value comes back untouched", () => {
    const battle = composeBattle("the engine's own answer");
    const seen: unknown[] = [];
    const wrap = wrapEngineBattle(battle, (payload) => seen.push(payload), () => {});
    assert(wrap !== null, "the wrap went on");
    const update = battle.updateData;
    assert(typeof update === "function", "and left a function behind it");
    assertEquals(update({ m: [] }, 2), "the engine's own answer", "the value is the engine's");
    assertEquals(seen.length, 1, "and the payload reached us once");
    assertEquals(seen[0], { m: [] }, "as the first argument, exactly as it arrived");
    assertEquals(battle.calls, [[{ m: [] }, 2]], "with every argument passed straight through");
});

Deno.test("the order is the engine's call, then ours, and nothing between", () => {
    const order: string[] = [];
    const battle: EngineBattle = {
        updateData: () => {
            order.push("the engine's own");
            return 1;
        },
    };
    const wrap = wrapEngineBattle(battle, () => order.push("ours"), () => {});
    assert(wrap !== null, "the wrap went on");
    const update = battle.updateData;
    assert(typeof update === "function", "and left a function behind it");
    update({});
    assertEquals(order, ["the engine's own", "ours"], "the game is never kept waiting on us");
});

Deno.test("a failure of ours never reaches the page, and is said once", () => {
    const battle = composeBattle(1);
    const reported: unknown[] = [];
    const wrap = wrapEngineBattle(battle, () => {
        throw new RangeError("a failure of ours");
    }, (failure) => reported.push(failure));
    assert(wrap !== null, "the wrap went on");
    const update = battle.updateData;
    assert(typeof update === "function", "and left a function behind it");
    assertEquals(update({}), 1, "the engine's value comes back even though we failed");
    assertEquals(update({}), 1, "and again");
    assertEquals(update({}), 1, "and again");
    assertEquals(reported.length, 1, "the first failure is reported, and only the first");
    assertEquals(wrap.getFailureCount(), 3, "while every one of them is counted");
});

Deno.test("the engine's own failure is the engine's, and is not swallowed", () => {
    const battle: EngineBattle = {
        updateData: () => {
            throw new RangeError("the game's own");
        },
    };
    const wrap = wrapEngineBattle(battle, () => {}, () => {});
    assert(wrap !== null, "the wrap went on");
    const update = battle.updateData;
    assert(typeof update === "function", "and left a function behind it");
    assertThrows(() => update({}), RangeError, "the game's own");
});

Deno.test("a second copy of the add-on stands down", () => {
    const battle = composeBattle(1);
    const first = wrapEngineBattle(battle, () => {}, () => {});
    assert(first !== null, "the first wrap went on");
    assertEquals(wrapEngineBattle(battle, () => {}, () => {}), null, "and the second stands down");
    assertEquals(
        wrapEngineBattle({}, () => {}, () => {}),
        null,
        "as does one with nothing to wrap",
    );
});

Deno.test("a detach puts back what was there, and only where ours is outermost", () => {
    const battle = composeBattle(1);
    const original = battle.updateData;
    const wrap = wrapEngineBattle(battle, () => {}, () => {});
    assert(wrap !== null, "the wrap went on");
    wrap.detach();
    assertEquals(battle.updateData, original, "and came off again");

    const second = composeBattle(1);
    const held = wrapEngineBattle(second, () => {}, () => {});
    assert(held !== null, "a wrap that somebody else builds on");
    const somebodyElse = () => 2;
    second.updateData = somebodyElse;
    held.detach();
    assertEquals(second.updateData, somebodyElse, "is left where it is, layer and all");
});
