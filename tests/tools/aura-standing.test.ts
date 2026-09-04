/**
 * The aura register, held against the recordings both ways.
 *
 * A guard refusing only a row the tree does not produce would stay green while the document kept
 * rows for skills nobody casts any more; one refusing only an unnamed skill would stay green while
 * every figure went stale. So the two lists are compared as sets, and the reader is proved by a
 * sample it must flag and a sample it must not.
 */

import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import { type AuraCase, composeAuraCases } from "@/tools/aura-standing.ts";
import { FROZEN_AURA_TURNS } from "@/frozen/aura-turns.ts";

const REGISTER_PATH = "docs/auras-standing.md";
/** The skill the register quotes for the two-caster case, and the one the maintainer named. */
const MARK = "Piętno bestii";

function getCellsFromLine(line: string): string[] {
    const cells: string[] = [];
    let at = line.indexOf("|");
    assert(at >= 0, "a table line opens with a bar");
    let next = line.indexOf("|", at + 1);
    // The bound is the line's own length: a table row holds fewer cells than it holds characters.
    for (let held = 0; held < line.length; held += 1) {
        if (next === -1) break;
        cells.push(line.slice(at + 1, next).trim());
        at = next;
        next = line.indexOf("|", at + 1);
    }
    return cells;
}

/** The register's own table and no other in the file, read by the heading it sits under. */
export function getRegisterKeys(text: string): string[] {
    const found: string[] = [];
    let inside = false;
    for (const line of text.split("\n")) {
        if (line.startsWith("## The register")) inside = true;
        else if (inside && line.startsWith("## ")) break;
        if (!inside) continue;
        if (!line.startsWith("| ")) continue;
        const cells = getCellsFromLine(line);
        if (cells.length !== 7) continue;
        const [id] = cells;
        if (id === undefined || id.length === 0) continue;
        if (Number.isNaN(Number(id))) continue;
        found.push(cells.join(" | "));
    }
    return found;
}

function composeMeasuredKey(one: AuraCase): string {
    return [
        `${one.skillId}`,
        one.skillName,
        `${one.casts}`,
        `${one.casters}`,
        `${one.atOnce}`,
        `${one.turnsStated}`,
        one.turnsSeen === null ? "—" : `${one.turnsSeen}`,
    ].join(" | ");
}

Deno.test("the register reader finds a row of the register and nothing else", () => {
    const sample = [
        "## The register",
        "| id | skill | casts | casters | at once | stated | seen |",
        "| --: | ----- | ----: | ------: | ------: | -----: | ---- |",
        "| 264 | Piętno bestii | 20 | 10 | 2 | 8 | — |",
        "## Why `seen` cannot check `stated`",
        "| 999 | Nigdy | 1 | 1 | 1 | 1 | — |",
    ].join("\n");
    assertEquals(
        getRegisterKeys(sample),
        ["264 | Piętno bestii | 20 | 10 | 2 | 8 | —"],
        "the row under the register's own heading",
    );
    // Both ways: a reader taking the table past it would compare a row nobody measured.
    assert(!getRegisterKeys(sample).some((one) => one.includes("Nigdy")), "and no row past it");
});

Deno.test("every row of the register is one the recordings produce, and the reverse", () => {
    const written = getRegisterKeys(Deno.readTextFileSync(REGISTER_PATH));
    const measured = composeAuraCases().map(composeMeasuredKey);
    assert(written.length > 0, "the register names something, or this guard checks nothing");
    assertEquals(
        written.filter((one) => !measured.includes(one)),
        [],
        "a row the register states and the recordings do not produce",
    );
    assertEquals(
        measured.filter((one) => !written.includes(one)),
        [],
        "and a row the recordings produce that the register never states",
    );
});

/**
 * ⚠️ **A skill nothing casts has no row, and that is the claim.** Five of the thirteen the table
 * dates are cast in no recording, and a row for one would be a figure about material nobody holds.
 */
Deno.test("a skill the corpus never casts is named in prose and never as a row", () => {
    const text = Deno.readTextFileSync(REGISTER_PATH);
    const cast = new Set(composeAuraCases().map((one) => one.skillId));
    const uncast = FROZEN_AURA_TURNS.skills.filter((one) => !cast.has(one.id));
    assert(uncast.length > 0, "the table dates a skill nobody casts, or this guard checks nothing");
    for (const skill of uncast) {
        assertStringIncludes(text, `(${skill.id})`, "an uncast skill is still accounted for");
    }
    assertEquals(
        getRegisterKeys(text).filter((row) => uncast.some((one) => row.startsWith(`${one.id} |`))),
        [],
        "and none of them stands as a row",
    );
});

Deno.test("the two-caster case the register stands on is one the corpus really holds", () => {
    const marks = composeAuraCases().find((one) => one.skillName === MARK);
    assert(marks !== undefined, "the skill the maintainer named is cast in the corpus");
    assert(marks.atOnce >= 2, "and two of them run at once, which is what the strip draws apart");
    assertStringIncludes(Deno.readTextFileSync(REGISTER_PATH), MARK, "the register names it");
});
