/**
 * The register's claims about the published help, re-earned against the frozen counts.
 *
 * A negative recorded from a search nobody re-runs is how four keys came to be filed as
 * undocumented while the help described all four. Every reader here is proved on a sample it
 * must flag and one it must not: the first catches a reader that has stopped finding its
 * subject, and only the second catches one that finds too much.
 */

import { assert, assertEquals } from "@std/assert";
import { FROZEN_HELP_PHRASES } from "@/frozen/help-phrases.ts";
import { FROZEN_PROTOCOL_KEYS } from "@/frozen/protocol-keys.ts";
import { SELF_SOURCED_HEALING_KEYS } from "@/src/core/fight-decoder.ts";

const REGISTER_PATH = "docs/protocol-keys.md";
/** The register writes it italic; the section defining the vocabulary writes it bold. */
const HELP_MARKERS = ["_Help:_", "*Help:*"];
const SILENCE_CLAIM = "names nothing of";
const OCCURRENCE_CLAIM = "names";
const BACKTICK = "`";
/**
 * A tail that says **whom** an effect reaches rather than what it is. `-allies` occurs in the
 * article on every documented sibling, so a rule asking for it would make a true silence
 * unstateable: the engine name of `removedot-allies` is its head. `-enemies` joins this the day
 * a claim needs it.
 */
const SCOPE_SUFFIXES = ["allies"];
const SEPARATORS = "_-";
/** What ends a paragraph: nothing, or the fence closing the section that states the vocabulary. */
const CLAIM_TERMINATORS = ["", "\`\`\`"];
/** Past the phrase count of any claim in the register, so each walk carries a stated bound. */
const MAXIMUM_PHRASES = 64;

interface HelpClaim {
    line: number;
    isSilent: boolean;
    phrases: string[];
}

