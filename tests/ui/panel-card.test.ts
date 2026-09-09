/**
 * What a person's row says on demand.
 *
 * Every figure here is one the statistics already hold: the card's whole job is to say what the
 * row it stands over had to leave out, so a test that let it compute one would be checking the
 * wrong thing.
 */

import { assert, assertArrayIncludes, assertEquals, assertExists } from "@std/assert";
import { composeCardReading } from "@/src/ui/panel-card.ts";
import type { PanelMetric, PanelSidePart, RowDetail } from "@/src/ui/panel-reading.ts";
import { SCREEN_ORDER } from "@/src/ui/panel-screen.ts";
import type { TipGroup } from "@/src/ui/panel-tip.ts";
import {
    CARD_WORDS,
    composeUnknownKeyRowSuspicion,
    PANEL_WORDS,
    SUSPECT_MARK,
} from "@/src/ui/panel-words.ts";

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
    turnsTaken: 37,
    turnsLost: 4,
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
    unreadMessagesUnknownKey: 0,
    unreadMessagesNoParameter: 0,
    castsUnplaced: 0,
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
    turnsTaken: 0,
    turnsLost: 0,
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
    unreadMessagesUnknownKey: 0,
    unreadMessagesNoParameter: 0,
    castsUnplaced: 0,
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
        sidePart: "nobody" as const,
        detail: HILDUR,
        metric: "damageTakenApplied",
        doesOpen: true,
        isRowNarrower: false,
        translate: null,
    });
    assertEquals(card.name, "Hildur Muza Śmierci", "the name in full");
    assertEquals(card.subtitle, "Paladyn (83)", "what they are and how far along, under it");
    const [figures, counters, , , notes] = card.groups;
    assertExists(figures, "a card states the four figures");
    assertEquals(
        readGroup(figures),
        [
            "Zadane 354\u00a0258",
            `  ${CARD_WORDS.raw} 410\u00a0002`,
            `  ${PANEL_WORDS.withoutTarget} 2\u00a0104`,
            "**Otrzymane** 141\u00a0710",
            `  ${CARD_WORDS.raw} 160\u00a0998`,
            `  ${PANEL_WORDS.withoutActor} 10\u00a0672`,
            "Leczenie dane 0",
            "Leczenie otrzymane 16\u00a0273",
            `  ${PANEL_WORDS.withoutActor} 1\u00a0500`,
        ],
        "each with the part of it the protocol named only this row's end of, under it",
    );
    assertExists(counters, "and how they fought, under a rule of its own");
    assertEquals(
        readGroup(counters),
        [
            `${CARD_WORDS.turns} 37`,
            `  ${CARD_WORDS.turnsLost} 4`,
            `${CARD_WORDS.blows} 40`,
            `  ${CARD_WORDS.blowsWithoutSkill} 7`,
            `${CARD_WORDS.skillUses} 30`,
        ],
        "the turns, the ones lost, the blows, the ones behind no skill, and the announcements",
    );
    assertExists(notes, "and what to be careful of");
    assertEquals(
        readGroup(notes),
        [CARD_WORDS.damageNote, CARD_WORDS.gesture],
        "a figure before reduction is owed the sentence that says not to subtract it",
    );
});

/**
 * **A figure before reduction is the raw of the blows and not of the figure beside it**, so the
 * label says what it is a sum of. The protocol states one on a blow and nowhere else, while an
 * applied figure grows from blows, from damage named against somebody and from health moving
 * outside one — over `captures/` on 2026-08-31 the sum stood **below** the figure it is drawn under
 * on 20 of the 244 rows stating both on the dealt end, and on 48 of the 100 on the taken end.
 */
