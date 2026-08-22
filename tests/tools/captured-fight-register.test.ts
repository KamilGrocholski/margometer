/**
 * Holds `docs/captured-fights.md` to the material it inventories.
 *
 * The register answers the one question the recordings cannot answer for
 * themselves: what is in them. A filename says `grupa-vs-hildur` and the rest —
 * how many fought, at what levels, in which professions, against a player or a
 * monster — is a megabyte of JSON away. Deciding what material to record next is
 * the decision that inventory exists for, and it is taken often enough that
 * nobody should have to open eighteen files to take it.
 *
 * Which makes the register the exact document §5 is about: every figure in it is
 * one a machine can compute, so writing it down by hand is writing down something
 * that goes stale in silence. The receipt is in this repository — `seventeen
 * captures` is still written in four places, and an eighteenth arrived at
 * `95c1348`. `tests/tools/measured-material.test.ts` misses those because they
 * are spelled in words, deliberately.
 *
 * So the tables are re-earned here, cell by cell, in **both** directions: a row
 * naming a recording the directory does not hold fails, and a recording the
 * directory holds that no row names fails. The failure prints the row to paste
 * in, because a guard that tells you only that you are wrong makes the document
 * cost more than it is worth.
 *
 * ⚠️ **The composer refuses rather than defaults**, which is why so much of this
 * file is `throw`. A profession nobody could read, a level nobody could read, a
 * combatant the payload never said was a player: each of those is an entry the
 * register would otherwise state a count for, and a count that quietly includes
 * an unknown is the fault §9.3 calls loud-not-zero. This runs in a terminal over
 * material on disk, so §9.5 says throwing is the correct behaviour here.
 */

import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { composeIntegerText } from "@/libs/number.ts";
import { setRunningTotal } from "@/libs/running-total.ts";
import { getTextOrder } from "@/libs/text-order.ts";
import { getCombatantIdByName, type CombatantRoster } from "@/src/core/combatant-roster.ts";
import { getOurSideFromBattle } from "@/src/game/engine-roster.ts";
import {
  CAPTURED_FIGHTS,
  composeRosterOfFight,
  composeStatisticsOfFight,
  getMessagesOfFight,
  type CapturedFight,
} from "@/tests/captured-fight-catalog.ts";
import { getPlayerFlagByCombatantId } from "@/tools/fight-dump-parser.ts";
import { MargoMeterToolError } from "@/tools/margometer-tool-error.ts";

export class CapturedFightRegisterError extends MargoMeterToolError {
  constructor(message: string, options?: ErrorOptions) {
    super("CapturedFightRegister", message, options);
  }
}

const REGISTER_PATH = new URL("../../docs/captured-fights.md", import.meta.url).pathname;
const CAPTURED_FIGHTS_DIRECTORY = "tests/captured-fights/";

/**
 * The headings whose tables are read, and nothing else in the document is.
 *
 * Any other `## ` clears the current table, so the prose sections may hold
 * tables of their own for orientation without this guard trying to earn them —
 * the arrangement `docs/drill-levels.md` uses and this one inherits.
 */
const TABLE_BY_HEADING: Record<string, TableName> = {
  "## Shapes": "shapes",
  "## The fights": "fights",
  "## The recordings": "recordings",
};

type TableName = "shapes" | "fights" | "recordings";

/** How many cells a row of each table states. A row of any other width is refused. */
const COLUMNS: Record<TableName, number> = { shapes: 2, fights: 6, recordings: 5 };

type Tables = Record<TableName, string[][]>;

/**
 * One combatant, reduced to what the register states about them.
 *
 * A type of its own so the refusals below can be put to a hand-built side: every
 * capture states all three today, so nothing in the material would exercise them.
 */
type CensusMember = {
  profession: string | null;
  level: number | null;
  isPlayer: boolean | undefined;
};

/** The document's tables, parsed back into rows. */
function composeTablesFromRegister(source: string): Tables {
  const tables: Tables = { shapes: [], fights: [], recordings: [] };
  let table: TableName | null = null;

  for (const line of source.split("\n")) {
    if (line.startsWith("## ")) {
      table = TABLE_BY_HEADING[line.trim()] ?? null;
      continue;
    }
    if (table === null || !line.startsWith("|")) continue;

    // Backticks and emphasis are how a document draws the eye; a verdict somebody
    // bolded must not become a verdict this guard cannot find.
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.replaceAll("`", "").replaceAll("*", "").trim());
    if (cells.every((cell) => /^-+$/.test(cell))) continue;
    if (cells[0] === "recording" || cells[0] === "shape") continue;

    if (cells.length !== COLUMNS[table]) {
      throw new CapturedFightRegisterError(
        `docs/captured-fights.md states a row of ${composeIntegerText(cells.length)} cells under ` +
          `"${table}", which states ${composeIntegerText(COLUMNS[table])}: ${line}`,
      );
    }
    tables[table].push(cells);
  }
  return tables;
}

