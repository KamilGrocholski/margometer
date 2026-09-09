/**
 * What `captures/` says about the figures a standing cast declares, written to `measured.json` so
 * the artboards beside it state readings rather than remembered numbers.
 *
 * Run by hand — `deno run -A design/wartosci/measure.ts`. One consumer, this design round, so it
 * earns no `deno task` entry (**C9**). What stands is asked of `src/core/aura-standing.ts` rather
 * than walked again here, so a figure on an artboard is a figure the panel would draw.
 */

import { assert } from "@std/assert";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import {
    composeAuraTurnsBySkillId,
    composeFightStandings,
    composeShoutsBySkillId,
    isTeamWideKey,
    type StatedSkills,
} from "@/src/core/aura-standing.ts";
import { FROZEN_AURA_TURNS } from "@/frozen/aura-turns.ts";
import { composeFightReplaySteps } from "@/tools/fight-replay.ts";
import { getRecordedFightAt } from "@/tools/recorded-fights.ts";
import { readRecordingPaths } from "@/project/repository-layout.ts";

const WRITTEN_TO = "design/wartosci/measured.json";
/** Past every payload a recording in `captures/` carries, so each walk stays bounded (**S2**). */
const MAXIMUM_PAYLOADS = 4096;

/**
 * ⚠️ **Not a measurement.** Each word is this repository's translation of that key's entry in
 * `docs/protocol-keys.md`, kept here so the seven artboards spell it once. The register owns the
 * meaning; nothing of the game's own prose is copied (`NOTICE.md`, **L2**).
 */
const WORDS_FOR_KEY: Record<string, string> = {
    "aura-ac_per": "pancerz",
    "aura-resall": "odporności",
    "aura-sa_per": "szybkość ataku",
    "aura-adddmg2_per-meele": "obrażenia bronią białą",
    "critval-allies": "siła krytyka",
    "critmval-allies": "mnożnik krytyka",
    "allslow_per": "szybkość ataku",
    "alllowdmg": "obrażenia",
    "active_decblock_per-enemies": "blok",
    "lowheal_per-enemies": "leczenie",
    "+spell-taken_dmg-all": "otrzymywane obrażenia",
    /** Not a figure: its value is a character's name, and the provocation section draws it. */
    "shout": "prowokacja",
    "removedot-allies": "trucizny i rany zdjęte",
    "removeslow-allies": "spowolnienie zdjęte",
    "removestun-allies": "ogłuszenie zdjęte",
};

interface KeyReading {
    key: string;
    words: string;
    amounts: number[];
    casts: number;
    /** Every skill the corpus announces this key on, as the game names it. */
    skills: string[];
    doesStateAmount: boolean;
}

interface SkillReading {
    skillId: number;
    skillName: string;
    /** The keys it declares that reach a side, in the order the announcement carries them. */
    keys: string[];
    turnsStated: number;
}

/** One moment where two casts of one skill stood together at different figures. */
interface CoveredMoment {
    recording: string;
    skillName: string;
    amounts: number[];
}

interface WidestMoment {
    recording: string;
    /** Distinct keys standing together, which is the rows a statistic-per-row shape would draw. */
    keys: number;
    /** Casts standing together, which is the rows a skill-per-row shape would draw. */
    casts: number;
}

interface Measured {
    readAt: string;
    recordings: number;
    keys: KeyReading[];
    skills: SkillReading[];
    covered: { moments: number; examples: CoveredMoment[] };
    widest: WidestMoment;
    /** What a row has to fit, so an artboard is drawn against the window and not against a guess. */
    longestSkillName: string;
    longestWords: string;
}

const STATED: StatedSkills = {
    turnsBySkillId: composeAuraTurnsBySkillId(FROZEN_AURA_TURNS.skills),
    shoutsBySkillId: composeShoutsBySkillId(FROZEN_AURA_TURNS.shouts),
};

/** The figures one announcement declared, by the key that carried each. */
function composeAmountsFromEvent(event: BattleEvent): Map<string, number | null> {
    const found = new Map<string, number | null>();
    if (event.kind !== "skill-used") return found;
    for (const one of event.declared) {
        if (!isTeamWideKey(one.effect)) continue;
        found.set(one.effect, one.amount);
    }
    return found;
}

