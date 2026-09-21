# What stands on a side

What one skill put on more than one combatant, who cast it, and how far through it is.

**All of it is stated except the end.** The announcement names the skill (`skillId`) and its caster
(the actor slot, **ADR 0010**), and the published skill table states how many turns the effect runs
for. What the protocol never does is mention the effect again: there is no confirmation, no refresh
and no expiry anywhere in `captures/`. **ADR 0059** carries what follows from that.

**Read off the recordings, not written from memory.** `tests/tools/aura-standing.test.ts` composes
every row below through `tools/aura-standing.ts` and refuses a row naming a skill the corpus does
not cast, a skill no row names, or a figure the tree does not produce.

```bash
deno task fight:auras                 # the register below
deno task fight:auras captures/<one>  # the same over one recording
```

## On whom, and why the panel says nobody

**A cast is announced once, and never says who it landed on.** Every cast names exactly one end and
no cast enumerates bearers. **ADR 0061** carries that and the three measurements below it, each with
the material it was taken over on 2026-09-09 — the figures are that reading's and are not restated
here, because the corpus has grown since and nothing recomputes them. The register below still reads
the **side** a cast reaches — the published help states it key by key — because that is what tells a
shout from a whole-team cast. The window draws none of it (**ADR 0062**).

⚠️ **Listing the side's members would be wrong about one cast in seven**, which is what that reading
found after a `Podwójny dech`: the caster's whole side carries the matching status bit on most casts
and not all. **ADR 0049** rejected an attribution measured at 84.6% in the words that bind here.

⚠️ **The target slot is not read**, except beside `shout`. On a cast reaching a side it names one
end that is not the bearer, and **ADR 0010** measured what reading it costs: eight of 115 name a
combatant other than the caster.

**`shout` names a target, not a bearer.** The published help gives it as _forcing covered characters
to attack a chosen target_, so the character it names is who the caster's own side is pointed at,
and it is the one cast the target slot is read beside. It resolves against the roster and agrees
with that slot in every occurrence that reading covered (**ADR 0061**).

⚠️ **`allslow_per` is the one key the register does not settle** — it lists it among the effects
changing attack speed and never says whose. Measured instead: after a `Szadź`, the combatant on the
**opposing** side carries `swow_down` in 77 casts of 77.

## What is drawn, and what is not

The window draws **what has passed of what the table states** — `3 z 8 tur` — and never a countdown.
The first half is counted in the **caster's** own turns, the second is the game's own published
figure. The subtraction is the reader's, and it is theirs because the protocol never says the effect
ended.

⚠️ **The two halves are counted on two different clocks, and the section below is why.** The
published figure is the bearer's, the counted one is the caster's, and a fraction joining them is a
claim neither source makes. The window is unchanged until that is decided — **ADR 0101**.

**A shout is drawn under whoever threw it**, with the characters it holds as rows under that, and
its turns stated once — they are the cast's, not each held character's. Which of the two okrzyki it
was is drawn nowhere: both run three turns and cover six, so the name distinguished nothing a reader
could act on. **ADR 0067.**

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
to whoever is carrying it, and the mask goes out per bearer. **ADR 0101** carries what follows.

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

**What the mask does, measured over `captures/`.** The status mask **ADR 0061** set aside —
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
that did both. `own` is the length most runs came to, over `runs` of them.

| status                | lit | shared | together | apart | agreeing | apart+agree | own | runs |
| --------------------- | --: | -----: | -------: | ----: | -------: | ----------: | --: | ---: |
| `deep_wound`          |   6 |      0 |        0 |     0 |        0 |           0 |   9 |    2 |
| `wound`               |  40 |      0 |        0 |     0 |        0 |           0 |   3 |   15 |
| `critical_deep_wound` |   0 |      0 |        0 |     0 |        0 |           0 |   0 |    0 |
| `poisoned`            |  21 |      1 |        0 |     1 |        1 |           1 |   5 |    5 |
| `fire`                |  17 |      0 |        0 |     0 |        0 |           0 |   2 |    9 |
| `swow_down`           |  46 |      9 |        1 |     8 |        3 |           2 |   3 |   23 |
| `speed_up`            |  80 |     18 |        3 |    15 |        7 |           6 |   8 |   28 |
| `frostbite`           |   0 |      0 |        0 |     0 |        0 |           0 |   0 |    0 |
| `shock`               |  10 |      0 |        0 |     0 |        0 |           0 |   3 |    4 |

