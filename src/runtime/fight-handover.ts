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
import type * as errors from "#/libs/errors.ts";
import type { FightPlace } from "#/src/ports/fight-place.ts";
import type { MargonemClientBuildPort } from "#/src/ports/margonem-client-build.ts";
import type { BrowserClock } from "#/src/ports/browser-time.ts";
import type { BrowserFileSink, FileFailure } from "#/src/ports/browser-file.ts";
import type { BrowserSurroundingsPort } from "#/src/ports/browser-surroundings.ts";
import {
    encodeFightFile,
    type FileCalls,
    type FileSubject,
    type FileSurroundings,
    type FileUnserializable,
} from "./fight-file.ts";
import type { FightState, ShownFight } from "./fight-state.ts";

export class ShownFightAbsent extends Error {
    override readonly name = "ShownFightAbsent";
}

/** Which fight the file is of is the intent's question, and its refusal is the runtime's. */
export type ExportFailure = ShownFightAbsent | FileUnserializable | FileFailure;

export interface HandoverPorts {
    clock: BrowserClock;
    build: MargonemClientBuildPort;
    surroundings: BrowserSurroundingsPort;
    file: BrowserFileSink;
    addOnVersion: string;
}

/** The live fight as it is being read, for when the panel stands on it. */
export interface LiveHandover {
    capture: FileCalls;
    place: FightPlace | null;
}

interface Handover {
    calls: FileCalls;
    subject: FileSubject;
    surroundings: FileSurroundings;
}

export function writeShownFightFile(
    shownFight: ShownFight | null,
    liveHandover: LiveHandover,
    ports: HandoverPorts,
    onLateFailure: (failure: errors.Caught) => void,
): undefined | ExportFailure {
    assert(ports.addOnVersion.length > 0, "a file names the build that wrote it");
    if (shownFight === null) return new ShownFightAbsent();
    // A fight that has ended is on the shelf and on the screen at once, and stays the live
    // recording through it: the one carrying the snapshots.
    let handover: Handover;
    if (shownFight.keptFight === null) {
        const surroundings = readLiveFileSurroundings(ports);
        if (surroundings instanceof Error) return surroundings;
        const subject = composeFileSubject(shownFight.fightState, liveHandover.place);
        handover = { calls: liveHandover.capture, subject, surroundings };
    } else {
        const { keptFight, fightState } = shownFight;
        // A replay refuses the whole fight at the first payload it will not read, so every kept
        // payload has its messages: a file whose messages belonged to other calls cannot be
        // written.
        const payloadsReplayedCount = fightState.messagesByPayload.length;
        assert(
            payloadsReplayedCount === keptFight.payloads.length,
            "a kept fight was replayed payload by payload",
        );
        const calls = keptFight.payloads.map((payload, index) => ({
            index,
            payload,
            messages: fightState.messagesByPayload[index] ?? [],
            combatantsBefore: null,
            combatantsAfter: null,
        }));
        // The world is the page's, for the reason `FrameParts.world` gives in
        // `src/runtime/panel-frame.ts`, and the browser is the one handing the fight over.
        const surroundings = readFileSurroundings(
            ports,
            keptFight.openedAt,
            keptFight.margonemClientBuild,
        );
        if (surroundings instanceof Error) return surroundings;
        handover = {
            calls: { calls, droppedCalls: null, isTruncated: null },
            subject: composeFileSubject(fightState, keptFight.place),
            surroundings,
        };
    }
    const encoded = encodeFightFile(handover.calls, handover.subject, handover.surroundings);
    if (encoded instanceof Error) return encoded;
    return ports.file.writeFile(encoded.name, encoded.text, onLateFailure);
}

/** The moment a live file states is now, because what it says is when it was taken off. */
function readLiveFileSurroundings(ports: HandoverPorts): FileSurroundings | errors.Caught {
    const now = ports.clock.readNowMilliseconds();
    if (now instanceof Error) return now;
    let margonemClientBuild: string | null;
    // Read the build: one the page will not state is absent, and no failure of the file's.
    {
        const buildId = ports.build.readBuildId();
        if (buildId instanceof Error) margonemClientBuild = null;
        else {
            assert(buildId.length > 0, "a build the page stated says something");
            margonemClientBuild = buildId;
        }
    }
    return readFileSurroundings(ports, now, margonemClientBuild);
}

function readFileSurroundings(
    ports: HandoverPorts,
    atMilliseconds: number,
    margonemClientBuild: string | null,
): FileSurroundings | errors.Caught {
    const capturedAt = ports.clock.readTimestampText(atMilliseconds);
    if (capturedAt instanceof Error) return capturedAt;
    const world = ports.surroundings.readWorld();
    assert(world.length > 0, "a world is named, or named unknown, and never left empty");
    return {
        world,
        margonemClientBuild,
        capturedAt,
        userAgent: ports.surroundings.readUserAgent(),
        addOnVersion: ports.addOnVersion,
    };
}

function composeFileSubject(fightState: FightState, place: FightPlace | null): FileSubject {
    assert(fightState.view.payloadsApplied > 0, "a fight handed over was read from something");
    return {
        statistics: fightState.figures.statistics,
        roster: fightState.view.roster,
        place,
        payloadsApplied: fightState.view.payloadsApplied,
        messagesLost: fightState.view.messagesLost,
        isOver: fightState.view.isOver,
    };
}

/**
 * The live fight's calls alone, with no report: what a fight whose figures will not tally is
 * handed over as, because that is the fight a file is most needed of (`docs/design.md` §10.3).
 */
export function writeLiveCallsFile(
    liveHandover: LiveHandover,
    ports: HandoverPorts,
    onLateFailure: (failure: errors.Caught) => void,
): undefined | ExportFailure {
    assert(liveHandover.capture.calls.length > 0, "a file of calls is written from some");
    const surroundings = readLiveFileSurroundings(ports);
    if (surroundings instanceof Error) return surroundings;
    const encoded = encodeFightFile(liveHandover.capture, null, surroundings);
    if (encoded instanceof Error) return encoded;
    return ports.file.writeFile(encoded.name, encoded.text, onLateFailure);
}
