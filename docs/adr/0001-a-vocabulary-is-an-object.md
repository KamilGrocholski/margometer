# 0001. A vocabulary is an object, and its list is the object's values

- **Status:** Accepted
- **Date:** 2026-09-24

## Context

`AGENTS.md` N18, carried over from `develop`, wrote a closed set of our own strings as an array,
`const STORAGE_CHOICES = ["local", "session", "memory"] as const`, and derived the type from it. N19
wrote a union with a `kind` as an object, `{ payloadNotRecord: "payload-not-record" } as const`. So
the tree held two shapes for one idea, and code named a word of the first shape by its literal:
`if (reach === "casters-side")`, `state: "charging"`, `window === "panel" ? "panel-folded" : …`.

A literal typed against the union is checked by the compiler, but it is the word spelled again at
every use. On this branch, before the change, 13 vocabularies were arrays and their words stood as
literals in 12 files of `src/` and `libs/`.

## Decision

**Every vocabulary is an object `{ … } as const`.** The key is the name code uses and the value is
the word that reaches a console or a file. The type is `VocabularyWord<typeof VOCABULARY>`
(`libs/vocabulary.ts`), and where a list is wanted, for `isOneOf` or a walk, it is
`Object.values(VOCABULARY)`. Code names a word by its key, `KEY_REACH.castersSide`, and never by the
literal. The object is singular (`STORAGE_CHOICE`), and its list plural (`STORAGE_CHOICES`).

A list of somebody else's keys that code only walks, such as `WARRIOR_COLLECTIONS` in
`src/game/warrior-snapshot.ts`, is not a vocabulary and stays an array.

## Consequences

- N18 is rewritten to this shape, and N19 is the same rule for a union with a `kind`.
- The 13 arrays of this branch were rewritten in one change, with every literal use of their words.
  The comparisons against `develop` @ `fa1dcce` reran unchanged after it (decoder, envelope,
  session, heals, statistics, standings, capture and shelf: 0 differences), since the values are the
  words they were.
- A list is written only where something reads it (`AGENTS.md` C9): `STORAGE_CHOICES` for `isOneOf`,
  and `STORE_KEYS` for the memory store's bound.

## Rejected

**The array, kept, with the literals.** It is one shape fewer to learn, and the compiler rejects a
misspelt literal. It lost because the word is then spelled at each use, and a word renamed in the
vocabulary is a word renamed in every file that spells it.
