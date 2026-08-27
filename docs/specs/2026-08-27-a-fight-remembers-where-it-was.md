# A fight remembers where it was

Status: implemented

The panel says of a fight *when*, *how big* and *how it ended*. It has never said
*where*. On a shelf holding twenty finished fights that is the answer a reader
most often wants and cannot get: `21:04 · 10×1 · wygrana` twice over is two rows
nobody can tell apart, and the same ten people beat the same boss on more than
one map.

## What was asked for

> Add an exact location of a battle

Two decisions were put to the maintainer on 2026-08-27 and answered: the place is
drawn **both** on the shelf and in the header of the fight being read, and it
**also** enters the recording a download writes, beside `swiat` and `build`. The
coordinates were asked for after the first answer and are part of both.

## The protocol does not carry it

Measured before anything was written, over the 28 recordings held in
`tests/captured-fights/` on 2026-08-27. Every key a battle payload states:

```
auto, battleground, close, current, endBattle, init, m, mi, move, myteam,
poolTime, skills, skills_combo_max, skills_disabled, start_move, turns_warriors, w
```

A deep sweep of every recording for a key matching `map|town|loc|teren|miejsc|bg|
ground` returns exactly one: `battleground`, whose values are `003.jpg`,
`005.jpg`, `009.jpg`, `015.jpg`, `cc2.jpg`, `dd4.jpg`. It is the picture behind
the fight and it is coarse to the point of uselessness as a place — `dd4.jpg`
names every Hildur recording *and* every Draugr one, on two different worlds.
`docs/specs/2026-08-27-somebody-else-read-the-same-protocol.md` had already filed
it as read nowhere, correctly.

Nor can the seam ever grow one. The same document records that
`Engine.battle.updateData` receives the server event's `f` and nothing beside it;
the map arrives at a sibling of `f` in the client's own dispatcher (`on_town`), so
no amount of reading the battle object will produce it.

## Where it comes from instead

The client's own state, read as properties and never called. Production build
`53XkBRxF` (cached 2026-08-25, read 2026-08-27), confirmed against the unpacked
development build `1781609507010`:

| What | Where | In the build |
|---|---|---|
| the map's name | `Engine.map.d.name` | 11 occurrences; `core/Engine.js:508` builds one `Map` for the life of the tab, `core/map/Map.js:24` gives it the same `this.d = {}` bag every updateable object has |
| the tile stood on | `Engine.hero.d.x`, `.d.y` | 16 occurrences each; `core/characters/Hero.js:2480` shows `getCords()` is those two joined |

Three things follow, and each is a rule in `src/game/engine-place.ts`:

**Properties, never `getCords()`.** Calling into somebody else's program is a
larger intrusion than reading it and can throw for reasons that are none of ours.
The join is ours to write, in the panel's own words.

**Both spellings of a coordinate.** The engine subtracts these
(`Hero.js:288`) and compares them with `==` fifty lines below (`:337`) — a program
that does not mind which it is handed. Reading only one would stop answering the
day the server sent the other, silently.

**`d` is empty while a map loads.** `Map.js:1227-1240` — `onClear`, "called before
new map loads" — resets the bag. A fight does not open mid-load, and if a read
ever landed there the answer is `null` and the panel says nothing.

## When it is read

**On the payload that opens the fight, and nowhere else.**

A fight is written down when it is over, and by then the player may be two maps
away. This is the trap `entryHealthByCombatantId` already carries a warning about:
a fact about one moment, read once and copied from then on.

⚠️ **The opposite mistake is worse and less visible.** `composeNextSession`
returns the session it was handed when a payload changed nothing, and the panel
redraws on identity — so a place re-read on every payload would make every step
the player takes a new session and a full rebuild of a panel saying exactly what
it said before. The reader is therefore passed as a **getter**, called only where
a fight starts.

