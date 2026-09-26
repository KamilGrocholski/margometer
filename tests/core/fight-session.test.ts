/**
 * A fight assembled the way the game delivers it: one payload at a time, in order, each prepared
 * and then committed.
 *
 * The records here are written by hand in the shape the envelope hands over. A session fed from the
 * recordings is the envelope's to test, with the envelope.
 */

import {
    assert,
    assertEquals,
    assertExists,
    assertFalse,
    assertInstanceOf,
    AssertionError,
    assertStrictEquals,
    assertThrows,
} from "@std/assert";
import type { Combatant } from "#/src/core/combatant-roster.ts";
import { COMBATANTS_MAXIMUM } from "#/src/core/combatant-roster.ts";
import {
    CastExceeded,
    commitPayload,
    EventsExceeded,
    type FightSession,
    type FightView,
    getFightView,
    getSessionPhase,
    initFightSession,
    type PayloadCommitted,
    type PayloadRecord,
    PayloadsExceeded,
    preparePayload,
    SESSION_OPTIONS,
    SESSION_PHASE,
} from "#/src/core/fight-session.ts";
import { BLOWS_GRANTED } from "#/tests/frozen-tables.ts";

const NOTHING: PayloadRecord = {
    isInit: false,
    isEnd: false,
    messages: [],
    messagesStated: null,
    readerSide: null,
    isOnAuto: null,
    turnStatement: null,
    combatants: [],
    statusMasksByCombatantId: new Map(),
    chargeStatements: [],
};
const OPENING: PayloadRecord = { ...NOTHING, isInit: true };

Deno.test("a fight nobody has seen is not a fight holding nothing", () => {
    const session = initFightSession(SESSION_OPTIONS);
    assertStrictEquals(getFightView(session), null, "there is no fight to read");
    assertStrictEquals(getSessionPhase(session), SESSION_PHASE.waiting, "it waits");
    apply(session, OPENING);
    assertEquals(view(session).events, [], "a fight that opened on nothing holds nothing");
    assertStrictEquals(getSessionPhase(session), SESSION_PHASE.underway, "and is underway");
});

function apply(session: FightSession, record: PayloadRecord): PayloadCommitted {
    const prepared = preparePayload(session, record, BLOWS_GRANTED);
    assert(!(prepared instanceof Error), "a payload inside every bound is prepared");
    return commitPayload(session, prepared);
}

function view(session: FightSession): FightView {
    const found = getFightView(session);
    assertExists(found, "a fight stands");
    return found;
}

Deno.test("preparing touches nothing, and a payload lands once", () => {
    const session = initFightSession(SESSION_OPTIONS);
    apply(session, { ...OPENING, messages: ["0;0;txt=a"] });
    const prepared = preparePayload(
        session,
        { ...NOTHING, messages: ["0;0;txt=b"] },
        BLOWS_GRANTED,
    );
    assert(!(prepared instanceof Error), "the payload is prepared");
    assertEquals(view(session).events.length, 1, "and the fight has not moved");
    assertEquals(view(session).payloadsApplied, 1, "not by a payload either");
    commitPayload(session, prepared);
    assertEquals(view(session).events.length, 2, "until it is committed");
    assertThrows(
        () => commitPayload(session, prepared),
        AssertionError,
        "and on the payload it was read against",
    );
});

Deno.test("a fight that opens replaces the one standing before it", () => {
    const session = initFightSession(SESSION_OPTIONS);
    apply(session, { ...OPENING, readerSide: 1, messages: ["0;0;txt=a", "0;0;txt=b"] });
    const closed = apply(session, { ...NOTHING, isEnd: true, messages: ["0;0;winner=Gracz 1"] });
    assert(closed.hasClosed, "the fight closed on the payload that ended it");
    assertStrictEquals(getSessionPhase(session), SESSION_PHASE.over, "and is over");
    const opened = apply(session, { ...OPENING, messages: ["0;0;txt=c"] });
    assert(opened.hasOpened, "a new one opened");
    const fight = view(session);
    assertEquals(fight.payloadsApplied, 1, "on its own payload");
    assertEquals(fight.events.length, 1, "with its own events");
    assertStrictEquals(fight.readerSide, null, "and none of the side the last one stated");
    assertFalse(fight.isOver, "and is not over");
});

