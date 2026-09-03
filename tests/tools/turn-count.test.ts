/**
 * The turn register, held against the recordings both ways.
 *
 * A guard that only refused a verdict the document does not name would stay green while the
 * document kept rows for recordings nobody has any more; one that only refused an unnamed
 * recording would stay green while every verdict in it went stale. So the two lists are compared
 * as sets, and each reader is proved by a sample it must flag and a sample it must not.
 */

import {
    assert,
    assertArrayIncludes,
    assertEquals,
    assertStrictEquals,
    assertStringIncludes,
} from "@std/assert";
import {
    composeBoundaries,
    composeCaseReport,
    composeTurnGrades,
    getOutcome,
    getPlacing,
    getVerdict,
    NO_STRETCH,
    TURN_OUTCOMES,
    TURN_PLACINGS,
    TURN_VERDICTS,
    type TurnGrade,
} from "@/tools/turn-count.ts";
import { CARD_WORDS } from "@/src/ui/panel-words.ts";
import { composeFightReplay, composeFightReplaySteps } from "@/tools/fight-replay.ts";
import { getRecordedFightAt, getRecordedFights } from "@/tools/recorded-fights.ts";

const REGISTER_PATH = "docs/turns-taken.md";
/**
 * The one recording `a01bf11` left a figure for, which is the only number this reading can be
 * argued with from outside. Its commit body reports 8 / 3 / 1 for a reading it then deleted.
 */
const BOAR = "captures/2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json";
/** The one recording whose message numbering breaks, which is the one stretch nobody was told. */
const UNNARRATED = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";

interface RegisterRow {
    name: string;
    verdict: string;
    steps: string;
    agreed: string;
    granted: string;
    taken: string;
    short: string;
    lost: string;
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
 * the document carries vocabulary tables too and a reader that took those would compare a word
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
        const [name, verdict, steps, agreed, granted, taken, short, lost] = cells;
        if (name === undefined) continue;
        if (verdict === undefined) continue;
        if (steps === undefined) continue;
        if (agreed === undefined) continue;
        if (granted === undefined) continue;
        if (taken === undefined) continue;
        if (short === undefined) continue;
        if (lost === undefined) continue;
        if (!TURN_VERDICTS.includes(verdict as never)) continue;
        found.push({ name, verdict, steps, agreed, granted, taken, short, lost });
    }
    return found;
}

function composeRegisterKey(one: RegisterRow): string {
    return `${one.name} | ${one.verdict} | ${one.steps} | ${one.agreed} | ${one.granted} | ` +
        `${one.taken} | ${one.short} | ${one.lost}`;
}

/** The same line off the tree rather than off the document, so the two can be compared as sets. */
function composeMeasuredKey(grade: TurnGrade): string {
    const stretch = grade.stretch;
    const bounded = grade.bounded === 0
        ? [NO_STRETCH, NO_STRETCH]
        : [`${grade.bounded}`, `${grade.exact}`];
    const wider = stretch === null
        ? [NO_STRETCH, NO_STRETCH, NO_STRETCH, NO_STRETCH]
        : [`${stretch.granted}`, `${stretch.taken}`, `${stretch.short}`, `${stretch.lost}`];
    return `${grade.name} | ${grade.verdict} | ${[...bounded, ...wider].join(" | ")}`;
}

Deno.test("the register reader finds the register, and nothing else in the file", () => {
    const sample = "## The register\n\n| recording | the game agrees | steps | agreed | granted " +
        "| taken | short | lost |\n| - | - | - | - | - | - | - | - |\n" +
        "| 2026-08-04-tempest-lowca-vs-odyncze | `in a lump` | — | — | — | — | — | — |\n";
    assertEquals(
        getRegisterRows(sample).map(composeRegisterKey),
        ["2026-08-04-tempest-lowca-vs-odyncze | in a lump | — | — | — | — | — | —"],
        "the reader works",
    );
    // The sample it must not flag: a register row standing before the heading, and a row of the
    // vocabulary tables, whose second cell is a sentence rather than a verdict.
    const elsewhere = "| 2026-08-04-lowca | `in a lump` | — | — | — | — | — | — |\n" +
        "## The register\n" +
        "| `always` | the game's numbering agreed at every step it could be asked |\n" +
        "| recording | the game agrees | steps | agreed | granted | taken | short | lost |\n";
    assertEquals(getRegisterRows(elsewhere), [], "a table outside the register is not one");
});

