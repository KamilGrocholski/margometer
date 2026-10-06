/**
 * The rows this add-on writes into a fighter's tooltip, and every shape that takes none of them.
 *
 * What is checked is the refusals, because the success is one call. A client that renamed the
 * method, a fighter the page has not drawn, a jQuery object that throws — each must cost the line
 * and never the fight, because this runs inside the engine's own call stack.
 */

import { assert, assertEquals, assertInstanceOf, assertStrictEquals } from "@std/assert";
import * as errors from "#/libs/errors.ts";
import { COMBATANTS_MAXIMUM } from "#/src/core/combatant-roster.ts";
import {
    initMargonemEngineTooltip,
    type MargonemEngineTooltipPort,
    ROWS_WRITTEN_MAXIMUM,
} from "#/src/ports/margonem-engine-tooltip.ts";
import { MargonemEngineWarriorsExceeded } from "#/src/ports/margonem-engine-warriors.ts";
import { ROWS_BESIDE_THE_STATUSES } from "#/src/ui/panel-words.ts";
import { FROZEN_STATUS_BITS } from "#/frozen/status-bits.ts";

/** One fighter's registry entry, and every call the writer made of it. */
interface Registry {
    text: string;
    appended: string[];
    replaced: string[];
    /** Every `tip` handed a break the registry did not hold, which would be a tag of ours. */
    breaksWritten: string[];
    told: number;
}

/** The most rows the composer hands over for one fighter: a row per status, and the rest. */
const TOOLTIP_ROWS_MAXIMUM = FROZEN_STATUS_BITS.bits.length + ROWS_BESIDE_THE_STATUSES;

/** What the game composes for a fighter before anybody adds to it. */
const THEIRS = '<div class="nick">Gracz</div>';

/** Every registry this file composes, so that one case reads what every `tip` was handed. */
const REGISTRIES: Registry[] = [];

