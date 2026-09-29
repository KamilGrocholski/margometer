/** What a reader chooses about the panel and the runtime keeps; the panel imports nothing above. */

import type { VocabularyWord } from "#/libs/vocabulary.ts";

/** Where the shelf is kept: the browser's two stores, or this page's memory alone. */
export const STORAGE_CHOICE = { local: "local", session: "session", memory: "memory" } as const;
export type StorageChoice = VocabularyWord<typeof STORAGE_CHOICE>;

export interface PanelPosition {
    left: number;
    top: number;
}

/** The panel, and the window beside it that `develop` calls the standing window. */
export const PANEL_WINDOW = { panel: "panel", helper: "helper" } as const;
export type PanelWindow = VocabularyWord<typeof PANEL_WINDOW>;

/**
 * How big a reader made a window by its corner: as wide as the window, and as tall as its body
 * under the bar, which is what a fold takes away (ADR 0013).
 */
export interface WindowSize {
    width: number;
    height: number;
}

/** Null is a window nobody sized, which stands as wide as its type and as tall as its rows. */
export type WindowSizes = { readonly [Window in PanelWindow]: WindowSize | null };

/** The sizes the type is drawn at, both windows at once; each is measured, none scaled (ADR 0013). */
export const TYPE_STEP = { small: "small", medium: "medium", large: "large" } as const;
export type TypeStep = VocabularyWord<typeof TYPE_STEP>;

export const STORAGE_CHOICES = Object.values(STORAGE_CHOICE);
export const PANEL_WINDOWS = Object.values(PANEL_WINDOW);
export const NO_WINDOW_SIZES: WindowSizes = { panel: null, helper: null };
export const TYPE_STEPS = Object.values(TYPE_STEP);
/** What a reader who chose no size reads (ADR 0017). */
export const TYPE_STEP_DEFAULT: TypeStep = TYPE_STEP.medium;
