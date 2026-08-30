/**
 * What a ranking row says on demand: every figure a combatant has, and not only the one the
 * screen is showing.
 */

import { getRankedOrder } from "@/src/ui/ranked-order.ts";
import { assert } from "@std/assert";
import type { CutPart, PanelMetric, RowDetail } from "@/src/ui/panel-reading.ts";
import { SCREEN_ORDER } from "@/src/ui/panel-screen.ts";
import type { TipGroup, TipLine, TipReading } from "@/src/ui/panel-tip.ts";
import {
    CARD_WORDS,
    composeCardSubtitleText,
    composeDestroyedText,
    composeFigureText,
    composeShareText,
    getWordsForBlowKey,
    getWordsForCardMetric,
    getWordsForDestroyed,
    PANEL_WORDS,
    type TranslateLabel,
    WARNING_MARK,
} from "@/src/ui/panel-words.ts";
import { CRITICAL_PROC_KEYS } from "@/src/core/fight-decoder.ts";

export interface CardSubject {
    name: string;
    profession: string | null;
    detail: RowDetail;
    metric: PanelMetric;
    warnings: readonly string[];
    opens: boolean;
    /** Asked only for a key this repository has no word for. Null on a page with no game on it. */
    translate: TranslateLabel | null;
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
/** Past the widest cut a card draws: fourteen worded procs, four destroyed, three defences. */
const MAXIMUM_CARD_PARTS = 64;
/** Counted in the line above it rather than beside it, so the card never says it twice. */
const OFFHAND_CRIT_KEY = "+of_crit";

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
    if (detail.skillUses > 0) {
        lines.push({
            kind: "stat",
            label: CARD_WORDS.skillUses,
            stated: composeFigureText(detail.skillUses),
            isStrong: false,
        });
    }
    return lines;
}

/**
 * Parts sharing a word are one row, and the word is what decides it.
 *
 * Five keys are worded `ogłuszenie` because they are one event from five sources — which is what
 * `+stun2-d`'s entry in `docs/protocol-keys.md` says. Drawn a key at a time they made two lines
 * reading the same word against different counts, which a reader can only take as a panel that
 * cannot add: nothing on screen says which stun either line is.
 */
function composeCardWordedParts(
    parts: readonly CutPart[],
    translate: TranslateLabel | null,
): Array<{ label: string; figure: number }> {
    assert(parts.length <= MAXIMUM_CARD_PARTS, "a card draws a cut inside its stated bound");
    const byLabel = new Map<string, number>();
    for (const part of parts) {
        const label = getWordsForBlowKey(part.key, translate);
        assert(label.length > 0, "a part a card draws is drawn under something");
        byLabel.set(label, (byLabel.get(label) ?? 0) + part.figure);
    }
    const folded = [...byLabel].map(([label, figure]) => ({ label, figure }));
    folded.sort((one, other) => getRankedOrder(one.figure, other.figure, one.label, other.label));
    assert(folded.length <= parts.length, "folding a cut never makes it longer");
    return folded;
}

/** Everything but the keys the line above it already counted, which would otherwise read twice. */
function composeCardProcLines(
    parts: readonly CutPart[],
    without: readonly string[],
    translate: TranslateLabel | null,
): TipLine[] {
    const kept = parts.filter((part) => !without.includes(part.key));
    return composeCardWordedParts(kept, translate).map((one) => ({
        kind: "stat",
        label: one.label,
        stated: composeFigureText(one.figure),
        isStrong: false,
    }));
}

/** Null where nothing was struck, because a rate of nothing is not zero — it is no rate. */
function composeCardCriticalText(detail: RowDetail): string | null {
    assert(detail.blowsCritical <= detail.blowsStruck, "a critical blow is a blow they struck");
    if (detail.blowsCritical <= 0) return null;
    if (detail.blowsStruck <= 0) return null;
    const share = composeShareText(detail.blowsCritical / detail.blowsStruck);
    return `${composeFigureText(detail.blowsCritical)} (${share})`;
}

/**
 * How they struck: how much of it landed critically, the hardest one, what else fired, and what
 * their blows took off the other side. The share is of **blows** rather than of anything the game
 * counts in time — nothing here counts a turn (`PRODUCT.md`).
 */
