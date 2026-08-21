# An extra blow the game grants

Status: implemented

The panel closes its `CZYM (UMIEJĘTNOŚCI)` section with a row called
`Zwykły cios`, and tells a player, in Polish, that the game does not tell that row
apart from an extra swing it handed out itself. `src/core/fight-statistics.ts` says
the same thing to the next reader of the code. Neither carried a source — and a
negative claim about somebody else's system is precisely the kind §3 says carries
one.

This round asks the game and writes the answer down. The answer is **no**, with one
qualification that turns out to be the interesting part.

## What was asked for

> Distinguish "Zwykly cios", "Zamaszczysty cios", and similar

The name in the second half is nobody's but the asker's: it occurs in no capture,
in no `tspell` announcement, in the client's dictionary nowhere, and nowhere in the
published help. What it describes is the family — the swings a combatant takes that
they never chose — and the game's own word for the one it most resembles is
**Szeroki zamach**, engine name `swing`.

## What the help grants, and what the protocol marks

Article `view,372`, read 2026-08-21 through `tools/help-article.ts`. The phrases
searched for an effect that produces an attack nobody spent a turn on:
`dodatkowy atak`, `wykonuje dodatkow`, `automatyczny atak`, `atakuje ponownie`,
`ponowny atak`, `drugi atak`, `podwójny atak`, `kolejny atak`. What comes back is
three engine names, and no fourth:

| the help's effect | what it grants | what the protocol carries | can a meter see it? |
|---|---|---|---|
| `of-thirdatt` — Trzeci cios | an additional auxiliary attack | `+thirdatt` / `-thirdatt`, raw and applied, **on the message of the blow it came with** | **yes**, and it is not a separate blow |
| `contra` — Kontra, after taking a critical hit | an automatic attack inside the same turn | `-contra`, an event with no figure | no — the blow it fires is its own message and nothing joins them |
| `pcontra` — the same Kontra, after a Parowanie | the same automatic attack | `-parry`, and then, unjoined, the blow | no, and doubly so: `pcontra` is not a battle key at all |

`swing` is the fourth thing this round had to look at and the one it was named
after, and it belongs to a different question. The help gives it as a chance event
on a landed attack that reaches **further opponents** inside that attack — two more
in the monster form, at most three in the active form. The striker swings once. It
is not an extra blow; it is one blow spread wider.

## The verdict

**A blow nobody announced cannot be told from a swing the game granted, and the
reason is not that the protocol is quiet — it is that the two attacks it does grant
arrive as ordinary blow messages with nothing on them.** A riposte is a blow like
any other. The Third Blow is the exception that proves the shape: the protocol does
mark it, and marking it puts it on its parent's message, so it was never one of the
blows in question either.

So `CombatantStatistics.blowsWithoutSkill` counts what it always counted, the panel
goes on saying what it always said, and both now say it with the article and the
build behind them.

## What changed

- `docs/protocol-keys.md` — entries for `+swing` and `-parry`, both `investigated`
  and deliberately unread; `-contra` gained its second trigger; `+thirdatt` gained
  the clause that says *alongside* is what matters about it.
- `src/core/fight-statistics.ts` — the uncited negative on `blowsWithoutSkill`
  replaced by the cited one.
- `tests/frozen-help-phrases.ts` — re-frozen, so `swing` and `parry` are counts a
  guard re-earns rather than phrases somebody once searched.

Nothing in `src/ui/` moved. The sentence a player reads was already true.

## Rejected alternatives

**Decode `+swing` and `-parry` now.** Both compose with no `%val%` on the same
switch as `+fastarrow` and `-contra`, so the branch would be four lines and correct.
Refused on `+critwound`'s reasoning: no recording carries either, so nothing could
measure the reading, and the health witness could not agree with it. Left as loud
unknowns, which is what §3 asks an unrecognised key to be. Material first.

**Split `Zwykły cios` into rows anyway, on the events that fire near a blow.**
`+fastarrow` shortens an attack's duration and `-contra` fires on the *defender* —
neither says the blow beside it was granted. Rows built on that would be a join the
protocol does not make (§5), and the honest count would not change.

**Count ripostes as "at most N of these blows".** A fight carrying `-contra` has
that many ripostes somewhere in it, so the ceiling is real. Which blows they were is
not, and a figure a player can only read as *some of these* is worse than the
figure they have.

**Say nothing and close the item.** The claim was already in the tree, in two
places, in two languages, uncited. Leaving it there is how a negative goes on being
believed — the failure `docs/protocol-keys.md` records for four `legbon` keys.

## What stays open

Whether `+swing`'s further targets arrive as messages of their own. If they do,
`blowsStruck` counts one swing as three; if they ride the message, it counts one.
The client cannot answer — its branch composes the announcement and never the
damage — so this waits on a recording that carries the key, which none does as the
set stood 2026-08-21.
