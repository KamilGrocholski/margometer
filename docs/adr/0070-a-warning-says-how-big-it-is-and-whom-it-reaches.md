# 0070. A warning says how big it is, whom it reaches, and what could not be read

- **Status:** Accepted
- **Date:** 2026-09-09

## Context

Every sentence the panel drew about a gap had the same three parts: what happened, a bare count, and
`więc liczby mogą być zaniżone`. None of the three answers the question a reader actually has, which
is whether to trust the figure above it.

**A count with no denominator says nothing.** Two messages unread is a fight nobody can trust where
twelve arrived, and a number in the third decimal place where four hundred did. The panel had the
denominator all along — `FightUnderway` keeps every message it read — and threw it away.

**A fight-wide sentence named nobody.** After ADR 0069 the mark on a row and the card it opens are
the only things that say whose figure is short, and a mark says nothing until a pointer stops on it.
A reader on a ten-a-side ranking had to point at each row in turn to find out whether the sentence
under the list was about anybody they cared about.

**Three different failures were drawn as one.** `src/core/fight-decoder.ts` has always told them
apart — a key it has no meaning for, a message carrying no parameter at all, and a message the
grammar would not take apart — and `src/core/fight-statistics.ts` added all three into one
`unreadMessages`. The first is the game having moved past this add-on and is the one worth acting
on; the other two are not. `tools/decoding-status.ts` tried to recover the distinction downstream by
testing `unreadKeys.length === 0`, which is **also true of a message stating no parameter**, so its
`grammar refused` line counted both. Both are zero over `captures/` — 12 201 messages, 30
recordings, 2026-09-09 — so the miscount never showed.

`ARCHITECTURE.md` reserved a third kind of gap as `[ASK]`. This is the ask, and it was granted.

## Decision

**A drawn warning states its count against what that count is out of, names whom it reaches while
they are few, and says which of three things could not be read.**

- `UnknownMessageEvent.reason` — a free string written at two sites and read by one test — becomes
  `unreadCause`, a union of `unknown-key`, `no-parameter` and `grammar-refused`. It is spelled
  `unreadCause` and not `cause`, because `cause` in this tree is the original an error wraps
  (**E6**). `FightStatistics` and `CombatantFigures` count under each cause instead of together;
  `getUnreadMessages` is the one place the sum is spelled. A refused message names nobody, so no row
  carries one, and `addUnreadMessageToRows` asserts it.
- `FightStatistics.castsStated` counts every cast reaching a side, sized or not, which is what
  `castsUnplaced` is out of. `FightSuspicions.messagesRead` is the same for messages, counted in
  `addPayloadToFight` beside `messagesLost` rather than walked for at draw time.
- The sentence names the charged rows up to `MAXIMUM_NAMED_ROWS` (three), and past that says how
  many rather than listing them. A row the roster cannot name is counted and never guessed at.
- A denominator smaller than its count is a reading disagreeing with itself; the sentence then
  states the count alone rather than a fraction nobody can read (**E14** — it clamps in place).

Every sentence says **what cannot be known** and never what this reader could not do (**L3**). That
is what keeps the three causes apart in Polish: a message whose meaning is unknown, one that carried
no figure, and one that could not be taken apart are three different things to be short of, and none
of them is a sentence about our decoder.

## Consequences

The reader gets the two things the mark cannot give them without a pointer: how much of the fight
this is, and whether it is about anybody on their side.

**A row's sentence carries no denominator**, and that asymmetry is deliberate: what a row would be
counted out of is the messages naming that person, which nothing counts. Inventing one would be a
figure with nothing behind it.

`MAXIMUM_WARNINGS` rises from four to six and `ROW_WARNINGS` from two to three, because the split
turns one sentence into three. In every case anybody has seen a fight is short under one cause at a
time, so the list is no longer in practice than it was.

The naming is a **partial retreat from ADR 0023's one-channel argument**, and it is worth saying so
plainly: the fight's sentence now says something the row's mark also says. What keeps it from being
a second ranking is the bound — three names, then a count — and that the two answer different
questions: the sentence says how much of the fight, the mark says whose figure.

The downloaded report and `deno task fight:figures` carry the split, so the file a reader hands over
when a number looks wrong says which of the three to go and look at. `deno task fight:decoding`
gains a `no parameter` line and its `grammar refused` line now counts only refusals.

## Alternatives

**Keep one `unreadMessages` and say the causes only in the tools.** Refused: the panel is where
somebody notices, and "the game said something this add-on has no meaning for" is the one of the
three that should send them to the tools at all.

**Put the unread keys themselves in the sentence.** The strongest possible answer to "what". Refused
by **L3**: a key is the game's own vocabulary and a player is told what cannot be known, not what it
arrived under. The keys are in `deno task fight:decoding`, which is where somebody who can act on
them is standing.

**Name every charged row.** Refused: the list grows with the fight, and twenty names in a paragraph
under the ranking is the ranking again, drawn worse.

**Say the share as a percentage.** Refused: a percentage of messages is not a percentage of any
figure a reader can see, and it would read as one.
