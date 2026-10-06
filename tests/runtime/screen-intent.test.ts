/**
 * Where a press leaves the panel's screen, rung by rung: into a person's figure, onto the end it
 * left out, and back out one rung at a time to the ranking.
 */

import { AssertionError, assertStrictEquals, assertThrows } from "@std/assert";
import { executeScreenIntent } from "#/src/runtime/margometer-runtime.ts";
import { PANEL_INTENT } from "#/src/ui/panel-intent.ts";
import { UNNAMED_END } from "#/src/ui/panel-content.ts";
import { createScreenState, OPENED_PART, PANEL_METRIC } from "#/src/ui/panel-screen.ts";

const PERSON = 469658;
const OTHER = 469659;

Deno.test("the end a person's figure left out opens under them, and closes before they do", () => {
    const screen = { ...createScreenState(false), metric: PANEL_METRIC.damageTaken };
    executeScreenIntent(screen, { kind: PANEL_INTENT.openRow, combatantId: PERSON });
    const opened = executeScreenIntent(screen, {
        kind: PANEL_INTENT.openUnnamed,
        end: UNNAMED_END.actor,
    });
    assertStrictEquals(opened, true, "the press moves the screen");
    assertStrictEquals(screen.openedCombatantId, PERSON, "the person stays open");
    assertStrictEquals(screen.openUnnamedEnd, UNNAMED_END.actor, "with the end under them");

    assertStrictEquals(executeScreenIntent(screen, { kind: PANEL_INTENT.close }), true, "back");
    assertStrictEquals(screen.openUnnamedEnd, null, "the end closes first");
    assertStrictEquals(
        screen.openedCombatantId,
        PERSON,
        "and the person is where the reader returns to",
    );

    assertStrictEquals(executeScreenIntent(screen, { kind: PANEL_INTENT.close }), true, "back");
    assertStrictEquals(screen.openedCombatantId, null, "then the person closes");
    assertStrictEquals(
        executeScreenIntent(screen, { kind: PANEL_INTENT.close }),
        false,
        "and on the ranking there is no rung left to leave",
    );
});

Deno.test("a pinned row still opens from the ranking and closes in one step", () => {
    const screen = createScreenState(false);
    executeScreenIntent(screen, { kind: PANEL_INTENT.openUnnamed, end: UNNAMED_END.actor });
    assertStrictEquals(screen.openedCombatantId, null, "nobody's row is open under a pinned one");
    assertStrictEquals(screen.openUnnamedEnd, UNNAMED_END.actor, "the pinned row is");
    executeScreenIntent(screen, { kind: PANEL_INTENT.close });
    assertStrictEquals(screen.openUnnamedEnd, null, "and one step back is the ranking");
});

Deno.test("an end left out is pressed from the level over it, never beside a pair or a part", () => {
    const paired = {
        ...createScreenState(false),
        openedCombatantId: PERSON,
        pairCombatantId: OTHER,
    };
    assertThrows(
        () =>
            executeScreenIntent(paired, { kind: PANEL_INTENT.openUnnamed, end: UNNAMED_END.actor }),
        AssertionError,
        "pressed from the level over it",
    );
    const parted = {
        ...createScreenState(false),
        openedCombatantId: PERSON,
        openPart: { kind: OPENED_PART.plain },
    };
    assertThrows(
        () =>
            executeScreenIntent(parted, { kind: PANEL_INTENT.openUnnamed, end: UNNAMED_END.actor }),
        AssertionError,
        "never from a part's level",
    );
    const opened = {
        ...createScreenState(false),
        openedCombatantId: PERSON,
        openUnnamedEnd: UNNAMED_END.actor,
    };
    assertThrows(
        () => executeScreenIntent(opened, { kind: PANEL_INTENT.openRow, combatantId: OTHER }),
        AssertionError,
        "not a pair with somebody",
    );
});
