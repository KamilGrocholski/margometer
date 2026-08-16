/**
 * What the protocol states that no total counts, and the test a key has to pass
 * to be read that way.
 *
 * The rule this file holds is one sentence: **whatever this figure did, it is
 * either reported elsewhere or in a unit no total here keeps.** A key that passes
 * is read and counted as nothing; a key that fails stays unread, because its
 * message really may be short of something and the panel has to say so.
 *
 * Both halves are here on purpose. Reading a declaration is only worth doing
 * because it stops the panel crying wolf, and that is only worth stopping while
 * the remaining cries are true.
 */

import { describe, expect, test } from "bun:test";
import { decodeFight, UNDERSTOOD_PROTOCOL_KEYS } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { CAPTURED_FIGHTS, composeRosterOfFight, getMessagesOfFight, } from "@/tests/captured-fight-catalog.ts";

/**
 * Restated rather than imported from the decoder: a guard that reads the list it
 * guards agrees with it by construction and checks nothing.
 */
const STANDALONE_KEYS = ["step", "prepare", "txt", "+exp", "poison_lowdmg_per-enemies"];

/**
 * The keys that pass the criterion on a **measurement of health** rather than on
 * a reading of what they mean.
 *
 * Each rides a blow, and for each the decoded damage reproduces the percentages
 * the same message states, to the hundredth — so whatever the figure did, it did
 * not move health. `-legbon_facade` is the plainest case: nobody knows what it
 * counts, and it is read all the same, because "not health" is the whole of what
 * a declaration claims.
 */
const SETTLED_BY_THE_WITNESS = ["-legbon_facade", "+critpoison_per", "+legbon_holytouch"];

const MESSAGES = CAPTURED_FIGHTS.flatMap((fight) =>
  getMessagesOfFight(fight),
);

const EVENTS = CAPTURED_FIGHTS.flatMap((fight) =>
  decodeFight(
    getMessagesOfFight(fight),
    composeRosterOfFight(fight),
  ),
);

test("the captures carry material to check", () => {
  expect(MESSAGES.length).toBeGreaterThan(0);
  expect(EVENTS.filter((event) => event.kind === "declaration").length).toBeGreaterThan(0);
});

describe("a message that is one key and no outcome", () => {
  /**
   * The measurement the whole event kind rests on. If one of these ever rode a
   * blow, it would be a declaration sitting beside figures, and the question of
   * whether it belonged to them would be a question the protocol never answers.
   */
  test.each(STANDALONE_KEYS)("`%s` is the only key in every message carrying it", (key) => {
    const carrying = MESSAGES.map((message) => parseProtocolMessage(message)).filter(
      ({ parameters }) => parameters.some((parameter) => parameter.key === key),
    );

    expect(carrying.length).toBeGreaterThan(0);
    for (const { parameters } of carrying) {
      expect(parameters.map((parameter) => parameter.key)).toEqual([key]);
    }
  });

  test.each(STANDALONE_KEYS)("`%s` reaches the panel as a declaration, not as unread", (key) => {
    const carrying = MESSAGES.filter((message) =>
      parseProtocolMessage(message).parameters.some((parameter) => parameter.key === key),
    );
    const events = decodeFight(carrying);

    expect(events.some((event) => event.kind === "unknown-message")).toBe(false);
    for (const event of events) {
      expect(event.kind).toBe("declaration");
      expect(event).toMatchObject({ declared: [{ effect: key }] });
    }
  });

  /**
   * ⚠️ **`step` is not read as a turn boundary.** It looks exactly like one — no
   * value, one combatant, alone in its message — and the protocol does not say
   * so. What is read is that the message stated `step` about somebody, which is
   * the whole of what arrived.
   */
  test("`step` carries no value, names its actor, and is called nothing else", () => {
    const [event] = decodeFight(["445202=100.00;0;step"]);
    expect(event).toEqual({
      kind: "declaration",
      combatantId: 445202,
      declared: [{ effect: "step", amount: null, text: null }],
    });
  });

  // Text where the value is text, and no figure invented for it.
  test("a value that is not a figure arrives as text", () => {
    const [event] = decodeFight(["445202=100.00;0;prepare=Something(50.00%)"]);
    expect(event).toMatchObject({
      declared: [{ effect: "prepare", amount: null, text: "Something(50.00%)" }],
    });
  });
});