function addKeyReading(
    into: Map<string, KeyReading>,
    key: string,
    amount: number | null,
    skill: string,
): void {
    const seen = into.get(key) ?? {
        key,
        words: WORDS_FOR_KEY[key] ?? key,
        amounts: [],
        casts: 0,
        skills: [],
        doesStateAmount: false,
    };
    seen.casts += 1;
    if (amount !== null) {
        seen.doesStateAmount = true;
        if (!seen.amounts.includes(amount)) seen.amounts.push(amount);
    }
    if (!seen.skills.includes(skill)) seen.skills.push(skill);
    into.set(key, seen);
}

function compose(): Measured {
    const paths = readRecordingPaths();
    const keys = new Map<string, KeyReading>();
    const skills = new Map<number, SkillReading>();
    const examples: CoveredMoment[] = [];
    let moments = 0;
    let widest: WidestMoment = { recording: "", keys: 0, casts: 0 };

    for (const path of paths) {
        const steps = composeFightReplaySteps(getRecordedFightAt(path));
        assert(steps.length < MAXIMUM_PAYLOADS, "a recording stays inside its stated bound");
        const amountsByCast = new Map<string, Map<string, number | null>>();
        for (const step of steps) {
            const reading = step.replay.reading;
            for (const event of reading.events) {
                if (event.kind !== "skill-used") continue;
                if (event.actorId === null) continue;
                const declared = composeAmountsFromEvent(event);
                if (declared.size === 0) continue;
                amountsByCast.set(`${event.actorId}/${event.skillId}`, declared);
            }
            const held = composeFightStandings(reading.events, STATED, reading.roster).standings;
            const standing = new Map<string, number[]>();
            for (const one of held) {
                const declared = amountsByCast.get(`${one.casterId}/${one.skillId}`) ?? new Map();
                for (const [key, amount] of declared) {
                    const seen = standing.get(key) ?? [];
                    if (amount !== null) seen.push(amount);
                    standing.set(key, seen);
                }
            }
            if (standing.size > widest.keys) {
                widest = { recording: path, keys: standing.size, casts: held.length };
            }
            for (const [key, amounts] of standing) {
                if (amounts.length < 2) continue;
                if (new Set(amounts).size < 2) continue;
                moments += 1;
                if (examples.length < 3) {
                    examples.push({
                        recording: path,
                        skillName: keys.get(key)?.skills[0] ?? key,
                        amounts: [...amounts].sort((left, right) => left - right),
                    });
                }
            }
        }

        const events = steps[steps.length - 1]?.replay.reading.events ?? [];
        for (const event of events) {
            if (event.kind !== "skill-used") continue;
            const declared = composeAmountsFromEvent(event);
            if (declared.size === 0) continue;
            for (const [key, amount] of declared) addKeyReading(keys, key, amount, event.skillName);
            if (event.skillId === null) continue;
            const turnsStated = STATED.shoutsBySkillId.get(event.skillId)?.turns ??
                STATED.turnsBySkillId.get(event.skillId);
            if (turnsStated === undefined) continue;
            skills.set(event.skillId, {
                skillId: event.skillId,
                skillName: event.skillName,
                keys: [...declared.keys()],
                turnsStated,
            });
        }
    }

    const named = [...keys.values()];
    const wording = named.map((one) => one.words);
    const skillNames = [...skills.values()].map((one) => one.skillName);
    assert(named.length > 0, "the corpus declares something that reaches a side");
    assert(skillNames.length > 0, "and announces it on a skill the table dates");
    return {
        readAt: new Date().toISOString().slice(0, 10),
        recordings: paths.length,
        keys: named.sort((left, right) => left.key.localeCompare(right.key)),
        skills: [...skills.values()].sort((left, right) => left.skillId - right.skillId),
        covered: { moments, examples },
        widest,
        longestSkillName: skillNames.reduce((a, b) => (b.length > a.length ? b : a)),
        longestWords: wording.reduce((a, b) => (b.length > a.length ? b : a)),
    };
}

if (import.meta.main) {
    const measured = compose();
    Deno.writeTextFileSync(WRITTEN_TO, `${JSON.stringify(measured, null, 4)}\n`);
    console.log(
        `${WRITTEN_TO}: ${measured.keys.length} keys over ${measured.recordings} recordings`,
    );
    console.log(`covered moments: ${measured.covered.moments}`);
    console.log(`widest: ${measured.widest.keys} keys, ${measured.widest.casts} casts`);
}
