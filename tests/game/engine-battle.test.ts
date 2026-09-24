/**
 * The promise the add-on makes to the page, in the one place it could be broken.
 *
 * The engine's own call runs first, its value comes back untouched, a failure of ours stays
 * inside, and a second copy of the add-on stands down rather than counting the fight twice
 * (`develop:tests/game/engine-battle-wrap.test.ts`).
 */

import { assert, assertEquals, assertStrictEquals, assertThrows } from "@std/assert";
import { err, RESULT_FAILURE } from "@/libs/result.ts";
import {
    ENGINE_FAILURE,
    type EngineBattle,
    initPageEngine,
    type PayloadListener,
    readPageEngines,
    type WrapHandle,
} from "@/src/game/engine-battle.ts";
import { WARRIOR_FAILURE } from "@/src/game/warrior-snapshot.ts";

/** A listener that does nothing, so each test states only the half it is about. */
function composeListener(said: Partial<PayloadListener>): PayloadListener {
    return {
        onBeforeCall: said.onBeforeCall ?? (() => {}),
        onPayload: said.onPayload ?? (() => {}),
    };
}

interface Held {
    battle: Record<string, unknown>;
    calls: { thisArg: unknown; args: unknown[] }[];
}

function composeHeld(answer: unknown): Held {
    const calls: { thisArg: unknown; args: unknown[] }[] = [];
    const battle: Record<string, unknown> = {
        updateData: function (this: unknown, ...args: unknown[]): unknown {
            calls.push({ thisArg: this, args });
            return answer;
        },
    };
    return { battle, calls };
}

function readBattleOn(battle: Record<string, unknown>): EngineBattle {
    const read = initPageEngine({ Engine: { battle } }).readBattle();
    assert(read.ok, "the page holds a battle");
    return read.value;
}

function wrapOn(battle: Record<string, unknown>, listener: PayloadListener): WrapHandle {
    const wrapped = readBattleOn(battle).wrap(listener);
    assert(wrapped.ok, "the wrap went on");
    return wrapped.value;
}

function callUpdate(battle: Record<string, unknown>, thisArg: unknown, args: unknown[]): unknown {
    const update = battle.updateData;
    assert(typeof update === "function", "the battle holds a function to call");
    return Reflect.apply(update, thisArg, args);
}

Deno.test("the engine's own call runs first, and its value comes back untouched", () => {
    const held = composeHeld("the engine's own answer");
    const seen: unknown[] = [];
    wrapOn(held.battle, composeListener({ onPayload: (payload) => void seen.push(payload) }));
    const self = { theGame: true };
    const answer = callUpdate(held.battle, self, [{ m: [] }, 2]);
    assertStrictEquals(answer, "the engine's own answer", "the value is the engine's");
    assertEquals(seen, [{ m: [] }], "and the payload reached us once, as the first argument");
    assertEquals(held.calls.length, 1, "the engine was called once");
    assertStrictEquals(held.calls[0]?.thisArg, self, "on the object the game called it on");
    assertEquals(
        held.calls[0]?.args,
        [{ m: [] }, 2],
        "with every argument passed straight through",
    );
});

Deno.test("the order is ours before, the engine's call, then ours, and nothing between", () => {
    const order: string[] = [];
    const battle: Record<string, unknown> = {
        updateData: () => {
            order.push("the engine's own");
            return 1;
        },
    };
    wrapOn(
        battle,
        composeListener({
            onBeforeCall: () => void order.push("before"),
            onPayload: () => void order.push("after"),
        }),
    );
    callUpdate(battle, null, [{}]);
    assertEquals(order, ["before", "the engine's own", "after"], "the game waits on nothing more");
});

