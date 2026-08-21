import { describe, expect, test } from "bun:test";
import { assertDefined } from "@/libs/assert.ts";
import {
  composeFigureText,
  composeShareText,
  CRITICAL_EFFECT_TOKENS,
  CRITICAL_TOKEN,
  DEFENCE_NAMES,
  DESTRUCTION_NAMES,
  EFFECT_NAMES,
  ELEMENT_NAMES,
  getMissingCounterpart,
  getNeitherEndLeftover,
  getNoActorBreakdownHeading,
  getNoActorLimitNote,
  getNoActorScopeNote,
  getNoActorStandingNote,
  getNoTargetBreakdownHeading,
  getNoTargetLimitNote,
  getNoTargetScopeNote,
  getNoTargetStandingNote,
  getPhrase,
  HEALTH_GAIN_SOURCE_NAMES,
  HEALTH_LOSS_SOURCE_NAMES,
  NO_ACTOR_LABEL,
  NO_TARGET_LABEL,
  PERCENT_DESTRUCTION_TOKEN,
  PROFESSION_NAMES,
  VERY_CRITICAL_TOKEN,
  type TokenName,
} from "@/src/ui/panel-words.ts";
import { getMetricNoun, isGivenMetric, PANEL_METRICS } from "@/src/ui/panel-screen.ts";
import { CAPTURED_FIGHTS, composeStatisticsOfFight } from "@/tests/captured-fight-catalog.ts";

