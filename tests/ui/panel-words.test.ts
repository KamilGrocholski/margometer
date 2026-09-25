/**
 * What the reader reads, held to what it must never say.
 *
 * Reading a sentence back from the module that wrote it would hold the two to be the same and
 * neither to be right, so nothing here compares a word to itself. What is checked is the two
 * things a sentence can be wrong about whatever it says: that it carries none of our vocabulary
 * and no key of the game's, and that a count is spelled the way Polish spells one.
 */

import {
    assert,
    assertEquals,
    assertExists,
    assertStrictEquals,
    assertStringIncludes,
} from "@std/assert";
import { CHARGED_SKILL_STATE } from "#/src/core/charged-skill.ts";
import {
    CARD_WORDS,
    CAVEAT,
    CAVEATS,
    CHOICE_REFUSED_ANSWER,
    COUNTED_NOUNS,
    DEFENCE_WORD_BY_KEY,
    DESTROYED_WORD_BY_KEY,
    ELEMENT_WORD_BY_KEY,
    EVERY_SLOT_PINNED_ANSWER,
    formatCardSubtitle,
    formatChargedRows,
    formatChargedSkillSubtitle,
    formatCountedNoun,
    formatCounter,
    formatDefect,
    formatDestroyed,
    formatFigure,
    formatGrammarRefusedSuspicion,
    formatJoinedInProgressSuspicion,
    formatLostMessageSuspicion,
    formatNoParameterRowSuspicion,
    formatNoParameterSuspicion,
    formatPlace,
    formatShare,
    formatShares,
    formatShelfSize,
    formatSideCounts,
    formatTurnOrdinal,
    formatUndrawn,
    formatUnknownKeyRowSuspicion,
    formatUnknownKeySuspicion,
    formatUnplacedHealRowSuspicion,
    formatUnplacedHealSuspicion,
    formatUses,
    formatWhole,
    getCaveatForUnannounced,
    getNoteForCaveat,
    getWordsForCardMetric,
    getWordsForChargedSkill,
    getWordsForDamageKind,
    getWordsForDirection,
    getWordsForHealthSource,
    getWordsForNothing,
    getWordsForNoun,
    getWordsForOutcome,
    getWordsForPin,
    getWordsForPinnedScope,
    getWordsForPinnedStanding,
    getWordsForShelfOutcome,
    getWordsForShelfTime,
    getWordsForSide,
    getWordsForStorage,
    getWordsForTurnState,
    getWordsForUnannounced,
    getWordsForUnnamedEnd,
    HEALTH_LOSS_WORD_BY_KEY,
    HEALTH_SOURCE_WORD_BY_KEY,
    NEITHER_END_WORDS,
    PANEL_DEFECT_KIND,
    PANEL_REGION,
    PANEL_WORDS,
    presentTooltipRows,
    PROC_SUB_WORD_BY_KEY,
    PROC_WORD_BY_KEY,
    PROFESSION_WORD_BY_KEY,
    REGION_WORDS,
    ROWS_BESIDE_THE_STATUSES,
    STANDING_WORDS,
    STORE_MADE_ROOM_ANSWER,
    STORE_REFUSED_ANSWER,
} from "#/src/ui/panel-words.ts";
import { OUTCOME_RESULT, type OutcomeResult } from "#/src/core/battle-event.ts";
import { STORAGE_CHOICES } from "#/src/ui/panel-choice.ts";
import { PINNED_CASES, SIDE_PART, UNNAMED_END } from "#/src/ui/panel-reading.ts";
import { PANEL_NOUN, SCREEN_ORDER, SIDE_CHOICES } from "#/src/ui/panel-screen.ts";
import { STANDING_TURN_STATE } from "#/src/ui/panel-standing.ts";
import { readFrozenModule } from "#/tests/frozen-tables.ts";
import { FROZEN_BUFF_BITS } from "#/frozen/buff-bits.ts";

/** What a block may run to: a row per status the client names, and the rows beside them. */
const TOOLTIP_ROWS_MAXIMUM = FROZEN_BUFF_BITS.bits.length + ROWS_BESIDE_THE_STATUSES;

const { FROZEN_PROTOCOL_KEYS } = await readFrozenModule("protocol-keys") as {
    FROZEN_PROTOCOL_KEYS: { keys: readonly string[] };
};
const { FROZEN_HELP_PHRASES } = await readFrozenModule("help-phrases") as {
    FROZEN_HELP_PHRASES: { counts: Record<string, number> };
};

/** Words this repository chose for itself. A reader is told what is missing, never our reason. */
const OUR_VOCABULARY = [
    "decoder",
    "payload",
    "roster",
    "unattributed",
    "half-named",
    "unaccounted",
    "suspect",
    "undrawn",
    "combatant",
    "protocol",
];
/**
 * Keys the game chose. A reader is told what happened, never what it arrived under.
 *
 * ⚠️ **Seven of these were kept by hand against a table that grows.** `frozen/protocol-keys.ts` is
 * every key the client branches on, re-lifted by `deno task game:keys`, and a sentence naming one
 * of them would have gone unread unless somebody had thought to add it here. What is taken from
 * that table is every key **whose shape Polish does not have** — an underscore, a digit, a capital
 * — because these are matched as substrings and `blok` is a word a Polish sentence may say.
 */
const HAND_KEPT_KEYS = [
    "dmg",
    "tspell",
    "skillid",
    "healall_per",
    "legbon",
    "oth_dmg",
    "endbattle",
];
const GAME_KEYS = getUnmistakableKeys();
/** What a count in these sentences is stated out of. Any figure past the counts below will do. */
const SAID_OUT_OF = 412;

/**
 * Every table of words the module exports, walked for its values rather than named one by one.
 *
 * **Written as a record so each table carries its own name**, which is what the holder check at
 * the foot of this file holds the source reader to. A list of values knows none, and the reader
 * was then held by a count instead — a floor of forty against fifty-eight declarations, which a
 * reader finding only the tables without an underscore would have walked straight past.
 */
const TABLES = {
    CARD_WORDS,
    DEFENCE_WORD_BY_KEY,
    ELEMENT_WORD_BY_KEY,
    HEALTH_LOSS_WORD_BY_KEY,
    HEALTH_SOURCE_WORD_BY_KEY,
    PROC_SUB_WORD_BY_KEY,
    PROC_WORD_BY_KEY,
    PROFESSION_WORD_BY_KEY,
    STANDING_WORDS,
};

/** Every member of each closed set, read off its vocabulary, so a fifth state is read too. */
const PANEL_NOUNS = Object.values(PANEL_NOUN);
const TURN_STATES = Object.values(STANDING_TURN_STATE);
const PANEL_OUTCOMES = Object.values(OUTCOME_RESULT);
const CHARGED_STATES = Object.values(CHARGED_SKILL_STATE);

/** The calendar the shelf's dates are counted over, which is nobody's constant to share. */
const FIRST_MONTH = 1;
const MONTHS_IN_YEAR = 12;

/** A fighter with nothing standing on them, so a test says only what it is about. */
const NOTHING_CARRIED = {
    turnsTaken: 0,
    charge: null,
    provokedBy: null,
    provokes: 0,
    statuses: [],
    holytouchHealsGiven: null,
    hasSpentLastheal: false,
    wasJoinedInProgress: false,
};

/**
 * ⚠️ **A hand-kept list of sentences falls behind the module it lists, and this one had.** Nine
 * of the twenty word tables in `src/ui/panel-words.ts` stood outside both checks above, measured
 * 2026-09-11 — about forty sentences, the card's whole vocabulary among them. So the module is
 * read for every declaration holding text, and each is held to putting one of its own words into
 * `getSentences`. What is registered below holds text no reader reads.
 */
const HOLDS_NO_WORD: Record<string, string> = {
    CLIENT_ID_BY_UNWORDED_KEY: "ids the running client answers to, spelled by it",
    THOUSAND_SEPARATOR: "the space a figure groups on, written as its escape",
    PANEL_DEFECT_KIND: "what the defects are called here, which the panel never says",
    PANEL_REGION: "what the regions are called here; their words are in `REGION_WORDS`",
    CAVEAT: "what the caveats are called here; the sentences are in `CAVEAT_NOTES`",
    UNANNOUNCED_CAVEATS: "which of those a closing row owes, which is a key and not a word",
    formatDefect: "the branch a region takes, and a branch is not a word",
    formatCardSubtitle: "the default for a card nobody is a side of",
    STATUS_CATEGORY: "the client's own filing for a status id, which is a category and not a word",
};

