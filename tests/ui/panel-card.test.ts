/**
 * What a person's row says on demand.
 *
 * Every figure here is one the statistics already hold: the card's whole job is to say what the
 * row it stands over had to leave out, so a test that let it compute one would be checking the
 * wrong thing.
 */

import { assert, assertArrayIncludes, assertEquals, assertExists } from "@std/assert";
import { presentCard } from "#/src/ui/panel-card.ts";
import { type PanelSidePart, type RowDetail, SIDE_PART } from "#/src/ui/panel-reading.ts";
import { PANEL_METRIC, type PanelMetric, SCREEN_ORDER } from "#/src/ui/panel-screen.ts";
import { TIP_LINE, TIP_NOTE_TONE, type TipGroup } from "#/src/ui/tip-reading.ts";
import {
    CARD_WORDS,
    CAVEAT,
    CAVEAT_MARK,
    formatUnknownKeyRowSuspicion,
    getNoteForCaveat,
    PANEL_WORDS,
    SUSPECT_MARK,
} from "#/src/ui/panel-words.ts";

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
    wasTurnLostRead: true,
    damageDealtToNobody: 2104,
    damageTakenFromNobody: 10672,
    healthRestoredByNobody: 1500,
    blowsCritical: 9,
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
    // The fight heard a lost turn on somebody, so a nought here is a measurement. The other
    // side of that is its own case below.
    wasTurnLostRead: true,
    damageDealtToNobody: 0,
    damageTakenFromNobody: 0,
    healthRestoredByNobody: 0,
    blowsCritical: 0,
    procsWhenStriking: [],
    procsWhenStruck: [],
    /** Defences and destroyed statistics are kept under the client's token, procs under the key. */
    damagePreventedByDefence: [],
    statisticsDestroyed: [],
    unreadMessagesUnknownKey: 0,
    unreadMessagesNoParameter: 0,
    castsUnplaced: 0,
};

/**
 * The mark as a reader meets it in a line, in this reader's own spelling. The panel draws a ring
 * around the letter rather than spelling a glyph (`develop ADR 0092`), so there is no one string to
 * read back off the module — and `i` alone would match any Polish sentence opening with that word.
 */
const CAVEATED = `(${CAVEAT_MARK})`;

/** The sentence a figure of the reduction owes, mark and all, as the card composes it. */
const REDUCTION_NOTE = `${CAVEATED} ${getNoteForCaveat(CAVEAT.reduction)}`;

/** And the one a count of turns owes. */
const TURNS_NOTE = `${CAVEATED} ${getNoteForCaveat(CAVEAT.turns)}`;

Deno.test("the whole fight is a block of its own, and the screen's figure is in bold", () => {
    const card = presentCard({
        name: "Hildur Muza Śmierci",
        profession: "p",
        sidePart: SIDE_PART.nobody,
        detail: HILDUR,
        metric: PANEL_METRIC.damageTakenApplied,
        doesOpen: true,
        isRowNarrower: false,
        translate: null,
    });
    assertEquals(card.name, "Hildur Muza Śmierci", "the name in full");
    assertEquals(card.subtitle, "Paladyn (83)", "what they are and how far along, under it");
    const [figures, counters, , , notes] = card.groups;
    assertExists(figures, "a card states the figures the whole fight is summed over");
    assertEquals(
        readGroup(figures),
        [
            `[${CARD_WORDS.wholeFight}]`,
            "Zadane 354\u00a0258",
            `  ${PANEL_WORDS.withoutTarget} 2\u00a0104`,
            "**Otrzymane** 141\u00a0710",
            `  ${PANEL_WORDS.withoutActor} 10\u00a0672`,
            "Leczenie otrzymane 16\u00a0273",
            `  ${PANEL_WORDS.withoutActor} 1\u00a0500`,
        ],
        "under the heading naming their scope, each with the end the protocol left out under it",
    );
    assertEquals(
        readGroup(figures).filter((line) => line.startsWith("Leczenie dane")),
        [],
        "and healing they gave nobody is no line: it is nought, and nought was not what was asked",
    );
    assertExists(counters, "and how they fought, under a rule of its own");
    assertEquals(
        readGroup(counters),
        [
            `${CARD_WORDS.turnsWithLost} ${CAVEATED} 37\u00a0/\u00a04`,
            `${CARD_WORDS.blows} 40`,
            `  ${CARD_WORDS.blowsWithoutSkill} 7`,
            `${CARD_WORDS.skillUses} 30`,
        ],
        "the turns with the ones lost beside them, the blows, the ones behind no skill, and the " +
            "announcements",
    );
    assertExists(notes, "and what to be careful of");
    assertEquals(
        readGroup(notes),
        [REDUCTION_NOTE, TURNS_NOTE, CARD_WORDS.gesture],
        "each figure whose label names more than it counts is owed its own sentence, in order",
    );
});

