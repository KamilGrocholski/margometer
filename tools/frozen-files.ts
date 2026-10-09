/**
 * What a freeze leaves in `frozen/`, and whether it moved. A reading carries the date or build of
 * the first fetch that gave its content (ADR 0011): a later fetch finding the same content leaves
 * the files as they stand, so a refresh changes the tree only where the game did. Several files
 * written off one fetch are decided together, because they date together.
 */

import { assert, assertExists, assertStrictEquals } from "@std/assert";
import * as errors from "#/libs/errors.ts";
import { LiteralTooLong, LiteralUnclosed, lookupQuotedLiteral } from "#/libs/text-walk.ts";
import { FrozenFilesError } from "./margometer-tool-error.ts";

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
/** Where a freeze writes, and nowhere else. */
const FROZEN_DIRECTORY = "frozen/";

/**
 * Reads what stands at each path and decides the date. The held date is read off the first file
 * rather than off an import, because a refresh rewrites the files under a module this process has
 * already bound.
 */
export function readFrozenFiles(
    paths: readonly string[],
    dateField: string,
    readDate: string,
    count: number,
    encode: (date: string) => string[],
): FrozenFiles {
    assert(paths.length > 0, "a freeze writes at least one file");
    const helds = paths.map(readHeldText);
    const firstHeld = helds[0] ?? null;
    const heldDate = firstHeld === null ? null : lookupHeldDate(firstHeld, dateField);
    return composeFrozenFiles(paths, helds, heldDate, readDate, count, encode);
}

/** A file nobody froze yet is an answer, not a failure: the freeze writes it. */
function readHeldText(path: string): string | null {
    assert(path.startsWith(FROZEN_DIRECTORY), "a freeze reads under frozen/ and nowhere else");
    const text = errors.attempt(() => Deno.readTextFileSync(path));
    if (text instanceof Error) {
        if (text.cause instanceof Deno.errors.NotFound) return null;
        throw new FrozenFilesError(`${path} stands and cannot be read`, { cause: text });
    }
    return text;
}

/** The date a generated module states, or null where it states none this encoder would write. */
export function lookupHeldDate(text: string, dateField: string): string | null {
    assert(dateField.length > 0, "a module is dated by a named field");
    const opener = `${DATE_INDENT}${dateField}${DATE_SEPARATOR}`;
    const openerAt = text.indexOf(opener);
    if (openerAt === -1) return null;
    const literal = lookupQuotedLiteral(text, openerAt + opener.length);
    if (literal instanceof LiteralTooLong) {
        throw new FrozenFilesError(`the date in \`${dateField}\` runs past the characters read`, {
            cause: literal,
        });
    }
    if (literal instanceof LiteralUnclosed) {
        throw new FrozenFilesError(`the date in \`${dateField}\` is never closed`, {
            cause: literal,
        });
    }
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
    for (const path of frozen.paths) {
        assert(path.startsWith(FROZEN_DIRECTORY), "a freeze writes under frozen/ and nowhere else");
    }
    if (!frozen.hasMoved) return;
    for (const [index, path] of frozen.paths.entries()) {
        const text = frozen.texts[index];
        assertExists(text, "every path has its text");
        const written = errors.attempt(() => Deno.writeTextFileSync(path, text));
        if (written instanceof errors.Caught) {
            throw new FrozenFilesError(`${path} cannot be written`, { cause: written });
        }
    }
}
