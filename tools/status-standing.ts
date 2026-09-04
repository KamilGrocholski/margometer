/**
 * What the payload's own status mask leaves standing, and for how long.
 *
 *     deno task fight:statuses                     the register, over the corpus
 *     deno task fight:statuses --cases             the counts behind each verdict
 *
 * The episodes and their lengths are the add-on's own (`src/game/battle-session.ts`,
 * `src/core/fight-statistics.ts`); what is here is the grading. `docs/statuses-standing.md`
 * carries the verdicts and what they do not claim. The figures come off the replay, so this and
 * the panel cannot disagree about a fight (`tools/fight-replay.ts`).
 */

import { assert, assertStrictEquals } from "@std/assert";
import { parseArgs } from "@std/cli";
import {
    getStatusKeyForBit,
    MAXIMUM_STATUS_BIT,
    type StatusKey,
} from "@/src/core/combatant-status.ts";
import { SKILL_ID_KEY } from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { FROZEN_SKILL_DURATIONS } from "@/frozen/skill-durations.ts";
import { composeIntegerText, getIntegerFromText } from "@/libs/number-text.ts";
import { composeReplayedMaterial, type FightReplay } from "@/tools/fight-replay.ts";

/** Past the episode count the whole corpus holds, which is 457 on 2026-09-03. */
const MAXIMUM_EPISODES = 65536;

/**
 * Which effect keys a skill states that could set each bit. **A judgement, and the register says
 * so**: the protocol never joins a skill to a bit, so this is the closest a candidate set gets.
 * The words are matched inside a key, because the published table spells one family several ways
 * — `slowfreeze_per`, `allslow_per` — and a list of whole keys goes stale on the next skill.
 */
const STATUS_FAMILIES: Record<StatusKey, readonly string[]> = {
    deep_wound: ["critwound", "wound"],
    wound: ["wound", "injure"],
    critical_deep_wound: ["critwound"],
    poisoned: ["poison"],
    fire: ["fire", "burn"],
    swow_down: ["slow", "freeze"],
    speed_up: ["sa_per", "sa2_per", "fastarrow", "critsa"],
    frostbite: ["frost", "rime"],
    shock: ["stun", "blackout"],
};

/** How many casters a moment names: one is a figure, the other two are not. */
export const NAMING_OUTCOMES = ["one", "none", "several"] as const;
export type NamingOutcome = (typeof NAMING_OUTCOMES)[number];

export interface StatusCase {
    bit: number;
    key: StatusKey | null;
    episodes: number;
    closed: number;
    /** The longest an episode ran, in the bearer's own turns. */
    turnsLongest: number;
    /**
     * Who set it, asked two ways, because the two families are different things: a wound is a key
     * on somebody's blow and a slow is a skill somebody announced. A register carrying one of them
     * reports zero for every status the other answers for.
     */
    namingBySkill: Record<NamingOutcome, number>;
    namingByKey: Record<NamingOutcome, number>;
    /** What the published skill table states for this family, distinct and in order. */
    turnsStated: readonly number[];
}

function isFamilyKey(effectKey: string, key: StatusKey): boolean {
    assert(effectKey.length > 0, "an effect that is matched is named");
    const folded = effectKey.toLowerCase();
    for (const word of STATUS_FAMILIES[key]) {
        if (folded.includes(word)) return true;
    }
    return false;
}

/** Every skill the published table says could set this bit. */
function getSkillIdsForStatus(key: StatusKey): Set<number> {
    const found = new Set<number>();
    for (const skill of FROZEN_SKILL_DURATIONS.skills) {
        for (const effect of skill.effects) {
            if (!isFamilyKey(effect.key, key)) continue;
            found.add(skill.id);
        }
    }
    assert(found.size <= FROZEN_SKILL_DURATIONS.skills.length, "a skill is named once per family");
    return found;
}

/** What the published table states this family runs for, over every skill that could set it. */
function getTurnsStatedForStatus(key: StatusKey): number[] {
    const found = new Set<number>();
    for (const skill of FROZEN_SKILL_DURATIONS.skills) {
        for (const effect of skill.effects) {
            if (!isFamilyKey(effect.key, key)) continue;
            for (const turns of effect.turns) found.add(turns);
        }
    }
    assert(found.size <= MAXIMUM_EPISODES, "a family states no more durations than there are");
    return [...found].sort((one, other) => one - other);
}

