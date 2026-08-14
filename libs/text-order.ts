/**
 * Putting two pieces of text in order, and saying which question is being asked.
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
 * **Two readers, because there are two questions**, and the tree was answering
 * them with one function. A machine diffing output wants the same order
 * everywhere and forever; a person reading a list of names wants their own
 * alphabet, where `ł` sits after `l` and not after `z`. Neither is the other's
 * default, so neither gets to be the default.
 */

/**
 * Deterministic order, by UTF-16 code unit — for anything a machine compares.
 *
 * The same everywhere, including on a machine whose locale nobody set. It is not
 * an alphabet and does not pretend to be one: use the reader below wherever a
 * person is looking at the result.
 */
export function getTextOrder(one: string, other: string): number {
  if (one === other) return 0;
  return one < other ? -1 : 1;
}

/**
 * Collated order, in a stated language — for anything a person reads.
 *
 * The locale is required rather than defaulted: an omitted one is exactly the
 * bug above, and a parameter nobody has to pass is a parameter nobody thinks
 * about.
 */
export function getCollatedTextOrder(one: string, other: string, locale: string): number {
  return one.localeCompare(other, locale);
}
