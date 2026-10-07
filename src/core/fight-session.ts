/**
 * One fight, accumulated payload by payload (`docs/design.md` §6.4), in two phases as
 * TigerBeetle's `prepare` and `commit`: every read and computation first, then one write. A payload
 * lands whole or not at all: an assertion that fires while preparing leaves the session untouched.
 *
 * A payload carrying `init` starts a fight over. A payload arriving before one has been seen is
 * read all the same, because the reader may have joined a fight in progress.
 */

import { assert } from "@std/assert/assert";
import type { VocabularyWord } from "#/libs/vocabulary.ts";
import { BATTLE_EVENT, type BattleEvent, UNREAD_CAUSE, type UnreadCause } from "./battle-event.ts";
import {
    type Combatant,
    type CombatantRoster,
    COMBATANTS_MAXIMUM,
    indexCombatantRoster,
} from "./combatant-roster.ts";
import {
    decodePayloadMessages,
    type DecoderTables,
    MESSAGES_MAXIMUM,
    type PayloadDecoded,
} from "./fight-decoder.ts";
import {
    type CarriedStatus,
    type CarriedStatusWalk,
    composeCarriedStatuses,
    NO_CARRIED_STATUS_WALK,
    prepareCarriedStatusWalk,
} from "./carried-status.ts";
import {
    composeLegendaryStandings,
    type LegendaryStanding,
    type LegendaryWalk,
    NO_LEGENDARY_WALK,
    prepareLegendaryWalk,
} from "./legendary-standing.ts";
import { composeKindsAbsorbed, CUT_MAXIMUM, SKILLS_MAXIMUM } from "./fight-statistics.ts";
import {
    CHARGED_SKILLS_MAXIMUM,
    type ChargedSkillStanding,
    type ChargedSkillStatement,
    prepareChargedSkills,
} from "./charged-skill.ts";

/** The turn in progress as the envelope states it: the queue's least ordinal, and whose it is. */
export interface TurnStatement {
    ordinal: number;
    combatantId: number;
}

/** What the envelope hands the session, read and bounded at the edge (`docs/design.md` §7). */
export interface PayloadRecord {
    isInit: boolean;
    isEnd: boolean;
    messages: readonly string[];
    /** How many messages the envelope says it carries. Null where it says nothing, never zero. */
    messagesStated: number | null;
    readerSide: number | null;
    isOnAuto: boolean | null;
    turnStatement: TurnStatement | null;
    /** The combatants this payload restated. A payload carries only what moved. */
    combatants: readonly Combatant[];
    statusMasksByCombatantId: ReadonlyMap<number, number>;
    chargeStatements: readonly ChargedSkillStatement[];
}

export const SESSION_PHASE = { waiting: "waiting", underway: "underway", over: "over" } as const;
export type SessionPhase = VocabularyWord<typeof SESSION_PHASE>;

export interface SessionOptions {
    eventsMaximum: number;
    payloadsMaximum: number;
    combatantsMaximum: number;
}

export type UnreadCounts = { readonly [Cause in UnreadCause]: number };

/** What a fight has said so far, read by the figures and the panel; the messages stay behind. */
export interface FightView {
    roster: CombatantRoster;
    events: readonly BattleEvent[];
    unread: UnreadCounts;
    /** Messages a payload said it carried and this reader did not read. Zero is the answer. */
    messagesLost: number;
    /** And what it did read, which is what a count of what it could not read is out of. */
    messagesRead: number;
    /** True where the reading began after the fight did, short by an amount nothing states. */
    hasJoinedInProgress: boolean;
    isOver: boolean;
    /** Null where the client never said, which leaves the panel unable to tell one side apart. */
    readerSide: number | null;
    turnStatement: TurnStatement | null;
    /** True while the game is running the fight itself, which is a fight it numbers no turn on. */
    isOnAuto: boolean;
    payloadsApplied: number;
    chargedSkills: readonly ChargedSkillStanding[];
    carriedStatuses: readonly CarriedStatus[];
    legendaryStandings: readonly LegendaryStanding[];
    turnsByCombatantId: ReadonlyMap<number, number>;
    /**
     * How many events the fight held when each combatant was first seated, which is the moment a
     * cast is compared against: one at an index below it landed before they sat down.
     */
    eventsAtSeatingByCombatantId: ReadonlyMap<number, number>;
}

