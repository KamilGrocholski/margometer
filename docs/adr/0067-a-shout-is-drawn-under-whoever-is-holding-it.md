# 0067. A shout is drawn under whoever is holding it

- **Status:** Accepted
- **Date:** 2026-09-09

## Context

The `Prowokacja` section drew one row per held character with a wrapping sentence beneath each,
naming the holder and the skill — `od Gracz 4 ·` `Wyzywający okrzyk`. Two people held by one shout
were two rows, two sentences, and **the same turn figure printed twice**.

Measured over `captures/`, 30 recordings, 787 moments carrying a provocation, 2026-09-09:

- **11 casts held two characters. In all 11 the turns are identical; in 0 do they differ.** The
  turns belong to the cast, and the old shape stated them once per character held.
- **0 moments where one caster held two different shouts.** A caster row is a cast row in the
  material.
- **The most characters held at once is 2**, and the most caster groups standing at once is **1**.
- `frozen/aura-turns.ts` states both shouts at 3 turns and `coverageMinimum` 6, so the game permits
  six where the corpus has seen two.

What the section costs, in lines:

|                    held | before | after |
| ----------------------: | -----: | ----: |
|                       1 |      2 |     2 |
|                       2 |      4 |     3 |
|   6 (`coverageMinimum`) |     12 |     7 |
| 12 (`MAXIMUM_PROVOKED`) |     24 |    13 |

## Decision

**One row per cast, and the characters it holds under it.** The holder's name, the cast's turns,
their profession as the cap and their side as the rule on the edge (**ADR 0065**). Under it, one row
per held character with the same two answers and **no turns** — they are the cast's and are stated
once, above.

**The skill name is drawn nowhere.** Both shouts run 3 turns and cover 6, so naming which one it was
distinguished nothing a reader can act on. It is the same kind of loss `docs/auras-standing.md`
already records for `covers`: a true reading that is drawn nowhere.

**The heading goes on counting characters held**, not casts. ADR 0062's rule, unchanged.

**The section is never folded behind a press.** Whom a shout holds is the whole question it answers.

## ⚠️ This is not the alternative ADR 0062 rejected

ADR 0062 refuses **"Keying a provocation by its caster"** — _"the Amaimon recording is what it
costs: two rows standing where the game holds one character."_

That refusal is about the **model**, and the model is untouched. `src/core/aura-standing.ts` still
keys `byProvoked` by the held character, so "the last shout wins" is settled before the panel sees
anything and a caster who lost a takeover has no entry left. What is folded here is a list in which
**every entry is an already-settled pair**.

Measured over the same 787 moments: **a character appears twice in that list 0 times.** The cost ADR
0062 named cannot be re-incurred by folding a list that cannot hold a character twice.

ADR 0062's other rules stay live: one provocation per character, last one wins, its own section, and
a heading that counts characters once.

## Consequences

Three places drew a person in that window and each drew them differently — the turn holder as a bare
name, a caster under a skill, a held character. They are now one composer, so a person is drawn the
same way wherever they stand, which is what **ADR 0065** asked for and this finishes.

`STANDING_WORDS.heldBy`, `heldByAndSkill`, `composeProvokedHolderParts` and the `.standing-holder`
rules go with the sentence they composed. `overflow-wrap` left the stylesheet with them, so
`docs/browser-support.md` drops it — the register refuses a property the sheet no longer spells.

`.standing-caster` nested one thing and now nests two, so it is `.standing-under`: named for what it
does rather than for who happens to stand in it (**N9**).

A reader who wants to know which of the two okrzyki is holding them cannot find out from the panel.
Accepted, and this is where the cost is written down.

## Alternatives

**The skill name on a quiet line under the holder.** Nothing is lost, but it costs a line at the
count the corpus almost always shows — 3 where today is 2. Paying at the common case to say a thing
that distinguishes nothing is the wrong trade.

**The held characters as a wrapping sentence under the holder.** Shortest of all at six, and it
takes their person rows away — the profession hue and the side rule **ADR 0065** had just given
them. The section would state less about the people it is about.

**Leaving it as it was.** It repeats a figure the data says is one figure, and it scales at two
lines per character against the game's stated six.
