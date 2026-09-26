/**
 * How a message becomes a turn, message by message, and where that reading and the game disagree:
 * `develop:tools/turn-reading.ts` at `DEVELOP_REVISION`, printing its text.
 *
 *     deno task fight:openers                        the disputed openers, over the recordings
 *     deno task fight:openers --keys                 what opened every turn, and what a key adds
 *     deno task fight:openers captures/<file>.json   one recording, message by message
 *
 * `tools/turn-count.ts` grades the count against the game's numbering; this says **which message**
 * the difference stands on. The rule is `src/core/turn-clock.ts`'s, the grammar and the decoder
 * are `src/core/`'s. `docs/reading-a-turn.md` carries the register and what it does not claim.
 */

import { assert, assertStrictEquals } from "@std/assert";
import { parseArgs } from "@std/cli";
import { formatInteger } from "#/libs/number-text.ts";
import { BATTLE_EVENT, type BattleEvent } from "#/src/core/battle-event.ts";
import {
    type AnnouncementStanding,
    type DecodeContext,
    decodePayloadMessages,
    MESSAGES_MAXIMUM,
} from "#/src/core/fight-decoder.ts";
import { PREPARE_KEY } from "#/src/core/protocol-key.ts";
import { encodeProtocolMessage, parseProtocolMessage } from "#/src/core/protocol-message.ts";
import {
    composeTurnStanding,
    lookupDeclarationOpenerKey,
    lookupTurnOpener,
    NO_TURN_STANDING,
    type TurnStanding,
} from "#/src/core/turn-clock.ts";
import type { RecordedFight } from "#/tests/recorded-fights.ts";
import { TurnReadingError } from "./margometer-tool-error.ts";
import {
    DECODER_TABLES,
    formatRecordingName,
    readRecordedMaterial,
    type ReplayedStep,
    replayRecordedSteps,
} from "./recorded-material.ts";
import { composeTurnBoundaries, TURN_OUTCOME, type TurnBoundary } from "./turn-count.ts";

type EventKind = BattleEvent["kind"];

/**
 * One message, and what reading it came to. The message itself is **not** carried: a `prepare` or
 * an announcement states the client's own display text, which is nobody here's to keep
 * (`captures/AGENTS.md`). The payload and the place in it are what a reader opens instead.
 */
export interface MessageReading {
    payload: number;
    at: number;
    /** Identifiers, in the order the message carried them, and never the text beside them. */
    keys: readonly string[];
    actorId: number | null;
    kinds: readonly EventKind[];
    openerId: number | null;
    /** The declaration's key where a declaration opened the turn, the one case a key decides. */
    openerKey: string | null;
    openerKind: EventKind | null;
    /** The keys without which this message would have opened no turn, or opened another's. */
    adding: readonly string[];
    /** Whose turn it stated as spent on nothing. */
    lostId: number | null;
    /** True where the opener was also the actor of the message before, which is what suppresses. */
    isContested: boolean;
    /** Null where it falls before the game's first ordinal or after its last. */
    boundary: TurnBoundary | null;
}

/** A recording, and every message of it read. */
export interface FightMessages {
    name: string;
    readings: readonly MessageReading[];
}

export interface DisputedReading {
    name: string;
    payload: number;
    at: number;
    combatantId: number;
    key: string;
    from: number;
    to: number;
    counted: number;
}

/**
 * What one key stands behind. `messages` counts the messages it arrived on, which is not the
 * occurrence count `docs/protocol-keys.md` keeps: a message may carry a key twice.
 */
export interface KeyTally {
    key: string;
    messages: number;
    opened: number;
    /** Turns that would not have opened without it, which is the causal half of `opened`. */
    adds: number;
    lost: number;
}

/** What opened a turn, by the answer the rule gave rather than by the key beside it. */
export interface OpenerTally {
    opener: string;
    turns: number;
}

interface MessageTurn {
    standing: TurnStanding;
    openerId: number | null;
    openerKey: string | null;
    openerKind: EventKind | null;
    lostId: number | null;
}

