/**
 * What the panel could not do, as records the runtime counts (`docs/design.md` §9, §10.5). A
 * region that would not draw is reported by the render that tried it; a gesture, a card opened
 * under the pointer and a window that would not open where it was told are reported to the sink
 * the view was handed, because nothing called by the runtime was running when they failed.
 */

import { runGuarded } from "@/libs/result.ts";
import type { VocabularyWord } from "@/libs/vocabulary.ts";
import type { PanelWindow } from "@/src/ui/panel-choice.ts";
import type { PanelRegion } from "@/src/ui/panel-words.ts";

export const VIEW_FAILURE = {
    regionUndrawn: "region-undrawn",
    gestureDropped: "gesture-dropped",
    windowUnplaced: "window-unplaced",
} as const;

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

export type RenderFailure = {
    kind: typeof VIEW_FAILURE.regionUndrawn;
    region: PanelRegion;
    cause: unknown;
};

export type GestureFailure = {
    kind: typeof VIEW_FAILURE.gestureDropped;
    listener: PanelListener;
    cause: unknown;
};

export type PlacementFailure = {
    kind: typeof VIEW_FAILURE.windowUnplaced;
    window: PanelWindow;
    cause: unknown;
};

export type ViewFailure = RenderFailure | GestureFailure | PlacementFailure;

/** A region that could not draw stands undrawn in place. */
export interface RenderReport {
    undrawn: readonly RenderFailure[];
}

/** The sink the runtime hands the view. A sink that throws has nobody left to tell. */
export function reportViewFailure(
    onFailure: (failure: ViewFailure) => void,
    failure: ViewFailure,
): void {
    void runGuarded(() => onFailure(failure));
}
