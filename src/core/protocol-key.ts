/**
 * What a protocol key means: the one owner of it (`docs/design.md` §6.2). The families are the
 * client's own and each is cited in `docs/protocol-keys.md`. Nothing is read because it
 * looks like a number.
 *
 * `null` is a key with no meaning yet, which the decoder leaves unread and names.
 */

import { assert } from "@std/assert/assert";
import type { VocabularyWord } from "#/libs/vocabulary.ts";
import { OUTCOME_RESULT } from "./battle-event.ts";

export const KEY_FAMILY = {
    damage: "damage",
    prevented: "prevented",
    destroyed: "destroyed",
    proc: "proc",
    healthChange: "health-change",
    declaration: "declaration",
    valuelessDeclaration: "valueless-declaration",
    skillName: "skill-name",
    customSkillName: "custom-skill-name",
    skillId: "skill-id",
    outcome: "outcome",
    fled: "fled",
    unaccountedHealth: "unaccounted-health",
    namedDamage: "named-damage",
    namedHealing: "named-healing",
} as const;

/**
 * Which end of the blow a proc belongs to, and `unsettled` where nobody knows. **Never read off the
 * sign**: `+legbon_curse` fires when its holder attacks and `-legbon_cleanse` when its holder is
 * struck, on messages of one shape. `unsettled` is a refusal, not a default.
 */
export const PROC_END = { actor: "actor", target: "target", unsettled: "unsettled" } as const;
export type ProcEnd = VocabularyWord<typeof PROC_END>;

/**
 * How a legendary bonus shows itself: `fired` each time it happens, `held` once a fight on whoever
 * holds it. Over `captures/` on 2026-10-03 `-legbon_facade` stood 17 times and `+legbon_puncture`
 * 11, never twice on one combatant in one fight, and the client words both as lasting to the end
 * of the fight (build `1785244275300`), so a count of them is not a count of anything happening.
 */
export const LEGENDARY_BONUS_SHOWING = { fired: "fired", held: "held" } as const;
export type LegendaryBonusShowing = VocabularyWord<typeof LEGENDARY_BONUS_SHOWING>;

/** Whose a legendary bonus is, read off the event it rides, and how it shows itself. */
export interface LegendaryBonus {
    end: ProcEnd;
    showing: LegendaryBonusShowing;
    /**
     * Whether it acts on the blow's other end, beside its holder: a curse on whoever was struck, a
     * glare on whoever struck. False for a bonus that acts on its holder alone, and for a held one,
     * whose one message names only the first blow of a whole fight it acts on.
     */
    doesReachOtherEnd: boolean;
}

/**
 * How a defence stops damage. A `pool` is one the character begins the fight with, and what it
 * stops is drained from it point for point, so that damage was spent on the target the way health
 * is; a `chance` is a roll on each blow and takes nothing (ADR 0012).
 */
export const DEFENCE_MECHANISM = { pool: "pool", chance: "chance" } as const;
export type DefenceMechanism = VocabularyWord<typeof DEFENCE_MECHANISM>;

export const DAMAGE_HALF = { raw: "raw", applied: "applied" } as const;
export type DamageHalf = VocabularyWord<typeof DAMAGE_HALF>;

export type KeyMeaning =
    | { kind: typeof KEY_FAMILY.damage; half: DamageHalf }
    | { kind: typeof KEY_FAMILY.prevented }
    | { kind: typeof KEY_FAMILY.destroyed }
    | { kind: typeof KEY_FAMILY.proc; end: ProcEnd; doesTakeValue: boolean }
    | { kind: typeof KEY_FAMILY.healthChange; sign: 1 | -1; isOnTarget: boolean }
    | { kind: typeof KEY_FAMILY.declaration }
    | { kind: typeof KEY_FAMILY.valuelessDeclaration }
    | { kind: typeof KEY_FAMILY.skillName }
    | { kind: typeof KEY_FAMILY.customSkillName }
    | { kind: typeof KEY_FAMILY.skillId }
    | {
        kind: typeof KEY_FAMILY.outcome;
        result: typeof OUTCOME_RESULT.won | typeof OUTCOME_RESULT.lost;
    }
    | { kind: typeof KEY_FAMILY.fled }
    | { kind: typeof KEY_FAMILY.unaccountedHealth }
    | { kind: typeof KEY_FAMILY.namedDamage }
    | { kind: typeof KEY_FAMILY.namedHealing };

