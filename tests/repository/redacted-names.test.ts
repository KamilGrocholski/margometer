/**
 * `captures/AGENTS.md`'s Never, held over the material: **no player nickname is in this
 * repository**. The intake substitutes one for a label and its own docblock says the redaction is
 * not complete; nothing checked the result until this file. What is decidable is that every name a
 * message carries is a combatant its recording's roster holds — a nickname that survived belongs
 * to nobody in it. Which of them is a person is `docs/captured-fights.md`'s, and that is guarded.
 *
 * ⚠️ **The roster comes off the payloads and never off the snapshots.** A fight the game had
 * already run itself arrives in a single call and snapshots nobody, so a reading over the
 * snapshots has no roster for it and used to skip it — which left the one material most likely
 * to carry a leak as the one material nothing read.
 */

import { assert, assertEquals } from "@std/assert";
import { decodeFightMessages, NAME_SEPARATOR } from "@/src/core/fight-decoder.ts";
import { PROVOCATION_KEY } from "@/src/core/aura-standing.ts";
import { readRecordingPaths } from "@/project/repository-layout.ts";
import {
    BLOWS_GRANTED,
    composeRecordedRoster,
    getRecordedPayloads,
} from "@/tests/recorded-fight.ts";

/** The keys whose value is a list of combatant names, in the grammar the decoder splits on. */
const NAME_KEYS = [PROVOCATION_KEY];

Deno.test("no recording carries a name its own roster cannot place", () => {
    const outside: string[] = [];
    let read = 0;
    for (const path of readRecordingPaths()) {
        const roster = composeRecordedRoster(path);
        const known = new Set(roster.idByName.keys());
        for (const payload of getRecordedPayloads(path)) {
            for (const event of decodeFightMessages(payload, roster, BLOWS_GRANTED)) {
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
});
