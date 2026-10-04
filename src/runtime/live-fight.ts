/**
 * The fight going on, read one engine call at a time in the game's stack (`docs/design.md` §10.2):
 * the envelope, the snapshots either side, the capture for the file, the session, and the shelf
 * when the fight closes. No drawing happens here; the frame does it, once, after `markStale`.
 *
 * ⚠️ **Each step is guarded on its own.** Under one guard, a snapshot that will not read would skip
 * the reading behind it, and the panel would stand on the last payload with nothing saying so.
 */

import * as errors from "#/libs/errors.ts";
import {
    commitPayload,
    createFightSession,
    type FightSession,
    type PayloadCommitted,
    type PayloadRecord,
    preparePayload,
    type SessionOptions,
} from "#/src/core/fight-session.ts";
import type { DecoderTables } from "#/src/core/fight-decoder.ts";
import type {
    MargonemEngineBattle,
    MargonemEngineBattlePort,
    PayloadListener,
} from "#/src/ports/margonem-engine-battle.ts";
import type { MargonemEngineHeroPort } from "#/src/ports/margonem-engine-hero.ts";
import type { MargonemEnginePlacePort } from "#/src/ports/margonem-engine-place.ts";
import {
    commitCapture,
    createFightCapture,
    type FightCapture,
    prepareCapture,
} from "#/src/ports/fight-capture.ts";
import type { FightPlace } from "#/src/ports/fight-place.ts";
import type { MargonemClientBuildPort } from "#/src/ports/margonem-client-build.ts";
import type { BrowserClock } from "#/src/ports/browser-time.ts";
import { type MargonemReadFailure, MargonemValueAbsent } from "#/src/ports/margonem-value.ts";
import { isPayloadOpening, readPayloadEnvelope } from "#/src/ports/payload-envelope.ts";
import {
    MargonemEngineWarriorsAbsent,
    type MargonemEngineWarriorSnapshot,
} from "#/src/ports/margonem-engine-warriors.ts";
import { DEFECT_KIND, type DefectKind, type DefectLedger } from "./defect-ledger.ts";
import type { ShelfKeeper } from "./shelf-keeper.ts";

export interface LiveFightOptions {
    battle: MargonemEngineBattlePort;
    clock: BrowserClock;
    place: MargonemEnginePlacePort;
    hero: MargonemEngineHeroPort;
    build: MargonemClientBuildPort;
    tables: DecoderTables;
    sessionOptions: SessionOptions;
    defects: DefectLedger;
    /** Kept into once, on the call that ends a fight: a fight put on it twice is two fights. */
    keeper: ShelfKeeper;
    /** On the payload that opens a fight, once its moment and its place are read. */
    onFightOpened: () => void;
    /** Asks for one frame; later marks before it arrives do nothing. */
    markStale: () => void;
}

export interface LiveFight {
    session: FightSession;
    capture: FightCapture;
    snapshotBefore: MargonemEngineWarriorSnapshot | null;
    /** Read once, on the payload that opens a fight: the hero does not move while one is on. */
    place: FightPlace | null;
    /** Read with the place: which combatant the reader is, as the client keys its own warrior. */
    readerId: number | null;
    openedAt: number;
    /** Read once: the game builds its battle while its engine starts, and never again. */
    margonemEngineBattle: MargonemEngineBattle | null;
}

