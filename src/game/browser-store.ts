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
}

/** The whole of what this asks a page for. A browser's `localStorage` satisfies it. */
export interface PageStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

export function composeBrowserStore(storage: PageStorage): BrowserStore {
    assert(typeof storage.getItem === "function", "a page states the reading this asks for");
    assert(typeof storage.setItem === "function", "and the writing");
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
    };
}
