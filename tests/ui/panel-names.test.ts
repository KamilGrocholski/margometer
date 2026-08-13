import { describe, expect, test } from "bun:test";
import {
  DEFENCE_NAMES,
  DESTRUCTION_NAMES,
  EFFECT_NAMES,
  ELEMENT_NAMES,
  getPhrase,
  HEALTH_SOURCE_NAMES,
  PROFESSION_NAMES,
  type TokenName,
} from "@/src/ui/panel-names.ts";

const VOCABULARY: Array<[string, Record<string, TokenName>]> = [
  ["professions", PROFESSION_NAMES],
  ["elements", ELEMENT_NAMES],
  ["effects", EFFECT_NAMES],
  ["defences", DEFENCE_NAMES],
  ["destructions", DESTRUCTION_NAMES],
  ["health sources", HEALTH_SOURCE_NAMES],
];

const EVERY_NAME: Array<[string, string, TokenName]> = VOCABULARY.flatMap(([family, names]) =>
  Object.entries(names).map(([token, name]): [string, string, TokenName] => [family, token, name]),
);

describe("the panel's vocabulary", () => {
  test("holds names", () => {
    expect(EVERY_NAME.length).toBeGreaterThan(0);
  });

  /**
   * ⚠️ **Two quantities under one label is a wrong number that looks right.**
   * `acdmg` — armour destroyed, in points — and `acdmg_destroyed` — armour gone
   * altogether, no figure at all — both read "zniszczony pancerz", one above the
   * other in the same tooltip. Nothing in the drawing could tell them apart and
   * nothing was going to notice.
   */
  test("says each thing differently from every other thing", () => {
    const said = new Map<string, string>();
    for (const [family, token, name] of EVERY_NAME) {
      const seen = said.get(name.fallback);
      expect(seen, `${family}/${token} says the same as ${seen}`).toBeUndefined();
      said.set(name.fallback, `${family}/${token}`);
    }
  });

  /** The same, one layer down: two tokens on one id draw one word at run time. */
  test("asks the client a different question for each of them", () => {
    const asked = new Map<string, string>();
    for (const [family, token, name] of EVERY_NAME) {
      if (name.id === null) continue;
      const seen = asked.get(name.id);
      expect(seen, `${family}/${token} asks what ${seen} asks`).toBeUndefined();
      asked.set(name.id, `${family}/${token}`);
    }
  });

  test("asks it by an identifier and never by a sentence", () => {
    for (const [family, token, name] of EVERY_NAME) {
      if (name.id === null) continue;
      expect(name.id, `${family}/${token}`).toMatch(/^msg_[^%]*(%[a-z0-9]+%)?$/);
    }
  });

  test("has a phrase of its own for every one of them", () => {
    for (const [family, token, name] of EVERY_NAME) {
      expect(name.fallback, `${family}/${token}`).not.toBe("");
      expect(name.fallback, `${family}/${token}`).not.toContain("%");
    }
  });
});

describe("naming one token", () => {
  const getStatedName = (id: string): string | null =>
    id === "msg_+crit" ? "Cios krytyczny" : null;

  test("says what the client says, over what we would have said", () => {
    expect(getPhrase(EFFECT_NAMES, "crit", getStatedName)).toBe("Cios krytyczny");
    expect(getPhrase(EFFECT_NAMES, "crit", null)).toBe("cios krytyczny");
  });

  test("says our own where the client has no answer", () => {
    expect(getPhrase(EFFECT_NAMES, "pierce", getStatedName)).toBe("przebicie");
  });

  /**
   * Not a micro-optimisation: asking about an id we know is absent makes the
   * game queue a missing-translation record, which is work it does because we
   * asked (`src/game/game-dictionary.ts`).
   */
  test("does not ask about a token the client has no name for", () => {
    const asked: string[] = [];
    const getAskedName = (id: string): string | null => {
      asked.push(id);
      return "coś";
    };
    expect(getPhrase(ELEMENT_NAMES, "dmgf", getAskedName)).toBe("ogień");
    expect(asked).toEqual([]);
  });

  /**
   * The rung under both, and the reason this is one function: a token nobody has
   * named still draws, as the game wrote it. Ugly and true beats a row that
   * vanished or one that says "nieznane" over a real figure.
   */
  test("says the token itself for one nobody has named", () => {
    expect(getPhrase(EFFECT_NAMES, "somethingNew", getStatedName)).toBe("somethingNew");
  });
});