⚠️ **`apart+agree` is the column that settles it.** One moment lights several bearers, each carries
it for the same count of their own turns, and they go out at different moments. A clock on the
caster produces one going-out, so every row in that column is a row no such clock accounts for.

**`speed_up` lands on the published figure, on the bearer's clock.** `Podwójny dech` announces
`aura-sa_per` and the table dates it eight turns; eight is also the length most runs of that status
came to. The two agree, and they agree in the bearer's turns and not the caster's.

⚠️ **A refresh nobody saw reads as one long run.** A second cast landing while the bit is lit makes
no 0→1 edge, so the run that closes is the pair — which is why `own` is the length most runs came to
rather than a mean, and why the column above it carries lengths the table dates nothing for.

⚠️ **`swow_down` does not land on a published figure, and the register already said so.**
`allslow_per` is the one key this document does not settle, and the mask does not name which cast
lit a bit (**ADR 0061**), so a slow from a skill the corpus never dates lands in the same column.

⚠️ **No bit stands for a provocation.** The frozen table names nine statuses and a shout is none of
them, so what holds a shouted character for three turns is witnessed by nothing here. The claim that
a shout runs on the shouted character's turns is neither carried nor refused by this material, and
the help dates `shout` nowhere. It stays open, which is a different thing from being answered.

## How much it comes to

⚠️ **The window draws none of this yet.** It says what stands and for how long, and never a figure.
What follows is what the game does, written down so the reading is not taken twice.

**Almost every key carries its figure on the wire.** Measured over `captures/` 2026-09-11: every key
below states an amount on the announcement except `+spell-taken_dmg-all`, which states none on any
occurrence there is — the count is its `_Shape:_` line in `docs/protocol-keys.md`, re-earned on
every run. The client's own branch for it is `end-game-without-percent`, so the game shows no
percentage there either (**ADR 0063**).

**Three different units, and they are not interchangeable.** The help's effect dictionary gives each
one (article `view,372`, read 2026-09-03):

| what the help says            | keys                                                                                                                           | how it reads                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| _część posiadanej wartości_   | `aura-ac_per`, `aura-sa_per`, `allslow_per`, `alllowdmg`, `aura-adddmg2_per-meele`, `lowheal_per-enemies`, `taken_dmg_per-all` | a share of what the character has                 |
| _liczba punktów procentowych_ | `aura-resall`, `active_decblock_per-enemies`                                                                                   | points added to a statistic                       |
| _liczba dodatkowych punktów_  | `critval-allies`, `critmval-allies`                                                                                            | points of critical force, not a percentage at all |

**A standing effect caps at two sources, and they are the two highest.** Eight of the keys carry the
same sentence — _Efekt ulega kumulacji do maksymalnie dwóch źródeł od różnych Graczy_ — and
`taken_dmg_per-all` states it sharper: _Efekt kumuluje się do dwóch najwyższych źródeł od różnych
Graczy_. So two sources **add**, and a third is dropped: three `Szadź` at 14, 14 and 12 come to 28,
not 40 and not 14.

⚠️ **A source is a combatant, not a cast.** The help counts sources _od różnych Graczy_, so two
casts by one character are one source — which is what the window already does by refreshing rather
than adding a row.

⚠️ **Two keys carry no such sentence at all** — `active_decblock_per-enemies` and
`lowheal_per-enemies`. That is a gap in the source, not a licence to add without end.

**Different keys on one statistic add.** The help names each set where it names any. Attack speed is
the one that matters here, and it is worth reading twice:

> Przyspieszenie łączy się w sposób addytywny z efektami `critsa_per`, `sa_per`, `sa2_per`,
> `aura-sa_per`, `adrenalin_sa_per`, `allslow_per`, `critslow_per`, `lightshield_per`.

`sa_per` and `sa2_per` are **pasywny** in the same dictionary — bonuses off items. So a skill's aura
and an item's bonus land in one figure, `Szadź` subtracts from the same running total as
`Podwójny dech` adds to, and **the panel can only ever know the part the announcements carried**.
Block has its own set: `blok_per`, `decblock_per`, `active_block_per`, `active_decblock_per`.

⚠️ **The caster of `aura-sa_per` gets half.** _Na Postać rzucającą efekt, wartość przyspieszenia
jest o połowę niższa._ So one cast is not one figure for the whole team.

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

