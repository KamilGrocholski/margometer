/**
 * What the reader reads, held to what it must never say.
 *
 * Reading a sentence back from the module that wrote it would hold the two to be the same and
 * neither to be right, so nothing here compares a word to itself. What is checked is the two
 * things a sentence can be wrong about whatever it says: that it carries none of our vocabulary
 * and no key of the game's, and that a count is spelled the way Polish spells one.
 */

import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import { isCommentLine } from "@/tests/source-line.ts";
import { FROZEN_HELP_PHRASES } from "@/frozen/help-phrases.ts";
import { FROZEN_PROTOCOL_KEYS } from "@/frozen/protocol-keys.ts";
import {
    CARD_WORDS,
    CHOICE_REFUSED_ANSWER,
    composeCardSubtitleText,
    composeChargedRowsText,
    composeCountedNoun,
    composeDefectText,
    composeDestroyedText,
    composeFigureText,
    composeGrammarRefusedSuspicion,
    composeJoinedInProgressSuspicion,
    composeLostMessageSuspicion,
    composeNoParameterRowSuspicion,
    composeNoParameterSuspicion,
    composePlaceWords,
    composeShareText,
    composeShareTexts,
    composeShelfSizeText,
    composeSideCountsText,
    composeStandingTurnsText,
    composeTurnOrdinalText,
    composeUndrawnText,
    composeUnknownKeyRowSuspicion,
    composeUnknownKeySuspicion,
    composeUnplacedHealRowSuspicion,
    composeUnplacedHealSuspicion,
    composeUsesText,
    COUNTED_NOUNS,
    DEFECT_KINDS,
    DEFENCE_WORDS,
    DESTROYED_WORDS,
    ELEMENT_WORDS,
    EVERY_SLOT_PINNED_ANSWER,
    getWordsForCardMetric,
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
    HEALTH_LOSS_WORDS,
    HEALTH_SOURCE_WORDS,
    NEITHER_END_WORDS,
    PANEL_WORDS,
    type PanelRegion,
    PROC_WORDS,
    PROFESSION_WORDS,
    REGION_WORDS,
    STANDING_WORDS,
    STORE_MADE_ROOM_ANSWER,
    STORE_REFUSED_ANSWER,
} from "@/src/ui/panel-words.ts";
import {
    type PanelNoun,
    SCREEN_ORDER,
    SIDE_CHOICES,
    STORAGE_CHOICES,
} from "@/src/ui/panel-screen.ts";
import type { StandingTurnState } from "@/src/ui/panel-standing.ts";
import { type PanelOutcome, type PanelUnnamedEnd, PINNED_CASES } from "@/src/ui/panel-reading.ts";

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
const GAME_KEYS = getUnmistakableKeys();
/** What a count in these sentences is stated out of. Any figure past the counts below will do. */
const SAID_OUT_OF = 412;

/** Every table of words the module exports, walked for its values rather than named one by one. */
const TABLES = [
    CARD_WORDS,
    DEFENCE_WORDS,
    ELEMENT_WORDS,
    HEALTH_LOSS_WORDS,
    HEALTH_SOURCE_WORDS,
    PROC_WORDS,
    PROFESSION_WORDS,
    STANDING_WORDS,
];

/**
 * Every member of a closed set, with the compiler counting them: a literal list of four states
 * goes on reading four the day a fifth arrives, and the words behind the new one would be read
 * by nothing. The `Record` is exhaustive in both directions.
 */
function getEveryKey<Key extends string>(held: Record<Key, true>): Key[] {
    return Object.keys(held) as Key[];
}

const PANEL_NOUNS = getEveryKey<PanelNoun>({ damage: true, healing: true });
const TURN_STATES = getEveryKey<StandingTurnState>({
    held: true,
    unread: true,
    afterFight: true,
    onAuto: true,
});
const PANEL_OUTCOMES = getEveryKey<PanelOutcome>({
    won: true,
    lost: true,
    drawn: true,
    fled: true,
});

