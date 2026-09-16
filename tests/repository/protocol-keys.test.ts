/**
 * The register's claims about the published help, re-earned against the frozen counts.
 *
 * A negative recorded from a search nobody re-runs is how four keys came to be filed as
 * undocumented while the help described all four. Every reader here is proved on a sample it
 * must flag and one it must not: the first catches a reader that has stopped finding its
 * subject, and only the second catches one that finds too much.
 */

import { assert, assertEquals, assertThrows } from "@std/assert";
import { FROZEN_HELP_PHRASES } from "@/frozen/help-phrases.ts";
import { FROZEN_PROTOCOL_KEYS } from "@/frozen/protocol-keys.ts";
import {
    HEALTH_CHANGE_BY_KEY,
    isAppliedDamageKey,
    isDamageKey,
    NAMED_DAMAGE_KEY,
    SELF_SOURCED_HEALING_KEYS,
    UNACCOUNTED_HEALTH_KEY,
    WOUND_TICK_KEY,
} from "@/src/core/fight-decoder.ts";
import {
    DAMAGE_FAMILY_HEADING,
    getProseCountClaims,
    getRegisteredKeys,
    getStatedCountRule,
    getStatedVerdicts,
} from "@/tools/protocol-key-shape.ts";
import { readRecordingPaths } from "@/project/repository-layout.ts";
import { getSourcePaths } from "@/tests/source-paths.ts";
import {
    BACKTICK,
    getBacktickedPhrases,
    getCitedHelpPhrases,
    getHelpClaim,
    getHelpClaims,
    MAXIMUM_PHRASES,
    REGISTER_PATH,
} from "@/tools/help-claim-register.ts";

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