Deno.test("a figure before reduction says it is the blows', and owes the sentence", () => {
    const lines = composeCardReading({
        name: "Hildur Muza Śmierci",
        profession: "p",
        sidePart: "nobody" as const,
        detail: HILDUR,
        metric: "damageTakenApplied",
        doesOpen: false,
        isRowNarrower: false,
        translate: null,
    }).groups.flatMap(readGroup);
    assertEquals(
        lines.filter((line) => line.startsWith(`  ${CARD_WORDS.raw}`)),
        [`  ${CARD_WORDS.raw} 410\u00a0002`, `  ${CARD_WORDS.raw} 160\u00a0998`],
        "both ends state theirs, each under the figure it is drawn beside",
    );
    assert(
        CARD_WORDS.raw.includes(" "),
        "and the label is qualified rather than the bare word, which is what makes it true",
    );
    assertArrayIncludes(
        lines,
        [CARD_WORDS.damageNote],
        "with the sentence saying not to subtract it",
    );
    // The sample that must not carry it: nothing before reduction was stated, so neither is said.
    const without = composeCardReading({
        name: "Gracz 9",
        profession: null,
        sidePart: "nobody" as const,
        detail: { ...HILDUR, damageDealtRaw: 0, damageTakenRaw: 0 },
        metric: "damageTakenApplied",
        doesOpen: false,
        isRowNarrower: false,
        translate: null,
    }).groups.flatMap(readGroup);
    assertEquals(
        without.filter((line) => line.startsWith(`  ${CARD_WORDS.raw}`)),
        [],
        "a card with no raw figure on it draws no raw line",
    );
    assert(!without.includes(CARD_WORDS.damageNote), "and owes no sentence about one");
});

/**
 * Which end a key belongs to is read per key from `docs/protocol-keys.md` and never off the sign:
 * `+legbon_curse` fires when its holder attacks and `-legbon_cleanse` when its holder is struck,
 * on messages of one shape. The heading is what says whose each line is. **ADR 0032.**
 */
Deno.test("the card says what they did when they struck, and what held when they were", () => {
    const card = composeCardReading({
        name: "Hildur Muza Śmierci",
        profession: "p",
        sidePart: "nobody" as const,
        detail: HILDUR,
        metric: "damageTakenApplied",
        doesOpen: true,
        isRowNarrower: false,
        translate: null,
    });
    const [, , striking, struck] = card.groups;
    assertExists(striking, "how they struck stands under a heading naming that end");
    assertEquals(
        readGroup(striking),
        [
            `[${CARD_WORDS.striking}]`,
            `${CARD_WORDS.blowsCritical} 9 (23%)`,
            `  ${CARD_WORDS.blowsCriticalOffhand} 2`,
            `${CARD_WORDS.blowLargestDealt} 19\u00a0209`,
            "przebicie 4",
            `[${CARD_WORDS.destroyed}]`,
            "  pancerz 940 pkt",
            "  odporność 26 p.p.",
        ],
        "the criticals against the blows, the hardest one, what else fired and what it took off",
    );
    assertExists(struck, "and what happened when somebody struck them, under the other");
    assertEquals(
        readGroup(struck),
        [
            `[${CARD_WORDS.struck}]`,
            `${CARD_WORDS.prevented} 10\u00a0413`,
            "  wchłonięcie 8\u00a0000",
            "  blok 2\u00a0413",
            "unik 3",
            "-legbon_cleanse 1",
            `${CARD_WORDS.blowLargestTaken} 8\u00a0062`,
        ],
        "what stopped part of a blow, what fired on their side of one, and the hardest through",
    );
});

Deno.test("what somebody is stands beside how far along they are, or whichever was said", () => {
    const subtitleOf = (
        profession: string | null,
        level: number | null,
        sidePart: PanelSidePart = "nobody",
    ) => composeCardReading({
        name: "Gracz 9",
        profession,
        sidePart,
        detail: { ...NOBODY, level },
        metric: "damageDealtApplied",
        doesOpen: false,
        isRowNarrower: false,
        translate: null,
    }).subtitle;
    assertEquals(subtitleOf("b", 41), "Tancerz ostrzy (41)", "both, in one line and in that order");
    assertEquals(subtitleOf("b", null), "Tancerz ostrzy", "a profession with no level beside it");
    assertEquals(subtitleOf(null, 41), "(41)", "and a level with nothing to say what they are");
    assertEquals(subtitleOf(null, null), null, "neither is no line at all");
    // The word the row's rule is drawn against: colour never carries a meaning alone, and this
    // is the label it carries (**ADR 0065**). A fight with no seat to read from says none of it.
    assertEquals(
        subtitleOf("b", 41, "ours"),
        "Tancerz ostrzy (41) · My",
        "and whose side they stand on, last, because it is the panel's answer and not the game's",
    );
    assertEquals(subtitleOf("b", 41, "theirs"), "Tancerz ostrzy (41) · Oni", "either way round");
    assertEquals(
        subtitleOf(null, null, "ours"),
        "My",
        "the side alone where nothing else was said",
    );
    assertEquals(subtitleOf(null, null, "nobody"), null, "and nothing at all where none was");
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
            sidePart: "nobody" as const,
            detail: struck,
            metric: "damageDealtApplied",
            doesOpen: false,
            isRowNarrower: false,
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
        sidePart: "nobody" as const,
        detail: NOBODY,
        metric: "damageDealtApplied",
        doesOpen: false,
        isRowNarrower: false,
        translate: null,
    });
    assertEquals(card.subtitle, null, "and a line drawn for neither is a question, not an answer");
    assertEquals(card.groups.length, 1, "and nothing they did is nothing to put under a rule");
    const [figures] = card.groups;
    assertExists(figures, "the four still stand: zero happened, and is not unknown");
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
                sidePart: "nobody" as const,
                detail: { ...NOBODY, damageDealtApplied: figure, damageDealtToNobody: figure },
                metric: "damageDealtApplied",
                doesOpen: false,
                isRowNarrower: false,
                translate: null,
            }).groups[0] ?? { lines: [] },
        );
    assertEquals(at(0)[1], "Otrzymane 0", "nothing named nobody is nothing to say");
    assertEquals(at(1)[1], `  ${PANEL_WORDS.withoutTarget} 1`, "and one point of it is said");
});

