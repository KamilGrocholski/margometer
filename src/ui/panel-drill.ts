/**
 * What a row opens onto: the two levels below the ranking, as data.
 *
 * One subject, and it is not the ranking's: a breakdown answers *what is this
 * figure made of* and closes every section against the row it was entered from,
 * where the ranking answers *who* and divides by the screen. The two shared a file
 * for as long as `panel-view.ts` held everything, and its own docblocks had become
 * a table of contents — §9.1's literal test for a file that needs splitting
 * (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F26).
 *
 * Two functions leave here, one per level. Every heading, every entry composer and
 * every closing row is private, because a caller that could compose one section of
 * its own is a caller that can draw a section closing against nothing.
 *
 * **The strings are Polish and nothing else here is** (§3).
 */

import { composeIntegerText } from "@/libs/number.ts";
import { setRunningTotal } from "@/libs/running-total.ts";
import type { CombatantStatistics, SkillStatistics } from "@/src/core/fight-statistics.ts";
import { composeCombatantDetail } from "@/src/ui/panel-combatant-detail.ts";
import { composeFigureText, composeShareText } from "@/src/ui/panel-figure-text.ts";
import {
  isGivenMetric,
  isHealingMetric,
  type PanelMetric,
} from "@/src/ui/panel-metric.ts";
import {
  ELEMENT_NAMES,
  getPhrase,
  HEALTH_GAIN_SOURCE_NAMES,
  HEALTH_LOSS_SOURCE_NAMES,
  type TokenName,
  type TranslateLabel,
} from "@/src/ui/panel-names.ts";
import { getMissingCounterpart } from "@/src/ui/panel-nobody.ts";
import {
  getHealthLostCausedBySource,
  getMetricValue,
  getName,
  getRow,
  type PanelReading,
} from "@/src/ui/panel-reading.ts";
import {
  composeLeafRowKey,
  composeSkillLeafRowKey,
  composeSkillRowKey,
  composeSourceRowKey,
  composeTargetRowKey,
  NO_ACTOR_ROW_KEY,
  NO_TARGET_ROW_KEY,
  UNANNOUNCED_ROW_KEY,
} from "@/src/ui/panel-row-key.ts";
import type { PanelDetailLine, PanelList } from "@/src/ui/panel-shape.ts";
import type { PanelState } from "@/src/ui/panel-state.ts";
import { getProfessionColour, UNKNOWN_COLOUR } from "@/src/ui/panel-look.ts";

type BreakdownEntry = {
  key: string;
  label: string;
  profession: string | null;
  colour: string;
  amount: number;
  isDrillable: boolean;
  /** Announced skills carry theirs; nothing else has one. */
  uses: number | null;
  detail: PanelDetailLine[];
};

/** One section of a breakdown. Its total equals the figure it was entered from. */
function composeBreakdownList(
  heading: string,
  entries: readonly BreakdownEntry[],
): PanelList | null {
  if (entries.length === 0) return null;

  const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const largest = entries.reduce((most, entry) => Math.max(most, entry.amount), 0);

  return {
    heading,
    totalText: composeFigureText(total),
    rows: entries.map((entry) => ({
      key: entry.key,
      rank: null,
      label: entry.label,
      profession: entry.profession,
      colour: entry.colour,
      fill: largest > 0 ? entry.amount / largest : 0,
      valueText: composeFigureText(entry.amount),
      bracketText: `(${composeShareText(total > 0 ? entry.amount / total : 0)}${entry.uses === null ? "" : ` · ×${composeFigureText(entry.uses)}`})`,
      isDrillable: entry.isDrillable,
      detail: entry.detail,
    })),
  };
}

/**
 * A cross-section of a single row repeats the total standing over it, so it is
 * not drawn at all.
 *
 * "bez żywiołu 100%" under a figure that already says the same number is not a
 * second reading of anything — and three such sections in a row, which is what
 * `Leczenie` produced, read as a panel that has run out of things to say. The
 * list a level is *about* is always drawn; only the cross-sections beside it
 * answer to this.
 *
 * ⚠️ **Unless the one row is the closing row and it counts something.**
 * `Zwykły cios 2 644 (100% · ×8)` says eight blows where the figure above says
 * none, and the number of times is the whole question a plain attack raises.
 * Measured over the captures as they stood 2026-08-19: **none** of those 27 counts
 * can be reached anywhere else, because the closing row one level down states no
 * count at all — while a lone *announced* skill is reachable on all 31 of its
 * occurrences, by opening any person it was used on. So the exemption is the
 * closing row's alone; widening it to every row carrying a count drew 31 sections
 * repeating what a click already showed
 * (`docs/specs/2026-08-19-a-row-opens-only-what-it-does-not-say.md`).
 */
