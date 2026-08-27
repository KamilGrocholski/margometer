/**
 * How the panel looks: every colour, space and radius it uses, and the
 * stylesheet built out of them.
 *
 * §9.7 is the whole of why both halves are here. A raw hex in a rule is a bug,
 * and text on a coloured bar has to clear WCAG contrast by measurement rather
 * than by eye — so the values have to live somewhere a test can reach, and the
 * rules that spend them have to reach nothing else. Keeping the two apart made
 * that a promise across a module boundary; keeping them together makes it a
 * promise a reader can check by scrolling, and `tests/tools/source-layout.test.ts`
 * still holds it by refusing a colour literal anywhere else in `src/ui/`.
 *
 * Dark-first, because the panel sits over a dark game and is never asked to be
 * anything else.
 */

import { assertDefined } from "@/libs/assert.ts";
import {
  composeHexadecimalByteText,
  composeIntegerText,
  getIntegerFromHexadecimalText,
} from "@/libs/number.ts";

/**
 * Bar colours, in a fixed order that is never cycled.
 *
 * Carried over from the previous incarnation, where the set was validated for a
 * dark background — lightness band, chroma floor, separation under the common
 * colour-vision deficiencies, and contrast against the panel. Re-deriving them
 * would mean re-running that search to arrive somewhere no better; what is
 * re-checked here is the property this panel depends on, which is contrast.
 */
export const SERIES_COLOURS = [
  "#3987e5",
  "#008300",
  "#d55181",
  "#c98500",
  "#199e70",
  "#d95926",
  "#9085e9",
  "#e66767",
] as const;

/** For anyone whose profession the game did not state. Deliberately colourless. */
export const UNKNOWN_COLOUR = "#8a8a80";

/**
 * Six of the eight. The last two are unassigned and stay inside
 * `SERIES_COLOURS`, which is exported and measured for contrast — naming them
 * here bought nothing but a compiler complaint.
 */
const [BLUE, GREEN, MAGENTA, YELLOW, AQUA, ORANGE] = SERIES_COLOURS;

/**
 * Profession → colour, the pattern damage meters have used for twenty years: the
 * bar says *what* somebody is and the name beside it says *who*. Two mages get
 * one colour on purpose.
 *
 * The codes are the game's own single letters, kept as the game spells them
 * rather than translated (§9.4 — abbreviate only where the game does).
 */
export const PROFESSION_COLOURS: Record<string, string> = {
  w: ORANGE,
  p: MAGENTA,
  t: YELLOW,
  h: GREEN,
  m: BLUE,
  b: AQUA,
};

export function getProfessionColour(profession: string | null): string {
  if (profession === null) return UNKNOWN_COLOUR;
  return PROFESSION_COLOURS[profession] ?? UNKNOWN_COLOUR;
}

/**
 * The lengths placement needs as numbers rather than as CSS.
 *
 * ⚠️ **The numbers are the source and the tokens are composed from them**, not
 * the other way round. A panel anchored to the top-right corner by the
 * stylesheet has no `left` anyone can read back, so the first drag has to work
 * out where it already was — and it can only do that from the same margin and
 * width the stylesheet used. Two copies of `310` would drift, and the drift
 * would show as the panel jumping under the hand on the first grab.
 *
 * `spaceSmall` is the gap between the panel and the detail window, and it is
 * here for the same reason `tipWidth` is: the side the detail opens on is
 * arithmetic on the panel's own left edge, and the gap is one of its terms.
 */
export const PANEL_PIXELS = { space: 8, width: 260, tipWidth: 250, spaceSmall: 4 } as const;

/**
 * How far down the panel a region is inset, named because two rules need it and
 * the second one exists to cancel the first — see `spaceRegionDown`.
 */
const REGION_STEP_DOWN = "5px";
/** The other half of that step, named for the same reason: two rules want it. */
const REGION_STEP_ACROSS = "7px";

