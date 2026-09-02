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
    composeCaseReport,
    composeTurnGrades,
    getOutcome,
    getVerdict,
    NO_STRETCH,
    TURN_OUTCOMES,
    TURN_VERDICTS,
    type TurnGrade,
} from "@/tools/turn-count.ts";
import { CARD_WORDS } from "@/src/ui/panel-words.ts";
import { composeFightReplay } from "@/tools/fight-replay.ts";
import { getRecordedFightAt, getRecordedFights } from "@/tools/recorded-fights.ts";

const REGISTER_PATH = "docs/turns-taken.md";
/**
 * The one recording `a01bf11` left a figure for, which is the only number this reading can be
 * argued with from outside. Its commit body reports 8 / 3 / 1 for a reading it then deleted.
 */
const BOAR = "captures/2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json";

interface RegisterRow {
    name: string;
    verdict: string;
    granted: string;
    taken: string;
    short: string;
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
        const [name, verdict, granted, taken, short] = cells;
        if (name === undefined) continue;
        if (verdict === undefined) continue;
        if (granted === undefined) continue;
        if (taken === undefined) continue;
        if (short === undefined) continue;
        if (!TURN_VERDICTS.includes(verdict as never)) continue;
        found.push({ name, verdict, granted, taken, short });
    }
    return found;
}

function composeRegisterKey(one: RegisterRow): string {
    return `${one.name} | ${one.verdict} | ${one.granted} | ${one.taken} | ${one.short}`;
}

/** The same line off the tree rather than off the document, so the two can be compared as sets. */
function composeMeasuredKey(grade: TurnGrade): string {
    const stretch = grade.stretch;
    const cells = stretch === null
        ? [NO_STRETCH, NO_STRETCH, NO_STRETCH]
        : [`${stretch.granted}`, `${stretch.taken}`, `${stretch.short}`];
    return `${grade.name} | ${grade.verdict} | ${cells.join(" | ")}`;
}

Deno.test("the register reader finds the register, and nothing else in the file", () => {
    const sample =
        "## The register\n\n| recording | the game agrees | granted | taken | short |\n" +
        "| - | - | - | - | - |\n" +
        "| 2026-08-04-tempest-lowca-vs-odyncze | `in a lump` | — | — | — |\n";
    assertEquals(
        getRegisterRows(sample).map(composeRegisterKey),
        ["2026-08-04-tempest-lowca-vs-odyncze | in a lump | — | — | —"],
        "the reader works",
    );
    // The sample it must not flag: a register row standing before the heading, and a row of the
    // vocabulary tables, whose second cell is a sentence rather than a verdict.
    const elsewhere = "| 2026-08-04-lowca | `in a lump` | — | — | — |\n## The register\n" +
        "| `always` | the game's numbering agreed at every step it could be asked |\n" +
        "| recording | the game agrees | granted | taken | short |\n";
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
 * The claim the whole round rests on: where the game's own numbering advanced by exactly one, one
 * turn passed, and the count says so. A step graded anything but `exact` is the finding — over,
 * under, or charged to somebody the game did not name.
 */
Deno.test("every step the game numbered one turn apart is counted as exactly that turn", () => {
    const grades = composeTurnGrades(getRecordedFights());
    let graded = 0;
    let exact = 0;
    for (const grade of grades) {
        assertArrayIncludes(TURN_VERDICTS, [grade.verdict], `${grade.verdict} is a verdict`);
        assert(grade.turns >= 0, `${grade.name} holds no less than no turn`);
        graded += grade.exact + grade.over + grade.under + grade.elsewhere;
        exact += grade.exact;
        assertStrictEquals(grade.over, 0, `${grade.name}: a turn was counted that never happened`);
        assertStrictEquals(grade.under, 0, `${grade.name}: a turn the game numbered was missed`);
        assertStrictEquals(grade.elsewhere, 0, `${grade.name}: a turn went onto the wrong row`);
    }
    assert(graded > 0, "the corpus states a numbering to be graded against");
    assertStrictEquals(exact, graded, "and every step of it agrees, 2026-09-02");
    assertStrictEquals(TURN_OUTCOMES.length, 4, "the outcomes a graded step can come to");
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

Deno.test("an outcome says which of the four a graded step came to", () => {
    assertStrictEquals(getOutcome(new Map([[7, 1]]), 7), "exact", "one turn, and theirs");
    assertStrictEquals(getOutcome(new Map(), 7), "under", "no turn where the game says one");
    assertStrictEquals(getOutcome(new Map([[8, 1]]), 7), "elsewhere", "one turn, somebody else's");
    assertStrictEquals(getOutcome(new Map([[7, 2]]), 7), "over", "two where one passed");
    // Zero is a boundary and so is one (**W5**): one turn of theirs beside one of somebody
    // else's is `over` and not `exact`, and one of theirs alone is `exact` and not `over`.
    assertStrictEquals(getOutcome(new Map([[7, 1], [8, 1]]), 7), "over", "one each is still two");
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
