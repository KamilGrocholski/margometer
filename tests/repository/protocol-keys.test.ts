/**
 * `docs/protocol-keys.md` re-earned: its claims about the published help against the frozen counts,
 * its keys against the client's frozen table, and its health and cause lines against what
 * `src/core/protocol-key.ts` reads each key as, both ways. Every reader here is proved on a sample
 * it must flag and one it must not: the first catches a reader that has stopped finding its
 * subject, and only the second catches one that finds too much.
 */

import { assert, assertEquals, assertThrows } from "@std/assert";
import type { VocabularyWord } from "#/libs/vocabulary.ts";
import { FROZEN_HELP_PHRASES } from "#/frozen/help-phrases.ts";
import { FROZEN_PROTOCOL_KEYS } from "#/frozen/protocol-keys.ts";
import {
    DAMAGE_HALF,
    getKeyReading,
    KEY_FAMILY,
    SELF_SOURCED_HEALING_KEYS,
    WOUND_TICK_KEY,
} from "#/src/core/protocol-key.ts";
import {
    BACKTICK,
    parseBacktickedPhrases,
    parseCitedHelpPhrases,
    parseHelpClaim,
    parseHelpClaims,
    PHRASES_MAXIMUM,
    REGISTER_PATH,
} from "#/tools/help-claim-register.ts";
import {
    DAMAGE_FAMILY_HEADING,
    parseProseCountClaims,
    parseRegisteredKeys,
    parseStatedCountRule,
    parseStatedVerdicts,
} from "#/tools/protocol-key-shape.ts";
import { readRecordedFights } from "#/tests/recorded-fights.ts";
import {
    composeSample,
    readAstNodes,
    readSourceFiles,
    SOURCE_DIRECTORIES,
    type SourceFile,
} from "#/tests/source-tree.ts";

/** Who a health figure is charged to, in the register's words: its `_Cause:_` vocabulary. */
const CAUSE = {
    subjectsOwn: "the subject's own",
    announcementsActor: "the announcement's actor",
    messageActor: "the message actor",
    woundsAttacker: "the wound's attacker",
    nobody: "nobody",
} as const;
type Cause = VocabularyWord<typeof CAUSE>;

interface LabelClaim {
    key: string;
    claim: string;
}

const REGISTER = Deno.readTextFileSync(REGISTER_PATH);
const COUNTS: Record<string, number> = FROZEN_HELP_PHRASES.counts;
/**
 * A tail that says **whom** an effect reaches rather than what it is. `-allies` occurs in the
 * article on every documented sibling, so a rule asking for it would make a true silence
 * unstateable: the engine name of `removedot-allies` is its head.
 */
const SCOPE_SUFFIXES = ["allies"];
const SEPARATORS = "_-";
const SIGNS = "+-";
/** What ends a paragraph: nothing, or the fence closing the section that states the vocabulary. */
const CLAIM_TERMINATORS = ["", "```"];
const CAUSE_MARKER = "_Cause:_";
const HEALTH_MARKER = "_Health:_";
const HEALTH_CLAIM = "moves health";
const EVIDENCE_MARKER = "_Evidence:_";
/** What an entry may say in place of evidence of its own, where a neighbour's covers it. */
const EVIDENCE_DELEGATIONS = ["Evidence as above", "the evidence is that entry's"];
const SECTION_MARKER = "### ";
const ABSENCE_CLAIM = "absence of ";
const CLIENT_LIST_CLAIM = " from the client's list";
/** The verdict for a key that never reaches the battle reader, so the client's switch lacks it. */
const NOT_A_BATTLE_KEY = "not a battle key";
/** A shouted constant is at least this long, so `ADR` and `N13` are not read as one. */
const SHOUTED_LENGTH_MINIMUM = 4;
const UNDERSCORE = "_";
/** The client's own rule for the family it reads by shape, as the frozen table lifted it. */
const FAMILY_RULE = FROZEN_PROTOCOL_KEYS.computedFamily;
/** The one owner of what a key means (`docs/design.md` §6.2), which spells every key it lists. */
const KEY_OWNER_PATH = "src/core/protocol-key.ts";

