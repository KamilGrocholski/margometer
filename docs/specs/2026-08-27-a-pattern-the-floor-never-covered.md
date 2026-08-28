# A pattern the floor never covered

Status: draft

`TODO.md` asked whether the regular expressions could leave this repository.
Four things were behind the question: that a pattern is a second, denser
statement of a grammar the file already documents in prose; that §9.5 gives a
construct an owner in `libs/` when it has more than one spelling or can answer
with a value nobody wrote; that §7.5 already says *extract structure with
structure, not with a search*; and that two of them run once per protocol
message.

Three of the four were measured and came back the other way round. The fourth
turned out to be a real hole, and it is not the one the question was about: the
one axis of `docs/browser-support.md` that nothing holds is regular-expression
**syntax**, and the constructs a compiler misses are the constructs that would
move the floor.

So the patterns stay. What changes is that somebody starts holding them.

## What is actually here

Read at this commit with `getRegularExpressionRangesFromSource` from
`libs/source-regions.ts` — the reader this repository already owns, over the
tracked TypeScript with its comments and its text literals blanked, so a path
inside a string cannot look like a pattern. Counting them here would be a number
a machine can compute (§5); what follows is the classification, which it cannot.

Five kinds, and only one of them is a candidate for removal.

### A pattern that states a shape

Anchored at both ends, total over its input, and its only output is a boolean or
groups the pattern itself proved: `libs/number.ts`, `libs/timestamp.ts`,
`src/core/protocol-message.ts`, `src/core/fight-decoder.ts`,
`src/core/game-build.ts`, `src/ui/panel-look.ts`.

This is §9.5's *shape inward, magnitude outward*, working exactly as written.
Every one of these sites already splits the two: the pattern settles that the
text is digits and a two-place fraction, and a reader in `libs/` settles that
the digits fit in a number. The comment under `SIDE_PATTERN.exec` in
`src/core/protocol-message.ts` argues it in as many words, and
`src/ui/panel-look.ts` hands its three captured groups straight to
`getIntegerFromHexadecimalText` rather than to `parseInt`.

### A pattern standing in for a plain string operation

`src/game/game-dictionary.ts` strips a leading sign and a trailing full stop;
`tools/fight-report.ts` drops a `.json` tail; a run of tests in `tests/ui/`
strips spaces and brackets out of a figure the panel drew before reading it back.

`startsWith`, `endsWith`, `slice` and `split(…).join(…)` say all of that at a
glance and cannot be misread. This is the only kind where removal is an
improvement, and it is an improvement in reading rather than in anything a
machine can see.

### A pattern that searches for structure

`libs/source-regions.ts` over TypeScript, `tools/protocol-key-table.ts` over a
minified bundle, `tools/help-article.ts` over fetched HTML, and the Markdown
guards under `tests/tools/`.

§7.5's rule bites hardest here and the answer is still no, for a reason that is
about what exists rather than about what is nice: the alternative to a pattern
over a grammar is a parser, and every parser available is a dependency (§4) or
does not exist at all — a minified bundle has no grammar left to parse. What
that rule can ask for is already done. `tools/protocol-key-table.ts` matches the
*shape* of the client's switch rather than a minified name, and says why: a
minifier renames every local on every build, so a literal name is a dated fuse.

What matters more than the choice is the failure mode, and both of the ones that
run unattended are safe in the same direction. The key table throws
`the switch has no case labels` rather than quietly shortening itself, and
`libs/source-regions.ts` hides a span rather than inventing one. A search that
cannot find its subject stops; it does not answer with less.

### A pattern that is somebody else's API

`build.ts` passes one to `builder.onResolve({ filter: … })`. Bun's plugin
interface takes a `RegExp` and takes nothing else, so this one cannot be removed
by any argument at all. It is listed because a census that quietly omitted it
would be a census nobody could re-run.

### A pattern that proves a rule about patterns

`libs/source-regions.ts` reads where a `/` opens a pattern rather than divides,
and `tests/tools/source-layout.test.ts` runs most of the guards in this
repository as text searches over source. Removing patterns from here would mean
removing the guards, which is the opposite of what the question was asking for.

## Cost — measured, and the pattern wins

