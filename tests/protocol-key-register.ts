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
 * Who a health figure is charged to, as distinct from whose slot it sits in.
 *
 * The question `*Health:*` leaves open. A key that reports a figure the arithmetic
 * has to account for also has to be charged to somebody or to nobody, and the
 * panel draws a different row for each answer — so the register states it rather
 * than letting the decoder be the only place it is written down.
 *
 * ⚠️ **`the subject's own` is the one value backed by a citation.** The other three
 * are readings of the protocol; that one is a reading of the published help, which
 * says the effect belongs to the combatant it heals (§9.6). It is listed here
 * because a guard can still re-earn it — against
 * `SELF_SOURCED_HEALING_KEYS` — and an unheld claim is what this file exists to
 * refuse.
 *
 * Unlike `PROTOCOL_KEY_HEALTH_EFFECTS` this has an opposite, and `nobody` is it:
 * a health figure always has a cause or provably has none, so silence would be an
 * entry that never answered a question every entry has to.
 */
export const PROTOCOL_KEY_CAUSES = [
  "the subject's own",
  "the announcement's actor",
  "the message actor",
  "nobody",
] as const;

export type ProtocolKeyCause = (typeof PROTOCOL_KEY_CAUSES)[number];

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

/**
 * What the game's published help says about a key, in a form a test can re-earn.
 *
 * **The line states an occurrence; the prose states what it means.** That split
 * is the `*Shape:*` one: a machine can count a phrase in the article and cannot
 * read the paragraph around it. `step` occurs four times and is documented
 * nowhere — the hits sit inside longer Polish words — so a vocabulary of
 * "documented" and "not documented" would have no true line for that entry, and
 * the register has three like it.
 *
 * **Two obligations, and the second is the one that binds.**
 *
 * The first: every phrase named here is re-counted against
 * `tests/frozen-help-phrases.ts`, so a claim cannot drift from the article.
 *
 * The second: a claim of silence must have tried the key's **stem**. This is the
 * one that would have caught the failure, and the counting on its own would not
 * have. Four keys of the `legbon` family sat filed as undocumented while the help
 * described all four; the entry that got `+legbon_holytouch` wrong recorded the
 * phrases it searched, exactly as §7.6 demands, and they were `legbon_holytouch`
 * and `legbon`. Both count zero. A guard that re-measured only what was listed
 * would have agreed with the bug — which is the shape §7.5 warns about, a guard
 * naming the same wrong thing the code did.
 */
export const PROTOCOL_KEY_HELP_DIRECTIONS = ["names", "names nothing of"] as const;

export type ProtocolKeyHelpDirection = (typeof PROTOCOL_KEY_HELP_DIRECTIONS)[number];

export type ProtocolKeyHelpClaim = {
  direction: ProtocolKeyHelpDirection;
  phrases: string[];
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
  /** Null where the entry makes no claim about the help at all. */
  help: ProtocolKeyHelpClaim | null;
  /**
   * Null on every entry that states no health effect, where the guard refuses a
   * line rather than admitting one — a key moving no health charges nobody.
   */
  cause: ProtocolKeyCause | null;
};

const ENTRY_HEADING = /^### `([^`]+)` — (.+)$/gm;
const HEALTH_LINE = /^\*Health:\* (.+)$/m;
const CAUSE_LINE = /^\*Cause:\* (.+)$/m;
const SHAPE_LINE = /^\*Shape:\* (\d+) occurrences; ([^;]+); (.+)$/m;
/**
 * Matched first and on purpose: a `*Help:*` line the two forms below do not
 * recognise is **refused**, the way a misspelled health verdict is. Falling
 * through to null instead would let "probably documented somewhere" sit in the
 * register looking more settled than silence while checking nothing.
 */