const QUOTES = "\"'`";
const HOLDER_OPENERS = ["export const ", "const ", "export function ", "function "];
const HOLDER_CLOSERS = ["type ", "export type ", "interface ", "export interface "];

/** Everything one fighter can be at once, so a test about order has every row to order. */
const CARRYING_EVERYTHING = {
    turnsTaken: 14,
    charge: { skillName: "Pożoga", turnsElapsed: 2, turnsStated: 4 },
    provokedBy: { name: "Gracz 2", turnsElapsed: 1, turnsStated: 3 },
    provokes: 10,
    statuses: [
        { bit: 3, percent: null },
        { bit: 5, percent: 14 },
        { bit: 6, percent: 20 },
    ],
    holytouchHealsGiven: 1,
    hasSpentLastheal: true,
    wasJoinedInProgress: false,
};

Deno.test("every word the panel says says something", () => {
    const sentences = getSentences();
    assert(sentences.length > 10, "the panel has words to say");
    for (const sentence of sentences) {
        assertEquals(sentence.trim(), sentence, `${sentence} carries space it does not need`);
    }
});

function getSentences(): string[] {
    const found = Object.values(PANEL_WORDS).map((one) => String(one));
    for (const noun of Object.values(COUNTED_NOUNS)) {
        found.push(noun.one, noun.few, noun.many);
    }
    // What a half-named row says, for the same reason: the tables behind these are keyed and a
    // walk over `PANEL_WORDS` reaches none of them.
    for (const end of Object.values(UNNAMED_END)) {
        found.push(getWordsForUnnamedEnd(end, PANEL_NOUN.damage));
        found.push(getWordsForUnnamedEnd(end, PANEL_NOUN.healing));
    }
    for (const kase of PINNED_CASES) {
        found.push(getWordsForPinnedStanding(kase));
        found.push(getWordsForPinnedScope(kase));
    }
    // The sentence each caveated figure owes, for the same reason: `CAVEAT_NOTES` is keyed by the
    // caveat and no walk over a table above reaches it.
    for (const caveat of CAVEATS) found.push(getNoteForCaveat(caveat));
    found.push(NEITHER_END_WORDS.label, NEITHER_END_WORDS.note);
    // ⚠️ **What the panel says it could not do**, which `DEFECT_WORDS` carries and its own
    // docblock cites **L3** for. `PANEL_WORDS` does not hold them and a walk over it reached
    // none: measured 2026-09-11 by putting `oth_dmg` into one, which the checks below read past.
    // The region kind takes a region, so every one of those is asked as well.
    for (const kind of Object.values(PANEL_DEFECT_KIND)) {
        found.push(formatDefect(kind, null, 1));
        for (const region of Object.values(PANEL_REGION)) {
            found.push(formatDefect(kind, region, 2));
        }
    }
    found.push(...getSentencesFromSuspicions());
    // ⚠️ **Every table the module keeps, and every word it hands out that a table does not.**
    // Measured 2026-09-18 by putting `oth_dmg` into the first worded value of every table in
    // `src/ui/panel-words.ts` and running this file: all but one lit, and the one that did not
    // is `CLIENT_ID_BY_UNWORDED_KEY`, which `HOLDS_NO_WORD` excuses by name.
    for (const table of Object.values(TABLES)) {
        const words = table instanceof Map ? [...table.values()] : Object.values(table);
        for (const one of words) found.push(String(one));
    }
    for (const [statistic, held] of DESTROYED_WORD_BY_KEY) {
        found.push(held.name, held.unit, formatDestroyed(statistic, 12));
    }
    found.push(STORE_REFUSED_ANSWER, STORE_MADE_ROOM_ANSWER);
    found.push(EVERY_SLOT_PINNED_ANSWER, CHOICE_REFUSED_ANSWER);
    found.push(...getSentencesFromChoices());
    for (const region of Object.values(PANEL_REGION)) {
        found.push(formatUndrawn(region));
    }
    // A word that says nothing where there is nothing to say is not a sentence: `held` is the
    // state with a turn to draw, and a shelf neither live nor ended has no word to stand under.
    return found.filter((one) => one.length > 0);
}

/** Every sentence a suspicion is said in, the fight's and a row's both. */
function getSentencesFromSuspicions(): string[] {
    const found: string[] = [formatJoinedInProgressSuspicion()];
    for (const count of [1, 2, 5]) {
        const whom = formatChargedRows(["Gracz 1", "Gracz 2"], 2);
        found.push(formatLostMessageSuspicion(count, SAID_OUT_OF));
        found.push(formatUnknownKeySuspicion(count, SAID_OUT_OF, whom));
        found.push(formatNoParameterSuspicion(count, SAID_OUT_OF, whom));
        found.push(formatGrammarRefusedSuspicion(count, SAID_OUT_OF));
        found.push(formatUnplacedHealSuspicion(count, SAID_OUT_OF, whom));
        found.push(formatUnknownKeyRowSuspicion(count));
        found.push(formatNoParameterRowSuspicion(count));
        found.push(formatUnplacedHealRowSuspicion(count));
        // And the other shape of the same words: a gap reaching more rows than a sentence lists.
        found.push(formatUnknownKeySuspicion(count, SAID_OUT_OF, formatChargedRows([], 7)));
    }
    return found;
}

/** Every word handed out per screen, side, noun, choice, state or ending. */
function getSentencesFromChoices(): string[] {
    const found: string[] = [];
    for (const metric of SCREEN_ORDER) {
        found.push(getWordsForNothing(metric));
        found.push(getWordsForUnannounced(metric));
        found.push(getWordsForDirection(metric));
        found.push(getWordsForCardMetric(metric));
    }
    for (const noun of PANEL_NOUNS) found.push(getWordsForNoun(noun));
    for (const choice of SIDE_CHOICES) found.push(getWordsForSide(choice));
    for (const choice of STORAGE_CHOICES) found.push(getWordsForStorage(choice));
    for (const state of TURN_STATES) found.push(getWordsForTurnState(state));
    for (const outcome of PANEL_OUTCOMES) {
        found.push(getWordsForOutcome(outcome));
        found.push(getWordsForShelfOutcome(outcome, false));
    }
    found.push(getWordsForShelfOutcome(null, true));
    found.push(getWordsForPin(true), getWordsForPin(false));
    // What is composed rather than held: a word spelled into a template is reached by no walk
    // over the tables above, and `tura` and `teraz` are both spelled that way.
    found.push(formatTurnOrdinal(3), getWordsForShelfTime(null, true));
    // Every month, because the twelve are spelled into the same template and a walk over the
    // tables reaches none of them either.
    for (let month = FIRST_MONTH; month <= MONTHS_IN_YEAR; month += 1) {
        found.push(getWordsForShelfTime({ day: 1, month, hour: 0, minute: 0 }, false));
    }
    found.push(formatSideCounts([4, 4], 2), formatShelfSize([4, 4]));
    found.push(String(formatCardSubtitle("w", 120, SIDE_PART.reader)));
    found.push(...getSentencesFromTooltip());
    // ⚠️ **Both ends of a charge, because one of them hid behind the card.** `przerwane` reached
    // no check at all and `wykonane` passed as a tail of `Tury wykonane`, which is the shape the
    // holder check below no longer accepts (`develop ADR 0109`).
    for (const state of CHARGED_STATES) {
        found.push(getWordsForChargedSkill(state));
        found.push(formatChargedSkillSubtitle("Cios", state));
    }
    return found;
}

/**
 * ⚠️ **The rows the add-on writes into the game's own tooltip, which no table above reaches.**
 * `TOOLTIP_WORDS` is not exported and a walk over the exported tables read none of it; measured
 * 2026-09-22 by putting `oth_dmg` into each of its values and running this file, which lit
 * nothing. A reader meets these words outside the panel, so **L3** has more to hold here, not
 * less.
 *
 * **The client is stubbed rather than left null.** Asked nothing, a row falls back to the key as
 * the game wrote it — `develop ADR 0024`'s third rung — and a key is exactly what the check below
 * forbids, so a null here would flag the one thing this module is allowed to do.
 */
