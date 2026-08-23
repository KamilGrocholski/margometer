/**
 * What a captured fight adds up to, per combatant — the table a panel would draw.
 *
 * The aggregate had no consumer outside its own test, and a number nobody looks
 * at is a number nobody notices is wrong. This prints it against real material,
 * so the totals can be read beside `bun tools/decoding-status.ts` and beside the
 * register before any panel exists to show them.
 *
 * Names come from the capture rather than from the aggregate: the aggregate
 * works in ids, because a name is a display concern and the protocol has more
 * than one combatant answering to some of them.
 */

import { composeIntegerText } from "@/libs/number.ts";
import { getTotalOfValues, setRunningTotal } from "@/libs/running-total.ts";
import { getTextOrder } from "@/libs/text-order.ts";
import {
  composeEmptyCombatantStatistics,
  getCombatantIdsInFight,
  type CombatantStatistics,
  type ReadingGaps,
} from "@/src/core/fight-statistics.ts";
import {
  CAPTURED_FIGHTS,
  composeRosterOfFight,
  composeStatisticsOfFight,
  type CapturedFight,
} from "@/tests/captured-fight-catalog.ts";

const NUMBER_COLUMN = 9;
const NAME_COLUMN = 28;

/** Every combatant the capture knows, so a row can be labelled without guessing. */
function getNameByCombatantId(fight: CapturedFight): Map<number, string> {
  const names = new Map<number, string>();
  for (const call of fight.dump.calls) {
    for (const combatant of [...call.combatantsBefore, ...call.combatantsAfter]) {
      names.set(combatant.id, combatant.name);
    }
  }
  return names;
}

function composeTokenText(totals: ReadonlyMap<string, number>): string {
  if (totals.size === 0) return "—";
  return [...totals]
    .sort((a, b) => b[1] - a[1] || getTextOrder(a[0], b[0]))
    .map(([token, amount]) => `${token} ${composeIntegerText(amount)}`)
    .join("  ");
}

/**
 * What this combatant took off others outside a blow, by key.
 *
 * A column of its own rather than folded into `landed`, and for the panel's own
 * reason: the two are added for the figure a screen ranks by and kept apart
 * everywhere else, because a wound is not a swing (§9.6).
 */
function getCausedBySource(row: CombatantStatistics): Map<string, number> {
  const bySource = new Map<string, number>();
  for (const byTarget of row.healthLostCausedByTargetId.values()) {
    for (const [source, amount] of byTarget) setRunningTotal(bySource, source, amount);
  }
  return bySource;
}

function writeRow(label: string, row: CombatantStatistics): void {
  const figures = [
    row.dealtRaw,
    row.dealtApplied,
    row.healthLostCaused,
    row.taken,
    row.healed,
    row.healthLost,
  ]
    .map((amount) => composeIntegerText(amount).padStart(NUMBER_COLUMN))
    .join("");
  console.log(`  ${label.slice(0, NAME_COLUMN).padEnd(NAME_COLUMN)}${figures}`);

  // Kept off the numeric row on purpose: these are not in one unit and lining
  // them up under a column heading would invite reading them as if they were.
  const details: Array<[string, string]> = [
    ["by element dealt", composeTokenText(row.dealtAppliedByElement)],
    ["by key taken off outside a blow", composeTokenText(getCausedBySource(row))],
    ["by element taken", composeTokenText(row.takenByElement)],
    ["prevented", composeTokenText(row.prevented)],
    ["destroyed", composeTokenText(row.destroyed)],
    ["procs on blows struck", composeTokenText(row.procsOnBlowsStruck)],
  ];
  for (const [caption, text] of details) {
    if (text !== "—") console.log(`  ${" ".repeat(4)}${caption}: ${text}`);
  }
  if (row.skillsUsed > 0) console.log(`      skills announced: ${row.skillsUsed}`);
}

/** The reasons list and the per-key breakdown, indented under their caption. */
function composeTalliedLines(tallies: ReadonlyMap<string, number>, limit: number): string[] {
  return [...tallies]
    .sort((a, b) => b[1] - a[1] || getTextOrder(a[0], b[0]))
    .slice(0, limit)
    .map(([label, count]) => `    ${composeIntegerText(count).padStart(4)}  ${label.slice(0, 90)}`);
}

/**
 * What the reading could not do, in the order the panel warns about it.
 *
 * Both counts print at zero, and that is the point of the block rather than a
 * detail of it: a report silent about a reading looks exactly like a report that
 * never learned to state it, which is the fault this exists to have fixed. The
 * whole corpus reads at zero on both as of 2026-08-23, so a suppressed line here
 * would be a suppressed line everywhere.
 *
 * The certain claim first, the same way `src/ui/panel-view.ts` orders its
 * sentences: unaccounted healing says a total *is* short by an amount the game
 * never stated, where an unreadable message says only that one *may* be.
 */