Deno.test("the frozen table counts exactly what the register cites, and nothing besides", () => {
    // `deno task game:help freeze` with no phrases takes its list from the register, so the two
    // sides are the same walk over the same document. What this catches is the freeze that was not
    // re-run: a claim added since carries no count, and a count outlives the claim that earned it.
    const cited = getCitedHelpPhrases(REGISTER);
    assert(cited.length > 0, "the register cites something");
    assertEquals(
        cited,
        Object.keys(COUNTS).sort(),
        "the table and the register name a different set",
    );
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

/** The key each section is about, paired with what the named line states, in document order. */
function getLabelClaims(text: string, marker: string): { key: string; claim: string }[] {
    assert(marker.length > 0, "a claim is read under a label");
    const found: { key: string; claim: string }[] = [];
    let key = "";
    for (const line of text.split("\n")) {
        if (line.startsWith(SECTION_MARKER)) {
            key = getBacktickedPhrases(line)[0] ?? "";
            continue;
        }
        if (!line.startsWith(marker)) continue;
        // The preamble states an `_Evidence:_` line of its own, for the claim that no key moves
        // health. It stands under a heading naming no key, so it is prose rather than an entry.
        if (key.length === 0) continue;
        found.push({ key, claim: line.slice(marker.length).trim() });
    }
    return found;
}

Deno.test("the register and the decoder agree on whose the healing is, both ways", () => {
    const sample = "### `heal` — decoded\n_Cause:_ the subject's own\n";
    assertEquals(
        getLabelClaims(sample, CAUSE_MARKER),
        [{ key: "heal", claim: SELF_SOURCED_CLAIM }],
        "the reader",
    );
    assertEquals(
        getLabelClaims("_Health:_ moves health\n", CAUSE_MARKER),
        [],
        "a line that is not a cause",
    );

    const register = Deno.readTextFileSync(REGISTER_PATH);
    const claimed = getLabelClaims(register, CAUSE_MARKER)
        .filter((one) => one.claim === SELF_SOURCED_CLAIM)
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

Deno.test("every entry carries a verdict the register says it uses", () => {
    const stated = "**A verdict is one of `decoded`, `investigated` or `not a battle key`**, and";
    assertEquals(getStatedVerdicts(stated), [
        "decoded",
        "investigated",
        "not a battle key",
    ], "the vocabulary is read off the sentence that states it");

    const register = Deno.readTextFileSync(REGISTER_PATH);
    const legal = new Set(getStatedVerdicts(register));
    assert(legal.size > 0, "the register names the verdicts an entry may carry");

    const read = getRegisteredKeys("### `+crit` — decoded\n### `+swing` — investigated\n");
    assertEquals(read.map((one) => one.verdict), ["decoded", "investigated"], "the reader works");
    assertEquals(getRegisteredKeys("Each entry carries a verdict.\n"), [], "and flags no prose");

    const entries = getRegisteredKeys(register);
    assert(entries.length > 0, "the register opens entries to read");
    const wrong = entries
        .filter((one) => !legal.has(one.verdict))
        .map((one) => `${REGISTER_PATH}:${one.line} says "${one.verdict}"`);
    assertEquals(wrong, [], "a verdict outside the stated list is refused, not read as silence");
});

/**
 * The verdict for a key that never reaches the battle reader at all, so the client's own switch
 * is not where it would appear. `docs/protocol-keys.md`'s preamble says what it means.
 */
const NOT_A_BATTLE_KEY = "not a battle key";

Deno.test("every entry names a key the client still composes", () => {
    const sample =
        "### `+crit` — decoded\n### `attack` — not a battle key\n### `-dmga` — decoded\n";
    assertEquals(
        getRegisteredKeys(sample).filter((one) => one.verdict !== NOT_A_BATTLE_KEY)
            .filter((one) => !isDamageKey(one.key)).map((one) => one.key),
        ["+crit"],
        "the reader asks after the entries the client's switch answers for",
    );

    const composed = new Set<string>(FROZEN_PROTOCOL_KEYS.keys);
    assert(composed.size > 0, "the frozen table names the keys the client composes");
    const gone = getRegisteredKeys(Deno.readTextFileSync(REGISTER_PATH))
        // A verdict saying the key is no battle key is saying the switch never carries it.
        .filter((one) => one.verdict !== NOT_A_BATTLE_KEY)
        // The family the client reads by shape has no case label, and neither has a member of it.
        .filter((one) => !isDamageKey(one.key))
        .filter((one) => !composed.has(one.key))
        .map((one) => `${REGISTER_PATH}:${one.line} states \`${one.key}\``);
    assertEquals(gone, [], "an entry documenting a key the client's own table no longer knows");
});

/**
 * A count of a key's occurrences belongs on the `_Shape:_` line, where a machine re-earns it. The
 * same count written in prose is re-earned by nobody, and goes wrong the day the next recording is
 * admitted while reading exactly as it did when it was right — which is how a key came to say it
 * occurred once where the corpus carried it twenty times, and another to count a neighbour at
 * twice its own re-earned figure.
 */
Deno.test("the reader knows a count of occurrences from every other sentence", () => {
    const flagged = getProseCountClaims(
        "### `-legbon_glare` — decoded\n\nIt has: one occurrence, on a blow, with no figure.\n",
    );
    assertEquals(flagged.map((one) => one.key), ["-legbon_glare"], "a count in prose is found");
    assertEquals(flagged.map((one) => one.recordings), [[]], "and it names no recording");

    const spelled = getProseCountClaims("### `+absorb` — decoded\n\nBoth occurrences ride it.\n");
    assertEquals(spelled.length, 1, "a figure spelled as a word is a figure");

    const scoped = getProseCountClaims(
        "### `-absorb` — decoded\n\n45 occurrences on `captures/one.json`, every one valued.\n",
    );
    assertEquals(scoped.map((one) => one.recordings), [["captures/one.json"]], "material carried");

    assertEquals(
        getProseCountClaims("### `winner` — decoded\n\nEvery occurrence has that shape.\n"),
        [],
        "a claim about every occurrence states no figure, so it is not a count",
    );
    assertEquals(
        getProseCountClaims("### `+crit` — decoded\n\n_Shape:_ 962 occurrences; on a blow; no\n"),
        [],
        "and the one line that owns a count is not one either",
    );
});

Deno.test("the rule this guard holds the register to is the register's own", () => {
    assertEquals(
        getStatedCountRule("x **A count of occurrences in prose names them.** y"),
        "A count of occurrences in prose names them.",
        "the rule is read off the sentence that states it",
    );
    assertEquals(
        getStatedCountRule("**A count of occurrences in prose\nnames them.**"),
        "A count of occurrences in prose names them.",
        "and over the sentence rather than the line, because the formatter wraps one",
    );
    assertThrows(
        () => getStatedCountRule("The register states no such rule.\n"),
        Error,
        "no sentence states",
        "a rule deleted from the document turns the guard off loudly",
    );
    assert(getStatedCountRule(REGISTER).length > 0, "and the register states it");
});

Deno.test("every count the prose writes names the recordings it was counted on", () => {
    const claims = getProseCountClaims(REGISTER);
    assert(claims.length > 0, "the register writes counts in prose for this to read");
    const unnamed = claims
        .filter((one) => one.recordings.length === 0)
        .map((one) => `${REGISTER_PATH}:${one.line} "${one.sentence}"`);
    assertEquals(unnamed, [], "a count over the corpus goes stale and reads as one that did not");
});

Deno.test("every recording a count rests on is one the material still holds", () => {
    const held = new Set(readRecordingPaths());
    assert(held.size > 0, "the material holds recordings for a count to name");
    const gone = getProseCountClaims(REGISTER).flatMap((one) =>
        one.recordings
            .filter((path) => !held.has(path))
            .map((path) => `${REGISTER_PATH}:${one.line} counts over ${path}`)
    );
    assertEquals(gone, [], "a count resting on a recording `captures/` no longer carries");
});

const HEALTH_MARKER = "_Health:_";
const HEALTH_CLAIM = "moves health";

const ACTOR_CLAIM = "the message actor";
const ANNOUNCER_CLAIM = "the announcement's actor";
const WOUND_CLAIM = "the wound's attacker";
const NOBODY_CLAIM = "nobody";

/**
 * Who the decoder charges the figure to, or `null` where it moves no health and so charges
 * nobody with anything. One function for both lines, because the register requires the cause
 * exactly where the health verdict is and a second reader could disagree with the first.
 *
 * The damage family is read by its sign rather than listed: the applied half of a blow is what
 * left the target, the raw half is what the figure was before any reduction, and the family
 * heading stands for both halves. Inside `HEALTH_CHANGE_BY_KEY` the slot and the sign answer it —
 * except for the three the help settles, which is the whole reason that list exists.
 */
function composeCauseOfKey(key: string): string | null {
    assert(key.length > 0, "a key is asked about by name");
    if (key === DAMAGE_FAMILY_HEADING) return ACTOR_CLAIM;
    if (isAppliedDamageKey(key)) return ACTOR_CLAIM;
    if (isDamageKey(key)) return null;
    if (SELF_SOURCED_HEALING_KEYS.includes(key)) return SELF_SOURCED_CLAIM;
    if (key === WOUND_TICK_KEY) return WOUND_CLAIM;
    if (key === NAMED_DAMAGE_KEY) return ACTOR_CLAIM;
    if (key === UNACCOUNTED_HEALTH_KEY) return ACTOR_CLAIM;
    const change = HEALTH_CHANGE_BY_KEY[key];
    if (change === undefined) return null;
    if (change.isOnTarget) return ANNOUNCER_CLAIM;
    if (change.sign > 0) return ACTOR_CLAIM;
    return NOBODY_CLAIM;
}

/** A key moves health exactly where somebody is charged with the figure it moved. */
function doesDecoderMoveHealth(key: string): boolean {
    assert(key.length > 0, "a key is asked about by name");
    return composeCauseOfKey(key) !== null;
}

/**
 * The line was documented as reaching `tests/core/health-witness.test.ts`, and reached nothing:
 * that test names its own two keys. Sixteen entries carried the line, `-dmga` moved health under
 * the same reading as the family it belongs to and stated none, and no guard could tell.
 */
Deno.test("the register and the decoder agree on which keys move health, both ways", () => {
    assertEquals(
        getLabelClaims("### `heal` — decoded\n_Health:_ moves health\n", HEALTH_MARKER),
        [{ key: "heal", claim: HEALTH_CLAIM }],
        "the reader",
    );
    assertEquals(
        getLabelClaims("_Cause:_ the message actor\n", HEALTH_MARKER),
        [],
        "a line that is not a health verdict",
    );
    assert(doesDecoderMoveHealth("-dmg"), "the applied half of a blow moves health");
    assert(!doesDecoderMoveHealth("+dmg"), "and the raw half is what it was before reduction");
    assert(!doesDecoderMoveHealth("+crit"), "a proc carries no figure at all");

    const register = Deno.readTextFileSync(REGISTER_PATH);
    const said = new Set(
        getLabelClaims(register, HEALTH_MARKER)
            .filter((one) => one.claim === HEALTH_CLAIM)
            .map((one) => one.key),
    );
    assert(said.size > 0, "the register states the verdict of something");

    const wrong = getRegisteredKeys(register)
        .filter((one) => doesDecoderMoveHealth(one.key) !== said.has(one.key))
        .map((one) =>
            `${REGISTER_PATH}:${one.line} \`${one.key}\` ${
                said.has(one.key)
                    ? "states a health verdict the decoder does not read"
                    : "moves health and states no verdict"
            }`
        );
    assertEquals(wrong, [], "the line and the decoder disagree about a key");
});

/**
 * The table in the register's preamble says what each cause is held against, and until now one of
 * the five was: the other four were read into the guard and dropped. Two of them named constants
 * the tree had renamed away from, which is what a claim nobody re-earns looks like after a
 * refactor.
 */
Deno.test("the register and the decoder agree on who each figure is charged to, both ways", () => {
    assertEquals(composeCauseOfKey("-dmg"), ACTOR_CLAIM, "the applied half is the actor's");
    assertEquals(composeCauseOfKey("+dmg"), null, "the raw half charges nobody with anything");
    assertEquals(composeCauseOfKey("heal_target"), ANNOUNCER_CLAIM, "the target slot is announced");
    assertEquals(composeCauseOfKey("poison"), NOBODY_CLAIM, "and a tick nothing names is nobody's");

    const register = Deno.readTextFileSync(REGISTER_PATH);
    const said = new Map(
        getLabelClaims(register, CAUSE_MARKER).map((one) => [one.key, one.claim]),
    );
    assert(said.size > 0, "the register charges something to somebody");

    const wrong = getRegisteredKeys(register)
        .filter((one) => composeCauseOfKey(one.key) !== (said.get(one.key) ?? null))
        .map((one) =>
            `${REGISTER_PATH}:${one.line} \`${one.key}\` says ${
                said.get(one.key) ?? "nothing"
            }, the decoder reads ${composeCauseOfKey(one.key) ?? "no figure at all"}`
        );
    assertEquals(wrong, [], "a figure charged one way here and read another way there");
});

/** What an entry may say in place of evidence of its own, where a neighbour's covers it. */
const EVIDENCE_MARKER = "_Evidence:_";
const EVIDENCE_DELEGATIONS = ["Evidence as above", "the evidence is that entry's"];

/**
 * An entry rests on something or it rests on a neighbour, and saying neither is how three entries
 * came to carry a verdict with nothing behind it. A delegation is prose rather than a line,
 * because what it points at differs per entry and a marker would say less than the sentence does.
 */
Deno.test("every entry states its evidence or says whose it takes", () => {
    const register = Deno.readTextFileSync(REGISTER_PATH);
    const carried = new Set(getLabelClaims(register, EVIDENCE_MARKER).map((one) => one.key));
    assert(carried.size > 0, "the register carries evidence lines to find");

    const delegating = new Set<string>();
    let key = "";
    for (const line of register.split("\n")) {
        if (line.startsWith(SECTION_MARKER)) {
            key = getBacktickedPhrases(line)[0] ?? "";
            continue;
        }
        if (!EVIDENCE_DELEGATIONS.some((one) => line.includes(one))) continue;
        delegating.add(key);
    }
    assert(delegating.size > 0, "and entries that take a neighbour's");

    const bare = getRegisteredKeys(register)
        .filter((one) => !carried.has(one.key))
        .filter((one) => !delegating.has(one.key))
        .map((one) => `${REGISTER_PATH}:${one.line} \`${one.key}\``);
    assertEquals(bare, [], "an entry whose verdict rests on nothing a reader can follow");
});

/** Two headings under one key both parse, and a reader takes whichever it met last. */
Deno.test("no key opens an entry twice", () => {
    const twice = getRegisteredKeys("### `+crit` — decoded\n### `+crit` — investigated\n");
    assertEquals(twice.length, 2, "the reader takes both headings rather than collapsing them");

    const seen = new Map<string, number>();
    const repeated: string[] = [];
    for (const entry of getRegisteredKeys(Deno.readTextFileSync(REGISTER_PATH))) {
        const before = seen.get(entry.key);
        if (before !== undefined) {
            repeated.push(
                `${REGISTER_PATH}:${entry.line} \`${entry.key}\`, already open at ${before}`,
            );
            continue;
        }
        seen.set(entry.key, entry.line);
    }
    assertEquals(repeated, [], "one key, two entries, and a reader takes the one it met last");
});

/** A shouted constant is at least this long, so `ADR` and `N13` are not read as one. */
const SHOUTED_LEAST = 4;
const UNDERSCORE = "_";

/** Whether every character is one a shouted module constant is spelled with (**N1**). */
function isShoutedName(phrase: string): boolean {
    assert(phrase.length > 0, "a phrase the register backticked says something");
    if (phrase.length < SHOUTED_LEAST) return false;
    let letters = 0;
    for (const character of phrase) {
        if (character === UNDERSCORE) continue;
        if (character >= "A" && character <= "Z") {
            letters += 1;
            continue;
        }
        if (character >= "0" && character <= "9") continue;
        return false;
    }
    return letters > 0;
}

/**
 * The register states what the tree reads **now** (**C3**), so a constant it names is one a
 * reader can open. Three were not: `SIDE_SHARE_HEALTH_KEYS` collapsed into the one key it held,
 * `WOUND_ANNOUNCEMENT_BY_TICK_KEY` became a pair, and `PROC_KEYS` was renamed by ADR 0093 — the
 * rename pass moved the code and the register's own table kept pointing at the old names.
 *
 * An ADR is the opposite case and is not read here: it records a decision, so naming what it
 * renamed away from is the whole point.
 */
Deno.test("every constant the register names is one the tree still spells", () => {
    assert(isShoutedName("HEALTH_CHANGE_BY_KEY"), "a shouted constant is one");
    assert(!isShoutedName("ADR"), "and three letters are not");
    assert(!isShoutedName("Obrażenia"), "nor a word the game shouts at nobody");
    assert(!isShoutedName("_Shape:_"), "nor a label the register writes");

    // Read line by line, which is what that reader is bounded for: over a whole document it
    // stops at its own phrase bound, and a code fence hands it a phrase with nothing in it.
    const named = new Set<string>();
    for (const line of Deno.readTextFileSync(REGISTER_PATH).split("\n")) {
        for (const phrase of getBacktickedPhrases(line)) {
            if (phrase.length === 0) continue;
            if (!isShoutedName(phrase)) continue;
            named.add(phrase);
        }
    }
    assert(named.size > 0, "the register names constants to look for");

    const spelled = getSourcePaths().map((path) => Deno.readTextFileSync(path)).join("\n");
    assert(spelled.length > 0, "and there is TypeScript for them to be spelled in");
    const gone = [...named].filter((one) => !spelled.includes(one)).sort();
    assertEquals(gone, [], "the register names a constant no file in the tree spells");
});
