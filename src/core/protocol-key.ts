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

export const DAMAGE_HALF = { raw: "raw", applied: "applied" } as const;
export type DamageHalf = VocabularyWord<typeof DAMAGE_HALF>;

export type KeyReading =
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
const PREVENTED_KEYS = ["-absorb", "-absorbm", "-blok"];
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
    ["+legbon_curse", PROC_END.actor],
    ["+legbon_verycrit", PROC_END.actor],
    ["-legbon_cleanse", PROC_END.target],
    ["-legbon_glare", PROC_END.target],
    [CHARGE_BROKEN_KEY, PROC_END.unsettled],
    ["+superspell-prevented", PROC_END.unsettled],
    ["-tenacity", PROC_END.unsettled],
    ["-evade", PROC_END.target],
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
    "+legbon_puncture",
    "+ph",
    "+rage",
    "+taken_dmg",
    "-endest",
    "-legbon_critred",
    "-legbon_facade",
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
    "+legbon_anguish",
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
    // The affected are forced to attack _Postaci, która użyła umiejętności_: you do not force an
    // ally to strike you. Over `captures/` 2026-09-22, 168 of 168 characters named across
    // 166 announcements stand opposite the caster.
    [PROVOCATION_KEY, KEY_REACH.otherSide],
]);

const TEAM_WIDE_OPENING = "aura-";
const TEAM_WIDE_ENDINGS = ["-all", "-allies", "-enemies"];
/**
 * Team-wide by meaning, carrying neither shape above. `healall_per` is not here because it is
 * health rather than a standing, and reaches a row of its own.
 */
const TEAM_WIDE_KEYS = [PROVOCATION_KEY, SLOW_ALL_KEY, "alllowdmg"];

const KEY_READING_BY_KEY: ReadonlyMap<string, KeyReading> = indexKeyReadings();

/** `null`: the key reaches no side anybody has stated. */
export function lookupKeyReach(key: string): KeyReach | null {
    assert(key.length > 0, "a reach is asked of a key");
    const reach = REACH_BY_KEY.get(key) ?? null;
    if (reach !== null) assert(isTeamWideKey(key), "a key reaching a side is a team-wide key");
    return reach;
}

/** Whether a key reaches more than one combatant, by its shape or by its meaning. */
export function isTeamWideKey(key: string): boolean {
    assert(key.length > 0, "a key that is asked about is named");
    if (key.startsWith(TEAM_WIDE_OPENING)) return true;
    for (const ending of TEAM_WIDE_ENDINGS) {
        if (key.endsWith(ending)) return true;
    }
    return TEAM_WIDE_KEYS.includes(key);
}

export function getKeyReading(key: string): KeyReading | null {
    assert(key.length > 0, "a key asked about is a key the message wrote");
    const listed = KEY_READING_BY_KEY.get(key);
    if (listed !== undefined) return listed;
    const marker = key.slice(DAMAGE_MARKER_AT, DAMAGE_MARKER_AT + DAMAGE_MARKER.length);
    if (marker !== DAMAGE_MARKER) return null;
    const sign = key.slice(0, DAMAGE_MARKER_AT);
    let half: DamageHalf;
    if (sign === RAW_SIGN) half = DAMAGE_HALF.raw;
    else if (sign === APPLIED_SIGN) half = DAMAGE_HALF.applied;
    else return null;
    assert(!KEY_READING_BY_KEY.has(key), "a key read by the family rule is in no list");
    return { kind: KEY_FAMILY.damage, half };
}

function indexKeyReadings(): Map<string, KeyReading> {
    const found = new Map<string, KeyReading>();
    const add = (key: string, reading: KeyReading) => {
        assert(!found.has(key), "a key belongs to one family");
        found.set(key, reading);
    };
    for (const key of DAMAGE_KEYS) {
        add(key, {
            kind: KEY_FAMILY.damage,
            half: key.startsWith(RAW_SIGN) ? DAMAGE_HALF.raw : DAMAGE_HALF.applied,
        });
    }
    for (const key of PREVENTED_KEYS) add(key, { kind: KEY_FAMILY.prevented });
    for (const key of DESTROYED_KEYS) add(key, { kind: KEY_FAMILY.destroyed });
    for (const [key, end] of PROC_END_BY_KEY) {
        add(key, { kind: KEY_FAMILY.proc, end, doesTakeValue: PROCS_WITH_VALUE.includes(key) });
    }
    for (const [key, change] of HEALTH_CHANGE_BY_KEY) {
        add(key, { kind: KEY_FAMILY.healthChange, ...change });
    }
    for (const key of DECLARATION_KEYS) add(key, { kind: KEY_FAMILY.declaration });
    for (const key of VALUELESS_DECLARATION_KEYS) {
        add(key, { kind: KEY_FAMILY.valuelessDeclaration });
    }
    add("tspell", { kind: KEY_FAMILY.skillName });
    add("tcustom", { kind: KEY_FAMILY.customSkillName });
    add(SKILL_ID_KEY, { kind: KEY_FAMILY.skillId });
    add("winner", { kind: KEY_FAMILY.outcome, result: OUTCOME_RESULT.won });
    add("loser", { kind: KEY_FAMILY.outcome, result: OUTCOME_RESULT.lost });
    add("flee", { kind: KEY_FAMILY.fled });
    add("healall_per", { kind: KEY_FAMILY.unaccountedHealth });
    add("+oth_dmg", { kind: KEY_FAMILY.namedDamage });
    add(LASTHEAL_KEY, { kind: KEY_FAMILY.namedHealing });
    assert(found.size > PROC_END_BY_KEY.size, "every family is indexed, not only the procs");
    return found;
}
