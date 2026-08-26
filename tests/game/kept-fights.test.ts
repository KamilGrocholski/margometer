/**
 * What a kept fight has to survive: a rotation that never drops what somebody
 * pinned, and a round trip through text that a person can edit.
 *
 * Two halves, and the second is the one that earns its length. A fight comes back
 * out of a browser store as `unknown`, and §9.6 says state that survives a reload
 * is validated on read — so every field below is broken on purpose and the fight
 * has to be **dropped**, not repaired, not defaulted, and not read with a hole in
 * it. The material is the real thing: the recordings are replayed into a session
 * and the session is what is kept, so what round-trips here is a fight and not a
 * shape somebody typed (§7.5).
 */

import { describe, expect, test } from "bun:test";
import { composeEmptySession, composeNextSession, type BattleSession } from "@/src/game/battle-session.ts";
import { getPayloadReading } from "@/src/game/engine-battle-wrap.ts";
import {
  composeKeptFight,
  composeKeptFightsAfterKeeping,
  composeKeptFightsAfterPin,
  composeKeptFightsAfterRemoval,
  composeKeptFightsWithinLimit,
  composeSessionFromKeptFight,
  composeStoredTextFromKeptFights,
  setKeptFightsThatFit,
  getKeptFightsFromStoredText,
  KEPT_FIGHTS_FORMAT,
  type KeptFight,
} from "@/src/game/kept-fights.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import { composeBattleRoster } from "@/src/game/engine-roster.ts";
import { CAPTURED_FIGHTS, type CapturedFight } from "@/tests/captured-fight-catalog.ts";
import { getValueFromJsonText } from "@/libs/json.ts";
import { composeJsonText } from "@/libs/json.ts";
import { getRecordFromValue } from "@/libs/record.ts";

function composeSessionOfCapture(fight: CapturedFight): BattleSession {
  let session = composeEmptySession();
  for (const call of fight.dump.calls) session = composeNextSession(session, getPayloadReading(call.payload));
  return session;
}

function composeKeptFightOfCapture(fight: CapturedFight, id: string): KeptFight {
  const session = composeSessionOfCapture(fight);
  const { roster } = composeBattleRoster(session.combatants, session.ourSide);
  const statistics = composeFightStatistics(session.events, roster, session.entryHealthByCombatantId);
  return composeKeptFight(session, statistics.outcome, id, "2026-08-26T19:04:00.000Z");
}

/** One recording, named, so the figures below have a referent (§3). */
const GROUP_FIGHT = CAPTURED_FIGHTS.find(
  (fight) => fight.name === "2026-08-06-tempest-grupa-vs-hildur",
)!;

/** A fight with nothing in it, for the rotation — which has no interest in content. */
function composeBareFight(id: string, isPinned = false): KeptFight {
  return {
    id,
    keptAt: `2026-08-26T19:0${id}:00.000Z`,
    isPinned,
    outcome: null,
    messages: [],
    combatants: [],
    ourSide: null,
    isFromFightStart: true,
    entryHealthByCombatantId: new Map(),
    unreadablePayloadsByFault: new Map(),
    lostMessages: 0,
    unreadableCombatants: 0,
  };
}

