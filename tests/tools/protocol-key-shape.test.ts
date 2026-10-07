/**
 * The `_Shape:_` lines of `docs/protocol-keys.md` against every recording, both ways round. Every
 * reader here is proved on a sample it must flag and one it must not: the first catches a reader
 * that has stopped finding its subject, and only the second catches one that finds too much.
 */

import { assert, assertEquals, assertStrictEquals, assertThrows } from "@std/assert";
import { REGISTER_PATH } from "#/tools/help-claim-register.ts";
import { ProtocolKeyShapeError } from "#/tools/margometer-tool-error.ts";
import {
    CLAIMS_MAXIMUM,
    CLAIMS_PER_LINE,
    DAMAGE_FAMILY_HEADING,
    formatShapeLine,
    formatShapeReport,
    isDocumentedByFamily,
    KEY_PLACEMENT,
    KEY_VALUE,
    KEYS_MAXIMUM,
    type KeyShape,
    parseProseCountClaims,
    parseRegisteredKeys,
    tallyKeyShapes,
    WORDS_MAXIMUM,
} from "#/tools/protocol-key-shape.ts";
import {
    readRecordedMaterial,
    RECORDINGS_MAXIMUM,
    replayRecordedMaterial,
} from "#/tools/recorded-material.ts";

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
    const registered = parseRegisteredKeys(SAMPLE);
    assertEquals(
        registered.map((registeredKey) => registeredKey.key),
        ["+pierce", "+swing"],
        "both entries are found",
    );
    assertEquals(registered[0]?.shape, {
        key: "+pierce",
        occurrences: 398,
        placement: KEY_PLACEMENT.onBlow,
        value: KEY_VALUE.none,
    }, "and the claim under the first is read whole");
    assertStrictEquals(
        registered[1]?.shape,
        null,
        "an entry stating no shape reads as stating none",
    );
    assertEquals(
        registered.map((registeredKey) => registeredKey.line),
        [1, 7],
        "each knows the line it opened on",
    );
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
    const registered = parseRegisteredKeys(said.join("\n"));
    assertStrictEquals(registered[0]?.shape, null, "the entry above keeps its own silence");
    assertStrictEquals(
        registered[1]?.shape?.occurrences,
        1,
        "and the entry below keeps its own claim",
    );
});

Deno.test("every claim the register states is one the recordings carry, and the other way", () => {
    const measured = new Map(MEASURED.map((shape) => [shape.key, shape]));
    assert(measured.size > 0, "the corpus carries something to measure");
    const written = REGISTERED.filter((registeredKey) => registeredKey.shape !== null);
    assert(written.length > 0, "and the register states something about it");
    for (const registeredKey of written) {
        assertEquals(
            registeredKey.shape,
            measured.get(registeredKey.key) ?? null,
            `${REGISTER_PATH}:${registeredKey.line}: ${registeredKey.key} against what the recordings carry`,
        );
    }
    const stated = new Set(written.map((registeredKey) => registeredKey.key));
    const named = new Set(REGISTERED.map((registeredKey) => registeredKey.key));
    const unstated = [...measured.keys()]
        .filter((key) => !stated.has(key))
        .filter((key) => !isDocumentedByFamily(key, named));
    assertEquals(unstated, [], `${REGISTER_PATH}: a key the recordings carry that no entry states`);
});

Deno.test("an entry states no shape only for a key the recordings do not carry", () => {
    const measured = new Set(MEASURED.map((shape) => shape.key));
    const silent = REGISTERED.filter((registeredKey) => registeredKey.shape === null);
    assert(silent.length > 0, "the register holds entries for keys no recording carries");
    const carried = silent
        .filter((registeredKey) => registeredKey.key !== DAMAGE_FAMILY_HEADING)
        .filter((registeredKey) => measured.has(registeredKey.key))
        .map((registeredKey) =>
            `${REGISTER_PATH}:${registeredKey.line}: ${registeredKey.key} is carried and states no shape`
        );
    assertEquals(carried, [], "an omission the recordings do not excuse");
});

Deno.test("the family entry is what documents the keys the client has no case label for", () => {
    const named = new Set(REGISTERED.map((registeredKey) => registeredKey.key));
    assert(named.has(DAMAGE_FAMILY_HEADING), "the register opens the family it stands on");
    assert(isDocumentedByFamily("-dmgc", named), "a member with no entry of its own is covered");
    assert(!isDocumentedByFamily("-dmga", named), "the member that earned an entry is not");
    assert(!isDocumentedByFamily("+thirdatt", named), "nor the pair read as the family by name");
    assert(!isDocumentedByFamily("+crit", named), "nor a key the family never reached");
});

