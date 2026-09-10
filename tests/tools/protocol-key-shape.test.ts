/**
 * The `_Shape:_` lines of `docs/protocol-keys.md` against every recording, both ways round.
 *
 * The register said these three claims were re-measured on every run, and nothing measured any
 * of them: thirty-seven counts had gone quietly wrong, each understated by the recordings
 * admitted since somebody last typed one. Every reader here is proved on a sample it must flag
 * and one it must not — the first catches a reader that has stopped finding its subject, and
 * only the second catches one that finds too much.
 */

import { assert, assertEquals, assertStrictEquals, assertThrows } from "@std/assert";
import {
    composeKeyShapes,
    composeShapeLine,
    DAMAGE_FAMILY_HEADING,
    getRegisteredKeys,
    isDocumentedByFamily,
    type KeyPlacement,
    type KeyShape,
    type KeyValue,
    REGISTER_PATH,
} from "@/tools/protocol-key-shape.ts";
import { ProtocolKeyShapeError } from "@/tools/margometer-tool-error.ts";
import { readRecordingPaths } from "@/project/repository-layout.ts";

const REGISTER = Deno.readTextFileSync(REGISTER_PATH);
const MEASURED = composeKeyShapes(readRecordingPaths());
const REGISTERED = getRegisteredKeys(REGISTER);

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

function getMeasuredByKey(): Map<string, KeyShape> {
    return new Map(MEASURED.map((one) => [one.key, one]));
}

Deno.test("the reader knows an entry and its claim from every other line", () => {
    const read = getRegisteredKeys(SAMPLE);
    assertEquals(read.map((one) => one.key), ["+pierce", "+swing"], "both entries are found");
    assertEquals(read[0]?.shape, {
        key: "+pierce",
        occurrences: 398,
        placement: "on a blow",
        value: "no value",
    }, "and the claim under the first is read whole");
    assertStrictEquals(read[1]?.shape, null, "an entry stating no shape reads as stating none");
});

Deno.test("the reader flags nothing outside an entry", () => {
    assertEquals(getRegisteredKeys(ELSEWHERE), [], "a vocabulary section states no claim");
});

Deno.test("a claim never runs on from the entry below it", () => {
    const said = [
        "### `a` — decoded",
        "",
        "### `b` — decoded",
        "_Shape:_ 1 occurrences; anywhere; text",
    ];
    const read = getRegisteredKeys(said.join("\n"));
    assertStrictEquals(read[0]?.shape, null, "the entry above keeps its own silence");
    assertStrictEquals(read[1]?.shape?.occurrences, 1, "and the entry below keeps its own claim");
});

Deno.test("every claim the register states is one the recordings carry, and the other way", () => {
    const measured = getMeasuredByKey();
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
    const measured = getMeasuredByKey();
    const silent = REGISTERED.filter((one) => one.shape === null);
    assert(silent.length > 0, "the register holds entries for keys no recording carries");
    for (const entry of silent) {
        if (entry.key === DAMAGE_FAMILY_HEADING) continue;
        assertStrictEquals(
            measured.get(entry.key),
            undefined,
            `${REGISTER_PATH}:${entry.line}: ${entry.key} is carried and states no shape`,
        );
    }
});

Deno.test("the family entry is what documents the keys the client has no case label for", () => {
    const named = new Set(REGISTERED.map((one) => one.key));
    assert(named.has(DAMAGE_FAMILY_HEADING), "the register opens the family it stands on");
    assert(
        isDocumentedByFamily("-dmgc", named),
        "a damage key with no entry of its own is documented by it",
    );
    assert(
        !isDocumentedByFamily("-dmga", named),
        "and the member that earned an entry of its own is not",
    );
    assert(
        !isDocumentedByFamily("+thirdatt", named),
        "nor is the pair the family rule reaches that carries one",
    );
    assert(!isDocumentedByFamily("+crit", named), "nor is a key the family rule never reached");
});

Deno.test("the corpus reaches every phrase both vocabularies hold", () => {
    const placements = new Set<KeyPlacement>(MEASURED.map((one) => one.placement));
    const values = new Set<KeyValue>(MEASURED.map((one) => one.value));
    assertEquals([...placements].sort(), [
        "alone in its message",
        "anywhere",
        "on a blow",
        "on a message reporting damage",
        "on a skill announcement",
    ], "every placement the register may write is one the corpus states");
    assertEquals([...values].sort(), [
        "a number",
        "a whole number",
        "no value",
        "text",
    ], "and so is every value kind");
});

Deno.test("a phrase outside either vocabulary is refused rather than read as silence", () => {
    assertThrows(
        () => getRegisteredKeys("### `k` — decoded\n_Shape:_ 1 occurrences; on a hunch; text"),
        ProtocolKeyShapeError,
        "not one of the five",
    );
    assertThrows(
        () => getRegisteredKeys("### `k` — decoded\n_Shape:_ 1 occurrences; anywhere; a word"),
        ProtocolKeyShapeError,
        "not one of the four",
    );
    assertThrows(
        () => getRegisteredKeys("### `k` — decoded\n_Shape:_ some occurrences; anywhere; text"),
        ProtocolKeyShapeError,
        "where a count goes",
    );
    assertThrows(
        () => getRegisteredKeys("### `k` — decoded\n_Shape:_ 1 occurrences; anywhere"),
        ProtocolKeyShapeError,
        "states 2 claims, not three",
    );
});

Deno.test("the line the register writes is the line this composes", () => {
    assertStrictEquals(
        composeShapeLine({
            key: "+acdmg",
            occurrences: 995,
            placement: "on a blow",
            value: "a whole number",
        }),
        "_Shape:_ 995 occurrences; on a blow; a whole number",
        "a measurement writes its own line, so nobody types one by hand",
    );
});
