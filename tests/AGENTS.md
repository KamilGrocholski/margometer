# Tests

A test sits where its subject sits. The readers at this directory's root are the exception: they are
material shared by many subjects, not a test of any one of them.

The root's **Verification** rules apply in full and are not repeated. What follows is only what is
true here and nowhere else.

## Always

- **What decides is the status; what parses is description.** Where an exit code, a length or a type
  can carry the answer, parsed text may name and never judge.
- **A test that reads a string back from the module that writes it** holds the two to be the same,
  and neither to be right. For anything a reader sees, that is not a test — the sentence could be
  replaced by our vocabulary, by a key of the game's, or by nothing at all, and every assertion
  would still pass. Read the words, in words, where they are drawn.

## Ask first

- **Collapsing a duplicated spelling.** Some duplication here is deliberate and is the whole of what
  a test proves: a test asserting _what the decoder reads_ must restate the protocol keys itself
  rather than read the decoder's own list. A deliberate duplication that does not say it is
  deliberate is an invitation to collapse it — so say it, in a comment, at the duplication.

## Relaxed from the root

`!` is permitted here. In `src/` and `tools/` it is not.
