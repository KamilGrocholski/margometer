# Protocol keys — what has been looked into

What we know about individual keys, and how we came to know it. Read this before
investigating a key: several here were already settled, and two were investigated
and deliberately left alone.

Each entry carries a **verdict** and its **evidence** — a measurement over the
captured fights, or a citation from the game client with the build it was read
on. A verdict without evidence is a guess someone will later mistake for a fact.

**Guarded** by `tests/protocol-key-register.test.ts`: this file cannot get ahead
of the decoder or fall behind it. What it deliberately does **not** hold is any
count of progress — run `bun tools/decoding-status.ts` for that.

---

## Keys the decoder reads

### `winner` — decoded

The combatants on the winning side, as a single string, names separated by a
comma and a space. Appears in a message that names no combatant at all: it is
about the fight, not about anyone in it.

*Evidence:* every occurrence in both captured fights has that shape, and both
fights end with exactly one `winner` and one `loser`.

### `loser` — decoded

The same, for the losing side.

### `+oth_dmg` — decoded

Damage that landed on a combatant the protocol names **by name**, alongside an
attack aimed at someone else. Value is `amount,kind,name(percent%)`; the
percentage belongs to the named combatant, not to the message target. The damage
has already been reduced — unlike `+dmg`/`-dmg` there is no second figure.

*Evidence:* in every call where a target lost more health than the attack
accounted for, the shortfall equalled this amount exactly — 110, 247 and 123 in
three separate calls. Three independent confirmations on real material, which is
why this is not read off the client's sentence template.

---

## Families the decoder reads by shape

### `?dmg*` — decoded

Damage. The client has no case labels for these: its default branch matches a
key whose characters 1–3 are `dmg`, treats `+` as dealt and anything else as
taken, and calls everything outside that an unknown parameter. We mirror the
rule rather than listing the family, so a kind the game has never sent still
decodes.

*Evidence:* the default branch of the battle switch, production build
`1785244275300`, identical in the development build. Which sign is the damage
that landed was measured rather than read: health drop matched the sum of
`-dmg*` in 22 of 26 comparisons and the sum of `+dmg*` in **none**.

---

## Keys looked into and deliberately not read yet

### `injure` — investigated

Not damage applied at the moment it appears. Left unread rather than guessed at.

*Evidence:* measured twice on the group fight. In call 61 the target's health
fell by exactly the attack plus `+oth_dmg`, with `+injure=179` present and
contributing nothing; in call 23 the same, with `+injure=78`. Whatever it does,
it does not move health then and there.

---

## Investigated and found not to be battle keys

### `attack` — not a battle key

### `attack2` — not a battle key

Neither belongs to the switch that reads battle messages. They come from a
different switch in the same client module.

*Evidence:* they appeared in the first key list because it was gathered by
grepping the whole module, which holds three switches. Bounding each switch by
brace balance removed them, and they are absent from the production battle
switch entirely. Recorded so nobody spends a second afternoon on them.