export class CombatantsExceeded extends Error {
    override readonly name = "CombatantsExceeded";
    readonly count: number;
    readonly maximum: number;

    constructor(count: number, maximum: number) {
        super();
        this.count = count;
        this.maximum = maximum;
    }
}

/** The names the figures are cut by, over one fight: the game may spell a new element anywhere. */
export class CutKeysExceeded extends Error {
    override readonly name = "CutKeysExceeded";
    readonly count: number;
    readonly maximum: number;

    constructor(count: number, maximum: number) {
        super();
        this.count = count;
        this.maximum = maximum;
    }
}

export class EventsExceeded extends Error {
    override readonly name = "EventsExceeded";
    readonly count: number;
    readonly maximum: number;

    constructor(count: number, maximum: number) {
        super();
        this.count = count;
        this.maximum = maximum;
    }
}

export class PayloadsExceeded extends Error {
    override readonly name = "PayloadsExceeded";
    readonly count: number;
    readonly maximum: number;

    constructor(count: number, maximum: number) {
        super();
        this.count = count;
        this.maximum = maximum;
    }
}

/** The skill names one fight announces, each of which a row of the figures is kept under. */
export class SkillsExceeded extends Error {
    override readonly name = "SkillsExceeded";
    readonly count: number;
    readonly maximum: number;

    constructor(count: number, maximum: number) {
        super();
        this.count = count;
        this.maximum = maximum;
    }
}

/** A fight past a bound the options or the figures state. What stands is left whole. */
export type PayloadRejected =
    | CombatantsExceeded
    | CutKeysExceeded
    | EventsExceeded
    | PayloadsExceeded
    | SkillsExceeded;

/** Everything a payload leaves standing, but the events, which are appended rather than copied. */
interface SessionState {
    readonly combatants: readonly Combatant[];
    readonly unread: UnreadCounts;
    readonly messagesLost: number;
    readonly messagesRead: number;
    readonly hasJoinedInProgress: boolean;
    readonly isOver: boolean;
    readonly payloadsApplied: number;
    readonly readerSide: number | null;
    readonly turnStatement: TurnStatement | null;
    readonly isOnAuto: boolean;
    readonly chargedSkills: readonly ChargedSkillStanding[];
    readonly carriedStatusWalk: CarriedStatusWalk;
    readonly legendaryWalk: LegendaryWalk;
    /** Everybody the fight has named, seated or not: what the bound on a cast counts. */
    readonly namedCombatantIds: ReadonlySet<number>;
    /** Every name a cut of the figures is kept under, and every skill a row is: what they count. */
    readonly cutKeys: ReadonlySet<string>;
    readonly skillNames: ReadonlySet<string>;
    readonly eventsAtSeatingByCombatantId: ReadonlyMap<number, number>;
}

export interface FightSession {
    readonly options: SessionOptions;
    /** Null until a payload has arrived: a fight nobody has seen is not a fight with no figures. */
    state: SessionState | null;
    events: BattleEvent[];
}

/** What the payload's own preparing already settled, carried into the state it leaves. */
interface PreparedStanding {
    combatants: readonly Combatant[];
    namedCombatantIds: ReadonlySet<number>;
    cutKeys: ReadonlySet<string>;
    skillNames: ReadonlySet<string>;
    eventsAtSeatingByCombatantId: ReadonlyMap<number, number>;
}

export interface PreparedPayload {
    /** What the state it was prepared against had applied; a fight that opens has none. */
    readonly payloadIndex: number;
    readonly isOpening: boolean;
    readonly decoded: PayloadDecoded;
    readonly stateAfter: SessionState;
}

export interface PayloadCommitted {
    hasOpened: boolean;
    hasClosed: boolean;
    eventsAdded: number;
    unreadAdded: number;
}

/**
 * Past every call a capture keeps (`CALLS_MAXIMUM`, `src/ports/fight-capture.ts`, held above it by
 * `tests/core/fight-session.test.ts`), so a fight the add-on wrote down replays whole.
 */
const PAYLOADS_MAXIMUM = 65536;

/**
 * The longest fight in `captures/` decodes to 811 events, 2026-08-28. The event bound stays
 * above the decoder's bound on one payload, because every message leaves at least one event: a
 * bound equal to that one could never be the one that fires.
 */
