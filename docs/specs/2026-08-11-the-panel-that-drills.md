# The panel that drills

Status: implemented

What the add-on draws, decided before it is drawn. It replaces the panel spec
written the day before, which described one ranking and no way into it; that file
was deleted rather than left to disagree with the tree, and what still holds is
repeated here rather than cited, so there is one place to read. Git has the old
one for anyone asking what changed.

The rules it obeys are in `AGENTS.md` §9.6 (how the panel fails) and §9.7 (how it
looks). This is where they become a layout, and where the two questions those
rules cannot answer get answered: **what the panel says in words**, and **how far
into a fight a reader may click**.

**`docs/design/panel.html` is this file with the reader's hands on it** — the
same layout, driven by the two captured fights, clickable. It is where the shape
below was agreed, and it is a drawing rather than a source: where it and the
add-on disagree, the add-on is right and the drawing is stale.

## The panel speaks Polish, and the repository speaks English

The game is Polish and its players are. A panel drawn over it in English is a
worse product for the sake of a rule that was never about the product: §3 asks
for English so that the *repository* reads as one thing to anyone working in it.

So the line moves to where it belongs, and §3 carries the exception: **code,
comments, tests and documents in English; text the player reads in Polish.**
Nothing else changes — this file is English, and so is every identifier behind
the strings it quotes.

**No wording from the code reaches the player.** Not `protokół`, not `klucz`, not
`komunikat`, not `healall_per`. A player reads *"Gra nie mówi, kto to zadał"* —
what cannot be known, not why our reader cannot know it. The game's own tokens
stay in one place where they are useful: the copied report, which is for us.

That is a rule with a cost worth naming: a token we cannot phrase in Polish
cannot be shown at all. Better a missing line than a line only its author can
read.

## Three metrics, a side filter, and a rate

⚠️ **The rate was withdrawn and no longer exists.** What follows was written over
a turn count the add-on had invented — 98 against the 299 the game numbered. Two
later readings replaced it and both were removed in turn: the panel now shows
totals only, with no divisor and no `na turę` control. Everything else on this page
stands. It is left as written rather than corrected in place, because a dated
record that quietly changes its mind is a record of nothing.

Two rows of controls, and they are different kinds of thing:

- **Zadane / Otrzymane / Leczenie** — which figure the list ranks by.
- **Wszyscy / My / Oni** — who is on the list. Sides are a filter, not a heading.
- **na turę** — a rate rather than a total, and it sits apart from both, pushed
  right, because it changes *how* a figure is written and not *which* figure.