Deno.test("a failure of ours never reaches the page, and every one is counted", () => {
    const held = composeHeld(1);
    const wrap = wrapOn(
        held.battle,
        composeListener({
            onPayload: () => {
                throw new RangeError("a failure of ours");
            },
        }),
    );
    assertStrictEquals(wrap.getFirstFailure(), null, "nothing has failed before a call");
    assertStrictEquals(wrap.getFailureCount(), 0, "and nothing is counted");
    assertStrictEquals(callUpdate(held.battle, null, [{}]), 1, "the engine's value comes back");
    assertStrictEquals(callUpdate(held.battle, null, [{}]), 1, "and again");
    assertStrictEquals(wrap.getFailureCount(), 2, "while every failure is counted");
    const first = wrap.getFirstFailure();
    assertStrictEquals(first?.kind, RESULT_FAILURE.invariantBroken, "and the first one is kept");
    assert(first?.cause instanceof RangeError, "with what it threw");
});

/** Two guards and not one: a throw before the call does not skip the reading after it. */
Deno.test("a failure before the call leaves the reading after it standing", () => {
    const held = composeHeld(1);
    const seen: unknown[] = [];
    const wrap = wrapOn(
        held.battle,
        composeListener({
            onBeforeCall: () => {
                throw new RangeError("before");
            },
            onPayload: (payload) => void seen.push(payload),
        }),
    );
    callUpdate(held.battle, null, [{ n: 1 }]);
    assertEquals(seen, [{ n: 1 }], "the payload was still read");
    assertStrictEquals(held.calls.length, 1, "and the engine still called");
    assertStrictEquals(wrap.getFailureCount(), 1, "with the failure before it counted");
});

Deno.test("the engine's own failure is the engine's, and is not swallowed", () => {
    const seen: unknown[] = [];
    const battle: Record<string, unknown> = {
        updateData: () => {
            throw new RangeError("the game's own");
        },
    };
    const wrap = wrapOn(battle, composeListener({ onPayload: (one) => void seen.push(one) }));
    assertThrows(() => callUpdate(battle, null, [{}]), RangeError, "the game's own");
    assertEquals(seen, [], "and no payload is read off a call that did not finish");
    assertStrictEquals(wrap.getFailureCount(), 0, "nor is the game's failure counted as ours");
});

Deno.test("a second copy of the add-on stands down, as does a battle with nothing to wrap", () => {
    const held = composeHeld(1);
    wrapOn(held.battle, composeListener({}));
    const second = readBattleOn(held.battle).wrap(composeListener({}));
    assertEquals(second, err({ kind: ENGINE_FAILURE.anotherReader }), "the second stands down");
    const empty = readBattleOn({}).wrap(composeListener({}));
    assertEquals(empty, err({ kind: ENGINE_FAILURE.methodAbsent }), "and one with no method");
    const notMethod = readBattleOn({ updateData: 5 }).wrap(composeListener({}));
    assertEquals(notMethod, err({ kind: ENGINE_FAILURE.methodAbsent }), "or a value that is none");
});

/** By the marker's presence, whatever its value: any MargoMeter is a second count. */
Deno.test("another build's wrap is recognised by its marker alone", () => {
    const foreign = Object.assign(() => 1, { __margometerBattleWrap: 99 });
    const wrapped = readBattleOn({ updateData: foreign }).wrap(composeListener({}));
    assertEquals(wrapped, err({ kind: ENGINE_FAILURE.anotherReader }), "a second count refused");
    const unmarked = readBattleOn({ updateData: () => 1 }).wrap(composeListener({}));
    assert(unmarked.ok, "while a function carrying no marker is wrapped");
});

Deno.test("a detach puts back what was there, and only where ours is outermost", () => {
    const held = composeHeld(1);
    const original = held.battle.updateData;
    const wrap = wrapOn(held.battle, composeListener({}));
    assert(held.battle.updateData !== original, "the wrap stands where the engine's stood");
    assert(wrap.detach().ok, "the wrap comes off");
    assertStrictEquals(held.battle.updateData, original, "and puts back what it replaced");

    const second = composeHeld(1);
    const layered = wrapOn(second.battle, composeListener({}));
    const somebodyElse = () => 2;
    second.battle.updateData = somebodyElse;
    const refused = layered.detach();
    assertEquals(refused, err({ kind: ENGINE_FAILURE.detachForeignLayer }), "is refused");
    assertStrictEquals(second.battle.updateData, somebodyElse, "and leaves the layer where it is");
});