function composeCrossSection(
  heading: string,
  entries: readonly BreakdownEntry[],
): PanelList | null {
  const [only] = entries;
  const isCountOnlyHere =
    entries.length === 1 && only !== undefined && only.key === UNANNOUNCED_ROW_KEY && only.uses !== null;
  return entries.length > 1 || isCountOnlyHere ? composeBreakdownList(heading, entries) : null;
}

/**
 * Whether a row opens onto anything it has not already said.
 *
 * `composeCrossSection` above refuses to *draw* a section that repeats the total
 * standing over it. These two are the same rule one rung earlier, on the
 * affordance: a row drawn drillable whose level can only name the figure again
 * costs a gesture and answers nothing. Measured over the seventeen captures as
 * they stood 2026-08-19, **250 of the 250** skill rows under `Leczenie` were
 * exactly that, and 86 of 330 healing pairs
 * (`docs/specs/2026-08-19-a-row-opens-only-what-it-does-not-say.md`).
 *
 * ⚠️ **Answered by composing what the level would hold, never by a second rule
 * about it.** A predicate written alongside `composeDeepLists` is two spellings of
 * one question and the disagreement is silent — an arrow leading nowhere, or none
 * where there was something to see (§9.3). So both call the level's own readers.
 */
function shouldOpenPair(
  reading: PanelReading,
  state: PanelState,
  combatantId: number,
  otherId: number,
): boolean {
  return (
    composeNamedPairSkillEntries(reading, state, combatantId, otherId).length > 0 ||
    getPairCutSize(reading, state, combatantId, otherId) > 1
  );
}

/**
 * How many rows the pair's second cut would hold — elements and keys together,
 * because they are drawn as one section and a rule counting half of it would call
 * a level empty that is not.
 */
function getPairCutSize(
  reading: PanelReading,
  state: PanelState,
  combatantId: number,
  otherId: number,
): number {
  const { byElement, bySource } = getPairReading(reading, state, combatantId, otherId);
  return byElement.size + bySource.size;
}

/**
 * The narrowing is the whole of it: under `otrzymane` the level lists the one
 * combatant already in focus, so there is never a name to add and the row is a
 * leaf. `docs/specs/2026-08-11-the-panel-that-drills.md` drew that section without
 * an arrow from the day it was specified; the code had said otherwise since.
 */
function shouldOpenSkill(
  state: PanelState,
  skill: SkillStatistics,
  combatantId: number,
): boolean {
  return getSkillPairs(state, skill, combatantId).some(([id]) => id !== combatantId);
}

/**
 * Two maps of the same shape read as one total per combatant.
 *
 * **Two of them, because damage reaches a person by two routes.** A blow is in
 * `dealtByTargetId`; a wound charged to whoever applied it is in
 * `healthLostCausedByTargetId`, kept apart in the aggregate because it is not a
 * swing (§9.6). To the question this level asks — *whom did they damage* — the
 * distinction is none, and a section reading only the first would leave the wound
 * in the closing row for an end the game **did** name.
 */
function composePairTotals(
  sources: ReadonlyArray<ReadonlyMap<number, ReadonlyMap<string, number>>>,
): Array<readonly [number, number]> {
  const totals = new Map<number, number>();
  for (const byCombatantId of sources) {
    for (const [id, byToken] of byCombatantId) {
      for (const amount of byToken.values()) setRunningTotal(totals, id, amount);
    }
  }
  return [...totals];
}

/**
 * Who this combatant hit, or who hit them, or who healed them.
 *
 * Every entry here is a person, so every entry carries the card the ranking's rows
 * carry — the reader had to go back out to the list to ask who they were looking
 * at. `translate` travels this far for that and for nothing else.
 */