Deno.test("the corpus reaches every phrase both vocabularies hold", () => {
    const placements = new Set(MEASURED.map((shape) => shape.placement));
    const values = new Set(MEASURED.map((shape) => shape.value));
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
    const placements = Object.values(KEY_PLACEMENT).length;
    const values = Object.values(KEY_VALUE).length;
    refused("_Shape:_ 1 occurrences; on a hunch; text", `not one of the ${placements}`);
    refused("_Shape:_ 1 occurrences; anywhere; a word", `not one of the ${values}`);
    refused("_Shape:_ some occurrences; anywhere; text", "where a count goes");
    refused("_Shape:_ 1 times; anywhere; text", "a word this reader does not know");
    refused("_Shape:_ 1 occurrences; anywhere", `states 2 claims, not ${CLAIMS_PER_LINE}`);
});

Deno.test("a sentence naming past the bound is refused, and one at it is read whole", () => {
    const naming = (count: number) =>
        parseProseCountClaims(
            `### \`+absorb\` — decoded\n\nBoth occurrences ride ${
                "captures/a.json,".repeat(count)
            }in turn.\n`,
        );
    assertStrictEquals(
        naming(RECORDINGS_MAXIMUM)[0]?.recordings.length,
        RECORDINGS_MAXIMUM,
        "at it",
    );
    assertThrows(() => naming(RECORDINGS_MAXIMUM + 1), ProtocolKeyShapeError, "more than");
    const spaced = parseProseCountClaims(
        `### \`+absorb\` — decoded\n\nBoth occurrences ride ${
            "captures/a.json ".repeat(RECORDINGS_MAXIMUM)
        }in turn.\n`,
    );
    assertStrictEquals(
        spaced[0]?.recordings.length,
        RECORDINGS_MAXIMUM,
        "named as prose names them",
    );
});

Deno.test("a sentence past its bound on words is refused, and one at it is read", () => {
    const saying = (count: number) =>
        parseProseCountClaims(
            `### \`+absorb\` — decoded\n\nBoth occurrences${" w".repeat(count - 2)}\n`,
        );
    assertStrictEquals(saying(WORDS_MAXIMUM).length, 1, "a sentence at the bound is a claim");
    assertThrows(() => saying(WORDS_MAXIMUM + 1), ProtocolKeyShapeError, "past");
});

Deno.test("a register past its bound on keys is refused, and one at it is read", () => {
    const opening = (count: number) =>
        parseRegisteredKeys(
            Array.from({ length: count }, (_, keyIndex) => `### \`k${keyIndex}\` — decoded\n`)
                .join(""),
        );
    assertStrictEquals(opening(KEYS_MAXIMUM).length, KEYS_MAXIMUM, "every key at it");
    assertThrows(() => opening(KEYS_MAXIMUM + 1), ProtocolKeyShapeError, "more than");
});

Deno.test("a register past its bound on claims is refused, and one at it is read", () => {
    const claiming = (count: number) =>
        parseProseCountClaims(
            `### \`+absorb\` — decoded\n\n${"Both occurrences. ".repeat(count)}\n`,
        );
    assertStrictEquals(claiming(CLAIMS_MAXIMUM).length, CLAIMS_MAXIMUM, "every claim at it");
    assertThrows(() => claiming(CLAIMS_MAXIMUM + 1), ProtocolKeyShapeError, "more than");
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
    assert(lines.some((line) => line.endsWith("— states 2; on a blow; no value")), "what it said");
    assert(lines.some((line) => line.endsWith("— no entry")), "and a key with no entry");
    assert(lines.some((line) => line.endsWith(`— ${DAMAGE_FAMILY_HEADING}`)), "the family's own");
});

/** What the recordings hold is the tool's input, so a tally past its bound is refused. */
Deno.test("the keys a tally holds are refused past their bound", () => {
    const replayed = replayRecordedMaterial(readRecordedMaterial([]));
    const keys = tallyKeyShapes(replayed).length;
    assertStrictEquals(tallyKeyShapes(replayed, keys).length, keys, "every key, at the bound");
    assertThrows(() => tallyKeyShapes(replayed, keys - 1), ProtocolKeyShapeError, "more keys");
});