describe("keeping one more fight", () => {
  test("puts the newest first", () => {
    const kept = composeKeptFightsAfterKeeping(
      [composeBareFight("1"), composeBareFight("2")],
      composeBareFight("3"),
      5,
    );
    expect(kept.fights.map((fight) => fight.id)).toEqual(["3", "1", "2"]);
    expect(kept.dropped).toEqual([]);
    expect(kept.isRefused).toBe(false);
  });

  test("drops the oldest once the limit is reached", () => {
    const kept = composeKeptFightsAfterKeeping(
      [composeBareFight("2"), composeBareFight("1")],
      composeBareFight("3"),
      2,
    );
    expect(kept.fights.map((fight) => fight.id)).toEqual(["3", "2"]);
    expect(kept.dropped).toEqual(["1"]);
  });

  /** The whole of what a pin buys, and the reason it is not a licence to spend more. */
  test("drops the oldest unpinned rather than the oldest", () => {
    const kept = composeKeptFightsAfterKeeping(
      [composeBareFight("2"), composeBareFight("1", true)],
      composeBareFight("3"),
      2,
    );
    expect(kept.fights.map((fight) => fight.id)).toEqual(["3", "1"]);
    expect(kept.dropped).toEqual(["2"]);
  });

  test("refuses the new fight rather than dropping a pinned one", () => {
    const held = [composeBareFight("2", true), composeBareFight("1", true)];
    const kept = composeKeptFightsAfterKeeping(held, composeBareFight("3"), 2);
    expect(kept.fights).toBe(held);
    expect(kept.dropped).toEqual([]);
    expect(kept.isRefused).toBe(true);
  });

  test("keeps a fight already held once, under its newest form", () => {
    const kept = composeKeptFightsAfterKeeping(
      [composeBareFight("1", true), composeBareFight("2")],
      { ...composeBareFight("1"), lostMessages: 4 },
      5,
    );
    expect(kept.fights.map((fight) => fight.id)).toEqual(["1", "2"]);
    expect(kept.fights[0]?.lostMessages).toBe(4);
  });

  /** Zero is the boundary, and a limit of zero is a reader who wants none kept (§7.5). */
  test("keeps nothing new at a limit of zero", () => {
    const kept = composeKeptFightsAfterKeeping([], composeBareFight("2"), 0);
    expect(kept.fights).toEqual([]);
    expect(kept.dropped).toEqual([]);
    expect(kept.isRefused).toBe(true);
  });

  /**
   * The other side of that boundary, and the one that used to answer differently
   * from every limit above it: zero had a branch that emptied the list, pins and
   * all, while trimming to zero kept them and keeping at one kept them.
   */
  test("still refuses rather than dropping a pinned one at a limit of zero", () => {
    const held = [composeBareFight("1", true)];
    const kept = composeKeptFightsAfterKeeping(held, composeBareFight("2"), 0);
    expect(kept.fights).toBe(held);
    expect(kept.dropped).toEqual([]);
    expect(kept.isRefused).toBe(true);
  });

  /** The two rotations, put to the same list at the same limit, on the pin. */
  test("agrees with trimming about a pin at a limit of zero", () => {
    const held = [composeBareFight("1", true)];
    expect(composeKeptFightsAfterKeeping(held, composeBareFight("2"), 0).fights).toEqual(
      composeKeptFightsWithinLimit(held, 0).fights,
    );
  });

  test("keeps exactly one at a limit of one", () => {
    const kept = composeKeptFightsAfterKeeping([composeBareFight("1")], composeBareFight("2"), 1);
    expect(kept.fights.map((fight) => fight.id)).toEqual(["2"]);
  });

  test("refuses a limit that is not a whole number of fights", () => {
    expect(() => composeKeptFightsAfterKeeping([], composeBareFight("1"), -1)).toThrow();
    expect(() => composeKeptFightsAfterKeeping([], composeBareFight("1"), 1.5)).toThrow();
  });
});

describe("trimming to a smaller limit", () => {
  /**
   * The difference from keeping: nothing is arriving, so the newest has no more
   * claim than the rest beyond being newest.
   */
  test("drops the oldest unpinned until the list fits", () => {
    const trimmed = composeKeptFightsWithinLimit(
      [composeBareFight("3"), composeBareFight("2"), composeBareFight("1")],
      1,
    );
    expect(trimmed.fights.map((fight) => fight.id)).toEqual(["3"]);
    expect(trimmed.dropped).toEqual(["1", "2"]);
    expect(trimmed.isRefused).toBe(false);
  });

  test("stops where only pinned fights are left, and says so", () => {
    const trimmed = composeKeptFightsWithinLimit(
      [composeBareFight("3", true), composeBareFight("2"), composeBareFight("1", true)],
      1,
    );
    expect(trimmed.fights.map((fight) => fight.id)).toEqual(["3", "1"]);
    expect(trimmed.dropped).toEqual(["2"]);
    expect(trimmed.isRefused).toBe(true);
  });

  test("hands back the same list where nothing has to go", () => {
    const held = [composeBareFight("1")];
    expect(composeKeptFightsWithinLimit(held, 5).fights).toBe(held);
  });

  /** Identity is the signal, and the refusing path had been handing back a copy. */
  test("hands back the same list where every fight is pinned", () => {
    const held = [composeBareFight("2", true), composeBareFight("1", true)];
    const trimmed = composeKeptFightsWithinLimit(held, 1);
    expect(trimmed.fights).toBe(held);
    expect(trimmed.dropped).toEqual([]);
    expect(trimmed.isRefused).toBe(true);
  });

  test("refuses a limit that is not a whole number of fights", () => {
    expect(() => composeKeptFightsWithinLimit([], -1)).toThrow();
  });
});