Deno.test("a payload says how many messages it carried, and the count is held to it", () => {
    const session = initFightSession(SESSION_OPTIONS);
    apply(session, { ...OPENING, messagesStated: 3, messages: ["0;0;txt=a", "0;0;txt=b"] });
    assertEquals(view(session).messagesLost, 1, "one was stated and not read");
    assertEquals(view(session).messagesRead, 2, "beside the two that were");
    apply(session, { ...NOTHING, messagesStated: 2, messages: ["0;0;txt=c"] });
    assertEquals(view(session).messagesLost, 2, "and every call adds to the count");
    apply(session, { ...NOTHING, messagesStated: null, messages: ["0;0;txt=d"] });
    assertEquals(view(session).messagesLost, 2, "a count nobody stated loses nothing");
    apply(session, { ...NOTHING, messagesStated: 0, messages: [] });
    assertEquals(view(session).messagesRead, 4, "and a payload with none adds none");
});

Deno.test("what a payload could not read is counted by why", () => {
    const session = initFightSession(SESSION_OPTIONS);
    apply(session, { ...OPENING, messages: ["0;0;whatever_per=3", "gracz;0;step", "0;0"] });
    const unread = view(session).unread;
    assertEquals(unread, { "unknown-key": 1, "no-parameter": 1, "grammar-refused": 1 }, "each");
    apply(session, { ...NOTHING, messages: ["0;0;txt=a"] });
    assertEquals(view(session).unread["unknown-key"], 1, "and a message read whole adds none");
});

Deno.test("the reader's own side is kept once seen, and cleared when a fight opens", () => {
    const session = initFightSession(SESSION_OPTIONS);
    apply(session, { ...OPENING, readerSide: 2 });
    apply(session, { ...NOTHING, messages: ["0;0;txt=a"] });
    assertStrictEquals(view(session).readerSide, 2, "a later payload takes nothing away");
    apply(session, OPENING);
    assertStrictEquals(view(session).readerSide, null, "and a new fight starts over");
});

Deno.test("a fight the game runs itself is kept once seen, and cleared when a fight opens", () => {
    const session = initFightSession(SESSION_OPTIONS);
    apply(session, { ...OPENING, isOnAuto: true });
    apply(session, NOTHING);
    assert(view(session).isOnAuto, "a later payload saying nothing takes nothing away");
    apply(session, { ...NOTHING, isOnAuto: false });
    assertFalse(view(session).isOnAuto, "but the game's own word does");
    apply(session, { ...NOTHING, isOnAuto: true });
    apply(session, OPENING);
    assertFalse(view(session).isOnAuto, "and a new fight starts over");
});

/** `develop ADR 0072`: the game stops numbering while it runs the fight. */
Deno.test("the turn the game stated does not stand once it runs the fight itself", () => {
    const session = initFightSession(SESSION_OPTIONS);
    apply(session, { ...OPENING, isOnAuto: false, turnStatement: { ordinal: 7, combatantId: 11 } });
    assertEquals(view(session).turnStatement, { ordinal: 7, combatantId: 11 }, "in hand");
    apply(session, NOTHING);
    assertEquals(view(session).turnStatement, { ordinal: 7, combatantId: 11 }, "and it stands");
    apply(session, { ...NOTHING, isOnAuto: true });
    assertStrictEquals(view(session).turnStatement, null, "none of it survives auto");
    apply(session, { ...NOTHING, isOnAuto: false, turnStatement: { ordinal: 9, combatantId: 12 } });
    assertEquals(view(session).turnStatement, { ordinal: 9, combatantId: 12 }, "handed back");
});

