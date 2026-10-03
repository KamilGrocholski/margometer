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
    KEY_FAMILY,
    type KeyMeaning,
    lookupKeyMeaning,
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
    announcementStanding: AnnouncementStanding;
    tables: DecoderTables;
}

export interface MessageDecoded {
    events: readonly BattleEvent[];
    announcementStanding: AnnouncementStanding;
}

export interface UnreadDetails {
    unreadCause: UnreadCause;
    keys: readonly string[];
    combatantIds: readonly number[];
    text: string;
    /** What was read beside the unread keys: a blow with a new proc keeps its damage. */
    events: readonly BattleEvent[];
    announcementStanding: AnnouncementStanding;
}

export class UnreadMessage extends Error implements UnreadDetails {
    override readonly name = "UnreadMessage";
    readonly unreadCause: UnreadCause;
    readonly keys: readonly string[];
    readonly combatantIds: readonly number[];
    readonly text: string;
    readonly events: readonly BattleEvent[];
    readonly announcementStanding: AnnouncementStanding;

    /** A message the grammar refused carries the refusal as its `cause`. */
    constructor(details: UnreadDetails, options?: { cause: GrammarRefusal }) {
        super(undefined, options);
        this.unreadCause = details.unreadCause;
        this.keys = details.keys;
        this.combatantIds = details.combatantIds;
        this.text = details.text;
        this.events = details.events;
        this.announcementStanding = details.announcementStanding;
    }
}

export interface PayloadDecoded {
    events: readonly BattleEvent[];
    unread: readonly UnreadMessage[];
    announcementStanding: AnnouncementStanding;
}

interface HealthChangeDecoded {
    source: string;
    amount: number;
    isOnTarget: boolean;
    declared: DeclaredEffect[];
}

interface NamedTargetDecoded {
    targetName: string;
    targetHealthPercent: number | null;
}

interface AnnouncementDecoded {
    skillName: string;
    skillId: number | null;
}

interface ParametersDecoded {
    raw: DamageFigure[];
    applied: DamageFigure[];
    prevented: PreventedDamage[];
    destroyed: DestroyedStatistic[];
    procs: string[];
    healthChanges: HealthChangeDecoded[];
    namedDamage: (NamedTargetDecoded & { damage: DamageFigure })[];
    namedHealing: (NamedTargetDecoded & { amount: number; source: string })[];
    unaccountedShares: { source: string; declaredShare: number }[];
    outcomes: FightOutcomeEvent[];
    declared: DeclaredEffect[];
    announcement: AnnouncementDecoded | null;
    skillName: string | null;
    skillId: number | null;
    skillKeysRead: number;
    unreadKeys: string[];
}

export interface StatedEnd {
    readonly combatantId: number;
    readonly healthPercent: number | null;
}

export interface MessageParameter {
    readonly key: string;
    /** `null` for a segment with no `=`. An empty value is `""`, which is a different thing. */
    readonly value: string | null;
}

