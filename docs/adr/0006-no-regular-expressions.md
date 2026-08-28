# 0006. No regular expressions

- **Status:** Accepted
- **Date:** 2026-08-28

## Context

This is v1's decision, carried into v2 rather than re-derived. It is recorded here because it was
made **against its own measurement** and no safety rule implies it, so without a record it reads as
taste.

v1 measured the two readings before choosing. Every side segment of every recording as it stood
2026-08-27, read twice — once through a pattern, once through a hand-written scan of the same
grammar — with both answers compared segment by segment before either was timed. Median of nine runs
on Bun's JavaScriptCore, 2026-08-27:

| Reading             | Median | Best   |
| ------------------- | ------ | ------ |
| `SIDE_PATTERN.exec` | 3.2 ms | 3.0 ms |
| hand-written scan   | 5.0 ms | 4.9 ms |

**The pattern won.** It was half again as fast, several times shorter, and stated in one line what
the scan scattered across a run of separate refusals. The spec's own verdict was that the patterns
stay. The maintainer overruled it.

Two arguments carried the overruling, and only the first is about safety.

**A pattern's syntax is checked against `target` and against nothing else.** The compiler validates
it at the ES level the config names, which misses constructs above the browser floor. A pattern an
engine cannot parse is an **early SyntaxError**: the bundle never loads, so the reader sees no
panel, no degraded panel, and no console line of ours. Every other floor violation degrades; this
one is silent and total.

**A pattern restates, more densely, a grammar the file already documents.** That is where the two
come to disagree, and the disagreement is invisible until a message is read wrong.

The measurement's own scope limits it: Bun runs JavaScriptCore, so 3.2 against 5.0 speaks for one of
the three engines in `docs/browser-support.md` and for neither of the others.

## Decision

No regular expressions. Text is read by walking it. A character class or shape that runs more than
once gets a named reader; a search for structure is a reader beside the guard that needs it.

One exception, and it is somebody else's API: a bundler plugin's `onResolve({ filter })` takes
nothing but a `RegExp`. Ask before a second.

## Consequences

- Roughly one millisecond on the decode of a whole fight, on one engine, which no reader can
  perceive. That is the price and it is known rather than assumed.
- More code, and more of it in named readers rather than in one line at the call site.
- The browser floor becomes checkable, because every construct that could breach it is one the
  compiler or a guard can see.
- **The guard has to find patterns to prove they are absent.** A reader that stopped recognising
  them would pass every file while checking nothing, so the guard carries a positive control over
  the one permitted exception.

## Alternatives

**Keep patterns and check them separately against the floor.** The honest alternative, and it
matches the measurement. Rejected because a pattern's ES level is not something the toolchain
checks, so the separate check would be bespoke, and the failure it guards against is the one failure
with no visible symptom at all.

**Keep patterns everywhere except the hot path.** Rejected: the hot path is where the measurement
favoured them, so this reverses the trade in the one place it was actually paid for.
