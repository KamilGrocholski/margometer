/**
 * What a freeze leaves in `frozen/`, and whether it moved. A reading carries the date or build of
 * the first fetch that gave its content (ADR 0011): a later fetch finding the same content leaves
 * the files as they stand, so a refresh changes the tree only where the game did. Several files
 * written off one fetch are decided together, because they date together.
 */

import { assert, assertStrictEquals } from "@std/assert";
import * as errors from "#/libs/errors.ts";
import { lookupQuotedLiteral } from "#/libs/text-walk.ts";

/** The texts a freeze would write, the date they carry, and the two dates it chose between. */
export interface FrozenFiles {
    paths: readonly string[];
    texts: readonly string[];
    date: string;
    heldDate: string | null;
    readDate: string;
    count: number;
    hasMoved: boolean;
}

/** The field a generated module dates itself by, as its encoder indents it. */
const DATE_INDENT = "\n    ";
const DATE_SEPARATOR = ": ";

/**
 * Reads what stands at each path and decides the date. The held date is read off the first file
 * rather than off an import, because a refresh rewrites the files under a module this process has
 * already bound.
 */
export function prepareFrozenFiles(
    paths: readonly string[],
    dateField: string,
    readDate: string,
    count: number,
    encode: (date: string) => string[],
): FrozenFiles {
    assert(paths.length > 0, "a freeze writes at least one file");
    const helds = paths.map(readHeldText);
    const first = helds[0] ?? null;
    const heldDate = first === null ? null : lookupHeldDate(first, dateField);
    return composeFrozenFiles(paths, helds, heldDate, readDate, count, encode);
}

/** A file nobody froze yet is an answer, not a failure: the freeze writes it. */
function readHeldText(path: string): string | null {
    assert(path.startsWith("frozen/"), "a freeze writes under frozen/ and nowhere else");
    const text = errors.attempt(() => Deno.readTextFileSync(path));
    if (text instanceof Error) return null;
    return text;
}

/** The date a generated module states, or null where it states none this encoder would write. */
export function lookupHeldDate(text: string, dateField: string): string | null {
    assert(dateField.length > 0, "a module is dated by a named field");
    const opener = `${DATE_INDENT}${dateField}${DATE_SEPARATOR}`;
    const at = text.indexOf(opener);
    if (at === -1) return null;
    const literal = lookupQuotedLiteral(text, at + opener.length);
    if (literal === null) return null;
    if (literal.text.length === 0) return null;
    return literal.text;
}

/**
 * The held date where encoding under it gives back every file byte for byte; the read date
 * otherwise. Byte for byte rather than field by field, so a change nobody taught this to compare —
 * a banner, an order, a count — re-dates the reading as surely as a new key does.
 */
export function composeFrozenFiles(
    paths: readonly string[],
    helds: readonly (string | null)[],
    heldDate: string | null,
    readDate: string,
    count: number,
    encode: (date: string) => string[],
): FrozenFiles {
    assertStrictEquals(helds.length, paths.length, "one held text per path");
    assert(readDate.length > 0, "a fetch is dated");
    assert(count > 0, "a reading counts something");
    if (heldDate === null) return composeFrozenFilesMoved(paths, heldDate, readDate, count, encode);
    const kept = encode(heldDate);
    assertStrictEquals(kept.length, paths.length, "the encoder writes one text per path");
    const isKept = kept.every((text, index) => text === helds[index]);
    if (isKept) {
        return { paths, texts: kept, date: heldDate, heldDate, readDate, count, hasMoved: false };
    }
    return composeFrozenFilesMoved(paths, heldDate, readDate, count, encode);
}

function composeFrozenFilesMoved(
    paths: readonly string[],
    heldDate: string | null,
    readDate: string,
    count: number,
    encode: (date: string) => string[],
): FrozenFiles {
    const texts = encode(readDate);
    assertStrictEquals(texts.length, paths.length, "the encoder writes one text per path");
    assert(texts.every((text) => text.includes(readDate)), "a moved reading carries the new date");
    return { paths, texts, date: readDate, heldDate, readDate, count, hasMoved: true };
}

/** Writes the files where they moved, and leaves them alone where they did not. */
export function writeFrozenFiles(frozen: FrozenFiles): void {
    assertStrictEquals(frozen.texts.length, frozen.paths.length, "one text per path");
    if (!frozen.hasMoved) return;
    for (const [index, path] of frozen.paths.entries()) {
        const text = frozen.texts[index];
        assert(text !== undefined, "every path has its text");
        Deno.writeTextFileSync(path, text);
    }
}
