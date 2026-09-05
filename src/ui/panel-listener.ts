/**
 * The one place a listener is handed to the browser, and the guard on it (**E12**). The browser
 * calls it, so a throw out of `handle` unwinds into a dispatch loop that drops it: the gesture
 * does nothing and no mark reaches anybody. What the mark is belongs to the caller.
 */

import type { PanelEvent, PanelRoot } from "@/src/ui/panel-element.ts";

export function setGuardedListener(
    root: PanelRoot,
    type: string,
    handle: (event: PanelEvent) => void,
    handleFailure: (failure: unknown) => void,
): void {
    root.addEventListener(type, (event) => {
        try {
            handle(event);
        } catch (failure) {
            handleFailure(failure);
        }
    });
}
