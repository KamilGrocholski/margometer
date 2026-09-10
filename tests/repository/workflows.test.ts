/**
 * The three workflows, held to the one thing they say about each other.
 *
 * `check.yml` states it in a comment: the runtimes are pinned, and pinned to what `pages.yml` and
 * `release.yml` pin. A version drifting in one of them is silent — the gate a person waited for
 * and the run that publishes the release would be different programs, and **G7** puts a release
 * on that gate having gone green.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";

const WORKFLOWS = ".github/workflows";
/** More steps than these files hold, so the walk states a bound like every other. */
const MAXIMUM_PINS = 64;
const PINNED = ["deno-version", "node-version"];

/** Every `<name>: <value>` a workflow pins, in the order it pins them. */
export function readPinnedVersions(text: string, name: string): string[] {
    const found: string[] = [];
    const opener = `${name}:`;
    for (const line of text.split("\n")) {
        const bare = line.trim();
        if (!bare.startsWith(opener)) continue;
        assert(found.length <= MAXIMUM_PINS, "the walk stays inside its stated bound");
        found.push(bare.slice(opener.length).trim());
    }
    return found;
}

function readWorkflowNames(): string[] {
    const found: string[] = [];
    for (const entry of Deno.readDirSync(WORKFLOWS)) {
        if (entry.isFile) found.push(entry.name);
    }
    found.sort();
    assert(found.length > 0, "there are workflows to read");
    return found;
}

Deno.test("the reader finds a pin, and finds none where a name merely appears", () => {
    assertEquals(readPinnedVersions("  deno-version: 2.9.6\n", "deno-version"), ["2.9.6"]);
    assertEquals(readPinnedVersions("# deno-version is pinned\n", "deno-version"), []);
    assertEquals(readPinnedVersions("  node-version: 24\n", "deno-version"), []);
    assertStrictEquals(countStepsUsing("  - uses: a/setup-deno@v2\n", "setup-deno"), 1, "a step");
    assertStrictEquals(countStepsUsing("  # setup-deno is pinned\n", "setup-deno"), 0, "not prose");
});

Deno.test("every workflow pins the same runtime as every other", () => {
    const names = readWorkflowNames();
    for (const pinned of PINNED) {
        const stated = new Map<string, string[]>();
        for (const name of names) {
            const found = readPinnedVersions(Deno.readTextFileSync(`${WORKFLOWS}/${name}`), pinned);
            if (found.length === 0) continue;
            stated.set(name, found);
        }
        assert(stated.size > 1, `${pinned}: more than one workflow pins it`);
        const every = [...stated.values()].flat();
        assertStrictEquals(
            new Set(every).size,
            1,
            `${pinned}: pinned to ${[...new Set(every)].join(" and ")}`,
        );
    }
});

/**
 * The steps a workflow runs an action in. **A name in a comment is not a step**, and counting text
 * read `pages.yml` as asking for `setup-deno` twice where it asks once and explains itself beside.
 */
function countStepsUsing(text: string, tool: string): number {
    let counted = 0;
    for (const line of text.split("\n")) {
        const bare = line.trim();
        if (!bare.startsWith("- uses:")) continue;
        if (!bare.includes(tool)) continue;
        counted += 1;
    }
    return counted;
}

/** The other way round: a workflow that pins nothing runs on whatever the runner has that day. */
Deno.test("no workflow asks for a runtime without pinning it", () => {
    const unpinned: string[] = [];
    for (const name of readWorkflowNames()) {
        const text = Deno.readTextFileSync(`${WORKFLOWS}/${name}`);
        for (
            const [tool, pinned] of [["setup-deno", "deno-version"], ["setup-node", "node-version"]]
        ) {
            if (tool === undefined || pinned === undefined) continue;
            const asks = countStepsUsing(text, tool);
            const pins = readPinnedVersions(text, pinned).length;
            if (asks !== pins) unpinned.push(`${name}: ${asks} × ${tool}, ${pins} pinned`);
        }
    }
    assertEquals(unpinned, [], "a runtime nobody pinned turns the gate red one day with no change");
});
