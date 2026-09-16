# 0093. A lookup table is named for the lookup it takes

- **Status:** Accepted
- **Date:** 2026-09-16

## Context

**N17** already says how a map is named — _"A map is named for the lookup it takes:
`damageByElement`"_ — and the tree kept that for `camelCase` while the shouted constants went their
own way. Three shapes grew side by side: a plural noun (`PROC_ENDS`), a `_KEYS` suffix
(`HEALTH_CHANGE_KEYS`), and the rule itself (`REACH_BY_KEY` in `src/core/aura-standing.ts`,
`BLOWS_GRANTED_BY_SKILL_ID` in `src/userscript-entry.ts`).

**Two of those names were not merely terse, they were false.** `HEALTH_CHANGE_KEYS` and
`OUTCOME_KEYS` are `Record`s wearing the suffix this tree uses for arrays of keys, and
`PROFESSION_HUES` holds indices into `PALETTE_COLOURS` — `0` to `5` — rather than hues. A reader who
trusts either name reads the wrong thing and gets no warning, because nothing here reads a
constant's name: `tests/repository/names.test.ts` never passes `const` to `getExportedName`, so
every shouted name in the tree is held by reading alone.

**`PROC_ENDS` carried a second job its name did not mention.** `getProcEnd` answers `null` for a key
the table does not hold, the caller files that key under `unreadKeys`, and the panel states a defect
against it. So the table decides membership as well as placement, and a proc `docs/protocol-keys.md`
calls decoded but the table does not hold reaches a player as a message nobody could read. The
`+stun2` variants are where that was found.

## Decision

**A module constant that is a map keyed by a key this repository did not choose is named
`VALUE_BY_KEY`.** Twelve were renamed:

| Was                            | Is                            |
| ------------------------------ | ----------------------------- |
| `PROC_ENDS`                    | `BLOW_END_BY_PROC_KEY`        |
| `HEALTH_CHANGE_KEYS`           | `HEALTH_CHANGE_BY_KEY`        |
| `OUTCOME_KEYS`                 | `OUTCOME_BY_KEY`              |
| `DEFENCE_WORDS`                | `DEFENCE_WORD_BY_KEY`         |
| `PROC_WORDS`                   | `PROC_WORD_BY_KEY`            |
| `CLIENT_IDS_FOR_UNWORDED_KEYS` | `CLIENT_ID_BY_UNWORDED_KEY`   |
| `DESTROYED_WORDS`              | `DESTROYED_WORD_BY_KEY`       |
| `PROFESSION_WORDS`             | `PROFESSION_WORD_BY_KEY`      |
| `ELEMENT_WORDS`                | `ELEMENT_WORD_BY_KEY`         |
| `HEALTH_SOURCE_WORDS`          | `HEALTH_SOURCE_WORD_BY_KEY`   |
| `HEALTH_LOSS_WORDS`            | `HEALTH_LOSS_WORD_BY_KEY`     |
| `PROFESSION_HUES`              | `PALETTE_INDEX_BY_PROFESSION` |

`REACH_BY_KEY` already stood in this shape and is unchanged.

**Three kinds of constant are deliberately left alone**, and each for a reason of its own. A map
keyed by a **type this repository declares** — `Record<PanelMetric, string>` and some twenty others
— keeps its plural, because the compiler refuses an incomplete one and the signature already says
what the key is. A **list of keys** keeps `_KEYS`, because there it is true; the renaming is what
makes that suffix mean one thing. A map whose **key is ours and whose value is the game's** —
`WARRIOR_FIELDS`, `CHARGE_FIELDS`, `CAPTURE_FIELDS` — keeps its name, because `VALUE_BY_KEY` would
read in the wrong direction.

**`BLOW_END_BY_PROC_KEY` states its second job in its docblock**, not in its name. A name carrying
both would say neither well.

## Consequences

**Nothing mechanical holds this.** No guard reads a shouted constant's name, so this decision is
held by review, like **N7**, **N9**, **N12** and **N17** itself. What the rename does buy is that
the three false names are gone and `_KEYS` now means a list.

**Five names are stale in five accepted decisions** — 0073 and 0077 name `ELEMENT_WORDS` and
`DEFENCE_WORDS` in their Decisions, 0080 names `HEALTH_LOSS_WORDS`, 0085 names `PROC_ENDS`, 0088
names `PROC_WORDS` and `DEFENCE_WORDS`. They are **not edited**: an accepted record is what was
decided when it was decided. The table above is where a reader of those records finds the current
spelling, which is the whole reason it is in this one.

**One guard had to be edited by hand.** `tests/ui/panel-words.test.ts` keys `HOLDS_NO_WORD` by
declaration name as a **string literal** and reads it against the text of `src/ui/panel-words.ts`,
both ways round — so it is the one place a rename passes `deno check` and still fails the suite.

**`deno fmt` does not wrap a comment**, so five docblock lines carrying a renamed constant ran past
a hundred columns and were refilled by hand.

## Alternatives

**Leave the names and document them.** Rejected: a docblock explaining what `PROC_ENDS` maps is a
sentence that goes stale, where the name cannot. **C14** says a name is the first answer to "this
needs explaining".

**Rename every map, the compiler-checked ones included.** Rejected: it doubles the diff to reach
names where the failure is already loud — an incomplete `Record<PanelMetric, …>` does not compile.
It also produces names that stutter, such as `NOUN_WORD_BY_NOUN`.

**A longer, sentence-shaped name**, such as `WHICH_END_OF_BLOW_EACH_PROC_BELONGS_TO`. Rejected: it
reads well in the declaration and badly at every use, and at the width this tree wraps to it pushes
the line it sits on past a hundred columns.

**Write no record and put the reasoning in the commit.** Rejected because of the five accepted
decisions above: a reader arriving at 0073 needs somewhere to find the current spelling, and a
commit message is not somewhere anybody arrives.
