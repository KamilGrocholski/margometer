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
import { getMetricNoun, PANEL_METRICS } from "@/src/ui/panel-metric.ts";
import {
  getMissingCounterpart,
  getPinnedLimitNote,
  getPinnedStandingNote,
  NOBODY_LABEL,
  NOBODY_SCOPE_NOTE,
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

  // The scope sentence is a fifth thing and not a rewording of any of them: it says
  // the figure is fight-wide while the list on screen is not.
  test("the scope sentence is its own", () => {
    const others = PANEL_METRICS.flatMap((metric) => [
      getPinnedLimitNote(metric),
      getPinnedStandingNote(metric),
      getMissingCounterpart(metric).note,
    ]);
    expect(others).not.toContain(NOBODY_SCOPE_NOTE);
    expect(NOBODY_SCOPE_NOTE.length).toBeGreaterThan(0);
  });
});
