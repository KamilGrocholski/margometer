# Two axes, and the direction healing was missing

Status: implemented

This supersedes "Three metrics, a side filter, and a rate" in
`docs/specs/2026-08-11-the-panel-that-drills.md`. That file stays as written —
it says so itself, and a dated record that quietly changes its mind is a record
of nothing. Everything it decides about rows, drilling, the pinned row and the
title bar still stands.

## The defect: one strip, two kinds of thing

`Zadane / Otrzymane / Leczenie` looks like three metrics and is not. The first
two are **directions** of one noun; the third is a **noun with no direction**.
Nothing about the panel said so, and the cost was specific: healing given had
nowhere to stand, because the only place to put it was a fourth item in a strip
where it would sit beside healing received.

The previous spec rejected exactly that, and the objection was right:

> **A separate "leczenie zadane" metric.** It is a fourth ranking answering a
> question the third already answers from the other end, and it would put healing
> given beside healing received where they would be read as one column.

Separating the axes answers it rather than overruling it. The two healing
directions become one screen in two states of one control: exactly one is
selected, they are never drawn together, and moving between them is a deliberate
flip. They cannot be read as one column because they are never two columns.

## The axes

**Row one — the noun.** `Obrażenia · Leczenie`. Which quantity.

**Row two — the direction, then the side.** `zadane|otrzymane` (`dane|otrzymane`
under healing), then `Wszyscy · My · Oni`. Which way round, then who is listed.

Lower case for the direction against the nouns' upper: two strips of equal weight
read as two lists of the same kind of thing, and these are not.

**The direction is worded per noun**, because Polish does not use one word for
both — damage is *zadane*, healing is *dane*. A single label covering both would
have to be ours rather than the language's.

**No third strip.** A strip costs `padding-top: 3px` plus a 16.85px line box —
19.85px against a list row's 20px. The list's eleven and ten were measured
("ten because that is the most a side fields"), so a third strip is one ranking
bar paid for chrome. The direction shares row two instead, pushed against the
side filter by one flex rule.

## The state stays one field

The axes are **derived**, not stored. `PanelState.metric` remains the single
field, and `METRIC_AXES` in `src/ui/panel-view.ts` maps each metric onto its
`(noun, direction)` pair.

Two fields would make `healing × given` expressible before there was a figure
behind it. §9.5 puts an invariant like that in the type rather than in a check
five call sites have to remember: a pair with no row in the table is a screen
that does not exist, and the compiler counts the rows. Adding the fourth metric
turned six `Record<PanelMetric, …>` tables red, which is the list of decisions
somebody had to make in Polish — not a list anybody had to remember.

**Both strips report a metric.** A tab carries the metric it would switch *to*,
so the drawing has one handler and one identity map however many axes the panel
grows, and the rule that a noun keeps the reader's direction lives where it is
checkable without a browser.

## What the fourth screen shows

Ranking by `healingGiven`; breakdown `KOMU` (recipients) and
`CZYM (UMIEJĘTNOŚCI)` (their own skills, by what each restored). No `OD CZEGO`:
the source keys the game states belong to whoever received the health, so a giver
has none, and an empty section is not drawn.

**No closing row, and that is a reading.** A giver's total is the sum of what the
announcements credited them with, so the section already closes against the row.

**The balance the screen rests on**, verified on all seven captures:

> healing given + `Bez sprawcy` = healing received

The second term is large and the panel does not hide it — on
`2026-08-12-tempest-grupa-vs-hildur-2` it is 109 113 against a top healer of
12 077, or 88% of the fight's healing with no author. That is the protocol's
limit, stated where the consequence is.

## Two things this round found and fixed

**The pinned bar drew past the end of its track.** `composePanelView` measured the
scale over the ranked rows only, while the comment on that very line promised the
largest figure *on screen*. Under `Leczenie` the pinned figure beats every ranked
row in five of seven captures, up to 1.56× — and `.row { overflow: hidden }` clips
that into a bar indistinguishable from a full one. The row that says *something
here is missing*, drawn as the largest thing in the fight. The fixture test could
not see it: 60 points of poison against a 400-point mage cannot exceed the scale
however wrong the scale is.

