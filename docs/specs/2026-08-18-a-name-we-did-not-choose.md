# A name we did not choose is spelled once

Status: implemented

## What was wrong

From the maintainer's list: *"Use constants instead of literals for the protocol
keys (maybe everything except the ui text, not only the protocol keys)."*

The headline turns out to be already true, and the parenthesis is where the work
is. `src/core/fight-decoder.ts` names every protocol key it reads, from
`NAME_SEPARATOR` at the top of the file to the exported `UNDERSTOOD_PROTOCOL_KEYS`
at the bottom, and nothing else in `src/` spells one. What the round found instead
is a different rule, and one family it does **not** apply to.

**A name this repository did not choose, spelled in more than one place, where
nothing catches a disagreement.**

The game decided what a warrior's `prof` field is called. We decided what a CSS
class in our own shadow tree is called — but we decided it once and wrote it down
twice, in the stylesheet and in the renderer, with nothing holding the two
together. In both cases the second spelling can drift from the first and the
failure is invisible: an unstyled row, a field that reads `undefined`. Nothing
throws, nothing goes red, and the panel still draws.

## The family this does not apply to, and why

**Protocol keys are restated on purpose, and collapsing them would be the fault.**

Ten test-local declarations look like the duplication above —
`const TEAM_HEAL_KEY = "healall_per"` in `tests/core/team-heal-rule.test.ts`,
`const SKILL_NAME_KEY = "tspell"` in two more files, and so on. Two of them say
in a comment why they are there:

> Restated here rather than exported: a guard that imports the list it guards
> against agrees with the decoder by construction and checks nothing.

That argument covers all ten. Read what most of them are *for*:
`tests/core/poison-reduction-rule.test.ts` asserts
`expect(UNDERSTOOD_PROTOCOL_KEYS).toContain(REDUCTION_KEY)`, and
`tests/core/injure-rule.test.ts`, `tests/core/team-heal-rule.test.ts` and
`tests/core/absorption-destruction-rule.test.ts` each make the same assertion for
their own key. Import the constant from the decoder and every one of those becomes
`expect(list).toContain(list[i])` — true by construction, checking nothing. The
restatement *is* the test.

Nor is the copy at risk of going stale unnoticed: a typo in one of these fails
immediately, because the decoder does not read the misspelling.

This is worth writing down because the mistake has already been made once in
the other direction. An audit filed two findings against exactly these
declarations and closed them by exporting. That was right
for the two it touched — `DAMAGE_TO_NAMED_KEY` and the damage-key shape rule
are used to *select* messages, never to assert what the decoder reads — and it
would have been wrong for the ten left standing. Eight of the ten carry no
comment saying so, which is why the next reader will file it again.

**A deliberate duplication that does not say it is deliberate is an invitation to
collapse it.** The remedy is a sentence in the file, not a guard.

## The two families it does apply to

### CSS class names — two spellings, and two of them already disagree

Every class in the panel is written as a selector in `src/ui/panel-look.ts`
and as a `className` in `src/ui/panel-element.ts`, held by nothing. Measured at
`444bead`, the two agree on 46 names and disagree on two — and both disagreements
are live:

- `sides-of` is assigned in `src/ui/panel-element.ts` and matches no rule. The
  stylesheet says why in a comment: a sibling selector replaced the rule, so that
  *"sides-of did not have to become a name for something it is not"*. The rule
  went; the class stayed on the node.
- `hidden` is assigned beside `MargoMeter-tip` and matches no rule either, under a
  docblock claiming it is *"hidden by an attribute the stylesheet reads"*. It is
  not an attribute, and the stylesheet does not read it — the hiding is an inline
  `display: none` written on the next line.

Neither shows up as a failure. A class with no rule does nothing, and a panel that
draws is a panel that looks fine to a gate.

### The preview harness — the same split, colouring the failure signal

`tools/preview-page.ts` carries the harness's rules in a `<style>` block;
`tools/preview-server.ts` writes the strip's build status onto a node. Renaming
`preview-ok` or `preview-bad` on either side left the whole gate green.

What that costs is not cosmetic. `.claude/skills/verify/SKILL.md` tells whoever is
driving the preview that *"a red strip means your edit did not compile"* — so the
one signal separating a failed build from a good one was held by two files
agreeing by luck.

Found by sweeping `tools/` and `tests/` for the same class after the `src/` half
was done, and it is the reason the reader is shared rather than copied: the panel
was not the only place asking this question.

### The frozen help counts and the article they came from

