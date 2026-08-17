/**
 * What the panel shows, as data: the ranking, and the arithmetic one screen is.
 *
 * The drawing is a separate file and a thin one, because everything worth
 * getting right is here: which rows exist, in what order, how long each bar is,
 * what each figure is divided by, and which of them cannot be trusted. None of
 * that needs a browser to check, and there is no browser in the test runner.
 *
 * §9.1 holds even inside `ui/`: nothing here computes a statistic. It takes what
 * the aggregate produced and decides how to present it.
 *
 * **What is no longer here**, because this file had grown into four subjects and
 * its own docblocks into a table of contents
 * (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F26): the
 * vocabulary and the control strips (`panel-metric.ts`), the shape the drawing
 * consumes (`panel-shape.ts`), the reading and the three questions everything asks
 * of a combatant (`panel-reading.ts`), the levels a row opens onto
 * (`panel-drill.ts`), the sentences said where the game names nobody
 * (`panel-nobody.ts`) and a figure as text (`panel-figure-text.ts`). What stayed
 * is one screen: the list, the figure pinned under it, what every share divides by,
 * and the summary and warnings standing over the lot — the arithmetic that has to
 * agree with itself, kept where a disagreement is visible in one file.
 *
 * **The strings are Polish and nothing else here is** (§3). A sentence a player
 * reads never carries our vocabulary: it says what cannot be known, not why our
 * reader cannot know it. Every name of the game's own — a key, an effect token —
 * is named before it reaches a label, and `src/ui/panel-names.ts` decides by
 * whom: the running client where it has a name for the thing, and this
 * repository where it has not. A token nobody has named travels as the game
 * wrote it rather than as a guess.
 */

import { composeIntegerText } from "@/libs/number.ts";
import { setRunningTotal } from "@/libs/running-total.ts";
import { getCombatantIdByName } from "@/src/core/combatant-roster.ts";
import {
  getCombatantIdsInFight,
  type CombatantStatistics,
} from "@/src/core/fight-statistics.ts";
import { composeBreakdownLists, composeDeepLists } from "@/src/ui/panel-drill.ts";
import { composeFigureText, composeShareText } from "@/src/ui/panel-figure-text.ts";
import {
  composeDirectionTabs,
  composeNounTabs,
  composeTeamTabs,
  isGivenMetric,
  isHealingMetric,
  METRIC_LABELS,
  PANEL_METRICS,
  TEAM_LABELS,
  type PanelMetric,
  type PanelTeam,
} from "@/src/ui/panel-metric.ts";
import {
  DEFENCE_NAMES,
  DESTRUCTION_NAMES,
  EFFECT_NAMES,
  ELEMENT_NAMES,
  getPhrase,
  HEALTH_GAIN_SOURCE_NAMES,
  HEALTH_LOSS_SOURCE_NAMES,
  PROFESSION_NAMES,
  type TokenName,
  type TranslateLabel,
} from "@/src/ui/panel-names.ts";
import {
  getPinnedBreakdownHeading,
  getPinnedLeftover,
  getPinnedLimitNote,
  getPinnedStandingNote,
  NOBODY_LABEL,
  NOBODY_SCOPE_NOTE,
} from "@/src/ui/panel-nobody.ts";
import {
  getDamageWithoutActor,
  getHealingWithoutHealer,
  getMetricValue,
  getName,
  getRow,
  type PanelReading,
} from "@/src/ui/panel-reading.ts";
import { composeCombatantRowKey, NOBODY_ROW_KEY } from "@/src/ui/panel-row-key.ts";
import type {
  PanelCrumb,
  PanelDetailLine,
  PanelList,
  PanelRow,
  PanelSides,
  PanelView,
  PanelWaiting,
} from "@/src/ui/panel-shape.ts";
import type { PanelState } from "@/src/ui/panel-state.ts";
import { getProfessionColour, UNKNOWN_COLOUR } from "@/src/ui/panel-tokens.ts";

/** The share of a bar this figure fills, and never a `NaN` that would blank the rest. */
function getFill(value: number, largest: number): number {
  if (largest <= 0) return 0;
  return value / largest;
}

/** The bracket beside the figure: what share of the whole it is. */
function composeBracket(share: number): string {
  return `(${composeShareText(share)})`;
}

