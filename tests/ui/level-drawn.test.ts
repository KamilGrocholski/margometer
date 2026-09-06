/**
 * Every level the corpus can reach, drawn, and read back off the document it was drawn into.
 *
 * Two things nothing else holds, and both fail silently. The panel counts a level's rows in one
 * place and draws them in another (`getRowsForDrill` and its neighbours in
 * `src/ui/panel-element.ts`), and a count that stopped agreeing with the drawing is a section cut
 * off mid-way. And a card is looked up by a key each row states for itself, so two rows stating
 * one key is a row wearing its neighbour's card — the register refuses the second quietly.
 *
 * Held over every recording rather than over the screen a change was made on, because the
 * arithmetic and the keys both differ per rung, and any one test exercises one of six.
 *
 * ⚠️ **No recording collides two keys**, so the walk proves the key half only by finding one that
 * a writer put on every row — measured 2026-09-06 by giving the ranking one key for all of them,
 * which lit it. The pair of samples at the end is what proves the reader itself, and it has to
 * be: the convergence this file was written after is between two spellings a screen cannot draw
 * at once today.
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { composePanelHost, type ShownScreen } from "@/src/ui/panel-element.ts";
import {
    composeDrillReading,
    composeHalfNamedDrillReading,
    composeHalfNamedReading,
    composePairReading,
    composePanelReading,
    composePartReading,
    type DrillReading,
    getMetricForPinned,
    type NamedPart,
    NOTHING_SUSPECT,
    type PanelMetric,
    type PanelReading,
    PINNED_CASES,
} from "@/src/ui/panel-reading.ts";
import type { CombatantRoster } from "@/src/core/combatant-roster.ts";
import type { FightStatistics } from "@/src/core/fight-statistics.ts";
import { type PanelSideChoice, SCREEN_ORDER } from "@/src/ui/panel-screen.ts";
import { CLASS } from "@/src/ui/panel-look.ts";
import { composeReplayedMaterial, type FightReplay } from "@/tools/fight-replay.ts";
import { readRecordingPaths } from "@/tests/recorded-fight.ts";
import { composeFakeDocument, type FakeElement, getElementsWithin } from "@/tests/fake-document.ts";

/** The property a list states its height in, and the whole of what a list writes on its style. */
const ROWS_VARIABLE = "--MargoMeter-rows";
const STYLE_ATTRIBUTE = "style";
/** What a row states its own card under. Spelled here, as every mark a test presses by is. */
const TIP_ATTRIBUTE = "data-tip";
/**
 * What a figure reads when it is not one. Spelled out rather than imported: a test reading the
 * word back from the module that writes it holds the two to be the same and neither to be right
 * (`tests/AGENTS.md`).
 */
const NOT_KNOWN = "Nie wiadomo";
/** The sign a figure below nothing opens with, which is the one thing no drawn figure may be. */
const MINUS_SIGN = "-";
/** The three the strip offers, and the two that need a seat to mean anything. */
const SIDE_CHOICES: readonly PanelSideChoice[] = ["everyone", "reader", "opposing"];

/** A region as it was drawn: how many rows it promised to stand, and how many it holds. */
interface RegionDrawn {
    promised: number;
    drawn: number;
    failures: number;
    /** Each row's card key, against the words on that row, so two rows sharing one are visible. */
    saidByKey: Map<string, Set<string>>;
    /** Every figure on the screen as a reader reads it, and every bar's own declaration. */
    figures: string[];
    widths: string[];
}

function readRegionDrawn(shown: ShownScreen): RegionDrawn {
    const document = composeFakeDocument();
    let failures = 0;
    const panel = composePanelHost(document, () => {}, () => {
        failures += 1;
    });
    panel.show(shown);
    const host = panel.element as FakeElement;
    const list = getElementsWithin(host).find((one) => one.className.startsWith(CLASS.list));
    assertExists(list, "every screen the panel draws stands a list somewhere");
    const stated = list.attributes.get(STYLE_ATTRIBUTE) ?? "";
    const [named, count] = stated.split(":");
    assertEquals(named, ROWS_VARIABLE, "and a list states its height and nothing else");
    return {
        promised: Number(count),
        drawn: list.children.length,
        failures,
        saidByKey: readRowKeys(host),
        ...readFiguresDrawn(host),
    };
}

