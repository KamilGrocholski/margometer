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
    assertThrows,
} from "@std/assert";
import { parseTableCells, parseUnwrappedText } from "#/tests/markdown-document.ts";
import {
    lookupRecordedFight,
    readRecordedFights,
    tallyRecordedFight,
} from "#/tests/recorded-fights.ts";
import { CARD_WORDS } from "#/src/ui/panel-words.ts";
import { isOneOf } from "#/libs/vocabulary.ts";
import { TurnCountError } from "#/tools/margometer-tool-error.ts";
import { replayRecordedSteps } from "#/tools/recorded-material.ts";
import {
    composeTurnBoundaries,
    composeTurnGrades,
    formatCaseReport,
    getTurnOutcome,
    getTurnPlacing,
    getTurnVerdict,
    NO_STRETCH,
    parseTurnArguments,
    TURN_OUTCOME,
    TURN_OUTCOMES,
    TURN_PLACING,
    TURN_PLACINGS,
    TURN_VERDICT,
    TURN_VERDICTS,
    type TurnGrade,
} from "#/tools/turn-count.ts";

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

const REGISTER_PATH = "docs/turns-taken.md";
const REGISTER_HEADING = "## The register";
const SECTION_OPENER = "## ";
/**
 * The one recording `a01bf11` left a figure for, which is the only number this reading can be
 * argued with from outside. Its commit body reports 8 / 3 / 1 for a reading it then deleted.
 */
const BOAR = "captures/2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json";
/** The one recording whose message numbering breaks, which is the one stretch nobody was told. */
const UNNARRATED = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";
/**
 * The five variants the client spells are `+stun2` and four suffixed by element, beside the plain
 * `+stun` (`develop:docs/protocol-keys.md`).
 */
const STUN_OPENER = "+stun";
let gradesHeld: TurnGrade[] | null = null;

Deno.test("the register reader finds the register, and nothing else in the file", () => {
    const sample = "## The register\n\n| recording | the game agrees | steps | agreed | granted " +
        "| taken | short | lost |\n| - | - | - | - | - | - | - | - |\n" +
        "| 2026-08-04-tempest-lowca-vs-odyncze | `in a lump` | — | — | — | — | — | — |\n";
    assertEquals(
        parseRegisterRows(sample).map(formatRegisterKey),
        ["2026-08-04-tempest-lowca-vs-odyncze | in a lump | — | — | — | — | — | —"],
        "the reader works",
    );
    // The sample it must not flag: a register row standing before the heading, and a row of the
    // vocabulary tables, whose second cell is a sentence rather than a verdict.
    const elsewhere = "| 2026-08-04-lowca | `in a lump` | — | — | — | — | — | — |\n" +
        "## The register\n" +
        "| `always` | the game's numbering agreed at every step it could be asked |\n" +
        "| recording | the game agrees | steps | agreed | granted | taken | short | lost |\n";
    assertEquals(parseRegisterRows(elsewhere), [], "a table outside the register is not one");
});

/**
 * The register's own table and no other in the file. Read by the heading it sits under, because
 * the document carries vocabulary tables too, and a reader taking those would compare a word
 * against a recording.
 */
function parseRegisterRows(text: string): RegisterRow[] {
    const found: RegisterRow[] = [];
    let isInside = false;
    for (const line of text.split("\n")) {
        if (line.startsWith(REGISTER_HEADING)) isInside = true;
        else if (line.startsWith(SECTION_OPENER)) {
            if (isInside) break;
        }
        if (!isInside) continue;
        if (!line.startsWith("| ")) continue;
        const [name, verdict, steps, agreed, granted, taken, short, lost] = parseTableCells(line);
        if (lost === undefined) continue;
        if (!isOneOf(TURN_VERDICTS, verdict)) continue;
        found.push({
            name: name!,
            verdict,
            steps: steps!,
            agreed: agreed!,
            granted: granted!,
            taken: taken!,
            short: short!,
            lost,
        });
    }
    return found;
}

function formatRegisterKey(one: RegisterRow): string {
    return `${one.name} | ${one.verdict} | ${one.steps} | ${one.agreed} | ${one.granted} | ` +
        `${one.taken} | ${one.short} | ${one.lost}`;
}

