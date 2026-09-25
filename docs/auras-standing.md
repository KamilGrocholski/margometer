# What stands on a side

What one skill put on more than one combatant, who cast it, and how far through it is.

**All of it is stated except the end.** The announcement names the skill (`skillId`) and its caster
(the actor slot, `develop ADR 0010`), and the published skill table states how many turns the effect
runs for. What the protocol never does is mention the effect again: there is no confirmation, no
refresh and no expiry anywhere in `captures/`. `develop ADR 0059` carries what follows from that.

**Read off the recordings, not written from memory.** `tests/tools/aura-standing.test.ts` composes
every row below through `tools/aura-standing.ts` and refuses a row naming a skill the corpus does
not cast, a skill no row names, or a figure the tree does not produce.

```bash
deno task fight:auras                 # the register below
deno task fight:auras captures/<one>  # the same over one recording
```

## On whom, and why the panel says nobody

**A cast is announced once, and never says who it landed on.** Every cast names exactly one end and
no cast enumerates bearers. `develop ADR 0061` carries that and the three measurements below it,
each with the material it was taken over on 2026-09-09 — the figures are that reading's and are not
restated here, because the corpus has grown since and nothing recomputes them. The register below
still reads the **side** a cast reaches — the published help states it key by key — because that is
what tells a shout from a whole-team cast. The window draws none of it (`develop ADR 0062`).

**The game's own statement answers `on whom`, and the tooltip is where it is drawn.** `w[].buffs`
says what each combatant is carrying right now, so a fighter's own tooltip states a row per status
they hold, counted in **their own** turns (`develop ADR 0107`). It names no caster, so it settles
nothing about who a cast reached; that is still refused, now on three readings rather than one
(`develop ADR 0104`). The window beside the panel draws none of this: what is true of one fighter is
said on that fighter (`develop ADR 0108`).

⚠️ **Listing the side's members would be wrong about one cast in seven**, which is what that reading
found after a `Podwójny dech`: the caster's whole side carries the matching status bit on most casts
and not all. `develop ADR 0049` rejected an attribution measured at 84.6% in the words that bind
here.

⚠️ **The target slot is not read**, except beside `shout`. On a cast reaching a side it names one
end that is not the bearer, and `develop ADR 0010` measured what reading it costs: eight of 115 name
a combatant other than the caster.

**`shout` names bearers, and the target slot is one of them.** The help's effect table settles it,
read 2026-09-22: the effect forces whoever carries it to pick the character who used the skill as
the target of their attacks, and it lands on the skill's own target and on randomly chosen
characters up to its count. So the provoked strike **whoever cast it** — there is no target the
caster's side is pointed at — and the announcement's target slot names one of the provoked, which is
why it resolves against the roster and agrees with the value (`develop ADR 0061`,
`develop ADR 0064`).

⚠️ **This paragraph said the opposite for a while, and the section below always said it right.**
Before `develop ADR 0064` the value was read as a target rather than as a list of bearers, and the
sentence survived the reading that replaced it — two statements of one mechanism, drifting without
looking different. What the value is remains _What a shout holds_'s to say, and this one points at
it rather than restating it.

⚠️ **`allslow_per` is the one key the register does not settle** — it lists it among the effects
changing attack speed and never says whose. Measured instead: after a `Szadź`, the combatant on the
**opposing** side carries `swow_down` in 77 casts of 77.

## What is drawn, and what is not

**A cast reaching a side is drawn nowhere.** The window beside the panel drew one row per skill and
the casters under it, each with `3 z 8 tur`, until `develop ADR 0108` took the section away: the
figure was counted in the **caster's** turns while the effect runs on each bearer's
(`develop ADR 0101`), and a cast has no bearer to count on that this reading may name
(`develop ADR 0061`). What the register below holds is unchanged — it is read from the recordings,
not from the panel.

**What a fighter is carrying is drawn on that fighter**, in the game's own tooltip: a row per
status, with the table's total beside it wherever one figure may be said of that bearer
(`develop ADR 0107`). That is the one surface where a length and the person it is about are the same
reading.

**Such a row states no length at all** (`develop ADR 0112`). The mask says a status stands and never
since when, and what renews one can be announced nowhere — a weapon's poison is — so a count beside
it would be a count of what this add-on happened to see.

