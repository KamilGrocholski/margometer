/**
 * Messages to what happened (`docs/design.md` §6.1, §6.2): a message's grammar first, then what it
 * says. What a key means is `protocol-key.ts`'s.
 *
 * The decoder drops nothing and invents nothing: a key with no meaning yet makes the message an
 * `UnreadMessage`, which still carries what was read beside it, so a panel can say which total may
 * be short and no figure is lost for it.
 */

import { assert } from "@std/assert/assert";
import type { VocabularyWord } from "#/libs/vocabulary.ts";
import { formatInteger, parseDecimal, parseInteger } from "#/libs/number-text.ts";
import {
    type AnnouncedSkill,
    type AttackEvent,
    BATTLE_EVENT,
    type BattleEvent,
    type DamageFigure,
    type DeclaredEffect,
    type DestroyedStatistic,
    type FightOutcomeEvent,
    OUTCOME_RESULT,
    type PreventedDamage,
    type UnknownMessageEvent,
    UNREAD_CAUSE,
    type UnreadCause,
} from "./battle-event.ts";
import {
    type CombatantRoster,
    COMBATANTS_MAXIMUM,
    lookupCombatantIdByName,
} from "./combatant-roster.ts";
import { encodeHealthPercent, parseHealthPercent } from "./protocol-number.ts";
import {
    APPLIED_SIGN,
    DAMAGE_HALF,
    getKeyReading,
    KEY_FAMILY,
    type KeyReading,
    NAME_SEPARATOR,
    RAW_SIGN,
    SKILL_ID_KEY,
    TEXT_KEY,
} from "./protocol-key.ts";

export interface DecoderTables {
    blowsGrantedBySkillId: ReadonlyMap<number, number>;
}

/** An announcement, the messages it has left to reach, and whether it has reached any yet. */
export interface StandingAnnouncement {
    announced: AnnouncedSkill;
    blowsRemaining: number;
    /** True for the message the client itself glues this to, false for every one after it. */
    isGlued: boolean;
}
export type AnnouncementStanding = StandingAnnouncement | null;

export interface DecodeContext {
    roster: CombatantRoster | null;
    standing: AnnouncementStanding;
    tables: DecoderTables;
}

export interface MessageDecoded {
    events: readonly BattleEvent[];
    standing: AnnouncementStanding;
}

export interface UnreadReading {
    unreadCause: UnreadCause;
    keys: readonly string[];
    combatantIds: readonly number[];
    text: string;
    /** What was read beside the unread keys: a blow with a new proc keeps its damage. */
    events: readonly BattleEvent[];
    standing: AnnouncementStanding;
}

export class UnreadMessage extends Error implements UnreadReading {
    override readonly name = "UnreadMessage";
    readonly unreadCause: UnreadCause;
    readonly keys: readonly string[];
    readonly combatantIds: readonly number[];
    readonly text: string;
    readonly events: readonly BattleEvent[];
    readonly standing: AnnouncementStanding;

    constructor(reading: UnreadReading) {
        super();
        this.unreadCause = reading.unreadCause;
        this.keys = reading.keys;
        this.combatantIds = reading.combatantIds;
        this.text = reading.text;
        this.events = reading.events;
        this.standing = reading.standing;
    }
}

export interface PayloadDecoded {
    events: readonly BattleEvent[];
    unread: readonly UnreadMessage[];
    standing: AnnouncementStanding;
}

interface HealthChangeReading {
    source: string;
    amount: number;
    isOnTarget: boolean;
    declared: DeclaredEffect[];
}

interface NamedTargetReading {
    targetName: string;
    targetHealthPercent: number | null;
}

interface AnnouncementReading {
    skillName: string;
    skillId: number | null;
}

interface MessageReading {
    raw: DamageFigure[];
    applied: DamageFigure[];
    prevented: PreventedDamage[];
    destroyed: DestroyedStatistic[];
    procs: string[];
    healthChanges: HealthChangeReading[];
    namedDamage: (NamedTargetReading & { damage: DamageFigure })[];
    namedHealing: (NamedTargetReading & { amount: number; source: string })[];
    unaccounted: { source: string; declaredShare: number }[];
    outcomes: FightOutcomeEvent[];
    declared: DeclaredEffect[];
    skill: AnnouncementReading | null;
    skillName: string | null;
    skillId: number | null;
    skillKeys: number;
    unreadKeys: string[];
}

export interface MessageSide {
    readonly combatantId: number;
    readonly healthPercent: number | null;
}

export interface MessageParameter {
    readonly key: string;
    /** `null` for a segment with no `=`. An empty value is `""`, which is a different thing. */
    readonly value: string | null;
}

export interface ProtocolMessage {
    readonly actor: MessageSide | null;
    readonly target: MessageSide | null;
    readonly parameters: readonly MessageParameter[];
}

export const MESSAGE_END = { actor: "actor", target: "target" } as const;
export type MessageEnd = VocabularyWord<typeof MESSAGE_END>;

