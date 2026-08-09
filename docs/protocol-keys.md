# Protocol keys — what has been looked into

What we know about individual keys, and how we came to know it. Read this before
investigating a key: some are already settled, and some were investigated and
deliberately left alone.

Each entry carries a **verdict** and its **evidence** — a measurement over the
captured fights, a citation from the game client with the build it was read on,
or the game's published help with the date it was read (`bun tools/help-article.ts`).
A verdict without evidence is a guess someone will later mistake for a fact.

The help is the only source that says what an effect *does*, so it is the only
one that can settle a *meaning*. It settles nothing else: the `*Health:*` line
below is a measurement or it is absent, and no sentence of the game's is copied
in here — an entry carries the locator and our own words.

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

### `heal_target` — decoded

Healing directed at the message **target**, which is what separates it from
`heal`: same figure, same sign, the other slot. The only key of this family that
does not put its subject in the actor slot, and the reason the decoder carries a
slot per key rather than assuming one.

*Health:* moves health

*Evidence:* reading it on the target closed every comparison in the calls that
carry it, first try and with no adjustment. Read on the actor instead, the same
calls disagree.

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

## What an attack reports besides its figures

Seven keys ride the message that carries a blow and add something to it that is
not the damage: what a defence stopped, what the blow destroyed, what fired
alongside it. The client spells each out as its own case rather than matching a
family by shape, and every one of those branches does the same single thing —
appends to a slot of the message's log array and assigns nothing.

**Which combatant each figure belongs to comes from the help, not from the
sign.** The client's log slots do not separate attacker from defender — the same
slot receives the fight's winner and its unknown-parameter notice — so nothing in
the bundle answers this. The help does, and it answers against the sign twice
over: `-absorb` reduces damage the defender is taking, and `+acdmg` reduces a
statistic of the *attacked* combatant. Both figures are the target's, and the two
carry opposite signs.

**None of them states a health figure, and none carries a `*Health:*` line
saying so** — the register has no spelling for that, deliberately, and does not
need one here. Reading a key is a stronger claim than describing it: these are
now in the witness's arithmetic, which applies none of them, so if any did move
health `tests/health-witness.test.ts` would disagree on the calls carrying it.
The verdict is held by the same guard that holds the damage figures.

Measured across both captures: all 256 occurrences arrive on a message that also
carries damage and names a combatant on both sides.

### `-absorb` — decoded

Damage physical absorption stopped before it reached the target.

*Evidence:* the game's published help, article view,372, at the engine name
`absorb` (read 2026-08-09), describes it as a reduction of the physical damage a
character is taking at that moment, capped at a share of the blow and drawn from
a pool that runs out — which is why the figure is sometimes far below that cap.
Production build `1785244275300`: the branch appends to a log slot and assigns
nothing. 45 occurrences, every one with a value that reads as an integer.

### `-absorbm` — decoded

The same for magical absorption, which the help documents against fire, cold and
lightning rather than physical damage, with a higher cap.

*Evidence:* article view,372 at the engine name `absorbm` (read 2026-08-09), and
the same branch shape in production build `1785244275300`. 27 occurrences.

### `-blok` — decoded

Damage a block stopped. The help ties the event to defending and to carrying a
shield, so unlike the two above it can be absent from a combatant entirely.

*Evidence:* article view,372 at the engine name `blok` (read 2026-08-09), and
production build `1785244275300`, where the branch has the same shape as the
absorption pair. 9 occurrences — the rarest of the seven, and the reason it is
grouped with them rather than measured alone.

### `+crit` — decoded

A critical hit fired on this blow. **Carries no figure at all**: the protocol
states the key and stops, and the client's branch composes its sentence without
reading a value.

*Evidence:* article view,372 at the engine name `crit` (read 2026-08-09) lists
it among the events an attack can produce. Production build `1785244275300`:
this branch is one of the two in the family that interpolates nothing. All 52
occurrences arrive with no value, which is why a value would make it unread
again rather than a flag with a number dropped beside it.

### `+pierce` — decoded

Armour piercing fired on this blow — the help states that within such a blow the
target's armour does not reduce the damage. No figure, like `+crit`.

