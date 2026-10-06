/**
 * The fight going on, read through the engine's own call: a fake page whose battle is wrapped the
 * add-on's way, and a recording played into it call by call.
 *
 * The seam is the point: the envelope, the capture, the session and the shelf are each proved on
 * their own; only a fight run through the listener shows that it hands each what it was tested on.
 */

import { assert, assertEquals, assertExists, assertStrictEquals } from "@std/assert";
import * as errors from "#/libs/errors.ts";
import { CombatantsExceeded, composeFightView, SESSION_OPTIONS } from "#/src/core/fight-session.ts";
import {
    initBrowserStore,
    initMemoryStore,
    type KeyValueStore,
} from "#/src/ports/browser-store.ts";
import { initMargonemEngineBattle } from "#/src/ports/margonem-engine-battle.ts";
import type { MargonemEngineHeroPort } from "#/src/ports/margonem-engine-hero.ts";
import type { MargonemEnginePlacePort } from "#/src/ports/margonem-engine-place.ts";
import { commitCapture, createFightCapture, prepareCapture } from "#/src/ports/fight-capture.ts";
import type { MargonemClientBuildPort } from "#/src/ports/margonem-client-build.ts";
import { MARGONEM_VALUE, MargonemValueAbsent } from "#/src/ports/margonem-value.ts";
import { readPayloadEnvelope } from "#/src/ports/payload-envelope.ts";
import type { MargonemEngineWarriorSnapshot } from "#/src/ports/margonem-engine-warriors.ts";
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

interface FakeMargonem {
    page: { Engine: { battle: Record<string, unknown> } };
    /** The warriors the engine's own call leaves behind it, one list per call. */
    after: readonly MargonemEngineWarriorSnapshot[];
}

const PLACE = { mapName: "Mapa", x: 12, y: 34 };
/** The hero's id the page states, which the fight keeps beside its place. */
const READER_ID = 7;
const OPENED_AT = 1000;

/** A clock standing at one moment, which is the moment every fight here opens at. */
const STILL_CLOCK = {
    readNowMilliseconds: () => OPENED_AT,
    readMoment: () => null,
    readTimestampText: () => "2026-09-25T10:00:00.000Z",
};

Deno.test("every recording played through the wrap is the fight, the file and the shelf", () => {
    let fights = 0;
    for (const fight of readRecordedFights()) {
        const after = readRecordedAfter(fight);
        const margonem = composeMargonem(after);
        const { options, lines, stale, keeper, opened } = composeOptions(margonem);
        const { live } = playInto(margonem, options, fight.updates);
        const view = composeFightView(live.session);
        const expected = composeFightView(replayRecordedFight(fight));
        assertEquals(view, expected, `${fight.path}: the session is the fight`);
        const capture = createFightCapture();
        // The fight is kept on the call that ends it, so the shelf holds the calls up to that one.
        let keptCalls: unknown[] | null = null;
        fight.updates.forEach((payload, callIndex) => {
            const record = readPayloadEnvelope(payload);
            assert(!(record instanceof Error), `${fight.path}: a recorded call reads`);
            const combatantsBefore = callIndex === 0 ? [] : after[callIndex - 1] ?? [];
            const call = { payload, messages: record.messages, combatantsBefore };
            const prepared = prepareCapture(
                capture,
                { ...call, combatantsAfter: after[callIndex] ?? [] },
                record.isInit,
            );
            commitCapture(capture, prepared);
            if (record.isEnd) keptCalls ??= capture.calls.map((keptCall) => keptCall.payload);
        });
        assertEquals(live.capture, capture, `${fight.path}: the file holds what was captured`);
        assertStrictEquals(keeper.getFights().length, 1, `${fight.path}: the fight is kept once`);
        const kept = keeper.getFights()[0];
        assertExists(kept, `${fight.path}: and stands on the shelf`);
        assertEquals(kept.payloads, keptCalls, `${fight.path}: its calls, up to the end`);
        assertEquals(
            [kept.openedAt, kept.place, kept.readerId, kept.margonemClientBuild],
            [OPENED_AT, PLACE, READER_ID, "Bb28FQty"],
        );
        assertEquals(lines, [], `${fight.path}: and nothing went wrong on the way`);
        assertStrictEquals(stale.count, fight.updates.length, "each call asks for a frame");
        assertStrictEquals(opened.count, 1, `${fight.path}: and the fight opened once`);
        fights += 1;
    }
    assert(fights > 0, "the recordings were there to play");
});