Deno.test("the register names every recording graded, and no recording that is not", () => {
    const measured = new Set(composeTurnGrades(getRecordedFights()).map(composeMeasuredKey));
    const written = new Set(
        getRegisterRows(Deno.readTextFileSync(REGISTER_PATH)).map(composeRegisterKey),
    );
    assert(written.size > 0, "the register carries rows");
    const unwritten = [...measured].filter((one) => !written.has(one)).sort();
    assertEquals(unwritten, [], `${REGISTER_PATH}: a recording is graded that the register omits`);
    const ungraded = [...written].filter((one) => !measured.has(one)).sort();
    assertEquals(ungraded, [], `${REGISTER_PATH}: the register names a grade nothing produces`);
});

/**
 * The sharp claim, and the one that is unbeaten: where the game numbered exactly one turn, that
 * turn is charged to the combatant the game names. `elsewhere` is the reading naming the wrong
 * person, which is a worse failure than miscounting and is why it is held at zero on its own.
 */
Deno.test("a turn the game numbered on its own goes onto the row the game named", () => {
    const grades = composeTurnGrades(getRecordedFights());
    let placed = 0;
    for (const grade of grades) {
        assertArrayIncludes(TURN_VERDICTS, [grade.verdict], `${grade.verdict} is a verdict`);
        assert(grade.turns >= 0, `${grade.name} holds no less than no turn`);
        assert(grade.placed <= grade.bounded, `${grade.name}: a boundary placed is one graded`);
        placed += grade.placed;
        assertStrictEquals(grade.elsewhere, 0, `${grade.name}: a turn went onto the wrong row`);
    }
    assertStrictEquals(placed, 451, "the boundaries narrow enough to ask it of, 2026-09-03");
});

/**
 * And the wide claim, which is most of the evidence and is not unbeaten. The totals are pinned
 * with the date they were measured on: a change to what opens a turn moves them, and the register
 * beside this test is where the movement has to be argued for (**W8**).
 */
Deno.test("the count agrees with the numbering at all but eighteen boundaries", () => {
    const grades = composeTurnGrades(getRecordedFights());
    const total = { bounded: 0, exact: 0, over: 0, under: 0, untold: 0 };
    for (const grade of grades) {
        total.bounded += grade.bounded;
        total.exact += grade.exact;
        total.over += grade.over;
        total.under += grade.under;
        total.untold += grade.untold;
        assertStrictEquals(
            grade.exact + grade.over + grade.under,
            grade.bounded,
            `${grade.name}: every boundary graded came to one of the three`,
        );
    }
    assertStrictEquals(total.bounded, 998, "the boundaries the game numbered and told, 2026-09-03");
    assertStrictEquals(total.exact, 980, "and the ones the count agreed with");
    assertStrictEquals(total.over, 16, "a turn was opened where the game numbered none");
    assertStrictEquals(total.under, 2, "and a turn the game numbered opened nothing");
    assertStrictEquals(total.untold, 1, "one stretch the game numbered and never narrated");
    assertStrictEquals(TURN_OUTCOMES.length, 3, "the outcomes a count can come to");
    assertStrictEquals(TURN_PLACINGS.length, 2, "and the ones a placing can");
});

/**
 * The refusal, on the one boundary that earns it. The game numbers thirteen turns across it, sends
 * one message for them, and skips 26 of its own message indices — so there is nothing to grade,
 * and grading it would charge this reading with turns nobody was told about.
 */
Deno.test("a stretch the game never narrated is counted apart and graded by nothing", () => {
    const boundaries = composeBoundaries(composeFightReplaySteps(getRecordedFightAt(UNNARRATED)));
    const untold = boundaries.filter((one) => !one.isNarrated);
    assertStrictEquals(untold.length, 1, "one stretch of this recording went untold, 2026-09-03");
    const only = untold[0];
    assert(only !== undefined, "and it is there to be read");
    assertEquals(
        [only.from, only.to, only.counted],
        [235, 248, 1],
        "the ordinals it spans, and the one message the game sent across them",
    );
    assert(boundaries.every((one) => one.advance > 0), "a boundary runs forwards");
});

/**
 * The control. `a01bf11` reports 8 / 3 / 1 over this recording for the reading it deleted, and
 * reproducing it is what says the reading recovered here is that one rather than a near
 * neighbour. The game numbers this fight once, so nothing else can check it.
 */
