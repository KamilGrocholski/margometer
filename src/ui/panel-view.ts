/**
 * What the panel shows, as data.
 *
 * The drawing is a separate file and a thin one, because everything worth
 * getting right is here: which rows exist, in what order, how long each bar is,
 * and which figures cannot be trusted. None of that needs a browser to check,
 * and there is no browser in the test runner.
 *
 * §9.1 holds even inside `ui/`: nothing here computes a statistic. It takes what
 * the aggregate produced and decides how to present it.
 */

import { composeDecimalText, composeIntegerText } from "@/libs/number.ts";
import type { CombatantStatistics } from "@/src/core/fight-statistics.ts";
import type { FightReading } from "@/src/game/battle-session.ts";
import { getProfessionColour } from "@/src/ui/panel-tokens.ts";

/**
 * The metrics a tab can rank by.
 *
 * `dealtRaw` is deliberately not among them: damage stated against a name
 * carries no raw figure, so ranking by it would sort combatants by how the
 * protocol happens to describe their damage rather than by what they did
 * (`docs/specs/2026-08-10-panel-and-tabs.md`).
 */
export const PANEL_METRICS = ["dealt", "taken", "healed"] as const;

export type PanelMetric = (typeof PANEL_METRICS)[number];

const METRIC_LABELS: Record<PanelMetric, string> = {
  dealt: "Dealt",
  taken: "Taken",
  healed: "Healed",
};

function getMetricValue(row: CombatantStatistics, metric: PanelMetric): number {
  if (metric === "dealt") return row.dealtApplied;
  if (metric === "taken") return row.taken;
  return row.healed;
}

export type PanelRow = {
  name: string;
  /** Bar colour. Says what somebody is; the name says who. */
  colour: string;
  value: number;
  valueText: string;
  /** Share of the section's total, 0–1, for the bar's length. */
  share: number;
  shareText: string;
};

export type PanelSection = {
  heading: string;
  totalText: string;
  rows: PanelRow[];
};

export type PanelView = {
  metric: PanelMetric;
  tabs: Array<{ metric: PanelMetric; label: string; isSelected: boolean }>;
  sections: PanelSection[];
  /**
   * What the panel must say out loud rather than imply, in the order §9.6 ranks
   * them: numbers that are not the fight come before numbers that may be low.
   */
  notices: string[];
};

/** Thousands spaced, as the game itself writes them. */
export function composeFigureText(value: number): string {
  return composeIntegerText(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function composeShareText(share: number): string {
  return `${composeDecimalText(share * 100, 0)}%`;
}

function composeRow(
  name: string,
  profession: string | null,
  value: number,
  total: number,
): PanelRow {
  // A zero total would make every share `NaN`, which renders as a bar of no
  // length and a label reading "NaN%" — a number nobody wrote (§9.5).
  const share = total > 0 ? value / total : 0;
  return {
    name,
    colour: getProfessionColour(profession),
    value,
    valueText: composeFigureText(value),
    share,
    shareText: composeShareText(share),
  };
}

/**
 * One section per side, biggest figure first, and the player's own side first
 * among the sections when the game said which it is.
 *
 * When it did not, the sides keep their own order and neither is called ours —
 * silence is not a reason to guess (`src/core/combatant-roster.ts`).
 */
function composeSideSections(reading: FightReading, metric: PanelMetric): PanelSection[] {
  const sides = [...reading.statistics.bySide].sort(([one], [other]) => {
    if (reading.ourSide === one) return -1;
    if (reading.ourSide === other) return 1;
    return one - other;
  });

  return sides.map(([side, group]) => {
    const total = getMetricValue(group.totals, metric);
    const rows = group.combatantIds
      .map((combatantId) => {
        const row = reading.statistics.byCombatantId.get(combatantId);
        const combatant = reading.roster.byId.get(combatantId);
        return composeRow(
          combatant?.name ?? `#${composeIntegerText(combatantId)}`,
          combatant?.profession ?? null,
          row === undefined ? 0 : getMetricValue(row, metric),
          total,
        );
      })
      .sort((one, other) => other.value - one.value);

    const heading = reading.ourSide === side ? "Us" : reading.ourSide === null ? `Side ${composeIntegerText(side)}` : "Them";
    return { heading, totalText: composeFigureText(total), rows };
  });
}

/**
 * Figures the log ties to nobody, kept as their own section.
 *
 * Shown even when empty is *not* the rule — an empty section is noise. Shown
 * whenever there is anything in it, and never folded into a combatant's row,
 * because attributing it would be the invented number this project exists to
 * prevent (§5).
 */
function composeUnattributedSection(
  reading: FightReading,
  metric: PanelMetric,
): PanelSection[] {
  const value = getMetricValue(reading.statistics.unattributed, metric);
  if (value === 0) return [];

  return [
    {
      heading: "Nobody the log names",
      totalText: composeFigureText(value),
      rows: [composeRow("unattributed", null, value, value)],
    },
  ];
}

/**
 * The two things the panel says about its own trustworthiness, and they are
 * different claims.
 *
 * Joining late means the numbers are **not this fight** — measured, a fight can
 * arrive entirely in one payload. Unread keys mean they may be **a little low**.
 * Collapsing the two into one warning would make the first look survivable.
 */
function composeNotices(reading: FightReading): string[] {
  const notices: string[] = [];
  if (!reading.isFromFightStart) {
    notices.push("Joined after this fight began — these are not its totals.");
  }
  const unread = reading.statistics.reading.unreadableMessages;
  if (unread > 0) {
    notices.push(
      `${composeFigureText(unread)} messages were not fully read — totals may be low.`,
    );
  }
  return notices;
}

export function composePanelView(reading: FightReading, metric: PanelMetric): PanelView {
  return {
    metric,
    tabs: PANEL_METRICS.map((each) => ({
      metric: each,
      label: METRIC_LABELS[each],
      isSelected: each === metric,
    })),
    sections: [
      ...composeSideSections(reading, metric),
      ...composeUnattributedSection(reading, metric),
    ],
    notices: composeNotices(reading),
  };
}
