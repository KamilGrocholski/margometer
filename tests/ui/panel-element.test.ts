/**
 * What the panel puts on the page, read back out of the document it was handed.
 *
 * The reading it draws comes from a real recording through every layer beneath it, so what is on
 * screen here is what would be on screen in play.
 */

import { assert, assertEquals } from "@std/assert";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import { composePanelHost } from "@/src/ui/panel-element.ts";
import { composePanelReading, type PanelReading } from "@/src/ui/panel-reading.ts";
import { getScreenFromName, SCREEN_ORDER } from "@/src/ui/panel-screen.ts";
import { PANEL_WORDS } from "@/src/ui/panel-words.ts";
import {
    composeFakeDocument,
    type FakeElement,
    getElementsWithin,
    getTextsByClass,
    pressElement,
} from "@/tests/fake-document.ts";
import { getRecordedCombatants, getRecordedPayloads } from "@/tests/recorded-fight.ts";

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur.json";

function readFight(): PanelReading {
    const roster = composeCombatantRoster(getRecordedCombatants(HILDUR));
    const events = getRecordedPayloads(HILDUR).flatMap((one) => decodeFightMessages(one, roster));
    return composePanelReading(composeFightStatistics(events), roster, "damageDealtApplied");
}

function draw(reading: PanelReading): FakeElement {
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    panel.show(reading, "damageDealtApplied");
    return panel.element as FakeElement;
}

Deno.test("the panel goes into a shadow root, under a name of ours", () => {
    const host = draw(readFight());
    assertEquals(host.attributes.get("id"), "MargoMeter-Panel", "the host is named as ours");
    assert(host.shadow !== null, "and everything else is behind a root of its own");
    assertEquals(host.children.length, 0, "nothing is put beside the root");
    assertEquals(host.shadow.length, 3, "the title bar, the strip of screens, and the body");
});

Deno.test("every name a reader meets before the panel's contents is ours", () => {
    const host = draw(readFight());
    const outside = [host, ...(host.shadow ?? [])];
    for (const element of outside) {
        if (element.className === "") continue;
        assert(element.className.startsWith("MargoMeter-"), `${element.className} is unprefixed`);
    }
    const inside = getElementsWithin(host).filter((one) => !outside.includes(one));
    assert(inside.length > 0, "and there is something inside the root to be exempt");
    assert(
        inside.some((one) => !one.className.startsWith("MargoMeter-")),
        "which is exempt, because the game's stylesheet cannot reach behind the root",
    );
});

Deno.test("the strip says which screen the panel is on, and marks it as more than a colour", () => {
    const host = draw(readFight());
    const tabs = getElementsWithin(host).filter((one) => one.className.startsWith("tab"));
    assertEquals(tabs.length, SCREEN_ORDER.length, "one tab for each screen there is");
    const current = tabs.filter((one) => one.className.includes("tab-current"));
    assertEquals(current.length, 1, "exactly one of them is where the panel is");
    assert(current[0]?.textContent.startsWith("• "), "and it is marked, not only tinted");
    for (const tab of tabs) {
        const screen = tab.attributes.get("data-screen");
        assert(screen !== undefined, "each tab says which screen it would reach");
        assert(getScreenFromName(screen) !== null, "by a name a screen answers to");
    }
});

Deno.test("a fight draws a row for everybody in it, named", () => {
    const reading = readFight();
    const host = draw(reading);
    // A pinned row is a row of the same shape, so the two are counted by the class that separates
    // them rather than by the name each carries.
    const rows = getElementsWithin(host).filter((one) => one.className === "row");
    assertEquals(rows.length, reading.rows.length, "one row for each of them");
    for (const row of rows) {
        const name = row.children.find((one) => one.className === "row-name");
        assert(name !== undefined, "each row says who it is about");
        assert(name.textContent.length > 0, "and says it in words");
    }
    const figures = getTextsByClass(host, "row-figure");
    assertEquals(figures[0], `${reading.rows[0]?.figure}`, "with the figure the reading holds");
});

