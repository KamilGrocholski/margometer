/**
 * One intent, as a state machine executes one operation (`docs/design.md` §10.3): the screen moves,
 * the shelf and the settings are written, a file is handed over. A failure leaves its mark here,
 * where the step that met it knows which one; true where the panel needs a frame.
 */

import { assert } from "@std/assert/assert";
import * as errors from "#/libs/errors.ts";
import { getFightView } from "#/src/core/fight-session.ts";
import { DEFECT_KIND, type DefectLedger } from "./defect-ledger.ts";
import type { RuntimeFailure } from "./failure-fate.ts";
import { type HandoverPorts, writeFightHandover } from "./fight-handover.ts";
import { lookupStandingFight, tallyFightReading } from "./fight-reading.ts";
import type { LiveFight } from "./live-fight.ts";
import { executeScreenIntent } from "./screen-intent.ts";
import { writeWindowFold, writeWindowPosition } from "./settings.ts";
import type { ShelfKeeper } from "./shelf-keeper.ts";
import type { KeyValueStore } from "#/src/game/browser-store.ts";
import { PANEL_WINDOW } from "#/src/ui/panel-choice.ts";
import { PANEL_INTENT, type PanelIntent } from "#/src/ui/panel-intent.ts";
import type { ScreenState } from "#/src/ui/panel-screen.ts";

export interface IntentParts {
    ports: Omit<HandoverPorts, "version"> & { settings: KeyValueStore };
    version: string;
    screen: ScreenState;
    keeper: ShelfKeeper;
    live: LiveFight;
    defects: DefectLedger;
}

export function executeRuntimeIntent(parts: IntentParts, intent: PanelIntent): boolean {
    switch (intent.kind) {
        case PANEL_INTENT.saveFile: {
            // Everything under a file reaches `core/`, whose assertion costs the file alone.
            const saved = errors.attempt(() => writeIntentFile(parts));
            if (saved instanceof Error) addFileDefect(parts.defects, saved);
            return executeScreenIntent(parts.screen, intent);
        }
        case PANEL_INTENT.pin:
            parts.keeper.pin(intent.openedAt);
            return true;
        case PANEL_INTENT.storage:
            parts.keeper.choose(intent.choice);
            return true;
        // Once per drag rather than once per frame, and no frame: the panel already stands there.
        // A refusal is an answer: the reader's choice stands, and only the next visit is the
        // poorer for it, as `develop` has it.
        case PANEL_INTENT.move:
            void writeWindowPosition(parts.ports.settings, intent.window, intent.position);
            return false;
        case PANEL_INTENT.fold: {
            const hasMoved = executeScreenIntent(parts.screen, intent);
            const isCollapsed = intent.window === PANEL_WINDOW.panel
                ? parts.screen.isCollapsed
                : parts.screen.isStandingCollapsed;
            void writeWindowFold(parts.ports.settings, intent.window, isCollapsed);
            assert(hasMoved, "a fold always moves the window it names");
            return hasMoved;
        }
        default:
            return executeScreenIntent(parts.screen, intent);
    }
}

/**
 * The file a reader asked for, or a mark. The release of the file lands on the browser's clock
 * after this has returned, so its failure is handed the same mark by the sink.
 */
function writeIntentFile(parts: IntentParts): void {
    const { screen, keeper, live, defects } = parts;
    const view = getFightView(live.session);
    const liveReading = view === null ? null : tallyFightReading(view);
    const standing = lookupStandingFight(
        liveReading,
        screen.openFightId,
        keeper.getFights(),
        keeper.lookupReading,
    );
    if (standing !== null) {
        const applied = standing.reading.view.payloadsApplied;
        assert(applied > 0, "a fight handed over was read from something");
    }
    const ports = { ...parts.ports, version: parts.version };
    const written = writeFightHandover(standing, live, ports, (failure) => {
        addFileDefect(defects, failure);
    });
    if (written instanceof Error) addFileDefect(defects, written);
}

function addFileDefect(defects: DefectLedger, failure: RuntimeFailure): void {
    defects.add({ kind: DEFECT_KIND.file, region: null, failure });
}