function getSentencesFromTooltip(): string[] {
    const said = (id: string): string => (id.length > 0 ? "Efekt" : "");
    const found: string[] = [];
    for (const bit of [3, 4]) {
        found.push(...presentTooltipRows(
            {
                ...NOTHING_CARRIED,
                turnsTaken: 14,
                charge: { skillName: "Cios", turnsElapsed: bit - 3, turnsStated: 1 },
                provokedBy: { name: "Gracz 2", turnsElapsed: 1, turnsStated: 3 },
                provokes: 2,
                statuses: [{ bit, percent: 39 }],
                holytouchHealsGiven: 1,
                hasSpentLastheal: true,
            },
            said,
            FROZEN_BUFF_BITS.bits,
        ));
    }
    return found;
}

/**
 * The four words are written out here rather than read back, which is what the docblock above
 * asks of every sentence in this file — and until this test there was nothing at all holding
 * them. A word swapped for another outcome's passed the whole gate: the header test reads the
 * string out of the module that writes it, and the browser suite only ever runs a fight that was
 * won, so `REMIS` and `UCIECZKA` are in its list without ever being drawn.
 */
Deno.test("each way a fight can end has its own word, and no two share one", () => {
    const said: Record<OutcomeResult, string> = {
        won: "wygrana",
        lost: "przegrana",
        drawn: "remis",
        fled: "ucieczka",
    };
    for (const [outcome, word] of Object.entries(said)) {
        assertEquals(
            getWordsForOutcome(outcome as OutcomeResult),
            word,
            `${outcome} is the word a reader reads for it`,
        );
    }
    const words = Object.values(said);
    assertEquals(new Set(words).size, words.length, "and no ending borrows another's word");
});

/**
 * The rows the add-on puts outside its own root, so they are read here twice over: L3 holds them
 * like every other sentence, and this holds the things only they have to answer for.
 */
Deno.test("the block handed to the game says whose it is, and carries no markup", () => {
    const said = presentTooltipRows(
        {
            ...NOTHING_CARRIED,
            statuses: [{ bit: 6, percent: null }],
        },
        null,
        FROZEN_BUFF_BITS.bits,
    );
    const first = said[0];
    assertExists(first, "a status carried composes a row");
    assertEquals(first, "MargoMeter", "the name stands alone, over the rows and not inside one");
    for (const row of said) {
        assertEquals(row.includes("<"), false, "and no row opens markup in somebody else's string");
        assertEquals(row.includes("&"), false, "nor an entity in one");
    }
});

/**
 * ⚠️ **Only the first row carries the name.** The client's own `<br>` puts the rows under one
 * another inside one tooltip, so repeating it would say it once per row to the same reader.
 */
Deno.test("the add-on names itself once, however many rows it has", () => {
    const said = presentTooltipRows(
        {
            ...NOTHING_CARRIED,
            turnsTaken: 14,
            statuses: [{ bit: 6, percent: null }],
        },
        null,
        FROZEN_BUFF_BITS.bits,
    );
    assertEquals(said.length, 3, "the name, a status and a count of turns");
    assertEquals(said.filter((row) => row.includes("MargoMeter")).length, 1, "named once");
});

/**
 * ⚠️ **A figure stands only where `core/carried-figure.ts` said one may.** Null is the common
 * answer, and the row is then the status with whatever length may be said of it.
 */
Deno.test("a status with no figure to its name says no share beside it", () => {
    const bare = presentTooltipRows(
        {
            ...NOTHING_CARRIED,
            statuses: [{ bit: 6, percent: null }],
        },
        null,
        FROZEN_BUFF_BITS.bits,
    );
    assertEquals(bare[1]?.includes("%"), false, "no figure where none may be said");
    const figured = presentTooltipRows(
        {
            ...NOTHING_CARRIED,
            statuses: [{ bit: 6, percent: 39 }],
        },
        null,
        FROZEN_BUFF_BITS.bits,
    );
    assertStringIncludes(figured[1] ?? "", "39%", "and the figure where one may");
});

/**
 * The one pair every counter draws since `develop ADR 0116`, up or down, and the two ends it
 * refuses. A figure **below** nought and one past what is stated are both a subtraction somebody
 * got backwards — neither is a figure, so neither is drawn as one. Nought itself is drawn: a shout
 * holds somebody through the turn its length runs out on, and a charge opens on none passed.
 */
Deno.test("a counter is a bare pair, and refuses what is not inside it", () => {
    assertEquals(formatCounter(1, 5), "1 z 5", "one of five, and no noun");
    assertEquals(formatCounter(5, 5), "5 z 5", "and the whole of it");
    assertEquals(formatCounter(0, 5), "0 z 5", "and none is drawn");
    assertEquals(formatCounter(-1, 5), PANEL_WORDS.unknown, "below none is not");
    assertEquals(formatCounter(6, 5), PANEL_WORDS.unknown, "nor more than there was");
    assertEquals(formatCounter(1.5, 5), PANEL_WORDS.unknown, "nor half a turn");
});

/**
 * ⚠️ **No status row counts turns** (`develop ADR 0112`). The mask says a status stands and never
 * since when; a count off it read `38 tur` beside a five-turn poison, a length from the help sat at
 * a floor while hits the payload never announces renewed it, and one from a cast named a moment the
 * bit does not. What stands is said, with the figure a cast over the bearer comes to.
 */
Deno.test("a status says that it stands, and never for how long", () => {
    for (let bit = 0; bit < 9; bit += 1) {
        for (const percent of [null, 20]) {
            const said = presentTooltipRows(
                { ...NOTHING_CARRIED, statuses: [{ bit, percent }] },
                null,
                FROZEN_BUFF_BITS.bits,
            );
            assertEquals(said.length, 2, "the name, and the status under it");
            assertEquals(said[1]?.includes("tur"), false, `bit ${bit} carries no count of turns`);
            assertEquals(said[1]?.includes("·"), false, "and nothing set apart beside it");
        }
    }
});

/**
 * **W5: zero is a boundary, and here it is the one that was wrong.** A bit lit on a turn the
 * bearer has not finished has stood for none of them, and `0 tur` in somebody else's tooltip
 * reads as none left. Where no cast dates it there is nothing true to put there, so the row says
 * the status and stops.
 */
Deno.test("a status nothing dates, just lit, says no length at all", () => {
    const said = presentTooltipRows(
        {
            ...NOTHING_CARRIED,
            statuses: [{ bit: 6, percent: null }],
        },
        null,
        FROZEN_BUFF_BITS.bits,
    );
    assertEquals(said.length, 2, "the name, and the status still said under it");
    assertEquals(said[1]?.includes("0"), false, "and no count of nought is said beside it");
});

/**
 * ⚠️ **A block is read down its left edge**, so a row that names a thing and then says something
 * about it is punctuated the same way in every row that does it. The legendary pair ran the name
 * into the figure and the rows above them did not — found by drawing the whole block, which is
 * the only place they stand together.
 */
Deno.test("every row that names a thing and qualifies it is punctuated alike", () => {
    const said = presentTooltipRows(
        {
            ...NOTHING_CARRIED,
            charge: { skillName: "Pożoga", turnsElapsed: 2, turnsStated: 4 },
            provokedBy: { name: "Gracz 2", turnsElapsed: 1, turnsStated: 3 },
            statuses: [{ bit: 3, percent: null }],
            holytouchHealsGiven: 1,
            hasSpentLastheal: true,
        },
        null,
        FROZEN_BUFF_BITS.bits,
    );
    const carrying = said.filter((row) => row.includes(" z ") || row.includes("wykorzystany"));
    assertEquals(
        carrying.length,
        4,
        "the charge, the okrzyk and both legendary bonuses, and no status",
    );
    for (const row of carrying) {
        assertStringIncludes(row, STANDING_WORDS.castSeparator, `${row} stands its parts apart`);
    }
});

