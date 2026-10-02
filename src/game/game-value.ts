/**
 * A value asked of the game — its place, its hero, a label, its build — that came back empty
 * (`docs/design.md` §5, §10.5): its fate is to be shown as unknown, never guessed at.
 */

import type * as errors from "#/libs/errors.ts";
import type { VocabularyWord } from "#/libs/vocabulary.ts";

export const GAME_VALUE = {
    place: "place",
    hero: "hero",
    label: "label",
    build: "build",
} as const;
export type GameValue = VocabularyWord<typeof GAME_VALUE>;

export class GameValueAbsent extends Error {
    override readonly name = "GameValueAbsent";
    readonly value: GameValue;

    constructor(value: GameValue) {
        super();
        this.value = value;
    }
}

export type GameReadFailure = GameValueAbsent | errors.Caught;
