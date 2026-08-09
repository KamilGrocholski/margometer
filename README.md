# MargoMeter

A damage meter for [Margonem](https://www.margonem.pl/) — live fight statistics
in a panel over the game. What SKADA and Details! are to World of Warcraft,
except Margonem is turn-based, so the counter counts per turn.

The add-on **sends nothing and changes nothing in the game**: it reads the data
the game itself receives from the server during a fight and draws its own panel
next to it. It does not automate anything, does not click for you, and does not
affect how a fight plays out. It counts what already happened.

> ⚠️ **Being rebuilt.** This branch is a rewrite from scratch. Only the captured
> fight material under `tests/fixtures/` carried over from the previous
> implementation. Expect the tree to be incomplete while it is put back
> together — see `AGENTS.md` for how the work is sequenced.

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

## Build it yourself

Requires [Bun](https://bun.sh/):

```bash
bun install
bun run build
```

This produces `dist/margometer.user.js`. Open the Tampermonkey menu → **Create
a new script**, clear the editor, paste the whole file and save. Installed this
way, the add-on does not update itself.

---

## For developers

```bash
bun run check     # typecheck + tests + build — the gate
bun test          # tests only
```

Conventions, workflow and the rules this repository is held to live in
[`AGENTS.md`](AGENTS.md). That file is the single source of them; AI coding
tools read it directly.

The tests stand on **real material**: raw battle protocol captured from actual
fights, under `tests/fixtures/`. It is treated as evidence rather than test
data — it is never edited to make something pass, and the invariants discover
the files by reading the directory, so a capture dropped in is checked
immediately.