/** The okrzyk from either end: what holds somebody, and how many somebody holds. */
Deno.test("a provocation is said at the end it is read from", () => {
    const held = presentTooltipRows(
        {
            ...NOTHING_CARRIED,
            provokedBy: { name: "Gracz 2", turnsElapsed: 1, turnsStated: 3 },
        },
        null,
        FROZEN_BUFF_BITS.bits,
    );
    assertEquals(
        held[1],
        "Sprowokowany przez Gracz 2 · 2 z 3",
        "the held fighter is told who holds them, and how many of their turns it still has",
    );
    const shouting = (provokes: number) =>
        presentTooltipRows({ ...NOTHING_CARRIED, provokes }, null, FROZEN_BUFF_BITS.bits)[1];
    assertEquals(shouting(10), "Prowokuje 10 postaci", "the shouter is told how many, not whom");
    assertEquals(shouting(1), "Prowokuje 1 postać", "one is one, in the noun's own form");
    assertEquals(shouting(2), "Prowokuje 2 postacie", "two to four take the second");
    assertEquals(shouting(12), "Prowokuje 12 postaci", "and a teen never does");
    assertEquals(shouting(22), "Prowokuje 22 postacie", "while twenty-two does");
    assertEquals(shouting(0), undefined, "and holding nobody says nothing");
});

/**
 * ⚠️ **The provocation counts down in turns and Dotyk anioła counts up in heals**, in one tooltip
 * (`develop ADR 0113`), and neither fraction carries a noun (`develop ADR 0116`) — so the row is
 * asserted whole, at nought — a row lit and not yet healed — and one under the bound.
 */
Deno.test("Dotyk anioła says the heals it has given, out of the three it gives", () => {
    const row = (healsGiven: number) =>
        presentTooltipRows(
            { ...NOTHING_CARRIED, holytouchHealsGiven: healsGiven },
            null,
            FROZEN_BUFF_BITS.bits,
        )[1];
    assertEquals(row(0), "Dotyk anioła · 0 z 3", "lit, and nothing healed yet");
    assertEquals(row(1), "Dotyk anioła · 1 z 3", "one heal is one");
    assertEquals(row(2), "Dotyk anioła · 2 z 3", "and the last before it goes");
});

Deno.test("a label the client answers with markup is refused rather than escaped", () => {
    const speak = (id: string) => id === "speed_up" ? "<b>szybko</b>" : null;
    assertEquals(
        presentTooltipRows(
            {
                ...NOTHING_CARRIED,
                statuses: [{ bit: 6, percent: null }],
            },
            speak,
            FROZEN_BUFF_BITS.bits,
        ),
        [],
        "the answer is the client's, and one this repository cannot use is left alone",
    );
});

/**
 * ⚠️ **The charge restates the client's pair, counting up**, where the provocation a row below it
 * counts down (`develop ADR 0115`): Pomocnik draws the same pair for the same charge, and a
 * remainder here would be a second number for it. The missing noun is what tells the two fractions
 * apart, so the row is asserted whole — at nought, a charge just begun, and at the whole, the turn
 * it lands on.
 */
Deno.test("a charge says the blow and how much of it has passed, as the client states it", () => {
    const row = (turnsElapsed: number, turnsStated: number) =>
        presentTooltipRows(
            {
                ...NOTHING_CARRIED,
                charge: { skillName: "Pożoga", turnsElapsed, turnsStated },
            },
            null,
            FROZEN_BUFF_BITS.bits,
        )[1];
    assertEquals(row(0, 4), "Cios specjalny · Pożoga · 0 z 4", "just begun");
    assertEquals(row(2, 4), "Cios specjalny · Pożoga · 2 z 4", "half through");
    assertEquals(row(4, 4), "Cios specjalny · Pożoga · 4 z 4", "and on the last turn");
    assertEquals(row(0, 1), "Cios specjalny · Pożoga · 0 z 1", "a charge of one turn, begun");
    assertEquals(row(1, 1), "Cios specjalny · Pożoga · 1 z 1", "and at its other end");
    assertEquals(row(5, 4), `Cios specjalny · Pożoga · ${PANEL_WORDS.unknown}`, "past the whole");
    assertEquals(row(-1, 4), `Cios specjalny · Pożoga · ${PANEL_WORDS.unknown}`, "below none");
});

/** A blow's name is the client's, so one carrying markup is refused like any label of theirs. */
Deno.test("a charge whose name carries markup puts no row in", () => {
    const said = presentTooltipRows(
        {
            ...NOTHING_CARRIED,
            charge: { skillName: "<b>Pożoga</b>", turnsElapsed: 0, turnsStated: 2 },
        },
        null,
        FROZEN_BUFF_BITS.bits,
    );
    assertEquals(said, [], "nothing else to say, so the tooltip is left as the game made it");
});

/** **W5: zero is a boundary.** Nothing carried composes no row, which is not an empty one. */
Deno.test("a fighter carrying nothing composes no row at all", () => {
    assertEquals(
        presentTooltipRows(NOTHING_CARRIED, null, FROZEN_BUFF_BITS.bits),
        [],
        "the game's tooltip is untouched",
    );
});

Deno.test("no sentence carries our vocabulary", () => {
    const wrong: string[] = [];
    for (const sentence of getSentences()) {
        for (const word of OUR_VOCABULARY) {
            if (sentence.toLowerCase().includes(word)) wrong.push(`${sentence} says ${word}`);
        }
    }
    assertEquals(wrong, [], "the reader is told what cannot be known, never why we could not");
});

Deno.test("no sentence carries a key of the game's", () => {
    assert(
        GAME_KEYS.length > HAND_KEPT_KEYS.length * 3,
        `the frozen table widens the seven kept by hand, and gave ${GAME_KEYS.length}`,
    );
    const wrong: string[] = [];
    for (const sentence of getSentences()) {
        for (const key of GAME_KEYS) {
            if (sentence.toLowerCase().includes(key)) wrong.push(`${sentence} says ${key}`);
        }
    }
    assertEquals(wrong, [], "a key is how a message was assembled, not what happened in a fight");
});

Deno.test("every word the module holds reaches the checks above, or says why it does not", () => {
    const holders = getWordHolders(Deno.readTextFileSync("src/ui/panel-words.ts"));
    const said = getSentences().join("\n");
    const unread: string[] = [];
    for (const [name, texts] of holders) {
        if (texts.length === 0) continue;
        if (name in HOLDS_NO_WORD) continue;
        if (texts.every((text) => said.includes(text))) continue;
        unread.push(name);
    }
    // ⚠️ **The reader is held by name and not by a count.** A floor said the module holds more
    // than forty declarations of words, and it held fifty-eight — so a reader that had stopped
    // finding a third of them was still above it. Every table this file walks is a declaration
    // the reader must have found, and a reader that loses one is named for the one it lost.
    const missing = Object.keys(TABLES).filter((name) => !holders.has(name));
    assertEquals(missing, [], "a table this file walks is a declaration the source reader missed");
    assertEquals(unread, [], "a word neither check reads is a word neither check holds");
    // The other way round: a register that outlives what it excuses goes on excusing something.
    for (const name of Object.keys(HOLDS_NO_WORD)) {
        assert(holders.has(name), `${name} is excused above and the module no longer has it`);
    }
});

/** Every module-level declaration holding text, and the texts it holds. */
function getWordHolders(source: string): Map<string, string[]> {
    const found = new Map<string, string[]>();
    let holder = "";
    for (const line of source.split("\n")) {
        if (HOLDER_CLOSERS.some((closer) => line.startsWith(closer))) holder = "";
        const opened = getHolderName(line);
        if (opened !== "") {
            holder = opened;
            if (!found.has(holder)) found.set(holder, []);
        }
        const held = found.get(holder);
        if (held === undefined) continue;
        if (isCommentLine(line)) continue;
        for (const text of getLineTexts(line)) {
            if (isReadableText(text)) held.push(text);
        }
    }
    return found;
}

/** The name a module-level declaration opens, or empty where the line opens none. */
function getHolderName(line: string): string {
    for (const opener of HOLDER_OPENERS) {
        if (!line.startsWith(opener)) continue;
        let name = "";
        for (const one of line.slice(opener.length)) {
            const isName = one === "_" || (one >= "0" && one <= "9") ||
                (one >= "a" && one <= "z") || (one >= "A" && one <= "Z");
            if (!isName) break;
            name += one;
        }
        return name;
    }
    return "";
}

/** Whether a line is comment, which the source walk below skips rather than reads for words. */
function isCommentLine(line: string): boolean {
    const trimmed = line.trimStart();
    return ["//", "/*", "*/", "*"].some((opener) => trimmed.startsWith(opener));
}

/**
 * Every text a line holds. A comment is found on the same walk as the quotes — `source-line.ts`.
 */
