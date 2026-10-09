/**
 * The promise the add-on makes to the page, in the one place it could be broken.
 *
 * The engine's own call runs first, its value comes back untouched, a failure of ours stays
 * inside, and a second copy of the add-on stands down rather than counting the fight twice
 * (`develop:tests/game/engine-battle-wrap.test.ts`).
 */

import {
    assert,
    assertEquals,
    assertFalse,
    assertInstanceOf,
    assertNotInstanceOf,
    assertStrictEquals,
    assertThrows,
} from "@std/assert";
import * as errors from "#/libs/errors.ts";
import {
    initMargonemEngineBattle,
    MargonemEngineAbsent,
    MargonemEngineAlreadyWrapped,
    type MargonemEngineBattle,
    MargonemEngineBattleAbsent,
    MargonemEngineMethodAbsent,
    MargonemEngineMethodUnwritable,
    type PayloadListener,
    readMargonemEngineAnswer,
    WrapCovered,
    type WrapHandle,
} from "#/src/ports/margonem-engine-battle.ts";
import {
    MargonemEngineWarriorCollectionAbsent,
    MargonemEngineWarriorsAbsent,
} from "#/src/ports/margonem-engine-warriors.ts";

interface Held {
    battle: Record<string, unknown>;
    calls: { thisArg: unknown; args: unknown[] }[];
}

/**
 * The wrap's own bound on the failures it counts, restated here on purpose: a stated maximum
 * nothing reads is not a bound (`AGENTS.md` S11). Two failures a call halve the calls. ⚠️ **A
 * primitive thrown saves no stack**: `attempt` wraps each in a `Caught` that captures one, and the
 * test runs four seconds on Deno 2.9.7 (2026-09-26).
 */
const WRAP_FAILURES_MAXIMUM = 1048576;

Deno.test("the engine's own call runs first, and its value comes back untouched", () => {
    const held = composeHeld("the engine's own answer");
    const seen: unknown[] = [];
    wrapOn(held.battle, composeListener({ onPayload: (payload) => void seen.push(payload) }));
    const self = { theMargonemEngineBattle: true };
    const answer = callUpdate(held.battle, self, [{ m: [] }, 2]);
    assertStrictEquals(answer, "the engine's own answer", "the value is the engine's");
    assertEquals(seen, [{ m: [] }], "and the payload reached us once, as the first argument");
    assertStrictEquals(held.calls.length, 1, "the engine was called once");
    assertStrictEquals(held.calls[0]?.thisArg, self, "on the object the game called it on");
    assertEquals(
        held.calls[0]?.args,
        [{ m: [] }, 2],
        "with every argument passed straight through",
    );
});

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

function wrapOn(battle: Record<string, unknown>, listener: PayloadListener): WrapHandle {
    const wrapped = readBattleOn(battle).wrap(listener);
    assertNotInstanceOf(wrapped, Error, "the wrap went on");
    return wrapped;
}

function readBattleOn(battle: Record<string, unknown>): MargonemEngineBattle {
    const engineBattle = initMargonemEngineBattle({ Engine: { battle } }).readBattle();
    assertNotInstanceOf(engineBattle, Error, "the page holds a battle");
    return engineBattle;
}

/** A listener that does nothing, so each test states only the half it is about. */
function composeListener(said: Partial<PayloadListener>): PayloadListener {
    return {
        onBeforeCall: said.onBeforeCall ?? (() => {}),
        onPayload: said.onPayload ?? (() => {}),
    };
}

