# The panel that drills

Status: implemented

What the add-on draws: the two axes, the drill tree, what a row opens, how tall
the window is, and why every control answers to a press rather than a click.

Five rounds between 2026-08-11 and 2026-08-19 arrived at this. AGENTS.md §9.6
(how the panel fails) and §9.7 (how it looks) carry the rules; this is where they
became a layout.

**`docs/design/panel.html` is this file with the reader's hands on it** — the
same layout, driven by captured fights, clickable. It is a drawing rather than a
source: where it and the add-on disagree, the add-on is right and the drawing is
stale. It is deliberately not followed when the panel changes, because a copy of
the numbers is not a second reader of them.

---

## 1. The panel speaks Polish, and the repository speaks English

The game is Polish and its players are. A panel drawn over it in English is a
worse product for the sake of a rule that was never about the product: §3 asks
for English so the *repository* reads as one thing to anyone working in it. So §3
carries the exception — **code, comments, tests and documents in English; text
the player reads in Polish.**

**No wording from the code reaches the player.** Not `protokół`, not `klucz`, not
`komunikat`, not `healall_per`. A player reads *"Gra nie mówi, kto to zadał"* —
what cannot be known, not why our reader cannot know it. The game's own tokens
stay in the copied report, which is for us.

A rule with a cost worth naming: a token we cannot phrase in Polish cannot be
shown at all. Better a missing line than a line only its author can read.

## 2. Two axes, not three metrics

`Zadane / Otrzymane / Leczenie` looked like three metrics and was not. The first
two are **directions** of one noun; the third is a **noun with no direction** —
so healing given had nowhere to stand.

**Row one — the noun.** `Obrażenia · Leczenie`. Which quantity.
**Row two — the direction, then the side.** `zadane|otrzymane` (`dane|otrzymane`
under healing), then `Wszyscy · My · Oni`.

Lower case for the direction against the nouns' upper: two strips of equal weight
read as two lists of the same kind of thing, and these are not. **The direction is
worded per noun**, because Polish does not use one word for both — damage is
*zadane*, healing is *dane*.

**No third strip.** A strip costs `padding-top: 3px` plus a 16.85px line box —
19.85px against a list row's 20px, so a third strip is one ranking bar paid for
chrome. The direction shares row two, pushed against the side filter by one flex
rule.

**The state stays one field.** The axes are derived, not stored: `PanelState.metric`
remains the single field and `METRIC_AXES` maps each metric onto its
`(noun, direction)` pair.

This is what answered the older objection to a fourth `leczenie zadane` tab —
*it would put healing given beside healing received where they would be read as
one column*. Separating the axes answers it rather than overruling it: exactly one
direction is selected, they are never drawn together, and they cannot be read as
one column because they are never two columns.

⚠️ **There was once a `na turę` rate.** It was built over a turn count the add-on
had invented — 98 against the 299 the game numbered. Two later readings replaced
it and both were removed in turn: the panel now shows totals only, with no divisor
and no control. Nothing here counts turns (§10).

## 3. A row

`1. [odznaka] Nazwa    79 161 (24%)`

Rank number, profession badge, name, one leading figure, and a bracket holding
the share. The bracket is not a second column: it reads as a footnote to the
number beside it.

**The rank number is deliberate**, and an earlier spec rejected it. The reason it
was rejected — the rows are already in order — is true and beside the point: a
number is what a person says out loud when they report what they saw, and it is
what makes "third from the top" a thing two people can check against each other.

## 4. Drilling: one gesture in, one gesture out

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
fall short, the difference is a row rather than a silence. Under `Zadane` that row
also carries **how many blows** it stands for, and it is drawn even when they
landed nothing — three blows that were all blocked are three blows, and a section
that skipped them would say the combatant did not swing.

### A row opens only what it does not already say

The panel has always refused to *draw* a section repeating the figure over it.
This is the same rule one rung earlier, on the **affordance**: a row is drawn
drillable only where the level under it adds a name the reader did not already
have.

Measured over the captures as the set stood 2026-08-19, every drillable row of
every breakdown opened and classified:

| the row | drills | opened the reader's own name | opened a closing row | opened something new |
|---|---|---|---|---|
| `Leczenie` → a skill | **250** | **250** | 0 | **0** |
| `Leczenie dane` → a skill | 59 | 13 | 0 | 46 |
| `Leczenie` → a person | 330 | 0 | 86 | 244 |
| `Leczenie dane` → a person | 330 | 0 | 86 | 244 |
| `Zadane` → a skill | 223 | 0 | 0 | 223 |
| `Zadane` → a person | 262 | 0 | 6 | 256 |
| `Otrzymane` → a person | 262 | 0 | 6 | 256 |

**The 250 are degenerate by construction.** Under `Leczenie` the level below a
skill narrows to the combatant already in focus — it has to, because the row was
entered from what that skill gave *this* combatant — so it can only ever draw one
row, bearing the reader's own name and the figure they just clicked. Not
sometimes: 250 of 250.

`docs/drill-levels.md` is the register of which rows open and which do not, held
both ways by `tests/tools/drill-report.test.ts`.

### What a skill did is a reading, not a guess

**The game's own client glues an announcement to the next message** and treats the
pair as one action — the branch that appends `allM[parseIndexM + 1]` to a message
carrying `skillId`. So joining them is not our idea about the fight; it is how the
fight is composed.

We narrow it by one condition the client does not need and we do: **the next
message must have the same actor.** Measured on
`tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json`: 197
announcements, 133 next messages with the same actor, and **32 with a different
one** — without the condition, an announcement takes somebody else's blow.

⚠️ **`Zwykły cios` is not a claim that somebody used a plain attack.** A blow with
nothing announced over it is a plain attack *or* an extra swing the game granted
and does not mark as one, and the protocol does not tell the two apart. The row
names the blow and not the intent.

⚠️ **The healing sections count what the row counts: healing *received*.** A
combatant's own healing skills answer a different question — how much they *gave*
— and the two do not add up. Measured: two mages gave 11 733 and 10 204 while
receiving 6 426 and 3 651, because they were healing the tank. Putting both in one
view would invite a comparison that is not one.

## 5. Zero is a reading; unknown is a limit

A combatant with nothing in the current metric gets no empty sections. They get
the fact, plainly — *"Nie zadała nikomu obrażeń"*, *"Nic jej nie ubyło"*,
*"Nikt jej nie leczył"* — and, quieter and only where it is true, the limit.

The limit sentence is **absent for healing on purpose**, and the asymmetry is the
point: the game always names who was healed, so zero healing received is a
complete answer.

## 6. The height a fight needs, and the window it has to fit in

Three heights once existed and none of them was bounded by the screen it was drawn
on. The rule is **a floor in bars, a ceiling in windows**.

**The ranking is eleven bars under `Wszyscy` and ten under a side filter, fixed.**
The measurement behind those numbers, on the captures: 2, 4, 11, 11, 11, 11 and 11
combatants, and every group fight is ten of ours against one. So the common case
fits with no scrollbar at all. A bigger fight scrolls rather than growing the
window — a ranking is watched *during* a fight, and a height that changed as
combatants joined would move under the hand of somebody reading it.

**A breakdown is never shorter than the ranking it was opened from, and grows to
hold its sections.** It has three of them and the whole point of three is
comparing them; at eleven bars the last two sat under the fold. Both halves are
one rule: the ranking's height is the floor, and only growth is allowed — so a
click can lengthen the window and can never shorten it.

**The ceiling is the window, and it is a stylesheet rule.** The panel may take
what is left below its own top edge, and never more than two thirds of the window,
whichever is less. The first keeps its figures on the screen; the second is taste,
said so — a guest over somebody's game does not get the screen because a tall
monitor could hold it.

**The scroll position survives a redraw.** A fight redraws every few seconds and
every redraw built a new list, so wherever the reader had scrolled to was lost on
the next payload. In a fight long enough to need scrolling, the list could not be
read.

## 7. A gesture a redraw cannot split

*"I have to click multiple times on any tab, and button, to see the action, when
the add-on is in the middle of drawing."*

**It is not latency.** `bun run cost 3`, over every recording, puts the worst whole
payload between 0.50 ms and 1.49 ms, of which the fold is the largest part; the
browser-side `dom` phase measured roughly 2 ms per redraw on 2026-08-18. Nothing
there is a wait a hand can feel.

