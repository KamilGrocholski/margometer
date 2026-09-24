/**
 * A reading of the game's own page state that came back empty (`docs/design.md` §5, §10.5): its
 * fate is to be shown as unknown, never guessed at.
 */

import type { ForeignFailure } from "@/libs/result.ts";
import type { VocabularyWord } from "@/libs/vocabulary.ts";

export const PAGE_READING = { place: "place", label: "label", build: "build" } as const;
export type PageReading = VocabularyWord<typeof PAGE_READING>;

export const PAGE_READ_FAILURE = { absent: "page-reading-absent" } as const;

export type PageReadFailure =
    | { kind: typeof PAGE_READ_FAILURE.absent; reading: PageReading }
    | ForeignFailure;