export interface ProtocolMessage {
    readonly actor: StatedEnd | null;
    readonly target: StatedEnd | null;
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

export class EndUnreadable extends Error {
    override readonly name = "EndUnreadable";
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

export type GrammarRefusal = SegmentsExceeded | EndUnreadable | ParameterKeyEmpty;

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
    skills: readonly { id: number; blowsGrantedMinimum: number }[],
): Map<number, number> {
    const blowsGrantedBySkillId = new Map<number, number>();
    for (const skill of skills) {
        assert(skill.blowsGrantedMinimum > 0, "a skill in the table grants at least one blow");
        assert(skill.blowsGrantedMinimum < BLOWS_GRANTED_MAXIMUM, "and stays inside the bound");
        assert(!blowsGrantedBySkillId.has(skill.id), "and is named once");
        blowsGrantedBySkillId.set(skill.id, skill.blowsGrantedMinimum);
    }
    return blowsGrantedBySkillId;
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
    let announcementStanding = context.announcementStanding;
    for (const text of texts) {
        const decoded = decodeMessage(text, { ...context, announcementStanding });
        if (decoded instanceof Error) {
            events.push(...decoded.events, decodeUnknownMessageEvent(decoded));
            unread.push(decoded);
        } else {
            events.push(...decoded.events);
        }
        announcementStanding = decoded.announcementStanding;
    }
    assert(events.length >= texts.length, "every message leaves at least one event behind");
    assert(unread.length <= texts.length, "and at most one unread record");
    return { events, unread, announcementStanding };
}

function decodeUnknownMessageEvent(unread: UnreadMessage): UnknownMessageEvent {
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
            announcementStanding: null,
        }, { cause: message });
    }
    const parametersDecoded = decodeMessageParameters(message);
    const isBlow = hasAttackFigure(parametersDecoded);
    const announcedHere = decodeAnnouncedSkill(message, parametersDecoded.announcement);
    const announced = lookupAnnouncedForMessage(
        message,
        announcedHere,
        context.announcementStanding,
        isBlow,
    );
    if (!isBlow) parametersDecoded.unreadKeys.push(...parametersDecoded.procs);
    const events = decodeMessageEvents(
        message,
        parametersDecoded,
        announced,
        context.roster,
        isBlow,
    );
    const announcementStanding = composeAnnouncementStanding(context, events, announcedHere);
    assert(events.length <= message.parameters.length, "a message stays inside its bound");
    if (parametersDecoded.unreadKeys.length > 0) {
        const combatantIds = getNamedCombatantIds(message);
        const unreadCause = UNREAD_CAUSE.unknownKey;
        const keys = parametersDecoded.unreadKeys;
        return new UnreadMessage({
            unreadCause,
            keys,
            combatantIds,
            text,
            events,
            announcementStanding,
        });
    }
    if (events.length === 0) {
        const combatantIds = getNamedCombatantIds(message);
        const unreadCause = UNREAD_CAUSE.noParameter;
        return new UnreadMessage({
            unreadCause,
            keys: [],
            combatantIds,
            text,
            events,
            announcementStanding,
        });
    }
    return { events, announcementStanding };
}

/**
 * How far an announcement still reaches, one message on. ⚠️ **The chain breaks on anything that is
 * not the announcer's own blow**: a message that decoded no blow ends it, and so does another
 * combatant's.
 */
function composeAnnouncementStanding(
    context: DecodeContext,
    events: readonly BattleEvent[],
    announced: AnnouncedSkill | null,
): AnnouncementStanding {
    if (announced !== null) {
        const blowsRemaining = getBlowsForAnnouncement(announced, context.tables);
        return { announced, blowsRemaining, isGlued: true };
    }
    const announcementStanding = context.announcementStanding;
    if (announcementStanding === null) return null;
    const attack = events.find((event) => event.kind === BATTLE_EVENT.attack);
    if (attack === undefined) return null;
    if (attack.kind !== BATTLE_EVENT.attack) return null;
    if (attack.actorId !== announcementStanding.announced.actorId) return null;
    assert(
        announcementStanding.blowsRemaining > 0,
        "a standing handed on has a blow left to spend",
    );
    const blowsRemaining = announcementStanding.blowsRemaining - 1;
    assert(blowsRemaining >= 0, "a standing spends no more blows than it was given");
    if (blowsRemaining === 0) return null;
    return { announced: announcementStanding.announced, blowsRemaining, isGlued: false };
}

/**
 * The table's count where the announcement names an id; the bound where it names none. Every id any
 * announcement carried over `captures/` is one the table carries (0 exceptions of 3129,
 * 2026-09-12), and 364 of the 371 announcements without one are an NPC's.
 */
function getBlowsForAnnouncement(announced: AnnouncedSkill, tables: DecoderTables): number {
    if (announced.skillId === null) return BLOWS_GRANTED_MAXIMUM;
    const blowsGranted = tables.blowsGrantedBySkillId.get(announced.skillId) ?? 0;
    assert(blowsGranted >= 0, "a table grants nothing or more");
    assert(1 + blowsGranted <= BLOWS_GRANTED_MAXIMUM, "a reach stays inside its stated bound");
    return 1 + blowsGranted;
}