Deno.test("the register names every recording graded, and no recording that is not", () => {
    const measured = new Set(getGrades().map(formatMeasuredKey));
    const written = new Set(
        parseRegisterRows(Deno.readTextFileSync(REGISTER_PATH)).map(formatRegisterKey),
    );
    assert(written.size > 0, "the register carries rows");
    const unwritten = [...measured].filter((one) => !written.has(one)).sort();
    assertEquals(unwritten, [], `${REGISTER_PATH}: a recording is graded that the register omits`);
    const ungraded = [...written].filter((one) => !measured.has(one)).sort();
    assertEquals(ungraded, [], `${REGISTER_PATH}: the register names a grade nothing produces`);
});

/** Every recording graded once for every case that reads the whole of them. */
function getGrades(): TurnGrade[] {
    if (gradesHeld === null) gradesHeld = composeTurnGrades(readRecordedFights());
    return gradesHeld;
}

/** The same line off the tree rather than off the document, so the two can be compared as sets. */
function formatMeasuredKey(grade: TurnGrade): string {
    const stretch = grade.stretch;
    const bounded = grade.bounded === 0
        ? [NO_STRETCH, NO_STRETCH]
        : [`${grade.bounded}`, `${grade.exact}`];
    const wider = stretch === null
        ? [NO_STRETCH, NO_STRETCH, NO_STRETCH, NO_STRETCH]
        : [`${stretch.granted}`, `${stretch.taken}`, `${stretch.short}`, `${stretch.lost}`];
    return `${grade.name} | ${grade.verdict} | ${[...bounded, ...wider].join(" | ")}`;
}

/**
 * The sharp claim, and the one that is unbeaten: where the game numbered exactly one turn, that
 * turn is charged to the combatant the game names. `elsewhere` is the reading naming the wrong
 * person, a worse failure than miscounting, which is why it is held at zero on its own.
 */
Deno.test("a turn the game numbered on its own goes onto the row the game named", () => {
    let placed = 0;
    for (const grade of getGrades()) {
        assertArrayIncludes(TURN_VERDICTS, [grade.verdict], `${grade.verdict} is a verdict`);
        assert(grade.turns >= 0, `${grade.name} holds no less than no turn`);
        assert(grade.placed <= grade.bounded, `${grade.name}: a boundary placed is one graded`);
        placed += grade.placed;
        assertStrictEquals(grade.elsewhere, 0, `${grade.name}: a turn went onto the wrong row`);
    }
    assertStrictEquals(placed, 588, "the boundaries narrow enough to ask it of, 2026-09-25");
});

/**
 * And the wide claim, which is most of the evidence and is not unbeaten. The totals are pinned
 * with the date they were measured on: a change to what opens a turn moves them, and the register
 * beside this test is where the movement has to be argued for (**W8**).
 */