export const SESSION_OPTIONS: SessionOptions = {
    eventsMaximum: MESSAGES_MAXIMUM * 2,
    payloadsMaximum: PAYLOADS_MAXIMUM,
    combatantsMaximum: COMBATANTS_MAXIMUM,
};

const NO_UNREAD: UnreadCounts = {
    [UNREAD_CAUSE.unknownKey]: 0,
    [UNREAD_CAUSE.noParameter]: 0,
    [UNREAD_CAUSE.grammarRefused]: 0,
};

export function createFightSession(options: SessionOptions): FightSession {
    assert(options.combatantsMaximum <= COMBATANTS_MAXIMUM, "a cast is bounded by the roster");
    assert(options.eventsMaximum > MESSAGES_MAXIMUM, "a fight holds more than one full payload");
    assert(options.payloadsMaximum > 0, "a fight holds a payload");
    return { options, state: null, events: [] };
}

export function getSessionPhase(session: FightSession): SessionPhase {
    if (session.state === null) return SESSION_PHASE.waiting;
    assert(session.state.payloadsApplied > 0, "a fight that exists was built from something");
    if (session.state.isOver) return SESSION_PHASE.over;
    return SESSION_PHASE.underway;
}

/** Phase one: reads and computations, the session untouched. */
export function preparePayload(
    session: FightSession,
    record: PayloadRecord,
    tables: DecoderTables,
): PreparedPayload | PayloadRejected {
    const stateBefore = record.isInit ? null : session.state;
    const eventsBefore = stateBefore === null ? 0 : session.events.length;
    const payloadsApplied = (stateBefore?.payloadsApplied ?? 0) + 1;
    const options = session.options;
    if (payloadsApplied > options.payloadsMaximum) {
        return new PayloadsExceeded(payloadsApplied, options.payloadsMaximum);
    }
    const combatants = preparePayloadCombatants(stateBefore?.combatants ?? [], record.combatants);
    if (combatants.length > options.combatantsMaximum) {
        return new CombatantsExceeded(combatants.length, options.combatantsMaximum);
    }
    const roster = indexCombatantRoster(combatants);
    const decoded = decodePayloadMessages(record.messages, {
        roster,
        announcementStanding: null,
        tables,
    });
    const eventsAfter = eventsBefore + decoded.events.length;
    if (eventsAfter > options.eventsMaximum) {
        return new EventsExceeded(eventsAfter, options.eventsMaximum);
    }
    const namedCombatantIds = prepareNamedCombatantIds(
        stateBefore?.namedCombatantIds ?? new Set(),
        combatants,
        record,
        decoded.events,
    );
    if (namedCombatantIds.size > options.combatantsMaximum) {
        return new CombatantsExceeded(namedCombatantIds.size, options.combatantsMaximum);
    }
    const cutKeys = prepareCutKeys(stateBefore?.cutKeys ?? new Set(), decoded.events);
    if (cutKeys.size > CUT_MAXIMUM) return new CutKeysExceeded(cutKeys.size, CUT_MAXIMUM);
    const skillNames = prepareSkillNames(stateBefore?.skillNames ?? new Set(), decoded.events);
    if (skillNames.size > SKILLS_MAXIMUM) {
        return new SkillsExceeded(skillNames.size, SKILLS_MAXIMUM);
    }
    const eventsAtSeatingByCombatantId = prepareEventsAtSeating(
        stateBefore?.eventsAtSeatingByCombatantId ?? new Map(),
        combatants,
        eventsBefore,
    );
    const stateAfter = preparePayloadStanding(stateBefore, record, decoded, {
        combatants,
        namedCombatantIds,
        cutKeys,
        skillNames,
        eventsAtSeatingByCombatantId,
    });
    assert(stateAfter.payloadsApplied === payloadsApplied, "a payload prepared is counted once");
    const payloadIndex = stateBefore?.payloadsApplied ?? 0;
    return { payloadIndex, isOpening: stateBefore === null, decoded, stateAfter };
}

/**
 * When each combatant the payload leaves seated first sat down, counted in the events the fight
 * held before this payload's own: a payload's warriors are seated before its messages are read,
 * so a cast in the payload that seats somebody reaches them. A restatement keeps the first moment.
 */
