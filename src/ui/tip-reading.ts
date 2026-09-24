/**
 * What a card says, as a shape rather than a sentence: the panel draws a figure, a sub-line, a
 * heading and a note differently, and a renderer handed one string and a newline would hold that
 * decision where nothing can check it. The drawing is `panel-tip`'s.
 */

import type { VocabularyWord } from "@/libs/vocabulary.ts";
import type { Caveat } from "@/src/ui/panel-words.ts";

export const TIP_LINE = { stat: "stat", sub: "sub", heading: "heading", note: "note" } as const;

/**
 * What a sentence at the foot of a card is about, which is the only thing that decides its ink.
 * One field and not a flag each: a sentence is a suspicion or a caveat and never both.
 *
 * ⚠️ **The glyph stays inside the sentence's own `text`.** It is counted in what the note costs the
 * card's height, and hoisting it into a node of its own would shorten every note in that arithmetic
 * while the drawn sentence stayed the same length.
 */
export const TIP_NOTE_TONE = { plain: "plain", suspect: "suspect", caveat: "caveat" } as const;
export type TipNoteTone = VocabularyWord<typeof TIP_NOTE_TONE>;

export type TipLine =
    | {
        kind: typeof TIP_LINE.stat;
        label: string;
        stated: string;
        isStrong: boolean;
        /**
         * Which sentence at the foot of the card the glyph beside this figure points at, and null
         * where the figure claims nothing beyond itself. **Required rather than optional**, so a
         * figure joining the card is asked whether its label names more than it counts.
         */
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
