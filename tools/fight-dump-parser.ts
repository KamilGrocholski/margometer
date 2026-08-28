/**
 * Parser for captured fight material.
 *
 * A dump is one recording session: every call the game engine made, with the raw
 * protocol it carried and a snapshot of every combatant taken before and after. The
 * snapshots are the reason this material is a file rather than a code module — they
 * carry maximum and current health, which the protocol itself never states, and that is
 * what lets the decoder be checked against something other than itself.
 *
 * Field names inside the files are Polish. This reader is the boundary where that
 * stops: nothing downstream sees them. See AGENTS.md §9.2 for why the files are not
 * simply renamed.
 *
 * ⚠️ **The boundary is one reader, and for a while it was two.**
 * `tools/captured-fight-intake.ts` spelled six of these names itself — it reads a
 * recording before this parser will accept one — and nothing held the two spellings
 * together. The quiet direction was `wpisy`: misspelled there, the intake finds no
 * calls, decides nobody needs substituting and admits the file with every nickname in
 * it, which is the one promise `NOTICE.md` makes about a person. So the names are
 * exported from here and the compiler holds the two files to them.
 */

import { getValueFromJsonText } from "@/libs/json.ts";
import {
  composeIntegerText,
  getFiniteNumberFromValue,
  getIntegerFromValue,
} from "@/libs/number.ts";
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
  place: "mapa",
  placeMapName: "nazwa",
  placeX: "x",
  placeY: "y",
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
  /**
   * Client build the capture came from, or null where the page did not say.
   *
   * Dumps from different builds are not comparable, and one that names no build
   * is comparable with nothing — which is a fact about that recording and not a
   * reason to refuse to read it. §7.6 is what that fact comes from, so the
   * refusal it used to produce here has moved to where somebody sees it: the
   * build column of `docs/captured-fights.md` states the absence in words.
   *
   * ⚠️ **Absent and unreadable stay different, and only one of them is null.**
   * `src/game/fight-capture.ts` writes an explicit `null` when the page said
   * nothing; a recording missing the field entirely, or stating a number, an
   * empty string or an object, is one this parser does not understand and still
   * stops the read.
   */
  gameBuild: string | null;
  /**
   * Where the fight was fought, or null where the recording does not say.
   *
   * ⚠️ **Absent is a recording written before the add-on read a map, and it is
   * not a fault.** Every capture held on 2026-08-27 predates the field, so
   * refusing one that lacks it would refuse the whole corpus. That makes this the
   * `fightNumber` shape and not `gameBuild`'s: missing reads as null, an explicit
   * null reads as *the page would not say*, and a value of the wrong shape is
   * still a file this parser does not understand.
   *
   * The battle protocol states none of it, so it can never be recovered for a
   * recording that went without it — the only field here of which that is true.
   */
  place: DumpPlace | null;
  calls: EngineCall[];
};

/** Where a recording says it was taken. Each member absent on its own. */
export type DumpPlace = {
  mapName: string | null;
  x: number | null;
  y: number | null;
};

function parseDumpPlace(raw: unknown): DumpPlace {
  const place = requireObject(raw, DUMP_FIELDS.place);
  const at = DUMP_FIELDS.place;
  const name = place[DUMP_FIELDS.placeMapName];
  const x = place[DUMP_FIELDS.placeX];
  const y = place[DUMP_FIELDS.placeY];
  return {
    // A member's own null is the client having refused that one — the map's name
    // arrives from one object and the position from another, and a map part-way
    // through loading gives neither (`src/game/engine-place.ts`).
    mapName: name === null ? null : requireString(name, `${at}.${DUMP_FIELDS.placeMapName}`),
    x: x === null ? null : requireInteger(x, `${at}.${DUMP_FIELDS.placeX}`),
    y: y === null ? null : requireInteger(y, `${at}.${DUMP_FIELDS.placeY}`),
  };
}

function parseCombatantHealth(raw: unknown, path: string): CombatantHealth {
  const health = requireObject(raw, path);
  return {
    maximum: requireInteger(health["max"], `${path}.max`),
    current: requireInteger(health["cur"], `${path}.cur`),
    percent: requireFiniteNumber(health["hpp"], `${path}.hpp`),
  };
}

