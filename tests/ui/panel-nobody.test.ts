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

import { describe, expect, test } from "bun:test";
import { getMetricNoun, isGivenMetric, PANEL_METRICS } from "@/src/ui/panel-screen.ts";
import {
  getMissingCounterpart,
  getNoActorBreakdownHeading,
  getNeitherEndLeftover,
  getNoActorLimitNote,
  getNoActorScopeNote,
  getNoActorStandingNote,
  getNoTargetBreakdownHeading,
  getNoTargetLimitNote,
  getNoTargetScopeNote,
  getNoTargetStandingNote,
  NO_TARGET_LABEL,
  NO_ACTOR_LABEL,
} from "@/src/ui/panel-nobody.ts";

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
