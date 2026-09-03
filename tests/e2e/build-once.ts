/**
 * The file a reader installs, built once for the whole run. Every other suite here imports
 * TypeScript modules; this one drives what `deno task build` writes, so a bundler that emitted
 * something a browser refuses has somewhere to fail. **ADR 0047.**
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { expect, type FullConfig } from "@playwright/test";

/** `tools/build-userscript.ts` owns both names; a loader that cannot resolve `jsr:` respells. */
export const USERSCRIPT_NAME = "margometer.user.js";
export const METADATA_NAME = "margometer.meta.js";
const BUILT_DIRECTORY = "dist";
/** The banner line stating which build this is, as `composeUserscriptBanner` writes it. */
const VERSION_OPENER = "// @version";

/** Not `rootDir`: Playwright answers that with the common root of the test directories. */
export function getRepositoryRoot(config: { configFile?: string; rootDir: string }): string {
    const named = config.configFile;
    const root = named === undefined ? config.rootDir : dirname(named);
    expect(root.length, "a run knows which tree it is in").toBeGreaterThan(0);
    return root;
}

export function readBuiltUserscript(rootDirectory: string): string {
    const built = readFileSync(join(rootDirectory, BUILT_DIRECTORY, USERSCRIPT_NAME), "utf8");
    expect(built.length, "the build left a bundle to serve").toBeGreaterThan(0);
    return built;
}

/**
 * The version the **banner** states, and not the constant the bundle carries: two code paths —
 * `composeUserscriptBanner` writes one and `setVersionInBundle` the other.
 */
export function readBuiltVersion(rootDirectory: string): string {
    const banner = readFileSync(join(rootDirectory, BUILT_DIRECTORY, METADATA_NAME), "utf8");
    const lines = banner.split("\n").filter((line) => line.startsWith(VERSION_OPENER));
    expect(lines.length, `${METADATA_NAME} carries one ${VERSION_OPENER} line`).toBe(1);
    const stated = (lines[0] ?? "").slice(VERSION_OPENER.length).trim();
    expect(stated.length, "and that line states a version").toBeGreaterThan(0);
    return stated;
}

/** Shelled out to rather than re-implemented: `tools/build-userscript.ts` owns how a build runs. */
export default function setBuiltOnce(config: FullConfig): void {
    const root = getRepositoryRoot(config);
    execFileSync("deno", ["task", "build"], { cwd: root, stdio: "inherit" });
    expect(readBuiltUserscript(root).length, "the bundle says something").toBeGreaterThan(0);
    expect(readBuiltVersion(root).length, "and states a version").toBeGreaterThan(0);
}