/** Every backticked phrase on the line, in the order it states them. */
function getBacktickedPhrases(text: string): string[] {
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
function getHelpClaim(line: string, at: number): HelpClaim | null {
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

function getHelpClaims(text: string): HelpClaim[] {
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
 * What a claim of silence has to have tried: the key without its sign, and the tail after its
 * first separator — the help publishes `legbon_facade` as `facade`. Where that tail is a scope
 * suffix the **head** is the engine name, so it is what has to have been searched.
 */
function getStemPhrases(key: string): string[] {
    const bare = key.startsWith("+") || key.startsWith("-") ? key.slice(1) : key;
    let at = -1;
    for (let index = 0; index < bare.length; index += 1) {
        if (!SEPARATORS.includes(bare.charAt(index))) continue;
        at = index;
        break;
    }
    if (at === -1) return [bare];
    const tail = bare.slice(at + 1);
    assert(tail.length > 0, "a separator with nothing after it is not a separator");
    assert(at < bare.length, "a separator sits inside the name it was found in");
    if (SCOPE_SUFFIXES.includes(tail)) return [bare, bare.slice(0, at)];
    return [bare, tail];
}

const REGISTER = Deno.readTextFileSync(REGISTER_PATH);
const COUNTS: Record<string, number> = FROZEN_HELP_PHRASES.counts;

Deno.test("the reader knows a help claim from every other line", () => {
    const named = getHelpClaim("_Help:_ names `verycrit`", 1);
    assertEquals(named?.phrases, ["verycrit"], "the reader flags its own sample");
    assertEquals(named?.isSilent, false, "and reads it as an occurrence");

    const silent = getHelpClaim("*Help:* names nothing of `tenacity`, `ten`", 9);
    assertEquals(silent?.phrases, ["tenacity", "ten"], "both phrases of a silence are read");
    assertEquals(silent?.isSilent, true, "and the claim is read as one");

    assertEquals(getHelpClaim("_Shape:_ 26 occurrences; on a blow", 1), null, "another line");
    assertEquals(getHelpClaim("the help names `heal` somewhere in prose", 1), null, "and prose");
});

Deno.test("every phrase the register cites is one the frozen table counted", () => {
    const claims = getHelpClaims(REGISTER);
    assert(claims.length > 0, "there are claims to check");
    const uncounted: string[] = [];
    for (const claim of claims) {
        for (const phrase of claim.phrases) {
            if (Object.hasOwn(COUNTS, phrase)) continue;
            uncounted.push(`${REGISTER_PATH}:${claim.line} "${phrase}"`);
        }
    }
    assertEquals(uncounted, [], "a claim cites a phrase nothing counted");
});

Deno.test("an occurrence counts more than nothing, and a silence exactly nothing", () => {
    const disagreeing: string[] = [];
    for (const claim of getHelpClaims(REGISTER)) {
        for (const phrase of claim.phrases) {
            const count = COUNTS[phrase];
            if (count === undefined) continue;
            if (claim.isSilent && count !== 0) {
                disagreeing.push(
                    `${claim.line}: silence claimed for "${phrase}", counted ${count}`,
                );
            }
            if (!claim.isSilent && count === 0) {
                disagreeing.push(`${claim.line}: "${phrase}" claimed, counted nothing`);
            }
        }
    }
    assert(Object.keys(COUNTS).length > 0, "there are counts to disagree with");
    assertEquals(disagreeing, [], "the article and the register say different things");
});

Deno.test("a claim of silence has tried the key's stem", () => {
    assertEquals(getStemPhrases("acdmg_destroyed"), ["acdmg_destroyed", "destroyed"], "the tail");
    assertEquals(getStemPhrases("+superspell-dispel"), ["superspell-dispel", "dispel"], "the sign");
    assertEquals(getStemPhrases("removedot-allies"), ["removedot-allies", "removedot"], "the head");
    assertEquals(getStemPhrases("tenacity"), ["tenacity"], "a name with no separator is its stem");

    const untried: string[] = [];
    for (const claim of getHelpClaims(REGISTER)) {
        if (!claim.isSilent) continue;
        const key = claim.phrases[0] ?? "";
        for (const stem of getStemPhrases(key)) {
            if (claim.phrases.includes(stem)) continue;
            untried.push(`${REGISTER_PATH}:${claim.line} never tried "${stem}"`);
        }
    }
    assertEquals(untried, [], "a silence that did not try the stem is a false negative");
});

Deno.test("no claim runs onto a second line, where this reader would see half of it", () => {
    const lines = REGISTER.split("\n");
    const continued: string[] = [];
    for (const claim of getHelpClaims(REGISTER)) {
        const next = (lines[claim.line] ?? "").trim();
        if (CLAIM_TERMINATORS.includes(next)) continue;
        if (getHelpClaim(next, claim.line + 1) !== null) continue;
        continued.push(`${REGISTER_PATH}:${claim.line} is followed by "${next}"`);
    }
    assert(lines.length > 0, "there is a document to read");
    assertEquals(continued, [], "a wrapped claim is a claim read by halves");
});

const CAUSE_MARKER = "_Cause:_";
const SELF_SOURCED_CLAIM = "the subject's own";
const SECTION_MARKER = "### ";
const ABSENCE_CLAIM = "absence of ";
const CLIENT_LIST_CLAIM = " from the client's list";

/** The key each section is about, paired with the cause its entry states, in document order. */
function getCauseClaims(text: string): { key: string; cause: string }[] {
    const found: { key: string; cause: string }[] = [];
    let key = "";
    for (const line of text.split("\n")) {
        if (line.startsWith(SECTION_MARKER)) {
            key = getBacktickedPhrases(line)[0] ?? "";
            continue;
        }
        if (!line.startsWith(CAUSE_MARKER)) continue;
        assert(key.length > 0, "a cause stands inside a section about a key");
        found.push({ key, cause: line.slice(CAUSE_MARKER.length).trim() });
    }
    return found;
}

Deno.test("the register and the decoder agree on whose the healing is, both ways", () => {
    const sample = "### `heal` — decoded\n_Cause:_ the subject's own\n";
    assertEquals(
        getCauseClaims(sample),
        [{ key: "heal", cause: SELF_SOURCED_CLAIM }],
        "the reader",
    );
    assertEquals(getCauseClaims("_Health:_ moves health\n"), [], "a line that is not a cause");

    const register = Deno.readTextFileSync(REGISTER_PATH);
    const claimed = getCauseClaims(register)
        .filter((one) => one.cause === SELF_SOURCED_CLAIM)
        .map((one) => one.key)
        .sort();
    assert(claimed.length > 0, "the register claims it of something");
    assertEquals(
        claimed,
        [...SELF_SOURCED_HEALING_KEYS].sort(),
        "a key charged to the healed here and read some other way there, or the reverse",
    );
});

/** Every key the register states the client does not know, read out of the sentence saying so. */
function getAbsentKeys(text: string): string[] {
    const found: string[] = [];
    let at = text.indexOf(ABSENCE_CLAIM);
    let looked = 0;
    while (at !== -1) {
        looked += 1;
        assert(looked <= MAXIMUM_PHRASES, "the walk stays inside its stated bound");
        const rest = text.slice(at + ABSENCE_CLAIM.length);
        const claimed = rest.startsWith(BACKTICK) ? rest.slice(1) : "";
        const closes = claimed.indexOf(BACKTICK);
        const key = closes === -1 ? "" : claimed.slice(0, closes);
        if (key.length > 0) {
            if (claimed.slice(closes + 1).startsWith(CLIENT_LIST_CLAIM)) found.push(key);
        }
        at = text.indexOf(ABSENCE_CLAIM, at + 1);
    }
    return found;
}

Deno.test("a key the register calls absent from the client is absent from the frozen table", () => {
    const said = "the absence of `+frost` from the client's list is";
    assertEquals(getAbsentKeys(said), ["+frost"], "the reader finds the claim");
    assertEquals(getAbsentKeys("the absence of `+frost` from the help"), [], "and not another");

    const absent = getAbsentKeys(Deno.readTextFileSync(REGISTER_PATH));
    assert(absent.length > 0, "the register makes the claim of something");
    const known = new Set<string>(FROZEN_PROTOCOL_KEYS.keys);
    const present = absent.filter((key) => known.has(key));
    assertEquals(present, [], "the client's own table knows a key the register calls absent");
});