function composeOpponentEntries(
  reading: PanelReading,
  state: PanelState,
  combatantId: number,
  translate: TranslateLabel | null,
): BreakdownEntry[] {
  const row = getRow(reading, combatantId);
  const pairs: Array<readonly [number, number]> =
    state.metric === "dealt"
      ? composePairTotals([row.dealtByTargetId, row.healthLostCausedByTargetId])
      : state.metric === "taken"
        ? composePairTotals([row.takenByActorId, row.healthLostByActorId])
        : state.metric === "healingGiven"
          ? [...row.healingGivenByCombatantId]
          : [...row.healedByHealerId];

  const entries: BreakdownEntry[] = pairs
    .filter(([, amount]) => amount > 0)
    .sort(([, one], [, other]) => other - one)
    .map(([id, amount]) => ({
      key: composeTargetRowKey(id),
      label: getName(reading, id),
      profession: reading.roster.byId.get(id)?.profession ?? null,
      colour: getProfessionColour(reading.roster.byId.get(id)?.profession ?? null),
      amount,
      isDrillable: shouldOpenPair(reading, state, combatantId, id),
      uses: null,
      detail: composeCombatantDetail(reading, id, state, translate, "breakdown"),
    }));

  // The part with no counterpart stands in the same section, or the section would
  // total less than the row it was entered from with nothing saying why.
  //
  // ⚠️ Taken as the row's own figure minus what the pairs hold, rather than named
  // per metric. Spelled out, two of the four cases were simply missing: the pairs
  // are only written where the other end **resolved**, while the row's figure is
  // added whatever happened, so a target the roster cannot place left the section
  // short. Measured on a fight whose target name is not in the roster — the shape
  // a fight joined in progress gives, since names then resolve to nobody — a
  // combatant ranked at 400 opened onto no sections at all.
  const orphan = getMetricValue(row, state.metric) - pairs.reduce((sum, [, amount]) => sum + amount, 0);
  if (orphan > 0) entries.push(composeMissingEntry(state.metric, orphan));

  return entries;
}

/**
 * The end of a pair the game did not name, as a row rather than as a silence.
 *
 * The key names **which** end, the same way the two rows under the ranking do: a
 * given direction is missing the target, a received one the actor. One key for
 * both said the row was "the unknown one", which is two different things.
 */
function composeMissingEntry(metric: PanelMetric, amount: number): BreakdownEntry {
  const missing = getMissingCounterpart(metric);
  return {
    key: isGivenMetric(metric) ? NO_TARGET_ROW_KEY : NO_ACTOR_ROW_KEY,
    label: missing.label,
    profession: null,
    colour: UNKNOWN_COLOUR,
    amount,
    isDrillable: false,
    uses: null,
    detail: [{ kind: "note", text: missing.note }],
  };
}

/**
 * The row that closes a section against the row above it.
 *
 * Keyed by the two metrics that reach it rather than by all three, so the
 * compiler refuses a metric nobody decided about — the previous spelling was a
 * ternary defaulting `taken` into the wording for `dealt`, which was only right
 * because of an early return forty lines above it.
 */
const CLOSING_LABELS: Record<PanelMetric, string> = {
  dealt: "Zwykły cios",
  taken: "Zwykły cios",
  // Never reached: healing given is by definition what an announcement carried,
  // so the section already closes against the row. Decided rather than defaulted,
  // because a table that guesses is the thing this table exists to prevent.
  healingGiven: "Nie wiadomo, czym",
  healed: "Nie wiadomo, czym",
};

const CLOSING_NOTES: Record<PanelMetric, string> = {
  dealt:
    "Cios, przed którym nie stała żadna umiejętność. Gra nie odróżnia go od dodatkowego zamachu, który sama jej dała.",
  taken:
    "Cios, przed którym nie stała żadna umiejętność. Gra nie odróżnia go od dodatkowego zamachu, który sama jej dała.",
  healingGiven: "Nic nie zapowiedziało tego leczenia, więc gra nie mówi, co je dało.",
  healed: "Nic nie zapowiedziało tego leczenia, więc gra nie mówi, co je dało.",
};

/**
 * Damage this combatant did outside a blow, as rows of its own in the section
 * about what they did it with.
 *
 * ⚠️ **The alternative was to let it close into `Zwykły cios`, and that row is a
 * claim.** It says a blow nothing announced, and counts how many — a wound ticking
 * three turns after the blow that applied it is neither. So the section names it
 * by the game's own word for the key and goes on closing against the row above,
 * which is the rule every level here keeps.
 *
 * It carries no count: the protocol states no number of applications, and the
 * announcement that would state one is counted as nothing (`docs/protocol-keys.md`,
 * `+injure`).
 */
