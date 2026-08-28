# The ends a figure names

Status: implemented

How the panel reads a message that names one end of what happened and calls the
other nobody: which side it is charged to, when the missing end may be filled in
at all, and where the shortfall is said when it may not.

Seven rounds between 2026-08-11 and 2026-08-24 arrived at this, each narrowing
the one before it. What is written here is the state they converged on; the steps
are in git history and are not repeated.

---

## 1. The two holes

`actor;target;key=value` (`src/core/protocol-message.ts`), and a `0` in a side
segment is the protocol naming nobody. So a message names an actor and calls the
target nobody, or names the target and calls the actor nobody.

Counted over the captures as the set stood 2026-08-18:

| hole | shape | occurrences |
|---|---|---|
| **no actor** | `-10000547=99.60;0;poison=1317` | 1 895 messages of 7 128 |
| **no target** | `1=90.00;0;+dmg=300;-dmg=200` | 0 |
| **neither** | `0;0;+dmg=90;-dmg=70` | 0 |

The first is a health change: the subject sits in the actor slot and the target
is that `0` (`HEALTH_CHANGE_KEYS` in `src/core/fight-decoder.ts`), so the message
names **whom it happened to** and never **who did it**. By protocol key, summed
over that set: `poison` 410 461, `injure` 25 062, `heal` stating a loss 7 016,
`fire` 1 419.

Two rows say so, and they are different claims: *nieznany sprawca* is a figure
whose actor the game left out, *nieznany cel* one whose target it did. A message
naming neither end is neither of them.

---

## 2. A side may be charged; a person may not

**`getPartCharged` in `src/ui/panel-view.ts` is the one inference this panel
draws.** Health that fell goes to the other side, health that rose stays on the
same one — damage crosses sides, healing does not. It is asked only under a
*given* direction; under a received one the points are already on the row of the
person the health moved on, and charging them again would count them twice.

It rests on there being two sides and nobody harming their own, which the
protocol states nowhere. That is why it is `[ASK]` to widen and why it is held by
a **measurement** rather than by a comment: over every capture, `Zadane · My`
equals `Otrzymane · Oni` and `Leczenie dane · My` equals `Leczenie · My`, read
down two different arms of the aggregate (`dealtApplied` against `taken`,
`healingGiven` against `healed`). A blow between two of ours, or an end that
stops resolving, breaks the equality — the assumption and the measurement are the
same claim (`tests/ui/panel-view.test.ts`).

**Charging a name is still §5's flat no.** A side has members, and a guess about
which one would be ours.

### Where each row stands

`HOLE_STANDING`, four screens by two holes:

| screen | `Nieznany sprawca` | `Nieznany cel` |
|---|---|---|
| `Zadane` | apart from the rows, in the whole | **no row** — the actor is named and their own total holds it |
| `Otrzymane` | a cut of the rows | apart from the rows |
| `Leczenie dane` | apart | **no row** — as above |
| `Leczenie` | a cut | apart |

**Every screen closes**: the ranking plus the rows standing apart is the summary
bar's figure for that tab, to the point, on every capture.

**What names neither end has no side.** It rides whichever row stands apart under
`Wszyscy` (`getHoleCarryingNeitherEnd`) and is on no row at all under a side tab,
where the bar names it. Zero in every recording — which is exactly why it is
written down rather than left to be noticed. It is not zero in a live fight where
a name matches nobody, and deleting it would leave two sides summing to less than
the fight with nothing saying so.

---

## 3. Filling a missing end

Three narrow clauses, each `[ASK]` to widen. Nothing is derived from a
neighbouring message, from a slot, or from what usually happens.

### 3.1 Self-sourced — the same message named it

**Where the published help says the effect is that combatant's own, the giving
end is the receiving end.** There was never a second name to get wrong.

`SELF_SOURCED_HEALING_KEYS` in `src/core/fight-decoder.ts`, three keys, each
carrying its engine name and read date. Article `view,372`, read 2026-08-19:

| engine name | what it says, in our words |
|---|---|
| `heal` | An effect laid **on the Character**, restoring the Character's own health, firing only before the action of the Player it is assigned to and only while they hold less than they entered the fight with. Decays 5% of its initial value per turn; cannot restore past the entry health. |
| `holytouch` | The Character **applies the effect to itself**; each firing heals the Character 6% of their pool. |
| `lastheal` | The **holder's** own legendary bonus, healing the holder once when damage takes them below 18% of their pool. |

Before this, the panel drew 901 053 points across the captures as *the game does
not say who healed* — `heal` 826 065, `legbon_holytouch_heal` 40 327,
`legbon_lastheal` 34 661. That was not an absence of knowledge but a **false
claim about the game**, which is the shape §3 exists to refuse.

