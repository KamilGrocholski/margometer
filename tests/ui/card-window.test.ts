/**
 * The detail window on its own: what it says, what it refuses, how tall it says it stands, and
 * where it puts itself.
 *
 * The placement is checked as the declarations it writes rather than as pixels on a screen,
 * because the arithmetic that would have needed measuring is in the stylesheet and not here.
 */

import {
    assert,
    assertEquals,
    assertExists,
    assertNotStrictEquals,
    assertStrictEquals,
    assertStringIncludes,
} from "@std/assert";
import * as errors from "#/libs/errors.ts";
import {
    type CardContent,
    type CardNoteTone,
    composeCardLayout,
    createCardRegister,
    initCardHandle,
    renderCard,
    setCardHidden,
    setCardPosition,
    tallyCardLayoutSize,
    tallyCardSize,
} from "#/src/ui/panel-element.ts";
import {
    CLASS,
    getCardHeight,
    getCardHeightAvailable,
    getCardWidthForColumns,
    TYPE_TOKENS,
} from "#/src/ui/panel-look.ts";
import { TYPE_STEP } from "#/src/ui/panel-choice.ts";
import { CARD_WORDS } from "#/src/ui/panel-words.ts";
import {
    composeFakeDocument,
    type FakeElement,
    getElementsWithin,
    getTextsByClass,
} from "#/tests/fake-document.ts";

/** The step every count below is taken at. */
const STEP = TYPE_STEP.small;
const TOKENS = TYPE_TOKENS[STEP];
/** Wider than two columns at every step, so the width is never what decides a layout here. */
const WIDTH_ROOM = 4000;
/** Thirty-two characters, which is the one line a note is counted as holding. */
const ONE_LINE_NOTE = "Surowe to obrazenia przed red...";
/** And one past it, which is the first note that costs two. */
const TWO_LINE_NOTE = `${ONE_LINE_NOTE}.`;

const HILDUR: CardContent = {
    name: "Hildur Muza Śmierci",
    subtitle: "(83)",
    groups: [
        {
            lines: [
                { kind: "stat", label: "Zadane", stated: "354 258", isStrong: true, caveat: null },
                { kind: "sub", label: "surowe", stated: "410 002" },
                {
                    kind: "stat",
                    label: "Otrzymane",
                    stated: "141 710",
                    isStrong: false,
                    caveat: null,
                },
            ],
        },
        { lines: [{ kind: "note", text: ONE_LINE_NOTE, tone: "plain" }] },
    ],
};

/** A card of four runs and a note, which is the shape a short window has to answer. */
const LONG: CardContent = {
    name: "Hildur Muza Śmierci",
    subtitle: "(83)",
    groups: [
        {
            lines: [{
                kind: "stat",
                label: "Zadane",
                stated: "354 258",
                isStrong: true,
                caveat: null,
            }],
        },
        {
            lines: [{
                kind: "stat",
                label: "Ciosy",
                stated: "180",
                isStrong: false,
                caveat: null,
            }],
        },
        { lines: [{ kind: "heading", text: "W CIOSACH ZADANYCH" }] },
        { lines: [{ kind: "heading", text: "W CIOSACH PRZYJĘTYCH" }] },
        { lines: [{ kind: "note", text: ONE_LINE_NOTE, tone: "suspect" }] },
    ],
};

/**
 * ⚠️ **The floors are spelled here rather than imported, and that is deliberate.** A test reading
 * the constant it is checking would pass at any value of it, including the one that stands a card
 * off the bottom of the screen. The numbers are `src/ui/panel-element.ts`'s, measured in Chrome.
 */
const NAME_ON_ONE_LINE = 27;
const SUBTITLE_ON_ONE_LINE = 32;

Deno.test("a row is looked up by the name it stated, and by no other", () => {
    const register = createCardRegister();
    const compose = () => HILDUR;
    assertEquals(register.lookup("row:7"), null, "a row nobody drew has nothing to say");
    register.add("row:7", compose);
    assertEquals(register.lookup("row:7"), compose, "and one that was drawn says what it drew");
    assertEquals(register.lookup("row:8"), null, "which reaches no neighbour");
    // Two rows answering to one name must not stop the draw: the first stands and the second is
    // refused, so what a clash costs is a card on hover and never the panel — **E12**, develop ADR
    // 0051.
    const composeClashing = () => HILDUR;
    register.add("row:7", composeClashing);
    assertEquals(
        register.lookup("row:7"),
        compose,
        "and a second row of that name changes nothing",
    );
    register.add("", compose);
    assertEquals(register.lookup(""), null, "as does a row with no name to be looked up by");
    register.reset();
    assertEquals(register.lookup("row:7"), null, "a redraw starts with nothing said about any row");
});

