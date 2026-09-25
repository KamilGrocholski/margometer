/**
 * The colours a reading names: the signal inks and the palette professions are drawn in. The rest
 * of the look is the stylesheet's, and it builds on these. `develop:DESIGN.md` owns what they are
 * for; this file owns what they are.
 */

/**
 * ⚠️ **Three, held by the compiler rather than by a check.** Everything here writes its answers
 * straight into a rule, and a list one short puts the word `undefined` inside a colour, which a
 * browser drops, leaving the element on whatever it inherits with nothing saying so.
 * `develop ADR 0051`.
 */
export type Colour = readonly [number, number, number];

export const SIGNAL = {
    ours: [0x00, 0xd0, 0x83],
    theirs: [0xff, 0x86, 0x85],
    suspect: [0xed, 0x9c, 0x00],
    caveat: [0x6b, 0xb5, 0xff],
    defect: [0xed, 0x78, 0xff],
    unknown: [0x92, 0x99, 0xa0],
} as const;

const HEX_BASE = 16;

export const PALETTE_COLOURS: readonly Colour[] = [
    [0x15, 0x7c, 0xd0],
    [0x3f, 0x8e, 0x2b],
    [0xbb, 0x4a, 0x7f],
    [0x9d, 0x6f, 0x00],
    [0x00, 0x8e, 0x71],
    [0xc2, 0x50, 0x2b],
];

/**
 * The codes are the game's own letters. Every one of the six is stated in `develop:captures/`: 262
 * combatants over the corpus as it stood on 2026-08-29, none without a profession, `w` 91 of them
 * and `b` 17.
 */
const PALETTE_INDEX_BY_PROFESSION: ReadonlyMap<string, number> = new Map([
    ["m", 0],
    ["h", 1],
    ["p", 2],
    ["t", 3],
    ["b", 4],
    ["w", 5],
]);

export function lookupColourForProfession(profession: string | null): Colour {
    if (profession === null) return SIGNAL.unknown;
    const stated = PALETTE_INDEX_BY_PROFESSION.get(profession);
    if (stated === undefined) return SIGNAL.unknown;
    return PALETTE_COLOURS[stated] ?? SIGNAL.unknown;
}

/** The spelling a rule and a style attribute take: a hash and two lower-case digits a channel. */
export function formatColour(colour: Colour): string {
    return `#${colour.map((channel) => channel.toString(HEX_BASE).padStart(2, "0")).join("")}`;
}
