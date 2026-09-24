/**
 * What could not be done, and how often (`docs/design.md` §8). A defect is counted under its kind,
 * and the first of a kind is written to the console as one branded line: never per render
 * (`AGENTS.md` E9). The panel states the counts; the console carries the first cause.
 */

import { assert } from "@std/assert/assert";
import type { VocabularyWord } from "@/libs/vocabulary.ts";
import type { ConsolePort } from "@/src/game/page-console.ts";
import type { RuntimeFailure } from "@/src/runtime/failure-fate.ts";

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
    failure: RuntimeFailure;
}

export interface DefectCount {
    kind: DefectKind;
    count: number;
    /** The first failure of the kind, which is the one the console was told about. */
    first: RuntimeFailure;
}

export interface DefectLedger {
    add(defect: Defect): void;
    getCounts(): readonly DefectCount[];
}

/** A count past this is a count that has stopped meaning anything but "all the time". */
const COUNT_MAXIMUM = 1048576;
const KINDS_COUNT = Object.values(DEFECT_KIND).length;

export function initDefectLedger(console: ConsolePort): DefectLedger {
    const counts = new Map<DefectKind, DefectCount>();
    return {
        add(defect) {
            const held = counts.get(defect.kind);
            if (held !== undefined) {
                if (held.count < COUNT_MAXIMUM) held.count += 1;
                return;
            }
            counts.set(defect.kind, { kind: defect.kind, count: 1, first: defect.failure });
            assert(counts.size <= KINDS_COUNT, "a ledger holds a row per kind at most");
            console.writeBrandedLine(defect.kind, defect.failure);
        },
        getCounts() {
            const rows = [...counts.values()].map((one) => ({ ...one }));
            assert(rows.length <= KINDS_COUNT, "and states no more rows than it holds");
            return rows;
        },
    };
}