Deno.test("the reader knows a help claim from every other line", () => {
    const named = parseHelpClaim("_Help:_ names `verycrit`", 1);
    assertEquals(named?.phrases, ["verycrit"], "the reader flags its own sample");
    assertEquals(named?.isSilent, false, "and reads it as an occurrence");

    const silent = parseHelpClaim("*Help:* names nothing of `tenacity`, `ten`", 9);
    assertEquals(silent?.phrases, ["tenacity", "ten"], "both phrases of a silence are read");
    assertEquals(silent?.isSilent, true, "and the claim is read as one");

    assertEquals(parseHelpClaim("_Shape:_ 26 occurrences; on a blow", 1), null, "another line");
    assertEquals(parseHelpClaim("the help names `heal` somewhere", 1), null, "and prose");
    assertEquals(parseHelpClaim("_Help:_ says `heal`", 1), null, "and a claim of neither kind");
});

Deno.test("the frozen table counts exactly what the register cites, and nothing besides", () => {
    // `deno task game:help freeze` takes its list from the register, so the two sides are one walk
    // over one document. What this catches is the freeze that was not re-run: a claim added since
    // carries no count, and a count outlives the claim that earned it.
    const cited = parseCitedHelpPhrases(REGISTER);
    assert(cited.length > 0, "the register cites something");
    assertEquals(cited, Object.keys(COUNTS).sort(), "the table and the register name one set");
});

Deno.test("every phrase the register cites is one the frozen table counted", () => {
    const claims = parseHelpClaims(REGISTER);
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
    for (const claim of parseHelpClaims(REGISTER)) {
        for (const phrase of claim.phrases) {
            const count = COUNTS[phrase];
            if (count === undefined) continue;
            if (claim.isSilent === (count === 0)) continue;
            disagreeing.push(`${REGISTER_PATH}:${claim.line} "${phrase}" counted ${count}`);
        }
    }
    assert(Object.keys(COUNTS).length > 0, "there are counts to disagree with");
    assertEquals(disagreeing, [], "the article and the register say different things");
});

Deno.test("a claim of silence has tried the key's stem", () => {
    assertEquals(composeStemPhrases("acdmg_destroyed"), ["acdmg_destroyed", "destroyed"], "tail");
    assertEquals(composeStemPhrases("+superspell-dispel"), ["superspell-dispel", "dispel"], "sign");
    assertEquals(composeStemPhrases("removedot-allies"), ["removedot-allies", "removedot"], "head");
    assertEquals(composeStemPhrases("tenacity"), ["tenacity"], "a name with no separator");

    const untried: string[] = [];
    for (const claim of parseHelpClaims(REGISTER)) {
        if (!claim.isSilent) continue;
        for (const stem of composeStemPhrases(claim.phrases[0] ?? "")) {
            if (claim.phrases.includes(stem)) continue;
            untried.push(`${REGISTER_PATH}:${claim.line} never tried "${stem}"`);
        }
    }
    assertEquals(untried, [], "a silence that did not try the stem is a false negative");
});

/**
 * What a claim of silence has to have tried: the key without its sign, and the tail after its
 * first separator (the help publishes `legbon_facade` as `facade`). Where that tail is a scope
 * suffix the **head** is the engine name, so it is what has to have been searched.
 */
function composeStemPhrases(key: string): string[] {
    const bare = SIGNS.includes(key.charAt(0)) ? key.slice(1) : key;
    let at = -1;
    for (let index = 0; index < bare.length; index += 1) {
        if (!SEPARATORS.includes(bare.charAt(index))) continue;
        at = index;
        break;
    }
    if (at === -1) return [bare];
    const tail = bare.slice(at + 1);
    assert(tail.length > 0, "a separator with nothing after it is not a separator");
    if (SCOPE_SUFFIXES.includes(tail)) return [bare, bare.slice(0, at)];
    return [bare, tail];
}

