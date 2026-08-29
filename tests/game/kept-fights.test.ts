/**
 * The shelf, over a store that answers, refuses, or holds something nobody wrote.
 *
 * What goes on the shelf is what the game said, so a fight read back off it decodes through the
 * same path a live one does — which the last test here holds it to.
 */

import { assert, assertEquals } from "@std/assert";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { composeJsonText } from "@/src/core/unknown-reading.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import type { BrowserStore } from "@/src/game/browser-store.ts";
import { type KeptFight, readKeptFights, writeKeptFights } from "@/src/game/kept-fights.ts";
import {
    getRecordedCombatants,
    getRecordedPayloads,
    getRecordingPaths,
} from "@/tests/recorded-fight.ts";

const KEY = "MargoMeter-fights";

function composeStore(refuses = false): BrowserStore {
    const held = new Map<string, string>();
    return {
        read: (key) => held.get(key) ?? null,
        write: (key, value) => {
            if (refuses) return false;
            held.set(key, value);
            return true;
        },
    };
}

function composeFight(openedAt: number): KeptFight {
    return {
        openedAt,
        combatants: [{
            id: 1,
            name: "Gracz 1",
            side: 1,
            profession: "w",
            level: 40,
            healthMaximum: 745,
        }],
        payloads: [["1=100.00;0;heal=99"]],
        place: { mapName: "Mapa", x: 12, y: 34 },
    };
}

Deno.test("what is written comes back as it went on", () => {
    const store = composeStore();
    assert(writeKeptFights(store, KEY, [composeFight(7)]), "the store took it");
    assertEquals(readKeptFights(store, KEY), [composeFight(7)], "and gives it back whole");
});

Deno.test("a store that will not have it says so, rather than throwing", () => {
    const refusing = composeStore(true);
    assertEquals(
        writeKeptFights(refusing, KEY, [composeFight(1)]),
        false,
        "a refusal is an answer",
    );
    assertEquals(readKeptFights(refusing, KEY), [], "and the shelf reads back empty");
});

Deno.test("a shelf nobody can read is dropped, never trusted into a figure", () => {
    const broken: BrowserStore = { read: () => "{ this is not json", write: () => true };
    assertEquals(readKeptFights(broken, KEY), [], "text that will not parse holds nothing");
    // The fight inside it reads back perfectly: it is the version that refuses it, and a sample
    // holding an empty shelf could not tell the two apart.
    const older: BrowserStore = {
        read: () => '{"version":0,"fights":[{"openedAt":1,"combatants":[],"payloads":[]}]}',
        write: () => true,
    };
    assertEquals(readKeptFights(older, KEY), [], "and neither does a shelf of another version");
    const wrong: BrowserStore = {
        read: () => '{"version":1,"fights":[{"openedAt":"soon","combatants":[],"payloads":[]}]}',
        write: () => true,
    };
    assertEquals(readKeptFights(wrong, KEY), [], "a fight stating a moment nobody wrote is gone");
});

Deno.test("one fight nobody can read costs that fight and not the shelf", () => {
    const half: BrowserStore = {
        read: () =>
            '{"version":1,"fights":[{"openedAt":1,"combatants":[],"payloads":[["0;0;txt=a"]]},' +
            '{"openedAt":2,"combatants":[],"payloads":"none"}]}',
        write: () => true,
    };
    const kept = readKeptFights(half, KEY);
    assertEquals(kept.length, 1, "the one that reads back is kept");
    assertEquals(kept[0]?.openedAt, 1, "and it is the one that was whole");
});

Deno.test("the shelf holds its stated maximum, oldest dropped first", () => {
    const store = composeStore();
    const many: KeptFight[] = [];
    for (let one = 0; one < 25; one += 1) many.push(composeFight(one));
    assert(writeKeptFights(store, KEY, many), "the store took what it was handed");
    const kept = readKeptFights(store, KEY);
    assertEquals(kept.length, 20, "twenty of them, which is the bound");
    assertEquals(kept[0]?.openedAt, 5, "and the oldest five went, not the newest");
});

Deno.test("a fight off the shelf decodes as the fight that went on it", () => {
    const [path] = getRecordingPaths();
    assert(path !== undefined, "a recording to keep");
    const store = composeStore();
    const combatants = getRecordedCombatants(path);
    const payloads = getRecordedPayloads(path);
    assert(
        writeKeptFights(store, KEY, [{ openedAt: 1, combatants, payloads, place: null }]),
        "kept",
    );
    const kept = readKeptFights(store, KEY)[0];
    assert(kept !== undefined, "and read back");
    const roster = composeCombatantRoster(kept.combatants);
    let events = 0;
    for (const payload of kept.payloads) events += decodeFightMessages(payload, roster).length;
    let live = 0;
    for (const payload of payloads) {
        live += decodeFightMessages(payload, composeCombatantRoster(combatants)).length;
    }
    assertEquals(events, live, "the same fight, read by the code that is running now");
});

Deno.test("a fight keeps where it was fought, and reads back without it", () => {
    const store = composeStore();
    assert(writeKeptFights(store, KEY, [composeFight(1)]), "a fight with a place is kept");
    assertEquals(readKeptFights(store, KEY)[0]?.place, { mapName: "Mapa", x: 12, y: 34 }, "whole");

    // A fight is worth keeping without a place: the three fields fail apart, as they do when
    // they are read off the client, and a fight is not dropped for missing one.
    assert(
        writeKeptFights(store, KEY, [{
            ...composeFight(2),
            place: { mapName: "Mapa", x: 1, y: 2 },
        }]),
        "a place is written as it stands",
    );
    const partial = composeJsonText({
        version: 1,
        fights: [{ openedAt: 3, combatants: [], payloads: [], place: { mapName: "Mapa" } }],
    });
    assert(partial !== null, "a shelf missing two fields of a place is text");
    store.write(KEY, partial);
    assertEquals(
        readKeptFights(store, KEY)[0]?.place,
        { mapName: "Mapa", x: null, y: null },
        "what was said is kept and what was not is nobody's",
    );
    const none = composeJsonText({
        version: 1,
        fights: [{ openedAt: 4, combatants: [], payloads: [] }],
    });
    assert(none !== null, "a shelf written before places were kept is text too");
    store.write(KEY, none);
    assertEquals(readKeptFights(store, KEY).length, 1, "a fight with no place at all still reads");
    assertEquals(
        readKeptFights(store, KEY)[0]?.place,
        null,
        "as a fight fought nobody knows where",
    );
});
