/**
 * Which browser on this machine a run drives, and the refusal when there is none.
 *
 * Chrome leads the candidates because `docs/browser-support.md` says a measurement is taken on
 * it. A run that found another engine has measured another layout.
 */

import { assert } from "@std/assert";
import { InstalledBrowserError } from "@/tools/margometer-tool-error.ts";

/** What names a browser for a run that argues none. */
export const BROWSER_VARIABLE = "MARGOMETER_BROWSER";
const BROWSER_CANDIDATES = ["google-chrome", "google-chrome-stable", "chromium"];

/** Where to look: what was argued, then what the environment names, then what is on the path. */
export function getBrowserAsked(argued: string | null, named: string | null): string[] {
    const candidates: string[] = [];
    if (argued !== null) candidates.push(argued);
    if (named !== null) candidates.push(named);
    for (const candidate of BROWSER_CANDIDATES) candidates.push(candidate);
    assert(candidates.length >= BROWSER_CANDIDATES.length, "there is somewhere to look");
    assert(candidates.every((one) => one.length > 0), "and each place looked in is named");
    return candidates;
}

/** The first candidate this machine answers `--version` for. A value from outside — **N16**. */
export async function readInstalledBrowser(candidates: readonly string[]): Promise<string> {
    assert(candidates.length > 0, "somewhere to look was named");
    for (const candidate of candidates) {
        try {
            const asked = await new Deno.Command(candidate, { args: ["--version"] }).output();
            if (asked.success) return candidate;
        } catch {
            // Not on the path under that name, which is the question this was asking.
            continue;
        }
    }
    throw new InstalledBrowserError(`no browser on this machine: tried ${candidates.join(", ")}`);
}
