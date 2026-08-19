/**
 * What a row opens onto, and which rows open nothing at all.
 *
 * `tools/fight-report.ts` answers *what would the panel show* one figure at a
 * time; this answers the question one level down, which no offline reader had:
 * **is there anything under this row, and what**. It exists because the answer
 * stopped being "always yes" — a row is drillable only where the level below it
 * adds a name the reader did not already have
 * (`docs/specs/2026-08-19-a-row-opens-only-what-it-does-not-say.md`), and a rule
 * with every breakdown in every recording behind it is not one anybody can check
 * by clicking — the count is what `--cases` prints, never a figure in this
 * sentence (§5).
 *
 * Two zooms on one question. `<fight> [metric]` prints the screens of one
 * recording, marking each row; `--cases` folds every recording into the table
 * `docs/drill-levels.md` states, so the register can be read against the tree
 * rather than against memory.
 *
 * It composes the panel's own views rather than reasoning about them, for the
 * reason the rule itself does: a second account of what is under a row is one
 * that drifts, and nothing would be loud about it (§9.3).
 */

import { composeIntegerText } from "@/libs/number.ts";
import { getTextOrder } from "@/libs/text-order.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import {
  METRIC_LABELS,
  PANEL_METRICS,
  type PanelMetric,
} from "@/src/ui/panel-metric.ts";
import type { PanelReading } from "@/src/ui/panel-reading.ts";
import {
  composeLeafRowKey,
  getRowKeyKind,
  NO_ACTOR_ROW_KEY,
  NO_TARGET_ROW_KEY,
  UNANNOUNCED_ROW_KEY,
} from "@/src/ui/panel-row-key.ts";
import { composeDefaultState, composeStateFromRow } from "@/src/ui/panel-state.ts";
import { composePanelView } from "@/src/ui/panel-view.ts";
import {
  CAPTURED_FIGHTS,
  composeRosterOfFight,
  getMessagesOfFight,
  type CapturedFight,
} from "@/tests/captured-fight-catalog.ts";
import { MargoMeterToolError } from "@/tools/margometer-tool-error.ts";

export class DrillReportError extends MargoMeterToolError {
  constructor(message: string, options?: ErrorOptions) {
    super("DrillReport", message, options);
  }
}

/**
 * What a row is, by the key it carries.
 *
 * The key is composed in `src/ui/panel-row-key.ts` and read there; this reads it
 * for a third purpose — describing a row rather than opening one. A key nobody
 * has met answers `unknown`, which is louder than guessing, and `docs/drill-levels.md`
 * is written in these words so the register and this tool cannot drift.
 */
export const ROW_KINDS = [
  "person",
  "skill",
  "closing row",
  "missing end",
  "source",
  "leaf",
  "unknown",
] as const;
export type RowKind = (typeof ROW_KINDS)[number];

/**
 * ⚠️ **This took the keys apart with a grammar of its own, and nothing caught
 * the disagreement.** `src/ui/panel-row-key.ts` exists so that the divider and the
 * word either side of it are decided in one place; this file read them back with
 * four prefixes and two whole keys spelled here — a fourth reader of a grammar
 * three files had already been made to share. A mutation renaming
 * `NO_TARGET_ROW_KEY` survived the whole gate, and `docs/drill-levels.md` is
 * written from this classification and guarded against it, so the register would
 * have followed the drift rather than caught it
 * (`docs/audits/2026-08-19-the-whole-tree-read-a-fourth-time.md`, F5).
 */
export function getRowKind(key: string): RowKind {
  if (key === UNANNOUNCED_ROW_KEY || key === composeLeafRowKey(UNANNOUNCED_ROW_KEY)) {
    return "closing row";
  }
  if (key === NO_ACTOR_ROW_KEY || key === NO_TARGET_ROW_KEY) return "missing end";
  const kind = getRowKeyKind(key);
  if (kind === "target") return "person";
  if (kind === "skill") return "skill";
  if (kind === "source") return "source";
  if (kind === "leaf") return "leaf";
  return "unknown";
}

/**
 * A heading with the name inside it taken out.
 *
 * `CZYM — Gracz 4` and `CZYM — Hildur` are one section of the register and a
 * hundred rows of a table if the name stays in. The name is the game's own (§5),
 * which is the second reason it goes.
 *
 * The ranking's list carries no heading at all; nothing here composes a ranking,
 * so that is a shape this tool was handed rather than one it produces, and it is
 * named rather than assumed away.
 */
export function composeSectionName(heading: string | null): string {
  if (heading === null) return "(no heading)";
  const divider = heading.indexOf(" — ");
  return divider < 0 ? heading : `${heading.slice(0, divider)} — …`;
}

/** One cell of the register: how often this kind of row opened, and how often not. */
export type DrillCase = {
  level: "II" | "III";
  metric: PanelMetric;
  section: string;
  kind: RowKind;
  opens: number;
  leaves: number;
};

function composeReadingOfFight(fight: CapturedFight): PanelReading {
  const roster = composeRosterOfFight(fight);
  return {
    statistics: composeFightStatistics(
      decodeFight(getMessagesOfFight(fight), roster),
      roster,
      // The same reading the panel is handed, or the team heals go unsized and
      // most of the healing drill is simply absent (`src/game/battle-session.ts`).
      fight.entryHealthByCombatantId,
    ),
    roster,
    ourSide: null,
    isFromFightStart: true,
  };
}