**`na turę` divides everywhere it appears.** The ranking, every breakdown, every
section total, and the side summary under the list. A switch that stopped at the
top level would leave one window showing a rate above and totals below, and the
reader comparing them without being told they are different things. The divisor
is the one already established for a row: **dealt by that combatant's own turns**
(the question is *how much per action*), **taken and healed by the fight's**
(you are hit and healed on other people's turns too). The **share in brackets and
the side bar keep using raw sums**, because a share describes the shape of a
fight, not its pace.

The cost is stated rather than hidden: under `na turę` the rows do not add up to
the side summary, because every combatant divides by their own turns. The
previous incarnation carried the same arithmetic and had it filed as suspect;
this file keeps the behaviour and keeps the note.

## A row

`1. [odznaka] Nazwa    79 161 (24% · 15 832,2/t)`

Rank number, profession badge, name, one leading figure, and a bracket holding
the share and the *other* measure — the rate when totals lead, the total when the
rate does. The bracket is not a fourth column: it reads as a footnote to the
number it sits beside.

**The rank number is back**, and the spec it replaces rejected it. The reason it
was rejected — the rows are already in order — is true and beside the point: a
number is what a person says out loud when they report what they saw, and it is
what makes "third from the top" a thing two people can check against each other.

## The list is a fixed height, and one row never scrolls away

**Eleven bars under `Wszyscy`, ten under `My` and `Oni`** — ten because that is
the most a side fields. The height is computed from the row token rather than
written down, so changing the type size cannot quietly break the promise, and it
is the same height in a breakdown, so clicking into a combatant does not move the
window under the hand.

**`Bez sprawcy` sits below the list and outside its scrolling.** It is the one
row that says *something here is missing*, so it is the one row that must not be
able to disappear under an edge. It appears under **Zadane** and **Leczenie**
whenever there is anything to show, including under a side filter — where its
scope stays the whole fight, and its detail says so, because a figure with no
actor cannot be assigned to a side.

## Drilling: one gesture in, one gesture out

**LPM goes in, PPM comes out**, at every level, from anywhere in the panel. A
breadcrumb says where PPM leads, by name.

```
Zadane      ranking ─LPM→ ┬ KOMU              ─LPM→ czym w ten cel
                          ├ CZYM (UMIEJĘTNOŚCI) ─LPM→ w kogo tą umiejętnością
                          └ TYP OBRAŻEŃ        (liść)
Otrzymane   ranking ─LPM→ ┬ OD KOGO           ─LPM→ czym od tego napastnika
                          └ TYP OBRAŻEŃ        (liść)
Leczenie    ranking ─LPM→ ┬ OD KOGO           ─LPM→ czym ten leczący
                          ├ CZYM (UMIEJĘTNOŚCI)
                          └ OD CZEGO           (liść)
```

Every section adds up to the figure it was entered from. Where the named parts
fall short, the difference is a row rather than a silence: `Bez sprawcy` for a
missing actor, `Zwykły cios` and `Nie wiadomo, czym` for a missing name. Under
`Zadane` that row also carries **how many blows** it stands for, and it is drawn
even when they landed nothing — three blows that were all blocked are three
blows, and a section that skipped them would say the combatant did not swing. A
breakdown that quietly totals less than the row above it is the failure this
project exists to prevent, in miniature.

## What a skill did, and why that is a reading rather than a guess

The previous spec said a per-skill view would be "an inference dressed as a
reading". That was wrong, and the correction is the reason this file exists.

**The game's own client glues an announcement to the next message** and treats
the pair as one action — `BattleEffectsController.js`, the branch that appends
`allM[parseIndexM + 1]` to a message carrying `skillId`. So joining them is not
our idea about the fight; it is how the fight is composed.

We narrow it by one condition the client does not need and we do: **the next
message must have the same actor**. Measured on
`tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json`: 197
announcements, 133 next messages with the same actor, and **32 with a different
one** — without the condition, an announcement takes somebody else's blow.

What that yields, measured on the same fight: per-combatant sums by skill never
exceed the combatant's own total, with the remainder standing as `Zwykły cios`.
Nine of eleven combatants have some.

**That row counts the blows as well as the damage**, because a blow nothing
announced is most of what happens: 8 of 8 in the solo capture, 21 of 31 for one
hunter in the group one. A combatant who announces nothing all fight would
otherwise appear as a figure with no shape at all.

⚠️ **It is not a claim that somebody used a plain attack.** A blow with nothing
announced over it is a plain attack *or* an extra swing the game granted and does
not mark as one, and the protocol does not tell the two apart. So the row names
the blow and not the intent, and says so where it is read.

**Healing is drilled the same way and gets an actor from the same rule** — a heal
under an announcement belongs to whoever announced it. Measured: **25 178 of
122 648 points of healing have a healer**; the rest is regeneration and
self-healing that nothing announces, and it stands as `Bez sprawcy`.

⚠️ **The healing sections count what the row counts: healing *received*.** A
combatant's own healing skills answer a different question — how much they
*gave* — and the two do not add up to the same thing. Measured: two mages gave
11 733 and 10 204 while receiving 6 426 and 3 651, because they were healing the
tank. Putting both in one view would invite a comparison that is not one.

## What nobody can be charged with is still shown

Health falls outside a blow — ticking poison, a wound delivered later — and the
game names the victim without naming a source. Both of those are real damage and
neither can sit on an attacker's row.

- Under **Zadane** they are the `Bez sprawcy` row: 49 318 points in the group
  fight, **13% of everything that hit the boss**.
- Under **Otrzymane** they are part of the victim's own figure, because their
  health really did fall, and the tooltip splits it: `z ciosów` and `Bez sprawcy`.
- Both sides therefore still balance: Σ dealt + unattributed = Σ taken.

## Zero is a reading; unknown is a limit; they are different sentences

A combatant with nothing in the current metric gets no empty sections. They get
the fact, plainly — *"Nie zadała nikomu obrażeń"*, *"Nic jej nie ubyło"*,
*"Nikt jej nie leczył"* — and, quieter and only where it is true, the limit:
*"Część obrażeń w tej walce jest bez sprawcy — nie da się sprawdzić, czy któreś
z nich są jej"*.

The second sentence is **absent for healing on purpose**, and the asymmetry is
the whole point: the game always names who was healed, so zero healing received
is a complete answer. What it does not name is *who healed*, and that is said
where it belongs — in the breakdown, not in place of the figure.

## The title bar: one copy, one developer copy, one collapse

- **`⧉` copies the report** — the add-on's version, the world, the game's build,
  the moment, the watching character, the roster, every combatant's figures with
  their skills and pairings, the side totals, and **every warning as an entry
  with a code and a detail**. One copy, one place; a warning in the footer is
  copied by copying the report, which is why the footer holds no button of its
  own.
- **`{ }` copies the raw payload** for a report we can replay. It is dimmed: it
  is not for the player.
- **`—` collapses the window.** The previous spec refused collapsing on the
  grounds that moving the panel answers the same question. It does not: moving it
  puts it somewhere else on a screen that has no somewhere else during a fight.

## The footer holds warnings and nothing else

No line saying the reading was clean — an empty footer is not drawn at all. Each
warning is one sentence in the player's words, and every one of them also travels
in the report with the token that produced it.

## Rejected alternatives

- **An English panel.** See above: the rule was about the repository.
- **A dictionary of Polish effect names in our code.** The wording belongs to the
  game, changes with its updates and depends on the client's language — a copy
  would go stale silently. Where the panel needs the game's own phrasing it asks
  the game (`window._t`, the same function the battle renderer composes with) and
  falls back to *our own short description*, never to an invented sentence.
- **Showing the game's own tokens to the player** when no wording is available.
  True, and unusable: `legbon_verycrit` tells a player nothing they can act on.
- **A separate "leczenie zadane" metric.** It is a fourth ranking answering a
  question the third already answers from the other end, and it would put healing
  given beside healing received where they would be read as one column.
- **Splitting `Bez sprawcy` across sides under a filter.** There is no actor to
  split it by. Splitting by *victim* would be a different axis than the list uses
  and would read as if that side had dealt it.
- **Letting `Bez sprawcy` scroll with the ranking.** It is the row that says the
  numbers are short; hiding it below a fold is the one thing it must not do.
- **Growing the list to fit everyone.** A fight of twenty makes a window taller
  than the game. Eleven and ten are the sizes the two views actually need.
- **Keeping the sections when a combatant has nothing.** Three empty headings say
  the panel is broken; one sentence says the fight is.
- **A per-warning copy button in the footer.** A second place that copies the
  same thing, and the warning is already inside what the first one copies.
- **Attributing a blow to the last skill anyone announced.** The glue rule is per
  actor and one message deep, which is exactly what the client does; a "last
  announcement wins" rule would have taken 32 blows from the wrong person in the
  one fight we can measure.
- **Per-skill healing counted as healing given.** See above — a different
  quantity in the same section.
