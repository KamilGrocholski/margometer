/**
 * The add-on's own rows onto every fighter the game draws a tooltip for (`docs/design.md` §10.4),
 * gathered from the readers that know part of it: the envelope says what they are making ready,
 * the mask what stands on them, the announcements how much, the clock how long, and the two
 * legendary bonuses what is running and what is spent.
 */

import { assert } from "@std/assert/assert";
import type { ForeignFailure, Result } from "#/libs/result.ts";
import {
    type FightStandings,
    replayFightStandings,
    type StatedSkills,
} from "#/src/core/aura-standing.ts";
import { type CarriedFigure, tallyCarriedFigures } from "#/src/core/carried-figure.ts";
import { CHARGED_SKILL_STATE } from "#/src/core/charged-skill.ts";
import { COMBATANTS_MAXIMUM } from "#/src/core/combatant-roster.ts";
import type { FightView } from "#/src/core/fight-session.ts";
import type { TooltipPort, TooltipWritten } from "#/src/game/engine-tooltip.ts";
import {
    PANEL_WORDS,
    presentTooltipRows,
    type TooltipReading,
    type TranslateLabel,
} from "#/src/ui/panel-words.ts";

/** The frozen readings a tooltip's rows are worded and figured from, handed in by their holder. */
export interface TooltipTables {
    statedSkills: StatedSkills;
    witnessedKeyByBit: ReadonlyMap<number, string>;
    statusBits: readonly string[];
}

export function writeCarriedTooltips(
    view: FightView,
    tables: TooltipTables,
    translate: TranslateLabel | null,
    tooltip: TooltipPort,
): Result<TooltipWritten, ForeignFailure> {
    const held = replayFightStandings(view, tables.statedSkills);
    const figures = new Map<string, CarriedFigure>();
    const carried = tallyCarriedFigures({
        statuses: view.carriedStatuses,
        standings: held.standings,
        roster: view.roster,
        turnsByCombatantId: view.turnsByCombatantId,
        witnessed: tables.witnessedKeyByBit,
    });
    for (const one of carried) figures.set(`${one.combatantId}/${one.bit}`, one);
    const rows = new Map<number, readonly string[]>();
    for (const combatantId of view.roster.byId.keys()) {
        const reading = presentCarriedTooltip(combatantId, view, held, figures);
        rows.set(combatantId, presentTooltipRows(reading, translate, tables.statusBits));
    }
    assert(rows.size <= COMBATANTS_MAXIMUM, "a block per fighter the roster holds, and no more");
    return tooltip.writeRows(rows);
}

function presentCarriedTooltip(
    combatantId: number,
    view: FightView,
    held: FightStandings,
    figures: ReadonlyMap<string, CarriedFigure>,
): TooltipReading {
    const charging = view.chargedSkills.find((one) => {
        if (one.state !== CHARGED_SKILL_STATE.charging) return false;
        return one.combatantId === combatantId;
    });
    const legendary = view.legendaryStandings.find((one) => one.combatantId === combatantId);
    const provoked = held.provocations.find((one) => one.provokedId === combatantId);
    const caster = provoked === undefined ? undefined : view.roster.byId.get(provoked.casterId);
    const statuses = view.carriedStatuses.filter((one) => one.combatantId === combatantId);
    assert(statuses.length <= view.carriedStatuses.length, "a fighter carries part of the fight");
    return {
        turnsTaken: view.turnsByCombatantId.get(combatantId) ?? 0,
        charge: charging === undefined ? null : {
            skillName: charging.skillName,
            turnsElapsed: charging.turnsElapsed,
            turnsStated: charging.turnsStated,
        },
        provokedBy: provoked === undefined ? null : {
            name: caster?.name ?? PANEL_WORDS.withoutActor,
            turnsElapsed: provoked.turnsElapsed,
            turnsStated: provoked.turnsStated,
        },
        provokes: held.provocations.filter((one) => one.casterId === combatantId).length,
        statuses: statuses.map((one) => ({
            bit: one.bit,
            percent: figures.get(`${one.combatantId}/${one.bit}`)?.percent ?? null,
        })),
        holytouchHealsGiven: legendary?.holytouchHealsGiven ?? null,
        hasSpentLastheal: legendary?.hasSpentLastheal ?? false,
        wasJoinedInProgress: view.hasJoinedInProgress,
    };
}
