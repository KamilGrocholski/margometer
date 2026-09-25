/**
 * The union against what actually arrives.
 *
 * A variant nothing produces is dead weight the tests themselves would keep alive, so the corpus
 * is what decides which kinds may exist.
 */

import { assert, assertEquals } from "@std/assert";
import { BATTLE_EVENT } from "#/src/core/battle-event.ts";
import { decodePayloadMessages } from "#/src/core/fight-decoder.ts";
import { BLOWS_GRANTED } from "#/tests/frozen-tables.ts";
import { decodeRecordedFight, readRecordedFights } from "#/tests/recorded-fights.ts";

Deno.test("every variant the union holds is produced by the recordings", () => {
    const produced = new Set<string>();
    for (const fight of readRecordedFights()) {
        for (const event of decodeRecordedFight(fight).events) produced.add(event.kind);
    }
    // An unknown message is what the decoder makes of a key nobody has read, so no recording can
    // be expected to carry one: every key the recordings hold is read. The probe stands in for
    // the protocol change this variant exists for.
    const context = { roster: null, standing: null, tables: BLOWS_GRANTED };
    for (const event of decodePayloadMessages(["0;0;whatever_per=30"], context).events) {
        produced.add(event.kind);
    }
    const listed: readonly string[] = Object.values(BATTLE_EVENT);
    assertEquals(listed.filter((kind) => !produced.has(kind)), [], "a variant nothing produces");
    assertEquals([...produced].filter((kind) => !listed.includes(kind)), [], "an unlisted kind");
    assert(produced.size > 1, "the recordings exercise more than one variant");
});
