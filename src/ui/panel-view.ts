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
import type { CombatantRoster } from "@/src/core/combatant-roster.ts";
import type {
  CombatantStatistics,
  FightStatistics,
} from "@/src/core/fight-statistics.ts";
import { getProfessionColour } from "@/src/ui/panel-tokens.ts";

/**
 * What the panel is handed.
 *
 * Declared here rather than imported from `src/game/battle-session.ts`, where the
 * running add-on composes it. §9.1 lets `ui` depend on `core` and on `libs`, and
 * names no direction from `ui` to `game`; a type import is still a direction, and
 * it is the one that would make the panel unusable without an engine.
 *
 * `FightReading` satisfies this structurally, so the entry point — the one file
 * that may know both — keeps passing the same value through untouched.
 */
export type PanelReading = {
  statistics: FightStatistics;
  roster: CombatantRoster;
  /** Which side is the watcher's own, when the game said. Never guessed. */
  ourSide: number | null;
  isFromFightStart: boolean;
};

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

/**
 * A short static mark beside a figure, and what it means for whoever reads it.
 *
 * §9.6: quiet by default, detail on demand. The mark is the whole of what is
 * always on screen; `detail` is what the reader asks for by hovering, and it is
 * the only place a sentence is allowed to be long.
 */
export type PanelMark = {
  text: string;
  detail: string;
};

export type PanelSection = {
  heading: string;
  totalText: string;
  /**
   * Set when this total may be short of what happened.
   *
   * At the total rather than in a banner, because the question a reader has is
   * *can I trust this number* — so the answer belongs beside that number (§9.6,
   * and `docs/specs/2026-08-10-panel-and-tabs.md` lists the banner under its
   * rejected alternatives).
   */
  totalMark: PanelMark | null;
  rows: PanelRow[];
};

/**
 * Who is fighting whom, and the state of the reading.
 *
 * The first of the three regions the panel spec describes, and the one that
 * carries a claim no single total can: joining late does not make a figure low,
 * it makes every figure belong to a different fight.
 */
export type PanelHeader = {
  title: string;
  /** How the fight ended, when the log said so. Null while it is still going. */
  outcomeText: string | null;
  /**
   * What qualifies the whole panel rather than one figure: that the fight was
   * joined late, and — only when there is no total to put it on — that something
   * went unread. Never the same claim twice.
   */
  marks: PanelMark[];
};

