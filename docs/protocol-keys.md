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

**Guarded** by `tests/core/protocol-key-register.test.ts`: this file cannot get
ahead of the decoder or fall behind it, and it cannot fall behind the captures
either — a key the material carries with no entry here fails the gate. What it
deliberately does **not** hold is any count of progress — run `bun
tools/decoding-status.ts` for that.

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

### And what it says about the published help

The same idea, applied to the one source that is somebody else's document and can
change without telling us:

```
*Help:* names `verycrit`
*Help:* names nothing of `tenacity`
```

**The line states an occurrence; the prose states what it means.** `names` claims
only that the article carries the phrase — whether it *documents* the key is a
paragraph a person has to read, and three entries here occur in the article
without being documented by it. Every phrase is re-counted against
`tests/frozen-help-phrases.ts`, which `bun tools/help-article.ts freeze` writes
from the cached dump. Counts only: the help's own sentences never enter this
repository, and a count is our measurement of the article rather than a piece of
it (NOTICE.md).

**An entry citing the help must carry the line.** Not every entry — a key nobody
has asked the help about says nothing, and silence is the honest answer there.

**A claim of silence must have tried the key's stem**, and this is the rule that
does the work. The help joins an article to a key through the engine name it
prints in parentheses, and for a compound key that name is routinely the tail
alone — `legbon_facade` is published as `facade`. So `names nothing of` has to
list the key without its sign, and the tail after the first separator.

Re-counting alone would not have caught anything. The entry that got
`+legbon_holytouch` wrong recorded the phrases it searched, exactly as §7.6 asks —
`legbon_holytouch` and `legbon` — and both count zero. A guard re-measuring only
what was listed would have agreed with the bug, which is the failure §7.5 names:
a guard that names the same wrong thing the code did.

The phrase is stated by a person and never derived. `( freeze )` counts zero where
bare `freeze` counts four, so a rule that parenthesised the engine name would
bless a false silence for a key this file cites the help for.

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
two must not share a spelling. `tests/core/health-witness.test.ts` reads this
line and skips any engine call carrying such a key, because a figure it cannot
add is a figure that makes every later comparison in that call wrong.

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

### And who the figure is charged to

A key that reports a health figure raises a second question the panel cannot
avoid answering: **who did it**. Every entry stating `*Health:* moves health`
answers it on one line, from a closed list:

```
*Cause:* the subject's own
```

| `*Cause:*` | means | held against |
|---|---|---|
| `the subject's own` | the published help says the effect belongs to the combatant it moved health on, so the two ends are one person (§9.6) | `SELF_SOURCED_HEALING_KEYS` |
| `the announcement's actor` | the figure sits on the message **target** and a skill announcement over it names the giver | `HEALTH_CHANGE_KEYS`, the entries reading the target slot |
| `the message actor` | the protocol states the cause in the actor slot of the message itself | `SIDE_SHARE_HEALTH_KEYS`, and the attack family |
| `nobody` | the protocol states no cause, and nothing else supplies one | the rest of `HEALTH_CHANGE_KEYS` |

**Required exactly where `*Health:*` is, and refused everywhere else.** A key that
reports no health figure charges nobody with anything, so a line on it would be a
claim with no consumer — §7.1's rule applied to a document.

`tests/core/protocol-key-register.test.ts` re-earns every token from
`src/core/fight-decoder.ts` **in both directions**, so a key cannot be listed as
the subject's own here and read some other way there, nor read that way and left
saying `nobody`. A phrase outside the list is **refused** rather than read as
silence, for the reason the health line gives: it would look more settled than
silence while checking nothing.

⚠️ **`the subject's own` is the one token backed by a citation rather than by a
measurement**, and the three keys carrying it say where the citation is in their
own `*Evidence:*`. It is `[ASK]` to give it to a fourth key (§9.6).

⚠️ **Two keys can be written identically and answer differently.** `heal` and
`poison` arrive in the same shape — the subject in the actor slot, a literal `0`
at the other end — and this line is where they part: the help documents one of
them as the Character's own effect and says nothing about who applied the other.
That is a reading of the documentation, not of the message, which is exactly why
it is written down per key instead of derived from the grammar.

---

## Keys the decoder reads

### `winner` — decoded

The combatants on the winning side, as a single string, names separated by a
comma and a space. Appears in a message that names no combatant at all: it is
about the fight, not about anyone in it.

**One value is not a name.** Where the fight ended with nobody winning it, this
key carries `?` in place of the names, and there is no key of the protocol's for
saying so — which is why it is filed here and not under an entry of its own. The
client branches on that value alone, composing its no-winner line and a
turn-limit notice instead of naming anybody; its `loser` case has no such branch,
so the sentinel belongs to this key. `src/core/fight-decoder.ts` reads it as the `drawn`
outcome, naming nobody, and leaves `loser=?` unread rather than filing a side
called `?`.

The help settles what puts a fight there, under the name `max_moves`: a cap of 75
turns per player, at which the fight is stopped. Nothing here counts turns
(§10) — the cap is cited for the meaning of the value, not as a figure to
reproduce.

The captures settle nothing about it: no recording carries the value, every
capture in `tests/captured-fights/` as of 2026-08-18 ending with a winner named.
So this is a claim of the client's and the help's, and the first recording of a
fight nobody wins is what would measure it.

*Shape:* 17 occurrences; alone in its message; text

*Help:* names `max_moves`

*Evidence:* every occurrence in every captured fight has that shape, and each
fight ends with exactly one `winner` and one `loser`. For `?`: production build
`1786514810315`, the same branch in development build `1781609507010`, and the
published help view,372 (read 2026-08-18) for the cap that produces it.

### `loser` — decoded

The same, for the losing side — with the one exception the entry above states:
the `?` that key spends on a fight nobody won is not a value this one carries,
and it is left unread here rather than read as a side of that name.

*Shape:* 17 occurrences; alone in its message; text

### `+oth_dmg` — decoded

Damage that landed on a combatant the protocol names **by name**, alongside an
attack aimed at someone else. Value is `amount,kind,name(percent%)`; the
percentage belongs to the named combatant, not to the message target. The damage
has already been reduced — unlike `+dmg`/`-dmg` there is no second figure.

*Health:* moves health

*Cause:* the message actor

Accounted for rather than skipped: the witness resolves the name against the
combatants the engine call started with and subtracts the figure there. A name
matching none of them, or more than one, makes the call uncomparable instead —
the boar fight fields two combatants called the same thing, so a unique match is
a condition, not a formality.

⚠️ **The middle member can be blank, and blank is the plain element.** 66 of the
occurrences write it as a single space. The client spends that member on one
thing — `<b class=dmg"+D[1]+">`, production build `1785244275300` — and a class
attribute of `"dmg "` is the class `dmg`, so the game makes no distinction
there. Read literally it made `dmg ` a second element beside `dmg`, splitting
107 952 points of physical damage into two rows nothing on screen could tell
apart. Held by `tests/core/fight-decoder.test.ts`.

*Shape:* 661 occurrences; on a message reporting damage; text

*Evidence:* in every call where a target lost more health than the attack
accounted for, the shortfall equalled this amount exactly — 110, 247 and 123 in
three separate calls. Three independent confirmations on real material, which is
why this is not read off the client's sentence template.

### `legbon_lastheal` — decoded

Healing stated **by name**, the mirror of `+oth_dmg` and the only key that
restores health to somebody neither side of its message names. Value is
`amount,name(percent%)` — the figure first and the name second, the opposite
order from `+oth_dmg`, which is why the two cannot share a reader.

*Health:* moves health

*Cause:* the subject's own

*Shape:* 5 occurrences; on a message reporting damage; text

*Help:* names `lastheal`

*Evidence:* article view,372 at the engine name `lastheal` (read 2026-08-12): a
legendary bonus that heals once per fight by a random amount when damage takes
the holder below 18% of their pool, and only when the blow was not lethal. Both
halves close on our own material. The trigger reads off the heal's own segment —
what the combatant holds after, less what was restored, is what the blow left
them on — and over all five occurrences that share is 0.0774, 0.1137, 0.1540,
0.1675 and 0.1714 of the pool, every one under the documented 18% and the top two
close enough to it that the threshold is a line this material can see. The
arithmetic closes too: four of the five sit within 0.01% of their pool of the
health stated either side of them. Production build `1786514810315` splits the
value on the comma and renders the second member as `%val%`, which is where the
order of the two is read from.

⚠️ **It rides a group blow as readily as a single one**, which is what moved this
entry's placement from `on a blow`. Four of the five arrive inside a message that
also carries `+oth_dmg` at nine other combatants, so the damage that triggered it
is the segment naming the healed combatant and not the message's own figures. A
reader that took the whole message's damage would attribute nine people's losses
to one.

⚠️ **The healer is the healed, and the message's actor is neither.** The actor is
whoever struck the blow; the help says the bonus is the **holder's** own and that
the holder is the one it heals, so the combatant named inside the value is both
ends of it and is credited with giving it (§9.6, engine name `lastheal`, read
2026-08-19).

This entry read *nobody is credited with giving it* for a release, on the ground
that the help describes a mechanic and the protocol states nothing. That ground
did not hold: the panel was not silent about the giver, it drew `Nieznany
sprawca` — **the game does not say who healed** — which is a claim about the game
and a false one (§3). The choice was never between a reading and no reading
(`docs/specs/2026-08-19-a-heal-nobody-gave-was-their-own.md`).

⚠️ **Read the value, never a slot.** Four of the five occurrences ride a group
blow whose target is a third party, so both slots are the wrong combatant — the
actor would credit an attacker with healing their own victim, and the target
would credit whoever that blow happened to land on.

⚠️ **The witness cannot see this one.** The capture that carried it first has no
snapshot taken before its messages — the whole fight arrives in one engine call —
so the replay produces no comparison for it at all, and the arithmetic above is
held by `tests/core/last-heal-rule.test.ts` instead. The fifth occurrence is not
measurable there either, and for a different and documented reason: a
`healall_per` fired between the last health the protocol states for that
combatant and the heal itself, and that is health stated nowhere else.

### `heal` — decoded

Health restored to, or lost by, the combatant in the **actor** slot of a message
whose target is nobody: `<combatant>=<percent>;0;heal=<amount>`. The slot holds
the subject here rather than an attacker, and no message of this shape names
anyone else. Read as a positive health change; the client will state a loss with
a negative amount, which needs no special case because the figure is signed.