/**
 * A gap naming nobody stays under the list, where it qualifies every row at once. A card repeating
 * it wrote one sentence once per row, and wrote it twice on the row that was the reason for it.
 * **ADR 0069.**
 */
Deno.test("a card says the gaps that name its own person, and no others", () => {
    const readNotes = (detail: RowDetail) => {
        const card = composeCardReading({
            name: "Hildur Muza Śmierci",
            profession: "m",
            sidePart: "nobody" as const,
            detail,
            metric: "healthRestored",
            doesOpen: false,
            isRowNarrower: false,
            translate: null,
        });
        return card.groups.flatMap((group) => group.lines);
    };
    const clean = readNotes(NOBODY);
    assertEquals(
        clean.filter((line) => line.kind === "note" && line.isSuspect),
        [],
        "a person no gap names carries none, whatever the fight is short of",
    );
    const charged = readNotes({ ...NOBODY, unreadMessagesUnknownKey: 2 })
        .filter((line) => line.kind === "note" && line.isSuspect);
    assertEquals(charged.length, 1, "and the person a gap does name carries that one");
    assert(
        charged[0]?.kind === "note" && charged[0].text.startsWith(SUSPECT_MARK),
        "drawn as a suspicion, which is a mark as well as a colour",
    );
});

/**
 * The mark on a row is what a reader followed here, so the sentence explaining it stands over the
 * fight's own: this card is about the person, and the fight's suspicion is about every row at once.
 */
Deno.test("a card states both of the gaps that can name one person, widest first", () => {
    const card = composeCardReading({
        name: "Hildur Muza Śmierci",
        profession: "m",
        sidePart: "nobody" as const,
        detail: { ...HILDUR, unreadMessagesUnknownKey: 2, castsUnplaced: 1 },
        metric: "healthGiven",
        doesOpen: false,
        isRowNarrower: false,
        translate: null,
    });
    const notes = card.groups.at(-1);
    assertExists(notes, "the suspicions are the last thing the card says");
    const said = readGroup(notes).filter((line) => line.startsWith(SUSPECT_MARK));
    assertEquals(said.length, 2, "this person's own, and nothing that names anybody else");
    assert(said[0]?.includes("z jej udziałem"), "what went unread with them in comes first");
    assert(said[1]?.includes("jej leczenia"), "then the cast of theirs nobody could place");
});

Deno.test("a card on a damage screen says nothing about a cast, which puts back health", () => {
    const card = composeCardReading({
        name: "Hildur Muza Śmierci",
        profession: "m",
        sidePart: "nobody" as const,
        detail: { ...HILDUR, castsUnplaced: 1 },
        metric: "damageDealtApplied",
        doesOpen: false,
        isRowNarrower: false,
        translate: null,
    });
    const said = card.groups.flatMap((group) => readGroup(group)).filter((line) =>
        line.startsWith(SUSPECT_MARK)
    );
    assertEquals(said, [], "a suspicion over a figure that cannot carry it is not drawn");
});

/**
 * The screen picks which of the four figures is bold and nothing else. A reader on _leczenie dane_
 * gets the same two runs as one on _obrażenia zadane_, so "he heals a lot, but how does he fight"
 * needs no strip. **ADR 0032.**
 */
