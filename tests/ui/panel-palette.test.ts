/**
 * The hue a profession is drawn in, against the professions the recordings state and the words the
 * panel has for them.
 *
 * `develop:tests/ui/panel-look.test.ts` held these beside the sheet; the sheet is not here, and
 * what a reading is handed is the hue alone.
 */

import { assert, assertEquals } from "@std/assert";
import {
    formatColour,
    lookupColourForProfession,
    PALETTE_COLOURS,
    SIGNAL,
} from "#/src/ui/panel-palette.ts";
import { getWordsForProfession, PROFESSION_WORD_BY_KEY } from "#/src/ui/panel-words.ts";

/** Every profession the recordings state, measured over `develop:captures/` on 2026-08-29. */
const PROFESSIONS = ["w", "m", "h", "t", "p", "b"];
/** The letters, so a table can be asked about one it does not hold. */
const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

Deno.test("a profession keeps its colour, and one the game did not state is colourless", () => {
    const taken = PROFESSIONS.map((one) => lookupColourForProfession(one));
    assertEquals(new Set(taken).size, PROFESSIONS.length, "each of the six takes a hue of its own");
    for (const one of taken) {
        assert(PALETTE_COLOURS.some((hue) => hue === one), `${one} comes out of the palette`);
    }
    assertEquals(lookupColourForProfession(null), SIGNAL.unknown, "and none stated is colourless");
    assertEquals(lookupColourForProfession("z"), SIGNAL.unknown, "as is one nobody has a hue for");
    const palette = PALETTE_COLOURS.map(formatColour);
    assert(
        !palette.includes(formatColour(SIGNAL.unknown)),
        "which is not one of the palette, so it reads apart",
    );
});

/** The hue each letter wore on `develop` @ `fa1dcce`, which is the expectation here (**W8**). */
Deno.test("a profession wears the hue develop drew it in", () => {
    assertEquals(
        PROFESSIONS.map((one) => [one, formatColour(lookupColourForProfession(one))]),
        [
            ["w", "#c2502b"],
            ["m", "#157cd0"],
            ["h", "#3f8e2b"],
            ["t", "#9d6f00"],
            ["p", "#bb4a7f"],
            ["b", "#008e71"],
        ],
        "a hue moved between two professions is a bar a reader has learnt to read wrongly",
    );
});

Deno.test("a profession the panel colours is one it can name, and the other way round", () => {
    // N13: the game's own letters are spelled in two files, so the failure is quiet — a card
    // reading `b` where the bar beside it is drawn, or a hue nobody can say the name of.
    assertEquals(
        getColouredProfessions().sort(),
        [...PROFESSIONS].sort(),
        "the six the recordings state are the six the panel draws",
    );
    assertEquals(
        getUnpairedProfessions(PROFESSION_WORD_BY_KEY, getColouredProfessions()),
        [],
        "and every one of them has a word as well as a hue",
    );
    // A reader is proved by a sample it must flag and a sample it must not.
    assertEquals(
        getUnpairedProfessions(new Map([["w", "Wojownik"]]), ["w", "m"]),
        ["m"],
        "a hue with no word",
    );
    assertEquals(
        getUnpairedProfessions(new Map([["w", "W"], ["z", "Z"]]), ["w"]),
        ["z"],
        "and a word with no hue",
    );
    assertEquals(
        getUnpairedProfessions(new Map([["w", "W"]]), ["w"]),
        [],
        "a letter both sides hold is paired",
    );
});

/** Every letter the panel gives a hue to, asked of the palette rather than listed a second time. */
function getColouredProfessions(): string[] {
    const found: string[] = [];
    for (const letter of ALPHABET) {
        if (lookupColourForProfession(letter) !== SIGNAL.unknown) found.push(letter);
    }
    return found;
}

/** Which letters one side of the pairing holds and the other does not, in either direction. */
function getUnpairedProfessions(
    worded: ReadonlyMap<string, string>,
    coloured: readonly string[],
): string[] {
    const found: string[] = [];
    for (const code of coloured) {
        if (!worded.has(code)) found.push(code);
    }
    for (const code of worded.keys()) {
        if (!coloured.includes(code)) found.push(code);
    }
    return found.sort();
}

Deno.test("a profession the table does not word travels as the game wrote it", () => {
    assertEquals(getWordsForProfession("p"), "Paladyn", "a letter the table holds is worded");
    assertEquals(getWordsForProfession("z"), "z", "and a seventh the game invents is passed on");
});

Deno.test("a profession nobody has a hue for is drawn as the absence of one", () => {
    assertEquals(lookupColourForProfession(""), SIGNAL.unknown, "a letter that says nothing");
    assertEquals(lookupColourForProfession("zz"), SIGNAL.unknown, "and one that says too much");
});
