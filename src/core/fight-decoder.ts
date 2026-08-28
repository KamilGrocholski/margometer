/**
 * Messages to what happened. The families below are the client's own and each is cited in
 * `docs/protocol-keys.md`; nothing is read because it looks like a number.
 *
 * The decoder drops nothing and invents nothing: a key with no meaning yet leaves the message
 * on an unknown event, keys and ends included, so a panel can say which total may be short.
 */

import { assert } from "@std/assert";
import type {
    AnnouncedSkill,
    AttackEvent,
    BattleEvent,
    DamageFigure,
    DamageToNamedCombatantEvent,
    DeclarationEvent,
    DeclaredEffect,
    DestroyedStatistic,
    FightOutcomeEvent,
    HealthChangeEvent,
    PreventedDamage,
    SkillUsedEvent,
} from "@/src/core/battle-event.ts";
import { MargoMeterError } from "@/src/core/margometer-error.ts";
import { type CombatantRoster, getCombatantIdByName } from "@/src/core/combatant-roster.ts";
import { parseProtocolMessage, type ProtocolMessage } from "@/src/core/protocol-message.ts";
import { getHealthPercentFromText, getIntegerFromText } from "@/src/core/protocol-number.ts";

/**
 * The client's default branch reads characters 1 to 3 of a key: `+` is raw, the rest applied.
 */
const DAMAGE_MARKER = "dmg";
const DAMAGE_MARKER_AT = 1;
const RAW_SIGN = "+";
const APPLIED_SIGN = "-";
/** The one pair the family rule cannot reach, because the key carries no marker. */
const DAMAGE_KEYS = ["+thirdatt", "-thirdatt"];
const PREVENTED_KEYS = ["-absorb", "-absorbm", "-blok"];
const DESTROYED_KEYS = ["+acdmg", "+resdmg", "+abdest_per", "+abmdest_per"];
const PROC_KEYS = [
    "+crit",
    "+of_crit",
    "+pierce",
    "-pierceb",
    "+stun",
    "+stun2",
    "+stun2-c",
    "+stun2-d",
    "+freeze",
    "+wound",
    "+fastarrow",
    "+acdmg_destroyed",
    "+legbon_curse",
    "+legbon_verycrit",
    "-legbon_cleanse",
    "-legbon_glare",
    "+superspell-dispel",
    "-tenacity",
    "-evade",
    "-contra",
];
/**
 * Health moving outside a blow: which way it goes, and which slot holds the combatant it
 * happens to. Both are ours to supply — the protocol states a magnitude and leaves the rest to
 * the key, and `docs/protocol-keys.md` carries the evidence per key. `injure` and `+injure` are
 * different keys and only this one moves health.
 */
const HEALTH_CHANGE_KEYS: Record<string, { sign: number; isOnTarget: boolean }> = {
    heal: { sign: 1, isOnTarget: false },
    legbon_holytouch_heal: { sign: 1, isOnTarget: false },
    heal_target: { sign: 1, isOnTarget: true },
    npc_heal: { sign: 1, isOnTarget: false },
    bandage: { sign: 1, isOnTarget: false },
    poison: { sign: -1, isOnTarget: false },
    injure: { sign: -1, isOnTarget: false },
    wound: { sign: -1, isOnTarget: false },
    fire: { sign: -1, isOnTarget: false },
    light: { sign: -1, isOnTarget: false },
    anguish: { sign: -1, isOnTarget: false },
};
/** This family may state a second member after the health figure. It is not health. */
const MEMBER_SEPARATOR = ",";
/**
 * Damage stated against a name: `amount,element,name(percent%)`. The middle member is what the
 * client writes into a class attribute after `dmg`, so a blank one is the plain element and not
 * an element of its own — 314 of the 1131 occurrences in `captures/` write it blank, 2026-08-28.
 */
const NAMED_DAMAGE_KEY = "+oth_dmg";
const NAMED_DAMAGE_MEMBERS = 3;
const PERCENT_OPENER = "(";
const PERCENT_CLOSER = "%)";
/**
 * The sides at the end of the fight, as text: names separated by a comma and a space, in a
 * message naming no combatant at all. Every recording in `captures/` ends with exactly one of
 * each, 2026-08-28.
 */
