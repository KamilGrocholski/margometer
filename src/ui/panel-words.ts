/**
 * Everything the reader reads, and the only Polish in `src/`.
 *
 * A sentence here never carries our vocabulary or a key of the game's: the reader is told what
 * cannot be known, never why this reader could not read it. Identifiers around the sentences stay
 * English, which is what keeps the boundary visible in one file.
 *
 * A count is spelled the way Polish spells it — three ways — and that belongs here rather than to
 * a formatter, because which way is a fact about the language and not about the number.
 */

import { assert } from "@std/assert";

/** The three shapes a Polish noun takes after a number. */
export interface CountedNoun {
    one: string;
    few: string;
    many: string;
}

export const PANEL_WORDS = {
    title: "MargoMeter",
    damageDealt: "Obrażenia zadane",
    damageTaken: "Obrażenia otrzymane",
    damageRaw: "Przed redukcją",
    damageApplied: "Po redukcji",
    prevented: "Zatrzymane przez obronę",
    healthRestored: "Przywrócone życie",
    withoutActor: "Bez sprawcy",
    withoutTarget: "Bez celu",
    unknown: "Nie wiadomo",
    nothingYet: "Jeszcze nic się nie wydarzyło",
    fights: "Walki",
    everyone: "Wszyscy",
    shelfEmpty: "Nie ma jeszcze zapisanych walk",
    fightOver: "Walka skończona",
    suspect: "Ta liczba może być zaniżona",
    undrawn: "Tego nie udało się narysować",
} as const;

export const COUNTED_NOUNS = {
    messages: { one: "wiadomość", few: "wiadomości", many: "wiadomości" },
    fights: { one: "walka", few: "walki", many: "walk" },
    combatants: { one: "postać", few: "postacie", many: "postaci" },
} as const;

const TEEN_FLOOR = 12;
const TEEN_CEILING = 14;
const FEW_FLOOR = 2;
const FEW_CEILING = 4;
const TEN = 10;
const HUNDRED = 100;

/**
 * One, a few, or many: Polish picks by the last digit, except in the teens, where it picks many
 * whatever that digit is. Twenty-two takes the few form and twelve does not.
 */
export function composeCountedNoun(count: number, noun: CountedNoun): string {
    assert(Number.isSafeInteger(count), "a count is a whole number");
    assert(count >= 0, "a count is never below nothing");
    if (count === 1) return `1 ${noun.one}`;
    const lastTwo = count % HUNDRED;
    const last = count % TEN;
    if (lastTwo >= TEEN_FLOOR && lastTwo <= TEEN_CEILING) return `${count} ${noun.many}`;
    if (last >= FEW_FLOOR && last <= FEW_CEILING) return `${count} ${noun.few}`;
    return `${count} ${noun.many}`;
}
