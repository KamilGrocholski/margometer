/**
 * The purity N2's table in `AGENTS.md` states for each verb, and the prefixes N8 opens a predicate
 * with, read off the rules themselves so the guards of S4 and P1 never spell the table again.
 */

import { assert } from "@std/assert";
import { isOneOf, type VocabularyWord } from "#/libs/vocabulary.ts";

export const PURITY = { strong: "strong", weak: "weak", none: "none", either: "either" } as const;
export type Purity = VocabularyWord<typeof PURITY>;
const PURITIES = Object.values(PURITY);

export const RULES_PATH = "AGENTS.md";
const VERB_ROW_OPENER = "  | `";
const CELL_SEPARATOR = "|";
const ALTERNATIVE_SEPARATOR = " / ";
const QUOTE = "`";
const PREDICATE_RULE_OPENER = "- **N8.**";
const PREDICATE_RULE_CLOSER = "- **N9.**";

/** Each verb the rules name, and the purity they state for it. */
export function readVerbPurities(rules: string): Map<string, Purity> {
    const purities = new Map<string, Purity>();
    const lines = rules.split("\n");
    for (const line of lines) {
        if (!line.startsWith(VERB_ROW_OPENER)) continue;
        const cells = line.split(CELL_SEPARATOR).map((cell) => cell.trim());
        const verbs = cells[1]!.split(ALTERNATIVE_SEPARATOR).map(readQuoted);
        const stated = cells[3]!.split(ALTERNATIVE_SEPARATOR);
        const isShared = stated.length === 1;
        assert(isShared || verbs.length === stated.length, `${cells[1]} states each a purity`);
        for (let index = 0; index < verbs.length; index += 1) {
            const purity = isShared ? stated[0] : stated[index];
            assert(isOneOf(PURITIES, purity), `${verbs[index]} states a purity N2 names`);
            purities.set(verbs[index]!, purity);
        }
    }
    const opener = lines.findIndex((line) => line.startsWith(PREDICATE_RULE_OPENER));
    assert(opener !== -1, "the rules name the prefixes of a predicate");
    for (const line of lines.slice(opener)) {
        if (line.startsWith(PREDICATE_RULE_CLOSER)) break;
        const words = line.split(QUOTE).filter((_, index) => index % 2 === 1);
        for (const word of words) purities.set(word, PURITY.strong);
    }
    return purities;
}

function readQuoted(cell: string): string {
    assert(cell.startsWith(QUOTE), `${cell} names a verb in code`);
    return cell.slice(QUOTE.length, cell.lastIndexOf(QUOTE));
}

/** A function's verb: the lower-case run its name opens with. */
export function readVerb(name: string): string {
    let end = 0;
    for (const character of name) {
        if (character !== character.toLowerCase()) break;
        end += character.length;
    }
    return name.slice(0, end);
}
