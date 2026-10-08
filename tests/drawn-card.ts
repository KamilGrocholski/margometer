/**
 * The card a row opens, read back out of the root it stands in.
 *
 * Shared because two suites open one: the panel's rows and the rows of the window beside it
 * (`develop ADR 0098`). It reads a drawn card and composes nothing, so what a test asserts against
 * is what a reader would have met.
 */

import { assertExists } from "@std/assert";
import {
    type FakeElement,
    getElementsWithin,
    getTextsByClass,
    getWholeTextsByClass,
} from "./fake-document.ts";
import { CLASS } from "#/src/ui/panel-look.ts";

/** One line of the card as a reader meets it: what it is of, what it says, and how it is drawn. */
export interface CardLineRead {
    label: string;
    value: string;
    isStrong: boolean;
    isSub: boolean;
}

export interface CardRead {
    className: string;
    name: string[];
    subtitle: string[];
    notes: string[];
    headings: string[];
    groups: number;
    lines: string[];
    stated: CardLineRead[];
}

/** Whatever the detail is saying right now, read back out of the root it stands in. */
export function readCard(host: FakeElement): CardRead {
    const card = (host.shadow ?? []).find((child) => child.className.startsWith(CLASS.card));
    assertExists(card, "the detail is a region of the panel like any other");
    // Whole, because a fight's card draws how it went as a box of its own inside one of the two.
    const name = getWholeTextsByClass(card, CLASS.cardName);
    return {
        className: card.className,
        name,
        subtitle: getWholeTextsByClass(card, CLASS.cardSubtitle),
        // By the class among its classes, not by the whole attribute: a note carrying a tone
        // wears a second class, and an exact match read past every suspicion the panel drew.
        notes: getElementsWithin(card)
            .filter((drawn) => drawn.className.split(" ").includes(CLASS.cardNote))
            .map((note) => note.textContent),
        headings: getTextsByClass(card, CLASS.cardHeading),
        groups:
            getElementsWithin(card).filter((drawn) => drawn.className === CLASS.cardGroup).length,
        lines: [
            ...name,
            ...getTextsByClass(card, CLASS.cardLabel),
            ...getTextsByClass(card, CLASS.cardValue),
        ],
        stated: getElementsWithin(card)
            .filter((drawn) => drawn.className.startsWith(CLASS.cardLine))
            .map((line) => ({
                label: getTextsByClass(line, CLASS.cardLabel)[0] ?? "",
                value: getTextsByClass(line, CLASS.cardValue)[0] ?? "",
                isStrong: line.className.includes(CLASS.cardStrong),
                isSub: line.className.includes(CLASS.cardSub),
            })),
    };
}