const VOCABULARY: Array<[string, Record<string, TokenName>]> = [
  ["professions", PROFESSION_NAMES],
  ["elements", ELEMENT_NAMES],
  ["effects", EFFECT_NAMES],
  ["defences", DEFENCE_NAMES],
  ["destructions", DESTRUCTION_NAMES],
  ["health losses", HEALTH_LOSS_SOURCE_NAMES],
  ["health gains", HEALTH_GAIN_SOURCE_NAMES],
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
 * `bun tools/mutation-sweep.ts` put a sentinel through every one of these entries
 * and nothing anywhere went red. (Written as "all 43" until there were 44 —
 * `docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F8. The block
 * below counts them; a sentence beside it cannot.)
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
  HEALTH_LOSS_SOURCE_NAMES: [
    ["poison", null, "trucizna"],
    ["fire", null, "podpalenie"],
    ["injure", null, "zranienie"],
    ["heal", null, "ujemne leczenie"],
  ],
  HEALTH_GAIN_SOURCE_NAMES: [
    ["heal", null, "leczenie"],
    ["heal_target", null, "leczenie na wskazanego"],
    ["legbon_holytouch_heal", "msg_+legbon_holytouch", "dotyk anioła"],
    ["legbon_lastheal", null, "ostatni ratunek"],
    ["healall_per", null, "leczenie całej drużyny"],
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
          HEALTH_LOSS_SOURCE_NAMES,
          HEALTH_GAIN_SOURCE_NAMES,
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
    expect(Object.keys(RECORDED).length).toBe(7);
  });
});

/**
 * The two health vocabularies against the material they are for.
 *
 * ⚠️ **One key is in both tables, and naming it once was a wrong number that
 * looked right.** `docs/protocol-keys.md` records that the client states a health
 * *loss* under `heal` with a negative figure; named once for both directions, that
 * loss printed as `leczenie` under `Bez sprawcy` on `Zadane` and `Otrzymane` —
 * healing on a damage screen.
 *
 * Read off the captures rather than listed, so the check cannot fall behind the
 * next recording: a token the material carries and neither table names would leave
 * a player reading the game's own key where a word belongs. `getPhrase` still
 * falls back to the token, so this fails a test rather than a fight.
 */
describe("the tokens the panel singles out", () => {
  /**
   * §9.3's guard, and the whole reason these are constants: a critical hit is
   * counted in the counters line and kept out of the effects line beside it, so
   * two readers have to agree about what the game calls one. Every spelling of
   * both used to sit where it was used and none of them was held to anything
   * (`docs/audits/2026-08-21-the-code-read-for-its-smells.md`, F1).
   */
  test.each([...CRITICAL_EFFECT_TOKENS])("%s is a token this file already names", (token) => {
    expect(Object.keys(EFFECT_NAMES)).toContain(token);
  });

  test("both criticals are in the list the effects line filters by", () => {
    expect([...CRITICAL_EFFECT_TOKENS]).toEqual([CRITICAL_TOKEN, VERY_CRITICAL_TOKEN]);
  });

  test("the destruction stated in percentage points is one of the destroyed statistics", () => {
    expect(Object.keys(DESTRUCTION_NAMES)).toContain(PERCENT_DESTRUCTION_TOKEN);
  });

  /**
   * The tokens are the game's, so the captures are what says they are real: a
   * constant naming an effect this game never fires would pass every check above
   * and count nothing for ever.
   */
  test("the critical the counters line counts is one the recordings fire", () => {
    const fired = new Set<string>();
    for (const fight of CAPTURED_FIGHTS) {
      const statistics = composeStatisticsOfFight(fight);
      for (const row of [...statistics.byCombatantId.values(), statistics.unattributed]) {
        for (const token of row.procsOnBlowsStruck.keys()) fired.add(token);
      }
    }

    expect([...fired]).toContain(CRITICAL_TOKEN);
  });
});

describe("the two health vocabularies, against the captures", () => {
  const SOURCES = CAPTURED_FIGHTS.map((fight) => {
    const statistics = composeStatisticsOfFight(fight);
    const lost = new Set<string>();
    const gained = new Set<string>();
    for (const row of [...statistics.byCombatantId.values(), statistics.unattributed]) {
      for (const token of row.healthLostBySource.keys()) lost.add(token);
      for (const token of row.healedBySource.keys()) gained.add(token);
    }
    return { name: fight.name, lost: [...lost], gained: [...gained] };
  });

  test("there is material to read them off", () => {
    expect(SOURCES.length).toBeGreaterThan(0);
    expect(SOURCES.some(({ lost }) => lost.length > 0)).toBe(true);
    expect(SOURCES.some(({ gained }) => gained.length > 0)).toBe(true);
  });

  test.each(SOURCES)("$name names every key health fell under", ({ lost }) => {
    for (const token of lost) {
      expect(Object.keys(HEALTH_LOSS_SOURCE_NAMES), token).toContain(token);
    }
  });

  test.each(SOURCES)("$name names every key health arrived under", ({ gained }) => {
    for (const token of gained) {
      expect(Object.keys(HEALTH_GAIN_SOURCE_NAMES), token).toContain(token);
    }
  });

  /**
   * The reason the split exists, stated as a measurement rather than as prose: it
   * would be worth nothing if the two tables happened to be disjoint, because then
   * one table would have served. `heal` is the key that is in both, and if a later
   * recording adds a second the split is earning its keep twice over.
   */
  test("and a key really does turn up on both sides", () => {
    const lost = new Set(SOURCES.flatMap(({ lost: tokens }) => tokens));
    const gained = new Set(SOURCES.flatMap(({ gained: tokens }) => tokens));
    expect([...lost].filter((token) => gained.has(token))).toContain("heal");
  });

  /** And what it is called is not the same word on the two sides. */
  test("and is not called the same thing on both", () => {
    expect(getPhrase(HEALTH_LOSS_SOURCE_NAMES, "heal", null)).not.toBe(
      getPhrase(HEALTH_GAIN_SOURCE_NAMES, "heal", null),
    );
  });
});

/**
 * The sentences the panel says where the game names nobody, and the one rule
 * counting them cannot supply: **a sentence said on two screens is written once.**
 *
 * That rule was paid for by having the two limit sentences written out twice byte
 * for byte, where rewording one would have left the panel saying two different
 * things about one limit while both screens' tests stayed green — each records its
 * own screen's phrases against itself
 * (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F18). Recording
 * the sentences again here would be the same mistake a third time, so what is held
 * is which screens share one and which must differ.
 */

describe("every screen has something to say", () => {
  // For a whole release one of the four said nothing at all, which is why the
  // tables are exhaustive per metric rather than per noun.
  test("a limit and a standing sentence for each", () => {
    for (const metric of PANEL_METRICS) {
      expect(getNoActorLimitNote(metric).length, metric).toBeGreaterThan(0);
      expect(getNoActorStandingNote(metric).length, metric).toBeGreaterThan(0);
      expect(getMissingCounterpart(metric).note.length, metric).toBeGreaterThan(0);
      expect(getMissingCounterpart(metric).label.length, metric).toBeGreaterThan(0);
    }
  });
});

describe("what is shared and what is not", () => {
  /**
   * The limit belongs to the **noun**: what the game did not say is the same fact
   * read from either end, so the two directions of one noun say it in one sentence
   * and the two nouns do not share it.
   */
  test("one limit sentence per noun", () => {
    const byNoun = new Map<string, Set<string>>();
    for (const metric of PANEL_METRICS) {
      const noun = getMetricNoun(metric);
      byNoun.set(noun, (byNoun.get(noun) ?? new Set()).add(getNoActorLimitNote(metric)));
    }
    for (const [noun, sentences] of byNoun) expect(sentences.size, noun).toBe(1);
    expect(new Set([...byNoun.values()].flatMap((one) => [...one])).size).toBe(byNoun.size);
  });

  /**
   * Where it stands belongs to the **direction**: under a given one nobody holds
   * the figure and it stands apart, under a received one it is already among the
   * rows. Two sentences, and the pairs must not be crossed — a reader adding a
   * figure that is already counted is the fault this sentence prevents.
   */
  test("one standing sentence per direction, and the two differ", () => {
    expect(getNoActorStandingNote("dealt")).toBe(getNoActorStandingNote("healingGiven"));
    expect(getNoActorStandingNote("taken")).not.toBe(getNoActorStandingNote("dealt"));
    expect(getNoActorStandingNote("healed")).not.toBe(getNoActorStandingNote("healingGiven"));
    expect(getNoActorStandingNote("healed")).not.toBe(getNoActorStandingNote("taken"));
  });

  /**
   * The row that closes a breakdown section says what the pinned row says, by
   * reading the same constant rather than by repeating it. Under a given direction
   * it says something else on purpose: there somebody *did* swing, and the game
   * named a target this fight has nobody to match.
   */
  test("a received breakdown says what the pinned row says", () => {
    expect(getMissingCounterpart("taken").note).toBe(getNoActorLimitNote("taken"));
    expect(getMissingCounterpart("healed").note).toBe(getNoActorLimitNote("healed"));
    expect(getMissingCounterpart("taken").label).toBe(NO_ACTOR_LABEL);
    expect(getMissingCounterpart("healed").label).toBe(NO_ACTOR_LABEL);
  });

  test("a given breakdown says the other thing, and one per noun", () => {
    expect(getMissingCounterpart("dealt").note).not.toBe(getNoActorLimitNote("dealt"));
    expect(getMissingCounterpart("dealt").note).not.toBe(getMissingCounterpart("healingGiven").note);
    expect(getMissingCounterpart("dealt").label).not.toBe(NO_ACTOR_LABEL);
    expect(getMissingCounterpart("healingGiven").label).not.toBe(NO_ACTOR_LABEL);
  });

  /**
   * The cut belongs to the **direction**, which is the whole of what this pair was
   * added for: both used to be chosen by the noun, so `Otrzymane` never said whom
   * the health left and `Leczenie dane` listed the recipients of healing nobody
   * gave. Held as *the two directions differ and each is one word* rather than by
   * recording the words, for the reason at the top of this file.
   */
  test("one breakdown heading per direction, and the two differ", () => {
    const byDirection = new Map<boolean, Set<string>>();
    for (const metric of PANEL_METRICS) {
      const given = isGivenMetric(metric);
      byDirection.set(
        given,
        (byDirection.get(given) ?? new Set()).add(getNoActorBreakdownHeading(metric)),
      );
    }
    expect(byDirection.size).toBe(2);
    for (const [given, headings] of byDirection) expect(headings.size, String(given)).toBe(1);
    expect(new Set([...byDirection.values()].flatMap((one) => [...one])).size).toBe(2);
  });

  /**
   * ⚠️ **One sentence, and it must not vary by screen.**
   *
   * It was four entries with two of them null, back when the leftover could only
   * close a `Komu` cut. What names neither end now rides whichever row stands
   * apart from the ranking, which is a different row on different screens
   * (`getHoleCarryingNeitherEnd` in `src/ui/panel-view.ts`) — so a table would be
   * four places for one fact to sit, and the sentence has to be true on all of
   * them anyway.
   *
   * Held here rather than in the file: a reader who reaches for a metric is the
   * one this would catch.
   */
  test("says one thing about what names neither end, whatever the screen", () => {
    const leftover = getNeitherEndLeftover();

    expect(leftover.label.length).toBeGreaterThan(0);
    expect(leftover.note.length).toBeGreaterThan(0);
    // It names no end, so it may claim nothing about either one.
    for (const forbidden of ["gra nie mówi", "imię"]) {
      expect(leftover.note.toLowerCase(), forbidden).not.toContain(forbidden);
    }
  });

  /**
   * The second row's vocabulary, held to the first's — **two rows, two answers,
   * and no sentence doing duty for both.**
   *
   * They were one row saying `Bez sprawcy` about a figure with no actor and about
   * one with no target alike, which is two different things told once
   * (`docs/specs/2026-08-18-two-ends-and-one-of-them-is-named.md`). What this
   * asks is that the split went all the way through: the label, what the game did
   * not say, and what the cut under it is headed.
   */
  test("says something of its own about a target the game did not name", () => {
    expect(NO_TARGET_LABEL).not.toBe(NO_ACTOR_LABEL);

    const actorSaid = PANEL_METRICS.flatMap((metric) => [
      getNoActorLimitNote(metric),
      getNoActorBreakdownHeading(metric),
      getNoActorScopeNote(metric),
    ]);
    for (const metric of PANEL_METRICS) {
      expect(actorSaid, metric).not.toContain(getNoTargetLimitNote(metric));
    }
    expect(actorSaid).not.toContain(getNoTargetBreakdownHeading());
    expect(actorSaid).not.toContain(getNoTargetScopeNote());

    // The noun divides it and the direction does not: a blow that found nobody is
    // the same blow read from either end.
    const wordings = new Set(PANEL_METRICS.map((metric) => getNoTargetLimitNote(metric)));
    expect(wordings.size).toBe(2);
  });

  /**
   * ⚠️ **The sentences themselves, in words, and this is the only place they are.**
   * Every other test here reads a note back from the function that writes it,
   * which holds the two sides to be the same and neither to be right: the healing
   * half of this pair could have been replaced by anything at all — a key of the
   * game's, a word of ours, English — with the whole gate green (§3,
   * `docs/audits/2026-08-21-the-code-read-for-its-smells.md`, F4).
   *
   * Both halves are here rather than one, because what makes either right is that
   * it says what the game did not state and nothing about why this reader cannot
   * know it. Read them side by side or that is not checkable.
   */
  test("says, in the player's own words, which end the game left out", () => {
    expect(getNoTargetLimitNote("dealt")).toBe(
      "Gra nie mówi, w kogo — wiadomo tylko, że cios wszedł.",
    );
    expect(getNoTargetLimitNote("healingGiven")).toBe(
      "Gra nie mówi, komu — wiadomo tylko, że leczenie weszło.",
    );
    expect(getNoActorLimitNote("taken")).toBe(
      "Gra nie mówi, kto to zadał — wiadomo tylko, że życia ubyło.",
    );
    expect(getNoActorLimitNote("healed")).toBe(
      "Gra nie mówi, kto leczył — wiadomo tylko, komu życia przybyło.",
    );
  });

  /**
   * ⚠️ **Where it stands is the one thing it shares with the first row**, and it
   * shares the sentence rather than repeating it: this row is never a cut of the
   * ranking above it, so it says what the given screens of the other row say, by
   * reading the same constant.
   */
  test("stands apart from the list, in the words the other row uses for that", () => {
    const given = PANEL_METRICS.filter((metric) => isGivenMetric(metric));
    expect(given.length).toBeGreaterThan(0);
    for (const metric of given) {
      expect(getNoTargetStandingNote()).toBe(getNoActorStandingNote(metric));
    }
  });

  /**
   * ⚠️ **It must not borrow one of the sentences above.** Every other sentence in
   * that file names a limit of the game's; this one names a limit of ours — the
   * game did state a name, and no combatant in this fight answered to it. Saying
   * "gra nie mówi" there would be a claim about the game that is false (§3).
   */
  test("and says something none of the other sentences says", () => {
    const others = PANEL_METRICS.flatMap((metric) => [
      getNoActorLimitNote(metric),
      getNoActorStandingNote(metric),
      getMissingCounterpart(metric).note,
      getMissingCounterpart(metric).label,
    ]);
    for (const metric of PANEL_METRICS) {
      const leftover = getNeitherEndLeftover();
      if (leftover === null) continue;
      expect(leftover.label.length, metric).toBeGreaterThan(0);
      expect(others, metric).not.toContain(leftover.note);
      expect(others, metric).not.toContain(leftover.label);
      expect(leftover.label, metric).not.toBe(NO_ACTOR_LABEL);
    }
  });

  /**
   * The scope sentence is a fifth thing and not a rewording of any of them: it says
   * which end of the number the figure was counted by, once a side is picked.
   */
  test("the scope sentence is its own on every screen", () => {
    const others = PANEL_METRICS.flatMap((metric) => [
      getNoActorLimitNote(metric),
      getNoActorStandingNote(metric),
      getMissingCounterpart(metric).note,
    ]);
    for (const metric of PANEL_METRICS) {
      const note = getNoActorScopeNote(metric);
      expect(note.length, metric).toBeGreaterThan(0);
      expect(others, metric).not.toContain(note);
    }
  });

  /**
   * ⚠️ **The direction decides this one, and for one round it did not — which is
   * the whole of what went wrong.**
   *
   * The four sentences used to be two, one per noun, because the figure was
   * narrowed by the victim on all four screens. Under a given direction that put a
   * received-end figure over a given-end list, so `Zadane · Oni` pinned what that
   * side *lost* and said the same sentence about it as `Otrzymane · Oni`
   * (`docs/specs/2026-08-18-a-figure-with-no-actor-has-no-side.md`).
   *
   * The figure narrows only on a received direction now, so the sentences have to
   * part along the same line: a received screen names the end it was counted by, a
   * given one says the figure is the whole fight's and that no combatant carries
   * it — the summary bar below does put it on a side
   * (`docs/specs/2026-08-18-a-tick-nobody-swung-still-has-a-side.md`), which is
   * why that half of the wording had to go. Four distinct wordings — the noun
   * still divides each pair, because one is health leaving and the other is health
   * arriving.
   */
  test("says which end it was counted by, and the direction decides it", () => {
    const wordings = new Set(PANEL_METRICS.map((metric) => getNoActorScopeNote(metric)));
    expect(wordings.size).toBe(PANEL_METRICS.length);

    // The direction is the cut that has to exist: a noun's two screens now say
    // different things, and that is the fault this pair is written against.
    for (const noun of new Set(PANEL_METRICS.map((metric) => getMetricNoun(metric)))) {
      const ofNoun = PANEL_METRICS.filter((metric) => getMetricNoun(metric) === noun);
      const given = ofNoun.filter((metric) => isGivenMetric(metric));
      const received = ofNoun.filter((metric) => !isGivenMetric(metric));
      expect(given.length, noun).toBe(1);
      expect(received.length, noun).toBe(1);
      expect(getNoActorScopeNote(given[0]!), noun).not.toBe(getNoActorScopeNote(received[0]!));
    }
  });
});

/**
 * A number as the panel writes it, in both spellings.
 *
 * The figure had one test through the view — that a five-digit total is spaced —
 * and the share had none, in the file whose whole reason for existing is that the
 * two used to be spelled differently in two places and printed `39362,0/t` beside
 * `354 258` on one row.
 */

describe("a figure", () => {
  test("is spaced every three digits from the right", () => {
    expect(composeFigureText(354258)).toBe("354 258");
    expect(composeFigureText(1000)).toBe("1 000");
    expect(composeFigureText(1234567)).toBe("1 234 567");
  });

  // Both sides of where the spacing starts: three digits are not spaced and four
  // are, so the rule cannot be reading the wrong end of the number.
  test("is left alone below a thousand", () => {
    expect(composeFigureText(999)).toBe("999");
    expect(composeFigureText(1)).toBe("1");
    expect(composeFigureText(0)).toBe("0");
  });

  // A figure is whole on screen because a fraction of a point is not a reading the
  // protocol ever states — but the arithmetic that reaches here divides.
  test("is rounded, never truncated", () => {
    expect(composeFigureText(1.4)).toBe("1");
    expect(composeFigureText(1.5)).toBe("2");
    expect(composeFigureText(999.6)).toBe("1 000");
  });
});

describe("a share", () => {
  test("is a whole percentage", () => {
    expect(composeShareText(0.5)).toBe("50%");
    expect(composeShareText(1)).toBe("100%");
    expect(composeShareText(0.067)).toBe("7%");
  });

  /**
   * Zero is a reading and says so. A bracket reading `(0%)` beside a real figure is
   * the fault §9.6 forbids twice over — but that is the caller's decision to draw
   * one at all, and this must not quietly turn a zero into anything else.
   */
  test("says zero where the share is zero", () => {
    expect(composeShareText(0)).toBe("0%");
  });

  /**
   * And says *small* where the share is small, which is neither of the two.
   *
   * ⚠️ **Both sides of the boundary, and zero is the boundary** (§7.5). A share
   * that rounds down to nothing printed `0%` beside a real figure — eleven ranked
   * rows over the captures as they stand, 1 741 dealt on
   * `tests/captured-fights/2026-08-15-tempest-grupa-vs-draugr-1.json` among them.
   * The first assertion below is what zero must keep saying, the last is where
   * rounding takes over again.
   */
  test("says below a point where the share rounds to nothing but is not nothing", () => {
    expect(composeShareText(0)).toBe("0%");
    expect(composeShareText(0.000001)).toBe("<1%");
    expect(composeShareText(0.004)).toBe("<1%");
    expect(composeShareText(0.005)).toBe("1%");
  });

  // Above one is possible arithmetic and was once printed: 320% under a filtered
  // received screen. It is written as it is, so a wrong denominator shows.
  test("is not clamped", () => {
    expect(composeShareText(3.2)).toBe("320%");
  });
});
