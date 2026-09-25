/**
 * The one place a listener is handed to the browser, and the guard on it (`AGENTS.md` E10). The
 * browser calls it, so a throw out of `handle` unwinds into a dispatch loop that drops it: the
 * gesture does nothing and no mark reaches anybody. The guard turns it into a dropped gesture.
 */

import { runGuarded } from "#/libs/result.ts";
import type { PanelEvent, PanelRoot } from "./panel-document.ts";
import {
    type PanelListener,
    reportViewFailure,
    VIEW_FAILURE,
    type ViewFailure,
} from "./view-failure.ts";

export function addGuardedListener(
    root: PanelRoot,
    type: string,
    listener: PanelListener,
    handle: (event: PanelEvent) => void,
    onFailure: (failure: ViewFailure) => void,
): void {
    root.addEventListener(type, (event) => {
        const handled = runGuarded(() => handle(event));
        if (handled.ok) return;
        const cause = handled.error.cause;
        reportViewFailure(onFailure, { kind: VIEW_FAILURE.gestureDropped, listener, cause });
    });
}
