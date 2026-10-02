/**
 * How tall the card a person's row opens stands, measured in lines over the recordings. The card
 * is the panel's own (`src/ui/panel-element.ts`, which also owns what a line costs), composed for
 * every ranking row of the fight the runtime's chain replays. The counts stay here (**V5**).
 *
 *     deno task panel:cards                      every recording, and the height it comes to
 *     deno task panel:cards [recording.json …]   one recording
 *     deno task panel:cards --tallest            the tallest cards, with whom and where
 */

import { assert, assertExists, assertStrictEquals } from "@std/assert";
import { parseArgs } from "@std/cli";
import { formatInteger } from "#/libs/number-text.ts";
import { CARD_LINE, presentCard, tallyCardSize } from "#/src/ui/panel-element.ts";
import {
    getSideRelation,
    NOTHING_SUSPECT,
    presentScreen,
    type RankingRow,
} from "#/src/ui/panel-content.ts";
import { type PanelMetric, SCREEN_ORDER, SIDE_CHOICE } from "#/src/ui/panel-screen.ts";
import { TYPE_STEP_DEFAULT } from "#/src/ui/panel-choice.ts";
import { PANEL_WORDS } from "#/src/ui/panel-words.ts";
import {
    formatRecordingName,
    lookupRecordingPaths,
    readRecordedMaterial,
    type ReplayedFight,
    replayRecordedMaterial,
} from "./recorded-material.ts";
import { CardHeightError } from "./margometer-tool-error.ts";

/** One card, and where it was opened from, so a figure can be gone and looked at. */
export interface CardHeight {
    recording: string;
    screen: PanelMetric;
    name: string;
    lines: number;
    groups: number;
    notes: number;
}

interface CardArguments {
    isTallest: boolean;
    paths: string[];
}

/**
 * Past the corpus by a wide margin: 315 ranking rows over `captures/` on 2026-09-25 times the four
 * screens is 1,260. The bound is loud rather than a clamp, because a walk that stopped counting
 * would report a median over the cards it reached and read like one over all of them.
 */
const CARDS_MAXIMUM = 65_536;
const ARGUMENTS_MAXIMUM = 64;
/** How many of the tallest `--tallest` names, which is a screenful and not a bound on anything. */
const TALLEST_LISTED = 12;

/** Every card the ranking of every screen opens, in the order the screens and rows are drawn. */
export function tallyCardHeights(replayed: readonly ReplayedFight[]): CardHeight[] {
    const heights: CardHeight[] = [];
    for (const replayedFight of replayed) {
        for (const height of tallyFightCardHeights(replayedFight)) {
            if (heights.length >= CARDS_MAXIMUM) {
                throw new CardHeightError(`more cards than the ${CARDS_MAXIMUM} a run holds`);
            }
            heights.push(height);
        }
    }
    assert(heights.length >= replayed.length, "every fight opens at least one card");
    return heights;
}

function tallyFightCardHeights(replayed: ReplayedFight): CardHeight[] {
    const { view, figures } = replayed.reading;
    const heights: CardHeight[] = [];
    for (const screen of SCREEN_ORDER) {
        const reading = presentScreen(
            figures.statistics,
            view.roster,
            screen,
            SIDE_CHOICE.everyone,
            view.readerSide,
            NOTHING_SUSPECT,
        );
        for (const row of reading.rows) heights.push(tallyCardHeight(replayed, screen, row));
    }
    assert(heights.length > 0, "a fight replayed ranks somebody to open a card on");
    return heights;
}

function tallyCardHeight(
    replayed: ReplayedFight,
    screen: PanelMetric,
    row: RankingRow,
): CardHeight {
    assert(Number.isSafeInteger(row.combatantId), "a ranking row names somebody by number");
    const reading = presentCard({
        name: row.name ?? PANEL_WORDS.unknown,
        profession: row.profession,
        sideRelation: getSideRelation(row.side, replayed.reading.view.readerSide),
        detail: row.detail,
        metric: screen,
        // A ranking row opens at every screen (`docs/drill-levels.md`), so the card carries the
        // gesture line. Measured without one it would be a card the panel never draws.
        doesOpen: true,
        isRowNarrower: false,
        translate: null,
    });
    const size = tallyCardSize(reading, TYPE_STEP_DEFAULT);
    assert(size.lines > 0, "a card drawn at all stands at least one line");
    const notes = reading.groups
        .flatMap((group) => group.lines)
        .filter((line) => line.kind === CARD_LINE.note).length;
    return {
        recording: formatRecordingName(replayed.fight.path),
        screen,
        name: reading.name,
        lines: size.lines,
        groups: size.groups,
        notes,
    };
}

export function formatHeightReport(heights: readonly CardHeight[]): string[] {
    assert(heights.length > 0, "a report is written over cards that were measured");
    const lines = heights.map((height) => height.lines).toSorted((count, otherCount) =>
        count - otherCount
    );
    const notes = heights.map((height) => height.notes).toSorted((count, otherCount) =>
        count - otherCount
    );
    const tallest = lines.at(-1);
    assertExists(tallest, "the tallest card is one of the cards measured");
    const said = [
        `cards          ${formatInteger(heights.length)}`,
        `lines median   ${formatInteger(getMedian(lines))}`,
        `lines tallest  ${formatInteger(tallest)}`,
        `notes median   ${formatInteger(getMedian(notes))}`,
    ];
    const countByLines = new Map<number, number>();
    for (const height of heights) {
        countByLines.set(height.lines, (countByLines.get(height.lines) ?? 0) + 1);
    }
    const counted = [...countByLines].toSorted((tally, otherTally) => tally[0] - otherTally[0]);
    assertStrictEquals(
        counted.length,
        countByLines.size,
        "a distribution states every height once",
    );
    said.push("heights        " + counted.map(([lines, count]) => `${lines}:${count}`).join(" "));
    return said;
}

/** The middle of an ordered run, and the lower of the two where it has an even count. */
function getMedian(ordered: readonly number[]): number {
    assert(ordered.length > 0, "a median is taken of something");
    const median = ordered[Math.floor((ordered.length - 1) / 2)];
    assertExists(median, "the middle of an ordered run is inside it");
    return median;
}

export function formatTallestReport(heights: readonly CardHeight[]): string[] {
    assert(heights.length > 0, "the tallest cards are listed out of cards that were measured");
    const ordered = heights.toSorted((height, otherHeight) => otherHeight.lines - height.lines);
    return ordered.slice(0, TALLEST_LISTED).map((height) =>
        `${
            formatInteger(height.lines)
        } lines  ${height.screen}  ${height.name}  ${height.recording}`
    );
}

function parseCardArguments(stated: readonly string[]): CardArguments {
    if (stated.length > ARGUMENTS_MAXIMUM) {
        throw new CardHeightError(`more than ${ARGUMENTS_MAXIMUM} arguments`);
    }
    const parsed = parseArgs([...stated], { boolean: ["tallest"] });
    const paths = lookupRecordingPaths(parsed._);
    if (paths === null) {
        throw new CardHeightError("a recording is named by a path and never by a number");
    }
    return { isTallest: parsed.tallest, paths };
}

if (import.meta.main) {
    const asked = parseCardArguments(Deno.args);
    const material = readRecordedMaterial(asked.paths);
    const heights = tallyCardHeights(replayRecordedMaterial(material));
    console.log(`material ${material.material}`);
    for (const line of formatHeightReport(heights)) console.log(line);
    if (asked.isTallest) {
        for (const line of formatTallestReport(heights)) console.log(line);
    }
}