The last three arrived with **ADR 0097**: an okrzyk stands on a side now, so the keys it announces
are counted here like any other. `shout` is in the table because it rides a cast that stands, and
its own row below is what says whom it holds.

**The cap is reachable on the material this repository holds**, which is unusual for anything in
this document: `Szadź` and `Podwójny dech` both stand past two sources, so a panel that summed every
cast would draw a figure the game does not have. `captures/2026-08-12-tempest-grupa-vs-draugr-1-…`
holds the plainest one — three `Szadź` at 14, 14 and 12.

⚠️ **No key was ever held twice by one combatant**, so the _od różnych Graczy_ clause has cost
nothing so far. It is shape rather than measurement until a recording contradicts it.

## The register

`on` counts the combatants ever seen carrying it; `fights` the recordings it stands in at all.
`at once` is the most standing at one moment, which is the rows the window would draw under that
heading. `stated` is what the published table gives it, and what a row leaves on.

`reaches` is **which side**, stated relative to the caster and never who on it: `caster's`, `other`,
`both` where one announcement does the two of them, and `—` where nothing settles it. **The window
draws none of it**: a cast reaching a whole side says nothing about whom, because there is nothing
to say (**ADR 0062**). The column is here so the claim stays re-earnable.

**The two okrzyki are in this table as well as in the one below**, because the published table dates
their two halves apart and each half is a thing that stands: `Wyzywający okrzyk` shouts for three
turns and debuffs the other side for five. Its `stated` here is the side-wide half's and never the
shout's, which is the register below's. **ADR 0097**, and the two rows are what holds the claim —
were the okrzyki one shape, skill 25 would read `other` and five here rather than `caster's` and
two.

|  id | skill              | on | fights | at once | stated | reaches  |
| --: | ------------------ | -: | -----: | ------: | -----: | -------- |
|  25 | Prowokujący okrzyk |  4 |      6 |       1 |      2 | caster's |
|  76 | Aura ochrony       | 13 |     16 |       2 |      8 | caster's |
|  89 | Podwójny dech      | 19 |     19 |       4 |      8 | caster's |
| 123 | Szadź              | 22 |     23 |       3 |      8 | other    |
| 188 | Wyzywający okrzyk  | 10 |     17 |       2 |      5 | both     |
| 219 | Jadowity podmuch   |  1 |      1 |       1 |      8 | other    |
| 264 | Piętno bestii      | 14 |     17 |       2 |      8 | other    |

**The published table dates more skills than the corpus has ever cast**, and the ones missing here
are missing for want of a recording rather than by a verdict. That is the thin corpus `TODO.md`
opens with; the guard holds the register to what `captures/` actually carries, and to nothing else.

## What a shout holds

**A shout is one state per character, and the last one wins.** The published help gives it as
forcing the affected to attack whoever cast it, so a character forced at two people at once is not a
state the game has: a later shout replaces whatever held them, from any caster and either skill.
**ADR 0062** carries the rule and names its source.

**Its table value is a count of characters, where every other key here states a share.** Both skills
publish `shout=6@3,7@3,7@3,8@3,8@3,9@3,9@3,10@3,10@3,10@3` — six characters at skill level 1 rising
to ten at level 10 — and the table carries the game's own comment beside skill 25:
`# shout to ilość przeciwników (randomowych) których zmusza się do ataku na siebie` (read
2026-09-08). The protocol carries no skill level, so `covers` below is the **fewest** stated, which
is what holds whatever the caster's level is.

**The value names every provoked character**, separated by a comma and a space — the grammar
`winner` and `loser` use, and `docs/protocol-keys.md` has it at `winner`. So the panel reads them
rather than inferring them from the count: `captures/2026-09-09-tempest-duet-vs-wojownik-…` carries
`shout=Gracz 3, Gracz 2`, both of the opposing side, on a skill the earlier reading would have
expanded to the same two by arithmetic and would have got wrong the moment a side ran past the
count. **ADR 0064**, superseding **ADR 0063** in part.

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
|  25 | Prowokujący okrzyk |       4 |      6 |       1 |      3 |      6 |     1 |
| 188 | Wyzywający okrzyk  |      10 |     17 |       2 |      3 |      6 |     2 |

⚠️ **`covers` is reported and drawn nowhere.** It was the input to the expansion **ADR 0064**
removed; it stays here because it is a true reading of the published table and
`tests/tools/skill-table.test.ts` re-earns it off a transcript.
