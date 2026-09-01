/**
 * The action register, held against the recordings both ways.
 *
 * A guard that only refused a verdict the document does not name would stay green while the
 * document kept rows for recordings nobody has any more; one that only refused an unnamed
 * recording would stay green while every verdict in it went stale. So the two lists are compared
 * as sets, and each reader is proved by a sample it must flag and a sample it must not.
 */

import { assert, assertArrayIncludes, assertEquals, assertStrictEquals } from "@std/assert";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import { STEP_KEY } from "@/src/core/fight-decoder.ts";
import {
    ACTION_OUTCOMES,
    ACTION_READINGS,
    ACTION_VERDICTS,
    type ActionGrade,
    composeActionGrades,
    composeActionTally,
    composeActionTallyOfReplay,
    getOutcome,
    getVerdict,
} from "@/tools/action-count.ts";
import { composeFightReplay, composeRecordedMaterial } from "@/tools/fight-replay.ts";
import { getRecordedFightAt, getRecordedFights } from "@/tools/recorded-fights.ts";

const REGISTER_PATH = "docs/actions-taken.md";
/**
 * The one recording `a01bf11` left a figure for, which is the only number this round can be
 * argued with. Its commit body reports 8 / 3 / 1 for a reading it then deleted.
 */
const BOAR = "captures/2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json";

interface RegisterRow {
    name: string;
    struck: string;
    stepped: string;
}

function getCellsFromLine(line: string): string[] {
    const cells: string[] = [];
    let at = line.indexOf("|");
    assert(at >= 0, "a table line opens with a bar");
    let next = line.indexOf("|", at + 1);
    // The bound is the line's own length: a table row holds fewer cells than it holds characters.
    for (let held = 0; held < line.length; held += 1) {
        if (next === -1) break;
        cells.push(line.slice(at + 1, next).trim());
        at = next;
        next = line.indexOf("|", at + 1);
    }
    return cells;
}

/** The backticks are the document's, not the vocabulary's, so they come off before comparing. */
function getBareCell(cell: string): string {
    const open = cell.indexOf("`");
    if (open === -1) return cell;
    const close = cell.indexOf("`", open + 1);
    if (close === -1) return cell;
    return cell.slice(open + 1, close);
}

/**
 * The register's own table and no other in the file. Read by the heading it sits under, because
 * the document carries three vocabulary tables and a reader that took those would compare a word
 * against a recording.
 */
function getRegisterRows(text: string): RegisterRow[] {
    const found: RegisterRow[] = [];
    let inside = false;
    for (const line of text.split("\n")) {
        if (line.startsWith("## The register")) inside = true;
        else if (inside && line.startsWith("## ")) break;
        if (!inside) continue;
        if (!line.startsWith("| ")) continue;
        const cells = getCellsFromLine(line).map(getBareCell);
        const [name, struck, stepped] = cells;
        if (name === undefined || struck === undefined || stepped === undefined) continue;
        if (!ACTION_VERDICTS.includes(struck as never)) continue;
        if (!ACTION_VERDICTS.includes(stepped as never)) continue;
        found.push({ name, struck, stepped });
    }
    return found;
}

function composeRegisterKey(one: RegisterRow): string {
    return `${one.name} | ${one.struck} | ${one.stepped}`;
}

/** The grades folded the way the register writes them: one line per recording, both readings. */
function composeMeasuredKeys(grades: readonly ActionGrade[]): string[] {
    const byName = new Map<string, Map<string, string>>();
    for (const grade of grades) {
        const held = byName.get(grade.name) ?? new Map<string, string>();
        held.set(grade.reading, grade.verdict);
        byName.set(grade.name, held);
    }
    return [...byName].map(([name, verdicts]) =>
        `${name} | ${verdicts.get("struck")} | ${verdicts.get("stepped")}`
    );
}

Deno.test("the register reader finds the register, and nothing else in the file", () => {
    const sample = "## The register\n\n| recording | struck | stepped |\n| - | - | - |\n" +
        "| 2026-08-04-tempest-lowca-vs-odyncze | `in a lump` | `always` |\n";
    assertEquals(
        getRegisterRows(sample).map(composeRegisterKey),
        ["2026-08-04-tempest-lowca-vs-odyncze | in a lump | always"],
        "the reader works",
    );
    // The sample it must not flag: a register row standing before the heading, and a row of the
    // vocabulary tables, whose second cell is a sentence rather than a verdict.
    const elsewhere = "| 2026-08-04-lowca | `in a lump` | `always` |\n## The register\n" +
        "| `always` | the named combatant acted in every graded payload |\n" +
        "| recording | struck | stepped |\n";
    assertEquals(getRegisterRows(elsewhere), [], "a table outside the register is not one");
});

Deno.test("the register names every recording graded, and no recording that is not", () => {
    const measured = new Set(composeMeasuredKeys(composeActionGrades(getRecordedFights())));
    const written = new Set(
        getRegisterRows(Deno.readTextFileSync(REGISTER_PATH)).map(composeRegisterKey),
    );
    assert(written.size > 0, "the register carries rows");
    const unwritten = [...measured].filter((one) => !written.has(one)).sort();
    assertEquals(unwritten, [], `${REGISTER_PATH}: a recording is graded that the register omits`);
    const ungraded = [...written].filter((one) => !measured.has(one)).sort();
    assertEquals(ungraded, [], `${REGISTER_PATH}: the register names a grade nothing produces`);
});

