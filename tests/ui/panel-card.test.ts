/**
 * What a ranking row says on demand.
 *
 * Every figure here is one the statistics already hold: the card's whole job is to say what the
 * row it stands over had to leave out, so a test that let it compute one would be checking the
 * wrong thing.
 */

import { assert, assertEquals } from "@std/assert";
import { composeCardReading } from "@/src/ui/panel-card.ts";
import type { RowDetail } from "@/src/ui/panel-reading.ts";
import type { TipGroup } from "@/src/ui/panel-tip.ts";
import { CARD_WORDS, PANEL_WORDS, WARNING_MARK } from "@/src/ui/panel-words.ts";

/** A combatant who did every one of the four, and whose log left an end out of three of them. */
const HILDUR: RowDetail = {
    level: 83,
    damageDealtApplied: 354258,
    damageDealtRaw: 410002,
    damageTakenApplied: 141710,
    damageTakenRaw: 160998,
    healthGiven: 0,
    healthRestored: 16273,
    damagePrevented: 10413,
    blowsStruck: 40,
    blowsWithoutSkill: 7,
    skillUses: 30,
    damageDealtToNobody: 2104,
    damageTakenFromNobody: 10672,
    healthRestoredByNobody: 1500,
};

/** Somebody the roster holds and the fight never touched, which is a reading and not a gap. */
const NOBODY: RowDetail = {
    level: null,
    damageDealtApplied: 0,
    damageDealtRaw: 0,
    damageTakenApplied: 0,
    damageTakenRaw: 0,
    healthGiven: 0,
    healthRestored: 0,
    damagePrevented: 0,
    blowsStruck: 0,
    blowsWithoutSkill: 0,
    skillUses: 0,
    damageDealtToNobody: 0,
    damageTakenFromNobody: 0,
    healthRestoredByNobody: 0,
};

/** One group as a reader meets it, so an expectation reads like the window does. */
function readGroup(group: TipGroup): string[] {
    return group.lines.map((line) => {
        if (line.kind === "note") return line.text;
        if (line.kind === "sub") return `  ${line.label} ${line.stated}`;
        return line.isStrong ? `**${line.label}** ${line.stated}` : `${line.label} ${line.stated}`;
    });
}

Deno.test("a card states all four figures, and the one on screen is the one in bold", () => {
    const card = composeCardReading({
        name: "Hildur Muza Śmierci",
        profession: "p",
        detail: HILDUR,
        metric: "damageTakenApplied",
        warnings: [],
        opens: true,
    });
    assertEquals(card.name, "Hildur Muza Śmierci", "the name in full");
    assertEquals(card.subtitle, "Paladyn (83)", "what they are and how far along, under it");
    const [figures, counters, notes] = card.groups;
    assert(figures !== undefined, "a card states the four figures");
    assertEquals(
        readGroup(figures),
        [
            "Zadane 354 258",
            "  surowe 410 002",
            `  ${PANEL_WORDS.withoutTarget} 2 104`,
            "**Otrzymane** 141 710",
            "  surowe 160 998",
            `  ${PANEL_WORDS.withoutActor} 10 672`,
            "Leczenie dane 0",
            "Leczenie otrzymane 16 273",
            `  ${PANEL_WORDS.withoutActor} 1 500`,
        ],
        "each with the part of it the protocol named only this row's end of, under it",
    );
    assert(counters !== undefined, "and how they fought, under a rule of its own");
    assertEquals(
        readGroup(counters),
        [
            `${CARD_WORDS.blows} 40`,
            `  ${CARD_WORDS.blowsWithoutSkill} 7`,
            `${CARD_WORDS.skillUses} 30`,
            `${CARD_WORDS.prevented} 10 413`,
        ],
        "the blows, the ones nothing stood in front of, the announcements and what was stopped",
    );
    assert(notes !== undefined, "and what to be careful of");
    assertEquals(
        readGroup(notes),
        [CARD_WORDS.damageNote, CARD_WORDS.gesture],
        "a figure before reduction is owed the sentence that says not to subtract it",
    );
});

Deno.test("what somebody is stands beside how far along they are, or whichever was said", () => {
    const subtitleOf = (profession: string | null, level: number | null) =>
        composeCardReading({
            name: "Gracz 9",
            profession,
            detail: { ...NOBODY, level },
            metric: "damageDealtApplied",
            warnings: [],
            opens: false,
        }).subtitle;
    assertEquals(subtitleOf("b", 41), "Tancerz ostrzy (41)", "both, in one line and in that order");
    assertEquals(subtitleOf("b", null), "Tancerz ostrzy", "a profession with no level beside it");
    assertEquals(subtitleOf(null, 41), "(41)", "and a level with nothing to say what they are");
    assertEquals(subtitleOf(null, null), null, "neither is no line at all");
    // A letter the table does not hold reaches the reader as the game wrote it, rather than as an
    // invented name or as nothing: the panel colours the six the recordings state, and a seventh
    // would arrive from the game and not from here.
    assertEquals(subtitleOf("z", 41), "z (41)", "a profession nobody has worded is passed through");
});

Deno.test("a combatant the fight never touched states four zeros and nothing else", () => {
    const card = composeCardReading({
        name: "Gracz 9",
        profession: null,
        detail: NOBODY,
        metric: "damageDealtApplied",
        warnings: [],
        opens: false,
    });
    assertEquals(card.subtitle, null, "and a line drawn for neither is a question, not an answer");
    assertEquals(card.groups.length, 1, "and nothing they did is nothing to put under a rule");
    const [figures] = card.groups;
    assert(figures !== undefined, "the four still stand: zero happened, and is not unknown");
    assertEquals(
        readGroup(figures),
        [
            "**Zadane** 0",
            "Otrzymane 0",
            "Leczenie dane 0",
            "Leczenie otrzymane 0",
        ],
        "with no part under any of them, because there is no part of nothing",
    );
});

Deno.test("a part of a figure is drawn from the first point of it, and never below one", () => {
    const at = (figure: number) =>
        readGroup(
            composeCardReading({
                name: "Gracz 9",
                profession: null,
                detail: { ...NOBODY, damageDealtApplied: figure, damageDealtToNobody: figure },
                metric: "damageDealtApplied",
                warnings: [],
                opens: false,
            }).groups[0] ?? { lines: [] },
        );
    assertEquals(at(0)[1], "Otrzymane 0", "nothing named nobody is nothing to say");
    assertEquals(at(1)[1], `  ${PANEL_WORDS.withoutTarget} 1`, "and one point of it is said");
});

Deno.test("what the screen doubts is said again where the figures it doubts are", () => {
    const card = composeCardReading({
        name: "Hildur Muza Śmierci",
        profession: "m",
        detail: NOBODY,
        metric: "healthRestored",
        warnings: ["Nie udało się odczytać wszystkiego."],
        opens: false,
    });
    const notes = card.groups[1];
    assert(notes !== undefined, "a doubt about the screen is a doubt about every figure on it");
    assertEquals(
        readGroup(notes),
        [`${WARNING_MARK}Nie udało się odczytać wszystkiego.`],
        "and a reader looking at a card is looking away from the strip that says it",
    );
    assert(
        notes.lines.every((line) => line.kind === "note" && line.isWarning),
        "each drawn as a doubt, which is a mark as well as a colour",
    );
});
