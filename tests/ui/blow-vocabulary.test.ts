/**
 * The words a card puts on what a blow carried, against the material it has to word.
 *
 * A table of names is the one thing here that goes stale silently: a key the game adds reaches a
 * reader as a bare token and nothing fails, so the recordings are what hold it. Each reader is
 * proved on a sample it must flag and one it must not — a table that has stopped finding its
 * subject and one that finds too much fail differently, and only the pair catches both.
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { getLabelFromEntry } from "@/src/game/game-dictionary.ts";
import { BLOW_END_BY_PROC_KEY, decodeFightMessages } from "@/src/core/fight-decoder.ts";
import {
    CARD_WORDS,
    CLIENT_ID_BY_UNWORDED_KEY,
    composeDestroyedText,
    DEFENCE_WORD_BY_KEY,
    DESTROYED_WORD_BY_KEY,
    getSubWordsForBlowKey,
    getWordsForBlowKey,
    getWordsForDestroyed,
    MAXIMUM_CLIENT_LABEL_CHARACTERS,
    MAXIMUM_LABEL_CHARACTERS,
    PROC_SUB_WORD_BY_KEY,
    PROC_WORD_BY_KEY,
} from "@/src/ui/panel-words.ts";
import { FROZEN_PROTOCOL_KEYS } from "@/frozen/protocol-keys.ts";
import {
    BLOWS_GRANTED,
    getRecordedCombatants,
    getRecordedPayloads,
    readRecordingPaths,
} from "@/tests/recorded-fight.ts";

interface BlowKeys {
    procs: Set<string>;
    defences: Set<string>;
    destroyed: Set<string>;
}

/** Every key the recordings actually carried, read through the decoder rather than off the text. */
function getBlowKeysFromRecordings(): BlowKeys {
    const found: BlowKeys = { procs: new Set(), defences: new Set(), destroyed: new Set() };
    for (const path of readRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        for (
            const event of decodeFightMessages(
                getRecordedPayloads(path).flat(),
                roster,
                BLOWS_GRANTED,
            )
        ) {
            if (event.kind !== "attack") continue;
            for (const key of event.procs) found.procs.add(key);
            for (const stopped of event.prevented) found.defences.add(stopped.defence);
            for (const destroyed of event.destroyed) found.destroyed.add(destroyed.statistic);
        }
    }
    assert(found.procs.size > 0, "an empty reading of the material is a finding, not a pass");
    return found;
}

const CARRIED = getBlowKeysFromRecordings();

Deno.test("every defence and every statistic a recording states is one the panel words", () => {
    const unworded: string[] = [];
    for (const key of CARRIED.defences) {
        if (DEFENCE_WORD_BY_KEY[key] === undefined) unworded.push(`defence ${key}`);
    }
    for (const key of CARRIED.destroyed) {
        if (DESTROYED_WORD_BY_KEY[key] === undefined) unworded.push(`destroyed ${key}`);
    }
    assertEquals(unworded, [], "a key the material carries reaches a reader as a bare token");
    // The sample that must not flag: a key the client branches on and no recording has stated.
    // Wording one would be a claim about a mechanic nobody here has seen fire.
    assert(!CARRIED.defences.has("parry"), "a key absent from the material is not asked for");
});

Deno.test("a key no table holds travels as the game wrote it, and none is invented", () => {
    assertEquals(getWordsForBlowKey("+crit"), "krytyk", "a proc the table holds is worded");
    assertEquals(getWordsForBlowKey("blok"), "blok", "and so is a defence");
    assertEquals(
        getWordsForBlowKey("-tenacity"),
        "-tenacity",
        "a key nothing has named reaches the reader as the game wrote it, sign and all",
    );
    assertEquals(getWordsForDestroyed("acdmg"), "pancerz", "a statistic the table holds is worded");
    assertEquals(
        getWordsForDestroyed("newstat"),
        "newstat",
        "and one it does not is passed through",
    );
});

