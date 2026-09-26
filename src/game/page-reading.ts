/**
 * A reading of the game's own page state that came back empty (`docs/design.md` §5, §10.5): its
 * fate is to be shown as unknown, never guessed at.
 */

import type * as errors from "#/libs/errors.ts";
import type { VocabularyWord } from "#/libs/vocabulary.ts";

export const PAGE_READING = { place: "place", label: "label", build: "build" } as const;
export type PageReading = VocabularyWord<typeof PAGE_READING>;

export class PageReadingAbsent extends Error {
    override readonly name = "PageReadingAbsent";
    readonly reading: PageReading;

    constructor(reading: PageReading) {
        super();
        this.reading = reading;
    }
}

export type PageReadFailure = PageReadingAbsent | errors.Caught;