Deno.test("no claim runs onto a second line, where this reader would see half of it", () => {
    const lines = REGISTER.split("\n");
    const continued: string[] = [];
    for (const claim of parseHelpClaims(REGISTER)) {
        const next = (lines[claim.line] ?? "").trim();
        if (CLAIM_TERMINATORS.includes(next)) continue;
        if (parseHelpClaim(next, claim.line + 1) !== null) continue;
        continued.push(`${REGISTER_PATH}:${claim.line} is followed by "${next}"`);
    }
    assert(lines.length > 0, "there is a document to read");
    assertEquals(continued, [], "a wrapped claim is a claim read by halves");
});

Deno.test("the register and the decoder agree on whose the healing is, both ways", () => {
    const sample = "### `heal` — decoded\n_Cause:_ the subject's own\n";
    assertEquals(
        parseLabelClaims(sample, CAUSE_MARKER),
        [{ key: "heal", claim: CAUSE.subjectsOwn }],
        "the reader",
    );
    assertEquals(parseLabelClaims("_Health:_ moves health\n", CAUSE_MARKER), [], "and not a cause");

    const claimed = parseLabelClaims(REGISTER, CAUSE_MARKER)
        .filter((one) => one.claim === CAUSE.subjectsOwn)
        .map((one) => one.key)
        .sort();
    assert(claimed.length > 0, "the register claims it of something");
    assertEquals(
        claimed,
        [...SELF_SOURCED_HEALING_KEYS].sort(),
        "a key charged to the healed here and read some other way there, or the reverse",
    );
});

/** The key each section is about, paired with what the labelled line states, in document order. */
function parseLabelClaims(text: string, marker: string): LabelClaim[] {
    assert(marker.length > 0, "a claim is read under a label");
    const found: LabelClaim[] = [];
    let key = "";
    for (const line of text.split("\n")) {
        if (line.startsWith(SECTION_MARKER)) {
            key = parseBacktickedPhrases(line)[0] ?? "";
            continue;
        }
        if (!line.startsWith(marker)) continue;
        // The preamble states an `_Evidence:_` line of its own, under a heading naming no key.
        if (key.length === 0) continue;
        found.push({ key, claim: line.slice(marker.length).trim() });
    }
    return found;
}

Deno.test("a key the register calls absent from the client is absent from the frozen table", () => {
    const said = "the absence of `+frost` from the client's list is";
    assertEquals(parseAbsentKeys(said), ["+frost"], "the reader finds the claim");
    assertEquals(parseAbsentKeys("the absence of `+frost` from the help"), [], "and not another");

    const absent = parseAbsentKeys(REGISTER);
    assert(absent.length > 0, "the register makes the claim of something");
    const known = new Set<string>(FROZEN_PROTOCOL_KEYS.keys);
    const present = absent.filter((key) => known.has(key));
    assertEquals(present, [], "the client's own table knows a key the register calls absent");
});

/** Every key the register states the client does not know, read out of the sentence saying so. */
function parseAbsentKeys(text: string): string[] {
    const found: string[] = [];
    let at = text.indexOf(ABSENCE_CLAIM);
    for (let looked = 0; at !== -1; looked += 1) {
        assert(looked <= PHRASES_MAXIMUM, "the walk stays inside its stated bound");
        const rest = text.slice(at + ABSENCE_CLAIM.length);
        at = text.indexOf(ABSENCE_CLAIM, at + 1);
        if (!rest.startsWith(BACKTICK)) continue;
        const closes = rest.indexOf(BACKTICK, BACKTICK.length);
        if (closes === -1) continue;
        const key = rest.slice(BACKTICK.length, closes);
        if (key.length === 0) continue;
        if (rest.slice(closes + BACKTICK.length).startsWith(CLIENT_LIST_CLAIM)) found.push(key);
    }
    return found;
}

