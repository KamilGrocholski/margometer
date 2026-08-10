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
of the decoder or fall behind it, and it cannot fall behind the captures either —
a key the material carries with no entry here fails the gate. What it deliberately
does **not** hold is any count of progress — run `bun tools/decoding-status.ts`
for that.

## What every entry states about its own material

Prose is where a claim goes to stop being checked. So the part of an entry a
machine can re-earn is written on one line, in a vocabulary this file defines:

```
*Shape:* 26 occurrences; on a skill announcement; a whole number
```

Three claims, all re-measured on every run, and all of them about **every**
occurrence of the key rather than the usual one:

- **how many** the captures carry;
- **where** they sit — `alone in its message`, `on a skill announcement`,
  `on a blow`, or `on a message reporting damage`. One phrase has to hold for
  all of them, so where two would fit, the weaker is the true one;
- **what the key states beside itself** — `no value`, `a whole number`,
  `a number`, or `text`, read through the primitives in `libs/`, not by eye.

A phrase outside those lists is **refused** rather than read as silence, the way
a misspelled health verdict is. An entry may omit the line only for a key the
captures do not carry; every other omission fails.

This is deliberately not the whole of an entry. What a key *means* still lives in
the prose and rests on the help and the client — no line of vocabulary is going
to check that. What it stops is the other half: a count or a placement that was
true when someone typed it and has been quietly wrong since.

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

*Shape:* 2 occurrences; alone in its message; text

*Evidence:* every occurrence in both captured fights has that shape, and both
fights end with exactly one `winner` and one `loser`.

### `loser` — decoded

The same, for the losing side.

*Shape:* 2 occurrences; alone in its message; text

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

*Shape:* 71 occurrences; on a message reporting damage; text

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

*Shape:* 97 occurrences; alone in its message; text

*Evidence:* of the four ways to sign `heal` and `poison`, only healing added and
poison subtracted closes the stated percentages — the other three leave hundreds
of comparisons disagreeing. Applying it moved the witness from declining every
call that contains it to agreeing on them.

### `poison` — decoded

Damage over time, same shape and same slot as `heal`, read as a negative health
change. **Unattributed by construction:** the protocol does not say who applied
it, so nothing downstream may credit it to anyone (§5).

*Health:* moves health

*Shape:* 46 occurrences; alone in its message; text

*Evidence:* as above. Before it was read, the first disagreement it caused was
`-10000249=76.05;0;poison=563`.

### `heal_target` — decoded

Healing directed at the message **target**, which is what separates it from
`heal`: same figure, same sign, the other slot. The only key of this family that
does not put its subject in the actor slot, and the reason the decoder carries a
slot per key rather than assuming one.

*Health:* moves health

*Shape:* 9 occurrences; on a skill announcement; a whole number

*Evidence:* reading it on the target closed every comparison in the calls that
carry it, first try and with no adjustment. Read on the actor instead, the same
calls disagree.

### `legbon_holytouch_heal` — decoded

Healing, same shape and slot as `heal`, from a legendary bonus rather than a
spell. Read identically; nothing about it needed a separate rule.

*Health:* moves health

*Shape:* 3 occurrences; alone in its message; a whole number

*Evidence:* found by the witness rather than looked for. With `heal`, `poison`
and `injure` read, three comparisons still disagreed, all for one combatant and
all by the same six percentage points — `legbon_holytouch_heal=976` against a
maximum of 16278. Reading it closed them.

### `injure` — decoded

Damage, applied where it appears — same shape and slot again. A **different key**
from `+injure`, which is not damage; this file previously described `injure`
using `+injure`'s evidence, and the split is what let the two be measured apart.

*Health:* moves health

*Shape:* 22 occurrences; alone in its message; a whole number

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

Seventeen keys ride the message that carries a blow and add something to it
that is not the damage: what a defence stopped, what the blow destroyed, what
fired alongside it. The client names each rather than matching a family by shape —
mostly one case per key, though the absorption pair shares one with a key that
is not ours — and every one of those branches does the same single thing:
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

Measured across both captures: all 319 occurrences arrive on a message that also
carries damage and names a combatant on both sides.

### `-absorb` — decoded

Damage physical absorption stopped before it reached the target.

*Shape:* 45 occurrences; on a blow; a whole number

