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

export type ProtocolKeyEntry = {
  key: string;
  state: string;
  /**
   * Null when the register makes no claim — the default, and the honest answer
   * for a key the captures cannot settle either way.
   */
  healthEffect: ProtocolKeyHealthEffect | null;
};

const ENTRY_HEADING = /^### `([^`]+)` — (.+)$/gm;
const HEALTH_LINE = /^\*Health:\* (.+)$/m;

function isHealthEffect(value: string): value is ProtocolKeyHealthEffect {
  return (PROTOCOL_KEY_HEALTH_EFFECTS as readonly string[]).includes(value);
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

    if (health === null) return { key, state, healthEffect: null };

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

    return { key, state, healthEffect };
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
