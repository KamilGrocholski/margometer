/**
 * The shelf list draws one row more than the shelf keeps, and the two bounds are held together.
 *
 * Goal: catch the failure reported on 0.12.1, where a reader with a full shelf started a fight
 * and the whole list went undrawn. Method: compose a shelf of `MAXIMUM_KEPT` kept fights with a
 * live one on top and draw it, plus an arithmetic check that neither constant may move alone.
 * `ui/` never reaches `game/`, so this is the one place both may be read at once.
 */

import { assertEquals, assertStrictEquals } from "@std/assert";
import { MAXIMUM_KEPT } from "@/src/game/kept-fights.ts";
import { composePanelHost, MAXIMUM_SHELF_ROWS } from "@/src/ui/panel-element.ts";
import { composePanelReading, NOTHING_MISSED, type ShelfRow } from "@/src/ui/panel-reading.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import { composeFakeDocument } from "@/tests/fake-document.ts";

/** One row of the shelf, with only the fields a list reads off it. */
function composeShelfRow(openedAt: number, isLive: boolean): ShelfRow {
    return {
        openedAt,
        at: { hour: 12, minute: 0 },
        sizes: [1, 1],
        place: null,
        outcome: null,
        isLive,
        isChosen: isLive,
        isPinned: false,
        isPinnable: !isLive,
    };
}

/** A full shelf with the fight that is still running on top of it — the reported case. */
function composeFullShelf(): ShelfRow[] {
    const rows = [composeShelfRow(MAXIMUM_KEPT + 1, true)];
    for (let at = 0; at < MAXIMUM_KEPT; at += 1) {
        rows.push(composeShelfRow(at + 1, false));
    }
    return rows;
}

Deno.test("the shelf list draws exactly one row more than the shelf keeps", () => {
    assertStrictEquals(
        MAXIMUM_SHELF_ROWS,
        MAXIMUM_KEPT + 1,
        "a fight is kept when it ends, so a full shelf and a live fight is one row past the keep",
    );
});

Deno.test("a full shelf with a fight still running draws, rather than going undrawn", () => {
    const rows = composeFullShelf();
    assertEquals(
        rows.length,
        MAXIMUM_KEPT + 1,
        "the reported case is a shelf one row past keeping",
    );

    const failures: unknown[] = [];
    const document = composeFakeDocument();
    const panel = composePanelHost(
        document,
        () => {},
        (failure) => failures.push(failure),
        null,
        null,
    );
    const roster = composeCombatantRoster([]);
    const statistics = composeFightStatistics([], new Map());
    const reading = composePanelReading(
        statistics,
        roster,
        "damageDealtApplied",
        "everyone",
        null,
        NOTHING_MISSED,
    );
    panel.show({
        listName: "shelf",
        reading,
        current: "damageDealtApplied",
        side: "everyone",
        hasReaderSide: false,
        shelf: rows,
        isOnShelf: true,
        storage: "local",
        shelfWarnings: [],
        drill: null,
        pair: null,
        part: null,
        halfNamed: null,
        halfNamedDrill: null,
        place: null,
        isCollapsed: false,
    });

    assertEquals(failures, [], "a full shelf with a live fight on it costs the reader no region");
});