/**
 * One group as a reader meets it, so an expectation reads like the window does — **the glyph
 * included**. Left out of this reader, a figure that lost its mark would read the same as one that
 * never had it, and every frozen list below would stay green through the loss.
 */
function readGroup(group: TipGroup): string[] {
    return group.lines.map((line) => {
        // The mark a sentence wears is read off its tone, which is where the panel reads it too.
        if (line.kind === TIP_LINE.note) {
            return line.tone === TIP_NOTE_TONE.caveat ? `${CAVEATED} ${line.text}` : line.text;
        }
        if (line.kind === TIP_LINE.heading) return `[${line.text}]`;
        if (line.kind === TIP_LINE.sub) return `  ${line.label} ${line.stated}`;
        const said = line.caveat === null ? line.label : `${line.label} ${CAVEATED}`;
        return line.isStrong ? `**${said}** ${line.stated}` : `${said} ${line.stated}`;
    });
}

/**
 * **A figure before reduction stands in the run of its own end, and under no figure at all.** The
 * protocol states one on a blow and nowhere else, while an applied figure grows from blows, from
 * damage named against somebody and from health moving outside one — so drawn under the applied
 * figure it read as a part of it and was **smaller** than the number it hung beneath on 296 of the
 * 1,184 cards over `captures/`, and on 172 of those smaller than one and larger than the
 * other on the same card, measured 2026-09-14. In the run there is no figure above it to be read as
 * a part of. `develop ADR 0087`.
 */
Deno.test("a figure before reduction stands in its own run, under no figure", () => {
    const card = presentCard({
        name: "Hildur Muza Śmierci",
        profession: "p",
        sidePart: SIDE_PART.nobody,
        detail: HILDUR,
        metric: PANEL_METRIC.damageTakenApplied,
        doesOpen: false,
        isRowNarrower: false,
        translate: null,
    });
    const [figures, , striking, struck] = card.groups;
    assertExists(figures, "the card opens on the figures of the whole fight");
    assertEquals(
        readGroup(figures).filter((line) => line.includes(CARD_WORDS.raw)),
        [],
        "and none of them carries a figure before reduction under it",
    );
    assertExists(striking, "the run about striking stands");
    assertArrayIncludes(
        readGroup(striking),
        [`${CARD_WORDS.raw} ${CAVEATED} 410\u00a0002`],
        "which is where what they put out before reduction is stated, as a line and not a part",
    );
    assertExists(struck, "and the run about being struck");
    assertArrayIncludes(
        readGroup(struck),
        [`${CARD_WORDS.raw} ${CAVEATED} 160\u00a0998`],
        "with what reached them before reduction in it",
    );
    assertArrayIncludes(
        card.groups.flatMap(readGroup),
        [REDUCTION_NOTE],
        "and the sentence saying not to subtract one from the other is still owed",
    );
    // Raw is gone and what a defence stopped is not, and that figure is one component of the
    // reduction too (`CONTEXT.md`) — so the sentence is still owed by the other figure.
    const stopped = readCardOf({ ...HILDUR, damageDealtRaw: 0, damageTakenRaw: 0 });
    assertEquals(
        stopped.filter((line) => line.includes(CARD_WORDS.raw)),
        [],
        "a card with no raw figure on it draws no raw line",
    );
    assertArrayIncludes(
        stopped,
        [REDUCTION_NOTE],
        "and what a defence stopped is owed the same sentence on its own",
    );
    // The sample that must not carry it: neither figure of the pair stands, so neither is said.
    const without = readCardOf({
        ...HILDUR,
        damageDealtRaw: 0,
        damageTakenRaw: 0,
        damagePrevented: 0,
        damagePreventedByDefence: [],
    });
    assert(!without.includes(REDUCTION_NOTE), "and a card with neither owes no sentence about one");
});

