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
 * Ten digits or more — a millisecond timestamp, which is what the client uses.
 * Named once so the two readers below cannot come to disagree about the shape.
 */
const BUILD_DIGITS = String.raw`\d{10,}`;

/** `main.min<build>.js`, the name every bundle the client loads is served under. */
const IN_SCRIPT_NAME = new RegExp(String.raw`main\.min(${BUILD_DIGITS})\.js`);

/** `build = { version: … }`, which the page states inline beside the scripts. */
const IN_INLINE_OBJECT = new RegExp(String.raw`\bversion:\s*(${BUILD_DIGITS})`);

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

/** The same, from the inline object a world page carries. */
export function getGameBuildFromInlineObject(text: string): string | null {
  return IN_INLINE_OBJECT.exec(text)?.[1] ?? null;
}
