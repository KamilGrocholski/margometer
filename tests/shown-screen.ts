/**
 * A whole view around one reading, so a test says only what it is changing about the panel.
 *
 * Five files spelled the same twenty-line `ShownScreen` literal, and three of them wrote a
 * helper of this name with a signature of its own — so a field added to the interface moved five
 * places, and a default chosen in one of them said nothing about the other four.
 */

import { NO_WINDOW_SIZES, TYPE_STEP_DEFAULT } from "#/src/ui/panel-choice.ts";
import type { ShownScreen } from "#/src/ui/panel-element.ts";
import type { ScreenContent } from "#/src/ui/panel-content.ts";
import { PANEL_METRIC, type PanelMetric, SIDE_CHOICE } from "#/src/ui/panel-screen.ts";

/** The name the panel draws its list under where a test is not asking about the name. */
export const SHOWN_LIST = "shown";

export function composeShownScreen(
    reading: ScreenContent,
    metric: PanelMetric = PANEL_METRIC.damageDealt,
): ShownScreen {
    return {
        listName: SHOWN_LIST,
        ranking: reading,
        metric: metric,
        side: SIDE_CHOICE.everyone,
        readerSide: null,
        turnHolderId: null,
        shelf: [],
        isOnShelf: false,
        options: null,
        typeStep: TYPE_STEP_DEFAULT,
        windowSizes: NO_WINDOW_SIZES,
        hasFightToSave: true,
        shelfAnswers: [],
        defects: [],
        opened: null,
        pair: null,
        part: null,
        unnamed: null,
        unnamedCut: null,
        fightPlace: null,
        card: {
            sizes: reading.sizes,
            unplaced: reading.unplaced,
            outcome: reading.outcome,
            isLive: false,
            at: null,
            place: null,
            world: null,
            reader: null,
        },
        isMeterCollapsed: false,
    };
}
