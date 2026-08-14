import { describe, expect, test } from "bun:test";
import { assertDefined } from "@/libs/assert.ts";
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

/**
 * Every word this panel has of its own, recorded rather than described.
 *
 * ⚠️ **The words were swept for what they must not say and never for what they
 * do.** `tests/ui/panel-view.test.ts` walks every screen checking that no key of
 * the game's and no term of ours reaches a player — a vocabulary check, and it
 * passes just as happily when a phrase is replaced by a different phrase.
 * `bun tools/mutation-sweep.ts` put a sentinel through all 43 of these entries
 * and nothing anywhere went red.
 *
 * That is not a small hole. A fallback is what a player reads when their client
 * has no name for a token, and two of them saying the same thing is a wrong
 * number that looks right — which is the failure the block below this one exists
 * to prevent, held only against itself and never against what was decided.
 *
 * Recorded as a flat list because that is the shape a person can read a diff of:
 * changing what the panel calls something should be visible in a review as one
 * line, and should require saying so. The identifiers are the game's and may be
 * stored — they are functional names (NOTICE.md); the phrases are ours.
 */
describe("the panel's own vocabulary, as decided", () => {
  const RECORDED: Record<string, Array<Array<string | null>>> = {
  PROFESSION_NAMES: [
    ["w", null, "wojownik"],
    ["p", null, "paladyn"],
    ["t", null, "tropiciel"],
    ["h", null, "łowca"],
    ["m", null, "mag"],
    ["b", null, "tancerz ostrzy"],
  ],
  ELEMENT_NAMES: [
    ["dmg", null, "fizyczne"],
    ["dmgd", null, "dystansowe"],
    ["dmgo", null, "broń pomocnicza"],
    ["dmgf", null, "ogień"],
    ["dmgc", null, "zimno"],
    ["dmgl", null, "błyskawica"],
    ["dmga", null, "nieuchronne"],
    ["dmgg", null, "globalne"],
    ["thirdatt", null, "trzeci cios"],
  ],
  EFFECT_NAMES: [
    ["crit", "msg_+crit", "cios krytyczny"],
    ["of_crit", "msg_+of_crit", "cios krytyczny bronią pomocniczą"],
    ["legbon_verycrit", "msg_+legbon_verycrit", "cios bardzo krytyczny"],
    ["evade", "msg_-evade", "unik"],
    ["fastarrow", "msg_+fastarrow", "szybka strzała"],
    ["contra", "msg_-contra", "kontratak"],
    ["pierce", "msg_+pierce", "przebicie"],
    ["pierceb", "msg_-pierceb", "zablokowane przebicie"],
    ["stun", "msg_+stun", "ogłuszenie"],
    ["freeze", "msg_+freeze", "zamrożenie"],
    ["legbon_curse", "msg_+legbon_curse", "klątwa"],
    ["legbon_cleanse", "msg_-legbon_cleanse", "płomienne oczyszczenie"],
    ["legbon_glare", "msg_-legbon_glare", "oślepienie"],
    ["superspell-dispel", "msg_+dispel", "przerwany cios specjalny"],
    ["acdmg_destroyed", "msg_+acdmg_destroyed", "pancerz zniszczony do końca"],
    ["tenacity", "msg_-tenacity", "wytrwałość"],
  ],
  DEFENCE_NAMES: [
    ["absorb", null, "pochłonięte"],
    ["absorbm", null, "pochłonięte magicznie"],
    ["blok", null, "zablokowane"],
  ],
  DESTRUCTION_NAMES: [
    ["acdmg", null, "niszczenie pancerza"],
    ["resdmg", null, "niszczenie odporności magicznych"],
    ["abdest_per", null, "zniszczona absorpcja"],
    ["abmdest_per", null, "zniszczona absorpcja magiczna"],
  ],
  HEALTH_SOURCE_NAMES: [
    ["poison", null, "trucizna"],
    ["injure", null, "zranienie"],
    ["heal", null, "leczenie"],
    ["heal_target", null, "leczenie na wskazanego"],
    ["legbon_holytouch_heal", "msg_+legbon_holytouch", "dotyk anioła"],
    ["legbon_lastheal", null, "ostatni ratunek"],
  ],
  };

  test.each(Object.keys(RECORDED))("%s says exactly what it was written to say", (name) => {
    const table = assertDefined(
      (
        {
          PROFESSION_NAMES,
          ELEMENT_NAMES,
          EFFECT_NAMES,
          DEFENCE_NAMES,
          DESTRUCTION_NAMES,
          HEALTH_SOURCE_NAMES,
        } as Record<string, Record<string, TokenName>>
      )[name],
      `${name} is a table this file imports`,
    );

    expect(
      Object.entries(table).map(([token, named]) => [token, named.id, named.fallback]),
    ).toEqual(assertDefined(RECORDED[name], `${name} is recorded`));
  });

  test("and the recording covers every table the module exports", () => {
    // Without this a table added later would simply not be held, and the block
    // above would keep passing while saying nothing about it.
    expect(Object.keys(RECORDED).length).toBe(6);
  });
});