Deno.test("every entry carries a verdict the register says it uses", () => {
    const stated = "**A verdict is one of `decoded`, `investigated` or `not a battle key`**, and";
    assertEquals(parseStatedVerdicts(stated), [
        "decoded",
        "investigated",
        "not a battle key",
    ], "the vocabulary is read off the sentence that states it");

    const legal = new Set(parseStatedVerdicts(REGISTER));
    assert(legal.size > 0, "the register names the verdicts an entry may carry");

    const read = parseRegisteredKeys("### `+crit` — decoded\n### `+swing` — investigated\n");
    assertEquals(read.map((one) => one.verdict), ["decoded", "investigated"], "the reader works");
    assertEquals(parseRegisteredKeys("Each entry carries a verdict.\n"), [], "and flags no prose");

    const entries = parseRegisteredKeys(REGISTER);
    assert(entries.length > 0, "the register opens entries to read");
    const wrong = entries
        .filter((one) => !legal.has(one.verdict))
        .map((one) => `${REGISTER_PATH}:${one.line} says "${one.verdict}"`);
    assertEquals(wrong, [], "a verdict outside the stated list is refused, not read as silence");
});

Deno.test("every entry names a key the client still composes", () => {
    const sample =
        "### `+crit` — decoded\n### `attack` — not a battle key\n### `-dmga` — decoded\n";
    assertEquals(
        parseRegisteredKeys(sample).filter(isEntryAnswerableByClient).map((one) => one.key),
        ["+crit"],
        "the reader asks after the entries the client's switch answers for",
    );

    const composed = new Set<string>(FROZEN_PROTOCOL_KEYS.keys);
    assert(composed.size > 0, "the frozen table names the keys the client composes");
    const gone = parseRegisteredKeys(REGISTER)
        .filter(isEntryAnswerableByClient)
        .filter((one) => !composed.has(one.key))
        .map((one) => `${REGISTER_PATH}:${one.line} states \`${one.key}\``);
    assertEquals(gone, [], "an entry documenting a key the client's own table no longer knows");
});

/**
 * An entry the client's switch has a case label for. A verdict saying the key is no battle key says
 * the switch never carries it, and the family the client reads by shape has no case label at all.
 */
function isEntryAnswerableByClient(entry: { key: string; verdict: string }): boolean {
    if (entry.verdict === NOT_A_BATTLE_KEY) return false;
    if (entry.key === DAMAGE_FAMILY_HEADING) return false;
    return getKeyReading(entry.key)?.kind !== KEY_FAMILY.damage;
}

Deno.test("the reader knows a count of occurrences from every other sentence", () => {
    const flagged = parseProseCountClaims(
        "### `-legbon_glare` — decoded\n\nIt has: one occurrence, on a blow, with no figure.\n",
    );
    assertEquals(flagged.map((one) => one.key), ["-legbon_glare"], "a count in prose is found");
    assertEquals(flagged.map((one) => one.recordings), [[]], "and it names no recording");

    const spelled = parseProseCountClaims("### `+absorb` — decoded\n\nBoth occurrences ride it.\n");
    assertEquals(spelled.length, 1, "a figure spelled as a word is a figure");

    const scoped = parseProseCountClaims(
        "### `-absorb` — decoded\n\n45 occurrences on `captures/one.json`, every one valued.\n",
    );
    assertEquals(scoped.map((one) => one.recordings), [["captures/one.json"]], "material carried");

    assertEquals(
        parseProseCountClaims("### `winner` — decoded\n\nEvery occurrence has that shape.\n"),
        [],
        "a claim about every occurrence states no figure, so it is not a count",
    );
    assertEquals(
        parseProseCountClaims("### `+crit` — decoded\n\n_Shape:_ 962 occurrences; on a blow; no\n"),
        [],
        "and the one line that owns a count is not one either",
    );
});

