# Protocol keys — what has been looked into

What we know about individual keys, and how we came to know it. Read this before
investigating a key: some are already settled, and some were investigated and
deliberately left alone.

Each entry carries a **verdict** and its **evidence** — a measurement over the
captured fights, or a citation from the game client with the build it was read
on. A verdict without evidence is a guess someone will later mistake for a fact.

**Guarded** by `tests/protocol-key-register.test.ts`: this file cannot get ahead
of the decoder or fall behind it. What it deliberately does **not** hold is any
count of progress — run `bun tools/decoding-status.ts` for that.

---

## Where health comes from, and why every entry states one

No key moves health. The client reads the health percentage off the **side
segments** and applies it before it looks at a single key: `battleMsg` splits the
message, and for each side that carries `=` it does
`warriorsList[id].tmpHpp = parseFloatHP(…)`. The switch over keys that follows
composes the battle log and nothing else — it contains no assignment to a
fighter's health at all.

*Evidence:* production build `1785244275300`, the same in development build
`1781609507010`. Both `tmpHpp` assignments in the production bundle sit in
`battleMsg`, ahead of the switch; searching the whole switch region for an
assignment to a fighter's health finds none.

So the question a key can answer is not "does it change health" but **"does it
report a health figure the arithmetic has to account for"**. An entry that has
settled that says so with one line:

```
*Health:* moves health
```

There is no opposite value, and the omission is the point. Silence means the
material has not settled it — which is different from "it is harmless", and the
two must not share a spelling. `tests/health-witness.test.ts` reads this line
and skips any engine call carrying such a key, because a figure it cannot add is
a figure that makes every later comparison in that call wrong.

**The evidence is always a measurement on the captures**, never a citation:
having established that the client only composes sentences, there is nothing in
it left to cite. The measurement is the same one every time, and the guard
re-runs it: admit the key to the witness and a comparison must disagree **on a
message carrying that key**. A verdict that cannot be attributed to its own key
is a cascade from a neighbour, and is not a verdict.

**A key with no entry is let through**, and the witness is what pushes back: if
it does report health, its comparisons stop matching. That is the design, not a
caveat — the alternative is an entry per key with nothing behind it, which is the
kind of bulk this directory exists to refuse.

---

## Keys the decoder reads

### `winner` — decoded

The combatants on the winning side, as a single string, names separated by a
comma and a space. Appears in a message that names no combatant at all: it is
about the fight, not about anyone in it.

*Evidence:* every occurrence in both captured fights has that shape, and both
fights end with exactly one `winner` and one `loser`.

### `loser` — decoded

The same, for the losing side.

### `+oth_dmg` — decoded

Damage that landed on a combatant the protocol names **by name**, alongside an
attack aimed at someone else. Value is `amount,kind,name(percent%)`; the
percentage belongs to the named combatant, not to the message target. The damage
has already been reduced — unlike `+dmg`/`-dmg` there is no second figure.

*Health:* moves health

Accounted for rather than skipped: the witness resolves the name against the
combatants the engine call started with and subtracts the figure there. A name
matching none of them, or more than one, makes the call uncomparable instead —
the boar fight fields two combatants called the same thing, so a unique match is
a condition, not a formality.

*Evidence:* in every call where a target lost more health than the attack
accounted for, the shortfall equalled this amount exactly — 110, 247 and 123 in
three separate calls. Three independent confirmations on real material, which is
why this is not read off the client's sentence template.

### `heal` — decoded

Health restored to, or lost by, the combatant in the **actor** slot of a message
whose target is nobody: `<combatant>=<percent>;0;heal=<amount>`. The slot holds
the subject here rather than an attacker, and no message of this shape names
anyone else. Read as a positive health change; the client will state a loss with
a negative amount, which needs no special case because the figure is signed.

*Health:* moves health

*Evidence:* of the four ways to sign `heal` and `poison`, only healing added and
poison subtracted closes the stated percentages — the other three leave hundreds
of comparisons disagreeing. Applying it moved the witness from declining every
call that contains it to agreeing on them.

