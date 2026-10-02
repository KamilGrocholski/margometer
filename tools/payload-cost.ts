/**
 * What one payload costs in the game's stack, and what the frame's tally costs at a fight's end,
 * timed over the recordings (S3). A payload is timed through the wrap itself: the add-on stood up by
 * its entry over the simulator's page and game (`tests/simulation.ts`), the game's method called
 * as the game calls it, less what the game's own method took. Each figure is the least of several
 * runs: a slower run is the collector or another process, never the code. V8 under Deno, which is
 * the engine Chrome runs the userscript on.
 *
 *     deno task fight:cost [recording.json …]
 */

import { assert, assertNotStrictEquals, assertStrictEquals } from "@std/assert";
import { formatInteger } from "#/libs/number-text.ts";
import { isRecord } from "#/libs/unknown-value.ts";
import {
    commitPayload,
    composeFightView,
    createFightSession,
    preparePayload,
    SESSION_OPTIONS,
} from "#/src/core/fight-session.ts";
import { readPayloadEnvelope } from "#/src/ports/payload-envelope.ts";
import { tallyFightState } from "#/src/runtime/fight-state.ts";
import { startMargoMeter } from "#/src/userscript-entry.ts";
import { composeFakeWindow, flushFakeFrames } from "#/tests/fake-window.ts";
import { composeRebuildingBattle } from "#/tests/rebuilding-battle.ts";
import { PayloadCostError } from "./margometer-tool-error.ts";
import {
    DECODER_TABLES,
    formatRecordingName,
    lookupRecordingPaths,
    readRecordedMaterial,
    type RecordedMaterial,
} from "./recorded-material.ts";

/** The least each fight took over the runs: per payload, and for the tally at its last call. */
interface FightCost {
    name: string;
    payloadMicroseconds: number[];
    messages: number[];
    tallyMicroseconds: number;
}

const RUNS = 15;
const MICROSECONDS_PER_MILLISECOND = 1_000;
const PERCENTILE_TAIL = 0.99;

function readPayloadCosts(material: RecordedMaterial, runs: number): FightCost[] {
    assert(runs > 0, "a cost is the least of at least one run");
    assert(material.fights.length > 0, "and is taken over something");
    const costs: FightCost[] = material.fights.map((fight) => ({
        name: formatRecordingName(fight.path),
        payloadMicroseconds: fight.updates.map(() => Number.POSITIVE_INFINITY),
        messages: fight.updates.map(() => 0),
        tallyMicroseconds: Number.POSITIVE_INFINITY,
    }));
    for (let run = 0; run < runs; run += 1) {
        for (const [at, fight] of material.fights.entries()) {
            const cost = costs[at];
            assert(cost !== undefined, "every fight has its cost");
            // Stand the add-on up over a game whose own method is timed apart from the wrap.
            const battle = composeRebuildingBattle();
            const own = battle.page.Engine.battle.updateData;
            assert(typeof own === "function", "the game's method stands before the wrap");
            let margonemEngineMilliseconds = 0;
            const timed = (payload: unknown): unknown => {
                const started = performance.now();
                const answered = Reflect.apply(own, battle.page.Engine.battle, [payload]);
                margonemEngineMilliseconds = performance.now() - started;
                return answered;
            };
            battle.page.Engine.battle.updateData = timed;
            const window = composeFakeWindow({
                margonem: { ...battle.page, _t: (labelId: string) => `label ${labelId}` },
            });
            startMargoMeter(window.page);
            const engine = window.page.Engine;
            if (!isRecord(engine)) throw new PayloadCostError("the page lost its game");
            const margonemEngineBattle = engine.battle;
            if (!isRecord(margonemEngineBattle)) {
                throw new PayloadCostError("the game lost its battle");
            }
            const wrapped = margonemEngineBattle.updateData;
            if (typeof wrapped !== "function") {
                throw new PayloadCostError("the battle lost its method");
            }
            assertNotStrictEquals(wrapped, timed, "the add-on wraps the game's method");
            const session = createFightSession(SESSION_OPTIONS);
            for (const [index, update] of fight.updates.entries()) {
                // Time the payload as the game calls it, less what the game's own method took.
                const started = performance.now();
                Reflect.apply(wrapped, margonemEngineBattle, [update]);
                const tookMilliseconds = performance.now() - started - margonemEngineMilliseconds;
                const took = tookMilliseconds * MICROSECONDS_PER_MILLISECOND;
                cost.payloadMicroseconds[index] = Math.min(
                    cost.payloadMicroseconds[index] ?? took,
                    took,
                );
                flushFakeFrames(window);
                // Keep a session of the tally's own, refusing a recording the add-on would refuse.
                const record = readPayloadEnvelope(update);
                if (record instanceof Error) {
                    throw new PayloadCostError(`${cost.name}: call ${index} has no envelope`, {
                        cause: record,
                    });
                }
                const prepared = preparePayload(session, record, DECODER_TABLES);
                if (prepared instanceof Error) {
                    throw new PayloadCostError(`${cost.name}: call ${index} was refused`, {
                        cause: prepared,
                    });
                }
                commitPayload(session, prepared);
                cost.messages[index] = record.messages.length;
            }
            assertStrictEquals(window.lines.length, 0, "a recording timed left no failure behind");
            const view = composeFightView(session);
            if (view === null) throw new PayloadCostError(`${cost.name} opened no fight`);
            // Time the tally a frame runs, at the call where the fight is longest.
            const started = performance.now();
            tallyFightState(view);
            const took = (performance.now() - started) * MICROSECONDS_PER_MILLISECOND;
            cost.tallyMicroseconds = Math.min(cost.tallyMicroseconds, took);
        }
    }
    assertStrictEquals(costs.length, material.fights.length, "one cost per fight");
    return costs;
}