/** Every parameter is read, or named unread, and none twice. */
function decodeMessageParameters(message: ProtocolMessage): ParametersDecoded {
    const parametersDecoded: ParametersDecoded = {
        raw: [],
        applied: [],
        prevented: [],
        destroyed: [],
        procs: [],
        healthChanges: [],
        namedDamage: [],
        namedHealing: [],
        unaccountedShares: [],
        outcomes: [],
        declared: [],
        announcement: null,
        skillName: null,
        skillId: null,
        skillKeysRead: 0,
        unreadKeys: [],
    };
    for (const parameter of message.parameters) {
        const key = parameter.key;
        const keyMeaning = lookupKeyMeaning(key);
        const valueText = parameter.value;
        let isRead: boolean;
        if (keyMeaning === null) isRead = false;
        else if (valueText === null) {
            // Read a key that stands bare, or leave it unread.
            assert(key.length > 0, "a key is never empty");
            switch (keyMeaning.kind) {
                case KEY_FAMILY.proc:
                    isRead = addParameterRead(parametersDecoded.procs, key);
                    break;
                case KEY_FAMILY.fled:
                    isRead = addParameterRead(parametersDecoded.outcomes, decodeFledOutcome());
                    break;
                case KEY_FAMILY.valuelessDeclaration:
                    isRead = addParameterRead(parametersDecoded.declared, {
                        effect: key,
                        amount: null,
                        text: null,
                    });
                    break;
                default:
                    isRead = false;
            }
        } else isRead = addValuedKey(parametersDecoded, message, key, valueText, keyMeaning);
        if (!isRead) parametersDecoded.unreadKeys.push(key);
    }
    // Close the announcement: an id with no name is a skill nothing can put on screen.
    {
        assert(parametersDecoded.announcement === null, "a reading's announcement is closed once");
        assert(
            parametersDecoded.skillKeysRead >= 0,
            "a count of skill keys read never runs below nought",
        );
        if (parametersDecoded.skillName !== null) {
            parametersDecoded.announcement = {
                skillName: parametersDecoded.skillName,
                skillId: parametersDecoded.skillId,
            };
        } else if (parametersDecoded.skillKeysRead > 0) {
            parametersDecoded.unreadKeys.push(SKILL_ID_KEY);
            parametersDecoded.skillKeysRead -= 1;
        }
    }
    const parametersReadCount = countParametersRead(parametersDecoded);
    assert(
        parametersReadCount === message.parameters.length,
        "every parameter is read or named unread, once",
    );
    return parametersDecoded;
}