Deno.test("a session says whether it saw the payload that opened the fight", () => {
    const fromStart = initFightSession(SESSION_OPTIONS);
    apply(fromStart, OPENING);
    apply(fromStart, { ...NOTHING, messages: ["0;0;txt=a"] });
    assertFalse(view(fromStart).hasJoinedInProgress, "watched from its opening payload");

    const joined = initFightSession(SESSION_OPTIONS);
    const first = apply(joined, { ...NOTHING, messages: ["0;0;txt=a"] });
    assert(
        view(joined).hasJoinedInProgress,
        "one whose first payload is anything else began before",
    );
    assert(first.hasOpened, "the first payload the session sees opens its fight, joined or not");
    apply(joined, { ...NOTHING, messages: ["0;0;txt=b"] });
    assert(view(joined).hasJoinedInProgress, "which no later payload undoes");
    apply(joined, OPENING);
    assertFalse(view(joined).hasJoinedInProgress, "a fight that opens is watched whole");
});

/** A payload lands whole or not at all: a bound tripped leaves the fight exactly as it stood. */
Deno.test("a payload past a bound moves nothing, and closes no fight", () => {
    const options = { ...SESSION_OPTIONS, payloadsMaximum: 1 };
    const session = initFightSession(options);
    apply(session, { ...OPENING, messages: ["0;0;txt=a"] });
    const refused = preparePayload(session, { ...NOTHING, isEnd: true }, BLOWS_GRANTED);
    assertInstanceOf(refused, PayloadsExceeded, "a second payload is past a bound of one");
    assertEquals(
        [refused.count, refused.maximum],
        [2, 1],
        "and says which bound, by how much",
    );
    assertEquals(view(session).payloadsApplied, 1, "the fight stands on the one it had");
    assertFalse(view(session).isOver, "and the end it carried closed nothing");
    const reopened = preparePayload(session, OPENING, BLOWS_GRANTED);
    assert(!(reopened instanceof Error), "a fight that opens is counted from none, so it fits");
});

Deno.test("a fight past its bound on events is refused at the bound and not before", () => {
    const options = { ...SESSION_OPTIONS, eventsMaximum: SESSION_OPTIONS.eventsMaximum };
    const session = initFightSession(options);
    const full = new Array(options.eventsMaximum / 2).fill("0;0;txt=a");
    apply(session, { ...OPENING, messages: full });
    apply(session, { ...NOTHING, messages: full });
    assertEquals(view(session).events.length, options.eventsMaximum, "a fight at the bound stands");
    const past = preparePayload(session, { ...NOTHING, messages: ["0;0;txt=b"] }, BLOWS_GRANTED);
    assert(past instanceof Error, "one event past it is refused");
    assertInstanceOf(past, EventsExceeded, "as too many events");
});

Deno.test("a cast stated twice is one cast, and a fight of twenty survives the restatement", () => {
    const session = initFightSession(SESSION_OPTIONS);
    apply(session, { ...OPENING, combatants: composeFullCast() });
    assertEquals(view(session).roster.byId.size, COMBATANTS_MAXIMUM, "everybody in it");
    apply(session, { ...NOTHING, combatants: composeFullCast() });
    assertEquals(view(session).roster.byId.size, COMBATANTS_MAXIMUM, "and the same people");
    const newcomer = [composeCombatant(COMBATANTS_MAXIMUM + 1, "Nowy", 1)];
    const past = preparePayload(session, { ...NOTHING, combatants: newcomer }, BLOWS_GRANTED);
    assertInstanceOf(past, CastExceeded, "a twenty-first person is past the cast's bound");
    assertEquals(
        [past.count, past.maximum],
        [COMBATANTS_MAXIMUM + 1, COMBATANTS_MAXIMUM],
        "and says so",
    );
});

/** A cast the game would field: ten a side, keyed by id as the client keys its own warriors. */
function composeFullCast(): Combatant[] {
    return Array.from(
        { length: COMBATANTS_MAXIMUM },
        (_, at) => composeCombatant(at + 1, `Postac${at + 1}`, at < COMBATANTS_MAXIMUM / 2 ? 1 : 2),
    );
}

function composeCombatant(id: number, name: string, side: number): Combatant {
    return { id, name, side, profession: "w", level: 100, healthMaximum: 1000 };
}

