/**
 * A document small enough to read, for a panel that never reaches for one.
 *
 * It answers exactly the surface `src/ui/panel-element.ts` asks for and nothing else, so what a
 * test drives is the panel's own use of a document rather than a browser's implementation of one.
 */

import { assert, assertNotStrictEquals, assertStrictEquals } from "@std/assert";
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
    /**
     * Which pointers were taken hold of on this element and which were let go, in order. A drag
     * keeps its hold across a redraw by taking it again on the bar standing, and this is where a
     * test reads that it did.
     */
    pointersHeld: number[];
    pointersReleased: number[];
}

/** Somewhere down the screen, for a gesture whose test does not care which. */
const SOMEWHERE_DOWN = 100;

/**
 * Puts the pointer on an element, the way a browser would, at whatever the panel is listening for.
 *
 * Only the root's listeners are reachable, because in a browser only they see what was under the
 * pointer: an event inside a shadow root is **retargeted** to the host for anybody listening
 * outside it. This fake once offered a listener on the host as well, handed it the pressed
 * element, and so let a panel that could never work on a page pass every test — found by
 * `deno task preview`.
 */
export function pointAtElement(
    host: FakeElement,
    type: string,
    target: FakeElement | null,
    clientY: number,
    /** Where the pointer went, on the one event that says it left somewhere. */
    went: FakeElement | null = null,
): void {
    const read = (name: string) => target?.attributes.get(name) ?? null;
    const readWent = (name: string) => went?.attributes.get(name) ?? null;
    for (const handle of host.rootListeners.get(type) ?? []) {
        handle({
            target: target === null ? null : { getAttribute: read },
            relatedTarget: went === null ? null : { getAttribute: readWent },
            clientY,
        });
    }
}

export function pressElement(host: FakeElement, type: string, target: FakeElement): void {
    pointAtElement(host, type, target, SOMEWHERE_DOWN);
}

/** The same, with the pointer stated in full, for the one gesture that reads both coordinates. */
export function dragOnElement(
    host: FakeElement,
    type: string,
    target: FakeElement | null,
    at: { clientX: number; clientY: number },
): void {
    const read = (name: string) => target?.attributes.get(name) ?? null;
    for (const handle of host.rootListeners.get(type) ?? []) {
        handle({
            target: target === null ? null : { getAttribute: read },
            clientX: at.clientX,
            clientY: at.clientY,
            pointerId: 1,
            preventDefault: () => {},
        });
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
                // A number, the way a browser answers with one. Nothing here lays anything out,
                // so what a test reads back is exactly what the panel wrote.
                scrollTop: 0,
                children: [],
                attributes: new Map(),
                shadow: null,
                replacedBy: null,
                rootListeners: new Map(),
                pointersHeld: [],
                pointersReleased: [],
                setPointerCapture(pointerId: number): void {
                    element.pointersHeld.push(pointerId);
                },
                releasePointerCapture(pointerId: number): void {
                    element.pointersReleased.push(pointerId);
                },
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
                    assertNotStrictEquals(child, element, "an element never holds itself");
                    element.children.push(child as FakeElement);
                },
                replaceChildren(...children: PanelElement[]): void {
                    element.children = children as FakeElement[];
                },
                setAttribute(name: string, value: string): void {
                    element.attributes.set(name, value);
                },
                attachShadow(): PanelRoot {
                    assertStrictEquals(element.shadow, null, "a root is attached once");
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