Deno.test("the card draws a line for each of the three kinds, marked as the kind it is", () => {
    const document = composeFakeDocument();
    const card = renderCard(document, HILDUR) as FakeElement;
    assertEquals(getTextsByClass(card, CLASS.cardName), ["Hildur Muza Śmierci"], "the name, whole");
    assertEquals(getTextsByClass(card, CLASS.cardSubtitle), ["(83)"], "and who they are under it");
    assertEquals(
        getTextsByClass(card, CLASS.cardLabel),
        ["Zadane", "surowe", "Otrzymane"],
        "each figure under what it is",
    );
    assertEquals(
        getTextsByClass(card, CLASS.cardValue),
        ["354 258", "410 002", "141 710"],
        "in the spelling the row beside it uses",
    );
    assertEquals(getTextsByClass(card, CLASS.cardNote), [ONE_LINE_NOTE], "and the note, whole");
    const lines = getClassesByPrefix(card, CLASS.cardLine);
    assertEquals(
        lines,
        [
            `${CLASS.cardLine} ${CLASS.cardStrong}`,
            `${CLASS.cardLine} ${CLASS.cardSub}`,
            CLASS.cardLine,
        ],
        "the figure the screen shows is the one in bold, and the part of it is the one indented",
    );
    assertEquals(card.className, CLASS.card, "a card with something to say is not hidden");
});

/** Every line's own class, in the order the card drew them. */
function getClassesByPrefix(card: FakeElement, prefix: string): string[] {
    return getElementsWithin(card)
        .filter((descendant) => descendant.className.startsWith(prefix))
        .map((descendant) => descendant.className);
}

Deno.test("a row with nothing further to say draws a name, and nobody hovered draws none", () => {
    const document = composeFakeDocument();
    const bare = renderCard(document, {
        name: "Kolonia Mrówek",
        subtitle: null,
        groups: [],
    }) as FakeElement;
    assertEquals(getTextsByClass(bare, CLASS.cardName), ["Kolonia Mrówek"], "a name");
    assertEquals(getTextsByClass(bare, CLASS.cardValue), [], "and nothing under it");
    assertEquals(getTextsByClass(bare, CLASS.cardSubtitle), [], "not even an empty line for one");
    const nothing = renderCard(document, null) as FakeElement;
    assertEquals(
        nothing.className,
        `${CLASS.card} ${CLASS.cardHidden}`,
        "nobody hovered is hidden",
    );
    assertEquals(nothing.children.length, 0, "and says nothing at all");
});

Deno.test("a suspicion on the card wears the mark as well as the colour", () => {
    const document = composeFakeDocument();
    const card = renderCard(document, {
        ...HILDUR,
        groups: [{ lines: [{ kind: "note", text: ONE_LINE_NOTE, tone: "suspect" }] }],
    }) as FakeElement;
    assertEquals(
        getClassesByPrefix(card, CLASS.cardNote),
        [`${CLASS.cardNote} ${CLASS.cardSuspect}`],
        "a suspicion is a note before it is a suspicion, so the colour is never carrying it alone",
    );
});

Deno.test("how tall a card stands is counted, and a note as the lines it wraps to", () => {
    assertEquals(
        tallyCardSize(null, STEP),
        { lines: 1, groups: 0 },
        "a window nobody opened is one line",
    );
    assertEquals(
        tallyCardSize(HILDUR, STEP),
        { lines: 6, groups: 2 },
        "a name, who they are, three figures and a note that fits on one line",
    );
    assertEquals(
        tallyCardSize({ ...HILDUR, subtitle: null }, STEP),
        { lines: 5, groups: 2 },
        "and a card that could not say who they are is a line shorter",
    );
    const wrapped = {
        ...HILDUR,
        groups: [{
            lines: [{ kind: "note" as const, text: TWO_LINE_NOTE, tone: "plain" as const }],
        }],
    };
    assertEquals(
        tallyCardSize(wrapped, STEP),
        { lines: 4, groups: 1 },
        "one character past what a line holds costs the whole of the next one",
    );
    assertEquals(
        tallyCardSize({ ...wrapped, groups: [] }, STEP),
        { lines: 2, groups: 0 },
        "and a card with no run of lines spends nothing on the rules between them",
    );
});

/**
 * The name is the one cell on this panel that folds rather than shortening, so it is the one the
 * height arithmetic has to count. A count reserving one line for a name drawn on two puts the card
 * that much lower than it is tall, and the clamp in `composeCardTop` then hangs its last line off
 * the bottom of the screen — silently, because the box carries `overflow:hidden` and takes no
 * pointer.
 */
