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
import type { VocabularyWord } from "#/libs/vocabulary.ts";
import { COMBATANTS_MAXIMUM } from "#/src/core/combatant-roster.ts";
import { readMargonemEngineBattle } from "./margonem-engine-battle.ts";
import {
    MargonemEngineWarriorsExceeded,
    readMargonemEngineWarriorsNamed,
    WARRIOR_ID_KEY,
} from "./margonem-engine-warriors.ts";

export interface MargonemEngineTooltipPort {
    /** Every fighter the page draws, each with the rows they should carry now, empty or not. */
    writeRows(
        rowsByCombatantId: ReadonlyMap<number, readonly string[]>,
    ): TooltipWritten | MargonemEngineWarriorsExceeded | errors.Caught;
}

/**
 * How many blocks stand, and how many drawn fighters held a tooltip this file could not write to.
 * A client that renamed a method throws nothing, so `refused` is the only sign of it; a fighter the
 * page has not drawn is neither.
 */
export interface TooltipWritten {
    written: number;
    refused: number;
}

/** What one fighter's tooltip came to: our block on it, none, left as it was, or out of reach. */
const BLOCK_LANDING = { on: "on", off: "off", kept: "kept", refused: "refused" } as const;
type BlockLanding = VocabularyWord<typeof BLOCK_LANDING>;

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
 * Past the rows one block comes to. `ports/` reaches into no `ui/` module, so the composer's own
 * bound is held level with this one by `tests/ports/margonem-engine-tooltip.test.ts`.
 */
export const ROWS_WRITTEN_MAXIMUM = 20;

/**
 * A writer that remembers the block it left on each fighter, which is the one thing it reads back:
 * found in the registry, it is cut out before a changed block goes on; absent, the game rebuilt
 * that tooltip and the block goes on again. So every fighter is written on every frame and nobody
 * takes two blocks, whichever of the client's updates rebuilt whom (`develop ADR 0111`).
 */
export function initMargonemEngineTooltip(browserWindow: unknown): MargonemEngineTooltipPort {
    let blocksById = new Map<number, string>();
    return {
        writeRows(rowsByCombatantId) {
            const asked = [...rowsByCombatantId.values()].filter((rows) => rows.length > 0).length;
            assert(asked <= COMBATANTS_MAXIMUM, "no more blocks than a fight puts on a board");
            const nextBlocksById = new Map(blocksById);
            // Write every fighter's block, and forget a fighter the page no longer draws, which
            // keeps one board's worth in memory.
            const blocksWritten = errors.attempt(() => {
                const warriors = readMargonemEngineWarriorsNamed(
                    readMargonemEngineBattle(browserWindow),
                );
                if (warriors instanceof MargonemEngineWarriorsExceeded) return warriors;
                const counts: TooltipWritten = { written: 0, refused: 0 };
                if (warriors instanceof Error) return counts;
                const drawnIds = new Set<number>();
                for (const warrior of warriors) {
                    const id = warrior[WARRIOR_ID_KEY];
                    if (typeof id !== "number") continue;
                    drawnIds.add(id);
                    const block = encodeTooltipBlock(rowsByCombatantId.get(id) ?? []);
                    const blockBefore = nextBlocksById.get(id) ?? "";
                    const landing = writeMargonemEngineWarriorBlock(warrior, block, blockBefore);
                    if (landing === BLOCK_LANDING.on) {
                        nextBlocksById.set(id, block);
                        counts.written += 1;
                    } else if (landing === BLOCK_LANDING.off) {
                        nextBlocksById.delete(id);
                    } else if (landing === BLOCK_LANDING.refused) {
                        if (block.length > 0) counts.refused += 1;
                    } else assert(landing === BLOCK_LANDING.kept, "a tooltip left as it was");
                }
                for (const id of [...nextBlocksById.keys()]) {
                    if (!drawnIds.has(id)) nextBlocksById.delete(id);
                }
                assert(
                    nextBlocksById.size <= COMBATANTS_MAXIMUM,
                    "remembered blocks stay one board's worth",
                );
                return counts;
            });
            // ⚠️ Kept whatever the walk came to: a block that went on before a throw of theirs,
            // forgotten, would be looked for as the old one and put on a second time.
            blocksById = nextBlocksById;
            if (blocksWritten instanceof Error) return blocksWritten;
            assert(
                blocksWritten.written + blocksWritten.refused <= asked,
                "no more blocks landed or were refused than were composed",
            );
            return blocksWritten;
        },
    };
}

/** The block as `concatTip` leaves it in the registry, which is what is looked for next time. */
function encodeTooltipBlock(rows: readonly string[]): string {
    assert(rows.length <= ROWS_WRITTEN_MAXIMUM, "a block handed over is a stated length");
    const text = rows.map((row) => `${CLIENT_BREAK}${row}`).join("");
    if (text.length > 0) assert(text.startsWith(CLIENT_BREAK), "it opens on the client's break");
    return text;
}

/**
 * Whether the block stands on the fighter once written; kept where the page has drawn no tooltip
 * for them, which keeps whatever stood there; refused where it has and the client will not let it
 * be written. ⚠️ **The break between the rows is the
 * client's own**: a block goes on through `concatTip`, which writes the `<br>`, and comes off
 * through `tip` with the registry's own string less ours. `tipupdate` goes after the rows, because
 * `concatTip` triggers nothing.
 */
function writeMargonemEngineWarriorBlock(
    warrior: UnknownRecord,
    block: string,
    blockBefore: string,
): BlockLanding {
    const warriorElement = warrior[WARRIOR_ELEMENT_FIELD];
    if (!isRecord(warriorElement)) return BLOCK_LANDING.kept;
    const find = warriorElement[FIND_METHOD];
    if (typeof find !== "function") return BLOCK_LANDING.refused;
    const targets: unknown = Reflect.apply(find, warriorElement, [TOOLTIP_TARGETS]);
    if (!isTooltipTargets(targets)) return BLOCK_LANDING.refused;
    const registryText = targets.getTipData();
    if (typeof registryText !== "string") return BLOCK_LANDING.refused;
    const blockIndex = blockBefore.length === 0 ? -1 : registryText.lastIndexOf(blockBefore);
    if (blockIndex !== -1) {
        if (blockBefore === block) return BLOCK_LANDING.on;
        const theirs = registryText.slice(0, blockIndex) +
            registryText.slice(blockIndex + blockBefore.length);
        // An empty string is the client's word for deleting the tooltip, which is not ours to do:
        // a tooltip that is our block alone is replaced by the new one whole, or left standing.
        if (theirs.length === 0) {
            if (block.length === 0) return BLOCK_LANDING.kept;
            targets.tip(block);
            targets.trigger(TELL_EVENT);
            return BLOCK_LANDING.on;
        }
        targets.tip(theirs);
    }
    if (block.length === 0) return BLOCK_LANDING.off;
    for (const row of block.split(CLIENT_BREAK).slice(1)) targets.concatTip(row);
    targets.trigger(TELL_EVENT);
    return BLOCK_LANDING.on;
}

/**
 * ⚠️ **The methods are checked rather than left to throw**: a throw ends the walk, and every
 * fighter after the one that could not take a line would lose theirs.
 */
function isTooltipTargets(targetsCandidate: unknown): targetsCandidate is TooltipTargets {
    if (!isRecord(targetsCandidate)) return false;
    if (typeof targetsCandidate[READ_METHOD] !== "function") return false;
    if (typeof targetsCandidate[REPLACE_METHOD] !== "function") return false;
    if (typeof targetsCandidate[APPEND_METHOD] !== "function") return false;
    return typeof targetsCandidate[TELL_METHOD] === "function";
}
