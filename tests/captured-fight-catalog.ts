/**
 * The captured fights, and the readings every test needs of them.
 *
 * The material is evidence (§9.2), so nothing here edits or reformats it: the
 * directory is read as it stands, a fixture list is never written by hand, and an
 * empty directory fails rather than passing quietly. What this file adds is the
 * three readings a test would otherwise spell for itself — the roster of a whole
 * fight, its messages in arrival order, and the statistics as the panel composes
 * them — each of which had been written out in file after file until it was.
 *
 * It reads `tools/fight-dump-parser.ts`, which §9.1 permits by name and for one
 * reason: the live path and the offline one must not disagree about what a
 * capture says.
 */

import { readdirSync, readFileSync } from "node:fs";
import {
  composeCombatantRoster,
  type CombatantRoster,
} from "@/src/core/combatant-roster.ts";
import {
  composeEntryHealthByCombatantId,
  type FightEntryHealth,
} from "@/src/core/combatant-health.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics, type FightStatistics } from "@/src/core/fight-statistics.ts";
import {
  composeCombatantsOfPayloads,
  getMaximumHealthByCombatantId,
  parseFightDump,
  type CombatantSnapshot,
  type FightDump,
} from "@/tools/fight-dump-parser.ts";

/**
 * Where the material sits, exported so a reader can name one file of it.
 *
 * `CapturedFight.name` is the filename without its extension, so the directory
 * is the other half of a path — and one caller needs a path rather than a
 * reading: `tests/tools/decoding-status.test.ts` puts the tool's own
 * read-a-dump-at-a-path route against the catalog's, and it cannot do that
 * without naming a file both of them can reach. Nothing here reads it by hand:
 * the list is still `readdirSync` (§9.2).
 */
export const CAPTURED_FIGHTS_DIRECTORY = new URL("./captured-fights/", import.meta.url).pathname;

