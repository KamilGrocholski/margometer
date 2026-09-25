# 0007. The protocol-key register is carried, and a help freeze counts what it cites

- **Status:** Accepted
- **Date:** 2026-09-25

## Context

ADR 0005 did not carry `docs/protocol-keys.md`. Its guard held the register to `develop`'s constant
names, which this rewrite changed, and a help freeze could take its phrases from the frozen table
instead of from the register's claims.

The maintainer decided on 2026-09-25 to bring the register back, with its guard rewritten against
this tree's names rather than deleted. The register is where a verdict about a key is cited
(**V1**), and comments across the tree went on citing it as `develop:docs/protocol-keys.md`.

## Decision

**The register, `deno task game:shape` and the guard come over from `develop` @ `fa1dcce`.**

- `docs/protocol-keys.md` keeps every entry and every measurement. What it says about this tree now
  names this tree's files and constants:
  - what a key means is `src/core/protocol-key.ts`, and its proc table is `PROC_END_BY_KEY`;
  - a turn is counted in `src/core/turn-clock.ts`;
  - a recording is replayed per file in `tests/game/recorded-session.test.ts`.
- A file this tree does not carry is cited as `develop:`, and a decision record of `develop`'s as
  `develop ADR`.
- `tools/protocol-key-shape.ts` measures through the add-on's own chain
  (`tools/recorded-material.ts`), and asks `getKeyReading` what each key is, where `develop`'s tool
  imported the decoder's lists. `tools/help-claim-register.ts` reads the `_Help:_` lines.
- `tests/repository/protocol-keys.test.ts` holds the register to `src/core/protocol-key.ts`: the
  families `getKeyReading` answers, `SELF_SOURCED_HEALING_KEYS` and `WOUND_TICK_KEY`, in place of
  the decoder's constants `develop`'s guard imported.
  - The five lists `develop` held the register to are private here. The guard reads every key
    `src/core/protocol-key.ts` spells and `getKeyReading` answers by name, which covers the procs
    and the health changes as well.
  - A constant the register names has to be **declared** in the tree, not only spelled. The comment
    in `src/ui/panel-words.ts` naming `BLOW_END_BY_PROC_KEY` is why: spelled, a renamed constant
    still passed.

**A help freeze counts the phrases the register cites, and any named besides.** It no longer counts
what the table already holds. The guard holds the table and the register to one set, and a table
that could only grow would leave no way to drop a phrase once a claim stops citing it. Run over the
cache of 2026-09-23, the freeze writes `frozen/help-phrases.ts` byte for byte as it stands: 119
phrases.

## Consequences

- `game:shape` over `captures/` on 2026-09-25 prints the same text as `develop`'s: 119 keys, none
  disagreeing with the register.
- Citations outside `src/` drop the `develop:` prefix. The ones in `src/` comments keep it until a
  change under `src/` takes them.
- Two other registers the entries point at (`develop:docs/auras-standing.md`,
  `develop:docs/turns-taken.md`) and two of `develop`'s tests
  (`develop:tests/tools/fabricated-fight.test.ts`, `develop:tests/tools/unannounced-damage.test.ts`)
  are cited at `develop` until they are carried.

## Rejected

**Exporting the decoder's lists from `src/core/protocol-key.ts` for the guard.** It would widen a
module's surface for a test, when the source already spells every key it lists.

**Keeping the freeze's list as the table's own.** The guard's two sets would then be equal only
until the first claim was removed.
