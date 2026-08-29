/**
 * What a ranking row says on demand: every figure a combatant has, and not only the one the
 * screen is showing.
 *
 * The order answers the question a reader has in the order they have it — who is this, how much
 * of each, how they fought, and what to be careful of. The one on screen is in bold, so that
 * *he dealt a lot, but how much did he take* costs a hover rather than a press.
 */

import { assert } from "@std/assert";
import type { PanelMetric, RowDetail } from "@/src/ui/panel-reading.ts";
import { SCREEN_ORDER } from "@/src/ui/panel-screen.ts";
import type { TipGroup, TipLine, TipReading } from "@/src/ui/panel-tip.ts";
import {
    CARD_WORDS,
    composeCardSubtitleText,
    composeFigureText,
    getWordsForCardMetric,
    PANEL_WORDS,
    WARNING_MARK,
} from "@/src/ui/panel-words.ts";

/** Whose card this is, and what the screen it stands on already knows. */
export interface CardSubject {
    name: string;
    /** The game's own letter, or null where it named none. What they are, under their name. */
    profession: string | null;
    detail: RowDetail;
    /** Which of the four the screen is showing, which is the one drawn in bold. */
    metric: PanelMetric;
    /** What the screen says may be short about every figure on it, said again where they are. */
    warnings: readonly string[];
    /** Whether a press on the row opens anything, which decides the one instruction given. */
    opens: boolean;
}

/** One of the four, with the two things the protocol can say less than the whole of it about. */
interface CardFigure {
    metric: PanelMetric;
    figure: number;
    /** Before reduction, on the two the protocol states a raw half for. Null on the others. */
    raw: number | null;
    /** As much of it as the protocol named only this row's end of, and what that end is called. */
    halfNamed: { label: string; figure: number } | null;
}

/** No screen draws more than two, and a card that carried a page of them is not a card. */
const MAXIMUM_CARD_WARNINGS = 4;

/**
 * The four in the order the strip over the list puts them, which is the order asserted rather
 * than derived: a table read out of `SCREEN_ORDER` could not say which end each one is missing.
 */
function composeCardFigures(detail: RowDetail): CardFigure[] {
    const figures: CardFigure[] = [
        {
            metric: "damageDealtApplied",
            figure: detail.damageDealtApplied,
            raw: detail.damageDealtRaw,
            halfNamed: { label: PANEL_WORDS.withoutTarget, figure: detail.damageDealtToNobody },
        },
        {
            metric: "damageTakenApplied",
            figure: detail.damageTakenApplied,
            raw: detail.damageTakenRaw,
            halfNamed: { label: PANEL_WORDS.withoutActor, figure: detail.damageTakenFromNobody },
        },
        { metric: "healthGiven", figure: detail.healthGiven, raw: null, halfNamed: null },
        {
            metric: "healthRestored",
            figure: detail.healthRestored,
            raw: null,
            halfNamed: { label: PANEL_WORDS.withoutActor, figure: detail.healthRestoredByNobody },
        },
    ];
    const order = figures.map((one) => one.metric).join(" ");
    assert(
        order === SCREEN_ORDER.join(" "),
        "the card states the four the strip does, in its order",
    );
    assert(figures.every((one) => one.figure >= 0), "and no figure on it is below nothing");
    return figures;
}

/** A part of the figure over it, drawn only where there is a part to draw. */
function composeCardSubLine(label: string, figure: number): TipLine[] {
    assert(label.length > 0, "a part of a figure says what part it is");
    assert(Number.isFinite(figure), "and states how much of it there is");
    if (figure <= 0) return [];
    return [{ kind: "sub", label, stated: composeFigureText(figure) }];
}

/**
 * The four figures, each with what the protocol could say less than the whole of it about. Zero
 * stands: a combatant who healed nobody is a reading, and an absent line would be a question.
 */