/**
 * Whether the pinned figure is inside the denominator this screen divides by.
 *
 * The pinned row is fight-wide and says so, but `getWholeOnScreen` under a side
 * filter is the rows that filter admits. Under a *given* direction that is still
 * one whole containing the figure — `getFigureOutsideRows` adds it. Under a
 * *received* one it does not: the health landed on somebody, so what is added is
 * only the part no row holds at all, which is zero on every capture. A fight-wide
 * numerator over one side's denominator then reads as a share of something that
 * does not exist.
 *
 * ⚠️ **Measured, not feared.** Over the material as it stood when this was
 * decided, a fifth of the filtered received screens printed a share above a
 * hundred — 320% under `Leczenie · Oni` on
 * `tests/captured-fights/2026-08-11-tempest-tancerz-vs-wermont.json`, 248% under
 * `Leczenie · My` on
 * `tests/captured-fights/2026-08-12-tempest-grupa-vs-hildur-2.json` — and two
 * printed `(0%)` beside a five-figure number, because the opposing side received
 * no healing and the denominator was zero. Both are the same fault from opposite
 * ends, and §9.6 forbids the second twice over: a real figure drawn as nothing.
 */
function hasShareOnScreen(state: PanelState): boolean {
  return state.team === "all" || isGivenMetric(state.metric);
}

/**
 * Everyone the current filter admits, biggest first.
 *
 * **Everyone in the fight, not everyone the aggregate counted** — a combatant
 * who has not acted yet is on the list, on zero
 * (`getCombatantIdsInFight`). Where they stand is the game's own roster order,
 * which is also the second sort key: at the start of a fight every figure is
 * zero, so the whole list is one tie and reads in the order the client listed
 * the warriors.
 *
 * ⚠️ **A second key is what stops the list reshuffling under the eye** — the
 * panel redraws every few seconds — so it has to be a property of the fight
 * rather than of the figures. Position was chosen over the collated name it
 * replaced because a name orders strangers alphabetically and a roster orders
 * them the way the game already showed them.
 *
 * Sorted on a decorated copy: the position has to survive the filter, and
 * looking it back up would be an index that has to prove itself for no reason
 * (§9.5 — the fix belongs in the shape, not in an assertion).
 */
function getRankedIds(reading: PanelReading, state: PanelState): number[] {
  const inFight = getCombatantIdsInFight(reading.statistics, reading.roster)
    .filter((id) => {
      const side = reading.roster.byId.get(id)?.side ?? null;
      if (state.team === "all") return true;
      if (side === null || reading.ourSide === null) return false;
      return state.team === "mine" ? side === reading.ourSide : side !== reading.ourSide;
    })
    .map((id, position) => ({
      id,
      position,
      value: getMetricValue(getRow(reading, id), state.metric),
    }));

  inFight.sort((one, other) => other.value - one.value || one.position - other.position);
  return inFight.map(({ id }) => id);
}

/**
 * The counters line: how somebody fought, in one sentence.
 *
 * ⚠️ **Still no dodges, and the reason has changed.** It used to be that the
 * decoder had no entry for `-evade`; it has one now, and the captures carry three.
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

function composeStat(label: string, value: string, isStrong = false): PanelDetailLine {
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
function composeCombatantDetail(
  reading: PanelReading,
  combatantId: number,
  state: PanelState,
  translate: TranslateLabel | null,
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
    // Taken is the one figure made of two readings, so it says so where it
    // stands rather than leaving the difference to be discovered.
    if (metric === "taken" && row.healthLost > 0) {
      lines.push(composeStat("  z ciosów", composeFigureText(row.taken)));
      lines.push(composeStat("  bez sprawcy", composeFigureText(row.healthLost)));
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

  // The only instruction the panel gives, and it is true at every level: there is
  // always somewhere to go back to once there is somewhere to go into.
  lines.push({ kind: "note", text: "LPM — rozbicie · PPM — powrót" });
  return lines;
}

/** One ranking row. The bar is measured against the biggest figure on screen. */
function composeRankedRow(
  reading: PanelReading,
  state: PanelState,
  combatantId: number,
  rank: number,
  whole: number,
  largest: number,
  translate: TranslateLabel | null,
): PanelRow {
  const raw = getMetricValue(getRow(reading, combatantId), state.metric);
  return {
    key: composeCombatantRowKey(combatantId),
    rank,
    label: getName(reading, combatantId),
    profession: reading.roster.byId.get(combatantId)?.profession ?? null,
    colour: getProfessionColour(reading.roster.byId.get(combatantId)?.profession ?? null),
    fill: getFill(raw, largest),
    valueText: composeFigureText(raw),
    bracketText: composeBracket(whole > 0 ? raw / whole : 0),
    isDrillable: true,
    detail: composeCombatantDetail(reading, combatantId, state, translate),
  };
}

