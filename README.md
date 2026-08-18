# MargoMeter

A damage meter for [Margonem](https://www.margonem.pl/) — live fight statistics
in a panel over the game. What SKADA and Details! are to World of Warcraft.

It shows **totals**, and deliberately no rate: two readings of "per turn" were
built and both were withdrawn, because in a fast fight the game numbers several
actions with one ordinal and a figure divided by that is wrong without saying so.
What the panel does instead is name what it cannot attribute — health that moved
where the log credits nobody is its own row, on every screen, rather than being
folded quietly into somebody's total.

The add-on **sends nothing and changes nothing in the game**: it reads the data
the game itself receives from the server during a fight and draws its own panel
next to it. It does not automate anything, does not click for you, and does not
affect how a fight plays out. It counts what already happened.

> **Rebuilt from scratch for 0.6.0.** Nothing of the previous implementation
> survives except the captured fight material under `tests/captured-fights/`,
> which is evidence and could not be regenerated. If you are coming from 0.5.0 or
> earlier: this is the same add-on by name and a different one by construction,
> and none of the older versions' behaviour should be assumed.

**[See it before you install it][preview]** — a recorded fight replayed in your
own browser, by the same file a release ships. Nothing there is connected to the
game, and the picker holds every fight this repository has kept.

[preview]: https://kamilgrocholski.github.io/margometer/

## What it looks like

Damage taken in a ten-against-one fight, and the two levels a row opens onto.
Taken from a recording in this repository, by the release this branch is at.

| The ranking | A row opened | Opened again |
|---|---|---|
| ![The panel ranking combatants by damage taken](screenshots/panel-taken.png) | ![One combatant's damage broken down by opponent and by damage type](screenshots/panel-breakdown.png) | ![The deepest level: one opponent, by skill and by damage type](screenshots/panel-deep.png) |

Every row says more on hover, at every level — the person's whole-fight figures,
what a defence stopped, and what the attack destroyed:

![The detail card open beside the panel](screenshots/panel-tip.png)

---

## MargoMeter and the game's terms of service

**MargoMeter is not authorised by Garmory**, and there is no point pretending
the question is settled. Read this before installing.

What the add-on actually does — verifiable in the source, not just claimed:

- **sends nothing** — no `fetch`, `XMLHttpRequest`, `WebSocket` or `sendBeacon`
  anywhere in `src/`;
- **automates nothing** — no clicking, no synthetic input, no action taken in
  the game;
- **does not change how a fight plays out** — it wraps the engine's update
  function, but the original runs first and its return value comes back
  untouched;
- **reads and counts** what the game already received from the server.

And even so: **wrapping someone else's function is touching the game client.**
The [terms of service][tos] prohibit, without the operator's explicit consent,
using software that assists participation in the game or modifies how the game
behaves — including how it behaves on the player's own device. "Explicit
consent" is defined narrowly there, as an official statement naming specific
software. MargoMeter has none. The penalty for prohibited software is a
permanent account ban.

On the other hand, the operator assumes add-ons outside its own list exist: the
[safety page][safety] says "you use any other add-ons at your own risk" rather
than "they are forbidden", and Garmory publishes official documentation for
add-on authors.

**What we do not know:** how Garmory would classify a meter that only reads.
That is their call, and nobody has asked. **What follows for you:** you install
at your own risk, and the risk is your account. If that is too much, do not
install — that is a reasonable choice.

Garmory: if anything here is wrong, get in touch and it will be corrected or
taken down.

[tos]: https://pomoc.margonem.pl/index/view,323
[safety]: https://pomoc.margonem.pl/index/view,240

---

## Install it

Open [the latest release][latest] and click `margometer.user.js` — Tampermonkey
recognises the file and offers to install it. The file carries `@updateURL`, so
an installed copy checks that same release page for its next version.

The file is built by CI from the tag, not uploaded by hand, and it is not
minified: what you install is readable, and it is the same text this repository
builds from `src/`.

[latest]: https://github.com/KamilGrocholski/margometer/releases/latest

## Or build it yourself

Requires [Bun](https://bun.sh/):

```bash
bun install
bun run build
```

This produces `dist/margometer.user.js`. Open the Tampermonkey menu → **Create
a new script**, clear the editor, paste the whole file and save. Installed by
pasting, the add-on does not update itself — Tampermonkey only polls for a script
it installed from a URL.

---

## For developers

```bash
bun run check        # typecheck + tests + build — the gate
bun test             # tests only
bun run preview      # the panel in a browser, over a recorded fight, rebuilt as you edit
bun run preview:site # the same page written to dist/preview, which is what Pages serves
bun run screenshots  # the four pictures above, retaken for the version in package.json
bun run cost         # what a payload costs, replayed off every recording
bun run build:dev    # the same add-on with a cost overlay, installed beside a release
```

The page behind [the preview link][preview] is what `bun run preview:site` writes:
one harness page per capture under `tests/captured-fights/`, plus the bundle those
pages load. `.github/workflows/pages.yml` runs the gate and then publishes it on
every push to `main` — and `main` is the latest release, so the link shows the
panel the file on the releases page draws, not work nobody can install yet.
Nothing it writes is committed — the output goes under `dist/`, which git
ignores, because a published page carries a capture's engine payloads inlined and
those carry the game's own names ([`NOTICE.md`](NOTICE.md)).

`bun run build:dev` writes `dist/margometer.dev.user.js`. It carries a name of its
own and no update URL, so it sits alongside an installed release instead of
replacing it, and it draws what each phase of a payload cost in the corner of the
page. `bun run preview --dev` serves that build instead of the ordinary one.
Nothing measured leaves the machine — there is no telemetry here and the add-on
sends nothing anywhere.

Work happens on `develop`. `main` is advanced only by a release, by
fast-forward, so its head is always exactly the newest `v*` tag — which is what
makes the preview link and the file you can download one build. The reasoning is
in [the spec that decided it][branches].

[branches]: docs/specs/2026-08-18-main-is-what-you-can-install.md

Conventions, workflow and the rules this repository is held to live in
[`AGENTS.md`](AGENTS.md). That file is the single source of them; AI coding
tools read it directly.

The tests stand on **real material**: raw battle protocol captured from actual
fights, under `tests/captured-fights/`. It is treated as evidence rather than
test data — it is never edited to make something pass, and the invariants
discover the files by reading the directory, so a capture dropped in is checked
immediately.

---

## Licence

The code is [MIT licensed](LICENSE) — do what you like with it, just keep the
notice.

Margonem is a game by **Garmory sp. z o.o. sp.k.** and MIT does **not** cover
it: not the name, not the artwork, not the text, not the client's code. What of
the game's is in this repository, on what basis, and what is deliberately
absent — [`NOTICE.md`](NOTICE.md).
