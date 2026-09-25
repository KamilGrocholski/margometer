/**
 * The fight going on, read one engine call at a time in the game's stack (`docs/design.md` §10.2):
 * the envelope, the snapshots either side, the capture for the file, the session, and the shelf
 * when the fight closes. No drawing happens here; the frame does it, once, after `markStale`.
 *
 * ⚠️ **Each step is guarded on its own.** Under one guard, a snapshot that will not read would skip
 * the reading behind it, and the panel would stand on the last payload with nothing saying so.
 */

import { type Result, runGuarded } from "#/libs/result.ts";
import {
    commitPayload,
    type FightSession,
    initFightSession,
    type PayloadCommitted,
    type PayloadRecord,
    preparePayload,
    type SessionOptions,
} from "#/src/core/fight-session.ts";
import type { DecoderTables } from "#/src/core/fight-decoder.ts";
import type { EngineBattle, EnginePort, PayloadListener } from "#/src/game/engine-battle.ts";
import type { PlacePort } from "#/src/game/engine-place.ts";
import { type CaptureStanding, NO_CAPTURE, prepareCapture } from "#/src/game/fight-capture.ts";
import type { FightPlace } from "#/src/game/fight-place.ts";
import type { BuildPort } from "#/src/game/game-build.ts";
import type { Clock } from "#/src/game/page-clock.ts";
import { PAGE_READ_FAILURE, type PageReadFailure } from "#/src/game/page-reading.ts";
import { readPayloadEnvelope } from "#/src/game/payload-envelope.ts";
import { WARRIOR_FAILURE, type WarriorSnapshot } from "#/src/game/warrior-snapshot.ts";
import { DEFECT_KIND, type DefectKind, type DefectLedger } from "./defect-ledger.ts";
import type { KeptFight } from "./shelf.ts";

export interface LiveFightOptions {
    engine: EnginePort;
    clock: Clock;
    place: PlacePort;
    build: BuildPort;
    tables: DecoderTables;
    sessionOptions: SessionOptions;
    defects: DefectLedger;
    /** Once, on the call that ends a fight: a fight put on the shelf twice is two fights. */
    keepFight: (fight: KeptFight) => void;
    /** On the payload that opens a fight, once its moment and its place are read. */
    onFightOpened: () => void;
    /** Asks for one frame; later marks before it arrives do nothing. */
    markStale: () => void;
}

export interface LiveFight {
    session: FightSession;
    capture: CaptureStanding;
    snapshotBefore: WarriorSnapshot | null;
    /** Read once, on the payload that opens a fight: the hero does not move while one is on. */
    place: FightPlace | null;
    openedAt: number;
    /** Read once: the game builds its battle while its engine starts, and never again. */
    battle: EngineBattle | null;
}

export function initLiveFight(options: LiveFightOptions): {
    live: LiveFight;
    listener: PayloadListener;
} {
    const live: LiveFight = {
        session: initFightSession(options.sessionOptions),
        capture: NO_CAPTURE,
        snapshotBefore: null,
        place: null,
        openedAt: 0,
        battle: null,
    };
    const listener: PayloadListener = {
        onBeforeCall() {
            live.snapshotBefore = guard(
                options,
                DEFECT_KIND.file,
                null,
                () => readSnapshot(live, options),
            );
        },
        onPayload(payload) {
            readPayload(live, options, payload);
        },
    };
    return { live, listener };
}

/** A step of ours that broke an invariant costs that step and leaves a defect; the rest goes on. */
function guard<Value>(
    options: LiveFightOptions,
    kind: DefectKind,
    fallback: Value,
    step: () => Value,
): Value {
    const ran = runGuarded(step);
    if (ran.ok) return ran.value;
    options.defects.add({ kind, region: null, failure: ran.error });
    return fallback;
}

/**
 * The warriors the battle holds. A battle holding none is a reading of an empty fight, `[]`, as
 * `develop` records it; a snapshot that could not be read is `null`, and a defect.
 */
function readSnapshot(live: LiveFight, options: LiveFightOptions): WarriorSnapshot | null {
    if (live.battle === null) {
        const battle = options.engine.readBattle();
        if (!battle.ok) {
            options.defects.add({ kind: DEFECT_KIND.file, region: null, failure: battle.error });
            return null;
        }
        live.battle = battle.value;
    }
    const read = live.battle.readWarriors();
    if (read.ok) return read.value;
    if (read.error.kind === WARRIOR_FAILURE.warriorsAbsent) return [];
    options.defects.add({ kind: DEFECT_KIND.file, region: null, failure: read.error });
    return null;
}

function readPayload(live: LiveFight, options: LiveFightOptions, payload: unknown): void {
    const record = guard(options, DEFECT_KIND.reading, null, () => {
        const read = readPayloadEnvelope(payload);
        if (read.ok) return read.value;
        options.defects.add({ kind: DEFECT_KIND.reading, region: null, failure: read.error });
        return null;
    });
    const after = guard(options, DEFECT_KIND.file, null, () => readSnapshot(live, options));
    guard(options, DEFECT_KIND.file, undefined, () => {
        const messages = record === null ? [] : record.messages;
        const call = {
            payload,
            messages,
            combatantsBefore: live.snapshotBefore,
            combatantsAfter: after,
        };
        live.capture = prepareCapture(live.capture, call, record?.isInit ?? false);
    });
    const committed = record === null
        ? null
        : guard(options, DEFECT_KIND.reading, null, () => commitRecord(live, options, record));
    if (committed?.hasOpened === true) {
        guard(options, DEFECT_KIND.reading, undefined, () => openFight(live, options));
    }
    if (committed?.hasClosed === true) {
        guard(options, DEFECT_KIND.keeping, undefined, () => keepClosedFight(live, options));
    }
    guard(options, DEFECT_KIND.reading, undefined, () => options.markStale());
}

function commitRecord(
    live: LiveFight,
    options: LiveFightOptions,
    record: PayloadRecord,
): PayloadCommitted | null {
    const prepared = preparePayload(live.session, record, options.tables);
    if (!prepared.ok) {
        options.defects.add({ kind: DEFECT_KIND.reading, region: null, failure: prepared.error });
        return null;
    }
    return commitPayload(live.session, prepared.value);
}

function openFight(live: LiveFight, options: LiveFightOptions): void {
    live.openedAt = options.clock.readNowMilliseconds();
    live.place = readPageValue(options, options.place.readPlace());
    options.onFightOpened();
}

/** Absent is shown as unknown and is no defect; a page that threw while asked is one. */
function readPageValue<Value>(
    options: LiveFightOptions,
    read: Result<Value, PageReadFailure>,
): Value | null {
    if (read.ok) return read.value;
    if (read.error.kind !== PAGE_READ_FAILURE.absent) {
        options.defects.add({ kind: DEFECT_KIND.reading, region: null, failure: read.error });
    }
    return null;
}

/** Once, on the call that ends it: a fight put on the shelf twice is two fights. */
function keepClosedFight(live: LiveFight, options: LiveFightOptions): void {
    const payloads = live.capture.calls.map((call) => call.payload);
    const fight = {
        openedAt: live.openedAt,
        payloads,
        place: live.place,
        gameBuild: readPageValue(options, options.build.readBuildId()),
        isPinned: false,
    };
    options.keepFight(fight);
}