/** Every skill announced in the payload a bit turned on in, or the one before it. */
function getSkillIdsAnnounced(messages: readonly string[]): number[] {
    const found: number[] = [];
    for (const message of messages) {
        for (const parameter of parseProtocolMessage(message).parameters) {
            if (parameter.key !== SKILL_ID_KEY) continue;
            const id = getIntegerFromText(parameter.value ?? "");
            if (id !== null) found.push(id);
        }
    }
    assert(found.length <= messages.length, "no more announcements than there were messages");
    return found;
}

/**
 * How many casters the moment names. The candidates are the skills announced in that payload and
 * the one before it — an announcement and the mask it left are one payload apart at most, and a
 * wider window would name whoever cast anything at all.
 */
function getNamingOutcome(announced: readonly number[], key: StatusKey): NamingOutcome {
    const candidates = getSkillIdsForStatus(key);
    const named = new Set(announced.filter((id) => candidates.has(id)));
    if (named.size === 0) return "none";
    if (named.size === 1) return "one";
    return "several";
}

interface StatusBuild {
    episodes: number;
    closed: number;
    turnsLongest: number;
    namingBySkill: Record<NamingOutcome, number>;
    namingByKey: Record<NamingOutcome, number>;
}

function composeStatusBuild(): StatusBuild {
    assert(NAMING_OUTCOMES.length === 3, "a moment names one caster, none, or several");
    assert(MAXIMUM_EPISODES > 0, "and is counted inside a stated bound");
    return {
        episodes: 0,
        closed: 0,
        turnsLongest: 0,
        namingBySkill: { one: 0, none: 0, several: 0 },
        namingByKey: { one: 0, none: 0, several: 0 },
    };
}

/**
 * Who the blow keys in a payload name as having done this to the bearer. The other half of the
 * question: a wound arrives as a key on somebody's blow and never as a skill anybody announced.
 */
function getActorsNamingKey(
    messages: readonly string[],
    combatantId: number,
    key: StatusKey,
): Set<number> {
    const actors = new Set<number>();
    for (const message of messages) {
        const parsed = parseProtocolMessage(message);
        if (parsed.target?.combatantId !== combatantId) continue;
        const actorId = parsed.actor?.combatantId;
        if (actorId === undefined || actorId === null) continue;
        for (const parameter of parsed.parameters) {
            if (!isFamilyKey(parameter.key, key)) continue;
            actors.add(actorId);
        }
    }
    assert(actors.size <= messages.length, "no more actors than there were messages naming one");
    return actors;
}

function getOutcomeForCount(count: number): NamingOutcome {
    assert(count >= 0, "a count of casters is never below nothing");
    if (count === 0) return "none";
    if (count === 1) return "one";
    return "several";
}

/** Where each episode of a replay began, so the caster can be looked for in that payload. */
function composeNamingCounts(replay: FightReplay): Map<number, StatusBuild> {
    const byBit = new Map<number, StatusBuild>();
    const payloads = replay.reading.messagesByPayload;
    const announced: number[][] = payloads.map((messages) => getSkillIdsAnnounced(messages));
    for (const episode of replay.reading.statusEpisodes) {
        const key = getStatusKeyForBit(episode.bit);
        const held = byBit.get(episode.bit) ?? composeStatusBuild();
        const at = getPayloadForEventIndex(replay, episode.fromEventIndex);
        const window = [...(announced[at] ?? []), ...(announced[at - 1] ?? [])];
        const messages = [...(payloads[at] ?? []), ...(payloads[at - 1] ?? [])];
        const bySkill = key === null ? "none" : getNamingOutcome(window, key);
        const byKey = key === null
            ? "none"
            : getOutcomeForCount(getActorsNamingKey(messages, episode.combatantId, key).size);
        held.namingBySkill[bySkill] += 1;
        held.namingByKey[byKey] += 1;
        byBit.set(episode.bit, held);
    }
    assert(byBit.size <= MAXIMUM_STATUS_BIT + 1, "no more bits than the walk reaches");
    return byBit;
}

/**
 * Which payload an event index fell in. The episodes are anchored on the event stream and the
 * announcements arrive per payload, so one has to be turned into the other to look in the right
 * place — and looking in the wrong one is how a caster gets named for somebody else's cast.
 */
function getPayloadForEventIndex(replay: FightReplay, index: number): number {
    assert(index >= 0, "an episode starts inside the fight");
    let seen = 0;
    for (const [at, messages] of replay.reading.messagesByPayload.entries()) {
        seen += messages.length;
        if (index <= seen) return at;
    }
    return replay.reading.messagesByPayload.length - 1;
}

