/**
 * Which date a freeze leaves on a reading, decided over texts handed in, so the gate needs no
 * `.cache/` to prove it. The frozen files themselves are held to the field each tool reads their
 * date from: a field renamed in an encoder would leave every reading undated, and every refresh
 * would re-date all of them.
 */

import {
    assert,
    assertEquals,
    assertExists,
    AssertionError,
    assertStrictEquals,
    assertThrows,
} from "@std/assert";
import { FROZEN_STATUS_BITS } from "#/frozen/status-bits.ts";
import { FROZEN_HELP_PHRASES } from "#/frozen/help-phrases.ts";
import { FROZEN_PROTOCOL_KEYS } from "#/frozen/protocol-keys.ts";
import { FROZEN_SKILL_DURATIONS } from "#/frozen/skill-durations.ts";
import {
    encodeFrozenStatusModule,
    FROZEN_DATE_FIELD as STATUS_DATE_FIELD,
} from "#/tools/status-bit-table.ts";
import {
    composeFrozenFiles,
    lookupHeldDate,
    prepareFrozenFiles,
    writeFrozenFiles,
} from "#/tools/frozen-files.ts";
import { LITERAL_CHARACTERS_MAXIMUM } from "#/libs/text-walk.ts";
import { FrozenFilesError } from "#/tools/margometer-tool-error.ts";
import {
    encodeFrozenHelpModule,
    FROZEN_DATE_FIELD as HELP_DATE_FIELD,
} from "#/tools/help-article.ts";
import {
    encodeFrozenKeyModule,
    FROZEN_DATE_FIELD as KEY_DATE_FIELD,
} from "#/tools/protocol-key-table.ts";
import {
    encodeFrozenSkillTexts,
    FROZEN_AURA_PATH,
    FROZEN_BLOWS_PATH,
    FROZEN_DATE_FIELD as SKILL_DATE_FIELD,
    FROZEN_PATH as SKILL_PATH,
} from "#/tools/skill-table.ts";

const PATHS = ["frozen/a.ts", "frozen/b.ts"];
const HELD_DATE = "held";
const READ_DATE = "read";
/** Two files under `frozen/` no freeze writes, one per text the sample encodes. */
const ABSENT_PATHS = ["frozen/nobody-froze-a.ts", "frozen/nobody-froze-b.ts"];

Deno.test("a later fetch that gives the same content leaves the held date standing", () => {
    const encode = encodeSample("same");
    const frozen = composeFrozenFiles(PATHS, encode(HELD_DATE), HELD_DATE, READ_DATE, 1, encode);
    assertStrictEquals(frozen.hasMoved, false, "nothing the game said changed");
    assertStrictEquals(frozen.date, HELD_DATE, "so the files keep the fetch that first gave it");
    assertEquals(frozen.texts, encode(HELD_DATE), "byte for byte what stands");
    assertStrictEquals(frozen.readDate, READ_DATE, "and the later fetch is still said");
});

/** Two files that carry the date and the content, the way every encoder writes them. */
function encodeSample(content: string): (date: string) => string[] {
    assert(content.length > 0, "a sample says something");
    return (date) => [
        `export const A = {\n    when: "${date}",\n    what: "${content}",\n};\n`,
        `export const B = {\n    when: "${date}",\n    also: "${content}",\n};\n`,
    ];
}

Deno.test("a file nobody froze is no held date, and one that cannot be read is refused", () => {
    const encode = encodeSample("same");
    const absent = prepareFrozenFiles(ABSENT_PATHS, "when", READ_DATE, 1, encode);
    assertStrictEquals(absent.heldDate, null, "a file not there yet is what the freeze writes");
    assertThrows(
        () =>
            prepareFrozenFiles(["frozen/", ...ABSENT_PATHS.slice(1)], "when", READ_DATE, 1, encode),
        FrozenFilesError,
        "cannot be read",
        "a path standing that gives no text is not a file to write over",
    );
});

Deno.test("content that moved re-dates every file written off the fetch", () => {
    const held = encodeSample("before")(HELD_DATE);
    const encode = encodeSample("after");
    const frozen = composeFrozenFiles(PATHS, held, HELD_DATE, READ_DATE, 1, encode);
    assertStrictEquals(frozen.hasMoved, true, "the game said something else");
    assertStrictEquals(frozen.date, READ_DATE, "so the files carry the fetch that said it");
    assertEquals(frozen.texts, encode(READ_DATE), "both of them, since they date together");
});

