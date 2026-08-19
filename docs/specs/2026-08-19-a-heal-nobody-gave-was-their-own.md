# A heal nobody gave was their own

Status: implemented

This adds the third clause to AGENTS.md §9.6 and narrows §5. The two clauses
already there —
`docs/specs/2026-08-18-two-ends-and-one-of-them-is-named.md` and
`docs/specs/2026-08-18-the-side-is-named-and-the-share-is-stated.md` — stay as
written; this is the same move made on the one end neither of them could reach.

## What was asked for

> Fix "Dotyk anioła", "Ostatni ratunek", "Przywrócono [raw_value] punktów życia
> [name](%percentage_health)" or "Regeneracja" — actor/source and target are the
> same character

Four things a player reads in the battle log. They are **three protocol keys**,
and the fourth name is the first key seen from the character sheet rather than
from the log — the client's dictionary and the published help name the same
`heal` twice.

| what the log says | key |
|---|---|
| `Przywrócono N punktów życia X(%)` — the stat a player calls regeneration | `heal` |
| `Dotyk anioła: uleczono N punktów życia X` | `legbon_holytouch_heal` |
| `Ostatni ratunek, zregenerowano N punktów życia` | `legbon_lastheal` |

## The defect

All three restore health to a combatant the message names, and none of them names
a healer. The panel drew that as **`Nieznany sprawca`** — *the game does not say
who healed*. Over the seventeen captures as the set stood 2026-08-19 that was
**901 053 points**: `heal` 826 065, `legbon_holytouch_heal` 40 327,
`legbon_lastheal` 34 661. Every one of the seventeen carried some.

It was not a gap. **The game says whose they are**, and says it three times.

## What the help states

Article `view,372`, read 2026-08-19, by engine name — the name the help prints in
parentheses beside the human one, which is what joins an article to a key at all
(§7.6).

| engine name | what it says, in our words |
|---|---|
| `heal` | An effect laid **on the Character**, restoring the Character's own health, firing only before the action of the Player **it is assigned to** and only while they hold less than they entered the fight with. It decays 5% of its initial value per turn and cannot restore past the entry health. |
| `holytouch` | The Character **applies the effect to itself**; each firing heals the Character 6% of their pool, and only while the holder is attacking. |
| `lastheal` | The **holder's** own legendary bonus, healing the holder once when damage takes them below 18% of their pool and the blow was not lethal. |

Three separate articles' worth of the same sentence: the effect belongs to the
combatant it heals. So `Nieznany sprawca` was not an absence of knowledge, it was
a **false claim about the game** — the shape §3 exists to refuse.

## The measurement beside the citation

The help gives `heal` an arithmetic, so it can be asked of the material. Over the
captures as the set stood 2026-08-19, **838 of 1099** figures `heal` states as a
gain sit exactly on `round(first × (1 − 0.05n))`, anchored on **that combatant's**
own first figure and on nobody else's.

That is corroboration and not proof, and the difference is written down because it
is the honest one. The residue has two named reasons — a boss whose value grows
mid-fight, and tails the documented cap shortened — and the same set carries
`heal_per-allies` and `heal_per-enemies`, which the help says move the value the
decay runs from. So 838 is a **floor** on the fit rather than a ceiling, and no
attempt was made to chase the rest: the attribution does not rest on it.

⚠️ **This clause is held by a citation where its two neighbours are held by a
measurement, and that is the weakest thing about it.** The team-heal clause is
re-earned every run against the health the snapshots record; the two-ends clause
is re-earned against the mirror. Nothing here can be: the protocol states the
figure already, so there is no arithmetic to close and nothing in the material
that would differ if the help were wrong about *whose* effect it is. What holds it
is that the help says so three times, in three separate entries, about three keys
that behave identically — and `[ASK]` before a fourth joins them.

## What changes