/**
 * ⚠️ **One bound, two spellings, and only a guard keeps them level.** `ports/` reaches into no
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
    const firstRegistry = composeRegistry();
    const secondRegistry = composeRegistry();
    const page = composePage([
        composeWarrior(11, "Gracz 1", firstRegistry),
        composeWarrior(21, "Renegat 1", secondRegistry),
    ]);
    const writing = initMargonemEngineTooltip(page).writeRows(new Map([[11, ["MargoMeter"]]]));
    assertEquals(writing, { written: 1, refused: 0 }, "one block asked for, one landed");
    assertStrictEquals(
        firstRegistry.text,
        `${THEIRS}<br>MargoMeter`,
        "under what the game composed",
    );
    assertStrictEquals(
        secondRegistry.text,
        THEIRS,
        "and the fighter it was not composed for got nothing",
    );
});

function composeRegistry(text: string = THEIRS): Registry {
    const registry = { text, appended: [], replaced: [], breaksWritten: [], told: 0 };
    REGISTRIES.push(registry);
    return registry;
}

function composePage(warriors: unknown[]) {
    const warriorsList: Record<string, unknown> = {};
    for (const [index, warrior] of warriors.entries()) warriorsList[`${index}`] = warrior;
    return { Engine: { battle: { warriorsList } } };
}

/** A warrior as the client holds one: an id, a name, and its own jQuery object under `$`. */
function composeWarrior(id: number, name: string, registry: Registry, over: {
    doesThrowOnFind?: boolean;
    hasMethods?: boolean;
    hasElement?: boolean;
    /** One method of the four the client lends, left off. */
    lacking?: string;
} = {}) {
    const targets = {
        getTipData: () => registry.text,
        tip: (content: string) => {
            registry.replaced.push(content);
            if (content.includes("<br>")) {
                if (!isCutFromText(registry.text, content)) registry.breaksWritten.push(content);
            }
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
    const jqueryObject = {
        find: () => {
            if (over.doesThrowOnFind === true) throw new TypeError("a page being torn down");
            if (over.hasMethods === false) return { concatTip: targets.concatTip };
            if (over.lacking !== undefined) {
                return Object.fromEntries(
                    Object.entries(targets).filter(([method]) => method !== over.lacking),
                );
            }
            return targets;
        },
    };
    if (over.hasElement === false) return { id, name };
    return { id, name, $: jqueryObject };
}

/** Whether `content` is `text` with one run cut out of it: theirs, less a block of ours. */
function isCutFromText(text: string, content: string): boolean {
    if (content.length >= text.length) return false;
    for (let cutIndex = 0; cutIndex <= content.length; cutIndex += 1) {
        const before = content.slice(0, cutIndex);
        const after = content.slice(cutIndex);
        if (text.startsWith(before)) {
            if (text.endsWith(after)) return true;
        }
    }
    return false;
}

/**
 * ⚠️ **One call per row, and the client's own `<br>` is the break between them.** This is what
 * buys the block its shape without this add-on writing a tag — so a writer that joined the rows
 * itself would be writing markup, which is exactly what `SECURITY.md` says it does not do.
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
function composeOne(): { registry: Registry; writer: MargonemEngineTooltipPort } {
    const registry = composeRegistry();
    const page = composePage([composeWarrior(11, "Gracz 1", registry)]);
    return { registry, writer: initMargonemEngineTooltip(page) };
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
    assertStrictEquals(registry.text, once, "the registry says what it said after the first write");
    assertStrictEquals(registry.appended.length, 2, "no row went over a second time");
    assertStrictEquals(registry.told, 1, "and an unchanged tooltip is not told to draw again");
});

Deno.test("changed rows take the old block off before the new one goes on", () => {
    const { registry, writer } = composeOne();
    writer.writeRows(new Map([[11, ["MargoMeter", "Tury wykonane 3"]]]));
    writer.writeRows(new Map([[11, ["MargoMeter", "Tury wykonane 4"]]]));
    assertEquals(registry.replaced, [THEIRS], "their own string went back, less ours");
    assertStrictEquals(
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
    assertStrictEquals(
        registry.text,
        `${THEIRS}<br>MargoMeter<br>Tury wykonane 3`,
        "one block again",
    );
    assertEquals(registry.replaced, [], "and nothing of theirs was cut to put it there");
});

/** Another add-on appends to the same registry, and what it wrote is not ours to take off. */
Deno.test("what somebody else appended after the block stays where it stood", () => {
    const { registry, writer } = composeOne();
    writer.writeRows(new Map([[11, ["MargoMeter", "Tury wykonane 3"]]]));
    registry.text = `${registry.text}<br>somebody else`;
    writer.writeRows(new Map([[11, ["MargoMeter", "Tury wykonane 4"]]]));
    assertStrictEquals(
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
    assertEquals(writing, { written: 0, refused: 0 }, "nothing asked for, nothing standing");
    assertStrictEquals(registry.text, THEIRS, "and the tooltip is the game's again");
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
        initMargonemEngineTooltip(page).writeRows(new Map([[11, ["cokolwiek"]]])),
        { written: 0, refused: 1 },
        "asked for one, landed none, and refused it",
    );
    assertStrictEquals(registry.text, THEIRS, "and nothing was written anywhere");
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
    const writing = initMargonemEngineTooltip(page).writeRows(
        new Map([[11, ["a"]], [21, ["b"]], [31, ["c"]]]),
    );
    assertEquals(writing, { written: 2, refused: 1 }, "the two that could take one did");
    assertEquals(
        registries.map((registry) => registry.appended),
        [[], ["b"], ["c"]],
        "and the walk went on past the one that could not",
    );
});

Deno.test("any one of the four methods gone costs that fighter's line, and nobody else's", () => {
    for (const method of ["getTipData", "tip", "concatTip", "trigger"]) {
        const firstRegistry = composeRegistry();
        const secondRegistry = composeRegistry();
        const page = composePage([
            composeWarrior(11, "Gracz 1", firstRegistry, { lacking: method }),
            composeWarrior(21, "Renegat 1", secondRegistry),
        ]);
        const writing = initMargonemEngineTooltip(page).writeRows(
            new Map([[11, ["a"]], [21, ["b"]]]),
        );
        assertEquals(writing, { written: 1, refused: 1 }, `without ${method}, one of two`);
        assertEquals(
            [firstRegistry.appended, secondRegistry.appended],
            [[], ["b"]],
            `past the one without it`,
        );
    }
});

/**
 * A fighter the client holds no tooltip for on one payload — its element or its string not there —
 * is left as it was, and so is the block remembered on them: forgotten, the block still standing
 * would not be looked for when the tooltip answers again, and a second one would go on beside it.
 */
Deno.test("a fighter out of reach for a payload keeps the block remembered on them", () => {
    const registry = composeRegistry();
    let isAnswering = true;
    const warrior = composeWarrior(11, "Gracz 1", registry) as Record<string, unknown>;
    const jqueryObject = warrior.$;
    const answering = {
        find: () => {
            const targets = (jqueryObject as { find: () => Record<string, unknown> }).find();
            return { ...targets, getTipData: () => isAnswering ? registry.text : undefined };
        },
    };
    warrior.$ = answering;
    const writer = initMargonemEngineTooltip(composePage([warrior]));
    writer.writeRows(new Map([[11, ["MargoMeter", "Tury wykonane 3"]]]));
    isAnswering = false;
    writer.writeRows(new Map([[11, ["MargoMeter", "Tury wykonane 4"]]]));
    isAnswering = true;
    writer.writeRows(new Map([[11, ["MargoMeter", "Tury wykonane 4"]]]));
    const withOneBlock = `${THEIRS}<br>MargoMeter<br>Tury wykonane 4`;
    assertStrictEquals(registry.text, withOneBlock, "a tooltip that answered nothing once");
    warrior.$ = undefined;
    writer.writeRows(new Map([[11, ["MargoMeter", "Tury wykonane 5"]]]));
    warrior.$ = answering;
    writer.writeRows(new Map([[11, ["MargoMeter", "Tury wykonane 5"]]]));
    const two = `${THEIRS}<br>MargoMeter<br>Tury wykonane 5`;
    assertStrictEquals(registry.text, two, "and a fighter drawn without an element once");
});

/** A block taken off is forgotten, so what is looked for next is never words that are not ours. */
Deno.test("the same words appended by somebody else after ours came off are theirs", () => {
    const { registry, writer } = composeOne();
    writer.writeRows(new Map([[11, ["MargoMeter", "Tury wykonane 3"]]]));
    writer.writeRows(new Map([[11, []]]));
    registry.text = `${registry.text}<br>MargoMeter<br>Tury wykonane 3`;
    const theirs = registry.text;
    writer.writeRows(new Map([[11, []]]));
    assertStrictEquals(registry.text, theirs, "left where they stand");
});

/** Ours went on last, so the last copy of its words is the one that is ours. */
Deno.test("a block the game's own text repeats is taken off where ours went on", () => {
    const own = `${THEIRS}<br>MargoMeter<br>Tury wykonane 3<br>theirs after`;
    const registry = composeRegistry(own);
    const writer = initMargonemEngineTooltip(
        composePage([composeWarrior(11, "Gracz 1", registry)]),
    );
    writer.writeRows(new Map([[11, ["MargoMeter", "Tury wykonane 3"]]]));
    writer.writeRows(new Map([[11, ["MargoMeter", "Tury wykonane 4"]]]));
    assertStrictEquals(
        registry.text,
        `${own}<br>MargoMeter<br>Tury wykonane 4`,
        "theirs stands whole",
    );
});

Deno.test("a fighter the page has not drawn is stepped over, not thrown on", () => {
    const firstRegistry = composeRegistry();
    const secondRegistry = composeRegistry();
    const page = composePage([
        composeWarrior(11, "Gracz 1", firstRegistry, { hasElement: false }),
        composeWarrior(21, "Renegat 1", secondRegistry),
    ]);
    const writing = initMargonemEngineTooltip(page).writeRows(new Map([[11, ["a"]], [21, ["b"]]]));
    assertEquals(
        writing,
        { written: 1, refused: 0 },
        "the one drawn takes its line, and the other is no refusal",
    );
    assertEquals(secondRegistry.appended, ["b"], "and the other costs nothing");
});

Deno.test("a refusal is counted where a block was asked for, and nowhere else", () => {
    const page = composePage([
        composeWarrior(11, "Gracz 1", composeRegistry(), { hasMethods: false }),
        { id: 21, name: "Renegat 1", $: {} },
    ]);
    const writer = initMargonemEngineTooltip(page);
    assertEquals(
        writer.writeRows(new Map([[11, []], [21, []]])),
        { written: 0, refused: 0 },
        "no rows for either is nothing refused",
    );
    assertEquals(
        writer.writeRows(new Map([[11, []], [21, ["b"]]])),
        { written: 0, refused: 1 },
        "while an element with no way to find its tooltip refuses the one it was asked for",
    );
});

Deno.test("a board past its bound is a failure of its own, and nobody is written to", () => {
    const registries = Array.from({ length: COMBATANTS_MAXIMUM + 1 }, () => composeRegistry());
    const page = composePage(
        registries.map((registry, index) => composeWarrior(index, `Gracz ${index}`, registry)),
    );
    const writing = initMargonemEngineTooltip(page).writeRows(new Map([[0, ["a"]]]));
    assertInstanceOf(writing, MargonemEngineWarriorsExceeded, "said, not taken as nobody drawn");
    assertStrictEquals(writing.count, COMBATANTS_MAXIMUM + 1, "with the count the page held");
    assertEquals(registries[0]?.appended, [], "and no block went on");
});

Deno.test("a call of theirs that throws costs the lines and never the fight", () => {
    const registry = composeRegistry();
    const page = composePage([
        composeWarrior(11, "Gracz 1", registry, { doesThrowOnFind: true }),
    ]);
    const writing = initMargonemEngineTooltip(page).writeRows(new Map([[11, ["cokolwiek"]]]));
    assertInstanceOf(writing, Error, "the throw came back as the page's failure");
    assertInstanceOf(writing, errors.Caught, "as the page's failure");
    assertEquals(registry.appended, [], "and did not leave this file with a line half written");
});

Deno.test("a page with no fight on it takes nothing, which is not a failure", () => {
    const rows = new Map([[11, ["a"]]]);
    assertEquals(
        initMargonemEngineTooltip({}).writeRows(rows),
        { written: 0, refused: 0 },
        "no game",
    );
    assertEquals(
        initMargonemEngineTooltip(null).writeRows(rows),
        { written: 0, refused: 0 },
        "no page",
    );
});

/**
 * An empty string is the client's word for deleting a tooltip. A registry holding our block and
 * nothing else has no string of theirs to go back to, so a new block goes on through `tip` with its
 * first row and `concatTip` with the rest, and no block leaves it standing, rather than the tooltip
 * going. What it then holds opens on no break, and that is what the next payload looks for.
 */
Deno.test("a tooltip that is nothing but our block takes the new one row by row, never emptied", () => {
    const registry = composeRegistry("");
    const page = composePage([composeWarrior(11, "Gracz 1", registry)]);
    const writer = initMargonemEngineTooltip(page);
    writer.writeRows(new Map([[11, ["MargoMeter"]]]));
    writer.writeRows(new Map([[11, ["MargoMeter", "Tury wykonane 1"]]]));
    assertEquals(registry.replaced, ["MargoMeter"], "the first row went over through tip, alone");
    assertEquals(
        registry.appended,
        ["MargoMeter", "Tury wykonane 1"],
        "and every other row through concatTip",
    );
    assertStrictEquals(registry.text, "MargoMeter<br>Tury wykonane 1", "so it holds the new block");
    writer.writeRows(new Map([[11, ["MargoMeter", "Tury wykonane 2"]]]));
    assertStrictEquals(
        registry.text,
        "MargoMeter<br>Tury wykonane 2",
        "which the next payload found and replaced, leaving one block",
    );
    const told = registry.told;
    writer.writeRows(new Map([[11, ["MargoMeter", "Tury wykonane 2"]]]));
    assertStrictEquals(registry.told, told, "and found unchanged, is not written again");
    writer.writeRows(new Map([[11, []]]));
    assertStrictEquals(registry.text, "MargoMeter<br>Tury wykonane 2", "nor taken off");
});

/**
 * **S11.** The writer remembers a block per fighter, and a page goes on for fight after fight; a
 * fighter the page no longer draws is forgotten, or the memory grows with every fight played.
 */
Deno.test("the writer remembers one board's worth of fighters, however many fights go by", () => {
    // One page, whose battle is a different board each fight, as the game's own is.
    const page = composePage([]);
    const writer = initMargonemEngineTooltip(page);
    for (let fight = 0; fight < 4; fight += 1) {
        const ids = Array.from({ length: COMBATANTS_MAXIMUM }, (_, index) => fight * 1000 + index);
        const board = composePage(
            ids.map((id) => composeWarrior(id, `Gracz ${id}`, composeRegistry())),
        );
        page.Engine.battle = board.Engine.battle;
        const writing = writer.writeRows(new Map(ids.map((id) => [id, ["MargoMeter"]])));
        const whole = { written: COMBATANTS_MAXIMUM, refused: 0 };
        assertEquals(writing, whole, `fight ${fight} is written whole`);
    }
});

/** **W5: zero is a boundary.** Nothing asked for is nothing written, and it is not an absence. */
Deno.test("no block asked for is no block written, and the counts say both", () => {
    const { registry, writer } = composeOne();
    assertEquals(writer.writeRows(new Map()), { written: 0, refused: 0 }, "asked nothing");
    assertStrictEquals(registry.appended.length, 0, "and wrote nothing");
    assertStrictEquals(registry.told, 0, "and told nothing");
});

/**
 * ⚠️ **A block that went on before a throw of theirs is still ours.** Forgotten, it would be looked
 * for as the old block on the next write, not be found, and go on a second time.
 */
Deno.test("a throw part way through remembers every block that went on before it", () => {
    const firstRegistry = composeRegistry();
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
    const page = composePage([composeWarrior(11, "Gracz 1", firstRegistry), second]);
    const writer = initMargonemEngineTooltip(page);
    const rows = new Map([[11, ["MargoMeter", "Tury wykonane 3"]]]);
    assertInstanceOf(writer.writeRows(rows), errors.Caught, "the walk stopped on the throw");
    assertStrictEquals(firstRegistry.appended.length, 2, "after the first fighter's block went on");
    isThrowing = false;
    writer.writeRows(rows);
    assertStrictEquals(
        firstRegistry.text,
        `${THEIRS}<br>MargoMeter<br>Tury wykonane 3`,
        "and it stays one block",
    );
});

/**
 * **S11 on the path that throws.** A fight ending on a fighter whose call throws is still a board
 * the page drew, so what it no longer draws is forgotten there too, or every such fight would add
 * a board's worth that no later fight sheds.
 */
Deno.test("fight after fight ending on a throw of theirs remembers one board's worth", () => {
    const page = composePage([]);
    const writer = initMargonemEngineTooltip(page);
    for (let fight = 0; fight < 4; fight += 1) {
        const ids = Array.from({ length: COMBATANTS_MAXIMUM }, (_, index) => fight * 1000 + index);
        const board = composePage(
            ids.map((id, index) =>
                composeWarrior(id, `Gracz ${id}`, composeRegistry(), {
                    doesThrowOnFind: index === COMBATANTS_MAXIMUM - 1,
                })
            ),
        );
        page.Engine.battle = board.Engine.battle;
        const writing = writer.writeRows(new Map(ids.map((id) => [id, ["MargoMeter"]])));
        assertInstanceOf(writing, errors.Caught, `fight ${fight} stops on the throw, and says so`);
    }
});

/**
 * The page's collection is theirs, and nothing stops it holding one id under two keys. Counted
 * twice, a fighter would land two blocks against the one composed for them.
 */
Deno.test("a fighter the page holds twice takes one block, counted once", () => {
    const firstRegistry = composeRegistry();
    const secondRegistry = composeRegistry();
    const page = composePage([
        composeWarrior(11, "Gracz 1", firstRegistry),
        composeWarrior(11, "Gracz 1", secondRegistry),
    ]);
    const writing = initMargonemEngineTooltip(page).writeRows(new Map([[11, ["MargoMeter"]]]));
    assertEquals(writing, { written: 1, refused: 0 }, "one block asked for, one landed");
    assertEquals(firstRegistry.appended, ["MargoMeter"], "on the first the page holds");
    assertEquals(secondRegistry.appended, [], "and not again on the second");
});

/**
 * ⚠️ **What is forgotten is a fighter not drawn, never one not reached.** A throw ends the walk
 * before the fighters after it; their blocks still stand, and forgotten they would take a second.
 */
Deno.test("a fighter the walk never reached keeps the block remembered on them", () => {
    const registry = composeRegistry();
    let isThrowing = false;
    const throwing = {
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
    const page = composePage([throwing, composeWarrior(11, "Gracz 1", registry)]);
    const writer = initMargonemEngineTooltip(page);
    const rows = new Map([[11, ["MargoMeter", "Tury wykonane 3"]]]);
    writer.writeRows(rows);
    isThrowing = true;
    assertInstanceOf(writer.writeRows(rows), errors.Caught, "the walk stopped before them");
    isThrowing = false;
    writer.writeRows(rows);
    assertStrictEquals(
        registry.text,
        `${THEIRS}<br>MargoMeter<br>Tury wykonane 3`,
        "one block still",
    );
});

/**
 * ⚠️ **`SECURITY.md`'s promise, held over every case above.** A `tip` carrying a `<br>` the registry
 * did not already hold is a tag this add-on wrote, on whichever path it took. Runs last, so that
 * every registry composed before it has been written through.
 */
Deno.test("no tip in any case above was handed a break of ours", () => {
    const breaksWritten = REGISTRIES.flatMap((registry) => registry.breaksWritten);
    assertEquals(breaksWritten, [], "every break in the registries is the client's own");
});