/**
 * Every figure the screen states, and the declaration each bar was drawn with. A figure and a
 * name are read apart on purpose: `Nie wiadomo` is what a row with nobody behind it is **called**,
 * and it is also what a figure that is not a number reads — one is an answer, the other a defect.
 */
function readFiguresDrawn(host: FakeElement): { figures: string[]; widths: string[] } {
    const figures: string[] = [];
    const widths: string[] = [];
    for (const one of getElementsWithin(host)) {
        if (one.className === CLASS.bar) widths.push(one.attributes.get(STYLE_ATTRIBUTE) ?? "");
        if (one.className.split(" ").includes(CLASS.figure)) figures.push(one.textContent);
    }
    return { figures, widths };
}

/**
 * What each row on the screen says, gathered under the key its card is looked up by. Read off the
 * whole host and not off the list: the two pinned rows stand outside it and are drawn beside
 * every level, so a key of theirs meeting one of the list's is a collision a list-only walk
 * cannot see.
 */
function readRowKeys(host: FakeElement): Map<string, Set<string>> {
    const saidByKey = new Map<string, Set<string>>();
    for (const one of getElementsWithin(host)) {
        if (one.className.split(" ")[0] !== CLASS.row) continue;
        const key = one.attributes.get(TIP_ATTRIBUTE);
        if (key === undefined) continue;
        const said = getElementsWithin(one).map((part) => part.textContent).join("|");
        const held = saidByKey.get(key) ?? new Set<string>();
        held.add(said);
        saidByKey.set(key, held);
    }
    return saidByKey;
}

/** One screen of one recording, with nothing open — the view every level is reached from. */
function composeShownScreen(
    reading: PanelReading,
    metric: PanelMetric,
    side: PanelSideChoice,
    hasReaderSide: boolean,
): ShownScreen {
    return {
        listName: "one place",
        reading,
        current: metric,
        side,
        hasReaderSide,
        shelf: [],
        isOnShelf: false,
        storage: "local",
        hasFightToSave: true,
        shelfAnswers: [],
        defects: [],
        drill: null,
        pair: null,
        part: null,
        halfNamed: null,
        halfNamedDrill: null,
        place: null,
        isCollapsed: false,
    };
}

/**
 * Whether a region was drawn short. Its own function because the walk below cannot prove it: a
 * comparison that answered "no" to everything would agree with all 12,814 levels, so this is what
 * the sample at the end is handed.
 */
function getIsRegionShort(seen: RegionDrawn): boolean {
    if (seen.failures > 0) return true;
    return seen.promised < seen.drawn;
}

/** The keys two different rows both stated, which is a row wearing its neighbour's card. */
function getKeysShared(seen: RegionDrawn): string[] {
    const found: string[] = [];
    for (const [key, said] of seen.saidByKey) {
        if (said.size > 1) found.push(`${key} on ${said.size} rows`);
    }
    return found;
}

/**
 * A figure a reader cannot read: one that is not a number, or one below nothing. Zero is neither
 * — it is a measurement (`CONTEXT.md`) — and a bar whose width went below nothing is the same
 * defect one step later, as a declaration the browser drops without saying so.
 */
function getFiguresUnreadable(seen: RegionDrawn): string[] {
    const found: string[] = [];
    for (const one of seen.figures) {
        if (one.includes(NOT_KNOWN)) found.push(`a figure reading "${one}"`);
        if (one.trimStart().startsWith(MINUS_SIGN)) found.push(`a figure below nothing: ${one}`);
    }
    for (const one of seen.widths) {
        if (one.includes(`width:${MINUS_SIGN}`)) found.push(`a bar drawn at ${one}`);
    }
    return found;
}

