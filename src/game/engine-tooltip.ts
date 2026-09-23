/**
 * The one thing this add-on puts **outside** itself, and the whole of it: rows of ours appended
 * to the tooltip the game already shows for a fighter, through the client's own methods.
 *
 * That registry holds tooltips as strings, so no node is made, moved or styled, and the game
 * rewrites a fighter's entry whenever it updates them — a detach leaves nothing behind once it has.
 * What is read back is our own block and nothing else. **ADR 0105**, **ADR 0107**, **ADR 0111**.
 */

import { assert } from "@std/assert/assert";
import { isRecord } from "@/libs/unknown-reading.ts";
import { MAXIMUM_COMBATANTS } from "@/src/core/combatant-roster.ts";
import { readBattleFromPage } from "@/src/game/engine-attachment.ts";
import { readLiveWarriors, WARRIOR_FIELDS } from "@/src/game/engine-warrior.ts";
import { getNumberFromUnknown } from "@/libs/unknown-reading.ts";

/**
 * What the client calls the things this file uses, spelled here and nowhere else (**N13**). Read
 * on production build `Bb28FQty`, 2026-09-21 and 2026-09-23: a warrior keeps its own element under
 * `$`; `createWarriorTip` hangs the tooltip on those three; `getTipData` answers the registry's
 * string, `tip` replaces it, `concatTip` adds `"<br>" + row` to it, and `tipupdate` is the event
 * `tip` itself triggers so an open tooltip draws the registry again. `concatTip` triggers none.
 *
 * ⚠️ **A renamed method here fails silently** — no row appears and nothing throws.
 */
const WARRIOR_ELEMENT_FIELD = "$";
const TOOLTIP_TARGETS = ".canvas-warrior-icon, .grave-warrior-other, .grave-warrior-npc";
const FIND_METHOD = "find";
const READ_METHOD = "getTipData";
const REPLACE_METHOD = "tip";
const APPEND_METHOD = "concatTip";
const TELL_METHOD = "trigger";
const TELL_EVENT = "tipupdate";
const CLIENT_BREAK = "<br>";

/** How many fighters a block reached, so the entry can mark a payload that reached nobody. */
export interface TooltipWriting {
    written: number;
    asked: number;
}

export interface TooltipWriter {
    /** Every fighter the page draws, each with the rows they should carry now, empty or not. */
    write(page: unknown, rowsByCombatantId: ReadonlyMap<number, readonly string[]>): TooltipWriting;
}

/**
 * Past the rows one block has come to, and stated where they cross out of this program. Spelled
 * here rather than imported, because `game/` reaches into no `ui/` module — and held level with
 * the composer's own bound by `tests/game/engine-tooltip.test.ts`, which can import both.
 */
export const MAXIMUM_ROWS_WRITTEN = 20;

/** The client's jQuery set of one fighter's tooltip holders, narrowed to the calls made of it. */
interface TooltipTargets {
    getTipData(): unknown;
    tip(content: string): unknown;
    concatTip(row: string): unknown;
    trigger(event: string): unknown;
}

function isTooltipTargets(value: unknown): value is TooltipTargets {
    if (!isRecord(value)) return false;
    if (typeof value[READ_METHOD] !== "function") return false;
    if (typeof value[REPLACE_METHOD] !== "function") return false;
    if (typeof value[APPEND_METHOD] !== "function") return false;
    return typeof value[TELL_METHOD] === "function";
}

/** The block as `concatTip` leaves it in the registry, which is what is looked for next time. */
function composeBlockText(rows: readonly string[]): string {
    assert(rows.length <= MAXIMUM_ROWS_WRITTEN, "a block handed over is a stated length");
    const text = rows.map((row) => `${CLIENT_BREAK}${row}`).join("");
    assert(
        text.length === 0 || text.startsWith(CLIENT_BREAK),
        "and it opens on the client's break",
    );
    return text;
}

