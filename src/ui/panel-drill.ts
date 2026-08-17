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
import type { SkillStatistics } from "@/src/core/fight-statistics.ts";
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
import { getMetricValue, getName, getRow, type PanelReading } from "@/src/ui/panel-reading.ts";
import {
  composeLeafRowKey,
  composeSkillRowKey,
  composeTargetRowKey,
  NOBODY_ROW_KEY,
  UNANNOUNCED_ROW_KEY,
} from "@/src/ui/panel-row-key.ts";
import type { PanelDetailLine, PanelList } from "@/src/ui/panel-shape.ts";
import type { PanelState } from "@/src/ui/panel-state.ts";
import { getProfessionColour, UNKNOWN_COLOUR } from "@/src/ui/panel-tokens.ts";

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
 */
function composeCrossSection(
  heading: string,
  entries: readonly BreakdownEntry[],
): PanelList | null {
  return entries.length > 1 ? composeBreakdownList(heading, entries) : null;
}

/** Who this combatant hit, or who hit them, or who healed them. */
function composeOpponentEntries(
  reading: PanelReading,
  state: PanelState,
  combatantId: number,
): BreakdownEntry[] {
  const row = getRow(reading, combatantId);
  const pairs: Array<readonly [number, number]> =
    state.metric === "dealt"
      ? [...row.dealtByTargetId].map(
          ([id, byElement]) => [id, [...byElement.values()].reduce((sum, one) => sum + one, 0)] as const,
        )
      : state.metric === "taken"
        ? [...row.takenByActorId].map(
            ([id, byElement]) => [id, [...byElement.values()].reduce((sum, one) => sum + one, 0)] as const,
          )
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
      isDrillable: true,
      uses: null,
      detail: [],
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

/** The end of a pair the game did not name, as a row rather than as a silence. */
function composeMissingEntry(metric: PanelMetric, amount: number): BreakdownEntry {
  const missing = getMissingCounterpart(metric);
  return {
    key: NOBODY_ROW_KEY,
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
      isDrillable: true,
      uses: skill.uses,
      detail: [],
    });
  };

  if (state.metric === "dealt") {
    for (const [key, skill] of getRow(reading, combatantId).skills) {
      setEntry(combatantId, key, skill, skill.dealtApplied);
    }
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
      key: `source:${token}`,
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
  if (state.metric === "taken") {
    entries.push(...compose(HEALTH_LOSS_SOURCE_NAMES, row.healthLostBySource, UNKNOWN_COLOUR));
  }
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
      composeOpponentEntries(reading, state, combatantId),
    ),
    composeCrossSection("CZYM (UMIEJĘTNOŚCI)", composeSkillEntries(reading, state, combatantId)),
    composeCrossSection(
      SOURCE_HEADINGS[state.metric],
      composeSourceEntries(reading, state, combatantId, translate),
    ),
  ].filter((list): list is PanelList => list !== null);
}

/**
 * The skills behind one pair's figure — what this combatant used *on that one
 * opponent*, rather than across the fight.
 *
 * The section closes against the pair's own total the way the fight-wide one
 * closes against the combatant's: what no announcement covered is a row, not a
 * silence, or the parts would sum to less than the figure they were entered from
 * and nothing would say why.
 */
function composePairSkillEntries(
  reading: PanelReading,
  state: PanelState,
  combatantId: number,
  otherId: number,
  pairTotal: number,
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
      key: composeLeafRowKey(`skill:${skill.skillName}`),
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

    // Under `otrzymane` the skill belongs to somebody else and the row was
    // entered from what it gave *this* combatant, so the level narrows to that
    // one pair. Under `dane` the skill is their own and the question is who all
    // of it reached, so nothing is filtered away.
    const pairs = !isHealingMetric(state.metric)
      ? [...skill.dealtByTargetId]
      : isGivenMetric(state.metric)
        ? [...skill.healedByCombatantId]
        : [...skill.healedByCombatantId].filter(([id]) => id === combatantId);

    const entries: BreakdownEntry[] = pairs
      .sort(([, one], [, other]) => other - one)
      .map(([id, amount]) => ({
        key: composeLeafRowKey(composeIntegerText(id)),
        label: getName(reading, id),
        profession: reading.roster.byId.get(id)?.profession ?? null,
        colour: getProfessionColour(reading.roster.byId.get(id)?.profession ?? null),
        amount,
        isDrillable: false,
        uses: null,
        detail: [],
      }));

    // ⚠️ **The one level in the panel that closed against nothing.** A skill's
    // figure is added whatever the other end did, its pairs only where that end
    // resolved, so this list could total less than the entry it was opened from
    // and say nothing about the difference. Not under `Leczenie`: there the pairs
    // are narrowed to the one the level was entered through, so the rest of the
    // skill is deliberately absent and there is nothing to be short of.
    const closeAgainst = state.metric === "healed" ? null : isHealingMetric(state.metric) ? skill.healed : skill.dealtApplied;
    const orphan =
      closeAgainst === null ? 0 : closeAgainst - entries.reduce((sum, entry) => sum + entry.amount, 0);
    if (orphan > 0) entries.push(composeMissingEntry(state.metric, orphan));

    const list = composeBreakdownList(`KOMU — ${skill.skillName}`, entries);
    return list === null ? [] : [list];
  }

  const otherId = state.focusTargetId;
  if (otherId === null) return [];

  // Which end of the pair the figures are read from turns on the direction, not
  // on the quantity — the same correction as in `composePairSkillEntries`.
  const from = isGivenMetric(state.metric) ? getRow(reading, combatantId) : getRow(reading, otherId);
  const to = isGivenMetric(state.metric) ? otherId : combatantId;
  const byElement = isHealingMetric(state.metric)
    ? new Map<string, number>()
    : (from.dealtByTargetId.get(to) ?? new Map<string, number>());
  const pairTotal = isHealingMetric(state.metric)
    ? [...from.skills.values()].reduce(
        (sum, skill) => sum + (skill.healedByCombatantId.get(to) ?? 0),
        0,
      )
    : [...byElement.values()].reduce((sum, one) => sum + one, 0);

  const heading = `CZYM — ${getName(reading, otherId)}`;
  const skills = composeBreakdownList(
    heading,
    composePairSkillEntries(reading, state, combatantId, otherId, pairTotal),
  );
  const elements = composeCrossSection(
    SOURCE_HEADINGS[state.metric],
    [...byElement]
      .sort(([, one], [, other]) => other - one)
      .map(([token, amount]): BreakdownEntry => ({
        key: composeLeafRowKey(token),
        label: getPhrase(ELEMENT_NAMES, token, translate),
        profession: null,
        colour: UNKNOWN_COLOUR,
        amount,
        isDrillable: false,
        uses: null,
        detail: [],
      })),
  );

  return [skills, elements].filter((list): list is PanelList => list !== null);
}
