/**
 * What a reader chooses about the panel and the runtime keeps for them: where the shelf is kept,
 * and where a window stands. Here because the panel offers both and the runtime stores both, and
 * the panel imports nothing above it (`docs/design.md` §4).
 */

import type { VocabularyWord } from "@/libs/vocabulary.ts";

/** Where the shelf is kept: the browser's two stores, or this page's memory alone. */
export const STORAGE_CHOICE = { local: "local", session: "session", memory: "memory" } as const;
export type StorageChoice = VocabularyWord<typeof STORAGE_CHOICE>;
export const STORAGE_CHOICES = Object.values(STORAGE_CHOICE);

export interface PanelPosition {
    left: number;
    top: number;
}
