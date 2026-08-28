/**
 * Who is in the fight, so that a combatant the protocol names can be matched to the one it
 * means.
 *
 * The protocol names people two ways and reconciles neither: by id at a message's ends, and by
 * name inside a handful of values. A name is not unique — `2026-08-04-tempest-lowca-vs-odyncze`
 * fields two combatants called `Odyniec` — so an ambiguous name resolves to nobody. Charging a
 * real figure to the wrong combatant is the failure this project exists to prevent.
 */

import { assert } from "@std/assert";

export interface Combatant {
    id: number;
    name: string;
    side: number;
    /** The game's own one-letter profession code, or null where it stated none. */
    profession: string | null;
    level: number | null;
    /** Null is an answer: a share taken of a maximum nobody stated is a figure that is too high. */
    healthMaximum: number | null;
}

export interface CombatantRoster {
    byId: ReadonlyMap<number, Combatant>;
    /** Null where more than one combatant answers to the name. */
    idByName: ReadonlyMap<string, number | null>;
}

/** The largest fight in `captures/` fields 11 combatants, 2026-08-28. */
const MAXIMUM_COMBATANTS = 64;
const AMBIGUOUS = null;

export function composeCombatantRoster(combatants: readonly Combatant[]): CombatantRoster {
    assert(combatants.length <= MAXIMUM_COMBATANTS, "a roster stays inside its stated bound");
    const byId = new Map<number, Combatant>();
    const idByName = new Map<string, number | null>();
    for (const combatant of combatants) {
        byId.set(combatant.id, combatant);
        if (!idByName.has(combatant.name)) {
            idByName.set(combatant.name, combatant.id);
            continue;
        }
        // Ambiguity is two combatants, not two sightings: a person listed twice keeps their name,
        // and a name that has already gone ambiguous never comes back.
        if (idByName.get(combatant.name) === combatant.id) continue;
        idByName.set(combatant.name, AMBIGUOUS);
    }
    assert(byId.size <= combatants.length, "a roster holds no more people than it was handed");
    assert(idByName.size <= byId.size, "a name belongs to somebody in the roster");
    return { byId, idByName };
}

export function getCombatantIdByName(roster: CombatantRoster, name: string): number | null {
    assert(name.length > 0, "a name to resolve is never empty");
    const stated = roster.idByName.get(name) ?? AMBIGUOUS;
    if (stated === AMBIGUOUS) return AMBIGUOUS;
    assert(roster.byId.has(stated), "a name resolves to somebody the roster holds");
    return stated;
}
