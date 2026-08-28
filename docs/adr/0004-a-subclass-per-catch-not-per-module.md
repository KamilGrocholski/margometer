# 0004. An error subclass exists per `catch`, not per module

- **Status:** Accepted
- **Date:** 2026-08-28

## Context

v1's rule read: both bases are abstract, so **every kind of failure gets a named subclass and a
`code`, so callers never match on message text**. It was written to make failures distinguishable.

Measured over `develop` at `171b0e2`, it produced:

|                        | Classes | Constructed | **Caught by type**                     |
| ---------------------- | ------- | ----------- | -------------------------------------- |
| Bases                  | 2       | —           | 2, in tests only, proving disjointness |
| Subclasses in `src/`   | 2       | 6×          | **2**                                  |
| Subclasses in `tools/` | 13      | 68×         | **1** (`BundleError`)                  |
| Primitives in `libs/`  | 0       | —           | —                                      |

Three subclasses out of sixteen were ever caught by type. Six of the thirteen tool classes were
declared for a single throw site. `ui/` raised no error at all across 7,432 lines.

And `.code` is **never read**: there is not one `\.code ===` anywhere in the repository. The field
the rule justified with "so callers never match on message text" has no caller matching on anything.
It exists to compose `name`.

So the rule did not make failures distinguishable. It made thirteen classes nobody distinguishes — a
naming convention wearing a type system.

What did earn its keep is the **brand in `name`**. The add-on shares a console with the game and
with other add-ons, and `MargoMeter/ProtocolMessageFormat` in a bug report says whose failure it is.

## Decision

Two bases, split by **which side of the process throws** — browser or terminal — and not by layer.
Both are **concrete** and take a `code`.

**A named subclass exists only where a `catch` names it.** Everywhere else the base is thrown with a
code:

```ts
throw new MargoMeterToolError("DrillReport", reason);
```

The `code` union stays, for what it actually does: it makes a brand unique, greppable, and
impossible to reuse silently, checked by the compiler. Nothing branches on it at run time, and a
caller that needs to tell two failures apart is precisely the caller that earns a subclass.

`ui/` throws nothing. A panel failure is state.

**There is no assertion module of our own.** `@std/assert` is used directly. Its `AssertionError`
carries no brand, and does not need one: ADR 0002's boundary is what writes the single branded
console line, so no reader ever sees the raw name.

## Consequences

- Projected onto v1's actual usage: 2 bases and 3 subclasses, against 17 classes.
- A new failure costs one union member and one `throw`, so there is no incentive to reach for a
  generic message instead.
- **The subclass rule is now checkable**: a subclass with no `instanceof` naming it is dead, and a
  guard can find that. The old rule was unfalsifiable — every subclass satisfied it by existing.
- An assertion failing inside `tools/` reaches a terminal as a plain `AssertionError`. Accepted: the
  person reading it ran the tool.
- Adding a subclass later, when a catch appears, is a local change. This is the cheap direction;
  removing an established class is not.

## Alternatives

**Keep abstract bases and per-module subclasses.** Consistent and predictable, and it is what v1 did
for four releases. Rejected on its own numbers.

**One base, no split between browser and terminal.** Would remove the last structural class.
Rejected: in a test process both hierarchies exist at once, and the disjointness is what stops a
broad `instanceof MargoMeterError` from swallowing a tool failure. It is two classes, not seventeen.

**Keep a thin `assert` of our own for the brand.** Considered. Rejected because its only job is
supplied by the boundary in ADR 0002, and a module whose reason lives in another module's behaviour
is the kind that outlives its reason.