/** Where the reading stands between two messages, which a payload boundary leaves no mark on. */
interface ReadingPlace {
    standing: TurnStanding;
    actorId: number | null;
    /** How many events the fight held when the last payload landed. */
    events: number;
}

interface ReadingArguments {
    isKeys: boolean;
    paths: string[];
}

const ARGUMENTS_MAXIMUM = 256;
const RECORDINGS_MAXIMUM = 4096;
const OPENER_WIDTH = 32;
const KEY_WIDTH = 32;
const NAME_WIDTH = 68;
const KEYS_SHOWN_WIDTH = 56;

/** Every recording's messages read, once, for every report below to be drawn from. */
export function composeFightMessages(fights: readonly RecordedFight[]): FightMessages[] {
    assert(fights.length > 0, "a reading is measured over something");
    assert(fights.length <= RECORDINGS_MAXIMUM, "and over no more than it is bounded to");
    const walks = fights.map((fight) => {
        return { name: formatRecordingName(fight.path), readings: composeMessageReadings(fight) };
    });
    assertStrictEquals(walks.length, fights.length, "every recording is read once");
    return walks;
}

/**
 * Every message of a recording, read the way the tally reads it: the turn standing is carried
 * across payloads as `src/core/fight-statistics.ts` carries it, and the decoder's own standing
 * starts over at each payload as the session's does.
 */
export function composeMessageReadings(fight: RecordedFight): MessageReading[] {
    const steps = replayRecordedSteps(fight);
    const byOrdinals = new Map<string, TurnBoundary>();
    for (const boundary of composeTurnBoundaries(steps)) {
        byOrdinals.set(`${boundary.from}->${boundary.to}`, boundary);
    }
    const readings: MessageReading[] = [];
    let pending: MessageReading[] = [];
    let stated: number | null = null;
    let place: ReadingPlace = { standing: NO_TURN_STANDING, actorId: null, events: 0 };
    for (const [payload, step] of steps.entries()) {
        const read = composeMessageReadingsOfStep(step, payload, place);
        pending.push(...read.readings);
        place = read.place;
        const arriving = step.record.turnStatement;
        if (arriving === null) continue;
        const boundary = stated === null
            ? undefined
            : byOrdinals.get(`${stated}->${arriving.ordinal}`);
        for (const one of pending) readings.push({ ...one, boundary: boundary ?? null });
        pending = [];
        stated = arriving.ordinal;
    }
    readings.push(...pending);
    assert(readings.length <= MESSAGES_MAXIMUM, "a recording states no more messages than it may");
    return readings;
}

/**
 * One payload's messages, each decoded against the decoder standing it met. What they decode to
 * together is held against what the session appended for the payload, so a message read here is
 * one the panel read.
 */
function composeMessageReadingsOfStep(
    step: ReplayedStep,
    payload: number,
    before: ReadingPlace,
): { readings: MessageReading[]; place: ReadingPlace } {
    const readings: MessageReading[] = [];
    let standing = before.standing;
    let previousActorId = before.actorId;
    const roster = step.reading.view.roster;
    let announcement: AnnouncementStanding = null;
    let events = 0;
    for (const [at, message] of step.record.messages.entries()) {
        const context: DecodeContext = { roster, standing: announcement, tables: DECODER_TABLES };
        const decoded = decodePayloadMessages([message], context);
        const turn = readMessageTurn(decoded.events, standing);
        const parsed = parseProtocolMessage(message);
        const keys = parsed instanceof Error ? [] : parsed.parameters.map((one) => one.key);
        const actorId = parsed instanceof Error ? null : (parsed.actor?.combatantId ?? null);
        const openerId = turn.openerId;
        readings.push({
            payload,
            at,
            keys,
            actorId,
            kinds: decoded.events.map((event) => event.kind),
            openerId,
            openerKey: turn.openerKey,
            openerKind: turn.openerKind,
            adding: openerId === null
                ? []
                : composeKeysAddingTurn(message, context, standing, openerId),
            lostId: turn.lostId,
            isContested: openerId === null ? false : openerId === previousActorId,
            boundary: null,
        });
        announcement = decoded.standing;
        standing = turn.standing;
        previousActorId = actorId;
        events += decoded.events.length;
    }
    const held = step.reading.view.events.length;
    const appended = held - (step.record.isInit ? 0 : before.events);
    assertStrictEquals(events, appended, "a payload read message by message is the one read whole");
    return { readings, place: { standing, actorId: previousActorId, events: held } };
}

