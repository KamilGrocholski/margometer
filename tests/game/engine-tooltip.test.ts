/**
 * The one thing this add-on puts outside itself, and every shape that takes none of it.
 *
 * What is checked is the refusals, because the success is one call. A client that renamed the
 * method, a fighter the page has not drawn, a jQuery object that throws — each must cost the line
 * and never the fight, because this runs inside the engine's own call stack.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { writeLinesToTooltips } from "@/src/game/engine-tooltip.ts";

interface Landed {
    name: string;
    content: string;
}

/** A warrior as the client holds one: an id, a name, and its own jQuery object under `$`. */
function composeWarrior(id: number, name: string, landed: Landed[], over: {
    doesThrowOnFind?: boolean;
    hasAppend?: boolean;
    hasElement?: boolean;
} = {}) {
    const hasAppend = over.hasAppend ?? true;
    const element = {
        find: () => {
            if (over.doesThrowOnFind === true) throw new TypeError("a page being torn down");
            if (!hasAppend) return {};
            return { concatTip: (content: string) => landed.push({ name, content }) };
        },
    };
    if (over.hasElement === false) return { id, name };
    return { id, name, $: element };
}

function composePage(warriors: unknown[]) {
    const warriorsList: Record<string, unknown> = {};
    for (const [at, warrior] of warriors.entries()) warriorsList[`${at}`] = warrior;
    return { Engine: { battle: { warriorsList } } };
}

Deno.test("a line lands on the fighter it was composed for, and on nobody else", () => {
    const landed: Landed[] = [];
    const page = composePage([
        composeWarrior(11, "Gracz 1", landed),
        composeWarrior(21, "Renegat 1", landed),
    ]);
    const writing = writeLinesToTooltips(page, new Map([[11, "MargoMeter · Zatrucie 3 tury"]]));
    assertEquals(writing, { written: 1, asked: 1 }, "one line asked for, one landed");
    assertEquals(
        landed,
        [{ name: "Gracz 1", content: "MargoMeter · Zatrucie 3 tury" }],
        "and the fighter it was not composed for got nothing",
    );
});

/**
 * ⚠️ The failure this file is guarded for. A client that renames the method takes no line and
 * **throws nothing**, so what is held is the count — a payload that reached nobody says so.
 */
Deno.test("a client with no way to add to a tooltip takes no line, and says so", () => {
    const landed: Landed[] = [];
    const page = composePage([composeWarrior(11, "Gracz 1", landed, { hasAppend: false })]);
    assertEquals(
        writeLinesToTooltips(page, new Map([[11, "cokolwiek"]])),
        { written: 0, asked: 1 },
        "asked for one and landed none",
    );
    assertEquals(landed, [], "and nothing was written anywhere");
});

/**
 * ⚠️ **Why the method is checked rather than left to throw.** A throw would be caught at this
 * file's own boundary and answer the same count — which is why removing the check lights no other
 * test — but it would **end the walk**, and every fighter after the one that could not take a line
 * would silently lose theirs. The branch is what keeps one odd fighter from costing the rest.
 */
Deno.test("a fighter with no way to take a line costs their own line and nobody else's", () => {
    const landed: Landed[] = [];
    const page = composePage([
        composeWarrior(11, "Gracz 1", landed, { hasAppend: false }),
        composeWarrior(21, "Renegat 1", landed),
        composeWarrior(31, "Renegat 2", landed),
    ]);
    const writing = writeLinesToTooltips(page, new Map([[11, "a"], [21, "b"], [31, "c"]]));
    assertStrictEquals(writing.written, 2, "the two that could take one did");
    assertEquals(
        landed.map((one) => one.name),
        ["Renegat 1", "Renegat 2"],
        "and the walk went on past the one that could not",
    );
});

Deno.test("a fighter the page has not drawn is stepped over, not thrown on", () => {
    const landed: Landed[] = [];
    const page = composePage([
        composeWarrior(11, "Gracz 1", landed, { hasElement: false }),
        composeWarrior(21, "Renegat 1", landed),
    ]);
    const writing = writeLinesToTooltips(page, new Map([[11, "a"], [21, "b"]]));
    assertStrictEquals(writing.written, 1, "the one that is drawn takes its line");
    assertEquals(landed.map((one) => one.name), ["Renegat 1"], "and the other costs nothing");
});

Deno.test("a call of theirs that throws costs the lines and never the fight", () => {
    const landed: Landed[] = [];
    const page = composePage([composeWarrior(11, "Gracz 1", landed, { doesThrowOnFind: true })]);
    assertEquals(
        writeLinesToTooltips(page, new Map([[11, "cokolwiek"]])),
        { written: 0, asked: 1 },
        "the count is the mark, and the throw did not leave this file",
    );
});

Deno.test("a page with no fight on it takes nothing, which is not a failure", () => {
    assertEquals(writeLinesToTooltips({}, new Map([[11, "a"]])), { written: 0, asked: 1 });
    assertEquals(writeLinesToTooltips(null, new Map([[11, "a"]])), { written: 0, asked: 1 });
});

/** **W5: zero is a boundary.** Nothing asked for is nothing written, and it is not an absence. */
Deno.test("no line asked for is no line written, and the counts say both", () => {
    const landed: Landed[] = [];
    const page = composePage([composeWarrior(11, "Gracz 1", landed)]);
    assertEquals(writeLinesToTooltips(page, new Map()), { written: 0, asked: 0 }, "asked nothing");
    assert(landed.length === 0, "and wrote nothing");
});
