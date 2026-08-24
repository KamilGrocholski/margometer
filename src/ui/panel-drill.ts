/**
 * What a row opens onto: the two levels below the ranking, and the card either of
 * them shows on hover.
 *
 * The levels first became a file when they were carved out of `panel-view.ts`
 * (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F26); the card
 * followed them here the moment the drill became its second reader. It is the
 * same card at every level and says whose figures they are, so it belongs beside
 * the thing that decides what a level holds rather than beside the ranking that
 * shows the same card one rung up.
 *
 * ⚠️ **A row that opens nothing is not a row that says nothing.** What no
 * announcement covered still stands in its section so the parts add up to the
 * figure above them, and under `Zadane` that row carries how many blows — which
 * is the question a plain attack raises. `docs/drill-levels.md` is the register
 * of which rows open and which do not, held both ways by
 * `tests/tools/drill-report.test.ts`.
 *
 * **The strings are Polish and nothing else here is** (§3).
 */

import { assertDefined } from "@/libs/assert.ts";
import { composeIntegerText } from "@/libs/number.ts";
import { getTotalOfValues, setRunningTotal } from "@/libs/running-total.ts";
import { type CombatantStatistics, type SkillStatistics } from "@/src/core/fight-statistics.ts";
import {
  composeFigureText,
  composeShareTexts,
  CRITICAL_EFFECT_TOKENS,
  CRITICAL_TOKEN,
  DEFENCE_NAMES,
  DESTRUCTION_NAMES,
  EFFECT_NAMES,
  ELEMENT_NAMES,
  getMissingCounterpart,
  getPhrase,
  HEALTH_GAIN_SOURCE_NAMES,
  HEALTH_LOSS_SOURCE_NAMES,
  PERCENT_DESTRUCTION_TOKEN,
  PROFESSION_NAMES,
  ROW_WARNING_HEADING,
  VERY_CRITICAL_TOKEN,
  type TokenName,
  type TranslateLabel,
} from "@/src/ui/panel-words.ts";
import {
  composeLeafRowKey,
  composeSkillLeafRowKey,
  composeSkillRowKey,
  composeSourceRowKey,
  composeTargetRowKey,
  isGivenMetric,
  isHealingMetric,
  METRIC_LABELS,
  NO_ACTOR_ROW_KEY,
  NO_TARGET_ROW_KEY,
  PANEL_METRICS,
  type PanelDetailLine,
  type PanelList,
  type PanelMetric,
  type PanelState,
  UNANNOUNCED_ROW_KEY,
} from "@/src/ui/panel-screen.ts";
import {
  composeRowWarnings,
  getHealingGivenWithoutSkillBySource,
  getHealingReceivedWithoutSkillBySource,
  getHealthLostCausedBySource,
  getMetricValue,
  getName,
  getRow,
  type PanelReading,
} from "@/src/ui/panel-reading.ts";
import { getProfessionColour, UNKNOWN_COLOUR } from "@/src/ui/panel-look.ts";

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

  const critical = row.procsOnBlowsStruck.get(CRITICAL_TOKEN) ?? 0;
  const veryCritical = row.procsOnBlowsStruck.get(VERY_CRITICAL_TOKEN) ?? 0;
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
  return token === PERCENT_DESTRUCTION_TOKEN
    ? `${composeFigureText(amount)}%`
    : composeFigureText(amount);
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
    .filter(([token]) => !CRITICAL_EFFECT_TOKENS.includes(token))
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

  // Last of the blocks and first of the two closing notes, because it answers for
  // every figure above it rather than for one of them — and because a reader who
  // opened the card did so after seeing the mark, so this is what they came for.
  const warnings = composeRowWarnings(row, state.metric);
  if (warnings.length > 0) {
    lines.push({ kind: "heading", text: ROW_WARNING_HEADING });
    for (const warning of warnings) lines.push({ kind: "note", text: warning });
  }

  // The card is about the person, so its figures are the fight's — and one level
  // in, the row it stands over states a narrower one. Said at the foot rather than
  // beside the stats: it answers for every number above it, not for one block.
  const scope = SCOPE_NOTES[place];
  if (scope !== null) lines.push({ kind: "note", text: scope });

  lines.push({ kind: "note", text: GESTURE_NOTES[place] });
  return lines;
}

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
  // The section states its own total above the rows, so its shares are a set that
  // has to add to it — apportioned together rather than rounded a row at a time
  // (`composeShareTexts`), which is the same fault the ranking had.
  const shareTexts = composeShareTexts(entries.map((entry) => entry.amount), total);

  return {
    heading,
    totalText: composeFigureText(total),
    rows: entries.map((entry, index) => ({
      key: entry.key,
      rank: null,
      label: entry.label,
      profession: entry.profession,
      colour: entry.colour,
      fill: largest > 0 ? entry.amount / largest : 0,
      valueText: composeFigureText(entry.amount),
      bracketText: `(${assertDefined(shareTexts[index], "every row of a section is written as a share")}${entry.uses === null ? "" : ` · ×${composeFigureText(entry.uses)}`})`,
      isDrillable: entry.isDrillable,
      detail: entry.detail,
      /**
       * Never a mark, at any level. A section row is a **cut** of a figure — an
       * opponent, a key, a skill — and a shortfall cannot be placed onto one cut:
       * an unread message says nothing about which part of somebody's total it
       * would have moved. The combatant's own row carries it, and it carries it at
       * every level, so the reader is told once and in the place the claim is true
       * (`docs/specs/2026-08-24-a-warning-on-the-row-it-shortens.md`).
       */
      warnings: [],
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
      setRunningTotal(totals, id, getTotalOfValues(byToken));
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
 * The row that closes a section against the row above it — **on the damage
 * screens, which are now the only ones that reach it.**
 *
 * ⚠️ **It used to be keyed by all four metrics, and the two healing wordings said
 * something false.** `Nie wiadomo, czym` stood over health `heal`,
 * `legbon_holytouch_heal` and `legbon_lastheal` had named, which the panel was
 * printing in the very next section — 16 527 of one row's 32 057 points on
 * `tests/captured-fights/2026-08-17-tempest-grupa-vs-hildur.json`. Under healing
 * the section now names the key instead, so nothing is left over to close against
 * and there is no wording to decide (`composeHealingSourceEntries`).
 *
 * The type is the narrowing: a metric that is not one of these two cannot be
 * looked up here, so the day a healing residual comes back the compiler asks for
 * it rather than a ternary answering `Zwykły cios` on its behalf.
 */
type ClosingMetric = Extract<PanelMetric, "dealt" | "taken">;

function isClosingMetric(metric: PanelMetric): metric is ClosingMetric {
  return metric === "dealt" || metric === "taken";
}

const CLOSING_LABELS: Record<ClosingMetric, string> = {
  dealt: "Zwykły cios",
  taken: "Zwykły cios",
};

const CLOSING_NOTES: Record<ClosingMetric, string> = {
  dealt:
    "Cios, przed którym nie stała żadna umiejętność. Gra nie odróżnia go od dodatkowego zamachu, który sama jej dała.",
  taken:
    "Cios, przed którym nie stała żadna umiejętność. Gra nie odróżnia go od dodatkowego zamachu, który sama jej dała.",
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
 * Healing nothing announced, as rows of its own in the section about what it was
 * done with — the twin of the wound rows above, and it exists for their argument.
 *
 * ⚠️ **The alternative was the closing row, and that row was a claim.**
 * `Nie wiadomo, czym` said the game had not told us; the game had, under `heal`,
 * `legbon_holytouch_heal` and `legbon_lastheal`, and the panel was printing those
 * very words one section lower under `OD CZEGO`. What is missing over them is an
 * *announcement*, which is not the same thing and is not what a player reads that
 * sentence as. Measured on
 * `tests/captured-fights/2026-08-17-tempest-grupa-vs-hildur.json`, one row's
 * 16 527 unnamed points were `ostatni ratunek` 11 077 and `leczenie` 5 450,
 * exactly.
 *
 * It carries no count for the reason the wound rows carry none: the protocol
 * states no number of applications, and a heal is not a swing.
 *
 * A key nobody has named still arrives — `getPhrase` falls back to the token — so
 * this can never be short, which is what lets the closing row retire from healing
 * altogether.
 *
 * ⚠️ **A zero is kept, where the skill rows beside it are dropped at zero, and the
 * difference is what a zero means in each.** `legbon_holytouch_heal=0` is a heal
 * the game reported and that restored nothing — it happened (§9.6) — and
 * `OD CZEGO` one section down has always drawn it, so dropping it here would leave
 * two cuts of one figure disagreeing about which keys were in play. A skill at zero
 * is the other claim: under `Leczenie` that loop reaches every combatant's skills,
 * so zero there means the skill never touched this row at all.
 */
function composeHealingSourceEntries(
  bySource: ReadonlyMap<string, number>,
  translate: TranslateLabel | null,
): BreakdownEntry[] {
  return [...bySource].map(([token, amount]) => ({
    key: composeLeafRowKey(token),
    label: getPhrase(HEALTH_GAIN_SOURCE_NAMES, token, translate),
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
    entries.push(
      ...composeHealingSourceEntries(
        getHealingGivenWithoutSkillBySource(getRow(reading, combatantId)),
        translate,
      ),
    );
  } else {
    for (const [ownerId, row] of reading.statistics.byCombatantId) {
      for (const [key, skill] of row.skills) {
        setEntry(ownerId, key, skill, skill.healedByCombatantId.get(combatantId) ?? 0);
      }
    }
    entries.push(
      ...composeHealingSourceEntries(
        getHealingReceivedWithoutSkillBySource(getRow(reading, combatantId)),
        translate,
      ),
    );
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
  if (!isClosingMetric(state.metric)) return entries;

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

  const entries =
    state.metric === "healed"
      ? compose(HEALTH_GAIN_SOURCE_NAMES, row.healedBySource, UNKNOWN_COLOUR)
      : // The same pair of vocabularies on both damage screens, from the two ends
        // of one figure: what a combatant lost outside a blow, and what they took
        // off somebody else outside one.
        [
          ...compose(
            ELEMENT_NAMES,
            state.metric === "dealt" ? row.dealtAppliedByElement : row.takenByElement,
            UNKNOWN_COLOUR,
          ),
          ...compose(
            HEALTH_LOSS_SOURCE_NAMES,
            state.metric === "dealt" ? getHealthLostCausedBySource(row) : row.healthLostBySource,
            UNKNOWN_COLOUR,
          ),
        ];

  // ⚠️ **Sorted once, for every screen.** The healing branch used to return before
  // this line, so `OD CZEGO` under `Leczenie` came out in whatever order the
  // aggregate happened to write its keys — 27 sections across the recordings held
  // on 2026-08-21 listed a smaller figure above a larger one, which is the one
  // thing a list of bars says without being read
  // (`docs/audits/2026-08-21-the-code-read-for-its-smells.md`, F3).
  return entries.sort((one, other) => other.amount - one.amount);
}

const OPPONENT_HEADINGS: Record<PanelMetric, string> = {
  dealt: "KOMU",
  taken: "OD KOGO",
  healingGiven: "KOMU",
  healed: "OD KOGO",
};

/**
 * ⚠️ **One of these four cannot be drawn, and it stays anyway.** Healing given has
 * no source cut at all — the keys the game names belong to whoever received the
 * health — so `composeSourceEntries` returns an empty list for it and the heading
 * is never read (`docs/audits/2026-08-21-the-rest-of-the-code-read-for-its-smells.md`,
 * F7). The entry is here for the reason every table in `src/ui/panel-words.ts` is
 * exhaustive: the compiler asks about a fifth screen instead of letting it inherit
 * whichever wording came first. What the audit found missing was anybody saying
 * so — and `tests/ui/panel-drill.test.ts` now holds the emptiness rather than
 * leaving it to be rediscovered as a dead word.
 */
const SOURCE_HEADINGS: Record<PanelMetric, string> = {
  dealt: "TYP OBRAŻEŃ",
  taken: "TYP OBRAŻEŃ",
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
 * the combatant's — on the damage screens. Under healing there is nothing left to
 * close against: what no announcement covered is named by its key here as it is
 * one level up, so the parts already sum to the figure they were entered from.
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

  /**
   * What the game named and no announcement did, in this pair.
   *
   * The wound stands here for the reason it stands in the fight-wide section:
   * `Zwykły cios` below would otherwise absorb it and call it a blow. The heal
   * stands here for the same reason with a different row — `Nie wiadomo, czym`
   * would have absorbed it and called it unknown.
   *
   * ⚠️ **Two vocabularies, and picking the wrong one is silent.** `heal` is a key
   * of both tables and runs the opposite way in each, which is why
   * `src/ui/panel-words.ts` splits them at all: named from the loss table, a heal
   * would print as *ujemne przywracanie życia*.
   */
  const names = isHealingMetric(state.metric) ? HEALTH_GAIN_SOURCE_NAMES : HEALTH_LOSS_SOURCE_NAMES;
  for (const [token, amount] of bySource) {
    entries.push({
      key: composeSkillLeafRowKey(token),
      label: getPhrase(names, token, translate),
      profession: null,
      colour: UNKNOWN_COLOUR,
      amount,
      isDrillable: false,
      uses: null,
      detail: [],
    });
  }

  /**
   * ⚠️ **Sorted here rather than where the skills were.** The named skills arrive
   * ordered and the rows above are appended after them, so a key larger than every
   * skill in the pair sat at the bottom of the list — which is the one thing a
   * column of bars says without being read. Measured the moment healing gained
   * such rows: on `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json`,
   * `CZYM — <name>` under `Leczenie dane` put a full-length bar under a third-length
   * one. The same fault was reachable through a wound and no recording had one.
   */
  entries.sort((one, other) => other.amount - one.amount);

  if (!isClosingMetric(state.metric)) return entries;

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
  /**
   * Read off the same row as the elements, and off the giving end for the same
   * reason: the pair's figure is what one combatant did to the other, whichever
   * direction the screen is asking from.
   *
   * ⚠️ **The healing map holds only what no announcement covered, and the damage
   * one holds a quantity that is disjoint from the blows by construction.** Both
   * are therefore addable to the named skills without counting anything twice —
   * the whole of `healedBySource` would not be, since an announced heal is in it
   * as well.
   */
  const bySource = isHealingMetric(state.metric)
    ? (from.healingGivenWithoutSkillByCombatantId.get(to) ?? nothing)
    : (from.healthLostCausedByTargetId.get(to) ?? nothing);
  const total = isHealingMetric(state.metric)
    ? (from.healingGivenByCombatantId.get(to) ?? 0)
    : getTotalOfValues(byElement) + getTotalOfValues(bySource);
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

  /**
   * ⚠️ **A pair on a healing screen has no second section, and that is a decision
   * rather than an omission.** `byElement` is empty there — healing has no element
   * — so this section would hold exactly the key rows `CZYM — <name>` above it
   * already lists, under a second heading and in the same order. The damage screens
   * keep theirs because the elements really are a cut the section above does not
   * show.
   *
   * It became reachable the day the healing pair gained a source map at all, and
   * would have drawn those rows out of `HEALTH_LOSS_SOURCE_NAMES` — where `heal` is
   * a health *loss* and reads *ujemne przywracanie życia*. Two quantities under
   * one label is a wrong number that looks right (`src/ui/panel-words.ts`).
   */
  const elements = isHealingMetric(state.metric)
    ? null
    : composeCrossSection(
        SOURCE_HEADINGS[state.metric],
        [
          ...composeLeaf(ELEMENT_NAMES, byElement),
          ...composeLeaf(HEALTH_LOSS_SOURCE_NAMES, bySource),
        ].sort((one, other) => other.amount - one.amount),
      );

  return [skills, elements].filter((list): list is PanelList => list !== null);
}
