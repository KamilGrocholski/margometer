/**
 * The set of pictures, held without a browser: the directory against the sidecar beside it, the
 * version the set states against the tree, the moment the underway pictures are taken at against
 * the recording, and the frame against a panel that did not reach its corner. Taking the pictures
 * is `deno task panel:shots`'s, and needs Chrome.
 */

import { assert, assertEquals, assertExists, assertStrictEquals, assertThrows } from "@std/assert";
import { parseJson } from "#/libs/json-text.ts";
import { isRecord } from "#/libs/unknown-value.ts";
import { CHARGED_SKILL_STATE } from "#/src/core/charged-skill.ts";
import { type FightView, SESSION_OPTIONS } from "#/src/core/fight-session.ts";
import { replayFightPayloads } from "#/src/runtime/fight-state.ts";
import { PANEL_MARK } from "#/src/ui/panel-intent.ts";
import { PLACE, TYPE_TOKENS } from "#/src/ui/panel-look.ts";
import { TYPE_STEP_DEFAULT } from "#/src/ui/panel-choice.ts";
import { composeRuntimeTables } from "#/src/userscript-entry.ts";
import { lookupRecordedFight } from "#/tests/recorded-fights.ts";
import { parseDeclaredVersion } from "#/tools/build-userscript.ts";
import { PanelShotError } from "#/tools/margometer-tool-error.ts";
import {
    BROWSER_VARIABLE,
    composePanelShots,
    composeShotClip,
    isSameBesideVersion,
    lookupShotEntry,
    SHOT_DIRECTORY,
    SHOT_MOMENT,
    SIDECAR_NAME,
    UNDERWAY_ENTRY,
} from "#/tools/panel-shots.ts";
import { LANDING_RECORDING } from "#/tools/preview-site.ts";

const VIEWPORT_WIDTH = 1280;

Deno.test("the reader flags a set at odds with its sidecar, and passes one that is not", () => {
    assertEquals(lookupSetDisagreements(["a.png", SIDECAR_NAME], ["a.png"]), []);
    assertEquals(lookupSetDisagreements(["a.png", "b.png"], ["a.png", "c.png"]), [
        "b.png is there and unnamed",
        "c.png is named and gone",
    ]);
});

/** What the directory holds against what the sidecar names, in both directions. */
function lookupSetDisagreements(held: readonly string[], named: readonly string[]): string[] {
    const disagreements: string[] = [];
    for (const name of held) {
        if (name === SIDECAR_NAME) continue;
        if (!named.includes(name)) disagreements.push(`${name} is there and unnamed`);
    }
    for (const name of named) {
        if (!held.includes(name)) disagreements.push(`${name} is named and gone`);
    }
    return disagreements;
}

Deno.test("whatever is in the directory agrees with the sidecar standing beside it", () => {
    const sidecar = readSidecar();
    const shots = sidecar.shots;
    assert(Array.isArray(shots), "the sidecar lists the pictures it names");
    const named = shots.map((shot) => isRecord(shot) ? String(shot.name) : "");
    const held = [...Deno.readDirSync(SHOT_DIRECTORY)].map((directoryEntry) => directoryEntry.name);
    assertEquals(lookupSetDisagreements(held, named), [], "a leftover picture looks current");
    const calls = lookupRecordedFight(`captures/${sidecar.fight}.json`).updates.length;
    for (const shot of shots) {
        assert(isRecord(shot), "each picture is a record");
        assert(typeof shot.entry === "number", `${shot.name}: says how far into the fight it is`);
        assert(shot.entry > 0, `${shot.name}: of a fight something was read of`);
        assert(shot.entry <= calls, `${shot.name}: and one the recording reaches`);
    }
});

function readSidecar(): Record<string, unknown> {
    const parsed = parseJson(Deno.readTextFileSync(`${SHOT_DIRECTORY}/${SIDECAR_NAME}`));
    assert(!(parsed instanceof Error), "the sidecar beside the set is JSON");
    assert(isRecord(parsed), "and is a record");
    return { ...parsed };
}

Deno.test("the set was taken at a version this tree is", () => {
    const stated = readSidecar().version;
    const declared = parseDeclaredVersion(Deno.readTextFileSync("deno.json"));
    assert(
        stated === declared || stated === `${declared}-dev`,
        `the set says ${stated} and the tree declares ${declared} — take the set again`,
    );
});

/**
 * Every picture of the set but the shelf stands on a fight going on, with a charge that has pips
 * left to light, and the shelf on one that ended. Proved both ways: the entry that must pass, and the end, which must not.
 */
Deno.test("the moment the underway pictures are taken at is one a fight is going at", () => {
    const fight = lookupRecordedFight(LANDING_RECORDING);
    const viewAt = (entryNumber: number) => {
        const tables = composeRuntimeTables().decoder;
        const replayed = replayFightPayloads(
            fight.updates.slice(0, entryNumber),
            tables,
            SESSION_OPTIONS,
        );
        assert(!(replayed instanceof Error), "the recording replays through the runtime's chain");
        assert(replayed !== null, "and opens a fight");
        return replayed.view;
    };
    assertEquals(
        lookupUnderwayObjections(viewAt(UNDERWAY_ENTRY)),
        [],
        "the entry the underway pictures are taken at",
    );
    const end = lookupUnderwayObjections(viewAt(fight.updates.length));
    assert(end.includes("the fight had already ended"), "and the end of it is not one");
});

