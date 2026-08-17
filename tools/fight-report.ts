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
import { getTextOrder } from "@/libs/text-order.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import {
  composeEmptyCombatantStatistics,
  composeFightStatistics,
  getCombatantIdsInFight,
  type CombatantStatistics,
} from "@/src/core/fight-statistics.ts";
import {
  CAPTURED_FIGHTS,
  composeRosterOfFight,
  getMessagesOfFight,
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

function writeRow(label: string, row: CombatantStatistics): void {
  const figures = [row.dealtRaw, row.dealtApplied, row.taken, row.healed, row.healthLost]
    .map((amount) => composeIntegerText(amount).padStart(NUMBER_COLUMN))
    .join("");
  console.log(`  ${label.slice(0, NAME_COLUMN).padEnd(NAME_COLUMN)}${figures}`);

  // Kept off the numeric row on purpose: these are not in one unit and lining
  // them up under a column heading would invite reading them as if they were.
  const details: Array<[string, string]> = [
    ["by element dealt", composeTokenText(row.dealtAppliedByElement)],
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

function writeFightReport(fight: CapturedFight): void {
  const names = getNameByCombatantId(fight);
  const roster = composeRosterOfFight(fight);
  const statistics = composeFightStatistics(
    decodeFight(
      getMessagesOfFight(fight),
      roster,
    ),
    roster,
  );

  console.log(`\n=== ${fight.name} ===`);
  console.log(
    // "raw(blow)" rather than "raw": damage stated against a name carries no raw
    // figure, so a boss working through `+oth_dmg` lands more than its raw column
    // shows. Two headings that looked comparable would read as an error.
    `  ${"combatant".padEnd(NAME_COLUMN)}${["raw(blow)", "landed", "taken", "healed", "lost"]
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

  console.log(
    `\n  unreadable messages: ${composeIntegerText(statistics.reading.unreadableMessages)}`,
  );
  const worst = [...statistics.reading.messagesByReason]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  for (const [reason, count] of worst) {
    console.log(`    ${composeIntegerText(count).padStart(4)}  ${reason.slice(0, 90)}`);
  }
  // Both sides by name, and no verdict: a capture does not record who recorded
  // it (§10, *side*), so this tool is in no position to say who won *for us*.
  if (statistics.outcome !== null) {
    console.log(`  won:  ${statistics.outcome.wonNames.join(", ") || "(nobody stated)"}`);
    console.log(`  lost: ${statistics.outcome.lostNames.join(", ") || "(nobody stated)"}`);
  }
}

if (import.meta.main) for (const fight of CAPTURED_FIGHTS) writeFightReport(fight);
