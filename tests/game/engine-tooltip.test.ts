/**
 * The one thing this add-on puts outside itself, and every shape that takes none of it.
 *
 * What is checked is the refusals, because the success is one call. A client that renamed the
 * method, a fighter the page has not drawn, a jQuery object that throws — each must cost the line
 * and never the fight, because this runs inside the engine's own call stack.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import {
    composeTooltipWriter,
    MAXIMUM_ROWS_WRITTEN,
    type TooltipWriter,
} from "@/src/game/engine-tooltip.ts";
import { MAXIMUM_TOOLTIP_ROWS } from "@/src/ui/panel-words.ts";
import { MAXIMUM_COMBATANTS } from "@/src/core/combatant-roster.ts";

/** What the game composes for a fighter before anybody adds to it. */
const THEIRS = '<div class="nick">Gracz</div>';

/** One fighter's registry entry, and every call the writer made of it. */
interface Registry {
    text: string;
    appended: string[];
    replaced: string[];
    told: number;
}

/** A warrior as the client holds one: an id, a name, and its own jQuery object under `$`. */
function composeWarrior(id: number, name: string, registry: Registry, over: {
    doesThrowOnFind?: boolean;
    hasMethods?: boolean;
    hasElement?: boolean;
} = {}) {
    const targets = {
        getTipData: () => registry.text,
        tip: (content: string) => {
            registry.replaced.push(content);
            registry.text = content;
        },
        concatTip: (row: string) => {
            registry.appended.push(row);
            registry.text = `${registry.text}<br>${row}`;
        },
        trigger: () => {
            registry.told += 1;
        },
    };
    const element = {
        find: () => {
            if (over.doesThrowOnFind === true) throw new TypeError("a page being torn down");
            if (over.hasMethods === false) return { concatTip: targets.concatTip };
            return targets;
        },
    };
    if (over.hasElement === false) return { id, name };
    return { id, name, $: element };
}

function composeRegistry(text: string = THEIRS): Registry {
    return { text, appended: [], replaced: [], told: 0 };
}

function composePage(warriors: unknown[]) {
    const warriorsList: Record<string, unknown> = {};
    for (const [at, warrior] of warriors.entries()) warriorsList[`${at}`] = warrior;
    return { Engine: { battle: { warriorsList } } };
}

/** One fighter, a writer, and the page they stand on — what most of these tests start from. */
function composeOne(): { registry: Registry; page: unknown; writer: TooltipWriter } {
    const registry = composeRegistry();
    const page = composePage([composeWarrior(11, "Gracz 1", registry)]);
    return { registry, page, writer: composeTooltipWriter() };
}

/**
 * ⚠️ **One bound, two spellings, and only a guard keeps them level.** `game/` reaches into no
 * `ui/` module, so the writer states the maximum a second time — and a block composed up to the
 * composer's bound must be one the writer will still take, or the assertion at the crossing
 * fires on a fighter with a lot to say.
 */
Deno.test("the writer takes every row the composer is allowed to compose", () => {
    assert(
        MAXIMUM_ROWS_WRITTEN >= MAXIMUM_TOOLTIP_ROWS,
        `the writer stops at ${MAXIMUM_ROWS_WRITTEN} and the composer may hand it ` +
            `${MAXIMUM_TOOLTIP_ROWS}`,
    );
});

Deno.test("a block lands on the fighter it was composed for, and on nobody else", () => {
    const first = composeRegistry();
    const second = composeRegistry();
    const page = composePage([
        composeWarrior(11, "Gracz 1", first),
        composeWarrior(21, "Renegat 1", second),
    ]);
    const writing = composeTooltipWriter().write(page, new Map([[11, ["MargoMeter"]]]));
    assertEquals(writing, { written: 1, asked: 1 }, "one block asked for, one landed");
    assertEquals(first.text, `${THEIRS}<br>MargoMeter`, "under what the game composed");
    assertEquals(second.text, THEIRS, "and the fighter it was not composed for got nothing");
});

/**
 * ⚠️ **One call per row, and the client's own `<br>` is the break between them.** This is what
 * buys the block its shape without this add-on writing a tag — so a writer that joined the rows
 * itself would be writing markup, which is exactly what `SECURITY.md` says it does not do.
 */
