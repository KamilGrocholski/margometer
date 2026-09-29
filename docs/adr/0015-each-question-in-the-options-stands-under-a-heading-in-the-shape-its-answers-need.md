# 0015. Each question in the options stands under a heading, in the shape its answers need

- **Status:** Accepted
- **Date:** 2026-09-29

## Context

The options (ADR 0013) drew each question as one row of strips: the question's word, then its
answers, all in `textQuiet`, with the answer taken standing on `surfaceRaised`. There were three
rows: `Pismo` with three steps of type, `Rozmiar` with either a sentence on how a window is sized or
a strip per sized window, and `Trzymaj walki` with three places a shelf is kept. At the small step
the last row folded, and its second line stood under the question's word.

The maintainer found the view hard to read. The round's canvas, made 2026-09-29, named six faults:

- the question and the answers not taken were the same grey in the same type, so a row read as one
  run of words;
- the storage row folded;
- the answer taken was marked by a ground a few shades off the panel's own;
- nothing set one question apart from the next;
- the size row did not say which window kept a size of the reader's;
- no answer about storage said what it meant for the fights already kept.

Measured in Chrome 154 on 2026-09-29, through the built userscript at the small step and before any
fight: the three places a shelf is kept, drawn abreast as one segment, end 22px past the panel's
right edge.

## Decision

Decided with the maintainer on 2026-09-29, over the design canvas made that day (variant A of
three).

**Each question stands under a heading lettered as a section of the list is**, with the heading's
colour, spacing and small upper-case type. The panel already says "a group starts here" that way, so
the options add no new look.

**The answers take the shape they need.** The three steps of type stand side by side in one framed
segment, and each is written in the size it gives, so the choice is seen before it is made. The size
of the windows is a line per window, saying `własny` or `domyślny`, with `przywróć` on a window that
is sized and on no other. The sentence on how a window is sized always stands under the lines. Where
the shelf is kept is a row per answer, in the order they keep longest, with a sentence under them
saying what the answer taken means for the fights kept.

**The answer taken is marked by weight, the text colour and the `track` ground**, and a storage
answer by a ✓ as well. The sheet draws the ✓ rather than the row carrying it, so a row stays one
node carrying its mark and a press on the ✓ is a press on the answer.

**The questions are renamed** `Pismo`, `Rozmiar okien` and `Zapisane walki`. A heading names a
thing. `Trzymaj walki` was an instruction standing where a name goes.

Rejected: **B, the strips as they were under a heading.** This is the smallest change. It left the
storage row folding at the small step and the size row not saying what it was.

Rejected: **C, a line per question with its value and ‹ ›.** This is the lowest option, but a reader
sees one answer at a time, and reaching `tylko teraz` from `na stałe` is two presses made blind.

Rejected: **the three places abreast in one segment, like the type.** The measurement above is why.
Shortening the words to fit would have left three words that a player could not tell apart without
the sentence under them.

## Consequences

- `DESIGN.md`'s paragraph on the options states the headings, the shapes and the marks.
- The sheet departs from `develop`'s in the options' rules and in `.strips-label`, which nothing
  wears now, and `SHEET_DEPARTURES` names them.
- The three steps' own sizes are the one place the sheet spells a type other than the step's smaller
  one, and the guard over smaller type names them as its one exception.
- The browser suite holds every answer to one row inside the panel at every step.
- The storage answers are the longest line in the options. A fourth answer, or a longer word for one
  of the three, is measured against the small step's width before it is written.
