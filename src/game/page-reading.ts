/**
 * A reading of the game's own page state that came back empty (`docs/design.md` §5, §10.5): its
 * fate is to be shown as unknown, never guessed at.
 */

import type * as errors from "#/libs/errors.ts";
import type { VocabularyWord } from "#/libs/vocabulary.ts";

export const CLIENT_READING = {
    place: "place",
    hero: "hero",
    label: "label",
    build: "build",
} as const;
export type ClientReading = VocabularyWord<typeof CLIENT_READING>;

export class ClientReadingAbsent extends Error {
    override readonly name = "ClientReadingAbsent";
    readonly reading: ClientReading;

    constructor(reading: ClientReading) {
        super();
        this.reading = reading;
    }
}

export type ClientReadFailure = ClientReadingAbsent | errors.Caught;
