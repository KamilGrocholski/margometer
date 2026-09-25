/**
 * Which `develop` commit the recordings are read out of. This branch carries no `captures/` of its
 * own (`docs/design.md` §11), so every suite reads them at the one revision: Deno's through
 * `tests/recorded-fights.ts`, and the browser's through `tests/e2e/panel-page.ts`.
 */

export const RECORDINGS_REVISION = "fa1dcce";
export const RECORDINGS_DIRECTORY = "captures/";
