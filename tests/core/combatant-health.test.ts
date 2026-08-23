/**
 * What a share stated about a whole side comes to, measured against what the game
 * actually did.
 *
 * The arithmetic itself is the subject of `tests/core/team-heal-rule.test.ts`,
 * which asks the captures what `healall_per` restores. This file asks the
 * narrower question that one cannot: whether **this reader**, walking a fight's
 * events from an unwound entry health with no snapshot to lean on, arrives at the
 * same figures the snapshots record. The two are independent — one re-seeds from a
 * snapshot at every call, the other seeds once at the fight's start and carries a
 * running total the length of the fight — and that independence is the whole value
 * of the comparison at the bottom of this file.
 */

import { describe, expect, test } from "bun:test";
import {
  composeEntryHealthByCombatantId,
  composeSizedTeamHeals,
  NO_ENTRY_HEALTH,
  type FightEntryHealth,
} from "@/src/core/combatant-health.ts";
import { composeCombatantRoster, type CombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFight, SIDE_SHARE_HEALTH_KEYS } from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import {
  CAPTURED_FIGHTS,
  composeRosterOfFight,
  getMessagesOfFight,
  type CapturedFight,
} from "@/tests/captured-fight-catalog.ts";

// Restated rather than imported, for the reason `tests/core/` restates every
// protocol key: a test asserting what the reader does with this key must not read
// the reader's own list of keys (§9.3).
const TEAM_HEAL_KEY = "healall_per";

const MAXIMUM = 10_000;

/**
 * Three on one side and one on the other.
 *
 * ⚠️ **Three, and the third is not padding.** A cast is refused outright unless
 * the caster has a *standing* side-mate other than themselves, so on a side of two
 * every case below that kills or refuses the mate would refuse the whole cast and
 * assert nothing. The third member is what keeps "this member was refused" and
 * "this cast was refused" separable.
 */
function composeSmallRoster(): CombatantRoster {
  return composeCombatantRoster([
    { id: 1, name: "healer", side: 1, profession: null, level: null, maximumHealth: MAXIMUM },
    { id: 2, name: "mate", side: 1, profession: null, level: null, maximumHealth: MAXIMUM },
    { id: 4, name: "other", side: 1, profession: null, level: null, maximumHealth: MAXIMUM },
    { id: 3, name: "enemy", side: 2, profession: null, level: null, maximumHealth: MAXIMUM },
  ]);
}

/**
 * Pairs rather than an object, because an object's keys are text and turning them
 * back into numbers would put a reader here that `libs/number.ts` owns (§9.5).
 */
function composeHealthOf(entry: readonly [number, number][]): FightEntryHealth {
  return new Map(entry);
}

function getSized(messages: string[], roster: CombatantRoster | null, entry: FightEntryHealth) {
  return composeSizedTeamHeals(decodeFight(messages, roster), roster, entry);
}

function getTeamHeals(messages: string[], roster: CombatantRoster | null, entry: FightEntryHealth) {
  return getSized(messages, roster, entry).filter((event) => event.kind === "team-heal");
}

function getUnaccounted(
  messages: string[],
  roster: CombatantRoster | null,
  entry: FightEntryHealth,
) {
  return getSized(messages, roster, entry).filter((event) => event.kind === "unaccounted-health");
}

