# A fight you can go back to

Status: implemented

The panel holds one fight: the one happening now. When the next one opens the
session resets and everything the previous fight came to is gone. This is the
shelf that answers that — what is kept, where, which fight the panel opens on
after a reload, and what a reload does to a fight still running.

Four rounds between 2026-08-26 and 2026-08-27 arrived at this.

---

## 1. What a reload does, and what it does not

**After a reload the server states the whole fight again, in one payload.** What
is lost is lost by us, in the gap between the page loading and our wrap going on
— not by the game.

Production build `53XkBRxF` (cached 2026-08-25, read 2026-08-26), inside the
battle update, the branch that draws messages:

```
isset(r.m)){…isset(r.init)&&r.init==`1`&&x.reload(t,n)…for(var l in r.m)x.battleMsg(r.m[l],…)
```

The development build `1781609507010` (cached 2026-08-09, read 2026-08-26) reads
the same unminified — `BattleMessages.reload(...)` under `data.init == '1'`, then
`for (var i in data.m) BattleMessages.battleMsg(...)`. Production decides; the
development build is quoted only because it is legible (§7.6).

So a fight interrupted by a reload is **not** lost by the shelf: the session
rebuilds from the restatement and the outcome, when it comes, is stated over a
complete fight. A fight goes on the shelf when it **ends**, and a reload mid-fight
arrives while there is nothing yet to put there. The two are opposite ends of the
same page.

⚠️ **Still open:** whether every world and every kind of fight restates. The
observation is one reload, on one world, on 2026-08-26. Auto-fights arrive whole
in a call or two and may behave differently. Also unmeasured: whether a very long
fight's restated `m` is capped by the server.

## 2. What is written down

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

Restoring is the path that already exists: decode the messages against the roster
and fold them, which is what `composeFightReading` does live. A restored fight is
the same kind of value the panel is handed today, so **every screen, drill level
and detail card works on one without being told**.

⚠️ **The entry health is stored, not re-derived, and re-deriving it is the
tempting mistake.** It is the one field here that is a reading rather than a
statement, and the unwind is only correct against **that payload's** slice of
events. A restore that re-ran it against the whole fight would be unwinding
hundreds of messages at once: the baseline moves by a point, and every figure
sized against it moves with it. Live, this is taken once on the opening payload
and never touched again; stored, it is copied for the same reason.

⚠️ **A restored fight must not read cleaner than the live one did.**
`unreadablePayloadsByFault`, `lostMessages` and `unreadableCombatants` are
observations about what never reached the decoder, and they cannot be recovered
from the messages — the messages are what *did* arrive. Dropped from the tape, a
fight with a payload we could not read comes back with no warning on it, which is
§9.6's failure in its purest form.

### Measured

Over the 25 recordings held on 2026-08-26, each replayed through
`getPayloadReading` and `composeNextSession`, then measured as JSON:

| Shape | Median | Worst | All 25 |
|---|---|---|---|
| the payloads, as they arrived | 108 kB | 214 kB | 2 329 kB |
| **the tape above** | **34 kB** | **44 kB** | **697 kB** |
| the numbers it comes to | 20 kB | 22 kB | — |

The worst is `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json`, an
11-a-side fight of 603 messages. Replaying one recording end to end costs
**0.1 ms to 7.0 ms**, worst on the same file. That is why fights are decoded
**when one is opened** and not when the page loads.

## 3. Three dials, and the one that was taken back

| Dial | Decided |
|---|---|
| How a kept fight is reached | **A screen of its own**, `Walki`, opened from the title bar |
| What "saving selected" means | **A pin the rotation respects.** Every finished fight is kept up to the limit; pinning one exempts it from eviction. Nothing is lost by forgetting to press anything. |
| Where it is kept | **The player's choice of three**, defaulting to `localStorage` |
| How many are kept | **Fixed at twenty.** Asked for as a strip of four numbers and taken back the same day |

**The strip had no consequence a reader could see.** Every one of the four numbers
fits the byte budget with room to spare, so what it changed was how soon a fight
nobody pinned disappeared — a thing somebody finds out by losing one. Against that
it cost a row of the shelf's own height, on a panel 260px wide. The ceiling that
actually binds is the megabyte budget, which turns a fight away one at a time and
**says so on the screen**: a limit the reader sets is silent, and a budget refusing
a write is not.

