# The game says the fight again

Status: draft

A fight lives in memory and nowhere else, so a reload has always meant losing it.
`docs/specs/2026-08-10-reading-a-live-fight.md` settled that in one line — *"A
fight already in progress when the user installs or reloads is simply not ours to
count"* — and this reopens it, because that line answers a question nobody put to
the game. **After a reload the server states the whole fight again, in one
payload.** What is lost is lost by us, in the gap between the page loading and our
wrap going on.

So this is not the persistence layer the list asks for. It is a race, and the
first thing it needs is a measurement nobody has taken.

## What was asked for

> Prevent loosing data after a refresh of the game/page

and, in words: can you enter the game, start a fight, refresh the page, and see
the panel holding that fight's current numbers — or are the numbers gone for
good?

## Where the add-on stands today

Gone. A fight is accumulated in closure variables inside `setMargoMeter`
(`src/userscript-entry.ts`) and folded again on every payload that moves it; the
panel's own screen, drill and scroll live in `composePanelMount`'s closure beside
it. **The fight that is running is written down nowhere.**

⚠️ **That sentence used to be *nothing is written down*, and it stopped being
true on the day this was filed.** Two commits later `75096ad` gave the panel a
shelf of fights that are **over** (`src/game/kept-fights.ts`, under
`margometer.kept-fights`), and `b5a82fb` added the window's collapsed state — so
across a page the add-on now remembers four things: where the panel was dragged
to, how the window was left, the reader's two answers about keeping fights, and
the fights themselves. Each is validated on read and none is repaired (§9.6), and
the type it reaches storage through has three methods on purpose, the third being
the one a reader choosing *tylko teraz* needs (`src/userscript-storage.ts`).

None of it buys this anything, which is why the section still reads *gone*: a
fight goes on the shelf when it **ends**, and a reload mid-fight arrives while
there is nothing yet to put there. The two are opposite ends of the same page.

A reload therefore drops the fight, the add-on attaches again, and the panel says
so: `Panel wpiął się w trakcie tej walki — to nie są jej pełne liczby.`
(`src/ui/panel-view.ts`), because `isFromFightStart` is false for a session that
never saw an opening payload.

## The game restates the fight

**Production build `53XkBRxF`** (cached 2026-08-25, read 2026-08-26). Inside the
battle update, the branch that draws messages:

```
isset(r.m)){…isset(r.init)&&r.init==`1`&&x.reload(t,n)…for(var l in r.m)x.battleMsg(r.m[l],…)
```

and the function it calls:

```
this.reload=function(n,r){t.clear(),t.battleMsg(`0;0;txt=`+_t(`battle_starts_between %grp1% %grp2%`,…)),t.updateScroll()}
```

The development build `1781609507010` (cached 2026-08-09, read 2026-08-26) reads
the same unminified — `BattleMessages.reload(flist1Join, flist2Join)` under
`data.init == '1'`, then `for (var i in data.m) BattleMessages.battleMsg(...)`.
Production decides; the development build is quoted only because it is legible
(§7.6).

Two facts follow, and together they settle the question:

1. **On an opening payload the client throws its own log away** and rebuilds it
   from `m` alone, under a fresh *battle starts between* header. So what a player
   reads in that window after a reload **is** what arrived on the wire — the
   client has nothing else to draw it from.
2. **Observed by the maintainer, 2026-08-26:** after a reload mid-fight the log
   comes back whole, from the fight's first entry.

Therefore the payload that arrives after a reload carries `init`, the roster,
`myteam` and **every message of the fight so far**. The wire is not where the
numbers are lost.

## What the client does not keep

`forumLog` is the only place the client holds messages beyond the moment it draws
them, and it holds them as rendered Polish prose with the tags stripped and the
ids gone — `self.forumLog.push(wrapper == '' ? tmp2 : …)` in the development
build, the same field minified in production, both read 2026-08-26. It is the
text behind the game's own *copy for the forum* button.

That closes the tempting alternative before anybody builds it: a late attach
cannot read the fight back off the client. It is somebody else's prose (§5) and
it carries nothing to attribute a figure to. **What is not heard when it arrives
is not anywhere.**

## What a restated payload does to the pipeline as it stands