describe("what a stated share restores", () => {
  const roster = composeSmallRoster();
  const health = composeHealthOf([[1, MAXIMUM], [2, MAXIMUM], [3, MAXIMUM], [4, MAXIMUM]]);
  // Combatant 2 is wounded for 2000 first, so the cap binds on one member and not
  // on the other — a cast where both are at full would pass with the cap removed.
  const wound = "3=100.00;2=80.00;+dmg=2000;-dmg=2000";
  const cast = `1=100.00;1=100.00;tspell=Fala;${TEAM_HEAL_KEY}=30`;

  test("reaches every standing side-mate, and the cap decides what each one gets", () => {
    const [teamHeal] = getTeamHeals([wound, cast], roster, health);
    expect(teamHeal?.kind).toBe("team-heal");
    // 1 is at full, so the share has nowhere to go; 2 is 2000 below where they
    // started, and 30% of 10 000 is more than that.
    expect([...(teamHeal?.restoredByCombatantId ?? [])].sort()).toEqual([
      [1, 0],
      [2, 2000],
      [4, 0],
    ]);
  });

  test("and nobody on the other side is in it at all", () => {
    const [teamHeal] = getTeamHeals([wound, cast], roster, health);
    expect(teamHeal?.restoredByCombatantId.has(3)).toBe(false);
  });

  test("a cast whose whole side was sized takes the unaccounted event's place", () => {
    expect(getUnaccounted([wound, cast], roster, health)).toEqual([]);
  });

  /**
   * The partial answer, and the reason the two events can stand together. Drop
   * this and a cast sized for one of two members reads downstream as a cast sized
   * for all of them, which is the failure §9.6 exists to prevent.
   */
  test("a cast missing one member's entry health is sized and still counted as missing", () => {
    const partial = composeHealthOf([[1, MAXIMUM], [3, MAXIMUM], [4, MAXIMUM]]);
    const sized = getSized([wound, cast], roster, partial);
    const teamHeal = sized.find((event) => event.kind === "team-heal");
    expect([...(teamHeal?.restoredByCombatantId ?? [])].sort()).toEqual([
      [1, 0],
      [4, 0],
    ]);
    expect(sized.filter((event) => event.kind === "unaccounted-health").length).toBe(1);
  });

  test("a cast this reader can size for nobody produces no figure at all", () => {
    const sized = getSized([wound, cast], roster, NO_ENTRY_HEALTH);
    expect(sized.filter((event) => event.kind === "team-heal")).toEqual([]);
    expect(sized.filter((event) => event.kind === "unaccounted-health").length).toBe(1);
  });

  /**
   * Zero is the boundary, and the material states it four times.
   *
   * A share of nothing restores nothing and is nonetheless a **whole** answer:
   * nothing is missing, so nothing downstream may warn that healing is short. It
   * is the one case where "sized" and "has a figure" come apart, which is exactly
   * why it is written down rather than left to be noticed (§7.5).
   */
  test("a share of zero sizes everyone at zero, and leaves nothing unaccounted for", () => {
    const messages = [wound, `1=100.00;1=100.00;tspell=Fala;${TEAM_HEAL_KEY}=0`];
    const [teamHeal] = getTeamHeals(messages, roster, health);
    expect([...(teamHeal?.restoredByCombatantId.values() ?? [])]).toEqual([0, 0, 0]);
    expect(getUnaccounted(messages, roster, health)).toEqual([]);
  });

  /** One above the boundary, so a reader that answered zero to everything fails. */
  test("and a share of one does not", () => {
    const [teamHeal] = getTeamHeals(
      [wound, `1=100.00;1=100.00;tspell=Fala;${TEAM_HEAL_KEY}=1`],
      roster,
      health,
    );
    expect(teamHeal?.restoredByCombatantId.get(2)).toBe(100);
  });

  test("a side-mate already at zero is reached and restored nothing", () => {
    const killed = "3=100.00;2=0.00;+dmg=99999;-dmg=10000";
    const [teamHeal] = getTeamHeals([killed, cast], roster, health);
    expect(teamHeal?.restoredByCombatantId.get(2)).toBe(0);
  });

  /**
   * Zero is the boundary and one is beside it (§7.5). A combatant on their last
   * point is standing: the cast reaches them, and the room below where they
   * started is nearly the whole pool.
   */
  test("a side-mate on one point is reached like any other", () => {
    const [teamHeal] = getTeamHeals(
      ["3=100.00;2=0.01;+dmg=9999;-dmg=9999", `1=100.00;1=100.00;tspell=Fala;${TEAM_HEAL_KEY}=50`],
      roster,
      health,
    );
    expect(teamHeal?.restoredByCombatantId.get(2)).toBe(5_000);
  });

  /**
   * The same boundary read by the other clause it decides: whether the caster has
   * an ally at all, which is what the help's halving turns on. One point is an
   * ally, so the cast is sized rather than refused.
   */
  test("and one point is enough to be the ally the cast needs", () => {
    const teamHeals = getTeamHeals(
      [
        "3=100.00;4=0.00;+dmg=10000;-dmg=10000",
        "3=100.00;2=0.01;+dmg=9999;-dmg=9999",
        `1=100.00;1=100.00;tspell=Fala;${TEAM_HEAL_KEY}=50`,
      ],
      roster,
      health,
    );
    expect(teamHeals.length).toBe(1);
  });

  /**
   * The help's clause no recording can reach: the effect is halved where the
   * caster has no allies. Nothing here has ever watched that happen, so the answer
   * is no figure rather than a halved one — and this is the only place that can be
   * checked, because every capture carrying the key is a group fight.
   */
  test("a caster with no standing ally is not sized at all", () => {
    const alone = composeCombatantRoster([
      { id: 1, name: "healer", side: 1, profession: null, level: null, maximumHealth: MAXIMUM },
      { id: 3, name: "enemy", side: 2, profession: null, level: null, maximumHealth: MAXIMUM },
    ]);
    const soloHealth = composeHealthOf([[1, 5_000], [3, MAXIMUM]]);
    expect(getTeamHeals([cast], alone, soloHealth)).toEqual([]);
    expect(getUnaccounted([cast], alone, soloHealth).length).toBe(1);
  });

  test("and neither is one whose every side-mate has already fallen", () => {
    const pair = composeCombatantRoster([
      { id: 1, name: "healer", side: 1, profession: null, level: null, maximumHealth: MAXIMUM },
      { id: 2, name: "mate", side: 1, profession: null, level: null, maximumHealth: MAXIMUM },
      { id: 3, name: "enemy", side: 2, profession: null, level: null, maximumHealth: MAXIMUM },
    ]);
    const killed = "3=100.00;2=0.00;+dmg=99999;-dmg=10000";
    const wounded = composeHealthOf([[1, 5_000], [2, MAXIMUM], [3, MAXIMUM]]);
    expect(getTeamHeals([killed, cast], pair, wounded)).toEqual([]);
  });

  test("no roster means no side to reach, so nothing is sized", () => {
    expect(getTeamHeals([wound, cast], null, health)).toEqual([]);
  });
});

