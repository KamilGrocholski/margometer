/**
 * `docs/auras-standing.md` against every recording, both ways round.
 *
 * A register nobody re-earns is a measurement that outlives its material, so the document is read
 * back as a table and held to what the tool produces — a row it does not is refused, and so is a
 * row the tool produces that the document never states.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import {
    type AuraRow,
    composeAuraRows,
    composeProvocationRows,
    composeSourceRows,
    type ProvocationRow,
    type SourceRow,
} from "@/tools/aura-standing.ts";
import type { AuraReach } from "@/src/core/aura-standing.ts";
import { FROZEN_AURA_TURNS } from "@/frozen/aura-turns.ts";
import { readRecordingPaths } from "@/project/repository-layout.ts";

const REGISTER_PATH = "docs/auras-standing.md";

/** The provocation register, read back out of its own table under its own heading. */
function getDocumentedProvocations(): ProvocationRow[] {
    const rows: ProvocationRow[] = [];
    const said = Deno.readTextFileSync(REGISTER_PATH);
    for (const line of said.slice(said.indexOf("## What a shout holds")).split("\n")) {
        if (!line.startsWith("| ")) continue;
        const cells = line.split("|").slice(1, -1).map((one) => one.trim());
        if (cells.length !== 8) continue;
        const skillId = Number(cells[0]);
        if (!Number.isSafeInteger(skillId)) continue;
        rows.push({
            skillId,
            skillName: cells[1] ?? "",
            casters: Number(cells[2]),
            recordings: Number(cells[3]),
            heldAtOnce: Number(cells[4]),
            turnsStated: Number(cells[5]),
            coverageMinimum: Number(cells[6]),
            namedAtOnce: Number(cells[7]),
        });
    }
    return rows;
}

/** The register writes a reach as a word; `—` is nothing settling it, and never a side. */
function getReachFromWords(said: string): AuraReach | null {
    if (said === "caster's") return "casters-side";
    if (said === "other") return "other-side";
    if (said === "both") return "both-sides";
    return null;
}

/** The source register, read back out of its own table under its own heading. */
function getDocumentedSources(): SourceRow[] {
    const rows: SourceRow[] = [];
    const said = Deno.readTextFileSync(REGISTER_PATH);
    for (const line of said.slice(said.indexOf("## How many sources stand together")).split("\n")) {
        if (!line.startsWith("| ")) continue;
        const cells = line.split("|").slice(1, -1).map((one) => one.trim());
        if (cells.length !== 5) continue;
        const key = (cells[0] ?? "").replaceAll("`", "");
        if (key.length === 0) continue;
        if (!Number.isSafeInteger(Number(cells[1]))) continue;
        rows.push({
            key,
            momentsWithTwo: Number(cells[1]),
            momentsPastTwo: Number(cells[2]),
            momentsFromOne: Number(cells[3]),
            sourcesAtOnce: Number(cells[4]),
        });
    }
    return rows;
}

/** The register as the document writes it: a pipe table, read back by its own columns. */
function getDocumentedRows(): AuraRow[] {
    const rows: AuraRow[] = [];
    for (const line of Deno.readTextFileSync(REGISTER_PATH).split("\n")) {
        if (!line.startsWith("| ")) continue;
        const cells = line.split("|").slice(1, -1).map((one) => one.trim());
        if (cells.length !== 7) continue;
        const skillId = Number(cells[0]);
        if (!Number.isSafeInteger(skillId)) continue;
        rows.push({
            skillId,
            skillName: cells[1] ?? "",
            casters: Number(cells[2]),
            recordings: Number(cells[3]),
            standingAtOnce: Number(cells[4]),
            turnsStated: Number(cells[5]),
            reach: getReachFromWords(cells[6] ?? ""),
        });
    }
    return rows;
}

Deno.test("every row the register states is one the recordings produce, and the other way", () => {
    const measured = composeAuraRows(readRecordingPaths());
    assert(measured.length > 0, "the corpus casts something at a side");
    assertEquals(
        getDocumentedRows(),
        measured,
        "the register against what the tool reads off captures/",
    );
});

Deno.test("a shout is dated by its own row, and covers what that row states", () => {
    const shouts = new Map<number, { turns: number; coverageMinimum: number }>(
        FROZEN_AURA_TURNS.shouts.map((one) => [one.id, one]),
    );
    const documented = getDocumentedProvocations();
    assert(documented.length > 0, "the register states the skills that shout");
    for (const row of documented) {
        const shout = shouts.get(row.skillId);
        assertStrictEquals(
            row.turnsStated,
            shout?.turns,
            `${row.skillName}: the shout's own turns, never the skill's longest`,
        );
        assertStrictEquals(
            row.coverageMinimum,
            shout?.coverageMinimum,
            `${row.skillName}: and the fewest characters the table says it covers`,
        );
    }
});

