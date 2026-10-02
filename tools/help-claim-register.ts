/**
 * What `docs/protocol-keys.md` claims about the published help, read out of the document: its
 * `_Help:_` lines turned back into phrases. Two readers need them and neither may guess: the guard
 * re-earning each claim against the frozen counts, and the freeze that writes those counts.
 */

import { assert } from "@std/assert";

export interface HelpClaim {
    line: number;
    isSilent: boolean;
    phrases: string[];
}

export const REGISTER_PATH = "docs/protocol-keys.md";
export const BACKTICK = "`";
/** Past the phrase count of any claim in the register, so each walk carries a stated bound. */
export const PHRASES_MAXIMUM = 64;

/** The register writes it italic; the section defining the vocabulary writes it bold. */
const HELP_MARKERS = ["_Help:_", "*Help:*"];
const SILENCE_CLAIM = "names nothing of";
const OCCURRENCE_CLAIM = "names";

/**
 * Every phrase the register stands on, once each and in code-unit order, which is the order the
 * frozen table is written in: a re-freeze that counted the same phrases writes the same file.
 */
export function parseCitedHelpPhrases(text: string): string[] {
    const phrases = new Set<string>();
    for (const claim of parseHelpClaims(text)) {
        for (const phrase of claim.phrases) phrases.add(phrase);
    }
    const sorted = [...phrases].sort();
    assert(sorted.length <= text.length, "no more phrases than characters to have written them in");
    assert(sorted.every((phrase) => phrase.length > 0), "a phrase that was cited says something");
    return sorted;
}

export function parseHelpClaims(text: string): HelpClaim[] {
    const claims: HelpClaim[] = [];
    for (const [offset, line] of text.split("\n").entries()) {
        const claim = parseHelpClaim(line, offset + 1);
        if (claim !== null) claims.push(claim);
    }
    assert(claims.every((claim) => claim.line > 0), "every claim knows which line it is on");
    assert(claims.length <= text.length, "no more claims than characters");
    return claims;
}

/** The claim a line makes, or null where the line makes none. */
export function parseHelpClaim(line: string, lineNumber: number): HelpClaim | null {
    assert(lineNumber >= 1, "a line number is one-based");
    const trimmed = line.trim();
    const marker = HELP_MARKERS.find((knownMarker) => trimmed.startsWith(knownMarker));
    if (marker === undefined) return null;
    const body = trimmed.slice(marker.length).trim();
    const isSilent = body.startsWith(SILENCE_CLAIM);
    if (!isSilent) {
        if (!body.startsWith(OCCURRENCE_CLAIM)) return null;
    }
    const phrases = parseBacktickedPhrases(body);
    assert(phrases.length > 0, "a claim names at least one phrase");
    return { line: lineNumber, isSilent, phrases };
}

/** Every backticked phrase in the text, in the order it states them. */
export function parseBacktickedPhrases(text: string): string[] {
    const phrases: string[] = [];
    let from = 0;
    for (let look = 0; look < PHRASES_MAXIMUM; look += 1) {
        const open = text.indexOf(BACKTICK, from);
        if (open === -1) break;
        const close = text.indexOf(BACKTICK, open + 1);
        if (close === -1) break;
        phrases.push(text.slice(open + 1, close));
        from = close + 1;
    }
    assert(phrases.length <= PHRASES_MAXIMUM, "a claim names no more phrases than the bound");
    assert(
        phrases.every((phrase) => !phrase.includes(BACKTICK)),
        "a phrase carries no delimiter of ours",
    );
    return phrases;
}
