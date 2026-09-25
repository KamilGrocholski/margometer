/**
 * The shelf list draws one row more than the shelf keeps, and the two bounds are held together.
 *
 * Goal: catch the failure reported on 0.12.1, where a reader with a full shelf started a fight
 * and the whole list went undrawn. Method: compose a shelf of `KEPT_MAXIMUM` kept fights with a
 * live one on top and draw it, plus an arithmetic check that neither constant may move alone.
 * `ui/` never reaches `runtime/`, so this is the one place both may be read at once.
 */

import { assertEquals, assertStrictEquals } from "@std/assert";
import { KEPT_MAXIMUM } from "#/src/runtime/shelf.ts";
import { SHELF_ROWS_MAXIMUM } from "#/src/ui/panel-element.ts";
import { NOTHING_SUSPECT, presentScreen, type ShelfRow } from "#/src/ui/panel-reading.ts";
import { indexCombatantRoster } from "#/src/core/combatant-roster.ts";
import { tallyFightStatistics } from "#/src/core/fight-statistics.ts";
import { composeFakeDocument } from "#/tests/fake-document.ts";
import { composeShownScreen } from "#/tests/shown-screen.ts";
import { initTestView } from "#/tests/panel-view.ts";

Deno.test("the shelf list draws exactly one row more than the shelf keeps", () => {
    assertStrictEquals(
        SHELF_ROWS_MAXIMUM,
        KEPT_MAXIMUM + 1,
        "a fight is kept when it ends, so a full shelf and a live fight is one row past the keep",
    );
});

Deno.test("a full shelf with a fight still running draws, rather than going undrawn", () => {
    const rows = composeFullShelf();
    assertEquals(
        rows.length,
        KEPT_MAXIMUM + 1,
        "the reported case is a shelf one row past keeping",
    );

    const failures: unknown[] = [];
    const document = composeFakeDocument();
    const panel = initTestView(document, { onFailure: (failure) => failures.push(failure) });
    const roster = indexCombatantRoster([]);
    const statistics = tallyFightStatistics([], new Map());
    const reading = presentScreen(
        statistics,
        roster,
        "damageDealtApplied",
        "everyone",
        null,
        NOTHING_SUSPECT,
    );
    const report = panel.render({
        ...composeShownScreen(reading),
        listName: "shelf",
        shelf: rows,
        isOnShelf: true,
    });
    failures.push(...report.undrawn);

    assertEquals(failures, [], "a full shelf with a live fight on it costs the reader no region");
});

/** A full shelf with the fight that is still running on top of it — the reported case. */
function composeFullShelf(): ShelfRow[] {
    const rows = [composeShelfRow(KEPT_MAXIMUM + 1, true)];
    for (let at = 0; at < KEPT_MAXIMUM; at += 1) {
        rows.push(composeShelfRow(at + 1, false));
    }
    return rows;
}

/** One row of the shelf, with only the fields a list reads off it. */
function composeShelfRow(openedAt: number, isLive: boolean): ShelfRow {
    return {
        openedAt,
        at: { day: 13, month: 9, hour: 12, minute: 0 },
        sizes: [1, 1],
        place: null,
        outcome: null,
        isLive,
        isChosen: isLive,
        isPinned: false,
        isPinnable: !isLive,
    };
}
