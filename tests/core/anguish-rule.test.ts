/**
 * `anguish`, and the announcement that applies it, held to what the register claims of both.
 *
 * The tick names its victim and nothing else, and the announcement carries no figure — so a tick
 * cannot be matched to an application, and the reading that charges one to whoever applied it has
 * nothing to stand on (`docs/protocol-keys.md`).
 */

import { assert, assertEquals } from "@std/assert";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import {
    getRecordedCombatants,
    getRecordedMessages,
    getRecordingPaths,
} from "@/tests/recorded-fight.ts";

const TICK_KEY = "anguish";
const ANNOUNCEMENT_KEY = "+legbon_anguish";
/**
 * The one recording where two combatants apply the bleed to the same victim. It is what makes the
 * refusal legible: with one applier, charging a tick to them cannot be told from charging it to
 * nobody.
 */
const TWO_APPLIERS = "captures/2026-08-25-luvia-grupa-vs-draugr.json";

Deno.test("every tick names its victim in the actor slot and nobody at the other end", () => {
    let ticks = 0;
    for (const path of getRecordingPaths()) {
        for (const message of getRecordedMessages(path)) {
            const parsed = parseProtocolMessage(message);
            const carries = parsed.parameters.some((one) => one.key === TICK_KEY);
            if (!carries) continue;
            ticks += 1;
            assert(parsed.actor !== null, `${path}: a tick states whose health moved`);
            assertEquals(parsed.target, null, `${path}: and states nobody at the other end`);
        }
    }
    assertEquals(ticks, 70, "every tick the material carries was read, 2026-08-30");
});

/**
 * ⚠️ The keys are spelled here rather than read off the decoder's own tables: a test that asks the
 * decoder what it reads holds it to itself. `tests/AGENTS.md` says the duplication is the point.
 */
Deno.test("the announcement carries no figure, so nothing says which application ticks", () => {
    let announcements = 0;
    for (const path of getRecordingPaths()) {
        for (const message of getRecordedMessages(path)) {
            for (const one of parseProtocolMessage(message).parameters) {
                if (one.key !== ANNOUNCEMENT_KEY) continue;
                announcements += 1;
                assertEquals(one.value, null, `${path}: an announcement that states a figure`);
            }
        }
    }
    assertEquals(announcements, 18, "every announcement the material carries was read, 2026-08-30");
});

Deno.test("a tick is charged to its victim, and to nobody who applied the bleed", () => {
    const roster = composeCombatantRoster(getRecordedCombatants(TWO_APPLIERS));
    const messages = getRecordedMessages(TWO_APPLIERS);
    const appliers = new Set<number>();
    for (const message of messages) {
        const parsed = parseProtocolMessage(message);
        if (!parsed.parameters.some((one) => one.key === ANNOUNCEMENT_KEY)) continue;
        const applier = parsed.actor?.combatantId;
        if (applier !== undefined) appliers.add(applier);
    }
    assertEquals(appliers.size, 2, "two combatants apply the bleed in this fight");

    const events = decodeFightMessages(messages, roster);
    const ticked = events.filter((event) =>
        event.kind === "health-change" && event.source === TICK_KEY
    );
    assertEquals(ticked.length, 25, "and this many ticks come back off it");
    const victims = new Set<number>();
    for (const event of ticked) {
        assert(event.kind === "health-change", "a tick is a health change");
        assert(event.amount < 0, "a bleed takes health rather than putting it back");
        assertEquals(event.announced, null, "and nothing announced the tick itself");
        // Not `add(combatantId)`: a reading off the empty slot answers null for every tick, and a
        // set of one null is a set of one — which is what a first draft of this test accepted.
        assert(event.combatantId !== null, "a tick names whose health moved");
        victims.add(event.combatantId);
    }
    assertEquals(victims.size, 1, "every tick lands on the one victim both appliers reached");
    for (const applier of appliers) {
        assert(!victims.has(applier), "and never on whoever applied it");
    }
});

Deno.test("the bleed reaches the victim's own figures and credits nobody with dealing it", () => {
    const roster = composeCombatantRoster(getRecordedCombatants(TWO_APPLIERS));
    const events = decodeFightMessages(getRecordedMessages(TWO_APPLIERS), roster);
    const bled = events.filter((event) =>
        event.kind === "health-change" && event.source === TICK_KEY
    );
    const total = bled.reduce(
        (sum, event) => sum + (event.kind === "health-change" ? -event.amount : 0),
        0,
    );
    assert(total > 0, "the ticks come to something");
    const only = composeFightStatistics(
        bled.map((event) => event),
        new Map(),
    );
    const victim = [...only.byCombatantId.entries()][0];
    assert(victim !== undefined, "the victim has a row of their own");
    assertEquals(only.byCombatantId.size, 1, "and is the only combatant the ticks name");
    assertEquals(victim[1].damageTakenApplied, total, "who is charged the whole of the bleed");
    assertEquals(only.dealtByNobody, total, "while it is dealt by nobody the protocol named");
});