function composeWoundEntries(
  row: CombatantStatistics,
  translate: TranslateLabel | null,
): BreakdownEntry[] {
  return [...getHealthLostCausedBySource(row)].map(([token, amount]) => ({
    key: composeLeafRowKey(token),
    label: getPhrase(HEALTH_LOSS_SOURCE_NAMES, token, translate),
    profession: null,
    colour: UNKNOWN_COLOUR,
    amount,
    isDrillable: false,
    uses: null,
    detail: [],
  }));
}

/**
 * What this combatant did it with, or what was done to them.
 *
 * Under `Leczenie` the section counts what the row counts — healing **received**,
 * so it is built from everybody else's skills aimed here, not from this
 * combatant's own. Their own skills answer how much they *gave*, which is a
 * different quantity and does not add up to the same total (`SkillStatistics`).
 */
function composeSkillEntries(
  reading: PanelReading,
  state: PanelState,
  combatantId: number,
  translate: TranslateLabel | null,
): BreakdownEntry[] {
  // Nothing announces a blow you take: the protocol names what hit you, never
  // what the other side chose. So `Otrzymane` has no skills section at all, and
  // the three metrics below are the only ones the labels have to answer for.
  if (state.metric === "taken") return [];

  const entries: BreakdownEntry[] = [];
  /**
   * The owner rides in the key, in every metric that reaches here.
   *
   * Under `Zadane` it is always the combatant in focus and looks redundant; one
   * shape of key is still worth more than two, because the entry point parses it
   * and a second shape is a second parser to keep honest.
   */
  const setEntry = (
    ownerId: number,
    key: string,
    skill: SkillStatistics,
    amount: number,
  ): void => {
    if (amount <= 0) return;
    entries.push({
      key: composeSkillRowKey(ownerId, key),
      label: skill.skillName,
      profession: null,
      colour: UNKNOWN_COLOUR,
      amount,
      isDrillable: shouldOpenSkill(state, skill, combatantId),
      uses: skill.uses,
      detail: [],
    });
  };

  if (state.metric === "dealt") {
    for (const [key, skill] of getRow(reading, combatantId).skills) {
      setEntry(combatantId, key, skill, skill.dealtApplied);
    }
    entries.push(...composeWoundEntries(getRow(reading, combatantId), translate));
  } else if (state.metric === "healingGiven") {
    // Their own skills, and the figure a skill restored to somebody else — the
    // one `SkillStatistics` warns must not be read as the row's own healing.
    for (const [key, skill] of getRow(reading, combatantId).skills) {
      setEntry(combatantId, key, skill, skill.healed);
    }
  } else {
    for (const [ownerId, row] of reading.statistics.byCombatantId) {
      for (const [key, skill] of row.skills) {
        setEntry(ownerId, key, skill, skill.healedByCombatantId.get(combatantId) ?? 0);
      }
    }
  }

  entries.sort((one, other) => other.amount - one.amount);

  /**
   * What no announcement covered closes the section against the row above it —
   * and under `Zadane` it says **how many times**, because that is the question
   * a plain attack raises: a combatant who never announces anything otherwise
   * appears only as a figure with no shape.
   *
   * It is drawn even when it landed nothing, and that is the point: three blows
   * that were all blocked are three blows, and a section that skipped them would
   * say the combatant did not swing.
   */
  const row = getRow(reading, combatantId);
  const total = getMetricValue(row, state.metric);
  const named = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const rest = total - named;
  const plainBlows = state.metric === "dealt" ? row.blowsWithoutSkill : 0;
  if (rest > 0 || plainBlows > 0) {
    entries.push({
      key: UNANNOUNCED_ROW_KEY,
      label: CLOSING_LABELS[state.metric],
      profession: null,
      colour: UNKNOWN_COLOUR,
      amount: Math.max(rest, 0),
      isDrillable: false,
      uses: plainBlows > 0 ? plainBlows : null,
      detail: [{ kind: "note", text: CLOSING_NOTES[state.metric] }],
    });
  }

  return entries;
}

