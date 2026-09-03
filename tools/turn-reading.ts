/**
 * How a message becomes a turn, message by message, and where that reading and the game disagree.
 *
 *     deno task turns:reading                        the disputed messages, over the corpus
 *     deno task turns:reading captures/<file>.json   one recording, message by message
 *
 * `tools/turn-count.ts` grades the count against the game's numbering and says how far apart they
 * are; this says **which message** the difference is standing on. The rule itself is imported from
 * `src/core/fight-statistics.ts`, so the panel and this cannot read a message differently.
 * `docs/reading-a-turn.md` carries the register and what it does not claim.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { parseArgs } from "@std/cli";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import {
    composeTurnStanding,
    getTurnOpener,
    NO_TURN_STANDING,
    type TurnStanding,
} from "@/src/core/fight-statistics.ts";
import {
    addPayloadToSession,
    composeBattleSession,
    getFightFromSession,
} from "@/src/game/battle-session.ts";
import { composeIntegerText, getIntegerFromText } from "@/libs/number-text.ts";
import { TurnReadingError } from "@/tools/margometer-tool-error.ts";
import { composeFightReplaySteps, composeRecordedMaterial } from "@/tools/fight-replay.ts";
import type { RecordedFight } from "@/tools/recorded-fights.ts";
import { composeBoundaries, readTurnStatement, type TurnBoundary } from "@/tools/turn-count.ts";

/** Past every recording a run could name by hand, which is what the arguments are. */
const MAXIMUM_ARGUMENTS = 256;
/** Past the 715 messages the longest recording states, 2026-09-03. */
const MAXIMUM_MESSAGES = 65536;
/** What the game puts between a message's fields. */
const FIELD_SEPARATOR = ";";
/** And between a key and what it states, where it states anything. */
const VALUE_SEPARATOR = "=";
/**
 * The key a turn spends itself on making ready, which is the one opener whose suppression turns on
 * who acted in the message before it — and so the one this register can contest.
 * `docs/protocol-keys.md` owns what it means.
 */
const PREPARE_KEY = "prepare";

/**
 * One message, and what reading it came to. The message itself is **not** carried: a `prepare` or
 * an announcement states the client's own display text, which is nobody here's to keep
 * (`captures/AGENTS.md`). The span is what a reader opens instead.
 */
export interface MessageReading {
    payload: number;
    at: number;
    /** The keys the message carried, in order. Identifiers, never the text beside them. */
    keys: readonly string[];
    /** Whom the message names first, or null where it names nobody. */
    actorId: number | null;
    /** The event kinds it decoded to, which is what the rule is applied to. */
    kinds: readonly string[];
    /** Whose turn it opened, or null where it opened none. */
    openerId: number | null;
    /** Which key the opener stood on, where the opener was a declaration. */
    openerKey: string | null;
    /** The kind of event the opener came from, which is what the rule actually answered. */
    openerKind: string | null;
    /** The keys without which this message would have opened no turn, or opened another's. */
    adding: readonly string[];
    /** Whose turn it stated as spent on nothing. */
    lostId: number | null;
    /**
     * True where an opener's combatant was also named by the message before it. The suppression
     * that would have stopped it turns on exactly that, so this is where it failed or held.
     */
    isContested: boolean;
    /**
     * The stretch of the game's own numbering this message falls inside, or null where it falls
     * outside every one — before the game first states an ordinal, or after it last does.
     */
    boundary: TurnBoundary | null;
}

/** One disputed reading, as the register carries it. */
export interface DisputedReading {
    name: string;
    payload: number;
    at: number;
    combatantId: number;
    key: string;
    /** The two ordinals the game numbered across it, and what the count came to inside them. */
    from: number;
    to: number;
    counted: number;
}

/** The boundaries of a recording, by the pair of ordinals each runs between. */
function composeBoundariesByOrdinals(fight: RecordedFight): Map<string, TurnBoundary> {
    assert(fight.calls.length > 0, "a recording is numbered over the payloads it carried");
    const byOrdinals = new Map<string, TurnBoundary>();
    for (const boundary of composeBoundaries(composeFightReplaySteps(fight))) {
        byOrdinals.set(`${boundary.from}->${boundary.to}`, boundary);
    }
    assert(byOrdinals.size <= MAXIMUM_MESSAGES, "a recording is numbered no more than it may");
    return byOrdinals;
}

function getMessageKeys(message: string): string[] {
    assert(message.length > 0, "a message that was read is not empty");
    const fields = message.split(FIELD_SEPARATOR);
    assert(fields.length <= MAXIMUM_MESSAGES, "a message states no more than it may");
    const keys: string[] = [];
    for (const field of fields.slice(2)) keys.push(field.split(VALUE_SEPARATOR)[0] ?? field);
    return keys;
}

