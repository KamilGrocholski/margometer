/**
 * A closed set of our own strings is an object, with its type and its list derived from it
 * (`AGENTS.md` N18, ADR 0001); only a string arriving from outside is asked about here.
 */

import { assert } from "@std/assert/assert";

export type VocabularyWord<Vocabulary extends Readonly<Record<string, string>>> =
    Vocabulary[keyof Vocabulary];

export function isOneOf<const Words extends readonly string[]>(
    words: Words,
    value: unknown,
): value is Words[number] {
    assert(words.length > 0, "a vocabulary holds at least one word");
    if (typeof value !== "string") return false;
    return words.includes(value);
}
