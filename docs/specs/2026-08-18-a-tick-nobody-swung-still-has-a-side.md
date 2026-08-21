# A tick nobody swung still has a side

Status: implemented

This narrows `docs/specs/2026-08-18-a-figure-with-no-actor-has-no-side.md`,
which stays as written: nothing about the pinned `Bez sprawcy` row changes here —
not its figure, not its scope, not the bracket it does and does not carry. What
changes is one region lower, the summary bar under the list.

## The defect, as it was reported

> Remove "Bez strony" from the ui, the calculation is invalid, it's possible to
> split among sides

The bar drew three parts: `My`, `Oni`, and `Bez strony` for what belonged to
neither. The third label is a claim, and it is false.

## What the material says

The figure is made of messages of this shape, taken from
`tests/captured-fights/2026-08-15-tempest-grupa-vs-hildur-2.json`, where the bar
said `Bez strony 45 430`:

```
-10000547=99.60;0;poison=1317     id -10000547, team 2   44 464 in total
467968=99.52;0;heal=-92           id 467968,    team 1        966 in total
```

`actor;target;key=value` (`src/core/protocol-message.ts`), and `0` in a side
segment is the protocol naming nobody. For this family the subject sits in the
**actor** slot and the target is that `0` (`HEALTH_CHANGE_KEYS` in
`src/core/fight-decoder.ts`), so the message names **whom it happened to** and
never **who did it**. The id it names is in the roster with a `team`.

Measured over all seventeen captures, read 2026-08-18, decoding each with its own
roster:

| where the figure sat | over the whole set |
|---|---|
| on combatants the roster places | **100%** |
| `unattributed.dealtApplied`, `unattributed.healed`, `unattributed.taken` | 0 in every capture |
| combatants the roster cannot place | 0 in every capture |

By protocol key, summed over the set: `poison` 410 461, `injure` 25 062, `heal`
stating a loss 7 016, `fire` 1 419. Under `Leczenie dane` the same row is healing
no announcement stood over, so no healer was named — 33.3% to 100% of that
screen, against 1.3% to 18.6% of `Zadane`. On the received screens the figure was
zero in every capture, so the line only ever drew on the two given ones.

## The decision

**A figure with no actor is charged to the side the game named at the end it did
name.** Health that fell goes to the other side, health that rose to the same
one. `getPartCharged` in `src/ui/panel-view.ts` is the whole of it, and it is
asked only under a given direction — under a received one the points are already
on the row of the person the health moved on, and charging them again would count
them twice.

| screen | before | after |
|---|---|---|
| `Zadane`, hildur-2 | My 355 900 · Oni 70 398 · Bez strony 45 430 | **My 400 364 · Oni 71 364** |
| `Otrzymane`, hildur-2 | My 71 364 · Oni 400 364 | unchanged |

**The whole does not move.** 471 728 on that capture, before and after, so every
bracket on the screen still divides by the same figure and nothing above the bar
changes: `getWholeOnScreen`, `isPinnedInsideWhole`, `getPinnedValue` and the
pinned row itself are untouched.

**This is an inference, and it is the only one this panel draws.** It holds while
there are two sides and nobody harms their own; the protocol states neither. A
**name** is still never guessed (§5) — the pinned row above goes on showing the
figure with no actor, on every tab.

**The third part stays for what has no side at either end**: a figure naming
neither, and a combatant outside the roster. Zero in every recording, and not
zero in a live fight where a name in a message matches nobody — deleting it would
leave two sides summing to less than the fight with nothing saying so, which is
what §9.6 forbids.

**The label now says its scope on a side tab too.** `Zadane · My` puts 400 364 on
the bar over a ranking summing to 355 900, so the bar says `Cała walka · My / Oni`
wherever the list is narrower than the fight. It used to say that only under a
combatant's breakdown, because until now the two agreed by accident of scope.

**Two sentences were rewritten.** `PINNED_SCOPE_NOTES.dealt` and
`.healingGiven` in `src/ui/panel-words.ts` ended "nie należy do żadnej drużyny",
which the bar under them now contradicts. They say where the figure went instead;
the received pair is untouched.

## What is measured

- **The mirror, per side, on every capture**: `Zadane · My` equals
  `Otrzymane · Oni` to the point, and `Leczenie dane · My` equals `Leczenie · My`.
  This is a measurement rather than a construction — the two arms reach the figure
  through different fields of the aggregate (`dealtApplied` against `taken`,
  `healingGiven` against `healed`), so a blow between two of ours, or an end that
  stops resolving, breaks the equality. It is what pays for the inference: the
  assumption it rests on is exactly what the test would catch failing.
- The three closures that were already there still hold and are unchanged, which
  is how this round shows nothing was lost: the summary against the whole on
  screen, the noun closing from either direction, and the bar not moving when the
  side tab does.
- A fight where a blow names neither end still draws `Bez strony` with its figure,
  and the two sides do not swallow it. Hand-built, because no capture reaches that
  shape.

## Rejected alternatives

**Leaving the third part as it was.** The reported defect: a label claiming the
points have no side while the roster gives every one of them a `team`.

**Dropping the concept entirely.** Simpler, and it loses the one case where the
label was true — the live fight joined on a name that resolves to nobody. The bar
would then divide a whole it does not state, silently.

**Splitting the figure by the side the health moved on, without crossing it for
damage.** That is the received question printed under a given screen: `Zadane · My`
would hold what our side *lost*. The 2026-08-18 spec above was written against
exactly that reading one region up.

**Following this in `docs/design/panel.html`.** Unchanged, for the reason
`docs/specs/2026-08-12-the-height-a-fight-needs.md` gives: the drawing is a copy
of the numbers, not a second reader of them.
