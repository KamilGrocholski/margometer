import { describe, expect, test } from "bun:test";
import { getDictionaryReader, getLabelFromEntry } from "@/src/game/game-dictionary.ts";

/**
 * The shapes below are the shapes the client's dictionary actually holds, read
 * on production build `1785244275300` — one per kind, not one per entry, and
 * written out here as the pattern rather than as the game's own sentences: what
 * is being checked is what this file does to a string, and a made-up string
 * proves that as well as a real one would.
 */
describe("the label inside one of the client's strings", () => {
  test("drops the sign that says which way the effect went", () => {
    expect(getLabelFromEntry("+Cios krytyczny")).toBe("Cios krytyczny");
    expect(getLabelFromEntry("-Unik")).toBe("Unik");
  });

  test("drops a full stop the client ends a line with", () => {
    expect(getLabelFromEntry("+Zniszczono pancerz przeciwnika.")).toBe(
      "Zniszczono pancerz przeciwnika",
    );
  });

  /**
   * ⚠️ **A sentence with the figure cut out of it is not a label.** Left in,
   * `-Zablokowanie %val% obrażeń` draws as "Zablokowanie obrażeń" and
   * `+Niszczenie pancerza o %val%` as a dangling preposition. The panel has its
   * own short noun for every one of these, and this is what sends it there.
   */
  test("refuses a sentence with a hole in it", () => {
    expect(getLabelFromEntry("-Zablokowanie %val% obrażeń")).toBeNull();
    expect(getLabelFromEntry("+Niszczenie pancerza o %val%")).toBeNull();
    expect(getLabelFromEntry("%name%: %val% obrażeń od trucizny.")).toBeNull();
  });

  /** The entry that is all hole and no name — `msg_+thirdatt %val%` is `+%val%`. */
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
    const read = getDictionaryReader({ _t: (id: string) => (id === "msg_+crit" ? "+Cios krytyczny" : undefined) });
    expect(read).not.toBeNull();
    expect(read?.("msg_+crit")).toBe("Cios krytyczny");
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