/** One card, flattened, for a test that asks what a card as a whole does and does not say. */
function readCardOf(detail: RowDetail): string[] {
    return presentCard({
        name: "Gracz 9",
        profession: null,
        sidePart: SIDE_PART.nobody,
        detail,
        metric: PANEL_METRIC.damageTakenApplied,
        doesOpen: false,
        isRowNarrower: false,
        translate: null,
    }).groups.flatMap(readGroup);
}

/**
 * The fifth claim `CONTEXT.md` names, and it is not the suspect mark: a caveated figure is
 * complete and answers a narrower question than its label, whatever was recorded.
 * `develop ADR 0088`.
 */
Deno.test("a figure naming more than it counts wears a mark, and the mark has a sentence", () => {
    const said = readCardOf(HILDUR);
    assertEquals(
        said.filter((line) => line === REDUCTION_NOTE).length,
        1,
        "three figures of the reduction stand on this card and the sentence is said once",
    );
    assertArrayIncludes(said, [TURNS_NOTE], "and a count of turns says its own");
    // The sample that must NOT carry it, so the reader is known to be looking: the four figures of
    // the whole fight count exactly what they name, so none of them wears the mark.
    const whole = said.filter((line) => line.includes("Otrzymane"));
    assertEquals(
        whole.filter((line) => line.includes(CAVEATED)),
        [],
        "a figure the protocol states outright claims nothing beyond itself",
    );
    const untouched = readCardOf({ ...HILDUR, turnsTaken: 0, turnsLost: 0 });
    assert(
        !untouched.includes(TURNS_NOTE),
        "and a card with no turn count owes no sentence on one",
    );
});

/**
 * Two claims, and a reader meets both on one card: a figure that answers a narrower question than
 * its label, and a figure that may be short because a message went unread. Collapsing them is
 * `CONTEXT.md`'s own failure case — the permanent reads as temporary and the temporary as
 * permanent — so the test is over the composed card and not over the two constants, which the
 * compiler already tells apart (**A12**).
 */
Deno.test("a caveat and a suspicion stand on one card, each under its own mark", () => {
    const said = readCardOf({ ...HILDUR, unreadMessagesUnknownKey: 2 });
    const marked = said.filter((line) =>
        line.startsWith(CAVEATED) || line.startsWith(SUSPECT_MARK)
    );
    assertEquals(
        marked.filter((line) => line.startsWith(CAVEATED)).length,
        2,
        "the two sentences a caveated figure owes stand under the caveat's mark",
    );
    assertEquals(
        marked.filter((line) => line.startsWith(SUSPECT_MARK)).length,
        1,
        "and the one a message nobody could read owes stands under the other",
    );
    assertEquals(marked.length, 3, "and no sentence wears both marks or neither");
});

/**
 * Which end a key belongs to is read per key from `docs/protocol-keys.md` and never off the
 * sign: `+legbon_curse` fires when its holder attacks and `-legbon_cleanse` when its holder is
 * struck, on messages of one shape. The heading is what says whose each line is.
 * `develop ADR 0032`.
 */
Deno.test("the card says what they did when they struck, and what held when they were", () => {
    const card = presentCard({
        name: "Hildur Muza Śmierci",
        profession: "p",
        sidePart: SIDE_PART.nobody,
        detail: HILDUR,
        metric: PANEL_METRIC.damageTakenApplied,
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
            `${CARD_WORDS.raw} ${CAVEATED} 410\u00a0002`,
            `${CARD_WORDS.blowsCritical} 9 (23%)`,
            `  ${CARD_WORDS.blowsCriticalOffhand} ×2`,
            "przebicie ×4",
            `[${CARD_WORDS.destroyed}]`,
            "  pancerz 940 pkt",
            "  odporność 26 p.p.",
        ],
        "what was stated before reduction, the criticals, what else fired and what it took off",
    );
    assertExists(struck, "and what happened when somebody struck them, under the other");
    assertEquals(
        readGroup(struck),
        [
            `[${CARD_WORDS.struck}]`,
            `${CARD_WORDS.raw} ${CAVEATED} 160\u00a0998`,
            `${CARD_WORDS.prevented} ${CAVEATED} 10\u00a0413`,
            "  absorpcja 8\u00a0000",
            "  blok 2\u00a0413",
            "unik ×3",
            "-legbon_cleanse ×1",
        ],
        "what was stated before reduction, what stopped part of a blow, and what fired on one",
    );
});

