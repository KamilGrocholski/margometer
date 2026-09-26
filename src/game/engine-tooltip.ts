/**
 * The one thing this add-on puts **outside** itself, and the whole of it: rows of ours appended to
 * the tooltip the game already shows for a fighter, through the client's own methods
 * (`docs/design.md` §5). That registry holds tooltips as strings, so no node is made, moved or
 * styled, and the game rewrites a fighter's entry whenever it updates them. What is read back is
 * our own block and nothing else: `develop ADR 0105`, `0107`, `0111`.
 */

import { assert } from "@std/assert/assert";
import * as errors from "#/libs/errors.ts";
import { isRecord, type UnknownRecord } from "#/libs/unknown-value.ts";
import { COMBATANTS_MAXIMUM } from "#/src/core/combatant-roster.ts";
import { readPageBattle } from "./engine-battle.ts";
import { readNamedWarriors, WARRIOR_ID_KEY } from "./warrior-snapshot.ts";

export interface TooltipPort {
    /** Every fighter the page draws, each with the rows they should carry now, empty or not. */
    writeRows(
        rowsByCombatantId: ReadonlyMap<number, readonly string[]>,
    ): TooltipWritten | errors.Caught;
}

/**
 * How many blocks landed of how many were composed. A client that renamed a method throws nothing,
 * so the count is the only sign of it.
 */
export interface TooltipWritten {
    written: number;
    asked: number;
}

/** The client's jQuery set of one fighter's tooltip holders, narrowed to the calls made of it. */
interface TooltipTargets {
    getTipData(): unknown;
    tip(content: string): unknown;
    concatTip(row: string): unknown;
    trigger(event: string): unknown;
}

/**
 * What the client calls the things this file uses, spelled here and nowhere else (N13). Read on
 * production build `Bb28FQty`, 2026-09-21 and 2026-09-23: a warrior keeps its own element under
 * `$`; `createWarriorTip` hangs the tooltip on those three; `getTipData` answers the registry's
 * string, `tip` replaces it, `concatTip` adds `"<br>" + row` to it, and `tipupdate` is the event
 * `tip` itself triggers so an open tooltip draws the registry again. `concatTip` triggers none.
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

/**
 * Past the rows one block comes to. `game/` reaches into no `ui/` module, so the composer's own
 * bound is held level with this one by `tests/game/engine-tooltip.test.ts`.
 */
export const ROWS_WRITTEN_MAXIMUM = 20;

/**
 * A writer that remembers the block it left on each fighter, which is the one thing it reads back:
 * found in the registry, it is cut out before a changed block goes on; absent, the game rebuilt
 * that tooltip and the block goes on again. So every fighter is written on every frame and nobody
 * takes two blocks, whichever of the client's updates rebuilt whom (`develop ADR 0111`).
 */
export function initPageTooltip(page: unknown): TooltipPort {
    let blocksById = new Map<number, string>();
    return {
        writeRows(rowsByCombatantId) {
            const asked = [...rowsByCombatantId.values()].filter((rows) => rows.length > 0).length;
            assert(asked <= COMBATANTS_MAXIMUM, "no more blocks than a fight puts on a board");
            const next = new Map(blocksById);
            const walked = errors.attempt(() => writeBlocks(page, rowsByCombatantId, next));
            // ⚠️ Kept whatever the walk came to: a block that went on before a throw of theirs,
            // forgotten, would be looked for as the old one and put on a second time.
            blocksById = next;
            if (walked instanceof Error) return walked;
            assert(walked <= asked, "no more blocks landed than were composed");
            return { written: walked, asked };
        },
    };
}

/** A fighter the page no longer draws is forgotten, which keeps one board's worth in memory. */
function writeBlocks(
    page: unknown,
    rowsByCombatantId: ReadonlyMap<number, readonly string[]>,
    blocksById: Map<number, string>,
): number {
    const warriors = readNamedWarriors(readPageBattle(page));
    if (warriors instanceof Error) return 0;
    let written = 0;
    const drawn = new Set<number>();
    for (const warrior of warriors) {
        const id = warrior[WARRIOR_ID_KEY];
        if (typeof id !== "number") continue;
        drawn.add(id);
        const block = encodeBlock(rowsByCombatantId.get(id) ?? []);
        const stands = writeBlockToWarrior(warrior, blocksById.get(id) ?? "", block);
        if (stands === null) continue;
        if (stands) blocksById.set(id, block);
        else blocksById.delete(id);
        if (stands) written += 1;
    }
    for (const id of [...blocksById.keys()]) {
        if (!drawn.has(id)) blocksById.delete(id);
    }
    assert(blocksById.size <= COMBATANTS_MAXIMUM, "remembered blocks stay one board's worth");
    return written;
}

/** The block as `concatTip` leaves it in the registry, which is what is looked for next time. */
function encodeBlock(rows: readonly string[]): string {
    assert(rows.length <= ROWS_WRITTEN_MAXIMUM, "a block handed over is a stated length");
    const text = rows.map((row) => `${CLIENT_BREAK}${row}`).join("");
    if (text.length > 0) assert(text.startsWith(CLIENT_BREAK), "it opens on the client's break");
    return text;
}

/**
 * True where the block now stands, false where none of ours does, and null where the fighter has
 * no tooltip this file can reach — whatever stood there before is left as it was.
 *
 * ⚠️ **The break between the rows is the client's own**: a block goes on through `concatTip`,
 * which writes the `<br>`, and comes off through `tip` with the registry's own string less ours.
 * `tipupdate` goes after the rows, because `concatTip` triggers nothing.
 */
function writeBlockToWarrior(warrior: UnknownRecord, was: string, block: string): boolean | null {
    const held = warrior[WARRIOR_ELEMENT_FIELD];
    if (!isRecord(held)) return null;
    const find = held[FIND_METHOD];
    if (typeof find !== "function") return null;
    const targets: unknown = Reflect.apply(find, held, [TOOLTIP_TARGETS]);
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
    for (const row of block.split(CLIENT_BREAK).slice(1)) targets.concatTip(row);
    targets.trigger(TELL_EVENT);
    return true;
}

/**
 * ⚠️ **The methods are checked rather than left to throw**: a throw ends the walk, and every
 * fighter after the one that could not take a line would lose theirs.
 */
function isTooltipTargets(value: unknown): value is TooltipTargets {
    if (!isRecord(value)) return false;
    if (typeof value[READ_METHOD] !== "function") return false;
    if (typeof value[REPLACE_METHOD] !== "function") return false;
    if (typeof value[APPEND_METHOD] !== "function") return false;
    return typeof value[TELL_METHOD] === "function";
}
