/**
 * Where a run of characters of one kind stops.
 *
 * Arrived at the second consumer, which is §7.1's rule: `libs/number.ts` and
 * `libs/timestamp.ts` both read a fixed shape out of text, and both had written
 * the same walk. It is a walk rather than a pattern because this repository
 * stopped spelling patterns — and what replaces one has to be spelled once, or
 * it is the drift `libs/running-total.ts` was extracted to stop.
 *
 * One hazard decides the shape of everything here. Reading past the end of a
 * string is not an error in JavaScript: `charAt` answers `""` and `charCodeAt`
 * answers `NaN`, and a comparison against either is quietly false. Both are a
 * value nobody wrote (§9.5). So every read below is guarded by its index first,
 * and the end of the text is a branch rather than a comparison that happens to
 * fail.
 *
 * The classes are code-unit ranges, which is exactly what a pattern's `\d` was:
 * the ASCII digits, not a locale's idea of a digit.
 */

/** One ASCII digit at `index`. False past either end. */
export function isDigitAt(text: string, index: number): boolean {
  const character = text[index];
  return character !== undefined && character >= "0" && character <= "9";
}

/** One hexadecimal digit at `index`, either case. False past either end. */
export function isHexadecimalDigitAt(text: string, index: number): boolean {
  const character = text[index];
  if (character === undefined) return false;
  return (
    (character >= "0" && character <= "9") ||
    (character >= "a" && character <= "f") ||
    (character >= "A" && character <= "F")
  );
}

/**
 * Where the digits starting at `start` stop — `start` itself when there are
 * none, so a caller tells "no digits" from "some" by comparing, and never by a
 * count it has to keep.
 */
export function getEndOfDigits(text: string, start: number): number {
  let index = start;
  while (isDigitAt(text, index)) index += 1;
  return index;
}

/**
 * At least `count` digits at `start`.
 *
 * A longer run is deliberately **not** refused, because only the caller knows
 * whether a fifth digit is a fault or the next field. Every caller states what
 * follows the run — a separator, or the end of the text — and it is that check
 * beside this one that makes a shape total. Refusing here instead would answer
 * the same for `2026` and `20261`, and one of those is a year.
 */
export function hasDigitsAt(text: string, start: number, count: number): boolean {
  return getEndOfDigits(text, start) >= start + count;
}

/** One letter or digit at `index`, either case. False past either end. */
export function isAlphanumericAt(text: string, index: number): boolean {
  const character = text[index];
  if (character === undefined) return false;
  return (
    (character >= "0" && character <= "9") ||
    (character >= "a" && character <= "z") ||
    (character >= "A" && character <= "Z")
  );
}

/** Where the letters and digits starting at `start` stop. */
export function getEndOfAlphanumerics(text: string, start: number): number {
  let index = start;
  while (isAlphanumericAt(text, index)) index += 1;
  return index;
}

/**
 * Every code point JavaScript's `\s` matches, written out.
 *
 * The exotic ones are here rather than trimmed to the four anybody types,
 * because this stands in for `\s` in a reader over **somebody else's** source
 * (`src/core/game-build.ts`, over a page the game serves). Narrowing the class
 * would make the reader answer differently from the pattern it replaced, on
 * input nobody here controls — and the whole point of replacing it is that the
 * answer does not change.
 */
const WHITESPACE =
  " \t\n\r\v\f          " +
  "       　﻿";

/** One whitespace character at `index`. False past either end. */
export function isWhitespaceAt(text: string, index: number): boolean {
  const character = text[index];
  return character !== undefined && WHITESPACE.includes(character);
}

/** Where the whitespace starting at `start` stops. */
export function getEndOfWhitespace(text: string, start: number): number {
  let index = start;
  while (isWhitespaceAt(text, index)) index += 1;
  return index;
}

/** One letter, digit or underscore at `index` — a pattern's `\w`. */
export function isWordCharacterAt(text: string, index: number): boolean {
  return isAlphanumericAt(text, index) || text[index] === "_";
}

/** Where the word characters starting at `start` stop. */
export function getEndOfWordCharacters(text: string, start: number): number {
  let index = start;
  while (isWordCharacterAt(text, index)) index += 1;
  return index;
}

/**
 * Whether a word begins at `start` — nothing before it that a word could
 * continue from. A pattern's `\b` before a word character, for the callers that
 * need it.
 */
export function isWordStart(text: string, start: number): boolean {
  return start === 0 || !isWordCharacterAt(text, start - 1);
}

/**
 * Whether every character of `text` comes from `characters`, and there is at
 * least one.
 *
 * The whole-string half of what the classes above answer one character at a
 * time, and it exists because a caller checking a shape usually wants a class
 * this file does not name — lower-case hexadecimal, the letters of one alphabet,
 * the digits of a version. Stating the set at the call site keeps that class
 * where the reason for it is.
 *
 * Empty is false, not true: a caller asking whether text is made of digits is
 * asking whether it is a number, and no digits is no number.
 */
export function isEveryCharacterIn(text: string, characters: string): boolean {
  if (text.length === 0) return false;
  for (const character of text) {
    if (!characters.includes(character)) return false;
  }
  return true;
}
