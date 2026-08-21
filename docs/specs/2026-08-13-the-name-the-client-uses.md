# The name the client uses

Status: implemented

## What was wrong

The panel turned a protocol token into a Polish label out of six tables written
by hand, from the token's spelling. Measured against the client's own dictionary
— production build `1785244275300`, the same table the game composes its battle
log from — several of those labels were not what the game calls the thing:

- `contra` was drawn as a "kontra"; the client calls it a counterattack.
- `superspell-dispel` was drawn as a spell being dispelled. The client renders
  that key through a sentence named for `dispel`, and what it says is that a
  **special blow was interrupted** — a different mechanic, and one the register
  had already recorded the id for without anybody noticing the label disagreed.
- `abdest_per` and `abmdest_per` were drawn as an "osłona" being destroyed. The
  client announces absorption.
- `injure` was drawn as a "rana", which is the game's own word for `wound` — a
  different key this meter also reads.
- `legbon_holytouch_heal` and `legbon_lastheal` were paraphrased into "leczenie
  z efektu" and "leczenie ratunkowe"; both effects have names.

And two faults that were not about wording at all:

- `acdmg` (armour destroyed, in points) and `acdmg_destroyed` (armour gone, no
  figure) both drew as "zniszczony pancerz", one above the other in the same
  tooltip.
- `thirdatt` had no entry, and `"dmg "` — a damage element with a trailing space
  — had no entry either, so both reached the player as the engine token. The
  second one carried 107 952 points and split the physical row in two.

Those last two are one finding: the material-driven sweep collected five of the
seven token maps a row holds, and the two it missed were the element maps. A
sweep that reads the material is only as good as the places it reads.

## What was decided

**Ask the running client.** It ships the dictionary and exposes `_t`; the add-on
is on that page. So each token the panel names carries the client's identifier
for it and a phrase of ours, and the client's answer wins.

This is not a new idea here. The tree before the rewrite did exactly this, in a
file `778f3b2` deleted, and `f0c97d6` had already paid to strip the game's own
sentences out of the repository. `NOTICE.md` still described the arrangement —
"reads them from the running game at run time instead" — while the code did it
for skill names only. This makes that sentence true of labels as well.

Three consequences worth stating:

1. **A player sees their own client's wording, in their own language.** The
   panel is no longer a second, worse translation of the game.
2. **Nothing of the game's prose is stored.** The identifier is functional, of
   the same kind as a protocol key; the sentence it resolves to is used and
   dropped.
3. **The fallbacks still matter and are still ours.** Every test in this
   repository runs on a page with no game on it, which is the same path a
   browser without the client takes.

### An id is admitted only where the dictionary holds a name

Most of that dictionary is sentences with `%val%` holes in them. A label is not
a sentence with the figure cut out: a defence entry runs `<verb> %val% <noun>`
and comes back as a verb beside its object with the number gone, and a
destruction entry ends on the preposition that governed its hole, so cutting the
hole leaves that preposition dangling. The shapes are described and never quoted
— the sentences are the operator's writing, and NOTICE.md promises they are
absent here in any form.

So the defences and the destructions keep `id: null` and a short
noun of ours — written from what the client's sentence *says*, which is how
"osłona" became absorption — and only the effects, which the dictionary holds as
names, carry an id.

`src/game/game-dictionary.ts` enforces the same rule from the other end: an
answer still carrying a hole is refused, so the day the game turns one of those
names into a sentence the panel falls back instead of drawing a fragment.

## Rejected alternatives

- **Copying the game's names into a table here.** It is the shortest path to
  correct labels and it is what `f0c97d6` removed on purpose. The run-time read
  is the alternative that commit left behind.
- **Naming every token through the dictionary, holes and all,** with the holes
  stripped. Tried on paper against the real entries: half the labels come back
  with a trailing preposition. The panel's rows are short by design.
- **Deriving the id from the token** rather than writing one per token. It is
  nearly mechanical and the exceptions are the interesting ones —
  `+superspell-dispel` resolves under `msg_+dispel`, and the name for
  `legbon_holytouch_heal` is the one its proc carries. A rule with those two
  exceptions written into it is a table with extra steps.
- **Restoring the `msg_…` column in `tests/frozen-protocol-keys.ts`** and the
  extractor that filled it. That table has every key the client knows; the panel
  names a few dozen, and each id is a judgment about which entry is the name.
- **Making `translate` a required argument of `composePanelView`.** Sixty-odd
  test call sites would have said `null` to prove nothing. What actually needed
  holding is that the *mount* passes one, and that is one test on the entry
  point, driven from a page with a `_t` on it.

## What holds it

- `tests/ui/panel-view.test.ts`'s material-driven sweep, now over the element maps
  too. Red on `thirdatt` and `"dmg "` before this round.
- `tests/ui/panel-words.test.ts` — no two tokens say the same thing, no two ask
  the same question, the client's answer wins, a token with no id is never asked
  about.
- `tests/game/game-dictionary.test.ts` — what a label is, and every way the page
  can fail to give one.
- `tests/game/engine-attachment.test.ts` — the mount joins the two, which
  neither of the files above can see.
- `tests/core/fight-decoder.test.ts` — no element the captures decode carries a
  blank.