function composeCardFigureLines(detail: RowDetail, metric: PanelMetric): TipLine[] {
    assert(SCREEN_ORDER.includes(metric), "the figure drawn in bold is one of the four");
    const lines: TipLine[] = [];
    for (const one of composeCardFigures(detail)) {
        lines.push({
            kind: "stat",
            label: getWordsForCardMetric(one.metric),
            stated: composeFigureText(one.figure),
            isStrong: one.metric === metric,
        });
        if (one.raw !== null) lines.push(...composeCardSubLine(CARD_WORDS.raw, one.raw));
        if (one.halfNamed !== null) {
            lines.push(...composeCardSubLine(one.halfNamed.label, one.halfNamed.figure));
        }
    }
    assert(lines.length >= SCREEN_ORDER.length, "every figure the panel has stands on the card");
    return lines;
}

/**
 * How they fought, rather than how much. Each is absent where it is nothing: a count of zero
 * blows says the same thing as the four figures above it already do, at the cost of a line.
 */
function composeCardCounterLines(detail: RowDetail): TipLine[] {
    assert(detail.blowsWithoutSkill <= detail.blowsStruck, "a blow behind no announcement is one");
    const lines: TipLine[] = [];
    if (detail.blowsStruck > 0) {
        lines.push({
            kind: "stat",
            label: CARD_WORDS.blows,
            stated: composeFigureText(detail.blowsStruck),
            isStrong: false,
        });
        lines.push(
            ...composeCardSubLine(CARD_WORDS.blowsWithoutSkill, detail.blowsWithoutSkill),
        );
    }
    for (
        const [label, figure] of [
            [CARD_WORDS.skillUses, detail.skillUses],
            [CARD_WORDS.prevented, detail.damagePrevented],
        ] as const
    ) {
        if (figure <= 0) continue;
        lines.push({ kind: "stat", label, stated: composeFigureText(figure), isStrong: false });
    }
    return lines;
}

/** Whether the card printed a figure before reduction, which is what the note is owed for. */
function getIsRawStated(detail: RowDetail): boolean {
    assert(detail.damageDealtRaw >= 0, "a figure before reduction is not below nothing");
    assert(detail.damageTakenRaw >= 0, "on either end of the blow it was stated for");
    if (detail.damageDealtRaw > 0) return true;
    if (detail.damageTakenRaw > 0) return true;
    return false;
}

/**
 * What to be careful of. The screen's own warnings are repeated here rather than left under the
 * list, because what they qualify is every figure on this card and a reader reading one is
 * looking away from the strip.
 */
function composeCardNoteLines(subject: CardSubject): TipLine[] {
    assert(subject.warnings.length <= MAXIMUM_CARD_WARNINGS, "a card stays inside its doubts");
    const lines: TipLine[] = [];
    if (getIsRawStated(subject.detail)) {
        lines.push({ kind: "note", text: CARD_WORDS.damageNote, isWarning: false });
    }
    for (const warning of subject.warnings) {
        assert(warning.length > 0, "a doubt the panel states is a sentence");
        lines.push({ kind: "note", text: `${WARNING_MARK}${warning}`, isWarning: true });
    }
    if (subject.opens) {
        lines.push({ kind: "note", text: CARD_WORDS.gesture, isWarning: false });
    }
    return lines;
}

/** Everything a ranking row says on demand, as the window's own shape. */
export function composeCardReading(subject: CardSubject): TipReading {
    assert(subject.name.length > 0, "a card names somebody, or says it cannot");
    assert(SCREEN_ORDER.includes(subject.metric), "and stands on a screen the panel draws");
    const groups: TipGroup[] = [
        { lines: composeCardFigureLines(subject.detail, subject.metric) },
    ];
    for (const lines of [composeCardCounterLines(subject.detail), composeCardNoteLines(subject)]) {
        if (lines.length === 0) continue;
        groups.push({ lines });
    }
    assert(groups.length <= 3, "and says it in the figures, the counters and the notes, at most");
    return {
        name: subject.name,
        subtitle: composeCardSubtitleText(subject.profession, subject.detail.level),
        groups,
    };
}
