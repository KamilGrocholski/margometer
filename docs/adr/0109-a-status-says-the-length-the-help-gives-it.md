# 0109. A status says the length the help gives it, and nothing where the help gives none

- **Status:** Superseded by 0112 in part, and by 0116 in part
- **Date:** 2026-09-22

## Context

A reader hovering a fighter saw `Trucizna · 38 tur`.

The figure was the mask's own count — how many of that fighter's turns the bit had been lit for,
counted from the payload it first stood in (`core/carried-status.ts`). **ADR 0104** put it there
because a mask states no total, and the row drew it with no label: a count of turns beside a status
reads as that status's length, or as what is left of it.

**It is neither, and the published help says by how much.** Article `view,372`, read 2026-09-22:
trucizna, at the weapon attributes `poison1, of_poison1`, is _aplikowana na 5 tur po trafieniu
przeciwnika obrażeniami o niezerowej wartości_ and _wyzwala się przed turą przeciwnika, na którego
została zaaplikowana_ — five turns, on the bearer's own clock. The same article's table of damage
over time gives trucizna `Nadpisywanie: NIE`, and defines what that costs: _liczą się tylko
obrażenia najwyższe, a kolejne zaaplikowanie obrażeń tylko przedłuża ich czas trwania_.

So a later hit **extends** rather than stacking, and an extension makes no 0→1 edge on the mask. The
38 was a run of about eight applications of a five-turn effect, drawn as one figure. The effect had
never once stood longer than five.

**The application itself is announced nowhere.** The client's key list carries no `+poison` beside
`poison` (`docs/protocol-keys.md`), so nothing dates the standing application and no fraction can be
composed for it. What is true while the bit is lit is a **bound**: between one turn and five are
left.

**Głęboka rana is the same sentence.** At `wound1, of_wound1` the help states the same five turns
and caps its own extension at them — _przedłuża efekt obrażeń od głębokich ran o 2 tury (maksymalnie
do 5 tur)_. The bit carrying it is `wound`; `deep_wound` is a different bit and no reading joins it
to anything the help gives a length.

**Nothing held the old figure.** Removing it turned no test red — measured 2026-09-22, the whole
suite stayed green — so the count was drawn into somebody else's tooltip and read by no guard.

## Decision

**A status row states the length its own evidence supports, and there are four kinds.**

1. **An announcement over this bearer** dates the standing effect, so the row draws how far through
   it is on them: `3 z 8 tur` (`core/carried-figure.ts`, unchanged).
2. **The published help states a length and the mask's count is inside it**, so the row **counts
   down**: `1 z 5 tur`, the length less the bearer's own turns since the bit lit. This is the figure
   a player acts on — how much longer the poison runs on them.
3. **The count has reached the length**, so the effect was applied again: it could not have survived
   otherwise. No wire announces an application, so the moment is unknown and the row says what is
   still true, `najwyżej 5 tur`.
4. **The help states nothing**, and the row is the status alone.

**The countdown is exact where nothing refreshed the effect, and a floor where something did.** A
re-application inside the window is as invisible as one past it, but it only ever makes the effect
run **longer** — so the drawn figure is never more than what is left. Never the other way round,
which is the direction that would make it a number nobody can trust.

⚠️ **The floor is the majority case, and the figure that says so was taken late.** Over `captures/`
on 2026-09-22 the poison bit has been lit for five or more of its bearer's own turns in **61.2%** of
the moments it was lit at all, and closed runs reach **26** turns against the five the help gives
one application. A first draft of this record drew a ceiling sentence for that case, and so said
nothing useful most of the time.

**Four witnesses for the moment of application were looked for and all four failed**, which is why a
floor is what there is. The payload carries no timer: `w[].buffs` is one integer and no field beside
it states a time, over every recording. The mask makes no edge, because a second application lands
on a bit already lit. The tick's own value is constant across a run — `poison=1317` stands unchanged
through a run of a dozen — and the help has it reduced by the bearer's resistance, so a change in it
would not be an application either. And a damaging hit, the help's own condition for applying
poison, lands far too often to date one: the gap between the last damaging hit and the bit going out
is **nought or one** turn in every closed run of both dated bits, never five.

**The mask's own count is drawn nowhere.** It is what the countdown is subtracted from, and it is
not a figure: on its own it answers how long we have been watching, which is a fact about this
add-on and not about the fight.

⚠️ **The countdown wears the shape of a figure that means the opposite**, and that is decided rather
than overlooked: `composeStandingTurnsText` draws `3 z 8 tur` for what has **passed**, and its
docblock says it is never a countdown. The two stand on adjacent rows of one tooltip. What settles
it is who is reading: somebody hovering a fighter mid-fight wants to know how much longer the poison
has, not how long it has had them, and a status is a thing you wait out. Held apart in the code by
two composers with two docblocks, and by a test that draws both.