Deno.test("a name too long for one line is counted as the lines it folds to", () => {
    assertEquals(
        tallyCardSize(composeNamed(NAME_ON_ONE_LINE), STEP).lines,
        1,
        "what a line holds stands on one",
    );
    assertEquals(
        tallyCardSize(composeNamed(NAME_ON_ONE_LINE + 1), STEP).lines,
        2,
        "and one character past it costs the whole of the next line",
    );
    assertEquals(
        tallyCardSize(composeNamed(NAME_ON_ONE_LINE * 2 + 1), STEP).lines,
        3,
        "which goes on holding past the second line as well",
    );
    // Zero is a boundary, and a card with no name to draw still stands on the line it is drawn on.
    assertEquals(
        tallyCardSize(composeNamed(0), STEP).lines,
        1,
        "a name of nothing is still a line",
    );
    assertEquals(tallyCardSize(composeNamed(1), STEP).lines, 1, "and so is a name of one letter");
});

/** A card of a name alone, which is the shape the shelf's own row opens (`develop ADR 0084`). */
function composeNamed(length: number): CardContent {
    return { name: "x".repeat(length), subtitle: null, groups: [] };
}

/**
 * The name is drawn at `font-weight:600` and the sentences under it are not, so the same number of
 * characters takes more room on the first line of a card than anywhere below it. One floor for
 * both would be wrong in one of the two directions, and the direction it would be wrong in for the
 * name is the one that takes a card off the screen.
 */
Deno.test("a name is counted on a lower floor than a sentence, because it is drawn bold", () => {
    const between = NAME_ON_ONE_LINE + 1;
    assert(between <= SUBTITLE_ON_ONE_LINE, "there is a length the two floors answer differently");
    assertEquals(
        tallyCardSize(composeNamed(between), STEP).lines,
        2,
        "a name of that length has folded",
    );
    assertEquals(
        tallyCardSize({
            name: "x",
            subtitle: null,
            groups: [{ lines: [{ kind: "note", text: "x".repeat(between), tone: "plain" }] }],
        }, STEP).lines - 1,
        1,
        "while a sentence of the same length has not",
    );
});

/**
 * ⚠️ **The line under the name folds today and was counted as one.** `.card-subtitle` spells no
 * `white-space`, so it has always wrapped, and the count that stood above it reserved a single
 * line whatever it said — the same under-count as the name's, one row lower on the card.
 */
Deno.test("the line under the name is counted as the lines it folds to", () => {
    const named = composeNamed(1);
    const cost = (length: number): number =>
        tallyCardSize({ ...named, subtitle: "x".repeat(length) }, STEP).lines -
        tallyCardSize(named, STEP).lines;
    assertEquals(cost(SUBTITLE_ON_ONE_LINE), 1, "what a line holds costs one");
    assertEquals(cost(SUBTITLE_ON_ONE_LINE + 1), 2, "and one character past it costs two");
    assertEquals(cost(0), 1, "a line saying nothing is still drawn, so it still costs one");
});

Deno.test("hiding and showing write the class, and nothing else moves", () => {
    const document = composeFakeDocument();
    const card = renderCard(document, HILDUR) as FakeElement;
    setCardHidden(card, true);
    assertEquals(card.className, `${CLASS.card} ${CLASS.cardHidden}`, "hidden wears the mark");
    setCardHidden(card, false);
    assertEquals(card.className, CLASS.card, "and shown takes it off again");
    assertEquals(getTextsByClass(card, CLASS.cardName), [HILDUR.name], "what it says is untouched");
});

/**
 * The height and not the counts it was worked out from: `getCardHeight` owns that arithmetic
 * now, because the trim and the sheet's own clamp have to spend one number.
 */
Deno.test("where the detail sits and how tall it is are written together, in whole pixels", () => {
    const document = composeFakeDocument();
    const card = renderCard(document, HILDUR) as FakeElement;
    const size = tallyCardSize(HILDUR, STEP);
    setCardPosition(card, 292.33333333333, null, size, STEP);
    assertEquals(
        card.attributes.get("style"),
        "--MargoMeter-card-top:292px;--MargoMeter-card-height:118px",
        "a fractional `clientY` on a scaled display is not a place anybody can see",
    );
    setCardPosition(card, 0, null, size, STEP);
    assert(
        card.attributes.get("style")?.startsWith("--MargoMeter-card-top:0px;"),
        "the screen's top",
    );
    setCardPosition(card, -4, null, size, STEP);
    assert(
        card.attributes.get("style")?.startsWith("--MargoMeter-card-top:0px;"),
        "and never above",
    );
    // A panel that has never been dragged keeps the side the sheet states, so nothing is written
    // across: the one written here is the panel saying it has moved.
    setCardPosition(card, 100, { edge: "left", at: 42.6 }, size, STEP);
    assertEquals(
        card.attributes.get("style"),
        "--MargoMeter-card-top:100px;--MargoMeter-card-height:118px;" +
            "--MargoMeter-card-left:43px;--MargoMeter-card-right:auto",
        "and a panel that has moved says which side the detail opens on",
    );
});