Deno.test("what was destroyed carries the unit it was counted in, and never the wrong one", () => {
    assertEquals(composeDestroyedText("acdmg", 940), "940 pkt", "armour is counted in points");
    assertEquals(
        composeDestroyedText("resdmg", 26),
        "26 p.p.",
        "and resistance in percentage points, which is why the two are never totalled",
    );
    // The sample that must not flag: a statistic no table holds states its figure and no unit,
    // because inventing one would be inventing what the number counts.
    assertEquals(
        composeDestroyedText("newstat", 5),
        "5",
        "a statistic nobody has placed states none",
    );
});

/**
 * The six keys nothing here words, and the client that does. Both directions, because the two
 * failures are different: a key dropping out of the table reaches a reader as raw protocol, and a
 * key joining it that we already word would put somebody else's sentence over our own. **ADR
 * 0024.**
 */
Deno.test("the panel asks the client for a key it has no word for, and for no other", () => {
    const asked = Object.keys(CLIENT_ID_BY_UNWORDED_KEY);
    const worded = asked.filter((key) => PROC_WORD_BY_KEY[key] !== undefined);
    assertEquals(worded, [], "a key the panel already words is never asked about");
    const known: readonly string[] = FROZEN_PROTOCOL_KEYS.keys;
    const unknown = asked.filter((key) => !known.includes(key));
    assertEquals(unknown, [], "and every key asked about is one the client itself branches on");
    const unasked: string[] = [];
    for (const key of CARRIED.procs) {
        if (PROC_WORD_BY_KEY[key] !== undefined) continue;
        if (CLIENT_ID_BY_UNWORDED_KEY[key] !== undefined) continue;
        unasked.push(key);
    }
    assertEquals(unasked, [], "a proc the material carries is worded by us or asked of the client");
    assertEquals(
        asked.length,
        7,
        "the four legendary bonuses, and the three view,372 does not name",
    );
});

/** A page with no game on it is what every test and every browser without the client sees. */
Deno.test("a key with no word travels as the game wrote it where nobody can be asked", () => {
    assertEquals(getWordsForBlowKey("-tenacity", null), "-tenacity", "with no reader at all");
    assertEquals(
        getWordsForBlowKey("-tenacity", () => null),
        "-tenacity",
        "and with a reader the client has no name for it in",
    );
});

/**
 * The table is the mechanism, not the order of two lookups: a key we word never reaches the client
 * at all. Asking and preferring our answer would look the same from outside and would put an id on
 * the client's report queue for every key the panel draws (`src/game/game-dictionary.ts`).
 */
Deno.test("a key the panel words is never asked about, reader present or not", () => {
    const asked: string[] = [];
    const spy = (id: string) => {
        asked.push(id);
        return "somebody else's word";
    };
    assertEquals(getWordsForBlowKey("+crit", spy), "krytyk", "a proc we word is worded by us");
    assertEquals(getWordsForBlowKey("blok", spy), "blok", "and so is a defence");
    assertEquals(asked, [], "and neither was put to the client");
    assertEquals(getWordsForBlowKey("-tenacity", spy), "somebody else's word", "one we do not");
    assertEquals(asked, ["msg_-tenacity"], "reaches it, under the id the table names");
});

/**
 * The negative space, and the reason the ids are a table rather than `msg_` and the key: an id the
 * client does not know is queued with a timer armed to report it (`src/game/game-dictionary.ts`).
 * A key the game adds tomorrow is worded by nobody here and is in no table, so it must reach the
 * reader as raw protocol without anything being put to the client at all.
 */
Deno.test("a key nothing here has placed is not put to the client either", () => {
    const asked: string[] = [];
    const spy = (id: string) => {
        asked.push(id);
        return "a name";
    };
    assertEquals(getWordsForBlowKey("+newkey", spy), "+newkey", "it travels as the game wrote it");
    assertEquals(asked, [], "and no id of it was ever asked for");
});

/**
 * ⚠️ **The client's bound, and not ours.** What a label out of somebody else's dictionary may run
 * to is a different question from what we may write, and holding the two to one number drew the
 * raw key at a reader whose own client had the words. The bound below is still a bound: past it
 * the answer is external data that has gone wrong, and the key is the honest fallback.
 */
