/**
 * `docs/auras-standing.md` against every recording, both ways round. A register nobody re-earns is
 * a measurement that outlives its material, so the document is read back as a table and held to
 * what the tool produces: a row it does not is refused, and so is a row the tool produces that
 * the document never states.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { FROZEN_AURA_TURNS } from "#/frozen/aura-turns.ts";
import { AURA_REACH, type AuraReach } from "#/src/core/aura-standing.ts";
import {
    type AuraRow,
    type ProvocationRow,
    type SourceRow,
    tallyAuraRows,
    tallyProvocationRows,
    tallySourceRows,
} from "#/tools/aura-standing.ts";
import { readRecordedMaterial, replayMaterialSteps } from "#/tools/recorded-material.ts";
import { parseTableInteger, parseTableRows } from "#/tests/register-table.ts";

const REGISTER_PATH = "docs/auras-standing.md";
const REGISTER_HEADING = "## The register";
const SHOUT_HEADING = "## What a shout holds";
const SOURCE_HEADING = "## How many sources stand together";
const STEPPED = replayMaterialSteps(readRecordedMaterial([]));
const QUOTE = "`";

Deno.test("every row the register states is one the recordings produce, and the other way", () => {
    const measured = tallyAuraRows(STEPPED);
    assert(measured.length > 0, "the corpus casts something at a side");
    assertEquals(
        parseRegisterRows(Deno.readTextFileSync(REGISTER_PATH)),
        measured,
        "the register against what the tool reads off captures/",
    );
});

/** The register as the document writes it: a pipe table, read back by its own columns. */
function parseRegisterRows(text: string): AuraRow[] {
    const rows: AuraRow[] = [];
    for (const cells of parseTableRows(text, REGISTER_HEADING, 7)) {
        const skillId = parseTableInteger(cells[0]);
        if (!Number.isSafeInteger(skillId)) continue;
        rows.push({
            skillId,
            skillName: cells[1] ?? "",
            casters: parseTableInteger(cells[2]),
            recordings: parseTableInteger(cells[3]),
            standingAtOnce: parseTableInteger(cells[4]),
            turnsStated: parseTableInteger(cells[5]),
            reach: parseReach(cells[6] ?? ""),
        });
    }
    return rows;
}

/** The register writes a reach as a word; `—` is nothing settling it, and never a side. */
function parseReach(said: string): AuraReach | null {
    if (said === "caster's") return AURA_REACH.castersSide;
    if (said === "other") return AURA_REACH.otherSide;
    if (said === "both") return AURA_REACH.bothSides;
    return null;
}

Deno.test("a shout is dated by its own row, and covers what that row states", () => {
    const shouts = new Map<number, { turns: number; coverageMinimum: number }>(
        FROZEN_AURA_TURNS.shouts.map((one) => [one.id, one]),
    );
    const documented = parseShoutRows(Deno.readTextFileSync(REGISTER_PATH));
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

/** The provocation register, read back out of its own table under its own heading. */
function parseShoutRows(text: string): ProvocationRow[] {
    const rows: ProvocationRow[] = [];
    for (const cells of parseTableRows(text, SHOUT_HEADING, 8)) {
        const skillId = parseTableInteger(cells[0]);
        if (!Number.isSafeInteger(skillId)) continue;
        rows.push({
            skillId,
            skillName: cells[1] ?? "",
            casters: parseTableInteger(cells[2]),
            recordings: parseTableInteger(cells[3]),
            heldAtOnce: parseTableInteger(cells[4]),
            turnsStated: parseTableInteger(cells[5]),
            coverageMinimum: parseTableInteger(cells[6]),
            namedAtOnce: parseTableInteger(cells[7]),
        });
    }
    return rows;
}

/**
 * ⚠️ **One recording carries a shout naming more than one, and every other names one.** The
 * `names` column is what says the reading is exercised at all: a panel that took only the first
 * name of the value would still pass every other case in this file.
 */
Deno.test("the corpus holds a shout that named two, and holds both of them", () => {
    const measured = tallyProvocationRows(STEPPED);
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
    const documented = parseRegisterRows(Deno.readTextFileSync(REGISTER_PATH));
    assert(documented.length > 0, "the register states the skills that stand");
    for (const row of documented) {
        assertStrictEquals(
            row.turnsStated,
            dated.get(row.skillId),
            `${row.skillName}: the register states the turns the frozen table gives it`,
        );
    }
    assert(dated.size >= documented.length, "the table dates at least what is cast");
});

Deno.test("nothing stands longer than it was given, and every row stands on somebody", () => {
    for (const row of tallyAuraRows(STEPPED)) {
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
    const measured = tallyProvocationRows(STEPPED);
    assert(measured.length > 0, "the corpus shouts at somebody");
    assertEquals(
        parseShoutRows(Deno.readTextFileSync(REGISTER_PATH)),
        measured,
        "the register against what the tool reads off captures/",
    );
});

/**
 * An okrzyk is in both registers because it is both: the published table dates the shout and the
 * side-wide half apart (`develop ADR 0097`).
 */
Deno.test("an okrzyk is in both registers, because the table dates both of its halves", () => {
    const stood = new Set(tallyAuraRows(STEPPED).map((one) => one.skillId));
    const shouted = tallyProvocationRows(STEPPED);
    assert(shouted.length > 0, "the corpus holds shouts for the registers to disagree about");
    for (const row of shouted) {
        assert(
            stood.has(row.skillId),
            `${row.skillName}: an okrzyk the table dates on both halves stands on both`,
        );
    }
    assert(stood.size > shouted.length, "and the whole-team casts are still registered beside");
});

Deno.test("the source register is what the recordings hold, and the other way", () => {
    const measured = tallySourceRows(STEPPED);
    assert(measured.length > 0, "the corpus stands more than one source of something at once");
    assertEquals(
        parseSourceRows(Deno.readTextFileSync(REGISTER_PATH)),
        measured,
        "the register against what the tool reads off captures/",
    );
});

/** The source register, read back out of its own table under its own heading. */
function parseSourceRows(text: string): SourceRow[] {
    const rows: SourceRow[] = [];
    for (const cells of parseTableRows(text, SOURCE_HEADING, 5)) {
        const key = (cells[0] ?? "").replaceAll(QUOTE, "");
        if (key.length === 0) continue;
        const momentsWithTwo = parseTableInteger(cells[1]);
        if (!Number.isSafeInteger(momentsWithTwo)) continue;
        rows.push({
            key,
            momentsWithTwo,
            momentsPastTwo: parseTableInteger(cells[2]),
            momentsFromOne: parseTableInteger(cells[3]),
            sourcesAtOnce: parseTableInteger(cells[4]),
        });
    }
    return rows;
}

/**
 * The claim the document rests its stacking section on: the corpus **reaches** the cap the help
 * states, so a panel that summed every cast would draw a figure the game does not have.
 */
Deno.test("the corpus stands past two sources, and never one combatant twice", () => {
    const measured = tallySourceRows(STEPPED);
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
    for (const row of tallyProvocationRows(STEPPED)) {
        assert(row.casters > 0, `${row.skillName}: somebody shouted`);
        assert(row.recordings > 0, `${row.skillName}: in a recording`);
        assert(row.heldAtOnce > 0, `${row.skillName}: and held at least one character`);
        assert(row.turnsStated > 0, `${row.skillName}: for the turns the table gives it`);
    }
});
