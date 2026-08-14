import {
  composeHexadecimalByteText,
  composeIntegerText,
  getIntegerFromHexadecimalText,
} from "@/libs/number.ts";

/**
 * Every colour, space and radius the panel uses, named once.
 *
 * §9.7: a raw hex in a rule is a bug, and text on a coloured bar has to clear
 * WCAG contrast by measurement rather than by eye. Both are only possible if the
 * values live somewhere a test can reach — which is here, and is why this file
 * exists before anything is drawn.
 *
 * Dark-first, because the panel sits over a dark game and is never asked to be
 * anything else.
 */

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
 * The two lengths placement needs as numbers rather than as CSS.
 *
 * ⚠️ **The numbers are the source and the tokens are composed from them**, not
 * the other way round. A panel anchored to the top-right corner by the
 * stylesheet has no `left` anyone can read back, so the first drag has to work
 * out where it already was — and it can only do that from the same margin and
 * width the stylesheet used. Two copies of `310` would drift, and the drift
 * would show as the panel jumping under the hand on the first grab.
 */
export const PANEL_PIXELS = { space: 8, width: 260, tipWidth: 250 } as const;

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
  spaceSmall: "4px",
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
 */
export function getProfessionInk(colour: string): string {
  const dark = getContrastRatio(PANEL_TOKENS.badgeInkDark, colour) ?? 0;
  const light = getContrastRatio(PANEL_TOKENS.badgeInkLight, colour) ?? 0;
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
