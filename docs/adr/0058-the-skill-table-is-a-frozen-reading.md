# 0058. The skill table is a frozen reading, and the descriptions stay out

- **Status:** Accepted
- **Date:** 2026-09-08

## Context

The maintainer asked for a window saying **what is standing on the fight now**. The protocol cannot
answer the second half of that on its own: it announces a cast and never mentions it again. Measured
over `captures/` on 2026-09-08 — no confirmation, no refresh and no expiry anywhere, and the only
keys that end anything are the three cleanses, which occur four times in 29 recordings.

So a row once added never leaves. Measured the same day, over every recording: by the end of a fight
the corpus carries a **median of 8 and a worst of 17** caster-and-skill rows. That is a list of what
was cast, not of what stands, and calling it `Co stoi` would be the panel saying something it cannot
stand behind.

One source states a duration, and it is not the protocol. The published skill table at
`https://public-api.margonem.pl/we_get/skills/` writes an effect as `key=value@turns`, once per
skill level: `taken_dmg_per-all=6@8,…,15@8` for `Piętno bestii`, `shout=6@3` beside `alllowdmg=1@5`
for `Wyzywający okrzyk`.

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

**The bundle carries the smaller of the two.** `frozen/aura-turns.ts` holds only the skills whose
effects reach more than one combatant — thirteen of the two hundred and twenty-six the page serves —
and it is derived at freeze time by `src/core/aura-standing.ts`'s own rule, so the judgement about
which keys those are is written once and the add-on carries thirteen numbers rather than every
effect of every skill.

**The page is walked, not matched.** **ADR 0006** stands: `libs/html-text.ts` reads a cell as the
words a person would have seen in it, and the table is walked by its own tags. That module is an
extraction rather than a new thing — `tools/help-article.ts` had it, and the skill table is its
second consumer (**C9**).

**A page that is no longer this shape is refused rather than read off by one.** The reader takes a
row of exactly eight cells and takes the id and the effects at fixed offsets. Read off by one, the
description column lands where the effects were — and a duration lifted out of prose is the number
that might be wrong looking exactly like one that is right.

## Consequences

Easy: a duration claim now has a source with a date on it, and
`tests/repository/skill-durations.test.ts` re-earns on every gate that every skill the corpus casts
at a side is one this table dates.

Hard: a third network source is a third thing that can go behind the game, and the gate cannot see
it — the same limit the other two carry, and `deno task game:readings status` is the same answer.

Also: the frozen module is long, and it is written one effect to a line. A generated file the
formatter rewrites fails the gate on the run after it is generated, so the shape written is the
shape `deno fmt` leaves alone — checked on the run that wrote it.

## Alternatives

**Reading the durations out of the client bundle.** They are not in it: the bundle carries the keys
a message can hold, not what a skill does.

**Reading `payload.skills`.** The `init` payload states the reader's **own** skills with their `@N`,
and nobody else's. It answers for one combatant out of a fight.

**Shipping without a duration at all.** Honest, and it was offered: the row would say `od 3 tur` and
never leave. The maintainer chose the table over the median of eight rows that answer a question
nobody asked.

**Keeping the whole page in `.cache/` and reading it at need.** The cache is outside git by
copyright requirement, so a guard could not stand on it and a claim would have no dated evidence in
the tree.
