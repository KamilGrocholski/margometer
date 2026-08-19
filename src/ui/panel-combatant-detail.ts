/**
 * Everything a combatant's row says on demand, wherever the panel draws one.
 *
 * Its own file because the drill is the second consumer (§7.1): the card used to
 * be private to `src/ui/panel-view.ts`, so a player's row one level in was a name
 * and a figure and nothing else. It could not move the other way — `panel-view.ts`
 * imports `panel-drill.ts`, and a card kept in the first and read by the second is
 * one module split down the middle rather than two modules, which is the reason
 * `src/ui/panel-reading.ts` exists.
 *
 * ⚠️ **The figures are the whole fight's, at every level.** The card answers *who
 * is this*, and a person's totals do not narrow because the row under the pointer
 * does — but the row beneath it states a scoped figure, so where the two stand
 * together the card says which it is. That note is the whole of what `place`
 * decides, beside a gesture line that has to be true where it stands.
 *
 * **The strings are Polish and nothing else here is** (§3).
 */

import { composeIntegerText } from "@/libs/number.ts";
import type { CombatantStatistics } from "@/src/core/fight-statistics.ts";
import { composeFigureText } from "@/src/ui/panel-figure-text.ts";
import { METRIC_LABELS, PANEL_METRICS } from "@/src/ui/panel-metric.ts";
import {
  DEFENCE_NAMES,
  DESTRUCTION_NAMES,
  EFFECT_NAMES,
  getPhrase,
  PROFESSION_NAMES,
  type TranslateLabel,
} from "@/src/ui/panel-names.ts";
import { getMetricValue, getName, getRow, type PanelReading } from "@/src/ui/panel-reading.ts";
import type { PanelDetailLine } from "@/src/ui/panel-shape.ts";
import type { PanelState } from "@/src/ui/panel-state.ts";

/**
 * Which screen the card was opened on — one discriminant rather than two flags
 * set together, which is the invariant §9.5 puts in the type instead.
 *
 * `leaf` is not `breakdown` with a shorter note: a combatant row under an opened
 * skill opens no further level, and a card promising a gesture that does nothing
 * is the panel saying something untrue.
 */
export type PanelDetailPlace = "ranking" | "breakdown" | "leaf";

/**
 * Said only where the row beneath the card states a narrower figure than the card
 * does. On the ranking the two are the same number, and a note repeating that
 * would be a line of prose answering a question nobody has.
 */
const SCOPE_NOTES: Record<PanelDetailPlace, string | null> = {
  ranking: null,
  breakdown: "Liczby z całej walki.",
  leaf: "Liczby z całej walki.",
};

/**
 * The only instruction the panel gives, and each spelling is true where it
 * stands. Keyed by every place rather than by a boolean, so a fourth screen
 * cannot inherit a sentence nobody decided about — the shape `CLOSING_LABELS`
 * uses in `src/ui/panel-drill.ts`.
 */
const GESTURE_NOTES: Record<PanelDetailPlace, string> = {
  ranking: "LPM — rozbicie · PPM — powrót",
  breakdown: "LPM — rozbicie · PPM — powrót",
  leaf: "PPM — powrót",
};

/**
 * The counters line: how somebody fought, in one sentence.
 *
 * ⚠️ **Still no dodges, and the reason has changed.** It used to be that the
 * decoder had no entry for `-evade`; it has one now, and eight occurrences ride
 * the recordings (read 2026-08-19).
 * What stops it becoming `uniki 3` here is whose it would be: every flag is
 * counted against **whoever swung**, so on a row it means blows that combatant
 * threw and somebody dodged — not times they dodged. Under that label it would be
 * read as the second, so it stays among the effects, where the heading says the
 * figures belong to the blow (`CombatantStatistics.procsOnBlowsStruck`).
 */
function composeCounters(row: CombatantStatistics): string[] {
  // The bracket belongs to the number it breaks down: blows nobody announced are
  // part of the blows, not a second kind of thing standing beside them.
  const counters = [
    `ciosy ${composeFigureText(row.blowsStruck)}${
      row.blowsWithoutSkill > 0 ? ` (w tym ${composeFigureText(row.blowsWithoutSkill)} zwykłe)` : ""
    }`,
  ];

  const critical = row.procsOnBlowsStruck.get("crit") ?? 0;
  const veryCritical = row.procsOnBlowsStruck.get("legbon_verycrit") ?? 0;
  // The bracket belongs to the number it breaks down: very critical hits are part
  // of critical ones, and standing beside them as their own member would invite
  // adding the two.
  counters.push(
    `kryt. ${composeFigureText(critical)}${veryCritical > 0 ? ` (w tym ${composeFigureText(veryCritical)} bardzo)` : ""}`,
  );
  if (row.largestBlow > 0) counters.push(`maks. cios ${composeFigureText(row.largestBlow)}`);
  return counters;
}

/**
 * One line of the card that lines a figure up in a column. Exported because the
 * pinned row builds its own detail out of the same line and there is one spelling
 * of it, not two.
 */
export function composeStat(label: string, value: string, isStrong = false): PanelDetailLine {
  return { kind: "stat", label, value, isStrong };
}