const HELP_LINE = /^\*Help:\* (names nothing of|names) (.+)$/m;
const HELP_ANY_LINE = /^\*Help:\* (.+)$/m;
const BACKTICKED = /`([^`]+)`/g;
/**
 * To the next blank line, not to the end of the first one: evidence wraps, and
 * the citation's date routinely lands on a later line than the article it dates.
 */
const EVIDENCE_PARAGRAPH = /^\*Evidence:\* ((?:.+\n?)+)/m;

function isHealthEffect(value: string): value is ProtocolKeyHealthEffect {
  return (PROTOCOL_KEY_HEALTH_EFFECTS as readonly string[]).includes(value);
}

function isCause(value: string): value is ProtocolKeyCause {
  return (PROTOCOL_KEY_CAUSES as readonly string[]).includes(value);
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

/**
 * What a claim of silence is obliged to have searched: the key without its sign,
 * and — where that name is compound — the tail after its first separator.
 *
 * The tail is the whole rule. The help joins an article to a key through the
 * engine name it prints in parentheses, and for a compound key that name is
 * routinely the tail alone: `legbon_holytouch` is published as `holytouch`,
 * `legbon_facade` as `facade`. Searching the compound finds nothing and reads
 * exactly like an article that does not cover the key.
 *
 * Deliberately **not** derived any further than this. `( freeze )` counts zero
 * where bare `freeze` counts four, so a rule that parenthesised the name would
 * bless a false silence for a key this register cites the help for. The phrases
 * are stated by a person; this only refuses the ones that cannot have been enough.
 */
export function getRequiredHelpPhrases(key: string): string[] {
  const bare = key.replace(/^[+-]/, "");
  const separator = bare.search(/[_-]/);
  if (separator === -1) return [bare];
  return [bare, bare.slice(separator + 1)];
}

function isHelpDirection(value: string): value is ProtocolKeyHelpDirection {
  return (PROTOCOL_KEY_HELP_DIRECTIONS as readonly string[]).includes(value);
}

function parseHelp(body: string, key: string): ProtocolKeyHelpClaim | null {
  const line = HELP_LINE.exec(body);
  if (line === null) {
    // A line that exists and matches neither direction is refused rather than
    // read as silence, the way a misspelled health verdict is.
    const any = HELP_ANY_LINE.exec(body);
    if (any !== null) {
      throw new ProtocolKeyRegisterError(
        `\`${key}\` states a help claim nothing checks: "${any[1]!}"`,
      );
    }
    return null;
  }

  const direction = line[1]!;
  if (!isHelpDirection(direction)) {
    throw new ProtocolKeyRegisterError(`\`${key}\` states a help direction nothing checks: "${direction}"`);
  }

  const phrases = [...line[2]!.matchAll(BACKTICKED)].map((match) => match[1]!);
  if (phrases.length === 0) {
    throw new ProtocolKeyRegisterError(`\`${key}\` states a help claim naming no phrase`);
  }

  if (direction === "names nothing of") {
    const missing = getRequiredHelpPhrases(key).filter((required) => !phrases.includes(required));
    if (missing.length > 0) {
      throw new ProtocolKeyRegisterError(
        `\`${key}\` claims the help names nothing of it without trying ${missing.map((phrase) => `\`${phrase}\``).join(", ")}`,
      );
    }
  }

  return { direction, phrases };
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
    const help = parseHelp(body, key);

    const charged = CAUSE_LINE.exec(body);

    if (health === null) {
      // A cause with no health figure to charge is a claim about a key that
      // reports nothing — refused, rather than parsed and never read.
      if (charged !== null) {
        throw new ProtocolKeyRegisterError(
          `\`${key}\` states a cause without stating that it moves health`,
        );
      }
      return { key, state, healthEffect: null, evidence, shape, help, cause: null };
    }

    if (charged === null) {
      throw new ProtocolKeyRegisterError(`\`${key}\` moves health and states no cause`);
    }
    const cause = charged[1]!;
    if (!isCause(cause)) {
      throw new ProtocolKeyRegisterError(
        `\`${key}\` states a cause nothing knows how to check: "${cause}"`,
      );
    }

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

    return { key, state, healthEffect, evidence, shape, help, cause };
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

export function getKeysWithCause(cause: ProtocolKeyCause): string[] {
  return PROTOCOL_KEY_REGISTER.filter((entry) => entry.cause === cause).map((entry) => entry.key);
}

export function getKeysInState(state: string): string[] {
  return PROTOCOL_KEY_REGISTER.filter((entry) => entry.state === state).map((entry) => entry.key);
}
