/**
 * What a key means, asked of the one owner of it.
 *
 * The keys below are the game's, restated here on purpose: a test asserting what the table reads
 * must spell the keys itself rather than read the table's own lists back.
 */

import {
    assertEquals,
    assertGreater,
    AssertionError,
    assertStrictEquals,
    assertThrows,
} from "@std/assert";
import { getKeyReading, KEY_FAMILY } from "#/src/core/protocol-key.ts";
import { parseProtocolMessage } from "#/src/core/protocol-message.ts";
import { readRecordedFights } from "#/tests/recorded-fights.ts";

Deno.test("the family rule reads a marker, and the sign says which half", () => {
    assertEquals(getKeyReading("+dmgf"), { kind: KEY_FAMILY.damage, half: "raw" }, "raw");
    assertEquals(getKeyReading("-dmgf"), { kind: KEY_FAMILY.damage, half: "applied" }, "applied");
    assertEquals(getKeyReading("+dmg"), { kind: KEY_FAMILY.damage, half: "raw" }, "the plain one");
    assertStrictEquals(getKeyReading("+dm"), null, "a marker cut short is no marker");
    assertStrictEquals(getKeyReading("dmg"), null, "and one at the wrong place is none either");
    assertStrictEquals(getKeyReading("*dmgf"), null, "and one under neither sign is unread");
});

Deno.test("the pair with no marker is read by name", () => {
    assertEquals(getKeyReading("+thirdatt"), { kind: KEY_FAMILY.damage, half: "raw" }, "raw");
    const applied = getKeyReading("-thirdatt");
    assertEquals(applied, { kind: KEY_FAMILY.damage, half: "applied" }, "and applied");
});

Deno.test("a proc's end is the table's, never the sign's", () => {
    const curse = getKeyReading("+legbon_curse");
    assertEquals(curse, { kind: KEY_FAMILY.proc, end: "actor", doesTakeValue: false }, "attacker");
    const cleanse = getKeyReading("-legbon_cleanse");
    assertEquals(cleanse, { kind: KEY_FAMILY.proc, end: "target", doesTakeValue: false }, "struck");
    const tenacity = getKeyReading("-tenacity");
    assertEquals(tenacity, { kind: KEY_FAMILY.proc, end: "unsettled", doesTakeValue: false }, "?");
    const weakened = getKeyReading("+woundpoison");
    assertEquals(weakened, { kind: KEY_FAMILY.proc, end: "actor", doesTakeValue: true }, "valued");
});

Deno.test("a key spelled like what every object carries means nothing", () => {
    assertStrictEquals(getKeyReading("constructor"), null, "not the language's constructor");
    assertStrictEquals(getKeyReading("toString"), null, "nor its method");
    assertStrictEquals(getKeyReading("whatever_per"), null, "and a key nobody met means nothing");
});

Deno.test("an empty key is the grammar's to refuse, so asking about one is a bug", () => {
    assertThrows(() => getKeyReading(""), AssertionError, "a key the message wrote");
});

Deno.test("every family is reached by a key of its own", () => {
    const keys = [
        "+dmg",
        "-blok",
        "+acdmg",
        "+crit",
        "heal",
        "txt",
        "step",
        "tspell",
        "tcustom",
        "skillId",
        "winner",
        "flee",
        "healall_per",
        "+oth_dmg",
        "legbon_lastheal",
    ];
    const reached = new Set(keys.map((key) => getKeyReading(key)?.kind));
    assertEquals([...reached].sort(), Object.values(KEY_FAMILY).sort(), "each family, once");
});

Deno.test("every key every recording carries means something", () => {
    const unknown = new Set<string>();
    let keys = 0;
    for (const fight of readRecordedFights()) {
        for (const text of fight.messages) {
            const parsed = parseProtocolMessage(text);
            if (!parsed.ok) continue;
            for (const parameter of parsed.value.parameters) {
                keys += 1;
                if (getKeyReading(parameter.key) === null) unknown.add(parameter.key);
            }
        }
    }
    assertEquals([...unknown], [], "a key the recordings carry and the table does not read");
    assertGreater(keys, 0, "the recordings carry keys at all");
});