describe("pinning and removing", () => {
  test("pins one and leaves the rest", () => {
    const pinned = composeKeptFightsAfterPin(
      [composeBareFight("1"), composeBareFight("2")],
      "2",
      true,
    );
    expect(pinned.map((fight) => fight.isPinned)).toEqual([false, true]);
  });

  /** Identity is what tells a caller nothing moved, the way the session's does. */
  test("hands back the same list where nothing changes", () => {
    const held = [composeBareFight("1", true)];
    expect(composeKeptFightsAfterPin(held, "1", true)).toBe(held);
    expect(composeKeptFightsAfterPin(held, "nobody", true)).toBe(held);
    expect(composeKeptFightsAfterRemoval(held, "nobody")).toBe(held);
  });

  test("removes one by id", () => {
    const held = [composeBareFight("1"), composeBareFight("2")];
    expect(composeKeptFightsAfterRemoval(held, "1").map((fight) => fight.id)).toEqual(["2"]);
  });
});

describe("a fight kept and read back", () => {
  const kept = composeKeptFightOfCapture(GROUP_FIGHT, "one");

  test("reads back as the fight that was kept", () => {
    const read = getKeptFightsFromStoredText(composeStoredTextFromKeptFights([kept]));
    expect(read).toHaveLength(1);
    expect(read[0]).toEqual(kept);
  });

  /**
   * The claim the whole shape exists for: what the panel is handed after a
   * restore is what it was handed live. Compared through the aggregate rather
   * than through the tape, because agreeing about the tape is agreeing about a
   * copy — these are the numbers a reader would see.
   */
  test("folds to the same figures as the fight it was kept from", () => {
    const live = composeSessionOfCapture(GROUP_FIGHT);
    const restored = composeSessionFromKeptFight(
      getKeptFightsFromStoredText(composeStoredTextFromKeptFights([kept]))[0]!,
    );

    const compose = (session: BattleSession) =>
      composeFightStatistics(
        session.events,
        composeBattleRoster(session.combatants, session.ourSide).roster,
        session.entryHealthByCombatantId,
      );

    expect(compose(restored)).toEqual(compose(live));
    expect(restored.messages).toEqual(live.messages);
    expect(restored.isFromFightStart).toBe(live.isFromFightStart);
    expect(restored.ourSide).toBe(live.ourSide);
  });

  test("carries what never reached the decoder, so a restored fight is no cleaner", () => {
    const gapped: KeptFight = {
      ...kept,
      unreadablePayloadsByFault: new Map([["messages-lost", 2]]),
      lostMessages: 7,
      unreadableCombatants: 1,
    };
    const read = getKeptFightsFromStoredText(composeStoredTextFromKeptFights([gapped]))[0]!;
    expect(read.unreadablePayloadsByFault.get("messages-lost")).toBe(2);
    expect(read.lostMessages).toBe(7);
    expect(read.unreadableCombatants).toBe(1);
    expect(composeSessionFromKeptFight(read).lostMessages).toBe(7);
  });

  test("keeps the outcome the protocol stated", () => {
    expect(kept.outcome).not.toBeNull();
    const read = getKeptFightsFromStoredText(composeStoredTextFromKeptFights([kept]))[0]!;
    expect(read.outcome).toEqual(kept.outcome);
  });

  test("every recording held survives the round trip", () => {
    for (const fight of CAPTURED_FIGHTS) {
      const one = composeKeptFightOfCapture(fight, fight.name);
      const read = getKeptFightsFromStoredText(composeStoredTextFromKeptFights([one]));
      expect(read, fight.name).toHaveLength(1);
      expect(read[0], fight.name).toEqual(one);
    }
  });
});

