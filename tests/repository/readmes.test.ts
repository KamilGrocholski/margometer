/**
 * `README.md` and `README.en.md` held to one skeleton, and both to one set of pictures. GitHub
 * renders `README.md` alone on the front page, so the second language is a second file, and the
 * second file is where the drift lives. The pictures are the set `deno task panel:shots` took,
 * which `screenshots/taken-at.json` names.
 */

import { assert, assertEquals } from "@std/assert";
import { parseJson } from "#/libs/json-text.ts";
import { isRecord } from "#/libs/unknown-value.ts";

const README_PATHS = ["README.md", "README.en.md"];
const SHOTS_PATH = "screenshots/taken-at.json";
const HEADING_MARK = "#";
const PICTURE_MARK = '<img src="';
const PICTURE_CLOSER = '"';

Deno.test("the picture reader finds a tag's source, and nothing that is only beside one", () => {
    const sample = '<img src="screenshots/a.png" width="390"\nsee screenshots/b.png\n';
    assertEquals(readPictures(sample), ["screenshots/a.png"], "the tag's source alone");
});

function readPictures(text: string): string[] {
    const found: string[] = [];
    let at = text.indexOf(PICTURE_MARK);
    for (let tried = 0; at !== -1; tried += 1) {
        assert(tried <= text.length, "the walk stays inside the text");
        const from = at + PICTURE_MARK.length;
        found.push(text.slice(from, text.indexOf(PICTURE_CLOSER, from)));
        at = text.indexOf(PICTURE_MARK, from);
    }
    return found;
}

Deno.test("the two run headings at the same depths, in the same order", () => {
    const [one, other] = README_PATHS.map((path) => readHeadingDepths(Deno.readTextFileSync(path)));
    assert((one ?? []).length > 0, "there is a skeleton to compare");
    assertEquals(one, other, "one skeleton in two languages");
});

function readHeadingDepths(text: string): number[] {
    const found: number[] = [];
    for (const line of text.split("\n")) {
        if (!line.startsWith(HEADING_MARK)) continue;
        let depth = 0;
        while (line.charAt(depth) === HEADING_MARK) {
            depth += 1;
            assert(depth <= line.length, "a heading's marks stand inside its line");
        }
        found.push(depth);
    }
    return found;
}

Deno.test("the two show the pictures the shot set names, in the same order", () => {
    const [one, other] = README_PATHS.map((path) => readPictures(Deno.readTextFileSync(path)));
    assert((one ?? []).length > 0, "a README shows the panel");
    assertEquals(one, other, "the same pictures, in the same order");
    assertEquals([...(one ?? [])].sort(), readShotPaths().sort(), "and the set taken, both ways");
});

/** Every picture the sidecar says the last run took, as a path a README would show it at. */
function readShotPaths(): string[] {
    const parsed = parseJson(Deno.readTextFileSync(SHOTS_PATH));
    assert(parsed.ok, "the sidecar is JSON");
    assert(isRecord(parsed.value), "and a record");
    const shots = parsed.value.shots;
    assert(Array.isArray(shots), "naming the shots");
    const directory = SHOTS_PATH.slice(0, SHOTS_PATH.lastIndexOf("/") + 1);
    return shots.map((shot) => {
        assert(isRecord(shot), "each a record");
        assert(typeof shot.name === "string", "carrying its file's name");
        return directory + shot.name;
    });
}

Deno.test("each translation offers the other on its first line", () => {
    for (const path of README_PATHS) {
        const first = Deno.readTextFileSync(path).split("\n")[0] ?? "";
        for (const other of README_PATHS) {
            if (other !== path) assert(first.includes(`(${other})`), `${path} links ${other}`);
        }
    }
});
