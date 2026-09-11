/**
 * `captures/AGENTS.md`'s Never, held over the material: **no player nickname is in this
 * repository**. The intake substitutes one for a label and its own docblock says the redaction is
 * not complete; nothing checked the result until this file. What is decidable is that every name a
 * message carries is a combatant its recording's roster holds — a nickname that survived belongs
 * to nobody in it. Which of them is a person is `docs/captured-fights.md`'s, and that is guarded.
 */

import { assert, assertEquals } from "@std/assert";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFightMessages, NAME_SEPARATOR } from "@/src/core/fight-decoder.ts";
import { PROVOCATION_KEY } from "@/src/core/aura-standing.ts";
import { readRecordingPaths } from "@/project/repository-layout.ts";
import { getRecordedCombatants, getRecordedPayloads } from "@/tests/recorded-fight.ts";

/** The keys whose value is a list of combatant names, in the grammar the decoder splits on. */
const NAME_KEYS = [PROVOCATION_KEY];

/**
 * ⚠️ **One recording snapshots no combatants, and it is the only one** — a fight the game was
 * already running itself, arriving in a single call. It costs the tools nothing:
 * `tools/fight-replay.ts` takes its roster off the payloads and draws all three rows. What the
 * panel held while the fight was on is not settled by this, and the empty snapshot is the only
 * record of it. Registered rather than skipped, so a second one reddens the gate.
 */
const NO_ROSTER_RECORDED = "2026-08-24-tempest-tropiciel-vs-centaury-auto-1786514810315-0.8.1.json";

Deno.test("no recording carries a name its own roster cannot place", () => {
    const outside: string[] = [];
    let read = 0;
    const empty: string[] = [];
    for (const path of readRecordingPaths()) {
        const combatants = getRecordedCombatants(path);
        if (combatants.length === 0) {
            empty.push(path);
            continue;
        }
        const roster = composeCombatantRoster(combatants);
        const known = new Set(combatants.map((one) => one.name));
        for (const payload of getRecordedPayloads(path)) {
            for (const event of decodeFightMessages(payload, roster)) {
                const said: string[] = [];
                if (event.kind === "fight-outcome") said.push(...event.combatantNames);
                // The decoder keeps the raw name beside the id, and answers null where no
                // roster places it — so without this a leak is dropped rather than found.
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
                    if (known.has(name)) continue;
                    outside.push(`${path}: ${name}`);
                }
            }
        }
    }
    assert(read > 0, "the recordings carry names for this to be asked of");
    assertEquals(outside, [], "a name no roster places is a leak or a gap, and both are findings");
    assertEquals(
        empty.map((path) => path.slice(path.lastIndexOf("/") + 1)),
        [NO_ROSTER_RECORDED],
        "a second recording with no roster of its own is a finding, not a second exception",
    );
});
