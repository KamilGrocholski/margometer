/**
 * **E14 read as a path.** `tests/source-graph.ts` walks the call graph from the add-on standing up
 * and from every `catch` body, following only calls no `try` stands over; this holds that nothing
 * it reaches can throw, and that every method it had to step over is one somebody has judged.
 */

import { assert, assertEquals, assertStrictEquals, assertThrows } from "@std/assert";
import {
    composeCallGraph,
    ENTRY,
    getCalledMethods,
    getCalledNames,
    getCrossings,
    getFunctionBodies,
    getGuardedLines,
    getImportedNames,
    getOwnLines,
    getUnguardedReach,
} from "@/tests/source-graph.ts";
import { getSourcePaths } from "@/tests/source-paths.ts";
import { FUNCTION_NODES, readAstNodes } from "@/tests/source-parse.ts";

Deno.test("a `try` covers what stands inside it, and a `finally` covers nothing", () => {
    const caught = ["function f() {", "    try {", "        a();", "    } catch {", "    }", "}"];
    assertEquals(getGuardedLines(caught), [false, false, true, false, false, false], "a catch");
    const swept = ["function f() {", "    try {", "        a();", "    } finally {", "    }", "}"];
    assertEquals(getGuardedLines(swept), [false, false, false, false, false, false], "a finally");
});

Deno.test("a call is a name before a bracket, and a method is nobody's to resolve", () => {
    assertEquals(getCalledNames("    return compose(one);"), ["compose"], "a plain call");
    assertEquals(getCalledNames("    if (held.read(key)) return;"), [], "a method, and a keyword");
    assertEquals(
        getCalledNames("    return one(two(three));"),
        ["one", "two"],
        "and a nested pair",
    );
});

/**
 * ⚠️ **A signature `deno fmt` wrapped closes on `): void {`, which is how a closure opens too.**
 * Read as one, a third of the bundle's functions — 211 of 674, measured 2026-09-24 — have no line
 * of their own: nothing they call is walked, nothing they assert is seen, and the walk stays green
 * over a `catch` that asserts on the browser's clock.
 */
Deno.test("a wrapped signature opens its body, and a closure in it is still not its own", () => {
    const wrapped = [
        "function f(",
        "    one: number,",
        "): void {",
        "    mine();",
        "    hand((event) => {",
        "        theirs();",
        "    });",
        "}",
    ];
    assertEquals(
        getOwnLines(wrapped),
        [true, true, true, true, true, false, true, true],
        "the body is the function's, and the listener's line is whoever calls it",
    );
    const single = ["function f(one: number): void {", "    mine();", "}"];
    assertEquals(getOwnLines(single), [true, true, true], "and one line is read as it was");
    const parameters = Array.from({ length: 14 }, (_, at) => `    one${at}: number,`);
    const long = ["function f(", ...parameters, "): void {", "    mine();", "}"].join("\n");
    assertThrows(() => getFunctionBodies(long), Error, "inside the lines read");
});

Deno.test("an import binds the name it is written under, however it is wrapped", () => {
    const wrapped = 'import {\n    one,\n    two as three,\n    type Four,\n} from "@/src/a.ts";';
    const found = getImportedNames(wrapped);
    assertStrictEquals(found.get("one"), "src/a.ts", "a plain name");
    assertStrictEquals(found.get("three"), "src/a.ts", "the name a renaming binds");
    assertStrictEquals(found.get("four"), undefined, "and a type by the name it is written under");
    assertStrictEquals(found.get("Four"), "src/a.ts", "which is the one after the keyword");
    assertStrictEquals(getImportedNames('import { x } from "@std/assert";').size, 0, "ours only");
});

/**
 * The walk itself. A path this finds is a frame the browser can reach with nothing standing over
 * it, and something on that frame that can stop the add-on — **E14**, **ADR 0051**.
 */
Deno.test("nothing the add-on reaches while standing up can stop it", () => {
    const graph = composeCallGraph();
    assert(graph.has(ENTRY), "the entry this walks from is a function that exists");
    const reached = [...getUnguardedReach(graph)];
    // A walk that stopped following edges reports the same empty list as a walk that found
    // nothing to report, and the two read identically green.
    assert(reached.length > 1, "the walk left the entry it started on");
    const throwing: string[] = [];
    for (const name of reached) {
        if (graph.get(name)?.doesThrow === true) throwing.push(name);
    }
    assertEquals(throwing.sort(), [], "E14: a throw on a frame the browser reaches unguarded");
});

