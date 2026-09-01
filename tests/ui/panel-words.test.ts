/**
 * What the reader reads, held to what it must never say.
 *
 * Reading a sentence back from the module that wrote it would hold the two to be the same and
 * neither to be right, so nothing here compares a word to itself. What is checked is the two
 * things a sentence can be wrong about whatever it says: that it carries none of our vocabulary
 * and no key of the game's, and that a count is spelled the way Polish spells one.
 */

import { assert, assertEquals, AssertionError, assertThrows } from "@std/assert";
import {
    composeCountedNoun,
    composeFigureText,
    composeJoinedInProgressWarning,
    composeLostMessageWarning,
    composePlaceWords,
    composeShareText,
    composeShareTexts,
    composeUnplacedHealWarning,
    composeUnreadWarning,
    COUNTED_NOUNS,
    getWordsForHealthSource,
    getWordsForPinnedScope,
    getWordsForPinnedStanding,
    getWordsForUnnamedEnd,
    HEALTH_SOURCE_WORDS,
    NEITHER_END_WORDS,
    PANEL_WORDS,
} from "@/src/ui/panel-words.ts";
import { type PanelUnnamedEnd, PINNED_CASES } from "@/src/ui/panel-reading.ts";

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
/** Keys the game chose. A reader is told what happened, never what it arrived under. */
const GAME_KEYS = ["dmg", "tspell", "skillid", "healall_per", "legbon", "oth_dmg", "endbattle"];

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
    // The four a doubt is said in. They are composed rather than declared, so a table of the
    // panel's words does not reach them and the guards below would read past every one.
    found.push(composeJoinedInProgressWarning());
    for (const count of [1, 2, 5]) {
        found.push(composeLostMessageWarning(count));
        found.push(composeUnreadWarning(count));
        found.push(composeUnplacedHealWarning(count));
    }
    return found;
}

Deno.test("every word the panel says says something", () => {
    const sentences = getSentences();
    assert(sentences.length > 10, "the panel has words to say");
    for (const sentence of sentences) {
        assert(sentence.length > 0, "an empty sentence is not a word");
        assertEquals(sentence.trim(), sentence, `${sentence} carries space it does not need`);
    }
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
    const wrong: string[] = [];
    for (const sentence of getSentences()) {
        for (const key of GAME_KEYS) {
            if (sentence.toLowerCase().includes(key)) wrong.push(`${sentence} says ${key}`);
        }
    }
    assertEquals(wrong, [], "a key is how a message was assembled, not what happened in a fight");
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
    assertThrows(() => composeShareText(1.5), AssertionError, "more than the whole");
    assertThrows(() => composeShareText(-1), AssertionError, "below nothing");
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
    assert(composeFigureText(1000).includes("\u00a0"), "and groups on the one that does not break");
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

Deno.test("a doubt about what never arrived counts in all three Polish forms", () => {
    assert(composeLostMessageWarning(1).includes("1 wiadomość"), "one takes the first form");
    assert(composeLostMessageWarning(2).includes("2 wiadomości"), "two takes the second");
    assert(composeLostMessageWarning(5).includes("5 wiadomości"), "and five the third");
    assertThrows(() => composeLostMessageWarning(0), AssertionError, "said because something");
});