/**
 * The stated percentage is a bound rather than a value, and both directions of
 * that are checked here.
 *
 * Measured over the corpus: overwriting the running total from every stated
 * percentage is wrong by a point on 8 of 110 readings, and keeping it wherever the
 * protocol does not contradict it is wrong on none. Two places against a pool in
 * the tens of thousands quantises to about a point and a half, and that lands on
 * the cap term.
 */
describe("the health the protocol restates", () => {
  const roster = composeSmallRoster();
  const health = composeHealthOf([[1, MAXIMUM], [2, MAXIMUM], [3, MAXIMUM], [4, MAXIMUM]]);
  const cast = `1=100.00;1=100.00;tspell=Fala;${TEAM_HEAL_KEY}=50`;

  test("is left alone where the running total already agrees with it", () => {
    // 2 takes 1234, so the exact total is 8766 and the protocol says 87.66.
    const [teamHeal] = getTeamHeals(
      ["3=100.00;2=87.66;+dmg=1234;-dmg=1234", cast],
      roster,
      health,
    );
    expect(teamHeal?.restoredByCombatantId.get(2)).toBe(1234);
  });

  /**
   * The correction, on the one thing that can produce it: health that moved for a
   * reason this decoder could not read. A running total has no way to notice that
   * on its own — an unread movement leaves no trace — so without the resync the
   * cap is computed against a combatant the reader believes is healthier than they
   * are, and the figure comes out too high.
   */
  test("and replaces it where the protocol contradicts it", () => {
    // The message states 70.00 while stating damage of only 1000, so 2000 of that
    // combatant's health went somewhere this reader cannot see.
    const [teamHeal] = getTeamHeals(
      ["3=100.00;2=70.00;+dmg=1000;-dmg=1000", cast],
      roster,
      health,
    );
    expect(teamHeal?.restoredByCombatantId.get(2)).toBe(3000);
  });

  /**
   * A combatant the protocol states at nothing has been clamped by the game, and
   * the clamp hides whatever went past it. Read as a value it would say "this
   * person is exactly at zero", which is a claim about how much reached them.
   */
  test("and never at zero, where the game's own clamp is what is being read", () => {
    const sized = getSized(["3=100.00;2=0.00;+dmg=99999;-dmg=10000"], roster, health);
    expect(sized.filter((event) => event.kind === "unknown-message")).toEqual([]);
  });

  /**
   * ⚠️ **The test above asserts the wrong thing and was the only one here.** It
   * reads the event list for an unknown message, which the clamp has nothing to do
   * with, so removing the clamp guard entirely left it green — found by
   * `bun tools/mutation-sweep.ts src/core/combatant-health.ts`
   * (`docs/audits/2026-08-19-the-whole-tree-read-a-fourth-time.md`, F2). What the
   * guard is for is the **running total**, so that is what this reads.
   *
   * 2 loses 1 000 and the protocol then states them at nothing. Kept, the total
   * says 9 000 and the cast fills the 1 000 of room below their entry health.
   * Resynced to zero, the same cast restores nothing at all — the figure is short
   * by everything the clamp hid.
   */
  test("and the total it keeps at zero is the one the cast is capped against", () => {
    const [teamHeal] = getTeamHeals(
      ["3=100.00;2=0.00;+dmg=1000;-dmg=1000", cast],
      roster,
      health,
    );
    expect(teamHeal?.restoredByCombatantId.get(2)).toBe(1000);
  });

  /**
   * The boundary on the other side of it, and zero is the boundary (§7.5): one
   * hundredth of a point is a health the game is stating rather than a clamp it is
   * hiding, so it resyncs like any other.
   */
  test("and a statement just above nothing is a statement, not a clamp", () => {
    const [teamHeal] = getTeamHeals(["3=100.00;2=1.00;+dmg=0;-dmg=0", cast], roster, health);
    expect(teamHeal?.restoredByCombatantId.get(2)).toBe(5_000);
  });
});

