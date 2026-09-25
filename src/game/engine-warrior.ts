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
        if (!id.ok) continue;
        if (id.value === null) continue;
        const combatant = readWarriorEntriesCombatant(entry, id.value);
        if (combatant !== null) reading.combatants.push(combatant);
        const mask = readWarriorEntriesMask(entry);
        if (mask !== null) reading.statusMasksByCombatantId.set(id.value, mask);
        const charge = readWarriorEntriesCharge(entry);
        reading.chargeStatements.push({ combatantId: id.value, charge });
    }
    assert(reading.combatants.length <= entries.length, "a combatant is one entry");
    return reading;
}

/** A combatant stated in full: an id, a name and a side. The rest may be absent. */
function readWarriorEntriesCombatant(entry: UnknownRecord, id: number): Combatant | null {
    const name = getStatedTextField(entry, WARRIOR_FIELDS, "name");
    if (!name.ok) return null;
    if (name.value === null) return null;
    const side = getNumberField(entry, WARRIOR_FIELDS, "side");
    if (!side.ok) return null;
    if (side.value === null) return null;
    const profession = getStatedTextField(entry, WARRIOR_FIELDS, "profession");
    const level = getNumberField(entry, WARRIOR_FIELDS, "level");
    const combatant = {
        id,
        name: name.value,
        side: side.value,
        profession: profession.ok ? profession.value : null,
        level: level.ok ? level.value : null,
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
    if (!health.ok) return null;
    if (health.value === null) return null;
    const figure = getNumberField(health.value, HEALTH_FIELDS, field);
    if (!figure.ok) return null;
    if (figure.value === null) return null;
    if (field === "maximum") {
        if (figure.value <= 0) return null;
    }
    return figure.value;
}

/**
 * The one integer the payload restates for a combatant every time, read by bit position. An entry
 * stating no mask is absent rather than clear. ⚠️ **A combatant who has fallen carries nothing,
 * whatever their mask still says**: 44 entries of 113 at zero health carry a lit mask over
 * `captures/` (2026-09-22), and the client takes the icons down at exactly that point
 * (`hasZeroHpp() && ($(".buff", this.$).remove(), …)`, production build `Bb28FQty`).
 */
function readWarriorEntriesMask(entry: UnknownRecord): number | null {
    const now = readWarriorEntriesHealth(entry, "now");
    if (now !== null) {
        if (now <= 0) return NOTHING_CARRIED;
    }
    const mask = getNumberField(entry, WARRIOR_FIELDS, "statuses");
    if (!mask.ok) return null;
    if (mask.value === null) return null;
    if (mask.value < 0) return null;
    if (!Number.isSafeInteger(mask.value)) return null;
    return mask.value;
}

/**
 * The charge an entry carries, or null where it states none: that is how the game says one has
 * ended (`super_cast` is cleared the moment the blow lands or is taken away, build `Cl9U89Zr`).
 * Half of the pair of figures is nothing worth drawing, so a partial charge reads as none.
 */
function readWarriorEntriesCharge(entry: UnknownRecord): ChargedSkillStatement["charge"] {
    const stated = getRecordField(entry, WARRIOR_FIELDS, "charge");
    if (!stated.ok) return null;
    if (stated.value === null) return null;
    const skillName = getStatedTextField(stated.value, CHARGE_FIELDS, "name");
    const turnsElapsed = getNumberField(stated.value, CHARGE_FIELDS, "turnsElapsed");
    const turnsStated = getNumberField(stated.value, CHARGE_FIELDS, "turnsStated");
    if (!skillName.ok) return null;
    if (!turnsElapsed.ok) return null;
    if (!turnsStated.ok) return null;
    if (skillName.value === null) return null;
    if (turnsElapsed.value === null) return null;
    if (turnsStated.value === null) return null;
    if (turnsElapsed.value < 0) return null;
    if (turnsStated.value < turnsElapsed.value) return null;
    const charge = { skillName: skillName.value, turnsElapsed: turnsElapsed.value };
    return { ...charge, turnsStated: turnsStated.value };
}
