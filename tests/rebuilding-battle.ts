/**
 * A game battle for the tests: fighters held the way the client holds them, as far as a tooltip
 * goes, each with a registry entry a test can read back. A hook handed in is asked before every
 * call into a fighter's tooltip, which is how the simulator makes the client's methods throw.
 */

import { assertExists } from "@std/assert";
import { isRecord } from "#/libs/unknown-value.ts";
import { PAGE_CALL, type PageCall } from "./fake-window.ts";

/** One fighter's entry in the client's registry of tooltips, and what an open one was told. */
export interface TooltipRegistry {
    text: string;
    appended: number;
    told: number;
}

/**
 * A battle holding its fighters the way the client does, as far as a tooltip goes: a restated
 * fighter's tooltip is rebuilt, and after every payload carrying `w` its focus pass rebuilds
 * whoever it left focused and whoever the hero focuses now (`develop ADR 0111` cites the build).
 * No recording says which warrior is the hero, so the hero here is the first person stating one.
 */
export function composeRebuildingBattle(onPageCall?: (call: PageCall) => void) {
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
            const warrior = warriorsList[id] ??
                { $: composeTipHolder(registries, Number(id), onPageCall) };
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
function composeTipHolder(
    registries: Map<number, TooltipRegistry>,
    combatantId: number,
    onPageCall?: (call: PageCall) => void,
) {
    const get = (): TooltipRegistry => {
        onPageCall?.(PAGE_CALL.tooltip);
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
