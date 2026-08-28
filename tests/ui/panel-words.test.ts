/**
 * What the reader reads, held to what it must never say.
 *
 * Reading a sentence back from the module that wrote it would hold the two to be the same and
 * neither to be right, so nothing here compares a word to itself. What is checked is the two
 * things a sentence can be wrong about whatever it says: that it carries none of our vocabulary
 * and no key of the game's, and that a count is spelled the way Polish spells one.
 */

import { assert, assertEquals } from "@std/assert";
import {
    composeCountedNoun,
    composePlaceWords,
    COUNTED_NOUNS,
    PANEL_WORDS,
} from "@/src/ui/panel-words.ts";

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
