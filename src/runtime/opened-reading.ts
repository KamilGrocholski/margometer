/**
 * What stands under the rows a reader opened (`docs/design.md` §9): a person's figure, the pair of
 * two people, the part a figure was made of, and under a pinned row, what nobody was named for.
 * A mark that names no figure on this screen opens nothing, which is the answer a mark left over
 * from another screen deserves.
 */

import { assert } from "@std/assert/assert";
import {
    type DrillReading,
    HALF_NAMED_OPENED,
    type HalfNamedDrillReading,
    type HalfNamedOpened,
    type HalfNamedReading,
    lookupPinnedCase,
    type PairReading,
    type PartReading,
    presentDrill,
    presentHalfNamed,
    presentHalfNamedDrill,
    presentPair,
    presentPart,
} from "@/src/ui/panel-reading.ts";
import { OPENED_PART, type ScreenState } from "@/src/ui/panel-screen.ts";
import type { FightReading } from "@/src/runtime/fight-reading.ts";

export interface OpenedReadings {
    drill: DrillReading | null;
    pair: PairReading | null;
    part: PartReading | null;
    halfNamed: HalfNamedReading | null;
    halfNamedDrill: HalfNamedDrillReading | null;
}

export function presentOpenedReadings(reading: FightReading, screen: ScreenState): OpenedReadings {
    const statistics = reading.figures.statistics;
    const roster = reading.view.roster;
    const halfNamed = presentOpenedHalfNamed(reading, screen);
    const halfNamedDrill = presentOpenedHalfNamedDrill(reading, screen);
    const drill = screen.openRowId === null
        ? null
        : presentDrill(statistics, roster, screen.current, screen.openRowId);
    // A row nobody in the fight is on opens nothing, and nothing under it stands either.
    if (drill === null) return { drill: null, pair: null, part: null, halfNamed, halfNamedDrill };
    assert(drill.combatantId === screen.openRowId, "the row drawn open is the row opened");
    const pair = screen.openPairId === null
        ? null
        : presentPair(statistics, roster, screen.current, drill.combatantId, screen.openPairId);
    const part = screen.openPart === null
        ? null
        : presentPart(statistics, roster, screen.current, drill.combatantId, screen.openPart);
    return { drill, pair, part, halfNamed, halfNamedDrill };
}

function presentOpenedHalfNamed(
    reading: FightReading,
    screen: ScreenState,
): HalfNamedReading | null {
    if (screen.openUnnamedEnd === null) return null;
    const kase = lookupPinnedCase(screen.current, screen.openUnnamedEnd);
    if (kase === null) return null;
    const { statistics } = reading.figures;
    const { roster, readerSide } = reading.view;
    return presentHalfNamed(statistics, roster, kase, screen.side, readerSide);
}

function presentOpenedHalfNamedDrill(
    reading: FightReading,
    screen: ScreenState,
): HalfNamedDrillReading | null {
    if (screen.openUnnamedEnd === null) return null;
    const kase = lookupPinnedCase(screen.current, screen.openUnnamedEnd);
    if (kase === null) return null;
    const opened = lookupHalfNamedOpened(screen);
    if (opened === null) return null;
    const { statistics } = reading.figures;
    const { roster, readerSide } = reading.view;
    return presentHalfNamedDrill(statistics, roster, kase, screen.side, readerSide, opened);
}

/** A person or a key, and never both: the way back closes the key first, so one of them is null. */
function lookupHalfNamedOpened(screen: ScreenState): HalfNamedOpened | null {
    assert(screen.openUnnamedEnd !== null, "a pinned row's rung is asked of an open pinned row");
    if (screen.openRowId !== null) return null;
    if (screen.openPart !== null) {
        if (screen.openPart.kind !== OPENED_PART.element) return null;
        return { kind: HALF_NAMED_OPENED.element, element: screen.openPart.element };
    }
    if (screen.openPairId === null) return null;
    return { kind: HALF_NAMED_OPENED.person, combatantId: screen.openPairId };
}