Total healing did not move (2 749 855 before and after). Healing *given* rose
from 1 848 802 to exactly that figure — every point of healing in every recording
now reaches a healer, checked as an equality rather than as two figures that
happen to match.

Three limits, all load-bearing:

- **An announcement wins.** A giver the protocol stated beats one read off
  documentation. No capture carries the shape, so it is held by a hand-built
  fight.
- **The restoring direction only.** `heal` states a loss as readily as a gain and
  nothing documents a self-damage reading; those 7 016 points stay health lost
  with nobody charged for them.
- **A message naming nobody is untouched.** `0;0;heal=40` needs a name the
  message already carries.

⚠️ **Held by a citation where the other clauses are held by a measurement, and
that is the weakest thing about it.** The protocol states the figure already, so
there is no arithmetic to close and nothing in the captures would differ if the
help were wrong about whose effect it is. What holds it is that the help says so
three times, about three keys that behave identically. `[ASK]` before a fourth.

The measurement beside the citation, offered as corroboration and not as proof:
838 of 1099 figures `heal` states as a gain sit exactly on
`round(first × (1 − 0.05n))`, anchored on that **combatant's** own first figure.
The residue has two named reasons — a boss whose value grows mid-fight, and tails
the documented cap shortened — and the same set carries `heal_per-allies` and
`heal_per-enemies`, which move the value the decay runs from. So 838 is a floor
on the fit rather than a ceiling, and the attribution does not rest on it.

### 3.2 Earlier-named — a message before it named the other end

**The widest reading in the project, and the only one reaching past the message
it reads.** One pair exercises it: `WOUND_ANNOUNCEMENT_BY_TICK_KEY`, `injure` ←
`+injure`.

| | message | what it names |
|---|---|---|
| the application | `467968=99.52;-10000252=99.85;+dmgd=1717;…;+injure=71` | the attacker, the victim, and the figure |
| the tick | `-10000252=99.98;0;injure=71` | the victim, nobody, and the same figure |

What joins them is the help's own arithmetic, not their proximity. Article
`view,372` at the engine name `injure`, read 2026-08-18: the wound does not
accumulate and **is overwritten by the freshest value applied to that given
opponent**. So a victim carries exactly one at a time, the freshest application
is whose it is, and the figure says which one is ticking.

Measured over the captures as the set stood 2026-08-19 — 8 of 17 carry the key:

| | |
|---|---|
| `+injure` applications | 65, every one naming an attacker **and** a victim |
| `injure` ticks | 151, worth 25 062 points |
| ticks landing on a victim already carrying a wound | 151 of 151 |
| ticks stating exactly what that wound announced | 151 of 151 |
| ticks whose figure matched a *different* attacker's live wound | 0 |
| ticks arriving while more than one attacker had wounded that victim | 36 |

The last is why the rule is worth stating carefully: attribution is genuinely
contested in the group fights, and the overwrite rule plus the figure resolve it
every time. Keeping the *first* application rather than the freshest disagrees on
1 066 lines of the corpus (`tests/core/injure-rule.test.ts`).

Four limits, all load-bearing:

- **The freshest application only** — the help's rule, not a habit.
- **The figure must agree**, so a tick that cannot be identified is charged to
  nobody.
- **An application nobody is named for still replaces the one before it**,
  because the game overwrites it whoever landed it. Keeping the old one would let
  a stale wound claim ticks that are somebody else's.
- **No cap on ticks.** The help says three turns and the corpus never exceeds
  three, but nothing here counts turns (§10) and a cap would be this meter
  inventing a clock.

**It cannot live in the decoder.** `src/game/battle-session.ts` decodes
incrementally, so a carry inside `decodeFight` would reach only the ticks sharing
an engine call with their application — **36 of the 151** — and which ones those
are depends on how the game split its payloads. Worse, it would fail silently:
the offline tools decode a whole fight at once and would have agreed with the
panel on the captures while disagreeing with it in a live fight. The reading
lives in `src/core/fight-statistics.ts`; the decoder keeps only the pair's name.

### 3.3 The test every other tick fails

`[ASK]` before a second pair joins it, and the asking is about three things a key
either has or has not:

1. **an announcement in the protocol** — a key stating the effect was applied, on
   a message naming both ends;
2. **a figure on that announcement** — so *which* application is ticking is read
   rather than assumed;
3. **a rule making one application the owner** — the help saying the victim
   carries one at a time.

Two is not a join: without the figure the tick is charged on a resemblance,
without the rule the freshest attacker is simply the wrong one.

Every tick the client composes has been put to that test, against the help's
table of the five damage-over-time types (article `view,372`, read 2026-08-19)
and the client's own key list (`tests/frozen-protocol-keys.ts`):