/**
 * Damage nobody can be charged with — ticking poison, a wound delivered later.
 *
 * Fight-wide even under a side filter, because there is no actor to split it by.
 * Splitting it by *victim* would be a different axis than the list uses and would
 * read as if that side had dealt it, so the detail says the scope out loud
 * instead.
 */
function getUnattributedDamage(reading: PanelReading): number {
  let total = reading.statistics.unattributed.dealtApplied;
  for (const row of reading.statistics.byCombatantId.values()) total += row.healthLost;
  return total;
}

/**
 * What the pinned figure was made of, by the key the game stated it under.
 *
 * ⚠️ **The bucket for a blow nobody can be charged with is part of it.** Summing
 * the rows' `healthLostBySource` alone left out `unattributed.dealtApplied`, which
 * `getUnattributedDamage` adds — so the cut totalled less than the figure above it
 * with nothing saying why, which is the failure this panel exists to prevent, in
 * miniature (`docs/specs/2026-08-11-the-panel-that-drills.md`). Zero on every
 * capture and therefore invisible, but a fight joined in progress resolves no name
 * at all (`src/core/fight-decoder.ts`) and that is where the whole figure goes.
 *
 * Two vocabularies, because the two halves are keyed differently: the bucket holds
 * damage **elements**, the rows hold the keys health fell under. The same pair
 * `composeSourceEntries` already draws on `Otrzymane`.
 */
function getUnattributedDamageBySource(
  reading: PanelReading,
): Array<{ names: Record<string, TokenName>; token: string; amount: number }> {
  const elements = new Map<string, number>();
  for (const [token, amount] of reading.statistics.unattributed.dealtAppliedByElement) {
    setRunningTotal(elements, token, amount);
  }

  const sources = new Map<string, number>();
  for (const row of reading.statistics.byCombatantId.values()) {
    for (const [token, amount] of row.healthLostBySource) {
      setRunningTotal(sources, token, amount);
    }
  }

  return [
    ...[...elements].map(([token, amount]) => ({ names: ELEMENT_NAMES, token, amount })),
    ...[...sources].map(([token, amount]) => ({ names: HEALTH_LOSS_SOURCE_NAMES, token, amount })),
  ];
}

/**
 * The same for healing, and the reason `healedWithoutHealerBySource` exists.
 *
 * `healedBySource` would be the wrong map by a wide margin — it holds every point
 * restored, including the ones an announcement gave a healer to, which are exactly
 * the points this row does **not** stand for. Measured on
 * `tests/captured-fights/2026-08-12-tempest-grupa-vs-hildur-2.json`: 109 113 with
 * no healer against 123 506 summed over `healedBySource`.
 *
 * The bucket is read alongside the rows rather than left out: healing that reached
 * a name nobody could place carries its key just the same.
 */
function getUnattributedHealingBySource(
  reading: PanelReading,
): Array<{ names: Record<string, TokenName>; token: string; amount: number }> {
  const sources = new Map<string, number>();
  for (const row of [...reading.statistics.byCombatantId.values(), reading.statistics.unattributed]) {
    for (const [token, amount] of row.healedWithoutHealerBySource) {
      setRunningTotal(sources, token, amount);
    }
  }
  return [...sources].map(([token, amount]) => ({ names: HEALTH_GAIN_SOURCE_NAMES, token, amount }));
}

/**
 * The other cut of the same figure: whom the health it moved reached.
 *
 * Read off the rows, so what is left over is what no row holds — handed back
 * beside the pairs rather than folded into them, because the two are different
 * claims and `panel-nobody.ts` words the second one carefully.
 */
function getUnattributedByCombatant(
  reading: PanelReading,
  state: PanelState,
  whole: number,
): { pairs: Array<[number, number]>; leftover: number } {
  const pairs: Array<[number, number]> = [];
  for (const [id, row] of reading.statistics.byCombatantId) {
    const amount = isHealingMetric(state.metric)
      ? getHealingWithoutHealer(row)
      : row.healthLost + getDamageWithoutActor(row);
    if (amount > 0) pairs.push([id, amount]);
  }
  pairs.sort(([, one], [, other]) => other - one);
  return {
    pairs,
    leftover: whole - pairs.reduce((sum, [, amount]) => sum + amount, 0),
  };
}

