/**
 * The one place a listener is handed to the browser, and the guard on it (`AGENTS.md` E10). The
 * browser calls it, so a throw out of `handle` unwinds into a dispatch loop that drops it: the
 * gesture does nothing and no mark reaches anybody. The guard turns it into a dropped gesture.
 */

import * as errors from "#/libs/errors.ts";
import type { PanelEvent, PanelRoot } from "./panel-document.ts";
import {
    GestureDropped,
    type PanelListener,
    reportViewFailure,
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
        const handled = errors.attempt(() => handle(event));
        if (!(handled instanceof Error)) return;
        reportViewFailure(onFailure, new GestureDropped(listener, handled));
    });
}
