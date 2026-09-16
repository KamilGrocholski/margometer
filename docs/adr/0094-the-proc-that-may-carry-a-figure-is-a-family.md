# 0094. The proc that may carry a figure is a family, not one key

- **Status:** Accepted
- **Date:** 2026-09-16

## Context

**ADR 0085** decided that a proc is read as a proc whether or not it states a figure, and that the
figure is not read. It named the set rather than generalising it: `PROCS_WITH_A_VALUE` holds
`+woundpoison` **and nothing else**, so any other proc arriving with a value still goes back to
unread and stays loud.

That set was one key because one key was in front of us. The register entry written beside it
already knew better, and said so: _"the same switch composes `+woundfrost` and `+woundmagic` for the
two other things that weaken a wound. Two of the three have an `+of_` twin for the auxiliary weapon;
`+woundfrost` has none."_ Four keys were named, understood, and left unread.

**Read on production `Bb28FQty`, 2026-09-16.** One switch composes six wound announcements.
`msg_+wound` and `msg_+of_wound` take no `%val%`; `msg_woundpoison`, `msg_woundfrost`,
`msg_woundmagic`, `msg_of_woundpoison` and `msg_of_woundmagic` each take one. So the split is not
between poison and the rest — it is between the bare announcement and **every** announcement that
names what weakened the wound. `+woundpoison` was on the far side of that line together with four
others, and the tree read one of them.

What that cost is the same thing **ADR 0085** was written to stop: a wound something weakened
reaching the panel as a message nobody could read, so a player sees a defect against a mechanic this
repository has documented. None of the four is in `captures/`, so the material never showed it.

## Decision

**`PROCS_WITH_A_VALUE` holds the five keys that switch composes with a value**, not one of them:
`+woundpoison`, `+woundfrost`, `+woundmagic`, `+of_woundpoison` and `+of_woundmagic`.

The set stays **named rather than general**, which is the half of **ADR 0085** this record keeps
whole. A `+crit=3` is still a shape nobody has met, and it still goes back to unread.

**The figure stays unread**, also unchanged. What the percentage is a share of is not settled by the
material — 0085 measured that and quoted nothing, and nothing here measures it again.

**All five share the word `osłabiona rana`.** `composeCardWordedParts` groups a card's rows by word
and sums their counts, so five keys under one word draw one row counting all of them. That is the
rule `+of_wound` already stands under with `+wound`: splitting one mechanic over the hand that threw
it puts a second row on the card that answers no question a reader has. The word is unchanged from
0085, fourteen characters under the column's bound of twenty-two.

## Consequences

**ADR 0085 is superseded in part** — the part naming the set, and only that part. Its reasoning for
reading a valued proc at all, its refusal to read the figure, and its measurement of what the
percentage does not track all stand, and this record rests on them rather than replacing them.

**A reader meeting a weakened wound sees one row, whatever weakened it and whichever hand threw
it.** What the game distinguishes — poison against frost against magic — the panel does not. That is
a loss, and it is chosen: three rows counting a mechanic a player meets rarely would cost more of a
narrow card than the distinction returns.

**The material still shows none of this.** `captures/` carries no occurrence of any of the four, so
nothing here is held by a recording; it is held by the client's own switch and by the fabricated
fight, which now states all five so a reader can look at the row.

## Alternatives

**Leave the four unread until a recording carries one.** Rejected: it is what was already happening,
and the register had documented the keys for three days while a player meeting one would have been
told the panel could not read their fight. The evidence that settles them is the client, and waiting
for material adds nothing to it — the same argument the `+stun2` and `+resdmg` variants were read
on.

**Generalise instead of naming: let any proc carry a figure.** Rejected, and this is the half of
**ADR 0085** most worth keeping. A named set is what makes an unexpected `+crit=3` loud; a general
rule would swallow it silently, which is the failure this project exists to avoid.

**Give each weakener its own word, and each hand its own row.** Rejected: it would put three or five
rows where one answers the question, on a card **ADR 0091** already sizes to what it says, and it
would change a label that is already released. `+of_wound` sharing `+wound`'s word is the precedent,
and it was decided for this reason.

**Read the figure now that five keys state one.** Rejected: five sources of an unsettled share is
still an unsettled share. **ADR 0085** measured it against the ticks and the blows and found it
tracked neither; more keys stating the same percentage is not more evidence about what it means.
