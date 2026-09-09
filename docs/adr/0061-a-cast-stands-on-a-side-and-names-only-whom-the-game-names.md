# 0061. A cast stands on a side, and names only whom the game names

- **Status:** Superseded by 0062 in part
- **Date:** 2026-09-09

## Context

**ADR 0059** put what stands in the window: the skill, its caster, and what has passed of what the
published table gives it. The maintainer asked for the fact next to those — **on whom**.

Four measurements over `captures/`, all taken 2026-09-09, settle what may be drawn:

- **Every team-wide cast names exactly one end**, in every cast of every skill.
- **No cast enumerates who the effect landed on.** Not one.
- After a `Podwójny dech`, the caster's whole side carries the matching status bit in **56 casts of
  65**.
- `shout` names somebody the roster holds, agreeing with the target slot, **158 times out of 158**.

So the protocol announces a cast once, names one end, and never lists bearers. Two routes to a name
were open and both are refused:

- **The side's own members.** Wrong on about one cast in seven by the third row above. **ADR 0049**
  rejected an attribution measured at 84.6% in the words that bind here: wrong on one row in six is
  not a figure to draw.
- **The target slot.** **ADR 0010** already measured what reading it costs on a cast reaching a
  side: eight of 115 name a combatant other than the caster, so reading that slot credits the wrong
  one.

**A reading of the published help changed the shape of this feature.** `docs/protocol-keys.md`
records `shout` as _forcing covered characters to attack a chosen target_. So the character a
`shout` names is what the caster's **own side is pointed at** — not what the effect stands on.
Drawing it under "on whom" would have said the opposite of what the game documents.

## Decision

**What a cast stands on is a side, and the panel says which one.** `src/core/aura-standing.ts`
carries the key-to-side table, and every row of it is the register's word, which is the help's.

**A side is stated relative to the caster and drawn relative to the reader.** `casters-side` and
`other-side` are what the game documents; turning either into `My` or `Oni` needs the client's own
answer about which side is the reader's, and **without it no line is drawn at all** — the same
condition, and the same reason, as the two-sided count above it (`CONTEXT.md`).

**Keys that disagree are a skill reaching both sides, not a reading that failed.**
`Wyzywający
okrzyk` points its own side at somebody with `shout` and lowers the opposing team's
damage with `alllowdmg` in one announcement. Calling that unknown would hide half of what it does.

**A key nothing settles reaches nothing stated.** No side is picked for it, and its line is not
drawn.

**A character is named only where the game names one**, which is `shout` and nothing else. It is
read from the event's target slot rather than from the shouted text — the two agree 158 times out of
158, and the slot carries no nickname to handle (`NOTICE.md`).

**A named character is said as `w:` and never as `na:`.** It is the chosen target, and the panel
uses the word for that.

**The chosen one is written before the side.** The line is cut from the right at 210 pixels, and
`obie strony` is the half a reader can do without.

## Consequences

Easy: the third fact the maintainer asked for, with nothing guessed. Which side is the help's word,
whom it points at is the game's own, and how long has passed is counted.

Hard: **in a group fight the window still cannot say which member is slowed.** `Szadź` reads
`na: Oni` and stops there. The one source that would answer per combatant is the status mask, and it
cannot be joined to a cast — so its rows would carry no caster and no stated total.

Also: `allslow_per` is the one key the register does not settle — it lists it among the effects
changing attack speed and never says whose. It is dated by a measurement instead, written into
`docs/auras-standing.md` beside the rest.

## Alternatives

**Listing the side's members as bearers, marked as inferred.** It gives exactly what was asked for,
and it is wrong about one cast in seven on today's corpus. A mark saying "probably" does not make a
wrong row right.

**Reading the target slot on every cast.** It would have named somebody on 445 of 479 messages, and
ADR 0010 already measured that the one it names is not the bearer.

**Saying nothing about the side.** Honest and emptier: the reach is documented key by key, so
refusing to draw it would refuse something the game does state.
