# 0016. The ceiling became the target, so description moves to the docblock

- **Status:** Accepted
- **Date:** 2026-08-29

## Context

**ADR 0005** replaced "comments say WHY, never WHAT" with four rules: C2 gives comment a shape — a
measurement, a constraint somebody else's system imposes, a rejected alternative, or a trap — C3
keeps it in the present tense, C4 bounds a file docblock at eight lines, and C5 bounds a file at 25%
comment. It named the failure it was written against: **a genre.** Docblocks narrating a module's
own history, "genuinely informative, individually defensible, and half the source."

The genre came back in a new shape. Measured on `rewrite/v2` at `21bca46`:

| Directory                 | Lines | Comment | Share     |
| ------------------------- | ----- | ------- | --------- |
| `tests/`                  | 9,263 | 803     | 8.7%      |
| `src/core/`               | 2,269 | 415     | 18.3%     |
| `tools/`                  | 857   | 161     | 18.8%     |
| `src/game/`               | 1,453 | 319     | 22.0%     |
| `src/ui/`                 | 5,371 | 1,252   | **23.3%** |
| `src/userscript-entry.ts` | 1,032 | 259     | **25.1%** |

Nine files stood in the band 25.0–26.0%, and `src/ui/panel-screen.ts` at 26.0% was over C5: it
passed only because the guard floors the share before comparing.

**This is not the padding ADR 0005 anticipated.** No code was added to make room. Comment was
written up to the limit, because C2's four categories stretch: a rejected alternative describes any
layout choice at all once it is written with enough conviction, and every panel decision has one.

The shape was specific and countable: **a docblock over nearly every declaration, describing it.**
Over `composeSideTabs`, a sentence saying it draws the lower strip. Over a field typed
`number | null`, a sentence saying it is null where the game said nothing. The name and the type
already said it, and the sentence could go wrong where they could not. One had: `panel-screen.ts`
documented `OPPONENT_WORDS` as answering null where a screen states no other end at all, and its
type is `Record<PanelMetric, string>`. There is no null and never was.

The second half is worse, and the count could not show it. **The rationale already had an owner.**
`DESIGN.md` carried it, in different words — which `AGENTS.md` calls worse than a verbatim copy,
"because the two drift without ever looking different." Both halves of that prediction had already
happened:

- `src/ui/panel-look.ts` said the bar "says **what** somebody is and the name beside it says
  **who**". `DESIGN.md` says "**A hue says who somebody is.**" One panel, two claims about what its
  colour carries.
- Three comments called the tab strips **upper, middle and lower**. `DESIGN.md` says two rows, with
  the direction and the sides sharing the lower. The source described a panel with three strip rows;
  the panel has two.
- `src/ui/panel-element.ts` carried one two-line comment twice, verbatim, over two near-identical
  blocks.

Fourteen further pairs were confirmed by reading both sides — the one-line title bar and `0.10.1`,
the reserved scrollbar gutter, the pinned row's dashed rule and hatched bar, the plain-attack row's
own example string `Zwykły cios 2 644 (100% · ×8)` — each stated in `DESIGN.md` and again in the
source that implements it.

## Decision

C2, C3 and C4 stand as **ADR 0005** wrote them. C5 stands at 25%: a small file carrying one earned
docblock reads high and is not the failure — `src/core/game-build.ts` is 62 lines and a quarter of
it is the client's two bundle-filename shapes with the date each was read. Three rules join them.

- **C14 — self-documenting code first.** A name, a type and an assertion say what a sentence would
  and cannot go stale. **Plain description belongs in the file's docblock and nowhere else:** what
  the file is for and what is in it. Below that line a comment earns its place by C2 or it is
  deleted, however well written.
- **C15** — a comment never restates what a canonical document owns; it cites it. And never twice in
  this tree: a block standing in two places is one rule with two copies.
- **C16** — comment share of a directory under `src/` or `tools/` stays under 22%.

**C14 is the substance and C16 is the fence.** The failure was not that any one comment was wrong;
it was that a description over every declaration is a second copy of the code, written in a language
no compiler reads. Deleting the genre outright is what a rule can hold, and what the file docblock
keeps is the thing a reader arriving at a file actually needs: what it is for, and what is in it.

**C16 changes the unit, and that is the other half.** A per-file ceiling cannot see a directory
walking to it: every file in `src/ui/` was inside a point of C5 and every one of them passed. The
directory share was already red — 23.3% — while every guard stayed green. The bound is 22 rather
than 23 because the guard floors before comparing, as C5's does; at 23 the `src/ui/` figure this ADR
was written about floors to 23 and passes.

Measured after the cut this ADR records, by directory: `src/` root 18.9%, `src/core/` 17.6%,
`src/game/` 20.4%, `src/ui/` 12.7%, `tools/` 17.6% — two points of headroom on the worst.

## Consequences

- **`tests/repository/sources.test.ts` holds C16 and half of C15.** Both were proved on a sample
  they must flag and a sample they must not, and both against the tree: 90 padding lines in `tools/`
  lit C16 at 26%, and one existing block pasted a second time lit C15.
- **The reworded restatement is unheld, and it is the worse kind.** The guard compares block text,
  so `panel-look.ts` and `DESIGN.md` disagreeing about what a hue says would not have been caught by
  it — that was caught by reading both. Two mutations written for the guard were rewordings and it
  stayed green, correctly. `ARCHITECTURE.md` carries this under its known gaps.
- **C14 is unheld and is the rule most likely to erode**, because every individual instance of it
  looks helpful. It is what the reviewer reads for.
- **`src/` fell from 22.2% to 15.8%** — 772 comment lines, with no test changed and no expectation
  moved. `src/ui/` fell from 23.3% to 12.7%.
- **A citation costs a reader a jump**, and a deleted description costs them a name they must trust.
  This is the real price, and it is the same one ADR 0005 paid for moving the history genre to ADRs:
  a sentence beside the line it concerns is read by whoever edits that line, and `DESIGN.md` is not.
  What it buys is one copy that cannot drift, and a name that has to be good enough to stand alone.
- **C4 is still unheld and was broken in seven files**, brought to eight lines here. Nothing stops
  the ninth line arriving again.

## Alternatives

**Lower C5 and add nothing.** Rejected on the measurement: the worst file after this cut is
`src/core/game-build.ts` at 25.8%, and every line of its comment is a build-id citation with a date.
Lowering the per-file ceiling deletes citations and leaves the directory free to creep, which is
what actually happened.

**A separate, tighter ceiling for `src/ui/`.** Rejected: two thresholds are two rules that drift,
and the rot was not a fact about `ui/`. `src/userscript-entry.ts` reached 25.1% on its own.

**Cut the comment and change no rule.** Rejected. The cut is a state, not a rule, and ADR 0005 had
already been enforced by an author who cared, for four releases, before it produced 53%.

**Count declarations carrying a docblock rather than lines.** Closer to the genre C14 names, and it
is the number that would hold C14 directly. Rejected for now as unmeasurable without a parser this
tree does not have, where the line share is what `sources.test.ts` already counts. It is the shape
the C14 guard should take when one is written.

**Delete the file docblocks too.** Rejected outright, and it is the one place description is kept on
purpose: a reader arriving at a file needs to know what it is for before any name in it means
anything, and no name can carry that.