/**
 * What the pinned row will say, before there is a row to say it.
 *
 * Its own function because the bar's scale has to know it: the row is measured
 * against the largest figure **on screen**, and it is itself on screen. Measured
 * on the captures — under `Leczenie` this figure beats every ranked row in most
 * of them, by more than half again at the widest — and a fill over one is
 * clipped by
 * `.row { overflow: hidden }` into a bar that looks exactly like a full one.
 *
 * ⚠️ **It depends on the noun and not on the direction, and that is the whole
 * point of it.** The same points read from either end: given plus this is
 * everything received, so the row is what makes the two directions balance
 * instead of disagree. Measured on every capture, both nouns — the figure
 * and its share come out identical under `Zadane` and `Otrzymane` (on
 * `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json`, 49 318 and
 * 6.7% against Hildur), which is `Σ dealt + unattributed = Σ taken` said in the
 * panel's own arithmetic.
 */
function getPinnedValue(reading: PanelReading, state: PanelState): number {
  if (!isHealingMetric(state.metric)) return getUnattributedDamage(reading);
  return (
    [...reading.statistics.byCombatantId.values()].reduce(
      (sum, row) => sum + getHealingWithoutHealer(row),
      0,
    ) + reading.statistics.unattributed.healed
  );
}

/**
 * The part of this screen's quantity that **no row holds** — what the rows are
 * short of the fight by, and the one thing three decisions now share.
 *
 * **The direction settles it.** A figure with no actor is on nobody's *given* row
 * by definition, so under `Zadane` and `Leczenie dane` it is the pinned figure
 * entire. Under a received direction the health it moved landed on somebody and is
 * counted there, and what is left over is only what the aggregate could not place
 * at all: a target or a recipient that did not resolve. Zero on every capture,
 * and read rather than written as zero — a figure that happens to be
 * zero because nothing has broken yet is exactly the kind this panel exists not
 * to miss.
 *
 * Three callers and one fact, which is why it is a function: the screen's whole
 * grows by this, the summary's third part is this, and the sentence the pinned row
 * says about itself turns on whether it is the whole figure or the remainder.
 */
function getFigureOutsideRows(reading: PanelReading, state: PanelState): number {
  if (isGivenMetric(state.metric)) return getPinnedValue(reading, state);
  return isHealingMetric(state.metric)
    ? reading.statistics.unattributed.healed
    : reading.statistics.unattributed.taken;
}

/**
 * What every share on this screen is a share of — **one figure, used by every
 * bracket the screen draws.**
 *
 * ⚠️ **The ranking and the pinned row used to divide by different things.** The
 * rows divided by the ranking and summed to 100%; the pinned row divided by the
 * ranking plus itself. Under `Zadane` that showed as rows adding to 107% and
 * nobody noticed; under `Leczenie dane` it showed as a ranking summing to 100%
 * beside a row saying 79%, which is two answers to two questions printed as
 * though they answered one.
 *
 * The whole is what is **on screen**: the rows the filter admits, plus whatever
 * no row holds — counted once. Under a received direction the pinned figure is
 * already inside the rows, because health nobody can be charged with still landed
 * on somebody; only the part belonging to nobody at all is outside. So the two
 * brackets there answer one question about one whole and still overlap, which is
 * the truth about them: they are two cuts of the same quantity, and the pinned row
 * says so in its own words rather than by arithmetic.
 */
function getWholeOnScreen(reading: PanelReading, state: PanelState, total: number): number {
  return total + getFigureOutsideRows(reading, state);
}

