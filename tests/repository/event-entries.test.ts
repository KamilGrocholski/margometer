/**
 * P2: each event changes state at one point. A `render…` is called by a render, an init, the
 * frame's entry or the card's, and a `commit…` by a commit, a replay or the payload's entry. The
 * entries are named by the headings of `docs/design.md` §10.4, §10.7 and §10.2, read off the design
 * and never spelled here, so the code and the design call them the same thing.
 */

import { assert, assertEquals } from "@std/assert";
import {
    type AstNode,
    composeSample,
    formatNodePlace,
    indexCallableNames,
    NAME_MARK,
    readAstNodes,
    readDeclaredFunctionName,
    readSourceFiles,
    type SourceFile,
} from "#/tests/source-tree.ts";
import { readVerb } from "#/tests/verb-purities.ts";

interface EventEntries {
    frame: string;
    card: string;
    payload: string;
}

/** Where the events are: the bundle. A tool replays, and never draws. */
const CHECKED_DIRECTORIES = ["src"];
const DESIGN_PATH = "docs/design.md";
const FRAME_HEADING_OPENER = "### 10.4 ";
const CARD_HEADING_OPENER = "### 10.7 ";
const PAYLOAD_HEADING_OPENER = "### 10.2 ";
const QUOTE = "`";
const RENDER_VERB = "render";
const COMMIT_VERB = "commit";
/** Who may draw besides the frame: a render, and an init standing the view up at the start. */
const RENDER_CALLERS = [RENDER_VERB, "init"];
/** Who may commit besides the payload: a commit, and a replay into a session it made. */
const COMMIT_CALLERS = [COMMIT_VERB, "replay"];
const METHOD_NODES = ["Property", "MethodDefinition"];
const FUNCTION_VALUES = ["FunctionExpression", "ArrowFunctionExpression"];
/** Past the depth of any parse here, so the climb to a caller carries a stated bound. */
const DEPTH_MAXIMUM = 512;
const ENTRIES = readEventEntries(Deno.readTextFileSync(DESIGN_PATH));

Deno.test("the entries are the first name in code of §10.4's, §10.7's and §10.2's headings", () => {
    const design = [
        "### 10.2 The game's stack: `onPayload`, called inside `updateData`",
        "### 10.3 A gesture: `onIntent`",
        "### 10.4 The frame: `onFrame`, every step under `errors.attempt`",
        "### 10.7 The card: `onHover`, in the root listener",
    ].join("\n");
    const entries = { frame: "onFrame", card: "onHover", payload: "onPayload" };
    assertEquals(readEventEntries(design), entries, "P2");
});

function readEventEntries(design: string): EventEntries {
    const lines = design.split("\n");
    const frame = lines.find((line) => line.startsWith(FRAME_HEADING_OPENER));
    const card = lines.find((line) => line.startsWith(CARD_HEADING_OPENER));
    const payload = lines.find((line) => line.startsWith(PAYLOAD_HEADING_OPENER));
    assert(frame !== undefined, "the design names the frame's entry in a heading");
    assert(card !== undefined, "and the card's");
    assert(payload !== undefined, "and the payload's");
    return {
        frame: readFirstCodeSpan(frame),
        card: readFirstCodeSpan(card),
        payload: readFirstCodeSpan(payload),
    };
}

function readFirstCodeSpan(heading: string): string {
    const opened = heading.indexOf(QUOTE);
    const closed = heading.indexOf(QUOTE, opened + QUOTE.length);
    assert(opened !== -1, `${heading} names its entry in code`);
    assert(closed > opened + QUOTE.length, "and the name is not empty");
    return heading.slice(opened + QUOTE.length, closed);
}

Deno.test("a render or a commit off its event's path is flagged, and one on it is not", () => {
    const sample = composeSample([
        "function presentRows(rows) { renderRows(rows); }",
        "function onIntent(rows) { renderRows(rows); }",
        "function executeIntent(session) { commitPayload(session); }",
        "function renderPanel(rows) { renderRows(rows); }",
        "function initView(rows) { renderRows(rows); }",
        "function onFrame(rows) { schedule(() => renderRows(rows)); }",
        "function initCard(rows) {",
        "    return { onHover(key) { renderRows(key); } };",
        "}",
        "function replayPayloads(session) { commitPayload(session); }",
        "function initListener(session) {",
        "    return {",
        "        onPayload(payload) {",
        "            guard(() => commitPayload(session));",
        "        },",
        "    };",
        "}",
        "function renderRows(rows) { return rows; }",
        "function commitPayload(session) { return session; }",
    ]);
    assertEquals(
        lookupEventBreaches([sample], { frame: "onFrame", card: "onHover", payload: "onPayload" }),
        [
            "sample.ts:1 presentRows renders, through renderRows",
            "sample.ts:2 onIntent renders, through renderRows",
            "sample.ts:3 executeIntent commits, through commitPayload",
        ],
        "P2: the frame, the card, the payload's method, an init, a render and a replay are not",
    );
});

/** Every call to a render or a commit from a caller that is not on its event's path. */
function lookupEventBreaches(files: readonly SourceFile[], entries: EventEntries): string[] {
    const found: string[] = [];
    for (const file of files) {
        const known = indexCallableNames(file);
        for (const call of readAstNodes(file, ["CallExpression"])) {
            const callee = known.get(call.callee?.name ?? "");
            if (callee === undefined) continue;
            const calleeName = callee.slice(callee.indexOf(NAME_MARK) + NAME_MARK.length);
            const calleeVerb = readVerb(calleeName);
            if (calleeVerb !== RENDER_VERB) {
                if (calleeVerb !== COMMIT_VERB) continue;
            }
            const caller = lookupCallerName(call);
            if (caller === null) continue;
            const place = `${formatNodePlace(file, call)} ${caller}`;
            if (calleeVerb === RENDER_VERB) {
                if (!isOnPath(caller, RENDER_CALLERS, [entries.frame, entries.card])) {
                    found.push(`${place} renders, through ${calleeName}`);
                }
            } else if (!isOnPath(caller, COMMIT_CALLERS, [entries.payload])) {
                found.push(`${place} commits, through ${calleeName}`);
            }
        }
    }
    return found;
}

/** The function a call stands in: a declared one, or an object's method, named by its key. */
function lookupCallerName(call: AstNode): string | null {
    let at = call.parent ?? null;
    for (let depth = 0; at !== null; depth += 1) {
        assert(depth < DEPTH_MAXIMUM, "a parse stays inside the depth a climb states");
        const declared = readDeclaredFunctionName(at);
        if (declared !== null) return declared;
        const method = readMethodName(at);
        if (method !== null) return method;
        at = at.parent ?? null;
    }
    return null;
}

function readMethodName(node: AstNode): string | null {
    if (!METHOD_NODES.includes(node.type)) return null;
    const value = (node as unknown as { value?: AstNode }).value;
    if (value === undefined) return null;
    if (!FUNCTION_VALUES.includes(value.type)) return null;
    return node.key?.name ?? null;
}

function isOnPath(caller: string, verbs: readonly string[], entries: readonly string[]): boolean {
    if (entries.includes(caller)) return true;
    return verbs.includes(readVerb(caller));
}

Deno.test("no render and no commit of the program stands off its event's path", () => {
    const files = readSourceFiles(CHECKED_DIRECTORIES);
    assert(files.length > 0, "an empty tree is a reader that stopped finding files, not a pass");
    assertEquals(lookupEventBreaches(files, ENTRIES), [], "P2");
});
