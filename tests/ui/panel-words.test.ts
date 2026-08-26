import { describe, expect, test } from "bun:test";
import { assertDefined } from "@/libs/assert.ts";
import { getIntegerFromText } from "@/libs/number.ts";
import {
  composeCountedText,
  composeSideCountsText,
  CHOICE_REFUSED_WARNING,
  EVERY_SLOT_PINNED_WARNING,
  FIGHTS_BACK_LABEL,
  FIGHTS_EMPTY,
  FIGHTS_TITLE,
  getFightOutcomeText,
  getFightTimeText,
  getOutcomeLabel,
  getPinTitle,
  getStorageLabel,
  PIN_MARK,
  STORAGE_LABEL,
  STORE_REFUSED_WARNING,
  UNPINNED_MARK,
  composeFigureText,
  composeShareText,
  composeShareTexts,
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
  composeUnaccountedHealingRowNote,
  composeUnreadableRowNote,
  PROFESSION_NAMES,
  ROW_WARNING_HEADING,
  ROW_WARNING_MARK,
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

  /**
   * ⚠️ **The rule is *identifier, not sentence*, and `msg_` was standing in for
   * it.** Every id here came from one family until `def-heal` did, so the pattern
   * spelled that family and read like the rule — a guard narrower than the
   * construct it owns (§7.5). What decides is whether the client answers with a
   * label: the `msg_…` family is mostly prose with holes in it and a few bare
   * names, while `def-…` is what the client labels a row of a warrior's statistics
   * with and has no hole by construction (production build `1786514810315`).
   *
   * So the families the panel reads are named rather than the shape widened to
   * anything: a third one is a decision, and this is where it gets made. A single
   * trailing hole stays admitted — the client keys some entries with one — and an
   * interior space is refused, which is what a sentence has and an identifier
   * does not.
   */
  const DICTIONARY_FAMILIES = /^(?:msg_|def-)[^%\s]+( %[a-z0-9]+%)?$/;

  test("asks it by an identifier and never by a sentence", () => {
    for (const [family, token, name] of EVERY_NAME) {
      if (name.id === null) continue;
      expect(name.id, `${family}/${token}`).toMatch(DICTIONARY_FAMILIES);
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
    ["stun2-d", "msg_+stun2-d", "potężne ogłuszenie strzałą"],
    ["stun2", "msg_+stun2", "potężne ogłuszenie"],
    ["wound", "msg_+wound", "nałożona głęboka rana"],
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
    ["light", null, "porażenie"],
    ["injure", null, "zranienie"],
    ["wound", null, "głęboka rana"],
    ["heal", null, "ujemne przywracanie życia"],
    ["anguish", null, "krwawienie"],
  ],
  HEALTH_GAIN_SOURCE_NAMES: [
    ["heal", "def-heal", "przywracanie życia"],
    ["heal_target", null, "uleczenie wskazanego"],
    ["legbon_holytouch_heal", "msg_+legbon_holytouch", "dotyk anioła"],
    ["legbon_lastheal", null, "ostatni ratunek"],
    ["healall_per", null, "uleczenie sojuszników"],
    ["npc_heal", null, "regeneracja potwora"],
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

/**
 * Polish counts three ways and the panel used to count two.
 *
 * Written out in words rather than checked against the module that writes them
 * (§7.5): the whole content of this is which word a number takes, and a test
 * asking the composer what it thinks would agree with it whatever it said.
 */
describe("a count and its noun", () => {
  const forms: [string, string, string] = ["zdarzenie", "zdarzenia", "zdarzeń"];

  test("takes the first form at one and nowhere else", () => {
    expect(composeCountedText(1, forms)).toBe("1 zdarzenie");
    // Twenty-one ends in one and is not one, which is where a rule reading only
    // the last digit would go wrong in the other direction.
    expect(composeCountedText(21, forms)).toBe("21 zdarzeń");
  });

  /**
   * ⚠️ **The case two forms get wrong, and the reason this exists.** A count
   * ending in 2, 3 or 4 takes its own word — `3 zdarzenia`, never `3 zdarzeń` —
   * and it goes on doing so past twenty.
   */
  test("takes the second form at two, three and four, however high", () => {
    expect(composeCountedText(2, forms)).toBe("2 zdarzenia");
    expect(composeCountedText(3, forms)).toBe("3 zdarzenia");
    expect(composeCountedText(4, forms)).toBe("4 zdarzenia");
    expect(composeCountedText(22, forms)).toBe("22 zdarzenia");
    expect(composeCountedText(104, forms)).toBe("104 zdarzenia");
  });

  /** And the teens, which look like the case above and are not it. */
  test("takes the third form at five and up, and through the teens", () => {
    expect(composeCountedText(5, forms)).toBe("5 zdarzeń");
    expect(composeCountedText(12, forms)).toBe("12 zdarzeń");
    expect(composeCountedText(13, forms)).toBe("13 zdarzeń");
    expect(composeCountedText(14, forms)).toBe("14 zdarzeń");
    expect(composeCountedText(112, forms)).toBe("112 zdarzeń");
  });

  test("writes the figure the way every other figure on the panel is written", () => {
    expect(composeCountedText(1234, forms)).toBe("1 234 zdarzenia");
    expect(composeCountedText(1235, forms)).toBe("1 235 zdarzeń");
  });
});

/**
 * The two sentences a marked row opens onto, read as a player reads them.
 *
 * Spelled out here for §7.5's reason: these are words somebody is meant to act on,
 * and a test comparing them with the module would pass on our own vocabulary, on a
 * key of the game's, or on nothing at all.
 */
describe("what a marked row says", () => {
  test("says a figure may be low, without saying what could not be read", () => {
    expect(composeUnreadableRowNote(1)).toBe(
      "Nie dało się odczytać 1 zdarzenia z jej udziałem — jej liczby mogą być zaniżone.",
    );
    expect(composeUnreadableRowNote(6)).toBe(
      "Nie dało się odczytać 6 zdarzeń z jej udziałem — jej liczby mogą być zaniżone.",
    );
  });

  /**
   * ⚠️ **The two are different claims and have to read differently.** This one is
   * not a suspicion: the healing went out and the game never said how much, so the
   * sentence says *jest*, where the one above says *mogą być*.
   */
  test("says healing given is low, rather than that it might be", () => {
    expect(composeUnaccountedHealingRowNote(1)).toBe(
      "Uleczyła sojuszników 1 raz bez podanej liczby — jej leczenie jest zaniżone.",
    );
    expect(composeUnaccountedHealingRowNote(3)).toBe(
      "Uleczyła sojuszników 3 razy bez podanej liczby — jej leczenie jest zaniżone.",
    );
  });

  test("heads the block in the card in Polish, and marks the row with a glyph", () => {
    expect(ROW_WARNING_HEADING).toBe("Czego nie wiadomo");
    // A glyph rather than a letter or a word: the row has no space for a sentence,
    // and a colour on its own would carry the meaning alone (§9.7).
    expect(ROW_WARNING_MARK).toBe("⚠");
  });

  test("carries no key of the game's and no word of ours", () => {
    const said = [
      composeUnreadableRowNote(2),
      composeUnaccountedHealingRowNote(2),
      ROW_WARNING_HEADING,
    ].join(" ");

    for (const forbidden of ["protok", "klucz", "komunikat", "payload", "heal", "dmg"]) {
      expect(said.toLowerCase(), forbidden).not.toContain(forbidden);
    }
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

describe("a set of shares", () => {
  /** What a reader does with a column of brackets: adds them up. */
  function getPointsAdded(texts: readonly string[]): number {
    return texts.reduce((sum, text) => sum + (text === "<1%" ? 0 : (getIntegerFromText(text.replace("%", "")) ?? Number.NaN)), 0);
  }

  /**
   * ⚠️ **Three equal thirds print 33% three times and the column reads 99.** That
   * is the whole fault: every share rounded on its own loses up to half a point in
   * the same direction, and the reader adds up a fight that is not the one they
   * are looking at.
   */
  test("adds up to the whole it divides by", () => {
    expect(composeShareTexts([1, 1, 1], 3)).toEqual(["34%", "33%", "33%"]);
    expect(composeShareTexts([1, 1, 1, 1, 1, 1], 6)).toEqual(["17%", "17%", "17%", "17%", "16%", "16%"]);
    expect(getPointsAdded(composeShareTexts([5, 3, 1], 9))).toBe(100);
  });

  /**
   * The extra point goes where the most was discarded, which is the method; what
   * happens where two rows discarded the same is the pair of tests below.
   */
  test("hands the points left over to the largest remainders", () => {
    // 45.45, 27.27, 27.27: the hundredth point goes to the biggest fraction thrown
    // away, which is the first row's.
    expect(composeShareTexts([5, 3, 3], 11)).toEqual(["46%", "27%", "27%"]);
  });

  /**
   * ⚠️ **Two rows holding the same figure print the same share.** The point that
   * closes the column used to go to one row of a tie, and on the group captures a
   * tie is six combatants on one number: `3%` beside one of them and `2%` beside
   * the other five reads as a panel that cannot add up, which is worse than the
   * column being a point out. A tie is paid whole or passed over, and a smaller
   * remainder is paid instead.
   */
  test("pays a tie whole or passes it over", () => {
    // 33.33, 33.33, 22.22, 11.11 — the pair discarded the most and cannot be paid
    // with one point, so the point goes to the row behind them.
    expect(composeShareTexts([3, 3, 2, 1], 9)).toEqual(["33%", "33%", "23%", "11%"]);
  });

  /**
   * And where nothing but the tie is left to pay, the column adding up is the
   * promise that wins: the tie is split, earliest row first.
   */
  test("splits a tie rather than leave the column short", () => {
    // 37.5, 37.5, 25 — two rows owed half a point each and one point to hand out.
    expect(composeShareTexts([3, 3, 2], 8)).toEqual(["38%", "37%", "25%"]);
  });

  /**
   * A share too small to round to a point still says something happened (§9.6),
   * and it takes no point of the hundred — so the floor and the sum do not fight.
   */
  test("keeps the floor under a share that is there", () => {
    const texts = composeShareTexts([9_999, 1], 10_000);
    expect(texts).toEqual(["100%", "<1%"]);
    expect(getPointsAdded(texts)).toBe(100);
  });

  /** Zero measured nothing, and nothing measured is not a share too small to see. */
  test("says zero where a figure is zero", () => {
    expect(composeShareTexts([1, 0], 1)).toEqual(["100%", "0%"]);
  });

  /**
   * A screen may divide by a whole holding a figure it does not draw, and then the
   * shares are right to add to less than a hundred — the hundred is what the whole
   * comes to, not what the drawn rows are owed.
   */
  test("adds up to what is drawn where the whole holds more", () => {
    expect(getPointsAdded(composeShareTexts([1, 1], 4))).toBe(50);
  });

  /** Nothing to divide by is not a division: it is a screen with no figures on it. */
  test("says nothing of a whole of zero", () => {
    expect(composeShareTexts([0, 0], 0)).toEqual(["0%", "0%"]);
  });

  test("writes nothing for nothing", () => {
    expect(composeShareTexts([], 10)).toEqual([]);
  });
});

/**
 * The shelf's words, read in words.
 *
 * §7.5: a test that reads a string back from the module that writes it holds the
 * two to be the same and neither to be right. So every sentence below is spelled
 * out here — a Polish reader can check it, and replacing one with our vocabulary
 * or with a key of the game's turns this red.
 */
describe("what the shelf of kept fights says", () => {
  test("names itself and the way off it", () => {
    expect(FIGHTS_TITLE).toBe("Walki");
    expect(FIGHTS_BACK_LABEL).toBe("‹ wróć");
  });

  test("says what an empty shelf will hold, not only that it is empty", () => {
    expect(FIGHTS_EMPTY).toBe("Nic tu jeszcze nie ma — walka trafia tutaj, kiedy się skończy.");
  });

  test("calls the fight happening now by the time it is", () => {
    expect(getFightTimeText(null, true)).toBe("teraz");
    expect(getFightOutcomeText(null, true)).toBe("trwa");
  });

  test("writes a clock two digits either side", () => {
    expect(getFightTimeText({ hour: 21, minute: 4 }, false)).toBe("21:04");
    expect(getFightTimeText({ hour: 9, minute: 30 }, false)).toBe("09:30");
    expect(getFightTimeText({ hour: 0, minute: 0 }, false)).toBe("00:00");
  });

  /** §9.3: a moment that will not read is not midnight. */
  test("says nothing at all where there is no time to say", () => {
    expect(getFightTimeText(null, false)).toBe("");
  });

  test("writes how big the fight was, the reader's side first", () => {
    expect(composeSideCountsText([4, 4])).toBe("4×4");
    expect(composeSideCountsText([11, 1])).toBe("11×1");
    expect(composeSideCountsText([])).toBe("");
  });

  /** §3: a Polish panel never borrows English shorthand for a thing it can name. */
  test("does not write a fight's size the English way", () => {
    expect(composeSideCountsText([4, 4])).not.toContain("v");
  });

  test("says how a fight ended in the reader's own words", () => {
    expect(getOutcomeLabel("won")).toBe("wygrana");
    expect(getOutcomeLabel("lost")).toBe("przegrana");
    expect(getOutcomeLabel("drawn")).toBe("remis");
    expect(getFightOutcomeText("won", false)).toBe("wygrana");
    expect(getFightOutcomeText(null, false)).toBe("");
  });

  /** §9.7: the mark is a glyph, and what it does is said in words beside it. */
  test("says what the pin will do rather than only marking it", () => {
    expect(PIN_MARK).toBe("★");
    expect(UNPINNED_MARK).toBe("☆");
    expect(getPinTitle(false)).toBe("Przypnij, żeby nie zniknęła");
    expect(getPinTitle(true)).toBe("Odepnij — będzie mogła zniknąć");
  });

  test("names the one control and the three places", () => {
    expect(STORAGE_LABEL).toBe("Trzymaj");
    expect(getStorageLabel("local")).toBe("na stałe");
    expect(getStorageLabel("session")).toBe("do zamknięcia karty");
    expect(getStorageLabel("memory")).toBe("tylko teraz");
  });

  /**
   * Three sentences and not one, because the remedies differ — and none of them
   * names a quota, a store or an exception, which are ours (§3). The third is
   * about the control rather than about a fight: nothing was lost, and what it
   * has to say is that the control did nothing
   * (`docs/audits/2026-08-26-the-whole-tree-read-a-fifth-time.md`, F1).
   *
   * ⚠️ **The first names one remedy and used to name two.** *Trzymaj mniej walk*
   * was the other, and the strip it pointed at is gone — a sentence sending a
   * reader to a control that is not on the screen is worse than one that sends
   * them nowhere.
   */
  test("tells the reader what was not kept, and which of the three reasons", () => {
    expect(STORE_REFUSED_WARNING).toBe(
      "Przeglądarka nie przyjęła tej walki — nie została zapisana. Odepnij którąś, żeby zrobić miejsce.",
    );
    expect(EVERY_SLOT_PINNED_WARNING).toBe(
      "Wszystkie miejsca są zajęte przez przypięte walki — ta się nie zapisała.",
    );
    expect(CHOICE_REFUSED_WARNING).toBe(
      "Przeglądarka nie zapisała tego wyboru — zostaje tak, jak było.",
    );
    for (const sentence of [
      STORE_REFUSED_WARNING,
      EVERY_SLOT_PINNED_WARNING,
      CHOICE_REFUSED_WARNING,
    ]) {
      for (const ours of ["localStorage", "sessionStorage", "quota", "store", "budget"]) {
        expect(sentence).not.toContain(ours);
      }
    }
  });
});
