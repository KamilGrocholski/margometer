/**
 * The `_Shape:_` lines of `docs/protocol-keys.md` against every recording, both ways round. Every
 * reader here is proved on a sample it must flag and one it must not: the first catches a reader
 * that has stopped finding its subject, and only the second catches one that finds too much.
 */

import { assert, assertEquals, assertStrictEquals, assertThrows } from "@std/assert";
import { REGISTER_PATH } from "#/tools/help-claim-register.ts";
import { ProtocolKeyShapeError } from "#/tools/margometer-tool-error.ts";
import {
    DAMAGE_FAMILY_HEADING,
    formatShapeLine,
    formatShapeReport,
    isDocumentedByFamily,
    KEY_PLACEMENT,
    KEY_VALUE,
    type KeyShape,
    parseRegisteredKeys,
    tallyKeyShapes,
} from "#/tools/protocol-key-shape.ts";
import { readRecordedMaterial, replayRecordedMaterial } from "#/tools/recorded-material.ts";

const REGISTER = Deno.readTextFileSync(REGISTER_PATH);
const MEASURED = tallyKeyShapes(replayRecordedMaterial(readRecordedMaterial([])));
const REGISTERED = parseRegisteredKeys(REGISTER);

/** A register-shaped entry that stands on its own, so a reader is proved without the document. */
const SAMPLE = [
    "### `+pierce` — decoded",
    "",
    "Armour piercing fired on this blow.",
    "",
    "_Shape:_ 398 occurrences; on a blow; no value",
    "",
    "### `+swing` — investigated",
    "",
    "_Help:_ names `swing`",
].join("\n");

/**
 * What the reader must **not** flag: the section that states the vocabulary writes the same
 * claims with a bold marker and a worked example, and a heading of its own that names no key.
 */
const ELSEWHERE = [
    "## What every entry states about its own material",
    "",
    "```",
    "*Shape:* 26 occurrences; on a skill announcement; a whole number",
    "```",
    "",
    "### Not a key at all",
].join("\n");

Deno.test("the reader knows an entry and its claim from every other line", () => {
    const read = parseRegisteredKeys(SAMPLE);
    assertEquals(read.map((one) => one.key), ["+pierce", "+swing"], "both entries are found");
    assertEquals(read[0]?.shape, {
        key: "+pierce",
        occurrences: 398,
        placement: KEY_PLACEMENT.onBlow,
        value: KEY_VALUE.none,
    }, "and the claim under the first is read whole");
    assertStrictEquals(read[1]?.shape, null, "an entry stating no shape reads as stating none");
    assertEquals(read.map((one) => one.line), [1, 7], "each knows the line it opened on");
});

Deno.test("the reader flags nothing outside an entry", () => {
    assertEquals(parseRegisteredKeys(ELSEWHERE), [], "a vocabulary section states no claim");
});

Deno.test("a claim never runs on from the entry below it", () => {
    const said = [
        "### `a` — decoded",
        "",
        "### `b` — decoded",
        "_Shape:_ 1 occurrences; anywhere; text",
    ];
    const read = parseRegisteredKeys(said.join("\n"));
    assertStrictEquals(read[0]?.shape, null, "the entry above keeps its own silence");
    assertStrictEquals(read[1]?.shape?.occurrences, 1, "and the entry below keeps its own claim");
});

Deno.test("every claim the register states is one the recordings carry, and the other way", () => {
    const measured = new Map(MEASURED.map((one) => [one.key, one]));
    assert(measured.size > 0, "the corpus carries something to measure");
    const written = REGISTERED.filter((one) => one.shape !== null);
    assert(written.length > 0, "and the register states something about it");
    for (const entry of written) {
        assertEquals(
            entry.shape,
            measured.get(entry.key) ?? null,
            `${REGISTER_PATH}:${entry.line}: ${entry.key} against what the recordings carry`,
        );
    }
    const stated = new Set(written.map((one) => one.key));
    const named = new Set(REGISTERED.map((one) => one.key));
    const unstated = [...measured.keys()]
        .filter((key) => !stated.has(key))
        .filter((key) => !isDocumentedByFamily(key, named));
    assertEquals(unstated, [], `${REGISTER_PATH}: a key the recordings carry that no entry states`);
});

