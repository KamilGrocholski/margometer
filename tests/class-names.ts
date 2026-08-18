/**
 * The one question two guards ask: which class names does this stylesheet style,
 * and which does this source assign?
 *
 * `tests/ui/panel-class-names.test.ts` asks it of the panel — a stylesheet in one
 * file and a renderer in another — and `tests/tools/preview-class-names.test.ts`
 * asks it of the preview harness, where the rules sit in `tools/preview-page.ts`
 * and the build status is written from `tools/preview-server.ts`. Both exist
 * because a class on one side and no class on the other fails silently: an
 * unstyled node draws, and a rule nothing wears styles nothing
 * (`docs/specs/2026-08-18-a-name-we-did-not-choose.md`).
 *
 * ⚠️ **Only the part that is genuinely one question is here**, which is the same
 * line `tests/dated-document.ts` draws. The two guards still disagree about what
 * counts as a consumer — the preview reads its own markup and a second source
 * file, the panel does not — and none of that moved, so neither needs the other
 * open to be read.
 */

/**
 * The classes a stylesheet styles.
 *
 * Takes CSS rather than the file that composes it: the sources here interpolate
 * design tokens (`${t.radius}`) and cite neighbouring modules in prose, and a
 * `.name` pattern is happy to call both of those a selector (§7.5 — extract
 * structure with structure). What comes back from a composer is CSS, so the only
 * thing left to strip is CSS's own comments.
 */
export function getStyledClassNames(css: string): Set<string> {
  const styled = new Set<string>();
  for (const rule of css.replaceAll(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{[^{}]*\}/g)) {
    for (const name of rule[1]!.matchAll(/\.([A-Za-z][\w-]*)/g)) styled.add(name[1]!);
  }
  return styled;
}

/**
 * The classes a TypeScript source assigns to a node.
 *
 * Comparison operands go first. `className` is assigned out of a ternary on
 * `line.kind === "title"` and the like, and without this the words being compared
 * arrive as though they were class names.
 *
 * The caller strips its own comments — what counts as one is the caller's
 * business, and `libs/source-regions.ts` already owns the answer.
 */
export function getAssignedClassNames(sourceWithoutComments: string): Set<string> {
  const assigned = new Set<string>();
  // `[=:]` because a class can arrive as an object property rather than an
  // assignment — the panel's title-bar buttons carry theirs that way.
  for (const site of sourceWithoutComments
    .replaceAll(/[!=]==?\s*"[^"]*"/g, "")
    .matchAll(/\bclassName\s*[=:]\s*([^;,]+)/g)) {
    for (const text of site[1]!.matchAll(/"([^"]*)"/g)) {
      for (const name of text[1]!.split(/\s+/).filter(Boolean)) assigned.add(name);
    }
  }
  return assigned;
}