/**
 * ⚠️ **Both edges every time, and one of them released.** A card is drawn at `max-content` since
 * `develop ADR 0091`, so the sheet states a fallback for the edge nobody pinned — and an offset
 * written without releasing the other leaves the card held by both, which is a width nobody chose.
 * The failure is silent: the card is simply wider or narrower than what it says.
 */
Deno.test("a card pinned by one edge releases the other, whichever way round it opens", () => {
    const document = composeFakeDocument();
    const card = renderCard(document, HILDUR) as FakeElement;
    const size = tallyCardSize(HILDUR, STEP);

    setCardPosition(card, 0, { edge: "right", at: 272 }, size, STEP);
    assertStringIncludes(
        card.attributes.get("style") ?? "",
        "--MargoMeter-card-left:auto;--MargoMeter-card-right:272px",
        "a card standing left of its window is measured from the screen's right edge",
    );

    setCardPosition(card, 0, { edge: "left", at: 330 }, size, STEP);
    assertStringIncludes(
        card.attributes.get("style") ?? "",
        "--MargoMeter-card-left:330px;--MargoMeter-card-right:auto",
        "and one flipped to the other side is measured from the left, the right let go",
    );

    setCardPosition(card, 0, null, size, STEP);
    const sheets = card.attributes.get("style") ?? "";
    assertEquals(sheets.includes("card-left"), false, "a panel nobody moved writes no edge at all");
    assertEquals(sheets.includes("card-right"), false, "and the sheet's own corner stands");
});

/**
 * A card taller than the window, and what the panel does about it. Every figure here is the
 * panel's own arithmetic — `getCardHeight` — so the test states a room and never a pixel count of
 * its own.
 */
Deno.test("a card too tall for one column stands in two, and gives a run up only past those", () => {
    const tall: CardContent = {
        name: "Hildur Muza Śmierci",
        subtitle: "(83)",
        groups: [
            {
                lines: [{
                    kind: "stat",
                    label: "Zadane",
                    stated: "354 258",
                    isStrong: true,
                    caveat: null,
                }],
            },
            {
                lines: [{
                    kind: "stat",
                    label: "Ciosy",
                    stated: "180",
                    isStrong: false,
                    caveat: null,
                }],
            },
            { lines: [{ kind: "heading", text: "W CIOSACH ZADANYCH" }] },
            { lines: [{ kind: "heading", text: "W CIOSACH PRZYJĘTYCH" }] },
            { lines: [{ kind: "note", text: ONE_LINE_NOTE, tone: "suspect" }] },
        ],
    };
    const whole = getCardHeight(tallyCardSize(tall, STEP), TOKENS);
    assertExists(whole, "the panel can say how tall its own card stands");

    assertEquals(
        composeCardLayout(tall, { heightPixels: whole, widthPixels: WIDTH_ROOM }, STEP),
        { card: tall, secondColumnFrom: null },
        "a card with room for it is left alone, in one column",
    );
    assertEquals(
        composeCardLayout(tall, { heightPixels: null, widthPixels: WIDTH_ROOM }, STEP),
        { card: tall, secondColumnFrom: null },
        "and so is one in a window nobody sized",
    );

    // **W5**: a pixel short of one column is the boundary, and two columns answer it whole.
    const twoColumns = composeCardLayout(
        tall,
        { heightPixels: whole - 1, widthPixels: WIDTH_ROOM },
        STEP,
    );
    assertEquals(twoColumns.card, tall, "a card a pixel too tall gives nothing up (ADR 0033)");
    assertEquals(twoColumns.secondColumnFrom, 2, "it stands in two columns, split down the middle");
    const twoHigh = getCardHeight(tallyCardLayoutSize(twoColumns, STEP), TOKENS);
    assertExists(twoHigh, "and the panel can say how tall the two columns stand");
    assert(twoHigh <= whole - 1, "which is within the room the one column was not");

    // Room for less than even two columns hold, which is what a very short window comes to.
    const cut = composeCardLayout(
        tall,
        { heightPixels: twoHigh - 1, widthPixels: WIDTH_ROOM },
        STEP,
    ).card;
    const said = cut.groups.flatMap((group) => group.lines);
    assertEquals(cut.groups[0], tall.groups[0], "the four figures are what a card is for");
    assert(
        said.some((line) => line.kind === "note" && line.text === CARD_WORDS.cut),
        "and a card that gave something up says so rather than losing it in silence",
    );
    assert(
        said.some((line) => line.kind === "note" && line.tone === "suspect"),
        "the suspicion stands: it is a claim that a figure above it may be wrong",
    );
    assert(
        !said.some((line) => line.kind === "heading" && line.text === "W CIOSACH PRZYJĘTYCH"),
        "and the run given up is the last of the ones between them",
    );
});

