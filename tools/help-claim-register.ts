/**
 * What `docs/protocol-keys.md` claims about the published help, read out of the document.
 *
 * The register is where a verdict lives; this is the reader that turns its `_Help:_` lines back
 * into phrases. Two things need them and neither may guess: the guard re-earning each claim
 * against the frozen counts, and the freeze that writes those counts.
 */

import { assert } from "@std/assert";

export const REGISTER_PATH = "docs/protocol-keys.md";
export const BACKTICK = "`";
/** Past the phrase count of any claim in the register, so each walk carries a stated bound. */
export const MAXIMUM_PHRASES = 64;

/** The register writes it italic; the section defining the vocabulary writes it bold. */
const HELP_MARKERS = ["_Help:_", "*Help:*"];
const SILENCE_CLAIM = "names nothing of";
const OCCURRENCE_CLAIM = "names";

export interface HelpClaim {
    line: number;
    isSilent: boolean;
    phrases: string[];
}

/** Every backticked phrase on the line, in the order it states them. */
export function getBacktickedPhrases(text: string): string[] {
    const found: string[] = [];
    let from = 0;
    for (let look = 0; look < MAXIMUM_PHRASES; look += 1) {
        const open = text.indexOf(BACKTICK, from);
        if (open === -1) break;
        const close = text.indexOf(BACKTICK, open + 1);
        if (close === -1) break;
        found.push(text.slice(open + 1, close));
        from = close + 1;
    }
    assert(found.length <= MAXIMUM_PHRASES, "a claim names no more phrases than the bound");
    assert(found.every((one) => !one.includes(BACKTICK)), "a phrase carries no delimiter of ours");
    return found;
}

/** The claim a line makes, or null where the line makes none. */
export function getHelpClaim(line: string, at: number): HelpClaim | null {
    const trimmed = line.trim();
    const marker = HELP_MARKERS.find((one) => trimmed.startsWith(one));
    if (marker === undefined) return null;
    const body = trimmed.slice(marker.length).trim();
    const isSilent = body.startsWith(SILENCE_CLAIM);
    if (!isSilent && !body.startsWith(OCCURRENCE_CLAIM)) return null;
    const phrases = getBacktickedPhrases(body);
    assert(at >= 1, "a line number is one-based");
    assert(phrases.length > 0, "a claim names at least one phrase");
    return { line: at, isSilent, phrases };
}

export function getHelpClaims(text: string): HelpClaim[] {
    const found: HelpClaim[] = [];
    for (const [offset, line] of text.split("\n").entries()) {
        const claim = getHelpClaim(line, offset + 1);
        if (claim !== null) found.push(claim);
    }
    assert(found.every((one) => one.line > 0), "every claim knows which line it is on");
    assert(found.length <= text.length, "no more claims than characters");
    return found;
}

/**
 * Every phrase the register stands on, once each and in code-unit order — which is the order the
 * frozen table is written in, so a re-freeze that counted the same phrases produces the same file.
 */
export function getCitedHelpPhrases(text: string): string[] {
    const found = new Set<string>();
    for (const claim of getHelpClaims(text)) {
        for (const phrase of claim.phrases) found.add(phrase);
    }
    const sorted = [...found].sort();
    assert(sorted.length <= text.length, "no more phrases than characters to have written them in");
    assert(sorted.every((one) => one.length > 0), "a phrase that was cited says something");
    return sorted;
}