export class SegmentsExceeded extends Error {
    override readonly name = "SegmentsExceeded";
    readonly segments: number;
    readonly maximum: number;

    constructor(segments: number, maximum: number) {
        super();
        this.segments = segments;
        this.maximum = maximum;
    }
}

export class SideUnreadable extends Error {
    override readonly name = "SideUnreadable";
    readonly end: MessageEnd;

    constructor(end: MessageEnd) {
        super();
        this.end = end;
    }
}

export class ParameterKeyEmpty extends Error {
    override readonly name = "ParameterKeyEmpty";
    readonly index: number;

    constructor(index: number) {
        super();
        this.index = index;
    }
}

export type GrammarRefusal = SegmentsExceeded | SideUnreadable | ParameterKeyEmpty;

/**
 * ⚠️ **One payload can carry a whole fight**: a fight joined underway delivers its log in the
 * opening call. The cost is paid inside the game's own `updateData`: a little over two
 * microseconds a message, best of 20 over the 627-message payload of
 * `captures/2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0.json`, 2026-09-11.
 */
export const MESSAGES_MAXIMUM = 32768;
/**
 * Past every count the published table states (2 at its highest), and how far an announcement
 * carrying no id reaches. Four rather than eight because the two ways of being wrong do not cost
 * the same: too high and a combatant's plain blows are charged to what it announced before them.
 * `develop:docs/unannounced-damage.md` carries the measurement, `develop ADR 0078` the rule.
 */
const BLOWS_GRANTED_MAXIMUM = 4;
/** A skill's name is a phrase; the longest in `captures/` is far short, 2026-09-01. */
export const NAME_LENGTH_MAXIMUM = 4096;

/** This family may state a second member after the health figure. It is not health. */
const MEMBER_SEPARATOR = ",";
/**
 * `amount,element,name(percent%)`. A blank middle member is the plain element, not one of its own:
 * 314 of the 1131 occurrences in `captures/` write it blank, 2026-08-28.
 */
const NAMED_DAMAGE_MEMBERS = 3;
/** `amount,name(percent%)`: the figure first, the opposite order from `+oth_dmg`. */
const NAMED_HEALING_MEMBERS = 2;
const DAMAGE_ELEMENT_PREFIX = "dmg";
const PERCENT_OPENER = "(";
const PERCENT_CLOSER = "%)";
/** The key a draw arrives on is the winners'; the same mark on the losers' is not read. */
const NO_WINNER = "?";
/**
 * What the game puts between the combatant it is talking about and what it has to say, and how it
 * ends a sentence about something other than a turn. 319 of 319 turns lost over
 * `captures/` on 2026-09-03 have this shape, with nothing else matching
 * (`develop ADR 0049`).
 */
const TURN_LOST_SEPARATOR = " - ";
const SENTENCE_STOP = ".";
const ENDS_MAXIMUM = 2;
/** The longest message in `captures/` carries 42 segments, 2026-08-28. */
export const SEGMENTS_MAXIMUM = 512;

const SEGMENT_SEPARATOR = ";";
const VALUE_SEPARATOR = "=";
const NO_COMBATANT = "0";
const SIDE_SEGMENTS = 2;

/** The counts the published table states, keyed by the id an announcement carries. */
export function indexBlowsGrantedBySkillId(
    stated: readonly { id: number; blowsGrantedMinimum: number }[],
): Map<number, number> {
    const found = new Map<number, number>();
    for (const skill of stated) {
        assert(skill.blowsGrantedMinimum > 0, "a skill in the table grants at least one blow");
        assert(skill.blowsGrantedMinimum < BLOWS_GRANTED_MAXIMUM, "and stays inside the bound");
        assert(!found.has(skill.id), "and is named once");
        found.set(skill.id, skill.blowsGrantedMinimum);
    }
    return found;
}

/**
 * A payload's messages, in order. Order is the whole of what an announcement has: the client glues
 * the message after one to it, and this reads them the same way (`develop ADR 0078`). The envelope
 * has bounded the message count already; here it is asserted.
 */
export function decodePayloadMessages(
    texts: readonly string[],
    context: DecodeContext,
): PayloadDecoded {
    assert(texts.length <= MESSAGES_MAXIMUM, "a payload stays inside its stated bound");
    const events: BattleEvent[] = [];
    const unread: UnreadMessage[] = [];
    let standing = context.standing;
    for (const text of texts) {
        const decoded = decodeMessage(text, { ...context, standing });
        if (decoded instanceof Error) {
            events.push(...decoded.events, decodePayloadMessagesUnknown(decoded));
            unread.push(decoded);
        } else {
            events.push(...decoded.events);
        }
        standing = decoded.standing;
    }
    assert(events.length >= texts.length, "every message leaves at least one event behind");
    assert(unread.length <= texts.length, "and at most one unread record");
    return { events, unread, standing };
}

