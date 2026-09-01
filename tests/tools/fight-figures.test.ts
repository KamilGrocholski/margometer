/**
 * The table, read back out of the lines it is composed as.
 *
 * Read rather than run: the report is this repository's own text, so a guard over it holds the
 * composition and never parses another program's output (**W6**).
 */

import { assert, assertArrayIncludes, assertExists } from "@std/assert";
import { composeFigureReport } from "@/tools/fight-figures.ts";
import { composeFightReplay, composeReplayedMaterial } from "@/tools/fight-replay.ts";
import { getRecordedFightAt } from "@/tools/recorded-fights.ts";

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";
/** A fight of one call, so a report over a fight with nothing in it is still a report. */
const EMPTY = { name: "a fight nobody recorded", calls: [{ init: 1, m: [] }] };

function getReportOf(path: string): string[] {
    return composeFigureReport(composeFightReplay(getRecordedFightAt(path)));
}

Deno.test("the report is headed by the recording and states both sides", () => {
    const lines = getReportOf(HILDUR);
    assert(
        lines.includes("=== 2026-08-06-tempest-grupa-vs-hildur-1785244275300-none ==="),
        "named for its file",
    );
    assert(lines.some((line) => line.includes("—— side 1 (10) ——")), "one side, with its count");
    assert(lines.some((line) => line.includes("—— side 2 (1) ——")), "and the other");
    // Neither side is called ours: the reader's own is stated once, as the client's answer.
    assert(lines.some((line) => line.includes("reader's side 1")), "stated as a fact");
    assert(!lines.some((line) => line.includes("our side")), "and never worded as a verdict");
});

Deno.test("everybody the roster holds gets a row, and the fight gets its totals", () => {
    const replay = composeFightReplay(getRecordedFightAt(HILDUR));
    const lines = getReportOf(HILDUR);
    for (const combatant of replay.roster.byId.values()) {
        assert(
            lines.some((line) => line.trim().startsWith(combatant.name)),
            `${combatant.name} is on the table`,
        );
    }
    const totals = lines.find((line) => line.trim().startsWith("everybody"));
    assertExists(totals, "the fight's own sums close the table");
    assert(
        totals.includes(`${replay.statistics.totals.damageDealtApplied}`),
        "and they are the aggregate's, not this tool's",
    );
});

/**
 * **W5**: zero is a boundary. A report silent about its reading reads exactly like one that never
 * learned to state it, which is the fault this block exists to have fixed.
 */
Deno.test("the reading block prints at zero, on a fight where nothing went wrong", () => {
    const lines = composeFigureReport(composeFightReplay(EMPTY));
    assert(
        lines.some((line) => line.includes("what the reading could not do")),
        "the block is there",
    );
    for (const caption of ["unread messages", "casts unplaced", "messages lost"]) {
        const line = lines.find((one) => one.trim().startsWith(caption));
        assertExists(line, `${caption} is stated`);
        assert(line.trim().endsWith("0"), `${caption} is stated at zero rather than dropped`);
    }
});

Deno.test("a fight the protocol never closed says so instead of inventing an end", () => {
    const lines = composeFigureReport(composeFightReplay(EMPTY));
    assert(
        lines.some((one) => one.includes("the fight states no outcome")),
        "no winner is guessed",
    );
    assert(!lines.some((one) => one.includes("won:")), "and no side is named");

    const closed = getReportOf(HILDUR);
    assert(closed.some((one) => one.includes("won:  Gracz")), "a fight that ended names its sides");
    assert(closed.some((one) => one.includes("lost: Hildur")), "both of them");
});

Deno.test("every recording composes a report", () => {
    const replayed = composeReplayedMaterial([]);
    assert(replayed.replays.length > 1, "there is material to report on");
    for (const replay of replayed.replays) {
        const lines = composeFigureReport(replay);
        assert(lines.length > 5, `${replay.name} composes a table`);
        assertArrayIncludes(
            lines,
            [`=== ${replay.name} ===`],
            `${replay.name} heads its own report`,
        );
    }
});