/** A window with room for nothing keeps the figures, rather than handing back an empty card. */
Deno.test("a window too short for even the figures still draws them, and says so", () => {
    const tall: CardContent = {
        name: "Hildur",
        subtitle: null,
        groups: [
            {
                lines: [{
                    kind: "stat",
                    label: "Zadane",
                    stated: "354 258",
                    isStrong: true,
                    caveat: null,
                }],
            },
            {
                lines: [{
                    kind: "stat",
                    label: "Ciosy",
                    stated: "180",
                    isStrong: false,
                    caveat: null,
                }],
            },
            { lines: [{ kind: "note", text: ONE_LINE_NOTE, tone: "plain" }] },
        ],
    };
    const cut = composeCardLayout(tall, { heightPixels: 1, widthPixels: WIDTH_ROOM }, STEP).card;
    assertEquals(cut.groups[0], tall.groups[0], "the figures are drawn whatever the room");
    assert(
        cut.groups.flatMap((group) => group.lines).some((line) =>
            line.kind === "note" && line.text === CARD_WORDS.cut
        ),
        "and the card says a part of it is not there",
    );
});

/**
 * Two columns as the card draws them: the fight's own figures and what the split leaves in the
 * first, the rest in the second, and the notes under both — a suspicion is read under every figure
 * it may concern, not under one column of them. ADR 0033.
 */
Deno.test("a card in two columns draws them side by side, and its notes across the foot", () => {
    const document = composeFakeDocument();
    const drawn = renderCard(document, LONG, 2) as FakeElement;
    assertEquals(
        drawn.className,
        `${CLASS.card} ${CLASS.cardWide}`,
        "a card of two is the wide one",
    );
    const columns = getElementsWithin(drawn).filter((element) =>
        element.className === CLASS.cardColumn
    );
    assertEquals(columns.length, 2, "two columns stand under the name");
    const [left, right] = columns;
    assertExists(left, "the first column");
    assertExists(right, "and the second");
    assertEquals(getTextsByClass(left, CLASS.cardHeading), [], "the first holds the figures");
    assertEquals(
        getTextsByClass(right, CLASS.cardHeading),
        ["W CIOSACH ZADANYCH", "W CIOSACH PRZYJĘTYCH"],
        "and the second the runs past the split",
    );
    const noted = `${CLASS.cardNote} ${CLASS.cardSuspect}`;
    assertEquals(getTextsByClass(left, noted), [], "no note stands in a column");
    assertEquals(getTextsByClass(right, noted), [], "in either of them");
    assertEquals(getTextsByClass(drawn, noted), [ONE_LINE_NOTE], "but across the foot");
    const single = renderCard(document, LONG) as FakeElement;
    assertEquals(single.className, CLASS.card, "and a card of one is drawn as it always was");
    assertEquals(
        getElementsWithin(single).filter((element) => element.className === CLASS.cardColumns),
        [],
        "with no columns at all",
    );
});

/**
 * Each column keeps the whole bound, because the floors a note is counted at assume it: a card of
 * two squeezed into the width of one would fold every sentence past its count. ADR 0033.
 */
Deno.test("a card of two columns is as wide as two bounds and the air between them", () => {
    for (const step of Object.values(TYPE_STEP)) {
        const bound = TYPE_TOKENS[step].cardWidthPixelsMaximum;
        const singleWidth = getCardWidthForColumns(TYPE_TOKENS[step], 1);
        const doubleWidth = getCardWidthForColumns(TYPE_TOKENS[step], 2);
        assertEquals(singleWidth, bound, `${step}: one column is the bound`);
        assert(doubleWidth - singleWidth >= bound, `${step}: and the second adds a whole bound`);
        assert(doubleWidth - 2 * bound < bound, `${step}: and no more than the air between them`);
    }
});

/**
 * Two columns narrower than two bounds would each fold their notes past the lines counted for them,
 * and the card would be clipped with nothing said, so a window too narrow for two gives a run up
 * instead (ADR 0033).
 */
