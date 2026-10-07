/**
 * The build id the client states in its bundle's file name, so material can be dated. An absent id
 * is a failure the reader is shown as unknown and never a stand-in: a recording that claimed a
 * build would be worse than one admitting it has none. Text is walked rather than matched (C7).
 */

import { assert } from "@std/assert/assert";
import * as errors from "#/libs/errors.ts";
import { lookupEndOfRun, RUN_CHARACTERS_MAXIMUM } from "#/libs/text-walk.ts";
import { MARGONEM_VALUE, type MargonemReadFailure, MargonemValueAbsent } from "./margonem-value.ts";

export interface MargonemClientBuildPort {
    readBuildId(): string | MargonemReadFailure;
}

/**
 * What both shapes the client has served have in common. Until 2026-08-25 a bundle was
 * `main.min1786514810315.js`, thirteen digits of timestamp; read 2026-08-25, `tempest` and `luvia`
 * both serve `/js/main.min.53XkBRxF.js`, a dot and eight characters of mixed case. Read 2026-10-02,
 * `experimental` serves `/js/main.min.COv-iBFt.js`: an id may carry a dash. Its siblings carry an
 * underscore: production `DHSqC3Uh` (fetched 2026-10-06) imports `./vendors.min.8bk8V_m0.js` and
 * development `BgP3Cxfl` (fetched 2026-10-07) `./rolldown-runtime.min.7_rZTKki.js`. One hasher
 * names every chunk, so the bundle's own id is drawn from the same alphabet.
 */
const BUILD_CHARACTERS_MINIMUM = 8;
const SCRIPT_NAME_HEAD = "main.min";
const SCRIPT_NAME_TAIL = ".js";
const OPTIONAL_SEPARATOR = ".";
const BUILD_DASH = "-";
const BUILD_UNDERSCORE = "_";
/**
 * Past what a page states: `tempest` and `experimental` each served four scripts with a source and
 * named `main.min` once, read 2026-10-06.
 */
export const SCRIPT_NAME_LOOKS_MAXIMUM = 256;
export const SCRIPTS_MAXIMUM = 4096;

/** `readScriptSources` is the whole of what this asks a page for. */
export function initMargonemClientBuild(
    readScriptSources: () => readonly unknown[],
): MargonemClientBuildPort {
    return {
        readBuildId() {
            const sources = errors.attempt(() => readScriptSources());
            if (sources instanceof Error) return sources;
            const walked = Math.min(sources.length, SCRIPTS_MAXIMUM);
            for (let scriptIndex = 0; scriptIndex < walked; scriptIndex += 1) {
                const source = sources[scriptIndex];
                if (typeof source !== "string") continue;
                const build = parseMargonemClientBuildId(source);
                if (build !== null) return build;
            }
            return new MargonemValueAbsent(MARGONEM_VALUE.build);
        },
    };
}

/**
 * `main.min<build>.js` or `main.min.<build>.js`, null for anything else. A `main.min` whose tail
 * does not hold is not the end of the search: a page states this name more than once.
 */
export function parseMargonemClientBuildId(text: string): string | null {
    const span = lookupScriptNameSpan(text);
    if (span === null) return null;
    return text.slice(span.buildStart, span.buildEnd);
}

/** Where the name starts, and where the id inside it does, so both readers walk once. */
function lookupScriptNameSpan(
    text: string,
): { nameStart: number; buildStart: number; buildEnd: number } | null {
    let from = 0;
    for (let look = 0; look < SCRIPT_NAME_LOOKS_MAXIMUM; look += 1) {
        const head = text.indexOf(SCRIPT_NAME_HEAD, from);
        if (head === -1) return null;
        from = head + 1;
        let buildStart = head + SCRIPT_NAME_HEAD.length;
        if (text.charAt(buildStart) === OPTIONAL_SEPARATOR) buildStart += 1;
        // A run past the bound on one is no id the client served, and the search goes on.
        const buildEnd = lookupEndOfRun(
            text,
            buildStart,
            RUN_CHARACTERS_MAXIMUM,
            isBuildCharacterAt,
        );
        if (buildEnd === null) continue;
        if (buildEnd - buildStart < BUILD_CHARACTERS_MINIMUM) continue;
        if (!text.startsWith(SCRIPT_NAME_TAIL, buildEnd)) continue;
        assert(head < buildStart, "a name starts before the id inside it");
        return { nameStart: head, buildStart, buildEnd };
    }
    return null;
}

/** A letter, a digit, a dash or an underscore: the alphabet the client's chunks are named in. */
function isBuildCharacterAt(text: string, index: number): boolean {
    const character = text.charAt(index);
    if (character === BUILD_DASH) return true;
    if (character === BUILD_UNDERSCORE) return true;
    if (character >= "0") {
        if (character <= "9") return true;
    }
    if (character >= "a") {
        if (character <= "z") return true;
    }
    if (character >= "A") return character <= "Z";
    return false;
}

/**
 * The whole `main.min.53XkBRxF.js`, for a tool that has to ask for the file rather than date it.
 * Composing the name from the id asks for one that is not there: the separator before the id is
 * the client's to choose, and it changed once (read 2026-08-25).
 */
export function parseMargonemClientBundleName(text: string): string | null {
    const span = lookupScriptNameSpan(text);
    if (span === null) return null;
    const end = span.buildEnd + SCRIPT_NAME_TAIL.length;
    assert(end <= text.length, "a name ends inside the text it was read from");
    return text.slice(span.nameStart, end);
}