/**
 * The combatant's own fields, spelled once for the two places a recording states
 * one: the snapshot arrays this file was written for, and `ladunek.w`.
 *
 * ⚠️ **Still not `src/game/engine-warrior.ts`'s, and the reason is that file's
 * own.** These are the names the recordings on disk were written in; those are
 * the names the client uses today, and a client rename must not reach material
 * that froze the old spelling (§9.2). What changed is only that this file had
 * *two* copies of them once `ladunek.w` had to be read — the second spelling is
 * what §9.3 refuses, not the independence from the live path.
 */
const COMBATANT_FIELDS = {
  id: "id",
  name: "name",
  side: "team",
  profession: "prof",
  level: "lvl",
  health: "hp",
} as const;

/**
 * The four fields that say an entry is describing somebody rather than changing
 * them.
 *
 * `hp` is deliberately not among them: it is exactly what a delta carries.
 * Measured over every recording held on 2026-08-24 — 4142 entries under
 * `ladunek.w` state none of these four, 200 state all four, and **none states
 * some**. That perfect split is the whole licence for reading the absent case as
 * a delta and the partial case as a fault, and it is the same shape
 * `src/game/engine-roster.ts` measured for the live path.
 */
const IDENTITY_FIELDS = [
  COMBATANT_FIELDS.name,
  COMBATANT_FIELDS.side,
  COMBATANT_FIELDS.profession,
  COMBATANT_FIELDS.level,
] as const;

function parseCombatantSnapshot(raw: unknown, at: string): CombatantSnapshot {
  const combatant = requireObject(raw, at);
  return {
    id: requireInteger(combatant[COMBATANT_FIELDS.id], `${at}.${COMBATANT_FIELDS.id}`),
    name: requireString(combatant[COMBATANT_FIELDS.name], `${at}.${COMBATANT_FIELDS.name}`),
    team: requireInteger(combatant[COMBATANT_FIELDS.side], `${at}.${COMBATANT_FIELDS.side}`),
    profession: requireString(
      combatant[COMBATANT_FIELDS.profession],
      `${at}.${COMBATANT_FIELDS.profession}`,
    ),
    level: requireInteger(combatant[COMBATANT_FIELDS.level], `${at}.${COMBATANT_FIELDS.level}`),
    health: parseCombatantHealth(
      combatant[COMBATANT_FIELDS.health],
      `${at}.${COMBATANT_FIELDS.health}`,
    ),
  };
}

function parseCombatantSnapshots(raw: unknown, path: string): CombatantSnapshot[] {
  return requireArray(raw, path).map((entry, index) =>
    parseCombatantSnapshot(entry, `${path}[${index}]`),
  );
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
    // Only an explicit `null` passes — the value the add-on writes for "the page
    // did not say". `undefined` is a recording with no such field at all, which
    // is a format this parser has never seen, so it falls through and throws.
    gameBuild:
      dump[DUMP_FIELDS.gameBuild] === null
        ? null
        : requireString(dump[DUMP_FIELDS.gameBuild], DUMP_FIELDS.gameBuild),
    // Absent is every recording written before the add-on read a map, so it
    // falls to null rather than through — the `fightNumber` rule, one level up.
    // An explicit null is the page having refused to say.
    place:
      dump[DUMP_FIELDS.place] === undefined || dump[DUMP_FIELDS.place] === null
        ? null
        : parseDumpPlace(dump[DUMP_FIELDS.place]),
    calls: requireArray(dump[DUMP_FIELDS.calls], DUMP_FIELDS.calls).map((call, i) =>
      parseEngineCall(call, `${DUMP_FIELDS.calls}[${i}]`),
    ),
  };
}

/** Highest known maximum health per combatant, gathered everywhere the dump states one. */
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
  for (const combatant of composeCombatantsOfPayloads(dump)) {
    maximum.set(combatant.id, Math.max(maximum.get(combatant.id) ?? 0, combatant.health.maximum));
  }
  return maximum;
}

/**
 * The battle payload's own field names, spelled once.
 *
 * Not `DUMP_FIELDS`, and the difference is what each list is a claim about:
 * those are the names the **recording** was written in and are frozen with the
 * file, these are the game's own, recorded verbatim inside `ladunek` and true
 * only of the builds the material carries.
 *
 * They are here rather than in `src/game/` because the add-on reads none of
 * them: `npc` is what tells a player from a monster, and the live path has never
 * needed to ask (`src/game/fight-capture.ts`). Two readers offline do —
 * `tools/captured-fight-intake.ts`, which refuses to redact a recording it cannot
 * tell players from monsters in, and the register over the material — so §9.3
 * puts the spelling in one place before there is a second one to disagree with.
 */
