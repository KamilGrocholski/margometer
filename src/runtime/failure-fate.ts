/**
 * Every failure meets a fate, and the compiler holds the table complete (`AGENTS.md` E7,
 * `docs/design.md` §10.5): a class added to `RuntimeFailure` without an entry fails `deno check`.
 * The step that meets a failure carries its fate out, and nothing reads this table at run time:
 * `tests/simulation.ts` holds every kind the console hears to one of its names. A class met in
 * places that do different things with it is `byPlace`, and §10.5 gives a row to each place. One
 * that leaves no mark by design, wherever it is met, is `none`, and its row there says why.
 */

import type * as errors from "#/libs/errors.ts";
import type { VocabularyWord } from "#/libs/vocabulary.ts";
import type { UnreadMessage } from "#/src/core/fight-decoder.ts";
import type { PayloadRejected } from "#/src/core/fight-session.ts";
import type { StoreFailure } from "#/src/ports/browser-store.ts";
import type { MargonemEngineFailure } from "#/src/ports/margonem-engine-battle.ts";
import type { MargonemReadFailure } from "#/src/ports/margonem-value.ts";
import type { EnvelopeFailure } from "#/src/ports/payload-envelope.ts";
import type { MargonemEngineWarriorFailure } from "#/src/ports/margonem-engine-warriors.ts";
import type { ExportFailure } from "./fight-handover.ts";
import type { FiguresDisagreed, MargonemEngineTooltipRefused } from "./panel-frame.ts";
import type { ViewFailure } from "#/src/ui/view-failure.ts";
import type { FileUnserializable } from "./fight-file.ts";
import type { SettingFailure } from "./settings.ts";
import type { ShelfFailure } from "./shelf.ts";

export type RuntimeFailure =
    | MargonemEngineFailure
    | EnvelopeFailure
    | PayloadRejected
    | UnreadMessage
    | StoreFailure
    | ShelfFailure
    | SettingFailure
    | FileUnserializable
    | ExportFailure
    | FiguresDisagreed
    | MargonemEngineTooltipRefused
    | ViewFailure
    | MargonemEngineWarriorFailure
    | MargonemReadFailure
    | errors.Caught;

export const FAILURE_FATE = {
    shownAsUnknown: "shown-as-unknown",
    shownAsSuspect: "shown-as-suspect",
    defect: "defect",
    shelfAnswer: "shelf-answer",
    fallbackWithDefect: "fallback-with-defect",
    standDown: "stand-down",
    none: "none",
    byPlace: "by-place",
} as const;
export type FailureFate = VocabularyWord<typeof FAILURE_FATE>;

/** Keyed by each class's literal `name`, which is what holds the table complete (ADR 0008). */
export const FAILURE_FATES: { readonly [Name in RuntimeFailure["name"]]: FailureFate } = {
    MargonemEngineAbsent: FAILURE_FATE.byPlace,
    MargonemEngineBattleAbsent: FAILURE_FATE.byPlace,
    MargonemEngineMethodAbsent: FAILURE_FATE.defect,
    MargonemEngineMethodUnwritable: FAILURE_FATE.defect,
    MargonemEngineAlreadyWrapped: FAILURE_FATE.standDown,
    SearchAbandoned: FAILURE_FATE.defect,
    WrapCovered: FAILURE_FATE.none,
    PayloadNotRecord: FAILURE_FATE.defect,
    PayloadFieldMalformed: FAILURE_FATE.defect,
    PayloadFieldTooLong: FAILURE_FATE.defect,
    PayloadCombatantRepeated: FAILURE_FATE.defect,
    CombatantsExceeded: FAILURE_FATE.defect,
    CutKeysExceeded: FAILURE_FATE.defect,
    EventsExceeded: FAILURE_FATE.defect,
    PayloadsExceeded: FAILURE_FATE.defect,
    SkillsExceeded: FAILURE_FATE.defect,
    UnreadMessage: FAILURE_FATE.shownAsSuspect,
    StoreUnavailable: FAILURE_FATE.byPlace,
    StoreRefused: FAILURE_FATE.byPlace,
    StoreValueTooLong: FAILURE_FATE.byPlace,
    ShelfUnreadable: FAILURE_FATE.fallbackWithDefect,
    ShelfUnwritable: FAILURE_FATE.shelfAnswer,
    ShelfVersionUnknown: FAILURE_FATE.fallbackWithDefect,
    KeptFightsUnreadable: FAILURE_FATE.defect,
    EverySlotPinned: FAILURE_FATE.shelfAnswer,
    RotationRefused: FAILURE_FATE.shelfAnswer,
    FightAlreadyKept: FAILURE_FATE.defect,
    SettingUnreadable: FAILURE_FATE.fallbackWithDefect,
    SettingTooLong: FAILURE_FATE.fallbackWithDefect,
    FileUnserializable: FAILURE_FATE.defect,
    FileApiAbsent: FAILURE_FATE.defect,
    ShownFightAbsent: FAILURE_FATE.defect,
    FiguresDisagreed: FAILURE_FATE.defect,
    RegionUndrawn: FAILURE_FATE.defect,
    GestureDropped: FAILURE_FATE.defect,
    WindowUnplaced: FAILURE_FATE.fallbackWithDefect,
    MargonemEngineWarriorsAbsent: FAILURE_FATE.none,
    MargonemEngineWarriorsExceeded: FAILURE_FATE.defect,
    MargonemEngineTooltipRefused: FAILURE_FATE.defect,
    MargonemValueAbsent: FAILURE_FATE.shownAsUnknown,
    Caught: FAILURE_FATE.byPlace,
};
