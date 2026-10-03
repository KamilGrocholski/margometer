/**
 * What could not be done, and how often (`docs/design.md` §8). A defect is counted under its kind
 * and the region it left undrawn, one row per pair, in the order each pair first arrived; the first
 * of a kind is written to the console as one branded line, never per render (`AGENTS.md` E9). The
 * panel states the counts; the console carries the first cause.
 */

import { assert } from "@std/assert/assert";
import type { VocabularyWord } from "#/libs/vocabulary.ts";
import type { BrowserConsolePort } from "#/src/ports/browser-console.ts";
import type { RuntimeFailure } from "./failure-fate.ts";
import { PANEL_REGION, type PanelRegion } from "#/src/ui/panel-words.ts";

export const DEFECT_KIND = {
    kept: "kept",
    keeping: "keeping",
    mount: "mount",
    region: "region",
    reading: "reading",
    figures: "figures",
    gesture: "gesture",
    file: "file",
    engine: "engine",
} as const;
export type DefectKind = VocabularyWord<typeof DEFECT_KIND>;

export interface Defect {
    kind: DefectKind;
    /** The region it left undrawn, and null where it is no region's. */
    region: PanelRegion | null;
    failure: RuntimeFailure;
}

export interface DefectCount {
    kind: DefectKind;
    region: PanelRegion | null;
    count: number;
    /** The first failure of the row, which is the one the console was told about. */
    first: RuntimeFailure;
}

export interface DefectLedger {
    add(defect: Defect): void;
    getCounts(): readonly DefectCount[];
}

/** A count past this is a count that has stopped meaning anything but "all the time". */
const COUNT_MAXIMUM = 1048576;
const KINDS_COUNT = Object.values(DEFECT_KIND).length;
/** Every kind, under every region and under none. */
const ROWS_MAXIMUM = KINDS_COUNT * (Object.values(PANEL_REGION).length + 1);

export function initDefectLedger(browserConsole: BrowserConsolePort): DefectLedger {
    const countsByRowKey = new Map<string, DefectCount>();
    const kindsWritten = new Set<DefectKind>();
    return {
        add(defect) {
            const rowKey = defect.region === null ? defect.kind : `${defect.kind}/${defect.region}`;
            const defectCount = countsByRowKey.get(rowKey);
            if (defectCount !== undefined) {
                if (defectCount.count < COUNT_MAXIMUM) defectCount.count += 1;
                return;
            }
            const { kind, region, failure } = defect;
            countsByRowKey.set(rowKey, { kind, region, count: 1, first: failure });
            assert(
                countsByRowKey.size <= ROWS_MAXIMUM,
                "a ledger holds a row per kind and region at most",
            );
            if (kindsWritten.has(kind)) return;
            kindsWritten.add(kind);
            browserConsole.writeBrandedLine(kind, failure);
        },
        getCounts() {
            const rows = [...countsByRowKey.values()].map((defectCount) => ({ ...defectCount }));
            assert(rows.length <= ROWS_MAXIMUM, "and states no more rows than it holds");
            return rows;
        },
    };
}