/**
 * The tolerance the resync is judged against, at both of its edges.
 *
 * ⚠️ **Every bound here survived a mutation sweep.** The width, the arithmetic
 * that builds it and both comparisons could each be changed with the whole gate
 * green (`docs/audits/2026-08-19-the-whole-tree-read-a-fourth-time.md`, F2) — and
 * the width is the load-bearing half of the argument that a stated percentage is a
 * **bound** rather than a value: two decimal places of a pool in the tens of
 * thousands quantise to about a point and a half, and overwriting the exact
 * running total with the rounded figure every time one is stated puts readings a
 * point wrong.
 *
 * A pool of 20 000 read at 75% is what makes both edges land on whole health —
 * 14 999 and 15 001 exactly — so a combatant can stand on one. At 90% the upper
 * edge computes to 18 000.999999999996 and no integer reaches it, which is a real
 * asymmetry of the arithmetic and the reason these numbers are not the round ones.
 *
 * What the cast reveals is the running total itself: the share is far above the
 * cap, so what a member is restored is exactly `entry − current`.
 */
describe("the width of the tolerance", () => {
  const POOL = 20_000;
  const roster = composeCombatantRoster([
    { id: 1, name: "healer", side: 1, profession: null, level: null, maximumHealth: POOL },
    { id: 2, name: "mate", side: 1, profession: null, level: null, maximumHealth: POOL },
    { id: 4, name: "other", side: 1, profession: null, level: null, maximumHealth: POOL },
    { id: 3, name: "enemy", side: 2, profession: null, level: null, maximumHealth: POOL },
  ]);
  const health = composeHealthOf([[1, POOL], [2, POOL], [3, POOL], [4, POOL]]);
  const cast = `1=100.00;1=100.00;tspell=Fala;${TEAM_HEAL_KEY}=50`;

  const getRestored = (blow: string): number | undefined =>
    getTeamHeals([blow, cast], roster, health)[0]?.restoredByCombatantId.get(2);

  test("a total sitting exactly on the lower edge is left alone", () => {
    expect(getRestored("3=100.00;2=75.00;+dmg=5001;-dmg=5001")).toBe(5_001);
  });

  test("and one sitting exactly on the upper edge is left alone too", () => {
    expect(getRestored("3=100.00;2=75.00;+dmg=4999;-dmg=4999")).toBe(4_999);
  });

  test("a total one point outside it is replaced by what the protocol states", () => {
    expect(getRestored("3=100.00;2=75.00;+dmg=5002;-dmg=5002")).toBe(5_000);
  });
});

