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
 * (`panel-drill.ts`), the card a combatant's row opens on hover
 * (`panel-combatant-detail.ts`, once the drill became its second reader), the
 * sentences said where the game names nobody (`panel-nobody.ts`) and a figure as
 * text (`panel-figure-text.ts`). What stayed is one screen: the list, the figure
 * pinned under it, what every share divides by, and the summary and warnings
 * standing over the lot — the arithmetic that has to agree with itself, kept where
 * a disagreement is visible in one file.
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
import { getCombatantIdsInFight } from "@/src/core/fight-statistics.ts";
import {
  composeCombatantDetail,
  composeStat,
} from "@/src/ui/panel-combatant-detail.ts";
import { composeBreakdownLists, composeDeepLists } from "@/src/ui/panel-drill.ts";
import { composeFigureText, composeShareText } from "@/src/ui/panel-figure-text.ts";
import {
  composeDirectionTabs,
  composeNounTabs,
  composeTeamTabs,
  isGivenMetric,
  isHealingMetric,
  TEAM_LABELS,
  type PanelMetric,
  type PanelTeam,
} from "@/src/ui/panel-metric.ts";
import {
  ELEMENT_NAMES,
  getPhrase,
  HEALTH_GAIN_SOURCE_NAMES,
  HEALTH_LOSS_SOURCE_NAMES,
  type TokenName,
  type TranslateLabel,
} from "@/src/ui/panel-names.ts";
import {
  getPinnedBreakdownHeading,
  getPinnedLeftover,
  getPinnedLimitNote,
  getPinnedScopeNote,
  getPinnedStandingNote,
  NOBODY_LABEL,
} from "@/src/ui/panel-nobody.ts";
import {
  getDamageWithoutActor,
  getDamageWithoutActorByElement,
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
 * Whether the side tab lets this combatant onto the screen.
 *
 * Lifted out of `getRankedIds` when the pinned row gained a second reading of the
 * same question: under a received direction the figure with no actor is cut by
 * whom the health moved on, and a cut that admitted anyone the ranking above it
 * does not would report one side's total against another side's list. One rule,
 * two callers, and neither can drift.
 *
 * A combatant the roster cannot place is on no side, so no side tab shows them —
 * and neither does a fight where the game never said which side is the watcher's.
 * Both are refusals rather than a guess (§5); `Wszyscy` is where they are read.
 */
function isAdmittedByTeam(reading: PanelReading, state: PanelState, combatantId: number): boolean {
  if (state.team === "all") return true;
  const side = reading.roster.byId.get(combatantId)?.side ?? null;
  if (side === null || reading.ourSide === null) return false;
  return state.team === "mine" ? side === reading.ourSide : side !== reading.ourSide;
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
    .filter((id) => isAdmittedByTeam(reading, state, id))
    .map((id, position) => ({
      id,
      position,
      value: getMetricValue(getRow(reading, id), state.metric),
    }));

  inFight.sort((one, other) => other.value - one.value || one.position - other.position);
  return inFight.map(({ id }) => id);
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
    detail: composeCombatantDetail(reading, combatantId, state, translate, "ranking"),
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
  state: PanelState,
): Array<{ names: Record<string, TokenName>; token: string; amount: number }> {
  const elements = new Map<string, number>();
  const sources = new Map<string, number>();

  /**
   * ⚠️ **Read off the rows, and the fight-wide bucket only for what the rows
   * cannot hold.** The elements used to come from the bucket entire, which knows
   * no combatant and therefore no side — so once the figure narrowed to the side
   * on screen, the cut stood under it totalling the whole fight.
   *
   * `getDamageWithoutActorByElement` is the same points on the victim's own row,
   * where the roster can place them, and it sums to the victim's share of the
   * figure. What is left in the bucket after every row has taken its part is the
   * blow that named **neither** end — on no side, so it joins only where the
   * leftover does.
   */
  const placed = new Map<string, number>();
  for (const [id, row] of reading.statistics.byCombatantId) {
    for (const [token, amount] of getDamageWithoutActorByElement(row)) {
      setRunningTotal(placed, token, amount);
      if (isAdmittedByTeam(reading, state, id)) setRunningTotal(elements, token, amount);
    }
    if (!isAdmittedByTeam(reading, state, id)) continue;
    for (const [token, amount] of row.healthLostBySource) setRunningTotal(sources, token, amount);
  }

  if (state.team === "all") {
    for (const [token, amount] of reading.statistics.unattributed.dealtAppliedByElement) {
      const rest = amount - (placed.get(token) ?? 0);
      if (rest > 0) setRunningTotal(elements, token, rest);
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
  state: PanelState,
): Array<{ names: Record<string, TokenName>; token: string; amount: number }> {
  const sources = new Map<string, number>();
  for (const [id, row] of reading.statistics.byCombatantId) {
    if (!isAdmittedByTeam(reading, state, id)) continue;
    for (const [token, amount] of row.healedWithoutHealerBySource) {
      setRunningTotal(sources, token, amount);
    }
  }
  // Healing that reached a name nobody could place carries its key just the same,
  // and belongs to no side — so it joins the cut exactly where the figure carries
  // it, which is the screen showing the whole fight.
  if (state.team === "all") {
    for (const [token, amount] of reading.statistics.unattributed.healedWithoutHealerBySource) {
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
): { pairs: Array<[number, number]>; leftover: number } {
  const pairs: Array<[number, number]> = [];
  let placed = 0;
  for (const [id, row] of reading.statistics.byCombatantId) {
    const amount = isHealingMetric(state.metric)
      ? getHealingWithoutHealer(row)
      : row.healthLost + getDamageWithoutActor(row);
    if (amount <= 0) continue;
    // Counted before the filter and kept out of the pairs after it: the leftover
    // is what **no row** holds, which is a fact about the fight rather than about
    // the side on screen. Summing only the admitted rows would hand every side
    // the other side's figures as unplaceable.
    placed += amount;
    if (isAdmittedByTeam(reading, state, id)) pairs.push([id, amount]);
  }
  pairs.sort(([, one], [, other]) => other - one);
  return { pairs, leftover: getUnattributedWholeFight(reading, state) - placed };
}

/**
 * The whole fight's worth of it, whichever end the reader is reading from.
 *
 * ⚠️ **It depends on the noun and not on the direction, and that is the whole
 * point of it.** The same points read from either end: given plus this is
 * everything received, so the row is what makes the two directions balance
 * instead of disagree. Measured on every capture, both nouns — the figure
 * and its share come out identical under `Zadane` and `Otrzymane` (on
 * `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json`, 49 318 and
 * 6.7% against Hildur), which is `Σ dealt + unattributed = Σ taken` said in the
 * panel's own arithmetic.
 *
 * It is what the row shows under `Wszyscy`, and what a side's share is a share
 * of — never what a side tab draws, which is `getPinnedValue` below.
 */
function getUnattributedWholeFight(reading: PanelReading, state: PanelState): number {
  if (!isHealingMetric(state.metric)) return getUnattributedDamage(reading);
  return (
    [...reading.statistics.byCombatantId.values()].reduce(
      (sum, row) => sum + getHealingWithoutHealer(row),
      0,
    ) + reading.statistics.unattributed.healed
  );
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
 * ⚠️ **The side tab narrows it on every screen, and the one end the game named is
 * what it narrows by.** There is no actor to split by — that is what the row is —
 * so the cut is by the combatant the health *moved on*, whom the protocol does
 * name, and whom the roster puts on a side. The row already carries their share of
 * it and `getUnattributedByCombatant` reads it back out; summing the admitted ones
 * is a cut of what the protocol states, not a guess about who did it.
 *
 * ⚠️ **Under a given direction that is a different end than the list above uses,
 * and the sentence has to say so** (`panel-nobody.ts`). `Zadane · My` ranks what
 * our side dealt and pins what our side *lost* with nobody to charge it to — read
 * as our side's doing, it would be exactly the lie this panel exists to prevent.
 * It was left fight-wide for that reason and said so, and a figure that never
 * moved while the whole screen under it did was read as the row being broken.
 *
 * The direction still decides the **breakdown**, and the figure is the same from
 * either end of a noun on every tab — which is `Σ zadane + bez sprawcy = Σ
 * otrzymane` holding per side as well as per fight.
 *
 * The part that landed on **nobody the roster places** has no side, so it joins
 * the figure only under `Wszyscy` — where the pairs and the leftover come back to
 * the fight's own figure, which is measured rather than assumed
 * (`tests/ui/panel-view.test.ts`).
 */
function getPinnedValue(reading: PanelReading, state: PanelState): number {
  if (state.team === "all") return getUnattributedWholeFight(reading, state);
  const { pairs } = getUnattributedByCombatant(reading, state);
  return pairs.reduce((sum, [, amount]) => sum + amount, 0);
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
 * ⚠️ **Two callers, two scopes, and they are not the same question.** The screen's
 * denominator has to contain the numerator standing over it, so it takes the side
 * tab's figure; the summary answers how the *fight* is going and does not narrow
 * when the list does, so it takes the fight's. They agree under `Wszyscy`, which
 * is where every closure over the captures is measured — spelling them as one
 * function was what let a filtered screen divide by a whole it was not part of.
 */
function getFigureOutsideRows(reading: PanelReading, state: PanelState): number {
  if (isGivenMetric(state.metric)) return getPinnedValue(reading, state);
  return getFigureNoRowHolds(reading, state);
}

/** The same, for the summary: fight-wide, so a side tab does not move it. */
function getFigureOutsideRowsOfFight(reading: PanelReading, state: PanelState): number {
  if (isGivenMetric(state.metric)) return getUnattributedWholeFight(reading, state);
  return getFigureNoRowHolds(reading, state);
}

/**
 * What the aggregate could not place at all: a target or a recipient that did not
 * resolve. On no side and on no row, so it is outside both readings above and is
 * the one term they share. Zero on every capture, and read rather than written as
 * zero — a figure that happens to be zero because nothing has broken yet is
 * exactly the kind this panel exists not to miss.
 */
function getFigureNoRowHolds(reading: PanelReading, state: PanelState): number {
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
      ? getUnattributedHealingBySource(reading, state)
      : getUnattributedDamageBySource(reading, state);
    for (const part of [...parts].sort((one, other) => other.amount - one.amount)) {
      lines.push(
        composeStat(getPhrase(part.names, part.token, translate), composeFigureText(part.amount)),
      );
    }
  } else {
    const { pairs, leftover } = getUnattributedByCombatant(reading, state);
    for (const [id, amount] of pairs) {
      lines.push(composeStat(getName(reading, id), composeFigureText(amount)));
    }
    const unplaced = getPinnedLeftover(state.metric);
    // Only where the figure carries it. A side tab leaves it out — it belongs to
    // nobody the roster places, so it is on neither side — and a cut that listed
    // it anyway would total more than the row standing over it, which is the
    // failure this panel exists to prevent, in miniature.
    if (leftover > 0 && unplaced !== null && state.team === "all") {
      lines.push(composeStat(unplaced.label, composeFigureText(leftover)));
      lines.push({ kind: "note", text: unplaced.note });
    }
  }

  if (state.team !== "all") lines.push({ kind: "note", text: getPinnedScopeNote(state.metric) });

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
    /**
     * ⚠️ **This used to be dropped under a side filter, and the reason was the
     * figure rather than the share.** A fight-wide numerator over one side's
     * denominator printed 320% under `Leczenie · Oni` on
     * `tests/captured-fights/2026-08-11-tempest-tancerz-vs-wermont.json` and
     * `(0%)` beside a five-figure number where the other side received no healing
     * — one fault from two ends, and §9.6 forbids the second twice over.
     *
     * Both scopes now narrow together, so the numerator cannot exceed the
     * denominator and cannot survive it going to zero: under a received filter
     * every point of this figure is on an admitted row and inside that row's own
     * total, and under a given one the figure is added to the denominator by
     * `getFigureOutsideRows`. Held by the sweeps rather than by this note.
     */
    bracketText: composeBracket(whole > 0 ? value / whole : 0),
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
  let nobody = getFigureOutsideRowsOfFight(reading, state);
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
