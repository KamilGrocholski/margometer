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
        let combatant: Combatant | null;
        // Read a combatant stated in full: an id, a name and a side. The rest may be absent.
        readCombatant: {
            const name = getStatedTextField(entry, WARRIOR_FIELDS, "name");
            if (name instanceof Error) {
                combatant = null;
                break readCombatant;
            }
            if (name === null) {
                combatant = null;
                break readCombatant;
            }
            const side = getNumberField(entry, WARRIOR_FIELDS, "side");
            if (side instanceof Error) {
                combatant = null;
                break readCombatant;
            }
            if (side === null) {
                combatant = null;
                break readCombatant;
            }
            const profession = getStatedTextField(entry, WARRIOR_FIELDS, "profession");
            const level = getNumberField(entry, WARRIOR_FIELDS, "level");
            combatant = {
                id,
                name,
                side,
                profession: profession instanceof Error ? null : profession,
                level: level instanceof Error ? null : level,
                healthMaximum: readWarriorEntriesHealth(entry, "maximum"),
            };
            assert(combatant.name.length > 0, "a name that was read says something");
        }
        if (combatant !== null) reading.combatants.push(combatant);
        let mask: number | null;
        // Read the one integer the payload restates for a combatant every time, by bit position.
        readMask: {
            // An entry stating no mask is absent rather than clear. ⚠️ **A combatant who has fallen
            // carries nothing, whatever their mask still says**: 44 entries of 113 at zero health
            // carry a lit mask over `captures/` (2026-09-22), and the client removes a fighter's
            // status icons at exactly that point, once their health reads zero (production build
            // `Bb28FQty`).
            const now = readWarriorEntriesHealth(entry, "now");
            if (now !== null) {
                if (now <= 0) {
                    mask = NOTHING_CARRIED;
                    break readMask;
                }
            }
            const stated = getNumberField(entry, WARRIOR_FIELDS, "statuses");
            if (stated instanceof Error) {
                mask = null;
                break readMask;
            }
            if (stated === null) {
                mask = null;
                break readMask;
            }
            if (stated < 0) {
                mask = null;
                break readMask;
            }
            if (!Number.isSafeInteger(stated)) {
                mask = null;
                break readMask;
            }
            mask = stated;
        }
        if (mask !== null) reading.statusMasksByCombatantId.set(id, mask);
        let charge: ChargedSkillStatement["charge"];
        // Read the charge the entry carries, or null where it states none.
        readCharge: {
            // None is how the game says one has ended (`super_cast` is cleared the moment the blow
            // lands or is taken away, build `Cl9U89Zr`). Half of the pair of figures is nothing
            // worth drawing, so a partial charge reads as none.
            const stated = getRecordField(entry, WARRIOR_FIELDS, "charge");
            if (stated instanceof Error) {
                charge = null;
                break readCharge;
            }
            if (stated === null) {
                charge = null;
                break readCharge;
            }
            const skillName = getStatedTextField(stated, CHARGE_FIELDS, "name");
            const turnsElapsed = getNumberField(stated, CHARGE_FIELDS, "turnsElapsed");
            const turnsStated = getNumberField(stated, CHARGE_FIELDS, "turnsStated");
            if (skillName instanceof Error) {
                charge = null;
                break readCharge;
            }
            if (turnsElapsed instanceof Error) {
                charge = null;
                break readCharge;
            }
            if (turnsStated instanceof Error) {
                charge = null;
                break readCharge;
            }
            if (skillName === null) {
                charge = null;
                break readCharge;
            }
            if (turnsElapsed === null) {
                charge = null;
                break readCharge;
            }
            if (turnsStated === null) {
                charge = null;
                break readCharge;
            }
            if (turnsElapsed < 0) {
                charge = null;
                break readCharge;
            }
            if (turnsStated < turnsElapsed) {
                charge = null;
                break readCharge;
            }
            const stood = { skillName, turnsElapsed };
            charge = { ...stood, turnsStated };
        }
        reading.chargeStatements.push({ combatantId: id, charge });
    }
    assert(reading.combatants.length <= entries.length, "a combatant is one entry");
    return reading;
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