/**
 * Which side a cast reaches, relative to its caster: not which side is the reader's, which is the
 * panel's to say. A key absent from the table reaches **nothing stated**.
 */
export const KEY_REACH = { castersSide: "casters-side", otherSide: "other-side" } as const;
export type KeyReach = VocabularyWord<typeof KEY_REACH>;

/**
 * The client's default branch reads characters 1 to 3 of a key: `+` is raw, the rest applied. Only
 * `-` is read as applied here: no recording in `captures/` states a marker under any other sign,
 * 2026-09-25, and a key nobody has met stays unread rather than guessed at.
 */
const DAMAGE_MARKER = "dmg";
const DAMAGE_MARKER_AT = 1;
export const RAW_SIGN = "+";
export const APPLIED_SIGN = "-";

/** Free text for the client's own log, and the one key nothing is kept from. */
export const TEXT_KEY = "txt";
export const SKILL_ID_KEY = "skillId";
/** A combatant moving: one of the two default actions a turn can go on (article 372 §2.3). */
export const STEP_KEY = "step";
/** A skill being made ready, the other way a turn passes with nothing struck. */
export const PREPARE_KEY = "prepare";
/** What the client announces beside the blow that broke a charge. */
export const CHARGE_BROKEN_KEY = "+superspell-dispel";
/** The legendary bonus lit on its holder's blow, and the heal that runs under it. */
export const HOLYTOUCH_DECLARATION_KEY = "+legbon_holytouch";
export const HOLYTOUCH_HEAL_KEY = "legbon_holytouch_heal";
/** The legendary bonus that heals once a fight, stated by name inside the value. */
export const LASTHEAL_KEY = "legbon_lastheal";
/** The other legendary bonuses, each in two tables: the family it is read in, and whose it is. */
const CURSE_KEY = "+legbon_curse";
const VERYCRIT_KEY = "+legbon_verycrit";
const CLEANSE_KEY = "-legbon_cleanse";
const GLARE_KEY = "-legbon_glare";
const PUNCTURE_KEY = "+legbon_puncture";
const CRITRED_KEY = "-legbon_critred";
const FACADE_KEY = "-legbon_facade";
const ANGUISH_KEY = "+legbon_anguish";
/** The reduction of healing the help scopes to the caster's opposing side. */
export const HEALING_REDUCER_KEY = "lowheal_per-enemies";
/** The key an announcement carries when it provokes: its value names the provoked. */
export const PROVOCATION_KEY = "shout";
/** Keys stating a figure for a status a mask witnesses (`docs/auras-standing.md`). */
export const SLOW_ALL_KEY = "allslow_per";
export const HASTE_AURA_KEY = "aura-sa_per";
/** Between the names in a value that carries several: `winner`, `loser` and `shout` all use it. */
export const NAME_SEPARATOR = ", ";
/**
 * Two keys, not one: `+injure` announces the wound a blow has just left, and `injure` is that
 * wound ticking afterwards, in a message of its own.
 */
export const WOUND_ANNOUNCEMENT_KEY = "+injure";
export const WOUND_TICK_KEY = "injure";
const HEAL_KEY = "heal";
/** A blow landing critically, and the game's own `of_` spelling of the same. */
const CRITICAL_KEY = "+crit";
const CRITICAL_OF_KEY = "+of_crit";
export const CRITICAL_PROC_KEYS: readonly string[] = [CRITICAL_KEY, CRITICAL_OF_KEY];
/**
 * The keys whose giver is the one healed, on the published help's word rather than on the
 * grammar: each entry's `_Cause:_` in `docs/protocol-keys.md` reads *the subject's own*.
 * Being stated at one end is not what puts a key here. `[ASK]` before a fourth joins the list.
 */
export const SELF_SOURCED_HEALING_KEYS: readonly string[] = [
    HEAL_KEY,
    HOLYTOUCH_HEAL_KEY,
    LASTHEAL_KEY,
];

/** The one pair the family rule cannot reach, because the key carries no marker. */
const DAMAGE_KEYS = ["+thirdatt", "-thirdatt"];
/**
 * The mechanism is the published help's, article view,372 (read 2026-09-27): absorption and magical
 * absorption are drawn from the pool the character entered the fight with; a block is a chance.
 */
