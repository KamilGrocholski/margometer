/**
 * `active_absorbdest_per`, held to whose share it is.
 *
 * A reading off one recording finds one value and concludes the key states it. The corpus does
 * not: casters disagree, and each is consistent with themselves across fights, which is what makes
 * the share the caster's (`docs/protocol-keys.md`).
 */

import { assert, assertExists, assertStrictEquals } from "@std/assert";
import { parseProtocolMessage, type ProtocolMessage } from "#/src/core/fight-decoder.ts";
import { readRecordedFights } from "#/tests/recorded-fights.ts";

interface ShareReport {
    path: string;
    caster: number;
    share: string;
}

const KEY = "active_absorbdest_per";
const ANNOUNCEMENT_KEY = "tspell";

Deno.test("the share stands on a skill announcement and never on a blow", () => {
    let reports = 0;
    for (const { path, parsed } of getParsedMessages()) {
        if (!parsed.parameters.some((parameter) => parameter.key === KEY)) continue;
        reports += 1;
        const announced = parsed.parameters.some((parameter) => parameter.key === ANNOUNCEMENT_KEY);
        assert(announced, `${path}: a share on a message announcing no skill`);
    }
    assert(reports > 0, "an empty reading of the material is a finding, not a pass");
});

/** Every message of every recording, parsed, beside the recording it came from. */
function getParsedMessages(): { path: string; parsed: ProtocolMessage }[] {
    const messages: { path: string; parsed: ProtocolMessage }[] = [];
    for (const fight of readRecordedFights()) {
        for (const message of fight.messages) {
            const parsed = parseProtocolMessage(message);
            assert(!(parsed instanceof Error), `${fight.path}: a recorded message parses`);
            messages.push({ path: fight.path, parsed: parsed });
        }
    }
    return messages;
}

Deno.test("a caster never reports two different shares, in a fight or across them", () => {
    const shareByCaster = new Map<number, string>();
    for (const report of getReports()) {
        const stated = shareByCaster.get(report.caster);
        if (stated === undefined) {
            shareByCaster.set(report.caster, report.share);
            continue;
        }
        assertStrictEquals(
            report.share,
            stated,
            `${report.path}: caster ${report.caster} reported two different shares`,
        );
    }
    assert(shareByCaster.size > 1, "the corpus carries more than one caster to compare");
});

/** Every report of the share, as the material states it: who declared it, where, and what. */
function getReports(): ShareReport[] {
    const reports: ShareReport[] = [];
    for (const { path, parsed } of getParsedMessages()) {
        for (const parameter of parsed.parameters) {
            if (parameter.key !== KEY) continue;
            assertExists(parameter.value, `${path}: a share that states nothing`);
            assertExists(parsed.actor, `${path}: a share nobody declared`);
            reports.push({ path, caster: parsed.actor.combatantId, share: parameter.value });
        }
    }
    return reports;
}

/**
 * ⚠️ **The register's sentence is older than the material.** It names one combatant declaring `8`
 * against everybody else's `5`, read 2026-08-19.
 * `2026-08-27-luvia-grupa-vs-amaimon-2-53XkBRxF-0.9.0` brought a third value in, so the count is
 * asserted rather than the two values named.
 */
Deno.test("the share is neither the key's nor the fight's", () => {
    const reports = getReports();
    const shares = new Set(reports.map((report) => report.share));
    assert(shares.size > 1, "one value across every caster would make the share the key's");

    const disagreeing = new Set<string>();
    for (const fight of readRecordedFights()) {
        const here = reports.filter((report) => report.path === fight.path).map((report) =>
            report.share
        );
        if (new Set(here).size > 1) disagreeing.add(fight.path);
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
            reports.filter((report) => report.caster === caster).map((report) => report.share),
        );
        assertStrictEquals(
            shares.size,
            1,
            `caster ${caster} reported differently in different fights`,
        );
        travelled += 1;
    }
    assert(travelled > 0, "somebody appears in two fights, or the claim is about nothing");
});