/** Whom the message names first, read off the grammar's own first field and nothing else. */
function readMessageActor(message: string): number | null {
    assert(message.length > 0, "a message that was read is not empty");
    const first = message.split(FIELD_SEPARATOR)[0];
    if (first === undefined) return null;
    const named = first.split(VALUE_SEPARATOR)[0];
    if (named === undefined) return null;
    const stated = getIntegerFromText(named);
    if (stated === null) return null;
    assert(Number.isSafeInteger(stated), "a combatant is named by a whole number");
    if (stated === 0) return null;
    return stated;
}

/**
 * The events one message left behind, taken as the difference between decoding the payload up to
 * it and up to the one before. The decoder glues an announcement to the message after it and no
 * further, so a prefix decodes to exactly the events that prefix produced live.
 */
function composeEventsOfMessage(
    messages: readonly string[],
    at: number,
    roster: Parameters<typeof decodeFightMessages>[1],
): BattleEvent[] {
    assert(at >= 0, "a message is numbered from nothing");
    assert(at < messages.length, "and never past the payload it sits in");
    const before = at === 0 ? [] : decodeFightMessages(messages.slice(0, at), roster);
    const now = decodeFightMessages(messages.slice(0, at + 1), roster);
    assert(
        now.length >= before.length,
        "a message decodes to no fewer events than the ones before",
    );
    return now.slice(before.length);
}

/** What one message came to, and the standing it leaves behind for the next. */
function composeReadingOfMessage(
    message: string,
    events: readonly BattleEvent[],
    standing: TurnStanding,
    previousActorId: number | null,
): {
    message: Omit<MessageReading, "payload" | "at" | "boundary" | "adding">;
    standing: TurnStanding;
    actorId: number | null;
} {
    const actorId = readMessageActor(message);
    let carried = standing;
    let openerId: number | null = null;
    let openerKey: string | null = null;
    let openerKind: string | null = null;
    let lostId: number | null = null;
    for (const event of events) {
        const opened = getTurnOpener(event, carried);
        carried = composeTurnStanding(event, carried);
        if (opened !== null) {
            openerId = opened;
            openerKey = getOpenerKey(event);
            openerKind = event.kind;
        }
        if (event.kind !== "turn-lost") continue;
        if (event.combatantId !== null) lostId = event.combatantId;
    }
    assert(openerId === null || openerId !== undefined, "an opener is somebody or it is nobody");
    assert(
        carried.strikingId === null || carried.strikingId === carried.actingId,
        "whoever is still mid-blow is whoever acted last",
    );
    return {
        message: {
            keys: getMessageKeys(message),
            actorId,
            kinds: events.map((event) => event.kind),
            openerId,
            openerKey,
            openerKind,
            lostId,
            isContested: openerId !== null && openerId === previousActorId,
        },
        standing: carried,
        actorId,
    };
}

/**
 * The keys this message would not have opened its turn without. Asked by removing one key from
 * the message and reading it again against the standing it actually met: where the turn is then
 * gone, or somebody else's, that key added it.
 *
 * ⚠️ **A blow answers with nothing, and that is the finding rather than a gap.** Its figures arrive
 * in pairs — raw beside applied — so removing either leaves the other and the message is a blow
 * still. What opens a turn there is that the message carries a figure at all, which is not a
 * property of any one key. `composeOpenerTally` is where that count lives instead.
 */
function composeKeysAddingTurn(
    message: string,
    previous: readonly string[],
    roster: Parameters<typeof decodeFightMessages>[1],
    standing: TurnStanding,
    openerId: number,
): string[] {
    assert(message.length > 0, "a message that opened a turn is not empty");
    const fields = message.split(FIELD_SEPARATOR);
    const carried = fields.slice(2);
    const adding: string[] = [];
    const before = previous.length === 0 ? 0 : decodeFightMessages(previous, roster).length;
    for (const key of new Set(carried.map((field) => field.split(VALUE_SEPARATOR)[0] ?? field))) {
        const kept = carried.filter((field) => (field.split(VALUE_SEPARATOR)[0] ?? field) !== key);
        const without = [...fields.slice(0, 2), ...kept].join(FIELD_SEPARATOR);
        const decoded = decodeFightMessages([...previous, without], roster).slice(before);
        let opened: number | null = null;
        let walk = standing;
        for (const event of decoded) {
            const one = getTurnOpener(event, walk);
            walk = composeTurnStanding(event, walk);
            if (one !== null) opened = one;
        }
        if (opened !== openerId) adding.push(key);
    }
    assert(adding.length <= carried.length, "a message adds no more keys than it carried");
    return adding;
}

