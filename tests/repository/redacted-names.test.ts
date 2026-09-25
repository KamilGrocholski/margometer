/**
 * `captures/AGENTS.md`'s Never, held over the material: no player nickname is in this repository.
 * The intake substitutes names tied to a combatant id and says its redaction is not complete; what
 * is decidable is that every name a message carries is one its recording's roster holds, since a
 * nickname that survived belongs to nobody in it.
 *
 * ⚠️ **The roster is the add-on's, off the payloads, never off the snapshots.** A fight the game
 * ran itself arrives in one call and snapshots nobody, so a reading over the snapshots would skip
 * the material most likely to carry a leak.
 */

import { assert, assertEquals } from "@std/assert";
import { BATTLE_EVENT, type BattleEvent, OUTCOME_RESULT } from "#/src/core/battle-event.ts";
import { indexCombatantRoster } from "#/src/core/combatant-roster.ts";
import { NAME_SEPARATOR, PROVOCATION_KEY } from "#/src/core/protocol-key.ts";
import { readRecordedMaterial, replayRecordedMaterial } from "#/tools/recorded-material.ts";

/** The keys whose value is a list of combatant names, in the grammar the decoder splits on. */
const NAME_KEYS: readonly string[] = [PROVOCATION_KEY];

Deno.test("a name the roster lacks is flagged, one it holds is not, and each is read", () => {
    const roster = indexCombatantRoster([
        { id: 1, name: "Gracz 1", side: 1, profession: "w", level: 1, healthMaximum: 10 },
    ]);
    const events: BattleEvent[] = [
        {
            kind: BATTLE_EVENT.fightOutcome,
            result: OUTCOME_RESULT.won,
            combatantNames: ["Gracz 1", "Leak"],
        },
        {
            kind: BATTLE_EVENT.declaration,
            combatantId: 1,
            healthPercent: null,
            declared: [
                { effect: PROVOCATION_KEY, amount: null, text: `Gracz 1${NAME_SEPARATOR}Other` },
                { effect: "txt", amount: null, text: "Prose that names Nobody" },
            ],
        },
        {
            kind: BATTLE_EVENT.healingToNamedCombatant,
            targetName: "Third",
            targetId: null,
            targetHealthPercent: null,
            amount: 1,
            source: "heal",
        },
    ];
    const found = lookupUnplacedNames(events, new Set(roster.idByName.keys()));
    assertEquals(found.outside, ["Leak", "Other", "Third"], "an outcome, a shout and a target");
    assertEquals(found.read, 5, "and free prose is not a list of names");
});

function lookupUnplacedNames(
    events: readonly BattleEvent[],
    known: ReadonlySet<string>,
): { read: number; outside: string[] } {
    const outside: string[] = [];
    let read = 0;
    for (const event of events) {
        const said: string[] = [];
        if (event.kind === BATTLE_EVENT.fightOutcome) said.push(...event.combatantNames);
        // The decoder keeps the raw name beside the id and answers null where no roster places
        // it, so without this a leak is dropped rather than found.
        if ("targetName" in event) said.push(event.targetName);
        if ("declared" in event) {
            for (const one of event.declared) {
                if (!NAME_KEYS.includes(one.effect)) continue;
                if (one.text === null) continue;
                said.push(...one.text.split(NAME_SEPARATOR));
            }
        }
        for (const name of said) {
            if (name.length === 0) continue;
            read += 1;
            if (!known.has(name)) outside.push(name);
        }
    }
    return { read, outside };
}

Deno.test("no recording carries a name its own roster cannot place", () => {
    const outside: string[] = [];
    let read = 0;
    for (const { fight, reading } of replayRecordedMaterial(readRecordedMaterial([]))) {
        const known = new Set(reading.view.roster.idByName.keys());
        const found = lookupUnplacedNames(reading.view.events, known);
        read += found.read;
        outside.push(...found.outside.map((name) => `${fight.path}: ${name}`));
    }
    assert(read > 0, "the recordings carry names for this to be asked of");
    assertEquals(outside, [], "a name no roster places is a leak or a gap, and both are findings");
});