**A shout is drawn under whoever threw it**, with the characters it holds as rows under that, and
**a length on each of those rows** — a shout runs on the turns of whoever it holds, so two
characters held by one cast are not the same number of turns in (`develop ADR 0103`). The okrzyk is
named beside the holder, because the table dates the two of them apart (`develop ADR 0097`).

⚠️ **A skill stating several team-wide effects is dated by the longest of them.**
`Wyzywający okrzyk` runs one for three turns and two for five, so the register says five — the skill
is not over while part of it is still standing.

⚠️ **Two kinds of cast reach no row at all.** One arriving under `tcustom` with no `skillId` is
joined to the table by nothing. And `poison_lowdmg_per-enemies` is the one team-wide key documented
`alone in its message`, so it decodes carrying no skill name and no id.

**No totals in prose.** How many casts the corpus holds changes with the next recording, so it is
measured rather than written down (**V5**).

## Whose turns a length is counted in

⚠️ **The panel counts on the caster and both sources say the bearer.** `src/core/aura-standing.ts`
takes the clock off `casterId`, so one cast leaves every row at one moment. The help dates a length
to whoever is carrying it, and the mask goes out per bearer. `develop ADR 0101` carries what
follows.

**One surface counts on the bearer already.** The line the add-on writes into the game's own tooltip
stands beside **one fighter**, so it dates a status by the cast reaching their side and counts it in
**their** turns — `src/core/carried-figure.ts`, off the turn count every cast now carries for
everybody as it stood. A cast the bearer has already outrun dates nothing there, and takes its
figure with it: a standing is dropped on the caster's turns, so one whose caster has stopped taking
them outlives its own length for everybody else.

⚠️ **The mask's own count is a different reading, and not a worse one.** It says how long the bit
has been lit for that bearer, which begins when a payload first restates them carrying it — turns
after the cast where they were not restated at the time — and it goes on burning through a re-cast,
because a second cast into a lit bit makes no 0→1 edge.

**So it can carry no denominator of its own**, and its own length is what shows that: the longest
the mask holds one bearer reaches **56** of their turns for `swow_down` and **23** for `speed_up`
(the `longest` column below, `captures/`, 2026-09-25), where the table gives the skills behind them
eight. That is no disagreement with the `own` column — that one counts what a **run** usually comes
to, and this is the longest one ever ran.

⚠️ **The mask is read as the add-on reads it** (`src/game/engine-warrior.ts`): a combatant who has
fallen carries nothing, because the client takes the icons down at that point. Read off the wire
instead, as `develop`'s tool read it, a run whose bearer fell holding it never goes out and so is
never counted: over `captures/` on 2026-09-25 that reading lit `poisoned` 21 times where the
add-on's lights it 38, and `swow_down` 46 where the add-on's lights it 71.

**The two numbers a reader saw for one effect are now one.** The window beside the panel drew a
cast's length on the caster's clock and, beside it, the mask's bare count on the bearer's — so
hovering a fighter and reading the window answered the same question twice, differently.
`develop ADR 0108` ended it by taking both sections away: the bearer's clock is the only one still
drawn, and the tooltip is where it is drawn.

**The published help states whose turns for ten of its keys, and six of them are ours.** Each row is
a clause counted in `frozen/help-phrases.ts` and cited by that key's entry in
`docs/protocol-keys.md`, so the reading is re-earned rather than remembered (article `view,372`,
read 2026-09-15).

| clause                                   | keys it stands under                                                                                       | whose turns   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------- |
| `wykonanych przez nich tur`              | `aura-ac_per`, `aura-resall`, `aura-sa_per`, `aura-adddmg2_per-meele`, `critval-allies`, `critmval-allies` | each bearer's |
| `od tur przeciwników`                    | `active_decblock_per-enemies`                                                                              | each bearer's |
| `tur ukończonych przez Postać rzucającą` | `active_decblock_per`                                                                                      | the caster's  |

⚠️ **The help does not state one rule, it states one per key.** The last row is the control: the
single-target spelling of the same effect is dated to the caster, and the side-wide one is not. So a
reading that gave every key the caster's clock was never the help's, and the six above are every
team-wide key the help dates at all. It dates none of the others, `shout` included.

