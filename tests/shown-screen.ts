/**
 * A whole view around one reading, so a test says only what it is changing about the panel.
 *
 * Five files spelled the same twenty-line `ShownScreen` literal, and three of them wrote a
 * helper of this name with a signature of its own — so a field added to the interface moved five
 * places, and a default chosen in one of them said nothing about the other four.
 */

import { STORAGE_CHOICE } from "@/src/ui/panel-choice.ts";
import type { ShownScreen } from "@/src/ui/panel-element.ts";
import type { ScreenReading } from "@/src/ui/panel-reading.ts";
import { PANEL_METRIC, type PanelMetric, SIDE_CHOICE } from "@/src/ui/panel-screen.ts";

/** The name the panel draws its list under where a test is not asking about the name. */
export const SHOWN_LIST = "shown";

export function composeShownScreen(
    reading: ScreenReading,
    metric: PanelMetric = PANEL_METRIC.damageDealtApplied,
): ShownScreen {
    return {
        listName: SHOWN_LIST,
        reading,
        current: metric,
        side: SIDE_CHOICE.everyone,
        readerSide: null,
        turnHolderId: null,
        shelf: [],
        isOnShelf: false,
        storage: STORAGE_CHOICE.local,
        hasFightToSave: true,
        shelfAnswers: [],
        defects: [],
        drill: null,
        pair: null,
        part: null,
        halfNamed: null,
        halfNamedDrill: null,
        place: null,
        isCollapsed: false,
    };
}