Deno.test("a client label longer than the bound is refused, and one that fits is taken", () => {
    const fitting = "x".repeat(MAXIMUM_CLIENT_LABEL_CHARACTERS);
    const overlong = "x".repeat(MAXIMUM_CLIENT_LABEL_CHARACTERS + 1);
    assertEquals(getWordsForBlowKey("-tenacity", () => fitting), fitting, "a label at the bound");
    assertEquals(
        getWordsForBlowKey("-tenacity", () => overlong),
        "-tenacity",
        "and one past it falls back on the key rather than taking anything a dictionary says",
    );
});

/**
 * ⚠️ **Through the reader, and not off the dictionary.** `getLabelFromEntry` takes the leading
 * sign and the trailing full stop off an entry before anybody measures it, so a test handed the
 * raw entry measures a string no bound ever sees — which is how `-Płomienne oczyszczenie` was
 * counted as refused when at 22 characters it always fitted.
 *
 * The entries are the player's own, read off build `1785244275300` on 2026-09-22. A bound that
 * went back under 41 would take the longest of them away without a test failing anywhere else.
 */
Deno.test("the entries the client actually carries reach a reader as words", () => {
    const carried = [
        "+Klątwa",
        "+Cios bardzo krytyczny",
        "-Płomienne oczyszczenie",
        "-Oślepienie w następnej turze",
        "-Wytrwałość",
        "Przerwanie ciosu specjalnego.",
        "Zapobiegnięto ładowaniu ciosu specjalnego.",
    ];
    const refused: string[] = [];
    for (const entry of carried) {
        const label = getLabelFromEntry(entry);
        assertExists(label, `the client's entry ${entry} reads as a label at all`);
        if (getWordsForBlowKey("-tenacity", () => label) === label) continue;
        refused.push(entry);
    }
    assertEquals(refused, [], "every one of them reaches a reader as their own client spells it");
    // The sample that must flag, so the reader is known to be looking.
    assertEquals(
        getWordsForBlowKey("-tenacity", () => "x".repeat(MAXIMUM_CLIENT_LABEL_CHARACTERS + 1)),
        "-tenacity",
        "and the bound is real",
    );
});

Deno.test("every proc the decoder places is placed at an end the register settled", () => {
    const unplaced: string[] = [];
    for (const key of CARRIED.procs) {
        if (BLOW_END_BY_PROC_KEY[key] === undefined) unplaced.push(key);
    }
    assertEquals(unplaced, [], "a proc the material carries is one this table places");
    // The two the register refuses an end: they are decoded, and charged to nobody on purpose.
    assertEquals(
        BLOW_END_BY_PROC_KEY["-tenacity"],
        "unsettled",
        "whose it is has not been established",
    );
    assertEquals(
        BLOW_END_BY_PROC_KEY["+superspell-dispel"],
        "unsettled",
        "and neither has whose this is",
    );
    assertEquals(
        BLOW_END_BY_PROC_KEY["+superspell-prevented"],
        "unsettled",
        "nor whose charge the blow kept from being made ready",
    );
    assertEquals(BLOW_END_BY_PROC_KEY["+crit"], "actor", "a crit is the doing of whoever swung");
    assertEquals(BLOW_END_BY_PROC_KEY["-evade"], "target", "and an evade of whoever was swung at");
});

/**
 * Which of `CARD_WORDS` is drawn in the column the sheet cuts, and which is a sentence that wraps.
 * Held both ways below, so an entry added to the table lands in one list or the other rather than
 * in neither — which is how the one label over the bound went four releases unnoticed.
 *
 * ⚠️ **A caveated label is not held tighter here.** The glyph beside it is a cell of its own, so
 * what it costs is pixels rather than characters, and this count cannot see it. `panel-tip.spec.ts`
 * holds that, in the browser, over every label a card draws. **ADR 0088.**
 */
const CARD_LABEL_KEYS = [
    "raw",
    "blows",
    "blowsWithoutSkill",
    "skillUses",
    "turns",
    "turnsLost",
    "prevented",
    "blowsCritical",
    "blowsCriticalOffhand",
] as const satisfies readonly (keyof typeof CARD_WORDS)[];

/** The rest of the table: headings the sheet also cuts, and sentences that wrap instead. */
const CARD_OTHER_KEYS = [
    "wholeFight",
    "striking",
    "struck",
    "destroyed",
    "scope",
    "gesture",
    "gestureBack",
    "gestureBackAnywhere",
    "cut",
] as const satisfies readonly (keyof typeof CARD_WORDS)[];