function getLineTexts(line: string): string[] {
    const found: string[] = [];
    let quote = "";
    let held = "";
    let opened = 0;
    let index = 0;
    while (index < line.length) {
        const character = line.charAt(index);
        if (character === "\\") {
            index += 2;
            continue;
        }
        if (quote !== "") {
            if (character === quote) {
                if (!isKeyAt(line, opened, index + 1)) found.push(held);
                held = "";
                quote = "";
            } else {
                held += character;
            }
            index += 1;
            continue;
        }
        if (character === "/") {
            if (line.charAt(index + 1) === "/") break;
        }
        if (QUOTES.includes(character)) {
            quote = character;
            opened = index;
        }
        index += 1;
    }
    return found;
}

/**
 * ⚠️ **A quoted key is not a word, and two tables are nothing but quoted keys.**
 * `PROC_WORD_BY_KEY` is written `"+crit": "krytyk"`, so a walk over its lines finds the game's
 * own keys beside the panel's words — and a check asking that every text be read would ask the
 * panel to say `+of_woundpoison` to somebody.
 *
 * A key is told from a value by **both** ends of it: nothing but indentation before it, and a
 * colon after it. The colon alone is not enough, and the sample beside this reader is why —
 * `isHeld ? "tak" : "nie"` puts one after a branch that is a word somebody reads. `deno fmt`
 * writes one entry to a line here, which is what makes the opening end readable at all.
 */
function isKeyAt(line: string, open: number, close: number): boolean {
    if (line.slice(0, open).trim().length > 0) return false;
    for (let look = close; look < line.length; look += 1) {
        const character = line.charAt(look);
        if (character === ":") return true;
        if (character !== " ") return false;
    }
    return false;
}

/** A text somebody could read: two characters with a letter among them, and no hole in it. */
function isReadableText(text: string): boolean {
    if (text.length < 2) return false;
    if (text.includes("${")) return false;
    for (const one of text) {
        if (one >= "a" && one <= "z") return true;
        if (one >= "A" && one <= "Z") return true;
    }
    return false;
}

/**
 * The reader that tells a key from a value, proved by a sample it must skip **and** a sample it
 * must not — the second is the one that matters, because a reader skipping too much would drop
 * a word out of the check above without dropping its holder, and the holder would go on passing.
 */
Deno.test("a quoted key is skipped and the value beside it is not", () => {
    const line = `    "+of_woundpoison": "głęboka rana",`;
    const held = getLineTexts(line);
    assertEquals(held, ["głęboka rana"], "the value is read and the key it is filed under is not");
    assertEquals(getLineTexts(`    spent: "wykorzystany",`), ["wykorzystany"], "an unquoted key");
    assertEquals(getLineTexts(`const SEPARATOR = "·";`), ["·"], "a lone value is still read");
    assertEquals(isReadableText("·"), false, "and the check beside this one is what drops it");
    // ⚠️ **The colon has to be the next thing that is not a space.** A value standing before
    // one — a ternary, an object closing on the same line — is a word somebody reads.
    assertEquals(getLineTexts(`    at: isHeld ? "tak" : "nie",`), ["tak", "nie"], "both branches");
});

Deno.test("a count is spelled the three ways Polish spells one", () => {
    const noun = COUNTED_NOUNS.messages;
    assertEquals(formatCountedNoun(1, noun), "1 wiadomość", "one takes the first form");
    assertEquals(formatCountedNoun(2, noun), "2 wiadomości", "two takes the second");
    assertEquals(formatCountedNoun(4, noun), "4 wiadomości", "and so does four");
    assertEquals(formatCountedNoun(5, noun), "5 wiadomości", "five takes the third");
    assertEquals(formatCountedNoun(0, noun), "0 wiadomości", "and so does nothing at all");
});

Deno.test("the teens take the third form and the twenties do not", () => {
    const noun = COUNTED_NOUNS.fights;
    assertEquals(formatCountedNoun(12, noun), "12 walk", "twelve is not two");
    assertEquals(formatCountedNoun(14, noun), "14 walk", "nor is fourteen four");
    assertEquals(formatCountedNoun(22, noun), "22 walki", "but twenty-two is");
    assertEquals(formatCountedNoun(24, noun), "24 walki", "and so is twenty-four");
    assertEquals(formatCountedNoun(25, noun), "25 walk", "while twenty-five is not");
    assertEquals(formatCountedNoun(112, noun), "112 walk", "a hundred and twelve is a teen too");
});

Deno.test("every noun states its three forms, and they are not one form thrice", () => {
    for (const [name, noun] of Object.entries(COUNTED_NOUNS)) {
        assert(noun.one.length > 0, `${name} states the first form`);
        assert(noun.few.length > 0, `${name} states the second`);
        assert(noun.many.length > 0, `${name} states the third`);
        assert(new Set([noun.one, noun.few, noun.many]).size > 1, `${name} spells one word thrice`);
    }
});

Deno.test("a place is said with as much of it as was known, and nothing where none was", () => {
    assertEquals(formatPlace("Mapa", 12, 34), "Mapa (12, 34)", "both, the map first");
    assertEquals(formatPlace("Mapa", null, null), "Mapa", "the map alone stands alone");
    assertEquals(formatPlace(null, 12, 34), "(12, 34)", "and so does the tile");
    // Half a tile is not a tile: a pair with one number missing states a place that is not one.
    assertEquals(formatPlace("Mapa", 12, null), "Mapa", "half a tile is left unsaid");
    assertEquals(formatPlace(null, null, 34), null, "and half a tile alone says nothing");
    assertEquals(formatPlace(null, null, null), null, "nothing known is said as nothing");
    assertEquals(formatPlace("Mapa", 0, 0), "Mapa (0, 0)", "the corner of a map is a tile");
});

Deno.test("a share is spelled in whole points, and a figure too small to round says so", () => {
    assertEquals(formatShare(0.516), "52%", "whole points, the way every row prints one");
    assertEquals(formatShare(0), "0%", "zero happened and measured nothing");
    assertEquals(formatShare(1), "100%", "and the whole of a fight is the whole of it");
    // The floor and the measurement stand apart: one says too small to print, the other says none.
    assertEquals(formatShare(0.0004), "<1%", "a share too small to print is not zero");
    // A share outside the whole must not stop the panel: it is held to the ends instead, and one
    // that is not a number at all says so — **E12**, develop ADR 0051.
    assertEquals(formatShare(1.5), "100%", "more than the whole is drawn as the whole");
    assertEquals(formatShare(-1), "0%", "and below nothing is drawn as nothing");
    assertEquals(
        formatShare(Number.NaN),
        PANEL_WORDS.unknown,
        "while a share that is not a number is said as not known, which is not zero",
    );
});

/**
 * The figure every reader sees, and what it does with one that is not a figure. It must not stop
 * the panel; the word for *not known* is what the panel already has, and zero is not it —
 * `develop:CONTEXT.md` keeps those apart. **E12**, develop ADR 0051.
 */
Deno.test("a figure that is not one is said as not known, and never as a number", () => {
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 1e21]) {
        assertEquals(formatFigure(value), PANEL_WORDS.unknown, `${value} is not a figure`);
    }
    assertEquals(formatFigure(0), "0", "while zero happened, and is written as it was");
});

Deno.test("a count of things that is not a count says so, and still says what of", () => {
    assertStringIncludes(
        formatUses(Number.NaN),
        PANEL_WORDS.unknown,
        "a count that is not one is not drawn as a number",
    );
    assertStringIncludes(
        formatUses(-1),
        PANEL_WORDS.unknown,
        "and neither is one below nothing, which no announcement could come to",
    );
    assertEquals(formatUses(3), "×3", "and one that is is drawn as it stands");
});

Deno.test("a figure is spaced the way the game spaces one, from three digits up", () => {
    assertEquals(formatFigure(0), "0", "zero is one digit and stays one");
    assertEquals(formatFigure(999), "999", "three digits are a group already");
    assertEquals(formatFigure(1000), "1\u00a0000", "and the fourth is what opens a gap");
    assertEquals(
        formatFigure(141710),
        "141\u00a0710",
        "the figure the panel was photographed on",
    );
    assertEquals(
        formatFigure(1234567),
        "1\u00a0234\u00a0567",
        "two gaps, at every third digit",
    );
    assertEquals(
        formatFigure(-1000),
        "-1\u00a0000",
        "a sign never joins the digits behind it",
    );
    assertEquals(formatFigure(1000.4), "1\u00a0000", "a figure is drawn as a whole number");
});

