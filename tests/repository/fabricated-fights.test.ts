/**
 * The wall between what happened and what was made up.
 *
 * `captures/` is evidence and `fabricated/` is invented, and the only thing keeping the second out
 * of the first is that nobody has confused them yet. Two of these run where `fabricated/` does not
 * exist at all, which is every machine but the one that generated a fight — a guard that needed
 * the directory to be there would pass by being skipped.
 */

import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import { getJsonReading } from "@/libs/json-text.ts";
import { isRecord } from "@/libs/unknown-reading.ts";
import { getRecordingPaths } from "@/tests/recorded-fight.ts";
import { CAPTURE_FIELDS } from "@/src/game/fight-capture.ts";
import {
    FABRICATED_DIRECTORY,
    FABRICATED_WORLD,
    FABRICATION_FIELDS,
} from "@/tools/fabricated-fight.ts";

const IGNORE_FILE = ".gitignore";
const CONFIGURATION_FILE = "deno.json";

Deno.test("git is told to carry no fabricated fight", () => {
    const ignored = Deno.readTextFileSync(IGNORE_FILE).split("\n").map((line) => line.trim());
    assert(ignored.length > 0, "the ignore file says something");
    assert(
        ignored.includes(`${FABRICATED_DIRECTORY}/`),
        `${IGNORE_FILE} does not name ${FABRICATED_DIRECTORY}/, so one can be committed`,
    );
});

/**
 * The trap `TODO.md` fell into once: a permission list cannot see a formatter, and `deno fmt`
 * rewrites every JSON file it walks to. A rewritten fabricated fight is only a nuisance; the gate
 * going red on a file git does not carry is not.
 */
Deno.test("the formatter is told to walk past a fabricated fight", () => {
    const configuration = Deno.readTextFileSync(CONFIGURATION_FILE);
    assertStringIncludes(
        configuration,
        `"${FABRICATED_DIRECTORY}/"`,
        `${CONFIGURATION_FILE} does not exclude ${FABRICATED_DIRECTORY}/`,
    );
});

/** True where the envelope wears either mark a fabricated fight carries. */
function isFabricatedEnvelope(document: unknown): boolean {
    if (!isRecord(document)) return false;
    if (document[FABRICATION_FIELDS.isFabricated] === true) return true;
    return document[CAPTURE_FIELDS.world] === FABRICATED_WORLD;
}

Deno.test("the reader knows a fabricated envelope from a recording's", () => {
    assert(isFabricatedEnvelope({ isFabricated: true }), "the field alone is the mark");
    assert(isFabricatedEnvelope({ world: "fabricated" }), "and so is the world it states");
    assert(!isFabricatedEnvelope({ world: "tempest" }), "a recording's world is not the mark");
    assert(!isFabricatedEnvelope({ isFabricated: false }), "nor a field saying it is not one");
    assert(!isFabricatedEnvelope("tempest"), "and text is not an envelope at all");
});

Deno.test("no recording in the evidence directory is a fight nobody fought", () => {
    const paths = getRecordingPaths();
    assert(paths.length > 0, "an empty evidence directory is a finding, not a pass");
    const marked: string[] = [];
    for (const path of paths) {
        const reading = getJsonReading(Deno.readTextFileSync(path));
        assert(reading.isOk, `${path} is JSON`);
        if (isFabricatedEnvelope(reading.value)) marked.push(path);
    }
    assertEquals(marked, [], "a fabricated fight is sitting in the evidence directory");
});