Deno.test("what somebody is stands beside how far along they are, or whichever was said", () => {
    const subtitleOf = (
        profession: string | null,
        level: number | null,
        sidePart: PanelSidePart = SIDE_PART.nobody,
    ) => presentCard({
        name: "Gracz 9",
        profession,
        sidePart,
        detail: { ...NOBODY, level },
        metric: PANEL_METRIC.damageDealtApplied,
        doesOpen: false,
        isRowNarrower: false,
        translate: null,
    }).subtitle;
    assertEquals(subtitleOf("b", 41), "Tancerz ostrzy (41)", "both, in one line and in that order");
    assertEquals(subtitleOf("b", null), "Tancerz ostrzy", "a profession with no level beside it");
    assertEquals(subtitleOf(null, 41), "(41)", "and a level with nothing to say what they are");
    assertEquals(subtitleOf(null, null), null, "neither is no line at all");
    // The word the row's rule is drawn against: colour never carries a meaning alone, and this is
    // the label it carries (`develop ADR 0065`). A fight with no seat to read from says none of it.
    assertEquals(
        subtitleOf("b", 41, SIDE_PART.reader),
        "Tancerz ostrzy (41) · My",
        "and whose side they stand on, last, because it is the panel's answer and not the game's",
    );
    assertEquals(
        subtitleOf("b", 41, SIDE_PART.opposing),
        "Tancerz ostrzy (41) · Oni",
        "either way round",
    );
    assertEquals(
        subtitleOf(null, null, SIDE_PART.reader),
        "My",
        "the side alone where nothing else was said",
    );
    assertEquals(
        subtitleOf(null, null, SIDE_PART.nobody),
        null,
        "and nothing at all where none was",
    );
    // A letter the table does not hold reaches the reader as the game wrote it, rather than as an
    // invented name or as nothing: the panel colours the six the recordings state, and a seventh
    // would arrive from the game and not from here.
    assertEquals(subtitleOf("z", 41), "z (41)", "a profession nobody has worded is passed through");
});

/**
 * The whole path: a key this repository has no word for, through the card, to what a reader sees.
 * `captures/` carries all six — `-tenacity` on 20 blows, 2026-08-30 — so today every one of
 * them stands in a card as raw protocol. `develop ADR 0024`.
 */