const DEFENCE_MECHANISM_BY_KEY: ReadonlyMap<string, DefenceMechanism> = new Map([
    ["-absorb", DEFENCE_MECHANISM.pool],
    ["-absorbm", DEFENCE_MECHANISM.pool],
    ["-blok", DEFENCE_MECHANISM.chance],
]);
const DESTROYED_KEYS = [
    "+acdmg",
    "+critpierce",
    "+resdmg",
    "+resdmgc",
    "+resdmgf",
    "+resdmgl",
    // One letter from `+acdmg`, and a different pool: that empties armour in points, this a
    // poison resistance in percentage points (`docs/protocol-keys.md`).
    "+actdmg",
    "+abdest_per",
    "+abmdest_per",
];

/**
 * ⚠️ **Membership is the second thing this table states.** A proc it does not hold goes unread
 * and reaches a player as a message nobody could read.
 */
const PROC_END_BY_KEY: ReadonlyMap<string, ProcEnd> = new Map<string, ProcEnd>([
    [CRITICAL_KEY, PROC_END.actor],
    [CRITICAL_OF_KEY, PROC_END.actor],
    ["+pierce", PROC_END.actor],
    ["-pierceb", PROC_END.target],
    ["+stun", PROC_END.actor],
    ["+stun2", PROC_END.actor],
    ["+stun2-c", PROC_END.actor],
    ["+stun2-d", PROC_END.actor],
    ["+stun2-f", PROC_END.actor],
    ["+stun2-l", PROC_END.actor],
    ["+freeze", PROC_END.actor],
    ["+wound", PROC_END.actor],
    ["+of_wound", PROC_END.actor],
    ["+woundpoison", PROC_END.actor],
    ["+woundfrost", PROC_END.actor],
    ["+woundmagic", PROC_END.actor],
    ["+of_woundpoison", PROC_END.actor],
    ["+of_woundmagic", PROC_END.actor],
    ["+fastarrow", PROC_END.actor],
    ["+acdmg_destroyed", PROC_END.actor],
    [CURSE_KEY, PROC_END.actor],
    [VERYCRIT_KEY, PROC_END.actor],
    [CLEANSE_KEY, PROC_END.target],
    [GLARE_KEY, PROC_END.target],
    [CHARGE_BROKEN_KEY, PROC_END.unsettled],
    ["+superspell-prevented", PROC_END.unsettled],
    ["-tenacity", PROC_END.unsettled],
    ["-evade", PROC_END.target],
    ["-parry", PROC_END.target],
    ["-contra", PROC_END.target],
    ["-arrowblock", PROC_END.target],
]);

/**
 * The procs read as procs **while carrying a figure**, which no other one is. The figure is not
 * read: what the percentage is taken off is unsettled (`develop ADR 0085`).
 */
const PROCS_WITH_VALUE = [
    "+woundpoison",
    "+woundfrost",
    "+woundmagic",
    "+of_woundpoison",
    "+of_woundmagic",
];

/**
 * Health moving outside a blow: which way it goes, and which slot holds the combatant it happens
 * to. Both are ours to supply; the protocol states a magnitude and leaves the rest to the key.
 */
const HEALTH_CHANGE_BY_KEY = new Map<string, { sign: 1 | -1; isOnTarget: boolean }>([
    [HEAL_KEY, { sign: 1, isOnTarget: false }],
    [HOLYTOUCH_HEAL_KEY, { sign: 1, isOnTarget: false }],
    ["heal_target", { sign: 1, isOnTarget: true }],
    ["npc_heal", { sign: 1, isOnTarget: false }],
    ["bandage", { sign: 1, isOnTarget: false }],
    ["poison", { sign: -1, isOnTarget: false }],
    [WOUND_TICK_KEY, { sign: -1, isOnTarget: false }],
    ["wound", { sign: -1, isOnTarget: false }],
    ["fire", { sign: -1, isOnTarget: false }],
    ["light", { sign: -1, isOnTarget: false }],
    ["anguish", { sign: -1, isOnTarget: false }],
]);