### `poison` — decoded

Damage over time, same shape and same slot as `heal`, read as a negative health
change. **Unattributed by construction:** the protocol does not say who applied
it, so nothing downstream may credit it to anyone (§5).

*Health:* moves health

*Evidence:* as above. Before it was read, the first disagreement it caused was
`-10000249=76.05;0;poison=563`.

### `legbon_holytouch_heal` — decoded

Healing, same shape and slot as `heal`, from a legendary bonus rather than a
spell. Read identically; nothing about it needed a separate rule.

*Health:* moves health

*Evidence:* found by the witness rather than looked for. With `heal`, `poison`
and `injure` read, three comparisons still disagreed, all for one combatant and
all by the same six percentage points — `legbon_holytouch_heal=976` against a
maximum of 16278. Reading it closed them.

### `injure` — decoded

Damage, applied where it appears — same shape and slot again. A **different key**
from `+injure`, which is not damage; this file previously described `injure`
using `+injure`'s evidence, and the split is what let the two be measured apart.

*Health:* moves health

*Evidence:* it could not be settled at all until `heal` and `poison` were read,
because every call containing it also contains one of those and the witness
declined them all. Once they were read, the residue was exact: after
`-10000249=99.95;0;injure=148` the stated percentage sat 148 below the
arithmetic, and reading it as damage turned that disagreement, and eighty-odd
others, into agreements.

---

## Families the decoder reads by shape

### `?dmg*` — decoded

Damage. The client has no case labels for these: its default branch matches a
key whose characters 1–3 are `dmg`, treats `+` as dealt and anything else as
taken, and calls everything outside that an unknown parameter. We mirror the
rule rather than listing the family, so a kind the game has never sent still
decodes.

*Health:* moves health

Accounted for — this is the figure the witness's arithmetic is built on. `?dmg*`
is a shape rather than a key the protocol ever sends, so the entry never matches
a message of its own.

*Evidence:* the default branch of the battle switch, production build
`1785244275300`, identical in the development build. Which sign is the damage
that landed was measured rather than read: health drop matched the sum of
`-dmg*` in 22 of 26 comparisons and the sum of `+dmg*` in **none**.

---

## Keys that move health and are not read yet

Each of these makes its engine call uncomparable. They are the queue the decoder
works through next, and until it does, the witness declines to judge the calls
they appear in rather than reporting our ignorance as the game's error.

### `heal_target` — investigated

Healing directed at the message target, unlike `heal`, which lands on the actor.

*Health:* moves health

*Evidence:* one attributable disagreement, and a large one — the target's stated
percentage sits far above the arithmetic on a message carrying `heal_target`.

### `healall_per` — investigated

Healing by a percentage that reaches combatants the message **never names**. The
message names only the caster, on both sides.

This is the one that decided the witness's shape. Dropping only the combatants a
message names is not enough here, because the health moved somewhere else
entirely: in one call the caster's message named nobody but the caster, while a
combatant absent from it gained a fifth of their health, and the next comparison
against that combatant was out by more than twenty percentage points. A key like
this costs the whole call, not two combatants.

*Health:* moves health

*Evidence:* attributable disagreements on its own messages, the first out by the
percentage the key itself states.

---

## Keys looked into and deliberately not read yet

### `+injure` — investigated

Not damage applied at the moment it appears. Left unread rather than guessed at.

*Evidence:* measured twice on the group fight. In call 61 the target's health
fell by exactly the attack plus `+oth_dmg`, with `+injure=179` present and
contributing nothing; in call 23 the same, with `+injure=78`. Whatever it does,
it does not move health then and there.

---

## Investigated and found not to be battle keys

### `attack` — not a battle key

### `attack2` — not a battle key

Neither belongs to the switch that reads battle messages. They come from a
different switch in the same client module.

*Evidence:* they appeared in the first key list because it was gathered by
grepping the whole module, which holds three switches. Bounding each switch by
brace balance removed them, and they are absent from the production battle
switch entirely. Recorded so nobody spends a second afternoon on them.
