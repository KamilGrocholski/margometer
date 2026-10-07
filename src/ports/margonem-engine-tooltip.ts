/**
 * Rows of ours appended to the tooltip the game already shows for a fighter, and our own block
 * found again and taken off, through the client's own methods (`docs/design.md` §5). What this file
 * may write and read back is `SECURITY.md`'s, under "The reading boundary"; what it cost to decide
 * is `develop ADR 0105`, `0107` and `0111`.
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

/** Our block as composed, and the string the registry holds it as, which is what is looked for. */
interface RememberedBlock {
    readonly composed: string;
    readonly held: string;
}

/** What one fighter's tooltip came to, and the block left on it where that is `on`. */
interface BlockLanded {
    readonly landing: BlockLanding;
    readonly blockLeft: RememberedBlock | null;
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
    let blocksById = new Map<number, RememberedBlock>();
    return {
        writeRows(rowsByCombatantId) {
            const asked = [...rowsByCombatantId.values()].filter((rows) => rows.length > 0).length;
            assert(asked <= COMBATANTS_MAXIMUM, "no more blocks than a fight puts on a board");
            // Read the fighters the page draws, each id once, as the warriors' reader hands them.
            const warriorsById = errors.attempt(() => {
                const battle = readMargonemEngineBattle(browserWindow);
                if (battle instanceof errors.Caught) return battle;
                const warriors = readMargonemEngineWarriorsNamed(battle);
                if (warriors instanceof Error) return warriors;
                const drawnById = new Map<number, UnknownRecord>();
                for (const warrior of warriors) {
                    const id = warrior[WARRIOR_ID_KEY];
                    if (typeof id !== "number") continue;
                    assert(!drawnById.has(id), "the page's warriors are read each id once");
                    drawnById.set(id, warrior);
                }
                assert(drawnById.size <= warriors.length, "a fighter drawn is one the page holds");
                return drawnById;
            });
            if (warriorsById instanceof MargonemEngineWarriorsExceeded) return warriorsById;
            if (warriorsById instanceof errors.Caught) return warriorsById;
            if (warriorsById instanceof Error) return { written: 0, refused: 0 };
            const nextBlocksById = new Map(blocksById);
            // Write every fighter's block.
            const blocksWritten = errors.attempt(() => {
                const counts: TooltipWritten = { written: 0, refused: 0 };
                for (const [id, warrior] of warriorsById) {
                    const block = encodeTooltipBlock(rowsByCombatantId.get(id) ?? []);
                    const blockBefore = nextBlocksById.get(id) ?? null;
                    const { landing, blockLeft } = writeMargonemEngineWarriorBlock(
                        warrior,
                        block,
                        blockBefore,
                    );
                    if (landing === BLOCK_LANDING.on) {
                        assert(blockLeft !== null, "a block on is a block remembered");
                        assert(blockLeft.composed === block, "and the one composed now");
                        nextBlocksById.set(id, blockLeft);
                        counts.written += 1;
                    } else if (landing === BLOCK_LANDING.off) {
                        nextBlocksById.delete(id);
                    } else if (landing === BLOCK_LANDING.refused) {
                        if (block.length > 0) counts.refused += 1;
                    } else assert(landing === BLOCK_LANDING.kept, "a tooltip left as it was");
                }
                return counts;
            });
            // ⚠️ Forget a fighter the page no longer draws, and keep the rest, whatever the walk
            // came to: a block that went on before a throw of theirs, or one on a fighter the walk
            // never reached, forgotten, would be looked for as the old one and go on a second time.
            for (const id of [...nextBlocksById.keys()]) {
                if (!warriorsById.has(id)) nextBlocksById.delete(id);
            }
            assert(
                nextBlocksById.size <= COMBATANTS_MAXIMUM,
                "remembered blocks stay one board's worth",
            );
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

/** The block as `concatTip` leaves it after text of theirs: the client's break before every row. */
function encodeTooltipBlock(rows: readonly string[]): string {
    assert(rows.length <= ROWS_WRITTEN_MAXIMUM, "a block handed over is a stated length");
    const text = rows.map((row) => `${CLIENT_BREAK}${row}`).join("");
    if (text.length > 0) assert(text.startsWith(CLIENT_BREAK), "it opens on the client's break");
    return text;
}

/**
 * Whether the block stands on the fighter once written, and as what; kept where the page has drawn
 * no tooltip for them, which keeps whatever stood there; refused where it has and the client will
 * not let it be written. ⚠️ **Every break is the client's own**: a row goes on through `concatTip`,
 * which writes the `<br>` before it, and a block comes off through `tip` with the registry's own
 * string less ours. `tipupdate` goes after the rows, because `concatTip` triggers nothing.
 */
function writeMargonemEngineWarriorBlock(
    warrior: UnknownRecord,
    block: string,
    blockBefore: RememberedBlock | null,
): BlockLanded {
    const kept = { landing: BLOCK_LANDING.kept, blockLeft: null };
    const refused = { landing: BLOCK_LANDING.refused, blockLeft: null };
    const warriorElement = warrior[WARRIOR_ELEMENT_FIELD];
    if (!isRecord(warriorElement)) return kept;
    const find = warriorElement[FIND_METHOD];
    if (typeof find !== "function") return refused;
    const targets: unknown = Reflect.apply(find, warriorElement, [TOOLTIP_TARGETS]);
    if (!isTooltipTargets(targets)) return refused;
    const registryText = targets.getTipData();
    if (typeof registryText !== "string") return refused;
    const rows = block.split(CLIENT_BREAK).slice(1);
    if (blockBefore !== null) {
        const blockIndex = registryText.lastIndexOf(blockBefore.held);
        if (blockIndex !== -1) {
            if (blockBefore.composed === block) {
                return { landing: BLOCK_LANDING.on, blockLeft: blockBefore };
            }
            const theirs = registryText.slice(0, blockIndex) +
                registryText.slice(blockIndex + blockBefore.held.length);
            // ⚠️ An empty string is the client's word for deleting the tooltip, which is not ours
            // to do: a tooltip that is our block alone is left standing, or takes the first row
            // through `tip` and the rest through `concatTip`, and holds no break before the first.
            if (theirs.length === 0) {
                if (block.length === 0) return kept;
                const [firstRow, ...laterRows] = rows;
                assert(firstRow !== undefined, "a block composed holds a row");
                assert(firstRow.length > 0, "a tooltip is never replaced by nothing");
                targets.tip(firstRow);
                for (const row of laterRows) targets.concatTip(row);
                targets.trigger(TELL_EVENT);
                const blockLeft = { composed: block, held: rows.join(CLIENT_BREAK) };
                return { landing: BLOCK_LANDING.on, blockLeft };
            }
            targets.tip(theirs);
        }
    }
    if (block.length === 0) return { landing: BLOCK_LANDING.off, blockLeft: null };
    for (const row of rows) targets.concatTip(row);
    targets.trigger(TELL_EVENT);
    return { landing: BLOCK_LANDING.on, blockLeft: { composed: block, held: block } };
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
