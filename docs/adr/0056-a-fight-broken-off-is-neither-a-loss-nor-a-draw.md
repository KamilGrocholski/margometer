# 0056. A fight broken off is neither a loss nor a draw

- **Status:** Accepted
- **Date:** 2026-09-06

## Context

The panel knew three endings: won, lost, and the draw **ADR 0007**'s successor added on the winners'
own key (`6316218`). All three are read off `winner` and `loser`, which arrive in a message naming
no combatant at all.

The game has a fourth. `frozen/protocol-keys.ts` has carried `flee` since the key table was first
frozen, and nothing read it: no entry in `docs/protocol-keys.md`, no branch in the decoder, so a
message carrying it decoded to `unknown-message` and counted against coverage.

What the key is, measured 2026-09-06:

- **The client.** Production build `ne0iTNdg` handles `flee` in the same switch as `winner` and
  `loser`, and handles it differently from both. It composes `msg_flee %name% %hp%` from the
  message's **actor slot** — never from the key's own value, which it does not read — and classes
  the line `txt`, where `winner` sets `win` and `loser` sets `lose`. The same branch is in cached
  production build `1785244275300`, so it is not new.
- **The dictionary.** `msg_flee %name% %hp%` is _Walka przerwana! …_ — the fight interrupted, and
  the combatant who used the item named with the health they kept.
- **The published help**, view,372 (read 2026-09-06): an escape is a consumable carrying
  `action=flee`, and it interrupts the fight **for every participant**, health and position kept.
- **The material is silent.** 0 occurrences across all 29 recordings.

So an escape is not a result on the `winner`/`loser` axis at all. Nobody won it, nobody lost it, and
it is not the draw either: a draw is the move cap running out with both sides still standing, while
an escape is somebody leaving before the question was settled.

## Decision

A fight the escape key ended reads **`ucieczka`**, a fourth outcome beside won, lost and drawn.

1. **It is read on `flee`, in either shape.** The client never reads that key's value, so the
   decoder accepts the key bare and valued alike and reads the same outcome from both.
2. **It names nobody.** The message does name the combatant who used the item, in its actor slot.
   That end is not carried past the decoder: the panel has one word to say how a fight went and
   nowhere to draw who ended it, and **C9** puts a field at its first consumer.
3. **It needs no seat**, like the draw and unlike won and lost. The help says the interruption
   reaches everybody, so it is the same word from every side of the fight and from none.
4. **It outranks a side the protocol named.** Where a fight states both an escape and a `winner`,
   the word is `ucieczka`. Both claims are kept on the outcome; only the word is decided.

## Consequences

`flee` stops counting against coverage. A fight broken off says what it came to instead of standing
outcome-less, and a reader is never told a fight was lost when it was left.

`tools/fabricated-fight.ts` grows an `--ending fled` flag, because the corpus cannot show this and a
word nobody can look at is a word nobody has checked. The default ending is untouched, so every file
the script already wrote is byte-identical.

**Point 4 is the part standing on no measurement**, and it is the one to revisit. Nothing observed
says whether the game sends `winner`/`loser` beside a `flee`, because nothing has observed a `flee`.
If a recording shows the two together and the game means the stated side to win, this ADR is wrong
on that point and a successor says so. Until then the decoder keeps both claims, so the recording
that settles it will not have to be taken twice.

`docs/captured-fights.md` lists the missing recording. Taking one closes the last guess here.

## Alternatives

**A new event kind rather than a fourth `result`.** A flee message names a combatant and the outcome
event is documented as being about the fight rather than anybody in it, so the shapes genuinely
differ. Rejected: it would put "how the fight ended" in two places for one reader that treats them
identically, and the discriminator `result` already exists for exactly this.

**Carry who fled.** The protocol states it and dropping it loses something real. Rejected under
**C9** — nothing draws it, and a field with no reader goes stale before its first consumer arrives.
The decoder still sees the actor slot, so adding it later costs one line.

**The stated winner outranks the escape.** Safer in the sense that it never contradicts a key the
game sent. Rejected: it would make the feature invisible if the game does send both, and the help is
unambiguous that an escape leaves no winner. The choice is recorded here rather than hidden in a
comparison, which is the point of writing it down.

**Wait for a recording.** Rejected on the draw's precedent: that one shipped on the client's branch
and the help too, with the silence stated in the register and probed by a test that turns red the
day material arrives. The same guard is in place here.