Deno.test("the rule this guard holds the register to is the register's own", () => {
    assertEquals(
        parseStatedCountRule("x **A count of occurrences in prose names them.** y"),
        "A count of occurrences in prose names them.",
        "the rule is read off the sentence that states it",
    );
    assertEquals(
        parseStatedCountRule("**A count of occurrences in prose\nnames them.**"),
        "A count of occurrences in prose names them.",
        "and over the sentence rather than the line, because the formatter wraps one",
    );
    assertThrows(
        () => parseStatedCountRule("The register states no such rule.\n"),
        Error,
        "no sentence states",
        "a rule deleted from the document turns the guard off loudly",
    );
    assert(parseStatedCountRule(REGISTER).length > 0, "and the register states it");
});

Deno.test("every count the prose writes names the recordings it was counted on", () => {
    const claims = parseProseCountClaims(REGISTER);
    assert(claims.length > 0, "the register writes counts in prose for this to read");
    const unnamed = claims
        .filter((one) => one.recordings.length === 0)
        .map((one) => `${REGISTER_PATH}:${one.line} "${one.sentence}"`);
    assertEquals(unnamed, [], "a count over the corpus goes stale and reads as one that did not");
});

Deno.test("every recording a count rests on is one the material still holds", () => {
    const held = new Set(readRecordedFights().map((fight) => fight.path));
    assert(held.size > 0, "the material holds recordings for a count to name");
    const gone = parseProseCountClaims(REGISTER).flatMap((one) =>
        one.recordings
            .filter((path) => !held.has(path))
            .map((path) => `${REGISTER_PATH}:${one.line} counts over ${path}`)
    );
    assertEquals(gone, [], "a count resting on a recording `captures/` no longer carries");
});

Deno.test("the register and the decoder agree on which keys move health, both ways", () => {
    assertEquals(
        parseLabelClaims("### `heal` — decoded\n_Health:_ moves health\n", HEALTH_MARKER),
        [{ key: "heal", claim: HEALTH_CLAIM }],
        "the reader",
    );
    assertEquals(
        parseLabelClaims("_Cause:_ the message actor\n", HEALTH_MARKER),
        [],
        "a line that is not a health verdict",
    );
    assert(lookupDecodedCause("-dmg") !== null, "the applied half of a blow moves health");
    assert(lookupDecodedCause("+dmg") === null, "and the raw half is what it was before reduction");
    assert(lookupDecodedCause("+crit") === null, "a proc carries no figure at all");

    const said = new Set(
        parseLabelClaims(REGISTER, HEALTH_MARKER)
            .filter((one) => one.claim === HEALTH_CLAIM)
            .map((one) => one.key),
    );
    assert(said.size > 0, "the register states the verdict of something");
    const wrong = parseRegisteredKeys(REGISTER)
        .filter((one) => (lookupDecodedCause(one.key) !== null) !== said.has(one.key))
        .map((one) => `${REGISTER_PATH}:${one.line} \`${one.key}\``);
    assertEquals(wrong, [], "the line and the decoder disagree about whether a key moves health");
});

/**
 * Who the decoder charges a key's figure to, or `null` where it moves no health and so charges
 * nobody. One function for both lines, because the register requires the cause exactly where the
 * health verdict is and a second reader could disagree with the first. The three the help settles
 * come first: `legbon_lastheal` is read by name inside its value, not as a change of health.
 */
