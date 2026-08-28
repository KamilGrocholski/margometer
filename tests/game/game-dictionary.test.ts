/**
 * ⚠️ **Every string below is ours, and that is the point of them.**
 *
 * The docblock here used to say so while the strings were the client's own composed
 * sentences, copied out verbatim — one of them a whole sentence with its full stop. §5
 * keeps the operator's writing out of this repository in any form and `NOTICE.md`
 * promises a reader that it is out, so a claim to that effect had to become true rather
 * than stay written down.
 *
 * **What is quoted is the shape, and the shape is all this file reads.**
 * `getLabelFromEntry` looks at four things and no others: a leading sign, a `%…%` hole,
 * a trailing full stop, and surrounding space. Every one of those is the client's
 * template syntax, quoted verbatim and dated — production build `1785244275300`, where
 * `_t` composes from `__translations` — and none of them is prose. The words between
 * them are passed through untouched, so an English placeholder exercises the same
 * branches a Polish sentence would.
 *
 * That is the line §7.5 draws from the other side, too. Its rule is that a test parsing
 * somebody else's output holds a transcript of it rather than a sample somebody typed —
 * and the output this parses is the punctuation, which is transcribed. Inventing the
 * *hole* would be the fault that rule names; keeping the sentence around it is the
 * fault §5 names.
 */

import { describe, expect, test } from "bun:test";
import { getDictionaryReader, getLabelFromEntry } from "@/src/game/game-dictionary.ts";

describe("the label inside one of the client's strings", () => {
  test("drops the sign that says which way the effect went", () => {
    expect(getLabelFromEntry("+Critical hit")).toBe("Critical hit");
    expect(getLabelFromEntry("-Evade")).toBe("Evade");
  });

  test("drops a full stop the client ends a line with", () => {
    expect(getLabelFromEntry("+Armour destroyed outright.")).toBe("Armour destroyed outright");
  });

  /**
   * ⚠️ **A sentence with the figure cut out of it is not a label.** Two shapes
   * the dictionary holds and neither survives losing its hole: one runs
   * `<verb> %val% <noun>` and comes back as a verb beside its object with the
   * number gone, and one ends on the preposition that governed the hole, which
   * is then left dangling. The panel has its own short noun for every one of
   * these, and this is what sends it there.
   */
  test("refuses a sentence with a hole in it", () => {
    expect(getLabelFromEntry("-Blocked %val% damage")).toBeNull();
    expect(getLabelFromEntry("+Armour destruction by %val%")).toBeNull();
    expect(getLabelFromEntry("%name%: %val% damage from poison.")).toBeNull();
  });

  /** The entry that is all hole and no name — `msg_+thirdatt` resolves to one. */
  test("refuses one that is nothing but a hole", () => {
    expect(getLabelFromEntry("+%val%")).toBeNull();
  });

  test("refuses one with no words in it", () => {
    expect(getLabelFromEntry("")).toBeNull();
    expect(getLabelFromEntry("+ ")).toBeNull();
    expect(getLabelFromEntry(".")).toBeNull();
  });
});

describe("asking the page for a dictionary", () => {
  test("finds none where the game is not on the page", () => {
    expect(getDictionaryReader({})).toBeNull();
    expect(getDictionaryReader({ _t: "not a function" })).toBeNull();
  });

  test("reads what the client answers", () => {
    const read = getDictionaryReader({
      _t: (id: string) => (id === "msg_+crit" ? "+Critical hit" : undefined),
    });
    expect(read).not.toBeNull();
    expect(read?.("msg_+crit")).toBe("Critical hit");
  });

  /**
   * An id the client does not know falls off the end of `_t` rather than
   * answering — development build `1781609507010`, where the miss branch queues
   * the name and returns nothing.
   */
  test("takes no answer for an answer", () => {
    const read = getDictionaryReader({ _t: () => undefined });
    expect(read?.("msg_+crit")).toBeNull();
  });

  test("takes a wrong kind of answer for one too", () => {
    const read = getDictionaryReader({ _t: () => 42 });
    expect(read?.("msg_+crit")).toBeNull();
  });

  /**
   * §9.5 catches narrowly, and this is the one failure worth catching: reaching
   * into another program's function can throw, and there is exactly one way to
   * handle it — draw our own word. What must not happen is the exception
   * travelling on, because the panel is drawn from inside a call the game made.
   */
  test("draws our own word rather than throwing the game's error onward", () => {
    const read = getDictionaryReader({
      _t: (): string => {
        // A real fault rather than a thrown Error, which §9.5 keeps out of
        // this repository: reading a torn-down page context is what this
        // actually looks like.
        return (undefined as unknown as { _t: () => string })._t();
      },
    });
    expect(() => read?.("msg_+crit")).not.toThrow();
    expect(read?.("msg_+crit")).toBeNull();
  });
});
