# 0024. The panel asks the client only where it has no word

- **Status:** Accepted
- **Date:** 2026-08-30

## Context

Six keys reach a reader as a bare token, because this repository will not word them. Four are
legendary bonuses whose published name has not been read; two are the pair article `view,372` does
not carry at all. **ADR 0011** is why: wording a mechanic nobody named would be a claim about the
game.

The player's own client has a name for all six. It composes its battle log through a global, `_t`,
over a dictionary keyed by identifiers, and every one of the six ids is spelled by the client —
checked against `.cache/game-client/production/main.js` at build `53XkBRxF` on 2026-08-30.

v1 asked that dictionary **first**, everywhere, and fell back on its own word. v2's words are not
v1's: they were rewritten short for a column the card measures at 22 characters, and a label longer
than that is not merely cut — `getTipSize` counts a stat line as one line, so the card would stand
at a height it was not measured for. An answer out of somebody else's program has no such bound, and
the dictionary is not in this repository, so its lengths cannot be measured here at all.

Most of that dictionary is sentences with `%val%` holes in them. A sentence with the figure cut out
of it is not a label.

## Decision

**Our word where we have one; the player's own client where we do not; the key as the game wrote it
where neither answers.** The panel asks for exactly six ids and never for a key it already words.

Three refusals sit between the client and the card, and each has its own reason:

- an entry carrying a hole is not a label, so the panel draws its own answer instead;
- an entry that is nothing but a sign, a full stop or space is not a name;
- a label longer than the card's column is refused, because the column is ours and the answer is
  not.

The ids are a table rather than a rule. Five are `msg_` and the key; `+superspell-dispel` is
`msg_+dispel`, and that one exception is why a rule would have been wrong.

## Consequences

Six keys stop reaching a reader as raw protocol, in the player's own language, without this
repository claiming anything about what they do. **ADR 0011** stands untouched: it forbids **us**
wording a mechanic nobody named, and this is the game wording it.

A reader on a page with no dictionary — every test, and any browser without the game — sees exactly
what they saw before. `null` is the whole of that path, and it is the default.

It obliges the six-id table to stay six. A key this repository later finds a published name for
leaves the table and takes a word of its own; a key added to the table is a claim that the client
spells that id, and the cached client is where that is checked.

## Alternatives

**Ask first, everywhere, as v1 did.** It gives a reader their own client's vocabulary throughout. It
also puts an unbounded string into a column measured at 22 characters on every label the panel
draws, to replace words already chosen to fit it — and which labels came back too long could not be
measured from here, only discovered by a reader.

**Derive the id as `msg_` plus the key.** Five of the six work that way and the sixth does not, and
a rule with one silent exception is how a key ends up asking for an id the client will queue and
report.

**Word the six ourselves.** That is the claim about the game **ADR 0011** exists to refuse.