function composePinnedRow(
  reading: PanelReading,
  state: PanelState,
  whole: number,
  largest: number,
  translate: TranslateLabel | null,
): PanelRow | null {
  const value = getPinnedValue(reading, state);
  if (value <= 0) return null;

  const lines: PanelDetailLine[] = [
    { kind: "title", text: NOBODY_LABEL },
    { kind: "note", text: getPinnedLimitNote(state.metric) },
    { kind: "note", text: getPinnedStandingNote(state.metric) },
    { kind: "heading", text: getPinnedBreakdownHeading(state.metric) },
  ];

  /**
   * ⚠️ **The cut follows the direction, and the figure does not.** The same points
   * read from either end, so the row counts one thing per noun — that identity is
   * what makes the two directions balance rather than disagree, and it is measured
   * (`tests/ui/panel-view.test.ts`). What the reader is asking is a different
   * question: under a given direction, *what did this*; under a received one,
   * *whom did it happen to*. Both used to answer the first, so `Otrzymane` never
   * named a victim and `Leczenie dane` listed the recipients of healing nobody
   * gave.
   */
  if (isGivenMetric(state.metric)) {
    const parts = isHealingMetric(state.metric)
      ? getUnattributedHealingBySource(reading)
      : getUnattributedDamageBySource(reading);
    for (const part of [...parts].sort((one, other) => other.amount - one.amount)) {
      lines.push(
        composeStat(getPhrase(part.names, part.token, translate), composeFigureText(part.amount)),
      );
    }
  } else {
    const { pairs, leftover } = getUnattributedByCombatant(reading, state, value);
    for (const [id, amount] of pairs) {
      lines.push(composeStat(getName(reading, id), composeFigureText(amount)));
    }
    const unplaced = getPinnedLeftover(state.metric);
    if (leftover > 0 && unplaced !== null) {
      lines.push(composeStat(unplaced.label, composeFigureText(leftover)));
      lines.push({ kind: "note", text: unplaced.note });
    }
  }

  if (state.team !== "all") lines.push({ kind: "note", text: NOBODY_SCOPE_NOTE });

  return {
    key: NOBODY_ROW_KEY,
    rank: null,
    label: NOBODY_LABEL,
    profession: null,
    colour: UNKNOWN_COLOUR,
    // Measured against the same figure every other bar is, or the row that says
    // something is missing would look like the largest thing in the fight.
    fill: getFill(value, largest),
    valueText: composeFigureText(value),
    bracketText: hasShareOnScreen(state) ? composeBracket(whole > 0 ? value / whole : 0) : null,
    isDrillable: false,
    detail: lines,
  };
}

/**
 * Zero is a reading and unknown is a limit, and they are two sentences.
 *
 * The first states what the game counted. The second — quieter, and only where
 * something in this fight really has no actor — states what cannot be checked.
 * Healing gets no second sentence on purpose: the game always names who was
 * healed, so nothing received is a complete answer, and what it does not name is
 * *who healed*, which is said in the breakdown rather than in place of a figure.
 */
const NOTHING_TEXTS: Record<PanelMetric, string> = {
  dealt: "Nie zadała nikomu obrażeń.",
  taken: "Nic jej nie ubyło.",
  healingGiven: "Nikogo nie leczyła.",
  healed: "Nikt jej nie leczył.",
};

const NOTHING_LIMIT_TEXTS: Partial<Record<PanelMetric, string>> = {
  dealt:
    "Część obrażeń w tej walce jest bez sprawcy — nie da się sprawdzić, czy któreś z nich są jej.",
  // A healer on zero is the reading most likely to be short: on this material most
  // healing carries no announcement, so nothing ties it to whoever cast it.
  healingGiven:
    "Część leczenia w tej walce jest bez sprawcy — nie da się sprawdzić, czy któreś z niego jest jej.",
};

/** Every warning the reading carries, each as one sentence a player can act on. */
function composeWarnings(reading: PanelReading): string[] {
  const warnings: string[] = [];
  const { unreadableMessages, unaccountedHealthBySource } = reading.statistics.reading;

  if (!reading.isFromFightStart) {
    warnings.push("Panel wpiął się w trakcie tej walki — to nie są jej pełne liczby.");
  }

  /**
   * Ahead of everything below, because these two say the material never arrived.
   *
   * The lines further down qualify a fight that *was* read: a heal without a
   * figure, a message carrying a key we have no meaning for. These say that part
   * of the fight never reached the reader at all, which is a larger claim and a
   * different repair. Neither carries a key of the game's or a word of ours — a
   * player is told what cannot be known, not why our reader cannot know it (§3).
   */
  const engine = reading.engineReading;
  if (engine !== undefined) {
    const unreadablePayloads = [...engine.unreadablePayloadsByFault.values()].reduce(
      (sum, count) => sum + count,
      0,
    );
    if (engine.lostMessages > 0) {
      warnings.push(
        `Nie dotarło ${composeFigureText(engine.lostMessages)} ${engine.lostMessages === 1 ? "zdarzenie" : "zdarzeń"} z tej walki — liczby są zaniżone.`,
      );
    } else if (unreadablePayloads > 0) {
      // Something was lost and nothing said how much, so the sentence carries no
      // figure rather than carrying a zero (§9.6: unknown and zero stay apart).
      warnings.push("Część tej walki nie dotarła do panelu — liczby są zaniżone.");
    }
    if (engine.unreadableCombatants > 0) {
      warnings.push(
        `Nie dało się odczytać ${composeFigureText(engine.unreadableCombatants)} ${engine.unreadableCombatants === 1 ? "postaci" : "postaci"} ze składu — część liczb może trafić nie do tej osoby.`,
      );
    }
  }

  // The certain one before the maybe: this says healing *is* short, by an amount
  // the game never states. Ranking it under "something was unreadable" would bury
  // the only line here that is not a suspicion.
  const unaccounted = [...unaccountedHealthBySource.values()].reduce((sum, count) => sum + count, 0);
  if (unaccounted > 0) {
    warnings.push(
      `Leczenie całej drużyny ${composeFigureText(unaccounted)} ${unaccounted === 1 ? "raz" : "razy"} bez podanej liczby — leczenie jest zaniżone.`,
    );
  }

  if (unreadableMessages > 0) {
    warnings.push(
      `Nie dało się odczytać ${composeFigureText(unreadableMessages)} ${unreadableMessages === 1 ? "zdarzenia" : "zdarzeń"} walki — liczby mogą być zaniżone.`,
    );
  }

  return warnings;
}

