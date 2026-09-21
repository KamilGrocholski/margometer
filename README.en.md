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

## Install

1. **Install a userscript manager** in a desktop browser: [Tampermonkey][tampermonkey] (Chrome,
   Edge, Firefox, Safari) or [Violentmonkey][violentmonkey] (not Safari).
2. **In Chrome and Edge, turn on user scripts** on the extension's own page, in
   `chrome://extensions`. Without it nothing runs and nothing says so.
3. **Click [the add-on file][install]** — the manager offers to install it. Earlier releases are on
   [the releases page][latest].
4. **Open the game and start a fight.** The panel appears over it. If it does not, go back to
   step 2.

An installed copy checks for a newer version on its own.

[install]: https://github.com/KamilGrocholski/margometer/releases/latest/download/margometer.user.js
[latest]: https://github.com/KamilGrocholski/margometer/releases/latest
[tampermonkey]: https://www.tampermonkey.net/
[violentmonkey]: https://violentmonkey.github.io/

## See it live

**[kamilgrocholski.github.io/margometer][preview]** replays a recorded fight in your browser, with
no game behind it, and carries the install button at the top.

[preview]: https://kamilgrocholski.github.io/margometer/
