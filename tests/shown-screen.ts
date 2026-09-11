/**
 * A whole view around one reading, so a test says only what it is changing about the panel.
 *
 * Five files spelled the same twenty-line `ShownScreen` literal, and three of them wrote a
 * helper of this name with a signature of its own — so a field added to the interface moved five
 * places, and a default chosen in one of them said nothing about the other four.
 */

import type { ShownScreen } from "@/src/ui/panel-element.ts";
import type { PanelMetric, PanelReading } from "@/src/ui/panel-reading.ts";

/** The name the panel draws its list under where a test is not asking about the name. */
export const SHOWN_LIST = "shown";

export function composeShownScreen(
    reading: PanelReading,
    metric: PanelMetric = "damageDealtApplied",
): ShownScreen {
    return {
        listName: SHOWN_LIST,
        reading,
        current: metric,
        side: "everyone",
        readerSide: null,
        turnHolderId: null,
        shelf: [],
        isOnShelf: false,
        storage: "local",
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
