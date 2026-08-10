/**
 * Reads `docs/protocol-keys.md` into a structure.
 *
 * Two readers now need the register: the test that holds it against the decoder
 * and against the game, and the health witness, which asks it which keys carry a
 * health figure. A second consumer is what turns a local parser into a module
 * (AGENTS.md §7.1), and it is also what would let two copies of the entry
 * grammar drift apart.
 *
 * Throws on anything it does not recognise. The register is our own material,
 * not the live protocol — an entry we cannot read is a mistake to fix, not a
 * surprise from the game to survive (§9.5).
 */

import { readFileSync } from "node:fs";
import { getIntegerFromText } from "@/libs/number.ts";
import { MargoMeterToolError } from "@/tools/margometer-tool-error.ts";

export class ProtocolKeyRegisterError extends MargoMeterToolError {
  constructor(reason: string) {
    super("ProtocolKeyRegister", reason);
  }
}

/**
 * What a key does to health, as distinct from whether the decoder reads it.
 *
 * Two axes, deliberately not folded into one: `+oth_dmg` is both decoded and a
 * health figure, and a single state token cannot say that without the state list
 * growing a product of the two.
 *
 * One value, because one is all anything consumes. A second value meaning "does
 * not move health" would be a claim with nothing behind it: silence already says
 * the material has not settled it, and §7.1 does not let a value exist before
 * something needs it.
 */
export const PROTOCOL_KEY_HEALTH_EFFECTS = ["moves health"] as const;

export type ProtocolKeyHealthEffect = (typeof PROTOCOL_KEY_HEALTH_EFFECTS)[number];

/**
 * Where every occurrence of a key sits. One phrase has to hold for **all** of
 * them, so the weakest true one is the right one — "on a blow" is a stronger
 * claim than "on a message reporting damage" and a key that does both takes the
 * second.
 */
export const PROTOCOL_KEY_PLACEMENTS = [
  "alone in its message",
  "on a skill announcement",
  "on a blow",
  "on a message reporting damage",
] as const;

export type ProtocolKeyPlacement = (typeof PROTOCOL_KEY_PLACEMENTS)[number];

/** What the key states beside itself, again as one phrase true of every occurrence. */
export const PROTOCOL_KEY_VALUE_SHAPES = [
  "no value",
  "a whole number",
  "a number",
  "text",
] as const;

export type ProtocolKeyValueShape = (typeof PROTOCOL_KEY_VALUE_SHAPES)[number];

/**
 * What the captures show about a key, in a form a test can re-earn.
 *
 * The register was, until this existed, prose all the way down: an entry could
 * state a count and a placement and nothing would ever read them again. That is
 * the failure this repository is built against — a claim with a date on it looks
 * exactly like a checked one. The health line already worked this way; this is
 * the same idea applied to what every entry says about its own material.
 */
export type ProtocolKeyShape = {
  occurrences: number;
  placement: ProtocolKeyPlacement;
  valueShape: ProtocolKeyValueShape;
};

export type ProtocolKeyEntry = {
  key: string;
  state: string;
  /**
   * Null when the register makes no claim — the default, and the honest answer
   * for a key the captures cannot settle either way.
   */
  healthEffect: ProtocolKeyHealthEffect | null;
  /**
   * How the verdict was reached, verbatim. Null where the entry leans on a
   * neighbour's, which `loser` does — so this is read, not required.
   */
  evidence: string | null;
  /** Null for a key the captures do not carry, which is the only excuse for its absence. */
  shape: ProtocolKeyShape | null;
};

const ENTRY_HEADING = /^### `([^`]+)` — (.+)$/gm;
const HEALTH_LINE = /^\*Health:\* (.+)$/m;
const SHAPE_LINE = /^\*Shape:\* (\d+) occurrences; ([^;]+); (.+)$/m;
/**
 * To the next blank line, not to the end of the first one: evidence wraps, and
 * the citation's date routinely lands on a later line than the article it dates.
 */