Deno.test("the boar recording reproduces the figures the deleted reading left behind", () => {
    const replay = composeFightReplay(getRecordedFightAt(BOAR));
    const taken = [...replay.statistics.byCombatantId.values()]
        .map((figures) => figures.turnsTaken)
        .filter((turns) => turns > 0)
        .sort((one, other) => other - one);
    assertEquals(taken, [8, 3, 1], "the split the deleted reading reported");
});

Deno.test("a walk states a line for every payload, and the register states none of them", () => {
    const grades = composeTurnGrades([getRecordedFightAt(BOAR)]);
    const cases = composeCaseReport(grades);
    assertStrictEquals(cases.length, grades.length + 1, "a heading and a line per recording");
    assert(cases[1]?.includes("in a lump"), "the boar recording is numbered once");
});

Deno.test("an outcome says which of the three a count came to", () => {
    assertStrictEquals(getOutcome(1, 1), "exact", "one turn where the game numbered one");
    assertStrictEquals(getOutcome(0, 1), "under", "none where the game numbered one");
    assertStrictEquals(getOutcome(2, 1), "over", "two where one passed");
    // Zero is a boundary and so is one (**W5**), and a wide advance is graded the same way: a
    // count is held against the game's numbering whatever that numbering came to.
    assertStrictEquals(getOutcome(13, 13), "exact", "thirteen where the game numbered thirteen");
    assertStrictEquals(getOutcome(12, 13), "under", "and twelve is one short of it");
});

Deno.test("a placing is asked only of one turn the game numbered on its own", () => {
    assertStrictEquals(getPlacing(1, 1, 1), "exact", "the one turn was the named combatant's");
    assertStrictEquals(getPlacing(1, 0, 1), "elsewhere", "one turn, and somebody else's");
    assertStrictEquals(getPlacing(0, 0, 1), null, "nothing counted says nothing about whose");
    assertStrictEquals(
        getPlacing(2, 1, 1),
        null,
        "and two turns say nothing about which was theirs",
    );
    // The condition the corpus cannot show, because nothing in it counts one turn across a wider
    // advance: the queue names who held the **first** of several ordinals, so a single turn found
    // across three of them is not evidence that it was theirs.
    assertStrictEquals(getPlacing(1, 1, 3), null, "one turn across three is placed by nothing");
    assertStrictEquals(getPlacing(1, 0, 2), null, "and so is one across two");
});

Deno.test("a verdict says what the steps under it came to", () => {
    assertStrictEquals(getVerdict([]), "in a lump", "nothing graded");
    assertStrictEquals(getVerdict(["exact"]), "always", "one step, and it agreed");
    assertStrictEquals(getVerdict(["exact", "over"]), "sometimes", "one of each");
    assertStrictEquals(getVerdict(["under"]), "never", "and none of them agreed");
});

/**
 * The shortfall is never negative, and that is the half of it the register cannot say by itself:
 * a positive one is a turn the game granted and nobody spent, which the game announces; a negative
 * one would be a turn counted that the game never numbered, and there is no such thing to count.
 */
Deno.test("no recording counts a turn the game did not grant", () => {
    const grades = composeTurnGrades(getRecordedFights());
    let stretches = 0;
    for (const grade of grades) {
        const stretch = grade.stretch;
        if (stretch === null) continue;
        stretches += 1;
        assertStrictEquals(
            stretch.short,
            stretch.granted - stretch.taken,
            `${grade.name}: the shortfall is the difference it says it is`,
        );
        assert(stretch.short >= 0, `${grade.name}: more turns counted than the game granted`);
        assert(stretch.lost >= 0, `${grade.name}: a turn was unlost`);
        assert(stretch.lost <= stretch.granted, `${grade.name}: more lost than the game granted`);
        assert(stretch.taken > 0, `${grade.name}: a numbered stretch was acted in`);
    }
    assert(stretches > 0, "the corpus states a stretch to measure over");
});

/**
 * The label is the whole of what tells a reader **which** turns are counted, and it was free to
 * change without a test noticing — the goldens beside it read the word out of the module that
 * wrote it. So it is held against the document that argues for it, which is a second place and not
 * the same word twice: this register measures the gap between the turns a combatant took and the
 * turns the game granted them, and names the label that gap justifies.
 */
Deno.test("the card's turn label is the one this register argues for", () => {
    const register = Deno.readTextFileSync(REGISTER_PATH);
    assertStringIncludes(
        register,
        `\`${CARD_WORDS.turns}\``,
        `${REGISTER_PATH}: the label the card draws is the one the register names`,
    );
});