*Health:* moves health

*Cause:* the subject's own

**Whose effect it is, and why that is not a guess.** The help documents this key
as a **statistic of the Character** rather than as something anybody does to
anybody: an effect laid on the Character, restoring the Character's own health,
firing only before the action of the Player it is **assigned to** and only while
they hold less than they entered the fight with. So the end the message leaves out
was never a second person, and the panel credits the combatant it names with both
(§9.6, `docs/specs/2026-08-19-a-heal-nobody-gave-was-their-own.md`). An
announcement over the message still wins, because a giver the protocol states
beats one read off documentation.

⚠️ **The restoring direction only.** The figure is signed and a loss is not this
effect; nothing documents a self-damage reading, so a negative one stays health
lost with nobody charged for it.

*Help:* names `( heal )`

**A second value member, and what the client says about it.** The value may carry
a second comma-separated figure — `heal=3065,-45` in the group fight, one
occurrence — and the client splits on it, composing a different sentence when it
is there: `msg_heal %gain_lost% %name% %val0% %val1%`, with `%val0%` the health
figure and `%val1%` this one. `injure` and `poison` do the same.

Its **shape** is settled and its **subject** is not. Production build
`1786441768914` passes it as `Math.abs(R[1])` beside a direction the client
derives from its sign — `getIncDecTranslation`, which answers *increased* above
zero and *decreased* below. So the member is a signed change of some quantity,
shown as a magnitude with its direction in words. Which quantity is named in the
sentence, and the sentence lives in the translation table the client fetches at
run time rather than in the bundle, so it is not ours to read here (NOTICE.md).

⚠️ The older development build `1781609507010` passes `multi[1]` straight
through, with no absolute value and no direction. This entry is why §7.6 says
production decides: read there, the member looks like a plain number, and the
half that makes it legible is missing.

It is carried beside the health figure rather than reported unread, on the one
thing that is measured: the call is judged by the witness and agrees, on the very
message that carries it, so the first member accounts for all the health movement
and the second moves none. *Not understood* and *unaccounted* are different
claims, and only the first is true here.

*Shape:* 1236 occurrences; alone in its message; text

*Evidence:* of the four ways to sign `heal` and `poison`, only healing added and
poison subtracted closes the stated percentages — the other three leave hundreds
of comparisons disagreeing. Applying it moved the witness from declining every
call that contains it to agreeing on them.

### `poison` — decoded

Damage over time, same shape and same slot as `heal`, read as a negative health
change. **Unattributed by construction:** the protocol does not say who applied
it, so nothing downstream may credit it to anyone (§5).

*Health:* moves health

*Cause:* nobody

Carries a second value member in one occurrence — `poison=140,14` in the boar
fight — read the same way as `heal`'s above and for the same measured reason: the
call is judged and agrees on that message, so the member moves no health. The
sign is the client's direction marker rather than noise: `14` here and `-45` on
the heal render as *increased* and *decreased* of some quantity neither the
protocol nor the bundle names.

*Shape:* 496 occurrences; alone in its message; text

*Evidence:* as above. Before it was read, the first disagreement it caused was
`-10000249=76.05;0;poison=563`.

### `fire` — decoded

Elemental damage over time — `poison`'s twin, and the client writes it as one.
Same slot, same sign, same optional second member, so it needed no rule of its
own. **Unattributed by construction**, for `poison`'s reason: nothing in the
message says who set the target alight.

*Health:* moves health

*Cause:* nobody

Carries a second member in four of its occurrences — `fire=96,23`, `fire=97,22`
and `fire=117,6` twice — read as `poison`'s is, and for the same measured reason:
the calls are judged and agree on the very messages carrying it, so the member
moves no health.

*Shape:* 12 occurrences; alone in its message; text

*Help:* names `( fire )`

*Evidence:* production build `1786514810315` composes `msg_fire %name% %val%`
from the **actor** slot and splits the value on the comma exactly as `poison`
does, and the same bundle counts the key into its own damage total —
`updateStat("damage-fire", …)` beside `damageSum += createDmgStat(…)`. The help
at article view,372 (read 2026-08-09) documents `fire` as a damage type carried
by weapons and set on a monster by its profession, which settles what it is and
not what the key reports. The captures settle that: all 12 occurrences sit on one
combatant in `2026-08-15-tempest-grupa-vs-draugr-1`, against a pool of 184 680,
and before it was read the witness disagreed on every one of them and on nothing
else. Reading it closed all 12 first try.

⚠️ **`light` and `frost` share that branch in the client and are not read.** The
captures carry neither, so an entry for either would be a verdict with nothing
behind it — they stay unread and loud (§3), which is the only honest state for a
key nobody has measured.

### `heal_target` — decoded

Healing directed at the message **target**, which is what separates it from
`heal`: same figure, same sign, the other slot. The only key of this family that
does not put its subject in the actor slot, and the reason the decoder carries a
slot per key rather than assuming one.

**The actor slot holds the caster, and nothing here reads it.** Every occurrence
arrives under a skill announcement, and the announcement is what the giver is
taken from — so the two slots are the recipient and the caster, and 52 of the 78
are the same combatant, a self-cast. That is the shape `heal`,
`legbon_holytouch_heal` and `legbon_lastheal` joined: one person at both ends, and
this key had it first (§9.6).

⚠️ **Being a self-cast is not what makes those three self-sourced.** This key is
charged to whoever announced it, whether or not that is the combatant it healed;
the other three are charged to the healed because the **help** says the effect is
theirs. A round reading "actor equals target" off this entry and applying it to
those would be reading the grammar where the difference is in the documentation.

*Health:* moves health

*Cause:* the announcement's actor

*Shape:* 78 occurrences; on a skill announcement; a whole number

*Evidence:* reading it on the target closed every comparison in the calls that
carry it, first try and with no adjustment. Read on the actor instead, the same
calls disagree.

### `legbon_holytouch_heal` — decoded

Healing, same shape and slot as `heal`, from a legendary bonus rather than a
spell. Read identically; nothing about its **figure** needed a separate rule, and
what it does need is a line saying whose the healing is — the help settles that
and the protocol does not.

*Health:* moves health

*Cause:* the subject's own

*Shape:* 133 occurrences; alone in its message; a whole number

*Help:* names `holytouch`

*Evidence:* found by the witness rather than looked for. With `heal`, `poison`
and `injure` read, three comparisons still disagreed, all for one combatant and
all by the same six percentage points — `legbon_holytouch_heal=976` against a
maximum of 16278. Reading it closed them.

The **cause** is the help's, not the witness's: article view,372 at the engine
name `holytouch` (read 2026-08-19) says the Character applies the effect to
itself and that each firing heals the Character a share of their own pool. Both
halves of that sentence put one combatant at both ends, so the message naming one
is naming the only one there is (§9.6).

### `injure` — decoded

Damage, applied where it appears — same shape and slot again. A **different key**
from `+injure`, which is not damage; this file previously described `injure`
using `+injure`'s evidence, and the split is what let the two be measured apart.

*Health:* moves health

*Cause:* nobody

*Shape:* 151 occurrences; alone in its message; a whole number

*Evidence:* it could not be settled at all until `heal` and `poison` were read,
because every call containing it also contains one of those and the witness
declined them all. Once they were read, the residue was exact: after
`-10000249=99.95;0;injure=148` the stated percentage sat 148 below the
arithmetic, and reading it as damage turned that disagreement, and eighty-odd
others, into agreements.

### `healall_per` — decoded

Healing by a share of **maximum** health, floored, reaching every combatant on
the caster's side and nobody on the other, and capped. The caster is the actor,
and usually the target as well — but four of the 85 messages state a different id
there, so reading the caster from the target slot would credit the wrong
combatant. Read the actor slot, and read it always: the four are the whole reason
this sentence names a slot rather than a habit.

This is the one that decided the witness's shape. Dropping only the combatants a
message names is not enough here, because the health moved somewhere the message
never mentions, and the next comparison against such a combatant was out by more
than twenty percentage points. A key like this costs the whole call.

The share needs no arithmetic of ours. The help says each successive use of a
skill carrying the effect is weaker by a quarter of the base, and the protocol
states the **result**: grouped by caster, the shares run 30 → 22.5 → 15 and
22 → 16.5 → 11 → 5.5, every one of them the first times `1 − 0.25n`. Grouped by
skill they would not, because two casters used the same skill from different
bases — which is the reading to avoid, not a contradiction in the material.

**Not read, and the reason has changed.** The old one was that nothing knew who
stood on the caster's side. That is settled: the roster carries `side`, reaches
the decoder, and the live payload's warriors carry `hp.max` beside it, so the
share and its recipients are both available now.

**The cap is settled, and the reading that refused it was the measurement's own
fault.** The help says the effect cannot restore a combatant past the health it
began the fight with. This entry used to record one reading refusing that, and
`2026-08-14-tempest-grupa-vs-hildur` arrived with sixteen more — every side-mate
in it, twice over. All seventeen have one cause: they were measured against
`startingHealthByCombatantId`, which reads the health a combatant was **first
seen** holding, and in those cases something had already reached them before the
first snapshot existed. That fight opens with the boss casting one message
carrying ten `+oth_dmg` figures, one per side-mate, before any snapshot; the older
refusal was hit the same way. Excluding a combatant whose health had already moved
— decided from the messages alone, so it is a fact about the recording and not
about the heals — the cap holds without exception.

Reading the key **without** the cap would put a healing figure on screen that is
too **high** wherever the cap binds, and it binds on 78 of 109 side-mates. Too
high is the one direction the panel cannot mark, because nothing would know it had
happened (§9.6). The cap is what makes the arithmetic safe, and it is why the
inputs below are refused rather than defaulted: a cap taken against a figure we do
not hold is not a cap.

**`unaccounted-health` is now the degrade path rather than the verdict.** The
decoder still reads the key into it — the third answer between "read" and "no
meaning yet" — and where a cast cannot be sized that is still what the panel is
told: healing happened, it reached a whole side, and this meter cannot say whose.
What changed is that most casts no longer end there.

⚠️ **A partly sized cast keeps both events.** Where six of eight side-mates could
be sized, the figures for the six are drawn *and* the cast goes on being counted
as missing, so a partial answer can never be read as a whole one (§9.6). No
capture produces one any more; the shape is held by hand-built fights instead.