/** What a level was found wrong in, or nothing. Named, so a failure says which rung it was. */
function getRegionShortfall(where: string, shown: ShownScreen): string | null {
    const seen = readRegionDrawn(shown);
    const shared = [...getKeysShared(seen), ...getFiguresUnreadable(seen)];
    if (shared.length > 0) return `${where}: ${shared.join(", ")}`;
    if (!getIsRegionShort(seen)) return null;
    return `${where}: promised ${seen.promised}, drew ${seen.drawn}, ${seen.failures} undrawn`;
}

/** The parts of an opened figure that open onto a level of their own, both kinds at once. */
function composeOpenedParts(drill: DrillReading): NamedPart[] {
    const skills = drill.bySkill.rows.filter((one) => one.doesOpenPart).map((one) => one.part);
    const kinds = drill.byElement.rows.filter((one) => one.doesOpenPart).map((
        one,
    ): NamedPart => ({ kind: "element", element: one.element }));
    return [...skills, ...kinds];
}

interface LevelWalk {
    replay: FightReplay;
    metric: PanelMetric;
    side: PanelSideChoice;
    readerSide: number | null;
    base: ShownScreen;
    short: string[];
}

/** The rungs reached by opening a row: the figure itself, a pair inside it, and a part of it. */
function addOpenedRungs(walk: LevelWalk, statistics: FightStatistics, roster: CombatantRoster) {
    let walked = 0;
    for (const row of walk.base.reading.rows) {
        const drill = composeDrillReading(statistics, roster, walk.metric, row.combatantId);
        if (drill === null) continue;
        walked += addLevel(walk, "opened", { drill });
        for (const other of drill.byOpponent.rows) {
            if (!other.doesOpenPair) continue;
            const pair = composePairReading(
                statistics,
                roster,
                walk.metric,
                row.combatantId,
                other.combatantId,
            );
            if (pair !== null) walked += addLevel(walk, "pair", { drill, pair });
        }
        for (const one of composeOpenedParts(drill)) {
            const part = composePartReading(statistics, roster, walk.metric, row.combatantId, one);
            if (part !== null) walked += addLevel(walk, "part", { drill, part });
        }
    }
    return walked;
}

/** And the branch off the ranking: a pinned row, and the two shapes of the level under it. */
function addPinnedRungs(walk: LevelWalk, statistics: FightStatistics, roster: CombatantRoster) {
    let walked = 0;
    for (const kase of PINNED_CASES) {
        if (getMetricForPinned(kase) !== walk.metric) continue;
        const halfNamed = composeHalfNamedReading(
            statistics,
            roster,
            kase,
            walk.side,
            walk.readerSide,
        );
        if (halfNamed === null) continue;
        walked += addLevel(walk, "unnamed", { halfNamed });
        const opened = [
            ...halfNamed.rows.map((one) => (
                { kind: "person" as const, combatantId: one.combatantId }
            )),
            ...halfNamed.kinds.rows.filter((one) => one.doesOpenPart).map((one) => (
                { kind: "element" as const, element: one.element }
            )),
        ];
        for (const one of opened) {
            const cut = composeHalfNamedDrillReading(
                statistics,
                roster,
                kase,
                walk.side,
                walk.readerSide,
                one,
            );
            if (cut !== null) walked += addLevel(walk, "unnamed cut", { halfNamedDrill: cut });
        }
    }
    return walked;
}

function addLevel(walk: LevelWalk, rung: string, over: Partial<ShownScreen>): number {
    const where = `${walk.replay.name} ${walk.metric}/${walk.side}/${rung}`;
    const found = getRegionShortfall(where, { ...walk.base, ...over });
    if (found !== null) walk.short.push(found);
    return 1;
}

