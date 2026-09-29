/**
 * What pointing at a fight says, from the line over the ranking or from a row on the shelf: which
 * fight it was, when it opened, where in full, on which world, and as which character (ADR 0014).
 * A line with nothing to state is left off, so the card never says that something is unknown.
 */

import { type FightCardReading, SIDE_PART } from "./panel-reading.ts";
import { TIP_LINE, type TipLine, type TipReading } from "./tip-reading.ts";
import {
    FIGHT_CARD_WORDS,
    formatCardSubtitle,
    formatSideCounts,
    getWordsForShelfOutcome,
    getWordsForShelfTime,
} from "./panel-words.ts";

/**
 * ⚠️ **The place is the card's name and never one of its lines.** A name wraps and is counted at
 * the lines it takes, where a line's value neither shrinks nor wraps: a place a line could not hold
 * would be cut on the one card that exists to draw it whole (`develop ADR 0084`).
 */
export function presentFightCard(fight: FightCardReading): TipReading {
    const counted = formatFightCardCounts(fight);
    const lines: TipLine[] = [];
    // A fight going on is dated by when it opened: the shelf's `teraz` is a row's word, not a date.
    addFightCardLine(lines, FIGHT_CARD_WORDS.when, getWordsForShelfTime(fight.at, false));
    addFightCardLine(lines, FIGHT_CARD_WORDS.world, fight.world ?? "");
    addFightCardLine(lines, FIGHT_CARD_WORDS.character, fight.reader?.name ?? "");
    // A profession and a level beside a nickname of twenty-five characters (`develop ADR 0097`)
    // overrun the bound, so the two stand on a line of their own, as a person's card puts them
    // under the name.
    const said = fight.reader === null
        ? null
        : formatCardSubtitle(fight.reader.profession, fight.reader.level, SIDE_PART.nobody);
    addFightCardLine(lines, FIGHT_CARD_WORDS.profession, said ?? "");
    const groups = lines.length === 0 ? [] : [{ lines }];
    if (fight.place === null) return { name: counted, subtitle: null, groups };
    return { name: fight.place, subtitle: counted, groups };
}

/** The line over the ranking, in the words a shelf row uses for how it went. */
function formatFightCardCounts(fight: FightCardReading): string {
    const counted = formatSideCounts(fight.sizes, fight.unplaced);
    const outcome = getWordsForShelfOutcome(fight.outcome, fight.isLive);
    if (outcome.length === 0) return counted;
    return `${counted} · ${outcome}`;
}

function addFightCardLine(lines: TipLine[], label: string, stated: string): void {
    if (stated.length === 0) return;
    lines.push({ kind: TIP_LINE.stat, label, stated, isStrong: false, caveat: null });
}
