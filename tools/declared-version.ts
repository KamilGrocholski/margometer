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

/** What a build handed no version is: the declaration, marked as not the release of it. */
export function getDevelopmentVersion(): string {
    const declared = getDeclaredVersion(Deno.readTextFileSync(CONFIGURATION_FILE));
    const version = `${declared}${DEVELOPMENT_SUFFIX}`;
    assert(version.startsWith(declared), "a development build names the work it is built from");
    assert(version !== declared, "and never passes for the release that number belongs to");
    return version;
}
