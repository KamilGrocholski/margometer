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
    blowsCritical: 9,
    damageDealtBlowLargest: 19209,
    damageTakenBlowLargest: 8062,
    procsWhenStriking: [
        { key: "+crit", figure: 9 },
        { key: "+pierce", figure: 4 },
        { key: "+of_crit", figure: 2 },
    ],
    procsWhenStruck: [{ key: "-evade", figure: 3 }, { key: "-legbon_cleanse", figure: 1 }],
    /** Defences and destroyed statistics are kept under the client's token, procs under the key. */
    damagePreventedByDefence: [
        { key: "absorb", figure: 8000 },
        { key: "blok", figure: 2413 },
    ],
    statisticsDestroyed: [
        { key: "acdmg", figure: 940 },
        { key: "resdmg", figure: 26 },
    ],
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
    blowsCritical: 0,
    damageDealtBlowLargest: 0,
    damageTakenBlowLargest: 0,
    procsWhenStriking: [],
    procsWhenStruck: [],
    /** Defences and destroyed statistics are kept under the client's token, procs under the key. */
    damagePreventedByDefence: [],
    statisticsDestroyed: [],
};

/** One group as a reader meets it, so an expectation reads like the window does. */
function readGroup(group: TipGroup): string[] {
    return group.lines.map((line) => {
        if (line.kind === "note") return line.text;
        if (line.kind === "heading") return `[${line.text}]`;
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
        translate: null,
    });
    assertEquals(card.name, "Hildur Muza Śmierci", "the name in full");
    assertEquals(card.subtitle, "Paladyn (83)", "what they are and how far along, under it");
    const [figures, counters, screen, notes] = card.groups;
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
        ],
        "the blows, the ones nothing stood in front of, and the announcements",
    );
    assert(screen !== undefined, "and what the screen itself asks about, under a rule of its own");
    assertEquals(
        readGroup(screen),
        [
            `${CARD_WORDS.prevented} 10 413`,
            "  wchłonięcie 8 000",
            "  blok 2 413",
            "unik 3",
            "-legbon_cleanse 1",
            `${CARD_WORDS.blowLargestTaken} 8 062`,
        ],
        "what stopped part of a blow, what fired on their side of one, and the hardest through",
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
            translate: null,
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

/**
 * The whole path: a key this repository has no word for, through the card, to what a reader sees.
 * `captures/` carries all six — `-tenacity` on 20 blows, 2026-08-30 — so today every one of them
 * stands in a card as raw protocol. **ADR 0024.**
 */
Deno.test("a key nothing here words is drawn as the player's own client names it", () => {
    const struck = {
        ...NOBODY,
        damageDealtApplied: 100,
        blowsStruck: 1,
        procsWhenStriking: [{ key: "-tenacity", figure: 1 }],
    };
    const cardWith = (translate: ((id: string) => string | null) | null) =>
        composeCardReading({
            name: "Gracz 9",
            profession: null,
            detail: struck,
            metric: "damageDealtApplied",
            warnings: [],
            opens: false,
            translate,
        }).groups.flatMap((group) => readGroup(group));
    assert(
        cardWith(null).some((line) => line.includes("-tenacity")),
        "with no client to ask, the card draws the key as the game wrote it",
    );
    const named = cardWith((id) => (id === "msg_-tenacity" ? "wytrwałość" : null));
    assert(
        named.some((line) => line.includes("wytrwałość")),
        "and with one, the client's own name",
    );
    assert(
        !named.some((line) => line.includes("-tenacity")),
        "in place of the raw key, not beside",
    );
});

Deno.test("a combatant the fight never touched states four zeros and nothing else", () => {
    const card = composeCardReading({
        name: "Gracz 9",
        profession: null,
        detail: NOBODY,
        metric: "damageDealtApplied",
        warnings: [],
        opens: false,
        translate: null,
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
                translate: null,
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
        translate: null,
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

Deno.test("the screen decides what the card says about how they fought, and only that", () => {
    const readScreen = (metric: "damageDealtApplied" | "damageTakenApplied" | "healthGiven") =>
        composeCardReading({
            name: "Hildur Muza Śmierci",
            profession: "p",
            detail: HILDUR,
            metric,
            warnings: [],
            opens: false,
            translate: null,
        }).groups.map(readGroup);
    const [, , dealt] = readScreen("damageDealtApplied");
    assert(dealt !== undefined, "the screen about striking says how they struck");
    assertEquals(
        dealt,
        [
            `${CARD_WORDS.blowsCritical} 9 (23%)`,
            `  ${CARD_WORDS.blowsCriticalOffhand} 2`,
            `${CARD_WORDS.blowLargestDealt} 19 209`,
            "przebicie 4",
            `[${CARD_WORDS.destroyed}]`,
            "  pancerz 940 pkt",
            "  odporność 26 p.p.",
        ],
        "the criticals against the blows, the hardest one, what else fired and what it took off",
    );
    // The crit keys are counted in the line above and never again beside it: `+crit` is the count
    // itself and `+of_crit` the part of it that was the offhand's.
    assert(!dealt.some((line) => line.includes("krytyk")), "and the crit keys are not said twice");
    const [, , taken] = readScreen("damageTakenApplied");
    assert(taken !== undefined, "and the screen about being struck says what held");
    assertEquals(taken[0], `${CARD_WORDS.prevented} 10 413`, "the sum a counter states");
    assertEquals(taken[1], "  wchłonięcie 8 000", "with the defences it is made of under it");
    // The one screen whose figures the protocol states least about states nothing here rather than
    // borrowing the other screen's answer.
    assertEquals(readScreen("healthGiven").length, 3, "healing adds no run of its own");
});

Deno.test("a rate is taken of blows, and a rate of no blows is no rate at all", () => {
    const critical = (blowsCritical: number, blowsStruck: number) =>
        composeCardReading({
            name: "Gracz 9",
            profession: null,
            detail: { ...NOBODY, blowsCritical, blowsStruck },
            metric: "damageDealtApplied",
            warnings: [],
            opens: false,
            translate: null,
        }).groups.flatMap((group) => readGroup(group)).filter((line) =>
            line.startsWith(CARD_WORDS.blowsCritical)
        );
    assertEquals(critical(0, 40), [], "nothing landed critically is nothing to say");
    assertEquals(
        critical(1, 40),
        [`${CARD_WORDS.blowsCritical} 1 (3%)`],
        "and one of them is said",
    );
    assertEquals(critical(40, 40), [`${CARD_WORDS.blowsCritical} 40 (100%)`], "as is all of them");
});

Deno.test("two keys the panel words the same way are one line, not two of one word", () => {
    // Five stun keys carry one word because they are one event from five sources. Drawn a key at a
    // time they made two lines reading `ogłuszenie` against different counts, and nothing on the
    // card says which stun either line is.
    const card = composeCardReading({
        name: "Amaimon Soploręki",
        profession: "p",
        detail: {
            ...NOBODY,
            blowsStruck: 20,
            procsWhenStriking: [
                { key: "+stun", figure: 5 },
                { key: "+stun2-c", figure: 1 },
                { key: "+freeze", figure: 2 },
            ],
        },
        metric: "damageDealtApplied",
        warnings: [],
        opens: false,
        translate: null,
    });
    const [, counters, screen] = card.groups;
    assert(counters !== undefined, "they struck, so the counters stand");
    assert(screen !== undefined, "and the screen about striking says what fired");
    assertEquals(
        readGroup(screen),
        ["ogłuszenie 6", "zamrożenie 2"],
        "one line per word, biggest first, and the stuns summed rather than listed apart",
    );
});
