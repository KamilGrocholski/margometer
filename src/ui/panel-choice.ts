/** What a reader chooses about the panel and the runtime keeps; the panel imports nothing above. */

import type { VocabularyWord } from "@/libs/vocabulary.ts";

/** Where the shelf is kept: the browser's two stores, or this page's memory alone. */
export const STORAGE_CHOICE = { local: "local", session: "session", memory: "memory" } as const;
export type StorageChoice = VocabularyWord<typeof STORAGE_CHOICE>;
export const STORAGE_CHOICES = Object.values(STORAGE_CHOICE);

export interface PanelPosition {
    left: number;
    top: number;
}

/** The panel, and the window beside it that `develop` calls the standing window. */
export const PANEL_WINDOW = { panel: "panel", helper: "helper" } as const;
export type PanelWindow = VocabularyWord<typeof PANEL_WINDOW>;