## 4. What a row says

```
‹ Walki
▸ teraz · 4v4 · trwa
▸ 21:04 · 4v4 · wygrana
★ 20:51 · 1v1 · przegrana
▸ 20:33 · 11v11 · wygrana
```

Every one of those is readable off the stored tape **without decoding it**: the
sides come from `combatants`, the outcome is a figure the protocol stated and is
kept beside the tape as such, and the time is when the fight was written down. The
live fight is the first row and is not stored.

The words are Polish (§3) and they are the panel's rather than the game's: what a
row says is *when, how big, how it ended*, never a key of the protocol's.

## 5. Storage, and what it costs the game

| Choice | What it means |
|---|---|
| `localStorage` | Fights survive closing the tab and the browser. The default. |
| `sessionStorage` | Fights live as long as the tab does. Two tabs of one world cannot write over each other. |
| memory | Nothing leaves the page. |

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

Three requirements follow:

1. **The quota is never assumed.** No number is written down for it — it differs
   by engine, by profile and by how much the origin already holds — so the write
   is the measurement. A refusal is caught, the oldest unpinned fight is dropped,
   and the write is tried again.
2. **If it still refuses, the add-on stops keeping and says so** on the row where
   the consequence is, in the reader's own words.
3. **A budget below the ceiling**, so the eviction above is a safety net rather
   than the normal path.

The maintainer chose `localStorage` as the default with the above stated. The
concern is not that the mechanism is unsafe — it is caught, evicted and reported —
but that it is the only one of the three whose failure mode reaches the game at
all, and it is the default. `sessionStorage` is one setting away.

**Validated on read** (§9.6). A stored fight that will not read is **dropped, not
repaired**, because a half-read fight draws numbers nobody can place. The store
carries the add-on's version; a fight kept by an older build is read only where
the shape still matches, and migration is a promise about every past shape.

**Nicknames.** A stored fight holds them, in `combatants` and inside the messages.
`NOTICE.md`'s promise is about what enters **this repository**; a browser store is
the player's own machine and their own fight, and nothing here is sent anywhere
(§5). Said out loud because a reader choosing `localStorage` is choosing to leave
other players' names on disk until the rotation drops them.

## 6. Which fight the panel opens on

The fight that was on screen when the last page went away, and only while **no
payload has arrived and the reader has chosen nothing**:

```ts
const getOpeningFight = (live: FightReading | null): KeptFight | undefined => {
  if (live !== null || chosenId !== null) return undefined;
  return fights.find((held) => held.id === shownId) ?? fights[0];
};
```

`shownId` is kept where the settings and the panel's position are kept rather than
beside the fights: an answer stored in the place it names is unreadable the moment
somebody chooses the place that forgets. A pointer at a fight the rotation has
dropped falls back to the newest.

Both halves read that one predicate — `getOpeningReading` is what the mount draws,
and the row rule in `getFights` is what marks it on the shelf. Written twice they
could disagree, and the shape of the disagreement is a shelf marking a row the
panel is not showing, which is worse than marking nothing.

Three moments write the pointer, and the third is easy to leave out:

| Moment | What is remembered |
|---|---|
| The reader picks a fight off the shelf | that fight |
| The reader picks the live row | nothing |
| **A payload takes the screen** | nothing |

Without the third, a single pick would be answered for ever: the reader opens a
fight once, fights all evening, and every page load puts that one fight back in
front of them.

**Drawn, and still not chosen.** The restored fight is drawn while the panel is
*following the live fight*, so the next payload wins and a damage meter never
shows yesterday's numbers during a fight. A fight the reader picks off the shelf
**on this page** is the opposite case: `onFightChosen` clears the following. What
does not survive a reload is that following — the fight comes back, the refusal to
leave it does not. The flag was called `isShowingLive` and is now
`isFollowingLive`, which says what it always decided: whose fight the **next**
payload belongs on screen.

