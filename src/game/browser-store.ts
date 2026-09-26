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
    panelFolded: "MargoMeter-folded",
    panelPlace: "MargoMeter-place",
    helperFolded: "MargoMeter-pomocnik-folded",
    helperPlace: "MargoMeter-pomocnik-place",
    storage: "MargoMeter-storage",
} as const;
export type StoreKey = VocabularyWord<typeof STORE_KEY>;

export class StoreUnavailable extends Error {
    override readonly name = "StoreUnavailable";
}

/** A quota refusal is an answer. */
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
    write(key: StoreKey, value: string): undefined | StoreFailure;
    remove(key: StoreKey): undefined | StoreFailure;
}

/** The whole of what this asks a page for. A browser's `localStorage` satisfies it. */
export interface PageStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
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
export function initPageStore(storage: PageStorage | null): KeyValueStore {
    return {
        read(key) {
            if (storage === null) return new StoreUnavailable();
            const read = errors.attempt(() => storage.getItem(key));
            if (read instanceof Error) return new StoreRefused(read);
            if (typeof read !== "string") return null;
            return read;
        },
        write(key, value) {
            if (storage === null) return new StoreUnavailable();
            const tooLong = prepareStoreWrite(value);
            if (tooLong instanceof Error) return tooLong;
            const written = errors.attempt(() => storage.setItem(key, value));
            if (written instanceof Error) return new StoreRefused(written);
            return undefined;
        },
        remove(key) {
            if (storage === null) return new StoreUnavailable();
            const removed = errors.attempt(() => storage.removeItem(key));
            if (removed instanceof Error) return new StoreRefused(removed);
            return undefined;
        },
    };
}

function prepareStoreWrite(value: string): undefined | StoreValueTooLong {
    if (value.length <= STORE_VALUE_LENGTH_MAXIMUM) return undefined;
    return new StoreValueTooLong(value.length, STORE_VALUE_LENGTH_MAXIMUM);
}

/**
 * A store of this page's own, for a reader who wants the shelf gone when the tab is. It refuses
 * nothing but a value past the bound: there is no quota to be past and nothing to be forbidden.
 */
export function initMemoryStore(): KeyValueStore {
    const held = new Map<StoreKey, string>();
    return {
        read(key) {
            return held.get(key) ?? null;
        },
        write(key, value) {
            const tooLong = prepareStoreWrite(value);
            if (tooLong instanceof Error) return tooLong;
            held.set(key, value);
            assert(held.size <= STORE_KEYS.length, "a store holds no more than the keys it has");
            return undefined;
        },
        remove(key) {
            held.delete(key);
            return undefined;
        },
    };
}
