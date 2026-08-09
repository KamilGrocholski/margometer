/**
 * Reader for captured fight material.
 *
 * A dump is one recording session: every call the game engine made, with the
 * raw protocol it carried and a snapshot of every combatant taken before and
 * after. The snapshots are the reason this material is a file rather than a
 * code module — they carry maximum and current health, which the protocol
 * itself never states, and that is what lets the decoder be checked against
 * something other than itself.
 *
 * Field names inside the files are Polish. This reader is the boundary where
 * that stops: nothing downstream sees them. See AGENTS.md §9.2 for why the
 * files are not simply renamed.
 */

export class FightDumpFormatError extends Error {
  constructor(path: string, expected: string, received: unknown) {
    super(`${path}: expected ${expected}, got ${describeValue(received)}`);
    this.name = "FightDumpFormatError";
  }
}

function describeValue(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `array(${value.length})`;
  return typeof value;
}

function expectObject(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new FightDumpFormatError(path, "an object", value);
  }
  return value as Record<string, unknown>;
}

function expectArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw new FightDumpFormatError(path, "an array", value);
  return value;
}

function expectString(value: unknown, path: string): string {
  if (typeof value !== "string") throw new FightDumpFormatError(path, "a string", value);
  return value;
}

function expectFiniteNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new FightDumpFormatError(path, "a finite number", value);
  }
  return value;
}

export type CombatantHealth = {
  maximum: number;
  current: number;
  /** Percentage the game itself reports. Arrived at independently of the two above. */
  percent: number;
};

export type CombatantSnapshot = {
  id: number;
  name: string;
  /** Raw team number. Which side that is depends on the recording player. */
  team: number;
  profession: string;
  level: number;
  health: CombatantHealth;
};

/** One call the game engine made, with everything observed around it. */
export type EngineCall = {
  /** Ordinal of the call. Used to point at one call when numbers disagree. */
  index: number;
  /** Present once a dump can hold more than one fight; older captures have none. */
  fightNumber: number | null;
  protocolMessages: string[];
  combatantsBefore: CombatantSnapshot[];
  combatantsAfter: CombatantSnapshot[];
};

export type FightDump = {
  formatVersion: number;
  capturedAt: string;
  world: string;
  /** Client build the capture came from. Dumps from different builds are not comparable. */
  gameBuild: string;
  calls: EngineCall[];
};

function readCombatantHealth(raw: unknown, path: string): CombatantHealth {
  const health = expectObject(raw, path);
  return {
    maximum: expectFiniteNumber(health["max"], `${path}.max`),
    current: expectFiniteNumber(health["cur"], `${path}.cur`),
    percent: expectFiniteNumber(health["hpp"], `${path}.hpp`),
  };
}

function readCombatantSnapshots(raw: unknown, path: string): CombatantSnapshot[] {
  return expectArray(raw, path).map((entry, index) => {
    const at = `${path}[${index}]`;
    const combatant = expectObject(entry, at);
    return {
      id: expectFiniteNumber(combatant["id"], `${at}.id`),
      name: expectString(combatant["name"], `${at}.name`),
      team: expectFiniteNumber(combatant["team"], `${at}.team`),
      profession: expectString(combatant["prof"], `${at}.prof`),
      level: expectFiniteNumber(combatant["lvl"], `${at}.lvl`),
      health: readCombatantHealth(combatant["hp"], `${at}.hp`),
    };
  });
}

function readEngineCall(raw: unknown, path: string): EngineCall {
  const call = expectObject(raw, path);
  return {
    index: expectFiniteNumber(call["nr"], `${path}.nr`),
    fightNumber:
      call["walka"] === undefined ? null : expectFiniteNumber(call["walka"], `${path}.walka`),
    protocolMessages: expectArray(call["komunikaty"], `${path}.komunikaty`).map((message, i) =>
      expectString(message, `${path}.komunikaty[${i}]`),
    ),
    combatantsBefore: readCombatantSnapshots(call["wojownicyPrzed"], `${path}.wojownicyPrzed`),
    combatantsAfter: readCombatantSnapshots(call["wojownicyPo"], `${path}.wojownicyPo`),
    // `render` — sentences the game client composed — is deliberately not read.
    // It is the game's own prose, and no part of this project depends on it.
  };
}

/**
 * Parses dump text field by field. Throws `FightDumpFormatError` naming the
 * exact path on anything unexpected, rather than handing back a half-read
 * object: material that reads "successfully" but wrong is worse than material
 * that refuses to read.
 */
export function readFightDump(source: string): FightDump {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch (cause) {
    throw new FightDumpFormatError(
      "<root>",
      "valid JSON",
      cause instanceof Error ? cause.message : cause,
    );
  }

  const dump = expectObject(parsed, "<root>");
  return {
    formatVersion: expectFiniteNumber(dump["wersja"], "wersja"),
    capturedAt: expectString(dump["przy"], "przy"),
    world: expectString(dump["swiat"], "swiat"),
    gameBuild: expectString(dump["build"], "build"),
    calls: expectArray(dump["wpisy"], "wpisy").map((call, i) => readEngineCall(call, `wpisy[${i}]`)),
  };
}

/** Highest known maximum health per combatant, gathered from every snapshot in the dump. */
export function maximumHealthByCombatantId(dump: FightDump): Map<number, number> {
  const maximum = new Map<number, number>();
  for (const call of dump.calls) {
    for (const combatant of [...call.combatantsBefore, ...call.combatantsAfter]) {
      maximum.set(
        combatant.id,
        Math.max(maximum.get(combatant.id) ?? 0, combatant.health.maximum),
      );
    }
  }
  return maximum;
}