function callUpdate(battle: Record<string, unknown>, thisArg: unknown, args: unknown[]): unknown {
    const update = battle.updateData;
    assert(typeof update === "function", "the battle holds a function to call");
    return Reflect.apply(update, thisArg, args);
}

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
    const firstFailure = wrap.getFirstFailure();
    assertInstanceOf(firstFailure, errors.Caught, "and the first one is kept");
    assert(firstFailure?.cause instanceof RangeError, "with what it threw");
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
    const wrap = wrapOn(
        battle,
        composeListener({ onPayload: (payload) => void seen.push(payload) }),
    );
    assertThrows(() => callUpdate(battle, null, [{}]), RangeError, "the game's own");
    assertEquals(seen, [], "and no payload is read off a call that did not finish");
    assertStrictEquals(wrap.getFailureCount(), 0, "nor is the game's failure counted as ours");
});

Deno.test("a second copy of the add-on stands down, as does a battle with nothing to wrap", () => {
    const held = composeHeld(1);
    wrapOn(held.battle, composeListener({}));
    const second = readBattleOn(held.battle).wrap(composeListener({}));
    assertInstanceOf(second, MargonemEngineAlreadyWrapped, "the second stands down");
    const empty = readBattleOn({}).wrap(composeListener({}));
    assertInstanceOf(empty, MargonemEngineMethodAbsent, "and one with no method");
    const notMethod = readBattleOn({ updateData: 5 }).wrap(composeListener({}));
    assertInstanceOf(notMethod, MargonemEngineMethodAbsent, "or a value that is none");
});

Deno.test("a method that will not hold the wrap is left the engine's own, and says so", () => {
    const held = composeHeld(1);
    const original = held.battle.updateData;
    const ignoring: Record<string, unknown> = {};
    Object.defineProperty(ignoring, "updateData", { get: () => original, set: () => {} });
    const ignored = readBattleOn(ignoring).wrap(composeListener({}));
    assertInstanceOf(ignored, MargonemEngineMethodUnwritable, "a write the page ignores");
    assertStrictEquals(ignoring.updateData, original, "leaves the engine's own standing");

    const stored: { method: unknown } = { method: original };
    const binding: Record<string, unknown> = {};
    Object.defineProperty(binding, "updateData", {
        get: () => {
            const method = stored.method;
            assert(typeof method === "function", "the page stores a method");
            return method.bind(binding);
        },
        set: (method: unknown) => void (stored.method = method),
    });
    const seen: unknown[] = [];
    const listener = composeListener({ onPayload: (payload) => void seen.push(payload) });
    const bound = readBattleOn(binding).wrap(listener);
    assertInstanceOf(bound, MargonemEngineMethodUnwritable, "a getter answering another function");
    // What goes back is what the getter answered, the engine's own bound to the battle.
    assertFalse(isMarked(stored.method), "has no wrap of ours left in it");
    const again = readBattleOn(binding).wrap(listener);
    assertInstanceOf(again, MargonemEngineMethodUnwritable, "and the next look is refused alike");
    assertFalse(isMarked(stored.method), "with no layer of ours left under it");
    callUpdate(binding, binding, [{ m: [] }]);
    assertStrictEquals(held.calls.length, 1, "so the engine is called once");
    assertEquals(seen, [], "and no copy of ours reads the payload");
});

function isMarked(method: unknown): boolean {
    assert(typeof method === "function", "a method is stored");
    return "__margometerBattleWrap" in method;
}

/**
 * ⚠️ **Deno runs these tests strict, and the bundle runs sloppy.** A write to a read-only property
 * throws in one and is silent in the other, and only a data property shows the difference: the
 * accessors above take the write in both, so they cannot tell a refusal answered from one thrown.
 */
Deno.test("a method the page made read-only, or guards with a throw, is refused alike", () => {
    const held = composeHeld(1);
    const original = held.battle.updateData;
    const frozen: Record<string, unknown> = {};
    Object.defineProperty(frozen, "updateData", { value: original, writable: false });
    const refused = readBattleOn(frozen).wrap(composeListener({}));
    assertInstanceOf(
        refused,
        MargonemEngineMethodUnwritable,
        "a read-only method refuses the wrap",
    );
    assertStrictEquals(refused.cause, null, "with nothing thrown");
    assertStrictEquals(frozen.updateData, original, "and the engine's own stands");

    const guarded: Record<string, unknown> = {};
    Object.defineProperty(guarded, "updateData", {
        get: () => original,
        set: () => {
            throw new TypeError("a page that will not be written to");
        },
    });
    const thrown = readBattleOn(guarded).wrap(composeListener({}));
    assertInstanceOf(thrown, MargonemEngineMethodUnwritable, "a setter that throws refuses it");
    assertInstanceOf(thrown.cause, errors.Caught, "and what it threw is the cause");
    assertInstanceOf(thrown.cause.cause, TypeError, "as the page threw it");
});