The list the decoder keeps for this shape is `SIDE_SHARE_HEALTH_KEYS` — keys
stating a share of a whole side rather than a figure. It was called
`UNATTRIBUTABLE_HEALTH_KEYS` while the witness read it to decide which calls it
could not judge; that reason is gone, and what survives the rename is the one that
was always underneath it. A share is not a figure, and the gap between them is
three readings the decoder cannot make.

**The two clauses that no capture could test are settled, and neither of them is
tested on a capture.** Both were read off the help and the client instead, which
is what §7.6 is for: they are claims about somebody else's system, and the
material here was never going to answer them.

*Halved with no allies.* The help states it of this key directly (read
2026-08-18). It is not a clause a recording can settle — every capture carrying
the key is a group fight — but it is one the **roster** settles at run time, and
that is enough: whether the caster has a side-mate at all is a question we can
always answer. Where they do, the clause cannot apply. Where they do not, the
answer is not a halved figure but no figure, because nothing here has ever seen
that fight and a share we have never watched being applied is not a share we can
apply.

*Reducible by `lowheal_per-enemies`.* Two findings, and the first removes half the
clause. The reducer's own help entry names exactly what it reduces — `healall_per`,
`heal_per`, `combo_heal_per` — and `heal_per-enemies` is in none of those lists;
it modifies the healing that comes off equipment, which is a different bullet of
the help's own account of where health comes from. So there is one reducer here,
not two.

And that one is **announced in the protocol**, which is what makes its absence
readable rather than merely unobserved. Production build `1786514810315` composes
it in the battle log as `_t("msg_lowheal_per-enemies val", {"%val%": …})` — a
message with a figure in it, the same shape its sibling `poison_lowdmg_per-enemies`
arrives in and this decoder already reads. A fight whose messages never carry the
key is therefore a fight where the effect was not in play, and *not carried* stops
being *not noticed*.

⚠️ **The key itself stays unread, deliberately.** No capture carries it, and
reading a shape this repository has never seen would be describing a message we
have never met (§5). What its absence buys is the right to size the casts around
it; what its presence would buy is the right to refuse them. Both are answers, and
neither needs the key decoded.

⚠️ **One shape of this key's own value is unmet and would be misread.** The same
production build splits the value on a comma and composes a different sentence
when there are two members — `msg_healall_per_multi %name% %val% %val2%` against
`msg_healall_per %name% %val%` — the way `heal`, `injure` and `poison` do. No
occurrence in the captures carries a comma, so the second member has never been
seen and is not read. The reader takes the value whole, which answers `null` on a
two-member value and refuses to size the cast — the safe direction, and stated
here because it is the one that would otherwise be found by a wrong figure rather
than by a missing one.

**The cap gained a second, independent statement on 2026-08-11, and the verdict
did not move.** Reading the help by stem for the `legbon` family turned up
`holytouch`, an unrelated bonus, capped by the help in the same words: restored
health may not pass what the combatant began the fight with. So the bound is the
game's general rule for restored health rather than a clause peculiar to this key,
which is worth more than one article's sentence about one skill.

That second statement is now the one carrying the cap, since the readings that
looked like refusals turned out to be readings of a figure the capture did not
hold.

**A figure is drawn from this key.** The three readings that were missing all
arrived: the roster carries each combatant's maximum, the session unwinds what
each entered the fight with, and `src/core/combatant-health.ts` carries a running
health forward from there. Where all three are held and the caster has a standing
ally, the cast is **sized** — the caster credited with the healing given, each
standing side-mate with the healing received — and where any of them is missing it
is not, and the cast goes on being counted as healing that is missing.

Measured over the corpus at the commit that did it: **all 85 casts sized**, 850
recipients between them, **1 604 444 points of healing that reached no row
before** — the total healing this meter reports goes 1 145 411 → 2 749 855. No
capture is left warning about healing it could not place.

⚠️ **Two captures took a second reading to reach**, and they are the interesting
ones: `2026-08-15-tempest-grupa-vs-draugr-1` and
`2026-08-15-tempest-grupa-vs-hildur-1` open with a payload carrying 297 and 354
messages and no snapshot beside it, so the first snapshot sits *after* eight casts
nothing could size. Unwinding the snapshot alone refused both outright. The
messages in that opening state health percentages of their own, and in both
captures every one of the eleven combatants is stated before the first cast — so
the entry health is unwound from the first statement about each combatant, and the
snapshot is the fallback rather than the anchor. Five of those eleven are stated by
a `step` or a skill announcement, which is why those two events now carry a health
percentage they have no figure of their own to go beside.

**What makes that a reading rather than an estimate**: on every cast that stood
alone in its engine call — 110 readings — the sized figure equals the health the
snapshots on either side of that call actually record, exactly, with no tolerance.
The reader that produces it never sees a snapshot; it seeds once from an unwound
entry health and carries a running total the length of the fight. Two independent
routes to the same number.

⚠️ **The health witness stopped skipping these calls, and agrees.** It used to
decline every engine call carrying this key, because health moved by an amount
nothing could size. It now judges them and the arithmetic closes: coverage rose in
thirteen of the fourteen fights carrying the key — 790 → 945 comparisons on
`2026-08-06-tempest-grupa-vs-hildur`, 392 → 624 on
`2026-08-12-tempest-grupa-vs-draugr-1` — with no disagreement anywhere. The
fourteenth carries all of its casts in an opening call with no snapshot in front
of it, which the replay could never judge whatever the call contained. That is
the protocol's own stated percentages confirming a figure derived from something
else entirely, which is the only evidence this repository accepts for a key that
moves health.

*Health:* moves health

*Cause:* the message actor

*Shape:* 85 occurrences; on a skill announcement; a number

*Help:* names `healall_per`, `lowheal_per-enemies`, `heal_per-enemies`

*Evidence:* article view,372 at the engine name `healall_per` (read 2026-08-18,
first read 2026-08-09) for the four clauses, none of which the protocol states.
The reducer at its own engine name `lowheal_per-enemies` (read 2026-08-18) lists
the three effects it reduces and this key is one of them; `heal_per-enemies` (read
2026-08-18) appears only among the modifiers of the health that comes off
equipment and reduces nothing here. All three are on the `*Help:*` line rather
than in this prose, because a help claim stated in prose is a help claim nobody
re-runs. Production build `1786514810315` for the battle-log composition of
`lowheal_per-enemies` and for the two-member split of this key's own value.
Measured on every group fight that carries the key; the
casts standing alone in their engine call are the ones read, so their health
deltas are attributable to nothing else. The share is of the maximum — 7162
restored on a maximum of 23874 at 30%, where 30% of that combatant's remaining
8749 would be 2624. It floors: a share landing on
5629.5 moved 5629. Capping at the entry health reproduces every reading whose
entry health the capture holds, and the readings that separate the two caps sat
exactly at their entry health while short of maximum and gained nothing.
Dropping the cap entirely reports 81% more healing than happened. Held by
`tests/core/team-heal-rule.test.ts`, which also holds the exclusion: something
has to be excluded for a missing entry health and something has to survive it,
or the cap is confirmed against nothing.

---

## Families the decoder reads by shape

### `?dmg*` — decoded

Damage. The client has no case labels for these: its default branch matches a
key whose characters 1–3 are `dmg`, treats `+` as dealt and anything else as
taken, and calls everything outside that an unknown parameter. We mirror the
rule rather than listing the family, so a kind the game has never sent still
decodes.

*Health:* moves health

*Cause:* the message actor

Accounted for — this is the figure the witness's arithmetic is built on. `?dmg*`
is a shape rather than a key the protocol ever sends, so the entry never matches
a message of its own.

*Evidence:* the default branch of the battle switch, production build
`1785244275300`, identical in the development build. Which sign is the damage
that landed was measured rather than read: health drop matched the sum of
`-dmg*` in 22 of 26 comparisons and the sum of `+dmg*` in **none**.

### `+thirdatt` — decoded

The **Third Blow** rolled: an extra auxiliary attack fired alongside the ordinary
one, stated raw. Damage the shape above cannot reach, because the key carries no
`dmg` marker — `fight-decoder.ts` names this pair instead, which is the one
exception the family rule has.

*Shape:* 6 occurrences; on a blow; a whole number

*Help:* names `thirdatt`

*Evidence:* article view,372 at the engine name `of-thirdatt` (read 2026-08-09)
describes the event as an additional auxiliary attack rolled between the main
weapon's minimum and maximum damage, and says its damage is reduced by the same
effects as other auxiliary damage — which is the raw and applied pair the protocol
sends. Measured here: 932 → 507, 1130 → 694, 968 → 540, raw above applied in all
three. Production build `1786514810315` renders it into the same column the
default damage branch writes to.

### `-thirdatt` — decoded

The same blow, applied. This is the half that moves health.

*Health:* moves health

*Cause:* the message actor

*Shape:* 6 occurrences; on a blow; a whole number

*Help:* names `thirdatt`

*Evidence:* ⚠️ **earned on the health arithmetic, not on the help.** While both
halves went unread, `tests/core/health-witness.test.ts` disagreed eight times in
`2026-08-12-tempest-grupa-vs-draugr-2`, every one in the direction of too little
damage decoded. Reading this half closes all eight and opens no disagreement
anywhere else. That is the protocol's own stated percentages settling it, which
is the only evidence this file accepts for a key that moves health.

**Only the group fights carry it.** Three occurrences across seven captures, so
the pair is read on thin material — but the direction is not in doubt, because the
arithmetic that judges it does not depend on the key's name.

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
health `tests/core/health-witness.test.ts` would disagree on the calls carrying
it. The verdict is held by the same guard that holds the damage figures.

Measured across every capture: each occurrence arrives on a message that also
carries damage and names a combatant on both sides.

### `-absorb` — decoded

Damage physical absorption stopped before it reached the target.

*Shape:* 434 occurrences; on a blow; a whole number

*Help:* names `absorb`

*Evidence:* the game's published help, article view,372, at the engine name
`absorb` (read 2026-08-09), describes it as a reduction of the physical damage a
character is taking at that moment, capped at a share of the blow and drawn from
a pool that runs out — which is why the figure is sometimes far below that cap.
Production build `1785244275300`: the branch appends to a log slot and assigns
nothing. 45 occurrences, every one with a value that reads as an integer.

### `-absorbm` — decoded

The same for magical absorption, which the help documents against fire, cold and
lightning rather than physical damage, with a higher cap.