/** `10 players`, `1 NPC`, `9 players, 1 NPC` — and never a count an unknown is inside. */
function composeKindText(members: readonly CensusMember[]): string {
  const players = members.filter((member) => member.isPlayer === true).length;
  const monsters = members.filter((member) => member.isPlayer === false).length;
  if (players + monsters !== members.length) {
    throw new CapturedFightRegisterError(
      "a combatant the payload never states `npc` for — the register would count them as " +
        "something, and `tools/captured-fight-intake.ts` refuses a recording for the same reason",
    );
  }
  const parts: string[] = [];
  if (players > 0) parts.push(`${composeIntegerText(players)} player${players === 1 ? "" : "s"}`);
  if (monsters > 0) parts.push(`${composeIntegerText(monsters)} NPC${monsters === 1 ? "" : "s"}`);
  return parts.join(", ");
}

/** `h 1, m 2, p 1, t 1, w 4` — the game's own one-letter codes, in code-unit order. */
function composeProfessionText(members: readonly CensusMember[]): string {
  const count = new Map<string, number>();
  for (const member of members) {
    if (member.profession === null) {
      throw new CapturedFightRegisterError(
        "a combatant whose profession the recording does not state — a census that leaves them " +
          "out states a side of fewer people than fought in it",
      );
    }
    setRunningTotal(count, member.profession, 1);
  }
  return [...count]
    .sort((one, other) => getTextOrder(one[0], other[0]))
    .map(([profession, howMany]) => `${profession} ${composeIntegerText(howMany)}`)
    .join(", ");
}

/** `level 100` where one, `levels 93–120` where the side spans. */
function composeLevelText(members: readonly CensusMember[]): string {
  const levels: number[] = [];
  for (const member of members) {
    if (member.level === null) {
      throw new CapturedFightRegisterError(
        "a combatant whose level the recording does not state — a span read off the rest would " +
          "be narrower than the side actually was",
      );
    }
    levels.push(member.level);
  }
  const lowest = Math.min(...levels);
  const highest = Math.max(...levels);
  return lowest === highest
    ? `level ${composeIntegerText(lowest)}`
    : `levels ${composeIntegerText(lowest)}–${composeIntegerText(highest)}`;
}

/**
 * `ours won`, `theirs won`, `drawn`.
 *
 * The protocol states an outcome as a list of **names**, which is why
 * `tools/fight-report.ts` prints them and says nothing about who won *for us*: it
 * has no side to be on. This register does — `myteam` says which side the
 * recording player was on — so the names are resolved through the roster and the
 * side they land on is the answer. A name the roster cannot place, or an outcome
 * spread over both sides, is refused: a register stating who won is worth having
 * only while it cannot state it wrongly.
 */
function composeOutcomeText(
  fight: CapturedFight,
  roster: CombatantRoster,
  ourSide: number,
): string {
  const outcome = composeStatisticsOfFight(fight).outcome;
  if (outcome === null) {
    throw new CapturedFightRegisterError(`${fight.name} states no outcome at all`);
  }
  if (outcome.isDrawn) return "drawn";

  const sides = new Set(
    outcome.wonNames.map((name) => {
      const id = getCombatantIdByName(roster, name);
      const combatant = id === null ? undefined : roster.byId.get(id);
      if (combatant === undefined) {
        throw new CapturedFightRegisterError(
          `${fight.name} states a winner the roster cannot place — no side can be read off that`,
        );
      }
      return combatant.side;
    }),
  );
  if (sides.size !== 1) {
    throw new CapturedFightRegisterError(
      `${fight.name} states winners on ${composeIntegerText(sides.size)} sides`,
    );
  }
  return sides.has(ourSide) ? "ours won" : "theirs won";
}

function composeSideText(members: readonly CensusMember[]): string {
  return [composeKindText(members), composeProfessionText(members), composeLevelText(members)].join(
    " · ",
  );
}

type FightCensus = { fights: string[]; recordings: string[]; shape: string };

/**
 * One recording, as the two tables state it.
 *
 * The roster is `tests/captured-fight-catalog.ts`'s, deduplicated by id across
 * every call — the same reading the panel is handed in every other test here, so
 * the register cannot disagree with what the rest of the suite thinks a fight
 * held. Which side is ours comes from `myteam`, read by the one function that
 * spells it, and a fight with more than two sides is refused rather than folded:
 * `ours` and `theirs` would be a claim about a fight nobody has recorded.
 */
