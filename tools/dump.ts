/**
 * Reader for captured fight material.
 *
 * A dump is one recording session: every call the game engine made, with the
 * raw protocol it carried and a snapshot of every combatant taken before and
 * after. The snapshots are the reason this material is a file rather than a
 * code module — they carry `hp.max` and `hp.cur`, which the protocol itself
 * never states, and that is what lets the decoder be checked against something
 * other than itself.
 *
 * Field names inside the files are Polish. This reader is the boundary where
 * that stops: nothing downstream sees them. See AGENTS.md §9.2 for why the
 * files are not simply renamed.
 */

export class DumpFormatError extends Error {
  constructor(path: string, expected: string, got: unknown) {
    super(`${path}: expected ${expected}, got ${shape(got)}`);
    this.name = "DumpFormatError";
  }
}

function shape(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `array(${value.length})`;
  return typeof value;
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new DumpFormatError(path, "an object", value);
  }
  return value as Record<string, unknown>;
}

function list(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw new DumpFormatError(path, "an array", value);
  return value;
}

function text(value: unknown, path: string): string {
  if (typeof value !== "string") throw new DumpFormatError(path, "a string", value);
  return value;
}

function count(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new DumpFormatError(path, "a finite number", value);
  }
  return value;
}

export type Hp = {
  max: number;
  cur: number;
  /** Percentage the game itself reports. Independent of `max`/`cur` — see hpWitness. */
  hpp: number;
};

export type Warrior = {
  id: number;
  name: string;
  /** Raw team number. Which side that is depends on the recording player. */
  team: number;
  profession: string;
  level: number;
  hp: Hp;
};

export type Entry = {
  /** Ordinal of the engine call. Used to point at a single call when numbers disagree. */
  nr: number;
  /** Present once a dump can hold more than one fight; older captures have none. */
  fight: number | null;
  messages: string[];
  before: Warrior[];
  after: Warrior[];
};

export type Dump = {
  version: number;
  capturedAt: string;
  world: string;
  /** Game client build the capture came from. Two dumps from different builds are not comparable. */
  build: string;
  entries: Entry[];
};

function readHp(raw: unknown, path: string): Hp {
  const hp = record(raw, path);
  return {
    max: count(hp["max"], `${path}.max`),
    cur: count(hp["cur"], `${path}.cur`),
    hpp: count(hp["hpp"], `${path}.hpp`),
  };
}

function readWarriors(raw: unknown, path: string): Warrior[] {
  return list(raw, path).map((entry, i) => {
    const at = `${path}[${i}]`;
    const w = record(entry, at);
    return {
      id: count(w["id"], `${at}.id`),
      name: text(w["name"], `${at}.name`),
      team: count(w["team"], `${at}.team`),
      profession: text(w["prof"], `${at}.prof`),
      level: count(w["lvl"], `${at}.lvl`),
      hp: readHp(w["hp"], `${at}.hp`),
    };
  });
}

function readEntry(raw: unknown, path: string): Entry {
  const e = record(raw, path);
  return {
    nr: count(e["nr"], `${path}.nr`),
    fight: e["walka"] === undefined ? null : count(e["walka"], `${path}.walka`),
    messages: list(e["komunikaty"], `${path}.komunikaty`).map((m, i) =>
      text(m, `${path}.komunikaty[${i}]`),
    ),
    before: readWarriors(e["wojownicyPrzed"], `${path}.wojownicyPrzed`),
    after: readWarriors(e["wojownicyPo"], `${path}.wojownicyPo`),
    // `render` — sentences the game client composed — is deliberately not read.
    // It is the game's own prose, and no part of this project depends on it.
  };
}

/**
 * Parses dump text field by field. Throws `DumpFormatError` naming the exact
 * path on anything unexpected, rather than handing back a half-read object:
 * material that reads "successfully" but wrong is worse than material that
 * refuses to read.
 */
export function readDump(source: string): Dump {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch (cause) {
    throw new DumpFormatError("<root>", "valid JSON", cause instanceof Error ? cause.message : cause);
  }

  const d = record(parsed, "<root>");
  return {
    version: count(d["wersja"], "wersja"),
    capturedAt: text(d["przy"], "przy"),
    world: text(d["swiat"], "swiat"),
    build: text(d["build"], "build"),
    entries: list(d["wpisy"], "wpisy").map((e, i) => readEntry(e, `wpisy[${i}]`)),
  };
}

/** Highest known `hp.max` per combatant, gathered from every snapshot in the dump. */
export function maxHpById(dump: Dump): Map<number, number> {
  const max = new Map<number, number>();
  for (const entry of dump.entries) {
    for (const warrior of [...entry.before, ...entry.after]) {
      max.set(warrior.id, Math.max(max.get(warrior.id) ?? 0, warrior.hp.max));
    }
  }
  return max;
}