Deno.test("a window too narrow for two columns gives a run up rather than squeezing them", () => {
    const whole = getCardHeight(tallyCardSize(LONG, STEP), TOKENS);
    assertExists(whole, "the long card has a height");
    const twoWide = getCardWidthForColumns(TOKENS, 2);

    // **W5**: exactly the width of two columns is the boundary, and a pixel less is past it.
    const wideEnough = composeCardLayout(
        LONG,
        { heightPixels: whole - 1, widthPixels: twoWide },
        STEP,
    );
    assertNotStrictEquals(wideEnough.secondColumnFrom, null, "a window as wide as two holds two");
    const tooNarrow = composeCardLayout(
        LONG,
        { heightPixels: whole - 1, widthPixels: twoWide - 1 },
        STEP,
    );
    assertStrictEquals(tooNarrow.secondColumnFrom, null, "a pixel narrower holds one");
    assert(
        tooNarrow.card.groups.flatMap((group) => group.lines).some((line) =>
            line.kind === "note" && line.text === CARD_WORDS.cut
        ),
        "and the card gives a run up, and says so",
    );
    assertStrictEquals(
        composeCardLayout(LONG, { heightPixels: whole - 1, widthPixels: null }, STEP)
            .secondColumnFrom,
        null,
        "a page stating no width is not assumed to hold two",
    );
});

/** The split is the one that leaves the two columns closest in height, whatever the order. */
Deno.test("the second column opens where the two come out closest in height", () => {
    const lineOf = (label: string) => ({
        kind: "stat" as const,
        label,
        stated: "1",
        isStrong: false,
        caveat: null,
    });
    const lopsided: CardContent = {
        name: "Gracz 1",
        subtitle: null,
        groups: [
            { lines: [lineOf("Zadane")] },
            { lines: [lineOf("a"), lineOf("b"), lineOf("c"), lineOf("d"), lineOf("e")] },
            { lines: [lineOf("f")] },
            { lines: [lineOf("g")] },
        ],
    };
    const whole = getCardHeight(tallyCardSize(lopsided, STEP), TOKENS);
    assertExists(whole, "the card has a height");
    assertEquals(
        composeCardLayout(
            lopsided,
            { heightPixels: whole - 1, widthPixels: WIDTH_ROOM },
            STEP,
        ).secondColumnFrom,
        2,
        "six lines over two, rather than one over seven",
    );
});

Deno.test("the detail follows the pointer, and lets go of a row that stopped being drawn", () => {
    const { register, handle, first: firstCard } = composeHandleUnderTest();
    assertEquals(
        firstCard.className,
        `${CLASS.card} ${CLASS.cardHidden}`,
        "a panel starts saying none",
    );

    register.add("row:7", () => HILDUR);
    handle.onHover("row:7", 412);
    const shown = firstCard.replacedBy;
    assertExists(shown, "a row hovered puts a detail where the empty one stood");
    assertEquals(getTextsByClass(shown, CLASS.cardName), [HILDUR.name], "saying whose row it is");
    assert(
        shown.attributes.get("style")?.startsWith("--MargoMeter-card-top:412px"),
        "at the pointer",
    );

    handle.onHover("row:7", 480);
    assertEquals(shown.replacedBy, null, "the same row moved over is not drawn a second time");
    assert(
        shown.attributes.get("style")?.startsWith("--MargoMeter-card-top:480px"),
        "it only moves",
    );

    // The fight redraws under the cursor every few seconds, and the figure moves with it.
    register.reset();
    register.add("row:7", () => ({
        ...HILDUR,
        groups: [{
            lines: [{
                kind: "stat",
                label: "Zadane",
                stated: "400 000",
                isStrong: true,
                caveat: null,
            }],
        }],
    }));
    handle.renderOpen();
    const later = shown.replacedBy;
    assertExists(later, "a redraw puts the same row's detail up again");
    assertEquals(getTextsByClass(later, CLASS.cardValue), ["400 000"], "with the new one");
    assertEquals(
        later.attributes.get("style"),
        "--MargoMeter-card-top:480px;--MargoMeter-card-height:64px",
        "and a card that shrank says so, or the sheet clamps it against a height it no longer has",
    );

    register.reset();
    handle.renderOpen();
    assertEquals(
        later.className,
        `${CLASS.card} ${CLASS.cardHidden}`,
        "a row gone takes its detail",
    );
    assertEquals(later.replacedBy, null, "which is hidden in place rather than drawn again");
});

function composeHandleUnderTest() {
    const document = composeFakeDocument();
    const register = createCardRegister();
    const swap = composeSwap();
    const handle = initCardHandle(
        document,
        (key) => register.lookup(key),
        (standing, compose) => swap(standing as FakeElement, compose as () => FakeElement),
        undefined,
        undefined,
        () => STEP,
    );
    return { register, handle, first: handle.element as FakeElement };
}

