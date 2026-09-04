/**
 * A skill the game says somebody is making ready, and how far through the game says it is. The
 * percent is the client's own figure: nothing here computes one, and nothing turns it into turns.
 */

import { assert } from "@std/assert/assert";
import { getIntegerFromText } from "@/libs/number-text.ts";

/** What the value opens and closes with: `Lodowe Pandemonium(75%)`. */
const PERCENT_OPENER = "(";
const PERCENT_CLOSER = "%)";
export const FULL_CHARGE_PERCENT = 100;

export interface ChargeStanding {
    combatantId: number;
    /** The client's display text, kept as the game spells it (**L2**). */
    skillName: string;
    /** The game's own figure. Never a countdown and never turns. */
    percent: number;
}

/** The name runs to the **last** opener: a skill may carry a bracket and the percentage may not. */
export function readChargeFromText(
    text: string,
): { skillName: string; percent: number } | null {
    assert(typeof text === "string", "a charge is read off text the message carried");
    if (!text.endsWith(PERCENT_CLOSER)) return null;
    const opener = text.lastIndexOf(PERCENT_OPENER);
    if (opener <= 0) return null;
    const skillName = text.slice(0, opener);
    assert(skillName.length > 0, "a charge that is read names the skill the game named");
    const percentText = text.slice(opener + 1, text.length - PERCENT_CLOSER.length);
    const percent = getIntegerFromText(percentText);
    if (percent === null) return null;
    if (percent < 0) return null;
    if (percent > FULL_CHARGE_PERCENT) return null;
    assert(percentText.length < text.length, "a percentage is shorter than what carried it");
    return { skillName, percent };
}

export function isChargeFull(charge: ChargeStanding): boolean {
    assert(charge.percent >= 0, "a charge that is asked about was read");
    assert(charge.percent <= FULL_CHARGE_PERCENT, "and never past the whole of it");
    assert(charge.skillName.length > 0, "and names the skill the game named");
    return charge.percent === FULL_CHARGE_PERCENT;
}
