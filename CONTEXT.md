# MargoMeter domain

MargoMeter reads the raw battle protocol of [Margonem](https://www.margonem.pl/) and draws what a
fight came to. This glossary is the canonical language for the code, the documents and the commits.
Where a term below lists `_Avoid_`, those spellings are not alternatives — they are wrong here,
because each already means something else.

Rule **N12** in `AGENTS.md` binds: use the term this file gives.

## The fight

**Fight**: One battle, from the first payload to the last. The unit everything is scoped to.
_Avoid_: Battle, encounter, session, match

**Auto fight**: A fight the game runs itself, entered or handed over on the auto key — `F` in the
client's own binding. The game numbers no turn while it is on (**develop ADR 0072**). A fight
delivered in one lump is not one by that alone. _Avoid_: Quick fight, autobattle

**Payload**: One update the game engine receives and we read by wrapping its update function. A
fight is many payloads. _Avoid_: Packet, frame, tick, event

**Message**: One semicolon-delimited record inside a payload. _Avoid_: Entry, line, record

**Key**: A named field inside a message. The key decides what the message means. _Avoid_: Field,
tag, type

**Protocol**: The grammar of payloads, messages and keys — our only data source. _Avoid_: API,
format, log

**Turn**: One action by one combatant, which is the game's own definition and not ours
(`docs/turns-taken.md` gives the help's words and their date). What is counted and shown are both
halves of what was seen: a turn **taken**, and a turn granted and spent on nothing, which the game
announces itself. Their sum is still not the turns somebody was given. **Nothing divides by it** —
no rate, no per-turn share, no fight-wide total (**develop ADR 0048**). _Avoid_: Round, tick, action

## The people

**Combatant**: One participant in a fight, on a stated side. The unit a row is about. _Avoid_:
Warrior, player, character, unit, actor

**Side**: Which team a combatant is on, as the game states it — a bare number. Which side is the
reader's own is not in the protocol, so the core groups sides and never favours one. _Avoid_: Team,
faction, ours, enemy

**Reader's side**: The side the running client marks as the reader's own. It is the client's answer
and never the protocol's, so it is absent from a fight nothing stated it on — and a panel that
cannot tell one side from the other lists everybody rather than guessing. _Avoid_: My team, our
side, player side

**Roster**: The combatants on both sides, with side, level and profession. _Avoid_: Lineup,
participants, party

**Reader**: The person running the add-on and looking at the panel. The only human in scope.
_Avoid_: User, player, viewer

**Actor / target**: The two ends a message may name — who did it, and to whom. Either may be absent.
_Avoid_: Source/destination, attacker/victim, from/to

## The figures

**Blow**: One attack by one combatant, and the unit the counted figures are counted in. It carries
the hits, the procs and what it destroyed, so the criticals are a share of the blows struck. **The
hardest figure at each end is not one of them**, and the panel states it nowhere: damage the game
puts against a name raises it without ever having been a swing, so it can stand above the largest
actual blow (**develop ADR 0087**, **develop ADR 0088**). It is read in the handed-over fight file
and in `deno task fight:figures`. The decoder's own event kind spells it `attack`: that is the data
contract's word (`src/core/battle-event.ts`), which `docs/design.md` carries over unchanged and this
file does not rename. _Avoid_: Swing, exchange, hit

**Hit**: A single damage number inside a blow. One blow can carry several. _Avoid_: Strike, instance

**Dealt / taken**: What a combatant's blows spent on somebody: the health taken off, plus what an
absorption pool took. The figure `Zadane` and `Otrzymane` draw, and what every cut of them sums to
(ADR 0012). _Avoid_: Total damage, effective damage

**Raw / applied**: Damage before and after reduction. Applied is health alone, the figure the
protocol's own percentages witness, so it leaves out what a pool absorbed. Their difference is
**not** what a defence stopped. _Avoid_: Gross/net, base/final

**Absorbed**: Damage an absorption pool — physical or magical — took instead of health. The pool is
one the character began the fight with, so an absorbed point is part of what was dealt and taken. It
is no kind of damage: it stands under the element it took from, or under every element it could have
taken from where the blow carried several, and never as a share of one, because the protocol states
one figure per pool and not per element (ADR 0045). _Avoid_: Shielded, soaked

**Prevented**: Damage the protocol says a defence stopped that drains nothing — a block. One
component of the reduction and never the whole: armour and resistance also reduce and are not
reported. Taken over damage whose raw side the protocol states. The decoder's event keeps the data
contract's word `prevented` for absorption as well (`core/battle-event.ts`), and the figures sort
the two apart. _Avoid_: Blocked, mitigated

**Destroyed**: A statistic of the target that an attack reduced — armour and absorption in points,
resistance in percentage points. Not damage, never totalled with it, and its own members are not in
one unit either. _Avoid_: Shredded, debuffed, broken

**Caveat**: A drawn figure whose label names more than the figure counts, whatever the recording —
the protocol states it over fewer messages than the word covers, or reports one component of what
the word names. Where it is marked and said is `DESIGN.md`'s **Caveat mark**. **Not a Suspect**,
which says a figure may be short because something in _this_ fight could not be read: a caveated
figure is complete and still answers a narrower question, so a recording with nothing unread in it
carries every caveat it ever did, and one glyph over both would make the permanent look temporary
and the temporary look permanent. **develop ADR 0088**, whose mark got an ink and a row in **develop
ADR 0089**. _Avoid_: Warning, footnote, asterisk, disclaimer, approximate, suspect

**Element**: Damage type — fire, cold, physical and the rest — taken from the key. _Avoid_: School,
type, damage type

**Skill**: A named ability a combatant used. Its announcement carries no key of the damage family,
but damage aimed at a name and healing ride the announcement itself. _Avoid_: Ability, spell, move

**Charged skill**: A special blow a combatant is making ready over a stated number of turns. The
game states it in the payload's **envelope** rather than in a message, and clears it the moment the
blow lands or is taken away — so it has exactly two ends anything can name: **struck**, where the
blow's own announcement stands in that payload, and **broken**, where a key says it was taken away.
Every other way it can go is silence, and silence is what the panel says about it. _Avoid_:
Ultimate, super, cast, channel, windup

**Proc**: An effect that fired alongside an attack. **Some of them state a figure and no total here
reads one** — a family of wound announcements carries a value on the wire (**develop ADR 0094**),
and what it did is reported by the keys beside it. _Avoid_: Trigger, on-hit

**Dot**: Damage over time, ticking outside a direct attack. _Avoid_: Damage over time, tick damage,
bleed

**Aura**: What one skill put on more than one combatant. Announced **once** and never mentioned
again, so how far through one is comes from the published table and never from the protocol
(`docs/auras-standing.md`). A cast reaching a side says nothing about whom it reached. _Avoid_:
Buff, area effect, team buff

**Shout**: The cast that forces the characters it names to attack whoever made it — the one cast
that says whom it reached, by name. The state it leaves somebody in is a **provocation**, and it is
one per character: a later shout replaces whatever held them. _Avoid_: Taunt, challenge, aggro

**Status**: What the game says a combatant is carrying **right now**, read off the **mask** — the
one integer their entry restates, whose bits the client registers in an order of its own. It names
no cause: nothing in it says which cast lit it, which is why a status and an aura are two readings
and not one. _Avoid_: Buff, debuff, effect, condition

**Legendary bonus**: An effect a combatant carries from an item rather than from a skill, announced
under a key of its own. **No skill table dates one**, so a length for it comes from the published
help or from nowhere. _Avoid_: Legendary, artifact effect, item proc

**Standing**: What holds in a fight at the moment it is read — an aura still inside its turns, the
provocation a shout left, a charged skill being made ready, the turn in hand. A reading of now and
never a total. _Avoid_: Active, ongoing, live

**Declaration**: A figure the protocol states that **no total here counts** — an input, an outcome
in a unit this meter does not keep, or an outcome outside the fight. Read, never totalled. The test:
whatever this figure did, is it reported elsewhere, or in a unit no total keeps, or outside the
fight? _Avoid_: Metadata, informational, noise

## What could not be read

These are different claims, and collapsing any two of them is how a number that might be wrong comes
to look like a number that is right.

**Unattributed**: A number the log does not tie to any actor. Shown, never guessed. It may still be
charged to a **side** where the game named the other end. _Avoid_: Unknown, orphan, misc

**Half-named**: A message stating one end of what happened and calling the other nobody. Two shapes
and two rows, and they are different claims: one is a figure whose actor the game left out, the
other one whose target it did. A message naming **neither** end is neither of them and has no side.
_Avoid_: Partial, incomplete, anonymous

**Self-sourced**: A figure stated at one end where the published help says the effect is that
combatant's **own**, so both ends are the same person. Not half-named — there was never a second
name to get wrong. _Avoid_: Self-cast, reflexive, untargeted

**Earlier-named**: A figure stating one end where an **earlier message of the same fight** named the
other. Two people, both stated, one message apart — so neither half-named nor self-sourced. _Avoid_:
Inferred, carried, linked

**Unaccounted**: Health the protocol says moved in an amount nobody can size — a figure whose inputs
this meter does not hold. Distinct from **unattributed**, which is a figure we have and cannot
place. What is left in it is the fight nobody watched the start of. _Avoid_: Missing, lost,
unexplained

**Unread**: A message the decoder could not turn into meaning, counted under the cause that left it
so. **It carries no figure**, which is what separates it from everything above: a total may be short
by it and nothing anywhere can say by how much. _Avoid_: Failed, skipped, dropped

**Suspect**: A drawn figure that may be short, because something feeding it could not be read. Where
it is marked is `DESIGN.md`'s _Suspect Is Adjacent Rule_. _Avoid_: Warning, error, invalid

**Undrawn**: A panel section that could not be rendered at all, replaced in place by a marker.
_Avoid_: Crashed, broken, failed

## What the add-on got wrong

Every term above is a claim about the fight. This one is a claim about us, and it is kept apart for
that reason.

**Failure**: What went wrong, while it is still being handled: an instance of one of our `Error`
classes, returned beside the value where one was expected, or what a `catch` held — a call that
threw, or an expectation that did not hold. That is the sense `AGENTS.md`'s error rules use
throughout. It is ours and nobody else's: a failure never reaches a player under any name. _Avoid_:
Exception, crash, throw

**Defect**: A failure that got as far as costing the reader something, which is the only kind the
panel says anything about. Said as a sentence naming what the panel could not do and how many times,
never why: what a player is told is that a part of the panel is missing, not what our code believed
about it. _Avoid_: Error, bug, crash, exception

## The surfaces

**Panel**: What the add-on draws over the running game, inside its own shadow root: two windows, the
**meter** and the **helper**. _Avoid_: Overlay, HUD, dashboard, widget, window

**Meter**: The panel's main window — the ranking, the levels under it, the options. `Licznik` on
screen. _Avoid_: Panel, main window, ranking window

**Screen**: One view the panel can be on, reached by the strips that switch. _Avoid_: Tab, page,
view, mode

**Collapsed**: A window folded to its title bar, drawing no screen at all. It is a state the reader
chose, so it outlives a reload. _Avoid_: Minimized, hidden, closed, docked

**Helper**: The second window, beside the meter, drawing what is **standing** in the fight going on
— the turn in hand, the charged skills, whom a shout holds. It folds and moves on its own. _Avoid_:
Standing, sidebar, companion

**Shown fight**: The fight the panel is drawn over: the kept one the reader chose, else the one
going on, else the newest kept. What the file hands over is this one and not the one going on.
_Avoid_: Standing fight, current fight, selected fight

**Shelf**: The fights the add-on keeps in the browser between pages, in the store the reader chose.
One fight on it is a **kept fight**. _Avoid_: History, archive, saved fights

**Type step**: One of the three sizes both windows are drawn at, which the reader chooses in the
options, each measured at its own size rather than scaled from another. _Avoid_: Zoom, scale, theme

**Row**: One combatant's line in a ranking, or a pinned line standing apart from it. _Avoid_: Item,
entry, bar

**Card**: The box a row opens while the pointer rests on it: what the row had to leave out about the
person, and the caveats under it. Ours — the box the game itself hangs on a fighter is its
**tooltip**, which the add-on only writes rows into. _Avoid_: Tip, popup, hover

**Drill**: What pressing a row opens onto — the levels below the ranking. _Avoid_: Detail view,
expansion, breakdown, sub-panel

**Outside the ranking**: The section under the list, and the figure standing in it: what a screen's
own count holds and no row of it does. **A measurement, never a category** — it is the screen
counted a second time, from the statistics rather than from the rows, so anything that stops
reaching a row lands in it and nothing is ever written to put it there. It holds nothing on any
screen of the 37 recordings of `captures/`, every seat and side (read through `presentScreen`,
2026-10-06). _Avoid_: Other, remainder, misc, pozostałe

**Cut**: What one drill level states a figure by — the element it was dealt with, or the combatant
at the other end of the blow. A cut of one combatant's figure, never of the fight's. _Avoid_:
Breakdown, split, grouping, facet

**Install band**: The header the published preview opens with — what the add-on is, the button that
hands the file over, and what has to be true before it works. **Banner** is the one word it may not
take: that already means the metadata block a script manager reads. _Avoid_: Banner, hero, CTA,
landing

## The sources

**Recording**: One captured fight in `captures/`: every call the engine made, with the raw protocol
it carried and a snapshot of every combatant before and after. **Evidence, not test data.** _Avoid_:
Fixture, sample, test data, mock, dump

**Game client**: The bundle the game serves and runs in the reader's browser. Two channels:
**production** at `<world>.margonem.pl`, which decides, and **development** at
`experimental.margonem.pl`, which is readable but lags. What is reached through the client outside
the engine is `MargonemClient…` in a name, and what is the game's at large `Margonem…` (**N21**).
_Avoid_: Engine, upstream, page, and `Game` in a name

**Engine**: The object inside the game client whose update function we wrap. Narrower than the
client, and `MargonemEngine…` in a name, with everything read through it. _Avoid_: runtime, core

**Browser**: The interfaces the browser itself offers the add-on — storage, the clock, frames and
timers, the console, a download, the page's location and agent. Neither the client's nor the
engine's, so a port over one is `Browser…` (**N21**). _Avoid_: Page, platform, environment

**Build id**: The identifier of the client bundle we read a claim on, taken from the bundle's
filename. Not always a number. _Avoid_: Version, revision, hash

**Published help**: The operator's documentation of the mechanics at `pomoc.margonem.pl` — the only
source that says what an effect _does_. Carries no build id, so a claim from it carries the date it
was read instead. _Avoid_: Wiki, docs, manual