Deno.test("every grade is one of the vocabularies the register states", () => {
    const grades = composeActionGrades([getRecordedFightAt(BOAR)]);
    assert(grades.length > 0, "the recording produces grades");
    for (const grade of grades) {
        assertArrayIncludes(ACTION_READINGS, [grade.reading], `${grade.reading} is a reading`);
        assertArrayIncludes(ACTION_VERDICTS, [grade.verdict], `${grade.verdict} is a verdict`);
        assert(grade.total >= 0, "a recording holds no less than no action");
        assert(grade.unattributed <= grade.total, "and no more nameless than it holds at all");
    }
    assertStrictEquals(ACTION_OUTCOMES.length, 4, "the outcomes a payload can come to");
});

Deno.test("the rows and the events count the same actions, over every recording", () => {
    const { replays } = { replays: composeRecordedMaterial([]).fights.map(composeFightReplay) };
    assert(replays.length > 0, "there is material to count over");
    for (const replay of replays) {
        // `composeActionTallyOfReplay` asserts the agreement itself; this is the walk that puts
        // every recording through it, and the figure below is what it comes to either way.
        const struck = composeActionTallyOfReplay(replay, "struck");
        const stepped = composeActionTallyOfReplay(replay, "stepped");
        assert(struck.total > 0, `${replay.name} carries an action`);
        assert(stepped.total >= struck.total, `${replay.name}: a step is an action struck is not`);
        assertStrictEquals(struck.unattributed, 0, `${replay.name}: every action was named`);
    }
});

/**
 * The control. `a01bf11` reports 8 / 3 / 1 for the reading it deleted, and reproducing it is what
 * says the definition recovered here is that one rather than a near neighbour.
 */
Deno.test("the boar recording reproduces the figures the deleted reading left behind", () => {
    const replay = composeFightReplay(getRecordedFightAt(BOAR));
    const stepped = composeActionTally(replay.reading.events, "stepped");
    const charged = [...stepped.byCombatantId.values()].sort((one, other) => other - one);
    assertEquals(charged, [8, 3, 1], "the split the deleted reading reported");
    const struck = composeActionTally(replay.reading.events, "struck");
    assertEquals(
        [...struck.byCombatantId.values()].sort((one, other) => other - one),
        [8, 1],
        "and the split without the step, which is not that one",
    );
});

Deno.test("a step is what the two readings differ by, and nothing else", () => {
    const replay = composeFightReplay(getRecordedFightAt(BOAR));
    let steps = 0;
    for (const event of replay.reading.events) {
        if (event.kind !== "declaration") continue;
        for (const declared of event.declared) {
            if (declared.effect === STEP_KEY) steps += 1;
        }
    }
    const struck = composeActionTally(replay.reading.events, "struck");
    const stepped = composeActionTally(replay.reading.events, "stepped");
    assert(steps > 0, "the recording carries a step to differ by");
    assertStrictEquals(stepped.total - struck.total, steps, "the difference is the steps");
});

/**
 * The corpus names an actor for every action it carries, so mutating the nameless term away lights
 * nothing over `captures/` — **W4**, and this is the missing test that answer asks for. The events
 * are written here rather than replayed, because no recording produces the case.
 */
Deno.test("an action the protocol named no actor for is counted, and charged to no row", () => {
    const events: BattleEvent[] = [
        {
            kind: "skill-used",
            actorId: null,
            targetId: 7,
            actorHealthPercent: null,
            targetHealthPercent: null,
            skillName: "Cios",
            skillId: null,
            declared: [],
        },
        {
            kind: "attack",
            actorId: 7,
            targetId: 8,
            actorHealthPercent: null,
            targetHealthPercent: null,
            raw: [],
            applied: [],
            prevented: [],
            destroyed: [],
            procs: [],
            declared: [],
            announced: null,
        },
    ];
    const tally = composeActionTally(events, "struck");
    assertStrictEquals(tally.total, 2, "both are actions");
    assertStrictEquals(tally.unattributed, 1, "and one of them is on nobody's row");
    assertEquals([...tally.byCombatantId], [[7, 1]], "the named end holds the other");
});

Deno.test("an outcome says which of the four a payload came to", () => {
    assertStrictEquals(getOutcome(new Map(), 7), "empty", "no action at all");
    assertStrictEquals(getOutcome(new Map([[7, 1]]), 7), "alone", "one action, and theirs");
    assertStrictEquals(getOutcome(new Map([[7, 1], [8, 1]]), 7), "leading", "theirs and another");
    assertStrictEquals(getOutcome(new Map([[8, 1]]), 7), "silent", "an action, none of it theirs");
    // Zero is a boundary and so is one (**W5**): a single action by somebody else is `silent`,
    // not `alone`, and a single action of theirs beside none is `alone`, not `leading`.
    assertStrictEquals(getOutcome(new Map([[7, 2]]), 7), "leading", "two of theirs is not alone");
});

Deno.test("a verdict says what the outcomes under it came to", () => {
    assertStrictEquals(getVerdict([]), "in a lump", "nothing graded");
    assertStrictEquals(getVerdict(["empty", "empty"]), "in a lump", "and nothing gradeable");
    assertStrictEquals(getVerdict(["alone", "empty"]), "always", "an empty payload grades none");
    assertStrictEquals(getVerdict(["alone", "silent"]), "sometimes", "one of each");
    assertStrictEquals(getVerdict(["silent"]), "never", "and none of them theirs");
});