/** Every bit the corpus states, graded. A bit nothing set is not a row: it is not evidence. */
export function composeStatusCases(replays: readonly FightReplay[]): StatusCase[] {
    const builds = new Map<number, StatusBuild>();
    for (const replay of replays) {
        const naming = composeNamingCounts(replay);
        for (const run of replay.statistics.statusRuns) {
            const build = builds.get(run.bit) ?? composeStatusBuild();
            build.episodes += 1;
            if (!run.isStanding) build.closed += 1;
            if (run.turns > build.turnsLongest) build.turnsLongest = run.turns;
            builds.set(run.bit, build);
        }
        for (const [bit, counts] of naming) {
            const build = builds.get(bit) ?? composeStatusBuild();
            for (const outcome of NAMING_OUTCOMES) {
                build.namingBySkill[outcome] += counts.namingBySkill[outcome];
                build.namingByKey[outcome] += counts.namingByKey[outcome];
            }
            builds.set(bit, build);
        }
    }
    const cases: StatusCase[] = [];
    for (const [bit, build] of [...builds].sort((one, other) => one[0] - other[0])) {
        const key = getStatusKeyForBit(bit);
        cases.push({
            bit,
            key,
            episodes: build.episodes,
            closed: build.closed,
            turnsLongest: build.turnsLongest,
            namingBySkill: build.namingBySkill,
            namingByKey: build.namingByKey,
            turnsStated: key === null ? [] : getTurnsStatedForStatus(key),
        });
    }
    assert(cases.length <= MAXIMUM_STATUS_BIT + 1, "no more rows than there are bits");
    assert(cases.every((one) => one.episodes > 0), "and every row stands on something");
    return cases;
}

const BIT_COLUMN = 5;
const NAME_COLUMN = 21;
const COUNT_COLUMN = 10;

function composeCaseLine(one: StatusCase): string {
    const said = one.turnsStated.length === 0
        ? "—"
        : one.turnsStated.map((turns) => composeIntegerText(turns)).join("/");
    assert(one.episodes > 0, "a row that is printed stands on something");
    assert(BIT_COLUMN > 0, "and stands in a column with a width");
    return [
        composeIntegerText(one.bit).padStart(BIT_COLUMN),
        (one.key ?? "—").padEnd(NAME_COLUMN),
        composeIntegerText(one.episodes).padStart(COUNT_COLUMN),
        composeIntegerText(one.closed).padStart(COUNT_COLUMN),
        composeIntegerText(one.turnsLongest).padStart(COUNT_COLUMN),
        composeIntegerText(one.namingBySkill.one).padStart(COUNT_COLUMN),
        composeIntegerText(one.namingByKey.one).padStart(COUNT_COLUMN),
        said.padStart(COUNT_COLUMN),
    ].join(" ");
}

function composeOutcomeText(counts: Record<NamingOutcome, number>): string {
    assert(NAMING_OUTCOMES.length === 3, "an outcome is one of the three");
    assert(counts.one >= 0, "and each is counted from nothing up");
    return NAMING_OUTCOMES
        .map((outcome) => `${outcome} ${composeIntegerText(counts[outcome])}`)
        .join(", ");
}

function writeStatusReport(cases: readonly StatusCase[], material: string): void {
    console.log(`${material}\n`);
    console.log(
        [
            "bit".padStart(BIT_COLUMN),
            "status".padEnd(NAME_COLUMN),
            "episodes".padStart(COUNT_COLUMN),
            "closed".padStart(COUNT_COLUMN),
            "longest".padStart(COUNT_COLUMN),
            "by skill".padStart(COUNT_COLUMN),
            "by key".padStart(COUNT_COLUMN),
            "stated".padStart(COUNT_COLUMN),
        ].join(" "),
    );
    for (const one of cases) console.log(composeCaseLine(one));
    assert(cases.length > 0, "a report over the corpus has something to report");
}

if (import.meta.main) {
    const args = parseArgs(Deno.args, { boolean: ["cases"] });
    const material = composeReplayedMaterial([]);
    const cases = composeStatusCases(material.replays);
    writeStatusReport(cases, material.material);
    if (args.cases) {
        console.log("\nlongest is in the bearer's own turns; stated is what the skill table says");
        console.log("`by skill` and `by key` count the episodes naming exactly one caster\n");
        for (const one of cases) {
            const name = one.key ?? `bit ${composeIntegerText(one.bit)}`;
            console.log(
                `${name}: by skill ${composeOutcomeText(one.namingBySkill)}` +
                    `, by key ${composeOutcomeText(one.namingByKey)}`,
            );
        }
    }
    assertStrictEquals(typeof material.material, "string", "a report names what it was taken on");
}
