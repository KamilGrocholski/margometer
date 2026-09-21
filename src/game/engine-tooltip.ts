/**
 * The one thing this add-on puts **outside** itself, and the whole of it: a line of ours appended
 * to the tooltip the game already shows for a fighter.
 *
 * It is written through the client's own `concatTip`, which holds its tooltips as strings in a
 * registry of its own — no node is made, moved or styled, and nothing of ours stands on the page.
 * The game rewrites every tooltip on the next payload, so what is written here is undone by the
 * game itself and a detach leaves nothing behind. **ADR 0105.**
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
 * `createWarriorTip` hangs the tooltip on those three; `concatTip` is the client's own way of
 * adding to one, and it writes to a registry rather than to any node.
 *
 * ⚠️ **A renamed method here fails silently** — no line appears and nothing throws.
 */
const WARRIOR_ELEMENT_FIELD = "$";
const TOOLTIP_TARGETS = ".canvas-warrior-icon, .grave-warrior-other, .grave-warrior-npc";
const FIND_METHOD = "find";
const APPEND_METHOD = "concatTip";

/** How many fighters a line reached, so the entry can mark a payload that reached nobody. */
export interface TooltipWriting {
    written: number;
    asked: number;
}

/** A jQuery object of the client's, narrowed to the two calls this file makes of it. */
interface TooltipTarget {
    find(selector: string): { concatTip(content: string): void };
}

function isTooltipTarget(value: unknown): value is TooltipTarget {
    if (!isRecord(value)) return false;
    return typeof value[FIND_METHOD] === "function";
}

function writeLineToWarrior(warrior: Record<string, unknown>, line: string): boolean {
    const held = warrior[WARRIOR_ELEMENT_FIELD];
    if (!isTooltipTarget(held)) return false;
    const targets = held.find(TOOLTIP_TARGETS);
    if (!isRecord(targets)) return false;
    if (typeof targets[APPEND_METHOD] !== "function") return false;
    targets.concatTip(line);
    return true;
}

/**
 * A line onto every fighter one was composed for. Guarded whole: this is the add-on standing in
 * somebody else's program, so a throw of theirs becomes a payload that added nothing and never an
 * exception into the engine's own call stack (**E5**, **E12**).
 *
 * **Written and never read back.** What the tooltip now says is the game's, and asking it would
 * be reading our own text through their program to learn what we had just put there.
 */
export function writeLinesToTooltips(
    page: unknown,
    lineByCombatantId: ReadonlyMap<number, string>,
): TooltipWriting {
    const asked = lineByCombatantId.size;
    assert(asked <= MAXIMUM_COMBATANTS, "no more lines than a fight puts combatants on a board");
    let written = 0;
    try {
        const battle = readBattleFromPage(page);
        if (battle === null) return { written, asked };
        for (const warrior of readLiveWarriors(battle)) {
            const id = getNumberFromUnknown(warrior[WARRIOR_FIELDS.identity]);
            if (id === null) continue;
            const line = lineByCombatantId.get(id);
            if (line === undefined) continue;
            if (writeLineToWarrior(warrior, line)) written += 1;
        }
    } catch {
        return { written, asked };
    }
    assert(written <= asked, "no more lines landed than were composed");
    return { written, asked };
}
