# Picking a capture keeps the panel

Status: implemented

## What was wrong

Picking another capture in the preview strip navigated — `window.location.href =
picker.value` — and a fresh document is a fresh add-on. Three things went with it,
and only the first is obvious:

- **the tab.** `metric` and `team` live in `PanelState` (`src/ui/panel-screen.ts`)
  and the add-on persists neither, so `Otrzymane · Oni` came back as
  `Zadane · Wszyscy`. It survives a rewind only because a rewind is a replay.
- **the panel window.** Position and minimized state *are* persisted — into a
  store the preview deliberately gives no lifetime. The page takes both browser
  stores away before the bundle runs, so a visitor to the published preview is not
  left holding somebody's demo fight
  (`docs/audits/2026-08-26-the-whole-tree-read-a-fifth-time.md`, F7). Kept as a
  feature; it also means every reload starts from nothing.
- **the fight.** The picker's address ends `&entry=0`, so a pick landed on the
  empty panel and the reader replayed by hand.

Read against `tests/captured-fights/` and the panel, 2026-08-27.

## What was decided

**Picking a capture is a replay, not a page** — on the caller that has a process
to answer one. `tools/preview-server.ts` grows a `/payloads?fight=<name>` route,
each fight link carries a `payloadsAddress` beside its `address`, and the page
fetches the picked capture and feeds it into the document already open. Nothing is
torn down, so the tab, the panel window and the settings survive by construction
rather than by being restored.

Four things fell out of it, each with a cost if got wrong:

- **The stub engine has to be emptied.** It merges every roster it is handed and
  never clears, and `src/game/engine-roster.ts` reads exactly that map — so
  without it the fight left behind is drawn as rows of the fight arriving, under
  its own combatants' names and with plausible figures. Nothing in a game ever
  switches fights this way, so nobody would have guessed it from the panel.
- **A pick lands on the finished fight**, where a page the server opens
  deliberately starts before the first payload: a capture somebody chose is one
  they want counted.
- **⏮ stops reading the address.** It reloads, because the panel before any
  payload is the one state a replay cannot reach — and after a pick the address
  names a capture nobody is looking at. It now opens the page of the capture on
  screen instead, with the same `#start` hash.
- **A fetch nothing answers navigates to that capture's own page.** The server can
  be stopped between two clicks. The fallback costs exactly the state this exists
  to keep, and a picker that moved and did nothing costs more.

The published site is unchanged: its links carry `payloadsAddress: null`, so a
pick there is the navigation it always was, and `nic tu nie zostaje` still holds.

**Measured in a real browser** — Firefox 140.13.0esr, 2026-08-27, over the
development server. With the panel minimized and `Oni` chosen, picking
`2026-08-26-luvia-grupa-vs-draugr` from
`2026-08-24-tempest-tropiciel-vs-centaur` left the same shadow root in place
(`shadowRoot === shadowRoot`), the panel still minimized with
`margometer.panel-collapse` still stored, `Oni` still selected when it was opened
again, the rows those of the capture picked, and the address bar untouched.

## Rejected alternatives

**Back the harness store with real `sessionStorage`, and let the reload restore
the panel.** It brings back the position, the minimized state and the settings —
and not the tab, which the add-on does not persist at all, so the loudest half of
the complaint would have survived the fix. It also puts a decision about the
published page back on the table for the sake of a development harness. Its one
real advantage is unclaimed and stays open: it would fix the *other* two reloads,
a hot rebuild and ⏮, which this does not.

**Persist `metric` and `team` in the add-on.** Then any reload keeps the tab,
here and in the game. It is a change to what the shipped add-on stores, made for
a harness's convenience, and §4 puts that behind an ask — a decision about the
product rather than about the preview.

**Publish a JSON file per capture so the site could switch in place too.** It
doubles what Pages carries — every capture is already inlined in its own page —
to replace a control that works there, and a page per fight is the thing somebody
sends somebody else.

**Inline every capture in every page.** 16 MB of material per page, for a
directory of 28 recordings.
