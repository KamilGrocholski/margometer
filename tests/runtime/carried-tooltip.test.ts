/**
 * The rows the add-on puts into the game's own tooltips, held at the seam: every recording played
 * through the runtime into a battle that rebuilds tooltips the way the client does, and each frame
 * read back out of the registry a reader's pointer would draw from.
 */

import { assert, assertEquals, assertExists, assertStrictEquals } from "@std/assert";
import { isRecord } from "#/libs/unknown-value.ts";
import { PANEL_WORDS } from "#/src/ui/panel-words.ts";
import { lookupRecordedFight, readRecordedFights } from "#/tests/recorded-fights.ts";
import { initRuntimeWorld } from "#/tests/runtime-world.ts";

/** One fighter's entry in the client's registry of tooltips, and what an open one was told. */
interface TooltipRegistry {
    text: string;
    appended: number;
    told: number;
}

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";
/** Two people focusing one opponent, which is what the focus pass needs to have anybody to do. */
const DUET = "captures/2026-09-09-tempest-duet-vs-wojownik-ne0iTNdg-0.14.0.json";
/** A fight carrying `legbon_lastheal`, read 2026-09-25 with `git grep` at `fa1dcce`. */
const LAST_RESCUED = "captures/2026-08-15-tempest-grupa-vs-hildur-1-1786514810315-none.json";
const ADD_ON_ROW = "MargoMeter";

/**
 * ⚠️ **The failure this was written for, and a reader saw it**: rows in a fighter's tooltip on one
 * hover, gone on the next, back on the one after. Nobody holds two blocks, and a fighter holding
 * one keeps it through the next payload.
 */
Deno.test("every fighter keeps one block through every payload, whoever was rebuilt", () => {
    const lost: string[] = [];
    const doubled: string[] = [];
    let kept = 0;
    for (const fight of readRecordedFights()) {
        const { page, registries } = composeRebuildingBattle();
        const world = initRuntimeWorld(page);
        for (const [index, payload] of fight.updates.entries()) {
            const before = new Map(
                [...registries].map(([id, one]) => [id, countBlocksInText(one.text)]),
            );
            world.update(payload);
            for (const [id, registry] of registries) {
                const blocks = countBlocksInText(registry.text);
                if (blocks > 1) doubled.push(`${fight.path} #${index}: ${id}`);
                if ((before.get(id) ?? 0) === 0) continue;
                if (blocks === 0) lost.push(`${fight.path} #${index}: ${id}`);
                else kept += 1;
            }
        }
    }
    assertEquals(lost.slice(0, 5), [], `a fighter lost their block, ${lost.length} times`);
    assertEquals(doubled.slice(0, 5), [], `a fighter took two blocks, ${doubled.length} times`);
    assert(kept > 0, "the recordings carry fighters whose blocks were kept");
});

/**
 * A battle holding its fighters the way the client does, as far as a tooltip goes: a restated
 * fighter's tooltip is rebuilt, and after every payload carrying `w` its focus pass rebuilds
 * whoever it left focused and whoever the hero focuses now (`develop ADR 0111` cites the build).
 * No recording says which warrior is the hero, so the hero here is the first person stating one.
 */
function composeRebuildingBattle() {
    const registries = new Map<number, TooltipRegistry>();
    const warriorsList: Record<string, Record<string, unknown>> = {};
    const held = new Map<string, string | null>();
    const setRebuilt = (id: string, focusedBy: string | null): void => {
        const registry = registries.get(Number(id)) ?? { text: "", appended: 0, told: 0 };
        registry.text = `tooltip ${id}`;
        registries.set(Number(id), registry);
        held.set(id, focusedBy);
    };
    const setFocusedBy = (id: string, focusedBy: string | null): void => {
        const warrior = warriorsList[id];
        if (warrior === undefined) return;
        warrior.focusedBy = focusedBy;
        setRebuilt(id, focusedBy);
    };
    const updateData = (payload: unknown): number => {
        if (!isRecord(payload)) return 1;
        if (payload.w === undefined) return 1;
        const roster = isRecord(payload.w) ? payload.w : {};
        for (const [id, stated] of Object.entries(roster)) {
            const warrior = warriorsList[id] ?? { $: composeTipHolder(registries, Number(id)) };
            if (isRecord(stated)) Object.assign(warrior, stated);
            warrior.id = Number(id);
            warriorsList[id] = warrior;
            setRebuilt(id, null);
        }
        for (const [id, focusedBy] of [...held]) {
            if (focusedBy !== null) setFocusedBy(id, null);
        }
        const hero = Object.values(warriorsList).find((one) => {
            if (one.npc !== 0) return false;
            return typeof one.focus === "number" && one.focus !== 0;
        });
        if (hero !== undefined) setFocusedBy(String(hero.focus), String(hero.name));
        return 1;
    };
    const battle: Record<string, unknown> = { updateData, warriorsList };
    return { page: { Engine: { battle } }, registries };
}

