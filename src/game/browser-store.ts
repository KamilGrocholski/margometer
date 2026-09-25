/**
 * The store a browser lends, wrapped so a refusal is an answer (`docs/design.md` §5).
 *
 * Reading can throw for no reason of ours (a browser set to forbid it does) and writing can throw
 * for quota, so each call into the page stands inside `callForeign`, once, here. What this asks of
 * a page is the three calls it makes and never a `Storage`, which keeps the contact declared.
 */

import { assert } from "@std/assert/assert";
import { callForeign, err, ok, type Result } from "#/libs/result.ts";
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

export const STORE_FAILURE = {
    unavailable: "store-unavailable",
    refused: "store-refused",
    valueTooLong: "store-value-too-long",
} as const;

export type StoreFailure =
    | { kind: typeof STORE_FAILURE.unavailable }
    /** A quota refusal is an answer. */
    | { kind: typeof STORE_FAILURE.refused; cause: unknown }
    | { kind: typeof STORE_FAILURE.valueTooLong; length: number; maximum: number };

export interface KeyValueStore {
    /** `null`: no such key, which is a fact. */
    read(key: StoreKey): Result<string | null, StoreFailure>;
    write(key: StoreKey, value: string): Result<void, StoreFailure>;
    remove(key: StoreKey): Result<void, StoreFailure>;
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
            if (storage === null) return err({ kind: STORE_FAILURE.unavailable });
            const read = callForeign(() => storage.getItem(key));
            if (!read.ok) return err({ kind: STORE_FAILURE.refused, cause: read.error.cause });
            if (typeof read.value !== "string") return ok(null);
            return ok(read.value);
        },
        write(key, value) {
            if (storage === null) return err({ kind: STORE_FAILURE.unavailable });
            const tooLong = prepareStoreWrite(value);
            if (!tooLong.ok) return tooLong;
            const written = callForeign(() => storage.setItem(key, value));
            if (!written.ok) {
                return err({ kind: STORE_FAILURE.refused, cause: written.error.cause });
            }
            return ok(undefined);
        },
        remove(key) {
            if (storage === null) return err({ kind: STORE_FAILURE.unavailable });
            const removed = callForeign(() => storage.removeItem(key));
            if (!removed.ok) {
                return err({ kind: STORE_FAILURE.refused, cause: removed.error.cause });
            }
            return ok(undefined);
        },
    };
}

function prepareStoreWrite(value: string): Result<void, StoreFailure> {
    if (value.length <= STORE_VALUE_LENGTH_MAXIMUM) return ok(undefined);
    const maximum = STORE_VALUE_LENGTH_MAXIMUM;
    return err({ kind: STORE_FAILURE.valueTooLong, length: value.length, maximum });
}

/**
 * A store of this page's own, for a reader who wants the shelf gone when the tab is. It refuses
 * nothing but a value past the bound: there is no quota to be past and nothing to be forbidden.
 */
export function initMemoryStore(): KeyValueStore {
    const held = new Map<StoreKey, string>();
    return {
        read(key) {
            return ok(held.get(key) ?? null);
        },
        write(key, value) {
            const tooLong = prepareStoreWrite(value);
            if (!tooLong.ok) return tooLong;
            held.set(key, value);
            assert(held.size <= STORE_KEYS.length, "a store holds no more than the keys it has");
            return ok(undefined);
        },
        remove(key) {
            held.delete(key);
            return ok(undefined);
        },
    };
}