/** What one message's events came to under the rule, and the standing they leave for the next. */
function readMessageTurn(events: readonly BattleEvent[], standing: TurnStanding): MessageTurn {
    const turn: MessageTurn = {
        standing,
        openerId: null,
        openerKey: null,
        openerKind: null,
        lostId: null,
    };
    for (const event of events) {
        const opened = lookupTurnOpener(event, turn.standing);
        turn.standing = composeTurnStanding(event, turn.standing);
        if (opened !== null) {
            turn.openerId = opened;
            turn.openerKey = readMessageTurnKey(event);
            turn.openerKind = event.kind;
        }
        if (event.kind !== BATTLE_EVENT.turnLost) continue;
        if (event.combatantId !== null) turn.lostId = event.combatantId;
    }
    assert(events.length > 0, "every message leaves at least one event behind");
    return turn;
}

/** The opener's key where a declaration opened the turn, as the turn clock itself reads it. */
function readMessageTurnKey(event: BattleEvent): string | null {
    if (event.kind !== BATTLE_EVENT.declaration) return null;
    assert(event.declared.length > 0, "a declaration states something");
    return lookupDeclarationOpenerKey(event) ?? event.declared[0]?.effect ?? null;
}

/**
 * The keys this message would not have opened its turn without: each is taken out, and the message
 * is read again against the standings it met. Where the turn is then gone, or somebody else's, that
 * key added it. ⚠️ **A blow answers with nothing**: its figures arrive raw beside applied, so taking
 * either leaves a blow, and what opened its turn is that it carries a figure at all.
 */
function composeKeysAddingTurn(
    message: string,
    context: DecodeContext,
    standing: TurnStanding,
    openerId: number,
): string[] {
    const parsed = parseProtocolMessage(message);
    assert(!(parsed instanceof Error), "a message the grammar refused opens no turn");
    const parameters = parsed.parameters;
    const adding: string[] = [];
    for (const key of new Set(parameters.map((one) => one.key))) {
        const kept = parameters.filter((one) => one.key !== key);
        const without = encodeProtocolMessage({ ...parsed, parameters: kept });
        const opened = readMessageTurn(decodePayloadMessages([without], context).events, standing);
        if (opened.openerId !== openerId) adding.push(key);
    }
    assert(adding.length <= parameters.length, "a message adds no more keys than it carried");
    return adding;
}

/**
 * The openers this register contests: a turn opened on a `prepare` whose own combatant acted in
 * the message before, inside a stretch the game's numbering says was counted wrong. Inside one it
 * counted right, a contested opener is a turn that stands.
 */
export function composeDisputedReadings(walk: FightMessages): DisputedReading[] {
    const disputed: DisputedReading[] = [];
    for (const reading of walk.readings) {
        if (!reading.isContested) continue;
        if (reading.openerKey !== PREPARE_KEY) continue;
        const combatantId = reading.openerId;
        if (combatantId === null) continue;
        const boundary = reading.boundary;
        if (boundary === null) continue;
        if (boundary.outcome === TURN_OUTCOME.exact) continue;
        disputed.push({
            name: walk.name,
            payload: reading.payload,
            at: reading.at,
            combatantId,
            key: PREPARE_KEY,
            from: boundary.from,
            to: boundary.to,
            counted: boundary.counted,
        });
    }
    assert(disputed.length <= walk.readings.length, "a recording disputes no more than it states");
    return disputed;
}

