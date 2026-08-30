/**
 * `active_absorbdest_per`, held to whose share it is.
 *
 * A reading off one recording finds one value and concludes the key states it. The corpus does
 * not: casters disagree, and each is consistent with themselves across fights, which is what makes
 * the share the caster's (`docs/protocol-keys.md`).
 */

import { assert, assertEquals } from "@std/assert";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { getRecordedMessages, getRecordingPaths } from "@/tests/recorded-fight.ts";

const KEY = "active_absorbdest_per";
const ANNOUNCEMENT_KEY = "tspell";

/** Every report of the share, as the material states it: who declared it, where, and what. */
function getReports(): { path: string; caster: number; share: string }[] {
    const found: { path: string; caster: number; share: string }[] = [];
    for (const path of getRecordingPaths()) {
        for (const message of getRecordedMessages(path)) {
            const parsed = parseProtocolMessage(message);
            for (const one of parsed.parameters) {
                if (one.key !== KEY) continue;
                assert(one.value !== null, `${path}: a share that states nothing`);
                assert(parsed.actor !== null, `${path}: a share nobody declared`);
                found.push({ path, caster: parsed.actor.combatantId, share: one.value });
            }
        }
    }
    return found;
}

Deno.test("the share stands on a skill announcement and never on a blow", () => {
    let reports = 0;
    for (const path of getRecordingPaths()) {
        for (const message of getRecordedMessages(path)) {
            const parsed = parseProtocolMessage(message);
            if (!parsed.parameters.some((one) => one.key === KEY)) continue;
            reports += 1;
            const announced = parsed.parameters.some((one) => one.key === ANNOUNCEMENT_KEY);
            assert(announced, `${path}: a share on a message announcing no skill`);
        }
    }
    assertEquals(reports, 465, "every report the material carries, 2026-08-30");
});

Deno.test("a caster never reports two different shares, in a fight or across them", () => {
    const shareByCaster = new Map<number, string>();
    for (const report of getReports()) {
        const stated = shareByCaster.get(report.caster);
        if (stated === undefined) {
            shareByCaster.set(report.caster, report.share);
            continue;
        }
        assertEquals(
            report.share,
            stated,
            `${report.path}: caster ${report.caster} reported two different shares`,
        );
    }
    assert(shareByCaster.size > 1, "the corpus carries more than one caster to compare");
});

/**
 * ⚠️ **The register's sentence is older than the material.** It names one combatant declaring `8`
 * against everybody else's `5`, read 2026-08-19. `2026-08-27-luvia-grupa-vs-amaimon-2` brought a
 * third value in, so the count is asserted rather than the two values named.
 */
Deno.test("the share is neither the key's nor the fight's", () => {
    const reports = getReports();
    const shares = new Set(reports.map((one) => one.share));
    assert(shares.size > 1, "one value across every caster would make the share the key's");

    const disagreeing = new Set<string>();
    for (const path of getRecordingPaths()) {
        const here = new Set(reports.filter((one) => one.path === path).map((one) => one.share));
        if (here.size > 1) disagreeing.add(path);
    }
    assert(disagreeing.size > 0, "one value inside every fight would make the share the fight's");
});

Deno.test("a caster carries their own share from one fight into the next", () => {
    const reports = getReports();
    const casters = new Map<number, Set<string>>();
    for (const report of reports) {
        const paths = casters.get(report.caster) ?? new Set<string>();
        paths.add(report.path);
        casters.set(report.caster, paths);
    }
    let travelled = 0;
    for (const [caster, paths] of casters) {
        if (paths.size < 2) continue;
        const shares = new Set(
            reports.filter((one) => one.caster === caster).map((one) => one.share),
        );
        assertEquals(shares.size, 1, `caster ${caster} reported differently in different fights`);
        travelled += 1;
    }
    assert(travelled > 0, "somebody appears in two fights, or the claim is about nothing");
});
