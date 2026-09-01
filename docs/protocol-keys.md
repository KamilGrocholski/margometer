# Protocol keys — what has been looked into

What we know about individual keys, and how we came to know it. Read this before investigating a
key: some are already settled, and some were investigated and deliberately left alone.

Each entry carries a **verdict** and its **evidence** — a measurement over the captured fights, a
citation from the game client with the build it was read on, or the game's published help with the
date it was read (`deno task help`). A verdict without evidence is a guess someone will later
mistake for a fact.

The help is the only source that says what an effect _does_, so it is the only one that can settle a
_meaning_. It settles nothing else: the `*Health:*` line below is a measurement or it is absent, and
no sentence of the game's is copied in here — an entry carries the locator and our own words.

**Guarded** by `tests/repository/protocol-keys.test.ts`, which re-counts what this file claims of
the published help against the frozen table beside it. Coverage over the material is held elsewhere
and as an assertion rather than a report: `tests/core/fight-decoder.test.ts` fails if anything in
`captures/` goes unread, and `tests/game/battle-session.test.ts` fails per recording.

## What every entry states about its own material

Prose is where a claim goes to stop being checked. So the part of an entry a machine can re-earn is
written on one line, in a vocabulary this file defines:

```
*Shape:* 26 occurrences; on a skill announcement; a whole number
```

Three claims, all re-measured on every run, and all of them about **every** occurrence of the key
rather than the usual one:

- **how many** the captures carry;
- **where** they sit — `alone in its message`, `on a skill announcement`, `on a blow`,
  `on a message reporting damage`, or `anywhere`. One phrase has to hold for all of them, so where
  two would fit, the weaker is the true one, and the last is the floor for a key that fits none of
  the four;
- **what the key states beside itself** — `no value`, `a whole number`, `a number`, or `text`, read
  through the primitives in `libs/`, not by eye.

A phrase outside those lists is **refused** rather than read as silence, the way a misspelled health
verdict is. An entry may omit the line only for a key the captures do not carry; every other
omission fails.

This is deliberately not the whole of an entry. What a key _means_ still lives in the prose and
rests on the help and the client — no line of vocabulary is going to check that. What it stops is
the other half: a count or a placement that was true when someone typed it and has been quietly
wrong since.

### And what it says about the published help

The same idea, applied to the one source that is somebody else's document and can change without
telling us:

```
*Help:* names `verycrit`
*Help:* names nothing of `tenacity`
```

**The line states an occurrence; the prose states what it means.** `names` claims only that the
article carries the phrase — whether it _documents_ the key is a paragraph a person has to read, and
three entries here occur in the article without being documented by it. Every phrase is re-counted
against `frozen/help-phrases.ts`, which `deno task help freeze` writes from the cached dump, by
`tests/repository/protocol-keys.test.ts`. Counts only: the help's own sentences never enter this
repository, and a count is our measurement of the article rather than a piece of it (NOTICE.md).

**An entry citing the help must carry the line.** Not every entry — a key nobody has asked the help
about says nothing, and silence is the honest answer there.

**A claim of silence must have tried the key's stem**, and this is the rule that does the work. The
help joins an article to a key through the engine name it prints in parentheses, and for a compound
key that name is routinely the tail alone — `legbon_facade` is published as `facade`. So
`names nothing of` has to list the key without its sign, and the tail after the first separator.

One tail is not a name, and asking for it makes a true silence unstateable: `-allies` says _whom_ an
effect reaches, so the engine name of `removedot-allies` is its **head**, and `allies` — which the
article carries on every documented sibling — is what the claim would have had to call absent. Where
the tail is one of those suffixes the head is what has to have been searched
(`tests/repository/protocol-keys.test.ts`).

Re-counting alone would not have caught anything. The entry that got `+legbon_holytouch` wrong
recorded the phrases it searched, exactly as §7.6 asks — `legbon_holytouch` and `legbon` — and both
count zero. A guard re-measuring only what was listed would have agreed with the bug, which is the
failure §7.5 names: a guard that names the same wrong thing the code did.

The phrase is stated by a person and never derived. `( freeze )` counts zero where bare `freeze`
counts four, so a rule that parenthesised the engine name would bless a false silence for a key this
file cites the help for.

---

## Where health comes from, and why every entry states one

No key moves health. The client reads the health percentage off the **side segments** and applies it
before it looks at a single key: `battleMsg` splits the message, and for each side that carries `=`
it does `warriorsList[id].tmpHpp = parseFloatHP(…)`. The switch over keys that follows composes the
battle log and nothing else — it contains no assignment to a fighter's health at all.

_Evidence:_ production build `1785244275300`, the same in development build `1781609507010`. Both
`tmpHpp` assignments in the production bundle sit in `battleMsg`, ahead of the switch; searching the
whole switch region for an assignment to a fighter's health finds none.

So the question a key can answer is not "does it change health" but **"does it report a health
figure the arithmetic has to account for"**. An entry that has settled that says so with one line:

```
*Health:* moves health
```

There is no opposite value, and the omission is the point. Silence means the material has not
settled it — which is different from "it is harmless", and the two must not share a spelling.
`tests/core/health-witness.test.ts` reads this line and skips any engine call carrying such a key,
because a figure it cannot add is a figure that makes every later comparison in that call wrong.

**The evidence is always a measurement on the captures**, never a citation: having established that
the client only composes sentences, there is nothing in it left to cite. The measurement is the same
one every time, and the guard re-runs it: admit the key to the witness and a comparison must
disagree **on a message carrying that key**. A verdict that cannot be attributed to its own key is a
cascade from a neighbour, and is not a verdict.

**A key with no entry is let through**, and the witness is what pushes back: if it does report
health, its comparisons stop matching. That is the design, not a caveat — the alternative is an
entry per key with nothing behind it, which is the kind of bulk this directory exists to refuse.

### And who the figure is charged to

A key that reports a health figure raises a second question the panel cannot avoid answering: **who
did it**. Every entry stating `*Health:* moves health` answers it on one line, from a closed list:

```
*Cause:* the subject's own
```

| `*Cause:*`                 | means                                                                                                                                                    | held against                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `the subject's own`        | the published help says the effect belongs to the combatant it moved health on, so the two ends are one person (§9.6)                                    | `SELF_SOURCED_HEALING_KEYS`                               |
| `the announcement's actor` | the figure sits on the message **target** and a skill announcement names the giver — the message's own where it carries one, the one before it otherwise | `HEALTH_CHANGE_KEYS`, the entries reading the target slot |
| `the message actor`        | the protocol states the cause in the actor slot of the message itself                                                                                    | `SIDE_SHARE_HEALTH_KEYS`, and the attack family           |
| `the wound's attacker`     | an **earlier** message announced the effect and named who applied it, and the figure says which application is ticking (§9.6)                            | `WOUND_ANNOUNCEMENT_BY_TICK_KEY`                          |
| `nobody`                   | the protocol states no cause, and nothing else supplies one                                                                                              | the rest of `HEALTH_CHANGE_KEYS`                          |

**Required exactly where `*Health:*` is, and refused everywhere else.** A key that reports no health
figure charges nobody with anything, so a line on it would be a claim with no consumer — §7.1's rule
applied to a document.

`tests/repository/protocol-keys.test.ts` re-earns every token from `src/core/fight-decoder.ts` **in
both directions**, so a key cannot be listed as the subject's own here and read some other way
there, nor read that way and left saying `nobody`. A phrase outside the list is **refused** rather
than read as silence, for the reason the health line gives: it would look more settled than silence
while checking nothing.

⚠️ **`the subject's own` is the one token backed by a citation rather than by a measurement**, and
the three keys carrying it say where the citation is in their own `*Evidence:*`. It is `[ASK]` to
give it to a fourth key (§9.6).

⚠️ **Two keys can be written identically and answer differently.** `heal` and `poison` arrive in the
same shape — the subject in the actor slot, a literal `0` at the other end — and this line is where
they part: the help documents one of them as the Character's own effect and says nothing about who
applied the other. That is a reading of the documentation, not of the message, which is exactly why
it is written down per key instead of derived from the grammar.

---

## Keys the decoder reads

### `winner` — decoded

The combatants on the winning side, as a single string, names separated by a comma and a space.
Appears in a message that names no combatant at all: it is about the fight, not about anyone in it.

_Shape:_ 28 occurrences; alone in its message; text

_Help:_ names `max_moves`

_Evidence:_ every occurrence in every captured fight has that shape, and each fight ends with
exactly one `winner` and one `loser`. For `?`: production build `1786514810315`, the same branch in
development build `1781609507010`, and the published help view,372 (read 2026-08-18) for the cap
that produces it.

### `loser` — decoded

The same, for the losing side — with the one exception the entry above states: the `?` that key
spends on a fight nobody won is not a value this one carries, and it is left unread here rather than
read as a side of that name.

_Shape:_ 28 occurrences; alone in its message; text

### `+oth_dmg` — decoded

Damage that landed on a combatant the protocol names **by name**, alongside an attack aimed at
someone else. Value is `amount,kind,name(percent%)`; the percentage belongs to the named combatant,
not to the message target. The damage has already been reduced — unlike `+dmg`/`-dmg` there is no
second figure.

_Health:_ moves health

_Cause:_ the message actor

⚠️ **The middle member can be blank, and blank is the plain element.** A fifth of the occurrences
write it as a single space. The client spends that member on one thing — `<b class=dmg"+D[1]+">`,
production build `1785244275300` — and a class attribute of `"dmg "` is the class `dmg`, so the game
makes no distinction there. Read literally it made `dmg` a second element beside `dmg`, splitting
107 952 points of physical damage into two rows nothing on screen could tell apart. Held by
`tests/core/fight-decoder.test.ts`.

_Shape:_ 1131 occurrences; on a message reporting damage; text

_Evidence:_ in every call where a target lost more health than the attack accounted for, the
shortfall equalled this amount exactly — 110, 247 and 123 in three separate calls. Three independent
confirmations on real material, which is why this is not read off the client's sentence template.

### `legbon_lastheal` — decoded

Healing stated **by name**, the mirror of `+oth_dmg` and the only key that restores health to
somebody neither side of its message names. Value is `amount,name(percent%)` — the figure first and
the name second, the opposite order from `+oth_dmg`, which is why the two cannot share a reader.

_Health:_ moves health

_Cause:_ the subject's own

_Shape:_ 13 occurrences; on a message reporting damage; text

_Help:_ names `lastheal`

_Evidence:_ article view,372 at the engine name `lastheal` (read 2026-08-12): a legendary bonus that
heals once per fight by a random amount when damage takes the holder below 18% of their pool, and
only when the blow was not lethal. Both halves close on our own material. The trigger reads off the
heal's own segment — what the combatant holds after, less what was restored, is what the blow left
them on — and every occurrence in `captures/` as of 2026-08-23 is under the documented 18%, the two
closest at 0.1675 and 0.1714 of the pool, which is what makes the threshold a line this material can
see rather than a bound nothing approaches. The arithmetic closes too, on every occurrence with a
stated health before it, to within 0.01% of the pool. Production build `1786514810315` splits the
value on the comma and renders the second member as `%val%`, which is where the order of the two is
read from.

⚠️ **It rides a group blow as readily as a single one**, which is what moved this entry's placement
from `on a blow`. Most arrive inside a message that also carries `+oth_dmg` at nine other
combatants, so the damage that triggered it is the segment naming the healed combatant and not the
message's own figures. A reader that took the whole message's damage would attribute nine people's
losses to one.

⚠️ **The bonus is stated before the blow that fired it, and the two share a percentage.** The
segment order is not the order of events: the heal comes first and the damage that took the holder
under the threshold follows it, both carrying the health the holder is left on afterwards. It only
becomes visible where the same combatant is struck **again** in the same message, because then a
third figure states a different percentage — and until
`captures/2026-08-23-tempest-grupa-vs-hildur-auto-1786514810315-none` no recording carried one.
There combatant 466747 takes 2 798, is healed 7 987 beside a 2 416 hit stating the same 40.00%, and
is then struck for 2 971 more; charging that last hit to the heal's own gap put the reading 2 971
out on a pool of 29 823. So the damage that pairs with the bonus is the segments stating the bonus's
own percentage and nothing past them (`tests/core/last-heal-rule.test.ts`).

⚠️ **One message can state it twice.** A group blow can drop two holders below the threshold at
once, and the same recording carries the first — 466476 and 447544 healed in one message. A reader
counting messages rather than segments loses the second and reports nothing wrong.

⚠️ **The healer is the healed, and the message's actor is neither.** The actor is whoever struck the
blow; the help says the bonus is the **holder's** own and that the holder is the one it heals, so
the combatant named inside the value is both ends of it and is credited with giving it (§9.6, engine
name `lastheal`, read 2026-08-19).

⚠️ **Read the value, never a slot.** Most occurrences ride a group blow whose target is a third
party, so both slots are the wrong combatant — the actor would credit an attacker with healing their
own victim, and the target would credit whoever that blow happened to land on.