/** The recording's own snapshots after each call, which the fake engine moves its warriors to. */
function readRecordedAfter(fight: RecordedFight): MargonemEngineWarriorSnapshot[] {
    const document = JSON.parse(Deno.readTextFileSync(fight.path));
    return document.calls.map((call: { combatantsAfter?: MargonemEngineWarriorSnapshot | null }) =>
        call.combatantsAfter ?? []
    );
}

/** A battle whose own call moves its warriors to what the recording says it left. */
function composeMargonem(after: readonly MargonemEngineWarriorSnapshot[]): FakeMargonem {
    const battle: Record<string, unknown> = { warriorsList: {} };
    let call = 0;
    battle.updateData = () => {
        const snapshot = after[call] ?? [];
        battle.warriorsList = Object.fromEntries(
            snapshot.map((warrior, index) => [String(index), warrior]),
        );
        call += 1;
        return call;
    };
    return { page: { Engine: { battle } }, after };
}

function composeOptions(
    margonem: FakeMargonem,
    overrides: Partial<LiveFightOptions> = {},
    shelfStore: KeyValueStore = initMemoryStore(),
) {
    const lines: string[] = [];
    const stale = { count: 0 };
    const opened = { count: 0 };
    const kept = { count: 0 };
    const place: MargonemEnginePlacePort = { readPlace: () => PLACE };
    const hero: MargonemEngineHeroPort = { readHeroId: () => READER_ID };
    const build: MargonemClientBuildPort = { readBuildId: () => "Bb28FQty" };
    const defects = initDefectLedger({ console: { writeBrandedLine: (kind) => lines.push(kind) } });
    const keeper = initShelfKeeper({
        settings: initMemoryStore(),
        initShelfStore: () => shelfStore,
        choice: STORAGE_CHOICE.local,
        tables: BLOWS_GRANTED,
        sessionOptions: SESSION_OPTIONS,
        defects,
    });
    const options: LiveFightOptions = {
        battle: initMargonemEngineBattle(margonem.page),
        clock: STILL_CLOCK,
        place,
        hero,
        build,
        tables: BLOWS_GRANTED,
        sessionOptions: SESSION_OPTIONS,
        defects,
        keeper,
        onFightOpened: () => {
            opened.count += 1;
        },
        onFightKept: () => {
            kept.count += 1;
        },
        markStale: () => {
            stale.count += 1;
        },
        ...overrides,
    };
    return { options, lines, stale, keeper, opened, kept, defects };
}

function playInto(margonem: FakeMargonem, options: LiveFightOptions, payloads: readonly unknown[]) {
    const { live, listener } = initLiveFight(options);
    const battle = options.battle.readBattle();
    assert(!(battle instanceof Error), "the fake page holds a battle");
    const wrapped = battle.wrap(listener);
    assert(!(wrapped instanceof Error), "and the listener is wrapped onto it");
    const updateData = margonem.page.Engine.battle.updateData;
    assert(typeof updateData === "function", "the wrap stands where the engine's call stood");
    for (const payload of payloads) {
        Reflect.apply(updateData, margonem.page.Engine.battle, [payload]);
    }
    return { live, wrapped };
}

Deno.test("a call the envelope refuses is a defect, and the file still keeps the call", () => {
    const margonem = composeMargonem([[], []]);
    const { options, lines } = composeOptions(margonem);
    const { live } = playInto(margonem, options, [{ init: 1, m: ["0;0;txt=a"] }, {
        m: "not a list",
    }]);
    assertEquals(lines, [DEFECT_KIND.reading], "the refusal is a reading defect, said once");
    assertStrictEquals(composeFightView(live.session)?.payloadsApplied, 1, "the fight read on");
    assertStrictEquals(live.capture.calls.length, 2, "and the file lost neither call");
});

Deno.test("a fight is kept once, whatever arrives after its end", () => {
    const margonem = composeMargonem([[], [], []]);
    const { options, keeper } = composeOptions(margonem);
    const end = { endBattle: 1, m: ["0;0;winner=Gracz 1"] };
    playInto(margonem, options, [{ init: 1 }, end, { m: ["0;0;txt=a"] }]);
    assertStrictEquals(keeper.getFights().length, 1, "one fight, one row");
    assert(!keeper.getAnswers().hasStoreRefused, "and the shelf said it was written");
});

