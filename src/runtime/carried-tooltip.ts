/**
 * The add-on's own rows onto every fighter the game draws a tooltip for (`docs/design.md` §10.4),
 * gathered from the readers that know part of it: the mask says what stands on them, the
 * announcements how much, the clock how long, and the two legendary bonuses what is running and
 * what is spent.
 */

import { assert } from "@std/assert/assert";
import type * as errors from "#/libs/errors.ts";
import {
    type FightStandings,
    replayAuraStandings,
    type StatedSkills,
} from "#/src/core/aura-standing.ts";
import { type CarriedFigure, tallyCarriedFigures } from "#/src/core/carried-figure.ts";
import { COMBATANTS_MAXIMUM } from "#/src/core/combatant-roster.ts";
import type { FightView } from "#/src/core/fight-session.ts";
import type {
    MargonemEngineTooltipPort,
    TooltipWritten,
} from "#/src/ports/margonem-engine-tooltip.ts";
import type { MargonemEngineWarriorsExceeded } from "#/src/ports/margonem-engine-warriors.ts";
import {
    PANEL_WORDS,
    presentTooltipRows,
    type TooltipContent,
    type TranslateLabel,
} from "#/src/ui/panel-words.ts";

/** The frozen readings a tooltip's rows are worded and figured from, handed in by their holder. */
export interface TooltipTables {
    statedSkills: StatedSkills;
    keyByStatusBit: ReadonlyMap<number, string>;
    statusBits: readonly string[];
}

export function writeCarriedTooltips(
    view: FightView,
    tables: TooltipTables,
    translate: TranslateLabel | null,
    tooltip: MargonemEngineTooltipPort,
): TooltipWritten | MargonemEngineWarriorsExceeded | errors.Caught {
    const fightStandings = replayAuraStandings(view, tables.statedSkills);
    const figuresByCombatantAndBit = new Map<string, CarriedFigure>();
    const carried = tallyCarriedFigures({
        statuses: view.carriedStatuses,
        auras: fightStandings.auras,
        roster: view.roster,
        turnsByCombatantId: view.turnsByCombatantId,
        keyByStatusBit: tables.keyByStatusBit,
    });
    for (const carriedFigure of carried) {
        figuresByCombatantAndBit.set(
            `${carriedFigure.combatantId}/${carriedFigure.bit}`,
            carriedFigure,
        );
    }
    const rowsByCombatantId = new Map<number, readonly string[]>();
    for (const combatantId of view.roster.byId.keys()) {
        const tooltipContent = presentCarriedTooltip(
            combatantId,
            view,
            fightStandings,
            figuresByCombatantAndBit,
        );
        rowsByCombatantId.set(
            combatantId,
            presentTooltipRows(tooltipContent, translate, tables.statusBits),
        );
    }
    assert(
        rowsByCombatantId.size <= COMBATANTS_MAXIMUM,
        "a block per fighter the roster holds, and no more",
    );
    return tooltip.writeRows(rowsByCombatantId);
}

function presentCarriedTooltip(
    combatantId: number,
    view: FightView,
    fightStandings: FightStandings,
    figuresByCombatantAndBit: ReadonlyMap<string, CarriedFigure>,
): TooltipContent {
    const legendary = view.legendaryStandings.find((legendaryStanding) =>
        legendaryStanding.combatantId === combatantId
    );
    const provoked = fightStandings.provocations.find((provocation) =>
        provocation.provokedId === combatantId
    );
    const caster = provoked === undefined ? undefined : view.roster.byId.get(provoked.casterId);
    const statuses = view.carriedStatuses.filter((carriedStatus) =>
        carriedStatus.combatantId === combatantId
    );
    return {
        turnsTaken: view.turnsByCombatantId.get(combatantId) ?? 0,
        provokedBy: provoked === undefined ? null : {
            name: caster?.name ?? PANEL_WORDS.withoutActor,
            turnsElapsed: provoked.turnsElapsed,
            turnsStated: provoked.turnsStated,
        },
        provokedCount:
            fightStandings.provocations.filter((provocation) =>
                provocation.casterId === combatantId
            ).length,
        statuses: statuses.map((carriedStatus) => {
            const statusKey = `${carriedStatus.combatantId}/${carriedStatus.bit}`;
            const carriedFigure = figuresByCombatantAndBit.get(statusKey);
            return { bit: carriedStatus.bit, percent: carriedFigure?.percent ?? null };
        }),
        holytouchHealsReceived: legendary?.holytouchHealsReceived ?? null,
        hasSpentLastheal: legendary?.hasSpentLastheal ?? false,
        hasJoinedInProgress: view.hasJoinedInProgress,
    };
}