/**
 * ⚠️ **One recording carries a shout naming more than one, and every other names one.** The
 * register's `names` column is what says the reading is exercised at all — a panel that took only
 * the first name of the value would still pass every other test in this file.
 */
Deno.test("the corpus holds a shout that named two, and holds both of them", () => {
    const measured = composeProvocationRows(readRecordingPaths());
    assert(measured.length > 0, "the corpus shouts at somebody");
    const listed = measured.filter((one) => one.namedAtOnce > 1);
    assert(listed.length > 0, "some shout in the corpus names more than one character");
    for (const row of measured) {
        assert(
            row.heldAtOnce >= row.namedAtOnce,
            `${row.skillName}: every character a value named is a character held`,
        );
        assert(row.namedAtOnce > 0, `${row.skillName}: a registered shout named somebody`);
    }
});

Deno.test("a skill the register states is one the published table dates, at the same turns", () => {
    const dated = new Map<number, number>(
        FROZEN_AURA_TURNS.skills.map((one) => [one.id, one.turns]),
    );
    for (const row of getDocumentedRows()) {
        assertStrictEquals(
            row.turnsStated,
            dated.get(row.skillId),
            `${row.skillName}: the register states the turns the frozen table gives it`,
        );
    }
    assert(dated.size >= getDocumentedRows().length, "the table dates at least what is cast");
});

Deno.test("nothing stands longer than it was given, and every row stands on somebody", () => {
    for (const row of composeAuraRows(readRecordingPaths())) {
        assert(row.casters > 0, `${row.skillName}: a row stands on somebody`);
        assert(row.recordings > 0, `${row.skillName}: and in a recording`);
        // Zero is the boundary the other side of `at once`: a skill in the register stood at
        // least once, or it would not be in it.
        assert(row.standingAtOnce > 0, `${row.skillName}: and stood at least once`);
        assert(
            row.standingAtOnce <= row.casters,
            `${row.skillName}: no more stand at once than there are people carrying it`,
        );
    }
});

Deno.test("the provocation register is what the recordings hold, and the other way", () => {
    const measured = composeProvocationRows(readRecordingPaths());
    assert(measured.length > 0, "the corpus shouts at somebody");
    assertEquals(
        getDocumentedProvocations(),
        measured,
        "the register against what the tool reads off captures/",
    );
});

Deno.test("a shout is in one register or the other, and never in both", () => {
    const stood = new Set(composeAuraRows(readRecordingPaths()).map((one) => one.skillId));
    for (const row of composeProvocationRows(readRecordingPaths())) {
        assert(
            !stood.has(row.skillId),
            `${row.skillName}: a shout holds characters rather than standing on a side`,
        );
    }
    assert(stood.size > 0, "and the whole-team casts are still registered beside them");
});

Deno.test("the source register is what the recordings hold, and the other way", () => {
    const measured = composeSourceRows(readRecordingPaths());
    assert(measured.length > 0, "the corpus stands more than one source of something at once");
    assertEquals(
        getDocumentedSources(),
        measured,
        "the register against what the tool reads off captures/",
    );
});

/**
 * The claim the document rests its stacking section on: the corpus **reaches** the cap the help
 * states, so a panel that summed every cast would draw a figure the game does not have.
 */
Deno.test("the corpus stands past two sources, and never one combatant twice", () => {
    const measured = composeSourceRows(readRecordingPaths());
    const past = measured.filter((one) => one.momentsPastTwo > 0);
    assert(past.length > 0, "some key stands from three or more combatants at once");
    for (const row of measured) {
        assertStrictEquals(
            row.momentsFromOne,
            0,
            `${row.key}: one combatant holding a key twice would be one source, not two`,
        );
        assert(row.sourcesAtOnce > 1, `${row.key}: a registered key stood from more than one`);
        assert(row.momentsWithTwo > 0, `${row.key}: and stood from exactly two at some moment`);
    }
});

Deno.test("nothing is held longer than it was given, and every row holds somebody", () => {
    for (const row of composeProvocationRows(readRecordingPaths())) {
        assert(row.casters > 0, `${row.skillName}: somebody shouted`);
        assert(row.recordings > 0, `${row.skillName}: in a recording`);
        assert(row.heldAtOnce > 0, `${row.skillName}: and held at least one character`);
        assert(row.turnsStated > 0, `${row.skillName}: for the turns the table gives it`);
    }
});
