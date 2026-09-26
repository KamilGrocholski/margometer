/**
 * Handing a file to the browser. A fake document exercises the order of the calls and the
 * refusals; that a real browser starts the download is `develop`'s end-to-end suite's to hold.
 */

import { assertEquals, assertInstanceOf, assertStrictEquals } from "@std/assert";
import * as errors from "#/libs/errors.ts";
import {
    type DownloadAnchor,
    FileApiAbsent,
    initPageFile,
    type PageDownloads,
} from "#/src/game/page-file.ts";

Deno.test("a file goes to the browser through an anchor in the page, released a tick later", () => {
    const page = composeDownloads();
    const written = initPageFile(page.downloads).writeFile("fight.json", "{}", () => {});
    assertStrictEquals(written, undefined, "the browser took it");
    assertEquals(page.calls, ["url", "append", "click", "remove"], "clicked where it stands");
    assertEquals([page.anchor.download, page.anchor.href], ["fight.json", "blob:1"], "named");
    assertStrictEquals(page.anchor.className, "MargoMeter-download", "under a class of ours");
    page.timers.shift()?.();
    assertEquals(page.calls.at(-1), "revoke blob:1", "and the address released after the click");
});

function composeDownloads(over: Partial<PageDownloads> = {}, click = () => {}) {
    const calls: string[] = [];
    const timers: (() => void)[] = [];
    const anchor: DownloadAnchor = {
        href: "",
        download: "",
        className: "",
        click: () => {
            calls.push("click");
            click();
        },
        remove: () => void calls.push("remove"),
    };
    const downloads: PageDownloads = {
        createObjectURL: () => {
            calls.push("url");
            return "blob:1";
        },
        revokeObjectURL: (url) => void calls.push(`revoke ${url}`),
        createBlob: (text, type) => ({ text, type }),
        createAnchor: () => anchor,
        appendAnchor: () => void calls.push("append"),
        setTimeout: (step) => void timers.push(step),
        ...over,
    };
    return { downloads, calls, timers, anchor };
}

Deno.test("a page that lends nothing to download with is answered, and nothing is clicked", () => {
    const written = initPageFile(null).writeFile("fight.json", "{}", () => {});
    assertInstanceOf(written, FileApiAbsent, "absent");
    const anchorless = composeDownloads({ createAnchor: () => null });
    const refused = initPageFile(anchorless.downloads).writeFile("fight.json", "{}", () => {});
    assertInstanceOf(refused, FileApiAbsent, "no anchor");
    anchorless.timers.shift()?.();
    assertEquals(anchorless.calls.at(-1), "revoke blob:1", "and the address it took is released");
});

Deno.test("a click that throws takes the anchor off all the same, as the page's failure", () => {
    const page = composeDownloads({}, () => {
        throw new TypeError("a page being torn down");
    });
    const written = initPageFile(page.downloads).writeFile("fight.json", "{}", () => {});
    assertInstanceOf(written, Error, "the click's throw is answered");
    assertInstanceOf(written, errors.Caught, "as the page's failure");
    assertEquals(page.calls, ["url", "append", "click", "remove"], "and the anchor came off");
    assertStrictEquals(page.timers.length, 1, "and the address is still released");
});

Deno.test("a page whose clock will not take the release says so, rather than say it saved", () => {
    const page = composeDownloads({
        setTimeout: () => {
            throw new TypeError("a page being torn down");
        },
    });
    const written = initPageFile(page.downloads).writeFile("fight.json", "{}", () => {});
    assertInstanceOf(written, Error, "the refusal is answered");
    assertInstanceOf(written, errors.Caught, "as the page's failure");
});

/** The release lands on the browser's clock, after the write has returned. */
Deno.test("a release that throws later is handed to the sink, never to the page's clock", () => {
    const late: errors.Caught[] = [];
    const page = composeDownloads({
        revokeObjectURL: () => {
            throw new TypeError("a page being torn down");
        },
    });
    initPageFile(page.downloads).writeFile("fight.json", "{}", (failure) => late.push(failure));
    assertStrictEquals(late.length, 0, "nothing is late before the tick");
    page.timers.shift()?.();
    assertStrictEquals(late.length, 1, "and the failure arrives at the sink after it");
    const sinkThrows = composeDownloads({
        revokeObjectURL: () => {
            throw new TypeError("a page being torn down");
        },
    });
    initPageFile(sinkThrows.downloads).writeFile("fight.json", "{}", () => {
        throw new TypeError("a sink that breaks");
    });
    sinkThrows.timers.shift()?.();
});
