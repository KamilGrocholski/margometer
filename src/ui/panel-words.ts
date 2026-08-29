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
    dealtTo: "Komu",
    takenFrom: "Od kogo",
    damageKind: "Typ obrażeń",
    withoutKind: "Bez podanego typu",
} as const;

/**
 * The letter in a damage key, in the player's words. Ours, and not the client's own
 * `stat-damage-…` family, which words seven of the ten for a character sheet in a grammar this
 * column cannot take. **ADR 0011.**
 */
export const ELEMENT_WORDS: Record<string, string> = {
    dmg: "fizyczne",
    dmgd: "dystansowe",
    dmgo: "broń pomocnicza",
    dmgf: "ogień",
    dmgc: "zimno",
    dmgl: "błyskawica",
    dmga: "nieuchronne",
    dmgp: "trucizna",
    dmgg: "globalne",
    thirdatt: "trzeci atak",
};

export const COUNTED_NOUNS = {
    messages: { one: "wiadomość", few: "wiadomości", many: "wiadomości" },
    fights: { one: "walka", few: "walki", many: "walk" },
    combatants: { one: "postać", few: "postacie", many: "postaci" },
} as const;

/** A kind the table does not hold is drawn under the game's own token. **ADR 0011.** */
export function getWordsForElement(element: string): string {
    assert(element.length > 0, "a kind of damage is named");
    const words = ELEMENT_WORDS[element];
    if (words === undefined) return element;
    assert(words.length > 0, "a kind the table holds is worded");
    return words;
}

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

/**
 * Where a fight was fought, as much of it as was known: the map, the tile, or both. Null where
 * none of it was — an empty pair of brackets states a place, and nothing was stated.
 */
export function composePlaceWords(
    mapName: string | null,
    x: number | null,
    y: number | null,
): string | null {
    assert(mapName === null || mapName.length > 0, "a map that was named says something");
    const tile = x === null || y === null ? null : `(${x}, ${y})`;
    if (mapName === null) return tile;
    if (tile === null) return mapName;
    assert(tile.length > 0, "a tile that was read is written out");
    return `${mapName} ${tile}`;
}