**What the mask does, measured over `captures/`.** The status mask `develop ADR 0061` set aside —
`w[].buffs`, one integer per combatant in every payload, its bits named in `frozen/buff-bits.ts` —
is the only channel that says what somebody is carrying right now. `tools/aura-lifetime.ts` asks it
one question: where one moment lights a status on several combatants, do they all lose it together.

```bash
deno task fight:life                  # the register below
deno task fight:life --cases          # every lighting that reached more than one bearer
```

`lit` counts the lightings seen at all, `shared` the ones reaching more than one bearer, `together`
those whose bearers went out at one step and `apart` those who did not. `agreeing` counts the shared
lightings every bearer carried for the same count of **their own** turns, and `apart+agree` the ones
that did both. `own` is the length most runs came to, over `runs` of them, and `longest` the longest
one bearer carried it.

| status                | lit | shared | together | apart | agreeing | apart+agree | own | runs | longest |
| --------------------- | --: | -----: | -------: | ----: | -------: | ----------: | --: | ---: | ------: |
| `deep_wound`          |   7 |      0 |        0 |     0 |        0 |           0 |   9 |    2 |       9 |
| `wound`               |  43 |      0 |        0 |     0 |        0 |           0 |   3 |   16 |      17 |
| `critical_deep_wound` |   0 |      0 |        0 |     0 |        0 |           0 |   0 |    0 |       0 |
| `poisoned`            |  38 |      1 |        0 |     1 |        1 |           1 |   5 |    6 |      53 |
| `fire`                |  19 |      0 |        0 |     0 |        0 |           0 |   2 |   10 |       6 |
| `swow_down`           |  71 |     12 |        1 |    11 |        2 |           2 |   3 |   24 |      56 |
| `speed_up`            |  84 |     18 |        3 |    15 |        7 |           6 |   8 |   29 |      23 |
| `frostbite`           |   0 |      0 |        0 |     0 |        0 |           0 |   0 |    0 |       0 |
| `shock`               |  11 |      0 |        0 |     0 |        0 |           0 |   3 |    4 |      20 |

⚠️ **`apart+agree` is the column that settles it.** One moment lights several bearers, each carries
it for the same count of their own turns, and they go out at different moments. A clock on the
caster produces one going-out, so every row in that column is a row no such clock accounts for.

**`speed_up` lands on the published figure, on the bearer's clock.** `Podwójny dech` announces
`aura-sa_per` and the table dates it eight turns; eight is also the length most runs of that status
came to. The two agree, and they agree in the bearer's turns and not the caster's.

**A run cut short by a death never enters the lengths above.** The table closes a run when the bit
goes out, and a combatant who falls stops being restated at all — measured over `captures/` on
2026-09-22, the two witnessed bits end 43 runs that way against 233 that go out properly. Those 43
stay open and are counted nowhere, which is what keeps `own` a statement about the effect rather
than about who died holding it.

⚠️ **A refresh nobody saw reads as one long run.** A second cast landing while the bit is lit makes
no 0→1 edge, so the run that closes is the pair — which is why `own` is the length most runs came to
rather than a mean, and why the column above it carries lengths the table dates nothing for.

**Two bits have a published length that the register above never reaches.** The help states both at
article `view,372` (read 2026-09-22), under the weapon attributes rather than under an effect — and
trucizna under a skill effect as well, `poisonbon_poison-perw`, which the frozen skill table puts on
two skills (`develop ADR 0112` carries what that reading came to):

| status     | what the help calls it | stated                                                 |
| ---------- | ---------------------- | ------------------------------------------------------ |
| `poisoned` | `poison1, of_poison1`  | five turns of the bearer, extended by each further hit |
| `wound`    | `wound1, of_wound1`    | five turns, its own extension capped at the same five  |

⚠️ **`wound` is Głęboka rana and `deep_wound` is not.** `docs/protocol-keys.md`'s `wound` entry is
what joins that bit to the attribute the help dates; nothing joins `deep_wound`, so it is dated by
neither source and the table above leaves it out.