*Evidence:* the game's published help, article view,372, at the engine name
`absorb` (read 2026-08-09), describes it as a reduction of the physical damage a
character is taking at that moment, capped at a share of the blow and drawn from
a pool that runs out — which is why the figure is sometimes far below that cap.
Production build `1785244275300`: the branch appends to a log slot and assigns
nothing. 45 occurrences, every one with a value that reads as an integer.

### `-absorbm` — decoded

The same for magical absorption, which the help documents against fire, cold and
lightning rather than physical damage, with a higher cap.

*Shape:* 27 occurrences; on a blow; a whole number

*Evidence:* article view,372 at the engine name `absorbm` (read 2026-08-09), and
the same branch shape in production build `1785244275300`. 27 occurrences.

### `-blok` — decoded

Damage a block stopped. The help ties the event to defending and to carrying a
shield, so unlike the two above it can be absent from a combatant entirely.

*Shape:* 9 occurrences; on a blow; a whole number

*Evidence:* article view,372 at the engine name `blok` (read 2026-08-09), and
production build `1785244275300`, where the branch has the same shape as the
absorption pair. 9 occurrences — the rarest of the seven, and the reason it is
grouped with them rather than measured alone.

### `+crit` — decoded

A critical hit fired on this blow. **Carries no figure at all**: the protocol
states the key and stops, and the client's branch composes its sentence without
reading a value.

*Shape:* 52 occurrences; on a blow; no value

*Evidence:* article view,372 at the engine name `crit` (read 2026-08-09) lists
it among the events an attack can produce. Production build `1785244275300`:
this branch is one of the two in the family that interpolates nothing. All 52
occurrences arrive with no value, which is why a value would make it unread
again rather than a flag with a number dropped beside it.

### `+pierce` — decoded

Armour piercing fired on this blow — the help states that within such a blow the
target's armour does not reduce the damage. No figure, like `+crit`.

*Shape:* 21 occurrences; on a blow; no value

*Evidence:* article view,372 at the engine name `pierce` (read 2026-08-09), and
production build `1785244275300`. All 21 occurrences arrive with no value.

#### The rest of the flag family

Eight more keys are read the same way, and they are grouped because the evidence
is one measurement rather than eight. Each states a fact about the blow and no
figure; together with the two above, **all 100 occurrences in the captures arrive
without a value, on a message that also carries damage and names a combatant on
both sides**. `tests/proc-rule.test.ts` re-earns that by decoding the material
and checking what actually landed, rather than by reading the decoder's list.

**Membership is the client's to decide, not the name's.** For each of the eight,
production build `1785244275300` composes a sentence that interpolates nothing —
which is the same test the two above passed, and the one `+legbon_holytouch`
fails despite looking identical in our material (its own entry, below).

⚠️ None of the eight is documented in the game's published help. Article
view,372 (read 2026-08-09) was searched for `legbon`, `tenacity`,
`acdmg_destroyed` and `dispel`, and answers to none of them; `stun` and `freeze`
it does document, as events an attack can produce. The help describes mechanics,
and a legendary bonus is equipment — so the silence is expected rather than
suspicious, but it is recorded because *not found* and *not documented* are
different claims.

### `+stun` — decoded

The target's turn was blocked by this blow. The help documents the event, and
notes it also appears under several other display names — which is why the key,
not the sentence, is what identifies it.

*Shape:* 9 occurrences; on a blow; no value

*Evidence:* article view,372 at the engine name `stun` (read 2026-08-09), the
shared measurement above, and production build `1785244275300`. 9 occurrences.

### `+freeze` — decoded

The same stun, from the effect the help documents separately as its own passive:
a chance to freeze, which blocks the target's turn.

*Shape:* 3 occurrences; on a blow; no value

*Evidence:* article view,372 at the engine name `freeze` (read 2026-08-09), and
the shared measurement. 3 occurrences.

### `+legbon_verycrit` — decoded

A legendary bonus fired on this blow: a very critical hit, which the help names
among the events but does not tie to this key.

*Shape:* 3 occurrences; on a blow; no value

*Evidence:* the shared measurement, and production build `1785244275300`. 3
occurrences. Not in the help — see the notice above.

### `+legbon_curse` — decoded

A legendary bonus fired on this blow, cursing the target.

*Shape:* 1 occurrences; on a blow; no value

