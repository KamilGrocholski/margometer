/**
 * Narrowing an unknown value to something with keys.
 *
 * `typeof value === "object"` is true for `null`, which is a value nobody wrote
 * — the criterion AGENTS.md §9.5 admits a primitive on. Every caller therefore
 * writes the `null` check beside it, and the repository had thirteen copies of
 * that pair in ten files before this existed.
 *
 * **Two readers, because there are two questions**, and thirteen call sites had
 * silently answered them both ways: eight admitted an array as a record, five
 * refused one. Neither group is wrong. Reading `warriorsList` off the live
 * client wants an array admitted — the game is free to send either, and
 * `Object.values` reads both — while a position restored from storage or a field
 * out of a captured dump wants a list refused, because a list arriving where an
 * object belongs is the file being wrong rather than the shape being loose.
 *
 * What was missing was anybody choosing per site. Now the name says which, and
 * `tests/tools/source-layout.test.ts` holds the spelling to this file.
 */

/**
 * Anything with string keys, an array included — an array has them.
 *
 * The cast is the whole point of the function: it is made once, here, after the
 * only two checks that make it true.
 */
export function getRecordOrArrayFromValue(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) return null;
  return value as Record<string, unknown>;
}

/** The same, refusing a list. */
export function getRecordFromValue(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return null;
  return getRecordOrArrayFromValue(value);
}