⚠️ **The witness cannot see this one.** The capture that carried it first has no snapshot taken
before its messages — the whole fight arrives in one engine call — so the replay produces no
comparison for it at all, and the arithmetic above is held by `tests/core/last-heal-rule.test.ts`
instead. The fifth occurrence is not measurable there either, and for a different and documented
reason: a `healall_per` fired between the last health the protocol states for that combatant and the
heal itself, and that is health stated nowhere else.

### `heal` — decoded

Health restored to, or lost by, the combatant in the **actor** slot of a message whose target is
nobody: `<combatant>=<percent>;0;heal=<amount>`. The slot holds the subject here rather than an
attacker, and no message of this shape names anyone else. Read as a positive health change; the
client will state a loss with a negative amount, which needs no special case because the figure is
signed.

_Health:_ moves health

_Cause:_ the subject's own

⚠️ **The restoring direction only — and the negative turned out to be the same effect.** The figure
is signed, and a negative one used to be filed here as something no documentation accounted for. It
does account for it: the help states the accumulated value of this statistic as the sum of `heal`
and `adest` over equipment and blessings, and `adest` as an item bonus that lowers the owner's share
of it (article view,372, engine names `heal` and `adest`, read 2026-08-22). Below zero the effect
drains instead of restoring.

⚠️ The help and the material disagree on one point, and §7.6 keeps the disagreement rather than
settling it: that same section states the accumulated value cannot fall below zero.

_Help:_ names `( heal )`

⚠️ The older development build `1781609507010` passes `multi[1]` straight through, with no absolute
value and no direction. This entry is why §7.6 says production decides: read there, the member looks
like a plain number, and the half that makes it legible is missing.

_Shape:_ 2211 occurrences; alone in its message; text

_Evidence:_ of the four ways to sign `heal` and `poison`, only healing added and poison subtracted
closes the stated percentages — the other three leave hundreds of comparisons disagreeing. Applying
it moved the witness from declining every call that contains it to agreeing on them.

### `poison` — decoded

Damage over time, same shape and same slot as `heal`, read as a negative health change.
**Unattributed by construction:** the protocol does not say who applied it, so nothing downstream
may credit it to anyone (§5).

⚠️ **And no earlier message names it either — the `injure` join fails here on both halves.** §9.6's
fourth clause fills a missing end from an announcement an earlier message of the same fight carried,
which takes three things: a key announcing the effect, a figure on that key, and a documented rule
making one application the owner of what is ticking. This key has neither the announcement nor the
rule — see _Evidence:_ — and the missing announcement is re-earned every gate by
`tests/core/anguish-rule.test.ts` (`git show develop:docs/specs/the-ends-a-figure-names.md`, which
asks the same of every tick the client composes).

_Health:_ moves health

_Cause:_ nobody

_Shape:_ 812 occurrences; anywhere; text

_Help:_ names `poison`

_Evidence:_ as above. Before it was read, the first disagreement it caused was
`-10000249=76.05;0;poison=563`. That nobody can be named for it rests on two sources rather than on
the message: the client's key list carries no `+poison` beside `poison` the way it carries `+injure`
beside `injure` (production builds `1786514810315` and `53XkBRxF`, whose lists are identical key for
key; `frozen/protocol-keys.ts` holds the later one), and the help's table of damage over time —
article `view,372` (read 2026-08-19) — puts poison among the types a fresh application does **not**
overwrite, deep wound being the other: a later hit extends what is already ticking and only the
highest figure counts, so even an announcement would not say whose tick this is. Its source is given
there as weapons and skills that apply poison, and a weapon doing it is stated nowhere in the
protocol.

### `fire` — decoded

Elemental damage over time — `poison`'s twin, and the client writes it as one. Same slot, same sign,
same optional second member, so it needed no rule of its own. **Unattributed by construction**, for
`poison`'s reason: nothing in the message says who set the target alight.

⚠️ **Overwritten, and still nobody's — the half of the `injure` join `poison` lacks, without the
other half.** The help's table of damage over time puts fire among the types a fresh application
**does** overwrite, which is the rule §9.6's fourth clause runs a wound on. What is missing here is
the announcement: the client's key list carries no `+fire`, so nothing states that an application
happened, let alone with what figure. The captures as the set stood 2026-08-19 show what reading the
neighbouring message instead would come to — all 12 ticks fall on one victim, the figure changes
across the fight (96, then 97, then 117 twice, then 124 for the last eight), and the blow standing
before them belongs to eight different combatants
(`git show develop:docs/specs/the-ends-a-figure-names.md`).

_Health:_ moves health

_Cause:_ nobody

_Shape:_ 43 occurrences; alone in its message; text

_Help:_ names `( fire )`

_Evidence:_ production build `1786514810315` composes `msg_fire %name% %val%` from the **actor**
slot and splits the value on the comma exactly as `poison` does, and the same bundle counts the key
into its own damage total — `updateStat("damage-fire", …)` beside `damageSum += createDmgStat(…)`.
The help at article view,372 (read 2026-08-09) documents `fire` as a damage type carried by weapons
and set on a monster by its profession, which settles what it is and not what the key reports. The
captures settle that: all 12 occurrences sit on one combatant in
`2026-08-15-tempest-grupa-vs-draugr-1-1786514810315-none`, against a pool of 184 680, and before it
was read the witness disagreed on every one of them and on nothing else. Reading it closed all 12
first try. That the type is overwritten rather than extended is the same article's table of damage
over time (read 2026-08-19), and the absence of `+fire` from the client's list is
`frozen/protocol-keys.ts`, re-earned by `tests/repository/protocol-keys.test.ts`.

⚠️ **`frost` shares that branch in the client and is not read.** No capture carries one, so an entry
for it would be a verdict with nothing behind it — it stays unread and loud (§3), which is the only
honest state for a key nobody has measured. `light` was in this sentence until material arrived; its
entry is below.

### `light` — decoded

The third of that branch, and `fire`'s twin down to the arm the client composes it in. Same actor
slot, same sign, same optional second member, so it needed no rule of its own either. **Unattributed
by construction**, for `poison`'s and `fire`'s reason: nothing in the message says who called the
lightning down.

⚠️ **Nobody's, and for the narrower of the two reasons.** The client's key list carries no `+light`,
so nothing announces that an application happened — the same missing half that keeps `fire` from
being read the way §9.6's fourth clause reads a wound. Here there is not even a figure to match one
against, and every occurrence falls on the one opponent of the recording it is in — measured over
the set as it stands 2026-08-26, two recordings carry the key and each has a single victim for all
of it — so the neighbouring message would be the only thing left to read and that is the guess §5
refuses.

_Health:_ moves health

_Cause:_ nobody

_Shape:_ 69 occurrences; alone in its message; text

_Help:_ names `( light )`

_Evidence:_ production build `1786514810315` composes `msg_light %name% %val%` from the **actor**
slot, splitting the value on the comma into a second sentence exactly as `fire` does, in the arm
directly beside it. The help at article view,372 (read 2026-08-23) documents it twice: once as a
damage type carried by weapons, and once in the list of effects a monster's profession can apply,
beside `poison` and `wound` — which settles what it is and not what the key reports. The captures
settle that, by the only evidence this repository takes for a key that moves health: the 27
occurrences it had then all sat on one combatant in
`captures/2026-08-23-tempest-grupa-vs-hildur-1786514810315-none.json` against a pool of 279 072, and
before it was read the witness disagreed 195 times, on that combatant and on nothing else in the
corpus. The 12 that `captures/2026-08-26-luvia-grupa-vs-draugr-53XkBRxF-0.8.1.json` added on
2026-08-26 are the same shape — one victim, the recording's single opponent — and the witness judges
that fight and agrees. Reading it closed every one first try and introduced no disagreement anywhere
(`tests/core/health-witness.test.ts`). The absence of `+light` from the client's list is
`frozen/protocol-keys.ts`, re-earned by `tests/repository/protocol-keys.test.ts`.

### `anguish` — decoded

**Krwawa udręka** — the bleeding a legendary bonus lays on the target of a blow, ticking afterwards.
The fourth key written exactly as `poison`, `fire` and `light` are: the subject in the actor slot of
a message naming nobody at the other end, one figure, read as a negative health change.

_Health:_ moves health

_Cause:_ nobody

_Shape:_ 70 occurrences; alone in its message; a whole number

_Help:_ names `anguish`

_Evidence:_ the health witness reaches this key's fight and closes on it — 421 comparisons in
`captures/2026-08-25-luvia-grupa-vs-mamlambo-auto-none-0.8.1.json`, all agreeing, and flipping
either the sign or the slot breaks them (`tests/core/health-witness.test.ts`). The figure is legible
without that too: in that recording every one of the eleven ticks states 184 against a pool of 43
092 and moves the stated percentage down by 0.42 to 0.43 points, which is what 184 of that pool
comes to. The published help documents the effect at article `view,372` under the engine name
`anguish` (read 2026-08-25) — a legendary bonus applying bleeding damage to the target of a blow,
spread over five turns, occurring only where the blow met no evade, `arrowblock` or `parry`, with
the damage given by a formula over the item's apparent level and the character's base attributes.
Production build `1786514810315` composes it from the actor slot off `c.tmpHpp` and splits the value
on the same comma `poison` and `fire` split on; no occurrence here carries a second member. What
this reading rests on beyond the arithmetic — that a tick is charged to its victim and never to
whoever applied it — is measured by `tests/core/anguish-rule.test.ts`. Three recordings carry it as
the set stood 2026-08-25, and the two against a Draugr are what make the refusal legible rather than
theoretical: in `captures/2026-08-25-luvia-grupa-vs-draugr-none-none.json` two combatants apply the
bleed to the same victim and 25 ticks come back off it, each stating one of several figures and none
of them announced.

### `heal_target` — decoded

Healing directed at the message **target**, which is what separates it from `heal`: same figure,
same sign, the other slot. The only key of this family that does not put its subject in the actor
slot, and the reason the decoder carries a slot per key rather than assuming one.

⚠️ **Being a self-cast is not what makes those three self-sourced.** This key is charged to whoever
announced it, whether or not that is the combatant it healed; the other three are charged to the
healed because the **help** says the effect is theirs. A round reading "actor equals target" off
this entry and applying it to those would be reading the grammar where the difference is in the
documentation.

_Health:_ moves health

_Cause:_ the announcement's actor

_Shape:_ 117 occurrences; on a skill announcement; a whole number

_Evidence:_ reading it on the target closed every comparison in the calls that carry it, first try
and with no adjustment. Read on the actor instead, the same calls disagree.

### `npc_heal` — decoded

Health restored to a **monster**, stated on a message that names two combatants and charged to the
first of them. The one key of this family where two ends are named and the figure belongs to the
actor rather than to the target: `heal_target` directly above names two and belongs to the second,
and the client builds both sentences from the same template with a different name in the hole.

_Health:_ moves health

_Cause:_ the message actor

_Shape:_ 3 occurrences; alone in its message; a whole number

_Help:_ names `( heal )`

⚠️ **That line is the stem, and the stem documents a different mechanic.** Article `view,372`
carries no `npc_heal` and describes no monster-side restoration; what it carries under the engine
name `heal` is the Character's own over-time statistic, which is the key three entries above and not
this one (searched 2026-08-25, for the full key and for the mechanic by name). §7.6 asks that a
claim of silence try the stem, and this is what trying it found: a documented word for something
else.

_Evidence:_ production build `1786514810315` composes `msg_heal_target %target% %val%` from
`c.name`, where `heal_target` on the branch immediately above composes the identical sentence from
`d.name` — and `c` is the slot `heal` is already read in. The health witness agrees: reading it on
the actor closed every comparison in the calls that carry it, and reading it on the target breaks
them (`tests/core/health-witness.test.ts`). The two occurrences stating 1724 each raise the actor's
stated percentage by exactly 4.00 points of a 43 092 pool, and the third states `0` and moves
nothing — the zero being the reason `tests/core/npc-heal-rule.test.ts` exists, since a key read only
above zero passes every arithmetic check here and still loses a restoration the game reported.
Carried by `captures/2026-08-25-luvia-grupa-vs-mamlambo-auto-none-0.8.1.json` and by no other as the
set stood 2026-08-25.

### `legbon_holytouch_heal` — decoded

Healing, same shape and slot as `heal`, from a legendary bonus rather than a spell. Read
identically; nothing about its **figure** needed a separate rule, and what it does need is a line
saying whose the healing is — the help settles that and the protocol does not.

_Health:_ moves health

_Cause:_ the subject's own

_Shape:_ 141 occurrences; alone in its message; a whole number

_Help:_ names `holytouch`

_Evidence:_ found by the witness rather than looked for. With `heal`, `poison` and `injure` read,
three comparisons still disagreed, all for one combatant and all by the same six percentage points —
`legbon_holytouch_heal=976` against a maximum of 16278. Reading it closed them.

### `injure` — decoded

Damage, applied where it appears — same shape and slot again. A **different key** from `+injure`,
which is not damage; this file previously described `injure` using `+injure`'s evidence, and the
split is what let the two be measured apart.

_Health:_ moves health

