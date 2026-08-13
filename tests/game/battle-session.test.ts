/**
 * How a fight is put together out of the pieces the game hands over.
 *
 * Each rule below was measured on the captures before it was written, and the
 * measurements are what make them worth guarding: the payload's shape is not
 * documented anywhere, so every one of these is a claim about the game that
 * could quietly stop being true.
 */

import { describe, expect, test } from "bun:test";
import {
  composeEmptySession,
  composeFightReading,
  composeNextSession,
  isFightStart,
} from "@/src/game/battle-session.ts";
import {
  getPayloadReading,
  type PayloadReading,
} from "@/src/game/engine-battle-wrap.ts";
import { CAPTURED_FIGHTS, type CapturedFight } from "@/tests/captured-fight-catalog.ts";

/** The payload the engine call carried, as the capture recorded it. */
function getPayloads(fight: CapturedFight): unknown[] {
  return fight.dump.calls.map((call) => call.payload);
}

/**
 * A payload the wrap read without trouble.
 *
 * Most of this file is about what the session does with what it is handed, and
 * the messages are stated apart from the payload so a case can be built without
 * also building the field they arrive in. Where the *reading* is the subject —
 * a payload we no longer recognise — the tests below use `getPayloadReading` on
 * a real payload instead, because a hand-built fault proves only that the field
 * can be set.
 */
function composeCleanReading(payload: unknown, messages: readonly string[] = []): PayloadReading {
  return { payload, messages, fault: null, lostMessages: 0 };
}

describe("where one fight ends and the next begins", () => {
  // The client compares with `==`, and the captures state a string. Reading only
  // one of the two would stop noticing fight starts the day the game sends the
  // other.
  test.each([["1"], [1]])("a payload stating init %p opens a fight", (init) => {
    expect(isFightStart({ init })).toBe(true);
  });

  test.each([[{}], [{ init: "0" }], [{ init: 0 }], [null], ["not a payload"]])(
    "%p does not",
    (payload) => {
      expect(isFightStart(payload)).toBe(false);
    },
  );

  /**
   * Order inside a single payload, which is the reason `composeNextSession` is
   * one function and not three: the opening payload carries the fight's roster
   * and — in the group capture — three of its messages. Resetting after taking
   * them would throw away the beginning of the fight it just started.
   */
  test("an opening payload keeps what it arrived with", () => {
    const stale = composeNextSession(
      composeEmptySession(),
      composeCleanReading({}, ["from an older fight"]),
    );
    const fresh = composeNextSession(
      stale,
      composeCleanReading(
        { init: "1", myteam: 1, w: { "7": { id: 7, name: "a", team: 1, prof: "m" } } },
        ["the new fight's first message"],
      ),
    );

    expect(fresh.messages).toEqual(["the new fight's first message"]);
    expect(fresh.combatants).toEqual([{ id: 7, name: "a", side: 1, profession: "m", level: null }]);
    expect(fresh.ourSide).toBe(1);
    expect(fresh.isFromFightStart).toBe(true);
  });

  /**
   * The one thing that has to survive the reset.
   *
   * A warning is scoped to the fight that produced it and clears when a later
   * fight decodes cleanly (§9.6), which needs the fights to be distinguishable.
   * Everything else about a fight is deliberately forgotten at `init`; a counter
   * that reset with them would make every fight look like the same one, and the
   * panel would go quiet after its first failure ever.
   */
  test("the fights are counted, and the count outlives the reset", () => {
    const first = composeNextSession(
      composeEmptySession(),
      composeCleanReading({ init: "1" }, ["a"]),
    );
    const during = composeNextSession(first, composeCleanReading({}, ["b"]));
    const second = composeNextSession(during, composeCleanReading({ init: "1" }, ["c"]));

    expect(composeEmptySession().fightsStarted).toBe(0);
    expect(first.fightsStarted).toBe(1);
    expect(during.fightsStarted).toBe(1);
    expect(second.fightsStarted).toBe(2);
    expect(second.messages).toEqual(["c"]);
  });

  // Joined mid-fight: no `init` was ever seen, so no fight has been watched open.
  test("a fight joined late is not counted as one that started", () => {
    const joined = composeNextSession(
      composeEmptySession(),
      composeCleanReading({}, ["mid-fight"]),
    );
    expect(joined.fightsStarted).toBe(0);
    expect(joined.isFromFightStart).toBe(false);
  });
});

