/**
 * What version of the add-on this is.
 *
 * Substituted by `build.ts` from `package.json`, which is the only place it is
 * written down. The fallback is what a test runner and a bare `bun` see, and it
 * says so rather than pretending to be a release — a version nobody built is not
 * a version worth quoting in a report.
 */
declare const __MARGOMETER_VERSION__: string | undefined;

export const USERSCRIPT_VERSION: string =
  typeof __MARGOMETER_VERSION__ === "string" ? __MARGOMETER_VERSION__ : "z drzewa";