_Cause:_ the wound's attacker

_Shape:_ 184 occurrences; alone in its message; a whole number

_Evidence:_ it could not be settled at all until `heal` and `poison` were read, because every call
containing it also contains one of those and the witness declined them all. Once they were read, the
residue was exact: after `-10000249=99.95;0;injure=148` the stated percentage sat 148 below the
arithmetic, and reading it as damage turned that disagreement, and eighty-odd others, into
agreements.

⚠️ **Every tick has an attacker the protocol named, and `*Cause:*` above is where that is read.**
The wound arrives carrying the figure its own announcement stated, and the help says a victim
carries one at a time: article `view,372` at the engine name `injure` (read 2026-08-18) states that
the damage does not accumulate and is overwritten by the freshest value applied to that opponent. So
the freshest `+injure` against a victim is whose wound is ticking, and the figure says which one it
is. Measured over `captures/` as the set stood 2026-08-19: every tick lands on a victim already
carrying a wound, and every one states exactly what that wound announced — on material where a
victim was wounded by three different attackers, which is what makes _freshest_ a claim rather than
a coincidence. Re-earned by `tests/core/injure-rule.test.ts`, and the join is made in
`src/core/fight-statistics.ts` rather than in the decoder — **ADR 0022** carries why, and what a
tick stating anything else is charged to.

### `healall_per` — decoded

Healing by a share of **maximum** health, floored, reaching every combatant on the caster's side and
nobody on the other, and capped. The caster is the actor, and usually the target as well — but eight
of the 115 messages state a different id there, so reading the caster from the target slot would
credit the wrong combatant. Read the actor slot, and read it always: the eight are the whole reason
this sentence names a slot rather than a habit.

⚠️ **A partly sized cast keeps both events.** Where six of eight side-mates could be sized, the
figures for the six are drawn _and_ the cast goes on being counted as missing, so a partial answer
can never be read as a whole one (§9.6). No capture produces one any more; the shape is held by
hand-built fights instead.

⚠️ **The key is carried, and read, and what it buys is a refusal with a side on it.** It was unread
while no capture carried it — reading a shape this repository had never seen would have been
describing a message we had never met (§5) — and
`captures/2026-08-27-luvia-grupa-vs-amaimon-2-53XkBRxF-0.9.0.json` ended that on 2026-08-27. It now
has its own entry below and is decoded as the skill declaration it always was. What its absence buys
is the right to size the casts around it; what its presence buys is the right to refuse **the casts
on the sides its caster faced**, which the help scopes and the protocol names. In that recording the
reducer is one of ours cast at the monster, so nothing of ours was reduced and all three of its
casts are sized — and twenty of their figures are checked against the snapshots of the calls they
stood alone in, exactly (`docs/adr/0010-sizing-a-share-onto-a-side.md`,
`tests/core/combatant-health.test.ts`). A cast on the side a reduction _did_ reach is refused, and
no recording anywhere holds one.

⚠️ **One shape of this key's own value is unmet and would be misread.** The same production build
splits the value on a comma and composes a different sentence when there are two members —
`msg_healall_per_multi %name% %val% %val2%` against `msg_healall_per %name% %val%` — the way `heal`,
`injure` and `poison` do. No occurrence in the captures carries a comma, so the second member has
never been seen and is not read. The reader takes the value whole, which answers `null` on a
two-member value and refuses to size the cast — the safe direction, and stated here because it is
the one that would otherwise be found by a wrong figure rather than by a missing one.

⚠️ **Two captures took a second reading to reach**, and they are the interesting ones:
`2026-08-15-tempest-grupa-vs-draugr-1-1786514810315-none` and
`2026-08-15-tempest-grupa-vs-hildur-1-1786514810315-none` open with a payload carrying 297 and 354
messages and no snapshot beside it, so the first snapshot sits _after_ eight casts nothing could
size. Unwinding the snapshot alone refused both outright. The messages in that opening state health
percentages of their own, and in both captures every one of the eleven combatants is stated before
the first cast — so the entry health is unwound from the first statement about each combatant, and
the snapshot is the fallback rather than the anchor. Five of those eleven are stated by a `step` or
a skill announcement, which is why those two events now carry a health percentage they have no
figure of their own to go beside.

⚠️ **The health witness stopped skipping these calls, and agrees.** It used to decline every engine
call carrying this key, because health moved by an amount nothing could size. It now judges them and
the arithmetic closes: coverage rose in thirteen of the fourteen fights carrying the key — 790 → 945
comparisons on `2026-08-06-tempest-grupa-vs-hildur-1785244275300-none`, 392 → 624 on
`2026-08-12-tempest-grupa-vs-draugr-1-1786514810315-none` — with no disagreement anywhere. The
fourteenth carries all of its casts in an opening call with no snapshot in front of it, which the
replay could never judge whatever the call contained. That is the protocol's own stated percentages
confirming a figure derived from something else entirely, which is the only evidence this repository
accepts for a key that moves health.

_Health:_ moves health

_Cause:_ the message actor

_Shape:_ 115 occurrences; on a skill announcement; a number

_Help:_ names `healall_per`, `lowheal_per-enemies`, `heal_per-enemies`

_Evidence:_ article view,372 at the engine name `healall_per` (read 2026-08-18, first read
2026-08-09) for the four clauses, none of which the protocol states. The reducer at its own engine
name `lowheal_per-enemies` (read 2026-08-18) lists the three effects it reduces and this key is one
of them; `heal_per-enemies` (read 2026-08-18) appears only among the modifiers of the health that
comes off equipment and reduces nothing here. All three are on the `*Help:*` line rather than in
this prose, because a help claim stated in prose is a help claim nobody re-runs. Production build
`1786514810315` for the battle-log composition of `lowheal_per-enemies` and for the two-member split
of this key's own value. Measured on every group fight that carries the key; the casts standing
alone in their engine call are the ones read, so their health deltas are attributable to nothing
else. The share is of the maximum — 7162 restored on a maximum of 23874 at 30%, where 30% of that
combatant's remaining 8749 would be 2624. It floors: a share landing on 5629.5 moved 5629. Capping
at the entry health reproduces every reading whose entry health the capture holds, and the readings
that separate the two caps sat exactly at their entry health while short of maximum and gained
nothing. Dropping the cap entirely reports 81% more healing than happened. Held by
`tests/core/combatant-health.test.ts`, which also holds the exclusion: something has to be excluded
for a missing entry health and something has to survive it, or the cap is confirmed against nothing.

### `bandage` — decoded

Health a combatant restores to themselves, stated on the announcement of whatever ability carries
the effect:
`<combatant>=<percent>;<the same combatant>=<percent>;
tspell=…;skillId=…;bandage=<amount>`. Both
ends are named and they are one person, so nothing here is inferred — this is not a half-named
figure and not a self-sourced one either (§10).

_Health:_ moves health

_Cause:_ the message actor

_Shape:_ 1 occurrences; on a skill announcement; a whole number

_Help:_ names `bandage`

_Evidence:_ article `view,372` at the engine name `bandage_per` (read 2026-08-26) gives the effect
as above; the article does not print the bare key, and the phrase counted for this entry occurs
there inside that name. Production build `53XkBRxF` composes `msg_aura-bandage %val% %name%`, with a
`msg_aura-bandage-multi %val% %val2%` branch where the value splits on a comma — the two branches
`heal`, `poison` and `injure` each take. The figure is health of this protocol's units: on
`captures/2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0.json` the single occurrence states 2488
against a pool of 15 553 and raises its subject's stated percentage from 36.84 to 52.83, where 2488
of that pool is 16.00 points. `tests/core/bandage-rule.test.ts` re-earns it.

### `?dmg*` — decoded

Damage. The client has no case labels for these: its default branch matches a key whose characters
1–3 are `dmg`, treats `+` as dealt and anything else as taken, and calls everything outside that an
unknown parameter. We mirror the rule rather than listing the family, so a kind the game has never
sent still decodes.

_Health:_ moves health

_Cause:_ the message actor

_Evidence:_ the default branch of the battle switch, production build `1785244275300`, identical in
the development build. Which sign is the damage that landed was measured rather than read: health
drop matched the sum of `-dmg*` in 22 of 26 comparisons and the sum of `+dmg*` in **none**.

### `+thirdatt` — decoded

The **Third Blow** rolled: an extra auxiliary attack fired alongside the ordinary one, stated raw.
Damage the shape above cannot reach, because the key carries no `dmg` marker — `fight-decoder.ts`
names this pair instead, which is the one exception the family rule has.

_Shape:_ 24 occurrences; on a blow; a whole number

_Help:_ names `thirdatt`

_Evidence:_ article view,372 at the engine name `of-thirdatt` (read 2026-08-09) describes the event
as an additional auxiliary attack rolled between the main weapon's minimum and maximum damage, and
says its damage is reduced by the same effects as other auxiliary damage — which is the raw and
applied pair the protocol sends. Measured here: 932 → 507, 1130 → 694, 968 → 540, raw above applied
in all three. Production build `1786514810315` renders it into the same column the default damage
branch writes to.

### `-thirdatt` — decoded

The same blow, applied. This is the half that moves health.

_Health:_ moves health

_Cause:_ the message actor

_Shape:_ 24 occurrences; on a blow; a whole number

_Help:_ names `thirdatt`

_Evidence:_ ⚠️ **earned on the health arithmetic, not on the help.** While both halves went unread,
`tests/core/health-witness.test.ts` disagreed eight times in
`2026-08-12-tempest-grupa-vs-draugr-2-1786514810315-none`, every one in the direction of too little
damage decoded. Reading this half closes all eight and opens no disagreement anywhere else. That is
the protocol's own stated percentages settling it, which is the only evidence this file accepts for
a key that moves health.

### `-absorb` — decoded

Damage physical absorption stopped before it reached the target.

_Shape:_ 624 occurrences; on a blow; a whole number

_Help:_ names `absorb`

_Evidence:_ the game's published help, article view,372, at the engine name `absorb` (read
2026-08-09), describes it as a reduction of the physical damage a character is taking at that
moment, capped at a share of the blow and drawn from a pool that runs out — which is why the figure
is sometimes far below that cap. Production build `1785244275300`: the branch appends to a log slot
and assigns nothing. 45 occurrences on
`captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`, every one with a value that
reads as an integer — which the `*Shape:*` line above re-earns over every recording since.

### `-absorbm` — decoded

The same for magical absorption, which the help documents against fire, cold and lightning rather
than physical damage, with a higher cap.

_Shape:_ 301 occurrences; on a blow; a whole number

_Help:_ names `absorbm`

_Evidence:_ article view,372 at the engine name `absorbm` (read 2026-08-09), and the same branch
shape in production build `1785244275300`. 27 occurrences on
`captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`.

### `-blok` — decoded

Damage a block stopped. The help ties the event to defending and to carrying a shield, so unlike the
two above it can be absent from a combatant entirely.

_Shape:_ 175 occurrences; on a blow; a whole number

_Help:_ names `blok`

_Evidence:_ article view,372 at the engine name `blok` (read 2026-08-09), and production build
`1785244275300`, where the branch has the same shape as the absorption pair. 9 occurrences on
`captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json` — too few to measure alone,
which is why it is grouped with them.

### `+crit` — decoded

A critical hit fired on this blow. **Carries no figure at all**: the protocol states the key and
stops, and the client's branch composes its sentence without reading a value.

_Shape:_ 903 occurrences; on a blow; no value

_Help:_ names `crit`

_Evidence:_ article view,372 at the engine name `crit` (read 2026-08-09) lists it among the events
an attack can produce. Production build `1785244275300`: this branch is one of the two in the family
that interpolates nothing. All 52 occurrences arrive with no value, which is why a value would make
it unread again rather than a flag with a number dropped beside it.

### `+of_crit` — decoded

A critical hit with the **offhand weapon** fired on this blow. Carries no figure: the protocol
states the key and stops.

_Shape:_ 72 occurrences; on a blow; no value

_Help:_ names `crit`

_Evidence:_ production build `1786514810315`, the battle-message branch `case"+of_crit"` composes
its sentence as `_t("msg_+of_crit")` — no `%val%` hole, which is the membership rule `PROC_KEYS`
states. The neighbouring `-blok` branch reads `_t("msg_-blok %val%",{"%val%":…})` in the same
switch, so the difference is the client's own and not an inference from our material.

⚠️ **The help documents the effect and never prints this key.** Article view,372 (read 2026-08-09)
has a section on the offhand critical hit — it states that offhand damage cannot be evaded, and that
`lowcrit` lowers the chance of both the main and the offhand variant — but the engine name beside
that section is absent. Phrases tried and nil: `of_crit`, `critof`, `ofcrit`, `crit_of`. The stem
`crit` is what the article carries, which is why the line above claims that and not silence:
_documented effect, undocumented name_ is a different finding from _undocumented_. The same build
corroborates the meaning outside the battle log — `this.of_crit` writes the character stat
`helper-crit-chance`.

### `+pierce` — decoded

