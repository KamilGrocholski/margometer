[Polski](README.md) · **English**

# MargoMeter

A damage meter for [Margonem](https://www.margonem.pl/) — live fight statistics in a panel over the
game. SKADA or Details!, for Margonem.

<table>
<tr>
<td valign="top" align="center">
<img src="screenshots/panel-ranking.png" width="390"
alt="Combatants ranked by damage taken, with the second window beside the panel">
<br><sub><b>The ranking</b></sub>
<br><br>
<img src="screenshots/panel-deep.png" width="390"
alt="The deepest level: what passed between the two">
<br><sub><b>The third level</b></sub>
<br><br>
<img src="screenshots/panel-shelf.png" width="390"
alt="The shelf of fights that are still kept">
<br><sub><b>The shelf</b></sub>
</td>
<td valign="top" align="center">
<img src="screenshots/panel-opened.png" width="390"
alt="An opened row: whom the damage came from">
<br><sub><b>An opened row</b></sub>
<br><br>
<img src="screenshots/panel-half-named.png" width="390"
alt="The half-named row opened: whom it reached, and what it was dealt with">
<br><sub><b>A half-named row</b></sub>
</td>
</tr>
<tr>
<td colspan="2" align="center">
<img src="screenshots/panel-card.png" width="530"
alt="The combatant's card open beside the panel">
<br><sub><b>The card</b></sub>
</td>
</tr>
</table>

A ten-against-one fight, on the damage-taken screen.

- Damage and health restored, dealt and taken, per combatant, per fight.
- A row opens, three levels deep: who to whom, then with what — a skill, a kind of damage, or the
  "Zwykły cios" row holding what the game named no skill for, which on the damage screens is often
  the first row of the list. A press opens it; a right press anywhere on the panel, or a press on
  the crumb over the list, takes you back.
- Hover the row of anybody in the fight — on the list, or inside an opened row — for their card: the
  figure the screen asks for, and each of the other three that is not nought, the turns they took
  and the ones they lost, criticals, what a defence stopped and what an attack destroyed. The same
  on every screen. A figure that means narrower than its label says carries a mark, and a sentence
  at the foot of the card says what the game does not report.
- A finished fight goes on a shelf you can go back to. Each says which day and hour it was fought,
  and beside that where — the place name has less room for it now, and a long one is cut, whole in
  that row's own card.
- A second window stands beside the panel: whose turn it is, and what is standing on the fight —
  skills cast over a whole side, and the shouts — with how many of the turns the game states have
  passed. Never how many are left: the game does not say. A special blow being made ready stands
  there on its own, with how much of the charge has passed and which end it came to.
- Totals only, no rate. What the log credits to nobody gets a row and a figure of its own — it is
  never folded into somebody's score. That row says what the game left out, and opens as well: whom
  it reached, and what it was dealt with.
- Reads only: no network, no automation, no effect on how a fight plays out.

## Install

Two things are needed: a desktop browser and a userscript manager — the extension that runs add-ons
like this one. MargoMeter works in every current desktop browser: Chrome, Edge, Firefox and Safari.

1. **Install a userscript manager.** [Tampermonkey][tampermonkey] exists for all four,
   [Violentmonkey][violentmonkey] for Chrome, Edge and Firefox. One is enough.
2. **In Chrome and Edge, turn on user scripts.** On the extension's own page, in
   `chrome://extensions`. Without it nothing runs and nothing says so. Firefox and Safari need no
   such step.
3. **Install MargoMeter.** Click [the add-on file][install] — the manager recognises it and offers
   to install it. The button on [the preview page][preview] does the same. Every release, this one
   and the ones before it, is on [the releases page][latest], where `margometer.meta.js` sits beside
   the add-on — a working file, not one to click: it holds the banner and not a line of code.
4. **Open the game and start a fight.** The panel appears over it. If it does not, go back to
   step 2.

An installed copy checks for a newer version on its own.

[install]: https://github.com/KamilGrocholski/margometer/releases/latest/download/margometer.user.js
[latest]: https://github.com/KamilGrocholski/margometer/releases/latest
[tampermonkey]: https://www.tampermonkey.net/
[violentmonkey]: https://violentmonkey.github.io/

## See it live

**[kamilgrocholski.github.io/margometer][preview]** replays a recorded fight in your browser, drawn
by the file the newest release ships — and the install button stands at the top of it. Nothing there
is connected to the game.

[preview]: https://kamilgrocholski.github.io/margometer/
