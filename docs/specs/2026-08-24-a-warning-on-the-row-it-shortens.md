# A warning on the row it shortens

Status: draft

Every warning this panel draws is about the whole fight. §9.6 says the opposite —
*put the warning where the consequence is, next to the figure it concerns and not
in a global banner* — and the clause has never had a consumer. This gives it one
for the two gaps that name somebody, and leaves the strip standing for the ones
that name nobody.

## What was asked for

> Add warnings on a row for unread messages, and invalid calculations.

Two gaps, and they are not the same kind of claim.

| | what it says | how certain |
|---|---|---|
| an unread message naming somebody | one of their figures **may** be short | suspect |
| a side heal this meter could not size | the caster's giving **is** short | certain |

§9.6's two severities, arriving on one row. The order they are said in is the
order the strip already uses: the certain one above the suspicion, because
ranking *this is missing* under *something might be* buries the only line that is
not a guess.

## Where the panel stands today

`composeWarnings` in `src/ui/panel-view.ts` reads `FightStatistics.reading` and
returns sentences about the fight. `renderRow`'s neighbour in
`src/ui/panel-element.ts` draws them under the side bar, below everything. A
reader told *some events could not be read* has no way to learn whose totals that
cost, and the answer is in the material: a message states its two ends before it
states anything else (`src/core/protocol-message.ts`).

## What the protocol already names

**An unread message.** `parseProtocolMessage` reads the actor and the target out
of the first two segments and only then looks at the keys. So a message that
fails on a key — which is every unread message in a fight whose grammar the
decoder still understands — has both of its ends in hand at the moment it is
given up on. `UnknownMessageEvent` threw them away.

**A cast nobody could size.** `UnaccountedHealthEvent` carries `combatantId`, and
the field's own note says which end that is: *"For `healall_per` that is the
caster, never the healed — which is the whole difficulty"*. The aggregate counts
the cast and places nothing, deliberately. Counting it **on the caster's row** is
not placing a figure: it says a number is short, in a place the protocol named,
without saying by how much or to whom.

## What changes

`UnknownMessageEvent` gains `combatantIds` — the ends the message itself named,
deduplicated, in protocol order. Read off the two slots and nowhere else.

**Empty is a claim, and it is the same claim twice.** The grammar failed before
there were slots to read, or the message wrote `0` at both ends. Neither means
*nothing was unread* — this event exists only where something was, which is what
its `unreadKeys` field already says of itself.

The aggregate gains two counters per row, beside `skillsUsed`:

- `unreadableMessages` — messages naming this combatant that were wholly or
  partly unread.
- `unaccountedHealingCasts` — side-share casts this combatant made that no
  arithmetic here could size.

Both are counts of **events**, never of health. The point of the second is that
there is no figure; giving it one would be the invention §5 forbids.

The panel puts a `⚠` beside the figure on that combatant's row and the sentence
in the card the row opens on hover. Colour never carries it alone (§9.7): the
glyph is the mark, the colour is the existing `suspect` token, and the words are
what say which of the two happened.

## Its limits, and each is load-bearing

**The strip stays exactly as it was.** It answers *how much of this fight was
read*; a row answers *whose figure is short*. Those are different questions, and
the strip is the only place that can carry a message naming neither end, a
payload that never arrived, or a panel that wired itself in mid-fight. A row
appearing does not make the fight-wide sentence a repetition — it makes it the
total the rows are part of.

**Unread messages mark every metric; an unsized cast marks only `Leczenie
dane`.** The first is honest because an unread key can carry anything — damage,
healing, a statistic — and the panel does not know which figure it would have
moved. The second is precise because the protocol says what was lost: healing,
given, by the combatant it named.

**No mark on the healed side of an unsized cast.** The cast reached a whole side
and this meter cannot say how much reached whom; a mark on each member would
claim a shortfall onto people the game never sized. That shortfall stays where it
already is — the fight-wide sentence, and the `unaccounted` reading §10 names.

**No mark on a breakdown row.** A per-opponent or per-skill row is a cut of a
figure, and a shortfall cannot be placed onto one cut. The combatant's own row
carries it at every level, which is where the card already answers for the person
rather than for the pair.

## Held by a constructed fight, not by a measurement

Zero in every recording, and that is why it is written down.

Measured on `tests/captured-fights/` as the set stands 2026-08-24:
`bun run tools/fight-report.ts` prints `unreadable messages: 0` and
`unaccounted healing: 0 casts` for every one of them, and
`bun run tools/decoding-status.ts` reports `carrying unread 0` over 8 606
messages. Every `healall_per` cast in the material sizes wholly, so no
`unaccounted-health` event survives to reach a row.

So the guards are hand-built fights, the way
`docs/specs/2026-08-18-a-tick-nobody-swung-still-has-a-side.md` had to build one
for a blow naming neither end. The corpus half of the claim is the one worth
having beside them: **no capture grows a mark**, which is how this round proves it
moved no existing number.

## What it cost to find: two forms are one form too few

The row sentences count things, and Polish counts three ways. Every counted
sentence the panel already had picked between two — `count === 1 ? a : b` — and
three of the four were right, not because two forms are enough but because the
grammatical case each of those sentences governs happens to spell the second and
third alike. *Nie dało się odczytać N zdarzeń* is genitive throughout, so it never
needed a third; one of the four had already given up and wrote the same word on
both branches.

`Nie dotarło N zdarzeń` is the one that is not, and it had read *3 zdarzeń* for
its whole life. So the rule moved into `composeCountedText`
(`src/ui/panel-words.ts`), the four existing sentences were switched to it, and
the forms stay the caller's — the same noun takes different ones under different
verbs, so a table keyed by noun would be wrong for half of them. A caller passing
one word twice now says so, where a ternary said nothing.

That is the only thing on the strip this round changed, and it changed no
sentence's meaning.

## Rejected alternatives

**A flag rather than a list of sentences on the row.** A row can be short for
both reasons at once, and a boolean would draw one glyph over two different
facts with nothing in the card able to tell them apart. The list costs a field
and buys the only thing the mark is for.

**Moving the two sentences off the fight strip once every occurrence has a row.**
Closer to §9.6's letter and wrong in practice: a fight whose reading really is
short would go silent on the screen the moment every unread message happened to
name somebody. The strip is not a banner over a figure — it is the reading's own
summary, and it is what a player quotes in a report.

**Carrying which side members `composeCast` skipped**, so a partially sized team
heal could mark the people it could not size. A genuine second reading of
*invalid calculation*, and set aside rather than declined: it needs
`src/core/combatant-health.ts` to carry a new shape out of a function that
currently answers with a boolean, and this round is already at the data contract
(§4). Worth opening on its own.

**Surfacing the `Math.max(0, …)` clamps in `src/ui/panel-reading.ts`.** Each one
hides a row whose cuts sum past its own total, which would be an invalid
calculation in the strictest sense. Declined here: unreachable by construction on
this material, so a warning for it would be a warning nobody can make fire — and
an unfireable warning is the shape §3's mutation rule exists to catch. It is a
finding for an audit.

**Naming the unread key in the sentence a player reads.** A key is what a *report*
should carry, and `tools/fight-report.ts` and the download already carry it. On
screen it would put our vocabulary and the game's in front of somebody who is
being told one thing: this number may be low (§3).