/**
 * Why a moment is not one the underway pictures may be taken at, collected rather than thrown at
 * the first, so a moved `UNDERWAY_ENTRY` lights each clause on its own.
 */
function lookupUnderwayObjections(view: FightView): string[] {
    const objections: string[] = [];
    if (view.isOver) objections.push("the fight had already ended");
    if (view.turnStatement === null) objections.push("no turn was stated");
    const charging = view.chargedSkills.filter((standing) =>
        standing.state === CHARGED_SKILL_STATE.charging
    );
    if (charging.length !== 1) {
        objections.push(`${charging.length} charges stood, and one is wanted`);
    }
    for (const standing of charging) {
        if (standing.turnsStated < 2) {
            objections.push(`${standing.skillName} states one turn, one pip`);
        }
        if (standing.turnsElapsed >= standing.turnsStated) {
            objections.push(`${standing.skillName} has no turn left`);
        }
    }
    return objections;
}

Deno.test("a moment is where in the fight the picture is taken", () => {
    assertStrictEquals(lookupShotEntry(SHOT_MOMENT.underway, 99), UNDERWAY_ENTRY);
    assertStrictEquals(lookupShotEntry(SHOT_MOMENT.over, 99), 99, "the end of the fight");
});

Deno.test("the set is taken at both moments, and the shelf at only the end", () => {
    const shots = composePanelShots();
    assert(shots.every((shot) => shot.name.endsWith(".png")), "every picture is named as one");
    const underway = shots.filter((shot) => shot.moment === SHOT_MOMENT.underway);
    assertStrictEquals(underway.length, shots.length - 1, "every picture but one is of it going");
    const over = shots.filter((shot) => shot.moment === SHOT_MOMENT.over).map((shot) => shot.name);
    assertEquals(over, ["panel-shelf.png"], "and that one is the shelf, kept where a fight ends");
});

Deno.test("the card is photographed over a person's row, never over the fight's line", () => {
    const card = composePanelShots().find((shot) => shot.name === "panel-card.png");
    assertExists(card, "the set has a picture of a card");
    assertEquals(
        card.steps.at(-1),
        { doesHover: true, mark: PANEL_MARK.row, at: 0 },
        "the first row's, as the READMEs show a person's card (ADR 0014 gave the line one)",
    );
});

Deno.test("a frame holds the windows and their card, from the leftmost to the corner", () => {
    const panelLeft = VIEWPORT_WIDTH - PLACE.insetPixels -
        TYPE_TOKENS[TYPE_STEP_DEFAULT].meterWidthPixels;
    const panel = {
        x: panelLeft,
        y: 8,
        width: TYPE_TOKENS[TYPE_STEP_DEFAULT].meterWidthPixels,
        height: 400,
    };
    const standing = { x: panelLeft - 220, y: 8, width: 210, height: 120 };
    const card = { x: panelLeft - 260, y: 120, width: 250, height: 520 };
    assertEquals(composeShotClip([panel, standing], VIEWPORT_WIDTH), {
        x: standing.x - PLACE.insetPixels,
        y: 0,
        width: VIEWPORT_WIDTH - standing.x + PLACE.insetPixels,
        height: 408 + PLACE.insetPixels,
    });
    const withCard = composeShotClip([panel, standing, card], VIEWPORT_WIDTH);
    assertStrictEquals(withCard.x, card.x - PLACE.insetPixels, "the card widens the frame");
    assertStrictEquals(withCard.height, 640 + PLACE.insetPixels, "and deepens it");
});

Deno.test("a panel that never reached its corner is refused, not photographed", () => {
    const astray = {
        x: 500,
        y: 8,
        width: TYPE_TOKENS[TYPE_STEP_DEFAULT].meterWidthPixels,
        height: 400,
    };
    assertThrows(() => composeShotClip([astray], VIEWPORT_WIDTH), PanelShotError, "corner");
    assertThrows(() => composeShotClip([], VIEWPORT_WIDTH), PanelShotError, "of the panel");
});

Deno.test("both runs that drive a browser name the same variable", () => {
    const config = Deno.readTextFileSync("playwright.config.ts");
    assert(config.includes(`BROWSER_VARIABLE = "${BROWSER_VARIABLE}";`), "one spelling, twice");
});

Deno.test("a release's own number is no work under the set, and anything beside it is", () => {
    const committed =
        '{\n    // The last version released.\n    "version": "0.22.0",\n    "imports": {}\n}';
    const declared = committed.replace('"0.22.0"', '"0.22.1"');
    assert(isSameBesideVersion(committed, committed), "an untouched configuration");
    assert(isSameBesideVersion(committed, declared), "the number a release declares");
    const imported = declared.replace('"imports": {}', '"imports": { "@std/x": "jsr:@std/x" }');
    assert(!isSameBesideVersion(committed, imported), "an import the bundle would build with");
    assert(!isSameBesideVersion(committed, "[]"), "and one that is no configuration");
    assert(!isSameBesideVersion(committed, "{"), "nor one that does not parse, which is carried");
});
