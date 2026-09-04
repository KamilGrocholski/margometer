/**
 * The frozen skill table against the page it was read from, and against the recordings.
 *
 * What it is for is two claims: that every skill the corpus announces is one this table names,
 * and that a duration the page states arrives here as a number rather than as text nobody read.
 */

import { assert, assertEquals, assertThrows } from "@std/assert";
import { FROZEN_SKILL_DURATIONS } from "@/frozen/skill-durations.ts";
import { SKILL_ID_KEY } from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { getIntegerFromText } from "@/libs/number-text.ts";
import { readSkillsFromHtml } from "@/tools/skill-table.ts";
import { SkillTableError } from "@/tools/margometer-tool-error.ts";
import { getRecordedMessages, getRecordingPaths } from "@/tests/recorded-fight.ts";

/** A row the page's own shape, invented rather than copied: eight cells, effects in the seventh. */
const SAMPLE_ROW = "<tr><td>14&nbsp;</td><td></td><td>Nazwa&nbsp;</td><td>Opis&nbsp;</td>" +
    "<td>4&nbsp;</td><td>10&nbsp;</td><td>slowfreeze_per=45@2,50@2;<br>freeze=1,2&nbsp;</td>" +
    "<td>reqp=m&nbsp;</td></tr>";
const SAMPLE_PAGE = `<table>${SAMPLE_ROW}</table>`;

/** The same row a column short, which is the page having been restructured under the reader. */
const NARROW_PAGE = "<table><tr><td>14</td><td>Nazwa</td><td>slowfreeze_per=45@2</td></tr></table>";

function getAnnouncedSkillIds(): Set<number> {
    const found = new Set<number>();
    for (const path of getRecordingPaths()) {
        for (const message of getRecordedMessages(path)) {
            for (const parameter of parseProtocolMessage(message).parameters) {
                if (parameter.key !== SKILL_ID_KEY) continue;
                const id = getIntegerFromText(parameter.value ?? "");
                if (id !== null) found.add(id);
            }
        }
    }
    assert(found.size > 0, "the corpus announces a skill, or this reader has stopped finding one");
    return found;
}

Deno.test("the reader takes a row of the page's own shape, and refuses one that is not", () => {
    const read = readSkillsFromHtml(SAMPLE_PAGE);
    assertEquals(read.length, 1, "one row, one skill");
    assertEquals(read[0]?.id, 14, "and the first cell is the id");
    assertEquals(
        read[0]?.effects.map((effect) => effect.key),
        ["slowfreeze_per", "freeze"],
        "every key of the effect cell, in the order the page states them",
    );
    assertEquals(read[0]?.effects[0]?.turns, [2], "the stated turns, distinct across the levels");
    assertEquals(read[0]?.effects[1]?.turns, [], "and none where the page states none");
    // Both ways: a reader that has stopped finding its subject calls every page clean.
    assertThrows(() => readSkillsFromHtml(NARROW_PAGE), SkillTableError, "no skill");
});

Deno.test("every skill the recordings announce is one the frozen table names", () => {
    const frozen = new Set<number>(FROZEN_SKILL_DURATIONS.skills.map((skill) => skill.id));
    const announced = [...getAnnouncedSkillIds()].sort((one, other) => one - other);
    const missing = announced.filter((id) => !frozen.has(id));
    assertEquals(missing, [], "a skill the corpus announces and the table does not name");
    assert(frozen.size >= announced.length, "and the table names at least what the corpus does");
});

Deno.test("a table that states no duration at all is the page having changed under us", () => {
    const stating = FROZEN_SKILL_DURATIONS.skills.filter((skill) =>
        skill.effects.some((effect) => effect.turns.length > 0)
    );
    assert(stating.length > 0, "the page states a duration somewhere, or the marker moved");
    const turns = stating.flatMap((skill) => skill.effects.flatMap((effect) => effect.turns));
    assert(turns.every((one) => one > 0), "and a stated duration is a number of turns, not zero");
});
