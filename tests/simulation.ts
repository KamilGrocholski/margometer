/**
 * The simulator (`docs/design.md` §12, step 8): the add-on stood up by its own entry over a page
 * and a game of the tests' own, a recording played through the game's method, and the page made
 * to refuse and throw where a real one could, by a plan drawn from a seed. What it reports is what
 * the three properties of §12 are read off: a throw that reached the game, the ranking the last
 * frame drew, and every kind of failure the console heard.
 */

import { assert } from "@std/assert";
import { randomSeeded } from "@std/random";
import { isRecord } from "#/libs/unknown-value.ts";
import { FAILURE_FATES } from "#/src/runtime/failure-fate.ts";
import { CLASS } from "#/src/ui/panel-look.ts";
import { startMargoMeter } from "#/src/userscript-entry.ts";
import { getElementsWithin } from "./fake-document.ts";
import {
    composeFakeWindow,
    type FakeWindow,
    flushFakeFrames,
    PAGE_CALL,
    type PageCall,
} from "./fake-window.ts";
import { composeRebuildingBattle } from "./rebuilding-battle.ts";

export interface FaultPlan {
    seed: number;
    /** Out of a hundred, how often a write to a store is refused, as a full store refuses it. */
    storeRefusalPercent: number;
    /** Out of a hundred, how often any other call into the page throws. */
    foreignThrowPercent: number;
    /** How many of the game's calls land before a frame falls. */
    payloadsPerFrame: number;
}

export interface SimulationReport {
    /** Whether anything of ours reached the game's stack, or the browser's through a frame. */
    hasThrownIntoGame: boolean;
    /** What the ranking says after the last frame, which is what a fault must never move. */
    ranking: string;
    /** Every kind of failure the console was told, once each, in the order it was first told. */
    kindsSaid: string[];
    /** Those kinds `FAILURE_FATES` holds no fate for: a failure that met none. */
    unhandledKinds: string[];
    faultsInjected: number;
}

/** A plan that refuses nothing and draws after every call: what the add-on does left alone. */
export const FAULT_FREE: Omit<FaultPlan, "seed"> = {
    storeRefusalPercent: 0,
    foreignThrowPercent: 0,
    payloadsPerFrame: 1,
};

const PERCENT = 100;
const FAILURE_KINDS: readonly string[] = Object.keys(FAILURE_FATES);
const NO_KIND = "no kind stated";

export function runSimulation(plan: FaultPlan, updates: readonly unknown[]): SimulationReport {
    assert(Number.isSafeInteger(plan.seed), "a simulation is drawn from a whole seed");
    assert(plan.payloadsPerFrame > 0, "and some calls land before each frame");
    const random = randomSeeded(BigInt(plan.seed));
    let faultsInjected = 0;
    const onPageCall = (call: PageCall): void => {
        const isWrite = call === PAGE_CALL.storeWrite;
        const percent = isWrite ? plan.storeRefusalPercent : plan.foreignThrowPercent;
        if (random() * PERCENT >= percent) return;
        faultsInjected += 1;
        if (isWrite) throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
        throw new TypeError(`the page refused a ${call} call`);
    };
    const battle = composeRebuildingBattle(onPageCall);
    const window = composeFakeWindow({
        game: { ...battle.page, _t: composeSimulationDictionary(onPageCall) },
        onPageCall,
    });
    let hasThrownIntoGame = !runSimulationStep(() => void startMargoMeter(window.page));
    for (const [index, payload] of updates.entries()) {
        const called = runSimulationStep(() => callSimulationGame(window, payload));
        if (!called) hasThrownIntoGame = true;
        if ((index + 1) % plan.payloadsPerFrame !== 0) continue;
        if (!runSimulationStep(() => flushFakeFrames(window))) hasThrownIntoGame = true;
    }
    if (!runSimulationStep(() => flushFakeFrames(window))) hasThrownIntoGame = true;
    const kindsSaid = readSimulationKinds(window);
    return {
        hasThrownIntoGame,
        ranking: readSimulationRanking(window),
        kindsSaid,
        unhandledKinds: kindsSaid.filter((kind) => !FAILURE_KINDS.includes(kind)),
        faultsInjected,
    };
}

/** The client's lookup of its own labels, answering one of ours for any id it is asked. */
function composeSimulationDictionary(onPageCall: (call: PageCall) => void) {
    return (labelId: string): string => {
        onPageCall(PAGE_CALL.dictionary);
        return `label ${labelId}`;
    };
}

/** False where the step threw, which from the game's side or a frame is ours reaching them. */
function runSimulationStep(step: () => void): boolean {
    try {
        step();
        return true;
    } catch {
        return false;
    }
}

function callSimulationGame(window: FakeWindow, payload: unknown): void {
    const engine = window.page.Engine;
    assert(isRecord(engine), "the page holds a game");
    const battle = engine.battle;
    assert(isRecord(battle), "and the game a battle");
    const updateData = battle.updateData;
    assert(typeof updateData === "function", "whose method stands, wrapped or not");
    Reflect.apply(updateData, battle, [payload]);
}

/** The failure each console line carried, by its `kind`; a line with none is its own finding. */
function readSimulationKinds(window: FakeWindow): string[] {
    const kinds: string[] = [];
    for (const line of window.lines) {
        const detail = line[1];
        const kind = isRecord(detail) ? detail.kind : undefined;
        const said = typeof kind === "string" ? kind : NO_KIND;
        if (!kinds.includes(said)) kinds.push(said);
    }
    return kinds;
}

/** The panel is the node offered to the body, whether the body took it on that frame or not. */
function readSimulationRanking(window: FakeWindow): string {
    const host = window.offered[0];
    if (host === undefined) return "";
    const list = getElementsWithin(host).find((one) => one.className === CLASS.list);
    if (list === undefined) return "";
    // A fake node's text is its own and not its children's, so the rows are read one by one.
    return getElementsWithin(list).map((one) => one.textContent).join("|");
}