| tick | announced by | figure on it | the help's rule | verdict |
|---|---|---|---|---|
| `injure` | `+injure` | yes | overwritten by the freshest | **read** |
| `critwound` | `+critwound` | **no** | the same rule | declined — nothing identifies which application |
| `wound` | `+wound`, `+of_wound` | **no** | **accumulates** | declined twice over |
| `anguish` | `+legbon_anguish` | **no** | — | declined — the announcement is not enough |
| `poison` | nothing | — | a later hit extends it | declined |
| `fire`, `light` | nothing | — | overwritten by the freshest | declined — nothing announces them |
| `frost`, `physical`, `absolute` | nothing | — | not among the listed types | unread, no material |

`anguish` is the instructive one: 2026-08-25 brought material where
`+legbon_anguish` rides the blow that applied the bleed and names both ends, and
states **no figure** — the second of the three, and the one that cannot be worked
around. It stays half-named, and the shape of the refusal is the point.

**The asymmetry is the content of the clause.** `poison` and `fire` arrive
written identically to `injure`, and are read differently because the
documentation says something about one and nothing about the other.

---

## 4. Where a shortfall is said

§9.6 asks for the warning to sit next to the figure it concerns rather than in a
global banner. Two gaps name somebody and reach a row; the rest stay in the
fight's own strip.

| gap | what it says | severity |
|---|---|---|
| an unread message naming somebody | one of their figures **may** be short | suspect |
| a side heal this meter could not size | the caster's giving **is** short | certain |

The certain one is said above the suspicion: ranking *this is missing* under
*something might be* buries the only line that is not a guess.

Both gaps are placed on a name the **protocol** stated. `parseProtocolMessage`
reads the actor and the target out of the first two segments and only then looks
at the keys, so a message that fails on a key has both of its ends in hand at the
moment it is given up on — `UnknownMessageEvent` carries them.
`UnaccountedHealthEvent` carries the caster.

**A gap says a figure is short without ever saying by how much**, and **a cut of
a figure never carries one**: a shortfall cannot be placed onto one opponent or
one skill, so the mark rides the combatant's own row at every level. A gap naming
nobody stays in the strip, which is not a banner — it is the reading's summary,
and the only place a message naming neither end can be said at all.

`[ASK]` before a third gap joins the two, and the asking is whether the protocol
states a name for it. A gap placed on a row it was not named for is §5's guess
wearing a warning's clothes.

⚠️ **Held by hand-built fights and by no recording**, and that has been true but
for one day. On 2026-08-27 a recording declaring `lowheal_per-enemies` had every
team heal of its fight refused and marked its two casters' rows; reading the side
that effect reaches took it back the same day. The corpus marks no row, and a
capture that grows one is a fight the panel is warning about.

---

## Rejected alternatives

**One row for both holes, team-scoped.** It leaves the second hole where it was:
under `Leczenie dane` those points are in no total at all.

**A third row for what names neither end.** It belongs to no team, so it could
only ever draw under `Wszyscy` — a row that appears and vanishes with the tab,
for a figure that is zero in every recording. It rides the row standing apart
instead, and the bar names it where no row can.

**Keeping a given-direction figure inside the denominator.** It divides a side's
rows by a whole containing a figure they are not part of — 38.7% of `Zadane · Oni`
on one capture — and hands `Leczenie dane · Oni` a row saying 100% over an empty
ranking. The bracket was the symptom; the denominator was the claim.

**Dropping the row on a given screen under a side tab.** The literal reading of
"it has no side". It is silence on two of four screens, and it hides the largest
single limit the protocol imposes on exactly the screens a reader spends most
time on.

**A `healerId` or `causedBy` field on `HealthChangeEvent`.** A §4 data-contract
change for nothing: the names and the figure are all the join needs, and an event
field would put the same reading in two places.

**Reading `legbon_lastheal` off the message actor.** The actor is whoever struck
the blow, and four of its five occurrences ride a group blow whose target is a
third party — the healed is named only inside the value.

**Reading a wound off the last attacker to hit that victim.** The rule a reader
would reinvent from the panel. Nothing here is derived from a neighbouring
message: the figure has to agree, or nobody is charged.

**Folding the wound into `dealtApplied`.** It makes `dealtAppliedByElement` hold
a key that is not an element while `dealtApplied` stops meaning what its own line
says. Two quantities under one label is the failure this panel exists to prevent.

**Naming self-healing apart in the panel.** It would keep a healer ranking from
being led by regeneration. Declined because the panel has drawn a self-cast
`heal_target` this way since it existed — 52 of the 78 in the corpus are
self-casts — so these are keys joining a reading rather than a fourth being
invented for them.

**Downgrading §5 to `[ASK]`.** It would have let this through and written nothing
down. The criterion separating a citation from a guess is the part worth keeping,
so §5 keeps its flat no and §9.6 carries the exceptions.