/** The opener's key, where a declaration opened the turn — the one case a key decides. */
function getOpenerKey(event: BattleEvent): string | null {
    if (event.kind !== "declaration") return null;
    assert(event.declared.length > 0, "a declaration states something");
    assert(event.combatantId !== undefined, "and states it about somebody, even about nobody");
    for (const declared of event.declared) {
        if (declared.effect === PREPARE_KEY) return PREPARE_KEY;
    }
    const first = event.declared[0];
    if (first === undefined) return null;
    return first.effect;
}

/**
 * Every message of a recording, read the way the aggregate reads it. The standing is carried
 * across payloads exactly as `composeFightStatistics` carries it, because it walks one flat event
 * list and so does this.
 */
export function composeMessageReadings(fight: RecordedFight): MessageReading[] {
    assert(fight.name.length > 0, "a reading is taken over a recording with a name");
    const byOrdinals = composeBoundariesByOrdinals(fight);
    const session = composeBattleSession();
    const readings: MessageReading[] = [];
    let pending: MessageReading[] = [];
    let stated: number | null = null;
    let standing: TurnStanding = NO_TURN_STANDING;
    let previousActorId: number | null = null;
    for (const call of fight.calls) {
        addPayloadToSession(session, call);
        const held = getFightFromSession(session);
        if (held === null) continue;
        const payload = held.messagesByPayload.length - 1;
        const messages = held.messagesByPayload[payload] ?? [];
        for (let at = 0; at < messages.length; at += 1) {
            const message = messages[at] ?? "";
            const events = composeEventsOfMessage(messages, at, held.roster);
            const before = standing;
            const reading = composeReadingOfMessage(message, events, standing, previousActorId);
            standing = reading.standing;
            previousActorId = reading.actorId;
            const openerId = reading.message.openerId;
            const previous = at === 0 ? [] : [messages[at - 1] ?? ""];
            const adding = openerId === null
                ? []
                : composeKeysAddingTurn(message, previous, held.roster, before, openerId);
            pending.push({ payload, at, ...reading.message, adding, boundary: null });
        }
        const arriving = readTurnStatement(call);
        if (arriving === null) continue;
        const boundary = stated === null
            ? undefined
            : byOrdinals.get(`${stated}->${arriving.ordinal}`);
        for (const one of pending) readings.push({ ...one, boundary: boundary ?? null });
        pending = [];
        stated = arriving.ordinal;
    }
    for (const one of pending) readings.push(one);
    assert(readings.length <= MAXIMUM_MESSAGES, "a recording states no more messages than it may");
    return readings;
}

/**
 * The openers this register contests: a turn opened on a `prepare` whose own combatant was named
 * by the message before it. Every other opener stands on an action of its own; this one stands on
 * a suppression that was meant to catch it and did not.
 */
export function composeDisputedReadings(fight: RecordedFight): DisputedReading[] {
    assert(fight.name.length > 0, "a dispute is raised against a recording with a name");
    const disputed: DisputedReading[] = [];
    for (const reading of composeMessageReadings(fight)) {
        if (!reading.isContested) continue;
        if (reading.openerKey !== PREPARE_KEY) continue;
        const combatantId = reading.openerId;
        if (combatantId === null) continue;
        // The game's own numbering is what makes a contested opener a dispute. Inside a stretch
        // it counted right, a contested opener is a turn that stands; only where the count is
        // wrong does one of them have to be the reason.
        const boundary = reading.boundary;
        if (boundary === null) continue;
        if (boundary.outcome === "exact") continue;
        disputed.push({
            name: fight.name,
            payload: reading.payload,
            at: reading.at,
            combatantId,
            key: PREPARE_KEY,
            from: boundary.from,
            to: boundary.to,
            counted: boundary.counted,
        });
    }
    assert(disputed.length <= MAXIMUM_MESSAGES, "a recording disputes no more than it states");
    return disputed;
}

/** Every recording's disputes, in the order the register carries them. */
export function composeDisputeRegister(fights: readonly RecordedFight[]): DisputedReading[] {
    assert(fights.length > 0, "a register is measured over something");
    const disputed: DisputedReading[] = [];
    for (const fight of fights) {
        assert(fight.name.length > 0, "a dispute is raised against a recording with a name");
        for (const one of composeDisputedReadings(fight)) disputed.push(one);
    }
    assert(disputed.every((one) => one.to > one.from), "a disputed stretch runs forwards");
    return disputed;
}

