/**
 * `docs/unannounced-damage.md` against every recording.
 *
 * The document's subject is a figure composed as a **remainder**, so its claims cannot be checked
 * by reading the code that composes it — the only check is to walk the events a second way and
 * ask whether the difference is what the document says it is.
 */

import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import {
    composeDrillReading,
    composePairReading,
    type PanelMetric,
} from "@/src/ui/panel-reading.ts";
import { getWordsForUnannounced } from "@/src/ui/panel-words.ts";
import { getUnwrapped } from "@/tests/markdown-document.ts";
import {
    BLOWS_GRANTED,
    getRecordedCombatants,
    getRecordedPayloads,
    readRecordingPaths,
} from "@/tests/recorded-fight.ts";

const REGISTER_PATH = "docs/unannounced-damage.md";
const DAMAGE_SCREENS: readonly PanelMetric[] = ["damageDealtApplied", "damageTakenApplied"];

interface ScreenTally {
    /** How many rows the corpus draws on this screen. */
    rows: number;
    /** What those rows hold, which is the remainder the panel draws. */
    figure: number;
    /** What the blows standing under no announcement come to, walked event by event. */
    fromBlows: number;
}

/** Both screens, and the count the panel states beside the row on one of them. */
interface CorpusTally {
    byScreen: Map<PanelMetric, ScreenTally>;
    /** Rows stating a figure and no blows at all — every point in them arrived without a swing. */
    blowless: number;
    blows: number;
}

function composeCorpusTally(): CorpusTally {
    const byScreen = new Map<PanelMetric, ScreenTally>();
    for (const metric of DAMAGE_SCREENS) byScreen.set(metric, { rows: 0, figure: 0, fromBlows: 0 });
    const tally: CorpusTally = { byScreen, blowless: 0, blows: 0 };
    for (const path of readRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        const events = getRecordedPayloads(path)
            .flatMap((payload) => decodeFightMessages(payload, roster, BLOWS_GRANTED));
        const byDealer = new Map<number, number>();
        const byTarget = new Map<number, number>();
        for (const event of events) {
            if (event.kind !== "attack") continue;
            if (event.announced !== null) continue;
            const applied = event.applied.reduce((sum, one) => sum + one.amount, 0);
            const dealer = event.actorId;
            const target = event.targetId;
            if (dealer !== null) byDealer.set(dealer, (byDealer.get(dealer) ?? 0) + applied);
            if (target !== null) byTarget.set(target, (byTarget.get(target) ?? 0) + applied);
        }
        const statistics = composeFightStatistics(events, new Map());
        for (const [combatantId, figures] of statistics.byCombatantId) {
            tally.blows += figures.blowsWithoutSkill;
            for (const metric of DAMAGE_SCREENS) {
                const drill = composeDrillReading(statistics, roster, metric, combatantId);
                const row = drill?.bySkill.plain;
                if (row === null || row === undefined) continue;
                const isDealt = metric === "damageDealtApplied";
                const walked = (isDealt ? byDealer : byTarget).get(combatantId) ?? 0;
                const held = byScreen.get(metric);
                if (held === undefined) continue;
                held.rows += 1;
                held.figure += row.figure;
                held.fromBlows += walked;
                if (!isDealt) continue;
                if (figures.blowsWithoutSkill > 0) continue;
                if (row.figure > 0) tally.blowless += 1;
            }
        }
    }
    return tally;
}

function getScreenTally(tally: CorpusTally, metric: PanelMetric): ScreenTally {
    const held = tally.byScreen.get(metric);
    assert(held !== undefined, `${metric} is a screen this walk counted`);
    assert(held.rows > 0, `${metric} draws the row at all, or the walk stopped finding it`);
    return held;
}

/** As the document writes a figure: grouped in threes, which is how a reader meets it there. */
function composeGrouped(figure: number): string {
    return figure.toLocaleString("en-US");
}

/**
 * ⚠️ **The claim the whole document stands on, and the only one a reading of the source cannot
 * settle.** The figure is a remainder, so nothing in `composeSkillCut` says what is in it — the
 * only check is to walk the blows a second way and require the two to meet. Until **ADR 0080**
 * they did not: health that went out under a key landed here too, 23.9% of the row on
 * `Otrzymane`. A recording that parts them again reddens here.
 */
Deno.test("the row holds the blows under it and nothing else, on both damage screens", () => {
    const tally = composeCorpusTally();
    const said = getUnwrapped(Deno.readTextFileSync(REGISTER_PATH));
    for (const metric of DAMAGE_SCREENS) {
        const held = getScreenTally(tally, metric);
        assertEquals(
            held.figure,
            held.fromBlows,
            `${metric}: the row holds something that was never a blow`,
        );
    }
    const dealt = getScreenTally(tally, "damageDealtApplied");
    const taken = getScreenTally(tally, "damageTakenApplied");
    assertEquals(dealt.figure, taken.figure, "the same blows, read from both ends");
    assertStringIncludes(
        said,
        `the row holds **${composeGrouped(dealt.figure)}** on each damage screen`,
        `${REGISTER_PATH}: what the row comes to`,
    );
    assertStringIncludes(
        said,
        `drawn in ${dealt.rows} sections of \`Zadane\` and ${taken.rows} of \`Otrzymane\``,
        `${REGISTER_PATH}: how many sections draw it`,
    );
});

/**
 * ⚠️ **A row named for a blow and holding none is the shape **ADR 0080** removed**, and zero is a
 * measurement rather than an absence of one: the walk that found six of them before the decision
 * is the walk that finds none after it, over the same material.
 */