Deno.test("every level stands as tall as it drew, with one card per row and no two alike", () => {
    const { replays } = composeReplayedMaterial(readRecordingPaths());
    assert(replays.length > 0, "there is material to walk");
    const short: string[] = [];
    let walked = 0;
    for (const replay of replays) {
        const { roster, statistics } = replay;
        const readerSide = replay.reading.readerSide;
        for (const metric of SCREEN_ORDER) {
            for (const side of SIDE_CHOICES) {
                // The two narrowed lists say nothing without a seat to narrow from, and the
                // reading answers `everyone` for both — walking them would be one view thrice.
                if (readerSide === null && side !== "everyone") continue;
                const reading = composePanelReading(
                    statistics,
                    roster,
                    metric,
                    side,
                    readerSide,
                    NOTHING_SUSPECT,
                );
                const base = composeShownScreen(reading, metric, side, readerSide !== null);
                const walk: LevelWalk = { replay, metric, side, readerSide, base, short };
                walked += addLevel(walk, "ranking", {});
                walked += addOpenedRungs(walk, statistics, roster);
                walked += addPinnedRungs(walk, statistics, roster);
            }
        }
    }
    assertEquals(
        short,
        [],
        "a region shorter than what it drew cuts a section off mid-way, and a key on two rows " +
            "puts one row's card over another",
    );
    // The reader is proved by what it reached as well as by what it passed: a walk that stopped
    // opening rows would agree with every level it never drew.
    assertEquals(walked, 13_042, "every level the corpus draws, 2026-09-06");
});

/**
 * The samples it must flag, and the one it must not. Without the first two the walk above would
 * stay green on a reader that had stopped comparing anything; without the third, on one that
 * called every region short.
 */
/** A region with nothing wrong with it, so a sample states only what it is changing. */
const NOTHING_DRAWN: RegionDrawn = {
    promised: 0,
    drawn: 0,
    failures: 0,
    saidByKey: new Map(),
    figures: [],
    widths: [],
};

Deno.test("a region shorter than what it drew is read as short, and a whole one is not", () => {
    const whole = { ...NOTHING_DRAWN, promised: 22, drawn: 22 };
    assert(
        getIsRegionShort({ ...whole, promised: 11 }),
        "a level standing eleven rows over twenty-two is a section cut off mid-way",
    );
    assert(
        getIsRegionShort({ ...whole, failures: 1 }),
        "and a region that gave way is short of what it was asked for, whatever it promised",
    );
    assert(
        !getIsRegionShort(whole),
        "a region as tall as its rows is whole, and a reader calling it short finds everything",
    );
});

/** The third claim both ways: what a reader can read passes, and what they cannot does not. */
Deno.test("a figure a reader cannot read is found, and one they can is left alone", () => {
    assertEquals(
        getFiguresUnreadable({
            ...NOTHING_DRAWN,
            figures: ["0", "354 258"],
            widths: ["width:0.0%"],
        }),
        [],
        "zero is a measurement and a figure is a figure",
    );
    assertEquals(
        getFiguresUnreadable({ ...NOTHING_DRAWN, figures: [NOT_KNOWN] }).length,
        1,
        "a figure that is not a number is a defect where a number was drawn",
    );
    assertEquals(
        getFiguresUnreadable({ ...NOTHING_DRAWN, figures: ["-12"] }).length,
        1,
        "and so is one below nothing",
    );
    assertEquals(
        getFiguresUnreadable({ ...NOTHING_DRAWN, widths: ["width:-30.0%;background:#fff"] }).length,
        1,
        "a bar the browser will drop the width of is the same defect one step later",
    );
});

/** And the same both ways for the keys: one row per key passes, two rows under one does not. */
Deno.test("a key stated by two rows is read as shared, and one stated by one is not", () => {
    const whole = { ...NOTHING_DRAWN, promised: 22, drawn: 22 };
    assertEquals(
        getKeysShared({
            ...whole,
            saidByKey: new Map([["row:7", new Set(["Hildur"])], ["row:8", new Set(["Luvia"])]]),
        }),
        [],
        "two rows with a key each wear their own cards",
    );
    assertEquals(
        getKeysShared({
            ...whole,
            saidByKey: new Map([["row:7", new Set(["Hildur", "Luvia"])]]),
        }),
        ["row:7 on 2 rows"],
        "and one key over two different rows is the second row wearing the first one's card",
    );
});