Armour piercing fired on this blow — the help states that within such a blow the target's armour
does not reduce the damage. No figure, like `+crit`.

_Shape:_ 388 occurrences; on a blow; no value

_Help:_ names `pierce`

_Evidence:_ article view,372 at the engine name `pierce` (read 2026-08-09), and production build
`1785244275300`. Every occurrence arrives with no value.

### `-pierceb` — decoded

The answer to the key above, and the one flag here that belongs to the **defence**: the help gives
it as an event that can occur only after `+pierce` has, and that switches off the effects that event
triggers. So the armour piercing is the striker's doing and the block of it is the struck
combatant's, which is the split the sign alone would not have given — the same shape
`-legbon_cleanse` and `-legbon_glare` have, and the reason `PROC_ENDS` in
`src/core/fight-decoder.ts` places all three at the target's end.

_Shape:_ 6 occurrences; on a blow; no value

_Help:_ names `pierceb`

_Evidence:_ article view,372 at the engine name `pierceb` (read 2026-08-09), which gives it as a
shield statistic, always expressed as a probability, arising during defence, and states both that it
occurs only after armour piercing has and that no skill or attribute can lower the chance of it.
Production build `1786514810315` composes `msg_-pierceb` with no `%val%` hole, which is what admits
it to the flag family rather than to the declarations; the development build `1781609507010` carries
the same branch with its original comment.

⚠️ **Four of the eight are documented, and this file said none of them were.** The claim rested on
four phrases — `legbon`, `tenacity`, `acdmg_destroyed` and `dispel` — and not one of them is a name
the help prints. The help joins an article to a key through the engine name in parentheses, and for
this family that name is the key's **stem**: `verycrit`, `curse`, `cleanse`, `holytouch`. Searched
by the stem (read 2026-08-09), the help answers to all four and describes each in full.

### `+stun` — decoded

The target's turn was blocked by this blow. The help documents the event, and notes it also appears
under several other display names — which is why the key, not the sentence, is what identifies it.

_Shape:_ 101 occurrences; on a blow; no value

_Help:_ names `stun`

_Evidence:_ article view,372 at the engine name `stun` (read 2026-08-09), the shared measurement
above, and production build `1785244275300`. 9 occurrences on
`captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`.

### `+stun2-d` — decoded

**Ogłuszenie** — the same event as `+stun`, from the statistic a monster carries for it, and in the
arrow-shaped one of the five variants the client spells (`+stun2`, `-c`, `-d`, `-f`, `-l`). A proc:
it states no figure and the blow it rides already reports its damage.

_Shape:_ 4 occurrences; on a blow; no value

_Help:_ names `stun2`

_Evidence:_ article `view,372` at the engine name `stun2` (read 2026-08-24) gives it as a monster's
statistic deciding the chance of the Ogłuszenie event, fired while the monster attacks and costing
the Player two turns, during which no block, evade, parry or arrow-block can occur. Production build
`1786514810315` composes `msg_+stun2-d` with no `%val%`, on the same switch as `msg_+stun` and
`msg_+acdmg_destroyed`. 4 occurrences on
`captures/2026-08-24-tempest-tropiciel-vs-centaur-1786514810315-none.json`, and none elsewhere as
the set stood 2026-08-24. Two of the other four have arrived since — `+stun2` and `+stun2-c`, each
in one recording — and `-f` and `-l` are in none.

### `+stun2` — decoded

The same Ogłuszenie as `+stun2-d` above and off the same statistic, in the bare one of the five
variants the client spells (`+stun2`, `-c`, `-d`, `-f`, `-l`). A proc: it states no figure and the
blow it rides already reports its damage.

_Shape:_ 4 occurrences; on a blow; no value

_Help:_ names `stun2`

_Evidence:_ article `view,372` at the engine name `stun2` (read 2026-08-25) gives it as a monster's
statistic deciding the chance of the Ogłuszenie event, fired while the monster attacks and costing
the Player two turns, during which no block, evade, parry or arrow-block can occur. Production build
`1786514810315` composes `msg_+stun2` with no `%val%`, on the same switch as `msg_+stun` and
`msg_+acdmg_destroyed`. 4 occurrences on
`captures/2026-08-25-luvia-grupa-vs-mamlambo-auto-none-0.8.1.json`, and none elsewhere as the set
stood 2026-08-25. Three of the five are in some recording now — this one, `+stun2-d` and `+stun2-c`
— and `-f` and `-l` are in none.

### `+stun2-c` — decoded

The same Ogłuszenie as the two above and off the same statistic, in the frost-shaped one of the five
variants the client spells (`+stun2`, `-c`, `-d`, `-f`, `-l`). A proc: it states no figure and the
blow it rides already reports its damage.

⚠️ **The material cannot say which variant this is, and the production bundle cannot either.** The
two recordings carrying the key are the two against the same monster, and every one of that
monster's blows carries `+dmgc` in both — 23 of 23 on
`captures/2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0.json`, 20 of 20 on
`captures/2026-08-27-luvia-grupa-vs-amaimon-2-53XkBRxF-0.9.0.json` — so nothing there distinguishes
a frost-shaped stun from any other, and production states only that the key composes a sentence. A
second recording did not settle it and a third against this monster would not either. The variant is
the development build's answer — see the evidence below.

_Shape:_ 9 occurrences; on a blow; no value

_Help:_ names `stun2`

_Evidence:_ article `view,372` at the engine name `stun2` (read 2026-08-25) gives it as a monster's
statistic deciding the chance of the Ogłuszenie event, fired while the monster attacks and costing
the Player two turns. Production build `53XkBRxF` composes `msg_+stun2-c` with no `%val%`, on the
switch that composes `msg_+stun2` and `msg_+stun2-d` the same way. Which of the five variants it is
comes from the development build `1781609507010`, which keeps each branch's rendered sentence in a
comment beside it: production cannot confirm that half at all, because the wording is not in the
bundle — the client fetches it (§7.6). 4 occurrences on
`captures/2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0.json` and 5 on
`captures/2026-08-27-luvia-grupa-vs-amaimon-2-53XkBRxF-0.9.0.json`, and none elsewhere as the set
stood 2026-08-27 — both against the same monster, which is the only one in the material with the
statistic; of the five variants three are now in some recording and `-f` and `-l` are in none.

### `+freeze` — decoded

The same stun, from the effect the help documents separately as its own passive: a chance to freeze,
which blocks the target's turn.

_Shape:_ 67 occurrences; on a blow; no value

_Help:_ names `freeze`

_Evidence:_ article view,372 at the engine name `freeze` (read 2026-08-09), and the shared
measurement. 3 occurrences on `captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`.

### `+legbon_verycrit` — decoded

A legendary bonus fired on this blow, and it is **the striker's**: the help describes a chance
event, scaled by the holder's own critical-hit chance, that raises the force of their critical hit
and triggers a critical for one turn. The help documents a second form under the same engine name,
for a monster fighting a hero alone; nothing in the protocol distinguishes the two, so this entry
does not either.

_Shape:_ 30 occurrences; on a blow; no value

_Help:_ names `verycrit`

_Evidence:_ article view,372 at the engine name `verycrit` (read 2026-08-09) for the effect and for
whose it is; the shared measurement, and production build `1785244275300`. 3 occurrences on
`captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`.

### `+legbon_curse` — decoded

A legendary bonus fired on this blow. **The event is the striker's and the effect is the target's**,
which is the split the sign alone would not have given: the help describes a chance event, possible
only when the holder attacks _and_ hits, that makes the opponent forgo their next action. The help
groups it with two siblings the client also has keys for — `+distract` and `-legbon_glare` — and
states that only one of the three may sit on a combatant at a time, and that stunning is spent
before any of them.

_Shape:_ 12 occurrences; on a blow; no value

_Help:_ names `curse`

_Evidence:_ article view,372 at the engine name `curse` (read 2026-08-09) for the effect, its
trigger and its siblings; the shared measurement. 1 occurrence, which is why nothing here rests on
the material beyond that it fired.

### `-legbon_cleanse` — decoded

A legendary bonus fired on the blow, and **the one of this family that inverts**: the help states
the event happens only when the holder **takes** a hit, and clears the damage-over-time, slowing and
stunning effects standing on them. So its five occurrences belong to the combatant who was _struck_,
not to the one who swung — the opposite of `+legbon_verycrit` beside it, on a message of the same
shape.

_Shape:_ 25 occurrences; on a blow; no value

_Help:_ names `cleanse`

_Evidence:_ article view,372 at the engine name `cleanse` (read 2026-08-09) for the effect and for
its trigger, which is what places it on the struck combatant; the shared measurement. 5 occurrences
on `captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`.

### `-legbon_glare` — decoded

The third of the siblings `+legbon_curse`'s entry names, and the one that entry predicted would
arrive in a later capture. It has: one occurrence, on a blow, with no figure.

_Shape:_ 3 occurrences; on a blow; no value

_Help:_ names `glare`

_Evidence:_ article view,372 at the engine name `glare` (read 2026-08-12) for the effect, for its
trigger, and for the rule that only one of `curse`, `distract` and `glare` may stand on a combatant
at a time. Production build `1786514810315` composes `msg_-legbon_glare` with no `%val%` hole, which
is what admits it to the flag family rather than to the declarations.

### `-evade` — decoded

The target evaded this blow. Carries no figure, and sits on the defending side: every occurrence
arrives beside the blow's own applied figure, stated as zero, which is the blow landing nothing.

⚠️ **The key that figure rides is the element's, not always `-dmg`.** This read "beside `-dmg=0`"
while every occurrence in the material happened to be physical, and the first recording carrying a
dark-elemental evade made the sentence false in thirteen places at once without touching a number
anybody checks. Measured over every recording as the set stood 2026-08-25: ten arrive beside
`-dmg=0` and thirteen beside `-dmgd=0`, none beside a non-zero one, and none beside no applied
figure at all.

_Shape:_ 39 occurrences; on a blow; no value

_Help:_ names `evade`

_Evidence:_ article view,372 (read 2026-08-09) at the engine name `evade` — `Unik ( evade )`,
"zdarzenie zachodzi podczas obrony", with the chance given as
`evade points * 20 / min(lvl enemy, 300)`. Production build `1786514810315`: `case"-evade"` composes
`_t("msg_-evade")` with no `%val%`, against the `msg_-blok %val%` branch two cases away — the client
itself separates the flag from the figure.

⚠️ **Not totalled with anything.** An evade is the absence of damage, not a quantity of it: the
figure it would contribute is the `-dmg=0` already read.

### `+fastarrow` — decoded

The Fast Arrow fired on this blow: a chance event that shortens the attack's duration. Carries no
figure, and says nothing about how hard the blow landed — what it changes is time, which no total
here keeps.

_Shape:_ 54 occurrences; on a blow; no value

_Help:_ names `fastarrow`

_Evidence:_ article view,372 at the engine name `fastarrow` (read 2026-08-09) gives it as a passive
chance of an event that cuts attack duration by 75% after every speed modifier, with the variable
being the chance rather than the result. Production build `1786514810315`: `case"+fastarrow"`
composes `_t("msg_+fastarrow")` with no `%val%` hole, which is the membership rule `PROC_KEYS`
states.

### `-contra` — decoded

The Riposte the defender fired back: an event that occurs on **taking** a critical hit and triggers
an automatic counterattack inside the same turn. On the defending side, like `-evade` and `-blok`,
and carrying no figure.

_Shape:_ 3 occurrences; on a blow; no value

_Help:_ names `contra`

_Evidence:_ article view,372 at the engine name `contra` (read 2026-08-09) — `Kontra ( contra )`,
stated as occurring during defence and only after a critical hit, with the effect being an automatic
attack within the same turn. Production build `1786514810315`: `case"-contra"` composes
`_t("msg_-contra")` with no `%val%`.

⚠️ **One occurrence, and the counterattack is not joined to it.** The blow the riposte fires arrives
as its own message like any other, and nothing in the protocol says which one it was. Reading the
flag claims only that the event happened.

### `-tenacity` — decoded

Tenacity fired on this blow. What it does is not established here, and neither is whose it is: the
protocol states nothing but that it happened, and article view,372 does not carry the name.

_Shape:_ 20 occurrences; on a blow; no value

_Help:_ names nothing of `tenacity`

_Evidence:_ the shared measurement. 1 occurrence.

### `+superspell-dispel` — decoded

A dispel fired alongside the blow. The client renders it through a sentence named for `dispel`
rather than for the key — one of the few places where the two differ, and a reason not to identify a
key by the sentence it produces.

_Shape:_ 43 occurrences; on a blow; no value

_Help:_ names nothing of `superspell-dispel`, `dispel`, `superspell`

_Evidence:_ the shared measurement, and production build `1785244275300`, where the branch reads
`msg_+dispel`. 3 occurrences on
`captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`. The stem that worked for the
four above was tried here too: `dispel` is the name the client's own sentence uses, and the article
carries neither it nor `superspell`.

### `+acdmg_destroyed` — decoded

The target's armour was destroyed outright by this blow — the floor `+acdmg` counts down to. **Not a
figure**, unlike `+acdmg`: this key states that the armour is gone and no amount.

