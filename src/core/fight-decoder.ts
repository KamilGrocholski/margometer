/**
 * Messages to what happened. The families below are the client's own and each is cited in
 * `docs/protocol-keys.md`; nothing is read because it looks like a number.
 *
 * The decoder drops nothing and invents nothing: a key with no meaning yet leaves the message
 * on an unknown event, keys and ends included, so a panel can say which total may be short.
 */

import { assert } from "@std/assert/assert";
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
    HealingToNamedCombatantEvent,
    HealthChangeEvent,
    PreventedDamage,
    SkillUsedEvent,
    TurnLostEvent,
    UnaccountedHealthEvent,
} from "@/src/core/battle-event.ts";
import {
    type CombatantRoster,
    getCombatantIdByName,
    MAXIMUM_COMBATANTS,
} from "@/src/core/combatant-roster.ts";
import {
    parseProtocolMessage,
    type ProtocolMessage,
    ProtocolMessageFormatError,
} from "@/src/core/protocol-message.ts";
import { getIntegerFromText } from "@/libs/number-text.ts";
import { getHealthPercentFromText, getShareFromText } from "@/src/core/protocol-number.ts";

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
/**
 * Which end of the blow a proc belongs to, and `unsettled` where nobody knows.
 *
 * **Never read off the sign.** `+legbon_curse` fires when its holder attacks and `-legbon_cleanse`
 * when its holder is struck, and the two arrive on messages of one shape — so a rule reading the
 * sign would charge half this table to the wrong row. Every entry is one sentence of that key's
 * own entry in `docs/protocol-keys.md`, which is where the evidence is.
 *
 * `unsettled` is a refusal, not a default: article view,372 names neither `tenacity` nor `dispel`,
 * so whose they are is unknown and a row charged with one would be a guess. They stay decoded and
 * are counted on nobody until material settles them (`ARCHITECTURE.md`, known gaps).
 */
export type ProcEnd = "actor" | "target" | "unsettled";

export const PROC_ENDS: Record<string, ProcEnd> = {
    "+crit": "actor",
    "+of_crit": "actor",
    "+pierce": "actor",
    "-pierceb": "target",
    "+stun": "actor",
    "+stun2": "actor",
    "+stun2-c": "actor",
    "+stun2-d": "actor",
    "+freeze": "actor",
    "+wound": "actor",
    "+fastarrow": "actor",
    "+acdmg_destroyed": "actor",
    "+legbon_curse": "actor",
    "+legbon_verycrit": "actor",
    "-legbon_cleanse": "target",
    "-legbon_glare": "target",
    "+superspell-dispel": "unsettled",
    "-tenacity": "unsettled",
    "-evade": "target",
    "-contra": "target",
};

/** The keys a blow carries when it landed critically, whichever weapon threw it. */
export const CRITICAL_PROC_KEYS: readonly string[] = ["+crit", "+of_crit"];
/**
 * The two keys a wound is stated on, and they are **not** the same key: `+injure` announces the
 * wound a blow has just left, and `injure` is that wound ticking afterwards, in a message of its
 * own. Spelled here because this is the file that reads them, and read again by
 * `src/core/fight-statistics.ts`, which joins a tick to the blow that left the wound.
 */
export const WOUND_ANNOUNCEMENT_KEY = "+injure";
export const WOUND_TICK_KEY = "injure";

/**
 * Health moving outside a blow: which way it goes, and which slot holds the combatant it
 * happens to. Both are ours to supply — the protocol states a magnitude and leaves the rest to
 * the key, and `docs/protocol-keys.md` carries the evidence per key.
 */
