# A reduction lands on the other side

Status: implemented

This narrows the refusal AGENTS.md §9.6's second clause carries, and is the
`[ASK]` that clause names — asked on 2026-08-27 and granted. Nothing about how a
team heal is sized changes; what changes is **which** casts are refused.
`docs/specs/2026-08-18-the-side-is-named-and-the-share-is-stated.md` states the
arithmetic and stands as written.

## What was asked for

> the healing reducer is read, and the fight declaring it has every team heal
> refused
>
> — `fbad04e`, the commit this one narrows

and then, of the sentence the changelog offered a player:

> dlaczego nie da sie?

## What was refused, and why it was too much

`healall_per` states a **share** and names only the caster. The panel turns that
into health with the game's own arithmetic — `floor(share × maximum)`, capped by
the room between where a combatant stands and where they entered — and §9.6
allows that only while every input is held and no documented effect reduces the
result.

`lowheal_per-enemies` is such an effect: the help names `healall_per` among the
three it lowers. So a fight mentioning it anywhere had **every** cast in it
refused, because the help does not say whether the protocol states the share
before or after the reduction, and a share reduced twice is as wrong as one not
reduced at all — in the direction the panel cannot mark.

The cost of that landed with the first material to carry the key.
`tests/captured-fights/2026-08-27-luvia-grupa-vs-amaimon-2.json` had all three of
its `healall_per` casts refused, its two casters marked, and its healing counted
as healing nobody could size — while **one of its own party** was the one casting
the reducer, at the monster.

## What the help states

Article `view,372` at the engine name `lowheal_per-enemies`, read 2026-08-27:
the effect lowers the healing that active-skill effects give every character on
the **opposing** team, is applied on the initiation layer and fired on the
initiation layer at the opponent. It names `healall_per`, `heal_per` and
`combo_heal_per` as the three it reduces.

The `-enemies` suffix is the one `active_decblock_per-enemies` uses for the same
distinction, and the protocol names the caster on the announcement the
declaration rides. So the side the effect reaches is stated, not inferred.

## What the material states

Two of that recording's three casts stand alone in their engine call, so the
health each of the ten members moved can be compared against the snapshots on
either side of it. **Twenty comparisons, every one exact, with the share applied
unreduced** (`tests/core/combatant-health.test.ts`).

That is what turns the help's scope from a citation into a reading. The three
shares stated are 30, 30 and 22.5 — and 22.5 is 30 less a quarter of it, the
article's own rule that each further use of an ability carrying such an effect
gives back 25% of the base less. It is not `27` applied to anything. Had the
reduction reached this side and the protocol not pre-applied it, those twenty
figures would each be short by 27%.

The measurement says nothing whatever about a cast on the side the reduction
**did** reach. No recording anywhere holds one. That case is still refused.

## The rule

A cast is refused where a reducer of the same fight was declared from a side
other than the one it was cast on. Four limits, and each of them is a refusal:

- **A reducer this reader cannot place reaches every side**, which is the
  fight-wide refusal exactly as it stood. Two ways in: an occurrence whose caster
  the roster cannot resolve, and one arriving among an `unknown-message`'s unread
  keys — that event names the ends of its message without saying which slot each
  came from, so reading the first as the caster would be right only while the
  actor slot is filled.
- **Every other side, not "the other one".** The protocol states a side as a bare
  number and never how many there are (§10), so a fight holding three has all but
  the caster's own refused.
- **Fight-wide in time.** One occurrence disqualifies its sides for the whole
  fight and not for the casts after it: the effect is declared once and applies
  from the initiation layer.
- **Both shapes are still read.** The declaration and the unread key, so removing
  the key from `SKILL_DECLARATION_KEYS` cannot switch the refusal off in silence.

## Rejected alternatives

**Leave it refused fight-wide.** What stood, and what `fbad04e` wrote down rather
than acted on. It is honest and it is also wrong about this fight: it counts
healing as unsizable while the snapshots size it exactly, and marks two players'
rows for a shortfall that is not there. §9.6's warning-on-a-row exists so a
figure that is short says so; a warning on a figure that is whole spends the same
credit and cannot be told apart from the real thing.

**Apply the reduction ourselves where it does reach a side.** Rejected: the help
does not say whether the stated share is before or after it, so this would be a
guess with two directions and no evidence for either. The refusal stays.

**Read the scope from the announcement's target rather than its caster.** The
target is one combatant; the effect reaches a team. Reading a side off the one
named victim would be right in this recording and wrong the moment an
announcement names nobody — which is the shape `heal` and `injure` already arrive
in.

**Wait for material carrying a cast on the reduced side.** That is the material
that would settle whether the share is pre-applied, and it may never arrive: it
needs the opposing side to both carry the reducer and cast a team heal into a
recording of ours. Refusing that case costs nothing now, so nothing is waiting on
it.

## What it costs

The corpus stops exercising the refusal, and stops exercising §9.6's
warning-on-a-row through material — both are held by hand-built fights again
(`tests/core/combatant-health.test.ts`, `tests/ui/panel-view.test.ts`). That was
the state for the three releases before 2026-08-27 and is written down here so it
is not rediscovered as a gap.