export const PAYLOAD_FIELDS = {
  combatants: "w",
  combatantId: COMBATANT_FIELDS.id,
  nonPlayerFlag: "npc",
} as const;

/**
 * Every combatant the payloads describe, deduplicated by id, latest statement
 * winning.
 *
 * ⚠️ **A recording can state its roster here and nowhere else, and one does.**
 * The snapshots come off the game's battle object, read either side of the engine
 * call (`src/userscript-entry.ts`). A fight fought on auto arrives whole in a
 * single call — `init`, `endBattle` and `close` in one payload — so before it
 * there is no battle object yet and after it the game has already torn one down:
 * both snapshots are empty and `ladunek.w` carries the only roster there is.
 * `tests/captured-fights/2026-08-24-tempest-tropiciel-vs-centaury-auto.json` is
 * that recording, and until this function existed it read as a fight of nobody
 * while the panel that recorded it had drawn three combatants.
 *
 * Measured over every recording held on 2026-08-24: where both sources state a
 * combatant they agree on **every** field — id, name, side, profession, level and
 * maximum health, across all 21 recordings that carry snapshots at all. So this is
 * a widening and not a second opinion.
 *
 * An entry stating none of `IDENTITY_FIELDS` is the delta the game sends
 * constantly and is skipped; one stating some of them is a shape this reader was
 * not measured against, and `parseCombatantSnapshot` refuses it loudly (§9.5).
 */
export function composeCombatantsOfPayloads(dump: FightDump): CombatantSnapshot[] {
  const byId = new Map<number, CombatantSnapshot>();
  for (const call of dump.calls) {
    for (const combatant of composeCombatantsOfPayload(call)) byId.set(combatant.id, combatant);
  }
  return [...byId.values()];
}

/**
 * The same reading of a single call, for the callers that are asking what one
 * payload said rather than what a fight held.
 *
 * Two of them, which is why it is a name: the fold above, and the panel's guard
 * for the moment before anybody has acted — which composes a roster out of the
 * opening call alone and would otherwise draw a fight of nobody on exactly the
 * recording that has no snapshot to open with (`tests/ui/panel-view.test.ts`).
 */
export function composeCombatantsOfPayload(call: EngineCall): CombatantSnapshot[] {
  const payload = getRecordFromValue(call.payload);
  const combatants =
    payload === null ? null : getRecordFromValue(payload[PAYLOAD_FIELDS.combatants]);

  const stated: CombatantSnapshot[] = [];
  for (const [key, value] of Object.entries(combatants ?? {})) {
    const entry = getRecordFromValue(value);
    if (entry === null) continue;
    if (!IDENTITY_FIELDS.some((field) => entry[field] !== undefined)) continue;
    const at =
      `${DUMP_FIELDS.calls}[${composeIntegerText(call.index)}]` +
      `.${DUMP_FIELDS.payload}.${PAYLOAD_FIELDS.combatants}.${key}`;
    stated.push(parseCombatantSnapshot(entry, at));
  }
  return stated;
}

/**
 * Which combatants a recording states are players, by id.
 *
 * `npc` rides only in `ladunek.w`, which is why this reads the payload rather
 * than the snapshots — and why an answer is missing rather than guessed: the
 * tempting rule "a negative id is a monster" is a claim about the game nobody
 * measured, and `tools/captured-fight-intake.ts` refuses to write a file on it.
 * A combatant the payload never carried is absent from the map, which is a third
 * state and not a `false`.
 */
export function getPlayerFlagByCombatantId(dump: FightDump): Map<number, boolean> {
  const isPlayerById = new Map<number, boolean>();
  for (const call of dump.calls) {
    const payload = getRecordFromValue(call.payload);
    const combatants = payload === null ? null : getRecordFromValue(payload[PAYLOAD_FIELDS.combatants]);
    for (const [key, value] of Object.entries(combatants ?? {})) {
      const combatant = getRecordFromValue(value);
      if (combatant === null) continue;
      // The entry's own id first, the key second: the key is text the game chose,
      // and `tools/captured-fight-intake.ts` reads them in that order too.
      const id = getIntegerFromValue(combatant[PAYLOAD_FIELDS.combatantId]) ?? getIntegerFromValue(key);
      const flag = getIntegerFromValue(combatant[PAYLOAD_FIELDS.nonPlayerFlag]);
      if (id === null || flag === null) continue;
      isPlayerById.set(id, flag === 0);
    }
  }
  return isPlayerById;
}
