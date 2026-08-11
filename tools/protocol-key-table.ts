/**
 * Extracts the complete set of protocol keys the game client knows.
 *
 * The client decides what a message means in one `switch` over the key of each
 * parameter segment. Every branch of that switch is a key the game can send, so
 * the switch is the only complete answer to "what does the decoder not know
 * about" — captured fights only ever show the keys that happened to occur.
 *
 * Reads the **production** bundle, because production decides (AGENTS.md §7.6).
 * Measured when this was written: production carried four keys the readable
 * development build did not, and none the other way round. Trusting the
 * readable channel alone would have hidden them.
 *
 * Only the keys are lifted out. They are functional names, like a field name in
 * a wire format; the sentences the game composes from them stay in the cache
 * and never enter this repository (§5).
 */

import { writeFileSync } from "node:fs";
import { assertDefined } from "@/libs/assert.ts";
import { getIntegerFromText } from "@/libs/number.ts";
import { getCachedClientSource, getCachedBundle } from "@/tools/game-client-source.ts";
import { MargoMeterToolError } from "@/tools/margometer-tool-error.ts";

export class ProtocolKeyTableError extends MargoMeterToolError {
  constructor(reason: string) {
    super("ProtocolKeyTable", reason);
  }
}

/**
 * The switch sits inside the routine that dispatches battle effects, and
 * branches on the key half of a `key=value` segment. Both survive minification:
 * the call name because it is a public method, the keys because they are string
 * literals.
 */
const SWITCH_ANCHOR = "manageBattleEffects(";
const SWITCH_SUBJECT = "O[0]){";
const CASE_LABEL = /case"([^"]*)":/g;

/** The body of the first block that opens at or after `from`, brace-balanced. */
function getBlockBody(source: string, from: number): string {
  const start = source.indexOf("{", from);
  if (start === -1) throw new ProtocolKeyTableError("no block after the switch subject");

  let depth = 0;
  let quote: string | null = null;
  for (let at = start; at < source.length; at += 1) {
    const character = source[at];
    if (quote !== null) {
      if (character === "\\") at += 1;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'" || character === "`") quote = character;
    else if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, at + 1);
    }
  }
  throw new ProtocolKeyTableError("the switch block never closes");
}

/**
 * Not every key is spelled out. The switch ends in a default branch that
 * recognises a whole family by shape — sign plus a marker at a fixed offset —
 * and calls anything else an unknown parameter, in the game's own words.
 *
 * Captured in the frozen table rather than assumed, so a test can hold us to it
 * without reaching for the network, and so re-freezing shows in the diff if the
 * game ever stops doing it.
 */
export type ComputedKeyFamily = {
  marker: string;
  markerAt: number;
  markerLength: number;
  /** Sign that means the actor dealt it; anything else means it was taken. */
  dealtSign: string;
};

const DEFAULT_BRANCH =
  /default:"([^"]+)"==\w+\[0\]\.substr\((\d+),(\d+)\)\?"([^"]+)"==\w+\[0\]\.charAt\(0\)/;

export function getComputedKeyFamily(bundle: string): ComputedKeyFamily {
  const match = DEFAULT_BRANCH.exec(bundle);
  if (match === null) {
    throw new ProtocolKeyTableError(
      "no computed key family in the default branch — the client changed how it routes keys",
    );
  }
  // That the groups exist is ours to guarantee — the pattern captured them. What
  // the client wrote inside them is not, so the offsets are refused rather than
  // coerced: `Number()` on a mangled group would hand back a plausible index.
  const marker = assertDefined(match[1], "DEFAULT_BRANCH captures the marker");
  const markerAt = getIntegerFromText(assertDefined(match[2], "DEFAULT_BRANCH captures the offset"));
  const markerLength = getIntegerFromText(
    assertDefined(match[3], "DEFAULT_BRANCH captures the marker length"),
  );
  const dealtSign = assertDefined(match[4], "DEFAULT_BRANCH captures the dealt sign");

  if (markerAt === null || markerLength === null) {
    throw new ProtocolKeyTableError(
      "the default branch's offsets do not read as numbers — the client changed how it routes keys",
    );
  }
  return { marker, markerAt, markerLength, dealtSign };
}

export function getProtocolKeys(bundle: string): string[] {
  const anchor = bundle.indexOf(SWITCH_ANCHOR);
  if (anchor === -1) {
    throw new ProtocolKeyTableError(
      `no ${SWITCH_ANCHOR} in the bundle — the client was restructured`,
    );
  }

  const subject = bundle.indexOf(SWITCH_SUBJECT, anchor);
  if (subject === -1) {
    throw new ProtocolKeyTableError(
      `${SWITCH_ANCHOR} found but not the switch on the segment key`,
    );
  }

  const keys = [...getBlockBody(bundle, subject).matchAll(CASE_LABEL)].map((match) => match[1]);
  const distinct = [...new Set(keys)].filter((key): key is string => key !== undefined);
  if (distinct.length === 0) throw new ProtocolKeyTableError("the switch has no case labels");
  return distinct.sort();
}

const FROZEN_PATH = new URL("../tests/frozen-protocol-keys.ts", import.meta.url).pathname;

function composeFrozenModule(build: string, keys: string[], family: ComputedKeyFamily): string {
  return `// Generated by \`bun tools/protocol-key-table.ts freeze\`. Do not edit by hand.
//
// Every protocol key the game client branches on, lifted from the production
// bundle. Keys only: they are functional names, and the sentences the game
// composes from them are its own work and stay out of this repository.

export const FROZEN_PROTOCOL_KEYS = {
  gameBuild: "${build}",
  /** Keys the client recognises by shape rather than by name — see the tool. */
  computedFamily: ${JSON.stringify(family)},
  keys: [
${keys.map((key) => `    ${JSON.stringify(key)},`).join("\n")}
  ],
} as const;
`;
}

if (import.meta.main) {
  const cached = getCachedClientSource("production");
  if (cached === null) {
    throw new ProtocolKeyTableError(
      "nothing cached for production — run `bun tools/game-client-source.ts fetch production`",
    );
  }

  const bundle = getCachedBundle("production");
  const keys = getProtocolKeys(bundle);
  const family = getComputedKeyFamily(bundle);
  if (process.argv.includes("freeze")) {
    writeFileSync(FROZEN_PATH, composeFrozenModule(cached.build, keys, family));
    console.log(`froze ${keys.length} keys from build ${cached.build} → ${FROZEN_PATH}`);
  } else {
    console.log(`${keys.length} keys plus the ${family.marker} family in build ${cached.build}`);
    console.log("run with `freeze` to write tests/frozen-protocol-keys.ts");
  }
}