_Shape:_ 43 occurrences; on a blow; no value

_Help:_ names nothing of `acdmg_destroyed`, `destroyed`

_Evidence:_ the shared measurement. 2 occurrences on
`captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`, both on a message that also
carries `+acdmg`. The stem rule does not rescue this one and is worth saying so: stripping to
`acdmg` lands on the article for the _figure_ key below, which is a different key and would document
the wrong thing.

### `+acdmg` — decoded

Armour of the target destroyed by this blow, in points. **Not damage**, and the distinction is not
pedantic: the help describes it as lowering a statistic before the blow's reduction is computed,
with a floor below which it cannot go. Summed together with `dealt` it would be a total of two
different things.

_Shape:_ 928 occurrences; on a blow; a whole number

_Help:_ names `acdmg`

_Evidence:_ article view,372 at the engine name `acdmg` (read 2026-08-09), which is also what puts
the figure on the target: the key carries `+`, and the help still describes it as lowering the
_attacked_ combatant's armour. Production build `1785244275300`: the branch interpolates the value
into a log slot and assigns nothing. 41 occurrences across the two recordings held when it was read,
`captures/2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json` and
`captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`. The shape rule for damage
does not reach it — characters 1 to 3 are `acd`, not `dmg` — so nothing was reading it as a figure
before.

### `+resdmg` — decoded

Elemental resistance of the target destroyed by this blow, which the help states in **percentage
points** rather than in the points `+acdmg` uses. The two are kept in one shape here because the
protocol gives no unit either way; what the figure means is the entry's job, not the type's.

_Shape:_ 1176 occurrences; on a blow; a whole number

_Help:_ names `resdmg`

_Evidence:_ article view,372 at the engine name `resdmg` (read 2026-08-09), and production build
`1785244275300`. 61 occurrences on
`captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`.

### `+abdest_per` — decoded

Absorption of the target destroyed by this blow, **in points** — despite the name. The `_per`
belongs to the share the skill announces, not to what this reports: the figure is the quantity that
share removed.

_Shape:_ 257 occurrences; on a blow; a whole number

### `+abmdest_per` — decoded

The same for magical absorption. The two always arrive together and are read identically; nothing
separates them but which pool they empty.

_Shape:_ 257 occurrences; on a blow; a whole number

_Evidence:_ both entries, measured on
`captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`: 18 occurrences each, every
one on a blow, never apart from the other — which holds across every recording since, 186 each and
not one apart (read 2026-08-19) — and values from 6017 down to 0 — which is what rules out a
percentage and is why the suffix is not trusted. The help documents the _effect_ rather than these
keys, at the engine name `active_absorbdest_per` (read 2026-08-09): a passive destroying a share of
the opponent's current absorption and magical absorption, applied before the attack is reduced by
any form of damage reduction, and unable to take absorption below zero. That floor is visible here —
`+abmdest_per` reaches 0 and the protocol still reports it rather than falling silent.

### `tspell` — decoded

The skill a combatant used, by name. The announcement carries no key of the **damage family** —
measured over every recording on 2026-08-19, not one announcement of the 2 108 carries one — but
that is narrower than it sounds, and an earlier version of this entry said "no damage at all" and
was wrong.

_Shape:_ 3342 occurrences; on a skill announcement; text

_Help:_ names nothing of `tspell`, `( tspell )`, `skillId`, `( skillId )`

_Evidence:_ production build `1785244275300`, where the branch composes a sentence naming the
combatant in the actor slot and the value, and sets the attack animation. Measured on the captures:
an actor in every one of the 197, the same combatant in both slots in 44, and no target at all
in 15. The game's published help documents neither this key nor `skillId` — article view,372 (read
2026-08-09), searched for `tspell`, `( tspell )`, `skillId` and `( skillId )`, none of which occurs.
That is expected rather than surprising: the help describes mechanics, and these two are how a
message is assembled.

### `skillId` — decoded

The game's own identifier for that skill, attached to the same announcement. Read as part of it
rather than on its own: an id with no name is a skill nothing can put on screen.

_Shape:_ 3003 occurrences; on a skill announcement; a whole number

_Evidence:_ production build `1785244275300` for the empty branch. Measured on the captures: present
on 182 of the 197 announcements, absent from 15, and never once on a message that does not also
carry `tspell`. That last figure is why a lone id is reported unread instead of decoded — the
protocol has not yet shown one, so reading it would be describing a message we have never seen.

### `tcustom` — decoded

The other way an announcement names what a combatant used: a name the game did not take from its
skill table. The message has `tspell`'s shape — a name, and beside it the effects the named thing
performs — so it is read into the same event, and the panel shows it the way it shows any other
named thing somebody used (§10).

⚠️ **Read only where the message names exactly one combatant, and that is the one difference from
`tspell`.** The client composes `tspell` with the name in the **actor** slot and this one with the
name in the **target** slot, so a message stating two different combatants would not say whose use
it was, and taking the actor would be the guess §5 refuses. Where one combatant is all the message
names — both ends the same, or one end unstated — there was never a second name to get wrong. A
message naming two goes back to unread (`tests/core/fight-decoder.test.ts`).

_Shape:_ 7 occurrences; on a skill announcement; text

_Help:_ names nothing of `tcustom`, `( tcustom )`

_Evidence:_ production build `53XkBRxF` composes it as `msg_tcustom_target %target% %val%`,
interpolating the message's second combatant and the value, and files the line under the log's text
slot rather than the automatic one `tspell` takes — as `1786514810315` did before it, the two builds
differing in how they quote a string and not in this. Development build `1781609507010` carries a
comment on that branch naming the thing used as a special potion — what the readable channel adds,
and the weaker of the two claims (§7.6). Article view,372 (read 2026-08-25) documents neither the
key nor its parenthesised form, which is expected rather than surprising: the help describes
mechanics, and this is how a message is assembled. Measured over every recording as the set stood
2026-08-26: seven occurrences, five in `captures/2026-08-25-luvia-grupa-vs-draugr-none-none.json`
and two in `captures/2026-08-26-luvia-grupa-vs-draugr-53XkBRxF-0.8.1.json`, each naming one
combatant in both slots.

⚠️ **The second recording is where this key stopped being a curiosity.** Its two occurrences are the
only messages in the whole corpus that state a declaration under a name the game did not take from
its skill table — `aura-ac_per` and `aura-resall` on one, `critval-allies` and `critmval-allies` on
the other — and the second pair had no entry in this register at all. So the claim that declarations
ride `tspell` was refuted by the same file that brought two keys in, and both halves are held in one
place now (`tests/core/skill-announcement-rule.test.ts`).

### `+injure` — decoded

The deep wound an attack has just applied, announced inside that attack's own message. It moves no
health where it appears: the wound arrives on later calls as its own `injure` message, which is the
entry above.

_Shape:_ 76 occurrences; on a blow; a whole number

_Help:_ names `injure`

_Evidence:_ the game's published help, article view,372, at the engine name `injure` (read
2026-08-09), states the rule in its own words — an event applying deep-wound damage over time worth
15% of the damage dealt, over three turns, not cumulative, overwritten by the freshest application.
Checked against the group fight, which carries nine applications: the floor of that share reproduces
all nine announced figures, among them 1638 taken → 245 announced and 658 → 98, where rounding
instead of flooring would miss the second. Seven of the nine are followed by exactly three ticks of
their own amount; the two that are not are the ones
`captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json` cuts short — call 82 announces
178, one tick follows, and call 91 replaces it with the smaller 157, which is the overwrite showing
itself; the last application lands with the target at 0.94% and the fight ends.

### `-poison_lowdmg_per` — decoded

The share by which a blow was weakened because the combatant dealing it was poisoned, reported
inside that blow's own message. A **percentage, not points**, and unlike the three defences it is
not a figure that was subtracted from anything we can see: the damage keys beside it already have it
applied.

_Shape:_ 1050 occurrences; anywhere; a whole number

_Help:_ names `poison_lowdmg_per-enemies`

_Evidence:_ the game's published help, article view,372, at the engine name
`poison_lowdmg_per-enemies` (read 2026-08-09) — the form the help documents, which is the aura that
grants the effect rather than the per-blow report — describes a passive reducing an opponent's
attack and non-periodic damage while that opponent carries poison from any source, states the
variable as the share reduced, and says outright that what the fight log shows is already lowered by
it. Production build `1785244275300` carries `-poison_lowdmg_per` as its own case in the battle
switch, appending to a log slot and assigning nothing, next to the `poison_lowdmg_per-enemies` case;
the readable development build `1781609507010` is where the pair was found. Both keys are in the
frozen table.

### `active_absorbdest_per` — decoded

The share of current absorption a skill destroys, stated **on the announcement of that skill**
rather than on any blow. The two keys above are what the share then removes, and they arrive in
later messages.

⚠️ The same name also appears in a **second switch** in the same module, the one composing skill
descriptions. That switch is not about battle messages, and the frozen table is bounded by brace
balance so it holds only the battle one — the trap §7.5 records, met again here.

_Shape:_ 465 occurrences; on a skill announcement; a whole number

_Help:_ names `active_absorbdest_per`

_Evidence:_ the help, article view,372, at that engine name (read 2026-08-09) — the description
quoted under `+abdest_per` above. Measured on
`captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`: 43 occurrences, every value
`5`, every one on a skill announcement. **The share is the caster's, not the key's and not the
fight's** — three group fights field one combatant declaring `8` while everybody else declares `5`
(`2026-08-12-tempest-grupa-vs-draugr-1-1786514810315-none`,
`2026-08-14-tempest-grupa-vs-draugr-2-1786514810315-none` and
`2026-08-15-tempest-grupa-vs-draugr-2-1786514810315-none`, read 2026-08-19), which is what a reading
off one recording would have missed. Held by `tests/core/absorption-destruction-rule.test.ts`, which
groups by caster for that reason and refuses a second distinct value inside one caster's own
reports.

### `combo-max` — decoded

How many accumulated combination points the announced skill will spend. A **count, not a quantity**
— the captures state 1, 2 and 3 — and like the share above it qualifies the skill rather than
reporting anything that happened.

_Shape:_ 434 occurrences; on a skill announcement; a whole number

_Help:_ names `combo-max`

_Evidence:_ the help never documents the key on its own — article view,372 (read 2026-08-09)
mentions it only inside six other effects, each saying it spends accumulated combination points up
to the number this parameter sets, which is where the reading comes from. Measured on
`captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`: 31 occurrences, values `1`
(15), `2` (15) and `3` (1), and **every one on a skill announcement** — none anywhere else, which
holds across every recording since (read 2026-08-19). Held by
`tests/core/skill-announcement-rule.test.ts`, which also refuses a figure in the range the
protocol's quantities occupy, so a cap and a count of points cannot be confused with one.

### `+engback` — decoded

Energy returned to the attacker by this blow. Rides the blow, states a whole number, and — measured
— **never arrives without a critical hit**: every occurrence sits beside `+crit` or beside
`+of_crit`.

⚠️ **This entry said `+crit` alone, and the material had already refuted it.** That was true of the
13 occurrences `captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json` carried and of
nothing since: read 2026-08-19, `+of_crit` without `+crit` accounts for 29 occurrences, and no
occurrence anywhere arrives beside neither. A count in prose goes stale silently (AGENTS.md §5) —
this entry's own two did, twice over, which is why they now name what they were taken on — but so
does a universal beside it, and nothing here re-measures a claim about which keys a key arrives
_with_.

_Shape:_ 347 occurrences; on a blow; a whole number

_Help:_ names `engback`

_Evidence:_ article view,372 (read 2026-08-09) names `engback` among the effects that restore
energy, without documenting the protocol key. Every occurrence is on a blow, and each carries one of
the two critical-hit flags.

### `-endest` — decoded

Energy destroyed on the combatant this blow struck. Rides the blow and states a whole number.

_Shape:_ 8 occurrences; on a blow; a whole number

_Help:_ names `endest`

_Evidence:_ article view,372 at the engine name `endest` (read 2026-08-12): _słabnące niszczenie
energii przeciwnika_, a withdrawn equipment bonus that takes a fixed number of the opponent's energy
points on their turn, weakening by 5% of its initial value each turn and floored at zero. Production
build `1786514810315` composes it through the shared `msg_<key> %val%` branch it shares with
`+endest`, with a second form for a two-member value.

⚠️ **The decay the help describes is not visible here.** All 8 occurrences state 5, across a fight
of 41 blows, where the documented rule would have them falling. The material is one fight and the
help is about an equipment bonus rather than about the key, so this is recorded as a disagreement
and not resolved either way — what is settled is the unit, which is all the reading rests on.

### `+critslow_per` — decoded

An attack-speed reduction applied by a critical hit. States a whole number, and every occurrence
rides a blow carrying `+crit` (read 2026-08-19).

_Shape:_ 17 occurrences; on a blow; a whole number

_Help:_ names `critslow_per`