/**
 * Keys stating something no total here counts: an input, an outcome in a unit this meter does not
 * keep, or one outside the fight. The test is not "we understand it"; it is whether whatever the
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
    PUNCTURE_KEY,
    "+ph",
    "+rage",
    "+taken_dmg",
    "-endest",
    CRITRED_KEY,
    FACADE_KEY,
    "-manadest",
    "-poison_lowdmg_per",
    "active_absorbdest_per",
    "active_block_per",
    "active_decblock_per",
    "active_decblock_per-enemies",
    "afterheal",
    "alllowdmg",
    SLOW_ALL_KEY,
    "aura-ac_per",
    "aura-adddmg2_per-meele",
    "aura-resall",
    HASTE_AURA_KEY,
    "combo-max",
    "critmval-allies",
    "critval-allies",
    "en-regen",
    "energy",
    "heal_per-allies",
    "heal_per-enemies",
    "hp_per-allies",
    "hp_per-enemies",
    HEALING_REDUCER_KEY,
    "mana",
    "poison_lowdmg_per-enemies",
    PREPARE_KEY,
    "resfire_per",
    "resfrost_per",
    "reslight_per",
    PROVOCATION_KEY,
    "surpass_bonus_total",
    TEXT_KEY,
];

/**
 * Read **only** while they carry no value. The client composes `+legbon_holytouch` with a hole for
 * a figure, so one arriving with a value goes back to unread. A hole is not what membership means:
 * `sunshield_per` is composed with none at all.
 */
const VALUELESS_DECLARATION_KEYS = [
    ANGUISH_KEY,
    HOLYTOUCH_DECLARATION_KEY,
    "+spell-taken_dmg-all",
    "en-regen-cast",
    "removedot-allies",
    "removeslow-allies",
    "removestun-allies",
    STEP_KEY,
    "sunshield_per",
];

/** Cited in `docs/auras-standing.md`, which cites the register, which cites the help. */
const REACH_BY_KEY: ReadonlyMap<string, KeyReach> = new Map<string, KeyReach>([
    // The `all` says everybody and not which side. The register: _a reduction to the damage dealt
    // by everyone on the opposing side_ (`docs/protocol-keys.md`).
    ["alllowdmg", KEY_REACH.otherSide],
    ["+spell-taken_dmg-all", KEY_REACH.otherSide],
    [HEALING_REDUCER_KEY, KEY_REACH.otherSide],
    ["active_decblock_per-enemies", KEY_REACH.otherSide],
    ["poison_lowdmg_per-enemies", KEY_REACH.otherSide],
    // ⚠️ The one the register does not settle. Measured over `captures/` 2026-09-09: after
    // a `Szadź` the opposing combatant carries `swow_down` in 77 casts of 77.
    [SLOW_ALL_KEY, KEY_REACH.otherSide],
    ["aura-adddmg2_per-meele", KEY_REACH.castersSide],
    ["aura-ac_per", KEY_REACH.castersSide],
    ["aura-resall", KEY_REACH.castersSide],
    [HASTE_AURA_KEY, KEY_REACH.castersSide],
    ["critval-allies", KEY_REACH.castersSide],
    ["critmval-allies", KEY_REACH.castersSide],
    ["removedot-allies", KEY_REACH.castersSide],
    ["removeslow-allies", KEY_REACH.castersSide],
    ["removestun-allies", KEY_REACH.castersSide],
    // The affected are forced to attack the character who used the skill: you do not force an
    // ally to strike you. Over `captures/` 2026-09-22, 168 of 168 characters named across
    // 166 announcements stand opposite the caster.
    [PROVOCATION_KEY, KEY_REACH.otherSide],
]);

const SIDE_WIDE_OPENING = "aura-";
const SIDE_WIDE_ENDINGS = ["-all", "-allies", "-enemies"];
/**
 * Side-wide by meaning, carrying neither shape above. `healall_per` is not here because it is
 * health rather than a standing, and reaches a row of its own.
 */
const SIDE_WIDE_KEYS = [PROVOCATION_KEY, SLOW_ALL_KEY, "alllowdmg"];

/**
 * Every legendary bonus a message names, and whose it is: the end a proc is charged to, or for a
 * declaration the end the published help puts it on (article view,372, read 2026-10-03). The
 * heal stated by name belongs to the one it heals, who is that event's target. The other end is
 * the help's too, and the recordings agree where a turn witnesses it: over `captures/` on
 * 2026-10-03 the next thing heard of whoever struck into a glare is a lost turn 8 times of 8, and
 * of whoever a curse struck 14 of 17 — two struck first, and one fight ended.
 */
