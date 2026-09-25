/**
 * The fight the panel stands on, handed over as a file (`docs/design.md` §8, §11). **The fight on
 * screen and not the one going on**: a reader who walked into a kept fight means that one, and a
 * reader between fights is looking at one that ended (`develop ADR 0053`).
 *
 * ⚠️ **What the shelf never kept is `null`, never an empty list.** A snapshot is read off the
 * engine while a fight is on and there is no engine to ask afterwards; zero and none are different
 * claims, and intake refuses a kept fight's file on exactly that (`develop ADR 0053`).
 */

import { assert } from "@std/assert/assert";
import { err, type ForeignFailure, ok, type Result } from "@/libs/result.ts";
import type { VocabularyWord } from "@/libs/vocabulary.ts";
import type { CaptureStanding } from "@/src/game/fight-capture.ts";
import type { FightPlace } from "@/src/game/fight-place.ts";
import type { BuildPort } from "@/src/game/game-build.ts";
import type { Clock } from "@/src/game/page-clock.ts";
import type { FileFailure, FileSink } from "@/src/game/page-file.ts";
import type { SurroundingsPort } from "@/src/game/page-surroundings.ts";
import {
    encodeFightFile,
    type FileCalls,
    type FileEncodingFailure,
    type FileSubject,
    type FileSurroundings,
} from "@/src/runtime/fight-file.ts";
import type { FightReading, StandingFight } from "@/src/runtime/fight-reading.ts";

export const HANDOVER_FAILURE = { noFightOnScreen: "no-fight-on-screen" } as const;
export type HandoverFailureKind = VocabularyWord<typeof HANDOVER_FAILURE>;

/** Which fight the file is of is the intent's question, and its refusal is the runtime's. */
export type ExportFailure =
    | { kind: typeof HANDOVER_FAILURE.noFightOnScreen }
    | FileEncodingFailure
    | FileFailure;

export interface HandoverPorts {
    clock: Clock;
    build: BuildPort;
    surroundings: SurroundingsPort;
    file: FileSink;
    version: string;
}

/** The live fight as it is being read, for when the panel stands on it. */
export interface LiveHandover {
    capture: CaptureStanding;
    place: FightPlace | null;
}

export function writeFightHandover(
    standing: StandingFight | null,
    live: LiveHandover,
    ports: HandoverPorts,
    onLateFailure: (failure: ForeignFailure) => void,
): Result<void, ExportFailure> {
    assert(ports.version.length > 0, "a file names the build that wrote it");
    if (standing === null) return err({ kind: HANDOVER_FAILURE.noFightOnScreen });
    const prepared = prepareHandover(standing, live, ports);
    if (!prepared.ok) return prepared;
    const encoded = encodeFightFile(
        prepared.value.calls,
        prepared.value.subject,
        prepared.value.surroundings,
    );
    if (!encoded.ok) return encoded;
    return ports.file.writeFile(encoded.value.name, encoded.value.text, onLateFailure);
}

interface Handover {
    calls: FileCalls;
    subject: FileSubject;
    surroundings: FileSurroundings;
}

/**
 * A fight that has ended is on the shelf and on the screen at once, and stays the live recording
 * through it: the one carrying the snapshots. The moment a live file states is now, because what
 * it says is when it was taken off.
 */
function prepareHandover(
    standing: StandingFight,
    live: LiveHandover,
    ports: HandoverPorts,
): Result<Handover, ExportFailure> {
    if (standing.kept === null) {
        const now = ports.clock.readNowMilliseconds();
        const surroundings = readHandoverSurroundings(ports, now, readLiveBuild(ports.build));
        if (!surroundings.ok) return surroundings;
        const subject = prepareHandoverSubject(standing.reading, live.place);
        return ok({ calls: live.capture, subject, surroundings: surroundings.value });
    }
    const { kept, reading } = standing;
    // A replay refuses the whole fight at the first payload it will not read, so every kept
    // payload has its messages: a file whose messages belonged to other calls cannot be written.
    const read = reading.messagesByPayload.length;
    assert(read === kept.payloads.length, "a kept fight was replayed payload by payload");
    const calls = kept.payloads.map((payload, index) => ({
        index,
        payload,
        messages: reading.messagesByPayload[index] ?? [],
        combatantsBefore: null,
        combatantsAfter: null,
    }));
    // The world and the browser are the page's: a shelf is read out of one origin's store.
    const surroundings = readHandoverSurroundings(ports, kept.openedAt, kept.gameBuild);
    if (!surroundings.ok) return surroundings;
    return ok({
        calls: { calls, droppedCalls: null, isTruncated: null },
        subject: prepareHandoverSubject(reading, kept.place),
        surroundings: surroundings.value,
    });
}

function prepareHandoverSubject(reading: FightReading, place: FightPlace | null): FileSubject {
    assert(reading.view.payloadsApplied > 0, "a fight handed over was read from something");
    return {
        statistics: reading.figures.statistics,
        roster: reading.view.roster,
        place,
        payloads: reading.view.payloadsApplied,
        messagesLost: reading.view.messagesLost,
        isOver: reading.view.isOver,
    };
}

/** A build the page will not state is absent from the file, and no failure of the file's. */
function readLiveBuild(build: BuildPort): string | null {
    const read = build.readBuildId();
    if (!read.ok) return null;
    assert(read.value.length > 0, "a build the page stated says something");
    return read.value;
}

function readHandoverSurroundings(
    ports: HandoverPorts,
    atMilliseconds: number,
    gameBuild: string | null,
): Result<FileSurroundings, ForeignFailure> {
    const capturedAt = ports.clock.readTimestampText(atMilliseconds);
    if (!capturedAt.ok) return capturedAt;
    const world = ports.surroundings.readWorld();
    assert(world.length > 0, "a world is named, or named unknown, and never left empty");
    return ok({
        world,
        gameBuild,
        capturedAt: capturedAt.value,
        userAgent: ports.surroundings.readUserAgent(),
        addOnVersion: ports.version,
    });
}
