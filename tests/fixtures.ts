import { readdirSync, readFileSync } from "node:fs";
import { maxHpById, readDump, type Dump } from "../tools/dump.ts";

const DIRECTORY = new URL("./fixtures/", import.meta.url).pathname;

export type Fixture = {
  name: string;
  dump: Dump;
  maxHp: Map<number, number>;
};

/**
 * Every capture in the directory, read with the same reader the tooling uses.
 *
 * Discovered by listing the directory rather than from a list of names: a file
 * dropped in is checked immediately instead of sitting dead, and that is the
 * condition under which data files are allowed in this repo at all.
 *
 * Sorted, because test numbering must not depend on filesystem order.
 */
export const FIXTURES: Fixture[] = readdirSync(DIRECTORY)
  .filter((file) => file.endsWith(".json"))
  .sort()
  .map((file) => {
    const dump = readDump(readFileSync(DIRECTORY + file, "utf8"));
    return { name: file.replace(/\.json$/, ""), dump, maxHp: maxHpById(dump) };
  });