Deno.test("a name stated by two people resolves to nobody, however often each is stated", () => {
    const cast = [composeCombatant(1, "Odyniec", 1), composeCombatant(2, "Odyniec", 2)];
    const session = initFightSession(SESSION_OPTIONS);
    apply(session, { ...OPENING, combatants: cast });
    apply(session, { ...NOTHING, combatants: cast });
    assertStrictEquals(view(session).roster.idByName.get("Odyniec"), null, "two people, one name");
});

Deno.test("a fight that opens past a bound leaves the one standing, whole", () => {
    const options = { ...SESSION_OPTIONS, combatantsMaximum: 1 };
    const session = initFightSession(options);
    apply(session, { ...OPENING, messages: ["0;0;txt=a"] });
    const cast = [composeCombatant(1, "Gracz 1", 1), composeCombatant(2, "Gracz 2", 2)];
    const refused = preparePayload(session, { ...OPENING, combatants: cast }, BLOWS_GRANTED);
    assert(refused instanceof Error, "a fight opening on two people is past a bound of one");
    assertEquals(view(session).events.length, 1, "the fight that stood keeps its events");
    assertFalse(view(session).hasJoinedInProgress, "and was not made a fight joined late");
});

Deno.test("what a payload says somebody carries reaches the view, and a new fight drops it", () => {
    const session = initFightSession(SESSION_OPTIONS);
    apply(session, { ...OPENING, messages: ["0;0;txt=a"] });
    assertEquals(view(session).carriedStatuses, [], "nobody carries anything yet");
    const masks = new Map([[7, 0b101]]);
    apply(session, { ...NOTHING, statusMasksByCombatantId: masks });
    const bits = view(session).carriedStatuses.map((one) => one.bit);
    assertEquals(bits, [0, 2], "the two lit bits, handed over from the mask");
    apply(session, OPENING);
    assertEquals(view(session).carriedStatuses, [], "and a fight that opens holds none");
});

Deno.test("a legendary bonus the fight spent reaches the view, and a new fight drops it", () => {
    const session = initFightSession(SESSION_OPTIONS);
    const cast = [composeCombatant(1, "Gracz 1", 1), composeCombatant(2, "Gracz 2", 1)];
    const rescue = "2=40.00;3=50.00;legbon_lastheal=100,Gracz 1(50.00%)";
    apply(session, { ...OPENING, combatants: cast, messages: [rescue] });
    const standings = view(session).legendaryStandings;
    assertEquals(standings.map((one) => one.combatantId), [1], "the healed spent the bonus");
    apply(session, OPENING);
    assertEquals(view(session).legendaryStandings, [], "and a fight that opens holds none of it");
});

Deno.test("a charge the envelope states reaches the view", () => {
    const session = initFightSession(SESSION_OPTIONS);
    const charge = { skillName: "Cios", turnsElapsed: 0, turnsStated: 2 };
    apply(session, { ...OPENING, chargeStatements: [{ combatantId: 4, charge }] });
    const charged = view(session).chargedSkills;
    assertEquals(charged.map((one) => [one.combatantId, one.state]), [[4, "charging"]], "one");
});

Deno.test("a fight that ended stays over, whatever arrives after the end", () => {
    const session = initFightSession(SESSION_OPTIONS);
    apply(session, OPENING);
    apply(session, { ...NOTHING, isEnd: true });
    const after = apply(session, { ...NOTHING, messages: ["0;0;txt=a"] });
    assert(view(session).isOver, "a payload after the end reopens nothing");
    assertFalse(after.hasClosed, "and closes nothing a second time");
});

Deno.test("a legendary run lit in one payload counts the heals of the next", () => {
    const session = initFightSession(SESSION_OPTIONS);
    const lit = "1=90.00;2=80.00;+dmg=10;-dmg=10;+legbon_holytouch";
    apply(session, { ...OPENING, messages: [lit] });
    apply(session, { ...NOTHING, messages: ["1=96.00;0;legbon_holytouch_heal=60"] });
    const heals = view(session).legendaryStandings.map((one) => one.holytouchHealsGiven);
    assertEquals(heals, [1], "the run carries into the payload after its lighting");
});