describe("what a fight was entered with", () => {
  const maxima = new Map([
    [1, MAXIMUM],
    [2, MAXIMUM],
  ]);

  test("is the stated health where nothing had happened yet", () => {
    const entry = composeEntryHealthByCombatantId(new Map([[1, 8_000]]), maxima, []);
    expect([...entry]).toEqual([[1, 8_000]]);
  });

  /**
   * The unwind, and the whole reason this function exists. A snapshot taken after
   * the fight's opening messages states a health nobody entered with, and reading
   * it as one refuses every combatant it touches.
   */
  test("is unwound back through everything that had already happened", () => {
    const opening = decodeFight(["2=100.00;1=80.00;+dmg=2000;-dmg=2000"], null);
    const entry = composeEntryHealthByCombatantId(new Map([[1, 8_000]]), maxima, opening);
    expect(entry.get(1)).toBe(MAXIMUM);
  });

  /**
   * ⚠️ **The unwind above reads a snapshot; this one reads a message, and only the
   * first had a test.** Where the opening payload carries no snapshot — which is
   * what two of the recordings do — the anchor is the first health percentage the
   * messages themselves state, unwound the same way. Nothing exercised that
   * arithmetic, so its sign could be flipped with the whole gate green and two
   * recordings' healing figures off by 98%
   * (`docs/audits/2026-08-19-the-whole-tree-read-a-fourth-time.md`, F2).
   *
   * 1 is struck for 2 000 and the same message states them at 80%, which is where
   * they stand *after* it. Entering at 8 000 + 2 000 is the whole of the reading;
   * entering at 8 000 − 2 000 is what the flipped sign says.
   */
  test("is unwound from the first statement in the messages where no snapshot names anybody", () => {
    const opening = decodeFight(["2=100.00;1=80.00;+dmg=2000;-dmg=2000"], null);
    const entry = composeEntryHealthByCombatantId(new Map(), maxima, opening);
    expect(entry.get(1)).toBe(MAXIMUM);
    // The striker is stated too, and nothing had moved for them.
    expect(entry.get(2)).toBe(MAXIMUM);
  });

  /**
   * A combatant the game has clamped to zero says where they are and not how much
   * reached them, so an unwind cannot start from one — the same reading the
   * running total is held to above, at the other end of the fight.
   */
  test("skips a first statement of nothing and anchors on the next one", () => {
    const opening = decodeFight([
      "2=100.00;1=0.00;+dmg=99999;-dmg=1000",
      "2=100.00;1=50.00;+dmg=0;-dmg=0",
    ], null);
    const entry = composeEntryHealthByCombatantId(new Map(), maxima, opening);
    expect(entry.get(1)).toBe(6_000);
  });

  /**
   * The same clamp read at the other end, and the end the rule had never reached.
   * A snapshot of nothing is missing whatever overkill went past it, so unwinding
   * from one lands above the maximum and refuses the combatant outright — while
   * their own statements say the right figure and are never consulted, because the
   * snapshot wins wherever it can be used.
   *
   * 1 is struck for 12 000 of a possible 10 000 and the snapshot has them at
   * nothing. Reading the snapshot gives 12 000 entered; reading the statement
   * gives the 10 000 they had.
   */
  test("skips a snapshot of nothing and unwinds from the messages instead", () => {
    const opening = decodeFight([
      "2=100.00;1=50.00;+dmg=5000;-dmg=5000",
      "2=100.00;1=0.00;+dmg=12000;-dmg=7000",
    ], null);
    const entry = composeEntryHealthByCombatantId(new Map([[1, 0]]), maxima, opening);
    expect(entry.get(1)).toBe(MAXIMUM);
  });

  /**
   * ⚠️ **A refusal one point wide, on a pool wide enough to hide it.**
   *
   * The figures are the recording's own: a pool of 23 874, a blow of 3 374, and
   * the game stating 85.87% — which is what 20 500 of 23 874 rounds to, and which
   * reads back as 20 501. The unwind then lands on 23 875 of a possible 23 874,
   * and a refusal is final, so every later statement about that combatant goes
   * with it. Their side's casts are then never whole and the panel calls the whole
   * fight's healing understated (`src/core/combatant-health.ts`).
   *
   * A pool of its own rather than `MAXIMUM`, and that is the measurement rather
   * than a convenience: the slack a two-place percentage carries is half a
   * hundredth of the pool, which is 0.5 on 10 000 and 1.19 on 23 874. The same one
   * point is a contradiction on the small pool and a rounding on the large one, so
   * a hand-built fight at `MAXIMUM` could not have shown this at all.
   */
  test("reads an unwinding a rounded percentage puts one point over the maximum", () => {
    const pool = new Map([[1, 23_874]]);
    const opening = decodeFight(["2=100.00;1=85.87;+dmg=3374;-dmg=3374"], null);
    const entry = composeEntryHealthByCombatantId(new Map(), pool, opening);
    expect(entry.get(1)).toBe(23_874);
  });

  /**
   * And the width is a width rather than an opening. Twice the slack is still a
   * disagreement, and the reading that produced it is refused whichever end it
   * came from — which is the case the ceiling has always existed for.
   */
  test("refuses one the same reading puts further over than that", () => {
    const pool = new Map([[1, 23_874]]);
    const opening = decodeFight(["2=100.00;1=85.87;+dmg=3377;-dmg=3377"], null);
    const entry = composeEntryHealthByCombatantId(new Map(), pool, opening);
    expect(entry.has(1)).toBe(false);
  });

  test("refuses a combatant whose maximum nothing states", () => {
    const entry = composeEntryHealthByCombatantId(new Map([[9, 100]]), maxima, []);
    expect(entry.has(9)).toBe(false);
  });

  test("refuses an unwinding that lands above the maximum", () => {
    // Stated at full while having already taken 2000, which would put the entry
    // health at 12 000 of a possible 10 000 — a recording whose snapshot and whose
    // messages cannot both be about the same combatant.
    const opening = decodeFight(["2=100.00;1=80.00;+dmg=2000;-dmg=2000"], null);
    const entry = composeEntryHealthByCombatantId(new Map([[1, MAXIMUM]]), maxima, opening);
    expect(entry.has(1)).toBe(false);
  });

  test("refuses one that lands at nothing at all", () => {
    const opening = decodeFight(["2=100.00;1=0.00;+dmg=8000;-dmg=8000"], null);
    const entry = composeEntryHealthByCombatantId(new Map([[1, 8_000]]), maxima, opening);
    expect(entry.has(1)).toBe(false);
  });

  /**
   * The circular case, refused outright rather than per combatant: a team heal in
   * the opening moved health by an amount only an entry health could size, so
   * unwinding through it would need the answer it is computing.
   */
  test("refuses the whole fight where the opening carries health it cannot size", () => {
    const opening = decodeFight([`1=100.00;1=100.00;tspell=Fala;${TEAM_HEAL_KEY}=30`], null);
    const entry = composeEntryHealthByCombatantId(new Map([[1, 9_000]]), maxima, opening);
    expect([...entry]).toEqual([]);
  });

  /**
   * ⚠️ **Which slot each kind states health for, asked per kind.** Every one of
   * these passes through one reader, and until this block existed nothing
   * distinguished the kinds from each other: `attack` and `skill-used` carried the
   * same eight lines, so either could have been reading the other's slots with the
   * whole gate green (`docs/audits/2026-08-19-the-whole-tree-read-a-fourth-time.md`,
   * F2, and `docs/audits/2026-08-21-the-code-read-for-its-smells.md`, F6).
   *
   * The health each entry states is the health *after* the message, so a kind that
   * moved health for the wrong combatant shows up as an entry that is too high —
   * or, above the maximum, as no entry at all.
   */
  test("reads both ends of an announcement, and moves nothing for either", () => {
    const opening = decodeFight(["2=90.00;1=70.00;tspell=Fala"], null);
    const entry = composeEntryHealthByCombatantId(new Map(), maxima, opening);

    expect(entry.get(2)).toBe(9_000);
    expect(entry.get(1)).toBe(7_000);
  });

  test("moves a blow's health for the one struck and not for the one swinging", () => {
    const opening = decodeFight(["2=90.00;1=70.00;+dmg=2000;-dmg=2000"], null);
    const entry = composeEntryHealthByCombatantId(new Map(), maxima, opening);

    // The struck one is unwound through the blow; the striker is not, and would
    // land at 11 000 of a possible 10 000 and be refused if they were.
    expect(entry.get(1)).toBe(9_000);
    expect(entry.get(2)).toBe(9_000);
  });

  test("reads health that fell outside a blow against the one it fell on", () => {
    const opening = decodeFight(["1=50.00;0;poison=100"], null);
    const entry = composeEntryHealthByCombatantId(new Map(), maxima, opening);

    expect([...entry]).toEqual([[1, 5_100]]);
  });

  /**
   * A name this fight's roster cannot place states a health belonging to nobody.
   * Two refusals stand in the way and this asks for the answer rather than for
   * which of them gave it: the statement needs both halves, and a combatant with
   * no maximum is refused in any case.
   */
  test("states nothing for a health whose combatant did not resolve", () => {
    const opening = decodeFight(["2=100.00;1=80.00;+oth_dmg=440, ,Gracz 5(66.95%)"], null);
    const entry = composeEntryHealthByCombatantId(new Map(), maxima, opening);

    expect([...entry]).toEqual([]);
  });
});

