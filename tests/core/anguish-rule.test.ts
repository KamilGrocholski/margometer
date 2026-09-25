/**
 * `anguish`, and the announcement that applies it, held to what the register claims of both.
 *
 * The tick names its victim and nothing else, and the announcement carries no figure, so a tick
 * cannot be matched to an application, and the reading that charges one to whoever applied it has
 * nothing to stand on (`develop:docs/protocol-keys.md`).
 */

import { assert, assertEquals, assertExists, assertStrictEquals } from "@std/assert";
import { BATTLE_EVENT } from "#/src/core/battle-event.ts";
import { indexCombatantRoster } from "#/src/core/combatant-roster.ts";
import { decodePayloadMessages } from "#/src/core/fight-decoder.ts";
import { tallyFightStatistics, verifyFightStatistics } from "#/src/core/fight-statistics.ts";
import { parseProtocolMessage, type ProtocolMessage } from "#/src/core/protocol-message.ts";
import { BLOWS_GRANTED } from "#/tests/frozen-tables.ts";
import { lookupRecordedFight, readRecordedFights } from "#/tests/recorded-fights.ts";

/** Spelled here rather than read off the key table: `develop:tests/AGENTS.md` says why. */
const TICK_KEY = "anguish";
const ANNOUNCEMENT_KEY = "+legbon_anguish";
/**
 * The one recording where two combatants apply the bleed to the same victim. It is what makes the
 * refusal legible: with one applier, charging a tick to them cannot be told from charging it to
 * nobody.
 */
const TWO_APPLIERS = "captures/2026-08-25-luvia-grupa-vs-draugr-none-none.json";

Deno.test("every tick names its victim in the actor slot and nobody at the other end", () => {
    let ticks = 0;
    for (const fight of readRecordedFights()) {
        for (const message of fight.messages) {
            const parsed = parseOrFail(message, fight.path);
            const carries = parsed.parameters.some((one) => one.key === TICK_KEY);
            if (!carries) continue;
            ticks += 1;
            assertExists(parsed.actor, `${fight.path}: a tick states whose health moved`);
            assertEquals(parsed.target, null, `${fight.path}: and states nobody at the other end`);
        }
    }
    assertEquals(ticks, 73, "every tick the material carries was read, 2026-09-19");
});

function parseOrFail(text: string, path: string): ProtocolMessage {
    const parsed = parseProtocolMessage(text);
    assert(parsed.ok, `${path}: every recorded message parses`);
    return parsed.value;
}

Deno.test("the announcement carries no figure, so nothing says which application ticks", () => {
    let announcements = 0;
    for (const fight of readRecordedFights()) {
        for (const message of fight.messages) {
            for (const one of parseOrFail(message, fight.path).parameters) {
                if (one.key !== ANNOUNCEMENT_KEY) continue;
                announcements += 1;
                assertEquals(one.value, null, `${fight.path}: an announcement stating a figure`);
            }
        }
    }
    assertEquals(announcements, 20, "every announcement the material carries was read, 2026-09-19");
});

Deno.test("a tick is charged to its victim, and to nobody who applied the bleed", () => {
    const appliers = new Set<number>();
    for (const message of lookupRecordedFight(TWO_APPLIERS).messages) {
        const parsed = parseOrFail(message, TWO_APPLIERS);
        if (!parsed.parameters.some((one) => one.key === ANNOUNCEMENT_KEY)) continue;
        const applier = parsed.actor?.combatantId;
        if (applier !== undefined) appliers.add(applier);
    }
    assertEquals(appliers.size, 2, "two combatants apply the bleed in this fight");

    const ticked = decodeTwoAppliers().filter((event) =>
        event.kind === BATTLE_EVENT.healthChange && event.source === TICK_KEY
    );
    assertEquals(ticked.length, 25, "and this many ticks come back off it");
    const victims = new Set<number>();
    for (const event of ticked) {
        assertStrictEquals(event.kind, BATTLE_EVENT.healthChange, "a tick is a health change");
        assert(event.amount < 0, "a bleed takes health rather than putting it back");
        assertEquals(event.announced, null, "and nothing announced the tick itself");
        // Not `add(combatantId)`: a reading off the empty slot answers null for every tick, and a
        // set of one null is a set of one, which is what a first draft of this test accepted.
        assertExists(event.combatantId, "a tick names whose health moved");
        victims.add(event.combatantId);
    }
    assertEquals(victims.size, 1, "every tick lands on the one victim both appliers reached");
    for (const applier of appliers) {
        assert(!victims.has(applier), "and never on whoever applied it");
    }
});

function decodeTwoAppliers() {
    const fight = lookupRecordedFight(TWO_APPLIERS);
    const roster = indexCombatantRoster(fight.combatants);
    const context = { roster, standing: null, tables: BLOWS_GRANTED };
    return decodePayloadMessages(fight.messages, context).events;
}

Deno.test("the bleed reaches the victim's own figures and credits nobody with dealing it", () => {
    const bled = decodeTwoAppliers().filter((event) =>
        event.kind === BATTLE_EVENT.healthChange && event.source === TICK_KEY
    );
    let total = 0;
    for (const event of bled) {
        if (event.kind === BATTLE_EVENT.healthChange) total -= event.amount;
    }
    assert(total > 0, "the ticks come to something");
    const only = tallyFightStatistics(bled, new Map());
    verifyFightStatistics(only);
    const victim = [...only.byCombatantId.entries()][0];
    assertExists(victim, "the victim has a row of their own");
    assertEquals(only.byCombatantId.size, 1, "and is the only combatant the ticks name");
    assertEquals(victim[1].damageTakenApplied, total, "who is charged the whole of the bleed");
    assertEquals(only.dealtByNobody, total, "while it is dealt by nobody the protocol named");
});