⚠️ **The refresh above is why `own` is the right column to read them against, and 38 is not.** The
help's own table marks trucizna as not overwritten: a further application only lengthens how long
the damage runs. So a bit held for far longer than five is a run of applications and never an effect
that outlived its length. A reader was shown `38 tur` beside a five-turn trucizna before
`develop ADR 0109` took the mask's count off the row, and `develop ADR 0112` took every count off
it.

⚠️ **`swow_down` does not land on a published figure, and the register already said so.**
`allslow_per` is the one key this document does not settle, and the mask does not name which cast
lit a bit (`develop ADR 0061`), so a slow from a skill the corpus never dates lands in the same
column.

⚠️ **No bit stands for a provocation**, so a shout's length is witnessed by nothing in this section.
It is witnessed all the same, by what the held character does rather than by what the mask says —
the register at the foot of this document carries that reading, and `develop ADR 0103` is what the
panel does with it. The help dates `shout` nowhere, and it no longer has to.

## How much it comes to

⚠️ **The window draws none of this yet.** It says what stands and for how long, and never a figure.
What follows is what the game does, written down so the reading is not taken twice.

**Almost every key carries its figure on the wire.** Measured over `captures/` 2026-09-11: every key
below states an amount on the announcement except `+spell-taken_dmg-all`, which states none on any
occurrence there is — the count is its `_Shape:_` line in `docs/protocol-keys.md`, re-earned on
every run. The client's own branch for it is `end-game-without-percent`, so the game shows no
percentage there either (`develop ADR 0063`).

**Three different units, and they are not interchangeable.** The help's effect dictionary gives each
one (article `view,372`, read 2026-09-03):

| the help's unit        | keys                                                                                                                           | how it reads                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| a part of what is held | `aura-ac_per`, `aura-sa_per`, `allslow_per`, `alllowdmg`, `aura-adddmg2_per-meele`, `lowheal_per-enemies`, `taken_dmg_per-all` | a share of what the character has                 |
| percentage points      | `aura-resall`, `active_decblock_per-enemies`                                                                                   | points added to a statistic                       |
| extra points           | `critval-allies`, `critmval-allies`                                                                                            | points of critical force, not a percentage at all |

**A standing effect caps at two sources, and they are the two highest.** Eight of the keys carry the
same sentence, that the effect stacks from at most two sources belonging to different characters,
and `taken_dmg_per-all` states it sharper: the two **highest** such sources. So two sources **add**,
and a third is dropped: three `Szadź` at 14, 14 and 12 come to 28, not 40 and not 14.

⚠️ **A source is a combatant, not a cast.** The help counts sources from different characters, so
two casts by one character are one source — which is what the window already does by refreshing
rather than adding a row.

⚠️ **Two keys carry no such sentence at all** — `active_decblock_per-enemies` and
`lowheal_per-enemies`. That is a gap in the source, not a licence to add without end.

**Different keys on one statistic add.** The help names each set where it names any. Attack speed is
the one that matters here, and it is worth reading twice:

The help adds attack speed up with `critsa_per`, `sa_per`, `sa2_per`, `aura-sa_per`,
`adrenalin_sa_per`, `allslow_per`, `critslow_per` and `lightshield_per`.

`sa_per` and `sa2_per` are **pasywny** in the same dictionary — bonuses off items. So a skill's aura
and an item's bonus land in one figure, `Szadź` subtracts from the same running total as
`Podwójny dech` adds to, and **the panel can only ever know the part the announcements carried**.
Block has its own set: `blok_per`, `decblock_per`, `active_block_per`, `active_decblock_per`.

⚠️ **The caster of `aura-sa_per` gets half.** The help gives the character who cast it half the
speed-up everybody else gets. So one cast is not one figure for the whole team.

⚠️ **The payload's own `ac` is not the answer.** Every combatant states an `ac` each payload, and it
would be a better figure than a sum of shares — but measured over
`captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json` on 2026-09-09 it only ever
falls, in steps, on the two combatants that move at all. That is armour destruction, and it agrees
with the help: `aura-ac_per` is computed at the damage layer off the armour before reduction, and
its added points cannot be destroyed. The aura is not in the stated number.

## How many sources stand together

`two` counts the moments where exactly two combatants held one key at once, `past two` the moments
where three or more did — which is where the cap costs a figure — and `one twice` the moments where
one combatant held it twice. `at once` is the most that ever stood together.