**It is the redraw taking the node out from under the gesture.** A browser
assembles `click` out of two moments and dispatches it only if both resolve to a
node still in the tree. Every tab, row and crumb was built inside `renderPanel`,
and `renderPanelInto` replaces the whole body on every payload — so a payload
landing between the press and the release detached what had been pressed, and **no
`click` was dispatched at all**.

The rate decides how often it bites, which is why it read as a speed problem:
42 of 44 engine calls redraw on `2026-08-15-tempest-grupa-vs-draugr-2`, and 82 of
84 on `2026-08-15-tempest-grupa-vs-hildur-2` — essentially every call the game
makes during a fight.

Half the panel was already immune by a rule this repository had written down and
applied to only one rung: `setPanelRoot` builds the title bar once, with the shadow
root, because *"a grab handle built inside the render would be destroyed under the
pointer by the next payload."* **Every control the render draws now answers to a
press.**

## 8. The title bar

- **`⧉` copies the report** — the add-on's version, the world, the game's build,
  the moment, the watching character, the roster, every combatant's figures with
  their skills and pairings, the side totals, and every warning as an entry with a
  code and a detail. One copy, one place.
- **`{ }` copies the raw payload** for a report we can replay. Dimmed: not for the
  player.
- **`—` collapses the window.** An earlier spec refused collapsing on the grounds
  that moving the panel answers the same question. It does not: moving it puts it
  somewhere else on a screen that has no somewhere else during a fight.

## Rejected alternatives

**An English panel.** The rule was about the repository.

**A dictionary of Polish effect names in our code.** The wording belongs to the
game, changes with its updates and depends on the client's language — a copy would
go stale silently. Where the panel needs the game's own phrasing it asks the game
(`window._t`, the same function the battle renderer composes with) and falls back
to *our own short description*, never to an invented sentence.

**Showing the game's own tokens to the player** when no wording is available. True,
and unusable: `legbon_verycrit` tells a player nothing they can act on.

**Splitting the half-named row across sides under a filter.** There is no actor to
split it by; splitting by *victim* would be a different axis than the list uses.

**Letting it scroll with the ranking.** It is the row that says the numbers are
short; hiding it below a fold is the one thing it must not do.

**Growing the list to fit everyone.** A fight of twenty makes a window taller than
the game — which is the objection that decided the ceiling.

**Keeping the sections when a combatant has nothing.** Three empty headings say the
panel is broken; one sentence says the fight is.

**Attributing a blow to the last skill anyone announced.** The glue rule is per
actor and one message deep, which is exactly what the client does.

**A dropdown of modes.** It hides its siblings, so nobody discovers the fourth
screen exists, and it costs two clicks mid-fight. The discipline against modes
multiplying is the matrix: **a new mode is a noun that takes both directions, or it
is not a mode.**

**The mode as a drill level, the way Skada does it.** The drill budget is already
spent on combatant → pair → skill, and burying the axis one click down hides which
screen you are on.

**A `uniki` counter, now that `-evade` is read.** Every flag is counted against
whoever swung, so on a row it would mean blows that combatant threw and somebody
dodged — not times they dodged. Under that label it would be read as the second.

**Making the shares under `Leczenie` sum to a hundred.** They cannot, and the
arrangement that would force it is worse. The overlap is a fact about the
protocol — the same points are somebody's healing received *and* healing with no
author — so it is stated rather than smoothed.

**Exempting every row that carries a count** from the drill rule. Elegant, and 31
of the 58 cuts it draws restate a skill the reader reaches by opening the row
above. The criterion that survives measurement is the narrower one.

**Measuring the panel with `getBoundingClientRect`** for the ceiling. The height
changes with every payload, so a measured ceiling is stale before the next one.

**Computing `max-height` in script from the viewport.** It goes stale on a window
resize, which nothing here listens for. `100vh` does not.

**Moving the list into the shadow root** so the browser keeps the scroll position
for free. The list sits in the middle of the region order, so a persistent list
splits the render into two containers — which costs the property §9.6 leans on:
one function drawing every region in reading order, each isolated.

**Scrolling the reader to their own row when something changes.** §9.6: nothing
moves unless a hand is moving it.
