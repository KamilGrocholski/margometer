/**
 * JSON in both directions, with `JSON.parse`'s `try`/`catch` in one place and
 * its `any` gone.
 *
 * Two things go wrong at this boundary, and both are silent. The type is `any`,
 * which accepts every use without complaint, so a field the file does not carry
 * surfaces as `undefined` a layer later, where what produced it is no longer
 * visible — this returns `unknown` instead and makes the caller ask. And the
 * failure is an exception, so every reader writes its own `try`/`catch`, and a
 * bare one swallows more than a syntax error.
 *
 * What a failure means is still the caller's to decide, so nothing is thrown
 * from here. Material handed to a tool gets a thrown, branded error; a live
 * message becomes an explicit unknown.
 */

import { assert } from "@/libs/assert.ts";

/**
 * A reading, not a value. `JSON.parse` states which byte it choked on, and that
 * is the only useful part of the failure — returning a bare `null` would throw
 * it away, and the caller could no longer put it in `cause` where it belongs.
 */
export type JsonReading =
  | { value: unknown; syntaxError: null }
  | { value: null; syntaxError: SyntaxError };

export function getValueFromJsonText(text: string): JsonReading {
  try {
    return { value: JSON.parse(text), syntaxError: null };
  } catch (error) {
    // Narrow, like every other catch here: `JSON.parse` fails one way, and a
    // bare catch would report an out-of-memory on a huge file as malformed text.
    if (!(error instanceof SyntaxError)) throw error;
    return { value: null, syntaxError: error };
  }
}

/**
 * A value as JSON text, or a broken invariant.
 *
 * ⚠️ **`JSON.stringify` does not always answer with a string.** For `undefined`, a
 * function or a symbol it answers `undefined` — the value, not the text — and the
 * return type says `string` regardless. It also turns `NaN` and `±Infinity` into `null`
 * on the way through. Both are the criterion §9.5 admits a primitive on, and the tree
 * held three uncoordinated answers to it: one caller refusing it and writing JSON by
 * hand with the trap spelled out, one writing `value ?? null` in defence without saying
 * so, and two using it bare — one of those composing the identity key that decides
 * whether a combatant snapshot changed.
 *
 * Writing asserts rather than returning null, which is §9.5's split: the value being
 * written is one we produced, so a value with no JSON is this program being wrong
 * rather than a failure a caller could handle.
 *
 * ⚠️ **It does not promise a round trip.** A `NaN` inside the value still writes as
 * `null` and still reads back as `null`; nothing here can see that without walking the
 * whole value. Where the round trip is what matters — a position restored from storage
 * — the writer is still hand-written, and says so.
 */
export function composeJsonText(value: unknown, indent?: number): string {
  const text = indent === undefined ? JSON.stringify(value) : JSON.stringify(value, null, indent);
  assert(typeof text === "string", "a value written as JSON has JSON to write");
  return text;
}