/** Read a valued key: a value its family cannot read leaves it unread, not asserted. */
function addValuedKey(
    parametersDecoded: ParametersDecoded,
    message: ProtocolMessage,
    key: string,
    valueText: string,
    keyMeaning: KeyMeaning,
): boolean {
    assert(key.length > 0, "a key is never empty");
    assert(message.parameters.length > 0, "a valued key stands in a message that has parameters");
    switch (keyMeaning.kind) {
        case KEY_FAMILY.damage:
        case KEY_FAMILY.prevented:
        case KEY_FAMILY.destroyed: {
            // Read a figure of the blow: no number, or one below nothing, goes unread. No key of
            // these families has stated one below nothing over `captures/` (0 of every value,
            // 2026-09-21), and a total taking it would go down.
            const amount = parseInteger(valueText);
            if (amount === null) return false;
            if (amount < 0) return false;
            assert(Number.isSafeInteger(amount), "a figure read from digits is held exactly");
            const token = parseKeyToken(key);
            if (keyMeaning.kind === KEY_FAMILY.prevented) {
                parametersDecoded.prevented.push({ defence: token, amount });
            } else if (keyMeaning.kind === KEY_FAMILY.destroyed) {
                parametersDecoded.destroyed.push({ statistic: token, amount });
            } else if (keyMeaning.half === DAMAGE_HALF.raw) {
                parametersDecoded.raw.push({ element: token, amount });
            } else parametersDecoded.applied.push({ element: token, amount });
            return true;
        }
        case KEY_FAMILY.proc:
            if (keyMeaning.doesTakeValue) return addParameterRead(parametersDecoded.procs, key);
            return false;
        case KEY_FAMILY.healthChange:
            return addParameterRead(
                parametersDecoded.healthChanges,
                decodeHealthChange(key, valueText, keyMeaning),
            );
        case KEY_FAMILY.declaration:
            return addParameterRead(parametersDecoded.declared, {
                effect: key,
                amount: parseInteger(valueText),
                text: valueText,
            });
        case KEY_FAMILY.skillName:
        case KEY_FAMILY.customSkillName: {
            // Read the skill's name: one empty or past the bound goes unread. `tcustom` names its
            // user in the target slot, so it is read only where one combatant is named.
            const isUserNamed = keyMeaning.kind === KEY_FAMILY.customSkillName
                ? doesNameOneCombatant(message)
                : true;
            if (valueText.length === 0) return false;
            if (valueText.length > NAME_LENGTH_MAXIMUM) return false;
            if (!isUserNamed) return false;
            parametersDecoded.skillName = valueText;
            parametersDecoded.skillKeysRead += 1;
            assert(
                parametersDecoded.skillKeysRead <= message.parameters.length,
                "a skill key is one of the message's",
            );
            return true;
        }
        case KEY_FAMILY.skillId:
            parametersDecoded.skillId = parseInteger(valueText);
            parametersDecoded.skillKeysRead += 1;
            return true;
        case KEY_FAMILY.outcome:
            return addParameterRead(
                parametersDecoded.outcomes,
                decodeFightOutcome(valueText, keyMeaning.result),
            );
        case KEY_FAMILY.fled:
            return addParameterRead(parametersDecoded.outcomes, decodeFledOutcome());
        case KEY_FAMILY.unaccountedHealth:
            return addParameterRead(
                parametersDecoded.unaccountedShares,
                decodeUnaccountedShare(key, valueText),
            );
        case KEY_FAMILY.namedDamage:
            return addParameterRead(parametersDecoded.namedDamage, decodeNamedDamage(valueText));
        case KEY_FAMILY.namedHealing:
            return addParameterRead(
                parametersDecoded.namedHealing,
                decodeNamedHealing(key, valueText),
            );
        case KEY_FAMILY.valuelessDeclaration:
            return false;
    }
}

