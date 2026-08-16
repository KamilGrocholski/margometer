/**
 * What a click does to the panel's state.
 *
 * Four pure functions: a state and a control in, the part of a state that
 * changes out. No page, no global, no layer — which is why they left
 * `src/userscript-entry.ts`, where they had been sitting among the wiring
 * (`docs/audits/2026-08-13-the-whole-tree-read-once.md`, F14). That file is
 * `[any]` because it is the one allowed to know every layer at once (§2), and
 * that is a licence to do the wiring rather than a place to keep code that
 * knows none of them.
 *
 * They belong to `ui` because what they encode is how the screens nest —
 * the same question `panel-view.ts` answers from the other end. They compute no
 * statistic, so §9.1's line is untouched.
 */

import { getRowKeyMeaning } from "@/src/ui/panel-row-key.ts";
import type { PanelMetric, PanelState, PanelTeam } from "@/src/ui/panel-view.ts";

/**
 * What a clicked row does to the state.
 *
 * The key is the view's own and its prefix is what says which level was clicked;
 * reading it here rather than passing three optional ids keeps `ui` free of the
 * question "which of these is set".
 */
export function composeStateFromRow(state: PanelState, key: string): Partial<PanelState> {
  const meaning = getRowKeyMeaning(key);
  switch (meaning.opens) {
    case "back":
      return composeStateAfterBack(state);
    case "combatant":
      return {
        focusCombatantId: meaning.combatantId,
        focusTargetId: null,
        focusSkill: null,
      };
    case "target":
      return { focusTargetId: meaning.combatantId, focusSkill: null };
    case "skill":
      return {
        focusSkill: { ownerId: meaning.ownerId, key: meaning.key },
        focusTargetId: null,
      };
    case "nothing":
      // A row that opens no level, said as a case rather than by falling
      // through: the compiler refuses a meaning nobody decided about.
      return {};
  }
}

/**
 * A side tab chooses who is on the list, so choosing one closes the breakdown.
 *
 * Further than the metric goes, and the asymmetry is the point: the same
 * combatant exists in every metric, so switching metric keeps them in focus —
 * but a side filter decides *who is on the list at all*, and can put the one in
 * focus off it. Measured against the alternative: while a breakdown is open the
 * team changes nothing on screen at either level, so a tab that only dropped the
 * deep level would still look chosen while the panel did not move.
 *
 * Rejected: dropping the focus only when the filter excludes them. That needs
 * the admission rule outside `ui`, where this file would hold a second copy of
 * the ranking's logic — §9.1's line, spent on a nicety.
 */
export function composeStateAfterTeam(team: PanelTeam): Partial<PanelState> {
  return { team, focusCombatantId: null, focusTargetId: null, focusSkill: null };
}

/**
 * Both control strips land here, because both answer the same question: which
 * figure. What they share is the reset, and the deep level is the part that must
 * go.
 *
 * ⚠️ **A deep level does not survive turning the figure round.** Under
 * `Leczenie · otrzymane` an open skill belongs to whoever cast it — somebody
 * other than the combatant in focus — while under `Leczenie · dane` the skills
 * are the combatant's own. Carrying `focusSkill` across the flip opens a key that
 * is not on that side of the join, and the same is true of `focusTargetId`, whose
 * end of the pair the direction decides. The combatant stays: they exist in every
 * metric, which is the asymmetry `composeStateAfterTeam` above is about.
 */
export function composeStateAfterMetric(metric: PanelMetric): Partial<PanelState> {
  return { metric, focusTargetId: null, focusSkill: null };
}

/** One level out, and only one: the way back is as small a step as the way in. */
export function composeStateAfterBack(state: PanelState): Partial<PanelState> {
  if (state.focusTargetId !== null || state.focusSkill !== null) {
    return { focusTargetId: null, focusSkill: null };
  }
  return { focusCombatantId: null };
}
