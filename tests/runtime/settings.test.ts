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
    initBrowserStore,
    initMemoryStore,
    type KeyValueStore,
    STORE_KEY,
    StoreRefused,
} from "#/src/ports/browser-store.ts";
import {
    deleteWindowSize,
    readStorageChoice,
    readTypeStep,
    readWindowCollapsed,
    readWindowPosition,
    readWindowSize,
    SETTING_KEY,
    type SettingKey,
    SettingTooLong,
    SettingUnreadable,
    STORAGE_DEFAULT,
    writeStorageChoice,
    writeTypeStep,
    writeWindowCollapsed,
    writeWindowPosition,
    writeWindowSize,
} from "#/src/runtime/settings.ts";
import {
    PANEL_WINDOW,
    STORAGE_CHOICE,
    TYPE_STEP,
    TYPE_STEP_DEFAULT,
    TYPE_STEPS,
} from "#/src/ui/panel-choice.ts";

const REFUSAL = new DOMException("this browser forbids storage", "SecurityError");

Deno.test("the store a reader chose reads back, and nothing chosen is the default", () => {
    const store = initMemoryStore();
    assertStrictEquals(readStorageChoice(store), STORAGE_DEFAULT, "nothing stored is the default");
    assertStrictEquals(STORAGE_DEFAULT, STORAGE_CHOICE.local, "which is the browser's own store");
    for (const choice of Object.values(STORAGE_CHOICE)) {
        writeStorageChoice(store, choice);
        assertStrictEquals(readStorageChoice(store), choice, `${choice} reads back as itself`);
        assertStrictEquals(store.read(STORE_KEY.storage), choice, "and is stored as its own word");
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

function expectSettingUnreadable(answer: unknown, key: SettingKey, message: string): void {
    assertInstanceOf(answer, SettingUnreadable, message);
    assertStrictEquals(answer.key, key, `${message}, naming our field`);
}

function expectStoreRefused(answer: unknown, message: string): void {
    assertInstanceOf(answer, StoreRefused, message);
    assertInstanceOf(answer.cause, errors.Caught, `${message}, as a throw caught`);
    assertStrictEquals(answer.cause.cause, REFUSAL, `${message}, carrying what the store threw`);
}

function composeRefusingStore(): KeyValueStore {
    const refuse = (): never => {
        throw REFUSAL;
    };
    return initBrowserStore({ getItem: refuse, setItem: refuse, removeItem: refuse });
}

Deno.test("the size of type a reader chose reads back, and nothing chosen is the default", () => {
    const store = initMemoryStore();
    assertStrictEquals(readTypeStep(store), TYPE_STEP_DEFAULT, "nothing stored is the default");
    assertStrictEquals(
        TYPE_STEP_DEFAULT,
        TYPE_STEP.medium,
        "which is the middle step",
    );
    for (const step of TYPE_STEPS) {
        writeTypeStep(store, step);
        assertStrictEquals(readTypeStep(store), step, `${step} reads back as itself`);
        assertStrictEquals(store.read(STORE_KEY.typeStep), step, "and is stored as its own word");
    }
    store.write(STORE_KEY.typeStep, "13");
    expectSettingUnreadable(
        readTypeStep(store),
        SETTING_KEY.typeStep,
        "a size is not a pixel count",
    );
    store.write(STORE_KEY.typeStep, "");
    expectSettingUnreadable(readTypeStep(store), SETTING_KEY.typeStep, "nor the empty word");
    expectStoreRefused(readTypeStep(composeRefusingStore()), "the store's answer is kept");
    expectStoreRefused(writeTypeStep(composeRefusingStore(), TYPE_STEP.large), "on writing too");
});

Deno.test("a window's size reads back per window, and goes when it is given back", () => {
    const store = initMemoryStore();
    for (const window of [PANEL_WINDOW.meter, PANEL_WINDOW.helper]) {
        assertStrictEquals(
            readWindowSize(store, window),
            null,
            `${window}: nothing stored is no size`,
        );
    }
    writeWindowSize(store, PANEL_WINDOW.meter, { width: 320, height: 350 });
    assertStrictEquals(
        store.read(STORE_KEY.meterSize),
        '{"width":320,"height":350}',
        "as two numbers",
    );
    assertEquals(readWindowSize(store, PANEL_WINDOW.meter), { width: 320, height: 350 }, "back");
    assertStrictEquals(
        readWindowSize(store, PANEL_WINDOW.helper),
        null,
        "and the other window's is its own",
    );
    writeWindowSize(store, PANEL_WINDOW.helper, { width: 1, height: 1 });
    assertEquals(
        readWindowSize(store, PANEL_WINDOW.helper),
        { width: 1, height: 1 },
        "one is a size",
    );
    deleteWindowSize(store, PANEL_WINDOW.meter);
    assertStrictEquals(store.read(STORE_KEY.meterSize), null, "given back, it is gone");
    assertEquals(
        readWindowSize(store, PANEL_WINDOW.helper),
        { width: 1, height: 1 },
        "not the other",
    );
    assertThrows(
        () => writeWindowSize(store, PANEL_WINDOW.meter, { width: 0, height: 10 }),
        AssertionError,
        "narrower than nothing",
    );
});

Deno.test("a size that is not two whole numbers above nought is refused by name", () => {
    const store = initMemoryStore();
    const key = SETTING_KEY.meterSize;
    const unread = [
        '{"width":0,"height":350}',
        '{"width":320,"height":-1}',
        '{"width":320.5,"height":350}',
        '{"width":"320","height":350}',
        '{"width":320}',
        "320x350",
    ];
    for (const text of unread) {
        store.write(STORE_KEY.meterSize, text);
        expectSettingUnreadable(readWindowSize(store, PANEL_WINDOW.meter), key, text);
    }
    store.write(STORE_KEY.meterSize, `{"width":320,"height":${"0".repeat(4096)}}`);
    assertInstanceOf(
        readWindowSize(store, PANEL_WINDOW.meter),
        SettingTooLong,
        "and text too long",
    );
    expectStoreRefused(readWindowSize(composeRefusingStore(), PANEL_WINDOW.meter), "a refusal");
    expectStoreRefused(deleteWindowSize(composeRefusingStore(), PANEL_WINDOW.meter), "on removing");
});

Deno.test("a fold is the one mark, and anything else stored there is not read as one", () => {
    const store = initMemoryStore();
    assertStrictEquals(
        readWindowCollapsed(store, PANEL_WINDOW.meter),
        false,
        "nothing stored: unfolded",
    );
    writeWindowCollapsed(store, PANEL_WINDOW.meter, true);
    assertStrictEquals(store.read(STORE_KEY.meterFolded), "1", "a fold is stored as the mark");
    assertStrictEquals(
        readWindowCollapsed(store, PANEL_WINDOW.meter),
        true,
        "and reads back folded",
    );
    writeWindowCollapsed(store, PANEL_WINDOW.meter, false);
    assertStrictEquals(store.read(STORE_KEY.meterFolded), "", "an unfolding leaves empty text");
    assertStrictEquals(
        readWindowCollapsed(store, PANEL_WINDOW.meter),
        false,
        "which reads unfolded",
    );
    store.write(STORE_KEY.meterFolded, "yes");
    expectSettingUnreadable(
        readWindowCollapsed(store, PANEL_WINDOW.meter),
        SETTING_KEY.meterFolded,
        "a word nobody here wrote is refused, naming the panel's fold",
    );
    expectStoreRefused(
        readWindowCollapsed(composeRefusingStore(), PANEL_WINDOW.helper),
        "passed on",
    );
});

/** Two windows, two folds: one mark over both would put away the wrong window. */
Deno.test("each window's fold and place are under keys of their own", () => {
    const store = initMemoryStore();
    writeWindowCollapsed(store, PANEL_WINDOW.helper, true);
    assertStrictEquals(store.read(STORE_KEY.helperFolded), "1", "the helper's fold is its own key");
    assertStrictEquals(
        readWindowCollapsed(store, PANEL_WINDOW.meter),
        false,
        "the panel stays open",
    );
    assertStrictEquals(
        readWindowCollapsed(store, PANEL_WINDOW.helper),
        true,
        "the helper is folded",
    );
    writeWindowPosition(store, PANEL_WINDOW.helper, { left: 5, top: 6 });
    assertStrictEquals(store.read(STORE_KEY.helperPosition), '{"left":5,"top":6}', "its own place");
    assertStrictEquals(readWindowPosition(store, PANEL_WINDOW.meter), null, "and not the panel's");
    store.write(STORE_KEY.helperFolded, "?");
    expectSettingUnreadable(
        readWindowCollapsed(store, PANEL_WINDOW.helper),
        SETTING_KEY.helperFolded,
        "a failure names the helper's own fold",
    );
});

Deno.test("a position survives a reload, and nothing else is read as one", () => {
    const store = initMemoryStore();
    writeWindowPosition(store, PANEL_WINDOW.meter, { left: 12, top: 34 });
    assertStrictEquals(
        store.read(STORE_KEY.meterPosition),
        '{"left":12,"top":34}',
        "as develop does",
    );
    assertEquals(readWindowPosition(store, PANEL_WINDOW.meter), { left: 12, top: 34 }, "back");
    writeWindowPosition(store, PANEL_WINDOW.meter, { left: -3, top: 0 });
    assertEquals(readWindowPosition(store, PANEL_WINDOW.meter), { left: -3, top: 0 }, "zero");
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
        store.write(STORE_KEY.meterPosition, text);
        const answer = readWindowPosition(store, PANEL_WINDOW.meter);
        expectSettingUnreadable(answer, SETTING_KEY.meterPosition, message);
    }
});

Deno.test("a position is refused past its length, and read up to it", () => {
    const store = initMemoryStore();
    const padded = (length: number): string => {
        const body = '{"left":1,"top":2}';
        return `${body}${" ".repeat(length - body.length)}`;
    };
    store.write(STORE_KEY.meterPosition, padded(4096));
    assertEquals(readWindowPosition(store, PANEL_WINDOW.meter), { left: 1, top: 2 }, "at it");
    store.write(STORE_KEY.meterPosition, padded(4097));
    const past = readWindowPosition(store, PANEL_WINDOW.meter);
    assertInstanceOf(past, SettingTooLong, "one past it is too long, and is not parsed");
    assertStrictEquals(past.key, SETTING_KEY.meterPosition, "naming the panel's place");
});

/** A position that is not two whole numbers is the caller's bug, never text nobody can read. */
Deno.test("a position that is not two whole numbers is never written down", () => {
    const store = initMemoryStore();
    const fraction = { left: 1.5, top: 0 };
    assertThrows(() => writeWindowPosition(store, PANEL_WINDOW.meter, fraction), AssertionError);
    const notANumber = { left: 0, top: Number.NaN };
    assertThrows(() => writeWindowPosition(store, PANEL_WINDOW.meter, notANumber), AssertionError);
    assertStrictEquals(store.read(STORE_KEY.meterPosition), null, "and nothing reached the store");
});