`SELF_SOURCED_HEALING_KEYS` in `src/core/fight-decoder.ts`, read by
`fight-statistics.ts` at the two places a healer is chosen. Nothing else moved in
`core`: the sign, the slot and the figure are all as they were, so
`combatant-health.ts` and the health witness never noticed.

- **Total healing is unchanged** — 2 749 855 before and after. Nothing was created.
- **Healing given rose from 1 848 802 to 2 749 855**, by exactly the 901 053 that
  had no giver. The two numbers being equal is the reading: *every point of healing
  in every recording now reaches a healer*, and it is checked as an equality rather
  than as two figures that happen to match.
- The `Nieznany sprawca` row is gone from both healing screens on all seventeen.

**An announcement still wins.** Where something announced the heal, that giver is
one the protocol actually stated, and it beats one derived from documentation. No
capture carries the shape — every `heal` in all seventeen is unannounced — so it is
held by a hand-built fight, and `tests/core/announced-skill-rule.test.ts` states
the corpus half of it by subtracting a term that would overshoot if one ever were.

**And the fill needs a name, not a roster.** `0;0;heal=40` names nobody at either
end and is untouched. A combatant the roster cannot place is a different thing —
the message states their id, so both ends resolve and the figure sits on their own
row under `Wszyscy`, off every side tab, with the bar saying `Bez strony`.

## The damage twin, deliberately left alone

`poison`, `fire` and `injure` arrive in the **identical shape** — the subject in
the actor slot, a literal `0` at the other end — and keep their `Nieznany sprawca`
row. Nothing documents who caused them, and `poison` is unattributed by
construction (`docs/protocol-keys.md`).

That asymmetry is the whole content of the change: two messages the protocol writes
the same way are read differently, because the documentation says something about
one of them and nothing about the other. It is guarded as a table rather than
derived, in `tests/ui/panel-view.test.ts` — a `false` that turned `true` again
would be a healing key nobody has read, and a `true` that turned `false` would be
damage quietly acquiring an attacker.

## What it cost to find: the drill could not open a self-heal

The plan said `src/ui/` needed no edit, because `getHealingWithoutHealer` is
derived and the pinned row empties itself. That was right about the pinned row and
wrong about the level under it.

`composeDeepBreakdown` closed a healing pair against **the sum of the skills** under
it, which is the same arithmetic the section below it performs. A pair no skill
announced closed against zero, produced no rows and no closing row either, and the
level opened **empty** under a row that had just promised a figure. Every
self-sourced heal is exactly that pair.

It was invisible before this round because every healing pair in the corpus was an
announced one. `tests/game/engine-attachment.test.ts` — *opens what each row
promised* — caught it on the first run, on seventeen captures at once. The fix is
to close against `healingGivenByCombatantId`, which is the figure the level above
read the row from.

## Rejected alternatives

**A `healerId` on `HealthChangeEvent`.** A §4 data-contract change for nothing:
`combatantId` and `targetId` already carry the only name the fill may use, and an
event field would have put the same reading in two places.

**Reading `legbon_lastheal` off the message actor.** The actor is whoever struck
the blow, and four of its five occurrences ride a group blow whose target is a
third party — the healed is named only inside the value. Reading a slot would have
credited an attacker with healing their own victim.

**Charging a negative `heal` to the same combatant.** `heal` states a loss as
readily as a gain, and nothing documents a self-damage reading. Those 7 016 points
stay health lost with nobody charged for them.

**Naming self-healing apart in the panel.** It would keep a healer ranking from
being led by regeneration. Declined because the panel has drawn a self-cast
`heal_target` and a team heal's caster share this way since they existed — 52 of
the 78 `heal_target` in the corpus are self-casts — so this is three keys joining a
reading rather than a fourth being invented for them. Worth revisiting if a player
says the ranking reads wrong; the drill already names the recipient, so a self-heal
is visible as one on the row it opens.

**Downgrading §5 to `[ASK]`.** It would have let this through and written nothing
down. The criterion that separates a citation from a guess is the part worth
keeping, so §5 keeps its flat no and §9.6 carries the exception.
