/**
 * The one place a version is written down, and what a build handed none says instead. A module
 * rather than a function inside the changelog, for the cycle **ADR 0035** names.
 */

import { assert } from "@std/assert";
import { DeclaredVersionError } from "@/tools/margometer-tool-error.ts";
import { CONFIGURATION_FILE } from "@/project/repository-layout.ts";

const VERSION_KEY = '"version":';
const QUOTE = '"';
/** Sorts below the release of that number, so a copy built here is offered the release. */
const DEVELOPMENT_SUFFIX = "-dev";
/** How a run says the tree it stands on is the one that ships — **ADR 0037**. */
export const RELEASE_FLAG = "--release";

/**
 * Walked rather than parsed: `deno.json` carries comments, so `JSON.parse` refuses it and a JSON
 * reader that allows them is a dependency nothing else wants. The first `"version":` is the
 * tree's own — a later one belongs to something nested inside it.
 */
export function getDeclaredVersion(configuration: string): string {
    assert(configuration.length > 0, "a configuration that was read says something");
    for (const line of configuration.split("\n")) {
        const stated = line.trim();
        if (!stated.startsWith(VERSION_KEY)) continue;
        const opening = stated.indexOf(QUOTE, VERSION_KEY.length);
        if (opening === -1) break;
        const closing = stated.indexOf(QUOTE, opening + 1);
        if (closing === -1) break;
        const declared = stated.slice(opening + 1, closing);
        assert(declared.length > 0, "a version that is declared is spelled out");
        return declared;
    }
    throw new DeclaredVersionError(`${CONFIGURATION_FILE} declares no version to build at`);
}

/** The declaration, unmarked. Only a run told it stands on the release tree states this. */
export function getReleaseVersion(): string {
    const declared = getDeclaredVersion(Deno.readTextFileSync(CONFIGURATION_FILE));
    assert(declared.length > 0, "a release is the version the tree declares");
    assert(!declared.endsWith(DEVELOPMENT_SUFFIX), "and a declaration carries no build's mark");
    return declared;
}

/** What a build handed no version is: the declaration, marked as not the release of it. */
export function getDevelopmentVersion(): string {
    const declared = getReleaseVersion();
    const version = `${declared}${DEVELOPMENT_SUFFIX}`;
    assert(version.startsWith(declared), "a development build names the work it is built from");
    assert(version !== declared, "and never passes for the release that number belongs to");
    return version;
}

/**
 * Whether a version something was built at belongs to the tree as it stands: the declaration, or
 * the declaration marked as a build nobody tagged. Anything else was built at another version and
 * is still sitting where a reader is pointed at it.
 */
export function isVersionOfTree(stated: string, declared: string): boolean {
    assert(stated.length > 0, "a thing that was built states the version it was built at");
    assert(declared.length > 0, "and the tree states the version it is");
    if (stated === declared) return true;
    return stated === `${declared}${DEVELOPMENT_SUFFIX}`;
}

/** What a run states as its version: the declaration where it is a release, marked otherwise. */
export function getVersionForRun(args: readonly string[]): string {
    const isRelease = args.includes(RELEASE_FLAG);
    const version = isRelease ? getReleaseVersion() : getDevelopmentVersion();
    assert(version.length > 0, "a run states the version it is");
    assert(isRelease !== version.endsWith(DEVELOPMENT_SUFFIX), "and marks what is not a release");
    return version;
}
