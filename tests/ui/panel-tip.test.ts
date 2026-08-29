/**
 * The detail window on its own: what it says, what it refuses, and where it puts itself.
 *
 * The placement is checked as the declaration it writes rather than as pixels on a screen, because
 * the arithmetic that would have needed measuring is in the stylesheet's `clamp` and not here.
 */

import { assert, assertEquals, AssertionError, assertThrows } from "@std/assert";
import {
    composeTipElement,
    composeTipHandle,
    composeTipRegister,
    setTipHidden,
    setTipPlace,
    type TipReading,
} from "@/src/ui/panel-tip.ts";
import { CLASS } from "@/src/ui/panel-look.ts";
import { composeFakeDocument, type FakeElement, getTextsByClass } from "@/tests/fake-document.ts";

const HILDUR: TipReading = {
    name: "Hildur Muza Śmierci",
    figure: { caption: "Obrażenia zadane", value: 354258 },
    share: { caption: "Udział w walce", text: "52%" },
};

Deno.test("a row is looked up by the name it stated, and by no other", () => {
    const register = composeTipRegister();
    assertEquals(register.get("row:7"), null, "a row nobody drew has nothing to say");
    register.add("row:7", HILDUR);
    assertEquals(register.get("row:7"), HILDUR, "and one that was drawn says what it drew");
    assertEquals(register.get("row:8"), null, "which reaches no neighbour");
    assertThrows(
        () => register.add("row:7", HILDUR),
        AssertionError,
        "no two rows in one draw",
    );
    register.reset();
    assertEquals(register.get("row:7"), null, "a redraw starts with nothing said about any row");
});

Deno.test("the detail says the name in full, and the share the row never printed", () => {
    const document = composeFakeDocument();
    const tip = composeTipElement(document, HILDUR) as FakeElement;
    assertEquals(getTextsByClass(tip, CLASS.tipName), ["Hildur Muza Śmierci"], "the name, whole");
    assertEquals(
        getTextsByClass(tip, CLASS.tipLabel),
        ["Obrażenia zadane", "Udział w walce"],
        "each figure under what it is",
    );
    assertEquals(getTextsByClass(tip, CLASS.tipValue), ["354 258", "52%"], "in Polish spelling");
    assertEquals(tip.className, CLASS.tip, "and a detail with something to say is not hidden");
});

Deno.test("a row with no share draws two lines, and one with nothing to say draws none", () => {
    const document = composeFakeDocument();
    const pinned = composeTipElement(document, { ...HILDUR, share: null }) as FakeElement;
    assertEquals(getTextsByClass(pinned, CLASS.tipValue), ["354 258"], "the figure alone");
    assertEquals(getTextsByClass(pinned, CLASS.tipLabel), ["Obrażenia zadane"], "under its own");
    const bare = composeTipElement(document, { ...HILDUR, figure: null, share: null });
    assertEquals(getTextsByClass(bare as FakeElement, CLASS.tipName), [HILDUR.name], "a name");
    assertEquals(getTextsByClass(bare as FakeElement, CLASS.tipValue), [], "and nothing under it");
    const nothing = composeTipElement(document, null) as FakeElement;
    assertEquals(nothing.className, `${CLASS.tip} ${CLASS.tipHidden}`, "nobody hovered is hidden");
    assertEquals(nothing.children.length, 0, "and says nothing at all");
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

Deno.test("where the detail sits is written in whole pixels, and across only when asked", () => {
    const document = composeFakeDocument();
    const tip = composeTipElement(document, HILDUR) as FakeElement;
    setTipPlace(tip, 292.33333333333, null);
    assertEquals(
        tip.attributes.get("style"),
        "--MargoMeter-tip-top:292px",
        "a fractional `clientY` on a scaled display is not a place anybody can see",
    );
    setTipPlace(tip, 0, null);
    assertEquals(tip.attributes.get("style"), "--MargoMeter-tip-top:0px", "the top of the screen");
    setTipPlace(tip, -4, null);
    assertEquals(tip.attributes.get("style"), "--MargoMeter-tip-top:0px", "and never above it");
    // A panel that has never been dragged keeps the side the sheet states, so nothing is written
    // across: the one written here is the panel saying it has moved.
    setTipPlace(tip, 100, 42.6);
    assertEquals(
        tip.attributes.get("style"),
        "--MargoMeter-tip-top:100px;--MargoMeter-tip-left:43px",
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

Deno.test("the detail follows the pointer, and lets go of a row that stopped being drawn", () => {
    const document = composeFakeDocument();
    const register = composeTipRegister();
    const swap = composeSwap();
    const handle = composeTipHandle(
        document,
        register,
        (standing, compose) => swap(standing as FakeElement, compose as () => FakeElement),
    );
    const first = handle.element as FakeElement;
    assertEquals(first.className, `${CLASS.tip} ${CLASS.tipHidden}`, "a panel starts saying none");

    register.add("row:7", HILDUR);
    handle.show("row:7", 412);
    const shown = first.replacedBy;
    assert(shown !== null, "a row hovered puts a detail where the empty one stood");
    assertEquals(getTextsByClass(shown, CLASS.tipName), [HILDUR.name], "saying whose row it is");
    assertEquals(shown.attributes.get("style"), "--MargoMeter-tip-top:412px", "beside the pointer");

    handle.show("row:7", 480);
    assertEquals(shown.replacedBy, null, "the same row moved over is not drawn a second time");
    assertEquals(shown.attributes.get("style"), "--MargoMeter-tip-top:480px", "it only moves");

    // The fight redraws under the cursor every few seconds, and the figure moves with it.
    register.reset();
    register.add("row:7", { ...HILDUR, figure: { caption: "Obrażenia zadane", value: 400000 } });
    handle.refresh();
    const later = shown.replacedBy;
    assert(later !== null, "a redraw puts the same row's detail up again");
    assertEquals(getTextsByClass(later, CLASS.tipValue), ["400 000", "52%"], "with the new one");

    register.reset();
    handle.refresh();
    assertEquals(later.className, `${CLASS.tip} ${CLASS.tipHidden}`, "a row gone takes its detail");
    assertEquals(later.replacedBy, null, "which is hidden in place rather than drawn again");
});

Deno.test("nobody under the pointer hides it, and a row nobody drew never opens it", () => {
    const document = composeFakeDocument();
    const register = composeTipRegister();
    const swap = composeSwap();
    const handle = composeTipHandle(
        document,
        register,
        (standing, compose) => swap(standing as FakeElement, compose as () => FakeElement),
    );
    const first = handle.element as FakeElement;
    handle.show("row:404", 200);
    assertEquals(first.replacedBy, null, "a key the draw never registered draws nothing");
    assertEquals(first.className, `${CLASS.tip} ${CLASS.tipHidden}`, "and leaves it hidden");

    register.add("row:7", HILDUR);
    handle.show("row:7", 200);
    const shown = first.replacedBy;
    assert(shown !== null, "a key it did register opens it");
    handle.show(null, 200);
    assertEquals(shown.className, `${CLASS.tip} ${CLASS.tipHidden}`, "and leaving hides it again");
});