/**
 * A destroyed statistic, with its unit — because the members do not share one.
 *
 * `+resdmg` is stated in **percentage points** while `+acdmg` and the two
 * absorption keys are in points, despite what `_per` in their names suggests
 * (`docs/protocol-keys.md`). Carrying the unit in the value is what keeps the
 * block honest without a total: four bare figures under one heading read as four
 * of the same thing, and adding them would be the mistake §10 names.
 */
function composeDestructionText(token: string, amount: number): string {
  return token === "resdmg" ? `${composeFigureText(amount)}%` : composeFigureText(amount);
}

/**
 * Everything a combatant's row says on demand.
 *
 * The order answers the question a person actually has, in the order they have
 * it: who is this, how much of each, over how many turns, how they fought, what
 * fired, what was stopped. The metric on screen is the one in bold — the others
 * are there so that "he dealt a lot, but how much did he take" needs no click.
 */
export function composeCombatantDetail(
  reading: PanelReading,
  combatantId: number,
  state: PanelState,
  translate: TranslateLabel | null,
  place: PanelDetailPlace,
): PanelDetailLine[] {
  const row = getRow(reading, combatantId);
  const combatant = reading.roster.byId.get(combatantId);
  const lines: PanelDetailLine[] = [{ kind: "title", text: getName(reading, combatantId) }];

  const profession = combatant?.profession ?? null;
  const level = combatant?.level ?? null;
  if (profession !== null || level !== null) {
    const named = profession === null ? "nieznana profesja" : getPhrase(PROFESSION_NAMES, profession, translate);
    lines.push({
      kind: "heading",
      text: level === null ? named : `${named} (${composeIntegerText(level)})`,
    });
  }

  for (const metric of PANEL_METRICS) {
    const value = getMetricValue(row, metric);
    lines.push(
      composeStat(METRIC_LABELS[metric], composeFigureText(value), metric === state.metric),
    );
    // Taken and dealt are each made of two readings — a blow, and health moved
    // outside one — so they say so where they stand rather than leaving the
    // difference to be discovered.
    //
    // ⚠️ **The second line used to read `bez sprawcy`, and that stopped being
    // true.** Part of what a combatant loses outside a blow now reaches the
    // attacker who applied it (§9.6), so a label naming the missing actor would
    // claim it of points that have one. What both lines say instead is where the
    // figure came from, which is true of every point in them and closes against
    // the figure above.
    if (metric === "taken" && row.healthLost > 0) {
      lines.push(composeStat("  z ciosów", composeFigureText(row.taken)));
      lines.push(composeStat("  poza ciosem", composeFigureText(row.healthLost)));
    }
    if (metric === "dealt" && row.healthLostCaused > 0) {
      lines.push(composeStat("  z ciosów", composeFigureText(row.dealtApplied)));
      lines.push(composeStat("  poza ciosem", composeFigureText(row.healthLostCaused)));
    }
  }

  if (row.skillsUsed > 0) {
    lines.push(composeStat("Użycia umiejętności", composeFigureText(row.skillsUsed)));
  }
  lines.push({ kind: "note", text: composeCounters(row).join(" · ") });

  const effects = [...row.procsOnBlowsStruck]
    .filter(([token]) => token !== "crit" && token !== "legbon_verycrit")
    .map(([token, count]) => `${getPhrase(EFFECT_NAMES, token, translate)} ×${composeFigureText(count)}`);
  if (effects.length > 0) {
    lines.push({ kind: "heading", text: "Efekty w ciosach" });
    lines.push({ kind: "note", text: effects.join(" · ") });
  }

  // Two blocks rather than one `·`-joined line, and they are separated because the
  // figures are not the same kind of thing: one is damage that did not arrive, the
  // other is a statistic of this combatant that an attacker reduced. Strung
  // together they read as one list of "defence stuff" and invited an addition
  // across units that §10 forbids.
  const stopped = [...row.prevented].filter(([, amount]) => amount > 0);
  if (stopped.length > 0) {
    lines.push({ kind: "heading", text: "Zatrzymane" });
    for (const [token, amount] of stopped) {
      lines.push(composeStat(getPhrase(DEFENCE_NAMES, token, translate), composeFigureText(amount)));
    }
    // Said once, where the figures are: a defence is one part of the reduction and
    // the protocol reports neither armour nor resistance, so these do not add up to
    // what a blow lost on the way in (§10).
    lines.push({ kind: "note", text: "To część tego, co nie doszło — reszty gra nie podaje." });
  }

  const destroyed = [...row.destroyed].filter(([, amount]) => amount > 0);
  if (destroyed.length > 0) {
    lines.push({ kind: "heading", text: "Zniszczone" });
    for (const [token, amount] of destroyed) {
      lines.push(composeStat(getPhrase(DESTRUCTION_NAMES, token, translate), composeDestructionText(token, amount)));
    }
  }

  // The card is about the person, so its figures are the fight's — and one level
  // in, the row it stands over states a narrower one. Said at the foot rather than
  // beside the stats: it answers for every number above it, not for one block.
  const scope = SCOPE_NOTES[place];
  if (scope !== null) lines.push({ kind: "note", text: scope });

  lines.push({ kind: "note", text: GESTURE_NOTES[place] });
  return lines;
}
