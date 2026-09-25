/**
 * A panel view for a test, with every option a test is not asking about left quiet: no window
 * that moves, the panel's own words, and nobody listening for what it asks or could not do.
 */

import {
    initPanelView,
    type PanelView,
    type PanelViewOptions,
    type WaitingReading,
} from "#/src/ui/panel-element.ts";
import type { PanelDocument } from "#/src/ui/panel-document.ts";

/** The build a test's panel says drew it. */
export const TEST_VERSION = "0.0.0-test";

/** Waiting with nothing to say, which is the panel before its first fight. */
export const NOTHING_WAITING: WaitingReading = {
    isCollapsed: false,
    defects: [],
    hasFightToSave: false,
    isFightUnread: false,
};

export function initTestView(
    document: PanelDocument,
    options: Partial<PanelViewOptions> = {},
): PanelView {
    return initPanelView(document, {
        version: TEST_VERSION,
        onIntent: () => {},
        onFailure: () => {},
        placement: null,
        standingPlacement: null,
        translate: null,
        ...options,
    });
}