function decodePayloadMessagesUnknown(unread: UnreadMessage): UnknownMessageEvent {
    assert(unread.keys.length <= unread.text.length, "an unread key is part of its message");
    assert(unread.combatantIds.length <= ENDS_MAXIMUM, "a message names at most two ends");
    return {
        kind: BATTLE_EVENT.unknownMessage,
        message: unread.text,
        unreadCause: unread.unreadCause,
        unreadKeys: unread.keys,
        combatantIds: unread.combatantIds,
    };
}

export function decodeMessage(
    text: string,
    context: DecodeContext,
): MessageDecoded | UnreadMessage {
    const message = parseProtocolMessage(text);
    if (message instanceof Error) {
        const unreadCause: UnreadCause = UNREAD_CAUSE.grammarRefused;
        return new UnreadMessage({
            unreadCause,
            keys: [],
            combatantIds: [],
            text,
            events: [],
            standing: null,
        });
    }
    const reading = decodeMessageReading(message);
    const isBlow = hasAttackFigure(reading);
    const own = getAnnouncedSkill(message, reading.skill);
    const announced = lookupAnnouncedForMessage(message, own, context.standing, isBlow);
    if (!isBlow) reading.unreadKeys.push(...reading.procs);
    const events = decodeMessageEvents(message, reading, announced, context.roster, isBlow);
    const standing = composeStandingAfterMessage(context, events, own);
    assert(events.length <= message.parameters.length, "a message stays inside its bound");
    if (reading.unreadKeys.length > 0) {
        const combatantIds = getNamedCombatantIds(message);
        const unreadCause = UNREAD_CAUSE.unknownKey;
        const keys = reading.unreadKeys;
        return new UnreadMessage({ unreadCause, keys, combatantIds, text, events, standing });
    }
    if (events.length === 0) {
        const combatantIds = getNamedCombatantIds(message);
        const unreadCause = UNREAD_CAUSE.noParameter;
        return new UnreadMessage({ unreadCause, keys: [], combatantIds, text, events, standing });
    }
    return { events, standing };
}

/**
 * How far an announcement still reaches, one message on. ⚠️ **The chain breaks on anything that is
 * not the announcer's own blow**: a message that decoded no blow ends it, and so does another
 * combatant's.
 */
function composeStandingAfterMessage(
    context: DecodeContext,
    events: readonly BattleEvent[],
    announced: AnnouncedSkill | null,
): AnnouncementStanding {
    if (announced !== null) {
        const blowsRemaining = getBlowsForAnnouncement(announced, context.tables);
        return { announced, blowsRemaining, isGlued: true };
    }
    const standing = context.standing;
    if (standing === null) return null;
    const struck = events.find((event) => event.kind === BATTLE_EVENT.attack);
    if (struck === undefined) return null;
    if (struck.kind !== BATTLE_EVENT.attack) return null;
    if (struck.actorId !== standing.announced.actorId) return null;
    assert(standing.blowsRemaining > 0, "a standing handed on has a blow left to spend");
    const blowsRemaining = standing.blowsRemaining - 1;
    assert(blowsRemaining >= 0, "a standing spends no more blows than it was given");
    if (blowsRemaining === 0) return null;
    return { announced: standing.announced, blowsRemaining, isGlued: false };
}

/**
 * The table's count where the announcement names an id; the bound where it names none. Every id any
 * announcement carried over `captures/` is one the table carries (0 exceptions of 3129,
 * 2026-09-12), and 364 of the 371 announcements without one are an NPC's.
 */
function getBlowsForAnnouncement(announced: AnnouncedSkill, tables: DecoderTables): number {
    if (announced.skillId === null) return BLOWS_GRANTED_MAXIMUM;
    const granted = tables.blowsGrantedBySkillId.get(announced.skillId) ?? 0;
    assert(granted >= 0, "a table grants nothing or more");
    assert(1 + granted <= BLOWS_GRANTED_MAXIMUM, "a reach stays inside its stated bound");
    return 1 + granted;
}