/** Every capture, and what this reader makes of the casts in it. */
const SIZED_FIGHTS = CAPTURED_FIGHTS.map((fight: CapturedFight) => {
  const roster = composeRosterOfFight(fight);
  const events = decodeFight(getMessagesOfFight(fight), roster);
  return {
    name: fight.name,
    fight,
    roster,
    castsStated: events.filter((event) => event.kind === "unaccounted-health").length,
    sized: composeSizedTeamHeals(events, roster, fight.entryHealthByCombatantId),
  };
});

describe("the keys a share can be read from", () => {
  /**
   * The two ends of one list, held to each other. The decoder decides which keys
   * become an `unaccounted-health` event and this module decides which of those it
   * can size — if they ever came apart, a key would be read into an event nothing
   * downstream would ever look at, and the only symptom would be healing quietly
   * missing from a panel that had stopped warning about it.
   */
  test("are the decoder's own list, and the team heal is in it", () => {
    expect(SIDE_SHARE_HEALTH_KEYS).toContain(TEAM_HEAL_KEY);
    expect(new Set(SIDE_SHARE_HEALTH_KEYS).size).toBe(SIDE_SHARE_HEALTH_KEYS.length);
  });

  /**
   * The reducer the help names, and the whole reason its absence is readable.
   *
   * The client composes `lowheal_per-enemies` into its battle log with a figure in
   * it (production build `1786514810315`), so it arrives as a protocol key — this
   * decoder has no meaning for it, which puts it in an `unknown-message`'s unread
   * keys, and that is what can be looked for. A fight that never mentions it is a
   * fight where the reduction was not applied; one that does cannot have any of
   * its casts sized, because the help does not say whether the protocol pre-applies
   * the reduction the way it demonstrably pre-applies the weakening.
   *
   * ⚠️ **One occurrence disqualifies the whole fight, not the casts after it.**
   * The effect is declared once and applies from the initiation layer, so a cast
   * earlier in the same fight is no safer than a later one.
   */
  test("a fight declaring the reducer has none of its casts sized", () => {
    const roster = composeSmallRoster();
    const entry = composeHealthOf([[1, MAXIMUM], [2, MAXIMUM], [4, MAXIMUM]]);
    const cast = `1=100.00;1=100.00;tspell=Fala;${TEAM_HEAL_KEY}=30`;
    const wound = "3=100.00;2=80.00;+dmg=2000;-dmg=2000";
    const declared = "3=100.00;0;lowheal_per-enemies=15";

    // Stated after the cast, so a reader that only looked backwards would size it.
    const withReducer = getSized([wound, cast, declared], roster, entry);
    expect(withReducer.filter((event) => event.kind === "team-heal")).toEqual([]);
    expect(withReducer.filter((event) => event.kind === "unaccounted-health").length).toBe(1);

    // And the same fight without it is sized, or the refusal above proves nothing.
    expect(getTeamHeals([wound, cast], roster, entry).length).toBe(1);
  });

  /**
   * The mechanism the refusal rests on, asserted rather than assumed: the key
   * reaches the events at all. If the decoder ever started reading it, the check
   * above would stop finding it and every cast in such a fight would be sized —
   * silently, and in the direction that overstates.
   */
  test("and the reducer reaches the events as an unread key", () => {
    const events = decodeFight(["3=100.00;0;lowheal_per-enemies=15"], composeSmallRoster());
    const unread = events.flatMap((event) =>
      event.kind === "unknown-message" ? event.unreadKeys : [],
    );
    expect(unread).toContain("lowheal_per-enemies");
  });

  /** A key outside that list states a share this module refuses to act on. */
  test("and a share stated under any other key is left exactly as it was", () => {
    const roster = composeSmallRoster();
    const entry = composeHealthOf([[1, MAXIMUM], [2, MAXIMUM], [4, MAXIMUM]]);
    const events = decodeFight([`1=100.00;1=100.00;tspell=Fala;${TEAM_HEAL_KEY}=30`], roster);
    const invented = events.map((event) =>
      event.kind === "unaccounted-health" ? { ...event, source: "no_such_key" } : event,
    );
    const sized = composeSizedTeamHeals(invented, roster, entry);
    expect(sized.filter((event) => event.kind === "team-heal")).toEqual([]);
    expect(sized.filter((event) => event.kind === "unaccounted-health").length).toBe(1);
  });
});