const LEGENDARY_BONUS_BY_KEY: ReadonlyMap<string, LegendaryBonus> = new Map([
    [HOLYTOUCH_DECLARATION_KEY, {
        end: PROC_END.actor,
        showing: LEGENDARY_BONUS_SHOWING.fired,
        doesReachOtherEnd: false,
    }],
    [VERYCRIT_KEY, {
        end: PROC_END.actor,
        showing: LEGENDARY_BONUS_SHOWING.fired,
        doesReachOtherEnd: true,
    }],
    [CURSE_KEY, {
        end: PROC_END.actor,
        showing: LEGENDARY_BONUS_SHOWING.fired,
        doesReachOtherEnd: true,
    }],
    [ANGUISH_KEY, {
        end: PROC_END.actor,
        showing: LEGENDARY_BONUS_SHOWING.fired,
        doesReachOtherEnd: true,
    }],
    [CLEANSE_KEY, {
        end: PROC_END.target,
        showing: LEGENDARY_BONUS_SHOWING.fired,
        doesReachOtherEnd: false,
    }],
    [GLARE_KEY, {
        end: PROC_END.target,
        showing: LEGENDARY_BONUS_SHOWING.fired,
        doesReachOtherEnd: true,
    }],
    [CRITRED_KEY, {
        end: PROC_END.target,
        showing: LEGENDARY_BONUS_SHOWING.fired,
        doesReachOtherEnd: true,
    }],
    [LASTHEAL_KEY, {
        end: PROC_END.target,
        showing: LEGENDARY_BONUS_SHOWING.fired,
        doesReachOtherEnd: false,
    }],
    [PUNCTURE_KEY, {
        end: PROC_END.actor,
        showing: LEGENDARY_BONUS_SHOWING.held,
        doesReachOtherEnd: false,
    }],
    [FACADE_KEY, {
        end: PROC_END.target,
        showing: LEGENDARY_BONUS_SHOWING.held,
        doesReachOtherEnd: false,
    }],
]);

const KEY_MEANING_BY_KEY: ReadonlyMap<string, KeyMeaning> = indexKeyMeanings();
/** Keyed by the defence an event names, which is the key with its sign taken off. */
const DEFENCE_MECHANISM_BY_DEFENCE: ReadonlyMap<string, DefenceMechanism> =
    indexDefenceMechanisms();

/** `null`: the key reaches no side anybody has stated. */
export function lookupKeyReach(key: string): KeyReach | null {
    assert(key.length > 0, "a reach is asked of a key");
    const reach = REACH_BY_KEY.get(key) ?? null;
    if (reach !== null) assert(isSideWideKey(key), "a key reaching a side is a side-wide key");
    return reach;
}

/** `null`: the key names no legendary bonus. */
export function lookupLegendaryBonus(key: string): LegendaryBonus | null {
    assert(key.length > 0, "a bonus is asked of a key");
    const bonus = LEGENDARY_BONUS_BY_KEY.get(key) ?? null;
    if (bonus === null) return null;
    assert(bonus.end !== PROC_END.unsettled, "a bonus held here is somebody's");
    if (bonus.showing === LEGENDARY_BONUS_SHOWING.held) {
        assert(!bonus.doesReachOtherEnd, "a held bonus names one blow of the many it acts on");
    }
    return bonus;
}

/** Whether a key reaches more than one combatant, by its shape or by its meaning. */
export function isSideWideKey(key: string): boolean {
    assert(key.length > 0, "a key that is asked about is named");
    if (key.startsWith(SIDE_WIDE_OPENING)) return true;
    for (const ending of SIDE_WIDE_ENDINGS) {
        if (key.endsWith(ending)) return true;
    }
    return SIDE_WIDE_KEYS.includes(key);
}