/**
 * ⚠️ **What object a method stands on is not this reader's to say**, and nor is what a parameter
 * was handed, so a call through either draws no edge and the walk would step over it in silence.
 * Every one standing on a frame the walk reaches unguarded is written down instead, and the
 * register is read both ways: a crossing that is gone stops being excused, and a new one fails
 * until somebody has looked at it.
 *
 * Four kinds, and every row below is one of them. **The runtime's own** — `Array.isArray`,
 * `Number.isFinite`, `String.slice`, `Map.get`, `Math.ceil`, a `new Map` — which are not this
 * program's to guard. **The page's or the document's**, each of which `isUserscriptWindow` proved
 * was there before anything called it: `setInterval`, `clearInterval`, `console.error`,
 * `Date.now`, and the `createElement`, `append`, `attachShadow`, `setAttribute` and
 * `addEventListener` that build the panel on elements it has just made. A document refusing those
 * is a panel that cannot be built, which has nothing to degrade to: the copy stands down and says
 * so, **E5**'s first row. **A closure handed on and read as called here**: the walk takes an
 * expression arrow's call for a call on the frame that writes it, which is the safe way to be
 * wrong — `write:` reaches `writeTextToFile` and every crossing in it while the file is written
 * under `writeRecording`'s `try`, `reportGuarded`'s arrow reaches the two reports it guards,
 * `composeGameReader`'s handlers reach `report` from inside the wrap's own guard, and
 * `getViewport` reaches the entry's `readViewport`. And **ours, answering for itself**: both
 * stores turn a refusal into an answer (**E5**), `composeShelfStore` reaches a
 * `composeStoreForChoice` that catches the property read as well as the call, `report` is the
 * console inside the keeper's own `try`, and `defects.add` asserts nothing (**A11**) — which is
 * what lets every `catch` body below reach it without throwing out of the boundary it stands at,
 * and the closure the shelf's memo hands a fight that will not replay to. `handlePlace` and
 * `handleGesture` are the drag's own failures handed to that same keeper, and so is every
 * `handleFailure` a guard is handed — the file's release on the browser's clock included, which is
 * why that one is the keeper's and not the console's. `keepOnly`, `getPosition` and `getBar` read
 * what their own closures hold. The catch in `writeCarriedToTooltips` guards the one line this
 * add-on writes outside itself (**ADR 0105**): it stands in somebody else's program, so a throw of
 * theirs must cost the line and never the payload.
 */