describe("what a store hands back is not trusted", () => {
  const kept = composeKeptFightOfCapture(GROUP_FIGHT, "one");
  const text = composeStoredTextFromKeptFights([kept]);

  test("reads nothing out of text that is not JSON", () => {
    expect(getKeptFightsFromStoredText("")).toEqual([]);
    expect(getKeptFightsFromStoredText("{")).toEqual([]);
    expect(getKeptFightsFromStoredText(text.slice(0, text.length - 40))).toEqual([]);
  });

  test("reads nothing out of a shape that is not ours", () => {
    expect(getKeptFightsFromStoredText("[]")).toEqual([]);
    expect(getKeptFightsFromStoredText("null")).toEqual([]);
    expect(getKeptFightsFromStoredText('"fights"')).toEqual([]);
    expect(getKeptFightsFromStoredText('{"fights":[]}')).toEqual([]);
    expect(getKeptFightsFromStoredText(`{"format":${KEPT_FIGHTS_FORMAT}}`)).toEqual([]);
  });

  test("reads nothing written under another format number", () => {
    expect(
      getKeptFightsFromStoredText(text.replace(`"format":${KEPT_FIGHTS_FORMAT}`, '"format":999')),
    ).toEqual([]);
  });

  /**
   * One field at a time, on a fight that otherwise reads — so what is proved is
   * that the field is checked, not that the whole thing is refused for some other
   * reason. Written by editing the parsed value rather than the text: a search
   * and replace over 44 kB of protocol would find the field name inside a message
   * (§7.5 — extract structure with structure).
   */
  const brokenFields: Array<[string, unknown]> = [
    ["id", 3],
    ["id", ""],
    ["keptAt", null],
    ["isPinned", "yes"],
    ["isFromFightStart", 1],
    ["messages", "one;two"],
    ["messages", [1, 2]],
    ["combatants", {}],
    ["ourSide", "1"],
    ["outcome", 4],
    ["outcome", { wonNames: [], lostNames: [] }],
    ["entryHealthByCombatantId", {}],
    ["entryHealthByCombatantId", [[1]]],
    ["entryHealthByCombatantId", [["one", 2]]],
    ["unreadablePayloadsByFault", [["messages-vanished", 1]]],
    ["unreadablePayloadsByFault", [["messages-lost", -1]]],
    ["lostMessages", 1.5],
    ["lostMessages", -1],
    ["unreadableCombatants", null],
  ];

  test.each(brokenFields)("drops a fight whose %s reads as %p", (field, value) => {
    const held = getRecordFromValue(getValueFromJsonText(text).value)!;
    const fights = held["fights"] as Array<Record<string, unknown>>;
    expect(getKeptFightsFromStoredText(composeJsonText({ ...held, fights: [{ ...fights[0]!, [field]: value }] }))).toEqual([]);
  });

  /** A combatant the game said little about is not a fight that will not read. */
  test("keeps a combatant whose level, profession and pool the game never stated", () => {
    const held = getRecordFromValue(getValueFromJsonText(text).value)!;
    const fights = held["fights"] as Array<Record<string, unknown>>;
    const withHoles = {
      ...fights[0]!,
      combatants: [{ id: 7, name: "x", side: 1, profession: null, level: null, maximumHealth: null }],
    };
    const read = getKeptFightsFromStoredText(composeJsonText({ ...held, fights: [withHoles] }));
    expect(read[0]?.combatants).toEqual([
      { id: 7, name: "x", side: 1, profession: null, level: null, maximumHealth: null },
    ]);
  });

  test("drops only the fight that will not read", () => {
    const two = composeStoredTextFromKeptFights([kept, { ...kept, id: "two" }]);
    const held = getRecordFromValue(getValueFromJsonText(two).value)!;
    const fights = held["fights"] as Array<Record<string, unknown>>;
    const read = getKeptFightsFromStoredText(
      composeJsonText({ ...held, fights: [{ ...fights[0]!, id: 3 }, fights[1]!] }),
    );
    expect(read.map((fight) => fight.id)).toEqual(["two"]);
  });
});