/** What the figures were made of, by the name the game gave each. */
function composeSourceEntries(
  reading: PanelReading,
  state: PanelState,
  combatantId: number,
  translate: TranslateLabel | null,
): BreakdownEntry[] {
  const row = getRow(reading, combatantId);
  const compose = (
    names: Record<string, TokenName>,
    tokens: ReadonlyMap<string, number>,
    colour: string,
  ): BreakdownEntry[] =>
    [...tokens].map(([token, amount]) => ({
      key: composeSourceRowKey(token),
      label: getPhrase(names, token, translate),
      profession: null,
      colour,
      amount,
      isDrillable: false,
      uses: null,
      detail: [],
    }));

  // The source keys the game states belong to whoever received the health, so a
  // giver has none. An empty list here is a section that is not drawn, which is
  // the honest answer rather than repeating the recipients under a second name.
  if (state.metric === "healingGiven") return [];
  if (state.metric === "healed")
    return compose(HEALTH_GAIN_SOURCE_NAMES, row.healedBySource, UNKNOWN_COLOUR);

  const entries = compose(
    ELEMENT_NAMES,
    state.metric === "dealt" ? row.dealtAppliedByElement : row.takenByElement,
    UNKNOWN_COLOUR,
  );
  // The same pair of vocabularies on both screens, from the two ends of one
  // figure: what a combatant lost outside a blow, and what they took off somebody
  // else outside one.
  entries.push(
    ...compose(
      HEALTH_LOSS_SOURCE_NAMES,
      state.metric === "dealt"
        ? getHealthLostCausedBySource(row)
        : state.metric === "taken"
          ? row.healthLostBySource
          : new Map<string, number>(),
      UNKNOWN_COLOUR,
    ),
  );
  return entries.sort((one, other) => other.amount - one.amount);
}

const OPPONENT_HEADINGS: Record<PanelMetric, string> = {
  dealt: "KOMU",
  taken: "OD KOGO",
  healingGiven: "KOMU",
  healed: "OD KOGO",
};

const SOURCE_HEADINGS: Record<PanelMetric, string> = {
  dealt: "TYP OBRAŻEŃ",
  taken: "TYP OBRAŻEŃ",
  // Healing given has no source cut: the keys the game names belong to whoever
  // received the health, and there is no second map stating them for the giver.
  healingGiven: "OD CZEGO",
  healed: "OD CZEGO",
};

/**
 * One combatant's figure, in three cuts: whom it involved, what it was done with,
 * and what it was made of.
 *
 * The first is always drawn — it is what the level is about. The other two are
 * cross-sections and answer to `composeCrossSection`.
 */
export function composeBreakdownLists(
  reading: PanelReading,
  state: PanelState,
  combatantId: number,
  translate: TranslateLabel | null,
): PanelList[] {
  return [
    composeBreakdownList(
      OPPONENT_HEADINGS[state.metric],
      composeOpponentEntries(reading, state, combatantId, translate),
    ),
    composeCrossSection(
      "CZYM (UMIEJĘTNOŚCI)",
      composeSkillEntries(reading, state, combatantId, translate),
    ),
    composeCrossSection(
      SOURCE_HEADINGS[state.metric],
      composeSourceEntries(reading, state, combatantId, translate),
    ),
  ].filter((list): list is PanelList => list !== null);
}

/**
 * The skills an announcement put behind one pair's figure — what this combatant
 * used *on that one opponent*, rather than across the fight.
 *
 * Split from the section it makes up because whether there is one of these is the
 * question `shouldOpenPair` asks: a pair no announcement covered opens onto the
 * closing row and nothing else, which is the figure above it written a second
 * time.
 */
function composeNamedPairSkillEntries(
  reading: PanelReading,
  state: PanelState,
  combatantId: number,
  otherId: number,
): BreakdownEntry[] {
  const entries: BreakdownEntry[] = [];
  // Whose skills answer for this pair, and it turns on the **direction** rather
  // than on the figure: mine when I gave it, theirs when I received it. Written
  // as `=== "dealt"` it read as a fact about damage and was a fact about giving,
  // which is why healing given could not be added without rewriting the line.
  const ownerId = isGivenMetric(state.metric) ? combatantId : otherId;
  const subjectId = isGivenMetric(state.metric) ? otherId : combatantId;

  for (const [, skill] of getRow(reading, ownerId).skills) {
    const amount = isHealingMetric(state.metric)
      ? (skill.healedByCombatantId.get(subjectId) ?? 0)
      : (skill.dealtByTargetId.get(subjectId) ?? 0);
    if (amount <= 0) continue;
    entries.push({
      key: composeSkillLeafRowKey(skill.skillName),
      label: skill.skillName,
      profession: null,
      colour: UNKNOWN_COLOUR,
      amount,
      isDrillable: false,
      uses: skill.uses,
      detail: [],
    });
  }

  entries.sort((one, other) => other.amount - one.amount);
  return entries;
}

