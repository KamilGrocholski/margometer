/**
 * The build id the client states in its bundle's file name, so material can be dated. An absent id
 * is a failure the reader is shown as unknown and never a stand-in: a recording that claimed a
 * build would be worse than one admitting it has none. Text is walked rather than matched (C7).
 */

import { assert } from "@std/assert/assert";
import { callForeign, err, ok, type Result } from "@/libs/result.ts";
import { getEndOfRun } from "@/libs/text-walk.ts";
import { PAGE_READ_FAILURE, PAGE_READING, type PageReadFailure } from "@/src/game/page-reading.ts";

export interface BuildPort {
    readBuildId(): Result<string, PageReadFailure>;
}

/** The whole of what this asks a page for: the sources of its scripts. */
export interface PageScripts {
    readScriptSources(): readonly unknown[];
}

/**
 * What both shapes the client has served have in common. Until 2026-08-25 a bundle was
 * `main.min1786514810315.js`, thirteen digits of timestamp; read 2026-08-25, `tempest` and `luvia`
 * both serve `/js/main.min.53XkBRxF.js`, a dot and eight characters of mixed case.
 */
const BUILD_CHARACTERS_MINIMUM = 8;
const SCRIPT_NAME_HEAD = "main.min";
const SCRIPT_NAME_TAIL = ".js";
const OPTIONAL_SEPARATOR = ".";
/** A page states a handful of scripts, and a source names the bundle at most a few times. */
const LOOKS_MAXIMUM = 256;
const SCRIPTS_MAXIMUM = 4096;

export function initPageBuild(scripts: PageScripts): BuildPort {
    return {
        readBuildId() {
            const sources = callForeign(() => scripts.readScriptSources());
            if (!sources.ok) return sources;
            const walked = Math.min(sources.value.length, SCRIPTS_MAXIMUM);
            for (let at = 0; at < walked; at += 1) {
                const source = sources.value[at];
                if (typeof source !== "string") continue;
                const build = parseGameBuild(source);
                if (build !== null) return ok(build);
            }
            return err({ kind: PAGE_READ_FAILURE.absent, reading: PAGE_READING.build });
        },
    };
}

/**
 * `main.min<build>.js` or `main.min.<build>.js`, null for anything else. A `main.min` whose tail
 * does not hold is not the end of the search: a page states this name more than once.
 */
export function parseGameBuild(text: string): string | null {
    let from = 0;
    for (let look = 0; look < LOOKS_MAXIMUM; look += 1) {
        const head = text.indexOf(SCRIPT_NAME_HEAD, from);
        if (head === -1) return null;
        from = head + 1;
        let buildStart = head + SCRIPT_NAME_HEAD.length;
        if (text.charAt(buildStart) === OPTIONAL_SEPARATOR) buildStart += 1;
        const buildEnd = getEndOfRun(text, buildStart, isAlphanumericAt);
        if (buildEnd - buildStart < BUILD_CHARACTERS_MINIMUM) continue;
        if (!text.startsWith(SCRIPT_NAME_TAIL, buildEnd)) continue;
        assert(head < buildStart, "a name starts before the id inside it");
        return text.slice(buildStart, buildEnd);
    }
    return null;
}

function isAlphanumericAt(text: string, index: number): boolean {
    const character = text.charAt(index);
    if (character >= "0") {
        if (character <= "9") return true;
    }
    if (character >= "a") {
        if (character <= "z") return true;
    }
    if (character >= "A") return character <= "Z";
    return false;
}