describe("over every captured fight", () => {
  test("the corpus carries casts, so nothing below is measured on an empty set", () => {
    expect(SIZED_FIGHTS.reduce((total, of) => total + of.castsStated, 0)).toBeGreaterThan(0);
  });

  /**
   * ⚠️ **Every cast in the corpus is sized, and this test has twice asserted
   * otherwise.** It once held both halves — something sized, something refused —
   * because fourteen casts across two captures could not be reached; both are
   * reached now, their entry health unwound from the first statement about each
   * combatant rather than from the snapshot alone.
   *
   * Then it named `2026-08-23-tempest-grupa-vs-hildur-auto` as an exception for
   * one commit. That was a defect of ours written down as a property of the
   * material: one combatant's unwind landed a single point over their maximum,
   * and the allowance meant to absorb exactly that was smaller than a health
   * point on their pool, so it absorbed nothing
   * (`docs/specs/2026-08-23-an-allowance-smaller-than-a-health-point.md`). With
   * the floor in place the corpus is wholly sized again and the exception is
   * gone.
   *
   * So the refusal is once more not confirmed against this corpus at all. It is
   * held by the hand-built fights above — a fight joined in progress, a caster
   * with no standing ally, a member whose entry health is missing — and that is
   * stated here so the absence reads as a measurement rather than as a gap.
   */
  test("every cast in the corpus is sized whole", () => {
    const refused = SIZED_FIGHTS.flatMap((of) =>
      of.sized.filter((event) => event.kind === "unaccounted-health").map(() => of.name),
    );
    expect(refused).toEqual([]);
    expect(SIZED_FIGHTS.reduce((total, of) => total + of.castsStated, 0)).toBeGreaterThan(0);
  });

  /**
   * And every member of every casting side is sized, which is the half the test
   * above cannot see: it counts casts left over, and a cast short by one member
   * still produces a `team-heal`. The recording that forced the floor is exactly
   * that shape, so the claim is worth its own line.
   */
  test("and every member of the caster's side gets a figure, on every cast", () => {
    for (const of of SIZED_FIGHTS) {
      const roster = composeRosterOfFight(of.fight);
      for (const heal of of.sized) {
        if (heal.kind !== "team-heal") continue;
        const side = roster.byId.get(heal.casterId)?.side;
        const missing = [...roster.byId.values()]
          .filter((one) => one.side === side && !heal.restoredByCombatantId.has(one.id))
          .map((one) => one.id);
        expect(missing, `${of.name} cast by ${heal.casterId}`).toEqual([]);
      }
    }
  });

  /**
   * The partition. A cast is sized whole or it is still counted as missing, and
   * never both and never neither — which is what lets the panel's warning mean
   * exactly "healing is still short" (§9.6).
   */
  test("every cast is either sized whole or still counted as unaccounted for", () => {
    for (const { name, castsStated, sized } of SIZED_FIGHTS) {
      const left = sized.filter((event) => event.kind === "unaccounted-health").length;
      const heals = sized.filter((event) => event.kind === "team-heal").length;
      expect(castsStated - left + Math.max(0, heals - (castsStated - left)), name).toBe(heals);
      expect(left, name).toBeLessThanOrEqual(castsStated);
    }
  });

  /**
   * ⚠️ **The two captures this used to name as unreachable are reachable now.**
   * They open with 354 and 297 messages and no snapshot beside them, so unwinding
   * the snapshot alone put the anchor after eight casts nothing could size. Every
   * combatant in both is stated by a message before the first cast — by a `step`
   * or by a skill announcement, which is why those two events carry a health
   * percentage they have no figure of their own to go with.
   */
  test("every fight states an entry health for everyone it will size", () => {
    const withoutEntryHealth = SIZED_FIGHTS.filter(
      (of) => of.castsStated > 0 && of.fight.entryHealthByCombatantId.size === 0,
    ).map((of) => of.name);
    expect(withoutEntryHealth).toEqual([]);
  });

  /**
   * ⚠️ **The measurement this whole file is for.**
   *
   * Every cast that stood alone in its engine call, compared against the health
   * the snapshots on either side of that call actually record. The reader under
   * test never sees a snapshot: it seeds once from an unwound entry health and
   * carries a running total for the length of the fight, so agreeing here is two
   * independent readings of the same event arriving at the same number.
   *
   * Restoring the cap to `Infinity` puts 62 of these readings wrong, and making
   * the resync unconditional puts 8 of them wrong by a point.
   */
  test("every isolable cast reproduces the health the snapshots recorded, exactly", () => {
    const disagreeing: string[] = [];
    let compared = 0;

    for (const { name, fight, sized } of SIZED_FIGHTS) {
      const casts = sized.filter((event) => event.kind === "team-heal");
      let seen = 0;
      const castByCall = new Map<number, number>();
      for (const call of fight.dump.calls) {
        for (const message of call.protocolMessages) {
          const carries = parseProtocolMessage(message).parameters.some(
            (parameter) => parameter.key === TEAM_HEAL_KEY,
          );
          if (!carries) continue;
          castByCall.set(call.index, seen);
          seen += 1;
        }
      }

      for (const call of fight.dump.calls) {
        // Only a call that is one message, or the health that moved is the sum of
        // everything in it and a comparison against it is a comparison against
        // nothing.
        if (call.protocolMessages.length !== 1) continue;
        const at = castByCall.get(call.index);
        if (at === undefined) continue;
        const cast = casts[at];
        if (cast === undefined) continue;

        const after = new Map(call.combatantsAfter.map((c) => [c.id, c.health.current]));
        for (const before of call.combatantsBefore) {
          const now = after.get(before.id);
          const ours = cast.restoredByCombatantId.get(before.id);
          if (now === undefined || ours === undefined) continue;
          compared += 1;
          if (ours !== now - before.health.current) {
            disagreeing.push(
              `${name} call ${call.index} combatant ${before.id}: ${ours} against ${now - before.health.current}`,
            );
          }
        }
      }
    }

    expect(compared).toBeGreaterThan(0);
    expect(disagreeing).toEqual([]);
  });
});