export function initLiveFight(options: LiveFightOptions): {
    live: LiveFight;
    listener: PayloadListener;
} {
    const liveFight: LiveFight = {
        session: createFightSession(options.sessionOptions),
        capture: createFightCapture(),
        snapshotBefore: null,
        place: null,
        readerId: null,
        openedAt: 0,
        margonemEngineBattle: null,
    };
    const listener: PayloadListener = {
        onBeforeCall() {
            liveFight.snapshotBefore = executeLiveStep(
                options,
                DEFECT_KIND.file,
                null,
                () => readLiveMargonemEngineWarriors(liveFight, options),
            );
        },
        onPayload(payload) {
            // Read the payload, each step under its own guard. Whether it opens a fight is read
            // apart where the envelope refuses it, since a refused opening still ends the last.
            const { record, isOpening } = executeLiveStep(
                options,
                DEFECT_KIND.reading,
                { record: null, isOpening: false },
                (): { record: PayloadRecord | null; isOpening: boolean } => {
                    const payloadRecord = readPayloadEnvelope(payload);
                    if (!(payloadRecord instanceof Error)) {
                        return { record: payloadRecord, isOpening: payloadRecord.isInit };
                    }
                    options.defects.add({
                        kind: DEFECT_KIND.reading,
                        region: null,
                        failure: payloadRecord,
                    });
                    return { record: null, isOpening: isPayloadOpening(payload) };
                },
            );
            const snapshotAfter = executeLiveStep(
                options,
                DEFECT_KIND.file,
                null,
                () => readLiveMargonemEngineWarriors(liveFight, options),
            );
            executeLiveStep(options, DEFECT_KIND.file, undefined, () => {
                const messages = record === null ? [] : record.messages;
                const call = {
                    payload,
                    messages,
                    combatantsBefore: liveFight.snapshotBefore,
                    combatantsAfter: snapshotAfter,
                };
                const prepared = prepareCapture(liveFight.capture, call, isOpening);
                commitCapture(liveFight.capture, prepared);
            });
            // Commit the record, or leave a defect where it will not prepare.
            const committed = record === null ? null : executeLiveStep(
                options,
                DEFECT_KIND.reading,
                null,
                (): PayloadCommitted | null => {
                    const prepared = preparePayload(liveFight.session, record, options.tables);
                    if (prepared instanceof Error) {
                        options.defects.add({
                            kind: DEFECT_KIND.reading,
                            region: null,
                            failure: prepared,
                        });
                        return null;
                    }
                    return commitPayload(liveFight.session, prepared);
                },
            );
            // A refused opening still ends the fight before it: the session starts empty, and the
            // next call opens the new fight as one joined in progress, never the old one going on.
            if (committed === null) {
                if (isOpening) liveFight.session = createFightSession(options.sessionOptions);
            }
            if (committed?.hasOpened === true) {
                // Open the fight: its moment, its place and who the reader is.
                executeLiveStep(options, DEFECT_KIND.reading, undefined, () => {
                    liveFight.openedAt = options.clock.readNowMilliseconds();
                    liveFight.place = readMargonemValue(options, options.place.readPlace());
                    liveFight.readerId = readMargonemValue(options, options.hero.readHeroId());
                    options.onFightOpened();
                });
            }
            if (committed?.hasClosed === true) {
                // Keep the closed fight on the shelf.
                executeLiveStep(options, DEFECT_KIND.keeping, undefined, () => {
                    const payloads = liveFight.capture.calls.map((call) => call.payload);
                    const fight = {
                        openedAt: liveFight.openedAt,
                        payloads,
                        place: liveFight.place,
                        readerId: liveFight.readerId,
                        margonemClientBuild: readMargonemValue(
                            options,
                            options.build.readBuildId(),
                        ),
                        isPinned: false,
                    };
                    options.keeper.keep(fight);
                });
            }
            executeLiveStep(options, DEFECT_KIND.reading, undefined, () => options.markStale());
        },
    };
    return { live: liveFight, listener };
}

/** A step of ours that broke an invariant costs that step and leaves a defect; the rest goes on. */
function executeLiveStep<Value>(
    options: LiveFightOptions,
    kind: DefectKind,
    fallback: Value,
    step: () => Value,
): Value {
    const ran = errors.attempt(step);
    if (!(ran instanceof errors.Caught)) return ran;
    options.defects.add({ kind, region: null, failure: ran });
    return fallback;
}

/**
 * The warriors the battle holds. A battle holding none is a reading of an empty fight, `[]`, as
 * `develop` records it; a snapshot that could not be read is `null`, and a defect.
 */
function readLiveMargonemEngineWarriors(
    liveFight: LiveFight,
    options: LiveFightOptions,
): MargonemEngineWarriorSnapshot | null {
    if (liveFight.margonemEngineBattle === null) {
        const battle = options.battle.readBattle();
        if (battle instanceof Error) {
            options.defects.add({ kind: DEFECT_KIND.file, region: null, failure: battle });
            return null;
        }
        liveFight.margonemEngineBattle = battle;
    }
    const warriorSnapshot = liveFight.margonemEngineBattle.readWarriors();
    if (!(warriorSnapshot instanceof Error)) return warriorSnapshot;
    if (warriorSnapshot instanceof MargonemEngineWarriorsAbsent) return [];
    options.defects.add({ kind: DEFECT_KIND.file, region: null, failure: warriorSnapshot });
    return null;
}

/** Absent is shown as unknown and is no defect; a page that threw while asked is one. */
function readMargonemValue<Value>(
    options: LiveFightOptions,
    margonemValue: Value | MargonemReadFailure,
): Value | null {
    if (margonemValue instanceof MargonemValueAbsent) return null;
    if (margonemValue instanceof errors.Caught) {
        options.defects.add({ kind: DEFECT_KIND.reading, region: null, failure: margonemValue });
        return null;
    }
    return margonemValue;
}
