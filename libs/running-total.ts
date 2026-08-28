/**
 * Adding to a total a map already carries, where a key nobody has seen starts at zero.
 *
 * **Why here rather than at a call site.** §9.5's rule for `libs/` is about constructs
 * JavaScript spells more than one way, and this has exactly one spelling —
 * `map.set(key, (map.get(key) ?? 0) + amount)`. What puts it here is §7.1's second
 * consumer, which arrived long ago and kept arriving: the same three tokens were
 * written out in `src/core/fight-statistics.ts` twice, in `src/ui/panel-view.ts`, in
 * `src/game/battle-session.ts` and twice in `tools/decoding-status.ts` — five copies
 * across four files and three layers. `libs/` is the layer a counter over a map belongs
 * to, because nothing about it knows the game, the protocol or the panel.
 *
 * ⚠️ **The `?? 0` is the point of it, and it is not the substitution §9.3 forbids.** A
 * key with no entry yet has counted nothing, which is a measurement of zero rather than
 * a figure nobody wrote — the failure that rule names is putting `0` where the answer
 * is *unknown*, and here there is no unknown to confuse it with. Writing it out five
 * times is how one of them would eventually have been written differently.
 */

export function setRunningTotal<Key>(totals: Map<Key, number>, key: Key, amount: number): void {
  totals.set(key, (totals.get(key) ?? 0) + amount);
}

/**
 * The same, one level down: a total per pair of keys.
 *
 * A separate reader rather than a caller composing two maps, because the outer
 * key's missing entry has to become a map and the inner one's a zero, and those
 * are two different starting values in one expression.
 */
export function setPairRunningTotal<Outer, Inner>(
  pairs: Map<Outer, Map<Inner, number>>,
  outer: Outer,
  inner: Inner,
  amount: number,
): void {
  const row = pairs.get(outer) ?? new Map<Inner, number>();
  setRunningTotal(row, inner, amount);
  pairs.set(outer, row);
}

/**
 * What a map of totals comes to.
 *
 * The reading half of the same idea, and it is here for the same reason the writing
 * half is: `[...map.values()].reduce((sum, one) => sum + one, 0)`, `for (const one of
 * map.values()) total += one` and a `for…of` over the entries are three spellings of
 * one question, and all three were in `src/ui/`.
 *
 * Empty comes to zero, which is a measurement rather than a figure nobody wrote: a map
 * holding nothing has counted nothing. That is the same argument the `?? 0` above rests
 * on, and it is the reason this reader belongs beside it.
 */
export function getTotalOfValues<Key>(totals: ReadonlyMap<Key, number>): number {
  let total = 0;
  for (const one of totals.values()) total += one;
  return total;
}

/**
 * A total per **inner** key, out of a map keyed by pairs — the outer key summed
 * away.
 *
 * The one fold `setRunningTotal` cannot be composed into in a line, and the one
 * `src/ui/` wrote out three times over three different pairs. Its opposite —
 * a total per outer key — is `setRunningTotal(totals, outer, getTotalOfValues(inner))`
 * over the entries, which is two readers already here and no third one.
 */
export function getTotalsByInnerKey<Outer, Inner>(
  pairs: ReadonlyMap<Outer, ReadonlyMap<Inner, number>>,
): Map<Inner, number> {
  const totals = new Map<Inner, number>();
  for (const inner of pairs.values()) {
    for (const [key, amount] of inner) setRunningTotal(totals, key, amount);
  }
  return totals;
}