Deno.test("no label a card draws is longer than the column it is drawn in", () => {
    const overlong: string[] = [];
    for (const [key, words] of Object.entries(PROC_WORD_BY_KEY)) {
        if (words.length > MAXIMUM_LABEL_CHARACTERS) overlong.push(`${key} "${words}"`);
    }
    for (const [key, words] of Object.entries(PROC_SUB_WORD_BY_KEY)) {
        if (words.length > MAXIMUM_LABEL_CHARACTERS) overlong.push(`${key} "${words}"`);
    }
    for (const [key, words] of Object.entries(DEFENCE_WORD_BY_KEY)) {
        if (words.length > MAXIMUM_LABEL_CHARACTERS) overlong.push(`${key} "${words}"`);
    }
    for (const [key, held] of Object.entries(DESTROYED_WORD_BY_KEY)) {
        if (held.name.length > MAXIMUM_LABEL_CHARACTERS) overlong.push(`${key} "${held.name}"`);
    }
    // ⚠️ **The table the name of this test always covered and the walk never reached.** Until
    // 2026-09-14 `CARD_WORDS.blowLargestTaken` stood at 24 characters against a bound of 22, cut
    // by the sheet on every card that drew it, while the docblock over `MAXIMUM_LABEL_CHARACTERS`
    // said every word in the module was inside it. Only the entries drawn in the cut column are
    // held: a sentence is a note and wraps to the width of the window instead.
    for (const key of CARD_LABEL_KEYS) {
        const words = CARD_WORDS[key];
        if (words.length > MAXIMUM_LABEL_CHARACTERS) overlong.push(`${key} "${words}"`);
    }
    assertEquals(overlong, [], "a label this long is cut by the sheet rather than read");
    // Both ways: an entry in neither list is an entry nothing above holds.
    assertEquals(
        Object.keys(CARD_WORDS).filter((key) =>
            !CARD_LABEL_KEYS.some((one) => one === key) &&
            !CARD_OTHER_KEYS.some((one) => one === key)
        ),
        [],
        "every word the card table holds is either a label in the cut column or a sentence",
    );
    // The sample that must flag, so the reader is known to be looking: the bound is real and a
    // word one character over it is over it.
    assert(
        "absorpcja magiczna!!!!!".length > MAXIMUM_LABEL_CHARACTERS,
        "and the measure is the characters, not the entry",
    );
});

/**
 * A sub-line narrows the row above it, so the key drawing one has to be a key that reaches a row
 * at all (**ADR 0095**). Read both ways: a table that has stopped naming its keys and one that
 * names a key no row draws fail differently, and only the pair catches both.
 */
Deno.test("a key naming a sub-line is a key a row already counts", () => {
    const unplaced: string[] = [];
    for (const key of Object.keys(PROC_SUB_WORD_BY_KEY)) {
        if (PROC_WORD_BY_KEY[key] === undefined) unplaced.push(`${key} words no row`);
        if (BLOW_END_BY_PROC_KEY[key] === undefined) unplaced.push(`${key} reaches no end`);
    }
    assertEquals(unplaced, [], "a sub-line under a row nothing draws is a line nobody reads");
    // The other way: the five that narrow the wound's row, and the row they all fold into.
    const narrowed = Object.keys(PROC_SUB_WORD_BY_KEY);
    assertEquals(
        narrowed.map((key) => PROC_WORD_BY_KEY[key]),
        narrowed.map(() => getWordsForBlowKey("+wound")),
        "every key narrowing a row lands on the row `+wound` opened",
    );
    // The sample that must not flag: the bare announcement and the crit stand alone.
    assertEquals(getSubWordsForBlowKey("+wound"), "", "nothing weakened a bare wound");
    assertEquals(getSubWordsForBlowKey("+crit"), "", "and a crit narrows no row of this kind");
    // And the one that must: a weakened wound says so under the row it was counted in.
    assertEquals(getSubWordsForBlowKey("+woundpoison"), "osłabiona", "a weakened one does");
});
