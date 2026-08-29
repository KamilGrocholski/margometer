/**
 * A document small enough to read, for a panel that never reaches for one.
 *
 * It answers exactly the surface `src/ui/panel-element.ts` asks for and nothing else, so what a
 * test drives is the panel's own use of a document rather than a browser's implementation of one.
 */

import { assert } from "@std/assert";
import type { PanelDocument, PanelElement, PanelEvent, PanelRoot } from "@/src/ui/panel-element.ts";

export interface FakeElement extends PanelElement {
    tag: string;
    children: FakeElement[];
    attributes: Map<string, string>;
    shadow: FakeElement[] | null;
    /** What replaced this one, so a test can see a panel give way rather than pile up. */
    replacedBy: FakeElement | null;
    /** The listeners the panel put on its root, by type, so a test can press what a reader does. */
    rootListeners: Map<string, ((event: PanelEvent) => void)[]>;
}

/**
 * Presses the element, the way a pointer would, at whatever the panel is listening for.
 *
 * Only the root's listeners are reachable, because in a browser only they see what was pressed:
 * a press inside a shadow root is **retargeted** to the host for anybody listening outside it.
 * This fake once offered a listener on the host as well, handed it the pressed element, and so
 * let a panel that could never work on a page pass every test — found by `deno task preview`.
 */
export function pressElement(host: FakeElement, type: string, target: FakeElement): void {
    for (const handle of host.rootListeners.get(type) ?? []) {
        handle({ target: { getAttribute: (name) => target.attributes.get(name) ?? null } });
    }
}

export function composeFakeDocument(): PanelDocument & { created: FakeElement[] } {
    const created: FakeElement[] = [];
    return {
        created,
        createElement(tag: string): FakeElement {
            const element: FakeElement = {
                tag,
                className: "",
                textContent: "",
                children: [],
                attributes: new Map(),
                shadow: null,
                replacedBy: null,
                rootListeners: new Map(),
                replaceWith(other: PanelElement): void {
                    element.replacedBy = other as FakeElement;
                    for (const parent of created) {
                        const at = parent.children.indexOf(element);
                        if (at !== -1) parent.children[at] = other as FakeElement;
                        const inside = parent.shadow?.indexOf(element) ?? -1;
                        if (inside !== -1) parent.shadow?.splice(inside, 1, other as FakeElement);
                    }
                },
                append(child: PanelElement): void {
                    assert(child !== element, "an element never holds itself");
                    element.children.push(child as FakeElement);
                },
                setAttribute(name: string, value: string): void {
                    element.attributes.set(name, value);
                },
                attachShadow(): PanelRoot {
                    assert(element.shadow === null, "a root is attached once");
                    const inside: FakeElement[] = [];
                    element.shadow = inside;
                    return {
                        append: (child) => inside.push(child as FakeElement),
                        addEventListener(type: string, handle: (event: PanelEvent) => void): void {
                            const held = element.rootListeners.get(type) ?? [];
                            element.rootListeners.set(type, [...held, handle]);
                        },
                    };
                },
            };
            created.push(element);
            return element;
        },
    };
}

/** Every element under one, itself included, so a test can ask what was drawn anywhere. */
export function getElementsWithin(element: FakeElement): FakeElement[] {
    // In the order they were drawn, because a test that asks what the first row says means the
    // first row on screen.
    const found: FakeElement[] = [element];
    let at = 0;
    while (at < found.length) {
        const next = found[at];
        at += 1;
        if (next === undefined) break;
        for (const child of next.children) found.push(child);
        for (const child of next.shadow ?? []) found.push(child);
        assert(found.length <= 4096, "the walk stays inside its bound");
    }
    return found;
}

export function getTextsByClass(element: FakeElement, className: string): string[] {
    return getElementsWithin(element)
        .filter((one) => one.className === className)
        .map((one) => one.textContent);
}