/**
 * The gap is a space that does not break, which is the whole of why a figure stays on one line.
 * Both ways round: a figure that groups carries no plain space, and one that does not group carries
 * no gap at all — a separator that stopped grouping would pass the first half on its own.
 */
Deno.test("a figure never offers a place to break, and never spaces what it should not", () => {
    assert(!formatFigure(1000).includes(" "), "a figure that groups carries no plain space");
    assertStringIncludes(
        formatFigure(1000),
        "\u00a0",
        "and groups on the one that does not break",
    );
    assert(!formatFigure(999).includes(" "), "three digits are one group and stay one word");
    assert(!formatFigure(999).includes("\u00a0"), "with no gap opened inside them");
    assert(!formatFigure(0).includes("\u00a0"), "and zero is a digit, not a group of them");
});

Deno.test("a set of shares adds to the whole it is a share of", () => {
    // Rounded a row at a time these print 33%, 33% and 33%, which is a column that does not sum.
    const thirds = formatShares([1, 1, 1], 3);
    assertEquals(getPointsFromShares(thirds), 100, "the points left over are handed out");
    assertEquals(formatShares([1, 0], 1), ["100%", "0%"], "a figure of nothing takes none");
    assertEquals(formatShares([1, 1], 0), ["0%", "0%"], "a whole of nothing states no share");
    // A whole holding a figure the screen does not draw: the shares are right to add to less.
    assertEquals(getPointsFromShares(formatShares([1, 1], 4)), 50, "half a whole is half");
});

/** What the reader adds up, as the reader adds it up: the points, without the sign. */
function getPointsFromShares(texts: readonly string[]): number {
    let total = 0;
    for (const text of texts) {
        if (text === "<1%") continue;
        total += Number(text.slice(0, text.length - 1));
    }
    assert(Number.isFinite(total), "a column of shares adds to a number");
    return total;
}

Deno.test("two of a figure print one share, and the column still adds up", () => {
    // The three equal figures hold the largest discarded fraction and there are only two points
    // to hand out, so the group is passed over and two smaller remainders are paid instead. Row
    // by row the first two of the three would take a point each and print 6% beside 5%.
    const tie = formatShares([1, 1, 1, 2, 13], 18);
    assertEquals(tie, ["5%", "5%", "5%", "12%", "73%"], "equal figures print equal shares");
    assertEquals(getPointsFromShares(tie), 100, "and the column still comes to the whole");
    // A group that fits is paid whole: two points left, two members, both take one.
    assertEquals(formatShares([1, 1, 4], 6), ["17%", "17%", "66%"], "a group that fits");
    // Three equal thirds: the group of three cannot be paid out of the one point left, so the
    // column adding up wins over the evenness and the earliest row takes it.
    const split = formatShares([1, 1, 1], 3);
    assertEquals(getPointsFromShares(split), 100, "a tie is split where nothing else can pay");
    assertEquals(split, ["34%", "33%", "33%"], "earliest row first, so nothing flickers");
});

Deno.test("a key health moved under is worded, and one nobody named travels as written", () => {
    assertEquals(getWordsForHealthSource("heal"), "przywracanie życia", "the key most of it comes");
    assertEquals(
        getWordsForHealthSource("bandage"),
        "bandażowanie",
        "under, and the rarest of them",
    );
    // What the game sends and nobody here has named is shown as the game wrote it: a row that
    // vanished or read "nieznane" would hide a real figure behind our own ignorance.
    assertEquals(getWordsForHealthSource("heal_of_2027"), "heal_of_2027", "a key nobody has named");
    for (const [key, words] of HEALTH_SOURCE_WORD_BY_KEY) {
        assert(words.length > 0, `${key}: a key the table holds is worded`);
        assert(!words.includes("%"), `${key}: a hole in a sentence is not a word for a column`);
    }
});

Deno.test("a suspicion about what never arrived counts in all three Polish forms", () => {
    const lost = (count: number) => formatLostMessageSuspicion(count, count);
    assertStringIncludes(lost(1), "1 wiadomość", "one takes the first form");
    assertStringIncludes(lost(2), "2 wiadomości", "two takes the second");
    assertStringIncludes(lost(5), "5 wiadomości", "and five the third");
    // Nothing to warn about is nothing said. The empty sentence is dropped where it is drawn,
    // rather than stopping the draw it arrived in — **E12**, develop ADR 0051.
    assertEquals(formatLostMessageSuspicion(0, SAID_OUT_OF), "", "nothing lost is nothing to say");
});

/**
 * A count says whether a reader has to act on it only against what it is out of: two of twelve is
 * a fight nobody can trust, and two of four hundred is a number in the third decimal place.
 */
Deno.test("a suspicion states its count against what that count is out of", () => {
    assertStringIncludes(
        formatUnknownKeySuspicion(2, 412, ""),
        "2 z 412 wiadomości",
        "the count, then what it is out of",
    );
    // A denominator smaller than the count is a reading that disagrees with itself. The sentence
    // states the count alone rather than a fraction nobody can read (**E12**: it clamps in place).
    assertStringIncludes(
        formatUnknownKeySuspicion(2, 1, ""),
        "2 wiadomości",
        "and never a share bigger than one",
    );
    assert(
        !formatUnknownKeySuspicion(2, 1, "").includes(" z "),
        "which is said by leaving the denominator out, not by mending it",
    );
});

/**
 * ⚠️ **`z` and `dotyczy` govern the genitive, and a counted noun's own forms are not it.** Polish
 * takes a third form after two to four — `3 uleczenia` standing alone, `z 3 uleczeń` under `z` —
 * and the panel was writing the standing form in both places. The many form is the genitive
 * plural, and it is what every count past one takes there. `develop ADR 0070`.
 */
Deno.test("a count under a word governing the genitive takes the genitive", () => {
    assertStringIncludes(
        formatUnplacedHealSuspicion(1, 3, ""),
        "1 z 3 uleczeń",
        "never `3 uleczenia`, which is the form nothing governs",
    );
    assertStringIncludes(
        formatUnplacedHealSuspicion(2, 5, ""),
        "2 z 5 uleczeń",
        "and past four the two forms agree, which is what hid this",
    );
    // A denominator of one wants the genitive singular, which this vocabulary does not carry —
    // and says nothing the count has not, so the sentence states the count alone.
    assertStringIncludes(
        formatUnplacedHealSuspicion(1, 1, ""),
        "1 uleczenie bez podziału",
        "one out of one is one, said once",
    );
});

/**
 * A row's own sentence states its count bare, and that is not an oversight: what it would be
 * counted out of is the messages naming that person, which nothing counts. `develop ADR 0070`.
 */
Deno.test("a suspicion about one person states its count out of nothing", () => {
    for (const said of [formatUnknownKeyRowSuspicion(2), formatNoParameterRowSuspicion(2)]) {
        assertStringIncludes(said, "2 wiadomości bez odczytu", "the count, and straight to what");
        assert(!said.includes(`z ${SAID_OUT_OF}`), "and never out of the fight's own total");
    }
    assertStringIncludes(
        formatUnplacedHealRowSuspicion(2),
        "2 uleczenia bez podziału",
        "and the cast says the same, in its own noun",
    );
});

/**
 * Whom a gap reaches, where the mark on a row cannot be seen without pointing at it. Three names
 * is what fits; past that the sentence says how many, because a list that grew with the fight
 * would be a second ranking drawn in a paragraph.
 */
Deno.test("a suspicion names whom it reaches while they are few, counting them past that", () => {
    assertEquals(formatChargedRows([], 0), "", "a gap naming nobody names nobody");
    assertEquals(
        formatChargedRows(["Gracz 1", "Gracz 2"], 2),
        " (Gracz 1, Gracz 2)",
        "two are read faster as names than as a number",
    );
    assertEquals(
        formatChargedRows(["Gracz 1", "Gracz 2", "Gracz 3"], 3),
        " (Gracz 1, Gracz 2, Gracz 3)",
        "and three is what still fits beside a count",
    );
    assertStringIncludes(
        formatChargedRows(["Gracz 1", "Gracz 2", "Gracz 3"], 4),
        "dotyczy 4 postaci",
        "the fourth turns the list into a count, and the names are dropped whole",
    );
    assertEquals(
        formatChargedRows([], 7),
        " (dotyczy 7 postaci)",
        "rows the roster could not name are counted, never guessed at",
    );
});