const CROSSINGS_WITH_A_REASON = [
    "Date ← src/userscript-entry.ts#readClockFromPage",
    "add ← src/userscript-entry.ts#addCallToRecording!catch0",
    "add ← src/userscript-entry.ts#addPayloadOrNothing!catch0",
    "add ← src/userscript-entry.ts#composeShelfKeeper",
    "add ← src/userscript-entry.ts#drawFight!catch0",
    "add ← src/userscript-entry.ts#drawStanding!catch0",
    "add ← src/userscript-entry.ts#drawStanding!catch1",
    "add ← src/userscript-entry.ts#getReadingOrNothing!catch0",
    "add ← src/userscript-entry.ts#keepFightOrNothing!catch0",
    "add ← src/userscript-entry.ts#readSnapshotOrNothing!catch0",
    "add ← src/userscript-entry.ts#readPlaceOrNothing!catch0",
    "add ← src/userscript-entry.ts#writeCarriedToTooltips!catch0",
    "read ← src/userscript-entry.ts#isFoldedInStore",
    "add ← src/userscript-entry.ts#readShelfOrNothing",
    "add ← src/userscript-entry.ts#readShelfOrNothing!catch0",
    "add ← src/userscript-entry.ts#writeRecording!catch0",
    "add ← src/userscript-entry.ts#drawFightUnread!catch0",
    "add ← src/userscript-entry.ts#startMargoMeter",
    "add ← src/userscript-entry.ts#startMargoMeter!catch0",
    "clearInterval ← src/userscript-entry.ts#startFromUserscriptWindow",
    "composeShelfStore ← src/userscript-entry.ts#composeShelfKeeper",
    "createElement ← src/ui/panel-element.ts#composeElement",
    "error ← src/userscript-entry.ts#startFromUserscriptWindow",
    "handlePlace ← src/ui/panel-drag.ts#setPanelDragOpening!catch0",
    "isArray ← libs/unknown-reading.ts#isRecord",
    "isFinite ← libs/unknown-reading.ts#getNumberFromUnknown",
    "isFinite ← src/userscript-entry.ts#readClockFromPage",
    "now ← src/userscript-entry.ts#startFromUserscriptWindow",
    "read ← src/userscript-entry.ts#composeShelfKeeper",
    "report ← src/userscript-entry.ts#startMargoMeter",
    "setInterval ← src/userscript-entry.ts#startFromUserscriptWindow",
    "slice ← src/userscript-entry.ts#composeShelfKeeper",
    "Blob ← src/userscript-entry.ts#writeTextToFile",
    "add ← src/userscript-entry.ts#readPlaceOrNothing",
    "addEventListener ← src/ui/panel-listener.ts#setGuardedListener",
    "append ← src/ui/panel-element.ts#composePanelFrame",
    "append ← src/ui/panel-element.ts#composePanelShadow",
    "append ← src/ui/panel-element.ts#composeStandingBar",
    "append ← src/ui/panel-element.ts#composeStandingWindow",
    "append ← src/ui/panel-element.ts#setPanelRootChildren",
    "append ← src/userscript-entry.ts#writeTextToFile",
    "attachShadow ← src/ui/panel-element.ts#composePanelShadow",
    "click ← src/userscript-entry.ts#writeTextToFile",
    "createElement ← src/ui/panel-element.ts#composePanelShadow",
    "createElement ← src/userscript-entry.ts#writeTextToFile",
    "createObjectURL ← src/userscript-entry.ts#writeTextToFile",
    "every ← src/game/engine-attachment.ts#attachToGame",
    "get ← src/ui/panel-element.ts#composeTipLookup",
    "getPosition ← src/ui/panel-element.ts#composePanelHost",
    "getViewport ← src/ui/panel-element.ts#composeTipBeside",
    "handleFirstFailure ← src/game/engine-attachment.ts#handleLookFailure",
    "handleGesture ← src/ui/panel-drag.ts#setPanelDrag",
    "handlePlace ← src/ui/panel-drag.ts#setPanelDragOpening",
    "handleSearchAbandoned ← src/game/engine-attachment.ts#handleLookFailure",
    "keepOnly ← src/userscript-entry.ts#setShelfWritten",
    "readViewport ← src/userscript-entry.ts#composePanelPlacement",
    "remove ← src/userscript-entry.ts#writeTextToFile",
    "report ← src/userscript-entry.ts#composeGameReader",
    "setAttribute ← src/ui/panel-drag.ts#setGripMark",
    "setAttribute ← src/ui/panel-element.ts#composeBarControl",
    "setAttribute ← src/ui/panel-element.ts#composePanelShadow",
    "setAttribute ← src/ui/panel-element.ts#composeStandingBar",
    "setTimeout ← src/userscript-entry.ts#writeTextToFile",
    "Map ← src/core/carried-status.ts#composeCarriedStatusWalk",
    "Map ← src/core/legendary-standing.ts#composeLegendaryWalk",
    "Set ← src/core/legendary-standing.ts#composeLegendaryWalk",
    "Set ← src/game/fight-capture.ts#composeEmptyCapture",
    "getBar ← src/ui/panel-drag.ts#setPanelDrag",
    "handleFailure ← src/ui/panel-drag.ts#setPointerHeld",
    "handleFailure ← src/ui/panel-drag.ts#setPointerHeld!catch0",
    "handleFailure ← src/ui/panel-element.ts#composeRegion!catch0",
    "handleFailure ← src/ui/panel-element.ts#composeRegionInPlace!catch0",
    "handleFailure ← src/ui/panel-element.ts#composeTipInPlace",
    "handleFailure ← src/ui/panel-element.ts#composeTipInPlace!catch0",
    "handleFailure ← src/ui/panel-element.ts#setDragOrNothing",
    "handleFailure ← src/ui/panel-listener.ts#setGuardedListener!catch0",
    "handleFailure ← src/userscript-entry.ts#composeKeptFiguresOrNothing!catch0",
    "handleFailure ← src/userscript-entry.ts#writeTextToFile!catch0",
    "append ← src/ui/panel-tip.ts#composeTipElement",
    "append ← src/ui/panel-tip.ts#composeTipGroupElement",
    "append ← src/ui/panel-tip.ts#composeTipLineElement",
    "append ← src/ui/panel-tip.ts#composeTipNoteElement",
    "ceil ← src/ui/panel-tip.ts#getTipLinesForCharacters",
    "createElement ← src/ui/panel-tip.ts#composeTipCaveatElement",
    "createElement ← src/ui/panel-tip.ts#composeTipElement",
    "createElement ← src/ui/panel-tip.ts#composeTipGroupElement",
    "createElement ← src/ui/panel-tip.ts#composeTipHeadingElement",
    "createElement ← src/ui/panel-tip.ts#composeTipLineElement",
    "createElement ← src/ui/panel-tip.ts#composeTipNoteElement",
];

