/**
 * What the panel says about itself: one line per kind, a tally rather than a repeat, and a console
 * that hears each kind once (**E11**).
 *
 * The sentences are read as words a player reads, never against the module that writes them —
 * `tests/AGENTS.md` says why that is the only reading worth taking here.
 */

import { assert, assertEquals, assertStrictEquals, assertStringIncludes } from "@std/assert";
import { composeDefectKeeper } from "@/src/ui/panel-defect.ts";
import { DEFECT_KINDS, REGION_WORDS } from "@/src/ui/panel-words.ts";

/** Past the keeper's own maximum, so the bound is met rather than approached. */
const KINDS_TRIED = 200;
const TIMES_REPEATED = 3;

function composeCountingKeeper(): {
    heard: unknown[];
    keeper: ReturnType<typeof composeDefectKeeper>;
} {
    const heard: unknown[] = [];
    return { heard, keeper: composeDefectKeeper((failure) => heard.push(failure)) };
}

Deno.test("a panel that has done everything it was asked says nothing", () => {
    const { keeper, heard } = composeCountingKeeper();
    assertEquals(keeper.getSaid(), [], "an empty tally draws no block");
    assertEquals(heard, [], "and reaches no console either");
});

Deno.test("one failure is one sentence, and it carries no tally", () => {
    const { keeper } = composeCountingKeeper();
    keeper.add("region", "list", new RangeError("nothing a reader is shown"));
    const said = keeper.getSaid();
    assertStrictEquals(said.length, 1, "one kind, one line");
    assertStringIncludes(said[0] ?? "", REGION_WORDS.list, "which names the part that is missing");
    assert(!(said[0] ?? "").includes("("), "and states no count, because once is not a tally");
});

Deno.test("the same failure again is counted, never said twice", () => {
    const { keeper, heard } = composeCountingKeeper();
    for (let time = 0; time < TIMES_REPEATED; time += 1) {
        keeper.add("region", "list", new RangeError("the same one every redraw"));
    }
    const said = keeper.getSaid();
    assertStrictEquals(said.length, 1, "a redraw does not lengthen the block");
    assertStringIncludes(said[0] ?? "", `${TIMES_REPEATED}`, "the tally says how many times");
    assertStrictEquals(heard.length, 1, "E11: the console hears a kind once, never per render");
});

Deno.test("two regions failing are two lines, and each names its own", () => {
    const { keeper, heard } = composeCountingKeeper();
    keeper.add("region", "list", new RangeError("one"));
    keeper.add("region", "header", new RangeError("another"));
    const said = keeper.getSaid();
    assertStrictEquals(said.length, 2, "a region is a defect of its own");
    assertStringIncludes(said[0] ?? "", REGION_WORDS.list, "the first names the list");
    assertStringIncludes(said[1] ?? "", REGION_WORDS.header, "the second names the header");
    assertStrictEquals(heard.length, 2, "and each reached the console once");
});

Deno.test("every kind there is says something, and no two of them say the same", () => {
    const { keeper } = composeCountingKeeper();
    for (const kind of DEFECT_KINDS) keeper.add(kind, null, new RangeError(kind));
    const said = keeper.getSaid();
    assertStrictEquals(said.length, DEFECT_KINDS.length, "one line per kind");
    assertStrictEquals(new Set(said).size, said.length, "and no two kinds worded alike");
    for (const one of said) {
        assert(one.length > 0, "a defect that is drawn says something");
        assert(one.endsWith("."), "and says it as a sentence");
    }
});

Deno.test("a tally that will not stop growing stays inside a stated bound", () => {
    const { keeper, heard } = composeCountingKeeper();
    for (let time = 0; time < KINDS_TRIED; time += 1) {
        keeper.add("region", "list", new RangeError(`${time}`));
    }
    assertStrictEquals(keeper.getSaid().length, 1, "one kind is still one line");
    assertStrictEquals(heard.length, 1, "however many times it happened");
});

Deno.test("a console that throws costs the console line and not the defect", () => {
    const keeper = composeDefectKeeper(() => {
        throw new RangeError("a page being torn down under us");
    });
    keeper.add("reading", null, new RangeError("the fight would not compose"));
    assertStrictEquals(keeper.getSaid().length, 1, "the mark is the defect, not the report");
});