_Evidence:_ article view,372 (read 2026-08-09) lists `critslow_per` among the effects that combine
additively to change attack speed. Read as a declaration for the same reason as `+engback`: attack
speed is a unit no total here keeps, so nothing totals it and nothing is missing when it is not.

### `+critpoison_per` — decoded

Healing or poison tied to a critical hit — the help lists it among the effects whose sum is capped,
in the passage about healing. Both occurrences ride a blow with `+crit`.

_Shape:_ 10 occurrences; on a blow; a whole number

_Help:_ names `critpoison_per`

_Evidence:_ article view,372 (read 2026-08-09) at the engine name `critpoison_per`. Every occurrence
sits beside `+crit` (read 2026-08-19).

### `-legbon_facade` — decoded

A legendary bonus riding the blow, stating a whole number. Nothing establishes what the number
counts.

_Shape:_ 15 occurrences; on a blow; a whole number

⚠️ **The register said this key was undocumented, and it was wrong.** The search was for
`legbon_facade` and `legbon`; the help prints the engine name without the protocol's prefix, so
neither matched. §7.6 gained a rule from it: a protocol key carrying a prefix is searched by its
stem too, because _not found_ and _not documented_ are different claims and this entry made the
wrong one for two days.

_Help:_ names `facade`

_Evidence:_ article view,372 (read 2026-08-09) at the engine name `facade`, for the effect and for
the value it carries; the client composes its log line with a `%val%` hole, production build
`1786441768914`. Every occurrence states `13` or `20` and rides a blow that carries damage (read
2026-08-19).

### `+legbon_holytouch` — decoded

**The key that looks like a flag and is not.** In the captures it arrives with no value, exactly as
`+crit` does — but production build `1785244275300` composes its sentence with a `%val%` hole, so
the client expects a figure this occurrence does not carry.

_Shape:_ 58 occurrences; on a blow; no value

_Help:_ names `holytouch`

_Evidence:_ production build `1785244275300` against 1 occurrence in the group fight; article
view,372 at the engine name `holytouch` (read 2026-08-09) for the effect, its trigger and whose it
is.

### `poison_lowdmg_per-enemies` — decoded

The aura that grants the reduction `-poison_lowdmg_per` reports, declared once per fight rather than
per blow. Described in full in that entry above; it has a heading of its own because it is a
distinct key.

_Shape:_ 34 occurrences; alone in its message; a whole number

_Help:_ names `poison_lowdmg_per-enemies`

_Evidence:_ 1 occurrence in the group fight, naming a single combatant in the actor slot, carrying
no damage, stating the same value the 68 blow reports carry. The help documents the effect under
this name — article view,372 (read 2026-08-09).

### `+taken_dmg` — decoded

⚠️ **The key that looks like damage and is not.** It rides nearly every blow carrying `-dmga` — 733
of the 742, read 2026-08-19, with nine carrying `-dmga` alone — and the tempting reading is that it
is the raw half of that applied figure — the help documents `taken_dmg_per` as damage added to what
the target takes, reduced by armour, which is exactly a raw/applied pair.

_Shape:_ 1206 occurrences; on a blow; a whole number

_Help:_ names `taken_dmg`

_Evidence:_ article view,372 (read 2026-08-09) documents `taken_dmg_per`, `taken_dmg_per-all` and
`taken_dmg_per-row` as effects that raise the damage aimed at the target by a share, computed
against the attacker's damage before any reduction, and states that the added damage is itself
reduced by armour. That is what makes a raw/applied split expected — and what makes the readings
where this figure is the _smaller_ of the two decisive against it being the raw side.

⚠️ **What the differences measure is not settled.** They are consistent with a second source of
added damage on the same blow, and the material does not say which. What is settled is the
direction, and the direction is what decides whether the figure may be totalled.

### `+crush_physical` — decoded

The share by which this blow's output was raised by the Crush effect, stated per damage element. An
input: the damage keys beside it already carry it.

_Shape:_ 23 occurrences; on a blow; a whole number

_Help:_ names `crush`

_Evidence:_ article view,372 (read 2026-08-09) documents `crush_dmg_per` as raising output damage by
a share of the damage dealt, once the ratio of dealt to executed damage passes
`crush_threshold_per`, with the variable being that share. Every occurrence here states 30 and sits
beside ordinary damage figures. Production build `1786514810315`: the branch is a family —
`case"+crush_physical"` and `case"+crush_distance"` share a body that switches on the element name
and composes `eng_game_only_val_+crush %val%`.

### `+rage` — decoded

The Rage buff firing on this blow, stated as an attack figure. An input to damage, so the `dmg` keys
beside it already carry whatever it produced — counting it would state the same increase twice, in a
unit nothing here totals.

_Shape:_ 2 occurrences; on a blow; a whole number

_Help:_ names `( rage )`

_Evidence:_ article view,372 at the engine name `rage` (read 2026-08-09): a critical hit triggers
Rage for a number of turns and it raises physical damage by 10%, the variable being the number of
turns. Production build `1786514810315` composes it as `msg_+rage %val%` — an attack figure and not
the turn count, which is the one thing the two sources say differently and neither of them makes it
health. The single occurrence, `447544=18.54;-10000545=48.21;+rage=340;+dmg=3745;-dmg=3171`, sits on
a call the witness judges and agrees on, so it reports no health figure the arithmetic has to
account for. `-rage` exists in the client and carries no value; the captures do not have it, so it
has no entry.

### `+critsa` — decoded

Attack speed granted on a critical hit. A unit no total here keeps, which is the same reason
`+critslow_per` above is read and never added to anything.

_Shape:_ 38 occurrences; on a blow; a number

_Help:_ names `critsa`

_Evidence:_ article view,372 (read 2026-08-09) names `critsa_per` among the attack-speed effects
that combine additively with `sa_per`, `aura-sa_per`, `allslow_per` and `critslow_per`. Production
build `1786514810315` composes `msg_+critsa %val%`.

⚠️ **The figure is not whole, and the entry said it was.** Every occurrence stated `11` or `20`
beside `+of_crit` until
`captures/2026-08-24-tempest-tropiciel-vs-centaury-auto-1786514810315-0.8.1.json` recorded `5.5`
beside `+crit` — so the shape line above reads _a number_, and the decoder reads a declaration with
either spelling rather than refusing the blow it rides (`src/core/fight-decoder.ts`). What it cost
while the reader was narrower is worth stating: the message carried five damage figures and none of
them was counted, because one input beside them had a decimal point.

### `-legbon_critred` — decoded

Critical Cover: the share by which the damage of this critical blow was reduced, stated on the
defending side. Already applied to the figures beside it, so reading it as a reduction would
subtract it twice — the same argument as `-poison_lowdmg_per`.

_Shape:_ 11 occurrences; on a blow; a whole number

_Help:_ names `critred`

_Evidence:_ article view,372 at the engine name `critred` (read 2026-08-09) —
`Krytyczna osłona ( critred )`, stated as reducing all of the opponent's weapon damage by a share
when the character takes a critical hit, at the same moment as resistance reduces it, and only after
a critical. The material agrees: all 6 occurrences state 25 and every one rides a message carrying
`+crit`. Production build `1786514810315` composes `msg_-legbon_critred %val%`.

### `+legbon_puncture` — decoded

Piercing Efficiency: the share of the target's defensive statistics this attack ignores. An input to
the damage on the same message, not an outcome.

_Shape:_ 7 occurrences; on a blow; a whole number

_Help:_ names `puncture`

_Evidence:_ article view,372 at the engine name `puncture` (read 2026-08-09) —
`Przeszywająca skuteczność ( puncture )`, stated as ignoring armour, magic resistances, absorption,
magic absorption, evade and block points, with the variable being the ignored share and the
**initial value 12%**. Every occurrence in every recording states 12, which is that initial value
(re-measured 2026-08-25, when a fourth arrived from a different world and stated it too). Production
build `1786514810315` composes `msg_+legbon_puncture %val%`.

⚠️ **Few occurrences, and the join is still not stated.** What the ignored share does to the figures
on the same message is not inferred: the entry claims the meaning, not an arithmetic. This warning
read "One occurrence" for three releases after there were three, a count in prose beside a count a
machine re-earns (§5) — the _Shape:_ line above is the one to read.

### `+absorbm` — decoded

Magical absorption **returned to the pool** by this blow, and the only key in the register whose
name it shares with a figure a statistic here does count. `-absorbm`, two segments away on the same
message, is damage that pool stopped and reaches `prevented`. This one is the pool being refilled:
not damage, not a prevention, and not a statistic destroyed.

⚠️ **Whose pool refilled is not settled, and the entry says so rather than reading the slot.** Every
occurrence rides a blow where the attacker is named on one side and the absorbing combatant on the
other, and nothing states which of them gained. The help is the source that would answer it (this
section's own preamble: which combatant a figure belongs to comes from the help, never from the
sign), and it goes half way: `absagain_per` documents the renewal both this key and `+absorb`
report, without saying whether the attack that triggers it is one the character landed or one they
took. So the question the verdict turns on is still open, and this stays a declaration rather than
something a row could carry.

_Shape:_ 3 occurrences; on a blow; a whole number

_Help:_ names `absorbm`, `absagain_per`

_Evidence:_ article view,372 at the engine name `absorbm` (read 2026-08-22) documents the statistic
and one movement of the pool, downward, by what the pool has just stopped.

⚠️ **This entry recorded that the renewal was undocumented, and it was wrong.** The search behind
that was by absorption name — `absorb`, `absorbd`, `absorbm`, and the passives `absorb_per`,
`absorbm_per`, `active_absorbdest_per`, `redabdest_per` — and the article files the renewal under
none of them: it is `absagain_per`, restoring a share of absorption and magical absorption after an
attack that landed, capped at the pool the fight was entered with (read 2026-08-25). A searched
silence is still a silence over the names that were searched, and an effect the article names
something else entirely walks through it. The verdict does not move — nothing in the article says
whose pool gained — but the reason it does not is now the article's own words rather than its
absence.

⚠️ **Three occurrences, two recordings, and the same value on every one of them.** Two sit on the
same announced ability, cast by the same combatant, in
`captures/2026-08-17-tempest-grupa-vs-hildur-1786514810315-none.json` — the ability goes unnamed
here because its name is the game's own (§5) — where each states 15 while `-absorbm` beside them
states 2 247 and 1 774; the third states 15 as well, in
`captures/2026-08-23-tempest-grupa-vs-hildur-auto-1786514810315-none.json`. That is far too little
material to read a rule off, and none is read: the verdict rests on the unit, the way `-endest`'s
does, and the unit is what makes the figure safe to show and impossible to total.

### `+absorb` — decoded

Absorption **returned to the pool** by this blow: the physical twin of the key above, trap included.
`-absorb` is damage absorption stopped and reaches `prevented`; this one is the pool being refilled,
so adding it to the key it resembles would count points of absorption as points of damage.

⚠️ **The help does document the effect these two report, and the entry above says it does not.**
`absagain_per` restores a share of absorption, physical and magical, after an attack that landed,
and cannot take either pool past what the fight was entered with. The article does not say whether
the attack is one the character landed or one they took, and the message does not either — so what
kept both keys declarations is untouched: they name an attacker and the combatant whose absorption
stopped damage, and state nowhere which of the two gained.

_Shape:_ 2 occurrences; on a blow; a whole number

_Help:_ names `absorb`, `absagain_per`

_Evidence:_ article view,372 at the engine names `absorb` and `absagain_per` (read 2026-08-25).
Production build `53XkBRxF` composes it as `msg_+absorb %val%` in the attacker's log slot,
immediately beside `+absorbm` and with the identical shape, as `1786514810315` did before it;
development build `1781609507010` names the effect on that branch as a renewal of absorption. Both
occurrences ride a blow whose actor deals magical damage, one in each of the two recordings of
2026-08-25 against a Draugr — far too little material to read a rule off, and none is read.

### `active_decblock_per` — decoded

A reduction of the target's chance to block, granted by the announced skill.

_Shape:_ 305 occurrences; on a skill announcement; a whole number

_Help:_ names `active_decblock_per`

_Evidence:_ article view,372 (read 2026-08-09) names it among the effects that lower block chance.
On `captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`, 26 occurrences with values
1, 2, 4 and 11. The client hides the key: production build `1785244275300` gives it an empty `break`
in the battle switch, beside `active_absorbdest_per`.

### `active_decblock_per-enemies` — decoded

The same reduction, aimed at the opposing side rather than at one target — the `-enemies` suffix the
protocol uses elsewhere for the same distinction.

_Shape:_ 107 occurrences; on a skill announcement; a whole number

_Help:_ names `active_decblock_per-enemies`

_Evidence:_ article view,372 (read 2026-08-09), which lists it beside `decblock_per` and
`active_decblock_per`. On `captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`, 11
occurrences, every value `10` — and `10` is the only value any recording states (read 2026-08-19).

### `active_block_per` — decoded

An increase to the announcer's own chance to block.

_Shape:_ 154 occurrences; on a skill announcement; a whole number

_Help:_ names `active_block_per`