export function composeDisputeRegister(walks: readonly FightMessages[]): DisputedReading[] {
    assert(walks.length > 0, "a register is measured over something");
    const disputed = walks.flatMap(composeDisputedReadings);
    for (const one of disputed) assert(one.to > one.from, "a disputed stretch runs forwards");
    return disputed;
}

/** Every key a turn was ever read off, and how often it was and was not. */
export function composeKeyTally(walks: readonly FightMessages[]): KeyTally[] {
    assert(walks.length > 0, "a tally is measured over something");
    const byKey = new Map<string, KeyTally>();
    for (const walk of walks) {
        for (const reading of walk.readings) {
            for (const key of new Set(reading.keys)) {
                const tally = byKey.get(key) ?? { key, messages: 0, opened: 0, adds: 0, lost: 0 };
                tally.messages += 1;
                if (reading.openerId !== null) tally.opened += 1;
                if (reading.lostId !== null) tally.lost += 1;
                byKey.set(key, tally);
            }
            for (const key of reading.adding) {
                const tally = byKey.get(key);
                assert(tally !== undefined, "a key that adds a turn is a key the message carried");
                tally.adds += 1;
            }
        }
    }
    const tallies = [...byKey.values()].filter((one) => one.opened + one.lost > 0);
    tallies.sort(getKeyTallyOrder);
    for (const one of tallies) {
        assert(one.opened <= one.messages, "a key opens no more than it came");
    }
    return tallies;
}

/**
 * Most first, and a plain comparison of the key to break a tie: a key is an identifier the game
 * chose rather than a word anybody reads, so no collation is asked of it.
 */
function getKeyTallyOrder(one: KeyTally, other: KeyTally): number {
    assert(one.key.length > 0, "a tally is kept under a key");
    assert(other.key.length > 0, "and compared against another kept under one");
    if (one.opened !== other.opened) return other.opened - one.opened;
    if (one.key < other.key) return -1;
    if (one.key > other.key) return 1;
    return 0;
}

/**
 * What opened each turn, by the kind of event the rule answered on and a declaration's own key,
 * because a `step` and a `prepare` are one kind and two things. Every turn is opened by exactly
 * one event, so this partitions the turns.
 */
export function composeOpenerTally(walks: readonly FightMessages[]): OpenerTally[] {
    assert(walks.length > 0, "a tally is measured over something");
    const turns = new Map<string, number>();
    for (const walk of walks) {
        for (const reading of walk.readings) {
            if (reading.openerId === null) continue;
            const kind = reading.openerKind;
            assert(kind !== null, "a turn that opened was opened by an event of some kind");
            const opener = reading.openerKey === null ? kind : `${kind}/${reading.openerKey}`;
            turns.set(opener, (turns.get(opener) ?? 0) + 1);
        }
    }
    const tallies = [...turns].map(([opener, count]) => ({ opener, turns: count }));
    tallies.sort((one, other) => other.turns - one.turns);
    assert(tallies.length > 0, "the recordings opened a turn on something");
    return tallies;
}

/** The partition the document carries above the key table. */
export function formatOpenerReport(tallies: readonly OpenerTally[]): string[] {
    assert(tallies.length > 0, "a report states the tally it was handed");
    const lines = [`  ${"opened by".padEnd(OPENER_WIDTH)}${"turns".padStart(9)}`];
    for (const one of tallies) {
        lines.push(`  ${one.opener.padEnd(OPENER_WIDTH)}${formatInteger(one.turns).padStart(9)}`);
    }
    return lines;
}

export function formatKeyReport(tallies: readonly KeyTally[]): string[] {
    assert(tallies.length > 0, "a report states the tally it was handed");
    const lines = [
        `  ${"key".padEnd(KEY_WIDTH)}${"messages".padStart(10)}${"opened".padStart(9)}` +
        `${"adds".padStart(7)}${"lost".padStart(7)}`,
    ];
    for (const one of tallies) {
        lines.push(
            `  ${one.key.padEnd(KEY_WIDTH)}${formatInteger(one.messages).padStart(10)}` +
                `${formatInteger(one.opened).padStart(9)}` +
                `${formatInteger(one.adds).padStart(7)}` +
                `${formatInteger(one.lost).padStart(7)}`,
        );
    }
    return lines;
}