export type PanelView = {
  metric: PanelMetric;
  tabs: Array<{ metric: PanelMetric; label: string; isSelected: boolean }>;
  header: PanelHeader;
  sections: PanelSection[];
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
 * The mark every total carries while anything went unread, or null.
 *
 * One mark, composed once and shared by every section, because the claim it
 * makes is about the reading and not about a particular side: the decoder does
 * not say which total a message it could not read belonged to. Attaching it to
 * only some totals would be the guess this project refuses to make.
 *
 * The detail names the **keys**, commonest first, and falls back to the decoder's
 * prose only where there is no key to name — a message whose grammar failed
 * before it had parameters. A key is what a reader can act on: it can be looked
 * up in `docs/protocol-keys.md` and quoted to us verbatim, and a sentence cannot.
 */
function composeSuspectMark(reading: PanelReading): PanelMark | null {
  const { unreadableMessages, messagesByReason, occurrencesByUnreadKey, unaccountedHealthBySource } =
    reading.statistics.reading;
  if (unreadableMessages === 0 && unaccountedHealthBySource.size === 0) return null;

  const lines: string[] = [];

  /**
   * The stronger claim first, because it is the one that is certain.
   *
   * An unread key means a total *may* be low. This means healing *is* low, by an
   * amount the protocol never states — it heals a whole side and names only the
   * caster. Ranking it below "3× step" would bury the only line here that is not
   * a maybe.
   */
  if (unaccountedHealthBySource.size > 0) {
    const occurrences = [...unaccountedHealthBySource.values()].reduce(
      (running, count) => running + count,
      0,
    );
    lines.push(
      `${composeFigureText(occurrences)} heals reached a whole side at once. The protocol names only the caster, so this healing is counted for nobody and the healing figures are low.`,
    );
    lines.push(...[...unaccountedHealthBySource.keys()].sort());
  }

  if (unreadableMessages > 0) {
    const named = occurrencesByUnreadKey.size > 0 ? occurrencesByUnreadKey : messagesByReason;
    lines.push(
      `${composeFigureText(unreadableMessages)} messages were not fully read, so this total may be low.`,
    );
    lines.push(
      ...[...named]
        .sort(([, one], [, other]) => other - one)
        .map(([what, count]) => `${composeFigureText(count)}× ${what}`),
    );
  }

  return { text: "!", detail: lines.join("\n") };
}

/**
 * One section per side, biggest figure first, and the player's own side first
 * among the sections when the game said which it is.
 *
 * When it did not, the sides keep their own order and neither is called ours —
 * silence is not a reason to guess (`src/core/combatant-roster.ts`).
 */
function composeSideSections(reading: PanelReading, metric: PanelMetric): PanelSection[] {
  const sides = [...reading.statistics.bySide].sort(([one], [other]) => {
    if (reading.ourSide === one) return -1;
    if (reading.ourSide === other) return 1;
    return one - other;
  });

  return sides.map(([side, group]) => {
    const total = getMetricValue(group.totals, metric);
    const rows = composeRankedRows(reading, group.combatantIds, metric, total);

    const heading = reading.ourSide === side ? "Us" : reading.ourSide === null ? `Side ${composeIntegerText(side)}` : "Them";
    return {
      heading,
      totalText: composeFigureText(total),
      totalMark: composeSuspectMark(reading),
      rows,
    };
  });
}

/**
 * Combatants the roster could not place on a side, in a section of their own.
 *
 * The aggregate keeps them apart rather than dropping them or putting them on a
 * side that would then be wrong (`src/core/fight-statistics.ts`), and this is
 * where that promise is kept. Without it their figures are counted and then never
 * drawn — a total that is quietly short, which is §9.6's "Vanish" and the exact
 * shape of wrongness this project exists to prevent. Everyone lands here when a
 * fight was joined with no roster at all, so it is not a rare path.
 *
 * Shown whenever anyone is in it, unlike the unattributed section below: there,
 * an empty section means nothing happened; here it means people are missing.
 */
function composeUnplacedSection(reading: PanelReading, metric: PanelMetric): PanelSection[] {
  const combatantIds = reading.statistics.combatantIdsWithoutSide;
  if (combatantIds.length === 0) return [];

  const total = combatantIds.reduce((running, combatantId) => {
    const row = reading.statistics.byCombatantId.get(combatantId);
    return running + (row === undefined ? 0 : getMetricValue(row, metric));
  }, 0);

  return [
    {
      heading: "Side not stated",
      totalText: composeFigureText(total),
      totalMark: composeSuspectMark(reading),
      rows: composeRankedRows(reading, combatantIds, metric, total),
    },
  ];
}

/** One row per combatant, biggest figure first. Shared by both sections above. */
function composeRankedRows(
  reading: PanelReading,
  combatantIds: readonly number[],
  metric: PanelMetric,
  total: number,
): PanelRow[] {
  return combatantIds
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
  reading: PanelReading,
  metric: PanelMetric,
): PanelSection[] {
  const value = getMetricValue(reading.statistics.unattributed, metric);
  if (value === 0) return [];

  return [
    {
      heading: "Nobody the log names",
      totalText: composeFigureText(value),
      totalMark: composeSuspectMark(reading),
      rows: [composeRow("unattributed", null, value, value)],
    },
  ];
}

/**
 * Who is fighting whom, and how far the reading can be trusted at all.
 *
 * The two things the panel says about its own trustworthiness are different
 * claims and are kept apart on screen. Joining late means the numbers are **not
 * this fight** — measured, a fight can arrive entirely in one payload — so it
 * qualifies every figure and belongs here. That anything went unread means a
 * particular total may be **a little low**, so it belongs on that total and is
 * `composeSuspectMark`'s job. Collapsing the two would make the first look
 * survivable.
 */
function composeHeader(reading: PanelReading, sections: readonly PanelSection[]): PanelHeader {
  const sizes = [...reading.statistics.bySide]
    .sort(([one], [other]) => {
      if (reading.ourSide === one) return -1;
      if (reading.ourSide === other) return 1;
      return one - other;
    })
    .map(([, group]) => composeIntegerText(group.combatantIds.length));

  const unplaced = reading.statistics.combatantIdsWithoutSide.length;
  const title =
    sizes.length > 0
      ? `${sizes.join(" v ")}${unplaced > 0 ? ` +${composeIntegerText(unplaced)}` : ""}`
      : "no roster";

  const marks: PanelMark[] = [];
  if (!reading.isFromFightStart) {
    marks.push({
      text: "!",
      detail:
        "Joined after this fight began, so these are not its totals. A fight can arrive entirely in one payload, so what is missing may be all of it.",
    });
  }

  /**
   * ⚠️ **Without this the warning disappears in the one case that needs it
   * most.** The suspect mark rides a section total, and a fight where nothing
   * could be read has no sections — so a panel that failed completely showed a
   * clean empty panel, which is precisely "a number that might be wrong looking
   * like one that is right". Here it is not a duplicate: there is no total for it
   * to sit beside.
   */
  const suspect = sections.length === 0 ? composeSuspectMark(reading) : null;
  if (suspect !== null) marks.push(suspect);

  return {
    title,
    outcomeText: reading.statistics.outcome === null ? null : reading.statistics.outcome.result,
    marks,
  };
}

export function composePanelView(reading: PanelReading, metric: PanelMetric): PanelView {
  const sections = [
    ...composeSideSections(reading, metric),
    ...composeUnplacedSection(reading, metric),
    ...composeUnattributedSection(reading, metric),
  ];

  return {
    metric,
    tabs: PANEL_METRICS.map((each) => ({
      metric: each,
      label: METRIC_LABELS[each],
      isSelected: each === metric,
    })),
    header: composeHeader(reading, sections),
    sections,
  };
}
