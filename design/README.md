# Design rounds

A round is one question about a surface this repository draws — the panel, or the page the panel is
published on — asked over what can be measured and answered on a canvas. A round appears when there
is a question worth measuring, and not before (**C9**).

- [`instalacja/`](instalacja/) — how somebody who has installed nothing gets to a working panel.
  Owns the install band, the step whose failure is silent, and the offer button.
- [`strona/`](strona/) — what the published page is as one designed thing. It owns the page's own
  visual language, which `DESIGN.md` never gave it: that document is about the panel, and the page
  went on to invent a palette of its own rather than take the one the panel already states.

## What a round is

A directory named for its question, in one word, holding:

- `Main.dc.html` and its siblings — one `.dc.html` per sheet, each an artboard on the canvas.
  Polish prose over mockups of the panel drawn at its real 260 px.
- `canvas.json` — where each artboard sits, the pages they are grouped on, and the notes beside
  them.
- `measure.ts` — run by hand, and it earns no `deno task` entry because it has one consumer
  (**C9**). It reads what its round is about — the recordings through the shipped modules, the built
  page, or both — and writes `measured.json`.
- `measured.json` — what it read, and the material it read it on.
- The published canvas, named for the round's question, which the artboards are seeded into.

`deno fmt` does not enter this directory. A canvas writes these files itself, header and layout
included, so formatting them starts a fight the canvas wins on its next save and the gate loses on
every run in between — `deno.json` carries that reason beside the exclusion.

## What binds one

- **A sheet states a reading, not a recollection.** Every figure comes from `measured.json`, or
  cites the document that owns it. What another round already measured is cited there and never
  counted again (**V4**, **V5**).
- **A measurement names its material** — the recording, or the corpus and the date it was taken on.
- **The vocabulary is `CONTEXT.md`'s** (**N12**), and the sheets are read by somebody who reads the
  panel: *ekran*, *umiejętność*, *Zatrzymane*, *rozbicie* — never *widok*, *ability*, *absorbed*,
  *breakdown*.
- **A refusal names its owner.** The `Odmowy` sheet carries what the round will not do, and the
  document or ADR that says so, so nobody re-opens it in six months without reading why.
- **A drawn fight is a drawing.** A figure invented to fill a sheet is indistinguishable from a
  measurement. What the corpus does not hold, a round says it does not hold; what only a fabricated
  fight can show is rendered through the panel and labelled as never material
  (`tools/fabricated-fight.ts`).

## What a round does not decide

A round ends in a recommendation. It moves no rule and no guard: `docs/drill-levels.md`,
`PRODUCT.md`'s tiers and the counts in `tests/` are changed by the commit that implements a
direction, never by the canvas that proposed it. Whether a direction is taken is the maintainer's
(`PRODUCT.md`, Governance).