*Evidence:* the shared measurement. 1 occurrence, which is why nothing here says
more than that it fired.

### `-legbon_cleanse` — decoded

A legendary bonus fired on the blow, cleansing an effect. Carries `-`, and like
every sign in this family that settles nothing about whose it is — see the note
opening this section.

*Shape:* 5 occurrences; on a blow; no value

*Evidence:* the shared measurement. 5 occurrences.

### `-tenacity` — decoded

Tenacity fired on this blow. What it does is not established here: the help does
not document the name, and the protocol states nothing but that it happened.

*Shape:* 1 occurrences; on a blow; no value

*Evidence:* the shared measurement. 1 occurrence.

### `+superspell-dispel` — decoded

A dispel fired alongside the blow. The client renders it through a sentence
named for `dispel` rather than for the key — one of the few places where the two
differ, and a reason not to identify a key by the sentence it produces.

*Shape:* 3 occurrences; on a blow; no value

*Evidence:* the shared measurement, and production build `1785244275300`, where
the branch reads `msg_+dispel`. 3 occurrences.

### `+acdmg_destroyed` — decoded

The target's armour was destroyed outright by this blow — the floor `+acdmg`
counts down to. **Not a figure**, unlike `+acdmg`: this key states that the
armour is gone and no amount.

*Shape:* 2 occurrences; on a blow; no value

*Evidence:* the shared measurement. 2 occurrences, both on a message that also
carries `+acdmg`.

### `+acdmg` — decoded

Armour of the target destroyed by this blow, in points. **Not damage**, and the
distinction is not pedantic: the help describes it as lowering a statistic
before the blow's reduction is computed, with a floor below which it cannot go.
Summed together with `dealt` it would be a total of two different things.

*Shape:* 41 occurrences; on a blow; a whole number

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

*Shape:* 61 occurrences; on a blow; a whole number

*Evidence:* article view,372 at the engine name `resdmg` (read 2026-08-09), and
production build `1785244275300`. 61 occurrences — the most frequent of the
nine.

### `+abdest_per` — decoded

Absorption of the target destroyed by this blow, **in points** — despite the
name. The `_per` belongs to the share the skill announces, not to what this
reports: the figure is the quantity that share removed.

*Shape:* 18 occurrences; on a blow; a whole number

### `+abmdest_per` — decoded

The same for magical absorption. The two always arrive together and are read
identically; nothing separates them but which pool they empty.

*Shape:* 18 occurrences; on a blow; a whole number

*Evidence:* both entries, measured on the group fight, the only capture carrying
them. 18 occurrences each, every one on a blow, never apart from the other, and
values from 6017 down to 0 — which is what rules out a percentage and is why the
suffix is not trusted. The help documents the *effect* rather than these keys, at
the engine name `active_absorbdest_per` (read 2026-08-09): a passive destroying a
share of the opponent's current absorption and magical absorption, applied before
the attack is reduced by any form of damage reduction, and unable to take
absorption below zero. That floor is visible here — `+abmdest_per` reaches 0 and
the protocol still reports it rather than falling silent.

The share the help describes is stated in the fight itself, as
`active_absorbdest_per=5` (its own entry below), and the reports agree with it:
against the single target that carries them, each report is smaller than the one
before by at least that 5%, the closest being 6017 → 5717. Both directions are
held by `tests/absorption-destruction-rule.test.ts`. What is **not** established
is the absorption pool itself — the captures record health and nothing else, so
the share can be checked against consecutive reports but never against the
quantity it was taken from.

Production build `1785244275300` gives both keys one shared case, alongside
`active_resall_per`, which appends the value to a log slot and assigns nothing;
the readable development build `1781609507010` has the same shape. All 18 calls
carrying them are judged by `tests/health-witness.test.ts` and agree, which is
what places them outside the health arithmetic.

---

## The announcement that comes before the blow

### `tspell` — decoded

The skill a combatant used, by name. The announcement carries no key of the
**damage family** — measured, none of the 197 in the captures does — but that is
narrower than it sounds, and an earlier version of this entry said "no damage at
all" and was wrong.

**Damage aimed at a name rides the announcement itself.** 33 of the 197 carry
either `+oth_dmg` or a key the register says moves health, in the same message as
the skill name, never both at once. So the protocol does sometimes put a skill
and a figure together; what it still does not state is that the figure is the
skill's doing. Tying them remains an inference, and the decoder does not attempt
one — it emits the announcement and the figure as separate events from the same
message. Guarded, in both directions, by `tests/skill-announcement-rule.test.ts`.

