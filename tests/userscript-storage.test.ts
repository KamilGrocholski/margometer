/**
 * The three places a choice can be kept, and the one thing all three have to get
 * right: a refusal is an answer, never an exception.
 *
 * A browser throws for being *read* where it forbids storage, throws on the
 * property access before there is anything to call, and throws on a write that
 * would go past a quota — and the origin is shared with a game that does not
 * catch one (`src/userscript-storage.ts`). So every one of those is driven here
 * with a store that throws on purpose, because a real browser only does it on a
 * machine nobody is testing on.
 */

import { describe, expect, test } from "bun:test";
import {
  composeBrowserStore,
  composeMemoryStore,
  getStorageChoiceFromValue,
  getStoreFromPage,
  STORAGE_CHOICES,
  type PageStorage,
  type StoragePage,
} from "@/src/userscript-storage.ts";

/** A store that behaves, so the ones that misbehave below have something to differ from. */
function composeWorkingStorage(): PageStorage & { held: Map<string, string> } {
  const held = new Map<string, string>();
  return {
    held,
    getItem: (key) => held.get(key) ?? null,
    setItem: (key, value) => void held.set(key, value),
    removeItem: (key) => void held.delete(key),
  };
}

const THROWING: PageStorage = {
  getItem: () => {
    throw new DOMException("SecurityError");
  },
  setItem: () => {
    throw new DOMException("QuotaExceededError");
  },
  removeItem: () => {
    throw new DOMException("SecurityError");
  },
};

describe("the three choices", () => {
  test("are the three the reader is offered", () => {
    expect([...STORAGE_CHOICES]).toEqual(["local", "session", "memory"]);
  });

  test("read back from a stored value, or not at all", () => {
    expect(getStorageChoiceFromValue("session")).toBe("session");
    expect(getStorageChoiceFromValue("localStorage")).toBeNull();
    expect(getStorageChoiceFromValue(null)).toBeNull();
    expect(getStorageChoiceFromValue(0)).toBeNull();
  });
});

describe("a store that outlives nothing", () => {
  test("keeps what it was given and gives it back", () => {
    const store = composeMemoryStore();
    expect(store.getText("a")).toBeNull();
    expect(store.setText("a", "one")).toBe(true);
    expect(store.getText("a")).toBe("one");
    store.removeText("a");
    expect(store.getText("a")).toBeNull();
  });
});

describe("a browser store", () => {
  test("passes reads and writes through", () => {
    const storage = composeWorkingStorage();
    const store = composeBrowserStore(storage);
    expect(store.setText("k", "v")).toBe(true);
    expect(storage.held.get("k")).toBe("v");
    expect(store.getText("k")).toBe("v");
    store.removeText("k");
    expect(storage.held.size).toBe(0);
  });

  /** The whole reason this wrapper exists: none of the three may reach the game. */
  test("answers rather than throwing, whichever call the browser refuses", () => {
    const store = composeBrowserStore(THROWING);
    expect(store.getText("k")).toBeNull();
    expect(store.setText("k", "v")).toBe(false);
    expect(() => store.removeText("k")).not.toThrow();
  });
});

describe("the store a page offers", () => {
  test("is the one the reader chose", () => {
    const local = composeWorkingStorage();
    const session = composeWorkingStorage();
    const page: StoragePage = { localStorage: local, sessionStorage: session };

    getStoreFromPage(page, "local").setText("k", "in local");
    getStoreFromPage(page, "session").setText("k", "in session");

    expect(local.held.get("k")).toBe("in local");
    expect(session.held.get("k")).toBe("in session");
  });

  test("keeps nothing on a page the reader chose memory on", () => {
    const local = composeWorkingStorage();
    getStoreFromPage({ localStorage: local }, "memory").setText("k", "v");
    expect(local.held.size).toBe(0);
  });

  /**
   * The fallback, and the reason it is memory rather than the other browser
   * store: a reader who chose one place is better served by forgetting than by
   * being kept somewhere they did not choose.
   */
  test("falls back to memory where the page offers none", () => {
    const store = getStoreFromPage({}, "local");
    expect(store.setText("k", "v")).toBe(true);
    expect(store.getText("k")).toBe("v");
  });

  /**
   * ⚠️ **A browser forbidding storage throws on the property access itself**, so
   * the page is asked inside the `try`. Written the other way this reaches the
   * game's call stack, on a page where nothing else about the add-on is wrong.
   */
  test("falls back to memory where reaching for the store throws", () => {
    const page = {} as StoragePage;
    Object.defineProperty(page, "localStorage", {
      get() {
        throw new DOMException("SecurityError");
      },
    });
    expect(() => getStoreFromPage(page, "local")).not.toThrow();
    expect(getStoreFromPage(page, "local").setText("k", "v")).toBe(true);
  });
});
