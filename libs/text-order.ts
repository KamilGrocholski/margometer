/**
 * Putting two pieces of text in order, deterministically.
 *
 * `localeCompare` with no locale reads the **runtime's** default, so the order it
 * gives is a property of the machine that ran the program rather than of the
 * data. `tools/decoding-status.ts` sorts the unread protocol keys with it, and
 * that list is the queue §7.6 says the next question comes from — two people
 * diffing it on differently configured machines saw a difference that was not in
 * the protocol (`docs/audits/2026-08-14-the-whole-tree-read-again.md`, F21).
 *
 * §9.5 admits it on both halves of the criterion: more than one spelling
 * (`localeCompare`, `Intl.Collator`, `<`) and an answer nobody wrote.
 *
 * ⚠️ **There used to be a collated reader beside this one, and the tree no
 * longer has a question for it.** Its one caller was the panel's tie-break
 * between two combatants on equal figures, and that is the fight's own roster
 * order now — the game already showed those people in an order, and an alphabet
 * of ours is a second one. A locale-aware comparison is a real thing to want and
 * it can come back with a caller; what it may not do is sit here uncalled,
 * because §9.5's guard proves an owner by finding the construct in it, and an
 * owner with nothing to own quietly stops proving anything. So `localeCompare`
 * is now spelled **nowhere**, and `tests/tools/source-layout.test.ts` holds
 * that instead.
 */

/**
 * Deterministic order, by UTF-16 code unit — for anything a machine compares.
 *
 * The same everywhere, including on a machine whose locale nobody set. It is not
 * an alphabet and does not pretend to be one: where a person is reading the
 * result and the order has to be theirs, the data usually carries one already.
 */
export function getTextOrder(one: string, other: string): number {
  if (one === other) return 0;
  return one < other ? -1 : 1;
}
