# 0051. The skill table is a frozen reading, and the descriptions stay out

- **Status:** Accepted
- **Date:** 2026-09-03

## Context

Two questions about statuses need a source the protocol does not carry. What a skill's effect runs
for is one — the only place the game publishes a duration. What a `skillId` is called is the other,
and `cooldowns` states ids with no names beside them.

The game publishes both, at `https://public-api.margonem.pl/we_get/skills/`: an HTML table of 226
skills with id, tags, name, description, profession, level count, an effect string and requirements.
The effect string writes a duration as `key=value@turns`, once per skill level — 56 of the 226 state
one. Every `skillId` the corpus announces is in it, with **no misses**.

Two readings already work this way. `frozen/protocol-keys.ts` carries the keys the client's own
switch branches on, and `frozen/help-phrases.ts` the counts a claim about the published help is
re-earned against. Both are fetched by a tool, dated, and never by the add-on — which sends nothing
anywhere (`SECURITY.md`).

## Decision

**The skill table joins them, as a third frozen reading.** `tools/skill-table.ts` fetches it,
`frozen/skill-durations.ts` holds it, and `deno task game:readings` reports it beside the other two
so a work round can tell it has gone behind (**W10**).

**Ids, effect keys and stated turns, and nothing else.** The description column is the game's own
prose and stays in `.cache/`. `SECURITY.md` draws that line already: functional names may leave the
cache and displayed sentences may not.

**Names are not frozen yet.** `docs/statuses-standing.md` needs none of them, and **C9** says
nothing exists before it is needed. The cooldown row that will need them is where they arrive.

**The page is walked, not matched.** **ADR 0006** stands: `libs/html-text.ts` reads a cell as the
words a person would have seen in it, and the table is walked by its own tags. That module is an
extraction rather than a new thing — `tools/help-article.ts` had it, and this is its second consumer
(**C9**).

**A page that is no longer this shape is refused rather than read off by one.** The reader takes a
row of exactly eight cells and takes the id and the effects at fixed offsets, so a column added or
dropped fails loudly instead of quietly reading the description where the effects were.

## Consequences

Easy: a duration claim now has a source with a date on it, and
`tests/repository/skill-durations.test.ts` re-earns on every gate that every announced skill is one
this table names.

Hard: a third network source is a third thing that can go behind the game, and the gate cannot see
it — the same limit the other two carry, and `deno task game:readings status` is the same answer.

Also: the table is 226 skills and the frozen module is long. It is a reading, so it is written one
effect to a line — the shape `deno fmt` leaves alone whatever a skill states, because a generated
file that the formatter rewrites fails the gate on the run after it is generated.

## Alternatives

**Reading the durations out of the client bundle.** They are not in it; the bundle carries the keys
a message can hold, not what a skill does.

**Reading `payload.skills`.** The `init` payload states the reader's **own** skills with their `@N`,
and nobody else's. It answers for one combatant out of a fight.

**Keeping the whole page in `.cache/` and reading it at need.** The cache is outside git by
copyright requirement, so a guard could not stand on it and a claim would have no dated evidence in
the tree.

**Freezing the names too, now.** They are needed by the cooldown row and by nothing that exists —
**C9**. Freezing 226 of the game's own labels before anything reads them is carrying somebody else's
content for no consumer.