Nothing has to be taught to recognise one. `isFightStart` is `init == 1`
(`src/game/battle-session.ts`), so a post-reload payload resets the session and
rebuilds it from the full log — which is right, not a bug, because that payload
really does carry the fight's start.

| | what happens | verdict |
|---|---|---|
| the session | reset, then filled from the whole restated log | right |
| `isFromFightStart` | true | right — the payload carries the opening |
| `entryHealthByCombatantId` | unwound back through that payload's own messages (`src/core/combatant-health.ts`), which now means the whole fight | right, to within a point — measured below |
| `fightsStarted` | one fight counted twice | harmless, and stated here rather than discovered: it only rescopes the per-fight warnings (§9.6) |

## Measured on the recordings

The claim to check offline is narrower than the one above and is the one the panel
depends on: **does a fight arriving as one restated payload read the same as the
same fight arriving call by call?**

Method, over the recordings held when this was written — every one but
`tests/captured-fights/2026-08-26-luvia-grupa-vs-draugr.json`, which arrived later
the same day and is what the next section is about. For each, a cut is taken halfway
through — a reload happens mid-fight, not at the end — and two runs are compared:

- **live**: every call up to the cut through `getPayloadReading` and
  `composeNextSession`, which is the replay `tools/payload-cost.ts` already does;
- **restated**: one payload, being that recording's opening payload with `m`
  replaced by every message up to the cut and each combatant's health under `w`
  replaced by what they hold at the cut, through the same two functions once.

Both are then read with `composeFightReading` and compared field by field.

| | agreement at the cut |
|---|---|
| per-combatant figures | every recording modelled but `tests/captured-fights/2026-08-14-tempest-grupa-vs-hildur.json` |
| entry health | the same one and `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json` |
| worst gap in a figure | 3 points — `healingGiven` 24 777 against 24 774, which is 0.012% |
| worst gap in entry health | 1 point |