function getSentences(): string[] {
    const found = Object.values(PANEL_WORDS).map((one) => String(one));
    for (const noun of Object.values(COUNTED_NOUNS)) {
        found.push(noun.one, noun.few, noun.many);
    }
    // What a half-named row says, for the same reason: the tables behind these are keyed and a
    // walk over `PANEL_WORDS` reaches none of them.
    for (const end of ["actor", "target"] as readonly PanelUnnamedEnd[]) {
        found.push(getWordsForUnnamedEnd(end, "damage"));
        found.push(getWordsForUnnamedEnd(end, "healing"));
    }
    for (const kase of PINNED_CASES) {
        found.push(getWordsForPinnedStanding(kase));
        found.push(getWordsForPinnedScope(kase));
    }
    found.push(NEITHER_END_WORDS.label, NEITHER_END_WORDS.note);
    // ⚠️ **What the panel says it could not do**, which `DEFECT_WORDS` carries and its own
    // docblock cites **L3** for. `PANEL_WORDS` does not hold them and a walk over it reached
    // none: measured 2026-09-11 by putting `oth_dmg` into one, which the checks below read past.
    // The region kind takes a region, so every one of those is asked as well.
    for (const kind of DEFECT_KINDS) {
        found.push(composeDefectText(kind, null, 1));
        for (const region of Object.keys(REGION_WORDS)) {
            found.push(composeDefectText(kind, region as PanelRegion, 2));
        }
    }
    found.push(...getSentencesFromSuspicions());
    // ⚠️ **Every table the module keeps, and every word it hands out that a table does not.**
    // Measured 2026-09-11 by putting `oth_dmg` into the first string of each of the twenty
    // tables in `src/ui/panel-words.ts` and running this file: twelve lit, nine did not, and
    // the sentences behind those nine were read by neither check below.
    for (const table of TABLES) {
        for (const words of Object.values(table)) found.push(String(words));
    }
    for (const [statistic, held] of Object.entries(DESTROYED_WORDS)) {
        found.push(held.name, held.unit, composeDestroyedText(statistic, 12));
    }
    found.push(STORE_REFUSED_ANSWER, STORE_MADE_ROOM_ANSWER);
    found.push(EVERY_SLOT_PINNED_ANSWER, CHOICE_REFUSED_ANSWER);
    found.push(...getSentencesFromChoices());
    for (const region of Object.keys(REGION_WORDS)) {
        found.push(composeUndrawnText(region as PanelRegion));
    }
    // A word that says nothing where there is nothing to say is not a sentence: `held` is the
    // state with a turn to draw, and a shelf neither live nor ended has no word to stand under.
    return found.filter((one) => one.length > 0);
}