Deno.test("every row goes over on a call of its own, and an open tooltip is told once", () => {
    const { registry, page, writer } = composeOne();
    const rows = ["MargoMeter", "Sprowokowany przez Gracz 2 · 1 z 3 tur", "Spowolnienie 3 tury"];
    writer.write(page, new Map([[11, rows]]));
    assertEquals(registry.appended, rows, "each row on its own call, in order");
    assertEquals(registry.replaced, [], "and nothing of theirs was replaced to get there");
    assertStrictEquals(registry.told, 1, "and the tooltip was told to draw again, once");
});

/**
 * ⚠️ **The failure this writer exists for.** It is handed every fighter on every payload, so a
 * block it could not find again would be a second block on every payload after.
 */
Deno.test("the same rows written again leave one block, and touch nothing", () => {
    const { registry, page, writer } = composeOne();
    const rows = new Map([[11, ["MargoMeter", "Tury wykonane 3"]]]);
    writer.write(page, rows);
    const once = registry.text;
    writer.write(page, rows);
    assertEquals(registry.text, once, "the registry says what it said after the first write");
    assertStrictEquals(registry.appended.length, 2, "no row went over a second time");
    assertStrictEquals(registry.told, 1, "and an unchanged tooltip is not told to draw again");
});

Deno.test("changed rows take the old block off before the new one goes on", () => {
    const { registry, page, writer } = composeOne();
    writer.write(page, new Map([[11, ["MargoMeter", "Tury wykonane 3"]]]));
    writer.write(page, new Map([[11, ["MargoMeter", "Tury wykonane 4"]]]));
    assertEquals(registry.replaced, [THEIRS], "their own string went back, less ours");
    assertEquals(
        registry.text,
        `${THEIRS}<br>MargoMeter<br>Tury wykonane 4`,
        "and one block stands on it, the new one",
    );
    assertStrictEquals(registry.told, 2, "told once for each block that went on");
});

/**
 * The game rebuilds a fighter's tooltip on updates this file cannot list — the restating one, and
 * the focus pass **ADR 0111** carries — and the block is simply gone from what it wrote.
 */
Deno.test("a tooltip the game rebuilt takes the block again, and only once", () => {
    const { registry, page, writer } = composeOne();
    const rows = new Map([[11, ["MargoMeter", "Tury wykonane 3"]]]);
    writer.write(page, rows);
    registry.text = THEIRS;
    writer.write(page, rows);
    assertEquals(registry.text, `${THEIRS}<br>MargoMeter<br>Tury wykonane 3`, "one block again");
    assertEquals(registry.replaced, [], "and nothing of theirs was cut to put it there");
});

/** Another add-on appends to the same registry, and what it wrote is not ours to take off. */
Deno.test("what somebody else appended after the block stays where it stood", () => {
    const { registry, page, writer } = composeOne();
    writer.write(page, new Map([[11, ["MargoMeter", "Tury wykonane 3"]]]));
    registry.text = `${registry.text}<br>somebody else`;
    writer.write(page, new Map([[11, ["MargoMeter", "Tury wykonane 4"]]]));
    assertEquals(
        registry.text,
        `${THEIRS}<br>somebody else<br>MargoMeter<br>Tury wykonane 4`,
        "theirs stands, and ours is the one block",
    );
});

/**
 * ⚠️ **A fighter with nothing to say keeps no block.** Handed an empty list, the writer takes its
 * old block off and puts nothing on — appending an empty block would cost a `<br>` of theirs.
 */
Deno.test("a fighter left with nothing to say is left with what the game composed", () => {
    const { registry, page, writer } = composeOne();
    writer.write(page, new Map([[11, ["MargoMeter", "Tury wykonane 3"]]]));
    const writing = writer.write(page, new Map([[11, []]]));
    assertEquals(writing, { written: 0, asked: 0 }, "nothing asked for, nothing standing");
    assertEquals(registry.text, THEIRS, "and the tooltip is the game's again");
    const fresh = composeOne();
    fresh.writer.write(fresh.page, new Map([[11, []]]));
    assertEquals(fresh.registry.replaced, [], "while one that never carried a block is untouched");
    assertStrictEquals(fresh.registry.told, 0, "and not told anything");
});

/**
 * ⚠️ The failure this file is guarded for. A client that renames a method takes no line and
 * **throws nothing**, so what is held is the count — a payload that reached nobody says so.
 */
Deno.test("a client with no way to add to a tooltip takes no line, and says so", () => {
    const registry = composeRegistry();
    const page = composePage([composeWarrior(11, "Gracz 1", registry, { hasMethods: false })]);
    assertEquals(
        composeTooltipWriter().write(page, new Map([[11, ["cokolwiek"]]])),
        { written: 0, asked: 1 },
        "asked for one and landed none",
    );
    assertEquals(registry.text, THEIRS, "and nothing was written anywhere");
});