function lookupDecodedCause(key: string): Cause | null {
    assert(key.length > 0, "a key is asked about by name");
    if (key === DAMAGE_FAMILY_HEADING) return CAUSE.messageActor;
    if (SELF_SOURCED_HEALING_KEYS.includes(key)) return CAUSE.subjectsOwn;
    if (key === WOUND_TICK_KEY) return CAUSE.woundsAttacker;
    const reading = getKeyReading(key);
    if (reading === null) return null;
    switch (reading.kind) {
        case KEY_FAMILY.damage:
            return reading.half === DAMAGE_HALF.applied ? CAUSE.messageActor : null;
        case KEY_FAMILY.namedDamage:
        case KEY_FAMILY.unaccountedHealth:
            return CAUSE.messageActor;
        case KEY_FAMILY.healthChange:
            if (reading.isOnTarget) return CAUSE.announcementsActor;
            return reading.sign > 0 ? CAUSE.messageActor : CAUSE.nobody;
        default:
            return null;
    }
}

Deno.test("the register and the decoder agree on who each figure is charged to, both ways", () => {
    assertEquals(lookupDecodedCause("-dmg"), CAUSE.messageActor, "the applied half is the actor's");
    assertEquals(lookupDecodedCause("+dmg"), null, "the raw half charges nobody with anything");
    assertEquals(lookupDecodedCause("heal_target"), CAUSE.announcementsActor, "the target slot");
    assertEquals(lookupDecodedCause("poison"), CAUSE.nobody, "a tick nothing names is nobody's");

    const said = new Map(
        parseLabelClaims(REGISTER, CAUSE_MARKER).map((one) => [one.key, one.claim]),
    );
    assert(said.size > 0, "the register charges something to somebody");
    const wrong = parseRegisteredKeys(REGISTER)
        .filter((one) => lookupDecodedCause(one.key) !== (said.get(one.key) ?? null))
        .map((one) =>
            `${REGISTER_PATH}:${one.line} \`${one.key}\` says ${
                said.get(one.key) ?? "nothing"
            }, the decoder reads ${lookupDecodedCause(one.key) ?? "no figure at all"}`
        );
    assertEquals(wrong, [], "a figure charged one way here and read another way there");
});

Deno.test("every entry states its evidence or says whose it takes", () => {
    const carried = new Set(parseLabelClaims(REGISTER, EVIDENCE_MARKER).map((one) => one.key));
    assert(carried.size > 0, "the register carries evidence lines to find");
    const delegating = new Set<string>();
    let key = "";
    for (const line of REGISTER.split("\n")) {
        if (line.startsWith(SECTION_MARKER)) {
            key = parseBacktickedPhrases(line)[0] ?? "";
            continue;
        }
        if (EVIDENCE_DELEGATIONS.some((one) => line.includes(one))) delegating.add(key);
    }
    assert(delegating.size > 0, "and entries that take a neighbour's");
    const bare = parseRegisteredKeys(REGISTER)
        .filter((one) => !carried.has(one.key))
        .filter((one) => !delegating.has(one.key))
        .map((one) => `${REGISTER_PATH}:${one.line} \`${one.key}\``);
    assertEquals(bare, [], "an entry whose verdict rests on nothing a reader can follow");
});

Deno.test("no key opens an entry twice", () => {
    const twice = parseRegisteredKeys("### `+crit` — decoded\n### `+crit` — investigated\n");
    assertEquals(twice.length, 2, "the reader takes both headings rather than collapsing them");
    const seen = new Map<string, number>();
    const repeated: string[] = [];
    for (const entry of parseRegisteredKeys(REGISTER)) {
        const before = seen.get(entry.key);
        if (before === undefined) {
            seen.set(entry.key, entry.line);
            continue;
        }
        repeated.push(`${REGISTER_PATH}:${entry.line} \`${entry.key}\`, already open at ${before}`);
    }
    assertEquals(repeated, [], "one key, two entries, and a reader takes the one it met last");
});

/**
 * The register states what the tree reads **now** (**C3**), so a constant it names is one a reader
 * can open. A decision record is the opposite case and is not read: naming what it renamed away
 * from is its whole point.
 */