function prepareEventsAtSeating(
    eventsAtSeatingBefore: ReadonlyMap<number, number>,
    combatants: readonly Combatant[],
    eventsBefore: number,
): Map<number, number> {
    assert(eventsBefore >= 0, "a moment is a count of events");
    const eventsAtSeatingByCombatantId = new Map<number, number>();
    for (const combatant of combatants) {
        const eventsAtSeating = eventsAtSeatingBefore.get(combatant.id) ?? eventsBefore;
        assert(eventsAtSeating <= eventsBefore, "nobody was seated after the payload seating them");
        eventsAtSeatingByCombatantId.set(combatant.id, eventsAtSeating);
    }
    assert(
        eventsAtSeatingByCombatantId.size === combatants.length,
        "a moment for everybody seated, and nobody else",
    );
    return eventsAtSeatingByCombatantId;
}

/**
 * The cast a payload leaves standing. **A second sighting replaces the first rather than joining
 * it**: the roster keys people by id, and a list that grew with every restatement would count
 * sightings where the bound counts people.
 */
function preparePayloadCombatants(
    combatantsBefore: readonly Combatant[],
    combatantsArriving: readonly Combatant[],
): Combatant[] {
    const combatants = [...combatantsBefore];
    for (const combatant of combatantsArriving) {
        const seenIndex = combatants.findIndex((seenCombatant) =>
            seenCombatant.id === combatant.id
        );
        if (seenIndex === -1) combatants.push(combatant);
        else combatants[seenIndex] = combatant;
    }
    assert(combatants.length >= combatantsBefore.length, "a cast only grows or is restated");
    assert(
        combatants.length <= combatantsBefore.length + combatantsArriving.length,
        "by no more than arrived",
    );
    return combatants;
}

/**
 * Everybody the fight has named so far: seated by the envelope, named by a message, or carrying a
 * mask or a charge. A row stands for each, seated or not, so the help's bound on a fight counts
 * them all, and it is checked here, where the last of them is known (`AGENTS.md` E1).
 */
function prepareNamedCombatantIds(
    namedBefore: ReadonlySet<number>,
    combatants: readonly Combatant[],
    record: PayloadRecord,
    events: readonly BattleEvent[],
): Set<number> {
    const namedCombatantIds = new Set(namedBefore);
    for (const combatant of combatants) namedCombatantIds.add(combatant.id);
    for (const combatantId of record.statusMasksByCombatantId.keys()) {
        namedCombatantIds.add(combatantId);
    }
    for (const statement of record.chargeStatements) namedCombatantIds.add(statement.combatantId);
    for (const event of events) {
        // Add whoever the event names: at its ends, and on the announcement it rides.
        let eventCombatantIds: readonly (number | null)[];
        switch (event.kind) {
            case BATTLE_EVENT.attack:
            case BATTLE_EVENT.damageToNamedCombatant:
                eventCombatantIds = [
                    event.actorId,
                    event.targetId,
                    event.announced?.actorId ?? null,
                ];
                break;
            case BATTLE_EVENT.skillUsed:
                eventCombatantIds = [event.actorId, event.targetId];
                break;
            case BATTLE_EVENT.healthChange:
            case BATTLE_EVENT.unaccountedHealth:
                eventCombatantIds = [event.combatantId, event.announced?.actorId ?? null];
                break;
            case BATTLE_EVENT.healingToNamedCombatant:
                eventCombatantIds = [event.targetId];
                break;
            case BATTLE_EVENT.declaration:
            case BATTLE_EVENT.turnLost:
                eventCombatantIds = [event.combatantId];
                break;
            case BATTLE_EVENT.unknownMessage:
                eventCombatantIds = event.combatantIds;
                break;
            case BATTLE_EVENT.fightOutcome:
                eventCombatantIds = [];
                break;
        }
        for (const combatantId of eventCombatantIds) {
            if (combatantId !== null) namedCombatantIds.add(combatantId);
        }
    }
    assert(namedCombatantIds.size >= namedBefore.size, "nobody named before is forgotten");
    assert(namedCombatantIds.size >= combatants.length, "and everybody seated is named");
    return namedCombatantIds;
}

