/**
 * The one place a version is written down, and what a build handed none says instead. A module
 * rather than a function inside the changelog, for the cycle **ADR 0035** names.
 */

import { assert, assertNotEquals } from "@std/assert";
import { parse as parseJsonc } from "@std/jsonc";
import { DeclaredVersionError } from "@/tools/margometer-tool-error.ts";
import { getStatedTextFromUnknown, isRecord } from "@/libs/unknown-reading.ts";
import { CONFIGURATION_FILE } from "@/project/repository-layout.ts";

/** Sorts below the release of that number, so a copy built here is offered the release. */
const DEVELOPMENT_SUFFIX = "-dev";
/** How a run says the tree it stands on is the one that ships — **ADR 0037**. */
export const RELEASE_FLAG = "--release";

/** `deno.json` carries comments, so `JSON.parse` refuses it and `@std/jsonc` does not. */
export function getDeclaredVersion(configuration: string): string {
    assert(configuration.length > 0, "a configuration that was read says something");
    const read: unknown = parseJsonc(configuration);
    if (!isRecord(read)) {
        throw new DeclaredVersionError(`${CONFIGURATION_FILE} is not a configuration`);
    }
    const declared = getStatedTextFromUnknown(read.version);
    if (declared === null) {
        throw new DeclaredVersionError(`${CONFIGURATION_FILE} declares no version to build at`);
    }
    assert(declared.length > 0, "a version that is declared is spelled out");
    return declared;
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
    assertNotEquals(version, declared, "and never passes for the release that number belongs to");
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