const EVIDENCE_PARAGRAPH = /^\*Evidence:\* ((?:.+\n?)+)/m;

function isHealthEffect(value: string): value is ProtocolKeyHealthEffect {
  return (PROTOCOL_KEY_HEALTH_EFFECTS as readonly string[]).includes(value);
}

function isPlacement(value: string): value is ProtocolKeyPlacement {
  return (PROTOCOL_KEY_PLACEMENTS as readonly string[]).includes(value);
}

function isValueShape(value: string): value is ProtocolKeyValueShape {
  return (PROTOCOL_KEY_VALUE_SHAPES as readonly string[]).includes(value);
}

/**
 * Refuses a phrase it does not define, for the reason the health line does: a
 * shape nothing knows how to check would pass as a claim while checking nothing,
 * and it would look more settled than silence, not less.
 */
function parseShape(body: string, key: string): ProtocolKeyShape | null {
  const stated = SHAPE_LINE.exec(body);
  if (stated === null) return null;

  const occurrences = getIntegerFromText(stated[1]!);
  if (occurrences === null) {
    throw new ProtocolKeyRegisterError(`\`${key}\` states an unreadable occurrence count`);
  }
  const placement = stated[2]!;
  if (!isPlacement(placement)) {
    throw new ProtocolKeyRegisterError(`\`${key}\` states a placement nothing checks: "${placement}"`);
  }
  const valueShape = stated[3]!;
  if (!isValueShape(valueShape)) {
    throw new ProtocolKeyRegisterError(`\`${key}\` states a value shape nothing checks: "${valueShape}"`);
  }
  return { occurrences, placement, valueShape };
}

export function parseProtocolKeyRegister(register: string): ProtocolKeyEntry[] {
  const headings = [...register.matchAll(ENTRY_HEADING)];
  if (headings.length === 0) {
    throw new ProtocolKeyRegisterError("no entries — the heading grammar changed");
  }

  return headings.map((heading, at) => {
    // Tests keep `!` (§9.5): the pattern captured both groups, and a wrong
    // assumption here fails this file's own test rather than travelling on.
    const key = heading[1]!;
    const state = heading[2]!;

    // The body runs to the next entry, so one entry's health line can never be
    // read as another's.
    const from = heading.index + heading[0].length;
    const to = headings[at + 1]?.index ?? register.length;
    const body = register.slice(from, to);
    const health = HEALTH_LINE.exec(body);

    const cited = EVIDENCE_PARAGRAPH.exec(body);
    // Joined into one line so a reader of it does not have to know where the
    // prose happened to wrap.
    const evidence = cited === null ? null : cited[1]!.replace(/\s+/g, " ").trim();

    const shape = parseShape(body, key);

    if (health === null) return { key, state, healthEffect: null, evidence, shape };

    // A typo cannot be left to fall through as "no claim". It would read as
    // silence, the witness would stop excluding the key, coverage would shrink,
    // and every guard would still pass — a number quietly too low, arrived at by
    // a spelling mistake.
    const healthEffect = health[1]!;
    if (!isHealthEffect(healthEffect)) {
      throw new ProtocolKeyRegisterError(
        `\`${key}\` states a health effect nothing knows how to check: "${healthEffect}"`,
      );
    }

    return { key, state, healthEffect, evidence, shape };
  });
}

const REGISTER_PATH = new URL("../docs/protocol-keys.md", import.meta.url).pathname;

export const PROTOCOL_KEY_REGISTER: ProtocolKeyEntry[] = parseProtocolKeyRegister(
  readFileSync(REGISTER_PATH, "utf8"),
);

export function getKeysWithHealthEffect(effect: ProtocolKeyHealthEffect): string[] {
  return PROTOCOL_KEY_REGISTER.filter((entry) => entry.healthEffect === effect).map(
    (entry) => entry.key,
  );
}

export function getKeysInState(state: string): string[] {
  return PROTOCOL_KEY_REGISTER.filter((entry) => entry.state === state).map((entry) => entry.key);
}
