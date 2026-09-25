/**
 * The fight going on, read through the engine's own call: a fake page whose battle is wrapped the
 * add-on's way, and a recording played into it call by call.
 *
 * The seam is the point: the envelope, the capture, the session and the shelf are each proved on
 * their own; only a fight run through the listener shows that it hands each what it was tested on.
 */

import { assert, assertEquals, assertExists, assertStrictEquals } from "@std/assert";
import { err, ok } from "#/libs/result.ts";
import { getFightView, SESSION_OPTIONS } from "#/src/core/fight-session.ts";
import { initMemoryStore, initPageStore, type KeyValueStore } from "#/src/game/browser-store.ts";
import { initPageEngine } from "#/src/game/engine-battle.ts";
import type { PlacePort } from "#/src/game/engine-place.ts";
import { NO_CAPTURE, prepareCapture } from "#/src/game/fight-capture.ts";
import type { BuildPort } from "#/src/game/game-build.ts";
import { PAGE_READ_FAILURE, PAGE_READING } from "#/src/game/page-reading.ts";
import { readPayloadEnvelope } from "#/src/game/payload-envelope.ts";
import type { WarriorSnapshot } from "#/src/game/warrior-snapshot.ts";
import { DEFECT_KIND, initDefectLedger } from "#/src/runtime/defect-ledger.ts";
import { initLiveFight, type LiveFightOptions } from "#/src/runtime/live-fight.ts";
import { initShelfKeeper } from "#/src/runtime/shelf-keeper.ts";
import { STORAGE_CHOICE } from "#/src/ui/panel-choice.ts";
import { BLOWS_GRANTED } from "#/tests/frozen-tables.ts";
import {
    readRecordedFights,
    type RecordedFight,
    replayRecordedFight,
} from "#/tests/recorded-fights.ts";

const PLACE = { mapName: "Mapa", x: 12, y: 34 };
const OPENED_AT = 1000;

interface FakeGame {
    page: { Engine: { battle: Record<string, unknown> } };
    /** The warriors the engine's own call leaves behind it, one list per call. */
    after: readonly WarriorSnapshot[];
}

/** A battle whose own call moves its warriors to what the recording says it left. */
function composeGame(after: readonly WarriorSnapshot[]): FakeGame {
    const battle: Record<string, unknown> = { warriorsList: {} };
    let call = 0;
    battle.updateData = () => {
        const next = after[call] ?? [];
        battle.warriorsList = Object.fromEntries(next.map((one, at) => [String(at), one]));
        call += 1;
        return call;
    };
    return { page: { Engine: { battle } }, after };
}

/** A clock standing at one moment, which is the moment every fight here opens at. */
const STILL_CLOCK = {
    readNowMilliseconds: () => OPENED_AT,
    readMoment: () => null,
    readTimestampText: () => ok("2026-09-25T10:00:00.000Z"),
};

function composeOptions(
    game: FakeGame,
    overrides: Partial<LiveFightOptions> = {},
    shelfStore: KeyValueStore = initMemoryStore(),
) {
    const lines: string[] = [];
    const stale = { count: 0 };
    const opened = { count: 0 };
    const place: PlacePort = { readPlace: () => ok(PLACE) };
    const build: BuildPort = { readBuildId: () => ok("Bb28FQty") };
    const defects = initDefectLedger({ writeBrandedLine: (kind) => lines.push(kind) });
    const keeper = initShelfKeeper({
        settings: initMemoryStore(),
        initShelfStore: () => shelfStore,
        choice: STORAGE_CHOICE.local,
        tables: BLOWS_GRANTED,
        sessionOptions: SESSION_OPTIONS,
        defects,
    });
    const options: LiveFightOptions = {
        engine: initPageEngine(game.page),
        clock: STILL_CLOCK,
        place,
        build,
        tables: BLOWS_GRANTED,
        sessionOptions: SESSION_OPTIONS,
        defects,
        keepFight: (fight) => keeper.keep(fight),
        onFightOpened: () => {
            opened.count += 1;
        },
        markStale: () => {
            stale.count += 1;
        },
        ...overrides,
    };
    return { options, lines, stale, keeper, opened };
}

