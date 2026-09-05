/**
 * What a person's row says on demand, at whichever level it stands: every figure a combatant has
 * and not only the one the screen is showing, and both runs and not only the screen's.
 */

import { getRankedOrder } from "@/src/ui/ranked-order.ts";
import {
    composeRowWarnings,
    type CutPart,
    type PanelMetric,
    type RowDetail,
} from "@/src/ui/panel-reading.ts";
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
    /**
     * Whether the row the card stands over states a narrower figure than the card does. True
     * inside an opened row, where the row is a cut and the card is still the whole fight, and
     * `CARD_WORDS.scope` is what the card then owes the reader.
     */
    isRowNarrower: boolean;
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
/** The fight's four, plus the two of them that can be charged to the person the card is about. */
const MAXIMUM_CARD_DOUBTS = 6;
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
    return figures;
}

function composeCardSubLine(label: string, figure: number): TipLine[] {
    if (label.length === 0) return [];
    if (!Number.isFinite(figure)) return [];
    if (figure <= 0) return [];
    return [{ kind: "sub", label, stated: composeFigureText(figure) }];
}

function composeCardFigureLines(detail: RowDetail, metric: PanelMetric): TipLine[] {
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
    return lines;
}

function composeCardCounterLines(detail: RowDetail): TipLine[] {
    const lines: TipLine[] = [];
    // First, because a turn is what the counts below happened inside of: the blows and the
    // announcements are what one was spent on (`docs/turns-taken.md`).
    if (detail.turnsTaken > 0) {
        lines.push({
            kind: "stat",
            label: CARD_WORDS.turns,
            stated: composeFigureText(detail.turnsTaken),
            isStrong: false,
        });
        lines.push(...composeCardSubLine(CARD_WORDS.turnsLost, detail.turnsLost));
    }
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
 * `ui/panel-words.ts` is where several keys come to share one, and why. Drawn a key at a time
 * they made two lines reading that word against different counts, which a reader can only take
 * as a panel that cannot add: nothing on screen says which of them either line is.
 */
function composeCardWordedParts(
    parts: readonly CutPart[],
    translate: TranslateLabel | null,
): Array<{ label: string; figure: number }> {
    const byLabel = new Map<string, number>();
    for (const part of parts.slice(0, MAXIMUM_CARD_PARTS)) {
        const label = getWordsForBlowKey(part.key, translate);
        if (label.length === 0) continue;
        byLabel.set(label, (byLabel.get(label) ?? 0) + part.figure);
    }
    const folded = [...byLabel].map(([label, figure]) => ({ label, figure }));
    folded.sort((one, other) => getRankedOrder(one.figure, other.figure, one.label, other.label));
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
    if (detail.blowsCritical <= 0) return null;
    if (detail.blowsStruck <= 0) return null;
    // More criticals than blows is a share above the hundred, which is a number that is wrong
    // looking like one that is right. The count is stated on its own instead (**E14**).
    if (detail.blowsCritical > detail.blowsStruck) return composeFigureText(detail.blowsCritical);
    const share = composeShareText(detail.blowsCritical / detail.blowsStruck);
    return `${composeFigureText(detail.blowsCritical)} (${share})`;
}

/**
 * How they struck: how much of it landed critically, the hardest one, what else fired, and what
 * their blows took off the other side. The share is of **blows** and never of the turns the line
 * above states: nothing on this card is divided by a turn (`PRODUCT.md`, **ADR 0048**).
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
    if (parts.length === 0) return [];
    const lines: TipLine[] = [{ kind: "heading", text: CARD_WORDS.destroyed }];
    for (const part of parts.slice(0, MAXIMUM_CARD_PARTS)) {
        if (part.figure <= 0) continue;
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
 * The two runs, each under the heading naming its end, and a run that came to nothing is not
 * drawn at all. **Neither of them turns on the screen**: a reader asking what held has the same
 * card as one asking what landed, and the screen decides only which of the four figures is bold.
 * `DESIGN.md` owns the rest of the card's shape.
 */
function composeCardRunGroups(detail: RowDetail, translate: TranslateLabel | null): TipGroup[] {
    const runs = [
        { heading: CARD_WORDS.striking, lines: composeCardStrikingLines(detail, translate) },
        { heading: CARD_WORDS.struck, lines: composeCardStruckLines(detail, translate) },
    ];
    const groups: TipGroup[] = [];
    for (const run of runs) {
        if (run.heading.length === 0) continue;
        if (run.lines.length === 0) continue;
        groups.push({ lines: [{ kind: "heading", text: run.heading }, ...run.lines] });
    }
    return groups;
}

function getIsRawStated(detail: RowDetail): boolean {
    if (detail.damageDealtRaw > 0) return true;
    if (detail.damageTakenRaw > 0) return true;
    return false;
}

function composeCardNoteLines(subject: CardSubject): TipLine[] {
    const lines: TipLine[] = [];
    if (getIsRawStated(subject.detail)) {
        lines.push({ kind: "note", text: CARD_WORDS.damageNote, isWarning: false });
    }
    // This person's own first, and the fight's under them: the card is about the person, and the
    // mark on their row is what a reader followed here to have explained.
    const said = [
        ...composeRowWarnings(subject.detail, subject.metric),
        ...subject.warnings.slice(0, MAXIMUM_CARD_WARNINGS),
    ];
    for (const warning of said.slice(0, MAXIMUM_CARD_DOUBTS)) {
        if (warning.length === 0) continue;
        lines.push({ kind: "note", text: `${WARNING_MARK}${warning}`, isWarning: true });
    }
    // Last of the sentences and before the instruction, because it answers for every figure above
    // it rather than for one of them.
    if (subject.isRowNarrower) {
        lines.push({ kind: "note", text: CARD_WORDS.scope, isWarning: false });
    }
    if (subject.opens) {
        lines.push({ kind: "note", text: CARD_WORDS.gesture, isWarning: false });
    }
    return lines;
}

export function composeCardReading(subject: CardSubject): TipReading {
    const groups: TipGroup[] = [
        { lines: composeCardFigureLines(subject.detail, subject.metric) },
    ];
    const counters = composeCardCounterLines(subject.detail);
    if (counters.length > 0) groups.push({ lines: counters });
    groups.push(...composeCardRunGroups(subject.detail, subject.translate));
    const notes = composeCardNoteLines(subject);
    if (notes.length > 0) groups.push({ lines: notes });
    return {
        // A card with nobody behind it says so rather than standing with a blank where a name is.
        name: subject.name.length > 0 ? subject.name : PANEL_WORDS.unknown,
        subtitle: composeCardSubtitleText(subject.profession, subject.detail.level),
        groups,
    };
}
