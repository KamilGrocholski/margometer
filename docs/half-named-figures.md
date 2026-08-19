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
| `3=50.00;0;injure=60` | the subject, and nothing announced the wound | **`Nieznany sprawca 60`** · `My` | `boss 60` in the ranking, and `Nieznany sprawca 60` as a cut of it · `Oni` |
| `0;0;+dmg=90;-dmg=70` | neither | `Nieznany sprawca 70`, `Wszyscy` only · bar says `Bez strony 70` | `Nieznany cel 70`, `Wszyscy` only · bar says `Bez strony 70` |

The third and fourth rows are the inference, and they are the pair that says which
way it runs: a tick on **their** side is ours to have dealt, a tick on **ours** is
theirs. The fifth is the same tick under a key that *can* be announced, arriving in
a fight nobody watched the blow in — the section below is what it looks like when
somebody did.

## Healing

| the message | what the game named | `Leczenie dane` | `Leczenie` |
|---|---|---|---|
| announcement, then `1=90.00;2=50.00;heal_target=100` | both ends | `mag 100` in the ranking · `My` | `tarcza 100` in the ranking · `My` |
| announcement, then `1=90.00;0;heal_target=300` | the healer | `mag 300` in the ranking · `My` | **`Nieznany cel 300`** · `My` |
| `1=90.00;2=50.00;heal_target=50`, nothing announced | the healed | **`Nieznany sprawca 50`** · `My` | `tarcza 50` in the ranking, and `Nieznany sprawca 50` as a cut of it · `My` |
| `0;0;heal=40` | neither | `Nieznany sprawca 40`, `Wszyscy` only · bar says `Bez strony 40` | `Nieznany cel 40`, `Wszyscy` only · bar says `Bez strony 40` |

Healing stays on one side, so every row of this table reads `My` where the damage
table crosses.

⚠️ **The middle row used to be `2=90.00;0;heal=50` and is no longer half-named.**
`heal` is one of the three keys the help calls the healed combatant's own, so it
has both ends now and moved to the section below. What is left standing here is an
*unannounced* `heal_target` — the same hole, under a key the help says nothing
about, which is the only way that hole can still arrive.

## An end the help supplies

The protocol writes these exactly as it writes the half-named ones — the subject in
the actor slot, a literal `0` at the other end — and they are not half-named,
because the game's own documentation says the effect belongs to the combatant it
moved health on. One person at both ends, so there is no hole
(§9.6, `docs/specs/2026-08-19-a-heal-nobody-gave-was-their-own.md`).

| the message | what the game named | `Leczenie dane` | `Leczenie` |
|---|---|---|---|
| `2=90.00;0;heal=50` | the healed, and the help the rest | `tarcza 50` in the ranking · `My` | `tarcza 50` in the ranking · `My` |
| `9=90.00;0;heal=50`, id the roster never carried | the same | `#9 50`, `Wszyscy` only · bar says `Bez strony 50` | `#9 50`, `Wszyscy` only · bar says `Bez strony 50` |
| `0;0;heal=40` | neither end, so nothing to fill with | as the healing table above — still half-named | as above |

⚠️ **What the fill needs is the id, not the roster.** The second row is drawn
because the message states combatant 9; that this fight can put neither a name nor
a side on them costs the row its side, not its ends. The third row is the real
limit: no id at either end, nothing to fill with, and §5's flat no still standing.

⚠️ **And the damage keys written the same way keep their hole.** `3=50.00;0;poison=60`
is the second row of the damage table and stays there. Nothing documents who
applied it, and `poison` is unattributed by construction — so two messages the
protocol writes identically are read differently, on the strength of what the
documentation says about one of them and not the other. That asymmetry is the
content of this section, and `docs/protocol-keys.md` carries it per key on the
`*Cause:*` line.

## An end an earlier message named

One shape more, and the only one whose missing end comes from **another message**:
a wound ticks with nobody in the other slot, and the blow that applied it named
both. The help says the wound does not accumulate and is overwritten by the
freshest application against that opponent, so a victim carries one at a time; the
figure says which one is ticking (§9.6,
`docs/specs/2026-08-19-a-wound-remembers-who-dealt-it.md`).

| the fight | `Zadane` | `Otrzymane` |
|---|---|---|
| `1=90.00;3=50.00;+dmg=500;-dmg=400;+injure=60`, then `3=50.00;0;injure=60` | `mag 460` in the ranking · `My`, no pinned row | `boss 460` in the ranking · `Oni`, no pinned row |
| the tick alone, nothing having announced it | `Nieznany sprawca 60` · `My` | `boss 60` in the ranking, and `Nieznany sprawca 60` as a cut of it · `Oni` |

The 460 is 400 from the blow and 60 from the wound, added for the figure the
screen ranks by and kept apart everywhere else: the wound is on no `Zwykły cios`
row and in no damage element, because it is not a swing.

⚠️ **Three things make the fill decline**, and each leaves the figure on the pinned
row of the second table row: nothing announced a wound on this victim, the tick
states a figure that is not the one announced, or the announcement's own attacker
did not resolve. A fresh application replaces the one before it **even then**,
because the game overwrites it whoever landed it.

## A side named, and no member of it

The team heal is a shape neither table above describes: the message names one end
— the caster — and a whole **side** at the other. It is not half-named, because
nothing about the recipients is missing; what was missing was three figures the
protocol does not state, and where those are held the cast is sized onto its
members by the game's own published arithmetic
(`docs/specs/2026-08-18-the-side-is-named-and-the-share-is-stated.md`).

| the fight | what the panel does |
|---|---|
| a cast (`1=…;1=…;tspell=…;healall_per=30`) with every input read | the caster in the ranking under `Leczenie dane · My`; each side-mate in the ranking under `Leczenie · My` with `leczenie całej drużyny` in their breakdown, and a **0** where the cap gave them nothing; no warning |
| the same, with one side-mate's entry health unknown | the same, short by that member, and the warning about healing without a stated figure still stands |
| the same, in a fight the panel joined in progress | every row drawn and every figure `0`; the warning stands and says how many casts |
| the same, where the caster has no standing side-mate | the same — the help halves the effect there and nothing here has watched it happen |

⚠️ **A row of zeros is not an absence.** Everyone in the fight has a row from the
first payload, so the difference between *nobody was healed* and *this meter could
not size the healing* is the warning and nothing else on the screen. That is why
the warning is the thing the guards assert, rather than the rows.

The last two are the degrade path and they are the same sentence to a player:
healing is short, by an amount the game never stated.

## Where nothing can be derived

| the fight | what the panel does |
|---|---|
| a combatant the roster cannot place swings (`9=90.00;3=50.00;…`) | their row is drawn under `Wszyscy` as `#9`, on no side tab; the bar puts the figure in `Bez strony` |
| the same combatant is poisoned (`9=90.00;0;poison=60`) | `Nieznany sprawca 60` under `Wszyscy` only — no end to derive a side from — and `Bez strony 60` on the bar |
| the game never said which side is ours | no bar at all, and no side tab admits anybody: `Wszyscy` is where the fight is read (`composeSides` returns null) |

