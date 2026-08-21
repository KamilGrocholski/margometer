/**
 * JSON both ways, and the two answers a bare `JSON.parse` cannot give.
 *
 * Reading hands back the value **or** the `SyntaxError`, never a bare `null` — a
 * document that says `null` and a document that will not parse are different
 * things, and every caller here has to tell them apart (§9.5). Writing refuses a
 * value JSON cannot hold rather than dropping it silently, which is what
 * `JSON.stringify` does to a function and to `undefined`.
 */

import { describe, expect, test } from "bun:test";
import { composeJsonText, getValueFromJsonText } from "@/libs/json.ts";

describe("writing a value as JSON", () => {
  /**
   * ⚠️ **Which branch runs is what an indent decides, and nothing said so.**
   * `indent === undefined` chooses between the one-argument `JSON.stringify` and
   * the three-argument one; inverted, a value asked for two spaces came back on
   * one line, and the only reader that asks is the report a player pastes into an
   * issue (`src/userscript-entry.ts`).
   */
  test("indents where an indent was asked for, and not where it was not", () => {
    expect(composeJsonText({ a: 1 }, 2)).toBe('{\n  "a": 1\n}');
    expect(composeJsonText({ a: 1 })).toBe('{"a":1}');
  });
});

describe("reading JSON text", () => {
  test("a reading carries the value and no error", () => {
    expect(getValueFromJsonText('{"a":1}')).toEqual({ value: { a: 1 }, syntaxError: null });
  });

  // The reason this returns a reading rather than a bare null: the engine's
  // error names what it choked on, and that is the only useful part of the
  // failure. A caller has to be able to put it in `cause`.
  //
  // Checked by what the message says, not by its type: an error we composed
  // ourselves would also be a SyntaxError, and the first version of this test
  // passed while the original was being thrown away.
  test("a failure carries the error the engine raised, not the fact of failing", () => {
    const reading = getValueFromJsonText("nope");
    expect(reading.value).toBeNull();
    expect(reading.syntaxError).toBeInstanceOf(SyntaxError);
    expect(reading.syntaxError?.message).toContain("nope");
  });

  test("two different failures do not read as the same failure", () => {
    expect(getValueFromJsonText("{oops").syntaxError?.message).not.toBe(
      getValueFromJsonText("[1,]").syntaxError?.message,
    );
  });

  // `JSON.parse("")` throws where `Number("")` would have answered 0 — the two
  // boundaries fail differently, and this pins which is which.
  test.each(["", " ", "undefined", "{", "[1,]"])("%p does not read as a value", (text) => {
    expect(getValueFromJsonText(text).syntaxError).toBeInstanceOf(SyntaxError);
  });

  // `null` is a value JSON can state, and it is not the same as unreadable text.
  test("a stated null is a reading, not a failure", () => {
    expect(getValueFromJsonText("null")).toEqual({ value: null, syntaxError: null });
  });

  // The type is the other half of the point: `JSON.parse` hands back `any`, and
  // `unknown` is what forces the field-by-field reading that follows.
  test("what comes back is unknown, not a shape the caller may assume", () => {
    const { value } = getValueFromJsonText('{"a":1}');
    expect(typeof value).toBe("object");
  });
});
