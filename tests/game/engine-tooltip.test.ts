/**
 * The one thing this add-on puts outside itself, and every shape that takes none of it.
 *
 * What is checked is the refusals, because the success is one call. A client that renamed the
 * method, a fighter the page has not drawn, a jQuery object that throws — each must cost the line
 * and never the fight, because this runs inside the engine's own call stack.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { ok, RESULT_FAILURE } from "#/libs/result.ts";
import { COMBATANTS_MAXIMUM } from "#/src/core/combatant-roster.ts";
import {
    initPageTooltip,
    ROWS_WRITTEN_MAXIMUM,
    type TooltipPort,
} from "#/src/game/engine-tooltip.ts";
import { ROWS_BESIDE_THE_STATUSES } from "#/src/ui/panel-words.ts";
import { BUFF_BITS } from "#/tests/frozen-tables.ts";

/** One fighter's registry entry, and every call the writer made of it. */
interface Registry {
    text: string;
    appended: string[];
    replaced: string[];
    told: number;
}

/** The most rows the composer hands over for one fighter: a row per status, and the rest. */
const TOOLTIP_ROWS_MAXIMUM = BUFF_BITS.length + ROWS_BESIDE_THE_STATUSES;

/** What the game composes for a fighter before anybody adds to it. */
const THEIRS = '<div class="nick">Gracz</div>';

/**
 * ⚠️ **One bound, two spellings, and only a guard keeps them level.** `game/` reaches into no
 * `ui/` module, so the writer states the maximum a second time — and a block composed up to the
 * composer's bound must be one the writer will still take, or the assertion at the crossing
 * fires on a fighter with a lot to say.
 */
Deno.test("the writer takes every row the composer is allowed to compose", () => {
    assert(
        ROWS_WRITTEN_MAXIMUM >= TOOLTIP_ROWS_MAXIMUM,
        `the writer stops at ${ROWS_WRITTEN_MAXIMUM} and the composer may hand it ` +
            `${TOOLTIP_ROWS_MAXIMUM}`,
    );
});

Deno.test("a block lands on the fighter it was composed for, and on nobody else", () => {
    const first = composeRegistry();
    const second = composeRegistry();
    const page = composePage([
        composeWarrior(11, "Gracz 1", first),
        composeWarrior(21, "Renegat 1", second),
    ]);
    const writing = initPageTooltip(page).writeRows(new Map([[11, ["MargoMeter"]]]));
    assertEquals(writing, ok({ written: 1, asked: 1 }), "one block asked for, one landed");
    assertEquals(first.text, `${THEIRS}<br>MargoMeter`, "under what the game composed");
    assertEquals(second.text, THEIRS, "and the fighter it was not composed for got nothing");
});

function composeRegistry(text: string = THEIRS): Registry {
    return { text, appended: [], replaced: [], told: 0 };
}