/** The client's jQuery set of one fighter's tooltip holders, over that fighter's registry entry. */
function composeTipHolder(registries: Map<number, TooltipRegistry>, combatantId: number) {
    const get = (): TooltipRegistry => {
        const registry = registries.get(combatantId);
        assertExists(registry, "a fighter the page draws has a tooltip");
        return registry;
    };
    const targets = {
        getTipData: () => get().text,
        tip: (content: string) => {
            get().text = content;
        },
        concatTip: (row: string) => {
            get().text = `${get().text}<br>${row}`;
            get().appended += 1;
        },
        trigger: () => {
            get().told += 1;
        },
    };
    return { find: () => targets };
}

/** How many blocks of ours a registry entry holds: the name opens every one of them. */
function countBlocksInText(text: string): number {
    return text.split("<br>").filter((row) => row === ADD_ON_ROW).length;
}

/** ⚠️ **`concatTip` triggers nothing**, so an open tooltip is told whenever rows went on. */
Deno.test("an open tooltip is told to draw again exactly when rows went on", () => {
    const { page, registries } = composeRebuildingBattle();
    const world = initRuntimeWorld(page);
    let quiet = 0;
    for (const [index, payload] of lookupRecordedFight(HILDUR).updates.entries()) {
        const before = new Map([...registries].map(([id, one]) => [id, { ...one }]));
        world.update(payload);
        for (const [id, registry] of registries) {
            const was = before.get(id) ?? { text: "", appended: 0, told: 0 };
            const isTold = registry.told > was.told;
            const isAppended = registry.appended > was.appended;
            assertStrictEquals(isTold, isAppended, `#${index}: ${id} was told as rows went on`);
            if (!isTold) quiet += 1;
        }
    }
    assert(quiet > 0, "a fighter nothing happened to was left alone, and it happened");
});

/**
 * ⚠️ **Held at the seam, against the envelope itself.** The witness is the game's own `super_cast`,
 * followed payload by payload: the row stands exactly where one is stated, under the turns taken
 * or under the name, with the client's own pair (`develop ADR 0115`, `0116`).
 */
Deno.test("a charge row stands on whoever the envelope states charging, under the turns", () => {
    const wrong: string[] = [];
    let charged = 0;
    for (const fight of readRecordedFights()) {
        const { page, registries } = composeRebuildingBattle();
        const world = initRuntimeWorld(page);
        const statedById = new Map<number, string | null>();
        for (const [index, payload] of fight.updates.entries()) {
            world.update(payload);
            const warriors = isRecord(payload) && isRecord(payload.w) ? payload.w : {};
            for (const [id, warrior] of Object.entries(warriors)) {
                if (!isRecord(warrior)) continue;
                const charge = warrior.super_cast;
                const row = isRecord(charge)
                    ? `Cios specjalny · ${charge.name} · ${charge.turn} z ${charge.total_turns}`
                    : null;
                statedById.set(Number(id), row);
            }
            for (const [id, registry] of registries) {
                const rows = registry.text.split("<br>");
                const stated = statedById.get(id) ?? null;
                const drawn = rows.filter((row) => row.startsWith("Cios specjalny"));
                if (stated === null) {
                    if (drawn.length > 0) wrong.push(`${fight.path} #${index}: ${id} ${drawn[0]}`);
                    continue;
                }
                charged += 1;
                const opening = rows.indexOf(ADD_ON_ROW) + 1;
                const isTurnsFirst = (rows[opening] ?? "").startsWith("Tury wykonane");
                const under = rows[isTurnsFirst ? opening + 1 : opening] ?? "";
                if (under !== stated) wrong.push(`${fight.path} #${index}: ${id} ${under}`);
            }
        }
    }
    assertEquals(
        wrong.slice(0, 5),
        [],
        `a charge row disagreed with the envelope ${wrong.length}×`,
    );
    assert(charged > 0, "the recordings carry fighters charging, and their rows were read");
});

/**
 * A focus that moves on is rebuilt twice over: the fighter it leaves and the fighter it reaches.
 * No recording moves one while both have rows, so the move is made here, on the finished duet.
 */
Deno.test("a focus that moves on leaves both fighters it touched with their rows", () => {
    const { page, registries } = composeRebuildingBattle();
    const world = initRuntimeWorld(page);
    for (const payload of lookupRecordedFight(DUET).updates) world.update(payload);
    const [hero, partner, opponent] = ["473373", "477718", "462342"];
    const getBlocks = (id: string) => countBlocksInText(registries.get(Number(id))?.text ?? "");
    for (const id of [hero, partner, opponent]) {
        assertStrictEquals(getBlocks(id), 1, `${id} carries a block before the move`);
    }
    world.update({ w: { [hero]: { focus: Number(partner) } } });
    assertStrictEquals(getBlocks(opponent), 1, "the fighter it left keeps their rows");
    assertStrictEquals(getBlocks(partner), 1, "and the fighter it reached has them");
    world.update({ w: { [hero]: { focus: 0 } } });
    assertStrictEquals(getBlocks(partner), 1, "and a focus let go of leaves them too");
});

