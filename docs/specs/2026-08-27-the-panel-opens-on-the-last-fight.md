# The panel opens on the last fight it kept

Status: implemented

A page load left the panel saying *nie było jeszcze walki* while twenty finished
fights sat in the store behind it. `composePanelMount` opened with nothing in
hand, so the first body a reader met after every reload was the waiting sentence
— and the way to the fight they had been reading a minute earlier was a button, a
screen and a press.

The shelf already held everything needed. `composeFightKeeper` reads the fights
out of the store when it is built, and `onFightChosen` already folds one and
keeps the reading. What was missing was somebody asking it before a payload
arrived.

## What was asked for

> Show the latest saved battle after a reload

Three readings of that lead to three different panels, so the three were put to
the maintainer on 2026-08-27 and answered:

| Dial | Decided |
|---|---|
| Which fight it opens on | **The one that was on screen**, and the newest kept where nothing was. Answered second, when the first shape opened on the newest whatever the reader had been reading. |
| What happens when the next fight starts | **The live fight takes the screen** on its first payload, and the levels below the ranking drop as they do at any fight start. |
| How the reader can tell it is an old fight | **The `Walki` row is marked.** No new wording, no new state. |
| When the fold is paid | **At the mount, always** — one fight, whatever state the panel was left in. |

## The rule, in one place

The fight the panel opens on is the one that was on screen when the last page
went away, and only while **no payload has arrived and the reader has chosen
nothing**:

```ts
const getOpeningFight = (live: FightReading | null): KeptFight | undefined => {
  if (live !== null || chosenId !== null) return undefined;
  return fights.find((held) => held.id === shownId) ?? fights[0];
};
```

`shownId` is an id under `margometer.shown-fight`, kept where the settings and
the panel's position are kept rather than beside the fights — for the reason that
block already gives: an answer stored in the place it names is unreadable the
moment somebody chooses the place that forgets. A pointer at a fight the rotation
has since dropped falls back to the newest, which is the answer a reader who
picked nothing gets, rather than an empty panel over a shelf holding fights.

Both halves of the feature read that one predicate (`src/userscript-entry.ts`):
`getOpeningReading` is what the mount draws, and the row rule in `getFights` is
what marks it on the shelf. Written twice they could disagree, and the shape of
the disagreement is a shelf marking a row the panel is not showing — which is
worse than marking nothing, because it is an answer rather than a silence.

Everything else falls out of the same condition. A payload arrives: the live
fight is a row, the predicate stops answering, the mark moves and the panel
follows the payloads. The reader chooses a fight: `chosenId` names it, the
predicate stops answering, and the mark is on their choice because their choice
is what is on screen.

## What was on screen, not what was chosen

Three moments write the pointer, and the third is the one that is easy to leave
out:

| Moment | What is remembered |
|---|---|
| The reader picks a fight off the shelf | that fight |
| The reader picks the live row | nothing |
| **A payload takes the screen** | nothing |

Without the third, a single pick would be answered for ever: the reader opens a
fight once, fights all evening, and every page load puts that one fight back in
front of them. It is the mount that says so (`setLiveShown`), because the shelf is
asked nothing while somebody is watching a fight — the moment a payload takes the
screen is visible where the payload is and nowhere else. It costs a comparison per
payload and one write.

A browser refusing that write costs a panel that opens on the newest fight
instead of the one somebody was reading. Nothing is lost and nothing moves, so it
is not acted on and not reported — §9.6's quiet, the same shape as the panel's
position and its collapse. That is a different case from the storage choice
beside it, where a refused write would leave the reader's fights somewhere the
add-on never opens again.

## Drawn, and still not chosen

The restored fight is drawn while the panel is **following the live fight**, and
that is the point rather than an oversight. A reader who reloads did not ask for
that fight; they asked for the panel, and this is the most recent thing it can
honestly put in it. So the next payload wins, and a damage meter never shows
yesterday's numbers during a fight.

A fight the reader picks off the shelf **on this page** is the opposite case and
is untouched: `onFightChosen` clears the following, and payloads accumulate
behind their screen until they choose the live row again. What does not survive a
reload is that following — the fight comes back, the refusal to leave it does
not, and walking into a fight puts the reader on it. Asked and answered on
2026-08-27: *"only when they enter a fight should it give them the current one"*.

The flag that decides this was called `isShowingLive` and is now
`isFollowingLive`. The old name stopped being true the moment a kept fight could
be drawn under it; the new one says what it always decided — whose fight the
**next** payload belongs on screen.

## What it costs

One fold on a page load: 0.1–7.0 ms, worst on the 603-message 11-a-side
recording, measured in `docs/specs/2026-08-26-a-fight-you-can-go-back-to.md` and
unchanged by this. It is the same fold the reader already pays for by opening a
fight by hand, moved to the moment the panel is built. The other nineteen fights
are still folded only when one of them is opened, and the shelf's own rows still
need no folding at all — a row is a time, a headcount and an outcome, and all
three are in the stored fight.

## Rejected alternatives

**Always the newest kept fight, whatever was on screen.** The first shape of this,
and it answers a question the reader had already answered: picking a fight and
reloading put them back on a different one. Kept as the fallback, where the fight
they were reading is no longer held.

**Remembering that the fight was *chosen*, and not only which it was.** A reload
would then leave the panel refusing to follow the live fight, and the reader
would have to know about a gesture to get their meter back — the freezing this
whole behaviour is bounded against, one page removed.

**Clearing the pointer when a fight is kept**, rather than when one takes the
screen. Cheaper — the keeper is already told — and wrong for the reader who picks
a fight and keeps reading it while a fight goes by: their screen never changed,
and the pointer would have.

**Leaving the restored fight on screen until the reader picks the live row.**
Consistent with what a fight chosen by hand does, and rejected on what it does to
somebody who forgets: the panel would be frozen for a whole fight, counted and
never seen, and the state it froze in is the one every page load starts from.

**Taking the screen only if the reader has clicked nothing since the reload.** It
buys the reader who is mid-read, and it pays with a rule nobody can see: the same
payload does two different things depending on a history the screen does not
show.

**Saying nothing about which fight it is.** Cheapest, and it leaves the shelf
marking no row while a fight is on screen — the panel would be showing something
it could not name.

**The fight's clock in the header**, beside the outcome and the place. The answer
where the numbers are rather than a screen away, and a wider change than this:
a field through `PanelReading`, new Polish wording and its guards — and it
changes what *every* kept fight's header says, which is a separate decision about
the header rather than about the reload.

**Opening on the `Walki` screen** instead of on a fight. Nothing would pretend to
be the present, and it is not what was asked for: it costs a press after every
reload to reach the fight the reader wanted.

**Folding only when the panel was left open.** A panel left collapsed draws no
body, so the fold is spent on nothing — a real saving, and it buys a second
moment at which a restore can happen, for a cost measured in single-digit
milliseconds once per page.

**Deferring the fold past a timer.** The page load would not wait, and the reader
would watch *nie było jeszcze walki* flip to a fight. A visible flicker, and a
clock in a file that has none.
