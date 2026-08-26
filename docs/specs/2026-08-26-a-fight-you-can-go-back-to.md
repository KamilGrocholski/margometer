# A fight you can go back to

Status: draft

The panel holds one fight: the one happening now. When the next one opens, the
session resets (`src/game/battle-session.ts`) and everything the previous fight
came to is gone — not written anywhere, not reachable, not comparable with what
follows it. A player who wants to know whether that last run was better than the
one before has to have kept a screenshot.

This is the list's answer to that, and it is three dials rather than one feature:
**what is kept, how many, and where.**

## What was asked for

> Create options for: saving selected fights; keeping the last N fights; use
> localStorage/sessionStorage/memory

Three readings of that line lead to three different add-ons, so the three were
put to the maintainer on 2026-08-26 and answered:

| Dial | Decided |
|---|---|
| How a kept fight is reached | **A screen of its own**, `Walki`, opened from the title bar. Picking a row leaves the list and shows that fight in the panel's ordinary screens. |
| What "saving selected" means | **A pin the rotation respects.** Every finished fight is kept up to the limit; pinning one exempts it from being evicted. Nothing is lost by forgetting to press anything. |
| Where it is kept | **The player's choice of three**, defaulting to `localStorage`. |

## Where the add-on stands today

One fight, in closure variables inside `setMargoMeter`, folded again on every
payload (`src/userscript-entry.ts`). The panel holds one `FightReading` and the
screens are cuts of it. The only thing this add-on has ever written down is where
the panel was dragged to — tens of bytes under `margometer.panel-position`,
validated on read (§9.6), reached through an injected type with exactly two
methods on it. That type is the seam this round widens, and it is deliberately
the smallest surface in the file.

Nothing else survives a page. `docs/specs/2026-08-26-the-game-says-the-fight-again.md`
settled the neighbouring question — a **reload** does not need a store, because
the server restates the whole fight in one payload — and explicitly left this one
open. The two must not be confused: that spec is about not losing the fight you
are in, this one is about going back to a fight that is over. The game restates
the first and never the second.

## What is written down

A fight is kept as **the inputs the session accumulated**, not as the numbers it
came to and not as the payloads it arrived in:

| Field | Where it comes from | Why it is here |
|---|---|---|
| `messages` | the session | the fight. 94–97% of the stored bytes |
| `combatants` | the merged roster fragments | ids resolve to nobody without it |
| `ourSide` | the opening payload | stated once, on `init`, and unknowable afterwards |
| `isFromFightStart` | the session | a restored fight must not claim to be whole when it was joined late |
| `entryHealthByCombatantId` | the session | see the trap below |
| the three gap counters | the session | see the second trap below |

Restoring is then the path that already exists: decode the messages against the
roster and fold them (`composeFightStatistics`), which is what
`composeFightReading` does live. A restored fight is the same kind of value the
panel is handed today, so **every screen, drill level and detail card works on
one without being told**.

⚠️ **The entry health is stored, not re-derived, and re-deriving it is the
tempting mistake.** It is the one field here that is a reading rather than a
statement — the health each combatant entered with, unwound back through the
opening payload's own messages (`src/core/combatant-health.ts`) — and the unwind
is only correct against **that payload's** slice of events. A restore that re-ran
it against the whole fight would be unwinding hundreds of messages at once, which
is exactly the arithmetic the reload spec measured drifting: the baseline moves by
a point, and every figure sized against it moves with it. Live, this is taken once
on the opening payload and never touched again; stored, it is copied for the same
reason. Storing the stated health and the opening message count instead would keep
the tape one step rawer and put a second place in the tree deciding what somebody
entered a fight with — and §9.3's rule is that a name we did not choose is spelled
once.

⚠️ **A restored fight must not read cleaner than the live one did.**
`unreadablePayloadsByFault`, `lostMessages` and `unreadableCombatants` are
observations about what never reached the decoder, and they cannot be recovered
from the messages — the messages are what *did* arrive. Dropped from the tape, a
fight with a payload we could not read comes back with no warning on it, which is
§9.6's failure in its purest form: a number that might be wrong looking exactly
like one that is right.

### Measured

Over the 25 recordings held in `tests/captured-fights/` on 2026-08-26, each
replayed through `getPayloadReading` and `composeNextSession` the way
`tools/payload-cost.ts` does, then measured as JSON:

| Shape | Median | Worst | All 25 |
|---|---|---|---|
| the payloads, as they arrived | 108 kB | 214 kB | 2 329 kB |
| **the tape above** | **34 kB** | **44 kB** | **697 kB** |
| the numbers it comes to | 20 kB | 22 kB | — |