Deno.test("the reader knows a word the article prints from one it does not", () => {
    // The sample that must flag, so the reader is known to be looking, and the one that must not,
    // so it is known not to find too much. Both words are real: `blok` the frozen table counts,
    // `wchłonięcie` the word this repository drew until develop ADR 0077 and the article carries
    // not once.
    assertEquals(
        getWordsTheArticleDoesNotPrint(new Map([["blok", "blok"]])),
        [],
        "a word the frozen reading counted is one this reader passes",
    );
    assertEquals(
        getWordsTheArticleDoesNotPrint(new Map([["absorb", "wchłonięcie"]])),
        ['"wchłonięcie" was never asked about'],
        "and a word nothing counted is one it flags",
    );
});

/**
 * The two tables the published help words, re-earned against the frozen counts: the kinds of damage
 * (`develop ADR 0073`) and the defences (`develop ADR 0077`). The client has no case label for
 * either family's keys, so the article is the only source a name could come from and an invention
 * is indistinguishable from a reading.
 *
 * ⚠️ **A count proves the article carries the word, not that it carries it as this thing's name.**
 * That half is a person's reading, the way **V1**'s citation rule is — `globalne` occurred once
 * in the article while naming a chat setting, and a reader that stopped at the count would have
 * blessed it. The register's own header draws the same line: the line states an occurrence, the
 * prose states what it means.
 */
function getWordsTheArticleDoesNotPrint(worded: ReadonlyMap<string, string>): string[] {
    const counts: Record<string, number> = FROZEN_HELP_PHRASES.counts;
    const unprinted: string[] = [];
    for (const word of worded.values()) {
        const carried = counts[word];
        if (carried === undefined) {
            unprinted.push(`"${word}" was never asked about`);
            continue;
        }
        if (carried > 0) continue;
        unprinted.push(`"${word}" is printed nowhere`);
    }
    return unprinted;
}

Deno.test("every word the element column draws is one the game prints", () => {
    assert(ELEMENT_WORD_BY_KEY.size > 0, "the column words something");
    assertEquals(
        getWordsTheArticleDoesNotPrint(ELEMENT_WORD_BY_KEY),
        [],
        "a kind is drawn under the article's word for it, or under the game's own token",
    );
});

/**
 * The same for the defences, and for the same reason: the card draws these under `Zatrzymane` where
 * a player is reading the game's own vocabulary everywhere around them. `develop ADR 0077` extends
 * `develop ADR 0073`'s decision to this table; `develop:docs/protocol-keys.md` carries the
 * measurement key by key, and `blok` is both the client's token and a word the article prints.
 */
Deno.test("every word a defence is drawn under is one the game prints", () => {
    assert(DEFENCE_WORD_BY_KEY.size > 0, "the card words something");
    assertEquals(
        getWordsTheArticleDoesNotPrint(DEFENCE_WORD_BY_KEY),
        [],
        "a defence is drawn under the article's word for it, and never an invented one",
    );
});

/**
 * ⚠️ **One pool, two tables, and they drifted for four releases.** `develop ADR 0077` moved the
 * defence line to the article's own `absorpcja` and `absorpcja magiczna`, and left
 * `DESTROYED_WORD_BY_KEY` saying `wchłanianie` — the same pool under two names in one panel, and
 * nothing red. The article check above cannot reach this table: the frozen reading was never asked
 * about `pancerz` or `odporność: ogień`, so a blanket count over it would flag the rows that are
 * right. What is mechanical is that the two tables agree about the pool they share (**N13**).
 */
Deno.test("what destroys absorption is named as the defence line names it", () => {
    assertStrictEquals(
        DESTROYED_WORD_BY_KEY.get("abdest_per")?.name,
        DEFENCE_WORD_BY_KEY.get("absorb"),
        "the pool a blow empties wears the name the pool itself wears",
    );
    assertStrictEquals(
        DESTROYED_WORD_BY_KEY.get("abmdest_per")?.name,
        DEFENCE_WORD_BY_KEY.get("absorbm"),
        "and the magical pool the same, so neither surface teaches a second word",
    );
});

Deno.test("a kind the help does not name is left out rather than invented", () => {
    assertEquals(
        ELEMENT_WORD_BY_KEY.get("dmgg"),
        undefined,
        "the one kind no source names carries no word",
    );
    assertEquals(getWordsForDamageKind("dmgg"), "dmgg", "and reaches a reader as the game's token");
});

/**
 * The twelve are what makes a dated row readable, and a shelf of twenty spans months. Written out
 * here rather than read back off the table, which is what this file's docblock asks of every
 * sentence in it: reading them off `MONTH_WORDS` would hold the words to be whatever they are.
 */
Deno.test("every month a kept fight can fall in spells its own word", () => {
    const spelled: string[] = [];
    for (let month = FIRST_MONTH; month <= MONTHS_IN_YEAR; month += 1) {
        spelled.push(getWordsForShelfTime({ day: 1, month, hour: 0, minute: 0 }, false));
    }
    assertEquals(
        spelled,
        [
            "01 sty 00:00",
            "01 lut 00:00",
            "01 mar 00:00",
            "01 kwi 00:00",
            "01 maj 00:00",
            "01 cze 00:00",
            "01 lip 00:00",
            "01 sie 00:00",
            "01 wrz 00:00",
            "01 paź 00:00",
            "01 lis 00:00",
            "01 gru 00:00",
        ],
        "each month its own three letters, so a dated column is one width all year",
    );
});

/**
 * Both sides of every edge, and zero is one of them: midnight on the first is a moment like any
 * other, and a row that dropped it would be a fight the shelf holds and cannot date.
 */
Deno.test("a moment on either edge of the calendar is still a moment", () => {
    assertEquals(
        getWordsForShelfTime({ day: 1, month: FIRST_MONTH, hour: 0, minute: 0 }, false),
        "01 sty 00:00",
        "the first minute of the year reads back, because zero is a reading",
    );
    assertEquals(
        getWordsForShelfTime({ day: 31, month: MONTHS_IN_YEAR, hour: 23, minute: 59 }, false),
        "31 gru 23:59",
        "and so does the last",
    );
});

/**
 * A month outside the twelve finds no word, and the row says nothing rather than printing the
 * number it could not name — the refusal `00:00` has always had, extended to the half in front.
 */
Deno.test("a day nobody can name leaves the row saying nothing", () => {
    const beforeTheYear = { day: 1, month: FIRST_MONTH - 1, hour: 21, minute: 5 };
    assertEquals(getWordsForShelfTime(beforeTheYear, false), "", "no month, so no date");
    const afterTheYear = { day: 1, month: MONTHS_IN_YEAR + 1, hour: 21, minute: 5 };
    assertEquals(getWordsForShelfTime(afterTheYear, false), "", "on both sides of the twelve");
    const noDay = { day: 0, month: 9, hour: 21, minute: 5 };
    assertEquals(getWordsForShelfTime(noDay, false), "", "and a day the calendar does not have");
    const pastTheMonth = { day: 32, month: 9, hour: 21, minute: 5 };
    assertEquals(getWordsForShelfTime(pastTheMonth, false), "", "on both sides of the day too");
    const beforeMidnight = { day: 13, month: 9, hour: -1, minute: 5 };
    assertEquals(getWordsForShelfTime(beforeMidnight, false), "", "an hour before the day began");
    const beforeTheHour = { day: 13, month: 9, hour: 21, minute: -1 };
    assertEquals(getWordsForShelfTime(beforeTheHour, false), "", "and a minute before the hour");
    assertEquals(getWordsForShelfTime(null, false), "", "as does a moment that never read back");
});

/** The fight going on now is dated by nothing, because it is still happening. */
Deno.test("the live row says when it is without a date", () => {
    const dated = { day: 13, month: 9, hour: 21, minute: 5 };
    assertEquals(getWordsForShelfTime(dated, true), "teraz", "the live wording outranks the date");
    assertEquals(getWordsForShelfTime(null, true), "teraz", "and stands without a moment at all");
});

