[Polski](README.md) · **English**

# MargoMeter

A damage meter for [Margonem](https://www.margonem.pl/) — live fight statistics in a panel over the
game. SKADA or Details!, for Margonem.

![Combatants ranked by damage taken](screenshots/panel-ranking.png)

![An opened row: whom the damage came from, and what kind it was](screenshots/panel-opened.png)

![The deepest level: what passed between the two, by damage type](screenshots/panel-deep.png)

![The combatant's card open beside the panel](screenshots/panel-card.png)

![The shelf of fights that are still kept](screenshots/panel-shelf.png)

A ten-against-one fight, on the damage-taken screen.

- Damage and health restored, dealt and taken, per combatant, per fight.
- A row opens, three levels deep: who to whom, then with what — a skill, or a kind of damage.
- Hover a row for the combatant's card: all four figures, criticals, the hardest blow, what a
  defence stopped and what an attack destroyed.
- A finished fight goes on a shelf you can go back to, and the panel says where it was fought.
- Totals only, no rate. What the log credits to nobody gets a row and a figure of its own — it is
  never folded into somebody's score.
- Reads only: no network, no automation, no effect on how a fight plays out.

## Install

Open [the latest release][latest] and click `margometer.user.js` — Tampermonkey recognises the file,
installs it, and keeps it updated.

It works in every current desktop browser: Chrome, Edge, Firefox and Safari. Chrome and Edge need
one more step — turn on user scripts on the extension's own page, in `chrome://extensions` — or
nothing runs and nothing says so.

[latest]: https://github.com/KamilGrocholski/margometer/releases/latest

## See it live

**[kamilgrocholski.github.io/margometer][preview]** replays a recorded fight in your browser, drawn
by the file the newest release ships. Nothing there is connected to the game.

[preview]: https://kamilgrocholski.github.io/margometer/