*Evidence:* article view,372 at the engine name `pierce` (read 2026-08-09), and
production build `1785244275300`. All 21 occurrences arrive with no value.

### `+acdmg` — decoded

Armour of the target destroyed by this blow, in points. **Not damage**, and the
distinction is not pedantic: the help describes it as lowering a statistic
before the blow's reduction is computed, with a floor below which it cannot go.
Summed together with `dealt` it would be a total of two different things.

*Evidence:* article view,372 at the engine name `acdmg` (read 2026-08-09), which
is also what puts the figure on the target: the key carries `+`, and the help
still describes it as lowering the *attacked* combatant's armour. Production
build `1785244275300`: the branch interpolates the value into a log slot and
assigns nothing. 41 occurrences. The shape rule for damage does not reach it —
characters 1 to 3 are `acd`, not `dmg` — so nothing was reading it as a figure
before.

### `+resdmg` — decoded

Elemental resistance of the target destroyed by this blow, which the help states
in **percentage points** rather than in the points `+acdmg` uses. The two are
kept in one shape here because the protocol gives no unit either way; what the
figure means is the entry's job, not the type's.

*Evidence:* article view,372 at the engine name `resdmg` (read 2026-08-09), and
production build `1785244275300`. 61 occurrences — the most frequent of the
seven.

---

## Keys that move health and are not read yet

Each of these makes its engine call uncomparable. They are the queue the decoder
works through next, and until it does, the witness declines to judge the calls
they appear in rather than reporting our ignorance as the game's error.

### `healall_per` — investigated

Healing by a percentage of **maximum** health, reaching every combatant on the
caster's side and nobody on the other, clamped at full. The message names only
the caster, in both slots.

This is the one that decided the witness's shape. Dropping only the combatants a
message names is not enough here, because the health moved somewhere the message
never mentions, and the next comparison against such a combatant was out by more
than twenty percentage points. A key like this costs the whole call.

**Not read, and not for want of understanding it.** The rule above is exact, but
applying it needs to know who is on the caster's side, and *the protocol message
does not say*. A roster would answer it; there is no roster yet, and the team
numbers in the captured dumps are material this decoder never sees at run time.
Guessing the side would be inventing data (§5), so the calls stay uncomparable
until the roster exists.

*Health:* moves health

*Evidence:* one call carries a single `healall_per=30` message and nothing else.
Every combatant on the caster's side gained exactly 30.00% of their own maximum;
two of them landed on their maximum and gained less, which is where the clamp
comes from. The opposing combatant gained nothing — an earlier reading that
healed everyone present made agreement worse rather than better, which is how
the side restriction was found.

---

## Keys looked into and deliberately not read yet

### `+injure` — investigated

The deep wound an attack has just applied, announced inside that attack's own
message. It moves no health where it appears: the wound arrives on later calls
as its own `injure` message, which is the entry above.

**It stays unread for that reason, and not for want of understanding it.**
Counting the announcement as damage would add the same wound twice — once where
it is announced, and again on every tick.

Two properties, both re-earned on every run by `tests/injure-rule.test.ts`: the
amount is `floor(0.15 × the damage that message reports taken)`, and a fresh
application **replaces** the wound already running rather than adding to it, so
a smaller value supersedes a larger one.

*Evidence:* the game's published help, article view,372, at the engine name
`injure` (read 2026-08-09), states the rule in its own words — an event applying
deep-wound damage over time worth 15% of the damage dealt, over three turns, not
cumulative, overwritten by the freshest application. Checked against the group
fight, which carries nine applications: the floor of that share reproduces all
nine announced figures, among them 1638 taken → 245 announced and 658 → 98,
where rounding instead of flooring would miss the second. Seven of the nine are
followed by exactly three ticks of their own amount; the two that are not are
the ones the material cuts short — call 82 announces 178, one tick follows, and
call 91 replaces it with the smaller 157, which is the overwrite showing itself;
the last application lands with the target at 0.94% and the fight ends.

An earlier reading of this entry had only the negative half of it, measured on
two calls: health fell by exactly the attack, `+injure` contributing nothing.
That was true and stopped there, because nothing in the protocol says what the
key is *for*. The documentation is what supplied the rule; the captures are what
confirmed it.

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