/** Every parameter is read, or named unread, and none twice. */
function decodeMessageReading(message: ProtocolMessage): MessageReading {
    const reading: MessageReading = {
        raw: [],
        applied: [],
        prevented: [],
        destroyed: [],
        procs: [],
        healthChanges: [],
        namedDamage: [],
        namedHealing: [],
        unaccounted: [],
        outcomes: [],
        declared: [],
        skill: null,
        skillName: null,
        skillId: null,
        skillKeys: 0,
        unreadKeys: [],
    };
    for (const parameter of message.parameters) {
        const key = parameter.key;
        const keyReading = getKeyReading(key);
        const value = parameter.value;
        let isRead: boolean;
        if (keyReading === null) isRead = false;
        else if (value === null) {
            // Read a key that stands bare, or leave it unread.
            assert(key.length > 0, "a key is never empty");
            switch (keyReading.kind) {
                case KEY_FAMILY.proc:
                    isRead = addDecoded(reading.procs, key);
                    break;
                case KEY_FAMILY.fled:
                    isRead = addDecoded(reading.outcomes, decodeFledOutcome());
                    break;
                case KEY_FAMILY.valuelessDeclaration:
                    isRead = addDecoded(reading.declared, {
                        effect: key,
                        amount: null,
                        text: null,
                    });
                    break;
                default:
                    isRead = false;
            }
        } else isRead = addValuedKey(reading, message, key, value, keyReading);
        if (!isRead) reading.unreadKeys.push(key);
    }
    // Close the announcement: an id with no name is a skill nothing can put on screen.
    {
        assert(reading.skill === null, "a reading's announcement is closed once");
        assert(reading.skillKeys >= 0, "a key is counted once");
        if (reading.skillName !== null) {
            reading.skill = { skillName: reading.skillName, skillId: reading.skillId };
        } else if (reading.skillKeys > 0) {
            reading.unreadKeys.push(SKILL_ID_KEY);
            reading.skillKeys -= 1;
        }
    }
    const read = tallyParametersRead(reading);
    assert(read === message.parameters.length, "every parameter is read or named unread, once");
    return reading;
}

/** Read a valued key: a value its family cannot read leaves it unread, not asserted. */
function addValuedKey(
    reading: MessageReading,
    message: ProtocolMessage,
    key: string,
    value: string,
    keyReading: KeyReading,
): boolean {
    assert(key.length > 0, "a key is never empty");
    assert(message.parameters.length > 0, "a valued key stands in a message that has parameters");
    switch (keyReading.kind) {
        case KEY_FAMILY.damage:
        case KEY_FAMILY.prevented:
        case KEY_FAMILY.destroyed: {
            // Read a figure of the blow: no number, or one below nothing, goes unread. No key of
            // these families has stated one below nothing over `captures/` (0 of every value,
            // 2026-09-21), and a total taking it would go down.
            const amount = parseInteger(value);
            if (amount === null) return false;
            if (amount < 0) return false;
            assert(Number.isSafeInteger(amount), "a figure read from digits is held exactly");
            const token = getTokenFromKey(key);
            if (keyReading.kind === KEY_FAMILY.prevented) {
                reading.prevented.push({ defence: token, amount });
            } else if (keyReading.kind === KEY_FAMILY.destroyed) {
                reading.destroyed.push({ statistic: token, amount });
            } else if (keyReading.half === DAMAGE_HALF.raw) {
                reading.raw.push({ element: token, amount });
            } else reading.applied.push({ element: token, amount });
            return true;
        }
        case KEY_FAMILY.proc:
            if (keyReading.doesTakeValue) return addDecoded(reading.procs, key);
            return false;
        case KEY_FAMILY.healthChange:
            return addDecoded(reading.healthChanges, decodeHealthChange(key, value, keyReading));
        case KEY_FAMILY.declaration:
            return addDecoded(reading.declared, {
                effect: key,
                amount: parseInteger(value),
                text: value,
            });
        case KEY_FAMILY.skillName:
        case KEY_FAMILY.customSkillName: {
            // Read the skill's name: one empty or past the bound goes unread. `tcustom` names its
            // user in the target slot, so it is read only where one combatant is named.
            const isUserNamed = keyReading.kind === KEY_FAMILY.customSkillName
                ? doesNameOneCombatant(message)
                : true;
            if (value.length === 0) return false;
            if (value.length > NAME_LENGTH_MAXIMUM) return false;
            if (!isUserNamed) return false;
            reading.skillName = value;
            reading.skillKeys += 1;
            assert(
                reading.skillKeys <= message.parameters.length,
                "a skill key is one of the message's",
            );
            return true;
        }
        case KEY_FAMILY.skillId:
            reading.skillId = parseInteger(value);
            reading.skillKeys += 1;
            return true;
        case KEY_FAMILY.outcome:
            return addDecoded(reading.outcomes, decodeFightOutcome(value, keyReading.result));
        case KEY_FAMILY.fled:
            return addDecoded(reading.outcomes, decodeFledOutcome());
        case KEY_FAMILY.unaccountedHealth:
            return addDecoded(reading.unaccounted, decodeUnaccountedShare(key, value));
        case KEY_FAMILY.namedDamage:
            return addDecoded(reading.namedDamage, decodeNamedDamage(value));
        case KEY_FAMILY.namedHealing:
            return addDecoded(reading.namedHealing, decodeNamedHealing(key, value));
        case KEY_FAMILY.valuelessDeclaration:
            return false;
    }
}

function addDecoded<Decoded>(found: Decoded[], decoded: Decoded | null): boolean {
    if (decoded === null) return false;
    const count = found.push(decoded);
    assert(count > 0, "what was decoded is held");
    return true;
}

/**
 * The escape's own value is never read by the client, which takes the actor slot instead
 * (production build `ne0iTNdg`), so it arrives bare or valued and both read the same.
 */