function formatCostReport(costs: readonly FightCost[], material: string): string {
    assert(costs.length > 0, "a report is of something");
    assert(material.length > 0, "and names what it was taken on (V4)");
    const payloads = costs.flatMap((cost) =>
        cost.payloadMicroseconds.map((microseconds, at) => ({
            name: cost.name,
            at,
            microseconds,
            messages: cost.messages[at] ?? 0,
        }))
    );
    const ordered = payloads.map((one) => one.microseconds).sort((one, other) => one - other);
    const median = ordered[Math.floor(ordered.length / 2)] ?? 0;
    const tail =
        ordered[Math.min(ordered.length - 1, Math.floor(ordered.length * PERCENTILE_TAIL))] ??
            0;
    const largest = payloads.reduce((one, other) =>
        other.microseconds > one.microseconds ? other : one
    );
    const messages = payloads.reduce((sum, one) => sum + one.messages, 0);
    const total = payloads.reduce((sum, one) => sum + one.microseconds, 0);
    const tally = costs.reduce((one, other) =>
        other.tallyMicroseconds > one.tallyMicroseconds ? other : one
    );
    const formatMicroseconds = (microseconds: number) =>
        `${formatInteger(Math.round(microseconds))} µs`;
    return [
        `payload cost over ${material}: ${formatInteger(costs.length)} recordings, ` +
        `${formatInteger(payloads.length)} payloads, least of ${RUNS} runs, ` +
        `Deno ${Deno.version.deno} (V8 ${Deno.version.v8})`,
        `  per payload   median ${formatMicroseconds(median)}   99th ${
            formatMicroseconds(tail)
        }   ` +
        `largest ${formatMicroseconds(largest.microseconds)} (${largest.name}, call ${largest.at})`,
        `  per message   mean ${formatMicroseconds(messages === 0 ? 0 : total / messages)}`,
        `  every payload ${formatMicroseconds(total)}`,
        `  frame tally   largest ${
            formatMicroseconds(tally.tallyMicroseconds)
        } (${tally.name}, its last call)`,
    ].join("\n");
}

if (import.meta.main) {
    const paths = lookupRecordingPaths(Deno.args);
    if (paths === null) {
        throw new PayloadCostError("a recording is named by a path and never by a number");
    }
    const material = readRecordedMaterial(paths);
    console.log(formatCostReport(readPayloadCosts(material, RUNS), material.material));
}
