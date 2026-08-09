/**
 * Assertions: things that must never happen.
 *
 * This is a different category from the errors in `MargoMeterError` and
 * `MargoMeterToolError`, and the difference is the reason it lives outside both
 * hierarchies. Those describe failures we know CAN happen — bad material, a
 * changed protocol, a failed bundle — so they carry a `code`, because a code
 * exists for someone to recognise and handle the failure.
 *
 * A broken assertion has no code, because nobody handles it. The only correct
 * response is to fix the program. A code here would promise a reaction that
 * does not exist.
 *
 * Falling out of that: a `catch` testing `instanceof MargoMeterError` will not
 * treat a broken assertion as a domain failure, because it is not one. It
 * travels upwards instead of being turned into a wrong number further down.
 *
 * Where it broke comes from the stack — exact file and line, more than any
 * label could say — and from a message that names the invariant.
 */

export class AssertionFailure extends Error {
  constructor(message: string) {
    super(message);
    // Branded because the add-on shares a console with the game.
    this.name = "MargoMeter/Assertion";
  }
}

export function assert(condition: unknown, invariant: string): asserts condition {
  if (!condition) throw new AssertionFailure(invariant);
}

/**
 * Narrows away `null` and `undefined`, and nothing else: `0` and `""` pass.
 * A truthiness check here would reject values the caller meant to allow.
 */
export function assertDefined<Value>(
  value: Value | null | undefined,
  invariant: string,
): Value {
  if (value === null || value === undefined) throw new AssertionFailure(invariant);
  return value;
}