/**
 * The same, as a section.
 *
 * It closes against the pair's own total the way the fight-wide one closes against
 * the combatant's: what no announcement covered is a row, not a silence, or the
 * parts would sum to less than the figure they were entered from and nothing would
 * say why.
 */
function composePairSkillEntries(
  reading: PanelReading,
  state: PanelState,
  combatantId: number,
  otherId: number,
  pairTotal: number,
  bySource: ReadonlyMap<string, number>,
  translate: TranslateLabel | null,
): BreakdownEntry[] {
  const entries = composeNamedPairSkillEntries(reading, state, combatantId, otherId);

  // The wound stands in this section for the reason it stands in the fight-wide
  // one: `Zwykły cios` below would otherwise absorb it and call it a blow.
  for (const [token, amount] of bySource) {
    entries.push({
      key: composeSkillLeafRowKey(token),
      label: getPhrase(HEALTH_LOSS_SOURCE_NAMES, token, translate),
      profession: null,
      colour: UNKNOWN_COLOUR,
      amount,
      isDrillable: false,
      uses: null,
      detail: [],
    });
  }

  const named = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const rest = pairTotal - named;
  if (rest > 0) {
    entries.push({
      key: composeLeafRowKey(UNANNOUNCED_ROW_KEY),
      label: CLOSING_LABELS[state.metric],
      profession: null,
      colour: UNKNOWN_COLOUR,
      amount: rest,
      isDrillable: false,
      uses: null,
      detail: [{ kind: "note", text: CLOSING_NOTES[state.metric] }],
    });
  }
  return entries;
}

/**
 * Whom the level under a skill row lists.
 *
 * Under `otrzymane` the skill belongs to somebody else and the row was entered
 * from what it gave *this* combatant, so the level narrows to that one pair. Under
 * `dane` the skill is their own and the question is who all of it reached, so
 * nothing is filtered away.
 *
 * ⚠️ **The narrowing is load-bearing twice.** It is what keeps the level honest
 * about which figure it was entered from, and — read by `shouldOpenSkill` — what
 * makes a healing-received skill row a leaf: a list of the one combatant already
 * in focus has no name to add.
 */
function getSkillPairs(
  state: PanelState,
  skill: SkillStatistics,
  combatantId: number,
): Array<[number, number]> {
  if (!isHealingMetric(state.metric)) return [...skill.dealtByTargetId];
  if (isGivenMetric(state.metric)) return [...skill.healedByCombatantId];
  return [...skill.healedByCombatantId].filter(([id]) => id === combatantId);
}

/**
 * One pair's own figure, and the element cut behind it.
 *
 * Which end of the pair each is read from turns on the **direction** rather than
 * on the quantity — the same correction as in `composeNamedPairSkillEntries`.
 *
 * ⚠️ **The figure is the pair's own, not the sum of the skills under it.** This
 * used to add up `healedByCombatantId` across the giver's skills, which is the
 * same arithmetic the section below performs — so a pair no skill announced closed
 * against zero, produced no rows and no closing row either, and the level opened
 * **empty** under a row that had just promised a figure. Every self-sourced heal
 * is exactly that pair (`heal`, `legbon_holytouch_heal`, `legbon_lastheal` —
 * `docs/specs/2026-08-19-a-heal-nobody-gave-was-their-own.md`), and the drill could
 * not open one at all.
 *
 * `healingGivenByCombatantId` is what the level above read the row's figure from,
 * in both directions — the recipient's `healedByHealerId` is its transpose, written
 * in the same breath — so closing against it is closing against the number the
 * reader clicked on.
 */