const OUTCOME_KEYS: Record<string, "won" | "lost"> = { winner: "won", loser: "lost" };
/** A fight nobody won, which the protocol states on the winners' key and never on the losers'. */
const NO_WINNER = "?";
const NAME_SEPARATOR = ", ";
const SKILL_NAME_KEY = "tspell";
/**
 * The other way an announcement names what was used, and the name sits in the target slot. Read
 * only where the message names one combatant, so nothing has to guess whose use it was.
 */
const CUSTOM_SKILL_NAME_KEY = "tcustom";
const SKILL_ID_KEY = "skillId";
/**
 * Keys stating something no total here counts: an input, an outcome in a unit this meter does
 * not keep, or one outside the fight. Every member is an entry in `docs/protocol-keys.md`, and
 * the test a key must pass to be here is not "we understand it" — it is whether whatever the
 * figure did is reported elsewhere, in a unit no total keeps, or outside the fight.
 */
const DECLARATION_KEYS = [
    "+absorb",
    "+absorbm",
    "+critpoison_per",
    "+critsa",
    "+critslow_per",
    "+crush_physical",
    "+engback",
    "+exp",
    "+injure",
    "+legbon_puncture",
    "+ph",
    "+rage",
    "+taken_dmg",
    "-endest",
    "-legbon_critred",
    "-legbon_facade",
    "-poison_lowdmg_per",
    "active_absorbdest_per",
    "active_block_per",
    "active_decblock_per",
    "active_decblock_per-enemies",
    "afterheal",
    "alllowdmg",
    "allslow_per",
    "aura-ac_per",
    "aura-adddmg2_per-meele",
    "aura-resall",
    "aura-sa_per",
    "combo-max",
    "critmval-allies",
    "critval-allies",
    "en-regen",
    "energy",
    "lowheal_per-enemies",
    "mana",
    "poison_lowdmg_per-enemies",
    "prepare",
    "shout",
    "txt",
];
/**
 * The same, stating the key and nothing else — and read **only** while they carry none. The
 * client composes `+legbon_holytouch` with a hole for a figure, so it is a declaration whose
 * figure is absent rather than a proc, and one arriving with a value goes back to unread.
 */
const VALUELESS_DECLARATION_KEYS = [
    "+legbon_anguish",
    "+legbon_holytouch",
    "+spell-taken_dmg-all",
    "en-regen-cast",
    "removedot-allies",
    "removeslow-allies",
    "removestun-allies",
    "step",
];
/** The longest message list in one payload of `captures/` holds 627, 2026-08-28. */
const MAXIMUM_MESSAGES = 4096;
/** The longest message in `captures/` carries 40 parameters, 2026-08-28. */
const MAXIMUM_PARAMETERS = 512;
const UNREAD_REASON = "keys with no meaning yet";
const EMPTY_REASON = "a message stating no parameter";

interface HealthChangeReading {
    source: string;
    amount: number;
    isOnTarget: boolean;
    declared: DeclaredEffect[];
}

interface NamedDamageReading {
    targetName: string;
    targetHealthPercent: number | null;
    damage: DamageFigure;
}

interface SkillReading {
    skillName: string;
    skillId: number | null;
}

interface AttackReading {
    raw: DamageFigure[];
    applied: DamageFigure[];
    prevented: PreventedDamage[];
    destroyed: DestroyedStatistic[];
    procs: string[];
    healthChanges: HealthChangeReading[];
    namedDamage: NamedDamageReading[];
    outcomes: FightOutcomeEvent[];
    declared: DeclaredEffect[];
    skill: SkillReading | null;
    skillName: string | null;
    skillId: number | null;
    skillKeys: number;
    unreadKeys: string[];
}

function isDamageKey(key: string): boolean {
    assert(key.length > 0, "a key is never empty");
    if (DAMAGE_KEYS.includes(key)) return true;
    return key.slice(DAMAGE_MARKER_AT, DAMAGE_MARKER_AT + DAMAGE_MARKER.length) === DAMAGE_MARKER;
}

/** The client's own token: the key with its sign taken off. */
function getTokenFromKey(key: string): string {
    assert(key.length > 0, "a key is never empty");
    if (key.startsWith(RAW_SIGN)) return key.slice(1);
    if (key.startsWith(APPLIED_SIGN)) return key.slice(1);
    assert(!key.startsWith(RAW_SIGN), "a token carries no sign of its own");
    return key;
}

