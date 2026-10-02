/**
 * A document small enough to read, for a panel that never reaches for one.
 *
 * It answers exactly the surface `src/ui/panel-element.ts` asks for and nothing else, so what a
 * test drives is the panel's own use of a document rather than a browser's implementation of one.
 */

import { assert, assertExists, assertNotStrictEquals, assertStrictEquals } from "@std/assert";
import type {
    PanelDocument,
    PanelElement,
    PanelEvent,
    PanelRoot,
    PanelTarget,
} from "#/src/ui/panel-document.ts";

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
 *
 * A listener is handed the element itself, as a browser hands a node: the back listener asks
 * the window beside the panel whether it holds what was pressed, and a stand-in carrying
 * `getAttribute` alone answers that question for nobody.
 */
export function pointAtElement(
    host: FakeElement,
    type: string,
    target: FakeElement | null,
    clientY: number,
    /** Where the pointer went, on the one event that says it left somewhere. */
    went: FakeElement | null = null,
): void {
    for (const handle of host.rootListeners.get(type) ?? []) {
        handle({ target, relatedTarget: went, clientY });
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
    pointer: { clientX: number; clientY: number },
): void {
    for (const handle of host.rootListeners.get(type) ?? []) {
        handle({
            target,
            clientX: pointer.clientX,
            clientY: pointer.clientY,
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
            const fakeElement: FakeElement = {
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
                    fakeElement.pointersHeld.push(pointerId);
                },
                releasePointerCapture(pointerId: number): void {
                    fakeElement.pointersReleased.push(pointerId);
                },
                replaceWith(replacement: PanelElement): void {
                    fakeElement.replacedBy = replacement as FakeElement;
                    for (const parent of created) {
                        const childIndex = parent.children.indexOf(fakeElement);
                        if (childIndex !== -1) {
                            parent.children[childIndex] = replacement as FakeElement;
                        }
                        const inside = parent.shadow?.indexOf(fakeElement) ?? -1;
                        if (inside !== -1) {
                            parent.shadow?.splice(inside, 1, replacement as FakeElement);
                        }
                    }
                },
                append(child: PanelElement): void {
                    assertNotStrictEquals(child, fakeElement, "an element never holds itself");
                    fakeElement.children.push(child as FakeElement);
                },
                replaceChildren(...children: PanelElement[]): void {
                    fakeElement.children = children as FakeElement[];
                },
                setAttribute(name: string, attributeValue: string): void {
                    fakeElement.attributes.set(name, attributeValue);
                },
                getAttribute(name: string): string | null {
                    return fakeElement.attributes.get(name) ?? null;
                },
                contains(target: PanelTarget | null): boolean {
                    if (target === null) return false;
                    return getElementsWithin(fakeElement).some((descendant) =>
                        descendant === target
                    );
                },
                attachShadow(): PanelRoot {
                    assertStrictEquals(fakeElement.shadow, null, "a root is attached once");
                    const inside: FakeElement[] = [];
                    fakeElement.shadow = inside;
                    return {
                        append: (child) => inside.push(child as FakeElement),
                        addEventListener(type: string, handle: (event: PanelEvent) => void): void {
                            const held = fakeElement.rootListeners.get(type) ?? [];
                            fakeElement.rootListeners.set(type, [...held, handle]);
                        },
                    };
                },
            };
            created.push(fakeElement);
            return fakeElement;
        },
    };
}

/** Every element under one, itself included, so a test can ask what was drawn anywhere. */
export function getElementsWithin(root: FakeElement): FakeElement[] {
    // In the order they were drawn, because a test that asks what the first row says means the
    // first row on screen.
    const elementsWithin: FakeElement[] = [root];
    let walkIndex = 0;
    while (walkIndex < elementsWithin.length) {
        const visited = elementsWithin[walkIndex];
        walkIndex += 1;
        if (visited === undefined) break;
        for (const child of visited.children) elementsWithin.push(child);
        for (const child of visited.shadow ?? []) elementsWithin.push(child);
        assert(elementsWithin.length <= 4096, "the walk stays inside its bound");
    }
    return elementsWithin;
}

/**
 * The panel's own frame under the host, apart from the card and the window beside it. A test that
 * asks what the panel drew means the panel: three of its four root children draw rows of the same
 * class, and counting them together says the panel drew what somebody else did.
 */
export function getPanelWithin(host: FakeElement): FakeElement {
    // Folded, the frame wears a second class, and a test asking what it drew still means it.
    const frame = getElementsWithin(host)
        .find((descendant) => descendant.className.split(" ")[0] === "MargoMeter-body");
    assertExists(frame, "the host carries the panel's own frame");
    return frame;
}

export function getTextsByClass(root: FakeElement, className: string): string[] {
    return getElementsWithin(root)
        .filter((descendant) => descendant.className === className)
        .map((descendant) => descendant.textContent);
}

/**
 * Each element's text as a browser reads it — its own, then everything under it — for an element
 * built of parts. `getTextsByClass` reads the element's own text alone, which a figure beside its
 * share relies on.
 */
export function getWholeTextsByClass(root: FakeElement, className: string): string[] {
    return getElementsWithin(root)
        .filter((descendant) => descendant.className === className)
        .map(readTextWithin);
}

/** Depth first, as a document is read: a walk across would put a cousin before a child's child. */
function readTextWithin(root: FakeElement): string {
    const waiting: FakeElement[] = [root];
    let text = "";
    let walked = 0;
    while (waiting.length > 0) {
        const visited = waiting.pop();
        if (visited === undefined) break;
        text += visited.textContent;
        for (let childIndex = visited.children.length - 1; childIndex >= 0; childIndex -= 1) {
            const child = visited.children[childIndex];
            if (child !== undefined) waiting.push(child);
        }
        walked += 1;
        assert(walked <= 4096, "the walk stays inside its bound");
    }
    return text;
}