function playInto(game: FakeGame, options: LiveFightOptions, payloads: readonly unknown[]) {
    const { live, listener } = initLiveFight(options);
    const battle = options.engine.readBattle();
    assert(battle.ok, "the fake page holds a battle");
    const wrapped = battle.value.wrap(listener);
    assert(wrapped.ok, "and the listener is wrapped onto it");
    const updateData = game.page.Engine.battle.updateData;
    assert(typeof updateData === "function", "the wrap stands where the engine's call stood");
    for (const payload of payloads) Reflect.apply(updateData, game.page.Engine.battle, [payload]);
    return { live, wrapped: wrapped.value };
}

/** The recording's own snapshots after each call, which the fake engine moves its warriors to. */
function readRecordedAfter(fight: RecordedFight): WarriorSnapshot[] {
    const text = new Deno.Command("git", {
        args: ["show", `fa1dcce:${fight.path}`],
        stdout: "piped",
    }).outputSync().stdout;
    const document = JSON.parse(new TextDecoder().decode(text));
    return document.calls.map((call: { combatantsAfter?: WarriorSnapshot | null }) =>
        call.combatantsAfter ?? []
    );
}

Deno.test("every recording played through the wrap is the fight, the file and the shelf", () => {
    let fights = 0;
    for (const fight of readRecordedFights()) {
        const after = readRecordedAfter(fight);
        const game = composeGame(after);
        const { options, lines, stale, keeper, opened } = composeOptions(game);
        const { live } = playInto(game, options, fight.updates);
        const view = getFightView(live.session);
        const expected = getFightView(replayRecordedFight(fight));
        assertEquals(view, expected, `${fight.path}: the session is the fight`);
        let capture = NO_CAPTURE;
        // The fight is kept on the call that ends it, so the shelf holds the calls up to that one.
        let keptCalls: unknown[] | null = null;
        fight.updates.forEach((payload, at) => {
            const record = readPayloadEnvelope(payload);
            assert(record.ok, `${fight.path}: a recorded call reads`);
            const combatantsBefore = at === 0 ? [] : after[at - 1] ?? [];
            const call = { payload, messages: record.value.messages, combatantsBefore };
            capture = prepareCapture(
                capture,
                { ...call, combatantsAfter: after[at] ?? [] },
                record.value.isInit,
            );
            if (record.value.isEnd) keptCalls ??= capture.calls.map((one) => one.payload);
        });
        assertEquals(live.capture, capture, `${fight.path}: the file holds what was captured`);
        assertStrictEquals(keeper.getFights().length, 1, `${fight.path}: the fight is kept once`);
        const kept = keeper.getFights()[0];
        assertExists(kept, `${fight.path}: and stands on the shelf`);
        assertEquals(kept.payloads, keptCalls, `${fight.path}: its calls, up to the end`);
        assertEquals([kept.openedAt, kept.place, kept.gameBuild], [OPENED_AT, PLACE, "Bb28FQty"]);
        assertEquals(lines, [], `${fight.path}: and nothing went wrong on the way`);
        assertStrictEquals(stale.count, fight.updates.length, "each call asks for a frame");
        assertStrictEquals(opened.count, 1, `${fight.path}: and the fight opened once`);
        fights += 1;
    }
    assert(fights > 0, "the recordings were there to play");
});

Deno.test("a call the envelope refuses is a defect, and the file still keeps the call", () => {
    const game = composeGame([[], []]);
    const { options, lines } = composeOptions(game);
    const { live } = playInto(game, options, [{ init: 1, m: ["0;0;txt=a"] }, { m: "not a list" }]);
    assertEquals(lines, [DEFECT_KIND.reading], "the refusal is a reading defect, said once");
    assertStrictEquals(getFightView(live.session)?.payloadsApplied, 1, "the fight read on");
    assertStrictEquals(live.capture.calls.length, 2, "and the file lost neither call");
});

