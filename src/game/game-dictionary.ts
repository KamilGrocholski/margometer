/**
 * Asking the running client what it calls something.
 *
 * The game ships a dictionary keyed by identifiers — `msg_+crit`, `msg_-contra`
 * — and composes its own battle log out of it through a global, `_t`. The panel
 * names the tokens it draws with the same identifiers
 * (`src/ui/panel-words.ts`), so it can be told what the player's own client
 * calls each one, in the player's own language, without a word of the game's
 * being written down here (NOTICE.md).
 *
 * The log is not the only place the client keeps a name. `def-heal` labels the
 * `heal` row of a warrior's statistics, and a label is what a row of ours wants —
 * so an id the panel asks for is any dictionary identifier whose entry is a name,
 * and not only a `msg_…` one (production build `1786514810315`;
 * `tests/ui/panel-words.test.ts` holds the families to a short list).
 *
 * ⚠️ **Only a name is a label.** Most of that dictionary is sentences with
 * `%val%` holes in them, and a sentence with the figure cut out of it is not a
 * label. Two shapes make the point: a defence entry runs `<verb> %val% <noun>`
 * and comes back as a verb beside its object with the number gone, and a
 * destruction entry ends on the preposition that governed its hole, so cutting
 * the hole leaves the preposition dangling. So an answer still carrying a hole is
 * refused here and the panel falls back to its own word.
 *
 * The entries are described rather than quoted, here and everywhere below: they
 * are sentences the operator wrote, and §5 keeps those out of this repository in
 * any form (NOTICE.md). Their **shape** is ours to state, and it is what this
 * file actually reads. The two files agree on the rule from both ends: `panel-words.ts` only
 * names an id it has read as a name, and this refuses to return a sentence in
 * case the game turns one into the other.
 *
 * Read on production build `1785244275300`, readable in development build
 * `1781609507010`: `window._t = function (name, parameters, category)` over
 * `__translations`, defaulting to the category `default`, which is the one every
 * `msg_…` sits in.
 *
 * ⚠️ **Ask only for ids that exist.** An id the client does not know falls off
 * the end of `_t` — returning `undefined` — but not before pushing it onto a
 * queue and arming a timer to report it. That reporting is commented out in the
 * build read, so nothing leaves the page and no rule of §5 is touched; it is
 * still work the game does because we asked. Every id the panel names was read
 * out of the dictionary, so this stays theoretical, and it is the reason it
 * stays that way.
 */

export type DictionaryWindow = {
  _t?: unknown;
};

/** The signs the client prefixes to say which way an effect went. */
const DIRECTION_SIGNS = "+-";
/** What opens and closes a hole the client fills: `%val%`, `%name%`, `%val2%`. */
const HOLE_MARK = "%";
const FULL_STOP = ".";

/**
 * Two marks with nothing between them is a hole, and any two marks are that:
 * the second occurrence found from the first is by definition the next one, so
 * there is nothing between them to look at.
 */
function hasHole(entry: string): boolean {
  const open = entry.indexOf(HOLE_MARK);
  return open !== -1 && entry.indexOf(HOLE_MARK, open + 1) !== -1;
}

/**
 * The label inside one of the client's strings, or null if there is no label in
 * it.
 *
 * Exported and pure so the rule is checkable without a browser, which is the
 * only place it can be checked at all — the dictionary is not in this
 * repository and never will be.
 */
export function getLabelFromEntry(entry: string): string | null {
  if (hasHole(entry)) return null;

  const first = entry[0];
  const signed = first !== undefined && DIRECTION_SIGNS.includes(first);
  const trimmed = (signed ? entry.slice(1) : entry).trim();
  const label = (trimmed.endsWith(FULL_STOP) ? trimmed.slice(0, -1) : trimmed).trim();

  return label === "" ? null : label;
}

export function getDictionaryReader(page: DictionaryWindow): ((id: string) => string | null) | null {
  const translate = page._t;
  if (typeof translate !== "function") return null;

  return (id: string): string | null => {
    // Narrowly: this is a call into someone else's program, and §9.5 wants the
    // expected failure to be data. There is exactly one way to handle a
    // dictionary that misbehaves and it is to use our own word instead.
    let entry: unknown;
    try {
      entry = (translate as (name: string) => unknown)(id);
    } catch {
      return null;
    }
    // An id it does not know returns `undefined` — the miss branch falls off the
    // end of the function — so this covers a missing entry as well as a
    // dictionary that is not what we think it is.
    if (typeof entry !== "string") return null;
    return getLabelFromEntry(entry);
  };
}