function composeCardStrikingLines(detail: RowDetail, translate: TranslateLabel | null): TipLine[] {
    const lines: TipLine[] = [];
    const critical = composeCardCriticalText(detail);
    if (critical !== null) {
        lines.push({
            kind: "stat",
            label: CARD_WORDS.blowsCritical,
            stated: critical,
            isStrong: false,
        });
        const offhand = detail.procsWhenStriking.filter((part) => part.key === OFFHAND_CRIT_KEY);
        lines.push(
            ...composeCardWordedParts(offhand, translate).map((one): TipLine => ({
                kind: "sub",
                label: one.label,
                stated: composeFigureText(one.figure),
            })),
        );
    }
    if (detail.damageDealtBlowLargest > 0) {
        lines.push({
            kind: "stat",
            label: CARD_WORDS.blowLargestDealt,
            stated: composeFigureText(detail.damageDealtBlowLargest),
            isStrong: false,
        });
    }
    lines.push(...composeCardProcLines(detail.procsWhenStriking, CRITICAL_PROC_KEYS, translate));
    lines.push(...composeCardDestroyedLines(detail.statisticsDestroyed));
    return lines;
}

/**
 * What their blows took off the other side, under a heading and **never under a sum**: the parts
 * are counted in different units and the figure carries which (`src/ui/panel-words.ts`).
 */
function composeCardDestroyedLines(parts: readonly CutPart[]): TipLine[] {
    assert(parts.length <= MAXIMUM_CARD_PARTS, "a card draws a cut inside its stated bound");
    if (parts.length === 0) return [];
    const lines: TipLine[] = [{ kind: "heading", text: CARD_WORDS.destroyed }];
    for (const part of parts) {
        assert(part.figure > 0, "a statistic that was destroyed was destroyed by something");
        lines.push({
            kind: "sub",
            label: getWordsForDestroyed(part.key),
            stated: composeDestroyedText(part.key, part.figure),
        });
    }
    return lines;
}

/**
 * What held: the sum a counter states with the defences it is made of under it, then what fired
 * on their side of somebody else's blow, then the hardest one that got through.
 */
function composeCardStruckLines(detail: RowDetail, translate: TranslateLabel | null): TipLine[] {
    assert(detail.damagePrevented >= 0, "what a defence stopped is never below nothing");
    const lines: TipLine[] = [];
    if (detail.damagePrevented > 0) {
        lines.push({
            kind: "stat",
            label: CARD_WORDS.prevented,
            stated: composeFigureText(detail.damagePrevented),
            isStrong: false,
        });
        lines.push(
            ...composeCardWordedParts(detail.damagePreventedByDefence, translate).map((
                one,
            ): TipLine => ({
                kind: "sub",
                label: one.label,
                stated: composeFigureText(one.figure),
            })),
        );
    }
    lines.push(...composeCardProcLines(detail.procsWhenStruck, [], translate));
    if (detail.damageTakenBlowLargest > 0) {
        lines.push({
            kind: "stat",
            label: CARD_WORDS.blowLargestTaken,
            stated: composeFigureText(detail.damageTakenBlowLargest),
            isStrong: false,
        });
    }
    return lines;
}

/**
 * The one part of the card the screen decides, and it is decided **exhaustively**: a fifth screen
 * becomes a question the compiler asks. The healing screens state nothing here on purpose — the
 * protocol says less on that side, and a section invented to match the damage ones would be
 * matching it out of nothing. `DESIGN.md` owns why the rest of the card does not move.
 */
function composeCardScreenLines(
    detail: RowDetail,
    metric: PanelMetric,
    translate: TranslateLabel | null,
): TipLine[] {
    assert(SCREEN_ORDER.includes(metric), "a card stands on a screen the strips draw");
    if (metric === "damageDealtApplied") return composeCardStrikingLines(detail, translate);
    if (metric === "damageTakenApplied") return composeCardStruckLines(detail, translate);
    if (metric === "healthGiven") return [];
    return [];
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
    for (
        const lines of [
            composeCardCounterLines(subject.detail),
            composeCardScreenLines(subject.detail, subject.metric, subject.translate),
            composeCardNoteLines(subject),
        ]
    ) {
        if (lines.length === 0) continue;
        groups.push({ lines });
    }
    assert(
        groups.length <= 4,
        "and says it in the figures, the counters, the screen's own and the notes",
    );
    return {
        name: subject.name,
        subtitle: composeCardSubtitleText(subject.profession, subject.detail.level),
        groups,
    };
}
