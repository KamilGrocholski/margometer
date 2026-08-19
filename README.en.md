[Polski](README.md) · **English**

# MargoMeter

A damage meter for [Margonem](https://www.margonem.pl/) — live fight statistics
in a panel over the game. SKADA or Details!, for Margonem.

| | |
|---|---|
| ![The panel ranking combatants by damage taken](screenshots/panel-taken.png) | ![One combatant's damage broken down by opponent and by damage type](screenshots/panel-breakdown.png) |
| ![The deepest level: one opponent, by skill and by damage type](screenshots/panel-deep.png) | ![The detail card open beside the panel](screenshots/panel-tip.png) |

Damage taken in a ten-against-one fight.

- Damage and healing, dealt and taken, per combatant, per fight.
- Every row opens: by opponent, then by skill and by damage type.
- Hover a row for the whole-fight card — what a defence stopped, what an attack
  destroyed.
- Totals only, no rate. What the log credits to nobody gets its own row.
- Reads only: no network, no automation, no effect on how a fight plays out.

## Install

Open [the latest release][latest] and click `margometer.user.js` — Tampermonkey
recognises the file, installs it, and keeps it updated.

It works in every current desktop browser: Chrome, Edge, Firefox and Safari.
Chrome and Edge need one more step — turn on user scripts on the extension's own
page, in `chrome://extensions` — or nothing runs and nothing says so.

[latest]: https://github.com/KamilGrocholski/margometer/releases/latest

## See it live

**[kamilgrocholski.github.io/margometer][preview]** replays a recorded fight in
your browser, drawn by the file the newest release ships. Nothing there is
connected to the game.

[preview]: https://kamilgrocholski.github.io/margometer/