The getter is optional, because every caller replaying a recording truthfully has
nothing to ask: the offline tools, the published preview, every test of the panel.
Saying nothing is not saying nowhere.

## What a reader sees

`Torneg (34,12)` — the layout is the game's own. The client's *copy location with
coordinates* menu composes exactly `${Engine.map.d.name} (${Engine.hero.getCords()})`,
so a player who has used it already knows how to read one.

### The panel is 260px and does not resize

That number decides the rest of this section. Written first as one more item on
the header's row and one more half of the shelf row's middle cell, both places ran
out of room, and both ran out of it in the way that costs the most:

| Where | What was left | What a long name did |
|---|---|---|
| the header row | ~30 characters beside `10 vs 1` and `WYGRANA` | cut the place, tile first |
| the shelf row's middle cell | ~25 characters | cut `· 10×1` off the end — the row lost the size |

Both are the ellipsis eating the wrong end. Two rules fix them, and the second is
the one worth remembering.

**The header gives the place a line of its own.** Under the size and the outcome,
quiet, at the full width of the panel — about 45 characters, which is a map name
and a tile with room over. Nothing is cut in practice.

⚠️ **The line is absent, not empty, where nothing said.** A reserved gap would
cost every panel with no game beside it — the published preview, the pictures in
`README.md` — a band of nothing under the header for a fight nobody could name.

**The shelf row shows the map's name and never the tile**, in the last of four
cells, the only one allowed to shorten:

```
☆  21:04   10×1   Nekropolia Sithis - pozi…   wygrana
☆  21:04   10×1   Torneg                      wygrana
☆  21:04   10×1                               wygrana
```

Two things are load-bearing there. The size sits **ahead** of the place in a cell
of its own, so a long name shortens instead of pushing the size off the row — and
a fight kept before there was a map to read draws exactly the row it always drew.
And:

⚠️ **A truncated word is visibly truncated; a truncated number is a wrong number.**
The cell ends in an ellipsis, so a tile carried into it eventually draws
`(128,2…` — which reads as a coordinate and is not one. That is §9.6's failure in
its purest form, and it is why the tile is dropped from the row rather than left
to be cut. The head of a name is the half that tells two maps apart; the header
carries the whole place a click away.

The tile alone appears where there is no name — nine characters at the most, so it
cannot overflow and cannot be cut, and half an answer beats a blank cell.

### What is cut is asked for, not lost

Dropping the tile from the row only works if a reader can still get it, and the
same is true of every label the panel has ever cut: `.row-name` has ended in an
ellipsis since there were rows, and the names in it are the game's — a combatant,
a skill, an element, and now a map.

Two mechanisms, and the rule is that they never fire on the same node:

| Where | What answers |
|---|---|
| a row that opens the panel's own card | the card, whose first line is the name |
| a row that opens nothing — every leaf of the drill | the browser's own tooltip |
| the shelf row | the browser's own, carrying the **whole** place, tile included |
| the breadcrumb, on both screens | the browser's own |
| the header's place line | the browser's own |

The browser's rather than one of ours, for the reason `src/ui/panel-element.ts`
already gives about the card it does draw: it needs no script, it cannot cover the
game until the reader asks for it, and nothing of ours moves to produce it (§9.6).

⚠️ **Set from the label, never from whether it overflowed.** The panel is handed
its document and measures nothing (§9.9) — asking a node for its `scrollWidth` per
row per payload is a layout the add-on would be paying for on every engine call.
A tooltip repeating a name that happened to fit costs a reader nothing; a name
that did not fit and cannot be recovered costs them the row.

⚠️ **Silence, not a word for nowhere.** §9.3 makes unknown loud because a figure
that reads as a measurement is a lie; a place is not a figure and there is nothing
here that could be mistaken for one. A phrase like *nieznana lokacja* would be a
claim about the game where the truth is that this add-on did not ask in time.

## What it is written into