/**
 * A writer that remembers the block it left on each fighter, which is the one thing it reads back:
 * found in the registry, it is cut out before a changed block goes on; absent, the game rebuilt
 * that tooltip and the block goes on again. So every fighter is written on every payload and
 * nobody takes two blocks, whichever of the client's updates rebuilt whom — **ADR 0111**.
 */
export function composeTooltipWriter(): TooltipWriter {
    let blocksById = new Map<number, string>();
    return {
        write(page, rowsByCombatantId): TooltipWriting {
            const asked = [...rowsByCombatantId.values()].filter((rows) => rows.length > 0).length;
            assert(asked <= MAXIMUM_COMBATANTS, "no more blocks than a fight puts on a board");
            const next = new Map(blocksById);
            const written = writeBlocksToPage(page, rowsByCombatantId, next);
            blocksById = next;
            assert(written <= asked, "no more blocks landed than were composed");
            return { written, asked };
        },
    };
}

/**
 * Guarded whole: a throw of theirs becomes a payload that added nothing and never an exception
 * into the engine's own call stack (**E5**). A fighter the page no longer draws is forgotten, which
 * is what keeps the memory inside one board's worth of fighters.
 */
function writeBlocksToPage(
    page: unknown,
    rowsByCombatantId: ReadonlyMap<number, readonly string[]>,
    blocksById: Map<number, string>,
): number {
    let written = 0;
    try {
        const battle = readBattleFromPage(page);
        if (battle === null) return written;
        const drawn = new Set<number>();
        for (const warrior of readLiveWarriors(battle)) {
            const id = getNumberFromUnknown(warrior[WARRIOR_FIELDS.identity]);
            if (id === null) continue;
            drawn.add(id);
            const block = composeBlockText(rowsByCombatantId.get(id) ?? []);
            const stands = writeBlockToWarrior(warrior, blocksById.get(id) ?? "", block);
            if (stands === null) continue;
            if (stands) blocksById.set(id, block);
            else blocksById.delete(id);
            if (stands) written += 1;
        }
        for (const id of [...blocksById.keys()]) {
            if (!drawn.has(id)) blocksById.delete(id);
        }
    } catch {
        return written;
    }
    assert(blocksById.size <= MAXIMUM_COMBATANTS, "remembered blocks stay one board's worth");
    return written;
}

/**
 * True where the block now stands, false where none of ours does, and null where the fighter has
 * no tooltip this file can reach — whatever stood there before is left as it was.
 *
 * ⚠️ **The break between the rows is the client's own**: a block goes on through `concatTip`,
 * which writes the `<br>`, and comes off through `tip` with the registry's own string less ours.
 * No markup of this add-on's is ever handed over. `tipupdate` is triggered after the rows, because
 * `concatTip` triggers nothing and an open tooltip would go on drawing the string without them.
 */
function writeBlockToWarrior(
    warrior: Record<string, unknown>,
    was: string,
    block: string,
): boolean | null {
    const held = warrior[WARRIOR_ELEMENT_FIELD];
    if (!isRecord(held)) return null;
    if (typeof held[FIND_METHOD] !== "function") return null;
    const targets: unknown = held[FIND_METHOD](TOOLTIP_TARGETS);
    if (!isTooltipTargets(targets)) return null;
    const current = targets.getTipData();
    if (typeof current !== "string") return null;
    const at = was.length === 0 ? -1 : current.lastIndexOf(was);
    if (at !== -1) {
        if (was === block) return true;
        const theirs = current.slice(0, at) + current.slice(at + was.length);
        // An empty string is the client's word for deleting the tooltip, which is not ours to do.
        if (theirs.length === 0) return null;
        targets.tip(theirs);
    }
    if (block.length === 0) return false;
    for (const row of block.split(CLIENT_BREAK).slice(1)) {
        targets.concatTip(row);
    }
    targets.trigger(TELL_EVENT);
    return true;
}