Deno.test("a detach the page will not let be written leaves ours standing, and says so", () => {
    const held = composeHeld(1);
    const wrap = wrapOn(held.battle, composeListener({}));
    const wrapper = held.battle.updateData;
    Object.defineProperty(held.battle, "updateData", { value: wrapper, writable: false });
    const refused = wrap.detach();
    assertInstanceOf(refused, MargonemEngineMethodUnwritable, "a read-only method refuses it");
    assertStrictEquals(refused.cause, null, "with nothing thrown");
    assertStrictEquals(held.battle.updateData, wrapper, "and ours is where it was");

    const second = composeHeld(1);
    const guardedWrap = wrapOn(second.battle, composeListener({}));
    const secondWrapper = second.battle.updateData;
    Object.defineProperty(second.battle, "updateData", {
        get: () => secondWrapper,
        set: () => {
            throw new TypeError("a page that will not be written to");
        },
    });
    const thrown = guardedWrap.detach();
    assertInstanceOf(thrown, MargonemEngineMethodUnwritable, "a setter that throws refuses it");
    assertInstanceOf(thrown.cause, errors.Caught, "and what it threw is the cause");
});

/** By the marker's presence, whatever its value: any MargoMeter is a second count. */
Deno.test("another build's wrap is recognised by its marker alone", () => {
    const foreign = Object.assign(() => 1, { __margometerBattleWrap: 99 });
    const wrapped = readBattleOn({ updateData: foreign }).wrap(composeListener({}));
    assertInstanceOf(wrapped, MargonemEngineAlreadyWrapped, "a second count refused");
    const unmarked = readBattleOn({ updateData: () => 1 }).wrap(composeListener({}));
    assertNotInstanceOf(unmarked, Error, "while a function carrying no marker is wrapped");
});

Deno.test("a detach puts back what was there, and only where ours is outermost", () => {
    const held = composeHeld(1);
    const original = held.battle.updateData;
    const wrap = wrapOn(held.battle, composeListener({}));
    assert(held.battle.updateData !== original, "the wrap stands where the engine's stood");
    assertStrictEquals(wrap.detach(), undefined, "the wrap comes off");
    assertStrictEquals(held.battle.updateData, original, "and puts back what it replaced");

    const second = composeHeld(1);
    const layered = wrapOn(second.battle, composeListener({}));
    const somebodyElse = () => 2;
    second.battle.updateData = somebodyElse;
    const refused = layered.detach();
    assertInstanceOf(refused, WrapCovered, "is refused");
    assertStrictEquals(second.battle.updateData, somebodyElse, "and leaves the layer where it is");
});