/**
 * ⚠️ **Why the methods are checked rather than left to throw.** A throw would be caught at this
 * file's own boundary and answer the same count, but it would **end the walk**, and every fighter
 * after the one that could not take a line would silently lose theirs.
 */
Deno.test("a fighter with no way to take a line costs their own line and nobody else's", () => {
    const registries = [composeRegistry(), composeRegistry(), composeRegistry()];
    const page = composePage([
        composeWarrior(11, "Gracz 1", registries[0]!, { hasMethods: false }),
        composeWarrior(21, "Renegat 1", registries[1]!),
        composeWarrior(31, "Renegat 2", registries[2]!),
    ]);
    const writing = composeTooltipWriter().write(
        page,
        new Map([[11, ["a"]], [21, ["b"]], [31, ["c"]]]),
    );
    assertStrictEquals(writing.written, 2, "the two that could take one did");
    assertEquals(
        registries.map((one) => one.appended),
        [[], ["b"], ["c"]],
        "and the walk went on past the one that could not",
    );
});

Deno.test("a fighter the page has not drawn is stepped over, not thrown on", () => {
    const first = composeRegistry();
    const second = composeRegistry();
    const page = composePage([
        composeWarrior(11, "Gracz 1", first, { hasElement: false }),
        composeWarrior(21, "Renegat 1", second),
    ]);
    const writing = composeTooltipWriter().write(page, new Map([[11, ["a"]], [21, ["b"]]]));
    assertStrictEquals(writing.written, 1, "the one that is drawn takes its line");
    assertEquals(second.appended, ["b"], "and the other costs nothing");
});

Deno.test("a call of theirs that throws costs the lines and never the fight", () => {
    const registry = composeRegistry();
    const page = composePage([
        composeWarrior(11, "Gracz 1", registry, { doesThrowOnFind: true }),
    ]);
    assertEquals(
        composeTooltipWriter().write(page, new Map([[11, ["cokolwiek"]]])),
        { written: 0, asked: 1 },
        "the count is the mark, and the throw did not leave this file",
    );
});

Deno.test("a page with no fight on it takes nothing, which is not a failure", () => {
    const writer = composeTooltipWriter();
    assertEquals(writer.write({}, new Map([[11, ["a"]]])), { written: 0, asked: 1 });
    assertEquals(writer.write(null, new Map([[11, ["a"]]])), { written: 0, asked: 1 });
});

/**
 * An empty string is the client's word for deleting a tooltip. A registry holding our block and
 * nothing else has no string of theirs to go back to, so the block stays rather than the tooltip
 * going.
 */
Deno.test("a tooltip that is nothing but our block is never deleted to take it off", () => {
    const registry = composeRegistry("");
    const page = composePage([composeWarrior(11, "Gracz 1", registry)]);
    const writer = composeTooltipWriter();
    writer.write(page, new Map([[11, ["MargoMeter"]]]));
    writer.write(page, new Map([[11, ["MargoMeter", "Tury wykonane 1"]]]));
    assertEquals(registry.replaced, [], "their tooltip was never replaced with nothing");
});

/**
 * **S11.** The writer remembers a block per fighter, and a page goes on for fight after fight; a
 * fighter the page no longer draws is forgotten, or the memory grows with every fight played.
 */
Deno.test("the writer remembers one board's worth of fighters, however many fights go by", () => {
    const writer = composeTooltipWriter();
    for (let fight = 0; fight < 4; fight += 1) {
        const ids = Array.from({ length: MAXIMUM_COMBATANTS }, (_, at) => fight * 1000 + at);
        const page = composePage(
            ids.map((id) => composeWarrior(id, `Gracz ${id}`, composeRegistry())),
        );
        const writing = writer.write(page, new Map(ids.map((id) => [id, ["MargoMeter"]])));
        assertStrictEquals(writing.written, MAXIMUM_COMBATANTS, `fight ${fight} is written whole`);
    }
});

/** **W5: zero is a boundary.** Nothing asked for is nothing written, and it is not an absence. */
Deno.test("no block asked for is no block written, and the counts say both", () => {
    const { registry, page, writer } = composeOne();
    assertEquals(writer.write(page, new Map()), { written: 0, asked: 0 }, "asked nothing");
    assert(registry.appended.length === 0, "and wrote nothing");
    assertStrictEquals(registry.told, 0, "and told nothing");
});