/**
 * Every name a cut of damage or health is kept under, over the whole fight: an element, or the key
 * health moved by, which share the cut of what a combatant took. The damage family reads any
 * `±dmg…` key, so the game may spell a new element in any message; the bound is checked here,
 * where the last of them is known (`AGENTS.md` E1), and asserted by the tally past it. A defence, a
 * statistic and a proc are cut by the table's own keys, which no message adds to.
 */
function prepareCutKeys(
    cutKeysBefore: ReadonlySet<string>,
    events: readonly BattleEvent[],
): Set<string> {
    const cutKeys = new Set(cutKeysBefore);
    for (const event of events) {
        // Add every name the event cuts a figure by.
        let eventCutKeys: readonly string[];
        switch (event.kind) {
            case BATTLE_EVENT.attack:
                eventCutKeys = [
                    ...event.raw.map((figure) => figure.element),
                    ...event.applied.map((figure) => figure.element),
                    ...composeKindsAbsorbed(event),
                ];
                break;
            case BATTLE_EVENT.damageToNamedCombatant:
                eventCutKeys = [event.damage.element];
                break;
            case BATTLE_EVENT.healthChange:
            case BATTLE_EVENT.healingToNamedCombatant:
            case BATTLE_EVENT.unaccountedHealth:
                eventCutKeys = [event.source];
                break;
            case BATTLE_EVENT.skillUsed:
            case BATTLE_EVENT.declaration:
            case BATTLE_EVENT.turnLost:
            case BATTLE_EVENT.unknownMessage:
            case BATTLE_EVENT.fightOutcome:
                eventCutKeys = [];
                break;
        }
        for (const cutKey of eventCutKeys) cutKeys.add(cutKey);
    }
    assert(cutKeys.size >= cutKeysBefore.size, "no name cut by before is forgotten");
    return cutKeys;
}

/**
 * Every skill the fight has announced, by the name a row of the figures is kept under. A blow or a
 * movement rides an announcement of its own payload, so its name is counted there.
 */
function prepareSkillNames(
    skillNamesBefore: ReadonlySet<string>,
    events: readonly BattleEvent[],
): Set<string> {
    const skillNames = new Set(skillNamesBefore);
    for (const event of events) {
        if (event.kind === BATTLE_EVENT.skillUsed) skillNames.add(event.skillName);
    }
    for (const event of events) {
        if (!("announced" in event)) continue;
        if (event.announced === null) continue;
        assert(skillNames.has(event.announced.skillName), "what a blow rides was announced");
    }
    assert(skillNames.size >= skillNamesBefore.size, "no skill announced before is forgotten");
    return skillNames;
}

function preparePayloadStanding(
    stateBefore: SessionState | null,
    record: PayloadRecord,
    decoded: PayloadDecoded,
    prepared: Readonly<PreparedStanding>,
): SessionState {
    const { combatants, namedCombatantIds, eventsAtSeatingByCombatantId } = prepared;
    // Kept once seen: a payload saying nothing about it would otherwise end the auto fight a reader
    // is watching. No payload states an auto fight and a queue at once (`captures/`
    // 2026-09-09), so what the game stated before it took the fight over is not the turn in hand.
    const isOnAuto = record.isOnAuto ?? stateBefore?.isOnAuto ?? false;
    const turnStatement = isOnAuto
        ? null
        : (record.turnStatement ?? stateBefore?.turnStatement ?? null);
    // The last charge each combatant's entries state: a partial entry beside a full one for the
    // same id would otherwise stand two charges on one combatant.
    const chargeStatementByCombatantId = new Map(
        record.chargeStatements.map((statement) => [statement.combatantId, statement]),
    );
    assert(
        chargeStatementByCombatantId.size <= namedCombatantIds.size,
        "a charge is held by somebody the fight named",
    );
    const chargedSkills = prepareChargedSkills(
        stateBefore?.chargedSkills ?? [],
        [...chargeStatementByCombatantId.values()],
        decoded.events,
        turnStatement?.ordinal ?? null,
    );
    const events = decoded.events;
    const statusMasksByCombatantId = record.statusMasksByCombatantId;
    return {
        combatants,
        unread: preparePayloadUnread(stateBefore?.unread ?? NO_UNREAD, decoded),
        messagesLost: (stateBefore?.messagesLost ?? 0) + countMessagesLost(record),
        messagesRead: (stateBefore?.messagesRead ?? 0) + record.messages.length,
        // `init` arrives once, so only the first payload of a fight can answer this.
        hasJoinedInProgress: stateBefore === null
            ? !record.isInit
            : stateBefore.hasJoinedInProgress,
        isOver: record.isEnd || (stateBefore?.isOver ?? false),
        payloadsApplied: (stateBefore?.payloadsApplied ?? 0) + 1,
        // Kept once seen, because only the opening payload carries it.
        readerSide: record.readerSide ?? stateBefore?.readerSide ?? null,
        turnStatement,
        isOnAuto,
        chargedSkills,
        carriedStatusWalk: prepareCarriedStatusWalk(
            stateBefore?.carriedStatusWalk ?? NO_CARRIED_STATUS_WALK,
            events,
            statusMasksByCombatantId,
        ),
        legendaryWalk: prepareLegendaryWalk(
            stateBefore?.legendaryWalk ?? NO_LEGENDARY_WALK,
            events,
        ),
        namedCombatantIds,
        cutKeys: prepared.cutKeys,
        skillNames: prepared.skillNames,
        eventsAtSeatingByCombatantId,
    };
}