/** The panel's own way of putting one region in the place of another, small enough to read. */
function composeSwap(): (standing: FakeElement, compose: () => FakeElement) => FakeElement {
    return (standing, compose) => {
        const composed = compose();
        standing.replaceWith(composed);
        return composed;
    };
}

Deno.test("a move inside one pixel writes nothing, because there is nowhere new to stand", () => {
    const { register, handle, first: firstCard } = composeHandleUnderTest();
    register.add("row:7", () => HILDUR);
    handle.onHover("row:7", 412);
    const shown = firstCard.replacedBy;
    assertExists(shown, "a row hovered opens the detail");
    shown.attributes.delete("style");
    handle.onHover("row:7", 412.4);
    assertEquals(shown.attributes.get("style"), undefined, "a move that rounds to the same place");
    handle.onHover("row:7", 413);
    assertExists(shown.attributes.get("style"), "and a move to the next one does write");
});

/**
 * The panel's own swap hides the window in place where a card will not compose (**E12**), and the
 * handle is not told: the key it was open under still names the row the pointer is on. Without
 * this the move that follows takes the shortcut for a card already standing and only writes a
 * place onto a window nobody can see, so the row stays blank until the pointer leaves it.
 */
Deno.test("a card hidden where it stood is composed again, not moved", () => {
    const document = composeFakeDocument();
    const register = createCardRegister();
    let willFail = false;
    const handle = initCardHandle(document, (key) => register.lookup(key), (standing, compose) => {
        // The panel's own answer to a card that throws: hidden where it stands, nothing replaced.
        if (willFail) {
            setCardHidden(standing, true);
            return standing;
        }
        const composed = compose();
        standing.replaceWith(composed);
        return composed;
    });
    const firstCard = handle.element as FakeElement;

    register.add("row:7", () => HILDUR);
    willFail = true;
    handle.onHover("row:7", 412);
    assertEquals(
        firstCard.className,
        `${CLASS.card} ${CLASS.cardHidden}`,
        "the card is hidden in place",
    );

    willFail = false;
    handle.onHover("row:7", 480);
    const shown = firstCard.replacedBy;
    assertExists(shown, "a move on the same row asks for the card again rather than moving none");
    assertEquals(getTextsByClass(shown, CLASS.cardName), [HILDUR.name], "and it names that row");
});

/**
 * A card that throws as it is composed is the panel's to hide (**E12**), and the card standing for
 * the last row goes with it. Left up under the new row's key, every move along that row would walk
 * the last row's figures down it, and a reader would read them as this row's.
 */
Deno.test("a card that will not compose takes the last row's card down with it", () => {
    const document = composeFakeDocument();
    const register = createCardRegister();
    const failures: errors.Caught[] = [];
    const handle = initCardHandle(document, (key) => register.lookup(key), (standing, compose) => {
        // The panel's own swap: a throw is told, and the card hidden where it stands.
        const rendered = errors.attempt(() => {
            const composed = compose();
            standing.replaceWith(composed);
            return composed;
        });
        if (!(rendered instanceof errors.Caught)) return rendered;
        failures.push(rendered);
        setCardHidden(standing, true);
        return standing;
    });
    const firstCard = handle.element as FakeElement;
    register.add("row:7", () => HILDUR);
    register.add("row:8", () => {
        throw new RangeError("a card of ours that will not compose");
    });
    handle.onHover("row:7", 300);
    const shown = firstCard.replacedBy;
    assertExists(shown, "the first row opens its card");

    // Through the guard a listener stands behind, so a throw out of the handle is what it drops.
    const moved = errors.attempt(() => handle.onHover("row:8", 340));
    assertStrictEquals(moved instanceof errors.Caught, false, "the handle keeps the throw in hand");
    assertStrictEquals(failures.length, 1, "and the swap is told of it, once");
    assertEquals(
        shown.className,
        `${CLASS.card} ${CLASS.cardHidden}`,
        "the first row's card does not stay up under the second row",
    );
    handle.onHover("row:8", 400);
    assertEquals(
        shown.className,
        `${CLASS.card} ${CLASS.cardHidden}`,
        "nor does a move along that row put it back up",
    );
    assertStrictEquals(failures.length, 2, "since the move asks for the row's own card again");
});

/**
 * Two windows draw rows, and a card does not open on the same side for both — so the handle asks
 * for a place with the key in hand rather than asking once for all of them (`develop ADR 0090`).
 * Held here because the handle is the one piece that knows which card is open.
 */