The value is the name the player's own client displays. It is read at run time
and shown, never stored here — the same footing as the sentences the client
composes from keys, and for the same reason (NOTICE.md). No example of one
appears in this file or in any test.

*Shape:* 197 occurrences; on a skill announcement; text

*Evidence:* production build `1785244275300`, where the branch composes a
sentence naming the combatant in the actor slot and the value, and sets the
attack animation. Measured on the captures: an actor in every one of the 197,
the same combatant in both slots in 44, and no target at all in 15. The game's
published help documents neither this key nor `skillId` — article view,372 (read
2026-08-09), searched for `tspell`, `( tspell )`, `skillId` and `( skillId )`,
none of which occurs. That is expected rather than surprising: the help
describes mechanics, and these two are how a message is assembled.

### `skillId` — decoded

The game's own identifier for that skill, attached to the same announcement.
Read as part of it rather than on its own: an id with no name is a skill nothing
can put on screen.

**The client does nothing with it.** Its branch in the battle switch is an empty
`break` — the key is listed only so it does not fall through to the
unknown-parameter notice, which is what makes it a pass-through identifier
rather than something the log is composed from.

*Shape:* 182 occurrences; on a skill announcement; a whole number

*Evidence:* production build `1785244275300` for the empty branch. Measured on
the captures: present on 182 of the 197 announcements, absent from 15, and never
once on a message that does not also carry `tspell`. That last figure is why a
lone id is reported unread instead of decoded — the protocol has not yet shown
one, so reading it would be describing a message we have never seen.

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

*Shape:* 12 occurrences; on a skill announcement; a number

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

*Shape:* 9 occurrences; on a blow; a whole number

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

### `-poison_lowdmg_per` — investigated

The share by which a blow was weakened because the combatant dealing it was
poisoned, reported inside that blow's own message. A **percentage, not points**,
and unlike the three defences it is not a figure that was subtracted from
anything we can see: the damage keys beside it already have it applied.

**It stays unread for that reason, and not for want of understanding it.** There
is no slot it could fill honestly. `prevented` holds points a defence stopped and
would total a percentage with them; the flag family holds keys that carry no
figure at all, and this one always carries one. Reading it anywhere would either
double a reduction that already happened or invent a unit.

Two properties re-earned on every run by `tests/poison-reduction-rule.test.ts`:
it arrives **once per combatant the message reports damage against** — not once
per damage element — and it always carries a figure. A third test holds the
entry to making no health claim, because the moment it does, the witness skips
every call carrying it and the paragraph below stops being checked by anything.

No health line, which is the register making no claim rather than an omission:
what the captures settle is that the damage reported beside it needs no
adjustment, and that is a different statement from the key moving health itself.

*Shape:* 68 occurrences; on a message reporting damage; a whole number

*Evidence:* the game's published help, article view,372, at the engine name
`poison_lowdmg_per-enemies` (read 2026-08-09) — the form the help documents,
which is the aura that grants the effect rather than the per-blow report —
describes a passive reducing an opponent's attack and non-periodic damage while
that opponent carries poison from any source, states the variable as the share
reduced, and says outright that what the fight log shows is already lowered by
it. Production build `1785244275300` carries `-poison_lowdmg_per` as its own case
in the battle switch, appending to a log slot and assigning nothing, next to the
`poison_lowdmg_per-enemies` case; the readable development build `1781609507010`
is where the pair was found. Both keys are in the frozen table.

Measured on the group fight, the only capture carrying either: 68 occurrences
across 26 messages, every value `10`, and the aura declared once — in a message
naming a single combatant in the actor slot, carrying no damage, with the same
value `10`, which is what joins the log report to the documented effect. All 26
messages report damage, and in all 26 the number of occurrences equals the number
of combatants damaged. Counting damage **elements** instead holds for only 19 of
the 26: seven blows carry two elements and still report one reduction, which is
what rules that reading out. 16 of the 23 calls carrying the key are judged by
`tests/health-witness.test.ts` — the other 7 are skipped over unrelated keys —
and they agree, which is the measurement behind "already net". Nothing here
establishes what the blow would have been without it: the protocol reports the
reduced figure and never the raw one, so the amount removed is not recoverable.

