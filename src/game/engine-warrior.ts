/**
 * The combatants a payload's warrior entries state, read into the roster's own shape, with the
 * mask and the charge each entry carries.
 *
 * A payload restates only what moved, so an entry is often partial. An entry missing what the
 * roster needs is not a combatant stated in full and is passed over, never refused: that is how the
 * game writes, not a fault in what it wrote. The envelope refuses the shape around the entries.
 */

import { assert } from "@std/assert/assert";
import {
    type FieldKeys,
    getNumberField,
    getRecordField,
    getStatedTextField,
    isRecord,
    type UnknownRecord,
} from "#/libs/unknown-value.ts";
import type { ChargedSkillStatement } from "#/src/core/charged-skill.ts";
import { type Combatant, COMBATANTS_MAXIMUM } from "#/src/core/combatant-roster.ts";

type WarriorField =
    | "id"
    | "name"
    | "side"
    | "profession"
    | "level"
    | "health"
    | "statuses"
    | "charge";

type HealthField = "maximum" | "now";

type ChargeField = "name" | "turnsElapsed" | "turnsStated";

export interface WarriorReading {
    combatants: Combatant[];
    statusMasksByCombatantId: Map<number, number>;
    chargeStatements: ChargedSkillStatement[];
}

/** The client's own keys for one warrior entry, spelled here and nowhere else (N13). */
export const WARRIOR_FIELDS: FieldKeys<WarriorField> = {
    id: "id",
    name: "name",
    side: "team",
    profession: "prof",
    level: "lvl",
    health: "hp",
    statuses: "buffs",
    charge: "super_cast",
};
const HEALTH_FIELDS: FieldKeys<HealthField> = { maximum: "max", now: "cur" };
const CHARGE_FIELDS: FieldKeys<ChargeField> = {
    name: "name",
    turnsElapsed: "turn",
    turnsStated: "total_turns",
};

/** The mask a fallen combatant is read at, which clears whatever they were holding. */
const NOTHING_CARRIED = 0;

/** The entries of one payload, read once each. The caller has bounded their count. */
export function readWarriorEntries(entries: readonly unknown[]): WarriorReading {
    assert(
        entries.length <= COMBATANTS_MAXIMUM,
        "a payload's warriors are bounded by the envelope",
    );
    const reading: WarriorReading = {
        combatants: [],
        statusMasksByCombatantId: new Map(),
        chargeStatements: [],
    };
    for (const entry of entries) {
        if (!isRecord(entry)) continue;
        const id = getNumberField(entry, WARRIOR_FIELDS, "id");
        if (id instanceof Error) continue;
        if (id === null) continue;
        const combatant = readWarriorEntriesCombatant(entry, id);
        if (combatant !== null) reading.combatants.push(combatant);
        const mask = readWarriorEntriesMask(entry);
        if (mask !== null) reading.statusMasksByCombatantId.set(id, mask);
        const charge = readWarriorEntriesCharge(entry);
        reading.chargeStatements.push({ combatantId: id, charge });
    }
    assert(reading.combatants.length <= entries.length, "a combatant is one entry");
    return reading;
}

/** A combatant stated in full: an id, a name and a side. The rest may be absent. */
function readWarriorEntriesCombatant(entry: UnknownRecord, id: number): Combatant | null {
    const name = getStatedTextField(entry, WARRIOR_FIELDS, "name");
    if (name instanceof Error) return null;
    if (name === null) return null;
    const side = getNumberField(entry, WARRIOR_FIELDS, "side");
    if (side instanceof Error) return null;
    if (side === null) return null;
    const profession = getStatedTextField(entry, WARRIOR_FIELDS, "profession");
    const level = getNumberField(entry, WARRIOR_FIELDS, "level");
    const combatant = {
        id,
        name,
        side,
        profession: profession instanceof Error ? null : profession,
        level: level instanceof Error ? null : level,
        healthMaximum: readWarriorEntriesHealth(entry, "maximum"),
    };
    assert(combatant.name.length > 0, "a name that was read says something");
    return combatant;
}

/**
 * A figure of the entry's health, or null where it says nothing about it. A pool of nothing or
 * below it is one no share can be read against: the same null a pool nobody stated is.
 */
function readWarriorEntriesHealth(entry: UnknownRecord, field: HealthField): number | null {
    const health = getRecordField(entry, WARRIOR_FIELDS, "health");
    if (health instanceof Error) return null;
    if (health === null) return null;
    const figure = getNumberField(health, HEALTH_FIELDS, field);
    if (figure instanceof Error) return null;
    if (figure === null) return null;
    if (field === "maximum") {
        if (figure <= 0) return null;
    }
    return figure;
}

/**
 * The one integer the payload restates for a combatant every time, read by bit position. An entry
 * stating no mask is absent rather than clear. ⚠️ **A combatant who has fallen carries nothing,
 * whatever their mask still says**: 44 entries of 113 at zero health carry a lit mask over
 * `captures/` (2026-09-22), and the client removes a fighter's status icons at exactly that point,
 * once their health reads zero (production build `Bb28FQty`).
 */
function readWarriorEntriesMask(entry: UnknownRecord): number | null {
    const now = readWarriorEntriesHealth(entry, "now");
    if (now !== null) {
        if (now <= 0) return NOTHING_CARRIED;
    }
    const mask = getNumberField(entry, WARRIOR_FIELDS, "statuses");
    if (mask instanceof Error) return null;
    if (mask === null) return null;
    if (mask < 0) return null;
    if (!Number.isSafeInteger(mask)) return null;
    return mask;
}

/**
 * The charge an entry carries, or null where it states none: that is how the game says one has
 * ended (`super_cast` is cleared the moment the blow lands or is taken away, build `Cl9U89Zr`).
 * Half of the pair of figures is nothing worth drawing, so a partial charge reads as none.
 */
function readWarriorEntriesCharge(entry: UnknownRecord): ChargedSkillStatement["charge"] {
    const stated = getRecordField(entry, WARRIOR_FIELDS, "charge");
    if (stated instanceof Error) return null;
    if (stated === null) return null;
    const skillName = getStatedTextField(stated, CHARGE_FIELDS, "name");
    const turnsElapsed = getNumberField(stated, CHARGE_FIELDS, "turnsElapsed");
    const turnsStated = getNumberField(stated, CHARGE_FIELDS, "turnsStated");
    if (skillName instanceof Error) return null;
    if (turnsElapsed instanceof Error) return null;
    if (turnsStated instanceof Error) return null;
    if (skillName === null) return null;
    if (turnsElapsed === null) return null;
    if (turnsStated === null) return null;
    if (turnsElapsed < 0) return null;
    if (turnsStated < turnsElapsed) return null;
    const charge = { skillName, turnsElapsed };
    return { ...charge, turnsStated };
}
