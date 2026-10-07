/**
 * The fight going on, read one engine call at a time in the game's stack (`docs/design.md` §10.2):
 * the envelope, the snapshots either side, the capture for the file, the session, and the shelf
 * when the fight closes. No drawing happens here; the frame does it, once, after `markStale`.
 *
 * ⚠️ **Each step is guarded on its own.** Under one guard, a snapshot that will not read would skip
 * the reading behind it, and the panel would stand on the last payload with nothing saying so.
 */

import { assert } from "@std/assert/assert";
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
import type { ReplayFailure } from "./fight-state.ts";
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
    /** On the payload that closes a fight, once the shelf has answered, whatever it answered. */
    onFightKept: () => void;
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
    /** Read as a fight opens; null where the clock would not say, with its refusal beside it. */
    openedAt: number | null;
    openedAtRefusal: errors.Caught | null;
    /**
     * The first payload of this fight the envelope or the session refused, or whose reading broke
     * an invariant, cleared as a fight opens: a fight with a gap is read on live, and never kept.
     */
    payloadRefusal: ReplayFailure | errors.Caught | null;
    /** Read once: the engine builds one battle (`initMargonemEngineSearch`). */
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
        openedAt: null,
        openedAtRefusal: null,
        payloadRefusal: null,
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
            const { record, isOpening } = executeLiveReading(
                liveFight,
                options,
                { record: null, isOpening: false },
                (): { record: PayloadRecord | null; isOpening: boolean } => {
                    const payloadRecord = readPayloadEnvelope(payload);
                    if (!(payloadRecord instanceof Error)) {
                        if (payloadRecord.isInit) liveFight.payloadRefusal = null;
                        return { record: payloadRecord, isOpening: payloadRecord.isInit };
                    }
                    options.defects.add({
                        kind: DEFECT_KIND.reading,
                        region: null,
                        failure: payloadRecord,
                    });
                    const isRefusedOpening = isPayloadOpening(payload);
                    // A refused opening is the first call the capture keeps of the next fight.
                    if (isRefusedOpening) liveFight.payloadRefusal = null;
                    liveFight.payloadRefusal ??= payloadRecord;
                    return { record: null, isOpening: isRefusedOpening };
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
            const committed = record === null ? null : executeLiveReading(
                liveFight,
                options,
                null,
                (): PayloadCommitted | null => {
                    const prepared = preparePayload(liveFight.session, record, options.tables);
                    if (prepared instanceof Error) {
                        options.defects.add({
                            kind: DEFECT_KIND.reading,
                            region: null,
                            failure: prepared,
                        });
                        liveFight.payloadRefusal ??= prepared;
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
                // Open the fight: its moment, its place and who the reader is. None of the last
                // fight's stands in, so the moment is read apart, before any step that can break.
                const now = errors.attempt(() => options.clock.readNowMilliseconds());
                if (now instanceof errors.Caught) {
                    liveFight.openedAt = null;
                    liveFight.openedAtRefusal = now;
                } else {
                    liveFight.openedAt = now;
                    liveFight.openedAtRefusal = null;
                }
                liveFight.place = null;
                liveFight.readerId = null;
                executeLiveStep(options, DEFECT_KIND.reading, undefined, () => {
                    liveFight.place = lookupMargonemValue(options.place.readPlace());
                    liveFight.readerId = lookupMargonemValue(options.hero.readHeroId());
                    options.onFightOpened();
                });
            }
            if (committed?.hasClosed === true) {
                // Keep the closed fight on the shelf. ⚠️ A row is keyed by the moment its fight
                // opened, and one with none is given none: another fight's would merge their rows.
                executeLiveStep(options, DEFECT_KIND.keeping, undefined, () => {
                    const openedAt = liveFight.openedAt;
                    if (openedAt === null) {
                        const refusal = liveFight.openedAtRefusal;
                        assert(refusal !== null, "a fight opened with no moment kept why");
                        options.defects.add({
                            kind: DEFECT_KIND.keeping,
                            region: null,
                            failure: refusal,
                        });
                        return;
                    }
                    // ⚠️ A gap mid-fight replays to figures that look right, so a fight read
                    // past a refused payload is said not kept, once, rather than shelved.
                    if (liveFight.payloadRefusal !== null) {
                        options.defects.add({
                            kind: DEFECT_KIND.keeping,
                            region: null,
                            failure: liveFight.payloadRefusal,
                        });
                        return;
                    }
                    const payloads = liveFight.capture.calls.map((call) => call.payload);
                    const fight = {
                        openedAt,
                        payloads,
                        place: liveFight.place,
                        readerId: liveFight.readerId,
                        margonemClientBuild: lookupMargonemValue(options.build.readBuildId()),
                        isPinned: false,
                    };
                    options.keeper.keep(fight);
                });
                executeLiveStep(
                    options,
                    DEFECT_KIND.reading,
                    undefined,
                    () => options.onFightKept(),
                );
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
 * ⚠️ A reading step that broke an invariant leaves the same gap a refusal does, and a kept fight
 * with a gap is refused whole when the shelf replays it: so its first throw is held as the fight's
 * refusal too, and the close keeps nothing.
 */
function executeLiveReading<Value>(
    liveFight: LiveFight,
    options: LiveFightOptions,
    fallback: Value,
    step: () => Value,
): Value {
    const ran = errors.attempt(step);
    if (!(ran instanceof errors.Caught)) return ran;
    options.defects.add({ kind: DEFECT_KIND.reading, region: null, failure: ran });
    liveFight.payloadRefusal ??= ran;
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

/** Absent or thrown while asked, the page's state is shown as unknown and is no defect. */
function lookupMargonemValue<Value>(margonemValue: Value | MargonemReadFailure): Value | null {
    if (margonemValue instanceof MargonemValueAbsent) return null;
    if (margonemValue instanceof errors.Caught) return null;
    return margonemValue;
}