Deno.test("a key nothing here words is drawn as the player's own client names it", () => {
    const struck = {
        ...NOBODY,
        damageDealtApplied: 100,
        blowsStruck: 1,
        procsWhenStriking: [{ key: "-tenacity", figure: 1 }],
    };
    const cardWith = (translate: ((id: string) => string | null) | null) =>
        presentCard({
            name: "Gracz 9",
            profession: null,
            sidePart: SIDE_PART.nobody,
            detail: struck,
            metric: PANEL_METRIC.damageDealtApplied,
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

/**
 * **Zero is an answer, and only to the question that was asked.** A screen showing somebody at
 * nothing has to say nothing — that is what the reader pointed at — while the other three at nought
 * answer nobody and cost three lines. Drawn unconditionally the four printed 580 figures of nought
 * over `captures/` on 2026-09-14, 0.49 to a card; the screen's own alone leaves 145.
 * `develop ADR 0087`.
 */
Deno.test("a combatant the fight never touched states the figure that was asked, at nought", () => {
    const at = (metric: PanelMetric) =>
        presentCard({
            name: "Gracz 9",
            profession: null,
            sidePart: SIDE_PART.nobody,
            detail: NOBODY,
            metric,
            doesOpen: false,
            isRowNarrower: false,
            translate: null,
        });
    const card = at(PANEL_METRIC.damageDealtApplied);
    assertEquals(card.subtitle, null, "and a line drawn for neither is a question, not an answer");
    assertEquals(card.groups.length, 1, "and nothing they did is nothing to put under a rule");
    const [figures] = card.groups;
    assertExists(figures, "the one asked for still stands: zero happened, and is not unknown");
    assertEquals(
        readGroup(figures),
        [`[${CARD_WORDS.wholeFight}]`, "**Zadane** 0"],
        "and no part under it, because there is no part of nothing",
    );
    // The sample that must move: the same combatant on another screen answers that screen.
    assertEquals(
        readGroup(at(PANEL_METRIC.healthRestored).groups[0] ?? { lines: [] }),
        [`[${CARD_WORDS.wholeFight}]`, "**Leczenie otrzymane** 0"],
        "the figure standing at nought is the screen's own, and never a fixed one of the four",
    );
});

Deno.test("a part of a figure is drawn from the first point of it, and never below one", () => {
    const at = (figure: number) =>
        readGroup(
            presentCard({
                name: "Gracz 9",
                profession: null,
                sidePart: SIDE_PART.nobody,
                detail: { ...NOBODY, damageDealtApplied: figure, damageDealtToNobody: figure },
                metric: PANEL_METRIC.damageDealtApplied,
                doesOpen: false,
                isRowNarrower: false,
                translate: null,
            }).groups[0] ?? { lines: [] },
        );
    const named = (figure: number) =>
        at(figure).filter((line) => line.includes(PANEL_WORDS.withoutTarget));
    assertEquals(named(0), [], "nothing named nobody is nothing to say");
    assertEquals(named(1), [`  ${PANEL_WORDS.withoutTarget} 1`], "and one point of it is said");
});

/**
 * A gap naming nobody stays under the list, where it qualifies every row at once. A card repeating
 * it wrote one sentence once per row, and wrote it twice on the row that was the reason for it.
 * `develop ADR 0069`.
 */
Deno.test("a card says the gaps that name its own person, and no others", () => {
    const readNotes = (detail: RowDetail) => {
        const card = presentCard({
            name: "Hildur Muza Śmierci",
            profession: "m",
            sidePart: SIDE_PART.nobody,
            detail,
            metric: PANEL_METRIC.healthRestored,
            doesOpen: false,
            isRowNarrower: false,
            translate: null,
        });
        return card.groups.flatMap((group) => group.lines);
    };
    const clean = readNotes(NOBODY);
    assertEquals(
        clean.filter((line) => line.kind === TIP_LINE.note && line.tone === TIP_NOTE_TONE.suspect),
        [],
        "a person no gap names carries none, whatever the fight is short of",
    );
    const charged = readNotes({ ...NOBODY, unreadMessagesUnknownKey: 2 })
        .filter((line) => line.kind === TIP_LINE.note && line.tone === TIP_NOTE_TONE.suspect);
    assertEquals(charged.length, 1, "and the person a gap does name carries that one");
    assert(
        charged[0]?.kind === TIP_LINE.note && charged[0].text.startsWith(SUSPECT_MARK),
        "drawn as a suspicion, which is a mark as well as a colour",
    );
});

/**
 * The mark on a row is what a reader followed here, so the sentence explaining it stands over the
 * fight's own: this card is about the person, and the fight's suspicion is about every row at once.
 */
Deno.test("a card states both of the gaps that can name one person, widest first", () => {
    const card = presentCard({
        name: "Hildur Muza Śmierci",
        profession: "m",
        sidePart: SIDE_PART.nobody,
        detail: { ...HILDUR, unreadMessagesUnknownKey: 2, castsUnplaced: 1 },
        metric: PANEL_METRIC.healthGiven,
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
    const card = presentCard({
        name: "Hildur Muza Śmierci",
        profession: "m",
        sidePart: SIDE_PART.nobody,
        detail: { ...HILDUR, castsUnplaced: 1 },
        metric: PANEL_METRIC.damageDealtApplied,
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
 * needs no strip. `develop ADR 0032`.
 */
Deno.test("both runs stand on every screen, and the screen moves only the bold figure", () => {
    const readScreen = (metric: PanelMetric) =>
        presentCard({
            name: "Hildur Muza Śmierci",
            profession: "p",
            sidePart: SIDE_PART.nobody,
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
        [
            `[${CARD_WORDS.wholeFight}]`,
            `[${CARD_WORDS.striking}]`,
            `[${CARD_WORDS.destroyed}]`,
            `[${CARD_WORDS.struck}]`,
        ],
        "somebody who struck and was struck carries both runs, whichever screen they are read on",
    );
    // **Everything below the first block is the same card on all four.** That is what
    // `develop ADR 0032` holds and this change does not touch it: the runs still do not turn on the
    // screen. What the screen now decides, beside the bold, is which figure of nought is still
    // worth a line — so the first block is compared on its own, below.
    for (const [at, groups] of rest.entries()) {
        assertEquals(
            groups.slice(1),
            first.slice(1),
            `${SCREEN_ORDER[at + 1]} says what the first screen says below the fight's own figures`,
        );
    }
    const noughtsOf = (metric: PanelMetric) =>
        (readScreen(metric)[0] ?? []).filter((line) => line.endsWith(" 0"));
    assertEquals(
        SCREEN_ORDER.map(noughtsOf),
        [[], [], ["**Leczenie dane** 0"], []],
        "and the one figure of nought they have stands on its own screen and on no other",
    );
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
        presentCard({
            name: "Gracz 9",
            profession: null,
            sidePart: SIDE_PART.nobody,
            detail,
            metric: PANEL_METRIC.damageDealtApplied,
            doesOpen: false,
            isRowNarrower: false,
            translate: null,
        }).groups.flatMap(readGroup).filter((line) => line.startsWith("["));
    assertEquals(
        readHeadings(NOBODY),
        [`[${CARD_WORDS.wholeFight}]`],
        "somebody the fight never touched has neither run, and only the block that answers them",
    );
    assertEquals(
        readHeadings({ ...NOBODY, damageDealtRaw: 9 }),
        [`[${CARD_WORDS.wholeFight}]`, `[${CARD_WORDS.striking}]`],
        "somebody who only ever struck has the one heading",
    );
    assertEquals(
        readHeadings({ ...NOBODY, damageTakenRaw: 9 }),
        [`[${CARD_WORDS.wholeFight}]`, `[${CARD_WORDS.struck}]`],
        "and somebody who was only ever struck has the other",
    );
    assertEquals(
        readHeadings(HILDUR),
        [
            `[${CARD_WORDS.wholeFight}]`,
            `[${CARD_WORDS.striking}]`,
            `[${CARD_WORDS.destroyed}]`,
            `[${CARD_WORDS.struck}]`,
        ],
        "somebody who did both has both, and what a blow destroyed sits inside the first",
    );
});

/**
 * The card is about the person and its figures are the fight's, so where it stands over a row
 * stating a narrower one it says which it means. On the ranking the two are the same number.
 */
Deno.test("a card over a narrower row says its figures are the whole fight's", () => {
    const notesOf = (isRowNarrower: boolean) =>
        presentCard({
            name: "Gracz 9",
            profession: null,
            sidePart: SIDE_PART.nobody,
            detail: { ...NOBODY, unreadMessagesUnknownKey: 1 },
            metric: PANEL_METRIC.damageDealtApplied,
            doesOpen: true,
            isRowNarrower,
            translate: null,
        }).groups.flatMap(readGroup);
    assertEquals(
        notesOf(true),
        [
            `[${CARD_WORDS.wholeFight}]`,
            "**Zadane** 0",
            `${SUSPECT_MARK}${formatUnknownKeyRowSuspicion(1)}`,
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
        presentCard({
            name: "Gracz 9",
            profession: null,
            sidePart: SIDE_PART.nobody,
            detail: { ...NOBODY, blowsCritical, blowsStruck },
            metric: PANEL_METRIC.damageDealtApplied,
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
    // More criticals than blows cannot be, and the card draws rather than stopping. A share
    // above the hundred is a number that is wrong looking like one that is right — **E12**.
    assertEquals(
        critical(41, 40),
        [`${CARD_WORDS.blowsCritical} ×41`],
        "and more of them than there were blows states the count and takes no share of it",
    );
});

/**
 * A card with nobody behind it. The name is not asserted: a row the roster cannot place stands
 * with a word for it rather than costing the card — **E12**.
 */
Deno.test("a card nobody is named on says so, rather than standing on a blank", () => {
    const card = presentCard({
        name: "",
        profession: null,
        sidePart: SIDE_PART.nobody,
        detail: NOBODY,
        metric: PANEL_METRIC.damageDealtApplied,
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
    const card = presentCard({
        name: "Amaimon Soploręki",
        profession: "p",
        sidePart: SIDE_PART.nobody,
        detail: {
            ...NOBODY,
            blowsStruck: 20,
            procsWhenStriking: [
                { key: "+stun", figure: 5 },
                { key: "+stun2-c", figure: 1 },
                { key: "+freeze", figure: 2 },
            ],
        },
        metric: PANEL_METRIC.damageDealtApplied,
        doesOpen: false,
        isRowNarrower: false,
        translate: null,
    });
    const [, counters, striking] = card.groups;
    assertExists(counters, "they struck, so the counters stand");
    assertExists(striking, "and the run about striking says what fired");
    assertEquals(
        readGroup(striking),
        [`[${CARD_WORDS.striking}]`, "ogłuszenie ×6", "zamrożenie ×2"],
        "one line per word, biggest first, and the stuns summed rather than listed apart",
    );
});

/**
 * A wound something weakened is a wound, and it is counted in the wound's own row
 * (`develop ADR 0095`). A row of its own answers a question nobody asks, and leaves the one a
 * reader does ask — how many wounds did they leave — on no line at all.
 */
Deno.test("every deep wound is counted in one row, and the weakened ones stand under it", () => {
    assertEquals(
        readStrikingProcs([
            { key: "+wound", figure: 2 },
            { key: "+of_wound", figure: 1 },
            { key: "+woundpoison", figure: 3 },
        ]),
        [`[${CARD_WORDS.striking}]`, "głęboka rana ×6", "  osłabiona ×3"],
        "the row counts all six, and the line under it says how many of them were weakened",
    );
});

/** The run about striking, on somebody whose blows carried these and nothing else. */
function readStrikingProcs(procs: readonly { key: string; figure: number }[]): string[] {
    const card = presentCard({
        name: "Amaimon Soploręki",
        profession: "p",
        sidePart: SIDE_PART.nobody,
        detail: { ...NOBODY, blowsStruck: 20, procsWhenStriking: [...procs] },
        metric: PANEL_METRIC.damageDealtApplied,
        doesOpen: false,
        isRowNarrower: false,
        translate: null,
    });
    const [, , striking] = card.groups;
    assertExists(striking, "they struck, so the run about striking stands");
    return readGroup(striking);
}

/**
 * Zero is a boundary (**W5**), and this is the zero: the sub-line is not drawn reading nothing,
 * because a row saying `×0` under it is a claim about a weakening that never happened.
 *
 * **It asserts an absence and nothing else on purpose.** Paired with the presence below it went
 * red on every mutation that stopped sub-lines being drawn at all — which is the one outcome this
 * test must call correct.
 */
Deno.test("a wound nothing weakened draws no sub-line", () => {
    assertEquals(
        readStrikingProcs([{ key: "+wound", figure: 2 }]),
        [`[${CARD_WORDS.striking}]`, "głęboka rana ×2"],
        "nothing weakened these, so there is nothing to say under the row",
    );
});

/** And one is a boundary beside it: one weakened out of two is a sub-line, not a rounding. */
Deno.test("one wound weakened out of two draws the sub-line all the same", () => {
    assertEquals(
        readStrikingProcs([{ key: "+wound", figure: 1 }, { key: "+woundpoison", figure: 1 }]),
        [`[${CARD_WORDS.striking}]`, "głęboka rana ×2", "  osłabiona ×1"],
        "two wounds, one of them weakened, and the line under the row says so",
    );
});

/**
 * The card the decision was made on. Combatant `28940` in
 * `captures/2026-09-11-luvia-grupa-vs-amaimon-Cl9U89Zr-0.15.0.json` announced six deep
 * wounds, every one of them weakened by poison, and until `develop ADR 0095` their card carried no
 * count of wounds at all — the row they could see was a part of one they could not.
 */
Deno.test("a combatant whose every wound was weakened still has a count of wounds", () => {
    assertEquals(
        readStrikingProcs([{ key: "+woundpoison", figure: 6 }]),
        [`[${CARD_WORDS.striking}]`, "głęboka rana ×6", "  osłabiona ×6"],
        "six wounds are six wounds, whatever weakened them",
    );
});

/**
 * A sub-line is read through the line above it (`DESIGN.md`), so it rides with that line.
 *
 * **A row stands on either side of the narrowed one**, because a wound row drawn last reads the
 * same whether its sub-line rides with it or is pushed after every row on the card: moving the
 * sub-lines to the end of the run lit nothing until a row stood below the one they narrow.
 */
Deno.test("a sub-line follows the row it narrows, whatever stands around that row", () => {
    assertEquals(
        readStrikingProcs([
            { key: "+stun", figure: 9 },
            { key: "+wound", figure: 1 },
            { key: "+woundpoison", figure: 2 },
            { key: "+freeze", figure: 2 },
        ]),
        [
            `[${CARD_WORDS.striking}]`,
            "ogłuszenie ×9",
            "głęboka rana ×3",
            "  osłabiona ×2",
            "zamrożenie ×2",
        ],
        "the rows are sorted by their own counts and the sub-line goes with the row it narrows",
    );
});

/**
 * The turn count stands on its own line and is divided into nothing (`develop ADR 0048`). Zero is a
 * boundary and so is one (**W5**): a combatant who took no turn has no line rather than a line
 * reading nothing, because a fight nobody acted in is not a fight of zero-turn combatants.
 *
 * ⚠️ **The turns lost ride that same line and their nought is drawn** (`develop ADR 0110`). The
 * line is there either way, so the nought costs the card nothing and says what it is — a turn
 * nobody took away — where a line that vanished said only that the panel had stopped mentioning it.
 */
Deno.test("the card says how many turns a combatant took, and only where they took one", () => {
    const subject = {
        name: "Hildur Muza Śmierci",
        profession: "p",
        sidePart: SIDE_PART.nobody,
        metric: PANEL_METRIC.damageDealtApplied,
        doesOpen: true,
        isRowNarrower: false,
        translate: null,
    };
    const readTurnLines = (detail: RowDetail): string[] =>
        presentCard({ ...subject, detail }).groups
            .flatMap((group) => group.lines)
            .filter((line) => line.kind === TIP_LINE.stat)
            .filter((line) => {
                if (line.label === CARD_WORDS.turns) return true;
                return line.label === CARD_WORDS.turnsWithLost;
            })
            .map((line) => (line.kind === TIP_LINE.stat ? `${line.label} ${line.stated}` : ""));
    assertEquals(
        readTurnLines(HILDUR),
        [`${CARD_WORDS.turnsWithLost} 37\u00a0/\u00a04`],
        "the count, on one line of its own, with the ones lost beside it",
    );
    assertEquals(readTurnLines(NOBODY), [], "and nothing at all where no turn was taken");
    assertEquals(
        readTurnLines({ ...NOBODY, turnsTaken: 1 }),
        [`${CARD_WORDS.turnsWithLost} 1\u00a0/\u00a00`],
        "one turn is a line, and a combatant who lost none is told it was none",
    );
    // ⚠️ **The other side of that nought, and the reason it is not one figure short.** Where the
    // fight heard no lost turn on anybody the reading may simply not work on this world, so the
    // line states the turns taken alone rather than a nought nobody measured (**E10**).
    assertEquals(
        readTurnLines({ ...NOBODY, turnsTaken: 1, wasTurnLostRead: false }),
        [`${CARD_WORDS.turns} 1`],
        "a fight that heard no lost turn at all states the turns taken and no second figure",
    );
    // Neither half is drawn as a sub-line any more, which is what develop ADR 0110 took from 0049.
    const under = presentCard({ ...subject, detail: HILDUR }).groups
        .flatMap((group) => group.lines)
        .filter((line) => line.kind === TIP_LINE.sub && line.stated === "4");
    assertEquals(under, [], "and nothing about turns hangs beneath the line saying them");
});
