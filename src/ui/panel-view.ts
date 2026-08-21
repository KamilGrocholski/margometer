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
 * What stayed here when this file was split is one screen: the list, the figure
 * pinned under it, what every share divides by, and the summary and warnings
 * standing over the lot — the arithmetic that has to agree with itself, kept
 * where a disagreement is visible in one file.
 *
 * **The strings are Polish and nothing else here is** (§3). A sentence a player
 * reads never carries our vocabulary: it says what cannot be known, not why our
 * reader cannot know it. Every name of the game's own — a key, an effect token —
 * is named before it reaches a label, and `src/ui/panel-words.ts` decides by
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
import {
  composeFigureText,
  composeShareText,
  ELEMENT_NAMES,
  getNeitherEndLeftover,
  getNoActorBreakdownHeading,
  getNoActorLimitNote,
  getNoActorScopeNote,
  getNoActorStandingNote,
  getNoTargetBreakdownHeading,
  getNoTargetLimitNote,
  getNoTargetScopeNote,
  getNoTargetStandingNote,
  getPhrase,
  HEALTH_GAIN_SOURCE_NAMES,
  HEALTH_LOSS_SOURCE_NAMES,
  NO_ACTOR_LABEL,
  NO_TARGET_LABEL,
  type TokenName,
  type TranslateLabel,
} from "@/src/ui/panel-words.ts";
import {
  composeCombatantRowKey,
  composeDirectionTabs,
  composeNounTabs,
  composeTeamTabs,
  isGivenMetric,
  isHealingMetric,
  NO_ACTOR_ROW_KEY,
  NO_TARGET_ROW_KEY,
  type PanelCrumb,
  type PanelDetailLine,
  type PanelList,
  type PanelMetric,
  type PanelRow,
  type PanelSides,
  type PanelState,
  type PanelTeam,
  type PanelView,
  type PanelWaiting,
  TEAM_LABELS,
} from "@/src/ui/panel-screen.ts";
import {
  getDamageWithoutActor,
  getDamageWithoutActorByElement,
  getHealingWithoutHealer,
  getHealthLostWithoutActor,
  getHealthLostWithoutActorBySource,
  getMetricValue,
  getName,
  getRow,
  type PanelReading,
} from "@/src/ui/panel-reading.ts";
import { getProfessionColour, UNKNOWN_COLOUR } from "@/src/ui/panel-look.ts";

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
 * Which of the bar's two figures a combatant's own total belongs to.
 *
 * `nobody` where the roster cannot place them, and `nobody` where the game never
 * said which side is the watcher's: both are refusals rather than a guess (§5),
 * and a combatant with no side was dropped here silently once while
 * `composeTitle` was counting them in its `+N`.
 */
type PanelSidePart = "mine" | "enemy" | "nobody";

function getPartOfSide(reading: PanelReading, side: number | null): PanelSidePart {
  if (side === null || reading.ourSide === null) return "nobody";
  return side === reading.ourSide ? "mine" : "enemy";
}

/**
 * Which end of a blow or a heal the protocol left standing, where it named only
 * one. The message names an actor and calls the target nobody, or the other way
 * about (`src/core/protocol-message.ts` — `0` in a side segment is the protocol
 * naming nobody).
 */
type PanelNamedEnd = "actor" | "receiver";

/**
 * Which side is charged with a figure the protocol left half-named — **the one
 * inference this panel draws, and the only place it draws one.**
 *
 * The known end is a side: the roster places the id the message did name. The
 * unknown end is derived from it, and the derivation is the noun's:
 *
 * - **Damage crosses.** What one side lost, the other dealt. So a tick of poison
 *   on the enemy is ours, and a blow our striker landed on nobody nameable is
 *   theirs to have taken.
 * - **Healing does not.** It reaches its own side, so the healer and the healed
 *   are charged alike.
 *
 * That is a claim about how a fight works rather than about what was logged: it
 * holds while there are two sides and nobody harms their own, and the protocol
 * states neither. What is never derived is a **name** (§5) — the pinned rows go
 * on saying which end the game left out, on every tab.
 *
 * ⚠️ **What pays for it is the mirror, and it is measured rather than
 * constructed.** Over every capture, read 2026-08-18, this makes `Zadane · My`
 * equal `Otrzymane · Oni` to the point, and `Leczenie dane · My` equal
 * `Leczenie · My` — because the two arms reach the figure through different
 * fields of the aggregate (`dealtApplied` against `taken`, `healingGiven` against
 * `healed`). A blow between two of ours, or an end that stops resolving, breaks
 * that equality and lights up `tests/ui/panel-view.test.ts` rather than quietly
 * moving a figure (`docs/specs/2026-08-18-two-ends-and-one-of-them-is-named.md`).
 *
 * The charge is a **part** and not a side, which is what keeps a third side from
 * being a question: the bar is `My` against everyone else everywhere in this
 * file, so the opposite of `mine` is `enemy` whatever number the game wrote.
 */
