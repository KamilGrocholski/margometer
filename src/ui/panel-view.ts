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
import { getCombatantIdByName, type CombatantRoster } from "@/src/core/combatant-roster.ts";
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
  /**
   * Who this row is, so a click can name them without the panel reading a name
   * back off the screen. Null for the row that belongs to nobody, which is also
   * the row with nothing to open.
   */
  combatantId: number | null;
  name: string;
  /** Bar colour. Says what somebody is; the name says who. */
  colour: string;
  /**
   * Which side this combatant is on, as a word.
   *
   * The list is one flat ranking, so the side is no longer carried by which
   * heading a row sits under and has to be said on the row itself. It is text
   * rather than a coloured dot because §9.7 forbids colour carrying a meaning
   * alone, and a dot beside the word would only repeat it.
   */
  sideText: string | null;
  /** Position in this section by value. Nobody is rank 0. */
  rankText: string;
  value: number;
  valueText: string;
  /** Share of the section's total, 0–1. Written, no longer drawn. */
  share: number;
  shareText: string;
  /**
   * How long the bar is, 0–1, **against the largest row in the section** rather
   * than against the total.
   *
   * ⚠️ **The bar and the printed share are now different quantities.** The bar
   * compares this row with the top row; the percentage beside it is still the
   * share of the section's total. So the bar can no longer be read off as a
   * number — it ranks, and the figures state. The alternative was printing the
   * leader-relative percentage, which is a number about another row rather than
   * about this one.
   */
  barLength: number;
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

/**
 * What one combatant's figures hold, opened beside the ranking.
 *
 * Every group here is already in `CombatantStatistics`; none of it is computed
 * (§9.1). Groups whose map is empty are absent rather than drawn as zero — a
 * combatant nothing was prevented against did not prevent nothing, the protocol
 * simply never mentioned it.
 */
export type PanelDetail = {
  name: string;
  /**
   * `isTokens` marks a group whose text is a list of the protocol's own tokens
   * rather than one figure. They are laid out differently because they are read
   * differently: a single figure is compared with the one above it, and a token
   * list is read across. Right-aligning a long list wraps it mid-token.
   */
  groups: Array<{ label: string; text: string; isTokens: boolean }>;
  /** Said in the panel rather than left to the reader to wonder about. */
  note: string;
};

/** One line of the footer, and whether it is certain or only suspected. */
export type PanelFooterLine = {
  text: string;
  isCertain: boolean;
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
  /**
   * The same gaps the totals are marked with, spelled out at the foot.
   *
   * ⚠️ **This does not replace the mark at the total** and must not be allowed
   * to. §9.6 puts the warning where the consequence is, and the panel spec
   * rejected a banner *instead of* that mark. This is a summary in addition: the
   * mark answers "can I trust this figure", the footer answers "what happened",
   * and only the second fits a sentence.
   */
  footer: PanelFooterLine[];
  /** The combatant whose figures are open beside the panel, if any. */
  detail: PanelDetail | null;
  /** Who that is, so the row they belong to can be drawn as chosen. */
  selectedCombatantId: number | null;
};