/** Every case one recording produces, folded into `into`. */
function setDrillCasesOfFight(
  fight: CapturedFight,
  into: Map<string, DrillCase>,
): void {
  const reading = composeReadingOfFight(fight);

  const setCase = (
    level: DrillCase["level"],
    metric: PanelMetric,
    heading: string | null,
    key: string,
    isDrillable: boolean,
  ): void => {
    const section = composeSectionName(heading);
    const kind = getRowKind(key);
    const at = [level, metric, section, kind].join("|");
    const held = into.get(at) ?? { level, metric, section, kind, opens: 0, leaves: 0 };
    if (isDrillable) held.opens += 1;
    else held.leaves += 1;
    into.set(at, held);
  };

  for (const metric of PANEL_METRICS) {
    for (const focusCombatantId of reading.statistics.byCombatantId.keys()) {
      const state = { ...composeDefaultState(), metric, focusCombatantId };
      for (const list of composePanelView(reading, state).lists) {
        for (const row of list.rows) {
          setCase("II", metric, list.heading, row.key, row.isDrillable);
          if (!row.isDrillable) continue;
          const deep = composePanelView(reading, {
            ...state,
            ...composeStateFromRow(state, row.key),
          });
          for (const under of deep.lists) {
            for (const deepRow of under.rows) {
              setCase("III", metric, under.heading, deepRow.key, deepRow.isDrillable);
            }
          }
        }
      }
    }
  }
}

export function composeDrillCases(fights: readonly CapturedFight[]): DrillCase[] {
  const cases = new Map<string, DrillCase>();
  for (const fight of fights) setDrillCasesOfFight(fight, cases);
  return [...cases.values()].sort(
    (one, other) =>
      getTextOrder(one.level, other.level) ||
      PANEL_METRICS.indexOf(one.metric) - PANEL_METRICS.indexOf(other.metric) ||
      getTextOrder(one.section, other.section) ||
      getTextOrder(one.kind, other.kind),
  );
}

/** Wide enough for the counts every capture together produces. */
const COUNT_COLUMN = 6;

function writeCases(cases: readonly DrillCase[]): void {
  console.log("level   metric         section                   row kind             opens  leaf");
  for (const each of cases) {
    console.log(
      `  ${each.level.padEnd(6)}${METRIC_LABELS[each.metric].padEnd(15)}` +
        `${each.section.padEnd(26)}${each.kind.padEnd(20)}` +
        `${composeIntegerText(each.opens).padStart(COUNT_COLUMN)}` +
        `${composeIntegerText(each.leaves).padStart(COUNT_COLUMN)}`,
    );
  }
}

function writeScreensOfFight(fight: CapturedFight, only: PanelMetric | null): void {
  const reading = composeReadingOfFight(fight);
  console.log(`\n=== ${fight.name} ===`);

  for (const metric of PANEL_METRICS) {
    if (only !== null && metric !== only) continue;
    for (const focusCombatantId of reading.statistics.byCombatantId.keys()) {
      const view = composePanelView(reading, {
        ...composeDefaultState(),
        metric,
        focusCombatantId,
      });
      if (view.lists.length === 0) continue;

      const name = reading.roster.byId.get(focusCombatantId)?.name;
      console.log(
        `\n  ${METRIC_LABELS[metric]} · ${name ?? `#${composeIntegerText(focusCombatantId)}`}`,
      );
      for (const list of view.lists) {
        console.log(`    [${list.heading}] ${list.totalText}`);
        for (const row of list.rows) {
          const opens = row.isDrillable ? "opens" : "leaf ";
          console.log(`      ${opens}  ${row.label}  ${row.valueText} ${row.bracketText}`);
        }
      }
    }
  }
}

/** Rows the breakdown level holds, so a run that folded nothing says so. */
function getBreakdownRowCount(cases: readonly DrillCase[]): number {
  return cases
    .filter((each) => each.level === "II")
    .reduce((rows, each) => rows + each.opens + each.leaves, 0);
}

function getFightNamed(name: string): CapturedFight {
  const fight = CAPTURED_FIGHTS.find((each) => each.name === name);
  if (fight === undefined) {
    throw new DrillReportError(
      `no capture named ${name} — run with --cases, or one of:\n  ` +
        CAPTURED_FIGHTS.map((each) => each.name).join("\n  "),
    );
  }
  return fight;
}

function getMetricNamed(name: string): PanelMetric {
  const metric = PANEL_METRICS.find((each) => each === name);
  if (metric === undefined) {
    throw new DrillReportError(`no metric named ${name} — one of: ${PANEL_METRICS.join(", ")}`);
  }
  return metric;
}

function writeReport(argv: readonly string[]): void {
  const [first, second] = argv;
  if (first === undefined || first === "--cases") {
    const cases = composeDrillCases(CAPTURED_FIGHTS);
    writeCases(cases);
    console.log(
      `\n${composeIntegerText(getBreakdownRowCount(cases))} breakdown rows over ` +
        `${composeIntegerText(CAPTURED_FIGHTS.length)} captures. ` +
        "One fight, in detail: bun tools/drill-report.ts <fight> [metric]",
    );
    return;
  }
  writeScreensOfFight(getFightNamed(first), second === undefined ? null : getMetricNamed(second));
}

if (import.meta.main) writeReport(process.argv.slice(2));
