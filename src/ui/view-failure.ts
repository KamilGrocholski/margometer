/**
 * What the panel could not do, as records the runtime counts (`docs/design.md` §9, §10.5). A
 * region that would not draw is reported by the render that tried it; a gesture, a card opened
 * under the pointer and a window that would not open where it was told are reported to the sink
 * the view was handed, because nothing called by the runtime was running when they failed.
 */

import * as errors from "#/libs/errors.ts";
import type { VocabularyWord } from "#/libs/vocabulary.ts";
import type { PanelWindow } from "./panel-choice.ts";
import type { PanelRegion } from "./panel-words.ts";

/** Which of the view's listeners dropped a gesture. */
export const PANEL_LISTENER = {
    press: "press",
    back: "back",
    hover: "hover",
    leave: "leave",
    grab: "grab",
    drag: "drag",
    release: "release",
    cancel: "cancel",
    capture: "capture",
} as const;
export type PanelListener = VocabularyWord<typeof PANEL_LISTENER>;

export class RegionUndrawn extends Error {
    override readonly name = "RegionUndrawn";
    readonly region: PanelRegion;

    constructor(region: PanelRegion, cause: unknown) {
        super(undefined, { cause });
        this.region = region;
    }
}

export class GestureDropped extends Error {
    override readonly name = "GestureDropped";
    readonly listener: PanelListener;

    constructor(listener: PanelListener, cause: unknown) {
        super(undefined, { cause });
        this.listener = listener;
    }
}

export class WindowUnplaced extends Error {
    override readonly name = "WindowUnplaced";
    readonly window: PanelWindow;

    constructor(window: PanelWindow, cause: unknown) {
        super(undefined, { cause });
        this.window = window;
    }
}

export type ViewFailure = RegionUndrawn | GestureDropped | WindowUnplaced;

/** A region that could not draw stands undrawn in place. */
export interface RenderReport {
    undrawn: readonly RegionUndrawn[];
}

/** The sink the runtime hands the view. A sink that throws has nobody left to tell. */
export function reportViewFailure(
    onFailure: (failure: ViewFailure) => void,
    failure: ViewFailure,
): void {
    void errors.attempt(() => onFailure(failure));
}