Deno.test("both runs stand on every screen, and the screen moves only the bold figure", () => {
    const readScreen = (metric: PanelMetric) =>
        composeCardReading({
            name: "Hildur Muza Śmierci",
            profession: "p",
            sidePart: "nobody" as const,
            detail: HILDUR,
            metric,
            doesOpen: false,
            isRowNarrower: false,
            translate: null,
        }).groups.map(readGroup);
    const [first, ...rest] = SCREEN_ORDER.map(readScreen);
    assertExists(first, "there is a screen to read the card on");
    // Said of one screen before the four are compared: four cards agreeing with each other agree
    // just as well when a run has been dropped from all of them.
    assertEquals(
        first.flat().filter((line) => line.startsWith("[")),
        [`[${CARD_WORDS.striking}]`, `[${CARD_WORDS.destroyed}]`, `[${CARD_WORDS.struck}]`],
        "somebody who struck and was struck carries both runs, whichever screen they are read on",
    );
    const withoutBold = (groups: string[][]) =>
        groups.map((group) => group.map((line) => line.replaceAll("*", "")));
    for (const [at, groups] of rest.entries()) {
        assertEquals(
            withoutBold(groups),
            withoutBold(first),
            `${SCREEN_ORDER[at + 1]} says what the first screen says, bar which figure is bold`,
        );
    }
    const bold = SCREEN_ORDER.map((metric) =>
        readScreen(metric)[0]?.filter((line) => line.startsWith("**"))
    );
    assertEquals(
        bold,
        [
            ["**Zadane** 354\u00a0258"],
            ["**Otrzymane** 141\u00a0710"],
            ["**Leczenie dane** 0"],
            ["**Leczenie otrzymane** 16\u00a0273"],
        ],
        "and each screen puts its own figure in bold, one of them and never two",
    );
    // The crit keys are counted in the line above and never again beside it: `+crit` is the count
    // itself and `+of_crit` the part of it that was the offhand's.
    const striking = first[2] ?? [];
    assert(!striking.some((line) => line.includes("krytyk")), "the crit keys are not said twice");
});

/** A run of nothing is no run: an empty heading would promise a figure the protocol never gave. */
Deno.test("a run that came to nothing is not drawn, and neither is its heading", () => {
    const readHeadings = (detail: RowDetail) =>
        composeCardReading({
            name: "Gracz 9",
            profession: null,
            sidePart: "nobody" as const,
            detail,
            metric: "damageDealtApplied",
            doesOpen: false,
            isRowNarrower: false,
            translate: null,
        }).groups.flatMap(readGroup).filter((line) => line.startsWith("["));
    assertEquals(readHeadings(NOBODY), [], "somebody the fight never touched has neither run");
    assertEquals(
        readHeadings({ ...NOBODY, blowsStruck: 4, damageDealtBlowLargest: 9 }),
        [`[${CARD_WORDS.striking}]`],
        "somebody who only ever struck has the one heading",
    );
    assertEquals(
        readHeadings({ ...NOBODY, damageTakenBlowLargest: 9 }),
        [`[${CARD_WORDS.struck}]`],
        "and somebody who was only ever struck has the other",
    );
    assertEquals(
        readHeadings(HILDUR),
        [`[${CARD_WORDS.striking}]`, `[${CARD_WORDS.destroyed}]`, `[${CARD_WORDS.struck}]`],
        "somebody who did both has both, and what a blow destroyed sits inside the first",
    );
});

/**
 * The card is about the person and its figures are the fight's, so where it stands over a row
 * stating a narrower one it says which it means. On the ranking the two are the same number.
 */
Deno.test("a card over a narrower row says its figures are the whole fight's", () => {
    const notesOf = (isRowNarrower: boolean) =>
        composeCardReading({
            name: "Gracz 9",
            profession: null,
            sidePart: "nobody" as const,
            detail: { ...NOBODY, unreadMessagesUnknownKey: 1 },
            metric: "damageDealtApplied",
            doesOpen: true,
            isRowNarrower,
            translate: null,
        }).groups.flatMap(readGroup);
    assertEquals(
        notesOf(true),
        [
            "**Zadane** 0",
            "Otrzymane 0",
            "Leczenie dane 0",
            "Leczenie otrzymane 0",
            `${SUSPECT_MARK}${composeUnknownKeyRowSuspicion(1)}`,
            CARD_WORDS.scope,
            CARD_WORDS.gesture,
        ],
        "after the suspicions, because it answers for every figure, and before the instruction",
    );
    assert(
        !notesOf(false).includes(CARD_WORDS.scope),
        "and on the ranking it is a sentence answering nobody's question",
    );
});