Deno.test("every constant the register names is one the tree still declares", () => {
    assert(isShoutedName("SELF_SOURCED_HEALING_KEYS"), "a shouted constant is one");
    assert(!isShoutedName("ADR"), "and three letters are not");
    assert(!isShoutedName("Obrażenia"), "nor a word the game shouts at nobody");
    assert(!isShoutedName("_Shape:_"), "nor a label the register writes");
    const sample = composeSample(["// A `GONE_KEYS` table.", 'const KEPT_KEYS = ["GONE_KEYS"];']);
    assertEquals(readDeclaredNames(sample), ["KEPT_KEYS"], "a declaration, not a comment or text");

    // Line by line, which is what that reader is bounded for: over a whole document it stops at
    // its own phrase bound, and a code fence hands it a phrase with nothing in it.
    const named = new Set<string>();
    for (const line of REGISTER.split("\n")) {
        for (const phrase of parseBacktickedPhrases(line)) {
            if (isShoutedName(phrase)) named.add(phrase);
        }
    }
    assert(named.size > 0, "the register names constants to look for");
    const declared = new Set(readSourceFiles(SOURCE_DIRECTORIES).flatMap(readDeclaredNames));
    assert(declared.size > 0, "and there is TypeScript for them to be declared in");
    const gone = [...named].filter((one) => !declared.has(one)).sort();
    assertEquals(gone, [], "the register names a constant no file in the tree declares");
});

/**
 * The names a file declares a value under. Declared rather than spelled: a comment naming a
 * constant renamed away from is text that still spells it, and would pass for one.
 */
function readDeclaredNames(file: SourceFile): string[] {
    const names: string[] = [];
    for (const node of readAstNodes(file, ["VariableDeclarator"])) {
        const name = node.id?.name;
        if (name !== undefined) names.push(name);
    }
    return names;
}

/** Whether every character is one a shouted module constant is spelled with (**N1**). */
function isShoutedName(phrase: string): boolean {
    if (phrase.length < SHOUTED_LENGTH_MINIMUM) return false;
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
 * A key read by name is a key whose meaning lives in a table, which is exactly how a wrong reading
 * survives; the register is where a claim about a key is cited (**V1**), so the table and the
 * register agree or one of them is out of date.
 */
Deno.test("every key src/core/protocol-key.ts reads by name is a key the register writes up", () => {
    const sample = composeSample(['const KEYS = ["+crit", "-dmgc", "damage", "dmg", ""];']);
    assertEquals(readKeysReadByName(sample), ["+crit"], "a key, and not a family or a word");

    const [owner] = readSourceFiles(["src/core"]).filter((file) => file.path === KEY_OWNER_PATH);
    assert(owner !== undefined, `${KEY_OWNER_PATH} is where the keys are read`);
    const keys = readKeysReadByName(owner);
    assert(keys.length > 100, `the owner was read: ${keys.length} keys`);
    const written = new Set(parseRegisteredKeys(REGISTER).map((one) => one.key));
    const missing = keys
        .filter((key) => !written.has(key))
        .map((key) => `${key}, read as ${getKeyReading(key)?.kind}`);
    assertEquals(missing, [], "a key read by name is a key the register carries");
});

/**
 * Every string a file spells that `getKeyReading` answers by name. A key the client's family rule
 * reaches is answered by its shape, and is the family entry's rather than one of its own.
 */
function readKeysReadByName(file: SourceFile): string[] {
    const keys = new Set<string>();
    for (const node of readAstNodes(file, ["Literal"])) {
        if (typeof node.value !== "string") continue;
        if (node.value.length === 0) continue;
        if (getKeyReading(node.value) === null) continue;
        const marker = node.value.slice(
            FAMILY_RULE.markerAt,
            FAMILY_RULE.markerAt + FAMILY_RULE.markerLength,
        );
        if (marker === FAMILY_RULE.marker) continue;
        keys.add(node.value);
    }
    return [...keys].sort();
}