### `active_absorbdest_per` — investigated

The share of current absorption a skill destroys, stated **on the announcement of
that skill** rather than on any blow. The two keys above are what the share then
removes, and they arrive in later messages.

**It stays unread because the protocol never joins the two.** A skill
announcement carries no damage and no target statistic — measured, every one of
its 43 occurrences rides a message whose only other keys are `tspell` and
`skillId`. Attaching the share to the blows that follow is exactly the inference
§5 forbids: the reports already state what was destroyed, so nothing is lost by
declining it, and crediting a later blow to this announcement would be a join we
invented.

The client hides it too: production build `1785244275300` gives it an empty
`break` in the battle switch, next to `balloflight` and `active_decblock_per`,
which the readable development build `1781609507010` marks as hidden. Like
`skillId`, the branch exists so the key does not fall through to the
unknown-parameter notice — the client knows it and deliberately shows nothing.

⚠️ The same name also appears in a **second switch** in the same module, the one
composing skill descriptions. That switch is not about battle messages, and the
frozen table is bounded by brace balance so it holds only the battle one — the
trap §7.5 records, met again here.

*Shape:* 43 occurrences; on a skill announcement; a whole number

*Evidence:* the help, article view,372, at that engine name (read 2026-08-09) —
the description quoted under `+abdest_per` above. Measured on the group fight,
the only capture carrying it: 43 occurrences, every value `5`, every one on a
skill announcement. Held by `tests/absorption-destruction-rule.test.ts`, which
also refuses a second distinct value — the entry's claim is that the fight
declares one share, not that the key is a constant.

### `combo-max` — investigated

How many accumulated combination points the announced skill will spend. A
**count, not a quantity** — the captures state 1, 2 and 3 — and like the share
above it qualifies the skill rather than reporting anything that happened.

**It stays unread because it describes an input, not an outcome.** Whatever the
points are then worth arrives as ordinary figures in the message or in later
ones, already computed; reading the cap would add a number that measures nothing
that was done to anybody.

*Shape:* 31 occurrences; on a skill announcement; a whole number

*Evidence:* the help never documents the key on its own — article view,372 (read
2026-08-09) mentions it only inside six other effects, each saying it spends
accumulated combination points up to the number this parameter sets, which is
where the reading comes from. Measured on the group fight, the only capture
carrying it: 31 occurrences, values `1` (15), `2` (15) and `3` (1), and **every
one on a skill announcement** — none anywhere else. Held by
`tests/skill-announcement-rule.test.ts`, which also refuses a figure in the range
the protocol's quantities occupy, so a cap and a count of points cannot be
confused with one.

### `+engback` — investigated

Energy returned to the attacker by this blow. Rides the blow, states a whole
number, and — measured — **never arrives without `+crit`**: all 13 occurrences
sit on a critical hit.

**Unread because it is not a figure about anybody's health**, and the panel has
no place for a resource yet. Reading it would mean a slot meaning "energy", with
one consumer and nothing to compare it against.

*Shape:* 13 occurrences; on a blow; a whole number

*Evidence:* article view,372 (read 2026-08-09) names `engback` among the effects
that restore energy, without documenting the protocol key. 13 occurrences, every
one on a blow beside `+crit`.

### `+critslow_per` — investigated

An attack-speed reduction applied by a critical hit. States a whole number; all
7 occurrences ride a blow carrying `+crit`.

*Shape:* 7 occurrences; on a blow; a whole number

*Evidence:* article view,372 (read 2026-08-09) lists `critslow_per` among the
effects that combine additively to change attack speed. Not read for the same
reason as `+engback`: attack speed is not health, and nothing downstream
consumes it.

### `+critpoison_per` — investigated

Healing or poison tied to a critical hit — the help lists it among the effects
whose sum is capped, in the passage about healing. Both occurrences ride a blow
with `+crit`.

**Unread, and this one is a candidate to revisit**: the help places it near
healing, and healing does move health. Two occurrences are too few to settle
which side it lands on, and guessing would put a figure on the wrong combatant.

*Shape:* 2 occurrences; on a blow; a whole number

*Evidence:* article view,372 (read 2026-08-09) at the engine name
`critpoison_per`. 2 occurrences, both beside `+crit`.