Deno.test("no row states a figure with no blow under it", () => {
    const tally = composeCorpusTally();
    assertEquals(tally.blowless, 0, "a row named for a swing holds something that was not one");
    assert(tally.blows > 0, "and the corpus holds blows under no announcement at all");
});

/**
 * The label is the panel's, not the document's. A rename that reached one and not the other would
 * leave a document arguing about a row a reader never sees under that name.
 */
Deno.test("the document names the row by the words the panel draws on it", () => {
    const said = Deno.readTextFileSync(REGISTER_PATH);
    assertStringIncludes(
        said,
        `\`${getWordsForUnannounced("damageDealtApplied")}\``,
        `${REGISTER_PATH}: the words the panel draws are the words the document argues about`,
    );
});

/**
 * ⚠️ **A bound nothing reaches is held by nothing unless the reach is measured.** The document
 * states both runs; this is what re-earns them, and it is the pair the constant was picked
 * against.
 */
Deno.test("the longest runs the document cites are the runs the corpus holds", () => {
    let afterAnnouncement = 0;
    let anybody = 0;
    for (const path of readRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        for (const payload of getRecordedPayloads(path)) {
            const events = decodeFightMessages(payload, roster, BLOWS_GRANTED);
            let run = 0;
            let announced = 0;
            let striker: number | null = null;
            for (const event of events) {
                if (event.kind !== "attack") {
                    run = 0;
                    announced = 0;
                    striker = null;
                    continue;
                }
                if (event.actorId !== striker) {
                    run = 0;
                    announced = 0;
                    striker = event.actorId;
                }
                run += 1;
                if (event.announced !== null) announced += 1;
                if (run > anybody) anybody = run;
                if (announced > 0 && run > afterAnnouncement) afterAnnouncement = run;
            }
        }
    }
    const said = getUnwrapped(Deno.readTextFileSync(REGISTER_PATH));
    assertStringIncludes(
        said,
        `own consecutive blows over \`captures/\` is ${afterAnnouncement}, and the longest ` +
            `run of anybody's is ${anybody}`,
        `${REGISTER_PATH}: the two runs the bound was picked against`,
    );
});

/**
 * ⚠️ **The two figures under one constant.** `MAXIMUM_SKILLS` asserts a count per combatant in
 * core and folds a count per section in the panel, so a document citing one number for both would
 * be right about neither. Re-earned here because the source's own comments cite a third figure —
 * the distinct names over the whole corpus — which bounds nothing.
 */
Deno.test("the widest a skills map and a skills section reach are the figures written down", () => {
    let widestCombatant = 0;
    let widestFight = 0;
    for (const path of readRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        const events = getRecordedPayloads(path)
            .flatMap((payload) => decodeFightMessages(payload, roster, BLOWS_GRANTED));
        const named = new Set<string>();
        for (const [, figures] of composeFightStatistics(events, new Map()).byCombatantId) {
            if (figures.skills.size > widestCombatant) widestCombatant = figures.skills.size;
            for (const name of figures.skills.keys()) named.add(name);
        }
        if (named.size > widestFight) widestFight = named.size;
    }
    const said = getUnwrapped(Deno.readTextFileSync(REGISTER_PATH));
    assertStringIncludes(
        said,
        `the widest over \`captures/\` holds ${widestCombatant}`,
        `${REGISTER_PATH}: what the assertion in core is measured against`,
    );
    assertStringIncludes(
        said,
        `so the widest there is a fight's own count: ${widestFight}`,
        `${REGISTER_PATH}: what the fold in the panel is measured against`,
    );
});

/** The reader proved by a sample it must find and one it must not. */
Deno.test("the unwrapping reader joins a wrapped sentence and invents no word", () => {
    assertEquals(
        getUnwrapped("the longest run of an\nannouncer's own blows\nis 2"),
        "the longest run of an announcer's own blows is 2",
        "a sentence deno fmt broke across lines is one sentence again",
    );
    assertEquals(
        getUnwrapped("one  two\n\nthree"),
        "one two three",
        "and a blank line is not a word",
    );
});

/**
 * ⚠️ **The two levels of one screen, held against each other.** A pair is a section of its own,
 * composed by its own walk, so a key named on the level above and folded into the closing row
 * inside it is one program saying two things about one figure — and nothing was watching: the
 * columns still came to a hundred on both, because only the names disagreed. 21 pairs and 30,263
 * points read that way until **ADR 0080**.
 */
Deno.test("a key named in an opened section is named again inside every pair of it", () => {
    let checked = 0;
    for (const path of readRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        const events = getRecordedPayloads(path)
            .flatMap((payload) => decodeFightMessages(payload, roster, BLOWS_GRANTED));
        const statistics = composeFightStatistics(events, new Map());
        for (const [combatantId] of statistics.byCombatantId) {
            for (const metric of DAMAGE_SCREENS) {
                const drill = composeDrillReading(statistics, roster, metric, combatantId);
                if (drill === null) continue;
                const named = new Set(
                    drill.bySkill.rows
                        .filter((one) => one.part.kind === "source")
                        .map((one) => one.part.kind === "source" ? one.part.source : ""),
                );
                let insidePairs = 0;
                for (const other of drill.byOpponent.rows) {
                    const pair = composePairReading(
                        statistics,
                        roster,
                        metric,
                        combatantId,
                        other.combatantId,
                    );
                    if (pair === null) continue;
                    for (const part of pair.parts) {
                        if (part.part.kind !== "source") continue;
                        insidePairs += 1;
                        const inside = part.part.source;
                        assert(
                            named.has(inside),
                            `${path}: a pair names "${inside}", the section over it does not`,
                        );
                    }
                }
                if (insidePairs > 0) checked += 1;
            }
        }
    }
    assertEquals(checked, 35, "the sections whose pairs name a key, 2026-09-13");
});
