# Auras standing

What one skill put on a whole side, who cast it, and how far through it is.

**All of it is stated except the end.** The announcement names the skill (`skillId`) and its caster
(the actor slot, **ADR 0010**), and the published skill table states how many turns the effect runs
for. What the protocol never does is mention the effect again: there is no confirmation, no refresh
and no expiry anywhere in `captures/`. **ADR 0053** carries what follows from that.

**Read off the recordings, not written from memory.** `tests/tools/aura-standing.test.ts` composes
every row below through `tools/aura-standing.ts` and refuses a row naming a skill the corpus does
not cast, a skill no row names, or a figure the tree does not produce.

```bash
deno task fight:auras            # the register below
deno task fight:auras --cases    # the counts behind each verdict
```

## What is drawn, and what is not

The panel draws **what has passed of what the table states** — `3 z 8 tur` — and never a countdown.
Both halves are honest on their own: the first is counted in the caster's own turns, the second is
the game's own published figure. The subtraction is the reader's, and it is theirs because the
protocol never says the effect ended.

⚠️ **The duration does not depend on the caster's level.** Measured over the published table on
2026-09-03: of the 90 effect entries stating a duration, **88 state the same one at every level**,
and the two that do not (`dmg-target_fire-perw`, on skills 21 and 299) reach one combatant rather
than a side. So no reading here needs a level, which is as well — no payload states one for anybody
but the reader.

⚠️ **A skill stating several team-wide effects is drawn under the longest of them.**
`Wyzywający okrzyk` runs one for three turns and two for five. The strip says five, because
something from it is still running until then, and this line is where that is written down.

**Eight casts in the corpus can never be dated.** They arrive under `tcustom` with no `skillId` at
all — the bard songs — so nothing joins them to the table. They reach no row of the strip.

## The register

`casts` counts a skill put up by one caster once; a second cast by the same caster refreshes it
rather than adding a row. `at once` is the most instances of one skill standing at one moment, which
is the figure the strip draws as separate rows.

|  id | skill              | casts | casters | at once | stated | seen |
| --: | ------------------ | ----: | ------: | ------: | -----: | ---- |
|  25 | Prowokujący okrzyk |     6 |       4 |       1 |      3 | —    |
|  76 | Aura ochrony       |    17 |       9 |       2 |      8 | —    |
|  89 | Podwójny dech      |    28 |      14 |       4 |      8 | 22   |
| 123 | Szadź              |    35 |      15 |       3 |      8 | 52   |
| 188 | Wyzywający okrzyk  |    14 |       6 |       2 |      5 | —    |
| 206 | Osłona tarczą      |    19 |       8 |       2 |      2 | —    |
| 219 | Jadowity podmuch   |     1 |       1 |       1 |      8 | —    |
| 264 | Piętno bestii      |    20 |      10 |       2 |      8 | —    |

Five more skills reach a side and state a duration — `Furia` (212), `Emanujące strzały` (244),
`Krzyk Morskiej Furii` (285), `Testowa 2` (291) and the Szadź the Szkielet Władcy Żywiołów casts
(298). None is cast in any recording, so none has a row: a row with no cast behind it would be a
claim about material this repository does not have.

## Why `seen` cannot check `stated`

Two of the eight raise a bit the payload's own status mask carries — `Podwójny dech` shows as
`speed_up` and `Szadź` as `swow_down` — and `seen` is the longest that bit ran anywhere in the
corpus, in the bearer's own turns (`docs/statuses-standing.md`).

**It comes to 22 against a stated 8, and 52 against a stated 8, and neither is a contradiction.** A
bit says a combatant is under _some_ such effect, not under _this cast_: anybody's cast sets the
same bit, and a side with two casters keeps it set continuously. So the mask measures a side's whole
exposure and can neither confirm nor refute one cast's length.

⚠️ **So nothing in the material checks the countdown.** The stated figure is the game's own
published one and the elapsed figure is counted here, but the join between them is unwitnessed. It
is drawn as elapsed-of-total for exactly that reason: a bare "5 tur left" would be a figure this
repository cannot stand behind, and `PRODUCT.md`'s third pillar is what forbids it.