/** Whether any of those names belongs to somebody on the watcher's own side. */
function hasOurSide(reading: PanelReading, names: readonly string[]): boolean {
  return names.some((name) => {
    const id = getCombatantIdByName(reading.roster, name);
    return id !== null && reading.roster.byId.get(id)?.side === reading.ourSide;
  });
}

/**
 * "wygrana" or "przegrana" **from the watcher's seat**, or nothing at all.
 *
 * The protocol names both sides and says nothing about which is the reader's, so
 * the answer is composed here, where `ourSide` is. Where the game never said
 * `myteam`, or where no name resolves, the header says nothing — a fight the
 * panel cannot place is not a fight it may call a loss.
 */
function getOutcomeText(reading: PanelReading): string | null {
  const outcome = reading.statistics.outcome;
  if (outcome === null || reading.ourSide === null) return null;
  if (hasOurSide(reading, outcome.wonNames)) return "wygrana";
  if (hasOurSide(reading, outcome.lostNames)) return "przegrana";
  return null;
}

/**
 * The fight as a headcount, and it counts the people the list draws.
 *
 * ⚠️ **Not `statistics.bySide`, which counts the people the aggregate
 * *measured*.** The two were the same list for as long as the ranking was built
 * from the aggregate too; once the list holds everyone in the fight, a header
 * reading off the other set says `2 vs 1` over eleven rows for the opening
 * payloads of every group fight. One source for both, and the disagreement
 * cannot be written.
 *
 * Sides in the same order the panel puts them in everywhere else — the
 * watcher's own first, then by the number the game states.
 */
function composeTitle(reading: PanelReading): string {
  const countBySide = new Map<number, number>();
  let unplaced = 0;
  for (const id of getCombatantIdsInFight(reading.statistics, reading.roster)) {
    const side = reading.roster.byId.get(id)?.side;
    if (side === undefined) unplaced += 1;
    else setRunningTotal(countBySide, side, 1);
  }

  const sizes = [...countBySide]
    .sort(([one], [other]) => {
      if (reading.ourSide === one) return -1;
      if (reading.ourSide === other) return 1;
      return one - other;
    })
    .map(([, count]) => composeIntegerText(count));

  if (sizes.length === 0) return "brak składu";
  return `${sizes.join(" vs ")}${unplaced > 0 ? ` +${composeIntegerText(unplaced)}` : ""}`;
}

/**
 * The fight in two figures, and what belongs to neither.
 *
 * ⚠️ **It used to draw a part of the fight as the whole of it.** The two sides
 * were summed off the rows and nothing else, so under `Zadane` the bar was short
 * by everything with no actor — by a few per cent to a fifth, across the
 * captures as they stood — and under `Leczenie dane` by well over half, while
 * the pinned row **directly above it**
 * stated that very figure. Two regions of one screen answering with two different
 * wholes, which is the defect the brackets were fixed for one region up. The third
 * part closes it: mine plus enemy plus nobody is the figure every bracket on the
 * screen divides by.
 *
 * **Fight-scope even under a side filter, and even inside a breakdown.** What it
 * answers is how the fight is going, and that question does not change when the
 * list narrows — only the label does, because two figures of a different scale
 * standing under one combatant's breakdown would be read as that combatant's.
 */
