# A reading that says when it stopped

Status: implemented

Written for the round beginning at `6ba91e3` and landed across the commits that
follow it. Every figure below is re-measured by a test rather than trusted from
this page — which is the only reason it is allowed to be written down at all
(§5).

## The question this answers

How do we raise confidence in what the add-on reads out of the game, when the
only source of new material is somebody's own play and there is not much of it
coming?

The measurement that reframed it: `bun tools/decoding-status.ts` reports 2 788
messages, 2 788 fully read, zero unread keys. On our own material the decoder is
complete. So the decoder was not where the risk was.

Two places it actually sits:

1. **The material is narrow.** `tests/frozen-protocol-keys.ts` holds 234 keys the
   client branches on. The 8 captures carry 85 of them. **162 have never been
   seen**, among them families that look like they move health. Nobody has sorted
   that 162 into battle keys and the rest.
2. **`src/game/` answered a changed game with zeroes.** Every number the add-on
   produces passes through one function that read one field and returned an empty
   list for anything it did not recognise.

Since the first cannot be fixed by asking for more fights, this round is about
the second: **the reading has to say when it stopped reading**, so that the day a
never-seen key or a renamed field arrives at a real player's screen, the panel
says the number is short instead of quietly printing a smaller one.

## What was measured first

Over `tests/captured-fights/` — 8 fights, 400 engine calls, 2 788 messages.
Every branch below was measured before it was written; none of these figures is
in prose anywhere else, and all of them are re-measured by the tests named.

### The payload

| Question | Answer |
|---|---|
| payloads that are records | 400 / 400 |
| carrying the messages field | 380 |
| that field is a list | 380 / 380 |
| that list is empty | **0** |
| no messages field at all | 20 — every one a fight opening or closing |
| carrying the count field beside it | 380 / 380 |
| the count field without the messages field | **0** |
| its length equal to the messages list's | **380 / 380** |
| entries that are not text | **0 of 2 788** |

### The companion count

The client does not read it. Measured on production build `1786514810315`
(`.cache/game-client/production/`, fetched 2026-08-12; served build compared with
`bun tools/game-client-source.ts status` and equal): **zero property accesses to
it anywhere in the bundle**.

So what it is *for* is not something this repository can claim, and it does not.
What is claimed is only what was counted: it counts the same things the messages
list does. That is enough to make it a witness, and the direction matters — it is
read as **positive evidence that messages were stated**, never as evidence that
none were. Losing it to a rename costs a witness and cannot invent an alarm.

### The roster

| Question | Answer |
|---|---|
| payloads carrying a roster fragment | 389 |
| entries in them | 1 794 |
| entries stating all of name, side, profession, level | 63 |
| entries stating none of them | 1 731 |
| entries stating **some** of them | **0** |
| entries naming somebody that cannot be read | **0** |
| side, id and level arriving as numbers | 1 794 / 1 794 |

The split being perfectly bimodal is the whole licence for counting "an entry
that names somebody and cannot be read". A counter of every refusal would report
about 1 700 drops per fight, and a warning wrong 1 731 times out of 1 794 is one
nobody reads twice.

## What was decided

**The absence of messages is not an alarm.** It is 20 of 400 real payloads. This
is the decision the whole design turns on: the old reader was not wrong to return
an empty list, it was wrong that the empty list meant two different things.

**Three faults, and a clean answer that includes "the payload mentioned no
messages".** `payload-not-a-record`, `messages-not-a-list`, `messages-lost`. Each
was measured at 0 occurrences on real material before it was written, which is
the half of a warning's design that is usually skipped: a fault that fires on
material people actually have is worse than no fault, because it teaches them to
scroll past.

**A count that is not known is not zero.** `lostMessages` is `number | null`, and
the panel's sentence loses its figure rather than gaining a nought (§9.6).

**Nothing in `src/core/` changed.** These are facts about the engine, not about
the fight: they never pass through the decoder and cannot be produced from a
capture offline. They ride beside the aggregate on `FightReading.engineReading`,
required there so a producer cannot forget them, and the panel declares its own
structural counterpart, optional because a caller with no engine truthfully has
nothing to say.

**The wrap marker's name is the contract; its value is not.** Asking whether the
marker equalled *our* version answered the removal question correctly and the
installation question backwards, so an older copy of ours was not recognised, a
second layer went on, and every figure doubled. Installation now asks for the
name alone; removal asks for the wrapper's identity, which is strictly stronger
than the version it replaces — two copies of one build share a version.

## Rejected alternatives

- **A threshold instead of the companion count** — "a fight this long should have
  produced more than N messages". Needs a constant nobody can derive, and the
  count subsumes four failures at once with no taste in it.
- **A list of payload shapes we recognise, alarming on anything else.** 8 distinct
  key sets in 400 payloads on this material alone; it measures the game's freedom
  rather than our blindness.
- **An optional fourth parameter on `composeNextSession` defaulting to "nothing
  was wrong".** It leaves all 23 existing call sites untouched, which is exactly
  how the silence returns: a default meaning clean is a default that makes the
  number look right.
- **Putting the counts inside `core`'s `ReadingGaps`.** One object for everything
  unread is tidier and wrong: the aggregate would carry two numbers it never
  counted and cannot check, meaningless for every offline caller and `0` there —
  a figure nobody wrote, in the one type this project keeps pure.
- **A non-enumerable marker on the battle object.** The only thing that stops a
  second layer even with a stranger's wrapper in between — but the page handle
  already closes that from above, and this writes a property onto the game's own
  object and can wedge us permanently if the game ever replaces the method after
  our wrap. More contact with the game (§5) for a case already closed.

## What this leaves open

**If the game renames the messages field and the count beside it together**,
every payload again reads as "mentioned no messages" and nothing fires. Closing
it needs a witness at the scale of a fight — *this fight opened, N payloads went
by, nothing was read* — and a threshold for N that has to come off the material
rather than out of the air. Measured while writing this: messages start at call 0
in 6 of the 8 captures, at call 2 and call 3 in the other two. That is thin
evidence for a constant, which is why it is not in this round.

The same shape would cover the roster: a fight whose roster is nobody.

**The material is still narrow**, and this round does not widen it. What it does
is make the first encounter with a never-seen shape visible rather than silent.
The rest of that problem — keeping the fight that carried something unread, so a
rare key is not lost when the next fight starts, and sorting the 162 unmet keys
— is the next round.

**`setBattleWrap` is still called without a `try` inside the attachment's timer
callback**, so an `EngineBattleWrapError` there repeats every 100 ms for the
remainder of the search and escapes into the page. This round changed that
function's return type and deliberately not its control flow.

## What the round found about itself

Four commits, and in each one a clause was correct and untested — every one of
them at a **join** rather than inside a function:

- `changedNothing` not counting a faulty payload
- `changedNothing` not counting an unreadable roster entry
- `composeFightReading` handing on the counts at all
- removal choosing by identity rather than by the marker

None was found by writing tests. All four were found by breaking the line and
watching nothing go red. The lesson is not "write more tests" — it is that the
gaps sit where two correct pieces meet, and that `tools/mutation-sweep.ts` is the
only thing here that looks there.