**The store.** `KeptFight.place`, validated on read the way `outcome` is: absent
or null reads as nothing, a value of the wrong shape drops the fight. The format
number does not move — `KEPT_FIGHTS_FORMAT`'s own rule is that a field reading as
absent needs no bump, and every fight kept before today is in exactly that
position.

**The recording.** One key, `mapa`, beside `build`. Absent reads as null in the
parser — the `walka` rule and not `build`'s, because all 28 existing recordings
predate the field and refusing them would refuse the corpus. A member's own null
is the client having refused that one.

⚠️ **This is the only field in a recording that can never be recovered
afterwards.** A missing build can be looked up; a missing place cannot be derived
from anything, because the protocol states none of it and the client has moved on.

## Measured

The mutation §3 asks for, run on every part of the path. Every one lit up except
one, and that one was the finding: making `composeKeptFight` drop the field killed
nothing, because every test around it built a kept fight by hand and none went
through the step that takes a fact off the session. It has a test now.

## Rejected alternatives

**Reading `battleground`.** Free, already in every recording, and wrong: it is the
picture behind the fight, shared by unrelated bosses on unrelated worlds. It would
give a reader a name that looks like an answer.

**Wrapping the client's dispatcher to catch `on_town`.** It is where the map
actually arrives, and it would mean changing a second function of the game's.
`src/game/engine-battle-wrap.ts` is deliberately the only code here that changes a
running game, and one seam is the whole of what this add-on asks for. The state is
readable without any of it.

**Reading the place at download or at keep time.** One line shorter and wrong for
the reason the whole *when* section exists: it would name where the player ended
up.

**Reading it on every payload.** Simpler to write, and it defeats the identity
clause that stops the panel rebuilding on every step somebody takes.

**A field on the recording's every call, rather than its header.** A dump is one
fight — the buffer clears on the next fight's `init` — so a header field is a true
claim about the whole file and a per-call one would repeat it a few dozen times.

**`Engine.map.d.id` beside the name.** Stable where a name is display, and nothing
needs it (§7.1). It can join the day something asks which map two recordings share.

**A word where the client said nothing.** Above.

**One cell on the shelf row for where and how big.** Written that way first, and
it is what turned a long map name into a row with no size on it.

**Shortening the name by counting characters.** It would let the tile stay on the
shelf row. Rejected because the panel's font is proportional, so a budget in
characters is a guess dressed as a measurement — and it would put a second
mechanism beside the ellipsis doing the same job, disagreeing at the edges. The
panel already lets CSS cut a combatant's name; what was wrong here was which end
was being cut, not who was cutting.

**Reserving the header's second line always.** A band of nothing under every panel
that has no game beside it.

**Two lines per shelf row.** The place would never be cut, at the price of halving
how many fights the shelf shows — which is what the shelf is for.

**Measuring which labels actually overflow**, and giving a tooltip only to those.
It is the honest version of the question and it is a layout read per row per
payload, on a panel that is redrawn every few seconds and whose whole
placement design (`composeTipDeclarations`, the panel's own height) is written to
avoid measuring the document. Rejected on cost, and the thing it would buy is the
absence of a redundant tooltip.

**The panel's own card for the shelf rows.** One tooltip mechanism instead of two,
and it means handing the shelf the detail map, the pointer listeners and the
placement arithmetic the fight screens carry — for a single line of text.

## What stays open

- **Whether `docs/captured-fights.md` should state it.** No recording carries a
  place yet, so a column would be an empty promise. It becomes worth adding the
  day two recordings differ by map.
- **Whether the offline tools should print it.** `tools/fight-report.ts` and
  `tools/decoding-status.ts` read a dump and could say where it was taken; nothing
  has asked, and no material would answer.
- **What a map name carrying the client's own markup would draw.** `Map.js:539-548`
  escapes the raw value into the interface and parses BB codes only for the
  tooltip, so drawing it raw is what the game itself shows. No recording has one,
  and nothing here would notice if one arrived.