export const PANEL_TOKENS = {
  surface: "#17171c",
  surfaceRaised: "#1f1f26",
  /**
   * What a bar runs along, and what it means: **"there is nothing here yet"**
   * rather than "this is a bar". The same track carries a row and the split
   * between the two sides, because it is the same statement in both places.
   */
  track: "#24242a",
  border: "#2c2c35",
  text: "#e7e7ea",
  textQuiet: "#9a9aa6",
  /**
   * How solid a bar is over the row behind it.
   *
   * ⚠️ **Not a taste. It is what makes the row readable, and it was measured.**
   * The palette was validated for contrast *against the background*, which is a
   * different question from text drawn *on top of a bar*: at full strength the
   * green clears only 3.71:1 against dark ink, under the 4.5:1 §9.7 requires,
   * and no single ink clears all nine colours. Tinting instead keeps the text on
   * the panel's own surface, where it sits at 13:1, and the worst case across the
   * palette becomes 5.25:1. Raise this past about 0.6 and the green fails again.
   */
  barTint: "0.55",
  suspect: "#c98500",
  /**
   * The pair that means a side rather than a person.
   *
   * Deliberately not from the profession palette: those answer "who is what", and
   * these two answer "which of the two teams" — a colour doing both would make a
   * paladin's row look like the enemy's total. Never the only thing carrying the
   * meaning either: the figures they colour are labelled and stand in fixed
   * places (§9.7).
   */
  ours: "#6fbf8b",
  theirs: "#e0736f",
  /**
   * One bar, and the height the list is measured in.
   *
   * The list promises a *minimum* number of rows and computes its height from
   * this, so the two cannot drift: a taller row silently means a taller window
   * rather than a broken promise.
   */
  rowHeight: "18px",
  /**
   * The most of the window the panel may ever cover.
   *
   * Taste, and said so rather than dressed up as a measurement: we are a guest
   * over a game somebody is playing, so a breakdown with forty rows to show does
   * not get to take the screen just because a tall monitor could hold it. The
   * other half of the ceiling is the window itself and lives in the stylesheet —
   * this one binds where there is room to spare.
   */
  maxHeightShare: "66vh",
  /**
   * The two inks a profession badge can carry, and the only two.
   *
   * The letter is the **non-colour channel** the palette's whole argument rests
   * on: six professions cannot be made mutually distinguishable on this
   * background — the ceiling is four — so under colour-vision deficiency it is
   * the letter, not the hue, that answers "who is what".
   */
  badgeInkDark: "#14141a",
  badgeInkLight: "#ffffff",
  /**
   * How wide the detail window is.
   *
   * ⚠️ **Composed from the number above, and it was written the other way round
   * first.** The code that decides which side of the pointer the tooltip opens on
   * asked this token for a width, got `"250px"`, read it as no number at all and
   * quietly used zero — so the tooltip never flipped and ran off the right edge
   * of the page, which is precisely where the panel lives. Same lesson as
   * `PANEL_PIXELS` above, paid for a second time: a length that arithmetic needs
   * is a number first and CSS second.
   */
  tipWidth: `${composeIntegerText(PANEL_PIXELS.tipWidth)}px`,
  radius: "8px",
  /** The small radius, on the things that sit inside something already rounded. */
  radiusSmall: "3px",
  /**
   * Pure black, and only ever as a mask.
   *
   * A `mask-image` reads alpha and throws the hue away, so this is not a colour
   * anybody sees — it is the opaque end of a gradient. Named anyway, because §9.7
   * says a raw hex in a rule is a bug and an exception nobody can see the edge of
   * is how the next one gets written
   * (`docs/audits/2026-08-14-the-whole-tree-read-again.md`, F25).
   */
  maskInk: "#000000",
  /**
   * What lifts the detail window off the page.
   *
   * The whole declaration rather than the colour alone: the offset, the blur and
   * the opacity are one decision about how far off the page it sits, and three
   * tokens would let two of them be changed without the third.
   */
  windowShadow: "0 6px 20px rgb(0 0 0 / 55%)",
  /** Composed from the number, for the reason `tipWidth` is: the flip needs both. */
  spaceSmall: `${composeIntegerText(PANEL_PIXELS.spaceSmall)}px`,
  /** Half a step. The design puts a row's own text this far from its edge. */
  spaceHalf: "2px",
  /** The step every region is inset by: 5px down the panel, 7px across it. */
  spaceRegion: `${REGION_STEP_DOWN} ${REGION_STEP_ACROSS}`,
  /**
   * The down half of that step, on its own, because one rule has to undo it.
   *
   * ⚠️ **A scroll container's padding is inside its clip**, so a sticky heading
   * pinned at the top of the list leaves the list's own five pixels above itself —
   * and what shows through them is the row that just scrolled away, which reads as
   * half a bar hanging over the heading. The heading pulls itself up by exactly
   * this, so the two cannot drift: measured in Firefox, 5px of a tinted bar.
   */
  spaceRegionDown: REGION_STEP_DOWN,
  /** The across half, for the rules that inset without stepping down. */
  spaceRegionAcross: REGION_STEP_ACROSS,
  space: `${composeIntegerText(PANEL_PIXELS.space)}px`,
  spaceLarge: "12px",
  /** Narrow on purpose: the panel is a guest over a game someone is playing. */
  width: `${composeIntegerText(PANEL_PIXELS.width)}px`,
  /**
   * Above the game, and named here rather than typed into the entry point.
   *
   * High enough to clear the game's own windows, which is the whole requirement —
   * there is nothing of ours for it to be relative to.
   */
  layer: "9999",
} as const;

