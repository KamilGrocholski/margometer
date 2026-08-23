/**
 * The report states both readings the panel warns about, and states them at zero.
 *
 * Written because the report had been printing one of the two. A panel warns
 * that healing is short by an amount the game never stated; the report printed
 * `unreadable messages` and stopped, so the one reading that is a certainty
 * rather than a suspicion was invisible to the tool this repository reads a
 * capture with (`TODO.md`, closed by the commit that carries this file).
 *
 * ⚠️ **Zero is the case that matters here.** Every capture in this material
 * reads at zero on both counts, so a block that printed only what is non-zero
 * would be byte-for-byte the block that never learned to state it — the fault
 * would come back unnoticed the moment a recording carries one. That is why the
 * corpus assertion below is about the caption and not about a figure.
 *
 * The per-key tallies are exercised on hand-made readings rather than on
 * material: `ReadingGaps` is our own contract, so a value built here is a
 * legitimate input and not a guess about somebody else's output (§7.5).
 */

import { describe, expect, test } from "bun:test";
import { CAPTURED_FIGHTS, composeStatisticsOfFight } from "@/tests/captured-fight-catalog.ts";
import type { ReadingGaps } from "@/src/core/fight-statistics.ts";
import { composeReadingLines } from "@/tools/fight-report.ts";

function composeReading(overrides: Partial<ReadingGaps> = {}): ReadingGaps {
  return {
    unreadableMessages: 0,
    messagesByReason: new Map(),
    occurrencesByUnreadKey: new Map(),
    unaccountedHealthBySource: new Map(),
    ...overrides,
  };
}

describe("fight report reading block", () => {
  test("names both readings even where nothing was missed", () => {
    const text = composeReadingLines(composeReading()).join("\n");
    expect(text).toContain("unaccounted healing: 0 casts");
    expect(text).toContain("unreadable messages: 0");
  });

  test("every capture's report states both, on material that misses neither", () => {
    expect(CAPTURED_FIGHTS.length).toBeGreaterThan(0);
    for (const fight of CAPTURED_FIGHTS) {
      const text = composeReadingLines(composeStatisticsOfFight(fight).reading).join("\n");
      expect(text).toContain("unaccounted healing:");
      expect(text).toContain("unreadable messages:");
    }
  });

  // The certain claim above the suspicion, which is the order `src/ui/panel-view.ts`
  // puts its sentences in. A report that ranked them the other way would read as
  // if the unreadable message were the larger finding.
  test("puts unaccounted healing before unreadable messages", () => {
    const lines = composeReadingLines(
      composeReading({
        unreadableMessages: 2,
        messagesByReason: new Map([["no grammar", 2]]),
        unaccountedHealthBySource: new Map([["healall_per", 3]]),
      }),
    );
    const unaccounted = lines.findIndex((line) => line.includes("unaccounted healing:"));
    const unreadable = lines.findIndex((line) => line.includes("unreadable messages:"));
    expect(unaccounted).toBeGreaterThanOrEqual(0);
    expect(unaccounted).toBeLessThan(unreadable);
  });

  test("counts the casts and lists every key that stated one", () => {
    const lines = composeReadingLines(
      composeReading({
        unaccountedHealthBySource: new Map([
          ["healall_per", 3],
          ["healall_other", 1],
        ]),
      }),
    );
    expect(lines[0]).toContain("unaccounted healing: 4 casts");
    // Busiest first, and the key kept whole: a truncated key cannot be looked up
    // in `docs/protocol-keys.md`, which is the only reason to print it.
    expect(lines[1]).toContain("healall_per");
    expect(lines[2]).toContain("healall_other");
  });

  // Zero and one, both sides of the boundary: at zero the caption stands alone,
  // at one it has a line under it. A block that printed the caption and dropped
  // the tally would pass the first of these and fail the second.
  test("lists no key at zero and one key at one", () => {
    expect(composeReadingLines(composeReading())).toHaveLength(2);
    expect(
      composeReadingLines(composeReading({ unaccountedHealthBySource: new Map([["heal", 1]]) })),
    ).toHaveLength(3);
  });

  test("orders equal counts by their key, so the report reads the same twice", () => {
    const tallies = new Map([
      ["zzz", 1],
      ["aaa", 1],
    ]);
    const lines = composeReadingLines(composeReading({ unaccountedHealthBySource: tallies }));
    expect(lines[1]).toContain("aaa");
    expect(lines[2]).toContain("zzz");
  });
});
