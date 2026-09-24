/**
 * One fight, accumulated payload by payload (`docs/design.md` §6.4), in two phases as
 * TigerBeetle's `prepare` and `commit`: every read and computation first, then one write. A payload
 * lands whole or not at all: an assertion that fires while preparing leaves the session untouched.
 *
 * A payload carrying `init` starts a fight over. A payload arriving before one has been seen is
 * read all the same, because the reader may have joined a fight in progress.
 */

import { assert } from "@std/assert/assert";
import { err, ok, type Result } from "@/libs/result.ts";
import type { VocabularyWord } from "@/libs/vocabulary.ts";
import { type BattleEvent, UNREAD_CAUSE, type UnreadCause } from "@/src/core/battle-event.ts";
import {
    type Combatant,
    type CombatantRoster,
    COMBATANTS_MAXIMUM,
    indexCombatantRoster,
} from "@/src/core/combatant-roster.ts";
import {
    decodePayloadMessages,
    type DecoderTables,
    MESSAGES_MAXIMUM,
    type PayloadDecoded,
} from "@/src/core/fight-decoder.ts";
import {
    type CarriedStatus,
    type CarriedStatusWalk,
    composeCarriedStatuses,
    NO_CARRIED_STATUS_WALK,
    prepareCarriedStatuses,
} from "@/src/core/carried-status.ts";
import {
    composeLegendaryStandings,
    type LegendaryStanding,
    type LegendaryWalk,
    NO_LEGENDARY_WALK,
    prepareLegendaryWalk,
} from "@/src/core/legendary-standing.ts";
import {
    CHARGED_SKILLS_MAXIMUM,
    type ChargedSkillStanding,
    type ChargedSkillStatement,
    prepareChargedSkills,
} from "@/src/core/charged-skill.ts";

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

/**
 * The longest fight in `develop:captures/` decodes to 811 events, 2026-08-28. The event bound stays
 * above the decoder's bound on one payload, because every message leaves at least one event: a
 * bound equal to that one could never be the one that fires.
 */
export const SESSION_OPTIONS: SessionOptions = {
    eventsMaximum: MESSAGES_MAXIMUM * 2,
    payloadsMaximum: MESSAGES_MAXIMUM * 2,
    combatantsMaximum: COMBATANTS_MAXIMUM,
};

export type UnreadCounts = { readonly [Cause in UnreadCause]: number };

/** `develop`'s `FightReading`, same content, less the messages kept for the file. */
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
}

export const SESSION_FAILURE = {
    castExceeded: "cast-exceeded",
    eventsExceeded: "events-exceeded",
    payloadsExceeded: "payloads-exceeded",
} as const;

/** A fight past a bound the options state. What stands is left whole. */
export type PayloadRejected =
    | { kind: typeof SESSION_FAILURE.castExceeded; count: number; maximum: number }
    | { kind: typeof SESSION_FAILURE.eventsExceeded; count: number; maximum: number }
    | { kind: typeof SESSION_FAILURE.payloadsExceeded; count: number; maximum: number };

/** Everything a payload leaves standing, but the events, which are appended rather than copied. */
interface SessionStanding {
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
    readonly carried: CarriedStatusWalk;
    readonly legendary: LegendaryWalk;
}

export interface FightSession {
    readonly options: SessionOptions;
    /** Null until a payload has arrived: a fight nobody has seen is not a fight with no figures. */
    standing: SessionStanding | null;
    events: BattleEvent[];
}

export interface PreparedPayload {
    /** What the standing it was prepared against had applied; a fight that opens has none. */
    readonly payloadIndex: number;
    readonly isOpening: boolean;
    readonly decoded: PayloadDecoded;
    readonly next: SessionStanding;
}

export interface PayloadCommitted {
    hasOpened: boolean;
    hasClosed: boolean;
    eventsAdded: number;
    unreadAdded: number;
}

const NO_UNREAD: UnreadCounts = {
    [UNREAD_CAUSE.unknownKey]: 0,
    [UNREAD_CAUSE.noParameter]: 0,
    [UNREAD_CAUSE.grammarRefused]: 0,
};