describe("what a declaration is allowed to do to the numbers", () => {
  /**
   * Nothing, and this is the check that says so over real material rather than
   * over an example: the aggregate is computed twice, once from every event and
   * once with every declaration removed, and the two agree in every figure.
   *
   * Written this way because the failure it guards against is additive and
   * quiet — a slot that starts totalling `+engback` shows up here as a number
   * that differs, whichever number it is.
   */
  test.each(CAPTURED_FIGHTS)("$name: the totals are the same without them", (fight) => {
    const roster = composeRosterOfFight(fight);
    const events = decodeFight(
      getMessagesOfFight(fight),
      roster,
    );
    const withoutDeclarations = events
      .filter((event) => event.kind !== "declaration")
      .map((event) =>
        event.kind === "attack" || event.kind === "skill-used"
          ? { ...event, declared: [] }
          : event,
      );

    const whole = composeFightStatistics(events, roster);
    const stripped = composeFightStatistics(withoutDeclarations, roster);

    // Not vacuous for this fight: every capture carries standalone declarations.
    // The ones riding a blow are checked across the material below, because only
    // the group fight carries any.
    expect(events.some((event) => event.kind === "declaration")).toBe(true);

    for (const [combatantId, row] of whole.byCombatantId) {
      const same = stripped.byCombatantId.get(combatantId);
      expect(row.dealtRaw, `${combatantId}`).toBe(same?.dealtRaw ?? -1);
      expect(row.dealtApplied, `${combatantId}`).toBe(same?.dealtApplied ?? -1);
      expect(row.taken, `${combatantId}`).toBe(same?.taken ?? -1);
      expect(row.healed, `${combatantId}`).toBe(same?.healed ?? -1);
      expect(row.healthLost, `${combatantId}`).toBe(same?.healthLost ?? -1);
    }
    expect(whole.unattributed.taken).toBe(stripped.unattributed.taken);
    expect(whole.unattributed.healed).toBe(stripped.unattributed.healed);
  });

  // The other half of the non-vacuity above: the material carries declarations
  // riding a blow and an announcement too, so the equality is checked over
  // events of every shape this rule covers.
  test("the material carries declarations on blows and on announcements", () => {
    const onBlows = EVENTS.filter((event) => event.kind === "attack" && event.declared.length > 0);
    const onAnnouncements = EVENTS.filter(
      (event) => event.kind === "skill-used" && event.declared.length > 0,
    );
    expect(onBlows.length).toBeGreaterThan(0);
    expect(onAnnouncements.length).toBeGreaterThan(0);
  });

  // A declaration event names somebody, and naming somebody must not conjure a
  // row for them: they did nothing, and a row of zeroes says they did.
  test("a message that only declares gives nobody a row", () => {
    const statistics = composeFightStatistics(decodeFight(["445202=100.00;0;step"]));
    expect(statistics.byCombatantId.size).toBe(0);
    expect(statistics.reading.unreadableMessages).toBe(0);
  });
});

describe("the keys the health arithmetic settled", () => {
  test.each(SETTLED_BY_THE_WITNESS)("`%s` is read, and no total counts it", (key) => {
    expect(UNDERSTOOD_PROTOCOL_KEYS).toContain(key);
  });

  /**
   * The measurement itself, re-run here rather than quoted from the register:
   * every message carrying one of these states a health percentage on at least
   * one side, and the witness judges that call rather than skipping it.
   *
   * If that stopped being true the entries above would rest on nothing, and the
   * register would be quoting a measurement nobody makes any more.
   */
  test.each(SETTLED_BY_THE_WITNESS)("`%s` rides a message that states health", (key) => {
    const carrying = MESSAGES.map((message) => parseProtocolMessage(message)).filter(
      ({ parameters }) => parameters.some((parameter) => parameter.key === key),
    );

    expect(carrying.length).toBeGreaterThan(0);
    const stating = carrying.filter(
      ({ actor, target }) => actor?.healthPercent != null || target?.healthPercent != null,
    );
    expect(stating.length).toBeGreaterThan(0);
  });
});

/**
 * The key that fails the criterion, and what is done about it instead.
 *
 * `healall_per` is understood in every respect but one: the health it restores
 * appears nowhere else in the protocol. Calling it a declaration would take the
 * mark off a total that really is short — the single direction the panel cannot
 * recover from, because nothing downstream would know (§9.6). So it is read into
 * an event that says so.
 */
describe("health that moved where nobody can be credited", () => {
  test("a team heal is read, and says the healing is missing", () => {
    const events = decodeFight(["445202=100.00;445202=100.00;tspell=Something;healall_per=30"]);
    const statistics = composeFightStatistics(events);

    expect(UNDERSTOOD_PROTOCOL_KEYS).toContain("healall_per");
    expect(statistics.reading.unreadableMessages).toBe(0);
    expect(statistics.reading.unaccountedHealthBySource.get("healall_per")).toBe(1);
    expect(statistics.byCombatantId.get(445202)?.healed).toBe(0);
    expect(statistics.unattributed.healed).toBe(0);
  });

  // Every capture, so the claim is about the material rather than an example.
  test.each(CAPTURED_FIGHTS)("$name: every team heal is counted as missing", (fight) => {
    const roster = composeRosterOfFight(fight);
    const statistics = composeFightStatistics(
      decodeFight(
        getMessagesOfFight(fight),
        roster,
      ),
      roster,
    );
    const casts = statistics.reading.unaccountedHealthBySource.get("healall_per") ?? 0;
    const stated = getMessagesOfFight(fight)
      .filter((message) => message.includes("healall_per")).length;

    expect(casts).toBe(stated);
  });
});