Deno.test("an entry states no shape only for a key the recordings do not carry", () => {
    const measured = new Set(MEASURED.map((one) => one.key));
    const silent = REGISTERED.filter((one) => one.shape === null);
    assert(silent.length > 0, "the register holds entries for keys no recording carries");
    const carried = silent
        .filter((one) => one.key !== DAMAGE_FAMILY_HEADING)
        .filter((one) => measured.has(one.key))
        .map((one) => `${REGISTER_PATH}:${one.line}: ${one.key} is carried and states no shape`);
    assertEquals(carried, [], "an omission the recordings do not excuse");
});

Deno.test("the family entry is what documents the keys the client has no case label for", () => {
    const named = new Set(REGISTERED.map((one) => one.key));
    assert(named.has(DAMAGE_FAMILY_HEADING), "the register opens the family it stands on");
    assert(isDocumentedByFamily("-dmgc", named), "a member with no entry of its own is covered");
    assert(!isDocumentedByFamily("-dmga", named), "the member that earned an entry is not");
    assert(!isDocumentedByFamily("+thirdatt", named), "nor the pair read as the family by name");
    assert(!isDocumentedByFamily("+crit", named), "nor a key the family never reached");
});

Deno.test("the corpus reaches every phrase both vocabularies hold", () => {
    const placements = new Set(MEASURED.map((one) => one.placement));
    const values = new Set(MEASURED.map((one) => one.value));
    assertEquals(
        [...placements].sort(),
        Object.values(KEY_PLACEMENT).sort(),
        "every placement the register may write is one the corpus states",
    );
    assertEquals([...values].sort(), Object.values(KEY_VALUE).sort(), "and every value kind");
});

Deno.test("a phrase outside either vocabulary is refused rather than read as silence", () => {
    const refused = (line: string, reason: string) => {
        assertThrows(
            () => parseRegisteredKeys(`### \`k\` — decoded\n${line}`),
            ProtocolKeyShapeError,
            reason,
        );
    };
    refused("_Shape:_ 1 occurrences; on a hunch; text", "not one of the five");
    refused("_Shape:_ 1 occurrences; anywhere; a word", "not one of the four");
    refused("_Shape:_ some occurrences; anywhere; text", "where a count goes");
    refused("_Shape:_ 1 times; anywhere; text", "a word this reader does not know");
    refused("_Shape:_ 1 occurrences; anywhere", "states 2 claims, not three");
});

Deno.test("the line the register writes is the line this formats", () => {
    const shape: KeyShape = {
        key: "+acdmg",
        occurrences: 995,
        placement: KEY_PLACEMENT.onBlow,
        value: KEY_VALUE.whole,
    };
    assertStrictEquals(
        formatShapeLine(shape),
        "_Shape:_ 995 occurrences; on a blow; a whole number",
        "a measurement writes its own line, so nobody types one by hand",
    );
    assertEquals(parseRegisteredKeys(`### \`+acdmg\` — decoded\n${formatShapeLine(shape)}`), [{
        key: "+acdmg",
        line: 1,
        verdict: "decoded",
        shape,
    }], "and the reader takes back exactly what was written");
});

Deno.test("the report counts a disagreement per key, and never a family member", () => {
    const register = [
        "### `?dmg*` — decoded",
        "### `+crit` — decoded",
        "_Shape:_ 3 occurrences; on a blow; no value",
        "### `+pierce` — decoded",
        "_Shape:_ 2 occurrences; on a blow; no value",
    ].join("\n");
    const shapes: KeyShape[] = [
        { key: "+crit", occurrences: 3, placement: KEY_PLACEMENT.onBlow, value: KEY_VALUE.none },
        { key: "+dmgf", occurrences: 9, placement: KEY_PLACEMENT.onBlow, value: KEY_VALUE.whole },
        { key: "+pierce", occurrences: 5, placement: KEY_PLACEMENT.onBlow, value: KEY_VALUE.none },
        { key: "+stun", occurrences: 1, placement: KEY_PLACEMENT.onBlow, value: KEY_VALUE.none },
    ];
    const lines = formatShapeReport(shapes, "a sample", register).split("\n");
    assertStrictEquals(lines.at(-2), `2 of 4 disagree with ${REGISTER_PATH}`, "a moved count and");
    assert(lines.some((one) => one.endsWith("— states 2; on a blow; no value")), "what it said");
    assert(lines.some((one) => one.endsWith("— no entry")), "and a key with no entry");
    assert(lines.some((one) => one.endsWith(`— ${DAMAGE_FAMILY_HEADING}`)), "the family's own");
});