**The two lengths the help states are written where `HOLYTOUCH_TURNS_STATED` is written** — a
constant in `core/`, carrying the sentence, the article and the date it was read on, keyed by the
name the client registers the bit under (`frozen/buff-bits.ts`). Two, and a third is `[ASK]`: the
join from a bit to a weapon attribute the help dates is a reading, not a spelling.

**This turns over the half of ADR 0059 that said `3 z 8 tur` and never a countdown**, and it does so
everywhere a length **this panel counts** is drawn: a status, a shout at either end, and a legendary
bonus. One shape with two readings on adjacent rows of one tooltip is what **ADR 0108** removed a
whole section for.

0059's argument was that a countdown _reads as measured and is not_, and it was made against a bare
`5 tur`. It does not carry to `1 z 5 tur`: the published length stands in the row beside the figure,
so a reader still sees what the number rests on, and the information is the same either way round —
elapsed of stated implies the end just as plainly, by a subtraction the reader does in their head.
What changes is which half is the subject, and somebody hovering a fighter mid-fight is asking what
the effect is going to do next.

**The charge keeps `Minęło`, and that is where the line falls.** `2 z 4` on a charged blow is the
client's **own** pair out of the payload's envelope, restated rather than counted, and it carries no
`tur`. What this panel counts says `Zostało`; what the game reports goes on reporting.

**ADR 0104 stands on everything else.** A cast is still not attributed to a bearer, the mask still
names no caster, and the statuses are still named by the client.

## Consequences

The row now says something a player can act on: five turns is the whole of it, and a hit resets
them. What it no longer says is how long somebody has been poisoned without let-up, which was real
and is now unstated.

`fire`, `shock`, `deep_wound`, `critical_deep_wound` and `frostbite` lose their count and gain
nothing. Their rows say what stands and stop. Where the help is read for one of them, it joins the
table above with its own sentence beside it.

`composeCarriedTurnsText` has no caller and is gone; the two design rounds that measured a line
built from it compose it locally, which is what they already did with the rest of that line's shape.

The words the add-on writes into the game's own tooltip now reach the **L3** walk in
`tests/ui/panel-words.test.ts`. They did not before: `TOOLTIP_WORDS` is not exported, no table
walked it, and the table passed the completeness guard on one value it shares with the card. Proved
2026-09-22 by putting `payload` into it — green before the wiring, red after.

**And the guard that let it through is closed, because one table hiding behind another is not a
property of this table.** `every word the module holds` asked that **one** of a declaration's texts
reach the checks, so a table sharing a single string with another passed unread — `TOOLTIP_WORDS`
behind the card's `Tury wykonane`, and `CHARGED_SKILL_WORDS` behind the same one, which left
`przerwane` read by nothing at all. It now asks that **every** text reach them, and both ends of a
charge are walked. A quoted **key** is no longer counted as a text: `PROC_WORD_BY_KEY` is written
`"+crit": "krytyk"`, and a check asking the panel to say `+of_woundpoison` to somebody would be
asking for the opposite of **L3**. A key is told from a value by **both** ends of it — nothing but
indentation before, a colon after — because the colon alone also follows a ternary's first branch,
which is a word somebody reads. The sample holding that reader found it the moment it was written.

**And the reader behind the whole check is held by name rather than by a count.** It stood on
`holding > 40` while the module holds fifty-eight declarations of words, so a reader that had
stopped finding a third of them was still above the floor. Every table the file walks is now a
declaration the reader must have found, and the walk is written as a record so each table carries
its own name. Measured 2026-09-22: a reader blind to `PROC_WORD_BY_KEY` and `PROC_SUB_WORD_BY_KEY`
leaves fifty-six declarations — green under the floor, red by name under the check.

## Alternatives

**Label the mask's count** — `Trucizna · od 38 tur`. Keeps a true statement and costs one word. It
loses because a reader asking about a status is asking what it is going to do next, and the count
answers what it has already done to our reading.

**Draw a ceiling past the length** — `najwyżej 5 tur` — which this record decided first and held for
one round. True on every turn and the same on every turn, so it tells a player nothing they cannot
read once and remember, and the measurement above puts it on screen for 61.2% of the moments the bit
is lit — most of what anybody would ever see.

**Draw the whole length past the window** — `5 z 5 tur`. The only other constant available, and it
points the wrong way: it says five are left when one may be, and a remainder that overstates is the
one a player acts on and loses by.

**Count down past the length too**, by taking the count modulo it. That is a re-application every
five turns exactly, which nothing observed — an invented number wearing an exact one's shape.

**Draw both** — `najwyżej 5 tur · od 38`. Two numbers for one status in somebody else's tooltip, and
**ADR 0108** removed a section for putting two numbers on one effect.

**Date the application off the tick's value.** A `poison` tick's figure only moves when a **higher**
application lands, so a refresh by the same weapon is invisible and the count runs long again — the
same failure, less often and harder to see. A witness that fails quietly is worse than none.

**Say nothing at all**, which is `addTurnsRow`'s way with a figure it cannot qualify. Refused
because the ceiling needs no qualifying: it is the game's own number and true whenever the row is
drawn.
