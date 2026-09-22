/**
 * The one thing this add-on puts **outside** itself, and the whole of it: rows of ours appended
 * to the tooltip the game already shows for a fighter, one call to the client's own `concatTip`
 * per row.
 *
 * That registry holds tooltips as strings, so no node is made, moved or styled, and the game
 * rewrites it on the next payload — a detach leaves nothing behind. **ADR 0105.**
 */

import { assert } from "@std/assert/assert";
import { isRecord } from "@/libs/unknown-reading.ts";
import { MAXIMUM_COMBATANTS } from "@/src/core/combatant-roster.ts";
import { readBattleFromPage } from "@/src/game/engine-attachment.ts";
import { readLiveWarriors, WARRIOR_FIELDS } from "@/src/game/engine-warrior.ts";
import { getNumberFromUnknown } from "@/libs/unknown-reading.ts";

/**
 * What the client calls the things this file uses, spelled here and nowhere else (**N13**). Read
 * on production build `Bb28FQty`, 2026-09-21: a warrior keeps its own element under `$`;
 * `createWarriorTip` hangs the tooltip on those three, and `concatTip` adds to one.
 *
 * ⚠️ **A renamed method here fails silently** — no row appears and nothing throws.
 */
const WARRIOR_ELEMENT_FIELD = "$";
const TOOLTIP_TARGETS = ".canvas-warrior-icon, .grave-warrior-other, .grave-warrior-npc";
const FIND_METHOD = "find";
const APPEND_METHOD = "concatTip";

/** How many fighters a block reached, so the entry can mark a payload that reached nobody. */
export interface TooltipWriting {
    written: number;
    asked: number;
}

/**
 * Past the rows one block has come to, and stated where they cross out of this program. Spelled
 * here rather than imported, because `game/` reaches into no `ui/` module — and held level with
 * the composer's own bound by `tests/game/engine-tooltip.test.ts`, which can import both.
 */
export const MAXIMUM_ROWS_WRITTEN = 20;

/** A jQuery object of the client's, narrowed to the two calls this file makes of it. */
interface TooltipTarget {
    find(selector: string): { concatTip(content: string): void };
}

function isTooltipTarget(value: unknown): value is TooltipTarget {
    if (!isRecord(value)) return false;
    return typeof value[FIND_METHOD] === "function";
}

/**
 * ⚠️ **The break between the rows is the client's own**: `concatTip` writes
 * `allTips[id] + "<br>" + row`, so a block costs this add-on no markup at all — which is what
 * keeps `SECURITY.md`'s _no node is made, moved, removed or styled_ true word for word. Read on
 * production build `Bb28FQty`, 2026-09-21.
 */
function writeRowsToWarrior(warrior: Record<string, unknown>, rows: readonly string[]): boolean {
    assert(rows.length <= MAXIMUM_ROWS_WRITTEN, "a block handed over is a stated length");
    const held = warrior[WARRIOR_ELEMENT_FIELD];
    if (!isTooltipTarget(held)) return false;
    const targets = held.find(TOOLTIP_TARGETS);
    if (!isRecord(targets)) return false;
    if (typeof targets[APPEND_METHOD] !== "function") return false;
    for (const row of rows) {
        targets.concatTip(row);
    }
    return true;
}

/**
 * A block onto every fighter one was composed for. Guarded whole: a throw of theirs becomes a
 * payload that added nothing and never an exception into the engine's own call stack (**E5**).
 *
 * **Written and never read back.** What the tooltip now says is the game's.
 */
export function writeRowsToTooltips(
    page: unknown,
    rowsByCombatantId: ReadonlyMap<number, readonly string[]>,
): TooltipWriting {
    const asked = rowsByCombatantId.size;
    assert(asked <= MAXIMUM_COMBATANTS, "no more blocks than a fight puts combatants on a board");
    let written = 0;
    try {
        const battle = readBattleFromPage(page);
        if (battle === null) return { written, asked };
        for (const warrior of readLiveWarriors(battle)) {
            const id = getNumberFromUnknown(warrior[WARRIOR_FIELDS.identity]);
            if (id === null) continue;
            const rows = rowsByCombatantId.get(id);
            if (rows === undefined) continue;
            if (rows.length === 0) continue;
            if (writeRowsToWarrior(warrior, rows)) written += 1;
        }
    } catch {
        return { written, asked };
    }
    assert(written <= asked, "no more blocks landed than were composed");
    return { written, asked };
}