describe("writing what fits", () => {
  const kept = composeKeptFightOfCapture(GROUP_FIGHT, "one");
  const three = [
    { ...kept, id: "3" },
    { ...kept, id: "2" },
    { ...kept, id: "1" },
  ];

  function composeWriter(takes: (text: string) => boolean) {
    const written: string[] = [];
    return {
      written,
      write: (text: string) => {
        if (!takes(text)) return false;
        written.push(text);
        return true;
      },
    };
  }

  test("writes all of them where they fit", () => {
    const writer = composeWriter(() => true);
    const done = setKeptFightsThatFit(three, 10_000_000, writer.write);
    expect(done.fights).toBe(three);
    expect(done.dropped).toEqual([]);
    expect(done.isRefused).toBe(false);
    expect(writer.written).toHaveLength(1);
  });

  test("gives up the oldest until the budget is met", () => {
    const one = composeStoredTextFromKeptFights(three.slice(0, 1)).length;
    const writer = composeWriter(() => true);
    const done = setKeptFightsThatFit(three, one + 40, writer.write);
    expect(done.fights.map((fight) => fight.id)).toEqual(["3"]);
    expect(done.dropped).toEqual(["1", "2"]);
    expect(done.isRefused).toBe(false);
  });

  /** The browser's ceiling, which is never predicted — the write is the measurement. */
  test("gives up the oldest until the store stops refusing", () => {
    const two = composeStoredTextFromKeptFights(three.slice(0, 2)).length;
    const writer = composeWriter((text) => text.length < two);
    const done = setKeptFightsThatFit(three, 10_000_000, writer.write);
    expect(done.fights.map((fight) => fight.id)).toEqual(["3"]);
    expect(done.dropped).toEqual(["1", "2"]);
    expect(writer.written).toHaveLength(1);
  });

  /**
   * The one behaviour that would make a pin worthless, refused: nothing somebody
   * pinned is given up to keep something they said nothing about.
   */
  test("refuses rather than giving up a pinned fight", () => {
    const pinned = three.map((fight) => ({ ...fight, isPinned: true }));
    const writer = composeWriter(() => false);
    const done = setKeptFightsThatFit(pinned, 10_000_000, writer.write);
    expect(done.fights).toBe(pinned);
    expect(done.dropped).toEqual([]);
    expect(done.isRefused).toBe(true);
    expect(writer.written).toEqual([]);
  });

  /** A browser that will not take a write at all, rather than one that is full. */
  test("refuses where an empty list is still refused", () => {
    const writer = composeWriter(() => false);
    const done = setKeptFightsThatFit(three, 10_000_000, writer.write);
    expect(done.isRefused).toBe(true);
    expect(done.fights).toBe(three);
    expect(writer.written).toEqual([]);
  });

  test("leaves nothing half-written: the only write that happened is the one it kept", () => {
    const two = composeStoredTextFromKeptFights(three.slice(0, 2)).length;
    const writer = composeWriter((text) => text.length < two);
    const done = setKeptFightsThatFit(three, 10_000_000, writer.write);
    expect(writer.written).toEqual([composeStoredTextFromKeptFights(done.fights)]);
  });

  test("refuses a budget that is not a whole number of characters", () => {
    expect(() => setKeptFightsThatFit(three, -1, () => true)).toThrow();
    expect(() => setKeptFightsThatFit(three, 1.5, () => true)).toThrow();
  });
});