/** Every sentence a suspicion is said in, the fight's and a row's both. */
function getSentencesFromSuspicions(): string[] {
    const found: string[] = [composeJoinedInProgressSuspicion()];
    for (const count of [1, 2, 5]) {
        const whom = composeChargedRowsText(["Gracz 1", "Gracz 2"], 2);
        found.push(composeLostMessageSuspicion(count, SAID_OUT_OF));
        found.push(composeUnknownKeySuspicion(count, SAID_OUT_OF, whom));
        found.push(composeNoParameterSuspicion(count, SAID_OUT_OF, whom));
        found.push(composeGrammarRefusedSuspicion(count, SAID_OUT_OF));
        found.push(composeUnplacedHealSuspicion(count, SAID_OUT_OF, whom));
        found.push(composeUnknownKeyRowSuspicion(count));
        found.push(composeNoParameterRowSuspicion(count));
        found.push(composeUnplacedHealRowSuspicion(count));
        // And the other shape of the same words: a gap reaching more rows than a sentence lists.
        found.push(composeUnknownKeySuspicion(count, SAID_OUT_OF, composeChargedRowsText([], 7)));
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
    found.push(composeTurnOrdinalText(3), getWordsForShelfTime(null, true));
    found.push(composeSideCountsText([4, 4], 2), composeShelfSizeText([4, 4]));
    found.push(String(composeCardSubtitleText("w", 120, "ours")));
    return found;
}

Deno.test("every word the panel says says something", () => {
    const sentences = getSentences();
    assert(sentences.length > 10, "the panel has words to say");
    for (const sentence of sentences) {
        assertEquals(sentence.trim(), sentence, `${sentence} carries space it does not need`);
    }
});

/**
 * The four words are written out here rather than read back, which is what the docblock above
 * asks of every sentence in this file — and until this test there was nothing at all holding
 * them. A word swapped for another outcome's passed the whole gate: the header test reads the
 * string out of the module that writes it, and the browser suite only ever runs a fight that was
 * won, so `REMIS` and `UCIECZKA` are in its list without ever being drawn.
 */
Deno.test("each way a fight can end has its own word, and no two share one", () => {
    const said: Record<PanelOutcome, string> = {
        won: "wygrana",
        lost: "przegrana",
        drawn: "remis",
        fled: "ucieczka",
    };
    for (const [outcome, word] of Object.entries(said)) {
        assertEquals(
            getWordsForOutcome(outcome as PanelOutcome),
            word,
            `${outcome} is the word a reader reads for it`,
        );
    }
    const words = Object.values(said);
    assertEquals(new Set(words).size, words.length, "and no ending borrows another's word");
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

/**
 * ⚠️ **A hand-kept list of sentences falls behind the module it lists, and this one had.** Nine
 * of the twenty word tables in `src/ui/panel-words.ts` stood outside both checks above, measured
 * 2026-09-11 — about forty sentences, the card's whole vocabulary among them. So the module is
 * read for every declaration holding text, and each is held to putting one of its own words into
 * `getSentences`. What is registered below holds text no reader reads.
 */
const HOLDS_NO_WORD: Record<string, string> = {
    CLIENT_IDS_FOR_UNWORDED_KEYS: "ids the running client answers to, spelled by it",
    THOUSAND_SEPARATOR: "the space a figure groups on, written as its escape",
    DEFECT_KINDS: "what the defects are called here, which the panel never says",
    composeDefectText: "the branch a region takes, and a branch is not a word",
    composeCardSubtitleText: "the default for a card nobody is a side of",
};

const QUOTES = "\"'`";
const HOLDER_OPENERS = ["export const ", "const ", "export function ", "function "];
const HOLDER_CLOSERS = ["type ", "export type ", "interface ", "export interface "];

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

/**
 * Every text a line holds. A comment is found on the same walk as the quotes — `source-line.ts`.
 */
function getLineTexts(line: string): string[] {
    const found: string[] = [];
    let quote = "";
    let held = "";
    let index = 0;
    while (index < line.length) {
        const character = line.charAt(index);
        if (character === "\\") {
            index += 2;
            continue;
        }
        if (quote !== "") {
            if (character === quote) {
                found.push(held);
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
        if (QUOTES.includes(character)) quote = character;
        index += 1;
    }
    return found;
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

Deno.test("every word the module holds reaches the checks above, or says why it does not", () => {
    const holders = getWordHolders(Deno.readTextFileSync("src/ui/panel-words.ts"));
    const said = getSentences().join("\n");
    const unread: string[] = [];
    let holding = 0;
    for (const [name, texts] of holders) {
        if (texts.length === 0) continue;
        holding += 1;
        if (name in HOLDS_NO_WORD) continue;
        if (texts.some((text) => said.includes(text))) continue;
        unread.push(name);
    }
    assert(holding > 40, `the module holds words, and this found ${holding} declarations of them`);
    assertEquals(unread, [], "a word neither check reads is a word neither check holds");
    // The other way round: a register that outlives what it excuses goes on excusing something.
    for (const name of Object.keys(HOLDS_NO_WORD)) {
        assert(holders.has(name), `${name} is excused above and the module no longer has it`);
    }
});

Deno.test("a count is spelled the three ways Polish spells one", () => {
    const noun = COUNTED_NOUNS.messages;
    assertEquals(composeCountedNoun(1, noun), "1 wiadomość", "one takes the first form");
    assertEquals(composeCountedNoun(2, noun), "2 wiadomości", "two takes the second");
    assertEquals(composeCountedNoun(4, noun), "4 wiadomości", "and so does four");
    assertEquals(composeCountedNoun(5, noun), "5 wiadomości", "five takes the third");
    assertEquals(composeCountedNoun(0, noun), "0 wiadomości", "and so does nothing at all");
});

Deno.test("the teens take the third form and the twenties do not", () => {
    const noun = COUNTED_NOUNS.fights;
    assertEquals(composeCountedNoun(12, noun), "12 walk", "twelve is not two");
    assertEquals(composeCountedNoun(14, noun), "14 walk", "nor is fourteen four");
    assertEquals(composeCountedNoun(22, noun), "22 walki", "but twenty-two is");
    assertEquals(composeCountedNoun(24, noun), "24 walki", "and so is twenty-four");
    assertEquals(composeCountedNoun(25, noun), "25 walk", "while twenty-five is not");
    assertEquals(composeCountedNoun(112, noun), "112 walk", "a hundred and twelve is a teen too");
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
    assertEquals(composePlaceWords("Mapa", 12, 34), "Mapa (12, 34)", "both, the map first");
    assertEquals(composePlaceWords("Mapa", null, null), "Mapa", "the map alone stands alone");
    assertEquals(composePlaceWords(null, 12, 34), "(12, 34)", "and so does the tile");
    // Half a tile is not a tile: a pair with one number missing states a place that is not one.
    assertEquals(composePlaceWords("Mapa", 12, null), "Mapa", "half a tile is left unsaid");
    assertEquals(composePlaceWords(null, null, 34), null, "and half a tile alone says nothing");
    assertEquals(composePlaceWords(null, null, null), null, "nothing known is said as nothing");
    assertEquals(composePlaceWords("Mapa", 0, 0), "Mapa (0, 0)", "the corner of a map is a tile");
});

Deno.test("a share is spelled in whole points, and a figure too small to round says so", () => {
    assertEquals(composeShareText(0.516), "52%", "whole points, the way every row prints one");
    assertEquals(composeShareText(0), "0%", "zero happened and measured nothing");
    assertEquals(composeShareText(1), "100%", "and the whole of a fight is the whole of it");
    // The floor and the measurement stand apart: one says too small to print, the other says none.
    assertEquals(composeShareText(0.0004), "<1%", "a share too small to print is not zero");
    // A share outside the whole used to stop the panel. It is held to the ends instead, and one
    // that is not a number at all says so — **E14**, ADR 0051.
    assertEquals(composeShareText(1.5), "100%", "more than the whole is drawn as the whole");
    assertEquals(composeShareText(-1), "0%", "and below nothing is drawn as nothing");
    assertEquals(
        composeShareText(Number.NaN),
        PANEL_WORDS.unknown,
        "while a share that is not a number is said as not known, which is not zero",
    );
});

/**
 * The figure every reader sees, and what it does with one that is not a figure. It used to stop
 * the panel; the word for *not known* is what the panel already has, and zero is not it —
 * `CONTEXT.md` keeps those apart. **E14**, ADR 0051.
 */
Deno.test("a figure that is not one is said as not known, and never as a number", () => {
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 1e21]) {
        assertEquals(composeFigureText(value), PANEL_WORDS.unknown, `${value} is not a figure`);
    }
    assertEquals(composeFigureText(0), "0", "while zero happened, and is written as it was");
});

Deno.test("a count of things that is not a count says so, and still says what of", () => {
    assertStringIncludes(
        composeUsesText(Number.NaN),
        PANEL_WORDS.unknown,
        "a count that is not one is not drawn as a number",
    );
    assertStringIncludes(
        composeUsesText(-1),
        PANEL_WORDS.unknown,
        "and neither is one below nothing, which no announcement could come to",
    );
    assertEquals(composeUsesText(3), "×3", "and one that is is drawn as it stands");
});

Deno.test("a figure is spaced the way the game spaces one, from three digits up", () => {
    assertEquals(composeFigureText(0), "0", "zero is one digit and stays one");
    assertEquals(composeFigureText(999), "999", "three digits are a group already");
    assertEquals(composeFigureText(1000), "1\u00a0000", "and the fourth is what opens a gap");
    assertEquals(
        composeFigureText(141710),
        "141\u00a0710",
        "the figure the panel was photographed on",
    );
    assertEquals(
        composeFigureText(1234567),
        "1\u00a0234\u00a0567",
        "two gaps, at every third digit",
    );
    assertEquals(
        composeFigureText(-1000),
        "-1\u00a0000",
        "a sign never joins the digits behind it",
    );
    assertEquals(composeFigureText(1000.4), "1\u00a0000", "a figure is drawn as a whole number");
});

/**
 * The gap is a space that does not break, which is the whole of why a figure stays on one line.
 * Both ways round: a figure that groups carries no plain space, and one that does not group carries
 * no gap at all — a separator that stopped grouping would pass the first half on its own.
 */
Deno.test("a figure never offers a place to break, and never spaces what it should not", () => {
    assert(!composeFigureText(1000).includes(" "), "a figure that groups carries no plain space");
    assertStringIncludes(
        composeFigureText(1000),
        "\u00a0",
        "and groups on the one that does not break",
    );
    assert(!composeFigureText(999).includes(" "), "three digits are one group and stay one word");
    assert(!composeFigureText(999).includes("\u00a0"), "with no gap opened inside them");
    assert(!composeFigureText(0).includes("\u00a0"), "and zero is a digit, not a group of them");
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

Deno.test("a set of shares adds to the whole it is a share of", () => {
    // Rounded a row at a time these print 33%, 33% and 33%, which is a column that does not sum.
    const thirds = composeShareTexts([1, 1, 1], 3);
    assertEquals(getPointsFromShares(thirds), 100, "the points left over are handed out");
    assertEquals(composeShareTexts([1, 0], 1), ["100%", "0%"], "a figure of nothing takes none");
    assertEquals(composeShareTexts([1, 1], 0), ["0%", "0%"], "a whole of nothing states no share");
    // A whole holding a figure the screen does not draw: the shares are right to add to less.
    assertEquals(getPointsFromShares(composeShareTexts([1, 1], 4)), 50, "half a whole is half");
});

Deno.test("two of a figure print one share, and the column still adds up", () => {
    // The three equal figures hold the largest discarded fraction and there are only two points
    // to hand out, so the group is passed over and two smaller remainders are paid instead. Row
    // by row the first two of the three would take a point each and print 6% beside 5%.
    const tie = composeShareTexts([1, 1, 1, 2, 13], 18);
    assertEquals(tie, ["5%", "5%", "5%", "12%", "73%"], "equal figures print equal shares");
    assertEquals(getPointsFromShares(tie), 100, "and the column still comes to the whole");
    // A group that fits is paid whole: two points left, two members, both take one.
    assertEquals(composeShareTexts([1, 1, 4], 6), ["17%", "17%", "66%"], "a group that fits");
    // Three equal thirds: the group of three cannot be paid out of the one point left, so the
    // column adding up wins over the evenness and the earliest row takes it.
    const split = composeShareTexts([1, 1, 1], 3);
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
    for (const [key, words] of Object.entries(HEALTH_SOURCE_WORDS)) {
        assert(words.length > 0, `${key}: a key the table holds is worded`);
        assert(!words.includes("%"), `${key}: a hole in a sentence is not a word for a column`);
    }
});

Deno.test("a suspicion about what never arrived counts in all three Polish forms", () => {
    const lost = (count: number) => composeLostMessageSuspicion(count, count);
    assertStringIncludes(lost(1), "1 wiadomość", "one takes the first form");
    assertStringIncludes(lost(2), "2 wiadomości", "two takes the second");
    assertStringIncludes(lost(5), "5 wiadomości", "and five the third");
    // Nothing to warn about is nothing said. The empty sentence is dropped where it is drawn,
    // rather than stopping the draw it arrived in — **E14**, ADR 0051.
    assertEquals(composeLostMessageSuspicion(0, SAID_OUT_OF), "", "nothing lost is nothing to say");
});

/**
 * A count says whether a reader has to act on it only against what it is out of: two of twelve is
 * a fight nobody can trust, and two of four hundred is a number in the third decimal place.
 */
Deno.test("a suspicion states its count against what that count is out of", () => {
    assertStringIncludes(
        composeUnknownKeySuspicion(2, 412, ""),
        "2 z 412 wiadomości",
        "the count, then what it is out of",
    );
    // A denominator smaller than the count is a reading that disagrees with itself. The sentence
    // states the count alone rather than a fraction nobody can read (**E14**: it clamps in place).
    assertStringIncludes(
        composeUnknownKeySuspicion(2, 1, ""),
        "2 wiadomości",
        "and never a share bigger than one",
    );
    assert(
        !composeUnknownKeySuspicion(2, 1, "").includes(" z "),
        "which is said by leaving the denominator out, not by mending it",
    );
});

/**
 * ⚠️ **`z` and `dotyczy` govern the genitive, and a counted noun's own forms are not it.** Polish
 * takes a third form after two to four — `3 uleczenia` standing alone, `z 3 uleczeń` under `z` —
 * and the panel was writing the standing form in both places. The many form is the genitive
 * plural, and it is what every count past one takes there. **ADR 0070.**
 */
Deno.test("a count under a word governing the genitive takes the genitive", () => {
    assertStringIncludes(
        composeUnplacedHealSuspicion(1, 3, ""),
        "1 z 3 uleczeń",
        "never `3 uleczenia`, which is the form nothing governs",
    );
    assertStringIncludes(
        composeUnplacedHealSuspicion(2, 5, ""),
        "2 z 5 uleczeń",
        "and past four the two forms agree, which is what hid this",
    );
    // The same word one window over, whose own docblock always said `3 z 8 tur`.
    assertEquals(composeStandingTurnsText(1, 3), "1 z 3 tur", "never `3 tury`");
    assertEquals(composeStandingTurnsText(3, 8), "3 z 8 tur", "and the form past four is unmoved");
    // A denominator of one wants the genitive singular, which this vocabulary does not carry —
    // and says nothing the count has not, so the sentence states the count alone.
    assertStringIncludes(
        composeUnplacedHealSuspicion(1, 1, ""),
        "1 uleczenie bez podziału",
        "one out of one is one, said once",
    );
});

/**
 * A row's own sentence states its count bare, and that is not an oversight: what it would be
 * counted out of is the messages naming that person, which nothing counts. **ADR 0070.**
 */
Deno.test("a suspicion about one person states its count out of nothing", () => {
    for (const said of [composeUnknownKeyRowSuspicion(2), composeNoParameterRowSuspicion(2)]) {
        assertStringIncludes(said, "2 wiadomości bez odczytu", "the count, and straight to what");
        assert(!said.includes(`z ${SAID_OUT_OF}`), "and never out of the fight's own total");
    }
    assertStringIncludes(
        composeUnplacedHealRowSuspicion(2),
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
    assertEquals(composeChargedRowsText([], 0), "", "a gap naming nobody names nobody");
    assertEquals(
        composeChargedRowsText(["Gracz 1", "Gracz 2"], 2),
        " (Gracz 1, Gracz 2)",
        "two are read faster as names than as a number",
    );
    assertEquals(
        composeChargedRowsText(["Gracz 1", "Gracz 2", "Gracz 3"], 3),
        " (Gracz 1, Gracz 2, Gracz 3)",
        "and three is what still fits beside a count",
    );
    assertStringIncludes(
        composeChargedRowsText(["Gracz 1", "Gracz 2", "Gracz 3"], 4),
        "dotyczy 4 postaci",
        "the fourth turns the list into a count, and the names are dropped whole",
    );
    assertEquals(
        composeChargedRowsText([], 7),
        " (dotyczy 7 postaci)",
        "rows the roster could not name are counted, never guessed at",
    );
});

/**
 * The two tables the published help words, re-earned against the frozen counts: the kinds of
 * damage (**ADR 0073**) and the defences (**ADR 0077**). The client has no case label for either
 * family's keys, so the article is the only source a name could come from and an invention is
 * indistinguishable from a reading.
 *
 * ⚠️ **A count proves the article carries the word, not that it carries it as this thing's name.**
 * That half is a person's reading, the way **V1**'s citation rule is — `globalne` occurred once
 * in the article while naming a chat setting, and a reader that stopped at the count would have
 * blessed it. The register's own header draws the same line: the line states an occurrence, the
 * prose states what it means.
 */
function getWordsTheArticleDoesNotPrint(worded: Record<string, string>): string[] {
    const counts: Record<string, number> = FROZEN_HELP_PHRASES.counts;
    const unprinted: string[] = [];
    for (const word of Object.values(worded)) {
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

Deno.test("the reader knows a word the article prints from one it does not", () => {
    // The sample that must flag, so the reader is known to be looking, and the one that must not,
    // so it is known not to find too much. Both words are real: `blok` the frozen table counts,
    // `wchłonięcie` the word this repository drew until ADR 0077 and the article carries not once.
    assertEquals(
        getWordsTheArticleDoesNotPrint({ blok: "blok" }),
        [],
        "a word the frozen reading counted is one this reader passes",
    );
    assertEquals(
        getWordsTheArticleDoesNotPrint({ absorb: "wchłonięcie" }),
        ['"wchłonięcie" was never asked about'],
        "and a word nothing counted is one it flags",
    );
});

Deno.test("every word the element column draws is one the game prints", () => {
    assert(Object.values(ELEMENT_WORDS).length > 0, "the column words something");
    assertEquals(
        getWordsTheArticleDoesNotPrint(ELEMENT_WORDS),
        [],
        "a kind is drawn under the article's word for it, or under the game's own token",
    );
});

/**
 * The same for the defences, and for the same reason: the card draws these under `Zatrzymane`
 * where a player is reading the game's own vocabulary everywhere around them. **ADR 0077**
 * extends **ADR 0073**'s decision to this table; `docs/protocol-keys.md` carries the measurement
 * key by key, and `blok` is both the client's token and a word the article prints.
 */
Deno.test("every word a defence is drawn under is one the game prints", () => {
    assert(Object.values(DEFENCE_WORDS).length > 0, "the card words something");
    assertEquals(
        getWordsTheArticleDoesNotPrint(DEFENCE_WORDS),
        [],
        "a defence is drawn under the article's word for it, and never an invented one",
    );
});

Deno.test("a kind the help does not name is left out rather than invented", () => {
    assertEquals(ELEMENT_WORDS.dmgg, undefined, "the one kind no source names carries no word");
    assertEquals(getWordsForDamageKind("dmgg"), "dmgg", "and reaches a reader as the game's token");
});
