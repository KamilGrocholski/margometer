/**
 * What the panel could not do, kept by kind so a reader is told once rather than once per redraw.
 *
 * The layer this sits in throws nothing and asserts nothing (**A11**, **E14**), so a failure it
 * swallows has to come back out somewhere a person can see it. This is that somewhere, and the
 * console is the other half: one branded entry the first time a kind arrives, never again
 * (**E11**). **ADR 0051.**
 */

import { composeDefectText, type DefectKind, type PanelRegion } from "@/src/ui/panel-words.ts";

/** Kind and region are finite, so this is headroom; it holds by refusing, never by throwing. */
const MAXIMUM_DEFECTS_KEPT = 64;

/** What is drawn, against what is counted: a panel saying six things has said enough. */
const MAXIMUM_DEFECTS_SAID = 6;

interface KeptDefect {
    kind: DefectKind;
    region: PanelRegion | null;
    count: number;
}

/** One failure on its way to the tally: what could not be done, and where, if anywhere. */
export interface PanelFailure {
    kind: DefectKind;
    region: PanelRegion | null;
    failure: unknown;
}

/** What every guard in the panel is handed, so a failure arrives already saying what it cost. */
export type HandlePanelFailure = (mark: PanelFailure) => void;

export interface KeptDefects {
    /** The failure reaches the reporter only on a kind's first arrival — **E11**. */
    add(kind: DefectKind, region: PanelRegion | null, failure: unknown): void;
    /** What the panel draws, in the order the kinds first arrived. */
    getSaid(): readonly string[];
}

function composeDefectName(kind: DefectKind, region: PanelRegion | null): string {
    return region === null ? kind : `${kind}/${region}`;
}

/**
 * This runs inside the `catch` that was already handling a failure, so a throw out of somebody
 * else's console would cost the reader the region the defect is about. **The mark is the defect**,
 * recorded before the report and drawn whether or not it lands — **ADR 0025**.
 */
function reportDefectOnce(report: (failure: unknown) => void, failure: unknown): void {
    try {
        report(failure);
    } catch {
        return;
    }
}

export function composeDefectKeeper(report: (failure: unknown) => void): KeptDefects {
    const held = new Map<string, KeptDefect>();
    return {
        add(kind: DefectKind, region: PanelRegion | null, failure: unknown): void {
            const name = composeDefectName(kind, region);
            const kept = held.get(name);
            if (kept !== undefined) {
                kept.count += 1;
                return;
            }
            if (held.size >= MAXIMUM_DEFECTS_KEPT) return;
            held.set(name, { kind, region, count: 1 });
            reportDefectOnce(report, failure);
        },
        getSaid(): readonly string[] {
            const said: string[] = [];
            for (const kept of held.values()) {
                if (said.length >= MAXIMUM_DEFECTS_SAID) break;
                said.push(composeDefectText(kept.kind, kept.region, kept.count));
            }
            return said;
        },
    };
}
