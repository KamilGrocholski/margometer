/**
 * The detail window on its own: what it says, what it refuses, how tall it says it stands, and
 * where it puts itself.
 *
 * The placement is checked as the declarations it writes rather than as pixels on a screen,
 * because the arithmetic that would have needed measuring is in the stylesheet and not here.
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import {
    composeTipElement,
    composeTipHandle,
    composeTipRegister,
    getTipSize,
    setTipHidden,
    setTipPlace,
    type TipReading,
} from "@/src/ui/panel-tip.ts";
import { CLASS } from "@/src/ui/panel-look.ts";
import {
    composeFakeDocument,
    type FakeElement,
    getElementsWithin,
    getTextsByClass,
} from "@/tests/fake-document.ts";

/** Thirty-two characters, which is the one line a note is counted as holding. */
const ONE_LINE_NOTE = "Surowe to obrazenia przed red...";
/** And one past it, which is the first note that costs two. */
const TWO_LINE_NOTE = `${ONE_LINE_NOTE}.`;

const HILDUR: TipReading = {
    name: "Hildur Muza Śmierci",
    subtitle: "(83)",
    groups: [
        {
            lines: [
                { kind: "stat", label: "Zadane", stated: "354 258", isStrong: true },
                { kind: "sub", label: "surowe", stated: "410 002" },
                { kind: "stat", label: "Otrzymane", stated: "141 710", isStrong: false },
            ],
        },
        { lines: [{ kind: "note", text: ONE_LINE_NOTE, isWarning: false }] },
    ],
};

Deno.test("a row is looked up by the name it stated, and by no other", () => {
    const register = composeTipRegister();
    const compose = () => HILDUR;
    assertEquals(register.get("row:7"), null, "a row nobody drew has nothing to say");
    register.add("row:7", compose);
    assertEquals(register.get("row:7"), compose, "and one that was drawn says what it drew");
    assertEquals(register.get("row:8"), null, "which reaches no neighbour");
    // Two rows answering to one name used to stop the draw. The first stands and the second is
    // refused, so what a clash costs is a card on hover and never the panel — **E14**, ADR 0051.
    const other = () => HILDUR;
    register.add("row:7", other);
    assertEquals(register.get("row:7"), compose, "and a second row of that name changes nothing");
    register.add("", compose);
    assertEquals(register.get(""), null, "as does a row with no name to be looked up by");
    register.reset();
    assertEquals(register.get("row:7"), null, "a redraw starts with nothing said about any row");
});

Deno.test("the card draws a line for each of the three kinds, marked as the kind it is", () => {
    const document = composeFakeDocument();
    const tip = composeTipElement(document, HILDUR) as FakeElement;
    assertEquals(getTextsByClass(tip, CLASS.tipName), ["Hildur Muza Śmierci"], "the name, whole");
    assertEquals(getTextsByClass(tip, CLASS.tipSubtitle), ["(83)"], "and who they are under it");
    assertEquals(
        getTextsByClass(tip, CLASS.tipLabel),
        ["Zadane", "surowe", "Otrzymane"],
        "each figure under what it is",
    );
    assertEquals(
        getTextsByClass(tip, CLASS.tipValue),
        ["354 258", "410 002", "141 710"],
        "in the spelling the row beside it uses",
    );
    assertEquals(getTextsByClass(tip, CLASS.tipNote), [ONE_LINE_NOTE], "and the note, whole");
    const lines = getClassesByPrefix(tip, CLASS.tipLine);
    assertEquals(
        lines,
        [
            `${CLASS.tipLine} ${CLASS.tipStrong}`,
            `${CLASS.tipLine} ${CLASS.tipSub}`,
            CLASS.tipLine,
        ],
        "the figure the screen shows is the one in bold, and the part of it is the one indented",
    );
    assertEquals(tip.className, CLASS.tip, "a card with something to say is not hidden");
});

/** Every line's own class, in the order the card drew them. */
function getClassesByPrefix(element: FakeElement, prefix: string): string[] {
    return getElementsWithin(element)
        .filter((one) => one.className.startsWith(prefix))
        .map((one) => one.className);
}