/**
 * The figure, then whatever the key stated beside it. Null where the health figure itself is not
 * a number, which leaves the key unread rather than read as nothing.
 */
function readHealthChange(key: string, value: string): HealthChangeReading | null {
    const stated = HEALTH_CHANGE_KEYS[key];
    if (stated === undefined) return null;
    const members = value.split(MEMBER_SEPARATOR);
    const first = members[0];
    if (first === undefined) return null;
    const magnitude = getIntegerFromText(first);
    if (magnitude === null) return null;
    const declared: DeclaredEffect[] = [];
    for (const member of members.slice(1)) {
        declared.push({ effect: key, amount: getIntegerFromText(member), text: member });
    }
    assert(declared.length < members.length, "the health figure is not a declaration");
    assert(Number.isSafeInteger(magnitude), "a health figure read from digits is a whole number");
    return {
        source: key,
        amount: stated.sign * magnitude,
        isOnTarget: stated.isOnTarget,
        declared,
    };
}

/** Both ends the same, or one end unstated: there was never a second name to get wrong. */
function namesOneCombatant(parsed: ProtocolMessage): boolean {
    if (parsed.actor === null) return parsed.target !== null;
    if (parsed.target === null) return true;
    return parsed.actor.combatantId === parsed.target.combatantId;
}

function readSkillName(key: string, value: string, parsed: ProtocolMessage): string | null {
    assert(value.length >= 0, "a value is text, however short");
    if (key === SKILL_NAME_KEY) return value;
    if (key !== CUSTOM_SKILL_NAME_KEY) return null;
    if (!namesOneCombatant(parsed)) return null;
    assert(key === CUSTOM_SKILL_NAME_KEY, "only the custom key reaches the rule above");
    return value;
}

/** `Gracz 1(63.00%)` — the name runs to the last opener, so a name may hold one of its own. */
function readNamedTarget(text: string): { name: string; healthPercent: number | null } | null {
    if (!text.endsWith(PERCENT_CLOSER)) return null;
    const opener = text.lastIndexOf(PERCENT_OPENER);
    if (opener <= 0) return null;
    const name = text.slice(0, opener);
    assert(name.length > 0, "a stated name says something");
    const percentText = text.slice(opener + 1, text.length - PERCENT_CLOSER.length);
    assert(percentText.length < text.length, "a percentage is shorter than what carried it");
    return { name, healthPercent: getHealthPercentFromText(percentText) };
}

function readNamedDamage(key: string, value: string): NamedDamageReading | null {
    if (key !== NAMED_DAMAGE_KEY) return null;
    const members = value.split(MEMBER_SEPARATOR);
    if (members.length !== NAMED_DAMAGE_MEMBERS) return null;
    const [amountText, element, statedTarget] = members;
    if (amountText === undefined) return null;
    if (element === undefined) return null;
    if (statedTarget === undefined) return null;
    const amount = getIntegerFromText(amountText);
    if (amount === null) return null;
    const named = readNamedTarget(statedTarget);
    if (named === null) return null;
    assert(Number.isSafeInteger(amount), "a figure stated against a name is a whole number");
    return {
        targetName: named.name,
        targetHealthPercent: named.healthPercent,
        damage: { element: `${DAMAGE_MARKER}${element.trim()}`, amount },
    };
}

/** `loser=?` is not a side of that name, so it is left unread rather than read as a draw. */
function readFightOutcome(key: string, value: string): FightOutcomeEvent | null {
    const result = OUTCOME_KEYS[key];
    if (result === undefined) return null;
    if (value.length === 0) return null;
    if (value === NO_WINNER) {
        if (result === "lost") return null;
        return { kind: "fight-outcome", result: "drawn", combatantNames: [] };
    }
    const combatantNames = value.split(NAME_SEPARATOR);
    assert(combatantNames.length > 0, "a side that is named has at least one member");
    assert(combatantNames.every((one) => one.length > 0), "a member of a side is named");
    assert(combatantNames.every((one) => !one.startsWith(" ")), "a name carries no separator");
    return { kind: "fight-outcome", result, combatantNames };
}

function addValuelessKey(reading: AttackReading, key: string): void {
    assert(key.length > 0, "a key is never empty");
    if (PROC_KEYS.includes(key)) {
        reading.procs.push(key);
        return;
    }
    if (VALUELESS_DECLARATION_KEYS.includes(key)) {
        reading.declared.push({ effect: key, amount: null, text: null });
        return;
    }
    assert(!PROC_KEYS.includes(key), "a proc never reaches the unread branch");
    reading.unreadKeys.push(key);
}