function composeCensusOfFight(fight: CapturedFight): FightCensus {
  const roster = composeRosterOfFight(fight);
  const isPlayerById = getPlayerFlagByCombatantId(fight.dump);
  const combatants = [...roster.byId.values()];

  const ourSide = fight.dump.calls.reduce<number | null>(
    (known, call) => known ?? getOurSideFromBattle(call.payload),
    null,
  );
  if (ourSide === null) {
    throw new CapturedFightRegisterError(
      `${fight.name} never states \`myteam\` — nothing in it says which side is the player's`,
    );
  }

  const sides = [...new Set(combatants.map((combatant) => combatant.side))];
  if (sides.length !== 2) {
    throw new CapturedFightRegisterError(
      `${fight.name} holds ${composeIntegerText(sides.length)} sides — "ours" and "theirs" state a ` +
        "fight of two, and this register has never held another kind",
    );
  }

  const composeMembers = (side: number): CensusMember[] =>
    combatants
      .filter((combatant) => combatant.side === side)
      .map((combatant) => ({
        profession: combatant.profession,
        level: combatant.level,
        isPlayer: isPlayerById.get(combatant.id),
      }));

  const ours = composeMembers(ourSide);
  const theirs = composeMembers(sides.find((side) => side !== ourSide) ?? ourSide);
  const shape = `${composeIntegerText(ours.length)} vs ${composeIntegerText(theirs.length)}`;

  const theirLargestHealth = combatants
    .filter((combatant) => combatant.side !== ourSide)
    .map((combatant) => {
      const health = fight.maximumHealthByCombatantId.get(combatant.id);
      if (health === undefined) {
        throw new CapturedFightRegisterError(
          `${fight.name} states no maximum health for a combatant on the other side`,
        );
      }
      return health;
    });

  const recording = `${CAPTURED_FIGHTS_DIRECTORY}${fight.name}.json`;
  return {
    shape,
    fights: [
      recording,
      shape,
      composeOutcomeText(fight, roster, ourSide),
      composeSideText(ours),
      composeSideText(theirs),
      composeIntegerText(Math.max(...theirLargestHealth)),
    ],
    recordings: [
      recording,
      fight.dump.world,
      fight.dump.gameBuild,
      composeIntegerText(fight.dump.calls.length),
      composeIntegerText(getMessagesOfFight(fight).length),
    ],
  };
}

/** A row as one line, so a disagreement prints something a person can paste. */
function composeRowText(cells: readonly string[]): string {
  return cells.join(" | ");
}

function composeRowsInOrder(rows: readonly string[][]): string[] {
  return rows.map(composeRowText).sort(getTextOrder);
}

const REGISTER = composeTablesFromRegister(readFileSync(REGISTER_PATH, "utf8"));
const CENSUS = CAPTURED_FIGHTS.map(composeCensusOfFight);

describe("the register of captured fights", () => {
  // Either half going to zero turns every comparison below green without it
  // comparing anything, which is what a walker that stopped walking looks like.
  test("has material to read and tables to hold it to", () => {
    expect(CAPTURED_FIGHTS.length).toBeGreaterThan(0);
    expect(REGISTER.fights.length).toBeGreaterThan(0);
    expect(REGISTER.recordings.length).toBeGreaterThan(0);
    expect(REGISTER.shapes.length).toBeGreaterThan(0);
  });

  test("states what every recording holds, and names no other", () => {
    expect(composeRowsInOrder(REGISTER.fights)).toEqual(
      composeRowsInOrder(CENSUS.map((census) => census.fights)),
    );
  });

  test("states where every recording came from, and how much it carries", () => {
    expect(composeRowsInOrder(REGISTER.recordings)).toEqual(
      composeRowsInOrder(CENSUS.map((census) => census.recordings)),
    );
  });

  /**
   * The tally is the one figure a reader wants that no row carries — how much of
   * the material is one shape of fight — so it is stated, and re-counted here
   * rather than left to be trusted.
   */
  test("tallies the shapes the recordings actually come to", () => {
    const howMany = new Map<string, number>();
    for (const census of CENSUS) setRunningTotal(howMany, census.shape, 1);
    const counted = [...howMany].map(([shape, count]) => [shape, composeIntegerText(count)]);
    expect(composeRowsInOrder(REGISTER.shapes)).toEqual(composeRowsInOrder(counted));
  });
});

describe("what the register refuses to state", () => {
  const player: CensusMember = { profession: "w", level: 60, isPlayer: true };

  test("refuses a side holding somebody it cannot call a player or a monster", () => {
    expect(() => composeSideText([player, { ...player, isPlayer: undefined }])).toThrow(
      CapturedFightRegisterError,
    );
  });

  test("refuses a side holding a profession the recording does not state", () => {
    expect(() => composeSideText([player, { ...player, profession: null }])).toThrow(
      CapturedFightRegisterError,
    );
  });

  test("refuses a side holding a level the recording does not state", () => {
    expect(() => composeSideText([player, { ...player, level: null }])).toThrow(
      CapturedFightRegisterError,
    );
  });

  test("writes a side of one level as a level and a side that spans as a span", () => {
    expect(composeSideText([player])).toBe("1 player · w 1 · level 60");
    expect(composeSideText([player, { ...player, profession: "m", level: 83, isPlayer: false }])).toBe(
      "1 player, 1 NPC · m 1, w 1 · levels 60–83",
    );
  });

  test("refuses a table row of a width the columns do not have", () => {
    expect(() => composeTablesFromRegister("## Shapes\n\n| 1 vs 1 |\n")).toThrow(
      CapturedFightRegisterError,
    );
  });

  // A heading that is not one of the three has to close the table above it, or a
  // table of orientation in the prose would be read as a claim about the material.
  test("reads no table outside the three headings", () => {
    const tables = composeTablesFromRegister("## Shapes\n\n## Elsewhere\n\n| a | b |\n");
    expect(tables.shapes).toEqual([]);
  });
});