**The screen had two denominators.** The ranking divided by the ranking and summed
to 100%; the pinned row divided by the ranking plus itself. Two questions, printed
identically. Under `Zadane` it showed as the rows adding to 107% and nobody
noticed; under `Leczenie dane` it showed as a ranking summing to 100% beside a row
saying 79%.

**Every bracket now divides by one figure, computed once**: the rows the filter
admits, plus the pinned figure — counted once. Under `Leczenie` that figure is
already inside the rows, because healing nobody announced still landed on
somebody, so only the part belonging to nobody at all is added.

That leaves one thing arithmetic cannot fix and the panel says instead. Under
`Leczenie` the two brackets answer one question about one whole and still
**overlap** — they are two cuts of the same healing, by recipient and by whether a
healer is named — so the shares on that screen come to more than a hundred. The
pinned row states it in its own words: *"To leczenie jest już policzone wyżej, u
tych, którzy je dostali."* Under `Leczenie dane` nobody claims it, and there it
says the opposite, because there the shares really do come to a hundred.

The guard checks the property rather than the number: a figure and its rounded
share imply a range the denominator must lie in, and every row's range has to
overlap every other's. The test never learns what the whole is — only that there
is one of it, which is what broke.

## Defence and destruction get labels, not a tab

`prevented` and `destroyed` used to be one `·`-joined line with no heading, mixing
points of armour, percentage points of resistance and absorbed damage. They are
two labelled blocks now — `Zatrzymane` and `Zniszczone` — with the unit riding in
the value of the one that is not in points, no bar, and no total.

## Rejected alternatives

- **`Obrona` as a noun tab.** Measured: `prevented` has 0–2 non-zero rows per
  fight and is empty in two of seven captures. A ranking with one bar draws a
  100% fill and a `(100%)` bracket — a screen repeating its own total, which
  `composeCrossSection` already refuses to draw one level down. There is also no
  figure to rank by: `destroyed` mixes units, and `prevented` carries the comment
  "No total — the members are different things."
- **A "% zatrzymane".** The absorption pool never appears in the captures, so
  there is no denominator. Any percentage would be a number nobody wrote.
- **`Efekty` as a noun tab.** Counts are not amounts, and every other bar in this
  panel is health points. Ranking by total procs ranks by blows: `crit` is 208 of
  412. And whose an effect is is not stated — `+legbon_verycrit` fires when its
  bearer attacks, `-legbon_cleanse` when its bearer is hit — so the honest heading
  is the narrow one that already exists, `Efekty w ciosach`.
- **Crowd control as a noun.** 60 events across seven fights, no durations, and
  no turn key anywhere in the protocol, so no uptime is derivable. The client's
  whole `+stun2*` / `+immobilize` / `removestun*` family has zero occurrences in
  our captures, so the screen would look complete while being partial.
- **Buffs and auras as a section.** They land in the `declared` slot: statements
  of *intent* with no recipients, no durations and near-constant values. Tying one
  to a later figure is the join §5 forbids.
- **A dropdown of modes.** It hides its siblings, so nobody discovers the fourth
  screen exists, and it costs two clicks mid-fight. What transfers from Recount is
  the warning, not the control: modes multiply once they are cheap to add. The
  matrix is the discipline against that — **a new mode is a noun that takes both
  directions, or it is not a mode.**
- **An icon strip.** §9.7's "colour never carries meaning alone" argues the same
  for a glyph, and the panel's spare gesture is already spent: the right button
  goes back from anywhere.
- **The mode as a drill level, the way Skada does it.** The drill budget is
  already spent on combatant → pair → skill, and burying the axis one click down
  hides which screen you are on.
- **A `uniki` counter, now that `-evade` is read.** Every flag is counted against
  whoever swung, so on a row it would mean blows that combatant threw and somebody
  dodged — not times they dodged. Under that label it would be read as the second.
- **Making the shares under `Leczenie` sum to a hundred.** They cannot, and the
  arrangement that would force it is worse: dropping the pinned row's bracket, or
  subtracting the unannounced healing out of the rows it actually landed on. The
  overlap is a fact about the protocol — the same points are somebody's healing
  received *and* healing with no author — so it is stated rather than smoothed.
- **Renaming `Zadane` / `Otrzymane`.** They were already the direction axis. The
  whole finding is that they were filed under the wrong heading, not that they
  were the wrong words.
