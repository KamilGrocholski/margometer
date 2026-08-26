/**
 * Where a choice is kept between pages, and the three places it can be kept.
 *
 * At the root of `src/` because it belongs to no layer: `core` is pure and may
 * not know a browser exists, `ui` is handed its document and reaches for nothing,
 * and `game` is contact with the game client, which this is not (§9.1). The entry
 * point is the one file allowed to read a page, and this is the shape of what it
 * reads.
 *
 * ⚠️ **The game shares this quota, keeps everything under one key, rewrites it
 * whole on every change, and does not catch a refusal.** Production build
 * `53XkBRxF`, cached 2026-08-25 and read 2026-08-26:
 *
 * ```
 * var Storage=new(function(){var t=localStorage,n=`Margonem`,r=null,i=this,
 * a=function(){t.setItem(n,JSON.stringify(r))};…this.set=function(t,n){…s[i[0]]=n,a()}
 * ```
 *
 * So every `Storage.set` the client makes — a setting changed, a window moved —
 * serialises the client's entire blob and writes it, with no `try` anywhere near
 * it. An add-on that fills the origin's quota therefore does not merely fail to
 * save its own state: it makes the **game's** next write throw, inside the game's
 * own call stack, losing everything that write carried. That is the one promise
 * §5 makes, broken by a store.
 *
 * Which is why **a refusal is a value here and never an exception**, and why
 * nothing in this file assumes a quota. What a browser will take is not
 * knowable — it differs by engine, by profile and by how much the origin already
 * holds — so the write *is* the measurement, and the caller is told plainly
 * whether it landed (`docs/specs/2026-08-26-a-fight-you-can-go-back-to.md`).
 */

/**
 * The slice of a browser store this add-on uses. Nothing wider — `length`, `key`
 * and `clear` reach other people's keys, and we have no business with those.
 */
export type PageStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

/**
 * The page as this file needs it. Both optional, because a browser may refuse to
 * expose either — a private window, a third-party-storage rule — and a page
 * without them is a page the add-on still works on.
 */
export type StoragePage = {
  localStorage?: PageStorage | undefined;
  sessionStorage?: PageStorage | undefined;
};

/**
 * The three places, as the reader chooses between them.
 *
 * A list rather than a union spelled once, for the reader that has to take a
 * choice back out of stored text — §9.5 refuses a cast off `JSON.parse`, and the
 * choice is itself something this add-on remembers.
 */
export const STORAGE_CHOICES = ["local", "session", "memory"] as const;

export type StorageChoice = (typeof STORAGE_CHOICES)[number];

export function getStorageChoiceFromValue(value: unknown): StorageChoice | null {
  return STORAGE_CHOICES.find((choice) => choice === value) ?? null;
}

/**
 * One place to keep things, whichever it is.
 *
 * ⚠️ **`setText` answers whether it landed, and every caller has to look.** A
 * store that returns `void` on refusal is the silence §9.6 spends its length
 * on — the add-on would go on believing it had kept a fight that is not there,
 * and the reader would find out by reloading.
 */
export type ValueStore = {
  /** Null for *nothing here*, and null again where the browser refused to say. */
  getText: (key: string) => string | null;
  /** Whether the browser took it. */
  setText: (key: string, text: string) => boolean;
  removeText: (key: string) => void;
};

/**
 * A store that outlives nothing.
 *
 * The reader's third choice, and the one that promises least: fights survive
 * switching between screens and nothing else. It is also what a page with no
 * browser store at all degrades to, so the panel is never handed nothing.
 */
export function composeMemoryStore(): ValueStore {
  const held = new Map<string, string>();
  return {
    getText: (key) => held.get(key) ?? null,
    setText: (key, text) => {
      held.set(key, text);
      return true;
    },
    removeText: (key) => void held.delete(key),
  };
}

/**
 * One of the browser's two, with every failure turned into an answer.
 *
 * ⚠️ **The `try` is wider than §9.5 likes, and this is the place the rule names
 * as its exception: the boundary with somebody else's program.** A browser
 * refuses storage for being *read* as readily as for being written — private
 * windows, third-party-storage rules, a quota — and it arrives as a
 * `DOMException` under several different names, so there is nothing narrower to
 * catch that would still catch them all. What is *not* swallowed is a bad value:
 * that is read and rejected by whoever knows what the text should say, which is a
 * different thing from the read failing.
 */
export function composeBrowserStore(storage: PageStorage): ValueStore {
  return {
    getText: (key) => {
      try {
        return storage.getItem(key);
      } catch {
        return null;
      }
    },
    setText: (key, text) => {
      try {
        storage.setItem(key, text);
        return true;
      } catch {
        return false;
      }
    },
    removeText: (key) => {
      try {
        storage.removeItem(key);
      } catch {
        return;
      }
    },
  };
}

/**
 * The store the reader asked for, or the one that always works.
 *
 * Falling back to memory rather than to the other browser store: a reader who
 * chose `localStorage` on a browser that has none is better served by a panel
 * that quietly forgets between pages than by one that quietly keeps their fights
 * somewhere they did not choose.
 *
 * ⚠️ **Reaching the property is itself a read that can throw.** A browser
 * forbidding storage does not hand back `undefined` — it throws on the access,
 * before there is anything to call `getItem` on — so the page is asked inside the
 * `try` and not before it.
 */
export function getStoreFromPage(page: StoragePage, choice: StorageChoice): ValueStore {
  if (choice === "memory") return composeMemoryStore();
  try {
    const storage = choice === "local" ? page.localStorage : page.sessionStorage;
    return storage === undefined ? composeMemoryStore() : composeBrowserStore(storage);
  } catch {
    return composeMemoryStore();
  }
}
