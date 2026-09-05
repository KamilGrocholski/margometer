/**
 * **E14 read as a path.** `tests/source-graph.ts` walks the call graph from the add-on standing up
 * and from every `catch` body, following only calls no `try` stands over; this holds that nothing
 * it reaches can throw, and that every method it had to step over is one somebody has judged.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import {
    composeCallGraph,
    ENTRY,
    getCalledMethods,
    getCalledNames,
    getCrossings,
    getGuardedLines,
    getImportedNames,
    getUnguardedReach,
} from "@/tests/source-graph.ts";

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
    const throwing: string[] = [];
    for (const name of getUnguardedReach(graph)) {
        if (graph.get(name)?.throws === true) throwing.push(name);
    }
    assertEquals(throwing.sort(), [], "E14: a throw on a frame the browser reaches unguarded");
});

/**
 * ⚠️ **What object a method stands on is not this reader's to say**, so a call through one draws
 * no edge and the walk would step over it in silence. Every one standing on a frame the walk
 * reaches unguarded is written down instead, and the register is read both ways: a crossing that
 * is gone stops being excused, and a new one fails until somebody has looked at it.
 *
 * Three kinds, and every row below is one of them. **The runtime's own** — `Array.isArray`,
 * `Number.isFinite`, `String.slice` — which are not this program's to guard. **The page's or the
 * document's**, each of which `isUserscriptWindow` proved was there before anything called it:
 * `setInterval`, `clearInterval`, `console.error`, `Date.now`, `createElement`. And **ours,
 * answering for itself**: both stores turn a refusal into an answer (**E5**), `composeShelfStore`
 * reaches a `composeStoreForChoice` that catches the property read as well as the call, `report`
 * is the console inside the keeper's own `try`, `defects.add` asserts nothing (**A11**) — which is
 * what lets six `catch` bodies reach it without throwing out of the boundary they stand at — and
 * `handleFirstFailure` is the reader's own, counted by the wrap rather than let into the game.
 */
const CROSSINGS_WITH_A_REASON = [
    "Date ← src/userscript-entry.ts#readClockFromPage",
    "add ← src/userscript-entry.ts#drawFight!catch0",
    "add ← src/userscript-entry.ts#readPlaceOrNothing!catch0",
    "add ← src/userscript-entry.ts#readShelfOrNothing",
    "add ← src/userscript-entry.ts#readShelfOrNothing!catch0",
    "add ← src/userscript-entry.ts#saveRecording!catch0",
    "add ← src/userscript-entry.ts#showFightUnread!catch0",
    "add ← src/userscript-entry.ts#startMargoMeter",
    "add ← src/userscript-entry.ts#startMargoMeter!catch0",
    "clearInterval ← src/userscript-entry.ts#startFromUserscriptWindow",
    "composeShelfStore ← src/userscript-entry.ts#composeShelfKeeper",
    "createElement ← src/ui/panel-element.ts#composeElement",
    "error ← src/userscript-entry.ts#startFromUserscriptWindow",
    "handleFirstFailure ← src/game/engine-battle-wrap.ts#wrapEngineBattle.countFailure",
    "isArray ← libs/unknown-reading.ts#isRecord",
    "isFinite ← libs/unknown-reading.ts#getNumberFromUnknown",
    "isFinite ← src/userscript-entry.ts#readClockFromPage",
    "now ← src/userscript-entry.ts#startFromUserscriptWindow",
    "read ← src/userscript-entry.ts#composeShelfKeeper",
    "read ← src/userscript-entry.ts#startMargoMeter",
    "report ← src/userscript-entry.ts#composeGameReports",
    "report ← src/userscript-entry.ts#startMargoMeter",
    "setInterval ← src/userscript-entry.ts#startFromUserscriptWindow",
    "slice ← src/userscript-entry.ts#composeShelfKeeper",
];

/**
 * The blind spot, named row by row rather than left silent. A row here is a person's judgement and
 * not a machine's, which is what **V1**'s `by-reading` marker is for elsewhere — what the machine
 * holds is that the list is neither short nor long.
 */
Deno.test("every method the walk steps over is one somebody has looked at", () => {
    const crossings = getCrossings(composeCallGraph());
    const excused = [...CROSSINGS_WITH_A_REASON].sort();
    assertEquals(
        crossings.filter((one) => !excused.includes(one)),
        [],
        "a method on an unguarded frame that nobody has judged",
    );
    assertEquals(
        excused.filter((one) => !crossings.includes(one)),
        [],
        "and a row excusing a crossing the walk no longer makes",
    );
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