describe("the roster as it arrives in pieces", () => {
  /**
   * Measured: `w` rides nearly every call but holds between 1 and 11 of 11
   * warriors. It is a delta, so a later fragment must not be read as the whole
   * roster — every name resolution in the fight depends on this.
   */
  test("a fragment adds and never takes away", () => {
    let session = composeNextSession(composeEmptySession(), composeCleanReading({
      init: "1",
      w: { "1": { id: 1, name: "one", team: 1, prof: "m" }, "2": { id: 2, name: "two", team: 2, prof: "m" } },
    }, []));
    session = composeNextSession(
      session,
      composeCleanReading({ w: { "3": { id: 3, name: "three", team: 2, prof: "m" } } }, []),
    );

    expect(session.combatants.map((combatant) => combatant.id)).toEqual([1, 2, 3]);
  });

  test("a payload mentioning nobody leaves the roster standing", () => {
    let session = composeNextSession(composeEmptySession(), composeCleanReading({
      init: "1",
      w: { "1": { id: 1, name: "one", team: 1, prof: "m" } },
    }, []));
    session = composeNextSession(
      session,
      composeCleanReading({ m: ["a message and no warriors"] }, ["x"]),
    );

    expect(session.combatants.map((combatant) => combatant.id)).toEqual([1]);
  });

  // First-seen order survives, so a later update does not reshuffle the fight.
  test("a fragment updates in place rather than moving anyone", () => {
    let session = composeNextSession(composeEmptySession(), composeCleanReading({
      init: "1",
      w: { "1": { id: 1, name: "one", team: 1, prof: "m" }, "2": { id: 2, name: "two", team: 2, prof: "m" } },
    }, []));
    session = composeNextSession(
      session,
      composeCleanReading({ w: { "1": { id: 1, name: "renamed", team: 1, prof: "m" } } }, []),
    );

    expect(session.combatants.map((combatant) => combatant.name)).toEqual(["renamed", "two"]);
  });
});

describe("which side is the player's", () => {
  /**
   * Measured: `myteam` rides the opening payload and no other. If a later
   * fragment could clear it, the panel would lose its labels partway through
   * every fight.
   */
  test("is remembered once stated", () => {
    let session = composeNextSession(
      composeEmptySession(),
      composeCleanReading({ init: "1", myteam: 2 }, []),
    );
    session = composeNextSession(session, composeCleanReading({ w: {} }, []));

    expect(session.ourSide).toBe(2);
  });

  // Attaching mid-fight never sees the opening payload. Null is the truth, and
  // guessing would put every row under the wrong heading.
  test("is unknown when the fight was joined late", () => {
    const session = composeNextSession(
      composeEmptySession(),
      composeCleanReading({ w: {} }, ["a message"]),
    );

    expect(session.ourSide).toBeNull();
    expect(session.isFromFightStart).toBe(false);
  });
});

/**
 * The session against the offline path.
 *
 * The captures are replayed payload by payload, exactly as the game delivered
 * them, and the fight that comes out must be the one the tools have been
 * reporting all along. This is what makes the wiring believable: nothing about
 * accumulating in fragments changes the answer.
 */
describe("a captured fight accumulated payload by payload", () => {
  test.each(CAPTURED_FIGHTS.map((fight) => [fight.name, fight] as const))(
    "%s reads as one fight",
    (_name, fight) => {
      let session = composeEmptySession();
      for (const [at, payload] of getPayloads(fight).entries()) {
        session = composeNextSession(
          session,
          composeCleanReading(payload, fight.dump.calls[at]!.protocolMessages),
        );
      }

      const reading = composeFightReading(session);
      expect(session.messages).toEqual(fight.dump.calls.flatMap((call) => call.protocolMessages));
      expect(reading.isFromFightStart).toBe(true);
      expect(reading.ourSide).not.toBeNull();

      // The roster rebuilt from fragments places everyone, which is the whole
      // point of merging: unplaced combatants would mean lost names.
      expect(reading.statistics.combatantIdsWithoutSide).toEqual([]);
      expect(reading.statistics.bySide.size).toBeGreaterThan(1);

      const landed = [...reading.statistics.bySide.values()].reduce(
        (total, side) => total + side.totals.dealtApplied,
        0,
      );
      expect(landed).toBeGreaterThan(0);
    },
  );
});

/**
 * Reading each message once has to mean the same thing as reading them all
 * again, or the panel gets fast and wrong.
 *
 * Measured before it was worth doing: reading everything on every payload cost
 * 4 ms on the worst payload of a 603-message fight, 18 ms at 3 618 and 39 ms at
 * 6 030 — 13.7 s across that one fight. Keeping the events brings the worst
 * payload to 4.3 ms and the fight to 1.1 s.
 */
