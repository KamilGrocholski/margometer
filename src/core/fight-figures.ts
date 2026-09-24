/**
 * The figures of one fight, tallied from its view and verified in one place (`docs/design.md`
 * §6.5). Tallying returns figures, not a `Result`: every way it could fail ends where a broken
 * invariant ends, in the defect `runGuarded` leaves, so a failure type would change no outcome.
 *
 * Team heals are sized over the whole fight, because sizing one reads messages from later payloads,
 * so figures are tallied from the view rather than folded in as payloads arrive.
 */

import { assert } from "@std/assert/assert";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import { indexTeamHeals, type TeamHeal } from "@/src/core/combatant-health.ts";
import type { FightView } from "@/src/core/fight-session.ts";
import {
    type FightStatistics,
    tallyFightStatistics,
    verifyFightStatistics,
} from "@/src/core/fight-statistics.ts";

export interface FightFigures {
    statistics: FightStatistics;
    heals: ReadonlyMap<BattleEvent, TeamHeal>;
    /** What the view had applied when these were tallied: the key a caller memoises on. */
    payloadsApplied: number;
}

export function tallyFightFigures(view: FightView): FightFigures {
    assert(view.payloadsApplied > 0, "figures are tallied from a fight that exists");
    const heals = indexTeamHeals(view.events, view.roster);
    const statistics = tallyFightStatistics(view.events, heals);
    assert(heals.size <= view.events.length, "a cast sized is an event of the fight");
    return { statistics, heals, payloadsApplied: view.payloadsApplied };
}

/** The balances in one place: assertions only. */
export function verifyFightFigures(figures: FightFigures): void {
    assert(figures.payloadsApplied > 0, "figures verified were tallied from a fight");
    assert(figures.statistics.castsStated >= figures.heals.size, "a cast sized was stated");
    verifyFightStatistics(figures.statistics);
}