| key                           | two | past two | one twice | at once |
| ----------------------------- | --: | -------: | --------: | ------: |
| `+spell-taken_dmg-all`        | 177 |        0 |         0 |       2 |
| `active_decblock_per-enemies` |   3 |        0 |         0 |       2 |
| `alllowdmg`                   |   3 |        0 |         0 |       2 |
| `allslow_per`                 | 558 |       94 |         0 |       3 |
| `aura-ac_per`                 | 115 |        0 |         0 |       2 |
| `aura-resall`                 | 115 |        0 |         0 |       2 |
| `aura-sa_per`                 | 370 |       98 |         0 |       4 |
| `shout`                       |  15 |        0 |         0 |       2 |

The last three arrived with `develop ADR 0097`: an okrzyk stands on a side now, so the keys it
announces are counted here like any other. `shout` is in the table because it rides a cast that
stands, and its own row below is what says whom it holds.

**The cap is reachable on the material this repository holds**, which is unusual for anything in
this document: `Szadź` and `Podwójny dech` both stand past two sources, so a panel that summed every
cast would draw a figure the game does not have. `captures/2026-08-12-tempest-grupa-vs-draugr-1-…`
holds the plainest one — three `Szadź` at 14, 14 and 12.

⚠️ **No key was ever held twice by one combatant**, so the clause about sources from different
characters has cost nothing so far. It is shape rather than measurement until a recording
contradicts it.

## The register

`on` counts the combatants ever seen carrying it; `fights` the recordings it stands in at all.
`at once` is the most standing at one moment, which is the rows the window would draw under that
heading. `stated` is what the published table gives it, and what a row leaves on.

`reaches` is **which side**, stated relative to the caster and never who on it: `caster's`, `other`,
`both` where one announcement does the two of them, and `—` where nothing settles it. **The window
draws none of it**: a cast reaching a whole side says nothing about whom, because there is nothing
to say (`develop ADR 0062`). The column is here so the claim stays re-earnable.

**The two okrzyki are in this table as well as in the one below**, because the published table dates
their two halves apart and each half is a thing that stands: `Wyzywający okrzyk` shouts for three
turns and debuffs the other side for five. Its `stated` here is the side-wide half's and never the
shout's, which is the register below's. `develop ADR 0097`, and the two rows are what holds the
claim — were the okrzyki one shape, skill 25 would read five here rather than two.

⚠️ **Both `reaches` verdicts moved on 2026-09-22, and the shout is why.**
`src/core/aura-standing.ts` had `shout` reaching the **caster's** side, which is backwards: the
help's effect table forces the affected to attack the character who used the skill, and over
`captures/` **168 of 168 characters named across 166 announcements stand opposite the caster**, none
on their own side. So `Prowokujący okrzyk` reaches both — it provokes the other side and raises its
own — and `Wyzywający okrzyk` reaches only the other, its `both` having come from nothing but that
entry.

|  id | skill              | on | fights | at once | stated | reaches  |
| --: | ------------------ | -: | -----: | ------: | -----: | -------- |
|  25 | Prowokujący okrzyk |  4 |      6 |       1 |      2 | both     |
|  76 | Aura ochrony       | 13 |     16 |       2 |      8 | caster's |
|  89 | Podwójny dech      | 19 |     19 |       4 |      8 | caster's |
| 123 | Szadź              | 22 |     23 |       3 |      8 | other    |
| 188 | Wyzywający okrzyk  | 10 |     17 |       2 |      5 | other    |
| 219 | Jadowity podmuch   |  1 |      1 |       1 |      8 | other    |
| 264 | Piętno bestii      | 14 |     17 |       2 |      8 | other    |

**The published table dates more skills than the corpus has ever cast**, and the ones missing here
are missing for want of a recording rather than by a verdict: the guard holds the register to what
`captures/` actually carries, and to nothing else.

## What a shout holds

**A shout is one state per character, and the last one wins.** The published help gives it as
forcing the affected to attack whoever cast it, so a character forced at two people at once is not a
state the game has: a later shout replaces whatever held them, from any caster and either skill.
`develop ADR 0062` carries the rule and names its source.

