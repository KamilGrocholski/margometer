/**
 * Hands a file to the browser, which puts it wherever the reader's downloads go
 * (`docs/design.md` §5). A file rather than the clipboard, because a recording runs to hundreds of
 * kilobytes; a blob and an object URL are ordinary page APIs, and nothing leaves the browser.
 *
 * ⚠️ **The anchor goes into the document, and the URL is released on the next tick.** Clicking a
 * detached node and revoking at once is tolerated by Chromium and can abort the download in
 * Firefox, which reads the blob after the click returns: nothing throws, and no file arrives.
 */

import { assert } from "@std/assert/assert";
import {
    callForeign,
    err,
    type ForeignFailure,
    ok,
    type Result,
    runGuarded,
} from "#/libs/result.ts";
import type { VocabularyWord } from "#/libs/vocabulary.ts";

export interface FileSink {
    /** The release lands on the browser's clock later, so its failure is handed back apart. */
    writeFile(
        name: string,
        text: string,
        onLateFailure: (failure: ForeignFailure) => void,
    ): Result<void, FileFailure>;
}

export const FILE_SINK_FAILURE = { apiAbsent: "file-api-absent" } as const;
export type FileSinkFailureKind = VocabularyWord<typeof FILE_SINK_FAILURE>;
export type FileFailure = { kind: typeof FILE_SINK_FAILURE.apiAbsent } | ForeignFailure;

/** The whole of what this asks a page for. A browser's `window` and `document` satisfy it. */
export interface PageDownloads {
    createObjectURL(blob: unknown): string;
    revokeObjectURL(url: string): void;
    createBlob(text: string, type: string): unknown;
    createAnchor(): DownloadAnchor | null;
    setTimeout(step: () => void, afterMilliseconds: number): void;
}

export interface DownloadAnchor {
    href: string;
    download: string;
    className: string;
    append(): void;
    click(): void;
    remove(): void;
}

/** The one class a reader could meet outside the panel, so it is named as ours. */
const DOWNLOAD_ANCHOR_CLASS = "MargoMeter-download";
const FILE_TYPE = "application/json";

export function initPageFile(downloads: PageDownloads | null): FileSink {
    return {
        writeFile(name, text, onLateFailure) {
            assert(name.length > 0, "a file handed over is named");
            assert(text.length > 0, "and says something");
            if (downloads === null) return err({ kind: FILE_SINK_FAILURE.apiAbsent });
            const url = callForeign(() => {
                return downloads.createObjectURL(downloads.createBlob(text, FILE_TYPE));
            });
            if (!url.ok) return url;
            const clicked = callForeign(() => writePageFileAnchor(downloads, url.value, name));
            // The clock is the browser's, so the release is guarded where it is handed over (E10).
            const release = (): void => {
                const revoked = callForeign(() => downloads.revokeObjectURL(url.value));
                if (!revoked.ok) void runGuarded(() => onLateFailure(revoked.error));
            };
            const scheduled = callForeign(() => downloads.setTimeout(release, 0));
            if (!scheduled.ok) return scheduled;
            if (!clicked.ok) return clicked;
            if (!clicked.value) return err({ kind: FILE_SINK_FAILURE.apiAbsent });
            return ok(undefined);
        },
    };
}

/** False where the page lends no anchor; the anchor comes off whether the click threw or not. */
function writePageFileAnchor(downloads: PageDownloads, url: string, name: string): boolean {
    assert(url.length > 0, "a file is clicked under the address the page gave it");
    const anchor = downloads.createAnchor();
    if (anchor === null) return false;
    anchor.href = url;
    anchor.download = name;
    anchor.className = DOWNLOAD_ANCHOR_CLASS;
    anchor.append();
    try {
        anchor.click();
    } finally {
        anchor.remove();
    }
    return true;
}
