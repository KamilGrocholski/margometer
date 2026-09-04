/**
 * What a skill put on a whole side, how often it was cast, and how many ran at once.
 *
 *     deno task fight:auras            the register, over the corpus
 *     deno task fight:auras --cases    the counts behind each verdict
 *
 * The standing itself is the aggregate's (`src/core/fight-statistics.ts`); what is here is the
 * grading. `docs/auras-standing.md` carries the verdicts and what they do not claim. The figures
 * come off the replay, so this and the panel cannot disagree about a fight.
 */

import { assert, assertStrictEquals } from "@std/assert";
import { parseArgs } from "@std/cli";
import { getStatusKeyForBit, type StatusKey } from "@/src/core/combatant-status.ts";
import { FROZEN_AURA_TURNS } from "@/frozen/aura-turns.ts";
import { composeIntegerText } from "@/libs/number-text.ts";
import { composeFightReplaySteps, composeRecordedMaterial } from "@/tools/fight-replay.ts";

/** Past the cast count the whole corpus holds, which is 486 on 2026-09-04. */
const MAXIMUM_CASTS = 65536;

/**
 * The two the payload's own status mask can see, and it is only two. A skill raising `aura-sa_per`
 * shows as `speed_up` and one raising `allslow_per` as `swow_down`; nothing in the mask is
 * `Piętno bestii`'s mark, so nothing checks it. **ADR 0053.**
 */
const WITNESS_BY_SKILL_ID: Record<number, StatusKey> = { 89: "speed_up", 123: "swow_down" };

export interface AuraCase {
    skillId: number;
    skillName: string;
    casts: number;
    casters: number;
    /** The most instances of this skill running at one moment, over every payload of the corpus. */
    atOnce: number;
    turnsStated: number;
    /** The longest the mask's own bit ran, or null where no bit shows this skill. */
    turnsSeen: number | null;
}

interface AuraBuild {
    skillName: string;
    casts: number;
    casters: Set<number>;
    atOnce: number;
}

function composeAuraBuild(skillName: string): AuraBuild {
    assert(skillName.length > 0, "a skill counted here is one the game named");
    assert(MAXIMUM_CASTS > 0, "and is counted inside a stated bound");
    return { skillName, casts: 0, casters: new Set(), atOnce: 0 };
}

/** The longest the mask's own bit ran anywhere in the corpus, or null where no bit shows it. */
function getTurnsSeenForSkill(
    skillId: number,
    longestByKey: Map<StatusKey, number>,
): number | null {
    const witness = WITNESS_BY_SKILL_ID[skillId];
    if (witness === undefined) return null;
    const seen = longestByKey.get(witness);
    if (seen === undefined) return null;
    assert(seen >= 0, "an episode ran no fewer than no turns");
    return seen;
}