function decodeFledOutcome(): FightOutcomeEvent {
    return { kind: BATTLE_EVENT.fightOutcome, result: OUTCOME_RESULT.fled, combatantNames: [] };
}

/** The client's own token: the key with its sign taken off. */
function getTokenFromKey(key: string): string {
    let token: string;
    if (key.startsWith(RAW_SIGN)) token = key.slice(RAW_SIGN.length);
    else {
        assert(key.startsWith(APPLIED_SIGN), "a figure's key carries one of the two signs");
        token = key.slice(APPLIED_SIGN.length);
    }
    assert(token.length > 0, "a figure carries the client's own token");
    assert(key.endsWith(token), "a token is the key's own tail");
    return token;
}

/** The figure, then whatever the key stated beside it. */
function decodeHealthChange(
    key: string,
    value: string,
    keyReading: { sign: 1 | -1; isOnTarget: boolean },
): HealthChangeReading | null {
    const members = value.split(MEMBER_SEPARATOR);
    const magnitude = parseInteger(members[0] ?? "");
    if (magnitude === null) return null;
    const declared: DeclaredEffect[] = [];
    for (const member of members.slice(1)) {
        declared.push({ effect: key, amount: parseInteger(member), text: member });
    }
    assert(declared.length < members.length, "the health figure is not a declaration");
    const amount = keyReading.sign * magnitude;
    return { source: key, amount, isOnTarget: keyReading.isOnTarget, declared };
}

/** Both ends the same, or one end unstated: there was never a second name to get wrong. */
function doesNameOneCombatant(message: ProtocolMessage): boolean {
    if (message.actor === null) return message.target !== null;
    if (message.target === null) return true;
    return message.actor.combatantId === message.target.combatantId;
}

/** `loser=?` is not a side of that name, so it is left unread rather than read as a draw. */
function decodeFightOutcome(
    value: string,
    result: typeof OUTCOME_RESULT.won | typeof OUTCOME_RESULT.lost,
): FightOutcomeEvent | null {
    if (value.length === 0) return null;
    if (value === NO_WINNER) {
        if (result === OUTCOME_RESULT.lost) return null;
        return {
            kind: BATTLE_EVENT.fightOutcome,
            result: OUTCOME_RESULT.drawn,
            combatantNames: [],
        };
    }
    const combatantNames = value.split(NAME_SEPARATOR);
    if (combatantNames.some((one) => one.length === 0)) return null;
    if (combatantNames.some((one) => one.startsWith(" "))) return null;
    assert(combatantNames.length > 0, "a side that is named has at least one member");
    return { kind: BATTLE_EVENT.fightOutcome, result, combatantNames };
}

/** A share written with or without a fraction: `30` and `22.5` are both in `captures/`. */
function decodeUnaccountedShare(
    key: string,
    value: string,
): { source: string; declaredShare: number } | null {
    const declaredShare = parseDecimal(value);
    if (declaredShare === null) return null;
    assert(declaredShare >= 0, "a share read is never below nothing");
    return { source: key, declaredShare };
}

function decodeNamedDamage(value: string): (NamedTargetReading & { damage: DamageFigure }) | null {
    const members = value.split(MEMBER_SEPARATOR);
    if (members.length !== NAMED_DAMAGE_MEMBERS) return null;
    const [amountText = "", element = "", stated = ""] = members;
    const amount = parseInteger(amountText);
    if (amount === null) return null;
    if (amount < 0) return null;
    const named = parseNamedTarget(stated);
    if (named === null) return null;
    const damage = { element: `${DAMAGE_ELEMENT_PREFIX}${element.trim()}`, amount };
    assert(damage.element.startsWith(DAMAGE_ELEMENT_PREFIX), "an element named is of the family");
    assert(named.targetName.length > 0, "a figure stated against a name has a name");
    return { ...named, damage };
}

/** `Gracz 1(63.00%)`: the name runs to the last opener, so a name may hold one of its own. */
function parseNamedTarget(text: string): NamedTargetReading | null {
    if (!text.endsWith(PERCENT_CLOSER)) return null;
    const opener = text.lastIndexOf(PERCENT_OPENER);
    if (opener <= 0) return null;
    const targetName = text.slice(0, opener);
    const percentText = text.slice(opener + PERCENT_OPENER.length, -PERCENT_CLOSER.length);
    assert(targetName.length > 0, "a stated name says something");
    assert(percentText.length < text.length, "a percentage is shorter than what carried it");
    return { targetName, targetHealthPercent: parseHealthPercent(percentText) };
}

/** Healing that took health away would be this reader misreading its key, not a loss reported. */
function decodeNamedHealing(
    key: string,
    value: string,
): (NamedTargetReading & { amount: number; source: string }) | null {
    const members = value.split(MEMBER_SEPARATOR);
    if (members.length !== NAMED_HEALING_MEMBERS) return null;
    const [amountText = "", stated = ""] = members;
    const amount = parseInteger(amountText);
    if (amount === null) return null;
    if (amount < 0) return null;
    const named = parseNamedTarget(stated);
    if (named === null) return null;
    assert(named.targetName.length > 0, "the healed is named inside the value");
    assert(Number.isSafeInteger(amount), "healing read from digits is held exactly");
    return { ...named, amount, source: key };
}