function composeSides(reading: PanelReading, state: PanelState): PanelSides | null {
  if (reading.ourSide === null) return null;

  let mine = 0;
  let enemy = 0;
  let nobody = getFigureOutsideRows(reading, state);
  for (const [id, row] of reading.statistics.byCombatantId) {
    const side = reading.roster.byId.get(id)?.side ?? null;
    const value = getMetricValue(row, state.metric);
    // A combatant the roster cannot place was dropped here silently, while
    // `composeTitle` was counting them in its `+N`. They have no side, and no
    // side is what the third part is for.
    if (side === null) nobody += value;
    else if (side === reading.ourSide) mine += value;
    else enemy += value;
  }

  const whole = mine + enemy + nobody;
  const sides = `${TEAM_LABELS.mine} / ${TEAM_LABELS.enemy}`;
  return {
    mineText: composeFigureText(mine),
    enemyText: composeFigureText(enemy),
    label: state.focusCombatantId === null ? sides : `Cała walka · ${sides}`,
    // Not `Bez sprawcy`, though on the screens where it is large it is the same
    // points: a combatant with no side lands here too, and they have an actor.
    // The chain is the pinned row's own — no actor, so nothing to put on a side.
    nobody: nobody > 0 ? { label: "Bez strony", text: composeFigureText(nobody) } : null,
    // From raw sums: the bar shows the share of the fight, and a share of two
    // rates with different divisors is not a share of anything.
    shares: whole > 0 ? { mine: mine / whole, enemy: enemy / whole, nobody: nobody / whole } : null,
  };
}

/**
 * The ranking's height, in bars, and the least any screen may be.
 *
 * Ten is the most one side fields, eleven the most a whole fight does — measured
 * on the captures, where a group fight is ten of ours against one. A bigger fight
 * scrolls rather than growing the window: a ranking is watched during a fight, and
 * a height that changed as combatants joined would move it under the hand.
 */
const RANKING_ROWS = 11;
const SIDE_ROWS = 10;

/**
 * What the panel says before a fight has reached it.
 *
 * Here rather than in a file of its own for two reasons that both point at this
 * one: the sentence belongs with every other sentence a screen says, and the
 * height belongs beside `RANKING_ROWS`, which it has to match. Split off, the two
 * numbers would be free to drift and nothing would notice — the empty body is the
 * one screen with no figures to disagree about.
 *
 * The sentence obeys §3 the way the rest of them do: it says what has not
 * happened, in the player's words, and nothing about why our reader has nothing
 * to read. There is no limit line under it, because there is no limit — a fight
 * that has not started is not a fight we failed to measure.
 */
export const PANEL_WAITING: PanelWaiting = {
  text: "Nie było jeszcze walki.",
  visibleRows: RANKING_ROWS,
};

/** A section costs its rows plus the heading standing over them. */
function getRowsNeeded(lists: readonly PanelList[]): number {
  return lists.reduce((rows, list) => rows + list.rows.length + 1, 0);
}

/**
 * What the ranking shows, and the floor for everything opened from it.
 *
 * A breakdown reached from this list is never shorter than it — clicking a row
 * must not shorten the window under the hand, which is what the shipped panel did
 * until now: a breakdown of one section drew a window a fifth the height.
 */
function getFloorRows(team: PanelTeam): number {
  return team === "all" ? RANKING_ROWS : SIDE_ROWS;
}

/**
 * What a screen is, so a redraw of it can be told from a move to another one.
 *
 * Nothing draws this. It is here rather than in the file that draws because it is
 * a fact about the state, checkable without a document — and the drawing half has
 * no other way to know: every node is built again on every payload, so the
 * reader's own scroll position is kept across the first and dropped on the second.
 */
function composeLevelKey(state: PanelState): string {
  const composeIdText = (value: number | null): string =>
    value === null ? "" : composeIntegerText(value);
  return [
    state.metric,
    state.team,
    composeIdText(state.focusCombatantId),
    composeIdText(state.focusTargetId),
    state.focusSkill === null
      ? ""
      : `${composeIdText(state.focusSkill.ownerId)}/${state.focusSkill.key}`,
  ].join("|");
}

/**
 * `translate` is how the panel asks the running client what it calls something
 * (`src/ui/panel-names.ts`). It defaults to nobody having asked, which is a real
 * state and not a convenience: the fallbacks are what a player sees wherever the
 * game is not on the page — and every test in this repository runs there.
 */
