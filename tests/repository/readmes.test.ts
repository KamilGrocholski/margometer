/**
 * `README.md` and `README.en.md` held to one skeleton, and both to one set of pictures.
 *
 * GitHub renders `README.md` and nothing else on the front page, so a second language is a second
 * file — and the second file is where the drift lives. A screenshot added to one, a release link
 * changed in one, a section that exists only in Polish: each renders perfectly and reads as
 * finished work, because a reader of one translation never sees the other.
 *
 * ⚠️ **The prose is deliberately not compared, and it is not comparable.** A translation is not a
 * transformation of its source and no machine here can say whether two sentences mean the same
 * thing. What it can say is that the two have the same shape — the same run of headings, the same
 * pictures in the same order, the same places the links go — which is the half that rots silently.
 */

import {
    assert,
    assertEquals,
    assertExists,
    assertNotStrictEquals,
    assertStrictEquals,
    assertStringIncludes,
} from "@std/assert";
import { getJsonReading } from "@/libs/json-text.ts";
import { getEndOfRun } from "@/libs/text-walk.ts";
import { isRecord } from "@/libs/unknown-reading.ts";
import { SHOT_DIRECTORY, SIDECAR_NAME } from "@/tools/panel-screenshots.ts";

const POLISH = "README.md";
const ENGLISH = "README.en.md";
/** The pair itself, which is the one link the two files must **not** share. */
const TRANSLATIONS = [POLISH, ENGLISH];
const HEADING_MARK = "#";
const PICTURE_MARK = "!";
const PICTURE_TAG = "<img";
const PICTURE_SOURCE = `src="`;
/** More pictures than a front page has ever shown here, so a run past it is a document to read. */
const MAXIMUM_PICTURES = 64;

function getSource(file: string): string {
    return Deno.readTextFileSync(file);
}

/**
 * Levels rather than titles: `## Instalacja` and `## Install` are the same heading, and all a
 * translation must keep of one is where it sits and how deep it is.
 */
function getHeadingLevels(source: string): number[] {
    const levels: number[] = [];
    for (const line of source.split("\n")) {
        if (!line.startsWith(HEADING_MARK)) continue;
        const depth = getEndOfRun(line, 0, (text, index) => text.charAt(index) === HEADING_MARK);
        assert(depth > 0, "a heading opened with a mark is at least one deep");
        if (line[depth] === " ") levels.push(depth);
    }
    return levels;
}

interface InlineLink {
    isPicture: boolean;
    target: string;
}

/**
 * Every `[label](target)`, and whether the `!` in front makes it a picture. A label runs to the
 * first `]` and a target to the first `)`, which is the whole grammar these two files use.
 */
function getInlineLinks(source: string): InlineLink[] {
    const links: InlineLink[] = [];
    assert(source.length > 0, "a document with links in it is not empty");
    for (let index = 0; index < source.length; index += 1) {
        if (source[index] !== "[") continue;
        const labelEnd = source.indexOf("]", index + 1);
        if (labelEnd === -1) break;
        if (source[labelEnd + 1] !== "(") {
            index = labelEnd;
            continue;
        }
        const targetEnd = source.indexOf(")", labelEnd + 2);
        if (targetEnd === -1) break;
        if (targetEnd > labelEnd + 2) {
            const target = source.slice(labelEnd + 2, targetEnd);
            links.push({ isPicture: source[index - 1] === PICTURE_MARK, target });
        }
        index = targetEnd;
    }
    return links;
}

/**
 * Every `<img src="…">`, walked like everything else here — **C7**. A front page shows its set
 * side by side, which is a table and a width per cell, and Markdown's own picture syntax states
 * neither: the pictures moved into tags and the reader had to follow them there.
 */
function getTagPicturePaths(source: string): string[] {
    const found: string[] = [];
    let index = source.indexOf(PICTURE_TAG);
    let seen = 0;
    for (; index !== -1 && seen < MAXIMUM_PICTURES; seen += 1) {
        const ended = source.indexOf(">", index);
        if (ended === -1) break;
        const opened = source.indexOf(PICTURE_SOURCE, index);
        // A source past the tag's own end belongs to whatever comes after it.
        if (opened !== -1 && opened < ended) {
            const closed = source.indexOf(`"`, opened + PICTURE_SOURCE.length);
            assertNotStrictEquals(closed, -1, "a source that opens a quote closes it");
            found.push(source.slice(opened + PICTURE_SOURCE.length, closed));
        }
        index = source.indexOf(PICTURE_TAG, ended);
    }
    assertStrictEquals(index, -1, "a document shows no more pictures than the bound allows");
    assert(found.length <= seen, "and each tag found is read at most once");
    return found;
}

/** Both spellings a picture has here: Markdown's, and the tag a sized one has to be. */
function getPicturePaths(source: string): string[] {
    const written = getInlineLinks(source).filter((one) => one.isPicture).map((one) => one.target);
    return [...written, ...getTagPicturePaths(source)];
}