/** One sRGB channel to linear light, WCAG 2.1. */
function getLinearChannel(channel: number): number {
  const proportion = channel / 255;
  return proportion <= 0.04045
    ? proportion / 12.92
    : Math.pow((proportion + 0.055) / 1.055, 2.4);
}

/**
 * The three channels of a `#rrggbb` colour, or null if it is not one.
 *
 * One reader, because the pattern and the digit-by-digit reading below it were
 * written twice in this file with two different spellings of the same null
 * handling — and a colour format that two functions disagree about is a contrast
 * ratio computed against something nobody drew.
 */
function getChannelsFromColour(colour: string): number[] | null {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(colour);
  if (match === null) return null;

  const channels = [match[1], match[2], match[3]].map((channel) =>
    getIntegerFromHexadecimalText(channel ?? ""),
  );
  return channels.every((channel) => channel !== null) ? channels : null;
}

/**
 * Relative luminance of a `#rrggbb` colour, or null if it is not one.
 *
 * Null rather than a throw: the caller is a test asking a question about a
 * value, and a malformed token is a fact to report rather than an exception to
 * handle.
 */
function getRelativeLuminance(colour: string): number | null {
  const channels = getChannelsFromColour(colour);
  if (channels === null) return null;

  const [red, green, blue] = channels.map(getLinearChannel);
  if (red === undefined || green === undefined || blue === undefined) return null;
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/**
 * One colour laid over another at an alpha, the way CSS composites `opacity`.
 *
 * In sRGB rather than linear light, because that is what the browser does here
 * and the point of this function is to predict what will actually be on screen.
 */
export function composeColourOver(top: string, bottom: string, alpha: number): string | null {
  const above = getChannelsFromColour(top);
  const below = getChannelsFromColour(bottom);
  if (above === null || below === null) return null;

  const mixed = above.map((one, channel) =>
    composeHexadecimalByteText(Math.round(alpha * one + (1 - alpha) * (below[channel] ?? 0))),
  );
  return `#${mixed.join("")}`;
}

/**
 * Dark ink or light, whichever reads better on that colour.
 *
 * Computed rather than tabulated, because a table drifts silently the first time
 * a colour changes — and this is an accessibility floor, not a taste. One badge
 * comes out light among dark ones and that is the price of the floor: at the
 * hunter's green even pure black clears only 4.25, so no single ink works for
 * all six professions.
 *
 * ⚠️ **Asserted rather than defaulted, and the two nulls are why.** This read
 * `getContrastRatio(…) ?? 0` on both sides. `getContrastRatio` answers null when
 * a colour is unreadable and the function above argues for that null against a
 * throw — but this caller reported nothing: both nulls became `0`, `0 >= 0` is
 * true, and a colour nobody could measure shipped dark ink as confidently as one
 * that was measured. §9.3's "unknown is loud, never zero" and §9.5's last table
 * row both name that substitution as the failure this project exists to prevent,
 * and it was sitting in the one function that decides whether a label can be read
 * (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F5).
 *
 * An assertion and not an error class, because of **who produced the value**
 * (§9.5). Every colour reaching here is one of ours: the caller passes
 * `getProfessionColour`'s answer, which is `PROFESSION_COLOURS` or
 * `UNKNOWN_COLOUR`, both declared in this file. A null means a token here is
 * malformed, which nobody can handle and which the tests below already measure —
 * so it is a broken invariant, not a domain failure, and it gets no `code`.
 *
 * Safe to throw from despite §9.6, because the panel's isolation is structural
 * rather than a habit: `renderRegionInto` catches per region, so this becomes the
 * marker that says one region could not be drawn while the rest of the panel
 * stands. A badge whose ink was never measured is exactly what that marker is
 * for.
 */
export function getProfessionInk(colour: string): string {
  const invariant = "the ink and the badge colour are both readable";
  const dark = assertDefined(getContrastRatio(PANEL_TOKENS.badgeInkDark, colour), invariant);
  const light = assertDefined(getContrastRatio(PANEL_TOKENS.badgeInkLight, colour), invariant);
  return dark >= light ? PANEL_TOKENS.badgeInkDark : PANEL_TOKENS.badgeInkLight;
}

/** WCAG contrast ratio between two colours, or null if either is unreadable. */
export function getContrastRatio(one: string, other: string): number | null {
  const first = getRelativeLuminance(one);
  const second = getRelativeLuminance(other);
  if (first === null || second === null) return null;

  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * `all: initial` on the host, because the game's stylesheet is not ours to
 * inherit and a panel that changes shape when the game restyles itself is a
 * panel nobody can trust to be readable.
 *
 * The placement that never changes is here rather than written onto the host in
 * script: the corner is where the panel starts, and a page where nothing was ever
 * dragged should need no JavaScript to put it there. `display` is restated
 * because `all: initial` resets it to `inline`, on which a fixed width means
 * nothing.
 *
 * ⚠️ **The list's height is arithmetic, not a number typed in.** The spec
 * promises at least eleven bars under `Wszyscy` and ten under a filter; both are
 * computed from the row height so that changing the type size cannot quietly
 * break the promise, and the count arrives as a custom property the render sets.
 *
 * ⚠️ **The floor is arithmetic and the ceiling is the window.** How many rows the
 * list asks for is the view's decision; how many it may have is this file's, and
 * it is one `max-height` on the host — so the panel cannot reach past the bottom
 * edge of a screen this file never measures.
 */
export function composePanelStyleText(): string {
  const t = PANEL_TOKENS;
  return `
:host {
  all: initial;
  /*
   * A column, so the list can be the one region that gives way to the ceiling
   * below. Restated after \`all: initial\` for the same reason \`display: block\`
   * was: the reset turns it into \`inline\`, on which none of this means anything.
   */
  display: flex;
  flex-direction: column;
  position: fixed;
  /*
   * Where the top edge is, as a value the ceiling can subtract. Written by
   * placement on every move, defaulted here so a page where nothing was ever
   * dragged needs no script — and \`all\` does not reset custom properties, which
   * is what makes a default in this rule survive the line above.
   */
  --MargoMeter-panel-top: ${t.space};
  top: var(--MargoMeter-panel-top);
  right: ${t.space};
  /*
   * ⚠️ **The panel never reaches past the bottom of the screen, and never covers
   * more of it than the token allows.** In CSS rather than measured: the panel's
   * height changes with every payload, so anything read out of the document is
   * stale before the next one. That the detail window below *is* measured is not
   * the same case and does not reopen this one — it is rebuilt and placed in one
   * breath, while the panel is measured once and drawn against for minutes. The
   * gap left at the bottom is the margin the panel starts with at the top.
   */
  max-height: min(calc(100vh - var(--MargoMeter-panel-top) - ${t.space}), ${t.maxHeightShare});
  z-index: ${t.layer};
}
.MargoMeter-titlebar {
  /* Never the region that shrinks: it is the thing you grab. */
  flex: none;
  display: flex;
  align-items: center;
  gap: ${t.spaceSmall};
  padding: ${t.spaceSmall} ${t.space};
  font: 11px/1.2 system-ui, sans-serif;
  letter-spacing: 0.06em;
  color: ${t.textQuiet};
  background: ${t.surfaceRaised};
  border: 1px solid ${t.border};
  border-bottom: none;
  border-radius: ${t.radius} ${t.radius} 0 0;
  box-sizing: border-box;
  width: ${t.width};
  /* The affordance is the cursor and the grip; nothing animates to advertise it. */
  cursor: move;
  /*
   * The one \`-webkit-\` in this repository, and it is not a fallback that ages
   * out: Safari has never shipped \`user-select\` unprefixed (browser-compat-data,
   * read 2026-08-18), so without this line a drag by the bar selects the text
   * under the cursor there. Spelled beside every unprefixed one, which is a
   * count docs/browser-support.md holds rather than a habit.
   */
  -webkit-user-select: none;
  user-select: none;
  touch-action: none;
}
.titlebar-button {
  padding: 0 ${t.spaceSmall};
  border: 1px solid ${t.border};
  border-radius: ${t.radius};
  color: ${t.textQuiet};
  background: ${t.surface};
  /* Overrides the move cursor the bar sets: inheriting it would promise a drag
     from the one place in the bar that does not drag. */
  cursor: pointer;
}
.titlebar-button:hover { color: ${t.text}; }
.titlebar-version { color: ${t.textQuiet}; opacity: 0.7; font-size: 10px; }
.titlebar-copy { margin-left: auto; }
/* First of the buttons and left of the gap, so the shelf sits beside the name
   rather than among the three controls that act on what is drawn. */
.titlebar-fights { margin-left: ${t.space}; }
/* Dimmed because it is not for the player: it hands over the raw material. */
.titlebar-raw { opacity: 0.55; }
.titlebar-raw:hover { opacity: 1; }
/*
 * What every render draws into. It carries a class for one reason: a flex item
 * whose overflow is visible refuses to shrink below its own content, so without
 * \`min-height: 0\` here the ceiling on the host would stop at this node and never
 * reach the list.
 */
.MargoMeter-body { display: flex; flex-direction: column; min-height: 0; }
/*
 * No padding of its own: every region below is inset by the same step instead,
 * which is what lets the list run the full width of the panel and the rules
 * between regions reach both edges.
 */
.panel {
  font: 11px/1.35 system-ui, sans-serif;
  width: ${t.width};
  color: ${t.text};
  background: ${t.surface};
  border: 1px solid ${t.border};
  /* Square at the top: the title bar above it carries those two corners. */
  border-radius: 0 0 ${t.radius} ${t.radius};
  box-sizing: border-box;
  /* The other half of the chain the ceiling travels down — see .MargoMeter-body. */
  display: flex;
  flex-direction: column;
  min-height: 0;
}
/*
 * ⚠️ **Only the list gives way.** When the ceiling is lower than the panel wants
 * to be, the shortfall has to come out of somewhere, and every region but one
 * says the same thing at any height: a header, two strips of controls, the row
 * for what nobody can be charged with, the summary, a warning. There is nothing
 * to take off them, so they are told not to offer any — the list, which has a
 * fold and a scrollbar, takes all of it.
 *
 * The second rule is more specific rather than merely later: a \`.panel > *\` moved
 * below it would otherwise take the list's shrinking away without a word.
 * \`.undrawn\` needs no rule of its own — it is a \`.panel > *\` like the region it
 * replaced.
 */
.panel > * { flex: none; }
.panel > .list { flex: 0 1 auto; }
/* Wrapping between tabs and never inside one: the shelf's three places are
   phrases, and at 260px a broken phrase reads as two controls. Driven in Firefox
   on 2026-08-26, where the middle one of the three sat on two lines. */
.tabs { display: flex; flex-wrap: wrap; gap: ${t.spaceHalf}; padding: ${t.spaceRegion}; padding-bottom: 0; }
/* Every strip after the first sits closer to it: they are one control, in rows.
   A sibling selector rather than a class, so a third strip needed no new rule and
   sides-of did not have to become a name for something it is not. */
.tabs + .tabs { padding-top: ${t.radiusSmall}; }
.tab {
  white-space: nowrap;
  padding: 1px ${t.spaceSmall};
  border-radius: ${t.radiusSmall};
  color: ${t.textQuiet};
  background: transparent;
  cursor: pointer;
  /* Prefixed beside the standard property, for the reason the title bar states. */
  -webkit-user-select: none;
  user-select: none;
}
.tab.selected { color: ${t.text}; background: ${t.surfaceRaised}; }
/* Holds the side filter against the right edge, so the row reads as the two
   controls it is rather than one strip of five words. */
.tabs-gap { flex: 1; }
.crumb { display: flex; gap: ${t.space}; align-items: baseline; padding: ${t.spaceRegion}; padding-bottom: 0; }
.crumb-back { cursor: pointer; color: ${t.textQuiet}; }
.crumb-back:hover { color: ${t.text}; }
.crumb-here { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/*
 * The list is the only thing that scrolls, and the only thing that gives way.
 *
 * Its height is what the view asked for: eleven bars under \`Wszyscy\`, ten under a
 * filter, and as many as a breakdown needs — never fewer than the ranking it was
 * opened from, so clicking into a combatant cannot shorten the window under the
 * hand. The ceiling on the host takes height back out of here and nowhere else.
 *
 * ⚠️ **Content box, deliberately.** The height above is the rows' own; the 12px of
 * padding sits outside it. Adding \`box-sizing: border-box\` would fold the padding
 * in and leave eleven bars a hair too tall for the list holding them, which shows
 * up as a scrollbar on a list that fits.
 */
.list {
  padding: ${t.spaceRegion};
  padding-bottom: ${t.spaceRegionAcross};
  height: calc(var(--MargoMeter-rows, 11) * (${t.rowHeight} + ${t.spaceHalf}) + ${t.spaceLarge});
  overflow-y: auto;
  overflow-x: hidden;
  /* Reserved whether or not a scrollbar is showing: it appears and disappears
     between two payloads, and a panel whose rows jump sideways every few seconds
     while somebody is reading them is worse than eleven pixels of margin. The
     two regions that draw a bar outside this one reserve it too — see \`.pinned\`. */
  scrollbar-gutter: stable;
  /* A wheel that has run out of list stops here rather than turning into a scroll
     of the game we are a guest on. */
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: ${t.border} transparent;
}
/*
 * Not uppercased by the stylesheet, which is what it did until a heading started
 * carrying a name: CZYM — GRACZ 4 shouts somebody name at them. The fixed
 * headings are written in capitals where they are composed, so a name keeps the
 * case the game gave it.
 */
/*
 * ⚠️ **It stays at the top edge while its own section scrolls**, so a figure is
 * never read under the wrong heading — a breakdown stacks three of them and the
 * one you are looking at is the one that matters.
 *
 * The background and the \`z-index\` are not decoration and cannot be dropped: a
 * row's bar is absolutely positioned and comes later in the tree, so a sticky
 * heading without both is painted over by the bars sliding under it.
 *
 * ⚠️ **The quiet is in the colour now, not in an \`opacity\`.** It read the same
 * either way while the heading stood still; sticking it over a scrolling row does
 * not, because \`opacity\` fades the background with the text and a bar would ghost
 * through it. The colour is the same composite the browser was making, computed
 * once instead.
 */
.section-heading {
  position: sticky;
  /* Up by the list's own inset, because that padding is inside the scroll's clip
     and the row scrolling away would otherwise show through it — see the token. */
  top: -${t.spaceRegionDown};
  z-index: 1;
  background: ${t.surface};
  display: flex;
  justify-content: space-between;
  color: ${composeColourOver(t.textQuiet, t.surface, 0.85) ?? t.textQuiet};
  letter-spacing: 0.08em;
  font-size: 10px;
  padding: ${t.spaceSmall} ${t.spaceHalf} ${t.spaceHalf};
}
.row {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: ${t.rowHeight};
  padding: 0 ${t.spaceSmall};
  margin-bottom: ${t.spaceHalf};
  border-radius: ${t.radiusSmall};
  background: ${t.track};
  overflow: hidden;
}
.row.drillable { cursor: pointer; }
.row.leaf { cursor: help; }
.bar { position: absolute; left: 0; top: 0; bottom: 0; opacity: ${t.barTint}; }
/*
 * The colour at full strength, on the edge the bar starts from.
 *
 * The bar itself is tinted so the text on it stays readable — see the tint
 * token — which costs the hue the palette was validated at; the cap gives it
 * back somewhere no text sits. It says whose, while the length says how much.
 */
.bar-cap { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; border-radius: ${t.radiusSmall} 0 0 ${t.radiusSmall}; }
.row-rank, .row-name, .row-value { position: relative; }
.row-rank { color: ${t.textQuiet}; font-variant-numeric: tabular-nums; padding-right: ${t.spaceSmall}; }
/*
 * The profession, as a letter. It is the channel that survives colour blindness,
 * which is the whole reason the palette can stay as it is — so it is not
 * decoration and it is not optional where the game stated a profession.
 */
.row-badge {
  position: relative;
  flex: none;
  width: 13px;
  height: 13px;
  margin-right: ${t.spaceSmall};
  border-radius: ${t.radiusSmall};
  font-size: 9px;
  font-weight: 700;
  line-height: 13px;
  text-align: center;
}
.row-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
/*
 * The size on a shelf row, as wide as the figure it holds and no wider.
 *
 * ⚠️ **\`flex: none\` is what keeps the ellipsis off it.** The cell after this one
 * is \`.row-name\`, which holds the map's name and is the only thing on the row
 * allowed to shorten; without this the two would give way together and a long
 * name would take \`10×1\` with it. \`tests/ui/panel-element.test.ts\` holds the
 * order of the cells and nothing holds this declaration — a stylesheet asserted
 * against itself proves only that two files agree (§7.5), and what would catch
 * this is a browser, not a test.
 */
.row-size { flex: none; padding-right: ${t.spaceSmall}; }
.row-value { font-variant-numeric: tabular-nums; padding-left: ${t.space}; font-weight: 600; }
.row-share { color: ${t.textQuiet}; padding-left: ${t.spaceSmall}; font-weight: 400; }
/*
 * The mark that says a figure on this row might not be what happened.
 *
 * Before the name and not after the number, because it qualifies the row rather
 * than the figure the eye lands on last — and because putting it at the end of the
 * line would move under the share on a long name. Nothing animates and nothing
 * flashes (§9.6): it is a glyph the same size as the text, in the colour the
 * fight's own warnings wear, and what it means is in the card the row opens.
 */
.row-warning { color: ${t.suspect}; padding-right: ${t.spaceSmall}; font-weight: 700; }
/*
 * The one row that says something is missing, and so the one row that never
 * scrolls away: it sits outside the list, above the side summary.
 */
/*
 * The row for what nobody can be charged with, and it is drawn as what it is.
 *
 * A dashed rule cuts it off the ranking above, and the bar is hatched rather
 * than solid — it is not a combatant, so it must not look like one at a glance.
 * The colour is the one for "we cannot say", which is the same thing the hatch
 * says in another channel (§9.7: never colour alone).
 *
 * ⚠️ **The rule belongs to the block, not to the row.** It sat on the row once,
 * which bought the air under it by making that one row 5px taller and pushing its
 * bar and cap down 4px — so the marking was 19px inside a 23px track and the row
 * wore a strip of bare background no other row has. A row that says something is
 * missing is still a row, and rows are one height. The inset is a margin so the
 * rule is still drawn the width of the row and not the width of the panel.
 */
/*
 * ⚠️ **It reserves a scrollbar gutter with nothing to scroll, and so does
 * \`.sides-region\`.** A bar is drawn in three containers, and a bar means a length:
 * the same \`fill\` has to come out the same width in all three or the eye compares
 * figures that were never on one scale. The list pays a gutter whether or not its
 * scrollbar is showing (see \`.list\`), and these two sit outside the list, so the
 * row for what nobody can be charged with and the summary track were drawn a
 * gutter wider than every ranked row — 8px of it, read off the panel in
 * \`screenshots/panel-taken.png\` at \`v0.8.1\`, on a 260px panel.
 *
 * The width is asked for rather than written down, because only the browser knows
 * what a gutter costs: \`thin\` measures 6px in Firefox 140.13.0esr (2026-08-26) and
 * a platform width elsewhere, so a token holding a number would be one engine's
 * measurement wearing the costume of a constant. \`overflow: hidden\` is a scroll
 * container that never scrolls, which is the whole of what is wanted here —
 * measured in the same Firefox against \`overflow-y: auto\` and against a list that
 * really does scroll: 254px of 260 in all three.
 *
 * Below \`scrollbar-gutter\`'s floor nobody reserves anything and the three stay
 * equal; below \`scrollbar-width\`'s they all reserve a platform gutter and stay
 * equal again (\`docs/browser-support.md\`). Held by
 * \`tests/ui/panel-element.test.ts\`.
 */
.pinned-region {
  margin: ${t.spaceSmall} ${t.spaceRegionAcross} 0;
  padding: ${t.spaceSmall} 0 ${t.spaceRegionAcross};
  border-top: 1px dashed ${t.border};
  overflow: hidden;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
}
.pinned-region .bar {
  opacity: 0.4;
  mask-image: repeating-linear-gradient(-45deg, ${t.maskInk} 0 4px, transparent 4px 8px);
}
.pinned-region .bar-cap { opacity: 0.7; }
/*
 * Two rows in one region: the size against the outcome, and the place under
 * both. A block rather than a column flex because the line below is the only
 * thing that needs to be one, and \`display: block\` was already in this sheet.
 */
.header { display: block; padding: ${t.spaceRegion}; padding-bottom: 0; }
.header-line { display: flex; justify-content: space-between; align-items: baseline; }
/*
 * The whole width, because it is the one thing on the header that can be long.
 *
 * ⚠️ **This is why it is a line and not a third item on the one above.** Beside
 * \`10 vs 1\` and \`WYGRANA\` it had about thirty characters of a 260px panel, and a
 * map's name plus a tile runs half again that — so the one thing answering
 * *where* was the one thing being cut. Nothing here is measured, so putting it
 * back on that line would go unnoticed by every test in this repository.
 */
.header-place { color: ${t.textQuiet}; font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.header-outcome { color: ${t.textQuiet}; text-transform: uppercase; font-size: 10px; }
.empty { color: ${t.textQuiet}; padding: ${t.space} ${t.spaceHalf}; }
/*
 * The one list with nothing above the sentence, so the sentence is what the box
 * is for. Everywhere else \`.empty\` is a line under rows or under a heading and
 * reads correctly where it lands; here it would sit in the top corner of a box
 * eleven bars tall, which reads as a panel that lost the rest of itself.
 */
.list-waiting { display: flex; align-items: center; justify-content: center; text-align: center; }
/* The limit on what can be known reads quieter than the fact above it. */
.empty-limit { display: block; margin-top: ${t.spaceSmall}; font-size: 10px; opacity: 0.85; }
/* The shelf of kept fights. Everything else it draws is the ranking's own
   furniture — the row, the list and the tab strips — so only what has no
   counterpart there is here. */
.tabs-label { color: ${t.textQuiet}; align-self: center; padding-right: ${t.spaceSmall}; }
/*
 * ⚠️ **A box of its own size, because the glyph is not a fixed size.** The mark
 * is ★ when pinned and ☆ when not, and \`system-ui\` is whatever the platform
 * says it is: the two resolve through one fallback on some and two on others, so
 * an advance width that matches here matches nowhere by promise. Measured in
 * Firefox on 2026-08-26, both came out at 13.87px — and the row still walked
 * sideways under the hand that had just pressed it, on the machine the report
 * came from. A box sized here is the only version of this that does not depend on
 * a font: whatever the glyph does, it does it inside.
 *
 * Square, and the row's own height rather than a number of its own, so it is a
 * target rather than a mark somebody has to aim at — it was 14.85px of an
 * 18px row and about ten wide, a third of the area it has now. \`align-self\` is
 * what buys the height: every other item on a row is centred inside its own line
 * box, which is what made this the shortest thing on it. That the area comes off
 * the left edge of the row is deliberate: those pixels used to open the fight,
 * and the reader reaching for a pin is not reaching for the fight.
 */
.row-pin {
  position: relative;
  cursor: pointer;
  color: ${t.textQuiet};
  width: ${t.rowHeight};
  flex: none;
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: ${t.spaceSmall};
}
.row-pin:hover { color: ${t.text}; }
/* ⚠️ **Colour, and nothing that takes up room.** The state is drawn by the glyph
   and said again by the ink; a rule here that moved an edge would put the box
   back to being two sizes, which is the thing above exists to stop. */
.row-pin.pinned { color: ${t.text}; }
/* Which fight is on screen. A left edge and not a colour alone (§9.7): the
   outcome word beside it is what the colour would otherwise be carrying. */
.row.chosen { box-shadow: inset 3px 0 0 ${t.text}; }
/* The gutter is the one \`.pinned\` argues for: the track below is a bar like any
   other, and it is inset like one. */
.sides-region {
  padding: ${t.spaceRegion};
  padding-bottom: ${t.spaceRegionAcross};
  border-top: 1px solid ${t.border};
  overflow: hidden;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
}
.sides {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}
.sides-label { color: ${t.textQuiet}; font-weight: 400; opacity: 0.8; }
/* Quieter and smaller than the confrontation above it: it is the part of the
   fight that has nobody to be on a side of, not a third team. */
.sides-spare { margin-top: ${t.spaceSmall}; font-size: 10px; }
.sides-spare .sides-label { color: inherit; }
.sides-track { display: flex; height: 4px; margin-top: ${t.spaceSmall}; border-radius: ${t.radiusSmall}; overflow: hidden; background: ${t.track}; }
.warning { color: ${t.suspect}; padding: 0 ${t.spaceRegionAcross} ${t.spaceRegionDown}; }
.warning:first-of-type { padding-top: 5px; border-top: 1px solid ${t.border}; }
/*
 * The detail, as a window of ours rather than the browser's own tooltip.
 *
 * It never takes the pointer, so it cannot cover the row that summoned it and
 * flicker — and so nothing in it can be scrolled, which is why what it says has
 * to be *placed* onto the screen rather than trimmed to it.
 *
 * Everything below the width is a starting point rather than the last word:
 * src/ui/panel-element.ts writes a left and a top over it on every hover
 * that has a window to fit into. What is here is where the detail sits when
 * nothing does — a page that would not say how big it is, or a document with no
 * layout to measure.
 */
.MargoMeter-tip {
  /*
   * Absolute against the host, which is itself fixed, so the panel's own corner
   * is the anchor — and the placement writes in that same frame rather than
   * converting to the screen and back. Docked to the left of the panel: it lives
   * in the right-hand corner, so a detail trailing the cursor lands on the rows
   * it is describing.
   */
  position: absolute;
  right: calc(100% + ${t.spaceSmall});
  width: ${t.tipWidth};
  /*
   * ⚠️ **The width is arithmetic, so the box has to be the one that was
   * measured.** \`all: initial\` leaves this at \`content-box\`, under which the
   * padding and the border sit *outside* the token: the detail was drawn 268px
   * wide while its placement worked in 250, and a window whose width nobody can
   * state is one that gets put down a border's worth off the screen. Measured in
   * Firefox, on the four corners of a 1280x900 window.
   */
  box-sizing: border-box;
  padding: ${t.spaceSmall} ${t.space};
  font: 11px/1.4 system-ui, sans-serif;
  color: ${t.text};
  background: ${t.surface};
  border: 1px solid ${t.border};
  border-radius: ${t.radius};
  box-shadow: ${t.windowShadow};
  pointer-events: none;
  /*
   * ⚠️ **The one limit that cannot be placed around, so it is placed against.**
   * A detail longer than the screen has no position that shows all of it, and
   * src/ui/panel-element.ts keeps the top edge in preference to the
   * bottom — so this bounds the height to the window itself, which is the one
   * ceiling that leaves the arithmetic a position it can satisfy. In CSS because
   * 100vh re-evaluates itself, including on a resize nothing here listens for:
   * the same reasoning as the panel's own ceiling above.
   */
  max-height: calc(100vh - ${t.space} - ${t.space});
  overflow: hidden;
  z-index: ${t.layer};
}
.tip-title { font-weight: 600; margin-bottom: 2px; }
.tip-heading {
  margin-top: ${t.spaceSmall};
  padding-top: ${t.spaceSmall};
  border-top: 1px solid ${t.border};
  color: ${t.textQuiet};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 10px;
}
.tip-stat { display: flex; justify-content: space-between; gap: ${t.space}; }
.tip-stat.strong { font-weight: 600; }
.tip-stat-value { font-variant-numeric: tabular-nums; }
.tip-note { color: ${t.textQuiet}; margin-top: 2px; }
.undrawn { color: ${t.textQuiet}; font-style: italic; }
`.trim();
}
