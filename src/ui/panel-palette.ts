/**
 * The colours a reading names: the signal inks and the palette professions are drawn in. The rest
 * of the look is the stylesheet's, and it builds on these. `develop:DESIGN.md` owns what they are
 * for; this file owns what they are.
 */

export const SIGNAL = {
    ours: "#00d083",
    theirs: "#ff8685",
    suspect: "#ed9c00",
    caveat: "#6bb5ff",
    defect: "#ed78ff",
    unknown: "#9299a0",
} as const;

export const PALETTE_COLOURS = [
    "#157cd0",
    "#3f8e2b",
    "#bb4a7f",
    "#9d6f00",
    "#008e71",
    "#c2502b",
] as const;

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

export function lookupColourForProfession(profession: string | null): string {
    if (profession === null) return SIGNAL.unknown;
    const stated = PALETTE_INDEX_BY_PROFESSION.get(profession);
    if (stated === undefined) return SIGNAL.unknown;
    return PALETTE_COLOURS[stated] ?? SIGNAL.unknown;
}
