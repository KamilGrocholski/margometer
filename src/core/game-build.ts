/**
 * What a game build id looks like, and the two places the client states one.
 *
 * The add-on stamps it onto a recording so the material can be dated (§7.6), and
 * `tools/game-client-source.ts` reads it off a world page to decide whether the
 * cached bundle is the one players are running. **Those two numbers only mean
 * the same thing if they are read the same way**, and until this file existed
 * they were two copies of one pattern on opposite sides of §9.1's boundary —
 * with a comment in the entry point naming the other copy and leaving the
 * agreement to a sentence (`docs/audits/2026-08-14-the-whole-tree-read-again.md`,
 * F18).
 *
 * In `core` because it is the only layer both an add-on file and a tool may
 * read, and because it qualifies: a contract with the client's own naming,
 * expressed as pure text, needing no DOM, no engine and no panel.
 */

import {
  getEndOfAlphanumerics,
  getEndOfWhitespace,
  isWordStart,
} from "@/libs/text-runs.ts";

/**
 * Eight characters or more of letters and digits — which is both shapes the
 * client has served, named once so the two readers below cannot come to disagree
 * about it.
 *
 * ⚠️ **It stopped being a number, and the reader that only knew numbers reported
 * a page with no build at all.** Until 2026-08-25 every bundle arrived as
 * `main.min1786514810315.js` — a millisecond timestamp, which is where the old
 * floor of ten digits came from. Read on 2026-08-25, `tempest.margonem.pl` and
 * `luvia.margonem.pl` both serve `/js/main.min.53XkBRxF.js`: a separating dot,
 * and eight characters of mixed case. So the three recordings made that day carry
 * `build: null` and are undated for good (§9.2) — not because the client stated
 * nothing, but because this floor refused what it stated
 * (`docs/specs/2026-08-25-a-recording-that-names-no-build.md`, which left fixing
 * the reader to a later round).
 *
 * The floor is what the two observed forms have in common and nothing more: the
 * new id is eight characters and the old ones are thirteen. What keeps a run of
 * letters and digits from being some neighbouring word is the shape around it —
 * a name that is `main.min` … `.js`, or a `version:` key — rather than the token
 * itself, which is why the token may be this loose.
 */
const LEAST_BUILD_CHARACTERS = 8;

const SCRIPT_NAME_HEAD = "main.min";
const SCRIPT_NAME_TAIL = ".js";
const OPTIONAL_SEPARATOR = ".";
const INLINE_KEY = "version:";
const OPTIONAL_QUOTE = '"';

/** Where a bundle name sits in a page, and where the id sits inside it. */
type ScriptNameSpan = { start: number; end: number; buildStart: number; buildEnd: number };

/**
 * `main.min<build>.js` or `main.min.<build>.js`, the name every bundle the client
 * loads is served under. The separator is optional because the client added one
 * when the id stopped being a number, and both names are still in this
 * repository: the cache holds a bundle fetched under the older one.
 *
 * Walked rather than matched, like everything else that reads text here. Two
 * details are the pattern's own rules written forwards. The separator is taken
 * whenever it is there and never weighed against leaving it — a build id is
 * letters and digits, so a run beginning at the dot could not be one. And a
 * `main.min` whose tail does not hold is not the end of the search: the scan
 * resumes past it, because a page states this name more than once and only one
 * of them need be the bundle.
 */
function getScriptNameSpan(text: string): ScriptNameSpan | null {
  for (let from = 0; ; ) {
    const head = text.indexOf(SCRIPT_NAME_HEAD, from);
    if (head === -1) return null;
    from = head + 1;

    let buildStart = head + SCRIPT_NAME_HEAD.length;
    if (text[buildStart] === OPTIONAL_SEPARATOR) buildStart += 1;

    const buildEnd = getEndOfAlphanumerics(text, buildStart);
    if (buildEnd - buildStart < LEAST_BUILD_CHARACTERS) continue;
    if (!text.startsWith(SCRIPT_NAME_TAIL, buildEnd)) continue;

    return { start: head, end: buildEnd + SCRIPT_NAME_TAIL.length, buildStart, buildEnd };
  }
}

/**
 * The build id from a script filename, or null.
 *
 * Null rather than a stand-in wherever it is absent: §7.6 says material from the
 * game without the client's version is not comparable material, and a recording
 * that quietly claimed a build would be worse than one admitting it has none.
 */
export function getGameBuildFromScriptName(text: string): string | null {
  const span = getScriptNameSpan(text);
  return span === null ? null : text.slice(span.buildStart, span.buildEnd);
}

/**
 * The bundle's whole filename, for whoever has to ask the server for it.
 *
 * The same span as above, one field wider, because the id is no longer enough to
 * rebuild the name from: `main.min` + id + `.js` was true of every name the
 * client served until 2026-08-25 and is not true of `main.min.53XkBRxF.js`. A
 * tool that composed the name from the id would ask for a file that is not there,
 * and composing it is a guess where the page states the answer.
 */
export function getGameBundleNameFromScriptName(text: string): string | null {
  const span = getScriptNameSpan(text);
  return span === null ? null : text.slice(span.start, span.end);
}

/**
 * The same, from the `build = { version: … }` object a world page states inline
 * beside its scripts.
 *
 * `version` has to begin a word, or `apiversion:` would answer for it — that is
 * the `\b` the pattern here carried. The quote is optional and taken the way the
 * separator above is, and for the same reason.
 */
export function getGameBuildFromInlineObject(text: string): string | null {
  for (let from = 0; ; ) {
    const key = text.indexOf(INLINE_KEY, from);
    if (key === -1) return null;
    from = key + 1;
    if (!isWordStart(text, key)) continue;

    let start = getEndOfWhitespace(text, key + INLINE_KEY.length);
    if (text[start] === OPTIONAL_QUOTE) start += 1;

    const end = getEndOfAlphanumerics(text, start);
    if (end - start < LEAST_BUILD_CHARACTERS) continue;
    return text.slice(start, end);
  }
}