The concern was `SIDE_PATTERN` and `NAMED_WITH_PERCENT`, which run once per
protocol message.

`bun run cost`, over every capture as of 2026-08-27: on every fight carrying
real traffic, `reading` dominates a payload and `session` — the phase that holds
the whole decode, both patterns included — is the smallest of the three phases a
payload is made of. On the two shortest recordings the ordering flips, and there
every phase is a fraction of a millisecond.

Then the pattern itself, against the alternative. Every side segment of every
capture as of 2026-08-27, read twice: once through `SIDE_PATTERN`, once through
a hand-written scan of the same grammar — sign, digits, optionally `=`, digits,
a point, two digits — with both answers compared segment by segment before
either was timed. Median of nine runs on Bun's JavaScriptCore, 2026-08-27:

| Reading | Median | Best |
|---|---|---|
| `SIDE_PATTERN.exec` | 3.2 ms | 3.0 ms |
| a hand-written scan | 5.0 ms | 4.9 ms |

The scan is about half again as slow, on the engine the measurement was taken
on. It is also several times longer, and scatters across a run of separate
refusals what the pattern states in a single line.

⚠️ **The engine is Safari's, not Chrome's.** Bun runs JavaScriptCore, so this
figure speaks for one of the three engines in `docs/browser-support.md` and for
neither of the others. It is enough to retire the concern — nobody was going to
rewrite a decoder to make it slower on at least one engine — and not enough to
be quoted as a general fact about patterns.

## One way to read a value — the pattern is already the one way

§9.5 owns a construct in `libs/` when it has more than one spelling or can
answer with a value nobody wrote. `RegExp` looks like both from a distance:
`exec` answers `null`, a group answers `undefined`, and a `/g` pattern carries
`lastIndex` between calls.

None of the three survives contact with the tree. Every `exec` result here is
null-checked or `assertDefined`-ed before it is indexed, and that was checked
and still holds. No `/g` pattern is used with `.test` anywhere, which
is the one spelling where `lastIndex` turns a predicate into a coin toss. And
the groups are already handed to `libs/number.ts` rather than read as numbers.

An owner would therefore be a wrapper with no decision inside it, which is the
one thing §7.1 refuses: it would exist before it was needed, and it would make
every call site longer in exchange for nothing.

## The floor — the concern that turned out to be real

`docs/browser-support.md` states three halves and says which holds each: the
JavaScript half is held by `tsconfig.userscript.json`, the CSS and DOM halves by
`tests/tools/browser-support.test.ts`. Its JavaScript section says that reaching
past the floor "fails the gate by name".

That is true of library members and **false of pattern syntax**, because the
config narrows `lib` and leaves `target` inherited as `ESNext`, and TypeScript
checks a regular expression's syntax against `target`.

Measured at this commit, by putting a pattern into `src/game/game-dictionary.ts`
and running `tsc --noEmit -p tsconfig.userscript.json`, restoring the file from a
copy afterwards:

- as the config stands, `/[\p{ASCII}--[a-z]]/v` typechecks clean;
- with `"target": "ES2022"` added beside the `lib`, the same pattern is
  `error TS1501: This regular expression flag is only available when targeting
  'es2024' or later`.

So narrowing `target` is worth doing. It is also **not sufficient**, which the
same probe shows: dropped to `target: "ES2017"`, the compiler refuses
`/(?<name>x)/` with `error TS1503` and accepts both `/(?<=x)y/` and `/\p{L}/u`
without a word.

Put that against the versions, and the coverage lands the wrong way round.
Read from MDN `browser-compat-data` on 2026-08-27, first release with support in
each engine, against a floor of Chrome 93 / Firefox 91 / Safari 16:

| Construct | Chrome / Edge | Firefox | Safari | Above the floor | Compiler catches it |
|---|---|---|---|---|---|
| named capturing group | 64 | 78 | 11.1 | no | **yes** |
| `\p{…}` escape | 64 | 78 | 11.1 | no | no |
| lookbehind | 62 | 78 | **16.4** | **yes** | **no** |
| `v` flag | 112 | 116 | **17** | **yes** | **yes** |
| `(?i:…)` modifier | 125 | 132 | **26** | **yes** | **no** |

