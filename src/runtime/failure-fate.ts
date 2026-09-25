/**
 * Every failure meets a fate, and the compiler holds the table complete (`AGENTS.md` E7,
 * `docs/design.md` §10.5): a `kind` added to `RuntimeFailure` without an entry fails `deno check`.
 * Which defect a failure leaves is the step's that met it; whether it leaves one is this table's.
 */

import { type BrokenInvariant, type ForeignFailure, RESULT_FAILURE } from "@/libs/result.ts";
import type { VocabularyWord } from "@/libs/vocabulary.ts";
import { DECODE_FAILURE, type UnreadMessage } from "@/src/core/fight-decoder.ts";
import { type PayloadRejected, SESSION_FAILURE } from "@/src/core/fight-session.ts";
import { STORE_FAILURE, type StoreFailure } from "@/src/game/browser-store.ts";
import { ENGINE_FAILURE, type EngineFailure } from "@/src/game/engine-battle.ts";
import { PAGE_READ_FAILURE, type PageReadFailure } from "@/src/game/page-reading.ts";
import { ENVELOPE_FAILURE, type EnvelopeFailure } from "@/src/game/payload-envelope.ts";
import { WARRIOR_FAILURE, type WarriorFailure } from "@/src/game/warrior-snapshot.ts";
import { FILE_SINK_FAILURE } from "@/src/game/page-file.ts";
import { type ExportFailure, HANDOVER_FAILURE } from "@/src/runtime/fight-handover.ts";
import { FRAME_FAILURE, type FrameFailure } from "@/src/runtime/panel-frame.ts";
import { VIEW_FAILURE, type ViewFailure } from "@/src/ui/view-failure.ts";
import { FILE_FAILURE, type FileEncodingFailure } from "@/src/runtime/fight-file.ts";
import { SETTING_FAILURE, type SettingFailure } from "@/src/runtime/settings.ts";
import { SHELF_FAILURE, type ShelfFailure } from "@/src/runtime/shelf.ts";

export type RuntimeFailure =
    | EngineFailure
    | EnvelopeFailure
    | PayloadRejected
    | UnreadMessage
    | StoreFailure
    | ShelfFailure
    | SettingFailure
    | FileEncodingFailure
    | ExportFailure
    | FrameFailure
    | ViewFailure
    | WarriorFailure
    | PageReadFailure
    | ForeignFailure
    | BrokenInvariant;

export const FAILURE_FATE = {
    shownAsUnknown: "shown-as-unknown",
    shownAsSuspect: "shown-as-suspect",
    defect: "defect",
    shelfAnswer: "shelf-answer",
    fallbackWithDefect: "fallback-with-defect",
    standDown: "stand-down",
} as const;
export type FailureFate = VocabularyWord<typeof FAILURE_FATE>;

export const FAILURE_FATES: { readonly [Kind in RuntimeFailure["kind"]]: FailureFate } = {
    [ENGINE_FAILURE.engineAbsent]: FAILURE_FATE.defect,
    [ENGINE_FAILURE.battleAbsent]: FAILURE_FATE.defect,
    [ENGINE_FAILURE.methodAbsent]: FAILURE_FATE.defect,
    [ENGINE_FAILURE.anotherReader]: FAILURE_FATE.standDown,
    [ENGINE_FAILURE.searchAbandoned]: FAILURE_FATE.defect,
    [ENGINE_FAILURE.detachForeignLayer]: FAILURE_FATE.defect,
    [ENVELOPE_FAILURE.payloadNotRecord]: FAILURE_FATE.defect,
    [ENVELOPE_FAILURE.payloadFieldMalformed]: FAILURE_FATE.defect,
    [ENVELOPE_FAILURE.payloadFieldTooLong]: FAILURE_FATE.defect,
    [ENVELOPE_FAILURE.payloadCombatantRepeated]: FAILURE_FATE.defect,
    [SESSION_FAILURE.castExceeded]: FAILURE_FATE.defect,
    [SESSION_FAILURE.eventsExceeded]: FAILURE_FATE.defect,
    [SESSION_FAILURE.payloadsExceeded]: FAILURE_FATE.defect,
    [DECODE_FAILURE.unread]: FAILURE_FATE.shownAsSuspect,
    [STORE_FAILURE.unavailable]: FAILURE_FATE.fallbackWithDefect,
    [STORE_FAILURE.refused]: FAILURE_FATE.fallbackWithDefect,
    [STORE_FAILURE.valueTooLong]: FAILURE_FATE.fallbackWithDefect,
    [SHELF_FAILURE.unreadable]: FAILURE_FATE.fallbackWithDefect,
    [SHELF_FAILURE.unwritable]: FAILURE_FATE.shelfAnswer,
    [SHELF_FAILURE.versionUnknown]: FAILURE_FATE.fallbackWithDefect,
    [SHELF_FAILURE.everySlotPinned]: FAILURE_FATE.shelfAnswer,
    [SHELF_FAILURE.refusedAfterRotation]: FAILURE_FATE.shelfAnswer,
    [SHELF_FAILURE.fightAlreadyKept]: FAILURE_FATE.defect,
    [SHELF_FAILURE.fightNotKept]: FAILURE_FATE.shelfAnswer,
    [SETTING_FAILURE.unreadable]: FAILURE_FATE.fallbackWithDefect,
    [SETTING_FAILURE.tooLong]: FAILURE_FATE.fallbackWithDefect,
    [FILE_FAILURE.unserializable]: FAILURE_FATE.defect,
    [FILE_SINK_FAILURE.apiAbsent]: FAILURE_FATE.defect,
    [HANDOVER_FAILURE.noFightOnScreen]: FAILURE_FATE.defect,
    [FRAME_FAILURE.figuresDisagreed]: FAILURE_FATE.defect,
    [VIEW_FAILURE.regionUndrawn]: FAILURE_FATE.defect,
    [VIEW_FAILURE.gestureDropped]: FAILURE_FATE.defect,
    [VIEW_FAILURE.windowUnplaced]: FAILURE_FATE.fallbackWithDefect,
    [WARRIOR_FAILURE.warriorsAbsent]: FAILURE_FATE.shownAsUnknown,
    [WARRIOR_FAILURE.warriorsExceeded]: FAILURE_FATE.defect,
    [PAGE_READ_FAILURE.absent]: FAILURE_FATE.shownAsUnknown,
    [RESULT_FAILURE.foreignThrew]: FAILURE_FATE.defect,
    [RESULT_FAILURE.invariantBroken]: FAILURE_FATE.defect,
};