/** The register the document carries, which names no message and points at every one of them. */
export function formatDisputeReport(disputed: readonly DisputedReading[]): string[] {
    const lines = [
        `  ${"recording".padEnd(NAME_WIDTH)}${"payload".padStart(9)}${"message".padStart(9)}` +
        `${"combatant".padStart(12)}${"from".padStart(8)}${"to".padStart(8)}` +
        `${"counted".padStart(9)}  key`,
    ];
    for (const one of disputed) {
        assert(one.key.length > 0, "a dispute stands on a key it names");
        lines.push(
            `  ${one.name.padEnd(NAME_WIDTH)}${formatInteger(one.payload).padStart(9)}` +
                `${formatInteger(one.at).padStart(9)}` +
                `${formatInteger(one.combatantId).padStart(12)}` +
                `${formatInteger(one.from).padStart(8)}${formatInteger(one.to).padStart(8)}` +
                `${formatInteger(one.counted).padStart(9)}  ${one.key}`,
        );
    }
    return lines;
}

/** One recording walked message by message, which is where a count can be argued with. */
export function formatReadingWalk(walk: FightMessages): string[] {
    const lines = ["", `=== ${walk.name} ===`];
    for (const reading of walk.readings) lines.push(formatReadingWalkLine(reading));
    assertStrictEquals(lines.length, walk.readings.length + 2, "a heading, then a line a message");
    return lines;
}

function formatReadingWalkLine(reading: MessageReading): string {
    assert(reading.at >= 0, "a message is numbered from nothing");
    assert(reading.payload >= 0, "and so is the payload it arrived in");
    let opened = "";
    if (reading.openerId !== null) {
        const key = reading.openerKey === null ? "" : ` on ${reading.openerKey}`;
        const contested = reading.isContested ? " CONTESTED" : "";
        opened = ` turn ${formatInteger(reading.openerId)}${key}${contested}`;
    }
    const lost = reading.lostId === null ? "" : ` lost ${formatInteger(reading.lostId)}`;
    const keys = reading.keys.join(",").slice(0, KEYS_SHOWN_WIDTH).padEnd(KEYS_SHOWN_WIDTH);
    return `  payload ${formatInteger(reading.payload).padStart(4)}` +
        ` message ${formatInteger(reading.at).padStart(4)}` +
        `  ${keys}  [${reading.kinds.join(",")}]${opened}${lost}`;
}

export function parseReadingArguments(stated: readonly string[]): ReadingArguments {
    assert(stated.length <= ARGUMENTS_MAXIMUM, "a run is given no more arguments than are read");
    const parsed = parseArgs([...stated], { boolean: ["keys"] });
    const paths: string[] = [];
    for (const one of parsed._) {
        if (typeof one !== "string") {
            throw new TurnReadingError("a recording is named by a path and never by a number");
        }
        paths.push(one);
    }
    assertStrictEquals(
        paths.length,
        parsed._.length,
        "every argument that is not a flag is a path",
    );
    return { isKeys: parsed.keys, paths };
}

if (import.meta.main) {
    const asked = parseReadingArguments(Deno.args);
    const recorded = readRecordedMaterial(asked.paths);
    const walks = composeFightMessages(recorded.fights);
    const lines = [`material ${recorded.material}`];
    if (asked.isKeys) {
        lines.push(...formatOpenerReport(composeOpenerTally(walks)), "");
        lines.push(...formatKeyReport(composeKeyTally(walks)));
    } else if (asked.paths.length > 0) lines.push(...walks.flatMap(formatReadingWalk));
    else lines.push(...formatDisputeReport(composeDisputeRegister(walks)));
    console.log(lines.join("\n"));
}
