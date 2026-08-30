# 0028. A preview opens on one finished fight, and the panel's state rides in the address

- **Status:** Accepted
- **Date:** 2026-08-30

## Context

Three things about the preview were decided by accident rather than on purpose.

**Which fight it drew** was `getNewestRecordedFight` — the last name in a sorted directory. Every
recording admitted moved it, so the served page, the published site and the screenshots all changed
subject on an intake that had nothing to do with any of them. That is the open line in `TODO.md`.

**Where it opened** disagreed with itself: the published pages opened on the finished fight, the
served page on entry `0` and therefore on an empty panel, from one file that composes both.

**What it kept** was the entry and nothing else. A rebuild reloads the page (`ADR 0017`), and the
page takes both browser stores away before the bundle runs, so every reload put the panel back in
its default place, unfolded, on its first screen. Reading a change to `src/ui/` cost a drag, a fold
and a tab press each time round.

Measured over `captures/` with `deno task figures` on 2026-08-30, the recordings differ by more than
their size: `2026-08-27-luvia-grupa-vs-amaimon` announces 33 distinct skills over 18 elements, with
healing on all eleven combatants and a prevented figure on five of them, in 285 KB and 15 engine
calls. `2026-08-27-luvia-grupa-vs-amaimon-2` carries 111 calls — a finer step — over 28 skills, 8
healed combatants and 1.5 MB.

## Decision

**One recording is named, and every preview opens on it.** `PREVIEW_FIGHT_NAME` in
`tools/recorded-fights.ts` is what the server opens on, what the site lands on, and what the
screenshots are taken over. A set without it is a refusal rather than a quiet substitution.

**A preview opens on the finished fight.** The served page joins the published one: an address that
names no entry means the whole of it. The empty panel stays one press away, which is what `to start`
is for.

**What the panel is showing rides in the address.** The harness reads the hash before the bundle
runs and hands the forgetting store what it carried, so the add-on comes up already knowing where it
was put and whether it was folded; the screen is pressed back after the replay; and the hash is
rewritten after every `pointerup`. A rebuild, a hand reload, and a fight chosen on the published
site all keep the panel as it stood.

**The address carries what fits and nothing more.** A value over `STATE_VALUE_MAXIMUM` never travels
and the whole payload is dropped over `STATE_TEXT_MAXIMUM`, so the shelf — which is fights, not
settings — cannot end up in an address.

**Nothing is kept.** No store outlives the page, and a first visit with no hash is a first visit:
what `ADR 0017` promised a visitor still holds.

## Consequences

Easy: reading a change to `src/ui/` without setting the panel up again, and a site whose landing
page stops moving when a recording is admitted. A picture of the panel is a picture of the same
fight it was last time.

Hard: the harness now touches the panel — it finds the one shadow root on the page and presses a tab
through it. It names nothing the add-on owns and the page guard still holds that, but a panel that
stopped drawing `data-screen` would leave the screen unrestored and say nothing about it.

Obliged: `tools/panel-screenshots.ts` puts the panel back in the corner before measuring, because a
frame is the distance from the panel's left edge to the right edge of the viewport and a centred
panel would carry half a screen of background into every picture.

Also true: a panel folded when the page reloads draws no tabs, so the screen the address carries is
not pressed back until it is unfolded — by which time the panel is on its first screen.

## Alternatives

**Leave the real `localStorage` in place on the development server.** It keeps a drag and a fold
across a reload and nothing else — the published site would still lose them at every navigation, the
screen is in no store to begin with, and the shelf would fill a developer's browser with demo
fights.

**Have the add-on keep the screen it is on.** It would make the restore free here, but it changes
what every installed copy does to solve a problem the harness has.

**`sessionStorage` for the harness's own state.** A published page would then leave something
behind, which is the one thing `ADR 0017` decided it must not.

**Keep deriving the fight, but from the richest recording rather than the newest.** Still computed,
so still moving; and the measurement that ranks them is not one a page should be running.
