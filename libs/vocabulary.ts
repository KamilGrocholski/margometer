/**
 * A closed set of our own strings (`AGENTS.md` N18): an object whose keys are the names code uses
 * and whose values are what reaches a console or a file, with its type derived from it and its
 * list, where one is wanted, from `Object.values`.
 *
 * A string arriving from outside is asked about here; one our own code wrote is the compiler's.
 */

import { assert } from "@std/assert/assert";

/** The words of a vocabulary object, as a type. */
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
