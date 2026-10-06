/**
 * The store a browser lends, wrapped so a refusal is an answer (`docs/design.md` §5).
 *
 * Reading can throw for no reason of ours (a browser set to forbid it does) and writing can throw
 * for quota, so each call into the page stands inside `errors.attempt`, once, here. What this asks of
 * a page is the three calls it makes and never a `Storage`, which keeps the contact declared.
 */

import { assert } from "@std/assert/assert";
import * as errors from "#/libs/errors.ts";
import type { VocabularyWord } from "#/libs/vocabulary.ts";

/** Every key this add-on writes, named as ours like everything else a reader could meet. */
export const STORE_KEY = {
    fights: "MargoMeter-fights",
    meterFolded: "MargoMeter-meter-folded",
    meterPosition: "MargoMeter-meter-position",
    helperFolded: "MargoMeter-helper-folded",
    helperPosition: "MargoMeter-helper-position",
    storage: "MargoMeter-storage",
    typeStep: "MargoMeter-type-step",
    meterSize: "MargoMeter-meter-size",
    helperSize: "MargoMeter-helper-size",
} as const;
export type StoreKey = VocabularyWord<typeof STORE_KEY>;

export class StoreUnavailable extends Error {
    override readonly name = "StoreUnavailable";
}

/** A refusal the browser threw is an answer: a write past its quota, or any call it forbids. */
export class StoreRefused extends Error {
    override readonly name = "StoreRefused";

    constructor(cause: errors.Caught) {
        super(undefined, { cause });
    }
}

export class StoreValueTooLong extends Error {
    override readonly name = "StoreValueTooLong";
    readonly length: number;
    readonly maximum: number;

    constructor(length: number, maximum: number) {
        super();
        this.length = length;
        this.maximum = maximum;
    }
}

export type StoreFailure = StoreUnavailable | StoreRefused | StoreValueTooLong;

export interface KeyValueStore {
    /** `null`: no such key, which is a fact. */
    read(key: StoreKey): string | null | StoreFailure;
    write(key: StoreKey, storedText: string): undefined | StoreFailure;
    delete(key: StoreKey): undefined | StoreFailure;
}

/** The whole of what this asks a page for. A browser's `localStorage` satisfies it. */
export interface BrowserStorage {
    getItem(key: string): string | null;
    setItem(key: string, storedText: string): void;
    removeItem(key: string): void;
}

const STORE_KEYS = Object.values(STORE_KEY);

/**
 * What one write may run to; past it the store **refuses**. The widest kept fight over
 * `captures/` is 219,128 characters as the shelf writes it (2026-09-21), so twenty of
 * them are past this, and the refusal is what lets the rotation drop the oldest.
 */
export const STORE_VALUE_LENGTH_MAXIMUM = 4194304;

/** A store over the page's own; `null` where the page lent none, which every call then answers. */
export function initBrowserStore(storage: BrowserStorage | null): KeyValueStore {
    return {
        read(key) {
            if (storage === null) return new StoreUnavailable();
            const storedText = errors.attempt(() => storage.getItem(key));
            if (storedText instanceof Error) return new StoreRefused(storedText);
            if (typeof storedText !== "string") return null;
            return storedText;
        },
        write(key, storedText) {
            if (storage === null) return new StoreUnavailable();
            const tooLong = prepareStoreWrite(storedText);
            if (tooLong instanceof Error) return tooLong;
            const written = errors.attempt(() => storage.setItem(key, storedText));
            if (written instanceof Error) return new StoreRefused(written);
            return undefined;
        },
        delete(key) {
            if (storage === null) return new StoreUnavailable();
            const deleted = errors.attempt(() => storage.removeItem(key));
            if (deleted instanceof Error) return new StoreRefused(deleted);
            return undefined;
        },
    };
}

function prepareStoreWrite(storedText: string): undefined | StoreValueTooLong {
    if (storedText.length <= STORE_VALUE_LENGTH_MAXIMUM) return undefined;
    return new StoreValueTooLong(storedText.length, STORE_VALUE_LENGTH_MAXIMUM);
}

/**
 * A store of this page's own, for a reader who wants the shelf gone when the tab is. It refuses
 * nothing but a value past the bound: there is no quota to be past and nothing to be forbidden.
 */
export function initMemoryStore(): KeyValueStore {
    const valuesByKey = new Map<StoreKey, string>();
    return {
        read(key) {
            return valuesByKey.get(key) ?? null;
        },
        write(key, storedText) {
            const tooLong = prepareStoreWrite(storedText);
            if (tooLong instanceof Error) return tooLong;
            valuesByKey.set(key, storedText);
            assert(
                valuesByKey.size <= STORE_KEYS.length,
                "a store holds no more than the keys it has",
            );
            return undefined;
        },
        delete(key) {
            valuesByKey.delete(key);
            return undefined;
        },
    };
}