Deno.test("a shelf the store refuses is the shelf's answer, and the fight still reads", () => {
    const margonem = composeMargonem([[], []]);
    const refusing: KeyValueStore = initBrowserStore({
        getItem: () => null,
        setItem: () => {
            throw new Error("a browser out of room");
        },
        removeItem: () => {},
    });
    const { options, lines, keeper } = composeOptions(margonem, {}, refusing);
    const { live } = playInto(margonem, options, [{ init: 1 }, { endBattle: 1 }]);
    assert(keeper.getAnswers().hasStoreRefused, "the answer is the store's");
    assertEquals(lines, [], "which is an answer and not a defect");
    assertStrictEquals(
        composeFightView(live.session)?.isOver,
        true,
        "and the fight is over all the same",
    );
});

Deno.test("a place the page does not state is unknown, and so is one it throws on", () => {
    const absent: MargonemEnginePlacePort = {
        readPlace: () => new MargonemValueAbsent(MARGONEM_VALUE.place),
    };
    const quiet = composeMargonem([[]]);
    const unknown = composeOptions(quiet, { place: absent });
    assertStrictEquals(playInto(quiet, unknown.options, [{ init: 1 }]).live.place, null, "none");
    assertEquals(unknown.lines, [], "and no defect");
    const thrown: MargonemEnginePlacePort = { readPlace: () => new errors.Caught("torn") };
    const loud = composeMargonem([[]]);
    const failed = composeOptions(loud, { place: thrown });
    const torn = playInto(loud, failed.options, [{ init: 1 }]).live.place;
    assertStrictEquals(torn, null, "a page that threw states no place");
    assertEquals(failed.lines, [], "and no defect: the place stands as unknown");
});

Deno.test("a hero the page does not state is nobody, and so is one it throws on", () => {
    const absent: MargonemEngineHeroPort = {
        readHeroId: () => new MargonemValueAbsent(MARGONEM_VALUE.hero),
    };
    const quiet = composeMargonem([[], []]);
    const unknown = composeOptions(quiet, { hero: absent });
    const { live } = playInto(quiet, unknown.options, [{ init: 1 }, { endBattle: 1 }]);
    assertStrictEquals(live.readerId, null, "none");
    assertStrictEquals(unknown.keeper.getFights()[0]?.readerId, null, "and none is kept");
    assertEquals(unknown.lines, [], "and no defect");
    const thrown: MargonemEngineHeroPort = { readHeroId: () => new errors.Caught("torn") };
    const loud = composeMargonem([[]]);
    const failed = composeOptions(loud, { hero: thrown });
    const torn = playInto(loud, failed.options, [{ init: 1 }]).live.readerId;
    assertStrictEquals(torn, null, "a page that threw states no reader");
    assertEquals(failed.lines, [], "and no defect: the reader stands as unknown");
});

Deno.test("a second fight is asked who the reader is, not told who they were", () => {
    const margonem = composeMargonem([[], [], []]);
    let asked = 0;
    const hero: MargonemEngineHeroPort = {
        readHeroId: () => {
            asked += 1;
            return asked;
        },
    };
    const { options } = composeOptions(margonem, { hero });
    const end = { endBattle: 1, m: ["0;0;winner=Gracz 1"] };
    const { live } = playInto(margonem, options, [{ init: 1 }, end, { init: 1 }]);
    assertStrictEquals(asked, 2, "once as each fight opens, and never on a call inside one");
    assertStrictEquals(live.readerId, 2, "the second fight's own answer");
});

Deno.test("a step of ours that breaks costs that step, and the call goes on", () => {
    const margonem = composeMargonem([[]]);
    const { options, lines } = composeOptions(margonem, {
        markStale: () => {
            throw new Error("a frame nobody can ask for");
        },
    });
    const { live, wrapped } = playInto(margonem, options, [{ init: 1, m: ["0;0;txt=a"] }]);
    assertEquals(lines, [DEFECT_KIND.reading], "the broken step is a defect");
    assertStrictEquals(composeFightView(live.session)?.events.length, 1, "and the reading stands");
    assertStrictEquals(wrapped.getFailureCount(), 0, "and nothing escaped to the wrap");
});