A browser refusing the pointer write costs a panel that opens on the newest fight
instead of the one somebody was reading. Nothing is lost and nothing moves, so it
is not acted on and not reported — §9.6's quiet.

## 7. Picking a capture in the preview keeps the panel

Not part of the shipped add-on, and here because it is the same question asked of
the harness. Picking another capture used to navigate, and a fresh document is a
fresh add-on: the tab, the panel window and the fight all went with it.

**Picking a capture is a replay, not a page.** `tools/preview-server.ts` has a
`/payloads?fight=<name>` route, each fight link carries a `payloadsAddress`, and
the page feeds the picked capture into the document already open.

Four things fell out of it:

- **The stub engine has to be emptied.** It merges every roster it is handed and
  never clears, so without it the fight left behind is drawn as rows of the fight
  arriving — under its own combatants' names and with plausible figures. Nothing
  in a game ever switches fights this way, so nobody would have guessed it.
- **A pick lands on the finished fight**: a capture somebody chose is one they
  want counted.
- **⏮ stops reading the address.** It reloads, because the panel before any
  payload is the one state a replay cannot reach.
- **A fetch nothing answers navigates to that capture's own page.**

The published site is unchanged: its links carry `payloadsAddress: null`.

Measured in a real browser — Firefox 140.13.0esr, 2026-08-27 — the same shadow
root stayed in place across a pick, the panel stayed minimized, `Oni` stayed
selected, and the address bar was untouched.

## Rejected alternatives

**Storing the numbers instead of the messages.** The smallest of the three shapes
measured — 20 kB against 34 — and rejected for three reasons that compound. It is
the data contract (§4), so every figure added would silently divide old fights
from new ones. A fix to the decoder would never reach a fight already kept, so two
fights on one screen could be read by two different meters. And it is derived.

**Storing the payloads as they arrived.** Five times the bytes, and it buys back
only what `composeNextSession` already discarded on purpose.

**Writing the live fight continuously.** A synchronous write of tens of kilobytes
every few seconds in front of somebody who is playing, buying back only the fight
a player abandoned by closing the tab — the one case where nobody is left to read
it.

**A tape of the running fight in `sessionStorage`.** Rejected because the game
gives the fight back anyway. ⚠️ Three of its four costs have since been paid by
the shelf; the one that is not paid is the **replay**, and it is the one that
costs: the shelf decodes a fight when somebody opens it and never before, because
ten folded on page load is 20–70 ms of somebody else's game. Written down rather
than dropped — it is the answer the day the game stops restating.

**A property trap on `window.Engine`** at `document-start`. It writes on the
game's own globals, and §5's promise is that we read and do nothing else. `[ASK]`
if the tighter search turns out to lose.

**A strip of fights above the tabs**, instead of a screen. Put to the maintainer,
who chose the screen: a row has room to say when, how big and how it ended, and a
strip has room for a number.

**Keeping nothing unless the reader presses save.** The failure mode cannot be
fixed afterwards: the fight worth keeping is only known to have been worth keeping
once it is over.

**Always the newest kept fight, whatever was on screen.** It answers a question
the reader had already answered. Kept as the fallback.

**Leaving the restored fight on screen until the reader picks the live row.** The
panel would be frozen for a whole fight, counted and never seen, and the state it
froze in is the one every page load starts from.

**IndexedDB.** A larger quota and an asynchronous API, which is the problem: every
read becomes a promise the panel has to draw around. The measured worst case is
44 kB a fight.

**Compressing the tape.** 97% of it is protocol messages, which would compress
well. An optimisation against a budget nothing has yet hit, and it puts a codec of
ours between a fight and the reader.

## What stays open

- **Whether a fight can be deleted from the list**, as against evicted.
- **Whether an unfinished fight is ever keepable** — one abandoned by closing the
  tab is currently lost.
- **What a pinned fight does when every slot is pinned.** The two honest answers —
  refuse the new fight, or refuse the pin — are different promises to the reader.
- **Whether the game's blob and ours should be sized against each other.** The
  quota is shared and the game's usage is not observable from a userscript, so the
  budget is set blind. `[ASK]` before it grows.
- **The `fightsStarted` double-count** on a reload: one fight, two starts.
