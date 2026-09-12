# 0078. A granted blow is still its announcement's

- **Status:** Accepted
- **Date:** 2026-09-12

## Context

The protocol never puts a skill on a blow. An announcement is its own message — `tspell`, usually
`skillId`, sometimes `tcustom` — and the blow is the message after it: measured over all 31
recordings on 2026-09-12, **not one of the 4,119 blow messages carries any of the three**. So
`decodeFightMessages` glued an announcement to the message straight after it and no further, and a
blow reaching this decoder with no announcement was charged to nobody. The panel closes those into
one row, `Zwykły cios`, holding **1,788 blows and 2,262,826 of the 6,427,129 applied points**.

A skill that strikes twice sends two blow messages, and the second fell out. Walking the runs of
consecutive blow messages by one combatant, uninterrupted by an announcement:

| length | after an announcement | after none |
| ------ | --------------------- | ---------- |
| 1      | 2,123                 | 1,557      |
| 2      | **208**               | 10         |
| 3      | 0                     | 1          |

All 208 are three skills: `Podwójne trafienie` 149, `Podwójny strzał` 56, `Struna płomienna` 3. This
is the sin **ADR 0055** named from the other side — the panel saying the game had announced nothing
about a blow the game had announced.

**The published table says which skills those are, and the tree has been inferring it from shape for
two decisions already.** `composeTurnStanding`'s `isExtra` branch exists because a skill can strike
twice (**ADR 0048**, **ADR 0057**); it reads the shape of the payload because nothing named the
effect. The effect has a name: `add_attacks`, stated by **three** of the two hundred and twenty-six
skills the table at `https://public-api.margonem.pl/we_get/skills/` serves — ids 97 and 239 at one,
id 283 at two, fetched 2026-09-09. `tools/skill-table.ts` was reading the key and throwing the
figure away: it took a value only where a duration stood beside it, and this key is written with no
`@` anywhere.

**The table cannot answer for every announcement, and where it cannot, this program already
contradicted itself.** The published table is keyed by `skillId` and holds a **player's** skills.
371 of the 3,500 announcements carry `tspell` without an id — **364 of them an NPC's** — and a boss
skill is never in it. Three blows sat there: the second strikes of `Struna płomienna`, Hildur's, in
2 of the 168 sections that draw the closing row. And `getTurnOpener` returns `null` for all three,
because `standing.strikingId === event.actorId` — _the same combatant, still striking_ — while the
skills reading called them nobody's. `docs/reading-a-turn.md` counted **1,580** turns opened by a
blow; the closing row held **1,583**. The same three messages, two readings of this program, two
answers.

The discriminator is the **missing id**, not a missing row: every id any announcement carried over
`captures/` is one the table carries — 0 exceptions of 3,129, 2026-09-12 — so no id means exactly
"the table has no way to speak", and nothing else does.

## Decision

**An announcement reaches the message after it, as it always has, and one blow message of its own
announcer further for each attack the published table grants that skill beyond its own.** The count
is the **fewest** the table states at any level, for the reason a shout's coverage is: the caster's
level is not known. A message that is not that combatant's blow ends the standing, and so does a new
announcement.

**Where the announcement names no id, the table cannot be asked, and the reach is the announcer's
own run of blows to a stated bound.** Where it names one, the table's count binds and nothing else
does — an id it grants nothing for reaches one message, which is bit for bit the rule that stood
before this, and `tests/core/fight-decoder.test.ts` re-earns that on every run.

⚠️ **Past the message the client itself glues it to, a standing reaches a blow and nothing else.**
The glued message may be anything, because that is where a skill states what it did; every message
after it is reached only for striking. Without that test a reach the table could not bound outlives
its own blows and lands on whatever the announcer does next: while this was being written, a poison
tick on the Draugr in `2026-08-12-tempest-grupa-vs-draugr-2` picked up `Kosa zastępcy`. No figure
read it — the amount is a loss, and only the restoring branch asks what announced it — so nothing on
screen would have moved, and a heal standing there would have been credited to the skill.

**The count is a frozen reading, derived at freeze time, as ADR 0058 decided for the first one.**
`frozen/blows-granted.ts` holds three ids and three numbers; `core` imports no frozen reading, so
whoever holds it hands it to `decodeFightMessages`.

## Consequences

**208 blows and 147,082 applied points leave `Zwykły cios`** for the skill that struck them — the
table reaching `Podwójne trafienie` 149 blows and 100,183 points and `Podwójny strzał` 56 and
36,089, the bound reaching `Struna płomienna` 3 and 10,810. The closing row holds **1,580 blows and
2,115,744 points** after it, which is `docs/reading-a-turn.md`'s count of turns a blow opened, to
the blow. The share of all applied damage standing under an announcement rises from 78.8% to 80.1% —
8,540,008 of 10,655,752. **Six combatants across six recordings lose that row entirely**, every blow
they struck now being announced; `deno task panel:drill --cases` moves seven cells and no verdict.

