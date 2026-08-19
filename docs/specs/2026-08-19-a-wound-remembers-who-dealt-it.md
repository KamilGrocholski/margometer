# A wound remembers who dealt it

Status: implemented

This adds the fourth clause to AGENTS.md §9.6, beside
`docs/specs/2026-08-19-a-heal-nobody-gave-was-their-own.md`. That one fills an end
from the combatant the **same** message names; this one fills it from a combatant
an **earlier** message named, which is the widest reading in the project and the
reason its limits are written down at this length.

## What was asked for

> Check whether "Zaranienie" can be assigned to `actor`

The game's own word is **Zranienie**, printed beside the engine name `injure` in
the published help. It is the deep wound a blow applies, ticking afterwards on the
combatant it was applied to — and the panel drew every one of those ticks as
`Nieznany sprawca`, *the game does not say who did this*.

## The answer, and why it is a reading rather than a guess

The protocol states the wound twice, in two different messages.

| | message | what it names |
|---|---|---|
| the application | `467968=99.52;-10000252=99.85;+dmgd=1717;…;+injure=71` | the attacker, the victim, and the figure |
| the tick | `-10000252=99.98;0;injure=71` | the victim, nobody, and the same figure |

What joins them is the help's own rule and not their proximity. Article
`view,372` at the engine name `injure`, read 2026-08-18: the event fires only on a
landed attack against an opponent, applies deep-wound damage as a separate
instance worth 15% of the damage dealt over three turns, does not accumulate, and
**is overwritten by the freshest value applied to that given opponent**. So a
victim carries exactly one wound at a time, the freshest application against them
is whose it is, and the figure says which application is ticking.

Measured over `tests/captured-fights/` as the set stood 2026-08-19 — 17 captures,
8 of them carrying the key:

| | |
|---|---|
| `+injure` applications | 65, every one naming an attacker **and** a victim |
| `injure` ticks | 151, worth 25 062 points |
| ticks landing on a victim already carrying a wound | 151 of 151 |
| ticks stating exactly what that wound announced | 151 of 151 |
| ticks whose figure matched a *different* attacker's live wound | 0 |
| ticks arriving while more than one attacker had wounded that victim | 36 |
| applications followed by more than three ticks | 0 |

The last two are why the rule is worth stating carefully: attribution is genuinely
contested in the group fights — three attackers wound one boss — and the overwrite
rule plus the figure resolve it every time. Broken deliberately, keeping the
*first* application against a victim rather than the freshest disagrees on 1 066
lines of the corpus (`tests/core/injure-rule.test.ts`).

## Where the reading lives, and why it cannot live in the decoder

`src/game/battle-session.ts` decodes **incrementally**: it appends the events of
new messages and carries exactly one message forward, because the game glues an
announcement to the message after it. A wound held inside `decodeFight` would
therefore reach only the ticks that happen to share an engine call with their
application — **36 of the 151** — and which ones those are depends on how the game
split its payloads, which is not a property of the fight.

`composeFightStatistics` is rebuilt from every event on every payload. That is
already the stated reason sizing lives there rather than in the decoder, and it is
the same reason here. The pairing was checked at the event level before anything
was written: 65 attack events carry `+injure` in `declared` with a resolved
`targetId`, and 151 of 151 ticks pair off them.

What the decoder keeps is the **name of the pair** —
`WOUND_ANNOUNCEMENT_BY_TICK_KEY`, one entry — because a key we did not choose is
spelled once (§9.3), and because `docs/protocol-keys.md` is held to that list in
both directions by `tests/core/protocol-key-register.test.ts`.

## The three declines

Each leaves the figure exactly where it was, on the pinned row.

- **Nothing announced a wound on this victim.** A fight joined after the blow that
  applied it. Zero in the corpus; the shape a live attach in the middle of a fight
  produces.
- **The tick states a figure that is not the one announced.** Then this is not the
  wound being held, and a tick that cannot be identified cannot be placed.
- **The application's own attacker did not resolve.** There is no name to fill the
  end with, and inventing one is §5's flat no.

⚠️ **A fresh application replaces the one before it even when it is one of the
declines.** The game overwrites the wound whoever landed it, so an application with
an unresolved actor has to displace the wound already running — keeping the old one
would let a stale wound go on claiming ticks that are somebody else's. That is the
half a reader would leave out, and `tests/core/injure-rule.test.ts` holds it.

**No cap on ticks.** The help says three turns and the corpus never exceeds three,
but nothing here counts turns (§10) and a cap would be this meter inventing a
clock. What binds is the figure and the overwrite.

## What it comes to on screen

Total damage is unchanged — nothing was created, and the side totals do not move,
because a tick on the enemy was already charged to our side by
`getPartCharged` (`docs/specs/2026-08-18-two-ends-and-one-of-them-is-named.md`).
What changed is which row holds it: 25 062 points leave `Nieznany sprawca` and
reach the five attackers who applied them.

`Zadane` is now `dealtApplied + healthLostCaused`, which is the mirror of the
addition `Otrzymane` has always made (`taken + healthLost`). The aggregate keeps
the two apart:

- the wound is on no `blowsStruck`, no `largestBlow`, no damage element;
- it stands as its own row in `CZYM (UMIEJĘTNOŚCI)` under the game's word for the
  key, rather than closing into `Zwykły cios` — that row says *a blow nothing
  announced* and counts how many, and a wound is neither;
- the combatant card splits both figures as `z ciosów` and `poza ciosem`. The
  second line used to read `bez sprawcy` on the taken side, which stopped being
  true of every point in it.

## Rejected alternatives

**A carry inside `decodeFight`.** The natural place, and it reaches 36 of 151 —
and worse, silently: the offline tools decode a whole fight at once and would have
agreed with the panel on the captures while disagreeing with it in a live fight.
That divergence is exactly what `src/game/battle-session.ts` warns about.

**A `causedBy` field on `HealthChangeEvent`.** A §4 data-contract change that buys
nothing: the key and the figure are all the join needs, and an event field would
have put the same reading in two places, where §9.3 says one of them eventually
gets written differently.

**Folding the wound into `dealtApplied`.** Fewer fields, and it makes
`dealtAppliedByElement` hold a key that is not an element while `dealtApplied`
stops meaning what its own line says — *what landed, from blows this combatant
struck*. Two quantities under one label is the failure this panel exists to
prevent.

**Letting the wound close into `Zwykły cios`.** Smallest change, and it is the
`taken` screen's current behaviour for poison. It states a count of blows beside a
figure that contains none.

**Reading a wound off the last attacker to hit that victim.** The rule a reader
would reinvent from the panel, and the one `src/core/fight-decoder.ts` already
refuses for skills: it waits for a match and would eventually hand somebody
another attacker's wound. Nothing here is derived from a neighbouring message —
the figure has to agree, or nobody is charged.

**Doing the same for `poison` and `fire`.** They arrive in the identical shape and
no key announces them at all, so there is no earlier message to read a name off.
They keep their pinned row, and that asymmetry is the content of the clause.
`critwound` is the near miss: the help names it as the other source of deep-wound
damage and the client knows `+critwound` and `critwound`, a separate tick key that
cannot be mistaken for this one. Neither is in the captures, neither is read, and a
second pair is `[ASK]` (§9.6).
