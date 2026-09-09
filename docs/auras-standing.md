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

**A cast is announced once, and never says who it landed on.** Measured over `captures/` on
2026-09-09: every cast names exactly one end, and no cast enumerates bearers. The register below
still reads the **side** a cast reaches — the published help states it key by key — because that is
what tells a shout from a whole-team cast. The window draws none of it (**ADR 0062**).

⚠️ **Listing the side's members would be wrong about one cast in seven.** After a `Podwójny dech`,
the caster's whole side carries the matching status bit in 56 of 65 casts. **ADR 0049** rejected an
attribution measured at 84.6% in the words that bind here.

⚠️ **The target slot is not read**, except beside `shout`. On a cast reaching a side it names one
end that is not the bearer, and **ADR 0010** measured what reading it costs: eight of 115 name a
combatant other than the caster.

**`shout` names a target, not a bearer.** The published help gives it as _forcing covered characters
to attack a chosen target_, so the character it names is who the caster's own side is pointed at,
and it is the one cast the target slot is read beside. It resolves against the roster and agrees
with that slot in **158 of 158** occurrences.

⚠️ **`allslow_per` is the one key the register does not settle** — it lists it among the effects
changing attack speed and never says whose. Measured instead: after a `Szadź`, the combatant on the
**opposing** side carries `swow_down` in 77 casts of 77.

## What is drawn, and what is not

The window draws **what has passed of what the table states** — `3 z 8 tur` — and never a countdown.
Both halves are honest on their own: the first is counted in the caster's own turns, the second is
the game's own published figure. The subtraction is the reader's, and it is theirs because the
protocol never says the effect ended.

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

## How much it comes to

⚠️ **The window draws none of this yet.** It says what stands and for how long, and never a figure.
What follows is what the game does, written down so the reading is not taken twice.

**Almost every key carries its figure on the wire.** Measured over `captures/` 2026-09-09: every key
below states an amount on the announcement except `+spell-taken_dmg-all`, which states none in 59
casts of 59 — and the client's own branch for it is `end-game-without-percent`, so the game shows no
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

| key                    | two | past two | one twice | at once |
| ---------------------- | --: | -------: | --------: | ------: |
| `+spell-taken_dmg-all` | 145 |        0 |         0 |       2 |
| `allslow_per`          | 449 |       64 |         0 |       3 |
| `aura-ac_per`          | 115 |        0 |         0 |       2 |
| `aura-resall`          | 115 |        0 |         0 |       2 |
| `aura-sa_per`          | 208 |       44 |         0 |       4 |

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
and `—` where nothing settles it. **The window draws none of it**: a cast reaching a whole side says
nothing about whom, because there is nothing to say (**ADR 0062**). The column is here so the claim
stays re-earnable.

The two okrzyki are not in this table. They hold characters rather than standing on a side, and have
a register of their own below.

|  id | skill            | on | fights | at once | stated | reaches  |
| --: | ---------------- | -: | -----: | ------: | -----: | -------- |
|  76 | Aura ochrony     |  9 |     13 |       2 |      8 | caster's |
|  89 | Podwójny dech    | 15 |     16 |       4 |      8 | caster's |
| 123 | Szadź            | 15 |     20 |       3 |      8 | other    |
| 219 | Jadowity podmuch |  1 |      1 |       1 |      8 | other    |
| 264 | Piętno bestii    | 11 |     15 |       2 |      8 | other    |

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
|  25 | Prowokujący okrzyk |       3 |      5 |       1 |      3 |      6 |     1 |
| 188 | Wyzywający okrzyk  |       8 |     15 |       2 |      3 |      6 |     2 |

⚠️ **`covers` is reported and drawn nowhere.** It was the input to the expansion **ADR 0064**
removed; it stays here because it is a true reading of the published table and
`tests/tools/skill-table.test.ts` re-earns it off a transcript.