Deno.test("the page is asked for a game in both spellings, and a call may throw", () => {
    const battle = { updateData: () => 1 };
    const readBattle = (engine: Record<string, unknown>) => engine.battle ?? null;
    assertEquals(
        readMargonemEngineAnswer({ Engine: { battle } }, readBattle),
        { answer: battle, hasEngine: true },
        "the field",
    );
    assertEquals(
        readMargonemEngineAnswer({ getEngine: () => ({ battle }) }, readBattle),
        { answer: battle, hasEngine: true },
        "the call",
    );
    assertEquals(
        readMargonemEngineAnswer(null, readBattle),
        { answer: null, hasEngine: false },
        "and a page that is not one is asked nothing",
    );
    const engine = initMargonemEngineBattle({});
    assertInstanceOf(engine.readBattle(), MargonemEngineAbsent, "no engine");
    const idle = initMargonemEngineBattle({ Engine: { battle: null } });
    assertInstanceOf(idle.readBattle(), MargonemEngineBattleAbsent, "no battle");
    const tearing = initMargonemEngineBattle({
        getEngine: () => {
            throw new RangeError("a page being torn down");
        },
    });
    const answer = tearing.readBattle();
    assertInstanceOf(answer, Error, "a call that throws answers no battle");
    assertInstanceOf(answer, errors.Caught, "and says it was theirs");
    const guarded = initMargonemEngineBattle({
        Engine: {
            get battle() {
                throw new RangeError("a battle being torn down");
            },
        },
    });
    assertInstanceOf(guarded.readBattle(), errors.Caught, "nor does a battle that throws read");
});

/**
 * ⚠️ **A call that throws never costs what the field already said.** Asked together, a page whose
 * `getEngine` throws mid-teardown would answer no battle on every look, with `Engine.battle`
 * standing in plain sight; and a field that answers is never followed by a call into the page.
 */
Deno.test("the page's call is asked only where the field holds no answer", () => {
    let calls = 0;
    const page = {
        Engine: { battle: { updateData: () => 1 } },
        getEngine: () => {
            calls += 1;
            throw new RangeError("a client not yet standing");
        },
    };
    assertNotInstanceOf(initMargonemEngineBattle(page).readBattle(), Error, "the field's battle");
    assertStrictEquals(calls, 0, "and the page was not called into");
    const fieldThrowing = {
        get Engine(): unknown {
            throw new RangeError("a field being torn down");
        },
        getEngine: () => ({ battle: { updateData: () => 1 } }),
    };
    assertNotInstanceOf(
        initMargonemEngineBattle(fieldThrowing).readBattle(),
        Error,
        "and a field that throws leaves the call to answer",
    );
});

Deno.test("an engine the field found with no battle is what was said, whatever the call threw", () => {
    const page = {
        Engine: { battle: null },
        getEngine: () => {
            throw new RangeError("a client being torn down");
        },
    };
    assertInstanceOf(
        initMargonemEngineBattle(page).readBattle(),
        MargonemEngineBattleAbsent,
        "an engine with no battle, not the call's throw",
    );
});

Deno.test("a method whose getter throws is one the wrap cannot go on, said and not thrown", () => {
    const battle = {
        get updateData(): unknown {
            throw new RangeError("a method being torn down");
        },
    };
    const wrapped = readBattleOn(battle).wrap(composeListener({}));
    assertInstanceOf(wrapped, MargonemEngineMethodUnwritable, "the wrap answers a failure");
    assertInstanceOf(wrapped.cause, errors.Caught, "carrying what the page threw");
});

Deno.test("the warriors are read off the live battle, and a battle holding none says so", () => {
    const live = readBattleOn({
        updateData: () => 1,
        warriorsList: { 7: { id: 7, name: "Gracz 1", team: 1, hp: { cur: 5, max: 9 } } },
    });
    const warriors = live.readWarriors();
    assertNotInstanceOf(warriors, Error, "the warriors are read");
    assertEquals(warriors.map((warrior) => warrior.id), [7], "the one the fight holds");
    const empty = readBattleOn({ updateData: () => 1, warriorsList: {} }).readWarriors();
    assertInstanceOf(empty, MargonemEngineWarriorsAbsent, "and none is a failure");
    const unheld = readBattleOn({ updateData: () => 1 }).readWarriors();
    assertInstanceOf(unheld, MargonemEngineWarriorCollectionAbsent, "and no collection another");
});

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
    const answer = readBattleOn(battle).readWarriors();
    assertInstanceOf(answer, Error, "the warriors are not read");
    assertInstanceOf(answer, errors.Caught, "and it was theirs");
});
