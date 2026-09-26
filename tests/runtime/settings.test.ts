/**
 * What a reader chose, field by field, over a store that answers, refuses, or holds something
 * nobody here wrote.
 *
 * Absent is the default and no failure; a field that does not read back is a failure naming our
 * field. The stored text is the one `develop` writes, so a reader moving between the two keeps it.
 */

import {
    assertEquals,
    assertInstanceOf,
    AssertionError,
    assertStrictEquals,
    assertThrows,
} from "@std/assert";
import * as errors from "#/libs/errors.ts";
import {
    initMemoryStore,
    initPageStore,
    type KeyValueStore,
    STORE_KEY,
    StoreRefused,
} from "#/src/game/browser-store.ts";
import {
    readStorageChoice,
    readWindowFold,
    readWindowPosition,
    SETTING_KEY,
    type SettingKey,
    SettingTooLong,
    SettingUnreadable,
    STORAGE_DEFAULT,
    writeStorageChoice,
    writeWindowFold,
    writeWindowPosition,
} from "#/src/runtime/settings.ts";
import { PANEL_WINDOW, STORAGE_CHOICE } from "#/src/ui/panel-choice.ts";

const REFUSAL = new DOMException("this browser forbids storage", "SecurityError");

Deno.test("the store a reader chose reads back, and nothing chosen is the default", () => {
    const store = initMemoryStore();
    assertEquals(readStorageChoice(store), STORAGE_DEFAULT, "nothing stored is the default");
    assertStrictEquals(STORAGE_DEFAULT, STORAGE_CHOICE.local, "which is the browser's own store");
    for (const choice of Object.values(STORAGE_CHOICE)) {
        writeStorageChoice(store, choice);
        assertEquals(readStorageChoice(store), choice, `${choice} reads back as itself`);
        assertEquals(store.read(STORE_KEY.storage), choice, "and is stored as its own word");
    }
});

Deno.test("a choice nobody here wrote is refused by name, and a store's refusal passes on", () => {
    const store = initMemoryStore();
    store.write(STORE_KEY.storage, "cloud");
    const key = SETTING_KEY.storage;
    expectSettingUnreadable(readStorageChoice(store), key, "a word outside the vocabulary");
    store.write(STORE_KEY.storage, "");
    expectSettingUnreadable(readStorageChoice(store), key, "and the empty word is not one either");
    expectStoreRefused(readStorageChoice(composeRefusingStore()), "the store's answer is kept");
    const written = writeStorageChoice(composeRefusingStore(), STORAGE_CHOICE.session);
    expectStoreRefused(written, "on writing too");
});

function expectSettingUnreadable(read: unknown, key: SettingKey, message: string): void {
    assertInstanceOf(read, SettingUnreadable, message);
    assertStrictEquals(read.key, key, `${message}, naming our field`);
}

function expectStoreRefused(read: unknown, message: string): void {
    assertInstanceOf(read, StoreRefused, message);
    assertInstanceOf(read.cause, errors.Caught, `${message}, as a throw caught`);
    assertStrictEquals(read.cause.cause, REFUSAL, `${message}, carrying what the store threw`);
}

function composeRefusingStore(): KeyValueStore {
    const refuse = (): never => {
        throw REFUSAL;
    };
    return initPageStore({ getItem: refuse, setItem: refuse, removeItem: refuse });
}

Deno.test("a fold is the one mark, and anything else stored there is not read as one", () => {
    const store = initMemoryStore();
    assertEquals(readWindowFold(store, PANEL_WINDOW.panel), false, "nothing stored: unfolded");
    writeWindowFold(store, PANEL_WINDOW.panel, true);
    assertEquals(store.read(STORE_KEY.panelFolded), "1", "a fold is stored as the mark");
    assertEquals(readWindowFold(store, PANEL_WINDOW.panel), true, "and reads back folded");
    writeWindowFold(store, PANEL_WINDOW.panel, false);
    assertEquals(store.read(STORE_KEY.panelFolded), "", "an unfolding leaves empty text");
    assertEquals(readWindowFold(store, PANEL_WINDOW.panel), false, "which reads unfolded");
    store.write(STORE_KEY.panelFolded, "yes");
    expectSettingUnreadable(
        readWindowFold(store, PANEL_WINDOW.panel),
        SETTING_KEY.panelFolded,
        "a word nobody here wrote is refused, naming the panel's fold",
    );
    expectStoreRefused(readWindowFold(composeRefusingStore(), PANEL_WINDOW.helper), "passed on");
});