/**
 * ⚠️ **The turns are the one row counted from the fight's own start**, so a panel that walked in
 * late has a figure short by an amount nothing states (`develop:docs/turns-taken.md`). The panel
 * says so over its own figures; this block has no room for that sentence, so the row goes rather
 * than standing unqualified — a **Suspect** is marked beside the figure it concerns, or it is not a
 * suspect but a wrong number (`develop:CONTEXT.md`).
 */
Deno.test("a fight the panel walked into says nothing about turns taken", () => {
    const whole = presentTooltipRows(
        { ...NOTHING_CARRIED, turnsTaken: 14 },
        null,
        FROZEN_BUFF_BITS.bits,
    );
    assertEquals(whole.length, 2, "seen whole, the count stands under the name");
    assertStringIncludes(whole[1] ?? "", "14", "and it is the count");
    const late = presentTooltipRows(
        {
            ...NOTHING_CARRIED,
            turnsTaken: 14,
            wasJoinedInProgress: true,
        },
        null,
        FROZEN_BUFF_BITS.bits,
    );
    assertEquals(late, [], "walked into, there is nothing to say and no block at all");
});

/**
 * ⚠️ **Only that one row goes.** Everything else in the block says what stands **now**, which a
 * late start does not shorten — a status the mask states is as true for a reader who walked in as
 * for one who did not.
 */
Deno.test("walking in late costs the turns and nothing else", () => {
    const late = presentTooltipRows(
        {
            ...NOTHING_CARRIED,
            turnsTaken: 9,
            wasJoinedInProgress: true,
            statuses: [{ bit: 6, percent: 20 }],
        },
        null,
        FROZEN_BUFF_BITS.bits,
    );
    assertEquals(late.length, 2, "the name and the status it still knows");
    assertStringIncludes(late[1] ?? "", "20%", "the figure stands, because now is now");
});

/**
 * ⚠️ **The order is fixed, whatever a fighter carries** (`develop ADR 0116`), so a row is found
 * where it was last time. Nothing else holds it: the rows are pushed by six calls in a row, and
 * swapping two of them reddens no other test. The statuses arrive in mask order, poison first, so
 * the slow and the haste standing above the poison is the order doing it and not the mask.
 */
Deno.test("the rows stand in the one order the maintainer set", () => {
    assertEquals(presentTooltipRows(CARRYING_EVERYTHING, null, FROZEN_BUFF_BITS.bits), [
        "MargoMeter",
        "Tury wykonane 14",
        "Cios specjalny · Pożoga · 2 z 4",
        "Ostatni ratunek · wykorzystany",
        "Dotyk anioła · 1 z 3",
        "Prowokuje 10 postaci",
        "Sprowokowany przez Gracz 2 · 2 z 3",
        "swow_down 14%",
        "speed_up 20%",
        "poisoned",
    ]);
});

/**
 * **W5: the bound is a boundary**, so the block at it is asserted beside the block past it. It
 * clamps rather than asserts, because a fighter with one thing more to say is not a reason to
 * stop drawing (**A11**) — and the name takes a row of the bound like any other, so what the
 * game is handed is never longer than the maximum however many rows were composed.
 */
Deno.test("a block past its stated maximum is cut to it, and one at it is drawn whole", () => {
    const many = (count: number) =>
        Array.from({ length: count }, (_, at) => ({ bit: at, percent: null }));
    const atTheBound = presentTooltipRows(
        {
            ...CARRYING_EVERYTHING,
            statuses: many(TOOLTIP_ROWS_MAXIMUM - 7),
        },
        null,
        FROZEN_BUFF_BITS.bits,
    );
    assertEquals(atTheBound.length, TOOLTIP_ROWS_MAXIMUM, "every row it was allowed stands");
    const past = presentTooltipRows(
        {
            ...CARRYING_EVERYTHING,
            statuses: many(TOOLTIP_ROWS_MAXIMUM),
        },
        null,
        FROZEN_BUFF_BITS.bits,
    );
    assertEquals(past.length, TOOLTIP_ROWS_MAXIMUM, "and one row more is cut to the same length");
    assertEquals(past[0], "MargoMeter", "the name is never what the cut takes");
});

/**
 * The defect block's words, from `develop:tests/ui/panel-defect.test.ts`: the keeper that tallies
 * them is not here, and what it draws for one kind is this.
 */
Deno.test("every defect kind says something of its own, as a sentence, tallied past one", () => {
    const said = Object.values(PANEL_DEFECT_KIND).map((kind) => formatDefect(kind, null, 1));
    assertStrictEquals(new Set(said).size, said.length, "no two kinds worded alike");
    for (const one of said) {
        assert(one.length > 1, "a defect that is drawn says something");
        assert(one.endsWith("."), "and says it as a sentence");
        assert(!one.includes("("), "and once is not a tally");
    }
    const region = formatDefect(PANEL_DEFECT_KIND.region, "list", 1);
    assertStringIncludes(region, REGION_WORDS.list, "a region names the part that is missing");
    const header = formatDefect(PANEL_DEFECT_KIND.region, "header", 1);
    assert(header !== region, "and two regions are two sentences");
    assertStringIncludes(formatDefect(PANEL_DEFECT_KIND.region, "list", 3), "3", "a tally counts");
});

/**
 * A probe for **W4**: the closing row of a damage section owes the third caveat, and the cases
 * above read the sentence without ever asking which noun owes it — so a table that owed it nowhere
 * went green.
 */
Deno.test("the closing row of a damage section owes a caveat, and a healing one owes none", () => {
    assertStrictEquals(
        getCaveatForUnannounced(PANEL_NOUN.damage),
        CAVEAT.unannounced,
        "damage closes against the blows, and what no blow names is caveated",
    );
    assertStrictEquals(
        getCaveatForUnannounced(PANEL_NOUN.healing),
        null,
        "healing closes against nothing at all",
    );
});

/**
 * A probe for **W4**: the bound above is derived from the two constants, so moving the rows beside
 * the statuses moved the bound with it and nothing went red. What holds the constant is the block
 * it bounds: a fighter carrying everything, under every status the client names, fits it exactly.
 */
Deno.test("a fighter carrying everything under every status fits the block exactly", () => {
    const statuses = FROZEN_BUFF_BITS.bits.map((_, bit) => ({ bit, percent: null }));
    const said = presentTooltipRows(
        { ...CARRYING_EVERYTHING, statuses },
        null,
        FROZEN_BUFF_BITS.bits,
    );
    assertStrictEquals(said.length, TOOLTIP_ROWS_MAXIMUM, "every row it has to say fits");
    const unclamped = presentTooltipRows(
        { ...CARRYING_EVERYTHING, statuses },
        null,
        [...FROZEN_BUFF_BITS.bits, "one_more"],
    );
    assertStrictEquals(unclamped.length, said.length, "and a wider bound finds no row it cut");
});

Deno.test("a whole number is written as it is, and anything else degrades, never throws", () => {
    assertEquals(formatWhole(0), "0", "nothing is a figure");
    assertEquals(formatWhole(1), "1", "and so is its neighbour");
    assertEquals(formatWhole(-161518), "-161518", "and one below nothing");
    assertEquals(formatWhole(1.5), "2", "a fraction rounds");
    assertEquals(formatWhole(Number.NaN), PANEL_WORDS.unknown, "what is no number is unknown");
    assertEquals(formatWhole(Number.POSITIVE_INFINITY), PANEL_WORDS.unknown, "and so is no end");
    assertEquals(formatWhole(2 ** 60), PANEL_WORDS.unknown, "and a number past what is held");
});

Deno.test("a panel waiting for a game says what it cannot see", () => {
    assertEquals(formatDefect(PANEL_DEFECT_KIND.engine, null, 1), "Nie widać walki w grze.");
    assertEquals(formatDefect(PANEL_DEFECT_KIND.engine, null, 3), "Nie widać walki w grze (3×).");
});

function getUnmistakableKeys(): string[] {
    const found = new Set<string>(HAND_KEPT_KEYS);
    for (const stated of FROZEN_PROTOCOL_KEYS.keys) {
        const key = stated.replace("+", "").replace("-", "");
        if (key.length < 4) continue;
        const isShaped = key.includes("_") || key !== key.toLowerCase() ||
            [...key].some((one) => one >= "0" && one <= "9");
        if (!isShaped) continue;
        found.add(key.toLowerCase());
    }
    return [...found];
}
