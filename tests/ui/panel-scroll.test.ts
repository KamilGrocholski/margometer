/**
 * The position a reader left the list at, kept by name, and the region it is read off and put on.
 *
 * The fake document lays nothing out, so a position here is exactly what the panel wrote — what a
 * browser does with one is `tests/e2e/panel-scroll.spec.ts`'s to say.
 */

import { assertEquals, assertStrictEquals } from "@std/assert";
import { CLASS } from "@/src/ui/panel-look.ts";
import {
    composeKeptScrollMemo,
    getTopOfList,
    setListRowsDrawn,
    setTopOfList,
} from "@/src/ui/panel-scroll.ts";
import type { PanelElement } from "@/src/ui/panel-element.ts";
import { composeFakeDocument } from "@/tests/fake-document.ts";

/** Past the memo's own maximum, so the bound is met rather than approached. */
const NAMES_TRIED = 40;
const SOMEWHERE_DOWN = 240;
const SOMEWHERE = "damageDealtApplied|everyone";

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

/**
 * What a position nobody could use costs is the place a reader was at, and nothing more. It used
 * to cost the draw it arrived in — **E14**, **ADR 0051**.
 */
Deno.test("a position no region could be put at is refused, and the kept one stands", () => {
    const kept = composeKeptScrollMemo();
    kept.setTop(SOMEWHERE, SOMEWHERE_DOWN);
    kept.setTop(SOMEWHERE, Number.NaN);
    assertStrictEquals(
        kept.getTop(SOMEWHERE),
        SOMEWHERE_DOWN,
        "a figure that is not one is not kept",
    );
    kept.setTop(SOMEWHERE, -1);
    assertStrictEquals(kept.getTop(SOMEWHERE), SOMEWHERE_DOWN, "and neither is one above the top");
    kept.setTop("", SOMEWHERE_DOWN);
    assertStrictEquals(kept.getTop(""), 0, "a list with no name keeps no place of its own");
});

Deno.test("a region that answers with no position at all leaves the reader where they were", () => {
    const list = composeElementOfClass(CLASS.list);
    list.scrollTop = Number.NaN;
    assertStrictEquals(getTopOfList(list), null, "nothing is read off it");
    list.scrollTop = SOMEWHERE_DOWN;
    setTopOfList(list, Number.NaN);
    assertStrictEquals(
        list.scrollTop,
        SOMEWHERE_DOWN,
        "and nothing that is not a position is put on it",
    );
});

/**
 * A wheel turn belongs to the element it is turning, so the rows move and the region stays. What
 * a browser then does with the turn is `tests/e2e/panel-scroll.spec.ts`'s to say — **ADR 0052**.
 */
Deno.test("the rows are swapped under the reader, and the region they scroll in stays", () => {
    const document = composeFakeDocument();
    const standing = document.createElement("div");
    standing.className = CLASS.list;
    const wasRow = document.createElement("div");
    standing.append(wasRow);
    const next = document.createElement("div");
    next.className = `${CLASS.list} ${CLASS.listWaiting}`;
    const row = document.createElement("div");
    next.append(row);

    assertStrictEquals(setListRowsDrawn(standing, next), true, "both are lists, so the rows move");
    assertEquals(Array.from(standing.children), [row], "the region holds what was drawn for it");
    assertStrictEquals(
        standing.className,
        `${CLASS.list} ${CLASS.listWaiting}`,
        "and wears what the next one was drawn wearing",
    );
});

Deno.test("a region that is not a list is left for the caller to replace", () => {
    const document = composeFakeDocument();
    const slot = document.createElement("div");
    slot.className = CLASS.slot;
    const list = document.createElement("div");
    list.className = CLASS.list;
    const row = document.createElement("div");
    list.append(row);

    assertStrictEquals(setListRowsDrawn(slot, list), false, "a slot is not swapped into");
    assertEquals(Array.from(slot.children), [], "and nothing was moved into it");
    assertStrictEquals(setListRowsDrawn(list, slot), false, "and neither is a slot swapped in");
    assertEquals(
        Array.from(list.children),
        [row],
        "the list still holds the row it was drawn with",
    );
});