Deno.test("a row with nothing further to say draws a name, and nobody hovered draws none", () => {
    const document = composeFakeDocument();
    const bare = composeTipElement(document, {
        name: "Kolonia Mrówek",
        subtitle: null,
        groups: [],
    }) as FakeElement;
    assertEquals(getTextsByClass(bare, CLASS.tipName), ["Kolonia Mrówek"], "a name");
    assertEquals(getTextsByClass(bare, CLASS.tipValue), [], "and nothing under it");
    assertEquals(getTextsByClass(bare, CLASS.tipSubtitle), [], "not even an empty line for one");
    const nothing = composeTipElement(document, null) as FakeElement;
    assertEquals(nothing.className, `${CLASS.tip} ${CLASS.tipHidden}`, "nobody hovered is hidden");
    assertEquals(nothing.children.length, 0, "and says nothing at all");
});

Deno.test("a warning on the card wears the mark as well as the colour", () => {
    const document = composeFakeDocument();
    const tip = composeTipElement(document, {
        ...HILDUR,
        groups: [{ lines: [{ kind: "note", text: ONE_LINE_NOTE, isWarning: true }] }],
    }) as FakeElement;
    assertEquals(
        getClassesByPrefix(tip, CLASS.tipNote),
        [`${CLASS.tipNote} ${CLASS.tipWarning}`],
        "a doubt is a note before it is a doubt, so the colour is never carrying it alone",
    );
});

Deno.test("how tall a card stands is counted, and a note as the lines it wraps to", () => {
    assertEquals(getTipSize(null), { lines: 1, groups: 0 }, "a window nobody opened is one line");
    assertEquals(
        getTipSize(HILDUR),
        { lines: 6, groups: 2 },
        "a name, who they are, three figures and a note that fits on one line",
    );
    assertEquals(
        getTipSize({ ...HILDUR, subtitle: null }),
        { lines: 5, groups: 2 },
        "and a card that could not say who they are is a line shorter",
    );
    const wrapped = {
        ...HILDUR,
        groups: [{ lines: [{ kind: "note" as const, text: TWO_LINE_NOTE, isWarning: false }] }],
    };
    assertEquals(
        getTipSize(wrapped),
        { lines: 4, groups: 1 },
        "one character past what a line holds costs the whole of the next one",
    );
    assertEquals(
        getTipSize({ ...wrapped, groups: [] }),
        { lines: 2, groups: 0 },
        "and a card with no run of lines spends nothing on the rules between them",
    );
});

Deno.test("hiding and showing write the class, and nothing else moves", () => {
    const document = composeFakeDocument();
    const tip = composeTipElement(document, HILDUR) as FakeElement;
    setTipHidden(tip, true);
    assertEquals(tip.className, `${CLASS.tip} ${CLASS.tipHidden}`, "hidden wears the mark");
    setTipHidden(tip, false);
    assertEquals(tip.className, CLASS.tip, "and shown takes it off again");
    assertEquals(getTextsByClass(tip, CLASS.tipName), [HILDUR.name], "what it says is untouched");
});

Deno.test("where the detail sits and how tall it is are written together, in whole pixels", () => {
    const document = composeFakeDocument();
    const tip = composeTipElement(document, HILDUR) as FakeElement;
    const size = getTipSize(HILDUR);
    setTipPlace(tip, 292.33333333333, null, size);
    assertEquals(
        tip.attributes.get("style"),
        "--MargoMeter-tip-top:292px;--MargoMeter-tip-lines:6;--MargoMeter-tip-groups:2",
        "a fractional `clientY` on a scaled display is not a place anybody can see",
    );
    setTipPlace(tip, 0, null, size);
    assert(
        tip.attributes.get("style")?.startsWith("--MargoMeter-tip-top:0px;"),
        "the screen's top",
    );
    setTipPlace(tip, -4, null, size);
    assert(tip.attributes.get("style")?.startsWith("--MargoMeter-tip-top:0px;"), "and never above");
    // A panel that has never been dragged keeps the side the sheet states, so nothing is written
    // across: the one written here is the panel saying it has moved.
    setTipPlace(tip, 100, 42.6, size);
    assertEquals(
        tip.attributes.get("style"),
        "--MargoMeter-tip-top:100px;--MargoMeter-tip-lines:6;--MargoMeter-tip-groups:2" +
            ";--MargoMeter-tip-left:43px",
        "and a panel that has moved says which side the detail opens on",
    );
});

