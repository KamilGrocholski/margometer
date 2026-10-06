/**
 * The workflows under `.github/workflows/`, held to what `check.yml` says of them in a comment:
 * every runtime is pinned, and pinned to the version every other workflow pins. A version drifting
 * in one of them is silent — the gate a person runs and the one a release runs stop being the same.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";

const WORKFLOWS_DIRECTORY = ".github/workflows/";
const USES_MARK = "uses: ";
/** Each runtime's setup action, and the input that pins it. */
const PIN_BY_ACTION: Record<string, string> = {
    "denoland/setup-deno": "deno-version: ",
    "actions/setup-node": "node-version: ",
};
/** How far below its action an input may stand: the `with:` line, then the pin. */
const PIN_LINES_BELOW = 3;

Deno.test("the reader finds a pin under its action, and none where the action has none", () => {
    const pinned = ["- uses: denoland/setup-deno@v2", "  with:", "      deno-version: 2.9.7"];
    assertEquals(readPins(pinned.join("\n")), [["denoland/setup-deno", "2.9.7"]], "the pin");
    const bare = ["- uses: denoland/setup-deno@v2", "- run: deno task check"];
    assertEquals(readPins(bare.join("\n")), [["denoland/setup-deno", null]], "and none");
});

/** Every runtime action a workflow uses, and the version it pins, or null where it pins none. */
function readPins(text: string): [string, string | null][] {
    const lines = text.split("\n");
    const pins: [string, string | null][] = [];
    for (const [index, line] of lines.entries()) {
        const usesIndex = line.indexOf(USES_MARK);
        if (usesIndex === -1) continue;
        const used = line.slice(usesIndex + USES_MARK.length);
        const action = used.slice(0, used.indexOf("@"));
        const input = PIN_BY_ACTION[action];
        if (input === undefined) continue;
        const below = lines.slice(index + 1, index + 1 + PIN_LINES_BELOW);
        const pin = below.map((belowLine) => belowLine.trim()).find((trimmed) =>
            trimmed.startsWith(input)
        );
        pins.push([action, pin === undefined ? null : pin.slice(input.length)]);
    }
    return pins;
}

Deno.test("every workflow pins each runtime, and pins the one every other workflow pins", () => {
    const pinsByAction = new Map<string, Set<string | null>>();
    for (const workflowFile of Deno.readDirSync(WORKFLOWS_DIRECTORY)) {
        const text = Deno.readTextFileSync(WORKFLOWS_DIRECTORY + workflowFile.name);
        for (const [action, pin] of readPins(text)) {
            pinsByAction.set(action, (pinsByAction.get(action) ?? new Set()).add(pin));
        }
    }
    assertEquals([...pinsByAction.keys()].sort(), Object.keys(PIN_BY_ACTION).sort(), "both read");
    for (const [action, pins] of pinsByAction) {
        assert(!pins.has(null), `${action} is pinned wherever it is used`);
        assertStrictEquals(
            pins.size,
            1,
            `${action} is pinned to one version: ${[...pins].join(", ")}`,
        );
    }
});
