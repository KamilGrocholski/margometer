/**
 * What a ranking row says on demand: every figure a combatant has, and not only the one the
 * screen is showing.
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

export interface CardSubject {
    name: string;
    profession: string | null;
    detail: RowDetail;
    metric: PanelMetric;
    warnings: readonly string[];
    opens: boolean;
}

interface CardFigure {
    metric: PanelMetric;
    figure: number;
    /** Before reduction, on the two the protocol states a raw half for. Null on the others. */
    raw: number | null;
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

function composeCardSubLine(label: string, figure: number): TipLine[] {
    assert(label.length > 0, "a part of a figure says what part it is");
    assert(Number.isFinite(figure), "and states how much of it there is");
    if (figure <= 0) return [];
    return [{ kind: "sub", label, stated: composeFigureText(figure) }];
}

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

function getIsRawStated(detail: RowDetail): boolean {
    assert(detail.damageDealtRaw >= 0, "a figure before reduction is not below nothing");
    assert(detail.damageTakenRaw >= 0, "on either end of the blow it was stated for");
    if (detail.damageDealtRaw > 0) return true;
    if (detail.damageTakenRaw > 0) return true;
    return false;
}

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