Deno.test("a second fight opening on the same listener starts its file and its row anew", () => {
    const margonem = composeMargonem([[], [], [], []]);
    const { options, keeper, opened } = composeOptions(margonem);
    const end = { endBattle: 1, m: ["0;0;winner=Gracz 1"] };
    const { live } = playInto(margonem, options, [{ init: 1 }, end, { init: 1, m: ["0;0;txt=b"] }]);
    assertStrictEquals(live.capture.calls.length, 1, "the file holds the fight that opened");
    assertStrictEquals(
        composeFightView(live.session)?.payloadsApplied,
        1,
        "and so does the session",
    );
    assertStrictEquals(keeper.getFights().length, 1, "while the first stays on the shelf");
    assertStrictEquals(opened.count, 2, "and each opening was said");
});

/** `docs/design.md` §7: the opening is read on its own, whatever else the envelope refuses. */
Deno.test("an opening the envelope refuses still ends the fight before it", () => {
    const margonem = composeMargonem([[], [], [], []]);
    const { options, keeper, lines } = composeOptions(margonem);
    const end = { endBattle: 1, m: ["0;0;winner=Gracz 1"] };
    const refused = { init: 1, m: "not a list" };
    const { live } = playInto(margonem, options, [{ init: 1 }, end, refused, { m: ["0;0;txt=b"] }]);
    assertEquals(lines, [DEFECT_KIND.reading], "the refusal is a reading defect");
    assertStrictEquals(live.capture.calls.length, 2, "the file starts at the refused opening");
    const view = composeFightView(live.session);
    assertStrictEquals(view?.payloadsApplied, 1, "the session holds the new fight alone");
    assertStrictEquals(view?.events.length, 1, "with its own events and none of the old");
    assertStrictEquals(keeper.getFights().length, 1, "while the fight that ended stays kept");
});

Deno.test("a payload past a bound the session states is a defect, and the fight stands", () => {
    const margonem = composeMargonem([[], []]);
    const sessionOptions = { ...SESSION_OPTIONS, payloadsMaximum: 1 };
    const { options, lines } = composeOptions(margonem, { sessionOptions });
    const { live } = playInto(margonem, options, [{ init: 1 }, { m: ["0;0;txt=a"] }]);
    assertEquals(lines, [DEFECT_KIND.reading], "the refusal is a reading defect");
    assertStrictEquals(
        composeFightView(live.session)?.payloadsApplied,
        1,
        "on the fight that stood",
    );
});

Deno.test("a fight the clock gives no moment is kept under none, and that is said", () => {
    const margonem = composeMargonem([[], []]);
    const refusing = { ...STILL_CLOCK, readNowMilliseconds: () => new errors.Caught("no clock") };
    const { options, lines, keeper, kept } = composeOptions(margonem, { clock: refusing });
    const { live } = playInto(margonem, options, [{ init: 1 }, { endBattle: 1 }]);
    assertStrictEquals(live.openedAt, null, "the fight opened at no moment anybody stated");
    assertEquals(keeper.getFights(), [], "so no row stands for it, at nought or anywhere else");
    assertEquals(lines, [DEFECT_KIND.keeping], "and the panel says it kept nothing");
    assertStrictEquals(kept.count, 1, "while the shelf's answer is still handed on");
});

Deno.test("a second fight whose opening breaks takes nothing of the first's", () => {
    const margonem = composeMargonem([[], [], [], []]);
    let moments = 0;
    const clock = {
        ...STILL_CLOCK,
        readNowMilliseconds: () => {
            moments += 1;
            return moments === 1 ? OPENED_AT : new errors.Caught("a clock gone");
        },
    };
    let places = 0;
    const place: MargonemEnginePlacePort = {
        readPlace: () => {
            places += 1;
            if (places === 1) return PLACE;
            throw new Error("a place that breaks our step");
        },
    };
    const { options, lines, keeper, kept } = composeOptions(margonem, { clock, place });
    const end = { endBattle: 1, m: ["0;0;winner=Gracz 1"] };
    const { live } = playInto(margonem, options, [{ init: 1 }, end, { init: 1 }, end]);
    assertEquals(
        [live.openedAt, live.place, live.readerId],
        [null, null, null],
        "no moment, no place and no reader carried over from the fight before",
    );
    assertEquals(keeper.getFights().map((fight) => fight.openedAt), [OPENED_AT], "one row");
    assertEquals(lines, [DEFECT_KIND.reading, DEFECT_KIND.keeping], "the break, and no keeping");
    assertStrictEquals(kept.count, 2, "each close handed on the shelf's answer");
});