function getPartCharged(
  reading: PanelReading,
  metric: PanelMetric,
  side: number | null,
  named: PanelNamedEnd,
): PanelSidePart {
  const part = getPartOfSide(reading, side);
  if (part === "nobody" || isHealingMetric(metric)) return part;
  const asked: PanelNamedEnd = isGivenMetric(metric) ? "actor" : "receiver";
  if (named === asked) return part;
  return part === "mine" ? "enemy" : "mine";
}

/**
 * What the figure with no actor was made of, by the key the game stated it under.
 *
 * Two vocabularies, because the two halves are keyed differently: the bucket holds
 * damage **elements**, the rows hold the keys health fell under. The same pair
 * `composeSourceEntries` already draws on `Otrzymane`.
 *
 * ⚠️ **It narrows with the figure over it, and it did not always.** The cut was
 * fight-wide for as long as the figure was, and the figure is the shown team's
 * now — a cut totalling the fight beneath a row totalling one team is the failure
 * this panel exists to prevent, in miniature
 * (`docs/specs/2026-08-11-the-panel-that-drills.md`). What decides admission is
 * the charge and not the tab, because a victim's own side is not the side the
 * figure is charged to under `Zadane`.
 *
 * ⚠️ **What the rows could not place is added only where the row above carries
 * it.** `getDamageWithoutActorByElement` is the same points on the victim's own
 * row, and what is left in the fight's bucket once every row has taken its part is
 * the blow that named **neither** end — which has no team, so it appears under
 * `Wszyscy` and nowhere else. Zero on every capture, and read rather than written
 * as zero.
 */