function tallyParametersRead(reading: MessageReading): number {
    return reading.raw.length + reading.applied.length + reading.prevented.length +
        reading.destroyed.length + reading.procs.length + reading.healthChanges.length +
        reading.namedDamage.length + reading.namedHealing.length + reading.unaccounted.length +
        reading.outcomes.length + reading.declared.length +
        reading.skillKeys + reading.unreadKeys.length;
}

function hasAttackFigure(reading: MessageReading): boolean {
    if (reading.raw.length > 0) return true;
    if (reading.applied.length > 0) return true;
    if (reading.prevented.length > 0) return true;
    return reading.destroyed.length > 0;
}

/**
 * The announcement an effect rides: the message's own where it carries one, the one before it
 * otherwise and only for its own actor. ⚠️ **Past the message the client glues it to, a standing
 * reaches a blow and nothing else**: a poison tick on the announcer picked up `Kosa zastępcy` in
 * `2026-08-12-tempest-grupa-vs-draugr-2`, and a heal there would have been credited to it.
 */
function lookupAnnouncedForMessage(
    message: ProtocolMessage,
    own: AnnouncedSkill | null,
    standing: AnnouncementStanding,
    isBlow: boolean,
): AnnouncedSkill | null {
    if (own !== null) return own;
    if (standing === null) return null;
    const announced = standing.announced;
    if (announced.actorId === null) return null;
    if (message.actor === null) return null;
    if (message.actor.combatantId !== announced.actorId) return null;
    assert(standing.blowsRemaining > 0, "a standing announcement has a message left to reach");
    if (standing.isGlued) return announced;
    if (isBlow) return announced;
    return null;
}

function getAnnouncedSkill(
    message: ProtocolMessage,
    skill: AnnouncementReading | null,
): AnnouncedSkill | null {
    if (skill === null) return null;
    assert(skill.skillName.length > 0, "an announcement names something");
    const actorId = message.actor?.combatantId ?? message.target?.combatantId ?? null;
    if (actorId === null) assert(message.actor === null, "an announcer is read off a named end");
    return { skillName: skill.skillName, skillId: skill.skillId, actorId };
}

/**
 * The order is load-bearing: a share stated about a whole side stands before the announcement it
 * rides, because the percentages that announcement states are where the side stands **after** the
 * cast, and sizing one needs where they stood before.
 */
function decodeMessageEvents(
    message: ProtocolMessage,
    reading: MessageReading,
    announced: AnnouncedSkill | null,
    roster: CombatantRoster | null,
    isBlow: boolean,
): BattleEvent[] {
    const events: BattleEvent[] = [];
    if (isBlow) events.push(decodeAttackEvent(message, reading, announced));
    for (const moved of reading.healthChanges) {
        const side = moved.isOnTarget ? message.target : message.actor;
        events.push({
            kind: BATTLE_EVENT.healthChange,
            combatantId: side?.combatantId ?? null,
            amount: moved.amount,
            healthPercent: side?.healthPercent ?? null,
            source: moved.source,
            declared: moved.declared,
            announced,
        });
    }
    for (const named of reading.namedDamage) {
        events.push({
            kind: BATTLE_EVENT.damageToNamedCombatant,
            actorId: message.actor?.combatantId ?? null,
            targetName: named.targetName,
            targetId: lookupNamedId(roster, named.targetName),
            targetHealthPercent: named.targetHealthPercent,
            damage: named.damage,
            announced,
        });
    }
    for (const unaccounted of reading.unaccounted) {
        events.push({
            kind: BATTLE_EVENT.unaccountedHealth,
            source: unaccounted.source,
            // The actor, always: 8 of the 115 in `captures/` name somebody else in the
            // target, and reading that slot would credit the wrong combatant with the cast.
            combatantId: message.actor?.combatantId ?? null,
            declaredShare: unaccounted.declaredShare,
            announced,
        });
    }
    if (reading.skill !== null) events.push(decodeSkillUsedEvent(message, reading, isBlow));
    for (const restored of reading.namedHealing) {
        events.push({
            kind: BATTLE_EVENT.healingToNamedCombatant,
            targetName: restored.targetName,
            targetId: lookupNamedId(roster, restored.targetName),
            targetHealthPercent: restored.targetHealthPercent,
            amount: restored.amount,
            source: restored.source,
        });
    }
    events.push(...reading.outcomes);
    const declaration = decodeDeclaration(message, reading, roster, isBlow);
    if (declaration !== null) events.push(declaration);
    assert(events.length >= reading.outcomes.length, "every outcome read is an event");
    assert(events.length <= message.parameters.length, "no parameter makes two events");
    return events;
}

