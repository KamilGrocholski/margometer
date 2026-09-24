/**
 * Every failure meets a fate, and the compiler holds the table complete (`AGENTS.md` E7,
 * `docs/design.md` §10.5): a `kind` added to `RuntimeFailure` without an entry fails `deno check`.
 * The failures the panel draws, and the intents' own refusals, join the union with the panel.
 */

import type { BrokenInvariant, ForeignFailure } from "@/libs/result.ts";
import type { VocabularyWord } from "@/libs/vocabulary.ts";
import type { PayloadRejected } from "@/src/core/fight-session.ts";
import type { UnreadMessage } from "@/src/core/fight-decoder.ts";
import type { StoreFailure } from "@/src/game/browser-store.ts";
import type { EngineFailure } from "@/src/game/engine-battle.ts";
import type { PageReadFailure } from "@/src/game/page-reading.ts";
import type { EnvelopeFailure } from "@/src/game/payload-envelope.ts";
import type { WarriorFailure } from "@/src/game/warrior-snapshot.ts";
import type { FileEncodingFailure } from "@/src/runtime/fight-file.ts";
import type { SettingFailure } from "@/src/runtime/settings.ts";
import type { ShelfFailure } from "@/src/runtime/shelf.ts";

export type RuntimeFailure =
    | EngineFailure
    | EnvelopeFailure
    | PayloadRejected
    | UnreadMessage
    | StoreFailure
    | ShelfFailure
    | SettingFailure
    | FileEncodingFailure
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
    "engine-absent": FAILURE_FATE.defect,
    "battle-absent": FAILURE_FATE.defect,
    "method-absent": FAILURE_FATE.defect,
    "another-reader": FAILURE_FATE.standDown,
    "search-abandoned": FAILURE_FATE.defect,
    "detach-foreign-layer": FAILURE_FATE.defect,
    "payload-not-record": FAILURE_FATE.defect,
    "payload-field-malformed": FAILURE_FATE.defect,
    "payload-field-too-long": FAILURE_FATE.defect,
    "payload-combatant-repeated": FAILURE_FATE.defect,
    "cast-exceeded": FAILURE_FATE.defect,
    "events-exceeded": FAILURE_FATE.defect,
    "payloads-exceeded": FAILURE_FATE.defect,
    "unread": FAILURE_FATE.shownAsSuspect,
    "store-unavailable": FAILURE_FATE.fallbackWithDefect,
    "store-refused": FAILURE_FATE.fallbackWithDefect,
    "store-value-too-long": FAILURE_FATE.fallbackWithDefect,
    "shelf-unreadable": FAILURE_FATE.shelfAnswer,
    "shelf-unwritable": FAILURE_FATE.shelfAnswer,
    "shelf-version-unknown": FAILURE_FATE.shelfAnswer,
    "every-slot-pinned": FAILURE_FATE.shelfAnswer,
    "store-refused-after-rotation": FAILURE_FATE.shelfAnswer,
    "fight-already-kept": FAILURE_FATE.shelfAnswer,
    "fight-not-kept": FAILURE_FATE.shelfAnswer,
    "setting-unreadable": FAILURE_FATE.fallbackWithDefect,
    "setting-too-long": FAILURE_FATE.fallbackWithDefect,
    "export-unserializable": FAILURE_FATE.defect,
    "warriors-absent": FAILURE_FATE.shownAsUnknown,
    "warriors-exceeded": FAILURE_FATE.defect,
    "page-reading-absent": FAILURE_FATE.shownAsUnknown,
    "foreign-threw": FAILURE_FATE.defect,
    "invariant-broken": FAILURE_FATE.defect,
};
