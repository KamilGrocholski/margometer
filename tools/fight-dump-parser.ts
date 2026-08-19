/**
 * Parser for captured fight material.
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
 *
 * ⚠️ **The boundary is one reader, and for a while it was two.**
 * `tools/captured-fight-intake.ts` spelled six of these names itself — it reads a
 * recording before this parser will accept one — and nothing held the two spellings
 * together. The quiet direction was `wpisy`: misspelled there, the intake finds no
 * calls, decides nobody needs substituting and admits the file with every nickname
 * in it, which is the one promise `NOTICE.md` makes about a person
 * (`docs/audits/2026-08-19-the-whole-tree-read-a-fourth-time.md`, F6). So the names
 * are exported from here and the compiler holds the two files to them.
 */

import { getValueFromJsonText } from "@/libs/json.ts";
import { getFiniteNumberFromValue, getIntegerFromValue } from "@/libs/number.ts";
import { MargoMeterToolError } from "@/tools/margometer-tool-error.ts";
import { getRecordFromValue } from "@/libs/record.ts";

export class FightDumpFormatError extends MargoMeterToolError {
  constructor(path: string, expected: string, received: unknown, options?: ErrorOptions) {
    super("FightDumpFormat", `${path}: expected ${expected}, got ${getValueDescription(received)}`, options);
  }
}

function getValueDescription(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `array(${value.length})`;
  return typeof value;
}

function requireObject(value: unknown, path: string): Record<string, unknown> {
  const record = getRecordFromValue(value);
  if (record === null) throw new FightDumpFormatError(path, "an object", value);
  return record;
}

function requireArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw new FightDumpFormatError(path, "an array", value);
  return value;
}

function requireString(value: unknown, path: string): string {
  if (typeof value !== "string") throw new FightDumpFormatError(path, "a string", value);
  return value;
}

/**
 * Integer where the concept is one, and the same magnitude rule the live
 * protocol is held to: a combatant id in a dump is the same id a message
 * states, so reading it more loosely here would let a dump join against an id
 * that cannot exist.
 */
function requireInteger(value: unknown, path: string): number {
  const integer = getIntegerFromValue(value);
  if (integer === null) throw new FightDumpFormatError(path, "a whole number", value);
  return integer;
}

/** For the one figure the game itself states as a fraction. */
function requireFiniteNumber(value: unknown, path: string): number {
  const finite = getFiniteNumberFromValue(value);
  if (finite === null) throw new FightDumpFormatError(path, "a finite number", value);
  return finite;
}

/**
 * The captured file's own field names, spelled once.
 *
 * A recording never changes — it is evidence (§9.2) — so these are the names on
 * disk rather than names anybody may choose. The combatant's own fields are
 * deliberately **not** here: those are the game's, `src/game/engine-warrior.ts`
 * owns them for the live path, and this file keeps spelling them itself because
 * what binds a recording is the format it was written in and not what the client
 * calls a field today.
 */
export const DUMP_FIELDS = {
  formatVersion: "wersja",
  capturedAt: "przy",
  world: "swiat",
  gameBuild: "build",
  calls: "wpisy",
  callIndex: "nr",
  fightNumber: "walka",
  protocolMessages: "komunikaty",
  combatantsBefore: "wojownicyPrzed",
  combatantsAfter: "wojownicyPo",
  payload: "ladunek",
} as const;

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
  /**
   * The argument the engine call carried, exactly as recorded.
   *
   * Left as `unknown` on purpose. Every other field here is parsed because
   * something depends on its shape; this one exists so the live path can be
   * replayed against the same material the offline path uses, and the code under
   * test is precisely the code that decides what the shape is. Parsing it here
   * would mean this file and `src/game/` both deciding, and a replay that agrees
   * because both sides made the same assumption proves nothing.
   */
  payload: unknown;
};

export type FightDump = {
  formatVersion: number;
  capturedAt: string;
  world: string;
  /** Client build the capture came from. Dumps from different builds are not comparable. */
  gameBuild: string;
  calls: EngineCall[];
};

function parseCombatantHealth(raw: unknown, path: string): CombatantHealth {
  const health = requireObject(raw, path);
  return {
    maximum: requireInteger(health["max"], `${path}.max`),
    current: requireInteger(health["cur"], `${path}.cur`),
    percent: requireFiniteNumber(health["hpp"], `${path}.hpp`),
  };
}

function parseCombatantSnapshots(raw: unknown, path: string): CombatantSnapshot[] {
  return requireArray(raw, path).map((entry, index) => {
    const at = `${path}[${index}]`;
    const combatant = requireObject(entry, at);
    return {
      id: requireInteger(combatant["id"], `${at}.id`),
      name: requireString(combatant["name"], `${at}.name`),
      team: requireInteger(combatant["team"], `${at}.team`),
      profession: requireString(combatant["prof"], `${at}.prof`),
      level: requireInteger(combatant["lvl"], `${at}.lvl`),
      health: parseCombatantHealth(combatant["hp"], `${at}.hp`),
    };
  });
}

function parseEngineCall(raw: unknown, path: string): EngineCall {
  const call = requireObject(raw, path);
  return {
    index: requireInteger(call[DUMP_FIELDS.callIndex], `${path}.${DUMP_FIELDS.callIndex}`),
    fightNumber:
      call[DUMP_FIELDS.fightNumber] === undefined
        ? null
        : requireInteger(call[DUMP_FIELDS.fightNumber], `${path}.${DUMP_FIELDS.fightNumber}`),
    protocolMessages: requireArray(
      call[DUMP_FIELDS.protocolMessages],
      `${path}.${DUMP_FIELDS.protocolMessages}`,
    ).map((message, i) =>
      requireString(message, `${path}.${DUMP_FIELDS.protocolMessages}[${i}]`),
    ),
    combatantsBefore: parseCombatantSnapshots(
      call[DUMP_FIELDS.combatantsBefore],
      `${path}.${DUMP_FIELDS.combatantsBefore}`,
    ),
    combatantsAfter: parseCombatantSnapshots(
      call[DUMP_FIELDS.combatantsAfter],
      `${path}.${DUMP_FIELDS.combatantsAfter}`,
    ),
    payload: call[DUMP_FIELDS.payload],
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
export function parseFightDump(source: string): FightDump {
  const { value, syntaxError } = getValueFromJsonText(source);
  if (syntaxError !== null) {
    // The original goes in `cause`, not just its message: JSON.parse says which
    // byte it choked on, and that is the only useful thing about the failure.
    throw new FightDumpFormatError("<root>", "valid JSON", source.slice(0, 40), {
      cause: syntaxError,
    });
  }

  const dump = requireObject(value, "<root>");
  return {
    formatVersion: requireInteger(dump[DUMP_FIELDS.formatVersion], DUMP_FIELDS.formatVersion),
    capturedAt: requireString(dump[DUMP_FIELDS.capturedAt], DUMP_FIELDS.capturedAt),
    world: requireString(dump[DUMP_FIELDS.world], DUMP_FIELDS.world),
    gameBuild: requireString(dump[DUMP_FIELDS.gameBuild], DUMP_FIELDS.gameBuild),
    calls: requireArray(dump[DUMP_FIELDS.calls], DUMP_FIELDS.calls).map((call, i) =>
      parseEngineCall(call, `${DUMP_FIELDS.calls}[${i}]`),
    ),
  };
}

/** Highest known maximum health per combatant, gathered from every snapshot in the dump. */
export function getMaximumHealthByCombatantId(dump: FightDump): Map<number, number> {
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