function composePage(warriors: unknown[]) {
    const warriorsList: Record<string, unknown> = {};
    for (const [at, warrior] of warriors.entries()) warriorsList[`${at}`] = warrior;
    return { Engine: { battle: { warriorsList } } };
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

/**
 * ⚠️ **One call per row, and the client's own `<br>` is the break between them.** This is what
 * buys the block its shape without this add-on writing a tag — so a writer that joined the rows
 * itself would be writing markup, which is exactly what `develop:SECURITY.md` says it does not do.
 */
Deno.test("every row goes over on a call of its own, and an open tooltip is told once", () => {
    const { registry, writer } = composeOne();
    const rows = ["MargoMeter", "Sprowokowany przez Gracz 2 · 1 z 3 tur", "Spowolnienie 3 tury"];
    writer.writeRows(new Map([[11, rows]]));
    assertEquals(registry.appended, rows, "each row on its own call, in order");
    assertEquals(registry.replaced, [], "and nothing of theirs was replaced to get there");
    assertStrictEquals(registry.told, 1, "and the tooltip was told to draw again, once");
});

/** One fighter, a writer, and the page they stand on — what most of these tests start from. */
function composeOne(): { registry: Registry; writer: TooltipPort } {
    const registry = composeRegistry();
    const page = composePage([composeWarrior(11, "Gracz 1", registry)]);
    return { registry, writer: initPageTooltip(page) };
}

/**
 * ⚠️ **The failure this writer exists for.** It is handed every fighter on every payload, so a
 * block it could not find again would be a second block on every payload after.
 */
Deno.test("the same rows written again leave one block, and touch nothing", () => {
    const { registry, writer } = composeOne();
    const rows = new Map([[11, ["MargoMeter", "Tury wykonane 3"]]]);
    writer.writeRows(rows);
    const once = registry.text;
    writer.writeRows(rows);
    assertEquals(registry.text, once, "the registry says what it said after the first write");
    assertStrictEquals(registry.appended.length, 2, "no row went over a second time");
    assertStrictEquals(registry.told, 1, "and an unchanged tooltip is not told to draw again");
});

Deno.test("changed rows take the old block off before the new one goes on", () => {
    const { registry, writer } = composeOne();
    writer.writeRows(new Map([[11, ["MargoMeter", "Tury wykonane 3"]]]));
    writer.writeRows(new Map([[11, ["MargoMeter", "Tury wykonane 4"]]]));
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
 * the focus pass `develop ADR 0111` carries — and the block is simply gone from what it wrote.
 */
Deno.test("a tooltip the game rebuilt takes the block again, and only once", () => {
    const { registry, writer } = composeOne();
    const rows = new Map([[11, ["MargoMeter", "Tury wykonane 3"]]]);
    writer.writeRows(rows);
    registry.text = THEIRS;
    writer.writeRows(rows);
    assertEquals(registry.text, `${THEIRS}<br>MargoMeter<br>Tury wykonane 3`, "one block again");
    assertEquals(registry.replaced, [], "and nothing of theirs was cut to put it there");
});

/** Another add-on appends to the same registry, and what it wrote is not ours to take off. */
Deno.test("what somebody else appended after the block stays where it stood", () => {
    const { registry, writer } = composeOne();
    writer.writeRows(new Map([[11, ["MargoMeter", "Tury wykonane 3"]]]));
    registry.text = `${registry.text}<br>somebody else`;
    writer.writeRows(new Map([[11, ["MargoMeter", "Tury wykonane 4"]]]));
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
    const { registry, writer } = composeOne();
    writer.writeRows(new Map([[11, ["MargoMeter", "Tury wykonane 3"]]]));
    const writing = writer.writeRows(new Map([[11, []]]));
    assertEquals(writing, ok({ written: 0, asked: 0 }), "nothing asked for, nothing standing");
    assertEquals(registry.text, THEIRS, "and the tooltip is the game's again");
    const fresh = composeOne();
    fresh.writer.writeRows(new Map([[11, []]]));
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
        initPageTooltip(page).writeRows(new Map([[11, ["cokolwiek"]]])),
        ok({ written: 0, asked: 1 }),
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
    const writing = initPageTooltip(page).writeRows(
        new Map([[11, ["a"]], [21, ["b"]], [31, ["c"]]]),
    );
    assertEquals(writing, ok({ written: 2, asked: 3 }), "the two that could take one did");
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
    const writing = initPageTooltip(page).writeRows(new Map([[11, ["a"]], [21, ["b"]]]));
    assertEquals(writing, ok({ written: 1, asked: 2 }), "the one that is drawn takes its line");
    assertEquals(second.appended, ["b"], "and the other costs nothing");
});

Deno.test("a call of theirs that throws costs the lines and never the fight", () => {
    const registry = composeRegistry();
    const page = composePage([
        composeWarrior(11, "Gracz 1", registry, { doesThrowOnFind: true }),
    ]);
    const writing = initPageTooltip(page).writeRows(new Map([[11, ["cokolwiek"]]]));
    assertStrictEquals(writing.ok, false, "the throw came back as the page's failure");
    if (!writing.ok) assertStrictEquals(writing.error.kind, RESULT_FAILURE.foreignThrew);
    assertEquals(registry.appended, [], "and did not leave this file with a line half written");
});

Deno.test("a page with no fight on it takes nothing, which is not a failure", () => {
    const rows = new Map([[11, ["a"]]]);
    assertEquals(initPageTooltip({}).writeRows(rows), ok({ written: 0, asked: 1 }), "no game");
    assertEquals(initPageTooltip(null).writeRows(rows), ok({ written: 0, asked: 1 }), "no page");
});

/**
 * An empty string is the client's word for deleting a tooltip. A registry holding our block and
 * nothing else has no string of theirs to go back to, so the block stays rather than the tooltip
 * going.
 */
Deno.test("a tooltip that is nothing but our block is never deleted to take it off", () => {
    const registry = composeRegistry("");
    const page = composePage([composeWarrior(11, "Gracz 1", registry)]);
    const writer = initPageTooltip(page);
    writer.writeRows(new Map([[11, ["MargoMeter"]]]));
    writer.writeRows(new Map([[11, ["MargoMeter", "Tury wykonane 1"]]]));
    assertEquals(registry.replaced, [], "their tooltip was never replaced with nothing");
});

/**
 * **S11.** The writer remembers a block per fighter, and a page goes on for fight after fight; a
 * fighter the page no longer draws is forgotten, or the memory grows with every fight played.
 */
Deno.test("the writer remembers one board's worth of fighters, however many fights go by", () => {
    // One page, whose battle is a different board each fight, as the game's own is.
    const page = composePage([]);
    const writer = initPageTooltip(page);
    for (let fight = 0; fight < 4; fight += 1) {
        const ids = Array.from({ length: COMBATANTS_MAXIMUM }, (_, at) => fight * 1000 + at);
        const board = composePage(
            ids.map((id) => composeWarrior(id, `Gracz ${id}`, composeRegistry())),
        );
        page.Engine.battle = board.Engine.battle;
        const writing = writer.writeRows(new Map(ids.map((id) => [id, ["MargoMeter"]])));
        const whole = ok({ written: COMBATANTS_MAXIMUM, asked: COMBATANTS_MAXIMUM });
        assertEquals(writing, whole, `fight ${fight} is written whole`);
    }
});

/** **W5: zero is a boundary.** Nothing asked for is nothing written, and it is not an absence. */
Deno.test("no block asked for is no block written, and the counts say both", () => {
    const { registry, writer } = composeOne();
    assertEquals(writer.writeRows(new Map()), ok({ written: 0, asked: 0 }), "asked nothing");
    assert(registry.appended.length === 0, "and wrote nothing");
    assertStrictEquals(registry.told, 0, "and told nothing");
});

/**
 * ⚠️ **A block that went on before a throw of theirs is still ours.** Forgotten, it would be looked
 * for as the old block on the next write, not be found, and go on a second time.
 */
Deno.test("a throw part way through remembers every block that went on before it", () => {
    const first = composeRegistry();
    let isThrowing = true;
    const second = {
        id: 21,
        name: "Renegat 1",
        $: {
            find: () => {
                if (isThrowing) throw new TypeError("a page being torn down");
                return {
                    getTipData: () => THEIRS,
                    tip: () => {},
                    concatTip: () => {},
                    trigger: () => {},
                };
            },
        },
    };
    const page = composePage([composeWarrior(11, "Gracz 1", first), second]);
    const writer = initPageTooltip(page);
    const rows = new Map([[11, ["MargoMeter", "Tury wykonane 3"]]]);
    assertStrictEquals(writer.writeRows(rows).ok, false, "the walk stopped on the throw");
    assertEquals(first.appended.length, 2, "after the first fighter's block went on");
    isThrowing = false;
    writer.writeRows(rows);
    assertEquals(
        first.text,
        `${THEIRS}<br>MargoMeter<br>Tury wykonane 3`,
        "and it stays one block",
    );
});