Deno.test("a fight nothing has happened in says so, rather than drawing nothing", () => {
    const host = draw({ rows: [], total: 0, withoutActor: 0, withoutTarget: 0, isSuspect: false });
    assertEquals(getTextsByClass(host, "empty"), [PANEL_WORDS.nothingYet], "it says so in words");
    assertEquals(getTextsByClass(host, "row-name"), [], "and draws no row at all");
});

Deno.test("what nobody can be charged with is a row apart, and a doubt is said", () => {
    const reading = readFight();
    const host = draw(reading);
    assert(reading.withoutActor > 0, "this fight has damage tied to no attacker");
    const pinned = getElementsWithin(host).filter((one) => one.className === "pinned");
    assertEquals(pinned.length, 1, "which stands below the ranking as a row of its own");
    assert(reading.isSuspect, "and this fight carries the key still unread");
    assertEquals(getTextsByClass(host, "warning"), [PANEL_WORDS.suspect], "so the panel says so");
});

Deno.test("a press on a tab reaches the panel, and a press on anything else does not", () => {
    const document = composeFakeDocument();
    const pressed: string[] = [];
    const panel = composePanelHost(document, (screen) => pressed.push(screen), () => {});
    panel.show(readFight(), "damageDealtApplied");
    const host = panel.element as FakeElement;
    const tabs = getElementsWithin(host).filter((one) => one.className.startsWith("tab"));
    const other = tabs[1];
    assert(other !== undefined, "there is a screen to reach for");
    pressElement(host, "pointerdown", other);
    assertEquals(pressed, ["damageTakenApplied"], "the screen the tab names, and only it");

    const row = getElementsWithin(host).find((one) => one.className === "row");
    assert(row !== undefined, "there is a row to press");
    pressElement(host, "pointerdown", row);
    assertEquals(pressed.length, 1, "a row names no screen, so pressing it moves nothing");
});

Deno.test("the listener outlives a redraw, because the host does", () => {
    const document = composeFakeDocument();
    const pressed: string[] = [];
    const panel = composePanelHost(document, (screen) => pressed.push(screen), () => {});
    panel.show(readFight(), "damageDealtApplied");
    const host = panel.element as FakeElement;
    const before = getElementsWithin(host).filter((one) => one.className.startsWith("tab")).length;

    panel.show(readFight(), "healthRestored");
    const tabs = getElementsWithin(host).filter((one) => one.className.startsWith("tab"));
    assertEquals(tabs.length, before, "the strip is drawn again, not drawn twice");
    const current = tabs.filter((one) => one.className.includes("tab-current"));
    assertEquals(current[0]?.attributes.get("data-screen"), "healthRestored", "on the new screen");

    const tab = tabs[0];
    assert(tab !== undefined, "and the strip still has tabs");
    pressElement(host, "pointerdown", tab);
    assertEquals(pressed, ["damageDealtApplied"], "which a press still reaches, after the redraw");
});

Deno.test("a region that cannot be drawn is replaced by itself, and the rest stands", () => {
    const document = composeFakeDocument();
    const failures: unknown[] = [];
    const reading = readFight();
    const broken: PanelReading = {
        ...reading,
        get rows(): never {
            throw new RangeError("a region of ours failed");
        },
    };
    const panel = composePanelHost(document, () => {}, (failure) => failures.push(failure));
    panel.show(broken, "damageDealtApplied");
    const host = panel.element as FakeElement;
    assertEquals(failures.length, 1, "the failure is reported once");
    assertEquals(getTextsByClass(host, "undrawn"), [PANEL_WORDS.undrawn], "and marked in place");
    assertEquals(host.shadow?.length, 3, "while the panel keeps its shape");
    assertEquals(getTextsByClass(host, "MargoMeter-titlebar"), [PANEL_WORDS.title], "title stands");
});
