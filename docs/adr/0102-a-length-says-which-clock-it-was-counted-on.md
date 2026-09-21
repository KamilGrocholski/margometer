# 0102. A length says which clock it was counted on

- **Status:** Accepted
- **Date:** 2026-09-21

## Context

**ADR 0101** measured that a side-wide effect runs on the turns of each character carrying it, and
left the panel alone on purpose: it draws `3 z 8 tur` with the numerator counted on the caster, and
three repairs were open. This is which one, and why the other two lost.

The figure is not wrong. It is drawn on a row that names the caster, under a heading that names the
caster, and counted on the caster — so of the person the card is about, every half of it is true.
What is wrong is what a reader takes from it: the section is headed `Co stoi`, and a fraction under
that heading reads as the effect's own progress rather than as one person's.

## Decision

**The figure stays and the card says which clock it counted.** A fourth caveat, `standingLength`, is
owed by the one figure on a card that is counted on somebody other than everyone the figure is
about. The panel already had the machinery — a glyph beside a figure and a sentence at its foot,
read off the figure rather than asked a second time (**ADR 0089**, **ADR 0092**) — and this is the
case it was built for: a label naming more than it counts.

**A provocation gets its own sentence, because less is known about it.** No status bit stands for a
provocation and the published help dates `shout` nowhere, so `provocationLength` claims no clock at
all where the aura's names the one it counted. Two sentences rather than one: the difference between
a thing measured and a thing nothing witnesses is the evidence, and one sentence over both would
spend it.

**A card stating no turns owes neither.** A held character's card carries no figure (**ADR 0067**),
and a sentence there would qualify a number the card does not draw.

**Nothing about when a row leaves changes.** It leaves when the caster's stated turns have passed,
which is right for the caster and silent about everybody else — the silence **ADR 0061** chose.

## Consequences

Easy: two sentences and a field. The figure a reader has been reading for three releases goes on
saying the same thing, and stops implying the one thing it cannot support.

Hard: **a reader who wants the answer for themselves still does not get it.** The panel says the
clock is somebody else's without saying what theirs reads, because naming a bearer is what **ADR
0061** refuses and the mask carries neither a caster nor a stated total. The sentence is the whole
of what can be said honestly today.

Also: the sentences are written to the length the card's arithmetic wants. Both come to two lines of
the card at `NOTE_CHARACTERS_PER_LINE`, which is where `turns` was already written to.

## Alternatives

**Dropping the fraction.** The most honest sentence available without a bearer's clock, and it takes
away the thing **ADR 0059** was asked for. A panel that says less than it knows is its own kind of
wrong, and the caveat costs two lines to keep the figure.

**Reading the mask in `src/`.** The bundle would learn when nobody carries a status any more, so a
row could leave on evidence instead of on arithmetic. It reopens **ADR 0061**, and the bit still
names no cast: a status lit by somebody else's skill is the same bit. Worth its own round, not this
one.

**One sentence over both.** Cheaper, and it would tell a reader that the same thing is known about a
shout as about an aura. Nothing is.
