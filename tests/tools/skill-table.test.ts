/**
 * The published skill table, read off the page and frozen.
 *
 * Every row below is invented. The page is the operator's own writing and none of its sentences
 * enter this repository (NOTICE.md), so what a transcript would prove here — that the reader
 * matches the real page — is proved instead by the frozen reading, which is a transcript and is
 * in git: `tests/repository/skill-durations.test.ts` holds it against `captures/`.
 */

import { assert, assertEquals, assertStrictEquals, assertThrows } from "@std/assert";
import { composeAuraSkills, composeShoutSkills, readSkillsFromPage } from "@/tools/skill-table.ts";
import { SkillTableError } from "@/tools/margometer-tool-error.ts";

/** Eight cells, which is what the page serves: id, tags, name, description, prof, levels, … */
function composeRow(id: string, effects: string): string {
    return `<tr><td>${id}&nbsp;</td><td> spl</td><td>Nazwa&nbsp;</td><td>Opis&nbsp;</td>` +
        `<td>4&nbsp;</td><td>10&nbsp;</td><td>${effects}&nbsp;</td><td>reqp=m&nbsp;</td></tr>`;
}

Deno.test("a duration is read off the level it is stated on, and none where none is", () => {
    const read = readSkillsFromPage(
        composeRow("264", "taken_dmg_per-all=6@8,7@8;<br>cooldown=8"),
    );
    assertStrictEquals(read.length, 1, "one row, one skill");
    assertEquals(read[0]?.effects, [
        { key: "taken_dmg_per-all", turns: [8, 8], amounts: [6, 7] },
        { key: "cooldown", turns: [], amounts: [] },
    ], "the marked half is the turns, the half in front of it the value, and none is none");
});

Deno.test("a level stating no duration is passed over rather than read as nothing", () => {
    const read = readSkillsFromPage(
        composeRow("7", "critmval_l=1,2,3;<br>slowfreeze_per=45@2,50@3"),
    );
    assertEquals(read[0]?.effects, [
        { key: "critmval_l", turns: [], amounts: [] },
        { key: "slowfreeze_per", turns: [2, 3], amounts: [45, 50] },
    ], "a run of plain values is a duration nowhere, not a duration of zero");
});

Deno.test("a value the page writes as arithmetic is read as no duration at all", () => {
    // `mana=0.3*cplvl` and `dmg-target_absolute=10*cplvl` are stated per level and dated nowhere.
    const read = readSkillsFromPage(composeRow("8", "mana=0.3*cplvl,0.32*cplvl"));
    assertEquals(
        read[0]?.effects,
        [{ key: "mana", turns: [], amounts: [] }],
        "nothing marked, nothing read",
    );
});

Deno.test("a page of another shape is refused rather than read off by one", () => {
    // Read off by one, the description column lands where the effects were — and a duration
    // drawn from prose is the number that might be wrong looking exactly like one that is right.
    const short =
        "<tr><td>264&nbsp;</td><td>Nazwa&nbsp;</td><td>taken_dmg_per-all=6@8&nbsp;</td></tr>";
    assertThrows(
        () => readSkillsFromPage(short),
        SkillTableError,
        "columns",
        "a row of the wrong width leaves the table with no row it will take",
    );
    assertThrows(() => readSkillsFromPage(""), SkillTableError, "columns", "and so does no page");
});

Deno.test("a row whose id is not a number is passed over, not read as one", () => {
    const read = readSkillsFromPage(
        composeRow("id", "aura-sa_per=11@8") + composeRow("89", "aura-sa_per=11@8"),
    );
    assertEquals(read.map((one) => one.id), [89], "the heading row the page opens with");
});

/**
 * ⚠️ **The shout is the one key whose value is a count of characters** rather than a share, and it
 * is what the panel expands a provocation over. `FROZEN_SKILL_DURATIONS` keeps turns and drops
 * values, so this is the only place the count is read off a page shape. **ADR 0063.**
 */
Deno.test("a shout is carried by its own turns and by the fewest characters it covers", () => {
    const read = readSkillsFromPage(
        composeRow("188", "shout=6@3,7@3,8@3;<br>alllowdmg=1@5;<br>red-sa=6") +
            composeRow("89", "aura-sa_per=11@8;<br>cooldown=6"),
    );
    assertEquals(
        composeShoutSkills(read),
        [{ id: 188, turns: 3, coverageMinimum: 6 }],
        "three turns of its own where the skill's longest is five, and six at its lowest level",
    );
    assertEquals(
        composeAuraSkills(read).find((one) => one.id === 188),
        { id: 188, turns: 5 },
        "the aura reading of the same skill is still the longest of its effects",
    );
});

Deno.test("a shout the page dates nowhere is carried nowhere", () => {
    const read = readSkillsFromPage(composeRow("188", "shout=6;<br>alllowdmg=1@5"));
    assertEquals(composeShoutSkills(read), [], "a count with no turns beside it holds nobody");
});

Deno.test("only the skills reaching a side are carried, at the longest they state", () => {
    const read = readSkillsFromPage(
        composeRow("188", "shout=6@3;<br>alllowdmg=1@5;<br>red-sa=6") +
            composeRow("8", "manaendest=40,45") +
            composeRow("89", "aura-sa_per=11@8;<br>cooldown=6"),
    );
    assertEquals(
        composeAuraSkills(read),
        [{ id: 188, turns: 5 }, { id: 89, turns: 8 }],
        "the one reaching nobody is left behind, and the one stating two takes the longer",
    );
    assert(
        composeAuraSkills(read).length < read.length,
        "a side's table is the smaller of the two",
    );
});
