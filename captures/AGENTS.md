# Captured fights

Raw battle protocol from real fights. Each file is one recording session: every call the
game engine made, with the protocol it carried and a snapshot of every combatant taken
before and after.

**This is evidence, not test data.** Everything below follows from that, and this file
strengthens the root rules rather than relaxing any of them.

## Never

- **Edit a file here to make anything pass.** If a capture contradicts the code, the code
  or the understanding is wrong. This is the rule the whole directory exists to serve.
- **Add a computed number to a file here.** Only raw material belongs in it.
- **Let a player nickname into this repository.** Nicknames are substituted by the intake
  tool before a recording is admitted, never by hand.

## Ask first

**Any change at all**, including reformatting, renaming, reordering keys, or normalising
whitespace. There is no such thing as a cosmetic edit to evidence.

## Always

- **Field names inside these files stay Polish** — `ladunek`, `komunikaty`,
  `wojownicyPrzed` and the rest. Renaming them is editing the evidence. This is the
  exception `AGENTS.md` **L2** names, and the boundary where it stops is the one reader
  that parses them; nothing downstream sees a Polish name.
- **Recordings are discovered by reading this directory**, never by a hand-maintained list
  of names.
- **An empty directory here fails its own test.** A guard that silently passes over no
  material is worse than no guard.
- **A recording is measured before it is admitted** — how much protocol it carries, and
  what the panel would make of it — and what it holds is recorded in
  `docs/captured-fights.md`.
- **The intake tool refuses what it cannot redact.** A recording it cannot fully process is
  rejected, not admitted with a warning.

## Why the snapshots matter

The protocol never states maximum health. The before-and-after snapshots do, which is what
lets the decoder be checked against something other than itself. A change that drops them
from the format destroys the only independent check this project has.
