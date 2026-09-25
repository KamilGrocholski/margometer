/**
 * Where the recordings are read from, and which `develop` commit this tree is held to. Every
 * suite reads the recordings off `captures/` in the tree: Deno's through `tests/recorded-fights.ts`
 * and the browser's through `tests/e2e/panel-page.ts`. `DEVELOP_REVISION` is `develop` @ `fa1dcce`,
 * whose figures and sheet this rewrite reproduces (`docs/design.md` §12, `AGENTS.md` W8).
 */

export const RECORDINGS_DIRECTORY = "captures/";
export const DEVELOP_REVISION = "fa1dcce";