describe("a fight read once rather than again and again", () => {
  function getReadingOfWholeFight(messagesByPayload: readonly (readonly string[])[], payload: unknown) {
    let session = composeEmptySession();
    for (const messages of messagesByPayload) {
      session = composeNextSession(session, composeCleanReading(payload, messages));
    }
    return composeFightReading(session);
  }

  /**
   * ⚠️ **The boundary the carry exists for.** The game glues an announcement to
   * the next message, and the next message can arrive in the next payload — so a
   * reading that started fresh at the payload boundary would lose the skill that
   * blow belongs to. Fast and wrong is worse than slow.
   */
  test("keeps a skill that was announced in the payload before its blow", () => {
    const announcement = "1=100.00;2=100.00;tspell=Cios;skillId=9";
    const blow = "1=100.00;2=90.00;+dmg=500;-dmg=400";

    const split = getReadingOfWholeFight([[announcement], [blow]], { w: {} });
    const together = getReadingOfWholeFight([[announcement, blow]], { w: {} });

    const skills = [...(split.statistics.byCombatantId.get(1)?.skills.values() ?? [])];
    expect(skills.map((skill) => skill.dealtApplied)).toEqual([400]);
    expect(JSON.stringify(split.statistics.byCombatantId.get(1))).toBe(
      JSON.stringify(together.statistics.byCombatantId.get(1)),
    );
  });

  /**
   * The one thing that can make an old reading wrong: damage stated against a
   * name resolves to nobody until the roster fragment naming them arrives, so a
   * roster that grew has to send everything back through the decoder.
   */
  test("reads the fight again when the roster learns a name", () => {
    const named = "1=100.00;0;+oth_dmg=250,c,późny(50.00%)";
    const first = { w: { 1: { id: 1, name: "pierwszy", team: 1, prof: "m", lvl: 100 } } };
    const second = {
      w: {
        1: { id: 1, name: "pierwszy", team: 1, prof: "m", lvl: 100 },
        2: { id: 2, name: "późny", team: 2, prof: "w", lvl: 100 },
      },
    };

    let session = composeEmptySession();
    session = composeNextSession(session, composeCleanReading(first, [named]));
    expect(composeFightReading(session).statistics.byCombatantId.has(2)).toBe(false);

    // Nothing new arrives with the second payload except the missing combatant.
    session = composeNextSession(session, composeCleanReading(second, []));
    const reading = composeFightReading(session);

    expect(reading.statistics.byCombatantId.get(2)?.taken).toBe(250);
    expect(reading.statistics.unattributed.taken).toBe(0);
  });
});

/**
 * A payload that changes nothing gives back the session it was handed, and the
 * caller reads identity as "nothing to redraw".
 *
 * Measured before it was worth doing, and it is the cheapest of the three cuts:
 * the game calls the engine on steps, chat and windows opening, and each of
 * those was rebuilding a panel that said exactly what it said before.
 */
describe("a payload that carried nothing", () => {
  const combatant = { id: 1, name: "ktoś", team: 1, prof: "m", lvl: 100 };

  test("hands back the very session it was given", () => {
    const opened = composeNextSession(
      composeEmptySession(),
      composeCleanReading({ init: 1, w: { 1: combatant } }, ["1=100.00;0;heal=10"]),
    );

    expect(composeNextSession(opened, composeCleanReading({ w: { 1: combatant } }, []))).toBe(
      opened,
    );
  });

  /**
   * ⚠️ **The case that made the first attempt wrong.** A fragment can correct a
   * name without changing how many combatants there are, and a check counting
   * them called that "nothing happened" — the panel would have kept the old name
   * for the rest of the fight.
   */
  test("but not when a fragment corrected somebody", () => {
    const opened = composeNextSession(
      composeEmptySession(),
      composeCleanReading({ init: 1, w: { 1: combatant } }, []),
    );
    const renamed = composeNextSession(
      opened,
      composeCleanReading({ w: { 1: { ...combatant, name: "ktoś inny" } } }, []),
    );

    expect(renamed).not.toBe(opened);
    expect(renamed.combatants[0]?.name).toBe("ktoś inny");
  });

  /**
   * ⚠️ **The single easiest place for the fault counting to be quietly undone.**
   * The caller redraws on identity, so a payload we could not read that carried
   * nothing else would be counted into a session nobody ever looks at again —
   * the count would be correct and invisible, which is the same as absent.
   */
  test("and not when the payload was one we could not read", () => {
    const opened = composeNextSession(
      composeEmptySession(),
      composeCleanReading({ init: 1, w: { 1: combatant } }, []),
    );
    const faulty = composeNextSession(opened, getPayloadReading({ mm: ["a"], mi: [1] }));

    expect(faulty).not.toBe(opened);
    expect(faulty.unreadablePayloadsByFault.get("messages-lost")).toBe(1);
    expect(faulty.lostMessages).toBe(1);
  });

  /**
   * ⚠️ **The same trap one field over, and it was open.** An entry naming
   * somebody we cannot read adds no combatant, so the merged roster comes back by
   * identity and the payload looks like one that changed nothing — the count
   * would land in a session the caller never draws. Written because removing the
   * clause that prevents it broke no test at all (§7.5): the reasoning had been
   * copied from the fault above and the guard had not.
   */
  test("and not when an entry named somebody we could not read", () => {
    const opened = composeNextSession(
      composeEmptySession(),
      composeCleanReading({ init: 1, w: { 1: combatant } }, []),
    );
    // Names somebody, states no side, so it is refused — and it is the only
    // thing in the payload, so nothing else can force a new session.
    const unreadable = composeNextSession(
      opened,
      composeCleanReading({ w: { 2: { id: 2, name: "ktoś jeszcze", prof: "m", lvl: 100 } } }, []),
    );

    expect(unreadable).not.toBe(opened);
    expect(unreadable.unreadableCombatants).toBe(1);
    expect(unreadable.combatants).toEqual(opened.combatants);
  });
});

