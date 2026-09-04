/**
 * The position a reader left the list at, kept by name, and the region it is read off and put on.
 *
 * The fake document lays nothing out, so a position here is exactly what the panel wrote — what a
 * browser does with one is `tests/e2e/panel-scroll.spec.ts`'s to say.
 */

import { assertEquals, assertStrictEquals } from "@std/assert";
import { CLASS } from "@/src/ui/panel-look.ts";
import { composeKeptScrollMemo, getTopOfList, setTopOfList } from "@/src/ui/panel-scroll.ts";
import type { PanelElement } from "@/src/ui/panel-element.ts";
import { composeFakeDocument } from "@/tests/fake-document.ts";

/** Past the memo's own maximum, so the bound is met rather than approached. */
const NAMES_TRIED = 40;
const SOMEWHERE_DOWN = 240;

function composeElementOfClass(className: string): PanelElement {
    const element = composeFakeDocument().createElement("div");
    element.className = className;
    return element;
}

Deno.test("a list nobody has scrolled stands at the top", () => {
    const kept = composeKeptScrollMemo();
    assertStrictEquals(kept.getTop("damageDealtApplied|everyone"), 0, "and says so as a zero");
});

Deno.test("a position comes back under the name it was kept under", () => {
    const kept = composeKeptScrollMemo();
    kept.setTop("ranking", SOMEWHERE_DOWN);
    kept.setTop("opened", 1);
    assertStrictEquals(kept.getTop("ranking"), SOMEWHERE_DOWN, "the one that was kept");
    assertStrictEquals(kept.getTop("opened"), 1, "and the one beside it, which is not the same");
    assertStrictEquals(kept.getTop("shelf"), 0, "and a name nobody kept is still the top");
});

Deno.test("the oldest place goes when the maximum is reached", () => {
    const kept = composeKeptScrollMemo();
    kept.setTop("first", SOMEWHERE_DOWN);
    for (let at = 0; at < NAMES_TRIED; at += 1) kept.setTop(`place ${at}`, at + 1);
    assertStrictEquals(kept.getTop("first"), 0, "the place kept longest ago is gone");
    assertStrictEquals(
        kept.getTop(`place ${NAMES_TRIED - 1}`),
        NAMES_TRIED,
        "and the one kept last is there",
    );
});

Deno.test("a position is read off a list and off nothing else", () => {
    const list = composeElementOfClass(CLASS.list);
    list.scrollTop = SOMEWHERE_DOWN;
    assertStrictEquals(getTopOfList(list), SOMEWHERE_DOWN, "the region answers with its position");
    const waiting = composeElementOfClass(`${CLASS.list} ${CLASS.listWaiting}`);
    assertStrictEquals(
        getTopOfList(waiting),
        0,
        "the waiting bar is a list, and stands at its top",
    );
    const slot = composeElementOfClass(CLASS.slot);
    slot.scrollTop = SOMEWHERE_DOWN;
    assertStrictEquals(getTopOfList(slot), null, "and a slot holds no position at all");
});

Deno.test("a position is put on a list and never on a slot", () => {
    const list = composeElementOfClass(CLASS.list);
    setTopOfList(list, SOMEWHERE_DOWN);
    assertStrictEquals(list.scrollTop, SOMEWHERE_DOWN, "the list is put where it was left");
    const slot = composeElementOfClass(CLASS.slot);
    setTopOfList(slot, SOMEWHERE_DOWN);
    assertStrictEquals(slot.scrollTop, 0, "and a slot is left exactly as it was");
    assertEquals(getTopOfList(slot), null, "and is not asked about a position either");
});
