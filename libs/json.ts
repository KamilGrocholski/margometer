/**
 * `JSON.parse` with its `try`/`catch` in one place, and its `any` gone.
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
