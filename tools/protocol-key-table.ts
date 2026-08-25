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
 *
 * ⚠️ **Two builds' worth of spelling, and neither is the thing being matched.**
 * Build `53XkBRxF` is bundled by a different tool than `1786514810315` was:
 * string literals are backticks, the bundle imports two sibling chunks, and the
 * default branch compares the other way round — `j[0].substr(1,3)==`dmg`` where
 * it read ``"dmg"==x[0].substr(1,3)``. Neither difference is structural, and the
 * key list came out of the two builds identical, key for key. What that cost was
 * a freeze that threw `the switch has no case labels`, which is the right
 * failure and is why the table was never quietly shortened. The patterns below
 * accept either quoting and either order for that reason, and go no further:
 * a bundler is free to write `["+"].includes(…)` tomorrow, and this should stop
 * again rather than guess.
 */

import { writeFileSync } from "node:fs";
import { composeJsonText } from "@/libs/json.ts";
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
 *
 * ⚠️ **The subject is matched by shape, and the reason is a build.** It was the
 * literal `O[0]){` — the name the minifier happened to give that variable in
 * build `1785244275300`. Build `1786441768914` calls it `y`, and the tool refused
 * the whole bundle over one renamed letter: it found the anchor and not the
 * switch, which reads as "the client was restructured" when nothing structural
 * had changed at all.
 *
 * A minifier renames every local on every build, so any literal name here is a
 * dated fuse. What does not change is the shape: the discriminant is a comma
 * expression ending in some identifier indexed at zero — the key half of the
 * segment — followed by the switch block. That is structure, and §7.5 says to
 * extract structure with structure.
 */
const SWITCH_ANCHOR = "manageBattleEffects(";
const SWITCH_SUBJECT = /[A-Za-z_$]+\[0\]\)\{/;

/**
 * A string literal in any of the three quotings JavaScript has, because which one
 * a build uses is the bundler's taste and not the client's meaning.
 *
 * The class admits a mismatched pair — `"dmg\`` reads as one — which no valid
 * source can contain, and every use of this sits inside a longer shape that
 * decides what it is reading. A backreference would refuse the mismatch and cost
 * a capture group in every pattern that spells a literal twice.
 */
const QUOTED_LITERAL = String.raw`["'\`]([^"'\`]*)["'\`]`;

const CASE_LABEL = new RegExp(String.raw`case${QUOTED_LITERAL}:`, "g");

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

/**
 * The default branch, in the two orders the client has written it.
 *
 * Both say the same thing — *is the marker at this offset, and is the sign the
 * dealt one* — and they differ in which side of `==` each operand sits on, which
 * is a bundler's output style. Build `1786514810315` wrote the literal first;
 * `53XkBRxF` writes it second. So the shape is spelled twice rather than
 * loosened into something that would match any comparison of anything, and each
 * spelling carries which of its captures holds what, since the order of the
 * groups is exactly what differs.
 */
type DefaultBranchShape = {
  pattern: RegExp;
  groups: { marker: number; markerAt: number; markerLength: number; dealtSign: number };
};

const SEGMENT_KEY = String.raw`\w+\[0\]`;

const DEFAULT_BRANCH_SHAPES: readonly DefaultBranchShape[] = [
  {
    pattern: new RegExp(
      String.raw`default:${SEGMENT_KEY}\.substr\((\d+),(\d+)\)==${QUOTED_LITERAL}\?${SEGMENT_KEY}\.charAt\(0\)==${QUOTED_LITERAL}`,
    ),
    groups: { markerAt: 1, markerLength: 2, marker: 3, dealtSign: 4 },
  },
  {
    pattern: new RegExp(
      String.raw`default:${QUOTED_LITERAL}==${SEGMENT_KEY}\.substr\((\d+),(\d+)\)\?${QUOTED_LITERAL}==${SEGMENT_KEY}\.charAt\(0\)`,
    ),
    groups: { marker: 1, markerAt: 2, markerLength: 3, dealtSign: 4 },
  },
];

export function getComputedKeyFamily(bundle: string): ComputedKeyFamily {
  const shape = DEFAULT_BRANCH_SHAPES.map((one) => ({ one, match: one.pattern.exec(bundle) })).find(
    (tried): tried is { one: DefaultBranchShape; match: RegExpExecArray } => tried.match !== null,
  );
  const match = shape?.match ?? null;
  if (match === null) {
    throw new ProtocolKeyTableError(
      "no computed key family in the default branch — the client changed how it routes keys",
    );
  }
  // That the groups exist is ours to guarantee — the pattern captured them. What
  // the client wrote inside them is not, so the offsets are refused rather than
  // coerced: `Number()` on a mangled group would hand back a plausible index.
  const groups = assertDefined(shape, "a shape matched, so it says where its captures are").one
    .groups;
  const marker = assertDefined(match[groups.marker], "the shape captures the marker");
  const markerAt = getIntegerFromText(
    assertDefined(match[groups.markerAt], "the shape captures the offset"),
  );
  const markerLength = getIntegerFromText(
    assertDefined(match[groups.markerLength], "the shape captures the marker length"),
  );
  const dealtSign = assertDefined(match[groups.dealtSign], "the shape captures the dealt sign");

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

  // Searched from the anchor rather than over the whole bundle: `x[0]){` is an
  // ordinary shape, and the first one in a two-megabyte file belongs to whatever
  // happens to be earliest, not to this switch.
  const found = SWITCH_SUBJECT.exec(bundle.slice(anchor));
  if (found === null) {
    throw new ProtocolKeyTableError(
      `${SWITCH_ANCHOR} found but not the switch on the segment key`,
    );
  }
  const subject = anchor + found.index;

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
  computedFamily: ${composeJsonText(family)},
  keys: [
${keys.map((key) => `    ${composeJsonText(key)},`).join("\n")}
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