_Evidence:_ article view,372 (read 2026-08-09) at the engine name `active_block_per`, described as
raising block chance and applied at the initiation layer. On
`captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`, 10 occurrences, every value
`15`. The recordings since state `11` and `20` as well, one value per fight (read 2026-08-19).

### `alllowdmg` — decoded

A reduction to the damage dealt by everyone on the opposing side.

_Shape:_ 107 occurrences; on a skill announcement; a whole number

_Help:_ names `alllowdmg`

_Evidence:_ article view,372 (read 2026-08-09) at the engine name `alllowdmg`, described as lowering
the damage of all characters in the opposing team by the share the parameter sets. On
`captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`, 11 occurrences, every value
`5` — and `5` is the only value any recording states (read 2026-08-19).

### `allslow_per` — decoded

An attack-speed reduction applied across the opposing side.

_Shape:_ 104 occurrences; on a skill announcement; a whole number

_Help:_ names `allslow_per`

_Evidence:_ article view,372 (read 2026-08-09), which lists it among the effects combining
additively to change attack speed. On
`captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`, 5 occurrences, every value
`14`. Three recordings since state `12` as well (read 2026-08-19).

### `aura-ac_per` — decoded

An aura raising armour, granted to the announcer's team.

_Shape:_ 41 occurrences; on a skill announcement; a whole number

_Help:_ names `aura-ac_per`

_Evidence:_ article view,372 (read 2026-08-09), which lists it among the effects that raise armour.
On `captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`, 4 occurrences, every value
`20` — and `20` is the only value any recording states (read 2026-08-19).

### `aura-resall` — decoded

An aura raising the team's resistances to fire, cold and lightning, in percentage points.

_Shape:_ 41 occurrences; on a skill announcement; a whole number

_Help:_ names `aura-resall`

_Evidence:_ article view,372 (read 2026-08-09) at the engine name `aura-resall`. On
`captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`, 4 occurrences, every value
`15` — and `15` is the only value any recording states (read 2026-08-19).

### `aura-sa_per` — decoded

An aura raising the team's attack speed.

_Shape:_ 75 occurrences; on a skill announcement; a whole number

_Help:_ names `aura-sa_per`

_Evidence:_ article view,372 (read 2026-08-09), which lists it among the attack-speed effects. On
`captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`, 4 occurrences, every value
`20` — and `20` is the only value any recording states (read 2026-08-19).

### `lowheal_per-enemies` — decoded

The share by which the **opposing** side's healing from active skills is reduced, declared on the
announcement of the skill applying it. The `-enemies` suffix is the one
`active_decblock_per-enemies` above uses for the same distinction: not one target, but everybody on
the other side.

⚠️ **The scope is the help's and the caster is the protocol's, and reading the two together is what
narrows the refusal** (`[ASK]` under §9.6, asked and granted 2026-08-27;
`docs/adr/0010-sizing-a-share-onto-a-side.md`). By the article the reduction lands on the casting
side's opponents, and in the only recording carrying the key one of ours declares it at the monster
— so our own healing was never reduced, and all three of that fight's `healall_per` casts are sized.
Twenty of their figures are checked against the snapshots of the calls they stood alone in and every
one agrees with the share applied unreduced, which is what makes the scope a reading rather than a
citation.

⚠️ **A reducer this meter cannot place a caster for still refuses the fight whole.** Two ways that
happens: a declaration whose actor the roster cannot resolve, and one arriving with no announcement
to ride, which reaches the events among an unread message's keys — that shape names the ends of its
message without saying which slot each came from, so there is no caster to read a side off.

_Shape:_ 4 occurrences; on a skill announcement; a whole number

_Help:_ names `lowheal_per-enemies`

_Evidence:_ article `view,372` at the engine name (read 2026-08-27) gives it as lowering the healing
that active-skill effects give every character on the opposing team, applied on the initiation layer
and fired on the initiation layer at the opponent, and names `healall_per`, `heal_per` and
`combo_heal_per` as the three it reduces. Production build `1786514810315` composes it into the
battle log with a figure in it, which is what lets a fight that never mentions it be read as a fight
where the reduction was not applied. All 4 occurrences are on
`captures/2026-08-27-luvia-grupa-vs-amaimon-2-53XkBRxF-0.9.0.json`, every value `27`, each cast by
one of ours at the monster. That recording also states what the reduction is **not**: its three
`healall_per` shares are 30, 30 and 22.5, and 22.5 is 30 less a quarter of it — the article's own
rule that each further use of an ability carrying such an effect gives back 25% of the base less,
and not `27` applied to anything. Held by `tests/core/combatant-health.test.ts`, which reads the
declaring side off that fight and pins each reason a cast is refused on a fight built by hand, and
by `tests/core/skill-announcement-rule.test.ts` for the placement.

### `mana` — decoded

Mana the announced skill costs. **Signed, and negative in every occurrence** — the protocol states
the change, not the price as a positive number.

_Shape:_ 128 occurrences; on a skill announcement; a whole number

_Help:_ names `mana`

_Evidence:_ article view,372 (read 2026-08-09) documents mana as a resource some skills consume. On
`captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`, 15 occurrences, all negative,
10 of them beside `energy`. Every occurrence in every recording is negative; 22 of them sit beside
`energy` (read 2026-08-19).

### `energy` — decoded

Energy the announced skill costs, the same shape as `mana`. Every occurrence in the captures states
`0`, which is why nothing here claims it is ever otherwise.

_Shape:_ 70 occurrences; on a skill announcement; a whole number

_Help:_ names `energy`

_Evidence:_ article view,372 (read 2026-08-09) documents energy as a resource some skills consume.
On `captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`, 10 occurrences, every one
beside `mana` and every one stating `0`. The recordings since carry negative figures too, and 22 of
the 46 occurrences sit beside `mana` (read 2026-08-19).

### `shout` — decoded

A provocation: the announced skill forces those it covers to attack a named combatant. The value is
that combatant's **name**, so it is read at run time and never stored here — the same footing as
`tspell` (NOTICE.md).

_Shape:_ 154 occurrences; on a skill announcement; text

_Help:_ names `shout`

_Evidence:_ article view,372 (read 2026-08-09) at the engine name `shout`, described as forcing
covered characters to attack a chosen target. 11 occurrences, every one on an announcement that also
carries `active_decblock_per-enemies` and `alllowdmg`.

### `aura-adddmg2_per-meele` — decoded

The share by which an aura raises the melee damage of the team members standing in the front
position. Stated on the announcement as an input; what it comes to arrives later as ordinary damage,
already raised.

_Shape:_ 47 occurrences; on a skill announcement; a whole number

_Help:_ names `adddmg2`

_Evidence:_ article view,372 at the engine name `aura-adddmg2_per-meele` (read 2026-08-09) — the
help prints this key in full, unusually — stated as raising the damage of every team member who
begins the fight in the first position, with the variable being the share of physical damage raised.
Every occurrence states `5` and rides an announcement carrying `shout` (read 2026-08-19). Production
build `1786514810315` composes it through the shared `skill_<key> %val%` branch.

### `critval-allies` — decoded

The force of a physical critical hit, raised for every member of the caster's own side. Points on a
multiplier and not damage: what they come to arrives inside the damage figures of later blows,
already multiplied, so nothing here totals it — the argument the auras above are read under.

_Shape:_ 1 occurrences; on a skill announcement; a whole number

_Help:_ names `critval-allies`, `critval`

_Evidence:_ article view,372 at the engine name `critval-allies` (read 2026-08-26) files it as a
passive raising the physical critical strength — and the auxiliary one, where an offhand weapon is
carried — for every member of the party, its variable being the number of points added, applied at
the initiation layer and triggered at the damage layer. The same article names the plain stem
`critval` as the character statistic those points land on. Production build `53XkBRxF` composes it
as `eng_game_only_val_critval-allies %val%`, through the branch it shares with `+crush`,
`+taken_dmg`, `+critpierce` and the three other members of the `critval`/`critmval` family — a line
that states a figure and nothing else. The single occurrence rides a `tcustom` announcement in
`captures/2026-08-26-luvia-grupa-vs-draugr-53XkBRxF-0.8.1.json`, stating `25` beside
`critmval-allies`, which states the same.

### `critmval-allies` — decoded

The same for a magical critical hit, across every element. Read for the same reason and totalled by
nothing, for the same one.

_Shape:_ 1 occurrences; on a skill announcement; a whole number

_Help:_ names `critmval-allies`, `critmval`

_Evidence:_ article view,372 at the engine name `critmval-allies` (read 2026-08-26) files it as a
passive raising the magical critical strength for every member of the party, its variable being the
number of points added, applied at the initiation layer and triggered at the damage layer.
Production build `53XkBRxF` composes it through the same branch its physical counterpart does. Its
one occurrence is the message that carries that counterpart.

### `+spell-taken_dmg-all` — decoded

That the announced skill applies the added-damage effect to **everyone**, rather than to one target.
Carries no figure: it names which variant of the effect the skill is, and the share it applies is
not on this message at all.

_Shape:_ 59 occurrences; on a skill announcement; no value

_Help:_ names `taken_dmg`

_Evidence:_ article view,372 (read 2026-08-09) documents `taken_dmg_per-all` as the variant applying
the effect to all opponents, beside `taken_dmg_per` and `taken_dmg_per-row`. Production build
`1786514810315` composes this branch as `end-game-without-percent<key>` and interpolates nothing —
no `%val%`, and the captures agree that no value ever arrives.

⚠️ **Read as a declaration carrying no amount**, which is the announcement-side counterpart of
`+legbon_holytouch`. A value arriving on it sends the key back to unread rather than being dropped
beside the flag.

### `en-regen-cast` — decoded

That the announced skill was cast to restore energy, and on whom. Carries no figure of its own — the
client's own sentence for it interpolates two combatant names and no value.

_Shape:_ 5 occurrences; on a skill announcement; no value

_Help:_ names `regen`

_Evidence:_ article view,372 (read 2026-08-09) documents `en-regen` as the effect restoring energy
each turn; this is the cast that applies it. Production build `1786514810315`: `case"en-regen-cast"`
composes `msg_en-regen-cast %name% %target%` with the caster's and the target's names substituted
and no `%val%`.

⚠️ **Energy, which no total here keeps** — so the key is read to stop it warning that a damage total
may be low, and reaches no figure. The one occurrence rides an announcement that also carries
`heal_target` and `combo-max`.

### `removeslow-allies` — decoded

That the announced ability takes the slow-over-time effects off every member of the caster's own
side. Carries no figure, and the help says as much itself: the effect is published with **no
variable**.

_Shape:_ 1 occurrences; on a skill announcement; no value

_Help:_ names `removeslow-allies`

_Evidence:_ article view,372 at the engine name `removeslow-allies` (read 2026-08-25) documents it
as a passive removing the slow-over-time effects an opponent's skills and the character's own
equipment laid on the party, and states its variable as none. Production build `53XkBRxF` composes
it through a branch of its own, `msg_removeslow-allies`, interpolating nothing. The one occurrence
rides an announcement carrying `removestun-allies` beside it, in
`captures/2026-08-25-luvia-grupa-vs-draugr-none-none.json`.

### `removestun-allies` — decoded

The same, for stuns: the announced ability takes them off every member of the caster's own side, and
states no figure.

_Shape:_ 1 occurrences; on a skill announcement; no value

_Help:_ names `removestun-allies`

_Evidence:_ article view,372 at the engine name `removestun-allies` (read 2026-08-25) documents it
as an active removing `stun`, `freeze` and `stun2` from the party, with its variable stated as none.
Production build `53XkBRxF` composes it through `msg_removestun-allies`, interpolating nothing. The
one occurrence shares its announcement with `removeslow-allies`.

### `removedot-allies` — decoded

The third of the cleanses, for damage over time. **The only one of the three the help does not carry
at all**, so what places it here is the client alone — and the client is enough for the one thing
the verdict needs, which is that no figure arrives.

_Shape:_ 2 occurrences; on a skill announcement; no value

_Help:_ names nothing of `removedot-allies`, `removedot`

_Evidence:_ production build `53XkBRxF` composes it through the branch it shares with `removedot`
and `removestun`, passing no parameters at all — no `%val%` hole anywhere in it — and the captures
agree that no value ever arrives. Article view,372 (read 2026-08-25) prints `removeslow`,
`removeslow-allies` and `removestun-allies` and no `removedot` of any spelling; the stem is what was
searched, since `allies` says whom the effect reaches rather than what it is
(`tests/repository/protocol-keys.test.ts`). Both occurrences are in
`captures/2026-08-25-luvia-grupa-vs-draugr-none-none.json`, each alone with its announcement.

⚠️ **A turn is not found in any key of these, or of any other** — measured over every recording on
2026-08-19, against every key the client branches on (`frozen/protocol-keys.ts`). Nothing here
counts turns, and the panel no longer divides by them.

### `step` — decoded

Carries **no value at all** and names one combatant in the actor slot with no target. Every
occurrence is a message holding nothing else, which is what a turn boundary would look like — but
the protocol does not say that, and this entry does not either. Some recordings carry none at all.
What reads the key is `tools/action-count.ts`, which counts it as an action its combatant took and
never as a boundary between two turns (**ADR 0048**).