Of the constructs above the floor the compiler catches the `v` flag and misses
both of the others. The one it misses most cheaply is lookbehind: a handful of
characters of syntax, which Chrome and Firefox have had since before the floor
and which moves Safari from 16 to 16.4 — a gap small enough that nobody would
think to check.
A tool may spell them harmlessly, because tools run in Bun on this machine and
never ship.

⚠️ **A pattern above the floor does not degrade — it stops the add-on
loading.** §9.9 says a feature above the floor degrades and that what it looks
like below is part of its register entry. That is a promise about CSS and about
the DOM. A regular-expression literal whose syntax the engine does not know is an
*early* SyntaxError: the bundle fails to parse, so nothing runs, and the reader
sees no panel and no console line of ours. `new RegExp` differs only in when —
`src/core/game-build.ts` builds two at module scope, so they throw while the
add-on is starting rather than while it is being read. Either way there is no
degraded state to describe, which is why the answer below is `[ASK]` rather than
a note.

## What this asks of later rounds

In the order they close.

1. **Narrow `target` in `tsconfig.userscript.json` to match its `lib`**, with
   the measurement above written beside it — the same shape the `lib` line
   already carries, because a narrowing that proves nothing is worse than none
   (§6.1's lockfile trap, one line up in the same file).
2. **Give `docs/browser-support.md` a patterns entry**, in the JavaScript
   section, stating the two constructs above the floor that the compiler misses
   and stating the consequence: not a degradation, a script that does not load.
   Correct that section's "fails the gate by name" in the same commit — it is
   prose that has drifted from the tree, and §7.5 says the rule moves rather than
   being qualified where only one reader sees it.
3. **Guard what the compiler misses**, in `tests/tools/browser-support.test.ts`
   beside the CSS and DOM halves, over `getRegularExpressionRangesFromSource`
   across `src/` and `libs/`. The reader exists and is proved by
   `tests/libs/source-regions.test.ts`, so this is a list of refused constructs
   and a walk, and nothing else. It is third rather than first because the
   compiler is the cheaper half and this only has to cover the remainder.
4. **Replace the second kind**, site by site, in `src/game/game-dictionary.ts`,
   `tools/fight-report.ts` and the strips under `tests/ui/`.
5. **A rule in `AGENTS.md` §9.3** stating the split this spec makes — a pattern
   states a shape, and where it searches for structure it says so and refuses
   rather than answering short — and `[ASK]` before a pattern above the floor,
   which is the half no machine holds even after step 3.

## Rejected alternatives

**Remove every pattern.** Rejected on the measurement: the hand-written
alternative to the one pattern in the hot path is half again as slow on
JavaScriptCore, several times longer, and scatters its refusals where the
pattern states them in one line. Rejected on the shape as well — the first kind
is not a search standing in for a parser, it is a grammar written once, and
rewriting it as a
scanner would be a second statement of the same rules with its own edges, which
is what §9.3 exists to stop.

**Give `RegExp` an owner in `libs/`, the way `libs/number.ts` owns `Number()`.**
Rejected because the criterion is not met: nothing here reads a pattern's answer
as a value nobody wrote. The wrapper would carry no decision, and §7.1 refuses a
module that exists before it is needed.

**A TypeScript parser for the third kind.** Rejected: it is a dependency (§4),
and it answers none of the three hardest cases — a minified bundle, fetched HTML
and Markdown have no TypeScript grammar between them.

**Ban patterns in `src/` and `libs/` and allow them in `tools/` and `tests/`.**
This is the tidy-looking version of the answer and it is exactly backwards. The
shipped patterns are the ones that state a shape and are held by the tests; the
tooling patterns are the ones that search for structure and answer over somebody
else's output. The line that matters runs between the kinds, not between the
directories.

**Leave the floor unheld.** Rejected even though nothing is broken today: every
shipped pattern is syntax that predates the floor by a decade, but the reason
for that is that nobody has yet had a use for a lookbehind. That is not a guard,
it is a run of luck, and `build.ts` bundles with `minify: false` and no `target`
precisely so that this class of mistake has nowhere to hide — except, until now,
here.