The worst is `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json`, an
11-a-side fight of 603 messages. Ten of those — a limit nothing would ever reach
in practice, since it assumes every fight is the heaviest one ever recorded —
come to 434 kB.

Two things follow. The payload tape costs five times the bytes for nothing: a
payload restates the whole battle object on every call, and the session has
already thrown that away. And **the numbers are the smallest of the three**, which
is the one measurement here that argues against the choice made — see the rejected
alternatives.

Replaying one recording end to end costs **0.1 ms to 7.0 ms**, worst on the same
file, on the machine this was measured on. That is why fights are decoded **when
one is opened** and not when the page loads: the list itself needs no decode at
all.

## What a row in `Walki` says

The time, the sizes of the two sides, the outcome, and whether it is pinned:

```
‹ Walki
▸ teraz · 4v4 · trwa
▸ 21:04 · 4v4 · wygrana
★ 20:51 · 1v1 · przegrana
▸ 20:33 · 11v11 · wygrana
```

Every one of those is readable off the stored tape without decoding it: the sides
come from `combatants`, the outcome is a figure the protocol **stated** and is
kept beside the tape as such (`src/core/fight-statistics.ts` reads it out of a
`fight-outcome` event), and the time is when the fight was written down. The live
fight is the first row and is not stored — it is the reading the panel already
holds.

The words are Polish (§3), and they are the panel's rather than the game's: what a
row says is *when, how big, how it ended*, never a key of the protocol's.

## When a fight is kept

**When it is over, and never while it is running.** The payload that first states
an outcome is what writes it; a fight that ends without one is written on the
boundary where the next fight opens, which is the only other moment the session
can be sure it has everything.

The rejected rule is writing continuously, and it is worth saying why: it costs a
synchronous write of tens of kilobytes every few seconds in front of somebody who
is playing, and it buys back only the fight a player abandoned by closing the tab
— which is the one case where nobody is left to read it.

⚠️ **A fight interrupted by a reload is not lost by this.** The game restates it
whole, so the session rebuilds and the outcome, when it comes, is stated over a
complete fight. That is the reload spec's finding doing work here.

## Where it is kept, and what it costs the game

The three places, as the reader meets them:

| Choice | What it means |
|---|---|
| `localStorage` | Fights survive closing the tab and the browser. The default. |
| `sessionStorage` | Fights live as long as the tab does. Two tabs of one world cannot write over each other. |
| memory | Nothing leaves the page. Fights survive switching between them and nothing else. |

⚠️ **The game shares this quota, keeps everything under one key, rewrites it whole
on every change, and does not catch a refusal.** Production build `53XkBRxF`
(cached 2026-08-25, read 2026-08-26):

```
var Storage=new(function(){var t=localStorage,n=`Margonem`,r=null,i=this,
a=function(){t.setItem(n,JSON.stringify(r))};…
this.set=function(t,n){…s[i[0]]=n,a()}
```

Every `Storage.set` — a setting changed, a window moved — serialises the client's
entire blob and writes it, with no `try` anywhere near it. So an add-on that fills
the origin's quota does not merely fail to save its own fights: it makes the
**game's** next write throw, inside the game's own call stack, losing everything
that write carried. That is the one promise §5 makes, broken by a store.

Three things follow, and all three are requirements rather than preferences:

1. **The quota is never assumed.** No number is written down for it — it differs
   by engine, by profile and by how much the origin already holds — so the write
   is the measurement. A refusal is caught, the oldest unpinned fight is dropped,
   and the write is tried again.
2. **If it still refuses, the add-on stops keeping and says so** on the row where
   the consequence is, in the reader's own words. Silence here would be a `Walki`
   screen that quietly stopped growing (§9.6).
3. **A budget below the ceiling**, so the eviction above is a safety net rather
   than the normal path — the limit `N` is what a reader sets, and the byte
   budget is what stops a pathological fight from spending the origin.

The maintainer chose `localStorage` as the default on 2026-08-26 with the above
stated. The concern is not that the mechanism is unsafe — it is caught, evicted
and reported — but that it is the only one of the three whose failure mode reaches
the game at all, and it is the default. `sessionStorage` was the alternative and
is one setting away.

## Validated on read

§9.6: panel state that survives a reload is validated on read, and this is a great
deal more state than a pair of coordinates. Anything read back is checked against
the shape above — a stored fight that will not read is **dropped, not repaired**,
because a half-read fight draws numbers nobody can place. Reading gives `null` and
throws nothing (§9.5); the caller decides, and here the decision is to forget it.

