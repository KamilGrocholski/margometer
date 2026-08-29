/**
 * The store a browser lends, wrapped so a refusal is an answer.
 *
 * Reading can throw for no reason of ours — a browser set to forbid it does — and writing can
 * throw for quota, so both are wrapped once here rather than at every caller. What it asks of a
 * page is stated as the two calls it makes and never as a `Storage`, which keeps a userscript's
 * contact with its browser declared.
 */

import { assert } from "@std/assert";

export interface BrowserStore {
    read(key: string): string | null;
    /** False where the browser refused, which is an answer and not a failure. */
    write(key: string, value: string): boolean;
    /** Takes what was under a key out of the store. A key nobody wrote is already out. */
    remove(key: string): void;
}

/** The whole of what this asks a page for. A browser's `localStorage` satisfies it. */
export interface PageStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}

export function composeBrowserStore(storage: PageStorage): BrowserStore {
    assert(typeof storage.getItem === "function", "a page states the reading this asks for");
    assert(typeof storage.setItem === "function", "and the writing");
    assert(typeof storage.removeItem === "function", "and the taking back out");
    return {
        read: (key) => {
            assert(key.length > 0, "what is read is asked for by name");
            try {
                return storage.getItem(key);
            } catch {
                // A store that will not be read has nothing in it, which is an answer.
                return null;
            }
        },
        write: (key, value) => {
            assert(key.length > 0, "what is written is written by name");
            assert(value.length >= 0, "and written as text, however short");
            try {
                storage.setItem(key, value);
                return true;
            } catch {
                // No quota is ever assumed: a refusal comes back as one.
                return false;
            }
        },
        remove: (key) => {
            assert(key.length > 0, "what is taken out is named");
            try {
                storage.removeItem(key);
            } catch {
                // A store that will not be written is a store nothing can be taken out of.
                return;
            }
        },
    };
}

/**
 * A store of this session's own, for a reader who wants the shelf gone when the tab is.
 *
 * It is a store like the two a browser lends, and it refuses nothing: what it holds lives in this
 * page's memory, so there is no quota to be past and nothing to be forbidden. What it costs is
 * stated by its own name — a reload is a browser that never had it.
 */
export function composeMemoryStore(): BrowserStore {
    const held = new Map<string, string>();
    return {
        read: (key) => {
            assert(key.length > 0, "what is read is asked for by name");
            return held.get(key) ?? null;
        },
        write: (key, value) => {
            assert(key.length > 0, "what is written is written by name");
            assert(value.length >= 0, "and written as text, however short");
            held.set(key, value);
            return true;
        },
        remove: (key) => {
            assert(key.length > 0, "what is taken out is named");
            held.delete(key);
        },
    };
}