/** Every cast the corpus holds, and the most of one skill standing at any one moment. */
export function composeAuraCases(): AuraCase[] {
    const builds = new Map<number, AuraBuild>();
    const longestByKey = new Map<StatusKey, number>();
    for (const fight of composeRecordedMaterial([]).fights) {
        const seen = new Set<string>();
        for (const step of composeFightReplaySteps(fight)) {
            const atOnce = new Map<number, number>();
            for (const standing of step.replay.statistics.auraStandings) {
                const build = builds.get(standing.skillId) ?? composeAuraBuild(standing.skillName);
                const key = `${fight.name}:${standing.skillId}:${standing.casterId}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    build.casts += 1;
                    build.casters.add(standing.casterId);
                }
                atOnce.set(standing.skillId, (atOnce.get(standing.skillId) ?? 0) + 1);
                builds.set(standing.skillId, build);
            }
            for (const [skillId, count] of atOnce) {
                const build = builds.get(skillId);
                if (build === undefined) continue;
                if (count > build.atOnce) build.atOnce = count;
            }
            for (const run of step.replay.statistics.statusRuns) {
                if (run.key === null) continue;
                const held = longestByKey.get(run.key) ?? 0;
                if (run.turns > held) longestByKey.set(run.key, run.turns);
            }
        }
    }
    assert(builds.size > 0, "the corpus holds a cast, or this reader has stopped finding one");
    return composeCasesFromBuilds(builds, longestByKey);
}

function composeCasesFromBuilds(
    builds: Map<number, AuraBuild>,
    longestByKey: Map<StatusKey, number>,
): AuraCase[] {
    const stated = new Map<number, number>(
        FROZEN_AURA_TURNS.skills.map((one) => [one.id, one.turns]),
    );
    const cases: AuraCase[] = [];
    for (const [skillId, build] of [...builds].sort((one, other) => one[0] - other[0])) {
        const turnsStated = stated.get(skillId);
        assert(turnsStated !== undefined, "a cast that was counted has a stated duration");
        cases.push({
            skillId,
            skillName: build.skillName,
            casts: build.casts,
            casters: build.casters.size,
            atOnce: build.atOnce,
            turnsStated,
            turnsSeen: getTurnsSeenForSkill(skillId, longestByKey),
        });
    }
    assert(cases.every((one) => one.casts > 0), "and every row stands on something");
    return cases;
}

const ID_COLUMN = 5;
const NAME_COLUMN = 22;
const COUNT_COLUMN = 9;

function composeCaseLine(one: AuraCase): string {
    assert(one.casts > 0, "a row that is printed stands on something");
    assert(ID_COLUMN > 0, "and stands in a column with a width");
    return [
        composeIntegerText(one.skillId).padStart(ID_COLUMN),
        one.skillName.padEnd(NAME_COLUMN),
        composeIntegerText(one.casts).padStart(COUNT_COLUMN),
        composeIntegerText(one.casters).padStart(COUNT_COLUMN),
        composeIntegerText(one.atOnce).padStart(COUNT_COLUMN),
        composeIntegerText(one.turnsStated).padStart(COUNT_COLUMN),
        (one.turnsSeen === null ? "—" : composeIntegerText(one.turnsSeen)).padStart(COUNT_COLUMN),
    ].join(" ");
}

function writeAuraReport(cases: readonly AuraCase[], material: string): void {
    console.log(`${material}\n`);
    console.log(
        [
            "id".padStart(ID_COLUMN),
            "skill".padEnd(NAME_COLUMN),
            "casts".padStart(COUNT_COLUMN),
            "casters".padStart(COUNT_COLUMN),
            "at once".padStart(COUNT_COLUMN),
            "stated".padStart(COUNT_COLUMN),
            "seen".padStart(COUNT_COLUMN),
        ].join(" "),
    );
    for (const one of cases) console.log(composeCaseLine(one));
    assert(cases.length > 0, "a report over the corpus has something to report");
}

if (import.meta.main) {
    const args = parseArgs(Deno.args, { boolean: ["cases"] });
    const material = composeRecordedMaterial([]);
    const cases = composeAuraCases();
    writeAuraReport(cases, material.material);
    if (args.cases) {
        console.log(
            "\n`stated` is the published table's; `seen` is the longest the mask's own bit ran,",
        );
        console.log("and only two skills raise a bit the mask carries at all.");
        for (const one of cases) {
            const bit = WITNESS_BY_SKILL_ID[one.skillId];
            if (bit === undefined) continue;
            console.log(`  ${one.skillName} shows as ${bit}, bit ${getBitForKey(bit)}`);
        }
    }
    assertStrictEquals(typeof material.material, "string", "a report names what it was taken on");
}

/** The bit a key stands at, asked of the table that owns the answer rather than written here. */
function getBitForKey(key: StatusKey): number {
    for (let bit = 0; bit < 32; bit += 1) {
        if (getStatusKeyForBit(bit) === key) return bit;
    }
    assert(key.length > 0, "a key that is looked up is named");
    return -1;
}