/** Thousands spaced, as the game itself writes them. */
export function composeFigureText(value: number): string {
  return composeIntegerText(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function composeShareText(share: number): string {
  return `${composeDecimalText(share * 100, 0)}%`;
}

function composeRow(
  combatantId: number | null,
  name: string,
  profession: string | null,
  sideText: string | null,
  rank: number,
  value: number,
  total: number,
  leader: number,
): PanelRow {
  // A zero total would make every share `NaN`, which renders as a bar of no
  // length and a label reading "NaN%" — a number nobody wrote (§9.5). The
  // leader is guarded for the same reason and separately, because a section can
  // have a total while its largest row is zero only if some row is negative,
  // and neither figure may be assumed from the other.
  const share = total > 0 ? value / total : 0;
  return {
    combatantId,
    name,
    colour: getProfessionColour(profession),
    sideText,
    rankText: composeIntegerText(rank),
    value,
    valueText: composeFigureText(value),
    share,
    shareText: composeShareText(share),
    barLength: leader > 0 ? value / leader : 0,
  };
}

/**
 * Which side a combatant is on, in the words the panel may use.
 *
 * "us" and "them" are only available once the game has stated `myteam`; until
 * then the side is named by its own number, because calling one of them ours
 * would be the guess `src/core/combatant-roster.ts` refuses to make. A combatant
 * the roster could not place says so rather than being left blank.
 */
function composeSideText(reading: PanelReading, side: number | null): string {
  if (side === null) return "s?";
  if (reading.ourSide === null) return `s${composeIntegerText(side)}`;
  return reading.ourSide === side ? "us" : "them";
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
  const lines = composeReadingGapLines(reading);
  if (lines.length === 0) return null;
  return { text: "!", detail: lines.map((line) => line.text).join("\n") };
}

/**
 * What the reading is short of, as lines, certain ones first.
 *
 * One composer for both places this is said — the mark's detail and the footer.
 * Written twice they would drift, and the two spellings would then disagree
 * about the same fight on the same screen.
 *
 * The stronger claim leads, because it is the one that is certain. An unread key
 * means a total *may* be low; an unaccounted heal means healing **is** low, by
 * an amount the protocol never states — it reaches a whole side and names only
 * the caster. Ranking that below "3× step" would bury the only line here that is
 * not a maybe.
 */
function composeReadingGapLines(reading: PanelReading): PanelFooterLine[] {
  const { unreadableMessages, messagesByReason, occurrencesByUnreadKey, unaccountedHealthBySource } =
    reading.statistics.reading;

  const lines: PanelFooterLine[] = [];

  if (unaccountedHealthBySource.size > 0) {
    const occurrences = [...unaccountedHealthBySource.values()].reduce(
      (running, count) => running + count,
      0,
    );
    lines.push({
      isCertain: true,
      text: `${composeFigureText(occurrences)} heals reached a whole side at once. The protocol names only the caster, so this healing is counted for nobody and the healing figures are low.`,
    });
    lines.push(
      ...[...unaccountedHealthBySource.keys()]
        .sort()
        .map((source) => ({ isCertain: true, text: source })),
    );
  }

  if (unreadableMessages > 0) {
    const named = occurrencesByUnreadKey.size > 0 ? occurrencesByUnreadKey : messagesByReason;
    lines.push({
      isCertain: false,
      text: `${composeFigureText(unreadableMessages)} messages were not fully read, so this total may be low.`,
    });
    lines.push(
      ...[...named]
        .sort(([, one], [, other]) => other - one)
        .map(([what, count]) => ({
          isCertain: false,
          text: `${composeFigureText(count)}× ${what}`,
        })),
    );
  }

  return lines;
}

/**
 * Everyone in one ranking, whichever side they are on.
 *
 * ⚠️ **The total this ranks against is the whole fight's, not one side's**, and
 * that changes what the percentage beside each figure means: it is now the share
 * of everything that happened, so an enemy can outrank the party in the party's
 * own meter and the shares of both sides sum to one. Two headings and two totals
 * said something narrower and said it per side; this says something wider and
 * says it once. Which is wanted is a judgement, and it is recorded in
 * `docs/specs/2026-08-10-panel-and-tabs.md` rather than left to whoever reads
 * this function.
 *
 * Combatants the roster could not place are in the same list rather than in a
 * section of their own — they say `s?` on the row. The promise that keeps
 * (`src/core/fight-statistics.ts` holds them apart so their figures are drawn
 * rather than silently dropped) is kept by listing them, not by heading them.
 */
function composeEveryoneSection(reading: PanelReading, metric: PanelMetric): PanelSection[] {
  const combatantIds = [
    ...[...reading.statistics.bySide]
      .sort(([one], [other]) => {
        if (reading.ourSide === one) return -1;
        if (reading.ourSide === other) return 1;
        return one - other;
      })
      .flatMap(([, group]) => group.combatantIds),
    ...reading.statistics.combatantIdsWithoutSide,
  ];

  if (combatantIds.length === 0) return [];

  const total = combatantIds.reduce((running, combatantId) => {
    const row = reading.statistics.byCombatantId.get(combatantId);
    return running + (row === undefined ? 0 : getMetricValue(row, metric));
  }, 0);

  return [
    {
      heading: "Everyone",
      totalText: composeFigureText(total),
      totalMark: composeSuspectMark(reading),
      rows: composeRankedRows(reading, combatantIds, metric, total),
    },
  ];
}

/** One row per combatant, biggest figure first, ranked and sized in one pass. */
function composeRankedRows(
  reading: PanelReading,
  combatantIds: readonly number[],
  metric: PanelMetric,
  total: number,
): PanelRow[] {
  const measured = combatantIds
    .map((combatantId) => {
      const row = reading.statistics.byCombatantId.get(combatantId);
      const combatant = reading.roster.byId.get(combatantId);
      return {
        combatantId,
        name: combatant?.name ?? `#${composeIntegerText(combatantId)}`,
        profession: combatant?.profession ?? null,
        sideText: composeSideText(reading, combatant?.side ?? null),
        value: row === undefined ? 0 : getMetricValue(row, metric),
      };
    })
    .sort((one, other) => other.value - one.value);

  const leader = measured.reduce((largest, row) => Math.max(largest, row.value), 0);

  return measured.map((row, index) =>
    composeRow(
      row.combatantId,
      row.name,
      row.profession,
      row.sideText,
      index + 1,
      row.value,
      total,
      leader,
    ),
  );
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
      // No side, because that is the whole claim: the log ties this to nobody,
      // so it belongs to neither of them.
      rows: [composeRow(null, "unattributed", null, null, 1, value, value, value)],
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

  return { title, outcomeText: getOutcomeText(reading), marks };
}

/** Whether any of those names belongs to somebody on the watcher's own side. */
function hasOurSide(reading: PanelReading, names: readonly string[]): boolean {
  return names.some((name) => {
    // Null for a name two combatants answer to, and the roster is right to
    // refuse it — an ambiguous name is checked against the rest of the list
    // instead of being resolved to whoever came first.
    const id = getCombatantIdByName(reading.roster, name);
    return id !== null && reading.roster.byId.get(id)?.side === reading.ourSide;
  });
}

/**
 * "won" or "lost" **from the watcher's seat**, or nothing at all.
 *
 * The protocol names both sides and says nothing about which is the reader's, so
 * the answer is composed here, where `ourSide` is: the outcome is ours if one of
 * the names on a side resolves to a combatant on it. Where the game never said
 * `myteam`, or where no name resolves, the header says nothing — a fight the
 * panel cannot place is not a fight it may call a loss.
 */
function getOutcomeText(reading: PanelReading): string | null {
  const outcome = reading.statistics.outcome;
  if (outcome === null || reading.ourSide === null) return null;
  if (hasOurSide(reading, outcome.wonNames)) return "won";
  if (hasOurSide(reading, outcome.lostNames)) return "lost";
  return null;
}

/** `token figure  token figure`, or null when the map holds nothing. */
function composeTokenText(counts: ReadonlyMap<string, number>): string | null {
  if (counts.size === 0) return null;
  return [...counts]
    .sort(([, one], [, other]) => other - one)
    .map(([token, count]) => `${token} ${composeFigureText(count)}`)
    .join("   ");
}

/**
 * One combatant's figures, opened beside the ranking.
 *
 * Nothing here is computed and nothing here is new: every group is a field of
 * `CombatantStatistics` that the ranking has no room for. `dealtRaw` is labelled
 * rather than shown bare, because it is the one figure on this list that is not
 * comparable between combatants — damage the protocol states against a name
 * carries no raw twin, so a combatant working through area damage has a raw
 * figure smaller than what they landed.
 */
export function composeCombatantDetail(
  reading: PanelReading,
  combatantId: number,
): PanelDetail | null {
  const row = reading.statistics.byCombatantId.get(combatantId);
  const combatant = reading.roster.byId.get(combatantId);
  if (row === undefined) return null;

  const name = combatant?.name ?? `#${composeIntegerText(combatantId)}`;
  const groups: Array<{ label: string; text: string; isTokens: boolean }> = [
    { label: "landed", text: composeFigureText(row.dealtApplied), isTokens: false },
    { label: "raw, blows only", text: composeFigureText(row.dealtRaw), isTokens: false },
    { label: "taken", text: composeFigureText(row.taken), isTokens: false },
    { label: "healed", text: composeFigureText(row.healed), isTokens: false },
  ];

  if (row.healthLost > 0) {
    groups.push({
      label: "health lost",
      text: composeFigureText(row.healthLost),
      isTokens: false,
    });
  }

  // Absent rather than zero: the protocol never mentioning a defence is not the
  // same claim as a defence stopping nothing (§9.6).
  const optional: Array<[string, ReadonlyMap<string, number>]> = [
    ["dealt by element", row.dealtAppliedByElement],
    ["taken by element", row.takenByElement],
    ["prevented", row.prevented],
    ["destroyed", row.destroyed],
    ["procs on blows struck", row.procsOnBlowsStruck],
  ];
  for (const [label, counts] of optional) {
    const text = composeTokenText(counts);
    if (text !== null) groups.push({ label, text, isTokens: true });
  }

  groups.push({
    label: "skills announced",
    text: composeIntegerText(row.skillsUsed),
    isTokens: false,
  });

  return {
    name,
    groups,
    note: "No per-skill split: the protocol never joins a skill to its damage.",
  };
}

export function composePanelView(
  reading: PanelReading,
  metric: PanelMetric,
  selectedCombatantId: number | null = null,
): PanelView {
  const sections = [
    ...composeEveryoneSection(reading, metric),
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
    footer: composeReadingGapLines(reading),
    detail:
      selectedCombatantId === null ? null : composeCombatantDetail(reading, selectedCombatantId),
    selectedCombatantId,
  };
}