function getPairReading(
  reading: PanelReading,
  state: PanelState,
  combatantId: number,
  otherId: number,
): {
  byElement: ReadonlyMap<string, number>;
  /** What one did to the other outside a blow, by the key that did it. */
  bySource: ReadonlyMap<string, number>;
  total: number;
} {
  const from = isGivenMetric(state.metric) ? getRow(reading, combatantId) : getRow(reading, otherId);
  const to = isGivenMetric(state.metric) ? otherId : combatantId;
  const nothing = new Map<string, number>();
  const byElement = isHealingMetric(state.metric)
    ? nothing
    : (from.dealtByTargetId.get(to) ?? nothing);
  // Read off the same row as the elements, and off the giving end for the same
  // reason: the pair's figure is what one combatant did to the other, whichever
  // direction the screen is asking from.
  const bySource = isHealingMetric(state.metric)
    ? nothing
    : (from.healthLostCausedByTargetId.get(to) ?? nothing);
  const total = isHealingMetric(state.metric)
    ? (from.healingGivenByCombatantId.get(to) ?? 0)
    : [...byElement.values(), ...bySource.values()].reduce((sum, one) => sum + one, 0);
  return { byElement, bySource, total };
}

/**
 * The deepest level: one opponent, or one skill, of the combatant in focus.
 *
 * Entering through an opponent asks *with what* — so the level lists skills, and
 * the elements stand beside them as a second cut of the same figure. Entering
 * through a skill asks the mirror question, *on whom*.
 */
export function composeDeepLists(
  reading: PanelReading,
  state: PanelState,
  combatantId: number,
  translate: TranslateLabel | null,
): PanelList[] {
  if (state.focusSkill !== null) {
    // The owner is stated rather than searched for. Looking the key up across
    // every row and taking the first match was a coin toss whenever two
    // combatants announce the same skill, which every group capture does.
    const skill = getRow(reading, state.focusSkill.ownerId).skills.get(state.focusSkill.key);
    if (skill === undefined) return [];

    const entries: BreakdownEntry[] = getSkillPairs(state, skill, combatantId)
      .sort(([, one], [, other]) => other - one)
      .map(([id, amount]) => ({
        key: composeLeafRowKey(composeIntegerText(id)),
        label: getName(reading, id),
        profession: reading.roster.byId.get(id)?.profession ?? null,
        colour: getProfessionColour(reading.roster.byId.get(id)?.profession ?? null),
        amount,
        isDrillable: false,
        uses: null,
        // A person again, and the last rung: the card says so, because this row
        // opens nothing and a card promising otherwise would be untrue where it
        // stands.
        detail: composeCombatantDetail(reading, id, state, translate, "leaf"),
      }));

    // ⚠️ **The one level in the panel that closed against nothing.** A skill's
    // figure is added whatever the other end did, its pairs only where that end
    // resolved, so this list could total less than the entry it was opened from
    // and say nothing about the difference.
    //
    // `Leczenie` used to need an exception here, because its pairs are narrowed to
    // the one the level was entered through and the rest of the skill is
    // deliberately absent. It no longer reaches this line at all: that narrowing is
    // what `shouldOpenSkill` reads to make the row a leaf, so nothing can open it.
    const closeAgainst = isHealingMetric(state.metric) ? skill.healed : skill.dealtApplied;
    const orphan = closeAgainst - entries.reduce((sum, entry) => sum + entry.amount, 0);
    if (orphan > 0) entries.push(composeMissingEntry(state.metric, orphan));

    const list = composeBreakdownList(`KOMU — ${skill.skillName}`, entries);
    return list === null ? [] : [list];
  }

  const otherId = state.focusTargetId;
  if (otherId === null) return [];

  const { byElement, bySource, total: pairTotal } = getPairReading(reading, state, combatantId, otherId);

  const heading = `CZYM — ${getName(reading, otherId)}`;
  const skills = composeBreakdownList(
    heading,
    composePairSkillEntries(reading, state, combatantId, otherId, pairTotal, bySource, translate),
  );
  const composeLeaf = (
    names: Record<string, TokenName>,
    tokens: ReadonlyMap<string, number>,
  ): BreakdownEntry[] =>
    [...tokens].map(([token, amount]) => ({
      key: composeLeafRowKey(token),
      label: getPhrase(names, token, translate),
      profession: null,
      colour: UNKNOWN_COLOUR,
      amount,
      isDrillable: false,
      uses: null,
      detail: [],
    }));

  const elements = composeCrossSection(
    SOURCE_HEADINGS[state.metric],
    [
      ...composeLeaf(ELEMENT_NAMES, byElement),
      ...composeLeaf(HEALTH_LOSS_SOURCE_NAMES, bySource),
    ].sort((one, other) => other.amount - one.amount),
  );

  return [skills, elements].filter((list): list is PanelList => list !== null);
}
