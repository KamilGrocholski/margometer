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
import { getPartsSeparatedByWhitespace } from "@/libs/text-runs.ts";
import { getHeadingDepth, getLabelledLine, getTickedNames } from "@/tests/document-lines.ts";
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
  /**
   * The one token whose cause is stated by a **different message**: a wound ticks
   * with nobody in the other slot, and the blow that applied it named both ends
   * (§9.6, `WOUND_ANNOUNCEMENT_BY_TICK_KEY`).
   */
  "the wound's attacker",
  "nobody",
] as const;

export type ProtocolKeyCause = (typeof PROTOCOL_KEY_CAUSES)[number];

/**
 * Where every occurrence of a key sits. One phrase has to hold for **all** of
 * them, so the weakest true one is the right one — "on a blow" is a stronger
 * claim than "on a message reporting damage" and a key that does both takes the
 * second.
 *
 * ⚠️ **The last one is the floor, and it was missing for as long as no key stood
 * on it.** The measurement has always had a fallback for a key that fits none of
 * the four; the register had no word for it, so the first key to reach it would
 * have failed the gate with nothing true to write. Two did at once, when
 * `tests/captured-fights/2026-08-27-luvia-grupa-vs-amaimon.json` brought a
 * poison tick carrying its own reduction: `poison` had been alone in its message
 * everywhere and `-poison_lowdmg_per` had been on damage everywhere, and neither
 * is any more.
 */
