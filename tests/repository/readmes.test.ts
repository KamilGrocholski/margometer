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
    const pictures: string[] = [];
    let markIndex = text.indexOf(PICTURE_MARK);
    for (let tried = 0; markIndex !== -1; tried += 1) {
        assert(tried <= text.length, "the walk stays inside the text");
        const from = markIndex + PICTURE_MARK.length;
        pictures.push(text.slice(from, text.indexOf(PICTURE_CLOSER, from)));
        markIndex = text.indexOf(PICTURE_MARK, from);
    }
    return pictures;
}

Deno.test("the two run headings at the same depths, in the same order", () => {
    const [polish, english] = README_PATHS.map((path) =>
        readHeadingDepths(Deno.readTextFileSync(path))
    );
    assert((polish ?? []).length > 0, "there is a skeleton to compare");
    assertEquals(polish, english, "one skeleton in two languages");
});

function readHeadingDepths(text: string): number[] {
    const depths: number[] = [];
    for (const line of text.split("\n")) {
        if (!line.startsWith(HEADING_MARK)) continue;
        let depth = 0;
        while (line.charAt(depth) === HEADING_MARK) {
            depth += 1;
            assert(depth <= line.length, "a heading's marks stand inside its line");
        }
        depths.push(depth);
    }
    return depths;
}

Deno.test("the two show the pictures the shot set names, in the same order", () => {
    const [polish, english] = README_PATHS.map((path) => readPictures(Deno.readTextFileSync(path)));
    assert((polish ?? []).length > 0, "a README shows the panel");
    assertEquals(polish, english, "the same pictures, in the same order");
    assertEquals(
        [...(polish ?? [])].sort(),
        readShotPaths().sort(),
        "and the set taken, both ways",
    );
});

/** Every picture the sidecar says the last run took, as a path a README would show it at. */
function readShotPaths(): string[] {
    const parsed = parseJson(Deno.readTextFileSync(SHOTS_PATH));
    assert(!(parsed instanceof Error), "the sidecar is JSON");
    assert(isRecord(parsed), "and a record");
    const shots = parsed.shots;
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
        const openingLine = Deno.readTextFileSync(path).split("\n")[0] ?? "";
        for (const translation of README_PATHS) {
            if (translation !== path) {
                assert(openingLine.includes(`(${translation})`), `${path} links ${translation}`);
            }
        }
    }
});