/** Two windows, two folds: one mark over both would put away the wrong window. */
Deno.test("each window's fold and place are under keys of their own", () => {
    const store = initMemoryStore();
    writeWindowFold(store, PANEL_WINDOW.helper, true);
    assertEquals(store.read(STORE_KEY.helperFolded), "1", "the helper's fold is its own key");
    assertEquals(readWindowFold(store, PANEL_WINDOW.panel), false, "the panel stays open");
    assertEquals(readWindowFold(store, PANEL_WINDOW.helper), true, "the helper is folded");
    writeWindowPosition(store, PANEL_WINDOW.helper, { left: 5, top: 6 });
    assertEquals(store.read(STORE_KEY.helperPlace), '{"left":5,"top":6}', "its own place");
    assertEquals(readWindowPosition(store, PANEL_WINDOW.panel), null, "and not the panel's");
    store.write(STORE_KEY.helperFolded, "?");
    expectSettingUnreadable(
        readWindowFold(store, PANEL_WINDOW.helper),
        SETTING_KEY.helperFolded,
        "a failure names the helper's own fold",
    );
});

Deno.test("a position survives a reload, and nothing else is read as one", () => {
    const store = initMemoryStore();
    writeWindowPosition(store, PANEL_WINDOW.panel, { left: 12, top: 34 });
    assertEquals(store.read(STORE_KEY.panelPlace), '{"left":12,"top":34}', "as develop does");
    assertEquals(readWindowPosition(store, PANEL_WINDOW.panel), { left: 12, top: 34 }, "back");
    writeWindowPosition(store, PANEL_WINDOW.panel, { left: -3, top: 0 });
    assertEquals(readWindowPosition(store, PANEL_WINDOW.panel), { left: -3, top: 0 }, "zero");
    const samples: [string, string][] = [
        ["", "nothing stored as empty text is no position"],
        ["{", "and neither is text that was cut short"],
        ["[1,2]", "nor a shape of another kind"],
        ['{"left":1}', "a position states both numbers"],
        ['{"left":"1","top":2}', "as numbers, not text"],
        ['{"left":1.5,"top":2}', "and as whole ones"],
        ['{"left":1,"top":2.5}', "both of them"],
    ];
    for (const [text, message] of samples) {
        store.write(STORE_KEY.panelPlace, text);
        const read = readWindowPosition(store, PANEL_WINDOW.panel);
        expectSettingUnreadable(read, SETTING_KEY.panelPosition, message);
    }
});

Deno.test("a position is refused past its length, and read up to it", () => {
    const store = initMemoryStore();
    const padded = (length: number): string => {
        const body = '{"left":1,"top":2}';
        return `${body}${" ".repeat(length - body.length)}`;
    };
    store.write(STORE_KEY.panelPlace, padded(4096));
    assertEquals(readWindowPosition(store, PANEL_WINDOW.panel), { left: 1, top: 2 }, "at it");
    store.write(STORE_KEY.panelPlace, padded(4097));
    const past = readWindowPosition(store, PANEL_WINDOW.panel);
    assertInstanceOf(past, SettingTooLong, "one past it is too long, and is not parsed");
    assertStrictEquals(past.key, SETTING_KEY.panelPosition, "naming the panel's place");
});

/** A position that is not two whole numbers is the caller's bug, never text nobody can read. */
Deno.test("a position that is not two whole numbers is never written down", () => {
    const store = initMemoryStore();
    const fraction = { left: 1.5, top: 0 };
    assertThrows(() => writeWindowPosition(store, PANEL_WINDOW.panel, fraction), AssertionError);
    const notANumber = { left: 0, top: Number.NaN };
    assertThrows(() => writeWindowPosition(store, PANEL_WINDOW.panel, notANumber), AssertionError);
    assertEquals(store.read(STORE_KEY.panelPlace), null, "and nothing reached the store");
});
