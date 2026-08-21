/**
 * The developer's table, held to the two things it must not do: invent a figure,
 * and grow the page a node at a time.
 */

import { describe, expect, test } from "bun:test";
import { COST_COLUMNS } from "@/src/cost-phases.ts";
import {
  composeCostLines,
  setCostOverlayDrawn,
  COST_OVERLAY_ID,
  type CostOverlayDocument,
  type CostOverlayNode,
  type CostReading,
} from "@/src/ui/cost-overlay.ts";

function composeFakeNode(): CostOverlayNode {
  return {
    id: "",
    textContent: "",
    style: { setProperty: (): void => {} },
    append: (): void => {},
    replaceChildren: (): void => {},
  };
}

function composeFakePage(): {
  document: CostOverlayDocument;
  getAppended: () => CostOverlayNode[];
} {
  const appended: CostOverlayNode[] = [];
  const document: CostOverlayDocument = {
    createElement: () => composeFakeNode(),
    getElementById: (id) => appended.find((node) => node.id === id) ?? null,
    body: {
      append: (...nodes) => {
        appended.push(...nodes);
      },
    },
  };
  return { document, getAppended: () => appended };
}

const READING: CostReading = {
  wholes: [{ name: "payload", calls: 4, totalMs: 8, worstMs: 3 }],
  parts: [{ name: "reading", calls: 2, totalMs: 5, worstMs: 4 }],
  heapBytes: null,
};

describe("what the add-on cost, drawn", () => {
  test("writes a line per span it was handed, under both headings", () => {
    const lines = composeCostLines(READING).join("\n");

    expect(lines).toContain("payload");
    expect(lines).toContain("reading");
    expect(lines).toContain("whole");
    expect(lines).toContain("parts of it");
  });

  /**
   * ⚠️ **The same table is printed in a terminal, and the two used to name its
   * columns separately.** `src/cost-phases.ts` holds the phase names for that
   * reason and now holds the headings above them too, so a reader comparing the
   * overlay with `bun run cost` is comparing one table
   * (`docs/audits/2026-08-21-the-rest-of-the-code-read-for-its-smells.md`, F5).
   * The widths stay per reader — a terminal has room a game window does not.
   */
  test("heads its columns in the words the terminal report uses", () => {
    const heading = composeCostLines(READING).find((line) => line.includes(COST_COLUMNS.name));

    expect(heading).toContain(COST_COLUMNS.calls);
    expect(heading).toContain(COST_COLUMNS.total);
    expect(heading).toContain(COST_COLUMNS.worst);
    // In the order a row is written in, so the words stand over their own figures.
    expect(heading?.indexOf(COST_COLUMNS.total)).toBeLessThan(
      heading?.indexOf(COST_COLUMNS.worst) ?? 0,
    );
  });

  /**
   * §9.6: unknown and zero stay apart on screen and not only in the data. The
   * browser this is driven in — Firefox, per `.claude/skills/verify/SKILL.md` —
   * offers no heap figure at all, so the absent case is the usual one, and a `0`
   * drawn there would read as "this add-on holds no memory".
   */
  test("says a heap it was not offered is not offered, never zero", () => {
    const lines = composeCostLines(READING).join("\n");

    expect(lines).toContain("not offered");
    expect(lines).not.toContain("0 MiB");
  });

  test("writes a heap it was offered", () => {
    const lines = composeCostLines({ ...READING, heapBytes: 41 * 1024 * 1024 }).join("\n");

    expect(lines).toContain("41 MiB");
    expect(lines).not.toContain("not offered");
  });

  // §9.6, rung one: a name of ours in the game's own document says whose it is.
  test("puts one node on the page, and it carries our prefix", () => {
    const { document, getAppended } = composeFakePage();

    setCostOverlayDrawn(document, READING);

    expect(getAppended()).toHaveLength(1);
    expect(getAppended()[0]?.id).toBe(COST_OVERLAY_ID);
    expect(COST_OVERLAY_ID.startsWith("MargoMeter-")).toBe(true);
  });

  /**
   * The panel is mounted once and this is redrawn on every payload, which is
   * exactly the asymmetry that grows a page a node at a time: a hundred payloads
   * would have left a hundred tables stacked on the game.
   */
  test("redraws the node it already put there rather than adding another", () => {
    const { document, getAppended } = composeFakePage();

    setCostOverlayDrawn(document, READING);
    setCostOverlayDrawn(document, { ...READING, heapBytes: 1024 * 1024 });

    expect(getAppended()).toHaveLength(1);
    expect(getAppended()[0]?.textContent).toContain("1 MiB");
  });

  // A page with no body is a page in a test runner, and drawing is not the thing
  // that may take the add-on down.
  test("draws nothing rather than throwing where there is no page to draw on", () => {
    expect(() =>
      setCostOverlayDrawn({ createElement: () => composeFakeNode() }, READING),
    ).not.toThrow();
  });
});