function getNoActorDamageBySource(
  reading: PanelReading,
  isCharged: (combatantId: number) => boolean,
  shouldListNeitherEnd: boolean,
): Array<{ names: Record<string, TokenName>; token: string; amount: number }> {
  const elements = new Map<string, number>();
  const sources = new Map<string, number>();
  // Every row places its part, admitted or not: the leftover below is what the
  // fight states less what **any** row holds, which is a fact about the fight.
  const placed = new Map<string, number>();

  for (const [id, row] of reading.statistics.byCombatantId) {
    for (const [token, amount] of getDamageWithoutActorByElement(row)) {
      setRunningTotal(placed, token, amount);
      if (isCharged(id)) setRunningTotal(elements, token, amount);
    }
    if (!isCharged(id)) continue;
    for (const [token, amount] of getHealthLostWithoutActorBySource(row)) {
      setRunningTotal(sources, token, amount);
    }
  }

  if (shouldListNeitherEnd) {
    for (const [token, amount] of reading.statistics.unattributed.dealtAppliedByElement) {
      const rest = amount - (placed.get(token) ?? 0);
      if (rest > 0) setRunningTotal(elements, token, rest);
    }
    // Health that fell on nobody: the protocol can call a subject nobody as
    // readily as it calls a target nobody, and then no row holds these either.
    for (const [token, amount] of getHealthLostWithoutActorBySource(reading.statistics.unattributed)) {
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
 * Narrowed by the charge and carrying what no row holds only where the row above
 * carries it, for the reasons the damage cut gives.
 */
function getNoActorHealingBySource(
  reading: PanelReading,
  isCharged: (combatantId: number) => boolean,
  shouldListNeitherEnd: boolean,
): Array<{ names: Record<string, TokenName>; token: string; amount: number }> {
  const sources = new Map<string, number>();
  for (const [id, row] of reading.statistics.byCombatantId) {
    if (!isCharged(id)) continue;
    for (const [token, amount] of row.healedWithoutHealerBySource) {
      setRunningTotal(sources, token, amount);
    }
  }
  if (shouldListNeitherEnd) {
    for (const [token, amount] of reading.statistics.unattributed.healedWithoutHealerBySource) {
      setRunningTotal(sources, token, amount);
    }
  }
  return [...sources].map(([token, amount]) => ({ names: HEALTH_GAIN_SOURCE_NAMES, token, amount }));
}

/**
 * **The hole the protocol left**, and the two shapes it comes in.
 *
 * A message names an actor and calls the target nobody, or names the target and
 * calls the actor nobody (`src/core/protocol-message.ts`). The two are different
 * claims and they are counted apart, because the end that *is* named is what puts
 * the figure on a side (`getPartCharged`) and the end that is not is what the
 * player has to be told about.
 *
 * A third shape exists — a message naming neither — and it is deliberately not a
 * member here: nothing places it, so it reaches no row at all
 * (`getFigureWithNeitherEnd`).
 */
type PanelHole = "actor" | "target";

/** Which end the game did name, per hole. The one the charge is derived from. */
const NAMED_END: Record<PanelHole, PanelNamedEnd> = {
  actor: "receiver",
  target: "actor",
};

/**
 * Where a hole stands against the ranking above it — **three answers, and the
 * screen decides which.**
 *
 * - `named` — the ranked rows hold these points already *and say whose they are*,
 *   so a row of its own would show the same figure twice. Only `Zadane` against a
 *   missing target: the striker is named, and the aggregate credits their
 *   `dealtApplied` whether or not the blow found a name to land on.
 * - `cut` — the rows hold the points but cannot say this about them. The figure is
 *   a slice of what is already on screen, so it states a share and adds nothing to
 *   the whole.
 * - `apart` — no ranked row holds them, so the figure joins the whole the screen
 *   divides by.
 *
 * ⚠️ **The two given screens read `named` for a missing target, and one of them
 * had to be fixed a layer down to say so.** `healingGiven` was credited only
 * where **both** ends resolved, so an announced heal reaching a name this fight
 * could not place was on nobody's row at all — and filed as healing nobody
 * announced, which is a claim about the game that is false (§3). The aggregate
 * credits the healer now (`src/core/fight-statistics.ts`), so both given screens
 * hold these points on the actor's own row, exactly as they hold every other
 * figure whose actor the game named.
 *
 * Four screens times two holes, spelled out, so a fifth screen is a question the
 * compiler asks rather than one it inherits.
 */
type PanelHoleStanding = "named" | "cut" | "apart";

const HOLE_STANDING: Record<PanelMetric, Record<PanelHole, PanelHoleStanding>> = {
  dealt: { actor: "apart", target: "named" },
  taken: { actor: "cut", target: "apart" },
  healingGiven: { actor: "apart", target: "named" },
  healed: { actor: "cut", target: "apart" },
};

/**
 * The figure with **no actor**, by the combatant the game did name: whom the
 * health moved on.
 *
 * Read off the rows, which is what lets it be placed at all — the roster puts that
 * combatant on a side, and the charge derives the missing end from it.
 */
function getFigureWithNoActorByCombatant(
  reading: PanelReading,
  metric: PanelMetric,
): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (const [id, row] of reading.statistics.byCombatantId) {
    const amount = isHealingMetric(metric)
      ? getHealingWithoutHealer(row)
      : getHealthLostWithoutActor(row) + getDamageWithoutActor(row);
    if (amount > 0) pairs.push([id, amount]);
  }
  return pairs;
}

/**
 * The figure with **no target**, by the combatant the game did name: who swung or
 * who healed.
 *
 * It lives on the row nobody owns, because the end that decides which row a figure
 * lands on is the one that did not resolve. What names the side is therefore the
 * *other* end, and the aggregate keeps it: `takenByActorId` is written only where
 * the striker resolved, `healedByHealerId` only where an announcement named a
 * healer (`src/core/fight-statistics.ts`).
 *
 * ⚠️ **Zero on every capture, and that is the reason it is here.** Every
 * recording resolves every name (read 2026-08-19), so this hole is invisible in
 * the material — and under
 * `Leczenie dane` the points it stands for were on no row and in no total at all
 * before it existed. A fight joined on a name the roster cannot tell apart is
 * where it is not zero.
 */
function getFigureWithNoTargetByCombatant(
  reading: PanelReading,
  metric: PanelMetric,
): Array<[number, number]> {
  const { unattributed } = reading.statistics;
  if (isHealingMetric(metric)) {
    return [...unattributed.healedByHealerId].filter(([, amount]) => amount > 0);
  }
  const pairs: Array<[number, number]> = [];
  for (const [actorId, byElement] of unattributed.takenByActorId) {
    let amount = 0;
    for (const part of byElement.values()) amount += part;
    if (amount > 0) pairs.push([actorId, amount]);
  }
  return pairs;
}

/**
 * What names **neither** end, and therefore has no side and no row.
 *
 * The two readers are the ones every other cut here uses, pointed at the row
 * nobody owns: what it holds, less what it can put a name to. Health that fell on
 * nobody joins it — a health change states its subject in a side segment, so the
 * protocol can call that nobody as readily as it calls a target nobody.
 *
 * Zero on every capture. It is the one figure the panel still cannot place, and it
 * is named on the summary bar rather than on a row, because a row belongs to a
 * team and this belongs to none.
 */
function getFigureWithNeitherEnd(reading: PanelReading, metric: PanelMetric): number {
  const { unattributed } = reading.statistics;
  if (isHealingMetric(metric)) return getHealingWithoutHealer(unattributed);
  return getDamageWithoutActor(unattributed) + getHealthLostWithoutActor(unattributed);
}

/**
 * Which of the two rows carries what names **neither** end, under `Wszyscy`.
 *
 * The one whose own hole it also is: a figure naming neither end has no target,
 * so it belongs with the row for a missing target — except under `Zadane`, where
 * that row does not exist because the striker is named, and there it belongs with
 * the row for a missing actor, which is what `Zadane` puts everything unnamed on.
 *
 * Under a side tab it rides nothing at all: it has no team, so a row that took it
 * would total more than the team's own figure. The summary bar is where it is
 * named there, and that is the one thing on screen those two regions do not
 * agree about by construction (`composeSides`).
 */
function getHoleCarryingNeitherEnd(metric: PanelMetric): PanelHole {
  return HOLE_STANDING[metric].target === "named" ? "actor" : "target";
}

function getHolePairs(
  reading: PanelReading,
  metric: PanelMetric,
  hole: PanelHole,
): Array<[number, number]> {
  return hole === "actor"
    ? getFigureWithNoActorByCombatant(reading, metric)
    : getFigureWithNoTargetByCombatant(reading, metric);
}

/**
 * What a hole is worth on the screen as it stands — **the team's, on every one of
 * the twelve.**
 *
 * ⚠️ **It used to be the fight's under a given direction, on all three tabs.** A
 * figure with no actor was held to have no side at all, so `Zadane · My` pinned
 * 45 430 over a ranking summing to 355 900 while the bar under it put 44 464 of
 * that same figure inside `My` — the same points twice on one screen, one of the
 * two saying they were nobody's
 * (`docs/specs/2026-08-18-two-ends-and-one-of-them-is-named.md`). The charge is
 * what changed: the named end gives the side, so the row narrows exactly as the
 * list does and every screen closes — ranking plus the pinned rows is the bar's
 * figure for that tab, which is measured over every capture.
 *
 * Under `Wszyscy` every pair counts, including a combatant the roster cannot
 * place: that tab shows their row too, so leaving them out would open a gap
 * between the list and the figures under it.
 */
function getHoleFigure(reading: PanelReading, state: PanelState, hole: PanelHole): number {
  let total = 0;
  for (const [id, amount] of getHolePairs(reading, state.metric, hole)) {
    if (isChargedTo(reading, state, hole, id)) total += amount;
  }
  if (state.team === "all" && getHoleCarryingNeitherEnd(state.metric) === hole) {
    total += getFigureWithNeitherEnd(reading, state.metric);
  }
  return total;
}

/** Whether this hole's share of one combatant's figure belongs on the screen as it stands. */
function isChargedTo(
  reading: PanelReading,
  state: PanelState,
  hole: PanelHole,
  combatantId: number,
): boolean {
  if (state.team === "all") return true;
  const side = reading.roster.byId.get(combatantId)?.side ?? null;
  return getPartCharged(reading, state.metric, side, NAMED_END[hole]) === state.team;
}

/** The holes that get a row on this screen, in the order they are drawn. */
function getHolesOnScreen(metric: PanelMetric): PanelHole[] {
  return (["actor", "target"] as const).filter((hole) => HOLE_STANDING[metric][hole] !== "named");
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
 * The whole is what is **on screen**: the rows the filter admits, plus every hole
 * standing `apart` from them, plus — under `Wszyscy` alone — what names neither
 * end. A hole standing `cut` adds nothing: its points are already inside a row,
 * so the two brackets overlap on purpose and the row says so in words.
 *
 * ⚠️ **What names neither end joins the whole only under `Wszyscy`,** and it
 * arrives inside a row rather than beside one: `getHoleCarryingNeitherEnd` says
 * which of the two takes it. It belongs to no team, so under a side tab it is on
 * no row and in no whole, and the summary bar is where it is named — the one
 * figure those two regions state differently, on purpose.
 */
function getWholeOnScreen(reading: PanelReading, state: PanelState, total: number): number {
  let whole = total;
  for (const hole of getHolesOnScreen(state.metric)) {
    if (HOLE_STANDING[state.metric][hole] === "apart") whole += getHoleFigure(reading, state, hole);
  }
  return whole;
}

/**
 * One row for one hole — **at most two on a screen, and each says which end the
 * game left out.**
 *
 * ⚠️ **It was one row saying `Bez sprawcy` about both.** A blow with no striker
 * and a blow that found nobody are different things to be told, and saying one
 * sentence about both is how the second went unnoticed long enough for the
 * aggregate to be quietly wrong about it
 * (`docs/specs/2026-08-18-two-ends-and-one-of-them-is-named.md`).
 *
 * The figure is the shown team's on every one of the twelve screens, so the
 * bracket is there on every one of them too — a share of the whole this screen
 * divides by, which the row is now part of.
 */
function composePinnedRows(
  reading: PanelReading,
  state: PanelState,
  whole: number,
  largest: number,
  translate: TranslateLabel | null,
): PanelRow[] {
  const rows: PanelRow[] = [];
  for (const hole of getHolesOnScreen(state.metric)) {
    const row = composeHoleRow(reading, state, hole, whole, largest, translate);
    if (row !== null) rows.push(row);
  }
  return rows;
}

function composeHoleRow(
  reading: PanelReading,
  state: PanelState,
  hole: PanelHole,
  whole: number,
  largest: number,
  translate: TranslateLabel | null,
): PanelRow | null {
  const value = getHoleFigure(reading, state, hole);
  if (value <= 0) return null;

  const label = hole === "actor" ? NO_ACTOR_LABEL : NO_TARGET_LABEL;
  const lines: PanelDetailLine[] = [
    { kind: "title", text: label },
    {
      kind: "note",
      text: hole === "actor" ? getNoActorLimitNote(state.metric) : getNoTargetLimitNote(state.metric),
    },
    {
      kind: "note",
      text:
        hole === "actor" ? getNoActorStandingNote(state.metric) : getNoTargetStandingNote(),
    },
    {
      kind: "heading",
      text:
        hole === "actor"
          ? getNoActorBreakdownHeading(state.metric)
          : getNoTargetBreakdownHeading(),
    },
  ];

  for (const line of composeHoleCut(reading, state, hole, translate)) lines.push(line);

  if (state.team !== "all") {
    lines.push({
      kind: "note",
      text:
        hole === "actor" ? getNoActorScopeNote(state.metric) : getNoTargetScopeNote(),
    });
  }

  return {
    key: hole === "actor" ? NO_ACTOR_ROW_KEY : NO_TARGET_ROW_KEY,
    rank: null,
    label,
    profession: null,
    colour: UNKNOWN_COLOUR,
    // Measured against the same figure every other bar is, or the row that says
    // something is missing would look like the largest thing in the fight.
    fill: getFill(value, largest),
    valueText: composeFigureText(value),
    /**
     * ⚠️ **A share on every screen now, and for one round there was none on four
     * of them.** The bracket went when the figure was held to have no side: a
     * fight-wide numerator over one side's denominator printed 320% under
     * `Leczenie · Oni` on
     * `tests/captured-fights/2026-08-11-tempest-tancerz-vs-wermont.json` and
     * `(0%)` beside a five-figure number where the other side received no healing.
     * Both ends of that are gone — the numerator is the team's and the whole
     * contains it — so the share is a share of something again.
     */
    bracketText: composeBracket(whole > 0 ? value / whole : 0),
    isDrillable: false,
    detail: lines,
  };
}

/**
 * What the row is made of, cut by the end the game **did** name.
 *
 * ⚠️ **The cut follows the question, not the noun.** Under a given direction the
 * reader is asking *what did this*; under a received one, *whom did it happen
 * to*. Both branched on the noun once, so `Otrzymane` never named a victim and
 * `Leczenie dane` listed the recipients of healing nobody gave. The row for a
 * missing target has only one question to answer — *who did it* — because that is
 * the end that resolved.
 */
function composeHoleCut(
  reading: PanelReading,
  state: PanelState,
  hole: PanelHole,
  translate: TranslateLabel | null,
): PanelDetailLine[] {
  const lines: PanelDetailLine[] = [];
  const isCharged = (combatantId: number): boolean =>
    isChargedTo(reading, state, hole, combatantId);
  const shouldListNeitherEnd =
    state.team === "all" && getHoleCarryingNeitherEnd(state.metric) === hole;

  if (hole === "actor" && isGivenMetric(state.metric)) {
    const parts = isHealingMetric(state.metric)
      ? getNoActorHealingBySource(reading, isCharged, shouldListNeitherEnd)
      : getNoActorDamageBySource(reading, isCharged, shouldListNeitherEnd);
    for (const part of [...parts].sort((one, other) => other.amount - one.amount)) {
      lines.push(
        composeStat(getPhrase(part.names, part.token, translate), composeFigureText(part.amount)),
      );
    }
    return lines;
  }

  const pairs = getHolePairs(reading, state.metric, hole)
    .filter(([combatantId]) => isCharged(combatantId))
    .sort(([, one], [, other]) => other - one);
  for (const [id, amount] of pairs) {
    lines.push(composeStat(getName(reading, id), composeFigureText(amount)));
  }

  // What no name reaches, on the row that carries it and nowhere else — a cut
  // listing it anywhere else would total more than the row standing over it.
  const leftover = getFigureWithNeitherEnd(reading, state.metric);
  if (shouldListNeitherEnd && leftover > 0) {
    const unplaced = getNeitherEndLeftover();
    lines.push(composeStat(unplaced.label, composeFigureText(leftover)));
    lines.push({ kind: "note", text: unplaced.note });
  }
  return lines;
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
 * "wygrana" or "przegrana" **from the watcher's seat**, "remis" from any seat, or
 * nothing at all.
 *
 * The protocol names both sides and says nothing about which is the reader's, so
 * the answer is composed here, where `ourSide` is. Where the game never said
 * `myteam`, or where no name resolves, the header says nothing — a fight the
 * panel cannot place is not a fight it may call a loss.
 *
 * A draw is the one answer that needs no seat: the game states it by naming
 * nobody, so it is the same word for everyone in the fight and reaches the
 * header even where `ourSide` never arrived.
 */
function getOutcomeText(reading: PanelReading): string | null {
  const outcome = reading.statistics.outcome;
  if (outcome === null) return null;
  if (outcome.isDrawn) return "remis";
  if (reading.ourSide === null) return null;
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
 * The fight in two figures, and what belongs to neither end at all.
 *
 * ⚠️ **It used to draw a part of the fight as the whole of it.** The two sides
 * were summed off the rows and nothing else, so under `Zadane` the bar was short
 * by everything with no actor — by a few per cent to a fifth, across the
 * captures as they stood — and under `Leczenie dane` by well over half, while
 * the pinned row **directly above it**
 * stated that very figure. Two regions of one screen answering with two different
 * wholes, which is the defect the brackets were fixed for one region up. Every
 * point is inside the bar now: mine plus enemy plus nobody is still the figure
 * every bracket on the screen divides by, so nothing above this line moves.
 *
 * ⚠️ **The third part said `Bez strony` about points that had one.** Measured
 * over every capture on 2026-08-18, all of it sat on combatants the roster
 * places — 45 430 on `tests/captured-fights/2026-08-15-tempest-grupa-vs-hildur-2.json`,
 * of which 44 464 ticked on the enemy and 966 on one of ours — while the truly
 * unplaceable terms were zero in all seventeen. So the parts with a side are
 * charged to one by `getPartCharged`, and the third part keeps exactly what has
 * no side at either end: a blow naming neither, and a combatant outside the
 * roster. That is what a live fight joined on an ambiguous name still produces,
 * which is why the part stays rather than being deleted (§9.6).
 *
 * **Fight-scope even under a side filter, and even inside a breakdown.** What it
 * answers is how the fight is going, and that question does not change when the
 * list narrows — only the label does, and it now does so for a side tab as well:
 * `Zadane · My` puts a figure here that the ranking above it does not sum to, and
 * a scale left unsaid is the one thing §9.6 forbids outright.
 */
function composeSides(reading: PanelReading, state: PanelState): PanelSides | null {
  if (reading.ourSide === null) return null;

  const totals: Record<PanelSidePart, number> = { mine: 0, enemy: 0, nobody: 0 };
  for (const [id, row] of reading.statistics.byCombatantId) {
    const side = reading.roster.byId.get(id)?.side ?? null;
    totals[getPartOfSide(reading, side)] += getMetricValue(row, state.metric);
  }

  // Only a hole standing `apart`: one standing `cut` is already inside a row
  // above, and one standing `named` is inside a ranked row, so charging either a
  // second time would count it twice.
  for (const hole of ["actor", "target"] as const) {
    if (HOLE_STANDING[state.metric][hole] !== "apart") continue;
    for (const [id, amount] of getHolePairs(reading, state.metric, hole)) {
      const side = reading.roster.byId.get(id)?.side ?? null;
      totals[getPartCharged(reading, state.metric, side, NAMED_END[hole])] += amount;
    }
  }
  totals.nobody += getFigureWithNeitherEnd(reading, state.metric);

  const { mine, enemy, nobody } = totals;
  const whole = mine + enemy + nobody;
  const sides = `${TEAM_LABELS.mine} / ${TEAM_LABELS.enemy}`;
  return {
    mineText: composeFigureText(mine),
    enemyText: composeFigureText(enemy),
    label:
      state.team === "all" && state.focusCombatantId === null ? sides : `Cała walka · ${sides}`,
    // Not `Bez sprawcy`, which is the row above and a different claim: that one is
    // a figure with no actor, this is one with no side at either end.
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
 * (`src/ui/panel-words.ts`). It defaults to nobody having asked, which is a real
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
      // Seeded with the pinned figures, which are on this scale and can exceed
      // every ranked row: under `Leczenie` the one with no healer beats them all
      // in most captures, and a fill over one is clipped by `.row { overflow:
      // hidden }` into a bar that looks exactly like a full one.
      getHolesOnScreen(state.metric).reduce(
        (most, hole) => Math.max(most, getHoleFigure(reading, state, hole)),
        0,
      ),
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
      pinnedRows: composePinnedRows(reading, state, whole, largestShown, translate),
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
      pinnedRows: [],
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
        getHoleFigure(reading, state, "actor") > 0
          ? (NOTHING_LIMIT_TEXTS[state.metric] ?? null)
          : null,
      pinnedRows: [],
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
    pinnedRows: [],
    sides: composeSides(reading, state),
  };
}