function preparePayloadUnread(unreadBefore: UnreadCounts, decoded: PayloadDecoded): UnreadCounts {
    const counts = { ...unreadBefore };
    for (const unread of decoded.unread) counts[unread.unreadCause] += 1;
    assert(decoded.unread.length <= decoded.events.length, "an unread message is an event too");
    return counts;
}

/**
 * An envelope that stated no count is nothing to measure the reading against, so nothing is
 * counted lost: which is not the same claim as a count of zero.
 */
function countMessagesLost(record: PayloadRecord): number {
    if (record.messagesStated === null) return 0;
    const messagesLost = record.messagesStated - record.messages.length;
    assert(record.messagesStated <= MESSAGES_MAXIMUM, "the envelope bounded what it stated");
    if (messagesLost <= 0) return 0;
    return messagesLost;
}

/** Phase two: the write alone. Nothing here can fail but an assertion. */
export function commitPayload(session: FightSession, prepared: PreparedPayload): PayloadCommitted {
    const wasOver = session.state?.isOver ?? false;
    if (prepared.isOpening) {
        session.events = [];
    } else {
        assert(session.state !== null, "a payload read against a fight lands on that fight");
        const payloadsApplied = session.state.payloadsApplied;
        assert(payloadsApplied === prepared.payloadIndex, "and on the payload it was read against");
    }
    const events = prepared.decoded.events;
    assert(
        session.events.length + events.length <= session.options.eventsMaximum,
        "a fight's events stay inside the bound its options state",
    );
    for (const event of events) session.events.push(event);
    session.state = prepared.stateAfter;
    let hasClosed: boolean;
    if (prepared.stateAfter.isOver) hasClosed = prepared.isOpening || !wasOver;
    else hasClosed = false;
    return {
        hasOpened: prepared.isOpening,
        hasClosed,
        eventsAdded: events.length,
        unreadAdded: prepared.decoded.unread.length,
    };
}

/** A reading of the fight: the arrays are the session's own, and nothing here writes to them. */
export function composeFightView(session: FightSession): FightView | null {
    const state = session.state;
    if (state === null) return null;
    assert(state.payloadsApplied > 0, "a fight that exists was built from something");
    assert(state.chargedSkills.length <= CHARGED_SKILLS_MAXIMUM, "and bounds what it charges");
    return {
        roster: indexCombatantRoster(state.combatants),
        events: session.events,
        unread: state.unread,
        messagesLost: state.messagesLost,
        messagesRead: state.messagesRead,
        hasJoinedInProgress: state.hasJoinedInProgress,
        isOver: state.isOver,
        readerSide: state.readerSide,
        turnStatement: state.turnStatement,
        isOnAuto: state.isOnAuto,
        payloadsApplied: state.payloadsApplied,
        chargedSkills: state.chargedSkills,
        carriedStatuses: composeCarriedStatuses(state.carriedStatusWalk),
        legendaryStandings: composeLegendaryStandings(state.legendaryWalk),
        turnsByCombatantId: state.carriedStatusWalk.turnsByCombatantId,
        eventsAtSeatingByCombatantId: state.eventsAtSeatingByCombatantId,
    };
}