function isSpaceAt(text: string, index: number): boolean {
    const character = text.charAt(index);
    assert(character.length <= 1, "one character is looked at");
    return character === " " || character === "\t";
}

/**
 * `[name]: target`, with the target the only thing on the rest of the line — two of them would be
 * a line this cannot read rather than a link it may silently halve. Walked rather than matched:
 * **C7**.
 */
function getDefinedLinkTarget(line: string): string | null {
    if (!line.startsWith("[")) return null;
    const labelEnd = line.indexOf("]");
    if (labelEnd <= 1) return null;
    if (line[labelEnd + 1] !== ":") return null;
    const rest = line.slice(labelEnd + 2);
    const start = getEndOfRun(rest, 0, isSpaceAt);
    if (start === rest.length) return null;
    const end = getEndOfRun(rest, start, (text, index) => !isSpaceAt(text, index));
    assert(end > start, "a target that starts somewhere runs at least one character");
    if (getEndOfRun(rest, end, isSpaceAt) !== rest.length) return null;
    return rest.slice(start, end);
}

/** Both spellings Markdown offers, with the pictures kept out — they are compared as a sequence. */
function getLinkTargets(source: string): string[] {
    const inline = getInlineLinks(source).filter((one) => !one.isPicture).map((one) => one.target);
    const defined: string[] = [];
    for (const line of source.split("\n")) {
        const target = getDefinedLinkTarget(line);
        if (target !== null) defined.push(target);
    }
    return [...inline, ...defined].filter((target) => !TRANSLATIONS.includes(target));
}

/**
 * The same set, in an order neither file chose. A picture's position is part of the layout and is
 * compared as a sequence; a link's is not — the release link may sit in a different sentence in
 * each language and still be the same offer.
 */
function getSortedLinkTargets(source: string): string[] {
    return [...new Set(getLinkTargets(source))].sort();
}

/**
 * Every reader here can match nothing and stay green — an empty run equals an empty run — which is
 * what a reader that has stopped finding its subject looks like from the outside.
 */
Deno.test("both were read, and there is a skeleton in them to compare", () => {
    for (const file of TRANSLATIONS) {
        const source = getSource(file);
        assert(getHeadingLevels(source).length > 0, `${file}: no heading was found in it`);
        assert(getPicturePaths(source).length > 0, `${file}: no picture was found in it`);
        assert(getLinkTargets(source).length > 0, `${file}: no link was found in it`);
    }
});

Deno.test("the picture reader finds a tag's source, and nothing that is only beside one", () => {
    const both = getPicturePaths(`![a](a.png)\n<img src="b.png" alt="b">`);
    assertEquals(both, ["a.png", "b.png"], "a picture is a picture in either spelling");
    const beside = getPicturePaths(`<img alt="b"><span src="c.png"></span>\n![a](a.png)`);
    assertEquals(beside, ["a.png"], "a source belonging to the tag after it is not a picture");
});

Deno.test("the two run the same headings, at the same depth, in the same order", () => {
    assertEquals(
        getHeadingLevels(getSource(ENGLISH)),
        getHeadingLevels(getSource(POLISH)),
        "a section in one language and not the other",
    );
});

Deno.test("the two show the same pictures, in the same order", () => {
    assertEquals(
        getPicturePaths(getSource(ENGLISH)),
        getPicturePaths(getSource(POLISH)),
        "a picture one translation shows and the other does not",
    );
});

Deno.test("the two send their links to the same places", () => {
    assertEquals(
        getSortedLinkTargets(getSource(ENGLISH)),
        getSortedLinkTargets(getSource(POLISH)),
        "a link one translation offers and the other does not",
    );
});

/**
 * What makes two files one document to a reader is that each offers the other, so it is read from
 * both ends: a switcher pointing at a file that does not link back is the dead end no switcher is.
 */
Deno.test("each translation offers the other on its first line", () => {
    for (const [file, other] of [[POLISH, ENGLISH], [ENGLISH, POLISH]]) {
        assertExists(file, "a translation is named");
        const firstLine = getSource(file).split("\n")[0] ?? "";
        assertStringIncludes(firstLine, `(${other})`, `${file}: does not offer ${other}`);
    }
});

/**
 * The pictures against the set that was actually shot. `panel-screenshots.ts` writes the sidecar
 * beside the set, so a README naming a file the set does not hold is a broken image on the front
 * page — and a set holding a picture no README shows is a file nothing consumes.
 */
Deno.test("the pictures a README shows are the set the sidecar names, both ways", () => {
    const reading = getJsonReading(Deno.readTextFileSync(`${SHOT_DIRECTORY}/${SIDECAR_NAME}`));
    assert(reading.isOk, "the sidecar beside the set is read");
    assert(isRecord(reading.value), "and is an object with the set in it");
    const shots = reading.value["shots"];
    assert(Array.isArray(shots), "which names the pictures it was taken as");
    const named = shots.map((one) => `${SHOT_DIRECTORY}/${one}`).sort();
    const shown = [...new Set(getPicturePaths(getSource(POLISH)))].sort();
    assertEquals(shown, named, "a README shows exactly the set that was shot");
});
