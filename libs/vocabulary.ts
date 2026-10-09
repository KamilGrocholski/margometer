/** The type a vocabulary object derives, and the check a string from outside takes (N18). */

import { assert } from "@std/assert/assert";

export type VocabularyWord<Vocabulary extends Readonly<Record<string, string>>> =
    Vocabulary[keyof Vocabulary];

export function isOneOf<const Words extends readonly string[]>(
    words: Words,
    candidate: unknown,
): candidate is Words[number] {
    assert(words.length > 0, "a vocabulary holds at least one word");
    if (typeof candidate !== "string") return false;
    return words.includes(candidate);
}
