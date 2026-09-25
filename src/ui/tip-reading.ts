/**
 * What a card says, as a shape rather than a sentence: the panel draws a figure, a sub-line, a
 * heading and a note differently, and a renderer handed one string and a newline would hold that
 * decision where nothing can check it. The drawing is `panel-tip`'s.
 */

import type { VocabularyWord } from "#/libs/vocabulary.ts";
import type { Caveat } from "./panel-words.ts";

export const TIP_LINE = { stat: "stat", sub: "sub", heading: "heading", note: "note" } as const;

/**
 * What a sentence at the foot of a card is about, which alone decides its ink. ⚠️ The glyph stays
 * inside the sentence's `text`: it counts in the card's height, and a node of its own would
 * shorten every note in that arithmetic while the drawn sentence stayed as long.
 */
export const TIP_NOTE_TONE = { plain: "plain", suspect: "suspect", caveat: "caveat" } as const;
export type TipNoteTone = VocabularyWord<typeof TIP_NOTE_TONE>;

export type TipLine =
    | {
        kind: typeof TIP_LINE.stat;
        label: string;
        stated: string;
        isStrong: boolean;
        /** Required, so a figure joining the card is asked whether it names more than it counts. */
        caveat: Caveat | null;
    }
    | { kind: typeof TIP_LINE.sub; label: string; stated: string }
    | { kind: typeof TIP_LINE.heading; text: string }
    | { kind: typeof TIP_LINE.note; text: string; tone: TipNoteTone };

export interface TipGroup {
    lines: TipLine[];
}

export interface TipReading {
    name: string;
    subtitle: string | null;
    groups: TipGroup[];
}
