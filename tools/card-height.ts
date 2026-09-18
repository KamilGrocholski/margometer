/**
 * How tall the card a person's row opens stands, measured in lines over the recordings.
 *
 *     deno task panel:cards                     every recording, and the height it comes to
 *     deno task panel:cards [recording.json …]   one recording
 *     deno task panel:cards --tallest            the tallest cards, with whom and where
 *
 * It composes the card the panel composes, so a height here is the panel's own answer rather than
 * a second reading of the rule. `src/ui/panel-tip.ts` owns what a line costs. The counts stay
 * here, because they change with the next recording (**V5**).
 */

import { assert, assertExists, assertStrictEquals } from "@std/assert";
import { parseArgs } from "@std/cli";
import { composeIntegerText } from "@/libs/number-text.ts";
import { composeCardReading } from "@/src/ui/panel-card.ts";
import {
    composePanelReading,
    getPartOfSide,
    NOTHING_SUSPECT,
    type PanelMetric,
    type RankingRow,
} from "@/src/ui/panel-reading.ts";
import { SCREEN_ORDER } from "@/src/ui/panel-screen.ts";
import { getTipSize } from "@/src/ui/panel-tip.ts";
import { composeReplayedMaterial, type FightReplay } from "@/tools/fight-replay.ts";
import { CardHeightError } from "@/tools/margometer-tool-error.ts";

/**
 * Past the corpus by a wide margin: 302 ranking rows over `captures/` on 2026-09-18 times the four
 * screens is 1,208. The bound is loud rather than a clamp (**E7**), because a walk that stopped
 * counting would report a median over the cards it reached and read like one over all of them.
 */
const MAXIMUM_CARDS = 65_536;
const MAXIMUM_ARGUMENTS = 64;
/** How many of the tallest `--tallest` names, which is a screenful and not a bound on anything. */
const TALLEST_LISTED = 12;

/** One card, and where it was opened from — so a figure can be gone and looked at. */
interface CardHeight {
    recording: string;
    screen: PanelMetric;
    name: string;
    lines: number;
    groups: number;
    notes: number;
}

function composeHeightOfRow(
    replay: FightReplay,
    screen: PanelMetric,
    row: RankingRow,
): CardHeight {
    assert(Number.isSafeInteger(row.combatantId), "a ranking row names somebody by number");
    assert(replay.name.length > 0, "a card is measured against the recording it came from");
    const reading = composeCardReading({
        name: row.name ?? "",
        profession: row.profession,
        sidePart: getPartOfSide(row.side, replay.reading.readerSide),
        detail: row.detail,
        metric: screen,
        // A ranking row opens, at every screen (`docs/drill-levels.md`), so the card carries the
        // gesture line. Measuring it without one would measure a card the panel never draws.
        doesOpen: true,
        isRowNarrower: false,
        translate: null,
    });
    const size = getTipSize(reading);
    assert(size.lines > 0, "a card drawn at all stands at least one line");
    let notes = 0;
    for (const group of reading.groups) {
        for (const line of group.lines) {
            if (line.kind === "note") notes += 1;
        }
    }
    return {
        recording: replay.name,
        screen,
        name: reading.name,
        lines: size.lines,
        groups: size.groups,
        notes,
    };
}

function composeHeightsOfReplay(replay: FightReplay): CardHeight[] {
    assertExists(replay.statistics, "a replay measured for cards has an aggregate behind it");
    assert(SCREEN_ORDER.length > 0, "the strips draw at least one screen to open a card on");
    const heights: CardHeight[] = [];
    for (const screen of SCREEN_ORDER) {
        const reading = composePanelReading(
            replay.statistics,
            replay.roster,
            screen,
            "everyone",
            replay.reading.readerSide,
            NOTHING_SUSPECT,
        );
        for (const row of reading.rows) heights.push(composeHeightOfRow(replay, screen, row));
    }
    return heights;
}

/** The middle of an ordered run, and the lower of the two where it has an even count. */
function getMedianOfLines(ordered: readonly number[]): number {
    assert(ordered.length > 0, "a median is taken of something");
    assert(ordered[0] !== undefined, "and the run it is taken of is indexed from nought");
    const middle = Math.floor((ordered.length - 1) / 2);
    const found = ordered[middle];
    assertExists(found, "the middle of an ordered run is inside it");
    return found;
}

function composeHeightReport(heights: readonly CardHeight[]): string[] {
    assert(heights.length > 0, "a report is composed over cards that were measured");
    assert(heights.length <= MAXIMUM_CARDS, "and no more of them than the run states a bound for");
    const lines = heights.map((one) => one.lines).toSorted((one, other) => one - other);
    const notes = heights.map((one) => one.notes).toSorted((one, other) => one - other);
    const tallest = lines[lines.length - 1];
    assertExists(tallest, "the tallest card is one of the cards measured");
    const said = [
        `cards          ${composeIntegerText(heights.length)}`,
        `lines median   ${composeIntegerText(getMedianOfLines(lines))}`,
        `lines tallest  ${composeIntegerText(tallest)}`,
        `notes median   ${composeIntegerText(getMedianOfLines(notes))}`,
    ];
    const byLines = new Map<number, number>();
    for (const one of heights) byLines.set(one.lines, (byLines.get(one.lines) ?? 0) + 1);
    const counted = [...byLines].toSorted((one, other) => one[0] - other[0]);
    assertStrictEquals(counted.length, byLines.size, "a distribution states every height once");
    said.push("heights        " + counted.map(([at, count]) => `${at}:${count}`).join(" "));
    return said;
}

function composeTallestReport(heights: readonly CardHeight[]): string[] {
    assert(heights.length > 0, "the tallest cards are listed out of cards that were measured");
    assert(TALLEST_LISTED > 0, "and a listing of none would answer nobody");
    const ordered = [...heights].toSorted((one, other) => other.lines - one.lines);
    return ordered.slice(0, TALLEST_LISTED).map((one) =>
        `${composeIntegerText(one.lines)} lines  ${one.screen}  ${one.name}  ${one.recording}`
    );
}

interface CardArguments {
    isTallest: boolean;
    paths: string[];
}

function getArguments(stated: readonly string[]): CardArguments {
    assert(stated.length <= MAXIMUM_ARGUMENTS, "a run is given no more arguments than are read");
    assert(MAXIMUM_ARGUMENTS > 0, "and a run that took none would measure nothing");
    const parsed = parseArgs([...stated], { boolean: ["tallest"] });
    const paths = parsed._.filter((one): one is string => typeof one === "string");
    if (paths.length !== parsed._.length) {
        throw new CardHeightError("a recording is named by a path and never by a number");
    }
    return { isTallest: parsed.tallest, paths };
}

if (import.meta.main) {
    const asked = getArguments(Deno.args);
    const replayed = composeReplayedMaterial(asked.paths);
    const heights: CardHeight[] = [];
    for (const replay of replayed.replays) {
        for (const one of composeHeightsOfReplay(replay)) {
            if (heights.length >= MAXIMUM_CARDS) {
                throw new CardHeightError("more cards than the stated bound holds");
            }
            heights.push(one);
        }
    }
    console.log(`material ${replayed.material}`);
    for (const line of composeHeightReport(heights)) console.log(line);
    if (asked.isTallest) {
        for (const line of composeTallestReport(heights)) console.log(line);
    }
}
