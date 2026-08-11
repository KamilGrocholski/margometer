import { composeIntegerText, getIntegerFromHexadecimalText } from "@/libs/number.ts";

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

const [BLUE, GREEN, MAGENTA, YELLOW, AQUA, ORANGE, VIOLET, RED] = SERIES_COLOURS;

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

/** Unassigned so far; kept named so the palette's shape stays visible. */
export const RESERVED_COLOURS = [VIOLET, RED] as const;

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
export const PANEL_PIXELS = { space: 8, width: 310 } as const;

export const PANEL_TOKENS = {
  surface: "#17171c",
  surfaceRaised: "#1f1f26",
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
  radius: "6px",
  spaceSmall: "4px",
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
 * Relative luminance of a `#rrggbb` colour, or null if it is not one.
 *
 * Null rather than a throw: the caller is a test asking a question about a
 * value, and a malformed token is a fact to report rather than an exception to
 * handle.
 */
export function getRelativeLuminance(colour: string): number | null {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(colour);
  if (match === null) return null;

  const channels = [match[1], match[2], match[3]].map((channel) =>
    getIntegerFromHexadecimalText(channel ?? ""),
  );
  const [red, green, blue] = channels.map((channel) =>
    channel === null ? null : getLinearChannel(channel),
  );
  if (red === null || green === null || blue === null) return null;
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
  const parts = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
  const above = parts.exec(top);
  const below = parts.exec(bottom);
  if (above === null || below === null) return null;

  const mixed: string[] = [];
  for (let channel = 1; channel <= 3; channel += 1) {
    const one = getIntegerFromHexadecimalText(above[channel] ?? "");
    const other = getIntegerFromHexadecimalText(below[channel] ?? "");
    if (one === null || other === null) return null;
    mixed.push(Math.round(alpha * one + (1 - alpha) * other).toString(16).padStart(2, "0"));
  }
  return `#${mixed.join("")}`;
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