`tools/help-article.ts` names the article the published help's mechanics live in,
and `tests/frozen-help-phrases.ts` is generated from whatever that names. The
frozen table records which article under `article:` — a field that exists to make
a mismatch visible, and nothing compared the two. Pointing the tool at another
article left every count in the table describing a document the tool no longer
reads, with `docs/protocol-keys.md` still re-earning its claims against them.

### The cache root, and the promise about somebody else's copyright

`tools/game-client-source.ts` and `tools/help-article.ts` each compose a path
under `.cache/`, and `.gitignore` carries one line saying that directory is not
tracked. §7.6's whole promise — that fetched client sources stay out of the
repository by copyright requirement — was those two spellings agreeing, in two
files, with nothing between them. Moving either left the gate green.

Held by asking `git check-ignore` rather than by reading `.gitignore`: git is what
decides, and a pattern matched by hand would be a second implementation of rules
this repository has no reason to own.

### The game's own field names — two readers, no owner

`src/game/engine-roster.ts` and `src/game/fight-capture.ts` both read a warrior
object off the engine, and both spell `name`, `team`, `prof`, `lvl` and `id` by
hand. `engine-roster.ts` goes further and declares an `IDENTITY_FIELDS` array
holding four strings it has already spelled individually a few lines above — one
file disagreeing with itself is the shape this rule exists to catch.

`src/game/engine-battle-wrap.ts` already does it the other way, with
`WRAPPED_METHOD`, `MESSAGES_FIELD` and `MESSAGE_COUNT_FIELD` named beside the code
that uses them. That is the precedent, not a new idea.

## The rule

**A name this repository does not own is declared once, by the file that reads it
— unless a second reader's whole job is to disagree with the first.**

The exception is not a loophole; it is the protocol-key family above, and it is
narrow: a test that asserts *what the decoder reads* must spell the key itself.
Everything else imports.

## How it is held

Two guards, and the point of each is that it reads the real artefact rather than
restating what the artefact says.

- **CSS class names.** A guard calling `composePanelStyleText()` — the stylesheet
  as it actually ships, not a grep of the file that composes it — and reading every
  class the renderer assigns, holding the two sets equal. Neither file is the
  owner; the agreement is what is guarded.
- **Warrior fields.** One module in `src/game/` names them, and a guard beside it
  refuses a field spelled outside it.
- **The preview harness's class names.** The same cross-check, over both pages the
  template draws and over the server that writes the status class. The two guards
  share one reader, which sits at the root of `tests/` with the other shared
  readers.
- **The frozen help counts.** `tests/tools/help-article.test.ts` holds the table's
  `article` to the tool's `MECHANICS_ARTICLE`.
- **The cache roots.** Each tool's own test asks git whether the path it writes
  into is ignored.

## Rejected alternatives

**Lifting the CSS class names into a constants module.** The obvious symmetry with
the warrior fields, and it was rejected on what it would do to the one readable
CSS file in the tree. `panel-look.ts` is a template literal of real
selectors — `.row.drillable > .bar`, `.tabs + .tabs`, `.tip-stat.strong` — and
interpolating forty constants into them turns every rule into a line nobody can
read as CSS. The fault is not "two spellings"; it is "two spellings that can
disagree", and a cross-check removes exactly that without paying for it in
legibility.

**Exporting the ten protocol keys and rewiring the tests.** This was the plan
until the tests were read. It would have converted four live assertions into
tautologies, which is the failure mode the layout register was itself amended for
once — a guard agreeing with the bug it exists to prevent.

**Turning the compiler-checked unions into constants.** The literal reading of the
maintainer's line — "everything except the ui text" — takes in `kind: "attack"`,
`metric: "dealt"`, `{ kind: "note" }` and the outcome words. Every one is assigned
into a position typed by a union, so the compiler already refuses a typo.
Constants buy nothing and cost narrowing: a discriminated union is the one place
a bare literal is the strongest thing you can write.

**Sharing more of the two class-name guards than the two readers.** They differ
in what counts as a consumer — the preview reads its own markup and a second
source file, the panel does not. The line to draw is: share the part that is one
question, and leave the guards readable without each other open.

**Holding the help's host to a second spelling.** `pomoc.margonem.pl` is a name
we did not choose and it appears in a test fixture as well as in the tool — but
the fixture is a manifest being validated, not a claim about where the help lives,
and a wrong host fails loudly on the next fetch rather than quietly. Declined:
there is no silent disagreement to catch.

**A hand-written list of protected names in a guard.** Cheaper, and it is what F13
and F14 got: closed for two names, refiled for ten, because nothing made the guard
grow when the tree did. Both guards here derive their lists from the thing they
guard.
