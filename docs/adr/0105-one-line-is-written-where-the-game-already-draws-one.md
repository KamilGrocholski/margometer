# 0105. One line is written where the game already draws one

- **Status:** Superseded by 0107 in part
- **Date:** 2026-09-21

## Context

**ADR 0104** put what each combatant is carrying into the window beside the panel, and said in its
own Consequences that the client draws those nine as icons already — what it does not draw is how
long each has stood. The maintainer answered the obvious way: then put the length where the icons
are.

Two routes were open and the first one recommended here was the wrong one.

**An overlay of our own, over the board.** It reads the game's page and writes nothing, so it keeps
the guest rule whole, and that is why it was recommended. Three things were then found against it,
and only one of them was disarmed:

- `DESIGN.md`'s **Quiet Panel Rule** — _"Nothing animates, flashes, pulses or moves"_. A badge that
  jumps to a new place on every payload is exactly that, and the same rule blesses the other route:
  _"Detail appears on demand and disappears the same way."_
- `.one-warrior` carries `transition` from the moment it is made and never loses it, so a rectangle
  measured at payload time is measured **mid-animation** — the count would land where the fighter
  was.
- `getBoundingClientRect` per fighter forces a synchronous layout inside the engine's own call
  stack, immediately after the game has moved the board. **S3** says that cost is measured and never
  assumed.

Disarmed: the board turns out to be almost still. Over `captures/`, a fighter changes line in 139 of
2858 stated positions, and a death — which reflows a line — happens once in about 22 payloads. Two
other figures were wanted and **cannot be taken from the recordings at all**: they carry no clock
per call, so the real gap between payloads is unknown here, and the animation's length is in the
game's stylesheet, which this repository does not hold.

**A line in the game's own tooltip.** Refused twice, on a cost this record has to correct. The
client's `concatTip` writes to a **registry of strings it keeps for itself** — no node is made,
moved or styled. Measured against the five bullets `SECURITY.md`'s reading boundary actually states:
nothing leaves the browser, nothing is automated, the engine's call runs first and returns
untouched, no exception escapes, a second copy stands down. **None of them is touched.** **N16**
already has the word for what this is — _"a value put outside it is `written`… Outside is E5's
boundaries — the game's page state"_. And **ADR 0060** rejected a second **shadow host**; a string
in somebody's registry is not one.

## Decision

**One line, into the tooltip the game already shows.** `src/game/engine-tooltip.ts` is the only file
that writes outside this program, and it writes through the client's own method. The line is
composed in `src/ui/panel-words.ts` so that `tests/ui/panel-words.test.ts` holds it to **L3** like
every other sentence a player reads — a Polish sentence composed anywhere else escapes that guard.

**It is written after the engine's own call**, which is where the wrap already puts us: the game
rebuilds every tooltip on the same payload, so a line written before it is one the game has just
thrown away.

**It says whose it is.** `SECURITY.md`'s guest rule asks that what a reader meets outside the panel
carries the add-on's name, so the line opens with it.

**A label carrying markup is refused rather than escaped.** The line becomes part of an HTML string
somebody else composed, and the label is the client's own answer — refusing one this repository
cannot use is what **ADR 0024** already does with an answer it cannot use.

**Nothing is read back.** What the tooltip now says is the game's. Asking it would be reading our
own text through their program to learn what we had just put there.

**A detach undoes nothing, because there is nothing to undo.** The game overwrites that registry on
its next payload. `SECURITY.md`'s _"a detach that removes only ours"_ is satisfied by the game's own
redrawing, and that is stated rather than assumed.

## Consequences

Easy: it has none of the three problems the overlay had. Nothing is positioned, so nothing can land
wrong; no layout is forced, so **S3**'s figure does not move; and it appears on demand, which is the
shape `DESIGN.md` asks detail to take.

Hard: **the add-on now writes outside itself, and `SECURITY.md`'s headline sentence changed.** It
said _"The add-on reads"_; it now says what it also writes. That is a real widening and the reason
this record exists — a reader who finds the old sentence quoted elsewhere should find this here.

Also: **a renamed method fails silently.** A client that stops answering to `concatTip`, or moves
the tooltip off `.canvas-warrior-icon`, drops the line and throws nothing. The writer answers with a
count — how many lines landed of how many were composed — so a payload that reached nobody can be
seen rather than guessed at.

Also: the line stands inside the game's own card, styled by the game's own sheet. That is the
opposite of the shadow root's promise, and it is the price of standing where the reader is looking.

## Alternatives

**The overlay over the board.** Recommended here first, built as far as its reading layer, and
withdrawn on the three findings above. Its two modules were deleted rather than left unused.

**Saying it only in the window beside the panel.** Where **ADR 0104** left it, and it is still said
there in full — per carrier, per status, with a card on every row. This record adds the short form
where the fighter is, and takes nothing away from the long one.

**Writing nodes into `.warrior-buffs-wrapper`.** One line of code, free positioning, free scaling
with the client's zoom. It makes elements of ours on somebody else's page, which is the thing the
guest rule is actually about, and `updateWarriorBuffs` empties that wrapper on every change anyway.
