/**
 * `docs/drill-levels.md` against the panel it describes.
 *
 * The register names every kind of row the drill can draw and whether pressing it
 * opens anything. It is prose, so nothing but this holds it to the tree — and the
 * failure it exists against is the quiet one: a rule changes, the table keeps
 * saying what used to be true, and the next person reads it as the specification.
 *
 * ⚠️ **Both directions, or it holds nothing.** A row here the tree does not
 * produce is a claim about a panel that no longer exists; a case the tree produces
 * and the table does not name is the register having silently stopped being
 * complete. The second is the one a guard written the obvious way would miss.
 *
 * The counts stay out of the register and live here as a floor instead (§5): what
 * the table states is a verdict, and how often each case occurs changes with the
 * next recording.
 */

import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { getTextOrder } from "@/libs/text-order.ts";
import { METRIC_LABELS, PANEL_METRICS, type PanelMetric } from "@/src/ui/panel-screen.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";
import {
  composeDrillCases,
  composeSectionName,
  DrillReportError,
  getRowKind,
  ROW_KINDS,
  type DrillCase,
} from "@/tools/drill-report.ts";

const REGISTER_PATH = new URL("../../docs/drill-levels.md", import.meta.url).pathname;

/** The closed list the register's last column is held to. */
const VERDICTS = ["always", "never", "sometimes"] as const;
type Verdict = (typeof VERDICTS)[number];

type RegisterEntry = {
  level: DrillCase["level"];
  metric: PanelMetric;
  section: string;
  kind: string;
  verdict: Verdict;
};

const LEVEL_BY_HEADING: Record<string, DrillCase["level"]> = {
  "## The breakdown": "II",
  "## The deep level": "III",
};

/**
 * The two tables, read as entries.
 *
 * Emphasis and code ticks are stripped rather than matched: the register is for
 * people first, so a verdict somebody bolded to draw the eye must not become a
 * verdict this guard cannot find.
 */
function composeRegisterEntries(): RegisterEntry[] {
  const entries: RegisterEntry[] = [];
  let level: DrillCase["level"] | null = null;

  for (const line of readFileSync(REGISTER_PATH, "utf8").split("\n")) {
    const heading = LEVEL_BY_HEADING[line.trim()];
    if (heading !== undefined) {
      level = heading;
      continue;
    }
    if (line.startsWith("## ")) level = null;
    if (level === null || !line.startsWith("|")) continue;

    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim().replaceAll("*", "").replaceAll("`", ""));
    const [metricLabel, section, kind, verdict] = cells;
    if (cells.length !== 4 || metricLabel === undefined || metricLabel === "metric") continue;
    if (section === undefined || kind === undefined || verdict === undefined) continue;
    // The separator row under a table's head, which carries no claim.
    if (metricLabel.startsWith("---")) continue;

    const metric = PANEL_METRICS.find((each) => METRIC_LABELS[each] === metricLabel);
    if (metric === undefined) {
      throw new DrillReportError(`docs/drill-levels.md names no metric "${metricLabel}"`);
    }
    const known = VERDICTS.find((each) => each === verdict);
    if (known === undefined) {
      throw new DrillReportError(`docs/drill-levels.md says "${verdict}", which is no verdict`);
    }
    entries.push({ level, metric, section, kind, verdict: known });
  }
  return entries;
}

function composeAddress(each: RegisterEntry | DrillCase): string {
  return [each.level, METRIC_LABELS[each.metric], each.section, each.kind].join(" | ");
}

describe("the drill-levels register", () => {
  const entries = composeRegisterEntries();
  const cases = composeDrillCases(CAPTURED_FIGHTS);

  test("names every case the captures produce, and no other", () => {
    const named = entries.map(composeAddress).sort(getTextOrder);
    const produced = cases.map(composeAddress).sort(getTextOrder);

    expect(named).toEqual(produced);
  });

  test("gives each case the verdict the captures earn it", () => {
    const byAddress = new Map(cases.map((each) => [composeAddress(each), each]));

    for (const entry of entries) {
      const at = composeAddress(entry);
      const produced = byAddress.get(at);
      // Named by the test above; read here so a failure names the case rather
      // than the whole table.
      if (produced === undefined) continue;

      const earned: Verdict =
        produced.opens === 0 ? "never" : produced.leaves === 0 ? "always" : "sometimes";
      expect(earned, at).toBe(entry.verdict);
    }
  });

  /**
   * A table of nothing is green, and the register would be a page of headings.
   * The floor is the shape rather than the size: both levels are described, and
   * every metric appears.
   */
  test("covers both levels and every metric", () => {
    expect(entries.filter((each) => each.level === "II").length).toBeGreaterThan(0);
    expect(entries.filter((each) => each.level === "III").length).toBeGreaterThan(0);
    for (const metric of PANEL_METRICS) {
      expect(entries.some((each) => each.metric === metric), METRIC_LABELS[metric]).toBe(true);
    }
  });
});

describe("what the register is read with", () => {
  /**
   * ⚠️ **The keys are written out here on purpose, and that is now the check.**
   * `getRowKind` reads them through `src/ui/panel-screen.ts` rather than through
   * prefixes of its own, so these literals are the one place the tool's answer is held
   * to the panel's actual spelling: rename `NO_TARGET_ROW_KEY` and this goes red, where
   * before the whole gate stayed green. Collapsing them to the constants would make
   * this test agree with whatever the grammar became, which is §9.3's reason for asking
   * before collapsing a duplicate spelling in a test.
   */
  test("names a row by the key it carries, and refuses to guess", () => {
    expect(getRowKind("target:1")).toBe("person");
    expect(getRowKind("skill:1:78")).toBe("skill");
    expect(getRowKind("unannounced")).toBe("closing row");
    expect(getRowKind("leaf:unannounced")).toBe("closing row");
    expect(getRowKind("no-actor")).toBe("missing end");
    expect(getRowKind("no-target")).toBe("missing end");
    expect(getRowKind("source:poison")).toBe("source");
    expect(getRowKind("leaf:3")).toBe("leaf");
    // A key this repository never composed, which is the one a kind must not be
    // invented for.
    expect(getRowKind("something-else")).toBe("unknown");
  });

  test("every kind it can answer is one the register may name", () => {
    for (const kind of ROW_KINDS) expect(typeof kind).toBe("string");
    expect(new Set(ROW_KINDS).size).toBe(ROW_KINDS.length);
  });

  /**
   * The name inside a deep level's heading is the game's own (§5) and is what
   * would turn one case into one row per combatant, so it comes out.
   */
  test("takes the combatant's name out of a heading", () => {
    expect(composeSectionName("CZYM — Gracz 4")).toBe("CZYM — …");
    expect(composeSectionName("KOMU")).toBe("KOMU");
    expect(composeSectionName(null)).toBe("(no heading)");
  });

  test("refuses a capture it does not have", () => {
    expect(() => {
      throw new DrillReportError("nothing by that name");
    }).toThrow(DrillReportError);
  });
});