The store also carries the add-on's version. A fight kept by an older build is
read only where the shape still matches; where it does not, it is dropped rather
than migrated. Migration is a promise about every past shape, and this is a
convenience.

## Nicknames

A stored fight holds player nicknames — in `combatants`, and inside the messages.
`NOTICE.md`'s promise, and the intake tool that keeps it, are about what enters
**this repository**; a browser store is the player's own machine and their own
fight. Nothing here is sent anywhere (§5). Said out loud because the two are
easily confused, and because a reader choosing `localStorage` is choosing to leave
other players' names on disk until the rotation drops them.

## What lands, and in what order

Each is its own commit, each leaves the gate green (§3), and the first three ship
something a reader can see:

1. The kept-fight shape and the rotation, pure, in `src/core/` — the keep rule
   (last N, pinned exempt), the stored text both ways, validation on read. No DOM,
   no storage, no panel.
2. The storage seam at the `src/` root, beside `src/userscript-instrument.ts` —
   three backends behind one type, the quota-aware write, and the refusal.
   `src/core/` may not reach storage and `src/ui/` may not reach a global (§9.1),
   so this is the entry point's layer.
3. The `Walki` screen: the screen axis on `PanelState`
   (`src/ui/panel-screen.ts`), the list composed in `src/ui/panel-view.ts`, drawn
   in `src/ui/panel-element.ts`, worded in `src/ui/panel-words.ts`, and the title
   bar's button.
4. The two options at the head of that screen — where to keep, and how many.
5. `docs/browser-support.md` gains its rows. The DOM half of that register is the
   half nothing enumerates, and this round widens the add-on's storage surface
   from two method calls to a subsystem.

## Rejected alternatives

**Storing the numbers instead of the messages.** The smallest of the three shapes
measured — 20 kB against 34 — and rejected anyway, for three reasons that compound.
It is the data contract (§4), so every figure added to `src/core/fight-statistics.ts`
would silently divide old fights from new ones. A fix to the decoder would never
reach a fight already kept, so two fights read on the same screen could be read by
two different meters. And it is derived: §9.2 keeps computed numbers out of
material for exactly this reason, and while a browser store is not evidence, the
argument that a total is a reading rather than a fact does not change with the
medium.

**Storing the payloads as they arrived.** Five times the bytes, and it buys back
only what `composeNextSession` already discarded on purpose. Its one advantage —
a restore that goes through the identical live path, faults and all — is bought
more cheaply by storing the fault counters, above.

**Writing the live fight continuously.** Above. The cost is real and the case it
covers has nobody in it.

**A strip of fights above the tabs**, instead of a screen. Cheaper — one more axis
on the state, no new screen kind — and put to the maintainer, who chose the screen:
a row has room to say when, how big and how it ended, and a strip has room for a
number.

**Keeping nothing unless the reader presses save.** Also put to the maintainer and
also rejected. The failure mode is the one that cannot be fixed afterwards: the
fight worth keeping is only known to have been worth keeping once it is over, and
by then a player who did not press is looking at the next one.

**IndexedDB.** A larger quota and an asynchronous API, which is the problem: every
read becomes a promise the panel has to draw around, and §7.1 says nothing exists
before it is needed. The measured worst case is 44 kB a fight. Revisit it the day
a reader wants a hundred fights.

**Compressing the tape.** 97% of it is protocol messages, which repeat heavily and
would compress well. Rejected for now on §7.1: it is an optimisation against a
budget nothing has yet hit, and it puts a codec of ours between a fight and the
reader — one more thing that can be the reason a fight will not read back.

**One place, no option.** `sessionStorage` alone is the safest add-on and the
smallest surface. The list asked for the option; the option is what lets a player
choose the safe one knowingly rather than have it chosen for them.

## What stays open

- **What `N` defaults to.** Nothing here measures how many fights a player wants
  to compare. A number will be picked and it will be a guess until somebody uses
  it.
- **Whether a fight can be deleted from the list**, as against evicted by the
  rotation. Nothing in the three answers covers it.
- **Whether an unfinished fight is ever keepable** — a fight abandoned by closing
  the tab is currently lost, by the rule above.
- **What a pinned fight does when every slot is pinned.** The rotation has nothing
  to evict, and the two honest answers — refuse the new fight, or refuse the pin —
  are different promises to the reader.
- **Whether the game's blob and ours should be sized against each other.** The
  quota is shared and the game's usage is not observable from a userscript, so the
  budget is set blind. `[ASK]` before it grows.