*Shape:* 211 occurrences; on a blow; a whole number

*Help:* names `absorbm`

*Evidence:* article view,372 at the engine name `absorbm` (read 2026-08-09), and
the same branch shape in production build `1785244275300`. 27 occurrences.

### `-blok` — decoded

Damage a block stopped. The help ties the event to defending and to carrying a
shield, so unlike the two above it can be absent from a combatant entirely.

*Shape:* 76 occurrences; on a blow; a whole number

*Help:* names `blok`

*Evidence:* article view,372 at the engine name `blok` (read 2026-08-09), and
production build `1785244275300`, where the branch has the same shape as the
absorption pair. 9 occurrences — the rarest of the seven, and the reason it is
grouped with them rather than measured alone.

### `+crit` — decoded

A critical hit fired on this blow. **Carries no figure at all**: the protocol
states the key and stops, and the client's branch composes its sentence without
reading a value.

*Shape:* 561 occurrences; on a blow; no value

*Help:* names `crit`

*Evidence:* article view,372 at the engine name `crit` (read 2026-08-09) lists
it among the events an attack can produce. Production build `1785244275300`:
this branch is one of the two in the family that interpolates nothing. All 52
occurrences arrive with no value, which is why a value would make it unread
again rather than a flag with a number dropped beside it.

### `+of_crit` — decoded

A critical hit with the **offhand weapon** fired on this blow. Carries no figure:
the protocol states the key and stops.

*Shape:* 41 occurrences; on a blow; no value

*Help:* names `crit`

*Evidence:* production build `1786514810315`, the battle-message branch
`case"+of_crit"` composes its sentence as `_t("msg_+of_crit")` — no `%val%` hole,
which is the membership rule `PROC_KEYS` states. The neighbouring `-blok` branch
reads `_t("msg_-blok %val%",{"%val%":…})` in the same switch, so the difference
is the client's own and not an inference from our material.

⚠️ **The help documents the effect and never prints this key.** Article view,372
(read 2026-08-09) has a section on the offhand critical hit — it states that
offhand damage cannot be evaded, and that `lowcrit` lowers the chance of both the
main and the offhand variant — but the engine name beside that section is absent.
Phrases tried and nil: `of_crit`, `critof`, `ofcrit`, `crit_of`. The stem `crit`
is what the article carries, which is why the line above claims that and not
silence: *documented effect, undocumented name* is a different finding from
*undocumented*. The same build corroborates the meaning outside the battle log —
`this.of_crit` writes the character stat `helper-crit-chance`.

### `+pierce` — decoded

Armour piercing fired on this blow — the help states that within such a blow the
target's armour does not reduce the damage. No figure, like `+crit`.

*Shape:* 216 occurrences; on a blow; no value

*Help:* names `pierce`

*Evidence:* article view,372 at the engine name `pierce` (read 2026-08-09), and
production build `1785244275300`. Every occurrence arrives with no value.

### `-pierceb` — decoded

The answer to the key above, and the one flag here that belongs to the
**defence**: the help gives it as an event that can occur only after `+pierce`
has, and that switches off the effects that event triggers. So the armour
piercing is the striker's doing and the block of it is the struck combatant's,
which is the split the sign alone would not have given — the same shape
`-legbon_cleanse` and `-legbon_glare` have, and the reason `procsOnBlowsStruck`
groups all three the way it does.

The material agrees from both sides: every occurrence states no value, and every
occurrence carries `+pierce` in the same message.

*Shape:* 4 occurrences; on a blow; no value

*Help:* names `pierceb`

*Evidence:* article view,372 at the engine name `pierceb` (read 2026-08-09),
which gives it as a shield statistic, always expressed as a probability, arising
during defence, and states both that it occurs only after armour piercing has and
that no skill or attribute can lower the chance of it. Production build
`1786514810315` composes `msg_-pierceb` with no `%val%` hole, which is what
admits it to the flag family rather than to the declarations; the development
build `1781609507010` carries the same branch with its original comment.

#### The rest of the flag family

Eight more keys are read the same way, and they are grouped because the evidence
is one measurement rather than eight. Each states a fact about the blow and no
figure; together with the two above, **every occurrence in the captures arrives
without a value, on a message that also carries damage and names a combatant on
both sides**. `tests/core/proc-rule.test.ts` re-earns that by
decoding the material and checking what actually landed, rather than by reading
the decoder's list.

**Membership is the client's to decide, not the name's.** For each of the eight,
production build `1785244275300` composes a sentence that interpolates nothing —
which is the same test the two above passed, and the one `+legbon_holytouch`
fails despite looking identical in our material (its own entry, below).

⚠️ **Four of the eight are documented, and this file said none of them were.**
The claim rested on four phrases — `legbon`, `tenacity`, `acdmg_destroyed` and
`dispel` — and not one of them is a name the help prints. The help joins an
article to a key through the engine name in parentheses, and for this family that
name is the key's **stem**: `verycrit`, `curse`, `cleanse`, `holytouch`. Searched
by the stem (read 2026-08-09), the help answers to all four and describes each in
full.

That is the trap §7.6 records against `-legbon_facade`, sprung a second time on
the same family — and a sentence of this file's own reasoning is what sealed it:
*a legendary bonus is equipment, so the silence is expected rather than
suspicious*. The silence was ours. An explanation for a negative is worth less
than the search that was not run, which is why the `*Help:*` line now re-measures
both directions on every gate rather than leaving the phrases tried as prose.

`tenacity`, `dispel` and `acdmg_destroyed` are **not** in article 372. That part
held, and it is narrowed here to the article it was actually measured on — the
help has no build id and no index this file reads, so "not documented" was always
a wider claim than the evidence. `stun`, `freeze` and `pierce` it documents as
events an attack can produce.

**What the help settles is whose each event is, and it does not fall the same way
for all four.** The event belongs to the bonus holder in every case; which
combatant that is depends on what triggers it. `verycrit`, `curse` and
`holytouch` fire when the holder **attacks**, so they belong to whoever swung.
`cleanse` fires when the holder **is hit** — so its five occurrences belong to the
combatant who was struck, on a blow they did not throw. That is why
`procsOnBlowsStruck` counts by the blow rather than by the effect: the grouping
stays true of both, which is the property it was named for before there was
evidence it would be needed (`src/core/fight-statistics.ts`).

