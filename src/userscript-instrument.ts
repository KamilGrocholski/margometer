/**
 * The seam a cost measurement goes through, and what it costs when nobody is
 * measuring: nothing.
 *
 * ⚠️ **This file is swapped at build time, not branched at run time.** Bun
 * substitutes a `define` but does not fold the branch it feeds — measured on
 * `1.3.14`, a constant defined as `false` arrives as `var x = false` and the
 * `if (x)` under it survives verbatim under `minify: false`, along with
 * everything the branch imports. A flag would therefore have shipped the
 * recorder, the overlay and the clock inside the file people install, switched
 * off. `build.ts` resolves this specifier to
 * `src/userscript-instrument-development.ts` instead, so the production bundle
 * never names any of them — `tests/tools/userscript-development.test.ts` holds
 * that over the built text rather than over the intention.
 *
 * The two files keep one shape between them, and
 * `tests/tools/userscript-development.test.ts` is what says so: a development build
 * whose seam had drifted would not fail, it would simply stop measuring.
 *
 * The pass-through costs a call per phase per payload against work measured in
 * milliseconds. That is the honest price of the seam, and it is nothing.
 */

/**
 * The page, exactly as loosely as the entry point already holds it.
 *
 * Declared here rather than imported from the overlay, and the reason is the
 * swap: an import of `src/ui/` from this file would put the overlay's module in
 * the production bundle, which is the one thing this arrangement exists to
 * prevent. The narrowing to something with an `id` and a `style` happens on the
 * development side, where the overlay already is.
 */
export type InstrumentPage = {
  document?:
    | {
        createElement(tag: string): unknown;
        body?: { append(node: unknown): void } | undefined;
      }
    | undefined;
};

/** Runs the work and hands back what it returned. Here, that is all it does. */
export function getTimedResult<Result>(_name: string, work: () => Result): Result {
  return work();
}

/** Draws nothing: there is nothing measured to draw. */
export function setCostDrawn(_page: InstrumentPage): void {}
