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
import type { FightPlace } from "#/src/game/fight-place.ts";
import type { GameBuildPort } from "#/src/game/game-build.ts";
import type { BrowserClock } from "#/src/game/browser-time.ts";
import type { BrowserFileSink, FileFailure } from "#/src/game/browser-file.ts";
import type { BrowserSurroundingsPort } from "#/src/game/browser-surroundings.ts";
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
    build: GameBuildPort;
    surroundings: BrowserSurroundingsPort;
    file: BrowserFileSink;
    version: string;
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
    shown: ShownFight | null,
    live: LiveHandover,
    ports: HandoverPorts,
    onLateFailure: (failure: errors.Caught) => void,
): undefined | ExportFailure {
    assert(ports.version.length > 0, "a file names the build that wrote it");
    if (shown === null) return new ShownFightAbsent();
    // A fight that has ended is on the shelf and on the screen at once, and stays the live
    // recording through it: the one carrying the snapshots. The moment a live file states is now,
    // because what it says is when it was taken off.
    let handover: Handover;
    if (shown.kept === null) {
        const now = ports.clock.readNowMilliseconds();
        let gameBuild: string | null;
        // Read the build: one the page will not state is absent, and no failure of the file's.
        {
            const read = ports.build.readBuildId();
            if (read instanceof Error) gameBuild = null;
            else {
                assert(read.length > 0, "a build the page stated says something");
                gameBuild = read;
            }
        }
        const surroundings = readFileSurroundings(ports, now, gameBuild);
        if (surroundings instanceof Error) return surroundings;
        const subject = composeFileSubject(shown.state, live.place);
        handover = { calls: live.capture, subject, surroundings };
    } else {
        const { kept, state } = shown;
        // A replay refuses the whole fight at the first payload it will not read, so every kept
        // payload has its messages: a file whose messages belonged to other calls cannot be
        // written.
        const read = state.messagesByPayload.length;
        assert(read === kept.payloads.length, "a kept fight was replayed payload by payload");
        const calls = kept.payloads.map((payload, index) => ({
            index,
            payload,
            messages: state.messagesByPayload[index] ?? [],
            combatantsBefore: null,
            combatantsAfter: null,
        }));
        // The world and the browser are the page's: a shelf is read out of one origin's store.
        const surroundings = readFileSurroundings(ports, kept.openedAt, kept.gameBuild);
        if (surroundings instanceof Error) return surroundings;
        handover = {
            calls: { calls, droppedCalls: null, isTruncated: null },
            subject: composeFileSubject(state, kept.place),
            surroundings,
        };
    }
    const encoded = encodeFightFile(handover.calls, handover.subject, handover.surroundings);
    if (encoded instanceof Error) return encoded;
    return ports.file.writeFile(encoded.name, encoded.text, onLateFailure);
}

function readFileSurroundings(
    ports: HandoverPorts,
    atMilliseconds: number,
    gameBuild: string | null,
): FileSurroundings | errors.Caught {
    const capturedAt = ports.clock.readTimestampText(atMilliseconds);
    if (capturedAt instanceof Error) return capturedAt;
    const world = ports.surroundings.readWorld();
    assert(world.length > 0, "a world is named, or named unknown, and never left empty");
    return {
        world,
        gameBuild,
        capturedAt,
        userAgent: ports.surroundings.readUserAgent(),
        addOnVersion: ports.version,
    };
}

function composeFileSubject(reading: FightState, place: FightPlace | null): FileSubject {
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
