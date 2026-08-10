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
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics, type CombatantStatistics } from "@/src/core/fight-statistics.ts";
import {
  CAPTURED_FIGHTS,
  composeRosterOfFight,
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
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
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
      fight.dump.calls.flatMap((call) => call.protocolMessages),
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
  const sides = [...statistics.bySide].sort((a, b) => a[0] - b[0]);
  for (const [side, group] of sides) {
    console.log(`  —— side ${side} (${group.combatantIds.length}) ——`);
    const members = group.combatantIds
      .map((combatantId) => [combatantId, statistics.byCombatantId.get(combatantId)] as const)
      .sort((a, b) => (b[1]?.dealtApplied ?? 0) - (a[1]?.dealtApplied ?? 0));
    for (const [combatantId, row] of members) {
      if (row !== undefined) writeRow(names.get(combatantId) ?? `id ${combatantId}`, row);
    }
    writeRow(`side ${side} together`, group.totals);
  }

  if (statistics.combatantIdsWithoutSide.length > 0) {
    console.log("  —— no side the roster could give ——");
    for (const combatantId of statistics.combatantIdsWithoutSide) {
      const row = statistics.byCombatantId.get(combatantId);
      if (row !== undefined) writeRow(names.get(combatantId) ?? `id ${combatantId}`, row);
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
  if (statistics.outcome !== null) {
    console.log(`  outcome: ${statistics.outcome.result}`);
  }
}

if (import.meta.main) for (const fight of CAPTURED_FIGHTS) writeFightReport(fight);