Every disagreement is the same disagreement. Entry health is the ceiling a
restored figure is sized against, health travels as a percentage with two
decimals, and unwinding hundreds of messages at once accumulates a rounding the
live run never had to do in one go — so the baseline moves by a point, and the
only figures that move with it are the ones sized off it, which is healing stated
as a share of a side (§9.6's sizing clause). Damage is untouched, because damage
is stated as a figure and never sized.

⚠️ **Where the model was not the game.** When this measurement was taken no
recording held a real post-reload payload, so the health the restated payload
states is taken from the recorder's own snapshots. One does now — see below — and
the model is not re-run against it: a model and the thing it models are worth
comparing, and the comparison is what the section below is. That stand-in is exact rather than assumed: over the recordings
held on 2026-08-26, every one of the 4 470 statements where a snapshot and the
payload's own `w` both name a combatant's health agrees on both the current figure
and the maximum. What it cannot stand in for is a recording that carries no
snapshots at all — `tests/captured-fights/2026-08-24-tempest-tropiciel-vs-centaury-auto.json`
is one, a fight fought on auto that arrives in a single call, and it is left
unmodelled rather than guessed at.

⚠️ **`w` is keyed by combatant id, not a list.** Written the other way the
substitution above replaces nothing, changes no health, and reports a fight that
agrees with itself — which is what the first run of this measurement did, in
silence. §7.5: read back the result of a scripted edit.

## What only the game could answer, and how it was asked

One reload, with the built userscript installed:

1. enter a fight, take a few hits, reload;
2. read the panel.

`Panel wpiął się w trakcie tej walki` means the payload arrived before our wrap
did. The fight drawn whole, with no warning, means it did not. Pressing the
capture button afterwards puts the payload on disk either way, and
`tools/fight-dump-parser.ts` reads it — a recording whose call 0 carries hundreds
of messages is the restatement, in hand.

### What came back

Done on 2026-08-26, world `luvia`, build `53XkBRxF`, Firefox 154: a fight of ten
against a level-60 Draugr, reloaded mid-battle. The recording is
`tests/captured-fights/2026-08-26-luvia-grupa-vs-draugr.json`, and the maintainer
reversed the sentence that stood here — that such a recording would be read
locally and stay out of `tests/captured-fights/` — on the same day, so it is
material like the rest (§9.2, §4).

What it settles:

- **The restatement is real and it is whole.** Call 0 carries `init`, the roster,
  `myteam` and 212 messages beginning at the opponent's full health, while
  `ladunek.w` states the health as it stood at the reload. The fight's remaining
  275 messages arrive in the call that ends it.
- **The race was won here.** The payload came through our wrap, so `isFightStart`
  is true, the session rebuilt from the whole log, and the panel had no
  `Panel wpiął się w trakcie tej walki` to draw. One observation is not a rule
  about every reload — what it refutes is the assumption that the window is
  always lost.
- **The reading closes.** `tools/fight-report.ts` reads it with no unreadable
  message and no unaccounted healing, and the health witness judges 411
  comparisons in it.

What it does not settle, and this is the one thing the model did not predict:
**the restated payload and the state beside it can disagree.** For one combatant
of the eleven the log runs one `heal_target=222` further than `ladunek.w` does.
The model above substituted a health under `w` that agreed with the log by
construction, so it could not have shown this — and it is what the health witness
now measures rather than skips
(`tests/core/health-witness.test.ts`, `docs/captured-fights.md`).

## What changes if the race is lost

Attach earlier and draw later — not store anything.

- `@run-at document-start` in the banner (`build.ts`), so the search is already
  running before the game's own scripts do. `Engine.battle` cannot be called
  before it is constructed, so from `document-start` the whole remaining window is
  one tick of `LOOK_AGAIN_EVERY_MS` (`src/game/engine-attachment.ts`).
- The panel mounted when there is a `document.body` to mount into, instead of
  before the meter. Today the mount comes first so that early payloads have
  somewhere to draw; the meter holds the fight without a panel and can be asked
  for it (`getReading`), so the order can invert: attach, then draw what already
  arrived.
- A tighter interval for the first seconds, if one tick still loses. One property
  read per tick is what it costs.

Each is its own commit, and none of them is written before the measurement says
which is needed.

## Rejected alternatives

**A saved tape of the fight in `sessionStorage`.** The payloads so far, written
down and replayed on load. It would work, and it is affordable: measured on
`tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json`, the heaviest
recording of the set on 2026-08-26, its payloads come to about 248 kB — and
`composeNextSession` already hands back the session it was given when a payload
changed nothing, so the tape's keep-rule would come free. Rejected because it buys
back only what the game gives back anyway, and charges a stored copy of somebody's
fight, a freshness rule, a validator, and a replay on every page load for it.

⚠️ **Three of those four have since been paid for by something else.** `75096ad`
stores fights, validates them on read and drops rather than repairs what will not
read, and the reader already chooses where and how many. What is not paid for is
the **replay**, and it is the one that costs here: the shelf decodes a fight when
somebody opens it and never before, because ten folded on page load is 20–70 ms of
somebody else's game, while a tape would have to be folded every load whether or
not anybody was going to look. So the rejection stands on one item rather than
four — narrower, and worth more than it looked the morning it was written.

Written down rather than dropped: it is the answer the day the game stops
restating, and `sessionStorage` is the place — per tab, dying with the tab, so no
fight from yesterday and no two tabs of one world writing over each other.

**A property trap on `window.Engine`** at `document-start`, catching the
assignment itself and closing the window to nothing. Rejected while a tighter
search closes it to one tick: it writes on the game's own globals, and §5's
promise is that we read and do nothing else. `[ASK]` if the tick turns out to
lose.

**Reading the log back off the client.** `forumLog`, above. Prose, no ids, not
ours.

**Leaving it as it is.** The honest warning is already drawn, and
`docs/specs/2026-08-10-reading-a-live-fight.md` chose exactly this. What reopens
it is not a change of taste: that decision rests on the fight being gone, and the
fight is not gone.

## What stays open

- Whether every world and every kind of fight restates — the observation is one
  reload, on one world, on 2026-08-26. Auto-fights arrive whole in a call or two
  and may behave differently.
- Whether a very long fight's restated `m` is capped by the server.
- The `fightsStarted` double-count: one fight, two starts, warnings rescoped
  mid-fight. Cheap to leave, cheap to fix, and neither is worth doing before the
  measurement says a reload is being read at all.