export type CapturedFight = {
  name: string;
  dump: FightDump;
  maximumHealthByCombatantId: Map<number, number>;
  /**
   * The same question answered by unwinding rather than by first sight, and the
   * two disagree on every capture whose opening payload carries messages.
   *
   * This is what the add-on itself computes at run time, through the very same
   * `core` reader — so the offline path and the live one cannot drift apart about
   * what "the health it entered with" means (§9.1).
   */
  entryHealthByCombatantId: FightEntryHealth;
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
    snapshots.map(({ id, name, team, profession, level, health }) => ({
      id,
      name,
      side: team,
      profession: profession === "" ? null : profession,
      level,
      // The same figure the live roster reads off `hp.max`, from the recording's
      // own copy of it — so the offline path and the live one size a share against
      // the same pool (`src/core/combatant-health.ts`).
      maximumHealth: health.maximum,
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
  // The payloads first, so a snapshot of the same combatant still has the last
  // word. They agree on every field of every combatant they both state, measured
  // over every recording — what the payloads add is the fight nothing snapshotted
  // (`composeCombatantsOfPayloads`).
  for (const combatant of composeCombatantsOfPayloads(fight.dump)) {
    byId.set(combatant.id, combatant);
  }
  for (const call of fight.dump.calls) {
    for (const combatant of [...call.combatantsBefore, ...call.combatantsAfter]) {
      byId.set(combatant.id, combatant);
    }
  }
  return composeRosterFromSnapshots([...byId.values()]);
}

/**
 * A recording read the way the panel reads it: roster, messages, entry health.
 *
 * ⚠️ **The three arguments were spelled out at ten call sites and four of them
 * left one off**, which is not a small difference — composing the seventeen
 * recordings held on 2026-08-21 both ways, healing on fourteen of them more than doubles once the
 * entry health is passed, because that is what sizes a share stated about a whole
 * side (§9.6). The tools carried a comment saying they read *the same reading the
 * panel is held to*; the tests carried nothing, and one of the four was the
 * fixture the whole of `tests/ui/panel-drill.test.ts` runs on
 * (`docs/audits/2026-08-21-the-rest-of-the-code-read-for-its-smells.md`, F2).
 *
 * So the reading is decided here, once, where the material already is. A caller
 * that wants a fight sized differently — with no roster, to watch names resolve
 * to nobody — composes it itself and says why.
 */
export function composeStatisticsOfFight(fight: CapturedFight): FightStatistics {
  const roster = composeRosterOfFight(fight);
  return composeFightStatistics(
    decodeFight(getMessagesOfFight(fight), roster),
    roster,
    fight.entryHealthByCombatantId,
  );
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
  return getMessagesOfDump(fight.dump);
}

/**
 * The same reading, of a dump that is not a capture in this directory.
 *
 * One caller and it is the reason this exists rather than a third spelling:
 * `tests/game/engine-attachment.test.ts` writes a recording and reads it back,
 * so it holds two `FightDump`s and no `CapturedFight` at all. It had a local
 * `getMessagesOf` for exactly that, which is a shared reader with a caller
 * outside it — worse than no shared reader, because the next person reads this
 * module and believes it is the only spelling
 * (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F15).
 */
export function getMessagesOfDump(dump: FightDump): string[] {
  return dump.calls.flatMap((call) => call.protocolMessages);
}

/**
 * What each combatant entered the fight holding, unwound from the first snapshot
 * the recording actually took.
 *
 * ⚠️ **The first snapshot is not the start of the fight.** A capture's opening
 * calls routinely carry messages with no snapshot beside them, so the first
 * `combatantsBefore` that exists is the state *after* those messages — which is
 * why this decodes them and hands them to the core reader to subtract back off,
 * rather than reading a health off the snapshot and calling it the entry.
 *
 * The roster is built from the dump's own snapshots, because resolving a name is
 * what turns `+oth_dmg` into a health movement, and the opening of the group
 * fights is made of exactly those.
 */
function composeEntryHealthOfDump(
  dump: FightDump,
  maximumHealthByCombatantId: ReadonlyMap<number, number>,
): Map<number, number> {
  const opening: string[] = [];
  // Seeded from the payloads, so a name resolves even where nothing was
  // snapshotted at all — the opening messages are exactly where `+oth_dmg` states
  // damage by name, and a roster that cannot place the name loses the movement
  // this unwind is made of (`composeCombatantsOfPayloads`).
  const snapshots = new Map<number, CombatantSnapshot>(
    composeCombatantsOfPayloads(dump).map((combatant) => [combatant.id, combatant]),
  );
  let stated: readonly CombatantSnapshot[] | null = null;

  for (const call of dump.calls) {
    for (const combatant of [...call.combatantsBefore, ...call.combatantsAfter]) {
      snapshots.set(combatant.id, combatant);
    }
    if (call.combatantsBefore.length > 0) {
      stated = call.combatantsBefore;
      break;
    }
    opening.push(...call.protocolMessages);
  }

  const roster = composeRosterFromSnapshots([...snapshots.values()]);
  return composeEntryHealthByCombatantId(
    /**
     * ⚠️ **No snapshot anywhere is a state, not a defect, and it is the one the
     * rescue below was written for.** A fight fought on auto arrives in a single
     * engine call, so neither side of that call has a battle object to snapshot
     * and `stated` stays null for the whole recording. Handing an empty map is
     * exactly what the core reader wants then: it unwinds each combatant from the
     * first health percentage the messages state, which is what it already does
     * for the combatants a snapshot happens to miss (`src/core/combatant-health.ts`).
     *
     * Returning an early empty map here was the same mistake in reverse — it read
     * "the recording took no snapshot" as "the recording says nothing about the
     * health anybody entered with", and the messages say it plainly.
     */
    new Map((stated ?? []).map((combatant) => [combatant.id, combatant.health.current])),
    maximumHealthByCombatantId,
    decodeFight(opening, roster),
  );
}

/**
 * One recording read into the shape every reader of the material wants.
 *
 * Its own function since the second consumer arrived (§7.1): the catalog builds
 * one of these per file in the directory, and `tools/fight-report.ts` builds one
 * for a recording named on the command line. What must not diverge between them
 * is the entry health — it is unwound from the opening messages, and a second
 * spelling of that unwinding would report a recording differently depending on
 * whether it had passed intake yet, which is the one comparison the argument
 * exists to make.
 *
 * The name is the caller's: the catalog takes it off the filename, and so does
 * the tool. Nothing here reads a path.
 */
export function composeCapturedFight(name: string, dump: FightDump): CapturedFight {
  const maximumHealthByCombatantId = getMaximumHealthByCombatantId(dump);
  return {
    name,
    dump,
    maximumHealthByCombatantId,
    entryHealthByCombatantId: composeEntryHealthOfDump(dump, maximumHealthByCombatantId),
  };
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
  .map((file) =>
    composeCapturedFight(
      file.replace(/\.json$/, ""),
      parseFightDump(readFileSync(CAPTURED_FIGHTS_DIRECTORY + file, "utf8")),
    ),
  );