/** True where the key was one of the announcement's two halves, and the reading took it. */
function addSkillKey(
    reading: AttackReading,
    key: string,
    value: string,
    parsed: ProtocolMessage,
): boolean {
    const named = readSkillName(key, value, parsed);
    if (named !== null) {
        reading.skillName = named;
        reading.skillKeys += 1;
        return true;
    }
    assert(key !== SKILL_NAME_KEY, "a name is read once, above");
    if (key !== SKILL_ID_KEY) return false;
    reading.skillId = getIntegerFromText(value);
    reading.skillKeys += 1;
    return true;
}

/** An id with no name is a skill nothing can put on screen, and the protocol has never sent one. */
function closeSkillReading(reading: AttackReading): void {
    assert(reading.skill === null, "a reading's announcement is closed once");
    assert(reading.skillKeys >= 0, "a key is counted once");
    if (reading.skillName !== null) {
        reading.skill = { skillName: reading.skillName, skillId: reading.skillId };
        return;
    }
    if (reading.skillKeys === 0) return;
    reading.unreadKeys.push(SKILL_ID_KEY);
    reading.skillKeys -= 1;
}

function addAttackFigure(reading: AttackReading, key: string, amount: number): void {
    const token = getTokenFromKey(key);
    assert(token.length > 0, "a figure carries the client's own token");
    if (isDamageKey(key)) {
        if (key.startsWith(RAW_SIGN)) reading.raw.push({ element: token, amount });
        else reading.applied.push({ element: token, amount });
        return;
    }
    if (PREVENTED_KEYS.includes(key)) {
        reading.prevented.push({ defence: token, amount });
        return;
    }
    if (DESTROYED_KEYS.includes(key)) {
        reading.destroyed.push({ statistic: token, amount });
        return;
    }
    assert(!isDamageKey(key), "a damage key never reaches the unread branch");
    reading.unreadKeys.push(key);
}

function composeAttackReading(parsed: ProtocolMessage): AttackReading {
    const parameters = parsed.parameters;
    assert(parameters.length <= MAXIMUM_PARAMETERS, "a message stays inside its stated bound");
    const reading: AttackReading = {
        raw: [],
        applied: [],
        prevented: [],
        destroyed: [],
        procs: [],
        healthChanges: [],
        namedDamage: [],
        outcomes: [],
        declared: [],
        skill: null,
        skillName: null,
        skillId: null,
        skillKeys: 0,
        unreadKeys: [],
    };
    for (const parameter of parameters) {
        if (parameter.value === null) {
            addValuelessKey(reading, parameter.key);
            continue;
        }
        if (addSkillKey(reading, parameter.key, parameter.value, parsed)) continue;
        const outcome = readFightOutcome(parameter.key, parameter.value);
        if (outcome !== null) {
            reading.outcomes.push(outcome);
            continue;
        }
        if (DECLARATION_KEYS.includes(parameter.key)) {
            const amount = getIntegerFromText(parameter.value);
            reading.declared.push({ effect: parameter.key, amount, text: parameter.value });
            continue;
        }
        const namedHit = readNamedDamage(parameter.key, parameter.value);
        if (namedHit !== null) {
            reading.namedDamage.push(namedHit);
            continue;
        }
        const moved = readHealthChange(parameter.key, parameter.value);
        if (moved !== null) {
            reading.healthChanges.push(moved);
            continue;
        }
        const amount = getIntegerFromText(parameter.value);
        if (amount === null) {
            reading.unreadKeys.push(parameter.key);
            continue;
        }
        addAttackFigure(reading, parameter.key, amount);
    }
    closeSkillReading(reading);
    const read = reading.raw.length + reading.applied.length + reading.prevented.length +
        reading.destroyed.length + reading.procs.length + reading.healthChanges.length +
        reading.namedDamage.length + reading.outcomes.length + reading.declared.length +
        reading.skillKeys + reading.unreadKeys.length;
    assert(read === parameters.length, "every parameter is read or named unread, and none twice");
    assert(reading.raw.length <= parameters.length, "a reading holds no more than it was handed");
    return reading;
}