### `-legbon_facade` — investigated

A legendary bonus riding the blow, stating a whole number. Nothing establishes
what the number counts.

*Shape:* 2 occurrences; on a blow; a whole number

*Evidence:* not documented — article view,372 (read 2026-08-09) was searched for
`legbon_facade` and `legbon`, neither of which occurs. 2 occurrences, values 13
and 20, on blows that carry damage. Left unread rather than guessed at.

### `+legbon_holytouch` — investigated

**The key that looks like a flag and is not.** In the captures it arrives with no
value, exactly as `+crit` does — but production build `1785244275300` composes
its sentence with a `%val%` hole, so the client expects a figure this occurrence
does not carry.

That disagreement is the entry. Reading it as a flag would settle from one
message what the game settles, and the figure would vanish the first time one
arrived. It stays unread, and `tests/proc-rule.test.ts` holds it out of the flag
family on purpose rather than by omission.

A **different key** from `legbon_holytouch_heal`, which is decoded and does move
health — the same split as `injure` and `+injure`.

*Shape:* 1 occurrences; on a blow; no value

*Evidence:* production build `1785244275300` against 1 occurrence in the group
fight. Not in the help: article view,372 (read 2026-08-09), searched for
`legbon_holytouch` and `legbon`.

### `poison_lowdmg_per-enemies` — investigated

The aura that grants the reduction `-poison_lowdmg_per` reports, declared once
per fight rather than per blow. Described in full in that entry above; it has a
heading of its own because it is a distinct key.

*Shape:* 1 occurrences; alone in its message; a whole number

*Evidence:* 1 occurrence in the group fight, naming a single combatant in the
actor slot, carrying no damage, stating the same value the 68 blow reports
carry. The help documents the effect under this name — article view,372 (read
2026-08-09).

---

## Keys the protocol states on a skill announcement

These qualify the skill being announced: what it costs, what it grants, whom it
affects. **None of them reports anything that happened to anybody**, which is
what they have in common and why none is read.

The pattern was settled twice already, by `active_absorbdest_per` and
`combo-max` above: the announcement states an input, and whatever it is then
worth arrives later as ordinary figures, already computed. Reading a declaration
would add numbers that measure no event, and attaching one to a later blow is
the join the protocol never states (§5).

They are also where a **contract change** would be needed rather than a decoder
change: the `skill-used` event carries a name and an id and has nowhere to put
an effect. That is `[ASK]` under §4, so it has not been made.

*Evidence, shared:* every occurrence of every key below rides a message carrying
`tspell`, and none rides a blow — measured across both captures. All appear only
in the group fight. Held by `tests/skill-announcement-rule.test.ts` for
`combo-max`; the rest rest on the measurement alone.

### `active_decblock_per` — investigated

A reduction of the target's chance to block, granted by the announced skill.

*Shape:* 26 occurrences; on a skill announcement; a whole number

*Evidence:* article view,372 (read 2026-08-09) names it among the effects that
lower block chance. 26 occurrences, values 1, 2, 4 and 11. The client hides the
key: production build `1785244275300` gives it an empty `break` in the battle
switch, beside `active_absorbdest_per`.

### `active_decblock_per-enemies` — investigated

The same reduction, aimed at the opposing side rather than at one target — the
`-enemies` suffix the protocol uses elsewhere for the same distinction.

*Shape:* 11 occurrences; on a skill announcement; a whole number

*Evidence:* article view,372 (read 2026-08-09), which lists it beside
`decblock_per` and `active_decblock_per`. 11 occurrences, every value `10`.

### `active_block_per` — investigated

An increase to the announcer's own chance to block.

*Shape:* 10 occurrences; on a skill announcement; a whole number

*Evidence:* article view,372 (read 2026-08-09) at the engine name
`active_block_per`, described as raising block chance and applied at the
initiation layer. 10 occurrences, every value `15`.

### `alllowdmg` — investigated

A reduction to the damage dealt by everyone on the opposing side.

*Shape:* 11 occurrences; on a skill announcement; a whole number

*Evidence:* article view,372 (read 2026-08-09) at the engine name `alllowdmg`,
described as lowering the damage of all characters in the opposing team by the
share the parameter sets. 11 occurrences, every value `5`.

### `allslow_per` — investigated

An attack-speed reduction applied across the opposing side.

