# Statuses standing

What the payload's own status mask leaves standing on a combatant, how long it has stood, and what
this repository refuses to say about it.

**The game states one integer per combatant and nothing else.** `payload.w.<id>.buffs` is a bitmask;
the client reads nine of its bits and tips each one (`updateWarriorBuffs` and `buffNames`,
development build `1781609507010`). There is no duration in it, no caster, and no count of what is
left. **ADR 0050** carries what follows from that.

**Read off the recordings, not written from memory.** `tests/tools/status-standing.test.ts` composes
every row below through `tools/status-standing.ts` and refuses a row naming a bit the corpus does
not set, a bit no row names, or a figure the tree does not produce. A line here that stops being
true fails the gate.

**No totals in prose.** How many episodes the corpus holds changes with the next recording, so it is
measured rather than written down (**V5**):

```bash
deno task fight:statuses            # the register below
deno task fight:statuses --cases    # the counts behind each verdict
```

## What a length means, and what it does not

The length is **how long the bit has been continuously set**, counted in the **bearer's own turns**
— the turns they took and the turns they were granted and spent on nothing, because a turn nobody
spent still passed for whoever is carrying the status.

⚠️ **An episode is not one application.** A status reapplied before it wears off never clears the
bit, so the mask reads as one long spell. `Hildur Muza Śmierci` carries `swow_down` for 47 of her
own turns in `2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json` while the published skill
table states two for that family. Both are true and they are answers to different questions: the
table says how long one cast runs, and the mask says how long somebody has been under any of them.

**Nothing here says how long a status has left**, and the panel draws no such figure. The only
duration the game publishes is per skill **level** (`https://public-api.margonem.pl/we_get/skills/`,
read 2026-09-03, frozen at `frozen/skill-durations.ts`), and no payload states the level of anybody
but the reader. **ADR 0050.**

## The register

`episodes` counts every spell the corpus holds and `closed` the ones the game ended inside it;
`longest` is the most turns one ran for. `by skill` and `by key` count the episodes whose start
names **exactly one** caster, asked the two ways **ADR 0052** describes. `stated` is what the
published skill table says that family runs for, across every level.

| bit | status       | episodes | closed | longest | by skill | by key | stated    |
| --: | ------------ | -------: | -----: | ------: | -------: | -----: | --------- |
|   0 | `deep_wound` |        4 |      3 |      10 |        0 |      2 | —         |
|   1 | `wound`      |       39 |     36 |      17 |        0 |     16 | —         |
|   3 | `poisoned`   |       48 |     27 |      47 |       10 |      1 | —         |
|   4 | `fire`       |        5 |      2 |       2 |        2 |      0 | 2/3/4/5/8 |
|   5 | `swow_down`  |      130 |     66 |      52 |       33 |      3 | 2/8       |
|   6 | `speed_up`   |      223 |    114 |      22 |       70 |     11 | 2/8       |
|   8 | `shock`      |        7 |      7 |      20 |        1 |      0 | 2/8       |
|  10 | —            |        1 |      1 |       7 |        0 |      0 | —         |

Two bits the client words are absent from every recording — `critical_deep_wound` (2) and
`frostbite` (7) — so there is no row for them: a row with no episode behind it would be a claim
about material this repository does not have.

⚠️ **Bit 10 has no name and the client draws nothing for it.** Its loop stops at bit 8, and the mask
`1056` occurs 12 times in `2026-08-25-luvia-grupa-vs-draugr-none-none.json`. The panel draws it as
the bit it is rather than guessing what it means, which is **V6**: the disagreement between what the
game sends and what its own client reads is the finding.

## Who set it, and why nothing says so

Neither reading clears a bar worth drawing. The best is `speed_up` by skill, at 70 of 223 — and 34
of the rest name several. **ADR 0049** rejected an attribution measured at 84.6% with the sentence
this one is held to: wrong on one row in six is not a figure to draw.

The reason is in the material rather than in the reading. **When a bit turns on, no message
targeting the bearer says so.** Measured over `captures/` on 2026-09-03, the keys standing on those
messages are `tspell`, `skillId`, `+dmg`, `-dmg`, `+dmgd` and `+crit` — a blow, and nothing naming
what it left behind. A wound arrives as an ordinary hit; the bit is the client being told the
result, not the protocol reporting a cause.

So the panel names no caster, and says nothing about one. **ADR 0052.**