const HEALTH_CHANGE_KEYS: Record<string, { sign: number; isOnTarget: boolean }> = {
    heal: { sign: 1, isOnTarget: false },
    legbon_holytouch_heal: { sign: 1, isOnTarget: false },
    heal_target: { sign: 1, isOnTarget: true },
    npc_heal: { sign: 1, isOnTarget: false },
    bandage: { sign: 1, isOnTarget: false },
    poison: { sign: -1, isOnTarget: false },
    [WOUND_TICK_KEY]: { sign: -1, isOnTarget: false },
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
const MESSAGE_ENDS = 2;
const PERCENT_OPENER = "(";
const PERCENT_CLOSER = "%)";
/**
 * The sides at the end of the fight, as text: names separated by a comma and a space, in a
 * message naming no combatant at all. Every recording in `captures/` ends with exactly one of
 * each, 2026-08-28.
 */
const OUTCOME_KEYS: Record<string, "won" | "lost"> = { winner: "won", loser: "lost" };
/** The key a draw arrives on, which is the winners' — `core/battle-event.ts` says what it is. */
const NO_WINNER = "?";
const NAME_SEPARATOR = ", ";
/**
 * Healing stated by name: `amount,name(percent%)` — the figure first and the name second, the
 * opposite order from `+oth_dmg`, which is why the two cannot share a reader. Both ends of the
 * message are the wrong combatant: it rides a blow struck at somebody else.
 */
const HEALING_TO_NAMED_KEY = "legbon_lastheal";
const HEALING_TO_NAMED_MEMBERS = 2;
/**
 * A share of the maximum, restored to every combatant on the caster's side. What it restores is
 * stated nowhere else, so reading it as a declaration would silence a total that really is short.
 * The value has never carried a second member, and one that did would not be read.
 */
const UNACCOUNTED_HEALTH_KEY = "healall_per";
/**
 * The keys whose giver is the one healed, on the published help's word rather than on the
 * grammar: each entry's `_Cause:_` in `docs/protocol-keys.md` reads *the subject's own*. Being
 * stated at one end is not what puts a key here — `heal_target` states one end too and is charged
 * to whoever announced it. `[ASK]` before a fourth joins the list.
 */
export const SELF_SOURCED_HEALING_KEYS: readonly string[] = [
    "heal",
    "legbon_holytouch_heal",
    HEALING_TO_NAMED_KEY,
];
const SKILL_NAME_KEY = "tspell";
/**
 * The other way an announcement names what was used, and the name sits in the target slot. Read
 * only where the message names one combatant, so nothing has to guess whose use it was.
 */
const CUSTOM_SKILL_NAME_KEY = "tcustom";
const SKILL_ID_KEY = "skillId";
/**
 * A combatant moving, which the published help calls one of the two default actions a turn can
 * go on — article 372 §2.3, read 2026-09-02. Exported so the files that spell it spell it once;
 * the key is the game's and `docs/protocol-keys.md` owns what it means (**N13**).
 */
export const STEP_KEY = "step";
/**
 * A skill being made ready, which is the other way a turn passes with nothing struck. The help
 * documents no such mechanic (`docs/protocol-keys.md`), so what it costs is measured rather than
 * cited: `docs/turns-taken.md`. Spelled once, for **N13**'s reason.
 */
export const PREPARE_KEY = "prepare";
/**
 * Free text the client shows in its log, and the one key nothing is kept from
 * (`docs/protocol-keys.md`). One thing is **read** from it and never stored: whether the sentence
 * announces a turn its holder spent on nothing. **ADR 0049.**
 */
const TEXT_KEY = "txt";
/**
 * What the game puts between the combatant it is talking about and what it has to say. Not a name
 * this repository chose, and the words after it are prose nobody here reads — a turn lost is told
 * apart from the game's other lines by shape alone.
 */
const TURN_LOST_SEPARATOR = " - ";
/** How the game ends a sentence about something other than a turn. */
const SENTENCE_STOP = ".";
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
    WOUND_ANNOUNCEMENT_KEY,
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
    PREPARE_KEY,
    "shout",
    TEXT_KEY,
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
    STEP_KEY,
];
/** The longest message list in one payload of `captures/` holds 627, 2026-08-28. */
const MAXIMUM_MESSAGES = 4096;
/** The longest message in `captures/` carries 40 parameters, 2026-08-28. */
const MAXIMUM_PARAMETERS = 512;
/** A skill's name is a phrase; the longest in `captures/` is far short of this, 2026-09-01. */
const MAXIMUM_NAME = 4096;
const UNREAD_REASON = "keys with no meaning yet";
const EMPTY_REASON = "a message stating no parameter";

