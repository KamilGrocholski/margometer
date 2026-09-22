/**
 * What a person's row says on demand, at whichever level it stands: every figure a combatant has
 * and not only the one the screen is showing, and both runs and not only the screen's.
 */

import { getRankedOrder } from "@/src/ui/ranked-order.ts";
import {
    composeRowSuspicions,
    type CutPart,
    type PanelMetric,
    type PanelSidePart,
    type RowDetail,
} from "@/src/ui/panel-reading.ts";
import type { TipGroup, TipLine, TipReading } from "@/src/ui/panel-tip.ts";
import {
    CARD_WORDS,
    type Caveat,
    CAVEATS,
    composeCardSubtitleText,
    composeDestroyedText,
    composeFigureText,
    composeShareText,
    composeTurnsText,
    composeUsesText,
    getNoteForCaveat,
    getSubWordsForBlowKey,
    getWordsForBlowKey,
    getWordsForCardMetric,
    getWordsForDestroyed,
    PANEL_WORDS,
    SUSPECT_MARK,
    type TranslateLabel,
} from "@/src/ui/panel-words.ts";
import { CRITICAL_PROC_KEYS } from "@/src/core/fight-decoder.ts";

export interface CardSubject {
    name: string;
    profession: string | null;
    /** Which side they stand on, worded — the label the row's own rule is drawn against. */
    sidePart: PanelSidePart;
    detail: RowDetail;
    metric: PanelMetric;
    doesOpen: boolean;
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
    halfNamed: { label: string; figure: number } | null;
}

/** Past the widest cut a card draws: fourteen worded procs, four destroyed, three defences. */
const MAXIMUM_CARD_PARTS = 64;
/** Counted in the line above it rather than beside it, so the card never says it twice. */
const OFFHAND_CRIT_KEY = "+of_crit";

/**
 * The four in the order the strip over the list puts them, written out rather than derived: a
 * table read out of `SCREEN_ORDER` could not say which end each one is missing. That the order is
 * the strip's is read back in words by `tests/ui/panel-card.test.ts`.
 */
