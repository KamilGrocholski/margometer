/**
 * A value asked of the game — its place, its hero, a label, its build — that came back empty
 * (`docs/design.md` §5, §10.5): its fate is to be shown as unknown, never guessed at.
 */

import type * as errors from "#/libs/errors.ts";
import type { VocabularyWord } from "#/libs/vocabulary.ts";

export const MARGONEM_VALUE = {
    place: "place",
    hero: "hero",
    label: "label",
    build: "build",
} as const;
export type MargonemValue = VocabularyWord<typeof MARGONEM_VALUE>;

export class MargonemValueAbsent extends Error {
    override readonly name = "MargonemValueAbsent";
    readonly reading: MargonemValue;

    constructor(reading: MargonemValue) {
        super();
        this.reading = reading;
    }
}

export type MargonemReadFailure = MargonemValueAbsent | errors.Caught;