Deno.test("the page is asked for a game in both spellings, and a call may throw", () => {
    const battle = { updateData: () => 1 };
    assertEquals(readPageEngines({ Engine: { battle } }), [{ battle }], "the field");
    assertEquals(readPageEngines({ getEngine: () => ({ battle }) }), [{ battle }], "the call");
    assertEquals(readPageEngines(null), [], "and a page that is not one is asked nothing");
    const engine = initPageEngine({});
    assertEquals(engine.readBattle(), err({ kind: ENGINE_FAILURE.engineAbsent }), "no engine");
    const idle = initPageEngine({ Engine: { battle: null } });
    assertEquals(idle.readBattle(), err({ kind: ENGINE_FAILURE.battleAbsent }), "no battle");
    const tearing = initPageEngine({
        getEngine: () => {
            throw new RangeError("a page being torn down");
        },
    });
    const read = tearing.readBattle();
    assert(!read.ok, "a call that throws answers no battle");
    assertStrictEquals(read.error.kind, RESULT_FAILURE.foreignThrew, "and says it was theirs");
});

Deno.test("the warriors are read off the live battle, and a battle holding none says so", () => {
    const live = readBattleOn({
        updateData: () => 1,
        warriorsList: { 7: { id: 7, name: "Gracz 1", team: 1, hp: { cur: 5, max: 9 } } },
    });
    const read = live.readWarriors();
    assert(read.ok, "the warriors are read");
    assertEquals(read.value.map((one) => one.id), [7], "the one the fight holds");
    const empty = readBattleOn({ updateData: () => 1 }).readWarriors();
    assertEquals(empty, err({ kind: WARRIOR_FAILURE.warriorsAbsent }), "and none is a failure");
});

/**
 * The wrap's own bound on the failures it counts, restated here on purpose: a stated maximum
 * nothing reads is not a bound (`AGENTS.md` S11). Primitives are thrown, because a million errors
 * with a stack each take seconds, and two per call halve the calls.
 */
const WRAP_FAILURES_MAXIMUM = 1048576;

Deno.test("the failures a wrap counts stop at its bound, and not before", () => {
    const held = composeHeld(1);
    const wrap = wrapOn(
        held.battle,
        composeListener({
            onBeforeCall: () => {
                throw 0;
            },
            onPayload: () => {
                throw 1;
            },
        }),
    );
    const update = held.battle.updateData;
    assert(typeof update === "function", "the wrap left a function behind it");
    for (let call = 0; call < WRAP_FAILURES_MAXIMUM / 2 - 1; call += 1) update();
    assertStrictEquals(wrap.getFailureCount(), WRAP_FAILURES_MAXIMUM - 2, "short of the bound");
    update();
    assertStrictEquals(wrap.getFailureCount(), WRAP_FAILURES_MAXIMUM, "at it");
    update();
    assertStrictEquals(wrap.getFailureCount(), WRAP_FAILURES_MAXIMUM, "and never past it");
    assertStrictEquals(wrap.getFirstFailure()?.cause, 0, "with the first failure still the first");
});

Deno.test("the failure a wrap keeps is the first, whatever fails after it", () => {
    const held = composeHeld(1);
    let calls = 0;
    const wrap = wrapOn(
        held.battle,
        composeListener({
            onPayload: () => {
                calls += 1;
                if (calls === 1) throw new RangeError("the first");
                throw new TypeError("a later one");
            },
        }),
    );
    callUpdate(held.battle, null, [{}]);
    callUpdate(held.battle, null, [{}]);
    assert(wrap.getFirstFailure()?.cause instanceof RangeError, "the first is kept");
    assertStrictEquals(wrap.getFailureCount(), 2, "and both are counted");
});

Deno.test("a battle that throws as its warriors are read answers a failure of its own", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    Object.defineProperty(battle, "warriorsList", {
        get: () => {
            throw new RangeError("a battle being torn down");
        },
    });
    const read = readBattleOn(battle).readWarriors();
    assert(!read.ok, "the warriors are not read");
    assertStrictEquals(read.error.kind, RESULT_FAILURE.foreignThrew, "and it was theirs");
});