export function lookupKeyMeaning(key: string): KeyMeaning | null {
    assert(key.length > 0, "a key asked about is a key the message wrote");
    const listed = KEY_MEANING_BY_KEY.get(key);
    if (listed !== undefined) return listed;
    if (!key.startsWith(DAMAGE_MARKER, DAMAGE_MARKER_AT)) return null;
    let half: DamageHalf;
    if (key.startsWith(RAW_SIGN)) half = DAMAGE_HALF.raw;
    else if (key.startsWith(APPLIED_SIGN)) half = DAMAGE_HALF.applied;
    else return null;
    assert(!KEY_MEANING_BY_KEY.has(key), "a key read by the family rule is in no list");
    return { kind: KEY_FAMILY.damage, half };
}

/** How the defence an event names stopped its damage. Only this table's keys reach an event. */
export function getDefenceMechanism(defence: string): DefenceMechanism {
    assert(defence.length > 0, "a defence asked about is one an event named");
    const mechanism = DEFENCE_MECHANISM_BY_DEFENCE.get(defence);
    assert(mechanism !== undefined, "every defence an event names is one this table reads");
    return mechanism;
}

function indexKeyMeanings(): Map<string, KeyMeaning> {
    const keyMeaningByKey = new Map<string, KeyMeaning>();
    const addKeyMeaning = (key: string, keyMeaning: KeyMeaning) => {
        assert(!keyMeaningByKey.has(key), "a key belongs to one family");
        keyMeaningByKey.set(key, keyMeaning);
    };
    for (const key of DAMAGE_KEYS) {
        addKeyMeaning(key, {
            kind: KEY_FAMILY.damage,
            half: key.startsWith(RAW_SIGN) ? DAMAGE_HALF.raw : DAMAGE_HALF.applied,
        });
    }
    for (const key of DEFENCE_MECHANISM_BY_KEY.keys()) {
        addKeyMeaning(key, { kind: KEY_FAMILY.prevented });
    }
    for (const key of DESTROYED_KEYS) addKeyMeaning(key, { kind: KEY_FAMILY.destroyed });
    for (const [key, end] of PROC_END_BY_KEY) {
        addKeyMeaning(key, {
            kind: KEY_FAMILY.proc,
            end,
            doesTakeValue: PROCS_WITH_VALUE.includes(key),
        });
    }
    for (const [key, change] of HEALTH_CHANGE_BY_KEY) {
        addKeyMeaning(key, { kind: KEY_FAMILY.healthChange, ...change });
    }
    for (const key of DECLARATION_KEYS) addKeyMeaning(key, { kind: KEY_FAMILY.declaration });
    for (const key of VALUELESS_DECLARATION_KEYS) {
        addKeyMeaning(key, { kind: KEY_FAMILY.valuelessDeclaration });
    }
    addKeyMeaning("tspell", { kind: KEY_FAMILY.skillName });
    addKeyMeaning("tcustom", { kind: KEY_FAMILY.customSkillName });
    addKeyMeaning(SKILL_ID_KEY, { kind: KEY_FAMILY.skillId });
    addKeyMeaning("winner", { kind: KEY_FAMILY.outcome, result: OUTCOME_RESULT.won });
    addKeyMeaning("loser", { kind: KEY_FAMILY.outcome, result: OUTCOME_RESULT.lost });
    addKeyMeaning("flee", { kind: KEY_FAMILY.fled });
    addKeyMeaning("healall_per", { kind: KEY_FAMILY.unaccountedHealth });
    addKeyMeaning("+oth_dmg", { kind: KEY_FAMILY.namedDamage });
    addKeyMeaning(LASTHEAL_KEY, { kind: KEY_FAMILY.namedHealing });
    assert(
        keyMeaningByKey.size > PROC_END_BY_KEY.size,
        "every family is indexed, not only the procs",
    );
    return keyMeaningByKey;
}

function indexDefenceMechanisms(): Map<string, DefenceMechanism> {
    const mechanismByDefence = new Map<string, DefenceMechanism>();
    for (const [key, mechanism] of DEFENCE_MECHANISM_BY_KEY) {
        assert(key.startsWith(APPLIED_SIGN), "a defence stops damage on the applied side");
        const defence = key.slice(APPLIED_SIGN.length);
        assert(!mechanismByDefence.has(defence), "a defence is named by one key");
        mechanismByDefence.set(defence, mechanism);
    }
    assert(
        mechanismByDefence.size === DEFENCE_MECHANISM_BY_KEY.size,
        "every defence key is indexed",
    );
    return mechanismByDefence;
}