export function composeReadingLines(reading: ReadingGaps): string[] {
  const unaccounted = getTotalOfValues(reading.unaccountedHealthBySource);
  return [
    // "casts" rather than a bare figure: the tally counts the times a key moved
    // health nobody could size, never the health itself, and a number under a
    // heading of healing would be read as points (§10, *unaccounted*).
    `\n  unaccounted healing: ${composeIntegerText(unaccounted)} casts`,
    ...composeTalliedLines(reading.unaccountedHealthBySource, Number.POSITIVE_INFINITY),
    `  unreadable messages: ${composeIntegerText(reading.unreadableMessages)}`,
    ...composeTalliedLines(reading.messagesByReason, 5),
  ];
}

function writeFightReport(fight: CapturedFight): void {
  const names = getNameByCombatantId(fight);
  const roster = composeRosterOfFight(fight);
  // The same reading the panel is handed, so this report and the panel cannot
  // disagree about a fight (`src/game/battle-session.ts`).
  const statistics = composeStatisticsOfFight(fight);

  console.log(`\n=== ${fight.name} ===`);
  console.log(
    // "raw(blow)" rather than "raw": damage stated against a name carries no raw
    // figure, so a boss working through `+oth_dmg` lands more than its raw column
    // shows. Two headings that looked comparable would read as an error.
    `  ${"combatant".padEnd(NAME_COLUMN)}${["raw(blow)", "landed", "caused", "taken", "healed", "lost"]
      .map((heading) => heading.padStart(NUMBER_COLUMN))
      .join("")}`,
  );

  // Sides in their own order, each with its members under it. Neither side is
  // called "ours": which one that is takes the game layer, so the bare team
  // number is what gets printed.
  //
  // Members come from the roster and not from what was measured, the same way
  // the panel's list does: a combatant nothing has named yet is in the fight on
  // zero. ⚠️ Over a whole capture the two are the same list — every rostered
  // combatant is eventually named, on all of them — so this changes no output
  // here and is about a dump that stops part-way.
  const membersBySide = new Map<number, number[]>();
  const withoutSide: number[] = [];
  for (const combatantId of getCombatantIdsInFight(statistics, roster)) {
    const side = roster.byId.get(combatantId)?.side;
    if (side === undefined) withoutSide.push(combatantId);
    else membersBySide.set(side, [...(membersBySide.get(side) ?? []), combatantId]);
  }

  const getRow = (combatantId: number): CombatantStatistics =>
    statistics.byCombatantId.get(combatantId) ?? composeEmptyCombatantStatistics();

  for (const [side, members] of [...membersBySide].sort((a, b) => a[0] - b[0])) {
    console.log(`  —— side ${side} (${members.length}) ——`);
    for (const combatantId of [...members].sort(
      (one, other) => getRow(other).dealtApplied - getRow(one).dealtApplied,
    )) {
      writeRow(names.get(combatantId) ?? `id ${combatantId}`, getRow(combatantId));
    }
    // The side's own totals, which are the measured ones: a row of zeros adds
    // nothing to them, so this still closes against the figures above it.
    const totals = statistics.bySide.get(side)?.totals;
    if (totals !== undefined) writeRow(`side ${side} together`, totals);
  }

  if (withoutSide.length > 0) {
    console.log("  —— no side the roster could give ——");
    for (const combatantId of withoutSide) {
      writeRow(names.get(combatantId) ?? `id ${combatantId}`, getRow(combatantId));
    }
  }

  console.log("  —— not tied to anyone ——");
  writeRow("unattributed", statistics.unattributed);

  for (const line of composeReadingLines(statistics.reading)) console.log(line);
  // Both sides by name, and no verdict: a capture does not record who recorded
  // it (§10, *side*), so this tool is in no position to say who won *for us*.
  if (statistics.outcome !== null) {
    // A draw states no side at all, so the two lines below would print the same
    // "(nobody stated)" a fight whose outcome went missing prints. It is said
    // once, on its own line, because it is the answer rather than the absence.
    if (statistics.outcome.isDrawn) console.log("  drawn: nobody won this fight");
    console.log(`  won:  ${statistics.outcome.wonNames.join(", ") || "(nobody stated)"}`);
    console.log(`  lost: ${statistics.outcome.lostNames.join(", ") || "(nobody stated)"}`);
  }
}

if (import.meta.main) for (const fight of CAPTURED_FIGHTS) writeFightReport(fight);