describe("what this fight could not be read out of", () => {
  const combatant = { id: 1, name: "ktoś", team: 1, prof: "m", lvl: 100 };

  test("a clean fight counts nothing and says so with an empty map", () => {
    const session = composeNextSession(
      composeEmptySession(),
      getPayloadReading({ init: 1, w: { 1: combatant }, m: ["1=100.00;0;heal=10"], mi: [1] }),
    );

    expect(session.unreadablePayloadsByFault.size).toBe(0);
    expect(session.lostMessages).toBe(0);
  });

  test("faults are counted by kind, and the countable losses added up", () => {
    let session = composeNextSession(composeEmptySession(), composeCleanReading({ init: 1 }, []));
    session = composeNextSession(session, getPayloadReading({ mm: ["a", "b"], mi: [1, 2] }));
    session = composeNextSession(session, getPayloadReading({ mm: ["c"], mi: [1] }));
    session = composeNextSession(session, getPayloadReading("not a payload"));

    expect([...session.unreadablePayloadsByFault]).toEqual([
      ["messages-lost", 2],
      ["payload-not-a-record", 1],
    ]);
    // Three payloads went wrong and only two of them could say by how much. The
    // third adds nothing rather than adding zero.
    expect(session.lostMessages).toBe(3);
  });

  /**
   * §9.6 scopes a warning to the fight that produced it. That falls out of the
   * structure here — `composeEmptySession` is what a fight start resets to — and
   * this is what holds it, because reading the counters from `session` instead of
   * from `previous` would carry them across for the rest of the tab's life.
   */
  test("the count starts again with the next fight, and the fight count does not", () => {
    let session = composeNextSession(composeEmptySession(), composeCleanReading({ init: 1 }, []));
    session = composeNextSession(session, getPayloadReading({ mm: ["a"], mi: [1] }));
    expect(session.lostMessages).toBe(1);

    session = composeNextSession(session, composeCleanReading({ init: 1 }, []));

    expect(session.unreadablePayloadsByFault.size).toBe(0);
    expect(session.lostMessages).toBe(0);
    expect(session.fightsStarted).toBe(2);
  });

  /**
   * ⚠️ **The join between the counting and the saying, which nothing held.**
   * Replacing all three counts in `composeFightReading` with fresh zeroes broke
   * no test: the session counted correctly, the panel drew correctly whatever it
   * was handed, and the one line joining them could hand over nothing at all
   * without a word from the gate. That is the shape of every silence this round
   * has removed — a value declared, passed as a constant, and indistinguishable
   * from the real one at both ends.
   */
  test("and the reading a panel is handed carries them, rather than fresh zeroes", () => {
    let session = composeNextSession(composeEmptySession(), composeCleanReading({ init: 1 }, []));
    session = composeNextSession(session, getPayloadReading({ mm: ["a", "b"], mi: [1, 2] }));
    session = composeNextSession(
      session,
      composeCleanReading({ w: { 2: { id: 2, name: "ktoś", prof: "m", lvl: 100 } } }, []),
    );

    expect(composeFightReading(session).engineReading).toEqual({
      unreadablePayloadsByFault: new Map([["messages-lost", 1]]),
      lostMessages: 2,
      unreadableCombatants: 1,
    });
  });

  test("a fight that opens on a payload we could not read still opens", () => {
    // The fault must not cost the fight boundary: `init` is the only one the
    // protocol gives, and losing it would merge two fights into one total.
    const session = composeNextSession(
      composeEmptySession(),
      getPayloadReading({ init: 1, mm: ["a"], mi: [1] }),
    );

    expect(session.fightsStarted).toBe(1);
    expect(session.lostMessages).toBe(1);
  });
});