*Shape:* 5 occurrences; on a skill announcement; a whole number

*Evidence:* article view,372 (read 2026-08-09), which lists it among the effects
combining additively to change attack speed. 5 occurrences, every value `14`.

### `aura-ac_per` — investigated

An aura raising armour, granted to the announcer's team.

*Shape:* 4 occurrences; on a skill announcement; a whole number

*Evidence:* article view,372 (read 2026-08-09), which lists it among the effects
that raise armour. 4 occurrences, every value `20`.

### `aura-resall` — investigated

An aura raising the team's resistances to fire, cold and lightning, in
percentage points.

*Shape:* 4 occurrences; on a skill announcement; a whole number

*Evidence:* article view,372 (read 2026-08-09) at the engine name `aura-resall`.
4 occurrences, every value `15`.

### `aura-sa_per` — investigated

An aura raising the team's attack speed.

*Shape:* 4 occurrences; on a skill announcement; a whole number

*Evidence:* article view,372 (read 2026-08-09), which lists it among the
attack-speed effects. 4 occurrences, every value `20`.

### `mana` — investigated

Mana the announced skill costs. **Signed, and negative in every occurrence** —
the protocol states the change, not the price as a positive number.

*Shape:* 15 occurrences; on a skill announcement; a whole number

*Evidence:* article view,372 (read 2026-08-09) documents mana as a resource some
skills consume. 15 occurrences, all negative, 10 of them beside `energy`.

### `energy` — investigated

Energy the announced skill costs, the same shape as `mana`. Every occurrence in
the captures states `0`, which is why nothing here claims it is ever otherwise.

*Shape:* 10 occurrences; on a skill announcement; a whole number

*Evidence:* article view,372 (read 2026-08-09) documents energy as a resource
some skills consume. 10 occurrences, every one beside `mana`.

### `shout` — investigated

A provocation: the announced skill forces those it covers to attack a named
combatant. The value is that combatant's **name**, so it is read at run time and
never stored here — the same footing as `tspell` (NOTICE.md).

*Shape:* 11 occurrences; on a skill announcement; text

*Evidence:* article view,372 (read 2026-08-09) at the engine name `shout`,
described as forcing covered characters to attack a chosen target. 11
occurrences, every one on an announcement that also carries
`active_decblock_per-enemies` and `alllowdmg`.

---

## Keys that are a message by themselves

Each of these is the **only key in its message** — measured, without exception.
They describe the fight's progress or the client's own display rather than
anything one combatant did to another, which is why none feeds a statistic.

### `step` — investigated

Carries **no value at all** and names one combatant in the actor slot with no
target. All 22 occurrences are a message holding nothing else, which is what a
turn boundary would look like — but the protocol does not say that, and this
entry does not either.

*Shape:* 22 occurrences; alone in its message; no value

*Evidence:* not documented. Article view,372 (read 2026-08-09) was searched for
`step`; the only hit is inside a longer Polish word, which is the false positive
§7.6 warns about rather than a mention. 22 occurrences, all valueless, all
alone, always with an actor and never a target.

### `prepare` — investigated

A skill being prepared rather than used, stated as `name(percent%)`. The name is
the client's display text, so no example of one appears here.

*Shape:* 13 occurrences; alone in its message; text

*Evidence:* not documented — article view,372 (read 2026-08-09), searched for
`prepare`, which does not occur. 13 occurrences, each the only key in its
message, every value matching that shape, always with an actor and no target.

### `txt` — investigated

Free text the client shows in the battle log. **Nothing of it is stored here**,
in this file or in any test: it carries the game's own sentences and player
names, which NOTICE.md keeps out of the repository entirely.

*Shape:* 13 occurrences; alone in its message; text

*Evidence:* not documented — article view,372 (read 2026-08-09), searched for
`txt`, which does not occur. 13 occurrences, each alone in its message, naming
no combatant at all.

### `+exp` — investigated

Experience awarded. Names no combatant and appears once in the whole material,
at the end of a fight.

**Unread because experience is not damage** and the panel counts what combatants
did to each other. Nothing about it is uncertain; it is simply out of scope.

*Shape:* 1 occurrences; alone in its message; a whole number

*Evidence:* 1 occurrence, an integer, alone in its message with neither side
named. Not documented as a protocol key in article view,372 (read 2026-08-09).

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