Deno.test("the count agrees with the numbering at all but three boundaries", () => {
    const total = { bounded: 0, exact: 0, over: 0, under: 0, untold: 0 };
    for (const grade of getGrades()) {
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
    assertStrictEquals(
        total.bounded,
        1244,
        "the boundaries the game numbered and told, 2026-09-25",
    );
    assertStrictEquals(total.exact, 1241, "and the ones the count agreed with, 2026-09-25");
    assertStrictEquals(total.over, 0, "no turn is opened where the game numbered none");
    assertStrictEquals(total.under, 3, "and three the game numbered opened nothing");
    assertStrictEquals(total.untold, 1, "one stretch the game numbered and never narrated");
    assertStrictEquals(TURN_OUTCOMES.length, 3, "the outcomes a count can come to");
    assertStrictEquals(TURN_PLACINGS.length, 2, "and the ones a placing can");
});

/**
 * The refusal, on the one boundary that earns it. The game numbers thirteen turns across it, sends
 * one message for them, and skips 26 of its own message indices, so grading it would charge this
 * reading with turns nobody was told about.
 */
Deno.test("a stretch the game never narrated is counted apart and graded by nothing", () => {
    const boundaries = composeTurnBoundaries(replayRecordedSteps(lookupRecordedFight(UNNARRATED)));
    const untold = boundaries.filter((one) => !one.isNarrated);
    assertStrictEquals(untold.length, 1, "one stretch of this recording went untold, 2026-09-25");
    const only = untold[0]!;
    assertEquals(
        [only.from, only.to, only.counted],
        [235, 248, 1],
        "the ordinals it spans, and the one message the game sent across them",
    );
    assert(boundaries.every((one) => one.advance > 0), "a boundary runs forwards");
});

/**
 * The control. `a01bf11` reports 8 / 3 / 1 over this recording for the reading it deleted, and
 * reproducing it says the reading recovered here is that one rather than a near neighbour. The
 * game numbers this fight once, so nothing else can check it.
 */
Deno.test("the boar recording reproduces the figures the deleted reading left behind", () => {
    const taken = [...tallyRecordedFight(BOAR).statistics.byCombatantId.values()]
        .map((figures) => figures.turnsTaken)
        .filter((turns) => turns > 0)
        .sort((one, other) => other - one);
    assertEquals(taken, [8, 3, 1], "the split the deleted reading reported");
});

/**
 * ⚠️ **The alarm for the one failure `develop ADR 0049` named and could not see.** A lost turn is
 * read by the shape of a sentence, so a world wording the announcement otherwise reads nought for
 * everybody, which is indistinguishable from a fight nobody was stunned in. The protocol's stun
 * keys say nothing in anybody's language, so a stun stated with nothing heard is this reading
 * having stopped working.
 *
 * **It licenses no figure**: a turn goes missing for more reasons than this key, and a red here is
 * a question about that recording, never a licence to bend either figure.
 */
Deno.test("no recording states a stun while reading no lost turn at all", () => {
    // The key reader first, on a sample it must take and one it must refuse: without the second a
    // reader answering true to everything would walk the recordings and find nothing to report.
    assert(isStunKey("+stun"), "the plain key the help names");
    assert(isStunKey("+stun2-d"), "and the element-shaped variant a monster carries");
    assert(!isStunKey("+stunning"), "a key that only opens with those letters is not one");
    assert(!isStunKey("-stun"), "and neither is an end this key never takes");
    const silent: string[] = [];
    let stunned = 0;
    let heard = 0;
    for (const fight of readRecordedFights()) {
        let lost = 0;
        let stuns = 0;
        for (const figures of tallyRecordedFight(fight.path).statistics.byCombatantId.values()) {
            lost += figures.turnsLost;
            for (const [key, count] of figures.procsWhenStriking) {
                if (isStunKey(key)) stuns += count;
            }
        }
        if (lost > 0) heard += 1;
        if (stuns === 0) continue;
        stunned += 1;
        if (lost > 0) continue;
        silent.push(`${fight.path}: ${stuns} stuns and no lost turn read`);
    }
    assertEquals(silent, [], "a stun the protocol states and an announcement nobody heard");
    // Both ways, so a reader that had stopped finding either half cannot pass on the empty list.
    assert(stunned > 0, "some recording states a stun, or the key reader found nothing");
    assert(heard > 0, "and some recording reads a lost turn, or the shape reader found nothing");
});

/** Walked rather than matched (C7), and opened at the plus so the letters elsewhere are not one. */
function isStunKey(key: string): boolean {
    if (!key.startsWith(STUN_OPENER)) return false;
    if (key === STUN_OPENER) return true;
    return key.startsWith(`${STUN_OPENER}2`);
}

Deno.test("the cases state a line for every recording, and the heading above them", () => {
    const grades = composeTurnGrades([lookupRecordedFight(BOAR)]);
    const cases = formatCaseReport(grades);
    assertStrictEquals(cases.length, grades.length + 1, "a heading and a line per recording");
    assertStringIncludes(cases[1]!, TURN_VERDICT.inLump, "the boar recording is numbered once");
});

Deno.test("an outcome says which of the three a count came to", () => {
    assertStrictEquals(getTurnOutcome(1, 1), TURN_OUTCOME.exact, "one where the game numbered one");
    assertStrictEquals(getTurnOutcome(0, 1), TURN_OUTCOME.under, "none where it numbered one");
    assertStrictEquals(getTurnOutcome(2, 1), TURN_OUTCOME.over, "two where one passed");
    // Zero is a boundary and so is one (W5), and a wide advance is graded the same way.
    assertStrictEquals(getTurnOutcome(13, 13), TURN_OUTCOME.exact, "thirteen where it said so");
    assertStrictEquals(getTurnOutcome(12, 13), TURN_OUTCOME.under, "and twelve is one short");
});

Deno.test("a placing is asked only of one turn the game numbered on its own", () => {
    assertStrictEquals(getTurnPlacing(1, 1, 1), TURN_PLACING.exact, "the named one's own");
    assertStrictEquals(getTurnPlacing(1, 0, 1), TURN_PLACING.elsewhere, "and somebody else's");
    assertStrictEquals(getTurnPlacing(0, 0, 1), null, "nothing counted says nothing about whose");
    assertStrictEquals(getTurnPlacing(2, 1, 1), null, "two turns say nothing of which was theirs");
    // The condition the recordings cannot show, because nothing in them counts one turn across a
    // wider advance: the queue names who held the **first** of several ordinals.
    assertStrictEquals(getTurnPlacing(1, 1, 3), null, "one turn across three is placed by nothing");
    assertStrictEquals(getTurnPlacing(1, 0, 2), null, "and so is one across two");
});

Deno.test("a verdict says what the steps under it came to", () => {
    assertStrictEquals(getTurnVerdict([]), TURN_VERDICT.inLump, "nothing graded");
    assertStrictEquals(getTurnVerdict([TURN_OUTCOME.exact]), TURN_VERDICT.always, "one, agreed");
    const mixed = [TURN_OUTCOME.exact, TURN_OUTCOME.over];
    assertStrictEquals(getTurnVerdict(mixed), TURN_VERDICT.sometimes, "one of each");
    assertStrictEquals(getTurnVerdict([TURN_OUTCOME.under]), TURN_VERDICT.never, "none agreed");
});

/**
 * The shortfall is never negative, which is the half the register cannot say by itself: a positive
 * one is a turn granted and spent on nothing, which the game announces; a negative one would be a
 * turn counted that the game never numbered, and there is no such thing to count.
 */
Deno.test("no recording counts a turn the game did not grant", () => {
    let stretches = 0;
    for (const grade of getGrades()) {
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
    assert(stretches > 0, "the recordings state a stretch to measure over");
});

/**
 * ⚠️ **The register's prose carried the same measurement as the guard, and the two drifted**, so
 * the figures are composed here and the document is asked to carry them word for word (V5).
 */
Deno.test("the sentences summing the register carry the figures the tree produces", () => {
    const total = { bounded: 0, exact: 0, short: 0, lost: 0, asked: 0, level: 0 };
    for (const grade of getGrades()) {
        total.bounded += grade.bounded;
        total.exact += grade.exact;
        const stretch = grade.stretch;
        if (stretch === null) continue;
        total.asked += 1;
        total.short += stretch.short;
        total.lost += stretch.lost;
        if (stretch.short === stretch.lost) total.level += 1;
    }
    assert(total.asked > 0, "there are recordings the whole-fight reading can be asked of");
    assert(total.level <= total.asked, "no more agree than were asked");
    const register = parseUnwrappedText(Deno.readTextFileSync(REGISTER_PATH));
    assertStringIncludes(
        register,
        `${total.exact} of the ${total.bounded} graded agree`,
        `${REGISTER_PATH}: the boundaries that agree, as the tree counts them`,
    );
    assertStringIncludes(
        register,
        `the ordinal says ${total.short} turns went missing where the game announces ${total.lost}`,
        `${REGISTER_PATH}: the two columns, summed`,
    );
    assertStringIncludes(
        register,
        `exact on ${total.level} of the ${total.asked} recordings that can be asked`,
        `${REGISTER_PATH}: how many of them meet`,
    );
});

/**
 * The label is the whole of what tells a reader **which** turns are counted, so it is held against
 * the document that argues for it: this register measures the gap between the turns a combatant
 * took and the turns the game granted them, and names the label that gap justifies.
 */
Deno.test("the card's turn labels are the ones this register argues for", () => {
    const register = Deno.readTextFileSync(REGISTER_PATH);
    assertStringIncludes(
        register,
        `\`${CARD_WORDS.turns}\``,
        `${REGISTER_PATH}: the label the card draws is the one the register names`,
    );
    // ⚠️ **Both, and the backticks make it two checks rather than one.** The longer label opens
    // with the shorter, so a register carrying only the longer would satisfy a bare search for the
    // shorter, and the card draws each on a different fight (`develop ADR 0110`).
    assertStringIncludes(
        register,
        `\`${CARD_WORDS.turnsWithLost}\``,
        `${REGISTER_PATH}: the label a fight with a lost turn draws is named as well`,
    );
});

Deno.test("a recording is named by a path, and a bare number is refused", () => {
    assertEquals(parseTurnArguments(["--cases"]), { isCases: true, paths: [] }, "the flag alone");
    const paths = [BOAR, UNNARRATED];
    assertEquals(parseTurnArguments(paths), { isCases: false, paths }, "and the paths as named");
    assertThrows(() => parseTurnArguments(["12"]), TurnCountError, "never by a number");
});