/**
 * What one key stands behind, over every message the corpus carries. `messages` counts the
 * messages the key arrived on, which is not what `docs/protocol-keys.md` counts: that register
 * counts occurrences of the key, and a message may carry one twice.
 */
export interface KeyTally {
    key: string;
    messages: number;
    opened: number;
    /** Turns that would not have opened without it, which is the causal half of `opened`. */
    adds: number;
    lost: number;
}

/** What opened a turn, by the answer the rule actually gave rather than by the key beside it. */
export interface OpenerTally {
    opener: string;
    turns: number;
}

/**
 * Most first, and a plain comparison to break a tie — `ARCHITECTURE.md` refuses a collated order,
 * and a key is an identifier the game chose rather than a word anybody reads.
 */
function getTallyOrder(one: KeyTally, other: KeyTally): number {
    assert(one.key.length > 0, "a tally is kept under a key");
    assert(other.key.length > 0, "and compared against another kept under one");
    if (one.opened !== other.opened) return other.opened - one.opened;
    if (one.key < other.key) return -1;
    if (one.key > other.key) return 1;
    return 0;
}

/** Every key a turn was ever read off, and how often it was and was not. */
export function composeKeyTally(fights: readonly RecordedFight[]): KeyTally[] {
    assert(fights.length > 0, "a tally is measured over something");
    const messages = new Map<string, number>();
    const opened = new Map<string, number>();
    const adds = new Map<string, number>();
    const lost = new Map<string, number>();
    for (const fight of fights) {
        for (const reading of composeMessageReadings(fight)) {
            for (const key of new Set(reading.keys)) {
                messages.set(key, (messages.get(key) ?? 0) + 1);
                if (reading.openerId !== null) opened.set(key, (opened.get(key) ?? 0) + 1);
                if (reading.lostId !== null) lost.set(key, (lost.get(key) ?? 0) + 1);
            }
            for (const key of reading.adding) adds.set(key, (adds.get(key) ?? 0) + 1);
        }
    }
    const tally: KeyTally[] = [];
    for (const [key, carried] of messages) {
        const stood = opened.get(key) ?? 0;
        const spent = lost.get(key) ?? 0;
        if (stood === 0 && spent === 0) continue;
        tally.push({
            key,
            messages: carried,
            opened: stood,
            adds: adds.get(key) ?? 0,
            lost: spent,
        });
    }
    tally.sort(getTallyOrder);
    assert(tally.every((one) => one.opened <= one.messages), "a key opens no more than it arrives");
    return tally;
}

/**
 * What opened each turn, by the kind of event the rule answered on — and by the declaration's own
 * key, because a `step` and a `prepare` are one kind and two different things. This one
 * **partitions**: every turn is opened by exactly one event, so the column sums to the corpus's
 * turns. `docs/turns-taken.md` is where what each of them means is stated.
 */
export function composeOpenerTally(fights: readonly RecordedFight[]): OpenerTally[] {
    assert(fights.length > 0, "a tally is measured over something");
    const turns = new Map<string, number>();
    for (const fight of fights) {
        for (const reading of composeMessageReadings(fight)) {
            if (reading.openerId === null) continue;
            const kind = reading.openerKind ?? "";
            assert(kind.length > 0, "a turn that opened was opened by an event of some kind");
            const opener = reading.openerKey === null ? kind : `${kind}/${reading.openerKey}`;
            turns.set(opener, (turns.get(opener) ?? 0) + 1);
        }
    }
    const tally = [...turns].map(([opener, count]) => ({ opener, turns: count }));
    tally.sort((one, other) => other.turns - one.turns);
    assert(tally.length > 0, "the corpus opened a turn on something");
    return tally;
}

const OPENER_WIDTH = 32;

/** The partition the document carries above the key table. */
export function composeOpenerReport(tally: readonly OpenerTally[]): string[] {
    assert(tally.length > 0, "a report states the tally it was handed");
    const lines = [`  ${"opened by".padEnd(OPENER_WIDTH)}${"turns".padStart(9)}`];
    for (const one of tally) {
        lines.push(
            `  ${one.opener.padEnd(OPENER_WIDTH)}${composeIntegerText(one.turns).padStart(9)}`,
        );
    }
    assert(lines.length > 1, "a report states a line for every opener it was handed");
    return lines;
}

const KEY_WIDTH = 32;