/** A gap mid-fight replays to figures that look right, so the fight is read on and kept nowhere. */
Deno.test("a fight read past a payload the envelope refused is not kept, said once at close", () => {
    const margonem = composeMargonem([[], [], []]);
    const { options, lines, keeper, kept, defects } = composeOptions(margonem);
    const refused = { m: "not a list" };
    const end = { endBattle: 1, m: ["0;0;winner=Gracz 1"] };
    const { live } = playInto(margonem, options, [{ init: 1, m: ["0;0;txt=a"] }, refused, end]);
    assertStrictEquals(
        composeFightView(live.session)?.isOver,
        true,
        "the fight read on to its end",
    );
    assertEquals(keeper.getFights(), [], "and was put on no shelf");
    assertEquals(lines, [DEFECT_KIND.reading, DEFECT_KIND.keeping], "the gap, then no keeping");
    const keeping = defects.getCounts().find((row) => row.kind === DEFECT_KIND.keeping);
    const reading = defects.getCounts().find((row) => row.kind === DEFECT_KIND.reading);
    assertStrictEquals(keeping?.count, 1, "said once");
    assertStrictEquals(keeping?.first, reading?.first, "carrying the refusal that made the gap");
    assertStrictEquals(kept.count, 1, "while the close is still handed on");
});

Deno.test("a fight read past a payload the session refused is not kept either", () => {
    const margonem = composeMargonem([[], [], []]);
    const sessionOptions = { ...SESSION_OPTIONS, combatantsMaximum: 1 };
    const { options, keeper, defects } = composeOptions(margonem, { sessionOptions });
    const crowded = { m: ["5;2=90.00;+dmg=5;-dmg=5", "6;2=90.00;+dmg=5;-dmg=5"] };
    const end = { endBattle: 1, m: ["0;0;winner=Gracz 1"] };
    const { live } = playInto(margonem, options, [{ init: 1, m: ["0;0;txt=a"] }, crowded, end]);
    assertStrictEquals(
        composeFightView(live.session)?.isOver,
        true,
        "the fight read on to its end",
    );
    assertEquals(keeper.getFights(), [], "and was put on no shelf");
    const keeping = defects.getCounts().find((row) => row.kind === DEFECT_KIND.keeping);
    assert(keeping?.first instanceof CombatantsExceeded, "the refusal the session gave");
});

Deno.test("a gap in one fight costs that fight, and the next one opened is kept", () => {
    const margonem = composeMargonem([[], [], [], [], []]);
    let moments = OPENED_AT;
    const clock = {
        ...STILL_CLOCK,
        readNowMilliseconds: () => {
            moments += 1;
            return moments;
        },
    };
    const { options, keeper, lines } = composeOptions(margonem, { clock });
    const end = { endBattle: 1, m: ["0;0;winner=Gracz 1"] };
    playInto(margonem, options, [{ init: 1 }, { m: "not a list" }, end, { init: 1 }, end]);
    assertEquals(keeper.getFights().map((fight) => fight.openedAt), [OPENED_AT + 2], "the second");
    assertEquals(lines, [DEFECT_KIND.reading, DEFECT_KIND.keeping], "and the first said unkept");
});

Deno.test("an opening the envelope refuses starts the next fight's gap, not the last one's", () => {
    const margonem = composeMargonem([[], [], [], []]);
    const sessionOptions = { ...SESSION_OPTIONS, combatantsMaximum: 1 };
    const { options } = composeOptions(margonem, { sessionOptions });
    const crowded = { m: ["5;2=90.00;+dmg=5;-dmg=5", "6;2=90.00;+dmg=5;-dmg=5"] };
    const end = { endBattle: 1, m: ["0;0;winner=Gracz 1"] };
    const refused = { init: 1, m: "not a list" };
    const { live } = playInto(margonem, options, [{ init: 1 }, crowded, end, refused]);
    assert(live.payloadRefusal !== null, "the new fight opened on a refusal");
    assert(!(live.payloadRefusal instanceof CombatantsExceeded), "its own, not the last fight's");
});
