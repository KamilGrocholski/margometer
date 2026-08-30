/**
 * The words a card puts on what a blow carried, against the material it has to word.
 *
 * A table of names is the one thing here that goes stale silently: a key the game adds reaches a
 * reader as a bare token and nothing fails, so the recordings are what hold it. Each reader is
 * proved on a sample it must flag and one it must not — a table that has stopped finding its
 * subject and one that finds too much fail differently, and only the pair catches both.
 */

import { assert, assertEquals } from "@std/assert";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFightMessages, PROC_ENDS } from "@/src/core/fight-decoder.ts";
import {
    CLIENT_IDS_FOR_UNWORDED_KEYS,
    composeDestroyedText,
    DEFENCE_WORDS,
    DESTROYED_WORDS,
    getWordsForBlowKey,
    getWordsForDestroyed,
    MAXIMUM_LABEL_CHARACTERS,
    PROC_WORDS,
} from "@/src/ui/panel-words.ts";
import { FROZEN_PROTOCOL_KEYS } from "@/frozen/protocol-keys.ts";
import {
    getRecordedCombatants,
    getRecordedPayloads,
    getRecordingPaths,
} from "@/tests/recorded-fight.ts";

interface BlowKeys {
    procs: Set<string>;
    defences: Set<string>;
    destroyed: Set<string>;
}

/** Every key the recordings actually carried, read through the decoder rather than off the text. */
function getBlowKeysFromRecordings(): BlowKeys {
    const found: BlowKeys = { procs: new Set(), defences: new Set(), destroyed: new Set() };
    for (const path of getRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        for (const event of decodeFightMessages(getRecordedPayloads(path).flat(), roster)) {
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
        if (DEFENCE_WORDS[key] === undefined) unworded.push(`defence ${key}`);
    }
    for (const key of CARRIED.destroyed) {
        if (DESTROYED_WORDS[key] === undefined) unworded.push(`destroyed ${key}`);
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
    const asked = Object.keys(CLIENT_IDS_FOR_UNWORDED_KEYS);
    const worded = asked.filter((key) => PROC_WORDS[key] !== undefined);
    assertEquals(worded, [], "a key the panel already words is never asked about");
    const known: readonly string[] = FROZEN_PROTOCOL_KEYS.keys;
    const unknown = asked.filter((key) => !known.includes(key));
    assertEquals(unknown, [], "and every key asked about is one the client itself branches on");
    const unasked: string[] = [];
    for (const key of CARRIED.procs) {
        if (PROC_WORDS[key] !== undefined) continue;
        if (CLIENT_IDS_FOR_UNWORDED_KEYS[key] !== undefined) continue;
        unasked.push(key);
    }
    assertEquals(unasked, [], "a proc the material carries is worded by us or asked of the client");
    assertEquals(
        asked.length,
        6,
        "the four legendary bonuses, and the pair view,372 does not name",
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
 * The column is ours and the answer is not. A label past it is not merely cut: `getTipSize` counts
 * a stat line as one, so the card would stand at a height it was not measured for.
 */
Deno.test("a label longer than the column is refused, and one that fits is taken", () => {
    const fitting = "x".repeat(MAXIMUM_LABEL_CHARACTERS);
    const overlong = "x".repeat(MAXIMUM_LABEL_CHARACTERS + 1);
    assertEquals(getWordsForBlowKey("-tenacity", () => fitting), fitting, "a label at the bound");
    assertEquals(
        getWordsForBlowKey("-tenacity", () => overlong),
        "-tenacity",
        "and one past it falls back on the key rather than standing the card wrong",
    );
});

Deno.test("every proc the decoder places is placed at an end the register settled", () => {
    const unplaced: string[] = [];
    for (const key of CARRIED.procs) {
        if (PROC_ENDS[key] === undefined) unplaced.push(key);
    }
    assertEquals(unplaced, [], "a proc the material carries is one this table places");
    // The two the register refuses an end: they are decoded, and charged to nobody on purpose.
    assertEquals(PROC_ENDS["-tenacity"], "unsettled", "whose it is has not been established");
    assertEquals(PROC_ENDS["+superspell-dispel"], "unsettled", "and neither has whose this is");
    assertEquals(PROC_ENDS["+crit"], "actor", "a crit is the doing of whoever swung");
    assertEquals(PROC_ENDS["-evade"], "target", "and an evade of whoever was swung at");
});

Deno.test("no label a card draws is longer than the column it is drawn in", () => {
    const overlong: string[] = [];
    for (const [key, words] of Object.entries(PROC_WORDS)) {
        if (words.length > MAXIMUM_LABEL_CHARACTERS) overlong.push(`${key} "${words}"`);
    }
    for (const [key, words] of Object.entries(DEFENCE_WORDS)) {
        if (words.length > MAXIMUM_LABEL_CHARACTERS) overlong.push(`${key} "${words}"`);
    }
    for (const [key, held] of Object.entries(DESTROYED_WORDS)) {
        if (held.name.length > MAXIMUM_LABEL_CHARACTERS) overlong.push(`${key} "${held.name}"`);
    }
    assertEquals(overlong, [], "a label this long is cut by the sheet rather than read");
    // The sample that must flag, so the reader is known to be looking: the bound is real and a
    // word one character over it is over it.
    assert(
        "wchłonięcie magiczne!!!".length > MAXIMUM_LABEL_CHARACTERS,
        "and the measure is the characters, not the entry",
    );
});