export function initFightSession(options: SessionOptions): FightSession {
    assert(options.combatantsMaximum <= COMBATANTS_MAXIMUM, "a cast is bounded by the roster");
    assert(options.eventsMaximum > MESSAGES_MAXIMUM, "a fight holds more than one full payload");
    assert(options.payloadsMaximum > 0, "a fight holds a payload");
    return { options, standing: null, events: [] };
}

export function getSessionPhase(session: FightSession): SessionPhase {
    if (session.standing === null) return SESSION_PHASE.waiting;
    assert(session.standing.payloadsApplied > 0, "a fight that exists was built from something");
    if (session.standing.isOver) return SESSION_PHASE.over;
    return SESSION_PHASE.underway;
}

/** Phase one: reads and computations, the session untouched. */
export function preparePayload(
    session: FightSession,
    record: PayloadRecord,
    tables: DecoderTables,
): Result<PreparedPayload, PayloadRejected> {
    const before = record.isInit ? null : session.standing;
    const eventsBefore = before === null ? 0 : session.events.length;
    const payloadsApplied = (before?.payloadsApplied ?? 0) + 1;
    const options = session.options;
    if (payloadsApplied > options.payloadsMaximum) {
        const maximum = options.payloadsMaximum;
        return err({ kind: SESSION_FAILURE.payloadsExceeded, count: payloadsApplied, maximum });
    }
    const combatants = preparePayloadCast(before?.combatants ?? [], record.combatants);
    if (combatants.length > options.combatantsMaximum) {
        const count = combatants.length;
        const maximum = options.combatantsMaximum;
        return err({ kind: SESSION_FAILURE.castExceeded, count, maximum });
    }
    const roster = indexCombatantRoster(combatants);
    const decoded = decodePayloadMessages(record.messages, { roster, standing: null, tables });
    const eventsAfter = eventsBefore + decoded.events.length;
    if (eventsAfter > options.eventsMaximum) {
        const maximum = options.eventsMaximum;
        return err({ kind: SESSION_FAILURE.eventsExceeded, count: eventsAfter, maximum });
    }
    const next = preparePayloadStanding(before, record, decoded, combatants);
    assert(next.payloadsApplied === payloadsApplied, "a payload prepared is counted once");
    const payloadIndex = before?.payloadsApplied ?? 0;
    return ok({ payloadIndex, isOpening: before === null, decoded, next });
}

/**
 * The cast a payload leaves standing. **A second sighting replaces the first rather than joining
 * it**: the roster keys people by id, and a list that grew with every restatement would count
 * sightings where the bound counts people.
 */
function preparePayloadCast(
    before: readonly Combatant[],
    arriving: readonly Combatant[],
): Combatant[] {
    const combatants = [...before];
    for (const combatant of arriving) {
        const seen = combatants.findIndex((one) => one.id === combatant.id);
        if (seen === -1) combatants.push(combatant);
        else combatants[seen] = combatant;
    }
    assert(combatants.length >= before.length, "a cast only grows or is restated");
    assert(combatants.length <= before.length + arriving.length, "by no more than arrived");
    return combatants;
}