/**
 * A status is worded by the client's own dictionary, filed where the client files a status: an
 * id asked without its category answers nothing (`develop ADR 0024`). The words here are ours.
 */
Deno.test("a status row carries the client's own word for it, asked under its category", () => {
    const { page, registries } = composeRebuildingBattle();
    const translated: Record<string, unknown> = {
        ...page,
        _t: (id: string, _: unknown, category?: string) =>
            category === "buff" ? `+Label of ${id}` : undefined,
    };
    const world = initRuntimeWorld(translated);
    let worded = 0;
    for (const fight of readRecordedFights()) {
        for (const payload of fight.updates) world.update(payload);
        for (const registry of registries.values()) {
            worded += registry.text.split("<br>").filter((row) =>
                row.startsWith("Label of ")
            ).length;
        }
        if (worded > 0) break;
    }
    assert(worded > 0, "the recordings carry statuses, and the client's words reached their rows");
});

/**
 * Both ends of a shout, frame by frame: whoever is held names who holds them, and whoever holds
 * counts the people held — so the counts on the holders add up to the held.
 */
Deno.test("a shout is said on both ends of it, and the two ends agree", () => {
    const wrong: string[] = [];
    let held = 0;
    for (const fight of readRecordedFights()) {
        const { page, registries } = composeRebuildingBattle();
        const world = initRuntimeWorld(page);
        for (const [index, payload] of fight.updates.entries()) {
            world.update(payload);
            const rows = [...registries.values()].flatMap((one) => one.text.split("<br>"));
            const provoked = rows.filter((row) => row.startsWith("Sprowokowany przez "));
            const counted = rows
                .filter((row) => row.startsWith("Prowokuje "))
                .reduce((sum, row) => sum + Number(row.split(" ")[1]), 0);
            if (counted !== provoked.length) wrong.push(`${fight.path} #${index}: ${counted}`);
            const unnamed = provoked.filter((row) => row.includes(PANEL_WORDS.withoutActor));
            if (unnamed.length > 0) wrong.push(`${fight.path} #${index}: ${unnamed[0]}`);
            held += provoked.length;
        }
    }
    assertEquals(wrong.slice(0, 5), [], `the two ends of a shout disagreed ${wrong.length}×`);
    assert(held > 0, "the recordings carry shouts, and their rows were read");
});

/** The bonus fires once a fight, so once it has, every payload after says it is spent. */
Deno.test("a last rescue that fired is said spent on its holder to the end of the fight", () => {
    const { page, registries } = composeRebuildingBattle();
    const world = initRuntimeWorld(page);
    const spentBy = new Set<number>();
    for (const payload of lookupRecordedFight(LAST_RESCUED).updates) {
        world.update(payload);
        for (const [id, registry] of registries) {
            const isSpent = registry.text.split("<br>").some((row) => {
                return row.startsWith("Ostatni ratunek") && row.endsWith("wykorzystany");
            });
            if (isSpent) spentBy.add(id);
            else assert(!spentBy.has(id), `${id} said it spent, and then did not`);
        }
    }
    assert(spentBy.size > 0, "the fight carries a last rescue, and a row says it fired");
});

/** `formatJoinedInProgressSuspicion` stands on the panel only, so the tooltip draws no count. */
Deno.test("a fight walked into says no count of turns on anybody", () => {
    const { page, registries } = composeRebuildingBattle();
    const world = initRuntimeWorld(page);
    const [opening, ...rest] = lookupRecordedFight(HILDUR).updates;
    assert(isRecord(opening), "the recording opens on a payload");
    // The roster as the opening states it, without the mark that says the fight opened there.
    const joined: Record<string, unknown> = { ...opening };
    delete joined.init;
    for (const payload of [joined, ...rest]) world.update(payload);
    const rows = [...registries.values()].flatMap((one) => one.text.split("<br>"));
    assert(rows.includes(ADD_ON_ROW), "the fighters carry rows of ours");
    assertEquals(rows.filter((row) => row.startsWith("Tury wykonane")), [], "and none of turns");
});

/** The figure a status row states is the bearer's own, off the casts standing over them. */
Deno.test("a status carried with a figure states it, and states the fighter's own", () => {
    const { page, registries } = composeRebuildingBattle();
    const world = initRuntimeWorld(page);
    let figured = 0;
    for (const payload of lookupRecordedFight(HILDUR).updates) {
        world.update(payload);
        const rows = [...registries.values()].flatMap((one) => one.text.split("<br>"));
        figured += rows.filter((row) => {
            if (!row.startsWith("swow_down ")) return false;
            return row.endsWith("%");
        }).length;
    }
    assert(figured > 0, "the fight carries a slow with a figure, and a row says it");
});
