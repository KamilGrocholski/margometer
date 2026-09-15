# 0092. The caveat mark is drawn, not spelled

- **Status:** Accepted
- **Date:** 2026-09-15

## Context

**ADR 0088** gave a figure that answers a narrower question than its label a mark of its own, and
**ADR 0089** gave that mark an ink and the row it rides. Both took the mark to be `ⓘ`, U+24D8, and
neither asked what a browser draws for it.

Measured in Chrome 152 on 2026-09-15, at the panel's own 13px: `ⓘ` is **6.5px** wide against
**10.23** for `O`. The same 6.5 under `system-ui`, `sans-serif`, DejaVu Sans, Liberation Sans, Noto
Sans, Arial, Segoe UI, Cantarell and Ubuntu — one number for nine families, because none of them
carries U+24D8 and every one falls back to the same face, whose circled letters are condensed. Shot
and read back pixel by pixel, the mark is an ellipse six across and ten down: beside a figure it
reads as a stray vertical bar, and on the two sentences at the foot of a card it opens each of them
with one.

**`DESIGN.md` carried a figure for it and the figure was not wrong** — it said 10.64px, and that is
what the mark cost a row. It was the **cell**: the glyph plus the padding after it. A cell keeps its
width whatever shape stands inside it, so the page could quote a measurement, the gate could stay
green, and the thing a reader actually met was never asked about. `tests/e2e/panel-marks.spec.ts`
held what the mark took off a name, for the same reason and with the same blind spot.

Nothing here can be fixed by padding or by size: the aspect is the outline's.

## Decision

**The caveat mark is a ring this panel draws, with a letter inside it.** An 11px box, a 1px border
in the caveat ink, `border-radius: 50%`, and `i` at 9px centred in it. `CAVEAT_MARK` is that letter
and nothing more; the shape is `DESIGN.md`'s and the stylesheet's.

Nine is the size, measured rather than picked: at 10px the tittle merges into the stem and the mark
reads as `!`, and at 11px the stem touches the ring. Nine is the one size where an `i` is an `i`
inside a circle at this body size.

**The other three marks stay codepoints.** `⚠` measures 11.66px, `✖` 10.91 and `▸` 6.53 — each at or
about its own height in the face that draws it, because none of them is a circled letter. Only the
shape that no font could be relied on for had to be built.

**The sentence at the foot of a card wears the same ring**, appended after the text and stood before
it by the sheet. It is not spelled into the note's own string, so the count that turns a card's
lines into a height goes on adding it explicitly.

## Consequences

The mark is a circle wherever the panel is opened, which is the property it never had: a reader on
Windows may have been seeing a passable one all along, and nothing in this tree could tell.

One trap replaces another. The glyph sat inside the note's text so that the height arithmetic would
count it; now the text does not carry it and `getTipLineCost` adds it back for a caveated tone.
`tests/ui/panel-tip.test.ts` holds that at the one length where the two answers differ, and the
comment that used to warn against hoisting the glyph now says what pays for having hoisted it.

The note is a flex row where it wears a mark, which buys a hanging indent: a sentence running to a
second line aligns under its own first word rather than under the ring.

The ring is `display: inline-flex` with `align-self: center`, because both places it stands are flex
rows that stretch a child by default — and a ring stretched to an 18px line box is the ellipse this
decision exists to stop being.

`tests/e2e/panel-marks.spec.ts` gains the claim no unit test can make: the mark is as wide as it is
tall, on the row and on the card. `line-height`, `order` and five pairs join
`docs/browser-support.md`, all far under the floor.

## Alternatives

**A different codepoint.** `🛈` U+1F6C8 measures 13px at 13px — square, and the right meaning.
Rejected: it sits in a pictographic block, so it is a colour emoji on some machines and missing on
others, and the whole point is a shape that does not depend on which.

**Padding or a size, as the report suggested.** Neither reaches the outline. A wider cell around a
narrow ellipse is a wider cell around a narrow ellipse.

**Leave it, because Windows probably draws it properly.** Rejected on what it would commit us to:
the panel would look right for most readers and wrong for the rest, with no measurement able to say
which, and the next font change on any platform would move it again without a line of code.

**A `::before` pseudo-element instead of a node.** It needs no DOM change at all and would have kept
the note's text its own. Rejected because the letter would then be spelled in the stylesheet as well
as in `src/ui/panel-words.ts`, and this tree keeps a word in one place.