function hasAttackFigure(reading: AttackReading): boolean {
    if (reading.raw.length > 0) return true;
    if (reading.applied.length > 0) return true;
    if (reading.prevented.length > 0) return true;
    assert(reading.destroyed.length <= MAXIMUM_PARAMETERS, "a reading stays inside its bound");
    return reading.destroyed.length > 0;
}

function getNamedCombatantIds(parsed: ProtocolMessage): number[] {
    const found: number[] = [];
    if (parsed.actor !== null) found.push(parsed.actor.combatantId);
    if (parsed.target !== null) {
        if (!found.includes(parsed.target.combatantId)) found.push(parsed.target.combatantId);
    }
    assert(found.length <= 2, "a message names at most two ends");
    assert(new Set(found).size === found.length, "an end that is named twice is named once here");
    return found;
}

function composeNamedDamageEvent(
    parsed: ProtocolMessage,
    named: NamedDamageReading,
    roster: CombatantRoster | null,
    announced: AnnouncedSkill | null,
): DamageToNamedCombatantEvent {
    assert(named.targetName.length > 0, "a figure stated against a name has a name");
    assert(named.damage.amount >= 0, "damage stated against a name is never below nothing");
    return {
        kind: "damage-to-named-combatant",
        actorId: parsed.actor?.combatantId ?? null,
        targetName: named.targetName,
        targetId: roster === null ? null : getCombatantIdByName(roster, named.targetName),
        targetHealthPercent: named.targetHealthPercent,
        damage: named.damage,
        announced,
    };
}

function composeSkillUsedEvent(
    parsed: ProtocolMessage,
    skill: SkillReading,
    declared: DeclaredEffect[],
): SkillUsedEvent {
    assert(skill.skillName.length > 0, "an announcement names something");
    assert(skill.skillId === null || Number.isSafeInteger(skill.skillId), "an id is whole");
    return {
        kind: "skill-used",
        actorId: parsed.actor?.combatantId ?? null,
        targetId: parsed.target?.combatantId ?? null,
        actorHealthPercent: parsed.actor?.healthPercent ?? null,
        targetHealthPercent: parsed.target?.healthPercent ?? null,
        skillName: skill.skillName,
        skillId: skill.skillId,
        declared,
    };
}

/** The announcement standing over a message is the one before it, and only for its own actor. */
function getAnnouncedForMessage(
    parsed: ProtocolMessage,
    standing: AnnouncedSkill | null,
): AnnouncedSkill | null {
    if (standing === null) return null;
    if (standing.actorId === null) return null;
    if (parsed.actor === null) return null;
    if (parsed.actor.combatantId !== standing.actorId) return null;
    assert(standing.skillName.length > 0, "a standing announcement names something");
    assert(parsed.actor.combatantId === standing.actorId, "one actor holds both halves");
    return standing;
}

function composeAttackEvent(
    parsed: ProtocolMessage,
    reading: AttackReading,
    announced: AnnouncedSkill | null,
    declared: DeclaredEffect[],
): AttackEvent {
    assert(hasAttackFigure(reading), "an attack states a figure");
    assert(reading.unreadKeys.length <= MAXIMUM_PARAMETERS, "an event stays inside its bound");
    return {
        kind: "attack",
        actorId: parsed.actor?.combatantId ?? null,
        targetId: parsed.target?.combatantId ?? null,
        actorHealthPercent: parsed.actor?.healthPercent ?? null,
        targetHealthPercent: parsed.target?.healthPercent ?? null,
        raw: reading.raw,
        applied: reading.applied,
        prevented: reading.prevented,
        destroyed: reading.destroyed,
        procs: reading.procs,
        declared,
        announced,
    };
}

function composeHealthChangeEvent(
    parsed: ProtocolMessage,
    moved: HealthChangeReading,
    announced: AnnouncedSkill | null,
): HealthChangeEvent {
    const side = moved.isOnTarget ? parsed.target : parsed.actor;
    assert(Number.isSafeInteger(moved.amount), "a health movement is a whole number");
    assert(moved.source.length > 0, "a movement names the key it was stated on");
    return {
        kind: "health-change",
        combatantId: side?.combatantId ?? null,
        amount: moved.amount,
        healthPercent: side?.healthPercent ?? null,
        source: moved.source,
        declared: moved.declared,
        announced,
    };
}

interface MessageDecoding {
    events: BattleEvent[];
    /** What this message announces to the next one, where it announces anything. */
    announced: AnnouncedSkill | null;
}