function composeCardFigures(detail: RowDetail): CardFigure[] {
    const figures: CardFigure[] = [
        {
            metric: "damageDealtApplied",
            figure: detail.damageDealtApplied,
            halfNamed: { label: PANEL_WORDS.withoutTarget, figure: detail.damageDealtToNobody },
        },
        {
            metric: "damageTakenApplied",
            figure: detail.damageTakenApplied,
            halfNamed: { label: PANEL_WORDS.withoutActor, figure: detail.damageTakenFromNobody },
        },
        { metric: "healthGiven", figure: detail.healthGiven, halfNamed: null },
        {
            metric: "healthRestored",
            figure: detail.healthRestored,
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

/**
 * The figures the whole fight is summed over, under the heading saying so.
 *
 * **The screen's own figure stands whatever it is, and the other three only above nought.** A
 * screen showing somebody at nothing has to say nothing — that is the answer to what was asked —
 * while the other three at nought are three lines answering nobody. Drawing all four
 * unconditionally printed 580 figures of nought over `captures/` on 2026-09-14, 0.49 to a card;
 * this leaves 145, each of them the one a reader pointed at.
 */
function composeCardFigureLines(detail: RowDetail, metric: PanelMetric): TipLine[] {
    const lines: TipLine[] = [{ kind: "heading", text: CARD_WORDS.wholeFight }];
    for (const one of composeCardFigures(detail)) {
        if (one.metric !== metric) {
            if (!Number.isFinite(one.figure)) continue;
            if (one.figure <= 0) continue;
        }
        lines.push({
            kind: "stat",
            label: getWordsForCardMetric(one.metric),
            stated: composeFigureText(one.figure),
            isStrong: one.metric === metric,
            caveat: null,
        });
        if (one.halfNamed !== null) {
            lines.push(...composeCardSubLine(one.halfNamed.label, one.halfNamed.figure));
        }
    }
    return lines;
}

/**
 * The turns a combatant took, with the ones they lost beside them **wherever that reading was
 * heard at all**. Where the fight carries no lost turn on anybody, the second half is unread
 * rather than nought — the announcement is read by the shape of a sentence and a world wording it
 * otherwise yields nothing for everybody (`docs/turns-taken.md`) — so the line states the one
 * figure it has. **ADR 0110.**
 */
function composeCardTurnLine(detail: RowDetail): TipLine {
    if (!detail.wasTurnLostRead) {
        return {
            kind: "stat",
            label: CARD_WORDS.turns,
            stated: composeFigureText(detail.turnsTaken),
            isStrong: false,
            caveat: "turns",
        };
    }
    return {
        kind: "stat",
        label: CARD_WORDS.turnsWithLost,
        stated: composeTurnsText(detail.turnsTaken, detail.turnsLost),
        isStrong: false,
        caveat: "turns",
    };
}

function composeCardCounterLines(detail: RowDetail): TipLine[] {
    const lines: TipLine[] = [];
    // First, because a turn is what the counts below happened inside of: the blows and the
    // announcements are what one was spent on (`docs/turns-taken.md`).
    if (detail.turnsTaken > 0) lines.push(composeCardTurnLine(detail));
    if (detail.blowsStruck > 0) {
        lines.push({
            kind: "stat",
            label: CARD_WORDS.blows,
            stated: composeFigureText(detail.blowsStruck),
            isStrong: false,
            caveat: null,
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
            caveat: null,
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

/**
 * Everything but the keys the line above it already counted, which would otherwise read twice.
 *
 * **The count wears the sign, because it shares a column with damage.** A proc that fired thirteen
 * times printed `13` directly over `Największy cios 2 865`, in one right-aligned column of
 * `tabular-nums`, with nothing saying which of the two is a quantity of damage. `×13` is the
 * spelling `composeUsesText` already gives a count of announcements (`src/ui/panel-words.ts`).
 */
function composeCardProcLines(
    parts: readonly CutPart[],
    without: readonly string[],
    translate: TranslateLabel | null,
): TipLine[] {
    const kept = parts.filter((part) => !without.includes(part.key));
    const narrowed = composeCardProcSubParts(kept, translate);
    const lines: TipLine[] = [];
    for (const one of composeCardWordedParts(kept, translate)) {
        lines.push({
            kind: "stat",
            label: one.label,
            stated: composeUsesText(one.figure),
            isStrong: false,
            caveat: null,
        });
        for (const sub of narrowed.get(one.label) ?? []) {
            lines.push({ kind: "sub", label: sub.label, stated: composeUsesText(sub.figure) });
        }
    }
    return lines;
}

/**
 * The runs standing under a row, by the word that row wears — which keys draw one at all is
 * `src/ui/panel-words.ts`'s to say.
 *
 * **Sliced where `composeCardWordedParts` slices**, so the two walks see one list and no sub-line
 * can count a part the row above it dropped. Pushed inside that row's own turn rather than sorted
 * with the rest, because a sub-line is read through the line above it (`DESIGN.md`).
 */
function composeCardProcSubParts(
    parts: readonly CutPart[],
    translate: TranslateLabel | null,
): Map<string, Array<{ label: string; figure: number }>> {
    const byWords = new Map<string, Map<string, number>>();
    for (const part of parts.slice(0, MAXIMUM_CARD_PARTS)) {
        const words = getSubWordsForBlowKey(part.key);
        if (words.length === 0) continue;
        const label = getWordsForBlowKey(part.key, translate);
        if (label.length === 0) continue;
        const held = byWords.get(label) ?? new Map<string, number>();
        held.set(words, (held.get(words) ?? 0) + part.figure);
        byWords.set(label, held);
    }
    const folded = new Map<string, Array<{ label: string; figure: number }>>();
    for (const [label, held] of byWords) {
        const run = [...held].map(([words, figure]) => ({ label: words, figure }));
        run.sort((one, other) => getRankedOrder(one.figure, other.figure, one.label, other.label));
        folded.set(label, run);
    }
    return folded;
}

/**
 * What the protocol stated before reduction, at whichever end the run it joins is about.
 *
 * **It stands in the run and never under the figure of the whole fight.** Drawn there it read as
 * a part of the figure over it, and it is a sum over a narrower set of messages: a blow states a
 * figure before reduction, while damage stated against a name arrives already reduced and health
 * moving outside a blow states no such figure at all (`src/core/fight-statistics.ts`). Over
 * `captures/` on 2026-09-14 it stood **below** the figure it hung under on 296 of 1,184 cards,
 * and on 172 of them below one figure and above the other on the same card. **ADR 0087.**
 */
function composeCardRawLine(raw: number): TipLine[] {
    if (!Number.isFinite(raw)) return [];
    if (raw <= 0) return [];
    return [{
        kind: "stat",
        label: CARD_WORDS.raw,
        stated: composeFigureText(raw),
        isStrong: false,
        caveat: "reduction",
    }];
}

/** Null where nothing was struck, because a rate of nothing is not zero — it is no rate. */
function composeCardCriticalText(detail: RowDetail): string | null {
    if (detail.blowsCritical <= 0) return null;
    if (detail.blowsStruck <= 0) return null;
    // More criticals than blows is a share above the hundred, which is a number that is wrong
    // looking like one that is right. The count is stated on its own instead (**E14**).
    if (detail.blowsCritical > detail.blowsStruck) return composeUsesText(detail.blowsCritical);
    const share = composeShareText(detail.blowsCritical / detail.blowsStruck);
    return `${composeFigureText(detail.blowsCritical)} (${share})`;
}

/**
 * How they struck: what the protocol stated before reduction, how much of it landed critically,
 * what else fired, and what their blows took off the other side. The share is of **blows** and
 * never of the turns the line above states: nothing on this card is divided by a turn
 * (`PRODUCT.md`, **ADR 0048**).
 */
function composeCardStrikingLines(detail: RowDetail, translate: TranslateLabel | null): TipLine[] {
    const lines: TipLine[] = [...composeCardRawLine(detail.damageDealtRaw)];
    const critical = composeCardCriticalText(detail);
    if (critical !== null) {
        lines.push({
            kind: "stat",
            label: CARD_WORDS.blowsCritical,
            stated: critical,
            isStrong: false,
            caveat: null,
        });
        const offhand = detail.procsWhenStriking.filter((part) => part.key === OFFHAND_CRIT_KEY);
        lines.push(
            ...composeCardWordedParts(offhand, translate).map((one): TipLine => ({
                kind: "sub",
                label: one.label,
                stated: composeUsesText(one.figure),
            })),
        );
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
 * on their side of somebody else's blow.
 */
function composeCardStruckLines(detail: RowDetail, translate: TranslateLabel | null): TipLine[] {
    const lines: TipLine[] = [...composeCardRawLine(detail.damageTakenRaw)];
    if (detail.damagePrevented > 0) {
        lines.push({
            kind: "stat",
            label: CARD_WORDS.prevented,
            stated: composeFigureText(detail.damagePrevented),
            isStrong: false,
            caveat: "reduction",
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

/**
 * The sentences the figures above earned, and **read off those figures rather than asked a second
 * time**: a card that worked out for itself which ones to say could draw a glyph pointing at a
 * sentence it had not drawn, or a sentence no glyph pointed at. Each is said once however many of
 * its figures wear the mark, and the run is bounded by `CAVEATS`, which is closed (**S11**).
 *
 * A row's card composes its sentences here too (`src/ui/panel-element.ts`), which is what keeps
 * one glyph and one sentence answering to each other wherever either is drawn. **ADR 0089.**
 */
export function composeCaveatNoteLines(groups: readonly TipGroup[]): TipLine[] {
    const said = new Set<Caveat>();
    for (const group of groups) {
        for (const line of group.lines) {
            if (line.kind !== "stat") continue;
            if (line.caveat === null) continue;
            said.add(line.caveat);
        }
    }
    // The sentence alone: the mark opening it is drawn from the tone rather than spelled into the
    // text (**ADR 0092**), and `getTipLineCost` is where it goes on being counted.
    return CAVEATS.filter((one) => said.has(one)).map((one): TipLine => ({
        kind: "note",
        text: getNoteForCaveat(one),
        tone: "caveat",
    }));
}

function composeCardNoteLines(subject: CardSubject, groups: readonly TipGroup[]): TipLine[] {
    const lines: TipLine[] = [...composeCaveatNoteLines(groups)];
    // This person's own, and nobody else's: a gap naming nobody stays under the list, where it
    // qualifies every row at once (`ARCHITECTURE.md`). **ADR 0069.**
    for (const suspicion of composeRowSuspicions(subject.detail, subject.metric)) {
        if (suspicion.length === 0) continue;
        lines.push({ kind: "note", text: `${SUSPECT_MARK}${suspicion}`, tone: "suspect" });
    }
    // Last of the sentences and before the instruction, because it answers for every figure above
    // it rather than for one of them.
    if (subject.isRowNarrower) {
        lines.push({ kind: "note", text: CARD_WORDS.scope, tone: "plain" });
    }
    if (subject.doesOpen) {
        lines.push({ kind: "note", text: CARD_WORDS.gesture, tone: "plain" });
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
    const notes = composeCardNoteLines(subject, groups);
    if (notes.length > 0) groups.push({ lines: notes });
    return {
        // A card with nobody behind it says so rather than standing with a blank where a name is.
        name: subject.name.length > 0 ? subject.name : PANEL_WORDS.unknown,
        subtitle: composeCardSubtitleText(
            subject.profession,
            subject.detail.level,
            subject.sidePart,
        ),
        groups,
    };
}