function decodeAttackEvent(
    message: ProtocolMessage,
    reading: MessageReading,
    announced: AnnouncedSkill | null,
): AttackEvent {
    assert(hasAttackFigure(reading), "an attack states a figure");
    assert(reading.procs.length <= message.parameters.length, "an event stays inside its bound");
    return {
        kind: BATTLE_EVENT.attack,
        actorId: message.actor?.combatantId ?? null,
        targetId: message.target?.combatantId ?? null,
        actorHealthPercent: message.actor?.healthPercent ?? null,
        targetHealthPercent: message.target?.healthPercent ?? null,
        raw: reading.raw,
        applied: reading.applied,
        prevented: reading.prevented,
        destroyed: reading.destroyed,
        procs: reading.procs,
        declared: reading.declared,
        announced,
    };
}

function lookupNamedId(roster: CombatantRoster | null, name: string): number | null {
    if (roster === null) return null;
    return lookupCombatantIdByName(roster, name);
}

/** What an announcement states about its skill rides it, unless a blow already carries it. */
function decodeSkillUsedEvent(
    message: ProtocolMessage,
    reading: MessageReading,
    isBlow: boolean,
): BattleEvent {
    const skill = reading.skill;
    assert(skill !== null, "a skill used is a skill announced");
    assert(skill.skillName.length > 0, "an announcement names something");
    return {
        kind: BATTLE_EVENT.skillUsed,
        actorId: message.actor?.combatantId ?? null,
        targetId: message.target?.combatantId ?? null,
        actorHealthPercent: message.actor?.healthPercent ?? null,
        targetHealthPercent: message.target?.healthPercent ?? null,
        skillName: skill.skillName,
        skillId: skill.skillId,
        declared: isBlow ? [] : reading.declared,
    };
}

/**
 * What a message states where no blow and no announcement carries it: a turn lost where the one
 * sentence says so, a declaration otherwise, and nothing where nothing was declared.
 */
function decodeDeclaration(
    message: ProtocolMessage,
    reading: MessageReading,
    roster: CombatantRoster | null,
    isBlow: boolean,
): BattleEvent | null {
    if (isBlow) return null;
    if (reading.skill !== null) return null;
    if (reading.declared.length === 0) return null;
    const lostBy = lookupTurnLostBy(reading.declared, roster);
    if (lostBy !== null) return { kind: BATTLE_EVENT.turnLost, combatantId: lostBy.combatantId };
    const side = message.actor ?? message.target;
    assert(reading.declared.every((one) => one.effect.length > 0), "each names its key");
    return {
        kind: BATTLE_EVENT.declaration,
        combatantId: side?.combatantId ?? null,
        healthPercent: side?.healthPercent ?? null,
        declared: reading.declared,
    };
}

/**
 * Whose turn the sentence says was spent on nothing, read by shape and never by its words: it opens
 * with a combatant's own name and the separator, and the game's other lines end in a full stop.
 * The longest name wins, so a nickname that opens another does not take its line.
 */
function lookupTurnLostBy(
    declared: readonly DeclaredEffect[],
    roster: CombatantRoster | null,
): { combatantId: number | null } | null {
    if (roster === null) return null;
    if (declared.length !== 1) return null;
    const stated = declared[0];
    if (stated === undefined) return null;
    if (stated.effect !== TEXT_KEY) return null;
    const text = stated.text;
    if (text === null) return null;
    if (text.endsWith(SENTENCE_STOP)) return null;
    assert(roster.idByName.size <= COMBATANTS_MAXIMUM, "a roster stays inside its stated bound");
    let longest: string | null = null;
    for (const [name] of roster.idByName) {
        if (!text.startsWith(name + TURN_LOST_SEPARATOR)) continue;
        if (longest === null) longest = name;
        else if (name.length > longest.length) longest = name;
    }
    if (longest === null) return null;
    assert(text.length > longest.length, "the sentence says more than the name");
    return { combatantId: lookupCombatantIdByName(roster, longest) };
}

function getNamedCombatantIds(message: ProtocolMessage): number[] {
    const found: number[] = [];
    if (message.actor !== null) found.push(message.actor.combatantId);
    if (message.target !== null) {
        if (!found.includes(message.target.combatantId)) found.push(message.target.combatantId);
    }
    assert(found.length <= ENDS_MAXIMUM, "a message names at most two ends");
    assert(new Set(found).size === found.length, "an end named twice is named once here");
    return found;
}

/**
 * The grammar of one message, `actor;target;key=value;key`: structure, and nothing about what a key
 * means. Both ends come first, each an integer combatant id optionally carrying a health
 * percentage, and `0` where the protocol named nobody. What the grammar does not cover is refused
 * as data (`docs/design.md` §6.1), and `decodeMessage` turns a refusal into a message it could not
 * read.
 */