export const PROTOCOL_KEY_PLACEMENTS = [
  "alone in its message",
  "on a skill announcement",
  "on a blow",
  "on a message reporting damage",
  "anywhere",
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

const ENTRY_DEPTH = 3;

const HEALTH_LABEL = "*Health:* ";
const CAUSE_LABEL = "*Cause:* ";
const SHAPE_LABEL = "*Shape:* ";
/**
 * Read first and on purpose: a `*Help:*` line stating neither direction below is
 * **refused**, the way a misspelled health verdict is. Falling through to null
 * instead would let "probably documented somewhere" sit in the register looking
 * more settled than silence while checking nothing.
 */
const HELP_LABEL = "*Help:* ";
const EVIDENCE_LABEL = "*Evidence:* ";

const OCCURRENCES_WORD = " occurrences";
const FIELD_SEPARATOR = ";";

/** One entry: the key in ticks, and the state after the dash. */
type EntryHeading = { key: string; state: string; start: number; end: number };

/**
 * Every `### \`key\` — state` heading, with where its line ends.
 *
 * A `###` line written any other way is not an entry and is passed over rather
 * than refused: the register's own prose carries headings of that depth.
 */
function getEntryHeadings(register: string): EntryHeading[] {
  const headings: EntryHeading[] = [];
  let start = 0;
  for (const line of register.split("\n")) {
    const end = start + line.length;
    const stated = getEntryHeading(line);
    if (stated !== null) headings.push({ ...stated, start, end });
    start = end + 1;
  }
  return headings;
}

function getEntryHeading(line: string): { key: string; state: string } | null {
  if (getHeadingDepth(line) !== ENTRY_DEPTH) return null;
  const written = line.slice(ENTRY_DEPTH + 1);
  if (!written.startsWith(TICK)) return null;
  const closing = written.indexOf(TICK, 1);
  if (closing <= 1) return null;
  const dash = " — ";
  if (!written.startsWith(dash, closing + 1)) return null;
  const state = written.slice(closing + 1 + dash.length);
  return state === "" ? null : { key: written.slice(1, closing), state };
}

const TICK = "`";

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
  const stated = getLabelledLine(body, SHAPE_LABEL);
  if (stated === null) return null;

  // Three fields: a count of occurrences, where the key sits, and what its value
  // looks like. Only the first two separators divide them — a value shape is
  // free to carry one of its own.
  const counted = stated.indexOf(OCCURRENCES_WORD + FIELD_SEPARATOR);
  const occurrences = counted === -1 ? null : getIntegerFromText(stated.slice(0, counted));
  if (occurrences === null) {
    throw new ProtocolKeyRegisterError(`\`${key}\` states an unreadable occurrence count`);
  }
  const rest = stated.slice(counted + OCCURRENCES_WORD.length + FIELD_SEPARATOR.length);
  const divide = rest.indexOf(FIELD_SEPARATOR);
  if (divide === -1) {
    throw new ProtocolKeyRegisterError(`\`${key}\` states a shape with no value shape in it`);
  }
  const placement = rest.slice(0, divide).trim();
  if (!isPlacement(placement)) {
    throw new ProtocolKeyRegisterError(`\`${key}\` states a placement nothing checks: "${placement}"`);
  }
  const valueShape = rest.slice(divide + FIELD_SEPARATOR.length).trim();
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
 * ⚠️ **One tail is not a name, and asking for it makes a true silence
 * unstateable.** `-allies` says *whom* an effect reaches, not what it is, so the
 * engine name of `removedot-allies` is its head — and `allies` occurs in the
 * article on every sibling key that is documented, so a claim of silence obliged
 * to list it would be refused for saying something false. Where the tail is one
 * of those suffixes the head is what has to have been searched.
 *
 * Deliberately **not** derived any further than this. `( freeze )` counts zero
 * where bare `freeze` counts four, so a rule that parenthesised the name would
 * bless a false silence for a key this register cites the help for. The phrases
 * are stated by a person; this only refuses the ones that cannot have been enough.
 */
export function getRequiredHelpPhrases(key: string): string[] {
  const bare = SIGNS.includes(key[0] ?? "") ? key.slice(1) : key;
  const separator = getFirstSeparator(bare);
  if (separator === -1) return [bare];
  const tail = bare.slice(separator + 1);
  if (SCOPE_SUFFIXES.includes(tail)) return [bare, bare.slice(0, separator)];
  return [bare, tail];
}

/**
 * Tails that say whom an effect reaches rather than what it is.
 *
 * One entry, because one key needs it (§7.1): every other suffixed key in the
 * register is documented under its full name, so no claim of silence has ever had
 * to be made about one. `-enemies` and `-all` join it the day one does.
 */
const SCOPE_SUFFIXES = ["allies"];

/** What the protocol writes in front of a key to say which way it points. */
const SIGNS = ["+", "-"];

/** What joins the halves of a compound key. */
const SEPARATORS = "_-";

function getFirstSeparator(key: string): number {
  for (let index = 0; index < key.length; index += 1) {
    if (SEPARATORS.includes(key[index] ?? "")) return index;
  }
  return -1;
}

function isHelpDirection(value: string): value is ProtocolKeyHelpDirection {
  return (PROTOCOL_KEY_HELP_DIRECTIONS as readonly string[]).includes(value);
}

function parseHelp(body: string, key: string): ProtocolKeyHelpClaim | null {
  const stated = getLabelledLine(body, HELP_LABEL);
  if (stated === null) return null;

  // Longest first: one direction begins with the other, and reading the shorter
  // would call "names nothing of" a claim that the help names something.
  const direction = [...PROTOCOL_KEY_HELP_DIRECTIONS]
    .sort((one, other) => other.length - one.length)
    .find((one) => stated.startsWith(`${one} `) && stated.length > one.length + 1);
  // A line that exists and states neither direction is refused rather than read
  // as silence, the way a misspelled health verdict is.
  if (direction === undefined) {
    throw new ProtocolKeyRegisterError(`\`${key}\` states a help claim nothing checks: "${stated}"`);
  }
  if (!isHelpDirection(direction)) {
    throw new ProtocolKeyRegisterError(`\`${key}\` states a help direction nothing checks: "${direction}"`);
  }

  const phrases = getTickedNames(stated.slice(direction.length + 1));
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

/**
 * The evidence paragraph, joined into one line.
 *
 * To the next blank line, not to the end of the first one: evidence wraps, and
 * the citation's date routinely lands on a later line than the article it dates.
 * Joined so a reader of it does not have to know where the prose happened to
 * wrap.
 */
function getEvidence(body: string): string | null {
  const lines = body.split("\n");
  const at = lines.findIndex((line) => line.startsWith(EVIDENCE_LABEL));
  if (at === -1) return null;
  const paragraph = [lines[at]?.slice(EVIDENCE_LABEL.length) ?? ""];
  for (const line of lines.slice(at + 1)) {
    if (line === "") break;
    paragraph.push(line);
  }
  return getPartsSeparatedByWhitespace(paragraph.join(" ")).join(" ");
}

export function parseProtocolKeyRegister(register: string): ProtocolKeyEntry[] {
  const headings = getEntryHeadings(register);
  if (headings.length === 0) {
    throw new ProtocolKeyRegisterError("no entries — the heading grammar changed");
  }

  return headings.map((heading, at) => {
    const key = heading.key;
    const state = heading.state;

    // The body runs to the next entry, so one entry's health line can never be
    // read as another's.
    const to = headings[at + 1]?.start ?? register.length;
    const body = register.slice(heading.end, to);
    const health = getLabelledLine(body, HEALTH_LABEL);

    const evidence = getEvidence(body);

    const shape = parseShape(body, key);
    const help = parseHelp(body, key);

    const charged = getLabelledLine(body, CAUSE_LABEL);

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
    const cause = charged;
    if (!isCause(cause)) {
      throw new ProtocolKeyRegisterError(
        `\`${key}\` states a cause nothing knows how to check: "${cause}"`,
      );
    }

    // A typo cannot be left to fall through as "no claim". It would read as
    // silence, the witness would stop excluding the key, coverage would shrink,
    // and every guard would still pass — a number quietly too low, arrived at by
    // a spelling mistake.
    const healthEffect = health;
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
