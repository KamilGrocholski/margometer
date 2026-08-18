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
import { getMetricNoun, isGivenMetric, PANEL_METRICS } from "@/src/ui/panel-metric.ts";
import {
  getMissingCounterpart,
  getPinnedBreakdownHeading,
  getPinnedLeftover,
  getPinnedLimitNote,
  getPinnedScopeNote,
  getPinnedStandingNote,
  NOBODY_LABEL,
} from "@/src/ui/panel-nobody.ts";

describe("every screen has something to say", () => {
  // For a whole release one of the four said nothing at all, which is why the
  // tables are exhaustive per metric rather than per noun.
  test("a limit and a standing sentence for each", () => {
    for (const metric of PANEL_METRICS) {
      expect(getPinnedLimitNote(metric).length, metric).toBeGreaterThan(0);
      expect(getPinnedStandingNote(metric).length, metric).toBeGreaterThan(0);
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
      byNoun.set(noun, (byNoun.get(noun) ?? new Set()).add(getPinnedLimitNote(metric)));
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
    expect(getPinnedStandingNote("dealt")).toBe(getPinnedStandingNote("healingGiven"));
    expect(getPinnedStandingNote("taken")).not.toBe(getPinnedStandingNote("dealt"));
    expect(getPinnedStandingNote("healed")).not.toBe(getPinnedStandingNote("healingGiven"));
    expect(getPinnedStandingNote("healed")).not.toBe(getPinnedStandingNote("taken"));
  });

  /**
   * The row that closes a breakdown section says what the pinned row says, by
   * reading the same constant rather than by repeating it. Under a given direction
   * it says something else on purpose: there somebody *did* swing, and the game
   * named a target this fight has nobody to match.
   */
  test("a received breakdown says what the pinned row says", () => {
    expect(getMissingCounterpart("taken").note).toBe(getPinnedLimitNote("taken"));
    expect(getMissingCounterpart("healed").note).toBe(getPinnedLimitNote("healed"));
    expect(getMissingCounterpart("taken").label).toBe(NOBODY_LABEL);
    expect(getMissingCounterpart("healed").label).toBe(NOBODY_LABEL);
  });

  test("a given breakdown says the other thing, and one per noun", () => {
    expect(getMissingCounterpart("dealt").note).not.toBe(getPinnedLimitNote("dealt"));
    expect(getMissingCounterpart("dealt").note).not.toBe(getMissingCounterpart("healingGiven").note);
    expect(getMissingCounterpart("dealt").label).not.toBe(NOBODY_LABEL);
    expect(getMissingCounterpart("healingGiven").label).not.toBe(NOBODY_LABEL);
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
        (byDirection.get(given) ?? new Set()).add(getPinnedBreakdownHeading(metric)),
      );
    }
    expect(byDirection.size).toBe(2);
    for (const [given, headings] of byDirection) expect(headings.size, String(given)).toBe(1);
    expect(new Set([...byDirection.values()].flatMap((one) => [...one])).size).toBe(2);
  });

  /**
   * The row closing a `Komu` cut exists exactly where that cut does, and nowhere
   * else: under a given direction the cut is by source and the aggregate writes
   * every point's key beside its total, so there is nothing that can be left over.
   * A row offered there would be one that can only ever say zero.
   */
  test("a leftover row exactly where the cut is by combatant", () => {
    for (const metric of PANEL_METRICS) {
      expect(getPinnedLeftover(metric) === null, metric).toBe(isGivenMetric(metric));
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
      getPinnedLimitNote(metric),
      getPinnedStandingNote(metric),
      getMissingCounterpart(metric).note,
      getMissingCounterpart(metric).label,
    ]);
    for (const metric of PANEL_METRICS) {
      const leftover = getPinnedLeftover(metric);
      if (leftover === null) continue;
      expect(leftover.label.length, metric).toBeGreaterThan(0);
      expect(others, metric).not.toContain(leftover.note);
      expect(others, metric).not.toContain(leftover.label);
      expect(leftover.label, metric).not.toBe(NOBODY_LABEL);
    }
  });

  /**
   * The scope sentence is a fifth thing and not a rewording of any of them: it says
   * which end of the number the figure was counted by, once a side is picked.
   */
  test("the scope sentence is its own on every screen", () => {
    const others = PANEL_METRICS.flatMap((metric) => [
      getPinnedLimitNote(metric),
      getPinnedStandingNote(metric),
      getMissingCounterpart(metric).note,
    ]);
    for (const metric of PANEL_METRICS) {
      const note = getPinnedScopeNote(metric);
      expect(note.length, metric).toBeGreaterThan(0);
      expect(others, metric).not.toContain(note);
    }
  });

  /**
   * And it names the end the health moved on, which is the **noun's** to decide and
   * not the direction's.
   *
   * ⚠️ **The two directions of a noun share it on purpose.** The figure is the
   * same points read from either end, so it narrows to the same side either way;
   * wording it per screen would leave two sentences free to drift over one fact. The
   * nouns must differ, because one is health leaving and the other is health
   * arriving, and a sentence covering both would have to be ours rather than the
   * language’s.
   */
  test("says which end it was counted by, one wording per noun", () => {
    const nouns = new Map<string, Set<string>>();
    for (const metric of PANEL_METRICS) {
      const noun = getMetricNoun(metric);
      nouns.set(noun, (nouns.get(noun) ?? new Set()).add(getPinnedScopeNote(metric)));
    }

    expect(nouns.size).toBe(2);
    for (const [noun, wordings] of nouns) expect(wordings.size, noun).toBe(1);
    expect(new Set([...nouns.values()].flatMap((wordings) => [...wordings])).size).toBe(2);
  });
});