interface HealthChangeReading {
    source: string;
    amount: number;
    isOnTarget: boolean;
    declared: DeclaredEffect[];
}

interface UnaccountedHealthReading {
    source: string;
    declaredShare: number;
}

interface NamedHealingReading {
    targetName: string;
    targetHealthPercent: number | null;
    amount: number;
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
    namedHealing: NamedHealingReading[];
    unaccounted: UnaccountedHealthReading[];
    outcomes: FightOutcomeEvent[];
    declared: DeclaredEffect[];
    skill: SkillReading | null;
    skillName: string | null;
    skillId: number | null;
    skillKeys: number;
    unreadKeys: string[];
}

/** Null for a key that is not a proc at all, which is what makes this the membership test too. */
export function getProcEnd(key: string): ProcEnd | null {
    assert(key.length > 0, "a key asked about is a key the message wrote");
    const end = PROC_ENDS[key];
    if (end === undefined) return null;
    assert(end.length > 0, "and a proc the table holds is placed at an end, or refused one");
    return end;
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
    assert(value.length <= MAXIMUM_NAME, "a name read off a message stays inside its bound");
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

/** Healing that took health away would be this reader misreading its key, not a loss reported. */
function readNamedHealing(key: string, value: string): NamedHealingReading | null {
    if (key !== HEALING_TO_NAMED_KEY) return null;
    const members = value.split(MEMBER_SEPARATOR);
    if (members.length !== HEALING_TO_NAMED_MEMBERS) return null;
    const [amountText, statedTarget] = members;
    if (amountText === undefined) return null;
    if (statedTarget === undefined) return null;
    const amount = getIntegerFromText(amountText);
    if (amount === null) return null;
    if (amount < 0) return null;
    const named = readNamedTarget(statedTarget);
    if (named === null) return null;
    assert(amount >= 0, "healing stated against a name never takes health away");
    assert(named.name.length > 0, "a figure stated against a name has a name");
    return { targetName: named.name, targetHealthPercent: named.healthPercent, amount };
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
    if (getProcEnd(key) !== null) {
        reading.procs.push(key);
        return;
    }
    if (VALUELESS_DECLARATION_KEYS.includes(key)) {
        reading.declared.push({ effect: key, amount: null, text: null });
        return;
    }
    assert(getProcEnd(key) === null, "a proc never reaches the unread branch");
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

/** True where the key was the share, read or refused. A share with a second member is not read. */
function addUnaccountedHealth(reading: AttackReading, key: string, value: string): boolean {
    if (key !== UNACCOUNTED_HEALTH_KEY) return false;
    const declaredShare = getShareFromText(value);
    assert(declaredShare === null || declaredShare >= 0, "a share read is never below nothing");
    if (declaredShare === null) reading.unreadKeys.push(key);
    else reading.unaccounted.push({ source: key, declaredShare });
    return true;
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
        if (addUnaccountedHealth(reading, parameter.key, parameter.value)) continue;
        const restored = readNamedHealing(parameter.key, parameter.value);
        if (restored !== null) {
            reading.namedHealing.push(restored);
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
        reading.namedDamage.length + reading.namedHealing.length + reading.unaccounted.length +
        reading.outcomes.length + reading.declared.length + reading.skillKeys +
        reading.unreadKeys.length;
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
    assert(found.length <= MESSAGE_ENDS, "a message names at most two ends");
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

function composeUnaccountedHealthEvent(
    parsed: ProtocolMessage,
    unaccounted: UnaccountedHealthReading,
    announced: AnnouncedSkill | null,
): UnaccountedHealthEvent {
    assert(unaccounted.declaredShare >= 0, "a share stated is never below nothing");
    assert(unaccounted.source.length > 0, "and names the key it was stated on");
    return {
        kind: "unaccounted-health",
        source: unaccounted.source,
        // The actor, always: eight of the 115 in `captures/` name somebody else in the target,
        // and reading that slot would credit the wrong combatant with the cast.
        combatantId: parsed.actor?.combatantId ?? null,
        declaredShare: unaccounted.declaredShare,
        announced,
    };
}

function composeNamedHealingEvent(
    restored: NamedHealingReading,
    roster: CombatantRoster | null,
): HealingToNamedCombatantEvent {
    assert(restored.amount >= 0, "healing restored is never below nothing");
    assert(restored.targetName.length > 0, "the healed is named inside the value");
    return {
        kind: "healing-to-named-combatant",
        targetName: restored.targetName,
        targetId: roster === null ? null : getCombatantIdByName(roster, restored.targetName),
        targetHealthPercent: restored.targetHealthPercent,
        amount: restored.amount,
        source: HEALING_TO_NAMED_KEY,
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

/**
 * The announcement an effect rides: the message's own where it carries one, the one before it
 * otherwise and only for its own actor.
 *
 * A message that announces a skill states the effect of that skill in the same breath — every
 * `heal_target`, `healall_per` and `bandage` over `captures/` on 2026-08-30 arrives that way, and
 * `docs/protocol-keys.md` says as much on each of the three. Reading only the message before
 * leaves those figures with no giver and no name (`tests/core/skill-announcement-rule.test.ts`).
 */
function getAnnouncedForMessage(
    parsed: ProtocolMessage,
    skill: SkillReading | null,
    standing: AnnouncedSkill | null,
): AnnouncedSkill | null {
    const own = composeAnnouncedSkill(parsed, skill);
    if (own !== null) return own;
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
        if (!(failure instanceof ProtocolMessageFormatError)) throw failure;
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
    const announced = getAnnouncedForMessage(parsed, reading.skill, standing);
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
    // Before the announcement it rides, because the percentages that announcement states are
    // where the side stands **after** the cast, and sizing one needs where they stood before.
    for (const unaccounted of reading.unaccounted) {
        events.push(composeUnaccountedHealthEvent(parsed, unaccounted, announced));
    }
    if (reading.skill !== null) {
        events.push(composeSkillUsedEvent(parsed, reading.skill, isBlow ? [] : reading.declared));
    }
    for (const restored of reading.namedHealing) {
        events.push(composeNamedHealingEvent(restored, roster));
    }
    for (const outcome of reading.outcomes) events.push(outcome);
    if (!declaredElsewhere && reading.declared.length > 0) {
        const lost = composeTurnLostEvent(reading.declared, roster);
        if (lost === null) events.push(composeDeclarationEvent(parsed, reading.declared));
        else events.push(lost);
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

/**
 * Whose turn the sentence says was spent on nothing, or null where it says something else. Read by
 * shape and never by its words: the text opens with a combatant's own name and the separator the
 * game puts after it, and the game's other lines about a combatant end in a full stop. Measured
 * over `captures/` on 2026-09-03 — 319 of 319, with nothing else matching. **ADR 0049.**
 */
function readTurnLostName(text: string, roster: CombatantRoster): string | null {
    if (text.endsWith(SENTENCE_STOP)) return null;
    assert(roster.idByName.size <= MAXIMUM_COMBATANTS, "a roster stays inside its stated bound");
    let longest: string | null = null;
    // The longest name wins, so a nickname that opens another does not take its line.
    for (const [name] of roster.idByName) {
        if (!text.startsWith(name + TURN_LOST_SEPARATOR)) continue;
        if (longest === null) longest = name;
        else if (name.length > longest.length) longest = name;
    }
    return longest;
}

/**
 * The same, as the event a reading holds. Null where the message says something else, so the
 * declaration branch keeps it and nothing about the sentence is invented.
 */
function composeTurnLostEvent(
    declared: readonly DeclaredEffect[],
    roster: CombatantRoster | null,
): TurnLostEvent | null {
    if (roster === null) return null;
    if (declared.length !== 1) return null;
    const stated = declared[0];
    if (stated === undefined) return null;
    if (stated.effect !== TEXT_KEY) return null;
    if (stated.text === null) return null;
    const name = readTurnLostName(stated.text, roster);
    if (name === null) return null;
    assert(name.length > 0, "a turn lost is lost by somebody the roster names");
    assert(stated.text.length > name.length, "and the sentence says more than that name");
    return { kind: "turn-lost", combatantId: getCombatantIdByName(roster, name) };
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
