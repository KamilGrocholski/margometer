/**
 * Who is in the fight, so that a combatant the protocol names can be matched to the one it means.
 *
 * The protocol names people two ways and reconciles neither: by id at a message's ends, and by name
 * inside a handful of values. A name is not unique (the hunt of 2026-08-04 fields two combatants
 * called `Odyniec`), so an ambiguous name resolves to nobody. Charging a real figure to the wrong
 * combatant is the failure this project exists to prevent.
 */

import { assert } from "@std/assert/assert";

export interface Combatant {
    id: number;
    name: string;
    side: number;
    /** The game's own one-letter profession code, or null where it stated none. */
    profession: string | null;
    level: number | null;
    healthMaximum: number | null;
}

export interface CombatantRoster {
    byId: ReadonlyMap<number, Combatant>;
    /** Null where more than one combatant answers to the name. */
    idByName: ReadonlyMap<string, number | null>;
}

/**
 * The published help states it outright: a fight holds up to twenty characters, ten on each side
 * (article `view,372`, read 2026-09-15).
 */
export const COMBATANTS_MAXIMUM = 20;

const AMBIGUOUS = null;

/** The envelope has bounded the cast and refused a repeated id already; here both are asserted. */
export function indexCombatantRoster(combatants: readonly Combatant[]): CombatantRoster {
    assert(combatants.length <= COMBATANTS_MAXIMUM, "a cast stays inside its stated bound");
    const byId = new Map<number, Combatant>();
    const idByName = new Map<string, number | null>();
    for (const combatant of combatants) {
        assert(!byId.has(combatant.id), "a cast names each combatant once");
        assert(combatant.name.length > 0, "a combatant in a cast is named");
        byId.set(combatant.id, combatant);
        if (idByName.has(combatant.name)) idByName.set(combatant.name, AMBIGUOUS);
        else idByName.set(combatant.name, combatant.id);
    }
    assert(byId.size === combatants.length, "a roster holds everybody it was handed");
    assert(idByName.size <= byId.size, "a name belongs to somebody in the roster");
    return { byId, idByName };
}

/** `null`: ambiguous, or nobody. */
export function lookupCombatantIdByName(roster: CombatantRoster, name: string): number | null {
    assert(name.length > 0, "a name to resolve is never empty");
    const found = roster.idByName.get(name) ?? AMBIGUOUS;
    if (found === AMBIGUOUS) return AMBIGUOUS;
    assert(roster.byId.get(found)?.name === name, "a name resolves to somebody who holds it");
    return found;
}