Deno.test("a fight is kept once, whatever arrives after its end", () => {
    const game = composeGame([[], [], []]);
    const { options, keeper } = composeOptions(game);
    const end = { endBattle: 1, m: ["0;0;winner=Gracz 1"] };
    playInto(game, options, [{ init: 1 }, end, { m: ["0;0;txt=a"] }]);
    assertStrictEquals(keeper.getFights().length, 1, "one fight, one row");
    assert(!keeper.getAnswers().hasStoreRefused, "and the shelf said it was written");
});

Deno.test("a shelf the store refuses is the shelf's answer, and the fight still reads", () => {
    const game = composeGame([[], []]);
    const refusing: KeyValueStore = initPageStore({
        getItem: () => null,
        setItem: () => {
            throw new Error("a browser out of room");
        },
        removeItem: () => {},
    });
    const { options, lines, keeper } = composeOptions(game, {}, refusing);
    const { live } = playInto(game, options, [{ init: 1 }, { endBattle: 1 }]);
    assert(keeper.getAnswers().hasStoreRefused, "the answer is the store's");
    assertEquals(lines, [], "which is an answer and not a defect");
    assert(getFightView(live.session)?.isOver === true, "and the fight is over all the same");
});

Deno.test("a place the page does not state is unknown, and one it throws on is a defect", () => {
    const absent: PlacePort = {
        readPlace: () => err({ kind: PAGE_READ_FAILURE.absent, reading: PAGE_READING.place }),
    };
    const quiet = composeGame([[]]);
    const unknown = composeOptions(quiet, { place: absent });
    assertStrictEquals(playInto(quiet, unknown.options, [{ init: 1 }]).live.place, null, "none");
    assertEquals(unknown.lines, [], "and no defect");
    const thrown: PlacePort = { readPlace: () => err({ kind: "foreign-threw", cause: "torn" }) };
    const loud = composeGame([[]]);
    const failed = composeOptions(loud, { place: thrown });
    playInto(loud, failed.options, [{ init: 1 }]);
    assertEquals(failed.lines, [DEFECT_KIND.reading], "a page that threw leaves a mark");
});

Deno.test("a step of ours that breaks costs that step, and the call goes on", () => {
    const game = composeGame([[]]);
    const { options, lines } = composeOptions(game, {
        markStale: () => {
            throw new Error("a frame nobody can ask for");
        },
    });
    const { live, wrapped } = playInto(game, options, [{ init: 1, m: ["0;0;txt=a"] }]);
    assertEquals(lines, [DEFECT_KIND.reading], "the broken step is a defect");
    assertStrictEquals(getFightView(live.session)?.events.length, 1, "and the reading stands");
    assertStrictEquals(wrapped.getFailureCount(), 0, "and nothing escaped to the wrap");
});

Deno.test("a second fight opening on the same listener starts its file and its row anew", () => {
    const game = composeGame([[], [], [], []]);
    const { options, keeper, opened } = composeOptions(game);
    const end = { endBattle: 1, m: ["0;0;winner=Gracz 1"] };
    const { live } = playInto(game, options, [{ init: 1 }, end, { init: 1, m: ["0;0;txt=b"] }]);
    assertStrictEquals(live.capture.calls.length, 1, "the file holds the fight that opened");
    assertStrictEquals(getFightView(live.session)?.payloadsApplied, 1, "and so does the session");
    assertStrictEquals(keeper.getFights().length, 1, "while the first stays on the shelf");
    assertStrictEquals(opened.count, 2, "and each opening was said");
});

Deno.test("a payload past a bound the session states is a defect, and the fight stands", () => {
    const game = composeGame([[], []]);
    const sessionOptions = { ...SESSION_OPTIONS, payloadsMaximum: 1 };
    const { options, lines } = composeOptions(game, { sessionOptions });
    const { live } = playInto(game, options, [{ init: 1 }, { m: ["0;0;txt=a"] }]);
    assertEquals(lines, [DEFECT_KIND.reading], "the refusal is a reading defect");
    assertStrictEquals(getFightView(live.session)?.payloadsApplied, 1, "on the fight that stood");
});