function preparePayloadStanding(
    before: SessionStanding | null,
    record: PayloadRecord,
    decoded: PayloadDecoded,
    combatants: readonly Combatant[],
): SessionStanding {
    // Kept once seen: a payload saying nothing about it would otherwise end the auto fight a reader
    // is watching. No payload states an auto fight and a queue at once (`develop:captures/`
    // 2026-09-09), so what the game stated before it took the fight over is not the turn in hand.
    const isOnAuto = record.isOnAuto ?? before?.isOnAuto ?? false;
    const turnStatement = isOnAuto ? null : (record.turnStatement ?? before?.turnStatement ?? null);
    const chargedSkills = prepareChargedSkills(
        before?.chargedSkills ?? [],
        record.chargeStatements,
        decoded.events,
        turnStatement?.ordinal ?? null,
    );
    const events = decoded.events;
    const masks = record.statusMasksByCombatantId;
    return {
        combatants,
        unread: preparePayloadUnread(before?.unread ?? NO_UNREAD, decoded),
        messagesLost: (before?.messagesLost ?? 0) + countMessagesLost(record),
        messagesRead: (before?.messagesRead ?? 0) + record.messages.length,
        // `init` arrives once, so only the first payload of a fight can answer this.
        hasJoinedInProgress: before === null ? !record.isInit : before.hasJoinedInProgress,
        isOver: record.isEnd || (before?.isOver ?? false),
        payloadsApplied: (before?.payloadsApplied ?? 0) + 1,
        // Kept once seen, because only the opening payload carries it.
        readerSide: record.readerSide ?? before?.readerSide ?? null,
        turnStatement,
        isOnAuto,
        chargedSkills,
        carried: prepareCarriedStatuses(before?.carried ?? NO_CARRIED_STATUS_WALK, events, masks),
        legendary: prepareLegendaryWalk(before?.legendary ?? NO_LEGENDARY_WALK, events),
    };
}

/**
 * An envelope that stated no count is nothing to measure the reading against, so nothing is
 * counted lost: which is not the same claim as a count of zero.
 */
function countMessagesLost(record: PayloadRecord): number {
    if (record.messagesStated === null) return 0;
    const lost = record.messagesStated - record.messages.length;
    assert(record.messagesStated <= MESSAGES_MAXIMUM, "the envelope bounded what it stated");
    if (lost <= 0) return 0;
    return lost;
}

function preparePayloadUnread(before: UnreadCounts, decoded: PayloadDecoded): UnreadCounts {
    const counts = { ...before };
    for (const unread of decoded.unread) counts[unread.cause] += 1;
    assert(decoded.unread.length <= decoded.events.length, "an unread message is an event too");
    return counts;
}

/** Phase two: the write alone. Nothing here can fail but an assertion. */
export function commitPayload(session: FightSession, prepared: PreparedPayload): PayloadCommitted {
    const wasOver = session.standing?.isOver ?? false;
    if (prepared.isOpening) {
        session.events = [];
    } else {
        assert(session.standing !== null, "a payload read against a fight lands on that fight");
        const applied = session.standing.payloadsApplied;
        assert(applied === prepared.payloadIndex, "and on the payload it was read against");
    }
    const events = prepared.decoded.events;
    assert(session.events.length + events.length <= session.options.eventsMaximum, "bounded");
    for (const event of events) session.events.push(event);
    session.standing = prepared.next;
    let hasClosed = false;
    if (prepared.next.isOver) hasClosed = prepared.isOpening || !wasOver;
    return {
        hasOpened: prepared.isOpening,
        hasClosed,
        eventsAdded: events.length,
        unreadAdded: prepared.decoded.unread.length,
    };
}

/** A reading of the fight: the arrays are the session's own, and nothing here writes to them. */
export function getFightView(session: FightSession): FightView | null {
    const standing = session.standing;
    if (standing === null) return null;
    assert(standing.payloadsApplied > 0, "a fight that exists was built from something");
    assert(standing.chargedSkills.length <= CHARGED_SKILLS_MAXIMUM, "and bounds what it charges");
    return {
        roster: indexCombatantRoster(standing.combatants),
        events: session.events,
        unread: standing.unread,
        messagesLost: standing.messagesLost,
        messagesRead: standing.messagesRead,
        hasJoinedInProgress: standing.hasJoinedInProgress,
        isOver: standing.isOver,
        readerSide: standing.readerSide,
        turnStatement: standing.turnStatement,
        isOnAuto: standing.isOnAuto,
        payloadsApplied: standing.payloadsApplied,
        chargedSkills: standing.chargedSkills,
        carriedStatuses: composeCarriedStatuses(standing.carried),
        legendaryStandings: composeLegendaryStandings(standing.legendary),
        turnsByCombatantId: standing.carried.turnsByCombatantId,
    };
}
