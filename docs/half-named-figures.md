# Half-named figures

Every shape the protocol can send where it names one end of what happened and not
the other, and what the panel draws for each. §10 calls these **half-named**; the
decision behind them is
`docs/specs/2026-08-18-two-ends-and-one-of-them-is-named.md`.

**Read from the panel, not written from memory**, and held by
`tests/ui/panel-view.test.ts` — the walk named *every shape the protocol can
send* builds each fight below and asserts the rows. A line here that stops being
true fails the gate.

The fight is `mag` and `tarcza` on our side, `boss` on theirs, and `#9` for an id
the roster never carried. *In the ranking* means a combatant's own row;
everything else is one of the two rows pinned under it.

## Damage

| the message | what the game named | `Zadane` | `Otrzymane` |
|---|---|---|---|
| `1=90.00;3=50.00;+dmg=500;-dmg=400` | both ends | `mag 400` in the ranking · `My` | `boss 400` in the ranking · `Oni` |
| `1=90.00;0;+dmg=300;-dmg=200` | the actor | `mag 200` in the ranking · `My` | **`Nieznany cel 200`** · `Oni` |
| `3=50.00;0;poison=60` | the subject, on their side | **`Nieznany sprawca 60`** · `My` | `boss 60` in the ranking, and `Nieznany sprawca 60` as a cut of it · `Oni` |
| `2=90.00;0;poison=60` | the subject, on ours | **`Nieznany sprawca 60`** · `Oni` | `tarcza 60` in the ranking, and `Nieznany sprawca 60` as a cut of it · `My` |
| `0;0;+dmg=90;-dmg=70` | neither | `Nieznany sprawca 70`, `Wszyscy` only · bar says `Bez strony 70` | `Nieznany cel 70`, `Wszyscy` only · bar says `Bez strony 70` |

The third and fourth rows are the inference, and they are the pair that says which
way it runs: a tick on **their** side is ours to have dealt, a tick on **ours** is
theirs.

## Healing

| the message | what the game named | `Leczenie dane` | `Leczenie` |
|---|---|---|---|
| announcement, then `1=90.00;2=50.00;heal_target=100` | both ends | `mag 100` in the ranking · `My` | `tarcza 100` in the ranking · `My` |
| announcement, then `1=90.00;0;heal_target=300` | the healer | `mag 300` in the ranking · `My` | **`Nieznany cel 300`** · `My` |
| `2=90.00;0;heal=50` | the healed | **`Nieznany sprawca 50`** · `My` | `tarcza 50` in the ranking, and `Nieznany sprawca 50` as a cut of it · `My` |
| `0;0;heal=40` | neither | `Nieznany sprawca 40`, `Wszyscy` only · bar says `Bez strony 40` | `Nieznany cel 40`, `Wszyscy` only · bar says `Bez strony 40` |

Healing stays on one side, so every row of this table reads `My` where the damage
table crosses.

## Where nothing can be derived

| the fight | what the panel does |
|---|---|
| a combatant the roster cannot place swings (`9=90.00;3=50.00;…`) | their row is drawn under `Wszyscy` as `#9`, on no side tab; the bar puts the figure in `Bez strony` |
| the same combatant is poisoned (`9=90.00;0;poison=60`) | `Nieznany sprawca 60` under `Wszyscy` only — no end to derive a side from — and `Bez strony 60` on the bar |
| the game never said which side is ours | no bar at all, and no side tab admits anybody: `Wszyscy` is where the fight is read (`composeSides` returns null) |