/** The key register the document carries. */
export function composeKeyReport(tally: readonly KeyTally[]): string[] {
    assert(tally.length > 0, "a report states the tally it was handed");
    const lines = [
        `  ${"key".padEnd(KEY_WIDTH)}${"messages".padStart(10)}${"opened".padStart(9)}` +
        `${"adds".padStart(7)}${"lost".padStart(7)}`,
    ];
    for (const one of tally) {
        lines.push(
            `  ${one.key.padEnd(KEY_WIDTH)}${composeIntegerText(one.messages).padStart(10)}` +
                `${composeIntegerText(one.opened).padStart(9)}` +
                `${composeIntegerText(one.adds).padStart(7)}` +
                `${composeIntegerText(one.lost).padStart(7)}`,
        );
    }
    assert(lines.length > 1, "a report states a line for every key it was handed");
    return lines;
}

const NAME_WIDTH = 68;

/** The register the document carries, which names no message and points at every one of them. */
export function composeDisputeReport(disputed: readonly DisputedReading[]): string[] {
    assert(disputed.every((one) => one.key.length > 0), "a dispute stands on a key it names");
    const lines = [
        `  ${"recording".padEnd(NAME_WIDTH)}${"payload".padStart(9)}${"message".padStart(9)}` +
        `${"combatant".padStart(12)}${"from".padStart(8)}${"to".padStart(8)}` +
        `${"counted".padStart(9)}  key`,
    ];
    for (const one of disputed) {
        lines.push(
            `  ${one.name.padEnd(NAME_WIDTH)}${composeIntegerText(one.payload).padStart(9)}` +
                `${composeIntegerText(one.at).padStart(9)}` +
                `${composeIntegerText(one.combatantId).padStart(12)}` +
                `${composeIntegerText(one.from).padStart(8)}${
                    composeIntegerText(one.to).padStart(8)
                }` +
                `${composeIntegerText(one.counted).padStart(9)}  ${one.key}`,
        );
    }
    assert(lines.length > 0, "a report states its own heading, even over nothing");
    return lines;
}

/** One line of the walk: what the message carried, and what the rule made of it. */
function composeReadingLine(reading: MessageReading): string {
    const opened = reading.openerId === null
        ? ""
        : ` turn ${composeIntegerText(reading.openerId)}` +
            `${reading.openerKey === null ? "" : ` on ${reading.openerKey}`}` +
            `${reading.isContested ? " CONTESTED" : ""}`;
    const lost = reading.lostId === null ? "" : ` lost ${composeIntegerText(reading.lostId)}`;
    assert(reading.at >= 0, "a message is numbered from nothing");
    assert(reading.payload >= 0, "and so is the payload it arrived in");
    return `  payload ${composeIntegerText(reading.payload).padStart(4)}` +
        ` message ${composeIntegerText(reading.at).padStart(4)}` +
        `  ${reading.keys.join(",").slice(0, 56).padEnd(56)}` +
        `  [${reading.kinds.join(",")}]${opened}${lost}`;
}

/** One recording walked message by message, which is where a count can be argued with. */
export function composeReadingReport(fight: RecordedFight): string[] {
    assert(fight.name.length > 0, "a walk is headed by the recording it was taken on");
    const readings = composeMessageReadings(fight);
    const lines = ["", `=== ${fight.name} ===`];
    for (const reading of readings) lines.push(composeReadingLine(reading));
    assert(lines.length > 1, "a walk says something about the recording it was taken on");
    return lines;
}

interface ReadingArguments {
    isKeys: boolean;
    paths: string[];
}

function getArguments(stated: readonly string[]): ReadingArguments {
    assert(stated.length <= MAXIMUM_ARGUMENTS, "a run is given no more arguments than are read");
    const parsed = parseArgs([...stated], { boolean: ["keys"] });
    const paths = parsed._.filter((one): one is string => typeof one === "string");
    if (paths.length !== parsed._.length) {
        throw new TurnReadingError("a recording is named by a path and never by a number");
    }
    assertEquals(paths.length, parsed._.length, "every argument that is not a flag is a path");
    return { isKeys: parsed.keys, paths };
}

if (import.meta.main) {
    const asked = getArguments(Deno.args);
    const recorded = composeRecordedMaterial(asked.paths);
    console.log(`material ${recorded.material}`);
    if (asked.isKeys) {
        for (const line of composeOpenerReport(composeOpenerTally(recorded.fights))) {
            console.log(line);
        }
        console.log("");
        for (const line of composeKeyReport(composeKeyTally(recorded.fights))) console.log(line);
    } else if (asked.paths.length > 0) {
        for (const fight of recorded.fights) {
            for (const line of composeReadingReport(fight)) console.log(line);
        }
    } else {
        for (const line of composeDisputeReport(composeDisputeRegister(recorded.fights))) {
            console.log(line);
        }
    }
    assertStrictEquals(typeof recorded.material, "string", "a run names the material it read");
}
