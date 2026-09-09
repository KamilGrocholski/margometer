# 0062. A shout holds one character, and the last one wins

- **Status:** Superseded by 0063 in part
- **Date:** 2026-09-09

## Context

**ADR 0061** drew one line under every cast: which side it reaches, and — for a `shout` — whom the
caster's side was pointed at. One shape for thirteen skills. Three readings say that shape is wrong,
and they point the same way: **the window should follow each skill's mechanic.**

**The published help settles what a shout does.** Article 372, read 2026-09-03, engine name `shout`:

> zmusza Postacie, na które nałożony jest efekt, do obierania za cel ataku Postaci, która użyła
> umiejętności z tym efektem. Efekt działa na Gracza, będącego celem umiejętności **oraz losowo na
> pozostałą liczbę Graczy** określoną w parametrze efektu.

So it forces the affected to attack **the caster**, it catches the named character **and randomly
others the protocol never names**, and its parameter is a _count_ of characters — which is why the
published table writes `shout=6@3` where the wire writes `shout=<name>`.

**The corpus can check the overwrite, and the shape ADR 0061 drew fails it.** Measured 2026-09-09
over `captures/`: 18 recordings carry a shout, and in
`2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0` a Wojownik and a Paladyn shout at the same
monster, interleaved. Keyed by `(caster, skill)` that stands as **two** provocations at once on one
character.

**A whole-team skill has nothing to say about whom.** `Szadź` reaches the caster's whole side by the
register's own word, so `na: Oni` under it states what the heading already did.

**A group word drawn where a name is drawn reads as a name.** `na: My` sat in the place a nickname
sits, in the ink a nickname is drawn in, and was read as a player called _My_.

## Decision

**A shout is one provocation per character, and the last shout holds them.** A later cast naming the
same character replaces whatever held them — from any caster, and across both skills that carry
`shout`: Paladyn over Wojownik, Wojownik over Paladyn. `src/core/aura-standing.ts` keys a shout by
the character it names and every other cast by `(caster, skill)`. Expiry is unchanged: what has
passed of what the table gives it, counted in the holder's own turns (**ADR 0059**).

**The source of that rule is the maintainer's knowledge of the game, and the corpus can neither
confirm nor refute it.** Nothing observable follows from one character being held by two casters at
once: the protocol announces the cast and never who is attacking whom because of it. So the shape is
stated here rather than measured, and the one thing the corpus _does_ check — that two casters at
one character stand as one row — is the test named for that recording.

**A whole-team cast carries no line saying whom it reached.** No side, no `na:`, no `w:`. The
counted row, its casters, and what has passed of what was stated.

**The provoked stand in a section of their own, one row per character**, each with the name of who
holds them and the skill that does.

**The section closes with a line that is not a person, drawn as not a person.** It says outright
that the game also catches others it does not name, in `UNKNOWN_COLOUR` — `DESIGN.md`'s ink for what
the protocol named nobody for. It stands once per section, because the limit is the mechanic's and
not each cast's.

**The heading counts characters, and counts them once.** A plain figure, not the two-sided pair the
skill rows carry: the provoked are the caster's opponents by the mechanic, so a second figure there
would be a claim nobody made.

## Consequences

Easy: the two okrzyki read as one state, which is what they are. A reader sees who is pointed at
them and for how long, without a line under `Szadź` telling them what the heading said.

Hard: **the count of provoked characters is shape rather than measurement.** Every recording in
`captures/` is ten against one, so no shout in the corpus names more than one character and the
count is never above 1. `TODO.md` has wanted a group recording since the first row of it; this is
the second reading that waits on one.

Also: `src/core/aura-standing.ts` keeps the key-to-side table, because `docs/auras-standing.md`
reports it and it is what tells a shout from a whole-team cast. It is no longer drawn.

## Alternatives

**Keeping one uniform line under every cast.** One shape is cheaper to hold and cheaper to test, and
it is what made `Szadź` say `na: Oni` and made a group read as a nickname. The mechanics differ; the
rows may too.

**Keying a provocation by its caster.** It is what ADR 0061 did, and the Amaimon recording is what
it costs: two rows standing where the game holds one character.

**Drawing the closing line as an ordinary row.** It would be counted with the people, in the ink a
person is drawn in — which is the reading the maintainer flagged, one shape further along.

**Naming the others.** The protocol never does. Article 372 says they are picked at random, and
inventing them is the one thing `AGENTS.md` refuses outright.