An observation, and deliberately not promoted to a rule: across these four the
sign tracks the trigger — `+` where the holder attacks, `-` where the holder is
hit — and the client's `-legbon_glare`, which the help documents as firing on a
received hit, would extend it. It stays an observation because the note opening
this section shows the sign settling nothing in general (`-absorb` and `+acdmg`
carry opposite signs and both figures are the target's), and because one of the
four is a key no capture here carries. The help decides whose an event is; the
sign is not evidence.

### `+stun` — decoded

The target's turn was blocked by this blow. The help documents the event, and
notes it also appears under several other display names — which is why the key,
not the sentence, is what identifies it.

*Shape:* 70 occurrences; on a blow; no value

*Help:* names `stun`

*Evidence:* article view,372 at the engine name `stun` (read 2026-08-09), the
shared measurement above, and production build `1785244275300`. 9 occurrences.

### `+freeze` — decoded

The same stun, from the effect the help documents separately as its own passive:
a chance to freeze, which blocks the target's turn.

*Shape:* 47 occurrences; on a blow; no value

*Help:* names `freeze`

*Evidence:* article view,372 at the engine name `freeze` (read 2026-08-09), and
the shared measurement. 3 occurrences.

### `+legbon_verycrit` — decoded

A legendary bonus fired on this blow, and it is **the striker's**: the help
describes a chance event, scaled by the holder's own critical-hit chance, that
raises the force of their critical hit and triggers a critical for one turn. The
help documents a second form under the same engine name, for a monster fighting a
hero alone; nothing in the protocol distinguishes the two, so this entry does not
either.

*Shape:* 26 occurrences; on a blow; no value

*Help:* names `verycrit`

*Evidence:* article view,372 at the engine name `verycrit` (read 2026-08-09) for
the effect and for whose it is; the shared measurement, and production build
`1785244275300`. 3 occurrences.

### `+legbon_curse` — decoded

A legendary bonus fired on this blow. **The event is the striker's and the effect
is the target's**, which is the split the sign alone would not have given: the
help describes a chance event, possible only when the holder attacks *and* hits,
that makes the opponent forgo their next action. The help groups it with two
siblings the client also has keys for — `+distract` and `-legbon_glare` — and
states that only one of the three may sit on a combatant at a time, and that
stunning is spent before any of them.

None of that is in the protocol, which states the name and stops. It is recorded
because it says whose the event is, and because the sibling keys are what a later
capture would arrive carrying.

*Shape:* 8 occurrences; on a blow; no value

*Help:* names `curse`

*Evidence:* article view,372 at the engine name `curse` (read 2026-08-09) for the
effect, its trigger and its siblings; the shared measurement. 1 occurrence, which
is why nothing here rests on the material beyond that it fired.

### `-legbon_cleanse` — decoded

A legendary bonus fired on the blow, and **the one of this family that inverts**:
the help states the event happens only when the holder **takes** a hit, and clears
the damage-over-time, slowing and stunning effects standing on them. So its five
occurrences belong to the combatant who was *struck*, not to the one who swung —
the opposite of `+legbon_verycrit` beside it, on a message of the same shape.

That is what makes `procsOnBlowsStruck` a grouping by the blow rather than by the
effect worth having: it stays true of this key and of `+crit` at once, without
either of them being counted on the wrong row (`src/core/fight-statistics.ts`).

The `-` agrees here, and it is still not the evidence — the note opening this
section shows the sign settling nothing in general.

*Shape:* 19 occurrences; on a blow; no value

*Help:* names `cleanse`

*Evidence:* article view,372 at the engine name `cleanse` (read 2026-08-09) for
the effect and for its trigger, which is what places it on the struck combatant;
the shared measurement. 5 occurrences.

### `-legbon_glare` — decoded

The third of the siblings `+legbon_curse`'s entry names, and the one that entry
predicted would arrive in a later capture. It has: one occurrence, on a blow,
with no figure.

Like `-legbon_cleanse` it fires when the **holder is hit** — the help is explicit
that the event needs a landed attack *on* the bonus holder — and what it costs is
the opponent's next action. So the effect is the striker's problem and the event
is the struck combatant's, which is the split the sign alone would not have
given, and which `procsOnBlowsStruck` groups correctly for the same reason it
does for `-legbon_cleanse`.

*Shape:* 1 occurrences; on a blow; no value

*Help:* names `glare`

*Evidence:* article view,372 at the engine name `glare` (read 2026-08-12) for the
effect, for its trigger, and for the rule that only one of `curse`, `distract`
and `glare` may stand on a combatant at a time. Production build `1786514810315`
composes `msg_-legbon_glare` with no `%val%` hole, which is what admits it to the
flag family rather than to the declarations.

### `-evade` — decoded

The target evaded this blow. Carries no figure, and sits on the defending side:
every occurrence arrives beside `-dmg=0`, which is the blow landing nothing.

*Shape:* 8 occurrences; on a blow; no value

*Help:* names `evade`

*Evidence:* article view,372 (read 2026-08-09) at the engine name `evade` —
`Unik ( evade )`, "zdarzenie zachodzi podczas obrony", with the chance given as
`evade points * 20 / min(lvl enemy, 300)`. Production build `1786514810315`:
`case"-evade"` composes `_t("msg_-evade")` with no `%val%`, against the
`msg_-blok %val%` branch two cases away — the client itself separates the flag
from the figure.

⚠️ **Not totalled with anything.** An evade is the absence of damage, not a
quantity of it: the figure it would contribute is the `-dmg=0` already read.

### `+fastarrow` — decoded

The Fast Arrow fired on this blow: a chance event that shortens the attack's
duration. Carries no figure, and says nothing about how hard the blow landed —
what it changes is time, which no total here keeps.

*Shape:* 25 occurrences; on a blow; no value

*Help:* names `fastarrow`

*Evidence:* article view,372 at the engine name `fastarrow` (read 2026-08-09)
gives it as a passive chance of an event that cuts attack duration by 75% after
every speed modifier, with the variable being the chance rather than the result.
Production build `1786514810315`: `case"+fastarrow"` composes `_t("msg_+fastarrow")`
with no `%val%` hole, which is the membership rule `PROC_KEYS` states.

### `-contra` — decoded

The Riposte the defender fired back: an event that occurs on **taking** a
critical hit and triggers an automatic counterattack inside the same turn. On the
defending side, like `-evade` and `-blok`, and carrying no figure.

*Shape:* 1 occurrences; on a blow; no value

*Help:* names `contra`

*Evidence:* article view,372 at the engine name `contra` (read 2026-08-09) —
`Kontra ( contra )`, stated as occurring during defence and only after a critical
hit, with the effect being an automatic attack within the same turn. Production
build `1786514810315`: `case"-contra"` composes `_t("msg_-contra")` with no
`%val%`.

⚠️ **One occurrence, and the counterattack is not joined to it.** The blow the
riposte fires arrives as its own message like any other, and nothing in the
protocol says which one it was. Reading the flag claims only that the event
happened.

### `-tenacity` — decoded

Tenacity fired on this blow. What it does is not established here, and neither is
whose it is: the protocol states nothing but that it happened, and article
view,372 does not carry the name.

**That negative is narrower than the one this entry used to make.** It said the
help does not document it; what was measured is one article. The help has no build
id and no index this file reads, so there is no reading of it that supports the
wider claim — and the four keys corrected above are what the wider claim costs.

*Shape:* 13 occurrences; on a blow; no value

*Help:* names nothing of `tenacity`

*Evidence:* the shared measurement. 1 occurrence.

### `+superspell-dispel` — decoded

A dispel fired alongside the blow. The client renders it through a sentence
named for `dispel` rather than for the key — one of the few places where the two
differ, and a reason not to identify a key by the sentence it produces.

*Shape:* 28 occurrences; on a blow; no value

*Help:* names nothing of `superspell-dispel`, `dispel`, `superspell`

*Evidence:* the shared measurement, and production build `1785244275300`, where
the branch reads `msg_+dispel`. 3 occurrences. The stem that worked for the four
above was tried here too: `dispel` is the name the client's own sentence uses,
and the article carries neither it nor `superspell`.

### `+acdmg_destroyed` — decoded

The target's armour was destroyed outright by this blow — the floor `+acdmg`
counts down to. **Not a figure**, unlike `+acdmg`: this key states that the
armour is gone and no amount.

*Shape:* 26 occurrences; on a blow; no value

*Help:* names nothing of `acdmg_destroyed`, `destroyed`

*Evidence:* the shared measurement. 2 occurrences, both on a message that also
carries `+acdmg`. The stem rule does not rescue this one and is worth saying so:
stripping to `acdmg` lands on the article for the *figure* key below, which is a
different key and would document the wrong thing.

### `+acdmg` — decoded

Armour of the target destroyed by this blow, in points. **Not damage**, and the
distinction is not pedantic: the help describes it as lowering a statistic
before the blow's reduction is computed, with a floor below which it cannot go.
Summed together with `dealt` it would be a total of two different things.

*Shape:* 473 occurrences; on a blow; a whole number

*Help:* names `acdmg`

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

*Shape:* 671 occurrences; on a blow; a whole number

*Help:* names `resdmg`

*Evidence:* article view,372 at the engine name `resdmg` (read 2026-08-09), and
production build `1785244275300`. 61 occurrences — the most frequent of the
nine.

### `+abdest_per` — decoded

Absorption of the target destroyed by this blow, **in points** — despite the
name. The `_per` belongs to the share the skill announces, not to what this
reports: the figure is the quantity that share removed.

*Shape:* 186 occurrences; on a blow; a whole number

### `+abmdest_per` — decoded

The same for magical absorption. The two always arrive together and are read
identically; nothing separates them but which pool they empty.

*Shape:* 186 occurrences; on a blow; a whole number

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
held by `tests/core/absorption-destruction-rule.test.ts`. What is **not**
established is the absorption pool itself — the captures record health and
nothing else, so the share can be checked against consecutive reports but never
against the quantity it was taken from.

Production build `1785244275300` gives both keys one shared case, alongside
`active_resall_per`, which appends the value to a log slot and assigns nothing;
the readable development build `1781609507010` has the same shape. All 18 calls
carrying them are judged by `tests/core/health-witness.test.ts` and agree, which
is what places them outside the health arithmetic.

---

## The announcement that comes before the blow

### `tspell` — decoded

The skill a combatant used, by name. The announcement carries no key of the
**damage family** — measured, none of the 197 in the captures does — but that is
narrower than it sounds, and an earlier version of this entry said "no damage at
all" and was wrong.

**Damage aimed at a name rides the announcement itself.** 33 of the 197 carry
either `+oth_dmg` or a key the register says moves health, in the same message
as the skill name, never both at once. So the protocol does sometimes put a
skill and a figure together; what it still does not state is that the figure is
the skill's doing. Tying them remains an inference, and the decoder does not
attempt one — it emits the announcement and the figure as separate events from
the same message. Guarded, in both directions, by
`tests/core/skill-announcement-rule.test.ts`.

The value is the name the player's own client displays. It is read at run time
and shown, never stored here — the same footing as the sentences the client
composes from keys, and for the same reason (NOTICE.md). No example of one
appears in this file or in any test.

*Shape:* 2108 occurrences; on a skill announcement; text

*Help:* names nothing of `tspell`, `( tspell )`, `skillId`, `( skillId )`

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

*Shape:* 1935 occurrences; on a skill announcement; a whole number

*Evidence:* production build `1785244275300` for the empty branch. Measured on
the captures: present on 182 of the 197 announcements, absent from 15, and never
once on a message that does not also carry `tspell`. That last figure is why a
lone id is reported unread instead of decoded — the protocol has not yet shown
one, so reading it would be describing a message we have never seen.

---

## Keys that state an input rather than an outcome

Each of these was investigated, understood, and then deliberately left unread —
because reading one as a figure would have doubled a reduction, counted a wound
twice, or invented a unit. That was the right verdict and the wrong word for it:
they were never *unknown*, and while they were filed as unread the panel warned
that totals might be low on their account, which none of them could cause.

Four of them are now `decoded` as **declarations** (§10): read, shown, and
totalled with nothing. The reasoning that kept each out of a statistic is
unchanged and is still the entry below — what changed on 2026-08-11 is that
`AttackEvent` and `SkillUsedEvent` gained a `declared` slot, so "we understand
this and it is not a measurement" became something the contract can say.

The rest stay unread, and each says for itself why.

### `+injure` — decoded

The deep wound an attack has just applied, announced inside that attack's own
message. It moves no health where it appears: the wound arrives on later calls
as its own `injure` message, which is the entry above.

**It is read as a declaration and counted as nothing**, for that reason and not
for want of understanding it: counting the announcement as damage would add the
same wound twice — once where it is announced, and again on every tick. It lands
in `AttackEvent.declared`, which is the slot for a share the protocol states
rather than a figure it reports, and no statistic touches it.

Two properties, both re-earned on every run by `tests/core/injure-rule.test.ts`:
the amount is `floor(0.15 × the damage that message reports taken)`, and a fresh
application **replaces** the wound already running rather than adding to it, so
a smaller value supersedes a larger one.

*Shape:* 65 occurrences; on a blow; a whole number

*Help:* names `injure`

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

### `-poison_lowdmg_per` — decoded

The share by which a blow was weakened because the combatant dealing it was
poisoned, reported inside that blow's own message. A **percentage, not points**,
and unlike the three defences it is not a figure that was subtracted from
anything we can see: the damage keys beside it already have it applied.

**It is read as a declaration and counted as nothing**, for that reason and not
for want of understanding it. None of the slots that hold figures would be
honest: `prevented` holds points a defence stopped and would total a percentage
with them; the flag family holds keys carrying no figure at all, and this one
always carries one. So it lands in `AttackEvent.declared` — a share the protocol
states, beside figures that already have it applied — and adding it anywhere
would double a reduction that has already happened.

Two properties re-earned on every run by
`tests/core/poison-reduction-rule.test.ts`: it arrives **once per combatant the
message reports damage against** — not once per damage element — and it always
carries a figure. A third test holds the entry to making no health claim,
because the moment it does, the witness skips every call carrying it and the
paragraph below stops being checked by anything.

No health line, which is the register making no claim rather than an omission:
what the captures settle is that the damage reported beside it needs no
adjustment, and that is a different statement from the key moving health itself.

*Shape:* 611 occurrences; on a message reporting damage; a whole number

*Help:* names `poison_lowdmg_per-enemies`

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
messages report damage, and in all 26 the number of occurrences equals the
number of combatants damaged. Counting damage **elements** instead holds for
only 19 of the 26: seven blows carry two elements and still report one
reduction, which is what rules that reading out. 16 of the 23 calls carrying the
key are judged by `tests/core/health-witness.test.ts` — the other 7 are skipped
over unrelated keys — and they agree, which is the measurement behind "already
net". Nothing here establishes what the blow would have been without it: the
protocol reports the reduced figure and never the raw one, so the amount removed
is not recoverable.

### `active_absorbdest_per` — decoded

The share of current absorption a skill destroys, stated **on the announcement of
that skill** rather than on any blow. The two keys above are what the share then
removes, and they arrive in later messages.

**It is read on its own announcement, and joined to no blow, because the protocol
never joins the two.** A skill announcement carries no damage and no target
statistic — measured, every one of
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

*Shape:* 348 occurrences; on a skill announcement; a whole number

*Help:* names `active_absorbdest_per`

*Evidence:* the help, article view,372, at that engine name (read 2026-08-09) —
the description quoted under `+abdest_per` above. Measured on the group fight,
the only capture carrying it: 43 occurrences, every value `5`, every one on a
skill announcement. Held by `tests/core/absorption-destruction-rule.test.ts`,
which also refuses a second distinct value — the entry's claim is that the fight
declares one share, not that the key is a constant.

### `combo-max` — decoded

How many accumulated combination points the announced skill will spend. A
**count, not a quantity** — the captures state 1, 2 and 3 — and like the share
above it qualifies the skill rather than reporting anything that happened.

**It is read as a declaration and counted as nothing, because it describes an
input, not an outcome.** Whatever the points are then worth arrives as ordinary
figures in the message or in later ones, already computed; totalling the cap
would add a number that measures nothing that was done to anybody.

*Shape:* 304 occurrences; on a skill announcement; a whole number

*Help:* names `combo-max`

*Evidence:* the help never documents the key on its own — article view,372 (read
2026-08-09) mentions it only inside six other effects, each saying it spends
accumulated combination points up to the number this parameter sets, which is
where the reading comes from. Measured on the group fight, the only capture
carrying it: 31 occurrences, values `1` (15), `2` (15) and `3` (1), and **every
one on a skill announcement** — none anywhere else. Held by
`tests/core/skill-announcement-rule.test.ts`, which also refuses a figure in the
range the protocol's quantities occupy, so a cap and a count of points cannot be
confused with one.

### `+engback` — decoded

Energy returned to the attacker by this blow. Rides the blow, states a whole
number, and — measured — **never arrives without a critical hit**: every
occurrence sits beside `+crit` or beside `+of_crit`.

⚠️ **This entry said `+crit` alone, and the material had already refuted it.**
That was true of the 13 occurrences the first capture carried and of nothing
since: `+of_crit` without `+crit` accounts for 13 of the 78 occurrences now, and
10 of those were sitting in the repository before the duel added 3. A count in
prose goes stale silently (AGENTS.md §5) — but so does a universal beside it, and
nothing here re-measures a claim about which keys a key arrives *with*.

**Read as a declaration and counted as nothing**, because it is not a figure
about anybody's health: energy is a unit no total here keeps, so this cannot
shorten one. That is the second half of the declaration test — an outcome
qualifies when its unit does. What it is emphatically not is a statistic: there
is no energy total, and inventing one would mean a slot with one consumer and
nothing to compare it against.

*Shape:* 233 occurrences; on a blow; a whole number

*Help:* names `engback`

*Evidence:* article view,372 (read 2026-08-09) names `engback` among the effects
that restore energy, without documenting the protocol key. Every occurrence is on
a blow, and each carries one of the two critical-hit flags.

### `-endest` — decoded

Energy destroyed on the combatant this blow struck. Rides the blow and states a
whole number.

**Read as a declaration and counted as nothing**, on the same half of the test
`+engback` passes from the other direction: energy is a unit no total here keeps,
so a figure in it can shorten nothing.

*Shape:* 8 occurrences; on a blow; a whole number

*Help:* names `endest`

*Evidence:* article view,372 at the engine name `endest` (read 2026-08-12):
*słabnące niszczenie energii przeciwnika*, a withdrawn equipment bonus that takes
a fixed number of the opponent's energy points on their turn, weakening by 5% of
its initial value each turn and floored at zero. Production build
`1786514810315` composes it through the shared `msg_<key> %val%` branch it shares
with `+endest`, with a second form for a two-member value.

⚠️ **The decay the help describes is not visible here.** All 8 occurrences state
5, across a fight of 41 blows, where the documented rule would have them falling.
The material is one fight and the help is about an equipment bonus rather than
about the key, so this is recorded as a disagreement and not resolved either way
— what is settled is the unit, which is all the reading rests on.

### `+critslow_per` — decoded

An attack-speed reduction applied by a critical hit. States a whole number; all
7 occurrences ride a blow carrying `+crit`.

*Shape:* 9 occurrences; on a blow; a whole number

*Help:* names `critslow_per`

*Evidence:* article view,372 (read 2026-08-09) lists `critslow_per` among the
effects that combine additively to change attack speed. Read as a declaration for
the same reason as `+engback`: attack speed is a unit no total here keeps, so
nothing totals it and nothing is missing when it is not.

### `+critpoison_per` — decoded

Healing or poison tied to a critical hit — the help lists it among the effects
whose sum is capped, in the passage about healing. Both occurrences ride a blow
with `+crit`.

**Read as a declaration, on a measurement rather than on the help.** The help
places it near healing, and healing does move health — so the question was
whether health moves here, and that is answerable. Of its two occurrences one
sits in a call the team heal makes uncomparable; the other is a message where
both sides state a percentage the decoded damage reproduces exactly, `466476` at
94.30 and `-10000249` at 99.33. No health moved there beyond what is already
accounted for.

One measurable occurrence is one, and it is not the whole story: if this key ever
does move health, the witness reports it as a disagreement the moment a capture
carries it in a comparable call. That is the safety net this verdict rests on,
and it runs on every gate.

*Shape:* 7 occurrences; on a blow; a whole number

*Help:* names `critpoison_per`

*Evidence:* article view,372 (read 2026-08-09) at the engine name
`critpoison_per`. 2 occurrences, both beside `+crit`.

### `-legbon_facade` — decoded

A legendary bonus riding the blow, stating a whole number. Nothing establishes
what the number counts.

*Shape:* 10 occurrences; on a blow; a whole number

A legendary bonus that **reduces the damage its bearer takes**, stated on the
blow it reduced. The help describes it under the human name with the engine name
`facade` beside it: a share of any non-zero damage taken in a blow is removed,
covering physical, auxiliary, ranged and the elemental magics, and the reduction
happens at the same moment as the reduction from resistances — which is where the
help's own ordering of damage reduction places the legendary bonuses.

**Read as a declaration**, because it states a share and the figures beside it
already have it applied, exactly as `-poison_lowdmg_per` does. It is **not**
`prevented`: that family holds points a defence stopped, and this is not points.
Measured — 13 sits on a blow of 331 raw and 20 on a blow of 7438, which as
quantities removed would be 3.9% and 0.27% of those blows, and as the bonus's own
strength are two ordinary character statistics. The help settles the direction:
each legendary bonus carries a value expressing either a trigger chance or the
percentage strength of the effect.

⚠️ **The register said this key was undocumented, and it was wrong.** The search
was for `legbon_facade` and `legbon`; the help prints the engine name without the
protocol's prefix, so neither matched. §7.6 gained a rule from it: a protocol key
carrying a prefix is searched by its stem too, because *not found* and *not
documented* are different claims and this entry made the wrong one for two days.

**No health line, and not for want of a measurement.** Both sides of the message
carrying it state a percentage the decoded damage reproduces exactly — `-255967`
at 19.27 and `482845` at 98.30 — so a figure that moved health there would have
left that comparison short. The register has one spelling for a health verdict
and no opposite, on purpose: silence is what an unsettled key looks like, and
this is a settled negative, which is what this paragraph is for. It is re-earned
every gate by `tests/core/health-witness.test.ts`, which judges that call rather
than skipping it (measured 2026-08-11).

*Help:* names `facade`

*Evidence:* article view,372 (read 2026-08-09) at the engine name `facade`, for
the effect and for the value it carries; the client composes its log line with a
`%val%` hole, production build `1786441768914`. 2 occurrences in the captures,
values 13 and 20, on blows that carry damage.

### `+legbon_holytouch` — decoded

**The key that looks like a flag and is not.** In the captures it arrives with no
value, exactly as `+crit` does — but production build `1785244275300` composes
its sentence with a `%val%` hole, so the client expects a figure this occurrence
does not carry.

That disagreement is the entry, and it is preserved rather than resolved.
Reading it as a flag would settle from one message what the game settles, and the
figure would vanish the first time one arrived. So it is read as a **declaration
while it carries no value, and reported unread the moment it carries one** —
which is the disagreement made into behaviour instead of a note. Its single
occurrence sits on a message where both sides state a percentage the decoded
damage reproduces exactly, so nothing of health is missing there.
`tests/core/proc-rule.test.ts` holds it out of the flag family on purpose rather
than by omission, and holds the value case too.

A **different key** from `legbon_holytouch_heal`, which is decoded and does move
health — the same split as `injure` and `+injure`.

**The help documents the effect, and this entry said it did not.** The two phrases
it recorded searching, `legbon_holytouch` and `legbon`, are the wrong shape; the
stem `holytouch` answers. What the help states: a chance event, possible only when
the holder attacks — hitting is not required — that puts a three-turn effect on
**the holder themselves**, each trigger restoring a share of their health pool. It
does not stack; a later event refreshes the duration instead.

**It does not resolve the `%val%` disagreement, and the behaviour is unchanged.**
The only figure the help attaches to the event is the *chance* of it happening,
which is a property of the equipment rather than of this message, and the healing
it describes is what `legbon_holytouch_heal` carries. So nothing here says what a
value on this key would mean, and reading it as a flag would still settle from one
message what the game settles. Documented is not the same as resolved — the entry
above stands as written.

One clause is worth more than this key. The help caps the restored health at what
the holder began the fight with, the same bound `healall_per` argues over, stated
for an unrelated bonus — see that entry.

*Shape:* 55 occurrences; on a blow; no value

*Help:* names `holytouch`

*Evidence:* production build `1785244275300` against 1 occurrence in the group
fight; article view,372 at the engine name `holytouch` (read 2026-08-09) for the
effect, its trigger and whose it is.

### `poison_lowdmg_per-enemies` — decoded

The aura that grants the reduction `-poison_lowdmg_per` reports, declared once
per fight rather than per blow. Described in full in that entry above; it has a
heading of its own because it is a distinct key.

*Shape:* 23 occurrences; alone in its message; a whole number

*Help:* names `poison_lowdmg_per-enemies`

*Evidence:* 1 occurrence in the group fight, naming a single combatant in the
actor slot, carrying no damage, stating the same value the 68 blow reports
carry. The help documents the effect under this name — article view,372 (read
2026-08-09).

### `+taken_dmg` — decoded

⚠️ **The key that looks like damage and is not.** It rides every blow carrying
`-dmga`, all 199 of them, and the tempting reading is that it is the raw half of
that applied figure — the help documents `taken_dmg_per` as damage added to what
the target takes, reduced by armour, which is exactly a raw/applied pair.

The material refuses it. A raw figure cannot be smaller than its own applied
counterpart, and this one is smaller in **31 of the 199** and never once larger.
So it states a component of the added damage rather than the whole of it, and the
whole is already reported as `-dmga`, which the `?dmg*` family reads. Counting it
would land the same damage twice.

*Shape:* 733 occurrences; on a blow; a whole number

*Help:* names `taken_dmg`

*Evidence:* article view,372 (read 2026-08-09) documents `taken_dmg_per`,
`taken_dmg_per-all` and `taken_dmg_per-row` as effects that raise the damage
aimed at the target by a share, computed against the attacker's damage before any
reduction, and states that the added damage is itself reduced by armour. That is
what makes a raw/applied split expected — and what makes the 31 readings where
this figure is the *smaller* of the two decisive against it being the raw side.

Production build `1786514810315` agrees: `case"+taken_dmg"` shares its branch with
`+crush`, `+critpierce` and the `critval-*` family, all composed as
`eng_game_only_val_<key> %val%` — a line that states a figure and nothing else —
while `-dmga` carries no case at all and falls to the default branch that
recognises damage by shape.

⚠️ **What the 31 differences measure is not settled.** They are consistent with a
second source of added damage on the same blow, and the material does not say
which. What is settled is the direction, and the direction is what decides whether
the figure may be totalled.

### `+crush_physical` — decoded

The share by which this blow's output was raised by the Crush effect, stated per
damage element. An input: the damage keys beside it already carry it.

*Shape:* 9 occurrences; on a blow; a whole number

*Help:* names `crush`

*Evidence:* article view,372 (read 2026-08-09) documents `crush_dmg_per` as
raising output damage by a share of the damage dealt, once the ratio of dealt to
executed damage passes `crush_threshold_per`, with the variable being that share.
Every occurrence here states 30 and sits beside ordinary damage figures.
Production build `1786514810315`: the branch is a family — `case"+crush_physical"`
and `case"+crush_distance"` share a body that switches on the element name and
composes `eng_game_only_val_+crush %val%`.

### `+rage` — decoded

The Rage buff firing on this blow, stated as an attack figure. An input to
damage, so the `dmg` keys beside it already carry whatever it produced — counting
it would state the same increase twice, in a unit nothing here totals.

*Shape:* 1 occurrences; on a blow; a whole number

*Help:* names `( rage )`

*Evidence:* article view,372 at the engine name `rage` (read 2026-08-09): a
critical hit triggers Rage for a number of turns and it raises physical damage by
10%, the variable being the number of turns. Production build `1786514810315`
composes it as `msg_+rage %val%` — an attack figure and not the turn count, which
is the one thing the two sources say differently and neither of them makes it
health. The single occurrence,
`447544=18.54;-10000545=48.21;+rage=340;+dmg=3745;-dmg=3171`, sits on a call the
witness judges and agrees on, so it reports no health figure the arithmetic has
to account for. `-rage` exists in the client and carries no value; the captures
do not have it, so it has no entry.

### `+critsa` — decoded

Attack speed granted on a critical hit. A unit no total here keeps, which is the
same reason `+critslow_per` above is read and never added to anything.

*Shape:* 15 occurrences; on a blow; a whole number

*Help:* names `critsa`

*Evidence:* article view,372 (read 2026-08-09) names `critsa_per` among the
attack-speed effects that combine additively with `sa_per`, `aura-sa_per`,
`allslow_per` and `critslow_per`. Every occurrence states 11 and rides a message
that also carries `+of_crit`. Production build `1786514810315` composes
`msg_+critsa %val%`.

### `-legbon_critred` — decoded

Critical Cover: the share by which the damage of this critical blow was reduced,
stated on the defending side. Already applied to the figures beside it, so reading
it as a reduction would subtract it twice — the same argument as
`-poison_lowdmg_per`.

*Shape:* 9 occurrences; on a blow; a whole number

*Help:* names `critred`

*Evidence:* article view,372 at the engine name `critred` (read 2026-08-09) —
`Krytyczna osłona ( critred )`, stated as reducing all of the opponent's weapon
damage by a share when the character takes a critical hit, at the same moment as
resistance reduces it, and only after a critical. The material agrees: all 6
occurrences state 25 and every one rides a message carrying `+crit`. Production
build `1786514810315` composes `msg_-legbon_critred %val%`.

*Stem searched:* `critred`, which is the name the help prints in parentheses; the
full key `legbon_critred` counts zero, as `legbon_facade` did.

### `+legbon_puncture` — decoded

Piercing Efficiency: the share of the target's defensive statistics this attack
ignores. An input to the damage on the same message, not an outcome.

*Shape:* 3 occurrences; on a blow; a whole number

*Help:* names `puncture`

*Evidence:* article view,372 at the engine name `puncture` (read 2026-08-09) —
`Przeszywająca skuteczność ( puncture )`, stated as ignoring armour, magic
resistances, absorption, magic absorption, evade and block points, with the
variable being the ignored share and the **initial value 12%**. The one occurrence
in the material states 12, which is that initial value. Production build
`1786514810315` composes `msg_+legbon_puncture %val%`.

⚠️ **One occurrence.** The join to the figures it affects is not stated and is not
inferred: the entry claims the meaning, not an arithmetic.

---

## Keys the protocol states on a skill announcement

These qualify the skill being announced: what it costs, what it grants, whom it
affects. **None of them reports anything that happened to anybody**, which is
what they have in common.

The pattern was settled twice already, by `active_absorbdest_per` and
`combo-max` above: the announcement states an input, and whatever it is then
worth arrives later as ordinary figures, already computed. So none of these is a
figure anything totals, and attaching one to a later blow would be the join the
protocol never states (§5).

**They are read all the same, and are `decoded` for it.** They needed a contract
change rather than a decoder change — `skill-used` carried a name and an id and
had nowhere to put an effect — which is `[ASK]` under §4; it was asked and
granted on 2026-08-11, and `SkillUsedEvent.declared` is where they now land.

What decided it was the cost of leaving them unread. An unread key means *this
total may be low*, and the panel says so beside the figure; these eleven marked
111 occurrences that way, none of which could lower any total. A warning that
fires when nothing is wrong is a warning nobody reads, which would cost exactly
the keys that do mean something.

Their shape is checked rather than assumed: a value that will not read as a whole
number sends the key back to unread, so a day when one of these starts carrying
something else is loud rather than silent.

*Evidence, shared:* every occurrence of every key below rides a message carrying
`tspell`, and none rides a blow — measured across every capture. All appear only
in group fights. Held by `tests/core/skill-announcement-rule.test.ts` for
`combo-max`; the rest rest on the measurement alone.

### `active_decblock_per` — decoded

A reduction of the target's chance to block, granted by the announced skill.

*Shape:* 215 occurrences; on a skill announcement; a whole number

*Help:* names `active_decblock_per`

*Evidence:* article view,372 (read 2026-08-09) names it among the effects that
lower block chance. 26 occurrences, values 1, 2, 4 and 11. The client hides the
key: production build `1785244275300` gives it an empty `break` in the battle
switch, beside `active_absorbdest_per`.

### `active_decblock_per-enemies` — decoded

The same reduction, aimed at the opposing side rather than at one target — the
`-enemies` suffix the protocol uses elsewhere for the same distinction.

*Shape:* 67 occurrences; on a skill announcement; a whole number

*Help:* names `active_decblock_per-enemies`

*Evidence:* article view,372 (read 2026-08-09), which lists it beside
`decblock_per` and `active_decblock_per`. 11 occurrences, every value `10`.

### `active_block_per` — decoded

An increase to the announcer's own chance to block.

*Shape:* 80 occurrences; on a skill announcement; a whole number

*Help:* names `active_block_per`

*Evidence:* article view,372 (read 2026-08-09) at the engine name
`active_block_per`, described as raising block chance and applied at the
initiation layer. 10 occurrences, every value `15`.

### `alllowdmg` — decoded

A reduction to the damage dealt by everyone on the opposing side.

*Shape:* 67 occurrences; on a skill announcement; a whole number

*Help:* names `alllowdmg`

*Evidence:* article view,372 (read 2026-08-09) at the engine name `alllowdmg`,
described as lowering the damage of all characters in the opposing team by the
share the parameter sets. 11 occurrences, every value `5`.

### `allslow_per` — decoded

An attack-speed reduction applied across the opposing side.

*Shape:* 73 occurrences; on a skill announcement; a whole number

*Help:* names `allslow_per`

*Evidence:* article view,372 (read 2026-08-09), which lists it among the effects
combining additively to change attack speed. 5 occurrences, every value `14`.

### `aura-ac_per` — decoded

An aura raising armour, granted to the announcer's team.

*Shape:* 19 occurrences; on a skill announcement; a whole number

*Help:* names `aura-ac_per`

*Evidence:* article view,372 (read 2026-08-09), which lists it among the effects
that raise armour. 4 occurrences, every value `20`.

### `aura-resall` — decoded

An aura raising the team's resistances to fire, cold and lightning, in
percentage points.

*Shape:* 19 occurrences; on a skill announcement; a whole number

*Help:* names `aura-resall`

*Evidence:* article view,372 (read 2026-08-09) at the engine name `aura-resall`.
4 occurrences, every value `15`.

### `aura-sa_per` — decoded

An aura raising the team's attack speed.

*Shape:* 32 occurrences; on a skill announcement; a whole number

*Help:* names `aura-sa_per`

*Evidence:* article view,372 (read 2026-08-09), which lists it among the
attack-speed effects. 4 occurrences, every value `20`.

### `mana` — decoded

Mana the announced skill costs. **Signed, and negative in every occurrence** —
the protocol states the change, not the price as a positive number.

*Shape:* 89 occurrences; on a skill announcement; a whole number

*Help:* names `mana`

*Evidence:* article view,372 (read 2026-08-09) documents mana as a resource some
skills consume. 15 occurrences, all negative, 10 of them beside `energy`.

### `energy` — decoded

Energy the announced skill costs, the same shape as `mana`. Every occurrence in
the captures states `0`, which is why nothing here claims it is ever otherwise.

*Shape:* 46 occurrences; on a skill announcement; a whole number

*Help:* names `energy`

*Evidence:* article view,372 (read 2026-08-09) documents energy as a resource
some skills consume. 10 occurrences, every one beside `mana`.

### `shout` — decoded

A provocation: the announced skill forces those it covers to attack a named
combatant. The value is that combatant's **name**, so it is read at run time and
never stored here — the same footing as `tspell` (NOTICE.md).

*Shape:* 89 occurrences; on a skill announcement; text

*Help:* names `shout`

*Evidence:* article view,372 (read 2026-08-09) at the engine name `shout`,
described as forcing covered characters to attack a chosen target. 11
occurrences, every one on an announcement that also carries
`active_decblock_per-enemies` and `alllowdmg`.

### `aura-adddmg2_per-meele` — decoded

The share by which an aura raises the melee damage of the team members standing
in the front position. Stated on the announcement as an input; what it comes to
arrives later as ordinary damage, already raised.

*Shape:* 22 occurrences; on a skill announcement; a whole number

*Help:* names `adddmg2`

*Evidence:* article view,372 at the engine name `aura-adddmg2_per-meele` (read
2026-08-09) — the help prints this key in full, unusually — stated as raising the
damage of every team member who begins the fight in the first position, with the
variable being the share of physical damage raised. All 4 occurrences state 5 and
ride an announcement carrying `shout`. Production build `1786514810315` composes
it through the shared `skill_<key> %val%` branch.

### `+spell-taken_dmg-all` — decoded

That the announced skill applies the added-damage effect to **everyone**, rather
than to one target. Carries no figure: it names which variant of the effect the
skill is, and the share it applies is not on this message at all.

*Shape:* 32 occurrences; on a skill announcement; no value

*Help:* names `taken_dmg`

*Evidence:* article view,372 (read 2026-08-09) documents `taken_dmg_per-all` as
the variant applying the effect to all opponents, beside `taken_dmg_per` and
`taken_dmg_per-row`. Production build `1786514810315` composes this branch as
`end-game-without-percent<key>` and interpolates nothing — no `%val%`, and the
captures agree that no value ever arrives.

⚠️ **Read as a declaration carrying no amount**, which is the announcement-side
counterpart of `+legbon_holytouch`. A value arriving on it sends the key back to
unread rather than being dropped beside the flag.

### `en-regen-cast` — decoded

That the announced skill was cast to restore energy, and on whom. Carries no
figure of its own — the client's own sentence for it interpolates two combatant
names and no value.

*Shape:* 5 occurrences; on a skill announcement; no value

*Help:* names `regen`

*Evidence:* article view,372 (read 2026-08-09) documents `en-regen` as the effect
restoring energy each turn; this is the cast that applies it. Production build
`1786514810315`: `case"en-regen-cast"` composes
`msg_en-regen-cast %name% %target%` with the caster's and the target's names
substituted and no `%val%`.

⚠️ **Energy, which no total here keeps** — so the key is read to stop it warning
that a damage total may be low, and reaches no figure. The one occurrence rides an
announcement that also carries `heal_target` and `combo-max`.

---

## Keys that are a message by themselves

Each of these is the **only key in its message** — measured, without exception.
They describe the fight's progress or the client's own display rather than
anything one combatant did to another, which is why none feeds a statistic.

Having no blow and no announcement to ride, they had nowhere to land until
`DeclarationEvent` existed; they are `decoded` into it now, and it reports no
figure anything totals. `step` in particular is **not** read as a turn boundary:
what is read is that the message stated `step` about a combatant, which is all
the protocol says.

⚠️ **A turn is not found in any key of these, or of any other** — measured over
every capture, against the 236 keys the client branches on. Nothing here counts
turns, and the panel no longer divides by them.

### `step` — decoded

Carries **no value at all** and names one combatant in the actor slot with no
target. Every occurrence is a message holding nothing else, which is what a turn
boundary would look like — but the protocol does not say that, and this entry
does not either. The arithmetic agrees: the occurrences counted below stand
against 1228 turns in the same material, and one capture contains none at all.

*Shape:* 124 occurrences; alone in its message; no value

*Help:* names `step`

*Evidence:* not documented. Article view,372 (read 2026-08-09) was searched for
`step`; the only hit is inside a longer Polish word, which is the false positive
§7.6 warns about rather than a mention. Every occurrence is valueless and alone,
always with an actor and never a target.

### `prepare` — decoded

A skill being prepared rather than used, stated as `name(percent%)`. The name is
the client's display text, so no example of one appears here.

*Shape:* 150 occurrences; alone in its message; text

*Help:* names nothing of `prepare`

*Evidence:* not documented — article view,372 (read 2026-08-09), searched for
`prepare`, which does not occur. Every occurrence is the only key in its message,
every value matches that shape, and each has an actor and no target.

### `txt` — decoded

Free text the client shows in the battle log. **Nothing of it is stored here**,
in this file or in any test: it carries the game's own sentences and player
names, which NOTICE.md keeps out of the repository entirely.

*Shape:* 175 occurrences; alone in its message; text

*Help:* names nothing of `txt`

*Evidence:* not documented — article view,372 (read 2026-08-09), searched for
`txt`, which does not occur. Every occurrence is alone in its message, naming no
combatant at all — which is why it opens no turn and continues the one it
follows.

### `+exp` — decoded

Experience awarded. Names no combatant, and every occurrence is at the end of a
fight.

**Read as a declaration and counted as nothing**, because experience is not
damage and the panel counts what combatants did to each other. Nothing about it
is uncertain; it is simply out of scope — which is a reading, and a different
claim from a key nobody has looked at.

*Shape:* 2 occurrences; alone in its message; a whole number

*Help:* names `exp`

*Evidence:* an integer, alone in its message with neither side named. Not
documented as a protocol key in article view,372 (read 2026-08-09).

### `+ph` — decoded

Honour points paid for winning a duel. Names no combatant — the winner is stated
a message earlier, by `winner` — and arrives last, after the outcome.

**Read as a declaration and counted as nothing**, on the same ground as `+exp`: a
currency held outside the fight is not something one combatant did to another.

*Shape:* 1 occurrences; alone in its message; a whole number

*Help:* names `honoru`

*Evidence:* article view,372 at the heading *Punkty Honoru* (read 2026-08-12),
which gives the points as a currency awarded to the winner of a player-versus-
player duel and taken from the loser, with the conditions a fight has to meet to
be fought for them and the order the figure is computed in. Production build
`1786514810315` composes it as `msg_+ph %val%`. The one occurrence is the last
message of the only duel between two players in this material.

### `en-regen` — decoded

Energy restored to a combatant this turn, stated as a message of its own. Read
and counted as nothing: energy is a unit no total here keeps, the same standing
`mana` and `energy` have on an announcement.

*Shape:* 24 occurrences; alone in its message; a whole number

*Help:* names `regen`

*Evidence:* article view,372 at the engine name `en-regen` (read 2026-08-09),
given as a passive that raises the energy restored with each turn the character
takes, with the variable being that number of points, and with the restored
energy capped at the pool the character began the fight with. Every occurrence
states 2 and each is the only key in its message. Production build
`1786514810315` composes it through the shared `bonus_<key> %val%` branch.

⚠️ **Not joined to a combatant here.** Like the other standalone keys it reaches
no row: the message names a side, and what the panel does with a declaration is
show it, not add it.

### `afterheal` — decoded

Health restored to a combatant by a healing talisman **once the fight is over**.

**Read as a declaration and counted as nothing**, and it is the only declaration
here in a unit this meter does keep. That is why the type had to say so: the
first two shapes a declaration takes are an input and an outcome in a unit no
total keeps, and this is neither. What disqualifies it from a total is *when*,
not *what* — a meter whose unit is the fight cannot count health restored after
the fight ended without making its own totals mean something else.

Three sources agree and the third is our own material:

- the help gives the arithmetic and the moment — `hp restored = min(afterheal,
  hp start - hp current)`, under talismans that act after the battle;
- every occurrence arrives **after** the `winner` and `loser` messages;
- the recipients' health does not move in the payload's own snapshots. In the
  09:14 fight they end at 9677/12466, 16667/18843 and 4989/9423 both before and
  after — each well below their maximum, so a heal that had landed would show.

⚠️ **No health verdict, and the witness cannot supply one.** Silence here is a
position rather than an omission: the figure moves no health that any snapshot in
the fight records, so claiming it does would make
`tests/core/health-witness.test.ts` skip both of these calls whole and lose the
coverage for nothing. It could not have judged them anyway — an `afterheal`
message states no health percentage in either slot, so there is no figure for the
replay to compare against, and the reading rests on the snapshots either side of
the call instead.

⚠️ **What the material cannot settle.** Whether the value is the health restored
or the talisman's own parameter. The two coincide in every occurrence here,
because each recipient had lost more than the figure stated, so `min` returns the
parameter either way. The client's sentence reads as the figure restored; nothing
measurable here proves it, and nothing downstream depends on which it is.

*Shape:* 5 occurrences; alone in its message; a whole number

*Help:* names `afterheal`

*Evidence:* article view,372 at the engine name `afterheal` (read 2026-08-09),
which gives the formula above, the cap at the health the character started the
fight with, and the rule for a character carrying several such talismans — only
the one with the highest average restoration is used. Production build
`1786514810315` composes it as `msg_afterheal %name% %val%`; the development
build `1781609507010` carries the same branch with its original comment, which
reads the value as the number of health points restored.

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