/**
 * The blind spot, named row by row rather than left silent. A row here is a person's judgement and
 * not a machine's, which is what **V1**'s `by-reading` marker is for elsewhere — what the machine
 * holds is that the list is neither short nor long.
 *
 * ⚠️ **Compared whole rather than by containment.** `getCrossings` answers a sorted set, so the
 * two lists are equal or they are not. A row written twice satisfies both halves of a containment
 * check while excusing one crossing, and nothing about that reads as wrong.
 */
Deno.test("every method the walk steps over is one somebody has looked at", () => {
    const crossings = getCrossings(composeCallGraph());
    const excused = [...CROSSINGS_WITH_A_REASON].sort();
    assert(crossings.length > 0, "the walk reaches crossings to judge");
    assertEquals(excused.length, new Set(excused).size, "a crossing is excused once");
    assertEquals(crossings, excused, "a crossing nobody judged, or a row the walk no longer makes");
});

Deno.test("a spread is not a method, and a method is not a plain call", () => {
    assertEquals(
        getCalledNames("    ...composeGameReports(one),"),
        ["composeGameReports"],
        "a spread",
    );
    assertEquals(
        getCalledMethods("    ...composeGameReports(one),"),
        [],
        "which is nobody's method",
    );
    assertEquals(getCalledMethods("    store.read(key);"), ["read"], "while a method is one");
    assertEquals(getCalledNames("    store.read(key);"), [], "and is not read as a plain call");
});

/** What the bundle is built from, which is what a browser evaluates before any entry is called. */
const BUNDLED_ROOTS = ["libs/", "src/"];
/** The one call a bundled file makes as it loads: the entry, on the window the browser hands it. */
const CALLS_WHILE_LOADING = ["src/userscript-boot.ts: startFromWindow(window)"];

/** Every call a file makes outside any function, which runs when the module is evaluated. */
function readCallsWhileLoading(path: string, text: string): string[] {
    const functions = readAstNodes(path, text, FUNCTION_NODES);
    const found: string[] = [];
    for (const call of readAstNodes(path, text, ["CallExpression", "NewExpression"])) {
        const [from, to] = call.range;
        if (functions.some((one) => one.range[0] <= from && to <= one.range[1])) continue;
        found.push(`${path}: ${text.slice(from, to)}`);
    }
    return found;
}

/**
 * ⚠️ **A module's own initialiser runs before any boundary this add-on has**, so the walk above,
 * which starts at the entry, never sees it. A table composed there that asserts is a raw throw in
 * the game's console with no copy standing, and the four that stood there were each moved under
 * the boundary that uses them. Read by a parser rather than by lines, because what is outside
 * every function is exactly what a line reader cannot tell from what is inside one.
 */
Deno.test("nothing a bundled file calls while it loads can stop it, bar the entry", () => {
    assertEquals(
        readCallsWhileLoading("sample.ts", "const held = compose(1);\n"),
        ["sample.ts: compose(1)"],
        "a call at the margin is found",
    );
    assertEquals(
        readCallsWhileLoading("sample.ts", "function f() {\n    g();\n}\nconst h = () => g();\n"),
        [],
        "and one inside a function, however it is written, is not",
    );
    const found: string[] = [];
    for (const path of getSourcePaths()) {
        if (!BUNDLED_ROOTS.some((root) => path.startsWith(root))) continue;
        found.push(...readCallsWhileLoading(path, Deno.readTextFileSync(path)));
    }
    assertEquals(found, CALLS_WHILE_LOADING, "a call the bundle makes before any boundary stands");
});
