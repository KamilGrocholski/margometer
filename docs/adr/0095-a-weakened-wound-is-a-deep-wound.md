# 0095. A weakened wound is a deep wound, and the card counts it as one

- **Status:** Accepted
- **Date:** 2026-09-18

## Context

Seven keys announce a deep wound a blow left: `+wound`, `+of_wound` off the auxiliary weapon, and
the five naming what weakened one — `+woundpoison`, `+woundfrost`, `+woundmagic` and the two `+of_`
twins. The card folded them into two rows that stood beside each other and answered nothing
together: `głęboka rana` over the first two, `osłabiona rana` over the other five.

**The cost is on a card in the material.** Combatant `28940` in
`captures/2026-09-11-luvia-grupa-vs-amaimon-Cl9U89Zr-0.15.0.json` announced six deep wounds, every
one of them weakened by poison. Their card stated `osłabiona rana ×6` and **no deep-wound count at
all** — a player counting the wounds they left had no such number, and nothing on screen said the
row they could see was a part of one they could not.

Measured over the whole of `captures/` on 2026-09-18: `+wound` 18 occurrences, `+woundpoison` 6,
`+of_wound` 2, and `+woundfrost`, `+woundmagic`, `+of_woundpoison` and `+of_woundmagic` none at all
— those four are read off the client's own switch (**ADR 0094**) and are looked at through
`deno task preview:fabricated`. Twenty-six messages carry a key of this family and **none carries
two**, so a row summing them counts no announcement twice.

The card already has the shape this wants. `Krytyki` counts `+crit` and `+of_crit` together and
states how many were off the auxiliary weapon on a line under it, which is what a sub-line is for
(`DESIGN.md`).

## Decision

**Every wound announcement lands on one row, and the weakened ones say so under it.** All seven keys
carry the word `głęboka rana`; the five naming a weakener additionally carry `osłabiona`, drawn as a
sub-line under that row and only where its count is above nought.

The relation is the shared word and not a table of parents: `composeCardWordedParts` already folds a
card's rows by the word a key wears, so a key's sub-line hangs under the row its own key folded
into. `PROC_SUB_WORD_BY_KEY` in `src/ui/panel-words.ts` is the whole of what was added, and it maps
a key to a word like every other table in that file.

**The row counts announcements, not blows.** `blowsCritical` counts blows, because 20 blows over
`captures/` carry both `+crit` and `+of_crit` and summing the two keys would count those twice. No
message carries two wound keys, so the wound row is a plain sum. The two shapes look alike and stay
apart.

## Consequences

**A reader gets both numbers where they got one.** How many wounds they left, and how many of those
something weakened. Over `captures/` four cards gain a line and the rest keep their height, measured
with `deno task panel:cards` on 2026-09-18 — the only combatant this moves is the one above.

**This is not the alternative ADR 0085 rejected, and the difference is the sub-line.** That record
turned down folding `+woundpoison` into `+wound` and drawing one row, on two grounds. The second —
"the card would stop distinguishing a wound something weakened from one nothing did" — is what the
sub-line answers: the distinction is drawn, on its own line, under the count it is a part of. The
first — that it "puts a name this repository chose on two of the game's own keys (**N13**)" — was
already true before this decision and in two places: `głęboka rana` covered `+wound` and
`+of_wound`, and `Krytyki` covers `+crit` and `+of_crit`. An objection that had stopped binding is
said here rather than walked past.

**ADR 0094 is superseded in part** — the part giving the five weakened keys the word
`osłabiona rana`, and only that part. Its set of five and its refusal to read the figure they carry
both stand.

**It obliges a key joining this family to say which line it draws.** A sixth weakener would be one
more entry in `PROC_SUB_WORD_BY_KEY`; a wound announcement that is not a weakening would be a row of
its own and a decision, not an entry.

## Alternatives

**Leave the two rows independent.** Rejected on the card above: the row a reader asks for is the one
that was not drawn, and adding two numbers on screen is work the panel exists to have done already.

**Draw all seven as one row and drop the weakening.** Rejected — this is ADR 0085's alternative
whole, and its second objection stands: what the game distinguishes, the card would stop saying.

**An explicit parent-key table rather than a shared word.** Rejected: it puts a key of the game's in
the value position of a table in `src/ui/panel-words.ts`, so `+wound` is spelled twice in one file
and a guard is owed to hold the two spellings together (**N13**). It would also hand the fold a part
carrying a key the statistics never counted, which is a small untruth in the one function a reader
goes to to find out how a row was made.

**Give the auxiliary-weapon halves a sub-line of their own, as `+of_crit` has.** Rejected: the hand
that threw a wound is not a thing a player acts on, which is the rule `+of_wound` has stood under
since it was read, and a second line under this row would be drawn for two occurrences in the whole
corpus.