/** The panel's own way of putting one region in the place of another, small enough to read. */
function composeSwap(): (standing: FakeElement, compose: () => FakeElement) => FakeElement {
    return (standing, compose) => {
        const next = compose();
        standing.replaceWith(next);
        return next;
    };
}

function composeHandleUnderTest() {
    const document = composeFakeDocument();
    const register = composeTipRegister();
    const swap = composeSwap();
    const handle = composeTipHandle(
        document,
        register,
        (standing, compose) => swap(standing as FakeElement, compose as () => FakeElement),
    );
    return { register, handle, first: handle.element as FakeElement };
}

Deno.test("the detail follows the pointer, and lets go of a row that stopped being drawn", () => {
    const { register, handle, first } = composeHandleUnderTest();
    assertEquals(first.className, `${CLASS.tip} ${CLASS.tipHidden}`, "a panel starts saying none");

    register.add("row:7", () => HILDUR);
    handle.show("row:7", 412);
    const shown = first.replacedBy;
    assertExists(shown, "a row hovered puts a detail where the empty one stood");
    assertEquals(getTextsByClass(shown, CLASS.tipName), [HILDUR.name], "saying whose row it is");
    assert(
        shown.attributes.get("style")?.startsWith("--MargoMeter-tip-top:412px"),
        "at the pointer",
    );

    handle.show("row:7", 480);
    assertEquals(shown.replacedBy, null, "the same row moved over is not drawn a second time");
    assert(
        shown.attributes.get("style")?.startsWith("--MargoMeter-tip-top:480px"),
        "it only moves",
    );

    // The fight redraws under the cursor every few seconds, and the figure moves with it.
    register.reset();
    register.add("row:7", () => ({
        ...HILDUR,
        groups: [{ lines: [{ kind: "stat", label: "Zadane", stated: "400 000", isStrong: true }] }],
    }));
    handle.refresh();
    const later = shown.replacedBy;
    assertExists(later, "a redraw puts the same row's detail up again");
    assertEquals(getTextsByClass(later, CLASS.tipValue), ["400 000"], "with the new one");
    assertEquals(
        later.attributes.get("style"),
        "--MargoMeter-tip-top:480px;--MargoMeter-tip-lines:3;--MargoMeter-tip-groups:1",
        "and a card that shrank says so, or the sheet clamps it against a height it no longer has",
    );

    register.reset();
    handle.refresh();
    assertEquals(later.className, `${CLASS.tip} ${CLASS.tipHidden}`, "a row gone takes its detail");
    assertEquals(later.replacedBy, null, "which is hidden in place rather than drawn again");
});

Deno.test("a move inside one pixel writes nothing, because there is nowhere new to stand", () => {
    const { register, handle, first } = composeHandleUnderTest();
    register.add("row:7", () => HILDUR);
    handle.show("row:7", 412);
    const shown = first.replacedBy;
    assertExists(shown, "a row hovered opens the detail");
    shown.attributes.delete("style");
    handle.show("row:7", 412.4);
    assertEquals(shown.attributes.get("style"), undefined, "a move that rounds to the same place");
    handle.show("row:7", 413);
    assertExists(shown.attributes.get("style"), "and a move to the next one does write");
});

Deno.test("nobody under the pointer hides it, and a row nobody drew never opens it", () => {
    const { register, handle, first } = composeHandleUnderTest();
    handle.show("row:404", 200);
    assertEquals(first.replacedBy, null, "a key the draw never registered draws nothing");
    assertEquals(first.className, `${CLASS.tip} ${CLASS.tipHidden}`, "and leaves it hidden");

    register.add("row:7", () => HILDUR);
    handle.show("row:7", 200);
    const shown = first.replacedBy;
    assertExists(shown, "a key it did register opens it");
    handle.show(null, 200);
    assertEquals(shown.className, `${CLASS.tip} ${CLASS.tipHidden}`, "and leaving hides it again");
});