Deno.test("a rate is taken of blows, and a rate of no blows is no rate at all", () => {
    const critical = (blowsCritical: number, blowsStruck: number) =>
        composeCardReading({
            name: "Gracz 9",
            profession: null,
            sidePart: "nobody" as const,
            detail: { ...NOBODY, blowsCritical, blowsStruck },
            metric: "damageDealtApplied",
            doesOpen: false,
            isRowNarrower: false,
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
    // More criticals than blows cannot be, and the card used to stop rather than draw. A share
    // above the hundred is a number that is wrong looking like one that is right — **E14**.
    assertEquals(
        critical(41, 40),
        [`${CARD_WORDS.blowsCritical} 41`],
        "and more of them than there were blows states the count and takes no share of it",
    );
});

/**
 * A card with nobody behind it. The name used to be asserted, so a row the roster could not place
 * cost the card rather than standing with a word for it — **E14**.
 */
Deno.test("a card nobody is named on says so, rather than standing on a blank", () => {
    const card = composeCardReading({
        name: "",
        profession: null,
        sidePart: "nobody" as const,
        detail: NOBODY,
        metric: "damageDealtApplied",
        doesOpen: false,
        isRowNarrower: false,
        translate: null,
    });
    assertEquals(card.name, PANEL_WORDS.unknown, "in the word the panel already has for it");
});

Deno.test("two keys the panel words the same way are one line, not two of one word", () => {
    // Five stun keys carry one word because they are one event from five sources. Drawn a key at a
    // time they made two lines reading `ogłuszenie` against different counts, and nothing on the
    // card says which stun either line is.
    const card = composeCardReading({
        name: "Amaimon Soploręki",
        profession: "p",
        sidePart: "nobody" as const,
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
        doesOpen: false,
        isRowNarrower: false,
        translate: null,
    });
    const [, counters, striking] = card.groups;
    assertExists(counters, "they struck, so the counters stand");
    assertExists(striking, "and the run about striking says what fired");
    assertEquals(
        readGroup(striking),
        [`[${CARD_WORDS.striking}]`, "ogłuszenie 6", "zamrożenie 2"],
        "one line per word, biggest first, and the stuns summed rather than listed apart",
    );
});

/**
 * The turn count stands on its own line and is divided into nothing (**ADR 0048**). Zero is a
 * boundary and so is one (**W5**): a combatant who took no turn has no line rather than a line
 * reading nothing, because a fight nobody acted in is not a fight of zero-turn combatants.
 */
Deno.test("the card says how many turns a combatant took, and only where they took one", () => {
    const subject = {
        name: "Hildur Muza Śmierci",
        profession: "p",
        sidePart: "nobody" as const,
        metric: "damageDealtApplied" as const,
        doesOpen: true,
        isRowNarrower: false,
        translate: null,
    };
    const stated = composeCardReading({ ...subject, detail: HILDUR }).groups
        .flatMap((group) => group.lines)
        .filter((line) => line.kind === "stat")
        .filter((line) => line.label === CARD_WORDS.turns)
        .map((line) => (line.kind === "stat" ? line.stated : ""));
    assertEquals(stated, ["37"], "the count, on one line of its own");
    const none = composeCardReading({ ...subject, detail: NOBODY }).groups
        .flatMap((group) => group.lines)
        .filter((line) => line.kind === "stat" && line.label === CARD_WORDS.turns);
    assertEquals(none, [], "and nothing at all where no turn was taken");
    const one = composeCardReading({ ...subject, detail: { ...NOBODY, turnsTaken: 1 } }).groups
        .flatMap((group) => group.lines)
        .filter((line) => line.kind === "stat" && line.label === CARD_WORDS.turns);
    assertEquals(one.length, 1, "one turn is a line");
    // And the turns nobody lost say nothing at all, rather than saying they were none: the
    // sub-line stands under a combatant who took turns, so its zero has to be checked there.
    const unlost = composeCardReading({ ...subject, detail: { ...NOBODY, turnsTaken: 1 } }).groups
        .flatMap((group) => group.lines)
        .filter((line) => line.kind === "sub" && line.label === CARD_WORDS.turnsLost);
    assertEquals(unlost, [], "a combatant who lost no turn has no line saying so");
});
