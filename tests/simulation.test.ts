/**
 * `docs/design.md` §12's properties, held on every recording and every seed: nothing reaches the
 * game's stack, the figures a fault-free run draws are the figures drawn under faults (none of the
 * faults touches the data), and every failure meets a fate. One more is held beside them: a fault
 * of the page's is always met as the page's, and never as a broken invariant of ours.
 */

import { assert, assertEquals } from "@std/assert";
import * as errors from "#/libs/errors.ts";
import { StoreRefused } from "#/src/game/browser-store.ts";
import { readRecordedFights } from "./recorded-fights.ts";
import { FAULT_FREE, type FaultPlan, runSimulation } from "./simulation.ts";

/**
 * Faults a real page meets now and then, drawn anew by each seed, and one page that refuses every
 * call it is asked. The seeds are few because each plays every recording.
 */
const PLANS: readonly FaultPlan[] = [
    ...[1, 2, 3, 4, 5].map((seed) => ({
        seed,
        storeRefusalPercent: 20,
        foreignThrowPercent: 5,
        payloadsPerFrame: 1 + (seed % 3),
    })),
    { seed: 9, storeRefusalPercent: 100, foreignThrowPercent: 100, payloadsPerFrame: 1 },
];

Deno.test("under every plan, on every recording, the game never meets a throw of ours", () => {
    const kinds = new Set<string>();
    let faults = 0;
    for (const fight of readRecordedFights()) {
        const alone = runSimulation({ seed: 0, ...FAULT_FREE }, fight.updates);
        assertEquals(alone.kindsSaid, [], `${fight.path}: left alone, nothing fails`);
        assert(alone.ranking.length > 0, `${fight.path}: and the ranking is drawn`);
        for (const plan of PLANS) {
            const where = `${fight.path}, seed ${plan.seed}`;
            const faulted = runSimulation(plan, fight.updates);
            assert(!faulted.hasThrownIntoGame, `${where}: a throw of ours reached the game`);
            assertEquals(faulted.ranking, alone.ranking, `${where}: the figures moved`);
            assertEquals(faulted.unhandledKinds, [], `${where}: a failure met no fate`);
            assert(
                !faulted.hasInvariantBroken,
                `${where}: a fault of the page's was met as a broken invariant of ours`,
            );
            for (const kind of faulted.kindsSaid) kinds.add(kind);
            faults += faulted.faultsInjected;
        }
    }
    // A simulator that stopped injecting would pass every line above, so it is held to its work.
    assert(faults > 0, "faults were injected");
    assertEquals(
        [...kinds].sort(),
        [errors.Caught.name, StoreRefused.name].sort(),
        "and both kinds of fault the plans draw reached the console",
    );
});
