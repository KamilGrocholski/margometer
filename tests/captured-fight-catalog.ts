import { readdirSync, readFileSync } from "node:fs";
import {
  getMaximumHealthByCombatantId,
  parseFightDump,
  type FightDump,
} from "@/tools/fight-dump-parser.ts";

const CAPTURED_FIGHTS_DIRECTORY = new URL("./captured-fights/", import.meta.url).pathname;

export type CapturedFight = {
  name: string;
  dump: FightDump;
  maximumHealthByCombatantId: Map<number, number>;
};

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
    };
  });