**And the row becomes a measured claim rather than a likely one**, which is worth more than the
figures. Every blow it holds opened a turn of its own, so this program's two readings of the same
message — whose action it was, and whose skill it was — now answer alike, and
`tests/core/granted-blow-rule.test.ts` re-earns that over `captures/` on every run. A recording that
breaks it reddens instead of quietly filling the row with somebody's skill.

**No turn changes hands, and that is measured rather than argued.** `getTurnOpener` suppressed the
second blow through `isExtra`, which needs `standing.strikingId` to have survived the first — and it
did, because **no first blow of the 208 pairs produces any event after its own attack**. After this
it is suppressed through `event.announced !== null` instead. Every table in `docs/turns-taken.md`
and `docs/reading-a-turn.md` regenerates identical, and the grading against the game's own numbering
stands where it stood: 1,111 of 1,114 exact, none counted over.

Nothing but `AttackEvent.announced` moves, for the same reason: **no second blow of the 208 carries
a healing key, a figure stated against a name, or a share restored to a side.**
`tests/core/granted-blow-rule.test.ts` re-earns both facts over `captures/`, so a recording that
breaks either reddens before a figure standing on it does.

Hard: `decodeFightMessages` and `addPayloadToFight` gain a required parameter at some 190 call
sites, and a reading fetched from a web page now decides an attribution the panel prints —
`deno task game:readings status` (**W10**) is what says it went behind.

⚠️ **The cost, named: a boss strikes twice with nothing announced, and the corpus proves it.**
Eleven runs of a combatant's own consecutive blows are opened by no announcement at all — ten of two
and one of three — and five of them are an NPC's. In `2026-08-15-tempest-grupa-vs-hildur-1` the
**same** combatant strikes two unannounced runs of two and one this rule now reaches, and the three
are indistinguishable except for what stands in front of them. So a second blow after a boss's
announcement _could_ be an independent plain attack, and this rule charges it to the skill anyway.
What is bought is that the two readings agree; what is paid is that the agreement is by rule where
the table is silent, and by evidence only where it speaks.

⚠️ **And the claim is a property of this corpus, not a theorem.** A blow past what the table granted
would still stand mid-strike under no announcement. No recording carries one — 0 runs of three after
an announcement — so `tests/core/fight-decoder.test.ts` writes that case out by hand rather than
leaving it unsaid.

## Alternatives

**Keep the standing across any consecutive same-actor blow run, table or no table.** The rule that
needs no reading at all. Rejected, and the line is worth drawing precisely, because the rule above
is the same shape wherever the table is silent: 10 runs of two and one of three in the corpus are
opened by **no announcement at all**, so consecutive blows by one combatant happen without a skill.
The difference is what it costs to be wrong. Where the table speaks, it is not adjacency deciding
anything — the count is read off a dated page. Where it cannot be asked, adjacency is all there is,
and it reaches **3 blows** rather than 208. A rule that dropped the table entirely would take the
reading of 205 blows off the page and put it on the shape of a payload, which is the trade this
decision is refusing.

**Leave the three, and keep the two readings disagreeing.** What this decision first did: state the
gap and change nothing. Rejected once the disagreement was named — one program answering two ways
about three messages is a finding, and it makes `Zwykły cios` a probability rather than a claim.

**Read the NPC's own skill table.** There is none published. The page at
`https://public-api.margonem.pl/we_get/skills/` serves a player's 226, and a boss's skills are in no
document this repository can cite.

**Decide the way the game's own client does.** Rejected as authority, and recorded as evidence only:
`BattleEffectsController.getArrayToCheckBlock` glues `allM[i] + ',' + allM[i+1]`, and
`checkNormalSkillIsOverrideBySpecificSkillEffect` joins the whole payload and scans every `skillId=`
in it with no actor bound to any of them — development build `1781609507010`. Both pick a graphic
rather than a figure, so neither settles anything about attribution; what they do settle is that the
client has no better source than this one, and one worse heuristic.

**Narrow `composeTurnStanding`'s `isExtra` to the table as well**, so one rule answers both
questions. Rejected: those same runs would begin opening turns, and the turn count is graded against
the game's own numbering (**ADR 0057**). What ends a turn and what names a skill are not the same
question.

**Re-attribute in `fight-statistics.ts`.** Rejected: `docs/reading-a-turn.md` gives the gluing to
the decoder and `src/core/charged-skill.ts` reads `event.announced` already. Two places deciding
what announced a blow is one rule with two copies.

**Add the counts to `frozen/aura-turns.ts`.** Rejected: that file's subject is what reaches more
than one combatant, and a granted blow reaches one.

**Carry every effect's value in `frozen/skill-durations.ts` and derive from there.** Rejected: **ADR
0058** decided keys and turns, and this would grow the larger file to read three numbers.

**Give the new parameter a default.** Rejected: every guard measuring the corpus would go on
measuring the old rule and stay green — the failure **W4** and **W8** exist to catch.
