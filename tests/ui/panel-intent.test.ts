/**
 * What a press asks for, read off the marks the panel writes: every mark to the intent it states,
 * and a mark of ours stating a value nothing of ours writes to a failure rather than a guess.
 */

import { assertEquals } from "@std/assert";
import { err, ok } from "#/libs/result.ts";
import { PANEL_WINDOW, STORAGE_CHOICE } from "#/src/ui/panel-choice.ts";
import type { PanelTarget } from "#/src/ui/panel-document.ts";
import {
    INTENT_FAILURE,
    LIVE_FIGHT_MARK,
    PANEL_INTENT,
    PANEL_MARK,
    PLAIN_MARK,
    readPanelIntent,
} from "#/src/ui/panel-intent.ts";
import { UNNAMED_END } from "#/src/ui/panel-reading.ts";
import { OPENED_PART, PANEL_METRIC, SIDE_CHOICE } from "#/src/ui/panel-screen.ts";

Deno.test("every mark the panel writes states the intent the runtime is handed", () => {
    const cases = [
        [PANEL_MARK.screen, PANEL_METRIC.healthGiven, {
            kind: PANEL_INTENT.metric,
            metric: PANEL_METRIC.healthGiven,
        }],
        [PANEL_MARK.side, SIDE_CHOICE.opposing, {
            kind: PANEL_INTENT.side,
            side: SIDE_CHOICE.opposing,
        }],
        [PANEL_MARK.row, "-255967", { kind: PANEL_INTENT.openRow, combatantId: -255967 }],
        [PANEL_MARK.unnamed, UNNAMED_END.target, {
            kind: PANEL_INTENT.openUnnamed,
            end: UNNAMED_END.target,
        }],
        [PANEL_MARK.skill, "Dotyk anioła", {
            kind: PANEL_INTENT.openPart,
            part: { kind: OPENED_PART.skill, name: "Dotyk anioła" },
        }],
        [PANEL_MARK.source, "poison", {
            kind: PANEL_INTENT.openPart,
            part: { kind: OPENED_PART.source, source: "poison" },
        }],
        [PANEL_MARK.kind, "fire", {
            kind: PANEL_INTENT.openPart,
            part: { kind: OPENED_PART.element, element: "fire" },
        }],
        [PANEL_MARK.plain, PLAIN_MARK, {
            kind: PANEL_INTENT.openPart,
            part: { kind: OPENED_PART.plain },
        }],
        [PANEL_MARK.fight, LIVE_FIGHT_MARK, { kind: PANEL_INTENT.showLive }],
        [PANEL_MARK.fight, "1790000000000", {
            kind: PANEL_INTENT.showKept,
            openedAt: 1790000000000,
        }],
        [PANEL_MARK.pin, "1790000000000", { kind: PANEL_INTENT.pin, openedAt: 1790000000000 }],
        [PANEL_MARK.storage, STORAGE_CHOICE.session, {
            kind: PANEL_INTENT.storage,
            choice: STORAGE_CHOICE.session,
        }],
        [PANEL_MARK.helperFold, "", { kind: PANEL_INTENT.fold, window: PANEL_WINDOW.helper }],
        [PANEL_MARK.save, "", { kind: PANEL_INTENT.saveFile }],
        [PANEL_MARK.shelf, "", { kind: PANEL_INTENT.shelf }],
        [PANEL_MARK.fold, "", { kind: PANEL_INTENT.fold, window: PANEL_WINDOW.panel }],
        [PANEL_MARK.back, "", { kind: PANEL_INTENT.close }],
    ] as const;
    for (const [mark, value, intent] of cases) {
        assertEquals(readMark(mark, value), ok(intent), `${mark}="${value}"`);
    }
    // **W5**: the first id there is reads as one, and is not taken for nothing.
    assertEquals(readMark(PANEL_MARK.row, "0"), ok({ kind: PANEL_INTENT.openRow, combatantId: 0 }));
});

function readMark(name: string, value: string) {
    return readPanelIntent(composeTarget({ [name]: value }));
}

function composeTarget(marks: Record<string, string>): PanelTarget {
    return { getAttribute: (name) => marks[name] ?? null };
}

Deno.test("a value no mark of ours writes is a failure naming the mark, never a default", () => {
    const strays = [
        [PANEL_MARK.screen, "damage"],
        [PANEL_MARK.side, "ours"],
        [PANEL_MARK.row, "Gracz 1"],
        [PANEL_MARK.unnamed, "both"],
        [PANEL_MARK.fight, "yesterday"],
        [PANEL_MARK.pin, ""],
        [PANEL_MARK.storage, "disk"],
    ] as const;
    for (const [mark, value] of strays) {
        assertEquals(
            readMark(mark, value),
            err({ kind: INTENT_FAILURE.markUnknown, mark }),
            `${mark}="${value}"`,
        );
    }
});

Deno.test("a press on nothing of ours asks for nothing; marks are read in develop's order", () => {
    assertEquals(readPanelIntent(composeTarget({})), ok(null), "an unmarked element");
    const node = { getAttribute: undefined } as unknown as PanelTarget;
    assertEquals(readPanelIntent(node), ok(null), "and a node that states no attributes at all");
    // Two marks on one node are read in `develop`'s order: the row before the way back.
    const both = composeTarget({ [PANEL_MARK.row]: "7", [PANEL_MARK.back]: "" });
    assertEquals(readPanelIntent(both), ok({ kind: PANEL_INTENT.openRow, combatantId: 7 }));
});