_Shape:_ 171 occurrences; alone in its message; no value

_Help:_ names `step`

_Evidence:_ not documented. Article view,372 (read 2026-08-09) was searched for `step`; the only hit
is inside a longer Polish word, which is the false positive §7.6 warns about rather than a mention.
Every occurrence is valueless and alone, always with an actor and never a target.

### `prepare` — decoded

A skill being prepared rather than used, stated as `name(percent%)`. The name is the client's
display text, so no example of one appears here.

_Shape:_ 302 occurrences; alone in its message; text

_Help:_ names nothing of `prepare`

_Evidence:_ not documented — article view,372 (read 2026-08-09), searched for `prepare`, which does
not occur. Every occurrence is the only key in its message, every value matches that shape, and each
has an actor and no target.

### `txt` — decoded

Free text the client shows in the battle log. **Nothing of it is stored here**, in this file or in
any test: it carries the game's own sentences and player names, which NOTICE.md keeps out of the
repository entirely.

_Shape:_ 342 occurrences; alone in its message; text

_Help:_ names nothing of `txt`

_Evidence:_ not documented — article view,372 (read 2026-08-09), searched for `txt`, which does not
occur. Every occurrence is alone in its message, naming no combatant at all — which is why it opens
no turn and continues the one it follows.

### `+exp` — decoded

Experience awarded. Names no combatant, and every occurrence is at the end of a fight.

_Shape:_ 3 occurrences; alone in its message; a whole number

_Help:_ names `exp`

_Evidence:_ an integer, alone in its message with neither side named. Not documented as a protocol
key in article view,372 (read 2026-08-09).

### `+ph` — decoded

Honour points paid for winning a duel. Names no combatant — the winner is stated a message earlier,
by `winner` — and arrives last, after the outcome.

_Shape:_ 1 occurrences; alone in its message; a whole number

_Help:_ names `honoru`

_Evidence:_ article view,372 at the heading _Punkty Honoru_ (read 2026-08-12), which gives the
points as a currency awarded to the winner of a player-versus- player duel and taken from the loser,
with the conditions a fight has to meet to be fought for them and the order the figure is computed
in. Production build `1786514810315` composes it as `msg_+ph %val%`. The one occurrence is the last
message of the only duel between two players in this material.

### `en-regen` — decoded

Energy restored to a combatant this turn, stated as a message of its own. Read and counted as
nothing: energy is a unit no total here keeps, the same standing `mana` and `energy` have on an
announcement.

_Shape:_ 24 occurrences; alone in its message; a whole number

_Help:_ names `regen`

_Evidence:_ article view,372 at the engine name `en-regen` (read 2026-08-09), given as a passive
that raises the energy restored with each turn the character takes, with the variable being that
number of points, and with the restored energy capped at the pool the character began the fight
with. Every occurrence states 2 and each is the only key in its message. Production build
`1786514810315` composes it through the shared `bonus_<key> %val%` branch.

⚠️ **Not joined to a combatant here.** Like the other standalone keys it reaches no row: the message
names a side, and what the panel does with a declaration is show it, not add it.

### `afterheal` — decoded

Health restored to a combatant by a healing talisman **once the fight is over**.

⚠️ **No health verdict, and the witness cannot supply one.** Silence here is a position rather than
an omission: the figure moves no health that any snapshot in the fight records, so claiming it does
would make `tests/core/health-witness.test.ts` skip both of these calls whole and lose the coverage
for nothing. It could not have judged them anyway — an `afterheal` message states no health
percentage in either slot, so there is no figure for the replay to compare against, and the reading
rests on the snapshots either side of the call instead.

⚠️ **What the material cannot settle.** Whether the value is the health restored or the talisman's
own parameter. The two coincide in every occurrence here, because each recipient had lost more than
the figure stated, so `min` returns the parameter either way. The client's sentence reads as the
figure restored; nothing measurable here proves it, and nothing downstream depends on which it is.

_Shape:_ 6 occurrences; alone in its message; a whole number

_Help:_ names `afterheal`

_Evidence:_ article view,372 at the engine name `afterheal` (read 2026-08-09), which gives the
formula above, the cap at the health the character started the fight with, and the rule for a
character carrying several such talismans — only the one with the highest average restoration is
used. Production build `1786514810315` composes it as `msg_afterheal %name% %val%`; the development
build `1781609507010` carries the same branch with its original comment, which reads the value as
the number of health points restored.

### `critwound` — investigated

**Ciężka rana** — deep-wound damage over time, the same family as `injure` and a different key. The
help says it fires on a critical hit, or an auxiliary one, whose damage into the Player was above
zero; a chance then applies deep-wound damage to the target **as a separate instance**, worth 10% of
the damage dealt, over three turns. The damage type is deep wound and is reduced by `woundred`. It
does not accumulate, and it is overwritten by the freshest value applied to that opponent — word for
word the rule `injure` carries, at 10% where that one is 15%, and off a critical hit where that one
is off a monster's attack.

⚠️ **It is not `injure` under another name, and the join is where they part.** §9.6's fourth clause
charges a wound to the attacker its announcement named, because the announcement states the figure
and the figure identifies which application is ticking. `+critwound` states **no figure at all** —
see the entry below — so the same reading is not available here, and adopting it by analogy would be
charging damage to somebody on the strength of a resemblance. `[ASK]`, and material first.

_Help:_ names `critwound`

_Evidence:_ the game's published help, article `view,372`, at the engine name `critwound` (read
2026-08-19), states the rule above in its own words. Production build `1786514810315` composes the
key as `msg_critwound %name% %val%`, and as `msg_critwound %name% %val0% %val1%` where the value
splits on a comma — the same two branches `injure` and `poison` take. Absent from `captures/` as the
set stood 2026-08-19: the string occurs in none of the seventeen recordings, under either form.

### `+critwound` — investigated

The event the blow announces when a critical hit applies a heavy wound. The client composes it as
`msg_+critwound`, **with no `%val%`** — production build `1786514810315`, where `+injure` on the
same switch is `msg_+injure %val%`.

_Help:_ names `critwound`

_Evidence:_ production build `1786514810315` composes it as `msg_+critwound`, alongside `+wound` and
`+of_wound`, which take no value either; the same switch composes `+injure` with one. The published
help documents the effect under the engine name `critwound` — article `view,372` (read 2026-08-19) —
and prints no separate entry for the announcing form, which is how `+injure` stands as well. Absent
from `captures/` as the set stood 2026-08-19.

### `wound` — decoded

**Głęboka rana** — the deep-wound damage a weapon applies, ticking afterwards, and the third key of
this family. It arrives as `heal`, `poison` and `injure` do: the subject in the actor slot of a
message naming nobody at the other end, one figure, read as a negative health change.

_Health:_ moves health

_Cause:_ nobody

⚠️ **The health witness cannot judge the one fight that carries this key, and the reading does not
rest on it.** `2026-08-24-tempest-tropiciel-vs-centaur-1786514810315-none` arrives as a single
engine call with no opening snapshot, so the replay in `tests/core/health-witness.test.ts` seeds no
running total and produces no comparison for it either way — the route `fire` and `light` came in by
is simply not available here. What stands in its place is the same body of evidence chained from a
percentage the protocol states rather than from a snapshot, measured by
`tests/core/wound-rule.test.ts`: every tick's stated percentage is the one stated immediately before
it for that combatant, less the tick's own figure over the combatant's maximum health. Fourteen of
the fifteen close inside 0.007 percentage points; the fifteenth is the killing tick, where the
figure would take the player past zero and the game states zero.

_Shape:_ 42 occurrences; alone in its message; a whole number

_Help:_ names `wound`, `wound1`

_Evidence:_ as above, and production build `1786514810315` composes `msg_wound %val%` and
`msg_wound_multi` where the value splits on a comma — the two branches `injure`, `critwound` and
`poison` take as well; no occurrence here carries the second member. The published help documents
the damage at article `view,372` (read 2026-08-19): the weapon attribute under the engine names
`wound1, of_wound1`, applied for five turns after a hit doing non-zero damage, and the type's
behaviour in the table of damage over time. Carried by one recording,
`captures/2026-08-24-tempest-tropiciel-vs-centaur-1786514810315-none.json`, and by no other as the
set stood 2026-08-24.

### `+wound` — decoded

The event a blow announces when a weapon's deep wound is applied, read as a proc: an effect that
fired with the attack and states no figure. `+of_wound` is the auxiliary weapon's own and no capture
carries one, so it is not read.

_Shape:_ 14 occurrences; on a blow; no value

_Help:_ names `wound`, `wound1`, `of_wound1`

_Evidence:_ production build `1786514810315` composes `msg_+wound` and `msg_+of_wound`, both without
a value, on the switch that composes `+injure` with one. The published help documents the effect
under the weapon attribute `wound1, of_wound1` and the event in its table of damage over time —
article `view,372` (read 2026-08-19) — and prints no separate entry for either announcing form, as
it prints none for `+injure` or `+critwound`. Every occurrence rides a blow of the monster's in
`captures/2026-08-24-tempest-tropiciel-vs-centaur-1786514810315-none.json`, the one recording
carrying either half of this pair as the set stood 2026-08-24.

### `+legbon_anguish` — decoded

The event a blow announces when the legendary bonus **Krwawa udręka** applies its bleeding, whose
ticks this register reads under `anguish`. Read as a declaration carrying no value, and read
**only** while it carries none.

⚠️ **That absent figure is what keeps `anguish` charged to nobody**, and it is the whole of the
difference from `+injure`. That announcement carries the figure that says which application is
ticking, which is the second of the three things §9.6's fourth clause needs; this one carries none,
so a tick and an application cannot be matched and the nearest earlier blow is a neighbour rather
than an answer. The absence is asserted over the material rather than described here
(`tests/core/anguish-rule.test.ts`), so a recording that brings a figure fails rather than passing
under a reading it invalidates.

_Shape:_ 18 occurrences; on a blow; no value

_Help:_ names `anguish`

_Evidence:_ the help prints no entry for the announcing form, as it prints none for `+injure` or
`+wound`; what it documents is the bonus itself, at article `view,372` under the engine name
`anguish` (read 2026-08-25) — the stem this prefixed key was searched by, the full key occurring
nowhere. Every occurrence rides a blow naming both ends, and three recordings carry this pair as the
set stood 2026-08-25 — all three of that day. Two of them hold one applier each;
`captures/2026-08-25-luvia-grupa-vs-draugr-none-none.json` holds two, applying to the same victim,
which is the material the absent figure is worst in: it is what a tick would have to be matched by,
and every announcement states nothing.

### `+swing` — investigated

**Szeroki zamach** — the key whose name suggests a second blow, and the reason this family is in the
register at all. It is not a second blow. The help gives it as a chance event on a **landed
attack**, whose effect reaches further opponents inside that same attack: two more targets in the
form written for a monster's statistic, at most three in the form written for the active effect,
each drawn at random without repeating and each one the attacker could already reach without moving.
The additional damage is rolled from the main weapon's own damage range.

⚠️ **Whether those further targets arrive as messages of their own is precisely what no recording
can be asked.** A blow is one message here, and an event putting damage into two more opponents
either rides the message it fired on or produces two beside it — the difference between one swing
and three in `blowsStruck`, and one the client cannot settle either: its branch composes the
announcement and never the damage. Meaning first, material second, and the material is what is
missing (§7.1).

_Help:_ names `swing`

_Evidence:_ production build `1786514810315` composes `msg_+swing` with **no `%val%`**, on the
switch where `+injure` carries one — so the key announces its event and states no figure, as
`+fastarrow` and `-contra` do. The published help documents the effect twice, both times under the
engine name `swing` — article `view,372` (read 2026-08-21) — once as a monster's statistic and once
as an active effect, and the two forms differ in how many further targets each names. Absent from
`captures/` as the set stood 2026-08-21.

### `-parry` — investigated

**Parowanie** — a defence event, and the second of the two doors a riposte comes through. The help
gives it as a chance, on taking damage from a weapon held in the hand, that the damage is reduced to
zero and the blow becomes a miss.

_Help:_ names `parry`

_Evidence:_ production build `1786514810315` composes `msg_-parry` with **no `%val%`**, on the
switch that composes `-evade` and `-contra` the same way and `-blok` with a value. The published
help documents the event under the engine name `parry` — article `view,372` (read 2026-08-21) — as a
chance to reduce melee damage to zero and turn the blow into a miss, and documents `pcontra`
separately as the chance of a Kontra following it. Absent from `captures/` as the set stood
2026-08-21.

### `attack` — not a battle key

### `attack2` — not a battle key

Neither belongs to the switch that reads battle messages. They come from a different switch in the
same client module.

_Evidence:_ they appeared in the first key list because it was gathered by grepping the whole
module, which holds three switches. Bounding each switch by brace balance removed them, and they are
absent from the production battle switch entirely. Recorded so nobody spends a second afternoon on
them.