**Its table value is a count of characters, where every other key here states a share.** Both skills
publish `shout=6@3,7@3,7@3,8@3,8@3,9@3,9@3,10@3,10@3,10@3` — six characters at skill level 1 rising
to ten at level 10 — and the table's own comment beside skill 25 calls the figure the number of
random opponents the shout forces to attack its caster (read 2026-09-08). The protocol carries no
skill level, so `covers` below is the **fewest** stated, which is what holds whatever the caster's
level is.

**The value names every provoked character**, separated by a comma and a space — the grammar
`winner` and `loser` use, and `docs/protocol-keys.md` has it at `winner`. So the panel reads them
rather than inferring them from the count: `captures/2026-09-09-tempest-duet-vs-wojownik-…` carries
`shout=Gracz 3, Gracz 2`, both of the opposing side, on a skill the earlier reading would have
expanded to the same two by arithmetic and would have got wrong the moment a side ran past the
count. `develop ADR 0064`, superseding `develop ADR 0063` in part.

⚠️ **The shout is dated by its own row and never by the skill's longest.** `Wyzywający okrzyk` runs
`alllowdmg` and `active_decblock_per-enemies` for five turns and `shout` for three; dated as an aura
it held a character two turns after the game had let them go.

⚠️ **One recording is a fight between players, and every other is N against one.** So `at once` and
`names` are 2 for `Wyzywający okrzyk` and 1 for everything else: the corpus shows a shout naming
more than one exactly once, and shows it at two.

`casters` counts the combatants ever seen holding somebody with it; `fights` the recordings it holds
in; `at once` the most characters it held at one moment; `stated` what the published table gives the
shout itself; `covers` the fewest characters the table says it reaches; `names` the most one
announcement of it was ever seen to list.

|  id | skill              | casters | fights | at once | stated | covers | names |
| --: | ------------------ | ------: | -----: | ------: | -----: | -----: | ----: |
|  25 | Prowokujący okrzyk |       3 |      5 |       1 |      3 |      6 |     1 |
| 188 | Wyzywający okrzyk  |       8 |     14 |       2 |      3 |      6 |     2 |

## How long a shout holds somebody

**Something does witness a shout's end, and it is what the held character does.** The protocol never
mentions the cast again, so `develop ADR 0059` filed the length as unwitnessed; what it did not look
at is whom the provoked then strike. `tools/shout-holding.ts` walks every recording for it, and
`develop ADR 0103` is what the panel does with the answer.

```bash
deno task fight:shout                 # the register below
deno task fight:shout captures/<one>  # the same over one recording
```

`turn` is how many of the **held character's own** turns had opened when the blow was struck; an
episode stops at the next shout of any kind, because a later one replaces whatever held them
(`develop ADR 0062`). `share` is what went at whoever shouted.

| turn | at the shouter | elsewhere | share |
| ---: | -------------: | --------: | ----: |
|    1 |             75 |         0 |  100% |
|    2 |             61 |         0 |  100% |
|    3 |             49 |         2 |   96% |
|    4 |             29 |         4 |   88% |
|    5 |             20 |         6 |   77% |
|    6 |              7 |         5 |   58% |
|    7 |              4 |         2 |   67% |
|    8 |              4 |         5 |   44% |

⚠️ **The baseline is what those three rows have to beat, and it is high.** The same characters,
before the shout named them, already sent 79% of their blows at whoever would shout — most
recordings are a group against one, so there is not much else to hit. The first three turns stand at
185 of 187 against that, and the fourth onwards falls **through** it (`captures/`, 2026-09-25).

**The edge sits exactly where the published table puts it.** The table gives a shout three turns,
and three of the held character's own turns is where the share stops being total. On the caster's
turns the same blows show no edge at all — which is the same finding as the auras', on a different
witness.

⚠️ **The tail is thin and is not the claim.** Six turns in, an episode has usually ended or been
replaced, so what those rows report is a handful of blows. What the register stands on is the first
four rows and the baseline under them.

⚠️ **`covers` is reported and drawn nowhere.** It was the input to the expansion `develop ADR 0064`
removed; it stays here because it is a true reading of the published table and
`tests/tools/skill-table.test.ts` holds how it is read.
