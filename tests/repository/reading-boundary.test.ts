/**
 * `SECURITY.md`'s first rule, held over what the browser actually runs.
 *
 * **Nothing leaves the browser** is the whole security model of an add-on that sits inside
 * somebody else's game, and until this file nothing but reading held it: the one guard naming
 * `fetch` scopes itself to `src/ui/` and is there to keep the panel's surface declared, not to
 * keep the add-on offline. The rest of the bundle was checked by nobody.
 */

import { assert, assertEquals } from "@std/assert";
import { getCodeOutsideStrings, isCommentLine } from "@/tests/source-line.ts";
import { getSourcePaths } from "@/tests/source-paths.ts";

const SECURITY = "SECURITY.md";
/** What the browser runs. `tools/` reaches the network on purpose and is not in it. */
const BUNDLED_ROOTS = ["libs/", "src/"];

/**
 * Every way out of the page this add-on could take, named as `SECURITY.md` names them. A tag that
 * fetches when it is appended is here too: the rule forbids "no image or stylesheet request of
 * ours", and `createElement` is how one would be made.
 */
const WAYS_OUT = [
    "fetch",
    "XMLHttpRequest",
    "WebSocket",
    "EventSource",
    "sendBeacon",
    "importScripts",
    "Worker",
    "SharedWorker",
    "Image",
    "Request",
];

/**
 * ⚠️ **A name behind a dot is a property, not the ambient one.** `page.navigator.userAgent` reads
 * the page the entry was handed and `store.fetch(…)` would be a method of ours; neither is the
 * global this rule is about, and a reader that took them would forbid reading the page at all.
 */
export function hasAmbientName(code: string, name: string): boolean {
    let at = code.indexOf(name);
    let looked = 0;
    while (at !== -1) {
        looked += 1;
        assert(looked <= code.length + 1, "the walk stays inside its stated bound");
        const before = at === 0 ? "" : code.charAt(at - 1);
        const after = code.charAt(at + name.length);
        if (before !== ".") {
            if (!isWordLetter(before)) {
                if (!isWordLetter(after)) return true;
            }
        }
        at = code.indexOf(name, at + 1);
    }
    return false;
}

function isWordLetter(character: string): boolean {
    if (character >= "a" && character <= "z") return true;
    if (character >= "A" && character <= "Z") return true;
    if (character >= "0" && character <= "9") return true;
    return character === "_" || character === "$";
}

Deno.test("the reader finds an ambient name, and finds none behind a dot", () => {
    assert(hasAmbientName("const held = fetch(url);", "fetch"), "a bare call is one");
    assert(
        !hasAmbientName("const held = page.fetch(url);", "fetch"),
        "a property of a page is not",
    );
    assert(!hasAmbientName("const held = prefetch(url);", "fetch"), "nor a longer word");
    assert(!hasAmbientName("const held = fetchedAt;", "fetch"), "nor one a longer word opens with");
    assert(hasAmbientName("new WebSocket(where);", "WebSocket"), "a constructor is one");
});

Deno.test("nothing the browser runs reaches for a way out of the page", () => {
    assert(WAYS_OUT.length > 0, "there are ways out to look for");
    const reaching: string[] = [];
    let read = 0;
    for (const path of getSourcePaths()) {
        if (!BUNDLED_ROOTS.some((root) => path.startsWith(root))) continue;
        read += 1;
        for (const [offset, line] of Deno.readTextFileSync(path).split("\n").entries()) {
            if (isCommentLine(line)) continue;
            const code = getCodeOutsideStrings(line);
            for (const way of WAYS_OUT) {
                if (!hasAmbientName(code, way)) continue;
                reaching.push(`${path}:${offset + 1} → ${way}`);
            }
        }
    }
    assert(read > 0, "there is a bundle to read");
    assertEquals(reaching, [], "SECURITY.md: an outbound call is out of scope for this project");
});

/** The other way round: a way out the document names and this file does not look for. */
Deno.test("every way out the document names is one this guard looks for", () => {
    const said = Deno.readTextFileSync(SECURITY);
    const missing = WAYS_OUT.filter((way) => !said.includes(way));
    assertEquals(
        missing.filter((way) =>
            ["fetch", "XMLHttpRequest", "WebSocket", "sendBeacon"].includes(way)
        ),
        [],
        `${SECURITY}: the four it names are the four this reads for`,
    );
    assert(said.includes("Nothing leaves the browser"), `${SECURITY}: the rule is still its first`);
});
