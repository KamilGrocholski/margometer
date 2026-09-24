/**
 * The card a row opens, read back out of the root it stands in.
 *
 * Shared because two suites open one: the panel's rows and the rows of the window beside it
 * (`develop ADR 0098`). It reads a drawn card and composes nothing, so what a test asserts against
 * is what a reader would have met.
 */

import { assertExists } from "@std/assert";
import { type FakeElement, getElementsWithin, getTextsByClass } from "@/tests/fake-document.ts";
import { CLASS } from "@/src/ui/panel-look.ts";

/** One line of the card as a reader meets it: what it is of, what it says, and how it is drawn. */
export interface TipLineRead {
    label: string;
    value: string;
    isStrong: boolean;
    isSub: boolean;
}

export interface TipRead {
    className: string;
    name: string[];
    subtitle: string[];
    notes: string[];
    headings: string[];
    groups: number;
    lines: string[];
    stated: TipLineRead[];
}

/** Whatever the detail is saying right now, read back out of the root it stands in. */
export function readTip(host: FakeElement): TipRead {
    const tip = (host.shadow ?? []).find((one) => one.className.startsWith(CLASS.tip));
    assertExists(tip, "the detail is a region of the panel like any other");
    const name = getTextsByClass(tip, CLASS.tipName);
    return {
        className: tip.className,
        name,
        subtitle: getTextsByClass(tip, CLASS.tipSubtitle),
        // By the class among its classes, not by the whole attribute: a note carrying a tone
        // wears a second class, and an exact match read past every suspicion the panel drew.
        notes: getElementsWithin(tip)
            .filter((one) => one.className.split(" ").includes(CLASS.tipNote))
            .map((one) => one.textContent),
        headings: getTextsByClass(tip, CLASS.tipHeading),
        groups: getElementsWithin(tip).filter((one) => one.className === CLASS.tipGroup).length,
        lines: [
            ...name,
            ...getTextsByClass(tip, CLASS.tipLabel),
            ...getTextsByClass(tip, CLASS.tipValue),
        ],
        stated: getElementsWithin(tip)
            .filter((one) => one.className.startsWith(CLASS.tipLine))
            .map((one) => ({
                label: getTextsByClass(one, CLASS.tipLabel)[0] ?? "",
                value: getTextsByClass(one, CLASS.tipValue)[0] ?? "",
                isStrong: one.className.includes(CLASS.tipStrong),
                isSub: one.className.includes(CLASS.tipSub),
            })),
    };
}
