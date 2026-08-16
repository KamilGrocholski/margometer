import { readdirSync, readFileSync } from "node:fs";
import {
  composeCombatantRoster,
  type CombatantRoster,
} from "@/src/core/combatant-roster.ts";
import {
  getMaximumHealthByCombatantId,
  getStartingHealthByCombatantId,
  parseFightDump,
  type CombatantSnapshot,
  type FightDump,
} from "@/tools/fight-dump-parser.ts";

const CAPTURED_FIGHTS_DIRECTORY = new URL("./captured-fights/", import.meta.url).pathname;

export type CapturedFight = {
  name: string;
  dump: FightDump;
  maximumHealthByCombatantId: Map<number, number>;
  /** What each combatant entered the fight holding — the ceiling a team heal caps against. */
  startingHealthByCombatantId: Map<number, number>;
};

/**
 * The roster the decoder would hold at run time, built from what an engine call
 * started with.
 *
 * This is where the capture's `team` becomes the roster's `side`, and it is one
 * function rather than three copies because three callers needed it. The rename
 * is the whole of the translation: the number is passed through untouched, since
 * deciding which team is the player's own is the game layer's job and nothing
 * here can do it (`combatant-roster.ts`).
 */
export function composeRosterFromSnapshots(
  snapshots: readonly CombatantSnapshot[],
): CombatantRoster {
  return composeCombatantRoster(
    snapshots.map(({ id, name, team, profession, level }) => ({
      id,
      name,
      side: team,
      profession: profession === "" ? null : profession,
      level,
    })),
  );
}

/**
 * One roster for a whole fight rather than for a single call.
 *
 * **Deduplicated by id first, and that is the point.** A combatant appears in
 * every call's snapshots — a hundred times over in the group fight — and
 * `composeCombatantRoster` treats a name it meets twice as ambiguous. Handing it
 * the raw concatenation would make every name in the fight resolve to nobody,
 * silently, and the only symptom would be damage landing in `unattributed`.
 */
export function composeRosterOfFight(fight: CapturedFight): CombatantRoster {
  const byId = new Map<number, CombatantSnapshot>();
  for (const call of fight.dump.calls) {
    for (const combatant of [...call.combatantsBefore, ...call.combatantsAfter]) {
      byId.set(combatant.id, combatant);
    }
  }
  return composeRosterFromSnapshots([...byId.values()]);
}

/**
 * Every protocol message a capture carries, in arrival order.
 *
 * One function rather than seventeen copies: `fight.dump.calls.flatMap(…)` was
 * spelled by hand in eleven test files, which is §7.1's threshold passed eight
 * times over, and it is the same reading in all of them — the whole fight as the
 * decoder would see it offline (`docs/audits/2026-08-14-the-whole-tree-read-again.md`,
 * F20). It belongs beside `composeRosterOfFight` for the reason that one gives:
 * the material and the two readings every test needs of it live together.
 */
export function getMessagesOfFight(fight: CapturedFight): string[] {
  return fight.dump.calls.flatMap((call) => call.protocolMessages);
}

/**
 * Every capture in `tests/captured-fights/`, read with the same reader the
 * tooling uses.
 *
 * Discovered by listing the directory rather than from a list of names: a file
 * dropped in is checked immediately instead of sitting dead, and that is the
 * condition under which data files are allowed in this repo at all.
 *
 * Sorted, because test numbering must not depend on filesystem order.
 */
export const CAPTURED_FIGHTS: CapturedFight[] = readdirSync(CAPTURED_FIGHTS_DIRECTORY)
  .filter((file) => file.endsWith(".json"))
  .sort()
  .map((file) => {
    const dump = parseFightDump(readFileSync(CAPTURED_FIGHTS_DIRECTORY + file, "utf8"));
    return {
      name: file.replace(/\.json$/, ""),
      dump,
      maximumHealthByCombatantId: getMaximumHealthByCombatantId(dump),
      startingHealthByCombatantId: getStartingHealthByCombatantId(dump),
    };
  });
