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
 * nothing, but because this pattern refused what it stated
 * (`docs/specs/2026-08-25-a-recording-that-names-no-build.md`, which left fixing
 * the reader to a later round).
 *
 * The floor is what the two observed forms have in common and nothing more: the
 * new id is eight characters and the old ones are thirteen. What keeps the
 * pattern from matching some neighbouring word is the shape around it — a name
 * that is `main.min` … `.js`, or a `version:` key — rather than the token
 * itself, which is why the token may be this loose.
 */
const BUILD_TOKEN = String.raw`[0-9A-Za-z]{8,}`;

/**
 * `main.min<build>.js` or `main.min.<build>.js`, the name every bundle the client
 * loads is served under. The separator is optional because the client added one
 * when the id stopped being a number, and both names are still in this
 * repository: the cache holds a bundle fetched under the older one.
 */
const IN_SCRIPT_NAME = new RegExp(String.raw`main\.min\.?(${BUILD_TOKEN})\.js`);

/** `build = { version: … }`, which the page states inline beside the scripts. */
const IN_INLINE_OBJECT = new RegExp(String.raw`\bversion:\s*"?(${BUILD_TOKEN})`);

/**
 * The build id from a script filename, or null.
 *
 * Null rather than a stand-in wherever it is absent: §7.6 says material from the
 * game without the client's version is not comparable material, and a recording
 * that quietly claimed a build would be worse than one admitting it has none.
 */
export function getGameBuildFromScriptName(text: string): string | null {
  return IN_SCRIPT_NAME.exec(text)?.[1] ?? null;
}

/**
 * The bundle's whole filename, for whoever has to ask the server for it.
 *
 * The same match as above, one group wider, because the id is no longer enough to
 * rebuild the name from: `main.min` + id + `.js` was true of every name the
 * client served until 2026-08-25 and is not true of `main.min.53XkBRxF.js`. A
 * tool that composed the name from the id would ask for a file that is not there,
 * and composing it is a guess where the page states the answer.
 */
export function getGameBundleNameFromScriptName(text: string): string | null {
  return IN_SCRIPT_NAME.exec(text)?.[0] ?? null;
}

/** The same, from the inline object a world page carries. */
export function getGameBuildFromInlineObject(text: string): string | null {
  return IN_INLINE_OBJECT.exec(text)?.[1] ?? null;
}
