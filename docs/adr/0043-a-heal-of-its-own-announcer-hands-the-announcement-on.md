# 0043. A heal of its own announcer hands the announcement on

- **Status:** Accepted
- **Date:** 2026-10-05

## Context

`captures/2026-10-04-tempest-grupa-vs-umibozu-DHSqC3Uh-0.22.0.json` carries a monster announcing a
skill, then its own `npc_heal`, then its blow. The decoder glued the announcement to the heal and
ended it there, so the blow stood under no announcement and opened a turn of its own: two turns
counted where the game numbers one (ordinals 52 → 54 and 219 → 225, counted 3 of 2 and 7 of 6).

The same shape stands in `develop`'s three Mamlambo recordings, where `develop` @ `fa1dcce` reads it
as this tree did.

## Decision

Decided with the maintainer on 2026-10-05, in `aabae12`.

**A glued message that does nothing but heal its announcer hands the announcement's reach on
unspent**, so the blow after it rides the announcement and opens no turn, by the rule that already
stood.

Rejected: suppressing the turn in `src/core/turn-clock.ts`, a heal riding an announcement keeping
its announcer mid-strike. It counted the same turns and broke the measured claim in
`tests/core/granted-blow-rule.test.ts` that every blow standing under no announcement opened a turn
of its own: 13 blows would have stayed under the plain blow inside a skill's turn.

## Consequences

**The figures depart from `develop`'s on purpose** (`docs/design.md` §12), on the three Mamlambo
recordings `develop` read and nowhere else: the monster's blows behind no announcement go 11 → 8, 19
→ 15 and 9 → 6, and its turns fall by 3, 4 and 3. Read by `deno task fight:develop` on 2026-10-07,
every other difference is ADR 0012's.