export function composePanelView(
  reading: PanelReading,
  state: PanelState,
  translate: TranslateLabel | null = null,
): PanelView {
  const ranked = getRankedIds(reading, state);
  const total = ranked.reduce((sum, id) => sum + getMetricValue(getRow(reading, id), state.metric), 0);
  // Computed once, here, and handed to both kinds of row — a second call site
  // deciding its own denominator is how the two came to disagree.
  const whole = getWholeOnScreen(reading, state, total);

  const shell = {
    title: composeTitle(reading),
    outcomeText: getOutcomeText(reading),
    nounTabs: composeNounTabs(state.metric),
    directionTabs: composeDirectionTabs(state.metric),
    teamTabs: composeTeamTabs(state.team),
    // Ten under a filter because that is the most a side fields; eleven when the
    // list can hold both. A breakdown raises this below, and never lowers it.
    visibleRows: getFloorRows(state.team),
    levelKey: composeLevelKey(state),
    warnings: composeWarnings(reading),
  };

  const focusId = state.focusCombatantId;
  if (focusId === null) {
    // The bar is measured against the biggest figure on screen, not against the
    // first row: a pinned row below can exceed it.
    const largestShown = ranked.reduce(
      (most, id) => Math.max(most, getMetricValue(getRow(reading, id), state.metric)),
      getPinnedValue(reading, state),
    );

    return {
      ...shell,
      crumb: null,
      lists: [
        {
          heading: null,
          totalText: null,
          rows: ranked.map((id, index) =>
            composeRankedRow(reading, state, id, index + 1, whole, largestShown, translate),
          ),
        },
      ],
      emptyText: ranked.length === 0 ? "Nikogo tu jeszcze nie ma." : null,
      emptyLimitText: null,
      pinnedRow: composePinnedRow(reading, state, whole, largestShown, translate),
      sides: composeSides(reading, state),
    };
  }

  const deep = state.focusTargetId !== null || state.focusSkill !== null;
  const crumb: PanelCrumb = deep
    ? {
        backLabel: `‹ ${getName(reading, focusId)}`,
        hereLabel:
          state.focusSkill !== null
            ? // Off the owner's row, not the focused one: under `Leczenie` the
              // skill belongs to whoever healed, and reading it off the combatant
              // being healed found nothing and said `umiejętność` instead.
              (getRow(reading, state.focusSkill.ownerId).skills.get(state.focusSkill.key)
                ?.skillName ?? "umiejętność")
            : getName(reading, state.focusTargetId ?? focusId),
        profession: null,
      }
    : {
        backLabel: "‹ skład",
        hereLabel: getName(reading, focusId),
        profession: reading.roster.byId.get(focusId)?.profession ?? null,
      };

  if (deep) {
    const lists = composeDeepLists(reading, state, focusId, translate);
    return {
      ...shell,
      visibleRows: Math.max(getRowsNeeded(lists), getFloorRows(state.team)),
      crumb,
      lists,
      emptyText: lists.length === 0 ? "Nie ma czego pokazać." : null,
      emptyLimitText: null,
      pinnedRow: null,
      sides: composeSides(reading, state),
    };
  }

  if (getMetricValue(getRow(reading, focusId), state.metric) === 0) {
    /**
     * Zero landed is not zero done, and the difference is the whole complaint
     * this answers: a combatant who swung and was blocked every time read as one
     * who did nothing. The count comes from the same place the panel's own
     * counters do, so the two cannot disagree.
     *
     * Two forms and not three: `raz` spells the paucal and the genitive plural
     * the same way — 2 razy, 5 razy — so the rule most Polish nouns need does
     * not apply to the only word this says.
     */
    const blows = getRow(reading, focusId).blowsStruck;
    const swung =
      state.metric === "dealt" && blows > 0
        ? ` Uderzyła ${composeFigureText(blows)} ${blows === 1 ? "raz" : "razy"} — nic nie weszło.`
        : "";

    return {
      ...shell,
      crumb,
      lists: [],
      emptyText: `${NOTHING_TEXTS[state.metric]}${swung}`,
      // Against the figure this metric actually pins, not against damage: under
      // `Leczenie dane` the thing that cannot be checked is unannounced healing.
      emptyLimitText:
        getPinnedValue(reading, state) > 0 ? (NOTHING_LIMIT_TEXTS[state.metric] ?? null) : null,
      pinnedRow: null,
      sides: composeSides(reading, state),
    };
  }

  const lists = composeBreakdownLists(reading, state, focusId, translate);

  return {
    ...shell,
    visibleRows: Math.max(getRowsNeeded(lists), getFloorRows(state.team)),
    crumb,
    lists,
    emptyText: lists.length === 0 ? NOTHING_TEXTS[state.metric] : null,
    emptyLimitText: null,
    pinnedRow: null,
    sides: composeSides(reading, state),
  };
}