Deno.test("the card asks where it may stand with the key it is open for", () => {
    const document = composeFakeDocument();
    const register = createCardRegister();
    const asked: string[] = [];
    const swap = composeSwap();
    const handle = initCardHandle(
        document,
        (key) => register.lookup(key),
        (standing, compose) => swap(standing as FakeElement, compose as () => FakeElement),
        (key) => {
            asked.push(key);
            const distance = key === "helper:12" ? 255 : 507;
            return { edge: "left", at: distance };
        },
    );
    const firstCard = handle.element as FakeElement;

    register.add("helper:12", () => HILDUR);
    handle.onHover("helper:12", 300);
    const shown = firstCard.replacedBy;
    assertExists(shown, "a row of the second window opens a card");
    assertEquals(asked, ["helper:12"], "and the place was asked for under that row's own key");
    assert(
        shown.attributes.get("style")?.includes("--MargoMeter-card-left:255px"),
        "so it stands where that window's answer put it, not the panel's",
    );

    handle.onHover("helper:12", 360);
    assertEquals(asked.length, 2, "a move on the same row asks again, the card having not moved");
    handle.renderOpen();
    assertEquals(asked, ["helper:12", "helper:12", "helper:12"], "and so does a redraw");
});

/**
 * A card of two columns needs the room of two beside its window, so the side it opens on is asked
 * with the columns it stands in — the bound decides the side, never the card's own width (ADR
 * 0033, `develop ADR 0091`).
 */
Deno.test("the card asks where it may stand with the columns it is drawn in", () => {
    const document = composeFakeDocument();
    const register = createCardRegister();
    const asked: number[] = [];
    const swap = composeSwap();
    const whole = getCardHeight(tallyCardSize(LONG, STEP), TOKENS);
    assertExists(whole, "the long card has a height");
    // A window a pixel too short for the one column: what the sheet keeps around a card is the
    // panel's own figure, read off a window of any height.
    const kept = 1000 - (getCardHeightAvailable(1000) ?? 1000);
    let viewportHeight = whole - 1 + kept;
    const handle = initCardHandle(
        document,
        (key) => register.lookup(key),
        (standing, compose) => swap(standing as FakeElement, compose as () => FakeElement),
        (_key, columns) => {
            asked.push(columns);
            return null;
        },
        () => ({ width: WIDTH_ROOM, height: viewportHeight }),
        () => STEP,
    );
    register.add("row:7", () => LONG);
    handle.onHover("row:7", 300);
    assertEquals(asked, [2], "a card too tall for one column asks for the room of two");
    viewportHeight = whole + kept;
    handle.renderOpen();
    assertEquals(asked, [2, 1], "and one that fits asks for the room of one");
});

Deno.test("nobody under the pointer hides it, and a row nobody drew never opens it", () => {
    const { register, handle, first: firstCard } = composeHandleUnderTest();
    handle.onHover("row:404", 200);
    assertEquals(firstCard.replacedBy, null, "a key the draw never registered draws nothing");
    assertEquals(firstCard.className, `${CLASS.card} ${CLASS.cardHidden}`, "and leaves it hidden");

    register.add("row:7", () => HILDUR);
    handle.onHover("row:7", 200);
    const shown = firstCard.replacedBy;
    assertExists(shown, "a key it did register opens it");
    handle.onHover(null, 200);
    assertEquals(
        shown.className,
        `${CLASS.card} ${CLASS.cardHidden}`,
        "and leaving hides it again",
    );
});

/**
 * ⚠️ **The mark a caveated sentence wears is counted although the text no longer carries it.** It
 * is a node of its own, drawn from the tone since `develop ADR 0092`, and a count reading `text`
 * alone would shorten every one of those notes by a mark the card still draws — a card standing
 * lower on the screen than it is tall, with its last line off the bottom.
 *
 * Thirty-one characters is the length that tells the two apart: with the mark it wraps and
 * without it does not. Thirty says one line either way, which is the other side of the boundary.
 */
Deno.test("a caveated sentence is counted with the mark the card draws before it", () => {
    const compose = (length: number, tone: CardNoteTone): CardContent => ({
        name: "Hildur",
        subtitle: null,
        groups: [{ lines: [{ kind: "note", text: "x".repeat(length), tone }] }],
    });
    // What the mark costs, and never the card's own total: the name above the sentence is a line
    // of the count too, and a test stating the total would move with the card rather than with
    // the thing it is about.
    const cost = (length: number): number =>
        tallyCardSize(compose(length, "caveat"), STEP).lines -
        tallyCardSize(compose(length, "plain"), STEP).lines;

    assertEquals(cost(31), 1, "thirty-one characters and a mark run to a second line");
    assertEquals(cost(30), 0, "thirty and a mark still stand on one, which is the other side");
    assertEquals(
        tallyCardSize(compose(31, "plain"), STEP).lines,
        tallyCardSize(compose(30, "plain"), STEP).lines,
        "and neither length wraps on its own, so the line the mark bought is the mark's",
    );
});
