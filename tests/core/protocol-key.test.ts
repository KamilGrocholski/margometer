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
import { getDefenceMechanism, KEY_FAMILY, lookupKeyMeaning } from "#/src/core/protocol-key.ts";
import { parseProtocolMessage } from "#/src/core/fight-decoder.ts";
import { readRecordedFights } from "#/tests/recorded-fights.ts";

Deno.test("the family rule reads a marker, and the sign says which half", () => {
    assertEquals(lookupKeyMeaning("+dmgf"), { kind: KEY_FAMILY.damage, half: "raw" }, "raw");
    assertEquals(
        lookupKeyMeaning("-dmgf"),
        { kind: KEY_FAMILY.damage, half: "applied" },
        "applied",
    );
    assertEquals(
        lookupKeyMeaning("+dmg"),
        { kind: KEY_FAMILY.damage, half: "raw" },
        "the plain one",
    );
    assertStrictEquals(lookupKeyMeaning("+dm"), null, "a marker cut short is no marker");
    assertStrictEquals(lookupKeyMeaning("dmg"), null, "and one at the wrong place is none either");
    assertStrictEquals(lookupKeyMeaning("*dmgf"), null, "and one under neither sign is unread");
});

Deno.test("the pair with no marker is read by name", () => {
    assertEquals(lookupKeyMeaning("+thirdatt"), { kind: KEY_FAMILY.damage, half: "raw" }, "raw");
    const applied = lookupKeyMeaning("-thirdatt");
    assertEquals(applied, { kind: KEY_FAMILY.damage, half: "applied" }, "and applied");
});

Deno.test("a proc's end is the table's, never the sign's", () => {
    const curse = lookupKeyMeaning("+legbon_curse");
    assertEquals(curse, { kind: KEY_FAMILY.proc, end: "actor", doesTakeValue: false }, "attacker");
    const cleanse = lookupKeyMeaning("-legbon_cleanse");
    assertEquals(cleanse, { kind: KEY_FAMILY.proc, end: "target", doesTakeValue: false }, "struck");
    const tenacity = lookupKeyMeaning("-tenacity");
    assertEquals(tenacity, { kind: KEY_FAMILY.proc, end: "unsettled", doesTakeValue: false }, "?");
    const weakened = lookupKeyMeaning("+woundpoison");
    assertEquals(weakened, { kind: KEY_FAMILY.proc, end: "actor", doesTakeValue: true }, "valued");
});

Deno.test("absorption is a pool the blow drains, and a block is a chance", () => {
    assertStrictEquals(getDefenceMechanism("absorb"), "pool", "physical absorption");
    assertStrictEquals(getDefenceMechanism("absorbm"), "pool", "magical absorption");
    assertStrictEquals(getDefenceMechanism("blok"), "chance", "a block");
    assertEquals(lookupKeyMeaning("-absorb"), { kind: KEY_FAMILY.prevented }, "still prevented");
    assertThrows(() => getDefenceMechanism("-absorb"), AssertionError, "one this table reads");
    assertThrows(() => getDefenceMechanism("dmgc"), AssertionError, "one this table reads");
});

Deno.test("a pool's defence shares no token with an element or a health change", () => {
    for (const defence of ["absorb", "absorbm"]) {
        assertStrictEquals(lookupKeyMeaning(`-${defence}`)?.kind, KEY_FAMILY.prevented, defence);
        assertStrictEquals(defence.startsWith("dmg"), false, `${defence} is no element`);
        assertStrictEquals(lookupKeyMeaning(defence), null, `${defence} is no health change`);
    }
});

Deno.test("a key spelled like what every object carries means nothing", () => {
    assertStrictEquals(lookupKeyMeaning("constructor"), null, "not the language's constructor");
    assertStrictEquals(lookupKeyMeaning("toString"), null, "nor its method");
    assertStrictEquals(
        lookupKeyMeaning("whatever_per"),
        null,
        "and a key nobody met means nothing",
    );
});

Deno.test("an empty key is the grammar's to refuse, so asking about one is a bug", () => {
    assertThrows(() => lookupKeyMeaning(""), AssertionError, "a key the message wrote");
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
    const reached = new Set(keys.map((key) => lookupKeyMeaning(key)?.kind));
    assertEquals([...reached].sort(), Object.values(KEY_FAMILY).sort(), "each family, once");
});

Deno.test("every key every recording carries means something", () => {
    const unknown = new Set<string>();
    let keys = 0;
    for (const fight of readRecordedFights()) {
        for (const text of fight.messages) {
            const parsed = parseProtocolMessage(text);
            if (parsed instanceof Error) continue;
            for (const parameter of parsed.parameters) {
                keys += 1;
                if (lookupKeyMeaning(parameter.key) === null) unknown.add(parameter.key);
            }
        }
    }
    assertEquals([...unknown], [], "a key the recordings carry and the table does not read");
    assertGreater(keys, 0, "the recordings carry keys at all");
});