function decodeOneMessage(
    message: string,
    standing: AnnouncedSkill | null,
    roster: CombatantRoster | null,
): MessageDecoding {
    assert(message.length > 0, "a message to decode is never empty");
    let parsed: ProtocolMessage;
    try {
        parsed = parseProtocolMessage(message);
    } catch (failure) {
        if (!(failure instanceof MargoMeterError)) throw failure;
        const refused: BattleEvent = {
            kind: "unknown-message",
            message,
            reason: failure.message,
            unreadKeys: [],
            combatantIds: [],
        };
        return { events: [refused], announced: null };
    }
    const reading = composeAttackReading(parsed);
    const announced = getAnnouncedForMessage(parsed, standing);
    const events: BattleEvent[] = [];
    // A proc rides a blow in every message in `captures/` that carries one, 2026-08-28. Where no
    // figure stands beside it the key is not read as one: a proc alone would be a claim this
    // decoder cannot make.
    const isBlow = hasAttackFigure(reading);
    const declaredElsewhere = isBlow || reading.skill !== null;
    if (!isBlow) reading.unreadKeys.push(...reading.procs);
    else events.push(composeAttackEvent(parsed, reading, announced, reading.declared));
    for (const moved of reading.healthChanges) {
        events.push(composeHealthChangeEvent(parsed, moved, announced));
    }
    for (const named of reading.namedDamage) {
        events.push(composeNamedDamageEvent(parsed, named, roster, announced));
    }
    if (reading.skill !== null) {
        events.push(composeSkillUsedEvent(parsed, reading.skill, isBlow ? [] : reading.declared));
    }
    for (const outcome of reading.outcomes) events.push(outcome);
    if (!declaredElsewhere && reading.declared.length > 0) {
        events.push(composeDeclarationEvent(parsed, reading.declared));
    }
    const isUnread = reading.unreadKeys.length > 0;
    if (isUnread || events.length === 0) {
        events.push({
            kind: "unknown-message",
            message,
            reason: isUnread ? UNREAD_REASON : EMPTY_REASON,
            unreadKeys: reading.unreadKeys,
            combatantIds: getNamedCombatantIds(parsed),
        });
    }
    assert(events.length > 0, "a message decodes to something, even where nothing was read");
    assert(events.length <= parsed.parameters.length + 1, "a message stays inside its bound");
    return { events, announced: composeAnnouncedSkill(parsed, reading.skill) };
}

/** A message that states something and reports nothing that happened to anybody. */
function composeDeclarationEvent(
    parsed: ProtocolMessage,
    declared: DeclaredEffect[],
): DeclarationEvent {
    assert(declared.length > 0, "a declaration event states something");
    const side = parsed.actor ?? parsed.target;
    assert(declared.every((one) => one.effect.length > 0), "each names the key it arrived on");
    return {
        kind: "declaration",
        combatantId: side?.combatantId ?? null,
        healthPercent: side?.healthPercent ?? null,
        declared,
    };
}

function composeAnnouncedSkill(
    parsed: ProtocolMessage,
    skill: SkillReading | null,
): AnnouncedSkill | null {
    if (skill === null) return null;
    assert(skill.skillName.length > 0, "an announcement names something");
    // `tcustom` names its user in the target slot and is read only where one combatant is named,
    // so the named end is the announcer whichever slot the client wrote it into.
    const actorId = parsed.actor?.combatantId ?? parsed.target?.combatantId ?? null;
    assert(actorId === null || Number.isSafeInteger(actorId), "an announcer is somebody or nobody");
    return { skillName: skill.skillName, skillId: skill.skillId, actorId };
}

/**
 * A payload's messages, in order. Order is the whole of what an announcement has: the client
 * glues the message after one to it, and this reads them the same way.
 */
export function decodeFightMessages(
    messages: readonly string[],
    roster: CombatantRoster | null,
): BattleEvent[] {
    assert(messages.length <= MAXIMUM_MESSAGES, "a payload stays inside its stated bound");
    const events: BattleEvent[] = [];
    let standing: AnnouncedSkill | null = null;
    for (const message of messages) {
        const decoded = decodeOneMessage(message, standing, roster);
        for (const event of decoded.events) events.push(event);
        standing = decoded.announced;
    }
    assert(events.length >= messages.length, "every message leaves at least one event behind");
    return events;
}