function addParameterRead<Decoded>(decodedParameters: Decoded[], decoded: Decoded | null): boolean {
    if (decoded === null) return false;
    const count = decodedParameters.push(decoded);
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
function parseKeyToken(key: string): string {
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
    valueText: string,
    keyMeaning: { sign: 1 | -1; isOnTarget: boolean },
): HealthChangeDecoded | null {
    const members = valueText.split(MEMBER_SEPARATOR);
    const magnitude = parseInteger(members[0] ?? "");
    if (magnitude === null) return null;
    const declared: DeclaredEffect[] = [];
    for (const member of members.slice(1)) {
        declared.push({ effect: key, amount: parseInteger(member), text: member });
    }
    assert(declared.length < members.length, "the health figure is not a declaration");
    const amount = keyMeaning.sign * magnitude;
    return { source: key, amount, isOnTarget: keyMeaning.isOnTarget, declared };
}

/** Both ends the same, or one end unstated: there was never a second name to get wrong. */
function doesNameOneCombatant(message: ProtocolMessage): boolean {
    if (message.actor === null) return message.target !== null;
    if (message.target === null) return true;
    return message.actor.combatantId === message.target.combatantId;
}

/** `loser=?` is not a side of that name, so it is left unread rather than read as a draw. */
function decodeFightOutcome(
    valueText: string,
    outcomeResult: typeof OUTCOME_RESULT.won | typeof OUTCOME_RESULT.lost,
): FightOutcomeEvent | null {
    if (valueText.length === 0) return null;
    if (valueText === NO_WINNER) {
        if (outcomeResult === OUTCOME_RESULT.lost) return null;
        return {
            kind: BATTLE_EVENT.fightOutcome,
            result: OUTCOME_RESULT.drawn,
            combatantNames: [],
        };
    }
    const combatantNames = valueText.split(NAME_SEPARATOR);
    if (combatantNames.some((combatantName) => combatantName.length === 0)) return null;
    if (combatantNames.some((combatantName) => combatantName.startsWith(" "))) return null;
    assert(combatantNames.length > 0, "a side that is named has at least one member");
    return { kind: BATTLE_EVENT.fightOutcome, result: outcomeResult, combatantNames };
}

/** A share written with or without a fraction: `30` and `22.5` are both in `captures/`. */
function decodeUnaccountedShare(
    key: string,
    valueText: string,
): { source: string; declaredShare: number } | null {
    const declaredShare = parseDecimal(valueText);
    if (declaredShare === null) return null;
    assert(declaredShare >= 0, "a share read is never below nothing");
    return { source: key, declaredShare };
}

function decodeNamedDamage(
    valueText: string,
): (NamedTargetDecoded & { damage: DamageFigure }) | null {
    const members = valueText.split(MEMBER_SEPARATOR);
    if (members.length !== NAMED_DAMAGE_MEMBERS) return null;
    const [amountText = "", elementText = "", namedText = ""] = members;
    const amount = parseInteger(amountText);
    if (amount === null) return null;
    if (amount < 0) return null;
    const named = parseNamedTarget(namedText);
    if (named === null) return null;
    const damage = { element: `${DAMAGE_ELEMENT_PREFIX}${elementText.trim()}`, amount };
    assert(damage.element.startsWith(DAMAGE_ELEMENT_PREFIX), "an element named is of the family");
    assert(named.targetName.length > 0, "a figure stated against a name has a name");
    return { ...named, damage };
}

/** `Gracz 1(63.00%)`: the name runs to the last opener, so a name may hold one of its own. */
function parseNamedTarget(text: string): NamedTargetDecoded | null {
    if (!text.endsWith(PERCENT_CLOSER)) return null;
    const openerIndex = text.lastIndexOf(PERCENT_OPENER);
    if (openerIndex <= 0) return null;
    const targetName = text.slice(0, openerIndex);
    const percentText = text.slice(openerIndex + PERCENT_OPENER.length, -PERCENT_CLOSER.length);
    assert(targetName.length > 0, "a stated name says something");
    assert(percentText.length < text.length, "a percentage is shorter than what carried it");
    return { targetName, targetHealthPercent: parseHealthPercent(percentText) };
}

/** Healing that took health away would be this reader misreading its key, not a loss reported. */
function decodeNamedHealing(
    key: string,
    valueText: string,
): (NamedTargetDecoded & { amount: number; source: string }) | null {
    const members = valueText.split(MEMBER_SEPARATOR);
    if (members.length !== NAMED_HEALING_MEMBERS) return null;
    const [amountText = "", namedText = ""] = members;
    const amount = parseInteger(amountText);
    if (amount === null) return null;
    if (amount < 0) return null;
    const named = parseNamedTarget(namedText);
    if (named === null) return null;
    assert(named.targetName.length > 0, "the healed is named inside the value");
    assert(Number.isSafeInteger(amount), "healing read from digits is held exactly");
    return { ...named, amount, source: key };
}

function countParametersRead(parametersDecoded: ParametersDecoded): number {
    return parametersDecoded.raw.length + parametersDecoded.applied.length +
        parametersDecoded.prevented.length +
        parametersDecoded.destroyed.length + parametersDecoded.procs.length +
        parametersDecoded.healthChanges.length +
        parametersDecoded.namedDamage.length + parametersDecoded.namedHealing.length +
        parametersDecoded.unaccountedShares.length +
        parametersDecoded.outcomes.length + parametersDecoded.declared.length +
        parametersDecoded.skillKeysRead + parametersDecoded.unreadKeys.length;
}

function hasAttackFigure(parametersDecoded: ParametersDecoded): boolean {
    if (parametersDecoded.raw.length > 0) return true;
    if (parametersDecoded.applied.length > 0) return true;
    if (parametersDecoded.prevented.length > 0) return true;
    return parametersDecoded.destroyed.length > 0;
}

/**
 * The announcement an effect rides: the message's own where it carries one, the one before it
 * otherwise and only for its own actor. ⚠️ **Past the message the client glues it to, a standing
 * reaches a blow and nothing else**: a poison tick on the announcer picked up `Kosa zastępcy` in
 * `2026-08-12-tempest-grupa-vs-draugr-2`, and a heal there would have been credited to it.
 */
function lookupAnnouncedForMessage(
    message: ProtocolMessage,
    announcedHere: AnnouncedSkill | null,
    announcementStanding: AnnouncementStanding,
    isBlow: boolean,
): AnnouncedSkill | null {
    if (announcedHere !== null) return announcedHere;
    if (announcementStanding === null) return null;
    const announced = announcementStanding.announced;
    if (announced.actorId === null) return null;
    if (message.actor === null) return null;
    if (message.actor.combatantId !== announced.actorId) return null;
    assert(
        announcementStanding.blowsRemaining > 0,
        "a standing announcement has a message left to reach",
    );
    if (announcementStanding.isGlued) return announced;
    if (isBlow) return announced;
    return null;
}

function decodeAnnouncedSkill(
    message: ProtocolMessage,
    skill: AnnouncementDecoded | null,
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
    parametersDecoded: ParametersDecoded,
    announced: AnnouncedSkill | null,
    roster: CombatantRoster | null,
    isBlow: boolean,
): BattleEvent[] {
    const events: BattleEvent[] = [];
    if (isBlow) events.push(decodeAttackEvent(message, parametersDecoded, announced));
    for (const moved of parametersDecoded.healthChanges) {
        const statedEnd = moved.isOnTarget ? message.target : message.actor;
        events.push({
            kind: BATTLE_EVENT.healthChange,
            combatantId: statedEnd?.combatantId ?? null,
            amount: moved.amount,
            healthPercent: statedEnd?.healthPercent ?? null,
            source: moved.source,
            declared: moved.declared,
            announced,
        });
    }
    for (const named of parametersDecoded.namedDamage) {
        events.push({
            kind: BATTLE_EVENT.damageToNamedCombatant,
            actorId: message.actor?.combatantId ?? null,
            targetName: named.targetName,
            targetId: lookupNamedCombatantId(roster, named.targetName),
            targetHealthPercent: named.targetHealthPercent,
            damage: named.damage,
            announced,
        });
    }
    for (const unaccounted of parametersDecoded.unaccountedShares) {
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
    if (parametersDecoded.announcement !== null) {
        events.push(decodeSkillUsedEvent(message, parametersDecoded, isBlow));
    }
    for (const restored of parametersDecoded.namedHealing) {
        events.push({
            kind: BATTLE_EVENT.healingToNamedCombatant,
            targetName: restored.targetName,
            targetId: lookupNamedCombatantId(roster, restored.targetName),
            targetHealthPercent: restored.targetHealthPercent,
            amount: restored.amount,
            source: restored.source,
        });
    }
    events.push(...parametersDecoded.outcomes);
    const declaration = decodeDeclaration(message, parametersDecoded, roster, isBlow);
    if (declaration !== null) events.push(declaration);
    assert(events.length >= parametersDecoded.outcomes.length, "every outcome read is an event");
    assert(events.length <= message.parameters.length, "no parameter makes two events");
    return events;
}

function decodeAttackEvent(
    message: ProtocolMessage,
    parametersDecoded: ParametersDecoded,
    announced: AnnouncedSkill | null,
): AttackEvent {
    assert(hasAttackFigure(parametersDecoded), "an attack states a figure");
    assert(
        parametersDecoded.procs.length <= message.parameters.length,
        "an event stays inside its bound",
    );
    return {
        kind: BATTLE_EVENT.attack,
        actorId: message.actor?.combatantId ?? null,
        targetId: message.target?.combatantId ?? null,
        actorHealthPercent: message.actor?.healthPercent ?? null,
        targetHealthPercent: message.target?.healthPercent ?? null,
        raw: parametersDecoded.raw,
        applied: parametersDecoded.applied,
        prevented: parametersDecoded.prevented,
        destroyed: parametersDecoded.destroyed,
        procs: parametersDecoded.procs,
        declared: parametersDecoded.declared,
        announced,
    };
}

function lookupNamedCombatantId(roster: CombatantRoster | null, name: string): number | null {
    if (roster === null) return null;
    return lookupCombatantIdByName(roster, name);
}

/** What an announcement states about its skill rides it, unless a blow already carries it. */
function decodeSkillUsedEvent(
    message: ProtocolMessage,
    parametersDecoded: ParametersDecoded,
    isBlow: boolean,
): BattleEvent {
    const skill = parametersDecoded.announcement;
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
        declared: isBlow ? [] : parametersDecoded.declared,
    };
}

/**
 * What a message states where no blow and no announcement carries it: a turn lost where the one
 * sentence says so, a declaration otherwise, and nothing where nothing was declared.
 */
function decodeDeclaration(
    message: ProtocolMessage,
    parametersDecoded: ParametersDecoded,
    roster: CombatantRoster | null,
    isBlow: boolean,
): BattleEvent | null {
    if (isBlow) return null;
    if (parametersDecoded.announcement !== null) return null;
    if (parametersDecoded.declared.length === 0) return null;
    const turnLost = lookupTurnLostBy(parametersDecoded.declared, roster);
    if (turnLost !== null) {
        return { kind: BATTLE_EVENT.turnLost, combatantId: turnLost.combatantId };
    }
    const statedEnd = message.actor ?? message.target;
    assert(
        parametersDecoded.declared.every((declaredEffect) => declaredEffect.effect.length > 0),
        "each names its key",
    );
    return {
        kind: BATTLE_EVENT.declaration,
        combatantId: statedEnd?.combatantId ?? null,
        healthPercent: statedEnd?.healthPercent ?? null,
        declared: parametersDecoded.declared,
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
    const declaredEffect = declared[0];
    if (declaredEffect === undefined) return null;
    if (declaredEffect.effect !== TEXT_KEY) return null;
    const text = declaredEffect.text;
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
    const namedCombatantIds: number[] = [];
    if (message.actor !== null) namedCombatantIds.push(message.actor.combatantId);
    if (message.target !== null) {
        if (!namedCombatantIds.includes(message.target.combatantId)) {
            namedCombatantIds.push(message.target.combatantId);
        }
    }
    assert(namedCombatantIds.length <= ENDS_MAXIMUM, "a message names at most two ends");
    assert(
        new Set(namedCombatantIds).size === namedCombatantIds.length,
        "an end named twice is named once here",
    );
    return namedCombatantIds;
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
    const actor = parseProtocolMessageEnd(actorSegment, MESSAGE_END.actor);
    if (actor instanceof Error) return actor;
    if (targetSegment === undefined) return new EndUnreadable(MESSAGE_END.target);
    const target = parseProtocolMessageEnd(targetSegment, MESSAGE_END.target);
    if (target instanceof Error) return target;

    const parameters: MessageParameter[] = [];
    for (const segment of segments.slice(SIDE_SEGMENTS)) {
        const separatorIndex = segment.indexOf(VALUE_SEPARATOR);
        const key = separatorIndex === -1 ? segment : segment.slice(0, separatorIndex);
        if (key.length === 0) return new ParameterKeyEmpty(parameters.length);
        const valueText = separatorIndex === -1 ? null : segment.slice(separatorIndex + 1);
        parameters.push({ key, value: valueText });
    }
    assert(parameters.length + SIDE_SEGMENTS === segments.length, "no segment is dropped");
    return { actor, target, parameters };
}

/** Walked rather than `split`, so a message past the bound is refused before it is allocated. */
function parseProtocolMessageSegments(text: string): string[] | SegmentsExceeded {
    const segments: string[] = [];
    let from = 0;
    for (let look = 0; look < SEGMENTS_MAXIMUM; look += 1) {
        const separatorIndex = text.indexOf(SEGMENT_SEPARATOR, from);
        if (separatorIndex === -1) {
            segments.push(text.slice(from));
            assert(segments.length <= SEGMENTS_MAXIMUM, "a message kept is one inside the bound");
            return segments;
        }
        segments.push(text.slice(from, separatorIndex));
        from = separatorIndex + SEGMENT_SEPARATOR.length;
    }
    const count = countProtocolMessageSegments(text, from);
    assert(count > SEGMENTS_MAXIMUM, "a message refused for its length is past the bound");
    return new SegmentsExceeded(count, SEGMENTS_MAXIMUM);
}

/** Counts without allocating: the walk is bounded by the text, one separator per step. */
function countProtocolMessageSegments(text: string, from: number): number {
    assert(from <= text.length, "the count resumes inside the text");
    let count = SEGMENTS_MAXIMUM + 1;
    let separatorIndex = text.indexOf(SEGMENT_SEPARATOR, from);
    for (let look = 0; look < text.length; look += 1) {
        if (separatorIndex === -1) break;
        count += 1;
        separatorIndex = text.indexOf(SEGMENT_SEPARATOR, separatorIndex + SEGMENT_SEPARATOR.length);
    }
    assert(separatorIndex === -1, "every separator in the text was counted");
    return count;
}

/**
 * Shape and magnitude are one refusal: an id past 2^53 read as its nearest neighbour would charge
 * damage to a combatant who does not exist.
 */
function parseProtocolMessageEnd(
    segment: string,
    end: MessageEnd,
): StatedEnd | null | EndUnreadable {
    if (segment === NO_COMBATANT) return null;
    const separatorIndex = segment.indexOf(VALUE_SEPARATOR);
    const idText = separatorIndex === -1 ? segment : segment.slice(0, separatorIndex);
    const combatantId = parseInteger(idText);
    if (combatantId === null) return new EndUnreadable(end);
    assert(Number.isSafeInteger(combatantId), "an id read is one held exactly");
    if (separatorIndex === -1) return { combatantId, healthPercent: null };
    const healthPercent = parseHealthPercent(segment.slice(separatorIndex + 1));
    if (healthPercent === null) return new EndUnreadable(end);
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
        encodeProtocolMessageEnd(message.actor),
        encodeProtocolMessageEnd(message.target),
    ];
    for (const parameter of message.parameters) {
        assert(parameter.key.length > 0, "every parameter written names its key");
        const valueText = parameter.value;
        segments.push(
            valueText === null ? parameter.key : `${parameter.key}${VALUE_SEPARATOR}${valueText}`,
        );
    }
    return segments.join(SEGMENT_SEPARATOR);
}

function encodeProtocolMessageEnd(statedEnd: StatedEnd | null): string {
    if (statedEnd === null) return NO_COMBATANT;
    const idText = formatInteger(statedEnd.combatantId);
    if (statedEnd.healthPercent === null) {
        assert(idText !== NO_COMBATANT, "an end written bare is somebody, or it reads as nobody");
        return idText;
    }
    const percentText = encodeHealthPercent(statedEnd.healthPercent);
    assert(!percentText.includes(SEGMENT_SEPARATOR), "a percentage never ends its segment");
    return `${idText}${VALUE_SEPARATOR}${percentText}`;
}