export function parseProtocolMessage(text: string): ProtocolMessage | GrammarRefusal {
    const segments = parseProtocolMessageSegments(text);
    if (segments instanceof Error) return segments;
    const [actorSegment, targetSegment] = segments;
    assert(actorSegment !== undefined, "text always splits into at least one segment");
    const actor = parseProtocolMessageSide(actorSegment, MESSAGE_END.actor);
    if (actor instanceof Error) return actor;
    if (targetSegment === undefined) return new SideUnreadable(MESSAGE_END.target);
    const target = parseProtocolMessageSide(targetSegment, MESSAGE_END.target);
    if (target instanceof Error) return target;

    const parameters: MessageParameter[] = [];
    for (const segment of segments.slice(SIDE_SEGMENTS)) {
        const separator = segment.indexOf(VALUE_SEPARATOR);
        const key = separator === -1 ? segment : segment.slice(0, separator);
        if (key.length === 0) return new ParameterKeyEmpty(parameters.length);
        const value = separator === -1 ? null : segment.slice(separator + 1);
        parameters.push({ key, value });
    }
    assert(parameters.length + SIDE_SEGMENTS === segments.length, "no segment is dropped");
    return { actor, target, parameters };
}

/** Walked rather than `split`, so a message past the bound is refused before it is allocated. */
function parseProtocolMessageSegments(text: string): string[] | SegmentsExceeded {
    const segments: string[] = [];
    let from = 0;
    for (let look = 0; look < SEGMENTS_MAXIMUM; look += 1) {
        const separator = text.indexOf(SEGMENT_SEPARATOR, from);
        if (separator === -1) {
            segments.push(text.slice(from));
            assert(segments.length <= SEGMENTS_MAXIMUM, "a message kept is one inside the bound");
            return segments;
        }
        segments.push(text.slice(from, separator));
        from = separator + SEGMENT_SEPARATOR.length;
    }
    const count = parseProtocolMessageSegmentsCount(text, from);
    assert(count > SEGMENTS_MAXIMUM, "a message refused for its length is past the bound");
    return new SegmentsExceeded(count, SEGMENTS_MAXIMUM);
}

/** Counts without allocating: the walk is bounded by the text, one separator per step. */
function parseProtocolMessageSegmentsCount(text: string, from: number): number {
    assert(from <= text.length, "the count resumes inside the text");
    let count = SEGMENTS_MAXIMUM + 1;
    let at = text.indexOf(SEGMENT_SEPARATOR, from);
    for (let look = 0; look < text.length; look += 1) {
        if (at === -1) break;
        count += 1;
        at = text.indexOf(SEGMENT_SEPARATOR, at + SEGMENT_SEPARATOR.length);
    }
    assert(at === -1, "every separator in the text was counted");
    return count;
}

/**
 * Shape and magnitude are one refusal: an id past 2^53 read as its nearest neighbour would charge
 * damage to a combatant who does not exist.
 */
function parseProtocolMessageSide(
    segment: string,
    end: MessageEnd,
): MessageSide | null | SideUnreadable {
    if (segment === NO_COMBATANT) return null;
    const separator = segment.indexOf(VALUE_SEPARATOR);
    const idText = separator === -1 ? segment : segment.slice(0, separator);
    const combatantId = parseInteger(idText);
    if (combatantId === null) return new SideUnreadable(end);
    assert(Number.isSafeInteger(combatantId), "an id read is one held exactly");
    if (separator === -1) return { combatantId, healthPercent: null };
    const healthPercent = parseHealthPercent(segment.slice(separator + 1));
    if (healthPercent === null) return new SideUnreadable(end);
    assert(healthPercent >= 0, "a percentage the grammar accepted is never below nothing");
    return { combatantId, healthPercent };
}

/**
 * The wire text written back, so that "the parser loses nothing" is a claim a machine settles over
 * every recording. A field quietly dropped while parsing reaches a reader as a figure too low.
 */
export function encodeProtocolMessage(message: ProtocolMessage): string {
    assert(
        message.parameters.length + SIDE_SEGMENTS <= SEGMENTS_MAXIMUM,
        "a message written is one the grammar would read",
    );
    const segments = [
        encodeProtocolMessageSide(message.actor),
        encodeProtocolMessageSide(message.target),
    ];
    for (const parameter of message.parameters) {
        assert(parameter.key.length > 0, "every parameter written names its key");
        const value = parameter.value;
        segments.push(
            value === null ? parameter.key : `${parameter.key}${VALUE_SEPARATOR}${value}`,
        );
    }
    return segments.join(SEGMENT_SEPARATOR);
}

function encodeProtocolMessageSide(side: MessageSide | null): string {
    if (side === null) return NO_COMBATANT;
    const idText = formatInteger(side.combatantId);
    if (side.healthPercent === null) {
        assert(idText !== NO_COMBATANT, "a side written bare is somebody, or it reads as nobody");
        return idText;
    }
    const percentText = encodeHealthPercent(side.healthPercent);
    assert(!percentText.includes(SEGMENT_SEPARATOR), "a percentage never ends its segment");
    return `${idText}${VALUE_SEPARATOR}${percentText}`;
}
