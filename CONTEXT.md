# MargoMeter domain

MargoMeter reads the raw battle protocol of [Margonem](https://www.margonem.pl/) and draws what a
fight came to. This glossary is the canonical language for the code, the documents and the commits.
Where a term below lists `_Avoid_`, those spellings are not alternatives — they are wrong here,
because each already means something else.

Rule **N12** in `AGENTS.md` binds: use the term this file gives.

## The fight

**Fight**: One battle, from the first payload to the last. The unit everything is scoped to.
_Avoid_: Battle, encounter, session, match

**Payload**: One update the game engine receives and we read by wrapping its update function. A
fight is many payloads. _Avoid_: Packet, frame, tick, event

**Message**: One semicolon-delimited record inside a payload. _Avoid_: Entry, line, record

**Key**: A named field inside a message. The key decides what the message means. _Avoid_: Field,
tag, type

**Protocol**: The grammar of payloads, messages and keys — our only data source. _Avoid_: API,
format, log

**Turn**: One action by one combatant, which is the game's own definition and not ours — the
published help numbers them from 1 upward and gives one to a single character at a time. What is
counted and shown is a turn **taken**; the game's numbering also counts one granted to somebody who
spent nothing on it, and `docs/turns-taken.md` measures the difference. **Nothing divides by it**:
no rate, no per-turn share, and no fight-wide total, because a fight the reader walked into is short
by an amount nothing states. _Avoid_: Round, tick, action

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

**Hit**: A single damage number. One attack can carry several. _Avoid_: Strike, blow, instance

**Raw / applied**: Damage before and after reduction. Their difference is **not** what a defence
stopped. _Avoid_: Gross/net, base/final

**Prevented**: Damage the protocol says a defence stopped — absorption, magic absorption, a block.
One component of the reduction and never the whole: armour and resistance also reduce and are not
reported. Taken over damage whose raw side the protocol states. _Avoid_: Blocked, mitigated,
absorbed

**Destroyed**: A statistic of the target that an attack reduced — armour and absorption in points,
resistance in percentage points. Not damage, never totalled with it, and its own members are not in
one unit either. _Avoid_: Shredded, debuffed, broken

**Element**: Damage type — fire, cold, physical and the rest — taken from the key. _Avoid_: School,
type, damage type

**Skill**: A named ability a combatant used. Its announcement carries no key of the damage family,
but damage aimed at a name and healing ride the announcement itself. _Avoid_: Ability, spell, move

**Proc**: An effect that fired alongside an attack. Carries no figure. _Avoid_: Trigger, on-hit

**Dot**: Damage over time, ticking outside a direct attack. _Avoid_: Damage over time, tick damage,
bleed

**Declaration**: A figure the protocol states that **no total here counts** — an input, an outcome
in a unit this meter does not keep, or an outcome outside the fight. Read, never totalled. The test:
whatever this figure did, is it reported elsewhere, or in a unit no total keeps, or outside the
fight? _Avoid_: Metadata, informational, noise

## What could not be read

These four are different claims, and collapsing any two of them is how a number that might be wrong
comes to look like a number that is right.

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

**Suspect**: A drawn figure that may be short, because something feeding it could not be read.
Marked next to the figure it concerns, never in a banner. _Avoid_: Warning, error, invalid

**Undrawn**: A panel section that could not be rendered at all, replaced in place by a marker.
_Avoid_: Crashed, broken, failed

## The surfaces

**Panel**: What the add-on draws over the running game, inside its own shadow root. _Avoid_:
Overlay, HUD, dashboard, widget, window

**Screen**: One view the panel can be on, reached by the strips that switch. _Avoid_: Tab, page,
view, mode

**Collapsed**: The panel folded to its title bar, drawing no screen at all. It is a state the reader
chose, so it outlives a reload. _Avoid_: Minimized, hidden, closed, docked

**Row**: One combatant's line in a ranking, or a pinned line standing apart from it. _Avoid_: Item,
entry, bar

**Drill**: What pressing a row opens onto — the levels below the ranking. _Avoid_: Detail view,
expansion, breakdown, sub-panel

**Cut**: What one drill level states a figure by — the element it was dealt with, or the combatant
at the other end of the blow. A cut of one combatant's figure, never of the fight's. _Avoid_:
Breakdown, split, grouping, facet

## The sources

**Recording**: One captured fight in `captures/`: every call the engine made, with the raw protocol
it carried and a snapshot of every combatant before and after. **Evidence, not test data.** _Avoid_:
Fixture, sample, test data, mock, dump

**Game client**: The bundle the game serves and runs in the reader's browser. Two channels:
**production** at `<world>.margonem.pl`, which decides, and **development** at
`experimental.margonem.pl`, which is readable but lags. _Avoid_: Engine, the game, upstream

**Engine**: The object inside the game client whose update function we wrap. Narrower than the
client. _Avoid_: Game, runtime, core

**Build id**: The identifier of the client bundle we read a claim on, taken from the bundle's
filename. Not always a number. _Avoid_: Version, revision, hash

**Published help**: The operator's documentation of the mechanics at `pomoc.margonem.pl` — the only
source that says what an effect _does_. Carries no build id, so a claim from it carries the date it
was read instead. _Avoid_: Wiki, docs, manual