Deno.test("one file of a set moving re-dates the set, and a missing file is a moved one", () => {
    const encode = encodeSample("same");
    const [firstFile, secondFile] = encode(HELD_DATE);
    assertExists(firstFile, "the sample writes a first file");
    assertExists(secondFile, "and a second");
    const edited = [firstFile, `${secondFile}// by hand\n`];
    const moved = composeFrozenFiles(PATHS, edited, HELD_DATE, READ_DATE, 1, encode);
    assertStrictEquals(moved.hasMoved, true, "the second file no longer is what the fetch gives");
    assertStrictEquals(moved.date, READ_DATE, "and the first one moves with it");
    const missing = composeFrozenFiles(PATHS, [firstFile, null], HELD_DATE, READ_DATE, 1, encode);
    assertStrictEquals(missing.hasMoved, true, "a file nobody wrote yet is written");
    const undated = composeFrozenFiles(PATHS, [firstFile, secondFile], null, READ_DATE, 1, encode);
    assertStrictEquals(undated.hasMoved, true, "and so is a set whose date cannot be read");
});

Deno.test("a freeze naming a path outside frozen/ is refused, and one inside it is not", () => {
    const standing = composeFrozenFiles(
        PATHS,
        encodeSample("same")(HELD_DATE),
        HELD_DATE,
        READ_DATE,
        1,
        encodeSample("same"),
    );
    assertStrictEquals(
        standing.hasMoved,
        false,
        "nothing is written by the sample that must not flag",
    );
    writeFrozenFiles(standing);
    assertThrows(
        () => writeFrozenFiles({ ...standing, paths: ["docs/elsewhere.ts", PATHS[1]!] }),
        AssertionError,
        "under frozen/",
    );
});

Deno.test("the held date is read off the field an encoder writes, and nowhere else", () => {
    const text = encodeSample("same")(HELD_DATE)[0] ?? "";
    assertStrictEquals(lookupHeldDate(text, "when"), HELD_DATE, "the field the encoder dates by");
    assertStrictEquals(lookupHeldDate(text, "what"), "same", "any field is read the same way");
    assertStrictEquals(lookupHeldDate(text, "gameBuild"), null, "a field it lacks is no date");
    assertStrictEquals(lookupHeldDate('\n    when: "",\n', "when"), null, "nor is an empty one");
    assertStrictEquals(lookupHeldDate("export const A = { when: 1 };", "when"), null, "nor one");
    const dated = (count: number) => `\n    when: "${"2".repeat(count)}"`;
    assertStrictEquals(
        lookupHeldDate(dated(LITERAL_CHARACTERS_MAXIMUM), "when")?.length,
        LITERAL_CHARACTERS_MAXIMUM,
    );
    assertThrows(
        () => lookupHeldDate(dated(LITERAL_CHARACTERS_MAXIMUM + 1), "when"),
        FrozenFilesError,
        "runs past",
    );
});

Deno.test("every frozen reading states its date in the field its tool reads it from", () => {
    const readHeldDate = (path: string, field: string) =>
        lookupHeldDate(Deno.readTextFileSync(path), field);
    const keys = readHeldDate("frozen/protocol-keys.ts", KEY_DATE_FIELD);
    assertStrictEquals(keys, FROZEN_PROTOCOL_KEYS.gameBuild, "the key table");
    assertStrictEquals(
        readHeldDate("frozen/status-bits.ts", STATUS_DATE_FIELD),
        FROZEN_STATUS_BITS.gameBuild,
    );
    const help = readHeldDate("frozen/help-phrases.ts", HELP_DATE_FIELD);
    assertStrictEquals(help, FROZEN_HELP_PHRASES.fetchedAt, "the help counts");
    for (const path of [SKILL_PATH, FROZEN_AURA_PATH, FROZEN_BLOWS_PATH]) {
        const skills = readHeldDate(path, SKILL_DATE_FIELD);
        assertStrictEquals(skills, FROZEN_SKILL_DURATIONS.fetchedAt, `${path} dates with the set`);
    }
});

Deno.test("every encoder writes its date in the field its freeze reads it back from", () => {
    const family = { marker: "dmg", markerAt: 1, markerLength: 3, dealtSign: "+" };
    const keys = encodeFrozenKeyModule(HELD_DATE, ["blok"], family);
    assertStrictEquals(lookupHeldDate(keys, KEY_DATE_FIELD), HELD_DATE, "the key table");
    const bits = encodeFrozenStatusModule(HELD_DATE, ["wound"]);
    assertStrictEquals(lookupHeldDate(bits, STATUS_DATE_FIELD), HELD_DATE, "the bit order");
    const help = encodeFrozenHelpModule("372", HELD_DATE, [["( fire )", 2]]);
    assertStrictEquals(lookupHeldDate(help, HELP_DATE_FIELD), HELD_DATE, "the help counts");
    const skill = { id: 1, effects: [] };
    const aura = { id: 1, turns: 2 };
    const texts = encodeFrozenSkillTexts(HELD_DATE, [skill], [aura], [], []);
    assertStrictEquals(texts.length, 3, "the three skill readings");
    for (const text of texts) {
        assertStrictEquals(lookupHeldDate(text, SKILL_DATE_FIELD), HELD_DATE, "each of them");
    }
});
